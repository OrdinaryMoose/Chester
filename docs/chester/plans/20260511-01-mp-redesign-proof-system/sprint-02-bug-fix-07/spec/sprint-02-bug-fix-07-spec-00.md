# Spec: Design-Proof-System Utilization Concerns (Live-Run Batch)

**Sprint:** sprint-02-bug-fix-07
**Parent brief:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-07/design/sprint-02-bug-fix-07-design-00.md
**Architecture:** Hybrid — holistic ID-lifecycle (D1, D2, D5) and symmetric full-record return contract (D6, D10) for groupings where the brief flags interaction; minimal-new-surface for D7/D11/D12; doc-only D8 with narrow scope kept to brief; tested utility module for D9; blocking pre-ratify gate for D11 with narrow canonical-term-mismatch matching. D12 lands as two new OperationSpecs with explicit acknowledgment that the rule-cascade design (Domain Spec §3.4) may make the `grounding_updates` parameter unnecessary — that question is resolved by a small code probe inside the implementation tasks.

## Target System

`skills/design-proof-system/` under the master plan `20260511-01-mp-redesign-proof-system`. All file paths in this spec are rooted at `skills/design-proof-system/references/` unless otherwise stated.

## Goal

Close twelve utilization gaps observed during a live run of design-proof-system. The gaps cluster on four axes: allocator and ID lifecycle (D1, D2, D5), per-verb caller contract shape (D3, D6, D10), schema affordances at element level (D4, D7), and cleanup-cycle economics (D11, D12), with two adjacent observations (D8 doc/code drift; D9 agent payload transport). After this sub-sprint lands, the next live run should not need Arbiter-side workarounds for allocator high-water seeding, docId→engineId mapping, Friction-override exits for unaddressed Risks, second-call round-trips on mutation or read, external session-notes carriers for resolution-time obligations, or cascading withdraw+re-add cycles for routine wording cleanups.

## Components

New or modified units within `skills/design-proof-system/references/`. All paths below relative to that root.

- **`domain/mutations.js`** — Primary work site.
  - D1: Guard the `ports.ids.next(targetShape)` call in `runOperation` step 5 so RATIFY skips ID allocation entirely. RATIFY's translate path uses `args.elementId` directly and does not consume the allocated id. Gate via `if (verbName !== ACTION_LABELS.RATIFY) { id = ports.ids.next(targetShape); }`. No change to approval-fact key structure.
  - D2: After the RATIFY skip, for ADD and the new D12 verbs, add an optional-id branch: `if (args.id) { if (_existsAnyCategory(ports.query, args.id)) throw DUPLICATE_ID; id = args.id; } else { id = ports.ids.next(targetShape); }`. Caller-supplied IDs must additionally match the verb's `idShape` prefix; on mismatch, throw `ID_PREFIX_MISMATCH` naming the supplied id and expected prefix. **Do not implement a new helper** — `_existsAnyCategory` already exists as a private helper at `schema.js:25-31` (not exported). Export it from `schema.js` and import into `mutations.js`. Creating a third copy of the category-probe table in `mutations.js` would compound the existing `_CATEGORY_PROBES` / `_CATEGORY_PROBES_SCHEMA` sync burden (see schema.js:7-11 sync warning). The prefix-match check uses a per-shape prefix table; pinning the prefix convention to one source — either an inline `_ID_PREFIXES` table in `mutations.js` or a new `idAllocator.expectedPrefix(shape) → string` port method — is a plan-build decision (see Constraints below).
  - D3: Set `argShape` on `OPERATION_SPECS[ACTION_LABELS.PRESENT_CLOSING_ARGUMENT]` to a new `CLOSING_ARGUMENT_ARG_SHAPE` descriptor exported from `domain/schema.js`. Descriptor has `requiredFields: []`, `closedEnumFields: {}`. Existing `runOperation` step 3 already prefers `spec.argShape` over `targetShape` when `argShape` is present; no dispatch logic changes.
  - D6: At `runOperation` step 12, for verbs whose `spec.resultShape` is marked `{ fullRecord: true }` (ADD, REVISE, D12's `revise_proposition` / `revise_resolution`), call `render.renderElementDeep({ id }, readPorts)` and merge into result. Construct `readPorts` inline from `ports.query` and `ports.explain` (both available in `fullPorts`). The base `{ id }` shape is preserved as a top-level key for backward-compatible read by callers that only consume `result.id`; additional fields layer on.
  - D11: New helper `_vocabularyLintCheck(args, elementId, ports)` invoked when `verbName === ACTION_LABELS.RATIFY`. The check queries the EDB for ratified `definition/3` facts (canonical-term set), reads the target element's text fields via `renderElementDeep`, and flags violations where the element's text contains an uncapitalized or unmatched-variant form of any ratified canonical term. Returns either `null` (clean) or a `VOCABULARY_LINT_VIOLATION` payload naming the offending term and field. On violation, `runOperation` throws the lint error before commit. The matching logic is intentionally narrow per the brief — canonical-term mismatch only, not full prose analysis.
  - D12: Add `ACTION_LABELS.REVISE_PROPOSITION` and `ACTION_LABELS.REVISE_RESOLUTION` (definitions in `domain/tags.js`, see below). Add two new `OPERATION_SPECS` entries. Each spec's `translate` function: (a) emits the element's facts via the existing PROPOSITION / RESOLUTION translator pattern producing facts under the new id, (b) emits `superseded(new_id, args.supersedes)` metaFact, (c) embeds the approval atomically by emitting `approved(new_id, args.consent_source, ts)` and `two_yes(new_id, args.consent_source)` in the same translate output so the new element is ratified within the same engine transaction, (d) **gated by AC-12.4 probe outcome:** if the rule-cascade design (Domain Spec §3.4) already handles dependent-element rewiring through approval retraction, the `grounding_updates` parameter and the retract+assert path are dropped entirely before code lands. Otherwise, `args.grounding_updates` is accepted as an array of `{from, to}` pairs and the translator retracts the matching old `proposition_grounding` or `resolution_grounding` facts and asserts new ones. Both verbs require the same consent-source allowlist as the corresponding category's existing `addElement` + `ratify` path. Update the existing `mutations.test.js` named-verb count assertion (currently 8) to 10.

- **`domain/tags.js`** — Enum additions.
  - D12: Add `REVISE_PROPOSITION: 'revise_proposition'` and `REVISE_RESOLUTION: 'revise_resolution'` to `ACTION_LABELS`. No change to the closed `EVIDENCE_SOURCE_ENUM` — that's the load-bearing invariant D8 is documenting, not modifying.

- **`domain/schema.js`** — Schema extensions.
  - D2: Document `id` as an optional pre-shape-check special field handled in `runOperation` (not added to `CATEGORY_REGISTRY.optionalFields` because it is not a domain-semantic field on the element). The `argShape` for ADD-like verbs does not include `id` in `requiredFields`; existing callers omitting `id` see no change.
  - D3: Export new `CLOSING_ARGUMENT_ARG_SHAPE` descriptor object for `mutations.js` to consume on `PRESENT_CLOSING_ARGUMENT`.
  - D4: Change `CATEGORY_REGISTRY[ELEMENT_CATEGORIES.RESOLUTION].referenceFields.problem_anchor` from the string `'concern'` to an array `['concern', 'risk']`. Introduce a small `_existsOneOf(id, categories, query)` helper inside `schema.js` that probes each candidate category and returns true on any match. Extend `verifyArgsShape` (or its referenceFields validator) to handle array-valued referenceFields entries via `_existsOneOf`. Existing scalar-valued referenceField entries (every other field today) continue through the existing `_existsCategory` path unchanged.
  - D7: Add `'notes'` to `CATEGORY_REGISTRY[ELEMENT_CATEGORIES.CONCERN].optionalFields`. Do not add it to `nonEmptyArrayFields` — `notes: []` is a valid initial state.

- **`domain/translation.js`** — Translator updates.
  - D5 helper: Export `extractAllocatorHighWaterMarks(readPorts)` — a pure-read function that queries the EDB for each category's declaration predicate, parses numeric suffixes from element IDs, and returns a per-category-prefix `{ [shape: string]: number }` high-water map. This lives here alongside `EDB_PREDICATES` knowledge.
  - D7: Extend the CONCERN translator to emit `['concern_note', [id, note]]` EDB facts for each entry in `args.notes` when present. Add `concern_note` to `EDB_PREDICATES`.
  - D12: Add translation entries for the two new revise verbs. Each routes to the existing PROPOSITION / RESOLUTION translator for the element-fact portion plus the supersession and embedded-approval facts named in the `mutations.js` section.

- **`domain/render.js`** — Render extensions.
  - D10: Add `_SECONDARY_QUERIES` map keyed by primary declaration predicate. Each entry lists satellite predicates and their binding shapes. Per category: `proposition_decl` → `proposition_grounding` (array `grounding`), `collapse_test` (scalar), `reasoning_chain` (scalar), `rejected_alternative` (array); `resolution_decl` → `resolution_anchor` (scalar `problem_anchor`), `resolution_grounding` (array `grounding`); `risk` → `risk_basis` (array `basis`); `concern` → `concern_status`, `concern_note` (array `notes`); `definition_decl` → `definition_scope`; `permission_decl` → `permission_scope`, `permission` (relieves). Extend `renderElementDeep` to run secondary queries after the primary match and merge results into the returned record. Multi-row satellites return as arrays; single-row satellites inline as scalars. Null return for missing elements and withdrawn-annotation behavior are preserved.
  - Add `concern_note: 2` to the new `_SECONDARY_QUERIES` map (NOT to `_ARITIES`) and to the `PROJECTION_ARITIES` map in `renderDatalogProjection` (which feeds D5's serialize path). The existing `_ARITIES` at render.js:106-115 holds primary declaration predicates only; satellite predicates like `concern_note` belong in the new secondary-query path.

- **`domain/closure-policy.js`** — **No code change required for D4.**
  - The existing `effective_addresses_rule` at closure-policy.js:49-54 has body `[['resolution_anchor', ['R', 'C']], ['not', ['withdrew', ['R']]]]` — generic on `C`, no category filter. Once D4's schema change permits `resolution_anchor(R, risk_id)` facts to exist, the existing rule derives `effective_addresses(R, risk_id)` automatically.
  - The existing `coverage_gap_rule` in `friction-policy.js:27-30` body `[['risk', ['C', '_', '_']], ['not', ['effective_addresses', ['_', 'C']]], ['not', ['withdrew', ['C']]]]` then stops firing for the addressed Risk.
  - `closure_permitted_rule` at closure-policy.js:65-76 reads `not coverage_gap_detected`, so closure unblocks automatically. **No `covered(risk_id)` derivation is needed because `closure_permitted_rule` does not consume `covered` for Risks — it consumes `coverage_gap_detected`.**
  - Net result: D4 is a schema-only change at the domain layer. The rule graph already handles Risk-by-Resolution addressing correctly once the schema permits the predicate.

- **`domain/friction-policy.js`** — No code change. The existing `coverage_gap_rule` body is independent of `resolution_anchor`'s field-type declaration; once `effective_addresses` extends to Risk anchors via D4's rule additions, coverage_gap_detected stops firing for addressed Risks.

- **`domain/domain-bridge.js`** — Bridge facade additions.
  - D5: Add `serializeWithAllocatorState(args)` and `loadFromWithAllocatorState(args, serialized)`. `serializeWithAllocatorState` calls `render.renderDatalogProjection(args, readPorts)` for the engine blob, then calls `translation.extractAllocatorHighWaterMarks(readPorts)` for counters, returning `{ engine: <blob>, allocatorState: <counters> }`. `loadFromWithAllocatorState` calls the existing engine `loadFrom(serialized.engine)` then calls `idAllocator.seed(serialized.allocatorState)`. Both methods are added to the frozen facade. The `IIDAllocator` port contract gains **two** new methods: `seed(counters: {[shape: string]: number})` for restore, and `highWater(shape: string) → number` for read access to the current per-shape counter. The acceptance-criteria tests below reference `idAllocator.highWater(...)` as their counter-parity probe; without the new read method, those assertions cannot be implemented. Canonical-allocator construction in any reference docs is updated to include both methods.
  - D9: Add `createPayloadChannel(content: string): string` returning `"===== PAYLOAD_START =====\n" + content + "\n===== PAYLOAD_END ====="` and `parsePayloadChannel(raw: string): string` returning the substring between the sentinels (or null if the format is malformed). Both exported from `domain-bridge.js`. Wrapping convention is testable, single-source-of-truth, and replaces the ad-hoc delimiter pattern from the live run.
  - D12: Add `reviseProposition(args, consent)` and `reviseResolution(args, consent)` facade methods, each dispatching to `runOperation` with the matching `ACTION_LABELS` entry.
  - Update the `validPredicates` set in `createDomainBridge` and `createDomainBridgeWith` to include `concern_note`. The grounding-update retract+assert cycle in D12 uses existing predicates only.

- **`domain/VOCABULARY.md`** — Documentation fix for D8.
  - Replace the free-form `source` description in §2 (Evidence entry) with explicit closed-enum documentation: `source` must be one of `'industry'`, `'codebase'`, `'prior-record'`, `'agent-derivation'` (matching `EVIDENCE_SOURCE_ENUM` in `domain/tags.js`). No other VOCABULARY.md edits — broader drift (`claim` vs `statement`, `addresses` vs `problem_anchor`, INFERENCE_PATTERNS values) is documented but deferred to a follow-up sub-sprint, since the brief's D8 specifically names the `source` field only.
  - For D9: add a short "Structured payload channel" subsection naming the `createPayloadChannel` / `parsePayloadChannel` utilities and pointing readers to `domain-bridge.js` for the canonical wrapper.

- **`domain/__tests__/sprint-02-bug-fix-07.test.js`** — New behavioral test file.
  - One `describe` block per decision (twelve in total, plus a thirteenth `describe` block covering regressions against the existing test suite for D1's counter-parity invariant). Uses the existing `createInMemorySubstrate` + `createDomainBridge` fixture pattern from `bridge-integration.test.js`.

## Data Flow

Six flows change. Each is described as the observable surface a caller sees.

1. **Add element with caller-supplied ID.** Caller invokes `addElement` (or `addElementOf*`) with an optional `id` field on the args. The bridge forwards the call into `runOperation`. After the RATIFY-skip guard (no-op for ADD), step 5 checks `args.id`: if present and unique within the EDB across all categories, the engine uses it directly without consuming an allocator slot. The caller-supplied id must additionally carry a prefix matching the verb's `idShape`. On any validation failure, the call errors out with `DUPLICATE_ID` or `ID_PREFIX_MISMATCH` naming the offending id and the expected prefix. On success, the engine emits the element's facts under `args.id`. The allocator counter for that category is *not* advanced by the caller-supplied path; subsequent allocator-driven adds use the existing counter as-is. (Caller responsibility: monotonicity. If a caller mixes supplied and allocator-driven IDs within one session, they must ensure the supplied IDs are above the current allocator high-water, or use D5's `loadFromWithAllocatorState` to seed correctly.)

2. **Ratify without burning an allocator slot.** Caller invokes `ratify` on an element. `runOperation` step 5 skips `ports.ids.next` when the verb is RATIFY. The translate path uses `args.elementId` to key the `approved(elementId, source, ts)` and `two_yes(elementId, source)` facts directly. The allocator counter remains at its pre-ratify value. Counter-parity invariant: after N add-and-ratify cycles for a single category, `idAllocator.highWater(category)` equals N (assuming no allocator-driven adds for that category in between).

3. **Pre-ratify vocabulary lint.** Caller invokes `ratify` on an element. Before commit, `runOperation` invokes `_vocabularyLintCheck` which: (a) queries the EDB for ratified `definition/3` facts to assemble the canonical-term set, (b) reads the target element's text fields via `renderElementDeep`, (c) scans for canonical-term mismatch — occurrences of an uncapitalized or unmatched-variant form of any canonical term. On violation, the ratify call throws `VOCABULARY_LINT_VIOLATION` with a payload listing the offending field, the offending substring, and the canonical term it conflicts with. Commit does not occur. On clean lint, ratify proceeds normally.

4. **Atomic serialize and restore.** Caller invokes `bridge.serializeWithAllocatorState(args)`. The bridge calls `renderDatalogProjection` for the engine blob and `extractAllocatorHighWaterMarks` for the per-category counters, returning `{ engine, allocatorState }`. Caller stores both together. To restore, caller invokes `bridge.loadFromWithAllocatorState(args, serialized)`. The bridge calls `engine.loadFrom(serialized.engine)` then `idAllocator.seed(serialized.allocatorState)`. After restore, the next `addElement` without `args.id` calls `ports.ids.next` which returns a value strictly above the high-water of any element in the loaded state — no collision possible.

5. **Resolution addresses a Risk.** Caller invokes `addElement` for a `RESOLUTION` with `problem_anchor: '<risk-id>'`. `verifyArgsShape` validates the reference via the new array-valued `referenceFields.problem_anchor` entry — the `_existsOneOf` helper accepts both Concern and Risk ids. The resolution element is admitted; its `resolution_anchor` fact carries the risk id. The closure-policy `effective_addresses_risk_rule` derives `effective_addresses(R, K)` from the risk anchor; `risk_covered_rule` derives `covered(K)`. The existing `coverage_gap_rule` in `friction-policy.js` no longer fires on this risk because `effective_addresses` covers it. Closure proceeds.

6. **Atomic revise on Proposition or Resolution.** Caller invokes `bridge.reviseProposition(args, consent)` or `bridge.reviseResolution(args, consent)`. The bridge dispatches to `runOperation` with the new verb label. `runOperation` allocates a new id (or accepts a caller-supplied one), runs the translator that emits the element's full facts plus `superseded(new_id, args.supersedes)` plus `approved(new_id, source, ts)` plus `two_yes(new_id, source)`. If `args.grounding_updates` is present, the translator additionally retracts the old `proposition_grounding` / `resolution_grounding` facts named by the `from` ids and asserts new ones to the new id. All happens in one engine transaction. **Open question resolved during implementation:** verify whether `grounding_updates` is load-bearing. The rule-cascade design (Propositions as rules with approval as body literal) may make explicit rewiring unnecessary because approval retraction on the superseded element causes dependent rules to disappear from the fixpoint automatically. The implementation tasks include a code probe (see implementing-tasks placeholder on AC-12.1 once populated by plan-build). If the probe shows rule cascade is sufficient, the `grounding_updates` parameter is dropped before the spec is finalized as code.

Two read flows change in parallel:

7. **Mutation result carries full element record.** Any caller of `addElement`, `reviseElement`, `reviseConcern`, `reviseProposition`, or `reviseResolution` receives a result whose top-level shape is `{ id, ...allElementFields }`. Field content matches what `renderElementDeep({ id })` would return for the same id post-commit. Callers using only `result.id` continue to work; callers wanting field content stop needing the secondary `renderElementDeep` call.

8. **`renderElementDeep` returns full record.** Any caller of `renderElementDeep({ id }, readPorts)` receives `{ id, predicate, withdrawn, ...declarationFields, ...secondaryFields }`. Secondary fields per category come from the `_SECONDARY_QUERIES` map: arrays for multi-row predicates (grounding, basis, rejected_alternative, notes); scalars for single-row predicates (collapse_test, reasoning_chain, problem_anchor, status, scope, relieves). Existing callers reading only `{ id, predicate, withdrawn }` continue to work; callers needing field content stop needing per-predicate queries.

## Error Handling

New error codes introduced by this spec:

- **`DUPLICATE_ID`** — caller-supplied `args.id` collides with an existing element. Message names the offending id and the category in which it already exists. Mutation rejected; no partial state change.
- **`ID_PREFIX_MISMATCH`** — caller-supplied `args.id` does not carry a prefix matching the verb's `idShape`. Message names the offending id and the expected prefix.
- **`VOCABULARY_LINT_VIOLATION`** — pre-ratify lint failed. Payload includes: offending field name, offending substring, canonical term it conflicts with. Ratify rejected; no commit.

Existing error codes are unchanged. The existing `INVALID_REFERENCE`, `DOMAIN_ERROR`, `SHAPE_INVALID`, `CONSENT_DENIED`, and similar codes continue to fire on their existing trigger conditions. D4's array-valued `referenceFields` resolution returns `INVALID_REFERENCE` when neither category in the array matches — same error code, same message shape, only the underlying check changes.

## Testing Strategy

All new behavioral tests live in `domain/__tests__/sprint-02-bug-fix-07.test.js`. Per-decision coverage:

- **D1** — One `describe` block: counter-parity after `addElement → ratify` cycles. Assertions: after one `addEvidence` plus one `ratify`, `idAllocator.highWater('evidence')` equals 1 (not 2); ratify path does not invoke `ports.ids.next` (verifiable via a spy port).
- **D2** — Four `it` blocks: (a) `args.id` absent → allocator path, counter advances; (b) supplied valid unique id → caller id used, allocator counter unchanged; (c) supplied colliding id → `DUPLICATE_ID`; (d) supplied prefix-mismatched id → `ID_PREFIX_MISMATCH`.
- **D3** — Two `it` blocks: (a) `presentClosingArgument({ consent })` succeeds with no `source` or `statement` in args, given a closure-eligible state; (b) `OPERATION_SPECS[PRESENT_CLOSING_ARGUMENT].argShape` shape check confirms only `requiredFields: []`.
- **D4** — Six `it` blocks: (a) `addElement RESOLUTION` with `problem_anchor` = active Risk id succeeds; (b) `addElement RESOLUTION` with `problem_anchor` = active Concern id still succeeds; (c) `problem_anchor` = unknown id returns `INVALID_REFERENCE`; (d) closure on a proof with an unaddressed Risk fails with `coverage_gap_detected`; (e) closure on a proof where the same Risk is addressed by a ratified Resolution passes; (f) zero-active-Risks proofs continue to close without Risk-related blocks.
- **D5** — Three `it` blocks: (a) round-trip `serializeWithAllocatorState → loadFromWithAllocatorState → addElement` produces no id collision; (b) restored state contains all original elements plus correct allocator high-water; (c) `idAllocator.seed` called with empty `allocatorState` falls back to scanning the EDB high-water (legacy-snapshot recovery path).
- **D6** — Two `it` blocks: (a) result of `addElement EVIDENCE` carries full element record (id, statement, source, ratification status); (b) result of `reviseConcern` carries the updated description, notes, status without a secondary call.
- **D7** — Four `it` blocks: (a) `addConcern` accepts and stores `notes`; (b) `reviseConcern` replaces `notes`; (c) `concern_note` facts appear in EDB projection for serialization; (d) `renderElementDeep` includes `notes` when present and non-empty, omits when absent or empty.
- **D8** — One `it` block: VOCABULARY.md contains the closed-enum documentation matching `EVIDENCE_SOURCE_ENUM`. (Asserted by reading the doc file from the test process and grep-matching the four enum strings.)
- **D9** — Two `it` blocks: (a) `createPayloadChannel(content)` round-trips via `parsePayloadChannel`; (b) malformed delimiter on parse returns null without throwing.
- **D10** — Three `it` blocks: (a) `renderElementDeep` on a Proposition returns `grounding`, `collapse_test`, `reasoning_chain`, `rejected_alternative`; (b) on a Resolution returns `problem_anchor`, `grounding`; (c) on a Concern returns `notes` array.
- **D11** — Three `it` blocks: (a) `ratify` on an element whose text uses a ratified canonical term verbatim succeeds; (b) `ratify` on an element with a canonical-term variant (uncapitalized or unmatched form) throws `VOCABULARY_LINT_VIOLATION` with a structured payload; (c) `ratify` on an element with no ratified Definitions in scope succeeds (empty canonical-term set = no lint).
- **D12** — Four `it` blocks: (a) `reviseProposition` is atomic — new element exists, is ratified, supersedes the old; (b) `reviseResolution` is atomic — same shape; (c) operation count for a one-Proposition + one-dependent-Resolution wording cleanup using the new verbs is at most 2; (d) the same cleanup using the legacy withdraw + addElement + ratify path costs 6+ operations (documenting the asymmetry that motivates D12).

Regression sweep: the existing test suite under `domain/__tests__/` and `domain/structural-tests/` must continue to pass. The `mutations.test.js` named-verb count assertion updates from 8 to 10. The `resolution-schema.test.js` assertion on `referenceFields.problem_anchor` shape updates from `'concern'` to `['concern', 'risk']`. The engine test suite under `engine/__tests__/` requires no changes — D5 wraps the existing `Serializer.js` / `Snapshot.js` surfaces without modifying them.

## Constraints

- **System boundary.** All work is within `skills/design-proof-system/references/`. No file outside this directory is touched. No reference to `skills/design-large-task/proof-mcp/` anywhere in this spec, the implementation, the tests, or the artifacts.
- **D4 prior-design reversal (acknowledged).** Domain Spec §3.5 (sprint-02-proof-layer) deliberately scoped Resolutions to address Concerns only; Risks were designed to attach via `RISK.basis`, not via Resolutions. The brief explicitly accepts this reversal. The new closure-policy rules (`effective_addresses_risk_rule`, `risk_covered_rule`) restore the addressing pathway for Risks without bending the Friction mechanism.
- **D11 forward-pull from Phase-B ADR (acknowledged).** Prior art flagged vocabulary-discipline scope as deferred to a Phase-B ADR sprint. The brief confirms D11 is in scope for this sub-sprint. The narrow matching logic (canonical-term mismatch only) is the boundary of what bug-fix-07 owns; broader vocabulary-policy decisions remain for the planned ADR sprint.
- **D8 narrow scope.** VOCABULARY.md has additional drift beyond the `source` field (`claim` vs `statement`, `addresses` vs `problem_anchor`, INFERENCE_PATTERNS enum values). The brief's D8 names the `source` field specifically; broader drift is documented but not fixed here. A follow-up sub-sprint can own the broader documentation correction.
- **D12 open question, resolved at implementation.** Whether the `grounding_updates` parameter is load-bearing depends on the rule-cascade behavior (Domain Spec §3.4). The implementation includes a probe; if rule cascade is sufficient, `grounding_updates` is dropped before code lands. The spec carries the parameter as conditional.
- **D6 widened return shape is a broadened contract.** Existing callers that pattern-match on `result` keys (`Object.keys(result).length === 1`) will break. The acceptance test for D6 covers this; existing test fixtures are updated in lockstep.

## Non-Goals

- **No broader VOCABULARY.md cleanup beyond D8 source enum.** `claim` vs `statement`, `addresses` vs `problem_anchor`, INFERENCE_PATTERNS enum values, and any other doc drift are out of scope.
- **No retroactive vocabulary lint on already-ratified elements.** D11's gate operates at ratify-time only. Elements ratified before this sub-sprint lands are not re-linted; they remain as-is.
- **No new element category.** D4 extends the existing Resolution category; it does not introduce a separate "RiskResolution" category. D7 adds a field to the existing Concern category; it does not introduce a generic "annotations" surface on every element.
- **No engine-layer changes.** All work is in the domain layer (`domain/`). The engine layer (`engine/Serializer.js`, `engine/Engine.js`, etc.) is consumed via existing ports; no engine internals are touched.
- **No new MCP verb at the bridge surface other than D12's two reviseProposition / reviseResolution and D5's two serialize-with-allocator-state / load-from-with-allocator-state.** D9's payload utilities are non-verb pure functions exported from `domain-bridge.js`.
- **No backwards-compatibility shim for the broadened D6 / D10 return shapes.** Test fixtures and any internal callers are updated in lockstep; there is no parallel-path old-shape return.
- **No persistence-log format change.** D1's counter-side-effect removal does not change what the operation log records (verb, args, ts).

## Acceptance Criteria

### AC-1.1 — RATIFY does not advance the ID allocator

**Observable boundary:**
- After a sequence of `addElement` + `ratify` cycles for a single category, `idAllocator.highWater(category)` equals the count of elements admitted in that category.
- `ports.ids.next` is not invoked when `runOperation` is processing a RATIFY verb.

**Given:** A fresh proof state with `idAllocator.highWater('evidence') === 0`.
**When:** `addElement EVIDENCE` then `ratify` are invoked in sequence.
**Then:** `idAllocator.highWater('evidence')` equals 1 (not 2); a spy port confirms `ports.ids.next` was invoked exactly once across the two calls (during ADD, not RATIFY).

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — addElement accepts optional caller-supplied id

**Observable boundary:**
- `addElement` calls with `args.id` present use the supplied id and do not advance the allocator counter.
- `addElement` calls with `args.id` absent use the allocator and advance the counter.

**Given:** A state with `idAllocator.highWater('evidence') === 0`.
**When:** `addElement EVIDENCE` is invoked with `args.id = 'evid_5'`.
**Then:** The element is admitted with id `evid_5`; the result carries `id: 'evid_5'`; `idAllocator.highWater('evidence')` remains 0 (not advanced). A subsequent `addElement EVIDENCE` without `args.id` returns `id: 'evid_1'` (allocator-allocated, counter advances).

### AC-2.2 — addElement rejects colliding caller-supplied id

**Observable boundary:**
- An `addElement` call with `args.id` matching an existing element returns `DUPLICATE_ID`.

**Given:** A state with element id `evid_3` already present.
**When:** `addElement EVIDENCE` is invoked with `args.id = 'evid_3'`.
**Then:** The call errors with `DUPLICATE_ID` naming `evid_3` and the existing-element category. No new element is admitted.

### AC-2.3 — addElement rejects prefix-mismatched caller-supplied id

**Observable boundary:**
- An `addElement` call with `args.id` whose prefix does not match the verb's `idShape` returns `ID_PREFIX_MISMATCH`.

**Given:** A fresh state.
**When:** `addElement EVIDENCE` is invoked with `args.id = 'concern_1'`.
**Then:** The call errors with `ID_PREFIX_MISMATCH` naming `concern_1` and the expected prefix (e.g. `evid_`).

### AC-3.1 — presentClosingArgument uses its own argShape

**Observable boundary:**
- `OPERATION_SPECS[ACTION_LABELS.PRESENT_CLOSING_ARGUMENT].argShape` is set to a descriptor with `requiredFields: []`.
- `presentClosingArgument({ consent })` succeeds on a closure-eligible state with no other args.

**Given:** A closure-eligible proof state.
**When:** `presentClosingArgument` is invoked with only the consent token.
**Then:** The call succeeds and the closing argument is materialized; no `source` or `statement` validation error fires.

### AC-4.1 — Resolution accepts Risk as problem_anchor

**Observable boundary:**
- `addElement RESOLUTION` with `problem_anchor = <risk-id>` succeeds when the Risk exists and is active.
- `addElement RESOLUTION` with `problem_anchor = <concern-id>` continues to succeed (no regression).
- `addElement RESOLUTION` with `problem_anchor = <unknown-id>` returns `INVALID_REFERENCE`.

**Given:** A state with one active Concern (`cern_1`) and one active Risk (`risk_1`).
**When:** Two `addElement RESOLUTION` calls — one with `problem_anchor = 'cern_1'`, one with `problem_anchor = 'risk_1'`.
**Then:** Both succeed. A third call with `problem_anchor = 'cern_99'` errors with `INVALID_REFERENCE`.

### AC-4.2 — Closure on unaddressed Risk blocks; addressed Risk unblocks

**Observable boundary:**
- A proof with an active Risk and no Resolution addressing it has `coverage_gap_detected` true; closure is not permitted.
- Adding and ratifying a Resolution with `problem_anchor = <risk-id>` clears `coverage_gap_detected`; closure becomes permitted (assuming other gates pass).

**Given:** A proof state with one active Risk and no addressing Resolution.
**When:** Closure-policy queries `closure_permitted` and `coverage_gap_detected`.
**Then:** `coverage_gap_detected` is true; `closure_permitted` is false. After adding and ratifying a Resolution with `problem_anchor` set to the Risk id, the same queries return `coverage_gap_detected` false and `closure_permitted` true.

### AC-4.3 — Closure with zero active Risks short-circuits

**Observable boundary:**
- A proof state with zero active Risks does not have `coverage_gap_detected` set by the Risk path.

**Given:** A proof state with at least one active Concern (covered) and zero active Risks.
**When:** Closure is queried.
**Then:** `closure_permitted` is true; the Risk-coverage gate does not fire as a blocking condition.

### AC-5.1 — serializeWithAllocatorState bundles allocator high-water

**Observable boundary:**
- The returned object carries both an `engine` blob and an `allocatorState` map keyed by category-shape with numeric high-water values.

**Given:** A state with `idAllocator.highWater('evidence') === 3` and `idAllocator.highWater('concern') === 2`.
**When:** `bridge.serializeWithAllocatorState({})` is invoked.
**Then:** The result has shape `{ engine: <object>, allocatorState: { evidence: 3, concern: 2, ... } }`.

### AC-5.2 — loadFromWithAllocatorState seeds the allocator

**Observable boundary:**
- After loading, the allocator's high-water for each category matches the serialized snapshot.
- A subsequent `addElement` without `args.id` produces an id strictly above the high-water of any element in the loaded state.

**Given:** A serialized state from AC-5.1.
**When:** `bridge.loadFromWithAllocatorState({}, serialized)` is invoked and then a new `addElement EVIDENCE` (no `args.id`).
**Then:** The new element's id is `evid_4` (high-water 3 + 1); no collision with any pre-existing element.

### AC-5.3 — loadFromWithAllocatorState recovers from empty allocatorState

**Observable boundary:**
- A `serialized` object whose `allocatorState` is empty or absent triggers a fallback path that scans the loaded EDB for per-category high-water marks and seeds the allocator from the scan.

**Given:** A serialized state with `allocatorState: {}` but `engine` containing elements `evid_1` through `evid_5`.
**When:** `bridge.loadFromWithAllocatorState({}, serialized)` is invoked.
**Then:** Load succeeds; allocator high-water for `evidence` is 5 after seed; a subsequent `addElement EVIDENCE` returns `evid_6`.

### AC-6.1 — Mutation result carries full element record

**Observable boundary:**
- The result of `addElement`, `reviseElement`, `reviseConcern`, `reviseProposition`, `reviseResolution` includes the full element record alongside `id`.

**Given:** A fresh state.
**When:** `addElement EVIDENCE` is invoked with full args (statement, source, etc.).
**Then:** The result has shape `{ id: <evid-id>, statement: <text>, source: <enum>, ...other fields }` matching what `renderElementDeep({ id })` would return for the new id.

### AC-6.2 — reviseConcern result carries the updated record

**Observable boundary:**
- The result of `reviseConcern` includes the updated Concern's full record (id, label, description, status, notes) without requiring a secondary `renderElementDeep` call.

**Given:** A state with Concern `cern_1` (label "X", description "Y", notes []).
**When:** `reviseConcern({ supersedes: 'cern_1', description: 'Z' }, consent)` is invoked.
**Then:** The result includes the full updated Concern record carrying the new description "Z" and the original label "X"; no second-call round-trip is needed to confirm the description was stored.

### AC-7.1 — Concern carries optional notes array

**Observable boundary:**
- A Concern admitted with `args.notes = ['n1', 'n2']` stores those notes.
- A Concern admitted without notes stores no `concern_note` facts.
- `reviseConcern` with `args.notes` replaces the array.

**Given:** A fresh state.
**When:** `addElement CONCERN` is invoked with `args.notes = ['hybrid-case', 'sequencing']`.
**Then:** Two `concern_note` facts exist in the EDB for the new Concern id. After `reviseConcern` with `args.notes = ['updated']`, only one `concern_note` fact exists.

### AC-7.2 — concern_note projects in the serialize path

**Observable boundary:**
- `renderDatalogProjection` includes `concern_note` facts in the projected output.

**Given:** A state with a Concern carrying two notes.
**When:** The state is serialized via `serializeWithAllocatorState`.
**Then:** The serialized engine blob contains both `concern_note` facts.

### AC-8.1 — VOCABULARY.md documents the closed source enum

**Observable boundary:**
- `VOCABULARY.md`'s Evidence entry contains exact text naming the four enum values: `'industry'`, `'codebase'`, `'prior-record'`, `'agent-derivation'`.

**Given:** The current VOCABULARY.md.
**When:** A test reads the file content.
**Then:** All four enum strings are present in the Evidence section; the prior free-form example values (`'design-decision'`, `'rfc'`) are removed or marked as superseded.

### AC-9.1 — Payload channel utilities round-trip

**Observable boundary:**
- `createPayloadChannel(content)` returns a string with the canonical sentinel format.
- `parsePayloadChannel(createPayloadChannel(content))` returns the original `content`.

**Given:** Any string `content`.
**When:** `createPayloadChannel(content)` then `parsePayloadChannel(...)` are invoked in sequence.
**Then:** The final result equals the original `content`.

### AC-9.2 — Malformed payload parses to null

**Observable boundary:**
- `parsePayloadChannel(raw)` returns null for strings missing the start or end sentinel.

**Given:** A string `'no sentinels here'`.
**When:** `parsePayloadChannel` is invoked.
**Then:** The return value is null; no exception is thrown.

### AC-10.1 — renderElementDeep returns full Proposition record

**Observable boundary:**
- `renderElementDeep({ id })` for a Proposition id returns `grounding` (array), `collapse_test` (string), `reasoning_chain` (string), `rejected_alternative` (array) in addition to the existing `{ id, predicate, withdrawn, statement, ... }` fields.

**Given:** A Proposition with all secondary fields populated.
**When:** `renderElementDeep({ id })` is invoked.
**Then:** The returned record carries all named fields with their stored content; no field is missing.

### AC-10.2 — renderElementDeep returns full Resolution record

**Observable boundary:**
- `renderElementDeep({ id })` for a Resolution id returns `problem_anchor` and `grounding` (array).

**Given:** A Resolution with both secondary fields populated.
**When:** `renderElementDeep` is invoked.
**Then:** The returned record carries `problem_anchor` and `grounding`.

### AC-10.3 — renderElementDeep returns Concern notes

**Observable boundary:**
- `renderElementDeep({ id })` for a Concern with non-empty `concern_note` facts returns a `notes` array in the record.
- Concerns without notes return an empty array or omit the field consistently.

**Given:** Two Concerns — one with two notes, one with none.
**When:** `renderElementDeep` is invoked on each.
**Then:** The first returns `notes: [...]` with two entries; the second returns `notes: []` (or omits the field — exact shape decided during implementation but applied consistently across both).

### AC-11.1 — Pre-ratify lint blocks on canonical-term mismatch

**Observable boundary:**
- A `ratify` call on an element whose text contains a canonical-term mismatch (uncapitalized or unmatched variant) throws `VOCABULARY_LINT_VIOLATION`.
- The thrown payload names the offending field, the offending substring, and the canonical term it conflicts with.

**Given:** A proof state with a ratified Definition having canonical term `'Reachability'`. An element being ratified contains the substring `'reachability'` (uncapitalized).
**When:** `ratify` is invoked on that element.
**Then:** The call throws `VOCABULARY_LINT_VIOLATION` naming the field, the substring `'reachability'`, and the canonical term `'Reachability'`. No commit occurs.

### AC-11.2 — Pre-ratify lint passes on canonical-term-match

**Observable boundary:**
- A `ratify` call on an element whose text uses canonical terms verbatim succeeds normally.

**Given:** The same proof state with the same ratified Definition. An element being ratified uses `'Reachability'` (canonical form).
**When:** `ratify` is invoked.
**Then:** The lint passes; commit occurs; the element is ratified.

### AC-11.3 — Pre-ratify lint passes when no Definitions are ratified

**Observable boundary:**
- A `ratify` call on a proof state with no ratified Definitions succeeds regardless of element text.

**Given:** A proof state with zero ratified Definitions.
**When:** `ratify` is invoked on any element.
**Then:** The lint short-circuits and passes; ratification proceeds normally.

### AC-12.1 — reviseProposition is atomic add-plus-ratify

**Observable boundary:**
- `reviseProposition({ supersedes, ...newFields }, consent)` admits a new Proposition with a new id, marks `superseded(new_id, supersedes)`, and emits `approved(new_id, source, ts)` plus `two_yes(new_id, source)` in the same transaction.

**Given:** A state with a ratified Proposition `prop_1`.
**When:** `reviseProposition({ supersedes: 'prop_1', statement: 'new text', ...other fields }, consent)` is invoked.
**Then:** A new Proposition `prop_2` exists, is ratified, and `superseded(prop_2, prop_1)` holds. All facts emit in one transaction.

### AC-12.2 — reviseResolution is atomic add-plus-ratify

**Observable boundary:** Same as AC-12.1 but for Resolution.

**Given:** A state with a ratified Resolution `res_1`.
**When:** `reviseResolution({ supersedes: 'res_1', problem_anchor: 'cern_1', ...other fields }, consent)` is invoked.
**Then:** A new Resolution `res_2` exists, is ratified, and supersedes `res_1`. One transaction.

### AC-12.3 — Wording cleanup using new revise verbs costs ≤ 1 operation per element

**Observable boundary:**
- A cleanup operation that revises one Proposition and one dependent Resolution completes in at most two `runOperation` invocations (one per element).

**Given:** A state with one ratified Proposition `prop_1` and one ratified Resolution `res_1` whose grounding cites `prop_1`.
**When:** `reviseProposition({ supersedes: 'prop_1', ...new content }, consent)` is invoked, followed by `reviseResolution({ supersedes: 'res_1', grounding: [new prop_id], ...new content }, consent)`.
**Then:** Both elements are revised, both are ratified, the dependent grounding cites the new Proposition id. Exactly two `runOperation` calls executed. Operation log carries exactly two entries.

### AC-12.4 — Implementation probe resolves grounding_updates parameter

**Observable boundary:**
- The implementation includes a probe verifying whether the rule-cascade design (Domain Spec §3.4 — Propositions as rules with approval body literal) handles dependent-element rewiring without an explicit `grounding_updates` parameter.
- If the probe confirms rule cascade is sufficient, the `grounding_updates` parameter is dropped from the verb's `argShape` and the dependent-rewiring portion of the translator is removed.
- If the probe shows rule cascade does not handle dependent rewiring (or handles it only partially), `grounding_updates` is retained as an optional parameter and the translator's retract+assert path is implemented as described.

**Given:** A working implementation of `reviseProposition` and `reviseResolution` without `grounding_updates`.
**When:** A test scenario revises `prop_1` (cited by `res_1.grounding`) and queries the derived `proposition(prop_1, ...)` and `proposition(prop_2, ...)` facts after the revise.
**Then:** Either (a) `prop_1` no longer appears in the derived set and `res_1`'s grounding citation automatically reflects the supersession via rule cascade — in which case `grounding_updates` is dropped; or (b) `prop_1` still appears in `res_1`'s grounding even after the revise — in which case `grounding_updates` is retained and a separate test confirms it correctly rewires the citation.

### AC-13.1 — Existing tests pass with shape migrations

**Observable boundary:**
- The full existing test suite under `domain/__tests__/`, `domain/structural-tests/`, and `engine/__tests__/` passes after the changes.
- The only test modifications are: `mutations.test.js` named-verb count assertion (8 → 10); `resolution-schema.test.js` `referenceFields.problem_anchor` shape (`'concern'` → `['concern', 'risk']`); any test pattern-matching strictly on the bare-id-string result shape from mutations (updated to the broadened `{ id, ...fields }` shape).

**Given:** The current state of `domain/__tests__/`, `domain/structural-tests/`, and `engine/__tests__/`.
**When:** All tests are run after the implementation lands.
**Then:** All tests pass. No semantic test (closure, friction, ratification, completeness, schema, etc.) requires changes beyond the three mechanical updates named above.

<!-- created-at: 2026-05-18T16:53:12Z -->
<!-- produced-by design-specify@v0003 -->
