import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';

describe('package.json npm publish config', () => {
  it('publishes the compiled dist directory only', () => {
    expect((pkg as Record<string, unknown>).files).toEqual(['dist']);
  });

  it('has a prepublishOnly script that builds both UI and CLI', () => {
    expect(pkg.scripts.prepublishOnly).toBe('npm run build');
    expect(pkg.scripts.build).toBe('npm run visualizer:build && npm run build:cli');
  });

  it('marks the compiled CLI entry point as executable after building', () => {
    expect(pkg.scripts.postbuild).toBe(
      "node -e \"require('fs').chmodSync('dist/apps/cli/src/index.js', 0o755)\""
    );
  });
});
