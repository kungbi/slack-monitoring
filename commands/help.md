Display Slack monitoring usage instructions.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.
Use the `tone` value to style suggested replies.

- Compact i18n: "한국어 텍스트" (ko) / "English text" (en)
- Block i18n: see `If language = ko:` / `If language = en:` sections below.

Display the following content to the user:

**If language = ko:**
```
📡 Slack Monitoring 사용법

/slack-monitoring:once          멘션 한번 체크
/slack-monitoring:start         모니터링 시작 (기본 15분 간격)
/slack-monitoring:start <간격>  원하는 간격으로 시작 (1m, 5m, 10m, 30m, 1h, 2h 등)
/slack-monitoring:list          미답변 멘션 목록 조회
/slack-monitoring:complete 2    #2 스레드 완료 처리
/slack-monitoring:complete all  전체 미답변 일괄 완료
/slack-monitoring:show 3        #3 스레드 상세 보기
/slack-monitoring:status        설정 및 오늘 멘션 현황 확인
/slack-monitoring:setup         초기 설정 (Slack 연결, 언어, 말투, 간격, 스타일)
/slack-monitoring:help          이 도움말 표시

기능:
• 채널 @태깅 자동 감지 + 스레드 단위 추적
• 스레드 전체 맥락 요약 + 추천 답변 제공
• 내가 답장하면 자동완료 (auto_completed)
• 날짜별 기록 보관 (~/.claude/slack-monitoring/)
```

**If language = en:**
```
📡 Slack Monitoring Usage

/slack-monitoring:once          Check mentions once
/slack-monitoring:start         Start monitoring (default 15min interval)
/slack-monitoring:start <interval>  Start with custom interval (1m, 5m, 10m, 30m, 1h, 2h, etc.)
/slack-monitoring:list          View pending mentions list
/slack-monitoring:complete 2    Mark thread #2 as complete
/slack-monitoring:complete all  Mark all pending as complete
/slack-monitoring:show 3        View thread #3 details
/slack-monitoring:status        Show config and today's mention stats
/slack-monitoring:setup         Initial setup (Slack connection, language, tone, interval, style)
/slack-monitoring:help          Show this help

Features:
• Auto-detect channel @mentions + thread-level tracking
• Full thread context summary + suggested replies
• Auto-complete when you reply (auto_completed)
• Daily records stored at ~/.claude/slack-monitoring/
```
