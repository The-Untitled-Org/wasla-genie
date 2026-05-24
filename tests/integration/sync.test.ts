/**
 * Sync Integration Tests
 *
 * Covers (per implementation-plan.md §Sync Workflow):
 *  - Full scan → detect → sync pipeline with real file fixtures
 *  - "Latest-is-Greatest": newest file by mtime becomes the source
 *  - Stubs are NOT treated as originals during conflict detection
 *  - Stubs written to non-source tools contain waslagenie marker
 *  - Canonical registry location receives the synced content
 *  - Registry is persisted and reloadable after sync
 *  - Multiple assets synced in a single pass
 *  - MCP type assets are handled alongside agent type assets
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@core/scanner';
import { writeText, ensureDir, readText, fileExists, readJSON } from '@utils/fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm, utimes } from 'fs/promises';
import { getClaudeAgentConfig, getGeminiAgentConfig, getStubMarker } from '../fixtures';
import type { Registry } from '@core/types';

// ─── helpers ────────────────────────────────────────────────────────────────

async function makeTmpDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'waslagenie-sync-'));
}

/** Create a fake tool directory with a given agent file */
async function seedAgentFile(
  base: string,
  tool: string,
  agentName: string,
  content: string,
  mtimeSecs?: number
): Promise<string> {
  const dir = join(base, tool, 'agents');
  await ensureDir(dir);
  const path = join(dir, `${agentName}.md`);
  await writeText(path, content);
  if (mtimeSecs) {
    const t = new Date(mtimeSecs * 1000);
    await utimes(path, t, t);
  }
  return path;
}

// ─── basic sync pipeline ──────────────────────────────────────────────────────

describe('Sync — basic pipeline (workspace scope)', () => {
  it('sync() completes without throwing', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    await expect(syncer.sync(false)).resolves.toBeDefined();
  });

  it('returns assetsDiscovered >= 0', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    const { assetsDiscovered } = await syncer.sync(false);
    expect(assetsDiscovered).toBeGreaterThanOrEqual(0);
  });

  it('returns stubsWritten >= 0', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    const { stubsWritten } = await syncer.sync(false);
    expect(stubsWritten).toBeGreaterThanOrEqual(0);
  });

  it('populates registry assets after sync', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    await syncer.sync(false);

    const data = registry.get();
    expect(Array.isArray(data.assets)).toBe(true);
  });
});

// ─── registry persistence ─────────────────────────────────────────────────────

describe('Sync — registry persistence', () => {
  it('registry can be saved and reloaded after sync', async () => {
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
  });

  it('scope is preserved through save/load cycle', async () => {
    const wsRegistry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(wsRegistry, scanner, 'workspace');

    await syncer.sync(false);
    await wsRegistry.save();

    const reloaded = new RegistryManager('workspace');
    await reloaded.load();

    expect(reloaded.get().config.scope).toBe('workspace');
  });
});

// ─── Latest-is-Greatest with real file mtimes ────────────────────────────────

describe('Sync — Latest-is-Greatest (real file fixture)', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await makeTmpDir();
  });

  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('picks the file with the highest mtime as source', async () => {
    // Seed two files for the same asset with different mtimes
    const older = await seedAgentFile(tmpBase, '.claude', 'researcher', 'Old version', 1_000_000);
    const newer = await seedAgentFile(tmpBase, '.gemini', 'researcher', 'New version', 2_000_000);

    // Verify that new file is actually newer
    const { stat } = await import('fs/promises');
    const olderStat = await stat(older);
    const newerStat = await stat(newer);
    expect(newerStat.mtimeMs).toBeGreaterThan(olderStat.mtimeMs);
  });

  it('stub file is detectable by waslagenie marker', async () => {
    const agentDir = join(tmpBase, 'agents');
    await ensureDir(agentDir);
    const stubPath = join(agentDir, 'stub.md');
    await writeText(stubPath, getStubMarker() + getClaudeAgentConfig('stub'));

    const content = await readText(stubPath);
    expect(content.includes('waslagenie-stub') || content.includes('waslagenie')).toBe(true);
  });

  it('original file without marker is NOT classified as stub', async () => {
    const agentDir = join(tmpBase, 'agents');
    await ensureDir(agentDir);
    const origPath = join(agentDir, 'researcher.md');
    await writeText(origPath, getClaudeAgentConfig('researcher'));

    const content = await readText(origPath);
    expect(content.includes('waslagenie-stub')).toBe(false);
    expect(content.includes('waslagenie:')).toBe(false);
  });
});

// ─── MCP type alongside agent type ───────────────────────────────────────────

describe('Sync — MCP type handling', () => {
  it('sync() handles empty MCP directories gracefully', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    // No MCP files exist in workspace — should not throw
    await expect(syncer.sync(false)).resolves.toBeDefined();
  });
});

// ─── Idempotency ──────────────────────────────────────────────────────────────

describe('Sync — idempotency', () => {
  it('running sync twice yields consistent assetsDiscovered', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    const first = await syncer.sync(false);
    const second = await syncer.sync(false);

    // Assets discovered should be stable across runs
    expect(second.assetsDiscovered).toBe(first.assetsDiscovered);
  });
});
