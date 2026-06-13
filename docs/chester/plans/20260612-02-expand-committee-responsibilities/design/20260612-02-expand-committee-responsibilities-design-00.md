# Design Brief: Decompose the Specification System into spec-architect / spec-write / spec-harden

**Status:** Approved (committee-adjudicated, designer sign-off complete)
**Date:** 2026-06-12
**Sprint:** 20260612-02-expand-committee-responsibilities
**Provenance:** Four-round design committee (team-lead + four advocacy members + researcher). Full record at `docs/chester/working/20260612-02-expand-committee-responsibilities/committee/` (rounds 01–04, ledger, resolution).

## Problem Statement

The specification stage of Chester is one skill, `design-specify`, that fuses three distinct jobs: settling the architecture (compare competing approaches, survey prior art, run feasibility/suitability/completeness checks, take a user selection), authoring the spec document from the chosen architecture, and hardening that spec through review passes.

Two entry points feed the specification stage, and they differ on exactly one property — whether the architecture is already settled:

- **design-small-task** produces a FAC-**incomplete** design. Its brief has no architecture field, no F-A-C evidence, no competing-axis evaluation. The architecture still needs settling.
- **design-committee** produces a FAC-**complete** design. Its verdict carries a chosen direction, rejected alternatives, and feasibility/suitability/completeness reasoning across four independent lenses plus researcher ground-truth.

Because `design-specify` always runs its architecture-settling stage, a committee-sourced design gets its architecture **re-derived**. Observed in 100% of real committee→design-specify hand-offs: the spec agent reports that all FAC considerations are already complete and that it is inventing trivial A/B architecture choices solely to execute its process. This duplicates settled work and spends significant tokens before any hardening begins.

The goal is a dataflow invariant: **settled architecture is consumed, never re-derived** — while still serving the FAC-incomplete path that genuinely needs architecture settled.

## Prior Art

- **`design-specify` (current).** Its step sequence already separates the three jobs cleanly and non-interleaved: architecture-settling (read brief + competing-architectures/prior-art/selection), spec construction (one template-fill step), hardening (fidelity subagent → adversarial inline → ground-truth subagent → user gate). The seam exists; it is simply not expressed as skill boundaries.
- **`plan-build`.** The only other Chester skill with an explicit settle → construct → verify shape, and it keeps all three phases inside one skill. It is *not* a counter-precedent here: `plan-build` has a single entry point, so it has no user-selection-gate asymmetry to express. The specification stage has two entry points that differ precisely on that gate.
- **Committee Round 02 (CF3, 4-0).** Established that the committee-fed path must skip the architecture-settling work — the originating finding this brief implements structurally.
- **Spec-template section analysis (committee Round 04 research).** The template's sections classify into architecture-derived (Architecture field, Components, Data Flow, Acceptance Criteria), mechanically-constructed-from-settled-design (Goal, Constraints, Non-Goals, Error Handling, Testing Strategy), and hardening-added corrections. The Architecture field is the structural pivot every architecture-derived section depends on.

## Design Decisions

### D1 — Decompose the specification stage into three skills

`design-specify` is split along its already-clean seam into `spec-architect`, `spec-write`, and `spec-harden`.

**Rejected alternative:** Keep `design-specify` whole and add a conditional ("Path B") entry that skips architecture-settling for FAC-complete input (committee Option 1S, ~3-5 edit points vs ~15-20). Rejected because the conditional lives as a branch inside a skill that keeps accreting, yields no reusable pieces, and the seam is already clean enough to cut. The designer chose the structural investment over the minimal patch.

### D2 — `spec-architect`: the architecture-settling precursor

Holds the user-selection gate, the parallel competing-architectures dispatch, the prior-art survey, and the F-A-C checks. Produces a FAC-complete design. **Invoked only by the FAC-incomplete entry path (design-small-task).**

### D3 — `spec-write`: constructive authoring, a pure function of a FAC-complete design

Fills the spec template from a settled design. Invoked by **both** entry paths. It performs no architecture selection — it consumes settled architecture as input. Because there is no architecture stage inside `spec-write`, the committee path cannot trigger re-derivation: the invariant is satisfied by construction.

### D4 — `spec-harden`: verification, independently callable, three passes

Runs all three review passes in order — **fidelity → adversarial → ground-truth** — plus the user gate. Consumes a completed spec plus codebase access, and the originating design for goals-coverage (fidelity) and authoring context (adversarial). Independently callable: any spec can be passed into `spec-harden` ad-hoc (see D11).

### D5 — The adversarial review pass stays in `spec-harden`; its context comes from agent continuity, not relocation

The adversarial pass remains one of `spec-harden`'s three passes. Its authoring-context dependency is satisfied by **agent continuity**: in the normal pipeline the same agent runs `spec-write` and then continues directly into `spec-harden`, so the architecture sacrifices, prior-art findings, and brief intent are already in context when the adversarial pass runs. No relocation and no serialized artifact are needed in the common case.

**Rejected alternative:** Relocate the adversarial pass into `spec-write` as its final step (committee Innovator variant). Rejected: it would prevent `spec-harden` from being invoked standalone on an arbitrary spec, which is a required capability (D11) — a spec authored elsewhere, or re-hardened later, must still get a full three-pass review. Keeping all three passes in `spec-harden` preserves that ad-hoc capability.

### D6 — "FAC-complete design" is a shared input type with two interchangeable producers

`spec-write` consumes one input type, satisfied by either:
- a **committee verdict** (FAC-complete by deliberation: four advocacy lenses + researcher ground-truth + warrant record), or
- a **`spec-architect` output** (FAC-complete by the three-parallel-dispatch F-A-C step).

The two entry points stop being special cases and become two implementations of one type.

### D7 — The spec-template's Architecture field becomes author-agnostic

The field currently encodes a `design-specify`-authored precondition. It must be neutral so both producers satisfy the same contract. This is the enabling edit for D6.

### D8 — No-duplication is structural, not gated

The committee path never invokes `spec-architect`. There is no conditional flag deciding whether to skip architecture work — the skip is the absence of a call. This is the structural form of Round 02's CF3.

### D9 — The FAC-complete input contract is a fixed field set `spec-write` extracts, with mandatory architecture quote-back

`spec-write` consumes one normalized input — a "FAC-complete design" — defined as a fixed set of eight fields regardless of producer. `spec-write` **extracts** these fields from the producer's native output (committee verdict, or `spec-architect` output); producers emit no new typed artifact. Before authoring any spec section, `spec-write` reads and **quotes back the chosen-architecture field** for confirmation — that field is the pivot every architecture-derived section depends on.

The eight fields and their spec-template destinations:

- **Goal** → spec Goal (both producers carry it directly)
- **Chosen architecture** → spec Architecture field (committee: verdict's chosen direction; architect: selected option) — the quote-back field
- **Rejected alternatives + declared sacrifices** → architectural rationale + Constraints
- **Prior-art findings** → Components / reuse notes + adversarial-pass context
- **Ground-truth-verified facts** → Components + Data Flow, consumed without re-verification (committee researcher findings; architect path re-verifies in `spec-harden`)
- **Constraints / guardrails** → spec Constraints
- **Acceptance-criteria seeds** → AC-N.M expansion
- **Deferred / non-goals** → spec Non-Goals

**Rejected alternatives:**
- Producers emit a typed FAC-bundle artifact (the committee scribe writes a structured bundle alongside its verdict) — rejected as primary (adds a committee output mode, re-introduces the artifact-bifurcation cost set aside in Round 02); retained as a fallback if extraction-with-quote-back proves unreliable.
- No quote-back, trust extraction silently — rejected: leaves the silent-mis-extraction risk live, the one failure hardening structurally cannot catch.

### D10 — The spec-template Architecture field is rewritten to be producer-neutral

The Architecture field records *what* was settled and *on what basis* — never *how* or *who*. It captures: the chosen architectural direction, its FAC basis (feasibility/suitability/completeness evidence), and the rejected alternatives + declared sacrifices. A separate one-line provenance note names the producer (committee verdict, or `spec-architect`) for traceability but is **not** part of the contract `spec-write` reads.

This is the enabling edit for D6: the field today bakes in "chosen from the design-specify hybrid step," a one-producer precondition. Describing the settled *result* instead of the settling *process* lets one field accept both producers without `spec-write` branching on origin.

**Rejected alternatives:**
- Producer-specific Architecture fields (one shape for committee-settled, one for architect-settled) — rejected: defeats the shared-type purpose of D6/D7 and forces `spec-write` to branch on producer, the conditional-inside-a-skill shape 3S exists to avoid.

### D11 — `spec-harden` runs fidelity → adversarial → ground-truth; standalone ad-hoc hardening is a first-class capability

`spec-write` authors only (extract FAC fields, quote back architecture, write, emit). The emitted spec passes to `spec-harden`, which runs three passes in order: **fidelity** (spec vs. originating design — goals coverage), **adversarial** (structural integrity, unstated assumptions, contract gaps, concurrency hazards, file:line evidence), **ground-truth** (spec vs. codebase), then the user gate.

The adversarial pass's authoring context is served two ways:
- **Normal pipeline** — the same agent runs `spec-write` then continues into `spec-harden`, so authoring context is present by continuity. No transfer, no artifact.
- **Ad-hoc** — any spec can be passed directly into `spec-harden` standalone (a spec authored elsewhere, or re-hardened later). The adversarial pass then runs from the spec plus the originating design; authoring context is reduced, accepted as the cost of the standalone capability.

This makes `spec-harden` a genuinely independent verification skill with a confirmed second caller (ad-hoc hardening) — which is the standalone-reuse property that justified the 3S decomposition in committee Round 04.

**Rejected alternatives:**
- Relocate adversarial into `spec-write` (old D5/Innovator) — rejected: breaks the ad-hoc standalone-hardening requirement.
- Authoring-notes artifact serialized from `spec-write` to `spec-harden` (Purist) — not needed in the normal flow (agent continuity supplies context); unnecessary machinery.

### D12 — `design-specify` is replaced by extraction, atomic cutover; `spec-harden` inherits the `plan-build` transition

`design-specify` is decomposed **by extraction, not rewrite**: its current steps already fall on the seam, so they move into the three skills largely intact — architecture-settling steps → `spec-architect`, the authoring step → `spec-write`, the three review passes + user gate → `spec-harden`. `design-specify` is then **deleted** in the same sprint (atomic cutover, no parallel deprecated copy).

Pipeline rewiring:
- Small-task path: `design-small-task` → `spec-architect` → `spec-write` → `spec-harden` → `plan-build`.
- Committee path: committee verdict → `spec-write` → `spec-harden` → `plan-build`.
- `spec-harden` (last spec-stage skill on both paths) inherits `design-specify`'s transition to `plan-build`.
- Every `design-specify` reference repointed: `design-small-task` Integration transition, standalone-invocation entry, the regenerated skill catalog (`skill-index.md`), CLAUDE.md / docs mentions.

Caller count ~8 files / 15-20 edit points (Pragmatist grep); the exact file list is mechanical and enumerated by `plan-build`, not pre-committed here.

**Rejected alternatives:**
- Keep `design-specify` as a deprecated alias during a transition window — rejected: no external callers need a grace period, and two coexisting spec pipelines invite the duplication this effort removes.
- Rewrite the three skills from scratch rather than extract — rejected: discards proven hardening behavior CC1 forbids regressing; extraction preserves it by construction.

## Scope

### In scope

- Decomposing `design-specify` into `spec-architect`, `spec-write`, `spec-harden`.
- Defining the "FAC-complete design" input contract `spec-write` consumes (the field set, and how a narrative committee verdict maps onto it).
- Making the spec-template Architecture field author-agnostic.
- Keeping all three review passes in `spec-harden` (fidelity → adversarial → ground-truth); `spec-write` authors only.
- Supporting standalone ad-hoc invocation of `spec-harden` on an arbitrary spec.
- Repointing both entry paths: small-task → `spec-architect` → `spec-write` → `spec-harden`; committee → `spec-write` → `spec-harden`.
- Migrating existing `design-specify` callers to the new chain.

### Out of scope

- **The authoring-notes-artifact mechanism** — _not needed_: agent continuity (D5/D11) supplies the adversarial pass its authoring context in the normal flow; the serialized artifact is unnecessary.
- **Changing committee or design-small-task internals** — _not needed_: both already produce what their path requires; only the downstream wiring changes.
- **The adversarial-pass independence question (Round 01 H/M/L)** — _not now_: explicitly decoupled in deliberation; a separate future decision.

## Constraints

- **CC1 (committee-converged, 4-0):** architecture-settling is skipped for the committee path, and the adversarial pass's authoring-context coupling must be honored. _(normative — source: committee Round 04 converged constraint.)_
- The three hardening behaviors must not regress relative to current `design-specify` — the chain has a track record of catching HIGH findings (wrong DTO fields, wrong DI lifetimes, wrong file paths). _(normative — source: committee Conservator blocking risk + researcher Pair F.)_
- `spec-harden`'s fidelity pass needs the originating design (committee verdict or brief) to check goals coverage; without it, it degrades to internal-consistency only. _(structural.)_

## Assumptions

- **"A committee verdict carries enough to fill the FAC-complete input contract without a structured schema today."** — UNTESTED. The verdict is narrative, not typed. D6's contract definition must bridge this; if it cannot, `spec-architect`-style normalization of committee output may be required.
- **"The architect | write | harden seam stays clean once expressed as skill boundaries."** — Rests on the research finding that current steps are non-interleaved; holds unless caller migration surfaces a hidden coupling beyond the adversarial pass.

## Residual Risks

- **Silent architecture mis-extraction (Innovator).** `spec-write` filling the Architecture field incorrectly from a verbose committee verdict — hardening verifies against the spec, not the design intent, so it would not catch a wrong-from-the-start architecture. Mitigation: `spec-write`'s committee-path entry must read and quote back the architecture field before authoring any spec section.
- **Reduced adversarial context on the ad-hoc path.** A spec passed into `spec-harden` standalone (D11) runs its adversarial pass without authoring continuity — context is the spec plus originating design only. Accepted trade for standalone hardening; the normal pipeline retains full context via agent continuity.
- **Caller-migration breakage.** Every current `design-specify` caller must repoint to the new chain; a missed caller leaves a path on the old monolith.

## Acceptance Criteria

- A committee-sourced design flows committee → `spec-write` → `spec-harden` and produces a hardened spec **with no architecture-settling step executed** (no competing-architecture dispatch, no invented A/B choices).
- A small-task design flows design-small-task → `spec-architect` → `spec-write` → `spec-harden` and produces a hardened spec with architecture settled by `spec-architect`.
- `spec-write` consumes the same "FAC-complete design" input type from both producers; the spec-template Architecture field is author-agnostic.
- The adversarial review runs inside `spec-harden`; in the normal pipeline it has full authoring context via agent continuity, and `spec-harden` can also be invoked standalone on an arbitrary spec.
- The three hardening behaviors (fidelity, adversarial, ground-truth) are all present and demonstrably no weaker than current `design-specify` on a representative spec.
- No remaining caller invokes the old fused `design-specify`.

## Deferred / Open

All four design decisions left open at first draft are now resolved in **D9** (FAC-complete input contract), **D10** (author-agnostic Architecture field), **D11** (`spec-harden` three-pass sequence + ad-hoc capability), and **D12** (extraction + atomic cutover). The brief is self-contained.

One mechanical item remains for `plan-build`, not a design decision: the exact file-by-file caller-migration list for D12 (sized at ~8 files / 15-20 edit points; enumerated during planning).
