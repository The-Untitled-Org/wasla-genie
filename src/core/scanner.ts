import { AssetType, DiscoveredFile, Conflict } from '../core/types.js';
import { fileExists, isDirectory, readJSON } from '../utils/fs.js';
import { join, relative, sep } from 'path';
import { getToolMarkers, getRegistryPath } from '../utils/paths.js';
import { stat, readdir } from 'fs/promises';
import { getAdapter } from '../adapters/factory.js';

interface Registry {
  assets: Array<{
    id: string;
    name: string;
    type: AssetType;
    stubs: Array<{
      tool: string;
      path: string;
    }>;
  }>;
}

export class Scanner {
  private scope: 'user' | 'workspace';
  private stubPaths: Set<string> = new Set();
  private stubTypes: Map<string, Set<AssetType>> = new Map();

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    this.scope = scope;
  }

  async initialize(): Promise<void> {
    // Load registry to know which files are stubs
    try {
      const registryPath = getRegistryPath(this.scope);
      const registry = await readJSON<Registry>(registryPath);

      for (const asset of registry.assets) {
        for (const stub of asset.stubs) {
          this.stubPaths.add(stub.path);
          const types = this.stubTypes.get(stub.path) || new Set<AssetType>();
          types.add(asset.type);
          this.stubTypes.set(stub.path, types);
        }
      }
    } catch {
      // If no registry exists yet, that's fine - no stubs known yet
    }
  }

  async detectInstalledTools(): Promise<string[]> {
    const markers = getToolMarkers(this.scope);
    const installed: string[] = [];

    for (const toolName of Object.keys(markers)) {
      const adapter = getAdapter(toolName, this.scope);
      if (await adapter.isInstalled()) {
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

    const adapter = getAdapter(toolName, this.scope);
    const discovered: DiscoveredFile[] = [];

    for (const type of assetTypes) {
      const typePathRecord = adapter.paths as Record<AssetType, string | undefined>;
      const typePath = typePathRecord[type];

      if (type === 'context') {
        let sourcePath = typePath;
        if (sourcePath && !(await fileExists(sourcePath)) && this.scope === 'workspace') {
          const legacyPath = join(toolPath, adapter.contextFile);
          if (await fileExists(legacyPath)) {
            sourcePath = legacyPath;
          }
        }

        if (!sourcePath || !(await fileExists(sourcePath))) {
          continue;
        }

        const stats = await stat(sourcePath);
        discovered.push({
          path: sourcePath,
          relativePath: adapter.contextFile,
          isStub: this.stubPaths.has(sourcePath),
          tool: toolName,
          type,
          name: 'context',
          modifiedAt: stats.mtimeMs,
        });
        continue;
      }

      if (type === 'mcp' && typePath?.endsWith('.json') && (await fileExists(typePath))) {
        const config = await readJSON<Record<string, unknown>>(typePath);
        const servers = this.readNestedRecord(config, adapter.mcpKey);
        const stats = await stat(typePath);

        for (const [name, server] of Object.entries(servers)) {
          discovered.push({
            path: typePath,
            relativePath: `${name}.json`,
            isStub: this.stubPaths.has(typePath),
            tool: toolName,
            type,
            name,
            modifiedAt: stats.mtimeMs,
            content: JSON.stringify(
              adapter.mcpFromNative(server as Record<string, unknown>),
              null,
              2
            ),
          });
        }
        continue;
      }

      if (!typePath || !(await isDirectory(typePath))) {
        if (process.env.DEBUG_SCANNER) {
          console.log(
            `[Scanner] Skipping ${type} for ${toolName}: typePath=${typePath}, isDir=${typePath ? await isDirectory(typePath) : 'N/A'}`
          );
        }
        continue;
      }

      // Recursively find all files in the directory tree
      const files = await this.recursivelyFindFiles(typePath);
      if (process.env.DEBUG_SCANNER) {
        console.log(`[Scanner] Found ${files.length} files for ${type} at ${typePath}`);
      }

      for (const filePath of files) {
        const isStub = this.stubPaths.has(filePath);
        const trackedTypes = this.stubTypes.get(filePath);
        if (isStub && trackedTypes && !trackedTypes.has(type)) {
          continue;
        }

        // Compute relative path from typePath
        const relativePath = relative(typePath, filePath);
        const name = this.extractAssetName(relativePath);

        if (process.env.DEBUG_SCANNER) {
          console.log(
            `[Scanner] Processing: path=${filePath}, rel=${relativePath}, name=${name}, isStub=${isStub}`
          );
        }

        if (name.toLowerCase() === 'waslagenie') {
          if (process.env.DEBUG_SCANNER) {
            console.log(`[Scanner] Skipping waslagenie asset`);
          }
          continue;
        }

        const stats = await stat(filePath);

        discovered.push({
          path: filePath,
          relativePath,
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

  private async recursivelyFindFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively search subdirectories
          const subFiles = await this.recursivelyFindFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Include all files
          files.push(fullPath);
        }
      }
    } catch {
      // If directory doesn't exist or can't be read, return empty
      return [];
    }

    return files;
  }

  async scanAllTools(
    assetTypes: AssetType[] = ['agent', 'skill', 'mcp', 'context']
  ): Promise<DiscoveredFile[]> {
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

  private extractAssetName(relativePathOrFileName: string): string {
    // For nested paths: waslagenie/SKILL.md -> waslagenie
    // For flat files: researcher.md -> researcher
    const parts = relativePathOrFileName.split(sep);
    if (parts.length > 1) {
      // Nested: return first directory
      return parts[0];
    }
    // Flat: remove extension
    return parts[0].split('.')[0];
  }

  private readNestedRecord(
    config: Record<string, unknown>,
    keyPath: string
  ): Record<string, unknown> {
    let value: unknown = config;
    for (const key of keyPath.split('.')) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
      }
      value = (value as Record<string, unknown>)[key];
    }
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
