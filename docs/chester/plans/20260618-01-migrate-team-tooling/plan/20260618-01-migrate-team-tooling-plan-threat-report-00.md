# Combined Threat Report — 20260618-01-migrate-team-tooling plan

**Plan:** plan/20260618-01-migrate-team-tooling-plan-00.md
**Reviews run:** plan-attack (unconditional) + plan-smell (fired).
**Combined implementation risk:** **Low** (after inline fixes).

## Smell Heuristic Pre-Check

- **Matched trigger (verbatim):** `Task\.` (async/concurrency category) matched the prose substring **"task-by-task."** in the plan's boilerplate `> For agentic workers` line.
- **Verdict:** false positive. The trigger list is C#-oriented (`Task.` = the `System.Threading.Tasks` namespace); here it collided with the English word "task." + sentence period. The plan introduces no code, no async primitives, no new abstractions.
- **Action:** per the rigid over-fire discipline ("any literal match fires; false positives cost one dispatch"), `plan-smell` was dispatched anyway. It confirmed no structural smell of substance.

## plan-attack findings

- **HIGH-1 (FIXED) — hardcoded stamping-test version.** `tests/test-stamping-execute-write.sh:12` pins `[ "$CUR_VER" = "v0009" ]`; Task 3 bumps the skill to `v0010`, which would fail the test. Fix: Task 3 now lists the test file in its Files block, adds a Step-3 sub-step moving lines 10/12 to `v0010`, and stages the test in the Step-5 commit. Broader sweep confirmed this is the ONLY hardcoded-version test in the blast radius — the committee bumps (SKILL.md v0025, team-lead.md v0015) are covered by range checks (`past v0017`, `past v0007`) and stay green.
- **HIGH-2 (FIXED) — AC-3.2 verification grep collided with the rewrite's own content.** The proposed memory body named the dead tools to say they were removed ("There is no `TeamCreate`/`TeamDelete`…"), so the `grep -ciE "team_name|TeamCreate|TeamDelete|off-roster"` expect-0 check would return 3. Fix: the memory body was rewritten to describe the new model positively and never type the dead-tool tokens; re-verified — the grep now returns 0. This also strengthens the Innovator-dissent mitigation (no legacy vocabulary survives the rewrite).
- **MEDIUM (FIXED) — wrong red-state count.** Task 3 Step 1 claimed "nine matches" and "`:96` carries both verbs"; reality is six matching lines (`:96` = TeamCreate, `:98` = TeamDelete, plus four references). Corrected.
- **LOW (FIXED) — stamping-test comment drift.** `test-stamping-execute-write.sh:10` documents the old v0009 rationale; the new Step-3 sub-step updates the comment alongside the assertion.

### plan-attack VERIFIED-TRUE (no action)

- Word-sense guard correct — the new assertions target `roster dispatch|off-roster`, never the bare string `roster`; the member-list uses at SKILL.md:34/:103 and team-lead.md:66 survive.
- AC-1.4 shared-line preservation — the surgical edits to team-lead.md:99/:102 keep "reads only … Final Position" and the scribe bounded-input contract; the closure step-4 edit (line 141) does not disturb the step-2 provenance-stamp (line 139, asserted by test line 87).
- Coverage complete — every TeamCreate/TeamDelete occurrence in the committee files, and every team_name occurrence in team-lead.md, maps to a named edit step; nothing orphaned.
- Catalog-safety correct — no `description` field is edited, so `test-generated-agents-current.sh` stays green.
- Test insertion anchors correct — the new `assert_*` functions/calls land inside the test file's designed regions (ends at lines 123 / 136).

## plan-smell findings (all LOW, advisory)

- **Dual-location nested-teams note** — the precondition appears in both Bootstrap and Integration; the `>=2` count assertion proves quantity, not placement, so the two could drift. Acceptable for a one-line precondition in one file; noted for the implementer.
- **Cross-file vocabulary divergence** — committee files say "one-shot subagent", execute-write says "one-shot worker"; the team-lead test pins "one-shot subagent". A future harmonization to one term would need a coordinated test update. Low-friction, flagged.
- **`>=2` count assertion is placement-blind** — a future third occurrence of the phrase would pass silently. Noted.

## Risk rationale (why Low)

1. Pure documentation/vocabulary migration — no code, no behavior change, no new abstractions; the only smell trigger was a prose false-positive.
2. Both HIGH findings were verification-mechanics defects (a hardcoded test version, a grep token-collision), now fixed inline and re-verified.
3. The central hazard (word-sense over-deletion) and the AC-1.4 shared-line invariant were independently VERIFIED-TRUE by the adversarial pass.
4. Coverage is exhaustive and catalog-safety holds.
5. Residual findings are LOW doc-coupling notes — implementer context, not blockers.

## Designer options

1. **Proceed** to execute-write as-is (plan already amended for all four fixed findings).
2. **Proceed with directed mitigations** (e.g., harmonize the "one-shot subagent" / "one-shot worker" vocabulary across both skills in this sprint).
3. **Return to design** with additional requirements.
4. **Stop.**

<!-- created-at: 2026-06-19 -->

<!-- created-at: 2026-06-19T09:49:44Z -->
<!-- produced-by plan-build@v0007 -->
