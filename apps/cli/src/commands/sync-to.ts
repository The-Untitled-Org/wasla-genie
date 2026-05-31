import { RegistryManager } from '#core/registry.js';
import { Scanner } from '#sync/scanner.js';
import { Syncer } from '#sync/index.js';
import { section, error, highlight, spacer } from '../cli-output.js';
import { requireConfiguredScope } from '#shared/config.js';

interface SyncToOptions {
  from?: string;
  to?: string;
}

export async function syncToCommand(options: SyncToOptions): Promise<void> {
  try {
    const scope = await requireConfiguredScope();
    const from = options.from;
    const to = options.to;

    if (!from || !to) {
      error('Error: --from and --to are required');
      console.log('Usage: waslagenie sync-to --from <source> --to <target>');
      console.log('Example: waslagenie sync-to --from gemini --to claude');
      process.exit(1);
    }

    const targets = to.split(',').map((t) => t.trim());

    section(`Syncing from ${from} to ${targets.join(', ')}...`);
    spacer();

    const registry = new RegistryManager(scope);
    await registry.load();

    const scanner = new Scanner(scope);
    const syncer = new Syncer(registry, scanner, scope);

    const result = await syncer.syncToTool(from, targets);

    spacer();
    highlight('Sync complete!');
    console.log(`  ${result.assetsDiscovered} assets discovered`);
    console.log(`  ${result.stubsWritten} stubs written`);
    console.log(`  ${result.stubsDeleted} stubs deleted`);
  } catch (err) {
    error(`Sync failed: ${err}`);
    process.exit(1);
  }
}
