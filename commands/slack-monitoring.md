$ARGUMENTS: [interval] - Monitoring interval. e.g.: 1m, 5m, 10m, 15m(default), 30m, 1h

Start Slack mention monitoring. Run the check workflow repeatedly at /loop $ARGUMENTS (default 15m) intervals.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.
Use the `tone` value to style suggested replies.

- Compact i18n: "한국어 텍스트" (ko) / "English text" (en)
- Block i18n: see `If language = ko:` / `If language = en:` sections below.

---

## Check Workflow (every execution)

### 1. Load today's data
- Read `~/.claude/slack-monitoring/YYYY-MM-DD.json` via the Read tool
- If not found, initialize with `{"date": "YYYY-MM-DD", "threads": []}`

### 2. Search today's mentions
Run 3 queries and merge results (deduplicate by message_ts):
- `<@U09L7JLCRBN> on:today` — personal tagging
- `backend_timespread on:today` — @backend_timespread group tagging (text search)
- `team_timespread on:today` — @team_timespread group tagging (text search)

Common options: sort: timestamp, desc, include_context: false
From results:
- Exclude messages sent by me (U09L7JLCRBN)
- Exclude GitHub bot messages (U01UE6J1NER, U01UDJ2CFNF, etc.) to prevent code review noise

### 3. Process each mention
For each search result:
- If `message_ts` already exists in threads:
  - status is `completed` or `auto_completed` → skip
  - status is `pending` → **auto-complete check** (see step 4 below)
- If new mention:
  - Read full thread via `slack_read_thread`
  - If my (U09L7JLCRBN) reply exists in thread → add with status: `auto_completed`
  - If no reply from me → add with status: `pending`, include in DM targets
  - **Write summary**: Detailed summary including full thread context (background, each participant's response, current status)
  - **Write suggested_reply**: Recommend next actions I can take (suggest reply content, whether acknowledgment is sufficient, etc.)

### 4. Auto-complete check for existing pending threads
For each existing `pending` thread:
- Re-read the thread via `slack_read_thread`
- If a new reply from me (U09L7JLCRBN) is found → change status to `auto_completed`
- If only bot messages (Slackbot, etc.) exist as reminders → change to `auto_completed`

### 5. Terminal summary output
Print summary to terminal only when there are changes (new mentions, auto-completions, etc.).
If no changes, print a single line: "변경사항 없음" (ko) / "No changes" (en)

**If language = ko:**
```
🔔 새 Slack 멘션 (HH:MM 기준)

#채널명
- [#id] @발신자: 메시지 요약... (링크)

✅ 자동완료 (N건) - 이미 답장됨
⏳ 미답변 (N건) - `/slack-monitoring-list`로 확인
```

**If language = en:**
```
🔔 New Slack Mentions (as of HH:MM)

#channel-name
- [#id] @sender: Message summary... (link)

✅ Auto-completed (N) - already replied
⏳ Pending (N) - check with `/slack-monitoring-list`
```

**Note: Never send Slack DMs automatically. Terminal output only.**

### 6. Save data
- Save updated threads to `~/.claude/slack-monitoring/YYYY-MM-DD.json`

---

## Data file format

`~/.claude/slack-monitoring/YYYY-MM-DD.json`:
```json
{
  "date": "YYYY-MM-DD",
  "threads": [
    {
      "id": 1,
      "channel_id": "CMXL9DAKE",
      "channel_name": "#timespread",
      "thread_ts": "1774253132.128239",
      "message_ts": "1774255578.683349",
      "from": "이준원",
      "from_id": "U08GFG1B36F",
      "summary": "Detailed thread summary",
      "permalink": "https://...",
      "status": "pending",
      "first_seen": "2026-03-24T09:15:00",
      "completed_at": null
    }
  ]
}
```

---

## Config application
- When running the check workflow, apply settings from `~/.claude/slack-monitoring/config.json` if it exists
- If no config exists, use defaults (en, formal, 15m, detailed)

Status values:
- `pending`: Unanswered, needs response
- `auto_completed`: Automatically completed because I replied in the thread
- `completed`: Manually marked complete by user
