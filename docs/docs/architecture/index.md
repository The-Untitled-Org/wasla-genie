---
sidebar_position: 1
---

# Architecture Overview

WaslaGenie is a local-first synchronization engine for AI tool assets. It discovers assets in the active providers, selects the latest source, mirrors content into the other active providers, and records the result in a scoped registry.

There is no server and no remote database. The CLI operates on files already used by Claude Code, Gemini CLI, GitHub Copilot, GitHub Copilot CLI, Cursor, OpenCode, and the experimental OpenClaw adapter.

## System Map

```mermaid
flowchart TD
    CLI["waslagenie CLI<br/>sync | sync-to | status | watch | register"]
    Scope["Scope configuration<br/>workspace | user"]
    Scanner["Scanner<br/>Detect active providers<br/>Discover native assets<br/>Ignore known mirrors as sources"]
    Syncer["Syncer<br/>Group by name and type<br/>Select latest source<br/>Reconcile deletions<br/>Mirror content"]
    Registry["Scoped registry and canonical cache<br/>.waslagenie/ or ~/.waslagenie/"]
    Adapters["Provider adapters<br/>Claude | Gemini | Copilot | Cursor | OpenCode | OpenClaw"]

    CLI --> Scope
    Scope --> Scanner
    Scanner --> Syncer
    Syncer --> Registry
    Syncer --> Adapters
    Adapters --> Scanner
```

## Core Components

| Component | Location | Responsibility |
| --- | --- | --- |
| CLI commands | `apps/cli/src/commands/` | Validate command input, ask for scope where needed, and render terminal output. |
| Scope utilities | `packages/shared/src/config.ts`, `packages/shared/src/paths.ts` | Resolve the selected scope, registry location, and provider markers. |
| Scanner | `packages/sync/src/scanner.ts` | Detect active providers and discover native files or structured MCP entries. |
| Syncer | `packages/sync/src/index.ts` | Select sources, mirror assets, reconcile deletions, and update tracking metadata. |
| Registry | `packages/core/src/registry.ts` | Persist asset metadata, hashes, mirror locations, and conflicts as JSON. |
| Adapters | `packages/adapters/src/` | Translate generic asset operations into provider-specific paths and formats. |
| Visualizer | `apps/visualizer/` | Present registry state in a browser UI without changing sync semantics. |

## Asset Model

An asset is identified by its `name` and `type`.

```mermaid
classDiagram
    class Asset {
      +string id
      +string name
      +AssetType type
      +number last_modified_at
      +string last_synced_at
      +Stub[] stubs
    }
    class Stub {
      +string tool
      +string path
      +string written_at
      +string hash
    }
    Asset "1" *-- "0..*" Stub
```

The registry calls mirrored targets `stubs`, but the target files contain usable content. They are not pointers. MCP assets are stored as individual registry entries even when the provider stores multiple MCP servers in one JSON file.

## Design Rules

1. **Scope is explicit.** Workspace and user registries are separate.
2. **Native files remain usable.** Tools do not need a WaslaGenie runtime to read mirrored assets.
3. **The latest edit wins.** The file with the newest modification time becomes the source during a general sync.
4. **Adapters own provider differences.** Core synchronization logic does not hardcode provider file layouts.
5. **The registry tracks managed mirrors.** Hashes and paths allow deletion reconciliation without deleting unrelated user files.

## Read Next

- [Synchronization Flow](./synchronization-flow.md)
- [Scopes and Registry](./scopes-and-registry.md)
- [How Mirroring Works](./how-stubs-work.md)
- [Writing an Adapter](./adapters.md)
- [Provider Mapping](./orchestrator-comparison.mdx)
