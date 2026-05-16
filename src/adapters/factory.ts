import { WaslGenieAdapter } from '../core/types.js';
import { ClaudeAdapter } from './claude.js';
import { GeminiAdapter } from './gemini.js';
import { OpenclawAdapter } from './openclaw.js';

function createAdapters(scope: 'user' | 'workspace' = 'user'): Record<string, WaslGenieAdapter> {
  return {
    claude: new ClaudeAdapter(scope),
    gemini: new GeminiAdapter(scope),
    openclaw: new OpenclawAdapter(scope),
  };
}

export function getAdapter(
  toolName: string,
  scope: 'user' | 'workspace' = 'workspace'
): WaslGenieAdapter {
  const adapters = createAdapters(scope);
  const adapter = adapters[toolName.toLowerCase()];
  if (!adapter) {
    throw new Error(`No adapter found for tool: ${toolName}`);
  }
  return adapter;
}

export async function getInstalledAdapters(
  scope: 'user' | 'workspace' = 'workspace'
): Promise<WaslGenieAdapter[]> {
  const adapters = Object.values(createAdapters(scope));
  const installed: WaslGenieAdapter[] = [];

  for (const adapter of adapters) {
    if (await adapter.isInstalled()) {
      installed.push(adapter);
    }
  }

  return installed;
}

export function getAllAdapters(scope: 'user' | 'workspace' = 'workspace'): WaslGenieAdapter[] {
  return Object.values(createAdapters(scope));
}
