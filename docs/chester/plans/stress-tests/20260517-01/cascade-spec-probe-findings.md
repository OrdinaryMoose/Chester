# Cascade-Spec Probe Findings — 2026-05-17

**Probe script:** `cascade-spec-probe-simulation.mjs` (this directory)
**Cascade reference:** `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/05-domain-spec.md` §3
**Implementation reference:** `skills/design-proof-system/references/domain/` (`schema.js`, `translation.js`, `tags.js`, `FactStore.js`)
**Method:** A calculator-domain proof was rebuilt twice — once with cascade-spec field names and enum values, once with mixed shapes to isolate the grounding-array engine path. 29 attempts, 16 failures across two distinct failure layers.

This document catalogs every finding the probe surfaced. Each entry lists the problem, the operational effect on the proof system, and a recommended remediation. Findings are grouped by severity; within a severity bucket, ordering follows blast radius.

---

## Severity: HIGH — runtime-functional or silent-corruption

These findings either crash on first spec-conformant call or quietly drop spec-required data so the call appears to succeed when it has not recorded what the caller asked for.

### H-1. PROPOSITION grounding must be an array per spec; engine rejects arrays

- **Problem.** Cascade §3.4 specifies `grounding` as a non-empty array of element IDs. The translator at `translation.js:31` stores `args.grounding` as a single positional argument (no spread). The engine's `FactStore._validateArgs` (`FactStore.js:24-30`) accepts only `string | finite number | boolean | null` as a constant and throws `TYPE_ERROR: non-constant argument` when it sees an array.
- **Effect.** Any caller who follows the spec literally crashes on the first `assertFact` for `grounding/2`. Today this is masked because every existing simulation and test passes a string id, which the engine accepts. Multi-evidence propositions are unrepresentable. The single-element array is also rejected — the failure is array-shape-specific, not multi-element-specific. Closure conditions that look for `effective_grounding` over a Proposition with two pieces of evidence cannot be expressed at all.
- **Probe evidence.** Attempts 26 and 27 both failed `TYPE_ERROR: non-constant argument: evidence_9,evidence_10` and `non-constant argument: evidence_9`. The control with a string id (attempt 28) succeeded.
- **Recommended remediation.** Match the RESOLUTION precedent at `translation.js:49`: spread `grounding` into one `grounding/2` fact per element id. Update `EDB_PREDICATES`, `PROJECTION_ARITIES`, and `validPredicates` accordingly (they already exist for `grounding`; no new whitelist entries needed). Add a `nonEmptyArrayFields` directive to `verifyArgsShape` so the schema gate enforces "grounding is a non-empty array" before the translator runs. Update the PROPOSITION descriptor's `nonEmptyArrayFields` to include `grounding`. Cascade is the source of truth; the implementation should align to spec, not vice versa.

### H-2. PERMISSION.relieves is silently accepted-and-discarded

- **Problem.** Cascade §3.3 marks `relieves` as a *required* field (a permission must point at the rule it relieves). `schema.js:25` lists `requiredFields: ['statement']`. The verifier does not reject unknown fields, so a caller that submits `{statement, relieves}` succeeds at the schema gate, but `translation.js:23-27` emits only `permission_decl(PermId, Statement)` and ignores `args.relieves`. No `permission(PermId, Statement, RuleId)` fact ever enters the EDB.
- **Effect.** Every Permission in the system is structurally unlinked from the Rule it relieves. Any closure condition, friction-detection rule, or render block that depends on "this permission relieves this rule" is currently unreachable. The framework looks like it accepts the data; it actually loses it. This is the worst flavor of drift — there is no error message to catch, no test to fail, and a caller has no way to discover that the link was discarded short of querying the EDB.
- **Probe evidence.** Attempts 12 and 13 each submitted `relieves: rule_1` / `relieves: rule_2`. Both calls returned `{id: permission_3}` and `{id: permission_4}` — apparent success. A subsequent `queryProof({ pattern: ['permission', [...]] })` would return zero rows.
- **Recommended remediation.** Add `relieves` to PERMISSION's `requiredFields`. Update the PERMISSION translator to emit `permission(PermId, Statement, RuleId)` per spec §3.3, plus optional `permission_scope(PermId, ScopeConstraint)` when `scope_constraint` is supplied. Add a domain-side validation that `relieves` references an existing Rule before assertion (per spec §3.3 final paragraph). Update `EDB_PREDICATES` and `PROJECTION_ARITIES` to include the new `permission/3` and `permission_scope/2` predicates.

### H-3. RISK.basis is silently accepted-and-discarded

- **Problem.** Cascade §3.5 marks `basis` as a required field (a risk must point at the elements it attaches to). `schema.js:45` lists `requiredFields: ['statement']` and `optionalFields: ['severity']`. `severity` is not in the spec; `basis` is in the spec but not in the schema. `translation.js:41-44` emits only `risk(RiskId, Statement, severity)` and ignores `basis`. The spec-named predicate `risk_basis(RiskId, ElementId)` never enters the EDB.
- **Effect.** Risks float free of the elements they are supposedly attached to. The cascade's "rebuttal/reservation layer" semantic is missing — a risk cannot say *what it is a risk about*. Any future rule that detects "risk-anchored proposition needs an addressing resolution" or "withdrawing element X transitively withdraws risks based on it" has no data to operate on. Same silent-drop failure mode as H-2.
- **Probe evidence.** Attempts 17 and 18 submitted `basis: [prop_id]`. Both succeeded with `risk_5` / `risk_6` ids. No `risk_basis` facts entered the EDB.
- **Recommended remediation.** Add `basis` to RISK's `requiredFields` as a non-empty array. Update the RISK translator to spread basis into one `risk_basis(RiskId, ElementId)` fact per element. Remove the `severity` optional field (not in spec) or escalate to a spec amendment if the team wants to keep it. Update whitelists.

### H-4. EVIDENCE source-authority is inverted relative to spec

- **Problem.** Cascade §3.1 says `source` must be one of `codebase | industry | prior-record | agent-derivation` (a closed enum) and must NOT be `designer`. The implementation has no `source` enum at all; it has `sourceConstraint: CONSENT_SOURCES.DESIGNER` at `schema.js:8`, which means the consent token's source must be `designer`. The implementation conflates "evidence source" (a property of the evidence itself) with "consent source" (the operator identity making the operation), and on top of that requires exactly the value the spec forbids.
- **Effect.** A spec-conformant agent that asserts `source: 'codebase'` cannot today; the framework would either reject the unknown source or accept it and discard the field (the probe could not test this directly because field-name drift at `claim`/`statement` blocked the path). Worse, the framework grants the authority class — `designer` — that the spec specifically forbids for Evidence. The cascade's intent (Evidence is *not* designer-asserted; it is empirical) is structurally negated. Authority semantics in the proof are currently meaningless for Evidence.
- **Probe evidence.** Attempts 5-9 all failed before reaching the source-validation step because of the `claim`/`statement` field-name drift. Inspection of `schema.js:8` and `tags.js:16-18` confirms the inversion. No `INVALID_SOURCE` code path exists.
- **Recommended remediation.** Treat `source` as an Evidence-domain field, not a consent-token field. Add an `EVIDENCE_SOURCES` enum in `tags.js` with the four spec values. Add `source` to EVIDENCE's `closedEnumFields` in `schema.js`. Remove `sourceConstraint: CONSENT_SOURCES.DESIGNER` for EVIDENCE — or invert it to "consent source is *not* designer" if there is still a consent-axis check the framework wants to keep. Update the EVIDENCE translator to emit `evidence(EvId, Statement, Source)` with all three positions populated.

---

## Severity: MEDIUM — structural representation gaps

These findings prevent the implementation from representing structures the spec defines, but they do not crash or silently corrupt during ordinary use; they instead reduce the proof system's expressive coverage.

### M-1. RESOLUTION collapses spec's two required fields into one

- **Problem.** Cascade §3.6 specifies two distinct required fields: `problem_anchor` (the CONCERN this resolution addresses) and `grounding` (the array of Proposition ids that justify it). `schema.js:55` defines a single required field `addresses` that conflates these two roles. The translator at `translation.js:47-50` spreads `addresses` as a single relationship — there is no separation between "what concern" and "what propositions ground this".
- **Effect.** A resolution cannot independently declare its problem anchor and its grounding propositions. Spec §3.6's engine rule `addresses(ResoId, ConcernId, Ratification) :- proposition(N1, _), proposition(N2, _), approved(...)` requires both — a concern id in the head and proposition ids in the body. The implementation cannot generate this rule because it cannot distinguish the two field meanings. Closure-condition queries that walk "concern → resolutions addressing it → propositions grounding those resolutions" cannot be expressed faithfully.
- **Probe evidence.** Attempts 21 and 22 failed `SHAPE_INVALID: missing required field "addresses"` when the probe submitted `problem_anchor` + `grounding[]` instead.
- **Recommended remediation.** Replace RESOLUTION `requiredFields: ['statement', 'addresses']` with `['statement', 'problem_anchor', 'grounding']`. Update the translator to emit two distinct relations: one `resolution_problem_anchor(ResoId, ConcernId)` and one `resolution_grounding(ResoId, PropId)` per proposition in the grounding array. Or align literally with spec §3.6's `addresses/3` head predicate by generating a parameterized rule per resolution.

### M-2. FRICTION cannot represent the two anchored elements

- **Problem.** Cascade §3.7 specifies `anchor_a` and `anchor_b` as required fields — a friction is by definition a tension between two specific elements. `schema.js:65` lists `requiredFields: ['shape', 'description']` and has no anchor fields at all. The translator at `translation.js:54-58` emits `friction(FricId, Shape, Description, Disposition)` with no anchor positions, contradicting spec §3.7's engine fact `friction(FricId, Shape, AnchorA, AnchorB, Disposition)`.
- **Effect.** Frictions are recorded as floating tensions without subjects. The framework cannot answer "which two elements are in tension here?" — a question central to the friction concept. Spec §8's friction-detection rules (when reintroduced) cannot fire because they need anchor pairs to match against. The render layer cannot present "Friction between *X* and *Y*" prose. Any disposition transition is unanchored — `dissolved-by-revision` cannot identify which anchor was revised.
- **Probe evidence.** Attempt 23 failed `SHAPE_INVALID: missing required field "shape"` (the spec uses `friction_shape`; impl uses `shape`). Even after that name drift were resolved, the spec's `anchor_a` and `anchor_b` would be silently dropped at the next layer.
- **Recommended remediation.** Add `friction_shape` (renamed from `shape`), `anchor_a`, `anchor_b` to FRICTION's `requiredFields`. Make `description`/`statement` optional per spec. Update the FRICTION translator to emit `friction(FricId, Shape, AnchorA, AnchorB, Disposition)` matching spec §3.7's engine representation. Add domain-side validation that anchor IDs reference existing elements before assertion.

### M-3. PROPOSITION inference_pattern enum has different values than spec

- **Problem.** Cascade §3.4.1 names five closed-set inference patterns: `grounds-imply-conclusion`, `rule-applies-to-case`, `permission-licenses-relaxation`, `definition-substitution`, `proposition-composition`. `tags.js:20-25` defines `INFERENCE_PATTERNS` with four entirely different values: `grounds_imply_conclusion`, `absence_implies_absence`, `enablement`, `structural`. The first value differs only in hyphen vs underscore; the remaining three on each side have no overlap.
- **Effect.** A spec-conformant agent picking `permission-licenses-relaxation` is rejected at the schema gate (`SHAPE_INVALID` via `assertExhaustive`). Three of the spec's five patterns cannot be expressed in the implementation. The implementation's `absence_implies_absence`, `enablement`, and `structural` patterns are not mentioned in spec §3.4.1 — they are either implementation inventions or unwritten spec extensions. Render output that names the inference move ("by permission-licenses-relaxation") cannot be produced.
- **Probe evidence.** Attempts 14-16 all failed `Unexhausted inference_pattern: "grounds-imply-conclusion" not in [...]` and `"proposition-composition" not in [...]`.
- **Recommended remediation.** Decide which list is authoritative. Either: (a) rewrite `INFERENCE_PATTERNS` to mirror spec §3.4.1 exactly, hyphens and all, and update every test fixture and simulation; or (b) write an ADR amending the spec to use the implementation's four values, then update spec §3.4.1 to match. The hyphen/underscore choice should be unified across all enums at the same time.

### M-4. FRICTION friction_shape enum: complete vocabulary replacement

- **Problem.** Cascade §3.7.1 specifies four shapes: `proposition-proposition-opposing-pull`, `resolution-rule-conflict`, `permission-risk-linkage`, `concern-concern-competition`. `tags.js:27-31` defines `FRICTION_SHAPES` with five entirely different values: `coverage_gap`, `overlap`, `conflict`, `ungrounded`, `stagnation`. Zero overlap.
- **Effect.** The two vocabularies describe friction at different conceptual layers. Spec's shapes are *relational* (about which categories the friction is between); impl's are *kind-of-defect* (gap vs overlap vs conflict). Neither maps onto the other. A spec-conformant detection rule for `proposition-proposition-opposing-pull` cannot be expressed; an impl-conformant detection rule for `coverage_gap` has no spec referent. Per CLAUDE.md the design-proof-system has its own boundary, so cross-system harmonization is not in play — but within design-proof-system, schema and spec are not the same system.
- **Probe evidence.** Attempt 23 failed at the `shape`/`friction_shape` field-name gate before the enum was reached. Inspection of `tags.js:27` and spec §3.7.1 confirms the divergence.
- **Recommended remediation.** This is a spec-vs-implementation conceptual decision, not a renaming. The team should pick which conceptual model the framework will support — relational shapes per spec, defect-kinds per impl — and write an ADR. After ratification, align the other side. Friction-detection rules in spec §8 (when reintroduced) need to use whichever vocabulary is chosen.

### M-5. FRICTION disposition enum: complete vocabulary replacement

- **Problem.** Cascade §3.7.2 specifies five terminal-tagged dispositions: `lived-with`, `relieved-by-exception`, `dissolved-by-revision`, `dissolved-by-scope-cut`, `not-really-friction`. `tags.js:33-35` defines `FRICTION_DISPOSITIONS` with four operationally-different values: `address`, `defer`, `dismiss`, `override`. No overlap.
- **Effect.** The spec's dispositions are *terminal-or-not* states (three of the five transition the friction to withdrawn automatically); the impl's are *operator-action* labels with no explicit terminal semantics. The withdrawal-cascade rule in spec §3.7.2 final paragraph ("Terminal dispositions transition the friction to `withdrawn` status automatically") cannot be implemented against impl values because the impl values do not declare terminality.
- **Probe evidence.** Attempt 23 did not reach the disposition gate, but inspection confirms the divergence.
- **Recommended remediation.** Same as M-4 — ADR decision on which vocabulary to keep, then alignment. If the spec disposition vocabulary is kept, add a `TERMINAL_DISPOSITIONS` set in `tags.js` so the lifecycle module can implement the auto-withdraw rule.

---

## Severity: LOW — naming drift with no semantic gap

These are field-name renames between cascade and implementation. They block spec-conformant callers at the schema gate but the underlying concept exists on both sides.

### L-1. EVIDENCE field name: spec `statement` vs impl `claim`

- **Problem.** Cascade §3.1 uses `statement` for the evidence prose. `schema.js:5` uses `claim`. Same concept, different word.
- **Effect.** Five spec-conformant evidence submissions failed `SHAPE_INVALID: missing required field "claim"`. The translator emits `evidence(EvId, Source, Claim)` using the impl name; spec §3.1 specifies `evidence(EvId, Statement, Source)` (which also reorders the positional arguments — see follow-up note).
- **Probe evidence.** Attempts 5-9.
- **Recommended remediation.** Rename impl field `claim` → `statement` throughout `schema.js`, `translation.js`, `__tests__/`, and all simulations. Reorder the positional `evidence/3` fact arguments to match spec (`EvId, Statement, Source`). This is one ADR + one mechanical renaming pass.

### L-2. DEFINITION field name: spec `canonical_name` vs impl `term`

- **Problem.** Cascade §3.9 uses `canonical_name`. `schema.js:85` uses `term`. Same concept.
- **Effect.** Three spec-conformant definition submissions failed `SHAPE_INVALID: missing required field "term"`. The render section header "Definitions" still works because the underlying string is present, but the field-name contract differs from cascade.
- **Probe evidence.** Attempts 2-4.
- **Recommended remediation.** Rename `term` → `canonical_name` across `schema.js`, the DEFINITION translator, `addDefinition` facade arg names, tests, and simulations. Same mechanical pattern as L-1.

### L-3. DEFINITION missing spec-optional fields

- **Problem.** Cascade §3.9 lists optionals `aliases` (array of strings), `sense_constraints`, `status`, `revision`, `history`. None of these appear in `schema.js:85-92`; the only optional is `scope` (not in spec). The translator emits `definition_decl(DefId, Term, Definition)` with no provision for alias or status facts.
- **Effect.** Definition aliases (e.g. "Calculator" alias "calc") cannot be recorded. Status transitions (`draft → ratified → withdrawn → deprecated`) for definitions cannot be expressed independently of the global element-status fact. Revision history is unreachable.
- **Probe evidence.** Attempt 2 submitted `aliases: ['calc']` and `sense_constraints: '...'`; the submission failed on `canonical_name`/`term` before these could be evaluated, but inspection confirms the optionals are not in the registry.
- **Recommended remediation.** Add `aliases`, `sense_constraints` to DEFINITION's `optionalFields`. Update the translator to emit one `definition_alias(DefId, Alias)` per alias. Decide whether `status`, `revision`, `history` are duplicative of the global `element_status` lifecycle (spec §3.10) — if so, drop from spec; if not, add status-specialized predicates.

### L-4. FRICTION spec `statement` is optional, impl `description` is required

- **Problem.** Cascade §3.7 marks `statement` as optional. `schema.js:65` makes `description` required. Inverse requiredness.
- **Effect.** A spec-conformant friction submitted with only the four anchor/shape/disposition fields (no statement) is rejected by the impl. Conversely, the impl will accept a friction with a description but no anchors, which the spec considers invalid (see M-2).
- **Probe evidence.** Attempt 23 surfaced `shape` before this; once that is fixed, the requiredness divergence becomes the next blocker.
- **Recommended remediation.** Make `statement` optional on FRICTION after renaming impl `description` → `statement`. Couple this remediation to M-2.

### L-5. PROPOSITION spec `inference_pattern` is optional, impl is required

- **Problem.** Cascade §3.4 lists `inference_pattern` under "Optional but encouraged". `schema.js:35` lists it in `requiredFields`.
- **Effect.** A spec-conformant agent that omits `inference_pattern` is rejected. The proof can be built without naming the inference move; spec allows that, impl does not.
- **Probe evidence.** Not directly probed (every probe attempt supplied the pattern), but visible by inspection.
- **Recommended remediation.** Move `inference_pattern` from PROPOSITION's `requiredFields` to `optionalFields`. Update the translator to emit `inference_pattern(PropId, Pattern)` only when supplied. Update render to omit the inference-move line when the pattern is absent.

---

## Cross-cutting observations

These are not findings on individual categories; they are patterns the probe surfaced about *how* the drift is sustained.

- **No unknown-field rejection.** `verifyArgsShape` checks that required fields are present and closed-enum values are in-set. It does not reject unknown keys. Every spec-required field that is absent from `requiredFields` becomes a silent-drop field. This is the mechanism behind H-2 (PERMISSION.relieves) and H-3 (RISK.basis). Adding a strict-mode `unknownFieldPolicy: 'reject'` to `verifyArgsShape` would have surfaced both at sprint-02-bug-fix-01 and would surface any future drift instance immediately.
- **Three parallel whitelists, no enforcement.** `EDB_PREDICATES` (translation.js), `PROJECTION_ARITIES` (render.js), and `validPredicates` (domain-bridge.js — two copies at lines 50 and 198). The sprint-02-bug-fix-01 summary already noted this. Every remediation in this document that adds a new predicate (H-2's `permission/3`, H-3's `risk_basis/2`, M-1's `resolution_problem_anchor/2`, M-2's `friction/5` arity change, L-3's `definition_alias/2`) requires three coordinated edits plus the comment-only documentation. The structural risk grows with each remediation.
- **Spec authority is unevenly enforced.** Where spec defines closed enums (PROPOSITION.inference_pattern, FRICTION.friction_shape, FRICTION.disposition), the impl has a parallel enum with different values. Where spec defines required *fields* (PERMISSION.relieves, RISK.basis), the impl has no field at all. The first failure mode is loud; the second is silent. The silent class is more dangerous and should be the priority for the strict-mode policy above.
- **Enum hyphen vs underscore is unresolved.** Spec uses hyphens (`grounds-imply-conclusion`, `lived-with`). Impl uses underscores (`grounds_imply_conclusion`, `address`). Whichever direction is chosen, it should be applied uniformly across all enums at once via a single ADR; piecemeal alignment will produce more drift.

---

## Recommended sequencing

If a single follow-up sub-sprint is funded, the priority order by impact-to-correctness is:

- **First** — H-2 (PERMISSION.relieves) and H-3 (RISK.basis). Silent data loss is the most dangerous class of drift because it appears to work. Both are mechanically similar to the PROPOSITION.reasoning_chain restoration sprint-02-bug-fix-01 already executed.
- **Second** — H-1 (grounding array). Engine-level crash for any spec-conformant multi-evidence proposition. Mechanically aligns with RESOLUTION.addresses spreading already in place at `translation.js:49`.
- **Third** — H-4 (EVIDENCE source authority). Semantic inversion requires a tags.js addition and a schema rule change; deeper but unique-in-kind among findings.
- **Fourth** — M-1 and M-2 (RESOLUTION and FRICTION structural fields). Each is a category-shape change; each merits its own pass.
- **Fifth** — M-3/M-4/M-5 (enum drift). These are spec-vs-impl decisions that need an ADR before code change. Group them into one ADR sprint.
- **Last** — L-1 through L-5 (naming and requiredness drift). Easy renames; do them after the structural decisions are settled so the renames don't have to be re-done.

A standalone first action that pays back immediately: add `unknownFieldPolicy: 'reject'` to `verifyArgsShape` and turn it on for all nine descriptors. That single change converts every future silent-drop case into a loud `SHAPE_INVALID` finding at submission time. It would have caught both H-2 and H-3 at sprint-02-bug-fix-01 without any field-by-field audit.
