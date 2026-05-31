import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@syncer/scanner';
import { writeText, ensureDir, fileExists, readText } from '@utils/fs';
import * as pathUtils from '@utils/paths';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm } from 'fs/promises';

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
      'github-copilot': join(tmpBase, '.vscode-fake'),
      'github-copilot-cli': join(tmpBase, '.github-fake'),
    };

    // Create the base directories so that isInstalled() returns true for all of them
    for (const dir of Object.values(markers)) {
      await ensureDir(dir);
    }

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

  it('syncs a Gemini MCP configuration to other providers as mirrored content', async () => {
    // 1. Simulate Gemini creating an MCP configuration in native settings.
    const geminiMcpPath = join(tmpBase, '.gemini', 'settings.json');
    const serverConfig = { command: 'node', args: ['postgres-mcp'] };
    await writeText(
      geminiMcpPath,
      JSON.stringify({
        mcpServers: {
          postgres: { ...serverConfig, cwd: '.', trust: false },
        },
      })
    );
    await ensureDir(join(tmpBase, '.opencode', 'skills'));

    // 2. Initialize Core system
    const registry = new RegistryManager('workspace');
    const scanner = new Scanner('workspace');
    const syncer = new Syncer(registry, scanner, 'workspace');

    // 3. Run Sync
    await syncer.sync(false);
    await syncer.syncToTool('gemini', ['github-copilot', 'github-copilot-cli']);

    // 4. Assert that the MCP config was correctly propagated to other providers

    // Claude stores workspace MCPs in .claude/mcp.json.
    const claudeStub = join(tmpBase, '.claude', 'mcp.json');
    expect(await fileExists(claudeStub), 'Claude MCP mirror should exist').toBe(true);
    expect(JSON.parse(await readText(claudeStub)).mcpServers.postgres).toEqual(serverConfig);

    // Cursor stores MCPs in .cursor/mcp.json.
    const cursorStub = join(tmpBase, '.cursor', 'mcp.json');
    expect(await fileExists(cursorStub), 'Cursor MCP mirror should exist').toBe(true);
    expect(JSON.parse(await readText(cursorStub)).mcpServers.postgres).toEqual(serverConfig);

    // OpenCode uses opencode.json and its native array command structure.
    const openCodeStub = join(tmpBase, 'opencode.json');
    expect(await fileExists(openCodeStub), 'OpenCode MCP mirror should exist').toBe(true);
    expect(JSON.parse(await readText(openCodeStub)).mcp.postgres).toEqual({
      type: 'local',
      command: ['node', 'postgres-mcp'],
      enabled: true,
    });

    // GitHub Copilot's local VS Code host stores MCPs in .vscode/mcp.json.
    const githubCopilotStub = join(tmpBase, '.vscode-fake', 'mcp.json');
    expect(await fileExists(githubCopilotStub), 'GitHub Copilot MCP mirror should exist').toBe(
      true
    );
    expect(JSON.parse(await readText(githubCopilotStub)).servers.postgres).toEqual({
      type: 'stdio',
      ...serverConfig,
    });

    // GitHub Copilot CLI shares mcpServers shape but writes to its own workspace file.
    expect(registry.findAsset('postgres', 'mcp')?.stubs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tool: 'github-copilot-cli', path: join(tmpBase, '.mcp.json') }),
      ])
    );
  });

  it('normalizes an OpenCode local MCP before writing provider-native configurations', async () => {
    const openCodeMcp = join(tmpBase, 'opencode.json');
    await writeText(
      openCodeMcp,
      JSON.stringify({
        mcp: {
          filesystem: {
            type: 'local',
            command: ['npx', '-y', '@modelcontextprotocol/server-filesystem', '.'],
            enabled: true,
          },
        },
      })
    );
    await ensureDir(join(tmpBase, '.opencode', 'skills'));

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.syncToTool('opencode', ['gemini', 'claude']);

    const expected = {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
    };
    expect(
      JSON.parse(await readText(join(tmpBase, '.gemini', 'settings.json'))).mcpServers.filesystem
    ).toEqual(expected);
    expect(
      JSON.parse(await readText(join(tmpBase, '.claude', 'mcp.json'))).mcpServers.filesystem
    ).toEqual(expected);
  });

  it('attaches and detaches one MCP server from a selected provider', async () => {
    const geminiMcpPath = join(tmpBase, '.gemini', 'settings.json');
    await writeText(
      geminiMcpPath,
      JSON.stringify({ mcpServers: { local: { command: 'node', args: ['server.js'] } } })
    );
    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );

    await syncer.attachAssetToTool('local', 'mcp', 'gemini', 'claude');
    const claudeMcpPath = join(tmpBase, '.claude', 'mcp.json');
    expect(JSON.parse(await readText(claudeMcpPath)).mcpServers.local).toEqual({
      command: 'node',
      args: ['server.js'],
    });

    await syncer.detachAssetFromTool('local', 'mcp', 'claude');
    expect(JSON.parse(await readText(claudeMcpPath)).mcpServers.local).toBeUndefined();
    expect(JSON.parse(await readText(geminiMcpPath)).mcpServers.local).toBeDefined();
  });
});
