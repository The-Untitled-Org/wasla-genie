import { homedir } from 'os';
import { resolve, join } from 'path';

export function expandTilde(path: string): string {
  if (path.startsWith('~')) {
    return join(homedir(), path.slice(1));
  }
  return path;
}

export function getRegistryPath(scope: 'user' | 'workspace'): string {
  if (scope === 'user') {
    return expandTilde('~/.waslagenie/registry.json');
  }
  return resolve('.waslagenie/registry.json');
}

export function getRegistryDir(scope: 'user' | 'workspace'): string {
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
      openclaw: resolve('.config/openclaw'),
      opencode: resolve('.opencode'),
      cursor: resolve('.cursor'),
      vscode: resolve('.vscode'),
      'github-copilot': resolve('.github'),
      'github-cli': resolve('.github'),
    };
  }

  return {
    claude: expandTilde('~/.claude'),
    gemini: expandTilde('~/.gemini'),
    openclaw: expandTilde('~/.config/openclaw'),
    opencode: expandTilde('~/.opencode'),
    cursor: expandTilde('~/.cursor'),
    vscode: expandTilde('~/.config/Code/User'),
    'github-copilot': expandTilde('~/.github'),
    'github-cli': expandTilde('~/.copilot'),
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
    vscode: 'VS Code',
    'github-copilot': 'GitHub Copilot',
    'github-cli': 'GitHub CLI',
  };
  return displayNames[toolName] || toolName;
}
