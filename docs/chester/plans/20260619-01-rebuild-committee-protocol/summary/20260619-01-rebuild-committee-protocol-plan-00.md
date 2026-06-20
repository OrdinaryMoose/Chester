# Plan: Rebuild Committee Deliberation Protocol

**Sprint:** 20260619-01-rebuild-committee-protocol
**Spec:** docs/chester/working/20260619-01-rebuild-committee-protocol/spec/20260619-01-rebuild-committee-protocol-spec-00.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Rebuild the `design-committee` deliberation protocol so the four advocacy members and the researcher are spawned once as standing teammates and every round advances by `SendMessage` to those same instances — making live persistent peer deliberation real — while preserving the foundational context-economy invariant byte-intact.

## Architecture

Hybrid (settled in spec): discrete rounds with self-organizing in-round peer-DM over standing teammates, retaining the enumerate-only Consolidator and bounded-input Scribe. The five members+researcher are spawned once before round 1; each round is opened by a `SendMessage` to the existing instances (never a re-spawn); within a round members peer-DM directly under the existing 2-exchange-per-pair cap; full transcripts stay on disk and only bounded ≤200-word Final Positions enter messages; teardown is an explicit `shutdown_request` with session-exit auto-dispose as documented fallback. This is a documentation/protocol change — edits to four skill/reference files plus five agent files plus the committee test. No new agents, tools, or files.

## Tech Stack

- Markdown skill/reference/agent files under `skills/design-committee/` and `agents/`.
- Bash structural test (`tests/test-design-committee-context-economy.sh`) — grep-based assertions verify the protocol documents describe the new contract. The test file already carries designated insert regions (`=== ASSERTION FUNCTIONS ===` and `=== RUN ===`) and extensible per-file assert functions.
- `chester-trailer-write` for provenance stamping (run by finish-phase skills, not here).

## Conventions for this plan

- **The "test" for a doc change is a grep assertion** added to `tests/test-design-committee-context-economy.sh`. The five-step TDD shape holds: add the failing assertion → run the suite and watch that one assertion FAIL → make the doc edit → run the suite and watch it PASS → commit. The suite uses `_check` (records failure, does not abort), so a single new assertion fails visibly while the rest stay green.
- **Extend existing assert functions in place** (e.g. add `_check` lines inside `assert_skill_md`, `assert_team_lead`, `assert_member_protocol`, `assert_advocacy_agents`, `assert_researcher_agent`). They are already invoked in the RUN region, so no RUN-region edit is needed for Tasks 1–4. Task 5 adds one new function and its call.
- **Live behavioral verification is out of scope for the suite.** Whether a real run actually spawns members once and peer-DMs is confirmable only by a live committee consult (spec Testing Strategy). The grep assertions verify the *documents* mandate the protocol; do not claim machine verification of the live grid.
- **Run commands from the worktree** `.worktrees/20260619-01-rebuild-committee-protocol`. All paths below are repo-relative. Stage explicitly by path — never `git add -A`/`git add .`.
- **Catalog:** no skill or agent `description` changes in this sprint, so `skill-index.md` needs no regeneration; `test-generated-agents-current.sh` stays green (it is description-driven, not version-driven). Confirmed in Task 5.

---

## Task 1: SKILL.md — spawn-once, round-by-message, teardown

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.2, AC-4.1, AC-5.1, AC-6.1
**Decision budget:** 2
**Must remain green:** `test-design-committee-context-economy.sh` (all existing assertions, incl. `assert_team_tooling_skill` TeamCreate/TeamDelete bans and `assert_skill_md` no-rival-list), plus the new `assert_skill_md` assertions this task adds; `test-generated-agents-current.sh`.

**Files:**
- Modify: `skills/design-committee/SKILL.md` (frontmatter `version`; Phase 3 § Spawn Members as Teammates ~lines 108-120; Phase 4 § Dispatch ~lines 160-168; Phase 5 § Tear Down ~lines 192-200; Integration § Calls ~line 221)
- Test: `tests/test-design-committee-context-economy.sh` (`assert_skill_md`, ~lines 91-105)

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertions** — add these `_check` lines inside `assert_skill_md` (before its closing `}`):

```bash
  _check "SKILL spawns members once before round 1" "grep -qiE 'one-time spawn|spawned once|never re-spawn' '$f'"
  _check "SKILL a round is a message not a spawn" "grep -qiE 'round is a message, not a spawn|SendMessage to the standing' '$f'"
  _check "SKILL teardown via shutdown_request" "grep -q 'shutdown_request' '$f'"
  _check "SKILL documents session-exit auto-dispose as fallback" "grep -qiE 'session-exit auto-dispose is the documented fallback|auto-dispose.*fallback' '$f'"
```

- [ ] **Step 2: Run the suite to verify the new assertions fail**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL — the four new SKILL checks fail (text not yet present); existing checks still PASS; script exits 1 with `FAILURES`.

- [ ] **Step 3: Make the SKILL.md edits**

(a) Bump frontmatter version `v0025` → `v0026`.

(b) In **Phase 3 § Spawn Members as Teammates**, immediately after the `Team slug:` line (~line 120), add:

```markdown
**One-time spawn.** These five named background `Agent` spawns are a one-time setup step performed once, before the first round dispatch. The five teammate names/agent-ids are fixed for the whole consult — members are **never re-spawned per round**; every later round advances by `SendMessage` to these same standing instances (see Phase 4).
```

(c) In **Phase 4 § Dispatch** (~line 160), insert at the top of the section, before `Send topic to 4 advocacy members...`:

```markdown
**A round is a message, not a spawn.** Each round = a `SendMessage` to the standing advocacy members spawned once in Phase 3 — never a new `Agent` dispatch. The members persist across rounds and revise in place from their own accumulated context; do not re-spawn members per round. In-round member-to-member peer-DM is self-organizing per `references/member-protocol.md` § Peer-DM. The numbered per-round sequence stays in `references/team-lead.md` — this phase introduces no rival numbered list.
```

(d) In **Phase 5 § Tear Down**, replace **both** the record-only-close sentence and the auto-dispose-only sentence that follows it — currently two consecutive lines: "Record-only close on team-lead closure signal (after designer approval and artifact placement resolved)." and "The single implicit team auto-forms on the first teammate spawn and tears down automatically at session exit — there is no explicit teardown call; closure is finalizing the on-disk record, not an API call." — with this single paragraph (replacing both avoids the orphaned/duplicate record-close sentence the adversarial review flagged):

```markdown
At closure — after designer approval and artifact placement are resolved — the team-lead sends a `shutdown_request` `SendMessage` to each of the five standing teammates (per `references/member-protocol.md` § Shutdown request), waits a brief fixed period, and treats non-response as implicit acknowledgment; session-exit auto-dispose is the documented fallback if a teammate never acknowledges. The record-completion close then finalizes the on-disk record (round folders + ledger), independent of teammate teardown.
```

Leave the following line ("The complete-design document stays in conversation record independent of team lifecycle.") in place.

(e) In **Integration § Calls** (~line 221), replace the parenthetical "and tears down at session exit — no explicit team-delete call" with:

```markdown
at closure the team-lead sends `shutdown_request` to each standing teammate per `references/member-protocol.md` § Shutdown request, with session-exit auto-dispose as the documented fallback
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS — `ALL PASS`. The four new SKILL checks pass; `assert_skill_md` "no rival per-round numbered list" and `assert_team_tooling_skill` TeamCreate/TeamDelete bans still pass.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md tests/test-design-committee-context-economy.sh
git commit -m "feat: SKILL.md — standing members, round-by-message, shutdown_request teardown"
```

---

## Task 2: team-lead.md — dispatch-by-message, shutdown_request closure

**Type:** docs-producing
**Implements:** AC-1.2, AC-3.2, AC-4.1, AC-5.1, AC-6.1
**Decision budget:** 2
**Must remain green:** `test-design-committee-context-economy.sh` (all existing `assert_team_lead` checks — incl. version-pin `v00(0[8-9]|[1-9][0-9])`, Consolidator-reads-only-Final-Position, reads-consolidator-output, checkpoint-between-steps — plus the new ones this task adds; `assert_team_tooling_team_lead` TeamCreate/TeamDelete/team_name bans), `test-generated-agents-current.sh`.

**Files:**
- Modify: `skills/design-committee/references/team-lead.md` (frontmatter `version`; § Per-Round Flow step 1 Dispatch ~line 97; § Closure step 4 ~line 141)
- Test: `tests/test-design-committee-context-economy.sh` (`assert_team_lead`, ~lines 73-90)

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertions** — add inside `assert_team_lead` (before its closing `}`):

```bash
  _check "team-lead advances round by message to standing members" "grep -qiE 'do not re-spawn|standing advocacy-member instances|round is a message' '$f'"
  _check "team-lead teardown via shutdown_request" "grep -q 'shutdown_request' '$f'"
  _check "team-lead documents session-exit auto-dispose fallback" "grep -qiE 'session-exit auto-dispose is the documented fallback|auto-dispose.*fallback' '$f'"
  _check "team-lead researcher is standing/DM-addressable" "grep -qiE 'researcher.*(standing|DM-addressable)|it too is standing' '$f'"
```

- [ ] **Step 2: Run the suite to verify the new assertions fail**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL — the four new team-lead checks fail; existing checks PASS.

- [ ] **Step 3: Make the team-lead.md edits**

(a) Bump frontmatter version `v0015` → `v0016`.

(b) Replace **§ Per-Round Flow step 1 (Dispatch)** (currently: "1. **Dispatch** — initial question (Round 1 already confirmed) or refined question (designer narrowed scope between rounds). Send via `SendMessage` to the 4 advocacy members in parallel. Researcher on demand.") with:

```markdown
1. **Dispatch** — initial question (Round 1 already confirmed) or refined question (designer narrowed scope between rounds). Advance the round by `SendMessage` to the **standing advocacy-member instances** spawned once in SKILL.md Phase 3 — **do not re-spawn members**: a round is a message to the existing teammates, never a new `Agent` dispatch. Send to the 4 advocacy members in parallel. Researcher on demand — it too is standing and DM-addressable for the whole consult.
```

(c) Replace **§ Closure step 4** (currently: "4. Record-completion close after the record is finalized. The single implicit team tears down automatically at session exit — there is no teardown API call; closure is finalizing the on-disk record (round folders + ledger), not an API teardown.") with:

```markdown
4. **Teardown.** Send a `shutdown_request` `SendMessage` to each of the five standing teammates in parallel (per `references/member-protocol.md` § Shutdown request), wait a brief fixed period, and treat non-response as implicit acknowledgment. Session-exit auto-dispose is the documented fallback if a teammate never acknowledges. Then record-completion close after the on-disk record (round folders + ledger) is finalized — the record close is independent of the teammate teardown.
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS — `ALL PASS`. The Per-Round Flow Consolidate step (step 3) and `Consolidator reads only Final Position` assertion remain unchanged.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md tests/test-design-committee-context-economy.sh
git commit -m "feat: team-lead.md — dispatch-by-message to standing members, shutdown_request closure"
```

---

## Task 3: member-protocol.md — standing membership, self-organizing peer-DM, Shutdown request

**Type:** docs-producing
**Implements:** AC-1.1, AC-2.1, AC-4.1, AC-6.1
**Decision budget:** 2
**Must remain green:** `test-design-committee-context-economy.sh` (all existing `assert_member_protocol` checks — incl. Final Position 200-word cap, routing-signal fields, peer-DM 2-exchange cap, committee-root resolution — plus the new ones this task adds), `test-generated-agents-current.sh`.

**Decision note (version field):** `member-protocol.md` currently has **no** `version` frontmatter field (unlike `team-lead.md`). The spec requires every changed reference file to carry a version bump. Resolution: add `version: v0001` as the file's initial version stamp. This is inert to the catalog generator (it globs `skills/*/SKILL.md` and `agents/*.md`, not `references/`) and no test pins this version.

**Files:**
- Modify: `skills/design-committee/references/member-protocol.md` (add `version: v0001` to frontmatter; § Peer-DM ~lines 116-133; add new § Shutdown request near end, before or after § Committee root resolution)
- Test: `tests/test-design-committee-context-economy.sh` (`assert_member_protocol`, ~lines 11-23)

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertions** — add inside `assert_member_protocol` (before its closing `}`):

```bash
  _check "member-protocol defines Shutdown request section" "grep -q '## Shutdown request' '$f'"
  _check "member-protocol shutdown flushes pending write and acks" "grep -qi 'flush' '$f' && grep -qi 'acknowledg' '$f'"
  _check "member-protocol states standing membership" "grep -qiE 'standing teammate|persists across rounds|revises.*in place' '$f'"
  _check "member-protocol marks peer-DM self-organizing" "grep -qi 'self-organizing' '$f'"
  _check "member-protocol carries a version field" "grep -qE '^version: v00' '$f'"
```

- [ ] **Step 2: Run the suite to verify the new assertions fail**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL — the five new member-protocol checks fail.

- [ ] **Step 3: Make the member-protocol.md edits**

(a) Add `version: v0001` to the YAML frontmatter, on its own line before the closing `---` (after the `description:` block).

(b) At the top of **§ Peer-DM** (immediately under the `## Peer-DM` heading, before "A member may challenge a peer..."), add:

```markdown
Members are **standing teammates** for the whole consult: a member is spawned once, persists across rounds, and revises its position in place from its own accumulated context — it is **not re-spawned per round**. Peer-DM is **self-organizing**: members address one another directly via `SendMessage`, with no team-lead relay.
```

(c) Add a new section (place it immediately before `## Committee root resolution`):

```markdown
## Shutdown request

At consult end the team-lead sends each standing teammate a `shutdown_request` message to bound its lifetime to the consult. On receiving `shutdown_request`, a member:

1. **Flushes** any pending transcript write to its round-folder path (write-then-send sequencing still holds — nothing is left unwritten).
2. Sends a **one-field acknowledgment** (`{ack}`) to the team-lead.
3. **Stops** — no further peer-DM, no further work.

`shutdown_request` is the primary teardown path; **session-exit auto-dispose is the documented fallback** if a member never acknowledges. A member mid-exchange that has not yet answered is not penalized: the team-lead waits a brief fixed period, then treats non-response as implicit acknowledgment.

This section is the **single authority** for shutdown behavior; `SKILL.md` and `team-lead.md` and the member agent files cite it rather than restating the steps.
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS — `ALL PASS`. The existing `member-protocol caps peer-DM exchanges` (2-per-pair) and Final Position checks remain green.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/member-protocol.md tests/test-design-committee-context-economy.sh
git commit -m "feat: member-protocol.md — standing membership, self-organizing peer-DM, Shutdown request"
```

---

## Task 4: agent files — standing-teammate lifecycle + Shutdown request handler

**Type:** docs-producing
**Implements:** AC-1.1, AC-3.2, AC-4.1, AC-6.1
**Decision budget:** 2
**Must remain green:** `test-design-committee-context-economy.sh` (all existing `assert_advocacy_agents` and `assert_researcher_agent` checks — incl. Write tool grant, committee/ write-scope, cites member-protocol, no Mode A/B — plus the new ones this task adds), `test-generated-agents-current.sh`.

**Files:**
- Modify: `agents/design-committee-conservator.md` (frontmatter `version`; add `## Shutdown request` section)
- Modify: `agents/design-committee-innovator.md` (same)
- Modify: `agents/design-committee-pragmatist.md` (same)
- Modify: `agents/design-committee-purist.md` (same)
- Modify: `agents/design-committee-researcher.md` (frontmatter `version`; add `## Shutdown request` section with DM-addressable wording)
- Test: `tests/test-design-committee-context-economy.sh` (`assert_advocacy_agents` ~lines 48-56, `assert_researcher_agent` ~lines 57-62)

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertions**

Inside `assert_advocacy_agents` (inside the `for m in ...` loop, before its closing `done`):

```bash
    _check "$m defines Shutdown request handler" "grep -q '## Shutdown request' '$f'"
    _check "$m states standing-teammate lifecycle" "grep -qiE 'standing teammate' '$f'"
    _check "$m version bumped past v0001" "grep -qE '^version: v00(0[2-9]|[1-9][0-9])' '$f'"
```

Inside `assert_researcher_agent` (before its closing `}`):

```bash
  _check "researcher defines Shutdown request handler" "grep -q '## Shutdown request' '$f'"
  _check "researcher is standing and DM-addressable" "grep -qiE 'DM-addressable|remain alive' '$f'"
  _check "researcher version bumped past v0001" "grep -qE '^version: v00(0[2-9]|[1-9][0-9])' '$f'"
```

- [ ] **Step 2: Run the suite to verify the new assertions fail**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL — the new advocacy (×4 members) and researcher checks fail.

- [ ] **Step 3: Make the agent-file edits**

For **each** advocacy agent (`conservator`, `innovator`, `pragmatist`, `purist`):

(a) Bump frontmatter version `v0001` → `v0002`.

(b) Add this section after `## Hard Prohibitions` (before `## Voice Discipline`). **Cite member-protocol; do not restate its steps** (the adversarial + smell reviews flagged step-restatement as a single-authority violation — member-protocol § Shutdown request owns the flush/ack/stop sequence):

```markdown
## Shutdown request

You are a **standing teammate**: spawned once at convene, you persist across all rounds and revise your position in place from your own accumulated context — you are **never re-spawned per round**. On receiving a `shutdown_request` from the team-lead, follow `references/member-protocol.md` § Shutdown request.
```

For the **researcher** (`agents/design-committee-researcher.md`):

(a) Bump frontmatter version `v0001` → `v0002`.

(b) Add this section after `## Hard Prohibitions` (before `## Voice Discipline`) — same citation-only discipline:

```markdown
## Shutdown request

You are a **standing teammate**: spawned once at convene, you **remain alive and DM-addressable** from convene through teardown, so any member can reach you for mid-deliberation fact-checking. On receiving a `shutdown_request` from the team-lead, follow `references/member-protocol.md` § Shutdown request.
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS — `ALL PASS`. Each agent still cites `member-protocol` and scopes writes to `committee/`.

- [ ] **Step 5: Commit**

```bash
git add agents/design-committee-conservator.md agents/design-committee-innovator.md agents/design-committee-pragmatist.md agents/design-committee-purist.md agents/design-committee-researcher.md tests/test-design-committee-context-economy.sh
git commit -m "feat: committee agents — standing-teammate lifecycle + shutdown_request handler"
```

---

## Task 5: Cross-cutting guards + full-suite verification

**Type:** docs-producing
**Implements:** AC-3.1, AC-5.2, AC-6.1, AC-6.2
**Decision budget:** 2
**Must remain green:** entire `tests/` suite — `test-design-committee-context-economy.sh` (all assertions incl. the new `assert_standing_protocol`), `test-generated-agents-current.sh`, and every other `test-*.sh`.

**Files:**
- Modify: `tests/test-design-committee-context-economy.sh` (add `assert_standing_protocol` in the FUNCTIONS region; add its call in the RUN region, above the final gate)

**Steps (TDD):**

- [ ] **Step 1: Write the failing guard assertions**

Add a new function in the `=== ASSERTION FUNCTIONS ===` region (e.g. after `assert_team_tooling_team_lead`):

```bash
assert_standing_protocol() {
  local tl="$SK/references/team-lead.md"
  local sk="$SK/SKILL.md"
  local raf="$SK/references/committee-analysis-round-format.md"
  # AC-3.1 — consolidate step stays off the team-lead (preserved invariant).
  _check "team-lead does NOT aggregate Final Positions onto itself" "! grep -qiE 'team-lead (compiles|aggregates).*(transcript|final position)' '$tl'"
  _check "team-lead still reads only consolidator-output (bounded input)" "grep -qi 'consolidator-output' '$tl'"
  # AC-4.1 — teardown vocabulary present in both orchestration docs, no dead tooling.
  _check "shutdown_request present in SKILL and team-lead" "grep -q 'shutdown_request' '$sk' && grep -q 'shutdown_request' '$tl'"
  # AC-5.2 — frozen round-format file untouched by this sprint's commits.
  # NOTE: this is a SPRINT-LOCAL guard — after this branch merges to main it becomes
  # vacuously green (main...HEAD diff is empty against itself). A future protocol sprint
  # may drop it or re-scope it; it is not a long-lived invariant like the AC-3.1 check above.
  _check "round-format file unchanged in this sprint" "! git -C \"$ROOT\" diff --name-only main...HEAD | grep -q 'committee-analysis-round-format'"
}
```

Add its call in the `=== RUN ===` region (above `# === END RUN ===`):

```bash
assert_standing_protocol
```

- [ ] **Step 2: Run the suite to verify it behaves as expected**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS if Tasks 1–4 landed correctly (`ALL PASS`). **Note — these are cross-cutting guards, not fail-first TDD assertions:** they are written to pass immediately because Tasks 1–4 already landed their edits and their own Step 2 was the fail-first check. Do not expect a red here. The AC-5.2 git-diff check passes because no commit touched `committee-analysis-round-format.md`. If the AC-3.1 negative check FAILS, an earlier task wrongly routed consolidation onto the team-lead — fix that task's edit, do not weaken the assertion.

- [ ] **Step 3: Run the full suite + catalog freshness**

```bash
for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 && echo "PASS: $t" || echo "FAIL: $t"; done
bash tests/test-generated-agents-current.sh
```

Expected: every test PASS. `test-generated-agents-current` PASS (no `description` changed → catalog already in sync; do **not** regenerate unless this fails). If it fails citing a stale catalog, run `bin/chester-generate-agents` and stage `skills/setup-start/references/skill-index.md` — but this is not expected for this sprint.

- [ ] **Step 4: Confirm self-contained protocol (AC-6.2) — manual read**

Re-read `SKILL.md`, `team-lead.md`, `member-protocol.md` end-to-end and confirm a fresh team-lead can run the protocol from these three alone: spawn standing members once, advance rounds by message, run self-organizing in-round peer-DM, keep transcripts off team-lead context, tear down via `shutdown_request`. Confirm no residual "re-spawn per round" instruction survives anywhere. This is a read-confirmation, not a machine check; note it in the execute-write decision log.

- [ ] **Step 5: Commit**

```bash
git add tests/test-design-committee-context-economy.sh
git commit -m "test: cross-cutting standing-protocol guards (AC-3.1, AC-4.1, AC-5.2)"
```

---

## AC → Task coverage map

- **AC-1.1** (members spawned once) — Tasks 1 (SKILL Phase 3), 2 (team-lead no-respawn), 3 (member-protocol standing), 4 (agent lifecycle).
- **AC-1.2** (rounds advance by message) — Tasks 1, 2.
- **AC-2.1** (self-organizing in-round peer-DM) — Task 3 (existing 2-exchange cap preserved + self-organizing wording); referenced from Task 1 Phase 4.
- **AC-3.1** (team-lead bounded inputs only) — Task 5 guard (preservation); Task 2 leaves Consolidate step intact.
- **AC-3.2** (researcher standing/DM-addressable) — Tasks 2, 4.
- **AC-4.1** (teardown via shutdown_request) — Tasks 1, 2, 3, 4, 5; TeamCreate/TeamDelete absence already enforced by `assert_team_tooling_*`.
- **AC-5.1** (single numbered flow in team-lead.md) — Tasks 1 (Phase 4 introduces no rival list), 2; existing `assert_skill_md` + `assert_team_lead` enforce.
- **AC-5.2** (frozen round-format untouched) — Task 5 git-diff guard.
- **AC-6.1** (tests pass, versions bumped, catalog consistent) — every task bumps its file's version; Task 5 runs full suite + catalog check.
- **AC-6.2** (self-contained protocol docs) — Task 5 manual read-confirmation.

<!-- created-at: 2026-06-20T00:47:53Z -->
<!-- produced-by plan-build@v0007 -->
