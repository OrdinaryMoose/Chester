# Deferred Items — sprint-02-bug-fix-0306

Items surfaced during execute-write that are valid follow-up improvements but out of scope for this sprint. Reviewed at finish phase.

---

## 2026-05-17 — Task 1 quality review

### DEF-1: evidence-schema.test.js has dead imports + missing translator/boot-validator blocks

**Source task:** Task 1 (EVIDENCE rename + H-4 + fixture migration)
**Surfaced by:** quality reviewer (confidence 88, Minor)
**Description:** `evidence-schema.test.js` imports `translate` and `validateCategoryRegistry` but never calls them. Both `permission-schema.test.js` and `risk-schema.test.js` (the stated mirrors) include translator unit tests via `translate(ELEMENT_CATEGORIES.X, ...)` and a `validateCategoryRegistry` smoke test. evidence-schema.test.js omits both, leaving the imports as dead signals.

**Why deferred:** Minor finding (confidence 88) per Section 2.1 ("Minor: Note and move on"). Test count + coverage already passes spec ACs (AC-3.x, AC-4.x). The added translator + boot-validator blocks would align with the precedent pattern but don't change correctness. Lands naturally in the next test-file revisit.

### DEF-2: restructuring.test.js fixture migration was not strictly necessary

**Source task:** Task 1
**Surfaced by:** quality reviewer (confidence 82, Minor)
**Description:** `restructuring.test.js` migrations (`claim:` → `statement:`) were not required — `validateOpenProofPayload` and `expandIntoOperations` don't inspect field names. The migration is harmless and improves semantic consistency, but technically over-scoped. No action needed; future restructuring.test.js changes can use either field literal.

**Why deferred:** Cosmetic; no behavior change either way. Filed for record-keeping.

---

<!-- created-at: 2026-05-17T17:06:00Z -->
<!-- produced-by execute-write@v0006 -->

## 2026-05-17 — Task 2 quality review

### DEF-3: render.js uses `{ var: '_S' }` instead of `'_'` wildcard for unused statement slot

**Source task:** Task 2 (PROPOSITION render block)
**Surfaced by:** quality reviewer (confidence 83, Minor)
**Description:** `render.js:59` queries `['proposition_decl', [b.I, { var: '_S' }, { var: 'P' }]]`. The `_S` slot is a named binding that's never read; the codebase convention (Unifier.js, friction-policy.js:21, render.js:104) is to use the bare `'_'` for don't-care positions. Functionally correct as-is; cosmetic cleanup.

**Why deferred:** Minor; no behavior change. Lands naturally next time render.js is touched.

### DEF-4: proposition-schema.test.js top-of-file comment is stale (references workaround removed by this task)

**Source task:** Task 2
**Surfaced by:** quality reviewer (confidence 81, Minor)
**Description:** `proposition-schema.test.js:8-15` describes a translator/engine mismatch and a "string-form grounding workaround" that this task closed. Comment factually incorrect post-merge; would mislead future readers.

**Why deferred:** Minor; rewriting the comment is a one-line cleanup that lands naturally in the next test-file revisit.

---

## 2026-05-17 — Task 3 spec + quality reviews

### DEF-5: resolution-schema.test.js test labels shifted vs spec

**Source task:** Task 3
**Surfaced by:** spec reviewer (confidence 85, Pass-with-issue)
**Description:** Test file labels `it('AC-5.3: translator unit ...')` for the translator-unit test but the spec defines AC-5.3 as the INVALID_REFERENCE tests. INVALID_REFERENCE assertions are present and correct; only the `it()` label strings are off by one. Behavior matches spec; labels disagree.

**Why deferred:** Labels are cosmetic — they appear in test output but the assertions themselves are what the spec validates. Lands naturally in any future test-file revisit.

### DEF-6: closure-policy.js:48 stale comment after M2 rule-body change

**Source task:** Task 3 M2 mitigation
**Surfaced by:** quality reviewer (confidence 82, Minor)
**Description:** Comment above `effective_addresses_rule` reads "Stratum 1 (depends on addresses + neg withdrew, both EDB)" but the rule body now depends on `resolution_anchor`, not `addresses`. One-word fix: `addresses` → `resolution_anchor` in the comment.

**Why deferred:** Comment-only; no behavior change. Picks up next time closure-policy.js is touched.

### DEF-7-NEW: VOCABULARY.md stale entries for RESOLUTION §3.6 reshape

**Source task:** Task 3
**Surfaced by:** quality reviewer (confidence 81, Minor)
**Description:** `skills/design-proof-system/references/domain/VOCABULARY.md` line 33 (Resolution required fields) and line 60 (`addresses` field definition) reflect the pre-reshape schema. Both now incorrect. Note: numbered DEF-7-NEW to distinguish from bug-fix-02's DEF-7 (probe-table sync structural test).

**Why deferred:** Same staleness-vs-fix-it-now trade-off as the other Minor findings; doc drift, no behavior impact. The same VOCABULARY.md will also need updating after Tasks 4 (FRICTION reshape), 5 (DEFINITION rename). Bundling those into a single docs sprint avoids repeated edits.

### DEF-8-NEW: bridge-integration.test.js header comment unclear about draft concern

**Source task:** Task 3 M5 fixture restructure
**Surfaced by:** quality reviewer (confidence 80, Minor)
**Description:** Smoke test comment header implies concern ratification but only the resolution is ratified; concern stays draft. Test passes for the right mechanical reason (absence of blocking conditions, not via covered derivation). Concern-schema.test.js AC-7.1 covers the full ratified path. Comment should clarify the draft state is intentional.

**Why deferred:** Cosmetic comment; no behavior change.

---

## 2026-05-17 — Task 4 reviews

### TASK-4 FOLLOWUP (Critical, fixed inline): closure-policy.js unresolved_friction_rule body still tested 'unset' literal

**Source task:** Task 4 (FRICTION arity 4→5)
**Surfaced by:** quality reviewer (confidence 92, Critical)
**Description:** Plan's M3 mitigation bumped the rule body pattern arity 4→5 but preserved the `'unset'` literal in slot 5. Post-Task-4, disposition is required + closed-enum constrained to FRICTION_DISPOSITIONS — `'unset'` cannot reach the EDB. Rule body permanently false → `unresolved_friction` never derives → closure gate's friction-blocking arm silently broken (false-green tests via `not unresolved_friction` always satisfied).

**Resolution applied inline (commit 9445616):** Dropped the disposition-value match in the rule body atom: `['friction', ['F', '_', '_', '_', 'unset']]` → `['friction', ['F', '_', '_', '_', '_']]`. The `not friction_disposition(F, _)` clause carries the unresolved-detection load on its own — that was always the load-bearing literal; the `'unset'` check was a redundant secondary signal that became structurally invalid when disposition went required + closed-enum. Comment above the rule updated to document the shift in semantics. Full test suite re-run: 345/345 pass.

**Note for future planning:** Plan's M3 should have addressed this when it bumped the arity. The same false-green pattern that M2 caught for `addresses` migration — predicate-shape changes invalidating downstream rule body atoms — applies to value-constraint changes too. Future analogous reshapes should audit all rule body atoms for both arity AND value-literal references against the new schema.

### DEF-9-NEW: friction-schema.test.js lacks withdrawn-friction render test

**Source task:** Task 4
**Surfaced by:** quality reviewer (confidence 82, Minor)
**Description:** AC-9.3 render block applies `live()` to filter withdrawn frictions, but friction-schema.test.js doesn't include a "withdrawn friction does not appear in renderStructuredProof" test. Other element types with render blocks have withdrawal-path tests elsewhere. The new Frictions section's withdrawal path is untested.

**Why deferred:** Coverage gap, not a correctness bug. The `live()` helper is well-tested for other categories so the mechanism is verified; the FRICTION-specific application just lacks the parallel test. Lands naturally in a future test-coverage revisit.

---
