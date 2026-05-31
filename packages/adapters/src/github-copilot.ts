import { BaseAdapter } from './base.js';
import { Asset } from '#core/types.js';
import { fileExists, writeText, ensureDir } from '#shared/fs.js';
import { dirname, join } from 'path';
import { getToolMarkers } from '#shared/paths.js';

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
    const workspaceRoot = dirname(base);
    return {
      agent: join(workspaceRoot, '.github/agents'),
      skill: join(workspaceRoot, '.github/skills'),
      mcp: join(base, 'mcp.json'),
      context: join(workspaceRoot, '.github/copilot-instructions.md'),
    };
  }

  mcpKey = 'servers';
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
    const base = markers['github-copilot'];
    const workspaceRoot = dirname(base);
    return (
      (await fileExists(join(base, 'mcp.json'))) ||
      (await fileExists(join(workspaceRoot, '.github/copilot-instructions.md'))) ||
      (await fileExists(join(workspaceRoot, '.github/agents'))) ||
      (await fileExists(join(workspaceRoot, '.github/skills')))
    );
  }

  mcpFromNative(server: Record<string, unknown>): Record<string, unknown> {
    if (server.type === 'stdio') {
      const { type: _type, ...portable } = server;
      return portable;
    }
    if (server.type === 'http' || server.type === 'sse') {
      const { type: _type, ...portable } = server;
      return portable;
    }
    return server;
  }

  mcpToNative(server: Record<string, unknown>): Record<string, unknown> {
    if (typeof server.command === 'string') {
      return { type: 'stdio', ...server };
    }
    if (typeof server.url === 'string') {
      return { type: 'http', ...server };
    }
    return server;
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
