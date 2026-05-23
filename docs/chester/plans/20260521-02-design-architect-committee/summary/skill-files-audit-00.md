# Reasoning Audit: `design-architect-committee` Skill Files Build

**Sprint:** `20260521-02-design-architect-committee`
**Plan executed:** `plan/skill-files-plan-01.md`
**Scope:** Decision points encountered during execute-write, designer overrides applied mid-execution, dispatch decisions, and risks accepted.

## Execution-Mode Decision

Plan v01 default = subagent-per-task (line 845: 4-of-4 inline heuristic conditions fail). Designer confirmed subagent mode with risk minimization preference at start of execute-write.

Sequential dispatch chosen over parallel: every task ends in `git commit`, which serializes on the shared `.git/index`. Concurrent subagents = race condition without speedup. Sequential preserves commit ordering for clean log + easy revert points.

## Per-Task Subagent Dispatches

Fifteen subagent dispatches (Task 1, Task 2, Tasks 3-9, Task 10, Tasks 11-13, Task 14, Task 16). Tasks 15 deferred. Task 16 executed inline (single-line insertion, no subagent overhead warranted).

Each subagent received:
- Worktree path (not main checkout — per Mike's worktree cd hazard rule, use `git -C` not `cd`).
- Plan section line range.
- Required content blueprint (preserving fields/ENUMs/IDs verbatim).
- Verification steps (greps, lint, test drivers).
- Commit command with explicit `git add <path>` (no `-A` / `.`).

All fifteen reported within their declared decision budgets. No subagent escalated. No retries needed.

## Designer Override: AX-008 Inversion

**Round:** Mid-execution, between Task 2 and Task 3 (after lint operational but before any schema body written).

**Original locked AX-008:** "Inter-agent deliberation prompts inside a session use caveman ultra; designer-facing surfaces (the four build files) use normal terse markdown. Caveman ultra does not propagate to designer-facing surfaces."

**Designer override:** "Use caveman ultra to rewrite the sprint files, not the information packets." Confirmed: override AX-008, frontmatter exempt and uncounted toward word cap, rewrite all as needed.

**Application:**
- Caveman ultra applied to: all seven `schema/*.md`, `SKILL.md` body, `rules.md` body, `design-brief-template.md` prose.
- Subagent prompts (information packets) stayed normal terse — per designer phrasing "not the information packets".
- Frontmatter in `SKILL.md` left untouched (exempt).
- `rules.md` sidecar header from Task 1 retained (already terse; combined-with-body total 150 words ≤ 200 cap).
- AX-008 content in `schema/actors.md § Convening-Message Discipline` written as the *inverted* rule, not the original locked text. Marked in-file as Class-1 designer override.

**Risk accepted:** the AX-008 source-of-truth divergence between `docs/chester/working/20260521-02-design-architect-committee/design/actors-locked-00.md` (original locked text) and `skills/design-architect-committee/schema/actors.md § Convening-Message Discipline` (inverted text). The skill file reflects the in-force rule; the design lock-doc preserves the original. Future readers tracing the rule's history should see the override captured here in this audit and in the in-file Class-1 marker.

## Word-Cap Decision Budget

Capped files (`SKILL.md`, `rules.md`) shared the same 200-word body cap.

| File | Plan target | Actual (post-frontmatter strip) | Margin |
|---|---|---|---|
| `SKILL.md` body | ~165 | 118 | 82 |
| `rules.md` body | ~170 | 150 | 50 |

Caveman ultra's natural compression dropped both well under target. Margin reserved for future minor edits (per-skill description tightening, anchor renames) without breaking the lint gate.

Schema files are lint-uncapped. Bodies ranged from 109 words (`resolution-criterion.md`) to 882 words (`procedures.md`, 12-procedure transcription). Closed-set content lives there by design.

## Test-First Discipline

Tasks 2, 10, 14 (code-producing) wrote their drivers before / alongside the artifacts being tested:

- Task 2: test driver written first (fails — lint absent), then lint script, then re-run to confirm pass.
- Task 10: schema files already on disk (Tasks 3-9); driver written as assertion harness over existing content. Not strictly test-first by ordering, but the driver enforces the AC-3.x contract structurally.
- Task 14: template already on disk (Task 13); driver enforces AC-5.x structural shape.

For docs-producing tasks (1, 3-9, 11, 12, 13, 16), the verification step was a grep against required content tokens — not a formal test, but a deterministic structural check.

## Task 15 Deferral

**Decision:** designer accepted the unsatisfied AC-6.3 in exchange for not touching `.git/hooks/pre-commit` during this sprint.

**Rationale:** the hook wrapper would have to handle cross-worktree availability (the target script doesn't exist on `main` until merge). Plan v01 lines 754-803 detail the wrapper approach. Designer chose to leave hook wiring as a post-merge fixup rather than land it on the sprint branch.

**Consequence:** the lint script exists and is self-tested, but no automatic enforcement on future commits. Manual `bash skills/design-architect-committee/scripts/lint-skill-files.sh` invocation works.

## CLAUDE.md Drift Surfaced

`skills/CLAUDE.md:33` and root `CLAUDE.md:99` describe the two-place-sync convention as `description` frontmatter ↔ `setup-start/SKILL.md` available-skills list. The actual list lives in `setup-start/references/skill-index.md` (no inline list in `SKILL.md`). Task 16 registered correctly per plan v01 instruction; CLAUDE.md text out-of-date.

Not amended this sprint per plan v01 Task 16 Step 4 ("known-but-deferred maintenance item; do not amend CLAUDE.md in this build"). Surfaced for future maintenance sprint.

## Risks Accepted at Close

1. **AC-6.3 unsatisfied.** No pre-commit hook. Lint runs only on manual invocation.
2. **AX-008 divergence between lock-doc and in-file rule.** Captured in this audit + in `schema/actors.md` Class-1 marker.
3. **CLAUDE.md drift.** Two locations point at the wrong sync target. Registration landed correctly; documentation lags.

## Reasoning Cache

Decision-budget telemetry across tasks (sum = 21):

| Task | Budget | Used | Notes |
|---|---|---|---|
| 1 | 1 | 1 | scaffolding straightforward |
| 2 | 2 | 2 | awk frontmatter strip + body-line indexing for FAIL message |
| 3 | 1 | 1 | source transcription |
| 4 | 1 | 1 | source transcription + Class-1 errata sentence |
| 5 | 1 | 1 | source transcription, 12 procedures |
| 6 | 2 | 2 | actor map ordering + AX-008 placement (inverted at decision-time) |
| 7 | 1 | 1 | six-field shape per Class-1 errata |
| 8 | 1 | 1 | source transcription |
| 9 | 1 | 1 | source transcription |
| 10 | 1 | 1 | test driver pattern |
| 11 | 2 | 2 | anchor citation phrasing + grep-clause word choice |
| 12 | 2 | 2 | operator-summary tone + scope-limits phrasing |
| 13 | 2 | 2 | worked-Concern wording + row-shape rendering |
| 14 | 1 | 1 | test driver pattern |
| 16 | 2 | 1 | insertion position obvious; description text mirrored adjacent |

No budgets exceeded.

## Change Log

- **00 (2026-05-23):** Initial reasoning audit covering the fifteen-commit `design-architect-committee` build, AX-008 mid-execution inversion, Task 15 deferral rationale, and surfaced CLAUDE.md drift.
