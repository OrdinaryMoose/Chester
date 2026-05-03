# Cluster B.2 Design Brief — Phase 4b Closing-Argument Materialization

**Sprint:** `20260430-02-rebuild-design-derivation / cluster-b-2-define-solve-closing`
**Status:** Approved (designer go-ratified per NCON-4 two-yes model, 2026-05-02)
**Date:** 2026-05-02

---

## 1. Problem Statement (designer-ratified)

The design proof produces a structured trail of Concerns, Necessary Conditions, Resolution Conditions, Rules, Permissions, Risks, and Evidence during the Solve stage. At closure, that trail must be transformed into a **closing argument** — a single self-contained artifact the designer reads in one pass to decide whether the proof closes. The shape of the argument, when it is generated, how it is derived, what it must contain, how the designer engages with it, and how the close happens were unspecified before this design.

---

## 2. Resolution Conditions (the spine)

The set of RC is the solution (per S-RULE-10). These seven RCs taken together are the cluster B.2 design.

| RC  | Statement |
|-----|-----------|
| **RC1 — Composition** | The closing argument walks the live set of resolution conditions end to end. The walk is the design's case for itself. |
| **RC2 — Trigger** | The closing-argument cycle starts only when composite proof-state measures clear a threshold — per-signal floors, an aggregate score, and an integrity-zero check. Not agent open-ended judgment. |
| **RC3 — Derivation** | The closing argument is derived from current proof state as a pure read; the same state always produces the same argument. Read-only and idempotent. |
| **RC4 — Closure gate** | Closure happens only when the designer first consents to view the closing argument and then says "go" against it in the same round. The "go" IS the ratification. Any state-mutating proof call clears both consents. |
| **RC5 — Engagement** | The designer reads the whole argument in one pass. No per-section ratification ritual, no required interactive zoom. The artifact must therefore stand on its own. |
| **RC6 — Phantoms** | Withdrawn NCs and revised-cleared RCs do not vanish. The argument names every phantom with a closed-set disposition tag. |
| **RC7 — Friction** | The agent watches for four friction shapes, stores detected friction as proof state with a closed-set disposition, and the designer may override or dismiss. The closing argument walks the live friction list. |

---

## 3. Necessary Conditions (the grounding)

Each RC is grounded by a corresponding NC.

- **NCON-1 — RC-spine composition.** The closing argument's body is a walk of every live RC, each tied back to its grounding (NCs, Evidence, Rules). Anchored by S-RULE-10.
- **NCON-2 — Trigger composite.** The agent may request presentation only when (i) every per-signal measure clears its floor, (ii) the aggregate composite score clears the threshold, and (iii) the integrity-zero check passes. Triple condition borrows shape from cluster-B understanding-stage transition gate.
- **NCON-3 — Derivation read-only and idempotent.** The closing argument is derived as a pure read over current proof state per approved presentation request. Re-derivation against unchanged state produces an identical artifact. Structured-data-vs-prose implementation choice deferred to design-specify.
- **NCON-4 — Two-yes closure gate.** `closure_permitted` holds only when, in addition to the ten existing conditions, the designer has chosen "go" in the current round against a closing argument that was presented in the current round per NCON-3. The "go" choice IS the ratification — there is no separate ratification act. The "back to solve" choice is the rejection and triggers normal mutating work. Both flags clear on any subsequent state-mutating proof tool call.
- **NCON-5 — Gestalt single read on self-contained artifact.** The designer's review is a single go-or-back decision against the whole artifact, taken in one read pass. The artifact must be self-contained — readable end to end without per-section ratification, external lookups, or required interactive expansion. Re-derivation per NCON-3 remains available on designer request but is not a closure prerequisite.
- **NCON-6 — Phantom elements with closed dispositions.** The closing argument includes every phantom NC and phantom RC — elements live in any prior round and later withdrawn or revised-cleared — each tagged with a disposition drawn from a closed set: *consolidated, superseded, found-redundant, found-incorrect, scope-removed*. Layout within the artifact is design-specify.
- **NCON-7 — Friction agent-detected, proof-tracked, designer-overridable.** The agent detects friction at each proof round per a closed rule set (NC-NC opposing pull, RC-Rule conflict, Permission-Risk linkage, Concern-Concern competition). Detected friction is stored as proof state with a disposition from a closed set: *lived-with, relieved-by-exception, dissolved-by-revision, dissolved-by-scope-cut, not-really-friction*. Agent assigns initial disposition; designer may override or dismiss. Dissolved or dismissed friction transitions to phantom friction per NCON-6. Closure does not block on lived-with friction; the close act under NCON-4 is the acceptance.

---

## 4. Rules (M / B / S Decomposition)

The numbering convention `M-RULE-N` (master-inherited), `B-RULE-N` (cluster-B-inherited), `S-RULE-N` (this sprint) decomposes the original B-RULE-22 four-property requirement into internal load-bearing rules.

### M-Rules (master-inherited)
- **M-RULE-1** Design self-containment — exclusions need rationale; missing "why" makes correct cuts look like gaps.

### B-Rules (cluster-B-inherited)
- **B-RULE-20.1** Agent may propose concern changes or propose new concerns at any time, subject to designer approval.

### S-Rules (this sprint)
- **S-RULE-1** Presentation gating — closing argument is presented only via the two-yes model per NCON-4.
- **S-RULE-2** Request grounding — the agent's request to move to closing argument is grounded in objective measures, not agent open-ended judgment.
- **S-RULE-7** Living-document — the closing argument always reflects current proof state; mutation clears prior consents.
- **S-RULE-10** The set of RC is the solution.

(B-RULE-22 itself dissolved via decomposition into the M/B/S rules above.)

---

## 5. Live Friction (named, accepted)

- *RC4 (gestalt close) vs RC5 (self-contained one-pass artifact).* The gate trusts the designer's single read; the artifact must therefore carry enough to support that trust. **Disposition: lived-with.** The artifact discipline (M-RULE-1) is the answer; if the artifact cannot stand alone, the design does not close.
- *RC4 (designer's close act IS acceptance) vs strict tradition (unresolved friction blocks closure).* Conservative stance keeps authority with the designer; strict stance would add a closure precondition. **Disposition: lived-with.** Closure does not block on unresolved friction; the close act accepts it.

---

## 6. Withdrawn Paths (Phantoms)

| Phantom | Disposition |
|---------|-------------|
| Multi-topic rounds | scope-removed (single-topic discipline now governs design conversations) |
| "Render" as coined alias for "present" | dismissed (no-coined-terms rule) |
| C2/C3 split for closure-gate integration | dismissed-as-non-distinction (post-presentation choices are binary) |
| F3 (designer-marked friction) and F1 (render-time-only friction) | superseded by F4 |
| Agent open-ended judgment as the cycle trigger | superseded by S-RULE-2 (objective measures) |
| Original M-RULE-6, M-RULE-8, M-RULE-9, M-RULE-10 | scope-removed |
| B-RULE-22 as load-bearing reference for the four properties | superseded (decomposed into M/B/S internal rule numbering) |

---

## 7. Closure Gate Integration (the diff against existing closure_permitted)

`closure_permitted` previously held when ten sequential conditions cleared (six original + four added by cluster A). NCON-4 adds an **eleventh coupled condition**:

> The designer has chosen "go" in the current round against a closing argument that was presented in the current round per NCON-3.

Mutation discipline: any tool call that mutates Concerns, NCs, RCs, Rules, Permissions, Risks, or Evidence clears both the approved-presentation flag and the go-flag. The set of mutating calls is closed and small; design-specify settles the implementation surface.

---

## 8. What design-specify Must Produce

- **Closing-argument derivation function** — pure read over current proof state, deterministic, supporting NCON-3 idempotency.
- **Friction element type / store** — proof MCP gains a friction element class with the closed disposition set per NCON-7.
- **Friction detection rules** — implementation of the four detection shapes per NCON-7.
- **Composite trigger evaluator** — the per-signal-floor + aggregate-threshold + integrity-zero composite per NCON-2.
- **Two-yes flag store + mutation hooks** — approved-presentation flag and go-flag, with clear hooks on every mutating proof call per NCON-4.
- **Layout choices** — phantom layout (inline / sectioned / chronological) and friction layout within the closing argument.
- **Structured-data-vs-prose decision** — whether the closing argument is structured rendered output or LLM-composed prose against structured input. Both satisfy NCON-3.

---

## 9. Deferred Items (out of scope)

- **Closure-baseline audit** — empirical analysis of 10–15 historic proofs to validate the four-property requirement's coverage of real failure modes. Flagged in cluster-B handover; remains pending future empirical work.
- **Concern → RC traceability matrix shape** — RC walk presupposes Concerns are anchored to RCs; whether that traceability is implicit (text reference) or explicit (structured pointer) is design-specify.
- **Re-derivation interactive surface** — the designer-may-ask-for-zoom path under NCON-5; whether and how the conversation surface presents that ask is design-specify.

---

## 10. Inheritance Acknowledgments

- Cluster A (cluster-a-define-solve) — RC element type, four cluster-A closure-gate conditions, designer-ratified RC five attributes, deprecation of "Acceptance Criteria."
- Cluster B (cluster-b-define-transition) — handover document framing the four-property closing-argument requirement, the closure-baseline audit pointer, the proof-MCP transition mechanism.
- Master plan `20260430-02-rebuild-design-derivation` — vocabulary lock, RULE-1 through RULE-10 inheritance, three-layer discipline, the resolution-claim five attributes.

---

## 11. Sprint-Finish Pending Items

- **Naming sweep:** CERN → CN rename across all session artifacts (state.js, handover docs, prior cluster references). Per designer rule from session start.
- **Proof MCP version gap:** marketplace plugin cache refresh required before cluster B.1 begins; current proof MCP loaded by this session predates cluster A's additions (no `manage_concerns`, no `ratify_resolve_condition`, no RESOLVE_CONDITION element type). Concerns and RCs were tracked conceptually in this session; the design itself does not depend on which version is loaded.

---

**End of design brief.**
