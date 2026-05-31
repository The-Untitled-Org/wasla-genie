import { beforeEach, describe, expect, it, vi } from 'vitest';

const installedAdapters = [
  {
    name: 'claude',
    displayName: 'Claude Code',
    installSkill: vi.fn().mockResolvedValue(undefined),
  },
  {
    name: 'gemini',
    displayName: 'Gemini CLI',
    installSkill: vi.fn().mockResolvedValue(undefined),
  },
];

vi.mock('#adapters/factory.js', () => ({
  getInstalledAdapters: vi.fn(async () => installedAdapters),
}));

vi.mock('#shared/fs.js', () => ({
  ensureDir: vi.fn(async () => undefined),
}));

vi.mock('#shared/paths.js', () => ({
  getRegistryDir: vi.fn(() => '/tmp/.waslagenie'),
}));

vi.mock('#shared/config.js', () => ({
  requireConfiguredScope: vi.fn(async () => 'workspace'),
}));

vi.mock('@cli/cli-output', () => ({
  section: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  highlight: vi.fn(),
  spacer: vi.fn(),
}));

import { registerCommand } from '@cli/commands/register.js';
import { error } from '@cli/cli-output';

describe('registerCommand', () => {
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers skill in all installed providers when --to is not provided', async () => {
    await registerCommand();

    expect(installedAdapters[0].installSkill).toHaveBeenCalledTimes(1);
    expect(installedAdapters[1].installSkill).toHaveBeenCalledTimes(1);
  });

  it('registers only targeted providers when --to is provided', async () => {
    await registerCommand({ to: 'gemini' });

    expect(installedAdapters[0].installSkill).not.toHaveBeenCalled();
    expect(installedAdapters[1].installSkill).toHaveBeenCalledTimes(1);
  });

  it('exits with error for unknown targets', async () => {
    await registerCommand({ to: 'unknown' });

    expect(error).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(installedAdapters[0].installSkill).not.toHaveBeenCalled();
    expect(installedAdapters[1].installSkill).not.toHaveBeenCalled();
  });
});
