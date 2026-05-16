# Contributing

We welcome contributions to WaslGenie! Whether you're interested in fixing bugs, adding features, improving documentation, or creating adapters for new tools, there's a place for you here.

## Getting Started

```bash
git clone https://github.com/The-Untitled-Org/wasla-genie
cd wasla-genie
npm install
npm run dev
```

## Development Workflow

### Running Tests

```bash
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run test:validation   # E2E validation
npm run test:all          # Run all tests
```

### Code Quality

```bash
npm run lint:check        # Check linting
npm run lint:fix          # Fix linting issues
npm run format:check      # Check formatting
npm run format            # Format code
npm run type:check        # Type checking
```

### Documentation

```bash
npm run docs:dev          # Start Docusaurus locally
npm run docs:build        # Build static docs
```

## Project Structure

- `src/` — Source code (CLI, adapters, core logic)
- `tests/` — Test suites (unit, integration, validation)
- `docs/` — Docusaurus documentation
- `blog/` — Blog posts

See [Development Guide](https://github.com/The-Untitled-Org/wasla-genie/blob/main/DEVELOPMENT.md) for VSCode setup and debugging.

## Writing an Adapter

Interested in adding support for a new orchestrator? Check out [Writing an Adapter](/architecture/adapters) to learn the adapter interface and implementation pattern.

## Submitting Changes

1. Create a feature branch from `main`
2. Make your changes and add tests
3. Ensure all tests pass: `npm run test:all`
4. Run quality checks: `npm run check:all`
5. Submit a PR with a clear description

## Code of Conduct

Be respectful and collaborative. We're building this together.

## Questions?

- Check the [Project Specification](/specs/project-spec)
- Read the [Design Discussion](/specs/design-discussion)
- Browse [Meetings of Mind](/mom)
- Open an issue on [GitHub](https://github.com/The-Untitled-Org/wasla-genie)

---

**Thanks for contributing to WaslGenie!** ✨
