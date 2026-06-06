# Pragmatist — transcript (verbatim, abridged) — round04
# Stance: Minimum-task-set that ships the spec without over-decomposition

## Position

### Reading the spec surface (§9) against what already exists

All existing tests pass. The existing test file (`tests/test-design-committee-context-economy.sh`)
already covers: member-protocol digest/write-then-send/root-resolution, consolidator read-scoping
and enumerate-only, advocacy agents, researcher, round-format layout, team-lead, SKILL.md structure,
and vocabulary ban. This means the test scaffold is already present for most existing contract
enforcement. New spec behaviors need new assertions, not a new test file.

Six implementation-surface items from §9:

1. **SKILL.md** — per-round flow reorder (synthesize → converge before author); one-round/two-round
   mode dispatch; scribe + verdict steps; checkpoint enforcement language.
2. **team-lead.md** — synthesize (write alignment-map.md, then evict); converge (write verdict.md,
   then evict); reject malformed signals; present-reads-artifact.
3. **member-protocol.md** — mandatory `## Final Position` section (last section, 200-word cap,
   schema `{position, rationale, blocking_risk}`); typed routing-signal schema; capped peer-DM schema.
4. **agents/design-committee-consolidator.md** — read-scoping to `## Final Position` section only.
5. **New: agents/design-committee-scribe.md** — new agent file, authoring role.
6. **Annotated artifact template with Dissent Record** — new file in `references/`.

Plus the mandatory two-place sync: SKILL.md description field + setup-start available-skills list +
version bump on any behavior change.

### Sizing analysis: what actually needs to change vs. what appears to need change

**SKILL.md changes:** The per-round flow (Phase 4/5) needs a reorder — existing flow has consolidate
→ write recommendation, but spec requires consolidate → synthesize (alignment-map) → converge
(verdict) → author (scribe) → present. The mode selection (one-round/two-round) needs adding to
Phase 2 or 3. The Integration section needs scribe entry. The version bump is mandatory. This is a
single coherent edit to one file — not two tasks.

**team-lead.md changes:** The Per-Round Flow in Conversation Loop needs the new steps (5. Synthesize
→ write alignment-map, evict; 6. Converge → write verdict, evict; 7. Dispatch scribe). The
Internal Discipline/Consolidation Rules section needs: reject malformed routing signals; present
IS the read of the artifact (not a separate compose step). Version bump mandatory. One file, coherent
edit.

**member-protocol.md changes:** New section `## Final Position` (mandatory, schema, location
constraint, 200-word cap). New section `## Routing signal schema` (typed fields only, rejection
rule). New section `## Peer-DM schema` (capped, schema). These are additive sections to one file.
One task.

**consolidator.md changes:** Scope the read instruction to `## Final Position` section specifically
(not full transcripts). Small, surgical edit. One task — but it can merge with another consolidator
task if small enough. Actually it's small enough to be part of a focused consolidator task.

**New scribe agent:** Entirely new file. Analogous to other advocacy agent files but with a
different role (authoring, not deliberating). One task.

**Annotated artifact template:** New file in `references/`. Template with mandatory `Dissent Record`
section header. The spec says the scribe is "fed the finished verdict; never the session thread;
cannot start before convergence is complete" and receives "annotated template + verdict.md +
consolidator-output.md." The template is what the scribe uses to author the artifact. One task.

**Test additions:** The existing test already passes; new assertions need to be added for: the
Final Position section contract in member-protocol; routing-signal schema rejection rule; scribe
agent existence + contract; Dissent Record in the template; team-lead synthesize/converge/evict
language; SKILL.md mode selection. These should be grouped as one test-extension task that adds
`assert_*` functions in the right insertion points already marked in the test file.

**Two-place sync (setup-start):** SKILL.md description + setup-start available-skills list + version
bump. Currently there is no design-committee entry in setup-start (grep confirmed empty). This means
the sync chore is just: check setup-start has no stale entry and that the SKILL.md description
matches the spec's expanded behavior. The version bump is already handled in the SKILL.md task.
This is a chore-level check, not a full task. BUT per CLAUDE.md "two-place sync" rule: "description
field + matching entry in skills/setup-start/SKILL.md must stay in lockstep." Since there's no
entry in setup-start, the check is: confirm no entry needs adding or confirm the current description
is already accurate. Given the description is accurate (it describes the committee primitive), the
"sync" is just the version bump in SKILL.md. This is a sub-step of the SKILL.md task, not a
separate task.

### Ordering analysis

Dependencies are clear:
- member-protocol changes (Final Position schema) must land before consolidator read-scoping change,
  because consolidator now reads the `## Final Position` section — but both reference the schema.
  They can be the same task or ordered tasks.
- scribe agent must land before team-lead.md references the scribe dispatch step.
- annotated template with Dissent Record must land before scribe agent (scribe receives the template).
- test extensions should land last (after all files exist to assert against).
- SKILL.md flow reorder should land after team-lead.md, scribe, and template are in place.

### Over-decomposition check

The spec has 6 surface items. A naive decomposition produces 8-10 tasks. That's over-decomposed for
docs-producing work. The actual dependencies are:
- template → scribe → team-lead → SKILL.md → tests
- member-protocol → consolidator (read-scope) → tests

Collapsing where there are no rework risks: member-protocol + consolidator read-scope are both about
the `## Final Position` contract and can be one task. Template + scribe agent are independent but
small — keep separate because template is the input the scribe agent references; ordering matters.
SKILL.md + two-place-sync is one task (sync is a sub-step).

**Proposed: 6 tasks.** Not 10, not 4.

1. member-protocol.md — add Final Position section, routing-signal schema, peer-DM schema.
   THEN consolidator.md read-scope narrowing (both about the Final Position contract; natural pair).
2. Annotated artifact template — new file `references/committee-artifact-template.md` with
   mandatory Dissent Record section header.
3. scribe agent — new `agents/design-committee-scribe.md`.
4. team-lead.md — synthesize/converge/evict steps, reject-malformed, present-reads-artifact. Version bump.
5. SKILL.md — per-round flow reorder, mode selection, scribe integration, version bump + two-place sync.
6. Test extensions — add assert_* functions for all new contracts in existing test file.

### Decision budget

- Task 1 (member-protocol + consolidator): low (1). What does "200-word cap enforcement" look like
  in a prompt? It's stated as the cap; the spec is clear.
- Task 2 (template): low (1). Only open question: where exactly in `references/`? Already has
  precedent from committee-analysis-round-format.md.
- Task 3 (scribe): low-medium (2). What tools does the scribe get? What's the read scope? What
  files does it write? Spec §5 step 7 is clear, but file-authoring details need to be specified
  in the agent file from first principles.
- Task 4 (team-lead.md): low (1). Flow is clearly specified; evict language is unambiguous.
- Task 5 (SKILL.md): low-medium (2). Two-round mode flow adds conditional logic; checkpoint
  enforcement language needs to be specific enough to be actionable.
- Task 6 (tests): medium (2-3). New assertions need to be written in bash against new prose
  content. Some assertions are structural (file exists, section header exists) and easy; others
  need grep patterns that match the actual spec language in the files.

### Blocking risk I did NOT choose

The alternative was to keep member-protocol and consolidator as separate tasks (7 tasks total,
stricter separation). The risk I accept by merging them: if the Final Position schema text in
member-protocol turns out to need iteration (e.g. the 200-word cap instruction conflicts with
existing digest fields), the consolidator read-scope fix gets blocked waiting for that iteration.
In practice the spec is fully resolved on this point (constraint 5 is exact), so the merge risk
is real but small.

## Follow-ups

No peer DMs received yet. No revisions.

## Final Position

**position:** Six tasks in dependency order: (1) member-protocol + consolidator-read-scope, (2) annotated artifact template, (3) scribe agent, (4) team-lead.md synthesize/converge/evict, (5) SKILL.md flow + mode + version, (6) test extensions. Two-place-sync is a sub-step of Task 5, not a standalone task — setup-start has no current committee entry so the sync reduces to a version bump already inside Task 5.

**rationale:** Six tasks map directly to the six independent artifacts/changes from §9. Merging member-protocol + consolidator into one task is justified because both implement the same `## Final Position` contract and the consolidator change is 1-3 lines. Keeping template and scribe separate (not merged) is justified because the template is the scribe's input; a reviewer needs to see the template before auditing the scribe's claim to receive it. Ordering: template → scribe → team-lead → SKILL.md → tests. No task has a decision budget above 3; none is underspecified. Tests land last after all files exist.

**blocking_risk:** Merging member-protocol and consolidator into one task means a schema iteration on member-protocol blocks the consolidator edit; the two would need to split under revision — recoverable but a rework signal if it happens.
