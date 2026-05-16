---
name: commit-msg
description: Generates or validates git commit messages according to the Conventional Commits specification. Use when preparing a commit or when asked to write a commit message.
---

# Conventional Commit Messages

Adhere to the Conventional Commits specification for all commit messages. This ensures a consistent, machine-readable history that supports automated versioning and changelog generation.

## Core Workflow

1.  **Identify Intent**: Determine if the change is a `feat`, `fix`, `docs`, `refactor`, `style`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`.
2.  **Assess Impact**: Check for **BREAKING CHANGES**. If found, append `!` to the type/scope or use the `BREAKING CHANGE:` footer.
3.  **Draft Message**: Use the format: `<type>[optional scope]: <description>`.
4.  **Refine**: Ensure the description is in the imperative mood (e.g., "add", not "added").

## Reference & Examples

For the full specification and various examples, see [conventional-commits.md](references/conventional-commits.md).

### Quick Examples
- `feat(auth): add JWT support`
- `fix: prevent null pointer in user service`
- `feat(api)!: remove deprecated v1 endpoints`
- `docs: update readme with new deployment steps`
