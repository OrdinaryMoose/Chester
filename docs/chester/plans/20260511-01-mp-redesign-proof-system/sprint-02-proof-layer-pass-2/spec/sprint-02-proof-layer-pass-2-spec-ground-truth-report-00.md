# Ground-Truth Report: sprint-02-proof-layer-pass-2-spec-01

**Spec reviewed:** `spec/sprint-02-proof-layer-pass-2-spec-01.md`
**Brief context:** `design/sprint-02-proof-layer-pass-2-design-00.md`
**Reviewer:** general-purpose subagent dispatched by design-specify@v0003
**Status:** Findings (1 HIGH, 2 MEDIUM, 2 LOW). Fixes for HIGH and MEDIUM applied in spec-02; LOWs documented here, not in the spec.

## Verified Claims (sample)

- AC-4.1 current `unaddressed_concern_rule` body — CONFIRMED at `skills/design-proof-system/references/domain/closure-policy.js:26` (exact match: `[['risk', ['C', '_', '_']], ['not', ['addresses', ['_', 'C']]]]`).
- AC-1.2 line numbers FRICTION 58-66, DEFINITION 67-75 — CONFIRMED at `schema.js`.
- AC-4.3 `addresses/2` arity — CONFIRMED at `translation.js:45`.
- AC-4.3 no existing `covered(C)` producer — CONFIRMED (grep returns no producer).
- AC-4.3 `approved/3` shape — CONFIRMED at `translation.js:80, 92, 105`.
- AC-5.1 retirement targets — CONFIRMED at `state.js:44-45, 241, 278, 1128`.
- AC-5.2 MCP tool sites — CONFIRMED at `server.js:139, 322`.
- 84 domain tests, 138 engine tests at HEAD `132dfba` — CONFIRMED.

## HIGH Finding

**HIGH-1: AC-1.4's premise about an existing idShape→prefix mapping is wrong.**

- **Spec said:** "Existing categories produce `evid_1`, `prop_1`, `defn_1`, etc. … a small mapping update for the new category is in scope."
- **Code shows:** The domain layer has no idShape→prefix mapping. `mutations.js:126` calls `ports.ids.next(targetShape)` where `targetShape` is the long-form idShape string (`'evidence'`, `'proposition'`). Domain tests (`__tests__/bridge-integration.test.js:14-19`, `domain-bridge.test.js:9`) use `` `${shape}_${n}` `` producing `evidence_1`, `proposition_1`, `definition_1` — the **long form**, not the short form. Cascade §3 prescribes short forms (`evid_N`, `prop_N`, `cern_N`) as documentation shorthand; no current code site implements that mapping.
- **Impact:** Spec's AC-1.4 regex `^cern_\d+$` cannot be met without either introducing a new short-prefix mapping (broader than CONCERN, violating "no abstraction" discipline) or accepting the long-form id `concern_N`. The "Decisions field at execute-write time" escape papers over a load-bearing choice.
- **Spec-02 fix:** AC-1.4 regex relaxed to `^concern_\d+$` (long form matches existing allocator's `${idShape}_${n}` pattern). New explanatory note: cascade §3.8's `cern_N` shorthand is documentation; the existing allocator emits long-form ids; bringing the cascade and the codebase into alignment on short-prefix ids is a separate cascade-vs-code reconciliation out of scope for this sub-sprint.

## MEDIUM Findings

**MEDIUM-2: AC-5.1's universal grep boundary conflicts with AC-5.3's four-file enumeration.**

- **Spec said (AC-5.1):** "Grepping the post-spec `proof-mcp/` directory for `state.concerns` returns no matches." **Spec said (AC-5.3):** names exactly four readers (`closing-argument.js`, `body-advancement.js`, `first-yes-gate.js`, `state-render.js`).
- **Code shows:** `state.concerns` is also read at `server.js:427,452,463,489` (4 sites — completeness/ratification-counts, proof-state assembly, closing-argument readiness), `metrics.js:160,163,271,288,320,371` (6 sites — coverage math, two-yes preconditions), `friction-detection.js` (called with `state.concerns` as a parameter). The brief and architects under-enumerated the consumer set.
- **Impact:** The four-file list is incomplete. Plan-build cannot pass AC-5.1's universal grep as written without also rewiring `server.js`, `metrics.js`, and `friction-detection.js`.
- **Spec-02 fix:** AC-5.3 expanded from four files to enumerate ALL `state.concerns` consumer sites: the four originally named readers PLUS `server.js`, `metrics.js`, `friction-detection.js`. AC-5.1's grep assertion preserved (universal) so the expanded retirement scope is what plan-build plans against.

**MEDIUM-3: `state.js:18-19` legacy-citation is misleading.**

- **Spec said (AC-1.4 Note):** "proof-mcp's pre-rewire `state.js:18-19,253` produced `CERN-N`."
- **Code shows:** `state.js:18-19` (`ID_PREFIX` object) does NOT contain a `CONCERN` or `CERN-` entry. The `CERN-` prefix is hardcoded inline at `state.js:253` only.
- **Impact:** Low practical risk (implementer will find the right line). Citation is misleading; reads as if a `CERN-` entry exists in `ID_PREFIX`.
- **Spec-02 fix:** AC-1.4 Note citation narrowed to `state.js:253` only.

## LOW Findings (not applied to spec)

**LOW-4:** Spec calls `validPredicates` "two static lists at lines 47 and 155." Code shows these are `for (const p of [...]) validPredicates.add(p);` loops, not static lists. Citation is correct; terminology slightly imprecise. **Action:** none — implementer reading the code will see the actual structure.

**LOW-5:** DEFINITION's withdraw bridge facade method is named `deprecateDefinition` (`domain-bridge.js:94`), not `withdrawDefinition`. The spec's `withdrawConcern` is consistent with cascade vocabulary but does not strictly mirror DEFINITION's naming. Spec's "mirroring DEFINITION's pattern" framing is slightly misleading. **Action:** none — `withdrawConcern` aligns with cascade-status vocabulary (`withdrawn` is the cascade status), which is the more important consistency. The brief, both architects, and the spec all converge on `withdrawConcern`; not changing.

## Risk Assessment

The spec-01 was structurally sound on closure-policy correction and bridge surface design but carried two implementation-blocking ambiguities (AC-1.4 ID format and AC-5.1 vs AC-5.3 scope). Both are fixed in spec-02 with no architectural change — the Hybrid Recommendation stands. After spec-02 fixes, the spec is plan-ready pending one ground-truth re-review (per skill iteration cap).

<!-- created-at: 2026-05-15T01:37:55Z -->
<!-- produced-by design-specify@v0003 -->
