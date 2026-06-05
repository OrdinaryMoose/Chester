# Plan: Team-Lead Context Economy in the Ad-hoc Committee

**Sprint:** 20260604-01-update-committee-context-management
**Spec:** docs/chester/working/20260604-01-update-committee-context-management/spec/20260604-01-update-committee-context-management-spec-00.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs.

## Goal

Strip the Conduit and Synthesizer payloads off the Ad-hoc committee team-lead's thread — members write full positions to disk and send only digests; an off-thread Consolidator reduces; a minimal ledger makes the team-lead rehydratable — leaving the Controller role intact.

## Architecture

Hybrid (from spec): a dedicated `member-protocol.md` reference is the single authority for the digest shape, the write-to-round-folder discipline, and transcript naming; member agent files cite it (no schema embedded, per `skill-contract.md`). A new enumerate-only `design-committee-consolidator` role writes its own per-round output file (no shared-record two-writer race). One folder per round under `committee/`; a single consultation ledger. All edits land atomically on the sprint branch. Scope: Ad-hoc committee (`design-committee`) only.

**Directed mitigations (designer-approved at the hardening gate):** M1 — `member-protocol.md` is also the single authority for `committee/` root resolution (the sprint-vs-designer-ask fork); `SKILL.md` and `team-lead.md` cite that section rather than restating the fork. M3 — `member-protocol.md` uses named, citable `##` section headings so the five agent files cite the specific section, not the whole file. (M2, a structural Consolidator-ceiling guard, was not directed — the prose ceiling stands, consistent with the existing committee trust model.)

## Tech Stack

Markdown skill/agent contract files. Tests are bash structural assertions (grep-based) under `tests/`, matching the existing `test-ac-*.sh` / `test-design-architect-committee-lint.sh` lint pattern.

**Test-file insertion discipline (read before Task 2+):** `tests/test-design-committee-context-economy.sh` has two sentinel regions created in Task 1 — `ASSERTION FUNCTIONS` and `RUN` — both ABOVE the final pass/fail gate line. Each later task inserts its `assert_*` function body into the FUNCTIONS region and its call into the RUN region. **Never append after the gate line** (`[ "$fail" -eq 0 ] && ...`): a function or call placed after the gate never executes and the suite silently passes regardless of file state.

**Atomic-landing note:** these are interlocking contract edits (digest-to-lead is hard-paired with the Consolidator). Tasks commit per-task on the sprint branch for clean checkpointing, but the feature is coherent only once all tasks land; the branch merges as one unit.

---

## Task 1: Create the shared member-protocol reference

**Type:** docs-producing
**Implements:** AC-2.1, AC-2.2, AC-1.2
**Decision budget:** 2
**Must remain green:** `assert_member_protocol`

**Files:**
- Create: `skills/design-committee/references/member-protocol.md`
- Test: `tests/test-design-committee-context-economy.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertion** — append to `tests/test-design-committee-context-economy.sh` (create the file with the runner scaffold if absent):

```bash
#!/usr/bin/env bash
# Structural assertions for the Ad-hoc committee context-economy change.
set -uo pipefail
ROOT="$(git rev-parse --show-toplevel)"
SK="$ROOT/skills/design-committee"
AG="$ROOT/agents"
fail=0
_check() { if eval "$2"; then echo "PASS: $1"; else echo "FAIL: $1"; fail=1; fi; }

# === ASSERTION FUNCTIONS — later tasks insert new assert_* functions in this region ===
assert_member_protocol() {
  local f="$SK/references/member-protocol.md"
  _check "member-protocol exists" "[ -f '$f' ]"
  _check "member-protocol defines digest fields" "grep -qi 'headline position' '$f' && grep -qi 'transcript path' '$f' && grep -qi 'confidence' '$f'"
  _check "member-protocol defines write-then-send sequencing" "grep -qiE 'write .*transcript.* before' '$f'"
  _check "member-protocol names round-folder transcript path" "grep -q 'committee/round' '$f'"
  _check "member-protocol has citable section headings" "grep -q '## Digest shape' '$f' && grep -q '## Committee root resolution' '$f'"
  _check "member-protocol owns committee-root resolution (M1)" "grep -qiE 'sprint-subdir|ask the designer' '$f'"
}
# === END ASSERTION FUNCTIONS ===

# === RUN — later tasks insert new assert_* calls in this region, ABOVE the gate ===
assert_member_protocol
# === END RUN ===

# --- final gate: nothing executable may be added below this line ---
[ "$fail" -eq 0 ] && echo "ALL PASS" || { echo "FAILURES"; exit 1; }
```

**Insertion rule for Tasks 2-8:** place each new `assert_*` function inside the `ASSERTION FUNCTIONS` region and its call inside the `RUN` region. Do not add anything below the final-gate line.

- [ ] **Step 2: Run to verify it fails**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL lines for member-protocol (file absent).

- [ ] **Step 3: Write `member-protocol.md`** with four **named, citable sections** (use these exact `##` headings so other files cite the section, not the whole file — mitigation M3):
  - **`## Digest shape`** — Field list a member sends the team-lead: `Role`, `Headline position` (one sentence), `Chosen option` (named structurally), `Top trade-off` (one sentence), `Confidence` (high/medium/low + one-sentence basis), `Transcript path`. State plainly: no full reasoning crosses into the team-lead's context — the digest is the entire team-lead-facing payload. Include the literal field-label block.
  - **`## Transcript and round-folder`** — Member writes its full position to `committee/roundNN/<member>-transcript.md` (researcher: `committee/roundNN/researcher-findings.md`) before sending the digest. `NN` matches the team-lead's current round. Translation Gate does not apply to transcript files (internal records, code vocab allowed).
  - **`## Write-then-send sequencing`** — Transcript written first; digest sent second via messaging. Never send a digest whose transcript is not yet on disk.
  - **`## Committee root resolution`** (mitigation M1 — single authority for the path fork) — the `committee/` root resolves to `{CHESTER_WORKING_DIR}/<sprint-subdir>/committee/` when sprint context exists, else the team-lead asks the designer for the location at Round 1 and locks it. This section is the ONE place the resolution rule lives; `SKILL.md` and `team-lead.md` cite it rather than restating the fork.

- [ ] **Step 4: Run to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS for all `assert_member_protocol` checks.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/member-protocol.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): add shared member-protocol reference (digest + write discipline)"
```

---

## Task 2: Create the Consolidator role

**Type:** docs-producing
**Implements:** AC-3.1, AC-3.2 (ephemeral/not-on-roster — co-implemented with Task 6/7)
**Decision budget:** 2
**Must remain green:** `assert_consolidator`, `assert_member_protocol`

**Files:**
- Create: `agents/design-committee-consolidator.md`
- Test: `tests/test-design-committee-context-economy.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertion** — append:

```bash
assert_consolidator() {
  local f="$AG/design-committee-consolidator.md"
  _check "consolidator agent exists" "[ -f '$f' ]"
  _check "consolidator grants Read+Glob+Write" "grep -qE '^tools:.*Read.*Glob.*Write' '$f'"
  _check "consolidator tool grant excludes Grep" "! grep -qE '^tools:.*Grep' '$f'"
  _check "consolidator enumerate-only ceiling" "grep -qi 'alignment count' '$f' && grep -qi 'notable quotes' '$f'"
  _check "consolidator prohibits interpretation" "grep -qiE '(not|never|no) .*characterize' '$f' && grep -qiE '(not|never|no) .*weight' '$f' && grep -qiE '(not|never|no) .*synthesi' '$f'"
  _check "consolidator does NOT inherit synthesizing-the-sources license" "! grep -qi 'synthesizing the sources' '$f'"
  _check "consolidator writes its own output file" "grep -q 'consolidator-output.md' '$f'"
}
```
(add `assert_consolidator` to the call list)

- [ ] **Step 2: Run to verify it fails**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL for consolidator (file absent).

- [ ] **Step 3: Write `agents/design-committee-consolidator.md`**:
  - Frontmatter: `name: design-committee-consolidator`; `description:` (reducer dispatched per round by design-committee; reads member transcripts, emits an enumerate-only synthesis; holds no design opinion; never forks); `tools: Read, Glob, Write`; `model: sonnet`.
  - Body — **role:** spawned fresh each round with a `committee/roundNN/` path; reads the member transcripts and researcher findings there; writes `committee/roundNN/consolidator-output.md`; returns a compact confirmation to the team-lead.
  - **Positive enumeration ceiling (what it MAY produce):** alignment count + who-is-on-which-side; one-line per-member position summary; verbatim notable quotes (exact words).
  - **Hard prohibitions (what it must NOT do):** does NOT characterize *why* alignment exists; does NOT weight positions by risk; does NOT synthesize a direction or recommend; is NOT a fifth advocate. State explicitly it does not carry the researcher's "synthesizing the sources" latitude.
  - Output template for `consolidator-output.md` with exact field labels (Alignment, Per-member summary, Notable quotes).

- [ ] **Step 4: Run to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS for `assert_consolidator`.

- [ ] **Step 5: Commit**

```bash
git add agents/design-committee-consolidator.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): add enumerate-only Consolidator role"
```

---

## Task 3: Grant write + digest citation to the four advocacy agents

**Type:** docs-producing
**Implements:** AC-1.1, AC-2.1, AC-2.2
**Decision budget:** 2
**Must remain green:** `assert_advocacy_agents`, prior asserts

**Files:**
- Modify: `agents/design-committee-conservator.md` (frontmatter `tools:` line 4; Output Format single-round + R2 final blocks ~lines 65-103; Hard Prohibitions ~lines 41-46)
- Modify: `agents/design-committee-innovator.md` (same structure)
- Modify: `agents/design-committee-pragmatist.md` (same)
- Modify: `agents/design-committee-purist.md` (same)
- Test: `tests/test-design-committee-context-economy.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertion** — append:

```bash
assert_advocacy_agents() {
  for m in conservator innovator pragmatist purist; do
    local f="$AG/design-committee-$m.md"
    _check "$m grants Write" "grep -qE '^tools:.*Write' '$f'"
    _check "$m write scoped to committee/" "grep -q 'committee/' '$f'"
    _check "$m cites member-protocol" "grep -q 'member-protocol' '$f'"
    _check "$m no Mode A/B" "! grep -qE 'Mode [AB]' '$f'"
  done
}
```
(add to call list)

- [ ] **Step 2: Run to verify it fails**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL for advocacy agents (no Write, no member-protocol citation).

- [ ] **Step 3: Edit each of the four advocacy agent files** (identical pattern):
  - Frontmatter `tools: Read, Glob, Grep` → `tools: Read, Glob, Grep, Write`.
  - Hard Prohibitions: add a scoped-write line — "Write access scoped to the `committee/` round folder only: write the full position to the round-folder transcript before sending the digest. No writes outside `committee/`." Update the role's declared scope so the write is not silent (per `agents/CLAUDE.md`).
  - Output Format — the **team-lead-facing finals** (the `Single-round response` block and the `Multi-round R2 final` block): replace the inline field body with "Full position → round-folder transcript (`references/member-protocol.md` § Transcript and round-folder); team-lead-facing payload → digest per `references/member-protocol.md` § Digest shape." Leave the `Multi-round R1 proposal` and `R1 peer-challenge` blocks unchanged (peer-DM path). Do NOT embed the digest field schema here — cite the specific section (M3), keeping the agent file to lens/voice/phase-contract per `skill-contract.md:19-25`.
  - Bump no version field (agent files have no version frontmatter; description unchanged).

- [ ] **Step 4: Run to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS for `assert_advocacy_agents`.

- [ ] **Step 5: Commit**

```bash
git add agents/design-committee-conservator.md agents/design-committee-innovator.md agents/design-committee-pragmatist.md agents/design-committee-purist.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): advocacy members write transcripts, send digests"
```

---

## Task 4: Grant write + narrow prohibition on the researcher agent

**Type:** docs-producing
**Implements:** AC-1.1, AC-2.2
**Decision budget:** 1
**Must remain green:** `assert_researcher_agent`, prior asserts

**Files:**
- Modify: `agents/design-committee-researcher.md` (frontmatter `tools:` line 4; Hard Prohibitions line 28; Output Format — add findings-file note)
- Test: `tests/test-design-committee-context-economy.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertion** — append:

```bash
assert_researcher_agent() {
  local f="$AG/design-committee-researcher.md"
  _check "researcher grants Write" "grep -qE '^tools:.*Write' '$f'"
  _check "researcher prohibition narrowed to committee tree" "grep -qi 'committee/' '$f'"
  _check "researcher cites member-protocol" "grep -q 'member-protocol' '$f'"
}
```
(add to call list)

- [ ] **Step 2: Run to verify it fails**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL for researcher.

- [ ] **Step 3: Edit `agents/design-committee-researcher.md`**:
  - Frontmatter `tools: Read, Glob, Grep, Bash, WebSearch, WebFetch` → append `, Write`.
  - Hard Prohibitions line 28 "No file writes outside conversation record." → "No file writes outside the `committee/` tree and the conversation record. Write findings to `committee/roundNN/researcher-findings.md`; never write to `design/ spec/ plan/ summary/`."
  - Cite `references/member-protocol.md` § Transcript and round-folder (findings-file naming) and § Digest shape (the digest the researcher sends) — specific sections, not the whole file (M3). The multi-source consolidation output block stays (factual aggregation, distinct from the Consolidator's prohibited direction-setting synthesis).

- [ ] **Step 4: Run to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS for `assert_researcher_agent`.

- [ ] **Step 5: Commit**

```bash
git add agents/design-committee-researcher.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): researcher writes findings to committee tree"
```

---

## Task 5: Rewrite the round-record template to the round-folder model

**Type:** docs-producing
**Implements:** AC-6.1, AC-3.2
**Decision budget:** 3
**Must remain green:** `assert_round_format`, prior asserts

**Files:**
- Modify (full rewrite): `skills/design-committee/references/committee-analysis-round-format.md`
- Test: `tests/test-design-committee-context-economy.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertion** — append:

```bash
assert_round_format() {
  local f="$SK/references/committee-analysis-round-format.md"
  _check "round-format uses committee/roundNN layout" "grep -q 'committee/round' '$f'"
  _check "round-format has a distinct Consolidator output section" "grep -qi 'consolidator-output' '$f'"
  _check "round-format separates team-lead Final Recommendation" "grep -qi 'Final Recommendation' '$f'"
  _check "round-format retires per-question-file-in-design framing" "! grep -qiE 'design/committee-analysis|one file per .*question' '$f'"
}
```
(add to call list)

- [ ] **Step 2: Run to verify it fails**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL (current template references `design/` per-question files).

- [ ] **Step 3: Rewrite the template** to describe the round-folder model:
  - One folder per round: `committee/roundNN/`. A follow-up round opens the next `roundNN/` (the one-file-per-designer-question, append-by-round model is retired).
  - Per-member transcript files (`<member>-transcript.md`, `researcher-findings.md`) — full positions, code vocab allowed, not designer-facing.
  - A distinct **Consolidator output** section/file (`consolidator-output.md`) — enumerate-only (alignment count, per-member summaries, verbatim notable quotes); explicitly NOT the team-lead's risk-weighted call.
  - A separate team-lead **Final Recommendation** section (`committee-analysis.md`) — the risk-weighted decision, written by the team-lead, downstream of and distinct from the Consolidator output.
  - Keep the Translation-Gate-applies note on the Final Recommendation (designer-facing) and not on transcripts.

- [ ] **Step 4: Run to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS for `assert_round_format`.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/committee-analysis-round-format.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): rewrite round-record template to round-folder model"
```

---

## Task 6: Revise the team-lead role doc

**Type:** docs-producing
**Implements:** AC-1.2, AC-3.2, AC-4.1, AC-4.2, AC-5.1
**Decision budget:** 3
**Must remain green:** `assert_team_lead`, prior asserts

**Files:**
- Modify: `skills/design-committee/references/team-lead.md` (Reading Order ~48-55; Record File ~87-95; Per-Round Flow ~97-111; Closure ~121-130; frontmatter `version` line 8 — bump)
- Test: `tests/test-design-committee-context-economy.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertion** — append:

```bash
assert_team_lead() {
  local f="$SK/references/team-lead.md"
  _check "team-lead Record File uses committee/roundNN" "grep -q 'committee/round' '$f'"
  _check "team-lead dispatches Consolidator" "grep -qi 'consolidator' '$f'"
  _check "team-lead reads consolidator-output, writes own Final Rec" "grep -qi 'consolidator-output' '$f'"
  _check "team-lead maintains ledger" "grep -q 'ledger' '$f'"
  _check "team-lead reading order cites member-protocol" "grep -q 'member-protocol' '$f'"
  _check "team-lead version bumped past v0006" "grep -qE '^version: v00(0[7-9]|[1-9][0-9])' '$f'"
}
```
(add to call list)

- [ ] **Step 2: Run to verify it fails**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL.

- [ ] **Step 3: Edit `team-lead.md`**:
  - **Reading Order:** insert `references/member-protocol.md` before `committee-analysis-round-format.md`.
  - **Record File:** resolve the `committee/` root by citing `references/member-protocol.md` § Committee root resolution — do NOT restate the sprint-vs-designer-ask fork here (M1: single authority). Round records live in `committee/roundNN/`; one folder per round. Remove the `design/`-resident, one-file-per-question language.
  - **Per-Round Flow:** after the one-round-format runs and members have written transcripts + sent digests, (a) write/update `committee/ledger.md`; (b) dispatch the Consolidator (fresh, ephemeral) with the `committee/roundNN/` path; (c) read `consolidator-output.md`; (d) apply risk-weighted judgment and write the round's `committee-analysis.md` Final Recommendation. The team-lead never holds the four full returns. The persist-before-adjudicate floor is preserved — members persist transcripts before the Consolidator runs.
  - **Ledger subsection:** `committee/ledger.md` — round number, members returned, running alignment pattern, open questions, designer decisions; updated each round boundary; enables cross-session rehydration. State "growth materially reduced + survives session handoff," not "flat."
  - **Closure:** replace the stale "for every `committee-analysis-NN.md`" stamp instruction with the new artifact targets — stamp each round's `committee/roundNN/committee-analysis.md` (and `committee/ledger.md`) via `chester-trailer-write stamp design-committee@<version> "<path>"`. Closure only on explicit designer signal (unchanged by this sprint).
  - Bump frontmatter `version: v0006` → `v0007`.

- [ ] **Step 4: Run to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS for `assert_team_lead`.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): team-lead dispatches Consolidator, keeps ledger, round-folder records"
```

---

## Task 7: Update SKILL.md (setup, unconditional path, integration, citations)

**Type:** docs-producing
**Implements:** AC-1.2, AC-5.1, AC-7.1, AC-8.1
**Decision budget:** 2
**Must remain green:** `assert_skill_md`, prior asserts

**Files:**
- Modify: `skills/design-committee/SKILL.md` (Phase 1 ~37-45; Phase 3 ~63-85; Phase 4 one-round-format ~96-106; **Standalone Invocability ~113-115 and the persist phrasing ~57**; Integration reads/calls ~121-127; frontmatter `version` — bump)
- Test: `tests/test-design-committee-context-economy.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertion** — append:

```bash
assert_skill_md() {
  local f="$SK/SKILL.md"
  _check "SKILL creates committee/ tree" "grep -q 'committee/' '$f'"
  _check "SKILL finals step = write transcript + digest" "grep -qi 'digest' '$f'"
  _check "SKILL integration adds consolidator" "grep -qi 'consolidator' '$f'"
  _check "SKILL integration reads member-protocol" "grep -q 'member-protocol' '$f'"
  _check "SKILL affirmative generic-edit clause present" "grep -qiE 'generic .*role-contract|base-skill .*clarification' '$f'"
  _check "SKILL Standalone Invocability no stale design/ record location" "! grep -qi 'lands in the sprint' '$f'"
  _check "SKILL no Mode A/B" "! grep -qE 'Mode [AB]' '$f'"
  _check "SKILL version bumped past v0016" "grep -qE '^version: v00(1[7-9]|[2-9][0-9])' '$f'"
}
```
(add to call list)

- [ ] **Step 2: Run to verify it fails**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: FAIL.

- [ ] **Step 3: Edit `SKILL.md`**:
  - **Phase 1 (Bootstrap):** create `committee/`, resolving its root by citing `references/member-protocol.md` § Committee root resolution (M1: cite the single authority, do not restate the fork). Name `design/ spec/ plan/ summary/` as reserved for formal artifacts; committee work product lives only under `committee/`.
  - **Phase 3 (Convene):** create `committee/round01/` before first dispatch; each later round opens the next `roundNN/`. Add `design-committee-consolidator` to the agents the skill uses (it is an ephemeral per-round dispatch, NOT added to the `TeamCreate` roster — state this so it isn't spawned as a standing member).
  - **Phase 4 one-round-format, finals step:** "each member writes its full position to its round-folder transcript, then sends the team-lead a digest (see `references/member-protocol.md`); full position text is not sent via messaging." Round shape otherwise unchanged.
  - **State the one unconditional path** — no cutover, no multi-round gate, no degrade-to-no-op; a single-round consult incurs one extra Consolidator spawn.
  - **Integration:** Reads += `references/member-protocol.md`; Calls/agents += `chester:design-committee-consolidator`.
  - **Standalone Invocability (~113-115) and persist phrasing (~57):** rewrite the stale "with sprint context it lands in the sprint's `design/` folder" sentence to the `committee/` model (record lands under `committee/roundNN/`; sprint-resolved root or designer-asked when standalone). Update the ~57 "persists the committee-analysis record to disk every round" phrasing so it does not imply a single `design/` record. This is the "what does NOT change" blast-radius the spec's AC-6.1 retirement implies — do not leave the old location language stranded.
  - **For Skill Authors:** add the affirmative clause — generic base-skill role-contract edits to agent files (applying to every invocation) are permitted; only sprint-specific overlay is forbidden (see `references/skill-contract.md`). Confirm no inline restatement of the forbidden surfaces (citation only — currently a no-op, leave clean).
  - Bump frontmatter `version` (v0016 → v0017).

- [ ] **Step 4: Run to verify it passes**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: PASS for `assert_skill_md`.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): committee/ setup, unconditional path, integration, citations"
```

---

## Task 8: Scope + vocabulary guard test and full-suite green

**Type:** docs-producing
**Implements:** AC-8.1
**Decision budget:** 1
**Must remain green:** entire `tests/test-design-committee-context-economy.sh` suite

**Files:**
- Modify: `tests/test-design-committee-context-economy.sh`
- Test: itself

**Steps (TDD):**

- [ ] **Step 1: Write the failing assertion** — append the cross-cutting guards:

```bash
assert_scope_and_vocab() {
  # design-architect-committee untouched by this change
  _check "no design-architect-committee file modified in this sprint" \
    "! git -C \"$ROOT\" diff --name-only main...HEAD | grep -q 'design-architect-committee'"
  # vocabulary ban across all touched committee files
  for f in "$SK/SKILL.md" "$SK/references/team-lead.md" "$SK/references/committee-analysis-round-format.md" "$SK/references/member-protocol.md" "$AG"/design-committee-{conservator,innovator,pragmatist,purist,researcher,consolidator}.md; do
    _check "no Mode A/B in $(basename "$f")" "! grep -qE 'Mode [AB]' '$f'"
  done
}
```
(add `assert_scope_and_vocab` to the call list, before the final pass/fail gate)

- [ ] **Step 2: Run to verify it fails (or surfaces violations)**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: the guard runs; any stray `Mode A/B` or architect-committee edit fails the suite.

- [ ] **Step 3: Resolve any violation** the guard surfaces (should be none if Tasks 1-7 held the constraints). No content to add beyond the assertion.

- [ ] **Step 4: Run the full suite to verify all green**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add tests/test-design-committee-context-economy.sh
git commit -m "test(design-committee): scope + vocabulary guards; full context-economy suite green"
```

<!-- created-at: 2026-06-05T01:23:05Z -->
<!-- produced-by plan-build@v0005 -->
