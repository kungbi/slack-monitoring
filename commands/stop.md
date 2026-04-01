Stop the Slack mention monitoring cron job.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.

## Behavior

1. Check for active monitoring:
   - Call `CronList` to find cron jobs with prompt containing "/slack-monitoring:once"
   - Also read `cron_job_id` from `~/.claude/slack-monitoring/config.json` as fallback

2. If no cron job found:
   - ko: "ℹ️ 실행 중인 모니터링이 없습니다."
   - en: "ℹ️ No monitoring is running."

3. If cron job found, stop it:
   - Call `CronDelete` with the job ID
   - Remove `cron_job_id` field from `~/.claude/slack-monitoring/config.json`

4. Confirm:
   - ko: "⏹️ 모니터링이 중지됐습니다."
   - en: "⏹️ Monitoring stopped."
