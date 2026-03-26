Slack 모니터링 초기 설정 마법사를 실행한다.

설정 파일 `~/.claude/slack-monitoring/config.json`을 읽고, 없으면 새로 생성한다.
각 단계를 순서대로 진행하며, 이미 설정된 값이 있으면 현재값을 보여주고 변경 여부를 묻는다.

## Step 1. Slack 연결 확인
- `slack_search_users`로 내 유저 ID(U09L7JLCRBN)를 검색하여 연결 상태 확인
- 연결 OK → "Slack 연결됨 (신웅비 / linkareer workspace)" 표시
- 연결 실패 → Slack MCP 서버 연결 가이드 안내:
  ```
  ⚠️ Slack이 연결되어 있지 않습니다.
  1. Claude Code 설정에서 Slack MCP 서버가 활성화되어 있는지 확인
  2. Slack OAuth 인증이 완료되었는지 확인
  3. /slack-monitoring-setup 을 다시 실행해주세요
  ```

## Step 2. 언어 설정
```
🌐 알림 언어를 선택해주세요:
1. 한국어 (기본)
2. English
```

## Step 3. 추천 답변 말투 설정
```
💬 추천 답변 말투를 선택해주세요:
1. 존댓말 - 비즈니스 (기본) → "확인했습니다. 감사합니다!"
2. 반말 - 캐주얼 → "확인! 고마워~"
3. Slack 학습 - 내 최근 메시지에서 말투를 자동 학습
```
- 3번 선택 시: `slack_search_public_and_private`로 `from:<@U09L7JLCRBN>`을 최근 20건 검색하여 말투 패턴 분석 후 config에 `tone_examples` 저장

## Step 4. 기본 모니터링 간격
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

## Step 5. 요약 스타일
```
📝 멘션 요약 스타일을 선택해주세요:
1. 간략 - 한 줄 요약 + 추천 답변
2. 상세 (기본) - 스레드 배경/답변 정리/테이블 + 추천 답변
3. 풀 컨텍스트 - 상세 + 원문 인용 포함
```

## Step 6. 설정 저장 & 확인
모든 설정을 `~/.claude/slack-monitoring/config.json`에 저장하고 요약 표시:
```
✅ 설정 완료!

📡 Slack 연결: ✅ 신웅비 (linkareer)
🌐 언어: 한국어
💬 말투: 존댓말
⏱️ 간격: 15분
📝 스타일: 상세

변경하려면 /slack-monitoring-setup 을 다시 실행하세요.
```

## 설정 파일 형식

`~/.claude/slack-monitoring/config.json`:
```json
{
  "user_id": "U09L7JLCRBN",
  "user_name": "신웅비",
  "workspace": "linkareer",
  "language": "ko",
  "tone": "formal",
  "tone_examples": [],
  "default_interval": "15m",
  "summary_style": "detailed",
  "updated_at": "2026-03-24T11:00:00"
}
```

tone 값: `formal` (존댓말), `casual` (반말), `learned` (학습)
summary_style 값: `brief` (간략), `detailed` (상세), `full` (풀 컨텍스트)
