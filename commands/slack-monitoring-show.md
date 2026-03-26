$ARGUMENTS: <id> - 상세 보기할 스레드 ID. 예: 1, 3

Slack 멘션 스레드의 상세 정보를 표시한다.

## 동작

1. `~/.claude/slack-monitoring/YYYY-MM-DD.json` (오늘 날짜) 파일을 읽는다
2. 해당 ID의 스레드를 찾는다
3. `slack_read_thread`로 스레드 최신 상태를 다시 읽는다
4. 아래 포맷으로 상세 표시:

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

- status가 `pending`이면 추천 답변 포함
- status가 `completed`/`auto_completed`면 완료 시점과 방법 표시
- 스레드에 새 답장이 추가되었으면 summary를 업데이트하고 데이터 파일에 저장

인자가 없으면 사용법 안내:
```
사용법: /slack-monitoring-show <id>
💡 ID 확인: /slack-monitoring-list
```
