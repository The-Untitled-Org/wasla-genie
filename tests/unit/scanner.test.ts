import { describe, it, expect } from 'vitest';
import { Scanner } from '@core/scanner';
import type { DiscoveredFile } from '@core/types';

describe('Scanner', () => {
  it('should detect installed tools', async () => {
    const scanner = new Scanner('workspace');
    const tools = await scanner.detectInstalledTools();
    expect(Array.isArray(tools)).toBe(true);
  });

  it('should classify files as originals or stubs', async () => {
    const scanner = new Scanner('workspace');

    // Mock discovered files
    const discovered: DiscoveredFile[] = [
      {
        path: '~/.claude/agents/researcher.md',
        isStub: false,
        tool: 'claude',
        type: 'agent',
        name: 'researcher',
        modifiedAt: Date.now(),
      },
      {
        path: '~/.gemini/agents/researcher.md',
        isStub: true,
        tool: 'gemini',
        type: 'agent',
        name: 'researcher',
        modifiedAt: Date.now(),
      },
    ];

    const conflicts = await scanner.detectConflicts(discovered);
    // Should not report conflict because one is a stub
    expect(conflicts.length).toBe(0);
  });

  it('should detect conflicts between originals', async () => {
    const scanner = new Scanner('workspace');

    const discovered: DiscoveredFile[] = [
      {
        path: '~/.claude/agents/researcher.md',
        isStub: false,
        tool: 'claude',
        type: 'agent',
        name: 'researcher',
        modifiedAt: 1000,
      },
      {
        path: '~/.gemini/agents/researcher.md',
        isStub: false,
        tool: 'gemini',
        type: 'agent',
        name: 'researcher',
        modifiedAt: 2000,
      },
    ];

    const conflicts = await scanner.detectConflicts(discovered);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].asset_name).toBe('researcher');
    // Gemini should be first (latest is greatest, higher timestamp)
    expect(conflicts[0].versions[0].tool).toBe('gemini');
  });
});
