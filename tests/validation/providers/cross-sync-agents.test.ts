import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@core/scanner';
import { writeText, ensureDir, fileExists, readText } from '@utils/fs';
import * as pathUtils from '@utils/paths';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm, utimes } from 'fs/promises';

describe('Cross-Provider Sync: Skills', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'waslagenie-e2e-agents-'));

    const markers = {
      claude: join(tmpBase, '.claude'),
      gemini: join(tmpBase, '.gemini'),
      openclaw: join(tmpBase, '.openclaw'),
      opencode: join(tmpBase, '.opencode'),
      cursor: join(tmpBase, '.cursor'),
      'github-copilot': join(tmpBase, '.vscode-fake'),
      'github-copilot-cli': join(tmpBase, '.github-fake'),
    };

    // Create the base directories so that isInstalled() returns true for all of them
    for (const dir of Object.values(markers)) {
      await ensureDir(dir);
    }

    // Mock the tool markers to point to our temp directory
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue(markers);
    vi.spyOn(pathUtils, 'getRegistryPath').mockReturnValue(
      join(tmpBase, '.waslagenie', 'registry.json')
    );
    vi.spyOn(pathUtils, 'getRegistryDir').mockReturnValue(join(tmpBase, '.waslagenie'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('syncs a Gemini skill to supported providers with mirrored content', async () => {
    // 1. Simulate Gemini creating a skill
    const geminiSkillDir = join(tmpBase, '.gemini', 'skills', 'researcher');
    await ensureDir(geminiSkillDir);
    const geminiSkillPath = join(geminiSkillDir, 'SKILL.md');
    const skillContent = '# Researcher\n\nYou are an AI researcher.';
    await writeText(geminiSkillPath, skillContent);
    await ensureDir(join(tmpBase, '.opencode', 'skills'));

    // 2. Initialize Core system
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    // 3. Run targeted sync to providers with different native skill formats.
    await syncer.syncToTool('gemini', ['claude', 'cursor', 'opencode', 'github-copilot']);

    // 4. Assert that the skill was correctly propagated to other providers

    const claudeMirror = join(tmpBase, '.claude', 'skills', 'researcher', 'SKILL.md');
    expect(await fileExists(claudeMirror), 'Claude skill mirror should exist').toBe(true);
    expect(await readText(claudeMirror)).toBe(skillContent);

    // Cursor maps skills to native Agent Skills.
    const cursorMirror = join(tmpBase, '.cursor', 'skills', 'researcher', 'SKILL.md');
    expect(await fileExists(cursorMirror), 'Cursor skill mirror should exist').toBe(true);
    expect(await readText(cursorMirror)).toBe(skillContent);

    // OpenCode maps skills to native Agent Skills.
    const opencodeMirror = join(tmpBase, '.opencode', 'skills', 'researcher', 'SKILL.md');
    expect(await fileExists(opencodeMirror), 'OpenCode skill mirror should exist').toBe(true);
    expect(await readText(opencodeMirror)).toBe(skillContent);

    // VS Code Copilot uses Agent Skills folders with SKILL.md.
    const githubCopilotMirror = join(tmpBase, '.github', 'skills', 'researcher', 'SKILL.md');
    expect(await fileExists(githubCopilotMirror), 'GitHub Copilot skill mirror should exist').toBe(
      true
    );
    expect(await readText(githubCopilotMirror)).toBe(skillContent);
  });

  it('syncs Gemini workspace context to native Claude workspace context', async () => {
    const geminiContext = join(tmpBase, 'GEMINI.md');
    const contextContent = '# Shared project context\n';
    await writeText(geminiContext, contextContent);

    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    await syncer.syncToTool('gemini', ['claude']);

    const claudeContext = join(tmpBase, 'CLAUDE.md');
    expect(await readText(claudeContext)).toBe(contextContent);
  });

  it('syncs a Claude custom agent to each provider native custom-agent surface', async () => {
    const claudeAgentPath = join(tmpBase, '.claude', 'agents', 'researcher.md');
    const agentContent =
      '---\nname: researcher\ndescription: Investigates the codebase.\n---\n\nInvestigate the codebase.\n';
    await ensureDir(join(tmpBase, '.claude', 'agents'));
    await writeText(claudeAgentPath, agentContent);

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.syncToTool('claude', [
      'gemini',
      'opencode',
      'cursor',
      'github-copilot',
      'github-copilot-cli',
    ]);

    const geminiAgentPath = join(tmpBase, '.gemini', 'agents', 'researcher.md');
    expect(await readText(geminiAgentPath)).toBe(agentContent);
    expect(await readText(join(tmpBase, '.opencode', 'agents', 'researcher.md'))).toBe(
      agentContent
    );
    expect(await readText(join(tmpBase, '.cursor', 'agents', 'researcher.md'))).toBe(agentContent);
    expect(await readText(join(tmpBase, '.github', 'agents', 'researcher.agent.md'))).toBe(
      agentContent
    );
    expect(await readText(join(tmpBase, '.github-fake', 'agents', 'researcher.agent.md'))).toBe(
      agentContent
    );
  });

  it('unifies new skills from both tools and mirrors the newest edit', async () => {
    const claudeSkill = join(tmpBase, '.claude', 'skills', 'from-claude', 'SKILL.md');
    const geminiSkill = join(tmpBase, '.gemini', 'skills', 'from-gemini', 'SKILL.md');
    await ensureDir(join(tmpBase, '.claude', 'skills', 'from-claude'));
    await ensureDir(join(tmpBase, '.gemini', 'skills', 'from-gemini'));
    await writeText(claudeSkill, '# From Claude\n');
    await writeText(geminiSkill, '# From Gemini\n');

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');
    await syncer.sync(false);

    expect(await readText(join(tmpBase, '.gemini', 'skills', 'from-claude', 'SKILL.md'))).toBe(
      '# From Claude\n'
    );
    expect(await readText(join(tmpBase, '.claude', 'skills', 'from-gemini', 'SKILL.md'))).toBe(
      '# From Gemini\n'
    );

    await writeText(geminiSkill, '# Edited In Gemini\n');
    const newer = new Date(Date.now() + 2_000);
    await utimes(geminiSkill, newer, newer);
    await syncer.sync(false);

    expect(await readText(join(tmpBase, '.claude', 'skills', 'from-gemini', 'SKILL.md'))).toBe(
      '# Edited In Gemini\n'
    );
  });

  it('propagates a deleted targeted-source skill when the mirror was unchanged', async () => {
    const claudeSkillDir = join(tmpBase, '.claude', 'skills', 'removable');
    const claudeSkill = join(claudeSkillDir, 'SKILL.md');
    await ensureDir(claudeSkillDir);
    await writeText(claudeSkill, '# Remove me\n');

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');
    await syncer.syncToTool('claude', ['gemini']);

    const geminiSkill = join(tmpBase, '.gemini', 'skills', 'removable', 'SKILL.md');
    expect(await fileExists(geminiSkill)).toBe(true);

    await rm(claudeSkillDir, { recursive: true, force: true });
    const result = await syncer.syncToTool('claude', ['gemini']);

    expect(result.stubsDeleted).toBeGreaterThan(0);
    expect(await fileExists(geminiSkill)).toBe(false);
    expect(registry.findAsset('removable', 'skill')).toBeUndefined();
  });

  it('propagates a deleted skill during full bidirectional sync', async () => {
    const claudeSkillDir = join(tmpBase, '.claude', 'skills', 'full-sync-delete');
    const claudeSkill = join(claudeSkillDir, 'SKILL.md');
    await ensureDir(claudeSkillDir);
    await writeText(claudeSkill, '# Full sync remove me\n');

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');
    await syncer.sync(false);

    const geminiSkill = join(tmpBase, '.gemini', 'skills', 'full-sync-delete', 'SKILL.md');
    expect(await fileExists(geminiSkill)).toBe(true);

    await rm(claudeSkillDir, { recursive: true, force: true });
    const result = await syncer.sync(false);

    expect(result.stubsDeleted).toBeGreaterThan(0);
    expect(await fileExists(geminiSkill)).toBe(false);
  });

  it('preserves an edited survivor when another synchronized skill copy was deleted', async () => {
    const claudeSkillDir = join(tmpBase, '.claude', 'skills', 'edited-survivor');
    const claudeSkill = join(claudeSkillDir, 'SKILL.md');
    await ensureDir(claudeSkillDir);
    await writeText(claudeSkill, '# Initial\n');

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    const geminiSkill = join(tmpBase, '.gemini', 'skills', 'edited-survivor', 'SKILL.md');
    await writeText(geminiSkill, '# Edited In Gemini After Sync\n');
    const newer = new Date(Date.now() + 2_000);
    await utimes(geminiSkill, newer, newer);
    await rm(claudeSkillDir, { recursive: true, force: true });

    await syncer.sync(false);

    expect(await readText(claudeSkill)).toBe('# Edited In Gemini After Sync\n');
    expect(await readText(geminiSkill)).toBe('# Edited In Gemini After Sync\n');
  });
});
