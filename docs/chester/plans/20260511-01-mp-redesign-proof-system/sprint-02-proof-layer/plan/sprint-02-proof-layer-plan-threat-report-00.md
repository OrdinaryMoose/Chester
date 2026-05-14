# Sprint-02 Proof Layer — Combined Plan Threat Report

**Plan reviewed:** `sprint-02-proof-layer-plan-00.md`
**Spec context:** `sprint-02-proof-layer-spec-01.md`
**Hardening dispatches:** `chester:plan-build-plan-attacker` + `chester:plan-build-plan-smeller` (smell triggered on DI registrations, new abstractions, persistence pathways, new contract surfaces — all four categories matched).

**Combined implementation risk level: High**

---

## Risk-level rationale (3-5 statements)

1. **Sprint-01 / sprint-02 port-contract interlock is broken.** Both reviewers independently found that the in-memory substrate fake the plan builds models a port API (`{facts, rules, query, snapshot, explain, tx}` namespaced with `defineRule(ruleId, head, body, metadata)` tuple-format atoms and uppercase-string Datalog variables) that **does not match** the actual engine at `skills/design-large-task/engine/Engine.js` (flat `engine.assertFact()` / `engine.defineRule(rule)` with `{predicate, arity, args: [{var: 'X'}]}` object format). The plan's deliverable would be self-consistent against the fake but fail at sprint-03 integration. The spec's verified-anchor list reflects what sprint-01 was *specified* to build, not what sprint-01 has *actually* built — and the gap is structural.

2. **The "one-line MCP adapter" sprint-03 promise is undermined.** Spec AC-11.2 and the plan's overall framing rely on sprint-03 being able to write `return bridge.ratifyElement(args, consent)` and stop. If sprint-03 must also write a tuple↔object Datalog adapter to bridge the domain's call-site format to the engine's actual API, the promise becomes a multi-layer translation harness.

3. **Several smaller defects would surface as red tests on first execute-write run.** The AC-6.1 recording-substrate assertion is poisoned by Phase A `defineRule` calls (the assertion expects zero mutation calls but Phase A produces ~5 of them before renders are exercised). The AC-4.1 test variant uses `idShape: undefined` which passes the validator's `'idShape' in spec` check. `createDomainBridgeWith` is specified to return an empty facade stub. These are mechanical fixes but the plan-as-written cannot reach green.

4. **Structural smells the design accepted are now realized.** Boot sequence duplication between `createDomainBridge` and `createDomainBridgeWith`, hardcoded `validPredicates` list (instead of reading from live rule store), `Date.now()` in `render.js` (violates spec's "no ambient context" constraint), and `advance()` running outside the transaction scope without error handling — all introduced by the plan, all corrigible but accumulating maintenance debt.

5. **Closed-set discipline has an enforcement gap for runtime category dispatch.** `OPERATION_SPECS[add]` declares `idShape: ELEMENT_CATEGORIES.EVIDENCE` as a placeholder, but `runOperation` actually dispatches by `args.idShape` at runtime — which is never validated against `ELEMENT_CATEGORIES` at boot. The boot validator pattern the spec's hybrid was designed to enforce has a hole in the dynamic-dispatch path.

---

## Top findings (by severity)

### Sprint interlock (HIGH)

- **defineRule signature mismatch** — Plan calls `defineRule(ruleId, head, body, metadata)` (four positional args, tuple format); real engine `RuleStore.defineRule(rule)` takes one object with `{head: {predicate, arity, args}, body: [{predicate, arity, args, negated}]}`. Both reviewers cite multiple plan locations.
- **Variable representation mismatch** — Plan uses bare uppercase strings (`'S'`, `'T'`, `'N'`) as variables; real engine uses `{var: 'Name'}` via `V('X')`. Real engine treats uppercase strings as ground constants → every non-trivial query returns empty.
- **snapshot/restore format mismatch** — Plan's fake `snapshot()` returns `JSON.stringify(...)` (a string); real `captureSnapshot()` returns a `structuredClone` object. Plan's AC-7.1 assertion uses string equality (`.toBe(before)`) which would not work against the real engine.
- **`explain` arity mismatch** — Plan/spec `explain(fact)` (single arg); real engine `explain(predicate, args)` (two args).

### Inline plan defects (HIGH/MEDIUM)

- **AC-6.1 test is poisoned by Phase A mutations** — `calls` array captures `defineRule` invocations during bridge construction; the `expect(...).toBe(0)` assertion fails before any render runs. Fix: reset `calls = []` after construction.
- **AC-4.1 variant `idShape: undefined` passes validator** — `'idShape' in spec` returns `true` even for undefined values. Use `delete badSpecsMissing.add.idShape` or a different injected violation.
- **`createDomainBridgeWith` returns empty facade** — The plan's stub comment defers facade copy to the implementer; no test verifies completeness.
- **Boot sequence duplication** — `createDomainBridge` and `createDomainBridgeWith` carry two parallel copies of the eight-step boot sequence. Drift between them is undetected by any structural test.
- **`validPredicates` hardcoded list** — Spec says assemble from live rule store; plan hardcodes the derived-predicate names. Adding a new policy rule requires manually updating the list in two locations.
- **`render.renderClosingArgument` calls `Date.now()`** — Violates spec's "no ambient context" constraint. Should consume `ports.clock.now()` (but `ReadPorts` doesn't include `clock`). Either widen ReadPorts or remove the timestamp.

### Smell/coupling debt (MEDIUM/LOW)

- **`OPERATION_SPECS.add.idShape` is a placeholder** — Real category dispatch happens via `args.idShape` at runtime, unvalidated at boot.
- **`advance(ports)` runs outside transaction** — A throw here leaves engine state with successful operation commit but failed round increment, with no rollback path.
- **`stagnation_detected` is unused** — `FRICTION_SHAPES.STAGNATION` is defined in `tags.js` but no rule or query references it.
- **Structural tests are convention-grade, not semantic** — Regex over source has known false-negative blind spots (destructured port calls, alternative method-body formatting, etc.).
- **`module-shape.test.js` test inventory count mismatch** — Spec says 12 module test files; plan creates 13 (`domain-bridge.test.js` is the 13th alongside `bridge-integration.test.js`).

---

## Decision matrix (your four options)

The plan-build skill names four human options at this gate. Each is presented with what it implies for sprint-02's trajectory:

1. **Proceed (as-is)** — Build sprint-02 against the substrate fake. Accept that sprint-03 will need a tuple↔object Datalog adapter and a port-bundle namespace adapter. Accept that AC-6.1 and AC-4.1 tests will need on-the-fly fixes during execute-write. **Risk:** sprint-03 becomes a structural retrofit rather than wiring; sprint-02 "complete" doesn't mean integrable.

2. **Proceed with directed mitigations** — Apply the inline-defect fixes now (AC-6.1 calls reset; AC-4.1 variant; `Date.now()`; `validPredicates` from live rule store; `createDomainBridgeWith` factored to share boot sequence with `createDomainBridge`). Document the sprint-01 port-contract gap as a known constraint in a `## Sprint-03 Integration Hazards` section appended to the plan. **Risk:** mitigations reduce inline-defect surface but the sprint-01 interlock remains; sprint-03 still pays the adapter cost.

3. **Return to design with additional requirements** — Before sprint-02 implementation begins, verify what sprint-01 actually delivered. If sprint-01's pass-3 (or later) refactored the engine to the six-substrate-port API matching the spec's verified anchors, the plan is fine. If not, decide whether to (a) revise sprint-02's spec/plan to match the legacy flat API, or (b) require sprint-01 to deliver the six-port refactor first. **Risk:** slows trajectory; rewards correctness of integration.

4. **Stop** — Halt sprint-02 entirely. Re-examine the master plan's sprint sequencing; possibly insert a sprint-01.5 to deliver the six-port API surface that sprint-02's spec assumes. **Risk:** highest schedule impact; lowest integration-failure risk.

The reviewers' findings are convergent and load-bearing. My read of the evidence: **option 3** is the right answer because the sprint-01 interlock is real and structural, not corrigible inline. Option 2's inline mitigations are correct but don't close the load-bearing gap. Option 1 trades sprint-02 velocity for sprint-03 retrofit pain. Option 4 is correct if the cascade itself needs replanning, but probably overkill if sprint-01's actual deliverable can be verified.

---

## Smell triggers matched

This plan triggered four of the five smell trigger categories from `references/smell-triggers.md`:

- DI registrations (`createDomainBridge({engine, clock, idAllocator, consentVerification, persistenceRepo})`)
- New abstractions (port bundles, OperationSpec, RULE_TEMPLATES, CategoryDescriptor, DomainBootError)
- New persistence pathways (`persistenceRepo.saveState` introduced at `runOperation` step 11)
- New contract surfaces (seven delivery ports + six substrate ports)

The smeller's findings were therefore expected to be substantive. The convergence with plan-attack's findings on the sprint-01 interlock is the load-bearing signal.

---

*Threat report generated by plan-build's hardening gate. Plan-attacker and plan-smeller dispatched in parallel via named subagents (no fork). Findings synthesized into combined risk level by the planner.*

<!-- created-at: 2026-05-13T19:46:29Z -->
<!-- produced-by plan-build@v0001 -->
