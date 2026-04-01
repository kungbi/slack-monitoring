$ARGUMENTS: [interval] - Monitoring interval. e.g.: 1m, 5m, 10m, 15m(default), 30m, 1h

Start recurring Slack mention monitoring using CronCreate.
For a single check, use `/slack-monitoring:once` instead.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.

## Behavior

1. Check if monitoring is already running:
   - Call `CronList` to check for existing slack-monitoring cron jobs
   - If a job with prompt containing "/slack-monitoring:once" exists, show:
     - ko: "⚠️ 모니터링이 이미 실행 중입니다. 중지하려면 /slack-monitoring:stop"
     - en: "⚠️ Monitoring is already running. To stop: /slack-monitoring:stop"
   - Then exit.

2. Convert interval to cron expression:
   - 1m → "* * * * *"
   - 5m → "*/5 * * * *"
   - 10m → "*/10 * * * *"
   - 15m (default) → "*/15 * * * *"
   - 30m → "*/30 * * * *"
   - 1h → "7 * * * *"
   - If no interval provided, use `default_interval` from config (default: 15m)

3. Create the cron job:
   - Use `CronCreate` with:
     - cron: the converted expression
     - durable: true
     - prompt: "/slack-monitoring:once"
   - Save the returned job ID to `~/.claude/slack-monitoring/config.json` as `cron_job_id` field

4. Run first check immediately:
   - Execute `/slack-monitoring:once` right after creating the cron

5. Show confirmation:
   - ko: "📡 Slack 모니터링 시작 (간격: {interval})\n중지하려면 /slack-monitoring:stop 을 입력하세요.\n⏰ 크론 등록됨 (durable: 세션 재시작 후에도 유지, 7일 후 만료)"
   - en: "📡 Slack monitoring started (interval: {interval})\nTo stop, type: /slack-monitoring:stop\n⏰ Cron registered (durable: persists across restarts, expires after 7 days)"

## Notes
- CronCreate with durable: true persists across session restarts
- Cron jobs auto-expire after 7 days
- Each cron fire executes /slack-monitoring:once which runs monitor.js --once and provides AI summary
