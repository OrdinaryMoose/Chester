# Ground-Truth Review Report — sprint-01-proof-backend-pass-2

**Spec reviewed:** `sprint-01-proof-backend-pass-2-spec-00.md`
**Brief context:** `sprint-01-proof-backend-pass-2-design-00.md`
**Status:** Clean — every codebase claim verified; zero findings.

## Verified Claims

- **AC-14.3** — `FactStore.js` `isConstant` finite-number check exists at lines 6-10; `Number.isFinite(v)` is the line 8 conjunct inside the `isConstant` const.
- **AC-15.3** — `RuleStore.js` has a `defineRule()` entry point at lines 34-47; calls `validateRule()` then duplicate-id check then stratification. The pass-2 safety check inserts before stratification — structurally compatible with the existing flow.
- **AC-15.4 (Evaluator guard)** — `Evaluator.js` lines 120-122 contain the `if (headArgs.some((a) => a === undefined))` block throwing `UNBOUND_HEAD_VARIABLE`. The spec's reference to the guard location is exact.
- **AC-15.4 (Serializer comment)** — `Serializer.js` lines 41-44 contain the atomic-load contract comment listing `TYPE_ERROR / MALFORMED_RULE / DUPLICATE_RULE_ID / CYCLIC_NEGATION / UNBOUND_HEAD_VARIABLE on a rule`. The spec's expanded AC-15.4 correctly requires this comment to be updated.
- **AC-15.5** — `evaluation.test.js` currently has 10 `it(...)` blocks; the guard-firing test is at lines 128-138.
- **AC-15.6** — `operations.test.js` currently has 20 `it(...)` blocks.
- **AC-15.7** — `failures.test.js` currently has 8 `it(...)` blocks; no reference to `UNBOUND_HEAD_VARIABLE` in the file. The describe-header text mentions "nine error codes" but the file's actual assertions cover 8 codes; `MEMORY_BUDGET_EXCEEDED` is the ninth, intentionally untested at this layer.
- **AC-16.3** — `Evaluator.js` `matchBodyAtom` negation branch at lines 23-43 uses unify-then-consistency-check (matches the D3 fix described in the spec).
- **AC-17.3** — `Serializer.js` `loadEngineFrom` snapshot/restore wrap at lines 37-54 with `engine.snapshot()` and `engine.restore(rollback)`.
- **AC-12.1 — error catalog count** — Sprint-01's spec listed 9 error codes; `UNBOUND_HEAD_VARIABLE` was implementation-only and never appeared in the spec catalog. Pass-2's catalog growth from 9 to 10 (adding `UNSAFE_RULE`) is internally consistent.
- **Engine-spec inline citation convention** — `04-engine-spec.md` uses `(See ADR-NNNN[, Part M].)` style at lines 138, 140, 142, 323, 325. Pass-2's amendment ACs follow this convention.
- **ADR-0014 is the latest** — Directory listing confirms ADRs 0001 through 0014 exist; ADR-0015 is the next available number.
- **Path convention consistency** — Sprint-01's spec used `engine/...` relative paths throughout; pass-2's spec also uses relative paths in the Components section. The single absolute-path mention at AC-18.2 (vitest run-location instruction) is appropriate for the executable command context.
- **Constant-type baseline in engine spec** — `04-engine-spec.md:37` currently reads "string, number, boolean, null". The pass-2 amendment inserting "finite" is a localized in-place edit.

## Findings

None. The spec is unusually rigorous about ground-truth: every cited line number matches the actual code, every quoted convention exists in the cited form, every test count is exact.

## Risk Assessment

The spec accurately describes the codebase it targets. No factual errors require correction before planning. The implementer can rely on the spec's file-path, line-number, and test-count claims as accurate baselines.

One informational observation (not a finding against the spec): the design brief's Prior Art section mentions that sprint-01's architectural audit "produced test coverage in `failures.test.js` covering nine error codes — including `UNBOUND_HEAD_VARIABLE` but not `UNSAFE_RULE`." This wording is loose — `UNBOUND_HEAD_VARIABLE` is not actually asserted in `failures.test.js`; only the describe-header mentions "nine error codes" while the file has 8 `it(...)` blocks plus a MEMORY_BUDGET_EXCEEDED note. The spec itself does not propagate this brief-level wording inaccuracy; AC-15.7 correctly states the post-pass-2 state.

<!-- created-at: 2026-05-12T10:04:30Z -->
<!-- produced-by design-specify@v0003 -->
