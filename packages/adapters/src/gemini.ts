import { BaseAdapter } from './base.js';
import { Asset } from '#core/types.js';
import { fileExists, writeText, ensureDir } from '#shared/fs.js';
import { dirname, join } from 'path';
import { getToolMarkers } from '#shared/paths.js';

export class GeminiAdapter extends BaseAdapter {
  name = 'gemini';
  displayName = 'Gemini CLI';
  private scope: 'user' | 'workspace';

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    super();
    this.scope = scope;
  }

  get paths() {
    const markers = getToolMarkers(this.scope);
    const workspaceRoot = dirname(markers.gemini);
    return {
      agent: join(markers.gemini, 'agents'),
      skill: join(markers.gemini, 'skills'),
      mcp: join(markers.gemini, 'settings.json'),
      context:
        this.scope === 'workspace'
          ? join(workspaceRoot, 'GEMINI.md')
          : join(markers.gemini, 'GEMINI.md'),
    };
  }

  mcpKey = 'mcpServers';
  contextFile = 'GEMINI.md';

  formats = {
    agent: 'md' as const,
    skill: 'md' as const,
    mcp: 'json' as const,
    context: 'md' as const,
  };

  get skillDirs() {
    return [this.paths.skill!!];
  }

  async isInstalled(): Promise<boolean> {
    const markers = getToolMarkers(this.scope);
    return fileExists(markers.gemini);
  }

  mcpFromNative(server: Record<string, unknown>): Record<string, unknown> {
    if (typeof server.command === 'string') {
      return {
        command: server.command,
        ...(Array.isArray(server.args) ? { args: server.args } : {}),
        ...(server.env && typeof server.env === 'object' ? { env: server.env } : {}),
      };
    }
    return server;
  }

  async writeStub(asset: Asset, content: string, targetPath: string): Promise<void> {
    if (asset.type === 'agent' || asset.type === 'skill') {
      await this.writeSkillStub(targetPath, content);
    } else {
      await this.writeMcpStub(targetPath, content);
    }
  }

  private async writeSkillStub(targetPath: string, content: string): Promise<void> {
    await ensureDir(dirname(targetPath));
    await writeText(targetPath, content);
  }

  private async writeMcpStub(targetPath: string, content: string): Promise<void> {
    await ensureDir(dirname(targetPath));
    await writeText(targetPath, content);
  }

  async installSkill(): Promise<void> {
    // Create the skills/ directory (Gemini CLI's native skill location) and
    // write a WaslaGenie skill file so Gemini knows how to run sync commands.
    // We do NOT touch GEMINI.md — that file belongs to the user.
    const skillDir = join(this.paths.skill!!, 'waslagenie');
    await ensureDir(skillDir);

    const skillPath = join(skillDir, 'SKILL.md');
    if (await fileExists(skillPath)) {
      return; // already installed, idempotent
    }

    const skillContent = `---
name: waslagenie
description: >
  Runs WaslaGenie CLI commands to sync, inspect, or manage agents and MCPs
  across AI orchestrators. Use when asked to sync tools, check sync status,
  install WaslaGenie, or troubleshoot why an agent isn't appearing in a tool.
---

# WaslaGenie Operator

Use the \`waslagenie\` CLI to sync agents and MCPs across all installed AI tools.

\`\`\`bash
waslagenie sync     # Mirror agents across all tools
waslagenie status   # Show registry state
waslagenie watch    # Auto-sync on file changes
\`\`\`
`;

    await writeText(skillPath, skillContent);
  }

  getRootConfigAppend(): string | null {
    return null;
  }
}
