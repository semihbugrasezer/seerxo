# 🚀 Etsy SEO Generator

<div align="center">

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/stars/semihbugrasezer/etsy-seo-mcp?style=social)](https://github.com/semihbugrasezer/etsy-seo-mcp)

**AI-powered Etsy listing generator — CLI, Claude Code skill, or MCP server**

Generate SEO-optimized titles, descriptions, and 13 tags in seconds

[Live Demo](https://www.seerxo.com) • [Quick Start](#-quick-start) • [Examples](#-examples)

</div>

---

## 🎯 What is this?

A tool that generates complete, SEO-optimized Etsy product listings instantly. Use it **three ways from one package** — a **CLI**, a **Claude Code skill**, or an **MCP server** for Claude Desktop. Perfect for Etsy sellers who want to:

- ✅ Save 3+ hours per product listing
- ✅ Rank higher in Etsy search results
- ✅ Write compelling product descriptions
- ✅ Never run out of creative tag ideas

## ⚡ Quick Start

### A) CLI-only

1) Install and launch
```bash
npm install -g seerxo
seerxo
```

2) Sign in (recommended)
```bash
seerxo-mcp login
```
Sign in with Google in your browser and approve; the CLI saves your API key automatically (no manual envs needed).

3) Manual setup (optional)
```bash
seerxo-mcp configure --email your-email@example.com --api-key your-api-key
```
Use this if you already have an API key and just want to write it locally.
API key format must be `keyId.secret`, and the secret part must be at least 16 characters.

### Sample CLI session

```
╭─────────────────────────────── SEERXO ────────────────────────────────╮
│                                                                       │
│  SEERXO • Etsy SEO Agent • v1.2.53                                    │
│  Describe your Etsy product → get title, description & tags.          │
│                                                                       │
│  🧪 Interactive mode (help for all commands)                          │
│  • Type a short description of your product                           │
│  • Add a category with "|" (pipe) if you want                         │
│    Boho bedroom wall art set | Wall Art                               │
│                                                                       │
│  💡 Tip                                                               │
│    Minimalist nursery wall art in black & white line art.             │
│    Set of 3 abstract line art prints | Wall Art                       │
│                                                                       │
│  Quick commands                                                       │
│  help       Show commands                                             │
│  status     Show config & key state                                   │
│  login      Open approval link to sign in                             │
│  configure  Set email & API key                                       │
│  generate   Guided prompt (product/category)                          │
│  quit       Exit interactive mode                                     │
│                                                                       │
╰───────────────────────────────────────────────────────────────────────╯

[seerxo] › login
Requesting SEERXO CLI login...

Open this link in your browser to approve CLI login:

https://api.seerxo.com/auth/google?redirect=...  # (browser opens to approve)

Waiting for approval...

Login approved. Credentials saved locally.
You can now run "seerxo-mcp" in Claude Desktop.
[seerxo] › generate
Product: boho wall art
Category (optional): Wall Art
Title: Boho Wall Art Set of 3 | Minimalist Line Art Prints
Description: ...
Tags: boho wall art, line art prints, minimalist decor, ...
[seerxo] ›
```

### B) Claude Desktop + MCP

1) Install CLI (same as above) and sign in with `seerxo-mcp login`.

2) Add this to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "seerxo": {
      "command": "seerxo-mcp",
      "env": {
        "SEERXO_EMAIL": "your-email@example.com",
        "SEERXO_API_KEY": "keyId.secret"
      }
    }
  }
}
```

**Note:** `SEERXO_EMAIL` and `SEERXO_API_KEY` are written to `~/.seerxo-mcp/config.json` after CLI login; you can copy from there if you prefer. This file is plaintext—keep it on single-user machines only and restrict permissions (`chmod 700 ~/.seerxo-mcp && chmod 600 ~/.seerxo-mcp/config.json`). Future versions will move this to a secure keychain.

3) Restart Claude Desktop

Close and reopen Claude Desktop completely.

4) Start Using

That's it! Just ask Claude:

```
Generate an Etsy listing for my handmade ceramic coffee mug
```

**Free Tier:** 5 generations per month
**Premium:** Up to 300 generations per month - [Upgrade at seerxo.com](https://www.seerxo.com)

> Note: The previous package `seerxo-mcp` is deprecated. Use `npm install -g seerxo`.

### C) Claude Code Skill

Add Seerxo as a [Claude Code](https://claude.com/claude-code) skill so you can ask for
Etsy listings right inside Claude Code — it drives the CLI for you.

```bash
# install the CLI (once) and sign in
npm install -g seerxo
seerxo login

# add the skill (user-level, all projects)
seerxo skill add
# …or scope it to the current repo only
seerxo skill add --project
```

No global install needed? Run it straight from npx:

```bash
npx seerxo skill add
```

Then restart Claude Code and ask:

```
Generate an Etsy listing for my handmade ceramic coffee mug
```

Remove it anytime with `seerxo skill remove` (add `--project` for the repo-scoped copy).
The skill installs to `~/.claude/skills/seerxo-etsy-seo/` (or `./.claude/skills/…` with `--project`).

---

## 💬 Examples

### Simple Request
```
Create Etsy SEO for "vintage leather journal"
```

### With Category
```
Generate an Etsy listing for handmade candles in the Home & Living category
```

### With Details
```
I'm selling boho macrame wall hangings.
Create an optimized Etsy listing with title, description, and tags.
```

---

## 📦 What You Get

Each generation includes:

### 📝 SEO Title
- Under 140 characters (Etsy requirement)
- Primary keywords included
- Compelling and click-worthy

### 📄 Product Description
- Engaging opening hook
- Key features and benefits
- Usage scenarios
- Call-to-action

### 🏷️ 13 Optimized Tags
- Mix of broad and specific keywords
- Etsy search-optimized
- Trending search terms included

---


## 🌐 Web Interface

Prefer not to use Claude Desktop? Try our web interface:

👉 **[seerxo.com](https://www.seerxo.com)**

- Live demo
- Instant results
- No installation needed

---

## 🎨 Sample Output

**Input:** "Handmade ceramic coffee mug"

**Output:**

```markdown
📝 TITLE
Handmade Ceramic Coffee Mug | Artisan Pottery | Unique Kitchen Gift | Microwave Safe

📄 DESCRIPTION
Elevate your morning coffee ritual with this beautifully handcrafted ceramic mug.
Each piece is lovingly made by skilled artisans, ensuring no two mugs are exactly alike.

The perfect addition to your kitchen collection or a thoughtful gift for coffee
lovers. Featuring a comfortable ergonomic handle and smooth glazed finish.

✨ Features:
• Handmade with premium ceramic
• Microwave and dishwasher safe
• 12oz capacity
• Unique one-of-a-kind design

Perfect for daily use or special occasions. Makes an excellent housewarming or
birthday gift.

🏷️ TAGS
handmade mug, ceramic coffee cup, pottery mug, artisan mug, unique gift,
coffee lover gift, handcrafted, kitchen decor, tea cup, housewarming gift,
birthday present, ceramic pottery, handmade gift
```

---

## 🤝 Support

- 💬 [GitHub Issues](https://github.com/semihbugrasezer/etsy-seo-mcp/issues)
- 📧 [support@seerxo.com](mailto:support@seerxo.com)
- 🌐 [seerxo.com](https://www.seerxo.com)

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built for Etsy sellers by Seerxo**

[⭐ Star on GitHub](https://github.com/semihbugrasezer/etsy-seo-mcp) • [🚀 Try Now](https://www.seerxo.com)

</div>
