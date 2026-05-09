# Sprint D-1 Fix Proof MCP 2 — Summary

**Sprint:** `cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2`
**Date:** 2026-05-08 → 2026-05-09 (single-session sprint)
**Status:** Execution complete; tests green; ready for archive + merge.

This summary file was initialized by execute-write (Tasks 8 and 9) with the AC-8.1 and AC-9.1 sections. `finish-write-records` appended the session-summary content below those sections at sprint finish.

## Proposed PERM-2 Revised Text (for sprint-d-2 resume)

### Current PERM-2 Statement (verbatim from sprint-d-2-proof-state.json)

> When ratifying a Resolve Condition, any proof element in that Resolve Condition's transitive support — the anchored Concern, every Necessary Condition cited in the Resolve Condition's reasoning chain, and every Rule, Permission, Evidence, or Definition those Necessary Conditions ground onto, recursively — may be ratified in the same round. Relieves RULE-17 (single-topic discipline) for the duration of the bundled ratify turn. Supersedes PERM-1's narrow 1:1 RC+Concern scope.

### Proposed Revised Statement

> When ratifying a Resolve Condition, any proof element in that Resolve Condition's transitive support that has a ratify lifecycle — the anchored Concern, every Necessary Condition cited in the Resolve Condition's reasoning chain, and any Vocabulary Definition those elements reference — may be ratified in the same round. Rules, Permissions, Evidence, and Risks carry provenance via their `source` field and have no ratify lifecycle; they are excluded from the bundled ratify scope. Relieves RULE-17 (single-topic discipline) for the duration of the bundled ratify turn. Supersedes PERM-1's narrow 1:1 RC+Concern scope.

### Rationale

The original PERM-2 statement scopes ratify-bundle over Rules, Permissions, Evidence, and Risks. The proof MCP tool surface has no ratify concept for these element types — `manage_concerns op:ratify`, `ratify_resolve_condition`, `manage_definitions op:ratify`, and the new `ratify_necessary_condition` (shipped this fix sprint) are the only ratify tools. Rules, Permissions, Evidence, and Risks carry provenance via the `source` field on element creation (`'codebase'`, `'designer'`, `'industry'`, etc.); their authority is established at creation, not via a separate ratify lifecycle.

Aligning PERM-2's text with the implemented tool surface preserves the spirit of the designer's original directive (broad transitive ratify-bundle relief during RC ratify) while restricting the scope to elements the implementation can actually ratify. Any future expansion of ratify discipline to additional element types would require a separate Permission revision.

### Coordination Plan for sprint-d-2 Resume

1. Sprint-d-2 resume session re-enters at round 19 (RCON-2 already added; pending ratify).
2. As the first action of the resume, agent presents the proposed revised PERM-2 text above to the designer via a ratify-readback turn.
3. Designer ratifies, revises, or rejects.
4. On ratify: agent calls `submit_proof_update` with `{ op: 'revise', target: 'PERM-2', statement: '<revised text>' }` and consent source `'designer'` quoting the designer's accept.
5. Sprint-d-2 resume continues from round 20 with the revised PERM-2 governing the ratify-bundle relief.

This deferral is intentional. The fix sprint cannot unilaterally revise a designer-issued Permission in a live proof state — designer consent in the active design session is the only valid path. The fix sprint produces the proposed text to make sprint-d-2 resume's coordination cost minimal.

## NCON-15 Lifecycle Gap (sprint-d-2 owned)

### Current NCON-15 Statement (verbatim from sprint-d-2-proof-state.json)

> Necessary Conditions are authored by the agent in a draft-then-review cycle. Each NC carries five required fields: statement (the must-be-true claim), grounding (pointers to active Evidence/Rule elements), reasoning chain (IF...THEN... structure connecting grounding to statement), collapse test (what breaks if NC removed from proof), rejected alternatives (design-space candidates considered and discarded with reasons). Agent drafts the full NC before designer review per PM-as-decider; designer-facing turn prints the full text of all five fields (not just ID + summary). Designer responds with accept, push back, or revise; revisions cycle until accept. Rejected alternatives field accumulates each refinement pass as paper trail — prior drafts that lost to the landed shape stay recorded with reasons, not deleted. Multi-NC authoring per round prohibited unless Concern coverage requires NC+RC pair (slot 3 sub-state).

### Observation

NCON-15 describes the NC text-authoring lifecycle (draft → review → accept). It is silent on the orthogonal `ratificationStatus` lifecycle now made structurally real by sprint-d-1-fix-proof-mcp's first-yes precondition (AC-4.1) and sprint-d-1-fix-proof-mcp-2's `ratify_necessary_condition` tool (this sprint).

The two lifecycles are independent:

- **Text-authoring lifecycle** (NCON-15 territory) — `state.statement` / `state.grounding` / `state.reasoning_chain` / `state.collapse_test` / `state.rejected_alternatives`. Designer-accept on text closes this cycle.
- **Ratification lifecycle** (new territory) — `state.ratificationStatus`. Designer-attestation closes this cycle. `ratify_necessary_condition` flips draft → ratified; `op:revise` of statement or grounding flips ratified → draft.

NCON-15 currently conflates "designer accept on text" with structural commitment to the NC. With ratify lifecycle now real, that conflation is no longer accurate — designer can text-accept an NC without ratifying it, and the proof MCP's first-yes gate will refuse `present_closing_argument` if any active NC remains in `ratificationStatus: 'draft'` regardless of text-acceptance.

### Two Paths Sprint-D-2 Can Take

1. **Revise NCON-15** to add a sentence about the ratify step. Example revision text: "After designer accept on text, the NC enters `ratificationStatus: 'draft'`. A separate ratify turn (per slot 2 of the round-cycle queue) flips ratificationStatus to 'ratified' via `ratify_necessary_condition`. Revising statement or grounding after ratification reverts ratificationStatus to draft, requiring re-ratification before closure."

2. **Author a new NC** covering the ratify lifecycle as a separate concern. The new NC would name the ratify-cycle invariants (one ratify call per NC; mid-revision reset; first-yes gate dependency) without expanding NCON-15's authoring-cycle scope.

### Deferral

This is a sprint-d-2 design decision; the fix sprint does not touch the proof state. The decision affects sprint-d-2's proof body and closure path; making it requires designer attention in the active design session, not a code-fix sprint.

Sprint-d-2 resume should address this either before or after the PERM-2 alignment turn, at the designer's preference.

---

## Session Recap

### Goal

Restore the closure path of the proof MCP after sprint-d-1-fix-proof-mcp's interaction between AC-2.4 (bulk-ratify removal) and AC-4.1 (first-yes precondition addition) left no code path to flip an NC's `ratificationStatus` from `'draft'` to `'ratified'`. Result of the upstream defect: `present_closing_argument` was unreachable, formal closure unreachable, closing-argument envelope unproducible. This fix sprint shipped a dedicated `ratify_necessary_condition` tool to close the gap.

### What Shipped

| AC | Task | Outcome |
|----|------|---------|
| AC-1.1 (state function exported) | Task 1 | `ratifyNecessaryCondition` added to `state.js` after line 365; 11 unit tests covering happy path + 8 guard refusals + log entry shapes |
| AC-1.2 (tool registered + dispatched) | Task 2 | `ratify_necessary_condition` registered in `server.js` TOOLS array; dispatcher case + exported `handleRatifyNecessaryCondition`; 4 server-level tests |
| AC-1.3 (post-finish guard) | Task 1 | `state.proofStatus === 'finish'` returns `PROOF_FINISHED`; verified |
| AC-1.4 (`ALREADY_RATIFIED` guard) | Task 1 | New error code; falls through `classifyStateError` to `DOMAIN_ERROR` per spec |
| AC-1.5 (status guard for withdrawn NCs) | Task 1 | `target.status !== 'active'` refuses; verified |
| AC-2.1 (mid-revision reset preserved end-to-end) | Task 4 | Integration test exercises ratify → revise → draft → re-ratify cycle |
| AC-3.1 (`resetFirstYesIfFired` invariant) | Tasks 1, 3 | Function calls helper; cross-mutator scaffold extended in `mutation-clears-flags.test.js` |
| AC-4.1 (stale comment fixed) | Task 5 | `proof.js:245` replaced with spec-exact text; redundant line 246 deleted |
| AC-5.1 (closure-path integration test) | Task 4 | New `__tests__/closure-path-integration.test.js` with 4 cases (full path success, FIRST_YES_GATE_FAILED on draft NCs, mid-revision cycle, partition correctness); also added `export` keyword to `handleConfirmClosureGo` (one-word change at server.js:693) so the test could import it |
| AC-6.1 (SKILL.md toolset entry) | Task 6 | Bullet inserted at SKILL.md:435 after `ratify_resolve_condition` |
| AC-7.1 (decision-record entry) | Task 7 | `dr-20260508-08-nc-ratify-path-closes-first-yes-gate-cycle` appended to cross-sprint corpus; format adapted from plan's markdown-heading shape to corpus's YAML-frontmatter convention |
| AC-8.1 (PERM-2 proposed-text section) | Task 8 | Section in this summary file (above) |
| AC-9.1 (NCON-15 pending-decision section) | Task 9 | Section in this summary file (above) |

### Code Changes

- **Modified:** `state.js` (+1 export `ratifyNecessaryCondition`, ~50 lines), `server.js` (+1 import, +1 TOOLS entry, +1 dispatcher case, +1 exported handler `handleRatifyNecessaryCondition`, +1 `export` keyword on `handleConfirmClosureGo`), `proof.js` (1-line comment update + line deletion), `__tests__/mutation-clears-flags.test.js` (+1 it() case), `skills/design-large-task/SKILL.md` (+1 bullet), `docs/chester/decision-record/decision-record.md` (+1 record).
- **Created:** `__tests__/ratify-necessary-condition.test.js` (15 tests), `__tests__/closure-path-integration.test.js` (4 tests).
- **Test count delta:** 509 (pre-fix baseline) → 529 (post-fix). +20 tests across the two new files plus the cross-mutator scaffold extension.

### Commit Sequence

```
0761f20 checkpoint: execution complete
1ca5ea0 docs(decision-record): append sprint-d-1-fix-proof-mcp-2 record
9ca980d docs: add ratify_necessary_condition to proof-MCP toolset
b33176a docs: update stale ratificationStatus lifecycle comment
3347e65 test: assert addConcern error in closure-path setup
561cc0e test: closure-path integration test exercises NC ratify + present + confirm
3132ffa style: align NC ratify case to mutation-clears-flags scaffold idiom
2ee88b6 test: add ratifyNecessaryCondition to mutation-clears-flags coverage
cc5d9d8 feat: register ratify_necessary_condition MCP tool
3af1598 style: trim dead test imports + use state.round in NC ratify log
038842b feat: add ratifyNecessaryCondition state function
```

### Process Notes

- **Plan hardening caught two HIGH defects** the plan-writer missed despite spec-stage ground-truth review: `handleConfirmClosureGo` not exported (would have killed Task 4 at import), and `addConcern`'s 4-tuple return shape misread in the integration test scaffold. Both fixed inline before execute-write started. Adversarial review earned its keep.
- **Quality reviewers caught Important/Minor cleanups during execution:** unused imports in Task 1's test file, scaffold-idiom divergence in Task 3, silent-failure-risk destructure in Task 4. All applied as same-task cleanup commits. Net: cleaner final diff than the implementer's first pass.
- **Task 7 correctly diverged from plan's markdown-heading format** when the implementer inspected the corpus and found YAML-frontmatter records as the established convention. Substance preserved; format adapted. This is the right pattern for "plan vs. reality" mismatches — the implementer detected and fixed the plan's mistake rather than blindly following it.

### Deferred to Sprint-D-2 Resume

- **PERM-2 text alignment** — the live PERM-2 in `sprint-d-2-proof-state.json` scopes ratify-bundle over Rules / Permissions / Evidence / Risks (no ratify lifecycle); revising it requires designer ratification in active sprint-d-2 session. Proposed revised text is in this summary's PERM-2 section (above).
- **NCON-15 lifecycle clarification** — NCON-15 describes NC text-authoring lifecycle but is silent on the orthogonal `ratificationStatus` lifecycle now made structurally real. Sprint-d-2 chooses between revising NCON-15 or authoring a new NC. See NCON-15 section above.

### Resume Path for Sprint-D-2

1. Read this summary's PERM-2 + NCON-15 sections.
2. Re-enter sprint-d-2 at round 19 (RCON-2 already added via Task 0 of sprint-d-2; ratify pending).
3. First action: present proposed PERM-2 revised text to designer via ratify-readback turn; designer ratifies/revises/rejects; on ratify, `submit_proof_update op:revise` against PERM-2.
4. Then resolve NCON-15 lifecycle decision (revise vs new NC).
5. Resume Slot 3 RC authoring + Slot 2 ratify-with-bundle for CERN-3 through CERN-12.
6. Closing argument fires when all 17 NCs + 12 Concerns + 12 RCs ratified via the new `ratify_necessary_condition` tool plus existing ratify tools.

## Session Skill Versions

<!-- produced-by design-specify@v0003 -->
<!-- produced-by plan-build@v0004 -->
<!-- produced-by finish-write-records@v0003 -->
