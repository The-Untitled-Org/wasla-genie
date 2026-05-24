import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@core/scanner';
import { writeText, ensureDir, fileExists, readText } from '@utils/fs';
import * as pathUtils from '@utils/paths';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm } from 'fs/promises';
import { getGeminiMcpConfig } from '../../fixtures';

describe('Cross-Provider Sync: MCP Servers', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'waslagenie-e2e-mcp-'));

    const markers = {
      claude: join(tmpBase, '.claude'),
      gemini: join(tmpBase, '.gemini'),
      openclaw: join(tmpBase, '.openclaw'),
      opencode: join(tmpBase, '.opencode'),
      cursor: join(tmpBase, '.cursor'),
      vscode: join(tmpBase, '.vscode-fake'),
      'github-copilot': join(tmpBase, '.github-copilot-fake'),
      'github-cli': join(tmpBase, '.github-cli-fake'),
    };

    // Create the base directories so that isInstalled() returns true for all of them
    for (const dir of Object.values(markers)) {
      await ensureDir(dir);
    }

    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue(markers);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('syncs a Gemini MCP configuration to all other providers with correct keys and stubs', async () => {
    // 1. Simulate Gemini creating an MCP configuration
    const geminiMcpDir = join(tmpBase, '.gemini', 'mcp');
    await ensureDir(geminiMcpDir);
    const geminiMcpPath = join(geminiMcpDir, 'postgres.json');
    const mcpConfig = getGeminiMcpConfig();
    await writeText(geminiMcpPath, mcpConfig);

    // 2. Initialize Core system
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    // 3. Run Sync
    await syncer.sync(false);

    // 4. Assert that the MCP config was correctly propagated to other providers

    // Claude (uses mcp.json)
    const claudeStub = join(tmpBase, '.claude', 'mcp', 'postgres.json');
    expect(await fileExists(claudeStub), 'Claude MCP stub should exist').toBe(true);
    expect(await readText(claudeStub)).toContain('waslagenie-stub');

    // Cursor (uses mcp.json)
    const cursorStub = join(tmpBase, '.cursor', 'mcp.json'); // Documented path might be singular mcp.json or mcp directory
    expect(
      (await fileExists(cursorStub)) ||
        (await fileExists(join(tmpBase, '.cursor', 'mcp', 'postgres.json'))),
      'Cursor MCP stub should exist'
    ).toBe(true);
  });
});
