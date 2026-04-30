# Release Process

This project uses Semantic Versioning and release branches.

## Version Rules

- `PATCH`: backwards-compatible bug fixes, for example `v1.1.1`.
- `MINOR`: backwards-compatible features, for example `v1.2.0`.
- `MAJOR`: breaking CLI, MCP, config, or package behavior changes, for example `v2.0.0`.

## Release Branch

Create releases from `develop`.

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c release/v1.1.0
npm version minor --no-git-tag-version
```

Before opening the release PR:

- Update `CHANGELOG.md`.
- Update `README.md` examples if behavior changed.
- Run `npm run lint`.
- Run `npm test`.
- Run `npm run build`.
- Confirm no secrets or local config files are included.

Open a pull request from `release/v1.1.0` to `main`.

## Main Merge and Tag

After the release PR merges:

```bash
git switch main
git pull --ff-only origin main
npm version patch
git push origin main --follow-tags
```

Use the correct version type:

```bash
npm version patch   # 1.0.0 -> 1.0.1 small fix
npm version minor   # 1.0.0 -> 1.1.0 backwards-compatible feature
npm version major   # 1.0.0 -> 2.0.0 breaking change
```

The release workflow runs on `v*.*.*` tags, creates a GitHub Release, and publishes the package to npm.

## npm Publishing Checklist

- `NPM_TOKEN` exists in GitHub repository secrets.
- The package name and version in `package.json` are correct.
- `npm run build` validates the package metadata and publish file list.
- GitHub release notes are reviewed after the tag workflow completes.
- The release workflow passes.

## Back-Merge

Merge the release branch back into `develop` so version and changelog changes stay in the integration branch.

```bash
git switch develop
git pull --ff-only origin develop
git merge --no-ff release/v1.1.0
git push origin develop
```
