import { dirname, join } from 'path';
import { ensureDir, fileExists, readJSON, writeJSON } from './fs.js';
import { getRegistryDir, getRegistryPath } from './paths.js';

export type WaslaScope = 'user' | 'workspace';

interface WaslaConfig {
  scope: WaslaScope;
}

export function getConfigPath(): string {
  return join(getRegistryDir('user'), 'config.json');
}

export async function readConfiguredScope(): Promise<WaslaScope | null> {
  const configPath = getConfigPath();
  if (!(await fileExists(configPath))) return null;

  const config = await readJSON<WaslaConfig>(configPath);
  if (typeof config !== 'object' || config === null || typeof config.scope !== 'string') {
    throw new Error(`Invalid scope in ${configPath}. Run: waslagenie config --scope <scope>`);
  }
  if (config.scope !== 'user' && config.scope !== 'workspace') {
    throw new Error(`Invalid scope in ${configPath}. Run: waslagenie config --scope <scope>`);
  }
  return config.scope;
}

export async function requireConfiguredScope(): Promise<WaslaScope> {
  const scope = await readConfiguredScope();
  if (!scope) {
    throw new Error('Scope is not configured. Run: waslagenie config --scope <user|workspace>');
  }
  return scope;
}

export async function writeConfiguredScope(scope: WaslaScope): Promise<void> {
  const configPath = getConfigPath();
  await ensureDir(dirname(configPath));
  await writeJSON<WaslaConfig>(configPath, { scope });
}

export function getConfiguredRegistryPath(scope: WaslaScope): string {
  return getRegistryPath(scope);
}
