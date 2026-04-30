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
