# Releasing

Publishing is triggered when a `v*` Git tag is pushed. The publish workflow publishes to npm and creates
a GitHub Release containing that version's `CHANGELOG.md` section. It rejects a release unless:

- The Git tag matches the version in `package.json`.
- `package.json` and `package-lock.json` contain the same version.
- `CHANGELOG.md` contains a heading for the release version.

## Release Steps

Start from an up-to-date, clean `main` branch:

```bash
git switch main
git pull --ff-only
git status
npm ci
npm --prefix apps/visualizer ci
npm run check
npm test -- --run
```

Choose the appropriate semantic version bump and prepare the release:

```bash
npm run release -- patch
# Use minor or major instead of patch when appropriate.
```

The command runs checks and tests, updates `package.json` and `package-lock.json`, regenerates
`CHANGELOG.md`, creates the release commit, and adds an annotated tag. The changelog groups commits by
type and records each short commit SHA and title.

Review the local release, then push it:

```bash
git show --stat
git show v0.1.3:CHANGELOG.md
git push origin main --follow-tags
```

To push immediately after the release is prepared, use:

```bash
npm run release -- patch --push
```

Confirm that the `Publish to NPM` GitHub Actions workflow succeeds. The workflow is retriable: it skips
the npm publish or GitHub Release creation step if that part already completed during an earlier run.

## Regenerating The Changelog

To rebuild `CHANGELOG.md` from the current tags and commits without creating a release:

```bash
npm run changelog
```

To preview the GitHub Release notes for an existing version:

```bash
node scripts/release.mjs release-notes v0.1.3
```

To create a missing GitHub Release for an existing tag:

```bash
node scripts/release.mjs release-notes v0.1.3 > release-notes.md
gh release create v0.1.3 --verify-tag --title v0.1.3 --notes-file release-notes.md
rm release-notes.md
```

## Fixing A Tag Created Too Early

If a tag has not been pushed, delete it locally and follow the release steps:

```bash
git tag -d v0.1.3
```

If a tag was pushed but publishing failed, delete the remote tag before recreating it on the release commit:

```bash
git push origin :refs/tags/v0.1.3
git tag -d v0.1.3
```
