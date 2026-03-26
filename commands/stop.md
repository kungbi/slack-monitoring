Stop the Slack monitoring daemon.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.

## Behavior

1. Read PID from `~/.claude/slack-monitoring/monitor.pid` using the Bash tool:
```bash
cat ~/.claude/slack-monitoring/monitor.pid 2>/dev/null
```

2. If PID not found:
- ko: "ℹ️ 실행 중인 모니터링이 없습니다."
- en: "ℹ️ No monitoring process is running."

3. If PID found, stop the process:
```bash
kill <PID> 2>/dev/null && rm -f ~/.claude/slack-monitoring/monitor.pid
```

4. Confirm:
- ko: "⏹️ 모니터링이 중지됐습니다."
- en: "⏹️ Monitoring stopped."
