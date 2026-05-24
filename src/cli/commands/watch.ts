import chokidar from 'chokidar';
import { RegistryManager } from '../../core/registry.js';
import { Scanner } from '../../core/scanner.js';
import { Syncer } from '../../syncer/index.js';
import { getAllAdapters } from '../../adapters/factory.js';
import { section, success, error, info, spacer } from '../../utils/cli-output.js';

interface WatchOptions {
  scope?: string;
}

export async function watchCommand(options: WatchOptions): Promise<void> {
  try {
    const scope = (options.scope || 'workspace') as 'user' | 'workspace';

    section('Watching for changes...');
    spacer();

    const registry = new RegistryManager(scope);
    await registry.load();

    const scanner = new Scanner(scope);
    const syncer = new Syncer(registry, scanner, scope);

    const watchDirs = [
      ...new Set(
        getAllAdapters(scope).flatMap((adapter) =>
          Object.values(adapter.paths).filter((path): path is string => Boolean(path))
        )
      ),
    ];

    info(`Watching: ${watchDirs.join(', ')}`);
    spacer();

    // Create watcher
    const watcher = chokidar.watch(watchDirs, {
      ignored: [
        /(^|[\/\\])node_modules([\/\\]|$)/,
        /(^|[\/\\])\.git([\/\\]|$)/,
        /(^|[\/\\])\.waslagenie([\/\\]|$)/,
        /(^|[\/\\])dist([\/\\]|$)/,
        /(^|[\/\\])output([\/\\]|$)/,
      ],
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
    });

    let isRunningSync = false;
    let pendingSync = false;

    const performSync = async () => {
      if (isRunningSync) {
        pendingSync = true;
        return;
      }

      isRunningSync = true;
      try {
        do {
          pendingSync = false;
          const result = await syncer.sync(false);
          const now = new Date().toLocaleTimeString();
          console.log(
            `[${now}] Synced: ${result.stubsWritten} written, ${result.stubsDeleted} deleted`
          );
        } while (pendingSync);
      } catch (err) {
        error(`Sync failed: ${err}`);
      } finally {
        isRunningSync = false;
      }
    };

    watcher
      .on('add', (path: string) => {
        console.log(`[added] ${path}`);
        performSync();
      })
      .on('change', (path: string) => {
        console.log(`[changed] ${path}`);
        performSync();
      })
      .on('unlink', (path: string) => {
        console.log(`[deleted] ${path}`);
        performSync();
      });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n');
      info('Stopping watcher...');
      await watcher.close();
      success('Watcher stopped');
      process.exit(0);
    });
  } catch (err) {
    error(`Watch failed: ${err}`);
    process.exit(1);
  }
}
