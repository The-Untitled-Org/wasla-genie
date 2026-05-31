import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

describe('Visualizer UI asset pipeline', () => {
  it('logo is present in apps/visualizer/public/', () => {
    expect(existsSync(resolve('apps/visualizer/public/logo.png'))).toBe(true);
  });

  it('waslagenie provider icon URL is /logo.png', async () => {
    const { PROVIDER_ICONS } = await import('@cli/server/visualizer-server.js');
    expect(PROVIDER_ICONS.waslagenie).toBe('/logo.png');
  });

  it('PROVIDER_ICONS does not contain the old branding API route', async () => {
    const { PROVIDER_ICONS } = await import('@cli/server/visualizer-server.js');
    expect(Object.values(PROVIDER_ICONS)).not.toContain('/api/branding/waslagenie-logo');
  });

  it('renders measured hub connectors instead of overflow satellite lines', () => {
    const app = readFileSync(resolve('apps/visualizer/src/VisualizerApp.tsx'), 'utf-8');
    const theme = readFileSync(resolve('apps/visualizer/src/theme/design-system.ts'), 'utf-8');

    expect(app).toContain('<svg className="provider-connectors"');
    expect(app).toContain('data-provider-slot={provider.id}');
    expect(theme).not.toContain('.provider-satellites');
    expect(theme).not.toContain('.provider-satellite-slot');
  });
});
