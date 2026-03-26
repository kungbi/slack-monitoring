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

The script checks for new mentions, generates summaries for any new pending mentions via Anthropic API (Haiku), saves results, and prints a terminal summary — then exits.
