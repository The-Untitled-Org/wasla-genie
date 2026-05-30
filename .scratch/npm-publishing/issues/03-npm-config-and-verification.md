Status: done

## Parent
[.scratch/npm-publishing/PRD.md](PRD.md)

## What to build
Finalize the `package.json` configuration for npm publication and verify the integrity of the published package.
- Add the `"files"` array to `package.json` to include only `dist` and `src/visualizer/dist`.
- Add the `"prepublishOnly"` script to trigger a full build of both UI and CLI.
- Verify the package by generating a tarball and performing a clean global installation test.

## Acceptance criteria
- [ ] `package.json` contains `"files": ["dist", "src/visualizer/dist"]`.
- [ ] `package.json` contains a `"prepublishOnly"` script that runs builds.
- [ ] `npm pack` produces a `.tgz` that contains only necessary files.
- [ ] A clean global installation of the `.tgz` results in a working `waslagenie` command with a functional UI.

## Blocked by
- [.scratch/npm-publishing/issues/02-global-path-resolution.md](02-global-path-resolution.md)
