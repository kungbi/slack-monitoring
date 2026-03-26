Run the Slack monitoring initial setup wizard.

## Language & Tone
Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.
- Compact i18n: "한국어 텍스트" (ko) / "English text" (en)
- Block i18n: see `If language = ko:` / `If language = en:` sections below.

Read config file `~/.claude/slack-monitoring/config.json`. If it doesn't exist, create a new one.
Proceed through each step in order. If a value is already set, show the current value and ask whether to change it.

**All selections MUST use the `AskUserQuestion` tool.**

## Step 1. Get Slack User Token

**If language = ko:**
```
🔑 Slack User Token이 필요합니다.

1. https://api.slack.com/apps 에서 새 앱 생성 (또는 기존 앱 사용)
2. OAuth & Permissions → User Token Scopes 추가:
   search:read, channels:history, groups:history, im:history, usergroups:read, users:read
3. 워크스페이스에 앱 설치
4. User OAuth Token (xoxp-로 시작) 복사
```

**If language = en:**
```
🔑 A Slack User Token is required.

1. Create an app at https://api.slack.com/apps (or use existing)
2. OAuth & Permissions → Add User Token Scopes:
   search:read, channels:history, groups:history, im:history, usergroups:read, users:read
3. Install app to your workspace
4. Copy the User OAuth Token (starts with xoxp-)
```

AskUserQuestion: "Slack User Token을 붙여넣어 주세요 (xoxp-...)" (ko) / "Paste your Slack User Token (xoxp-...)" (en)

## Step 2. Verify connection & detect user

Use Bash tool to call auth.test:
```bash
curl -s -H "Authorization: Bearer {token}" "https://slack.com/api/auth.test"
```

Parse JSON response:
- `ok: true` → save `user_id` (from `user_id` field), `user_name` (from `user` field), `workspace` (from `team` field)
- `ok: false` → show error and stop

Success display: "Slack 연결됨 ({user_name} / {workspace})" (ko) / "Slack connected ({user_name} / {workspace})" (en)

**If language = ko (on error):**
```
⚠️ 연결 실패: {error}
- 토큰이 xoxp-로 시작하는지 확인
- 필요한 스코프가 모두 추가됐는지 확인
- /slack-monitoring:setup 을 다시 실행해주세요
```

**If language = en (on error):**
```
⚠️ Connection failed: {error}
- Verify token starts with xoxp-
- Verify all required scopes are added
- Run /slack-monitoring:setup again
```

## Step 3. Language setting

AskUserQuestion:
- question: "🌐 알림 언어를 선택해주세요" (ko) / "🌐 Select notification language" (en)
- options:
  1. 한국어 (ko)
  2. English (en)

Note: This step determines which language is used for all subsequent wizard steps and all future monitoring output.

## Step 4. Suggested reply tone setting

Present language-specific tone options based on the language selected in Step 3.

**If language = ko:**

AskUserQuestion:
- question: "💬 추천 답변 말투를 선택해주세요"
- options:
  1. 존댓말 - 비즈니스 (기본) → "확인했습니다. 감사합니다!"
  2. 이모지 다정 → "확인했어요! 감사합니다 😊"
  3. 간결 프로 → "확인. 처리하겠습니다."
  4. MZ 스타일 → "ㅇㅋ 바로 확인할게요~"
  5. Slack 학습 - 내 최근 메시지에서 말투를 자동 학습

**If language = en:**

AskUserQuestion:
- question: "💬 Select suggested reply tone"
- options:
  1. Professional (default) → "Acknowledged. Thank you for flagging this."
  2. Friendly → "Got it, thanks! Will take a look 😊"
  3. Concise → "Noted. Will handle."
  4. Auto-learn - Learn tone from my recent Slack messages

Note: `mz` tone is only available for Korean users. If switching from `ko` to `en` with `tone=mz`, fall back to `formal`.

Auto-learn selected: Use Bash tool to fetch recent messages:
```bash
curl -s -H "Authorization: Bearer {token}" \
  "https://slack.com/api/search.messages?query=from%3A%40{user_id}%20-in%3Adm&count=50&sort=timestamp&sort_dir=desc"
```
Analyze tone patterns from the results and save to `tone_examples` in config (DM excluded, channel messages only).

## Step 5. Default monitoring interval

AskUserQuestion:
- question: "⏱️ 기본 모니터링 간격을 설정해주세요" (ko) / "⏱️ Set default monitoring interval" (en)
- options:
  1. 1min
  2. 5min
  3. 10min
  4. 15min (default)
  5. 30min
  6. 1h
  7. "직접 입력 (예: 3m, 45m, 2h)" (ko) / "Custom input (e.g.: 3m, 45m, 2h)" (en)

- Option 7 selected: AskUserQuestion with "원하는 간격을 입력해주세요 (예: 3m, 45m, 2h)" (ko) / "Enter desired interval (e.g.: 3m, 45m, 2h)" (en)

## Step 6. Summary style

AskUserQuestion:
- question: "📝 멘션 요약 스타일을 선택해주세요" (ko) / "📝 Select mention summary style" (en)
- options:

**If language = ko:**
  1. 간략 - 한 줄 요약 + 추천 답변
  2. 상세 (기본) - 스레드 배경/답변 정리/테이블 + 추천 답변
  3. 풀 컨텍스트 - 상세 + 원문 인용 포함

**If language = en:**
  1. Brief - One-line summary + suggested reply
  2. Detailed (default) - Thread background/response summary/table + suggested reply
  3. Full context - Detailed + original message quotes included

## Step 7. Auto-detect user groups

Use Bash tool to fetch user groups:
```bash
curl -s -H "Authorization: Bearer {token}" \
  "https://slack.com/api/usergroups.list?include_users=true"
```

Parse response: find all groups where `users` array contains `{user_id}`.

If groups found, present them via AskUserQuestion for confirmation.

**If language = ko:**
```
👥 내가 속한 Slack 그룹이 발견됐습니다:
1. @backend-team
2. @all-engineers
(없음 선택 시 건너뜀)
```
AskUserQuestion: "모니터링할 그룹을 선택해주세요 (쉼표로 구분, 없으면 Enter)" (ko) / "Select groups to monitor (comma-separated, Enter to skip)" (en)

- Save selected group handles as `group_mentions` array in config (e.g., `["backend-team", "all-engineers"]`)
- If no groups found or user skips: save `group_mentions: []`

## Step 8. Save config & confirm

Save all settings to `~/.claude/slack-monitoring/config.json` and display summary:

**If language = ko:**
```
✅ 설정 완료!

📡 Slack 연결: ✅ {user_name} ({workspace})
🌐 언어: 한국어
💬 말투: {tone}
⏱️ 간격: {interval}
📝 스타일: {style}
👥 모니터링 그룹: {group_mentions joined by ", " or "없음"}

변경하려면 /slack-monitoring:setup 을 다시 실행하세요.
```

**If language = en:**
```
✅ Setup complete!

📡 Slack connection: ✅ {user_name} ({workspace})
🌐 Language: English
💬 Tone: {tone}
⏱️ Interval: {interval}
📝 Style: {style}
👥 Monitored groups: {group_mentions joined by ", " or "None"}

To change settings, run /slack-monitoring:setup again.
```

## Config file format

`~/.claude/slack-monitoring/config.json`:
```json
{
  "slack_token": "xoxp-xxxxxxxxxxxx",
  "user_id": "UXXXXXXXXX",
  "user_name": "Your Name",
  "workspace": "your-workspace",
  "language": "ko",
  "tone": "formal",
  "tone_examples": [],
  "default_interval": "15m",
  "summary_style": "detailed",
  "group_mentions": ["backend-team"],
  "updated_at": "2026-03-25T00:00:00"
}
```

tone values: `formal`, `emoji`, `concise`, `mz` (ko only), `learned`
summary_style values: `brief`, `detailed`, `full`
