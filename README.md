# Seerxo Etsy SEO MCP / CLI

AI-powered Etsy SEO tooling for generating optimized product titles, descriptions, tags, and price guidance from Claude Desktop, MCP clients, or the terminal.

This repository contains the public CLI/MCP package for Seerxo. It is designed for Etsy sellers and creators who want fast listing drafts while keeping authentication, API key handling, and package distribution simple.

## Features

- Claude Desktop compatible MCP server.
- Interactive CLI for Etsy listing generation.
- Google-assisted login flow through the Seerxo backend.
- Manual API key configuration for local or scripted usage.
- HMAC-signed API requests using `keyId.secret` credentials.
- Quota display and upgrade-aware error messages.
- Safe host normalization and local config handling.

## Installation

```bash
npm install -g seerxo
```

Requirements:

- Node.js 18 or newer.
- npm 9 or newer.
- A Seerxo account and API key.

## CLI Usage

Start the interactive CLI:

```bash
seerxo
```

Sign in:

```bash
seerxo login
```

Generate from the command line:

```bash
seerxo generate --product "handmade ceramic coffee mug" --category "Home & Living"
```

Check quota:

```bash
seerxo quota
```

Manual configuration:

```bash
seerxo configure \
  --email you@example.com \
  --api-key keyId.secret \
  --host https://api.seerxo.com
```

Local credentials are stored at `~/.seerxo-mcp/config.json`. Treat this file as sensitive.

## Claude Desktop Setup

Install the package and sign in first:

```bash
npm install -g seerxo
seerxo login
```

Add the MCP server to Claude Desktop.

macOS:

```text
~/Library/Application Support/Claude/claude_desktop_config.json
```

Windows:

```text
%APPDATA%/Claude/claude_desktop_config.json
```

Example:

```json
{
  "mcpServers": {
    "seerxo": {
      "command": "seerxo"
    }
  }
}
```

If you prefer explicit environment variables:

```json
{
  "mcpServers": {
    "seerxo": {
      "command": "seerxo",
      "env": {
        "SEERXO_EMAIL": "you@example.com",
        "SEERXO_API_KEY": "keyId.secret",
        "SEERXO_HOST": "https://api.seerxo.com"
      }
    }
  }
}
```

Restart Claude Desktop after editing the config.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `SEERXO_EMAIL` | Optional | Account email used for generation requests. |
| `SEERXO_API_KEY` | Optional | API key in `keyId.secret` format. |
| `SEERXO_HOST` | Optional | API host. Defaults to `https://api.seerxo.com`. |
| `MCP_API_KEY` | Optional | Legacy fallback for `SEERXO_API_KEY`. |
| `API_BASE` | Optional | Legacy fallback for `SEERXO_HOST`. |

`SEERXO_HOST` is normalized and must be an HTTP(S) URL.

## Examples

Simple prompt:

```text
Generate an Etsy listing for a vintage leather journal.
```

With category:

```text
Generate Etsy SEO for boho macrame wall decor in Home & Living.
```

Typical output includes:

- SEO title.
- Product description.
- 13 Etsy tags.
- Suggested price range.
- Current quota usage.

## Local Development

```bash
npm ci
npm run lint
npm test
npm run build
```

Useful files:

- `mcp-server.js`: CLI and MCP server entrypoint.
- `utils.js`: shared utility helpers.
- `scripts/prepare-github-package.mjs`: GitHub package preparation script.
- `*.test.js`: Node test runner coverage.

## Git Workflow

This repository uses a lightweight production workflow:

- `main`: production-ready releases only.
- `develop`: integration branch.
- `feature/*`: new features from `develop`.
- `fix/*`: non-urgent fixes from `develop`.
- `release/*`: release candidates from `develop`.
- `hotfix/*`: urgent production fixes from `main`.
- `docs/*`: documentation changes from `develop`.
- `chore/*`: maintenance changes from `develop`.

Only `main` and `develop` are permanent branches. See [BRANCHING.md](BRANCHING.md), [CONTRIBUTING.md](CONTRIBUTING.md), [RELEASE.md](RELEASE.md), and [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md).

Release automation:

```bash
git switch main
git pull origin main
npm version patch
git push origin main --follow-tags
```

Version tags like `v1.0.9` trigger GitHub Release creation and npm publishing through GitHub Actions. The repository must define an `NPM_TOKEN` Actions secret.

## Troubleshooting

Check your local status:

```bash
seerxo status
```

Refresh credentials:

```bash
seerxo login
```

If Claude Desktop does not see the tool:

- Confirm `seerxo` is installed globally.
- Restart Claude Desktop completely.
- Confirm the config JSON is valid.
- Run `seerxo status` in a terminal.

If you see an invalid API key error, run `seerxo login` or re-run `seerxo configure` with the full `keyId.secret` value.

## Security

Do not commit API keys, tokens, local config files, Claude Desktop config values, or customer data. See [SECURITY.md](SECURITY.md).

## Support

- GitHub Issues: https://github.com/semihbugrasezer/etsy-seo-mcp/issues
- Website: https://www.seerxo.com
- Support: support@seerxo.com

## License

MIT. See [LICENSE](LICENSE).
