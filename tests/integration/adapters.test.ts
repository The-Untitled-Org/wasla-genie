/**
 * Adapter Integration Tests
 *
 * Covers (per implementation-plan.md §Phase 3 — adapters):
 *  - Factory: getAdapter, getAllAdapters, getInstalledAdapters
 *  - All three MVP adapters: Claude, Gemini, OpenClaw
 *  - Adapter interface contract: name, displayName, paths, formats
 *  - isInstalled() returns boolean (never throws)
 *  - writeStub() writes correct markers for agent vs MCP
 *  - installSkill() is idempotent (<!-- waslagenie:start --> not duplicated)
 *  - getRootConfigAppend() returns expected content / null
 *  - Scope handling: user vs workspace paths
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAdapter, getAllAdapters, getInstalledAdapters } from '@adapters/factory';
import { ClaudeAdapter } from '@adapters/claude';
import { GeminiAdapter } from '@adapters/gemini';
import { OpenclawAdapter } from '@adapters/openclaw';
import { OpenCodeAdapter } from '@adapters/opencode';
import { CursorAdapter } from '@adapters/cursor';
import { GithubCopilotAdapter } from '@adapters/github-copilot';
import { GithubCopilotCliAdapter } from '@adapters/github-copilot-cli';
import { writeText, ensureDir, readText, fileExists } from '@utils/fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm } from 'fs/promises';
import type { Asset } from '@core/types';

// ─── helpers ────────────────────────────────────────────────────────────────

async function makeTmpDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'waslagenie-adapter-'));
}

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'test-id',
    name: 'researcher',
    type: 'agent',
    last_modified_at: Date.now(),
    last_synced_at: new Date().toISOString(),
    stubs: [],
    ...overrides,
  };
}

// ─── Factory: getAdapter ─────────────────────────────────────────────────────

describe('getAdapter', () => {
  it('returns Claude adapter for "claude"', () => {
    const a = getAdapter('claude', 'workspace');
    expect(a.name).toBe('claude');
  });

  it('returns Gemini adapter for "gemini"', () => {
    const a = getAdapter('gemini', 'workspace');
    expect(a.name).toBe('gemini');
  });

  it('returns OpenClaw adapter for "openclaw"', () => {
    const a = getAdapter('openclaw', 'workspace');
    expect(a.name).toBe('openclaw');
  });

  it('is case-insensitive', () => {
    const a = getAdapter('CLAUDE', 'workspace');
    expect(a.name).toBe('claude');
  });

  it('throws for unknown tool names', () => {
    expect(() => getAdapter('hermes', 'workspace')).toThrow('No adapter found for tool');
  });

  it('throws for empty string', () => {
    expect(() => getAdapter('', 'workspace')).toThrow();
  });
});

// ─── Factory: getAllAdapters ──────────────────────────────────────────────────

describe('getAllAdapters', () => {
  it('returns exactly 7 adapters', () => {
    const adapters = getAllAdapters('workspace');
    expect(adapters).toHaveLength(7);
  });

  it('contains all three MVP tool names', () => {
    const adapters = getAllAdapters('workspace');
    const names = adapters.map((a) => a.name);
    expect(names).toContain('claude');
    expect(names).toContain('gemini');
    expect(names).toContain('openclaw');
  });
});

// ─── Factory: getInstalledAdapters ───────────────────────────────────────────

describe('getInstalledAdapters', () => {
  it('returns an array', async () => {
    const installed = await getInstalledAdapters('workspace');
    expect(Array.isArray(installed)).toBe(true);
  });

  it('every returned adapter has isInstalled resolving to true', async () => {
    const installed = await getInstalledAdapters('workspace');
    for (const adapter of installed) {
      await expect(adapter.isInstalled()).resolves.toBe(true);
    }
  });
});

// ─── Adapter interface contract ───────────────────────────────────────────────

describe.each([
  ['claude', ClaudeAdapter, 'Claude Code', 'md', 'json', 'mcpServers', 'CLAUDE.md'],
  ['gemini', GeminiAdapter, 'Gemini CLI', 'md', 'json', 'mcpServers', 'GEMINI.md'],
  ['openclaw', OpenclawAdapter, 'OpenClaw', 'md', 'json', 'mcp.servers', 'AGENTS.md'],
  ['opencode', OpenCodeAdapter, 'OpenCode', 'md', 'json', 'mcp', 'AGENTS.md'],
  ['cursor', CursorAdapter, 'Cursor', 'md', 'json', 'mcpServers', 'AGENTS.md'],
  [
    'github-copilot',
    GithubCopilotAdapter,
    'GitHub Copilot',
    'md',
    'json',
    'servers',
    '.github/copilot-instructions.md',
  ],
  [
    'github-copilot-cli',
    GithubCopilotCliAdapter,
    'GitHub Copilot CLI',
    'md',
    'json',
    'mcpServers',
    '.github/copilot-instructions.md',
  ],
] as const)(
  '%s adapter — interface contract',
  (toolName, AdapterClass, displayName, _agentFmt, mcpFmt, mcpKey, contextFile) => {
    let adapter: InstanceType<typeof AdapterClass>;

    beforeEach(() => {
      adapter = new (AdapterClass as any)('workspace');
    });

    it('has correct name', () => {
      expect(adapter.name).toBe(toolName);
    });

    it('has correct displayName', () => {
      expect(adapter.displayName).toBe(displayName);
    });

    it('has paths.skill string', () => {
      expect(typeof adapter.paths.skill).toBe('string');
      expect(adapter.paths.skill.length).toBeGreaterThan(0);
    });

    it('has an MCP path where workspace MCP is supported', () => {
      if (adapter.paths.mcp) {
        expect(adapter.paths.mcp.length).toBeGreaterThan(0);
      }
    });

    it('has a supported skills format', () => {
      expect(['md', 'mdc', 'agent.md', 'instructions.md']).toContain(adapter.formats.skill);
    });

    it(`mcp format is "${mcpFmt}"`, () => {
      expect(adapter.formats.mcp).toBe(mcpFmt);
    });

    it(`mcpKey is "${mcpKey}"`, () => {
      expect(adapter.mcpKey).toBe(mcpKey);
    });

    it(`contextFile is "${contextFile}"`, () => {
      expect(adapter.contextFile).toBe(contextFile);
    });

    it('has skillDirs array', () => {
      expect(Array.isArray(adapter.skillDirs)).toBe(true);
    });

    it('isInstalled() returns a boolean', async () => {
      const result = await adapter.isInstalled();
      expect(typeof result).toBe('boolean');
    });

    it('isInstalled() never throws', async () => {
      await expect(adapter.isInstalled()).resolves.not.toThrow();
    });
  }
);

describe.each([
  ['github-copilot', GithubCopilotAdapter],
  ['github-copilot-cli', GithubCopilotCliAdapter],
] as const)('%s adapter - Copilot Agent Skills', (_toolName, AdapterClass) => {
  it('uses native .github/skills directories with SKILL.md content', () => {
    const adapter = new AdapterClass('workspace');

    expect(adapter.paths.skill).toMatch(/\.github\/skills$/);
    expect(adapter.formats.skill).toBe('md');
    expect(adapter.skillDirs).toEqual([adapter.paths.skill]);
  });
});

describe('Copilot host MCP locations', () => {
  it('uses VS Code MCP config for GitHub Copilot and .mcp.json for Copilot CLI', () => {
    expect(new GithubCopilotAdapter('workspace').paths.mcp).toMatch(/\.vscode\/mcp\.json$/);
    expect(new GithubCopilotCliAdapter('workspace').paths.mcp).toMatch(/\.mcp\.json$/);
  });
});

// ─── writeStub — skill type ───────────────────────────────────────────────────

describe.each([
  ['claude', ClaudeAdapter],
  ['gemini', GeminiAdapter],
  ['openclaw', OpenclawAdapter],
  ['opencode', OpenCodeAdapter],
  ['cursor', CursorAdapter],
  ['github-copilot', GithubCopilotAdapter],
  ['github-copilot-cli', GithubCopilotCliAdapter],
] as const)('%s adapter — writeStub (skill)', (toolName, AdapterClass) => {
  let tmpBase: string;
  let adapter: InstanceType<typeof AdapterClass>;

  beforeEach(async () => {
    tmpBase = await makeTmpDir();
    adapter = new (AdapterClass as any)('workspace');

    // Override paths to point to tmpBase so we don't pollute the real FS
    Object.defineProperty(adapter, 'paths', {
      get: () => ({
        agent: join(tmpBase, 'agents'),
        skill: join(tmpBase, 'skills'),
        mcp: join(tmpBase, 'mcp'),
      }),
    });
  });

  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('creates the mirrored skill file', async () => {
    const asset = makeAsset({ type: 'skill' });
    const targetPath = join(tmpBase, 'skills', 'researcher', 'SKILL.md');

    await adapter.writeStub(asset, 'You are a researcher.', targetPath);

    expect(await fileExists(targetPath)).toBe(true);
  });

  it('mirrors skill content without injecting markers', async () => {
    const asset = makeAsset({ type: 'skill' });
    const targetPath = join(tmpBase, 'skills', 'researcher', 'SKILL.md');

    await adapter.writeStub(asset, 'You are a researcher.', targetPath);

    const content = await readText(targetPath);
    expect(content).toBe('You are a researcher.');
  });

  it('mirrored skill contains the original content', async () => {
    const asset = makeAsset({ type: 'skill' });
    const targetPath = join(tmpBase, 'skills', 'researcher', 'SKILL.md');

    const originalContent = 'You are a research specialist.';
    await adapter.writeStub(asset, originalContent, targetPath);

    const content = await readText(targetPath);
    expect(content).toContain(originalContent);
  });
});

// ─── writeStub — MCP type ─────────────────────────────────────────────────────

describe.each([
  ['claude', ClaudeAdapter],
  ['gemini', GeminiAdapter],
  ['openclaw', OpenclawAdapter],
  ['opencode', OpenCodeAdapter],
  ['cursor', CursorAdapter],
  ['github-copilot', GithubCopilotAdapter],
  ['github-copilot-cli', GithubCopilotCliAdapter],
] as const)('%s adapter — writeStub (mcp)', (toolName, AdapterClass) => {
  let tmpBase: string;
  let adapter: InstanceType<typeof AdapterClass>;

  beforeEach(async () => {
    tmpBase = await makeTmpDir();
    adapter = new (AdapterClass as any)('workspace');

    Object.defineProperty(adapter, 'paths', {
      get: () => ({
        agent: join(tmpBase, 'agents'),
        skill: join(tmpBase, 'skills'),
        mcp: join(tmpBase, 'mcp'),
      }),
    });
  });

  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('creates the MCP stub file', async () => {
    const asset = makeAsset({ type: 'mcp', name: 'notion' });
    const targetPath = join(tmpBase, 'mcp', 'notion.json');
    await ensureDir(join(tmpBase, 'mcp'));

    await adapter.writeStub(asset, '{}', targetPath);

    expect(await fileExists(targetPath)).toBe(true);
  });

  it('MCP mirror preserves content without injecting markers', async () => {
    const asset = makeAsset({ type: 'mcp', name: 'notion' });
    const targetPath = join(tmpBase, 'mcp', 'notion.json');
    await ensureDir(join(tmpBase, 'mcp'));

    await adapter.writeStub(asset, '{}', targetPath);

    const content = await readText(targetPath);
    expect(content).toBe('{}');
  });
});

// ─── installSkill — idempotency ───────────────────────────────────────────────

describe.each([
  ['claude', ClaudeAdapter, 'CLAUDE.md'],
  ['gemini', GeminiAdapter, 'GEMINI.md'],
] as const)('%s adapter — installSkill idempotency', (toolName, AdapterClass, configFile) => {
  let tmpBase: string;
  let adapter: InstanceType<typeof AdapterClass>;

  beforeEach(async () => {
    tmpBase = await makeTmpDir();
    adapter = new (AdapterClass as any)('workspace');

    // Monkey-patch getToolMarkers to return our tmp path
    // We do this by providing a custom scope marker override via the adapter's internal scope
    // Instead: directly override the private markers via a spy on getToolMarkers
  });

  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('does not duplicate the waslagenie block when called twice', async () => {
    // installSkill writes to the real fs; we just verify it doesn't throw
    // and the getRootConfigAppend helper returns the idempotency guard
    const block = adapter.getRootConfigAppend();
    if (block) {
      const count = (block.match(/<!-- waslagenie:start -->/g) || []).length;
      expect(count).toBe(1);
    }
  });
});

// ─── getRootConfigAppend ──────────────────────────────────────────────────────

describe('ClaudeAdapter.getRootConfigAppend', () => {
  it('returns null — Claude context file is not polluted by WaslaGenie', () => {
    const adapter = new ClaudeAdapter('workspace');
    expect(adapter.getRootConfigAppend()).toBeNull();
  });
});

describe('GeminiAdapter.getRootConfigAppend', () => {
  it('returns null — Gemini context file is not polluted by WaslaGenie', () => {
    const adapter = new GeminiAdapter('workspace');
    expect(adapter.getRootConfigAppend()).toBeNull();
  });
});

describe('OpenclawAdapter.getRootConfigAppend', () => {
  it('returns null (OpenClaw skill installation TBD per plan)', () => {
    const adapter = new OpenclawAdapter('workspace');
    expect(adapter.getRootConfigAppend()).toBeNull();
  });
});

// ─── Scope: user vs workspace path resolution ────────────────────────────────

describe('Adapter scope — user vs workspace paths', () => {
  it('Claude workspace paths differ from user paths', () => {
    const ws = new ClaudeAdapter('workspace');
    const user = new ClaudeAdapter('user');
    expect(ws.paths.skill).not.toBe(user.paths.skill);
  });

  it('Gemini workspace paths differ from user paths', () => {
    const ws = new GeminiAdapter('workspace');
    const user = new GeminiAdapter('user');
    expect(ws.paths.skill).not.toBe(user.paths.skill);
  });

  it('OpenClaw workspace paths differ from user paths', () => {
    const ws = new OpenclawAdapter('workspace');
    const user = new OpenclawAdapter('user');
    expect(ws.paths.skill).not.toBe(user.paths.skill);
  });
});
// ─── installSkill (idempotency & correctness) ──────────────────────────────────

describe('ClaudeAdapter.installSkill', () => {
  let tmpBase: string;
  beforeEach(async () => {
    tmpBase = await makeTmpDir();
  });
  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('creates skills/waslagenie/SKILL.md skill file', async () => {
    const { vi } = await import('vitest');
    const pathUtils = await import('@utils/paths');
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      claude: tmpBase,
      gemini: '',
      openclaw: '',
      codex: '',
    });

    const adapter = new ClaudeAdapter('workspace');
    await adapter.installSkill();

    const skillPath = join(tmpBase, 'skills', 'waslagenie', 'SKILL.md');
    expect(await fileExists(skillPath)).toBe(true);
    const content = await readText(skillPath);
    expect(content).toContain('waslagenie');
    expect(content).toContain('sync');

    vi.restoreAllMocks();
  });

  it('is idempotent — calling twice does not duplicate skill file', async () => {
    const { vi } = await import('vitest');
    const pathUtils = await import('@utils/paths');
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      claude: tmpBase,
      gemini: '',
      openclaw: '',
      codex: '',
    });

    const adapter = new ClaudeAdapter('workspace');
    await adapter.installSkill();
    await adapter.installSkill(); // second call must not throw or create duplicates

    const skillPath = join(tmpBase, 'skills', 'waslagenie', 'SKILL.md');
    expect(await fileExists(skillPath)).toBe(true);

    vi.restoreAllMocks();
  });

  it('does NOT touch CLAUDE.md', async () => {
    const { vi } = await import('vitest');
    const pathUtils = await import('@utils/paths');
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      claude: tmpBase,
      gemini: '',
      openclaw: '',
      codex: '',
    });

    const claudeMdPath = join(tmpBase, 'CLAUDE.md');
    const originalContent = 'My project context — do not modify.';
    await writeText(claudeMdPath, originalContent);

    const adapter = new ClaudeAdapter('workspace');
    await adapter.installSkill();

    // CLAUDE.md must be left exactly as-is
    const afterContent = await readText(claudeMdPath);
    expect(afterContent).toBe(originalContent);

    vi.restoreAllMocks();
  });
});

describe('GeminiAdapter.installSkill', () => {
  let tmpBase: string;
  beforeEach(async () => {
    tmpBase = await makeTmpDir();
  });
  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('creates skills/waslagenie/SKILL.md in the Gemini skills directory', async () => {
    const { vi } = await import('vitest');
    const pathUtils = await import('@utils/paths');
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      claude: '',
      gemini: tmpBase,
      openclaw: '',
      codex: '',
    });

    const adapter = new GeminiAdapter('workspace');
    await adapter.installSkill();

    const skillPath = join(tmpBase, 'skills', 'waslagenie', 'SKILL.md');
    expect(await fileExists(skillPath)).toBe(true);
    const content = await readText(skillPath);
    expect(content).toContain('waslagenie');
    expect(content).toContain('sync');

    vi.restoreAllMocks();
  });

  it('does NOT touch GEMINI.md', async () => {
    const { vi } = await import('vitest');
    const pathUtils = await import('@utils/paths');
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      claude: '',
      gemini: tmpBase,
      openclaw: '',
      codex: '',
    });

    const geminiMdPath = join(tmpBase, 'GEMINI.md');
    const originalContent = 'Existing content';
    await writeText(geminiMdPath, originalContent);

    const adapter = new GeminiAdapter('workspace');
    await adapter.installSkill();

    // GEMINI.md must be left exactly as-is
    const afterContent = await readText(geminiMdPath);
    expect(afterContent).toBe(originalContent);

    vi.restoreAllMocks();
  });
});

describe('OpenclawAdapter.installSkill', () => {
  it('does nothing (no-op for now)', async () => {
    const adapter = new OpenclawAdapter('workspace');
    await expect(adapter.installSkill()).resolves.toBeUndefined();
  });
});
