import { RegistryManager } from '../../core/registry.js';
import { section, error, spacer, table } from '../../utils/cli-output.js';
import { fileExists } from '../../utils/fs.js';
import { getRegistryPath } from '../../utils/paths.js';

interface StatusOptions {
  scope?: string;
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  try {
    const scope = (options.scope || 'workspace') as 'user' | 'workspace';
    const registryPath = getRegistryPath(scope);

    if (!(await fileExists(registryPath))) {
      error('Registry not found. Run: waslgenie install && waslgenie sync');
      process.exit(1);
    }

    const registry = new RegistryManager(scope);
    await registry.load();

    const registryData = registry.get();

    if (registryData.assets.length === 0) {
      section('No assets synced yet');
      spacer();
      return;
    }

    section('Synced Assets');
    spacer();

    const rows = registryData.assets.map((asset) => [
      asset.name,
      asset.type,
      asset.stubs.map((s) => s.tool).join(', ') || 'none',
      new Date(asset.last_modified_at).toLocaleString(),
    ]);

    table(
      [['ASSET', 'TYPE', 'STUBS', 'LAST MODIFIED'], ...rows.map((row) => row.map(String))],
      [20, 8, 20, 24]
    );

    spacer();
  } catch (err) {
    error(`Status check failed: ${err}`);
    process.exit(1);
  }
}
