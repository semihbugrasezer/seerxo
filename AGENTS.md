# Agent instructions

## Architecture context

When this repository is checked out inside the Seerxo workspace, read:

1. `../.workspace-ai/system-map.md`
2. `../.workspace-ai/contracts.md`
3. The active task under `../tasks/active/`

Repository responsibility:

- npm CLI and its public terminal output
- local newline-delimited JSON-RPC MCP over stdio
- Claude Code plugin and skill bundles
- HMAC-authenticated consumption of the backend's versioned interface

The backend owns business rules, quota, persistence, and the canonical OpenAPI
document. Do not copy backend behaviour or access Firestore/Redis directly.

Treat CLI output, MCP stdout, tool schemas, configuration files, and exit codes
as compatibility contracts. Keep stdout free of logs while the MCP server is
running; diagnostics belong on stderr.

After implementation run `npm test`, `npm run lint`, and `npm run build`.
