# 🚀 Etsy SEO Generator

<div align="center">

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/stars/semihbugrasezer/etsy-seo-mcp?style=social)](https://github.com/semihbugrasezer/etsy-seo-mcp)

**AI-powered Etsy product listing generator for Claude Desktop**

Generate perfect SEO titles, descriptions, and tags in seconds

[Live Demo](https://www.seerxo.com) • [Quick Start](#-quick-start) • [Examples](#-examples)

</div>

---

## 🎯 What is this?

A Claude Desktop integration that generates complete, SEO-optimized Etsy product listings instantly. Perfect for Etsy sellers who want to:

- ✅ Save 3+ hours per product listing
- ✅ Rank higher in Etsy search results
- ✅ Write compelling product descriptions
- ✅ Never run out of creative tag ideas

## ⚡ Quick Start

### 1. Install CLI

```bash
npm install -g seerxo-mcp
```

### 2. Link your account (recommended)

Dashboard: go to **Claude MCP Access** and click **Start CLI login**. Approve the email—CLI picks up your account automatically (no manual envs).

Prefer CLI? You can still run:

```bash
seerxo-mcp login --email your-email@example.com
```

### 3. Prefer manual setup?

Use the dashboard "Generate CLI config" button **or** run:

```bash
seerxo-mcp configure --email your-email@example.com --api-key your-api-key
```

This is handy if you already have an API key and just want to write it locally.

### 4. Configure Claude Desktop

Add this to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "seerxo": {
      "command": "seerxo-mcp",
      "env": {
        "SEERXO_EMAIL": "your-email@example.com",
        "SEERXO_API_KEY": "your-api-key"
      }
    }
  }
}
```

**Important:** Replace `SEERXO_EMAIL` with your verified dashboard email and `SEERXO_API_KEY` with the per-user API key from your DevQora dashboard.

### 4. Restart Claude Desktop

Close and reopen Claude Desktop completely.

### 4. Start Using

That's it! Just ask Claude:

```
Generate an Etsy listing for my handmade ceramic coffee mug
```

**Free Tier:** 5 generations per month
**Premium:** Unlimited generations - [Upgrade at seerxo.com](https://www.seerxo.com)

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

### 💰 Price Suggestion
- Based on similar Etsy products
- Market competitive range

---

## 🔐 Security

This MCP server implements **enterprise-grade security** with comprehensive protection against common vulnerabilities:

### 🛡️ Cryptographic Security
- **HMAC-SHA256 Signatures**: All requests cryptographically signed with secret key
- **Payload-Based Replay Protection**: Timestamp + payload hash prevents duplicate requests
- **Timestamp Validation**: 5-minute window prevents time-based attacks
- **Duplicate Request Detection**: Request cache blocks replay attempts

### 🚫 Input Validation & DoS Protection
- **Buffer Overflow Protection**: 1MB max buffer size prevents memory exhaustion
- **Input Length Limits**: Enforced max lengths for all user inputs
  - Product name: 500 chars
  - Category: 200 chars
  - Email: 254 chars (RFC 5321)
- **ReDoS Prevention**: Non-backtracking regex patterns prevent regex DoS
- **JSON Injection Protection**: Safe parsing with structure validation
- **Rate Limiting**: 10 requests/minute per user

### 🌐 Network Security
- **SSRF Protection**: Whitelist-based API endpoint validation
- **Protocol Enforcement**: HTTPS required (HTTP only for localhost)
- **Request Timeout**: 30-second timeout prevents hanging connections
- **Allowed Hosts**:
  - `seerxo.com`
  - `api.seerxo.com`
  - `localhost` (development only)

### 🧹 Data Sanitization
- **XSS Prevention**: HTML entity encoding for all outputs
- **Email Validation**: RFC-compliant format validation
- **Response Validation**: Strict schema validation of API responses
- **Safe Error Messages**: Error messages sanitized to prevent info disclosure

### 📊 Resource Management
- **Memory Leak Prevention**: Automatic cache cleanup every 5 minutes
- **Cache Size Limits**: Bounded cache sizes prevent memory exhaustion
- **Rate Limit Cleanup**: Automatic removal of expired rate limit entries

### 🔧 Environment Variables
- `SEERXO_EMAIL`: **Required** – Your verified dashboard email for usage tracking
- `SEERXO_API_KEY`: **Required** – Per-user API key in the format `your-api-key`
- `SEERXO_CLIENT_VERSION`: Optional – Overrides the client version sent in headers
- `LOG_LEVEL`: Optional – Logging level: debug/info/warn/error (default: error)

> Tip: run `seerxo-mcp login` (magic link) or `seerxo-mcp configure` (manual) to write these values to `~/.seerxo-mcp/config.json` instead of exporting shell variables manually.

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

💰 SUGGESTED PRICE
$28-$45
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
