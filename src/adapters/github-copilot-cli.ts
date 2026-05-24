import { BaseAdapter } from './base.js';
import { Asset } from '../core/types.js';
import { fileExists, writeText, ensureDir } from '../utils/fs.js';
import { dirname, join } from 'path';
import { getToolMarkers } from '../utils/paths.js';

export class GithubCopilotCliAdapter extends BaseAdapter {
  name = 'github-copilot-cli';
  displayName = 'GitHub Copilot CLI';
  protected scope: 'user' | 'workspace';

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    super();
    this.scope = scope;
  }

  get paths() {
    const markers = getToolMarkers(this.scope);
    const base = markers['github-copilot-cli'];
    return {
      agent: join(base, 'agents'),
      skill: join(base, 'skills'),
      mcp: this.scope === 'user' ? join(base, 'mcp-config.json') : join(dirname(base), '.mcp.json'),
      context: join(base, 'copilot-instructions.md'),
    };
  }

  mcpKey = 'mcpServers';
  contextFile = '.github/copilot-instructions.md';

  get skillDirs() {
    return [this.paths.skill!];
  }

  formats = {
    agent: 'agent.md' as const,
    skill: 'md' as const,
    mcp: 'json' as const,
    context: 'md' as const,
  };

  async isInstalled(): Promise<boolean> {
    const markers = getToolMarkers(this.scope);
    const base = markers['github-copilot-cli'];
    return (
      (await fileExists(join(base, 'copilot-instructions.md'))) ||
      (await fileExists(join(base, 'agents'))) ||
      (await fileExists(join(base, 'skills'))) ||
      (this.scope === 'workspace' && (await fileExists(join(dirname(base), '.mcp.json')))) ||
      (this.scope === 'user' && (await fileExists(join(base, 'mcp-config.json'))))
    );
  }

  async writeStub(asset: Asset, content: string, targetPath: string): Promise<void> {
    if (asset.type === 'agent') {
      await this.writeAgentStub(targetPath, content);
    } else {
      await this.writeMcpStub(targetPath, content);
    }
  }

  private async writeAgentStub(targetPath: string, content: string): Promise<void> {
    await ensureDir(dirname(targetPath));
    await writeText(targetPath, content);
  }

  private async writeMcpStub(targetPath: string, content: string): Promise<void> {
    await ensureDir(dirname(targetPath));
    await writeText(targetPath, content);
  }

  async installSkill(): Promise<void> {
    // TBD
  }

  getRootConfigAppend(): string | null {
    return null;
  }
}
