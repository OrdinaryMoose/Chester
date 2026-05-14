# Engine Public API Alignment — Design Brief

**Sprint:** `20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4`
**Status:** Approved — small-task design (single round, recommended choices accepted)
**Source:** Adversarial review during sprint-02-proof-layer plan-hardening identified two public-API divergences between the engine and its own contract document; this pass closes them.

---

## Goal

Bring the engine's public API at `skills/design-large-task/engine/` into literal compliance with its own contract document (`04-engine-spec.md` §4). Two operations currently diverge: the rule-definition operation accepts a single bundled-object input instead of the four positional inputs the contract specifies, and the explanation operation accepts two separate inputs instead of the one bundled input the contract specifies. Serialization output and the rule-store-internal `defineRule` callsite (which the engine's own `Serializer` invokes during deserialization) are part of the same public contract and shift to the new shape in this pass. Internal data structures inside the rule store, the unifier, the stratifier, and the evaluator stay as-is — the change is a translation layer at the engine class boundary plus a matching translation at the serializer boundary.

## Prior Art

**Sprint-01 lineage.** The engine was built across `sprint-01-proof-backend`, `-pass-2`, and `-pass-3` (the last canonicalized as ADRs 0015–0019 and indexing performance work). All three passes left the rule-definition and explanation operations with the same shapes they were originally implemented with. The contract document was authored in parallel and not retroactively reconciled against what the implementation actually built — that gap is what this pass closes.

**Discovery context.** Sprint-02-proof-layer's plan-build hardening gate ran an adversarial review and a forward-looking smell review in parallel. Both reviewers independently identified the same two API divergences as load-bearing for the sprint-02/sprint-03 integration story. The combined threat report at `sprint-02-proof-layer/plan/sprint-02-proof-layer-plan-threat-report-00.md` carries the full findings. Sprint-02's plan-build returned to design pending this alignment pass.

**Contract document examples.** `04-engine-spec.md` §6.2 gives the canonical example of the rule-definition operation:

```
defineRule(
  ruleId: "prop_3_grounding",
  headAtom: ["proposition", ["prop_3", S]],
  bodyAtoms: [
    ["evidence", ["evid_3", "_", "_"]],
    ["rule_decl", ["rule_1", "_"]],
    ["approved", ["prop_3", "_", "_"]]
  ],
  metadata: { domain_concept: "necessary_condition", inference_pattern: "grounds_imply_conclusion" }
)
```

Tuple-shaped atoms `[predicate, args]`. Bare uppercase strings as variables. The literal string `'_'` as the anonymous wildcard. Negated body atoms appear in the form `['not', atom]`. The explanation operation's contract at §4.5 is `explain(fact)` with `fact` interpreted as a `[predicate, args]` tuple.

## Scope

**In scope:**

- Modify the rule-definition operation on the engine class to accept four positional inputs (`ruleId`, `headAtom`, `bodyAtoms`, `metadata`) with tuple-shaped atoms.
- Modify the explanation operation on the engine class to accept one input (`fact` as `[predicate, args]` tuple).
- Insert a translation layer at the engine class boundary that converts tuple-format atoms into the internal `{predicate, arity, args: [{var}]}` shape the rule store, unifier, stratifier, and evaluator already consume.
- Update the serialization layer so the on-wire rule shape matches the new public form (tuple atoms with `'_'` wildcards and bare uppercase-string variables and `['not', atom]` negation), and so deserialization invokes the new public rule-definition signature.
- Update all 12 engine test files that exercise the two operations directly. ~1,500 LOC of test surface; most call sites are mechanical signature flips.
- Update the engine's own `_internal_*` helper paths if any test reaches into rule-store internals using the old shape — translate at the boundary, untouched inside.
- Preserve every existing engine behavior: stratification check at definition time, datalog safety check (`UNSAFE_RULE` for head variables not bound by any non-negated body atom), `DUPLICATE_RULE_ID` rejection, `MALFORMED_RULE` rejection, round-trip fidelity of snapshot/restore, transaction semantics.

**Out of scope:**

- Internal data structures inside the rule store, unifier, stratifier, and evaluator. These keep their object-format representations; the new translation layer is the seam.
- The engine spec document itself — `04-engine-spec.md` is the source of truth this pass aligns the code to; no spec edits.
- New engine functionality — no new ports, no new operations, no new validation, no new ADRs.
- Sprint-02's Domain layer code, which will be amended after this pass lands.
- The Domain's substrate fake (`inMemorySubstrate.js`) and the bridge's namespacing adapter — both sprint-02 concerns, addressed when sprint-02 resumes.

## Key Decisions

1. **Translation layer at the engine class boundary.** The translation between tuple-form atoms (the new public form) and the internal `{predicate, arity, args, negated}` shape lives in the engine class's public methods themselves — not in the rule store, not in the stratifier, not in the unifier. **Alternative considered:** Pushing translation into the rule store so internals see the same shape they accept. **Why this wins:** Translation at the class boundary keeps the internal data flow exactly as sprint-01 built it; the only changed code is the public-method body. The stratification logic, the safety check, the duplicate-rule-id detection, and the by-head index all keep their object-format inputs untouched. Reduces blast radius.

2. **Serialization format switches to the new shape.** The persisted-on-disk shape for rules matches the new public input shape — tuple atoms, uppercase-string variables, `'_'` wildcards, `['not', atom]` negation. Both the serializer's output and its loader are updated. **Alternative considered:** Keep on-disk shape in the old bundled form, translate at load. **Why this wins:** A serialization format that contradicts the documented rule-definition shape is itself a contract drift. The engine is pre-production; there is no persisted state to back-compat. An invisible translate-at-load adapter is exactly the kind of code that rots silently — six months from now someone edits one side and not the other and the round-trip breaks.

3. **Anonymous wildcards stay as the literal string `'_'`.** Per the contract document's §6.2 example. The unifier already handles `'_'` as a wildcard. **Alternative considered:** Symbol-based wildcard sentinel for type-safety. **Why this wins:** The contract document is normative; deviating would be an additional drift to track.

4. **Variables stay as bare uppercase strings at the public boundary.** Per the contract document's §6.2 example (`['proposition', ['prop_3', S]]`). The translation layer converts them to the `{var: 'Name'}` objects the internal unifier consumes. **Alternative considered:** Require callers to use `{var: 'X'}` objects explicitly. **Why this wins:** The contract example shows bare uppercase strings; matching the example is the alignment we are here to do. Bare-string variables also produce more readable test code.

5. **Negation expressed as `['not', atom]` outer wrapper.** Per the contract document's §6.2 example. The translation layer detects this wrapper, sets the internal `negated: true` flag on the body atom, and unwraps to the underlying atom for further translation. **Alternative considered:** A `negated: true` field on tuple atoms (e.g., `['p', ['X'], { negated: true }]`). **Why this wins:** The contract document uses the outer-wrapper form consistently; matching it is the alignment task.

6. **Explanation operation accepts `fact` as `[predicate, args]` tuple.** Per the contract document's §4.5. The implementation internally splits the tuple to call its existing two-argument helper paths. **Alternative considered:** Accept `predicate` and `args` as object-form `{predicate, args}`. **Why this wins:** The contract document specifies tuple form; aligning is the task.

## Constraints

- The contract document `04-engine-spec.md` is normative for this pass. Every public-API decision matches what the document specifies. If something in the document is ambiguous, the example in §6.2 wins; if §6.2 doesn't speak to it, prefer the simpler convention.
- Stratification timing per ADR-0013 Part 3 (stratification check fires at the rule-definition call, including inside an open transaction) is preserved exactly. The translation layer runs before the stratification check; a malformed atom in the public input surfaces as `MALFORMED_RULE` before stratification runs.
- Existing engine behaviors all carry through: read-own-writes transaction visibility (Engine Spec §4.8 + ADR-0013 Part 2), idempotent assert/retract, snapshot/restore round-trip fidelity, all error codes (`MALFORMED_RULE`, `UNSAFE_RULE`, `DUPLICATE_RULE_ID`, `CYCLIC_NEGATION`, `NESTED_TRANSACTION_OP_REFUSED`, etc.).
- No new dependencies introduced. No changes to `package.json` beyond version bump if appropriate.
- LOC budget: ~150-200 LOC for the alignment work itself across the engine class, the serializer, and a small new translation module if one is extracted. Test-file edits are additional but mechanical (mostly signature flips, some atom-shape rewrites).

## Acceptance Criteria

- Calling the rule-definition operation with the four positional inputs (per `04-engine-spec.md` §4.2 and §6.2) successfully defines a rule. Calling it with the old single-object input throws a clear error (or, if backwards-compatibility shim is judged unwise per Decision 2's rationale, simply fails as a normal signature mismatch).
- Calling the explanation operation with one `[predicate, args]` tuple input returns the expected derivation tree (or `null` for absent facts).
- Every engine test file passes after the test-side signature flips. Total test count unchanged. Property-test suites (monotonicity, determinism, set semantics, termination, snapshot fidelity, read-own-writes inside tx) all green.
- Negation in the public rule shape — `bodyAtoms` containing `['not', ['p', [...]]]` — produces a body atom marked `negated: true` in the internal representation, which the stratifier then uses for cycle-through-negation detection. A test asserts: defining a rule where the head depends transitively on a body atom that depends on a negation of the head throws `CYCLIC_NEGATION`.
- Datalog safety: defining a rule whose `headAtom` carries an uppercase-string variable that does not appear in any non-negated body atom throws `UNSAFE_RULE` with the offending variable name in the error payload.
- Wildcards: defining a rule whose `bodyAtoms` carry `'_'` positions correctly anonymizes those positions during unification. A test asserts: a body atom with a wildcard at position 1 unifies against any concrete value at position 1.
- Serialization round-trip: a rule defined via the new shape is serialized, the serialized form is loaded into a fresh engine, and the loaded rule fires identically. The serialized form on disk contains tuple atoms and bare uppercase-string variables and `['not', atom]` negation — not the old internal `{predicate, arity, args}` shape.
- The engine's `Serializer` deserializer invokes the new rule-definition operation signature (not the internal rule-store API). A grep confirms no remaining call sites use the old `defineRule(rule)` object form.
- The internal `RuleStore`, `Stratifier`, `Unifier`, and `Evaluator` modules retain their object-format internal data structures — no behavior change in any of them. A grep confirms their existing call surfaces are unchanged.
- ADR-0013's "stratification at defineRule time inside transactions" property is preserved: defining a cyclic-negation rule inside an open transaction throws at the call, not at commit. A test asserts this against the new signature.
- The threat report from sprint-02's hardening gate identified the divergence on these two specific operations as load-bearing for the Domain integration. After this pass, sprint-02's spec amendment can drop the format-translation concern from its bridge — the bridge only needs to do flat→namespaced adaptation, not tuple↔object adaptation, since both the engine and the Domain will speak the same atom shape.

<!-- created-at: 2026-05-13T20:00:51Z -->
<!-- produced-by design-small-task@v0003 -->
