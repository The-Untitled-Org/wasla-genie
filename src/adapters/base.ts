import { WaslGenieAdapter, Asset } from '../core/types.js';

export abstract class BaseAdapter implements WaslGenieAdapter {
  abstract name: string;
  abstract displayName: string;
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
