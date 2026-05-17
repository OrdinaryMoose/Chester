# Plan Threat Report — sprint-02-bug-fix-02

**Plan reviewed:** `sprint-02-bug-fix-02-plan-00.md` (post plan-reviewer fidelity pass)
**Reviewers:** `chester:plan-build-plan-attacker` + `chester:plan-build-plan-smeller` (parallel, named subagents, never fork)
**Smell heuristic match:** triggered on 2 of 5 categories — new abstractions (`referenceFields` / `nonEmptyArrayFields` directives, `_CATEGORY_PROBES_SCHEMA` constant) and new contract surfaces (`verifyArgsShape` third parameter, `INVALID_REFERENCE` error code, three new EDB predicates).
**Date:** 2026-05-17

## Combined risk level: SIGNIFICANT

Three plan-text errors would block TDD at Tasks 2-4 even with a correct mental model of the architecture. Two of those errors are independent (test imports, test assertions); one (`'phase'` drop) is a silent data-loss bug introduced by the plan's explicit replacement block. One convergent finding (error-object throw shape) appeared in both reviews from different angles. The architecture itself is sound — every finding targets plan text, not the design.

### Why SIGNIFICANT, not HIGH

- The design is unchanged from spec-01. No architectural rework needed.
- All findings have cheap, localized fixes — total mitigation effort is roughly 15-30 minutes of plan edits.
- Convergent finding signals the issue is structural rather than framing — one fix tightens both review surfaces.

### Why SIGNIFICANT, not MODERATE

- TDD's "confirm the test fails" step would produce an import-time `ReferenceError` (TRANSLATORS) or a wrong-format assertion (projection facts are tuples not strings), not a behavioral failure. The TDD discipline relies on that step distinguishing "test wrong" from "implementation wrong." Plan errors at Step 2 invalidate the gate.
- The `'phase'` drop from `EDB_PREDICATES` is silent data loss the plan introduces. It would land in main.

## Findings — plan-attacker (8 total)

- **CRITICAL — F1: `TRANSLATORS` is not exported from `translation.js`.** Tasks 2 + 3 + 5 test code calls `TRANSLATORS[ELEMENT_CATEGORIES.PERMISSION](...)` directly, but `translation.js:12` declares `const TRANSLATORS = Object.freeze({...})` with no `export`. The only public translation function is `translate()`. Existing `proposition-schema.test.js` from bug-fix-01 uses `translate()`, not `TRANSLATORS`. The plan's TDD Step 2 ("confirm tests fail") would produce a module-resolution error, not a behavioral failure. Mitigation: rewrite test snippets to use `translate(ELEMENT_CATEGORIES.PERMISSION, args, id, ts)`, or export `TRANSLATORS` from `translation.js`.
- **SIGNIFICANT — F2: Error throw shape mismatch.** Plan's Watch-Item 5 says "use the existing throw-object shape (plain object, not an Error subclass)" but the existing pattern in `schema.js:107-128` is `Object.assign(new Error(...), { code, field })` — Error instances with extra properties. The plan's proposed loops use plain `throw { code, field, ... }`. Inconsistent within the same function after the change. Mitigation: rewrite the proposed loops to use `Object.assign(new Error(msg), { code, field, referencedId })` and update Watch-Item 5 to reflect the actual pattern.
- **SIGNIFICANT — F3: `EDB_PREDICATES` replacement silently drops `'phase'`.** `translation.js:191` includes `'phase'` in the current set. The plan's Task 2 Step 4 replacement block omits it while saying "preserve all existing entries." The implementer using the explicit block verbatim drops the entry. Mitigation: either provide an incremental edit instruction ("add `'permission'`, `'permission_scope'`, `'risk_basis'` to the existing set") or correct the replacement block to include `'phase'`.
- **SIGNIFICANT — F4: Task 4 projection test assertions use string operations on array tuples.** Plan test snippets use `out.facts.some(f => f.startsWith('permission(')` and `.toContain('high')`, but `renderDatalogProjection` returns `out.facts` as an array of `[predicate, argsArray]` tuples (per existing tests at `render.test.js:75-80` using `f[0] === 'reasoning_chain'`). Assertions would always fail (or throw TypeError). Mitigation: rewrite Task 4 Step 1 projection assertions to use tuple-index access (`f[0] === 'permission'`, `f[1].includes('rule_1')`, etc.).
- **MODERATE — F5: Naming/probe-table consistency.** Plan-attacker traced through and ultimately found the plan correct here. Non-actionable.
- **MODERATE — F6: Task 6 step ordering — Step 3 references `expectedCount` filled in Step 4.** Step 5 (run probe) can't run until Step 3's placeholder is filled, which requires Step 4 to complete first. Mitigation: reorder steps — Step 4 fixture changes come before Step 3 assertion writes.
- **MODERATE — F7: Plan mischaracterizes current probe state.** Plan says "the probe currently submits PERMISSION without `relieves` and RISK without `basis`" — but the probe (lines 183-198, 253-267 of cascade-spec-probe-simulation.mjs) already submits them. The work in Task 6 Step 4 is therefore narrower than described — mainly updating the header comment and ensuring the multi-element basis array shape, not replacing whole submission attempts. Mitigation: revise Task 6 Step 4 instructions to match actual probe state.
- **LOW — F8: Task 1 Step 3 pseudo-code omits `return args`.** Existing `verifyArgsShape` returns `args` per `schema.js:131`. Existing test at `schema.test.js:62` asserts return value, so the omission would be caught — but the plan should show the return for completeness. Mitigation: add `return args;` to the end of the proposed function body.

## Findings — plan-smeller (5 total)

- **MEDIUM — S1: Error-object shape inconsistency.** Convergent with F2. Both reviewers independently flagged this. Same mitigation.
- **MEDIUM — S2: `_CATEGORY_PROBES_SCHEMA` uses string keys; `_CATEGORY_PROBES` uses `ELEMENT_CATEGORIES` symbol keys.** Schema-side probe is keyed by `evidence`, `rule`, `permission` (strings) while mutations-side probe is keyed by `ELEMENT_CATEGORIES.EVIDENCE`, etc. (symbols). Future descriptors that add `referenceFields` constraints must add entries to schema-side using the right convention; no static enforcement. Mitigation: use `ELEMENT_CATEGORIES.EVIDENCE` etc. as keys in `_CATEGORY_PROBES_SCHEMA` so the two tables share the same key convention.
- **LOW — S3: Descriptor directive proliferation.** Property count per descriptor reaches 10; `validateCategoryRegistry` checks 4. Widening gap between "what descriptors contain" and "what boot validation enforces." No immediate action — flagged as a trend.
- **LOW — S4: `permission_decl/2` + `permission/3` naming-convention fragility.** Future callers may confuse declaration vs linkage facts. Documentation-only concern.
- **LOW — S5: `readPort.exists` interface implicit, not documented.** The cross-layer coupling between schema's directive consumer and the query port's `exists` signature is one of those "works today, brittle later" patterns. No immediate action.

## Convergent finding

F2 + S1 — error-object throw shape. The plan's `throw { code, field, ... }` plain-object form is inconsistent with the existing `Object.assign(new Error(...), { code, field })` pattern in the same function. Both reviewers independently flagged it. Fixing this once aligns the plan to the codebase pattern, removes the contradiction in Watch-Item 5, and addresses both review surfaces in one edit.

## Recommended mitigation set

If the user chooses "proceed with directed mitigations," apply these inline:

1. **F1**: Rewrite Tasks 2, 3, 5 translator test snippets to call `translate(category, args, id, ts)` instead of `TRANSLATORS[category](...)`. Verify the return shape (`translate` returns the full `{baseFacts, rules, metaFacts}` object per `translation.js:89-100`).
2. **F2 + S1 (convergent)**: Update Watch-Item 5 to read "Use `Object.assign(new Error(msg), { code, field, referencedId })` matching the existing `verifyArgsShape` pattern." Rewrite both new loops (nonEmptyArrayFields and referenceFields) in Task 1 Step 3 to use the matching pattern.
3. **F3**: Replace the explicit `EDB_PREDICATES` block in Task 2 Step 4 with an incremental edit instruction. Also do this in Task 3 for `risk_basis`.
4. **F4**: Rewrite Task 4 Step 1 projection assertions to use tuple-index access (`f[0]`, `f[1][N]`).
5. **F6**: Reorder Task 6 steps — fixture changes (currently Step 4) before assertion writes (currently Step 3).
6. **F7**: Correct Task 6 Step 4 description to match actual probe state.
7. **F8**: Add `return args;` to Task 1 Step 3's verifyArgsShape body.
8. **S2**: Change `_CATEGORY_PROBES_SCHEMA` to use `ELEMENT_CATEGORIES.<NAME>` symbol keys (import from `tags.js` already in scope).

S3, S4, S5 are accepted as documentation debt for this sprint; no plan changes.

## Estimated mitigation effort

- F1, F4, S2: each ~3-5 minutes of plan editing (find-and-replace patterns)
- F2 + S1, F3, F6, F7, F8: each ~2 minutes
- **Total: ~20-30 minutes**

No re-dispatch of attacker/smeller required after mitigations — all findings are plan-text errors with localized fixes; the architecture is unchanged.

---

<!-- produced-by plan-build@v0004 -->
