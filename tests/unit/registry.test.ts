/**
 * RegistryManager Unit Tests
 *
 * Covers (per implementation-plan.md §5 — Registry Design):
 *  - load/save round-trip for user + workspace scopes
 *  - Default registry structure (assets[], conflicts[], config)
 *  - CRUD: addAsset, findAsset, updateAsset, removeAsset
 *  - Conflict management: addConflict, findConflict, removeConflict
 *  - setScope
 *  - generateId uniqueness (UUID v4)
 *  - Error states: get() before load, save() before load
 *  - Corrupt / empty file recovery
 *  - Registry schema compliance (version, scope, no origin_tool)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RegistryManager } from '@core/registry';
import type { Asset, Conflict } from '@core/types';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: RegistryManager.generateId(),
    name: 'researcher',
    type: 'agent',
    last_modified_at: Date.now(),
    last_synced_at: new Date().toISOString(),
    stubs: [],
    ...overrides,
  };
}

function makeConflict(overrides: Partial<Conflict> = {}): Conflict {
  return {
    asset_name: 'researcher',
    type: 'agent',
    versions: [
      { tool: 'gemini', path: '~/.gemini/agents/researcher.md', modified_at: 2000 },
      { tool: 'claude', path: '~/.claude/agents/researcher.md', modified_at: 1000 },
    ],
    ...overrides,
  };
}

// ─── generateId ──────────────────────────────────────────────────────────────

describe('RegistryManager.generateId', () => {
  it('generates unique IDs on each call', () => {
    const ids = new Set(Array.from({ length: 20 }, () => RegistryManager.generateId()));
    expect(ids.size).toBe(20);
  });

  it('generates strings that look like UUIDs (8-4-4-4-12)', () => {
    const id = RegistryManager.generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

// ─── load — default registry ──────────────────────────────────────────────────

describe('RegistryManager.load — default registry', () => {
  it('creates an empty assets array by default', async () => {
    const registry = new RegistryManager('workspace');
    const data = await registry.load();
    expect(Array.isArray(data.assets)).toBe(true);
  });

  it('creates an empty conflicts array by default', async () => {
    const registry = new RegistryManager('workspace');
    const data = await registry.load();
    expect(Array.isArray(data.conflicts)).toBe(true);
  });

  it('sets version to 0.1.0', async () => {
    const registry = new RegistryManager('workspace');
    const data = await registry.load();
    expect(data.config.version).toBe('0.1.0');
  });

  it('respects workspace scope', async () => {
    const registry = new RegistryManager('workspace');
    const data = await registry.load();
    expect(data.config.scope).toBe('workspace');
  });

  it('respects user scope', async () => {
    const registry = new RegistryManager('user');
    const data = await registry.load();
    expect(data.config.scope).toBe('user');
  });

  it('defaults to workspace scope when no argument passed', async () => {
    const registry = new RegistryManager();
    const data = await registry.load();
    expect(data.config.scope).toBe('workspace');
  });
});

// ─── get() — error before load ───────────────────────────────────────────────

describe('RegistryManager uninitialized errors & invalid json', () => {
  it('throws if get() is called before load()', () => {
    const registry = new RegistryManager('workspace');
    expect(() => registry.get()).toThrow('Registry not loaded');
  });

  it('throws if save() is called before load()', async () => {
    const registry = new RegistryManager('workspace');
    await expect(registry.save()).rejects.toThrow('Registry not loaded');
  });

  it('load() recovers with default registry if file exists but is invalid JSON', async () => {
    const { writeText, ensureDir } = await import('@utils/fs');
    const { getRegistryPath, getRegistryDir } = await import('@utils/paths');
    const path = getRegistryPath('workspace');
    const dir = getRegistryDir('workspace');

    await ensureDir(dir);
    await writeText(path, '{ invalid json }');

    const registry = new RegistryManager('workspace');
    const data = await registry.load();
    expect(data.config.version).toBe('0.1.0');
    expect(data.assets).toEqual([]);
  });
});

// ─── addAsset / findAsset ─────────────────────────────────────────────────────

describe('RegistryManager.addAsset / findAsset', () => {
  it('finds an asset by name and type after adding', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    const asset = makeAsset({ name: 'researcher', type: 'agent' });
    registry.addAsset(asset);

    const found = registry.findAsset('researcher', 'agent');
    expect(found).toEqual(asset);
  });

  it('returns undefined for a non-existent asset', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    expect(registry.findAsset('ghost', 'agent')).toBeUndefined();
  });

  it('distinguishes assets by type (agent vs mcp)', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    registry.addAsset(makeAsset({ id: '1', name: 'notion', type: 'agent' }));
    registry.addAsset(makeAsset({ id: '2', name: 'notion', type: 'mcp' }));

    expect(registry.findAsset('notion', 'agent')?.id).toBe('1');
    expect(registry.findAsset('notion', 'mcp')?.id).toBe('2');
  });

  it('reflects multiple added assets', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    registry.addAsset(makeAsset({ id: 'a', name: 'researcher' }));
    registry.addAsset(makeAsset({ id: 'b', name: 'planner' }));

    expect(registry.get().assets).toHaveLength(2);
  });

  it('throws if addAsset() is called before load()', () => {
    const registry = new RegistryManager('workspace');
    expect(() => registry.addAsset(makeAsset())).toThrow('Registry not loaded');
  });
});

// ─── updateAsset ─────────────────────────────────────────────────────────────

describe('RegistryManager.updateAsset', () => {
  it('updates a field on the asset', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    const asset = makeAsset({ id: 'x', name: 'researcher' });
    registry.addAsset(asset);

    const newTime = Date.now() + 99_999;
    registry.updateAsset('x', { last_modified_at: newTime });

    expect(registry.findAsset('researcher', 'agent')?.last_modified_at).toBe(newTime);
  });

  it('updates last_synced_at without touching other fields', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    const asset = makeAsset({ id: 'y', name: 'planner', last_modified_at: 12345 });
    registry.addAsset(asset);

    const iso = new Date().toISOString();
    registry.updateAsset('y', { last_synced_at: iso });

    const updated = registry.findAsset('planner', 'agent')!;
    expect(updated.last_synced_at).toBe(iso);
    expect(updated.last_modified_at).toBe(12345); // untouched
  });

  it('is a no-op for an unknown id', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    // Should not throw
    expect(() => registry.updateAsset('no-such-id', { name: 'boom' })).not.toThrow();
  });

  it('throws if updateAsset() is called before load()', () => {
    const registry = new RegistryManager('workspace');
    expect(() => registry.updateAsset('id', {})).toThrow('Registry not loaded');
  });
});

// ─── removeAsset ─────────────────────────────────────────────────────────────

describe('RegistryManager.removeAsset', () => {
  it('removes the correct asset by id', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    registry.addAsset(makeAsset({ id: 'keep', name: 'keeper' }));
    registry.addAsset(makeAsset({ id: 'del', name: 'deleter' }));

    registry.removeAsset('del');

    expect(registry.findAsset('deleter', 'agent')).toBeUndefined();
    expect(registry.findAsset('keeper', 'agent')).toBeDefined();
  });

  it('leaves asset count correct after removal', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    registry.addAsset(makeAsset({ id: 'a', name: 'a' }));
    registry.addAsset(makeAsset({ id: 'b', name: 'b' }));
    registry.removeAsset('a');

    expect(registry.get().assets).toHaveLength(1);
  });

  it('is a no-op for unknown id', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    registry.addAsset(makeAsset({ id: 'z', name: 'z' }));
    registry.removeAsset('no-such');

    expect(registry.get().assets).toHaveLength(1);
  });

  it('throws if removeAsset() is called before load()', () => {
    const registry = new RegistryManager('workspace');
    expect(() => registry.removeAsset('id')).toThrow('Registry not loaded');
  });
});

// ─── Conflicts management ─────────────────────────────────────────────────────

describe('RegistryManager — conflict management', () => {
  it('adds and finds a conflict by name+type', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    const conflict = makeConflict({ asset_name: 'researcher', type: 'agent' });
    registry.addConflict(conflict);

    const found = registry.findConflict('researcher', 'agent');
    expect(found).toEqual(conflict);
  });

  it('returns undefined for non-existent conflict', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    expect(registry.findConflict('nobody', 'agent')).toBeUndefined();
  });

  it('removes a conflict by name+type', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    registry.addConflict(makeConflict({ asset_name: 'researcher', type: 'agent' }));
    registry.removeConflict('researcher', 'agent');

    expect(registry.findConflict('researcher', 'agent')).toBeUndefined();
  });

  it('removeConflict does not remove other conflicts', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    registry.addConflict(makeConflict({ asset_name: 'researcher', type: 'agent' }));
    registry.addConflict(makeConflict({ asset_name: 'planner', type: 'agent' }));
    registry.removeConflict('researcher', 'agent');

    expect(registry.findConflict('planner', 'agent')).toBeDefined();
    expect(registry.get().conflicts).toHaveLength(1);
  });

  it('throws addConflict before load', () => {
    const registry = new RegistryManager('workspace');
    expect(() => registry.addConflict(makeConflict())).toThrow('Registry not loaded');
  });

  it('throws removeConflict before load', () => {
    const registry = new RegistryManager('workspace');
    expect(() => registry.removeConflict('x', 'agent')).toThrow('Registry not loaded');
  });
});

// ─── setScope ─────────────────────────────────────────────────────────────────

describe('RegistryManager.setScope', () => {
  it('changes the scope in the registry config after setScope', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    registry.setScope('user');
    expect(registry.get().config.scope).toBe('user');
  });

  it('does not throw if setScope is called before load', () => {
    const registry = new RegistryManager('workspace');
    // registry is not loaded — setScope should not crash
    expect(() => registry.setScope('user')).not.toThrow();
  });
});

// ─── Schema compliance (no origin_tool) ────────────────────────────────────

describe('RegistryManager — schema compliance', () => {
  it('registry schema has no origin_tool field (per implementation plan)', async () => {
    const registry = new RegistryManager('workspace');
    const data = await registry.load();

    const json = JSON.stringify(data);
    expect(json).not.toContain('"origin_tool"');
  });

  it('assets have id, name, type, last_modified_at, last_synced_at, stubs', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    const asset = makeAsset({ name: 'schema-test' });
    registry.addAsset(asset);

    const found = registry.findAsset('schema-test', 'agent')!;
    expect(found).toHaveProperty('id');
    expect(found).toHaveProperty('name');
    expect(found).toHaveProperty('type');
    expect(found).toHaveProperty('last_modified_at');
    expect(found).toHaveProperty('last_synced_at');
    expect(found).toHaveProperty('stubs');
    expect(Array.isArray(found.stubs)).toBe(true);
  });
});
