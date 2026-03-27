$ARGUMENTS: [interval] - Monitoring interval. e.g.: 1m, 5m, 10m, 15m(default), 30m, 1h

Start recurring Slack mention monitoring using the background Node.js daemon.
For a single check, use `/slack-monitoring:once` instead.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.

## Behavior

1. Check if monitor is already running:
```bash
cat ~/.claude/slack-monitoring/monitor.pid 2>/dev/null
```
If PID exists and process is alive (`kill -0 <PID> 2>/dev/null`), show:
- ko: "⚠️ 모니터링이 이미 실행 중입니다. 중지하려면 /slack-monitoring:stop"
- en: "⚠️ Monitoring is already running. To stop: /slack-monitoring:stop"
Then exit.

2. Find the monitor script:
```bash
ls ~/.claude/slack-monitoring/scripts/monitor.js 2>/dev/null
```
If not found, auto-install:
- ko: "⚙️ monitor.js가 없습니다. 자동 설치 중..."
- en: "⚙️ monitor.js not found. Auto-installing..."

Then run:
```bash
git clone https://github.com/kungbi/slack-monitoring.git /tmp/slack-monitoring-install && cp -r /tmp/slack-monitoring-install/scripts ~/.claude/slack-monitoring/scripts && rm -rf /tmp/slack-monitoring-install
```

If install succeeds:
- ko: "✅ monitor.js 설치 완료!"
- en: "✅ monitor.js installed!"

If install fails:
- ko: "⚠️ 자동 설치 실패. 수동 설치: git clone https://github.com/kungbi/slack-monitoring.git && cp -r slack-monitoring/scripts ~/.claude/slack-monitoring/scripts"
- en: "⚠️ Auto-install failed. Manual install: git clone https://github.com/kungbi/slack-monitoring.git && cp -r slack-monitoring/scripts ~/.claude/slack-monitoring/scripts"
Then exit.

3. Start the daemon using the Bash tool:
```bash
node ~/.claude/slack-monitoring/scripts/monitor.js $ARGUMENTS &
```
The script runs in background, prints progress to terminal, and saves PID to `~/.claude/slack-monitoring/monitor.pid`.

The monitor.js script:
- Polls Slack API every {interval} for new @mentions
- Saves results to `~/.claude/slack-monitoring/YYYY-MM-DD.json`
- Prints terminal alerts for new mentions

4. When the daemon prints new mention alerts, read `~/.claude/slack-monitoring/YYYY-MM-DD.json` and present a summary to the user. **Always include the `permalink` field as a clickable link for each thread** so the user can jump directly to the Slack thread.

5. **Summary model**: Read `model` from config (default: `haiku`).
   - If `haiku` or `sonnet`: use the **Agent tool** with `model` parameter set to the configured value. Pass thread data, `language`, `tone`, and `summary_style` to the subagent for summarization.
   - If `session`: generate the summary directly in the current session (no subagent).
