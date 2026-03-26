Run the Slack monitoring initial setup wizard.

Read config file `~/.claude/slack-monitoring/config.json`. If it doesn't exist, create a new one.
Proceed through each step in order. If a value is already set, show the current value and ask whether to change it.

**All selections MUST use the `AskUserQuestion` tool.**

## Step 1. Verify Slack connection
- Call `slack_search_users` with query `"a"` to verify connection
- If successful, ask the user for their Slack display name via AskUserQuestion: "What is your Slack display name? (used to find your user ID)"
- Search `slack_search_users` with the entered name, pick the matching result
- Save the found `user_id` and `user_name` and `workspace` to config
- Connection OK → Display: "Slack 연결됨 ({user_name} / {workspace})" (ko) / "Slack connected ({user_name} / {workspace})" (en)
- Connection failed → Show Slack MCP server connection guide:

**If language = ko:**
```
⚠️ Slack이 연결되어 있지 않습니다.
1. Claude Code 설정에서 Slack MCP 서버가 활성화되어 있는지 확인
2. Slack OAuth 인증이 완료되었는지 확인
3. /slack-monitoring-setup 을 다시 실행해주세요
```

**If language = en:**
```
⚠️ Slack is not connected.
1. Check that the Slack MCP server is enabled in Claude Code settings
2. Verify that Slack OAuth authentication is complete
3. Run /slack-monitoring-setup again
```

## Step 2. Language setting

AskUserQuestion:
- question: "🌐 알림 언어를 선택해주세요" (ko) / "🌐 Select notification language" (en)
- options:
  1. 한국어 (ko)
  2. English (en)

Note: This step determines which language is used for all subsequent wizard steps and all future monitoring output.

## Step 3. Suggested reply tone setting

Present language-specific tone options based on the language selected in Step 2.

**If language = ko:**

AskUserQuestion:
- question: "💬 추천 답변 말투를 선택해주세요"
- options:
  1. 존댓말 - 비즈니스 (기본) → "확인했습니다. 감사합니다!"
  2. 이모지 다정 → "확인했어요! 감사합니다 😊"
  3. 간결 프로 → "확인. 처리하겠습니다."
  4. Slack 학습 - 내 최근 메시지에서 말투를 자동 학습

**If language = en:**

AskUserQuestion:
- question: "💬 Select suggested reply tone"
- options:
  1. Professional (default) → "Acknowledged. Thank you for flagging this."
  2. Friendly → "Got it, thanks! Will take a look 😊"
  3. Concise → "Noted. Will handle."
  4. Casual → "On it! Will check this out~"
  5. Auto-learn - Learn tone from my recent Slack messages

Note: `engmix` tone is hidden for English users. If switching from `ko` to `en` with `tone=engmix`, fall back to `formal`.

- Auto-learn selected: Search `from:<@{user_id}> -in:dm` via `slack_search_public_and_private` for the most recent 50 messages, analyze tone patterns, and save to `tone_examples` in config (DM excluded, channel messages only)

## Step 4. Default monitoring interval

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

## Step 5. Summary style

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

## Step 6. Save config & confirm
Save all settings to `~/.claude/slack-monitoring/config.json` and display summary:

**If language = ko:**
```
✅ 설정 완료!

📡 Slack 연결: ✅ {user_name} ({workspace})
🌐 언어: 한국어
💬 말투: 존댓말
⏱️ 간격: 15분
📝 스타일: 상세

변경하려면 /slack-monitoring:setup 을 다시 실행하세요.
```

**If language = en:**
```
✅ Setup complete!

📡 Slack connection: ✅ {user_name} ({workspace})
🌐 Language: English
💬 Tone: Professional
⏱️ Interval: 15min
📝 Style: Detailed

To change settings, run /slack-monitoring:setup again.
```

## Config file format

`~/.claude/slack-monitoring/config.json`:
```json
{
  "user_id": "UXXXXXXXXX",
  "user_name": "Your Name",
  "workspace": "your-workspace",
  "language": "ko",
  "tone": "formal",
  "tone_examples": [],
  "default_interval": "15m",
  "summary_style": "detailed",
  "updated_at": "2026-03-24T11:00:00"
}
```

tone values: `formal`, `emoji`, `concise`, `mz` (ko only), `learned`
summary_style values: `brief`, `detailed`, `full`
