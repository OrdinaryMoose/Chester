# Plan: Vocabulary Discipline Refinement

**Sprint:** sprint-02-bug-fix-09
**Spec:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-09/spec/sprint-02-bug-fix-09-spec-00.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Refine the proof system's pre-ratify vocabulary check so descriptive element categories (Definition, Concern, Risk, Evidence) are exempt from the case-variance check, and replace the substring matcher with a whole-word regex matcher under a narrow word-character set.

## Architecture

Hybrid principled merge from the spec. Exempt-category set is encoded as a module-level frozen Set in `mutations.js`, threaded through `_vocabularyLintCheck` via a new `elementCategory` parameter that is resolved at the RATIFY call site by reusing the existing `_resolveElementCategory` helper. The matcher is replaced with a case-insensitive regex carrying lookaround word-boundary checks against the narrow character set `[A-Za-z0-9]`. Tests are organized per-sub-sprint: the three existing D11 assertions in `sprint-02-bug-fix-07.test.js` are relocated from a Concern subject to a Rule subject (preserving original test intents on a non-exempt category), and a new file `sprint-02-bug-fix-09.test.js` holds four new integration assertions for the exempt-category and whole-word contract surfaces.

## Tech Stack

- JavaScript (ES Modules, Node) — engine and domain layers under `skills/design-proof-system/references/domain/`
- Vitest — the test framework used across the domain layer
- npm — package manager; tests run via `npm test` from `skills/design-proof-system/references/domain/`
- Worktree at `/home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09/`; branch `sprint-02-bug-fix-09` off `main`

---

## Task 1: Relocate existing D11 tests from Concern to Rule

**Type:** code-producing
**Implements:** AC-3.5
**Decision budget:** 1
**Must remain green:** All 32 tests in `sprint-02-bug-fix-07.test.js` continue to pass (AC-11.1 still throws `VOCABULARY_LINT_VIOLATION`, AC-11.2 and AC-11.3 still pass).

**Files:**
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js:439-507`

**Context:** All three existing D11 assertions use `ELEMENT_CATEGORIES.CONCERN` as the ratification subject. Once the exempt-set logic lands in Task 2, Concern will be exempt and these tests would either fail (AC-11.1: expected throw → no throw because Concern is exempt) or pass for the wrong reason (AC-11.2 and AC-11.3: short-circuit via the new exempt-category early-exit rather than via their original behaviors). This task relocates all three to `ELEMENT_CATEGORIES.RULE` (with the corresponding field rename from `label` to `statement`) so they continue to lock their original intents on a non-exempt category. The relocation is done BEFORE any engine change because the existing substring matcher still operates uniformly across categories under the current code, and a Rule subject with the same text triggers the same violations (or non-violations) as the Concern subject did.

**Steps (TDD):**

- [ ] **Step 1: Relocate AC-11.3 from Concern to Rule**

In `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js`, find the AC-11.3 test (around lines 439-454). The current `addElement` call inside that test is:

```js
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'reachability' },
      designerConsent,
    );
```

Replace with:

```js
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'reachability' },
      designerConsent,
    );
```

Leave the `it(...)` description text, the preceding bootstrap `addElement` for Evidence, and the trailing `bridge.ratifyElement` call (which references `c.id`) untouched.

- [ ] **Step 2: Relocate AC-11.1 from Concern to Rule**

In the same file, find the AC-11.1 test (around lines 456-481). The current `addElement` call is:

```js
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'uses reachability everywhere' },
      designerConsent,
    );
```

Replace with:

```js
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'uses reachability everywhere' },
      designerConsent,
    );
```

Leave the rest of the test untouched. The expectation `expect(() => bridge.ratifyElement(...)).toThrow(/VOCABULARY_LINT_VIOLATION/)` is preserved verbatim.

- [ ] **Step 3: Relocate AC-11.2 from Concern to Rule**

In the same file, find the AC-11.2 test (around lines 483-506). The current `addElement` call is:

```js
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'uses Reachability everywhere' },
      designerConsent,
    );
```

Replace with:

```js
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'uses Reachability everywhere' },
      designerConsent,
    );
```

- [ ] **Step 4: Run the full domain test suite to verify all D11 tests still pass under current code**

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09/skills/design-proof-system/references/domain && npm test`

Expected: All 275 existing tests pass; zero failures. The three relocated D11 tests pass under the current substring matcher because:
- AC-11.1 (Rule with `uses reachability everywhere`): matcher finds `reachability` substring; case differs from canonical `Reachability`; violation fires → throws ✓
- AC-11.2 (Rule with `uses Reachability everywhere`): matcher finds `Reachability` substring; case matches canonical exactly; no violation → no throw ✓
- AC-11.3 (Rule with `reachability`, no Definitions ratified): empty `ratifiedDefs` short-circuit returns `null`; no violation → no throw ✓

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09
git add skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-07.test.js
git commit -m "$(cat <<'EOF'
test(design-proof-system): relocate D11 tests from Concern to Rule subject

All three existing D11 assertions (AC-11.1, AC-11.2, AC-11.3) switched from
ELEMENT_CATEGORIES.CONCERN with field 'label' to ELEMENT_CATEGORIES.RULE
with field 'statement'. Preserves the original test intents on a non-exempt
category ahead of the exempt-set introduction in the next task. Without
this relocation, AC-11.1 would fail under the new contract (Concern becomes
exempt), and AC-11.2/AC-11.3 would pass via the new exempt-category
early-exit rather than via their original behaviors.

Refs: sprint-02-bug-fix-09 spec AC-3.5

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add exempt-set encoding and thread elementCategory to the check

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2, AC-2.1, AC-3.1, AC-3.2
**Decision budget:** 2
**Must remain green:** The two new assertions (AC-11.4 Concern exempt, AC-11.5 Risk exempt) in `sprint-02-bug-fix-09.test.js`. All 275 previously-passing tests in the domain layer including the three relocated D11 assertions from Task 1.

**Files:**
- Modify: `skills/design-proof-system/references/domain/mutations.js:35-66` (add module-level const, change `_vocabularyLintCheck` signature, add early-exit branch)
- Modify: `skills/design-proof-system/references/domain/mutations.js:423-454` (lift `ratifyTarget` declaration; pass to lint-check call site)
- Create: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-09.test.js`

**Context:** Add `VOCAB_LINT_EXEMPT_CATEGORIES` as a module-level frozen Set containing four wire-string values. Change `_vocabularyLintCheck`'s signature to accept `elementCategory` as a third parameter. Add the exempt-category early-exit branch immediately after the canonical-terms extraction. At the call site, lift the existing `ratifyTarget` declaration above the CONCERN cleanup block so it is in scope for the later lint-check block; pass it as the third argument. Two new integration assertions confirm the exempt-set logic: a Concern with a lowercase canonical-term variant ratifies successfully, and a Risk with a lowercase canonical-term variant ratifies successfully.

**Steps (TDD):**

- [ ] **Step 1: Create the new test file with two failing tests (AC-11.4, AC-11.5)**

Create `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-09.test.js` with the following content:

```js
import { describe, it, expect } from 'vitest';
import { createDomainBridge } from '../domain-bridge.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES } from '../tags.js';

// D11 contract spans two files. Baseline assertions (AC-11.1, AC-11.2, AC-11.3) live
// in sprint-02-bug-fix-07.test.js. This file holds the sprint-02-bug-fix-09 refinement:
// exempt-category coverage (AC-11.4, AC-11.5) and whole-word matcher coverage
// (AC-11.6, AC-11.7).

async function makeRealBridge() {
  const { Engine } = await import('../../engine/Engine.js');
  const counters = new Map();
  const idAllocator = {
    next: (shape) => {
      const n = (counters.get(shape) ?? 0) + 1;
      counters.set(shape, n);
      return `${shape}_${n}`;
    },
    seed: (map) => { counters.clear(); for (const [k, v] of Object.entries(map ?? {})) counters.set(k, v); },
    highWater: (shape) => counters.get(shape) ?? 0,
  };
  const clock = { now: () => 1700000000 };
  const consentVerification = { verify: () => true };
  const persistenceRepo = { saveState: () => {} };
  return createDomainBridge({ engine: new Engine(), clock, idAllocator, consentVerification, persistenceRepo });
}

const designerConsent = Object.freeze({ source: CONSENT_SOURCES.DESIGNER });

describe('sprint-02-bug-fix-09 — Vocabulary discipline refinement', () => {
  it('AC-11.4 Concern element with non-canonical case form is exempt from lint', async () => {
    const bridge = await makeRealBridge();
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const d = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Reachability', definition: 'the ability to reach a state' },
      designerConsent,
    );
    bridge.ratifyElement(
      { elementId: d.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    );
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'uses reachability here' },
      designerConsent,
    );
    expect(() => bridge.ratifyElement(
      { elementId: c.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    )).not.toThrow();
  });

  it('AC-11.5 Risk element with non-canonical case form is exempt from lint', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const d = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Throughput', definition: 'units of work per unit time' },
      designerConsent,
    );
    bridge.ratifyElement(
      { elementId: d.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    );
    const r = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RISK, statement: 'throughput may degrade under load', basis: [ev.id] },
      designerConsent,
    );
    expect(() => bridge.ratifyElement(
      { elementId: r.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    )).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the new tests to verify they FAIL under current code**

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09/skills/design-proof-system/references/domain && npm test -- __tests__/sprint-02-bug-fix-09.test.js`

Expected: Both AC-11.4 and AC-11.5 FAIL with `VOCABULARY_LINT_VIOLATION` thrown. The current substring matcher finds the lowercase `reachability` inside the Concern's `label` and the lowercase `throughput` inside the Risk's `statement`; both are case-variants of their respective canonical terms (`Reachability`, `Throughput`); both trigger the discipline.

- [ ] **Step 3: Add the module-level frozen Set and change `_vocabularyLintCheck`'s signature**

In `skills/design-proof-system/references/domain/mutations.js`, find the current comment block immediately before the `_vocabularyLintCheck` function (around lines 35-40):

```js
// D11 pre-ratify vocabulary lint gate. Reads ratified `definition/3` rows (derived
// once a Definition element is ratified by per-element RULE_TEMPLATES). For each
// canonical term, scans the target element's string-valued fields for a case-insensitive
// substring match that is NOT the exact canonical form — i.e. a case variant — and
// returns the first violation it finds. Returns null when no definitions are ratified
// (AC-11.3) or when every field is clean.
function _vocabularyLintCheck(elementId, ports) {
```

Replace with:

```js
// D11 pre-ratify vocabulary lint gate. Reads ratified `definition/3` rows (derived
// once a Definition element is ratified by per-element RULE_TEMPLATES). For each
// canonical term, scans the target element's string-valued fields for a whole-word
// case-variant occurrence of the term under the narrow word-character set
// [A-Za-z0-9], and returns the first violation it finds. Returns null when no
// definitions are ratified, when the element's category is in the exempt set
// (descriptive prose: Definition, Concern, Risk, Evidence), or when every field
// is clean.
//
// Exempt-set rationale: descriptive categories naturally reference canonical terms
// in common-noun and inflected forms. The mechanical discipline is reserved for
// argumentative categories (Proposition, Resolution, Rule, Permission, Friction)
// where canonical-form consistency carries weight. The authoring rule in
// VOCABULARY.md §11 remains universal guidance regardless.
const VOCAB_LINT_EXEMPT_CATEGORIES = Object.freeze(new Set([
  ELEMENT_CATEGORIES.DEFINITION,
  ELEMENT_CATEGORIES.CONCERN,
  ELEMENT_CATEGORIES.RISK,
  ELEMENT_CATEGORIES.EVIDENCE,
]));

function _vocabularyLintCheck(elementId, ports, elementCategory) {
```

- [ ] **Step 4: Insert the exempt-category early-exit branch**

Still in `mutations.js`, inside the body of `_vocabularyLintCheck`. Find the existing canonical-terms extraction and the readPorts line (currently around lines 44-47):

```js
  const canonicalTerms = ratifiedDefs.map(r => r.T).filter(t => typeof t === 'string' && t.length > 0);
  if (canonicalTerms.length === 0) return null;

  const readPorts = { query: ports.query, explain: ports.explain };
```

Replace with:

```js
  const canonicalTerms = ratifiedDefs.map(r => r.T).filter(t => typeof t === 'string' && t.length > 0);
  if (canonicalTerms.length === 0) return null;

  // Exempt-category early-exit: descriptive categories are not subject to the
  // mechanical case-variance check. The discipline applies to argumentative
  // prose only. A null elementCategory (defensive fallthrough on category-
  // resolution failure) does NOT short-circuit here.
  if (elementCategory && VOCAB_LINT_EXEMPT_CATEGORIES.has(elementCategory)) return null;

  const readPorts = { query: ports.query, explain: ports.explain };
```

- [ ] **Step 5: Lift `ratifyTarget` and pass it to the lint-check call site**

Still in `mutations.js`, find the CONCERN cleanup block (currently around lines 423-428):

```js
    if (verbName === ACTION_LABELS.RATIFY) {
      const ratifyTarget = _resolveElementCategory(args.elementId, ports.query);
      if (ratifyTarget === ELEMENT_CATEGORIES.CONCERN) {
        ports.facts.retractFact('concern_status', [args.elementId, 'draft']);
      }
    }
```

Replace with:

```js
    // RATIFY-only: resolve the target element's category once, then reuse it for
    // both the CONCERN cleanup (immediately below) and the lint-check at step 8b.
    let ratifyTarget = null;
    if (verbName === ACTION_LABELS.RATIFY) {
      ratifyTarget = _resolveElementCategory(args.elementId, ports.query);
      if (ratifyTarget === ELEMENT_CATEGORIES.CONCERN) {
        ports.facts.retractFact('concern_status', [args.elementId, 'draft']);
      }
    }
```

Find the lint-check call site (currently around lines 449-454):

```js
    // §6.1 step 8b (D11): pre-ratify vocabulary lint. Blocking gate before customPostCheck.
    if (verbName === ACTION_LABELS.RATIFY) {
      const violation = _vocabularyLintCheck(args.elementId, ports);
      if (violation) {
        throw new DomainError({ code: 'VOCABULARY_LINT_VIOLATION', ...violation });
      }
    }
```

Replace with:

```js
    // §6.1 step 8b (D11): pre-ratify vocabulary lint. Blocking gate before customPostCheck.
    // Passes the previously-resolved ratifyTarget so the lint can short-circuit on
    // exempt categories without an additional category-resolution query.
    if (verbName === ACTION_LABELS.RATIFY) {
      const violation = _vocabularyLintCheck(args.elementId, ports, ratifyTarget);
      if (violation) {
        throw new DomainError({ code: 'VOCABULARY_LINT_VIOLATION', ...violation });
      }
    }
```

- [ ] **Step 6: Run the new tests and the full domain test suite to verify everything passes**

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09/skills/design-proof-system/references/domain && npm test -- __tests__/sprint-02-bug-fix-09.test.js`

Expected: AC-11.4 and AC-11.5 both PASS. The exempt-category early-exit fires for both Concern and Risk subjects; ratification completes without throwing.

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09/skills/design-proof-system/references/domain && npm test`

Expected: 277 tests pass (275 baseline + 2 new), zero failures. The relocated D11 tests in `sprint-02-bug-fix-07.test.js` continue to pass — they now use Rule subjects which are non-exempt, and the substring matcher still operates uniformly on non-exempt categories (the whole-word matcher arrives in Task 3).

- [ ] **Step 7: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09
git add skills/design-proof-system/references/domain/mutations.js skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-09.test.js
git commit -m "$(cat <<'EOF'
feat(design-proof-system): exempt descriptive categories from vocab lint

Adds VOCAB_LINT_EXEMPT_CATEGORIES as a module-level frozen Set containing
the four descriptive element categories (Definition, Concern, Risk,
Evidence). _vocabularyLintCheck gains an elementCategory parameter and
exits early when the category is in the exempt set. The RATIFY call site
in runOperation lifts the existing ratifyTarget declaration above the
CONCERN cleanup block so the resolved category is reused for the lint
call without a second _resolveElementCategory query.

Adds AC-11.4 and AC-11.5 integration assertions in a new
sprint-02-bug-fix-09.test.js file confirming Concern and Risk subjects
with case-variant canonical-term references ratify successfully.

Refs: sprint-02-bug-fix-09 spec AC-1.1, AC-1.2, AC-2.1, AC-3.1, AC-3.2

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Replace substring matcher with whole-word regex matcher

**Type:** code-producing
**Implements:** AC-1.3, AC-1.4, AC-3.3, AC-3.4, AC-5.1
**Decision budget:** 2
**Must remain green:** Two new assertions (AC-11.6 inflection passes, AC-11.7 canonical-form regression) in `sprint-02-bug-fix-09.test.js`. All previously passing tests including the relocated AC-11.1 (still throws), AC-11.2 (still passes), AC-11.3 (still passes), AC-11.4 (still passes), AC-11.5 (still passes).

**Files:**
- Modify: `skills/design-proof-system/references/domain/mutations.js:51-66` (inner matcher loop in `_vocabularyLintCheck`)
- Modify: `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-09.test.js` (append two new `it` blocks)

**Context:** Replace the case-folded substring scan (`lowerValue.indexOf(lowerTerm)`) with a case-insensitive whole-word regex matcher. The regex uses negative lookbehind and lookahead against `[A-Za-z0-9]` to assert word boundaries under the narrow word-character set. Canonical-term values are regex-escaped to handle metacharacters safely (a canonical with a period, like `Story.Authoring`, would otherwise produce an invalid or mis-matching regex). The matched substring is extracted from the original-case candidate text and compared against the canonical term's exact case to detect case-variance violations.

**Steps (TDD):**

- [ ] **Step 1: Append two failing tests (AC-11.6, AC-11.7) to the new test file**

Open `skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-09.test.js`. Inside the existing `describe('sprint-02-bug-fix-09 — Vocabulary discipline refinement', ...)` block, after the AC-11.5 `it` block and before the closing `});` of the describe block, insert:

```js
  it('AC-11.6 inflection of a canonical term passes on a non-exempt element', async () => {
    const bridge = await makeRealBridge();
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const d = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Cache', definition: 'a temporary store' },
      designerConsent,
    );
    bridge.ratifyElement(
      { elementId: d.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    );
    const r = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'cached results expire after timeout' },
      designerConsent,
    );
    expect(() => bridge.ratifyElement(
      { elementId: r.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    )).not.toThrow();
  });

  it('AC-11.7 canonical form on a non-exempt element passes (regression lock)', async () => {
    const bridge = await makeRealBridge();
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const d = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Visibility', definition: 'observable state of a thing' },
      designerConsent,
    );
    bridge.ratifyElement(
      { elementId: d.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    );
    const r = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'Visibility drives the architecture' },
      designerConsent,
    );
    expect(() => bridge.ratifyElement(
      { elementId: r.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    )).not.toThrow();
  });
```

- [ ] **Step 2: Run the new tests to verify the inflection test FAILS under the current matcher**

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09/skills/design-proof-system/references/domain && npm test -- __tests__/sprint-02-bug-fix-09.test.js`

Expected: AC-11.7 PASSES (canonical form `Visibility` matches the canonical `Visibility` exactly under the current substring matcher; no case variance; no violation). AC-11.6 FAILS with `VOCABULARY_LINT_VIOLATION` — the current substring matcher finds `cache` inside `cached`, the matched substring `cache` differs from the canonical `Cache`, and the violation fires.

- [ ] **Step 3: Replace the substring matcher with the whole-word regex matcher**

In `skills/design-proof-system/references/domain/mutations.js`, find the inner matcher loop inside `_vocabularyLintCheck` (currently around lines 51-66, after the early-exit branch added in Task 2):

```js
  for (const [field, value] of Object.entries(record)) {
    if (typeof value !== 'string' || value.length === 0) continue;
    for (const term of canonicalTerms) {
      if (term === value) continue; // exact match of the entire field — skip (likely the Definition's own canonical_name field)
      const lowerValue = value.toLowerCase();
      const lowerTerm = term.toLowerCase();
      const idx = lowerValue.indexOf(lowerTerm);
      if (idx === -1) continue;
      const matchedSubstring = value.slice(idx, idx + term.length);
      if (matchedSubstring !== term) {
        return { field, value: matchedSubstring, canonicalTerm: term };
      }
    }
  }
  return null;
}
```

Replace with:

```js
  for (const [field, value] of Object.entries(record)) {
    if (typeof value !== 'string' || value.length === 0) continue;
    for (const term of canonicalTerms) {
      if (term === value) continue; // exact match of the entire field — skip (likely the Definition's own canonical_name field)
      // Whole-word match under the narrow word-character set [A-Za-z0-9].
      // Underscore, hyphen, period, apostrophe, and whitespace all separate words.
      // Case-insensitive (`i` flag) so the matcher locates case-variant occurrences;
      // the matched substring is extracted from the candidate text in its original
      // case and compared against the canonical term's exact case to detect a
      // case-variance violation. Canonical-term values are regex-escaped so terms
      // containing regex metacharacters (e.g. a period) are handled correctly.
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordBoundaryRe = new RegExp(`(?<![A-Za-z0-9])${escapedTerm}(?![A-Za-z0-9])`, 'i');
      const match = wordBoundaryRe.exec(value);
      if (!match) continue;
      const matchedSubstring = match[0];
      if (matchedSubstring !== term) {
        return { field, value: matchedSubstring, canonicalTerm: term };
      }
    }
  }
  return null;
}
```

- [ ] **Step 4: Run the full domain test suite to verify all assertions pass**

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09/skills/design-proof-system/references/domain && npm test`

Expected: 279 tests pass (275 baseline + 4 new), zero failures. Specifically:
- AC-11.6 PASSES: `cached` is not a whole-word match against `Cache` because the character following `cache` (`d`) is alphanumeric, so the right-side lookahead fails; no violation fires
- AC-11.7 PASSES: `Visibility` matches the canonical `Visibility` exactly; no case variance; no violation
- Relocated AC-11.1 in `sprint-02-bug-fix-07.test.js` still throws: `reachability` is a whole-word match against `Reachability` (whitespace on both sides), case differs, violation fires
- Relocated AC-11.2 still passes: `Reachability` matches canonical exactly
- Relocated AC-11.3 still passes: empty ratifiedDefs short-circuit fires before the matcher
- AC-11.4 and AC-11.5 still pass: exempt-category early-exit fires before the matcher

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09
git add skills/design-proof-system/references/domain/mutations.js skills/design-proof-system/references/domain/__tests__/sprint-02-bug-fix-09.test.js
git commit -m "$(cat <<'EOF'
feat(design-proof-system): whole-word matcher for vocab lint

Replaces the case-folded substring scan in _vocabularyLintCheck with a
case-insensitive whole-word regex matcher under the narrow word-character
set [A-Za-z0-9]. Underscore, hyphen, period, apostrophe, and whitespace
separate words. Canonical-term values are regex-escaped before insertion
to handle metacharacters safely (terms containing a period, for example).
The matched substring is extracted from the candidate text in its original
case and compared against the canonical term's exact case to detect a
case-variance violation. The match contract (return null for clean fields,
return {field, value, canonicalTerm} on violation) is unchanged.

Adds AC-11.6 (inflection passes on non-exempt) and AC-11.7 (canonical form
regression lock) integration assertions.

Refs: sprint-02-bug-fix-09 spec AC-1.3, AC-1.4, AC-3.3, AC-3.4

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Update canonical vocabulary document

**Type:** docs-producing
**Implements:** AC-4.1
**Decision budget:** 1
**Must remain green:** No automated test coverage — VOCABULARY.md is documentation. Visual inspection only.

**Files:**
- Modify: `skills/design-proof-system/references/domain/VOCABULARY.md` (Section 11 plus new Change Log section at end)

**Context:** Add one paragraph to §11 (Naming hygiene rules) describing the mechanical enforcement and naming the four exempt categories. Add a Change Log section at the document's end with one entry recording this update. Per the standalone-documentation discipline established in the design conversation, the body describes the current state declaratively (no "we used to do X, now we do Y" framing); the change log carries lineage.

**Steps (TDD):**

- [ ] **Step 1: Insert the enforcement paragraph into Section 11**

Open `skills/design-proof-system/references/domain/VOCABULARY.md`. Find Section 11 (Naming hygiene rules, around line 234). The section currently contains a bullet list ending at the bullet about friction-shape `UPPER_SNAKE_CASE` form (around line 244), followed by a blank line and then the paragraph "If a needed term is not in this file, add it here first..." (around line 246).

After the final bullet of the list and before the "If a needed term is not in this file..." paragraph, insert a new paragraph:

```markdown
The naming-form rules above are enforced mechanically at ratification time. When an approval-gated element is ratified, the engine scans the element's text fields for whole-word occurrences of any ratified canonical term that differ from the canonical's exact case, and refuses ratification when one is found. The discipline applies to **Proposition**, **Resolution**, **Rule**, **Permission**, and **Friction** elements — categories whose prose is argumentative and where canonical-form consistency carries weight. The discipline does **not** apply to **Definition**, **Concern**, **Risk**, or **Evidence** elements — descriptive categories whose prose naturally reaches for common-noun and inflected forms of canonical terms in the course of explaining the design subject. The authoring rule above applies universally regardless; only the mechanical enforcement is asymmetric.
```

A blank line should separate this new paragraph from the preceding bullet list and from the "If a needed term is not in this file..." paragraph that follows.

- [ ] **Step 2: Append the Change Log section to the end of the document**

Open the same file. At the very end of `VOCABULARY.md` — which currently terminates with the "Structured payload channel" section (lines 305-314), after Section 12 — append:

```markdown

---

## Change Log

- **2026-05-20** — Section 11 gained the mechanical-enforcement paragraph. The proof system's pre-ratify vocabulary check is scoped to the argumentative element categories and uses whole-word matching under the narrow word-character set. The four descriptive categories (Definition, Concern, Risk, Evidence) are exempt from the mechanical check; the authoring rule continues to apply to all categories. See `docs/chester/plans/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-09/` for the design and implementation record.
```

- [ ] **Step 3: Visually verify the document reads cleanly**

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09 && sed -n '234,260p' skills/design-proof-system/references/domain/VOCABULARY.md`

Expected: Section 11's bullet list is followed by the new enforcement paragraph and then the "If a needed term is not in this file..." paragraph. No malformed Markdown, no missing blank lines.

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09 && tail -15 skills/design-proof-system/references/domain/VOCABULARY.md`

Expected: The document closes with the Change Log section containing the one entry.

- [ ] **Step 4: Confirm the existing test suite still passes (no behavioral change from a docs-only task, but the safety net is cheap)**

Run: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09/skills/design-proof-system/references/domain && npm test`

Expected: 279 tests pass; zero failures.

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/sprint-02-bug-fix-09
git add skills/design-proof-system/references/domain/VOCABULARY.md
git commit -m "$(cat <<'EOF'
docs(design-proof-system): document vocab-lint enforcement scope

Adds a paragraph to VOCABULARY.md §11 describing the mechanical enforcement
of the canonical-form rule. The discipline applies to Proposition,
Resolution, Rule, Permission, and Friction elements (argumentative prose).
Definition, Concern, Risk, and Evidence elements are exempt (descriptive
prose). The authoring rule continues to apply universally. Adds a Change
Log section at the document's end per the standalone-documentation
discipline.

Refs: sprint-02-bug-fix-09 spec AC-4.1

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

<!-- created-at: 2026-05-20T11:15:16Z -->
<!-- produced-by plan-build@v0004 -->
