export function getClaudeAgentConfig(name: string = 'test-agent'): string {
  return `---
name: ${name}
description: A test agent
---

You are a helpful assistant.
`;
}

export function getGeminiAgentConfig(): string {
  return `You are a Gemini assistant in the workspace.`;
}

export function getCursorRuleConfig(name: string = 'test-rule'): string {
  return `---
description: Test cursor rule
globs: *.ts
---

# ${name}
Test rule content
`;
}

export function getVscodeInstructionConfig(): string {
  return `# VSCode Instructions
Follow these instructions carefully.
`;
}

export function getOpenclawAgentConfig(): string {
  return `# AGENTS

- name: dev
  description: developer
`;
}

export function getOpencodeAgentConfig(): string {
  return JSON.stringify(
    {
      agent: {
        name: 'opencode-agent',
        instructions: 'Opencode agent instructions',
      },
    },
    null,
    2
  );
}

export function getStubMarker(tool: string = 'claude'): string {
  if (tool === 'claude' || tool === 'cursor' || tool === 'vscode') {
    return '<!-- waslagenie-stub -->\n';
  } else if (tool === 'opencode') {
    // Opencode uses JSON format generally, but for agents it might be string/markdown depending on the implementation. Let's provide a generic comment or marker if needed, but standard waslagenie uses `waslagenie-stub` marker in the file.
    return '<!-- waslagenie-stub -->\n';
  }
  return '<!-- waslagenie-stub -->\n';
}
