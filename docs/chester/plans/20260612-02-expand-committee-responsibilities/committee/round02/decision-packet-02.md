# Conditional Entry Path for the Spec-Hardening Skill — Round 02 Decision

**Date:** 2026-06-12

**Sprint:** 20260612-02-expand-committee-responsibilities

**Source:** verdict from `committee/round02/verdict.md`; member positions from `committee/round02/consolidator-output.md`

---

## Summary

The committee was asked how the committee/spec workflow should expand to eliminate the token waste that occurs when the spec-hardening skill (design-specify) redundantly re-derives architecture a committee already settled. The verdict is that the committee does not take on spec authorship; instead, the spec-hardening skill gains a conditional entry path — Path B — that consumes the committee's already-settled architecture and skips its redundant architecture front half, proceeding directly to spec authorship and the unchanged three-pass hardening chain. This preserves every existing category boundary while removing the re-derivation cost. One narrow downstream decision remains for the designer: how the committee's output bridges into Path B.

## Verdict

The token waste is eliminated not by expanding the committee into spec authorship, but by giving design-specify a **conditional entry path** that consumes the committee's already-settled architecture and skips its redundant front half — the competing-architecture review, prior-art survey, and architecture selection — proceeding directly to spec authorship and the unchanged three-pass hardening chain. All four members affirm this (4-0), and all four affirm it leaves Round 01's CF1 intact: the committee still does not author specs; design-specify simply stops re-deriving what a committee verdict already terminally produced. Pragmatist pins the saving — design-specify's three-parallel-dispatch architecture step is the dominant token cost, and skipping it removes the re-derivation at near-zero incremental cost. One narrow decision is preserved for the designer: how committee output bridges into the new path. **B1** — design-specify reads the committee's existing output (a flag, an entry contract, or a thin wrapping skill); the committee emits nothing new (Conservator, Pragmatist, Purist). **B2** — the scribe emits a typed, architecture-settled spec-precursor alongside the verdict, and design-specify forks on its presence (Innovator). The split is warranted on both sides and does not collapse on count. Riding on top, uncontested: design-specify's Path B entry contract MUST define what a verdict must contain to qualify as architecture-settled input (Purist: feasibility/suitability/completeness evidence), or Path B builds specs on unverified foundations. The Round 01 adversarial-independence axis (H/M/L) is now decoupled — a separate live decision.

## Rationale

The core insight is that the spec-hardening skill's architecture front half is not load-bearing in all cases. Its purpose is to settle what the design brief left open — competing-architecture review, prior-art survey, architecture selection. When a comprehensive committee has already terminated with settled architecture, that front half is pure redundant spend. All four members verified this logic from the designer's Round 02 reframe and from the spec-hardening skill's own stated purpose.

Pragmatist located the cost precisely: the three-parallel-dispatch architecture step inside the skill's front half is the dominant token expenditure. Skipping it when the committee has already done the work eliminates the re-derivation at near-zero incremental cost — no new committee work, no category collapse.

All four members also confirmed that CF1 — the committee does not author specs — survives intact. The fix lives entirely inside the spec-hardening skill: it skips work it no longer needs to do, rather than the committee doing new work it was never chartered for. This is the symmetric move that avoids Round 01's category-collapse objection.

The 3-1 split on the bridge is genuine and warranted on both sides. Under B1, the committee changes nothing — the spec-hardening skill reads the existing verdict and derives whether architecture is settled from the verdict itself, keyed on a conditional entry contract or a thin wrapping skill that emits an architecture-settled flag. The B1 case has minimum surface: zero change to committee internals, zero new artifact types. Its risk is that the spec-hardening skill must parse and validate a free-form verdict against the entry contract, so the qualifying-input definition carries the integrity risk. Under B2, the committee's scribe emits an architecture-settled spec-precursor alongside the verdict — a structured re-format of existing committee artifacts shaped as clean spec-hardening input. The scribe already reads all the source data, so this is reformatting rather than new derivation. Its advantage is that the spec-hardening skill consumes a typed, purpose-built input rather than parsing a free-form verdict. Its cost is scribe output bifurcation and a requirement that the team-lead declare architecture-focus at convening time so non-architecture consults do not emit a precursor.

Riding across both options, uncontested: whichever bridge is chosen, the Path B entry contract must define what a committee verdict must contain to qualify as architecture-settled input. Purist names the standard as feasibility/suitability/completeness-equivalent evidence. Without that definition, Path B admits unverified verdicts and builds specs on unverified architectural foundations. Conservator's reasoning ties this to prior failure: undefined stage boundaries produced the StoryDesigner rev-a failure. The contract requirement is an authoring-risk resolution, not a reason to reject Path B.

## Dissent Record

**Alignment:**

- 4-0 on the conditional entry path (Path B) as the core mechanism — Conservator, Innovator, Pragmatist, Purist.
- 4-0 on CF1 preserved — the committee does not author specs; the fix lives in the spec-hardening skill.
- 3-1 on the bridge: B1 (no new committee artifact) defended by Conservator, Pragmatist, Purist; B2 (committee scribe emits typed spec-precursor) defended by Innovator.

**Member movement from Round 01:**

- Innovator MOVED: Round 01 held Option H (committee as adversarial pass) as the primary fix; Round 02 shifts to the spec-precursor as the primary fix, with Option H demoted to a separable second-order gain.
- Purist MOVED: Round 01 supported the H-option as primary for the adversarial-independence axis; Round 02 explicitly separates A3 from the token-waste fix, with H/M/L options remaining live but no longer coupled to the entry-path decision.

**Dissenting position on the bridge (3-1 split):**

- Innovator (B2): "The structural fix is not a new branch flag inside design-specify. The structural fix is: the committee emits an architecture-settled spec-precursor alongside its verdict." — blocking risk: Innovator's blocking risk is that under B1, the spec-hardening skill must parse and validate a free-form verdict against an entry contract, placing the full integrity burden on the qualifying-input definition; if that definition is underspecified, Path B admits unverified architecture silently.

- Conservator, Pragmatist, Purist (B1): blocking risk under B2 is scribe output bifurcation — the committee's artifact contract acquires a new conditional section, the team-lead must declare architecture-focus at convening time, and non-architecture consults risk emitting a precursor inadvertently. Conservator's blocking risk additionally cites the undefined-stage-boundary failure mode (StoryDesigner rev-a precedent) as a reason the Path B entry contract must be precisely defined before B1 is safe to use.

## Deferred / Open

- **Bridge choice (designer decision required):** B1 (spec-hardening skill reads existing committee output, committee emits nothing new) or B2 (committee scribe emits a typed architecture-settled spec-precursor). Both options warranted; the committee does not collapse on count.
- **Path B entry contract (ratification required):** design-specify's Path B entry contract must define what a committee verdict must contain to qualify as architecture-settled input — Purist's F-A-C-equivalent evidence standard (feasibility, suitability, completeness). Uncontested; requires designer ratification before Path B is implemented.
- **Adversarial-independence axis (decoupled, still live):** the Round 01 A3 H/M/L choice on the committee's adversarial-independence level is now explicitly separated from the token-waste fix. It remains a live, independent decision for a subsequent round or designer call.

---

<!-- produced-by: scribe / round02 / 2026-06-12 -->

<!-- created-at: 2026-06-12T11:39:58Z -->
<!-- produced-by design-committee@v0022 -->
