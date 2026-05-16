import { describe, it, expect } from 'vitest';
import { RegistryManager } from '@core/registry';
import type { Asset } from '@core/types';

describe('RegistryManager', () => {
  it('should generate unique IDs', () => {
    const id1 = RegistryManager.generateId();
    const id2 = RegistryManager.generateId();
    expect(id1).not.toBe(id2);
  });

  it('should add and retrieve assets', async () => {
    const registry = new RegistryManager();
    await registry.load(); // Initialize this.registry

    const asset: Asset = {
      id: 'test-id',
      name: 'researcher',
      type: 'agent',
      last_modified_at: Date.now(),
      last_synced_at: new Date().toISOString(),
      stubs: [],
    };

    registry.addAsset(asset);
    const found = registry.findAsset('researcher', 'agent');
    expect(found).toEqual(asset);
  });

  it('should update assets', async () => {
    const registry = new RegistryManager();
    await registry.load();

    const asset: Asset = {
      id: 'test-id',
      name: 'researcher',
      type: 'agent',
      last_modified_at: Date.now(),
      last_synced_at: new Date().toISOString(),
      stubs: [],
    };

    registry.addAsset(asset);
    const newTime = Date.now() + 1000;
    registry.updateAsset('test-id', { last_modified_at: newTime });

    const updated = registry.findAsset('researcher', 'agent');
    expect(updated?.last_modified_at).toBe(newTime);
  });
});
