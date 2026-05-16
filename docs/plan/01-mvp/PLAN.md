# WaslGenie MVP — Implementation Plan

**Version:** 0.1-MVP  
**Status:** Final (Post Team Review 2026-05-15)  
**Last Updated:** 2026-05-16  

---

## Executive Summary

WaslGenie MVP synchronizes agents and MCPs across four CLI-based AI orchestrators (Claude Code, Gemini CLI, OpenAI Codex CLI, OpenClaw) using a **"Latest is Greatest"** strategy with no permanent asset ownership. IDE-based agents (Cursor, GitHub Copilot) are planned for v1.1. Whichever version is edited most recently becomes the source of truth on sync, determined by file modification time (mtime).

**Core principle:** Simple, distributed, zero permanent state.

---

## Architecture Overview

### The "Latest is Greatest" Strategy

```
On every sync (triggered by tool-open or manual invocation):

1. Scanner finds asset "researcher" in multiple locations:
   - ~/.claude/agents/researcher.md         (mtime: 10:00 AM)
   - ~/.gemini/agents/researcher.md         (mtime: 2:30 PM) ← LATEST
   - ~/.openclaw/agents/researcher.md       (mtime: 12:00 PM)

2. Detector compares mtimes → Gemini is newest

3. Prompt user: "Use Gemini version? (Y/n)"

4. User confirms → Mirror to all 3 other locations

5. Registry updated with new hashes/mtimes

6. Done — no ownership state, just timestamps
```

### Key Design Decisions

| Decision | Outcome | Why |
|---|---|---|
| **Sync trigger** | Tool-open only | Each tool's WaslGenie skill runs sync on launch. No persistent daemon. |
| **Conflict model** | Latest-is-Greatest (mtime) | No permanent ownership. Newest version always wins automatically. |
| **Registry** | Change detection only | Track hashes/mtimes. Source determined dynamically. No origin_tool field. |
| **Asset authorship** | Any tool | Users create/edit agents in any supported tool. Latest becomes source. |
| **CLI tool coverage** | Claude Code, Gemini CLI, OpenAI Codex CLI, OpenClaw | Four widely-used terminal agents covering meaningfully different formats. |
| **IDE tool coverage** | Cursor, GitHub Copilot (v1.1) | IDE tools use different config models; deferred until CLI pattern is stable. |
| **Asset types** | Agents + MCPs | Highest-pain duplications for developers working across tools. |
| **Stub strategy** | Content mirror | Only viable strategy. Native refs not supported by any tool. |
| **Scope handling** | User + workspace | `~/.waslgenie/` (default) or `.waslgenie/` (project-level). |

---

## What Gets Synced (MVP)

### Agents

| Tool | Discovery Path | Format |
|---|---|---|
| Claude Code | `~/.claude/agents/` | Markdown + YAML frontmatter |
| Gemini CLI | `~/.gemini/agents/` | Markdown + YAML frontmatter |
| OpenAI Codex CLI | `~/.codex/agents/` | TBD — needs research |
| OpenClaw | `~/.openclaw/agents/` | Markdown + YAML frontmatter (TBD) |
| WaslGenie | `~/.waslgenie/agents/` | Same as source tool |

### MCPs

| Tool | Config Location | Format |
|---|---|---|
| Claude Code | `~/.claude/mcp/` or `~/.claude/claude.json` | JSON |
| Gemini CLI | `~/.gemini/settings.json` (key: `mcpServers`) | JSON |
| OpenAI Codex CLI | `~/.codex/mcp/` or config TBD | TBD — needs research |
| OpenClaw | `~/.openclaw/mcp/` or config TBD | TBD — needs research |
| WaslGenie | `~/.waslgenie/mcp/` | Same as source tool |

---

## Sync Workflow (MVP)

### Tool-Open Trigger (Automatic)

```
1. User opens Claude Code
2. Claude Code launches → WaslGenie skill runs
3. Skill executes: waslgenie sync --quick
4. Scanner discovers all assets in all tool dirs
5. Registry compares hashes/mtimes to detect changes
6. For each changed asset:
   a. Find newest version (by mtime)
   b. Prompt user: "Use this version? (Y/n)"
   c. User confirms → mirror to all other locations
7. Registry updated, tool continues
```

### Manual Sync

Users can also trigger sync manually anytime:
```bash
waslgenie sync              # Full scan and interactive sync
waslgenie sync --quiet      # Fast check (assumes Y/n from previous)
```

### User Experience (Example)

```
$ waslgenie sync
🔍 Scanning tool directories...

Agent "researcher" changed:
  └─ Newest in ~/.gemini/agents/researcher.md (May 15, 2:30 PM)

📋 Latest is Greatest — new source detected
   Use Gemini version across all tools? [Y/n] › Y

🔄 Syncing to 3 locations...
   ✔ ~/.claude/agents/researcher.md
   ✔ ~/.openclaw/agents/researcher.md
   ✔ ~/.waslgenie/agents/researcher.md

✨ Sync complete
```

---

## Registry Design

### Purpose

Track change detection only. Enable "Latest is Greatest" by storing hashes/mtimes.

### Schema

```json
{
  "assets": [
    {
      "id": "uuid-v4",
      "name": "researcher",
      "type": "agent",
      "locations": {
        "~/.claude/agents/researcher.md": {
          "content_hash": "abc123def456",
          "mtime": 1631234567
        },
        "~/.gemini/agents/researcher.md": {
          "content_hash": "xyz789def456",
          "mtime": 1631245678
        }
      },
      "last_synced_at": "2026-05-16T14:32:01Z"
    }
  ],
  "config": {
    "scope": "user",
    "version": "0.1.0"
  }
}
```

### Key Properties

- **No `origin_tool` or `origin_path`** — source is dynamic
- **Hash + mtime per location** — enables change detection
- **`last_synced_at` global** — when last sync occurred
- **Simple, flat structure** — easy to reason about

---

## Implementation Phases

### Phase 1: Research & Verification (Blocking) 🔴

**Before any adapter code is written:**

For each tool (Claude Code, Gemini CLI, OpenClaw):

1. **Verify paths and formats**
   - Exact agent directory path
   - Exact MCP config location and format
   - Confirm JSON schema for MCPs

2. **Test stub behavior**
   - Write a content-mirror stub agent
   - Can the tool load and execute it?
   - Does stub metadata header get preserved?

3. **Test skill system**
   - Can a skill detect tool launch?
   - Can it run `waslgenie sync` successfully?
   - Can it access both home and project dirs?

**Status:** OpenClaw and OpenAI Codex CLI MCP paths are critical blockers.

### Phase 2: Core Infrastructure

**Files to create:**

1. **`src/scanner/index.ts`**
   - Scan tool directories
   - Detect agents and MCPs
   - Return list of asset locations

2. **`src/registry/index.ts`**
   - Read/write `~/.waslgenie/registry.json` or `.waslgenie/registry.json`
   - Load/save asset change detection data
   - Compare hashes/mtimes

3. **`src/syncer/index.ts`**
   - For each changed asset, find newest version
   - Mirror content to all other locations
   - Handle both file-write (agents) and JSON-patch (MCPs)

4. **`src/detector/index.ts`**
   - Compare registry hashes to current file hashes
   - Identify which assets changed
   - Rank by mtime to find "latest"

5. **`src/cli/index.ts`**
   - Command router: `install`, `sync`, `status`, `config`
   - Output formatting

6. **`src/utils/`**
   - `paths.ts` — path resolution, `~` expansion
   - `fs.ts` — safe file read/write helpers
   - `hash.ts` — compute file content hashes

### Phase 3: Adapter Implementation

**Files to create:**

1. **`src/adapters/interface.ts`**
   - Base `WaslGenieAdapter` interface
   - Methods: `isInstalled()`, `writeStub()`, `installSkill()`, `hashFile()`

2. **`src/adapters/claude.ts`**
   - Discover: `~/.claude/agents/`, `~/.claude/mcp/`
   - Write stubs to both paths
   - Install skill via `CLAUDE.md` registration

3. **`src/adapters/gemini.ts`**
   - Discover: `~/.gemini/agents/`, `~/.gemini/settings.json`
   - Write agent stubs to agents dir
   - Write MCP stubs by JSON-patching `settings.json`
   - Install skill via `GEMINI.md` registration

4. **`src/adapters/codex.ts`**
   - Discover: `~/.codex/agents/`, `~/.codex/mcp/` (TBD — needs research)
   - Write stubs (format TBD)
   - Install skill (mechanism TBD)

5. **`src/adapters/openclaw.ts`**
   - Discover: `~/.openclaw/agents/`, `~/.openclaw/mcp/` (TBD — needs research)
   - Write stubs (format TBD)
   - Install skill (mechanism TBD)

### Phase 4: Skill Installation

**Files to create:**

1. **`src/skills/sync.md`**
   - Minimal WaslGenie skill code
   - Runs `waslgenie sync --quick` on tool launch
   - Captures sync output/warnings

2. **`src/cli/install.ts`**
   - Register skill in each tool's config
   - For Claude: append to `CLAUDE.md`
   - For Gemini: append to `GEMINI.md`
   - For OpenClaw: append to config (TBD)

### Phase 5: Transformers (Design)

**Deferred to v1.1, but design groundwork in MVP:**

- Field mapping rules (e.g., Gemini `timeout_mins` → Claude `maxTurns`)
- Vendor version tracking
- Auto-detect format differences between tools

---

## Critical Path

```
Phase 1 (Blocking)
  ↓
Phase 2 (Core infra) + Phase 3 (Adapters in parallel)
  ↓
Phase 4 (Skill installation)
  ↓
MVP complete
```

**Blocking items:** OpenClaw and OpenAI Codex CLI MCP config paths. Cannot proceed with those adapters until resolved.

---

## Success Criteria for MVP

✅ User creates agent in Gemini CLI → visible and executable in Claude Code  
✅ User creates agent in Claude Code → visible and executable in Gemini CLI  
✅ User creates agent in Claude Code → visible and executable in OpenClaw  
✅ User edits agent in OpenClaw → newest version syncs to Claude and Gemini  
✅ MCP config synced across all three tools  
✅ Tool-open trigger automatically syncs (user opens Claude → sync runs)  
✅ `waslgenie status` shows all assets and locations  
✅ Manual `waslgenie sync` works and detects changes correctly  
✅ Registry accurately tracks file hashes/mtimes  
✅ Latest version is always used as source (mtime-based)  

---

## Non-Goals (MVP)

- ❌ Persistent daemon (`waslgenie watch`) — tool-open trigger sufficient
- ❌ Skills, commands, cron sync — agents + MCPs only
- ❌ IDE-based agents (Cursor, GitHub Copilot) — different config model, deferred to v1.1
- ❌ Hermes support — deferred to v1.1
- ❌ GUI or web dashboard
- ❌ Team collaboration — users handle sharing via git/etc.
- ❌ Multi-profile support — single default profile
- ❌ Remote/cross-machine sync — handled by export/import
- ❌ Permanent asset ownership — dynamic Latest-is-Greatest

---

## Project Structure

```
wasl-genie/
├── src/
│   ├── cli/
│   │   ├── index.ts          # CLI entry, command router
│   │   ├── install.ts        # install command
│   │   ├── sync.ts           # sync command
│   │   ├── status.ts         # status command
│   │   └── config.ts         # config command
│   ├── scanner/
│   │   └── index.ts          # scan tool dirs, find assets
│   ├── registry/
│   │   └── index.ts          # read/write registry.json
│   ├── detector/
│   │   └── index.ts          # detect changed assets, rank by mtime
│   ├── syncer/
│   │   └── index.ts          # mirror assets to all locations
│   ├── adapters/
│   │   ├── interface.ts      # WaslGenieAdapter interface
│   │   ├── claude.ts         # Claude Code adapter
│   │   ├── gemini.ts         # Gemini CLI adapter
│   │   ├── codex.ts          # OpenAI Codex CLI adapter
│   │   └── openclaw.ts       # OpenClaw adapter
│   ├── skills/
│   │   └── sync.md           # WaslGenie skill code
│   └── utils/
│       ├── paths.ts          # path resolution, ~ expansion
│       ├── fs.ts             # safe file I/O
│       └── hash.ts           # content hashing
├── docs/
│   ├── SPEC.md               # Product specification
│   ├── plan/
│   │   └── 01-mvp/
│   │       └── PLAN.md       # This file
│   └── mom/
│       └── mom-20260515.md   # Team review outcomes
├── package.json
├── tsconfig.json
└── README.md
```

---

## Assumptions & Risks

### Assumptions

1. **All three tools support Markdown + YAML frontmatter for agents** ✅ Confirmed
2. **File modification times are reliable change indicators** ✅ Reasonable for local files
3. **Users can see and edit files in any tool's config directory** ✅ True
4. **WaslGenie skill can run on tool launch** 🟡 Needs verification per tool
5. **Content mirrors are sufficient (no need for native refs)** ✅ Confirmed

### Risks

1. **OpenClaw MCP config location unknown** 🔴 Critical blocker
   - Mitigation: Research before implementing OpenClaw adapter

2. **Skill installation mechanism varies per tool** 🟡 High
   - Mitigation: Research skill system per tool early

3. **Stub metadata header conflicts with tool parsing** 🟡 Medium
   - Mitigation: Test stub format with real tools in Phase 1

4. **Performance: sync on every tool launch** 🟡 Medium
   - Mitigation: `--quick` flag uses hash comparison (fast), full scan only when needed

5. **Users accidentally edit stubs directly** 🟡 Low
   - Mitigation: Stub header clearly marks them as WaslGenie-managed
   - Solution: Detect divergence, warn user, ask confirmation

---

## Decision Log

### 2026-05-15: Team Review (Final)

- ✅ Confirmed: Content mirror + tool-open trigger strategy
- ✅ Confirmed: "Latest is Greatest" (mtime-based) sync
- ✅ Confirmed: Simplified registry (change detection only)
- ✅ Confirmed: MCPs in MVP scope
- ✅ Confirmed: Single profile MVP
- ✅ Confirmed: OpenClaw as third tool (not OpenCode)

### 2026-05-16: Architecture Finalization

- ✅ Removed permanent ownership from registry
- ✅ Removed explicit conflict resolution command
- ✅ Simplified to dynamic mtime-based source detection
- ✅ Updated all docs to reflect Latest-is-Greatest

---

## Next Steps

1. **Schedule Phase 1 research** (OpenClaw investigation critical)
2. **Begin Phase 2 implementation** once research clears blockers
3. **Run adapters + skills in parallel** for speed
4. **Integration testing** with real tools before MVP release

---

## References

- **SPEC.md** — Detailed product specification
- **mom-20260515.md** — Team review minutes
- **README.md** — Product overview
