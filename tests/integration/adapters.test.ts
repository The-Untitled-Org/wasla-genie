import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@core/scanner';
import { getAdapter } from '@adapters/factory';

describe('Adapter Integration Tests', () => {
  it('should get Claude Code adapter', async () => {
    const adapter = getAdapter('claude', 'workspace');
    expect(adapter).toBeDefined();
    expect(adapter.name).toBe('claude');
  });

  it('should get Gemini adapter', () => {
    const adapter = getAdapter('gemini', 'workspace');
    expect(adapter).toBeDefined();
    expect(adapter.name).toBe('gemini');
  });

  it('should get OpenCode adapter', () => {
    const adapter = getAdapter('openclaw', 'workspace');
    expect(adapter).toBeDefined();
    expect(adapter.name).toBe('openclaw');
  });

  it('should detect installed tools', async () => {
    const tools = await getAdapter('claude', 'workspace').isInstalled();
    expect(typeof tools).toBe('boolean');
  });
});
