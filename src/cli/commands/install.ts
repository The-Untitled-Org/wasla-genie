import { section, success, error, highlight, spacer } from '../../utils/cli-output.js';
import { readConfiguredScope } from '../../utils/config.js';

export async function installCommand(): Promise<void> {
  try {
    section('Preparing WaslaGenie CLI...');
    spacer();

    const scope = await readConfiguredScope();
    if (scope) {
      success(`Scope configured: ${scope}`);
    } else {
      console.log('Choose a scope before running sync:');
      console.log('  waslagenie config --scope user');
      console.log('  waslagenie config --scope workspace');
    }

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
