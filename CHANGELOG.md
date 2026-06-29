# [1.3.0](https://github.com/semihbugrasezer/etsy-seo-mcp/compare/v1.2.1...v1.3.0) (2026-06-29)


### Features

* **skill:** copy-paste-ready Etsy output + full value surfaced ([#57](https://github.com/semihbugrasezer/etsy-seo-mcp/issues/57)) ([5d2ae04](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/5d2ae0427c472a60c6fd7f672418977eac074a75))

## [1.2.1](https://github.com/semihbugrasezer/etsy-seo-mcp/compare/v1.2.0...v1.2.1) (2026-06-29)


### Bug Fixes

* drop suggested price; correct README/skill to real features ([#56](https://github.com/semihbugrasezer/etsy-seo-mcp/issues/56)) ([ed9ae0f](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/ed9ae0fbcdf8f70798315fdf513d2e0981c85fa6))

# [1.2.0](https://github.com/semihbugrasezer/etsy-seo-mcp/compare/v1.1.5...v1.2.0) (2026-06-29)


### Features

* **skill:** add Claude Code skill installer (third way to use Seerxo) ([#55](https://github.com/semihbugrasezer/etsy-seo-mcp/issues/55)) ([66bda25](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/66bda2539832b8cc3f5ff50f77a4d4c7231dee59))

## [1.1.5](https://github.com/semihbugrasezer/etsy-seo-mcp/compare/v1.1.4...v1.1.5) (2026-06-24)


### Bug Fixes

* unblock semantic-release checks ([2a9b9e0](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/2a9b9e0f79d631db0cc2eb69fab7948445f8f140))

## [1.1.4](https://github.com/semihbugrasezer/etsy-seo-mcp/compare/v1.1.3...v1.1.4) (2026-06-24)


### Bug Fixes

* unblock checkout update checks ([c89cd01](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/c89cd01fa5b6ad9c0fc334e6aaeb57c5085ab55d))

## [1.1.3](https://github.com/semihbugrasezer/etsy-seo-mcp/compare/v1.1.2...v1.1.3) (2026-06-11)


### Bug Fixes

* enable npm publishing ([85d749e](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/85d749e4e0c0945f71f4926d6b20ba1b1e003283))
* grant release workflow publish permissions ([1dcc7f9](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/1dcc7f93c38c02bc2c1790266c7ddaeb850fb969))
* pass npm token to release ([2601f64](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/2601f643f788d36cc0509a6aee29211ef1dc8541))
* update npm override for osv ([f91f3bf](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/f91f3bf9511197d104fd9d5143ea48520acc19c4))

## [1.1.2](https://github.com/semihbugrasezer/etsy-seo-mcp/compare/v1.1.1...v1.1.2) (2026-05-30)


### Bug Fixes

* Fix Windows MCP stdout issue and libuv crash ([cabe47b](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/cabe47b4833cb1ec14f9eca13f2f8ed420ace588))

# [1.1.1](https://github.com/semihbugrasezer/etsy-seo-mcp/compare/v1.1.0...v1.1.1) (2026-05-08)


### Bug Fixes

* override ip-address vulnerability ([0e945bf](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/0e945bfded46fd0530e09b2eb76283ade1e528da))

# [1.1.0](https://github.com/semihbugrasezer/etsy-seo-mcp/compare/v1.0.6...v1.1.0) (2026-04-30)


### Bug Fixes

* add openUrlInBrowser, simplify login (no email required) ([9513314](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/951331435be150ecc45bfac7f3a5f0b1cca454bb))
* show actual error detail in CLI, bump 1.0.8 ([ec70c02](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/ec70c0263ea4f26876a1f62312fd1c4ee1c33951))
* validate configured API host ([c64e671](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/c64e6711d8c62994fd76d9de4cb24447e4affdb7))


### Features

* improve cli auth and clear commands ([cf999b1](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/cf999b1ca55c7a78ac054251d446bd68ef3eecba))
* improve cli credit visibility ([bef9938](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/bef99384a4e2272c166e26c78365d44943279289))


### Performance Improvements

* cache pending promise to avoid concurrent duplicate requests in generateEtsySEO ([c42f130](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/c42f13097a9edf3db1cae730a8be25747ed1f31d))
* extract inline regex to constant ([050c321](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/050c32181062f56107983f65589f2c51ae718ecd))
* replace regex with native string methods in normalizeHost ([22eb1a5](https://github.com/semihbugrasezer/etsy-seo-mcp/commit/22eb1a501cd3ed8ca347166ec7bfb65fe7698975))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Professional Git workflow documentation for `main`, `develop`, `feature/*`, `fix/*`, `release/*`, and `hotfix/*`.
- Pull request and issue templates.
- CI workflow for pull requests and development branches.
- Release workflow for draft GitHub releases.

### Changed

- Documented release discipline, semantic versioning, and contribution rules.

### Security

- Added host normalization hardening and regression tests.

## [1.0.8] - 2026-04-30

### Added

- CLI and MCP package distribution under the `seerxo` package.
- Claude Desktop MCP integration instructions.
- Local CLI authentication and configuration flow.

### Security

- API keys are expected in `keyId.secret` format and should be kept out of source control.
