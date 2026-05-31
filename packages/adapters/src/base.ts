import { WaslaGenieAdapter, Asset, AssetFormat } from '#core/types.js';

export abstract class BaseAdapter implements WaslaGenieAdapter {
  abstract name: string;
  abstract displayName: string;
  abstract mcpKey: string;
  abstract contextFile: string;
  abstract skillDirs: string[];

  abstract paths: {
    agent?: string;
    skill?: string;
    mcp?: string;
    context?: string;
  };
  abstract formats: {
    agent?: AssetFormat;
    skill?: AssetFormat;
    mcp?: AssetFormat;
    context?: AssetFormat;
  };

  abstract isInstalled(): Promise<boolean>;

  mcpFromNative(server: Record<string, unknown>): Record<string, unknown> {
    return server;
  }

  mcpToNative(server: Record<string, unknown>): Record<string, unknown> {
    return server;
  }

  abstract writeStub(asset: Asset, content: string, targetPath: string): Promise<void>;
  abstract installSkill(): Promise<void>;
  abstract getRootConfigAppend(): string | null;
}
