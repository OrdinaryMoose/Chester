# Deferred Items — sprint-01-proof-backend-pass-4

## 2026-05-13 — Task 2 quality review

### Engine.explain guard branch has no test coverage

**Source task:** Task 2 (Engine.js — defineRule + explain signature changes)

**Description:** The `explain(fact)` method contains a guard `if (!Array.isArray(fact) || fact.length !== 2) return null;` that handles malformed input by returning `null` silently. The 4 anchor tests in `engine-public-api.test.js` do not exercise this guard branch. The "explain returns null for absent facts" test passes `['nope', ['x', 'y']]` — a well-formed tuple — so null comes from `explainFact` not finding anything in `_derived`, not from the guard.

**Concrete gap:** If the guard is later refactored to throw a `MALFORMED_FACT` error instead of returning null (which would be a defensible semantic upgrade), no existing test would catch the regression.

**Suggested fix:** Add a one-line test case to `engine-public-api.test.js`:

```javascript
it('explain returns null on malformed (non-array) fact', () => {
  const e = new Engine();
  expect(e.explain('bad')).toBeNull();
});
```

Or assert against `[1,2,3]` to cover the length-mismatch branch specifically.

**Why deferred:** Out of scope for Task 2. The implementer pasted the test file verbatim from the plan, which did not include this case. Quality reviewer flagged at confidence 82 (Minor severity). Per execute-write Section 2.1, Minor findings are noted and moved past rather than blocking the task. The gap is in the spec/plan, not the implementation — the implementer did exactly what was asked.

**Discoverer:** quality reviewer for Task 2 (`chester:execute-write-quality-reviewer`)

<!-- created-at: 2026-05-14T00:57:58Z -->
<!-- produced-by execute-write@v0004 -->
