# Deferred Items — sprint-02-bug-fix-02

Items surfaced during execute-write that are valid follow-up improvements but out of scope for this sprint. Reviewed at finish phase.

---

## 2026-05-17 — T3 quality reviewer

### DEF-1: RESOLUTION descriptor should declare `referenceFields: { addresses: 'risk' }`

**Source task:** T3 (RISK end-to-end)
**Surfaced by:** quality reviewer (confidence ~75)
**Description:** RESOLUTION's `addresses` field is a required array that references RISK elements per cascade §3.6. The `referenceFields` mechanism added in T1 supports this directly. RESOLUTION currently has `referenceFields: {}` (the T1 backfill empty default). Adding `referenceFields: { addresses: 'risk' }` would close the same silent-drop class of bug for RESOLUTION that this sprint closes for PERMISSION and RISK.

**Why deferred:** Out of scope per AC-9.1 (sprint scoped to PERMISSION/RISK closure). Adding RESOLUTION coverage would expand the sprint and was not in the brief. Naturally lands in a future sub-sprint when RESOLUTION undergoes its own structural review (currently planned as sprint-02-bug-fix-05 for problem_anchor + grounding[] split).

---

### DEF-2: Cross-reference comment in render.js pointing to schema.js arity note

**Source task:** T3 (RISK end-to-end)
**Surfaced by:** quality reviewer (confidence ~70)
**Description:** `_CATEGORY_PROBES_SCHEMA` in schema.js has a comment noting `RISK: ['risk', 3]` is correct against the translator's arity-3 emission. Until T4 lands, `render.js`'s `_ARITIES.risk: 2` and `PROJECTION_ARITIES.risk: 2` are inconsistent with this comment. A cross-reference comment in render.js pointing to schema.js's note would aid the T4 implementer.

**Why deferred:** T4 already plans both arity corrections (AC-5.3 and AC-5.5). The cross-reference comment becomes moot once T4 lands. If T4's implementer ends up confused by the mismatch, they should resolve it inline; otherwise dropping this item is fine.

---

## 2026-05-17 — T4 quality reviewer

### DEF-3: Tighten `permission/3` sub-line query in renderStructuredProof

**Source task:** T4 (Render layer)
**Surfaced by:** quality reviewer (confidence 82, Minor)
**Description:** The PERMISSION sub-line query at `render.js:44` uses `['permission', [p.I, { var: 'S2' }, { var: 'R' }]]` — an unbound `S2` variable for the statement slot even though `p.S` already holds that value. Tightening to `['permission', [p.I, p.S, { var: 'R' }]]` eliminates a spurious unbound variable, makes the query more precise, and is self-documenting. No correctness risk; minor precision opportunity.

**Why deferred:** Minor finding (confidence 82) per Section 2.1 ("Minor: Note and move on"). No behavior change; pure code-quality polish. Lands naturally in any future render-layer revisit.

---

## 2026-05-17 — T5 quality reviewer

### DEF-4: Fold AC-6.4 into AC-6.1 in permission-schema.test.js (or comment the dual-style intent)

**Source task:** T5 (Per-category test files)
**Surfaced by:** quality reviewer (confidence 82, Minor)
**Description:** AC-6.1 and AC-6.4 in `permission-schema.test.js` (and similarly in `risk-schema.test.js`) verify the same INVALID_REFERENCE error shape via two assertion styles — `expect.objectContaining({code, field, referencedId})` and individual property `.toBe` assertions. Both already avoid `stack` per Watch-Item 8. The duplication may confuse a future reader. Either consolidate or add a comment explaining the dual-style intent.

**Why deferred:** Minor finding; no correctness risk. Test redundancy is cheap insurance, not damage.

### DEF-5: Extract `makeRealBridge` helper to a shared `_fixtures/` module

**Source task:** T5 (Per-category test files)
**Surfaced by:** quality reviewer (confidence 80, Minor)
**Description:** `makeRealBridge` is now defined identically (semantically) in three test files: `proposition-schema.test.js` (bug-fix-01), `permission-schema.test.js`, and `risk-schema.test.js`. A future bridge constructor signature change requires three coordinated edits. Extracting to `_fixtures/makeRealBridge.js` would consolidate.

**Why deferred:** Pre-existing pattern from bug-fix-01 that this sprint compounds rather than introduces. Outside this sprint's AC-9.1 scope. Worth picking up the next time any of these three test files is touched for substantive reasons.

---

## 2026-05-17 — T6 quality reviewer

### DEF-6: Tighten H-3 probe assertion to check specific element IDs (not just row count)

**Source task:** T6 (Probe regression extension)
**Surfaced by:** quality reviewer (confidence 85, Minor)
**Description:** The H-3 `risk_basis/2` assertion checks only the row count (`riskBasisRows.length === 2`). A regression that spread the basis into the wrong element IDs (e.g. swap-mutation: correct count, wrong elements) would pass silently. Mitigate by also asserting set-equality on the `E` values vs `[evForRiskBasisA.id, evForRiskBasisB.id].sort()`. Pattern already used in `render.test.js` for the Basis sub-line.

**Why deferred:** Minor finding (confidence 85). Current assertion catches the most likely regression (one of two facts not landing); the swap-mutation scenario is a less common failure mode. Tightening is one-line ROI but not blocking.

---

## 2026-05-17 — Full sprint code reviewer

### DEF-7: Structural test for probe-table sync (`_CATEGORY_PROBES` ↔ `_CATEGORY_PROBES_SCHEMA`)

**Source task:** Full sprint code review (post-T6)
**Surfaced by:** code reviewer (confidence 90, Important)
**Description:** `mutations.js:_CATEGORY_PROBES` (array of `[category, predicate, arity]` triples) and `schema.js:_CATEGORY_PROBES_SCHEMA` (object of `category → [predicate, arity]`) must agree on every triple. A divergence would mean `referenceFields: { x: 'rule' }` could accept an id that RATIFY's `_resolveElementCategory` would reject (or vice versa). The schema.js comment notes "S2-mitigation discipline" but no test enforces it. Recommend either a structural test asserting agreement (lives in `__tests__/` or `structural-tests/`) or factoring the truth into a third module both consume.

**Why deferred:** Either approach requires exporting module-private symbols or restructuring imports — interface tax that warrants its own design pass rather than a sprint-close fix. The duplication works correctly today; the drift risk is forward-looking.

### DEF-8: Update cascade `05-domain-spec.md` §3.5 to reflect `risk/3 + severity`

**Source task:** Full sprint code review (post-T6)
**Surfaced by:** code reviewer (confidence 85, Important)
**Description:** Cascade §3.5 says "Fact: `risk(RiskId, Statement)`" (arity 2). Implementation has always emitted `risk(id, statement, severity)` at arity 3. Sprint D2 explicitly accepted retaining `severity` as optional per impl; this sprint corrected the arity tables to match. The cascade was not updated. Future readers will re-discover the "divergence" as a bug. Either update cascade §3.5 to document `risk(RiskId, Statement, Severity)`, or open a cascade-divergence record.

**Why deferred:** AC-9.1 scope discipline confines this sprint to `skills/design-proof-system/references/domain/` and `docs/chester/working/stress-tests/20260517-01/`. Touching `design-documents/` would violate scope. The cascade-document divergence gate at `finish-archive-artifacts` is the natural surface for this; otherwise the next cascade-aligned sub-sprint should handle it.

### DEF-9: `permission_decl/2` → `permission/3` migration (retire dual emission)

**Source task:** Full sprint code review (post-T6)
**Surfaced by:** code reviewer (confidence 80, Minor)
**Description:** Translator emits both `permission_decl(id, S)` and `permission(id, S, R)`, overlapping `(id, S)` data across two predicates. Preservation of `permission_decl` is for `_CATEGORY_PROBES` RATIFY support (avoided cross-cutting probe-table edit this sprint). Future migration: move `_CATEGORY_PROBES.permission` to `permission/3` and retire `permission_decl` entirely.

**Why deferred:** Explicitly out-of-scope per spec preamble ("Translator emission strategy: Keep permission_decl/2 as the probe-table-facing declaration predicate AND add permission/3 as the new linkage fact"). Hygiene tax (one redundant predicate per permission in Datalog projection) accepted intentionally.

### DEF-10: Document `_CATEGORY_PROBES_SCHEMA` id-allocator assumption

**Source task:** Full sprint code review (post-T6)
**Surfaced by:** code reviewer (confidence 80, Minor)
**Description:** `_existsCategory` relies on element-ID prefixes (`rule_N`, `perm_N`, etc.) ensuring no cross-category collision when probing by id. Same assumption as mutations.js's `_resolveElementCategory`. If the id allocator ever changes (e.g., uuids without category prefix), `referenceFields` checks could return false positives. Recommend a comment in `_CATEGORY_PROBES_SCHEMA` explicitly tying its correctness to the id allocator's category-prefix contract.

**Why deferred:** Comment-only addition; correctness unchanged. Low priority — picks up naturally the next time schema.js is touched.

---

<!-- produced-by execute-write@v0001 -->
