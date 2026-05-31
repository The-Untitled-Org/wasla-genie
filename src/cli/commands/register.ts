import { getInstalledAdapters } from '../../adapters/factory.js';
import { section, success, error, warning, highlight, spacer } from '../../utils/cli-output.js';
import { getRegistryDir } from '../../utils/paths.js';
import { ensureDir } from '../../utils/fs.js';
import { requireConfiguredScope } from '../../utils/config.js';

interface RegisterOptions {
  to?: string;
}

export async function registerCommand(options: RegisterOptions = {}): Promise<void> {
  try {
    section('Detecting installed orchestrators...');
    spacer();

    const scope = await requireConfiguredScope();
    const adapters = await getInstalledAdapters(scope);

    if (adapters.length === 0) {
      error('No supported orchestrators found');
      warning('Please install Claude Code, Gemini CLI, or OpenCode first');
      process.exit(1);
    }

    adapters.forEach((adapter) => {
      success(`${adapter.displayName} found`);
    });

    let targets = adapters;
    if (options.to) {
      const requested = options.to
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      const installedByName = new Map(
        adapters.map((adapter) => [adapter.name.toLowerCase(), adapter])
      );
      const invalid = requested.filter((name) => !installedByName.has(name));
      if (invalid.length > 0) {
        error(
          `Unsupported or not installed provider(s): ${invalid.join(', ')}. Installed providers: ${adapters
            .map((adapter) => adapter.name)
            .join(', ')}`
        );
        process.exit(1);
        return;
      }
      targets = requested.map((name) => installedByName.get(name)!);
    }

    spacer();
    section('Registering WaslaGenie helper skills...');
    spacer();

    await ensureDir(getRegistryDir(scope));

    for (const adapter of targets) {
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
