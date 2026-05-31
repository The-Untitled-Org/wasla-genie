import { homedir } from 'os';
import { resolve, join } from 'path';

export function expandTilde(path: string): string {
  if (path.startsWith('~')) {
    return resolve(join(homedir(), path.slice(1)));
  }
  return resolve(path);
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

  const markers: Record<string, string> = {
    claude: expandTilde('~/.claude'),
    gemini: expandTilde('~/.gemini'),
    openclaw: expandTilde('~/.openclaw'),
    opencode: expandTilde('~/.config/opencode'),
    cursor: expandTilde('~/.cursor'),
    'github-copilot': expandTilde('~/.config/Code/User'),
    'github-copilot-cli': expandTilde('~/.copilot'),
  };

  // Adjust for Windows if necessary
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA;
    if (appData) {
      markers['github-copilot'] = resolve(join(appData, 'Code/User'));
      markers['opencode'] = resolve(join(appData, 'opencode'));
    }
  }

  return markers;
}

export function getToolName(toolPath: string): string | null {
  const normalizedToolPath = resolve(toolPath);
  const userMarkers = getToolMarkers('user');
  const workspaceMarkers = getToolMarkers('workspace');

  for (const [name, path] of Object.entries(userMarkers)) {
    if (normalizedToolPath === resolve(path)) return name;
  }
  for (const [name, path] of Object.entries(workspaceMarkers)) {
    if (normalizedToolPath === resolve(path)) return name;
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
