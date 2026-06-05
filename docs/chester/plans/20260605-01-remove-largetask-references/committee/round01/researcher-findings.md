# Researcher Findings — Round 01

**Sprint:** 20260605-01-remove-largetask-references
**Role:** Researcher (ground-truth only, no design opinion)
**Date:** 2026-06-05

---

## Confirmed Ground-Truth: design-large-task Removal Status

`skills/design-large-task/` directory: **does not exist**.
`agents/design-large-task-step-b-*.md` files: **none exist**.
The only design skills present are: `design-small-task`, `design-specify`, `design-committee`, `design-grillme`, `util-design-partner-role`.

---

## Per-File Classification

### 1. `skills/start-bootstrap/SKILL.md`

**References found:**

- Line 6-7 (frontmatter description): `Called by design-large-task and execute-write (standalone).`
- Line 19: `**Always:** \`design-large-task\` (starts fresh sprints)`
- Line 92: `skillVersion (commit hashes for \`util-design-partner-role\` and \`design-large-task\` SKILL.md files).`

**Classification: (A) Genuinely stale — deletion candidate**

Rationale: `design-large-task` no longer exists. The `When to Call` section's "Always" list names a skill that is gone. The `start-bootstrap` description field incorrectly names it as a caller. The session-metadata commit-hash reference on line 92 points to a file that does not exist. No surviving pipeline skill calls `start-bootstrap` in the "always" slot — `design-small-task` and `design-specify` (standalone) are the actual callers. The "Always" slot is now misleading; the surviving callers belong in the "standalone only" or general caller list.

---

### 2. `skills/util-artifact-schema/SKILL.md`

**References found:**

- Line 107 (Artifact Types table, `design` row, Produced-by column): `\`design-large-task\` (8-section envelope), \`design-small-task\` (6-section lightweight)`
- Line 108 (Artifact Types table, `thinking` row, Produced-by column): `\`design-large-task\``
- Line 109 (Artifact Types table, `process` row, Produced-by column): `\`design-large-task\``
- Lines 206–208 (Stamping skills list): `- \`design-large-task\` (design briefs, thinking files)`

**Classification: (A) Genuinely stale — deletion candidate (rows); (B) Load-bearing for provenance trailers**

Detail:
- The Artifact Types table rows for `thinking` and `process` name `design-large-task` as sole producer. `design-small-task` does not produce these artifact types; no surviving skill does. These rows describe orphaned artifact types — the `thinking` and `process` artifacts were produced by `design-large-task`'s proof-MCP and process-evidence stages, neither of which exists in any surviving skill. Stale.
- The `design` row names both skills as producers; the `design-small-task` half remains accurate. The `design-large-task` half is stale.
- The Stamping skills list (lines 206–208) names `design-large-task` as a stamping skill. This is a documentation list only — no runtime code reads this list. See Question 1 below for full analysis. The list is stale as documentation; removing `design-large-task` and adding the surviving caller(s) is the correct repair.

---

### 3. `skills/execute-write/SKILL.md`

**References found:**

- Lines 22–23 (Section 1.2, Verify Worktree): `In the canonical sequence (\`design-large-task\` | \`design-small-task\` → \`design-specify\` → \`plan-build\` → execute-write), the worktree is created upstream during the design phase (by \`design-large-task\` at Archival or \`design-small-task\` at Closure) and inherited through \`design-specify\` and \`plan-build\` unchanged.`

**Classification: (C) Canonical-sequence mention**

Exact phrasing: `` `design-large-task` | `design-small-task` → `design-specify` → `plan-build` → execute-write ``

This is the canonical entry-path description. The load-bearing obligation it describes — that a worktree is created upstream during the design phase and inherited — is real and still correct for `design-small-task`. The worktree creation via `util-worktree` at Closure in `design-small-task` is confirmed in `skills/util-worktree/SKILL.md` (Integration section: "design-small-task (Closure)"). The half of the canonical sequence that survives is `design-small-task → design-specify → plan-build → execute-write`. Re-pointing candidate: drop `design-large-task |` from the pipe expression.

---

### 4. `skills/plan-build/SKILL.md`

**References found:**

- Line 19 (Task reset paragraph): `delete them all via TaskUpdate with status: \`deleted\`. This is housekeeping — do not create a tracked task for it.` — preceded by: `(e.g., design-large-task)`
  - Exact text: `If any tasks exist from a previous skill (e.g., design-large-task), delete them all via TaskUpdate with status: \`deleted\`.`
- Line 43: `**Context:** This should be run in a dedicated worktree (created by \`design-large-task\` or \`design-small-task\` during their Archival / closure stage).`
- Lines 153–154 (Ground-Truth Report Cascade): `\`design-large-task\` no longer produces a design-stage ground-truth report (architecture choice and ground-truth verification are owned by \`design-specify\`). The cascade reads only the spec-stage report when present.`
- Lines 311–312 (Integration, Spec compatibility): `reads spec documents written by \`design-specify\`, regardless of whether the upstream brief came from \`design-large-task\` (nine-section) or \`design-small-task\` (six-section) — design-specify normalizes both into the spec contract`

**Classification: Mixed — (A) + (B) + (C)**

- Line 19 (`e.g., design-large-task`): (A) Stale example. Task-reset housekeeping applies to any prior skill; `design-large-task` is no longer a valid example.
- Line 43 (`design-large-task or design-small-task`): (C) Canonical-sequence mention. Half is still accurate (`design-small-task`); half is stale (`design-large-task`). Re-pointing candidate.
- Lines 153–154: (B) Load-bearing contract. This sentence explicitly describes what `design-large-task` used to do and does NOT do. It exists as a historical explanation of the cascade's scope. The sentence's function is to state "we don't re-verify what design-specify already verified." The `design-large-task` reference here is in the past-tense explanation. After removal of `design-large-task`, this sentence loses its referent but its logical claim survives: the cascade reads only the spec-stage report. The sentence can be simplified: remove the `design-large-task` clause, preserve the cascade rule.
- Lines 311–312: (C) Canonical-sequence mention. Documents that `design-specify` normalizes both brief shapes. After removal, `design-large-task (nine-section)` is no longer a live case; `design-small-task (six-section)` and any human-written brief remain. Re-pointing candidate.

---

### 5. `skills/util-design-partner-role/SKILL.md`

**References found:**

- Line 9: `Both \`design-large-task\` and \`design-small-task\` read this file.`
- Line 96: `\`design-large-task\` captures private precision via \`capture_thought\` with tag \`private-precision\`. \`design-small-task\` uses whatever scratch note habit fits session — point = precision captured *somewhere that isn't designer-facing output*.`

**Classification: (A) Genuinely stale (line 9 half; line 96 first sentence)**

- Line 9: The "Both X and Y read this file" statement is half-stale. `design-large-task` no longer reads anything. `design-small-task` still reads this file. The surviving obligation is: `design-small-task` reads this file.
- Line 96: The `design-large-task` sentence (capture_thought with tag private-precision) describes a mechanism that no longer exists. The `design-small-task` sentence survives intact. The `design-large-task` sentence is (A) stale.

---

### 6. `skills/util-worktree/SKILL.md`

**References found:**

- Integration section (lines 199–200): `**Called by:** - **design-large-task** (Archival stage) - REQUIRED when design is approved and implementation follows`

**Classification: (A) Genuinely stale — deletion candidate**

`design-large-task` no longer exists. The Archival stage does not exist. The surviving callers are confirmed in the Integration section of the same file: `design-small-task (Closure)` and `execute-write`. The `design-large-task` bullet should be removed; the `design-small-task` bullet already present is accurate.

---

### 7. `skills/design-specify/SKILL.md`

**References found:**

- Line 3 (frontmatter description): `Use when a design brief exists (from design-large-task, design-small-task, a whiteboard, a previous session, or a human-written brief)`
- Line 18 (Entry Condition): `A design brief from \`design-large-task\` or \`design-small-task\` at \`{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md\``
- Line 48 (Standalone Invocation): `When invoked without a prior \`design-large-task\` or \`design-small-task\` session`
- Lines 233–235 (Integration, Reads): `the upstream brief's source template: \`../design-large-task/references/design-brief-template.md\` (9-section envelope including Concerns and Resolve Conditions) or \`../design-small-task/references/design-brief-small-template.md\` (6-section lightweight) — read whichever matches the upstream design skill that produced the brief`
- Line 237 (Integration, Invoked by): `**Invoked by:** \`design-large-task\` or \`design-small-task\` (mandatory in the canonical sequence), or user directly (standalone)`

**Classification: (A) + (C) mixed**

- Line 3 (description): (C) Canonical-sequence mention. `design-large-task` listed as a source of briefs. After removal, `design-small-task` plus external/human-written briefs cover all surviving cases. Re-point.
- Line 18: (C) Canonical-sequence mention in Entry Condition. Re-point: remove `design-large-task` from the "from" list; path convention still accurate for `design-small-task`.
- Line 48: (C) Re-point.
- Lines 233–235: (A) Stale file reference. `skills/design-large-task/references/design-brief-template.md` does not exist. The file does not exist. Keeping this reference causes the skill to read a non-existent path. Deletion candidate for the `design-large-task` half; the `design-small-task` half path is correct.
- Line 237: (C) Canonical-sequence mention. Re-point.

---

### 8. `skills/design-small-task/references/design-brief-small-template.md`

**References found:**

- Lines 20–23: `Use the full \`design-large-task template (\`../../design-large-task/references/design-brief-template.md\`)\` when: - The task is complex or ambiguous - Multiple briefs interact (companion briefs, prior art chains) - The brief is produced by design-large-task and must match its 9-section envelope+point structure (see \`design-large-task template (\`../../design-large-task/references/design-brief-template.md\`)\`)`
- Lines 138–139: `These sections exist in the full \`design-large-task template (\`../../design-large-task/references/design-brief-template.md\`)\` and are omitted here with rationale:`

**Classification: (A) Genuinely stale — deletion candidate**

Both references point to `../../design-large-task/references/design-brief-template.md` which does not exist. The "When to Use" section tells the reader to use a non-existent full template when conditions call for it. After removal, this section must be rewritten: the guidance for complex/ambiguous tasks should point to `design-committee` or `design-grillme`, not to a deleted skill.

---

### 9. `skills/finish-write-records/references/record-formats.md`

**References found:**

- Lines 193: `stage: design-large-task | design-small-task | design-specify | plan-build | execute-write | finish-write-records`

**Classification: (B) Load-bearing contract**

This is a YAML field definition in the Decision Record shape. The `stage` field enumerates the skills where decisions crystallize. Removing `design-large-task` from this enumeration changes the valid values for the `stage` field in all decision records. Existing archived decision records carrying `stage: design-large-task` would become inconsistent with the new enumeration. However, this is pure documentation — the Decision Record Format is read by `finish-write-records` as a format reference; no runtime code parses or validates this enum. The load-bearing obligation: existing records already written with `stage: design-large-task` are factual history. The enumeration in the format doc should reflect surviving stages; `design-large-task` can be removed from the pipe-separated list without invalidating prior records (the format doc describes what to write going forward, not a schema validator).

**Net classification: (A) stale as a forward-facing enum value** — removal is safe; past records remain valid as historical fact.

---

### 10. `agents/agent-industry-explorer.md`

**References found:**

- Line 7 (body text): `You are the **industry explorer** dispatched from a design session for parallel content exploration for use in architecture planning.`
- No explicit `design-large-task` name appears in the file body.

**Classification: (A) Genuinely stale (indirect)**

The agent's system prompt (line 7) says it is "dispatched from a design session" — this is generic enough to survive. However, looking at `docs/fork-policy.md` row 1c, the agent's registered invocation name is `chester:design-large-task-industry-explorer`. The agent's own filename is `agent-industry-explorer.md` — which would map to `chester:agent-industry-explorer`. The fork-policy row (1c) references a named subagent `chester:design-large-task-industry-explorer` that does NOT correspond to this file. This file itself carries no direct `design-large-task` text; it is effectively a generic industry explorer. The relationship between this file and the fork-policy row 1c is broken (the named subagent `chester:design-large-task-industry-explorer` does not have a backing agent file).

**Direct finding:** The file `agent-industry-explorer.md` itself does not contain the string `design-large-task`. It is not directly stale by that criterion. Its connection to `design-large-task` exists only via the fork-policy table, which is addressed separately (item 11 below).

---

### 11. `docs/fork-policy.md`

**References found:**

- Row 1a: `design-large-task codebase explorer | feature-dev:code-explorer`
- Row 1b: `design-large-task prior-art explorer | Explore`
- Row 1c: `design-large-task industry explorer | chester:design-large-task-industry-explorer`
- Row 1d: `design-large-task step-b innovator | chester:design-large-task-step-b-innovator`
- Row 1e: `design-large-task step-b conservator | chester:design-large-task-step-b-conservator`
- Row 1f: `design-large-task step-b purist | chester:design-large-task-step-b-purist`
- Row 1g: `design-large-task step-b pragmatist | chester:design-large-task-step-b-pragmatist`

**Classification: (A) Genuinely stale — deletion candidates**

All seven rows (1a–1g) describe dispatch sites inside `design-large-task`. The skill does not exist. No surviving skill dispatches these agents:
- `feature-dev:code-explorer` — not dispatched by any surviving skill in the Chester pipeline (may be used by `feature-dev` plugin separately).
- `Explore` — may be used generically, but not as a Chester-managed dispatch site.
- `chester:design-large-task-industry-explorer` — no backing agent file exists under this name in `agents/`. No surviving skill dispatches it.
- `chester:design-large-task-step-b-innovator/conservator/purist/pragmatist` — no backing agent files exist. These were the four committee poles dispatched by `design-large-task`'s step-b. The surviving committee poles are dispatched by `design-committee` skill and live in `agents/design-committee-*.md`. See Question 2 below.

---

### 12. `docs/instructions.md`

**References found:**

- Line 168 (pipeline flow diagram): `design-large-task OR design-small-task OR design-figure-out`
- Lines 219–247 (`chester:design-large-task` section): Full skill description section present (lines 219–247 approx.)
- Line 300 (design-specify description): `Takes the design brief from \`design-large-task\` or \`design-figure-out\``
- Line 699 (Skill Quick Reference table): `design-large-task | Design | Before any creative work — the preferred design skill`
- Line 738 (When to use table): rows mentioning `design-large-task`
- Line 754 (Design brief templates): `\`skills/design-large-task/references/design-brief-template.md\` — 8-section envelope`

**Classification: (A) Genuinely stale — deletion candidates (all)**

`docs/instructions.md` is the user-facing manual. The `design-large-task` section (lines 219–247) describes a skill that no longer exists. The pipeline diagram, the quick reference table, and the design-specify description all reference a dead skill. All `design-large-task` mentions in `docs/instructions.md` are stale. The `design-figure-out` reference in line 168 is separately stale (that skill also appears to be archived per `test-artifact-schema.sh` line 10).

---

## Four Pinning Tests — Exact Greps

### `tests/test-plan-build-heuristic.sh`

Line 65-67:
```bash
# Must reference design-large-task in the ground-truth cascade context
# (the cascade survives through design-specify because both write into the same
# sprint subdirectory)
if ! grep -q "design-large-task" "$SKILL"; then
  echo "FAIL: $SKILL does not reference design-large-task in cascade context"
  ERRORS=$((ERRORS + 1))
fi
```

This test asserts `design-large-task` must appear in `skills/plan-build/SKILL.md`. Currently satisfied by the Ground-Truth Report Cascade section (lines 153–154). If those lines are deleted/reworded to remove `design-large-task`, this test FAILS. The test must be updated in lockstep with any edits to `plan-build/SKILL.md`.

---

### `tests/test-artifact-schema.sh`

Lines 17-21:
```bash
for producer in "design-large-task" "design-small-task" "design-specify" "plan-build" "execute-write" "finish-write-records"; do
  if ! grep -q "$producer" "$SCHEMA"; then
    echo "FAIL: $SCHEMA does not list $producer as producer"
    ERRORS=$((ERRORS + 1))
  fi
done
```

This test asserts `design-large-task` must appear in `skills/util-artifact-schema/SKILL.md`. Currently satisfied by the Artifact Types table (lines 107–109) and Stamping skills list (line 206). If both occurrences are removed, this test FAILS. The test must be updated in lockstep.

---

### `tests/test-artifact-schema-provenance.sh`

Lines 24-26:
```bash
for skill in design-large-task design-small-task design-specify plan-build execute-write finish-write-records; do
  grep -q "$skill" "$SCHEMA" || fail "stamping-skill list missing $skill"
done
```

This test asserts `design-large-task` must appear in the stamping-skill list in `skills/util-artifact-schema/SKILL.md`. Currently satisfied by line 206 of the schema. If that line is removed, this test FAILS. The test must be updated in lockstep.

---

### `tests/test-ac-4-1-fork-policy-pole-rows.sh`

Lines 6-11:
```bash
for pole in innovator conservator purist pragmatist; do
  AGENT_REF="chester:design-large-task-step-b-${pole}"
  grep -F "$AGENT_REF" "$POLICY" > /dev/null || { echo "FAIL: $POLICY does not document $AGENT_REF dispatch"; ERRORS=$((ERRORS+1)); }
done
ROW_COUNT=$(grep -c 'step-b' "$POLICY" || true)
[ "$ROW_COUNT" -ge 4 ] || { echo "FAIL: expected >=4 rows mentioning step-b, found $ROW_COUNT"; ERRORS=$((ERRORS+1)); }
grep -E -i "framing.side|framing-side|framing dispatch" "$POLICY" > /dev/null || { echo "FAIL: framing-side rationale not present"; ERRORS=$((ERRORS+1)); }
```

This test asserts `docs/fork-policy.md` must contain `chester:design-large-task-step-b-{innovator,conservator,purist,pragmatist}` and at least 4 rows mentioning `step-b`, and must contain the string "framing-side" or "framing dispatch". All currently satisfied by rows 1d–1g. If those rows are removed, ALL THREE assertions FAIL. The test was written to verify the step-b pole dispatch mechanism exists in `design-large-task`. After removal, if the committee poles are now in `design-committee`, the test should be rewritten to verify `chester:design-committee-{innovator,conservator,purist,pragmatist}` in `docs/fork-policy.md` instead — but that requires adding those rows to the policy table first.

---

## Question 1: util-artifact-schema Producer List — Runtime vs. Documentation

**Finding: The producer list is pure documentation. No runtime code reads it.**

Evidence:
- The Artifact Types table in `util-artifact-schema/SKILL.md` (lines 104–115) is a Markdown table. It exists for human/agent reference only.
- No script or hook in the Chester codebase reads this table to generate behavior. The table's "Produced by" column informs agents which skill should call `chester-trailer-write stamp <skill>@<version>` — but the actual call is made by the skills themselves at their own write sites.
- Provenance trailers in archived artifacts carry `<!-- produced-by design-large-task@vNNNN -->` lines if they were stamped by `design-large-task` during an active session. Those trailer lines are already written into the artifact files. They are not generated from the schema table.
- `chester-trailer-write harvest` walks existing `.md` files and extracts `produced-by` lines from trailers already present. It does not consult the schema table.

**Conclusion:** Dropping `design-large-task` from the producer list in the schema table does NOT orphan provenance trailers in archived artifacts. Trailers already written into artifacts carry their own history independent of the schema table. The schema table is documentation of which skill should stamp going forward — not a registry that `harvest` reads. No orphaning occurs.

---

## Question 2: docs/fork-policy.md Step-B Pole-Agent Rows — Dead Mechanism or Surviving Under Another Skill?

**Finding: The step-b pole-agent mechanism survives under `design-committee`, but with DIFFERENT agent names and a DIFFERENT dispatch structure.**

Evidence:
- `agents/design-large-task-step-b-innovator.md`, `design-large-task-step-b-conservator.md`, `design-large-task-step-b-purist.md`, `design-large-task-step-b-pragmatist.md` — none of these files exist.
- `agents/design-committee-innovator.md`, `design-committee-conservator.md`, `design-committee-purist.md`, `design-committee-pragmatist.md` — all four exist.
- `docs/fork-policy.md` rows 1d–1g reference `chester:design-large-task-step-b-*` names. These map to non-existent agent files.
- The surviving committee poles are registered as `chester:design-committee-*` (based on the agents/ filename convention documented in `agents/CLAUDE.md`: `{skill}-{role}.md` → invoked as `chester:{skill}-{role}`).

**Conclusion:** The mechanism (four-pole advocacy committee) survives, but the fork-policy rows 1d–1g describe a dead instantiation of it. The named subagents referenced (`chester:design-large-task-step-b-*`) do not exist. The surviving equivalents are `chester:design-committee-{innovator,conservator,purist,pragmatist}`. Rows 1d–1g are (A) stale as written; the surviving mechanism should be documented with new rows for `design-committee`.

Additionally: rows 1a–1c describe dispatch sites for exploration/research agents that were embedded in `design-large-task` only. The `design-committee` skill may or may not dispatch equivalent exploration agents — the researcher did not find equivalent dispatch rows in `design-committee/SKILL.md` during this pass (that skill was not in the twelve-file list). These three rows (1a–1c) are stale regardless.

---

## Bucket Summary

| Bucket | Count | Files |
|--------|-------|-------|
| (A) Genuinely stale | 8 | start-bootstrap (all 3 refs), util-artifact-schema (thinking/process rows + stamping list entry), execute-write (none — see C), util-design-partner-role (line 9 half + line 96 first sentence), util-worktree (Integration bullet), design-specify (lines 233–235 file ref), design-brief-small-template (lines 20–23 + 138–139), record-formats (stage enum entry), agents/agent-industry-explorer (via fork-policy indirect), docs/fork-policy (rows 1a–1g), docs/instructions (full design-large-task section + all references) |
| (B) Load-bearing contract | 1 | plan-build lines 153–154 (cascade explanation — survives but `design-large-task` clause can be simplified) |
| (C) Canonical-sequence mention | 5 | execute-write (line 22–23), plan-build (line 43 + lines 311–312), design-specify (line 3, 18, 48, 237), util-design-partner-role (line 9 surviving half) |

Note: Several files span multiple buckets; file count above is by unique file, not by reference instance.
