# Cluster D — Proof Layer CRUD Requirements

**Status:** Working analysis. Captured 2026-05-06. Source-of-truth for CRUD-completeness coverage across the closed proof element set until promoted into Resolve Conditions or Rules.

**Lens:** Apply Create / Read / Update / Delete to every element type in the closed proof-layer language. CRUD-completeness is the diagnostic; gaps are the design subject.

**Why this matters:** Most failures in long-lived structured-data systems come from update and delete paths, not create paths. The proof layer's create story is well covered by inherited cluster A / B.1 work. Update and delete are inconsistent across types and several have outright holes.

---

## Closed Element Set

Nine element types plus Definition (G1 path proof-state extension):

NC, Evidence, Rule, Permission, Risk, Concern, Resolve Condition, Friction, Phantom, Definition.

Phantom is a withdrawal-derived state, not a directly-created element.

---

## Operation Coverage

### Create

| Element | Mechanism | Status |
|---------|-----------|--------|
| NC | `submit_proof_update`; `open_proof` seed | Closed |
| Evidence | `submit_proof_update`; closed `source` enum | Closed |
| Rule | `submit_proof_update` (designer-only per RULE-18.2) | Closed |
| Permission | `submit_proof_update` | Closed |
| Risk | `submit_proof_update` | Closed |
| Concern | `manage_concerns add`; `open_proof` seed | Closed |
| Resolve Condition | `submit_proof_update` as Draft | Closed |
| Friction | `manage_friction` | Closed |
| Phantom | Derived (withdrawal transition) | N/A |
| Definition | `manage_definitions` proposed but not built | **Gap** |

### Read

- All types via `get_proof_state` (full structural read).
- Derived narrative via `present_closing_argument`.
- **Weak spot:** Round-trip readability mechanism (CN-D-12) for designer-facing surface — architectural commitment to one-system, no mechanism designed.

### Update

| Operation | Coverage |
|-----------|----------|
| In-place revision (any element) | **Underspecified.** `revisionLog` exists; tool path implicit. RULE-13 and RULE-18 were revised this session via `submit_proof_update`-shaped path. No explicit `revise_element` API. |
| Concern Draft → Ratified | `manage_concerns lock`. Closed. |
| RC Draft → Ratified | `ratify_resolve_condition`. Closed (single-element shape). |
| NC Draft → Ratified | Bulk-at-closing-argument agreed; tool surface for bulk operation **unclear**. |
| Definition Draft → Ratified | **Gap.** No transition mechanism. |
| Friction disposition shift | `override_friction_disposition`. Closed. |
| Re-ratification after revision | **Gap.** Revised Ratified Concern → Draft? Anchored RCs cascade? Not designed. |
| Provenance on updates | **Gap.** CN-D-11. Cluster B.1 ships provenance for seed crossing only. Revisions and ratifications carry no equivalent provenance shape. |

### Delete

| Element | Coverage | Status |
|---------|----------|--------|
| Concern | No `withdraw` exposed by `manage_concerns` | **Gap.** Known cluster C carryforward. |
| Resolve Condition | Phantom mechanism (cluster B.2) with closed disposition set | Closed |
| Necessary Condition | Phantom mechanism, same shape | Closed |
| Rule | RULE-4 was withdrawn this session; Phantom mechanism scoped to RC/NC only — Rule path informal | **Partial** |
| Evidence | Designer asserts free add/remove; structural shape (phantom? log? vanish?) not designed | **Partial** |
| Permission | No withdrawal mechanism documented | **Gap** |
| Risk | No withdrawal mechanism documented | **Gap** |
| Friction | Disposition closure (lived-with / relieved-by-exception / dissolved-by-revision / dissolved-by-scope-cut / not-really-friction) | Closed |
| Definition | No removal path; phantom-out vs vanish not designed | **Gap** |
| Out-of-band reframe (whole-proof) | Cluster C exposed; only path is cluster transfer | **Gap** |

---

## Gap Ranking by Exposure Risk

**Most urgent:**
- Concern withdrawal (known live gap, hit cluster C directly).
- Definition CRUD (no API at all).
- Permission / Risk delete (silent voids in the closed set).

**Architecturally important, lower exposure:**
- Rule and Evidence delete paths (mechanisms exist informally, not specified).
- Provenance on updates (CN-D-11).
- Re-ratification after revision (state-transition completeness).

**Cross-cutting:**
- Bulk ratification tool shape for NCs at closing.
- Out-of-band reframe grammar (CN-D-13 second half).

---

## Architectural Implication

The proof layer's element types are closed but its **operations** are not uniformly closed. A clean proof-layer language carries a CRUD-completeness commitment:

- Every element type supports the full operation set.
- Withdrawal preserves the element with closed-set disposition; never silent deletion.
- Every operation carries provenance, not just create.

This commitment, expressed as an architectural rule, would lift several existing implementation-altitude rules out of the proof and replace them with structural language.

---

## Concern Mapping

This analysis directly bears on:

- **CN-D-4** — Proof layer faithful information management.
- **CN-D-9** — Authority on every claim (provenance).
- **CN-D-10** — Closed element-type set (operations should match closure).
- **CN-D-11** — Every advancement carries provenance.
- **CN-D-13** — Withdrawal and reframe grammar.

Resolve Conditions for CN-D-4 anchor through this artifact's gap list.
