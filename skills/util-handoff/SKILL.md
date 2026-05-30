---
name: util-handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
version: v0004
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work.

Save it to a `handoff/` directory inside the current sprint folder — a sibling of the sprint's `design/`, `spec/`, `plan/`, and `summary/` directories. Resolve the path with `eval "$(chester-config-read)"`, then write to `$CHESTER_WORKING_DIR/<sprint-subdir>/handoff/`, where `<sprint-subdir>` is the sprint you are currently working in. Create the `handoff/` directory if it does not exist.

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
