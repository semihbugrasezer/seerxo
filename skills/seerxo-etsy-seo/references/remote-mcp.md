# Seerxo remote MCP

Read this reference only for connector setup, protocol testing, authentication, or
directory publication questions.

## Endpoint and transport

- URL: `https://api.seerxo.com/mcp`
- Transport: Streamable HTTP
- Protocol operations: `initialize`, `notifications/initialized`, `tools/list`, and
  `tools/call`
- Public operations: discovery and `seerxo_analyze_listing`
- Protected operations: generation, optimization, keyword suggestions, and quota

Use one vendor-neutral endpoint for Claude, ChatGPT, and other MCP clients. Keep
vendor-specific UI metadata outside the business logic.

## Test the real protocol

Do not treat a browser GET as an MCP health check. Test JSON-RPC through MCP Inspector:

```bash
npx @modelcontextprotocol/inspector --cli https://api.seerxo.com/mcp --transport http --method tools/list
```

Call the free audit tool:

```bash
npx @modelcontextprotocol/inspector --cli https://api.seerxo.com/mcp --transport http --method tools/call --tool-name seerxo_analyze_listing --tool-arg 'title=Handmade Ceramic Coffee Mug'
```

For a protected tool smoke test, pass a Seerxo API key as a header without echoing or
committing it. Interactive Claude and ChatGPT connectors should use OAuth instead:

```bash
npx @modelcontextprotocol/inspector --cli https://api.seerxo.com/mcp --transport http --method tools/list --header "Authorization: Bearer YOUR_SEERXO_API_KEY"
```

Inspector reference: <https://github.com/modelcontextprotocol/inspector>

## Authentication boundary

Anonymous clients can discover tools and run the free audit. Protected tools use OAuth
2.1 Authorization Code with PKCE S256. The legacy Seerxo API key remains available as an
`Authorization: Bearer <key>` fallback for the CLI, Inspector, and compatible clients.

OAuth discovery is published at:

```bash
curl -i https://api.seerxo.com/.well-known/oauth-protected-resource
curl -i https://api.seerxo.com/.well-known/oauth-protected-resource/mcp
curl -i https://api.seerxo.com/.well-known/oauth-authorization-server
```

The authorization server supports dynamic client registration, authorization codes,
refresh tokens, resource audience validation, and these scopes:

| Scope | Protected actions |
| --- | --- |
| `listing:read` | Quota/account usage |
| `listing:generate` | Listing generation and keyword suggestions |
| `listing:write` | Listing optimization |

Do not place API keys in query parameters, copied URLs, documentation, logs, or prompts.
When a protected request lacks permission, inspect the `WWW-Authenticate` header for the
metadata URL and required scope.

## Connect Claude

1. Open Claude **Settings → Connectors** and add a custom connector.
2. Enter `https://api.seerxo.com/mcp` and choose Streamable HTTP.
3. Let Claude discover OAuth, sign in to Seerxo, and approve the requested scopes.
4. Enable the connector in the conversation and run an audit before a paid action.

Claude supports Streamable HTTP and legacy HTTP+SSE, but recommends Streamable HTTP:
<https://claude.com/docs/connectors/building>

## Connect ChatGPT

ChatGPT calls these integrations **apps**. Current setup is under **Settings → Apps** or
**Workspace settings → Apps → Create**, not the older Plugins screen.

1. Enable developer mode for the eligible account or workspace.
2. Create a custom app and provide `https://api.seerxo.com/mcp` plus the Seerxo name and
   description.
3. Select OAuth, complete Seerxo sign-in, and run **Scan Tools**.
4. Create the draft, test it in a new chat, and review write-action confirmations.
5. After tool definitions change, refresh actions; approved workspaces may keep a frozen
   snapshot until an admin reviews the update.

Full MCP is currently documented for Business and Enterprise/Edu on ChatGPT web. Pro can
connect read/fetch MCP capabilities in developer mode, but full write support is not the
same entitlement. Re-check current availability before giving plan-specific guidance:
<https://help.openai.com/en/articles/12584461>

## Publication status

- [x] Stable HTTPS Streamable HTTP endpoint.
- [x] Complete input/output JSON Schemas and action-oriented descriptions.
- [x] Read-only, destructive, idempotent, and open-world annotations.
- [x] OAuth discovery, DCR, PKCE S256, refresh tokens, resource audience, and scopes.
- [x] Rate limits, successful-action credit charging, retry idempotency, and audit logs.
- [x] Publish the Smithery skill at `seerxo/etsy-seo` with the branded skill assets.
- [x] Publish and scan the Smithery server against `https://api.seerxo.com/mcp`.
- [x] Add the Smithery backlink and npm weekly-download badges to the repository README.
- [x] Upload `assets/avatar.png` as the GitHub `seerxo` organization avatar; Smithery's
  skill header reads `https://github.com/seerxo.png` rather than the skill icon metadata.
- [ ] Confirm privacy policy, support page, test account, and directory screenshots.
- [ ] Submit to the Claude Connectors Directory.
- [ ] Submit the ChatGPT app after workspace testing and approval.

The last three items require the publisher account, policy URLs, review assets, and any
vendor-requested test credentials; do not mark them complete from code-only validation.

Claude directory guidance: <https://claude.com/docs/connectors/building/submission>
