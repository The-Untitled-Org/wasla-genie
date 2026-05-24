---
id: github-copilot-cli
title: GitHub Copilot CLI Provider Contract
sidebar_label: Copilot CLI
---

# GitHub Copilot CLI Provider Contract

GitHub Copilot CLI has its own execution host, while sharing the repository `.github` customization convention with Copilot.

## Native Paths

| Asset | Workspace path | User path | Wasla behavior |
|-------|----------------|-----------|----------------|
| Custom agent | `.github/agents/<name>.agent.md` | `~/.copilot/agents/<name>.agent.md` | Read and write as an `agent` |
| Agent Skill | `.github/skills/<name>/SKILL.md` | `~/.copilot/skills/<name>/SKILL.md` | Read and write as a `skill` |
| Instructions | `.github/copilot-instructions.md` | `~/.copilot/copilot-instructions.md` | Read and write as `context` |
| MCP servers | `.mcp.json` | `~/.copilot/mcp-config.json` | Merge entries under `mcpServers` |

## Sync Mapping

```text
.claude/agents/reviewer.md        -> .github/agents/reviewer.agent.md
.gemini/skills/research/SKILL.md  -> .github/skills/research/SKILL.md
.gemini/settings.json:mcpServers  -> .mcp.json:mcpServers
```

The CLI can discover and invoke repository custom agents; an agent is not represented by `.github/instructions/*.instructions.md`.

## Official References

- GitHub Copilot CLI Custom Agents: https://docs.github.com/copilot/how-tos/copilot-cli/use-copilot-cli-agents/invoke-custom-agents
- GitHub Copilot CLI Config Directory: https://docs.github.com/copilot/reference/copilot-cli-reference/cli-config-dir-reference
