미답변 Slack 멘션 목록을 표시한다.

## 동작

1. `~/.claude/slack-monitoring/YYYY-MM-DD.json` (오늘 날짜) 파일을 읽는다
2. `pending` 상태인 스레드만 필터링
3. 사용자에게 테이블로 표시:

```
📋 미답변 멘션 (N건)

| ID | 채널 | 보낸 사람 | 시간 | 요약 |
|----|------|----------|------|------|
| #1 | #timespread | 이준원 | 17:46 | API 호출 시점 답변... |
| #2 | #불편해요 | 조진수 | 13:57 | PR 확인 요청... |

💡 상세 보기: /slack-monitoring-show 1
💡 완료 처리: /slack-monitoring-complete 1
💡 전체 완료: /slack-monitoring-complete all
```

4. pending 스레드가 없으면:
```
✅ 미답변 멘션이 없습니다!
```
