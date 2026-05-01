# Plan: Decision Record System Replacement

**Sprint:** `20260501-01-fix-decision-record`
**Spec:** `docs/chester/working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md`
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). Header is `subagent` (safe default for the mix of complexity in this plan). Per-task `Complexity:` annotations let the operator drop into inline mode at runtime for `simple`-tagged tasks where review-independence overhead is not worth it. `complex` and `moderate` tasks should run subagent.

## Goal

Surgically remove the 2026-04-24 build-decision-loop merge and replace the decision-record mechanism with a parent-orchestrated parallel fork in `finish-write-records`: primary resolves the session JSONL once, two subagents fork from it, one writes the reasoning audit, the other appends YAML-frontmatter records to a single cross-sprint corpus.

## Architecture

Inherited from spec. Two-fork pattern at `finish-write-records` Step 3, sharing transcript context via `CLAUDE_CODE_FORK_SUBAGENT=1`. Each fork applies its own filter (audit-altitude vs records-altitude) over the same JSONL source. Records corpus is single-file, append-only, at `docs/chester/decision-record/decision-record.md`. No MCP, no TDD-loop participation, no mid-stage capture. Surgical revert preserves every post-04-24 keep-bucket change.

## Tech Stack

- **Bash** — test scripts and file-deletion operations (matching existing `tests/` convention).
- **YAML** — record frontmatter format (parsed via grep / sed / python -c yaml.safe_load if available).
- **Markdown** — skill documents, reference files, the corpus file itself.
- **Git** — surgical-revert reference is commit `96ea360` (2026-04-24); use `git show` to extract exact removed text.

## Prior Decisions

None.

---

## Task 1: Create decision-record-filter.md reference file

**Type:** docs-producing
**Complexity:** simple
**Implements:** AC-2.3, AC-2.4, AC-2.5, AC-3.3
**Decision budget:** 2 (canonical tag list selection; supersession discovery wording)
**Must remain green:** none (new reference file; no test depends on it yet)

**Files:**
- Create: `skills/finish-write-records/references/decision-record-filter.md`

**Steps (TDD-adapted: docs-first):**

- [ ] **Step 1: Write the file's intended contract as inline test commentary**

The file must specify three things: (a) records-altitude discrimination criteria, (b) canonical tag list, (c) supersession discovery procedure. No test code; the file's existence + content shape is the verification target.

- [ ] **Step 2: Verify the file does not yet exist**

```bash
test ! -f skills/finish-write-records/references/decision-record-filter.md && echo "OK: file absent"
```

Expected: `OK: file absent`

- [ ] **Step 3: Write the file**

Create `skills/finish-write-records/references/decision-record-filter.md` with this content:

```markdown
# Decision Record Discrimination Filter

The records-fork applies this filter over the session JSONL transcript at `finish-write-records` Step 3. Independent of the audit-altitude filter in `record-formats.md` — a decision selected by one need not be selected by the other.

## What qualifies as a record-worthy decision

A decision belongs in the cross-sprint record when it has any of these signals:

- **Cross-sprint precedent.** The decision sets a convention or pattern that future sprints will likely consult ("we decided to do X this way, future work should follow / override deliberately").
- **Architectural commitment.** A choice between structural alternatives whose reversal would require non-trivial future work — directory layout, file format, integration boundary, naming convention.
- **Constraint adoption.** A new rule that binds future implementations ("no MCP", "append-only", "single-file corpus").
- **Capability deletion or deprecation.** Removing a feature, system, or path that future agents must know is gone.
- **Substantive rejection.** An alternative that was seriously considered and rejected with rationale that future agents may need ("we tried Y, it broke for reason Z").

## What does NOT qualify

- **Mechanical execution choices.** "Use sed to remove these lines" — implementation hygiene, not precedent.
- **Routine debugging decisions.** "Fixed typo in line 42" — code-state, not cross-sprint signal.
- **Style or formatting preferences.** "Use bullets, not tables" — captured in feedback memory or coding conventions, not records.
- **In-session navigation.** "Read file X first" — session-internal, not cross-sprint.

## Canonical tag list

When assigning the `tags` field, use a tag from this list when it fits the decision's domain. Add new tags only when no existing tag matches; new tags must be added to this list in the same emission pass.

- `architecture` — structural commitments
- `convention` — naming, formatting, layout rules
- `mcp` — MCP-server choices (use, removal, replacement)
- `skill` — skill-file structure or behavior
- `revert` — explicit removal of prior mechanism
- `format` — file format / record shape decisions
- `process` — workflow / cadence decisions
- `tool` — tooling choices (test framework, language, dependency)
- `capture` — decision-record-system meta-decisions
- `audit` — audit-system meta-decisions
- `worktree` — worktree / branch management
- `governance` — rules, gates, approval flows

## Record id format

Each record's `id` field follows the format:

```
dr-YYYYMMDD-NN-<slug>
```

- `YYYYMMDD` — emission date
- `NN` — zero-padded sequence number scoped to that emission date (the records fork emits `01`, `02`, ... within a single pass)
- `<slug>` — short hyphenated noun phrase derived from the decision's title (e.g., `fork-pattern-emission`, `mcp-removal`)

Example: `dr-20260501-01-fork-pattern-emission`.

## Supersession discovery

Records are append-only; older records are never modified when superseded. To find what (if anything) supersedes a given record id, awk-scan forward and capture the most recent `id:` value preceding any `supersedes:` line that names the target id:

```bash
awk -v target="dr-<id>" '
  /^id: / { last_id = $2 }
  $0 == "supersedes: " target { print last_id; exit }
' docs/chester/decision-record/decision-record.md
```

The output (if any) is the id of the superseding record. The grep alternative `grep -B1 "^supersedes: dr-<id>$"` does NOT work because YAML field order places `tags:` immediately before `supersedes:`, so `-B1` returns the tags line, not the id. Use awk or `grep -B 12` to scan back far enough to capture the id.

Multiple superseders are possible across time (a chain B → A, then C → B); follow the chain forward to find the current authoritative record. If no match, the queried record is current.

## Output discipline

- One record per substantive decision. Do not emit one record covering five decisions; do not emit five records covering one decision.
- 11 required fields per record (see `record-formats.md` Decision Record Format section). Empty-but-present is acceptable for `supersedes` and `artifact_refs`; all other fields must carry content.
- Append in chronological order within the emission pass (oldest decision first).
- Do not modify any record that already exists in the corpus.
```

- [ ] **Step 4: Verify the file is present and contains the canonical tag list**

```bash
grep -q "architecture" skills/finish-write-records/references/decision-record-filter.md && \
grep -q "dr-YYYYMMDD-NN-<slug>" skills/finish-write-records/references/decision-record-filter.md && \
echo "OK: filter file shape verified"
```

Expected: `OK: filter file shape verified`

- [ ] **Step 5: Commit**

```bash
git add skills/finish-write-records/references/decision-record-filter.md
git commit -m "feat: add decision-record-filter reference for records-fork discrimination"
```

---

## Task 2: Append Decision Record Format section to record-formats.md

**Type:** docs-producing
**Complexity:** simple
**Implements:** AC-2.1, AC-2.2, AC-2.5
**Decision budget:** 1 (exact field-list ordering)
**Must remain green:** none (the format-emission test in Task 3 depends on this content)

**Files:**
- Modify: `skills/finish-write-records/references/record-formats.md` (append new section after existing content)

**Steps (TDD-adapted: docs-first):**

- [ ] **Step 1: Verify current line count is 176 (baseline)**

```bash
wc -l skills/finish-write-records/references/record-formats.md
```

Expected: `176` lines.

- [ ] **Step 2: Append the new section**

Append the following content to the end of `skills/finish-write-records/references/record-formats.md`:

````markdown

---

# Decision Record Format

The records-fork at `finish-write-records` Step 3 emits records to `docs/chester/decision-record/decision-record.md` in this exact YAML-frontmatter shape. See `decision-record-filter.md` for the discrimination criteria, canonical tag list, id format, and supersession procedure.

## Shape

Each record is a YAML frontmatter block separated from neighbors by exactly one blank line. The eleven required fields appear in this order:

```yaml
---
id: dr-YYYYMMDD-NN-<slug>
date: YYYY-MM-DD
sprint: YYYYMMDD-##-verb-noun-noun
stage: design-large-task | design-small-task | design-specify | plan-build | execute-write | finish-write-records
title: Short noun phrase
decision: One sentence capturing what was decided
rationale: Two-to-four sentences explaining why
alternatives:
  - Alternative A — rejected because <reason>
  - Alternative B — rejected because <reason>
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/<sprint>/design/<file>.md
  - working/<sprint>/spec/<file>.md
---
```

## Field semantics

- **id** — globally unique, follows `dr-YYYYMMDD-NN-<slug>` (see `decision-record-filter.md`).
- **date** — emission date (ISO 8601, `YYYY-MM-DD`).
- **sprint** — the sprint in which the decision was made.
- **stage** — the skill where the decision crystallized (e.g., the design-large-task Solve Stage round, or the plan-build task-mapping step).
- **title** — short noun phrase (5-10 words). Not a sentence.
- **decision** — one declarative sentence. Active voice. No hedging.
- **rationale** — two-to-four sentences. Explains why the decision was made; references constraints, evidence, prior art if relevant.
- **alternatives** — list of considered-and-rejected options with one-line rejection rationale each. May be empty list `[]` if no real alternatives existed.
- **tags** — list of canonical tags (see `decision-record-filter.md`). Minimum one tag.
- **supersedes** — either `null` (no prior record) or the `id` of the record this one supersedes. Forward-only; the prior record is not modified.
- **artifact_refs** — list of session-artifact paths whose content corroborates the record. May be empty list `[]`.

## Example record

```yaml
---
id: dr-20260501-01-fork-pattern-emission
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Audit-time records emission via parallel fork
decision: Records are emitted at finish-write-records Step 3 via a second forked subagent that inherits the parent's JSONL transcript and applies an independent records-altitude filter.
rationale: The audit fork already discriminates substantive decisions from the JSONL transcript. Forking a second subagent from the same parent reuses the discrimination machinery while letting each filter tune to its own altitude. Avoids MCP cost (RULE-9) and TDD-loop participation (RULE-11).
alternatives:
  - Per-decision MCP capture at each substantive moment in design-specify and plan-build — rejected because it requires new skill steps at every decision point and duplicates the audit's discrimination judgment.
  - Single-fork emission at end of design-specify only — rejected because it fragments capture across skill points and misses execute-write decisions.
tags: [architecture, capture, mcp]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/design/fix-decision-record-design-00.md
  - working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md
---
```

## Append discipline

- New records append at the end of the corpus file. Prior records are never modified.
- Within a single emission pass, records are written in chronological order (oldest decision first).
- Exactly one blank line between adjacent records. The first record in the file follows the file's existing `.gitkeep`-replacing header (if any) by one blank line; alternatively the file may have no header and start directly with the first record's `---` line.
- Do not validate the file end with a trailing newline beyond what the editor naturally produces; AC-3.2 requires byte-identical preservation of prior records, not byte-identical file tail.
````

- [ ] **Step 3: Verify the section appended cleanly**

```bash
grep -c "^# Decision Record Format$" skills/finish-write-records/references/record-formats.md
```

Expected: `1`.

- [ ] **Step 4: Verify the eleven fields are documented**

```bash
for field in id date sprint stage title decision rationale alternatives tags supersedes artifact_refs; do
  grep -q "^- \*\*$field\*\*" skills/finish-write-records/references/record-formats.md || echo "MISSING: $field"
done
echo "DONE"
```

Expected: only `DONE`, no `MISSING:` lines.

- [ ] **Step 5: Commit**

```bash
git add skills/finish-write-records/references/record-formats.md
git commit -m "feat: append Decision Record Format section to record-formats.md"
```

---

## Task 3: Write emission format-conformance bash test

**Type:** code-producing
**Complexity:** moderate
**Implements:** AC-1.3, AC-2.1, AC-2.2, AC-2.3, AC-3.1, AC-3.2
**Decision budget:** 2 (parser choice — grep vs python-yaml; fixture corpus shape)
**Must remain green:** `tests/test-decision-record-emission.sh` (this task's own test)

**Files:**
- Create: `tests/test-decision-record-emission.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `tests/test-decision-record-emission.sh` with the following content. This is a format-conformance test: it constructs a fixture corpus that the records-fork *should* produce, validates the YAML-frontmatter shape is well-formed, and asserts the eleven required fields appear in each record. The test does NOT invoke a real records-fork subagent; it validates the format spec directly.

```bash
#!/usr/bin/env bash
# test-decision-record-emission.sh — verify Decision Record Format conformance
set -euo pipefail

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
CORPUS="$TMPDIR/decision-record.md"

# Build a fixture corpus with two records matching the spec shape.
cat > "$CORPUS" <<'EOF'
---
id: dr-20260501-01-fork-pattern-emission
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Audit-time records emission via parallel fork
decision: Records are emitted at finish-write-records Step 3 via a second forked subagent.
rationale: The audit fork already discriminates substantive decisions from the JSONL transcript. Forking a second subagent reuses the machinery.
alternatives:
  - Per-decision MCP capture — rejected because MCP is forbidden by RULE-9.
tags: [architecture, capture]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md
---

---
id: dr-20260501-02-mcp-removal
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Remove chester-decision-record MCP package
decision: The chester-decision-record MCP server is removed entirely, including all dr_* tools.
rationale: RULE-9 forbids MCP usage for capture. The package was inverse-coupled to good upstream design and never fired in production.
alternatives:
  - Soft-disable via flag — rejected because silent inertness is dangerous (industry pattern).
tags: [mcp, revert, capture]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/design/fix-decision-record-design-00.md
---
EOF

# Assertion 1: file is well-formed (each record bounded by --- markers).
DELIM_COUNT=$(grep -c '^---$' "$CORPUS")
if [ "$DELIM_COUNT" -ne 4 ]; then
  echo "FAIL: expected 4 '---' delimiters (2 records × 2 each), got $DELIM_COUNT" >&2
  exit 1
fi

# Assertion 2: each record contains all 11 required fields.
REQUIRED_FIELDS=(id date sprint stage title decision rationale alternatives tags supersedes artifact_refs)
RECORD_COUNT=$((DELIM_COUNT / 2))
for field in "${REQUIRED_FIELDS[@]}"; do
  field_count=$(grep -c "^${field}:" "$CORPUS")
  if [ "$field_count" -ne "$RECORD_COUNT" ]; then
    echo "FAIL: field '$field' appears $field_count times, expected $RECORD_COUNT (one per record)" >&2
    exit 1
  fi
done

# Assertion 3: append-only invariant — append a third record and verify the first two are unchanged byte-for-byte.
ORIG_HASH=$(sha256sum "$CORPUS" | cut -d' ' -f1)
ORIG_BYTES=$(wc -c < "$CORPUS")

cat >> "$CORPUS" <<'EOF'

---
id: dr-20260501-03-cooperative-coexistence
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Records cooperate with session artifacts, do not replace
decision: The records corpus and session artifacts both exist; both can contain duplicate information.
rationale: Session artifacts serve session-internal recall; records serve cross-sprint trend-finding. Different purposes, complementary surfaces.
alternatives:
  - Records replace audit — rejected because audit is session-recall-anchored and tunable independently.
tags: [architecture, capture]
supersedes: null
artifact_refs: []
---
EOF

# Verify the original two records are still present byte-for-byte at the start of the file.
PREFIX=$(head -c "$ORIG_BYTES" "$CORPUS")
PREFIX_HASH=$(echo -n "$PREFIX" | sha256sum | cut -d' ' -f1)
if [ "$PREFIX_HASH" != "$ORIG_HASH" ]; then
  echo "FAIL: append modified the prefix (append-only invariant violated)" >&2
  exit 1
fi

# Assertion 4: id format conforms to dr-YYYYMMDD-NN-<slug>.
while IFS= read -r line; do
  if ! [[ "$line" =~ ^id:\ dr-[0-9]{8}-[0-9]{2}-[a-z0-9-]+$ ]]; then
    echo "FAIL: id line does not match format: $line" >&2
    exit 1
  fi
done < <(grep '^id:' "$CORPUS")

echo "PASS: emission format conformance verified"
```

Make it executable:

```bash
chmod +x tests/test-decision-record-emission.sh
```

- [ ] **Step 2: Run the test (it should pass — the fixture is hand-crafted to conform)**

```bash
bash tests/test-decision-record-emission.sh
```

Expected: `PASS: emission format conformance verified`

This test is unusual in that it passes from the start — it's a format-conformance test against a self-contained fixture, not an integration test against the records-fork. The fork itself is exercised at the end of THIS sprint when `finish-write-records` runs, by which point the new emission code lands in Task 4. The conformance test continues to guard the format against regressions in Tasks 1, 2, and any future format changes.

- [ ] **Step 3: (no implementation step — the test passes against the fixture)**

The format spec is in `record-formats.md` (Task 2) and the filter file (Task 1). No additional code is required; this task ships the test alone.

- [ ] **Step 4: Run all bash tests in the suite to confirm no regression**

```bash
for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 && echo "PASS: $t" || echo "FAIL: $t"; done | tee /tmp/test-output.txt
grep -q FAIL /tmp/test-output.txt && exit 1
echo "OK: all tests pass"
```

Expected: every test reports PASS; final line `OK: all tests pass`.

- [ ] **Step 5: Commit**

```bash
git add tests/test-decision-record-emission.sh
git commit -m "test: format-conformance bash test for Decision Record emission"
```

---

## Task 4: Restructure finish-write-records Step 3 as parent-orchestrated parallel fork

**Type:** docs-producing
**Complexity:** complex
**Implements:** AC-1.1, AC-1.2, AC-1.3, AC-4.6, AC-4.6a
**Decision budget:** 3 (exact wording for fork dispatch instructions; step renumbering rationale; partial-failure handling phrasing)
**Must remain green:** `tests/test-decision-record-emission.sh`

**Files:**
- Delete: `tests/test-finish-write-records-update.sh` (greps the SKILL.md for `dr_audit`; coupled to the Step-4 block being removed; deleting it atomically with the SKILL.md edit prevents the full-suite verification at Step 5 from failing).
- Modify: `skills/finish-write-records/SKILL.md` — restructure Step 3 Reasoning Audit subsection (lines 154-186) as parent-orchestrated parallel dispatch; delete Step 4 entirely (lines 236-269); renumber Steps 5/6/7 to Steps 4/5/6; bump `version: v0002` → `version: v0003` in frontmatter.

**Steps (TDD-adapted):**

- [ ] **Step 0: Delete the coupled validator test**

```bash
git rm tests/test-finish-write-records-update.sh
```

This test exists to validate the OLD Step 4 (`dr_audit` block); since the task removes that block, the test must go atomically.

- [ ] **Step 1: Verify current Step 4 starts at line 236**

```bash
grep -n "^## Step 4: Decision-Record Audit" skills/finish-write-records/SKILL.md
```

Expected: `236:## Step 4: Decision-Record Audit and Abandonment (feature mode only)`

- [ ] **Step 2: Restructure Step 3 Reasoning Audit subsection**

Replace the existing `### Reasoning Audit (both modes)` subsection (lines 154-186) with:

````markdown
### Reasoning Audit and Decision Records (both modes — parallel fork)

**Source:** the session JSONL transcript is the authoritative source for both outputs, not conversation context. Locate it once on the primary agent:

```bash
SESSION_DIR="$HOME/.claude/projects/$(echo "$PWD" | sed 's|/|-|g; s|^-||')"
LATEST_JSONL=$(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null | head -1)
```

After resolving the path, dispatch **two subagents in parallel** in a single message — both inherit the parent transcript via `CLAUDE_CODE_FORK_SUBAGENT=1`. Each fork applies its own discrimination filter over the same JSONL source; filters are independent and may select different decisions.

**Fork A — Reasoning Audit.** Applies the audit-altitude filter described below; writes `summary/<sprint>-audit-NN.md` with the existing Reasoning Audit Format from `references/record-formats.md`; stamps a provenance trailer.

**Fork B — Decision Records.** Applies the records-altitude filter from `references/decision-record-filter.md`; appends one or more YAML-frontmatter record blocks to `docs/chester/decision-record/decision-record.md` (the cross-sprint corpus); does NOT stamp a provenance trailer (the corpus is cross-sprint, not a sprint artifact).

The two outputs are parallel, not sequenced. A decision selected by one fork need not be selected by the other.

#### Audit-altitude filter (Fork A guidance)

Parse chronologically. Identify 4-12 non-trivial decision points — moments where the agent made a real choice among alternatives. For each, reconstruct: context, information used, alternatives considered, decision, rationale, and confidence level.

Order entries by significance (most consequential first), not chronologically.

**What qualifies:**
- Deviation from plan
- Implementation detail choice among alternatives
- Information-driven choice (read/grepped then chose based on findings)
- Explicit rejection of an approach

**What does not qualify:**
- Mechanical execution with only one reasonable choice
- Tool calls with no decision content
- Trivial style choices

After Fork A writes the audit file, it stamps the trailer:

```bash
chester-trailer-write stamp finish-write-records@<this-skill-version> "<audit-path>"
```

#### Records-altitude filter (Fork B guidance)

See `references/decision-record-filter.md` for the full discrimination criteria, canonical tag list, id format, and supersession discovery procedure. Summary: a decision belongs in the cross-sprint corpus when it sets cross-sprint precedent, makes an architectural commitment, adopts a constraint, deletes/deprecates a capability, or rejects a substantive alternative.

The records corpus path is fixed at `docs/chester/decision-record/decision-record.md`. New records append at the end; older records are never modified. Each record carries the eleven structured fields documented in `references/record-formats.md` (Decision Record Format section).

Fork B does NOT stamp a provenance trailer on the corpus file.

#### Partial-failure handling (primary)

After both forks return, the primary collects status:

- **Both succeed:** continue to Step 4.
- **One fails, one succeeds:** report which output exists, which is missing, why the failed fork errored. The succeeded artifact is not rolled back. The user can rerun the failing fork manually.
- **Both fail:** report both errors. No partial state to roll back.
- **JSONL transcript path resolution fails (before forking):** abort, report the resolution failure, do not dispatch either fork.
````

- [ ] **Step 3: Delete Step 4 (Decision-Record Audit and Abandonment) and renumber subsequent steps**

Remove lines 236-271 inclusive (the entire `## Step 4: Decision-Record Audit and Abandonment (feature mode only)` section, including its content, abandonment subsection, and the trailing `---` separator if present).

Then renumber the surviving steps:
- `## Step 5: Copy Implementation Plan (feature mode only)` → `## Step 4: Copy Implementation Plan (feature mode only)`
- `## Step 6: Offer Session State Update` → `## Step 5: Offer Session State Update`
- `## Step 7: Commit (refactor mode only)` → `## Step 6: Commit (refactor mode only)`

Use a single `sed` command for the renumber:

```bash
sed -i 's/^## Step 5: Copy Implementation Plan/## Step 4: Copy Implementation Plan/' skills/finish-write-records/SKILL.md
sed -i 's/^## Step 6: Offer Session State Update/## Step 5: Offer Session State Update/' skills/finish-write-records/SKILL.md
sed -i 's/^## Step 7: Commit/## Step 6: Commit/' skills/finish-write-records/SKILL.md
```

- [ ] **Step 4: Verify the file post-edit**

```bash
# No Step 7 should remain
grep -c "^## Step 7:" skills/finish-write-records/SKILL.md
# Expected: 0

# No dr_audit / dr_abandon references should remain
grep -c "dr_audit\|dr_abandon" skills/finish-write-records/SKILL.md
# Expected: 0

# Step sequence now goes 1, 2, 3, 4, 5, 6
grep -E "^## Step [0-9]+:" skills/finish-write-records/SKILL.md
# Expected: six lines, Steps 1-6 in order

# Run the format-conformance test (must still pass — this task did not regress format)
bash tests/test-decision-record-emission.sh
# Expected: PASS

# Run all tests
for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 || echo "FAIL: $t"; done
# Expected: no FAIL lines
```

- [ ] **Step 4b: Bump skill version**

In `skills/finish-write-records/SKILL.md` frontmatter, change:

```yaml
version: v0002
```

to:

```yaml
version: v0003
```

Provenance trailers stamped by this skill after this task carry the v0003 marker, reflecting the new fork-pattern behavior.

- [ ] **Step 5: Commit**

`git rm` from Step 0 already staged the test deletion; commit picks it up alongside the SKILL.md changes:

```bash
git add skills/finish-write-records/SKILL.md
git commit -m "feat: restructure finish-write-records Step 3 as parent-orchestrated parallel fork"
```

---

## Task 5: Write supersession-by-forward-scan bash test

**Type:** code-producing
**Complexity:** simple
**Implements:** AC-3.3
**Decision budget:** 1 (awk pattern for forward-scan)
**Must remain green:** `tests/test-decision-record-supersession.sh` (this task's own test)

**Files:**
- Create: `tests/test-decision-record-supersession.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `tests/test-decision-record-supersession.sh`:

```bash
#!/usr/bin/env bash
# test-decision-record-supersession.sh — verify supersession-by-forward-scan behavior
set -euo pipefail

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
CORPUS="$TMPDIR/decision-record.md"

# Seed corpus with record A and record B (B supersedes A).
cat > "$CORPUS" <<'EOF'
---
id: dr-20260101-01-original
date: 2026-01-01
sprint: 20260101-01-original-sprint
stage: design-large-task
title: Original decision
decision: Use approach X.
rationale: Initial reasoning.
alternatives: []
tags: [architecture]
supersedes: null
artifact_refs: []
---

---
id: dr-20260201-01-revised
date: 2026-02-01
sprint: 20260201-01-revised-sprint
stage: design-large-task
title: Revised decision
decision: Use approach Y instead of X.
rationale: New evidence emerged.
alternatives:
  - Approach X — superseded; original reasoning no longer holds.
tags: [architecture, revert]
supersedes: dr-20260101-01-original
artifact_refs: []
---
EOF

# Snapshot the original-record bytes BEFORE the supersession scan.
RECORD_A_HASH_BEFORE=$(sed -n '1,12p' "$CORPUS" | sha256sum | cut -d' ' -f1)

# Forward-scan procedure: given record A's id, find records that supersede it.
# Uses awk because YAML field order places `tags:` immediately before `supersedes:`,
# so `grep -B1 "^supersedes:"` would return `tags:`, not `id:`.
SUPERSEDER=$(awk '
  /^id: / { last_id = $2 }
  $0 == "supersedes: dr-20260101-01-original" { print last_id; exit }
' "$CORPUS")

if [ "$SUPERSEDER" != "dr-20260201-01-revised" ]; then
  echo "FAIL: forward-scan did not find the superseder. Got: '$SUPERSEDER'" >&2
  exit 1
fi

# Verify record A is byte-identical post-scan (read-only operation).
RECORD_A_HASH_AFTER=$(sed -n '1,12p' "$CORPUS" | sha256sum | cut -d' ' -f1)
if [ "$RECORD_A_HASH_BEFORE" != "$RECORD_A_HASH_AFTER" ]; then
  echo "FAIL: record A modified during forward-scan (append-only invariant violated)" >&2
  exit 1
fi

echo "PASS: supersession-by-forward-scan verified, append-only invariant preserved"
```

Make it executable:

```bash
chmod +x tests/test-decision-record-supersession.sh
```

- [ ] **Step 2: Run the test**

```bash
bash tests/test-decision-record-supersession.sh
```

Expected: `PASS: supersession-by-forward-scan verified, append-only invariant preserved`

(This test is self-contained and passes from the start — it validates the forward-scan procedure documented in `decision-record-filter.md` works as specified.)

- [ ] **Step 3: (no implementation step — the procedure is documented in the filter file from Task 1)**

- [ ] **Step 4: Run all tests to confirm no regression**

```bash
for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 || echo "FAIL: $t"; done
```

Expected: no FAIL lines.

- [ ] **Step 5: Commit**

```bash
git add tests/test-decision-record-supersession.sh
git commit -m "test: supersession-by-forward-scan bash test"
```

---

## Task 6: Write revert-clean bash test (red baseline)

**Type:** code-producing
**Complexity:** simple
**Implements:** AC-4.7 (foundational; full pass after Tasks 7-14)
**Decision budget:** 1 (token list — pulled directly from spec AC-4.7)
**Must remain green:** `tests/test-decision-record-revert-clean.sh` (will be RED at end of this task; goes GREEN after Task 14)

**Files:**
- Create: `tests/test-decision-record-revert-clean.sh`

**Steps (TDD red-then-green spanning Tasks 7-14):**

- [ ] **Step 1: Write the test (red baseline)**

Create `tests/test-decision-record-revert-clean.sh`:

```bash
#!/usr/bin/env bash
# test-decision-record-revert-clean.sh — verify surgical revert leaves no dangling references
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
TOKENS=(
  dr_capture
  dr_audit
  dr_query
  dr_supersede
  dr_finalize_refs
  dr_abandon
  dr_verify_tests
  chester-decision-record
  must-remain-green
  skeleton-generator
  propagation-procedure
  observable-behaviors
)

EXIT=0
SCAN_DIRS=("$ROOT/skills" "$ROOT/agents" "$ROOT/tests" "$ROOT/.claude-plugin")

for token in "${TOKENS[@]}"; do
  hits=""
  for dir in "${SCAN_DIRS[@]}"; do
    [ -d "$dir" ] || continue
    found=$(grep -rn -- "$token" "$dir" 2>/dev/null | grep -v "/plans/" || true)
    if [ -n "$found" ]; then
      hits="${hits}${found}"$'\n'
    fi
  done
  if [ -n "$hits" ]; then
    echo "FAIL: token '$token' still present:" >&2
    echo "$hits" >&2
    EXIT=1
  fi
done

# Also verify the explicit file-level deletions.
DELETED_PATHS=(
  "$ROOT/mcp/chester-decision-record"
  "$ROOT/skills/design-specify/references/skeleton-generator.md"
  "$ROOT/skills/execute-write/references/propagation-procedure.md"
  "$ROOT/skills/execute-write/references/test-generator.md"
  "$ROOT/agents/execute-write-test-generator.md"
  "$ROOT/tests/test-decision-record-abandon.sh"
  "$ROOT/tests/test-decision-record-ac-mapping.sh"
  "$ROOT/tests/test-decision-record-capture-finalize.sh"
  "$ROOT/tests/test-decision-record-cross-sprint.sh"
  "$ROOT/tests/test-decision-record-registration.sh"
  "$ROOT/tests/test-decision-record-setup.sh"
  "$ROOT/tests/test-decision-record-shared-fixtures.sh"
  "$ROOT/tests/test-decision-record-supersede.sh"
  "$ROOT/tests/test-execute-write-update.sh"
  "$ROOT/tests/test-skeleton-manifest-path-convention.sh"
  "$ROOT/tests/test-finish-write-records-update.sh"
  "$ROOT/tests/test-reference-files.sh"
  "$ROOT/tests/test-plan-build-update.sh"
  "$ROOT/tests/test-execute-verify-complete-update.sh"
)
for path in "${DELETED_PATHS[@]}"; do
  if [ -e "$path" ]; then
    echo "FAIL: path '$path' still exists" >&2
    EXIT=1
  fi
done

if [ "$EXIT" -eq 0 ]; then
  echo "PASS: surgical revert is clean"
else
  echo "FAIL: surgical revert is incomplete"
fi

exit "$EXIT"
```

Make it executable:

```bash
chmod +x tests/test-decision-record-revert-clean.sh
```

- [ ] **Step 2: Run the test (expect RED — many forbidden tokens still present)**

```bash
bash tests/test-decision-record-revert-clean.sh && echo "UNEXPECTED PASS" || echo "RED as expected"
```

Expected: `RED as expected`. The test prints many `FAIL:` lines (one per token / path still present). This is the baseline — Tasks 7-14 will progressively reduce the failures to zero.

- [ ] **Step 3: (no implementation step — Tasks 7-14 are the "implementation" that drives this test green)**

- [ ] **Step 4: (deferred — final green-confirmation step lives in Task 14)**

- [ ] **Step 5: Commit**

```bash
git add tests/test-decision-record-revert-clean.sh
git commit -m "test: revert-clean baseline test (RED until tasks 7-14 land)"
```

---

## Task 7: Surgical revert — execute-write SKILL.md

**Type:** docs-producing
**Complexity:** complex
**Implements:** AC-1.5, AC-4.2 (partial)
**Decision budget:** 2 (Edit-tool ranges chosen with surrounding context; renumbering Steps 3-7 back to 3-6)
**Must remain green:** `tests/test-decision-record-emission.sh`, `tests/test-decision-record-supersession.sh`

**Files:**
- Modify: `skills/execute-write/SKILL.md` — remove the +23/-6 changes from commit `96ea360` across two non-contiguous regions; bump `version: v0003` → `version: v0004` in frontmatter.

**Renumbering hazard.** `skills/execute-write/SKILL.md:237` contains `4. **Invoke `finish-close-worktree`** — branch integration and cleanup.` (an unrelated numbered list in a different section). A naive `sed -i 's/^4\. \*\*/3. \*\*/'` would corrupt this line. Use the Edit tool with full surrounding context (anchor on the specific bullet text, not on the leading number alone), or use a narrowly-scoped sed pattern that includes the bullet's title text.

**Steps (TDD-adapted: surgical revert):**

- [ ] **Step 1: Confirm the regions to revert**

```bash
git -C . show 96ea360:skills/execute-write/SKILL.md > /tmp/post-09-04-24-version.md
diff -u skills/execute-write/SKILL.md /tmp/post-09-04-24-version.md | head -100
```

Confirm: two regions added by `96ea360` — one near the Step-2/Step-3 boundary (the Decision-Record Trigger Check and Propagation block), one later under "From the decision-record loop:".

- [ ] **Step 2: Revert region 1 — Step 2/3 boundary**

In `skills/execute-write/SKILL.md`, replace:

```markdown
2. **Handle implementer status codes:**
   - **DONE:** Proceed to the decision-record trigger check (step 3)
   - **DONE_WITH_CONCERNS:** Read concerns, decide whether to proceed to the trigger check or re-dispatch
```

with:

```markdown
2. **Handle implementer status codes:**
   - **DONE:** Proceed to spec review (step 3)
   - **DONE_WITH_CONCERNS:** Read concerns, decide whether to proceed to review or re-dispatch
```

Then delete the entire Step 3 trigger-check block (lines starting with `3. **Decision-Record Trigger Check and Propagation**` through the end of its bulleted list, ending at the line before `4. **Dispatch spec compliance reviewer**`).

Renumber the remaining steps via Edit tool with full bullet context (the title text disambiguates from line 237's unrelated `4. **Invoke finish-close-worktree**`):

| Old | New |
|---|---|
| `4. **Dispatch spec compliance reviewer**` | `3. **Dispatch spec compliance reviewer**` |
| `5. **Dispatch code quality reviewer**` | `4. **Dispatch code quality reviewer**` |
| `6. **Record HEAD_SHA**` after task is complete | `5. **Record HEAD_SHA**` after task is complete |
| `7. **Update TodoWrite**` — mark task DONE | `6. **Update TodoWrite**` — mark task DONE |

Each Edit invocation includes the full bullet text to anchor uniquely. Do NOT use `sed -i 's/^4\. \*\*/3. \*\*/'` — the unrelated bullet at line 237 would be corrupted.

- [ ] **Step 3: Revert region 2 — late-file decision-record-loop bullet**

Find and delete this block (post-04-24 addition):

```markdown
**From the decision-record loop:**
- Marking a task DONE without running the decision-record trigger check step, or without the suite — including any new propagation-generated tests — passing.
```

(Including the blank line before it that separates it from the preceding `**General:**` block, but preserving the `**General:**` block intact.)

- [ ] **Step 4: Verify the file**

```bash
# No trigger-check / propagation references
grep -c "trigger-check\|trigger check\|propagation\|observable-behaviors\|skeleton-coverage\|chester-decision-record\|dr_capture\|dr_finalize_refs" skills/execute-write/SKILL.md
# Expected: 0

# Steps now go 1, 2, 3, 4, 5, 6 (per-task chain restored to pre-04-24 shape)
grep -E "^[0-9]+\. \*\*" skills/execute-write/SKILL.md | head -10
# Expected: numbered list with 6 steps

# Format-conformance and supersession tests still pass
bash tests/test-decision-record-emission.sh
bash tests/test-decision-record-supersession.sh
```

Expected: tests PASS.

- [ ] **Step 4b: Bump skill version**

In `skills/execute-write/SKILL.md` frontmatter, change `version: v0003` → `version: v0004`. The trigger-check chain shape is materially different from v0003.

- [ ] **Step 5: Commit**

```bash
git add skills/execute-write/SKILL.md
git commit -m "revert: remove decision-record trigger-check from execute-write SKILL.md"
```

---

## Task 8: Surgical revert — execute-write references (implementer.md + spec-reviewer.md)

**Type:** docs-producing
**Complexity:** moderate
**Implements:** AC-4.2 (full)
**Decision budget:** 1 (verify both 16-line blocks are removed cleanly)
**Must remain green:** all previously-passing tests

**Files:**
- Modify: `skills/execute-write/references/implementer.md` — remove the 16-line "Decision-Record Loop Artifacts" section added by `96ea360`.
- Modify: `skills/execute-write/references/spec-reviewer.md` — remove the 16-line "Decision-Record Alignment" section added by `96ea360`.

**Steps:**

- [ ] **Step 1: Identify the implementer.md region to remove**

```bash
git -C . show 96ea360:skills/execute-write/references/implementer.md > /tmp/imp-post.md
diff -u skills/execute-write/references/implementer.md /tmp/imp-post.md
```

The 16-line block to remove starts with `    ## Decision-Record Loop Artifacts (code-producing tasks)` and ends just before `    ## Before Reporting Back: Self-Review`.

- [ ] **Step 2: Remove the implementer.md block**

Delete this exact block from `skills/execute-write/references/implementer.md` (including the blank line before `## Before Reporting Back`):

```markdown
    ## Decision-Record Loop Artifacts (code-producing tasks)

    **Observable behaviors artifact (Mod 2).** For code-producing tasks, emit a
    canonical-form list of observable behaviors in your diff to
    `observable-behaviors.md` in the current task's scratch area. Canonical form:
    one line per behavior, structured as
    `{function_signature_or_state_transition} -> {invariant_or_outcome}`. Include
    one example per language supported by skeleton-generator (Rust, TypeScript,
    Python, Bash).

    **Skeleton coverage check.** Read the spec's skeleton manifest (`spec-skeleton`
    artifact — find the path via `util-artifact-schema`'s artifact-type table).
    Note which observable behaviors from your diff are not covered by existing
    skeletons. Flag gaps in your DONE_WITH_CONCERNS report so execute-write's
    trigger-check can decide FIRE vs NO_FIRE.

```

(Preserve `## Before Reporting Back: Self-Review` and everything after it.)

- [ ] **Step 3: Remove the spec-reviewer.md block**

Delete this exact block from `skills/execute-write/references/spec-reviewer.md` (the "Decision-Record Alignment" section, between "Verify by checking git, not by trusting the report." and "## Confidence Scoring"):

```markdown
    ## Decision-Record Alignment

    **Applies only if decision records were created during this task.** For every
    decision record created during this task (visible via `dr_query` with filter
    `{sprint_subject, status: Active}` or by checking the store file):

    - Verify the record's `Spec Update` field text matches the spec clause that
      was updated — read the current spec; confirm the clause exists with the
      referenced AC ID and that the wording aligns.
    - Verify the record's `Test` field carries a SHA suffix (format:
      `{test_name} @ {commit_sha}`). If the SHA is missing, the implementer
      forgot to call `dr_finalize_refs` after commit — flag as a Commit-level
      issue.
    - Verify the record's `Code` field carries a SHA suffix similarly
      (`{file:line} @ {commit_sha}`); flag missing SHAs as a Commit-level issue.

```

- [ ] **Step 4: Verify**

```bash
grep -c "observable-behaviors\|spec-skeleton\|dr_query\|dr_finalize_refs\|skeleton-generator\|trigger-check" \
  skills/execute-write/references/implementer.md skills/execute-write/references/spec-reviewer.md
# Expected: zero matches in both files

# All format/supersession tests still pass
bash tests/test-decision-record-emission.sh && bash tests/test-decision-record-supersession.sh
```

Expected: tests PASS, grep returns 0.

- [ ] **Step 5: Commit**

```bash
git add skills/execute-write/references/implementer.md skills/execute-write/references/spec-reviewer.md
git commit -m "revert: remove decision-record blocks from execute-write reference files"
```

---

## Task 9: Surgical revert — design-specify scaffold-skeleton subsection

**Type:** docs-producing
**Complexity:** complex
**Implements:** AC-4.3
**Decision budget:** 1 (verify "Brief → spec AC derivation" paragraph survives)
**Must remain green:** all previously-passing tests

**Files:**
- Modify: `skills/design-specify/SKILL.md` — delete the "Scaffold test skeletons" subsection (lines ~161-173); bump `version: v0002` → `version: v0003` in frontmatter.
- Modify: `skills/design-specify/references/spec-template.md` — remove line 53 (`**Test skeleton ID:** ac-{N-M}-{slug}`) and line 64 (`- **Skeleton IDs** match the stub emitted by skeleton-generator.md.`). These reference the removed scaffolding mechanism.
- Delete: `skills/design-specify/references/skeleton-generator.md`.
- Delete: `tests/test-reference-files.sh` (validates `propagation-procedure.md`, `test-generator.md`, `skeleton-generator.md` exist; deleted atomically with the references they validate).

**Steps:**

- [ ] **Step 0: Delete the coupled reference-files validator test**

```bash
git rm tests/test-reference-files.sh
```

- [ ] **Step 1: Locate the subsection to remove**

```bash
grep -n "Scaffold test skeletons\|skeleton manifest\|spec-skeleton\|skeleton-generator" \
  skills/design-specify/SKILL.md
```

Note: the subsection starts at `### Scaffold test skeletons (per acceptance criterion)` and continues through the closing trailer-stamp code block. Confirm the surrounding "Brief → spec AC derivation" paragraph is upstream and must be preserved.

- [ ] **Step 2: Delete the subsection from SKILL.md**

Remove the entire `### Scaffold test skeletons (per acceptance criterion)` subsection — from its `###` heading through the end of its trailing code block (the `chester-trailer-write stamp design-specify@<this-skill-version> "<skeleton-manifest-path>"` block). Preserve everything before the `### Scaffold test skeletons` heading and everything after the closing trailer-stamp code block.

- [ ] **Step 3: Delete the skeleton-generator reference file**

```bash
git rm skills/design-specify/references/skeleton-generator.md
```

- [ ] **Step 3a: Edit spec-template.md**

In `skills/design-specify/references/spec-template.md`, delete:
- Line containing `**Test skeleton ID:** ac-{N-M}-{slug}` (the per-AC skeleton-id field that has no backing procedure after this revert).
- Line containing `- **Skeleton IDs** match the stub emitted by skeleton-generator.md.` (cross-reference to the deleted reference file).

Use Edit with full surrounding bullet context to anchor the deletions.

- [ ] **Step 3b: Bump skill version**

In `skills/design-specify/SKILL.md` frontmatter, change `version: v0002` → `version: v0003`.

- [ ] **Step 4: Verify**

```bash
grep -c "skeleton-generator\|skeleton manifest\|spec-skeleton\|Scaffold test skeletons\|Test skeleton ID\|Skeleton IDs" \
  skills/design-specify/SKILL.md skills/design-specify/references/spec-template.md
# Expected: 0 (across both files)

test ! -f skills/design-specify/references/skeleton-generator.md && echo "OK: skeleton-generator.md removed"

# Brief → spec AC derivation should still be present
grep -c "Brief → spec AC derivation" skills/design-specify/SKILL.md
# Expected: 1

grep -c "^version: v0003$" skills/design-specify/SKILL.md
# Expected: 1
```

Expected: zero matches for skeleton tokens across both files, OK message, brief-to-spec-AC paragraph preserved, version bumped.

- [ ] **Step 5: Commit**

`git rm` from Steps 0 and 3 already staged those deletions; commit picks them up alongside the markdown edits:

```bash
git add skills/design-specify/SKILL.md skills/design-specify/references/spec-template.md
git commit -m "revert: remove skeleton-manifest scaffolding from design-specify"
```

---

## Task 10: Surgical revert — plan-build dr_query integration

**Type:** docs-producing
**Complexity:** complex
**Implements:** AC-4.4
**Decision budget:** 2 (cleanly excise multi-block Prior Decisions section without dangling references; remove dr_query mention from Calls list)
**Must remain green:** all previously-passing tests

**Files:**
- Modify: `skills/plan-build/SKILL.md` — remove the entire `## Prior Decisions — Plan-Start Prerequisite` section, the bullet at line 24 in `Dynamic Progress Tracking` that mentions `dr_query`, the bullet at line 28 that says "derive per-task `Must remain green` from Prior Decisions", and the `dr_query` mention in the `**Calls:**` list of the `## Integration` section. Bump `version: v0003` → `version: v0004` in frontmatter.
- Modify: `skills/plan-build/references/plan-template.md` — remove the `## Prior Decisions` section, the per-task `Must remain green` example that references "inherited from Decision", the `{skeleton-ID}` cross-reference in the Part 2 task example (line ~66), and update the "loop-optimized" intro paragraph (lines 7-9) to drop "build-decision loop" vocabulary.
- Delete: `tests/test-plan-build-update.sh` (greps SKILL.md for `dr_query`; deleted atomically with the integration removal).

**Steps:**

- [ ] **Step 0: Delete the coupled validator test**

```bash
git rm tests/test-plan-build-update.sh
```

- [ ] **Step 1: Locate plan-build SKILL.md regions to revert**

```bash
grep -n "dr_query\|Prior Decisions\|chester-decision-record" skills/plan-build/SKILL.md
```

Expected matches: lines 24, 50-79, 345 (per spec).

- [ ] **Step 2: Edit plan-build/SKILL.md**

In `skills/plan-build/SKILL.md`:

a. In the "Dynamic Progress Tracking" section, remove the entire bullet line at line 24:

```markdown
2. **Query decision store (plan-start)** — invoke `dr_query` on the `chester-decision-record` MCP to retrieve active decisions for this sprint; holds the content for the plan's `## Prior Decisions` section
```

Then in the same list, rewrite the bullet at line 28 (currently mentions Prior Decisions):

```markdown
6. **Write plan tasks** — write each task with TDD steps, file paths, code, and commands; derive per-task `Must remain green` from Prior Decisions whose Code touches the task's files
```

Replace with:

```markdown
6. **Write plan tasks** — write each task with TDD steps, file paths, code, and commands; derive per-task `Must remain green` from tests this task creates and any tests covering files this task modifies.
```

Renumber the subsequent bullets (`3. Scope check` → `2.`, `4. Explore existing codebase` → `3.`, ...) so the list stays sequential 1-9 after the line-24 deletion.

b. Delete the entire `## Prior Decisions — Plan-Start Prerequisite` section (heading line and all content through the end of the section, just before `## Scope Check`).

c. Delete the `## Per-task field derivation` section's references to Prior Decisions if present, or trim the `Per-task field derivation` paragraph so it no longer references Prior Decisions input. Specifically remove or rewrite the bulleted item that begins:

```markdown
- **Must remain green** — test names inherited from Prior Decisions whose
  `Code` touches this task's files, plus the task's own new test.
```

Replace with:

```markdown
- **Must remain green** — test names this task creates and any tests covering files this task modifies that must continue to pass after the task lands.
```

d. In the `## Integration` section's `**Calls:**` list, remove `, `dr_query` on the `chester-decision-record` MCP (at plan-start, to populate `## Prior Decisions`)`.

- [ ] **Step 3: Edit plan-build/references/plan-template.md**

In `skills/plan-build/references/plan-template.md`:

a. Delete the `## Prior Decisions` section (lines ~34-40):

```markdown
## Prior Decisions

*(populated by plan-build via `dr_query` at plan-start; filter: sprint-subject match OR shared-component match, status=Active)*

- **[YYYYMMDD-XXXXX]** {title} — see spec {AC-ID}. Must-remain-green: `{test_name}`.

*(or "None" if dr_query returns empty)*

---
```

(The `---` separator may stay if it terminates a different section above; check context.)

b. In the per-task example block, remove the `Must remain green` line that references "inherited from Decision":

```markdown
**Must remain green:** `{test_name}` (inherited from Decision {YYYYMMDD-XXXXX})
```

Replace with:

```markdown
**Must remain green:** `{test_name}` (any test this task creates plus any test covering files this task modifies)
```

c. In the `## Per-Task Field Rules` section, rewrite the `Must remain green` description bullet (lines ~114-118) to remove Prior Decisions language; keep the bullet but reframe to: "test names this task creates and any tests covering files this task modifies that must continue to pass after the task lands."

d. In the Part 2 task structure example (around line 66), rewrite the Step 1 bullet:

```markdown
- [ ] **Step 1: Write the failing test** (reference skeleton `{skeleton-ID}` if one exists)
```

Replace with:

```markdown
- [ ] **Step 1: Write the failing test**
```

(The skeleton-ID cross-reference is vestigial after the skeleton mechanism is removed in Task 9.)

e. Rewrite the "loop-optimized" intro paragraph at lines 7-9:

```markdown
The template is **loop-optimized** — per-task fields (`Type`, `Implements`,
`Decision budget`, `Must remain green`) carry the information execute-write
and plan-attack need to gate the build-decision loop without re-reading the
spec for each task.
```

Replace with:

```markdown
The template carries per-task fields (`Type`, `Implements`, `Decision budget`,
`Must remain green`) that give execute-write and plan-attack the per-task
information they need without re-reading the spec for each task.
```

(Drops the "loop-optimized" / "build-decision loop" vocabulary that referenced the removed DR system.)

- [ ] **Step 3a: Bump skill version**

In `skills/plan-build/SKILL.md` frontmatter, change `version: v0003` → `version: v0004`.

- [ ] **Step 4: Verify**

```bash
grep -c "dr_query\|Prior Decisions\|chester-decision-record\|build-decision loop\|loop-optimized\|skeleton-ID" \
  skills/plan-build/SKILL.md skills/plan-build/references/plan-template.md
# Expected: 0 in both

grep -c "^version: v0004$" skills/plan-build/SKILL.md
# Expected: 1

# All previously-passing tests still pass
bash tests/test-decision-record-emission.sh && bash tests/test-decision-record-supersession.sh
```

Expected: zero matches; version bumped; tests pass.

- [ ] **Step 5: Commit**

`git rm` from Step 0 already staged the test deletion:

```bash
git add skills/plan-build/SKILL.md skills/plan-build/references/plan-template.md
git commit -m "revert: remove dr_query integration from plan-build"
```

---

## Task 11: Surgical revert — execute-verify-complete dr_verify_tests

**Type:** docs-producing
**Complexity:** moderate
**Implements:** AC-4.5
**Decision budget:** 1 (renumber Steps 2-4 back to Steps 2-3 cleanly)
**Must remain green:** all previously-passing tests

**Files:**
- Modify: `skills/execute-verify-complete/SKILL.md` — delete the entire `## Step 2: Verify Decision-Record Linkage` section (lines ~43-66) and renumber Steps 3 and 4 to Steps 2 and 3; bump `version: v0001` → `version: v0002` in frontmatter.
- Delete: `tests/test-execute-verify-complete-update.sh` (greps SKILL.md for `dr_verify_tests`; deleted atomically).

**Steps:**

- [ ] **Step 0: Delete the coupled validator test**

```bash
git rm tests/test-execute-verify-complete-update.sh
```

- [ ] **Step 1: Identify the region**

```bash
grep -n "^## Step\|dr_verify_tests\|chester-decision-record" skills/execute-verify-complete/SKILL.md
```

- [ ] **Step 2: Delete Step 2 and renumber**

Delete the entire `## Step 2: Verify Decision-Record Linkage` section (heading line through and including the line `**If \`aggregate=\"pass\"\`:** Continue.`).

Then renumber:
- `## Step 3: Verify Clean Tree` → `## Step 2: Verify Clean Tree`
- `## Step 4: Checkpoint` → `## Step 3: Checkpoint`

```bash
sed -i 's/^## Step 3: Verify Clean Tree/## Step 2: Verify Clean Tree/' skills/execute-verify-complete/SKILL.md
sed -i 's/^## Step 4: Checkpoint/## Step 3: Checkpoint/' skills/execute-verify-complete/SKILL.md
```

Also remove the "Rationale for ordering (step 2 here, not later)" paragraph that explained the dr_verify_tests sequencing — it is no longer relevant. Search for `Rationale for ordering` and delete the paragraph if present.

- [ ] **Step 3: Verify**

```bash
grep -c "dr_verify_tests\|chester-decision-record\|Decision-Record Linkage" \
  skills/execute-verify-complete/SKILL.md
# Expected: 0

# Steps go 1, 2, 3
grep -E "^## Step [0-9]+:" skills/execute-verify-complete/SKILL.md
# Expected: 3 lines, Steps 1-3
```

- [ ] **Step 3a: Bump skill version**

In `skills/execute-verify-complete/SKILL.md` frontmatter, change `version: v0001` → `version: v0002`.

- [ ] **Step 4: Run all tests**

```bash
for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 || echo "FAIL: $t"; done
```

Expected: no FAIL lines (revert-clean test still RED is acceptable; it's the test under construction).

- [ ] **Step 5: Commit**

`git rm` from Step 0 already staged the test deletion:

```bash
git add skills/execute-verify-complete/SKILL.md
git commit -m "revert: remove dr_verify_tests step from execute-verify-complete"
```

---

## Task 12: Delete chester-decision-record MCP package and manifest entry

**Type:** config-producing
**Complexity:** moderate
**Implements:** AC-1.4, AC-4.1, AC-4.8
**Decision budget:** 1 (hand-edit of mcp.json with JSON validity check)
**Must remain green:** all previously-passing tests

**Files:**
- Delete: `mcp/chester-decision-record/` (directory and all contents).
- Modify: `.claude-plugin/mcp.json` — remove the `chester-decision-record` server entry.

**Steps:**

- [ ] **Step 1: Verify the package is no longer referenced by any skill**

```bash
grep -rn "chester-decision-record" skills/ agents/ 2>/dev/null | grep -v "/plans/"
# Expected: 0 matches (Tasks 4, 7, 8, 10, 11 cleared all references)
```

If any matches surface, fix them in the skill that still references — do not proceed until the count is zero.

- [ ] **Step 2: Remove the package directory**

```bash
git rm -r mcp/chester-decision-record/
```

- [ ] **Step 3: Remove the manifest entry**

Edit `.claude-plugin/mcp.json` and remove the `chester-decision-record` block. After edit, the file should look exactly like:

```json
{
  "mcpServers": {
    "chester-design-proof": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/skills/design-large-task/proof-mcp/server.js"]
    },
    "chester-design-understanding-classic": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/skills/design-large-task/understanding-mcp/server.js"]
    },
    "chester-design-understanding-problemfocused": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/skills/design-large-task/understanding-mcp-problemfocused/server.js"]
    }
  }
}
```

After removing the `chester-decision-record` entry, ensure the entry that becomes the new last server (`chester-design-understanding-problemfocused`) has no trailing comma after its closing `}` so the JSON remains valid. (The current file does NOT have such a trailing comma — the verification at Step 4 is sufficient regardless.)

- [ ] **Step 4: Verify**

```bash
test ! -d mcp/chester-decision-record && echo "OK: package removed"
python3 -c "import json; print(list(json.load(open('.claude-plugin/mcp.json'))['mcpServers'].keys()))"
# Expected: ['chester-design-proof', 'chester-design-understanding-classic', 'chester-design-understanding-problemfocused']
```

Expected: package directory gone; only three servers remain in mcp.json.

- [ ] **Step 5: Commit**

```bash
git add .claude-plugin/mcp.json
git commit -m "feat: remove chester-decision-record MCP package and manifest entry"
```

---

## Task 13: Delete decision-record and skeleton bash test scripts

**Type:** config-producing
**Complexity:** simple
**Implements:** AC-4.7 (partial)
**Decision budget:** 0 (mechanical file removal)
**Must remain green:** all previously-passing tests except the deleted ones

**Files:**
- Delete:
  - `tests/test-decision-record-abandon.sh`
  - `tests/test-decision-record-ac-mapping.sh`
  - `tests/test-decision-record-capture-finalize.sh`
  - `tests/test-decision-record-cross-sprint.sh`
  - `tests/test-decision-record-registration.sh`
  - `tests/test-decision-record-setup.sh`
  - `tests/test-decision-record-shared-fixtures.sh`
  - `tests/test-decision-record-supersede.sh`
  - `tests/test-execute-write-update.sh`
  - `tests/test-skeleton-manifest-path-convention.sh`

(Note: four other DR-coupled tests — `test-finish-write-records-update.sh`, `test-reference-files.sh`, `test-plan-build-update.sh`, `test-execute-verify-complete-update.sh` — are deleted in Tasks 4, 9, 10, 11 respectively, atomically with the skill modification each test validated.)

**Steps:**

- [ ] **Step 1: Confirm the test files exist**

```bash
ls tests/test-decision-record-*.sh tests/test-execute-write-update.sh tests/test-skeleton-manifest-path-convention.sh
```

Expected: all 10 files listed.

- [ ] **Step 2: Remove the files**

```bash
git rm tests/test-decision-record-abandon.sh \
       tests/test-decision-record-ac-mapping.sh \
       tests/test-decision-record-capture-finalize.sh \
       tests/test-decision-record-cross-sprint.sh \
       tests/test-decision-record-registration.sh \
       tests/test-decision-record-setup.sh \
       tests/test-decision-record-shared-fixtures.sh \
       tests/test-decision-record-supersede.sh \
       tests/test-execute-write-update.sh \
       tests/test-skeleton-manifest-path-convention.sh
```

- [ ] **Step 3: Verify**

```bash
ls tests/test-decision-record-*.sh 2>/dev/null | grep -v emission | grep -v supersession
# Expected: empty (only the new emission and supersession tests should remain matching that prefix; technically they don't match the deleted prefix glob since they're test-decision-record-emission.sh and test-decision-record-supersession.sh — confirm they're present)
ls tests/test-decision-record-emission.sh tests/test-decision-record-supersession.sh
# Expected: both files listed
```

- [ ] **Step 4: Run remaining tests**

```bash
for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 || echo "FAIL: $t"; done
```

Expected: no FAIL lines except possibly the revert-clean test (still partially red — Task 14 finishes the revert).

- [ ] **Step 5: Commit**

`git rm` from Step 2 already staged all ten file deletions; no `git add` is needed:

```bash
git commit -m "feat: remove decision-record and skeleton bash test scripts"
```

---

## Task 14: Delete orphaned reference files and test-generator agent; verify revert-clean passes

**Type:** config-producing
**Complexity:** simple
**Implements:** AC-4.7 (full), AC-4.10
**Decision budget:** 0 (mechanical removal + final verification)
**Must remain green:** `tests/test-decision-record-revert-clean.sh` (turns GREEN at end of this task)

**Files:**
- Delete: `skills/execute-write/references/propagation-procedure.md`
- Delete: `skills/execute-write/references/test-generator.md`
- Delete: `agents/execute-write-test-generator.md`

**Steps:**

- [ ] **Step 1: Verify no skill still references these files**

```bash
grep -rn "propagation-procedure\|test-generator\|execute-write-test-generator" \
  skills/ agents/ .claude-plugin/ 2>/dev/null | grep -v "/plans/"
# Expected: 0 matches (Tasks 7-11 cleared all skill-level references)
```

If any match surfaces, fix the referring skill before proceeding.

- [ ] **Step 2: Remove the files**

```bash
git rm skills/execute-write/references/propagation-procedure.md \
       skills/execute-write/references/test-generator.md \
       agents/execute-write-test-generator.md
```

- [ ] **Step 3: Run the revert-clean test (final green confirmation)**

```bash
bash tests/test-decision-record-revert-clean.sh
```

Expected: `PASS: surgical revert is clean`

If the test still reports any FAIL line, identify the lingering reference and fix it before committing — the revert is incomplete.

- [ ] **Step 4: Run all tests to confirm no regression**

```bash
for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 && echo "PASS: $t" || echo "FAIL: $t"; done
```

Expected: every test PASS, no FAIL lines.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: remove orphan refs and test-generator agent; surgical revert complete"
```

---

## Task 15: Manual verification — keep-bucket preservation

**Type:** docs-producing
**Complexity:** simple
**Implements:** AC-4.9
**Decision budget:** 0 (mechanical inspection per spec checklist)
**Must remain green:** `tests/test-decision-record-revert-clean.sh`, all other tests

**Files:**
- No file modifications. This task is a verification gate documented in the session summary or audit.

**Steps (verification-only, no implementation):**

- [ ] **Step 1: Check provenance trailer stamping is intact**

```bash
ls /home/mike/Documents/CodeProjects/Chester/bin/chester-trailer-write
grep -c "chester-trailer-write stamp" skills/finish-write-records/SKILL.md
# Expected: file exists; count > 0 (existing post-04-24 stamps remain)
```

- [ ] **Step 2: Check named-subagent fork policy is intact**

```bash
ls agents/ | grep -E "design-large-task-step-b|plan-build-|execute-write-quality-reviewer|execute-write-spec-reviewer"
# Expected: at least these named subagents present (excluding the deleted execute-write-test-generator.md)
```

- [ ] **Step 3: Check Understanding-MCP swap line is intact**

```bash
grep -c "ACTIVE_UNDERSTANDING_MCP" skills/design-large-task/SKILL.md
# Expected: > 0
```

- [ ] **Step 4: Check ground-truth review automation, brief-to-spec AC seeding, Session Skill Versions harvest, heuristic execution-mode selection, cluster-a Resolve Conditions**

```bash
grep -c "Ground-Truth Review (Automatic)\|ground-truth-reviewer" skills/design-specify/SKILL.md
# Expected: > 0
grep -c "Brief → spec AC derivation\|RCON-N" skills/design-specify/SKILL.md
# Expected: > 0
grep -c "Session Skill Versions\|chester-trailer-write harvest" skills/finish-write-records/SKILL.md
# Expected: > 0
grep -c "Execution Mode Selection\|Execution mode:" skills/plan-build/SKILL.md
# Expected: > 0
grep -c "Resolve Condition" skills/design-large-task/SKILL.md
# Expected: > 0
```

Expected: every grep returns > 0; the eight keep-bucket items are confirmed intact.

- [ ] **Step 5: No commit (verification-only task)**

This task ships no diff. Record the inspection result inline in the session summary at `finish-write-records` time. The empty checkpoint that `execute-verify-complete` creates after this task is a no-op for this task specifically.

---

## Plan Summary

- **15 tasks** total, executing in dependency order: build-new (Tasks 1-5) → tear-out (Tasks 6-14) → verify-keep-bucket (Task 15).
- **Key dependency:** Task 4 (delete `dr_audit` Step 4 from finish-write-records) must precede Task 12 (delete MCP package). Tasks 7-11 (skill reverts) similarly precede Task 12. Task 14 (final revert-clean) follows all other revert tasks.
- **Test trajectory:**
  - Format-conformance + supersession tests pass from Task 3 onward.
  - Revert-clean test is RED from Task 6, progressively reduces failures across Tasks 7-13, lands GREEN at Task 14.
  - All previously-passing tests continue green throughout.
- **AC coverage:** every AC in the spec is implemented by at least one task. AC-1.4 (no MCP tool call) is satisfied structurally by Task 12 (deletion makes it impossible to call). AC-4.9 (keep-bucket) is satisfied by Task 15's mechanical verification.
- **Self-bootstrapping observation:** when `finish-write-records` runs at the end of THIS sprint, it executes the new fork pattern (live in disk after Task 4). The first record in the corpus will be a record FROM the sprint that built the system.

<!-- created-at: 2026-05-01T13:37:58Z -->
<!-- produced-by plan-build@v0003 -->
