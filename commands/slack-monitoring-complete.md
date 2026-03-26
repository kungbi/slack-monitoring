$ARGUMENTS: <id|all> - 완료할 스레드 ID 또는 'all'로 전체 완료. 예: 1, 3, all

Slack 멘션 스레드를 완료 처리한다.

## 동작

### `<id>` (숫자) — 개별 완료
1. `~/.claude/slack-monitoring/YYYY-MM-DD.json` (오늘 날짜) 파일을 읽는다
2. 해당 ID의 스레드 status를 `completed`로 변경, `completed_at`에 현재 시각 기록
3. 저장 후 확인 메시지:
```
✅ #<id> 완료 처리됨 — <채널명> · <보낸사람> · <요약 앞부분>
```

### `all` — 전체 완료
1. `~/.claude/slack-monitoring/YYYY-MM-DD.json` (오늘 날짜) 파일을 읽는다
2. 모든 `pending` 스레드의 status를 `completed`로 변경, `completed_at`에 현재 시각 기록
3. 저장 후 확인 메시지:
```
✅ N건 전체 완료 처리됨
```

인자가 없으면 사용법 안내:
```
사용법: /slack-monitoring-complete <id> 또는 /slack-monitoring-complete all
```
