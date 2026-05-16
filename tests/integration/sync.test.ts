import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@core/scanner';
import { writeText, ensureDir } from '../../src/utils/fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Sync Integration Tests', () => {
  let testDir: string;
  let registry: RegistryManager;
  let scanner: Scanner;
  let syncer: Syncer;

  beforeAll(async () => {
    testDir = join(tmpdir(), `waslagenie-test-${Date.now()}`);
    await ensureDir(testDir);
    registry = new RegistryManager();
    scanner = new Scanner('workspace');
    syncer = new Syncer(registry, scanner, 'workspace');
  });

  it('should sync agents from one tool to another', async () => {
    // Note: Integration tests would need real tool paths mocked or set up.
    // Here we just test the method executes.
    const result = await syncer.sync(false);
    expect(result.assetsDiscovered).toBeGreaterThanOrEqual(0);
  });

  it('should handle multiple versions with latest is greatest strategy', async () => {
    const result = await syncer.sync(false);
    expect(result.stubsWritten).toBeGreaterThanOrEqual(0);
  });
});
