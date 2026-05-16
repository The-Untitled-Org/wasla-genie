# VSCode Development Guide

This guide explains how to set up and use WaslaGenie development in VSCode.

## 📦 Recommended Extensions

These extensions are configured in `.vscode/extensions.json`:

- **[Terminal Keeper](https://marketplace.visualstudio.com/items?itemName=nguyenngoclong.terminal-keeper)** — Manage terminal sessions and auto-execute commands
- **[Git Graph](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph)** — Visualize git history
- **[VSCode Icons](https://marketplace.visualstudio.com/items?itemName=vscode-icons-team.vscode-icons)** — Better file icons
- **[Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)** — Code formatter

VSCode will prompt you to install these when you open the project.

## 🎯 Terminal Sessions

The `.vscode/sessions.json` file defines preset terminal sessions that you can quick-launch.

### Available Sessions

1. **dev:build** — Compile TypeScript and show status
2. **dev:watch** — Watch mode for auto-compilation
3. **test:watch** — Watch tests and re-run on changes
4. **test:all** — Run complete test suite
5. **lint:check** — Check for linting issues
6. **format:check** — Check code formatting
7. **format:fix** — Auto-fix formatting
8. **lint:fix** — Fix linting issues
9. **docs:dev** — Start Docusaurus dev server

### How to Use

1. Open the Terminal Keeper sidebar (or press ⌘+Shift+T on Mac)
2. Click any session to open it in a new terminal
3. Sessions marked "autoExecuteCommands: true" run automatically

## ⚙️ VSCode Settings

Configuration in `.vscode/settings.json`:

### Prettier Integration

- **Default formatter**: Prettier for TypeScript, JSON, Markdown
- **Format on save**: Enabled for all supported file types
- **Tab width**: 2 spaces
- **Line width**: 100 characters
- **Trailing commas**: ES5 (objects & arrays)
- **Single quotes**: Enabled

### File Exclusions

Keeps sidebar clean by hiding:
- `node_modules/`
- `.waslagenie/` (local working directory)
- `.claude/`, `.gemini/`, `.config/opencode/` (tool directories)

## 🐛 Debugging

Launch configurations in `.vscode/launch.json`:

### Debug CLI

```
F5 → "Debug CLI"
```

Runs the WaslaGenie CLI in the debugger. Add breakpoints and step through code.

### Debug Tests

```
F5 → "Debug Tests"
```

Runs Vitest in debug mode. Great for stepping through test logic.

### Debug Sync Command

```
F5 → "Debug Sync Command"
```

Runs `waslagenie sync` with debugger attached.

### How to Debug

1. Set breakpoints by clicking in the left margin
2. Select a configuration from the Run menu or press F5
3. Use the Debug toolbar to step through code
4. Watch panel shows variable values

## 🔍 Code Quality Workflow

### Before Committing

```bash
npm run check    # TypeScript + Prettier check
npm test         # Run all tests
```

### Auto-Fix Issues

```bash
npm run format   # Fix formatting
npm run lint:fix # Fix linting issues
```

### Full Quality Check

```bash
npm run all      # Clean, build, check, test
```

## 📝 Code Navigation

### Using Path Aliases

All imports use aliases for clarity:

```typescript
// ✅ Clean and readable
import { RegistryManager } from '@core/registry';
import { Syncer } from '@syncer/index';

// Quick jump to definition: Cmd+Click on import
```

### Go to Definition

- **Cmd+Click** (Mac) or **Ctrl+Click** (Windows/Linux) on any symbol
- Works across aliased imports thanks to tsconfig.json paths

### Search

- **Cmd+Shift+F** — Search entire codebase
- **Cmd+P** — Quick file search
- **Cmd+Shift+O** — Search symbols in current file

## 🧪 Running Tests

### From Terminal Sessions

1. Open "test:watch" session
2. Tests run on file changes
3. Press `q` to quit, `a` to run all tests

### From CLI

```bash
npm test                    # Run once
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:validation    # E2E tests only
```

### Debugging Tests

1. Set breakpoint in test file
2. Press F5 and select "Debug Tests"
3. Step through test execution

## 📚 Documentation

### Local Dev Server

```bash
npm run docs
```

Opens docs at `http://localhost:3000/wasla-genie/`

- Hot-reload on file changes
- Full-text search
- Mobile-responsive

### Building Docs

```bash
npm run docs:build
```

Generates static site in `docs/build/`

## 💡 Tips & Tricks

### Quick Build & Test

```
Cmd+Shift+P → "Terminal: Run Task" → "npm: build"
```

### Jump Between Related Files

```
Ctrl+Tab → Navigate open files
Cmd+P → Quick file search
```

### View Problems

```
Cmd+Shift+M → Show Problems panel (errors/warnings)
```

### Format on Save

Prettier runs automatically when you save a file (configured in settings.json)

### Terminal Splitting

```
Cmd+\ → Split terminal
Cmd+J → Toggle terminal panel
```

## 🔗 Useful Links

- [VSCode Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)
- [TypeScript in VSCode](https://code.visualstudio.com/docs/languages/typescript)
- [Vitest Documentation](https://vitest.dev/)
- [Prettier Documentation](https://prettier.io/docs/en/index.html)

---

**Happy coding!** 🚀
