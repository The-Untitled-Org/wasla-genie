/**
 * Paths & FS Utility Unit Tests
 *
 * Covers (per implementation-plan.md §Phase 2 utils):
 *  - expandTilde — ~ → homedir
 *  - getRegistryPath — user vs workspace scope
 *  - getRegistryDir — user vs workspace scope
 *  - getToolMarkers — user vs workspace, correct tool set
 *  - getToolName — reverse lookup
 *  - getToolDisplayName — human-readable names
 *  - fs helpers: fileExists, isDirectory, listFiles, getFileNameWithoutExt, getFileExtension
 */

import { describe, it, expect } from 'vitest';
import { homedir } from 'os';
import { resolve } from 'path';
import {
  expandTilde,
  getRegistryPath,
  getRegistryDir,
  getToolMarkers,
  getToolName,
  getToolDisplayName,
} from '@utils/paths';
import { getFileName, getFileNameWithoutExt, getFileExtension } from '@utils/fs';

// ─── expandTilde ──────────────────────────────────────────────────────────────

describe('expandTilde', () => {
  it('expands leading ~ to homedir', () => {
    const result = expandTilde('~/.waslagenie/registry.json');
    expect(result).toBe(`${homedir()}/.waslagenie/registry.json`);
  });

  it('returns the path unchanged when it does not start with ~', () => {
    const abs = '/absolute/path/file.json';
    expect(expandTilde(abs)).toBe(abs);
  });

  it('handles bare ~ (just the home directory)', () => {
    expect(expandTilde('~')).toBe(homedir());
  });

  it('handles ~/subdir correctly', () => {
    expect(expandTilde('~/subdir')).toBe(`${homedir()}/subdir`);
  });
});

describe('Path Utilities (Production Mode)', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns user path containing .waslagenie/registry.json', () => {
    const p = getRegistryPath('user');
    expect(p).toContain('.waslagenie');
    expect(p).toContain('registry.json');
  });

  it('returns workspace path relative to cwd', () => {
    const p = getRegistryPath('workspace');
    expect(p).toBe(resolve('.waslagenie/registry.json'));
  });

  it('returns user dir containing .waslagenie', () => {
    const d = getRegistryDir('user');
    expect(d).toContain('.waslagenie');
  });

  it('returns workspace dir as .waslagenie in cwd', () => {
    const d = getRegistryDir('workspace');
    expect(d).toBe(resolve('.waslagenie'));
  });
});

describe('Path Utilities (Test Mode)', () => {
  it('returns output/tests for workspace', () => {
    const p = getRegistryPath('workspace');
    expect(p).toBe(resolve('output/tests/workspace-registry.json'));
  });
});

// ─── getToolMarkers ──────────────────────────────────────────────────────────

describe('getToolMarkers', () => {
  const MVP_TOOLS = ['claude', 'gemini', 'openclaw'];

  it('includes all MVP tools in user scope', () => {
    const markers = getToolMarkers('user');
    MVP_TOOLS.forEach((t) => expect(markers).toHaveProperty(t));
  });

  it('includes all MVP tools in workspace scope', () => {
    const markers = getToolMarkers('workspace');
    MVP_TOOLS.forEach((t) => expect(markers).toHaveProperty(t));
  });

  it('user scope paths are absolute', () => {
    const markers = getToolMarkers('user');
    Object.values(markers).forEach((p) => expect(p.startsWith('/')).toBe(true));
  });

  it('workspace scope paths are absolute', () => {
    const markers = getToolMarkers('workspace');
    Object.values(markers).forEach((p) => expect(p.startsWith('/')).toBe(true));
  });

  it('user scope claude path contains .claude', () => {
    const markers = getToolMarkers('user');
    expect(markers.claude).toContain('.claude');
  });

  it('user scope gemini path contains .gemini', () => {
    const markers = getToolMarkers('user');
    expect(markers.gemini).toContain('.gemini');
  });

  it('user scope openclaw path contains openclaw', () => {
    const markers = getToolMarkers('user');
    expect(markers.openclaw).toContain('openclaw');
  });

  it('workspace scope uses relative-to-cwd paths', () => {
    const markers = getToolMarkers('workspace');
    // workspace paths should be within the current directory
    expect(markers.claude).toBe(resolve('.claude'));
    expect(markers.gemini).toBe(resolve('.gemini'));
  });

  it('defaults to user scope when no argument is given', () => {
    const defaultMarkers = getToolMarkers();
    const userMarkers = getToolMarkers('user');
    expect(defaultMarkers).toEqual(userMarkers);
  });
});

// ─── getToolName ─────────────────────────────────────────────────────────────

describe('getToolName', () => {
  it('returns the tool name for a known user-scope path', () => {
    const markers = getToolMarkers('user');
    expect(getToolName(markers.claude)).toBe('claude');
    expect(getToolName(markers.gemini)).toBe('gemini');
    expect(getToolName(markers.openclaw)).toBe('openclaw');
  });

  it('returns the tool name for a known workspace-scope path', () => {
    const markers = getToolMarkers('workspace');
    expect(getToolName(markers.claude)).toBe('claude');
  });

  it('returns null for an unknown path', () => {
    expect(getToolName('/some/unknown/path')).toBeNull();
  });
});

// ─── getToolDisplayName ───────────────────────────────────────────────────────

describe('getToolDisplayName', () => {
  it('returns "Claude Code" for claude', () => {
    expect(getToolDisplayName('claude')).toBe('Claude Code');
  });

  it('returns "Gemini CLI" for gemini', () => {
    expect(getToolDisplayName('gemini')).toBe('Gemini CLI');
  });

  it('returns "OpenClaw" for openclaw', () => {
    expect(getToolDisplayName('openclaw')).toBe('OpenClaw');
  });

  it('returns the raw key for unknown tools', () => {
    expect(getToolDisplayName('unknown-tool')).toBe('unknown-tool');
  });
});

// ─── fs helpers ───────────────────────────────────────────────────────────────

describe('fs helpers — path string functions', () => {
  describe('getFileName', () => {
    it('extracts the filename from an absolute path', () => {
      expect(getFileName('/home/user/.claude/agents/researcher.md')).toBe('researcher.md');
    });

    it('returns empty string for trailing slash', () => {
      expect(getFileName('/home/user/')).toBe('');
    });
  });

  describe('getFileNameWithoutExt', () => {
    it('strips the extension from a file name', () => {
      expect(getFileNameWithoutExt('/path/to/researcher.md')).toBe('researcher');
    });

    it('strips .json extension', () => {
      expect(getFileNameWithoutExt('/path/to/notion.json')).toBe('notion');
    });

    it('handles file with no extension', () => {
      expect(getFileNameWithoutExt('/path/to/noext')).toBe('noext');
    });
  });

  describe('getFileExtension', () => {
    it('returns md for markdown files', () => {
      expect(getFileExtension('researcher.md')).toBe('md');
    });

    it('returns json for JSON files', () => {
      expect(getFileExtension('config.json')).toBe('json');
    });

    it('getFileExtension returns empty string for files without extension', () => {
      expect(getFileExtension('path/to/README')).toBe('');
    });
  });
});

describe('fs helpers — filesystem interaction', () => {
  let tmpBase: string;

  beforeEach(async () => {
    const { mkdtemp } = await import('fs/promises');
    const { tmpdir } = await import('os');
    const { join } = await import('path');
    tmpBase = await mkdtemp(join(tmpdir(), 'waslagenie-fs-test-'));
  });

  afterEach(async () => {
    const { rm } = await import('fs/promises');
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('isDirectory returns true for directories and false for files or missing paths', async () => {
    const { ensureDir, writeText, isDirectory } = await import('@utils/fs');
    const { join } = await import('path');
    const dir = join(tmpBase, 'dir');
    const file = join(tmpBase, 'file.txt');

    await ensureDir(dir);
    await writeText(file, 'test');

    expect(await isDirectory(dir)).toBe(true);
    expect(await isDirectory(file)).toBe(false);
    expect(await isDirectory(join(tmpBase, 'missing'))).toBe(false);
  });

  it('listFiles returns files with or without extension filtering', async () => {
    const { ensureDir, writeText, listFiles } = await import('@utils/fs');
    const { join } = await import('path');

    await ensureDir(tmpBase);
    await writeText(join(tmpBase, 'a.txt'), 'test');
    await writeText(join(tmpBase, 'b.md'), 'test');
    await ensureDir(join(tmpBase, 'c.dir'));

    const all = await listFiles(tmpBase);
    expect(all).toContain('a.txt');
    expect(all).toContain('b.md');
    expect(all).not.toContain('c.dir'); // ignores dirs

    const txts = await listFiles(tmpBase, '.txt');
    expect(txts).toContain('a.txt');
    expect(txts).not.toContain('b.md');
  });

  it('listFiles returns empty array on error', async () => {
    const { listFiles } = await import('@utils/fs');
    expect(await listFiles('/path/does/not/exist/123')).toEqual([]);
  });

  it('listDirs returns only directories', async () => {
    const { ensureDir, writeText, listDirs } = await import('@utils/fs');
    const { join } = await import('path');

    await ensureDir(join(tmpBase, 'dir1'));
    await ensureDir(join(tmpBase, 'dir2'));
    await writeText(join(tmpBase, 'a.txt'), 'test');

    const dirs = await listDirs(tmpBase);
    expect(dirs).toContain('dir1');
    expect(dirs).toContain('dir2');
    expect(dirs).not.toContain('a.txt');
  });

  it('listDirs returns empty array on error', async () => {
    const { listDirs } = await import('@utils/fs');
    expect(await listDirs('/path/does/not/exist/123')).toEqual([]);
  });
});
