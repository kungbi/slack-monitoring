Display a weekly digest of Slack mention statistics for the past 7 days.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.

- Compact i18n: "한국어 텍스트" (ko) / "English text" (en)
- Block i18n: see `If language = ko:` / `If language = en:` sections below.

## Behavior

1. Determine the date range: today and the 6 days prior (7 days total). Format dates as `YYYY-MM-DD`.

2. Read all available data files for the past 7 days using the Bash tool:
   ```bash
   node -e "
   const fs = require('fs');
   const path = require('path');
   const base = path.join(process.env.HOME, '.claude/slack-monitoring');
   const today = new Date();
   const files = [];
   for (let i = 0; i < 7; i++) {
     const d = new Date(today);
     d.setDate(d.getDate() - i);
     const dateStr = d.toISOString().slice(0, 10);
     const file = path.join(base, dateStr + '.json');
     if (fs.existsSync(file)) files.push(file);
   }
   const allThreads = files.flatMap(f => {
     try { return JSON.parse(fs.readFileSync(f, 'utf8')).threads || []; }
     catch { return []; }
   });
   console.log(JSON.stringify({ files, allThreads }));
   "
   ```

3. If no data files are found or all files have empty thread arrays, display:
   - ko: "데이터가 없습니다. (최근 7일)"
   - en: "No data for the past 7 days."
   Then stop.

4. Aggregate statistics from the collected threads:

   **Counts:**
   - `total`: total thread count
   - `auto`: count of threads with `status === "auto_completed"`
   - `manual`: count of threads with `status === "completed"`
   - `responded`: `auto + manual`
   - `pending`: count of threads with `status === "pending"`
   - `rate`: `Math.round(responded / total * 100)`

   **Response time** (only for threads where both `first_seen` and `completed_at` are non-null):
   - Calculate duration in minutes: `(new Date(completed_at) - new Date(first_seen)) / 60000`
   - `avg_time`: average duration, formatted as human-readable (e.g. "1h 23m", "5m", "6h")
   - `min_time`: shortest duration + that thread's `channel_name` (strip `#` prefix if present, re-add for display)
   - `max_time`: longest duration + that thread's `channel_name`
   - If no completed threads exist, omit the response time section

   **Top channels** (group by `channel_name`, sort by mention count descending):
   - For each channel: mention count, responded count, response rate %

   **Top senders** (group by `from`, sort by mention count descending):
   - For each sender: mention count, responded count, response rate %

   **Human-readable duration format:**
   - < 60 min → "Xm"
   - >= 60 min → "Xh Ym" (omit "0m" only if exactly on the hour → "Xh")

5. Determine date range label: `start_date` = oldest date among loaded files, `end_date` = newest date.

6. Display formatted output:

**If language = ko:**
```
📊 위클리 다이제스트 ({start_date} ~ {end_date})

📈 개요
- 총 멘션: {total}건
- 응답 완료: {responded}건 ({rate}%)
- 자동완료: {auto}건 / 수동완료: {manual}건
- 미응답: {pending}건

⏱️ 응답 시간
- 평균: {avg_time}
- 최단: {min_time} (#{channel})
- 최장: {max_time} (#{channel})

📢 채널별 (멘션 많은 순)
| 채널 | 멘션 수 | 응답률 |
|------|---------|--------|
| #channel | N건 | X% |

👥 발신자별 (멘션 많은 순)
| 보낸 사람 | 멘션 수 | 응답률 |
|-----------|---------|--------|
| Name | N건 | X% |

💡 상세 보기: /slack-monitoring:show <id>
```

**If language = en:**
```
📊 Weekly Digest ({start_date} ~ {end_date})

📈 Overview
- Total mentions: {total}
- Responded: {responded} ({rate}%)
- Auto-completed: {auto} / Manual: {manual}
- Pending: {pending}

⏱️ Response Time
- Average: {avg_time}
- Fastest: {min_time} (#{channel})
- Slowest: {max_time} (#{channel})

📢 Top Channels
| Channel | Mentions | Response Rate |
|---------|----------|---------------|
| #channel | N | X% |

👥 Top Senders
| Sender | Mentions | Response Rate |
|--------|----------|---------------|
| Name | N | X% |

💡 Details: /slack-monitoring:show <id>
```

Notes:
- Omit the "⏱️ Response Time" section entirely if there are no completed threads with valid timestamps.
- Channel names in tables: ensure they are prefixed with `#`.
- Response rate per channel/sender: `Math.round((responded in group) / (total in group) * 100)`
