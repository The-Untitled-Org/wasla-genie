
```
██╗    ██╗ █████╗ ███████╗██╗      ██████╗ ███████╗███╗   ██╗██╗███████╗
██║    ██║██╔══██╗██╔════╝██║     ██╔════╝ ██╔════╝████╗  ██║██║██╔════╝
██║ █╗ ██║███████║███████╗██║     ██║  ███╗█████╗  ██╔██╗ ██║██║█████╗
██║███╗██║██╔══██║╚════██║██║     ██║   ██║██╔══╝  ██║╚██╗██║██║██╔══╝
╚███╔███╔╝██║  ██║███████║███████╗╚██████╔╝███████╗██║ ╚████║██║███████╗
 ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝
```
<div align="center">

**وصل جيني** — *One skill layer. Every AI orchestrator. Zero duplication.*

[![MIT License](https://img.shields.io/badge/license-MIT-00C896?style=flat-square)](LICENSE)
[![npm](https://img.shields.io/npm/v/wasla-genie?style=flat-square&color=00C896)](https://npmjs.com/package/wasla-genie)
[![Status](https://img.shields.io/badge/status-alpha-orange?style=flat-square)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

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

WaslaGenie installs itself as a **native skill inside each orchestrator** and runs as an **external CLI daemon** alongside it.

When sync is triggered — manually or automatically — WaslaGenie:

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
npx wasla-genie install
```

This detects every supported orchestrator on your machine and registers WaslaGenie as a native skill inside each one.

**Or install globally:**

```bash
npm install -g wasla-genie
waslagenie install
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

### Automatic background sync — session-scoped

WaslaGenie is not a standalone background daemon. Instead, the WaslaGenie skill installed in each tool **launches WaslaGenie as a background co-process when the tool starts** and **stops it when the tool closes**. It watches for file changes across all tool directories for the lifetime of that session.

```
[Tool starts]  → WaslaGenie co-process launched by skill
[File changes] → WaslaGenie detects change and syncs immediately
[Tool closes]  → WaslaGenie co-process exits cleanly
```

```
👁  WaslaGenie active (session: Claude Code)
    Monitoring: ~/.claude  ~/.gemini  ~/.codex  ~/.openclaw

[14:32:01]  New agent detected → ~/.gemini/agents/planner.md
[14:32:01]  Syncing stubs     → .claude ✔  .codex ✔  .openclaw ✔

[15:10:44]  Agent updated     → ~/.claude/agents/researcher.md (Latest is Greatest)
[15:10:44]  Syncing stubs     → .gemini ✔  .codex ✔  .openclaw ✔
```

No restart. No manual trigger. The moment something changes — it's everywhere.  
No persistent system process. WaslaGenie only runs while you're using a tool.

---

### Scope — workspace or user level

```bash
# Sync only within current project workspace
waslagenie sync --scope workspace

# Sync across your entire user space (default)
waslagenie sync --scope user
```

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

### CLI / Terminal Agents

| Tool | Auto-detect | Scan | Sync | Skill Install | Daemon |
|---|---|---|---|---|---|
| **Claude Code** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gemini CLI** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OpenAI Codex CLI** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OpenClaw** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Hermes** | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| **Custom / BYO** | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |

### IDE-based Agents

| Tool | Auto-detect | Scan | Sync | Skill Install | Daemon |
|---|---|---|---|---|---|
| **Cursor** | 🔜 | 🔜 | 🔜 | 🔜 | 🔜 |
| **GitHub Copilot** | 🔜 | 🔜 | 🔜 | 🔜 | 🔜 |

> ✅ Supported &nbsp;·&nbsp; 🔜 Planned &nbsp;·&nbsp; 🔧 Custom adapter required  
> Adding a new tool? See [Writing an Adapter](docs/adapters.md).

---

## 🗃️ Registry Storage

WaslaGenie keeps its own state separately from all orchestrators. You choose the scope at install time:

**User-level** (default — available across all your projects):
```
~/.waslagenie/
├── registry.json     ← every discovered asset + origin tool + stub locations
├── stubs/            ← log of every stub written and when
└── config.json       ← your scope and preferences
```

**Workspace-level** (scoped to current project only):
```
.waslagenie/
├── registry.json
├── stubs/
└── config.json
```

Switch anytime:
```bash
waslagenie config --scope workspace
waslagenie config --scope user
```

---

## 🌱 Gradual Centralization

WaslaGenie respects the **zero-friction promise**: your agents live where they were born. You don't need to learn a new canonical location on day one.

But over time, WaslaGenie offers a path toward centralization — for portability, backup, and eventually team sharing.

```
Day 1    — Agents live in ~/.claude/, ~/.gemini/, ~/.codex/
           WaslaGenie syncs them via stubs. You don't change anything.

Over time — You discover agents scattered across 5 tool directories.
           You run: waslagenie migrate researcher --to ~/.waslagenie/
           Now researcher lives in ~/.waslagenie/ and stubs point there.

Later    — All your agents are in ~/.waslagenie/.
           Backup is: waslagenie export
           New machine is: waslagenie import backup.tar
```

**Commands:**

```bash
waslagenie status                          # see where every asset lives today
waslagenie migrate <name> --to ~/.waslagenie/   # optionally move an asset to central location
waslagenie export                          # bundle everything for backup or new machine
waslagenie import backup.tar              # restore on a new machine
```

Nothing is forced. Centralization is a convenience, not a requirement.

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
│   ├── how-stubs-work.md
│   ├── adapters.md
│   └── roadmap.md
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
git clone https://github.com/mosaeedhammad/wasla-genie
cd wasla-genie
npm install
npm run dev
```

- [Contributing Guide](CONTRIBUTING.md)
- [How Stubs Work](docs/how-stubs-work.md)
- [Writing an Adapter](docs/adapters.md)
- [Roadmap](docs/roadmap.md)

---

## 📄 License

MIT © [Mosaeed Hammad](https://github.com/mosaeedhammad)

---

<div align="center">

**Your agents live where they were born.**  
**WaslaGenie makes sure every tool can find them.**

⭐ Star this repo if you are tired of copy-pasting the same config into five different tools.

</div>
