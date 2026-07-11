# Seerxo — Etsy SEO Generator

<div align="center">

[![npm](https://img.shields.io/npm/v/seerxo)](https://www.npmjs.com/package/seerxo)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/stars/semihbugrasezer/etsy-seo-mcp?style=social)](https://github.com/semihbugrasezer/etsy-seo-mcp)

**AI-powered Etsy listings — SEO title, description, and all 13 tags in seconds.**

One `npm` package, four ways to use it: **CLI**, **Claude Desktop (MCP)**,
**Claude Code skill**, or the **web app**.

[seerxo.com](https://www.seerxo.com) • [Quick start](#quick-start) • [What you get](#what-you-get)

</div>

---

## What is this?

Seerxo turns a short product phrase into a complete, copy-paste-ready Etsy listing:
a front-loaded title (plus A/B variants), a hook-first description, 13
search-optimized tags, and the Etsy attributes to set. All channels share one
account and one credit pool.

## Quick start

### CLI

```bash
npm install -g seerxo
seerxo login          # Google sign-in in your browser; saves your API key locally
```

Generate a listing:

```bash
seerxo generate --product "handmade ceramic coffee mug, speckled glaze, 12oz" --category "Home & Living"
```

Add `--json` for machine-readable output, or just run `seerxo` for interactive mode
(type a product description, add a category with `|`, e.g.
`Boho bedroom wall art set | Wall Art`).

Already have an API key? Skip the browser:

```bash
seerxo configure --email you@example.com --api-key keyId.secret
```

Useful commands: `seerxo status` (config & key state), `seerxo logout`.

### Claude Desktop (MCP)

1. Install the CLI and sign in (`seerxo login`) as above.
2. Add the MCP server to your Claude Desktop config:

   **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   **Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "seerxo": {
         "command": "seerxo-mcp"
       }
     }
   }
   ```

   Credentials are read from `~/.seerxo-mcp/config.json` (written by `seerxo login`).
   You can override with `SEERXO_EMAIL` / `SEERXO_API_KEY` env vars in the config
   instead. The config file is plaintext — keep it on single-user machines and
   restrict permissions:
   `chmod 700 ~/.seerxo-mcp && chmod 600 ~/.seerxo-mcp/config.json`.

3. Restart Claude Desktop, then ask:

   ```
   Generate an Etsy listing for my handmade ceramic coffee mug
   ```

### Claude Code skill

```bash
npm install -g seerxo && seerxo login
seerxo skill add            # user-level, all projects
seerxo skill add --project  # …or current repo only
```

Restart Claude Code and ask for an Etsy listing — the skill drives the CLI for you.
Remove with `seerxo skill remove` (add `--project` for the repo-scoped copy).
No global install? `npx seerxo skill add` works too.

### Web app & Chrome extension

- **[seerxo.com](https://www.seerxo.com)** — no installation, instant results,
  plus a free [SEO Score audit](https://www.seerxo.com/audit) for existing listings.
- **[Chrome extension](https://github.com/semihbugrasezer/seerxo-chrome-extension)** —
  generate optimized content directly on any Etsy listing page (early preview).

## What you get

Every generation returns:

| Field | Details |
|---|---|
| **Title** | ≤140 chars (Etsy limit), primary keywords front-loaded |
| **A/B titles** | Alternative titles for split-testing |
| **Description** | Hook-first opening, features, usage scenarios, call-to-action |
| **13 tags** | Each ≤20 chars, lowercase, deduplicated, mix of broad + specific |
| **Attributes** | Occasion, style, color, material, recipient — for Etsy's filter dropdowns |
| **Extras** | Target keywords, shipping tip, cross-sell suggestion |

### Sample output

**Input:** `handmade ceramic coffee mug`

```
TITLE
Handmade Ceramic Coffee Mug | Artisan Pottery | Unique Kitchen Gift | Microwave Safe

DESCRIPTION
Elevate your morning coffee ritual with this beautifully handcrafted ceramic mug.
Each piece is lovingly made by skilled artisans, ensuring no two mugs are exactly
alike. Featuring a comfortable ergonomic handle and smooth glazed finish.

TAGS
handmade mug, ceramic coffee cup, pottery mug, artisan mug, unique gift,
coffee lover gift, handcrafted, kitchen decor, tea cup, housewarming gift,
birthday present, ceramic pottery, handmade gift
```

## Pricing

| Plan | Generations |
|---|---|
| Free | 5 / month |
| Premium | up to 300 / month — [upgrade at seerxo.com](https://www.seerxo.com/pricing) |

## Notes

- The npm package is **`seerxo`**; the old `seerxo-mcp` package is deprecated
  (the `seerxo-mcp` *binary* still ships inside `seerxo` for Claude Desktop).
- You can paste an Etsy listing URL that contains a title slug
  (`etsy.com/listing/123/boho-macrame-wall-hanging`) — the title is derived from it.
  Bare links without a slug can't be read; paste the listing title instead.

## Support

- [GitHub Issues](https://github.com/semihbugrasezer/etsy-seo-mcp/issues)
- [info@seerxo.com](mailto:info@seerxo.com)
- [seerxo.com](https://www.seerxo.com)

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

**Built for Etsy sellers by Seerxo**

[⭐ Star on GitHub](https://github.com/semihbugrasezer/etsy-seo-mcp) • [Try it now](https://www.seerxo.com)

</div>
