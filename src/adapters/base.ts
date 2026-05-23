import { WaslaGenieAdapter, Asset } from '../core/types.js';

export abstract class BaseAdapter implements WaslaGenieAdapter {
  abstract name: string;
  abstract displayName: string;
  abstract mcpKey: string;
  abstract contextFile: string;
  abstract skillDirs: string[];

  abstract paths: {
    agents: string;
    mcp: string;
  };
  abstract formats: {
    agents: 'md' | 'yaml' | 'json';
    mcp: 'md' | 'yaml' | 'json';
  };

  abstract isInstalled(): Promise<boolean>;
  abstract writeStub(asset: Asset, content: string, targetPath: string): Promise<void>;
  abstract installSkill(): Promise<void>;
  abstract getRootConfigAppend(): string | null;
}
