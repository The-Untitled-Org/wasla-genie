// Asset types
export type AssetType = 'agent' | 'mcp';

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
    agents: string;
    mcp: string;
  };

  mcpKey: string;
  contextFile: string;
  skillDirs: string[];

  formats: {
    agents: 'md' | 'yaml' | 'json';
    mcp: 'md' | 'yaml' | 'json';
  };

  isInstalled(): Promise<boolean>;
  writeStub(asset: Asset, content: string, targetPath: string): Promise<void>;
  installSkill(): Promise<void>;
  getRootConfigAppend(): string | null;
}

// Scanner types
export interface DiscoveredFile {
  path: string;
  isStub: boolean;
  tool: string;
  type: AssetType;
  name: string;
  modifiedAt: number; // Unix timestamp in ms
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
