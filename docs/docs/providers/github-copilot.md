---
id: github-copilot
title: GitHub Copilot in VS Code Provider Contract
sidebar_label: GitHub Copilot
---

# GitHub Copilot in VS Code Provider Contract

`github-copilot` means Copilot hosted in VS Code. It is not a separate `vscode` provider.

## Native Paths

| Asset | Workspace path | Wasla behavior |
|-------|----------------|----------------|
| Custom agent | `.github/agents/<name>.agent.md` | Read and write as an `agent` |
| Agent Skill | `.github/skills/<name>/SKILL.md` | Read and write as a `skill` |
| Repository instructions | `.github/copilot-instructions.md` | Read and write as `context` |
| Scoped instructions | `.github/instructions/*.instructions.md` | Separate instruction feature; not an agent |
| MCP servers | `.vscode/mcp.json` (`servers`) | Merge servers by name and translate server transport |

## MCP Translation

VS Code uses `servers` and represents the transport explicitly. WaslaGenie converts a portable stdio server into this native form:

```json
{
  "servers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  }
}
```

Remote portable MCP entries with a `url` are written using `type: "http"`.

## Sync Mapping

```text
.claude/agents/reviewer.md        -> .github/agents/reviewer.agent.md
.gemini/skills/research/SKILL.md  -> .github/skills/research/SKILL.md
.mcp.json:mcpServers.postgres     -> .vscode/mcp.json:servers.postgres
GEMINI.md                         -> .github/copilot-instructions.md
```

Custom-agent files and instruction files remain distinct assets. WaslaGenie does not create `.github/instructions` when synchronizing an agent.

## Official References

- VS Code Custom Agents: https://code.visualstudio.com/docs/copilot/customization/custom-agents
- VS Code Copilot Settings: https://code.visualstudio.com/docs/copilot/reference/copilot-settings
