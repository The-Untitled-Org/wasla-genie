// Asset types
export type AssetType = 'agent' | 'skill' | 'mcp' | 'context';
export type AssetFormat = 'md' | 'yaml' | 'json' | 'mdc' | 'agent.md' | 'instructions.md';

export interface Asset {
  id: string; // UUID v4
  name: string;
  type: AssetType;
  last_modified_at: number; // Unix timestamp
  last_synced_at: string; // ISO 8601
  stubs: Stub[];
}

export interface Stub {
  tool: string;
  path: string;
  written_at: string; // ISO 8601
  hash: string; // To detect if mirrored content changed
}

export interface Conflict {
  asset_name: string;
  type: AssetType;
  versions: {
    tool: string;
    path: string;
    modified_at: number;
  }[];
  resolved_tool?: string;
}

export interface Registry {
  assets: Asset[];
  conflicts: Conflict[];
  config: {
    scope: 'user' | 'workspace';
    version: string;
  };
}

// Adapter interface
export interface WaslaGenieAdapter {
  name: string;
  displayName: string;

  paths: {
    agent?: string;
    skill?: string;
    mcp?: string;
    context?: string;
  };

  mcpKey: string;
  contextFile: string;
  skillDirs: string[];

  formats: {
    agent?: AssetFormat;
    skill?: AssetFormat;
    mcp?: AssetFormat;
    context?: AssetFormat;
  };

  isInstalled(): Promise<boolean>;
  mcpFromNative(server: Record<string, unknown>): Record<string, unknown>;
  mcpToNative(server: Record<string, unknown>): Record<string, unknown>;
  writeStub(asset: Asset, content: string, targetPath: string): Promise<void>;
  installSkill(): Promise<void>;
  getRootConfigAppend(): string | null;
}

// Scanner types
export interface DiscoveredFile {
  path: string; // Full absolute path
  relativePath: string; // Relative path within type dir (e.g., "waslagenie/SKILL.md" for skills)
  isStub: boolean;
  tool: string;
  type: AssetType;
  name: string; // Asset name extracted from relative path
  modifiedAt: number; // Unix timestamp in ms
  content?: string; // Pre-extracted content for assets embedded in structured config files
}

// CLI types
export interface SyncOptions {
  scope?: 'user' | 'workspace';
  interactive?: boolean;
}

export interface ConfigOptions {
  scope?: 'user' | 'workspace';
  show?: boolean;
}
