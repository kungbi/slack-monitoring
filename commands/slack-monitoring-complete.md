$ARGUMENTS: <id|all> - Thread ID to complete or 'all' for bulk completion. e.g.: 1, 3, all

Mark Slack mention threads as complete.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.
Use the `tone` value to style suggested replies.

- Compact i18n: "한국어 텍스트" (ko) / "English text" (en)
- Block i18n: see `If language = ko:` / `If language = en:` sections below.

## Behavior

### `<id>` (number) — Complete individual thread
1. Read `~/.claude/slack-monitoring/YYYY-MM-DD.json` (today's date)
2. Change the thread's status to `completed`, record current time in `completed_at`
3. Save and show confirmation:

Display: "✅ #<id> 완료 처리됨 — <채널명> · <보낸사람> · <요약 앞부분>" (ko) / "✅ #<id> marked complete — <channel> · <from> · <summary prefix>" (en)

### `all` — Complete all pending threads
1. Read `~/.claude/slack-monitoring/YYYY-MM-DD.json` (today's date)
2. Change all `pending` threads' status to `completed`, record current time in `completed_at`
3. Save and show confirmation:

Display: "✅ N건 전체 완료 처리됨" (ko) / "✅ All N items marked complete" (en)

If no argument provided, show usage hint:

**If language = ko:**
```
사용법: /slack-monitoring-complete <id> 또는 /slack-monitoring-complete all
```

**If language = en:**
```
Usage: /slack-monitoring-complete <id> or /slack-monitoring-complete all
```
