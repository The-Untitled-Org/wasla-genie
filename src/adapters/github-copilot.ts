import { BaseAdapter } from './base.js';
import { Asset } from '../core/types.js';
import { fileExists, writeText, ensureDir } from '../utils/fs.js';
import { join } from 'path';
import { getToolMarkers } from '../utils/paths.js';

export class GithubCopilotAdapter extends BaseAdapter {
  name = 'github-copilot';
  displayName = 'GitHub Copilot';
  protected scope: 'user' | 'workspace';

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    super();
    this.scope = scope;
  }

  get paths() {
    const markers = getToolMarkers(this.scope);
    const base = markers['github-copilot'];
    return {
      agents: join(base, '.github/instructions'),
      mcp: join(base, 'mcp'),
    };
  }

  mcpKey = 'servers';
  contextFile = '.github/copilot-instructions.md';

  get skillDirs() {
    return [this.paths.agents];
  }

  formats = {
    agents: 'md' as const,
    mcp: 'json' as const,
  };

  async isInstalled(): Promise<boolean> {
    const markers = getToolMarkers(this.scope);
    return fileExists(markers['github-copilot']);
  }

  async writeStub(asset: Asset, content: string, targetPath: string): Promise<void> {
    if (asset.type === 'agent') {
      await this.writeAgentStub(targetPath, content);
    } else {
      await this.writeMcpStub(targetPath, content);
    }
  }

  private async writeAgentStub(targetPath: string, content: string): Promise<void> {
    await ensureDir(this.paths.agents);
    const marked = `<!-- waslagenie-stub -->\n${content}`;
    await writeText(targetPath, marked);
  }

  private async writeMcpStub(targetPath: string, content: string): Promise<void> {
    await ensureDir(this.paths.mcp);
    const marked = `/* waslagenie-stub */\n${content}`;
    await writeText(targetPath, marked);
  }

  async installSkill(): Promise<void> {
    // TBD
  }

  getRootConfigAppend(): string | null {
    return null;
  }
}
