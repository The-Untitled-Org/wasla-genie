import { RegistryManager } from '../../core/registry.js';
import { Scanner } from '../../core/scanner.js';
import { Syncer } from '../../syncer/index.js';
import { section, error, highlight, spacer } from '../../utils/cli-output.js';

interface SyncOptions {
  scope?: string;
}

export async function syncCommand(options: SyncOptions): Promise<void> {
  try {
    const scope = (options.scope || 'workspace') as 'user' | 'workspace';

    section('Scanning...');
    spacer();

    const registry = new RegistryManager(scope);
    await registry.load();

    const scanner = new Scanner(scope);
    const syncer = new Syncer(registry, scanner, scope);

    const result = await syncer.sync(true);

    spacer();
    highlight('Sync complete!');
    console.log(`  ${result.assetsDiscovered} assets discovered`);
    console.log(`  ${result.stubsWritten} stubs written`);
  } catch (err) {
    error(`Sync failed: ${err}`);
    process.exit(1);
  }
}
