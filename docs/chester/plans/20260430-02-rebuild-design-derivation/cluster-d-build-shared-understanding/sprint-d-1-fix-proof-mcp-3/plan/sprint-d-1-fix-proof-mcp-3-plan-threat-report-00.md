# Plan Threat Report — sprint-d-1-fix-proof-mcp-3

**Plan reviewed:** `sprint-d-1-fix-proof-mcp-3-plan-00.md`
**Date:** 2026-05-09
**Reviewers:** `chester:plan-build-plan-attacker` (adversarial), `chester:plan-build-plan-smeller` (forward-looking smell)
**Status:** All actionable findings addressed inline. Post-fix risk level: **Low**.

---

## Smell Heuristic Pre-Check

`plan-smell` fired in parallel with `plan-attack`. Triggers matched:

- **New abstractions** — the `state-render.js` module introduces markdown primitive helpers (`renderHeading`, `renderBullet`, `renderSubBullet`), a heuristic helper (`isOutsizedRule`), seven per-type render functions, and a `findElementById` storage-routing dispatch.
- **New contract surfaces** — `render_proof_state` is a new public MCP tool with its own input schema, dispatcher case, and exported handler.

DI registrations, async/concurrency primitives, and new persistence pathways did not trigger.

---

## plan-attack Findings

### HIGH — Off-by-one in Task 4 ID-ascending sort test (RESOLVED)

**Site:** Task 4 Step 1 — `it('orders elements within a section in ID-ascending numeric order', ...)`.

**Issue:** Loop ran `i < 6`, producing only NCON-4 through NCON-9 after the explicit NCON-3 add. NCON-10 was never created; the assertion `expect(idxNCON10).toBeGreaterThan(idxNCON3)` would have failed unconditionally because `indexOf('NCON-10')` returns -1.

**Resolution:** Loop now runs `i < 7` so the counter pushes through NCON-10. Added inline comment explaining the seed/loop math (NCON-1, NCON-2 from `seedFullProof`, NCON-3 from the explicit add, NCON-4..NCON-10 from the loop).

### MEDIUM — Mid-file import statements in append snippets (RESOLVED)

**Site:** Tasks 2, 3, 4, 5 each show `import` lines at the top of their code snippets, with the surrounding text saying "append" — but ESM requires imports at the file's top.

**Issue:** A literal append would produce a syntax error at the first mid-file import. Even though competent implementers would hoist imports automatically, the plan did not state this rule, leaving room for confusion under subagent-driven execution.

**Resolution:** Added an "Implementer Notes" block to the plan header documenting the import-hoisting rule, plus the related instruction to merge new imports into the existing top-of-file block rather than duplicating.

### LOW — `deriveClosingArgument`'s `cited` spread (NO ACTION)

**Site:** Task 1's refactor skeleton shows only a partial `deriveClosingArgument` body, with the existing `cited` array (lines 88-97 of `closing-argument.js`) implicitly preserved.

**Verification:** The reviewer verified that `cited` spreads `activeNCs`, `activeRules`, `activePermissions`, `activeRisks` — all four exist by name after the refactor as locally-bound variables derived from the partition. The spread compiles unchanged. No plan action needed; flagged as a thing the implementer should consciously verify when reviewing the diff.

### LOW — Spec's Data Flow line still references `state.definitions` lookup (NO ACTION)

**Site:** Spec line 31 says `findElementById` routes to `state.definitions`, but AC-3.3 (the normative AC) scopes `DEFN-` out and routes it to `null`. The plan correctly follows AC-3.3.

**Resolution:** No plan change. Flagged as a residual spec-text inconsistency; AC-3.3 is authoritative and the plan implements the right behavior.

---

## plan-smell Findings

### MEDIUM — `renderConcern` did not surface withdrawal disposition via `elementMeta` (RESOLVED)

**Site:** Task 3's `renderConcern` used `c?.status ?? 'unknown'` directly for the metadata segment, while the seven other per-type render functions use `elementMeta(el)`.

**Issue:** AC-3.2 requires that deep render of a withdrawn element surface its `withdrawal_disposition`. A withdrawn concern reached via `renderElementDeep('CERN-1', state)` would have shown only `'withdrawn'` with no disposition string, violating the AC for the concern path.

**Resolution:** `renderConcern` now calls `elementMeta(c)` like every other per-type render function. Concerns do not currently carry a `withdrawal_disposition` field, so `elementMeta` falls back to `'unclassified'` for withdrawn concerns — which matches the proof MCP's `UNCLASSIFIED_DISPOSITION` convention. Added an inline comment explaining the fallback.

### MEDIUM — `rejected_alternatives` array coerced via `Array.toString()` (RESOLVED)

**Site:** Task 3's `renderNC` passed `el.rejected_alternatives` directly to `renderSubBullet`, which uses template-literal interpolation (`${value}`). For a non-empty array, this triggers `Array.prototype.toString()` and emits `'alt one,alt two'` — comma without space, inconsistent with the explicit `(el.grounding ?? []).join(', ')` pattern used for the grounding sub-bullet.

**Issue:** The output quality defect was not caught by any test in the plan because `expect(out).toContain('rejected_alternatives')` passes regardless of the array's string format.

**Resolution:** `renderNC` now joins `rejected_alternatives` with `'; '` (semicolon plus space, since alternatives can themselves contain commas) and passes `null` to `renderSubBullet` when the array is empty — letting `renderSubBullet`'s null-guard suppress the sub-bullet entirely. Inline comment explains the join choice.

### MEDIUM — Spec-vs-plan divergence on `DEFN-` routing (NO ACTION; PLAN CORRECT)

**Site:** Spec's Components section, Data Flow section, and Testing Strategy section mention `state.definitions` and `DEFN-` as part of the multi-storage lookup; AC-3.3 (the normative AC) and the spec's Components partitioner contract scope `DEFN-` out and route it to `null`. The plan follows AC-3.3.

**Resolution:** No plan change. The plan's `findElementById` correctly returns null for `DEFN-` IDs and tests the null-return path. The spec's narrative sections retain residual references to DEFN-routing that were not updated when AC-3.3 was scoped down during the spec's review chain. AC-3.3 is authoritative; the plan implements the correct behavior.

### LOW — `renderProofRecap(state, partition)` signature (NO ACTION)

**Site:** Task 4's top-level export `renderProofRecap` takes two parameters but reads only `state.problemStatement` from the first.

**Resolution:** Conscious design choice already documented in JSDoc on the function. The alternative (passing `problemStatement` as a scalar) would be cleaner but introduces a small refactor cost without clear benefit. Left as-is.

### LOW — `isOutsizedRule` and `renderRule` both run the sub-clause regex (NO ACTION)

**Site:** Task 2's `isOutsizedRule` counts numbered sub-clauses; Task 3's `renderRule` outsized branch independently re-counts via the same regex.

**Resolution:** Conscious duplication called out in the plan. A `countSubClauses(statement)` helper would eliminate the duplication. Implementer can choose to refactor at code time; no plan action required.

---

## Combined Risk Level (post-fix)

**Low.**

Reasoning:

1. The single HIGH finding (off-by-one in Task 4) was a definite test failure that has been corrected at the source — Task 4 Step 1 will now produce a passing test once implementation lands.
2. The two structural MEDIUMs (import hoisting, `renderConcern` not using `elementMeta`) reflected ambiguity rather than design defects; both fixes tighten the plan's executability without changing scope.
3. The output-quality MEDIUM (`rejected_alternatives` array coercion) was a silent defect no test caught; the fix introduces explicit join semantics and re-uses the existing null-guard path.
4. The spec-vs-plan DEFN- divergence is a known residual spec-text issue. The plan correctly follows AC-3.3 (the normative AC); the spec narrative sections will receive errata cleanup at the next spec revision.
5. Verified anchors (TOOLS array shape, dispatcher pattern, state.js exports, return arities, ID conventions) all check out at the actual line numbers cited. The plan's refactor targets are real; the partitioner extraction is byte-preserving for `deriveClosingArgument`'s public contract.

No remaining HIGH findings. No outstanding contradictions between plan and spec on normative ACs. The plan is ready for execution under subagent mode.

---

## Decision Options for the Designer

1. **Proceed.** Move to plan-build's Execution Mode Selection → Save Plan → Execute Write.
2. **Proceed with directed mitigations.** Designer specifies additional safeguards beyond what's in the plan.
3. **Return to design with additional requirements.** Re-open the design conversation with new constraints.
4. **Stop.** Halt the sprint pending further investigation.

Recommended path given post-fix risk level: **Proceed.**

<!-- created-at: 2026-05-09T11:56:42Z -->
<!-- produced-by plan-build@v0004 -->
