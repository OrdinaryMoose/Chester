# Spec: Sprint-02 Proof Layer (Domain)

**Sprint:** `20260511-01-mp-redesign-proof-system/sprint-02-proof-layer`
**Parent brief:** `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/design/sprint-02-proof-layer-design-00.md`
**Architecture:** Purist (verb-as-data + structural-discipline) winner from the four-pole Cartesian design debate, **with hybrid spec-level refinements**: a dedicated boot-validator module (`boot-validators.js`, +1 file beyond the brief's named 11) and a dedicated source-shape test suite (`domain/structural-tests/`). Both refinements close drift modes the brief left to spec-level resolution.

---

## Goal

Implement the Chester proof system's **Domain layer** as ~1,500–2,500 LOC of JavaScript across **twelve files plus `domain-bridge.js`**, realizing `05-domain-spec.md` content as structurally-enforced code. The Domain consumes the Engine through the six substrate ports specified by ADR-0012 as amended by ADR-0013 (`IFactStore`, `IRuleStore`, `IQueryEngine`, `ISnapshotRestore`, `IExplain`, `ITransaction`), exposes the Interface through seven delivery ports per Architecture §4.2, and accepts the four cross-cutting adapters per Architecture §4.3 (`IClock`, `IIDAllocator`, `IConsentVerification`, `IPersistenceRepository`) by injection at the bridge.

Two spec-level mechanisms make the brief's "drift becomes type-impossible rather than review-dependent" goal mechanically real:

- **Boot-time validators** (centralized in `boot-validators.js`) check every registry's cross-record references against `tags.js` closed sets, function arities, postcondition predicate resolution against Phase-A registered rules, and rule template stratification via sentinel `defineRule`/`undefineRule` against the live engine. Any failure throws `DomainBootError` from `domain-bridge.js` construction.
- **Static-structural tests** (centralized in `domain/structural-tests/`) read each Domain source file as text and assert source-shape invariants (module presence, LOC envelope, port-bundle imports, facade one-liners, registry shape, render-mutation-symbol absence) — converting the brief's "a grep confirms" and "a test asserts" ACs into CI-runnable assertions without adopting a parser dependency.

Behavioral properties not reducible to source shape (stratification-trigger-at-boot, counterfactual snapshot restore on throw, save-divergence typed error, audit-adapter end-to-end run) remain runtime tests in `domain/__tests__/`.

## Components

### Production modules (12 files plus the bridge — 13 source files total)

The brief names 11 production files. The hybrid adds `boot-validators.js` as the 12th — explicitly justified by Architect A's analysis that no other module has a whole-registry view, and by the LOC envelope's ~230 LOC headroom over the named modules' summed midpoints.

| File | Role | Target LOC |
|------|------|-----------|
| `tags.js` | Frozen closed-set objects: `INFERENCE_PATTERNS`, `FRICTION_SHAPES`, `FRICTION_DISPOSITIONS`, `ACTION_LABELS`, `WITHDRAWAL_DISPOSITIONS`, `CONSENT_SOURCES`, `ELEMENT_CATEGORIES`, `PHASES`, **`RENDER_SECTIONS` (spec amendment of brief)**. `assertExhaustive(value, set, label)` helper. The brief's Key Decision 6 lists eight closed sets; this spec adds `RENDER_SECTIONS` so `CategoryDescriptor.renderSection` (which the brief's Key Decision 3 names as a CategoryDescriptor field) has a closed-set anchor for the boot validator. Without the addition, AC-4.2's render-section check is impossible. | ~85 |
| `schema.js` | `CATEGORY_REGISTRY` of `CategoryDescriptor` records — shape metadata, required/optional fields, closed-enum constraints, authority directives, render-section bindings. No Engine references. | ~280 |
| `translation.js` | Generic translators (one pure function per element category → `{baseFacts, rules, metaFacts}`) + `RULE_TEMPLATES` (parameterized rule shapes for approval-gated categories). `registerRuleTemplates(ports)` defines Phase-B templates. | ~270 |
| `authority.js` | Consent validation, ratification-authority resolution, two-yes / one-yes / zero-yes lane semantics. | ~190 |
| `lifecycle.js` | Round counter, phase transitions, body advancement. | ~140 |
| `closure-policy.js` | Closure conditions as engine queries. `registerStatic(ports)` defines closure rules. | ~240 |
| `friction-policy.js` | Friction detection rules and disposition logic. `registerStatic(ports)` defines friction rules. | ~190 |
| `restructuring.js` | Open-proof submission pipeline, structural validation. | ~180 |
| `render.js` | Markdown, structured-proof, Datalog projection, closing-argument, lane-slice, element-deep renders. Takes `ReadPorts` only. | ~340 |
| `counterfactual.js` | `collapse_test` verification via snapshot/restore. Takes `ProbePorts`. | ~150 |
| `mutations.js` | `OPERATION_SPECS` registry (eight typed `OperationSpec` records) + `runOperation(verbName, args, consent, ports: FullPorts)` orchestrator implementing Domain Spec §6.1 line-by-line. | ~280 |
| `boot-validators.js` | **(Hybrid addition.)** `validateOperationSpecs(specs, tags, validPredicates)`, `validateCategoryRegistry(registry, tags)`, `validateRuleTemplates(templates, registry)`. Cross-record consistency only; stratification is gated by Phase A/B's `defineRule` calls (ADR-0013 Part 3). Throws `DomainBootError` on any violation. | ~180 |
| `domain-bridge.js` | Single assembly seam: takes `{engine, clock, idAllocator, consentVerification, persistenceRepo}`, constructs the four frozen port bundles, calls `validateCategoryRegistry`, runs Phase-A `registerStatic(...)` across policy modules (stratification fires at each `defineRule`; throws wrap into `DomainBootError`), assembles `validPredicates` (Phase-A rule heads ∪ translation-declared EDB predicates), calls `validateOperationSpecs`, calls `validateRuleTemplates`, runs Phase-B `registerRuleTemplates` (stratification fires at each `defineRule`; throws wrap into `DomainBootError`), exposes the seven delivery-port facade methods as one-line wrappers. Holds no mutable session state. | ~130 |

**Production-LOC total (midpoints):** ~2,650 (the dropped sentinel-trick reduces boot-validators.js from ~225 to ~180; the validPredicates assembly raises domain-bridge.js from ~110 to ~130; net ~-25 LOC from the adversarial fixes). **Production-LOC ceiling:** 2,500 per brief. The midpoint sum overshoots the ceiling by ~150 LOC; per-module ceilings hold and the actual implementation is expected to come in at or below brief midpoints for several modules (e.g., `tags.js`, `lifecycle.js`, `boot-validators.js`) once the registries are stable. AC-1.2 enforces ≤2,500 LOC at implementation time; if mid-implementation totals exceed the ceiling, sub-modules must shrink before the spec is closed.

### Port bundles (frozen objects, constructed only in `domain-bridge.js`)

- `ReadPorts = Object.freeze({query, explain})` — passed to render functions, audit adapters, policy-module queries.
- `WritePorts = Object.freeze({facts, rules, query, explain, tx})` — used internally by `runOperation`'s mutation steps; not exposed.
- `ProbePorts = Object.freeze({query, explain, snapshot, facts})` — passed to `counterfactual.js` functions. **Spec amendment of brief.** The brief's `ProbePorts = {query, explain, snapshot}` is insufficient for Domain Spec §11.1's `mechanical_collapse_test`, which executes `engine.retractFact(...)` between `snapshot()` and `restore(snap)`. The amended bundle includes `facts` (giving counterfactual access to `assertFact` / `retractFact`) so §11.1 and §11.2's `query_with` / `query_without` are implementable. The narrowing discipline is preserved: ProbePorts still excludes `rules`, `tx`, `clock`, `ids`, `consent`, `persist` — counterfactual cannot define rules, open transactions, read the clock, allocate IDs, verify consent, or persist state.
- `FullPorts = Object.freeze({...WritePorts, ...ProbePorts, clock, ids, consent, persist})` — passed to `runOperation` only.

The four bundles are nested supersets: `ReadPorts ⊂ WritePorts ⊂ FullPorts`; `ReadPorts ⊂ ProbePorts ⊂ FullPorts`. (With the amended ProbePorts, `facts` is in both WritePorts and ProbePorts; the bundle-construction discipline still produces one frozen object per role.) Bundles are constructed once at bridge boot, frozen at construction time, and shared by reference across all calls in a session.

### Delivery-port facade methods on `domain-bridge.js`

Seven one-line methods exposing the seven delivery ports (Architecture §4.2):

- `IElementMutation` — `addElement`, `reviseElement`, `withdrawElement` → `runOperation('addElement', args, consent, fullPorts)` etc.
- `IRatification` — `ratifyElement` → `runOperation('ratifyElement', args, consent, fullPorts)`.
- `IFrictionManagement` — `addFriction`, `overrideFrictionDisposition` → `runOperation('manageFriction', args, consent, fullPorts)` (single `manageFriction` verb handles both via `args.action`).
- `IDefinitionManagement` — `addDefinition`, `reviseDefinition`, `ratifyDefinition`, `deprecateDefinition`, `queryOverlap` → `runOperation` dispatches with the appropriate verb / query function.
- `IClosureSurface` — `presentClosingArgument`, `confirmClosureGo` → `runOperation` with the matching verb.
- `IRenderSurface` — `renderStructuredProof`, `renderElementDeep`, `renderClosingArgument`, `renderDatalogProjection`, `renderLaneSlice` → call `render.<name>(args, readPorts)` directly (no `runOperation`).
- `IQuerySurface` — `getProofState`, `queryProof`, `runCounterfactual` → call `render.<name>(args, readPorts)` or `counterfactual.collapseTest(args, probePorts)`.

Every facade method body is one statement: either a `runOperation` invocation or a direct call to a render/query function.

### Test infrastructure (hybrid addition; outside production-LOC envelope)

- `domain/__tests__/` — Behavioral and integration tests per Domain Spec §12 (one file per Domain module).
- `domain/structural-tests/` — Source-shape tests asserting brief AC properties.
  - `source-scanner.js` — Shared pure-function helpers over `fs.readFileSync` and string patterns. ~60 LOC.
  - `module-shape.test.js` — All 13 source files exist; total LOC within 1,500–2,500; per-module ceilings respected. ~80 LOC.
  - `port-discipline.test.js` — No Domain module outside `domain-bridge.js` references the concrete Engine class name or import path; no cross-cutting adapter import outside the bridge; `render.js` source contains no occurrence of `facts.assertFact`, `rules.defineRule`, or `tx.begin`. ~120 LOC.
  - `operation-spec.test.js` — `mutations.js` contains exactly one `runOperation`; exactly one `OPERATION_SPECS` declaration; eight named verb keys; each carries required fields; `customPostCheck` appears on at most 3 of 8. ~100 LOC.
  - `facade-shape.test.js` — Each of the seven delivery-port method bodies in `domain-bridge.js` is one statement. ~80 LOC.
  - `bundle-construction.test.js` — `FullPorts`, `ReadPorts`, `WritePorts`, `ProbePorts` literals appear only in `domain-bridge.js`, each exactly once. ~60 LOC.
  - `boot-validator.test.js` — `boot-validators.js` exports three named validators with the expected arities; each is referenced once in `domain-bridge.js`. ~80 LOC.
  - `facade-jsdoc.test.js` — Every facade method on `domain-bridge.js` carries JSDoc with `@param`, `@returns`, and `@throws` tags. Asserted by regex over the source span of each method definition. ~60 LOC.

Total structural-tests addition: ~640 LOC across eight files, with zero new devDependencies (regex over source text + Jest already present).

## Data Flow

### Session boot (one-time, at bridge construction)

1. Interface calls `createDomainBridge({engine, clock, idAllocator, consentVerification, persistenceRepo})`.
2. Bridge constructs the four frozen port bundles.
3. Bridge calls `validateCategoryRegistry(CATEGORY_REGISTRY, tags)` → throws `DomainBootError` on failure.
4. Bridge runs **Phase A**: each policy module's `registerStatic(rulePorts)` defines closure, integrity, lane, and friction-detection rules. ADR-0013 Part 3 stratification check fires inside `defineRule`; any cyclic-negation set throws (the throw propagates as a `DomainBootError` wrapper that names the failing static rule).
5. Bridge collects the set of all registered predicate names so far — both Phase-A registered rule head predicates AND the EDB base-fact predicates the translation table declares (`translation.getDeclaredEDBPredicates()` returns the set of base-fact predicate names used by translators). Call this `validPredicates`.
6. Bridge calls `validateOperationSpecs(OPERATION_SPECS, tags, validPredicates)` → throws `DomainBootError` on missing required field, unresolved tag reference (against `tags.CONSENT_SOURCES` or `tags.ELEMENT_CATEGORIES`), wrong-arity `customPostCheck`, unresolved postcondition/precondition `QueryPattern.predicate` (against `validPredicates`), or `QueryPattern` structural violation. Postcondition predicates may reference EDB facts or derived rules; both are members of `validPredicates`.
7. Bridge calls `validateRuleTemplates(RULE_TEMPLATES, CATEGORY_REGISTRY)` → throws `DomainBootError` on unresolved `elementCategory` (against `CATEGORY_REGISTRY` keys) or any other cross-record consistency violation. **Stratification is NOT re-checked here** — it is the responsibility of Phase B's `defineRule` calls in the next step. This validator is cross-record only; the engine's `defineRule` is the canonical stratification gate per ADR-0013 Part 3.
8. Bridge runs **Phase B**: `translation.registerRuleTemplates(rulePorts)` installs parameterized rule shapes for approval-gated categories via `defineRule`. Stratification fires at each `defineRule` call (per ADR-0013 Part 3); a cyclic-negation template throws at that call. The bridge catches such throws and re-throws as `DomainBootError` carrying the failing template id.
9. Bridge returns a frozen facade object with the seven delivery-port methods.

### Operation execution (per `runOperation` call)

`runOperation(verbName, args, consent, ports: FullPorts)` implements Domain Spec §6.1 line-by-line:

1. Read `spec = OPERATION_SPECS[verbName]`; throw `DomainError({code: 'UNKNOWN_VERB'})` if missing.
2. Verify consent: `authority.verifyConsent(spec.consentCategory, consent, ports.consent)` → throws `DomainError({code: 'CONSENT_INVALID'})` on failure.
3. Verify shape: `schema.verifyArgsShape(args, spec.idShape)` → throws `DomainError({code: 'SHAPE_INVALID'})` on failure.
4. Begin transaction: `const tx = ports.tx.begin()`.
5. Try: assert facts + define rules via `spec.translate(args, ports.ids.next(spec.idShape), ports.clock.now()).{baseFacts, rules, metaFacts}` → applied via `ports.facts.assertFact` / `ports.rules.defineRule` inside the open transaction. **Phase-C** element-rule template instantiation happens here for verbs whose `idShape` corresponds to an approval-gated category — the spec introduces `translation.instantiateTemplate(idShape, newId, ports.rules)` as the API contract: it reads the matching `RULE_TEMPLATES` entry, substitutes the placeholder element id, and calls `ports.rules.defineRule` to install the concrete rule inside the open transaction. (The brief names Phase C as a concept; this signature is the spec-level contract introduction.)
6. Trigger derivation: `ports.query.derive()` (or implicit via subsequent `query` calls under read-own-writes — ADR-0013 Part 2).
7. Run declarative preconditions: each `QueryPattern` in `spec.preconditions` evaluated via `ports.query.query(pattern)` → must return non-empty (or empty, per pattern polarity).
8. Run declarative postconditions: each `QueryPattern` in `spec.postconditions` → must hold.
9. Run `spec.customPostCheck(args, readPortsView)` if present → throws on returned `DomainError`.
10. Commit: `ports.tx.commit(tx)`.
11. **Save:** `ports.persist.saveState(stateSnapshot)` → on failure, throw `POST_COMMIT_SAVE_FAILED({engineCommitted: true, cause})`.
12. Build `result` per `spec.resultShape` from in-transaction query outputs (re-issued post-commit if needed).
13. Advance round if `spec.clearsTwoYes` indicates and lifecycle conditions match: `lifecycle.advance(ports)`.
14. Catch any throw from steps 5–9 → `ports.tx.rollback(tx)`, re-throw the original `DomainError`. (Step 11 failures do not rollback — the engine has already committed; the typed divergence is the response.)
15. Return `result`.

### Render execution (read-only, no transaction)

A render method on the facade calls `render.<methodName>(args, readPortsView)`. The render function queries via `ports.query` and `ports.explain` only. Returns a render payload.

### Counterfactual execution (probe with snapshot/restore)

`counterfactual.collapseTest(args, probePorts)` implements Domain Spec §11.1:

1. `const snap = probePorts.snapshot.snapshot()`.
2. Try, in a try/finally where the `finally` always runs `probePorts.snapshot.restore(snap)`:
   - `probePorts.facts.retractFact("approved", [propId, "_", "_"])` (the canonical §11.1 pattern; other counterfactual flavors per §11.2 call `assertFact` for hypothetical-fact-addition queries).
   - Subsequent `probePorts.query.query(...)` calls auto-trigger `derive()` per Engine Spec §4.8.
   - Build the counterfactual result from query outputs.
3. The `finally` runs regardless of throw or return: `probePorts.snapshot.restore(snap)` reverts engine state to pre-call (bit-equal per Engine Spec §4.5 line 305).
4. Return the counterfactual analysis result, or re-throw the original error if one occurred.

The discipline that makes counterfactual safe is the **try/finally snapshot bracketing**, not the absence of mutation. Mutation is required by the cascade (§11.1 uses `retractFact`); what matters is that the engine state is bit-equal before and after the counterfactual call regardless of the body's outcome. ProbePorts narrows away the long-term mutation surfaces (`rules`, `tx`, `persist`) so counterfactual cannot accidentally outlast its snapshot.

## Error Handling

### Three error categories, each typed and named

- **`DomainBootError`** — Construction-time validator failure. Distinct constructor with `isBootError: true` marker. Payload: `{validator: string, recordId: string, field: string, violation: string, expected: any, actual: any}`. Thrown only from `boot-validators.js`. Interface must surface as a session-startup failure, not as a tool-invocation error.
- **`DomainError`** — Runtime operation failure. Thrown from inside `runOperation` for consent failure, shape failure, precondition failure, postcondition failure, custom-post-check failure, unknown-verb. Payload: `{code: string, message: string, details?: any}`. Caught by Interface and rendered to the tool-invocation response.
- **`POST_COMMIT_SAVE_FAILED`** — Save-after-commit divergence. A subclass of `DomainError` with code `'POST_COMMIT_SAVE_FAILED'`. Payload includes `{engineCommitted: true, cause: any}`. Thrown only from step 11 of `runOperation`. Interface must distinguish this from generic `DomainError` and respond with operator-attention messaging because in-memory engine state diverges from persisted state.

### Error propagation rules

- Transaction-scoped errors (steps 5–9) → `tx.rollback(tx)`, re-throw original `DomainError`. Engine state reverts.
- Post-commit errors (step 11) → no rollback (engine already committed). Throw `POST_COMMIT_SAVE_FAILED` with the original cause attached.
- Boot errors → propagate immediately to Interface session-init path. No partial bridge object is returned.

### Closed-set discipline as error-prevention

`tags.assertExhaustive(value, set, label)` is the canonical entry point for closed-set membership checks. Validators in `boot-validators.js` call it for every cross-record reference resolution. Runtime call sites (e.g., a tag-discriminated switch in `friction-policy.js`) call it as the default branch.

## Testing Strategy

### Three test categories, named coverage targets

**1. Module behavioral tests (`domain/__tests__/`)** — One Jest file per Domain module: `tags.test.js`, `schema.test.js`, `translation.test.js`, `authority.test.js`, `lifecycle.test.js`, `closure-policy.test.js`, `friction-policy.test.js`, `restructuring.test.js`, `render.test.js`, `counterfactual.test.js`, `mutations.test.js`, `boot-validators.test.js`. Each uses an **in-memory substrate fake** for the six substrate ports (not a mock — the fake implements the port contract correctly with maps/sets). Covers per-module logic against the port contract.

**2. Bridge integration tests (`domain/__tests__/bridge-integration.test.js`)** — Constructs a full bridge against an in-memory substrate. Tests:
  - **Stratification-at-boot**: construct bridge with deliberately-cyclic template → assert `DomainBootError` thrown with template ID.
  - **Validator boot failures**: construct bridge with `OperationSpec` missing required field → `DomainBootError` thrown; with bad `consentCategory` tag → `DomainBootError` with named `tags.CONSENT_SOURCES` violation; etc., across all named validator checks.
  - **Counterfactual snapshot restore**: invoke counterfactual function whose body throws mid-execution → assert engine state bit-equal to pre-counterfactual snapshot.
  - **Save divergence**: inject `IPersistenceRepository.saveState` failure after commit → assert `POST_COMMIT_SAVE_FAILED` with `{engineCommitted: true, cause}` payload.
  - **Read-only audit adapter**: import `domain-bridge.createReadOnlyAudit(engine)` (a helper exposing only `readPorts` and the render facade) → run all `IRenderSurface` methods → assert render output structurally correct.
  - **`runOperation` step ordering**: invoke each of the eight verbs against an in-memory substrate fixture → assert Domain Spec §6.1 step ordering observed (assertion order, derivation timing, query timing, commit-then-save).

**3. Structural-shape tests (`domain/structural-tests/`)** — Source-text regex over each Domain `.js` file. Tests enumerated above in the **Test infrastructure** component section.

### Coverage map (brief AC → test category)

- Module count and LOC envelope → structural (`module-shape.test.js`).
- Port-bundle parameter discipline → structural (`port-discipline.test.js`) covers absence of forbidden symbols; positive evidence (`renders take ReadPorts`) is documented via JSDoc `@param` comments and asserted by `port-discipline.test.js` checking the JSDoc tag presence.
- `mutations.js` shape → structural (`operation-spec.test.js`).
- `runOperation` §6.1 line-by-line behavioral match → bridge integration (`bridge-integration.test.js` step-order assertions).
- Bridge stratification trigger → bridge integration.
- Render mutation-symbol absence → structural (`port-discipline.test.js`).
- Counterfactual snapshot restore → bridge integration.
- Save divergence → bridge integration.
- Facade one-liners → structural (`facade-shape.test.js`).
- Cross-cutting adapter injection-only → structural (`port-discipline.test.js`).
- Architecture §10 payoffs (audit adapter runs) → bridge integration.
- Sprint-03 one-line MCP adapters → split: documentation-completeness half (JSDoc `@param`/`@returns`/`@throws` on every facade method) verified inside sprint-02 by `structural-tests/facade-jsdoc.test.js`; behavioral half (sprint-03 handlers actually realize the one-line pattern) verified at sprint-03 boundary.
- Domain test suite sized per §12 → structural (`module-shape.test.js` asserts per-module test file existence).

## Constraints

- **Architectural cascade is normative** (`03-architecture.md`, `04-engine-spec.md`, `05-domain-spec.md`, ADRs 0001–0019). No structural decision contradicts the cascade.
- **Six substrate ports only** — ADR-0012 as amended by ADR-0013. No Domain module reaches Engine internals.
- **Seven delivery ports only** — Architecture §4.2. The Domain exposes only the seven facade methods.
- **Four cross-cutting adapters, injection only** — Architecture §4.3, ADR-0009. No direct time, ID, consent, or file I/O calls in Domain code.
- **Forward-solve paradigm** — ADR-0007, ADR-0003. Propositions/Resolutions are derivable rules with approval as a body literal.
- **Stratified Datalog dialect** — Engine Spec §2, ADR-0013 Part 3. All rule definitions valid in the stratified family; stratification check at `defineRule` time.
- **Closed-set tags closed** — Architecture §11.11. No string-typed alternative where a closed-set enum exists. `tags.js` is the canonical home; `assertExhaustive` is the canonical check.
- **Read-own-writes transaction visibility** — Engine Spec §4.8, ADR-0013 Part 2. Sprint-02 relies on this contract from sprint-01.
- **LOC ceiling 2,500** — Domain Spec §13. Production code only; tests are additive.
- **JavaScript (not TypeScript)** — Brief constraint. Role-narrowed bundles enforce ISP via frozen objects at runtime, not at parse time. Future TS migration is admitted by design.
- **No I/O, no global state, no ambient context** — Per Domain Spec §13 closing paragraph. Every Domain module is a pure function over its declared port bundle plus call arguments.
- **JSDoc port-bundle annotations** — Every Domain function whose first parameter is a port bundle carries a `@param {ReadPorts|WritePorts|ProbePorts|FullPorts} ports` JSDoc tag, asserted by `port-discipline.test.js`. JSDoc substitutes for TypeScript parameter types as the readable signature-level declaration.

## Non-Goals

- **Engine implementation** — Sprint-01 owns. Sprint-02 consumes.
- **Interface implementation** — Sprint-03 owns. Sprint-02 specifies the contract via the seven facade methods; sprint-03 builds MCP tool handlers, wire format, persistence adapter.
- **Adversary integration** — Architecture §8 future work. Sprint-02 ensures the Domain admits a read-only audit adapter (AC-11.1); does not implement Adversary behaviors.
- **Alternative substrate adapters** — CozoDB, Soufflé, SQLite-recursive-CTE. Architecture §2.4 admits them; sprint-02 does not preclude swap but builds only against the primary substrate sprint-01 provides.
- **Cross-cutting adapter implementations** — Default clock, ID, consent, persistence adapters are constructed by the Interface at session start. Sprint-02 accepts injection; sprint-02 does not implement.
- **TypeScript migration** — Future work. Spec admits it without rewriting modules.
- **AST-based structural verification** — Out of scope; regex over source text is the chosen mechanism for the structural test suite.

---

## Acceptance Criteria

### AC-1.1 — Module set complete

**Observable boundary:**
- `domain/` contains exactly 13 source files: the 11 brief-named modules + `boot-validators.js` + `domain-bridge.js`.
- Filenames match: `tags.js`, `schema.js`, `translation.js`, `authority.js`, `lifecycle.js`, `closure-policy.js`, `friction-policy.js`, `restructuring.js`, `render.js`, `counterfactual.js`, `mutations.js`, `boot-validators.js`, `domain-bridge.js`.

**Given:** the Domain implementation is complete.
**When:** `structural-tests/module-shape.test.js` runs.
**Then:** all 13 named files exist; no unnamed `.js` files are present in `domain/` outside `__tests__/` and `structural-tests/`.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — LOC envelope respected

**Observable boundary:**
- Sum of LOC across the 13 source files ∈ [1,500, 2,500].
- Per-module LOC ≤ the ceiling in the Components table.

**Given:** the Domain implementation is complete.
**When:** `structural-tests/module-shape.test.js` reads each `.js` source and counts non-blank non-comment lines.
**Then:** total ∈ [1500, 2500]; each module's count ≤ its ceiling.

**Implementing tasks:**

**Decisions:**

### AC-2.1 — Port bundles declared at function signatures

**Observable boundary:**
- Every exported Domain function that consumes a port bundle has a JSDoc `@param {ReadPorts|WritePorts|ProbePorts|FullPorts} ports` annotation matching its actual use.
- `render.*` exports annotate `ReadPorts`; `counterfactual.*` exports annotate `ProbePorts`; `registerStatic`/`registerRuleTemplates` annotate `{rules}` (a narrower-than-WritePorts bundle); `runOperation` annotates `FullPorts`.

**Given:** the Domain implementation is complete.
**When:** `structural-tests/port-discipline.test.js` greps each module's exports for the `@param` JSDoc pattern.
**Then:** every exported function bound to a port bundle carries a matching annotation; no annotation contradicts the function's actual port use.

**Implementing tasks:**

**Decisions:**

### AC-2.2 — Concrete Engine references only in `domain-bridge.js`

**Observable boundary:**
- Grep across `domain/*.js` (excluding `domain-bridge.js`) finds zero references to the concrete Engine constructor name, the concrete Engine import path, or any internal Engine module path.
- Grep across `domain/*.js` (excluding `domain-bridge.js`) finds zero `require`/`import` of `IClock`, `IIDAllocator`, `IConsentVerification`, `IPersistenceRepository` adapter implementation paths.

**Given:** the Domain implementation is complete.
**When:** `structural-tests/port-discipline.test.js` runs.
**Then:** the grep assertions pass for all twelve non-bridge modules.

**Implementing tasks:**

**Decisions:**

### AC-3.1 — `mutations.js` contains exactly one `runOperation` and one `OPERATION_SPECS`

**Observable boundary:**
- `mutations.js` source contains exactly one `function runOperation` (or equivalent `const runOperation =`) definition.
- `mutations.js` source contains exactly one `OPERATION_SPECS` declaration at module scope.

**Given:** the Domain implementation is complete.
**When:** `structural-tests/operation-spec.test.js` reads `mutations.js`.
**Then:** the regex match counts are exactly one for each.

**Implementing tasks:**

**Decisions:**

### AC-3.2 — `OPERATION_SPECS` has eight named verbs with required fields

**Observable boundary:**
- The `OPERATION_SPECS` object has keys: `openProof`, `addElement`, `reviseElement`, `withdrawElement`, `ratifyElement`, `manageFriction`, `presentClosingArgument`, `confirmClosureGo`.
- Each value declares (in source) all of: `consentCategory`, `preconditions`, `idShape`, `translate`, `postconditions`, `clearsTwoYes`, `resultShape`.

**Given:** the Domain implementation is complete.
**When:** `structural-tests/operation-spec.test.js` parses `OPERATION_SPECS` by regex over its source span.
**Then:** all eight keys present; all seven required fields present per key.

**Implementing tasks:**

**Decisions:**

### AC-3.3 — `customPostCheck` count ≤ 3 of 8

**Observable boundary:**
- At most 3 of the 8 `OperationSpec` records declare a `customPostCheck` field.

**Given:** the Domain implementation is complete.
**When:** `structural-tests/operation-spec.test.js` counts `customPostCheck:` occurrences inside the `OPERATION_SPECS` source span.
**Then:** count ≤ 3.

**Implementing tasks:**

**Decisions:**

### AC-3.4 — `runOperation` body matches Domain Spec §6.1 ordering

**Observable boundary:**
- Inside the `runOperation` body, labeled step comments (one per §6.1 step, e.g., `// §6.1 step 4: begin tx`) appear in source order matching §6.1's step list.
- A bridge-integration test that invokes each of the eight verbs against an instrumented in-memory substrate fake records the actual sequence of port method calls; the recorded sequence matches `[verifyConsent, verifyShape, tx.begin, (translate+assertFact+defineRule)*, derive, query (precond), query (postcond), customPostCheck?, tx.commit, persist.saveState, lifecycle.advance?]`.

**Given:** the Domain implementation is complete; `mutations.js` carries §6.1 step labels in `runOperation`'s source span; bridge integration test fixture is configured.
**When:** `structural-tests/operation-spec.test.js` checks label ordering AND `bridge-integration.test.js` invokes each verb and reads recorded call sequences.
**Then:** both source-label ordering and runtime call sequencing match §6.1.

**Implementing tasks:**

**Decisions:**

### AC-4.1 — `validateOperationSpecs` enforces full cross-record consistency at boot

**Observable boundary:**
- `boot-validators.validateOperationSpecs(OPERATION_SPECS, tags, validPredicates)` throws `DomainBootError` when any of:
  - A required field is missing on any spec.
  - `spec.consentCategory` is not in `tags.CONSENT_SOURCES`.
  - `spec.idShape` is not in `tags.ELEMENT_CATEGORIES`.
  - `spec.customPostCheck` is present but not a function with arity 2.
  - Any precondition or postcondition `QueryPattern` entry lacks `{predicate: string, arity: number}` shape.
  - Any precondition or postcondition `QueryPattern.predicate` is not in `validPredicates` (where `validPredicates = Phase-A rule head predicates ∪ EDB base-fact predicates declared by translation.getDeclaredEDBPredicates()`).

**Given:** the bridge is being constructed against an in-memory substrate.
**When:** the bridge's construction sequence reaches step 6 with a deliberately-corrupted `OPERATION_SPECS` registry (one violation per test variant).
**Then:** `DomainBootError` is thrown with a payload identifying the failing record, field, and violation type. No port-bundle facade is returned.

**Implementing tasks:**

**Decisions:**

### AC-4.2 — `validateCategoryRegistry` enforces full cross-record consistency at boot

**Observable boundary:**
- `boot-validators.validateCategoryRegistry(CATEGORY_REGISTRY, tags)` throws `DomainBootError` when any of:
  - A `CategoryDescriptor`'s `requiredFields` is empty.
  - `descriptor.sourceConstraint` is not in `tags.CONSENT_SOURCES`.
  - `descriptor.idShape` prefix is not in `tags.ELEMENT_CATEGORIES`.
  - `descriptor.renderSection` is not in `tags.RENDER_SECTIONS`.
  - A closed-enum field specification references a value not in `tags.js`.

**Given:** the bridge is being constructed against an in-memory substrate.
**When:** the bridge's construction sequence reaches step 3 with a deliberately-corrupted `CATEGORY_REGISTRY` (one violation per test variant).
**Then:** `DomainBootError` is thrown with payload identifying the failing descriptor, field, and violation. No port-bundle facade is returned.

**Implementing tasks:**

**Decisions:**

### AC-4.3 — `validateRuleTemplates` enforces cross-record consistency at boot

**Observable boundary:**
- `boot-validators.validateRuleTemplates(RULE_TEMPLATES, CATEGORY_REGISTRY)` throws `DomainBootError` when:
  - A template's `elementCategory` is not in `CATEGORY_REGISTRY` keys.
  - A template lacks any of its declared required fields (parameterization shape, body atom list, head atom shape).
- Stratification of templates is verified separately at Phase B's `defineRule` call, not by this validator. ADR-0013 Part 3 makes `defineRule` the canonical stratification gate; cyclic-negation templates throw at Phase B's `defineRule` call. The bridge catches that throw and re-throws as `DomainBootError` with the template id.

**Given:** the bridge is being constructed against an in-memory substrate.
**When (cross-record violation):** the bridge construction reaches step 7 with a `RULE_TEMPLATES` containing a template whose `elementCategory` is missing from `CATEGORY_REGISTRY`.
**Then:** `DomainBootError` is thrown identifying the failing template id and the cross-record violation type. No port-bundle facade is returned. Phase B is not entered.

**Given:** the bridge is being constructed against an in-memory substrate.
**When (stratification violation):** the bridge construction reaches step 8 with a cross-record-clean `RULE_TEMPLATES` that contains a cyclic-negation template body.
**Then:** Phase B's `defineRule` call throws at the offending template; the bridge wraps and re-throws as `DomainBootError` with the template id. No port-bundle facade is returned. Rule store state is consistent (Phase B's `defineRule` is the gate; a failing call rejects before adding the rule).

**Implementing tasks:**

**Decisions:**

### AC-5.1 — Bridge construction triggers stratification check on every defined rule and registered template

**Observable boundary:**
- A bridge constructed with a deliberately-cyclic-negation **static rule** (Phase A) throws at bridge construction. The throw originates at `ports.rules.defineRule`'s stratification check (ADR-0013 Part 3) and is wrapped by the bridge into a `DomainBootError` carrying the offending rule id.
- A bridge constructed with a deliberately-cyclic-negation **rule template** (Phase B input) throws at bridge construction. The throw originates at Phase B's `ports.rules.defineRule` call inside `translation.registerRuleTemplates` (ADR-0013 Part 3) and is wrapped by the bridge into a `DomainBootError` carrying the offending template id.
- In neither case does the throw surface at first mutation; both fail at bridge construction.

**Given:** the bridge construction sequence runs against an in-memory substrate.
**When:** the input set contains a cyclic-negation rule in either Phase A or Phase B.
**Then:** construction throws `DomainBootError` before returning the facade; the error carries the offending rule/template id and the engine's stratification message.

**Implementing tasks:**

**Decisions:**

### AC-6.1 — Render functions cannot mutate state

**Observable boundary:**
- Grep across `render.js` source finds zero occurrences of `facts.assertFact`, `facts.retractFact`, `rules.defineRule`, `rules.undefineRule`, `tx.begin`, `tx.commit`, `tx.rollback`.
- All exported `render.*` functions take a single `readPorts` parameter (annotated `ReadPorts` per AC-2.1).
- A bridge integration test invokes every `IRenderSurface` method against an in-memory substrate fixture; the recorded port call sequence contains zero calls to `facts.*`, `rules.*`, `tx.*`.

**Given:** the Domain implementation is complete.
**When:** `structural-tests/port-discipline.test.js` and `bridge-integration.test.js` (`renders-are-read-only` case) run.
**Then:** both static (grep) and behavioral (recorded calls) assertions pass.

**Implementing tasks:**

**Decisions:**

### AC-7.1 — Counterfactual restores snapshot on throw

**Observable boundary:**
- A bridge integration test invokes a counterfactual function whose body throws mid-execution; the engine state after the throw is bit-equal to a snapshot taken before the counterfactual call.

**Given:** the bridge is constructed against an in-memory substrate with a known initial state.
**When:** `bridge-integration.test.js` (`counterfactual-restores-on-throw` case) calls `counterfactual.collapseTest(args, probePorts)` with `args` that cause the function body to throw after at least one query inside the snapshot scope.
**Then:** the post-throw engine state (sampled via `ports.query.query(*)` for a known witness) equals the pre-counterfactual state; the throw propagates to the caller as the original error.

**Implementing tasks:**

**Decisions:**

### AC-8.1 — Save-after-commit surfaces typed divergence

**Observable boundary:**
- A bridge integration test injects a `IPersistenceRepository.saveState` failure for the next call only; invokes any `IElementMutation`/`IRatification`/`IFrictionManagement` operation; observes:
  - The engine commit has occurred (subsequent `ports.query.query(*)` for the mutated fact returns the asserted value).
  - The operation throws `POST_COMMIT_SAVE_FAILED` with payload `{engineCommitted: true, cause: <original save error>}`.

**Given:** the bridge is constructed against an in-memory substrate with a saveState-failing persistence adapter (configurable per call).
**When:** `bridge-integration.test.js` (`save-divergence` case) runs.
**Then:** both observable conditions hold.

**Implementing tasks:**

**Decisions:**

### AC-9.1 — Seven facade methods are one-statement bodies

**Observable boundary:**
- `domain-bridge.js` source contains seven facade method definitions whose bodies are one statement each (either `return runOperation(...)` or `return render.<name>(...)` or `return counterfactual.<name>(...)`).

**Given:** the Domain implementation is complete.
**When:** `structural-tests/facade-shape.test.js` reads each facade method's body via regex over `domain-bridge.js`.
**Then:** each body matches the one-statement pattern.

**Implementing tasks:**

**Decisions:**

### AC-10.1 — Cross-cutting adapters injected at bridge construction only

**Observable boundary:**
- Grep across `domain/*.js` (excluding `domain-bridge.js`) finds zero direct imports of `IClock`, `IIDAllocator`, `IConsentVerification`, `IPersistenceRepository` implementation modules.
- Grep across `domain-bridge.js` finds exactly one constructor parameter destructuring that names all four (`{engine, clock, idAllocator, consentVerification, persistenceRepo}`).

**Given:** the Domain implementation is complete.
**When:** `structural-tests/port-discipline.test.js` runs.
**Then:** the grep assertions pass.

**Implementing tasks:**

**Decisions:**

### AC-11.1 — Read-only audit adapter via `ReadPorts` runs end-to-end

**Observable boundary:**
- A test imports `domain-bridge.createReadOnlyAudit(engine)` (a helper exposing only `readPorts` and the `IRenderSurface` + `IQuerySurface` methods).
- The audit adapter runs every `IRenderSurface.render*` method against a populated state and returns structurally-valid render payloads.
- The audit adapter's accessible methods do not include any `IElementMutation`/`IRatification`/`IFrictionManagement`/`IDefinitionManagement`/`IClosureSurface` method.

**Given:** the bridge module exports `createReadOnlyAudit`; an in-memory substrate is populated via a normal bridge with sample mutations; the populated substrate is then passed to `createReadOnlyAudit`.
**When:** `bridge-integration.test.js` (`audit-adapter` case) iterates every render method.
**Then:** every method returns a payload; no mutation method is callable.

**Implementing tasks:**

**Decisions:**

### AC-11.2 — Sprint-03 MCP adapter contract documented and one-line-realizable

**Observable boundary:**
- Every facade method on `domain-bridge.js` (the seven delivery-port methods plus the dispatched verb-level methods listed in the Components §"Delivery-port facade methods" section) carries JSDoc with `@param`, `@returns`, and `@throws` tags.
- A `structural-tests/facade-jsdoc.test.js` reads `domain-bridge.js` source and asserts the JSDoc presence on every facade method by regex.
- A representative MCP tool handler body for `ratify` is documented in the spec as `return bridge.ratifyElement(args, consent);` (no load-call-save scaffolding) — sprint-03 implements against this contract.

**Given:** the Domain implementation is complete.
**When:** `structural-tests/facade-jsdoc.test.js` runs.
**Then:** every facade method has the three required JSDoc tags. The argument-shape contract is fully documented inside sprint-02; sprint-03 inherits an unambiguous interface. (The behavioral half — that sprint-03 MCP handlers actually realize the one-line pattern — is verified at sprint-03 boundary, but documentation completeness is verifiable inside sprint-02.)

**Implementing tasks:**

**Decisions:**

### AC-12.1 — Test suite organization matches plan

**Observable boundary:**
- `domain/__tests__/` contains one `.test.js` file per Domain module (12 module test files) plus `bridge-integration.test.js`.
- `domain/structural-tests/` contains exactly the eight test files plus `source-scanner.js` named in the Test infrastructure component section.

**Given:** the test infrastructure is complete.
**When:** `structural-tests/module-shape.test.js` enumerates the test directories.
**Then:** all named test files exist; no unnamed test files are present in either directory.

**Implementing tasks:**

**Decisions:**

---

## Provenance trailer

(stamped by the trailer-write helper after this file is finalized)

<!-- created-at: 2026-05-13T16:20:05Z -->
<!-- produced-by design-specify@v0003 -->
