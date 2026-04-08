# Code Smell Review: chester-execute-write/

**Scope:** 5 files — SKILL.md, code-reviewer.md, implementer.md, quality-reviewer.md, spec-reviewer.md

**Verdict:** Generally well-structured with several notable issues worth addressing.

---

## Strengths

- **SKILL.md** | Comprehensive orchestration document with clear mode separation (subagent vs inline), well-defined status codes, and a useful "Red Flags" section that serves as a built-in self-check.
- **implementer.md** | Thorough self-review checklist and clear escalation guidance ("it is always OK to stop"). The commit message format guidance is specific and actionable.
- **spec-reviewer.md** | The adversarial framing ("Do Not Trust the Report") is effective for preventing rubber-stamping. Commit verification is a good addition.
- **code-reviewer.md** | Clean structure with a concrete example output that anchors the expected format.

---

## Issues

### Critical

None.

### Important

- **Duplication between quality-reviewer.md and code-reviewer.md** | quality-reviewer.md is essentially a thin wrapper that says "use the code-reviewer.md template" and then adds four extra check items. This creates an indirection layer with unclear value. The quality reviewer's added checks (file responsibility, decomposition, file structure, file size growth) could be folded into code-reviewer.md as a conditional section, or quality-reviewer.md could be a standalone template like the others. Currently it is neither fully self-contained nor a clean delegation — it is a hybrid that requires the dispatcher to mentally merge two documents.

- **Inconsistent template structure across reviewer files** | spec-reviewer.md and implementer.md embed their full prompt inline in a fenced code block. quality-reviewer.md references code-reviewer.md by path and adds supplementary instructions outside the code block. code-reviewer.md has no code block wrapper at all — it IS the prompt. Three different structural conventions across four template files makes the pattern harder to follow and more error-prone for the orchestrator.

- **SKILL.md Section 1.2 — Worktree fallback creates silent coupling** | The worktree verification says "invoke chester-util-worktree to create one as a fallback." This means chester-execute-write can silently create infrastructure that normally belongs to an upstream skill (chester-design-figure-out). If the worktree creation fails or produces unexpected state, the error path is undefined. The fallback should at minimum log that it is being used, and the failure case should be specified.

- **SKILL.md Budget Guard — Hardcoded path and fragile jq pipeline** | The budget guard uses `~/.claude/usage.json` and `~/.claude/settings.chester.json` as hardcoded paths, but elsewhere the skill uses `chester-config-read.sh` for path resolution. The budget guard should use the same config system for consistency. Additionally, `jq -r '.five_hour_used_pct // empty'` will silently produce no output if the JSON structure changes, which is the same behavior as "file missing" — making it impossible to distinguish between "no data" and "schema changed."

- **SKILL.md Section 1.3 — Deferred items written to two locations with no sync guarantee** | Deferred items are written to both `CHESTER_PLANS_DIR` and `CHESTER_WORK_DIR`. There is no guidance on what happens if one write succeeds and the other fails, or which copy is authoritative. This is a recipe for drift. Consider writing to one location and symlinking or copying at a well-defined lifecycle point (e.g., chester-finish).

### Minor

- **spec-reviewer.md line 25 — "The implementer finished suspiciously quickly" is always injected** | This framing is hardcoded regardless of whether the implementer actually finished quickly. For tasks that are genuinely simple, this creates a false adversarial signal that could waste reviewer effort. Consider making this conditional or softening it to "Verify independently regardless of how straightforward the report appears."

- **SKILL.md Section 2.2 — Model Selection Guidance is vague** | "Use the most capable model available" and "Standard models work well" provide no actionable decision criteria. There is no definition of what constitutes a "complex" vs "focused" task. This section either needs concrete heuristics or should be removed to avoid giving the illusion of guidance.

- **implementer.md — "Work from: [directory]" placeholder is easy to miss** | The template has several clearly-labeled placeholders like `[FULL TEXT of task...]` but `[directory]` is a single word buried at line 44. It would be easy for the dispatcher to overlook this, leading the implementer to work in the wrong directory.

- **code-reviewer.md — No commit verification step** | The spec-reviewer.md includes explicit commit verification (git diff, git status). The code-reviewer.md does not, despite operating on a SHA range. If the SHA range is wrong or stale, the review will silently cover the wrong code. Adding a verification step (e.g., confirming HEAD matches expected HEAD_SHA) would be consistent with the spec reviewer's approach.

- **SKILL.md Section 3.3 — "update the commit" is ambiguous** | In the inline execution mode, when revisiting earlier work, the instruction says "update the commit." This could mean amend the original commit (rewriting history) or create a new fixup commit. Given the project's commit conventions (prefer new commits), this should be explicit.

---

## Recommendations

- **Standardize template structure.** Pick one convention (full prompt in code block, or bare document) and apply it consistently across all four template files. This reduces cognitive load for the orchestrator.

- **Consolidate quality-reviewer.md into code-reviewer.md.** Add the four quality-specific checks as an optional section in code-reviewer.md, activated by a flag or context note. Eliminate the indirection.

- **Route budget guard paths through chester-config-read.sh.** This aligns with the existing config resolution pattern and avoids hardcoded paths diverging from the config system.

- **Make deferred items single-write.** Write to one canonical location; let chester-finish handle distribution to the other location if needed.

- **Add a template checklist to SKILL.md Section 2.1.** A short list of "before dispatching, verify you filled in: [task text], [context], [directory], [BASE_SHA]" would catch missed placeholders.
