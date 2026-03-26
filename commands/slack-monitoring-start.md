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
If not found, show:
- ko: "⚠️ monitor.js를 찾을 수 없습니다. 재설치: git clone https://github.com/kungbi/slack-monitoring.git && cd slack-monitoring && ./install.sh"
- en: "⚠️ monitor.js not found. Reinstall: git clone https://github.com/kungbi/slack-monitoring.git && cd slack-monitoring && ./install.sh"

3. Start the daemon using the Bash tool:
```bash
node ~/.claude/slack-monitoring/scripts/monitor.js $ARGUMENTS &
```
The script runs in background, prints progress to terminal, and saves PID to `~/.claude/slack-monitoring/monitor.pid`.

The monitor.js script:
- Polls Slack API every {interval} for new @mentions
- Calls Anthropic API (Haiku) ONLY when new mentions are found — zero token cost on quiet cycles
- Saves results to `~/.claude/slack-monitoring/YYYY-MM-DD.json`
- Prints terminal alerts for new mentions
