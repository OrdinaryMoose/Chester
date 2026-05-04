# Cluster B.1 Design Brief — Define Transition

**Sprint:** `cluster-b-1-define-transition`
**Master Plan:** `20260430-02-rebuild-design-derivation`
**Status:** Approved
**Date:** 2026-05-03

---

## Problem Statement

> *Phase 4b needs a contract surface that accepts untrusted caller submissions, structures them into typed proof elements, and opens the proof.*

The three verbs — **accepts** (boundary), **structures** (4b-internal restructuring), **opens** (proof transition) — partition the contract's work.

---

## Constraint Envelope

### Rules (designer-authored, B.1 only per R8)

| ID | Statement |
|---|---|
| R7 | B.1 rules supersede master plan, cluster B umbrella, and cluster B.2 rules. When a B.1 rule conflicts with an inherited rule, the B.1 rule prevails. |
| R8 | Inheritance from upstream sprints does not auto-load. B.1-authored elements may enter the proof freely. External Rules / Permissions / Evidence require explicit designer ratification before adding. |
| R9 | The caller (any 4a-equivalent agent) cannot be trusted to submit contract information properly. Phase 4b is responsible for correctly formatting and structuring incoming material into the typed proof elements. |
| R1 | Phase 4b has no knowledge of Phase 4a. The contract surface accepts submissions from any caller; Phase 4b's runtime semantics are independent of what produces the submissions. |
| R2 | Phase 4b exposes a contract surface that any generic design system can submit information into. The contract is reusable beyond design-large-task. |
| R3 | Concerns are drafted upstream of the contract (in the caller's domain). The contract receives draft Concerns as part of submission material. |
| R4 | The caller does not validate Concerns. Validation is contract / Phase 4b responsibility. |
| R5 | Phase 4a (and any caller-side mechanism) is out of scope for this sprint. B.1's design subject is Phase 4b's contract surface and the post-submission internal mechanisms only. |
| R6 | The caller makes a single submission to Phase 4b. The transition action between caller and Phase 4b is one-shot; subsequent operations are Phase 4b-internal. |

### Concerns (locked, 5)

| ID | Label |
|---|---|
| CERN-1 | 4b-internal restructuring rigor |
| CERN-2 | Caller-supplied context preservation in construction |
| CERN-3 | Restructuring effort calibration |
| CERN-4 | Restructuring provenance |
| CERN-5 | Caller-intent fidelity check |

Full descriptions in proof state file.

---

## Resolution Criterion

### Resolve Conditions (all ratified)

**RC-1 (anchor CERN-1).** For each typed proof element category that 4b constructs (NC, Evidence, Rule, Permission, Risk, Concern, Resolve Condition), the proof construction process enumerates a required-fields-list and an optional-fields-list. Each required field is annotated with a one-sentence justification naming the downstream proof reasoning operation that depends on that field's presence. A constructed element containing all required fields is admitted to the proof; an element missing any required field after 4b's restructuring efforts is rejected with a diagnostic naming the missing field.

**RC-2 (anchor CERN-2).** 4b's proof construction provides a free-form metadata channel attached to each typed proof element — a structured-but-unvalidated field where 4b may carry context extracted from the untrusted caller submission that downstream proof reasoning does not structurally depend on. Context that downstream reasoning does structurally depend on is elevated to the element's typed required-fields-list per RC-1's discipline. The metadata channel is not validated by the proof; downstream reasoning may read it but may not require its presence to function.

**RC-3 (anchor CERN-3).** Each typed proof element constructed by 4b carries a restructuring action label naming the operation performed: verbatim-preserve, reshape, gap-fill, infer, or derive. Elements where the restructured field value is empty, a placeholder string, or a literal redirect to the metadata channel are rejected as insufficient restructuring.

**RC-4 (anchor CERN-4).** Each typed proof element constructed by 4b carries a provenance record identifying (a) the source caller material citation (id, position, or quoted excerpt), (b) the restructuring action label per RC-3, and (c) the 4b-internal reasoning chain producing the field-level result when the action is reshape, gap-fill, infer, or derive. Verbatim-preserve actions require only the source citation.

**RC-5 (anchor CERN-5).** After restructuring completes and before the proof opens for downstream reasoning, 4b produces a restructuring report listing each constructed element's provenance per RC-4 and the original caller material it derives from. The report is observable to the caller or designer before proof open. If the interpretation diverges from intent, a new single-shot submission per R6 may be initiated; 4b discards the prior proof and restarts construction. No in-band amendment to a partially-built proof is permitted.

---

## Coverage Map

| Concern | RC | NC enforcement |
|---|---|---|
| CERN-1 — Restructuring rigor | RC-1 | NCON-2 forces RC-1 internal |
| CERN-2 — Context preservation | RC-2 | NCON-2 forces RC-2 internal |
| CERN-3 — Effort calibration | RC-3 | NCON-1 (phase exists) + NCON-3 (RC-3 gated at open) |
| CERN-4 — Provenance | RC-4 | NCON-1 (phase exists) + NCON-3 (RC-4 gated at open) |
| CERN-5 — Intent fidelity | RC-5 | NCON-1 (phase exists) + NCON-3 (RC-5 gated at open) |

5/5 Concerns covered. Every active RC under at least one NC's constraint role. No phantom NCs.

---

## Necessary Conditions

### NCON-1 — Restructuring is a discrete phase

**Statement.** 4b's contract surface implements three sequential phases: (1) accept submission, (2) restructure into typed proof elements, (3) open the proof. The restructure phase must be discrete, named, and observable.

**Grounding.** R9, R6, EVID-1 (existing initialize_proof boundary), EVID-3 (design-specify needs structured downstream input).

**Reasoning.** IF caller is untrusted (R9) AND 4b owns structuring (R9) AND submission is one-shot (R6) AND the existing proof MCP exposes initialize_proof as the proof-open boundary (EVID-1) AND design-specify downstream requires structured constraint envelope + resolution criterion + coverage map (EVID-3) THEN restructuring must be a discrete observable phase between accept and open, not implicit.

**Collapse test.** Without distinct restructuring phase, RC-3/RC-4/RC-5 have no place to attach; provenance and effort discipline can't gate; half-assing prevention dissolves; design-specify receives unstructured material.

**Rejected alternatives.**
- Inline restructuring during proof reasoning — provenance can't gate; restructuring becomes implicit.
- Pre-validate at submission boundary — contradicts R9 (caller untrusted, can't gate caller-side compliance).
- Merge restructure into open — loses the gate point for RC-5's pre-open report.

### NCON-2 — Boundary is permissive

**Statement.** The contract surface accepts any submission shape without structural rejection. All rigor lives in the 4b-internal restructuring phase.

**Grounding.** R9, R2, R4, EVID-5 (assume-guarantee patterns place rigor at receiver when senders are heterogeneous — B-Method, SPARK, JML, Eiffel).

**Reasoning.** IF caller is untrusted (R9) AND contract is generic for any caller (R2) AND caller doesn't validate (R4) AND industry assume-guarantee patterns place rigor at receiver when senders are heterogeneous (EVID-5) THEN the boundary must accept any submission; rejection at boundary would require defining caller-side validation, violating R9.

**Collapse test.** If boundary rejects on structure, 4b assumes valid input downstream; RC-1's restructuring discipline becomes redundant; CERN-3/4/5 dissolve because there's nothing to restructure; the contract loses its generic-caller property (R2).

**Rejected alternatives.**
- Minimum-schema validation at boundary — pulls validation to caller side, violating R9.
- Reject empty submissions — still requires defining 'empty,' violating untrusted assumption.
- Accept-with-warnings — same boundary-validation problem in softer form; warnings imply caller-side correction loop, contradicting R6.

### NCON-3 — Proof open is gated by RC artifacts

**Statement.** The proof open event must verify presence of restructuring action labels (RC-3), provenance records (RC-4), and the restructuring report (RC-5) per constructed element. Open is refused if any artifact is missing.

**Grounding.** R9, R6, EVID-4 (compiler frontends preserve translation provenance per AST node), EVID-6 (declared-but-unconsumed artifacts is the dominant industry stage-handoff failure mode), RCON-3, RCON-4, RCON-5.

**Reasoning.** IF caller is untrusted (R9) AND submission is one-shot with no recourse (R6) AND compiler frontends preserve translation provenance per AST node (EVID-4) AND declared-but-unconsumed flow artifacts is the dominant industry stage-handoff failure mode (EVID-6) AND the half-assing failure mode is gated by the three RC artifacts THEN open must verify artifacts before transitioning. Without the gate, lazy 4b admits half-restructured elements and the artifacts become the next declared-but-unconsumed failure case.

**Collapse test.** Without open gate, RC-3/4/5 are advisory only; lazy 4b skips them; CERN-3/4/5 reopen as live failure modes; R9's caller-untrusted assumption produces unverifiable proof state; restructuring artifacts become declared-but-unconsumed (matching EVID-6's failure pattern).

**Rejected alternatives.**
- Self-policing during restructuring — assumes 4b's good faith, contradicts CERN-3's premise.
- Post-open audit — distortion already in proof; downstream reasoning operates on bad data; R6's one-shot constraint means caller cannot correct.
- Sampling check — partial coverage leaves gaps lazy 4b can exploit.

---

## Evidence

| ID | Source | Statement |
|---|---|---|
| EVID-1 | codebase | Phase 4b's existing proof MCP exposes initialize_proof, manage_concerns, ratify_resolve_condition, and submit_proof_update tools. The current API surface accepts a single initialize_proof call (problem_statement + state_file) plus post-init element operations. |
| EVID-2 | codebase | Cluster A's Resolve Condition model carries problem_anchor (single Concern ID), sequential designer ratification (one element_id per ratify call), and structural mapping to Concerns only (no NC anchor). |
| EVID-3 | codebase | design-specify (downstream consumer of Phase 4b output) requires three artifacts per master-plan: constraint envelope, resolution criterion, coverage map. |
| EVID-4 | industry | Compiler frontends (LLVM, GCC, Roslyn) and source-to-source translators preserve source location and translation provenance per AST node. Provenance-during-translation is the industry-standard solution to the translation-blackbox problem. |
| EVID-5 | industry | Assume-guarantee contract patterns (B-Method clauses, SPARK contracts, JML preconditions, Eiffel design-by-contract) place validation rigor at the receiver when senders are heterogeneous or untrusted. |
| EVID-6 | industry | The existing problemfocused MCP flow declares Solve Leakage Ledger as Phase-4b seed material with no consuming step in the skill text. Declared-but-unconsumed flow artifacts is the dominant industry-reported failure mode for stage handoffs. |

---

## Closing Argument Summary

The proof's design space partitions into three structural commitments (NCs):
- **NCON-1** establishes the discrete restructuring phase (the home for all RC artifacts).
- **NCON-2** locks the boundary as permissive (forcing rigor inward to the restructuring phase).
- **NCON-3** gates proof open on RC artifact presence (forcing RC discipline from advisory to load-bearing).

Together these three NCs resolve all 5 Concerns through the 5 RCs. No phantom NCs (no withdrawals during Solve). Every active RC appears under at least one NC's constraint role.

---

## Handoff to design-specify

**Constraint envelope.** 9 Rules + 5 Concerns above.

**Resolution criterion.** 5 RCs above.

**Coverage map.** Coverage Map table above.

**Architectural choices remaining for design-specify.**
- Concrete shape of the typed proof elements per category (field schemas; what's in each required-fields-list with load-bearing justifications per RC-1).
- Concrete shape of the metadata channel (per-element field structure per RC-2).
- Concrete shape of the restructuring action label format and provenance record schema per RC-3 and RC-4.
- Concrete shape of the restructuring report (RC-5) — render format, surfaces, caller observability mechanism.
- Implementation of the open-gate verification (NCON-3) — where in the proof MCP code the verification fires, what failure mode (refuse open vs. degrade to warning).
- Three-phase boundary mechanics (NCON-1) — whether the three phases are separate MCP tool calls, internal stages of one tool call, or some combination.

**Out of scope (B.1).** Phase 4a (any caller-side mechanism) — see R5. Closure protocol, per-turn Solve flow, any 4b-internal mechanism beyond the contract surface and restructuring phase.

---

## Proof State Artifact

Full proof: `cluster-b-1-define-transition-proof-state.json` (sibling file).

- 9 Rules
- 6 Evidence (4 codebase, 2 industry)
- 5 Concerns (locked)
- 5 Resolve Conditions (all ratified)
- 3 Necessary Conditions (Evidence-grounded, with rejected alternatives and collapse tests)
- 4 revisions
- Round 7 at closure

<!-- created-at: 2026-05-04T08:09:32Z -->
<!-- produced-by design-large-task@v0010 -->
