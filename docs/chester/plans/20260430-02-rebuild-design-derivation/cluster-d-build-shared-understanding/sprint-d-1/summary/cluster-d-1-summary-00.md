# Session Summary: cluster-d-1 — proof MCP completeness extension

**Date:** 2026-05-07
**Session type:** Full-stack implementation (subagent-driven, 17 tasks)
**Plan:** `cluster-d-1-plan-01.md`

## Goal

Extend the design proof MCP server (`skills/design-large-task/proof-mcp/`) per the cluster-d-1 spec, implementing 19 Necessary Conditions, 5 Resolve Conditions, and 5 Concerns derived from the design phase. Architecture A: universal generic tool surface over heterogeneous internal storage. Sub-sprint of master plan `20260430-02-rebuild-design-derivation`.

## What Was Completed

### Code Extensions (16 tasks, 17 commits)

| Task | NCs/RCs | Headline |
|------|---------|----------|
| 1 | NC-15 | `schemaVersion` field with forward-incompatible refusal in `loadState` |
| 2 | NC-17 | Atomic `saveState` via write-tmp-then-rename |
| 3 | NC-8 | Consent token validation across all mutating tools |
| 4 | NC-4 | `operationLog` with per-mutation appends |
| 5 | NC-18, RULE-6 | Per-Concern `status` + `ratifyConcern` + `manage_concerns` ratify op |
| 6 | NC-18, RULE-8 | NC `ratificationStatus` field with revise-resets-to-draft |
| 7 | NC-3, NC-13 | Friction `source` field + consent inheritance via `processFriction` |
| 8 | NC-7, RULE-5 | `definitions.js` + `manage_definitions` + Definitions counters |
| 9 | NC-2 | `CATEGORIES` enum + `DISPOSITIONS_BY_CATEGORY` map + `entityType` helper |
| 10 | NC-5, NC-6, PERM-1 | Universal `withdraw` tool with FRICTION rejection |
| 11 | NC-1, RC-1 | `open_proof` consent + `INVALID_SEED_PACKET` + open-event log |
| 12 | NC-9 | `concernsRatificationGate` hard gate + `isError` on `present_closing_argument` |
| 13 | NC-9, NC-16 | Closing-argument envelope completeness with `closureProvenance` |
| 14 | RULE-9, NC-12 | `recordDesignerGo` sets `proofStatus: closed` + bulk-ratify NCs/RCs |
| 15 | NC-12 | `reopen_proof` tool + `lastClosureArtifact` retention |
| 16 | NC-11, AC-5.3 | Mutation-clears-flags coverage extended for new mutations |
| 17 | NC-1, NC-8 | SKILL.md docs additions (consent token construction + brief renderer) |

### Final Code Review Fixes (1 commit)

Adversarial code review surfaced three Important findings folded in as a final fix commit:

- `recordClosingArgPresented` now appends `op:'present'` to operationLog (audit trail parity)
- `markChallengeUsed` now appends `op:'mark-challenge'` to operationLog
- Top-level CallTool dispatcher returns structured `{code, message}` response when caught error has `err.code` set (surfaces `SCHEMA_VERSION_TOO_NEW` as a typed refusal)

### Architectural Decisions

- **Architecture A chosen** at design-specify (universal generic tool surface) over Architecture B (which failed FAC suitability) and a third hybrid candidate.
- **PERM-1 carve-out**: FRICTION explicitly refused at universal `withdraw`'s door; `override_friction_disposition` remains the only path. Server schema enum excludes FRICTION; handler also rejects defensively.
- **Consent token shape**: `{ source: 'designer' | 'agent-proposed-designer-confirmed', rationale?: string }`. Required on every mutating tool. Read-only ops (e.g., `manage_definitions query-overlap`) skip consent.
- **NC ratificationStatus** asymmetric vs RC `ratification`: NCs get a string flag, RCs get an object with `{ratifiedAtRound, text}`. Asymmetry preserved in this sprint; D.2/D.3 renderer work may unify.
- **Bulk-ratify on close** (RULE-9): every active draft NC and unratified active RC ratifies at `confirm_closure_go`. Withdrawn elements untouched.
- **Closing-flag preservation exception**: `recordDesignerGo` is the documented exception that does NOT clear `closingArgPresentedRound` / `closingArgGoRound` — closure must remain observable. All other mutations clear both flags.
- **Universal-withdraw heterogeneous routing**: storage stays heterogeneous (`Map<id, element>`, `concerns[]`, `definitions[]`), three internal `withdrawElement` / `withdrawConcern` / `withdrawDefinition` functions; server tool routes by category via `entityType(element_id)` prefix derivation.

## Verification Results

| Check | Result |
|-------|--------|
| `npm test` (full suite) | 483 pass, 0 fail across 33 test files |
| Test count delta | 281 baseline → 483 final (+202) |
| Per-task spec review | 16/16 PASS (one re-review after Task 8 fix) |
| Per-task quality review | 16/16 actionable, ~12 fixes folded in inline |
| Final code review | With fixes (3 Important folded in as `eaecb4b`) |
| Clean git tree | Confirmed at HEAD `eaecb4b`; checkpoint at `43fe2c6` |

## Known Remaining Items (deferred to D.2 / D.3)

- **Helper extraction**: `state.js` (1,272 lines) has 17 mutating exports each repeating ~6 lines of `consent → clone → clearFlags → appendLog` preamble. A single `mutateState(state, consent, mutator, logEntry)` helper would shrink the file ~100 lines and make the operationLog-append invariant structural.
- **state.js decomposition**: split into `state-elements.js` / `state-concerns.js` / `state-definitions.js` / `state-closure.js`.
- **NC vs RC ratification shape asymmetry**: NC stores a string flag; RC stores an object. Renderers will see heterogeneous shapes via `extractRatification`.
- **`addConcern` error swallow** in `handleOpenProof`: tuple destructure ignores the `err` slot. Currently unreachable (consent transitive across the call sequence) but should be either checked or documented.
- **Full open→build→close→reopen→revise→re-close end-to-end test**: `closing-argument-end-to-end.test.js` and `reopen.test.js` cover halves; one trajectory across both would harden D.2/D.3 against transition regressions.
- **`classifyStateError` fragmentation**: bypassed by handlers as new domain codes accumulated. Either retire it or extend it with a per-handler code-override map.

## Files Changed

**Production code** (`skills/design-large-task/proof-mcp/`):
- `state.js` — 17 mutating exports extended/added; ~1,272 lines (was ~700)
- `server.js` — 8 new tools + handlers; ~970 lines (was ~600)
- `proof.js` — `SCHEMA_VERSION`, `validateConsentToken`, `CONSENT_SOURCES`, `CATEGORIES`, `DISPOSITIONS_BY_CATEGORY`, `entityType`
- `closing-argument.js` — extended envelope + `extractRatification` + `closureProvenance`
- `metrics.js` — `concernsRatificationGate` + Definitions counters
- `definitions.js` (new) — `validateDefinitionInput`, `createDefinition`, `queryOverlapCandidates`

**Test files** (`skills/design-large-task/proof-mcp/__tests__/`):
- New: `schema-version`, `atomic-persistence`, `consent`, `operation-log`, `definitions`, `categories`, `withdraw`, `open-proof-consent`, `bulk-ratify`, `reopen`, `nc-ratification-status`, `friction-consent` (12 new files)
- Extended: `metrics`, `server`, `mutation-clears-flags`, `closing-argument`, `closing-argument-end-to-end`, `trigger-evaluator`

**Skill documentation**:
- `skills/design-large-task/SKILL.md` — Solve Stage opening (consent token construction); Phase 5 Closure (brief renderer step). Bumped `v0011 → v0012`.

## Commits (sprint-d-1 branch, BASE 0fef98e → HEAD 43fe2c6)

| SHA | Subject |
|-----|---------|
| `f27945f` | feat(proof-mcp): add schemaVersion field with forward-incompatible refusal (NC-15) |
| `6e8c3c1` | feat(proof-mcp): atomic saveState via write-tmp-then-rename (NC-17) |
| `75b0364` | feat(proof-mcp): consent token validation across mutating tools (NC-8) |
| `3164e68` | feat(proof-mcp): operationLog with per-mutation appends (NC-4) |
| `2439ed6` | feat(proof-mcp): per-Concern status field + ratifyConcern + manage_concerns ratify op (NC-18, RULE-6) |
| `477d402` | feat(proof-mcp): NC ratificationStatus field with revise-resets-to-draft (NC-18, RULE-8) |
| `82d5bcc` | feat(proof-mcp): Friction source field + consent inheritance via processFriction (NC-3, NC-13) |
| `af88a03` | feat(proof-mcp): definitions.js + manage_definitions + Definitions counters in completeness (NC-7, RULE-5) |
| `d10ba1e` | feat(proof-mcp): CATEGORIES enum + DISPOSITIONS_BY_CATEGORY map + entityType helper (NC-2) |
| `7516958` | feat(proof-mcp): universal withdraw tool with FRICTION rejection (PERM-1, NC-5, NC-6) |
| `c535eab` | feat(proof-mcp): open_proof consent token + INVALID_SEED_PACKET + open-event log (NC-1, RC-1) |
| `ddb1533` | feat(proof-mcp): concernsRatificationGate hard gate + isError on present_closing_argument refusal (NC-9) |
| `119beff` | feat(proof-mcp): closing-argument envelope completeness (NC-9, NC-16) |
| `2f0f66f` | feat(proof-mcp): recordDesignerGo sets proofStatus closed + bulk-ratify NCs/RCs (RULE-9, NC-12) |
| `5d7fb7f` | feat(proof-mcp): reopen_proof tool + lastClosureArtifact retention (NC-12) |
| `6d816c0` | test(proof-mcp): cover new mutating tools in mutation-clears-flags coverage (AC-5.3, NC-11) |
| `9ff9af8` | docs(skill): consent token construction + brief renderer step in Solve/Closing phases (NC-1, NC-8) |
| `eaecb4b` | fix(proof-mcp): operationLog parity + structured SCHEMA_VERSION_TOO_NEW error |
| `43fe2c6` | checkpoint: execution complete |

## Handoff Notes

- **Sprint complete and ready for archive/merge.** Working tree clean. 483 tests pass. SKILL.md version bumped to v0012 to surface the docs change.
- **Master plan context**: this is the first cluster of `20260430-02-rebuild-design-derivation`. D.2 and D.3 sub-sprints will pick up the deferred-helper work and end-to-end test coverage noted under "Known Remaining Items".
- **Architecture A choice surfaced as a constraint** for D.2/D.3: future tools must integrate via the `withdraw` / `manage_*` / consent-token pattern, not direct state-layer access.
- **The reasoning audit** (sibling file `cluster-d-1-audit-00.md`) covers per-decision review-loop dynamics: which adversarial findings landed inline vs which were deferred, and why each call was made.
- **Decision-record corpus** at `docs/chester/decision-record/decision-record.md` may have new entries appended (cross-sprint architectural commitments from this session).

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0004 -->
<!-- produced-by finish-write-records@v0003 -->
