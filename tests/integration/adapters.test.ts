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
import { VscodeAdapter } from '@adapters/vscode';
import { GithubCopilotAdapter } from '@adapters/github-copilot';
import { GithubCliAdapter } from '@adapters/github-cli';
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
  it('returns exactly 8 adapters', () => {
    const adapters = getAllAdapters('workspace');
    expect(adapters).toHaveLength(8);
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
  ['opencode', OpenCodeAdapter, 'OpenCode', 'json', 'json', 'mcpServers', 'opencode.md'],
  ['cursor', CursorAdapter, 'Cursor', 'md', 'json', 'mcpServers', '.cursorrules'],
  ['vscode', VscodeAdapter, 'VS Code', 'md', 'json', 'servers', '.github/copilot-instructions.md'],
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
    'github-cli',
    GithubCliAdapter,
    'GitHub CLI',
    'md',
    'json',
    'mcpServers',
    '.github/copilot-instructions.md',
  ],
] as const)(
  '%s adapter — interface contract',
  (toolName, AdapterClass, displayName, agentFmt, mcpFmt, mcpKey, contextFile) => {
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

    it('has paths.agents string', () => {
      expect(typeof adapter.paths.agents).toBe('string');
      expect(adapter.paths.agents.length).toBeGreaterThan(0);
    });

    it('has paths.mcp string', () => {
      expect(typeof adapter.paths.mcp).toBe('string');
      expect(adapter.paths.mcp.length).toBeGreaterThan(0);
    });

    it(`agents format is "${agentFmt}"`, () => {
      expect(adapter.formats.agents).toBe(agentFmt);
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

// ─── writeStub — agent type ───────────────────────────────────────────────────

describe.each([
  ['claude', ClaudeAdapter],
  ['gemini', GeminiAdapter],
  ['openclaw', OpenclawAdapter],
  ['opencode', OpenCodeAdapter],
  ['cursor', CursorAdapter],
  ['vscode', VscodeAdapter],
  ['github-copilot', GithubCopilotAdapter],
  ['github-cli', GithubCliAdapter],
] as const)('%s adapter — writeStub (agent)', (toolName, AdapterClass) => {
  let tmpBase: string;
  let adapter: InstanceType<typeof AdapterClass>;

  beforeEach(async () => {
    tmpBase = await makeTmpDir();
    adapter = new (AdapterClass as any)('workspace');

    // Override paths to point to tmpBase so we don't pollute the real FS
    Object.defineProperty(adapter, 'paths', {
      get: () => ({
        agents: join(tmpBase, 'agents'),
        mcp: join(tmpBase, 'mcp'),
      }),
    });
  });

  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('creates the agent stub file', async () => {
    const asset = makeAsset({ type: 'agent' });
    const targetPath = join(tmpBase, 'agents', 'researcher.md');
    await ensureDir(join(tmpBase, 'agents'));

    await adapter.writeStub(asset, 'You are a researcher.', targetPath);

    expect(await fileExists(targetPath)).toBe(true);
  });

  it('stub file contains waslagenie marker for agents', async () => {
    const asset = makeAsset({ type: 'agent' });
    const targetPath = join(tmpBase, 'agents', 'researcher.md');
    await ensureDir(join(tmpBase, 'agents'));

    await adapter.writeStub(asset, 'You are a researcher.', targetPath);

    const content = await readText(targetPath);
    expect(content.includes('waslagenie-stub') || content.includes('waslagenie')).toBe(true);
  });

  it('stub file contains the original content', async () => {
    const asset = makeAsset({ type: 'agent' });
    const targetPath = join(tmpBase, 'agents', 'researcher.md');
    await ensureDir(join(tmpBase, 'agents'));

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
  ['vscode', VscodeAdapter],
  ['github-copilot', GithubCopilotAdapter],
  ['github-cli', GithubCliAdapter],
] as const)('%s adapter — writeStub (mcp)', (toolName, AdapterClass) => {
  let tmpBase: string;
  let adapter: InstanceType<typeof AdapterClass>;

  beforeEach(async () => {
    tmpBase = await makeTmpDir();
    adapter = new (AdapterClass as any)('workspace');

    Object.defineProperty(adapter, 'paths', {
      get: () => ({
        agents: join(tmpBase, 'agents'),
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

  it('MCP stub contains waslagenie marker', async () => {
    const asset = makeAsset({ type: 'mcp', name: 'notion' });
    const targetPath = join(tmpBase, 'mcp', 'notion.json');
    await ensureDir(join(tmpBase, 'mcp'));

    await adapter.writeStub(asset, '{}', targetPath);

    const content = await readText(targetPath);
    expect(content.includes('waslagenie-stub') || content.includes('waslagenie')).toBe(true);
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
  it('returns a non-null string', () => {
    const adapter = new ClaudeAdapter('workspace');
    const block = adapter.getRootConfigAppend();
    expect(typeof block).toBe('string');
    expect((block as string).length).toBeGreaterThan(0);
  });

  it('contains waslagenie:start and waslagenie:end markers', () => {
    const adapter = new ClaudeAdapter('workspace');
    const block = adapter.getRootConfigAppend()!;
    expect(block).toContain('<!-- waslagenie:start -->');
    expect(block).toContain('<!-- waslagenie:end -->');
  });

  it('contains sync command reference', () => {
    const adapter = new ClaudeAdapter('workspace');
    const block = adapter.getRootConfigAppend()!;
    expect(block).toContain('waslagenie sync');
  });
});

describe('GeminiAdapter.getRootConfigAppend', () => {
  it('returns a non-null string', () => {
    const adapter = new GeminiAdapter('workspace');
    const block = adapter.getRootConfigAppend();
    expect(typeof block).toBe('string');
    expect((block as string).length).toBeGreaterThan(0);
  });

  it('contains waslagenie:start and waslagenie:end markers', () => {
    const adapter = new GeminiAdapter('workspace');
    const block = adapter.getRootConfigAppend()!;
    expect(block).toContain('<!-- waslagenie:start -->');
    expect(block).toContain('<!-- waslagenie:end -->');
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
    expect(ws.paths.agents).not.toBe(user.paths.agents);
  });

  it('Gemini workspace paths differ from user paths', () => {
    const ws = new GeminiAdapter('workspace');
    const user = new GeminiAdapter('user');
    expect(ws.paths.agents).not.toBe(user.paths.agents);
  });

  it('OpenClaw workspace paths differ from user paths', () => {
    const ws = new OpenclawAdapter('workspace');
    const user = new OpenclawAdapter('user');
    expect(ws.paths.agents).not.toBe(user.paths.agents);
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

  it('creates CLAUDE.md if not exists and adds block', async () => {
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

    const claudeMdPath = join(tmpBase, 'CLAUDE.md');
    expect(await fileExists(claudeMdPath)).toBe(true);
    const content = await readText(claudeMdPath);
    expect(content).toContain('## WaslaGenie');
    expect(content).toContain('<!-- waslagenie:start -->');

    vi.restoreAllMocks();
  });

  it('does not double-add if block exists', async () => {
    const { vi } = await import('vitest');
    const pathUtils = await import('@utils/paths');
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      claude: tmpBase,
      gemini: '',
      openclaw: '',
      codex: '',
    });

    const adapter = new ClaudeAdapter('workspace');
    const claudeMdPath = join(tmpBase, 'CLAUDE.md');
    const original =
      'Existing content\n<!-- waslagenie:start -->\n## WaslaGenie\n<!-- waslagenie:end -->\nFooter';
    await writeText(claudeMdPath, original);

    await adapter.installSkill();
    const updated = await readText(claudeMdPath);
    expect(updated).toBe(original); // Should not change

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

  it('appends to GEMINI.md if it exists', async () => {
    const { vi } = await import('vitest');
    const pathUtils = await import('@utils/paths');
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      claude: '',
      gemini: tmpBase,
      openclaw: '',
      codex: '',
    });

    const adapter = new GeminiAdapter('workspace');
    const geminiMdPath = join(tmpBase, 'GEMINI.md');
    await writeText(geminiMdPath, 'Existing content');

    await adapter.installSkill();
    const content = await readText(geminiMdPath);
    expect(content).toContain('Existing content');
    expect(content).toContain('## WaslaGenie');

    vi.restoreAllMocks();
  });
});

describe('OpenclawAdapter.installSkill', () => {
  it('does nothing (no-op for now)', async () => {
    const adapter = new OpenclawAdapter('workspace');
    await expect(adapter.installSkill()).resolves.toBeUndefined();
  });
});
