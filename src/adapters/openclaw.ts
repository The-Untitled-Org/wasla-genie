import { BaseAdapter } from './base.js';
import { Asset } from '../core/types.js';
import { fileExists, writeText, ensureDir } from '../utils/fs.js';
import { dirname, join } from 'path';
import { getToolMarkers } from '../utils/paths.js';

export class OpenclawAdapter extends BaseAdapter {
  name = 'openclaw';
  displayName = 'OpenClaw';
  private scope: 'user' | 'workspace';

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    super();
    this.scope = scope;
  }

  get paths() {
    const markers = getToolMarkers(this.scope);
    const workspaceRoot =
      this.scope === 'workspace' ? dirname(markers.openclaw) : join(markers.openclaw, 'workspace');
    return {
      skill:
        this.scope === 'workspace'
          ? join(workspaceRoot, 'skills')
          : join(markers.openclaw, 'skills'),
      mcp: this.scope === 'user' ? join(markers.openclaw, 'openclaw.json') : undefined,
      context: join(workspaceRoot, 'AGENTS.md'),
    };
  }

  mcpKey = 'mcp.servers';
  contextFile = 'AGENTS.md';

  formats = {
    skill: 'md' as const,
    mcp: 'json' as const,
    context: 'md' as const,
  };

  get skillDirs() {
    return [this.paths.skill!];
  }

  async isInstalled(): Promise<boolean> {
    if (this.scope === 'user') {
      return fileExists(getToolMarkers(this.scope).openclaw);
    }
    return (await fileExists(this.paths.context!)) || (await fileExists(this.paths.skill!));
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
    // OpenClaw skill installation would go here
  }

  getRootConfigAppend(): string | null {
    return null;
  }
}
