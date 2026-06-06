# Conservator Transcript — Round 04
# Sprint: 20260606-01-update-committee-context-management
# Date: 2026-06-06
# Role: CONSERVATOR — defend existing skill contracts; minimize disruption; flag contract breaks and test regressions

---

## Reading Order and Source Documents

Read in order:
- Spec (approved): `spec/20260606-01-update-committee-context-management-spec-00.md`
- Consolidator output (12 constraints): `committee/round03/consolidator-output.md`
- Plan template: `skills/plan-build/references/plan-template.md`
- Existing skill files: `skills/design-committee/SKILL.md`, `skills/design-committee/references/team-lead.md`, `skills/design-committee/references/member-protocol.md`, `agents/design-committee-consolidator.md`
- Existing test: `tests/test-design-committee-context-economy.sh`

---

## Conservator Lens Applied to Plan Decomposition

My job this round: map the spec's six implementation-surface items to concrete, ordered, file-edit tasks. My lens enforces three protections:

1. **No task breaks an existing test assertion** — `test-design-committee-context-economy.sh` has 30+ existing `_check` calls; every one must remain green.
2. **No task silently expands scope** — tasks must be bounded by spec §9 and §6 requirements; no opportunistic improvements.
3. **No task breaks a named skill contract** — `SKILL.md` Integration section, `team-lead.md` Reading Order, `member-protocol.md` citable `##` headings — these are cited by name in other files; touching them requires tracing references.

---

## Existing Test Assertions — What Must Stay Green

The test file `tests/test-design-committee-context-economy.sh` currently asserts:

**assert_member_protocol:**
- member-protocol.md exists
- defines digest fields (`headline position`, `transcript path`, `confidence`)
- defines `## Write-then-send` section
- names `committee/round` path
- has citable headings `## Digest shape`, `## Committee root resolution`
- owns committee-root resolution

**assert_consolidator:**
- consolidator agent exists
- grants `Read+Glob+Write`
- excludes `Grep`
- enumerate-only ceiling (`alignment count`, `notable quotes`)
- prohibits interpretation (characterize, weight, synthesi)
- does NOT have 'synthesizing the sources'
- writes `consolidator-output.md`

**assert_advocacy_agents:**
- each grants `Write`
- each scoped to `committee/`
- each cites `member-protocol`
- each has no `Mode [AB]`

**assert_researcher_agent:**
- grants `Write`
- prohibition narrowed to `committee/`
- cites `member-protocol`

**assert_round_format:**
- uses `committee/roundNN` layout
- has `consolidator-output` section
- has `Final Recommendation`
- no stale `design/committee-analysis` or `one file per.*question`

**assert_team_lead:**
- uses `committee/roundNN`
- dispatches `consolidator`
- reads `consolidator-output`, writes own Final Rec
- maintains `ledger`
- cites `member-protocol`
- version past v0006

**assert_skill_md:**
- creates `committee/` tree
- digest discipline present
- consolidator in integration
- member-protocol in integration
- generic role-contract edit clause present
- no stale `lands in the sprint`
- no `Mode [AB]`
- version past v0016

**assert_scope_and_vocab:**
- design-architect-committee NOT modified
- no `Mode [AB]` in any touched committee file

---

## Analysis: What the Spec Adds vs. What Already Exists

Comparing spec §9 implementation surface against what already exists in the files:

### skills/design-committee/SKILL.md

**Already exists:**
- Phase 4 Deliberation / One-Round-Format — steps 1-4 matching current flow
- Consolidator dispatch (Phase 3, Phase 4)
- `TeamCreate` with five members

**Spec adds:**
- Mode selection: one-round (default) vs two-round (Delphi escalation) — not present today
- Scribe dispatch step (step 7 in spec §5) — not present today; authoring is currently implicit
- Verdict step before scribe (step 6: converge → write verdict.md) — not currently explicit
- Checkpoint enforcement: each dispatch carries prior artifact path — not present today
- One-Round-Format must end with members writing `## Final Position` (mandatory, last section) — current text describes "digest" not "Final Position"

**Contract risk:** The current test `assert_skill_md` checks for `digest` presence (`SKILL finals step = write transcript + digest`). Task editing SKILL.md must preserve the digest field; the spec adds `## Final Position` section to transcripts but the member-facing digest (routing signal) is separate. These are two distinct things — transcript's `## Final Position` section ≠ digest. Must not conflate them.

### skills/design-committee/references/team-lead.md

**Already exists:**
- Consolidation Rules: reads `consolidator-output.md`, not raw transcripts
- Per-Round Flow steps 1–8 (existing, but without synthesize/converge artifact names)
- Ledger discipline

**Spec adds:**
- `synthesize` step: team-lead writes `alignment-map.md` to disk then evicts (constraint 8)
- `converge` step: team-lead writes `verdict.md` (constraint 9), specific one-sentence-minimum, ambiguous verdicts cannot proceed
- Reject malformed routing signals: signals outside `{member, status, round, transcript}` schema rejected unread with one correction prompt (constraint 6 / spec §7)
- `present` reads the artifact once (reads scribe-produced draft; the mandatory Dissent Record is guaranteed to be seen) — constraint 11 / spec §5 step 8
- Two-round mode: alignment map fed back to members, one revision pass each, return to consolidate (spec §4)

**Contract risk:** team-lead.md is cited from SKILL.md (`references/team-lead.md`) and from the reading order. Renaming any `##` section heading breaks the cite chain. Must audit SKILL.md + any agent that cites team-lead headings before renaming sections.

### skills/design-committee/references/member-protocol.md

**Already exists:**
- `## Digest shape` — the routing digest (six fields including `Transcript path`)
- `## Transcript and round-folder` — member writes full position to transcript
- `## Write-then-send sequencing`
- `## Committee root resolution`

**Spec adds:**
- `## Final Position` section requirement: mandatory, exact header `## Final Position`, LAST section of the transcript, 200-word cap, schema `{position, rationale, blocking_risk}`, all member-authored (constraints 5, 6)
- Typed routing signal schema: `{member, status, round, transcript}` only — no free text; malformed → rejected (constraint 6 / spec §7)
- Capped peer-DM schema: `[sender]→[target]: [one sentence] / [target]: [one sentence]`, max 2 exchanges per pair (spec §7)

**Contract risk:** The existing test `assert_member_protocol` checks for `## Digest shape` and `## Committee root resolution` citable headings. Adding `## Final Position` is additive; it does not break those checks. The digest schema currently has six fields; the routing signal spec §7 schema is four fields `{member, status, round, transcript}`. These are different things — the existing digest is richer (includes `Headline position`, `Chosen option`, `Top trade-off`, `Confidence`, `Transcript path`). The spec says member→team-lead is now ONLY the typed routing signal. This is a **contract change to the digest** — the test checks `headline position`, `transcript path`, `confidence` exist; if the digest is replaced by a minimal routing signal, those test checks break.

**This is the hardest contract tension in the decomposition.** Resolution options:
- Option A: Interpret the spec's "typed routing signal" as replacing the existing digest entirely — breaks three test assertions (`headline position`, `transcript path`, `confidence`).
- Option B: Interpret the spec's "typed routing signal" as a new signal-only channel; the full existing digest remains in member-protocol (preserves tests); routing signal is described as what the member sends via message, while the transcript `## Final Position` section is what the consolidator reads.

Reading the spec carefully: §7 says "member → team-lead: typed routing signal only, schema fields are the entire message body, no free text." And constraint 6: "Member → TL channel is typed routing signal only." This is unambiguous — the routing signal replaces the existing digest as the DM channel. The existing digest fields (`Headline position`, `Chosen option`, `Top trade-off`, `Confidence`) move into the transcript's `## Final Position` section (now read by the consolidator from disk, not from the message). This IS a contract change.

**Plan must include a new test assertion** that validates:
- `## Final Position` section in member-protocol
- routing signal schema `{member, status, round, transcript}` in member-protocol
- existing test checks for `headline position`, `transcript path`, `confidence` must be revised (or the fields kept as aliases/fallbacks)

**My recommendation for the plan:** The plan task that edits member-protocol.md must also update `test-design-committee-context-economy.sh` — specifically the `assert_member_protocol` function — to check for the new `## Final Position` section schema and the routing signal schema, replacing the old digest field checks. Without this, the test suite goes red.

### agents/design-committee-consolidator.md

**Already exists:**
- Reads member transcripts from round folder
- Enumerate-only ceiling
- Writes `consolidator-output.md`

**Spec adds:**
- Read-scoping: consolidator reads ONLY `## Final Position` section of each transcript — not full transcripts (constraint 2)
- Verbatim copy only — no summarizing, no selection (constraint 3)
- Enumerate-only bounded by bounded input (constraint 4) — the current file says "read every member transcript" which would allow reading full transcripts; must change to Final Position scoped read

**Contract risk:** The test `assert_consolidator` checks `prohibits interpretation` with grep patterns for `characterize`, `weight`, `synthesi`. Adding the read-scoping restriction is additive and will not break these. However, the current agent says "Read the round folder. Use `Read` + `Glob` to read every member transcript." — changing this to "read only the `## Final Position` section" may change how the agent navigates to that section, but does not break test assertions. Test suite stays green for consolidator changes.

### New: agents/design-committee-scribe.md

**Does not exist.** Must be created from scratch.

**Spec requirements (constraint 10):**
- Receives: annotated artifact template + `verdict.md` + `consolidator-output.md` + prior artifact version if revising
- Never receives: raw transcripts, session thread
- Produces: draft artifact, returns pointer only

**Contract risk:** New file creation. The test `assert_scope_and_vocab` iterates over a hardcoded list of files and checks for `Mode [AB]`. If the test's file list does not include the new scribe file, it won't be tested. Plan must add `assert_scribe` function to the test script and add the scribe to `assert_scope_and_vocab`'s file list.

**BUT:** Adding to `assert_scope_and_vocab`'s hardcoded file list requires the file to exist or the test assertion will fail. Test update must be ordered AFTER scribe file creation.

### New: Annotated Artifact Template with Dissent Record

**Does not exist.** Must be created.

**Spec requirements (constraint 11):**
- Mandatory named `Dissent Record` section (header, not advisory prose)
- Location: "per artifact-schema" (per spec §9 note)

**Location question:** `skills/util-artifact-schema/SKILL.md` is the artifact schema authority. The template should likely live in `skills/design-committee/references/` or in `skills/util-artifact-schema/` references. Conservator position: put it in `skills/design-committee/references/` to scope it to the committee, not in util-artifact-schema which is a global utility. Placing it globally would be scope creep.

---

## Task Decomposition

Based on the above analysis, I propose 7 tasks in dependency order.

### Task 1: Update member-protocol.md — Final Position section, routing signal schema, peer-DM schema

**Type:** docs-producing
**Files:**
- Modify: `skills/design-committee/references/member-protocol.md`

**What:** Add `## Final Position` section (mandatory, last section of transcript, 200-word cap, schema `{position, rationale, blocking_risk}`); replace the existing `## Digest shape` with the typed routing signal schema `{member, status, round, transcript}`; add capped peer-DM schema.

**Implements:** constraints 5, 6 (spec §6); spec §7 channel formats.

**Ordering:** Task 1 is first because downstream tasks (consolidator read-scoping, scribe, test updates) all depend on the Final Position section being defined. The consolidator read-scoping references this section by name. The routing signal change is foundational for team-lead.md malformed-signal rejection.

**Existing test impact:** `assert_member_protocol` checks for `headline position`, `transcript path`, `confidence` — all from the current digest. After this edit, those fields move into `## Final Position`. The test must be updated in Task 2. Do not run the test between Task 1 and Task 2 — it will fail in that window.

**Decision budget:** 2 — the spec is clear on the schema but the question of whether to fully remove `## Digest shape` or rename it needs a judgment call. Conservator recommends rename to `## Routing Signal` to preserve the `##` heading count and avoid breaking any downstream grep that checks for `## Digest shape`. The test does NOT grep for `## Digest shape` by that exact name (it checks for `## Commit root resolution` and `## Write-then-send`, not `## Digest shape`), so removing it is safe.

**Must remain green:** All tests except `test-design-committee-context-economy.sh` (which goes temporarily red between Tasks 1 and 2, fixed in Task 2).

---

### Task 2: Update test-design-committee-context-economy.sh — assert_member_protocol and new assert_scribe stub

**Type:** docs-producing (this is a docs sprint; tests are structural assertions on skill files)
**Files:**
- Modify: `tests/test-design-committee-context-economy.sh`

**What:** Revise `assert_member_protocol` to check for `## Final Position` section, routing signal schema `{member, status, round, transcript}`, peer-DM schema. Add stub `assert_scribe` function (checks that `agents/design-committee-scribe.md` exists — the scribe file is created in Task 5, so this assertion will fail until then). Add `assert_scribe` to the RUN section.

**Ordering:** Immediately after Task 1. Restores the test to green (for member-protocol changes). The new `assert_scribe` goes red until Task 5 — this is the correct behavior; the test tells us Task 5 is not done yet.

**Implements:** constraints 5, 6; test coverage for new artifacts.

**Decision budget:** 1 — the test is well-structured with the `=== ASSERTION FUNCTIONS ===` insert region. Following the pattern is mechanical.

**Must remain green:** All existing non-member-protocol test assertions. `assert_member_protocol` must be green after this task.

---

### Task 3: Update agents/design-committee-consolidator.md — read-scoping to Final Position only

**Type:** docs-producing
**Files:**
- Modify: `agents/design-committee-consolidator.md`

**What:** Change "read every member transcript" to "read only the `## Final Position` section of each member's transcript"; add verbatim-copy requirement (no selection, no summarizing); enforce enumerate-only bounded by bounded input (not by instruction alone).

**Implements:** constraints 2, 3, 4 (spec §6).

**Ordering:** After Task 1 (which defines `## Final Position`); before team-lead.md (which references the full pipeline). Can run in parallel with Task 4 — they edit different files.

**Existing test impact:** `assert_consolidator` checks for `alignment count`, `notable quotes`, prohibits `characterize`, `weight`, `synthesi`, does NOT check read-scoping (that's new). The read-scoping addition is purely additive; test stays green.

**Decision budget:** 1 — read-scoping is unambiguous (constraint 2: "reads only the member's `## Final Position` section, 200-word cap"). The implementation detail of HOW the agent navigates to that section (Read with offset? Search for header?) is left to the agent's discretion — the skill file just describes the constraint.

**Must remain green:** `assert_consolidator` (all existing checks).

---

### Task 4: Update team-lead.md — synthesize/alignment-map, converge/verdict, malformed-signal rejection, present-reads-artifact, two-round mode

**Type:** docs-producing
**Files:**
- Modify: `skills/design-committee/references/team-lead.md`

**What:** Add synthesize step (write `alignment-map.md` to disk, evict); add converge step (write `verdict.md`, minimum one sentence, ambiguous verdicts blocked, evict); add malformed routing-signal rejection (one correction prompt, then reject unread); add present-reads-artifact (team-lead reads draft once, sees Dissent Record); add two-round mode path (alignment map fed back to members, one revision each, re-consolidate). Bump version.

**Implements:** constraints 7, 8, 9 (spec §6); spec §5 steps 5–8; spec §4 two-round mode; spec §7 malformed signal rejection.

**Ordering:** After Task 1 (routing signal defined). Can run in parallel with Task 3. Must be before Task 6 (SKILL.md references team-lead.md steps).

**Existing test impact:** `assert_team_lead` checks that `consolidator` is dispatched, `consolidator-output` is read, `ledger` is maintained, `committee/roundNN` is used, `member-protocol` is cited, version past v0006. Adding alignment-map, verdict, and two-round mode is additive for the test. Version bump required — test checks `v00(0[7-9]|[1-9][0-9])` which is any v0007+. Currently at v0007; bump to v0008.

**Decision budget:** 2 — the two-round mode path requires a judgment on where in the Per-Round Flow section to insert the branch description. The write-evict mechanism for alignment-map and verdict requires description of what "evict" means in practice (clear context reference, not delete from disk — the file persists for audit).

**Must remain green:** `assert_team_lead` (all existing checks pass with version bump).

---

### Task 5: Create agents/design-committee-scribe.md

**Type:** docs-producing
**Files:**
- Create: `agents/design-committee-scribe.md`

**What:** New agent file. Declare scope: receives `verdict.md` + annotated artifact template + `consolidator-output.md` + prior artifact version (if revising); writes draft artifact to disk; returns pointer only. Hard prohibitions: never receives raw transcripts, never receives session thread. Tools: `Read`, `Write`. Named subagent (never forks per fork-policy).

**Implements:** constraint 10 (spec §6); spec §5 step 7.

**Ordering:** After Task 3 (consolidator output is defined) and Task 4 (verdict.md is defined in team-lead). The scribe's inputs reference both. Must be before Task 7 (test assertion that scribe exists goes green only after this file is created).

**Existing test impact:** `assert_scribe` stub (from Task 2) goes green when this file exists. `assert_scope_and_vocab` currently iterates a hardcoded file list — the plan must add `$AG/design-committee-scribe.md` to that list in Task 2 (the test update task), not Task 5, so the structure is established.

**Decision budget:** 2 — the agent's instruction for navigating to `verdict.md` vs `consolidator-output.md` vs the artifact template (three separate inputs) requires a clear dispatch protocol description; the scribe should read them in order (template first for structure, then verdict for direction, then consolidator-output for dissent).

**Must remain green:** `assert_scribe` turns green. All other assertions unaffected.

---

### Task 6: Update SKILL.md — flow reorder, mode selection, scribe dispatch, checkpoint enforcement

**Type:** docs-producing
**Files:**
- Modify: `skills/design-committee/SKILL.md`

**What:** Reorder Per-Round Flow to match spec §5 (dispatch → members work → members signal → consolidate → synthesize → converge → author → present); add mode selection (one-round default, two-round opt-in); add scribe dispatch step (with verdict.md + annotated template + consolidator-output.md path as required input fields); add checkpoint enforcement description (each dispatch carries prior artifact path). Bump version.

**Implements:** constraints 12 (checkpoint enforcement); spec §4 (modes); spec §5 (full flow); spec §9.

**Ordering:** After Tasks 3, 4, 5 (all referenced artifacts are defined). Last of the skill-file edits.

**Existing test impact:** `assert_skill_md` checks: `committee/` tree created, `digest` present, `consolidator` in integration, `member-protocol` in integration, generic role-contract clause present, no stale `lands in the sprint`, no `Mode [AB]`, version past v0016. Currently at v0017 — bump to v0018.

**Critical:** The test checks `"SKILL finals step = write transcript + digest"` with grep for `digest`. The spec replaces "digest" with "routing signal" as the member→TL channel. If `digest` is removed from SKILL.md, this test check fails. **Conservator flag:** either keep the word "digest" somewhere in SKILL.md (describe it as the typed routing signal = the member digest) or update the test in Task 2 to also revise this check. The cleaner fix is updating the test check in Task 2 to grep for `routing signal` instead of (or in addition to) `digest`. Plan must make this explicit.

**Decision budget:** 3 — mode selection header/description placement, integration section update (add scribe, verdict.md, alignment-map.md), and digest→routing-signal vocabulary transition. The vocabulary transition is the main ambiguity.

**Must remain green:** `assert_skill_md` (all checks, including the revised digest/routing-signal check from Task 2).

---

### Task 7: Create annotated artifact template with Dissent Record

**Type:** docs-producing
**Files:**
- Create: `skills/design-committee/references/artifact-template.md` (or similarly named)

**What:** New template file for committee-produced artifacts (spec/plan drafts, committee analyses). Mandatory named `Dissent Record` section as a required header (not optional appendix). The template is what the scribe receives. Includes annotated guidance for each section so the scribe knows what to populate.

**Implements:** constraint 11 (spec §6); spec §5 step 7 (scribe receives "annotated template").

**Ordering:** Can run in parallel with Tasks 3–5 since it is a standalone new file with no dependencies. However, placing it last is safe and keeps the ordering simple.

**Existing test impact:** No existing test checks for this file. Plan must add an `assert_artifact_template` function in Task 2 if the committee wants test coverage. Conservator recommendation: add a minimal check in Task 2 — assert file exists and contains `Dissent Record` header. This makes the template a first-class tested artifact, not an untested orphan.

**Decision budget:** 2 — the template structure (which sections beyond Dissent Record) is not specified in the spec; the scribe needs guidance on the artifact format. The plan author must decide whether to derive section names from existing committee-analysis-round-format.md or define from scratch.

**Must remain green:** New assertion from Task 2 turns green when this file is created.

---

## Task Ordering Summary

```
Task 1: member-protocol.md (Final Position, routing signal, peer-DM)
Task 2: test update (assert_member_protocol revised; assert_scribe stub; assert_artifact_template stub)
Task 3: consolidator.md (read-scoping to Final Position only)    ──┐ parallel
Task 4: team-lead.md (synthesize/converge, verdict, malformed, two-round) ─┘ parallel
Task 5: design-committee-scribe.md (new agent)
Task 6: SKILL.md (flow reorder, modes, scribe dispatch, checkpoint)
Task 7: artifact-template.md (new, with Dissent Record)
```

Dependency rationale:
- Task 1 first: defines `## Final Position` that Tasks 3 and 4 reference.
- Task 2 immediately after Task 1: restores test suite to green; stubs new assertions.
- Tasks 3 and 4 are independent of each other; can run in parallel.
- Task 5 after Tasks 3 and 4: scribe's inputs reference verdict.md (Task 4) and consolidator-output (Task 3).
- Task 6 after Tasks 3, 4, 5: SKILL.md integration section references scribe, verdict, alignment-map.
- Task 7 can float — it has no file dependencies, but placing it last keeps the ordering clean.

---

## Contract Checks — What This Decomposition Does NOT Touch

- `agents/design-committee-conservator.md` — not in spec §9 surface. Do not touch.
- `agents/design-committee-innovator.md` — not in spec §9 surface. Do not touch.
- `agents/design-committee-pragmatist.md` — not in spec §9 surface. Do not touch.
- `agents/design-committee-purist.md` — not in spec §9 surface. Do not touch.
- `agents/design-committee-researcher.md` — not in spec §9 surface. Do not touch.
- `skills/design-committee/references/committee-analysis-round-format.md` — not in spec §9 surface. Do not touch.
- `skills/design-committee/references/skill-contract.md` — not in spec §9 surface. Do not touch.
- `agents/design-architect-committee*.md` — explicitly prohibited by test `assert_scope_and_vocab`.

---

## Biggest Risks in This Decomposition

**Risk 1 — Digest/routing-signal vocabulary break (SKILL.md test).**
The test `assert_skill_md` greps for `digest` in SKILL.md. The spec renames the member→TL channel to "typed routing signal." If the Task 6 edit removes all uses of "digest" from SKILL.md, the test goes red. This is caught by Task 2 updating the test — but only if the plan author explicitly names this check and revises it. If the planner treats Task 2 as a simple "add scribe stub" and misses this check, the test will fail at Task 6 and the plan author will need a second pass.

**Risk 2 — Task 1 window where test is red.**
Between Task 1 (member-protocol edited) and Task 2 (test updated), `assert_member_protocol` fails on `headline position`, `transcript path`, `confidence` checks. This is expected behavior — the test is temporarily red. The plan must explicitly note this and require Tasks 1 and 2 to be committed in immediate sequence, or in a single commit.

**Risk 3 — Scribe agent scope creep.**
The spec says the scribe receives `verdict.md + annotated template + consolidator-output.md`. The spec does NOT say the scribe has access to the session thread or prior rounds' full transcripts. The scribe agent file must be written with explicit prohibitions matching the consolidator's style. Without this, a future operator could feed the scribe the full session thread "for context" and re-introduce the context leak the design is trying to eliminate.

---

## Final Position

**position:** Seven tasks in dependency order: (1) member-protocol Final Position + routing signal, (2) test update restoring green + stubbing new assertions, (3) consolidator read-scoping, (4) team-lead synthesize/converge/verdict/malformed/two-round, (5) new scribe agent, (6) SKILL.md flow reorder + modes + checkpoint, (7) new artifact template with Dissent Record. Tasks 3 and 4 are parallel. Tasks 1 and 2 must commit in immediate sequence to minimize red-window duration.

**rationale:** The spec's implementation surface maps cleanly to seven bounded file edits. The primary conservator concern is the digest→routing-signal vocabulary transition: the existing test greps for `digest` in SKILL.md, so the test update task (Task 2) must explicitly revise that check. Tasks without test updates rely on the additive nature of the spec changes — the consolidator and team-lead edits do not remove anything the tests currently check for; they only add constraints. The scribe and artifact template are new artifacts; their test coverage must be scaffolded in Task 2 before the files are created.

**blocking_risk:** If the plan collapses Tasks 1 and 2 into one task, the test-red window disappears but the plan loses a natural checkpoint for validating member-protocol changes before proceeding to consolidator and team-lead edits.

---

<!-- conservator / round04 / 2026-06-06 -->
