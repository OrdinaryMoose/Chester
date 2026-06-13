# Committee Resolution — Specification System Decomposition

**Date:** 2026-06-12
**Sprint:** 20260612-02-expand-committee-responsibilities
**Status:** RATIFIED by designer (Round 04). Committee still convened.

## Decision
Decompose the specification system into **three skills (Option 3S)**:

- **spec-architect** — the architecture-settling precursor. Holds the user-selection gate, the parallel-dispatch competing-architectures step, and the F-A-C checks. Called **only** by the FAC-incomplete entry path (design-small-task). Produces a FAC-complete design.
- **spec-write** — constructive authoring. A pure function of a FAC-complete design; fills the spec template. Called by **both** entry paths. Authors only — no review passes.
- **spec-harden** — verification, independently callable. Runs all three passes in order: **fidelity → adversarial → ground-truth**, plus the user gate. The adversarial pass's authoring context is supplied by **agent continuity** in the normal pipeline (same agent runs spec-write then spec-harden); ad-hoc standalone hardening of an arbitrary spec is a first-class capability, accepting reduced adversarial context. _(Designer override of the committee's relocate-into-write variant — the ad-hoc capability requires all three passes to live in spec-harden, and confirms the standalone second caller.)_

## Why 3S (designer-ratified)
The architect|write|harden seam already exists, clean and non-interleaved, in today's design-specify step sequence. The two entry points differ exactly on the user-selection gate (present on the small-task path, absent on the committee path) — that asymmetry is the seam the decomposition follows, and it is why spec decomposes where plan-build (one entry point) did not. The committee path simply never invokes spec-architect, so no-duplication of architecture work is **structural, not a conditional flag**.

## The shared input type: "FAC-complete design"
spec-write consumes one input type with **two interchangeable producers**:
- a **committee verdict** (FAC-complete by deliberation: four advocacy lenses + researcher ground-truth + warrant record), and
- a **spec-architect output** (FAC-complete by the three-parallel-dispatch F-A-C step).

For the contract to be real, the spec-template's **Architecture field must be made author-agnostic** (it currently encodes a design-specify-authored precondition).

## Converged constraints carried in (4-0, CC1)
- Architecture-settling is skipped for the committee path — no re-derivation.
- The adversarial pass's authoring-context coupling is real; honored by **agent continuity** (spec-write → spec-harden run in the same agent in the normal pipeline). Ad-hoc standalone hardening accepts reduced adversarial context as the cost of the capability. _(Designer override: relocate-into-write rejected because it breaks standalone hardening.)_

## Open implementation details (not yet specified)
1. The exact **FAC-complete design input contract** — the field set spec-write reads, and how a narrative committee verdict maps onto it (Innovator flagged silent-extraction risk: spec-write must quote back the architecture field before authoring).
2. The **spec-template author-agnostic** revision to the Architecture field.
3. The **relocate-adversarial** mechanics inside spec-write (and the authoring-notes fallback definition, if needed).
4. **Caller migration** — every current design-specify caller repointed to the new chain.

## Deliberation provenance
Four rounds. Round 02 established skip-the-redundant-architecture (CF3, 4-0). Round 04 designed and ratified the three-skill decomposition (2-2 split → designer chose 3S). Rounds 01 and 03 were superseded framings (adversarial-independence; who-authors) the designer set aside. Full record in committee/round01–04 + ledger.md.
