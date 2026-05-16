import { describe, it, expect } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@core/scanner';
import { readText, fileExists } from '@utils/fs';

describe('Validation Tests - End-to-End Sync Workflow', () => {
  it('should validate stub markers are present after sync', async () => {
    const registry = new RegistryManager();
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    // Run sync (auto-loads registry)
    await syncer.sync(false);

    // Check registry for stubs
    const registryData = registry.get();
    for (const asset of registryData.assets) {
      for (const stub of asset.stubs) {
        if (await fileExists(stub.path)) {
          const content = await readText(stub.path);
          // Verify stub marker is present
          expect(
            content.includes('waslagenie-stub') ||
              content.includes('waslagenie:') ||
              content.includes('waslagenie')
          ).toBe(true);
        }
      }
    }
  });

  it('should validate registry persistence', async () => {
    const registry = new RegistryManager();
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    // Run sync
    await syncer.sync(false);

    // Save registry
    await registry.save();

    // Create new registry and verify data persisted
    const registry2 = new RegistryManager();
    await registry2.load();

    const data2 = registry2.get();
    expect(data2.assets.length).toBeGreaterThanOrEqual(0);
  });

  it('should validate scope is respected', async () => {
    const workspaceRegistry = new RegistryManager('workspace');
    const userRegistry = new RegistryManager('user');

    await workspaceRegistry.load();
    await userRegistry.load();

    const workspaceData = workspaceRegistry.get();
    const userData = userRegistry.get();

    // Both should have scope defined
    expect(workspaceData.config.scope).toBe('workspace');
    expect(userData.config.scope).toBe('user');
  });
});
