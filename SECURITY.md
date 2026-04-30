# Security Policy

## Supported Versions

Security fixes are prioritized for the latest published version of the `seerxo` package.

## Reporting a Vulnerability

Do not open a public issue for suspected vulnerabilities.

Report security issues by emailing:

- security@seerxo.com
- support@seerxo.com

Include:

- A clear description of the issue.
- Steps to reproduce.
- Affected version or commit SHA.
- Any logs with secrets, API keys, emails, tokens, and local paths masked.

Expected response target: 72 hours.

## Secret Handling Rules

- Never commit `.env`, local config files, API keys, tokens, cookies, or Claude Desktop config values.
- Mask API keys as `keyId.****` in logs and screenshots.
- Treat `~/.seerxo-mcp/config.json` as sensitive because it may contain API credentials.
- Do not paste customer listing data into public issues unless it is intentionally public sample data.
- Rotate exposed API keys immediately.

## API Key Policy

The CLI expects API keys in `keyId.secret` format. The `keyId` may be shown for debugging, but the secret portion must never be logged or committed.

## Dependency Security

CI runs dependency audit checks for high severity vulnerabilities. Release branches should not be merged while known high severity runtime dependency issues remain unresolved.
