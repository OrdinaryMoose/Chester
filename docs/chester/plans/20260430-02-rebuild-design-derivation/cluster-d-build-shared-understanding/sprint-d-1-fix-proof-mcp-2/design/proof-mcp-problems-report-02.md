# Proof MCP — Problems Report 02 (post-d-1-fix)

**Date:** 2026-05-08
**Discovered during:** sprint-d-2 resume, round 19
**Source:** D.2 design session resumed against proof MCP after sprint-d-1-fix-proof-mcp merge (commit `a2b8d91`)
**Reference spec:** `sprint-d-1-fix-proof-mcp/spec/sprint-d-1-fix-proof-mcp-spec-NN.md` (16 ACs, +8 tests)
**Predecessor report:** `sprint-d-1/summary/proof-mcp-problems-report.md` (D.2-discovered defects driving the d-1 fix)

---

## Executive summary

Sprint-d-1-fix-proof-mcp landed two interacting changes that, together, leave the proof MCP unable to reach its formal closure point:

- **AC-2.4** (commit `2faaf1a`) removed the bulk-ratify-NCs hook from `recordDesignerGo`. This was the only code path that ever flipped a Necessary Condition's `ratificationStatus` from `'draft'` to `'ratified'`.
- **AC-4.1 / AC-4.2** (commit `a0b9937` + `bf27706`) added a per-element first-yes precondition to `present_closing_argument`. The gate refuses if any active NC has `ratificationStatus === 'draft'`.

**The fix removed the only NC-ratify code path while adding a gate that requires NC ratification.** No replacement tool, function, or code path was shipped to flip an NC to `'ratified'`. Result: `present_closing_argument` is unreachable, formal closure cannot happen, and the closing-argument envelope (which `design-brief` rendering depends on) cannot be produced.

This is a structural blocker mirroring the pattern of D-1 in the predecessor report (`manage_concerns op:lock` blocking `op:add`): a gate added without the matching mutation path. Same friction shape, different element type.

The blocker is a clean, contained refactor miss — the surrounding work (consent gate, single-op-per-call, lifecycle vocabulary, withdraw routing, summary mode, mid-revision flag reset) all landed cleanly. This report scopes a follow-up fix sprint.

---

## Critical — Blocks Designer Intent

### P-1. NC `ratificationStatus` has no write path to `'ratified'`

**Severity:** Critical — blocks `present_closing_argument`, blocks formal closure, blocks closing-argument envelope generation, blocks design-brief renderer step in `design-large-task` Phase 5.

**Behavior:**

- `proof-mcp/proof.js:248` sets `element.ratificationStatus = 'draft'` on every NC at creation.
- `proof-mcp/state.js:531` resets `target.ratificationStatus = 'draft'` on every NC `op:revise` of `statement` or `grounding`.
- `proof-mcp/state.js:693` defaults `ratificationStatus ??= 'draft'` for legacy NCs in loadState backfill.
- `proof-mcp/first-yes-gate.js:18` checks `el.ratificationStatus === 'draft'` for every active NC and adds the id to `unratifiedIds`. `present_closing_argument` calls this gate; refuses with `FIRST_YES_GATE_FAILED` if `unratifiedIds.length > 0`.
- `proof-mcp/closing-argument.js:71` partitions active NCs into `activeNCs` (ratified) and `draftNCs` (draft) for the envelope output.
- `proof-mcp/server.js:408` counts `el.ratificationStatus === 'ratified'` into `counts.ratified.ncs` for metrics.

**Verification:**

```bash
grep -rn "ratificationStatus = 'ratified'" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-large-task/proof-mcp \
  --include="*.js" \
  | grep -v node_modules \
  | grep -v __tests__
# Returns: zero matches
```

No source path writes `'ratified'` to `ratificationStatus` for any NC. The previous bulk-ratify hook in `recordDesignerGo` was the only such path; AC-2.4 removed it without ship­ping a replacement.

**Spec position:**

`sprint-d-1-fix-proof-mcp` spec AC-4.1 introduces the first-yes precondition language: "the call requires every active element to be individually ratified across all four lanes (NCs, RCs, Concerns, Definitions)." The spec implies a per-element NC ratify path exists; the tool surface does not provide one. AC-2.4 ("remove bulk-ratify hook") removed the only existing path without flagging the dependency.

**Hit empirically:**

Sprint-d-2 round 19, evaluating PERM-2's transitive support bundle for RCON-2 ratify. The bundle includes NCON-9 + NCON-13 (which CERN-2's RC leans on) plus RULE-1 / RULE-2 / RULE-3 (NC grounding). Inspection of the proof MCP source revealed no NC-ratify tool. Round 19 RC ratify cannot proceed without bypassing first-yes gate or mocking NC ratification status.

**Fix paths (not recommendations — choices for the fix sprint):**

1. **Add `ratify_necessary_condition` tool.** Per-element ratify with consent token. Mid-revision reset preserved (already in state.js:531). Mirrors `ratify_resolve_condition` shape. Schema: `{ state_file, element_id (NCON-N), ratification (sign-off text), consent }`. Single element_id per call. Rebuild first-yes flags on success per AC-4.4 pattern.
2. **Restore bulk-ratify path with redesign.** Reintroduce a guarded bulk-ratify hook, fired from a designer-driven explicit tool (e.g., `bulk_ratify_ncs`) with consent token. Less aligned with per-element discipline but cheapest mechanically.
3. **Drop NCs from first-yes-gate scope.** Edit `first-yes-gate.js:18` to skip the NC check; first-yes gate becomes RC + Concern + Definition only. Changes the audit semantic — NCs no longer designer-attested at closure.
4. **Lazy auto-ratify on coverage.** When an RC ratifies under PERM-2's transitive scope, NCs in the support tree auto-ratify alongside. Tightly couples NC lifecycle to RC lifecycle — semantically debatable.

Recommendation: **path 1** (per-element NC ratify tool). Aligns with the per-element discipline AC-4.1 was clearly aiming for. Cleanest semantic fit.

---

## Important — Surface Mismatches

### P-2. PERM-2 transitive scope cannot be honored end-to-end by current tool surface

**Severity:** Important — designer-issued Permission references mutations the implementation cannot perform.

**Behavior:**

PERM-2 (designer-issued sprint-d-2 round 18) text:

> When ratifying a Resolve Condition, any proof element in that Resolve Condition's transitive support — the anchored Concern, every Necessary Condition cited in the Resolve Condition's reasoning chain, and every Rule, Permission, Evidence, or Definition those Necessary Conditions ground onto, recursively — may be ratified in the same round. Relieves RULE-17 (single-topic discipline) for the duration of the bundled ratify turn.

Tool surface ratify capability:

- `ratify_resolve_condition` — RCs only.
- `manage_concerns op:ratify` — Concerns only.
- `manage_definitions op:ratify` — Definitions only.
- **No tool ratifies NCs** (P-1).
- **No ratify concept exists** for Rules, Permissions, Evidence, Risks, Friction.

Permission grants relief over an action the tool surface cannot perform on five of the seven element types it names.

**Hit empirically:** sprint-d-2 round 18-19, designer accept of (a) transitive scope.

**Fix paths:**

1. **Align Permission text with implementation.** Revise PERM-2 to scope ratify-bundle to the four ratifiable lanes (RC + Concern + Definition + NC-once-P-1-fixed). Drop Rules / Permissions / Evidence / Risks from the scope.
2. **Extend ratify concept to Rules / Evidence / Permissions / Risks.** Designer-attestation on the proof's grounding chain. Larger surface change. Probably not worth it — these elements have explicit `source` field already (codebase / designer / industry) which carries provenance.

Recommendation: **path 1** (text alignment). Ratify discipline applies to claim-class elements (must-be-true, will-be-true, named-target, vocabulary-anchor); grounding-class elements (codebase fact, designer directive, designer relief, hazard) carry provenance via `source` field, not ratify lifecycle.

### P-3. AC-2.4 + AC-4.1 landed in same merge without bridging path

**Severity:** Important — process gap. The two ACs are individually correct; their interaction is the defect.

**Behavior:**

- AC-2.4 removed bulk-ratify-NCs as a side-effect of `confirm_closure_go`.
- AC-4.1 added per-element first-yes precondition gate before `present_closing_argument`.

The d-1-fix-proof-mcp test suite (509/509 green) verified each AC independently. No integration test exercised the full path: NC creation → first-yes gate firing → present_closing_argument → confirm_closure_go. Such a test would have caught the missing ratify path.

**Spec position:** d-1-fix-proof-mcp spec lists each AC's tests but none chain through the full closure path with NCs in scope. Tests likely synthesize state with `ratificationStatus: 'ratified'` directly OR test gates with empty NC lanes.

**Hit empirically:** sprint-d-2 round 19. d-1-fix tests passed; d-2 resume hit the gap.

**Fix paths:**

1. **Add integration test for full closure path with NCs in scope.** Build state with active NCs, call NC ratify (P-1 fix), verify first-yes flips, call `present_closing_argument`, verify success, call `confirm_closure_go`, verify proofStatus → finish.
2. **Add closure-path smoke test as part of d-2-fix sprint** independent of P-1's fix shape — verify whatever ratify path lands does drive first-yes to pass.

Recommendation: ship both. Smoke test in d-2-fix; integration test as part of P-1's tool ship.

### P-4. Stale comment in proof.js:245

**Severity:** Important — code-comment misalignment misleads future readers about lifecycle.

**Behavior:**

`proof-mcp/proof.js:245` comment:

```js
// NC-only ratificationStatus (NC-18, RULE-8): bulk-ratified at confirm_closure_go;
```

The "bulk-ratified at confirm_closure_go" claim is no longer true. AC-2.4 removed the bulk-ratify path. Comment was not updated.

**Fix path:** update comment to reflect new lifecycle once P-1 is fixed. Suggested: "NC-only ratificationStatus (NC-18, RULE-8): per-element ratify via `ratify_necessary_condition`; reset to 'draft' on revise."

---

## Moderate — Downstream Contamination

### P-5. closing-argument.js partitions render empty `activeNCs` indefinitely

**Severity:** Moderate — closure-cycle artifact integrity.

**Behavior:**

`proof-mcp/closing-argument.js:71`:

```js
const ratifiedNCs = activeElements
  .filter(el => el.type === 'NECESSARY_CONDITION' && el.status === 'active' && el.ratificationStatus === 'ratified');
const draftNCs = activeElements
  .filter(el => el.type === 'NECESSARY_CONDITION' && el.status === 'active' && el.ratificationStatus === 'draft');
```

Without P-1 fix, every active NC lands in `draftNCs`; `activeNCs` is always empty. If first-yes gate were bypassed (e.g., via path 3 in P-1 — drop NCs from gate), the rendered closing-argument envelope would contain empty `activeNCs` array and full `draftNCs` array, then design-brief renderer would emit a brief whose body claims no ratified NCs exist. Misleads downstream consumers.

**Fix path:** Subsumed by P-1. Once NCs can ratify, partition fills `activeNCs` correctly.

### P-6. metrics.completeness.ratified.ncs always reads 0

**Severity:** Moderate — metric misreports proof health.

**Behavior:**

`proof-mcp/server.js:408`:

```js
if (el.ratificationStatus === 'ratified') counts.ratified.ncs++;
```

Counter never increments without P-1 fix. `get_proof_state` exposes this metric; anyone reading proof health for sprint planning sees a misleading zero.

**Fix path:** Subsumed by P-1.

---

## Documentation

### P-7. Skill body describes first-yes gate without naming the NC ratify tool

**Severity:** Documentation — reader cannot find the tool the description implies.

**Behavior:**

`skills/design-large-task/SKILL.md` describes `present_closing_argument`:

> First-yes precondition: the call requires every active element to be individually ratified across all four lanes (NCs, RCs, Concerns, Definitions — no element may be in working state); without that, the call returns a structured `FIRST_YES_GATE_FAILED` error whose payload includes `unratified_ids` listing every element still missing ratification. Resolve those ratifications before re-attempting.

The "Resolve those ratifications" instruction implies a per-NC ratify tool exists; agent reading the skill body will not find one in the proof-MCP toolset section above.

**Fix path:** After P-1 ships, add the new tool name to the proof-MCP toolset section, with a one-line description matching the `ratify_resolve_condition` entry.

### P-8. NCON-15 (NC authoring discipline) describes draft-then-review without mentioning ratificationStatus lifecycle

**Severity:** Documentation — internal D.2 NC says nothing about how the NC eventually ratifies.

**Behavior:**

NCON-15 (active sprint-d-2 NC, rounds 11-12) describes NC authoring as "draft-then-review with five required fields." The "review" loop ends in designer accept on text. The NC's `ratificationStatus` lifecycle — separate from text accept — is unmentioned.

**Fix path:** Once P-1 ships and per-NC ratify exists, NCON-15 may need revision to clarify that text accept alone does not ratify the structural element; explicit `ratify_necessary_condition` call is the second axis. Or NCON-15 stays as-is and a new NC covers the ratify lifecycle. Sprint-d-2 design decision — out of scope for fix sprint.

---

## Out of scope (deferred / tracking)

### P-9. SCHEMA_VERSION_TOO_NEW backwards-compat — verified working

**Status:** No defect. Sprint-d-2's pre-d-1-fix state file (`sprint-d-2-proof-state.json`) loaded cleanly under post-fix MCP. `loadState` legacy backfill (state.js:693) handles missing `ratificationStatus` field.

### P-10. Bulk-ratify removal explicitly rationalized in commit message

**Status:** Not a defect — design choice. AC-2.4 commit message: "remove bulk-ratify hook; refuse post-finish mutations across all mutators." Rationale was per-element discipline. The miss is the missing tool, not the choice itself.

---

## Recommended fix sprint scope

Naming candidate: `sprint-d-2-fix-proof-mcp` (consistent with `sprint-d-1-fix-proof-mcp` precedent). Master plan accumulates fix sprints as sub-sprints under cluster-d.

### Acceptance criteria draft

**AC-1. Add `ratify_necessary_condition` tool.**
- Tool signature mirrors `ratify_resolve_condition`: `{ state_file, element_id (NCON-N), ratification (sign-off text), consent }`.
- Single `element_id` per call; multi-NC ratify prohibited at tool level.
- Consent token required per RULE-16 hooks.
- Sets `el.ratificationStatus = 'ratified'` on success.
- Refuses if NC `status !== 'active'` (withdrawn NCs cannot ratify).
- Refuses if NC already ratified (returns `ALREADY_RATIFIED`).
- Refuses post-`finish` per AC-7.1 (post-finish-mutations-refused) pattern.
- Emits operationLog entry.
- Registers in `server.js` `case` switch.

**AC-2. Mid-revision reset preserved end-to-end.**
- `op:revise` of `statement` or `grounding` continues to reset `ratificationStatus = 'draft'` (already in state.js:531).
- Add unit test: NC ratifies → revise statement → ratificationStatus reverts to draft → first-yes gate fails → ratify again → first-yes passes.

**AC-3. First-yes flag reset on every mutating function.**
- Per AC-4.4 / AC-5.3 pattern, ratify_necessary_condition fires `resetFirstYesIfFired`.
- Coverage test: ratify NC after `present_closing_argument` already presented; verify `closingArgPresentedRound` and `closingArgGoRound` reset.

**AC-4. PERM-2 text alignment.**
- Sprint-d-2 design decision (out of fix-sprint scope) — designer revises PERM-2 text or sprint-d-2 closes with PERM-2 as currently written and lives with the over-broad scope as audit-trail.
- Fix sprint does not touch PERM-2.

**AC-5. Stale comment update.**
- proof.js:245 comment reflects new lifecycle.

**AC-6. Closure-path integration test.**
- New test file: `__tests__/closure-path-integration.test.js`.
- Build state with N active NCs, M active RCs, K Concerns, L Definitions.
- Ratify each via dedicated tool (NCs via new tool from AC-1; RCs/Concerns/Definitions via existing).
- Call `present_closing_argument` — expect success.
- Call `confirm_closure_go` — expect proofStatus → `finish`.
- Verify closing-argument envelope partitions (activeNCs / draftNCs) correctly.

**AC-7. Skill SKILL.md update.**
- Add new tool to proof-MCP toolset section in `skills/design-large-task/SKILL.md`.
- Description matches `ratify_resolve_condition` entry style.

**AC-8. Decision-record entry.**
- Append to cross-sprint decision-record corpus per established pattern.

### Estimated cost

By analogy to d-1-fix-proof-mcp (16 ACs, +8 tests, 1-day sprint): this sprint is smaller (8 ACs, 2-3 new tests, focused single-tool ship). Estimate: half-day to one-day cycle through plan-build → execute-write → finish.

### Resume protocol after fix-sprint merge

1. Sprint-d-2 resume re-enters at round 19 (RCON-2 already added; pending ratify).
2. Update sprint-d-2 summary-NN.md to log the second pause-and-resume cycle.
3. Designer either revises PERM-2 to match new tool surface (AC-4) or accepts it as historical paper trail.
4. Continue Slot 3 RC authoring + Slot 2 ratify-with-bundle for CERN-3 through CERN-12.
5. Closing argument fires when all 17 NCs + 12 Concerns + 12 RCs ratified (~22-24 more rounds).

---

## Provenance

- Discovered: 2026-05-08, sprint-d-2 round 19 resume session
- Reporter: design-large-task agent inspecting proof-MCP source after `submit_proof_update op:add` for RCON-2 succeeded but pre-ratify path inspection failed
- Root-cause inspection: `grep -rn "ratificationStatus = 'ratified'"` returning zero matches across non-test source
- Cross-references: sprint-d-1-fix-proof-mcp commits `2faaf1a` (AC-2.4 remove bulk-ratify), `a0b9937` (AC-4.1 first-yes precondition), `bf27706` (AC-4.2 first-yes-gate.js pure module), `bec1b2c` (AC-4.3 mid-revision flag reset)
