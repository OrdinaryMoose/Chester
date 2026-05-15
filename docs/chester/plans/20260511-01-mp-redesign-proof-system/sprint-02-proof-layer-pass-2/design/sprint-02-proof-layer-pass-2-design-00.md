# Design Brief: Add Missing Concern Entity to Domain Schema

## Goal

The domain layer's element-schema pipeline is missing the CONCERN entity. Eight element categories — EVIDENCE, RULE, PERMISSION, PROPOSITION, RISK, RESOLUTION, FRICTION, DEFINITION — are fully registered in `CATEGORY_REGISTRY` (schema.js), `ELEMENT_CATEGORIES` (tags.js), and `ELEMENT_TRANSLATORS` (translation.js). CONCERN, the ninth category enumerated in cascade `05-domain-spec.md` §3.8, has no entry at any of these three sites. Concerns are currently handled outside the unified element pipeline by proof-mcp's `state.concerns` array and the `manage_concerns` MCP tool, while `closure-policy.js` already declares Datalog rules that reference predicates (`unaddressed_concern(C)`, `concern_status(_, ratified)`) for which no producer exists in the domain pipeline. The fix is to add CONCERN to the schema/tags/translation surfaces so the domain pipeline can produce concern facts. The open architectural question this brief leaves to design-specify is whether proof-mcp's parallel `state.concerns` path should be retired in favor of routing concern operations through the unified `addElement`/`reviseElement`/`withdrawElement`/`ratifyElement` bridge surface, or whether the schema entry is added without altering proof-mcp.

## Prior Art

The proof system's design cascade (`docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/`) defines CONCERN as a first-class element with a complete contract that the implementation must match:

- `05-domain-spec.md` §3.8 specifies the Concern entity: id shape `cern_N`, required field `label`, optional `description`, engine fact `concern(ConcernId, Label, Description)`, status fact `concern_status(ConcernId, Status)` with Status ∈ {`draft`, `ratified`, `withdrawn`}. A Concern enters the proof's `covered` predicate only when both ratified AND addressed by a ratified Resolution.
- `05-domain-spec.md` §3 enumerates nine categories in order (3.1 EVIDENCE through 3.9 DEFINITION). CONCERN is the only one unimplemented.
- `00-glossary.md` carries CONCERN as a canonical term: "A problem the design must address, anchored to the problem_statement. Concerns are the targets that Resolutions must cover for closure."
- `05-domain-spec.md` §11 includes `unaddressed_concern(C)` and `concern_status(_, ratified)` in the closure-failure derivation rules.
- `05-domain-spec.md` §10.5 specifies a derived `in_lane(Proposition, Concern)` predicate and lane-slice render mode, both of which presuppose Concerns exist as engine facts.

Implementation state in `skills/design-proof-system/references/domain/`:

- `tags.js:5-9` — `ELEMENT_CATEGORIES` lacks `CONCERN: 'concern'`. The eight existing tags are `EVIDENCE`, `RULE`, `PERMISSION`, `PROPOSITION`, `RISK`, `RESOLUTION`, `FRICTION`, `DEFINITION`.
- `schema.js:3-76` — `CATEGORY_REGISTRY` has no Concern entry (no required/optional fields, no idShape, no render section, no authority matrix). The DEFINITION entry at `schema.js:67-75` is the closest analog and can serve as the implementation template (both categories carry status, both are ratifiable by DESIGNER or DESIGN_PARTNER).
- `translation.js:13-58` — `ELEMENT_TRANSLATORS` has no Concern translator. No `concern/3` or `concern_status/2` facts are emitted from the unified element pipeline.
- `closure-policy.js:13,25,42` — declares rules consuming `unaddressed_concern(C)`. The producer rule (deriving `unaddressed_concern(C)` from `concern_status(C, ratified)` and absence of `covered(C)`) has no place in the domain because Concerns themselves are absent from the schema.
- `domain-bridge.js:47,155` — lists `unaddressed_concern` as a valid predicate, but has no `addConcern`/`reviseConcern`/`ratifyConcern`/`withdrawConcern` entry points. The DEFINITION entry points at `domain-bridge.js:88-94` show the existing pattern for status-bearing, ratifiable elements.

Implementation state in `skills/design-large-task/proof-mcp/` (the parallel path):

- `state.js` carries `state.concerns` as a hand-rolled array, mutated by the MCP `manage_concerns` tool.
- `closing-argument.js:30-51`, `body-advancement.js:20-40`, `first-yes-gate.js:25`, `state-render.js:102-174` all read from `state.concerns` directly.
- The MCP `manage_concerns` tool operates on `state.concerns` and does not call `domain-bridge.runOperation`.

The eight existing element categories follow a uniform registration pattern: `ELEMENT_CATEGORIES` tag → `CATEGORY_REGISTRY` entry → `ELEMENT_TRANSLATORS` translator → exposed through the bridge facade. DEFINITION is the closest analog to CONCERN and provides a reusable implementation template.

This sub-sprint's parent is the master plan `20260511-01-mp-redesign-proof-system` (cascade-driven proof-system rebuild). The Engine and Domain packages were relocated to `skills/design-proof-system/references/` on this branch (commit `132dfba`) before this brief was written; the relocation is unrelated to this fix but defines where the affected files now live.

## Scope

**In scope:**
- Add `CONCERN: 'concern'` to `ELEMENT_CATEGORIES` in `tags.js`.
- Add a `[ELEMENT_CATEGORIES.CONCERN]` entry to `CATEGORY_REGISTRY` in `schema.js` matching cascade §3.8: required field `label`, optional field `description`, `idShape: 'concern'`, an authority matrix mirroring DEFINITION (designer-only add/revise/withdraw, designer+design-partner ratify), render section per cascade §10 (problem section).
- Add a Concern translator to `ELEMENT_TRANSLATORS` in `translation.js` emitting `concern(Id, Label, Description)` and `concern_status(Id, 'draft')` facts on add, with the appropriate status transitions on ratify and withdraw.
- Add a producer rule for `unaddressed_concern(C)` (derived from `concern_status(C, ratified)` and the negation of `covered(C)`) wherever `closure-policy.js` requires it.
- Add the bridge facade entry points for Concern operations consistent with the chosen architecture from Key Decision 1.
- Unit tests covering the new schema entry, translator, bridge surface, and `unaddressed_concern` derivation — at parity with DEFINITION's existing coverage.
- Resolve the parallel-path question (see Key Decision 1) and, if option (a) is chosen, retire `state.concerns` in proof-mcp and reroute its consumers.

**Out of scope:**
- Rewriting the proof-mcp render layer's concern-display rendering — necessary only if Key Decision 1 lands on option (a), and even then limited to redirecting reads from `state.concerns` to the unified element list.
- Engine-side work on `concern/3` facts — the engine treats them as generic ground atoms; no engine changes needed.
- Changes to cascade documents — the cascade is normative for this work; the fix conforms to it.
- Changes to RISK or other element categories — only CONCERN is missing from the schema.
- Renaming or restructuring the existing eight element categories.

## Key Decisions

1. **Parallel-path resolution (LEFT OPEN for design-specify's competing-architecture review).** Either (a) retire `state.concerns` in proof-mcp and route all concern operations through the unified `addElement`/`reviseElement`/`withdrawElement`/`ratifyElement` bridge surface, or (b) add the schema entry while leaving proof-mcp's concern handling unchanged. Option (a) eliminates the shadow-entity smell, makes Concern fully consistent with the other eight element categories, and gives `unaddressed_concern(C)` a single fact-producer path; it requires touching the proof-mcp MCP tool implementation and four downstream readers (`closing-argument.js`, `body-advancement.js`, `first-yes-gate.js`, `state-render.js`) plus their tests. Option (b) is the minimal patch but leaves an integration gap: the schema entry would exist with no caller, and `closure-policy.js`'s `unaddressed_concern` consumer rule would still have no producer reachable through the domain pipeline. design-specify is expected to resolve this via its architect-subagent dispatch.

2. **DEFINITION as the implementation template.** The cascade specifies Concern's authority matrix and status set similarly to DEFINITION (status-bearing, ratifiable by designer or design-partner, withdrawable). The DEFINITION rows in `schema.js`, `translation.js`, and `domain-bridge.js` are the closest analog and should be copied with field substitutions rather than designed from scratch. Alternative considered: model on RISK (statement-bearing). Rejected — RISK is stateless and lacks the ratify path Concern requires.

3. **Status-fact emission.** The Concern translator emits `concern_status(Id, 'draft')` on add (matching DEFINITION). Transitions to `ratified` and `withdrawn` flow through the existing generic ratify/withdraw paths in `mutations.js`. Alternative considered: emit the status fact lazily on first ratify. Rejected — inconsistent with DEFINITION's pattern; would break invariants assumed elsewhere in the bridge.

## Constraints

- Cascade `05-domain-spec.md` §3.8 is normative. Field names, id shape (`cern_N`), status set (`{draft, ratified, withdrawn}`), and engine-fact arity (`concern/3`, `concern_status/2`) must match the cascade exactly.
- The eight existing element categories' uniform registration pattern must be preserved — CONCERN is the ninth, not a special case.
- The fix must not regress the 84 passing domain tests or 138 passing engine tests at branch HEAD (`132dfba`).
- If Key Decision 1 lands on option (a): the MCP tool surface `manage_concerns` must continue to work for upstream callers; behavior may change internally but the tool's input schema and observable outputs must be preserved unless the spec explicitly revises them.
- This work happens on branch `sprint-02-proof-layer-pass-2` in `.worktrees/sprint-02-proof-layer-pass-2/`.
- Test discipline: per repo CLAUDE.md and decision record dr-20260514-06 (cross-layer real-import convention), tests must use real imports of the modules under test, not mocks.
- The cascade `design-documents/` directory is not edited by this sub-sprint without an accompanying ADR; this work conforms to the cascade, it does not amend it.

## Acceptance Criteria

- `ELEMENT_CATEGORIES.CONCERN === 'concern'` is exported from `tags.js`. `assertExhaustive('concern', ELEMENT_CATEGORIES, 'idShape')` returns `'concern'`.
- `CATEGORY_REGISTRY[ELEMENT_CATEGORIES.CONCERN]` returns an entry whose `requiredFields` equals `['label']`, `optionalFields` equals `['description']`, `idShape` equals `'concern'`, `sourceConstraint` equals `CONSENT_SOURCES.DESIGNER`, and `authority.ratify` is `[CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER]`.
- `verifyArgsShape({ label: 'C1' }, 'concern')` returns the args; `verifyArgsShape({}, 'concern')` throws an error whose `code` is `'SHAPE_INVALID'` and `field` is `'label'`.
- `ELEMENT_TRANSLATORS[ELEMENT_CATEGORIES.CONCERN]({ label: 'C1', description: 'D1' }, 'cern_1', ts)` emits a fact tuple containing `concern('cern_1', 'C1', 'D1')` and `concern_status('cern_1', 'draft')`.
- Adding a Concern through whichever bridge path Key Decision 1 selects allocates a `cern_N` id, persists the element, and emits the expected facts.
- Ratifying a Concern transitions `concern_status` from `'draft'` to `'ratified'`. Withdrawing a Concern transitions it to `'withdrawn'` and records the withdrawal disposition.
- The engine derives `unaddressed_concern(C)` exactly when `concern_status(C, ratified)` holds and no ratified Resolution's `addresses(_, C)` fires for C. A test exercises this end-to-end.
- If Key Decision 1 resolves to option (a): proof-mcp's `manage_concerns` tool routes through `domain-bridge.runOperation`; `state.concerns` is removed; `closing-argument.js`, `body-advancement.js`, `first-yes-gate.js`, `state-render.js` read concerns from the unified element list with their existing test suites passing unchanged.
- All previously passing tests still pass: `cd skills/design-proof-system/references/domain && npm test` reports 0 failures (currently 84/84); `cd skills/design-proof-system/references/engine && npm test` reports 0 failures (currently 138/138); proof-mcp tests touched by Key Decision 1 (if any) still pass.
- No archived plan documents under `docs/chester/plans/` are edited by this sub-sprint.
