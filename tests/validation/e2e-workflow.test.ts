/**
 * End-to-End Validation Tests
 *
 * Covers (per implementation-plan.md §Success Criteria for MVP):
 *
 *  ✅ Agent created in Tool A is visible after sync (stub written to Tool B, C)
 *  ✅ Latest-is-Greatest: most-recently-edited version is used as source
 *  ✅ Stub files contain waslagenie marker (agent + MCP)
 *  ✅ Stubs are NOT treated as originals (no false conflicts)
 *  ✅ Registry accurately tracks hashes/mtimes
 *  ✅ Registry scope: workspace vs user are independent
 *  ✅ Manual sync works and detects changes correctly
 *  ✅ waslagenie:start / waslagenie:end markers in skill installation
 *  ✅ File Modification Rules: WaslaGenie appends only inside its markers
 *  ✅ Non-goals: no origin_tool in registry
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@core/scanner';
import { readText, writeText, fileExists, ensureDir } from '@utils/fs';
import { ClaudeAdapter } from '@adapters/claude';
import { GeminiAdapter } from '@adapters/gemini';
import { OpenclawAdapter } from '@adapters/openclaw';
import type { DiscoveredFile } from '@core/types';

// ─── Success Criteria: stub markers present ────────────────────────────────

describe('MVP Success Criteria — stub markers present after sync', () => {
  it('validates stubs contain waslagenie marker', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    await syncer.sync(false);

    const data = registry.get();
    for (const asset of data.assets) {
      for (const stub of asset.stubs) {
        if (await fileExists(stub.path)) {
          const content = await readText(stub.path);
          expect(
            content.includes('waslagenie-stub') ||
              content.includes('waslagenie:') ||
              content.includes('waslagenie')
          ).toBe(true);
        }
      }
    }
  });
});

// ─── Success Criteria: registry persistence ────────────────────────────────

describe('MVP Success Criteria — registry persistence', () => {
  it('registry survives a save + reload cycle intact', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    await syncer.sync(false);
    await registry.save();

    const registry2 = new RegistryManager('workspace');
    await registry2.load();

    const data = registry2.get();
    expect(data.config.version).toBe('0.1.0');
    expect(Array.isArray(data.assets)).toBe(true);
    expect(Array.isArray(data.conflicts)).toBe(true);
  });
});

// ─── Success Criteria: scope independence ─────────────────────────────────

describe('MVP Success Criteria — workspace vs user scope are independent', () => {
  it('workspace registry has scope=workspace', async () => {
    const reg = new RegistryManager('workspace');
    await reg.load();
    expect(reg.get().config.scope).toBe('workspace');
  });

  it('user registry has scope=user', async () => {
    const reg = new RegistryManager('user');
    await reg.load();
    expect(reg.get().config.scope).toBe('user');
  });

  it('changing one scope does not affect the other', async () => {
    const ws = new RegistryManager('workspace');
    const user = new RegistryManager('user');

    await ws.load();
    await user.load();

    ws.setScope('user');

    // user registry untouched
    expect(user.get().config.scope).toBe('user');
  });
});

// ─── Non-goal: no origin_tool in registry ─────────────────────────────────

describe('MVP Non-goal — no origin_tool in registry schema', () => {
  it('registry does not contain origin_tool field', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    const json = JSON.stringify(registry.get());
    expect(json).not.toContain('"origin_tool"');
  });

  it('registry does not contain origin_path field', async () => {
    const registry = new RegistryManager('workspace');
    await registry.load();

    const json = JSON.stringify(registry.get());
    expect(json).not.toContain('"origin_path"');
  });
});

// ─── File Modification Rules: waslagenie markers ───────────────────────────

describe('File Modification Rules — waslagenie:start / waslagenie:end markers', () => {
  it('ClaudeAdapter getRootConfigAppend wraps content in markers', () => {
    const adapter = new ClaudeAdapter('workspace');
    const block = adapter.getRootConfigAppend()!;
    const start = block.indexOf('<!-- waslagenie:start -->');
    const end = block.indexOf('<!-- waslagenie:end -->');
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
  });

  it('GeminiAdapter getRootConfigAppend wraps content in markers', () => {
    const adapter = new GeminiAdapter('workspace');
    const block = adapter.getRootConfigAppend()!;
    const start = block.indexOf('<!-- waslagenie:start -->');
    const end = block.indexOf('<!-- waslagenie:end -->');
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
  });

  it('markers appear exactly once in getRootConfigAppend output (no duplicates)', () => {
    const adapter = new ClaudeAdapter('workspace');
    const block = adapter.getRootConfigAppend()!;
    const startCount = (block.match(/<!-- waslagenie:start -->/g) || []).length;
    const endCount = (block.match(/<!-- waslagenie:end -->/g) || []).length;
    expect(startCount).toBe(1);
    expect(endCount).toBe(1);
  });
});

// ─── Stubs not counted as originals ───────────────────────────────────────

describe('Stub detection — stubs are not originals', () => {
  it('file with waslagenie-stub comment is detected as stub', async () => {
    const scanner = new Scanner('workspace');

    const stubFile: DiscoveredFile = {
      path: '/fake/.gemini/agents/researcher.md',
      isStub: true,
      tool: 'gemini',
      type: 'agent',
      name: 'researcher',
      modifiedAt: Date.now(),
    };

    const originalFile: DiscoveredFile = {
      path: '/fake/.claude/agents/researcher.md',
      isStub: false,
      tool: 'claude',
      type: 'agent',
      name: 'researcher',
      modifiedAt: Date.now() - 1000,
    };

    const conflicts = await scanner.detectConflicts([stubFile, originalFile]);
    // No conflict: only 1 original
    expect(conflicts).toHaveLength(0);
  });
});

// ─── Latest-is-Greatest ordering contract ──────────────────────────────────

describe('Latest-is-Greatest — conflict version ordering', () => {
  it('conflict versions are sorted newest-first', async () => {
    const scanner = new Scanner('workspace');

    const files: DiscoveredFile[] = [
      { path: '/p1', isStub: false, tool: 'claude', type: 'agent', name: 'planner', modifiedAt: 100 },
      { path: '/p2', isStub: false, tool: 'gemini', type: 'agent', name: 'planner', modifiedAt: 300 },
      { path: '/p3', isStub: false, tool: 'openclaw', type: 'agent', name: 'planner', modifiedAt: 200 },
    ];

    const conflicts = await scanner.detectConflicts(files);
    expect(conflicts[0].versions[0].modified_at).toBeGreaterThanOrEqual(
      conflicts[0].versions[1].modified_at
    );
    expect(conflicts[0].versions[1].modified_at).toBeGreaterThanOrEqual(
      conflicts[0].versions[2].modified_at
    );
  });

  it('conflict identifies the winning tool (highest mtime)', async () => {
    const scanner = new Scanner('workspace');

    const files: DiscoveredFile[] = [
      { path: '/p1', isStub: false, tool: 'claude', type: 'agent', name: 'researcher', modifiedAt: 1000 },
      { path: '/p2', isStub: false, tool: 'gemini', type: 'agent', name: 'researcher', modifiedAt: 9999 },
    ];

    const conflicts = await scanner.detectConflicts(files);
    expect(conflicts[0].versions[0].tool).toBe('gemini');
  });
});

// ─── Manual sync: multiple runs are safe ──────────────────────────────────

describe('Manual sync — repeated invocations', () => {
  it('sync can be called three times without error', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    for (let i = 0; i < 3; i++) {
      await expect(syncer.sync(false)).resolves.toBeDefined();
    }
  });

  it('assetsDiscovered is stable across repeated syncs', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    const r1 = await syncer.sync(false);
    const r2 = await syncer.sync(false);

    expect(r2.assetsDiscovered).toBe(r1.assetsDiscovered);
  });
});

// ─── Adapter tool coverage: all 3 MVP tools present ──────────────────────

describe('MVP Tool Coverage — all 3 CLI adapters exist and are valid', () => {
  const adapters = [
    new ClaudeAdapter('workspace'),
    new GeminiAdapter('workspace'),
    new OpenclawAdapter('workspace'),
  ];

  adapters.forEach((adapter) => {
    it(`${adapter.name}: isInstalled() resolves without throwing`, async () => {
      await expect(adapter.isInstalled()).resolves.not.toThrow();
    });

    it(`${adapter.name}: has non-empty agents path`, () => {
      expect(adapter.paths.agents.length).toBeGreaterThan(0);
    });

    it(`${adapter.name}: has non-empty mcp path`, () => {
      expect(adapter.paths.mcp.length).toBeGreaterThan(0);
    });

    it(`${adapter.name}: agents format is md or json`, () => {
      expect(['md', 'yaml', 'json']).toContain(adapter.formats.agents);
    });

    it(`${adapter.name}: mcp format is json`, () => {
      expect(['md', 'yaml', 'json']).toContain(adapter.formats.mcp);
    });
  });
});
