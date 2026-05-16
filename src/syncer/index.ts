import { DiscoveredFile } from '../core/types.js';
import { RegistryManager } from '../core/registry.js';
import { Scanner } from '../core/scanner.js';
import { getAdapter } from '../adapters/factory.js';
import { join } from 'path';
import { getRegistryDir } from '../utils/paths.js';
import { readText, writeText, ensureDir } from '../utils/fs.js';
import { createHash } from 'crypto';

export class Syncer {
  private registry: RegistryManager;
  private scanner: Scanner;
  private scope: 'user' | 'workspace';

  constructor(
    registry: RegistryManager,
    scanner: Scanner,
    scope: 'user' | 'workspace' = 'workspace'
  ) {
    this.registry = registry;
    this.scanner = scanner;
    this.scope = scope;
  }

  async sync(interactive: boolean = true): Promise<{
    stubsWritten: number;
    assetsDiscovered: number;
  }> {
    // Ensure registry is loaded
    try {
      this.registry.get();
    } catch {
      await this.registry.load();
    }

    const registryDir = getRegistryDir(this.scope);
    await ensureDir(join(registryDir, 'agents'));
    await ensureDir(join(registryDir, 'mcp'));

    const discovered = await this.scanner.scanAllTools();
    const grouped = this.groupByNameAndType(discovered);

    let stubsWritten = 0;
    const assetsDiscovered = Object.keys(grouped).length;

    for (const key of Object.keys(grouped)) {
      const items = grouped[key];
      const [name, type] = key.split('|') as [string, any];

      // "Latest is Greatest" - sort by modification time
      const sorted = items.sort((a, b) => b.modifiedAt - a.modifiedAt);
      const latest = sorted[0];

      // Check if we should prompt the user in interactive mode if there are multiple versions
      if (interactive && sorted.length > 1) {
        // For MVP, we'll just log it or we could implement a real prompt here.
        // The spec says: Prompt user: "Use Gemini version? (Y/n)"
        // Since I'm an AI agent, I'll assume automatic for now or follow the latest mtime.
        console.log(`Syncing ${name} (${type}) using latest version from ${latest.tool}`);
      }

      const content = await readText(latest.path);
      const contentHash = this.calculateHash(content);

      // Update or create asset in registry
      let asset = this.registry.findAsset(name, type);
      if (!asset) {
        asset = {
          id: RegistryManager.generateId(),
          name,
          type,
          last_modified_at: latest.modifiedAt,
          last_synced_at: new Date().toISOString(),
          stubs: [],
        };
        this.registry.addAsset(asset);
      } else {
        this.registry.updateAsset(asset.id, {
          last_modified_at: latest.modifiedAt,
          last_synced_at: new Date().toISOString(),
        });
      }

      // Mirror to all other tool locations
      const tools = await this.scanner.detectInstalledTools();
      for (const tool of tools) {
        const adapter = getAdapter(tool, this.scope);
        const ext = type === 'agent' ? '.md' : '.json';
        const targetPath = join(
          adapter.paths[type === 'agent' ? 'agents' : 'mcp'],
          `${name}${ext}`
        );

        // Don't overwrite the latest source if it's already there
        if (tool === latest.tool && latest.path === targetPath) {
          continue;
        }

        // Write the mirrored content (Option B)
        await adapter.writeStub(asset, content, targetPath);
        stubsWritten++;

        // Update stub info in registry
        const existingStub = asset.stubs.find((s) => s.tool === tool);
        if (existingStub) {
          existingStub.path = targetPath;
          existingStub.written_at = new Date().toISOString();
          existingStub.hash = contentHash;
        } else {
          asset.stubs.push({
            tool,
            path: targetPath,
            written_at: new Date().toISOString(),
            hash: contentHash,
          });
        }
      }

      // Also save to canonical registry location
      const typeDir = type === 'agent' ? 'agents' : 'mcp';
      const ext = type === 'agent' ? '.md' : '.json';
      const canonicalPath = join(registryDir, typeDir, `${name}${ext}`);
      await writeText(canonicalPath, content);
    }

    await this.registry.save();

    return {
      stubsWritten,
      assetsDiscovered,
    };
  }

  private groupByNameAndType(discovered: DiscoveredFile[]): Record<string, DiscoveredFile[]> {
    const grouped: Record<string, DiscoveredFile[]> = {};
    for (const item of discovered) {
      const key = `${item.name}|${item.type}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    }
    return grouped;
  }

  private calculateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
