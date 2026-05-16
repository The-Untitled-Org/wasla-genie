import { describe, it, expect } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@core/scanner';

describe('Syncer', () => {
  it('should initialize with registry and scanner', () => {
    const registry = new RegistryManager();
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    expect(syncer).toBeDefined();
  });

  it('should execute sync', async () => {
    const registry = new RegistryManager();
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    // Run sync (will automatically load registry if needed)
    const result = await syncer.sync(false);

    expect(result).toHaveProperty('stubsWritten');
    expect(result).toHaveProperty('assetsDiscovered');
    expect(result.stubsWritten).toBeGreaterThanOrEqual(0);
  });
});
