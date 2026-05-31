import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  success,
  error,
  info,
  warning,
  highlight,
  metric,
  assetList,
  step,
  section,
  table,
  spacer,
  bulletPoint,
  code,
  banner,
} from '@utils/cli-output';

describe('cli-output utilities', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('success prints with ✔ marker', () => {
    success('Done');
    expect(consoleLogSpy).toHaveBeenCalledWith('\u001b[32m✔  Done\u001b[0m');
  });

  it('banner prints the WaslaGenie wordmark', () => {
    banner();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('____'));
  });

  it('error prints with ✗ marker to console.error', () => {
    error('Failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith('\u001b[31m✗  Failed\u001b[0m');
  });

  it('info prints with ℹ marker', () => {
    info('Info');
    expect(consoleLogSpy).toHaveBeenCalledWith('\u001b[34mℹ  Info\u001b[0m');
  });

  it('warning prints with ⚠ marker', () => {
    warning('Warning');
    expect(consoleLogSpy).toHaveBeenCalledWith('\u001b[33m⚠  Warning\u001b[0m');
  });

  it('highlight prints with ✨ marker', () => {
    highlight('Shiny');
    expect(consoleLogSpy).toHaveBeenCalledWith('\u001b[35m\u001b[1m✨ Shiny\u001b[0m');
  });

  it('metric prints a padded colored label and bold value', () => {
    metric('Assets', 3);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '  \u001b[34mAssets              \u001b[0m \u001b[1m3\u001b[0m'
    );
  });

  it('assetList groups assets and hides inactive providers', () => {
    assetList(
      [
        {
          id: 'skill-1',
          name: 'reviewer',
          type: 'skill',
          last_modified_at: 0,
          last_synced_at: '2026-05-31T00:00:00.000Z',
          stubs: [
            { tool: 'claude', path: '/claude/reviewer', written_at: '', hash: '' },
            { tool: 'openclaw', path: '/openclaw/reviewer', written_at: '', hash: '' },
          ],
        },
      ],
      false,
      ['claude']
    );

    expect(consoleLogSpy).toHaveBeenCalledWith('\u001b[36m\u001b[1m  SKILLS (1)\u001b[0m');
    expect(consoleLogSpy).toHaveBeenCalledWith('    \u001b[34mMirrors:\u001b[0m claude');
    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('openclaw'));
  });

  it('assetList prints timestamps and none when no active mirror remains', () => {
    assetList(
      [
        {
          id: 'mcp-1',
          name: 'workspace-files',
          type: 'mcp',
          last_modified_at: 0,
          last_synced_at: '2026-05-31T00:00:00.000Z',
          stubs: [{ tool: 'openclaw', path: '/openclaw/mcp.json', written_at: '', hash: '' }],
        },
      ],
      true,
      ['claude']
    );

    expect(consoleLogSpy).toHaveBeenCalledWith('\u001b[36m\u001b[1m  MCP SERVERS (1)\u001b[0m');
    expect(consoleLogSpy).toHaveBeenCalledWith('    \u001b[34mMirrors:\u001b[0m none');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Updated:'));
  });

  it('assetList shows all providers when activeProviders is undefined', () => {
    assetList(
      [
        {
          id: 'skill-1',
          name: 'reviewer',
          type: 'skill',
          last_modified_at: 0,
          last_synced_at: '2026-05-31T00:00:00.000Z',
          stubs: [
            { tool: 'claude', path: '/claude/reviewer', written_at: '', hash: '' },
            { tool: 'gemini', path: '/gemini/reviewer', written_at: '', hash: '' },
          ],
        },
      ],
      false
    );

    expect(consoleLogSpy).toHaveBeenCalledWith('\u001b[36m\u001b[1m  SKILLS (1)\u001b[0m');
    expect(consoleLogSpy).toHaveBeenCalledWith('    \u001b[34mMirrors:\u001b[0m claude, gemini');
  });

  it('step prints with newline', () => {
    step('Step 1');
    expect(consoleLogSpy).toHaveBeenCalledWith('\nStep 1');
  });

  it('section prints with newline and 🔍 marker', () => {
    section('Scan');
    expect(consoleLogSpy).toHaveBeenCalledWith('\u001b[34m\u001b[1m\n🔍 Scan\u001b[0m');
  });

  it('spacer prints an empty line', () => {
    spacer();
    expect(consoleLogSpy).toHaveBeenCalledWith('');
  });

  it('bulletPoint prints with proper indent and • marker', () => {
    bulletPoint('Item', 1);
    expect(consoleLogSpy).toHaveBeenCalledWith('  • Item');
  });

  it('bulletPoint defaults to 0 indent', () => {
    bulletPoint('Item');
    expect(consoleLogSpy).toHaveBeenCalledWith('• Item');
  });

  it('code wraps string in backticks', () => {
    expect(code('text')).toBe('`text`');
  });

  describe('table function', () => {
    it('does nothing if rows are empty', () => {
      table([]);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('prints a table with auto-calculated widths', () => {
      table([
        ['A', 'LongColumn', 'C'],
        ['Short', 'B', 'ExtraLongColumn'],
      ]);
      // Column 0 width = max('A', 'Short') = 5
      // Column 1 width = max('LongColumn', 'B') = 10
      // Column 2 width = max('C', 'ExtraLongColumn') = 15

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, 'A      LongColumn  C              ');
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, 'Short  B           ExtraLongColumn');
    });

    it('prints a table with specific column widths', () => {
      table([['Col1', 'Col2']], [10, 10]);
      expect(consoleLogSpy).toHaveBeenCalledWith('Col1        Col2      ');
    });

    it('handles undefined cells gracefully', () => {
      // @ts-expect-error forcing undefined
      table([['Valid', undefined]]);
      expect(consoleLogSpy).toHaveBeenCalledWith('Valid            ');
    });
  });
});
