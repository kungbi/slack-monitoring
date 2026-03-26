[English](README.md) | 한국어 | [中文](README.zh.md) | [日本語](README.ja.md) | [Español](README.es.md) | [Tiếng Việt](README.vi.md) | [Português](README.pt.md)

# slack-monitoring

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blueviolet)](https://docs.anthropic.com/en/docs/claude-code)
[![Slack MCP](https://img.shields.io/badge/Slack-MCP_Server-4A154B?logo=slack&logoColor=white)](https://modelcontextprotocol.io/integrations/slack)

**Claude Code를 위한 Slack 멘션 모니터링. @멘션을 다시는 놓치지 마세요.**

_Slack을 직접 확인하지 마세요. Claude가 대신 지켜봅니다._

[빠른 시작](#빠른-시작) • [명령어](#명령어) • [작동 방식](#작동-방식) • [설정](#설정)

---

## 빠른 시작

**Step 1: 설치**

```bash
# 방법 A: 플러그인 마켓플레이스 (추천)
/plugin marketplace add https://github.com/kungbi/slack-monitoring.git
/plugin install slack-monitoring

# 방법 B: 수동 설치
git clone https://github.com/kungbi/slack-monitoring.git
cd slack-monitoring && chmod +x install.sh && ./install.sh
```

**Step 2: 초기 설정**

```
/slack-monitoring:setup
```

**Step 3: 모니터링 시작**

```
/slack-monitoring
```

끝! Claude가 15분마다 멘션을 확인하고 요약을 보내줍니다.

---

## 왜 slack-monitoring인가?

- **제로 오버헤드** — 설정하고 잊어버리세요. 코딩하는 동안 백그라운드에서 동작
- **스레드 인식** — 메시지가 아닌 스레드 단위로 추적
- **자동완료** — 이미 답장했나요? 자동으로 완료 처리
- **맥락 요약** — "누군가 멘션했습니다"가 아닌, 스레드 전체 맥락 + 추천 답변
- **스마트 알림** — 새 멘션만 알림. 중복 노이즈 없음
- **채널 필터링** — 시끄러운 채널 무시, 중요 채널 우선, VIP 발신자 설정
- **위클리 다이제스트** — 응답률, 평균 응답시간, 채널/발신자별 통계
- **커스터마이징** — 언어, 말투, 간격, 요약 스타일 모두 설정 가능

---

## 명령어

| 명령어 | 설명 |
|--------|------|
| `/slack-monitoring:start` | 모니터링 시작 (기본 15분 간격) |
| `/slack-monitoring:start 5m` | 커스텀 간격으로 시작 |
| `/slack-monitoring:list` | 미답변 멘션 목록 |
| `/slack-monitoring:show 1` | #1 멘션 상세 보기 (요약, 추천 답변) |
| `/slack-monitoring:complete 2` | #2 멘션 완료 처리 |
| `/slack-monitoring:complete all` | 전체 미답변 일괄 완료 |
| `/slack-monitoring:digest` | 위클리 다이제스트 (최근 7일 통계) |
| `/slack-monitoring:setup` | 설정 마법사 |
| `/slack-monitoring:help` | 도움말 |
| `/slack-monitoring:status` | 설정 및 오늘 멘션 현황 확인 |
| `/slack-monitoring:stop` | 모니터링 중지 |

---

## 작동 방식

```
매 체크 주기마다:

  ┌─────────────────────────────────────────────────┐
  │  1. Slack에서 오늘의 @멘션 검색                    │
  │  2. 채널 필터 적용 (무시/우선순위)                   │
  │  3. 새 멘션마다:                                  │
  │     → 스레드 전체 읽기                             │
  │     → 이미 답장? → auto_completed                 │
  │     → 미답변? → pending + 알림                    │
  │     → VIP/우선 채널? → 🔴 우선순위 태깅             │
  │  4. 기존 pending 스레드 재확인                      │
  │     → 답장 발견? → auto_completed                 │
  │  5. 날짜별 기록 저장                               │
  └─────────────────────────────────────────────────┘
```

### 상태 유형

| 상태 | 설명 |
|------|------|
| `pending` | 미답변 — 대응 필요 |
| `auto_completed` | 스레드에 답장해서 자동 완료 |
| `completed` | `complete` 명령으로 수동 완료 |

### 우선순위

| 우선순위 | 조건 |
|---------|------|
| 🔴 `high` | VIP 발신자 또는 우선순위 채널의 멘션 |
| — `normal` | 그 외 |

### 알림 포맷

```
🔔 새 Slack 멘션 (14:30 기준)

🚨 우선순위 높음
#incidents
- [#1] @CTO: 배포 롤백 필요... [링크]

#general
- [#2] @동료: API 관련 질문... [링크]

✅ 자동완료 (2건) - 이미 답장됨
---
⏳ 미답변 (1건) - /slack-monitoring:list 로 확인
```

---

## 위클리 다이제스트

`/slack-monitoring:digest`로 최근 7일 요약:

```
📊 Weekly Digest (03/18 ~ 03/24)

📈 Overview
- 총 멘션: 28건
- 응답 완료: 25건 (89%)
- 자동완료: 18건 / 수동완료: 7건
- 미응답: 3건

⏱️ 응답 시간
- 평균: 1시간 23분
- 최단: 5분 (#incidents)
- 최장: 6시간 (#general)

📢 채널별 (멘션 많은 순)
| 채널       | 멘션 수 | 응답률 |
|-----------|---------|--------|
| #dev      | 12      | 92%    |
| #general  | 8       | 100%   |

👥 발신자별 (멘션 많은 순)
| 보낸 사람  | 멘션 수 | 응답률 |
|-----------|---------|--------|
| 홍길동     | 7       | 100%   |
| 김철수     | 5       | 80%    |
```

---

## 설정

`/slack-monitoring:setup`으로 설정:

| 항목 | 옵션 | 기본값 |
|------|------|--------|
| **Slack 연결** | 자동 감지 | — |
| **언어** | 한국어, English | 한국어 |
| **말투** | 존댓말, 반말, 내 메시지에서 학습 | 존댓말 |
| **간격** | 1m, 5m, 10m, 15m, 30m, 1h, 직접 입력 | 15m |
| **요약 스타일** | 간략, 상세, 풀 컨텍스트 | 상세 |
| **무시 채널** | 멘션 무시할 채널 (예: #random) | 없음 |
| **우선 채널** | 상단 표시할 채널 (예: #incidents) | 없음 |
| **VIP 발신자** | 항상 우선순위 높은 사람 | 없음 |

<details>
<summary>설정 파일 형식</summary>

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

</details>

---

## 데이터 저장

```
~/.claude/slack-monitoring/
├── config.json              # 사용자 설정
├── 2026-03-24.json          # 날짜별 멘션 기록
├── 2026-03-25.json
└── ...
```

<details>
<summary>데이터 형식</summary>

```json
{
  "date": "2026-03-24",
  "threads": [
    {
      "id": 1,
      "channel_id": "C01234567",
      "channel_name": "#general",
      "thread_ts": "1774253132.128239",
      "message_ts": "1774255578.683349",
      "from": "홍길동",
      "from_id": "U01234567",
      "summary": "스레드 맥락 요약",
      "suggested_reply": "추천 답변",
      "permalink": "https://slack.com/archives/...",
      "status": "pending",
      "priority": "normal",
      "first_seen": "2026-03-24T09:15:00",
      "completed_at": null
    }
  ]
}
```

</details>

---

## 수동 설치

```bash
# 스킬 파일
mkdir -p ~/.claude/skills/user/slack-monitoring
cp skill/SKILL.md ~/.claude/skills/user/slack-monitoring/SKILL.md

# 커맨드 파일
mkdir -p ~/.claude/commands
cp command/slack-monitoring.md ~/.claude/commands/slack-monitoring.md
```

## 삭제

```bash
rm -rf ~/.claude/skills/user/slack-monitoring
rm -f ~/.claude/commands/slack-monitoring.md
rm -rf ~/.claude/slack-monitoring  # 선택: 데이터도 삭제
```

---

## 요구사항

| 요구사항 | 설명 |
|---------|------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | CLI 도구 (활성 세션 필요) |
| Slack User Token | `xoxp-` 토큰 (필요한 스코프 포함, 설정 마법사가 안내) |

### 필요한 Slack 토큰 스코프

| 스코프 | 목적 |
|--------|------|
| `search:read` | 오늘의 @멘션 검색 |
| `channels:history` | 공개 채널 스레드 읽기 |
| `groups:history` | 비공개 채널 스레드 읽기 |
| `im:history` | DM 스레드 읽기 |
| `usergroups:read` | 내 Slack 그룹 자동 감지 |
| `users:read` | 내 프로필 확인 |

> **토큰 발급 방법:** Slack 앱을 [api.slack.com/apps](https://api.slack.com/apps)에서 생성하고, **OAuth & Permissions → User Token Scopes**에 위 스코프를 추가한 후 워크스페이스에 설치하세요. **User OAuth Token** (`xoxp-`로 시작)을 복사해 `/slack-monitoring:setup` 실행 시 붙여넣으세요.

> **참고:** 모니터링은 Claude Code 세션이 활성화된 동안만 실행됩니다. 세션이 종료되면 모니터링도 중단됩니다.

---

## Contributing

이슈와 PR 환영합니다. 버그 리포트나 기능 제안은 [Issues](https://github.com/kungbi/slack-monitoring/issues)에 남겨주세요.

## License

MIT — [LICENSE](LICENSE) 참조.

---

<div align="center">

**컨텍스트 스위칭은 그만. 코딩에 집중하세요.**

</div>
