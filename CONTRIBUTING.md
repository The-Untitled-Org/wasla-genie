# Contributing to WaslGenie

We're excited to have you contribute to WaslGenie! This document outlines how to get started.

## 🤝 The Team

WaslGenie is developed by The Untitled Org:

- **@inegmdev** (Islam NEGM)
- **@mustafabahaa** (Mustafa Bahaaeldeen)
- **@MoSaeedHammad** (Mohamed SAEED HAMMAD)

## 📋 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

```bash
git clone https://github.com/The-Untitled-Org/wasla-genie.git
cd wasla-genie

npm install
npm run build
```

## 🛠️ Development Workflow

### Available Commands

```bash
# Build
npm run build

# Development (watch mode)
npm run dev

# Testing
npm test                    # Run all tests
npm run test:watch        # Watch mode
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:validation   # E2E validation tests

# Code Quality
npm run type:check        # TypeScript type checking
npm run format:check      # Check code formatting
npm run format            # Fix code formatting
npm run lint:check        # Lint check
npm run lint:fix          # Fix linting issues
npm run check             # Run all checks

# Documentation
npm run docs              # Start docs server
npm run docs:build        # Build docs for production

# Utility
npm run clean             # Remove dist and coverage directories
npm run all               # Clean, build, check, and test
```

## 📝 Code Standards

- **TypeScript**: All code must be strictly typed (`strict: true`)
- **Formatting**: Code is formatted with Prettier
- **Imports**: Use path aliases (`@core`, `@adapters`, etc.) instead of relative imports
- **No Unused Code**: All unused variables and parameters are flagged as errors
- **Comments**: Only add comments for non-obvious logic

### Path Aliases

Use these in your imports for cleaner code:

```typescript
// ✅ Good
import { RegistryManager } from '@core/registry';
import { Scanner } from '@core/scanner';
import { getAdapter } from '@adapters/factory';
import { writeText } from '@utils/fs';

// ❌ Avoid
import { RegistryManager } from '../../src/core/registry';
import { Scanner } from '../../src/core/scanner';
```

## 🧪 Testing

All tests must pass before submitting a PR:

```bash
npm run check       # TypeScript + Prettier
npm test           # All tests
npm run test:coverage  # With coverage report
```

### Test Organization

- **`tests/unit/`** — Unit tests for individual modules
- **`tests/integration/`** — Tests for module interactions
- **`tests/validation/`** — E2E validation of complete workflows

## 📚 Documentation

Documentation lives in `docs/docs/` and is built with Docusaurus.

Key documents:
- `01-project-spec.md` — Product specification
- `02-design-discussion.md` — Design decisions and rationale
- `03-meetings-of-mind.md` — Meeting notes

To contribute docs:

```bash
npm run docs       # Start dev server at localhost:3000
npm run docs:build # Build for production
```

## 🔄 Git Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run `npm run check` and `npm test` to ensure quality
5. Commit with a clear message: `git commit -m "Add my feature"`
6. Push to your fork: `git push origin feature/my-feature`
7. Open a Pull Request against `main`

### Commit Message Guidelines

- Use clear, descriptive messages
- Reference issues when applicable: `Fixes #123`
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`

Example:
```
feat: add conflict resolution with latest-is-greatest strategy

This implements timestamp-based conflict resolution where the most
recently modified file becomes the origin.

Fixes #45
```

## 🐛 Reporting Issues

Found a bug? Have a feature request?

- **Bugs**: Create an issue with steps to reproduce
- **Features**: Describe the use case and expected behavior
- **Questions**: Use discussions for questions about usage

## 📖 Architecture

### Project Structure

```
src/
├── cli/                # Command-line interface
├── core/               # Core logic (registry, scanner, types)
├── adapters/           # Tool-specific adapters
├── syncer/             # Sync orchestration
├── daemon/             # File watcher
└── utils/              # Utilities
```

### Key Concepts

- **Registry**: JSON file tracking all discovered assets and their sync state
- **Scanner**: Detects tools and discovers agent/MCP files
- **Adapter**: Tool-specific implementation for stub writing
- **Syncer**: Orchestrates the sync process
- **Daemon**: Watches for changes and auto-syncs (via chokidar)

## 🤔 Need Help?

- Check existing issues and discussions
- Read the [Project Spec](docs/docs/01-project-spec.md)
- Review [Design Discussion](docs/docs/02-design-discussion.md)
- Join discussions on GitHub

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

**Thanks for contributing to WaslGenie!** 🎉
