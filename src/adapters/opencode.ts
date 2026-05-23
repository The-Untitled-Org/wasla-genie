import { BaseAdapter } from './base.js';
import { Asset } from '../core/types.js';

export class OpenCodeAdapter extends BaseAdapter {
  name = 'opencode';
  displayName = 'OpenCode';
  protected scope: 'user' | 'workspace';

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    super();
    this.scope = scope;
  }

  get paths() {
    return { agents: this.scope === 'user' ? '' : '', mcp: '' };
  }

  mcpKey = '';
  contextFile = '';
  skillDirs = [];

  formats = {
    agents: 'json' as const,
    mcp: 'json' as const,
  };

  async isInstalled(): Promise<boolean> {
    return false;
  }

  async writeStub(_asset: Asset, _content: string, _targetPath: string): Promise<void> {
    // TBD
  }

  async installSkill(): Promise<void> {
    // TBD
  }

  getRootConfigAppend(): string | null {
    return null;
  }
}
