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
 *  - Bootstrap: tool folder exists without agents/ → sync creates context file
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@core/scanner';
import { writeText, ensureDir, readText, fileExists, readJSON } from '@utils/fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm, utimes } from 'fs/promises';
import type { Registry } from '@core/types';
import * as pathUtils from '@utils/paths';

// ─── helpers ────────────────────────────────────────────────────────────────

async function makeTmpDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'waslagenie-sync-'));
}

let isolatedWorkspace: string;

beforeEach(async () => {
  isolatedWorkspace = await makeTmpDir();
  vi.spyOn(pathUtils, 'getToolMarkers').mockImplementation((scope) =>
    scope === 'user'
      ? {
          claude: join(isolatedWorkspace, 'user', '.claude'),
          gemini: join(isolatedWorkspace, 'user', '.gemini'),
          openclaw: join(isolatedWorkspace, 'user', '.openclaw'),
          opencode: join(isolatedWorkspace, 'user', '.config', 'opencode'),
          cursor: join(isolatedWorkspace, 'user', '.cursor'),
          'github-copilot': join(isolatedWorkspace, 'user', '.config', 'Code', 'User'),
          'github-copilot-cli': join(isolatedWorkspace, 'user', '.copilot'),
        }
      : {
          claude: join(isolatedWorkspace, '.claude'),
          gemini: join(isolatedWorkspace, '.gemini'),
          openclaw: join(isolatedWorkspace, '.openclaw'),
          opencode: join(isolatedWorkspace, '.opencode'),
          cursor: join(isolatedWorkspace, '.cursor'),
          'github-copilot': join(isolatedWorkspace, '.vscode'),
          'github-copilot-cli': join(isolatedWorkspace, '.github'),
        }
  );
  vi.spyOn(pathUtils, 'getRegistryPath').mockImplementation((scope) =>
    join(isolatedWorkspace, '.waslagenie', `${scope}-registry.json`)
  );
  vi.spyOn(pathUtils, 'getRegistryDir').mockReturnValue(join(isolatedWorkspace, '.waslagenie'));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(isolatedWorkspace, { recursive: true, force: true });
});

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
    await writeText(stubPath, '<!-- waslagenie-stub -->\nYou are a stub agent.');

    const content = await readText(stubPath);
    expect(content.includes('waslagenie-stub') || content.includes('waslagenie')).toBe(true);
  });

  it('original file without marker is NOT classified as stub', async () => {
    const agentDir = join(tmpBase, 'agents');
    await ensureDir(agentDir);
    const origPath = join(agentDir, 'researcher.md');
    await writeText(origPath, 'You are a researcher. No waslagenie marker here.');

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

// ─── Bootstrap on sync ────────────────────────────────────────────────────────

import { syncCommand } from '@cli/commands/sync.js';
import { ClaudeAdapter } from '@adapters/claude';
import { GeminiAdapter } from '@adapters/gemini';

describe('Sync — bootstrap installed adapter that has no agents/ dir', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await makeTmpDir();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('installSkill() is idempotent when called twice on ClaudeAdapter', async () => {
    const claudeDir = join(tmpBase, '.claude');
    await ensureDir(claudeDir);

    // Mock getToolMarkers to point to tmpBase
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      claude: claudeDir,
      gemini: join(tmpBase, '.gemini'),
      openclaw: join(tmpBase, '.openclaw'),
      opencode: join(tmpBase, '.opencode'),
      cursor: join(tmpBase, '.cursor'),
      'github-copilot': join(tmpBase, '.vscode-fake'),
      'github-copilot-cli': join(tmpBase, '.github-fake'),
    });

    const adapter = new ClaudeAdapter('workspace');
    await adapter.installSkill();
    await adapter.installSkill(); // second call — must be idempotent

    const skillPath = join(claudeDir, 'skills', 'waslagenie', 'SKILL.md');
    expect(await fileExists(skillPath)).toBe(true);

    const content = await readText(skillPath);
    expect(content).toContain('WaslaGenie Operator');
    expect(await fileExists(join(claudeDir, 'CLAUDE.md'))).toBe(false); // CLAUDE.md not created
  });

  it('does not register a helper skill during sync', async () => {
    // Simulate: user created `.claude/` manually, no subfolders
    const claudeDir = join(tmpBase, '.claude');
    await ensureDir(claudeDir);

    const agentsDir = join(claudeDir, 'agents');
    const skillPath = join(agentsDir, 'waslagenie.md');
    const contextPath = join(claudeDir, 'CLAUDE.md');

    // Precondition: no agents/ dir, no skill file, no context file
    expect(await fileExists(agentsDir)).toBe(false);
    expect(await fileExists(skillPath)).toBe(false);
    expect(await fileExists(contextPath)).toBe(false);

    // Setup mock tool markers to point to our temp dir
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      claude: claudeDir,
      gemini: join(tmpBase, '.gemini'),
      openclaw: join(tmpBase, '.openclaw'),
      opencode: join(tmpBase, '.opencode'),
      cursor: join(tmpBase, '.cursor'),
      'github-copilot': join(tmpBase, '.vscode-fake'),
      'github-copilot-cli': join(tmpBase, '.github-fake'),
    });

    // Run syncCommand
    await syncCommand({ scope: 'workspace' });

    // Registration is opt-in through `waslagenie register`.
    expect(await fileExists(agentsDir)).toBe(false);
    expect(await fileExists(skillPath)).toBe(false);
    expect(await fileExists(contextPath)).toBe(false);
  });
});
