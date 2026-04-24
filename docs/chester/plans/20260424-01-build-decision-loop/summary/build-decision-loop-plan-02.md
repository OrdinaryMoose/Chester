# Plan: Decision-Record / Constraint-Triangle System

**Sprint:** 20260424-01-build-decision-loop
**Spec:** `docs/chester/working/20260424-01-build-decision-loop/spec/build-decision-loop-spec-05.md`
**Plan revision:** 02 — addresses plan-level plan-smell findings; realigned to spec-05:
- **Task 1** reads proof-mcp's current `package.json` at runtime instead of hardcoding versions (finding #8).
- **Task 3** picks `proper-lockfile` as the file-lock strategy and declares the Store class explicitly stateful (holds lock-holder reference; no cached state beyond that) (findings #4, #5).
- **New Task 4.5** updates `util-artifact-schema` to canonicalize the skeleton manifest path as a named artifact type (finding #2 partial resolution — cross-skill implicit contract made explicit).
- **Task 9** placement reaffirmed at Section 2.1 step insertion per spec-04/spec-05. Plan-smell's Section 2.2 promotion recommendation (finding #3) was reviewed and declined in spec-05 revision notes; no Task 9 body change from plan-01.
- **Task 13** split into four focused integration scripts (capture-finalize, supersede, abandon, cross-sprint) plus a shared fixtures helper plus an AC-mapping verifier, per spec-05 §Testing Strategy (findings #6, #7).

**Plan-smell finding #1 disposition (Test/Code composite-string format):** documented in spec-05 revision notes as deferred cosmetic smell; structured sub-field upgrade tracked as future work; schema + audit tooling handle the composite form correctly in scope. No plan-02 action required.

Prior revisions:
- 01 addressed plan-attack findings by realigning to spec-04: Task 1 no longer removes store directory (pre-provisioned); MCP tests use `vitest` + `__tests__/` subdir per Chester convention; `dr_finalize_refs` tool added to server surface (7 tools total); `store.js` takes `storePath` parameter; tests override to temp paths; execute-write step includes post-commit `dr_finalize_refs` call; integration test verifies SHA-finalization.

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox syntax for tracking.

## Goal

Implement the decision-record / constraint-triangle system per spec-05: new MCP at `mcp/chester-decision-record/` with seven tools (including `dr_finalize_refs`), persistent store at `/docs/chester/decision-record/decision-record.md`, four new reference files, loop-integration edits to six existing skills, and integration tests split by concern.

## Architecture

Test-execution-driven loop (Loop C + five strengthening modifications), inherited from spec-03. Structural enforcement at the code-test boundary. MCP holds data discipline; existing skills hold orchestration via in-place extensions.

## Tech Stack

- Node.js (ES modules) — MCP server runtime
- `@modelcontextprotocol/sdk` — stdio transport + tool dispatch
- Bash — integration tests per Chester convention
- Markdown — all skill/reference files + persistent store

## Prior Decisions

*(populated by plan-build via `dr_query` at plan-start; filter: sprint-subject match OR shared-component match, status=Active)*

**None.** This is the first sprint implementing the decision-record system itself; the store does not yet exist. Future sprints will inherit prior decisions via `dr_query` at plan-start.

---

## Task 1: Setup — scaffold MCP package (directory pre-provisioned)

**Type:** config-producing
**Implements:** AC-6.1 (setup precondition)
**Decision budget:** 0
**Must remain green:** —

**Files:**
- Verify-exists (do NOT delete): `docs/chester/decision-record/` (pre-provisioned empty directory; stays put per spec-04 designer confirmation)
- Create: `mcp/chester-decision-record/package.json`
- Create: `tests/test-decision-record-setup.sh`

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/test-decision-record-setup.sh` verifying: (a) `docs/chester/decision-record/` exists AS a directory (pre-provisioned); (b) `mcp/chester-decision-record/` exists with `package.json` declaring `"type": "module"`, `@modelcontextprotocol/sdk` dependency, AND `vitest` devDependency matching the version used in `skills/design-large-task/proof-mcp/package.json` (^3.1.1)
- [ ] **Step 2:** Run `bash tests/test-decision-record-setup.sh` → Expected: FAIL (mcp scaffold missing)
- [ ] **Step 3:** `mkdir -p mcp/chester-decision-record`; read current `skills/design-large-task/proof-mcp/package.json` dynamically to inherit current `@modelcontextprotocol/sdk` and `vitest` versions (avoids hardcoded-version staleness); write new `package.json` with `type=module`, test scripts `"test": "vitest run"`, and the same dep/devDep versions as proof-mcp. Add `proper-lockfile` as a production dependency for the store's file-locking (see Task 3).
- [ ] **Step 4:** Re-run test → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add mcp/chester-decision-record/package.json tests/test-decision-record-setup.sh
git commit -m "chore: scaffold chester-decision-record MCP package"
```

---

## Task 2: Implement schema.js — field-set validation (capture vs finalize phases)

**Type:** code-producing
**Implements:** AC-3.1
**Decision budget:** 1 (phase-aware validation design)
**Must remain green:** Task 1 setup test

**Files:**
- Create: `mcp/chester-decision-record/schema.js`
- Create: `mcp/chester-decision-record/__tests__/schema.test.js`

**Steps (TDD):**
- [ ] **Step 1:** Write `__tests__/schema.test.js` (vitest) asserting: (a) `validate(fullRecord, {phase: "capture"})` with Test = "test_name" (no SHA) returns `{ok: true, errors: []}`; (b) `validate(recordMissingTrigger, {phase: "capture"})` returns `{ok: false, errors: [{field: "trigger", ...}]}`; (c) `validate(record, {phase: "finalize"})` requires Test field to carry `{name} @ {sha}` format; (d) unknown field returns error (ref skeleton `ac-3-1-field-set-mandatory`)
- [ ] **Step 2:** Run `npm test --prefix mcp/chester-decision-record` → Expected: FAIL
- [ ] **Step 3:** Implement `schema.js` exporting `validate(record, {phase})` — at capture, all 15 fields mandatory except SHA portions of Test/Code; at finalize, SHA portions required; accept "none" with justification in Spec Update/Supersedes/Superseded By
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add mcp/chester-decision-record/schema.js mcp/chester-decision-record/__tests__/schema.test.js
git commit -m "feat: implement decision-record schema validation with phase-aware rules (NC-3, AC-3.1)"
```

---

## Task 3: Implement store.js — append, ID generation, supersede, abandon, status transitions

**Type:** code-producing
**Implements:** AC-6.1, AC-7.1, AC-10.1, AC-11.1
**Decision budget:** 2 (ID-counter stateless-scan format; file-lock approach)
**Must remain green:** `test-setup.sh`, `test-schema.js`

**Files:**
- Create: `mcp/chester-decision-record/store.js`
- Create: `mcp/chester-decision-record/__tests__/store.test.js`

**Steps (TDD):**
- [ ] **Step 1:** Write `__tests__/store.test.js` (vitest) asserting (ALL tests use `storePath` override to a per-test temp file — tests MUST NOT write to the production path):
  - `new Store({storePath: tmpFile}).append(record)` writes to the tmp file, creates file if absent (ref skeletons `ac-6-1-store-location`, `ac-10-1-direct-store`)
  - `store.nextId()` scans file for today's max XXXXX and returns incremented; first record of day returns `YYYYMMDD-00001`
  - `store.supersede(oldId, newId)` sets old Status=Superseded and Superseded By=newId; sets new Supersedes=oldId; old body unchanged except supersede-link fields (ref skeleton `ac-7-1-append-only-supersede`)
  - `store.finalizeRefs(recordId, {test_sha, code_sha})` appends SHA to Test and/or Code fields; idempotent on same SHAs; rejects re-call with different SHAs; only Test/Code fields mutated (ref skeleton extends `ac-7-1-append-only-supersede`)
  - `store.abandon(sprint)` returns `{affected, skipped_superseded}` (ref skeleton `ac-11-1-abandon-path`)
  - `store.query(filter)` applies `sprint_subject`, `tags`, `status`, `recency_days`, `criterion_id` filters (ref skeleton `ac-10-2-filter-at-read`)
  - Concurrent `append` via two Store instances pointing at same tmp file: file-lock serializes; no interleaved writes
  - Default `storePath` when unset: constructor resolves to `/docs/chester/decision-record/decision-record.md`
- [ ] **Step 2:** Run `npm test --prefix mcp/chester-decision-record` → Expected: FAIL
- [ ] **Step 3:** Implement `store.js` exporting a `Store` class.

  **Class shape (plan-smell finding #4 resolution):** the Store class is explicitly stateful. Its state holds the lock-holder reference returned by `proper-lockfile` during the read-increment-append sequence. It does NOT cache file content, read position, or record indices — scans happen fresh per operation. Rationale: statefulness is justified only by the lock mechanism; no performance optimization yet. If a future sprint needs caching, it extends state explicitly.

  **File-lock strategy (plan-smell finding #5 resolution):** use `proper-lockfile` npm package, pinned to the same version proof-mcp uses if proof-mcp adopts it, else latest stable. Rationale: better-tested than manual `O_EXCL` approach; handles stale-lock detection via PID liveness check; cross-platform.

  **Constructor:** accepts `{storePath}` option; default `/docs/chester/decision-record/decision-record.md`.

  **Methods:** `append`, `nextId`, `supersede`, `finalizeRefs`, `abandon`, `query`.

  **ID generation:** scans existing file for `## Decision YYYYMMDD-XXXXX` headings matching today's date.
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add mcp/chester-decision-record/store.js mcp/chester-decision-record/test-store.js
git commit -m "feat: implement decision-record store operations (NC-6/7/10/11; AC-6.1, AC-7.1, AC-10.1, AC-11.1)"
```

---

## Task 4: Implement server.js — MCP tool dispatch (seven tools)

**Type:** code-producing
**Implements:** AC-1.1 (via dr_capture), AC-3.1 (via schema enforcement), AC-4.2 (via dr_verify_tests), AC-6.1, AC-7.1, AC-10.1, AC-10.2, AC-11.1
**Decision budget:** 2 (tool error convention + dr_finalize_refs integration with store.js)
**Must remain green:** setup test, schema test, store test

**Files:**
- Create: `mcp/chester-decision-record/server.js`
- Create: `mcp/chester-decision-record/__tests__/server.test.js`

**Steps (TDD):**
- [ ] **Step 1:** Write `__tests__/server.test.js` (vitest) — MCP integration: spawn server via stdio pointing at a temp `CHESTER_DECISION_RECORD_PATH`; test each of seven tools:
  - `dr_capture` with full field set (Test = name only, Code = file:line only) → `{id, status: "accepted"}`
  - `dr_finalize_refs(id, test_sha, code_sha)` → accepted; re-call with same SHAs → accepted (idempotent); re-call with different SHAs → `{status: "error", errors: [...]}`
  - `dr_query({status: "Active"})` → records matching filter
  - `dr_supersede(oldId, newId)` → accepted; old record Status=Superseded
  - `dr_abandon(sprint)` → `{affected, skipped_superseded}`
  - `dr_verify_tests(sprint)` → per_record includes `sha_finalized: bool`; aggregate fails if any record has sha_finalized=false
  - `dr_audit` → drift report with `sha-missing` findings for unfinalized records
- [ ] **Step 2:** Run → Expected: FAIL
- [ ] **Step 3:** Implement `server.js` using `@modelcontextprotocol/sdk`: register seven tools; resolve `storePath` from `CHESTER_DECISION_RECORD_PATH` env var with production default; instantiate `Store` once; delegate to `schema.js` and `store.js`; return typed shapes per spec-04 §Return shapes
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add mcp/chester-decision-record/server.js mcp/chester-decision-record/test-server.js
git commit -m "feat: implement decision-record MCP server with 6 tools (NC-1/8)"
```

---

## Task 4.5: Update util-artifact-schema with skeleton manifest path convention

**Type:** docs-producing
**Implements:** AC-9.1 (supports the discriminator mechanism by making the cross-skill path explicit)
**Decision budget:** 0
**Must remain green:** prior tests

**Files:**
- Modify: `skills/util-artifact-schema/SKILL.md`
- Create: `tests/test-skeleton-manifest-path-convention.sh`

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/test-skeleton-manifest-path-convention.sh` asserting: `util-artifact-schema/SKILL.md` documents `spec-skeleton` as a new artifact type under `spec/` with filename `{sprint-name}-spec-skeleton-{nn}.md`; documents that `design-specify` produces it and `execute-write` consumes it
- [ ] **Step 2:** Run → Expected: FAIL
- [ ] **Step 3:** Add `spec-skeleton` row to util-artifact-schema's Artifact Types table: directory=`spec/`, purpose=skeleton manifest indexing test skeletons by criterion ID, produced-by=`design-specify`, consumed-by=`execute-write`
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add skills/util-artifact-schema/SKILL.md tests/test-skeleton-manifest-path-convention.sh
git commit -m "docs: canonicalize skeleton manifest path in util-artifact-schema (plan-smell finding #2)"
```

**Rationale (plan-smell #2):** the skeleton manifest path was an implicit cross-skill convention shared between `design-specify` (producer) and `execute-write` (consumer). Moving it into `util-artifact-schema` makes the contract explicit; future refactors to the convention require a single change in the canonical source, not coordinated edits across two skills.

---

## Task 5: Register MCP in .claude-plugin/mcp.json

**Type:** config-producing
**Implements:** AC-12.1 (independence via separate MCP entry)
**Decision budget:** 0
**Must remain green:** all prior tests

**Files:**
- Modify: `.claude-plugin/mcp.json`
- Create: `tests/test-decision-record-registration.sh`

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/test-decision-record-registration.sh` asserting: `jq` returns `chester-decision-record` entry from `.claude-plugin/mcp.json` with command=`node` and args pointing to `${CLAUDE_PLUGIN_ROOT}/mcp/chester-decision-record/server.js` (ref skeleton `ac-12-1-independence-preserved`)
- [ ] **Step 2:** Run → Expected: FAIL
- [ ] **Step 3:** Add entry to `.claude-plugin/mcp.json`:
```json
"chester-decision-record": {
  "command": "node",
  "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/chester-decision-record/server.js"]
}
```
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add .claude-plugin/mcp.json tests/test-decision-record-registration.sh
git commit -m "chore: register chester-decision-record MCP (AC-12.1)"
```

---

## Task 6: Create four new reference files

**Type:** docs-producing
**Implements:** AC-5.2 (test-generator.md), AC-9.1 (skeleton-generator.md)
**Decision budget:** 1 (level of template detail)
**Must remain green:** all prior tests

**Files:**
- Create: `skills/design-specify/references/spec-template.md`
- Create: `skills/design-specify/references/skeleton-generator.md`
- Create: `skills/execute-write/references/propagation-procedure.md`
- Create: `skills/execute-write/references/test-generator.md`

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/test-reference-files.sh` asserting: (a) each of the four files exists; (b) spec-template.md contains `## Acceptance Criteria` + `### AC-{N.M}` + `**Observable boundary:**` markers; (c) skeleton-generator.md documents Rust/TypeScript/Python/Bash stubs and detection rules; (d) propagation-procedure.md documents three-step sequence with "spec-clause update" / "spec-driven test generation" / "full suite run" keywords; (e) test-generator.md declares input context restriction (spec-only, not code)
- [ ] **Step 2:** Run → Expected: FAIL (files don't exist)
- [ ] **Step 3:** Author all four files per spec-03 §Components §New Reference Files
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add skills/design-specify/references/spec-template.md skills/design-specify/references/skeleton-generator.md skills/execute-write/references/propagation-procedure.md skills/execute-write/references/test-generator.md tests/test-reference-files.sh
git commit -m "feat: add four new reference files for decision-record loop (NC-5/9; AC-5.2, AC-9.1)"
```

---

## Task 7: Modify design-specify for skeleton scaffolding

**Type:** docs-producing
**Implements:** AC-9.1
**Decision budget:** 1
**Must remain green:** reference-files test

**Files:**
- Modify: `skills/design-specify/SKILL.md`

**Steps (TDD):**
- [ ] **Step 1:** Extend `tests/test-reference-files.sh` to assert: `skills/design-specify/SKILL.md` contains "Scaffold test skeletons" + references to `skeleton-generator.md` and the canonicalized manifest path in `util-artifact-schema` (the `spec-skeleton` artifact type added in Task 4.5), not a hardcoded path
- [ ] **Step 2:** Run → Expected: FAIL
- [ ] **Step 3:** Edit `design-specify/SKILL.md` Writing-the-Spec section to add skeleton-scaffolding step per spec-04 §Modified Existing Skills; reference `skeleton-generator.md`, `spec-template.md`, and `util-artifact-schema`'s `spec-skeleton` artifact type for the manifest path
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add skills/design-specify/SKILL.md tests/test-reference-files.sh
git commit -m "feat: design-specify scaffolds test skeletons at spec time (NC-9; AC-9.1)"
```

---

## Task 8: Modify plan-build SKILL.md + replace plan-template.md with loop-optimized format

**Type:** docs-producing
**Implements:** AC-8.1, AC-10.2
**Decision budget:** 2 (backward-compat with existing plans, template change scope)
**Must remain green:** prior tests

**Files:**
- Modify: `skills/plan-build/SKILL.md`
- Modify: `skills/plan-build/references/plan-template.md`

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/test-plan-build-update.sh` asserting: `plan-build/SKILL.md` references `dr_query` call at plan-start; `plan-template.md` contains `## Prior Decisions` section with populated-by-dr_query note; plan-template contains `**Type:**`, `**Implements:**`, `**Decision budget:**`, `**Must remain green:**` fields in Task block (ref skeletons `ac-8-1-plan-build-consultation`, `ac-10-2-filter-at-read`)
- [ ] **Step 2:** Run → Expected: FAIL
- [ ] **Step 3:** Update `plan-build/SKILL.md` per spec-03 §Modified Existing Skills; replace `plan-template.md` with loop-optimized template per spec-03 §Plan Document Format (Loop-Optimized)
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add skills/plan-build/SKILL.md skills/plan-build/references/plan-template.md tests/test-plan-build-update.sh
git commit -m "feat: plan-build consults decision store + loop-optimized plan template (NC-8/10; AC-8.1, AC-10.2)"
```

---

## Task 9: Modify execute-write SKILL.md + implementer + spec-reviewer templates

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.2, AC-2.1, AC-4.1, AC-5.1, AC-5.2
**Decision budget:** 2 (step numbering in Section 2.1; dr_finalize_refs insertion point)
**Must remain green:** prior tests

**Files:**
- Modify: `skills/execute-write/SKILL.md`
- Modify: `skills/execute-write/references/implementer.md`
- Modify: `skills/execute-write/references/spec-reviewer.md`

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/test-execute-write-update.sh` asserting:
  - `execute-write/SKILL.md` Section 2.1 contains a "Decision-Record Trigger Check and Propagation" step
  - That step documents: (a) skip for non-code tasks; (b) skeleton-coverage diff; (c) `dr_capture` on FIRE; (d) propagation per propagation-procedure.md; (e) post-commit `dr_finalize_refs(record_id, test_sha, code_sha)` call before task DONE
  - SKILL.md Red Flags contains trigger-check entry
  - `implementer.md` self-check requires `observable-behaviors.md` artifact with canonical form
  - `spec-reviewer.md` adds record-alignment verification (Spec Update field matches spec clause; Test field has SHA finalized)
  - (ref skeletons `ac-1-1-prospective-capture`, `ac-1-2-non-code-skip`, `ac-2-1-mechanical-discrimination`, `ac-4-1-gate-on-suite-pass`, `ac-5-1-backward-reach`, `ac-5-2-spec-driven-generation`)
- [ ] **Step 2:** Run → Expected: FAIL
- [ ] **Step 3:** Apply spec-04 edits: insert new numbered step in Section 2.1 between current steps 2 and 3 (renumber subsequent steps); include the five sub-bullets above; add Red Flags entry; update `implementer.md` and `spec-reviewer.md` per spec-04
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add skills/execute-write/SKILL.md skills/execute-write/references/implementer.md skills/execute-write/references/spec-reviewer.md tests/test-execute-write-update.sh
git commit -m "feat: execute-write trigger-check + propagation gate (NC-1/2/4/5; AC-1.1, AC-1.2, AC-2.1, AC-4.1, AC-5.1)"
```

---

## Task 10: Modify execute-verify-complete for dr_verify_tests

**Type:** docs-producing
**Implements:** AC-4.2
**Decision budget:** 1 (insertion order between existing Step 1 suite-pass and Step 2 clean-tree)
**Must remain green:** prior tests

**Files:**
- Modify: `skills/execute-verify-complete/SKILL.md`

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/test-execute-verify-complete-update.sh` asserting: SKILL.md contains new step invoking `dr_verify_tests(current_sprint)` inserted AFTER existing Step 1 (execute-prove suite pass) and BEFORE existing Step 2 (clean-tree check); BLOCK behavior on record-test failure is documented (ref skeleton `ac-4-2-sprint-end-linkage`)
- [ ] **Step 2:** Run → Expected: FAIL
- [ ] **Step 3:** Insert new step per spec-03 §Modified Existing Skills; document rationale for insertion order
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add skills/execute-verify-complete/SKILL.md tests/test-execute-verify-complete-update.sh
git commit -m "feat: execute-verify-complete checks record-test linkage (NC-4; AC-4.2)"
```

---

## Task 11: Modify finish-write-records for dr_audit + dr_abandon

**Type:** docs-producing
**Implements:** AC-11.1
**Decision budget:** 1 (abandon-path detection — user-confirmed vs signal-based)
**Must remain green:** prior tests

**Files:**
- Modify: `skills/finish-write-records/SKILL.md`

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/test-finish-write-records-update.sh` asserting: SKILL.md Feature Mode contains `dr_audit` invocation at sprint-close normal path and `dr_abandon` invocation at abandon path; "Decision-Record Audit" section included in session-summary output spec (ref skeleton `ac-11-1-abandon-path`)
- [ ] **Step 2:** Run → Expected: FAIL
- [ ] **Step 3:** Apply spec-03 edits to `finish-write-records/SKILL.md` Feature Mode
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add skills/finish-write-records/SKILL.md tests/test-finish-write-records-update.sh
git commit -m "feat: finish-write-records runs dr_audit + dr_abandon (AC-11.1)"
```

---

## Task 12: Update setup-start skill-index with new MCP reference

**Type:** docs-producing
**Implements:** AC-12.1 (visibility)
**Decision budget:** 0
**Must remain green:** prior tests

**Files:**
- Modify: `skills/setup-start/references/skill-index.md`

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/test-skill-index-update.sh` asserting: `skills/setup-start/references/skill-index.md` contains one-line reference to `chester-decision-record` MCP and its role (capture/propagation/persistence)
- [ ] **Step 2:** Run → Expected: FAIL
- [ ] **Step 3:** Add entry per spec-03 §Modified Existing Skills
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add skills/setup-start/references/skill-index.md tests/test-skill-index-update.sh
git commit -m "chore: register decision-record MCP in skill-index (AC-12.1)"
```

---

## Task 13: End-to-end integration tests (split by concern)

**Type:** code-producing
**Implements:** AC-12.1 (full-system verification), cross-cutting verification for AC-1.1, AC-3.1, AC-4.1, AC-4.2, AC-5.1, AC-5.2, AC-7.1, AC-8.1, AC-10.2, AC-11.1
**Decision budget:** 2 (fixture-helper interface surface — env-only vs sourced functions; AC-mapping verifier parser — spec-grep vs structured list)
**Must remain green:** all prior tests

Per spec-05 §Testing Strategy, integration tests are split into four focused scripts plus a shared fixtures helper plus an AC-mapping verifier. Each script isolates one concern so a failure attributes cleanly to one NC/Rule family. All scripts use `CHESTER_DECISION_RECORD_PATH` pointing at a per-test temp file; none write to the production store.

**Files:**
- Create: `tests/test-decision-record-shared-fixtures.sh` — sourced helper; provides `dr_mock_sprint()`, `dr_temp_store_init()`, `dr_cleanup()`. Not run standalone.
- Create: `tests/test-decision-record-capture-finalize.sh` — capture path + schema-phase validation + `dr_finalize_refs` idempotence + `dr_verify_tests` SHA-presence gate. AC-1.1, AC-3.1, AC-4.1, AC-4.2.
- Create: `tests/test-decision-record-supersede.sh` — append-only supersede chain + bidirectional back-links. AC-7.1.
- Create: `tests/test-decision-record-abandon.sh` — Active → Abandoned; Superseded preserved. AC-11.1.
- Create: `tests/test-decision-record-cross-sprint.sh` — two-sprint simulation + `dr_query` filter + must-remain-green carry-forward + `dr_audit` drift detection. AC-5.1, AC-5.2, AC-8.1, AC-10.2.
- Create: `tests/test-decision-record-ac-mapping.sh` — verifies every spec-05 AC ID is exercised by at least one of the four scripts above. Guards against silent AC orphans.

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/test-decision-record-shared-fixtures.sh` first — the helper other scripts depend on. Exports: `dr_mock_sprint <sprint-name>` (creates mock sprint dir with minimal spec + two ACs + skeleton manifest), `dr_temp_store_init` (sets `CHESTER_DECISION_RECORD_PATH` to a per-test temp file; trap-cleanup on exit), `dr_cleanup` (removes temp artifacts). Assert file is `source`-able without side effects when not invoked.
- [ ] **Step 2:** Write `tests/test-decision-record-capture-finalize.sh` — sources fixtures. Simulates Task 1 with no ambiguity → NO_FIRE; task DONE. Simulates Task 2 surfacing spec-level ambiguity → FIRE → `dr_capture` with Test=name-only, Code=file:line-only → spec updated → new test generated from clause → full suite passes (after backward-reach fix if needed) → task commits → `dr_finalize_refs(record_id, test_sha, code_sha)` → record now SHA-finalized. Verifies: temp store contains record with full field set; `dr_verify_tests` returns pass; idempotent re-call with same SHAs; mismatch rejection.
- [ ] **Step 3:** Write `tests/test-decision-record-supersede.sh` — seeds store with a captured record; invokes `dr_supersede <old_id> <new_body>`; asserts append-only semantics (old record still present; new record links to old; old record has forward-link to new); verifies chain traversal both directions.
- [ ] **Step 4:** Write `tests/test-decision-record-abandon.sh` — seeds store with mixed Active and Superseded records; invokes `dr_abandon <sprint-name>`; asserts Active → Abandoned; Superseded records unchanged; count-of-skipped returned.
- [ ] **Step 5:** Write `tests/test-decision-record-cross-sprint.sh` — simulates sprint A producing a record; simulates sprint B starting `plan-build`; asserts `dr_query` returns sprint A's record with filter applied; asserts must-remain-green constraint carried forward; modifies code under test in sprint B to break prior test; asserts `dr_audit` detects drift.
- [ ] **Step 6:** Write `tests/test-decision-record-ac-mapping.sh` — greps spec-05 for `### AC-` headers to extract AC ID list; greps the four scripts above for each AC ID; fails if any AC is not referenced. Output: mapping table + missing-coverage list.
- [ ] **Step 7:** Run all six → Expected: FAIL initially (implementation not complete).
- [ ] **Step 8:** Adjust orchestration and fix any integration gaps surfaced.
- [ ] **Step 9:** Re-run all six → Expected: PASS.
- [ ] **Step 10:** Commit
```bash
git add tests/test-decision-record-shared-fixtures.sh \
        tests/test-decision-record-capture-finalize.sh \
        tests/test-decision-record-supersede.sh \
        tests/test-decision-record-abandon.sh \
        tests/test-decision-record-cross-sprint.sh \
        tests/test-decision-record-ac-mapping.sh
git commit -m "test: split decision-record integration tests by concern + AC-mapping verifier"
```

---

## Changes from plan-00 to plan-02 (summary)

**plan-01 (from plan-attack findings):**
- Task 1: no longer removes store directory; scaffolds package.json with vitest devDep
- Tasks 2/3/4: tests under `__tests__/` subdir with `.test.js` suffix; vitest runner; tests use `storePath` override / `CHESTER_DECISION_RECORD_PATH` env var
- Task 3: `store.js` exports a `Store` class with `storePath` option; adds `finalizeRefs` method
- Task 4: server surface grows to seven tools (`dr_finalize_refs` added)
- Task 9: execute-write step includes post-commit `dr_finalize_refs` call
- Task 13: integration test uses env-var override; verifies SHA-finalization

**plan-02 (from plan-smell findings; authorized by spec-05):**
- Task 1: reads proof-mcp's current package.json at runtime for versions (no hardcoded snapshot)
- Task 3: Store class declared explicitly stateful (lock-holder state only); file-lock strategy pinned to `proper-lockfile`
- **New Task 4.5:** canonicalizes skeleton-manifest path in `util-artifact-schema` (cross-skill convention made explicit)
- Task 7: design-specify references the canonical manifest-path from util-artifact-schema
- Task 9: placement reaffirmed at Section 2.1 step insertion per spec-04/spec-05 (plan-smell Section 2.2 promotion recommendation was reviewed and declined in spec-05 — reasoning: trigger-check belongs in-sequence with other per-task dispatch steps; peer-section detaches from task flow without clarifying responsibility). No body change from plan-01.
- Task 13: split into four focused integration scripts + shared fixtures helper + AC-mapping verifier, per spec-05 §Testing Strategy.

**Plan-smell finding #1 disposition (Test/Code composite-string format):** documented in spec-05 revision notes as deferred cosmetic smell; structured sub-field upgrade tracked as future work; schema + audit tooling handle the composite form correctly in scope. No plan-02 action required.

## Execution Order and Dependencies

```
Task 1 (setup) ───┬─► Task 2 (schema) ──► Task 3 (store) ──► Task 4 (server) ─┐
                  │                                                            │
                  │                                                            ▼
                  ├─► Task 6 (refs) ──► Task 4.5 (util-artifact-schema) ──► Task 5 (register)
                  │                                            │                │
                  │                                            ▼                 │
                  └─► Task 7 (design-specify) ──► Task 8 (plan-build) ◄──────────┤
                                                        │                        │
                                                        ▼                        │
                                         Task 9 (execute-write) ◄────────────────┘
                                                        │
                                                        ▼
                                         Task 10 (verify-complete)
                                                        │
                                                        ▼
                                         Task 11 (finish-write-records)
                                                        │
                                                        ▼
                                         Task 12 (skill-index)
                                                        │
                                                        ▼
                                         Task 13 (4 integration scripts — gates all)
```

Tasks 2–5 are sequential. Task 6 parallel with 2–5. Task 4.5 depends on Task 6 (new artifact type declared alongside new reference files). Task 7 depends on Task 4.5 (design-specify references the canonical manifest path). Tasks 8–12 depend on Tasks 5 and 7. Task 13 (four integration scripts) depends on all prior.

## Non-Goals for This Plan

- Retrofitting existing prior sprints' decisions into the new store
- Migrating existing reasoning-audit artifacts into decision records
- Generic ADR export format for the store
- Web-UI or dashboard for browsing decisions
