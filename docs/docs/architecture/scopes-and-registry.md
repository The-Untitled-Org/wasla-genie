---
sidebar_position: 3
---

# Scopes and Registry

WaslaGenie supports two independent scopes. The selected scope controls both provider discovery and registry storage.

## Scope Layout

```mermaid
flowchart LR
    Scope["Scope selection"]
    Workspace["Workspace scope"]
    User["User scope"]
    WorkspaceRegistry["project/.waslagenie/<br/>registry.json<br/>agents/<br/>skills/<br/>mcp/<br/>context/"]
    WorkspaceProviders["Project provider markers<br/>.claude | .gemini | .github | .vscode"]
    UserRegistry["~/.waslagenie/<br/>config.json<br/>registry.json<br/>agents/<br/>skills/<br/>mcp/<br/>context/"]
    UserProviders["Home provider markers<br/>~/.claude | ~/.gemini | ~/.cursor"]

    Scope --> Workspace
    Scope --> User
    Workspace --> WorkspaceRegistry
    Workspace --> WorkspaceProviders
    User --> UserRegistry
    User --> UserProviders
```

The global preference is stored in `~/.waslagenie/config.json`. Commands resolve the selected registry from that preference. Interactive `waslagenie sync` asks for the scope before scanning.

## Registry Responsibilities

`registry.json` stores:

| Field | Purpose |
| --- | --- |
| `assets` | Known assets and their managed mirror locations. |
| `conflicts` | Multiple original versions detected for the same name and type. |
| `config.scope` | Scope associated with this registry. |
| `config.version` | Registry format version. |

Canonical copies are stored beside the registry under `agents/`, `skills/`, `mcp/`, and `context/`. They provide a local cache of the last synchronized content.

## Provider Discovery Is Scoped

Workspace sync checks project markers such as `.claude`, `.gemini`, `.github`, and `.vscode`. User sync checks home-directory markers such as `~/.claude`, `~/.gemini`, and `~/.cursor`.

```mermaid
flowchart LR
    Scope["Scope selection"]
    Workspace["workspace"]
    User["user"]
    ProjectMarkers["Project provider markers"]
    HomeMarkers["Home provider markers"]
    ProjectRegistry[".waslagenie/registry.json"]
    UserRegistry["~/.waslagenie/registry.json"]

    Scope --> Workspace --> ProjectMarkers --> ProjectRegistry
    Scope --> User --> HomeMarkers --> UserRegistry
```

A provider installed for the user is intentionally not treated as active during workspace synchronization unless its workspace marker exists.
