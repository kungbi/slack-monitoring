Run the Slack mention check workflow once and display results.
For recurring monitoring, use `/slack-monitoring:start` instead.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.
Use the `tone` value to style suggested replies.

- Compact i18n: "한국어 텍스트" (ko) / "English text" (en)
- Block i18n: see `If language = ko:` / `If language = en:` sections below.

---

## Behavior

Execute the full check workflow defined in `slack-monitoring-start.md` exactly once — steps 1 through 6 — without starting a recurring loop.
