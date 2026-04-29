# Session Summary: Add Competitive Team-Interview Understanding Flow

**Date:** 2026-04-29
**Session type:** Full-stack implementation (execute-write subagent + inline)
**Plan:** `add-competitive-interview-plan-01.md`

## Goal

Add a fourth opt-in understanding flow `team-interview` to `chester:design-large-task`: a four-pole Cartesian debate (Innovator/Conservator/Purist/Pragmatist) over five rounds with agent-consensus convergence (no MCP), producing a three-section handoff artifact (problem statement / consensus evidence / exit criteria) for downstream Phase 4 Solve Stage seeding.

## What Was Completed

### New flow option

Added `team-interview` to the `ACTIVE_UNDERSTANDING_MCP` swap-line in `skills/design-large-task/SKILL.md` alongside existing `classic` / `problemfocused` / `architectural` (archived) options. Appended `team-interview-flow.md` to the per-MCP flows list.

### Flow file

Created `skills/design-large-task/references/team-interview-flow.md` (~290 lines) covering:

- Round-Zero Initialization (no MCP init; build context packet from Phase 1–3 outputs)
- Round Sequence (R1=N, R2=S, R3=E, R4=W openers; R5 synthesis)
- Per-Round Phases (5-phase loop: opening → opposing arguments via sequential chain → counter-arguments → idea collapse → recommendation)
- Round 5 specifics (parallel synthesis attacks against consolidated draft)
- Orchestrator-side dispatch/completion printing (per sprint 2026-03-31 — Subagent Progress Surface)
- Transcript Schema (per-round block format)
- Validity-Test Checklist (structural / grounding / survival / handoff)
- Termination Rules (5-round cap; 3+-dead skip-to-synthesis; all-four-dead stage failure)
- Error Handling (mid-chain failure recovery; polite-collapse re-prompt)
- Proof Seeding (mapping table from consensus evidence to EVIDENCE / RULE / RISK proof elements)
- Brief-Render Read Shape (process-evidence transcript replaces Understanding-MCP saturation history)
- Resume Protocol (capture_thought-based — `team-interview-r{N}-recommendation` tags written incrementally)
- Handoff Artifact (Problem Statement / Consensus Evidence / Exit Criteria, three-section format aligned with sprint 20260417-03 Optimize Throughput)
- Ratification (per-pole signoff block with one-revision-pass and designer-arbitration policy)
- Voice Discipline (C1 Externalized Coverage + C2 Fact Default with Marked Departures)

### Pole subagents

Created four pole subagent definition files in `agents/`:

- `design-large-task-step-b-innovator.md` (N — change, novel solutions)
- `design-large-task-step-b-conservator.md` (S — status quo, existing patterns)
- `design-large-task-step-b-purist.md` (E — philosophy, principle)
- `design-large-task-step-b-pragmatist.md` (W — ship what works, outcomes)

Each pole inherits the five real Stance Principles from `util-design-partner-role`, applies C1/C2 voice discipline, enforces Understand-Stage prohibitions (no solutions / no design alternatives / no architecture suggestions / no "how might we" framing / no comprehensive analyses), and uses transcript-schema-aligned output formats the lead can paste verbatim.

### Fork policy rows

Added rows 1d–1g to `docs/fork-policy.md` documenting that the four pole dispatches are framing-side and never fork (Fork policy: No).

### SKILL.md integration patches

Eight patches to `skills/design-large-task/SKILL.md` (Mitigation A + Mitigation B from plan-hardening):

- Template-path generalization at four sites (line 80 prose, Phase Map step 3, Two-Stage Model template, Understand Stage Per-Turn Flow template) — acknowledges `team-interview-flow.md` lacks `-mcp-` infix
- HARD-GATE block: added `team-interview` conditional resolving the contradiction where the gate unconditionally mandated `initialize_understanding` but team-interview has no MCP
- Phase Map step 4: appended conditional that team-interview runs no MCP init; context-packet construction still executes
- Phase 3 step 2: parenthetical clarifying no state file is created for team-interview
- Phase 4 Understand Stage opening note: routes per-turn cycle through the four-pole sequential-chain debate when team-interview is active; flags MCP-specific guidance (read-only-discipline scoring side, `transition_ready` stopping criterion) does not apply
- Solve Stage Opening step 1: replaces polish/readback/confirm with single confirmation prompt for team-ratified statements; designer revisions captured as logged overrides under the Ratification block (no four-pole re-entry)
- Resume Protocol step 2: branches on ACTIVE_UNDERSTANDING_MCP — MCP-backed flows call `get_understanding_state`; team-interview calls `get_thinking_summary()` and reads `team-interview-r{N}-recommendation` thoughts (Mitigation B avoids the rejected process-evidence file approach)
- Skill version bumped `v0007 → v0008`

### Tests

24 bash test scripts at `tests/test-ac-{N-M}-{slug}.sh`, one per acceptance criterion in spec v03. All 24 pass. Plus 2 regression tests (AC-6.1 verifies existing flows unchanged; AC-6.2 verifies Phase 1/2/5 untouched, with HARD-GATE block excluded from Phase 2 comparison since Mitigation A deliberately patched it).

### Cross-sprint test fix

`tests/test-partner-role-discipline.sh` AC-4.1 was failing on main because its awk pattern targeted "Step 6: Write commentary" but `design-large-task/SKILL.md` Understand Stage was refactored to use Invariants. Updated the pattern to extract the Invariant 3 block. C1/C2 cross-reference content is present and unchanged at SKILL.md:364.

## Verification Results

| Check | Result |
|-------|--------|
| Sprint AC tests (24 ACs) | 24/24 PASS |
| Pre-existing test (test-partner-role-discipline.sh) | Was failing on main; fixed to PASS |
| Decision-record tests (4 scripts) | Pass when worktree node_modules present (env issue, non-sprint) |
| `tests/test-decision-record-shared-fixtures.sh` | Sourced-only library; exits 1 by design |
| Clean tree at checkpoint | Yes |
| Skill version bumped | v0007 → v0008 |

## Known Remaining Items

Recorded in `add-competitive-interview-deferred-00.md`:

- **AC-1.2 test scope (confidence 88, Important)** — `REQUIRED_SECTIONS` array covers 10 of 11 declared section headings in the flow file. The 11th (`Round-Zero Initialization`) is present in the skeleton but not asserted by the test. Spec revision required (would bump to v04 + new AC or expanded AC-1.2). Out of scope for current task; defer to follow-on.

## Files Changed

### Created

- `skills/design-large-task/references/team-interview-flow.md`
- `agents/design-large-task-step-b-innovator.md`
- `agents/design-large-task-step-b-conservator.md`
- `agents/design-large-task-step-b-purist.md`
- `agents/design-large-task-step-b-pragmatist.md`
- `tests/test-ac-1-{1..12}-*.sh` (12 files)
- `tests/test-ac-2-{1..4}-*.sh` (4 files)
- `tests/test-ac-3-{1..3}-*.sh` (3 files)
- `tests/test-ac-4-1-fork-policy-pole-rows.sh`
- `tests/test-ac-5-{1,2}-*.sh` (2 files)
- `tests/test-ac-6-{1,2}-*.sh` (2 files)

### Modified

- `skills/design-large-task/SKILL.md` (swap-line + 8 integration patches; version bump)
- `docs/fork-policy.md` (rows 1d–1g)
- `tests/test-partner-role-discipline.sh` (Invariant 3 extraction fix)

### No changes

- `skills/design-large-task/references/classic-mcp-flow.md` (verified by AC-6.1)
- `skills/design-large-task/references/problemfocused-mcp-flow.md` (verified by AC-6.1)
- `skills/design-large-task/references/architectural-mcp-flow.md` (verified by AC-6.1)

## Commits

| Hash | Message |
|------|---------|
| `e9ad455` | feat: add team-interview swap-line option |
| `8148a31` | feat: create team-interview-flow.md skeleton |
| `7b7c4c9` | feat(design-large-task): specify team-interview round mechanics with orchestrator-side dispatch printing |
| `eae69ca` | feat(design-large-task): specify handoff artifact and voice discipline |
| `b4864d4` | feat(design-large-task): specify transcript schema, validity tests, termination rules, resume protocol |
| `17f35b6` | feat(design-large-task): specify proof seeding, transition capture, brief-render read shape |
| `d2a08c6` | feat(agents): add four pole subagents for team-interview Step B |
| `c9db9fe` | docs(fork-policy): add four pole subagent dispatch rows for team-interview |
| `158444c` | feat(design-large-task): conditional Phase 3/4 + Solve Stage opening + Resume Protocol for team-interview |
| `d522a2e` | test(design-large-task): add regression sweep for untouched flows and phases |
| `12d175b` | fix(design-large-task): code review polish — version bump, brittle line refs, pole format consistency, Solve Stage revision path |
| `033d26d` | fix(test-partner-role-discipline): align Understand Stage extraction with Invariant 3 structure |
| `6b90d1f` | checkpoint: execution complete |

## Decision-Record Audit

- Records audited: 0
- Drift findings: 0
- Kinds checked: sha-missing

No decision records were captured during this sprint — every observable behavior had AC skeleton coverage (24 ACs, 24 skeletons), so the execute-write trigger-check never fired. Zero records is the correct outcome for full-coverage sprints.

## Handoff Notes

The team-interview flow is structurally complete and tests pass. Real-world acceptance is a manual gate: running an actual sprint with `ACTIVE_UNDERSTANDING_MCP: team-interview` set and observing whether the four-pole debate produces a useful problem statement and Solve Stage seeds correctly.

Watch points for the first live run:

- **Pole differentiation** — if the polite-collapse re-prompt fires every round, the lens framing in pole agent files needs sharpening.
- **Sequential chain quality** — opposers should add new ground or sharpen disagreement, not duplicate. If duplicates dominate, prior-chain context handling in the lead's dispatch needs adjustment.
- **R5 ratification stalls** — if the one-revision-pass + designer-arbitration loop fires often, the consolidated-draft synthesis logic may need a tighter guideline.
- **Resume Protocol** — first session interruption that exercises `get_thinking_summary()`-based recovery will validate Mitigation B end-to-end.

Sprint 20260417-03 (Optimize Throughput, approved-but-unimplemented) independently converged on the same three-section handoff format. If that sprint becomes active, the formats should remain compatible by construction.
