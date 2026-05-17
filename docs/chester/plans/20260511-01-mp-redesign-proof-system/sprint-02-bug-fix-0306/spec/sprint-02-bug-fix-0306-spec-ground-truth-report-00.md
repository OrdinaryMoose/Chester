# Ground-Truth Report — sprint-02-bug-fix-0306 spec

**Spec reviewed:** `sprint-02-bug-fix-0306-spec-01.md` (post-adversarial-fix state)
**Date:** 2026-05-17
**Result:** 2 MEDIUM (path corrections), 2 LOW (cosmetic / framing). All addressable inline; spec-02 incorporates fixes.

## Verified Claims

- `verifyArgsShape` signature at `skills/design-proof-system/references/domain/schema.js:165` — CONFIRMED
- `risk_basis` spread translator pattern at `skills/design-proof-system/references/domain/translation.js:50` — CONFIRMED (D2 mirror)
- `_existsCategory` / `_existsAnyCategory` wildcard `'*'` path at `schema.js:22-41` — CONFIRMED
- `sourceConstraint` validator at `skills/design-proof-system/references/domain/boot-validators.js:57-58` — CONFIRMED
- `validateCategoryRegistry` does NOT inspect `closedEnumFields`, so adding `closedEnumFields: { source: EVIDENCE_SOURCE_ENUM }` introduces no boot-validator concern — CONFIRMED (boot-validators.js:50-64)
- `makeRealBridge` factory + `createDomainBridge` + real `Engine` test pattern at `skills/design-proof-system/references/domain/__tests__/permission-schema.test.js:14-28` and `risk-schema.test.js:14-28` — CONFIRMED
- `EDB_PREDICATES` contains `'grounding'` and `'addresses'` at `translation.js:193-202` — CONFIRMED (both are removed per AC-1.5 and AC-5.5)
- `PROJECTION_ARITIES` contains `grounding: 2`, `addresses: 2` at `render.js:174-185` — CONFIRMED
- `_ARITIES.friction === 4` at `render.js:87` — CONFIRMED (target arity 5 per AC-6.3)
- `renderStructuredProof` at `render.js:20-75` has no Frictions section — CONFIRMED (AC-9.3 adds new section)
- `INFERENCE_PATTERNS` at `tags.js:20-25` has four values (GROUNDS_IMPLY_CONCLUSION, ABSENCE_IMPLIES_ABSENCE, ENABLEMENT, STRUCTURAL) — CONFIRMED; spec correctly identifies removals
- `FRICTION_SHAPES` and `FRICTION_DISPOSITIONS` already exist at `tags.js:27-35` — CONFIRMED (spec's "if not already present" is moot)
- PROPOSITION descriptor at `schema.js:81` has `grounding` in `requiredFields` but not in `nonEmptyArrayFields` — CONFIRMED (AC-1.1 adds the directive)
- EVIDENCE descriptor at `schema.js:45` uses `claim` with empty `closedEnumFields` — CONFIRMED (AC-3.1, AC-4.1 reshape)
- DEFINITION descriptor at `schema.js:141` uses `term` — CONFIRMED (AC-7.1 rename)
- RESOLUTION descriptor at `schema.js:105` uses `addresses` — CONFIRMED (AC-5.1 reshape)
- FRICTION descriptor at `schema.js:117` uses `shape`/`description`, no `anchor_a`/`anchor_b` — CONFIRMED (AC-6.1 reshape)
- RESOLUTION rule template at `translation.js:121-132` — CONFIRMED unchanged (AC-5.5 clarification)
- `proposition_decl/3` translator with `inference_pattern` as 3rd positional arg at `translation.js:36` — CONFIRMED (AC-9.1 query path)
- Probe attempt numbering: DEFINITIONs=[02][03][04]; EVIDENCE=[05][06][07][08][09]; PROPOSITIONs=[15][16][17]; RESOLUTIONs=[25][26]; FRICTION=[27]; Phase 10b arrays=[30][31] — CONFIRMED all spec-cited numbers

## Findings

### MEDIUM-1: Test file paths wrong throughout spec

**Spec says:** `__tests__/evidence-schema.test.js`, `__tests__/resolution-schema.test.js`, `__tests__/friction-schema.test.js`, `__tests__/definition-schema.test.js`, `__tests__/proposition-schema.test.js`, `__tests__/render.test.js`

**Code shows:** Precedent test files live at `skills/design-proof-system/references/domain/__tests__/permission-schema.test.js` and `risk-schema.test.js`. No `__tests__/` directory exists at repo root.

**Impact:** Implementer would create files under non-existent top-level `__tests__/`; test discovery would miss them; AC-12.2 scope-diff would never match.

**Fix:** Replace all `__tests__/...` in spec with `skills/design-proof-system/references/domain/__tests__/...`

### MEDIUM-2: Cascade-spec file path wrong throughout spec

**Spec says:** `design-documents/cascade/05-domain-spec.md`

**Code shows:** Only `05-domain-spec.md` in repo lives at `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/05-domain-spec.md`. No `design-documents/cascade/` subdirectory exists.

**Impact:** Cascade edits (§3.4 and §3.5) would target nonexistent path; Divergence Gate wouldn't see them; AC-12.2 scope-diff would never match.

**Fix:** Replace all `design-documents/cascade/05-domain-spec.md` in spec with `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/05-domain-spec.md`

### LOW-1: Phase numbers in AC-3.3 and AC-7.3 off-by-one (cosmetic)

**Spec says:** AC-3.3 "Phase 5 EVIDENCE spec-form attempts execute"; AC-7.3 "Phase 4 DEFINITION spec-form attempts execute"

**Code shows:** Probe file has `logHeader('Phase 3: EVIDENCE...')` at line 141 and `logHeader('Phase 2: DEFINITIONs...')` at line 112.

**Impact:** Cosmetic mislabel — implementer would look for "Phase 4" or "Phase 5" comments and not find them, but bracketed attempt numbers ([02]-[09]) are unambiguous. Does not affect test outcomes.

**Fix:** Optional inline correction in spec-02 — change "Phase 5" → "Phase 3", "Phase 4" → "Phase 2".

### LOW-2: AC-4.1 clarification slightly overstates pre-existing rejection behavior

**Spec says:** "impl was rejecting non-`designer` values via `sourceConstraint`-coupled logic instead of accepting the four spec values via `closedEnumFields`"

**Code shows:** EVIDENCE `closedEnumFields: {}` is empty at `schema.js:52`. There is no current `sourceConstraint`-coupled rejection on the `source` field — both `designer` and non-`designer` `source` values currently succeed in EVIDENCE submissions. The drift is "no enum gate at all," not "wrong enum gate."

**Impact:** Does not block implementation — the fix (add `closedEnumFields: { source: EVIDENCE_SOURCE_ENUM }`) is identical regardless. But AC-4.2's must-reject probe expectation needs verification at task execution time: the probe attempt [09] currently succeeds because there's no source-field enforcement, not because of inverted logic.

**Fix:** Note inline at AC-4.1; soften the diagnostic claim.

## Risk Assessment

The spec's technical content (descriptor shapes, translator behaviors, render structure, line citations, probe attempt numbers) is accurate and well-grounded against actual source. The two MEDIUM findings are mechanical path corrections used consistently throughout — single search-and-replace per path. None of the findings invalidate the underlying design or the AC observable boundaries. Once path corrections are propagated to spec-02, the spec is implementable as written.

<!-- created-at: 2026-05-17T15:25:00Z -->

<!-- created-at: 2026-05-17T16:15:44Z -->
<!-- produced-by design-specify@v0006 -->
