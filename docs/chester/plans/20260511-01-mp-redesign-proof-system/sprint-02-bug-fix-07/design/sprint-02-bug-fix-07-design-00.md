# Design Brief: Design-Proof-System Bridge/Engine Utilization Concerns from Live Proof Run

**Status:** Approved
**Date:** 2026-05-18
**Sprint:** sprint-02-bug-fix-07
**Parent:** 20260511-01-mp-redesign-proof-system (sprint-02 proof-layer)
**Target system:** `skills/design-proof-system/` (the master plan's redesigned proof system; NOT `proof-mcp`).

## Problem Statement

A live run of the design-proof-system against a real proof surfaced twelve utilization concerns at the bridge/engine seam plus a small set of adjacent observations (vocabulary documentation drift, agent message-envelope behavior, and grounding-chain mutation cost). None are blockers in the sense of preventing the run from completing, but each forces Arbiter-side workarounds (mapping tables, manual allocator reseeding, override-only resolution paths, cascading withdraw+re-add cycles for routine wording cleanup) or carries leaked-schema baggage that makes the caller contract harder to reason about than it should be. The system was operated as a beta; these are refreshed-each-round observations from that beta operation.

## Prior Art

Sub-sprint sits inside the `20260511-01-mp-redesign-proof-system` master, whose three primary sub-sprints (`sprint-01-proof-backend`, `sprint-02-proof-layer`, `sprint-03-presentation-layer`) have built and refined design-proof-system in tandem. Prior bug-fix sub-sprints on the same domain layer:
- `sprint-02-bug-fix-01`
- `sprint-02-bug-fix-02`
- `sprint-02-bug-fix-0306`

This sub-sprint continues that sequence with utilization-grade concerns observed during live operation rather than test-bench discovery.

## Design Decisions

All twelve recommendations from the live-run observations are accepted as design decisions. Each decision below restates the observation and ratifies the recommendation. The full verbatim observations are preserved in the section that follows for reference.

### D1 — Decouple `ratify` from the ID allocator

The `ratify` operation will no longer call the ID allocator. Approval facts (`approved`, `two_yes`) will be keyed on the element ID they ratify, which is already known at ratify time. This eliminates the stride-2 ID mapping and aligns the allocator high-water with element count.

**Rejected alternatives:**
- Leave allocator coupling in place and document the stride — _rejected_: forces every session-restore caller to know an internal counter convention.

### D2 — Accept optional caller-supplied `id` on `addElement`

`addElement` will accept an optional `id` field. If supplied and unique within the category, it is used as-is; if absent, the allocator generates one. This removes the need for an Arbiter-side docId→engineId mapping table.

**Rejected alternatives:**
- Require callers to keep an external mapping — _rejected_: every restore must reconstruct the mapping, and the proof document and engine state stay out of sync.

### D3 — Give `presentClosingArgument` its own argShape

`presentClosingArgument` will stop validating against the Evidence schema. It receives its own argShape with only fields it actually consumes. Evidence-specific fields (`source`, `statement` enum) are dropped from the caller contract.

**Rejected alternatives:**
- Keep the Evidence borrow — _rejected_: leaks an unrelated element category into the closure-gate contract.

### D4 — Let Resolution address Risks

Resolution's `problem_anchor` will be extended to accept both `"concern"` and `"risk"` element categories (or, equivalently, a separate `risk_anchor` field — final shape chosen at spec time). The `coverage_gap_detected` rule must continue to consider the unaddressed-Risk case correctly under whichever shape is chosen.

**Rejected alternatives:**
- Leave Friction-override as the only exit — _rejected_: bends the Friction mechanism to fix a missing schema edge.

### D5 — Atomic serialize/restore with allocator state

Provide `serializeWithAllocatorState` and `loadFromWithAllocatorState` that bundle per-category allocator high-water marks alongside the EDB/rule snapshot. Restore becomes one call; the existing manual scan-and-seed dance is eliminated.

**Rejected alternatives:**
- Document the manual seeding step — _rejected_: a missed step silently produces duplicate IDs and corrupts the FactStore.

### D6 — Mutation results carry full element record

`reviseConcern` (and other mutation verbs that produce new/revised elements) will return the full element record matching `renderElementDeep` shape, not just metadata. Callers can confirm field-level correctness without a second round-trip.

**Rejected alternatives:**
- Require a follow-up `renderElementDeep` call — _rejected_: doubles the round-trip count for any mutation a caller needs to verify.

### D7 — Annotation/notes slot on Concern

Add an optional `notes` array (or general `annotations` field) so resolution-time obligations attached to a concern revise can be stored on the element itself. Final shape (notes-on-Concern vs annotations-on-any-element) decided at spec time based on whether other categories have parallel needs.

**Rejected alternatives:**
- Continue carrying obligations in external session notes — _rejected_: the obligations are most discoverable when colocated with the concern they qualify.

### D8 — Align `VOCABULARY.md` with the closed `source` enum in `tags.js`

`VOCABULARY.md` documents the Evidence `source` field as free-form with examples (`'design-decision'`, `'rfc'`), but `tags.js` enforces a closed four-value set (`'industry'`, `'codebase'`, `'prior-record'`, `'agent-derivation'`). An agent reading the vocabulary doc drafts Evidence the engine rejects with `SHAPE_INVALID`. The fix is to update `VOCABULARY.md` to document the closed enum explicitly so doc and code agree.

**Rejected alternatives:**
- Loosen `tags.js` to accept the vocabulary's free-form values — _rejected_: closed enum is the load-bearing invariant for grounding-chain auditability; the doc is the drift, not the code.

### D9 — Stable structured-payload channel for typed-element additions

Evidence claim texts sent inline with markdown formatting were not visible to the receiving agent during the live run; a plain-delimited `===== ... =====` block was used as a workaround. Agents executing on typed-element additions need a transport channel for payload content that does not depend on markdown rendering for visibility. Whether this lands as a convention on the existing task message envelope or as a discrete payload channel is a spec-stage choice.

**Rejected alternatives:**
- Treat the markdown-truncation workaround as permanent practice — _rejected_: an undocumented invariant that every payload must use a specific delimiter format is fragile and will break the first time a future operator uses a different format.

### D10 — `renderElementDeep` returns the full element record

`renderElementDeep({ id })` currently returns `{ id, predicate, withdrawn }` only. Recovering `statement`, `reasoning_chain`, `collapse_test`, `grounding`, and other field content requires direct EDB predicate queries. The fix is to have `renderElementDeep` return a complete record including all stored field content for the element category, eliminating the secondary query step.

**Rejected alternatives:**
- Keep `renderElementDeep` minimal and document the EDB query pattern — _rejected_: the secondary-query pattern is exactly the round-trip-elimination problem D6 calls out for mutations; the symmetric problem on reads gets the symmetric fix.

### D11 — Pre-ratify vocabulary discipline gate

Vocabulary discipline review is currently a *corrective cycle after ratification* rather than a *gate before it*. A single vocabulary-discipline violation in a ratified element triggers a full withdraw-replace-ratify cycle for that element and every element grounded on it — in the live run, changing one phrase in one Concern required replacing 2 Propositions and 1 Resolution plus their ratifications, costing 9 additional operations beyond the Concern revise itself. The fix is a "pre-ratify vocabulary check" — a lint-style validator that compares element text against the proof's ratified vocabulary and flags violations before ratification propagates them into the grounding chain.

**Rejected alternatives:**
- Continue paying the post-ratify cleanup cost — _rejected_: cost scales with cleanup depth and grounding-chain length; multi-element chains amplify the asymmetry into double-digit operation costs for one wording change.

### D12 — Add `reviseProposition` and `reviseResolution`

The Concern category supports `reviseConcern`, which mutates content atomically in one engine call. Propositions and Resolutions have no equivalent: revising either requires `withdrawElement` + `addElement` + `ratifyElement` (three operations per element), and if the revised element is referenced as grounding by another element, that dependent element also requires withdraw + add + ratify because its grounding citation must update to the new ID. Concrete live-run cost: cleaning up the placement Concern's wording rippled into 11 operations across one Concern, two Propositions, and one Resolution. With `reviseProposition` and `reviseResolution` available, the equivalent cleanup would have taken approximately 4 operations. The fix is to add `reviseProposition` and `reviseResolution` to the bridge surface, both atomic and both accepting optional grounding-update parameters so a revised element can simultaneously update its grounding citations, eliminating the cascade through dependent elements.

**Rejected alternatives:**
- Keep the withdraw + re-add + re-ratify pattern as the only revision path — _rejected_: the live run showed this pattern costs roughly 3× the operation count of a direct revise for routine wording changes, and the cost grows with grounding-chain depth.

Complements: D11 (pre-ratify lint catches issues before cleanup is needed) and D12 (revise verbs make inevitable corrections cheap when they do happen) work as a pair — the lint cuts how often cleanup is triggered; the revise verbs cut how expensive each cleanup is when it is. D1 also pairs with D12: together they roughly halve Proposition/Resolution mutation cost for routine wording revisions.

### Observations (verbatim, refreshed each round during the live run)

**1. The ratify call allocates an ID it never uses as an element identifier.**

Every `ratify` operation calls the ID allocator internally, consuming a counter slot that is written only to approval facts (`approved`, `two_yes`), not to any element. The result is that the add-ratify pair for each element burns two allocator slots, producing a stride-2 mapping (defn_001, defn_003, ...) and making the counter high-water mark twice as high as the element count. Any session restore must seed the allocator past the actual counter high-water, not past the element count — these differ by a factor of 2. Recommendation: ratify should not call the allocator at all; approval facts can be keyed on the element ID they ratify, which is already known.

**2. No caller-supplied ID at add time.**

The bridge does not accept a caller-prescribed element ID. IDs are always allocator-generated. When the proof-open document carries prescribed IDs (e.g., `defn_1`, `cern_1`) the Arbiter must maintain a separate docId→engineId mapping table and keep it current across sessions. Recommendation: `addElement` should accept an optional `id` field; if supplied and unique, use it; if absent, allocate. This would make proof-open ingestion clean and make proof documents self-consistent with engine state.

**3. `presentClosingArgument` validates args against the Evidence schema.**

The closure-gate operation (`presentClosingArgument`) uses the Evidence element category as its arg-shape target, meaning callers must supply `source` (a closed enum) and `statement` even though neither is stored or used by the closure operation itself. This is a leaking schema detail — the closure verb has nothing to do with Evidence. Recommendation: give `presentClosingArgument` its own argShape (required fields: `statement` only, or no required fields beyond consent) so the caller contract matches the operation's intent.

**4. Risk elements cannot be addressed by a Resolution in the current schema.**

The Resolution element's `problem_anchor` referenceField is typed to `"concern"` only. The `coverage_gap_detected` rule fires on unaddressed Risks, which blocks closure. But there is no path in the current bridge to link a Resolution to a Risk via `problem_anchor`. Adding a Risk today would immediately block closure with no built-in resolution path. The only exit is manually authored Friction disposition override. Recommendation: either extend `problem_anchor` to accept both `"concern"` and `"risk"` categories, or provide a separate `risk_anchor` field on Resolution so Risks can be addressed without bending the Friction mechanism.

**5. Session restore requires manual allocator seeding.**

There is no `loadFrom`-plus-allocator-sync convenience. After restoring engine state from a serialized snapshot, the caller must independently scan the loaded element IDs, parse their numeric suffixes, and seed the per-category allocator counters past the highest seen value. If this step is missed, the next add will produce a duplicate ID and corrupt the FactStore. Recommendation: provide a `serializeWithAllocatorState` / `loadFromWithAllocatorState` pair that bundles the allocator high-water marks alongside the EDB/rule snapshot, so restore is atomic.

**6. `reviseConcern` return object does not carry the new description.**

The `reviseConcern` call returns a result object that does not include the fields of the newly created element (only metadata like the new ID). The Arbiter cannot confirm the description was stored correctly from the return value alone — a separate `renderElementDeep` call would be needed. Recommendation: mutation result objects should carry the full element record of the newly created/revised element, matching the shape of `renderElementDeep`, so callers can confirm fields without a second round-trip.

**7. No native annotation or note field on Concern elements.**

When the designer authorizes resolution-time obligations alongside a concern revise (e.g., the hybrid-case and sequencing notes on the placement concern), the engine has no slot to store them. They must be carried in the dashboard or in external session notes. Recommendation: an optional `notes` array field on Concern elements (or a general `annotations` field on any element) would let the Arbiter attach resolution-time obligations directly to the concern record where they are most discoverable.

**8. Evidence `source` field has a doc/code drift between VOCABULARY.md and tags.js.**

`VOCABULARY.md` line 50 documents `source` as free-form with examples (`'design-decision'`, `'rfc'`). `tags.js:20-25` enforces a closed four-value set: `'industry'`, `'codebase'`, `'prior-record'`, `'agent-derivation'`. An agent reading only the vocabulary doc will draft Evidence the engine rejects with `SHAPE_INVALID`. Recommendation: update `VOCABULARY.md` to document the closed enum explicitly.

**9. Task-system or message-envelope handling may truncate or hide structured payload content from agents.**

Evidence claim texts sent inline with markdown formatting were not visible to the receiving agent; the plain-delimited format (===== ... ===== blocks) was a workaround. Recommendation: agents executing on typed-element additions should receive payload via a stable channel that does not depend on markdown rendering.

**10. `renderElementDeep` returns only metadata, not element text fields.**

`renderElementDeep({ id })` returns `{ id, predicate, withdrawn }` only. Recovering statement, reasoning_chain, collapse_test, and grounding requires direct EDB predicate queries. Recommendation: `renderElementDeep` should return a complete record including all stored fields.

**11. Vocabulary cleanup cycles are expensive in allocator slots and engine churn.**

The Option 1 cleanup consumed 11 operations and advanced all allocator counters substantially. A single vocabulary-discipline violation in a ratified element triggers a full withdraw-replace-ratify cycle for that element and every element grounded on it — in this proof, changing one phrase in one Concern required replacing 2 Propositions and 1 Resolution plus their ratifications, 9 additional operations beyond the Concern revise itself. Recommendation: vocabulary discipline review should be a gate before ratification, not a corrective cycle after. A "pre-ratify vocabulary check" operation or a lint-style validator on element text against the proof's ratified vocabulary would catch violations before they propagate into the grounding chain.

**12. Approval-gated categories (Proposition, Resolution) lack in-place revise operations analogous to reviseConcern.**

The Concern category supports `reviseConcern`, which creates a new element ID atomically in one engine call when wording or content needs to change. Propositions and Resolutions have no equivalent: revising either requires `withdrawElement` + `addElement` + `ratifyElement` (three operations per element), and if the revised element is referenced as grounding by another element, that dependent element also requires withdraw + add + ratify because its grounding citation must update to the new ID.

Concrete cost from this session: the placement Concern's vocabulary cleanup (replacing "proposed edits" with "unvalidated content" in one Concern, two Propositions, and one Resolution) required 11 engine operations. With `reviseProposition` and `reviseResolution` available, the same cleanup would have required approximately 4 operations (one revise per element). The cost scales with cleanup depth and grounding-chain length — multi-element chains amplify the asymmetry.

Recommendation: add `reviseProposition` and `reviseResolution` operations to the bridge surface, both atomic add+ratify+grounding-update calls analogous to `reviseConcern`. Both should accept optional grounding-update parameters so a revised element can simultaneously update its grounding citations, eliminating the cascade through dependent elements that withdraw+re-add currently forces. Complementary to Recommendation #11 (pre-ratify lint catches issues before cleanup is needed; reviseProposition/reviseResolution makes inevitable corrections cheap when they do happen). Pairs with Recommendation #1 (ratify allocator drift) — together they cut Proposition/Resolution mutation cost roughly in half for routine wording revisions.

## Scope

### In scope

- All twelve observations above, taken as a triage batch for sprint-02-bug-fix-07. Target codebase is `skills/design-proof-system/`.

### Out of scope

- **Other live-run observations not on this list** — _not yet_: this brief captures one refreshed-each-round batch; later batches would land in their own sub-sprints.
- **Cross-layer redesign of the allocator/ID lifecycle** — _not needed_: items 1, 2, and 5 cluster around allocator behavior but each can be addressed independently; a wholesale lifecycle redesign would be larger than the observed problems warrant.
- **Anything under `skills/design-large-task/proof-mcp/`** — _outside scope per system boundary_: that is a separate system; this sub-sprint must not read, grep, or reference it. Cross-system unification is its own scope.

## Constraints

- The work targets `skills/design-proof-system/`, the design-proof-system bridge and engine, plus the documentation files that pair with it (notably `VOCABULARY.md`) _(structural)_.
- System Boundary (root CLAUDE.md): the sub-sprint operates entirely within `skills/design-proof-system/` and its associated docs; no reads, greps, or references to `skills/design-large-task/proof-mcp/` _(normative — source: root CLAUDE.md)_.

## Assumptions

- **"None of the twelve items are session-blocking in their current form."** — UNTESTED. Item 4 (Risk → Resolution path) would block closure the moment a Risk is added; item 11 only manifests on vocabulary cleanups; item 9 may already be intermittently affecting payloads without operator awareness.
- **"Each item is independently addressable."** — UNTESTED. Items 1/2/5 share the allocator lifecycle; items 6/10 share a return-shape symmetry across mutation and read paths; items 11/12 are explicitly paired in the brief; item 8 is documentation-only.

## Residual Risks

- Item 4 is functionally load-bearing for closure — addressing it incorrectly (e.g., extending `problem_anchor` without updating `coverage_gap_detected` to match) could re-introduce the same blockage in a different form.
- Item 1's recommendation (decouple ratify from allocator) changes a counter-side-effect that downstream code may depend on for invariants other than ID uniqueness. Needs verification before change.
- Item 2 (caller-supplied IDs) opens an ID-collision surface that the current allocator-only contract avoids by construction.
- Item 11 (pre-ratify lint) needs careful scoping — a vocabulary check too strict will block legitimate evolution of the proof's vocabulary; too loose and the cleanup cycles continue.
- Item 12's grounding-update parameter is the load-bearing piece — without it, the new revise verbs leave the cascading-update problem unaddressed.

## Acceptance Criteria

To be formalized during specify. Working notion:

- Each decision D1–D12 has at least one behavioral test in the bridge or engine test suite asserting the new contract.
- A live-equivalent restore (serialize → load → continue session) succeeds without manual allocator seeding.
- Closure on a proof that contains an unaddressed Risk is unblockable via Resolution (no Friction-override needed).
- A wording-cleanup operation on a Proposition with a downstream-grounding Resolution costs at most two engine operations (one per element) rather than the current cascading withdraw+re-add count.
- `VOCABULARY.md` documents the same closed `source` enum that `tags.js` enforces.
- Existing proof flows continue to pass with no regression in the design-proof-system test suite.
