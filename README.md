
```
██╗    ██╗ █████╗ ███████╗██╗      █████╗      ██████╗ ███████╗███╗   ██╗██╗███████╗
██║    ██║██╔══██╗██╔════╝██║     ██╔══██╗    ██╔════╝ ██╔════╝████╗  ██║██║██╔════╝
██║ █╗ ██║███████║███████╗██║     ███████║    ██║  ███╗█████╗  ██╔██╗ ██║██║█████╗  
██║███╗██║██╔══██║╚════██║██║     ██╔══██║    ██║   ██║██╔══╝  ██║╚██╗██║██║██╔══╝  
╚███╔███╔╝██║  ██║███████║███████╗██║  ██║    ╚██████╔╝███████╗██║ ╚████║██║███████╗
 ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝
```
<div align="center">

**وصل جيني** — *One skill layer. Every AI orchestrator. Zero duplication.*

[![MIT License](https://img.shields.io/badge/license-MIT-00C896?style=flat-square)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-The--Untitled--Org-00C896?style=flat-square&logo=github)](https://github.com/The-Untitled-Org/wasla-genie)
[![npm version](https://img.shields.io/npm/v/@untitled-devs/wasla?style=flat-square&logo=npm)](https://www.npmjs.com/package/@untitled-devs/wasla)
[![npm downloads](https://img.shields.io/npm/dm/@untitled-devs/wasla?style=flat-square&logo=npm)](https://www.npmjs.com/package/@untitled-devs/wasla)
[![GitHub Release](https://img.shields.io/github/v/release/The-Untitled-Org/wasla-genie?style=flat-square)](https://github.com/The-Untitled-Org/wasla-genie/releases)
[![CI & Docs Deployment](https://github.com/The-Untitled-Org/wasla-genie/actions/workflows/ci-docs.yml/badge.svg)](https://github.com/The-Untitled-Org/wasla-genie/actions/workflows/ci-docs.yml)
[![Coverage](https://codecov.io/gh/The-Untitled-Org/wasla-genie/branch/main/graph/badge.svg)](https://codecov.io/gh/The-Untitled-Org/wasla-genie)
[![Status](https://img.shields.io/badge/status-alpha-orange?style=flat-square)]()
[![Contributors](https://img.shields.io/github/contributors/The-Untitled-Org/wasla-genie?style=flat-square&color=00C896)](https://github.com/The-Untitled-Org/wasla-genie/graphs/contributors)

</div>

---

## ❗ The Problem

You work across multiple AI orchestrators — **Claude Code**, **Gemini CLI**, and **OpenClaw**.

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
   (`~/.claude/`, `~/.gemini/`, `~/.openclaw/`)
2. **Discovers** all agents and MCPs — wherever they were originally created
3. **Mirrors the full content** into every other tool's equivalent directory using the **"Latest is Greatest"** strategy.
4. **No more duplication.** Whichever tool you used most recently to edit the asset becomes the source of truth for the next sync.

> Full content mirroring. No complex imports. No duplication.  
> Just seamless synchronization that lets each tool use what the other built.

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

`register` detects supported orchestrators and adds the WaslaGenie helper skill inside each one.
Use `waslagenie register --to claude` (or comma-separated targets) to install only specific providers.

---

## 🧭 Which Command When

### End users (installed package)

```bash
# Run once on demand
waslagenie sync

# Keep syncing while you work
waslagenie watch

# Open the visualizer dashboard
waslagenie visualizer

# Optional: install helper skill in all detected providers
waslagenie register

# Optional: install helper skill in specific providers only
waslagenie register --to claude,gemini
```

You can also run without global install:

```bash
# Run sync
npx @untitled-devs/wasla sync

# Open visualizer
npx @untitled-devs/wasla visualizer
```

### You (developing this repo)

```bash
# Build + run sync using your configured scope
npm run sync

# Build + run watch using your configured scope
npm run watch
```

Use `npm run ...` while developing because it runs your local code (`dist`) after build.

### Do I need to reinstall after code changes?

If you run through `npm run ...` in this repo: **No reinstall needed**. Just run the script again; it rebuilds.

If you installed globally with `npm install -g wasla-genie`: **Yes**, reinstall (or relink) to test your latest local changes.

For local development without repeated global installs:

```bash
npm link
waslagenie sync
```

Then after code changes, run `npm run build` (or any script that builds) and use `waslagenie` again.

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

### Automatic background sync — watch mode

`waslagenie watch` is the background sync process. It watches for file changes across all tool directories while the command is running.

```
[watch starts] → WaslaGenie process launched
[File changes] → WaslaGenie detects change and syncs immediately
[watch stops]  → WaslaGenie process exits cleanly
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
├── apps/
│   ├── cli/src/          # CLI commands and visualizer server
│   └── visualizer/src/   # React visualizer
├── packages/
│   ├── adapters/src/     # Per-tool directory knowledge + stub format
│   ├── core/src/         # Registry, scanner, and shared types
│   ├── shared/src/       # Shared config, filesystem, and path helpers
│   └── sync/src/         # Sync orchestration and filesystem watcher
├── tests/
├── scripts/
├── docs/
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
npm run visualizer:install
npm run dev
```

- [Contributing Guide](CONTRIBUTING.md)
- [Architecture Docs](docs/docs/architecture/index.md)
- [Release Guide](RELEASING.md)

---

## 📄 License

MIT © [The Untitled Org](https://github.com/The-Untitled-Org)

---

<div align="center">

**Your agents live where they were born.**  
**WaslaGenie makes sure every tool can find them.**

⭐ Star this repo if you are tired of copy-pasting the same config into five different tools.

</div>
