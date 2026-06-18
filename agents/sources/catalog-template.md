# Skill Index

Pick Chester skill.
Read when many skills could apply, or to look up a named skill.

## Pipeline

Five phases.
Gate skill enters each.

- **Design** → `design-small-task` or `design-committee`.
- **Spec** → `spec-architect` → `spec-write` → `spec-harden`.
- **Plan** → `plan-build` (wraps `plan-attack` + `plan-smell` in hardening gate).
- **Execute** → `execute-write` → `execute-verify-complete`.
- **Finish** → `finish-write-records` → `finish-archive-artifacts` → `finish-close-worktree`.

## Design skills

Pick by problem shape, not size.

- `design-small-task` — bounded single-concern problem; makes 6-section brief.
- `design-committee` — 6-role multi-perspective deliberation; use when framing bias risks outcome; standalone primitive, no auto-transition.
- `design-grillme` — adversarial interview; stress-tests existing plan or design; not a gate.

## Spec skills

3 skills.
Design entry path decides if first runs.

- `spec-architect` — settles architecture for FAC-incomplete design; small-task path only; committee path skips.
- `spec-write` — authors spec from FAC-complete design; both paths; no review passes.
- `spec-harden` — 3 review passes (fidelity, adversarial, ground-truth) + user gate → `plan-build`.

Two paths into plan:

- Small-task → `design-small-task` → `spec-architect` → `spec-write` → `spec-harden` → `plan-build`.
- Committee → `design-committee` → (designer routes complete-design document) → `spec-write` → `spec-harden` → `plan-build`.

## Skill Priority

Many skills apply → use this order.

1. **Gate skills first** — design skill for problem, then `spec-architect` / `spec-write` / `spec-harden`, `plan-build`, `execute-write`, `execute-verify-complete`, `finish-*`; set pipeline stage + HOW to approach.
2. **Review skills second** — `plan-attack`, `plan-smell`, `util-codereview`; harden + validate.
3. **Behavioral skills third** — `execute-test`, `execute-prove`; execution discipline.
4. **Utility skills fourth** — `util-worktree`, `util-dispatch`, `util-handoff`, read-only `util-*` refs; workflow mechanics.

### Dispatch patterns

- "Quick design check for X" → `design-small-task` → small-task path → `plan-build`.
- "Convene the committee on X" / "ask the committee" → `design-committee` standalone (not pipeline-staged).
- "Grill me on this plan" / "stress-test this design" → `design-grillme`.
- "Already have settled architecture or committee complete-design document" → skip to `spec-write`.

## Skill Catalog

<!-- CATALOG_SLOT -->

Brief templates not standalone skills — live inside each design skill as references:

- `design-small-task/references/design-brief-small-template.md` — 6-section lightweight (bounded-task briefs).
