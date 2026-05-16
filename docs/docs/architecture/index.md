---
sidebar_position: 1
---

# Architecture Overview

WaslaGenie is designed to be a lightweight, tool-agnostic synchronization layer for AI agents and MCPs. Its architecture prioritizes simplicity, local-first execution, and seamless integration with existing AI orchestrators.

## Core Components

The system is composed of several key layers:

1. **Adapters**: Tool-specific implementations (Claude, Gemini, OpenClaw) that handle the reading and writing of assets in their native formats.
2. **Scanner**: Discovers assets across all installed tools and identifies their state (original vs. stub).
3. **Registry**: A local JSON store that tracks synchronized assets, their hashes, and synchronization history.
4. **Syncer**: The orchestration engine that implements the "Latest is Greatest" strategy to keep all tools in sync.

## Design Philosophy

- **Zero Global State**: No central server is required. All data stays in your project or user directory.
- **Content Mirroring**: Ensuring that AI tools see the full content of assets without needing complex import/export logic.
- **Dynamic Source Discovery**: The source of truth is always the version you modified most recently.

## Detailed Architecture

Explore the sub-sections for deeper dives:
- **[How Stubs Work](./how-stubs-work.md)**: Deep dive into the Content Mirroring strategy.
- **[Adapters](./adapters.md)**: Details on tool-specific integration.
