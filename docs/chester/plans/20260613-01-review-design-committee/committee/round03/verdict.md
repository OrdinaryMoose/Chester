# Verdict — round 03

**Answer-shape marker:** CONVERGED (3-1) with a preserved minority caveat. The convergence is warranted, not count-driven.

## Verdict

The whole per-round flow should be expressed as **two non-overlapping altitudes (Option 3)**: team-lead.md holds the single authoritative numbered execution checklist with full elaboration; SKILL.md holds named phases with one-sentence descriptions only — no numbered list, no execution detail.

This places the authoritative numbered sequence in the file the round's sole executor reads at runtime, and keeps a deliberately lower-stakes overview in the convene-time document. It is one numbered list, not two — which fixes the original defect.

## Why this resolves it (warrant, not vote)

- **The contested evidence cuts toward team-lead.md.** team-lead.md:96 step 2 is a hollow deferral stub that forces the executor to leave its runtime file mid-step. That is an unfinished relocation: the design already located execution in team-lead.md but stopped halfway. Completing the move (filling the stub) removes the bounce; leaving the integers in SKILL.md (Option 1) preserves it.
- **Drift asymmetry.** Execution-drift is fatal, description-drift is tolerable. The authoritative checklist therefore belongs where execution happens; SKILL.md's overview carries only the tolerable failure mode.
- **Strict non-overlap keeps residual drift visible.** SKILL.md names, team-lead.md numbers and elaborates; a name with no matching step is a visible gap, not a silent contradiction.

## Preserved minority caveat (Conservator)

Conservator holds Option 1 and raises a real concern the designer should hear: a prose overview in SKILL.md co-evolving with a checklist in team-lead.md is an *invisible* drift risk, which Conservator judges worse than the current *visible* collision. The verdict adopts Option 3 over this on warrant — the strict-non-overlap rule is built to convert that invisible drift into a visible name/step mismatch — but the caveat is recorded because it is not zero-risk. It converts into a concrete edit-time guard rather than a reason to choose differently.

## Recommended edit (single pass)

1. **team-lead.md** — fill step 2's stub with the actual member-dispatch-and-wait mechanics; team-lead.md owns the full numbered 8-step checklist; remove the rival 1-11 inflation (relocate ledger / checkpoint / designer-response to their existing sections).
2. **SKILL.md** — replace the Phase 4 numbered list with named phases + one-sentence descriptions; remove the dangling "(spec §5)"; add a comment prohibiting re-introduction of a numbered list here (the Conservator-caveat guard).

## Open / deferred

None blocking. The designer's only remaining call is whether to accept the Conservator caveat's residual invisible-drift risk (mitigated by the non-overlap rule + the SKILL.md guard comment) as acceptable.
