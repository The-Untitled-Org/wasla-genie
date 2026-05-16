import { BaseAdapter } from './base.js';
import { Asset } from '../core/types.js';
import { fileExists, writeText, readText, ensureDir } from '../utils/fs.js';
import { join } from 'path';
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
    return {
      agents: join(markers.claude, 'agents'),
      mcp: join(markers.claude, 'mcp'),
    };
  }

  formats = {
    agents: 'md' as const,
    mcp: 'json' as const,
  };

  

  async isInstalled(): Promise<boolean> {
    const markers = getToolMarkers(this.scope);
    return fileExists(markers.claude);
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
    const marked = `<!-- waslgenie-stub -->\n${content}`;
    await writeText(targetPath, marked);
  }

  private async writeMcpStub(targetPath: string, content: string): Promise<void> {
    await ensureDir(this.paths.mcp);
    const marked = `/* waslgenie-stub */\n${content}`;
    await writeText(targetPath, marked);
  }

  async installSkill(): Promise<void> {
    const markers = getToolMarkers(this.scope);
    const claudeMdPath = join(markers.claude, 'CLAUDE.md');

    let content = '';
    if (await fileExists(claudeMdPath)) {
      content = await readText(claudeMdPath);
    }

    const waslgenieBlock = `
<!-- waslgenie:start -->
## WaslGenie

WaslGenie synchronizes your agents and MCPs across Claude Code, Gemini CLI, and OpenClaw.

To use WaslGenie:
\`\`\`bash
waslgenie sync          # Sync agents across tools
waslgenie status        # View all synced assets
waslgenie watch         # Watch for changes and auto-sync
\`\`\`

For more info: [WaslGenie Documentation](https://github.com/yourusername/wasl-genie)
<!-- waslgenie:end -->
`;

    if (!content.includes('<!-- waslgenie:start -->')) {
      await writeText(claudeMdPath, content + waslgenieBlock);
    }
  }

  getRootConfigAppend(): string | null {
    return `
<!-- waslgenie:start -->
## WaslGenie

WaslGenie synchronizes your agents and MCPs across Claude Code, Gemini CLI, and OpenClaw.

To use WaslGenie:
\`\`\`bash
waslgenie sync          # Sync agents across tools
waslgenie status        # View all synced assets
waslgenie watch         # Watch for changes and auto-sync
\`\`\`

For more info: [WaslGenie Documentation](https://github.com/yourusername/wasl-genie)
<!-- waslgenie:end -->
`;
  }
}
