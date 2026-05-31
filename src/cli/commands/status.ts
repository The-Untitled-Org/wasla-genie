import { RegistryManager } from '../../core/registry.js';
import { Scanner } from '../../core/scanner.js';
import { assetList, section, error, info, metric, spacer } from '../../utils/cli-output.js';
import { fileExists } from '../../utils/fs.js';
import { getRegistryPath } from '../../utils/paths.js';
import { requireConfiguredScope } from '../../utils/config.js';

export async function statusCommand(): Promise<void> {
  try {
    const scope = await requireConfiguredScope();
    const registryPath = getRegistryPath(scope);

    if (!(await fileExists(registryPath))) {
      error('Registry not found. Run: waslagenie sync');
      process.exit(1);
    }

    const registry = new RegistryManager(scope);
    await registry.load();

    const registryData = registry.get();
    const installedTools = await new Scanner(scope).detectInstalledTools();

    section('Registry status');
    info(`Scope: ${scope}`);
    info(`Registry: ${registryPath}`);
    spacer();
    metric('Assets', registryData.assets.length);
    metric('Conflicts', registryData.conflicts.length);

    if (registryData.assets.length === 0) {
      spacer();
      section('No assets synced yet');
      spacer();
      return;
    }

    section('Synced assets');
    spacer();
    assetList(registryData.assets, true, installedTools);
  } catch (err) {
    error(`Status check failed: ${err}`);
    process.exit(1);
  }
}
