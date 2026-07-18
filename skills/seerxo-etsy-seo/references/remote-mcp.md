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

For a protected tool, pass the API key as a header without echoing or committing it:

```bash
npx @modelcontextprotocol/inspector --cli https://api.seerxo.com/mcp --transport http --method tools/list --header "Authorization: Bearer YOUR_SEERXO_API_KEY"
```

Inspector reference: <https://github.com/modelcontextprotocol/inspector>

## Current authentication boundary

Seerxo currently accepts its API key as `Authorization: Bearer <key>` for protected
tools. Anonymous clients can discover tools and run the free audit.

Before selecting OAuth in a client, check both protected-resource metadata locations:

```bash
curl -i https://api.seerxo.com/.well-known/oauth-protected-resource
curl -i https://api.seerxo.com/mcp/.well-known/oauth-protected-resource
```

If these return 404, OAuth discovery is not deployed. Connect without authentication for
the free audit, use a client that can store a static Bearer secret, use the Smithery
`seerxo` server configuration, or fall back to `seerxo login` in the CLI. Do not put API
keys in copied URLs, documentation, logs, or prompts.

For future OAuth support, require OAuth 2.1 Authorization Code with PKCE S256,
protected-resource metadata, audience and scope validation, and refresh-token support.
ChatGPT expects the authorization server to advertise refresh access such as
`offline_access`. Re-check both vendors' current requirements before implementation.

## Connect Claude

1. Open Claude **Settings → Connectors** and add a custom connector.
2. Enter `https://api.seerxo.com/mcp` and choose Streamable HTTP.
3. Use no authentication to test discovery and the free audit.
4. For protected tools, configure a supported secret/Bearer mechanism. If the UI only
   offers OAuth and OAuth discovery is not deployed, use Smithery or the CLI instead.
5. Enable the connector in the conversation and run an audit before a paid action.

Claude supports Streamable HTTP and legacy HTTP+SSE, but recommends Streamable HTTP:
<https://claude.com/docs/connectors/building>

## Connect ChatGPT

ChatGPT calls these integrations **apps**. Current setup is under **Settings → Apps** or
**Workspace settings → Apps → Create**, not the older Plugins screen.

1. Enable developer mode for the eligible account or workspace.
2. Create a custom app and provide `https://api.seerxo.com/mcp` plus the Seerxo name and
   description.
3. Select the applicable authentication mechanism and run **Scan Tools**.
4. Create the draft, test it in a new chat, and review write-action confirmations.
5. After tool definitions change, refresh actions; approved workspaces may keep a frozen
   snapshot until an admin reviews the update.

Full MCP is currently documented for Business and Enterprise/Edu on ChatGPT web. Pro can
connect read/fetch MCP capabilities in developer mode, but full write support is not the
same entitlement. Re-check current availability before giving plan-specific guidance:
<https://help.openai.com/en/articles/12584461>

## Publication readiness

Before directory submission, verify:

- stable HTTPS Streamable HTTP endpoint;
- complete input/output JSON Schemas and action-oriented descriptions;
- correct read-only, destructive, idempotent, and open-world annotations;
- OAuth discovery and refresh behavior when authenticated directory access is required;
- privacy policy, support documentation, test account, rate limits, and audit logs;
- idempotency protection before charging an AI action on retried requests.

Claude directory guidance: <https://claude.com/docs/connectors/building/submission>
