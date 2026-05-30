import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';

describe('package.json npm publish config', () => {
  it('has a files field that includes dist and src/visualizer/dist', () => {
    expect((pkg as Record<string, unknown>).files).toEqual(['dist', 'src/visualizer/dist']);
  });

  it('has a prepublishOnly script that builds both UI and CLI', () => {
    expect(pkg.scripts.prepublishOnly).toBe('npm run visualizer:build && npm run build');
  });
});
