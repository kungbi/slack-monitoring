# Slack Monitoring — 백로그

> 마지막 업데이트: 2026-03-27
> 대상 파일: `scripts/monitor.js` (299줄, Node.js, zero dependencies)

---

## 우선순위 기준

| 레벨 | 정의 |
|------|------|
| **P0 Critical** | 데이터 유실 또는 프로세스 불능 상태 유발 |
| **P1 High** | 잘못된 동작 또는 누적되는 데이터 문제 |
| **P2 Medium** | 엣지 케이스 및 코드 견고성 |
| **P3 Low** | 개선 사항 및 확장 기능 |

| 카테고리 | 설명 |
|----------|------|
| 안정성 | 크래시, 무한 루프, 데이터 유실 관련 |
| 기능 | 동작 정확성 및 새로운 기능 |
| 코드품질 | 방어 코드, 스키마 검증, 구조 개선 |
| UX | 출력 형식, 로케일, 사용성 |

---

## P0 — Critical

| ID | 제목 | 카테고리 | 노력 |
|----|------|----------|------|
| BL-001 | PID 파일 stale 문제 | 안정성 | S |
| BL-002 | 연속 실패 시 무한 침묵 | 안정성 | S |

### BL-001 — PID 파일 stale 문제

- **카테고리**: 안정성
- **영향 파일**: `scripts/monitor.js:257-269`
- **노력**: S

**문제**
프로세스가 비정상 종료되면 PID 파일이 삭제되지 않고 남는다. 이후 재시작 시 "이미 실행 중" 오류가 발생하며 모니터링을 시작할 수 없게 된다.

**해결 방안**
PID 파일을 읽은 뒤 `process.kill(pid, 0)`으로 해당 PID가 실제로 살아있는지 검증한다. 프로세스가 없으면 stale PID 파일로 간주하고 제거 후 정상 시작한다.

```js
// 변경 예시
try {
  process.kill(existingPid, 0); // 살아있으면 throw 없음
  throw new Error(`Already running (PID ${existingPid})`);
} catch (e) {
  if (e.code === 'ESRCH') {
    // stale PID 파일 — 삭제 후 계속 진행
    fs.unlinkSync(PID_FILE);
  } else {
    throw e;
  }
}
```

---

### BL-002 — 연속 실패 시 무한 침묵

- **카테고리**: 안정성
- **영향 파일**: `scripts/monitor.js:279-290`
- **노력**: S

**문제**
`check()` 함수가 실패해도 `console.error`만 출력하고 루프를 계속 돈다. 장시간 장애 상황에서 사용자가 모니터링이 멈춘 사실을 인지할 수 없다.

**해결 방안**
연속 실패 카운터를 두어 N회(예: 5회) 이상 연속 실패 시 경고 메시지를 출력하거나 프로세스를 자동 재시작한다.

```js
let consecutiveFailures = 0;
const MAX_FAILURES = 5;

// check() 실패 시
consecutiveFailures++;
if (consecutiveFailures >= MAX_FAILURES) {
  console.error(`[WARN] ${MAX_FAILURES}회 연속 실패. 프로세스를 재시작합니다.`);
  process.exit(1); // 외부 프로세스 매니저가 재시작
}
```

---

## P1 — High

| ID | 제목 | 카테고리 | 노력 |
|----|------|----------|------|
| BL-003 | 자정 근처 멘션 유실 | 안정성 | S |
| BL-004 | thread_ts 기반 중복 감지로 전환 | 기능 | M |
| BL-005 | thread_text 무제한 저장 | 안정성 | S |
| BL-006 | interval 동적 갱신 불가 | 기능 | S |

### BL-003 — 자정 근처 멘션 유실

- **카테고리**: 안정성
- **영향 파일**: `scripts/monitor.js:84`
- **노력**: S

**문제**
Slack 검색 쿼리에 `on:today`를 사용 중인데, 이 값은 Slack 서버의 타임존 기준으로 해석된다. 사용자의 로컬 시간과 Slack 서버 타임존이 다를 경우 자정 전후 멘션이 누락될 수 있다.

**해결 방안**
`on:today` 대신 `after:YYYY-MM-DD` 형식으로 변경해 날짜를 명시적으로 지정한다. 로컬 시간 기준으로 날짜를 계산하여 쿼리에 삽입한다.

```js
// 변경 전
`in:${channel} on:today @${username}`

// 변경 후
const today = new Date().toISOString().slice(0, 10); // "2026-03-27"
`in:${channel} after:${today} @${username}`
```

---

### BL-004 — thread_ts 기반 중복 감지로 전환

- **카테고리**: 기능
- **영향 파일**: `scripts/monitor.js:184`
- **노력**: M

**문제**
현재 `message_ts`만으로 중복 체크를 하고 있어, 같은 스레드에서 여러 멘션이 오면 첫 번째 메시지만 추적된다. 스레드 내 후속 멘션이 유실된다.

**해결 방안**
`thread_ts`를 기준으로 중복 체크 로직을 변경하고, 동일 스레드에서 발생한 멘션은 병합하여 하나의 스레드 단위로 관리한다. 기존 `seenIds` Set을 `seenThreads` Map으로 교체한다.

---

### BL-005 — thread_text 무제한 저장

- **카테고리**: 안정성
- **영향 파일**: `scripts/monitor.js:217`
- **노력**: S

**문제**
`extractThreadText()`에 길이 제한이 없다. 수백 개의 메시지로 구성된 긴 스레드가 있으면 일별 JSON 파일 크기가 급격히 커진다.

**해결 방안**
최근 N개 메시지만 저장하거나 최대 문자 수를 제한한다.

```js
const MAX_THREAD_MESSAGES = 20;
const MAX_THREAD_CHARS = 2000;

messages.slice(-MAX_THREAD_MESSAGES)
  .map(m => m.text)
  .join('\n')
  .slice(0, MAX_THREAD_CHARS);
```

---

### BL-006 — interval 동적 갱신 불가

- **카테고리**: 기능
- **영향 파일**: `scripts/monitor.js:291`
- **노력**: S

**문제**
`intervalMs`가 프로세스 시작 시 한 번만 읽혀 고정된다. 설정 파일에서 interval을 변경해도 프로세스를 재시작하지 않으면 적용되지 않는다.

**해결 방안**
`loop()` 함수 내에서 매 사이클마다 config를 다시 읽어 interval을 재계산한다.

```js
async function loop() {
  await check();
  const currentConfig = loadConfig(); // 매 사이클 재로드
  setTimeout(loop, currentConfig.intervalMs);
}
```

---

## P2 — Medium

| ID | 제목 | 카테고리 | 노력 |
|----|------|----------|------|
| BL-007 | locale 하드코딩 | UX | S |
| BL-008 | 채널 타입 방어 코드 정리 | 코드품질 | S |
| BL-009 | 날짜 경계 스레드 응답시간 추적 | 기능 | M |
| BL-010 | Slack API 응답 검증 부재 | 코드품질 | M |

### BL-007 — locale 하드코딩

- **카테고리**: UX
- **영향 파일**: `scripts/monitor.js:144`
- **노력**: S

**문제**
`toLocaleTimeString('ko-KR')`이 하드코딩되어 있어 `config.language`를 `'en'`으로 설정해도 시간 포맷이 항상 한국식으로 표시된다.

**해결 방안**
`config.language` 값에 따라 locale을 동적으로 적용한다.

```js
const locale = config.language === 'en' ? 'en-US' : 'ko-KR';
new Date(ts * 1000).toLocaleTimeString(locale);
```

---

### BL-008 — 채널 타입 방어 코드 정리

- **카테고리**: 코드품질
- **영향 파일**: `scripts/monitor.js:194-195`
- **노력**: S

**문제**
`mention.channel`을 `string`과 `object` 두 가지 타입 모두 처리하는 방어 코드가 있다. `search.messages` API는 항상 object를 반환하므로 과도한 방어 코드가 실제 버그(예: API 응답 구조 변경)를 숨길 수 있다.

**해결 방안**
API 응답 스키마에 맞게 object 타입만 처리하도록 정리하고, 예상 외 형태가 들어오면 명시적으로 에러를 발생시킨다.

---

### BL-009 — 날짜 경계 스레드 응답시간 추적

- **카테고리**: 기능
- **노력**: M

**문제**
어제 받은 멘션에 오늘 답장이 달린 경우, 일별 JSON 파일이 분리되어 있어 cross-day 스레드의 응답시간을 계산할 수 없다. `digest` 명령에서 정확한 응답 통계를 낼 수 없다.

**해결 방안**
미응답(pending) 스레드 목록을 별도 파일(`pending-threads.json`)로 관리하고, 새 멘션 처리 시 이전 날짜 파일도 스캔하여 응답 여부를 확인한다.

---

### BL-010 — Slack API 응답 검증 부재

- **카테고리**: 코드품질
- **영향 파일**: `scripts/monitor.js:192-237`
- **노력**: M

**문제**
API 응답 구조를 검증하지 않고 바로 필드에 접근한다. Slack API가 변경되거나 오류 응답을 반환할 경우 `undefined` 접근으로 크래시가 발생할 수 있다.

**해결 방안**
필수 필드 존재 여부를 체크한 후 처리하고, 구조가 예상과 다르면 명시적 에러 메시지를 남기고 해당 항목을 건너뛴다.

```js
if (!message?.ts || !message?.text) {
  console.warn('[WARN] 예상치 못한 API 응답 구조:', JSON.stringify(message));
  continue;
}
```

---

## P3 — Low

| ID | 제목 | 카테고리 | 노력 |
|----|------|----------|------|
| BL-011 | 채널/발신자 필터링 | 기능 | M |
| BL-012 | 멘션 히스토리 내보내기 | 기능 | M |
| BL-013 | 디버그 모드 | UX | S |
| BL-014 | 멀티 워크스페이스 지원 | 기능 | L |

### BL-011 — 채널/발신자 필터링

- **카테고리**: 기능
- **노력**: M

**문제**
모든 채널, 모든 발신자의 멘션을 동일하게 처리한다. 특정 채널이나 특정 사용자의 멘션만 모니터링하거나 제외하는 옵션이 없다.

**해결 방안**
config에 필터 옵션을 추가한다.

```json
{
  "include_channels": ["#important", "#alerts"],
  "exclude_channels": ["#random"],
  "exclude_users": ["U_BOT_ID"]
}
```

---

### BL-012 — 멘션 히스토리 내보내기

- **카테고리**: 기능
- **노력**: M

**문제**
데이터가 일별 JSON 파일로 분산 저장되어 있어 전체 히스토리를 한 번에 조회하거나 외부 도구로 분석하기 어렵다.

**해결 방안**
`export` 커맨드를 추가해 지정 기간의 데이터를 CSV 또는 통합 JSON으로 내보낼 수 있도록 한다.

```bash
claude mention-export --from 2026-03-01 --to 2026-03-27 --format csv
```

---

### BL-013 — 디버그 모드

- **카테고리**: UX
- **노력**: S

**문제**
모든 로그가 단순 `console.log`/`console.error`로만 출력된다. 트러블슈팅 시 API 호출 내용, 응답 원문 등 상세 정보를 볼 방법이 없다.

**해결 방안**
`--debug` 플래그를 추가해 활성화 시 API 요청/응답, 파싱 결과 등 상세 로그를 출력한다. 프로덕션 실행 시에는 노이즈 없이 동작한다.

```bash
claude mention-monitor --debug
```

---

### BL-014 — 멀티 워크스페이스 지원

- **카테고리**: 기능
- **노력**: L

**문제**
단일 Slack 워크스페이스만 지원한다. 여러 조직에 속한 사용자는 별도 인스턴스를 띄워야 한다.

**해결 방안**
config에 `workspaces` 배열을 추가하고 워크스페이스별 토큰과 설정을 관리한다. 모니터링 루프를 워크스페이스 단위로 병렬 실행한다.

```json
{
  "workspaces": [
    { "name": "company-a", "token": "xoxp-..." },
    { "name": "company-b", "token": "xoxp-..." }
  ]
}
```

---

## 요약

| 우선순위 | 항목 수 | 총 노력 |
|----------|---------|---------|
| P0 Critical | 2 | S + S |
| P1 High | 4 | S + M + S + S |
| P2 Medium | 4 | S + S + M + M |
| P3 Low | 4 | M + M + S + L |
| **합계** | **14** | — |

> 노력 기준: **S** = 1-2시간, **M** = 반나절~하루, **L** = 2일 이상
