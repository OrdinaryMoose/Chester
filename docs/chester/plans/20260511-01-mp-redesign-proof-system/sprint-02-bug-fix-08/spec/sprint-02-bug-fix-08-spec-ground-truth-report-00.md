# Ground-Truth Review Report: sprint-02-bug-fix-08-spec

**Spec reviewed:** sprint-02-bug-fix-08-spec-00.md
**Codebase root:** skills/design-proof-system/references/
**Date:** 2026-05-18

## Status

**Findings** — 0 HIGH, 1 MEDIUM (fixed inline), 1 LOW (fixed inline). After fixes the spec is factually accurate on every code claim.

## Verified Claims

- **CATEGORY_REGISTRY authority line numbers** (EVIDENCE 68, RULE 80, PERMISSION 92, PROPOSITION 104, RISK 116, RESOLUTION 128, FRICTION 140, CONCERN 152, DEFINITION 164) — all exact at `domain/schema.js:57-166`.
- **Tightenings real** — RESOLUTION, CONCERN, DEFINITION all currently have `ratify: [DESIGNER, DESIGN_PARTNER]`.
- **REVISE_RESOLUTION dual-partner shape** — `consentCategory` at `mutations.js:155`; dual approval facts at lines 163-166.
- **D2 emission insertion point** — `mutations.js:375` (post-metaFacts loop, pre-`derive()`) is the correct boundary. Variable scope verified: `consent` (param line 279), `verbName` (param line 279), `ts` (line 370), `id` (line 343 `let`, null for RATIFY).
- **EDB_PREDICATES location** — `translation.js:196-205`; adding `'agent_action'` to the Set is sufficient.
- **bug-fix-07 test assertions to update** — AC-12.2 at line 693-694; AC-12.3 at line 754. `reviseProposition`'s `two_yes_complete` assertion at line 753 stays unchanged (per Q1=1a; Proposition retains dual-partner ratify).
- **Error code** — `CONSENT_INVALID` (confirmed at `authority.js:12,16,19`).
- **ID_PREFIXES** — `tags.js:15`, imported in `mutations.js:1`.

## MEDIUM Findings (Fixed Inline)

### M1 — "§6.1 step 12" label was the wrong step number

**Spec said:** "Inside `runOperation`'s try block, after `spec.translate(...)` has run and after the metaFacts loop, and BEFORE `ports.query.derive()`".

**Code shows:** That location is the §6.1 step-5/step-6 boundary, not step 12. Step 12 is the result-build phase at `mutations.js:452`.

**Fix applied:** Updated the spec to name the boundary as "§6.1 step-5/step-6, around mutations.js:375". The prose anchor was correct; only the step-number label was wrong.

## LOW Findings (Fixed Inline)

### L1 — Error-code hedge was unnecessary

**Spec said:** "`CONSENT_INVALID` (or `CONSENT_DENIED`, depending on the codebase's actual error code name)".

**Code shows:** Three `CONSENT_INVALID` throw sites at `authority.js:12,16,19`. Documented at `VOCABULARY.md:213`.

**Fix applied:** Spec now states `CONSENT_INVALID` with the file:line confirmation, no hedge.

## Context Notes (Not Fixes)

- **RATIFY verb-name string casing.** The emission writes `verbName` directly into the fact. `ACTION_LABELS.RATIFY === 'ratify'` (lowercase), so emitted facts will read `agent_action(id, 'ratify', 'design_partner', ts)`. Consistent with all other verb labels.
- **Two "source" notions coexist.** `consent.source` (the caller-supplied source on the consent token) and `args.source` (which RATIFY's translator reads at `mutations.js:217` with `args.source ?? CONSENT_SOURCES.DESIGNER` fallback). The D2 emission gate uses `consent.source` — the right semantic: "did the agent invoke this", regardless of any `args.source` override.

## Risk Assessment

The spec's claims about existing design-proof-system code are factually accurate after the two surgical inline fixes. No HIGH findings; both lower-severity issues were precision/wording corrections. After fixes, the spec is ready for plan-build with no outstanding ground-truth concerns.

<!-- created-at: 2026-05-18T21:26:22Z -->
<!-- produced-by design-specify@v0003 -->
