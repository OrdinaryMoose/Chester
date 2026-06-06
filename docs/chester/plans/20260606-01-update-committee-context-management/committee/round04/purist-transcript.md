# Purist — Round 04 Transcript
# Sprint: 20260606-01-update-committee-context-management
# Role: Plan decomposition (Purist lens)
# Date: 2026-06-06

---

## Files Read

- Spec: `spec/20260606-01-update-committee-context-management-spec-00.md`
- Round 03 consolidator output: `committee/round03/consolidator-output.md`
- Plan template: `skills/plan-build/references/plan-template.md`
- Current skill files: `skills/design-committee/SKILL.md`, `references/team-lead.md`, `references/member-protocol.md`, `agents/design-committee-consolidator.md`

---

## Lens Statement

Purist lens: task-boundary cleanliness, single coherent responsibility per task, no straddling unrelated concerns, every spec acceptance criterion traced to exactly one task or explicitly flagged as emergent. Ambiguous task boundaries = failure mode.

---

## Premise 1 — Task type for a docs sprint

All tasks here are `docs-producing`. The five-step TDD shape from the plan template (failing test → verify fail → minimal impl → verify pass → commit) must be adapted. The analog is:

1. Verify current file state (capture what the spec requires to be different).
2. Run bash tests to confirm green before edit.
3. Apply the edit.
4. Run bash tests to confirm still green after edit.
5. Commit.

The "test" is the bash test suite (`bash tests/test-*.sh`). No test covers the prose content of SKILL.md or agent files, so "must remain green" is a regression guard only — it confirms no structural breakage from edits, not content correctness. That is the correct and honest framing.

---

## Premise 2 — The temptation to split or merge

**Split temptation:** The spec's §9 implementation surface lists 6 items. One could split further — e.g., separate tasks for "routing signal schema" and "peer-DM schema" in member-protocol.md. But both live in the same file, both are protocol for the same role (members), and their combined edit has one stopping point: member-protocol.md says what members do. Splitting sub-sections of the same file into separate tasks creates a half-edited file with no independently testable state between.

**Merge temptation:** One could merge SKILL.md + team-lead.md as "orchestration layer." But SKILL.md is the dispatch orchestrator (structural flow); team-lead.md is the role behavior (write-evict, rejection, presentation). These are conceptually distinct and the files are distinct. Merging violates single-responsibility.

**Verdict:** 6 tasks mapping to 6 files (4 modified, 2 created) is the clean decomposition. No task modifies more than one file.

---

## Premise 3 — AC1 is emergent, not task-local

AC1 (team-lead context stays within 37–49k tokens across four rounds) is a system-level outcome — it is true when all six tasks are done and the pipeline is closed. No single task "implements" AC1. The cleanest tracing is to assign AC1 to Task 4 (SKILL.md), since that is where the pipeline is assembled and the checkpoint enforcement that makes the budget achievable is wired. I flag this honestly: AC1's home is Task 4 by convention, not because Task 4 alone delivers it.

This is not a gap — it is a structural fact about emergent acceptance criteria. The plan should note it explicitly rather than silently assigning AC1 to one task and implying that task alone secures the budget.

---

## Full Task Decomposition

### Task 1: member-protocol.md — Final Position + routing-signal + peer-DM schemas

**File:** `skills/design-committee/references/member-protocol.md` (modify)

**What changes:**
- Add mandatory `## Final Position` section: exact header, last section, 200-word cap, schema `{position, rationale, blocking_risk}`, all fields member-authored.
- Add `blocking_risk` field definition (~20-word member-framing requirement).
- Add typed routing-signal schema: `{member, status, round, transcript}` — the entire message body, no free text.
- Add capped peer-DM schema: `[sender]→[target]: [one sentence] / [target]: [one sentence]`, max 2 exchanges per pair.

**Why one task:** All changes are member-side protocol. The file is the single authority for what members do and how they signal. No sub-section is independently meaningful until the full protocol is consistent.

**AC coverage:** AC2 (Final Position bounds what consolidator reads → no member prose in TL), AC4 (Final Position being the sole consolidator input is what makes enumerate-only structurally guaranteed).

**Dependencies:** None — first in the chain.

**Decision budget:** 2 (where exactly in the file does Final Position section insert; whether to add a version bump per SKILL.md convention).

---

### Task 2: consolidator.md — read-scoping + verbatim copy

**File:** `agents/design-committee-consolidator.md` (modify)

**What changes:**
- Scope reads to `## Final Position` section only (not full transcripts).
- Enforce verbatim copy of member-authored fields (no summarizing, no selection).
- Confirm enumerate-only output remains the contract (no structural expansion of what the consolidator may produce).

**Why one task:** All changes are one agent's read behavior. The concern is "what does the consolidator read and how does it copy" — one coherent responsibility. The verbatim copy and read-scoping are inseparable: verbatim copy only makes sense if you know what you're copying from.

**AC coverage:** AC4 (enumerate-only is structurally guaranteed when input is capped Final Position; the 5–7× drift is impossible when bounded input limits output). Partial AC2 (consolidator never reads full transcripts → member prose never enters pipeline).

**Dependencies:** Task 1 must precede — the consolidator reads Final Position, which is defined in member-protocol.md.

**Decision budget:** 2 (how to phrase the read-scoping instruction; whether to reference member-protocol.md by path or describe the section inline).

---

### Task 3: team-lead.md — synthesize/converge write-evict + signal rejection + present-reads-artifact

**File:** `skills/design-committee/references/team-lead.md` (modify)

**What changes:**
- Add synthesize step: team-lead reads consolidator-output.md, writes `alignment-map.md`, then evicts.
- Add converge step: team-lead reads alignment-map.md, writes `verdict.md` (specific, one-sentence-minimum), then evicts.
- Add malformed signal rejection: signals outside the schema `{member, status, round, transcript}` are rejected unread with one correction prompt.
- Add present-reads-artifact: team-lead reads the scribe's draft artifact once (the read IS the review; Dissent Record guaranteed to be seen).

**Why one task:** All changes are team-lead role behavior in the same file. Each change implements one facet of the team-lead's new responsibilities. Splitting write-evict from rejection from present-reads would create three edits to the same file with no stable intermediate state — a task is a commit, and a half-edited team-lead.md is not a valid commit state.

**AC coverage:** AC2 (write-evict means synthesis happens in bounded context, not free-form accumulation), AC3 (alignment-map.md and verdict.md exist on disk before next step; present-reads-artifact means the artifact exists before the designer sees anything).

**Dependencies:** Task 1 must precede — rejection behavior references the routing-signal schema defined in member-protocol.md.

**Decision budget:** 3 (where write-evict instructions fit in the existing flow prose; how to state the evict instruction precisely; whether present-reads-artifact replaces or augments existing presentation rules).

---

### Task 4: SKILL.md — per-round flow reorder + mode selection + scribe/verdict wiring + checkpoint enforcement

**File:** `skills/design-committee/SKILL.md` (modify)

**What changes:**
- Reorder per-round flow to match the spec §5 eight-step sequence (dispatch → members work → members signal → consolidate → synthesize → converge → author → present).
- Add one-round / two-round mode selection: mode named in convening message, one-round default when unspecified.
- Wire scribe dispatch: after verdict.md exists, scribe receives annotated template + verdict.md + consolidator-output.md; returns pointer only.
- Add checkpoint enforcement: each dispatch carries the prior artifact path as a required input field.

**Why one task:** All changes are to the orchestration layer of the same file. The flow reorder, mode selection, scribe wiring, and checkpoint enforcement are coupled — checkpoint enforcement only makes sense once the steps that produce the artifacts are in place, and mode selection only makes sense once the flow has two paths (one-round vs. two-round). Splitting would leave the flow internally inconsistent at the commit boundary.

**AC coverage:** AC1 (emergent — the closed pipeline is what makes the token budget achievable; assigned here by convention as the task that closes the pipeline), AC3 (checkpoint enforcement is explicitly wired here — each dispatch carries prior artifact path).

**Dependencies:** Tasks 2 and 3 must precede — SKILL.md flow references the consolidator's bounded read and the team-lead's write-evict steps.

**Decision budget:** 4 (how to represent two-round Delphi path in prose vs. flow chart; where checkpoint enforcement language sits; how to reference the scribe agent before Task 5 creates it; exact wording of mode-selection section).

Note on the scribe reference: SKILL.md (Task 4) may need to reference `agents/design-committee-scribe.md` by name, which Task 5 creates. If tasks run strictly sequentially this is fine — Task 5 follows Task 4. If execute-write tries to run Task 4 in isolation before Task 5, the reference will be a dangling pointer. The plan should note this ordering dependency explicitly.

---

### Task 5: agents/design-committee-scribe.md — new authoring agent

**File:** `agents/design-committee-scribe.md` (create)

**What changes (new file):**
- Agent role: receives verdict.md + annotated artifact template + consolidator-output.md (+ prior artifact version if revising).
- Hard prohibitions: never receives raw transcripts or session thread.
- Output: draft artifact to disk; returns file pointer only to team-lead.
- Tools: Write, Read (to read its inputs); no SendMessage (returns by pointer, not by message).
- Model: sonnet (consistent with consolidator).
- Scoping: cannot start before convergence is complete (verdict.md must exist).

**Why one task:** This is a new file with a single well-bounded agent role. Authoring is its only responsibility.

**AC coverage:** AC5 (Dissent Record path — scribe receives consolidator-output.md which carries per-member positions; the mandatory Dissent Record section in the template is populated from that input). Partial AC4 (scribe never sees raw transcripts → member prose never enters drafting pipeline).

**Dependencies:** Task 3 must precede (scribe waits for verdict.md which is written by team-lead). Task 6 must follow (scribe's annotated template is defined in Task 6; but scribe can reference it by role before Task 6 creates the file — the scribe agent file names the template, it doesn't inline it).

**Decision budget:** 3 (tools list; whether model should be haiku vs sonnet; how to define the "prior artifact version if revising" conditional input).

---

### Task 6: annotated artifact template with Dissent Record — new file

**File:** Location per artifact schema (sprint working dir, likely `committee/` tree or a `references/` subdir of design-committee skill). Exact path is a plan-time decision.

**What changes (new file):**
- Mandatory named `Dissent Record` section (header, not advisory prose).
- Annotated to guide the scribe: field-level instructions in comments or adjacent prose.
- Template structure consistent with the existing Chester artifact schema (per `skills/util-artifact-schema/SKILL.md`).

**Why one task:** This is a new file with a single concern: the handoff template the scribe uses. It is separate from the scribe agent (which defines what the scribe does) — the template is what the scribe uses as a structural guide. Merging with Task 5 would conflate agent behavior with template structure.

**AC coverage:** AC5 (mandatory Dissent Record section is the structural guarantee that dissent reaches the designer whenever members split — it is in the template the team-lead reads while presenting, so it cannot be silently omitted).

**Dependencies:** Task 5 must precede (the scribe's agent definition references the template; the template should be created after the agent so the agent definition can name the exact path).

Wait — dependency reversal risk: Task 5 (scribe agent) references the template by name; Task 6 creates the template. Logically, the template should exist before the agent references it. But the agent only uses the template at runtime, not at file-creation time. So the task ordering can be: Task 6 creates the template first, Task 5 creates the scribe agent and references the now-existing template path. Revised ordering: 1 → 2 → 3 → 4 → 6 → 5.

Purist correction: I initially said 1→2→3→4→5→6. Reversing 5 and 6 is cleaner — the template exists before the agent file references its path. Final order: **1 → 2 → 3 → 4 → 6 → 5**.

**Decision budget:** 3 (exact file location within the repo; field-level annotation density; whether Dissent Record has required sub-fields or is a free-form section).

---

## AC Coverage Matrix

| AC | Description | Primary Task | Notes |
|----|-------------|-------------|-------|
| AC1 | TL context 37–49k across 4 rounds | Task 4 | Emergent from full pipeline; assigned by convention to Task 4 (pipeline closure) |
| AC2 | No member prose in TL context | Task 1 + Task 2 | Task 1 defines Final Position; Task 2 scopes consolidator to Final Position only |
| AC3 | Per-round artifacts on disk before next step | Task 3 + Task 4 | Task 3 = write-evict discipline; Task 4 = checkpoint enforcement in flow |
| AC4 | Consolidator output enumerate-only (no drift) | Task 2 | Structural guarantee: bounded input (Final Position only) → bounded output |
| AC5 | Dissent reaches designer when members split | Task 5 + Task 6 | Task 6 = mandatory Dissent Record section in template; Task 5 = scribe uses template |

All five ACs have a primary task home. AC1 is flagged as emergent. No AC is homeless.

---

## Flags and Risks

**Flag A — AC1 emergent:** AC1 (token budget) is not delivered by any single task; it is the outcome of the full six-task pipeline. Assigned to Task 4 by convention. Reviewers should not interpret Task 4 as the sole guarantor of the token budget — it is the integration point, not the cause.

**Flag B — Template location underdetermined:** Task 6's file path is not specified at spec altitude. Options: `skills/design-committee/references/artifact-template.md`, `agents/design-committee-artifact-template.md`, or a new subdirectory. Plan-time decision; the task carries a decision budget of 3 specifically to accommodate this.

**Flag C — Scribe ordering (6 before 5):** The scribe agent (Task 5) should reference the template by exact path. That path only exists after Task 6 creates the file. Therefore Task 6 must precede Task 5 in execution order, despite my initial listing. Final order: 1 → 2 → 3 → 4 → 6 → 5.

**Flag D — SKILL.md scribe reference in Task 4:** Task 4 adds the scribe dispatch step to SKILL.md. That step names `agents/design-committee-scribe.md`. If that agent doesn't exist yet when Task 4 runs (because Task 5 follows), SKILL.md will have a dangling agent reference. Since all tasks run sequentially and Task 5 follows Task 4, this is not a runtime problem — but it is a file-consistency gap between Task 4 commit and Task 5 commit. This is acceptable in a docs sprint where no test validates agent file existence, but it should be noted.

**Flag E — No purist blocking concern with 6-task decomposition:** I considered whether synthesize-step and converge-step in team-lead.md should be separate tasks (since they are distinct steps). Verdict: no — they are two steps in the same role's write-evict discipline in the same file. Splitting them creates a file that has synthesize-write but not converge-write, which is not a valid intermediate state for a commit. The single-task grouping is correct.

---

## Final Position

**position:** Six tasks, one per file (four modifications, two creations), ordered 1→2→3→4→6→5. AC coverage complete; AC1 flagged as emergent, homed to Task 4 by convention. No task straddles unrelated concerns. Task 6 must precede Task 5 (template before scribe agent references it).

**rationale:** The six implementation surface items in spec §9 map directly to six files. Each file has a single coherent concern that admits no further task-boundary decomposition without creating intermediate invalid states. AC tracing is complete across all five criteria.

**blocking_risk:** AC1 (token budget) is not verifiable from any single task's output — if the committee treats Task 4 as the AC1 owner without flagging emergence, a reviewer could incorrectly mark AC1 as "complete" after Task 4 while the pipeline is still open because Tasks 5 and 6 are unfinished.
