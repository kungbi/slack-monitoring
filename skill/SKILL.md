---
name: slack-monitoring
description: Slack 멘션 모니터링 - 스레드별 추적, 자동완료, 수동완료 지원. 날짜별 기록 보관.
triggers:
  - slack-monitoring
  - 슬랙 모니터링
  - 멘션 모니터링
argument-hint: "[15m|list|complete <id>|complete all|setup|help]"
---

# Slack Mention Monitoring

## Purpose

나한테 @태깅된 Slack 멘션을 스레드 단위로 추적하여, 날짜별로 기록하고, 자동/수동 완료 처리를 지원한다.

## When to Activate

- `/slack-monitoring` 실행 시
- `/slack-monitoring list` - 미완료 목록 조회
- `/slack-monitoring complete <id>` - 개별 완료
- `/slack-monitoring complete all` - 전체 완료
- `/slack-monitoring setup` - 초기 설정 / 설정 변경
- `/slack-monitoring help` - 사용법 안내

## Prerequisites

- Slack MCP Server가 Claude Code에 연결되어 있어야 함
- 첫 실행 시 `/slack-monitoring setup`으로 유저 ID 등 설정 필요
- 설정 파일: `~/.claude/slack-monitoring/config.json`

## Core Design

- **스레드 단위 추적**: 각 멘션을 ID 부여하여 개별 관리
- **날짜별 기록**: `~/.claude/slack-monitoring/YYYY-MM-DD.json`에 보관
- **자동완료**: 내가 스레드에 답장하면 자동으로 `auto_completed`
- **수동완료**: `/slack-monitoring complete <id>`로 직접 완료 처리
- **중복 알림 방지**: 이미 알린 멘션은 다시 DM 보내지 않음
- **설정 기반**: config.json에서 유저 ID, 언어, 말투 등 로드

## Workflow (매 체크마다)

1. `~/.claude/slack-monitoring/config.json`에서 `user_id` 로드 (없으면 setup 안내)
2. `~/.claude/slack-monitoring/YYYY-MM-DD.json` 로드 (없으면 초기화)
3. `slack_search_public_and_private`로 `<@{user_id}> on:오늘날짜` 검색 (include_context: false, 내가 보낸 메시지 제외)
4. 새 멘션 → `slack_read_thread`로 확인 → 답장 있으면 `auto_completed`, 없으면 `pending`
5. 기존 `pending` 스레드 → 다시 `slack_read_thread`로 확인 → 답장 생기면 `auto_completed`
6. **새로 발견된 pending만** DM 전송 (기존 pending은 재알림 안 함)
7. 데이터 저장

## Data File

`~/.claude/slack-monitoring/YYYY-MM-DD.json`:
```json
{
  "date": "YYYY-MM-DD",
  "threads": [
    {
      "id": 1,
      "channel_id": "C01234567",
      "channel_name": "#general",
      "thread_ts": "...",
      "message_ts": "...",
      "from": "홍길동",
      "from_id": "U01234567",
      "summary": "메시지 요약",
      "suggested_reply": "추천 답변",
      "permalink": "https://...",
      "status": "pending|auto_completed|completed",
      "first_seen": "ISO timestamp",
      "completed_at": null
    }
  ]
}
```

## Subcommands

- 인자 없음/시간값 → `/loop`으로 반복 등록 + 즉시 첫 실행 (기본: config의 default_interval 또는 15m)
- `list` → pending 스레드 테이블 표시
- `complete <id>` → 해당 스레드 completed 처리
- `complete all` → 모든 pending 일괄 completed 처리
- `setup` → 초기 설정 / 설정 변경 마법사
- `help` → 사용법 안내

## Notes

- 세션 살아있는 동안만 동작 (세션 종료 시 모니터링 중단)
- 날짜별 파일이므로 과거 기록 보존됨
- Slackbot 리마인더 등 봇 메시지는 자동완료 처리
