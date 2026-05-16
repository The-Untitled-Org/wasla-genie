---
sidebar_position: 2
---

# WaslGenie Documentation

Welcome to WaslGenie — the universal synchronization layer for AI agent orchestrators.

## Quick Links

- **[Project Specification](/specs/project-spec)** — Complete product specification and design
- **[Design Discussion](/specs/design-discussion)** — Deep-dive design decisions and rationale
- **[Meetings of Mind](/mom/overview)** — Meeting notes from the design process

## What is WaslGenie?

WaslGenie synchronizes your agents and MCPs across Claude Code, Gemini CLI, and OpenCode without duplicating files.

### The Problem

You work across multiple AI orchestrators. Each one is its own universe. You build an agent in Gemini CLI. It doesn't exist in Claude Code. You build another in Claude. Now Gemini doesn't have it.

### The Solution

WaslGenie scans each tool, discovers what you've built, and mirrors the content into every other tool using the "Latest is Greatest" strategy. Whichever version was modified most recently becomes the canonical source.

## Quick Start

```bash
npx wasl-genie install      # Detect tools and register WaslGenie
waslgenie sync              # Scan, discover, and mirror assets
waslgenie status            # View all synced assets
```

## Key Features

- ✅ **Multi-tool support** — Claude Code, Gemini CLI, OpenClaw
- ✅ **Content Mirroring** — Stubs contain full content for maximum tool compatibility
- ✅ **Dynamic Source Discovery** — Latest modification wins
- ✅ **Zero friction** — Edit anywhere, sync everywhere
- ✅ **Scoped to your needs** — User or workspace scope

## Project Structure

This documentation contains:

- **[Project Specification](/specs/project-spec)** — MVP specification, architecture, and design
- **[Design Discussion](/specs/design-discussion)** — Grilling session notes and decision rationale
- **[Meetings of Mind](/mom)** — Meeting notes (MoM) with key decisions

## GitHub

- **Repository** — [github.com/The-Untitled-Org/wasla-genie](https://github.com/The-Untitled-Org/wasla-genie)
- **Organization** — [github.com/The-Untitled-Org](https://github.com/The-Untitled-Org)
- **Issues & Discussions** — [GitHub Issues](https://github.com/The-Untitled-Org/wasla-genie/issues)

---

**Questions?** Check the Project Specification or open an issue on GitHub.
