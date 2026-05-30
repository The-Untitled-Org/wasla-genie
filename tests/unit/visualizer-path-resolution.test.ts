import { join } from 'path';
import { pathToFileURL } from 'url';
import { describe, expect, it } from 'vitest';

function fakePkgUrl(suffix: string): string {
  // Build a platform-safe file URL for a fake global install location.
  // pathToFileURL handles the Windows drive-letter requirement.
  const base = process.platform === 'win32'
    ? 'C:/npm/lib/node_modules/wasla-genie'
    : '/usr/lib/node_modules/wasla-genie';
  return pathToFileURL(`${base}/${suffix}`).href;
}

describe('resolveVisualizerDist', () => {
  it('resolves the dist path relative to the module, not process.cwd()', async () => {
    const { resolveVisualizerDist } = await import('../../src/cli/commands/visualizer.js');
    const fakeModuleUrl = fakePkgUrl('dist/cli/commands/visualizer.js');
    const result = resolveVisualizerDist(fakeModuleUrl);

    expect(result).toContain(join('src', 'visualizer', 'dist'));
    expect(result).not.toContain(process.cwd());
    expect(result).toContain(join('wasla-genie', 'src', 'visualizer', 'dist'));
  });

  it('produces a different path from process.cwd()-based resolution', async () => {
    const { resolveVisualizerDist } = await import('../../src/cli/commands/visualizer.js');
    const fakeModuleUrl = fakePkgUrl('dist/cli/commands/visualizer.js');
    const result = resolveVisualizerDist(fakeModuleUrl);

    const cwdBased = join(process.cwd(), 'src/visualizer/dist');
    expect(result).not.toBe(cwdBased);
  });
});
