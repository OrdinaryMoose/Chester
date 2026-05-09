# Deferred Items — sprint-d-1-fix-proof-mcp-3

Items surfaced during execution that were out of scope for the current task.

---

## 2026-05-09 — Empty `grounding` arrays render a blank sub-bullet

**Source task:** Task 3 (per-type render functions).

**Description:** `renderNC` (line 63) and `renderRC` (line 98) call `(el.grounding ?? []).join(', ')` and pass the result to `renderSubBullet`. When `grounding` is an empty array, the join produces an empty string, which `renderSubBullet`'s null-guard does not catch (it guards `null`, `undefined`, and `Array.isArray(value) && value.length === 0` — but not a plain empty string). Result: an element with `grounding: []` renders as `  - **grounding:** \n` (a blank sub-bullet) rather than no sub-bullet at all.

The `rejected_alternatives` path in `renderNC` already uses the right pattern — it null-coerces the empty-array case before the call. The same one-line treatment would close the gap on `grounding` and `groundingNCs`.

**Suggested fix:**

```js
// in renderNC
out += renderSubBullet(
  'grounding',
  (el.grounding ?? []).length > 0 ? el.grounding.join(', ') : null
);

// in renderRC
out += renderSubBullet(
  'groundingNCs',
  (el.grounding ?? []).length > 0 ? el.grounding.join(', ') : null
);
```

Or add an empty-string guard to `renderSubBullet` itself (one-liner; changes the primitive's contract — needs its own test).

**Why deferred:** Quality reviewer rated this Minor (confidence 85). Per the execute-write skill, Minor findings are noted and not fixed inline. No real proof state in the existing fixtures has an empty grounding array, so no current test exercises the path. Cosmetic markdown defect, not a correctness issue.

**Suggested follow-up:** Include the fix in the next proof-mcp maintenance pass, or surface as its own micro-fix sprint if it materializes during a real session.

<!-- created-at: 2026-05-09T12:43:05Z -->
<!-- produced-by execute-write@v0001 -->
