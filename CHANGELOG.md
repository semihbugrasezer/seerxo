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
