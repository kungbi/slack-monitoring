Slack 모니터링 사용법을 표시한다.

아래 내용을 그대로 사용자에게 표시:

```
📡 Slack Monitoring 사용법

/slack-monitoring              모니터링 시작 (기본 15분 간격)
/slack-monitoring <간격>       원하는 간격으로 시작 (1m, 5m, 10m, 30m, 1h, 2h 등)
/slack-monitoring-list         미답변 멘션 목록 조회
/slack-monitoring-complete 2   #2 스레드 완료 처리
/slack-monitoring-complete all 전체 미답변 일괄 완료
/slack-monitoring-show 3       #3 스레드 상세 보기
/slack-monitoring-setup        초기 설정 (Slack 연결, 언어, 말투, 간격, 스타일)
/slack-monitoring-help         이 도움말 표시

기능:
• 채널 @태깅 자동 감지 + 스레드 단위 추적
• 스레드 전체 맥락 요약 + 추천 답변 제공
• 내가 답장하면 자동완료 (auto_completed)
• 날짜별 기록 보관 (~/.claude/slack-monitoring/)
```
