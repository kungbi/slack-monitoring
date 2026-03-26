$ARGUMENTS: <id> - Thread ID to view details. e.g.: 1, 3

Display detailed information for a Slack mention thread.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.
Use the `tone` value to style suggested replies.

- Compact i18n: "한국어 텍스트" (ko) / "English text" (en)
- Block i18n: see `If language = ko:` / `If language = en:` sections below.

## Behavior

1. Read `~/.claude/slack-monitoring/YYYY-MM-DD.json` (today's date)
2. Find the thread with the given ID
3. Re-read the latest thread state using the Bash tool:
   - Read `slack_token` from `~/.claude/slack-monitoring/config.json`
   - Use `channel_id` and `thread_ts` fields from the thread record
   ```bash
   curl -s -H "Authorization: Bearer {slack_token}" \
     "https://slack.com/api/conversations.replies?channel={channel_id}&ts={thread_ts}"
   ```
   The response `messages` array contains all messages in the thread. Use this to get the latest thread content for the summary and check if new replies were added since last seen.
4. Display in the following format:

**If language = ko:**
```
📬 #<id> — #채널명 <status>

> 보낸 사람 · 시간 · [스레드 열기](permalink)

### 배경
스레드 전체 맥락 요약...

### 답변 정리
| 항목 | 내용 |
|------|------|
| ... | ... |

### 💬 추천 답변
> 추천 답변 내용...

/slack-monitoring-complete <id>    ← 완료 처리
```

**If language = en:**
```
📬 #<id> — #channel-name <status>

> From · Time · [Open thread](permalink)

### Background
Full thread context summary...

### Response Summary
| Item | Details |
|------|---------|
| ... | ... |

### 💬 Suggested Reply
> Suggested reply content...

/slack-monitoring-complete <id>    ← Mark complete
```

- If status is `pending`, include suggested reply
- If status is `completed`/`auto_completed`, show completion time and method
- If new replies were added to the thread, update summary and save to data file

If no argument provided, show usage hint:

**If language = ko:**
```
사용법: /slack-monitoring-show <id>
💡 ID 확인: /slack-monitoring-list
```

**If language = en:**
```
Usage: /slack-monitoring-show <id>
💡 Check IDs: /slack-monitoring-list
```
