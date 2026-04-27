# Spec: Redesign Convergence Model — Lane 1 MVP

**Sprint:** 20260425-01-redesign-convergence-model
**Parent brief:** `docs/chester/working/20260425-01-redesign-convergence-model/design/redesign-convergence-model-design-00.md`
**Architecture:** Hybrid (principled merge from architect comparison)

## Goal

Add agent voice discipline (C1 Externalized Coverage; C2 Fact-default with marked Assumption/Opinion) to the shared `util-design-partner-role` skill so both `design-large-task` and `design-small-task` inherit the same discipline. Add three telemetry fields to the understanding MCP state for future Lane 2 retrospective analysis. Add a session metadata file written by `start-bootstrap` to link sprint artifacts to the JSONL transcript. Light-touch scope: five files modified, one test file created.

## Components

**Modified files:**
- `skills/util-design-partner-role/SKILL.md` — adds short composition introduction; new C1 section; new C2 section with before/after example; extends Self-Evaluation with four sibling checks
- `skills/start-bootstrap/SKILL.md` — adds Step 4c writing session metadata JSON
- `skills/design-large-task/understanding-mcp/state.js` — adds three telemetry array fields; updates `updateState` signature to accept warnings; adds three append operations
- `skills/design-large-task/understanding-mcp/server.js` — passes `validation.warnings` to `updateState` call
- `skills/design-large-task/SKILL.md` — adds one-line cross-reference to C1+C2 at Understand Stage Step 6 (Write commentary) and at Solve Stage Step 8 (Write commentary)
- `skills/design-small-task/SKILL.md` — adds one-line cross-reference to C1+C2 at Phase 4 Step 3 (Write commentary)

**New files:**
- `tests/test-understanding-telemetry.sh` — verifies three new telemetry fields persist across multiple submit cycles
- `tests/test-session-metadata.sh` — verifies session metadata file is written with all five required fields
- `tests/test-partner-role-discipline.sh` — verifies C1+C2 sections present in partner role with required elements

**Section ordering in `util-design-partner-role/SKILL.md` after edits:**
1. The Core Stance (unchanged)
2. The Interpreter Frame (unchanged)
3. **Composition Note** (new short paragraph — 2-3 sentences naming C1 and C2 as new disciplines and how they compose with existing rules)
4. Private Precision Slot (unchanged)
5. **C1: Externalized Coverage** (new section)
6. **C2: Fact Default with Marked Departures** (new section, includes before/after example)
7. Option-Naming Rule (unchanged)
8. Self-Evaluation (extended with four sibling checks)
9. Stance Principles (unchanged)

C1 and C2 placed between Private Precision Slot and Option-Naming Rule. Existing section ordering preserved (no reorganization beyond the insertion). Composition Note added near the top to signal the new disciplines exist and how they relate.

## Data Flow

**Per-turn agent flow with C1+C2 (after this sprint):**
1. Agent reads code privately (Research Boundary unchanged)
2. Agent extracts concept; if load-bearing for designer-facing conclusion, surfaces it in information package (C1)
3. Agent composes commentary; marks each claim per C2 default-vs-departure rule (Facts unmarked, Assumptions marked, Opinions marked; recommendations always carry Opinion marker)
4. Agent runs Translation Gate (unchanged) — strips code vocabulary from designer-visible output
5. Agent runs Self-Evaluation (extended) — answers strategy/code talk question + four C1/C2 sibling questions; fixes any yes-answers before sending

**Telemetry persistence flow per submit cycle:**
1. `handleSubmitUnderstanding` calls `validateUnderstandingSubmission` → returns `validation.warnings`
2. Calls `updateState(state, scores, validation.warnings)` (new third parameter)
3. `updateState` computes group saturation, overall saturation, transition status (existing logic)
4. After existing pushes to `scoreHistory` and `saturationHistory`, three new pushes: `groupSaturationHistory`, `transitionHistory` (object `{ ready, reasons }`), `warningsHistory` (warnings array passed in)
5. State persisted to disk via existing `saveState`
6. `handleGetState` returns full state including new fields via existing spread

**Session metadata write flow:**
1. `start-bootstrap` runs at sprint start
2. After Step 4b (breadcrumb write), Step 4c writes JSON file at `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-session-meta.json`
3. JSON contains five fields: `sprintName`, `branchName`, `sessionStartTimestamp` (ISO 8601 UTC), `jsonlSessionId` (best-effort capture; null if unavailable), `skillVersion` (object with commit hashes for `util-design-partner-role` and `design-large-task` SKILL.md files)
4. File is tracked in git; `finish-archive-artifacts` copies it to `plans/` at sprint close

## Error Handling

- `updateState` `warnings` parameter defaults to `[]` for backward compatibility — any existing call site without the third argument continues to work
- Session metadata write does not fail bootstrap if `jsonlSessionId` cannot be captured (Claude Code env var unavailable) — write null or "unavailable" for that field, proceed
- Skill version capture uses `git rev-parse HEAD` from start-bootstrap's CWD; at bootstrap time no worktree exists yet (util-worktree runs later in the pipeline), so CWD is the main repository. If git command fails (e.g., bootstrap invoked outside a git repo), write null for that field rather than failing bootstrap
- `transitionHistory` entry normalizes `reasons` to empty array if `next.transition.reasons` is undefined (defensive against future changes to `checkTransitionReady`)
- Existing telemetry fields (`scoreHistory`, `saturationHistory`) and existing handler responses remain unchanged — additions are purely additive, no breaking changes to existing API surface

## Testing Strategy

Three new bash test files added to `tests/`:

- **`test-understanding-telemetry.sh`** — directly imports `state.js` functions via Node; calls `initializeState`, then three sequential `updateState` calls with valid scores; asserts array lengths grow correctly (1, 2, 3); asserts entry shapes are correct; asserts existing `scoreHistory` and `saturationHistory` still grow alongside. Covers AC-2.1 through AC-2.4.
- **`test-session-metadata.sh`** — invokes `start-bootstrap` simulation in temp directory; asserts metadata file exists at expected path; parses JSON; asserts all five required fields present. Covers AC-3.1 and AC-3.2.
- **`test-partner-role-discipline.sh`** — reads `util-design-partner-role/SKILL.md`; asserts presence of section headings (C1, C2); asserts key phrases (e.g., "load-bearing", "Fact default", "all recommendations are opinions"); asserts before/after example block exists; asserts Self-Evaluation section contains four sibling check questions. Covers AC-1.1 through AC-1.4.

**Test framework detection conflict noted:** Chester root has `package.json` (priority 2 in skeleton-generator → TypeScript), but actual test framework is bash (`tests/*.sh`, priority 4). Codebase convention and both architects' designs use bash. Skeletons emitted as bash to match implementation reality. Skeleton manifest documents this override.

## Constraints

- Translation Gate continues to apply to all designer-visible output unchanged; new C1 and C2 markers must use only plain-language vocabulary, no code names or file paths
- C2 markers use natural phrasing — agent has flexibility in how to express Assumption and Opinion; no canonical lead-words enforced beyond unambiguity
- Source breadcrumb in commentary explicitly forbidden ("Fact (read from BridgeService:45)" is REJECTED); precision lives in Private Precision Slot
- Citation system explicitly rejected — implementation must not introduce numbered inline markers, sources document, or derivation paragraphs even if they appear convenient
- Light-touch scope holds — only the five named files modified plus three test files created; no edits to gate logic, register restructuring, downstream skills, or any other Chester component
- Existing partner-role section text (Core Stance, Interpreter Frame, Private Precision Slot, Option-Naming Rule, Self-Evaluation original "strategy talk vs code talk" check, Stance Principles) preserved verbatim — only the new Composition Note insertion, the new C1 and C2 sections, and the four Self-Evaluation sibling additions affect content
- Three new telemetry fields are additive only; existing `scoreHistory`, `saturationHistory`, derived current-state fields, and all handler response shapes remain unchanged
- Session metadata file lives in tracked `design/` subdirectory — must NOT be added to gitignore
- Cross-reference in each per-turn flow limited to ONE LINE; large-task has two per-turn flows (Understand and Solve) so receives one line in each, totaling two lines

## Non-Goals

- Lane 2 work (transition gate redesign, dimension restructuring, Implication Closure prediction loop) — deferred to a separate follow-on sprint
- Citation system, numbered markers, sources document, derivation paragraphs — explicitly rejected during conversation
- Source breadcrumb in commentary — rejected
- Modifications to `design-specify`, `plan-build`, `execute-write`, or any downstream skill
- New MCP tools or schema changes beyond the three named telemetry fields
- Real-time topic-tracking, designer correction marking, per-turn topic-chosen capture
- Cross-MCP linkage between understanding state and proof state files
- Partner-role file reorganization beyond the targeted insertion of C1+C2 between Private Precision Slot and Option-Naming Rule, plus the short Composition Note near the top, plus Self-Evaluation extension

## Acceptance Criteria

### AC-1.1 — C1 section present in partner role

**Observable boundary:**
- `util-design-partner-role/SKILL.md` contains a section titled "C1: Externalized Coverage"
- Section contains the C1 statement (no hidden-premise reasoning; load-bearing concepts surface in designer-visible output)
- Section names the failure mode (silent premise / hidden-premise reasoning)
- Section states single-session scope explicitly
- Section includes operational test ("would removing this from designer-visible output change whether designer can challenge my conclusion?")

**Given:** the partner role file is read
**When:** searched for the C1 section
**Then:** the section exists with all required elements present

**Test skeleton ID:** `ac-1-1-c1-section-present` (skeleton stub at `tests/test-partner-role-discipline.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-1.2 — C2 section present in partner role

**Observable boundary:**
- `util-design-partner-role/SKILL.md` contains a section titled "C2: Fact Default with Marked Departures"
- Section states default state is Fact (verifiable + repeatable; unmarked)
- Section names Assumption marker with at least two natural-phrasing examples
- Section names Opinion marker with at least two natural-phrasing examples
- Section states the hard rule "all recommendations are opinions"
- Section states the no-source-breadcrumb constraint
- Section explicitly relates to Translation Gate (markers use plain language; Translation Gate applies after marking)

**Given:** the partner role file is read
**When:** searched for the C2 section
**Then:** the section exists with all required elements present

**Test skeleton ID:** `ac-1-2-c2-section-present` (skeleton stub at `tests/test-partner-role-discipline.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-1.3 — C2 before/after example present

**Observable boundary:**
- C2 section contains a before/after example block
- Example contains at least one Fact (unmarked, verifiable claim)
- Example contains at least one Assumption with explicit marker
- Example contains at least one Opinion with explicit marker (recommendation form)
- Example contains a confidence-laundering case (Fact-shaped sentence in "before" that is correctly marked as Assumption in "after")
- Example uses concept-domain vocabulary only (passes Translation Gate when read aloud)

**Given:** the C2 section is read
**When:** searched for the before/after example
**Then:** the example exists with all four claim types and passes Translation Gate

**Test skeleton ID:** `ac-1-3-c2-before-after-example` (skeleton stub at `tests/test-partner-role-discipline.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-1.4 — Self-Evaluation extended with four sibling checks

**Observable boundary:**
- `util-design-partner-role/SKILL.md` Self-Evaluation section retains the existing "strategy talk vs code talk" check unchanged
- Section adds four sibling check questions covering C1 and C2 obligations
- Sibling checks include: (1) C1 — un-surfaced premise check; (2) C2 — Assumption-as-Fact check; (3) C2 — Opinion/recommendation marker check; (4) C2 — recommendation-without-Opinion-marker check (hard rule)
- Sibling checks use positive-game framing consistent with existing check (correct before sending, not prohibitions)

**Given:** the Self-Evaluation section is read
**When:** searched for sibling checks beyond the original strategy/code question
**Then:** four additional sibling check questions are present in positive-game framing

**Test skeleton ID:** `ac-1-4-self-evaluation-extended` (skeleton stub at `tests/test-partner-role-discipline.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-1.5 — Composition Note added

**Observable boundary:**
- `util-design-partner-role/SKILL.md` contains a short composition introduction (2-3 sentences) near the top of the file (after Interpreter Frame, before Private Precision Slot)
- Note names C1 and C2 as new disciplines
- Note states C1 and C2 compose with existing disciplines (Translation Gate, Research Boundary, etc.) without forcing pipeline ordering

**Given:** the partner role file is read
**When:** searched for a composition introduction
**Then:** a 2-3 sentence note exists in the expected position naming C1 and C2 and their composition with existing rules

**Test skeleton ID:** `ac-1-5-composition-note` (skeleton stub at `tests/test-partner-role-discipline.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-2.1 — groupSaturationHistory persists across cycles

**Observable boundary:**
- After three sequential `submit_understanding` calls with valid scores, the persisted state file contains `groupSaturationHistory` array with exactly 3 entries
- Each entry is an object containing the three group keys (`landscape`, `human_context`, `foundations`) with numeric saturation values
- Entries appear in chronological order (entry 0 from first submit, entry 2 from third submit)

**Given:** an initialized understanding state file
**When:** three sequential submit_understanding calls execute with valid scores
**Then:** groupSaturationHistory array has 3 entries with correct shape in chronological order

**Test skeleton ID:** `ac-2-1-group-saturation-history` (skeleton stub at `tests/test-understanding-telemetry.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-2.2 — transitionHistory persists with ready/reasons per round

**Observable boundary:**
- After three sequential submit cycles, persisted state contains `transitionHistory` array with exactly 3 entries
- Each entry is an object with `ready` (boolean) and `reasons` (array of strings) keys
- Values reflect actual transition status at that round (early rounds typically have `ready: false` with reasons explaining why)

**Given:** an initialized understanding state file
**When:** three sequential submit_understanding calls execute
**Then:** transitionHistory array has 3 entries each with ready boolean and reasons array

**Test skeleton ID:** `ac-2-2-transition-history` (skeleton stub at `tests/test-understanding-telemetry.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-2.3 — warningsHistory persists; updateState accepts warnings parameter

**Observable boundary:**
- `updateState` function signature accepts a third parameter `warnings` defaulting to `[]`
- After three sequential submit cycles, persisted state contains `warningsHistory` array with exactly 3 entries
- Each entry is an array (may be empty if no warnings fired that round)
- `server.js` `handleSubmitUnderstanding` passes `validation.warnings` to `updateState`

**Given:** an initialized understanding state file
**When:** three sequential submit_understanding calls execute (at least one with a score-jump warning triggered)
**Then:** warningsHistory has 3 entries; entries are arrays; warning content from at least one round matches the validation warning text

**Test skeleton ID:** `ac-2-3-warnings-history` (skeleton stub at `tests/test-understanding-telemetry.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-2.4 — Existing telemetry fields function unchanged

**Observable boundary:**
- After three sequential submit cycles, persisted state retains `scoreHistory` array with 3 entries (existing behavior)
- `saturationHistory` array has 3 entries (existing behavior)
- Derived current-state fields (`groupSaturation`, `overallSaturation`, `weakest`, `gapsSummary`, `transition`) populate as before
- `handleSubmitUnderstanding` returns existing JSON response shape (round, overall_saturation, group_saturation, weakest_group, weakest_dimension, gaps_summary, transition_ready, transition_reasons, warnings) unchanged

**Given:** an initialized understanding state file
**When:** three sequential submit_understanding calls execute
**Then:** all existing fields and response shapes function as before; no regression

**Test skeleton ID:** `ac-2-4-existing-telemetry-unchanged` (skeleton stub at `tests/test-understanding-telemetry.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-3.1 — Session metadata file written at sprint creation

**Observable boundary:**
- After `start-bootstrap` runs for a new sprint, file exists at `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-session-meta.json`
- File is parseable JSON
- File creation does not fail bootstrap even if some fields cannot be populated
- File lives in `design/` subdirectory (tracked in git via design folder convention)

**Given:** a fresh sprint subdirectory created by `start-bootstrap`
**When:** Step 4c executes
**Then:** session metadata file exists at expected path and is parseable JSON

**Test skeleton ID:** `ac-3-1-session-metadata-written` (skeleton stub at `tests/test-session-metadata.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-3.2 — Session metadata contains five required fields

**Observable boundary:**
- Parsed JSON contains key `sprintName` with non-empty string value matching the sprint subdirectory name
- Parsed JSON contains key `branchName` with non-empty string value matching the sprint subdirectory name (branch is named identically)
- Parsed JSON contains key `sessionStartTimestamp` with ISO 8601 UTC string value
- Parsed JSON contains key `jsonlSessionId` (string or null — best-effort capture)
- Parsed JSON contains key `skillVersion` with object value containing two sub-keys: `utilDesignPartnerRole` and `designLargeTask`, each a git commit hash string or null

**Given:** the session metadata file from AC-3.1
**When:** parsed as JSON
**Then:** all five required keys are present with values of correct type (allowing null for best-effort fields)

**Test skeleton ID:** `ac-3-2-session-metadata-fields` (skeleton stub at `tests/test-session-metadata.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-4.1 — design-large-task per-turn flow contains C1+C2 cross-references

**Observable boundary:**
- `skills/design-large-task/SKILL.md` Understand Stage Per-Turn Flow Step 6 (Write commentary) contains exactly one line referencing C1 and C2 in `util-design-partner-role`
- `skills/design-large-task/SKILL.md` Solve Stage Per-Turn Flow Step 8 (Write commentary) contains exactly one line referencing C1 and C2
- Each cross-reference line names both C1 and C2 explicitly
- Each cross-reference line directs agent to verify before sending

**Given:** the design-large-task skill file
**When:** searched for cross-references at the two commentary steps
**Then:** one cross-reference line exists at each commentary step naming both C1 and C2

**Test skeleton ID:** `ac-4-1-large-task-cross-refs` (skeleton stub at `tests/test-partner-role-discipline.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-4.2 — design-small-task per-turn flow contains C1+C2 cross-reference

**Observable boundary:**
- `skills/design-small-task/SKILL.md` Phase 4 Per-Turn Flow Step 3 (Write commentary) contains exactly one line referencing C1 and C2 in `util-design-partner-role`
- Cross-reference line names both C1 and C2 explicitly
- Cross-reference line directs agent to verify before sending

**Given:** the design-small-task skill file
**When:** searched for cross-reference at Phase 4 Step 3
**Then:** one cross-reference line exists naming both C1 and C2

**Test skeleton ID:** `ac-4-2-small-task-cross-ref` (skeleton stub at `tests/test-partner-role-discipline.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-5.1 — All modified skill text passes Translation Gate

**Observable boundary:**
- New C1 section uses no code vocabulary in the rule text or examples (no type names, file paths, property names, namespace names, or backticked identifiers in designer-facing prose)
- New C2 section uses no code vocabulary in rule text or before/after example
- New Composition Note uses no code vocabulary
- Self-Evaluation sibling checks use no code vocabulary
- Cross-reference lines in design-large-task and design-small-task use no code vocabulary in their narrative phrasing (the names "C1" and "C2" and the file reference "util-design-partner-role" are skill-internal references, not code vocabulary, and are permitted)

**Given:** all modified skill text
**When:** read aloud as if to the Product Manager from the Translation Gate's PM Litmus Test
**Then:** every sentence is comprehensible without explanation of code-internal terms

**Test skeleton ID:** `ac-5-1-translation-gate-passes` (skeleton stub at `tests/test-partner-role-discipline.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

---

### AC-5.2 — Existing partner-role mechanisms function unchanged

**Observable boundary:**
- The Core Stance section text preserved verbatim from pre-change state
- The Interpreter Frame section text preserved verbatim
- Private Precision Slot section text preserved verbatim
- Option-Naming Rule section text preserved verbatim
- Self-Evaluation original "strategy talk vs code talk" check preserved verbatim (additions only, no edits to existing check)
- Stance Principles section text preserved verbatim
- Note: Translation Gate and Research Boundary live in `design-large-task/SKILL.md` (and `design-small-task/SKILL.md`), NOT in partner role; this AC verifies only the partner-role file's existing sections are unchanged

**Given:** the modified `util-design-partner-role/SKILL.md`
**When:** compared against the pre-change baseline
**Then:** all existing section text appears unchanged; only insertions and the Self-Evaluation extension differ

**Test skeleton ID:** `ac-5-2-existing-mechanisms-unchanged` (skeleton stub at `tests/test-partner-role-discipline.sh`; skeleton manifest at `spec/redesign-convergence-model-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)
