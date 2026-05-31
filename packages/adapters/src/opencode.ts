import { BaseAdapter } from './base.js';
import { Asset } from '#core/types.js';
import { fileExists, writeText, ensureDir } from '#shared/fs.js';
import { dirname, join } from 'path';
import { getToolMarkers } from '#shared/paths.js';

export class OpenCodeAdapter extends BaseAdapter {
  name = 'opencode';
  displayName = 'OpenCode';
  protected scope: 'user' | 'workspace';

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    super();
    this.scope = scope;
  }

  get paths() {
    const markers = getToolMarkers(this.scope);
    const base = markers['opencode'];
    const configPath =
      this.scope === 'workspace'
        ? join(dirname(base), 'opencode.json')
        : join(base, 'opencode.json');
    return {
      agent: join(base, 'agents'),
      skill: join(base, 'skills'),
      mcp: configPath,
      context:
        this.scope === 'workspace' ? join(dirname(base), 'AGENTS.md') : join(base, 'AGENTS.md'),
    };
  }

  mcpKey = 'mcp';
  contextFile = 'AGENTS.md';

  get skillDirs() {
    return [this.paths.skill!];
  }

  formats = {
    agent: 'md' as const,
    skill: 'md' as const,
    mcp: 'json' as const,
    context: 'md' as const,
  };

  async isInstalled(): Promise<boolean> {
    const base = getToolMarkers(this.scope).opencode;
    return (
      (await fileExists(base)) ||
      (await fileExists(this.paths.mcp!)) ||
      (await fileExists(this.paths.agent!)) ||
      (await fileExists(this.paths.skill!))
    );
  }

  mcpFromNative(server: Record<string, unknown>): Record<string, unknown> {
    if (server.type === 'local' && Array.isArray(server.command)) {
      const [command, ...args] = server.command;
      return {
        command,
        args,
        ...(server.environment ? { env: server.environment } : {}),
      };
    }
    if (server.type === 'remote') {
      return {
        url: server.url,
        ...(server.headers ? { headers: server.headers } : {}),
      };
    }
    return server;
  }

  mcpToNative(server: Record<string, unknown>): Record<string, unknown> {
    if (typeof server.command === 'string') {
      return {
        type: 'local',
        command: [server.command, ...(Array.isArray(server.args) ? server.args : [])],
        enabled: true,
        ...(server.env ? { environment: server.env } : {}),
      };
    }
    if (typeof server.url === 'string') {
      return {
        type: 'remote',
        url: server.url,
        enabled: true,
        ...(server.headers ? { headers: server.headers } : {}),
      };
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
