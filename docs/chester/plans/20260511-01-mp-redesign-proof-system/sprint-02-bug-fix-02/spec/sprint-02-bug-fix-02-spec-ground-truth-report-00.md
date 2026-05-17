# Ground-Truth Review Report — sprint-02-bug-fix-02

**Spec reviewed:** `sprint-02-bug-fix-02-spec-01.md` (post-adversarial)
**Brief for context:** `sprint-02-bug-fix-02-design-00.md`
**Reviewer:** general-purpose subagent, automatic dispatch per design-specify chain
**Date:** 2026-05-17

## Status: Clean

Every spec claim about existing code was verified against the source files. No findings.

## Verified Claims

- **PERMISSION descriptor current state** — `requiredFields: ['statement']`, `optionalFields: ['rationale']`, `nonEmptyStringFields: []`, `closedEnumFields: {}` — CONFIRMED at `schema.js:24-33`.
- **RISK descriptor current state** — `requiredFields: ['statement']`, `optionalFields: ['severity']`, `nonEmptyStringFields: []` — CONFIRMED at `schema.js:44-53`.
- **PERMISSION translator** silently drops `relieves` — CONFIRMED at `translation.js:23-27`. Translator body never references `args.relieves`; sole emission is `['permission_decl', [id, args.statement]]`.
- **RISK translator** silently drops `basis` — CONFIRMED at `translation.js:41-45`. Translator body never references `args.basis`; sole emission is `['risk', [id, args.statement, args.severity ?? 'unspecified']]`.
- **EDB_PREDICATES set membership** — `permission_decl` and `risk` present; `permission`, `permission_scope`, `risk_basis` absent — CONFIRMED at `translation.js:184-193`. Spec's three planned additions are genuine new entries.
- **`_CATEGORY_PROBES` PERMISSION row** — `[ELEMENT_CATEGORIES.PERMISSION, 'permission_decl', 2]` — CONFIRMED at `mutations.js:16`. Spec's preservation rationale is structurally sound: keeping `permission_decl/2` emission keeps `_CATEGORY_PROBES` unchanged.
- **`verifyArgsShape` single call site** — at `mutations.js:231` — CONFIRMED. Grep across `references/` showed the only invocation (outside the definition at `schema.js:103`) is `mutations.js:231`. The three other mutations.js mentions (lines 95, 117, 151) are comments referencing the function, not call sites.
- **`_ARITIES.risk: 2`** — CONFIRMED at `render.js:57`. Contradicts the translator's three-argument `risk` emission. AC-5.5 correctly captures this correction.
- **`PROJECTION_ARITIES.risk: 2`** — CONFIRMED at `render.js:149`. Same stale value as `_ARITIES`. AC-5.3 correctly captures this correction.
- **RESOLUTION.addresses spread idiom** — CONFIRMED at `translation.js:49`. Exact pattern: `...(Array.isArray(args.addresses) ? args.addresses.map(rid => ['addresses', [id, rid]]) : [['addresses', [id, args.addresses]]])`. Spec's planned `risk_basis` spread mirrors this faithfully.
- **boot-validators has no known-properties allow-list** — CONFIRMED at `boot-validators.js:50-64`. `validateCategoryRegistry` runs four positive `check()` calls only (`requiredFields`, `sourceConstraint`, `idShape`, `renderSection`). No iteration over descriptor keys; no rejection of unknown properties. The new directives `referenceFields` and `nonEmptyArrayFields` pass through silently, matching `closedEnumFields` / `optionalFields` / `nonEmptyStringFields` / `authority` precedent.
- **`verifyArgsShape` current signature** — two parameters: `(args, shapeOrDescriptor)` — CONFIRMED at `schema.js:103`. Spec's third optional parameter `readPort = null` is a new addition; backward compatible since no existing caller passes a third argument.
- **Call-site context for the new third argument** — `ports` is in scope at `mutations.js:230-231`. The spec's proposed conditional pass (`(verbName === ADD || REVISE) ? ports.query : null`) is well-placed.

## Findings

None.

## Risk Assessment

Every spec claim about existing code matches the source files. The two findings folded in from prior adversarial review (HIGH `_ARITIES.risk: 2` and MEDIUM `boot-validators` non-existent allow-list) are reflected accurately — AC-5.5 captures the `_ARITIES` correction, and the "Unchanged surfaces" / "Boot-validator handling" notes correctly characterize the boot-validators no-op. The translator spread idiom and the probe-table preservation rationale are both factually grounded. The spec is safe to hand off to plan-build.

## Files Examined

- `skills/design-proof-system/references/domain/schema.js`
- `skills/design-proof-system/references/domain/translation.js`
- `skills/design-proof-system/references/domain/mutations.js`
- `skills/design-proof-system/references/domain/render.js`
- `skills/design-proof-system/references/domain/boot-validators.js`

---

<!-- produced-by design-specify@v0003 -->
