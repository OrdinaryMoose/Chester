# Design Brief: Restore reasoning_chain and rejected_alternatives to PROPOSITION schema

## Goal

The domain layer's `PROPOSITION` schema entry is missing two fields the cascade specifies. `05-domain-spec.md` §3.4 lists PROPOSITION's required fields as `statement, grounding, collapse_test, reasoning_chain` and its encouraged-optional fields as `rejected_alternatives, inference_pattern`. The implementation in `schema.js:31-39` carries only `statement, grounding, collapse_test, inference_pattern` as required and `scope` as optional — `reasoning_chain` and `rejected_alternatives` are entirely absent. The translator at `translation.js:28-36` consequently emits no `reasoning_chain/2` or `rejected_alternative/3` meta-facts, the EDB whitelist at `translation.js:180-188` does not list either predicate, and the structured-proof render has no field to surface even if upstream callers were to pass values. This bug-fix sub-sprint restores both fields end-to-end so the implementation conforms to the cascade contract.

## Prior Art

The proof system's design cascade (`docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/`) treats both fields as load-bearing, not optional flourishes:

- `05-domain-spec.md:120` lists `reasoning_chain` as a PROPOSITION required field: "prose IF/THEN inference."
- `05-domain-spec.md:123` lists `rejected_alternatives` as encouraged-optional: "array of `{statement, rejection_reason}` objects."
- `05-domain-spec.md:138-142` specifies the engine meta-facts: `reasoning_chain(PropId, Text)` and `rejected_alternative(PropId, AltStatement, Reason)` — one fact per alternative.
- `00-glossary.md:40-42` carries both terms as canonical PROPOSITION vocabulary.
- `01-vision.md:45` names them among the four typed-field shapes that channel the agent into the system's vocabulary: "collapse_test asks for the contrapositive; reasoning_chain asks for IF/THEN; rejected_alternatives asks for considered options; relieves asks for a back-pointer."
- `01-vision.md:99` and ADR-0008 §"Loss of expressive flexibility" both name `rejected_alternatives` explicitly as one of the architecture's three mechanisms for preserving exploratory slack inside the channeling discipline (alongside FRICTION and the `lived-with`/`relieved-by-exception` dispositions).
- ADR-0008 §"Typed fields as generative prompts" identifies `reasoning_chain = IF/THEN` and `rejected_alternatives = considered options` as two of the three field shapes that prevent agent drift into implementation prose. Dropping them weakens the channeling architecture's bite.
- ADR-0006 §"Rendered proof format" shows the rendered structured-prose form including a `Reasoning: {reasoning_chain}` line per Proposition.

Implementation state in `skills/design-proof-system/references/domain/`:

- `schema.js:31-39` — `CATEGORY_REGISTRY[PROPOSITION]` has `requiredFields: ['statement', 'grounding', 'collapse_test', 'inference_pattern']` and `optionalFields: ['scope']`. Neither cascade-required `reasoning_chain` nor cascade-optional `rejected_alternatives` appears.
- `translation.js:28-36` — the PROPOSITION translator emits `proposition_decl/3`, `grounding/2`, `collapse_test/2`, and `created_at/2`. No `reasoning_chain/2` is emitted; no `rejected_alternative/3` per-alternative facts are emitted.
- `translation.js:180-188` — `EDB_PREDICATES` whitelist lists `proposition_decl, grounding, collapse_test` but neither `reasoning_chain` nor `rejected_alternative`. Boot-validator rejection of unknown EDB predicates means even a hand-authored translator change would be refused by `boot-validators.js` until the whitelist is extended.
- `render.js` — the structured-proof view has no surface for either field; per ADR-0006 the rendered form should include a `Reasoning:` line per Proposition and a presentation of rejected alternatives.
- `__tests__/schema.test.js`, `__tests__/translation.test.js`, `__tests__/domain-bridge.test.js` — no test asserts presence or shape of either field today; missing-field tests for PROPOSITION assert against the current four-field shape and will need extension, not replacement.

Origin of the gap (traced via git and sprint artifacts): the fields were never present in the design-proof-system implementation. `schema.js` was born in commit `82c6ebc` ("feat(domain): schema.js with CATEGORY_REGISTRY and verifyArgsShape") with the current four-field PROPOSITION descriptor. The sprint-02 plan (`sprint-02-proof-layer-plan-00.md:521`) cited the cascade as "(Proposition with grounding/collapse_test/inference_pattern)" — naming three fields, not five — and the implementation followed the plan. No ADR or sprint summary records a decision to omit either field. The sprint-02 design brief (`sprint-02-proof-layer-design-00.md:46`) explicitly stated: "Content of the Domain — schema, mutations, … — is fixed by `05-domain-spec.md`. Sprint-02 designs structure, not content." So the brief's intent was cascade-faithful content; the gap is a transcription omission, not an architectural choice.

The eight existing element categories follow a uniform translation pattern: each translator returns `{baseFacts, rules, metaFacts}`. Per-element variable-arity facts (one fact per item in an input array) already exist as a pattern — see the RESOLUTION translator at `translation.js:42-49` which spreads `args.addresses` into one `addresses/2` fact per address. The `rejected_alternative` translator can reuse that pattern.

This sub-sprint's parent is the master plan `20260511-01-mp-redesign-proof-system`. The work happens on a new branch `sprint-02-bug-fix-01` in `.worktrees/sprint-02-bug-fix-01/`.

## Scope

**In scope:**
- Add `reasoning_chain` to `CATEGORY_REGISTRY[PROPOSITION].requiredFields` in `schema.js`.
- Add `rejected_alternatives` to `CATEGORY_REGISTRY[PROPOSITION].optionalFields` in `schema.js`.
- Extend the PROPOSITION translator in `translation.js` to emit `reasoning_chain(PropId, Text)` as a baseFact whenever `args.reasoning_chain` is present, and to spread `args.rejected_alternatives` (an array of `{statement, rejection_reason}` objects) into one `rejected_alternative(PropId, Statement, Reason)` baseFact per element.
- Add both predicate names (`reasoning_chain`, `rejected_alternative`) to the `EDB_PREDICATES` whitelist in `translation.js`.
- Extend the structured-proof rendering in `render.js` to surface both fields per ADR-0006 — a `Reasoning:` line carrying the `reasoning_chain` text and a `Rejected alternatives:` block listing each alternative's statement and reason. Rendering is a passive read of the meta-facts; no new derived predicate is required.
- Unit-test additions covering: (1) schema entry shape post-extension; (2) `verifyArgsShape` rejects PROPOSITION args that omit `reasoning_chain` with `code: 'SHAPE_INVALID', field: 'reasoning_chain'`; (3) translator emits the new baseFacts with correct arities; (4) translator spreads the rejected-alternatives array correctly (zero, one, and many alternatives); (5) `domain-bridge.runOperation('add', ...)` accepts the extended PROPOSITION shape and persists the new facts.
- Repair any existing PROPOSITION fixtures in the test suite that construct propositions with the old four-required-field shape — they will start failing once `reasoning_chain` becomes required.

**Out of scope:**
- Engine-layer changes — the engine treats `reasoning_chain/2` and `rejected_alternative/3` as generic ground atoms; no engine work needed.
- New friction-policy or closure-policy rules consuming these meta-facts. ADR-0008 anticipates an Adversary process that audits whether `rejected_alternatives` are *genuine* and `reasoning_chain` is *substantive* — but the Adversary is explicitly deferred per `02-conops.md:42` ("not yet implemented in the engine but is anticipated by the architecture"). This sub-sprint restores the data shape; it does not add semantic gates over it.
- Changes to any element category other than PROPOSITION. The cascade-vs-implementation field audit was performed only for PROPOSITION; a broader audit is a separate work item (see Key Decision 3 below).
- Cascade edits — `05-domain-spec.md` and ADR-0008 are the normative source for this work; the fix conforms to them and does not amend them.
- Renaming, restructuring, or repositioning either field. The cascade's field names, fact arities, and required-vs-optional discrimination are taken as given.
- Restoring the fields through upstream MCP tool surfaces or interface-layer entry points — sprint-03 is the presentation layer's sub-sprint and will pick up the new fields through the existing bridge facade once they exist in the schema.

## Key Decisions

1. **`reasoning_chain` is restored as required, not relaxed to optional.** The cascade `05-domain-spec.md:120` lists it as a required field. The plain restoration honors the cascade contract. *Alternative considered:* restore it as optional to reduce blast radius on existing PROPOSITION constructions. *Rejected* because (a) the cascade and ADR-0008 treat it as load-bearing to the channeling architecture's bite, and (b) any existing constructions that omit it are themselves cascade-non-conforming — relaxing the schema to accommodate them would entrench the gap rather than close it. A cascade ADR demoting `reasoning_chain` to optional would be the legitimate path if the requirement is to be weakened; this sub-sprint does not pursue that path.

2. **`rejected_alternatives` is shaped as an array of typed objects, not a string list.** Cascade `05-domain-spec.md:123` specifies `{statement, rejection_reason}` objects; the glossary at `00-glossary.md:42` notes a future direction toward making each a typed `REJECTED_ALTERNATIVE` element. This sub-sprint stays with the object-array shape per cascade §3.4 and leaves the future REJECTED_ALTERNATIVE-as-element direction to a later ADR. *Alternative considered:* implement the future direction now (one REJECTED_ALTERNATIVE element per alternative, with its own id and lifecycle). *Rejected* because it expands scope beyond a transcription-gap repair into a category-introduction sub-sprint requiring its own design brief and architectural review.

3. **Audit scope is PROPOSITION-only; broader cascade-vs-implementation field audit is deferred.** This sub-sprint repairs the one gap surfaced by the user inquiry. A systematic audit of all eight (now nine, counting CONCERN) element categories against §3.1–3.9 may surface other transcription gaps. Performing that audit inside this sub-sprint would extend it past the natural bug-fix boundary and obscure which findings belong to which lineage of decisions. *Alternative considered:* run the full audit now and fold all findings into one sub-sprint. *Rejected* because category-by-category gaps may have distinct rationales (or distinct absent rationales) that deserve separate treatment; bundling forces a single resolution stance across heterogeneous findings.

4. **Rendering is a separate concern handled in scope, not deferred to sprint-03.** ADR-0006 specifies the structured-proof rendered form as including these fields. Leaving `render.js` unchanged after schema extension would mean the new data exists but is invisible to the designer at the point of review — a partial fix that hides the gap rather than closing it. *Alternative considered:* schema/translator only in this sub-sprint, render in a follow-up. *Rejected* because the user-visible failure (a designer reading a rendered proof cannot see whether reasoning chains and rejected alternatives are substantive) is precisely the failure mode ADR-0006 was written to address.

## Constraints

- Cascade `05-domain-spec.md` §3.4 and §3.4.1 are normative. Field names (`reasoning_chain`, `rejected_alternatives`), fact arities (`reasoning_chain/2`, `rejected_alternative/3`), and per-alternative object shape (`{statement, rejection_reason}`) must match the cascade exactly.
- The eight other element-category schemas must not be modified — this sub-sprint touches only the PROPOSITION descriptor.
- The fix must not regress the existing domain test suite or engine test suite at branch HEAD. Fixture updates required to accommodate the new required field must be confined to PROPOSITION fixtures.
- Existing bridge entry points (`addElement`, `reviseElement`, `withdrawElement`, `ratifyElement`) are not changed; the new fields flow through the unchanged generic surface.
- The cascade `design-documents/` directory is not edited by this sub-sprint without an accompanying ADR; this work conforms to the cascade, it does not amend it.
- Test discipline: per repo CLAUDE.md and decision record dr-20260514-06 (cross-layer real-import convention), tests must use real imports of the modules under test, not mocks.
- This sub-sprint observes the system boundary: no reference to or research into systems outside this sub-sprint's scope; all citations are internal to the design-proof-system cascade and implementation.

## Acceptance Criteria

- `CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION].requiredFields` equals `['statement', 'grounding', 'collapse_test', 'inference_pattern', 'reasoning_chain']`. The order matches the cascade enumeration order.
- `CATEGORY_REGISTRY[ELEMENT_CATEGORIES.PROPOSITION].optionalFields` contains `'rejected_alternatives'` alongside any existing entries.
- `verifyArgsShape({ statement: 'S', grounding: ['evid_1'], collapse_test: 'T', inference_pattern: 'grounds-imply-conclusion' }, 'proposition')` throws an error whose `code` is `'SHAPE_INVALID'` and `field` is `'reasoning_chain'`.
- `verifyArgsShape({ statement: 'S', grounding: ['evid_1'], collapse_test: 'T', inference_pattern: 'grounds-imply-conclusion', reasoning_chain: 'IF X THEN Y' }, 'proposition')` returns the args unchanged.
- `verifyArgsShape({ ...validProposition, rejected_alternatives: [{ statement: 'A1', rejection_reason: 'R1' }] }, 'proposition')` returns the args unchanged.
- `ELEMENT_TRANSLATORS[PROPOSITION]({ statement: 'S', grounding: ['evid_1'], collapse_test: 'T', inference_pattern: 'grounds-imply-conclusion', reasoning_chain: 'IF X THEN Y' }, 'prop_1', ts).baseFacts` contains `['reasoning_chain', ['prop_1', 'IF X THEN Y']]`.
- `ELEMENT_TRANSLATORS[PROPOSITION]({ ...validArgs, rejected_alternatives: [{ statement: 'A1', rejection_reason: 'R1' }, { statement: 'A2', rejection_reason: 'R2' }] }, 'prop_1', ts).baseFacts` contains exactly two `rejected_alternative` facts: `['rejected_alternative', ['prop_1', 'A1', 'R1']]` and `['rejected_alternative', ['prop_1', 'A2', 'R2']]`.
- `ELEMENT_TRANSLATORS[PROPOSITION]({ ...validArgs })` (no `rejected_alternatives` key) emits zero `rejected_alternative` facts and does not throw.
- `EDB_PREDICATES` contains both `'reasoning_chain'` and `'rejected_alternative'`. Boot validators accept both as known EDB predicates without warning.
- Adding a Proposition with `reasoning_chain` and `rejected_alternatives` through `domain-bridge.runOperation('add', ...)` allocates a `prop_N` id, persists the element, and emits the expected base facts. A round-trip query reads them back.
- The structured-proof render output for a Proposition includes a `Reasoning:` line carrying the `reasoning_chain` text and a `Rejected alternatives:` block enumerating each alternative's statement and reason. A Proposition with zero rejected alternatives omits the block (does not render an empty section).
- The full domain test suite passes. Engine test suite passes. The aggregate test count is greater than the pre-sprint count by exactly the number of new tests this sub-sprint introduces (no regressions, no quiet deletions).
- No file outside `skills/design-proof-system/references/domain/` and its `__tests__/` subdirectory is modified by this sub-sprint.

## Open Questions for design-specify

- **Withdrawal/revision semantics for per-alternative facts.** When a Proposition is revised to drop one of its rejected alternatives, must the corresponding `rejected_alternative/3` fact be retracted? The existing revise path replaces the whole element; the natural answer is yes (retract-all-then-reassert), but the spec should make this explicit so the implementer does not have to guess.
- **Empty-string handling on `reasoning_chain`.** Schema validation today checks field presence, not non-emptiness. Should `reasoning_chain: ''` be admitted (presence-only check) or rejected (content check)? ADR-0008 names this field as a substantive shape constraint, which suggests non-emptiness should be enforced — but enforcement could equally live in a future Adversary pass rather than in `verifyArgsShape`. design-specify should pick one and write it into the spec acceptance criteria.
- **Render placement when both fields are present but visibly thin.** ADR-0006 specifies field surfacing but not the formatting discipline that distinguishes "field present" from "field substantive." This is an Adversary concern (not in scope here), but the render should at minimum make the two visually distinguishable enough that a designer can spot formulaic content during review.
