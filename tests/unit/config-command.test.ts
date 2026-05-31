import { beforeEach, describe, expect, it, vi } from 'vitest';

const { promptsMock, writeConfiguredScopeMock } = vi.hoisted(() => ({
  promptsMock: vi.fn(),
  writeConfiguredScopeMock: vi.fn(),
}));

vi.mock('prompts', () => ({
  default: promptsMock,
}));

vi.mock('../../src/utils/config.js', () => ({
  getConfigPath: vi.fn(() => '/home/test/.waslagenie/config.json'),
  getConfiguredRegistryPath: vi.fn((scope: string) =>
    scope === 'user'
      ? '/home/test/.waslagenie/registry.json'
      : '/workspace/.waslagenie/registry.json'
  ),
  readConfiguredScope: vi.fn(async () => null),
  writeConfiguredScope: writeConfiguredScopeMock,
}));

vi.mock('../../src/utils/cli-output.js', () => ({
  section: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  spacer: vi.fn(),
  info: vi.fn(),
}));

import { configCommand } from '../../src/cli/commands/config.js';

describe('configCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks for a scope when called without options', async () => {
    promptsMock.mockResolvedValue({ scope: 'workspace' });

    await configCommand({});

    expect(promptsMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'select', name: 'scope' })
    );
    expect(writeConfiguredScopeMock).toHaveBeenCalledWith('workspace');
  });

  it('keeps --scope available for non-interactive use', async () => {
    await configCommand({ scope: 'user' });

    expect(promptsMock).not.toHaveBeenCalled();
    expect(writeConfiguredScopeMock).toHaveBeenCalledWith('user');
  });
});
