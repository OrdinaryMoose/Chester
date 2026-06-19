# Plan: Migrate committee and execute-write to post-v2.1.178 agent-teams model

**Sprint:** 20260618-01-migrate-team-tooling
**Spec:** docs/chester/working/20260618-01-migrate-team-tooling/spec/20260618-01-migrate-team-tooling-spec-00.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Remove every reference to the two removed Claude Code tools (`TeamCreate`, `TeamDelete`) from Chester's two live skills and their references, replace the `team_name` "roster/off-roster" discriminator with the spawn-shape "teammate/subagent" discriminator, delete the false `TeamDelete`-stranding justification, document the nested-teams precondition, and reconcile the two stale memories — without altering any skill's behavior, category structure, or the committee context-economy invariant.

## Architecture

A documentation/vocabulary migration, not a structural redesign. The post-v2.1.178 model maps onto Chester's existing committee structure with no residue: keep every category, the Dispatch Discipline section shape, the per-round flow, and the context-economy invariant; change only the dead API verbs, the stale discriminator vocabulary, and the obsolete justifications. Every change is a localized Markdown edit; verification is grep/structural assertion, not unit tests.

## Tech Stack

- Markdown skill/reference files under `skills/`.
- Bash structural test `tests/test-design-committee-context-economy.sh` — has designed insertion regions (lines 10 and 125) for new `assert_*` functions; this plan uses them so the committee migration is regression-guarded.
- `bash tests/test-generated-agents-current.sh` — catalog-currency gate; stays green because no `description` field changes (version bumps are catalog-safe).
- User memories live OUTSIDE the repo at `/home/mike/.claude/projects/-home-mike-Documents-CodeProjects-Chester/memory/`; Task 4 edits them but produces no git commit.

---

## Task 1: Migrate design-committee SKILL.md to the agent-teams model

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-4.1
**Decision budget:** 3
**Must remain green:** `test-design-committee-context-economy.sh` (existing `assert_skill_md` + `assert_scope_and_vocab` + the new `assert_team_tooling_skill`), `test-generated-agents-current.sh`

**Files:**
- Modify: `skills/design-committee/SKILL.md` (frontmatter `version`; lines 34, 74, 76, 103, 106, 108, 120-132, 144, 150, 164, 171, 190-198, 219; Phase 1 Bootstrap note; Integration note)
- Test: `tests/test-design-committee-context-economy.sh` (add one `assert_team_tooling_skill` function + its call)

**Word-sense guard (critical).** Remove "roster"/"off-roster" ONLY in the dispatch-discriminator sense. PRESERVE the member-list sense: `SKILL.md:34` "Roster (six roles…)" and `:103` "member roster". Do NOT touch the context-economy line `:172` "Team-lead compiles at end — NOT switchboard" (AC-1.4 invariant). This is a targeted edit, not a blind `sed s/roster//`.

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertion**

In `tests/test-design-committee-context-economy.sh`, inside the `# === ASSERTION FUNCTIONS ===` region (before line 123), add:

```bash
assert_team_tooling_skill() {
  local f="$SK/SKILL.md"
  _check "SKILL free of TeamCreate" "! grep -q 'TeamCreate' '$f'"
  _check "SKILL free of TeamDelete" "! grep -q 'TeamDelete' '$f'"
  _check "SKILL uses teammate-dispatch vocabulary" "grep -qi 'teammate' '$f'"
  _check "SKILL uses subagent-dispatch vocabulary" "grep -qiE 'subagent dispatch|one-shot subagent|one-shot .Agent' '$f'"
  _check "SKILL drops the roster/off-roster discriminator" "! grep -qiE 'roster dispatch|off-roster' '$f'"
  _check "SKILL keeps the member-list 'Roster (six roles' heading" "grep -q 'Roster (six roles' '$f'"
  _check "SKILL keeps the context-economy 'NOT switchboard' line" "grep -q 'NOT switchboard' '$f'"
  _check "SKILL documents nested-teams precondition twice (Bootstrap + Integration)" "[ \"\$(grep -ci 'nested inside another agent team' '$f')\" -ge 2 ]"
}
```

And inside the `# === RUN ===` region (before line 136, above the final gate), add the call:

```bash
assert_team_tooling_skill
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL — the new checks report `FAIL: SKILL free of TeamCreate` (and the teammate/subagent/nested-teams checks) because the file still carries the old vocabulary.

- [ ] **Step 3: Edit `skills/design-committee/SKILL.md`**

Apply every edit below. (Line numbers are pre-edit anchors; apply by matching text.)

1. **Frontmatter version** — `version: v0024` → `version: v0025`.

2. **Line 34** (member-list Roster — keep "Roster", drop TeamCreate):
   - From: `Roster (six roles; five subagents created by `TeamCreate` = four advocacy + researcher; team-lead = calling agent; designer = human):`
   - To: `Roster (six roles; five subagents spawned as teammates = four advocacy + researcher; team-lead = calling agent; designer = human):`

3. **Line 74** (Checklist step 3):
   - From: `3. **Convene** — team-lead Round 1 confirmation + `TeamCreate` + convening message.`
   - To: `3. **Convene** — team-lead Round 1 confirmation + spawn members as teammates + convening message.`

4. **Line 76** (Checklist step 5):
   - From: `5. **Tear Down** — team-lead closure flow + `TeamDelete`.`
   - To: `5. **Tear Down** — team-lead closure flow + record-completion close.`

5. **Phase 1 Bootstrap — nested-teams note (AC-1.3, primary location).** After step 4 (the `Do NOT invoke start-bootstrap` item, ending line 92), add a new paragraph (no new `###` subsection):
   - Add:
     ```
     **Precondition — main-session invocation.** Convene the committee from the main session (the fixed team lead), never nested inside another agent team — Claude Code forbids nested teams, so a nested committee cannot spawn its members. Every normal invocation path satisfies this; it is documented here as a precondition, not enforced at runtime (failure is detectable, not silent).
     ```

6. **Line 103** (Phase 3 intro — "member roster" is member-list sense, keep it; rephrase the TeamCreate clause):
   - From: `Team-lead runs Round 1 dispatch confirmation per `references/team-lead.md` before `TeamCreate` fires — confirms question, member roster, round shape, context packets with designer; echoes active info-packet style once.`
   - To: `Team-lead runs Round 1 dispatch confirmation per `references/team-lead.md` before members are spawned as teammates — confirms question, member roster, round shape, context packets with designer; echoes active info-packet style once.`

7. **Line 106** (subsection heading):
   - From: `### TeamCreate`
   - To: `### Spawn Members as Teammates`

8. **Line 108** (the spawn instruction):
   - From: `\`TeamCreate\` with five members:`
   - To: `Spawn five members as teammates (named background `Agent` dispatches; the single implicit team auto-forms on the first spawn):`

9. **Lines 120-132 (Dispatch Discipline)** — replace the mechanism description, preserve the two-category structure:
   - From:
     ```
     Two dispatch tools, one discriminator.
     Both take same `chester:design-committee-*` identifiers; neither errors on wrong choice — identifier loads either way.
     So this rule, not the tool, blocks correct dispatch from silently degrading to four parallel monologues consolidated after the fact.

     - **Roster dispatch** (`TeamCreate` + `SendMessage`) — four advocacy members + researcher.
       WHY: they peer-DM, and peer-DM needs a shared roster + `team_name`; off-roster the deliberation grid cannot form.
     - **Off-roster dispatch** (Agent tool, no `team_name`) — Consolidator and Scribe only.
       WHY: ephemeral one-shots that must NOT inherit context and never peer-DM.
     - **Discriminator** — role peer-DMs? yes → roster; context-isolated one-shot? → Agent tool.
     - **Guard, both directions** — never add Consolidator/Scribe to the `TeamCreate` roster, and never Agent-dispatch an advocacy member or the researcher.
       A roster member spawned via Agent is silently severed from the grid: no error, no roster, no peer-DM.
     ```
   - To:
     ```
     One dispatch tool, two spawn shapes, one discriminator.
     Both spawn shapes take the same `chester:design-committee-*` identifiers; neither errors on wrong choice — the identifier loads either way.
     So this rule, not the spawn shape alone, blocks correct dispatch from silently degrading to four parallel monologues consolidated after the fact.

     - **Teammate dispatch** (named background `Agent` + `SendMessage`) — four advocacy members + researcher.
       WHY: they peer-DM, and peer-DM needs teammates under the single implicit team; spawned as a one-shot subagent the deliberation grid cannot form.
     - **Subagent dispatch** (one-shot `Agent`, returns-and-disposes) — Consolidator and Scribe only.
       WHY: ephemeral one-shots that must NOT inherit context and never peer-DM.
     - **Discriminator** — role peer-DMs? yes → teammate; context-isolated one-shot? → subagent.
     - **Guard, both directions** — never spawn Consolidator/Scribe as teammates, and never spawn an advocacy member or the researcher as a one-shot subagent.
       An advocacy member spawned as a one-shot subagent is silently severed from the grid: no error, no team, no peer-DM.
     ```

10. **Line 144** (Consolidator):
    - From: `It is NOT a member of the `TeamCreate` roster; never add it to the five-member team.`
    - To: `It is NOT spawned as a teammate; never add it to the five-member team.`

11. **Line 150** (Scribe):
    - From: `Like the Consolidator, it is an EPHEMERAL per-round dispatch — NOT a member of the `TeamCreate` roster; never add it to the five-member team.`
    - To: `Like the Consolidator, it is an EPHEMERAL per-round dispatch — NOT spawned as a teammate; never add it to the five-member team.`

12. **Line 164** (Dispatch section — "roster-only" is discriminator sense):
    - From: `Advocacy members and the researcher are roster-only — see § Dispatch Discipline.`
    - To: `Advocacy members and the researcher are teammates only — see § Dispatch Discipline.`

13. **Line 171** (Peer-DM Protocol — edit this line ONLY; leave line 172 "NOT switchboard" untouched):
    - From: `Team-lead creates team (`TeamCreate`), authorizes peer-DM scope in convening message, uses caveman ultra.`
    - To: `Team-lead spawns members as teammates (the single implicit team auto-forms on the first spawn), authorizes peer-DM scope in convening message, uses caveman ultra.`

14. **Lines 192-198 (Phase 5: Tear Down body — leave the `## Phase 5: Tear Down` heading at line 190 untouched)** — replace the `TeamDelete` mechanism with record-only close:
    - From:
      ```
      Team-lead runs consolidation, presentation, and artifact placement per `references/team-lead.md` Closure section.
      Designer owns the decision to terminate the Committee.
      SKILL.md owns the `TeamDelete` call after team-lead signals closure complete.

      `TeamDelete` on team-lead closure signal (after designer approval and artifact placement resolved).
      MANDATORY — stranded teams leak context across unrelated future invocations.
      The complete-design document stays in conversation record independent of team lifecycle.
      ```
    - To:
      ```
      Team-lead runs consolidation, presentation, and artifact placement per `references/team-lead.md` Closure section.
      Designer owns the decision to terminate the Committee.
      SKILL.md owns the record-completion close after team-lead signals closure complete.

      Record-only close on team-lead closure signal (after designer approval and artifact placement resolved).
      The single implicit team auto-forms on the first teammate spawn and tears down automatically at session exit — there is no explicit teardown call; closure is finalizing the on-disk record, not an API call.
      The complete-design document stays in conversation record independent of team lifecycle.
      ```

15. **Line 219 (Integration / Calls)** — drop the dead verbs and the off-roster discriminator phrasing:
    - From: `- **Calls:** `TeamCreate`, `SendMessage`, `TeamDelete` (orchestration); `chester-config-read` (config); `chester:design-committee-*` agents (members + researcher); `chester:design-committee-consolidator` and `chester:design-committee-scribe` (ephemeral off-roster dispatches — see § Consolidator, § Scribe).`
    - To: `- **Calls:** `SendMessage` (orchestration; the single implicit team auto-forms on the first teammate spawn — no `TeamCreate` — and tears down at session exit — no `TeamDelete`); `chester-config-read` (config); `chester:design-committee-*` agents (members + researcher); `chester:design-committee-consolidator` and `chester:design-committee-scribe` (ephemeral one-shot subagents — see § Consolidator, § Scribe).`

16. **Integration — nested-teams note (AC-1.3, second location).** Add a new bullet to the Integration list (after the `Does NOT use` bullet, end of file):
    - Add: `- **Precondition:** convene from the main session, never nested inside another agent team — Claude Code forbids nested teams (documented, not runtime-enforced).`

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh && bash tests/test-generated-agents-current.sh`
Expected: `ALL PASS` from the first, `PASS: test-generated-agents-current` from the second.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md tests/test-design-committee-context-economy.sh
git commit -m "docs(design-committee): migrate SKILL.md to post-v2.1.178 agent-teams model"
```

---

## Task 2: Migrate design-committee team-lead.md to spawn-shape dispatch

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.2, AC-1.4
**Decision budget:** 2
**Must remain green:** `test-design-committee-context-economy.sh` (existing `assert_team_lead` + `assert_scope_and_vocab` + the new `assert_team_tooling_team_lead`), `test-generated-agents-current.sh`

**Files:**
- Modify: `skills/design-committee/references/team-lead.md` (frontmatter `version`; lines 38, 59, 73, 77, 99, 102, 141, 331)
- Test: `tests/test-design-committee-context-economy.sh` (add one `assert_team_tooling_team_lead` function + its call)

**Surgical-edit hazard (critical).** Lines 99 and 102 each carry BOTH a `team_name` discriminator clause (remove) AND the context-economy invariant (PRESERVE). On line 99 keep verbatim: "It returns its result by file pointer: it reads only each transcript's bounded `## Final Position` section (never the full body)…". On line 102 keep verbatim the scribe's bounded-input contract and the "returns its result by file pointer" clause. Edit only the dispatch-mechanism phrase inside each step. The existing assert at test line 78 (`reads only .*Final Position`) will fail if the invariant is collateral-damaged. Likewise, do NOT touch closure step 2 (line 139, the provenance-stamp step) — only step 4 (line 141) changes.

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertion**

In `tests/test-design-committee-context-economy.sh`, inside the `# === ASSERTION FUNCTIONS ===` region, add:

```bash
assert_team_tooling_team_lead() {
  local f="$SK/references/team-lead.md"
  _check "team-lead free of TeamCreate" "! grep -q 'TeamCreate' '$f'"
  _check "team-lead free of TeamDelete" "! grep -q 'TeamDelete' '$f'"
  _check "team-lead free of team_name discriminator" "! grep -q 'team_name' '$f'"
  _check "team-lead drops off-roster discriminator" "! grep -qi 'off-roster' '$f'"
  _check "team-lead uses one-shot subagent vocabulary" "grep -qi 'one-shot subagent' '$f'"
  _check "team-lead PRESERVES consolidator reads-only-Final-Position invariant" "grep -qiE 'reads only .*Final Position' '$f'"
  _check "team-lead PRESERVES member-list 'Member roster'" "grep -q 'Member roster' '$f'"
}
```

And in the `# === RUN ===` region, add the call:

```bash
assert_team_tooling_team_lead
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL — `FAIL: team-lead free of TeamCreate` (and the team_name / off-roster / one-shot-subagent checks) because the file still carries the old vocabulary.

- [ ] **Step 3: Edit `skills/design-committee/references/team-lead.md`**

1. **Frontmatter version** — `version: v0014` → `version: v0015`. (Materially edited file; the repo's own test asserts a `version` ≥ v0008 on this file — bumping keeps it accurate and green.)

2. **Line 38**:
   - From: `Overlay supersedes caveman compression for designer-facing decision-communication packets. Caveman ultra still applies to internal messages (convening message at `TeamCreate`, dispatch via `SendMessage`, peer-DM coordination).`
   - To: `Overlay supersedes caveman compression for designer-facing decision-communication packets. Caveman ultra still applies to internal messages (convening message at member spawn, dispatch via `SendMessage`, peer-DM coordination).`

3. **Line 59**:
   - From: `Handoff moment. Capture has happened (SKILL.md Phase 2); about to convene (SKILL.md Phase 3). Before firing `TeamCreate`, team-lead confirms intent with designer. Avoids fire-and-forget on wrong assumptions.`
   - To: `Handoff moment. Capture has happened (SKILL.md Phase 2); about to convene (SKILL.md Phase 3). Before spawning members as teammates, team-lead confirms intent with designer. Avoids fire-and-forget on wrong assumptions.`

4. **Line 73**:
   - From: `Designer approves → proceed to `TeamCreate` + dispatch per SKILL.md Phase 3.`
   - To: `Designer approves → proceed to spawn members as teammates + dispatch per SKILL.md Phase 3.`

5. **Line 77**:
   - From: `Designer declines → close without `TeamCreate`. No teardown needed (team never created).`
   - To: `Designer declines → close without spawning members. No teardown needed (team never formed).`

6. **Line 99 (Consolidate step — edit ONLY the discriminator clause):**
   - From (the clause): `dispatch a fresh, ephemeral Consolidator via the Agent tool with **no `team_name`** — the off-roster exception (Consolidator + Scribe only), NOT the pattern for advocacy members, which are roster-only (§ SKILL.md Dispatch Discipline) — passing this round's`
   - To: `dispatch a fresh, ephemeral Consolidator as a one-shot subagent (returns-and-disposes) — the subagent exception (Consolidator + Scribe only), NOT the pattern for advocacy members, which are teammates only (§ SKILL.md Dispatch Discipline) — passing this round's`
   - PRESERVE the rest of the sentence unchanged (`It returns its result by file pointer: it reads only each transcript's bounded `## Final Position` section (never the full body)…`).

7. **Line 102 (Author step — edit ONLY the discriminator clause):**
   - From (the clause): `dispatch the scribe via the Agent tool with **no `team_name`** (off-roster one-shot, same as the Consolidator — returns its result by file pointer) with`
   - To: `dispatch the scribe as a one-shot subagent (returns-and-disposes, same as the Consolidator — returns its result by file pointer) with`
   - PRESERVE the rest of the sentence (alignment-map / verdict / template-path / bounded-input contract) unchanged.

8. **Line 141 (Closure step 4 — replace TeamDelete with record-only close):**
   - From: `4. `TeamDelete` after the record is finalized. MANDATORY — stranded teams leak context across unrelated future invocations.`
   - To: `4. Record-completion close after the record is finalized. The single implicit team tears down automatically at session exit — there is no `TeamDelete` call; closure is finalizing the on-disk record (round folders + ledger), not an API teardown.`

9. **Line 331 (Dispatch Voice):**
   - From: `Team-lead uses caveman ultra for convening message at `TeamCreate`, dispatch messages to members + researcher via `SendMessage`, coordination DMs (rare — peers DM peers direct). Switch from caveman ultra to packet voice (this doc + util-design-partner-role + active overlay) for the designer-facing decision-communication packet only.`
   - To: `Team-lead uses caveman ultra for convening message at member spawn, dispatch messages to members + researcher via `SendMessage`, coordination DMs (rare — peers DM peers direct). Switch from caveman ultra to packet voice (this doc + util-design-partner-role + active overlay) for the designer-facing decision-communication packet only.`

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh && bash tests/test-generated-agents-current.sh`
Expected: `ALL PASS` then `PASS: test-generated-agents-current`. Also confirm the cross-file AC-1.1/AC-1.2 gates: `grep -rn "TeamCreate\|TeamDelete" skills/design-committee/` returns nothing (with Task 1 already landed).

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md tests/test-design-committee-context-economy.sh
git commit -m "docs(design-committee): migrate team-lead.md to spawn-shape dispatch"
```

---

## Task 3: Remove the false TeamDelete-stranding justification from execute-write

**Type:** docs-producing
**Implements:** AC-2.1, AC-4.1
**Decision budget:** 1
**Must remain green:** `test-stamping-execute-write.sh`, `test-generated-agents-current.sh`

**Files:**
- Modify: `skills/execute-write/SKILL.md` (frontmatter `version`; lines 96-98)
- Modify: `skills/execute-write/references/implementer.md:7`
- Modify: `skills/execute-write/references/spec-reviewer.md:9`
- Modify: `skills/execute-write/references/quality-reviewer.md:11`
- Modify: `skills/execute-write/references/code-reviewer.md:5`
- Modify: `tests/test-stamping-execute-write.sh:10,12` (hardcodes `v0009` — must move to `v0010` in lockstep with the SKILL.md bump, or the test fails)

Keep the one-shot dispatch instruction at all five doc sites; delete only the `TeamDelete`-stranding justification (the failure mode it warns of can no longer occur — `team_name` is ignored and `TeamDelete` is gone). **`test-stamping-execute-write.sh` pins the exact version (`[ "$CUR_VER" = "v0009" ]`), so the version bump and the test edit must land in the same commit.**

**Steps (TDD):**

- [ ] **Step 1: Write the failing check** (inline grep gate — no repo test file covers execute-write content)

Run: `grep -rn "TeamCreate\|TeamDelete" skills/execute-write/`
Expected (pre-edit): six matching lines — `SKILL.md:96` (carries `TeamCreate`) and `:98` (carries `TeamDelete`), plus one in each of the four references (`implementer.md:7`, `spec-reviewer.md:9`, `quality-reviewer.md:11`, `code-reviewer.md:5`). This is the red state.

- [ ] **Step 2: Confirm the red state**

Run: `grep -rc "TeamDelete" skills/execute-write/SKILL.md skills/execute-write/references/*.md`
Expected: non-zero counts on `SKILL.md` and all four references.

- [ ] **Step 3: Edit the five sites**

1. **`skills/execute-write/SKILL.md` frontmatter** — `version: v0009` → `version: v0010`.

2. **`skills/execute-write/SKILL.md:96-98`**:
   - From:
     ```
     **Dispatch every subagent off-roster — never pass a `team_name`, never `TeamCreate`.**
     These workers are one-shot: each runs its task, returns a result, and is never messaged again, so an off-roster subagent auto-disposes on return and needs no teardown.
     A subagent dispatched with a `team_name` becomes a persistent teammate that stays alive until an explicit `TeamDelete`; across many tasks that strands dozens of live agents and leaks context into later invocations.
     ```
   - To:
     ```
     **Dispatch every subagent as a one-shot worker — a plain `Agent` dispatch that returns and disposes.**
     These workers are one-shot: each runs its task, returns a result, and is never messaged again, so a one-shot subagent auto-disposes on return and needs no teardown.
     Do not spawn them as teammates (named background agents): a teammate persists for the session and peer-DMs, neither of which a one-shot worker needs, so the extra lifetime only accumulates idle agents.
     ```

3. **`skills/execute-write/references/implementer.md:7`**, **`spec-reviewer.md:9`**, **`quality-reviewer.md:11`**, **`code-reviewer.md:5`** (identical line at each — replace at all four):
   - From: `**Dispatch off-roster: no `team_name`.** One-shot worker — returns its result and auto-disposes; passing a `team_name` makes it a persistent teammate that strands until `TeamDelete`.`
   - To: `**Dispatch as a one-shot worker.** Returns its result and auto-disposes; do not spawn it as a teammate (named background agent), which would persist for the session with no benefit to a worker that is never messaged again.`

4. **`tests/test-stamping-execute-write.sh`** — move the hardcoded version assertion in lockstep with the SKILL.md bump:
   - Line 10 (comment):
     - From: `# execute-write is at v0009 (off-roster subagent dispatch — workers self-dispose, no team_name, no TeamDelete leak).`
     - To: `# execute-write is at v0010 (one-shot worker dispatch — workers self-dispose; post-v2.1.178 agent-teams model).`
   - Line 12 (assertion):
     - From: `[ "$CUR_VER" = "v0009" ] || fail "version not at v0009 (got $CUR_VER)"`
     - To: `[ "$CUR_VER" = "v0010" ] || fail "version not at v0010 (got $CUR_VER)"`

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
grep -rn "TeamCreate\|TeamDelete" skills/execute-write/ ; echo "exit=$?"
bash tests/test-stamping-execute-write.sh
bash tests/test-generated-agents-current.sh
```
Expected: the grep prints nothing and `exit=1` (no matches); `test-stamping-execute-write` PASS (now pinned to v0010); `test-generated-agents-current` PASS. Confirm the one-shot instruction survives: `grep -rn "one-shot worker" skills/execute-write/` shows five hits.

- [ ] **Step 5: Commit**

```bash
git add skills/execute-write/SKILL.md skills/execute-write/references/implementer.md skills/execute-write/references/spec-reviewer.md skills/execute-write/references/quality-reviewer.md skills/execute-write/references/code-reviewer.md tests/test-stamping-execute-write.sh
git commit -m "docs(execute-write): remove false TeamDelete-stranding justification"
```

---

## Task 4: Reconcile the two stale memories

**Type:** docs-producing
**Implements:** AC-3.1, AC-3.2
**Decision budget:** 2
**Must remain green:** none (memory files live outside the repo; no repo test covers them)

**Files (all OUTSIDE the repo — NO git commit for this task):**
- Delete: `/home/mike/.claude/projects/-home-mike-Documents-CodeProjects-Chester/memory/project_committee_teardown_gap.md`
- Modify: `/home/mike/.claude/projects/-home-mike-Documents-CodeProjects-Chester/memory/project_subagent_disposal_offroster.md`
- Modify: `/home/mike/.claude/projects/-home-mike-Documents-CodeProjects-Chester/memory/MEMORY.md` (remove the teardown-gap line; rewrite the disposal/off-roster line)

**No-commit note.** The memory directory is user-scoped (`~/.claude/...`), not part of this repo, so this task produces NO branch commit. Its TDD shape degrades to verify-before → edit → verify-after on the filesystem. execute-write's per-task spec reviewer verifies by inspecting the files directly, not a diff. This is expected, not a gap.

**Steps:**

- [ ] **Step 1: Verify the current (red) state**

Run:
```bash
MEM="/home/mike/.claude/projects/-home-mike-Documents-CodeProjects-Chester/memory"
ls "$MEM/project_committee_teardown_gap.md"          # exists
grep -c "team_name\|TeamDelete" "$MEM/project_subagent_disposal_offroster.md"   # non-zero (legacy vocab)
grep -n "teardown_gap\|disposal_offroster\|Subagent disposal\|teardown gap" "$MEM/MEMORY.md"
```
Expected: file exists; legacy-vocab count > 0; two MEMORY.md index lines present (the "Committee teardown gap" line and the "Subagent disposal / off-roster" line).

- [ ] **Step 2: Retire the teardown-gap memory (AC-3.1)**

Delete the file:
```bash
rm "/home/mike/.claude/projects/-home-mike-Documents-CodeProjects-Chester/memory/project_committee_teardown_gap.md"
```
Remove its index line from `MEMORY.md` (the line beginning `- [Committee teardown gap](project_committee_teardown_gap.md)`).

- [ ] **Step 3: Rewrite the disposal/off-roster memory in place (AC-3.2)**

Overwrite `project_subagent_disposal_offroster.md` with the new-model content (no surviving `team_name`/`TeamCreate`/`TeamDelete` mechanism language — the discriminator is now spawn shape):

```markdown
---
name: project_subagent_disposal_offroster
description: Subagent disposal rule (post-v2.1.178) — a one-shot Agent dispatch (subagent) auto-disposes on return; a named background Agent (teammate) persists to session exit. Discriminator is spawn shape, not a parameter. Use one-shot dispatch for one-shot workers.
metadata:
  node_type: memory
  type: project
  originSessionId: 5a68da46-13e7-4c3a-98fe-ef93ec60af07
---

Claude Code subagent lifecycle (post-v2.1.178 agent-teams model):

- A **one-shot subagent** — a plain `Agent` dispatch that runs its task, returns a result, and is never messaged again — runs in isolated context and **auto-disposes on return**. No teardown needed.
- A **teammate** — a named background `Agent` (run-in-background) under the session's single implicit team — persists until session exit and is peer-DM-capable via `SendMessage`. The team auto-forms on the first teammate spawn and tears down automatically at session exit.
- The discriminator is **spawn shape**, not a parameter value: one-shot dispatch = subagent (disposes); named background dispatch = teammate (persists). The team forms and tears down automatically — there is no explicit create-team or delete-team call, and no team-membership parameter to set; the spawn shape alone carries the intent (the prior model's create/delete tools were retired in Claude Code v2.1.178).

**Why:** the deliberates-vs-produces distinction Chester relies on (committee advocacy members peer-DM as teammates; consolidator/scribe and execute-write's per-task workers run as one-shot subagents) is now expressed structurally in the tool call, not as discipline an author must remember to apply at each dispatch site.

**How to apply:** for any skill that fans out **one-shot workers** (does a task, returns, never messaged again) — dispatch them as one-shot subagents so they self-dispose; no teardown bookkeeping. Reserve the teammate spawn shape for genuine persistent peers that must be messaged later (e.g. committee advocacy members). Related: [[project_committee_context_economy]], [[project_directory_model]].
```

Update the `MEMORY.md` index line for this memory:
- From: `- [Subagent disposal / off-roster](project_subagent_disposal_offroster.md) — off-roster (no team_name) auto-disposes; team_name = persistent teammate needing TeamDelete; use off-roster for one-shot workers (fixed execute-write v0009)`
- To: `- [Subagent disposal](project_subagent_disposal_offroster.md) — post-v2.1.178: discriminator is spawn shape; one-shot Agent dispatch (subagent) auto-disposes, named background Agent (teammate) persists to session exit; no TeamCreate/TeamDelete/team_name`

- [ ] **Step 4: Verify the green state**

Run:
```bash
MEM="/home/mike/.claude/projects/-home-mike-Documents-CodeProjects-Chester/memory"
test ! -e "$MEM/project_committee_teardown_gap.md" && echo "AC-3.1 OK: teardown-gap file gone"
grep -q "teardown_gap" "$MEM/MEMORY.md" && echo "AC-3.1 FAIL: index line remains" || echo "AC-3.1 OK: index line removed"
grep -ciE "team_name|TeamCreate|TeamDelete|off-roster" "$MEM/project_subagent_disposal_offroster.md"   # expect 0
test -e "$MEM/project_subagent_disposal_offroster.md" && echo "AC-3.2 OK: file retained"
```
Expected: teardown-gap file gone and its index line removed; zero legacy-vocab matches in the rewritten file; the rewritten file still exists.

- [ ] **Step 5: No commit**

This task touches only user-scoped memory files outside the repo. Do NOT stage or commit anything. Confirm the worktree is unchanged by this task: `git status --short` shows no new staged/unstaged entries attributable to Task 4.

---

## Build Sequence & Cross-Task Notes

- **Order:** Task 1 → Task 2 → Task 3 → Task 4. Tasks 1 and 2 jointly satisfy the whole-tree AC-1.1/AC-1.2 grep gates (`grep -rn "TeamCreate\|TeamDelete" skills/design-committee/` is empty only after both land); each task's own assertion is file-scoped so each is independently red→green.
- **No ordering hazard:** the four tasks touch disjoint files; none depends on another's output. The order is for reviewer convenience (committee first, then execute-write, then memories).
- **Staging discipline:** stage explicitly by path (commands above). Never `git add -A`/`.` — the tree carries unrelated `D`/`??` entries.
- **Catalog safety:** no `description` field is edited in any task, so `skill-index.md` needs no regeneration; `test-generated-agents-current.sh` stays green (AC-4.1).
- **Version-bump deviation from spec letter:** the spec names "both SKILL.md versions" and says team-lead.md is "covered by the SKILL.md version bump." This plan ALSO bumps `team-lead.md` (v0014→v0015) because that file carries its own `version` frontmatter that the repo's own test (`assert_team_lead`, line 89) asserts — leaving it stale while materially editing the file would be the anomaly. Catalog-safe (team-lead.md is not in `skill-index.md`). Flagged for the threat-report gate.

<!-- created-at: 2026-06-19T10:48:40Z -->
<!-- produced-by plan-build@v0007 -->
