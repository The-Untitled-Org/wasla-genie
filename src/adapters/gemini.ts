import { BaseAdapter } from './base.js';
import { Asset } from '../core/types.js';
import { fileExists, writeText, readText, ensureDir } from '../utils/fs.js';
import { join } from 'path';
import { getToolMarkers } from '../utils/paths.js';

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
    return {
      agents: join(markers.gemini, 'agents'),
      mcp: join(markers.gemini, 'mcp'),
    };
  }

  mcpKey = 'mcpServers';
  contextFile = 'GEMINI.md';

  formats = {
    agents: 'md' as const,
    mcp: 'json' as const,
  };

  get skillDirs() {
    return [this.paths.agents];
  }

  async isInstalled(): Promise<boolean> {
    const markers = getToolMarkers(this.scope);
    return fileExists(markers.gemini);
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
    const markers = getToolMarkers(this.scope);
    const geminiMdPath = join(markers.gemini, 'GEMINI.md');

    let content = '';
    if (await fileExists(geminiMdPath)) {
      content = await readText(geminiMdPath);
    }

    const waslagenieBlock = `
<!-- waslagenie:start -->
## WaslaGenie

WaslaGenie synchronizes your agents and MCPs across Claude Code, Gemini CLI, and OpenClaw.

To use WaslaGenie:
\`\`\`bash
waslagenie sync          # Sync agents across tools
waslagenie status        # View all synced assets
waslagenie watch         # Watch for changes and auto-sync
\`\`\`

For more info: [WaslaGenie Documentation](https://github.com/yourusername/wasla-genie)
<!-- waslagenie:end -->
`;

    if (!content.includes('<!-- waslagenie:start -->')) {
      await writeText(geminiMdPath, content + waslagenieBlock);
    }
  }

  getRootConfigAppend(): string | null {
    return `
<!-- waslagenie:start -->
## WaslaGenie

WaslaGenie synchronizes your agents and MCPs across Claude Code, Gemini CLI, and OpenClaw.

To use WaslaGenie:
\`\`\`bash
waslagenie sync          # Sync agents across tools
waslagenie status        # View all synced assets
waslagenie watch         # Watch for changes and auto-sync
\`\`\`

For more info: [WaslaGenie Documentation](https://github.com/yourusername/wasla-genie)
<!-- waslagenie:end -->
`;
  }
}
