# Plan: Sprint-01 Proof Backend Pass-4 (Engine Public API Alignment)

**Sprint:** `20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4`
**Spec:** `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/spec/sprint-01-proof-backend-pass-4-spec-01.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Bring `skills/design-large-task/engine/` public API into literal compliance with `04-engine-spec.md` §4 — change `Engine.defineRule(rule)` (1-arg object) to `Engine.defineRule(ruleId, headAtom, bodyAtoms, metadata)` (4-arg tuple-format), change `Engine.explain(predicate, args)` (2-arg) to `Engine.explain(fact)` (1-arg tuple), and switch the serialization format to match the public tuple shape (with `version` bumped to `2`).

## Architecture

Hybrid: extracted `RuleAtomTranslator.js` module owns tuple↔object translation shared between `Engine.js` and `Serializer.js`. Internal data structures (RuleStore, Unifier, Stratifier, Evaluator, Explain, Snapshot, FactStore) unchanged. Test migration uses a temporary `defineRuleObj` helper for the 10 well-formed test files; failure-mode tests in `failures.test.js` migrate directly to tuple form (bypassing the helper since it would crash on intentionally-malformed input).

## Tech Stack

- **Language:** JavaScript ES modules (existing engine convention).
- **Test runner:** vitest (existing engine convention).
- **Working directory:** `/home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-01-proof-backend-pass-4/skills/design-large-task/engine/`.
- **Baseline:** 107 tests across 14 files, all green (verified at sprint start).

---

## Task 1: RuleAtomTranslator module + isolated unit tests

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2 (partial), AC-4.1, AC-4.2, AC-4.2a (partial), AC-4.3
**Decision budget:** 2 (negation atom shape edge cases; null/undefined handling)
**Must remain green:** `RuleAtomTranslator.test.js` (this task creates it); all 107 baseline engine tests (none affected — translator is a new isolated module not yet wired into Engine).

**Files:**
- Create: `skills/design-large-task/engine/RuleAtomTranslator.js`
- Create: `skills/design-large-task/engine/__tests__/RuleAtomTranslator.test.js`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `skills/design-large-task/engine/__tests__/RuleAtomTranslator.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import {
  tupleAtomToInternal,
  tupleRuleToInternal,
  internalRuleToTuple,
} from '../RuleAtomTranslator.js';

describe('RuleAtomTranslator', () => {
  describe('tupleAtomToInternal — positive atoms', () => {
    it('converts uppercase string to {var} variable', () => {
      const r = tupleAtomToInternal(['p', ['X']]);
      expect(r).toEqual({ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: false });
    });
    it('passes wildcard through unchanged', () => {
      const r = tupleAtomToInternal(['p', ['_']]);
      expect(r).toEqual({ predicate: 'p', arity: 1, args: ['_'], negated: false });
    });
    it('passes ground constants through unchanged (string, number, underscore-prefixed)', () => {
      const r = tupleAtomToInternal(['p', ['hello', 42, '_foo']]);
      expect(r.args).toEqual(['hello', 42, '_foo']);
    });
    it('computes arity from args length', () => {
      expect(tupleAtomToInternal(['p', []]).arity).toBe(0);
      expect(tupleAtomToInternal(['p', ['a', 'b', 'c']]).arity).toBe(3);
    });
  });

  describe('tupleAtomToInternal — negation wrapper', () => {
    it('unwraps ["not", atom] and sets negated:true', () => {
      const r = tupleAtomToInternal(['not', ['p', ['X']]]);
      expect(r).toEqual({ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: true });
    });
    it('rejects doubly-nested negation as MALFORMED_RULE', () => {
      expect(() => tupleAtomToInternal(['not', ['not', ['p', ['X']]]])).toThrow(
        expect.objectContaining({ code: 'MALFORMED_RULE' })
      );
    });
  });

  describe('tupleAtomToInternal — malformed input', () => {
    it.each([
      ['non-array atom', 'not-an-array'],
      ['non-string predicate', [42, []]],
      ['null in args', ['p', [null]]],
      ['undefined in args', ['p', [undefined]]],
      ['non-array args', ['p', 'not-args']],
    ])('throws MALFORMED_RULE: %s', (_, bad) => {
      expect(() => tupleAtomToInternal(bad)).toThrow(
        expect.objectContaining({ code: 'MALFORMED_RULE', stage: 'translator' })
      );
    });
  });

  describe('tupleRuleToInternal', () => {
    it('translates a full rule with mixed atom kinds', () => {
      const r = tupleRuleToInternal(
        'r1',
        ['p', ['X']],
        [['q', ['X']], ['not', ['r', ['X']]]],
        { source: 'test' }
      );
      expect(r.ruleId).toBe('r1');
      expect(r.head).toEqual({ predicate: 'p', arity: 1, args: [{ var: 'X' }] });
      expect(r.body).toHaveLength(2);
      expect(r.body[0].negated).toBe(false);
      expect(r.body[1].negated).toBe(true);
      expect(r.metadata).toEqual({ source: 'test' });
    });

    it('head atom carries no negated field', () => {
      const r = tupleRuleToInternal('r1', ['p', ['X']], [['q', ['X']]], {});
      expect('negated' in r.head).toBe(false);
    });

    it('rejects ["not", ...] as head with MALFORMED_RULE', () => {
      expect(() => tupleRuleToInternal('r1', ['not', ['p', ['X']]], [['q', ['X']]], {})).toThrow(
        expect.objectContaining({ code: 'MALFORMED_RULE', stage: 'translator', field: 'head' })
      );
    });

    it('preserves metadata reference', () => {
      const meta = { kind: 'inference' };
      const r = tupleRuleToInternal('r1', ['p', ['X']], [['q', ['X']]], meta);
      expect(r.metadata).toBe(meta);
    });
  });

  describe('internalRuleToTuple', () => {
    it('returns tuple form with bare uppercase variables, ["not"] wrapper for negated', () => {
      const internal = {
        ruleId: 'r1',
        head: { predicate: 'p', arity: 1, args: [{ var: 'X' }] },
        body: [
          { predicate: 'q', arity: 1, args: [{ var: 'X' }], negated: false },
          { predicate: 'r', arity: 1, args: [{ var: 'X' }], negated: true },
        ],
        metadata: { source: 'test' },
      };
      const tuple = internalRuleToTuple(internal);
      expect(tuple).toEqual({
        ruleId: 'r1',
        headAtom: ['p', ['X']],
        bodyAtoms: [['q', ['X']], ['not', ['r', ['X']]]],
        metadata: { source: 'test' },
      });
    });
  });

  describe('round-trip fidelity', () => {
    it('internalRuleToTuple ∘ tupleRuleToInternal is identity for valid rules', () => {
      const original = {
        ruleId: 'r1',
        headAtom: ['p', ['X', 'Y']],
        bodyAtoms: [['q', ['X', '_']], ['not', ['r', ['Y']]]],
        metadata: { source: 'test' },
      };
      const internal = tupleRuleToInternal(
        original.ruleId, original.headAtom, original.bodyAtoms, original.metadata
      );
      const roundTripped = internalRuleToTuple(internal);
      expect(roundTripped).toEqual(original);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
Run from `skills/design-large-task/engine/`: `npx vitest run RuleAtomTranslator`
Expected: FAIL — module not found.
```

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/engine/RuleAtomTranslator.js`:

```javascript
/**
 * RuleAtomTranslator — single source of truth for tuple ↔ internal-object atom
 * translation. Used at the engine class boundary (Engine.js) and at the serializer
 * boundary (Serializer.js). Internal modules (RuleStore, Unifier, Stratifier, etc.)
 * continue to consume internal-object form unchanged.
 *
 * Public tuple form (per 04-engine-spec.md §6.2):
 *   atom = [predicate: string, args: Array<string | number>]
 *   negated body atom = ['not', atom]
 *   variable = bare uppercase string ('X', 'NAME')
 *   wildcard = literal '_' string
 *
 * Internal object form (per RuleStore.js):
 *   atom = { predicate, arity, args: Array<constant | {var} | '_'>, negated? }
 *   head atom omits `negated` (heads cannot be negated)
 */

function malformed(field, message) {
  return Object.assign(new Error(`MALFORMED_RULE: ${message}`), {
    code: 'MALFORMED_RULE',
    stage: 'translator',
    field,
    message,
  });
}

const isUppercaseVar = (s) => typeof s === 'string' && /^[A-Z][A-Z0-9_]*$/.test(s);

function translateArg(a) {
  if (a === null || a === undefined) throw malformed('args', 'null or undefined arg value');
  if (a === '_') return '_';
  if (isUppercaseVar(a)) return { var: a };
  return a;
}

function translateAtomShape(atom) {
  // atom must be [predicate: string, args: array]
  if (!Array.isArray(atom)) throw malformed('atom', 'atom must be an array');
  if (atom.length !== 2) throw malformed('atom', 'atom must be [predicate, args]');
  const [predicate, args] = atom;
  if (typeof predicate !== 'string') throw malformed('atom.predicate', 'predicate must be a string');
  if (!Array.isArray(args)) throw malformed('atom.args', 'args must be an array');
  return { predicate, arity: args.length, args: args.map(translateArg) };
}

export function tupleAtomToInternal(atom) {
  if (Array.isArray(atom) && atom[0] === 'not') {
    if (atom.length !== 2) throw malformed('atom', '["not", ...] must have exactly one inner atom');
    const inner = atom[1];
    if (Array.isArray(inner) && inner[0] === 'not') {
      throw malformed('atom', 'double negation ["not", ["not", ...]] is not supported');
    }
    const translated = translateAtomShape(inner);
    return { ...translated, negated: true };
  }
  const translated = translateAtomShape(atom);
  return { ...translated, negated: false };
}

export function tupleRuleToInternal(ruleId, headAtom, bodyAtoms, metadata) {
  if (typeof ruleId !== 'string') throw malformed('ruleId', 'ruleId must be a string');
  if (Array.isArray(headAtom) && headAtom[0] === 'not') {
    throw malformed('head', 'head atom cannot be ["not", ...]; heads are always positive');
  }
  const headInternal = translateAtomShape(headAtom);
  if (!Array.isArray(bodyAtoms)) throw malformed('bodyAtoms', 'bodyAtoms must be an array');
  const bodyInternal = bodyAtoms.map(tupleAtomToInternal);
  return {
    ruleId,
    head: headInternal, // no negated field on head
    body: bodyInternal,
    metadata: metadata ?? {},
  };
}

function untranslateArg(a) {
  if (a && typeof a === 'object' && typeof a.var === 'string') return a.var;
  return a;
}

function untranslateAtom(atom) {
  return [atom.predicate, atom.args.map(untranslateArg)];
}

export function internalRuleToTuple(rule) {
  return {
    ruleId: rule.ruleId,
    headAtom: untranslateAtom(rule.head),
    bodyAtoms: rule.body.map((b) => {
      const tuple = untranslateAtom(b);
      return b.negated ? ['not', tuple] : tuple;
    }),
    metadata: rule.metadata ?? {},
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```
Run: `npx vitest run RuleAtomTranslator`
Expected: PASS — all translator tests green. Engine baseline (107 tests) still green.
```

Then run the full suite: `npx vitest run` — Expected: 107 + N translator tests, all green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/RuleAtomTranslator.js skills/design-large-task/engine/__tests__/RuleAtomTranslator.test.js
git commit -m "feat(engine): RuleAtomTranslator with tuple↔object translation"
```

---

## Task 2: Engine.js — defineRule + explain signature changes

**Type:** code-producing
**Implements:** AC-2.1, AC-2.2, AC-3.1, AC-3.2, AC-6.1, AC-6.2, AC-6.3, AC-7.1, AC-7.2
**Decision budget:** 2 (helper integration order; preserving error-code semantics through the translator)
**Must remain green:** all `RuleAtomTranslator.test.js` tests; integration tests covering Engine that currently pass with old signatures break at this commit and re-pass after Task 3's helper wrapping in Task 5 (per the incremental migration strategy). Specifically: the test files listed in Task 5 will RED at this commit; that's the expected gate.

**Files:**
- Modify: `skills/design-large-task/engine/Engine.js:32` (`defineRule`), `:45` (`explain`)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

This task's primary tests are the existing `defineRule` / `explain` integration tests in `failures.test.js`, `query.test.js`, `lifecycle.test.js`, etc. They currently pass with the old signature. After this task, they FAIL until Task 4 wraps them through the helper (or migrates directly for failure tests).

To anchor the new contract, add a dedicated regression test that exercises the new signature directly. Create `skills/design-large-task/engine/__tests__/engine-public-api.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';

describe('Engine public API — new signatures', () => {
  it('defineRule(ruleId, headAtom, bodyAtoms, metadata) accepts tuple form', () => {
    const e = new Engine();
    e.defineRule('r1', ['p', ['X']], [['q', ['X']]], { source: 'test' });
    expect(e.getRule('r1')).toBeDefined();
  });

  it('defineRule throws MALFORMED_RULE on non-array headAtom', () => {
    const e = new Engine();
    expect(() => e.defineRule('r1', 'not-an-array', [], {})).toThrow(
      expect.objectContaining({ code: 'MALFORMED_RULE', stage: 'translator' })
    );
  });

  it('explain(fact) accepts tuple form and returns derivation tree', () => {
    const e = new Engine();
    e.defineRule('parent_to_ancestor', ['ancestor', ['X', 'Y']], [['parent', ['X', 'Y']]], {});
    e.assertFact('parent', ['a', 'b']);
    e.derive();
    const tree = e.explain(['ancestor', ['a', 'b']]);
    expect(tree).not.toBeNull();
  });

  it('explain returns null for absent facts', () => {
    const e = new Engine();
    expect(e.explain(['nope', ['x', 'y']])).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
Run: `npx vitest run engine-public-api`
Expected: FAIL — tests pass tuple form; Engine still has 1-arg defineRule, so internal validation throws MALFORMED_RULE for the wrong reason (or the rule passes by accident if the literal happens to look object-shaped).
```

- [ ] **Step 3: Write minimal implementation**

Edit `skills/design-large-task/engine/Engine.js`. At the imports section (top), add:

```javascript
import { tupleRuleToInternal } from './RuleAtomTranslator.js';
```

Replace line 32 (`defineRule(rule) { this._rules.defineRule(rule); this._markDirty(); }`) with:

```javascript
  // §4.2 rule ops — public surface accepts tuple-format atoms (04-engine-spec.md §4.2 + §6.2)
  defineRule(ruleId, headAtom, bodyAtoms, metadata) {
    const internalRule = tupleRuleToInternal(ruleId, headAtom, bodyAtoms, metadata);
    this._rules.defineRule(internalRule);
    this._markDirty();
  }
```

Replace line 45 (`explain(predicate, args) { ... }`) with:

```javascript
  // §4.5 explain — public surface accepts [predicate, args] tuple (04-engine-spec.md §4.5)
  explain(fact) {
    this._ensureDerived();
    if (!Array.isArray(fact) || fact.length !== 2) return null;
    const [predicate, args] = fact;
    return explainFact(predicate, args, this._derived, this._rules, this._facts);
  }
```

- [ ] **Step 4: Run test to verify it passes**

```
Run: `npx vitest run engine-public-api`
Expected: PASS — 4 tests green.

Run: `npx vitest run` — full suite
Expected: 107 baseline tests now mostly RED (callsites use old signatures). Translator tests + engine-public-api tests green. RuleAtomTranslator green. RED suite is the expected intermediate state; Task 4 wraps callers through the helper.
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Engine.js skills/design-large-task/engine/__tests__/engine-public-api.test.js
git commit -m "feat(engine): defineRule + explain public signatures match spec §4.2 + §4.5"
```

---

## Task 3: Serializer.js — version 2 + tuple format + new defineRule call

**Type:** code-producing
**Implements:** AC-5.1, AC-5.2, AC-5.3
**Decision budget:** 2 (isValidSerialized shape rules; rejection vs. error semantics for version mismatch)
**Must remain green:** `RuleAtomTranslator.test.js`, `engine-public-api.test.js`. The serialization round-trip test in `lifecycle.test.js` is one of the tests that will RED until its callsite migrates in Task 5; that's expected.

**Files:**
- Modify: `skills/design-large-task/engine/Serializer.js:25` (version literal), `:28-35` (`isValidSerialized`), `:50` (`loadEngineFrom` defineRule call). Add import for translator.

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `engine-public-api.test.js` (or create `__tests__/serializer-version.test.js`):

```javascript
import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';

describe('Serializer schema version 2', () => {
  it('serializeEngine emits version: 2', () => {
    const e = new Engine();
    e.defineRule('r1', ['p', ['X']], [['q', ['X']]], { src: 'test' });
    const out = e.serialize();
    expect(out.version).toBe(2);
  });

  it('loadFrom rejects version 1 blob with MALFORMED_SERIALIZED_INPUT', () => {
    const e = new Engine();
    const oldBlob = { version: 1, facts: [], rules: [] };
    expect(() => e.loadFrom(oldBlob)).toThrow(
      expect.objectContaining({ code: 'MALFORMED_SERIALIZED_INPUT', actualVersion: 1 })
    );
  });

  it('serialized rules contain tuple-form atoms with ["not"] wrapper', () => {
    const e = new Engine();
    e.defineRule('r1', ['p', ['X']], [['q', ['X']], ['not', ['r', ['X']]]], {});
    const out = e.serialize();
    expect(out.rules).toHaveLength(1);
    expect(out.rules[0].headAtom).toEqual(['p', ['X']]);
    expect(out.rules[0].bodyAtoms).toEqual([['q', ['X']], ['not', ['r', ['X']]]]);
  });

  it('round-trip: serialize then loadFrom in fresh engine produces equivalent rule set', () => {
    const e1 = new Engine();
    e1.defineRule('r1', ['p', ['X']], [['q', ['X']]], { src: 'rt' });
    e1.assertFact('q', ['a']);
    const blob = e1.serialize();
    const e2 = new Engine();
    e2.loadFrom(blob);
    expect(e2.getRule('r1')).toBeDefined();
    expect(e2.exists(['p', ['a']])).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
Run: `npx vitest run serializer-version` (or grep `Serializer schema version 2`)
Expected: FAIL — `version` is 1, not 2; old loader path uses `engine.defineRule(r)` 1-arg form which now MALFORMED_RULE-throws since Engine.defineRule expects 4 positional args.
```

- [ ] **Step 3: Write minimal implementation**

Edit `skills/design-large-task/engine/Serializer.js`. At the top, add:

```javascript
import { internalRuleToTuple } from './RuleAtomTranslator.js';
```

Replace line 25 (`return { version: 1, facts: factsOut, rules: rulesOut };`) with:

```javascript
  // Schema version 2: rules are emitted in tuple form (matches Engine.defineRule public surface)
  return { version: 2, facts: factsOut, rules: rulesOut.map(internalRuleToTuple) };
```

Replace lines 28-35 (`function isValidSerialized(s) { ... }`) with:

```javascript
function isValidSerialized(s) {
  return s && typeof s === 'object'
    && typeof s.version === 'number'
    && Array.isArray(s.facts)
    && Array.isArray(s.rules)
    && s.facts.every(f => f && typeof f.predicate === 'string' && Array.isArray(f.args))
    && s.rules.every(r => r && typeof r.ruleId === 'string' && Array.isArray(r.headAtom) && Array.isArray(r.bodyAtoms));
}
```

Replace line 50 (`for (const r of serialized.rules) engine.defineRule(r);`) with:

```javascript
  for (const r of serialized.rules) engine.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, r.metadata ?? {});
```

Insert version check immediately after the `isValidSerialized` check at line 39 (inside `loadEngineFrom`):

```javascript
  if (serialized.version !== 2) {
    throw {
      code: 'MALFORMED_SERIALIZED_INPUT',
      message: `unsupported schema version: ${serialized.version}; expected 2`,
      actualVersion: serialized.version,
    };
  }
```

- [ ] **Step 4: Run test to verify it passes**

```
Run: `npx vitest run serializer-version`
Expected: PASS — 4 serializer tests green.

Run: `npx vitest run RuleAtomTranslator engine-public-api`
Expected: PASS — no regressions.
```

The wider suite (107 baseline) still has many RED tests at this point — expected and addressed in Tasks 4-5.

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/Serializer.js skills/design-large-task/engine/__tests__/engine-public-api.test.js
git commit -m "feat(engine): Serializer schema version 2 + tuple-form rule output"
```

---

## Task 4: Test migration helper + direct migration of failure-mode tests

**Type:** code-producing
**Implements:** AC-8.0, AC-8.1
**Decision budget:** 3 (helper handles object-shape literals robustly; failure tests need direct migration to assert error codes against the new API; metadata pass-through semantics)
**Must remain green:** `RuleAtomTranslator.test.js`, `engine-public-api.test.js`, `serializer-version` tests, **all migrated `failures.test.js` cases** (UNSAFE_RULE, MALFORMED_RULE, DUPLICATE_RULE_ID).

**Files:**
- Create: `skills/design-large-task/engine/__tests__/helpers/defineRuleObj.js`
- Modify: `skills/design-large-task/engine/__tests__/failures.test.js` — direct tuple-form migration; 5 callsites.

**Steps (TDD):**

- [ ] **Step 1: Write the helper**

Create `skills/design-large-task/engine/__tests__/helpers/defineRuleObj.js`:

```javascript
/**
 * Test-only migration helper. Wraps the new 4-arg Engine.defineRule with a 1-arg
 * facade that accepts internal-object-shape rule literals (as tests had them
 * during pass-3) and translates them down to the new tuple form before calling.
 *
 * TEMPORARY: deleted in the cleanup commit (Task 6) once all 10 well-formed
 * test files have migrated to direct tuple-form calls.
 *
 * Failure-mode tests (failures.test.js) MUST NOT use this helper — see AC-8.0.
 * The inverse translation crashes on intentionally-malformed input before
 * reaching the public API; failure tests reach the public API directly.
 */

function atomToTuple(atom) {
  if (!atom || typeof atom !== 'object') return atom; // pass-through; will fail Engine validation
  const args = (atom.args ?? []).map((a) => {
    if (a && typeof a === 'object' && typeof a.var === 'string') return a.var;
    return a;
  });
  return [atom.predicate, args];
}

function bodyAtomToTuple(b) {
  const t = atomToTuple(b);
  return b && b.negated ? ['not', t] : t;
}

export function defineRuleObj(target, ruleObj) {
  const head = atomToTuple(ruleObj.head);
  const body = (ruleObj.body ?? []).map(bodyAtomToTuple);
  return target.defineRule(ruleObj.ruleId, head, body, ruleObj.metadata ?? {});
}

export function explainTuple(engine, predicate, args) {
  return engine.explain([predicate, args]);
}
```

- [ ] **Step 2: Migrate `failures.test.js` directly to tuple form**

Open `skills/design-large-task/engine/__tests__/failures.test.js`. Replace each `e.defineRule({...})` call with a direct tuple-form `e.defineRule(...)` call. **6 callsites at lines 8, 15, 23, 40, 41, 77** (5 distinct rule definitions; lines 40 and 41 reuse the same rule literal for the DUPLICATE_RULE_ID assertion).

Replace `import { V } from '../Unifier.js';` at line 3 — it is no longer used after migration.

**Line 8 — MALFORMED_RULE test** (non-atom head):
```javascript
// Before:
expect(() => e.defineRule({ ruleId: 'r', head: 'bad', body: [] })).toThrow(
  expect.objectContaining({ code: 'MALFORMED_RULE' })
);
// After:
expect(() => e.defineRule('r', 'bad', [], {})).toThrow(
  expect.objectContaining({ code: 'MALFORMED_RULE' })
);
```

**Lines 15 + 23 — CYCLIC_NEGATION test** (two related defineRule calls; r1 is well-formed setup, r2 creates the negation cycle and is expected to throw):
```javascript
// Before:
e.defineRule({
  ruleId: 'r1',
  head: { predicate: 'p', arity: 1, args: [V('X')] },
  body: [
    { predicate: 'base', arity: 1, args: [V('X')], negated: false },
    { predicate: 'q', arity: 1, args: [V('X')], negated: true }
  ]
});
expect(() => e.defineRule({
  ruleId: 'r2',
  head: { predicate: 'q', arity: 1, args: [V('X')] },
  body: [
    { predicate: 'base', arity: 1, args: [V('X')], negated: false },
    { predicate: 'p', arity: 1, args: [V('X')], negated: true }
  ]
})).toThrow(expect.objectContaining({ code: 'CYCLIC_NEGATION' }));
// After:
e.defineRule(
  'r1',
  ['p', ['X']],
  [['base', ['X']], ['not', ['q', ['X']]]],
  {}
);
expect(() => e.defineRule(
  'r2',
  ['q', ['X']],
  [['base', ['X']], ['not', ['p', ['X']]]],
  {}
)).toThrow(expect.objectContaining({ code: 'CYCLIC_NEGATION' }));
// (Both rules are well-formed; together they form a negation cycle p ↔ ¬q ↔ ¬p — semantics preserved)
```

**Lines 40 + 41 — DUPLICATE_RULE_ID test** (same rule literal asserted twice):
```javascript
// Before:
const r = {
  ruleId: 'r',
  head: { predicate: 'p', arity: 1, args: [V('X')] },
  body: [{ predicate: 'q', arity: 1, args: [V('X')], negated: false }]
};
e.defineRule(r);
expect(() => e.defineRule(r)).toThrow(expect.objectContaining({ code: 'DUPLICATE_RULE_ID' }));
// After:
const r = ['r', ['p', ['X']], [['q', ['X']]], {}];
e.defineRule(...r);
expect(() => e.defineRule(...r)).toThrow(expect.objectContaining({ code: 'DUPLICATE_RULE_ID' }));
```

**Line 77 — UNSAFE_RULE test** (head variable Y not bound in body):
```javascript
// Before:
expect(() => e.defineRule({
  ruleId: 'unsafe1',
  head: { predicate: 'q', arity: 2, args: [{ var: 'X' }, { var: 'Y' }] },
  body: [{ predicate: 'p', arity: 1, args: [{ var: 'X' }], negated: false }]
})).toThrow(expect.objectContaining({ code: 'UNSAFE_RULE', ruleId: 'unsafe1' }));
// After:
expect(() => e.defineRule(
  'unsafe1',
  ['q', ['X', 'Y']],
  [['p', ['X']]],
  {}
)).toThrow(expect.objectContaining({ code: 'UNSAFE_RULE', ruleId: 'unsafe1' }));
```

Preserve every assertion's error-code expectation exactly. No test removed; no assertion shape changed beyond the surface.

- [ ] **Step 3: Run tests to verify the helper and failure tests pass**

```
Run: `npx vitest run failures`
Expected: PASS — 5 failure-mode tests assert the same error codes against the new API. MALFORMED_RULE may now have `stage: 'translator'` in payload — assertion using `expect.objectContaining({ code: 'MALFORMED_RULE' })` ignores additional payload fields, so existing assertions remain valid.

Run: `npx vitest run RuleAtomTranslator engine-public-api serializer-version`
Expected: PASS — no regressions.
```

- [ ] **Step 4: Run full suite to confirm only the 10 helper-using files remain red**

```
Run: `npx vitest run`
Expected: RuleAtomTranslator, engine-public-api, serializer-version, failures, DerivedPositionalIndex, candidates-for, operations — all green. The 10 helper-target files (snapshot, properties, explain, lifecycle, query, stress, transactions, evaluator-indexing, evaluation) still RED at the Engine-level callsites. That's the expected intermediate state; Task 5 addresses them.
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/__tests__/helpers/defineRuleObj.js skills/design-large-task/engine/__tests__/failures.test.js
git commit -m "test(engine): helper + direct migration of failure-mode tests"
```

---

## Task 5: Migrate remaining 10 test files via the helper

**Type:** code-producing
**Implements:** AC-9.1, AC-9.2, AC-4.2a (end-to-end wildcard unification through translator path — covered by `evaluation.test.js`, `query.test.js`, and `explain.test.js` cases that exercise `'_'` wildcards in rule bodies)
**Decision budget:** 2 (helper-wrap form for each callsite; per-file commit boundary)
**Must remain green:** Each commit must produce a fully-green `npx vitest run` (equivalent to `npm test` — the engine's `package.json` test script is `vitest run`). Migrating one file at a time keeps the suite recoverable at every point.

**Files (modify in this order; each is its own commit). Counts verified against the worktree's current test files:**

1. `skills/design-large-task/engine/__tests__/snapshot.test.js` — 1 Engine-level `defineRule` callsite
2. `skills/design-large-task/engine/__tests__/properties.test.js` — 3 callsites
3. `skills/design-large-task/engine/__tests__/explain.test.js` — 2 `defineRule` + 7 `explain` callsites (at lines 29, 39, 47, 52, 55, 60, 61). All 7 explain calls flip from `e.explain('pred', [args])` to `e.explain(['pred', [args]])` in this same commit.
4. `skills/design-large-task/engine/__tests__/lifecycle.test.js` — 3 Engine-level `defineRule` callsites at lines 9, 40, 75. **Also: this file has two hardcoded `version: 1` blobs at lines 67 and 83 that must be updated to `version: 2` in this same commit, or they will throw `MALFORMED_SERIALIZED_INPUT` under Task 3's new version check. The blob at line 67 ("loadFrom on empty valid input") is a pure version-literal change. The blob at line 83 ("loadFrom atomic on mid-replay failure / AC-7.3") uses `version: 1` inside the tampered-payload — the tampered payload still needs to be a valid-schema-version (so version: 2) blob carrying the NaN that triggers TYPE_ERROR; semantic intent of the test is preserved.** Validates AC-5.x at this commit.
5. `skills/design-large-task/engine/__tests__/query.test.js` — 3 callsites
6. `skills/design-large-task/engine/__tests__/stress.test.js` — 4 callsites
7. `skills/design-large-task/engine/__tests__/transactions.test.js` — 3 Engine-level `defineRule` callsites. **Also: this file has one hardcoded `version: 1` blob at line 165 ("AC-8.7 commit-time atomicity") that must be updated to `version: 2` in this same commit, or `loadFrom` will throw `MALFORMED_SERIALIZED_INPUT` instead of executing the post-commit comparison. (The blob at line 107 is inside a `loadFrom-refused-during-tx` test — `Engine.loadFrom` checks `_tx` before delegating to `Serializer.loadEngineFrom`, so `NESTED_TRANSACTION_OP_REFUSED` fires before the version check; that callsite stays `version: 1` and the test still passes.)** Validates AC-7.1 ADR-0013 stratification-inside-tx.
8. `skills/design-large-task/engine/__tests__/evaluator-indexing.test.js` — 3 Engine-level callsites (3 RuleStore-level callsites stay object-form)
9. `skills/design-large-task/engine/__tests__/evaluation.test.js` — Engine-level subset of 14 mixed callsites (RuleStore-level calls untouched). Add a `// RuleStore-level: object form intentional` comment next to each `rs.defineRule({...})` callsite so future readers don't mistake the object-form calls for migration oversight.

For each file the migration pattern is:

**Old:**
```javascript
e.defineRule({
  ruleId: 'r1',
  head: { predicate: 'p', arity: 1, args: [{ var: 'X' }] },
  body: [{ predicate: 'q', arity: 1, args: [{ var: 'X' }], negated: false }],
});
```

**New (helper-wrapped):**
```javascript
import { defineRuleObj } from './helpers/defineRuleObj.js';
// ...
defineRuleObj(e, {
  ruleId: 'r1',
  head: { predicate: 'p', arity: 1, args: [{ var: 'X' }] },
  body: [{ predicate: 'q', arity: 1, args: [{ var: 'X' }], negated: false }],
});
```

For `explain` callsites in `explain.test.js`:
```javascript
// Old:
const tree = e.explain('ancestor', ['a', 'c']);
// New:
const tree = e.explain(['ancestor', ['a', 'c']]);
```

(`explainTuple` exists in the helper for symmetry but direct migration is simpler — the new signature is just a different argument shape.)

**Steps (TDD, per file):**

- [ ] **Step 1: For each file in the migration order — write the failing assertion first if absent**

These tests already exist. The TDD shape here is verification, not creation: confirm the file is currently RED (failing under the new Engine signatures), apply the helper-wrap edit, confirm GREEN.

- [ ] **Step 2: Verify RED state**

```
Run: `npx vitest run <filename-stem>` (e.g., `npx vitest run snapshot`)
Expected: FAIL — Engine-level defineRule callsite errors with MALFORMED_RULE because the object literal goes through the new 4-arg signature and gets interpreted as `ruleId: <object>, headAtom: undefined, ...`.
```

- [ ] **Step 3: Apply helper-wrap migration**

Edit the file. Add the `import { defineRuleObj } from './helpers/defineRuleObj.js';` at the top. Wrap each Engine-level `e.defineRule({...})` callsite as `defineRuleObj(e, {...})`. For `e.explain('pred', [args])`, change to `e.explain(['pred', [args]])`.

- [ ] **Step 4: Verify GREEN state**

```
Run: `npx vitest run <filename-stem>`
Expected: PASS — all tests in this file green.

Run: `npx vitest run`
Expected: progressively more green; suite is monotonically improving across these commits.
```

- [ ] **Step 5: Commit (per file)**

```bash
git add skills/design-large-task/engine/__tests__/<filename>.test.js
git commit -m "test(engine): migrate <filename> to new defineRule signature via helper"
```

Repeat steps 2-5 for each of the 10 files in the migration order. After file 10, the full suite is green at 107 + 4 (engine-public-api) + 4 (serializer-version) + N (RuleAtomTranslator) = ~115 tests, all green.

---

## Task 6: Cleanup — delete helper, verify no remaining wrapped callsites

**Type:** code-producing
**Implements:** AC-8.2, AC-10.1 (internal modules untouched — verified by explicit git-diff check in Step 4)
**Decision budget:** 1 (verify-then-delete sequence)
**Must remain green:** entire engine test suite.

**Files:**
- Delete: `skills/design-large-task/engine/__tests__/helpers/defineRuleObj.js`
- Modify: each of the 10 test files migrated in Task 5 — remove the `defineRuleObj` import + inline-replace each `defineRuleObj(e, {...})` call with a direct tuple-form `e.defineRule(...)` call.

**Note on `failures.test.js`:** This file was migrated directly to tuple form in Task 4 (never used the helper, per AC-8.0). It is exempt from this cleanup pass — Task 6 touches only the 10 helper-using files from Task 5, not `failures.test.js`.

**Steps:**

- [ ] **Step 1: Write the failing test**

Append to `engine-public-api.test.js`:

```javascript
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('AC-8.2 helper cleanup', () => {
  it('helper file is deleted', () => {
    const helperPath = resolve(import.meta.dirname, 'helpers/defineRuleObj.js');
    expect(existsSync(helperPath)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
Run: `npx vitest run engine-public-api`
Expected: FAIL — helper file still present.
```

- [ ] **Step 3: For each migrated file — replace helper-wrap with direct tuple form**

This is mechanical conversion of internal-object literals to tuple-form positional args. For each file in `snapshot.test.js`, `properties.test.js`, `explain.test.js`, `lifecycle.test.js`, `query.test.js`, `stress.test.js`, `transactions.test.js`, `evaluator-indexing.test.js`, `evaluation.test.js`:

```javascript
// Before:
import { defineRuleObj } from './helpers/defineRuleObj.js';
// ...
defineRuleObj(e, {
  ruleId: 'r1',
  head: { predicate: 'p', arity: 1, args: [{ var: 'X' }] },
  body: [{ predicate: 'q', arity: 1, args: [{ var: 'X' }], negated: false }],
});

// After:
// (import removed)
e.defineRule('r1', ['p', ['X']], [['q', ['X']]], {});
```

After all files have direct tuple-form calls, delete the helper file:

```bash
rm skills/design-large-task/engine/__tests__/helpers/defineRuleObj.js
# Also remove the helpers/ directory if it ends up empty:
rmdir skills/design-large-task/engine/__tests__/helpers 2>/dev/null || true
```

- [ ] **Step 4: Run tests + AC-10.1 internal-module-unchanged verification**

```
Run: `npx vitest run` (equivalent to `npm test`)
Expected: PASS — full suite ~115 tests green; AC-8.2 cleanup test green.

Run grep to confirm no remaining helper references:
`grep -rn "defineRuleObj\|explainTuple" skills/design-large-task/engine/__tests__/`
Expected: zero matches.

Run: `grep -rn "engine.defineRule(r)\|engine\.defineRule(\s*{" skills/design-large-task/engine/`
Expected: zero matches (no remaining 1-arg call form anywhere in the engine codebase).
```

AC-10.1 verification — internal modules unchanged. Compute git diff for the seven internal files against the pre-pass-4 baseline (main branch):

```bash
for f in RuleStore.js Unifier.js Stratifier.js Evaluator.js Explain.js Snapshot.js FactStore.js; do
  diff_lines=$(git diff main..HEAD -- "skills/design-large-task/engine/$f" | wc -l)
  echo "$f: $diff_lines diff lines"
done
```

Expected: every file reports `0 diff lines`. (Whitespace-only changes are acceptable per spec AC-10.1's clause "no semantic change"; if any file shows non-zero diff lines, inspect manually and confirm whitespace-only, then note in the cleanup commit message.)

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/engine/__tests__/ skills/design-large-task/engine/__tests__/engine-public-api.test.js
# (deletions and modifications staged together)
git commit -m "test(engine): cleanup — remove migration helper; tests use direct tuple form"
```

---

## End of Plan

Six tasks. Final state: ~115 tests across 16 test files (14 pre-existing + 1 new RuleAtomTranslator suite + 1 new engine-public-api suite), all green. One new production file (`RuleAtomTranslator.js`), two modified production files (`Engine.js`, `Serializer.js`), all seven other engine production files untouched. The temporary `helpers/` directory is gone; all test files use the new tuple-form public API directly.

After Task 6, `execute-verify-complete` runs to gate the finish phase. Then `finish-write-records` → `finish-archive-artifacts` → `finish-close-worktree`.

<!-- created-at: 2026-05-13T23:09:08Z -->
<!-- produced-by plan-build@v0001 -->
