$ARGUMENTS: [interval] - 모니터링 간격. 예: 1m, 5m, 10m, 15m(기본), 30m, 1h

Slack 멘션 모니터링을 시작한다. /loop $ARGUMENTS (기본 15m) 간격으로 체크 워크플로우를 반복 실행한다.

---

## 체크 워크플로우 (매 실행마다)

### 1. 오늘 날짜 데이터 로드
- `~/.claude/slack-monitoring/YYYY-MM-DD.json` 파일을 Read로 읽는다
- 없으면 `{"date": "YYYY-MM-DD", "threads": []}` 로 초기화

### 2. 오늘 멘션 검색
아래 3개 쿼리를 각각 검색하여 결과를 합친다 (중복 message_ts 제거):
- `<@U09L7JLCRBN> on:오늘날짜` — 개인 태깅
- `backend_timespread on:오늘날짜` — @backend_timespread 그룹 태깅 (텍스트 검색)
- `team_timespread on:오늘날짜` — @team_timespread 그룹 태깅 (텍스트 검색)

공통 옵션: sort: timestamp, desc, include_context: false
결과에서:
- 내(U09L7JLCRBN)가 보낸 메시지는 제외
- GitHub 봇(U01UE6J1NER, U01UDJ2CFNF 등) 메시지는 제외 (코드리뷰 노이즈 방지)

### 3. 각 멘션 처리
각 검색 결과에 대해:
- `message_ts`가 이미 threads에 있으면:
  - status가 `completed` 또는 `auto_completed`면 → 스킵
  - status가 `pending`이면 → **자동완료 체크** (아래 4번)
- 새 멘션이면:
  - `slack_read_thread`로 스레드 전체를 읽는다
  - 스레드에 내(U09L7JLCRBN) 답장이 있으면 → status: `auto_completed`로 추가
  - 내 답장 없으면 → status: `pending`으로 추가, DM 대상에 포함
  - **summary 작성**: 스레드 전체 맥락을 포함한 상세 요약 (배경, 각 참여자 답변, 현재 상태)
  - **suggested_reply 작성**: 내가 할 수 있는 다음 액션 추천 (답장 내용 제안, 확인만 하면 되는지 등)

### 4. 기존 pending 스레드 자동완료 체크
기존 `pending` 스레드 각각에 대해:
- `slack_read_thread`로 스레드를 다시 확인
- 내(U09L7JLCRBN) 답장이 새로 있으면 → status를 `auto_completed`로 변경
- 봇(Slackbot 등)만 있는 리마인더 → `auto_completed`로 변경

### 5. DM 전송
**새로 발견된** `pending` 멘션이 있을 때만 DM 전송 (기존 pending은 다시 알리지 않음).
없으면 조용히 패스.

포맷:
```
:bell: *새 Slack 멘션* (HH:MM 기준)

*#채널명*
- [#1] @발신자: 메시지 요약... [링크]

:white_check_mark: *자동완료* (N건) - 이미 답장됨
---
:hourglass_flowing_sand: *미답변* (N건) - `/slack-monitoring-list`로 확인
```

### 6. 데이터 저장
- 업데이트된 threads를 `~/.claude/slack-monitoring/YYYY-MM-DD.json`에 저장

---

## 데이터 파일 형식

`~/.claude/slack-monitoring/YYYY-MM-DD.json`:
```json
{
  "date": "YYYY-MM-DD",
  "threads": [
    {
      "id": 1,
      "channel_id": "CMXL9DAKE",
      "channel_name": "#timespread",
      "thread_ts": "1774253132.128239",
      "message_ts": "1774255578.683349",
      "from": "이준원",
      "from_id": "U08GFG1B36F",
      "summary": "안드 API 호출 시점 상세 답변",
      "permalink": "https://...",
      "status": "pending",
      "first_seen": "2026-03-24T09:15:00",
      "completed_at": null
    }
  ]
}
```

---

## 설정 적용
- 체크 워크플로우 실행 시 `~/.claude/slack-monitoring/config.json`이 있으면 해당 설정을 우선 적용
- config가 없으면 기본값 사용 (ko, formal, 15m, detailed)

status 값:
- `pending`: 미답변, 대응 필요
- `auto_completed`: 내가 스레드에 답장해서 자동 완료
- `completed`: 사용자가 수동으로 완료 처리
