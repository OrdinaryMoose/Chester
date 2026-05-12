# Plan: Sprint-01 Deferred-Item Closure (Pass-2)

**Sprint:** 20260511-01-mp-redesign-proof-system / sprint-01-proof-backend-pass-2
**Spec:** ../spec/sprint-01-proof-backend-pass-2-spec-00.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven).

## Goal

Close four of the five sprint-01 deferment items (D1, D2, D3, D4) by writing four new architectural decision records, amending the engine-tier specification in place, adding one small code addition at the rule-registry layer with a new error code, removing the now-redundant defense-in-depth guard, re-homing one test, adding breadcrumb comments at the four tightening sites, and creating a new engine-tier open-questions document making the deferred indexing-architecture question (D5) visible.

## Architecture

Hybrid layered acceptance criteria, per spec. Sprint-01's behavioral ACs carry forward in pass-2's spec with surgical amendments; pass-2 adds five new sections grouping deliverables by deferment item. Sprint-01's folder is treated as a frozen historical record — no edits there.

## Tech Stack

- Node.js ES modules; Vitest for tests; pure-JS engine with no runtime dependencies.
- Documentation in Markdown under `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/`.
- ADR convention: `NNNN-kebab-case-slug.md` with YAML frontmatter and sections per existing ADR-0014 template.

## Implementer-Context Notes

- Existing ADRs at `design-documents/ADR/` carry a literal " copy" suffix in their filenames (e.g., `0014-rename-necessary-condition-and-resolve-condition copy.md`). This is an artifact of how those files arrived in the working tree. **Pass-2's new ADRs use clean kebab-case filenames without the " copy" suffix** — establishing the canonical convention going forward.
- Breadcrumb comments use single-line `//` form, placed at the first line of the new logic block, ADR reference plus a 4-8 word failure-mode phrase.
- RuleStore safety-check ordering: insert after `validateRule(rule)` and before the duplicate-id check, so a structurally-malformed rule still raises `MALFORMED_RULE` (validateRule catches it first), and an unsafe-but-otherwise-valid rule with a duplicate ruleId raises `UNSAFE_RULE` (structural error dominates over bookkeeping error).
- **Engine-spec citation format (overrides the wording in Tasks 1–4 step prescriptions):** every ADR citation inserted into `04-engine-spec.md` must use the canonical `(See ADR-NNNN.)` form — capital "S", parentheses around the whole citation, trailing period inside the parens — matching the existing convention at lines 138, 140, 142, 323, 325 of that document. The in-task step text may use lowercase "see" or em-dash constructions; ignore those local forms and apply the canonical parenthetical form throughout. Spec AC-14.2 and Constraints section enforce this.

---

## Task 1: Close D1 — Finite-Constant Constraint

**Type:** docs-producing
**Implements:** AC-14.1, AC-14.2, AC-14.3
**Decision budget:** 2
**Must remain green:** all current passing tests (86 passing / 1 skipped); pass-2 introduces no new tests in this task.

**Files:**
- Create: `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0015-finite-constant-constraint.md`
- Modify: `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md` (line 37 — Inclusions; line ~225 — Errors section)
- Modify: `skills/design-large-task/engine/FactStore.js:6-10` (add single-line breadcrumb comment at the `Number.isFinite(v)` line)

**Steps:**

- [ ] **Step 1: Write ADR-0015**

Create `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0015-finite-constant-constraint.md` with this content:

```markdown
---
status: Accepted
date: 2026-05-12
deciders: [M]
related_docs: [04-engine-spec]
related_adrs: [0002]
---

# ADR-0015: Finite-Constant Constraint at the EDB Write Path

## Status

Accepted.

## Context

The Engine treats `assertFact` argument values as constants drawn from a small type set: string, number, boolean, null. The original `04-engine-spec.md §2.1` enumerated this set without qualifying "number" — admitting all JavaScript number values, including `NaN`, `+Infinity`, and `-Infinity`.

During sprint-01 Task 2 (FactStore implementation), a quality review surfaced a defect class: `JSON.stringify(NaN)` produces the string `"null"`, as does `JSON.stringify(Infinity)` and `JSON.stringify(-Infinity)`. The fact-key encoding `factKey(args) = JSON.stringify(args)` therefore collapses three distinct numerical sentinels into the same string as a legitimately-null-valued fact. Two unrelated facts — say `p(NaN)` and `p(null)` — would share a key, with the second assertion silently overwriting the first or being treated as a duplicate.

The collision propagates downstream: the evaluator joins against the EDB by matching fact-key tuples, so a poisoned EDB produces wrong-result derivations. This is data corruption, not a clean error.

Sprint-01's plan-prescribed `FactStore.isConstant` did not include a finite-number check. The corrected version, added during sprint-01 as a surgical fix (commit on top of Task 2's original commit), reads:

```js
const isConstant = (v) =>
  typeof v === 'string' ||
  (typeof v === 'number' && Number.isFinite(v)) ||
  typeof v === 'boolean' ||
  v === null;
```

The text of `04-engine-spec.md §2.1` and sprint-01's spec text still describe constants as "string, number, boolean, null" — looser than the corrected code. Pass-2 reconciles the text with the code.

## Decision

Constants accepted at the EDB write path (`assertFact`) are restricted to:

- string
- finite number (`Number.isFinite(v) === true`)
- boolean
- `null`

`NaN`, `+Infinity`, and `-Infinity` are rejected with `TYPE_ERROR`. The check lives in `FactStore.isConstant`; `assertFact` is the only public entry point that consults it.

## Rationale

A finite-number constraint is the minimum surface area that closes the silent-collision class without restricting expressive power for any legitimate Domain-layer use. Datalog programs reason about discrete values; no canonical Datalog example uses `NaN` or infinite values as fact arguments. Rejecting them at the boundary is cheap (one `Number.isFinite` call per arg per assertion) and pushes the failure to the call site rather than letting it propagate into corrupt derivations.

The alternative — accepting non-finite numbers and changing the fact-key encoding to disambiguate them — would require either a custom serializer (heavier than this fix) or living with the collision indefinitely.

## Consequences

**Positive:**
- The silent-collision class for non-finite numerical sentinels is closed at the boundary.
- The error mode is structured (`TYPE_ERROR`) and observable at the call site.
- The contract aligns with the corrected code already in production.

**Negative:**
- A Domain caller that legitimately wants to assert a non-finite numerical sentinel (extremely unusual) must encode it differently (e.g., as a string or a boxed object).
- The error message text must clearly distinguish "non-finite number" from "non-number" so the caller knows which constraint was violated.

**Neutral:**
- This constraint is a strict refinement of sprint-01's text; programs that complied with the spec text already comply with this tightening.

## Alternatives considered

- **Accept non-finite numbers and change the fact-key encoding.** Rejected — heavier change with broader blast radius; the simpler boundary check is sufficient.
- **Document the gap without changing the code.** Rejected — silent data corruption is unacceptable.
- **Bundle this tightening into a generic "well-formedness check" alongside other input validation.** Rejected — premature abstraction for a single sentinel class.

## What would change the decision

If a future Domain workload requires non-finite numerical sentinels as first-class fact arguments, the decision is revisited along with a fact-key encoding change to disambiguate them.

## References

- `04-engine-spec.md §2.1 Inclusions` (post-pass-2 amended text)
- Sprint-01 deferment doc: D1 entry at `docs/chester/plans/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md`
- Code: `FactStore.js:6-10`
```

- [ ] **Step 2: Verify ADR-0015 exists with the required sections**

Run: `ls /home/mike/Documents/CodeProjects/Chester/docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0015-finite-constant-constraint.md && grep -c "^## " /home/mike/Documents/CodeProjects/Chester/docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0015-finite-constant-constraint.md`
Expected: file listed; section count is 7 (Status, Context, Decision, Rationale, Consequences, Alternatives considered, What would change the decision) — plus References for 8.

- [ ] **Step 3: Amend `04-engine-spec.md` Inclusions section at line 37**

Open `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md`.

Change line 37 from:
```
- **Constants**: string, number, boolean, null
```
to:
```
- **Constants**: string, finite number, boolean, null (NaN, +Infinity, and -Infinity are excluded — see ADR-0015)
```

- [ ] **Step 4: Amend `04-engine-spec.md` Errors section around line 225**

Locate the type-errors line near 225 reading:
```
- **Type errors**: assertFact called with non-constant value where constants required
```
Change it to:
```
- **Type errors**: `assertFact` called with non-constant value where constants required, including non-finite numerical values (NaN, ±Infinity) per ADR-0015
```

- [ ] **Step 5: Add breadcrumb comment in `FactStore.js`**

Open `skills/design-large-task/engine/FactStore.js`.

The current `isConstant` block is:
```js
const isConstant = (v) =>
  typeof v === 'string' ||
  (typeof v === 'number' && Number.isFinite(v)) ||
  typeof v === 'boolean' ||
  v === null;
```

Insert a single-line comment immediately before the `const isConstant` declaration (i.e., as line 6, pushing the existing lines down):

```js
// ADR-0015: NaN/Infinity collide via JSON.stringify
const isConstant = (v) =>
  typeof v === 'string' ||
  (typeof v === 'number' && Number.isFinite(v)) ||
  typeof v === 'boolean' ||
  v === null;
```

- [ ] **Step 6: Verify breadcrumb and run full test suite**

Run: `grep -n "ADR-0015" skills/design-large-task/engine/FactStore.js`
Expected: exactly one match at the line immediately preceding the `isConstant` declaration.

Run: `cd skills/design-large-task/engine && npx vitest run`
Expected: 86 passing, 1 skipped (AC-11.2), 0 failing.

- [ ] **Step 7: Commit**

```bash
git add docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0015-finite-constant-constraint.md
git add docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md
git add skills/design-large-task/engine/FactStore.js
git commit -m "docs(engine): canonicalize D1 — finite-constant constraint (ADR-0015)"
```

---

## Task 2: Close D2 — Canonical Rule-Safety Check

**Type:** code-producing
**Implements:** AC-2.6, AC-15.1, AC-15.2, AC-15.3, AC-15.4, AC-15.5, AC-15.6, AC-15.7, AC-15.8
**Decision budget:** 5
**Must remain green:** new test `defineRule rejects unsafe rules with UNSAFE_RULE`, new test `failures.test.js > UNSAFE_RULE catalog`, plus all sprint-01 tests covering RuleStore.js, Evaluator.js, Serializer.js (operations.test.js, evaluation.test.js, transactions.test.js, lifecycle.test.js, snapshot.test.js, failures.test.js, properties.test.js, stress.test.js).

**Files:**
- Create: `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0016-canonical-rule-safety-check.md`
- Modify: `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md` (line 93 — defineRule description; around line 224-225 and 349-353 — error catalog)
- Modify: `skills/design-large-task/engine/RuleStore.js:34-47` (add safety check between `validateRule(rule)` and the duplicate-id check; add breadcrumb)
- Modify: `skills/design-large-task/engine/Evaluator.js:118-122` (remove the `UNBOUND_HEAD_VARIABLE` guard block)
- Modify: `skills/design-large-task/engine/Serializer.js:41-44` (update atomic-load contract comment: replace `UNBOUND_HEAD_VARIABLE` with `UNSAFE_RULE`)
- Modify: `skills/design-large-task/engine/__tests__/operations.test.js` (add one new `it(...)` block: UNSAFE_RULE rejection at defineRule)
- Modify: `skills/design-large-task/engine/__tests__/evaluation.test.js:128-138` (delete the `throws UNBOUND_HEAD_VARIABLE when a head variable is not bound by the body` test)
- Modify: `skills/design-large-task/engine/__tests__/failures.test.js` (add one new `it(...)` block: UNSAFE_RULE catalog entry)

**Steps (TDD):**

- [ ] **Step 1: Write the failing UNSAFE_RULE test in operations.test.js**

Open `skills/design-large-task/engine/__tests__/operations.test.js`. Locate the existing RuleStore describe block. Add this new `it(...)` block inside that describe (placement: after the last existing rule-related test, before the closing `})` of the describe). Per spec AC-15.6, the file's test count must increase by exactly one — both unsafe-rule cases (head var absent from body; head var only in negated body atom) go into a single `it(...)` block:

```js
  it('defineRule rejects unsafe rules with UNSAFE_RULE (head var not bound by non-negated body)', () => {
    const rs1 = new RuleStore();
    // Case 1: q(X, Y) :- p(X)  — head variable Y appears nowhere in the body
    const unsafe1 = {
      ruleId: 'r1',
      head: { predicate: 'q', arity: 2, args: [{ var: 'X' }, { var: 'Y' }] },
      body: [{ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: false }]
    };
    expect(() => rs1.defineRule(unsafe1)).toThrow(
      expect.objectContaining({
        code: 'UNSAFE_RULE',
        ruleId: 'r1',
        unboundVars: ['Y']
      })
    );
    expect(rs1.getRule('r1')).toBeUndefined();

    // Case 2: q(X) :- ¬p(X)  — head variable X appears only in a negated body atom (does not count as bound)
    const rs2 = new RuleStore();
    const unsafe2 = {
      ruleId: 'r2',
      head: { predicate: 'q', arity: 1, args: [{ var: 'X' }] },
      body: [{ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: true }]
    };
    expect(() => rs2.defineRule(unsafe2)).toThrow(
      expect.objectContaining({
        code: 'UNSAFE_RULE',
        ruleId: 'r2',
        unboundVars: ['X']
      })
    );
    expect(rs2.getRule('r2')).toBeUndefined();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/operations.test.js -t "UNSAFE_RULE"`
Expected: 1 test, FAIL. The first `expect(() => rs1.defineRule(unsafe1)).toThrow(...)` assertion fails — either because the rule was incorrectly accepted (no throw), or because a different error code was thrown. Either failure shape confirms the safety check is not yet present.

- [ ] **Step 3: Implement the safety check in RuleStore.defineRule**

Open `skills/design-large-task/engine/RuleStore.js`. The current `defineRule` method (lines 34-47) is:

```js
  defineRule(rule) {
    validateRule(rule);
    if (this._rules.has(rule.ruleId)) {
      throw { code: 'DUPLICATE_RULE_ID', ruleId: rule.ruleId };
    }
    // Stratification check: include the new rule, recompute strata, fail if cycle through negation.
    const candidate = [...this._rules.values(), rule];
    const strata = stratify(candidate); // throws CYCLIC_NEGATION if invalid
    this._rules.set(rule.ruleId, rule);
    this._strata = strata;
    const hk = `${rule.head.predicate}/${rule.head.arity}`;
    if (!this._byHead.has(hk)) this._byHead.set(hk, new Set());
    this._byHead.get(hk).add(rule.ruleId);
  }
```

Add a new module-level helper above `defineRule` (place it after the existing `validateRule` function definition near line 22):

```js
function checkSafety(rule) {
  // Datalog safety: every variable in the head must appear in at least one non-negated body atom.
  // Variables that only appear in negated atoms are NOT considered bound — they would be
  // existentially quantified in the negation branch, leaving the head variable unbound at fire time.
  const bound = new Set();
  for (const atom of rule.body) {
    if (atom.negated) continue;
    for (const a of atom.args) {
      if (a && typeof a === 'object' && typeof a.var === 'string') {
        bound.add(a.var);
      }
    }
  }
  const unboundVars = [];
  for (const a of rule.head.args) {
    if (a && typeof a === 'object' && typeof a.var === 'string') {
      if (!bound.has(a.var)) unboundVars.push(a.var);
    }
  }
  if (unboundVars.length > 0) {
    throw { code: 'UNSAFE_RULE', ruleId: rule.ruleId, unboundVars, message: `rule ${rule.ruleId} has head variables not bound by any non-negated body atom: ${unboundVars.join(', ')}` };
  }
}
```

Then modify `defineRule` to call `checkSafety` immediately after `validateRule`, before the duplicate-id check. The new body of `defineRule`:

```js
  defineRule(rule) {
    // ADR-0016: unsafe head var produces poisoned IDB
    validateRule(rule);
    checkSafety(rule);
    if (this._rules.has(rule.ruleId)) {
      throw { code: 'DUPLICATE_RULE_ID', ruleId: rule.ruleId };
    }
    // Stratification check: include the new rule, recompute strata, fail if cycle through negation.
    const candidate = [...this._rules.values(), rule];
    const strata = stratify(candidate); // throws CYCLIC_NEGATION if invalid
    this._rules.set(rule.ruleId, rule);
    this._strata = strata;
    const hk = `${rule.head.predicate}/${rule.head.arity}`;
    if (!this._byHead.has(hk)) this._byHead.set(hk, new Set());
    this._byHead.get(hk).add(rule.ruleId);
  }
```

Notice the breadcrumb comment `// ADR-0016: unsafe head var produces poisoned IDB` on the first line of the method body — this is the D2 breadcrumb (AC-15.8). The comment is intentionally above the `validateRule` call rather than above the `checkSafety` call because it documents the larger reason the safety check exists, which applies to the whole entry-point flow.

- [ ] **Step 4: Run the new test to verify it passes**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/operations.test.js -t "UNSAFE_RULE"`
Expected: 1 test, PASS. Both internal cases (head-var-absent and head-var-in-negation-only) satisfy their `expect()` assertions inside the single `it(...)` block.

- [ ] **Step 5: Run the full operations.test.js to verify nothing else broke**

Run: `cd skills/design-large-task/engine && npx vitest run __tests__/operations.test.js`
Expected: 21 tests passing (20 original + 1 new UNSAFE_RULE test). Per spec AC-15.6.

- [ ] **Step 6: Run the full engine test suite — expect one failure in evaluation.test.js**

Run: `cd skills/design-large-task/engine && npx vitest run`
Expected: ONE failure in `__tests__/evaluation.test.js` — the `throws UNBOUND_HEAD_VARIABLE when a head variable is not bound by the body` test. The failure shape: the test's `rs.defineRule(...)` call at lines 133-136 of `evaluation.test.js` now throws `UNSAFE_RULE` synchronously (from `checkSafety`), so execution never reaches the `expect(() => ev.derive()).toThrow(...)` assertion at line 138. Vitest reports this as one test failure, with the throw site being `rs.defineRule(...)` inside the test body rather than `ev.derive()` inside the `expect()` callback.

Failure count is one. If any other tests fail, stop and investigate — that indicates a regression beyond the planned D2 work.

- [ ] **Step 7: Delete the obsolete UNBOUND_HEAD_VARIABLE test in evaluation.test.js**

Open `skills/design-large-task/engine/__tests__/evaluation.test.js`. Locate the test block at lines 128-138:

```js
  it('throws UNBOUND_HEAD_VARIABLE when a head variable is not bound by the body', () => {
    // ... existing test body asserting derive() throws UNBOUND_HEAD_VARIABLE ...
  });
```

Delete the entire `it(...)` block (lines 128-138), including the trailing blank line if present. The test file's `it(...)` count goes from 10 to 9.

- [ ] **Step 8: Remove the UNBOUND_HEAD_VARIABLE guard from Evaluator.fireRule**

Open `skills/design-large-task/engine/Evaluator.js`. The current `fireRule` inner block (around lines 118-131) contains:

```js
          for (const b of bindingsList) {
            const headArgs = substituteArgs(rule.head.args, b);
            if (headArgs.some((a) => a === undefined)) {
              throw { code: 'UNBOUND_HEAD_VARIABLE', ruleId: rule.ruleId, message: `rule ${rule.ruleId} head contains a variable not bound by its body` };
            }
            const fk = factKey(rule.head.predicate, headArgs);
            ...
          }
```

Delete the `if (headArgs.some((a) => a === undefined)) { throw ... }` block (the 3 lines starting with `if (headArgs.some...)` and ending with the closing `}`). The result:

```js
          for (const b of bindingsList) {
            const headArgs = substituteArgs(rule.head.args, b);
            const fk = factKey(rule.head.predicate, headArgs);
            ...
          }
```

- [ ] **Step 9: Update the Serializer.js atomic-load contract comment**

Open `skills/design-large-task/engine/Serializer.js`. The current comment at lines 41-44 reads:

```js
  // Atomic-load contract (spec AC-7.3): if any replay step throws (TYPE_ERROR on
  // an invalid fact arg, MALFORMED_RULE / DUPLICATE_RULE_ID / CYCLIC_NEGATION /
  // UNBOUND_HEAD_VARIABLE on a rule), the engine must be restored to its prior
  // state. Take a snapshot before clear, restore on any replay exception.
```

Change `UNBOUND_HEAD_VARIABLE` to `UNSAFE_RULE`:

```js
  // Atomic-load contract (spec AC-7.3): if any replay step throws (TYPE_ERROR on
  // an invalid fact arg, MALFORMED_RULE / DUPLICATE_RULE_ID / CYCLIC_NEGATION /
  // UNSAFE_RULE on a rule), the engine must be restored to its prior
  // state. Take a snapshot before clear, restore on any replay exception.
```

- [ ] **Step 10: Add UNSAFE_RULE catalog entry to failures.test.js**

Open `skills/design-large-task/engine/__tests__/failures.test.js`. Add a new `it(...)` block in the catalog describe block, after the last existing error-code test:

```js
  it('UNSAFE_RULE — defineRule rejects rule with unbound head variable', () => {
    const e = new Engine();
    expect(() => e.defineRule({
      ruleId: 'unsafe1',
      head: { predicate: 'q', arity: 2, args: [{ var: 'X' }, { var: 'Y' }] },
      body: [{ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: false }]
    })).toThrow(expect.objectContaining({ code: 'UNSAFE_RULE', ruleId: 'unsafe1' }));
  });
```

The file's `it(...)` count goes from 8 to 9.

- [ ] **Step 11: Run the full engine test suite — expect all green**

Run: `cd skills/design-large-task/engine && npx vitest run`
Expected: 87 passing (86 sprint-01 baseline + 1 operations.test.js - 1 evaluation.test.js + 1 failures.test.js = +1 net), 1 skipped (AC-11.2), 0 failing.

If anything fails, stop and investigate.

- [ ] **Step 12: Verify UNBOUND_HEAD_VARIABLE is gone from engine source and tests**

Run: `grep -rn "UNBOUND_HEAD_VARIABLE" skills/design-large-task/engine/`
Expected: zero matches.

- [ ] **Step 13: Verify UNSAFE_RULE is present**

Run: `grep -rn "UNSAFE_RULE" skills/design-large-task/engine/`
Expected: matches in RuleStore.js (the throw), operations.test.js (the new tests), failures.test.js (the new catalog test), Serializer.js (the updated comment).

- [ ] **Step 14: Write ADR-0016**

Create `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0016-canonical-rule-safety-check.md` following the same template structure as ADR-0014 and ADR-0015. Required section content:

- **Context** — Failure mode: `substituteArgs` returns `undefined` for head-variable positions whose variable is not bound by any non-negated body atom; `JSON.stringify(['a', undefined])` produces `'["a",null]'`, colliding with legitimately-null-valued facts. Sprint-01 added a defense-in-depth guard at `Evaluator.fireRule` that throws `UNBOUND_HEAD_VARIABLE`; pass-2 relocates the check to the canonical layer (rule-registry at definition time) and removes the defense-in-depth backstop as redundant.
- **Decision** — Add a `checkSafety(rule)` helper to `RuleStore.js`, called from `defineRule()` immediately after `validateRule(rule)` and before the duplicate-id check. The check computes the set of variable names bound by non-negated body atoms; if any head variable is not in that set, throws `{ code: 'UNSAFE_RULE', ruleId, unboundVars }`. Variables appearing only in negated atoms do not count as bound (existential-quantification semantics — see ADR-0017).
- **Consequences (Positive)** — Silent IDB corruption via undefined-as-null collision is closed at the canonical boundary. The `Evaluator.fireRule` defense-in-depth guard is no longer needed and is removed. The error is structured and carries `unboundVars`, letting downstream tooling distinguish unsafe-rule rejection from other definition errors.
- **Consequences (Negative)** — A Domain caller programmatically generating rules must ensure safety up front; the previous defense-in-depth behavior caught some violations late.
- **Consequences (Neutral)** — Sprint-01's existing tests for malformed and cyclic-negation rules continue to pass unchanged; UNSAFE_RULE is a new error code, not a renamed existing one.
- **Alternatives considered** — (1) Keep both layers as defense-in-depth — rejected because the rule-registry is the only entry point into the evaluator's rule set; defense-in-depth here adds reader confusion without operational benefit. (2) Extend `MALFORMED_RULE` to cover safety — rejected because structural malformedness (wrong shape) and semantic unsafety (well-shaped but unbound) are different concerns and deserve different error codes for downstream tooling.
- **What would change the decision** — A future evaluator-bypass path (e.g., a faster direct-IDB-write API) would re-introduce the need for an evaluator-side guard.
- **References** — `04-engine-spec.md §4.2 defineRule` (post-pass-2 amendment); sprint-01 deferment doc D2; ADR-0017 (existential-quantification semantics referenced by the safety check); code: `RuleStore.js`, `Evaluator.js`.

Length target: 80-110 lines, matching the existing ADR-0013 and ADR-0014 conventions.

- [ ] **Step 15: Amend `04-engine-spec.md` defineRule description (line 93)**

Open `04-engine-spec.md`. Locate line 93:
```
- `defineRule(ruleId, headAtom, bodyAtoms, metadata)` — write a Horn clause into the rule store. RuleId must be unique. Metadata is opaque to the Engine; carried through for the Domain's use.
```

Change to:
```
- `defineRule(ruleId, headAtom, bodyAtoms, metadata)` — write a Horn clause into the rule store. RuleId must be unique. Every variable appearing in `headAtom` must also appear in at least one non-negated atom of `bodyAtoms` (Datalog safety condition); violations are rejected at the call with `UNSAFE_RULE` (see ADR-0016). Metadata is opaque to the Engine; carried through for the Domain's use.
```

- [ ] **Step 16: Amend `04-engine-spec.md` error-conditions section around line 224-225**

Locate the existing error-conditions list near line 224-225 and ensure an entry covering unsafe rules is present. If the existing list reads:
```
- **Stratification failure**: cyclic negation
- **Type errors**: assertFact called with non-constant value where constants required
```

Insert a new bullet between or after them:
```
- **Unsafe rules**: `defineRule` called with a rule whose head variable is not bound by any non-negated body atom; rejected at the call (see ADR-0016)
```

- [ ] **Step 17: Amend `04-engine-spec.md` test-obligations section around lines 349-353**

Locate the list near lines 349-353:
```
- **Cyclic negation refused at `defineRule`** (outside a transaction) with a structured error.
- **Cyclic negation refused at `defineRule` inside an open transaction** at the call that introduced the cycle, not deferred to commit; the rest of the transaction remains usable; subsequent `rollback` discards buffered mutations cleanly.
- **Malformed rules rejected** at `defineRule` (head not a positive atom; body atoms with wrong shape).
- **Duplicate `ruleId` rejected** at `defineRule` with a structured error.
- **Type errors caught** at `assertFact` when arguments are non-constants.
```

Insert this bullet after the "Malformed rules rejected" line:
```
- **Unsafe rules rejected** at `defineRule` (head variable not bound by any non-negated body atom; carries `{ code: 'UNSAFE_RULE', ruleId, unboundVars }`; see ADR-0016).
```

- [ ] **Step 18: Run the full test suite one more time**

Run: `cd skills/design-large-task/engine && npx vitest run`
Expected: 87 passing, 1 skipped, 0 failing.

- [ ] **Step 19: Commit**

```bash
git add docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0016-canonical-rule-safety-check.md
git add docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md
git add skills/design-large-task/engine/RuleStore.js
git add skills/design-large-task/engine/Evaluator.js
git add skills/design-large-task/engine/Serializer.js
git add skills/design-large-task/engine/__tests__/operations.test.js
git add skills/design-large-task/engine/__tests__/evaluation.test.js
git add skills/design-large-task/engine/__tests__/failures.test.js
git commit -m "feat(engine): canonicalize D2 — rule-safety check at RuleStore.defineRule (ADR-0016)"
```

---

## Task 3: Close D3 — Existential-Quantification Negation Semantics

**Type:** docs-producing
**Implements:** AC-16.1, AC-16.2, AC-16.3
**Decision budget:** 2
**Must remain green:** all current passing tests; this task adds only documentation and a code comment.

**Files:**
- Create: `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0017-existential-quantification-negation-semantics.md`
- Modify: `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md` (around line 266 — negation-with-retraction; around line 36 — stratified negation entry)
- Modify: `skills/design-large-task/engine/Evaluator.js:23` (add single-line breadcrumb comment at the top of the `if (atom.negated)` branch in `matchBodyAtom`)

**Steps:**

- [ ] **Step 1: Write ADR-0017**

Create `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0017-existential-quantification-negation-semantics.md` following the ADR-0014 template. Required content:

- **Context** — Sprint-01's plan-prescribed `Evaluator.matchBodyAtom` negation branch used `substituteArgs(atom.args, currentBindings)` to materialize the negated atom, then unified the result against each candidate fact. For a negated body atom with unbound variables (e.g., `¬p(X, Y)` with `X` bound but `Y` unbound), the substitution produced `[boundX, undefined]`; the unifier treated `undefined` as a literal constant and failed to match any fact with a non-undefined second position. The negation incorrectly reported "no matching fact" and succeeded — even when an existentially-bound match clearly existed (e.g., `p(boundX, anyValue)`). Standard Datalog semantics require unbound variables in negated body atoms to be existentially quantified: `¬p(X, Y)` with `X` bound means "there exists no `Y` such that `p(X, Y)` holds." This is a textbook safety property.
- **Decision** — The negation branch uses unify-then-consistency-check instead of substitute-then-unify. For each candidate fact (drawn from both EDB and IDB), `unify(atom.args, factArgs)` produces fresh bindings that treat the atom's unbound variables as free (matching any value). Those fresh bindings are then checked for consistency with `currentBindings`: any variable bound in both must agree. A consistent match means the inner atom holds for some binding, so the negation fails. If no candidate fact produces a consistent match, the negation succeeds and the current bindings are forwarded.
- **Consequences (Positive)** — Negation now matches standard Datalog semantics. Programs using negated body atoms with unbound variables (e.g., `leaf(X) :- node(X), ¬ancestor(X, Y)` to compute leaves) compute correct fixed points. Tests AC-9.1 (same-generation cousins) and AC-9.4 (negation with retraction) reflect this corrected behavior.
- **Consequences (Negative)** — The implementation reads slightly more involved than the original substitute-then-unify pattern; a reader unfamiliar with Datalog NAF semantics may need to consult this ADR to understand why the negation branch differs in shape from the positive branch.
- **Consequences (Neutral)** — Programs whose negated body atoms have no unbound variables (every variable bound by an earlier positive body atom) produce the same result under both implementations.
- **Alternatives considered** — (1) Forbid unbound variables in negated body atoms — rejected because it would constrain Domain-layer rule patterns unnecessarily; existential-quantification is the textbook contract. (2) Implement via skolemization — rejected as overkill for the in-scope rule shapes.
- **What would change the decision** — Introduction of universal quantification or complex negation patterns (e.g., negation as failure under closed-world assumption with explicit witness binding) would require revisiting.
- **References** — `04-engine-spec.md §3` (semantics, post-pass-2 amendment), `04-engine-spec.md §9` (negation tests, post-pass-2 amendment); sprint-01 deferment doc D3; code: `Evaluator.js:23-43` (the negation branch).

- [ ] **Step 2: Amend `04-engine-spec.md` stratified-negation entry at line 36**

Locate line 36:
```
- **Stratified negation**: `¬p(X)` admissible in body when `p` is fully evaluated in a lower stratum
```

Change to:
```
- **Stratified negation**: `¬p(X)` admissible in body when `p` is fully evaluated in a lower stratum. Unbound variables in negated atoms are existentially quantified (see ADR-0017): `¬p(X, Y)` with `X` bound holds for the current binding of `X` if and only if there is no value of `Y` such that `p(X, Y)` is derivable.
```

- [ ] **Step 3: Amend `04-engine-spec.md` negation-with-retraction line around line 266**

Locate line 266:
```
- **Negation interacting with retraction**: retracting a positive fact that supported a negation literal causes dependent derivations to update on next `derive`.
```

Append a sentence:
```
- **Negation interacting with retraction**: retracting a positive fact that supported a negation literal causes dependent derivations to update on next `derive`. Negated body atoms with unbound variables are existentially quantified (see ADR-0017); the evaluator's matchBodyAtom negation branch uses unify-then-consistency-check on each candidate fact.
```

- [ ] **Step 4: Add breadcrumb comment at the negation branch in Evaluator.js**

Open `skills/design-large-task/engine/Evaluator.js`. Locate the `matchBodyAtom` function and its `if (atom.negated)` branch around line 23.

Current state at line 23:
```js
  if (atom.negated) {
    // Negation-as-failure with existential quantification of unbound atom variables.
    // Unify the original atom pattern (which may contain still-unbound variables)
    // against each fact and require consistency with currentBindings — any consistent
    // match means the inner atom holds for some binding, so the negation fails.
```

The existing multi-line comment at lines 24-27 explains the semantics but does not reference the ADR. Replace those four lines (24-27) with a single-line ADR breadcrumb (the multi-line rationale is moved to the ADR, per the brief's anti-drift rule for breadcrumbs):

```js
  if (atom.negated) {
    // ADR-0017: unbound atom vars are existentially quantified
```

Verify the rest of the negation branch (lines 28 onward in the new numbering) is unchanged.

- [ ] **Step 5: Run the full test suite**

Run: `cd skills/design-large-task/engine && npx vitest run`
Expected: all green, same counts as after Task 2.

- [ ] **Step 6: Verify breadcrumb is present and unique**

Run: `grep -n "ADR-0017" skills/design-large-task/engine/Evaluator.js`
Expected: exactly one match at the top of the `if (atom.negated)` branch.

- [ ] **Step 7: Commit**

```bash
git add docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0017-existential-quantification-negation-semantics.md
git add docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md
git add skills/design-large-task/engine/Evaluator.js
git commit -m "docs(engine): canonicalize D3 — existential-quantification negation semantics (ADR-0017)"
```

---

## Task 4: Close D4 — Atomic loadFrom

**Type:** docs-producing
**Implements:** AC-17.1, AC-17.2, AC-17.3
**Decision budget:** 2
**Must remain green:** all current passing tests; this task adds only documentation and a code comment.

**Files:**
- Create: `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0018-atomic-load-from.md`
- Modify: `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md` (around lines 314, 356 — `loadFrom` atomicity)
- Modify: `skills/design-large-task/engine/Serializer.js:45` (add single-line breadcrumb comment at the `engine.snapshot()` line of `loadEngineFrom`)

**Steps:**

- [ ] **Step 1: Write ADR-0018**

Create `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0018-atomic-load-from.md` (kebab-case slug, no " copy" suffix). Required content:

- **Context** — Sprint-01's plan-prescribed `loadEngineFrom` validated schema shallowly, called `engine.clear()`, then replayed facts via `assertFact` and rules via `defineRule`. If a replay step threw mid-flight — `TYPE_ERROR` on an invalid fact arg; `MALFORMED_RULE`, `DUPLICATE_RULE_ID`, `CYCLIC_NEGATION`, or `UNSAFE_RULE` on a rule — the engine was left in a partially-loaded state. AC-7.3's atomicity contract was therefore honored only for shallow-schema failures, not mid-replay failures. The Task-10 snapshot/restore primitives make this trivially fixable.
- **Decision** — `loadEngineFrom` wraps the clear-and-replay sequence in `engine.snapshot()` before `clear()` and `engine.restore(rollback)` on any thrown exception during replay. The rethrow is preserved. AC-7.3's contract is now: regardless of where in the replay the failure occurs, no partial-load state is observable on any subsequent public API call.
- **Consequences (Positive)** — The atomicity contract is unconditional. A new lifecycle test (added during sprint-01) constructs a tampered serialized payload with NaN in a fact arg, asserts the throw, and verifies prior engine state (facts AND rules) is preserved.
- **Consequences (Negative)** — `loadEngineFrom` now allocates a full snapshot before clearing, adding O(state-size) memory and time overhead to every load call regardless of whether replay will succeed. For large EDBs this is a real cost; not significant for current workloads.
- **Consequences (Neutral)** — The snapshot/restore primitives reused here are the same primitives used by transactions, validating that the Engine's lifecycle factoring was sound.
- **Alternatives considered** — (1) Stage replays into a TransactionBuffer before committing — rejected because the snapshot-rollback strategy was already established for transactions; reusing it kept the engine's primitive set small. (2) Document the gap and defer — rejected because AC-7.3 is part of the port contract; sprint-02's Domain layer will rely on it.
- **What would change the decision** — A future cost-conscious caller that wants to opt out of atomicity for very large loads might motivate a `loadFromUnsafe(...)` variant. Not in scope.
- **References** — `04-engine-spec.md` §`loadFrom` (post-pass-2 amendment); sprint-01 deferment doc D4; code: `Serializer.js:37-54`.

- [ ] **Step 2: Amend `04-engine-spec.md` loadFrom-malformed-input line around 314**

Locate line 314:
```
- **`loadFrom` on malformed input**: rejects with a structured error; does not partially-load.
```

Change to:
```
- **`loadFrom` on malformed input or mid-replay failure**: rejects with a structured error (`MALFORMED_SERIALIZED_INPUT` for shallow-schema failure; the underlying replay error for mid-replay failure); does not partially-load (see ADR-0018). The implementation wraps the replay in a snapshot/restore pair so prior engine state is restored on any throw.
```

- [ ] **Step 3: Amend `04-engine-spec.md` malformed-serialized-input line around 356**

Locate line 356:
```
- **Malformed serialized input rejected** at `loadFrom` with a structured error and no partial-load side effects.
```

Change to:
```
- **Malformed serialized input rejected** at `loadFrom` with a structured error and no partial-load side effects. **Mid-replay failures** (a malformed fact triggering `TYPE_ERROR`; a malformed/cyclic/duplicate/unsafe rule triggering its respective error) likewise produce no partial-load side effects — the engine state is restored via the snapshot/restore wrap (see ADR-0018).
```

- [ ] **Step 4: Add breadcrumb comment at the snapshot/restore wrap in Serializer.js**

Open `skills/design-large-task/engine/Serializer.js`. Locate `loadEngineFrom` around line 37-54. The current state around lines 41-45 is:

```js
  // Atomic-load contract (spec AC-7.3): if any replay step throws (TYPE_ERROR on
  // an invalid fact arg, MALFORMED_RULE / DUPLICATE_RULE_ID / CYCLIC_NEGATION /
  // UNSAFE_RULE on a rule), the engine must be restored to its prior
  // state. Take a snapshot before clear, restore on any replay exception.
  const rollback = engine.snapshot();
```

Insert the breadcrumb on a new line **immediately above `const rollback = engine.snapshot();`** (i.e., between the existing four-line atomic-load contract comment and the `const rollback` line). The existing comment stays in place above the breadcrumb. Result:

```js
  // Atomic-load contract (spec AC-7.3): if any replay step throws (TYPE_ERROR on
  // an invalid fact arg, MALFORMED_RULE / DUPLICATE_RULE_ID / CYCLIC_NEGATION /
  // UNSAFE_RULE on a rule), the engine must be restored to its prior
  // state. Take a snapshot before clear, restore on any replay exception.
  // ADR-0018: mid-replay failure leaves partial-load state
  const rollback = engine.snapshot();
```

The contract comment describes WHAT the code does (kept verbatim). The new single-line breadcrumb is the LAST line before `const rollback` and cross-references the ADR for the WHY.

- [ ] **Step 5: Run the full test suite**

Run: `cd skills/design-large-task/engine && npx vitest run`
Expected: all green, same counts as after Task 3.

- [ ] **Step 6: Verify ADR-0018 breadcrumb is present and unique in Serializer.js**

Run: `grep -n "ADR-0018" skills/design-large-task/engine/Serializer.js`
Expected: exactly one match at the snapshot/restore wrap in `loadEngineFrom`.

- [ ] **Step 7: Commit**

```bash
git add docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0018-atomic-load-from.md
git add docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md
git add skills/design-large-task/engine/Serializer.js
git commit -m "docs(engine): canonicalize D4 — atomic loadFrom (ADR-0018)"
```

---

## Task 5: D5 Visibility — Engine-Tier Open-Questions Document

**Type:** docs-producing
**Implements:** AC-18.1
**Decision budget:** 3
**Must remain green:** all current passing tests; this task does not touch code or tests.

**Files:**
- Create: `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md`

**Steps:**

- [ ] **Step 1: Write the open-questions document**

Create `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md` with this content:

```markdown
# Engine-Tier Open Architectural Questions

This document tracks open architectural questions about the engine tier that have been identified but not yet resolved. Each entry names the question, why it matters, what is known about the resolution path, the channel by which it will be closed, and the date the question was opened.

The cascade's architectural decision records (ADRs) are for decisions made; this document is for decisions pending. When an entry closes, the resolution lives in a new ADR and the entry is removed from this document.

---

## OQ-1 — Evaluator IDB Indexing Architecture (D5)

**Date opened:** 2026-05-12
**Closure channel:** sprint-01-proof-backend-pass-3 (a focused design-large-task pass on Evaluator indexing architecture)

### Problem shape

The Evaluator's `matchBodyAtom` performs a full linear scan over `derived.values()` per body atom per iteration of semi-naive evaluation. For recursive transitive-closure-shaped workloads (e.g., `ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y)`), every derived fact has the same predicate, so any per-predicate bucketing provides zero discrimination. The FactStore already has a per-position positional index for the EDB side; the IDB has no equivalent, and the Evaluator's join paths do not exploit the EDB index either.

### Why it matters now

- AC-11.2 (the 1000-element transitive-closure stress test) is currently marked `it.skip` because deep recursion does not complete within the test budget under the current Evaluator. At N=100 the same workload takes ~9 seconds; at N=1000 the runtime is extrapolated to several hours. The skipped test is sprint-01's promise to address this.
- The Domain layer (sprint-02-proof-layer) will generate rules programmatically and will exercise non-trivial join shapes. Designing the indexing architecture before observing the Domain's actual workload patterns risks under- or over-fitting.

### What is known about the resolution

The sprint-01 deferment doc (D5 entry) sketches the architectural fix: replace the IDB's `Map<factKey, fact>` with `derivedPositionalIndex: Map<predKey, Array<Map<value, Set<factKey>>>>` — mirroring `FactStore._positionalIndex` exactly. `matchBodyAtom` then performs bound-position lookup with bucket intersection on both the EDB side (via `factStore.factsMatching`) and the IDB side (via the new index). Estimated size: ~85 lines across `Evaluator.js`. Medium correctness risk on the negation branch (D3's existential-quantification semantics must continue to hold under the new lookup path) and on the intersection logic for repeated variables.

A partial fix (per-predicate index only) was attempted during sprint-01 Task 15 and reverted — it provided zero discrimination for the transitive-closure workload because all derived facts share one predicate.

### Closure channel

Sprint-01-proof-backend-pass-3 will run a fresh `design-large-task` pass on Evaluator indexing architecture, informed by sprint-02's Domain-layer workload patterns where possible. The pass-3 sprint's brief should inherit the full sprint-01 deferment doc D5 entry as the architectural context.

### Acceptance for closure

When the pass-3 sprint completes, this entry is removed from `engine-open-questions.md` and the resolution is recorded in a new ADR (`0019-...` or later). AC-11.2 is unskipped and passes within the test budget. The 100-element termination test (`properties.test.js`) is tightened back to its original 5000ms bound and passes.
```

- [ ] **Step 2: Verify the file exists with the required fields**

Run: `grep -E "^(### |Closure channel|Date opened)" docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md`
Expected: section headers for problem shape, why-it-matters-now, what-is-known, closure channel, acceptance for closure; plus the date-opened field; plus the explicit `Closure channel: sprint-01-proof-backend-pass-3` mention.

- [ ] **Step 3: Commit**

```bash
git add docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md
git commit -m "docs(engine): track D5 as engine-tier open question with pass-3 as closure channel"
```

---

## Task 6: Verification — Full Test Suite and Sprint-01 Folder Integrity

**Type:** config-producing
**Implements:** AC-18.2, AC-18.3
**Decision budget:** 1
**Must remain green:** all current passing tests; this task is a verification gate, not a code change.

**Files:**
- (none modified)

**Steps:**

- [ ] **Step 1: Run the full engine test suite**

Run: `cd skills/design-large-task/engine && npx vitest run`
Expected output:
- 0 failing
- 1 skipped (AC-11.2)
- 87 passing
- 11 test files

If anything fails or the skipped count is not exactly 1, stop and investigate.

- [ ] **Step 2: Verify UNBOUND_HEAD_VARIABLE is fully gone**

Run: `grep -rn "UNBOUND_HEAD_VARIABLE" skills/design-large-task/engine/`
Expected: zero matches across all source and test files.

- [ ] **Step 3: Verify UNSAFE_RULE is present at expected sites**

Run: `grep -rn "UNSAFE_RULE" skills/design-large-task/engine/`
Expected: matches in:
- `RuleStore.js` — at least one (the throw)
- `Serializer.js` — at least one (in the atomic-load contract comment)
- `__tests__/operations.test.js` — at least one (the new combined test)
- `__tests__/failures.test.js` — at least one (the catalog test)

No other locations.

- [ ] **Step 4: Verify all four ADRs exist with the expected slugs**

Run: `ls docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0015* docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0016* docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0017* docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/0018*`
Expected: exactly four files listed, with filenames `0015-finite-constant-constraint.md`, `0016-canonical-rule-safety-check.md`, `0017-existential-quantification-negation-semantics.md`, `0018-atomic-load-from.md` (no " copy" suffix on any of them).

- [ ] **Step 5: Verify all four breadcrumb comments exist**

Run: `grep -rn "ADR-001[5-8]" skills/design-large-task/engine/`
Expected output (counts):
- One match for `ADR-0015` in `FactStore.js`
- One match for `ADR-0016` in `RuleStore.js`
- One match for `ADR-0017` in `Evaluator.js`
- One match for `ADR-0018` in `Serializer.js`

No matches in any test file.

- [ ] **Step 6: Verify open-questions document exists**

Run: `ls docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md`
Expected: file listed.

Run: `grep "sprint-01-proof-backend-pass-3" docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/engine-open-questions.md`
Expected: at least one match (the closure-channel reference).

- [ ] **Step 7: Verify sprint-01 folder is untouched**

Run: `git diff main -- 'docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/'`
Expected: empty output.

Run: `git status -- 'docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/'`
Expected: empty output (no modifications, no untracked files, no deletions).

- [ ] **Step 8: Commit (verification record)**

If everything is green, no file changes are made in this task, so no commit is needed. If a file change was needed to fix a discrepancy found during verification, commit it under a `chore(engine):` prefix with a message describing what was reconciled. Otherwise this task closes without a commit, and execute-write records the verification as the task's completion signal.

<!-- created-at: 2026-05-12T10:59:57Z -->
<!-- produced-by plan-build@v0004 -->
