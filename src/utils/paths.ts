import { homedir } from 'os';
import { resolve, join } from 'path';

export function expandTilde(path: string): string {
  if (path.startsWith('~')) {
    return join(homedir(), path.slice(1));
  }
  return path;
}

export function getRegistryPath(scope: 'user' | 'workspace'): string {
  if (process.env.NODE_ENV === 'test') {
    return resolve(`output/tests/${scope}-registry.json`);
  }
  if (scope === 'user') {
    return expandTilde('~/.waslagenie/registry.json');
  }
  return resolve('.waslagenie/registry.json');
}

export function getRegistryDir(scope: 'user' | 'workspace'): string {
  if (process.env.NODE_ENV === 'test') {
    return resolve('output/tests');
  }
  if (scope === 'user') {
    return expandTilde('~/.waslagenie');
  }
  return resolve('.waslagenie');
}

export function getToolMarkers(scope: 'user' | 'workspace' = 'user'): Record<string, string> {
  if (scope === 'workspace') {
    return {
      claude: resolve('.claude'),
      gemini: resolve('.gemini'),
      openclaw: resolve('.openclaw'),
      opencode: resolve('.opencode'),
      cursor: resolve('.cursor'),
      'github-copilot': resolve('.vscode'),
      'github-copilot-cli': resolve('.github'),
    };
  }

  return {
    claude: expandTilde('~/.claude'),
    gemini: expandTilde('~/.gemini'),
    openclaw: expandTilde('~/.openclaw'),
    opencode: expandTilde('~/.config/opencode'),
    cursor: expandTilde('~/.cursor'),
    'github-copilot': expandTilde('~/.config/Code/User'),
    'github-copilot-cli': expandTilde('~/.copilot'),
  };
}

export function getToolName(toolPath: string): string | null {
  const userMarkers = getToolMarkers('user');
  const workspaceMarkers = getToolMarkers('workspace');

  // Search user and workspace maps independently so that workspace keys
  // do not overwrite user keys (they share the same key names but different paths).
  for (const [name, path] of Object.entries(userMarkers)) {
    if (toolPath === path) return name;
  }
  for (const [name, path] of Object.entries(workspaceMarkers)) {
    if (toolPath === path) return name;
  }
  return null;
}

export function getToolDisplayName(toolName: string): string {
  const displayNames: Record<string, string> = {
    claude: 'Claude Code',
    gemini: 'Gemini CLI',
    openclaw: 'OpenClaw',
    opencode: 'OpenCode',
    cursor: 'Cursor',
    'github-copilot': 'GitHub Copilot',
    'github-copilot-cli': 'GitHub Copilot CLI',
  };
  return displayNames[toolName] || toolName;
}
