# Spec: Decision-Record / Constraint-Triangle System

**Sprint:** 20260424-01-build-decision-loop
**Parent brief:** `docs/chester/working/20260424-01-build-decision-loop/design/build-decision-loop-design-00.md`
**Architecture:** Loop C (test-execution-driven) with five strengthening modifications and loop-optimized spec/plan document formats.
**Revision:** 04 — addresses two CRITICAL + two HIGH findings from plan-attack:
1. **Store path reinterpreted.** Designer clarified `/docs/chester/decision-record/` is the intended store directory (pre-existing empty directory is purposefully provisioned). Store file is `/docs/chester/decision-record/decision-record.md` (file inside the directory). Reverts spec-02's "single flat file at `/docs/chester/decision-record.md`" back to the directory+file interpretation of spec-00/01, with designer confirmation.
2. **Store path parameterization.** `store.js` takes a `storePath` option defaulting to the production path. Tests override to per-test temp paths. MCP server resolves path from env var `CHESTER_DECISION_RECORD_PATH` when set, otherwise uses the production default. Prevents tests from polluting the production store.
3. **Late-binding of Test and Code commit SHA.** New MCP tool `dr_finalize_refs(record_id, test_sha?, code_sha?)` appends commit SHA to existing Test / Code field values after task commit. Schema accepts Test/Code fields without SHA at capture time; `dr_verify_tests` requires SHA presence at sprint-end (structural gate enforces finalization).
4. **Test framework alignment.** Testing Strategy updated to use `vitest` + `__tests__/` subdirectory convention, matching existing `proof-mcp` precedent (`skills/design-large-task/proof-mcp/package.json`).

Prior revisions:
- 03 restructured every AC to conform to the loop-optimized spec format (Implementing tasks and Decisions placeholder fields).
- 02 addressed 2 HIGH + 3 MEDIUM findings from ground-truth review (directory collision — now reinterpreted per 04, hook-surface claim, skill-index path, execute-write section numbering, memory.md analogy).
- 01 addressed three MEDIUM findings from adversarial review (path ambiguity, verify-tests ordering, language-awareness) plus three advisory items from fidelity review (path wording, cross-reference table, test-generator template file).

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
3. Sprint-end record-test linkage integrity gate at `execute-verify-complete` (structural enforcement over sprint lifetime)
4. Spec-driven test generation during propagation (prevents TDD inversion; strengthens retroactive reach)
5. `dr_audit` at sprint close via `finish-write-records` (long-term Phase 4 coherence)

**Document-format changes** make loop metadata first-class in the spec and plan artifacts.

**Independence:** the subsystem is structurally isolated from the design phase. No file under `skills/design-large-task/` or `skills/design-small-task/` is modified. The new MCP lives at a top-level path (`mcp/chester-decision-record/`) outside all skill directories. The new MCP's tools, state file, and write path are fully disjoint from proof-mcp and understanding-mcp.

**Hook-surface note.** The parent brief's Evidence section states "Chester's plugin hook surface is SessionStart only" (EVID-6). This reflects the `refactor-chester-skills` branch state where compaction hooks were reverted. As of this spec, `main` still has PreCompact and PostCompact registered in `hooks/hooks.json` — the revert is unmerged. This does not affect the decision-record architecture: the design explicitly does not depend on any hook surface; all enforcement is at the MCP tool layer or through existing subagent dispatch patterns. Implementer should not treat "SessionStart only" as a pre-condition.

**Store-directory note (rev 04 clarification).** The designer confirmed that `/docs/chester/decision-record/` (empty directory present in the repo at time of this spec) is the intended store directory — not a collision to be removed. The store file is `decision-record.md` inside that directory. The directory may hold supporting files (notably `decision-record.md.lock` during concurrent writes). No `rmdir` step is part of this sprint's setup.

---

## Components

### New: Decision-Record MCP

**Location:** `mcp/chester-decision-record/` (new top-level directory, outside `skills/`). This introduces a new top-level convention: MCPs that are independent of any skill live at `mcp/{server-name}/`. Existing MCPs (proof, understanding) remain inside `skills/design-large-task/` and are not moved by this sprint.

**Files:**
- `server.js` — MCP entry point; stdio transport; tool dispatch. Structurally mirrors proof-mcp's server (estimated 150–250 LOC; exact count depends on tool handler verbosity).
- `store.js` — append-only operations on the flat store file; ID generation; status transitions; bidirectional supersede linking (estimated 150–200 LOC).
- `schema.js` — field-set validation; structured error returns for missing/invalid fields (estimated 50–80 LOC).
- `package.json` — `"type": "module"`; `@modelcontextprotocol/sdk` dependency. Mirrors proof-mcp package shape.

**Tool surface (seven tools):**

- `dr_capture(sprint, task, trigger, context, options_considered, chosen, rationale, spec_update, test, code, tags)` — validates field set (see Capture-time vs finalize-time validation below); generates `YYYYMMDD-XXXXX` ID; appends record with `Status: Active`; returns assigned ID. At capture time, `test` carries the test name only (no SHA) and `code` carries `file:line` only (no SHA) — SHAs are added later via `dr_finalize_refs`.
- `dr_finalize_refs(record_id, test_sha?, code_sha?)` — **(new in rev 04)** appends the commit SHA to the Test and/or Code fields of the named record. Format before finalize: Test=`{test_name}`, Code=`{file:line}`. Format after finalize: Test=`{test_name} @ {commit_sha}`, Code=`{file:line} @ {commit_sha}`. Permitted to mutate only the Test and Code fields of the target record; record body otherwise unchanged. Called by `execute-write` after the propagation test and the task implementation commit. Idempotent: re-calling with the same SHAs is a no-op; re-calling with different SHAs is rejected (records are append-only for history; finalize is a one-shot append, not an overwrite).
- `dr_supersede(old_id, new_id)` — appends the new record; updates old record's `Superseded By` link field and `Status` to `Superseded`; updates new record's `Supersedes` field. Never rewrites record bodies, only supersede-link / status fields.
- `dr_abandon(sprint)` — sets `Status: Abandoned` on all records with `Status = Active` whose `Sprint` matches the given sprint name. Records already `Superseded` are not rewritten to `Abandoned` — Superseded is terminal and takes precedence.
- `dr_query(filter)` — reads store; applies filter (`sprint_subject?`, `tags?`, `status?`, `recency_days?`, `criterion_id?`); returns matching records as structured JSON.
- `dr_verify_tests(sprint)` — queries all records with `Sprint = {sprint}`; for each, verifies the test named in `Test` field exists in the test corpus and currently passes AND the Test field carries a commit SHA (i.e., `dr_finalize_refs` has been called). Returns per-record verdicts and aggregate pass/fail.
- `dr_audit(filter?)` — walks all Active records (optionally filtered); for each, verifies `Test` field test still exists and passes, and `Code` field file:line reference still exists in the codebase (or has been explicitly superseded). Returns structured drift report for session-summary inclusion.

**Capture-time vs finalize-time field validation (`schema.js`):**
- At capture (`dr_capture`): all fields mandatory EXCEPT commit-SHA portions of Test and Code. Test must carry a test name; Code must carry `file:line`. SHA portions may be absent.
- At finalize (`dr_finalize_refs`): accepts optional Test and Code SHA arguments; writes them back into the record's Test / Code fields using the `{name} @ {sha}` format.
- Sprint-end gate (`dr_verify_tests`, invoked by `execute-verify-complete`): ALL records for the sprint must have SHA-finalized Test fields; if any record has an unfinalized Test, the gate BLOCKS. This structurally enforces that `dr_finalize_refs` is always called after commit.

**Return shapes (summary):**
- `dr_capture` returns `{ id: string, status: "accepted" | "error", errors?: [{ field: string, reason: string }] }`
- `dr_finalize_refs` returns `{ status: "accepted" | "error", errors?: [...] }` where errors include `"already-finalized-with-different-sha"` when re-called with mismatched SHA
- `dr_query` returns `{ records: [Record] }` where `Record` is the full record shape.
- `dr_verify_tests(sprint)` returns `{ sprint: string, per_record: [{ id, test, exists: bool, passes: bool, sha_finalized: bool }], aggregate: "pass" | "fail" }`
- `dr_audit(filter?)` returns `{ audited: int, drifted: int, findings: [{ id, kind: "test-missing" | "test-failing" | "code-moved" | "sha-missing", detail: string }] }`
- `dr_supersede(old, new)` returns `{ status: "accepted" | "error", errors?: [...] }`
- `dr_abandon(sprint)` returns `{ affected: int, skipped_superseded: int }`

**Registration:** `.claude-plugin/mcp.json` gains one new entry:

```json
"chester-decision-record": {
  "command": "node",
  "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/chester-decision-record/server.js"]
}
```

### New: Persistent Decision Store

**Location:** `/docs/chester/decision-record/decision-record.md` — the persistent store is a markdown file named `decision-record.md` inside the `/docs/chester/decision-record/` directory. The directory is purposefully provisioned (pre-existing empty) for this sprint's use and may hold additional supporting state files if needed (e.g., lock files during concurrent writes). All records append into `decision-record.md` as H2 sections. The directory is sibling to `docs/chester/plans/` and `docs/chester/working/`; tracked in git.

**Path parameterization.** `store.js` accepts a `storePath` option. Default is the production path `/docs/chester/decision-record/decision-record.md`. Tests override via constructor argument to per-test temp paths. The MCP server resolves `storePath` from the `CHESTER_DECISION_RECORD_PATH` environment variable when set, otherwise uses the production default. Test fixtures MUST use an override to prevent polluting the production store.

**ID counter.** Stateless: at `dr_capture` time, `store.js` scans the store file for the latest `YYYYMMDD-XXXXX` entry matching today's date and increments XXXXX. First record of the day starts at `00001`. Under concurrent-session access, `store.js` uses a file-lock (per-path lockfile at `{storePath}.lock`) during the read-increment-append sequence. The directory layout supports the lockfile as a sibling to the markdown file without polluting the content.

Store file is created on first `dr_capture` call if absent. Directory is expected to exist (already provisioned).

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
{test name at capture; `{test name} @ {commit SHA}` after `dr_finalize_refs` runs post-commit}

### Code
{file:line at capture; `{file:line} @ {commit SHA}` after `dr_finalize_refs` runs post-commit}

### Supersedes
{predecessor record ID, or "—"}

### Superseded By
{successor record ID filled when superseded, or "—"}
```

### New Reference Files

- `skills/design-specify/references/spec-template.md` — canonical loop-optimized spec template (see Spec Document Format below).
- `skills/design-specify/references/skeleton-generator.md` — language-aware skeleton scaffolding procedure. Defines how each acceptance criterion's observable-boundary declaration maps to a concrete test stub per language. Supported languages at initial scope: Rust (`#[test]` + `todo!()` with criterion ID as test name), TypeScript (`it('{criterion-id}', () => { throw new Error('pending') })`), Python (`def test_{criterion_id}(): pytest.skip("pending")`), Bash (`test_{criterion_id}() { echo "pending"; return 1; }`). Detection: read project root for `Cargo.toml` / `package.json` / `pyproject.toml` / first `.sh` test file to determine the target framework. Unknown framework: emit a plain markdown skeleton stub and flag to the user.
- `skills/execute-write/references/propagation-procedure.md` — documents the three-step propagation sequence (spec-clause update → spec-driven test generation → full suite run). Includes the rule that tests generated during propagation MUST be derived from spec clause text, not from implementer's code.
- `skills/execute-write/references/test-generator.md` — subagent prompt template for the test-generator subagent dispatched during propagation step 2. Context provided to the subagent is: updated spec clause text + skeleton manifest + existing spec — explicitly NOT the implementer's code or existing test code (Mod 4). Subagent produces a new test file and returns the test name.

### Modified Existing Skills

**`skills/design-specify/SKILL.md`:**
- Writing-the-spec step updated: for each acceptance criterion, assign stable criterion ID (e.g., `AC-2.3`), write observable-boundary declaration, invoke skeleton-generator (per `skeleton-generator.md`) to produce a concrete test stub in the project's test framework. Skeleton manifest is written to `spec/{sprint-name}-spec-skeleton-00.md` as an index of skeleton IDs and their criterion references; the actual stub files land in the project's test directory.
- References: `spec-template.md` (new), `skeleton-generator.md` (new).

**`skills/plan-build/SKILL.md`:**
- New step at plan-start: call `dr_query` with sprint-subject match + `status=Active` filter; populate `## Prior Decisions` section in plan header with returned records.
- Plan-writing step updated: each task block assigned stable Task ID, Type (code-producing / docs-producing / config-producing), Implements list of AC IDs, Decision budget estimate, Must-remain-green test ID list derived from Prior Decisions whose Code field touches this task's files.

**`skills/plan-build/references/plan-template.md`:** replaced with loop-optimized template (see Plan Document Format below).

**`skills/execute-write/SKILL.md`:**
- Section 2.1 (Dispatch Pattern) currently has an ordered list of steps 1–6. Insert a new numbered step between current step 2 (Handle implementer status codes) and current step 3 (Dispatch spec compliance reviewer), renumbering subsequent steps accordingly. The new step is titled "Decision-Record Trigger Check and Propagation" and contains:
  - Skip if current task's Type is `docs-producing` or `config-producing` (no skeleton diff runs for non-code tasks).
  - Read implementer's `observable-behaviors.md` artifact (Mod 2) and the spec's skeleton manifest.
  - Run skeleton-coverage diff: for each observable behavior in the artifact, check whether an existing skeleton's declared boundary covers it. Behaviors with no skeleton coverage trigger FIRE.
  - On FIRE: call `dr_capture` with field set (Test = test name only, Code = file:line only — SHAs to be added post-commit); run propagation procedure per `propagation-procedure.md` (spec-clause update, spec-driven test generation via `test-generator.md` subagent, full suite run via `execute-prove`); task is BLOCKED until suite passes including new test(s). After the task commits, call `dr_finalize_refs(record_id, test_sha, code_sha)` to append commit SHAs to the record's Test and Code fields. Finalize happens within the same task execution, after commit, before task is marked DONE in TodoWrite.
  - Backward reach: failing tests on earlier-task code trigger existing BLOCKED-status handling (dispatch implementer scoped to failing-test files, updated spec clause as context).
- Red Flags gains entry: "Marking task DONE without running the decision-record trigger check step or without the suite including new propagation-generated tests passing."

**`skills/execute-write/references/implementer.md`:**
- Self-check section requires implementer to emit `observable-behaviors.md` artifact: canonical-form list of observable behaviors in the diff. Canonical form: one line per behavior, structured as `{function_signature_or_state_transition} -> {invariant_or_outcome}`. Examples given for each supported language.
- Self-check includes reading the spec's skeleton manifest and noting which behaviors are not covered by existing skeletons.

**`skills/execute-write/references/spec-reviewer.md`:**
- Verification adds: if decision records were created during this task, verify record's `Spec Update` field matches updated spec clause text, and record's `Test` field points to a test present in the latest commit.

**`skills/execute-verify-complete/SKILL.md`:**
- New step inserted **after** `execute-prove` returns suite-pass confirmation (existing Step 1) and **before** `git status --porcelain` clean-tree check (existing Step 2): invoke `dr_verify_tests(current_sprint)`. If any record's Test field is broken (test missing or failing), BLOCK with structured error listing failing record IDs. No checkpoint commit until resolved. Rationale for insertion order: suite-pass must be confirmed first so `dr_verify_tests`'s per-test status is reliable; clean-tree check comes after because fixes to broken records may produce uncommitted changes.

**`skills/finish-write-records/SKILL.md`:**
- Feature mode gains two steps:
  - If sprint abandoned: call `dr_abandon(sprint_name)`; log abandoned-record count in session summary.
  - At sprint close (normal completion): call `dr_audit(filter = sprint-subject OR recent)`; include drift findings in session summary under new "Decision-Record Audit" section.

**`skills/setup-start/references/skill-index.md`:**
- The skill catalog in this file gains one-line reference to the new MCP and its role. Note: the skill catalog lives in `references/skill-index.md`, not in `setup-start/SKILL.md` directly — the SKILL.md delegates catalog details to the index file.

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

**Test skeleton ID:** `ac-{N-M}-{slug}` (auto-scaffolded at design-specify time; skeleton stub at language-appropriate path; skeleton manifest at `spec/{sprint-name}-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)
```

Criterion-ID rules:
- Stable ID `AC-{N.M}` per criterion. Supersede refinements via suffix (`AC-2.3a`, `AC-2.3b`). Superseded IDs are never reused.
- Observable-boundary declaration is required; vague stubs are rejected by fidelity review.
- Test skeleton ID is assigned at spec-write time; matches the skeleton generated by `skeleton-generator.md`.
- `Implementing tasks` and `Decisions` are populated by downstream skills; the spec file is a living document updated as the sprint progresses.

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
- Type determines trigger-check applicability in execute-write.
- Implements list traces each task to spec criterion IDs.
- Decision budget is an estimate; plan-attack flags high-budget tasks as indicators of underspecified spec.
- Must-remain-green lists test IDs inherited from Prior Decisions.

---

## Data Flow

### Trigger-through-capture (within-sprint)

```
implementer subagent returns DONE/DONE_WITH_CONCERNS + observable-behaviors.md
   ↓
execute-write Decision-Record Trigger Check step reads artifact + spec skeleton manifest
   ↓
skeleton-coverage diff runs; uncovered behavior → FIRE
   ↓
dr_capture called with full field set; record ID assigned
   ↓
propagation begins (per propagation-procedure.md)
```

### Propagation (within-sprint)

```
spec clause added/updated (file edit)
   ↓
test-generator subagent dispatched with spec-only context
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

### Sprint-end gate

```
execute-verify-complete invoked
   ↓
Step 1: execute-prove runs full suite → pass
   ↓
Step 2 (new): dr_verify_tests(current_sprint) runs
   ↓
for each record this sprint: test exists? test passes?
   ↓
all pass → continue; any fail → BLOCK with record IDs
   ↓
Step 3: git status clean-tree check
   ↓
Step 4: checkpoint commit
```

### Cross-sprint consumption

```
plan-build begins new sprint
   ↓
dr_query called with sprint-subject filter, status=Active
   ↓
matching records populate Prior Decisions in plan header
   ↓
for each record: test IDs added to Must-remain-green lists of tasks touching Code files
   ↓
execute-write honors Must-remain-green as additional gate per task
```

### Sprint-close audit

```
finish-write-records invoked (feature mode)
   ↓
dr_audit called
   ↓
drift report included in session summary
   ↓
(abandon path): dr_abandon(sprint) called; all sprint's Active records → Abandoned
```

---

## Error Handling

- **MCP missing at call site:** execute-write, plan-build, finish-write-records check MCP availability at invocation. If `chester-decision-record` server is not registered, log warning and skip the decision-record step (soft-fail). Existing flow continues. Red Flag entry advises `/reload-plugins`.
- **Malformed record (dr_capture schema rejection):** `schema.js` returns structured error naming missing fields; execute-write treats as BLOCKED status; think-gate fires to diagnose.
- **Test suite broken for unrelated reasons:** propagation step 3 fails for non-decision reasons. execute-write distinguishes "new test fails because behavior not implemented" from "suite fails because pre-existing infrastructure break" via existing BLOCKED-status think-gate.
- **Concurrent session write to store:** `store.js` uses file-lock on the store file itself during read-increment-append. Second session blocks. Accepted risk.
- **Record references deleted test:** `dr_verify_tests` catches at sprint-end; `dr_audit` catches at sprint-close.
- **Circular supersede (A supersedes B supersedes A):** `dr_supersede` validates against existing chain; rejects circular update.
- **MCP timeout:** MCP calls have a default 30-second timeout. Timeout treated as BLOCKED with diagnostic hint to check MCP process health.
- **`dr_abandon` on mixed-status sprint:** records already `Superseded` are skipped; only `Active` records transition to `Abandoned`. Count of skipped-superseded is returned for logging.

---

## Testing Strategy

- **MCP tool tests:** unit tests for each tool (`dr_capture` field validation, `dr_finalize_refs` SHA-append idempotence + re-call mismatch rejection, `dr_supersede` append-only semantics, `dr_query` filter logic, `dr_abandon` status transitions, `dr_verify_tests` integration including SHA-presence check, `dr_audit` drift detection). Tests use **`vitest`** (matching proof-mcp precedent at `skills/design-large-task/proof-mcp/package.json`) and live under **`mcp/chester-decision-record/__tests__/{component}.test.js`** (matching proof-mcp's `__tests__/` subdirectory convention). Tests pass `storePath` override pointing at a per-test temp file to avoid polluting the production store.
- **Skill integration tests:** bash-based per Chester convention, at `tests/test-decision-record-integration.sh`. Exercises a minimal end-to-end flow.
- **Format validation tests:** spec template and plan template validation (criterion IDs present, skeleton IDs match, task IDs unique, Implements references resolve to real AC IDs).
- **Language-aware skeleton tests:** given a project with `Cargo.toml`, verify `skeleton-generator.md` produces Rust-style stubs. Same for TypeScript, Python, Bash fixtures. Unknown-framework fallback tested with a synthetic project.
- **Cross-sprint test:** simulate two sprints; verify `dr_query` returns prior sprint's records; verify must-remain-green constraints carry forward; verify `dr_audit` detects drift when a later change breaks a prior test.
- **Abandon-path test:** simulate sprint abandon; verify `dr_abandon` marks all Active records as Abandoned; verify `dr_query` with `status=Active` excludes them; verify superseded-already records are skipped.
- **Concurrency test:** simulate two concurrent `dr_capture` calls; verify file-lock serializes writes; verify ID counter produces unique sequential IDs.
- **Stateless ID generation test:** populate store with records across multiple dates; verify ID generation reads the file correctly and increments per-day XXXXX sequences.

---

## Constraints

- **Independence from design phase:** no modifications to `skills/design-large-task/` or `skills/design-small-task/`. MCP at `mcp/chester-decision-record/`. No tool or state sharing with proof-mcp or understanding-mcp.
- **Validation asymmetry preserved:** LLM is not the gate. All structural enforcement (trigger coverage check, test suite pass/fail, record-test linkage verification) is at the deterministic or structural node.
- **Chester conventions respected:** util-artifact-schema for naming/paths; chester-config-read for path resolution; skill file conventions; append-only commit discipline; existing subagent dispatch patterns.
- **Flat-file scale:** per brief's accepted risk; `dr_query` filters at read time keep plan-build's consumption bounded.
- **Agent-autonomous capture:** no human-approval gate intercepts `dr_capture`; trigger fires structurally; designer reviews during spec-reviewer extension and at sprint-close audit report.

---

## Non-Goals

- **Proactive design-phase integration:** design-large-task and design-small-task do NOT invoke decision-record tools.
- **Generic ADR tooling:** the system is specific to in-flight implementation decisions with four-destination propagation.
- **Automated merge-conflict resolution across branches.**
- **Concept-level knowledge base:** the pending `solution-design-language-kb` proposal is a separate track.
- **Retroactive backfill of decision records for prior sprints.**

---

## Acceptance Criteria

### AC-1.1 — Decision records are created at ambiguity moment

**Observable boundary:**
- implementer resolves ambiguity (two valid implementations, no artifact determines) → `dr_capture` called before task completion → record exists in store with matching Trigger, Context, Options Considered, Chosen, Rationale
- implementer produces code with no uncovered observable behaviors → no record created, task proceeds normally

**Given:** execute-write runs a task whose implementer surfaces a decision ambiguity; provisioned directory `/docs/chester/decision-record/` exists (ready to host the store file)
**When:** implementer returns DONE/DONE_WITH_CONCERNS with observable-behaviors.md reporting uncovered behavior
**Then:** `dr_capture` is invoked within the same task, before spec-reviewer dispatch; record is present in `/docs/chester/decision-record/decision-record.md` with Status=Active and Test/Code fields carrying name/file:line without SHA (SHAs added later via `dr_finalize_refs`)

**Test skeleton ID:** `ac-1-1-prospective-capture`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-1.2 — Non-code tasks skip trigger check

**Observable boundary:**
- task Type = `docs-producing` or `config-producing` → trigger-check step skips skeleton-coverage diff entirely
- task Type = `code-producing` → trigger-check step runs skeleton-coverage diff

**Given:** plan assigns Type=docs-producing to a task
**When:** execute-write processes the task
**Then:** no trigger check runs; no dr_capture call; task proceeds via existing execute-write flow

**Test skeleton ID:** `ac-1-2-non-code-skip`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-2.1 — Spec-level vs plan-level discriminated structurally

**Observable boundary:**
- implementer's observable behavior covered by existing skeleton → classified plan-level → no record
- implementer's observable behavior NOT covered by any skeleton → classified spec-level → record fires

**Given:** skeleton manifest scaffolded at design-specify with one skeleton per criterion
**When:** implementer reports observable behaviors in diff
**Then:** skeleton-coverage diff produces a binary FIRE/NO_FIRE result based on skeleton presence/absence (no LLM judgment step)

**Test skeleton ID:** `ac-2-1-mechanical-discrimination`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-3.1 — Records carry full field set

**Observable boundary:**
- `dr_capture` called with all mandatory fields populated → record accepted, ID returned
- `dr_capture` called with any mandatory field missing → structured error returned, no record written

**Given:** MCP `schema.js` defines mandatory field set per RULE-6
**When:** `dr_capture` is called with an incomplete field set
**Then:** the call fails with a structured error naming the missing field(s); no record is appended; caller handles as BLOCKED

**Test skeleton ID:** `ac-3-1-field-set-mandatory`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-4.1 — Task completion blocked on suite pass including propagation test

**Observable boundary:**
- all tests pass (including new propagation-generated test) → task can be marked DONE
- any test fails (including new propagation-generated test) → task enters BLOCKED status

**Given:** a decision record fires during task execution and a new test is generated from the updated spec clause
**When:** the full test suite runs at propagation step 3
**Then:** if any test fails (new or existing), task status is BLOCKED; TodoWrite DONE marker is withheld until suite passes

**Test skeleton ID:** `ac-4-1-gate-on-suite-pass`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-4.2 — Sprint-end record-test linkage verified after suite pass (including SHA finalization)

**Observable boundary:**
- every record created this sprint has a Test field pointing to a passing test in the corpus AND the Test field carries a commit SHA (dr_finalize_refs was called) AND `execute-prove` suite passes → `execute-verify-complete` proceeds to clean-tree check
- any record's Test field is broken (test missing, failing, or SHA absent) → checkpoint commit blocked with record-ID-specific error

**Given:** `execute-verify-complete` invoked at end of sprint; `execute-prove` (Step 1) has returned suite-pass
**When:** `dr_verify_tests(current_sprint)` runs (new Step 2)
**Then:** for each record, verify test exists, test passes, AND `sha_finalized: true` in the per_record response; if any record fails any of those three checks, verify-complete BLOCKS with structured error listing record IDs; no clean-tree check or checkpoint commit until resolved; the sha_finalized check structurally enforces that `dr_finalize_refs` was called after each task's commit

**Test skeleton ID:** `ac-4-2-sprint-end-linkage`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-5.1 — Backward reach via failing tests on earlier-task code

**Observable boundary:**
- new propagation-generated test fails against earlier-task code → existing BLOCKED-status handling fires → implementer re-dispatched to fix
- new propagation-generated test passes on all code including earlier-task files → no backward reach needed

**Given:** Task 3 fires a decision record updating spec clause previously implemented by Task 1
**When:** the spec-driven test generated from the updated clause runs
**Then:** if Task 1's code violates the updated clause, the test fails; existing BLOCKED-status handling fires; implementer subagent is dispatched scoped to Task 1's files; subagent revises code; suite re-runs; passes

**Test skeleton ID:** `ac-5-1-backward-reach`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-5.2 — Spec-driven test generation (not code-driven)

**Observable boundary:**
- test-generator subagent receives updated spec clause + skeleton manifest + existing spec as context → generates test asserting spec behavior
- test-generator subagent does NOT receive implementer's code or existing test code → prevents TDD inversion

**Given:** propagation step 2 invoked after spec clause updated
**When:** test-generator subagent dispatched per `test-generator.md`
**Then:** subagent's context window contains only the updated spec clause, the skeleton manifest, and the existing spec; generated test asserts clause behavior

**Test skeleton ID:** `ac-5-2-spec-driven-generation`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-6.1 — Persistent store at /docs/chester/decision-record/decision-record.md

**Observable boundary:**
- production default: `dr_capture` writes to `/docs/chester/decision-record/decision-record.md` (file inside the provisioned directory at `/docs/chester/decision-record/`)
- `storePath` override (constructor argument to `store.js`, or `CHESTER_DECISION_RECORD_PATH` env var for the MCP server): writes go to the override path
- lockfile resides at `{storePath}.lock`; no other sidecar files
- tests MUST use the override

**Given:** MCP `store.js` takes `storePath`; production default is the directory+file path above; sprint test suite passes per-test temp path via the override
**When:** any MCP tool is invoked with record-writing intent
**Then:** production invocations write to `/docs/chester/decision-record/decision-record.md`; test invocations write only to temp paths; the production store file is created if absent on first call; the directory itself is pre-provisioned and never removed by this sprint's setup

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-7.1 — Append-only supersede + SHA-only finalize

**Observable boundary:**
- `dr_supersede(old_id, new_id)` sets `Status=Superseded` and `Superseded By=new_id` on old record; sets `Supersedes=old_id` on new record; neither body is rewritten
- `dr_finalize_refs(record_id, test_sha, code_sha)` appends SHA to Test and/or Code fields ONLY; no other field is modified; re-call with same SHAs is idempotent; re-call with different SHAs is rejected
- attempt to delete or rewrite arbitrary record body content → rejected by store.js

**Given:** record A exists with Status=Active and an unfinalized Test field (test name only, no SHA)
**When:** `dr_supersede(A, B)` is called where B is a newly captured record, then `dr_finalize_refs(A, test_sha=X, code_sha=Y)` is called
**Then:** A retains its body unchanged except: Status becomes Superseded; Superseded By = B's ID; Test field becomes `{test name} @ X`; Code field becomes `{file:line} @ Y`. B's Supersedes = A's ID. No other field on A is modified.

**Test skeleton ID:** `ac-7-1-append-only-supersede`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-8.1 — plan-build populates Prior Decisions from dr_query

**Observable boundary:**
- `dr_query` returns one or more matching records → plan-build's plan header contains `## Prior Decisions` section listing them with must-remain-green test IDs
- `dr_query` returns empty → `## Prior Decisions` section with body "None"

**Given:** plan-build invoked for a new sprint; some prior sprint's records match the current sprint's subject
**When:** plan-build's plan-start step runs
**Then:** `dr_query(sprint_subject=..., status=Active)` is called; results populate Prior Decisions section in plan header; each record's test IDs become inputs to Must-remain-green lists for tasks touching the record's Code files

**Test skeleton ID:** `ac-8-1-plan-build-consultation`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-9.1 — Test-skeleton mechanical discriminator (language-aware)

**Observable boundary:**
- design-specify scaffolds one language-appropriate skeleton stub per AC at spec-write time → stub files exist in the project's test directory; manifest at `spec/{sprint-name}-spec-skeleton-00.md` indexes them
- execute-write's trigger check reads manifest for coverage diff → FIRE/NO_FIRE decision is structural

**Given:** design-specify writes spec with N acceptance criteria in a project with `Cargo.toml` / `package.json` / `pyproject.toml` / bash-only
**When:** design-specify's spec-write phase completes
**Then:** N skeleton stubs exist in the test framework's expected location; each stub contains the criterion's observable-boundary declaration as a doc comment; the skeleton manifest lists all N stubs with their IDs and paths

**Test skeleton ID:** `ac-9-1-skeleton-scaffolding`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-10.1 — Direct store, no promotion step

**Observable boundary:**
- record captured mid-sprint → present in store immediately, Status=Active
- no sprint-close curation / promotion / distillation step exists in any skill

**Given:** `dr_capture` called during execute-write task
**When:** the call returns
**Then:** record is visible in `/docs/chester/decision-record/decision-record.md` immediately; no intermediate location; no sprint-close promotion step required for queryability

**Test skeleton ID:** `ac-10-1-direct-store`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-10.2 — plan-build filters at read time

**Observable boundary:**
- `dr_query(filter)` applies filter parameters at read → returns only matching records
- plan-build does not read the entire store

**Given:** decision store contains records from many prior sprints
**When:** plan-build calls `dr_query` with a narrow filter
**Then:** returned set is bounded by filter; out-of-filter store contents are not loaded into plan-build's context

**Test skeleton ID:** `ac-10-2-filter-at-read`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-11.1 — Abandoned-sprint records transition to Abandoned (Superseded preserved)

**Observable boundary:**
- `dr_abandon(sprint)` sets `Status=Abandoned` on records with matching Sprint field AND `Status=Active`
- records with `Status=Superseded` are not rewritten (Superseded is terminal)
- `dr_query` with `status=Active` filter excludes Abandoned records

**Given:** sprint is closed via abandon path in `finish-write-records`; sprint has mixed-status records (some Active, some Superseded)
**When:** `dr_abandon(sprint_name)` is called
**Then:** Active records transition to Abandoned; Superseded records stay Superseded; return value reports `affected` count and `skipped_superseded` count; future `dr_query(status=Active)` excludes them all

**Test skeleton ID:** `ac-11-1-abandon-path`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-12.1 — Independence from design phase preserved

**Observable boundary:**
- no file under `skills/design-large-task/` or `skills/design-small-task/` is modified by this sprint
- no MCP tool registered under this sprint is referenced by design-phase skills
- decision-record MCP's state file at `/docs/chester/decision-record/decision-record.md` is disjoint from proof/understanding MCP state paths

**Given:** sprint implementation complete
**When:** repository state is inspected
**Then:** design-large-task and design-small-task directories have no diff; `.claude-plugin/mcp.json` has three MCP entries with disjoint server paths and tool namespaces

**Test skeleton ID:** `ac-12-1-independence-preserved`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

## Cross-Reference Table

Mapping brief NCs / rules / risks to spec ACs and components:

| Brief element | Addressed by | Acceptance criterion |
|---|---|---|
| NC-1 (prospective capture) | execute-write new trigger-check step + `dr_capture` MCP tool | AC-1.1 |
| NC-2 (mechanical discrimination) | skeleton-coverage diff + `skeleton-generator.md` | AC-2.1 |
| NC-3 (full field set) | `schema.js` + implementer `observable-behaviors.md` | AC-3.1 |
| NC-4 (blocking gate) | propagation procedure + `dr_verify_tests` | AC-4.1, AC-4.2 |
| NC-5 (retroactive reach) | propagation spec-driven test + existing BLOCKED handling | AC-5.1, AC-5.2 |
| NC-6 (store location) | `store.js` default `storePath` → `/docs/chester/decision-record/decision-record.md` (provisioned directory + file) | AC-6.1 |
| NC-7 (append-only supersede) | `dr_supersede` MCP tool | AC-7.1 |
| NC-8 (plan-build consultation) | plan-build plan-start step + `dr_query` | AC-8.1 |
| NC-9 (test-skeleton discriminator) | `skeleton-generator.md` + language-aware scaffolding | AC-9.1 |
| NC-10 (direct store, filter at read) | `dr_capture` direct write + `dr_query` filter | AC-10.1, AC-10.2 |
| Rule: store location | `store.js` hardcoded path | AC-6.1 |
| Rule: prior-art anchor | design derivation (non-testable) | (none — design-level rule) |
| Rule: problem statement | Goal section | (none — narrative) |
| Rule: both altitudes | within-sprint (execute-write) + cross-sprint (plan-build) | AC-1.1 + AC-8.1 |
| Rule: ID format | `store.js` stateless ID generation | AC-6.1 + AC-7.1 |
| Rule: field set mandatory | `schema.js` | AC-3.1 |
| Rule: agent-autonomous capture | `execute-write` new trigger-check step (no human gate) | AC-1.1 |
| Risk: flat-file scale | `dr_query` filter at read + Non-Goals | (none — accepted risk) |
| Risk: abandoned-sprint accumulation | `dr_abandon` + Status=Abandoned filter | AC-11.1 |
| Constraint: independence from design phase | all file locations outside `skills/design-*/` | AC-12.1 |

Every NC and every testable rule/risk has at least one AC. Narrative rules (problem statement, prior-art anchor) and accepted risks (flat-file scale) have no AC by design — they're not structurally testable in the sprint itself.
