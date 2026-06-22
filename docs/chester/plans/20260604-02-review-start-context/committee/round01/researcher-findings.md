# Researcher Findings — Round 01
# Sprint: 20260604-02-review-start-context
# Commit range reviewed: 099d46c..1265069 (40 commits)
# Date: 2026-06-05

## Scope

Validate adjudicated design (Option 1: trigger-split + first-run wizard gating,
split-and-keep direction) against 40 commits landed since prior committee analysis
at HEAD 099d46c.

---

## 1. setup-start/SKILL.md — Current State

**DECISIVE — design holds.**

Single change in range: `dd035d2` bumped version `v0001 → v0002` (frontmatter only).
The frontmatter is stripped by `session-start` before injection, so the injected
payload is bit-for-bit identical before and after the version bump.

Measurements:
- Raw file: 207 lines, 8,376 bytes
- Injected body (frontmatter stripped by `session-start`): **8,154 bytes** — exactly
  matches the prior analysis figure.

3-bucket structure intact and line ranges unchanged:
- First-run wizard: lines 33–112 (first-run path, `CHESTER_CONFIG_PATH` = none)
- Returning-session checks 0–3: lines 113–160
- Skill-discovery mandate: lines 162–208 (SUBAGENT-STOP, EXTREMELY-IMPORTANT,
  Instruction Priority, The Rule, Red Flags, Skill Types, Choosing Between Skills,
  User Instructions)

The mandate section tags are present and positionally stable:
- `<SUBAGENT-STOP>` at line 7
- `<EXTREMELY-IMPORTANT>` at line 11
- `## Instruction Priority` at line 19
- `## The Rule` at line 168
- `## Red Flags` at line 174
- `## Skill Types` at line 193

No content was added, removed, or restructured. The only edit was the version bump
in the stripped frontmatter.

**DECISIVE — design-large-task removal did NOT touch the mandate text.** The
`ddca0aa` refactor touched `start-bootstrap/SKILL.md` and `util-design-partner-role/SKILL.md`
only. `setup-start/SKILL.md` body content is unchanged.

---

## 2. hooks/hooks.json — Matcher Status

**DECISIVE — no change.**

`hooks/` and `chester-util-config/` appear in zero files in the commit-range diff.
Confirmed: `git diff 099d46c..1265069 -- hooks/ chester-util-config/` produces no output.

Current matcher:

```json
"matcher": "startup|clear|compact"
```

Unchanged. Hook fires on all three events. The design's premise that compact re-injects
the full payload is still structurally accurate.

---

## 3. chester-util-config/session-start — stdin behavior

**DECISIVE — reads zero stdin. Unchanged.**

`chester-util-config/session-start` was not modified in this range. Current script:
- One `cat` of `SKILL.md` (the skill file itself, not stdin)
- No `INPUT=$(cat)`, no `jq`, no trigger/hook_event_name read
- Emits the full frontmatter-stripped SKILL.md body unconditionally on every event

The design's stated mechanism — "session-start just needs to read [the trigger field]
and branch" — is still an unrealized gap. Nothing in these 40 commits changed this.

---

## 4. design-large-task removal and mandate text

**DECISIVE — mandate text untouched.**

The `20260605-01-remove-largetask-references` sprint scrubbed design-large-task references
from: `start-bootstrap`, `util-design-partner-role`, `util-artifact-schema`, `fork-policy.md`,
`plan-build`, `execute-write`, `design-specify`, `util-worktree`, `docs/instructions.md`,
and agent/test files.

`setup-start/SKILL.md` body was NOT in scope and was NOT modified (body content). The
SUBAGENT-STOP / EXTREMELY-IMPORTANT / The Rule / Instruction Priority / Red Flags /
Skill Types text is verbatim-identical to the prior analysis state.

Compaction floor re-verified at current state:
- SUBAGENT-STOP: ~29 tokens (no change)
- EXTREMELY-IMPORTANT mandate: ~84 tokens (no change)
- Instruction Priority: ~118 tokens (no change)
- The Rule: ~166 tokens (no change)
- Red Flags table: ~260 tokens (no change)
- Skill Types: ~49 tokens (no change)
- Core floor total: **~417 tokens (21% of payload)** — still accurate
- With Red Flags: **~700 tokens** — still accurate
- Deferrable on compact: **~1,557 tokens (77%)** — still accurate

One side note on `skill-index.md` (informational, not design-blocking): the skill-index
at `skills/setup-start/references/skill-index.md` still carries a live entry for
`design-architect-committee` (line 29). This skill was archived to `_archive/` in commit
`b1f8d08`. The `dd035d2` commit message says "sync skill-index entries if stale" but the
skill-index was not actually modified in that commit (confirmed via `git show dd035d2`).
This is a **documentation staleness** — the skill-index points to an archived skill. It
does not affect the adjudicated design or the start-sequence implementation path, but
follow-on work should clean it up.

---

## 5. design-architect-committee archival

**DECISIVE — no premise dependency.**

Commit `b1f8d08` moved all `skills/design-architect-committee/` files to `_archive/`.
Commit `5903eb0` archived its tests.

The design brief (`design-00.md`) and prior committee analysis (`committee-analysis-01.md`)
contain ZERO references to `design-architect-committee` or Mode A/Mode B framing.
Confirmed by grep across both files — no matches.

The `feedback_no_mode_ab_terms.md` memory rule (never use Mode A/B vocabulary) is
in no way violated by these documents.

The worktree for this sprint (`20260604-02-review-start-context`) still contains the
`skills/design-architect-committee` directory because the worktree branch predates
the archival commit — it was created at HEAD 099d46c and has not been rebased. This
is irrelevant to the design; the active work target is the main branch state.

**No premise in the adjudicated design depends on design-architect-committee.**

---

## 6. feedback_subsprint_completion_annotation memory — existence

**DECISIVE — confirmed still does NOT exist.**

Full memory directory listed. No file matching `feedback_subsprint_completion_annotation`
or any subsprint-related slug is present. The brief's constraint citing it remains
unfounded. Closest real memory is `feedback_standalone_documentation` (declarative current
state; history in end-of-document change log).

No new memory file was added in this range that bears on the brief's constraints.
Memory files for this sprint range: `project_largetask_removed_not_renamed` and
`feedback_master_sprint_name_signal` — neither is relevant to the start-sequence design.

---

## 7. New token sinks or per-session injections

**DECISIVE — none introduced.**

The 40 commits in range affected:
- Agent files (`agents/design-committee-*.md`) — these load as per-dispatch subagent
  system prompts, NOT per-session injections. Zero effect on session overhead.
- Skill SKILL.md files (start-bootstrap, plan-build, execute-write, etc.) — loaded
  only on explicit Skill tool invocation. Not per-session injections.
- The new `design-committee-consolidator` agent — ephemeral per-round dispatch,
  not on the main TeamCreate roster, zero per-session overhead.
- `hooks/hooks.json` — unchanged (confirmed above).
- `CLAUDE.md` (root) — unchanged in this range.
- `docs/chester/CLAUDE.md` and subdirectory CLAUDE.md files — not modified in range.
- No new SessionStart hook was registered.
- No new MCP server was added.

The per-session injection inventory at HEAD 1265069 is identical to the inventory at
099d46c:
1. SessionStart hook → `session-start` → `setup-start/SKILL.md` body (~8,154 bytes,
   ~2,000 tokens) on startup|clear|compact
2. Root CLAUDE.md + subdirectory CLAUDE.md files as project instructions (~900 tokens
   for Master Plan Mode block, loads unconditionally per session)
3. PreCompact / PostCompact hooks (unchanged)

No new sinks. Design token accounting is still accurate.

---

## Summary Table

| Check | Prior Finding | Current State | Status |
|-------|--------------|---------------|--------|
| setup-start body | 8,154 bytes, 3 buckets, lines 33–112/113–160/162–208 | Identical | HOLDS |
| Hook matcher | startup\|clear\|compact | Unchanged | HOLDS |
| session-start stdin | reads zero stdin | Unchanged | HOLDS |
| Mandate text | SUBAGENT-STOP/EXTREMELY-IMPORTANT/Instruction Priority/etc. intact | Untouched | HOLDS |
| Compaction floor | ~417 core / ~700 w/Red Flags / ~1,557 deferrable | Unchanged | HOLDS |
| design-large-task removal | not yet done at 099d46c | Done — mandate text unaffected | HOLDS |
| design-architect-committee | no premise dependency | Archived, no premise dependency | HOLDS |
| feedback_subsprint_completion_annotation | does not exist | Still does not exist | HOLDS |
| New per-session injections | none | none | HOLDS |

---

## Conclusion

**DECISIVE — adjudicated design holds in full after the 40-commit range.**

Option 1 (trigger-split delivery + first-run gating), split-and-keep direction, one hook
with stdin branching, Red Flags kept inline in compact stub — all premises remain
structurally accurate. No commit in range modified hooks.json, session-start, or the
injected body of setup-start. The design-large-task removal sprint was entirely
orthogonal. The only finding that is new (design-architect-committee still listed in
skill-index.md) is a documentation staleness, not a design blocker.

**One informational note for advocacy members**: the worktree branch for this sprint
(`20260604-02-review-start-context`) still shows setup-start at v0001. The main branch
(implementation target) has v0002. Any implementation should target main branch state.

<!-- created-at: 2026-06-05 -->
