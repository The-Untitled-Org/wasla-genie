export function getClaudeMcpConfig(): string {
  return JSON.stringify(
    {
      mcpServers: {
        'test-server': {
          command: 'node',
          args: ['index.js'],
        },
      },
    },
    null,
    2
  );
}

export function getGeminiMcpConfig(): string {
  return JSON.stringify(
    {
      mcpServers: {
        'gemini-test-server': {
          command: 'node',
          args: ['gemini.js'],
        },
      },
    },
    null,
    2
  );
}

export function getOpenclawMcpConfig(): string {
  return JSON.stringify(
    {
      mcp: {
        servers: {
          'openclaw-server': {
            command: 'node',
            args: ['openclaw.js'],
          },
        },
      },
    },
    null,
    2
  );
}

export function getVscodeMcpConfig(): string {
  return JSON.stringify(
    {
      servers: {
        'vscode-server': {
          command: 'node',
          args: ['vscode.js'],
        },
      },
    },
    null,
    2
  );
}

export function getCursorMcpConfig(): string {
  return JSON.stringify(
    {
      mcpServers: {
        'cursor-server': {
          command: 'node',
          args: ['cursor.js'],
        },
      },
    },
    null,
    2
  );
}

export function getOpencodeMcpConfig(): string {
  return JSON.stringify(
    {
      mcpServers: {
        'opencode-server': {
          command: 'node',
          args: ['opencode.js'],
        },
      },
    },
    null,
    2
  );
}
