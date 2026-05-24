---
id: opencode
title: OpenCode Provider Contract
sidebar_label: OpenCode
---

# OpenCode Provider Contract

OpenCode has native custom agents and Agent Skills. WaslaGenie targets those surfaces directly; it does not turn skills into commands.

## Native Paths

| Asset | Workspace path | User path | Wasla behavior |
|-------|----------------|-----------|----------------|
| Custom agent | `.opencode/agents/<name>.md` | `~/.config/opencode/agents/<name>.md` | Read and write as an `agent` |
| Agent Skill | `.opencode/skills/<name>/SKILL.md` | `~/.config/opencode/skills/<name>/SKILL.md` | Read and write as a `skill` |
| Instructions | `AGENTS.md` | `~/.config/opencode/AGENTS.md` | Read and write as `context` |
| Config/MCP | `opencode.json` | `~/.config/opencode/opencode.json` | Merge MCP entries under `mcp` |

`commands/` is a different OpenCode capability and is not WaslaGenie's skill destination.

## MCP Translation

WaslaGenie normalizes MCP servers internally and converts the OpenCode representation at the adapter boundary.

```json
{
  "mcp": {
    "filesystem": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "."],
      "enabled": true
    }
  }
}
```

A local OpenCode MCP above syncs to Claude or Gemini as a `command` plus `args` MCP server; syncing in the opposite direction writes the OpenCode array-command form.

## Sync Mapping

```text
.claude/agents/reviewer.md        -> .opencode/agents/reviewer.md
.gemini/skills/research/SKILL.md  -> .opencode/skills/research/SKILL.md
CLAUDE.md                         -> AGENTS.md
```

Agent bodies with shared Markdown/YAML fields can move directly. Conversion of tool permissions and other provider-only frontmatter fields requires an explicit schema mapping and is not claimed as complete.

## Official References

- OpenCode Agents: https://opencode.ai/docs/agents/
- OpenCode Agent Skills: https://opencode.ai/docs/skills/
- OpenCode Config: https://opencode.ai/docs/config/
- OpenCode MCP Servers: https://opencode.ai/docs/mcp-servers/
