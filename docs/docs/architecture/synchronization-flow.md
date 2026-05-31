---
sidebar_position: 2
---

# Synchronization Flow

`waslagenie sync` performs a full multi-provider synchronization. `waslagenie sync-to` uses the same engine with an explicit source and selected targets.

## General Sync

```mermaid
flowchart TD
    Start["User runs waslagenie sync"]
    Scope["Select workspace or user scope"]
    Detect["Detect active provider adapters"]
    Scan["Scan agents, skills, MCP entries, and context files"]
    Group["Group files by asset name and type"]
    Reconcile["Reconcile tracked deletions conservatively"]
    Select["Choose newest file in each group by mtime"]
    Mirror["Mirror content to supported active providers"]
    Save["Write canonical cache and save registry.json"]

    Start --> Scope --> Detect --> Scan --> Group --> Reconcile --> Select --> Mirror --> Save
```

## Source Selection

For a general sync, the source is dynamic:

1. Files are grouped by asset name and type.
2. The group is sorted by modification time.
3. The newest version is selected.
4. For directory-based skills, `SKILL.md` is the primary definition and sibling files are mirrored with it.

This is the **Latest is Greatest** rule. It lets users edit an asset from any supported tool without assigning permanent ownership.

## Targeted Sync

Use targeted sync when direction matters:

```bash
waslagenie sync-to --from gemini --to claude,github-copilot
```

```mermaid
flowchart LR
    Gemini["Gemini native assets"]
    Scanner["Scanner<br/>Scan source provider"]
    Syncer["Syncer<br/>Mirror supported assets"]
    Claude["Claude Code"]
    Copilot["GitHub Copilot"]

    Gemini --> Scanner --> Syncer
    Syncer --> Claude
    Syncer --> Copilot
```

## Status Output

`waslagenie status` reads the registry and detects currently active providers. Normal output only shows mirrors belonging to active providers, so historical entries do not confuse the current workspace view.
