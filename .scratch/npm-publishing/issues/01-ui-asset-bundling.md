Status: done

## Parent
[.scratch/npm-publishing/PRD.md](PRD.md)

## What to build
Create a standard static asset pipeline for the Visualizer UI to remove dependencies on the root `docs/` folder.
- Create a `public/` directory within `src/visualizer/`.
- Copy the project logo from `docs/static/img/logo.png` to `src/visualizer/public/logo.png`.
- Update the Visualizer UI and the CLI's `buildConfig` to reference the logo at `/logo.png`.
- Remove the custom `/api/branding/waslagenie-logo` route from the CLI server.

## Acceptance criteria
- [ ] `src/visualizer/public/logo.png` exists.
- [ ] `src/cli/commands/visualizer.ts` no longer has a route for `/api/branding/waslagenie-logo`.
- [ ] The WaslaGenie provider icon in `buildConfig` points to `/logo.png`.
- [ ] After building the visualizer (`npm run visualizer:build`), the logo is present in `src/visualizer/dist/logo.png`.

## Blocked by
None - can start immediately
