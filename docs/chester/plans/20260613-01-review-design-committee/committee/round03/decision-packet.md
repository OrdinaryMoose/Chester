# Per-Round Flow Placement: Two-Altitude Non-Overlap Decision

**Date:** 2026-06-13

**Sprint:** 20260613-01-review-design-committee

**Source:** verdict from `committee/round03/verdict.md`; member positions from `committee/round03/consolidator-output.md`

---

## Summary

The committee was asked to determine the best home for the whole per-round flow on functional merit: specifically, which file holds the authoritative numbered execution checklist — SKILL.md or team-lead.md. The verdict selects Option 3 (two-altitude, strict non-overlap): team-lead.md holds the single authoritative numbered checklist with full elaboration; SKILL.md holds named phases with one-sentence descriptions only and no numbered list. This resolves the current two-checklist failure mode by collapsing to one numbered list in the file the executor reads at runtime, while keeping a deliberately lower-stakes overview in the convene-time document.

## Verdict

The whole per-round flow should be expressed as two non-overlapping altitudes (Option 3): team-lead.md holds the single authoritative numbered execution checklist with full elaboration; SKILL.md holds named phases with one-sentence descriptions only — no numbered list, no execution detail.

This places the authoritative numbered sequence in the file the round's sole executor reads at runtime, and keeps a deliberately lower-stakes overview in the convene-time document. It is one numbered list, not two — which fixes the original defect.

## Rationale

All four members agreed on the structural invariant: exactly one numbered list should exist, and the current two-numbered-list state is the failure mode being fixed. The residual disagreement reduced to a single question — which file holds the integers — and three mutually reinforcing warrants resolved it toward team-lead.md.

First, the step-2 stub at team-lead.md:96 is direct evidence of an unfinished relocation. The step reads "Per-round flow runs — per SKILL.md Phase 4 § Per-Round Flow," a hollow deferral that forces the executor to leave their runtime file mid-step. All three majority members independently identified this: the design already located execution in team-lead.md but did not complete the move. Filling the stub completes that relocation; keeping integers in SKILL.md preserves the bounce.

Second, drift is asymmetric. Execution-drift — a wrong step in the checklist the team-lead runs — is fatal. Description-drift — a stale prose overview — is tolerable. The authoritative numbered checklist therefore belongs where execution happens. SKILL.md's overview carries only the tolerable failure mode.

Third, strict non-overlap makes residual drift visible rather than silent. SKILL.md names phases; team-lead.md numbers and elaborates. Because the representations cover non-overlapping information, a name in SKILL.md with no matching team-lead.md step is a visible gap, not a silent contradiction — which is the current failure mode of two parallel numbered lists.

The Conservator's concern was genuine: a prose overview in SKILL.md co-evolving with a checklist in team-lead.md is an invisible drift risk, which Conservator judges worse than the current visible collision. The majority answers this by noting that the strict-non-overlap construction is designed precisely to prevent the "prose ghost" — SKILL.md carries names only, not a parallel checklist, so drift surfaces as a visible name/step mismatch. A SKILL.md guard comment prohibiting re-introduction of a numbered list converts the caveat into a concrete edit-time safeguard rather than a reason to choose differently.

The recommended edit is a single pass: fill team-lead.md step 2's stub with the actual member-dispatch-and-wait mechanics; remove the rival 1-11 inflation and relocate ledger, checkpoint, and designer-response entries to their existing sections; replace SKILL.md's Phase 4 numbered list with named phases and one-sentence descriptions; remove the dangling "(spec §5)"; add the guard comment.

## Dissent Record

**Alignment:** 3-1

**Dissenting positions:**
- Conservator: Option 1 — authoritative numbered list in SKILL.md; team-lead.md names steps without rival integers — blocking risk: "invisible drift risk worse than the current visible collision"

**Majority positions (for the record):**
- Innovator: Option 3 — SKILL.md carries non-numbered prose description; team-lead.md carries the sole numbered execution checklist
- Pragmatist: Option 3 — whole 8-step numbered sequence in team-lead.md; SKILL.md retains named-phase overview without integers
- Purist: Option 3 (two-altitude, strict non-overlap) — SKILL.md carries named phases with one-sentence descriptions; team-lead.md carries the single numbered checklist with full elaboration

## Deferred / Open

None. The designer's only remaining call is whether to accept the Conservator caveat's residual invisible-drift risk — mitigated by the strict non-overlap rule and the SKILL.md guard comment — as acceptable.

---
