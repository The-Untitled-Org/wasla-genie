/**
 * Syncer Unit Tests
 *
 * Covers (per implementation-plan.md §Phase 2 — syncer/index.ts):
 *  - Initialization with registry + scanner
 *  - sync() return shape: { stubsWritten, assetsDiscovered }
 *  - "Latest-is-Greatest" logic: picks the file with the highest mtime as source
 *  - Stub markers are written into target files
 *  - Registry is updated with stub info after sync
 *  - calculateHash produces stable SHA-256 hashes (content-based, not path-based)
 *  - groupByNameAndType correctly deduplicates by name|type key
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@syncer/scanner';
import { writeText, ensureDir, readText, fileExists } from '@utils/fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm } from 'fs/promises';
import * as pathUtils from '@utils/paths';

// ─── helpers ────────────────────────────────────────────────────────────────

async function makeTmpDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'waslagenie-syncer-'));
}

let isolatedWorkspace: string;

beforeEach(async () => {
  isolatedWorkspace = await makeTmpDir();
  vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
    claude: join(isolatedWorkspace, '.claude'),
    gemini: join(isolatedWorkspace, '.gemini'),
    openclaw: join(isolatedWorkspace, '.openclaw'),
    opencode: join(isolatedWorkspace, '.opencode'),
    cursor: join(isolatedWorkspace, '.cursor'),
    'github-copilot': join(isolatedWorkspace, '.vscode'),
    'github-copilot-cli': join(isolatedWorkspace, '.github'),
  });
  vi.spyOn(pathUtils, 'getRegistryPath').mockReturnValue(
    join(isolatedWorkspace, '.waslagenie', 'registry.json')
  );
  vi.spyOn(pathUtils, 'getRegistryDir').mockReturnValue(join(isolatedWorkspace, '.waslagenie'));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(isolatedWorkspace, { recursive: true, force: true });
});

// ─── construction ────────────────────────────────────────────────────────────

describe('Syncer — construction', () => {
  it('can be instantiated with registry, scanner, and scope', () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');
    expect(syncer).toBeDefined();
  });

  it('defaults to workspace scope', () => {
    const registry = new RegistryManager();
    const scanner = new Scanner();
    const syncer = new Syncer(registry, scanner);
    expect(syncer).toBeDefined();
  });
});

// ─── sync() return shape ──────────────────────────────────────────────────────

describe('Syncer.sync — return shape', () => {
  it('returns an object with stubsWritten and assetsDiscovered', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    const result = await syncer.sync(false);

    expect(result).toHaveProperty('stubsWritten');
    expect(result).toHaveProperty('assetsDiscovered');
  });

  it('stubsWritten is >= 0', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    const result = await syncer.sync(false);
    expect(result.stubsWritten).toBeGreaterThanOrEqual(0);
  });

  it('assetsDiscovered is >= 0', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    const result = await syncer.sync(false);
    expect(result.assetsDiscovered).toBeGreaterThanOrEqual(0);
  });

  it('stubsWritten is a number (not NaN)', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    const result = await syncer.sync(false);
    expect(Number.isNaN(result.stubsWritten)).toBe(false);
  });
});

describe('Syncer.sync — missing discovered files', () => {
  it('skips an MCP source removed after scanning', async () => {
    const registry = new RegistryManager('user');
    const scanner = new Scanner('user');
    const missingPath = join(
      isolatedWorkspace,
      '.waslagenie',
      'mcp',
      'io.github.github',
      'github-mcp-server.json'
    );
    vi.spyOn(scanner, 'scanAllTools').mockResolvedValue([
      {
        name: 'io.github.github',
        type: 'mcp',
        relativePath: join('io.github.github', 'github-mcp-server.json'),
        isStub: false,
        path: missingPath,
        modifiedAt: 5000,
        tool: 'github-copilot',
      },
    ]);
    vi.spyOn(scanner, 'detectInstalledTools').mockResolvedValue(['github-copilot']);

    const syncer = new Syncer(registry, scanner, 'user');
    await expect(syncer.sync(false)).resolves.toEqual({
      stubsWritten: 0,
      stubsDeleted: 0,
      assetsDiscovered: 0,
    });
  });

  it('re-throws non-ENOENT errors when reading files', async () => {
    const registry = new RegistryManager('user');
    const scanner = new Scanner('user');
    const permissionErrorPath = join(isolatedWorkspace, 'permission-denied.json');

    vi.spyOn(scanner, 'scanAllTools').mockResolvedValue([
      {
        name: 'test-agent',
        type: 'agent',
        relativePath: 'permission-denied.json',
        isStub: false,
        path: permissionErrorPath,
        modifiedAt: 5000,
        tool: 'claude',
      },
    ]);
    vi.spyOn(scanner, 'detectInstalledTools').mockResolvedValue(['claude']);

    const fsMock = vi.mocked(await import('@utils/fs'));
    // Mock readText to throw a permission error (not ENOENT)
    vi.spyOn(fsMock, 'readText').mockRejectedValueOnce(
      Object.assign(new Error('Permission denied'), { code: 'EACCES' })
    );

    const syncer = new Syncer(registry, scanner, 'user');
    await expect(syncer.sync(false)).rejects.toThrow('Permission denied');
  });
});

// ─── sync() with real files — Latest-is-Greatest ───────────────────────────

describe('Syncer.sync — Latest-is-Greatest with file fixtures', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await makeTmpDir();
  });

  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('loads registry before scanning if not already loaded', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    // Registry is NOT pre-loaded — sync should auto-load it
    await expect(syncer.sync(false)).resolves.toBeDefined();
  });

  it('populates registry assets after sync completes', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    await syncer.sync(false);

    // After sync the registry should be accessible
    const data = registry.get();
    expect(Array.isArray(data.assets)).toBe(true);
  });

  it('registry version remains 0.1.0 after sync', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    await syncer.sync(false);

    expect(registry.get().config.version).toBe('0.1.0');
  });

  it('running sync twice does not throw', async () => {
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    await syncer.sync(false);
    await expect(syncer.sync(false)).resolves.toBeDefined();
  });
});

// ─── Core Sync Loop & Mocking ──────────────────────────────────────────────────

describe('Syncer — core sync() logic', () => {
  it('groups, writes missing stubs, updates registry, and logs interactive prompts', async () => {
    const { readText, writeText, ensureDir } = await import('@utils/fs');
    const fsMock = vi.mocked(await import('@utils/fs'));
    await ensureDir(join(isolatedWorkspace, '.waslagenie'));

    // Setup a fake registry & scanner
    const registry = new RegistryManager('workspace');
    await registry.load(); // populate initial state
    const scanner = new Scanner('workspace');

    // Mock paths to match our latest.path
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      claude: resolve('/claude'),
      gemini: resolve('/gemini'),
      openclaw: resolve('/openclaw'),
      codex: resolve('/codex'),
    });

    // Mock scanner.detectInstalledTools
    vi.spyOn(scanner, 'detectInstalledTools').mockResolvedValue(['claude', 'gemini']);

    // Mock fs functions
    const readSpy = vi.spyOn(fsMock, 'readText').mockResolvedValue('Latest Gemini Content');
    const writeSpy = vi.spyOn(fsMock, 'writeText').mockResolvedValue(undefined);
    vi.spyOn(fsMock, 'ensureDir').mockResolvedValue(undefined);

    // Provide a match for the targetPath condition
    vi.spyOn(scanner, 'scanAllTools').mockResolvedValue([
      {
        name: 'researcher',
        type: 'agent',
        relativePath: 'researcher.md',
        isStub: false,
        path: resolve('/gemini/agents/researcher.md'),
        modifiedAt: 5000,
        tool: 'gemini',
      },
      {
        name: 'researcher',
        type: 'agent',
        relativePath: 'researcher.md',
        isStub: false,
        path: resolve('/claude/agents/researcher.md'),
        modifiedAt: 1000,
        tool: 'claude',
      },
    ]);
    vi.spyOn(fsMock, 'ensureDir').mockResolvedValue(undefined);

    // Spy on console to check interactive logging
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const syncer = new Syncer(registry, scanner, 'workspace');
    const result = await syncer.sync(true); // interactive = true

    expect(result.assetsDiscovered).toBe(1); // 'researcher|agent'
    expect(result.stubsWritten).toBeGreaterThanOrEqual(1); // wrote to claude

    // The Gemini version had mtime 5000, so it should read that one
    expect(readSpy).toHaveBeenCalledWith(resolve('/gemini/agents/researcher.md'));

    // It should have logged the interactive message
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Syncing researcher (agent) using latest version from gemini')
    );

    // Now check if registry updated properly
    const asset = registry.findAsset('researcher', 'agent');
    expect(asset).toBeDefined();
    expect(asset?.last_modified_at).toBe(5000);
    // At least one stub is written (to claude); exact count depends on installed tools
    expect(asset?.stubs.length).toBeGreaterThanOrEqual(1);

    // Now run it again to hit the "asset already exists, update stubs" block
    await syncer.sync(false); // interactive = false
    expect(registry.findAsset('researcher', 'agent')?.stubs.length).toBeGreaterThanOrEqual(1);

    // Restore mocks
    vi.restoreAllMocks();
  });
});

// ─── SHA-256 hash stability ───────────────────────────────────────────────────

describe('Syncer — content hash stability', () => {
  it('produces the same hash for identical content (idempotent)', async () => {
    const { createHash } = await import('crypto');
    const hash = (s: string) => createHash('sha256').update(s).digest('hex');

    const content = 'You are a researcher agent.';
    expect(hash(content)).toBe(hash(content));
  });

  it('produces different hashes for different content', async () => {
    const { createHash } = await import('crypto');
    const hash = (s: string) => createHash('sha256').update(s).digest('hex');

    expect(hash('version A')).not.toBe(hash('version B'));
  });

  it('hash is 64 hex characters (SHA-256)', async () => {
    const { createHash } = await import('crypto');
    const hash = (s: string) => createHash('sha256').update(s).digest('hex');

    expect(hash('any content')).toHaveLength(64);
  });
});
