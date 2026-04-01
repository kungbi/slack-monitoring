Run the Slack monitoring initial setup wizard.

**All output in this command follows these rules:**
- Steps 1-3: always English (language not yet selected)
- Steps 4 onward: use the language selected in Step 3
- DO NOT read language from config file at any point

**All selections MUST use the `AskUserQuestion` tool.**

---

## Step 1. Get Slack User Token

Show this in English:
```
🔑 A Slack User Token is required.

1. Create an app at https://api.slack.com/apps (or use existing)
2. OAuth & Permissions → Add User Token Scopes:
   search:read, channels:history, groups:history, im:history, usergroups:read, users:read
3. Install app to your workspace
4. Copy the User OAuth Token (starts with xoxp-)
```

AskUserQuestion: "Paste your Slack User Token (xoxp-...)"

If the user leaves it blank, try to read the existing token from `~/.claude/slack-monitoring/config.json`.
- If config exists and has a valid `slack_token` (starts with `xoxp-`): continue with that token.
- If config does not exist or `slack_token` is missing/empty: show "⚠️ No existing token found. Please paste your Slack User Token (xoxp-...)." and ask again.

---

## Step 2. Verify connection & detect user

Use Bash tool:
```bash
curl -s -H "Authorization: Bearer {token}" "https://slack.com/api/auth.test"
```

- `ok: true` → note down `user_id`, `user_name`, `team` (workspace) from response
- `ok: false` → show in English and stop:
```
⚠️ Connection failed: {error}
- Verify token starts with xoxp-
- Verify all required scopes are added
- Run /slack-monitoring:setup again
```

Show in English: "✅ Slack connected ({user_name} / {workspace})"

---

## Step 3. Language

AskUserQuestion:
- question: "🌐 Select notification language"
- options:
  1. English
  2. 한국어

Set `selected_language` = `en` or `ko` based on selection. Use this for all steps from here.

---

## Step 4. Suggested reply tone

**If selected_language = ko:**
AskUserQuestion:
- question: "💬 추천 답변 말투를 선택해주세요"
- options:
  1. 존댓말 - 비즈니스 (기본) → "확인했습니다. 감사합니다!"
  2. 이모지 다정 → "확인했어요! 감사합니다 😊"
  3. 간결 프로 → "확인. 처리하겠습니다."
  4. MZ 스타일 → "ㅇㅋ 바로 확인할게요~"
  5. Slack 학습 - 내 최근 메시지에서 말투를 자동 학습

**If selected_language = en:**
AskUserQuestion:
- question: "💬 Select suggested reply tone"
- options:
  1. Professional (default) → "Acknowledged. Thank you for flagging this."
  2. Friendly → "Got it, thanks! Will take a look 😊"
  3. Concise → "Noted. Will handle."
  4. Auto-learn - Learn tone from my recent Slack messages

Auto-learn selected: Use Bash tool:
```bash
curl -s -H "Authorization: Bearer {token}" \
  "https://slack.com/api/search.messages?query=from%3A%40{user_id}%20-in%3Adm&count=50&sort=timestamp&sort_dir=desc"
```
Analyze tone patterns and save to `tone_examples` in config.

---

## Step 5. Monitoring interval

**If selected_language = ko:**
AskUserQuestion: "⏱️ 기본 모니터링 간격을 설정해주세요"

**If selected_language = en:**
AskUserQuestion: "⏱️ Set default monitoring interval"

Options (both languages):
1. 15min (default)
2. 5min
3. 10min
4. 30min
5. 1h
6. 1min
7. Custom (enter manually)

If option 7: AskUserQuestion "Enter interval (e.g.: 3m, 45m, 2h)"

> Note: This interval is used as the default cron schedule when `/slack-monitoring:start` is called without an explicit interval argument.

---

## Step 6. Summary style

**If selected_language = ko:**
AskUserQuestion: "📝 멘션 요약 스타일을 선택해주세요"
- options:
  1. 상세 (기본) - 스레드 배경/답변 정리/테이블 + 추천 답변
  2. 간략 - 한 줄 요약 + 추천 답변
  3. 풀 컨텍스트 - 상세 + 원문 인용 포함

**If selected_language = en:**
AskUserQuestion: "📝 Select mention summary style"
- options:
  1. Detailed (default) - Thread background/response summary/table + suggested reply
  2. Brief - One-line summary + suggested reply
  3. Full context - Detailed + original message quotes included

---

## Step 7. Summary model

**If selected_language = ko:**
AskUserQuestion: "🤖 요약에 사용할 모델을 선택해주세요"
- options:
  1. Haiku (권장) - 빠르고 가벼움, 일반 멘션 요약에 충분
  2. Sonnet - 더 정교한 요약, 복잡한 스레드에 적합
  3. 현재 세션 모델 - 지금 대화 중인 모델 그대로 사용 (subagent 없음)

**If selected_language = en:**
AskUserQuestion: "🤖 Select model for summaries"
- options:
  1. Haiku (recommended) - Fast and lightweight, sufficient for typical mention summaries
  2. Sonnet - More detailed summaries, better for complex threads
  3. Current session model - Use the active session model directly (no subagent)

Map: 1 → `haiku`, 2 → `sonnet`, 3 → `session`

---

## Step 8. Auto-detect user groups

Use Bash tool:
```bash
curl -s -H "Authorization: Bearer {token}" \
  "https://slack.com/api/usergroups.list?include_users=true"
```

**If `ok: false` (e.g. `missing_scope`):**

Show the error clearly so the user knows what happened and how to fix it:

**If selected_language = ko:**
```
⚠️ 그룹 멘션 조회 실패: {error}

그룹 멘션 모니터링을 사용하려면 Slack 앱에 'usergroups:read' 권한이 필요합니다.
→ https://api.slack.com/apps → 앱 선택 → OAuth & Permissions → User Token Scopes에 'usergroups:read' 추가 → 앱 재설치

지금은 건너뛰고, 나중에 /slack-monitoring:setup 으로 다시 설정할 수 있습니다.
```

**If selected_language = en:**
```
⚠️ Failed to fetch user groups: {error}

Group mention monitoring requires the 'usergroups:read' scope.
→ https://api.slack.com/apps → Select your app → OAuth & Permissions → Add 'usergroups:read' to User Token Scopes → Reinstall app

You can skip this for now and re-run /slack-monitoring:setup later to add it.
```

Then AskUserQuestion:
- ko: "그룹 핸들을 직접 입력하시겠습니까? (예: @backend-team, @devops) 없으면 Enter"
- en: "Would you like to enter group handles manually? (e.g. @backend-team, @devops) Press Enter to skip"

If user enters handles, save them. If skipped: `[]`.

**If `ok: true`:**

Find groups where `users` array contains `{user_id}`.

If groups found:

**If selected_language = ko:**
AskUserQuestion: "👥 모니터링할 그룹을 선택해주세요 (쉼표로 구분, 없으면 Enter)\n발견된 그룹: {group list}"

**If selected_language = en:**
AskUserQuestion: "👥 Select groups to monitor (comma-separated, Enter to skip)\nFound groups: {group list}"

If no groups found:

**If selected_language = ko:**
AskUserQuestion: "👥 소속된 그룹이 없습니다. 그룹 핸들을 직접 입력하시겠습니까? (예: @backend-team) 없으면 Enter"

**If selected_language = en:**
AskUserQuestion: "👥 No groups found for your account. Enter group handles manually? (e.g. @backend-team) Press Enter to skip"

Save selected handles as `group_mentions` array. If skipped: `[]`.

---

## Step 9. Save & confirm

Save all collected values to `~/.claude/slack-monitoring/config.json`:
```json
{
  "slack_token": "{token}",
  "user_id": "{user_id}",
  "user_name": "{user_name}",
  "workspace": "{workspace}",
  "language": "{selected_language}",
  "tone": "{tone}",
  "tone_examples": [],
  "default_interval": "{interval}",
  "summary_style": "{style}",
  "model": "{model}",
  "group_mentions": {group_mentions},
  "updated_at": "{now}"
}
```

**If selected_language = ko:**
```
✅ 설정 완료!

📡 Slack 연결: ✅ {user_name} ({workspace})
🌐 언어: 한국어
💬 말투: {tone}
⏱️ 간격: {interval}
📝 스타일: {style}
🤖 요약 모델: {model}
👥 모니터링 그룹: {group_mentions or "없음"}

변경하려면 /slack-monitoring:setup 을 다시 실행하세요.
```

**If selected_language = en:**
```
✅ Setup complete!

📡 Slack connection: ✅ {user_name} ({workspace})
🌐 Language: English
💬 Tone: {tone}
⏱️ Interval: {interval}
📝 Style: {style}
🤖 Summary model: {model}
👥 Monitored groups: {group_mentions or "None"}

To change settings, run /slack-monitoring:setup again.
```

---

## Config file format reference

tone values: `formal`, `emoji`, `concise`, `mz` (ko only), `learned`
summary_style values: `brief`, `detailed`, `full`
