# Session Summary: Codify committee complete-design document (reverse D9)

**Date:** 2026-06-18
**Session type:** Full implementation (execute-write, subagent mode) + finish
**Plan:** `20260617-01-codify-committee-design-plan-00.md`

## Goal

Reverse decision **D9**. Before this sprint the `design-committee` skill emitted a verdict-only packet and the downstream `spec-write` skill had to *mine* the eight FAC (design) fields out of that packet's narrative prose — an uncatchable silent-mis-extraction risk guarded only by a single human quote-back. This sprint elevates the committee to emit a structured **complete-design document** (committee-native "Option-2" template) carrying the eight FAC fields as labeled sub-fields, has `spec-write` read them *by label*, and declares the committee's transition into the spec phase (`spec-write` → `spec-harden` → `plan-build`).

## What Was Completed

Nine-task plan executed in subagent mode (fresh implementer per task → non-dialable spec-compliance review → skip-eligible quality review), then a mandatory full cross-task code review, then the finish sequence.

### Cluster A — committee-internal (Tasks 1-4)
- **Task 1:** Replaced `skills/design-committee/references/artifact-template.md` with the Option-2 complete-design template (eight labeled FAC sub-fields + mandatory `## Dissent Record`).
- **Task 2:** `agents/design-committee-scribe.md` — author the complete-design document, permit structured sub-field population, lift "do not expand" while preserving no-invention/no-opinion. Bumped scribe v0001→v0002 (behavior change).
- **Task 3:** `skills/design-committee/references/team-lead.md` — renamed the **artifact** sense ("decision packet" → "complete-design document") while **disambiguating** the locked four-block **surface** sense to "decision-communication packet" (must not be renamed away). v0013→v0014. Test anchor `tests/test-member-warrant.sh:58` updated in lockstep.
- **Task 4:** `skills/design-committee/references/committee-analysis-round-format.md` — Option-2 structure + `<complete-design>.md` filename placeholder. v0001→v0002.

### Cluster B — spec-write side (Tasks 5-7)
- **Task 5:** `skills/spec-write/references/fac-complete-design-contract.md` — reversed D9 (intro, FAC table with committee complete-design source column + Option-2 labels, quote-back rationale, "D9 is reversed" change-log paragraph). Test `tests/test-fac-contract.sh:13` updated in lockstep.
- **Task 6:** `skills/spec-write/SKILL.md` — structured-field read; description, entry-condition, body edits. v0001→v0002. Regenerated `skills/setup-start/references/skill-index.md`. Version pins in `tests/test-spec-write-skill.sh` and `tests/test-stamping-spec-write.sh` retargeted to v0002.
- **Task 7:** `skills/design-committee/SKILL.md` — scribe line, Tear Down, Integration Reads, Transitions (none → spec-write→spec-harden→plan-build). v0023→v0024. Line-3 description intentionally unchanged.

### Cluster C — fold-in cleanup + gate (Tasks 8-9)
- **Task 8:** Terminology sweep across 8 peripheral `.md` files (spec-harden SKILL, 5 committee role agents, `docs/instructions.md`, `skill-contract.md`). Term-only — **no version bumps** per the `agents/CLAUDE.md` carve-out.
- **Task 9:** Final verification sweep — residual sweep, absence check, version audit, full suite. All green; no edits required.

### Finish-time fold-in (DI-1 + DI-2, designer-approved)
Beyond the plan: closed two pre-existing out-of-scope residuals the cross-task review surfaced — `spec-write/references/spec-template.md:18` and `agents/sources/catalog-template.md` L37/L53 (the latter the generator source for `skill-index.md` L37/L53). Edited the template source + regenerated the catalog rather than hand-editing the generated file.

## Verification Results

| Check | Result |
|-------|--------|
| Full test suite (`tests/test-*.sh`) | 38 passed, 0 failed |
| Catalog freshness (`test-generated-agents-current.sh`) | PASS |
| Per-task spec-compliance reviews (Tasks 1-8) | All PASS |
| Per-task quality reviews (Tasks 3, 5, 6 eligible) | No ≥80-confidence findings |
| Full cross-task code review (`6d46a6e..41e4cc6`) | APPROVE_WITH_NITS (0 Critical, 0 Important) |
| Residual artifact-sense "verdict"/"decision-packet" sweep | Zero remaining |
| Eight FAC labels: template ↔ contract parity | Exact character-for-character match |

## Known Remaining Items

- **DI-3 (open, deferred polish):** `fac-complete-design-contract.md:22` carries before/after contrast language ("now … rather than … simpler than before") in a declarative section rather than the dedicated D9-rationale section below it. Minor doc-discipline nit; designer chose to fold in DI-2 only. Optional reword in a future pass.

## Files Changed

**Committee side:**
- `skills/design-committee/references/artifact-template.md` (replaced)
- `skills/design-committee/references/team-lead.md`
- `skills/design-committee/references/committee-analysis-round-format.md`
- `skills/design-committee/references/skill-contract.md`
- `skills/design-committee/SKILL.md`
- `agents/design-committee-scribe.md`
- `agents/design-committee-{conservator,innovator,pragmatist,purist,researcher}.md`

**Spec-write side:**
- `skills/spec-write/SKILL.md`
- `skills/spec-write/references/fac-complete-design-contract.md`
- `skills/spec-write/references/spec-template.md`

**Catalog / peripheral:**
- `agents/sources/catalog-template.md`
- `skills/setup-start/references/skill-index.md` (regenerated)
- `skills/spec-harden/SKILL.md`
- `docs/instructions.md`

**Tests (lockstep with contract changes):**
- `tests/test-member-warrant.sh`, `tests/test-fac-contract.sh`, `tests/test-spec-write-skill.sh`, `tests/test-stamping-spec-write.sh`

## Commits

- `a7b3ff2` feat: replace committee artifact-template with Option-2 complete-design template
- `ca004a5` feat: scribe authors complete-design document; permit structured sub-field population; bump v0002
- `862d4d5` feat: team-lead.md renames scribe artifact to complete-design document; disambiguates locked decision-communication packet
- `7513a4f` feat: round-format.md describes scribe output as Option-2 complete-design document
- `a1a5cfb` feat: reverse D9 — committee emits a structured complete-design document; contract reads labeled fields
- `4f0e0f7` feat: spec-write reads committee complete-design document fields; regen catalog; bump version pins
- `2bece36` feat: committee declares spec-write transition; renames scribe output to complete-design document
- `41e4cc6` docs: terminology sweep — committee complete-design document replaces verdict/decision-packet terms
- `d75bfd1` checkpoint: execution complete
- `b09b8de` docs: fold-in terminology sweep — committee complete-design document in spec-template + catalog flow lines (closes DI-1, DI-2)

## Handoff Notes

- Sprint built in worktree `.worktrees/20260617-01-codify-committee-design` (branch same name). Base = `6d46a6e`. Ready for `finish-archive-artifacts` then `finish-close-worktree` (merge `--no-ff` to main).
- The load-bearing invariant going forward: the eight FAC labels in `artifact-template.md` and `fac-complete-design-contract.md` must stay in sync — `spec-write` reads committee fields by label, so a label drift makes a field read as missing. The cross-task review confirmed exact parity at merge time.
- The two-sense split is deliberate and must be preserved: **artifact** = "complete-design document", locked four-block **surface** = "decision-communication packet", committee-internal handoff file = `verdict.md`. The `verdict.md` internal file name was intentionally retained.
- DI-3 is the only open item — optional doc-discipline polish, no functional impact.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-committee@v0023 -->
<!-- produced-by spec-write@v0001 -->
<!-- produced-by spec-harden@v0001 -->
<!-- produced-by plan-build@v0007 -->
<!-- produced-by execute-write@v0008 -->
<!-- produced-by finish-write-records@v0004 -->
