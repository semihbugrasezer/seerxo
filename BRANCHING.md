# Branching Policy

This repository keeps only two permanent branches:

```text
main        -> production / stable
develop     -> active development
```

All other branches are short-lived and must be deleted after merge.

## Allowed Short-Lived Branches

```text
feature/<short-description>   -> new features
fix/<short-description>       -> bug fixes
hotfix/<short-description>    -> urgent production fixes
release/<version>             -> release preparation
docs/<short-description>      -> documentation
chore/<short-description>     -> maintenance
```

Use lowercase kebab-case.

## Merge Rules

- No direct commits to `main`.
- No direct commits to `develop`.
- All changes go through pull requests.
- `main` accepts merges from `develop`, `release/*`, or `hotfix/*`.
- `develop` accepts completed `feature/*`, `fix/*`, `docs/*`, and `chore/*` work.
- Delete branches after merge.
- Prefer squash merge for short-lived branches.

## Branch Cleanup Plan

Keep permanently:

```text
main
develop
```

Delete stale remote branches after confirming they are merged or no longer needed:

```bash
git branch -r --merged origin/main
git branch -r --merged origin/develop
git push origin --delete old-branch-name
```

Delete stale local branches:

```bash
git branch -d old-branch-name
```

Rename useful unmerged work into the allowed pattern:

```bash
git branch -m old-random-name feature/clear-description
git push -u origin feature/clear-description
git push origin --delete old-random-name
```

## Safe Migration Commands

Create `develop` from `main` if it does not exist:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c develop
git push -u origin develop
```

Start a feature:

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feature/cache-seo-generation
```

Start a fix:

```bash
git switch develop
git pull --ff-only origin develop
git switch -c fix/env-validation
```

Start a hotfix:

```bash
git switch main
git pull --ff-only origin main
git switch -c hotfix/api-key-leak
```

Start a release:

```bash
git switch develop
git pull --ff-only origin develop
git switch -c release/v1.1.0
npm version minor --no-git-tag-version
```

## Pull Request Naming

Use Conventional Commit style:

```text
feat: add Etsy keyword scoring
fix: resolve MCP server startup issue
docs: improve Claude Desktop setup guide
chore: update GitHub Actions
security: mask sensitive logs
```

## Branch Protection Recommendations

`main`:

- Require pull request before merging.
- Require at least 1 approval.
- Require status checks to pass.
- Require conversation resolution.
- Require linear history.
- Restrict direct pushes.
- Disable force pushes.
- Disable branch deletion.
- Allow merges only from `develop`, `release/*`, and `hotfix/*` by policy.

`develop`:

- Require pull request before merging.
- Require status checks to pass.
- Require conversation resolution.
- Prefer squash merge.
- Disable force pushes.

Required checks:

- `Node 20`
- `Node 22`
- `Secret scan`
