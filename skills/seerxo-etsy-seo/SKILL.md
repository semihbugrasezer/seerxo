---
name: seerxo-etsy-seo
description: Generate or optimize a complete, copy-paste-ready Etsy listing — front-loaded title (+ A/B variants), hook-first description, 13 search-optimized tags, and the Etsy listing attributes to set — by calling the Seerxo CLI. Use whenever the user wants Etsy SEO, an Etsy listing, product tags, a title/description, or wants to improve/rank an existing Etsy listing.
---

# Seerxo · Etsy SEO

One CLI call turns a short product description into a complete, copy-paste-ready Etsy
listing. Always call the CLI — never hand-write the listing — so output stays on-quota
and consistent with the Seerxo web app, dashboard, and MCP server (they share credits).

## When to use

Trigger when the user wants any of: an Etsy listing, Etsy SEO, a product title, a
product description, Etsy tags, or to optimize / rank-up an existing Etsy listing.

## Generate

1. Build the product phrase from the user's own words — keep their wording, don't rewrite it.
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

## Present it — copy-paste ready

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
- **Targets** — when present, list `target_keywords` (what the listing is built to rank for).
- **Credits** — from `usage`, say "X of Y generations left this month."

Ship exactly what the CLI returned — do not add, drop, or rewrite tags yourself. The CLI
already enforces 13 tags, ≤20 chars, lowercase, and no duplicates; trust its output.

## Errors → the exact fix

- `command not found: seerxo` → tell the user to run `npm install -g seerxo`.
- "Email is not set" / "Invalid API key" / "Run seerxo login" → run `seerxo login`
  (opens a browser for Google sign-in), then retry. To inspect state: `seerxo status`.
- "Monthly quota exceeded" → the account is out of credits; upgrade at
  https://www.seerxo.com (Free = 5/month, Premium = up to 300/month).

## Multiple products

If the user lists several products, run one `seerxo generate` per product and present
each listing under its own heading. One generation = one credit.
