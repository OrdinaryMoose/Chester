# Plan: `design-architect-committee` Skill Files Build (Option B++)

**Sprint:** `20260521-02-design-architect-committee`
**Spec:** `docs/chester/working/20260521-02-design-architect-committee/spec/skill-files-spec-03.md`
**Execution mode:** TBD — designer fills before `execute-write` runs (Phase 8 Execution Mode Selection deferred per Decision 4b path which committee subsequently closed; designer adjudicates inline vs subagent based on plan complexity and current risk read).
**Supersedes:** plan v00 (which planned against abandoned spec v02). Retained on disk per Decision 6a.

> **For agentic workers:** Use `execute-write` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Plan v01 is brief-strict (BL1-only lint, no token grammar, no broken-link check). All AC-1.x through AC-7.2 from spec v03 are covered. Sixteen tasks. Per-task TDD shape per `plan-template.md`.

## Goal

Produce the four operator-facing files for the `design-architect-committee` skill (`SKILL.md`, `rules.md`, seven `schema/*.md`, `design-brief-template.md`) plus the two-sub-check pre-commit lint, three structural tests, and the `setup-start/references/skill-index.md` registration entry — such that all eighteen acceptance criteria in spec v03 pass and the lint blocks future commits that violate the cap or list-item ban.

## Architecture

Brief-strict forward-citing layered contract. Two prose files cite into `schema/` via standard Markdown heading anchors. Seven schema files transcribe content from the locked specs (CE, RC, CM, phases, procedures, actors, integrity rules). Lint = word-cap + list-item-ban per brief KD-3 sub-path 1. No token grammar. No broken-link check. No appendix. Two Class-1 fact-correction errata (six-field CE; no-automatic-transitions clarification) and one Class-2 bounded-discretion placement (AX-008 convening convention in `schema/actors.md`) applied per designer Decisions 2a and 3a.

## Tech Stack

- **Markdown** for all content artifacts.
- **Bash** for `scripts/lint-skill-files.sh` and the three `tests/test-design-architect-committee-*.sh` files. Pattern follows existing Chester convention (`set -euo pipefail`, exit 0 = pass).
- **Git pre-commit hook** — symlink from `.git/hooks/pre-commit` to `scripts/lint-skill-files.sh`. `.git/config` already has `core.hooksPath = .git/hooks` (verified at ground-truth review).
- **YAML frontmatter** — `name`, `description`, `version: v0001` on `SKILL.md` only. `rules.md` is a content sidecar without Skill-tool frontmatter.

## Notes on cross-task ordering

- Schema files (Tasks 3-9) precede capped-file bodies (Tasks 11, 12) so capped-file Markdown anchor links can target real schema headings.
- Lint script (Task 2) precedes capped-file bodies so every commit of a capped file lints clean.
- Pre-commit wiring (Task 15) lands LATE — only after capped-file bodies and tests are green — to avoid blocking earlier task commits with an incomplete state.
- `skill-index.md` registration (Task 16) lands LAST so the registered skill body files actually exist on disk.

---

## Task 1: Scaffold skill directory and frontmatter stubs

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.2 (frontmatter scaffolding only; bodies added at Tasks 12 and 11)
**Decision budget:** 1
**Must remain green:** (no tests yet)

**Files:**
- Create: `skills/design-architect-committee/SKILL.md` (uppercase per Chester convention) — frontmatter only
- Create: `skills/design-architect-committee/rules.md` — sidecar, lightweight non-Skill-tool header only
- Create: `skills/design-architect-committee/schema/` (empty directory)
- Create: `skills/design-architect-committee/scripts/` (empty directory)

**Steps:**

- [ ] **Step 1: Verify directory absent.** Run: `test ! -d /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee && echo OK || echo "FAIL: already exists"`. Expected: `OK`.

- [ ] **Step 2: Create directory tree.** Run: `mkdir -p /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/{schema,scripts}`.

- [ ] **Step 3: Write `SKILL.md` with frontmatter only.**

```markdown
---
name: design-architect-committee
description: Convene the four-pole Committee in Mode B for a session producing a ratified Constraint Envelope, Resolution Criterion, and Coverage Map for design-specify. Use when architectural choice requires structured deliberation with Clerk-enforced schema and the five-phase OPEN→ANCHORED→DELIBERATING→RATIFYING→CLOSED lifecycle.
version: v0001
---
```

Body added at Task 12.

- [ ] **Step 4: Write `rules.md` with sidecar header only.**

`rules.md` is a content sidecar (not a separately invocable skill). Lightweight non-Skill-tool header at the top:

```markdown
**Status:** Sidecar to SKILL.md. Read alongside `SKILL.md` when convening or operating a `design-architect-committee` session.

---

```

Body added at Task 11.

- [ ] **Step 5: Verify both files exist.** Run: `head -5 /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/SKILL.md && echo "---" && head -5 /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/rules.md`. Expected: SKILL.md shows YAML frontmatter; rules.md shows sidecar header.

- [ ] **Step 6: Commit.**

```bash
git add skills/design-architect-committee/
git commit -m "chore(design-architect-committee): scaffold skill folder + frontmatter/sidecar stubs"
```

---

## Task 2: Write lint script and self-tests

**Type:** code-producing
**Implements:** AC-6.1, AC-6.2 (lint sub-checks operational)
**Decision budget:** 2 (frontmatter boundary detection in awk; body-line indexing for FAIL messages)
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Create: `skills/design-architect-committee/scripts/lint-skill-files.sh`
- Create: `tests/test-design-architect-committee-lint.sh`
- Create: `tests/fixtures/design-architect-committee-lint/` (clean + over-cap + list-item fixtures)

**Steps:**

- [ ] **Step 1: Write failing test driver.**

```bash
#!/usr/bin/env bash
set -euo pipefail

LINT="$(dirname "$0")/../skills/design-architect-committee/scripts/lint-skill-files.sh"
FIX="$(dirname "$0")/fixtures/design-architect-committee-lint"

assert_pass() {
  local name="$1" skill="$2" rules="$3"
  if bash "$LINT" "$skill" "$rules" >/dev/null 2>&1; then echo "PASS: $name"
  else echo "FAIL: $name — expected pass"; exit 1; fi
}
assert_fail() {
  local name="$1" expect="$2" skill="$3" rules="$4"
  local out
  if out=$(bash "$LINT" "$skill" "$rules" 2>&1); then echo "FAIL: $name — expected fail"; exit 1; fi
  grep -q "$expect" <<<"$out" && echo "PASS: $name" || { echo "FAIL: $name — missing '$expect'"; echo "$out"; exit 1; }
}

assert_pass "clean fixture"       "$FIX/clean/SKILL.md"      "$FIX/clean/rules.md"
assert_fail "over-cap fixture"    "exceeds cap of 200"        "$FIX/over-cap/SKILL.md"   "$FIX/over-cap/rules.md"
assert_fail "list-item fixture"   "forbidden list pattern"    "$FIX/list-item/SKILL.md"  "$FIX/list-item/rules.md"

echo "all lint self-tests passed"
```

- [ ] **Step 2: Run test driver to confirm fail.** Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh`. Expected: FAIL because lint script absent.

- [ ] **Step 3: Build three fixture sets** under `tests/fixtures/design-architect-committee-lint/`:
  - `clean/SKILL.md`: frontmatter + body ~80 words, no list items.
  - `clean/rules.md`: sidecar header + body ~80 words, no list items.
  - `over-cap/SKILL.md`: frontmatter + body 220 words.
  - `over-cap/rules.md`: matching clean shape (only SKILL.md tripped).
  - `list-item/SKILL.md`: frontmatter + body containing `- some inline list item`.
  - `list-item/rules.md`: matching clean shape.

- [ ] **Step 4: Write the lint script** `skills/design-architect-committee/scripts/lint-skill-files.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: lint-skill-files.sh [SKILL_PATH] [RULES_PATH]
# Defaults to canonical paths from repo root.

SKILL_PATH="${1:-skills/design-architect-committee/SKILL.md}"
RULES_PATH="${2:-skills/design-architect-committee/rules.md}"
CAP=200
fail=0

extract_body() {
  # Strip YAML frontmatter delimited by --- on line 1 and a subsequent ---.
  # If no frontmatter, return entire file (rules.md has no Skill-tool frontmatter).
  awk 'NR==1 && /^---$/ { state=1; next }
       state==1 && /^---$/ { state=2; next }
       state==1 { next }
       { print }' "$1"
}

check_word_cap() {
  local path="$1" base count
  base=$(basename "$path")
  count=$(extract_body "$path" | wc -w | tr -d ' ')
  if [ "$count" -gt "$CAP" ]; then
    echo "FAIL: $base body word count $count exceeds cap of $CAP"
    fail=1
  else
    echo "PASS: $base body word count $count"
  fi
}

check_list_ban() {
  local path="$1" base hit
  base=$(basename "$path")
  hit=$(extract_body "$path" | grep -nE '^- |^[0-9]+\. ' || true)
  if [ -n "$hit" ]; then
    echo "FAIL: $base body line matches forbidden list pattern: $(head -1 <<<"$hit")"
    fail=1
  else
    echo "PASS: $base body free of list items"
  fi
}

check_word_cap "$SKILL_PATH"
check_word_cap "$RULES_PATH"
check_list_ban "$SKILL_PATH"
check_list_ban "$RULES_PATH"

[ "$fail" -eq 1 ] && exit 1
echo "lint passed"
```

- [ ] **Step 5: Make executable, run self-test.** Run:

```bash
chmod +x /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/scripts/lint-skill-files.sh
bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh
```

Expected: all three assertions PASS; final line `all lint self-tests passed`.

- [ ] **Step 6: Commit.**

```bash
git add skills/design-architect-committee/scripts/lint-skill-files.sh \
        tests/test-design-architect-committee-lint.sh \
        tests/fixtures/design-architect-committee-lint/
git commit -m "feat(design-architect-committee): two-sub-check lint + self-tests"
```

---

## Task 3: Write `schema/integrity-rules.md`

**Type:** docs-producing
**Implements:** AC-3.7
**Decision budget:** 1
**Must remain green:** lint self-test still PASS.

**Files:**
- Create: `skills/design-architect-committee/schema/integrity-rules.md`

**Steps:**

- [ ] **Step 1: Write the file** (sourced from `deliverables-locked-00.md` "Cross-artifact integrity rules" and `process-locked-00.md` "Session-close gate"):

```markdown
# Integrity Rules — Schema

Cross-artifact foreign-key rules and session-close gate predicate. Sourced from `deliverables-locked-00.md` "Cross-artifact integrity rules" and `process-locked-00.md` "Session-close gate".

## FK Rules

- `concern_id` referenced in any Coverage Map row must appear in the Constraint Envelope.
- `entry_id` referenced in any Coverage Map list (`axiom_ids`, `proposition_ids`) must appear in the Constraint Envelope with matching `source`.
- `entry_id` in any Resolution Criterion row must appear in the Constraint Envelope with `source = PROPOSITION` and `status = RATIFIED`.
- Every PROPOSITION row in the Constraint Envelope must have exactly one matching Resolution Criterion row.
- AXIOM rows in the Constraint Envelope have no matching Resolution Criterion row.

## Session-Close Gate

Three Clerk-computed conditions, all required:

- Zero GAP rows in Coverage Map.
- Zero REVISED-PENDING rows in Constraint Envelope.
- Every PROPOSITION row in Constraint Envelope has exactly one matching Resolution Criterion row with `structural_valid = TRUE`.

Plus cross-artifact FK checks pass.

AXIOM-ONLY rows in Coverage Map do not block close — flag for designer inspection only.
```

- [ ] **Step 2: Verify content present.** Run: `grep -c 'FK Rules\|Session-Close Gate\|concern_id\|GAP\|REVISED-PENDING' /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/integrity-rules.md`. Expected: ≥ 5.

- [ ] **Step 3: Run lint self-test — confirm still PASS.** Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh`. Expected: PASS.

- [ ] **Step 4: Commit.**

```bash
git add skills/design-architect-committee/schema/integrity-rules.md
git commit -m "feat(design-architect-committee): schema/integrity-rules.md"
```

---

## Task 4: Write `schema/phases-and-transitions.md`

**Type:** docs-producing
**Implements:** AC-3.4 (including the no-automatic-transitions Class-1 fact-correction)
**Decision budget:** 1
**Must remain green:** lint self-test still PASS.

**Files:**
- Create: `skills/design-architect-committee/schema/phases-and-transitions.md`

**Steps:**

- [ ] **Step 1: Write the file** (sourced from `process-locked-00.md`; include the load-bearing "no automatic transitions" constraint from `process-locked-00.md:29`):

```markdown
# Phases and Transitions — Schema

Five-phase session lifecycle, transitions, cascade timing, withdrawal exception. Sourced from `process-locked-00.md`.

## Session Phases (Five Named States)

`OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED`

- `OPEN` — Concerns registered; no axioms yet; no Propositions permitted.
- `ANCHORED` — Designer asserted at least one axiom for at least one Concern; per-Concern partial-license state.
- `DELIBERATING` — At least one Concern anchored AND designer initiated deliberation; poles submit Proposition records.
- `RATIFYING` — Designer round-end signal received; Clerk lint complete; designer dispositions each row.
- `CLOSED` — Session-close gate cleared; deliverables frozen; terminal state.

## Transitions

- `OPEN → ANCHORED` — designer asserts first axiom on any Concern.
- `ANCHORED → DELIBERATING` — designer initiates deliberation (explicit signal).
- `DELIBERATING → RATIFYING` — designer issues round-end signal AND Clerk lint completes.
- `RATIFYING → DELIBERATING` — at least one row entered REVISED-PENDING via designer per-row reject, or session-close gate failed; new round opens.
- `RATIFYING → CLOSED` — session-close gate clears.

**Load-bearing constraint:** No transition fires automatically on a coverage condition. Every advance is designer-triggered.

## Cascade Timing (Hybrid)

Synchronous scope capture at the trigger event; deferred status mutation at round-close lint.

Provenance-differentiated scope:
- DESIGNER axiom revision → all PROPOSITION rows for that Concern.
- AGENT Proposition revision → only rows whose `grounding` cites the revised `entry_id`, then transitive.

## Withdrawal Exception

Withdrawal fires the full cascade (both scope capture AND status mutation) immediately at the withdrawal event. Rationale: withdrawal is designer-initiated and visible immediately. All rows whose `grounding` cites the withdrawn `entry_id` enter REVISED-PENDING. Coverage Map recomputed. Withdrawal is irreversible — re-entry requires a new `entry_id`.
```

- [ ] **Step 2: Verify "no automatic transitions" constraint present.** Run: `grep -F 'No transition fires automatically' /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/phases-and-transitions.md`. Expected: match.

- [ ] **Step 3: Lint self-test PASS.** Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh`.

- [ ] **Step 4: Commit.**

```bash
git add skills/design-architect-committee/schema/phases-and-transitions.md
git commit -m "feat(design-architect-committee): schema/phases-and-transitions.md (incl. no-auto-transitions Class-1 fact-correction)"
```

---

## Task 5: Write `schema/procedures.md`

**Type:** docs-producing
**Implements:** AC-3.5
**Decision budget:** 1
**Must remain green:** lint self-test still PASS.

**Files:**
- Create: `skills/design-architect-committee/schema/procedures.md`

**Steps:**

- [ ] **Step 1: Write the file** transcribing the twelve procedures from `procedures-locked-00.md` with Mutates / Trigger / Gates / State as four one-liners per procedure. Use `### Procedure Name` heading per procedure; bullets for the four fields.

Procedures to include in order: Add Concern, Add Evidence, Add Axiom, Initiate Deliberation, Propose Proposition, Submit Round, Lint Batch, Ratify Row, Re-Ratify Row, Revise Row, Withdraw Entry, Close Session.

Reference: `/home/mike/Documents/CodeProjects/Chester/docs/chester/working/20260521-02-design-architect-committee/design/procedures-locked-00.md` for verbatim content.

- [ ] **Step 2: Verify all twelve procedure names present.** Run: `for p in 'Add Concern' 'Add Evidence' 'Add Axiom' 'Initiate Deliberation' 'Propose Proposition' 'Submit Round' 'Lint Batch' 'Ratify Row' 'Re-Ratify Row' 'Revise Row' 'Withdraw Entry' 'Close Session'; do grep -qF "$p" /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/procedures.md && echo "OK: $p" || echo "MISSING: $p"; done`. Expected: 12 OK lines.

- [ ] **Step 3: Lint self-test PASS.**

- [ ] **Step 4: Commit.**

```bash
git add skills/design-architect-committee/schema/procedures.md
git commit -m "feat(design-architect-committee): schema/procedures.md (12 procedures)"
```

---

## Task 6: Write `schema/actors.md` (including AX-008 Class-2 placement)

**Type:** docs-producing
**Implements:** AC-3.6
**Decision budget:** 2 (procedure-actor map ordering; AX-008 section placement within the file)
**Must remain green:** lint self-test still PASS.

**Files:**
- Create: `skills/design-architect-committee/schema/actors.md`

**Steps:**

- [ ] **Step 1: Write the file** sourced from `actors-locked-00.md`. Four sections:

  1. **Role Inventory** — five roles named (Designer, Pole, Clerk, Team-Lead, Researcher) with scope/authority sentences.
  2. **Procedure-Actor Map** — thirteen entries (twelve procedures + Dispatch Round) naming the authorized caller for each.
  3. **Designer Surface Per Phase** — five entries (one per phase) listing the procedures available to the designer.
  4. **Convening-Message Discipline (AX-008)** — Class-2 bounded-discretion placement. Inter-agent deliberation prompts inside a session use caveman ultra; designer-facing surfaces (the four build files) use normal terse markdown. Caveman ultra does not propagate to designer-facing surfaces.

Reference: `/home/mike/Documents/CodeProjects/Chester/docs/chester/working/20260521-02-design-architect-committee/design/actors-locked-00.md` for content.

- [ ] **Step 2: Verify AX-008 section present.** Run: `grep -F 'caveman ultra' /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/actors.md`. Expected: match.

- [ ] **Step 3: Lint self-test PASS.**

- [ ] **Step 4: Commit.**

```bash
git add skills/design-architect-committee/schema/actors.md
git commit -m "feat(design-architect-committee): schema/actors.md (5 roles + AX-008 placement)"
```

---

## Task 7: Write `schema/constraint-envelope.md` (six-field Class-1 errata)

**Type:** docs-producing
**Implements:** AC-3.1
**Decision budget:** 1
**Must remain green:** lint self-test still PASS.

**Files:**
- Create: `skills/design-architect-committee/schema/constraint-envelope.md`

**Steps:**

- [ ] **Step 1: Write the file** sourced from `deliverables-locked-00.md` "Three deliverables → Constraint Envelope":

```markdown
# Constraint Envelope — Schema

Sourced from `deliverables-locked-00.md` § "Three deliverables → Constraint Envelope". Six-field row shape per Class-1 fact-correction errata (brief AC-7 said "five-field" against canonical six-field locked source).

## Row Shape (Six Fields)

- `concern_id` — typed prefix `CE-NNN`. Clerk-enforced.
- `entry_id` — typed prefix `AX-NNN` (axiom) or `PR-NNN` (Proposition). Clerk-enforced.
- `source` — ENUM `{AXIOM, PROPOSITION}`.
- `body` — IF/THEN architectural-altitude claim. No implementation vocabulary.
- `provenance` — ENUM `{DESIGNER, AGENT}`. Clerk reads at read-time for axiom-collision detection and cascade re-audit scope.
- `status` — ENUM `{RATIFIED, REVISED-PENDING}`. Per-row. Consumer reads RATIFIED rows only. REVISED-PENDING rows block consumption at session close.

## Prefix Conventions

- `CE-NNN` — Concern ID.
- `AX-NNN` — axiom entry.
- `PR-NNN` — Proposition entry.

## Read-Out

Flat list ordered by `concern_id`; AXIOM rows before PROPOSITION rows per Concern.

## MVP

One RATIFIED row per Concern (axiom or Proposition).
```

- [ ] **Step 2: Verify six fields.** Run: `for f in concern_id entry_id source body provenance status; do grep -qF "\`$f\`" /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/constraint-envelope.md && echo "OK: $f" || echo "MISSING: $f"; done`. Expected: 6 OK.

- [ ] **Step 3: Lint self-test PASS.**

- [ ] **Step 4: Commit.**

```bash
git add skills/design-architect-committee/schema/constraint-envelope.md
git commit -m "feat(design-architect-committee): schema/constraint-envelope.md (6-field Class-1 errata)"
```

---

## Task 8: Write `schema/resolution-criterion.md`

**Type:** docs-producing
**Implements:** AC-3.2
**Decision budget:** 1
**Must remain green:** lint self-test still PASS.

**Files:**
- Create: `skills/design-architect-committee/schema/resolution-criterion.md`

**Steps:**

- [ ] **Step 1: Write the file** sourced from `deliverables-locked-00.md` "Three deliverables → Resolution Criterion":

```markdown
# Resolution Criterion — Schema

Sourced from `deliverables-locked-00.md` § "Three deliverables → Resolution Criterion". Four fields per row. AXIOM rows excluded.

## Row Shape (Four Fields)

- `concern_id` — `CE-NNN`. Shared join key with Constraint Envelope.
- `entry_id` — `PR-NNN` only. FK to Constraint Envelope PROPOSITION row.
- `collapse_test` — IF NOT/THEN contrapositive. Structural form Clerk-enforced.
- `structural_valid` — BOOLEAN. Clerk-set after syntactic contrapositive match. Must be TRUE before designer ratification accepted.

## AXIOM Exclusion

AXIOM rows have no Resolution Criterion row — designer-asserted ground truth has no failure condition.

## Read-Out

One row per ratified PROPOSITION entry. Falsifiability battery for `design-specify`.

## MVP

One row per ratified non-axiom Concern.
```

- [ ] **Step 2: Verify four fields + AXIOM exclusion + IF NOT/THEN form.** Run: `for x in concern_id entry_id collapse_test structural_valid 'IF NOT/THEN' 'AXIOM rows have no'; do grep -qF "$x" /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/resolution-criterion.md && echo "OK: $x" || echo "MISSING: $x"; done`. Expected: 6 OK.

- [ ] **Step 3: Lint self-test PASS.**

- [ ] **Step 4: Commit.**

```bash
git add skills/design-architect-committee/schema/resolution-criterion.md
git commit -m "feat(design-architect-committee): schema/resolution-criterion.md"
```

---

## Task 9: Write `schema/coverage-map.md`

**Type:** docs-producing
**Implements:** AC-3.3
**Decision budget:** 1
**Must remain green:** lint self-test still PASS.

**Files:**
- Create: `skills/design-architect-committee/schema/coverage-map.md`

**Steps:**

- [ ] **Step 1: Write the file** sourced from `deliverables-locked-00.md` "Three deliverables → Coverage Map":

```markdown
# Coverage Map — Schema

Sourced from `deliverables-locked-00.md` § "Three deliverables → Coverage Map". Five fields per row. One row per Concern.

## Row Shape (Five Fields)

- `concern_id` — `CE-NNN`.
- `axiom_ids` — list of `AX-NNN`. Empty if none.
- `proposition_ids` — list of `PR-NNN`. Empty if axiom-only.
- `evidence_ids` — list of `EV-NNN`. Evidence grounding the Propositions.
- `status` — ENUM `{COVERED, AXIOM-ONLY, GAP}`. Clerk computes from Constraint Envelope at round close.

## Status Semantics

- `COVERED` — at least one RATIFIED PROPOSITION row for this Concern.
- `AXIOM-ONLY` — axioms present, zero ratified Propositions. Passes session close but flags for designer inspection.
- `GAP` — neither axioms nor ratified Propositions. **Blocks session close.**

## Read-Out

One summary row per Concern. Consumer reads `status` directly. No aggregation required at consumer surface.

## MVP

Every Concern appears in exactly one row; status populated.
```

- [ ] **Step 2: Verify five fields + status enum + semantics.** Run: `for x in concern_id axiom_ids proposition_ids evidence_ids status COVERED AXIOM-ONLY GAP 'Blocks session close'; do grep -qF "$x" /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/coverage-map.md && echo "OK: $x" || echo "MISSING: $x"; done`. Expected: 9 OK.

- [ ] **Step 3: Lint self-test PASS.**

- [ ] **Step 4: Commit.**

```bash
git add skills/design-architect-committee/schema/coverage-map.md
git commit -m "feat(design-architect-committee): schema/coverage-map.md"
```

---

## Task 10: Write schema structural test

**Type:** code-producing
**Implements:** AC-2.1 (seven-file presence) + structural validation of AC-3.1..AC-3.7
**Decision budget:** 1
**Must remain green:** `tests/test-design-architect-committee-schema.sh`

**Files:**
- Create: `tests/test-design-architect-committee-schema.sh`

**Steps:**

- [ ] **Step 1: Write the test driver** asserting (a) seven files exist non-empty, (b) each carries the required content anchors per AC-3.x. Pattern follows `tests/test-*.sh` convention (`set -euo pipefail`, exit 0 = pass, one-line PASS/FAIL).

- [ ] **Step 2: Run — confirm PASS** (schemas from Tasks 3-9 already on disk).

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-schema.sh`. Expected: all PASS.

- [ ] **Step 3: Commit.**

```bash
git add tests/test-design-architect-committee-schema.sh
git commit -m "test(design-architect-committee): schema structural assertions"
```

---

## Task 11: Write `rules.md` body

**Type:** docs-producing
**Implements:** AC-1.2, AC-1.4, AC-1.5
**Decision budget:** 2 (which Markdown heading anchors to cite; phrasing of citation meta-rule sentence)
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Modify: `skills/design-architect-committee/rules.md` (append body below sidecar header)

**Steps:**

- [ ] **Step 1: Verify current empty body lints clean.** Run: `bash /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/scripts/lint-skill-files.sh`. Expected: PASS for rules.md (zero body words, zero list items).

- [ ] **Step 2: Append body content** (target ~170 words, prose-only, no list items, all enumeration references via Markdown heading anchors):

```markdown
# Rules — `design-architect-committee`

## Citation Meta-Rule

Closed-set content lives in [`schema/`](schema/); capped files cite into `schema/` via Markdown heading anchors; capped files never restate enumerations.

## Designer Authority

The designer holds unconditional authority across assertion, ratification, revision, and withdrawal. Designer signals every phase transition named in [phases-and-transitions](schema/phases-and-transitions.md#transitions). The designer reads Clerk-produced surfaces and never computes them.

## Pole Authority

Poles propose and revise their own Propositions during DELIBERATING. Poles may not ratify, withdraw, or call any designer-authority entry in the [procedure-actor map](schema/actors.md#procedure-actor-map).

## Clerk Authority

The Clerk is a deterministic script. It runs [Lint Batch](schema/procedures.md#lint-batch) and enforces [FK rules](schema/integrity-rules.md#fk-rules) and the [session-close gate](schema/integrity-rules.md#session-close-gate). The Clerk has no deliberative surface and fires automatically on procedure triggers.

## Forbidden Surfaces

Sprint-specific overlay attaches only via the convening message. The general `design-committee` agent files, the general SKILL.md, and output-format field labels are forbidden attach surfaces.

## Convening-Message Discipline

Inter-agent deliberation prompts follow the convention documented in [actors](schema/actors.md#convening-message-discipline). The four files in this skill use normal terse markdown.
```

- [ ] **Step 3: Run lint — confirm PASS.** Run: `bash /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/scripts/lint-skill-files.sh`. Expected: word-count ≤ 200; no list items.

- [ ] **Step 4: Verify citation meta-rule three clauses present.** Run: `grep -F 'lives in' /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/rules.md && grep -F 'cite into' /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/rules.md && grep -F 'never restate' /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/rules.md`. Expected: all three.

- [ ] **Step 5: All tests still green.** Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh && bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-schema.sh`.

- [ ] **Step 6: Commit.**

```bash
git add skills/design-architect-committee/rules.md
git commit -m "feat(design-architect-committee): rules.md body (sidecar; citation meta-rule + actor authority)"
```

---

## Task 12: Write `SKILL.md` body

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.3
**Decision budget:** 2 (operator-summary tone; scope-limits phrasing)
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Modify: `skills/design-architect-committee/SKILL.md` (append body below frontmatter)

**Steps:**

- [ ] **Step 1: Append body content** (target ~165 words, prose-only, no list items, enumeration references via Markdown heading anchors):

```markdown
# Design Architect Committee

## When To Invoke

Invoke when an architectural choice requires structured multi-perspective deliberation governed by the Clerk-enforced single-layer schema. The skill anchors a Mode B convening of the four-pole Committee with the locked Alternative F machinery.

## What It Produces

Three ratified, frozen artifacts for `design-specify` consumption: a [Constraint Envelope](schema/constraint-envelope.md), a [Resolution Criterion](schema/resolution-criterion.md), and a [Coverage Map](schema/coverage-map.md). Cross-artifact integrity is governed by the [FK rules](schema/integrity-rules.md#fk-rules).

## Session Lifecycle

Sessions follow the [five named phases](schema/phases-and-transitions.md#session-phases-five-named-states). [Procedures](schema/procedures.md) mutate state at specific phases per the [procedure-actor map](schema/actors.md#procedure-actor-map). The session closes when the [session-close gate](schema/integrity-rules.md#session-close-gate) clears.

## Outputs To

`design-specify`. Team-lead packages the three deliverables from the Clerk-certified working record at session close. No other downstream consumer.

## Scope Limits

This skill produces only the three frozen deliverables. The Clerk script, dispatch convention, working-directory layout, and on-disk handoff document shape are out of scope for the skill files themselves.
```

- [ ] **Step 2: Lint PASS.** Run: `bash /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/scripts/lint-skill-files.sh`. Expected: PASS.

- [ ] **Step 3: All tests still green.** Run lint self-test + schema structural test.

- [ ] **Step 4: Commit.**

```bash
git add skills/design-architect-committee/SKILL.md
git commit -m "feat(design-architect-committee): SKILL.md body (operator surface)"
```

---

## Task 13: Write `design-brief-template.md`

**Type:** docs-producing
**Implements:** AC-5.1, AC-5.2
**Decision budget:** 2 (worked-Concern wording; populated-row formatting matching schema field shapes)
**Must remain green:** `tests/test-design-architect-committee-template.sh` (created in Task 14)

**Files:**
- Create: `skills/design-architect-committee/design-brief-template.md`

**Steps:**

- [ ] **Step 1: Write the template** with one Concern + axiom + Proposition + populated Coverage Map row + matching Resolution Criterion row. Use bulleted lists freely (template is word-limit exempt). Each populated row mirrors the corresponding schema's field shape exactly. Sections in order: Header → Concerns → Constraint Envelope (worked rows: AX-001 + PR-001) → Resolution Criterion (worked row: PR-001) → Coverage Map (worked row: CE-001) → Confirming three-deliverable visibility paragraph.

(Worked-example content can mirror the prior plan v00 Task 13 template — that content was correct in plan v00; only the surrounding spec drift was wrong.)

- [ ] **Step 2: Verify required anchors.** Run: `grep -E '^## (Concerns|Constraint Envelope|Resolution Criterion|Coverage Map)|CE-001|AX-001|PR-001' /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/design-brief-template.md`. Expected: ≥ 7 matches.

- [ ] **Step 3: All existing tests still green.**

- [ ] **Step 4: Commit.**

```bash
git add skills/design-architect-committee/design-brief-template.md
git commit -m "feat(design-architect-committee): design-brief-template.md worked example"
```

---

## Task 14: Write template structural test

**Type:** code-producing
**Implements:** structural validation of AC-5.1, AC-5.2
**Decision budget:** 1
**Must remain green:** `tests/test-design-architect-committee-template.sh`

**Files:**
- Create: `tests/test-design-architect-committee-template.sh`

**Steps:**

- [ ] **Step 1: Write the test driver** (asserts the four required section headings + three required anchor IDs).

- [ ] **Step 2: Run — confirm PASS.** Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-template.sh`. Expected: all PASS.

- [ ] **Step 3: Commit.**

```bash
git add tests/test-design-architect-committee-template.sh
git commit -m "test(design-architect-committee): template structural assertions"
```

---

## Task 15: Wire pre-commit hook

**Type:** config-producing
**Implements:** AC-6.3
**Decision budget:** 1 (symlink target — absolute path to worktree-resolved script, OR add a wrapper that short-circuits when target file absent on current branch — see plan v00 threat report CRITICAL-2 for the broken-symlink hazard)
**Must remain green:** all three test files green; commit-cycle verification.

**Files:**
- Create: `.git/hooks/pre-commit` (outside repo tree; not added to git)

**Steps:**

- [ ] **Step 1: Confirm no existing pre-commit hook.** Run: `ls -la /home/mike/Documents/CodeProjects/Chester/.git/hooks/pre-commit 2>/dev/null && echo "FAIL: exists" || echo OK`. Expected: `OK`.

- [ ] **Step 2: Choose symlink target carefully.** The `.git/hooks/pre-commit` symlink resolves relative to its own directory (the shared `.git/hooks/`), not to the cwd at exec time. Use an **absolute path** to the script in the main checkout: `/home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/scripts/lint-skill-files.sh`. Note: the script will only exist on `main` after this sprint merges. Until merge, the symlink target is broken on `main` but present in the worktree. Two options:
  - (a) Install the symlink only after merge (defer this task to a post-merge fixup).
  - (b) Install a wrapper script at `.git/hooks/pre-commit` (not a symlink) that checks for the target file's existence and early-exits with success if absent, otherwise execs it. Wraps the cross-worktree availability issue.

Plan v01 default: **option (b)** — install a wrapper that early-exits when the target is absent. This prevents the hook from blocking unrelated commits on other worktrees / branches while still enforcing the lint when working in this skill.

- [ ] **Step 3: Write the wrapper.**

```bash
#!/usr/bin/env bash
# .git/hooks/pre-commit — early-exits when design-architect-committee files absent on current tree.
TARGET="$(git rev-parse --show-toplevel)/skills/design-architect-committee/scripts/lint-skill-files.sh"
if [ -x "$TARGET" ]; then
  bash "$TARGET"
else
  exit 0
fi
```

Install:

```bash
cat > /home/mike/Documents/CodeProjects/Chester/.git/hooks/pre-commit <<'EOF'
#!/usr/bin/env bash
TARGET="$(git rev-parse --show-toplevel)/skills/design-architect-committee/scripts/lint-skill-files.sh"
if [ -x "$TARGET" ]; then bash "$TARGET"; else exit 0; fi
EOF
chmod +x /home/mike/Documents/CodeProjects/Chester/.git/hooks/pre-commit
```

- [ ] **Step 4: Verify hook fires.** Run from the worktree: `cd /home/mike/Documents/CodeProjects/Chester/.worktrees/20260521-02-design-architect-committee && touch /tmp/dummy && git add /tmp/dummy 2>/dev/null; git commit --allow-empty -m "test: pre-commit hook fires" --no-verify=false`. Expected: hook runs the lint; lint passes; commit succeeds.

- [ ] **Step 5: Undo the empty commit to keep history clean.** Run: `git -C /home/mike/Documents/CodeProjects/Chester/.worktrees/20260521-02-design-architect-committee reset --soft HEAD~1 2>/dev/null || true`.

- [ ] **Step 6: No commit needed.** Hook lives outside the repo tree; nothing to add.

---

## Task 16: Register `design-architect-committee` in `setup-start/references/skill-index.md`

**Type:** docs-producing
**Implements:** AC-7.2
**Decision budget:** 2 (insertion position; description text format matching adjacent entries)
**Must remain green:** all three test files green.

**Files:**
- Modify: `skills/setup-start/references/skill-index.md`

**Steps:**

- [ ] **Step 1: Read existing format** around `design-*` entries. Run: `sed -n '25,35p' /home/mike/Documents/CodeProjects/Chester/skills/setup-start/references/skill-index.md`. Capture the entry format (line shape, description style).

- [ ] **Step 2: Insert entry** after the existing `design-specify` entry, mirroring the captured format. Description aligned with `SKILL.md` frontmatter (~1 sentence, terse).

- [ ] **Step 3: Verify entry present.** Run: `grep -F 'design-architect-committee' /home/mike/Documents/CodeProjects/Chester/skills/setup-start/references/skill-index.md`. Expected: ≥ 1 match.

- [ ] **Step 4: Record CLAUDE.md drift observation in execute-write `Decisions:` block.** The two-place-sync convention texts (`skills/CLAUDE.md:33`, root `CLAUDE.md:99`) point at `setup-start/SKILL.md` rather than `references/skill-index.md`. This is a known-but-deferred maintenance item; do not amend CLAUDE.md in this build. Capture in `Decisions:` so the drift is surfaced for a future CLAUDE.md maintenance sprint.

- [ ] **Step 5: Commit.**

```bash
git add skills/setup-start/references/skill-index.md
git commit -m "docs(setup-start): register design-architect-committee in skill-index"
```

---

## Cross-cutting acceptance criteria

These ACs are satisfied by the aggregate of all tasks rather than any single one:

- **AC-7.1** (no `skills/design-committee/` modification) — confirmed by `git diff main..HEAD --name-only -- skills/design-committee/` returning empty at end of execute-write.

---

## Notes for execute-write

- **Default to subagent execution** unless the heuristic from plan-build SKILL.md "Execution Mode Selection" downgrades to inline. Heuristic conditions: task count ≤ 3 (NO — sixteen tasks); threat risk ≤ Moderate (this plan has not been hardened); decision-budget sum ≤ 4 (NO — sum exceeds); no code-producing task touches multiple files (NO — Task 2 touches lint script + test + fixture dir). All four heuristic conditions fail → subagent mode.
- **Plan-hardening (plan-attack + plan-smell) deferred** per designer direction to accept the plan without further committee rounds. Designer adjudicates whether to run hardening before execute-write at the approval gate.
- **The lint script's empty-rules.md handling** is the only non-obvious edge case. `extract_body()` returns the entire file when no frontmatter delimiter is found. This is the intended behavior for `rules.md` (sidecar without YAML frontmatter); the lightweight `**Status:** Sidecar to SKILL.md` header at the top is part of body content for word-count purposes. Plan target of ~170 words leaves ~30-word headroom.

---

## Change Log

- **01 (2026-05-23):** Initial Option B++ plan. Sixteen tasks covering brief-strict skill build: scaffolding, two-sub-check lint + self-tests, seven schema files (with Class-1 fact-correction errata for CE six-field + no-automatic-transitions; Class-2 bounded-discretion placement for AX-008 in `schema/actors.md`), two structural tests, two capped-file bodies (`SKILL.md` uppercase, `rules.md` sidecar), worked template, pre-commit hook wiring (wrapper approach to handle cross-worktree availability), and skill-index registration. Supersedes plan v00 which planned against the abandoned token-grammar spec v02.

<!-- created-at: 2026-05-23T13:17:32Z -->
<!-- produced-by plan-build@v0004 -->
