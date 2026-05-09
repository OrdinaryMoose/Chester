# Ground-Truth Report — sprint-d-1-fix-proof-mcp-3 spec

**Spec reviewed:** `sprint-d-1-fix-proof-mcp-3-spec-00.md`
**Date:** 2026-05-09
**Reviewer:** ground-truth-reviewer subagent (general-purpose, with codebase verification)
**Status:** Findings addressed — spec updated inline.

---

## Findings Summary

- **HIGH:** 0
- **MEDIUM:** 2 — both addressed inline
- **LOW:** 4 — material ones addressed inline, others noted as plan-build context

---

## Verified Claims (sample)

The reviewer confirmed the following spec claims against actual source:

- `deriveClosingArgument` exported from `closing-argument.js` with active-by-type filter expressions amenable to extraction (`closing-argument.js:32, 53, 70-78`).
- ID prefix → category map (NCON, RULE, PERM, EVID, RISK, RCON, FRIC → `state.elements` Map; CERN → `state.concerns`; DEFN → `state.definitions`) confirmed at `proof.js:70-80` and `state.js:18-26, 44, 52`.
- Concerns use `status: 'draft' | 'ratified' | 'withdrawn'` confirmed at `state.js:254, 295, 1151`.
- TOOLS array shape and dispatcher switch pattern confirmed at `server.js:77-290` and `298-339`.
- `get_proof_state` and `manage_definitions op:query-overlap` are read-only handlers without consent, confirmed at `server.js:453, 539-552`.
- NC sub-fields `statement`, `grounding`, `reasoning_chain`, `collapse_test`, `rejected_alternatives` confirmed at `proof.js:204-215, 227-244`.
- RC sub-fields `statement`, `problem_anchor`, `ratification`; `el.grounding` holds NC IDs — confirmed at `proof.js:217-225, 230-244`.
- Concern fields `id, label, description, status` — confirmed at `state.js:254`.
- Element status values are `'active'` and `'withdrawn'` — confirmed at `proof.js:160, 240` (creation), `state.js:630, 858, 1098` (withdrawal).
- 529 tests across 39 files — confirmed via `npm test` (output: `Test Files 39 passed (39) / Tests 529 passed (529)`).
- `addConcern`, `applyOperations`, `ratifyResolveCondition`, `ratifyNecessaryCondition`, `initializeState`, `manageDefinitions`, `manageFriction`, `withdrawConcern` exported from `state.js`, confirmed.
- `ELEMENT_NOT_FOUND` error code is not used elsewhere in the codebase (zero hits via repo grep).

---

## Findings and Resolutions

### MEDIUM 1 — Name collision on `activeNCs` (RESOLVED)

**Spec said:** Partitioner's `activeNCs` lane includes "every element with `type === 'NECESSARY_CONDITION'` and `status === 'active'`, regardless of `ratificationStatus`."

**Code shows:** Existing `deriveClosingArgument` defines `activeNCs` as ratified-only at `closing-argument.js:70-71` and returns it as a published key at `closing-argument.js:125-127`. The spec also asserted the closing-argument output shape would be byte-identical post-extraction. Identical key name, different semantics.

**Resolution applied:** Renamed the partitioner's lane to `activeNCsAll` to remove the name collision. `deriveClosingArgument` continues to publish its `activeNCs` (ratified) and `draftNCs` (draft) keys with their original meanings; the partitioner exports `activeNCsAll` (all active NCs regardless of ratification) for render's use. `deriveClosingArgument` derives its split internally from the partitioner's `activeNCsAll` lane.

### MEDIUM 2 — Static-read assertion in AC-2.3 was brittle (RESOLVED)

**Spec said:** Test should statically scan `state-render.js` source for absence of `el.type === 'X' && el.status === 'active'` filter expressions.

**Code shows:** Such a regex would also catch innocuous comments or guards. Render's deep mode legitimately reads `el.status` to surface `withdrawal_disposition` for withdrawn elements (per AC-3.2).

**Resolution applied:** AC-2.3's assertion replaced with a behavioral test — the test mutates a returned partition lane and observes the recap output reflecting the mutation, proving the recap reads from the partition rather than re-deriving from raw state. The wording-level constraint ("no inline filter expressions") in Components reframed as "render's recap path accesses each section's elements only through the partition object."

### LOW 1 — `renderRC(el, state)` had unnecessary `state` parameter (RESOLVED)

**Spec said:** `renderRC(el, state)` per Components.

**Resolution applied:** Signature changed to `renderRC(el)`. The brief's out-of-scope rule "Reference IDs render as IDs" means RC's groundingNCs render as bare IDs from `el.grounding`; no state lookup is needed.

### LOW 2 — Multi-storage lookup admitted FRIC- and DEFN- but Components had no `renderFriction` or `renderDefinition` (RESOLVED)

**Spec said:** AC-3.3 admitted `FRIC-` and `DEFN-` IDs into `findElementById`; Components listed seven per-type render functions for the seven element types named in brief AC-4 — neither FRICTION nor DEFINITION among them.

**Code shows:** Brief AC-4 enumerates seven types for deep render: NCs, Rules, RCs, Concerns, Evidence, Permissions, Risks. FRICTION and DEFINITION are not in scope. An implementer would have hit "no renderer exists" when dispatching deep render against `FRIC-N` or `DEFN-N`.

**Resolution applied:** `findElementById` scoped to the seven in-scope prefixes (six element-Map types plus `CERN-` for concerns). Out-of-scope prefixes (`FRIC-`, `DEFN-`, anything else) return `null` and fall through to the `ELEMENT_NOT_FOUND` refusal path (AC-3.4). AC-3.3's Given/When/Then now includes a `FRIC-1` case asserting the refusal path.

### LOW 3 — Seven-vs-eight section count contradiction (RESOLVED)

**Spec said:** Goal and Constraints stated "seven sections"; AC-2.1 listed eight headings.

**Resolution applied:** Goal, Constraints, and AC-2.1 reworded to "eight markdown sections — a Problem Statement preamble followed by seven element-listing sections." Internal consistency restored.

### LOW 4 — `firstSentence(text)` delimiter rule unspecified (NOTED, NOT FIXED)

**Spec says:** `firstSentence(text)` returns "the first sentence of a statement for outsized-rule summaries" (Components).

**Code shows:** No existing implementation; new module surface. Edge cases like "etc." or "e.g." in rule statements could cause incorrect truncation.

**Resolution:** Left as plan-build implementer choice. Likely shape: regex `/^(.+?)(?<=[.!?])(\s|$)/`. Flagged here so plan-build surfaces the choice explicitly.

---

## Risk Assessment

The spec is broadly faithful to the codebase — file paths, function names, ID prefix conventions, status values, fixture helpers, and the 529-test baseline all check out. The two MEDIUM findings were wording-only fixes (lane-renaming, assertion-style change). The LOW findings tightened scope to match the brief's actual deliverables (seven element types, not nine). Post-fix, the spec accurately describes the codebase it targets and the change scope it commits to. No factual errors remain that would block plan-build.

<!-- created-at: 2026-05-09T11:30:15Z -->
<!-- produced-by design-specify@v0003 -->
