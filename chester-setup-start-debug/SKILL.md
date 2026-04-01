---
name: chester-setup-start-debug
description: "Activate diagnostic token logging mode. Use instead of chester-start when you want per-section and per-subagent token usage tracking."
---

# chester-start-debug

Announce: "Diagnostic mode active — token usage will be logged per section and subagent."

## Activate Diagnostic Mode

1. Create the debug flag file:

```bash
cat <<FLAG_EOF > ~/.claude/chester-debug.json
{
  "mode": "diagnostic",
  "session_start": $(date +%s)
}
FLAG_EOF
```

2. Verify the file was created:

```bash
cat ~/.claude/chester-debug.json
```

3. After creating the flag, follow all standard chester-start behavior — invoke the `chester-start` skill via the Skill tool for session setup. The debug flag will persist because chester-start only removes flags older than 12 hours.

## What Diagnostic Mode Does

When the debug flag is active, Chester skills that support diagnostic logging will:
- Read `~/.claude/usage.json` before and after each major step
- Append the usage delta to a token usage log
- Log location: `{sprint-dir}/summary/token-usage-log.md` or `~/.claude/chester-usage.log`

The budget guard (pause at threshold) is always active regardless of diagnostic mode.

## Deactivating

Start a new session normally (without invoking chester-start-debug). The flag will be treated as stale after 12 hours, or you can remove it manually:

```bash
rm ~/.claude/chester-debug.json
```
