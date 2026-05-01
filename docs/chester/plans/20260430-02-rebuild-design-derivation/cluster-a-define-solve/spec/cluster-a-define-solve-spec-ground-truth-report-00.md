# Ground-Truth Report — cluster-a-define-solve

**Spec reviewed:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-a-define-solve/spec/cluster-a-define-solve-spec-01.md`
**Date:** 2026-04-30
**Status:** Findings (2 MEDIUM addressed inline; 1 MEDIUM rejected on second-pass verification; 3 LOW noted)

## Summary

Spec's claims about existing code are largely accurate. All major file:line anchors, function signatures, validation patterns, and integration points verified against source. Two MEDIUM findings concerned spec text imprecision and were fixed inline (brief-template anchor blocks; AC-7.1 wording). One MEDIUM finding (RULE-5 vs RULE-4 ambiguity) was rejected after second-pass verification confirmed the master-plan rule numbering matches the spec's citations exactly. Three LOW findings retained as implementer context.

## Verified Claims

- `proof.js:13-15` — `ELEMENT_TYPES` array with five entries.
- `state.js:16-22` — `ID_PREFIX` map with five entries.
- `state.js:29-44` — `initializeState` returns the structure spec describes.
- `state.js:100-122` — `applyOperations` revise branch accepts `statement, grounding, basis, collapse_test, reasoning_chain, rejected_alternatives, relieves`. `problem_anchor` is correctly identified by spec as a needed addition.
- `proof.js:24-94` — `createElement` shape and per-type validation blocks for the five existing types.
- `proof.js:241-266` — `checkStaleGrounding` pattern (spec correctly cites this as the analog for the sentinel `checkStaleRatification`).
- `proof.js:273-280` — `checkAllIntegrity` aggregates four warning sources.
- `metrics.js:202-274` — `checkClosure` six conditions; reasons appended as strings.
- `metrics.js:21-66` — `computeCompleteness` per-type counts pattern.
- `server.js:11` — local `ELEMENT_TYPES` constant.
- `server.js:43-67` — `submit_proof_update` per-operation properties shape.
- `server.js:102-110` — switch dispatch handles three tools.
- `server.js:180-181` — `handleSubmitProofUpdate` already maps `closure_permitted` / `closure_reasons` into the response.
- `server.js:187-212` — `handleGetProofState` shape.
- `state.js:191-208` — `saveState`/`loadState` plain JSON serialization.
- `proof-mcp/package.json:7-17` — vitest test framework.
- `design-specify/SKILL.md:230` — "8-section envelope" string.
- `state.test.js:21-23` — `elementCounters` `toEqual` shape assertion that requires update.
- `proof.test.js:14-20` — `ELEMENT_TYPES` test asserts the five-entry array; requires update.
- `master-plan.md:179-188` — RULE-1 through RULE-10. Spec's rule citations (RULE-1, RULE-3, RULE-5, RULE-7, RULE-9, RULE-10) all match master plan numbering exactly.

## Findings (addressed)

### MEDIUM (FIXED) — Brief-template line-range anchor under-specified

**Spec said (pre-fix):** "Replace the existing Section 8 ('Acceptance Criteria') block (currently around lines 170-180) with two new sections... Update the section-ordering summary block (currently around line 184) to reflect the new section names."

**Code shows:** Three discrete blocks need updating, not two:
1. `design-brief-template.md:170-180` — heading + prose + code block.
2. `design-brief-template.md:186-193` — Section Ordering Summary numbered list (item 8 at line 193).
3. `design-brief-template.md:195` — count prose "All eight sections are required".

**Fix applied:** Spec's Components — `design-brief-template.md` block now enumerates three update blocks with explicit line refs and changes the section numbering from `8a/8b` to flat `8/9` to match the template's existing convention. (Updated section in spec-01.md.)

### MEDIUM (FIXED) — AC-7.1 wording too tight

**Spec said (pre-fix):** "no test was updated to accommodate the new logic."

**Code shows:** `state.test.js:21-23` `expect(state.elementCounters).toEqual({...5 entries...})` requires extension to include `RESOLVE_CONDITION: 0`. Same for `proof.test.js:14-20` `ELEMENT_TYPES` toEqual assertion. AC-7.1 as originally written would fail by construction.

**Fix applied:** AC-7.1 observable boundary now distinguishes "validation-logic tests" (untouched) from "shape-enumeration tests" (extended to include the sixth type without changing existing entries). (Updated AC-7.1 block in spec-01.md.)

### MEDIUM (REJECTED) — RULE-5 numbering claimed ambiguous

**Reviewer said:** Spec cites RULE-5 for "design = what not how" but master CLAUDE.md doesn't number this principle and reviewer was unable to confirm against master-plan.md.

**Verification:** `master-plan.md:183` declares `RULE-5 — Design = the problem (what), not the implementation (how)`. Spec's citation is exact. The brief's citation at `cluster-a-define-solve-design-00.md:36` also matches. No discrepancy exists.

**Disposition:** No spec change.

## Findings (LOW — context only)

### LOW — Skeleton stub file `acceptance.test.js` not enumerated in spec

**Code shows:** `proof-mcp/__tests__/acceptance.test.js` exists with pending stubs keyed to spec's AC IDs (auto-scaffolded by design-specify).

**Disposition:** Plan-build/execute-write fills these stubs. Skeleton manifest at `spec/cluster-a-define-solve-spec-skeleton-00.md` is the canonical index. Not a contradiction — just unstated context. No spec change required.

### LOW — `applyOperations` revise extension may be over-gated by type

**Code shows:** existing revise branch at `state.js:106-112` is a sequence of unconditional `if (op.X !== undefined) target.X = op.X` per known field. The simpler addition is one line: `if (op.problem_anchor !== undefined) target.problem_anchor = op.problem_anchor`. Type gating (only-on-RC) would diverge from the existing pattern.

**Disposition:** Spec's textual phrasing mentions RC context to clarify *which* fields are semantic for RC; the actual field-write does not need a type gate. The clearing-on-revise check IS type-gated (only RC elements have a ratification field that could be cleared). Implementer should add the field-write unconditionally and the clearing check conditionally. No spec change required — clarification belongs in plan-build's task decomposition.

### LOW — AC-4.2 schema test brittleness

**Code shows:** AC-4.2 verifies `ratify_resolve_condition`'s schema by source-text inspection. Stronger observable would be a behavior assertion (call handler with array, confirm rejection). Acceptable as-is for a documentation-style AC.

**Disposition:** No spec change. Implementer may strengthen during execute-write at their discretion.

## Risk Assessment

Spec accurately describes the codebase it targets. Two MEDIUM text-precision issues fixed inline; one MEDIUM unfounded after verification. No HIGH findings. Three LOW notes retained as implementer-friendly context. Plan-build and execute-write proceed without surprises on file paths, signatures, integration points, or pattern reuse.
