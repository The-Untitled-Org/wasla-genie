import { RegistryManager } from '../../core/registry.js';
import { section, success, error, spacer, info } from '../../utils/cli-output.js';
import { getRegistryPath } from '../../utils/paths.js';
import { fileExists } from '../../utils/fs.js';

interface ConfigOptions {
  scope?: string;
  show?: boolean;
}

export async function configCommand(options: ConfigOptions): Promise<void> {
  try {
    // Determine current scope
    const userPath = getRegistryPath('user');
    const workspacePath = getRegistryPath('workspace');

    const userExists = await fileExists(userPath);
    const workspaceExists = await fileExists(workspacePath);

    let currentScope: 'user' | 'workspace' = 'user';
    if (workspaceExists && !userExists) {
      currentScope = 'workspace';
    }

    // Show current config
    if (options.show) {
      section('Current Configuration');
      spacer();
      info(`Scope: ${currentScope}`);
      info(`Registry: ${getRegistryPath(currentScope)}`);
      spacer();
      return;
    }

    // Change scope if requested
    if (options.scope) {
      const newScope = options.scope as 'user' | 'workspace';

      if (newScope !== 'user' && newScope !== 'workspace') {
        error('Invalid scope. Use: user or workspace');
        process.exit(1);
      }

      const registry = new RegistryManager(currentScope);

      // Load existing registry if it exists, otherwise it will be created on first sync
      if (
        (currentScope === 'user' && userExists) ||
        (currentScope === 'workspace' && workspaceExists)
      ) {
        await registry.load();
      } else {
        // Create empty registry
        await registry.load();
      }

      // Change scope and save
      registry.setScope(newScope);
      await registry.save();

      success(`Scope changed to: ${newScope}`);
      info(`Registry: ${getRegistryPath(newScope)}`);
      spacer();
      return;
    }

    // If no option provided, show current config
    section('Current Configuration');
    spacer();
    info(`Scope: ${currentScope}`);
    info(`Registry: ${getRegistryPath(currentScope)}`);
    spacer();
    console.log('Usage:');
    console.log('  waslagenie config --scope user       # Store registry in ~/.waslagenie/');
    console.log('  waslagenie config --scope workspace  # Store registry in .waslagenie/');
    console.log('  waslagenie config --show             # Show current config');
  } catch (err) {
    error(`Config failed: ${err}`);
    process.exit(1);
  }
}
