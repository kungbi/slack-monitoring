English | [한국어](README.ko.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [Español](README.es.md) | [Tiếng Việt](README.vi.md) | [Português](README.pt.md)

# slack-monitoring

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blueviolet)](https://docs.anthropic.com/en/docs/claude-code)
[![Slack MCP](https://img.shields.io/badge/Slack-MCP_Server-4A154B?logo=slack&logoColor=white)](https://modelcontextprotocol.io/integrations/slack)

**Slack mention monitoring for Claude Code. Never miss a @mention again.**

_Stop checking Slack manually. Let Claude watch it for you._

[Quick Start](#quick-start) • [Commands](#commands) • [How It Works](#how-it-works) • [Configuration](#configuration)

---

## Quick Start

**Step 1: Install**

```bash
# Option A: Plugin Marketplace (Recommended)
/plugin marketplace add https://github.com/kungbi/slack-monitoring.git
/plugin install slack-monitoring

# Option B: Manual
git clone https://github.com/kungbi/slack-monitoring.git
cd slack-monitoring && chmod +x install.sh && ./install.sh
```

**Step 2: Setup**

```
/slack-monitoring:setup
```

**Step 3: Start monitoring**

```
/slack-monitoring:start
```

That's it. Claude watches your mentions every 15 minutes and sends you a summary.

---

## Why slack-monitoring?

- **Zero overhead** — Set it and forget it. Runs in the background while you code
- **Thread-aware** — Tracks each mention as a thread, not just a message
- **Auto-complete** — Already replied? Automatically marked as done
- **Context summaries** — Full thread context + suggested replies, not just "someone mentioned you"
- **Smart notifications** — Only alerts on new mentions. No duplicate noise
- **Channel filtering** — Ignore noisy channels, prioritize critical ones, set VIP senders
- **Weekly digest** — Response rate, avg response time, top channels & senders
- **Customizable** — Language, tone, interval, summary style — all configurable

---

## Commands

| Command | What it does |
|---------|-------------|
| `/slack-monitoring:start` | Start monitoring (default 15m interval) |
| `/slack-monitoring:start 5m` | Start with custom interval |
| `/slack-monitoring:list` | Show pending (unanswered) mentions |
| `/slack-monitoring:show 1` | View mention #1 details (summary, suggested reply) |
| `/slack-monitoring:complete 2` | Mark mention #2 as done |
| `/slack-monitoring:complete all` | Mark all pending as done |
| `/slack-monitoring:digest` | Weekly digest (last 7 days stats) |
| `/slack-monitoring:setup` | Configuration wizard |
| `/slack-monitoring:help` | Show help |
| `/slack-monitoring:status` | Show config and today's mention stats |

---

## How It Works

```
Every check cycle:

  ┌─────────────────────────────────────────────────┐
  │  1. Search Slack for @mentions today            │
  │  2. Filter by channel rules (ignore/priority)   │
  │  3. For each new mention:                       │
  │     → Read full thread                          │
  │     → Already replied? → auto_completed         │
  │     → Not replied? → pending + alert            │
  │     → VIP/priority channel? → tagged as 🔴      │
  │  4. Re-check existing pending threads           │
  │     → Reply found? → auto_completed             │
  │  5. Save daily record                           │
  └─────────────────────────────────────────────────┘
```

### Status Types

| Status | Description |
|--------|-------------|
| `pending` | Unanswered — needs your attention |
| `auto_completed` | You replied in the thread — auto-resolved |
| `completed` | Manually marked done via `complete` command |

### Priority

| Priority | Trigger |
|----------|---------|
| 🔴 `high` | Mention from VIP sender or priority channel |
| — `normal` | Everything else |

### Alert Format

```
🔔 New Slack Mentions (14:30)

🚨 Priority
#incidents
- [#1] @CTO: Deployment rollback needed... [link]

#general
- [#2] @colleague: API question... [link]

✅ Auto-completed (2) - already replied
---
⏳ Pending (1) - /slack-monitoring list to check
```

---

## Weekly Digest

Run `/slack-monitoring:digest` for a 7-day summary:

```
📊 Weekly Digest (03/18 ~ 03/24)

📈 Overview
- Total mentions: 28
- Responded: 25 (89%)
- Auto-completed: 18 / Manual: 7
- Pending: 3

⏱️ Response Time
- Average: 1h 23m
- Fastest: 5m (#incidents)
- Slowest: 6h (#general)

📢 Top Channels
| Channel     | Mentions | Response Rate |
|-------------|----------|---------------|
| #dev        | 12       | 92%           |
| #general    | 8        | 100%          |

👥 Top Senders
| Sender      | Mentions | Response Rate |
|-------------|----------|---------------|
| Alice       | 7        | 100%          |
| Bob         | 5        | 80%           |
```

---

## Configuration

Run `/slack-monitoring:setup` to configure:

| Setting | Options | Default |
|---------|---------|---------|
| **Slack connection** | Auto-detected | — |
| **Language** | Korean, English | Korean |
| **Tone** | Formal, Casual, Auto-learn from your messages | Formal |
| **Interval** | 1m, 5m, 10m, 15m, 30m, 1h, custom | 15m |
| **Summary style** | Brief, Detailed, Full context | Detailed |
| **Ignore channels** | Channels to skip (e.g. #random, #fun) | None |
| **Priority channels** | Channels shown first (e.g. #incidents) | None |
| **VIP senders** | People always marked high priority | None |

<details>
<summary>Config file format</summary>

`~/.claude/slack-monitoring/config.json`:

```json
{
  "user_id": "U01234567",
  "user_name": "Your Name",
  "workspace": "your-workspace",
  "language": "ko",
  "tone": "formal",
  "tone_examples": [],
  "default_interval": "15m",
  "summary_style": "detailed",
  "channels": {
    "ignore_channels": [
      { "id": "C01234567", "name": "#random" }
    ],
    "priority_channels": [
      { "id": "C07654321", "name": "#incidents" }
    ],
    "vip_senders": [
      { "id": "U09876543", "name": "CTO" }
    ]
  },
  "updated_at": "2026-03-24T11:00:00"
}
```

</details>

---

## Data Storage

```
~/.claude/slack-monitoring/
├── config.json              # Your settings
├── 2026-03-24.json          # Daily mention records
├── 2026-03-25.json
└── ...
```

<details>
<summary>Data format</summary>

```json
{
  "date": "2026-03-24",
  "threads": [
    {
      "id": 1,
      "channel_id": "C01234567",
      "channel_name": "#general",
      "thread_ts": "1774253132.128239",
      "message_ts": "1774255578.683349",
      "from": "Alice",
      "from_id": "U01234567",
      "summary": "Thread context summary",
      "suggested_reply": "Suggested response",
      "permalink": "https://slack.com/archives/...",
      "status": "pending",
      "priority": "normal",
      "first_seen": "2026-03-24T09:15:00",
      "completed_at": null
    }
  ]
}
```

</details>

---

## Manual Installation

```bash
# Skill file
mkdir -p ~/.claude/skills/user/slack-monitoring
cp skill/SKILL.md ~/.claude/skills/user/slack-monitoring/SKILL.md

# Command file
mkdir -p ~/.claude/commands
cp command/slack-monitoring.md ~/.claude/commands/slack-monitoring.md
```

## Uninstall

```bash
rm -rf ~/.claude/skills/user/slack-monitoring
rm -f ~/.claude/commands/slack-monitoring.md
rm -rf ~/.claude/slack-monitoring  # optional: remove data
```

---

## Requirements

| Requirement | Description |
|-------------|-------------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | CLI tool (active session required) |
| [Slack MCP Server](https://modelcontextprotocol.io/integrations/slack) | Slack integration for Claude Code |

> **Note:** Monitoring runs only while your Claude Code session is active. When the session ends, monitoring stops.

---

## Contributing

Issues and PRs welcome. Bug reports and feature requests at [Issues](https://github.com/kungbi/slack-monitoring/issues).

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Stop context-switching. Start shipping.**

</div>
