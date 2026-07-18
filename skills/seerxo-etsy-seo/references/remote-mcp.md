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
- [x] Publish crawler-safe privacy, support, terms, and status pages.
- [x] Prepare a password-based directory reviewer flow without MFA or email verification.
- [ ] Enable the reviewer account secrets in production and run every protected tool.
- [ ] Submit to the Claude Connectors Directory.
- [ ] Submit the OpenAI app-plus-skill plugin after identity and domain verification.

The last three items require publisher account access. Do not mark them complete from
code-only validation or include reviewer credentials in Git, logs, screenshots, or prompts.

## Directory submission packet

Use these values in both publisher portals:

| Field | Value |
| --- | --- |
| Name | Seerxo |
| Tagline | Etsy listing intelligence for sellers and AI agents. |
| Short description | Generate, audit, optimize, and research Etsy listings with explainable SEO guidance. |
| Server URL | `https://api.seerxo.com/mcp` |
| Transport | Streamable HTTP |
| Authentication | OAuth 2.1 Authorization Code, PKCE S256, DCR, refresh tokens |
| Website | `https://www.seerxo.com` |
| Documentation | `https://github.com/semihbugrasezer/seerxo/blob/main/skills/seerxo-etsy-seo/references/remote-mcp.md` |
| Privacy | `https://www.seerxo.com/privacy` |
| Support | `https://www.seerxo.com/help` |
| Terms | `https://www.seerxo.com/consumer-terms` |
| Status | `https://www.seerxo.com/status` |
| Logo | `https://raw.githubusercontent.com/semihbugrasezer/seerxo/main/assets/avatar.png` |
| Category | Productivity / Ecommerce |
| Allowed link URIs | None; Seerxo does not use `ui/open-link` |

Long description:

> Seerxo helps Etsy sellers and AI agents create complete listings, audit existing titles,
> descriptions, and tags, optimize weak fields without score regression, research ranked
> Etsy keyword suggestions, and check account usage. Audits are free. Generation,
> optimization, and keyword research use the authenticated account's monthly AI-action quota.
> Seerxo returns drafts and recommendations only; it does not publish or modify Etsy shops.

Data handling summary:

- The free audit computes scores from supplied listing fields without calling an AI model.
- Generation and optimization send the minimum supplied product/listing text to Seerxo's AI
  provider. Keyword research uses the supplied seed and existing listing fields.
- Seerxo stores account, quota, billing, security, and operational records as described in the
  privacy policy. Tool responses omit tokens, passwords, API keys, internal user IDs, and logs.
- No tool reads from or writes to an Etsy account. All generated content remains a draft until
  the user manually publishes it.

Tool review matrix:

| Tool | `readOnlyHint` | `destructiveHint` | `openWorldHint` | Reason |
| --- | --- | --- | --- | --- |
| `seerxo_analyze_listing` | `true` | `false` | `false` | Local, free computation; no state change |
| `seerxo_quota` | `true` | `false` | `false` | Reads private Seerxo usage |
| `generate_etsy_seo` | `false` | `false` | `false` | Runs generation and consumes quota inside Seerxo |
| `seerxo_optimize_listing` | `false` | `false` | `false` | Runs optimization and consumes quota inside Seerxo |
| `seerxo_suggest_keywords` | `false` | `false` | `false` | Runs research and consumes quota inside Seerxo |

### Positive review cases

1. **Audit:** “Audit this Etsy title: Handmade Ceramic Coffee Mug.” Expect
   `seerxo_analyze_listing`, a 0–100 score, sub-scores, weak points, and no quota charge.
2. **Generate:** “Create an Etsy listing for a handmade speckled ceramic coffee mug, 12 oz.”
   Expect `generate_etsy_seo`, one title, alternatives, a description, exactly 13 tags, and
   usage remaining.
3. **Optimize:** “Improve this weak listing without lowering its score: title ‘Ceramic Mug’,
   tags ‘mug’.” Expect `seerxo_optimize_listing`, before/after scores, changed fields, and a
   non-regression fallback when needed.
4. **Keywords:** “Research Etsy keywords for minimalist wedding invitation.” Expect
   `seerxo_suggest_keywords`, ranked phrases, placements, relative demand only, and no invented
   absolute search volume.
5. **Quota:** “How many Seerxo AI actions do I have left?” Expect `seerxo_quota`, tier, limit,
   used, remaining, and channel breakdown.

### Negative review cases

1. **Missing audit input:** “Audit my listing” with no title, tags, or description. Ask for at
   least one listing field; do not invent listing content.
2. **Bare Etsy URL:** A listing URL without a usable title slug and no listing fields. Ask for
   the title or listing text; do not claim Seerxo can bypass Etsy access controls.
3. **External publishing:** “Publish this listing to my Etsy shop.” Explain that Seerxo returns
   drafts only and does not access or modify Etsy shops; do not call a generation tool unless
   the user also asks for content creation.

## Portal gates

- Claude remote MCP submission requires a Team or Enterprise organization and an Owner or a
  delegated Directory management role. Provide the fully populated reviewer account.
- OpenAI public publication now uses an app-plus-skill **plugin** submission. Select **With
  MCP**, upload the skill bundle, use a verified business/developer identity, provide five
  positive and three negative cases, and complete the domain challenge at
  `/.well-known/openai-apps-challenge` when the portal issues its token.
- Seerxo has no MCP App UI, so do not upload UI screenshots. Claude's 3–5 screenshot rule and
  OpenAI's optional screenshots apply only when an interactive UI resource exists.

Claude directory guidance: <https://claude.com/docs/connectors/building/submission>
OpenAI plugin guidance: <https://learn.chatgpt.com/docs/submit-plugins>
