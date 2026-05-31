import { section, success, error, spacer, info } from '../cli-output.js';
import prompts from 'prompts';
import {
  getConfigPath,
  getConfiguredRegistryPath,
  readConfiguredScope,
  writeConfiguredScope,
  type WaslaScope,
} from '#shared/config.js';

interface ConfigOptions {
  scope?: string;
  show?: boolean;
}

export async function configCommand(options: ConfigOptions): Promise<boolean> {
  try {
    const currentScope = await readConfiguredScope();

    // Show current config
    if (options.show) {
      section('Current Configuration');
      spacer();
      showConfig(currentScope);
      spacer();
      return true;
    }

    // Change scope if requested
    if (options.scope) {
      const newScope = options.scope as WaslaScope;

      if (newScope !== 'user' && newScope !== 'workspace') {
        error('Invalid scope. Use: user or workspace');
        process.exit(1);
      }

      await saveScope(newScope);
      return true;
    }

    section('Configure Scope');
    spacer();
    const response = await prompts<string>({
      type: 'select',
      name: 'scope' as const,
      message: 'Where should WaslaGenie store and sync assets?',
      choices: [
        { title: 'Workspace - current project only', value: 'workspace' },
        { title: 'User - available across all projects', value: 'user' },
      ],
      initial: currentScope === 'user' ? 1 : 0,
    });
    const scope = response.scope as WaslaScope | undefined;
    if (!scope) {
      info('Configuration cancelled');
      return false;
    }
    await saveScope(scope);
    return true;
  } catch (err) {
    error(`Config failed: ${err}`);
    process.exit(1);
  }
}

async function saveScope(scope: WaslaScope): Promise<void> {
  await writeConfiguredScope(scope);
  success(`Scope changed to: ${scope}`);
  info(`Config: ${getConfigPath()}`);
  info(`Registry: ${getConfiguredRegistryPath(scope)}`);
  spacer();
}

function showConfig(scope: WaslaScope | null): void {
  info(`Scope: ${scope ?? 'not configured'}`);
  info(`Config: ${getConfigPath()}`);
  if (scope) info(`Registry: ${getConfiguredRegistryPath(scope)}`);
}
