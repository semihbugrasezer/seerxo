# Git Workflow

This workflow is intentionally practical for a solo maintainer while matching the expectations of a production engineering project.

## Branch Strategy

### `main`

- Production-ready branch.
- Only stable releases are merged here.
- No direct commits.
- Accepts pull requests from `release/*` and `hotfix/*`.
- A merge to `main` should be followed by `npm version <patch|minor|major>` and `git push origin main --follow-tags`.

### `develop`

- Main integration branch.
- Default target for ongoing development.
- Feature and fix branches merge here through pull requests.
- CI must pass before merge.

### `feature/*`

- Created from `develop`.
- Used for new features.
- Examples:
  - `feature/mcp-tool-validation`
  - `feature/etsy-keyword-scoring`
  - `feature/cli-auth-flow`
  - `feature/cache-seo-generation`

### `fix/*`

- Created from `develop`.
- Used for non-urgent bug fixes.
- Examples:
  - `fix/mcp-server-startup`
  - `fix/env-validation`
  - `fix/duplicate-request-cache`

### `release/*`

- Created from `develop`.
- Used for final testing, docs, changelog, and version bump.
- Merged into `main` and then back into `develop`.
- Examples:
  - `release/v1.1.0`
  - `release/v1.2.0`

### `hotfix/*`

- Created from `main`.
- Used for urgent production or npm package fixes.
- Merged into both `main` and `develop`.
- Examples:
  - `hotfix/api-key-leak`
  - `hotfix/cli-login-crash`

### `docs/*`

- Created from `develop`.
- Used for documentation-only updates.

### `chore/*`

- Created from `develop`.
- Used for maintenance, dependency, and automation changes.

## Create `develop` from `main`

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c develop
git push -u origin develop
```

If `develop` already exists:

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
```

## Create Feature Branches

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feature/mcp-tool-validation
```

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feature/etsy-keyword-scoring
```

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feature/cli-auth-flow
```

## Create Fix Branches

```bash
git switch develop
git pull --ff-only origin develop
git switch -c fix/duplicate-request-cache
```

## Create Release Branches

```bash
git switch develop
git pull --ff-only origin develop
git switch -c release/v1.1.0
npm version minor --no-git-tag-version
```

## Create Hotfix Branches

```bash
git switch main
git pull --ff-only origin main
git switch -c hotfix/cli-login-crash
```

## GitHub Branch Protection Settings

### `main`

Enable:

- Require a pull request before merging.
- Require approvals: `1`.
- Dismiss stale pull request approvals when new commits are pushed.
- Require conversation resolution before merging.
- Require status checks to pass before merging.
- Required checks:
  - `Node 20`
  - `Node 22`
  - `Secret scan`
- Require branches to be up to date before merging.
- Require linear history.
- Restrict who can push to matching branches.
- Do not allow force pushes.
- Do not allow deletions.

Policy:

- Only merge PRs from `release/*` or `hotfix/*`.
- Use merge commits or squash consistently for release PRs.
- Create a version tag after merge with `npm version patch`, `npm version minor`, or `npm version major`.

### `develop`

Enable:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Required checks:
  - `Node 20`
  - `Node 22`
  - `Secret scan`
- Require conversation resolution before merging.
- Do not allow force pushes.
- Prefer squash merge for `feature/*` and `fix/*`.

## Merge Policy

- `feature/*` -> `develop`: squash merge.
- `fix/*` -> `develop`: squash merge.
- `release/*` -> `main`: release PR after final validation.
- `release/*` -> `develop`: back-merge after main release.
- `hotfix/*` -> `main`: urgent fix PR.
- `hotfix/*` -> `develop`: back-merge immediately after main.

## Conventional Commits

Examples:

```bash
git commit -m "feat: add Etsy keyword scoring"
git commit -m "fix: resolve MCP server startup issue"
git commit -m "chore: update dependencies"
git commit -m "docs: improve Claude Desktop setup guide"
git commit -m "refactor: simplify SEO generation service"
git commit -m "perf: cache duplicate SEO generation requests"
git commit -m "test: add unit tests for listing generator"
git commit -m "ci: add GitHub Actions workflow"
git commit -m "security: mask sensitive logs"
```

## Why This Improves the Project

- `main` stays stable and recruiter-friendly.
- `develop` gives ongoing work a clear integration path.
- Pull requests create visible review and validation history.
- CI catches broken tests, syntax errors, packaging issues, dependency risks, and leaked secrets.
- Semantic versioning makes npm releases predictable.
- Release branches provide a clean place for final docs, changelog, and version bump work.
- Hotfix branches keep urgent production fixes controlled without mixing them into feature work.
