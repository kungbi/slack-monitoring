$ARGUMENTS: [subcommand] - 서브커맨드. 없으면 모니터링 시작. 예: 10m, 1h, list, complete 1, complete all, digest, setup, help

Slack 멘션 모니터링 시스템. 서브커맨드에 따라 동작이 달라진다.

## 설정 로드

모든 서브커맨드 실행 전에 `~/.claude/slack-monitoring/config.json`을 읽는다.
- 설정 파일이 없고 서브커맨드가 `setup`이 아니면 → "먼저 `/slack-monitoring setup`을 실행해주세요." 안내 후 종료
- 설정에서 `user_id`를 가져와 이후 모든 검색/필터에 사용
- 설정에서 `channels` 객체를 가져와 필터링에 사용

## 서브커맨드 분기

- 인자 없음 또는 시간값(예: 15m, 1h) → **모니터링 시작**
- `list` → **현재 미완료 스레드 목록 표시**
- `complete <id>` → **해당 ID 스레드 완료 처리**
- `complete all` → **모든 미완료 스레드 일괄 완료**
- `digest` → **위클리 다이제스트 표시**
- `help` → **사용법 안내 표시**
- `setup` → **초기 설정 / 설정 변경 마법사**

---

## A. 모니터링 시작 (인자 없음 또는 시간값)

/loop $ARGUMENTS 아래 체크 워크플로우 실행 (기본: config의 default_interval 또는 15m)

### 체크 워크플로우 (매 실행마다)

#### 1. 오늘 날짜 데이터 로드
- `~/.claude/slack-monitoring/YYYY-MM-DD.json` 파일을 Read로 읽는다
- 없으면 `{"date": "YYYY-MM-DD", "threads": []}` 로 초기화

#### 2. 오늘 멘션 검색
- `slack_search_public_and_private`로 `<@{user_id}> on:오늘날짜(YYYY-MM-DD)` 검색
- sort: timestamp, desc
- include_context: false
- 결과에서 내({user_id})가 보낸 메시지는 제외

#### 3. 채널 필터링
- config의 `channels.ignore_channels` 목록에 있는 채널 멘션은 스킵
- config의 `channels.priority_channels` 또는 `channels.vip_senders`에 해당하면 `priority: "high"` 태깅
- 필터링 설정이 없으면 모든 채널 처리 (기본 동작)

#### 4. 각 멘션 처리
각 검색 결과에 대해:
- `message_ts`가 이미 threads에 있으면:
  - status가 `completed` 또는 `auto_completed`면 → 스킵
  - status가 `pending`이면 → **자동완료 체크** (아래 5번)
- 새 멘션이면:
  - `slack_read_thread`로 스레드 전체를 읽는다
  - 스레드에 내({user_id}) 답장이 있으면 → status: `auto_completed`로 추가
  - 내 답장 없으면 → status: `pending`으로 추가, 알림 대상에 포함
  - **priority 결정**: priority_channels/vip_senders 해당 여부에 따라 `high` 또는 `normal`
  - **summary 작성**: 스레드 전체 맥락을 포함한 상세 요약 (배경, 각 참여자 답변, 현재 상태)
  - **suggested_reply 작성**: 내가 할 수 있는 다음 액션 추천 (답장 내용 제안, 확인만 하면 되는지 등)

#### 5. 기존 pending 스레드 자동완료 체크
기존 `pending` 스레드 각각에 대해:
- `slack_read_thread`로 스레드를 다시 확인
- 내({user_id}) 답장이 새로 있으면 → status를 `auto_completed`로 변경
- 봇(Slackbot 등)만 있는 리마인더 → `auto_completed`로 변경

#### 6. 알림 전송
**새로 발견된** `pending` 멘션이 있을 때만 사용자에게 알림 전송 (기존 pending은 다시 알리지 않음).
없으면 조용히 패스.

포맷 (우선순위 높은 멘션이 있을 경우 상단에 별도 섹션):
```
:bell: *새 Slack 멘션* (HH:MM 기준)

:rotating_light: *우선순위 높음*
*#priority-channel*
- [#1] @VIP발신자: 긴급 확인 요청... [링크]

*#채널명*
- [#2] @발신자: 메시지 요약... [링크]

:white_check_mark: *자동완료* (N건) - 이미 답장됨
---
:hourglass_flowing_sand: *미답변* (N건) - `/slack-monitoring list`로 확인
```

#### 7. 데이터 저장
- 업데이트된 threads를 `~/.claude/slack-monitoring/YYYY-MM-DD.json`에 저장

---

## B. list - 미완료 스레드 목록

1. 오늘 데이터 파일 읽기
2. `pending` 상태인 스레드만 필터링
3. 우선순위 높은 것을 상단에 배치하여 테이블로 표시:

```
📋 미답변 멘션 (N건)

| ID | 우선순위 | 채널 | 보낸 사람 | 시간 | 요약 |
|----|---------|------|----------|------|------|
| #1 | 🔴 | #dev | VIP사람 | 10:30 | 긴급 배포 관련... |
| #2 | — | #general | 홍길동 | 17:46 | API 호출 시점 답변... |

💡 완료 처리: /slack-monitoring complete 1
💡 전체 완료: /slack-monitoring complete all
```

---

## C. complete <id> - 개별 완료

1. 오늘 데이터 파일 읽기
2. 해당 ID의 스레드 status를 `completed`로 변경
3. 저장 후 확인 메시지 출력

---

## D. complete all - 전체 완료

1. 오늘 데이터 파일 읽기
2. 모든 `pending` 스레드의 status를 `completed`로 변경
3. 저장 후 확인 메시지 출력

---

## E. digest - 위클리 다이제스트

최근 7일간의 데이터 파일을 모두 읽어서 통계를 생성한다.

### 워크플로우

1. 오늘부터 7일 전까지의 `~/.claude/slack-monitoring/YYYY-MM-DD.json` 파일을 순서대로 읽는다
2. 없는 날짜는 건너뛴다 (모니터링 안 한 날)
3. 전체 스레드를 집계하여 통계 계산

### 출력 포맷

```
📊 Weekly Digest (MM/DD ~ MM/DD)

📈 Overview
- 총 멘션: N건
- 응답 완료: N건 (XX%)
- 자동완료: N건 / 수동완료: N건
- 미응답: N건

⏱️ Response Time
- 평균 응답 시간: Xh Ym (first_seen → completed_at 기준)
- 가장 빠른 응답: Xm (#채널명)
- 가장 느린 응답: Xh (#채널명)

📢 Top Channels (멘션 많은 순)
| 채널 | 멘션 수 | 응답률 |
|------|---------|--------|
| #dev | 12 | 92% |
| #general | 8 | 100% |
| #random | 3 | 67% |

👥 Top Senders (멘션 많은 순)
| 보낸 사람 | 멘션 수 | 응답률 |
|----------|---------|--------|
| 홍길동 | 7 | 100% |
| 김철수 | 5 | 80% |

📅 Daily Breakdown
| 날짜 | 멘션 | 완료 | 미응답 |
|------|------|------|--------|
| 03/24 | 5 | 4 | 1 |
| 03/23 | 3 | 3 | 0 |
| ... | | | |

💡 /slack-monitoring list 로 현재 미답변 확인
```

### 응답 시간 계산
- `auto_completed` 또는 `completed` 스레드만 대상
- `first_seen`부터 `completed_at`까지의 시간차
- `completed_at`이 null인 completed 스레드는 제외

---

## F. setup - 초기 설정 마법사

설정 파일 `~/.claude/slack-monitoring/config.json`을 읽고, 없으면 새로 생성한다.
각 단계를 순서대로 진행하며, 이미 설정된 값이 있으면 현재값을 보여주고 변경 여부를 묻는다.

### Step 1. Slack 연결 확인
- `slack_search_users`로 현재 사용자를 검색하여 연결 상태 확인
- 연결 OK → "Slack 연결됨 (이름 / workspace)" 표시, user_id 자동 감지
- 연결 실패 → Slack MCP 서버 연결 가이드 안내:
  ```
  ⚠️ Slack이 연결되어 있지 않습니다.
  1. Claude Code 설정에서 Slack MCP 서버가 활성화되어 있는지 확인
  2. Slack OAuth 인증이 완료되었는지 확인
  3. /slack-monitoring setup 을 다시 실행해주세요
  ```

### Step 2. 언어 설정
사용자에게 선택지 제시:
```
🌐 알림 언어를 선택해주세요:
1. 한국어 (기본)
2. English
```

### Step 3. 추천 답변 말투 설정
```
💬 추천 답변 말투를 선택해주세요:
1. 존댓말 - 비즈니스 (기본) → "확인했습니다. 감사합니다!"
2. 반말 - 캐주얼 → "확인! 고마워~"
3. Slack 학습 - 내 최근 메시지에서 말투를 자동 학습
```
- 3번 선택 시: `slack_search_public_and_private`로 `from:<@{user_id}>`을 최근 20건 검색하여 말투 패턴 분석 후 config에 `tone_examples` 저장

### Step 4. 기본 모니터링 간격
```
⏱️ 기본 모니터링 간격을 설정해주세요:
1. 1분 (실시간에 가까움)
2. 5분
3. 10분
4. 15분 (기본)
5. 30분
6. 1시간
7. 직접 입력 (예: 3m, 45m, 2h)
```

### Step 5. 요약 스타일
```
📝 멘션 요약 스타일을 선택해주세요:
1. 간략 - 한 줄 요약 + 추천 답변
2. 상세 (기본) - 스레드 배경/답변 정리/테이블 + 추천 답변
3. 풀 컨텍스트 - 상세 + 원문 인용 포함
```

### Step 6. 채널 필터링 설정
```
🔇 채널 필터링을 설정하시겠습니까? (선택)
1. 건너뛰기 (모든 채널 모니터링)
2. 설정하기
```

2번 선택 시:
```
🚫 무시할 채널 (멘션 무시, 쉼표 구분):
예: #random, #fun, #bot-alerts

⭐ 우선순위 높은 채널 (상단 표시, 쉼표 구분):
예: #incidents, #deploy, #urgent

👑 VIP 발신자 (항상 우선순위 높음, 쉼표 구분):
예: @CTO, @팀장
```

- 채널명은 `slack_search_channels`로 검색하여 channel_id로 변환 후 저장
- 발신자는 `slack_search_users`로 검색하여 user_id로 변환 후 저장

### Step 7. 설정 저장 & 확인
모든 설정을 `~/.claude/slack-monitoring/config.json`에 저장하고 요약 표시:
```
✅ 설정 완료!

📡 Slack 연결: ✅ 이름 (workspace)
🌐 언어: 한국어
💬 말투: 존댓말
⏱️ 간격: 15분
📝 스타일: 상세
🔇 무시 채널: #random, #fun
⭐ 우선 채널: #incidents
👑 VIP: @CTO

변경하려면 /slack-monitoring setup 을 다시 실행하세요.
```

### 설정 파일 형식

`~/.claude/slack-monitoring/config.json`:
```json
{
  "user_id": "U01234567",
  "user_name": "홍길동",
  "workspace": "my-workspace",
  "language": "ko",
  "tone": "formal",
  "tone_examples": [],
  "default_interval": "15m",
  "summary_style": "detailed",
  "channels": {
    "ignore_channels": [
      { "id": "C01234567", "name": "#random" }
    ],
    "priority_channels": [
      { "id": "C07654321", "name": "#incidents" }
    ],
    "vip_senders": [
      { "id": "U09876543", "name": "CTO" }
    ]
  },
  "updated_at": "2026-03-24T11:00:00"
}
```

tone 값: `formal` (존댓말), `casual` (반말), `learned` (학습)
summary_style 값: `brief` (간략), `detailed` (상세), `full` (풀 컨텍스트)

### 설정 적용
- 체크 워크플로우 실행 시 config.json이 있으면 해당 설정을 우선 적용
- config가 없으면 setup 안내

---

## G. help - 사용법 안내

아래 내용을 그대로 사용자에게 표시:

```
📡 Slack Monitoring 사용법

/slack-monitoring              모니터링 시작 (기본 15분 간격)
/slack-monitoring <간격>       원하는 간격으로 시작 (1m, 5m, 10m, 30m, 1h, 2h 등 자유 설정)
/slack-monitoring list         미답변 멘션 목록 조회
/slack-monitoring complete 2   #2 스레드 완료 처리
/slack-monitoring complete all 전체 미답변 일괄 완료
/slack-monitoring digest       위클리 다이제스트 (최근 7일 통계)
/slack-monitoring setup        초기 설정 (Slack 연결, 언어, 말투, 간격, 스타일, 채널 필터)
/slack-monitoring help         이 도움말 표시

기능:
• 채널 @태깅 자동 감지 + 스레드 단위 추적
• 스레드 전체 맥락 요약 + 추천 답변 제공
• 내가 답장하면 자동완료 (auto_completed)
• 채널 필터링 + VIP 발신자 우선순위
• 위클리 다이제스트 (응답률, 채널/발신자 통계)
• 날짜별 기록 보관 (~/.claude/slack-monitoring/)
```

---

status 값:
- `pending`: 미답변, 대응 필요
- `auto_completed`: 내가 스레드에 답장해서 자동 완료
- `completed`: 사용자가 수동으로 완료 처리

priority 값:
- `high`: priority_channels 또는 vip_senders에 해당
- `normal`: 기본값
