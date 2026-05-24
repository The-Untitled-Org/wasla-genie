import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@core/scanner';
import { writeText, ensureDir, fileExists, readText } from '@utils/fs';
import * as pathUtils from '@utils/paths';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm } from 'fs/promises';
import { getClaudeAgentConfig } from '../../fixtures';

describe('Cross-Provider Sync: Agents', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'waslagenie-e2e-agents-'));

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

    // Mock the tool markers to point to our temp directory
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue(markers);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('syncs a Claude agent to all other providers with correct paths and stubs', async () => {
    // 1. Simulate Claude creating an agent
    const claudeAgentDir = join(tmpBase, '.claude', 'agents');
    await ensureDir(claudeAgentDir);
    const claudeAgentPath = join(claudeAgentDir, 'researcher.md');
    await writeText(claudeAgentPath, getClaudeAgentConfig('researcher'));

    // 2. Initialize Core system
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    // 3. Run Sync
    await syncer.sync(false);

    // 4. Assert that the agent was correctly propagated to other providers

    // Gemini
    const geminiStub = join(tmpBase, '.gemini', 'agents', 'researcher.md');
    expect(await fileExists(geminiStub), 'Gemini agent stub should exist').toBe(true);
    expect(await readText(geminiStub)).toContain('waslagenie-stub');

    // Cursor (uses .cursor/rules)
    const cursorStub = join(tmpBase, '.cursor', 'rules', 'researcher.md');
    expect(await fileExists(cursorStub), 'Cursor rule stub should exist').toBe(true);
    expect(await readText(cursorStub)).toContain('waslagenie-stub');

    // VS Code (uses .github/instructions)
    const vscodeStub = join(tmpBase, '.vscode-fake', '.github', 'instructions', 'researcher.md');
    expect(await fileExists(vscodeStub), 'VS Code instruction stub should exist').toBe(true);
    expect(await readText(vscodeStub)).toContain('waslagenie-stub');

    // OpenCode (uses .opencode/commands)
    const opencodeStub = join(tmpBase, '.opencode', 'commands', 'researcher.json');
    expect(await fileExists(opencodeStub), 'OpenCode command stub should exist').toBe(true);
    expect(await readText(opencodeStub)).toContain('waslagenie-stub');
  });
});
