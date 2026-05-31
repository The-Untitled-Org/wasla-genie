---


---

<div align="center">

```
██╗    ██╗ █████╗ ███████╗██╗      ██████╗ ███████╗███╗   ██╗██╗███████╗
██║    ██║██╔══██╗██╔════╝██║     ██╔════╝ ██╔════╝████╗  ██║██║██╔════╝
██║ █╗ ██║███████║███████╗██║     ██║  ███╗█████╗  ██╔██╗ ██║██║█████╗
██║███╗██║██╔══██║╚════██║██║     ██║   ██║██╔══╝  ██║╚██╗██║██║██╔══╝
╚███╔███╔╝██║  ██║███████║███████╗╚██████╔╝███████╗██║ ╚████║██║███████╗
 ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝
```

**وصل جيني** — *One skill layer. Every AI orchestrator. Zero duplication.*

[![MIT License](https://img.shields.io/badge/license-MIT-00C896?style=flat-square)](https://github.com/The-Untitled-Org/wasla-genie/blob/main/LICENSE)
[![GitHub](https://img.shields.io/badge/github-The--Untitled--Org-00C896?style=flat-square&logo=github)](https://github.com/The-Untitled-Org/wasla-genie)
[![Status](https://img.shields.io/badge/status-alpha-orange?style=flat-square)](https://github.com/The-Untitled-Org/wasla-genie)
[![Contributors](https://img.shields.io/github/contributors/The-Untitled-Org/wasla-genie?style=flat-square&color=00C896)](https://github.com/The-Untitled-Org/wasla-genie/graphs/contributors)

</div>

---

## ❗ The Problem

You work across multiple AI orchestrators — **Claude Code**, **Gemini CLI**, **Codex**, **OpenClaw**, **Hermes**.

Each one is its own universe.

```
You build an agent in Gemini CLI.
You open Claude Code.
It knows nothing about it.

You configure an MCP in Claude Code.
You open Codex.
Gone.

You write a skill, a command, a cron job — in one tool.
Every other tool: blank slate.
```

There is no shared layer. Every orchestrator hoards what lives inside it.  
You end up **copy-pasting configs, duplicating agent definitions, and maintaining the same thing in five places** — and the moment one changes, everything else is out of date.

---

## ✨ What WaslaGenie Does

WaslaGenie syncs assets across orchestrators from the CLI. Helper skill registration is optional.

When sync is triggered — manually (`sync`) or continuously (`watch`) — WaslaGenie:

1. **Scans** the known config directories of every supported orchestrator on your machine  
   (`~/.claude/`, `~/.gemini/`, `~/.codex/`, `~/.openclaw/`, `~/.hermes/`)
2. **Discovers** all agents, MCPs, skills, commands, and cron jobs — wherever they were originally created
3. **Writes a minimal stub file** into every other tool's equivalent directory — not a copy, not a duplicate — just enough for the native tool to load the original
4. **The original file never moves.** The tool that created it owns it forever.

> No file copying. No format conversion. No duplication.  
> Just cross-references that let each tool load what the other built.

---

## 🔬 How Cross-Referencing Works

Say you create an agent inside Gemini CLI:

```
~/.gemini/agents/researcher.md   ← original, owned by Gemini
```

After `waslagenie sync`, WaslaGenie writes a minimal stub into every other tool:

```
~/.claude/agents/researcher.md   ← stub, written by WaslaGenie
~/.codex/agents/researcher.md    ← stub, written by WaslaGenie
~/.openclaw/agents/researcher.md ← stub, written by WaslaGenie
```

Each stub contains only the minimum that native tool needs to load the original:

```markdown
---
# researcher
waslagenie_ref: ~/.gemini/agents/researcher.md
origin: gemini
---
Refer to source definition at ~/.gemini/agents/researcher.md
```

Claude Code reads its stub → loads the Gemini original → agent is live.  
**Zero bytes duplicated. Zero maintenance.**

The same pattern applies across every asset type:

```
~/.gemini/agents/       →  stubs written to  .claude  .codex  .openclaw  .hermes
~/.claude/mcp/          →  stubs written to  .gemini  .codex  .openclaw  .hermes
~/.codex/skills/        →  stubs written to  .claude  .gemini  .openclaw  .hermes
~/.openclaw/commands/   →  stubs written to  .claude  .gemini  .codex  .hermes
~/.hermes/crons/        →  stubs written to  .claude  .gemini  .codex  .openclaw
```

**Source of truth = the tool that created it first. Always. Forever.**

---

## 🗂️ What Gets Synced

| Asset | Scanned From | Synced To |
|---|---|---|
| **Agents / Sub-agents** | `~/.{tool}/agents/` | All other tools' agent dirs |
| **MCP Servers** | `~/.{tool}/mcp/` | All other tools' MCP configs |
| **Skills / Prompts** | `~/.{tool}/skills/` | All other tools' skill dirs |
| **Custom Commands** | `~/.{tool}/commands/` | All other tools' command dirs |
| **Cron Jobs** | `~/.{tool}/crons/` | All other tools' cron dirs |

---

## 🚀 Installation

WaslaGenie is cross-platform via `npx` — no global install required:

```bash
npx @untitled-devs/wasla config --scope workspace
npx @untitled-devs/wasla sync
```

Choose `workspace` or `user` once before running operational commands. This runs the CLI directly.
It does not register helper skills inside Claude, Gemini, or other tools.

**Or install globally:**

```bash
npm install -g @untitled-devs/wasla
waslagenie config --scope workspace
waslagenie sync
```

Optional helper registration:

```bash
waslagenie register
```

---

## ⚡ Usage

### One-time sync

```bash
waslagenie sync
```

```
🔍  Scanning ~/.claude/     →  3 agents, 2 MCPs, 4 commands
🔍  Scanning ~/.gemini/     →  5 agents, 1 MCP,  2 skills
🔍  Scanning ~/.codex/      →  1 agent,  3 commands
🔍  Scanning ~/.openclaw/   →  2 agents, 2 crons
🔍  Scanning ~/.hermes/     →  1 agent,  1 skill

✔   Stubs written to ~/.claude/     →  6 new references
✔   Stubs written to ~/.gemini/     →  4 new references
✔   Stubs written to ~/.codex/      →  7 new references
✔   Stubs written to ~/.openclaw/   →  5 new references
✔   Stubs written to ~/.hermes/     →  8 new references

✨  Sync complete — 30 cross-references written, 0 files duplicated
```

---

### Daemon mode — continuous background sync

```bash
waslagenie watch
```

```
👁  WaslaGenie watching for changes...
    Monitoring: ~/.claude  ~/.gemini  ~/.codex  ~/.openclaw  ~/.hermes

[14:32:01]  New agent detected → ~/.gemini/agents/planner.md
[14:32:01]  Writing stubs     → .claude ✔  .codex ✔  .openclaw ✔  .hermes ✔

[15:10:44]  New MCP detected  → ~/.claude/mcp/notion.json
[15:10:44]  Writing stubs     → .gemini ✔  .codex ✔  .openclaw ✔  .hermes ✔
```

No restart. No manual trigger. The moment something is created — it's everywhere.

---

### Scope — workspace or user level

Choose the active scope before running sync, watch, status, or the visualizer:

```bash
# Use the current project workspace registry
waslagenie config --scope workspace

# Use the user-level registry across projects
waslagenie config --scope user
```

All other commands use the saved scope automatically. They do not accept `--scope`.

---

### Status — see everything and where it lives

```bash
waslagenie status
```

```
ASSET              TYPE       ORIGIN      SYNCED TO
researcher         agent      gemini      claude ✔  codex ✔  openclaw ✔  hermes ✔
planner            agent      claude      gemini ✔  codex ✔  openclaw ✔  hermes ✔
notion-mcp         mcp        claude      gemini ✔  codex ✔  openclaw ✔
web-scraper        skill      codex       claude ✔  gemini ✔  openclaw ✔  hermes ✔
daily-standup      cron       gemini      claude ✔  codex ✔
review-pr          command    openclaw    claude ✔  gemini ✔  codex ✔  hermes ✔
```

---

## 🧩 Supported Orchestrators

| Tool | Auto-detect | Scan | Sync | Skill Install | Daemon |
|---|---|---|---|---|---|
| **Claude Code** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gemini CLI** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OpenAI Codex** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OpenClaw** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Hermes** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Custom / BYO** | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |

> Adding a new tool? See [Writing an Adapter](/architecture/adapters).

---

## 🗃️ Registry Storage

WaslaGenie keeps its own state separately from all orchestrators. You choose the active scope explicitly before the first sync:

**User-level** (available across all your projects):
```
~/.waslagenie/
├── registry.json     ← user-scope assets and stub locations
└── config.json       ← active scope preference
```

**Workspace-level** (scoped to current project only):
```
.waslagenie/
└── registry.json     ← workspace-scope assets and stub locations
```

Switch anytime:
```bash
waslagenie config --scope workspace
waslagenie config --scope user
```

---

## 🏗️ Project Structure

```
wasla-genie/
├── src/
│   ├── cli/              # CLI entry point and commands
│   ├── scanner/          # Scans known tool config directories
│   ├── registry/         # Builds and maintains the asset registry
│   ├── syncer/           # Writes and tracks stub files
│   ├── watcher/          # Daemon / filesystem watcher
│   └── adapters/         # Per-tool directory knowledge + stub format
│       ├── claude.js
│       ├── gemini.js
│       ├── codex.js
│       ├── openclaw.js
│       └── hermes.js
├── docs/
│   ├── /architecture/how-stubs-work
│   ├── /architecture/adapters
│   └── /roadmap
├── package.json
└── README.md
```

---

## 🌍 Why "WaslaGenie"?

**Wasla (وصلة)** is Arabic for *connection* — the act of joining what was always separate.

**Genie** — it appears when summoned, connects what you need, and watches quietly in the background until called again.

Your agents live where they were born.  
Your tools see everything.  
Nothing is ever duplicated.

---

## 🤝 Contributing

```bash
git clone https://github.com/The-Untitled-Org/wasla-genie
cd wasla-genie
npm install
npm run dev
```

- [Contributing Guide](/contributing)
- [How Stubs Work](/architecture/how-stubs-work)
- [Writing an Adapter](/architecture/adapters)
- [Roadmap](/roadmap)

---

## 📄 License

MIT © [Mosaeed Hammad](https://github.com/mosaeedhammad)

---

<div align="center">

**Your agents live where they were born.**  
**WaslaGenie makes sure every tool can find them.**

⭐ Star this repo if you are tired of copy-pasting the same config into five different tools.

</div>
