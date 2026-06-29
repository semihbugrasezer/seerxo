---
name: seerxo-etsy-seo
description: Generate SEO-optimized Etsy listings — title, description, 13 tags, and a suggested price range — using the Seerxo CLI. Use whenever the user wants Etsy SEO, an Etsy product listing, product tags, or a title/description for something they sell on Etsy.
---

# Seerxo · Etsy SEO

Produce a complete, Etsy-ready listing (title, description, 13 tags, suggested price)
from a short product description by calling the Seerxo CLI. Do not hand-write listings —
always call the CLI so output stays on-quota and consistent with the Seerxo web app,
dashboard, and MCP server (they all share the same credits).

## When to use

Trigger when the user asks for any of: an Etsy listing, Etsy SEO, a product title,
a product description, or Etsy tags for something they sell.

## How to generate

Run the Seerxo CLI and parse its JSON output:

```bash
seerxo generate --product "<short product description>" --category "<optional category>" --json
```

- `--product` (required): a short natural description, e.g.
  `"handmade ceramic coffee mug, speckled glaze, 12oz"`.
- `--category` (optional): the Etsy category, e.g. `"Home & Living"`. Ask for it only if it helps.
- `--json` (required here): returns structured JSON to format.

The command prints JSON shaped like:

```json
{
  "title": "…",
  "description": "…",
  "tags": ["…", "…"],
  "suggested_price_range": "$28-$45",
  "usage": { "current": 3, "limit": 300, "remaining": 297 }
}
```

Present it back as: the title (under 140 chars, the Etsy limit), the description, the
13 tags (as a list or comma-separated), and the suggested price. Mention remaining
credits from `usage` when present.

## If the CLI is missing or not signed in

- **Not installed** (`command not found: seerxo`): tell the user to run `npm install -g seerxo`.
- **Credential errors** ("Email is not set" / "Invalid API key" / "Run seerxo login"):
  tell the user to run `seerxo login` (opens a browser to sign in with Google), then retry.
- **Quota reached**: the free tier allows 5 generations/month — point them to
  https://www.seerxo.com to upgrade to Premium (up to 300/month).

## Notes

- One generation per product request.
- Keep the user's wording; pass their description through to `--product` rather than rewriting it.
