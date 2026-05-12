# Ground-Truth Review Report — sprint-01-proof-backend Spec

**Spec reviewed:** `sprint-01-proof-backend-spec-00.md`
**Design brief:** `../../design-documents/04-engine-spec.md`

## Status: Clean

No HIGH, MEDIUM, or LOW findings. Every claim the spec makes about existing code is accurate.

## Verified Claims

- **vitest ^3.1.1, ES modules, `"type": "module"`** — CONFIRMED at `skills/design-large-task/proof-mcp/package.json:4` (`"type": "module"`) and `:16` (`"vitest": "^3.1.1"`).
- **Engine ships with no runtime dependencies (AC-13.1)** — proof-mcp itself has only `@modelcontextprotocol/sdk` as a runtime dep (`package.json:13`), which the engine does not need; the "no runtime dependencies" claim is compatible with the broader project's minimalism.
- **`__tests__/` directory layout** — CONFIRMED at `skills/design-large-task/proof-mcp/__tests__/` with 40 `.test.js` files.
- **`describe/it/expect` test style** — CONFIRMED at `__tests__/proof.test.js:1` (`import { describe, it, expect } from 'vitest';`).
- **`vi.mock()` reserved for fs isolation** — CONFIRMED at `__tests__/atomic-persistence.test.js:1` and `:9`; this is the only test file in proof-mcp using `vi.mock`, matching the spec's claim that `vi.mock` is reserved for fs.
- **No prior `engine/` directory** — CONFIRMED via filesystem inspection (greenfield).
- **Procedural integrity / closure / friction logic the engine eventually replaces** — CONFIRMED:
  - `proof-mcp/proof.js:483` (`checkAllIntegrity` aggregating `checkWithdrawnGrounding`, `checkUngrounded`, `checkStaleGrounding`)
  - `proof-mcp/metrics.js:202` (`checkClosure`) and `:336` (`evaluateTrigger`)
  - `proof-mcp/friction-detection.js` (`runFrictionDetection` at `:97` and four detector functions)
- **Node 17+ `structuredClone` requirement** — CONFIRMED feasible; `proof-mcp/state.js` already uses `structuredClone` at lines 112, 158, 249, 290; environment runs Node v22.22.0.

## Findings

None.

## Risk Assessment

The spec's existing-code claims are accurate on every dimension checked. The engine is genuinely greenfield (no prior `engine/` directory), the testing-convention references all hold at the cited proof-mcp location, and the procedural logic identified as the engine's eventual replacement target all exists where the design brief implies. The `structuredClone` choice is already battle-tested inside `state.js`, so the Node 17+ floor is a non-issue. No latent interactions: the engine ships standalone in sprint-01 with no callers, so existing proof-mcp tests cannot break from its introduction. The implementer can proceed with confidence on the "existing code" assumptions; the only uncertainty is in the greenfield engine code itself, which is by design.

<!-- created-at: 2026-05-11T15:41:26Z -->
<!-- produced-by design-specify@v0003 -->
