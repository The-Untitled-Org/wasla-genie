---
id: index
title: Providers Overview
sidebar_label: Overview
sidebar_position: 1
---

# Supported Providers

WaslaGenie supports a growing list of AI providers, orchestrators, and coding assistants.
This section provides detailed configuration guides for integrating WaslaGenie with each supported provider.

## Available Providers

| Provider | Agent Format | MCP Config | Skills/Instructions | Context File |
|----------|-------------|------------|-------------------|--------------|
| [Claude Code](./claude.md) | `.claude/agents/*.md` (YAML frontmatter) | `.mcp.json` (`mcpServers`) | `.claude/skills/*/SKILL.md` | `CLAUDE.md` |
| [Gemini CLI](./gemini.md) | `.gemini/agents/*.md` | `.gemini/settings.json` (`mcpServers`) | `.gemini/skills/*/SKILL.md` | `GEMINI.md` |
| [OpenClaw](./openclaw.md) | Experimental: native contract still being verified | Experimental | Experimental | `AGENTS.md` |
| [OpenCode](./opencode.md) | `.opencode/agents/*.md` | `opencode.json` (`mcp`) | `.opencode/skills/*/SKILL.md` | `AGENTS.md` |
| [Cursor](./cursor.md) | `.cursor/agents/*.md` | `.cursor/mcp.json` (`mcpServers`) | `.cursor/skills/*/SKILL.md` | `AGENTS.md` |
| [GitHub Copilot](./github-copilot.md) | `.github/agents/*.agent.md` | `.vscode/mcp.json` (`servers`) | `.github/skills/*/SKILL.md` | `.github/copilot-instructions.md` |
| [GitHub Copilot CLI](./github-copilot-cli.md) | `.github/agents/*.agent.md` | `.mcp.json` / `~/.copilot/mcp-config.json` (`mcpServers`) | `.github/skills/*/SKILL.md` | `.github/copilot-instructions.md` |

WaslaGenie models `agent`, `skill`, `mcp`, and project `context` as portable assets, then writes each asset to the destination provider's native location and configuration shape. Rules and scoped instruction files are not aliases for agents or skills.

Choose a provider from the list above or the sidebar to learn how to configure agents, MCPs, and skills for that specific tool.
