# Agent instructions

## Architecture context

Before making changes, read:

1. `../architecture/SYSTEM_MAP.md` — Seerxo ecosystem (when working inside the workspace)
2. `docs/SYSTEM_MAP.md` — this repository's internals
3. The active task file under `../tasks/active/` if present

Repository responsibility:

- npm package: CLI, MCP stdio server, Claude Code skill, API client
- No product business logic — that belongs in seerxo-backend
- No direct database access; all requests go HMAC-signed to `api.seerxo.com`
- Endpoints and MCP tools used here must exist in `seerxo-backend/openapi.yaml`; do not invent endpoints or response fields

Classify every requested change:

- **Local**: CLI UX, formatting, refactor → no map update
- **Contract**: new/changed endpoint or MCP tool → update `docs/SYSTEM_MAP.md` here and report backend follow-up
- **Ecosystem**: new component/external service → update `seerxo-backend/architecture/ecosystem.json` in the same change

## Architecture map

Update `docs/SYSTEM_MAP.md` when a change:

- adds or removes an API endpoint,
- adds or removes an MCP tool,
- introduces a new module or external service,
- changes authentication or credential flow,
- moves responsibility between components.

Small bug fixes and internal implementation changes do not require a map update.

After implementation: run `npm test`, `npm run lint`, `npm run map:check`; report contract changes and remaining cross-repo work.
