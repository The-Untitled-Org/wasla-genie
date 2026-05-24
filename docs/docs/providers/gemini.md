---
id: gemini
title: Gemini CLI Provider Contract
sidebar_label: Gemini CLI
---

# Gemini CLI Provider Contract

Gemini CLI supports local custom subagents, Agent Skills, context files, and MCP servers. A Gemini agent is not a skill and is not represented by a section appended to `GEMINI.md`.

## Native Paths

| Asset | Workspace path | User path | Wasla behavior |
|-------|----------------|-----------|----------------|
| Custom subagent | `.gemini/agents/<name>.md` | `~/.gemini/agents/<name>.md` | Read and write as an `agent` |
| Agent Skill | `.gemini/skills/<name>/SKILL.md` | `~/.gemini/skills/<name>/SKILL.md` | Read and write as a `skill` |
| Project context | `GEMINI.md` | `~/.gemini/GEMINI.md` | Read and write as `context` |
| MCP servers | `.gemini/settings.json` | `~/.gemini/settings.json` | Merge entries under `mcpServers` |

Local subagents are Markdown files with YAML frontmatter and execute in an independent context loop. Remote/A2A agents are an additional Gemini capability and are not synthesized by the current Wasla adapter.

## Sync Mapping

```text
.claude/agents/reviewer.md        -> .gemini/agents/reviewer.md
.claude/skills/research/SKILL.md  -> .gemini/skills/research/SKILL.md
.mcp.json:mcpServers.postgres     -> .gemini/settings.json:mcpServers.postgres
CLAUDE.md                         -> GEMINI.md
```

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

- Gemini CLI Subagents: https://github.com/google-gemini/gemini-cli/blob/main/docs/core/subagents.md
- Gemini CLI Agent Skills: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/skills.md
- Gemini CLI Configuration: https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/configuration.md
- Gemini CLI MCP Servers: https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md
