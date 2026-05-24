import { getInstalledAdapters } from '../../adapters/factory.js';
import { section, success, error, warning, highlight, spacer } from '../../utils/cli-output.js';
import { getRegistryDir } from '../../utils/paths.js';
import { ensureDir } from '../../utils/fs.js';

export async function registerCommand(): Promise<void> {
  try {
    section('Detecting installed orchestrators...');
    spacer();

    const adapters = await getInstalledAdapters();

    if (adapters.length === 0) {
      error('No supported orchestrators found');
      warning('Please install Claude Code, Gemini CLI, or OpenCode first');
      process.exit(1);
    }

    adapters.forEach((adapter) => {
      success(`${adapter.displayName} found`);
    });

    spacer();
    section('Registering WaslaGenie helper skills...');
    spacer();

    await ensureDir(getRegistryDir('user'));

    for (const adapter of adapters) {
      try {
        await adapter.installSkill();
        success(`Registered in ${adapter.displayName}`);
      } catch (e) {
        error(`Failed to register in ${adapter.displayName}: ${e}`);
      }
    }

    spacer();
    highlight('Registration complete!');
  } catch (err) {
    error(`Registration failed: ${err}`);
    process.exit(1);
  }
}
