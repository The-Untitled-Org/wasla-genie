import { OpenCodeAdapter } from './opencode.js';
import { CursorAdapter } from './cursor.js';
import { VscodeAdapter } from './vscode.js';
import { GithubCopilotAdapter } from './github-copilot.js';
import { GithubCliAdapter } from './github-cli.js';
import { WaslaGenieAdapter } from '../core/types.js';
import { ClaudeAdapter } from './claude.js';
import { GeminiAdapter } from './gemini.js';
import { OpenclawAdapter } from './openclaw.js';

function createAdapters(scope: 'user' | 'workspace' = 'user'): Record<string, WaslaGenieAdapter> {
  return {
    claude: new ClaudeAdapter(scope),
    gemini: new GeminiAdapter(scope),
    openclaw: new OpenclawAdapter(scope),
    opencode: new OpenCodeAdapter(scope),
    cursor: new CursorAdapter(scope),
    vscode: new VscodeAdapter(scope),
    'github-copilot': new GithubCopilotAdapter(scope),
    'github-cli': new GithubCliAdapter(scope),
  };
}

export function getAdapter(
  toolName: string,
  scope: 'user' | 'workspace' = 'workspace'
): WaslaGenieAdapter {
  const adapters = createAdapters(scope);
  const adapter = adapters[toolName.toLowerCase()];
  if (!adapter) {
    throw new Error(`No adapter found for tool: ${toolName}`);
  }
  return adapter;
}

export async function getInstalledAdapters(
  scope: 'user' | 'workspace' = 'workspace'
): Promise<WaslaGenieAdapter[]> {
  const adapters = Object.values(createAdapters(scope));
  const installed: WaslaGenieAdapter[] = [];

  for (const adapter of adapters) {
    if (await adapter.isInstalled()) {
      installed.push(adapter);
    }
  }

  return installed;
}

export function getAllAdapters(scope: 'user' | 'workspace' = 'workspace'): WaslaGenieAdapter[] {
  return Object.values(createAdapters(scope));
}
