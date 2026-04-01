Display the list of unanswered Slack mentions.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.
Use the `tone` value to style suggested replies.

- Compact i18n: "한국어 텍스트" (ko) / "English text" (en)
- Block i18n: see `If language = ko:` / `If language = en:` sections below.

## Behavior

1. Read `~/.claude/slack-monitoring/YYYY-MM-DD.json` (today's date)
2. Filter threads with `pending` status only
3. Display to user as a table:

**If language = ko:**
```
📋 미답변 멘션 (N건)

| ID | 채널 | 보낸 사람 | 시간 | 요약 | 링크 |
|----|------|----------|------|------|------|
| #1 | #backend | 김민수 | 17:46 | API 호출 시점 답변... | [열기](permalink) |
| #2 | #frontend | 박지현 | 13:57 | PR 확인 요청... | [열기](permalink) |

💡 상세 보기: /slack-monitoring:show 1
💡 완료 처리: /slack-monitoring:complete 1
💡 전체 완료: /slack-monitoring:complete all
```

**If language = en:**
```
📋 Pending Mentions (N)

| ID | Channel | From | Time | Summary | Link |
|----|---------|------|------|---------|------|
| #1 | #backend | 김민수 | 17:46 | API call timing response... | [Open](permalink) |
| #2 | #frontend | 박지현 | 13:57 | PR review request... | [Open](permalink) |

💡 Details: /slack-monitoring:show 1
💡 Complete: /slack-monitoring:complete 1
💡 Complete all: /slack-monitoring:complete all
```

4. After the pending table, filter threads with `auto_completed` or `completed` status where the completion date is today. If any exist, append a collapsed section:

**If language = ko:**
```
<details>
<summary>✅ 자동완료 (N건)</summary>

| ID | 채널 | 보낸 사람 | 사유 | 링크 |
|----|------|----------|------|------|
| #3 | #general | 이준혁 | 다른 사람이 답변함 | [열기](permalink) |
| #4 | #random | 박서연 | 응답 불필요 | [열기](permalink) |

</details>
```

**If language = en:**
```
<details>
<summary>✅ Auto-completed (N)</summary>

| ID | Channel | From | Reason | Link |
|----|---------|------|--------|------|
| #3 | #general | 이준혁 | Resolved by others | [Open](permalink) |
| #4 | #random | 박서연 | No action needed | [Open](permalink) |

</details>
```

Map `completion_reason` values for the Reason column:
- `user_replied` → "이미 답장함" (ko) / "Already replied" (en)
- `resolved_by_others` → "다른 사람이 답변함" (ko) / "Resolved by others" (en)
- `no_action_needed` → "응답 불필요" (ko) / "No action needed" (en)

If no auto-completed threads today, omit this section entirely.

5. If no pending threads:

Display: "✅ 미답변 멘션이 없습니다!" (ko) / "✅ No pending mentions!" (en)
