---
sidebar_position: 5
---

# How Stubs Work

WaslaGenie synchronizes assets by writing **stubs** into the target tools. A stub is a minimal valid file in the native format of the target tool that mirrors the content of the original asset.

## Content Mirroring (Option B)

For the MVP, WaslaGenie uses **Content Mirroring** as the exclusive synchronization strategy. 

Research revealed that current AI orchestrators (Claude Code, Gemini CLI, OpenClaw) do not support native path references or imports in their agent/MCP definition files. To ensure the tool can load the asset without any awareness of WaslaGenie, we mirror the full content into the tool's expected directory.

### How it works:
1. **Discover**: WaslaGenie scans all tool directories.
2. **Identify Source**: The version with the latest modification time (`mtime`) is identified as the current source of truth.
3. **Mirror**: WaslaGenie writes the content of the source file into all other tool locations.
4. **Metadata**: Each stub includes a WaslaGenie metadata header (as frontmatter or comments) to identify it as a managed file.

## Source of Truth: Latest is Greatest

WaslaGenie does not enforce permanent ownership. Instead, it uses a **"Latest is Greatest"** strategy:
- Whichever tool you used to edit the asset most recently becomes the temporary source of truth.
- On the next sync, that version is mirrored to all other tools.

## Example Stub

**Claude Code Stub (`~/.claude/agents/researcher.md`):**
```markdown
---
waslagenie: true
synced_at: 2026-05-16T14:32:01Z
---

# researcher
You are a researcher agent. Your job is to...
[Full content mirrored from the latest version]
```

## Why not native references?
While native references (Option A) are cleaner, they are not yet supported by the tools in our MVP scope. We maintain the flexibility in our architecture to adopt native references if tool support is added in the future.
