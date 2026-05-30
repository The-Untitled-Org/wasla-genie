Status: done

## Parent
[.scratch/npm-publishing/PRD.md](PRD.md)

## What to build
Ensure the `waslagenie` CLI can find the Visualizer UI assets when installed globally by switching to module-relative path resolution.
- Update `src/cli/commands/visualizer.ts` to use `import.meta.url` for path resolution.
- Replace `process.cwd()` usage for `visualizerDist` with a path resolved relative to the current module's location.
- Ensure the resolution logic works correctly when running from the compiled `dist/` directory.

## Acceptance criteria
- [ ] `src/cli/commands/visualizer.ts` uses `fileURLToPath(import.meta.url)` to resolve paths.
- [ ] `visualizerDist` is no longer dependent on `process.cwd()`.
- [ ] The `waslagenie ui` command correctly locates the UI assets in `src/visualizer/dist` even if the command is invoked from a different directory.

## Blocked by
- [.scratch/npm-publishing/issues/01-ui-asset-bundling.md](01-ui-asset-bundling.md)
