# Branching Strategy

This repository uses a production-oriented Git flow:

```text
feature/* or fix/* -> development -> main -> automatic release
hotfix/* -> main -> development
```

## Branches

`main` is the stable production branch. Only release-ready code should exist here. Do not do direct development on `main`; update it through pull requests from `development` or urgent `hotfix/*` branches.

`development` is the active integration branch. All normal feature and bug-fix work should be merged here first, then validated before a release pull request is opened into `main`.

`feature/*` branches are for new product or technical features. Create them from `development` and merge them back into `development` through a pull request.

`fix/*` branches are for non-urgent bug fixes. Create them from `development` and merge them back into `development` through a pull request.

`hotfix/*` branches are only for urgent production fixes. Create them from `main`, merge them into `main`, then merge the same fix back into `development`.

## Development Flow

Start each feature from the integration branch:

```bash
git switch development
git pull origin development
git switch -c feature/add-keyword-ranking
```

Commit with Conventional Commit messages:

```bash
git commit -m "feat: add keyword ranking service"
```

Push the branch and open a pull request into `development`:

```bash
git push -u origin feature/add-keyword-ranking
```

CI must pass before the pull request is merged.

## Release Flow

When `development` is ready to release:

1. Open a pull request from `development` into `main`.
2. Review the changes and confirm CI passes.
3. Merge the pull request into `main`.
4. The release workflow runs automatically on `main`.
5. `semantic-release` analyzes commit messages, updates the version and changelog, creates a Git tag, and publishes a GitHub Release.

This repository is configured with `npmPublish: false`, so releases do not publish to npm unless that setting is changed intentionally.

## Hotfix Flow

Use hotfix branches only for urgent production fixes:

```bash
git switch main
git pull origin main
git switch -c hotfix/fix-login-crash
```

After the hotfix is reviewed and merged into `main`, merge it back into `development`:

```bash
git switch development
git pull origin development
git merge main
git push origin development
```

## Conventional Commits

Use Conventional Commits for every commit that should influence release notes and versioning.

Examples:

```text
feat: add keyword ranking service
fix: resolve authentication middleware issue
docs: update installation guide
refactor: clean API service layer
test: add unit tests for ranking service
chore: update dependencies
ci: add GitHub Actions workflow
```

Versioning rules:

- `fix:` creates a patch release, such as `v1.0.0` to `v1.0.1`.
- `feat:` creates a minor release, such as `v1.0.0` to `v1.1.0`.
- `feat!:` or `BREAKING CHANGE:` creates a major release, such as `v1.0.0` to `v2.0.0`.

Breaking change examples:

```text
feat!: redesign API response format
```

```text
feat: redesign API response format

BREAKING CHANGE: old API response format is no longer supported
```

## Automatic Releases

The release workflow runs only on pushes to `main`. Normal work should reach `main` by merging a pull request from `development`.

The release workflow:

- installs dependencies with `npm ci`;
- runs tests and build scripts if they exist;
- runs `semantic-release`;
- updates `CHANGELOG.md`;
- updates `package.json` and `package-lock.json` when a release is created;
- creates a Git tag;
- creates a GitHub Release.

## Branch Protection Rules

Configure branch protection in GitHub repository settings. These settings are documented here and are not managed by code in this repository.

Recommended `main` protection:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Restrict direct pushes.
- Do not allow force pushes.
- Do not allow branch deletion.
- Require conversation resolution before merging.
- Optionally require at least one approval.

Recommended `development` protection:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Do not allow force pushes.
- Do not allow branch deletion.

## Examples

Feature branch:

```bash
git switch development
git pull origin development
git switch -c feature/add-title-scoring
git commit -m "feat: add title scoring"
git push -u origin feature/add-title-scoring
```

Bug-fix branch:

```bash
git switch development
git pull origin development
git switch -c fix/quota-message
git commit -m "fix: clarify quota error message"
git push -u origin fix/quota-message
```

Release pull request:

```text
base: main
compare: development
```

Hotfix branch:

```bash
git switch main
git pull origin main
git switch -c hotfix/fix-critical-auth
git commit -m "fix: prevent critical auth crash"
git push -u origin hotfix/fix-critical-auth
```
