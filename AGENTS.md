# Agent instructions

## Architecture context

Before making changes, read `docs/SYSTEM_MAP.md` — it describes the runtime flow, component ownership and the MCP tool → endpoint mapping.

Repository responsibility:

- npm package: CLI, MCP stdio server, Claude Code skill, API client
- No product business logic — that lives server-side behind the public API
- No direct access to any data store; all requests go signed to `api.seerxo.com`
- Endpoints and MCP tools used here must match the published API spec (https://seerxo.com/openapi.yaml); do not invent endpoints or response fields

Classify every requested change:

- **Local**: CLI UX, formatting, refactor → no map update
- **Contract**: new/changed endpoint or MCP tool → update `docs/SYSTEM_MAP.md` in the same change and note that the server-side API must ship first

## Architecture map

Update `docs/SYSTEM_MAP.md` when a change:

- adds or removes an API endpoint,
- adds or removes an MCP tool,
- introduces a new module or external service,
- changes authentication or credential flow,
- moves responsibility between components.

Small bug fixes and internal implementation changes do not require a map update.

After implementation: run `npm test`, `npm run lint`, `npm run map:check`; report contract changes.
