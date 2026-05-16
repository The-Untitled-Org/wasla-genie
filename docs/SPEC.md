# WaslGenie — Product Specification
> Version: 0.1 — MVP Spec  
> Author: Mosaeed Hammad  
> Status: Draft  
> Last Updated: 2026

---

## 1. Product Summary

WaslGenie is a universal skill layer that installs itself natively into AI agent orchestrators and synchronizes agents, MCPs, skills, commands, and cron jobs across all of them — without duplicating files.

It works by scanning each tool's known config directories, discovering assets, and writing minimal stub files into every other tool's equivalent directory. Each stub is written in the native format of the target tool so the tool loads it naturally — with no awareness of WaslGenie.

The original file never moves. The tool that created it owns it forever.

---

## 2. MVP Scope

### 2.1 Asset Types — MVP

| Asset | MVP | Post-MVP |
|---|---|---|
| **Agents / Sub-agents** | ✅ | — |
| **MCP Servers** | ✅ | — |
| Skills / Prompts | — | v1.1 |
| Custom Commands | — | v1.1 |
| Cron Jobs | — | v1.1 |

**Rationale:** Agents and MCPs are the two highest-pain duplications for developers working across multiple orchestrators. Proving the stub mechanism on these two types validates the entire architecture.

---

### 2.2 Supported Orchestrators — MVP

| Tool | MVP | Post-MVP |
|---|---|---|
| **Claude Code** | ✅ | — |
| **OpenClaw** | ✅ | — |
| **Gemini CLI** | ✅ | — |
| OpenAI Codex | — | v1.1 |
| Hermes | — | v1.1 |

**Rationale:** Claude Code, OpenClaw, and Gemini CLI give us three meaningfully different tool formats to prove the adapter pattern. If the adapter works across three distinct formats, the pattern scales.

---

### 2.3 MVP Commands

```bash
npx wasl-genie install     # detect tools, register WaslGenie skill in each
waslgenie sync             # manual: scan, discover, write stubs (also called automatically on tool open)
waslgenie status           # show all discovered assets and stub state
waslgenie config           # set scope (user vs workspace)
```

**Sync trigger:** Tool-open trigger. When user opens Claude Code, Gemini CLI, or OpenClaw, WaslGenie skill automatically runs `waslgenie sync --quick`. Manual `waslgenie sync` is also available anytime.

No persistent daemon in MVP scope.

---

## 3. Core Architecture

### 3.1 The Stub Mechanism

WaslGenie writes **stubs** — valid files in the native format of the target tool — that contain the **full mirrored content** from the original asset file, plus WaslGenie metadata.

**Note on native references:** Research revealed that none of the three MVP tools (Claude Code, Gemini CLI, OpenClaw) support native path references (`@import`, etc.) in agent/MCP definition files. Therefore, **MVP uses Option B (content mirror) exclusively**. Future versions may explore Option A or Option C (instruction-based delegation) if tool support evolves.

```
ORIGINAL                          STUB (written by WaslGenie)
────────────────────────────────────────────────────────────
~/.gemini/agents/researcher.md  → ~/.claude/agents/researcher.md   (Option A or B)
~/.gemini/agents/researcher.md  → ~/.openclaw/agents/researcher.md (Option A or B)
~/.claude/mcp/notion.json       → ~/.openclaw/mcp/notion.json      (Option A or B)
```

---

### 3.2 Stub File Rules

1. **Always written in target tool's native format** — Claude gets a Claude-valid file, OpenClaw gets an OpenClaw-valid file
2. **Always contains a WaslGenie metadata header** — so WaslGenie can identify and manage stubs it owns
3. **Never confused with originals** — registry tracks which files are originals and which are stubs
4. **Never written over an existing non-stub file** — conflict resolution required first

**Example — MVP stub (content mirror):**
```markdown
---
# researcher
waslgenie: true
origin_tool: gemini
origin_path: ~/.gemini/agents/researcher.md
synced_at: 2026-01-15T14:32:01Z
content_hash: "abc123def456"
---

You are a researcher agent. Your job is to...
[full content mirrored from origin and kept in sync by WaslGenie]
```

**Key fields:**
- `waslgenie: true` — identifies this as a WaslGenie-managed stub
- `origin_tool` — which tool owns the original
- `origin_path` — absolute path to the original file
- `synced_at` — timestamp of last sync (used to detect stale stubs)
- `content_hash` — SHA256 of original content (used to detect divergence)

---

### 3.3 Source of Truth

- **The tool that created the asset first owns it forever**
- WaslGenie never promotes a stub to an original
- If the original is deleted, WaslGenie renames all pointing stubs to `.bak` and marks them orphaned in the registry
- WaslGenie may append content to originals (e.g. updating `CLAUDE.md` or `GEMINI.md`) but never replaces or removes existing content

---

### 3.4 Conflict Resolution

A conflict occurs when two tools both have a non-stub asset with the same name.

**WaslGenie behavior:**
1. Detect the conflict during scan
2. Halt sync for that asset only — do not skip silently
3. Surface the conflict clearly to the user in the CLI
4. Ask the user to designate one as the origin
5. Convert the other to a stub pointing at the designated origin
6. Record the resolution in the registry

```
⚠  Conflict detected: researcher

   ~/.claude/agents/researcher.md   (created: 2026-01-10)
   ~/.gemini/agents/researcher.md   (created: 2026-01-12)

   Which should be the origin (source of truth)?
   › claude
     gemini
```

---

## 4. Scanner

### 4.1 What It Scans

WaslGenie scans known config directories for each installed tool:

| Tool | Agents Path | MCP Path | Status |
|---|---|---|---|
| **Claude Code** | `~/.claude/agents/` | `~/.claude/mcp/` (or `~/.claude/claude.json`) | ✅ Confirmed |
| **OpenClaw** | `~/.openclaw/agents/` | `~/.openclaw/mcp/` (TBD) | ⚠️ Needs research |
| **Gemini CLI** | `~/.gemini/agents/` | `~/.gemini/settings.json` (key: `mcpServers`) | ✅ Confirmed |
| *(v1.1)* Codex | `~/.codex/agents/` | `~/.codex/mcp/` | — |
| *(v1.1)* Hermes | `~/.hermes/agents/` | `~/.hermes/mcp/` | — |

> **Critical note for OpenClaw:** Exact MCP config path/format must be researched and confirmed before OpenClaw adapter implementation. This is blocking.

---

### 4.2 Scan Logic

```
for each installed tool:
  for each asset type in scope:
    read all files in tool's asset directory
    for each file:
      if file has waslgenie metadata header → it is a stub, skip
      if file has no waslgenie header → it is an original, register it
```

---

### 4.3 Tool Detection

WaslGenie detects installed tools by checking if their config directory exists:

```typescript
const TOOL_MARKERS = {
  claude:   '~/.claude',
  openclaw: '~/.openclaw',
  gemini:   '~/.gemini',
  codex:    '~/.codex',
  hermes:   '~/.hermes',
}
```

If the directory exists → tool is installed → include in scan and sync.

---

## 5. Registry

### 5.1 Purpose

The registry is WaslGenie's single source of truth about everything it has discovered and managed. It is never used by the orchestrators — it is internal to WaslGenie only.

---

### 5.2 Location

| Scope | Path |
|---|---|
| User (default) | `~/.waslgenie/registry.json` |
| Workspace | `.waslgenie/registry.json` |

---

### 5.3 Registry Entry Schema

```json
{
  "assets": [
    {
      "id": "uuid-v4",
      "name": "researcher",
      "type": "agent",
      "origin_tool": "claude",
      "origin_path": "~/.claude/agents/researcher.md",
      "discovered_at": "2026-01-15T14:32:01Z",
      "last_synced_at": "2026-01-15T14:32:01Z",
      "status": "active",
      "stubs": [
        {
          "tool": "openclaw",
          "path": "~/.openclaw/agents/researcher.md",
          "method": "content_mirror",
          "content_hash": "abc123def456",
          "written_at": "2026-01-15T14:32:01Z",
          "status": "active"
        }
      ]
    }
  ],
  "conflicts": [],
  "config": {
    "scope": "user",
    "version": "0.1.0"
  }
}
```

**Asset status values:** `active` | `orphaned` | `conflict`  
**Stub status values:** `active` | `bak` | `broken`

---

## 6. Adapter Interface

Each tool has one adapter. The adapter is the only place that contains tool-specific knowledge.

```typescript
interface WaslGenieAdapter {
  // Tool identity
  name: string                          // e.g. "claude"
  displayName: string                   // e.g. "Claude Code"

  // Where to scan
  paths: {
    agents: string                      // e.g. "~/.claude/agents"
    mcp: string                         // e.g. "~/.claude/mcp"
  }

  // Native file formats
  formats: {
    agents: 'md' | 'yaml' | 'json'
    mcp: 'md' | 'yaml' | 'json'
  }

  // How to detect if tool is installed
  isInstalled(): Promise<boolean>

  // How to write a content-mirror stub for this tool
  writeStub(asset: Asset): Promise<void>

  // How to register WaslGenie as a native skill in this tool
  installSkill(): Promise<void>

  // What to append to the tool's root config file (e.g. CLAUDE.md)
  getRootConfigAppend(): string | null
}
```

---

## 7. CLI Specification

### `npx wasl-genie install`

Runs once on first setup.

```
🔍  Detecting installed orchestrators...

  ✔  Claude Code     found at ~/.claude
  ✔  OpenClaw        found at ~/.openclaw
  ✔  Gemini CLI      found at ~/.gemini
  ✗  Codex           not found
  ✗  Hermes          not found

📦  Installing WaslGenie skill...

  ✔  Registered in Claude Code
  ✔  Registered in OpenClaw
  ✔  Registered in Gemini CLI

⚙️  Scope: user (~/.waslgenie/)
    Change anytime with: waslgenie config --scope workspace

✨  Installation complete. Run waslgenie sync to start.
```

---

### `waslgenie sync` (manual or auto-triggered)

Manual invocation:
```bash
waslgenie sync              # Full scan and sync
waslgenie sync --quick      # Fast check (mtime-based, called by tool-open trigger)
```

Example output:
```
🔍  Scanning...

  ~/.claude/agents/     →  2 originals found
  ~/.claude/mcp/        →  1 original found
  ~/.openclaw/agents/   →  1 original found
  ~/.openclaw/mcp/      →  0 originals found
  ~/.gemini/agents/     →  1 original found
  ~/.gemini/settings.json → 1 MCP config found

⚠️  Conflict: agent "researcher" exists in both claude and openclaw
    Resolve before continuing? (y/n) › y

    Which is the origin?
    › claude (created 2026-01-10)
      openclaw (created 2026-01-12)

✔  Conflict resolved — openclaw/researcher will become a stub

✍️  Writing stubs...

  ~/.openclaw/agents/researcher.md    ✔  (content mirror)
  ~/.openclaw/agents/planner.md       ✔  (content mirror)
  ~/.claude/agents/gemini-research.md ✔  (content mirror, from gemini original)
  ~/.gemini/agents/claude-planner.md  ✔  (content mirror, from claude original)

✨  Sync complete
    4 stubs written · 0 files duplicated · 1 conflict resolved
```

**Note:** This command is called automatically whenever a tool launches (via WaslGenie skill), and can also be called manually anytime.

---

### `waslgenie status`

```
ASSET            TYPE    ORIGIN     STUBS                    STATUS
researcher       agent   claude     openclaw ✔               active
planner          agent   claude     openclaw ✔               active
notion           mcp     claude     openclaw ✔               active
data-analyst     agent   openclaw   claude ✔                 active
old-helper       agent   claude     openclaw ✘               orphaned (.bak)
```

---

### `waslgenie config`

```bash
waslgenie config --scope user        # store registry in ~/.waslgenie/
waslgenie config --scope workspace   # store registry in .waslgenie/
waslgenie config --show              # print current config
```

---

## 8. File Modification Rules

WaslGenie may append to — but never overwrite or delete from — the following original files:

| File | What WaslGenie May Append |
|---|---|
| `CLAUDE.md` | WaslGenie skill registration block |
| `GEMINI.md` | WaslGenie skill registration block |
| Tool root config files | Import/include references for synced MCPs |

**All appended blocks are clearly marked:**
```markdown
<!-- waslgenie:start -->
...managed content...
<!-- waslgenie:end -->
```

WaslGenie will only ever touch content between its own markers. Everything outside is untouched.

---

## 9. Open Research Items

**Research status: Partially complete. Blocking items identified below.**

### Resolved ✅

- ✅ Claude Code agent format — Markdown + YAML frontmatter confirmed
- ✅ Claude Code MCP format — `~/.claude/mcp/` or `~/.claude/claude.json` 
- ✅ Claude native ref support — **NO** (research revealed `@import` only works in `CLAUDE.md`, not agent files)
- ✅ Gemini CLI agent format — Markdown + YAML frontmatter confirmed
- ✅ Gemini CLI MCP format — **NOT a directory.** Embedded in `~/.gemini/settings.json` under `mcpServers: {}`
- ✅ Gemini native ref support — **NO** (same finding as Claude)

### Blocking 🔴

| Item | Question | Priority |
|---|---|---|
| OpenClaw agent format | Exact file format for OpenClaw agents | 🔴 Critical |
| OpenClaw MCP path | **CRITICAL:** Where does OpenClaw store MCP configs? File path and format. | 🔴 Critical |
| OpenClaw native ref support | Does OpenClaw support native path references? | 🔴 Critical |
| OpenClaw skill install | How to register a skill in OpenClaw programmatically | 🟡 High |
| Gemini skill install | How to register a skill in Gemini CLI programmatically | 🟡 High |
| Claude skill install | How to register a skill in Claude Code programmatically | 🟡 High |

**Note:** OpenClaw is the critical blocker. Its MCP storage format differs from Claude/Gemini and must be confirmed before adapter implementation.

---

## 10. Transformers Concept (MVP)

**Transformers** = A system for maintaining format consistency and handling vendor updates.

### Use Cases

1. **Format conversion:** An MCP defined in Gemini format must be converted to Claude format when synced to Claude
2. **Vendor updates:** When a vendor releases a new version of an MCP, transformers auto-detect and re-sync
3. **Vendor-specific rules:** Different tools may require different syntax, fields, or structure

### Transformer Implementation

Each adapter can define **transformation rules** for how assets are mirrored to other tools:

```typescript
interface Transformer {
  sourceFormat: 'claude' | 'gemini' | 'openclaw'
  targetFormat: 'claude' | 'gemini' | 'openclaw'
  
  // Convert from source format to target format
  transform(content: string, metadata: AssetMetadata): string
  
  // Detect vendor version changes
  getVersion(asset: Asset): string
  
  // Handle format-specific fields
  extractFields(content: string): Record<string, any>
  mergeFields(fields: Record<string, any>, format: string): string
}
```

### MVP Scope for Transformers

In MVP, transformers are **basic pass-through** — content is mirrored without modification, with metadata preserved in stub headers. Format-specific handling and auto-updates are deferred to v1.1+.

---

## 11. Project Structure

```
wasl-genie/
├── src/
│   ├── cli/
│   │   ├── index.ts          # CLI entry, command registration
│   │   ├── install.ts        # install command
│   │   ├── sync.ts           # sync command
│   │   ├── status.ts         # status command
│   │   └── config.ts         # config command
│   ├── scanner/
│   │   └── index.ts          # scans tool dirs, classifies originals vs stubs
│   ├── registry/
│   │   └── index.ts          # reads/writes registry.json
│   ├── syncer/
│   │   └── index.ts          # orchestrates stub writing per adapter
│   ├── conflict/
│   │   └── index.ts          # conflict detection and interactive resolution
│   ├── adapters/
│   │   ├── interface.ts      # WaslGenieAdapter interface
│   │   ├── claude.ts         # Claude Code adapter
│   │   ├── openclaw.ts       # OpenClaw adapter
│   │   └── gemini.ts         # Gemini CLI adapter
│   └── utils/
│       ├── paths.ts           # path resolution, ~ expansion
│       └── fs.ts              # safe file read/write helpers
├── docs/
│   ├── how-stubs-work.md
│   ├── adapters.md
│   └── roadmap.md
├── package.json
├── tsconfig.json
└── README.md
```

---

## 12. Roadmap

### v0.1 — MVP
- ✅ Claude Code + OpenClaw + Gemini CLI support
- ✅ Agents + MCPs sync (content mirror strategy)
- ✅ Tool-open auto-trigger (via WaslGenie skill)
- ✅ Manual sync (`waslgenie sync`) also available
- ✅ Conflict resolution (interactive)
- ✅ Orphan handling (.bak)
- ✅ User + workspace scope
- ✅ `npx wasl-genie install`
- ✅ Export/import for backup (`waslgenie export`, `waslgenie import`)
- 🔄 Transformers concept (format conversion + vendor updates)

### v1.1
- Codex + Hermes adapters
- Skills + Commands + Cron sync
- Multi-profile support
- `waslgenie watch` daemon mode (persistent background sync)
- Skill store integration

### v1.2
- Team collaboration features (shared repos, team profiles)
- Remote/cross-machine sync
- Web UI for status dashboard
- Advanced transformers (custom vendor plugins)

---

## 13. Non-Goals (MVP)

- ❌ Persistent daemon / file watching (tool-open trigger is sufficient)
- ❌ Skills, commands, cron sync (agents + MCPs only)
- ❌ Codex, Hermes support (Claude Code, Gemini CLI, OpenClaw only)
- ❌ Conflict auto-resolution (always interactive)
- ❌ GUI or web dashboard
- ❌ Team collaboration features (leave it to users to manage ~/.waslgenie/ with git)
- ❌ Multi-profile support (single default profile only)
- ❌ Remote or cross-machine sync (handled by export/import)
