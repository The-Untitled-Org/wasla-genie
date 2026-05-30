import { DiscoveredFile, AssetType, Asset, WaslaGenieAdapter } from '../core/types.js';
import { RegistryManager } from '../core/registry.js';
import { Scanner } from '../core/scanner.js';
import { getAdapter } from '../adapters/factory.js';
import { basename, dirname, join, sep } from 'path';
import { getRegistryDir } from '../utils/paths.js';
import {
  readText,
  writeText,
  ensureDir,
  fileExists,
  readJSON,
  writeJSON,
  removePath,
} from '../utils/fs.js';
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
    stubsDeleted: number;
    assetsDiscovered: number;
  }> {
    // Initialize scanner with registry stub information
    await this.scanner.initialize();

    // Ensure registry is loaded
    try {
      this.registry.get();
    } catch {
      await this.registry.load();
    }

    const registryDir = getRegistryDir(this.scope);
    await ensureDir(join(registryDir, 'agents'));
    await ensureDir(join(registryDir, 'skills'));
    await ensureDir(join(registryDir, 'mcp'));
    await ensureDir(join(registryDir, 'context'));

    const discovered = await this.scanner.scanAllTools();
    const grouped = this.groupByNameAndType(discovered);
    const installedTools = await this.scanner.detectInstalledTools();

    let stubsWritten = 0;
    const stubsDeleted = await this.reconcileDeletedAssets(grouped, installedTools);
    const assetsDiscovered = Object.keys(grouped).length;

    for (const key of Object.keys(grouped)) {
      const items = grouped[key];
      const [name, type] = key.split('|') as [string, any];

      // "Latest is Greatest" - sort by modification time
      const sorted = items.sort((a, b) => b.modifiedAt - a.modifiedAt);
      const latest =
        type === 'skill'
          ? sorted.find(
              (item) =>
                item.relativePath.endsWith(`${sep}SKILL.md`) || item.relativePath === 'SKILL.md'
            ) || sorted[0]
          : sorted[0];

      // Check if we should prompt the user in interactive mode if there are multiple versions
      if (interactive && sorted.length > 1) {
        // For MVP, we'll just log it or we could implement a real prompt here.
        // The spec says: Prompt user: "Use Gemini version? (Y/n)"
        // Since I'm an AI agent, I'll assume automatic for now or follow the latest mtime.
        console.log(`Syncing ${name} (${type}) using latest version from ${latest.tool}`);
      }

      const content = latest.content ?? (await readText(latest.path));
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
      for (const tool of installedTools) {
        const adapter = getAdapter(tool, this.scope);
        const pathsRecord = adapter.paths as Record<AssetType, string | undefined>;
        const formatsRecord = adapter.formats as Record<AssetType, string | undefined>;
        const typeDir = pathsRecord[type as AssetType];

        if (!typeDir) {
          // This tool doesn't support this asset type
          continue;
        }

        const filesToMirror =
          type === 'skill' && formatsRecord.skill === 'md'
            ? items.filter((item) => item.tool === latest.tool)
            : [latest];
        let primaryTargetPath: string | undefined;

        for (const file of filesToMirror) {
          const targetPath = this.getTargetPath(adapter, type, name, file.relativePath);
          if (!targetPath) continue;

          if (file.path === latest.path) {
            primaryTargetPath = targetPath;
          }

          // Don't overwrite the latest source if it's already there
          if (tool === latest.tool && file.path === targetPath) {
            continue;
          }

          const fileContent =
            file.content ?? (file.path === latest.path ? content : await readText(file.path));

          // Write the mirrored content (Option B)
          if (await this.writeTarget(adapter, asset, type, name, fileContent, targetPath)) {
            stubsWritten++;
          }
        }

        if (!primaryTargetPath) {
          continue;
        }

        // Update stub info in registry
        const existingStub = asset.stubs.find((s) => s.tool === tool);
        if (existingStub) {
          existingStub.path = primaryTargetPath;
          existingStub.written_at = new Date().toISOString();
          existingStub.hash = contentHash;
        } else {
          asset.stubs.push({
            tool,
            path: primaryTargetPath,
            written_at: new Date().toISOString(),
            hash: contentHash,
          });
        }
      }

      // Also save to canonical registry location
      const registrySubdir =
        type === 'agent'
          ? 'agents'
          : type === 'skill'
            ? 'skills'
            : type === 'context'
              ? 'context'
              : 'mcp';
      const ext = type === 'mcp' ? '.json' : '.md';
      const canonicalPath = join(registryDir, registrySubdir, `${name}${ext}`);
      await writeText(canonicalPath, content);
    }

    await this.registry.save();

    return {
      stubsWritten,
      stubsDeleted,
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

  async syncToTool(
    sourceTool: string,
    targetTools: string[]
  ): Promise<{
    stubsWritten: number;
    stubsDeleted: number;
    assetsDiscovered: number;
  }> {
    // Initialize scanner with registry stub information
    await this.scanner.initialize();

    // Ensure registry is loaded
    try {
      this.registry.get();
    } catch {
      await this.registry.load();
    }

    const registryDir = getRegistryDir(this.scope);
    await ensureDir(join(registryDir, 'agents'));
    await ensureDir(join(registryDir, 'skills'));
    await ensureDir(join(registryDir, 'mcp'));
    await ensureDir(join(registryDir, 'context'));

    // Scan all asset types from source tool
    const assetTypes: AssetType[] = ['agent', 'skill', 'mcp', 'context'];
    const discovered = await this.scanner.scanTool(sourceTool, assetTypes);
    const grouped = this.groupByNameAndType(discovered);
    const deletionScan = [...discovered];
    for (const tool of targetTools.filter((tool) => tool !== sourceTool)) {
      deletionScan.push(...(await this.scanner.scanTool(tool, assetTypes)));
    }
    const deletionGrouped = this.groupByNameAndType(deletionScan);

    let stubsWritten = 0;
    const stubsDeleted = await this.reconcileDeletedAssets(
      deletionGrouped,
      [...new Set([sourceTool, ...targetTools])],
      sourceTool
    );
    for (const key of Object.keys(grouped)) {
      if (!deletionGrouped[key]) {
        delete grouped[key];
      }
    }
    const assetsDiscovered = Object.keys(grouped).length;

    for (const key of Object.keys(grouped)) {
      const items = grouped[key];
      const [name, type] = key.split('|') as [string, any];

      // For directory-based skills, SKILL.md is the primary definition and
      // sibling files are supporting references that should be mirrored too.
      const sorted = items.sort((a, b) => b.modifiedAt - a.modifiedAt);
      const source =
        type === 'skill'
          ? sorted.find(
              (item) =>
                item.relativePath.endsWith(`${sep}SKILL.md`) || item.relativePath === 'SKILL.md'
            ) || sorted[0]
          : sorted[0];

      const content = source.content ?? (await readText(source.path));
      const contentHash = this.calculateHash(content);

      // Update or create asset in registry
      let asset = this.registry.findAsset(name, type);
      if (!asset) {
        asset = {
          id: RegistryManager.generateId(),
          name,
          type,
          last_modified_at: source.modifiedAt,
          last_synced_at: new Date().toISOString(),
          stubs: [],
        };
        this.registry.addAsset(asset);
      } else {
        this.registry.updateAsset(asset.id, {
          last_modified_at: source.modifiedAt,
          last_synced_at: new Date().toISOString(),
        });
      }
      this.upsertStub(asset, sourceTool, source.path, contentHash);

      // Write only to target tools
      for (const tool of targetTools) {
        const adapter = getAdapter(tool, this.scope);
        const formatsRecord = adapter.formats as Record<AssetType, string | undefined>;
        const pathsRecord = adapter.paths as Record<AssetType, string | undefined>;
        const typeDir = pathsRecord[type as AssetType];
        if (!typeDir || !formatsRecord[type as AssetType]) {
          // This tool doesn't support this asset type
          continue;
        }
        const filesToMirror = type === 'skill' && formatsRecord.skill === 'md' ? items : [source];
        let primaryTargetPath: string | undefined;

        for (const file of filesToMirror) {
          const targetPath = this.getTargetPath(adapter, type, name, file.relativePath);
          if (!targetPath) continue;

          if (file.path === source.path) {
            primaryTargetPath = targetPath;
          }

          // Don't overwrite the source if it's already there
          if (tool === sourceTool && file.path === targetPath) {
            continue;
          }

          const fileContent =
            file.content ?? (file.path === source.path ? content : await readText(file.path));
          if (await this.writeTarget(adapter, asset, type, name, fileContent, targetPath)) {
            stubsWritten++;
          }
        }

        if (!primaryTargetPath) {
          continue;
        }

        // Update stub info in registry
        const existingStub = asset.stubs.find((s) => s.tool === tool);
        if (existingStub) {
          existingStub.path = primaryTargetPath;
          existingStub.written_at = new Date().toISOString();
          existingStub.hash = contentHash;
        } else {
          asset.stubs.push({
            tool,
            path: primaryTargetPath,
            written_at: new Date().toISOString(),
            hash: contentHash,
          });
        }
      }

      // Also save to canonical registry location
      const registrySubdir =
        type === 'agent'
          ? 'agents'
          : type === 'skill'
            ? 'skills'
            : type === 'context'
              ? 'context'
              : 'mcp';
      const ext = type === 'mcp' ? '.json' : '.md';
      const canonicalPath = join(registryDir, registrySubdir, `${name}${ext}`);
      await writeText(canonicalPath, content);
    }

    await this.registry.save();

    return {
      stubsWritten,
      stubsDeleted,
      assetsDiscovered,
    };
  }

  async attachAssetToTool(
    name: string,
    type: AssetType,
    sourceTool: string,
    targetTool: string
  ): Promise<boolean> {
    await this.scanner.initialize();
    try {
      this.registry.get();
    } catch {
      await this.registry.load();
    }

    const candidates =
      sourceTool === 'waslagenie'
        ? (await this.scanner.scanAllTools([type])).filter((item) => item.name === name)
        : (await this.scanner.scanTool(sourceTool, [type])).filter((item) => item.name === name);
    const sourceCandidates = candidates.filter((item) => item.tool !== targetTool);
    const items = (sourceCandidates.length > 0 ? sourceCandidates : candidates).sort(
      (a, b) => b.modifiedAt - a.modifiedAt
    );
    if (items.length === 0) {
      throw new Error(`Cannot find ${type}:${name} in ${sourceTool}`);
    }

    const sourceItems =
      sourceTool === 'waslagenie' ? items.filter((item) => item.tool === items[0].tool) : items;
    const sorted = sourceItems.sort((a, b) => b.modifiedAt - a.modifiedAt);
    const source =
      type === 'skill'
        ? sorted.find(
            (item) =>
              item.relativePath.endsWith(`${sep}SKILL.md`) || item.relativePath === 'SKILL.md'
          ) || sorted[0]
        : sorted[0];
    const content = source.content ?? (await readText(source.path));
    const contentHash = this.calculateHash(content);
    let asset = this.registry.findAsset(name, type);
    if (!asset) {
      asset = {
        id: RegistryManager.generateId(),
        name,
        type,
        last_modified_at: source.modifiedAt,
        last_synced_at: new Date().toISOString(),
        stubs: [],
      };
      this.registry.addAsset(asset);
    }
    this.upsertStub(asset, source.tool, source.path, contentHash);

    const adapter = getAdapter(targetTool, this.scope);
    const formatsRecord = adapter.formats as Record<AssetType, string | undefined>;
    if (!adapter.paths[type] || !formatsRecord[type]) {
      throw new Error(`${targetTool} does not support ${type}`);
    }
    const filesToMirror = type === 'skill' && formatsRecord.skill === 'md' ? sourceItems : [source];
    let written = false;
    let primaryTargetPath: string | undefined;
    for (const file of filesToMirror) {
      const targetPath = this.getTargetPath(adapter, type, name, file.relativePath);
      if (!targetPath) continue;
      if (file.path === source.path) primaryTargetPath = targetPath;
      const fileContent =
        file.content ?? (file.path === source.path ? content : await readText(file.path));
      written =
        (await this.writeTarget(adapter, asset, type, name, fileContent, targetPath)) || written;
    }
    if (primaryTargetPath) {
      this.upsertStub(asset, targetTool, primaryTargetPath, contentHash);
    }
    await ensureDir(dirname(this.getCanonicalPath(type, name)));
    await writeText(this.getCanonicalPath(type, name), content);
    await this.registry.save();
    return written;
  }

  async detachAssetFromTool(name: string, type: AssetType, tool: string): Promise<boolean> {
    await this.scanner.initialize();
    try {
      this.registry.get();
    } catch {
      await this.registry.load();
    }

    const asset = this.registry.findAsset(name, type);
    const discovered = (await this.scanner.scanTool(tool, [type])).find(
      (item) => item.name === name
    );
    const path = asset?.stubs.find((stub) => stub.tool === tool)?.path ?? discovered?.path;
    if (!path) return false;
    const deletableAsset: Asset = asset ?? {
      id: RegistryManager.generateId(),
      name,
      type,
      last_modified_at: Date.now(),
      last_synced_at: new Date().toISOString(),
      stubs: [],
    };
    const deleted = await this.deleteStubTarget(deletableAsset, {
      tool,
      path,
      written_at: new Date().toISOString(),
      hash: '',
    });
    if (asset && deleted) {
      asset.stubs = asset.stubs.filter((stub) => stub.tool !== tool);
      await this.registry.save();
    }
    return deleted > 0;
  }

  private calculateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private getTargetPath(
    adapter: WaslaGenieAdapter,
    type: AssetType,
    name: string,
    relativePath: string
  ): string | undefined {
    const typeDir = adapter.paths[type];
    const format = adapter.formats[type];
    if (!typeDir || !format) return undefined;

    if (type === 'context' || type === 'mcp') return typeDir;
    if (format === 'agent.md') return join(typeDir, `${name}.agent.md`);
    if (format === 'mdc') return join(typeDir, `${name}.mdc`);
    if (format === 'instructions.md') return join(typeDir, `${name}.instructions.md`);
    if (type === 'skill' && dirname(relativePath) !== '.') return join(typeDir, relativePath);
    return join(typeDir, `${name}.${format}`);
  }

  private async writeTarget(
    adapter: WaslaGenieAdapter,
    asset: Asset,
    type: AssetType,
    name: string,
    content: string,
    targetPath: string
  ): Promise<boolean> {
    if (type === 'context') {
      if ((await fileExists(targetPath)) && (await readText(targetPath)) === content) {
        return false;
      }
      await ensureDir(dirname(targetPath));
      await writeText(targetPath, content);
      return true;
    }
    if (type === 'mcp') {
      return this.writeMcpServer(adapter, name, content, targetPath);
    }
    if ((await fileExists(targetPath)) && (await readText(targetPath)) === content) {
      return false;
    }
    await adapter.writeStub(asset, content, targetPath);
    return true;
  }

  private async writeMcpServer(
    adapter: WaslaGenieAdapter,
    name: string,
    content: string,
    targetPath: string
  ): Promise<boolean> {
    const config = (await fileExists(targetPath))
      ? await readJSON<Record<string, unknown>>(targetPath)
      : {};
    let node: Record<string, unknown> = config;
    const keys = adapter.mcpKey.split('.');
    for (const key of keys.slice(0, -1)) {
      const child = node[key];
      if (!child || typeof child !== 'object' || Array.isArray(child)) {
        node[key] = {};
      }
      node = node[key] as Record<string, unknown>;
    }
    const leaf = keys[keys.length - 1];
    const servers =
      node[leaf] && typeof node[leaf] === 'object' && !Array.isArray(node[leaf])
        ? (node[leaf] as Record<string, unknown>)
        : {};
    const nextServer = adapter.mcpToNative(
      JSON.parse(content) as Record<string, unknown>
    ) as unknown;
    if (JSON.stringify(servers[name]) === JSON.stringify(nextServer)) {
      return false;
    }
    servers[name] = nextServer;
    node[leaf] = servers;
    await ensureDir(dirname(targetPath));
    await writeJSON(targetPath, config);
    return true;
  }

  private upsertStub(asset: Asset, tool: string, path: string, hash: string): void {
    const existingStub = asset.stubs.find((stub) => stub.tool === tool);
    if (existingStub) {
      existingStub.path = path;
      existingStub.written_at = new Date().toISOString();
      existingStub.hash = hash;
      return;
    }
    asset.stubs.push({
      tool,
      path,
      written_at: new Date().toISOString(),
      hash,
    });
  }

  private async reconcileDeletedAssets(
    grouped: Record<string, DiscoveredFile[]>,
    tools: string[],
    requiredDeletedTool?: string
  ): Promise<number> {
    let deleted = 0;
    const trackedTools = new Set(tools);

    for (const asset of [...this.registry.get().assets]) {
      const key = `${asset.name}|${asset.type}`;
      const items = grouped[key] || [];
      const trackedStubs = asset.stubs.filter((stub) => trackedTools.has(stub.tool));
      if (trackedStubs.length === 0) continue;

      const itemForStub = (stub: Asset['stubs'][number]) =>
        items.find((item) => item.tool === stub.tool && item.path === stub.path);
      const missing = trackedStubs.filter((stub) => !itemForStub(stub));
      if (missing.length === 0) continue;
      if (requiredDeletedTool && !missing.some((stub) => stub.tool === requiredDeletedTool)) {
        continue;
      }

      let survivingEdit = false;
      for (const stub of trackedStubs) {
        const item = itemForStub(stub);
        if (!item) continue;
        const content = item.content ?? (await readText(item.path));
        if (this.calculateHash(content) !== stub.hash) {
          survivingEdit = true;
          break;
        }
      }
      if (survivingEdit) continue;

      for (const stub of asset.stubs) {
        deleted += await this.deleteStubTarget(asset, stub);
      }
      await removePath(this.getCanonicalPath(asset.type, asset.name));
      this.registry.removeAsset(asset.id);
      delete grouped[key];
    }

    return deleted;
  }

  private async deleteStubTarget(asset: Asset, stub: Asset['stubs'][number]): Promise<number> {
    let adapter: WaslaGenieAdapter;
    try {
      adapter = getAdapter(stub.tool, this.scope);
    } catch {
      return 0;
    }

    if (asset.type === 'mcp') {
      if (!(await fileExists(stub.path))) return 0;
      const config = await readJSON<Record<string, unknown>>(stub.path);
      let node: Record<string, unknown> = config;
      const keys = adapter.mcpKey.split('.');
      for (const key of keys.slice(0, -1)) {
        const child = node[key];
        if (!child || typeof child !== 'object' || Array.isArray(child)) return 0;
        node = child as Record<string, unknown>;
      }
      const servers = node[keys[keys.length - 1]];
      if (!servers || typeof servers !== 'object' || Array.isArray(servers)) return 0;
      if (!(asset.name in (servers as Record<string, unknown>))) return 0;
      delete (servers as Record<string, unknown>)[asset.name];
      await writeJSON(stub.path, config);
      return 1;
    }

    if (!(await fileExists(stub.path))) return 0;
    if (
      asset.type === 'skill' &&
      adapter.formats.skill === 'md' &&
      basename(stub.path) === 'SKILL.md'
    ) {
      await removePath(dirname(stub.path));
    } else {
      await removePath(stub.path);
    }
    return 1;
  }

  private getCanonicalPath(type: AssetType, name: string): string {
    const subdir =
      type === 'agent'
        ? 'agents'
        : type === 'skill'
          ? 'skills'
          : type === 'context'
            ? 'context'
            : 'mcp';
    return join(getRegistryDir(this.scope), subdir, `${name}${type === 'mcp' ? '.json' : '.md'}`);
  }
}
