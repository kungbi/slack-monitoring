# slack-monitoring

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blueviolet)](https://docs.anthropic.com/en/docs/claude-code)
[![Slack MCP](https://img.shields.io/badge/Slack-MCP_Server-4A154B?logo=slack&logoColor=white)](https://modelcontextprotocol.io/integrations/slack)

**Slack mention monitoring for Claude Code. Never miss a @mention again.**

_Stop checking Slack manually. Let Claude watch it for you._

[Quick Start](#quick-start) • [Commands](#commands) • [How It Works](#how-it-works) • [Configuration](#configuration)

---

## Quick Start

### Option A: Plugin Marketplace (Recommended)

```bash
/plugin marketplace add https://github.com/kungbi/slack-monitoring
/plugin install slack-monitoring
```

### Option B: Manual Install

```bash
git clone https://github.com/kungbi/slack-monitoring.git
cd slack-monitoring && chmod +x install.sh && ./install.sh
```

### Then:

```
/slack-monitoring setup    # Configure once
/slack-monitoring          # Start monitoring
```

That's it. Claude watches your mentions every 15 minutes and DMs you a summary.

---

## Why slack-monitoring?

- **Zero overhead** — Set it and forget it. Runs in the background while you code
- **Thread-aware** — Tracks each mention as a thread, not just a message
- **Auto-complete** — Already replied? Automatically marked as done
- **Context summaries** — Full thread context + suggested replies, not just "someone mentioned you"
- **Smart notifications** — Only alerts on new mentions. No duplicate noise
- **Customizable** — Language, tone, interval, summary style — all configurable

---

## Commands

| Command | What it does |
|---------|-------------|
| `/slack-monitoring` | Start monitoring (default 15m interval) |
| `/slack-monitoring 5m` | Start with custom interval |
| `/slack-monitoring list` | Show pending (unanswered) mentions |
| `/slack-monitoring complete 2` | Mark mention #2 as done |
| `/slack-monitoring complete all` | Mark all pending as done |
| `/slack-monitoring setup` | Configuration wizard |
| `/slack-monitoring help` | Show help |

---

## How It Works

```
Every check cycle:

  ┌─────────────────────────────────────────────┐
  │  1. Search Slack for @mentions today        │
  │  2. For each new mention:                   │
  │     → Read full thread                      │
  │     → Already replied? → auto_completed     │
  │     → Not replied? → pending + DM alert     │
  │  3. Re-check existing pending threads       │
  │     → Reply found? → auto_completed         │
  │  4. Save daily record                       │
  └─────────────────────────────────────────────┘
```

### Status Types

| Status | Description |
|--------|-------------|
| `pending` | Unanswered — needs your attention |
| `auto_completed` | You replied in the thread — auto-resolved |
| `completed` | Manually marked done via `complete` command |

### DM Alert Format

```
🔔 새 Slack 멘션 (14:30 기준)

#general
- [#1] @홍길동: API 변경 관련 확인 요청... [링크]

✅ 자동완료 (2건) - 이미 답장됨
---
⏳ 미답변 (1건) - /slack-monitoring list 로 확인
```

---

## Configuration

Run `/slack-monitoring setup` to configure:

| Setting | Options | Default |
|---------|---------|---------|
| **Slack connection** | Auto-detected | — |
| **Language** | 한국어, English | 한국어 |
| **Tone** | Formal, Casual, Auto-learn from your messages | Formal |
| **Interval** | 1m, 5m, 10m, 15m, 30m, 1h, custom | 15m |
| **Summary style** | Brief, Detailed, Full context | Detailed |

Config stored at `~/.claude/slack-monitoring/config.json`

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
      "from": "홍길동",
      "from_id": "U01234567",
      "summary": "Thread context summary",
      "suggested_reply": "Suggested response",
      "permalink": "https://slack.com/archives/...",
      "status": "pending",
      "first_seen": "2026-03-24T09:15:00",
      "completed_at": null
    }
  ]
}
```

</details>

---

## Manual Installation

If you prefer not to use the install script:

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
