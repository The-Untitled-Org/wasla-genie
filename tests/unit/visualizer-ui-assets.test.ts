import { existsSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

describe('Visualizer UI asset pipeline', () => {
  it('logo is present in src/visualizer/public/', () => {
    expect(existsSync(resolve('src/visualizer/public/logo.png'))).toBe(true);
  });

  it('waslagenie provider icon URL is /logo.png', async () => {
    const { PROVIDER_ICONS } = await import('../../src/cli/commands/visualizer.js');
    expect(PROVIDER_ICONS.waslagenie).toBe('/logo.png');
  });

  it('PROVIDER_ICONS does not contain the old branding API route', async () => {
    const { PROVIDER_ICONS } = await import('../../src/cli/commands/visualizer.js');
    expect(Object.values(PROVIDER_ICONS)).not.toContain('/api/branding/waslagenie-logo');
  });
});
