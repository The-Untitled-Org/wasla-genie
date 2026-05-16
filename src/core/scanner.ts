import { AssetType, DiscoveredFile, Conflict } from '../core/types.js';
import { fileExists, isDirectory, readText, listFiles } from '../utils/fs.js';
import { join } from 'path';
import { getToolMarkers } from '../utils/paths.js';
import { stat } from 'fs/promises';

export class Scanner {
  private scope: 'user' | 'workspace';

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    this.scope = scope;
  }

  async detectInstalledTools(): Promise<string[]> {
    const markers = getToolMarkers(this.scope);
    const installed: string[] = [];

    for (const [toolName, toolPath] of Object.entries(markers)) {
      if (await fileExists(toolPath)) {
        installed.push(toolName);
      }
    }

    return installed;
  }

  async scanTool(toolName: string, assetTypes: AssetType[]): Promise<DiscoveredFile[]> {
    const markers = getToolMarkers(this.scope);
    const toolPath = markers[toolName];

    if (!toolPath) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const discovered: DiscoveredFile[] = [];

    for (const type of assetTypes) {
      const typePath = join(toolPath, type === 'agent' ? 'agents' : 'mcp');

      if (!(await isDirectory(typePath))) {
        continue;
      }

      const files = await listFiles(typePath);

      for (const file of files) {
        const filePath = join(typePath, file);
        const isStub = await this.isStubFile(filePath);
        const name = this.extractAssetName(file);
        const stats = await stat(filePath);

        discovered.push({
          path: filePath,
          isStub,
          tool: toolName,
          type,
          name,
          modifiedAt: stats.mtimeMs,
        });
      }
    }

    return discovered;
  }

  async scanAllTools(assetTypes: AssetType[] = ['agent', 'mcp']): Promise<DiscoveredFile[]> {
    const tools = await this.detectInstalledTools();
    const allDiscovered: DiscoveredFile[] = [];

    for (const tool of tools) {
      const discovered = await this.scanTool(tool, assetTypes);
      allDiscovered.push(...discovered);
    }

    return allDiscovered;
  }

  async detectConflicts(discovered: DiscoveredFile[]): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const grouped = this.groupByNameAndType(discovered);

    for (const key of Object.keys(grouped)) {
      const items = grouped[key];
      const originals = items.filter((item) => !item.isStub);

      // Only report conflict if we have 2+ originals (not counting stubs)
      if (originals.length > 1) {
        const [name, type] = key.split('|') as [string, AssetType];
        // Sort by modification time - latest first
        const sorted = originals.sort((a, b) => b.modifiedAt - a.modifiedAt);

        conflicts.push({
          asset_name: name,
          type,
          versions: sorted.map((o) => ({
            tool: o.tool,
            path: o.path,
            modified_at: o.modifiedAt,
          })),
        });
      }
    }

    return conflicts;
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

  private async isStubFile(filePath: string): Promise<boolean> {
    try {
      const content = await readText(filePath);
      return content.includes('waslagenie-stub') || content.includes('waslagenie:');
    } catch {
      return false;
    }
  }

  private extractAssetName(fileName: string): string {
    // Remove extension: researcher.md -> researcher
    return fileName.split('.')[0];
  }
}
