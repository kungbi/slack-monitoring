Run the Slack mention check once and display results.
For recurring monitoring, use `/slack-monitoring:start` instead.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.

## Behavior

Run the monitor script once using the Bash tool:
```bash
node ~/.claude/slack-monitoring/scripts/monitor.js --once
```

The script checks for new mentions, saves results, and prints a terminal summary — then exits.

When presenting the results to the user, read `~/.claude/slack-monitoring/YYYY-MM-DD.json` and **always include the `permalink` field as a clickable link for each thread** so the user can jump directly to the Slack thread.

**Summary model**: Read `model` from config (default: `haiku`).
- If `haiku` or `sonnet`: use the **Agent tool** with `model` parameter set to the configured value. Pass thread data, `language`, `tone`, and `summary_style` to the subagent for summarization.
- If `session`: generate the summary directly in the current session (no subagent).
