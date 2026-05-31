---
id: claude
title: Claude Code Provider Contract
sidebar_label: Claude Code
---

# Claude Code Provider Contract

Claude Code provides native project surfaces for subagents, Agent Skills, project memory, and MCP servers. WaslaGenie reads and writes those native surfaces directly.

## Native Paths

| Asset | Workspace path | User path | Wasla behavior |
|-------|----------------|-----------|----------------|
| Custom agent | `.claude/agents/<name>.md` | `~/.claude/agents/<name>.md` | Read and write as an `agent` |
| Agent Skill | `.claude/skills/<name>/SKILL.md` | `~/.claude/skills/<name>/SKILL.md` | Read and write as a `skill` |
| Project context | `CLAUDE.md` | `~/.claude/CLAUDE.md` | Read and write as `context` |
| MCP servers | `.claude/mcp.json` | Claude user settings | Merge entries under `mcpServers` |

## Sync Mapping

```text
.gemini/agents/reviewer.md        -> .claude/agents/reviewer.md
.gemini/skills/research/SKILL.md  -> .claude/skills/research/SKILL.md
.gemini/settings.json:mcpServers  -> .claude/mcp.json:mcpServers
GEMINI.md                         -> CLAUDE.md
```

Agent Markdown with shared YAML fields such as `name` and `description` can move directly. Claude-only permission, model, or tool configuration is not assumed portable to another provider.

## MCP Example

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  }
}
```

## Official References

- Claude Code Subagents: https://docs.anthropic.com/en/docs/claude-code/sub-agents
- Claude Code Skills: https://docs.anthropic.com/en/docs/claude-code/skills
- Claude Code Memory: https://docs.anthropic.com/en/docs/claude-code/memory
- Claude Code MCP: https://docs.anthropic.com/en/docs/claude-code/mcp
