Run the Slack mention check once and display results.
For recurring monitoring, use `/slack-monitoring:start` instead.

## Language & Tone

Read `~/.claude/slack-monitoring/config.json` at the start of execution.
Use the `language` value (`ko` or `en`) for all user-facing output below.

## Behavior

### Step 1: Run monitor script

Run the monitor script once using the Bash tool:
```bash
node ~/.claude/slack-monitoring/scripts/monitor.js --once
```

The script checks for new mentions, saves results, and prints a terminal summary — then exits.

### Step 2: AI Auto-Complete Triage

After the monitor script completes, read `~/.claude/slack-monitoring/YYYY-MM-DD.json` (today's date) and check for `pending` threads.

For each `pending` thread, analyze the `thread_text` field to determine if the user actually needs to take action. Classify each thread into one of these categories:

| Classification | Action | completion_reason |
|---|---|---|
| **Needs response** — question directed at user, action item, review request | Keep as `pending` | (no change) |
| **Already resolved** — someone else answered the question, issue was resolved by others in the thread | Auto-complete | `resolved_by_others` |
| **No action needed** — FYI mention, announcement, bot notification, thank-you message, casual mention in passing | Auto-complete | `no_action_needed` |

**Classification rules:**
- Read the FULL `thread_text` to understand context, not just the mention message
- If someone asked a question mentioning the user AND another person already provided a sufficient answer in the thread → `resolved_by_others`
- If the mention is informational (e.g., "FYI @user", "cc @user", sharing a link, announcement) → `no_action_needed`
- If the mention is a thank-you or acknowledgment (e.g., "thanks @user", "got it @user") → `no_action_needed`
- If the thread has continued and the conversation clearly moved past needing the user's input → `resolved_by_others`
- If the user is mentioned alongside 2+ other people (cc-style) and the question/request is not uniquely directed at the user → `no_action_needed`
- If the mention is via a group/subteam mention (e.g., `<!subteam^...>`) rather than a direct `<@USER_ID>` mention → `no_action_needed`
- If it is a deployment approval request (배포 승인, 테섭 배포, 상용 배포) where the user is one of multiple approvers → `no_action_needed`
- If it is a personal action item (e.g., token issuance, signing a document) that doesn't require a Slack reply — the user can act on it without responding in the thread → `no_action_needed`
- If it is a daily standup / work report thread → `no_action_needed`
- **When in doubt, lean toward `no_action_needed`** — the user prefers fewer interruptions and will handle important matters directly in Slack

For threads that should be auto-completed:
1. Update the thread's `status` to `auto_completed`
2. Set `completion_reason` to the appropriate value
3. Set `completed_at` to current ISO timestamp
4. Save the updated JSON file

**Important:** Do NOT use a subagent for triage — perform classification directly in the current session to minimize latency during periodic monitoring.

### Step 3: Present results

When presenting the results to the user, read the updated `~/.claude/slack-monitoring/YYYY-MM-DD.json` and **always include the `permalink` field as a clickable link for each thread** so the user can jump directly to the Slack thread.

If any threads were auto-completed by AI triage in Step 2, show them separately:

**If language = ko:**
```
🤖 AI 자동완료 (N건)
- #<id> #채널 · @보낸사람 — <사유> (permalink)
```

**If language = en:**
```
🤖 AI Auto-completed (N)
- #<id> #channel · @from — <reason> (permalink)
```

Where `<reason>` is a brief human-readable explanation based on completion_reason:
- `resolved_by_others`: "다른 사람이 답변함" (ko) / "Resolved by others" (en)
- `no_action_needed`: "응답 불필요" (ko) / "No action needed" (en)

### Step 4: Codebase lookup for suggested replies

Before generating suggested replies, check if `codebase_paths` is set in config.

For each remaining `pending` thread, determine if the thread contains a **technical question** that could be answered by looking at the code (e.g., asking about logic, behavior, implementation, DB schema, API, specific function/table names).

If yes:
1. Extract 2-5 **search keywords** from the thread (function names, table names, class names, feature keywords)
2. Use the **Grep tool** to search across all paths in `codebase_paths`:
   - Search each keyword in relevant file types (`*.py`, `*.ts`, `*.js`, `*.java`, etc.)
   - Limit to top 5 most relevant results per keyword
3. Include the found code snippets in the suggested reply context

If no technical question is detected, skip codebase lookup for that thread.

**Summary model**: Read `model` from config (default: `haiku`).
- If `haiku` or `sonnet`: use the **Agent tool** with `model` parameter set to the configured value. Pass thread data, `language`, `tone`, `summary_style`, and any codebase findings to the subagent for summarization.
- If `session`: generate the summary directly in the current session (no subagent).
