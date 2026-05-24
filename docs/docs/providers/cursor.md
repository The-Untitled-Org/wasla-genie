---
id: cursor
title: Cursor Provider Contract
sidebar_label: Cursor
---

# Cursor Provider Contract

WaslaGenie writes portable assets to Cursor's native customization surfaces. Rules are not used as substitutes for agents or skills.

## Native Paths

| Asset | Workspace path | Wasla behavior |
|-------|----------------|----------------|
| Custom agent | `.cursor/agents/<name>.md` | Read and write as an `agent` |
| Agent Skill | `.cursor/skills/<name>/SKILL.md` | Read and write as a `skill` |
| Project instructions | `AGENTS.md` | Read and write as `context` |
| MCP servers | `.cursor/mcp.json` (`mcpServers`) | Merge servers by name |
| Rules | `.cursor/rules/*.mdc` | Separate Cursor instruction feature; not treated as a skill or agent |

`.cursorrules` is a legacy instruction surface and is not WaslaGenie's generated context target.

## Sync Mapping

```text
.claude/agents/reviewer.md        -> .cursor/agents/reviewer.md
.gemini/skills/research/SKILL.md  -> .cursor/skills/research/SKILL.md
.mcp.json:mcpServers.postgres     -> .cursor/mcp.json:mcpServers.postgres
GEMINI.md                         -> AGENTS.md
```

Agent Markdown is mirrored when its frontmatter is portable. Provider-specific agent options are not silently rewritten into Cursor rules.

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
