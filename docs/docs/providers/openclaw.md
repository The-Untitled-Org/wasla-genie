---
id: openclaw
title: OpenClaw Provider Status
sidebar_label: OpenClaw (Experimental)
---

# OpenClaw Provider Status

The repository contains an `openclaw` adapter and npm sync aliases, but its native asset contract has not been validated against authoritative provider documentation during the current provider audit.

## Status

| Area | Status |
|------|--------|
| Agents | Unverified |
| Skills | Unverified |
| MCP configuration | Unverified |
| Context | Existing adapter assumes `AGENTS.md`; do not rely on this as a verified provider contract |

OpenClaw should be treated as experimental. WaslaGenie must not claim reliable portability to or from OpenClaw until its native paths, file formats, and deletion semantics are confirmed from an authoritative source and covered by translation tests.

## Current Core Guarantee

Verified portable behavior currently covers Claude Code, Gemini CLI, OpenCode, Cursor, GitHub Copilot in VS Code, and GitHub Copilot CLI as documented in the provider overview.
