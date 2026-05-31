import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { writeText } from '@utils/fs';
import * as pathUtils from '@utils/paths';
import {
  getConfigPath,
  readConfiguredScope,
  requireConfiguredScope,
  writeConfiguredScope,
} from '@utils/config';

describe('WaslaGenie CLI config', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'waslagenie-config-'));
    vi.spyOn(pathUtils, 'getRegistryDir').mockReturnValue(tmpBase);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('returns null before a scope is configured', async () => {
    await expect(readConfiguredScope()).resolves.toBeNull();
  });

  it('persists the selected scope independently from registry files', async () => {
    await writeConfiguredScope('workspace');

    expect(getConfigPath()).toBe(join(tmpBase, 'config.json'));
    await expect(readConfiguredScope()).resolves.toBe('workspace');
  });

  it('requires users to configure a scope before operational commands run', async () => {
    await expect(requireConfiguredScope()).rejects.toThrow(
      'Scope is not configured. Run: waslagenie config --scope <user|workspace>'
    );
  });

  it('rejects an invalid persisted scope', async () => {
    await writeText(getConfigPath(), JSON.stringify({ scope: 'invalid' }));

    await expect(readConfiguredScope()).rejects.toThrow('Invalid scope');
  });
});
