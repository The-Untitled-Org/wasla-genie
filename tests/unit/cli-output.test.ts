import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  success,
  error,
  info,
  warning,
  highlight,
  step,
  section,
  table,
  spacer,
  bulletPoint,
  code,
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
    expect(consoleLogSpy).toHaveBeenCalledWith('✔  Done');
  });

  it('error prints with ✗ marker to console.error', () => {
    error('Failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith('✗  Failed');
  });

  it('info prints with ℹ marker', () => {
    info('Info');
    expect(consoleLogSpy).toHaveBeenCalledWith('ℹ  Info');
  });

  it('warning prints with ⚠ marker', () => {
    warning('Warning');
    expect(consoleLogSpy).toHaveBeenCalledWith('⚠  Warning');
  });

  it('highlight prints with ✨ marker', () => {
    highlight('Shiny');
    expect(consoleLogSpy).toHaveBeenCalledWith('✨ Shiny');
  });

  it('step prints with newline', () => {
    step('Step 1');
    expect(consoleLogSpy).toHaveBeenCalledWith('\nStep 1');
  });

  it('section prints with newline and 🔍 marker', () => {
    section('Scan');
    expect(consoleLogSpy).toHaveBeenCalledWith('\n🔍 Scan');
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
