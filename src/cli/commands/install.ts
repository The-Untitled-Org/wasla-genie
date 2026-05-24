import { section, success, error, highlight, spacer } from '../../utils/cli-output.js';
import { getRegistryDir } from '../../utils/paths.js';
import { ensureDir } from '../../utils/fs.js';

export async function installCommand(): Promise<void> {
  try {
    section('Preparing WaslaGenie CLI...');
    spacer();

    // Ensure registry directory exists
    await ensureDir(getRegistryDir('user'));

    success('Registry directory ready');

    spacer();
    highlight('CLI setup complete!');
    console.log('');
    console.log('This command does not write skills into Claude, Gemini, or other tools.');
    console.log('');
    console.log('Common commands:');
    console.log('  waslagenie sync');
    console.log('  waslagenie sync-to --from gemini --to claude');
    console.log('  waslagenie register  # optional: add WaslaGenie helper skills to tools');
    console.log('');
  } catch (err) {
    error(`CLI setup failed: ${err}`);
    process.exit(1);
  }
}
