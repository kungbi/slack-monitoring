$ARGUMENTS: [interval] - Monitoring interval. e.g.: 1m, 5m, 10m, 15m(default), 30m, 1h

Start recurring Slack mention monitoring. Run the check workflow repeatedly at /loop $ARGUMENTS (default 15m) intervals.
For a single check, use `/slack-monitoring-once` instead.

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

Read `slack_token`, `user_id`, and `group_mentions` from `~/.claude/slack-monitoring/config.json`.

Use the Bash tool to search personal mentions:
```bash
curl -s -H "Authorization: Bearer {slack_token}" \
  "https://slack.com/api/search.messages?query=%3C%40{user_id}%3E+on%3Atoday&sort=timestamp&sort_dir=desc&count=100"
```

For each entry in `config.group_mentions` (if any), also run:
```bash
curl -s -H "Authorization: Bearer {slack_token}" \
  "https://slack.com/api/search.messages?query={group_mention}+on%3Atoday&sort=timestamp&sort_dir=desc&count=100"
```

Merge all results, deduplicate by `ts` field.
The response JSON contains `messages.matches` array. Each match has:
- `channel.id` — channel ID
- `channel.name` — channel name
- `ts` — message timestamp (use as `message_ts`)
- `text` — message text
- `username` — sender display name
- `user` — sender user ID
- `permalink` — message link
- `previous.thread_ts` — thread timestamp if in a thread (use `ts` itself if not in a thread)

From results:
- Exclude messages where `user` matches `{user_id}` (sent by me)
- Exclude messages where `bot_id` field is set (bot messages)

### 3. Process each mention
For each search result:
- If `message_ts` already exists in threads:
  - status is `completed` or `auto_completed` → skip
  - status is `pending` → **auto-complete check** (see step 4 below)
- If new mention:
  - Read full thread using the Bash tool:
    ```bash
    curl -s -H "Authorization: Bearer {slack_token}" \
      "https://slack.com/api/conversations.replies?channel={channel_id}&ts={thread_ts}"
    ```
    The response JSON contains a `messages` array. Each message has `user`, `text`, `ts`, `bot_id` fields.
  - Check if my reply exists: look for any message in `messages` array where `user == {user_id}` (skip the first message if it is the original mention)
  - If my reply exists in thread → add with status: `auto_completed`
  - If no reply from me → add with status: `pending`, include in DM targets
  - **Write summary**: Detailed summary including full thread context (background, each participant's response, current status)
  - **Write suggested_reply**: Recommend next actions I can take (suggest reply content, whether acknowledgment is sufficient, etc.)

### 4. Auto-complete check for existing pending threads
For each existing `pending` thread, re-read the thread using the Bash tool:
```bash
curl -s -H "Authorization: Bearer {slack_token}" \
  "https://slack.com/api/conversations.replies?channel={channel_id}&ts={thread_ts}"
```
- If a new reply from me (`user == {user_id}`) is found → change status to `auto_completed`
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
