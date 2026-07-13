---
name: seerxo-etsy-seo
description: Generate, score, fix, or research keywords for an Etsy listing — front-loaded title (+ A/B variants), hook-first description, 13 search-optimized tags, an explainable 0-100 SEO score with ranked weak points, guided rewrites, and ranked keyword ideas — by calling the Seerxo CLI. Accepts a product phrase or a pasted Etsy listing URL. Use whenever the user wants an Etsy listing, Etsy SEO, an SEO score / listing audit, to fix or rank-up an existing listing, or Etsy keyword ideas.
---

# Seerxo · Etsy SEO

One CLI call turns a short product description into a complete, copy-paste-ready Etsy
listing — or scores, fixes, or keyword-mines a listing that already exists. Always call
the CLI — never hand-write the listing or invent a score — so output stays on-quota and
consistent with the Seerxo web app, dashboard, and MCP server (they share credits).

## When to use

Trigger when the user wants any of: an Etsy listing, Etsy SEO, a product title, a
product description, Etsy tags, an SEO score / listing audit, to fix or rank-up an
existing Etsy listing, or Etsy keyword ideas.

## Generate

1. Build the product phrase from the user's own words — keep their wording, don't rewrite it.
   - **Pasted Etsy listing URL?** If it contains a title slug
     (`etsy.com/listing/123/boho-macrame-wall-hanging`), turn the slug into the product
     phrase (`boho macrame wall hanging`). If it's a bare link with no slug
     (`shopname.etsy.com/listing/123`), ask the user for the listing title instead of
     calling the CLI — the API rejects bare URLs, so the call would only waste time.
2. Infer an Etsy `--category` only when it's obvious, to sharpen keyword matching:
   mug/candle/decor → `"Home & Living"`, necklace/ring → `"Jewelry"`, shirt/hoodie →
   `"Clothing"`, sticker → `"Craft Supplies"`, card/print → `"Paper & Party Supplies"`,
   bridesmaid/wedding → `"Weddings"`, dog/cat item → `"Pet Supplies"`, baby item →
   `"Baby"`. Skip `--category` if unsure.
3. Run (wrap each value in double quotes; escape any inner `"` as `\"`):

```bash
seerxo generate --product "handmade ceramic coffee mug, speckled glaze, 12oz" --category "Home & Living" --json
```

Always pass `--json` and parse the result. Shape:

```json
{
  "title": "…",
  "title_alternatives": ["…", "…"],
  "description": "…",
  "tags": ["…", "…"],
  "features": ["…"],
  "target_keywords": ["…"],
  "suggested_attributes": { "occasion": "…", "style": "…", "color": "…", "material": "…", "recipient": "…" },
  "usage": { "current": 3, "limit": 300, "remaining": 297 }
}
```

### Present it — copy-paste ready

Format the result so the seller can paste each block straight into Etsy. Use these
exact labels and keep it scannable:

- **Title** — `title` on a single line (it is already ≤140 chars, the Etsy limit).
- **Alt titles (A/B)** — list `title_alternatives` when present, for split-testing.
- **Tags (13)** — output as ONE comma-separated line (this is exactly what Etsy's tag
  box accepts), then a short note confirming "13 tags, each ≤20 chars."
- **Description** — the full `description`, ready to paste.
- **Etsy attributes** — when present, list `suggested_attributes` as `Field: value`
  (Occasion, Style, Color, Material, Recipient) so the seller can fill Etsy's attribute
  dropdowns — these boost filter visibility.
- **Features** — when present, list `features` as bullets (paste-ready listing highlights).
- **Targets** — when present, list `target_keywords` (what the listing is built to rank for).
- **Shipping tip & cross-sell** — when the JSON carries `shipping_tip` or `cross_sell`,
  surface each as a one-line note; sellers act on these.
- **Credits** — from `usage`, say "X of Y generations left this month."

Ship exactly what the CLI returned — do not add, drop, or rewrite tags yourself. The CLI
already enforces 13 tags, ≤20 chars, lowercase, and no duplicates; trust its output.

## Score / audit an existing listing

The user has a listing already and wants to know how it's doing — "score my listing",
"audit this", "why isn't this ranking". **This is free and unlimited on every plan** —
it never uses a generation credit, so call it freely, even just to check before/after.

Gather whatever fields the user has (title, tags, description — at least one; a pasted
listing URL adds the product name from its slug but doesn't replace the fields above,
since Etsy blocks server-side fetches) and run:

```bash
seerxo analyze --title "Speckled Ceramic Coffee Mug" --tags "handmade mug,ceramic cup" --description "..." --json
```

(`seerxo audit` is an alias for the same command.)

Shape:

```json
{
  "seoScore": 62,
  "subScores": { "title": 80, "tags": 40, "description": 100, "completeness": 66 },
  "weakPoints": [{ "field": "tags", "severity": "high", "reason": "…", "fix": "…" }],
  "missingKeywords": ["12oz"],
  "tagUtilization": { "used": 7, "max": 13, "duplicates": [], "tooBroad": [], "overLong": [] }
}
```

Present: the overall `seoScore`/100, the four `subScores`, each `weakPoints` entry as
`[severity] reason → fix`, `missingKeywords` the listing should work in, and
`tagUtilization` as "X/13 tag slots used" with any duplicates/too-broad/over-long notes.
If the score is already high and `weakPoints` is empty, say so plainly — don't invent
issues to fill space.

## Fix it (optimize)

Once the user has seen the audit (or asks directly to "fix"/"improve"/"rewrite" a
listing), rewrite it. **This uses one credit** (same shared pool as `generate`) — unlike
`analyze`, so don't call it speculatively; only when the user wants the rewrite.

```bash
seerxo optimize --title "Speckled Ceramic Coffee Mug" --tags "handmade mug,ceramic cup" --description "..." --json
```

The rewrite touches title + description + tags by default. If the user only wants ONE
field fixed ("just fix the title"), pass `--mode`:

```bash
seerxo optimize --title "..." --tags "a,b,c" --description "..." --mode title_only --json
```

`--mode` accepts `full` (default), `title_only`, `description_only`, or `tags_only` —
untouched fields are returned exactly as given.

Shape:

```json
{
  "before": { "seoScore": 62 },
  "after": { "seoScore": 88 },
  "optimized": { "title": "…", "description": "…", "tags": ["…"] },
  "resolved": ["tags_count"],
  "unresolved": [],
  "fallback": false,
  "mode": "full"
}
```

Present the score change (`before.seoScore → after.seoScore`), how many findings were
`resolved` (and any still `unresolved`), then the rewritten fields — copy-paste ready,
same formatting rules as Generate. If `fallback` is `true`, say plainly that the rewrite
didn't beat the original, so the original was kept (the score never regresses).

## Find more keywords

"What else should I tag this with" / "keyword ideas for X" → run:

```bash
seerxo keywords --seed "ceramic mug" --json
```

Pass the listing's `--title`/`--tags`/`--description` too when available — it marks
which suggestions are already in the listing vs. missing. Shape:

```json
{
  "seed": "ceramic mug",
  "confidence": "medium",
  "keywords": [{ "keyword": "ceramic mug set", "demandRank": 1, "placement": "title", "inListing": false }]
}
```

Present as a ranked list (`demandRank` order): `keyword → placement recommendation`,
flagging which are already in the listing. These are relative-demand ranks sampled from
Etsy's own search autocomplete — never state or imply an absolute search-volume number.

## Errors → the exact fix

- `command not found: seerxo` → tell the user to run `npm install -g seerxo`.
- "Email is not set" / "Invalid API key" / "Run seerxo login" → run `seerxo login`
  (opens a browser for Google sign-in), then retry. To inspect state: `seerxo status`.
- "Monthly quota exceeded" → the account is out of AI-action credits (this only happens
  on `generate`/`optimize`/`keywords` — `analyze` is unaffected); upgrade at
  https://www.seerxo.com/pricing (Free = 5/month, Premium = up to 300/month).
- Invalid `--mode` value → the CLI returns the accepted list; re-run with one of
  `full` / `title_only` / `description_only` / `tags_only`.

## Multiple listings

If the user lists several products or listings, run one CLI call per item and present
each result under its own heading. One `generate`, `optimize`, or `keywords` call = one
credit; `analyze` calls are free, however many you run.
