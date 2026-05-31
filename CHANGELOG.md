# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]



## [1.0.0] - 2026-05-31

### Added

- `5705fc8` feat: enhance publish workflow with npm publish check and GitHub Release creation logic
- `584b53b` feat: add npm version, downloads, and GitHub Release badges to README and index pages
- `9eca871` feat: add Code of Conduct and Security Policy documents
- `3383355` feat: update terminal sessions for tasks and add release workflows in sessions.json
- `415292e` feat(scanner): implement a new Scanner class for detecting installed tools and scanning assets

## [0.1.3] - 2026-05-31

### Added

- `60570d0` feat: add @docusaurus/theme-mermaid dependency and enhance assetList tests
- `5c4d640` feat: enhance release workflow with changelog generation and validation

### Fixed

- `0826786` fix: add @types/prompts for TypeScript type definitions
- `cbbdca9` fix: resolve TypeScript type errors with prompts library and add missing test coverage
- `3e8d36a` fix: apply CodeRabbit auto-fixes
- `e80c9f8` fix: improve cross-platform file path parsing and extension handling
- `7b2de59` fix: cross-platform path parsing in scanner

### Chores

- `7506ed4` chore(release): v0.1.3

### Other

- `8bc43b8` Refactor CLI configuration management and improve user experience

## [0.1.2] - 2026-05-31

### Added

- `28d5e56` feat: update VSCode sessions and remove TaskFile.yaml
- `f8dfc23` feat: remove deprecated files and enhance npm package configuration

## [0.1.1] - 2026-05-31

### Documentation

- `1cfc1f8` docs: update README with correct scoped package name and usage

### Chores

- `6be6297` chore: bump version to 0.1.1

## [0.1.0] - 2026-05-30

### Added

- `69f8ca3` feat: scaffold core project architecture with CLI, adapters, and documentation site
- `dad997c` feat: add OpenAI Codex CLI support, update documentation structure, and refine implementation plan to include session-scoped synchronization.
- `c38dedd` feat: add issue and pull request templates to project repository
- `53f317a` feat(visualizer): initialize visualizer application with React and Vite
- `86b39a7` feat: bundle logo as visualizer public asset
- `761853f` feat: resolve visualizer dist path relative to module
- `dc965d7` feat: add npm publish config to package.json
- `1bb0048` feat: rename package to @untitled-devs/wasla and add publish workflow

### Fixed

- `f1e4f5a` fix: remove duplicate identifiers and fix test failures
- `994e44d` fix: improve Windows compatibility for build scripts and path handling

### Changed

- `3013541` refactor: remove unused fs import and unused asset type definition
- `750370c` refactor: rename WaslGenie → WaslaGenie across all code and docs

### Documentation

- `0594d3e` docs: reorganize documentation and add commit-msg skill
- `680e2a2` docs: move and refine MoM 20260515
- `040b519` docs(spec): update MVP scope and reorganize AI sessions
- `3b3f3e1` docs: implement "Latest is Greatest" sync strategy with simplified registry
- `50d1ed2` docs(plan): add MVP implementation plan with Latest-is-Greatest strategy
- `7f148d7` docs: expand supported tools to include Codex CLI, Cursor, and GitHub Copilot
- `ec9bd7c` docs: update project documentation in README.md
- `ead74e3` docs: resolve conflicts — sync model, gradual centralization, grilling archive notice
- `fc5b07d` docs(readme): fix ASCII banner placement outside center div
- `ba2754a` docs: rename product from WaslGenie to WaslaGenie throughout
- `5d7ea0d` docs: update Meeting of Minds documentation links to root directory
- `8c0c020` docs(readme): update ASCII banner to reflect WaslaGenie rename
- `ff907c5` docs: update provider documentation to reflect current agent and MCP configuration workflows
- `f706bfa` docs: update README and provider documentation for clarity on sync and registration commands feat: enhance register command to support targeted provider registration fix: correct file paths in sync and MCP configurations for Claude and Gemini providers test: add unit tests for register command and validate cross-provider sync functionality

### Tests

- `1036442` test: expand adapter integration suite and improve test infrastructure
- `0a6bcf5` test: implement comprehensive unit and integration tests for adapter installation, CLI output formatting, registry persistence, and scanner logic
- `6ed819a` test: e2e synchronization tests for new providers
- `2a7aca4` test: restore 100% coverage for paths.ts and fix cross-platform regressions
- `6d40c92` test: fix cross-platform path resolution in unit tests

### Build and CI

- `e21f444` ci: add CI pipeline for build, test, and docs deployment and update Meetings of Mind route path

### Chores

- `f6bcaf6` chore: track package-lock.json, update Node.js to v22, and configure CI cache paths
- `7a9aadf` chore: upgrade Node.js version to 24 in ci-docs workflow
- `8d42db3` chore: upgrade vitest, enhance coverage configuration, and integrate Codecov into CI pipeline
- `19da188` chore: output registry to output/tests dir during testing
- `634dc1c` style: fix formatting for unit and integration tests
- `f66dcf6` chore: setup Matt Pocock's engineering skills
- `68e326c` chore: add sandcastle automation and update dependencies
- `eeb52cb` style: fix formatting in visualizer path resolution tests
- `06926b9` chore: add pr-checklist task to TaskFile.yaml
- `1d312bc` chore: include docs build in pr-checklist
- `8a6eb00` chore: expand pr-checklist to include visualizer and docs installation
- `cd43e03` chore: ensure pr-checklist runs tests in non-watch mode
- `41faf61` chore: include visualizer build in pr-checklist

### Other

- `b38117b` Initial commit
- `b292791` created initial repo description
- `75973d9` draft version of specs
- `06d7649` Add the initial mom and grilling session with claude.
- `4e658fb` Add orchestrator comparison documentation for agents, MCP servers, and skills
- `7a0d607` Fix multiple issues and add configuration guides
- `cd82834` Refactor paths and update tests for skill handling
