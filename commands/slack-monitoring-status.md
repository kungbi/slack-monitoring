Show current slack-monitoring configuration and today's mention statistics.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.

## Behavior

1. Read `~/.claude/slack-monitoring/config.json`
   - If not found, show "Not configured" and suggest running `/slack-monitoring:setup`

2. Read `~/.claude/slack-monitoring/YYYY-MM-DD.json` (today's date)
   - If not found, treat as no data yet (0 mentions today)

3. Count threads by status: `pending`, `auto_completed`, `completed`

4. Display status output:

**If language = ko:**
```
📡 slack-monitoring 상태

⚙️ 설정
- 언어: 한국어
- 말투: formal
- 기본 간격: 15m
- 요약 스타일: detailed
- 무시 채널: #random, #fun (2개)
- 우선 채널: #incidents (1개)
- VIP 발신자: CTO (1명)

📊 오늘 멘션 (YYYY-MM-DD)
- 전체: N건
- 미답변: N건 🔴
- 자동완료: N건
- 수동완료: N건

💡 모니터링 시작: /slack-monitoring:start
💡 미답변 확인: /slack-monitoring:list
```

**If language = en:**
```
📡 slack-monitoring Status

⚙️ Config
- Language: English
- Tone: formal
- Default interval: 15m
- Summary style: detailed
- Ignore channels: #random, #fun (2)
- Priority channels: #incidents (1)
- VIP senders: CTO (1)

📊 Today's Mentions (YYYY-MM-DD)
- Total: N
- Pending: N 🔴
- Auto-completed: N
- Completed: N

💡 Start monitoring: /slack-monitoring:start
💡 Check pending: /slack-monitoring:list
```

5. If config not found:

**If language = ko (or unknown):**
```
⚠️ 설정이 없습니다. 먼저 /slack-monitoring:setup 을 실행하세요.
```

**If language = en:**
```
⚠️ Not configured. Run /slack-monitoring:setup first.
```

## Notes
- If ignore_channels / priority_channels / vip_senders is empty, show "없음" (ko) / "None" (en)
- Pending count > 0: show 🔴, else show ✅
