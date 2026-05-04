# Ground-Truth Report — Cluster B.1 Spec

**Spec:** `cluster-b-1-define-transition-spec-00.md`
**Date:** 2026-05-03
**Reviewer:** general-purpose subagent (post-fidelity, post-adversarial)

## Status

Findings (1 MEDIUM addressed, 4 LOW noted).

## Verified Claims (no changes required)

- `proof.js:13` `ELEMENT_TYPES` array contains 7 types (EVIDENCE, RULE, PERMISSION, NECESSARY_CONDITION, RISK, RESOLVE_CONDITION, FRICTION) — CONFIRMED.
- `state.js:265-268` blocks FRICTION via add op in applyOperations — CONFIRMED.
- `state.js:452-461` uses `??=` backfill pattern — CONFIRMED. Spec's AC-10.1 fits naturally.
- `initializeState(problemStatement)` signature at state.js:32 — CONFIRMED.
- `applyOperations(state, operations)` signature at state.js:246 — CONFIRMED.
- `saveState`, `loadState` exports at state.js:435, 448 — CONFIRMED.
- `createElement(input, id, round)` signature at proof.js:46 — CONFIRMED. AC-13.1 sample call matches.
- Existing `initialize_proof` tool and `handleInitialize` at server.js:30-41, 224-245 — CONFIRMED unchanged.
- B.2-owned tools coexist (`present_closing_argument`, `confirm_closure_go`, `manage_friction`, `override_friction_disposition`) at server.js:118-182 — CONFIRMED.

## Findings

### MEDIUM — AC-13.1 createElement extension serialization

**Spec said (pre-fix):** "When absent (existing call sites such as `submit_proof_update`), the returned element has `restructuring: undefined` or omits the field; existing behavior unchanged."

**Code shows:** `createElement` returns object literal at proof.js:139-156 with explicit field defaults. Adding `restructuring: restructuring ?? null` would add a new property to every element (snapshot-test breaking change). Adding conditionally requires explicit pattern.

**Fix applied:** AC-13.1 revised to mandate conditional-add pattern (no `restructuring` property when input is absent/falsy) and JSON byte-equivalence guarantee. FRICTION early-return path explicitly excluded from the extension.

### LOW — loadState backfill mutates raw before return

**Spec says (AC-10.1):** "The backfill does not modify the file on disk; it adds the field in-memory only."

**Code shows:** state.js:448-466 mutates `raw` before return; no writeFileSync. Confirmed correct.

**Risk:** AC-11.1's already-open refusal path must NOT call `saveState` after `loadState`, or the file gets rewritten with backfilled `proofStatus: 'unopen'` (benign mtime touch). Implementer should be aware.

**Fix applied:** None. AC-11.1 says "state file is unchanged" — the implementation discipline carries the requirement.

### LOW — AC-7.1 schema permissiveness compatible with MCP SDK defaults

**Spec says:** `submission_material` schema has "no `properties` constraint, no `additionalProperties: false`."

**Code shows:** Existing tool schemas at server.js:33-40 declare only `type: 'object'` and `properties` + `required`. MCP SDK uses standard JSON Schema; absent `additionalProperties: false`, extra props allowed.

**Fix applied:** None. Spec assumption matches MCP SDK behavior.

### LOW — applyOperations triggers friction detection (B.2-owned)

**Spec says (Constraints):** "B.1 does not modify `closing-argument.js`, `friction-detection.js`, `metrics.js`."

**Code shows:** state.js:15 imports `runFrictionDetection` from `./friction-detection.js`. `applyOperations` calls `processFriction` (state.js:115-138, 375-377) on every state mutation. `open_proof`'s phase-3 `applyOperations` call activates B.2-owned code as a side effect.

**Risk:** Likely benign (no anchor pairs form FRICTION on a fresh proof open), but implementer should be aware the call path triggers B.2 code.

**Fix applied:** None. Spec correctly excludes modification of B.2 files. Read-only invocation of B.2-owned code via existing `applyOperations` is consistent with the spec's reuse profile.

### LOW — AC-1.1 Concern category naming

**Spec says (AC-1.1):** Registry includes 7 B.1-owned categories: 6 `ELEMENT_TYPES` values plus `Concern` (lives in `state.concerns`, not `state.elements`).

**Code shows:** `state.concerns` at state.js:46; `addConcern` at state.js:146. Concern is structurally distinct from typed elements.

**Risk:** Minor naming inconsistency — registry keys for typed elements are SCREAMING_SNAKE per ELEMENT_TYPES; the Concern key would naturally be capitalized differently (`'Concern'` vs `'CONCERN'`). Implementer should resolve consistently.

**Fix applied:** None. Plan-build can derive convention from spec context; minor implementer choice.

## Risk Assessment

The spec's claims about existing code are accurate to the file. Cited line numbers and exported function shapes all check out. The MEDIUM finding (createElement serialization) was the single non-trivial implementation hazard; the conditional-add fix in AC-13.1 resolves it cleanly. LOWs are context the implementer should hold but do not require spec changes.

The friction-detection side effect is the most interesting LOW — implementer should run a smoke test verifying that `open_proof` on a fresh proof produces zero auto-detected FRICTION elements (expected behavior; confirms isolation from B.2-owned mechanisms).

<!-- created-at: 2026-05-04T01:17:38Z -->
<!-- produced-by design-specify@v0003 -->
