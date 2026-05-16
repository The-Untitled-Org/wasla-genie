import { getInstalledAdapters } from '../../adapters/factory.js';
import { section, success, error, warning, highlight, spacer } from '../../utils/cli-output.js';
import { getRegistryDir } from '../../utils/paths.js';
import { ensureDir } from '../../utils/fs.js';

export async function installCommand(): Promise<void> {
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
    section('Installing WaslGenie...');
    spacer();

    // Ensure registry directory exists
    await ensureDir(getRegistryDir('user'));

    // Install skill in each adapter
    for (const adapter of adapters) {
      try {
        await adapter.installSkill();
        success(`Registered in ${adapter.displayName}`);
      } catch (e) {
        error(`Failed to register in ${adapter.displayName}: ${e}`);
      }
    }

    spacer();
    highlight('Installation complete!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Create agents in your preferred tool');
    console.log('  2. Run: waslgenie sync');
    console.log('  3. Run: waslgenie watch (for auto-sync)');
    console.log('');
  } catch (err) {
    error(`Installation failed: ${err}`);
    process.exit(1);
  }
}
