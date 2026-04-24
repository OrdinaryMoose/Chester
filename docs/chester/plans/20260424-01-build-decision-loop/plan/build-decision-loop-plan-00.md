# Plan: Decision-Record / Constraint-Triangle System

**Sprint:** 20260424-01-build-decision-loop
**Spec:** `docs/chester/working/20260424-01-build-decision-loop/spec/build-decision-loop-spec-03.md`

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox syntax for tracking.

## Goal

Implement the decision-record / constraint-triangle system per spec-03: new MCP at `mcp/chester-decision-record/` with six tools, persistent store at `/docs/chester/decision-record.md`, four new reference files, and loop-integration edits to six existing skills.

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

## Task 1: Setup — remove pre-existing directory and scaffold MCP package

**Type:** config-producing
**Implements:** AC-6.1 (setup precondition)
**Decision budget:** 0
**Must remain green:** —

**Files:**
- Delete: `docs/chester/decision-record/` (pre-existing empty directory)
- Create: `mcp/chester-decision-record/package.json`
- Create: `tests/mcp/chester-decision-record/test-setup.sh`

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/mcp/chester-decision-record/test-setup.sh` verifying: (a) `docs/chester/decision-record/` does NOT exist as a directory; (b) `mcp/chester-decision-record/` exists with `package.json` containing `@modelcontextprotocol/sdk` dependency and `"type": "module"`
- [ ] **Step 2:** Run `bash tests/mcp/chester-decision-record/test-setup.sh` → Expected: FAIL (directory still present, mcp scaffold missing)
- [ ] **Step 3:** Verify `docs/chester/decision-record/` is empty then `rmdir docs/chester/decision-record`; `mkdir -p mcp/chester-decision-record`; write `package.json` with `"type": "module"` and `@modelcontextprotocol/sdk` dep
- [ ] **Step 4:** Re-run test → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add docs/chester/decision-record mcp/chester-decision-record/package.json tests/mcp/chester-decision-record/test-setup.sh
git commit -m "chore: scaffold chester-decision-record MCP package; remove pre-existing empty directory"
```

---

## Task 2: Implement schema.js — field-set validation

**Type:** code-producing
**Implements:** AC-3.1
**Decision budget:** 1 (structured error-return shape)
**Must remain green:** `test-setup.sh` (Task 1)

**Files:**
- Create: `mcp/chester-decision-record/schema.js`
- Create: `mcp/chester-decision-record/test-schema.js`

**Steps (TDD):**
- [ ] **Step 1:** Write `test-schema.js` asserting: (a) `validate(fullRecord)` returns `{ok: true, errors: []}`; (b) `validate(recordMissingTrigger)` returns `{ok: false, errors: [{field: "trigger", reason: ...}]}`; (c) `validate(recordWithUnknownField)` returns `{ok: false, errors: [...]}` (reference skeleton `ac-3-1-field-set-mandatory`)
- [ ] **Step 2:** Run `node --test mcp/chester-decision-record/test-schema.js` → Expected: FAIL
- [ ] **Step 3:** Implement `schema.js` exporting `validate(record)` checking all 14 mandatory fields (ID, Sprint, Task, Status, Tags, Trigger, Context, Options Considered, Chosen, Rationale, Spec Update, Test, Code, Supersedes, Superseded By); accept "none" with justification in Spec Update/Supersedes/Superseded By
- [ ] **Step 4:** Re-run test → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add mcp/chester-decision-record/schema.js mcp/chester-decision-record/test-schema.js
git commit -m "feat: implement decision-record schema validation (NC-3, AC-3.1)"
```

---

## Task 3: Implement store.js — append, ID generation, supersede, abandon, status transitions

**Type:** code-producing
**Implements:** AC-6.1, AC-7.1, AC-10.1, AC-11.1
**Decision budget:** 2 (ID-counter stateless-scan format; file-lock approach)
**Must remain green:** `test-setup.sh`, `test-schema.js`

**Files:**
- Create: `mcp/chester-decision-record/store.js`
- Create: `mcp/chester-decision-record/test-store.js`

**Steps (TDD):**
- [ ] **Step 1:** Write `test-store.js` asserting:
  - `append(record)` writes to `/docs/chester/decision-record.md`, creates file if absent (ref skeleton `ac-6-1-store-location`, `ac-10-1-direct-store`)
  - `nextId()` scans file for today's max XXXXX and returns incremented; first record of day returns `YYYYMMDD-00001`
  - `supersede(oldId, newId)` sets old record's Status=Superseded and Superseded By=newId; sets new record's Supersedes=oldId; old body unchanged (ref skeleton `ac-7-1-append-only-supersede`)
  - `abandon(sprint)` returns `{affected, skipped_superseded}`; transitions only Active records of given sprint; Superseded records preserved (ref skeleton `ac-11-1-abandon-path`)
  - `query(filter)` applies `sprint_subject`, `tags`, `status`, `recency_days`, `criterion_id` filters correctly (ref skeleton `ac-10-2-filter-at-read`)
  - Concurrent `append` via two processes: file-lock serializes; no interleaved writes
- [ ] **Step 2:** Run `node --test mcp/chester-decision-record/test-store.js` → Expected: FAIL
- [ ] **Step 3:** Implement `store.js` exporting `append`, `nextId`, `supersede`, `abandon`, `query`; use Node `fs/promises` with file-lock via a lockfile (`/docs/chester/decision-record.md.lock`); ID generation scans existing file for `## Decision YYYYMMDD-XXXXX` headings matching today's date
- [ ] **Step 4:** Re-run test → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add mcp/chester-decision-record/store.js mcp/chester-decision-record/test-store.js
git commit -m "feat: implement decision-record store operations (NC-6/7/10/11; AC-6.1, AC-7.1, AC-10.1, AC-11.1)"
```

---

## Task 4: Implement server.js — MCP tool dispatch

**Type:** code-producing
**Implements:** AC-1.1 (via dr_capture), AC-3.1 (via schema enforcement), AC-6.1, AC-7.1, AC-10.1, AC-10.2, AC-11.1
**Decision budget:** 1 (tool error vs exception convention)
**Must remain green:** `test-setup.sh`, `test-schema.js`, `test-store.js`

**Files:**
- Create: `mcp/chester-decision-record/server.js`
- Create: `mcp/chester-decision-record/test-server.js`

**Steps (TDD):**
- [ ] **Step 1:** Write `test-server.js` as MCP integration: spawn server via stdio, send `dr_capture` request with full field set, verify response `{id, status: "accepted"}`; send `dr_query({status: "Active"})`, verify returned records shape; send `dr_supersede`, verify response; send `dr_abandon`, verify affected/skipped_superseded counts; send `dr_verify_tests` against a sprint with known records, verify per_record verdicts; send `dr_audit`, verify drift report shape
- [ ] **Step 2:** Run test → Expected: FAIL
- [ ] **Step 3:** Implement `server.js` using `@modelcontextprotocol/sdk`: register six tools (`dr_capture`, `dr_supersede`, `dr_abandon`, `dr_query`, `dr_verify_tests`, `dr_audit`); delegate to `schema.js` validation and `store.js` operations; return typed shapes per spec-03 §Return shapes
- [ ] **Step 4:** Re-run test → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add mcp/chester-decision-record/server.js mcp/chester-decision-record/test-server.js
git commit -m "feat: implement decision-record MCP server with 6 tools (NC-1/8)"
```

---

## Task 5: Register MCP in .claude-plugin/mcp.json

**Type:** config-producing
**Implements:** AC-12.1 (independence via separate MCP entry)
**Decision budget:** 0
**Must remain green:** all prior tests

**Files:**
- Modify: `.claude-plugin/mcp.json`
- Create: `tests/mcp/chester-decision-record/test-registration.sh`

**Steps (TDD):**
- [ ] **Step 1:** Write `test-registration.sh` asserting: `jq` returns `chester-decision-record` entry from `.claude-plugin/mcp.json` with command=`node` and args pointing to `${CLAUDE_PLUGIN_ROOT}/mcp/chester-decision-record/server.js` (ref skeleton `ac-12-1-independence-preserved`)
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
git add .claude-plugin/mcp.json tests/mcp/chester-decision-record/test-registration.sh
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
- [ ] **Step 1:** Extend `tests/test-reference-files.sh` to assert: `skills/design-specify/SKILL.md` contains "Scaffold test skeletons" / "skeleton-generator.md" references in the Writing-the-Spec section
- [ ] **Step 2:** Run → Expected: FAIL
- [ ] **Step 3:** Edit `design-specify/SKILL.md` Writing-the-Spec section to add skeleton-scaffolding step per spec-03 §Modified Existing Skills; reference `skeleton-generator.md` and `spec-template.md`
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
**Implements:** AC-1.1, AC-1.2, AC-2.1, AC-4.1, AC-5.1
**Decision budget:** 2 (step numbering strategy in Section 2.1; implementer observable-behaviors structure)
**Must remain green:** prior tests

**Files:**
- Modify: `skills/execute-write/SKILL.md`
- Modify: `skills/execute-write/references/implementer.md`
- Modify: `skills/execute-write/references/spec-reviewer.md`

**Steps (TDD):**
- [ ] **Step 1:** Write `tests/test-execute-write-update.sh` asserting:
  - `execute-write/SKILL.md` Section 2.1 contains a "Decision-Record Trigger Check" step
  - SKILL.md Red Flags contains trigger-check entry
  - `implementer.md` self-check requires `observable-behaviors.md` artifact with canonical form
  - `spec-reviewer.md` adds record-alignment verification
  - (ref skeletons `ac-1-1-prospective-capture`, `ac-1-2-non-code-skip`, `ac-2-1-mechanical-discrimination`, `ac-4-1-gate-on-suite-pass`, `ac-5-1-backward-reach`)
- [ ] **Step 2:** Run → Expected: FAIL
- [ ] **Step 3:** Apply spec-03 edits: insert new numbered step in Section 2.1 between current steps 2 and 3; renumber subsequent steps; add Red Flags entry; update `implementer.md` and `spec-reviewer.md` per spec
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

## Task 13: End-to-end integration test

**Type:** code-producing
**Implements:** AC-12.1 (full-system verification), cross-cutting verification for AC-1.1, AC-4.1, AC-4.2, AC-5.1, AC-8.1, AC-11.1
**Decision budget:** 2 (test harness — mock sprint vs real sprint)
**Must remain green:** all prior tests

**Files:**
- Create: `tests/test-decision-record-integration.sh`

**Steps (TDD):**
- [ ] **Step 1:** Write `test-decision-record-integration.sh` exercising end-to-end flow:
  - Set up a mock sprint directory with a minimal spec containing two acceptance criteria
  - Scaffold skeletons per AC
  - Simulate Task 1 implementation with no ambiguity → NO_FIRE; task DONE
  - Simulate Task 2 implementation surfacing spec-level ambiguity → FIRE → dr_capture invoked → spec updated → new test generated from clause → full suite run → passes (after backward-reach fix to Task 1 code if needed) → task DONE
  - Verify `/docs/chester/decision-record.md` contains the new record with full field set
  - Verify `execute-verify-complete` `dr_verify_tests` returns pass
  - Verify a subsequent simulated sprint's `plan-build` `dr_query` returns the record from this sprint
  - Verify `dr_abandon` path transitions Active records to Abandoned
- [ ] **Step 2:** Run → Expected: FAIL (initially)
- [ ] **Step 3:** Adjust orchestration / fix any integration gaps surfaced by the test
- [ ] **Step 4:** Re-run → Expected: PASS
- [ ] **Step 5:** Commit
```bash
git add tests/test-decision-record-integration.sh
git commit -m "test: end-to-end decision-record loop integration test"
```

---

## Execution Order and Dependencies

```
Task 1 (setup) ────┬─► Task 2 (schema) ───► Task 3 (store) ───► Task 4 (server) ───► Task 5 (register)
                   │                                                                         │
                   │                                                                         ▼
                   └─► Task 6 (refs) ─► Task 7 (design-specify) ─► Task 8 (plan-build)       │
                                                                         │                   │
                                                                         ▼                   │
                                                  Task 9 (execute-write) ◄──────────────────┘
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
                                           Task 13 (integration test — gates all)
```

Tasks 2–5 are sequential (each depends on prior). Task 6 can run in parallel with Tasks 2–5. Tasks 7–12 depend on Tasks 5 and 6 (MCP registered + reference files exist). Task 13 depends on all prior.

## Non-Goals for This Plan

- Retrofitting existing prior sprints' decisions into the new store
- Migrating existing reasoning-audit artifacts into decision records
- Generic ADR export format for the store
- Web-UI or dashboard for browsing decisions
