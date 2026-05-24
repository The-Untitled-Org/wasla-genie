import { BaseAdapter } from './base.js';
import { Asset } from '../core/types.js';
import { fileExists, writeText, ensureDir } from '../utils/fs.js';
import { dirname, join } from 'path';
import { getToolMarkers } from '../utils/paths.js';

export class ClaudeAdapter extends BaseAdapter {
  name = 'claude';
  displayName = 'Claude Code';
  private scope: 'user' | 'workspace';

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    super();
    this.scope = scope;
  }

  get paths() {
    const markers = getToolMarkers(this.scope);
    const workspaceRoot = dirname(markers.claude);
    return {
      agent: join(markers.claude, 'agents'),
      skill: join(markers.claude, 'skills'),
      mcp:
        this.scope === 'workspace'
          ? join(workspaceRoot, '.mcp.json')
          : join(markers.claude, 'settings.json'),
      context:
        this.scope === 'workspace'
          ? join(workspaceRoot, 'CLAUDE.md')
          : join(markers.claude, 'CLAUDE.md'),
    };
  }

  mcpKey = 'mcpServers';
  contextFile = 'CLAUDE.md';

  formats = {
    agent: 'md' as const,
    skill: 'md' as const,
    mcp: 'json' as const,
    context: 'md' as const,
  };

  get skillDirs() {
    return [this.paths.skill!];
  }

  async isInstalled(): Promise<boolean> {
    const markers = getToolMarkers(this.scope);
    return fileExists(markers.claude);
  }

  async writeStub(asset: Asset, content: string, targetPath: string): Promise<void> {
    if (asset.type === 'agent') {
      await this.writeAgentStub(targetPath, content);
    } else if (asset.type === 'skill') {
      await this.writeSkillStub(targetPath, content);
    } else {
      await this.writeMcpStub(targetPath, content);
    }
  }

  private async writeAgentStub(targetPath: string, content: string): Promise<void> {
    const { dirname } = await import('path');
    await ensureDir(dirname(targetPath));
    await writeText(targetPath, content);
  }

  private async writeSkillStub(targetPath: string, content: string): Promise<void> {
    const { dirname } = await import('path');
    await ensureDir(dirname(targetPath));
    await writeText(targetPath, content);
  }

  private async writeMcpStub(targetPath: string, content: string): Promise<void> {
    const { dirname } = await import('path');
    await ensureDir(dirname(targetPath));
    await writeText(targetPath, content);
  }

  async installSkill(): Promise<void> {
    // Write a WaslaGenie skill into Claude's native skills directory.
    // We do NOT touch CLAUDE.md — that file belongs to the user.
    const skillDir = join(this.paths.skill!, 'waslagenie');
    await ensureDir(skillDir);

    const skillPath = join(skillDir, 'SKILL.md');
    if (await fileExists(skillPath)) {
      return; // already installed, idempotent
    }

    const skillContent = `---
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
