# Spec: Decision-Record / Constraint-Triangle System

**Sprint:** 20260424-01-build-decision-loop
**Parent brief:** `docs/chester/working/20260424-01-build-decision-loop/design/build-decision-loop-design-00.md`
**Architecture:** Loop C (test-execution-driven) with five strengthening modifications and loop-optimized spec/plan document formats.

---

## Goal

Add the feedback-loop mechanism Chester lacks: prospective capture of decisions during `execute-write`, propagation to spec, tests, plans, and affected code (both forward and retroactive within-sprint), and cross-sprint consumption via `plan-build`. The test corpus is the load-bearing enforcement artifact; the decision-record store is the persistent memory. Chester becomes pipeline-shaped and loop-shaped at once.

---

## Architecture

The system is a test-execution-driven loop with structural enforcement at the code-test boundary (the deterministic node of the validation asymmetry).

**Core asymmetry preserved:** Code↔Test is deterministic (suite pass/fail); Spec↔Test is structural (criterion IDs anchored to skeleton IDs); Spec↔Code is probabilistic (LLM used for capture and revision drafting only — never for gating).

**Five strengthening modifications** layered onto the base Loop C:
1. Boundary-explicit skeletons declared at spec time (discriminator precision)
2. Structured `observable-behaviors.md` artifact emitted by implementer (mechanical trigger input)
3. Sprint-end record-test linkage integrity gate at `execute-verify-complete` (structural enforcement of NC-3 and NC-4 integrity over sprint lifetime)
4. Spec-driven test generation during propagation (prevents TDD inversion; strengthens retroactive reach per NC-5)
5. `dr_audit` at sprint close via `finish-write-records` (long-term Phase 4 coherence — validates the chat record's four-phase operational shape)

**Document-format changes** make loop metadata first-class in the spec and plan artifacts. Acceptance criteria carry stable IDs, observable-boundary declarations, and test skeleton IDs. Plan tasks carry task IDs, type (code/docs/config), implements-AC references, decision budget estimates, and must-remain-green behavioral locks inherited from Prior Decisions.

**Independence:** the subsystem is structurally isolated from the design phase. No file under `skills/design-large-task/` or `skills/design-small-task/` is modified. The new MCP lives at a top-level path (`mcp/chester-decision-record/`) outside all skill directories. The new MCP's tools, state file, and write path are fully disjoint from proof-mcp and understanding-mcp.

---

## Components

### New: Decision-Record MCP

**Location:** `mcp/chester-decision-record/` (new top-level directory, outside `skills/`)

**Files:**
- `server.js` — MCP entry point; stdio transport; tool dispatch. Mirrors proof-mcp's server structure (~120 LOC).
- `store.js` — append-only flat-file operations on `/docs/chester/decision-record/decision-record.md`; ID generation (`YYYYMMDD-XXXXX`); status transitions; bidirectional supersede linking (~180 LOC).
- `schema.js` — field-set validation; structured error returns for missing/invalid fields (~60 LOC).
- `package.json` — `"type": "module"`, `@modelcontextprotocol/sdk` dependency. Mirrors proof-mcp package shape.

**Tool surface (six tools):**

- `dr_capture(sprint, task, trigger, context, options_considered, chosen, rationale, spec_update, test, code, tags)` — validates full field set; generates `YYYYMMDD-XXXXX` ID; appends record with `Status: Active`; returns assigned ID.
- `dr_supersede(old_id, new_id)` — appends the new record; updates old record's `Superseded By` link field and `Status` to `Superseded`; updates new record's `Supersedes` field. Never rewrites record bodies, only link/status fields.
- `dr_abandon(sprint)` — sets `Status: Abandoned` on all Active records whose `Sprint` matches the given sprint name.
- `dr_query(filter)` — reads store; applies filter (`sprint_subject?`, `tags?`, `status?`, `recency_days?`, `criterion_id?`); returns matching records as structured JSON.
- `dr_verify_tests(sprint)` — **(Mod 3)** queries all records with `Sprint = {sprint}`; for each, verifies the test named in `Test` field exists in the test corpus and currently passes; returns pass/fail per record plus aggregate verdict.
- `dr_audit(filter?)` — **(Mod 5)** walks all Active records (optionally filtered); for each, verifies `Test` field test still exists and passes, and `Code` field file:line reference still exists in the codebase (or has been explicitly superseded). Returns drift report structured for session summary inclusion.

**Registration:** `.claude-plugin/mcp.json` gains one new entry:

```json
"chester-decision-record": {
  "command": "node",
  "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/chester-decision-record/server.js"]
}
```

### New: Persistent Decision Store

**Location:** `/docs/chester/decision-record/decision-record.md`

Flat markdown file, one record per H2 section, newest appended at bottom. Created on first `dr_capture` call if absent. Tracked in git. Sibling to `docs/chester/plans/` and `docs/chester/working/`.

**Record format (enforced by `schema.js`):**

```markdown
## Decision YYYYMMDD-XXXXX — {Title}

- **Sprint:** {sprint name}
- **Task:** Task {N} ({task subject})
- **Status:** Active | Superseded | Abandoned
- **Tags:** {comma-separated tags}

### Trigger
{what created the ambiguity — spec/plan/tests did not determine}

### Context
{what was being implemented when the gap was discovered}

### Options Considered
- **A** — {option A description}
- **B** — {option B description}
- **C** — {option C description, if applicable}

### Chosen
{letter}

### Rationale
{why this option; why not the others}

### Spec Update
{criterion ID and clause text added/modified, or "none" with reason}

### Test
{test name + commit SHA after test passes}

### Code
{file:line + commit SHA}

### Supersedes
{predecessor record ID, or "—"}

### Superseded By
{successor record ID filled when superseded, or "—"}
```

### New Reference Files

- `skills/design-specify/references/spec-template.md` — canonical loop-optimized spec template (see Spec Document Format below).
- `skills/execute-write/references/propagation-procedure.md` — documents the three-step propagation sequence (spec-clause update → spec-driven test generation → full suite run). Includes the rule that tests generated during propagation MUST be derived from spec clause text, not from implementer's code (Mod 4).

### Modified Existing Skills

**`skills/design-specify/SKILL.md`:**
- Writing-the-spec step updated: for each acceptance criterion, assign stable criterion ID (e.g., `AC-2.3`), write observable-boundary declaration, generate test skeleton at `spec/{sprint-name}-spec-skeleton-00.md` with skeleton ID tied to criterion ID.
- Reference: `spec-template.md` (new).

**`skills/plan-build/SKILL.md`:**
- New step at plan-start: call `dr_query` with sprint-subject match + `status=Active` filter; populate `## Prior Decisions` section in plan header with returned records.
- Plan-writing step updated: each task block assigned stable Task ID, Type (code/docs/config), Implements list of AC IDs, Decision budget estimate, Must-remain-green test ID list derived from Prior Decisions whose Code field touches this task's files.

**`skills/plan-build/references/plan-template.md`:** replaced with loop-optimized template (see Plan Document Format below).

**`skills/execute-write/SKILL.md`:**
- New Section 2.1.5 inserted between existing step 2 (implementer status handling) and step 3 (spec reviewer dispatch):
  - Skip if current task's Type is `docs-producing` or `config-producing` (no skeleton diff runs for non-code tasks).
  - Read implementer's `observable-behaviors.md` artifact (Mod 2) and the spec's skeleton manifest.
  - Run skeleton-coverage diff: for each observable behavior in the artifact, check whether an existing skeleton's declared boundary covers it. Behaviors with no skeleton coverage trigger FIRE.
  - On FIRE: call `dr_capture` with full field set; run propagation procedure per `propagation-procedure.md` (spec-clause update, spec-driven test generation via dispatched test-generator subagent receiving spec-only context per Mod 4, full suite run); task is BLOCKED until suite passes including new test(s).
  - Backward reach: failing tests on earlier-task code trigger existing BLOCKED-status handling (dispatch implementer scoped to failing-test files, updated spec clause as context).
- Red Flags gains entry: "Marking task DONE without checking decision-record trigger (Section 2.1.5) or without suite including new propagation-generated tests passing."

**`skills/execute-write/references/implementer.md`:**
- Self-check section requires implementer to emit `observable-behaviors.md` artifact: canonical-form list of observable behaviors in the diff (e.g., `allow_request(t, count) -> {returns: bool, invariant: count >= limit implies false}`).
- Self-check includes reading the spec's skeleton manifest and noting which behaviors are not covered by existing skeletons.

**`skills/execute-write/references/spec-reviewer.md`:**
- Verification adds: if decision records were created during this task, verify record's `Spec Update` field matches updated spec clause text, and record's `Test` field points to a test present in the latest commit.

**`skills/execute-verify-complete/SKILL.md`:**
- New step before checkpoint commit: invoke `dr_verify_tests(current_sprint)`; if any record's Test field is broken (test missing or failing), BLOCK with structured error listing failing record IDs. No checkpoint commit until resolved (Mod 3).

**`skills/finish-write-records/SKILL.md`:**
- Feature mode gains two steps:
  - If sprint abandoned: call `dr_abandon(sprint_name)`; log abandoned-record count in session summary.
  - At sprint close (normal completion): call `dr_audit(filter = sprint-subject OR recent)`; include drift findings in session summary under new "Decision-Record Audit" section (Mod 5).

**`skills/setup-start/SKILL.md`:**
- Available-skills list gains one-line reference to the new MCP and its role.

---

## Spec Document Format (Loop-Optimized)

New spec template, to be written by `design-specify` going forward. Replaces the current free-form spec.

```markdown
# Spec: {Feature Name}

**Sprint:** YYYYMMDD-##-verb-noun-noun
**Parent brief:** {design brief path}
**Architecture:** {architecture chosen from design-specify hybrid}

## Goal
{one paragraph}

## Components
{new/modified units}

## Data Flow
{how data moves through components}

## Error Handling
{failure modes and responses}

## Testing Strategy
{test categories, coverage expectations}

## Constraints
{cross-cutting constraints}

## Non-Goals
{explicitly out of scope}

## Acceptance Criteria

### AC-{N.M} — {Short Name}

**Observable boundary:**
- {condition → outcome}
- {condition → outcome}

**Given:** {precondition}
**When:** {trigger}
**Then:** {observable result}

**Test skeleton ID:** `ac-{N-M}-{slug}` (auto-scaffolded at design-specify time; skeleton file `spec/{sprint-name}-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write as records fire; lists record IDs + one-line Chosen)
```

**Rules:**

- Every acceptance criterion has a stable ID `AC-{N.M}` (can supersede to `AC-{N.M}a`, `AC-{N.M}b` if clause is later refined via decision record).
- Every criterion has an observable-boundary declaration — the precise condition→outcome pairs the skeleton tests.
- Every criterion has a test skeleton ID auto-generated at spec-write time, stored in a separate skeleton manifest file in the spec directory.
- `Implementing tasks` and `Decisions` are populated by downstream skills (plan-build, execute-write) — the spec file is a living document updated as the sprint progresses.

## Plan Document Format (Loop-Optimized)

New plan template, to be written by `plan-build` going forward. Replaces current `plan-template.md`.

```markdown
# Plan: {Feature Name}

**Sprint:** YYYYMMDD-##-verb-noun-noun
**Spec:** {spec file path}

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox syntax.

## Goal
{one sentence}

## Architecture
{inherited from spec}

## Tech Stack
{key technologies}

## Prior Decisions

*(populated by plan-build via `dr_query` at plan-start; filter: sprint-subject match OR shared-component match, status=Active)*

- **[YYYYMMDD-XXXXX]** {title} — see spec {AC-ID}. Must-remain-green: `{test_name}`.

*(or "None" if dr_query returns empty)*

---

## Task {N}: {Task Name}

**Type:** code-producing | docs-producing | config-producing
**Implements:** AC-{X.Y}, AC-{A.B}
**Decision budget:** {estimated ambiguity count}
**Must remain green:** `{test_name}` (inherited from Decision {YYYYMMDD-XXXXX})

**Files:**
- Create: `{path}`
- Modify: `{path}:{line-range}`
- Test: `{test-path}`

**Steps (TDD):**
- [ ] **Step 1:** Write the failing test (reference skeleton `{skeleton-ID}`)
- [ ] **Step 2:** Run test to verify it fails
- [ ] **Step 3:** Write minimal implementation
- [ ] **Step 4:** Run test to verify it passes
- [ ] **Step 5:** Commit
```

**Rules:**

- Every task has a stable Task ID.
- Type determines trigger-check applicability in execute-write: `code-producing` runs skeleton-coverage diff; `docs-producing` / `config-producing` skip.
- Implements list traces each task to spec criterion IDs (back-reference populates spec's `Implementing tasks` field).
- Decision budget is an estimate; plan-attack can flag high-budget tasks as indicators of underspecified spec.
- Must-remain-green lists test IDs from Prior Decisions whose Code field references files this task will touch; execute-write verifies these tests remain passing as part of the task's gate.

---

## Data Flow

### Trigger-through-capture (within-sprint)

```
implementer subagent returns DONE/DONE_WITH_CONCERNS
   ↓
execute-write Section 2.1.5 reads implementer's observable-behaviors.md + spec skeleton manifest
   ↓
skeleton-coverage diff runs; any uncovered behavior → FIRE
   ↓
dr_capture called with full field set; record ID assigned
   ↓
propagation begins (per propagation-procedure.md)
```

### Propagation (within-sprint)

```
spec clause added/updated (design-specify's spec-write file edited directly)
   ↓
test-generator subagent dispatched with spec-only context (Mod 4)
   ↓
test generated; added to test corpus
   ↓
full test suite run via execute-prove
   ↓
suite pass → task DONE; suite fail → task BLOCKED
   ↓ (BLOCKED path)
think-gate fires; implementer re-dispatched scoped to failing test's file(s)
   ↓
suite re-run; repeat until pass
```

### Sprint-end gate (Mod 3)

```
execute-verify-complete invoked
   ↓
dr_verify_tests(current_sprint) called
   ↓
for each record this sprint: test exists? test passes?
   ↓
all pass → checkpoint commit; any fail → BLOCK
```

### Cross-sprint consumption (NC-8)

```
plan-build begins new sprint
   ↓
dr_query called with sprint-subject filter, status=Active
   ↓
matching records populate Prior Decisions in plan header
   ↓
for each record: test IDs added to Must-remain-green lists of tasks touching the record's Code files
   ↓
execute-write honors Must-remain-green as additional gate per task
```

### Sprint-close audit (Mod 5)

```
finish-write-records invoked (feature mode)
   ↓
dr_audit called
   ↓
drift report included in session summary
   ↓
(abandon path): dr_abandon(sprint) called; all sprint's records transition to Status=Abandoned
```

---

## Error Handling

- **MCP missing at call site:** execute-write, plan-build, finish-write-records check MCP availability at invocation; if `chester-decision-record` server is not registered, log warning and skip the decision-record step (soft-fail). Existing flow continues. Red Flag entry advises reload.
- **Malformed record (dr_capture schema rejection):** `schema.js` returns structured error; execute-write treats as BLOCKED status; think-gate fires to diagnose (typically implementer missed a field in self-check).
- **Test suite broken for unrelated reasons:** propagation step 3 (suite run) fails for non-decision reasons. execute-write distinguishes "new test fails because behavior not implemented" from "suite fails because pre-existing infrastructure break" via existing BLOCKED-status think-gate.
- **Concurrent session write to store:** store.js uses file-lock on write; second session blocks until first completes. Accepted risk — Chester sessions are single-user on local machine; concurrent access is rare.
- **Record references deleted test:** `dr_verify_tests` (Mod 3) catches at sprint-end; `dr_audit` (Mod 5) catches at sprint-close. Drift surfaced for human resolution.
- **Circular supersede (A supersedes B supersedes A):** `dr_supersede` tool validates against existing chain; rejects circular update.

---

## Testing Strategy

- **MCP tool tests:** unit tests for each tool (`dr_capture` field validation, `dr_supersede` append-only semantics, `dr_query` filter logic, `dr_verify_tests` integration, `dr_audit` drift detection). Tests in `tests/mcp/chester-decision-record/`.
- **Skill integration tests:** bash-based per Chester convention, at `tests/test-decision-record-integration.sh`. Exercises a minimal end-to-end flow: design-specify scaffolds skeleton → execute-write fires trigger → dr_capture → propagation → suite runs → task DONE.
- **Format validation tests:** spec template and plan template validation (criterion IDs present, skeleton IDs match, task IDs unique, Implements references resolve to real AC IDs).
- **Cross-sprint test:** simulate two sprints; verify dr_query returns prior sprint's records; verify must-remain-green constraints carry forward; verify dr_audit detects drift when a later change breaks a prior test.
- **Abandon-path test:** simulate sprint abandon; verify `dr_abandon` marks all sprint records as Abandoned; verify dr_query with `status=Active` excludes them.

---

## Constraints

- **Independence from design phase:** no modifications to `skills/design-large-task/` or `skills/design-small-task/`. MCP at `mcp/chester-decision-record/`, not inside any skill directory. No tool or state sharing with proof-mcp or understanding-mcp.
- **Validation asymmetry preserved:** LLM is not the gate. All structural enforcement (trigger coverage check, test suite pass/fail, record-test linkage verification) is at the deterministic or structural node. LLM is used for drafting (capture content, spec clause wording, test generation) only.
- **Chester's existing conventions respected:** util-artifact-schema for naming/paths; Chester-config-read for path resolution; skill file conventions (SKILL.md + references/); append-only commit discipline; existing subagent dispatch patterns.
- **Flat-file scale:** per risk acknowledged in design brief; designer accepts unbounded growth for now; `dr_query` filters at read time keep plan-build's consumption bounded.
- **Agent-autonomous capture:** no human-approval gate intercepts `dr_capture`; trigger fires structurally; designer reviews during standard spec-reviewer extension check and at sprint-close audit report.

---

## Non-Goals

- **Proactive design-phase integration:** design-large-task and design-small-task do NOT invoke decision-record tools. The subsystem is read-after-the-fact only by specify/plan/write/finish phases.
- **Generic ADR tooling:** the system is specific to in-flight implementation decisions with four-destination propagation. It is not a general-purpose ADR tracker.
- **Automated merge-conflict resolution across branches:** if two sprints both modify the store concurrently (merge conflict), resolution is manual.
- **Concept-level knowledge base:** the pending `solution-design-language-kb` proposal is a separate track. This sprint does not implement or integrate with a persistent concept KB; it only implements the decision-record loop.
- **Retroactive backfill of decision records for prior sprints:** records start accumulating from the first sprint after this system ships. Prior sprints are not backfilled.

---

## Acceptance Criteria

### AC-1.1 — Decision records are created at ambiguity moment

**Observable boundary:**
- implementer resolves ambiguity (two valid implementations, no artifact determines) → `dr_capture` called before task completion → record exists in store with matching Trigger, Context, Options Considered, Chosen, Rationale
- implementer produces code with no uncovered observable behaviors → no record created, task proceeds normally

**Given:** execute-write runs a task whose implementer surfaces a decision ambiguity
**When:** implementer returns DONE/DONE_WITH_CONCERNS with observable-behaviors.md reporting uncovered behavior
**Then:** `dr_capture` is invoked within the same task, before spec-reviewer dispatch; the returned record ID is recorded in session state; record is present in `/docs/chester/decision-record/decision-record.md` with Status=Active

**Test skeleton ID:** `ac-1-1-prospective-capture`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-1.2 — Non-code tasks skip trigger check

**Observable boundary:**
- task Type = `docs-producing` or `config-producing` → Section 2.1.5 skips skeleton-coverage diff entirely
- task Type = `code-producing` → Section 2.1.5 runs skeleton-coverage diff

**Given:** plan assigns Type=docs-producing to a task
**When:** execute-write processes the task
**Then:** no trigger check runs; no dr_capture call; task proceeds via existing execute-write flow

**Test skeleton ID:** `ac-1-2-non-code-skip`

---

### AC-2.1 — Spec-level vs plan-level discriminated structurally

**Observable boundary:**
- implementer's observable behavior covered by existing skeleton → classified plan-level → no record
- implementer's observable behavior NOT covered by any skeleton → classified spec-level → record fires

**Given:** skeleton manifest scaffolded at design-specify with one skeleton per criterion
**When:** implementer reports observable behaviors in diff
**Then:** skeleton-coverage diff produces a binary FIRE/NO_FIRE result based on skeleton presence/absence (no LLM judgment step)

**Test skeleton ID:** `ac-2-1-mechanical-discrimination`

---

### AC-3.1 — Records carry full field set

**Observable boundary:**
- `dr_capture` called with all mandatory fields populated → record accepted, ID returned
- `dr_capture` called with any mandatory field missing → structured error returned, no record written

**Given:** MCP `schema.js` defines mandatory field set per RULE-6
**When:** `dr_capture` is called with an incomplete field set
**Then:** the call fails with a structured error naming the missing field(s); no record is appended; caller handles as BLOCKED

**Test skeleton ID:** `ac-3-1-field-set-mandatory`

---

### AC-4.1 — Task completion blocked on suite pass including propagation test

**Observable boundary:**
- all tests pass (including new propagation-generated test) → task can be marked DONE
- any test fails (including new propagation-generated test) → task enters BLOCKED status

**Given:** a decision record fires during task execution and a new test is generated from the updated spec clause
**When:** the full test suite runs at propagation step 3
**Then:** if any test fails (new or existing), task status is BLOCKED; TodoWrite DONE marker is withheld until suite passes

**Test skeleton ID:** `ac-4-1-gate-on-suite-pass`

---

### AC-4.2 — Sprint-end record-test linkage verified

**Observable boundary:**
- every record created this sprint has a Test field pointing to a passing test in the corpus → `execute-verify-complete` proceeds to checkpoint commit
- any record's Test field is broken → checkpoint commit blocked

**Given:** `execute-verify-complete` invoked at end of sprint
**When:** `dr_verify_tests(current_sprint)` runs
**Then:** if any record has a missing or failing test, verify-complete BLOCKS with structured error listing record IDs; no checkpoint commit until resolved

**Test skeleton ID:** `ac-4-2-sprint-end-linkage`

---

### AC-5.1 — Backward reach via failing tests on earlier-task code

**Observable boundary:**
- new propagation-generated test fails against earlier-task code → earlier-task files identified by test failure → implementer re-dispatched to fix
- new propagation-generated test passes on all code including earlier-task files → no backward reach needed

**Given:** Task 3 fires a decision record updating spec clause previously implemented by Task 1
**When:** the spec-driven test generated from the updated clause runs
**Then:** if Task 1's code violates the updated clause, the test fails; existing BLOCKED-status handling fires; implementer subagent is dispatched scoped to Task 1's files with the updated spec clause as context; subagent revises code; suite re-runs; passes

**Test skeleton ID:** `ac-5-1-backward-reach`

---

### AC-5.2 — Spec-driven test generation (not code-driven)

**Observable boundary:**
- test-generator subagent receives updated spec clause as context → generates test asserting spec behavior
- test-generator subagent does NOT receive implementer's code or existing test code → prevents TDD inversion

**Given:** propagation step 2 invoked after spec clause updated
**When:** test-generator subagent is dispatched
**Then:** subagent's context window contains only the updated spec clause, the skeleton manifest, and the existing spec (not the implementer's code); generated test asserts clause behavior; the test may fail against existing code, which is the signal for backward reach

**Test skeleton ID:** `ac-5-2-spec-driven-generation`

---

### AC-6.1 — Persistent store at /docs/chester/decision-record

**Observable boundary:**
- `dr_capture` writes to `/docs/chester/decision-record/decision-record.md` only
- no other write path accepts records

**Given:** MCP `store.js` hardcodes write target
**When:** any MCP tool is invoked with record-writing intent
**Then:** writes land at `/docs/chester/decision-record/decision-record.md`; no alternative path is accepted; file is created if absent on first call

**Test skeleton ID:** `ac-6-1-store-location`

---

### AC-7.1 — Append-only supersede with bidirectional links

**Observable boundary:**
- `dr_supersede(old_id, new_id)` sets `Status=Superseded` and `Superseded By=new_id` on old record; sets `Supersedes=old_id` on new record; neither body is rewritten
- attempt to delete or rewrite a record body → rejected by store.js

**Given:** record A exists with Status=Active
**When:** `dr_supersede(A, B)` is called where B is a newly captured record
**Then:** A retains its body unchanged; A's Status becomes Superseded; A's Superseded By = B's ID; B's Supersedes = A's ID

**Test skeleton ID:** `ac-7-1-append-only-supersede`

---

### AC-8.1 — plan-build populates Prior Decisions from dr_query

**Observable boundary:**
- `dr_query` returns one or more matching records → plan-build's plan header contains `## Prior Decisions` section listing them
- `dr_query` returns empty → plan-build's plan header contains `## Prior Decisions` section with body "None"

**Given:** plan-build invoked for a new sprint; some prior sprint's records match the current sprint's subject
**When:** plan-build's plan-start step runs
**Then:** `dr_query(sprint_subject=..., status=Active)` is called; results populate Prior Decisions section in plan header; each record's test IDs become inputs to Must-remain-green lists for tasks touching the record's Code files

**Test skeleton ID:** `ac-8-1-plan-build-consultation`

---

### AC-9.1 — Test-skeleton mechanical discriminator

**Observable boundary:**
- design-specify scaffolds one skeleton per AC at spec-write time → skeleton manifest exists at `spec/{sprint-name}-spec-skeleton-00.md`
- execute-write's trigger check reads manifest for coverage diff → FIRE/NO_FIRE decision is structural, not LLM-judged

**Given:** design-specify writes spec with N acceptance criteria
**When:** design-specify's spec-write phase completes
**Then:** skeleton manifest file exists with N skeleton entries; each skeleton has an ID, criterion reference, and observable-boundary declaration

**Test skeleton ID:** `ac-9-1-skeleton-scaffolding`

---

### AC-10.1 — Direct store, no promotion step

**Observable boundary:**
- record captured mid-sprint → present in store immediately, Status=Active
- no sprint-close curation / promotion / distillation step exists in any skill

**Given:** `dr_capture` called during execute-write task
**When:** the call returns
**Then:** record is visible in `/docs/chester/decision-record/decision-record.md` immediately; no intermediate location; no sprint-close promotion step must occur for the record to be queryable by future sprints

**Test skeleton ID:** `ac-10-1-direct-store`

---

### AC-10.2 — plan-build filters at read time

**Observable boundary:**
- `dr_query(filter)` applies filter parameters at read → returns only matching records
- plan-build does not read the entire store; filter narrows the result set

**Given:** decision store contains records from many prior sprints
**When:** plan-build calls `dr_query` with a narrow filter (sprint-subject match, status=Active)
**Then:** returned set is bounded by filter; store contents outside filter are not loaded into plan-build's context

**Test skeleton ID:** `ac-10-2-filter-at-read`

---

### AC-11.1 — Abandoned-sprint records transition to Abandoned status

**Observable boundary:**
- `dr_abandon(sprint)` sets `Status=Abandoned` on all records with matching Sprint field
- `dr_query` with `status=Active` filter excludes Abandoned records from results

**Given:** a sprint is closed via abandon path in `finish-write-records`
**When:** `dr_abandon(sprint_name)` is called
**Then:** all records with Sprint matching sprint_name transition from Active to Abandoned; records are preserved in store; future `dr_query(status=Active)` calls exclude them

**Test skeleton ID:** `ac-11-1-abandon-path`

---

### AC-12.1 — Independence from design phase preserved

**Observable boundary:**
- no file under `skills/design-large-task/` or `skills/design-small-task/` is modified by this sprint
- no MCP tool registered under this sprint is referenced by design-phase skills
- decision-record MCP's state file is at `/docs/chester/decision-record/`, disjoint from proof/understanding MCP state paths

**Given:** sprint implementation complete
**When:** repository state is inspected
**Then:** design-large-task and design-small-task directories have no diff; `.claude-plugin/mcp.json` has three MCP entries (existing proof, existing understanding, new chester-decision-record) with disjoint server paths and tool namespaces

**Test skeleton ID:** `ac-12-1-independence-preserved`
