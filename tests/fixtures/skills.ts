export function getUniversalSkillConfig(name: string = 'test-skill'): string {
  return `---
name: ${name}
---
# Skill definition
`;
}

export function getClaudeSkillConfig(name: string = 'claude-skill'): string {
  return `---
name: ${name}
provider: claude
---
# Claude specific skill
`;
}
