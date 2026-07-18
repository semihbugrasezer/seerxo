---
name: seerxo-etsy-seo
description: Generate, audit, optimize, and research keywords for Etsy listings through the Seerxo remote MCP server or CLI. Use when a user wants an Etsy title, description, 13 tags, SEO score, listing rewrite, keyword ideas, quota help, or help connecting and testing Seerxo with Claude or ChatGPT.
---

![Seerxo Etsy SEO](https://raw.githubusercontent.com/semihbugrasezer/seerxo/main/skills/seerxo-etsy-seo/assets/seerxo-banner.svg)

# Seerxo Etsy SEO

Use Seerxo for listing output and scores. Do not hand-write a replacement listing or
invent metrics when a Seerxo tool is available.

## Select the available transport

1. Prefer the Seerxo MCP tools when they are connected. The remote Streamable HTTP
   endpoint is `https://api.seerxo.com/mcp`.
2. Otherwise use the `seerxo` CLI and always request JSON output.
3. If the user asks to connect, test, authenticate, or publish the remote server, read
   [references/remote-mcp.md](references/remote-mcp.md) before answering.

Do not call a paid tool speculatively. Preserve the user's product facts and return the
tool result without silently adding claims, materials, measurements, or keyword volumes.

## Choose the action

| Intent | MCP tool | CLI fallback | Usage |
| --- | --- | --- | --- |
| Create a listing | `generate_etsy_seo` | `seerxo generate` | 1 AI action |
| Score an existing listing | `seerxo_analyze_listing` | `seerxo analyze` | Free |
| Rewrite weak fields | `seerxo_optimize_listing` | `seerxo optimize` | 1 AI action |
| Find keyword ideas | `seerxo_suggest_keywords` | `seerxo keywords` | 1 AI action |
| Check account usage | `seerxo_quota` | `seerxo status` | Free |

## Prepare inputs

- Keep the user's product wording and factual details intact.
- For an Etsy URL with a title slug, turn the slug into a product phrase. For a bare
  listing URL, ask for the title or listing fields; Etsy blocks reliable server-side
  listing fetches.
- For an audit, provide at least one of `title`, `tags`, or `description`.
  `product_name` alone is not a listing to audit.
- Infer a category only when obvious, such as mug → `Home & Living`, ring → `Jewelry`,
  shirt → `Clothing`, sticker → `Craft Supplies`, or wedding item → `Weddings`.

## Generate a listing

Call `generate_etsy_seo` with `product_name` and optional `category`.

CLI fallback:

```bash
seerxo generate --product "handmade ceramic coffee mug, speckled glaze, 12oz" --category "Home & Living" --json
```

Present copy-paste-ready blocks in this order:

1. **Title** — one line, at most 140 characters.
2. **Alternative titles** — include A/B variants when returned.
3. **Tags (13)** — one comma-separated line; confirm every tag is at most 20 characters.
4. **Description** — return the complete text.
5. **Attributes**, **features**, **target keywords**, **shipping tip**, and **cross-sell**
   — include only fields returned by Seerxo.
6. **AI actions remaining** — summarize `usage.remaining` and `usage.limit`.

Do not add, drop, deduplicate, or rewrite tags after generation.

## Audit an existing listing

Call `seerxo_analyze_listing` with the listing fields the user supplied. This audit is
rule-based, free, and does not consume an AI action.

CLI fallback:

```bash
seerxo analyze --title "Speckled Ceramic Coffee Mug" --tags "handmade mug,ceramic cup" --description "..." --json
```

Present:

- overall `seoScore` out of 100 and the title, tags, description, and completeness scores;
- weak points in severity order as `reason → fix`;
- missing keywords without inventing search volume;
- tag use as `used/13`, followed by duplicates, broad tags, and overlong tags.

If no weak points are returned, say the listing passed the audit; do not manufacture work.

## Optimize weak fields

Use `seerxo_optimize_listing` only when the user asks for a rewrite. Pass `mode` when the
request targets one field: `title_only`, `description_only`, or `tags_only`; otherwise use
`full`.

CLI fallback:

```bash
seerxo optimize --title "..." --tags "a,b,c" --description "..." --mode full --json
```

Show the before/after score, resolved and unresolved finding IDs, then the rewritten
copy-paste-ready fields. If `fallback` is true, explain that Seerxo kept the original
because the rewrite did not improve the score.

## Research keywords

Call `seerxo_suggest_keywords` with `seed`. Also pass the existing title, tags, or
description when available so the result can mark terms already used.

CLI fallback:

```bash
seerxo keywords --seed "ceramic mug" --json
```

Present keywords in `demandRank` order with their placement recommendation and whether
they already appear in the listing. Treat rankings as relative Etsy autocomplete demand;
never claim an absolute search-volume number.

## Handle authentication and quota

- Remote discovery and `seerxo_analyze_listing` work without authentication.
- Generation, optimization, keyword research, and quota require Seerxo authentication.
  Prefer the connector's OAuth flow; use an API key Bearer credential only for CLI,
  Inspector, or clients that explicitly support static secrets.
- Never print, log, or place an API key in a query parameter or user-visible URL.
- Use the product term **AI actions**: Free includes 5 per month and Premium includes up
  to 300 per month; audits remain free on both plans.

## Fix common errors

- `command not found: seerxo` → run `npm install -g seerxo`.
- OAuth sign-in failed → reconnect the connector and approve the requested scopes.
- Missing or invalid CLI API key → run `seerxo login`, then retry; inspect with `seerxo status`.
- Monthly or daily limit reached → do not retry the paid action; show the returned usage
  and point to `https://www.seerxo.com/pricing`.
- MCP connection failure → run the Inspector checks in
  [references/remote-mcp.md](references/remote-mcp.md).
- Invalid optimize mode → use `full`, `title_only`, `description_only`, or `tags_only`.

## Process multiple listings

Run one action per listing and keep each result under its own heading. Confirm the count
before running multiple paid actions; audits can run freely, subject to rate limits.
