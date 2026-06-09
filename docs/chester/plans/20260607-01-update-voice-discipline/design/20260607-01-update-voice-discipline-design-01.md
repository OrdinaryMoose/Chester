# Design Brief: Canonical instruction-injection architecture (committee-adjudicated)

**Status:** Adjudicated — design of record
**Date:** 2026-06-07
**Sprint:** 20260607-01-update-voice-discipline
**Source:** design-committee round01 verdict (`committee/round01/verdict.md`); decision packet (`committee/round01/instruction-injection-architecture-decision.md`)

## Goal

Eliminate cross-file duplication of shared instruction text in Chester by assigning each consumer kind a delivery mechanism chosen for **strength of agent direction (no mid-session drift)**. DRY/SOLID desirable but subordinate.

## Decided architecture (mixed, binding-time-explicit)

- **Agent-side stable instruction (Teams subagents + named Task subagents)** → **build-time generator.** One canonical source per rule set; agent `.md` files are generated outputs with shared text baked in. Present at load, no CWD dependency, production-safe. Files stay committed (plugin loads them directly at dispatch).
- **Regeneration trigger (MANDATORY, in-scope)** → a deterministic generator (`bin/chester-generate-agents`) + a verify test (`tests/test-generated-agents-current.sh`: regenerate to temp, `diff` vs committed, fail on mismatch). Floor = generator + test; optional hardening = pre-commit hook / CI. No generator lands without the guard.
- **Dispatch-time injection (DTI)** → retained ONLY for runtime-varying content (dispatch question, context packets via `SendMessage`/`TeamCreate`). Already in place; orthogonal to the generator.
- **Parent-session skills** (inline `design-small-task`; runtime-read `plan-attack`/`plan-smell`/`util-codereview`/team-lead) → **runtime-read citation seam.** Stable CWD; no change needed.
- **CLAUDE.md rules** → **two-tier summary+pointer** (root canonical; `skills/CLAUDE.md` points up).
- **Skill catalog** → **generate `skill-index.md` from frontmatter**; fix the phantom pointer in both CLAUDE.md files (name `skills/setup-start/references/skill-index.md`); add 3 missing skills.

## Per-rule-set disposition

- **Voice rules** — add canonical homes for PM Litmus Test + Research Boundary in `util-design-partner-role` (none today); generate the 4 member agents' Stance Principles + Translation Gate blocks from canonical source.
- **Reviewer disciplines (FD-01)** — one canonical `review-discipline` reference (evidence standard / ≥80 ladder / independence); generate reviewer agent files with disciplines baked; reviewer *skills* keep runtime-read.
- **Member scaffold (FD-02)** — canonical `committee-member-template` + 4 lens blocks; generate the 4 member agent files (the ~70% shared scaffold lives once).
- **CLAUDE.md rules (FD-04)** — version-bump + description-sync rules canonical in root, pointer from `skills/CLAUDE.md`; reinstate the dropped "not on typo fixes" carve-out.

## Scope

**In scope:** the generator + verify test; canonical source files; generated agent files (committee members + reviewer agents); catalog generation; CLAUDE.md two-tier dedup; the two orphan voice rules' canonical homes.

**Out of scope:** FD-05 (review-loop control flow); round/turn flow structures (distinct, not duplicated).

## Key Decisions

1. **Build-time generator over DTI on the agent side.** DTI adds a per-dispatch caller obligation that breaks silently when a future skill dispatches an agent without injecting; generated files are self-contained and drift is `git diff`-detectable. Conservator's own blocking_risk conceded this; Innovator + Purist non-blocking.
2. **Generated files committed, not built at runtime.** Plugin loads `agents/*.md` directly at dispatch — no runtime build step. The verify test makes the committed copy safe.
3. **Binding-time, not mechanism, is the axis.** Stable-at-authoring content binds at build (generator); runtime-varying content binds at dispatch (DTI).

## Constraints

- Generated agent files MUST stay tracked (dispatch loads them) _(structural)_.
- Generator MUST be deterministic (same inputs → same bytes) so the diff test is stable _(structural)_.
- Committee members are Teams subagents; reviewer agents are named Task subagents — both file-is-prompt, both production CWD = user project _(structural)_.

## Residual Risks

- Generator drift if the regenerate step is skipped — mitigated by the mandatory verify test (the in-scope guard).
- Evidence-citation per-reviewer phrasing variants may be intentional scope, not drift — settle at authoring time in the canonical `review-discipline`.

## Acceptance Criteria

- One canonical source per shared rule set; no rule body duplicated across hand-authored files.
- `bin/chester-generate-agents` regenerates every agent file deterministically.
- `tests/test-generated-agents-current.sh` fails when a canonical source is edited without regeneration, passes when in sync.
- `skill-index.md` derives from frontmatter; phantom pointer fixed; 3 missing skills present.
- `skills/CLAUDE.md` carries no rule body root `CLAUDE.md` already owns; version carve-out restored.
- PM Litmus + Research Boundary have a canonical home in `util-design-partner-role`.
