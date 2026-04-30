# Contributing

This project uses a lightweight Gitflow-style workflow designed for a solo maintainer while still keeping production releases disciplined. See [BRANCHING.md](BRANCHING.md) for the full branch policy and cleanup plan.

## Branch Strategy

- `main` is production-ready. Only stable releases are merged here.
- `develop` is the integration branch for day-to-day work.
- `feature/*` branches are created from `develop` for new functionality.
- `fix/*` branches are created from `develop` for non-urgent bugs.
- `release/*` branches are created from `develop` for final version bumps, docs, changelog updates, and release validation.
- `hotfix/*` branches are created from `main` for urgent production or npm package fixes.
- `docs/*` branches are created from `develop` for documentation-only changes.
- `chore/*` branches are created from `develop` for maintenance.

## Typical Workflow

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop

git switch -c feature/mcp-tool-validation
# make changes
npm ci
npm run lint
npm test
npm run build

git add .
git commit -m "feat: add MCP tool validation"
git push -u origin feature/mcp-tool-validation
```

Open a pull request into `develop`. Feature and fix branches should be squash-merged after CI passes.

## Release Workflow

```bash
git switch develop
git pull --ff-only origin develop
git switch -c release/v1.1.0
npm version minor --no-git-tag-version
# update CHANGELOG.md and docs
git add package.json package-lock.json CHANGELOG.md README.md
git commit -m "chore: prepare v1.1.0 release"
git push -u origin release/v1.1.0
```

Open a pull request from `release/v1.1.0` to `main`. After merging to `main`, create the version tag and merge the release branch back into `develop`.

```bash
git switch main
git pull --ff-only origin main
npm version minor
git push origin main --follow-tags

git switch develop
git merge --no-ff release/v1.1.0
git push origin develop
```

## Hotfix Workflow

```bash
git switch main
git pull --ff-only origin main
git switch -c hotfix/cli-login-crash
# fix and test
git commit -m "fix: resolve CLI login crash"
git push -u origin hotfix/cli-login-crash
```

Open a pull request into `main`, then merge the same fix back into `develop`.

## Commit Convention

Use Conventional Commits:

- `feat:` new user-facing functionality
- `fix:` bug fixes
- `chore:` maintenance, dependency, or release work
- `docs:` documentation only
- `refactor:` code restructuring without behavior changes
- `perf:` performance improvements
- `test:` test additions or changes
- `ci:` workflow or automation changes
- `security:` security hardening

Examples:

```bash
git commit -m "feat: add Etsy keyword scoring"
git commit -m "fix: resolve MCP server startup issue"
git commit -m "security: mask sensitive API key logs"
```

## Pull Request Requirements

- Target `develop` for feature and fix work.
- Target `main` only from `release/*` or `hotfix/*`.
- Fill out the PR template.
- Keep PRs focused and reasonably small.
- CI must pass before merge.
- Update docs, changelog, and tests when behavior changes.
- Do not include API keys, tokens, local config files, or unmasked customer data.

## Local Validation

```bash
npm ci
npm run lint
npm test
npm run build
```
