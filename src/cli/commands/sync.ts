import { RegistryManager } from '../../core/registry.js';
import { Scanner } from '../../core/scanner.js';
import { Syncer } from '../../syncer/index.js';
import {
  assetList,
  bulletPoint,
  section,
  error,
  highlight,
  info,
  metric,
  spacer,
} from '../../utils/cli-output.js';
import { getConfiguredRegistryPath, requireConfiguredScope } from '../../utils/config.js';
import { configCommand } from './config.js';

interface SyncOptions {
  promptForScope?: boolean;
}

export async function syncCommand(options: SyncOptions = {}): Promise<void> {
  try {
    if (options.promptForScope !== false && !(await configCommand({}))) {
      return;
    }
    const scope = await requireConfiguredScope();

    section('Syncing assets');
    info(`Scope: ${scope}`);
    info(`Registry: ${getConfiguredRegistryPath(scope)}`);
    spacer();
    section('Scanning providers');

    const registry = new RegistryManager(scope);
    await registry.load();

    const scanner = new Scanner(scope);
    const installedTools = await scanner.detectInstalledTools();
    info(`${installedTools.length} providers detected`);
    for (const tool of installedTools) {
      bulletPoint(tool, 1);
    }
    spacer();

    const syncer = new Syncer(registry, scanner, scope);

    const result = await syncer.sync(false);

    spacer();
    highlight('Sync complete');
    spacer();
    metric('Assets discovered', result.assetsDiscovered);
    metric('Stubs written', result.stubsWritten);
    metric('Stubs deleted', result.stubsDeleted);
    spacer();
    if (registry.get().assets.length === 0) {
      info('No assets discovered');
    } else {
      section('Discovered assets');
      spacer();
      assetList(registry.get().assets, false, installedTools);
    }
  } catch (err) {
    error(`Sync failed: ${err}`);
    process.exit(1);
  }
}
