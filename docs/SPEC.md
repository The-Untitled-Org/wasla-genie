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

#### CLI / Terminal Agents

| Tool | MVP | Post-MVP |
|---|---|---|
| **Claude Code** | ✅ | — |
| **Gemini CLI** | ✅ | — |
| **OpenAI Codex CLI** | ✅ | — |
| **OpenClaw** | ✅ | — |
| Hermes | — | v1.1 |

**Rationale:** Claude Code, Gemini CLI, OpenAI Codex CLI, and OpenClaw represent the four most-used terminal-based AI agents in developer communities. Proving the adapter pattern across four meaningfully different formats validates the architecture for the long tail.

#### IDE-based Agents

| Tool | MVP | Post-MVP |
|---|---|---|
| Cursor | — | v1.1 |
| GitHub Copilot | — | v1.1 |

**Rationale:** IDE-based tools store configs differently from CLI tools (workspace `.cursor/rules/`, `.github/copilot-instructions.md`, VS Code settings). They require a separate integration approach and are deferred to v1.1 once the CLI adapter pattern is stable.

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

- **Latest edit wins** — whichever version was modified most recently becomes the source
- No permanent ownership — assets can be authored in any tool
- On sync, all other locations get the latest version
- WaslGenie never deletes assets, only mirrors them
- Original files in any tool location are never deleted by WaslGenie

---

### 3.4 "Latest is Greatest" Sync Strategy

No explicit conflict resolution needed. Instead, WaslGenie uses **modification time (mtime)** to determine source of truth:

1. Scanner finds agent "researcher" in multiple locations (e.g., Claude, Gemini, WaslGenie)
2. Compare modification times of all versions
3. **Whichever was edited most recently is the source**
4. Prompt user: "Agent 'researcher' was last edited in Gemini CLI (May 15, 2:30 PM). Use as source across all tools? (Y/n)"
5. User confirms → mirror that version to all other locations
6. Registry updated with new hashes/mtimes

**Advantages:**
- ✅ No permanent ownership — anyone can edit an agent in any tool
- ✅ Intuitive: latest edit wins
- ✅ No conflict state tracking needed
- ✅ Flexible: agents are not "born" in one tool, they can originate anywhere

**Example flow:**
```
🔍  Scanning...

Agent "researcher" found in 3 locations:
  ~/.claude/agents/researcher.md        (edited May 15, 10:00 AM)
  ~/.gemini/agents/researcher.md        (edited May 15, 2:30 PM) ← Latest
  ~/.waslgenie/agents/researcher.md     (edited May 15, 12:00 PM)

📋  Latest version detected in Gemini CLI (2:30 PM today)
    Sync this version across all tools?

  › Yes
    No (skip this asset)
```

---

## 4. Scanner

### 4.1 What It Scans

WaslGenie scans known config directories for each installed tool:

#### CLI / Terminal Agents

| Tool | Agents Path | MCP Path | Status |
|---|---|---|---|
| **Claude Code** | `~/.claude/agents/` | `~/.claude/mcp/` (or `~/.claude/claude.json`) | ✅ Confirmed |
| **Gemini CLI** | `~/.gemini/agents/` | `~/.gemini/settings.json` (key: `mcpServers`) | ✅ Confirmed |
| **OpenAI Codex CLI** | `~/.codex/agents/` | `~/.codex/mcp/` | ⚠️ Needs research |
| **OpenClaw** | `~/.openclaw/agents/` | `~/.openclaw/mcp/` (TBD) | ⚠️ Needs research |
| *(v1.1)* Hermes | `~/.hermes/agents/` | `~/.hermes/mcp/` | — |

> **Critical note for OpenClaw and Codex CLI:** Exact MCP config paths/formats must be researched and confirmed before adapter implementation. These are blocking for their respective adapters.

#### IDE-based Agents *(v1.1)*

| Tool | Agent/Rules Path | MCP / Extensions Config | Status |
|---|---|---|---|
| **Cursor** | `.cursor/rules/` (workspace) | `.cursor/mcp.json` | ⚠️ Needs research |
| **GitHub Copilot** | `.github/copilot-instructions.md` | VS Code settings (`extensions.json`) | ⚠️ Needs research |

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

**Simplified registry — change detection only:**

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
        },
        "~/.waslgenie/agents/researcher.md": {
          "content_hash": "abc123def456",
          "mtime": 1631234567
        }
      },
      "last_synced_at": "2026-01-15T14:32:01Z"
    }
  ],
  "config": {
    "scope": "user",
    "version": "0.1.0"
  }
}
```

**Registry purpose:** Track which files have changed since last sync, enabling "Latest is Greatest" detection.

**Key fields:**
- `locations` — all known locations of this asset and their current hash/mtime
- `last_synced_at` — when this asset was last synced
- No `origin_tool`, `origin_path`, or conflict tracking — all dynamic

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
  writeStub(asset: Asset, targetPath: string, content: string): Promise<void>

  // How to register WaslGenie as a native skill in this tool
  installSkill(): Promise<void>

  // What to append to the tool's root config file (e.g. CLAUDE.md)
  getRootConfigAppend(): string | null

  // Calculate hash of file content for change detection
  hashFile(path: string): Promise<string>
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
waslgenie sync --quick      # Fast check (hash/mtime-based, called by tool-open trigger)
```

Example output:
```
🔍  Scanning all tool directories...

  ~/.claude/agents/       → 2 agents found
  ~/.claude/mcp/          → 1 MCP found
  ~/.gemini/agents/       → 2 agents found
  ~/.gemini/settings.json → 1 MCP found
  ~/.openclaw/agents/     → 1 agent found

📋  Change detection (comparing hashes/mtimes to registry)...

  researcher    → CHANGED (last edited in gemini, May 15 2:30 PM)
  planner       → CHANGED (last edited in claude, May 15 10:00 AM)
  notion-mcp    → CHANGED (last edited in claude, May 15 1:15 PM)
  data-helper   → UNCHANGED (no changes since last sync)

🔄  Latest is Greatest — syncing changed assets...

  researcher (source: ~/.gemini/agents/researcher.md)
    Sync to ~/.claude/agents/researcher.md        ✔
    Sync to ~/.openclaw/agents/researcher.md      ✔
    Sync to ~/.waslgenie/agents/researcher.md     ✔

  planner (source: ~/.claude/agents/planner.md)
    Sync to ~/.gemini/agents/planner.md           ✔
    Sync to ~/.openclaw/agents/planner.md         ✔
    Sync to ~/.waslgenie/agents/planner.md        ✔

  notion-mcp (source: ~/.claude/mcp/)
    Sync to ~/.gemini/settings.json               ✔
    Sync to ~/.openclaw/mcp/                      ✔
    Sync to ~/.waslgenie/mcp/                     ✔

✨  Sync complete
    3 assets synced · 1 unchanged · 0 errors
```

**Note:** This command is called automatically whenever a tool launches (via WaslGenie skill), and can also be called manually anytime. No explicit conflict resolution needed — latest edits are automatically detected and synced with user confirmation.

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
- ✅ Claude native ref support — Not needed (MVP uses content mirror + "Latest is Greatest")
- ✅ Gemini CLI agent format — Markdown + YAML frontmatter confirmed
- ✅ Gemini CLI MCP format — **NOT a directory.** Embedded in `~/.gemini/settings.json` under `mcpServers: {}`
- ✅ Gemini native ref support — Not needed (MVP uses content mirror)
- ✅ Conflict resolution — Solved via "Latest is Greatest" mtime comparison

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
- ✅ Claude Code + Gemini CLI + OpenAI Codex CLI + OpenClaw support
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
- Cursor + GitHub Copilot adapters (IDE-based agent support)
- Hermes adapter
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
- ❌ IDE-based agents (Cursor, GitHub Copilot) — different config model, deferred to v1.1
- ❌ Hermes support — deferred to v1.1
- ❌ GUI or web dashboard
- ❌ Team collaboration features (leave it to users to manage ~/.waslgenie/ with git)
- ❌ Multi-profile support (single default profile only)
- ❌ Remote or cross-machine sync (handled by export/import)
- ❌ Permanent asset ownership (dynamic "latest is greatest")
