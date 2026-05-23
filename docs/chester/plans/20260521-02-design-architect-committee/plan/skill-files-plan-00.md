# Plan: `design-architect-committee` Skill Files Build

**Sprint:** `20260521-02-design-architect-committee`
**Spec:** `docs/chester/working/20260521-02-design-architect-committee/spec/skill-files-spec-02.md`
**Execution mode:** TBD — Phase 8 (Execution Mode Selection) skipped per user direction at plan-build invocation; designer fills this field before `execute-write` runs.

> **For agentic workers:** Use `execute-write` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which `execute-write` section runs — Section 2 (subagent-driven) or Section 3 (inline). For this plan it must be filled before `execute-write` is invoked.

## Goal

Produce the four operator-facing files for the `design-architect-committee` Chester skill, the four-sub-check pre-commit lint, three structural tests, and the `setup-start/references/skill-index.md` registration entry — such that all twenty-two acceptance criteria in `skill-files-spec-02.md` pass and the lint blocks any future commit that violates the cap, list-item ban, token presence, or token uniqueness.

## Architecture

Hybrid token-anchor citation contract. Two prose files (`skill.md`, `rules.md`) carry only operator-facing description and discipline; every closed-set enumeration lives in one of seven data-only `schema/` files behind a bracket-wrapped uppercase token (`[CE-SOURCE-ENUM]`, `[GATE-SESSION-CLOSE]`, etc.). Capped files cite tokens by literal name; a pre-commit shell lint enforces word cap, no-Markdown-list-items, token-resolves-to-some-schema-definition, and token-uniqueness-across-schema simultaneously. The worked template proves the three frozen deliverables (Constraint Envelope, Resolution Criterion, Coverage Map) emerge by read from a single populated Concern.

## Tech Stack

- **Markdown** — all content artifacts (`skill.md`, `rules.md`, seven `schema/*.md`, `design-brief-template.md`).
- **Bash** — `scripts/lint-skill-files.sh` and the three `tests/test-design-architect-committee-*.sh` files. Pattern follows existing Chester convention: self-contained, `set -euo pipefail`, exit 0 = pass, one-line PASS/FAIL per assertion.
- **Git pre-commit hook** — symlink from `.git/hooks/pre-commit` to `scripts/lint-skill-files.sh`. `.git/config` already has `core.hooksPath = .git/hooks` (verified at ground-truth review).
- **YAML frontmatter** — `name`, `description`, `version: v0001` on `skill.md` only. `rules.md` has no frontmatter (it is a content sidecar to `skill.md`, not a separately-invocable skill — clarified from spec at planning time).
- **`chester-trailer-write`** — used by skills, not by execute-write tasks here; mentioned for completeness.

## Notes on cross-task ordering

- **Schema files (Tasks 3–9) precede capped-file body content (Tasks 12, 13).** Capped files cite tokens that must already resolve to definitions in `schema/` or the lint sub-check 3 fails on commit.
- **Lint script (Task 2) precedes capped-file body content (Tasks 12, 13).** Without the lint installed and tested, every commit of a capped file would risk introducing a violation. The lint must exist and self-test green before any capped-file content lands.
- **Pre-commit wiring (Task 15) lands LATE.** Wiring the hook before tasks 12-13 would block their commits if those tasks include intentional intermediate states. Wire the hook only after capped-file bodies are clean and tests are green.
- **`skill-index.md` registration (Task 16) lands LAST.** Two-place sync: don't register a skill whose body files aren't yet on disk.

## Per-task field conventions

Every task declares:

- **Task ID** — `Task N`, stable across plan revisions.
- **Type** — `code-producing` (bash scripts), `docs-producing` (Markdown), or `config-producing` (hook wiring, skill-index entry).
- **Implements** — list of spec AC IDs the task satisfies.
- **Decision budget** — estimated count of ambiguities the implementer hits.
- **Must remain green** — test names that must pass after this task lands.

---

## Task 1: Scaffold skill directory and frontmatter stubs

**Type:** docs-producing
**Implements:** (foundational; AC-1.1, AC-1.2 partial — frontmatter only)
**Decision budget:** 1 (rules.md frontmatter shape)
**Must remain green:** (no tests yet)

**Files:**
- Create: `skills/design-architect-committee/skill.md` (frontmatter + empty body)
- Create: `skills/design-architect-committee/rules.md` (frontmatter + empty body)
- Create: `skills/design-architect-committee/schema/` (directory only)
- Create: `skills/design-architect-committee/scripts/` (directory only)

**Steps (TDD-adapted for scaffolding):**

- [ ] **Step 1: Verify the directory does not yet exist**

Run: `test ! -d /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee && echo OK || echo "FAIL: directory already exists"`
Expected: `OK`

- [ ] **Step 2: Create the skill directory and `schema/` plus `scripts/` subdirectories**

Run: `mkdir -p /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/scripts`

- [ ] **Step 3: Write `skill.md` with frontmatter only (no body)**

Content (`skills/design-architect-committee/skill.md`):

```markdown
---
name: design-architect-committee
description: Convene the four-pole Committee in Mode B for a session that produces a ratified Constraint Envelope, Resolution Criterion, and Coverage Map for design-specify. Use when the architectural choice requires structured deliberation with a Clerk-enforced schema and the five-phase OPEN→ANCHORED→DELIBERATING→RATIFYING→CLOSED lifecycle.
version: v0001
---
```

Body to be added at Task 12.

- [ ] **Step 4: Write `rules.md` with frontmatter only (no body)**

Per spec line 18: frontmatter key `name`, value `design-architect-committee-rules`. (Earlier plan draft used `artifact:` per a sidecar reading; plan-review pulled this back to spec-literal — designer can override at execute-write time if `rules.md` is genuinely not Skill-tool-registered, but default = match spec.)

```markdown
---
name: design-architect-committee-rules
description: Actor authority and discipline for design-architect-committee sessions. Read alongside skill.md when convening or operating a session.
version: v0001
---
```

Body to be added at Task 11.

- [ ] **Step 5: Verify both files exist with valid frontmatter (delimited by two `---` lines)**

Run: `head -5 /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/skill.md && echo "---rules.md---" && head -5 /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/rules.md`
Expected: each file shows a frontmatter block opened by `---` on line 1 and closed by `---` on a subsequent line.

- [ ] **Step 6: Commit**

```bash
git add skills/design-architect-committee/
git commit -m "chore(design-architect-committee): scaffold skill folder and frontmatter stubs"
```

---

## Task 2: Write the four-sub-check lint script and its self-test fixtures

**Type:** code-producing
**Implements:** AC-6.1, AC-6.2, AC-6.3, AC-6.4 (lint sub-checks operational)
**Decision budget:** 3 (frontmatter boundary detection, body-line indexing for FAIL messages, fixture directory layout)
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Create: `skills/design-architect-committee/scripts/lint-skill-files.sh` (the lint script)
- Create: `tests/test-design-architect-committee-lint.sh` (the lint self-test driver)
- Create: `tests/fixtures/design-architect-committee-lint/` (fixture directory tree — pass + four fail fixtures)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test driver `tests/test-design-architect-committee-lint.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

LINT="$(dirname "$0")/../skills/design-architect-committee/scripts/lint-skill-files.sh"
FIX="$(dirname "$0")/fixtures/design-architect-committee-lint"

assert_pass() {
  local name="$1" skill="$2" rules="$3" schema_dir="$4"
  if bash "$LINT" "$skill" "$rules" "$schema_dir" >/dev/null 2>&1; then
    echo "PASS: $name"
  else
    echo "FAIL: $name — expected lint to pass"; exit 1
  fi
}
assert_fail() {
  local name="$1" expect_msg="$2" skill="$3" rules="$4" schema_dir="$5"
  local out
  if out=$(bash "$LINT" "$skill" "$rules" "$schema_dir" 2>&1); then
    echo "FAIL: $name — expected lint to fail"; exit 1
  fi
  if grep -q "$expect_msg" <<<"$out"; then
    echo "PASS: $name"
  else
    echo "FAIL: $name — output did not contain '$expect_msg'"; echo "$out"; exit 1
  fi
}

assert_pass "clean fixture" "$FIX/clean/skill.md" "$FIX/clean/rules.md" "$FIX/clean/schema"
assert_fail "over-cap fixture (AC-1.1 lint)" "exceeds cap of 200" "$FIX/over-cap/skill.md" "$FIX/over-cap/rules.md" "$FIX/over-cap/schema"
assert_fail "list-item fixture (AC-1.3 lint)" "forbidden list pattern" "$FIX/list-item/skill.md" "$FIX/list-item/rules.md" "$FIX/list-item/schema"
assert_fail "undefined-token fixture (AC-4.4 lint)" "not defined in any schema" "$FIX/undefined-token/skill.md" "$FIX/undefined-token/rules.md" "$FIX/undefined-token/schema"
assert_fail "collision fixture (AC-4.2 lint)" "defined in both" "$FIX/collision/skill.md" "$FIX/collision/rules.md" "$FIX/collision/schema"

echo "all lint self-tests passed"
```

- [ ] **Step 2: Run the test driver — confirm it fails (lint script does not exist yet)**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh`
Expected: FAIL because `scripts/lint-skill-files.sh` does not exist.

- [ ] **Step 3: Create the fixture directories**

Five fixture sets under `tests/fixtures/design-architect-committee-lint/`: `clean/`, `over-cap/`, `list-item/`, `undefined-token/`, `collision/`. Each contains `skill.md`, `rules.md`, and `schema/` (with at least `placeholder.md` so the directory exists for `clean`/`undefined-token`).

For each: build minimal Markdown with the property the fixture name claims. Example for `clean`:

```
clean/skill.md      — frontmatter + body ~50 words, no list items, no token cites
clean/rules.md      — frontmatter + body ~50 words, no list items, cites [CE-SOURCE-ENUM]
clean/schema/foo.md — contains line `**[CE-SOURCE-ENUM]**` definition
```

`over-cap/skill.md` has body > 200 words. `list-item/skill.md` body contains `- something`. `undefined-token/skill.md` cites `[FAKE-TOKEN]`. `collision/schema/a.md` and `collision/schema/b.md` both define `**[DUP-TOKEN]**`.

- [ ] **Step 4: Write the lint script `skills/design-architect-committee/scripts/lint-skill-files.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: lint-skill-files.sh <skill.md> <rules.md> <schema_dir>
# When invoked as a git pre-commit hook with no arguments, defaults to the
# skill's canonical paths.

SKILL_PATH="${1:-skills/design-architect-committee/skill.md}"
RULES_PATH="${2:-skills/design-architect-committee/rules.md}"
SCHEMA_DIR="${3:-skills/design-architect-committee/schema}"
CAP=200

fail=0

extract_body() {
  # Strip YAML frontmatter (everything between first `---` line and the
  # NEXT `---` line). Print only the body.
  awk 'BEGIN{state=0} /^---$/ { state++; next } state>=2 { print }' "$1"
}

check_word_cap() {
  local path="$1"
  local count
  count=$(extract_body "$path" | wc -w | tr -d ' ')
  if [ "$count" -gt "$CAP" ]; then
    echo "FAIL: $(basename "$path") body word count $count exceeds cap of $CAP"
    fail=1
  else
    echo "PASS: $(basename "$path") body word count $count"
  fi
}

check_list_ban() {
  local path="$1"
  local hit
  hit=$(extract_body "$path" | grep -nE '^- |^[0-9]+\. ' || true)
  if [ -n "$hit" ]; then
    echo "FAIL: $(basename "$path") body line matches forbidden list pattern: '$hit'"
    fail=1
  else
    echo "PASS: $(basename "$path") body free of list items"
  fi
}

check_tokens_resolve() {
  local path="$1"
  local cite token
  while IFS= read -r cite; do
    # Strip the brackets
    token="${cite#[}"
    token="${token%]}"
    if ! grep -q "^\*\*\[$token\]\*\*" "$SCHEMA_DIR"/*.md 2>/dev/null; then
      echo "FAIL: $(basename "$path") cites $cite not defined in any schema/ file"
      fail=1
    fi
  done < <(extract_body "$path" | grep -oE '\[[A-Z][A-Z-]+\]' | sort -u)
}

check_no_collisions() {
  local dup
  dup=$(grep -hoE '^\*\*\[[A-Z][A-Z-]+\]\*\*' "$SCHEMA_DIR"/*.md 2>/dev/null | sort | uniq -d || true)
  if [ -n "$dup" ]; then
    # Identify which files defined the duplicate
    local d
    for d in $dup; do
      local clean files
      clean="${d#\*\*}"; clean="${clean%\*\*}"
      files=$(grep -lF "$d" "$SCHEMA_DIR"/*.md | xargs -n1 basename | sort | tr '\n' ' ')
      echo "FAIL: token $clean defined in both $files"
      fail=1
    done
  else
    echo "PASS: no token collision across schema/"
  fi
}

check_word_cap "$SKILL_PATH"
check_word_cap "$RULES_PATH"
check_list_ban "$SKILL_PATH"
check_list_ban "$RULES_PATH"
check_tokens_resolve "$SKILL_PATH"
check_tokens_resolve "$RULES_PATH"
check_no_collisions

if [ "$fail" -eq 1 ]; then
  exit 1
fi
echo "lint passed"
```

- [ ] **Step 5: Make the lint script executable and run the test driver**

Run:
```bash
chmod +x /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/scripts/lint-skill-files.sh
bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh
```
Expected: all five assertions PASS; final line `all lint self-tests passed`.

- [ ] **Step 6: Commit**

```bash
git add skills/design-architect-committee/scripts/lint-skill-files.sh \
        tests/test-design-architect-committee-lint.sh \
        tests/fixtures/design-architect-committee-lint/
git commit -m "feat(design-architect-committee): lint script with four sub-checks and self-tests"
```

---

## Task 3: Write `schema/integrity-rules.md`

**Type:** docs-producing
**Implements:** AC-3.7
**Decision budget:** 1 (token name for the session-close gate)
**Must remain green:** `tests/test-design-architect-committee-lint.sh` (still passes because no tokens cited from capped files yet)

**Files:**
- Create: `skills/design-architect-committee/schema/integrity-rules.md`

**Steps (TDD):**

- [ ] **Step 1: Write the file** (sourced verbatim from `deliverables-locked-00.md` "Cross-artifact integrity rules" and `process-locked-00.md` "Session-close gate")

```markdown
# Integrity Rules — Schema

Cross-artifact foreign-key rules and the session-close gate. Sourced from `deliverables-locked-00.md` "Cross-artifact integrity rules" and `process-locked-00.md` "Session-close gate".

## **[FK-RULES]**

- `concern_id` referenced in any Coverage Map row must appear in the Constraint Envelope.
- `entry_id` referenced in any Coverage Map list (`axiom_ids`, `proposition_ids`) must appear in the Constraint Envelope with matching `source`.
- `entry_id` in any Resolution Criterion row must appear in the Constraint Envelope with `source = PROPOSITION` and `status = RATIFIED`.
- Every PROPOSITION row in the Constraint Envelope must have exactly one matching Resolution Criterion row.
- AXIOM rows in the Constraint Envelope have no matching Resolution Criterion row.

## **[GATE-SESSION-CLOSE]**

Three Clerk-computed conditions, all required:

- Zero GAP rows in Coverage Map.
- Zero REVISED-PENDING rows in Constraint Envelope.
- Every PROPOSITION row in Constraint Envelope has exactly one matching Resolution Criterion row with `structural_valid = TRUE`.

Plus cross-artifact FK checks pass.

AXIOM-ONLY rows in Coverage Map do not block close — flag for designer inspection only.
```

- [ ] **Step 2: Verify file exists and contains both tokens as bold definition lines**

Run:
```bash
grep -E '^\*\*\[FK-RULES\]\*\*$|^\*\*\[GATE-SESSION-CLOSE\]\*\*$' \
  /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/integrity-rules.md
```
Expected: two matching lines.

- [ ] **Step 3: Run the lint self-test to confirm no regression**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/design-architect-committee/schema/integrity-rules.md
git commit -m "feat(design-architect-committee): schema/integrity-rules.md"
```

---

## Task 4: Write `schema/phases-and-transitions.md`

**Type:** docs-producing
**Implements:** AC-3.4
**Decision budget:** 1 (whether to include the designer-triggered constraint inside `[PHASE-TRANSITION-TABLE]` or as separate prose — choose inside the token definition, per AC-3.4 update)
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Create: `skills/design-architect-committee/schema/phases-and-transitions.md`

**Steps (TDD):**

- [ ] **Step 1: Write the file** (sourced from `process-locked-00.md` Session phases, Transitions, Cascade handling, Withdrawal handling)

```markdown
# Phases and Transitions — Schema

Five-phase session lifecycle, transitions, cascade timing, and withdrawal exception. Sourced from `process-locked-00.md`.

## **[PHASE-STATE-LIST]**

`OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED`

- `OPEN` — Concerns registered. No axioms yet. No Propositions permitted. No deliberation permitted.
- `ANCHORED` — Designer has asserted at least one axiom for at least one Concern. Per-Concern partial-license state.
- `DELIBERATING` — At least one Concern is anchored AND designer has initiated deliberation. Poles submit Proposition records.
- `RATIFYING` — Round-end signal received from designer. Clerk lint complete. Designer reviews and dispositions each row.
- `CLOSED` — Session-close gate cleared. Deliverables frozen. Terminal state.

## **[PHASE-TRANSITION-TABLE]**

- `OPEN → ANCHORED` — designer asserts first axiom on any Concern.
- `ANCHORED → DELIBERATING` — designer initiates deliberation (explicit signal).
- `DELIBERATING → RATIFYING` — designer issues explicit round-end signal AND Clerk lint completes.
- `RATIFYING → DELIBERATING` — at least one row entered REVISED-PENDING via designer per-row reject, or session-close gate failed; new round opens.
- `RATIFYING → CLOSED` — session-close gate clears.

**Constraint (load-bearing):** No transition fires automatically on a coverage condition. Every advance is designer-triggered.

## **[CASCADE-TIMING]**

Hybrid: synchronous scope capture at the trigger event, deferred status mutation at round-close lint.

- **Synchronous step** — Clerk captures cascade scope immediately. No status mutation yet on dependent rows.
- **Deferred step (at round-close lint)** — Clerk flips all in-scope dependent rows to REVISED-PENDING. Coverage Map recomputed.

Provenance-differentiated scope:

- DESIGNER axiom revision → all PROPOSITION rows for that Concern.
- AGENT Proposition revision → only rows whose `grounding` cites the revised `entry_id`, then transitive.

## **[WITHDRAWAL-RULE]**

Exception to deferred timing: withdrawal fires the full cascade (both scope capture AND status mutation) immediately at the withdrawal event. Rationale: withdrawal is designer-initiated and visible immediately; no mid-round race window exists. All rows whose `grounding` cites the withdrawn `entry_id` enter REVISED-PENDING. Coverage Map recomputed. Withdrawal is irreversible — re-entry requires a new `entry_id`.
```

- [ ] **Step 2: Verify tokens present**

Run:
```bash
grep -cE '^\*\*\[(PHASE-STATE-LIST|PHASE-TRANSITION-TABLE|CASCADE-TIMING|WITHDRAWAL-RULE)\]\*\*$' \
  /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/phases-and-transitions.md
```
Expected: `4`.

- [ ] **Step 3: Lint self-test passes**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/design-architect-committee/schema/phases-and-transitions.md
git commit -m "feat(design-architect-committee): schema/phases-and-transitions.md"
```

---

## Task 5: Write `schema/procedures.md`

**Type:** docs-producing
**Implements:** AC-3.5
**Decision budget:** 2 (per-procedure token naming convention; one-liner field formatting)
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Create: `skills/design-architect-committee/schema/procedures.md`

**Steps (TDD):**

- [ ] **Step 1: Write the file** (sourced from `procedures-locked-00.md`; transcribe each procedure's Mutates / Trigger / Gates / State as one-liners)

Token naming convention: `[PROC-{VERB}-{NOUN}]` in SCREAMING-KEBAB, derived from the procedure name. Twelve per-procedure tokens plus one list token.

File starts with `## **[PROCEDURE-LIST]**` listing all twelve procedure tokens. Then twelve `### **[PROC-X]**` sub-sections, each with Mutates / Trigger / Gates / State as four bullet one-liners.

Source the content verbatim from `docs/chester/working/20260521-02-design-architect-committee/design/procedures-locked-00.md`.

Per-procedure tokens to define:
`[PROC-ADD-CONCERN]`, `[PROC-ADD-EVIDENCE]`, `[PROC-ADD-AXIOM]`, `[PROC-INITIATE-DELIBERATION]`, `[PROC-PROPOSE-PROPOSITION]`, `[PROC-SUBMIT-ROUND]`, `[PROC-LINT-BATCH]`, `[PROC-RATIFY-ROW]`, `[PROC-RE-RATIFY-ROW]`, `[PROC-REVISE-ROW]`, `[PROC-WITHDRAW-ENTRY]`, `[PROC-CLOSE-SESSION]`.

- [ ] **Step 2: Verify all thirteen tokens present**

Run:
```bash
grep -cE '^\*\*\[PROC(EDURE)?-[A-Z-]+\]\*\*$' \
  /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/procedures.md
```
Expected: `13` (one PROCEDURE-LIST + twelve PROC-* tokens).

- [ ] **Step 3: Lint self-test passes**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/design-architect-committee/schema/procedures.md
git commit -m "feat(design-architect-committee): schema/procedures.md (12 procedures)"
```

---

## Task 6: Write `schema/actors.md`

**Type:** docs-producing
**Implements:** AC-3.6, AC-7.2 (definition side)
**Decision budget:** 2 (designer-surface-per-phase token granularity; whether `[CONVENE-MSG-PATTERN]` lives here or in `procedures.md`)
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Create: `skills/design-architect-committee/schema/actors.md`

**Steps (TDD):**

- [ ] **Step 1: Write the file** (sourced from `actors-locked-00.md`)

Four tokens: `[ROLE-INVENTORY]`, `[PROCEDURE-ACTOR-MAP]`, `[DESIGNER-SURFACE-PER-PHASE]`, `[CONVENE-MSG-PATTERN]`.

`[ROLE-INVENTORY]` enumerates five roles (Designer, Pole, Clerk, Team-Lead, Researcher) with scope and authority surface.
`[PROCEDURE-ACTOR-MAP]` enumerates thirteen entries — twelve procedures plus the non-procedure Dispatch Round — naming the actor authorized to call each.
`[DESIGNER-SURFACE-PER-PHASE]` enumerates the procedures available to the designer at each of the five phases.
`[CONVENE-MSG-PATTERN]` defines the inter-agent prompt convention: caveman ultra for inter-agent deliberation prompts; normal terse markdown for designer-facing surfaces (the four files in this build). Cite source: `handoff-alternative-f-design-details-00.md` §2 AX-008.

- [ ] **Step 2: Verify tokens present**

Run:
```bash
grep -cE '^\*\*\[(ROLE-INVENTORY|PROCEDURE-ACTOR-MAP|DESIGNER-SURFACE-PER-PHASE|CONVENE-MSG-PATTERN)\]\*\*$' \
  /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/actors.md
```
Expected: `4`.

- [ ] **Step 3: Lint self-test passes**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/design-architect-committee/schema/actors.md
git commit -m "feat(design-architect-committee): schema/actors.md (5 roles + actor map)"
```

---

## Task 7: Write `schema/constraint-envelope.md`

**Type:** docs-producing
**Implements:** AC-3.1
**Decision budget:** 1 (whether to include MVP and read-out rules verbatim or skip)
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Create: `skills/design-architect-committee/schema/constraint-envelope.md`

**Steps (TDD):**

- [ ] **Step 1: Write the file** (sourced from `deliverables-locked-00.md` "Three deliverables → Constraint Envelope")

Five tokens: `[CE-FIELD-SHAPE]` (enumerates all six fields by name with type/constraint each), `[CE-SOURCE-ENUM]` (`{ AXIOM | PROPOSITION }`), `[CE-PROVENANCE-ENUM]` (`{ DESIGNER | AGENT }`), `[CE-STATUS-ENUM]` (`{ RATIFIED | REVISED-PENDING }`), `[CE-PREFIX-CONVENTION]` (`CE-NNN`, `AX-NNN`, `PR-NNN`).

Six fields under `[CE-FIELD-SHAPE]`: `concern_id`, `entry_id`, `source`, `body`, `provenance`, `status`.

- [ ] **Step 2: Verify tokens + six fields enumerated**

Run:
```bash
grep -cE '^\*\*\[CE-(FIELD-SHAPE|SOURCE-ENUM|PROVENANCE-ENUM|STATUS-ENUM|PREFIX-CONVENTION)\]\*\*$' \
  /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/constraint-envelope.md
grep -c 'concern_id\|entry_id\|source\|body\|provenance\|status' \
  /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/constraint-envelope.md
```
Expected: `5` tokens; field names each appear at least once.

- [ ] **Step 3: Lint self-test passes**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/design-architect-committee/schema/constraint-envelope.md
git commit -m "feat(design-architect-committee): schema/constraint-envelope.md"
```

---

## Task 8: Write `schema/resolution-criterion.md`

**Type:** docs-producing
**Implements:** AC-3.2
**Decision budget:** 1 (whether RC token names follow CE pattern exactly)
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Create: `skills/design-architect-committee/schema/resolution-criterion.md`

**Steps (TDD):**

- [ ] **Step 1: Write the file** (sourced from `deliverables-locked-00.md` "Three deliverables → Resolution Criterion")

Four tokens: `[RC-FIELD-SHAPE]`, `[RC-AXIOM-EXCLUSION]`, `[RC-COLLAPSE-FORM]`, `[RC-STRUCTURAL-VALID]`.

`[RC-FIELD-SHAPE]` enumerates four fields: `concern_id`, `entry_id` (PR-NNN only), `collapse_test`, `structural_valid`.
`[RC-AXIOM-EXCLUSION]` states: AXIOM rows excluded.
`[RC-COLLAPSE-FORM]` states: IF NOT / THEN contrapositive, Clerk-enforced.
`[RC-STRUCTURAL-VALID]` states: BOOLEAN, Clerk-set after syntactic contrapositive match, must be TRUE before designer ratification accepted.

- [ ] **Step 2: Verify tokens present**

Run:
```bash
grep -cE '^\*\*\[RC-(FIELD-SHAPE|AXIOM-EXCLUSION|COLLAPSE-FORM|STRUCTURAL-VALID)\]\*\*$' \
  /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/resolution-criterion.md
```
Expected: `4`.

- [ ] **Step 3: Lint self-test passes**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/design-architect-committee/schema/resolution-criterion.md
git commit -m "feat(design-architect-committee): schema/resolution-criterion.md"
```

---

## Task 9: Write `schema/coverage-map.md`

**Type:** docs-producing
**Implements:** AC-3.3
**Decision budget:** 1
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Create: `skills/design-architect-committee/schema/coverage-map.md`

**Steps (TDD):**

- [ ] **Step 1: Write the file** (sourced from `deliverables-locked-00.md` "Three deliverables → Coverage Map")

Three tokens: `[CM-FIELD-SHAPE]`, `[CM-STATUS-ENUM]`, `[CM-STATUS-SEMANTICS]`.

`[CM-FIELD-SHAPE]` enumerates five fields: `concern_id`, `axiom_ids`, `proposition_ids`, `evidence_ids`, `status`.
`[CM-STATUS-ENUM]` lists `{ COVERED | AXIOM-ONLY | GAP }`.
`[CM-STATUS-SEMANTICS]` states: COVERED requires ≥1 RATIFIED PROPOSITION; AXIOM-ONLY permits close with flag; GAP blocks close.

- [ ] **Step 2: Verify tokens present**

Run:
```bash
grep -cE '^\*\*\[CM-(FIELD-SHAPE|STATUS-ENUM|STATUS-SEMANTICS)\]\*\*$' \
  /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/schema/coverage-map.md
```
Expected: `3`.

- [ ] **Step 3: Lint self-test passes (token-collision check now exercises all seven schema files)**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/design-architect-committee/schema/coverage-map.md
git commit -m "feat(design-architect-committee): schema/coverage-map.md"
```

---

## Task 10: Write the schema structural test

**Type:** code-producing
**Implements:** AC-2.1 (file set) + structural validation of AC-3.1..AC-3.7
**Decision budget:** 1
**Must remain green:** `tests/test-design-architect-committee-schema.sh`

**Files:**
- Create: `tests/test-design-architect-committee-schema.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(dirname "$0")/.."
SCHEMA="$ROOT/skills/design-architect-committee/schema"

assert_file() {
  if [ -s "$SCHEMA/$1" ]; then echo "PASS: $1 exists and non-empty"
  else echo "FAIL: $SCHEMA/$1 missing or empty"; exit 1; fi
}
assert_token() {
  if grep -qE "^\*\*\[$2\]\*\*$" "$SCHEMA/$1"; then echo "PASS: $1 carries [$2]"
  else echo "FAIL: $1 missing [$2]"; exit 1; fi
}

for f in constraint-envelope.md resolution-criterion.md coverage-map.md phases-and-transitions.md procedures.md actors.md integrity-rules.md; do
  assert_file "$f"
done

assert_token constraint-envelope.md CE-FIELD-SHAPE
assert_token constraint-envelope.md CE-SOURCE-ENUM
assert_token constraint-envelope.md CE-PROVENANCE-ENUM
assert_token constraint-envelope.md CE-STATUS-ENUM
assert_token constraint-envelope.md CE-PREFIX-CONVENTION

assert_token resolution-criterion.md RC-FIELD-SHAPE
assert_token resolution-criterion.md RC-AXIOM-EXCLUSION
assert_token resolution-criterion.md RC-COLLAPSE-FORM
assert_token resolution-criterion.md RC-STRUCTURAL-VALID

assert_token coverage-map.md CM-FIELD-SHAPE
assert_token coverage-map.md CM-STATUS-ENUM
assert_token coverage-map.md CM-STATUS-SEMANTICS

assert_token phases-and-transitions.md PHASE-STATE-LIST
assert_token phases-and-transitions.md PHASE-TRANSITION-TABLE
assert_token phases-and-transitions.md CASCADE-TIMING
assert_token phases-and-transitions.md WITHDRAWAL-RULE

assert_token procedures.md PROCEDURE-LIST
for p in ADD-CONCERN ADD-EVIDENCE ADD-AXIOM INITIATE-DELIBERATION PROPOSE-PROPOSITION SUBMIT-ROUND LINT-BATCH RATIFY-ROW RE-RATIFY-ROW REVISE-ROW WITHDRAW-ENTRY CLOSE-SESSION; do
  assert_token procedures.md "PROC-$p"
done

assert_token actors.md ROLE-INVENTORY
assert_token actors.md PROCEDURE-ACTOR-MAP
assert_token actors.md DESIGNER-SURFACE-PER-PHASE
assert_token actors.md CONVENE-MSG-PATTERN

assert_token integrity-rules.md FK-RULES
assert_token integrity-rules.md GATE-SESSION-CLOSE

echo "schema structural test passed"
```

- [ ] **Step 2: Run — confirm PASS (schemas already exist from Tasks 3-9)**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-schema.sh`
Expected: all PASS; final line `schema structural test passed`.

- [ ] **Step 3: Commit**

```bash
git add tests/test-design-architect-committee-schema.sh
git commit -m "test(design-architect-committee): schema structural assertions"
```

---

## Task 11: Write `rules.md` body

**Type:** docs-producing
**Implements:** AC-1.2, AC-1.4, AC-1.5, AC-4.3 (rules.md cites tokens), AC-7.2 (cite side — Convening Message Discipline)
**Decision budget:** 3 (which token to cite for cascade; phrasing of citation meta-rule sentence; section ordering)
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Modify: `skills/design-architect-committee/rules.md` (add body content below frontmatter)

**Steps (TDD):**

- [ ] **Step 1: Run lint to confirm it passes on current empty body**

Run: `bash /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/scripts/lint-skill-files.sh skills/design-architect-committee/skill.md skills/design-architect-committee/rules.md skills/design-architect-committee/schema`
Expected: PASS (empty body has 0 words, 0 list items, 0 cited tokens).

- [ ] **Step 2: Append the body content**

Body content (must be ≤ 200 words, prose-only, no list items, all closed-set references via token cites):

```markdown
# Rules — `design-architect-committee`

## Citation Meta-Rule

Closed-set content lives in `schema/`; capped files cite by token anchor, never restate.

## Designer Authority

The designer holds unconditional authority across assertion, ratification, revision, and withdrawal. Designer signals every phase transition named in `[PHASE-TRANSITION-TABLE]`. The designer reads Clerk-produced surfaces and never computes them.

## Pole Authority

Poles propose and revise their own Propositions during DELIBERATING. Poles may not ratify, withdraw, or call any designer-authority entry in `[PROCEDURE-ACTOR-MAP]`.

## Clerk Authority

The Clerk is a deterministic script that runs `[PROC-LINT-BATCH]` and enforces the integrity rules `[FK-RULES]` and the gate `[GATE-SESSION-CLOSE]`. The Clerk has no deliberative surface. All Clerk operations fire automatically on procedure triggers.

## Forbidden Surfaces

Sprint-specific overlay attaches only via the convening message. Agent files, the general `design-committee` SKILL.md, and output-format field labels are forbidden attach surfaces.

## Convening-Message Discipline

Inter-agent deliberation prompts follow `[CONVENE-MSG-PATTERN]`. The four files in this skill use normal terse markdown.
```

Word count target: ~180 words (verify with `wc -w` after frontmatter strip).

- [ ] **Step 3: Run the lint script — confirm PASS for all four sub-checks**

Run: `bash /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/scripts/lint-skill-files.sh skills/design-architect-committee/skill.md skills/design-architect-committee/rules.md skills/design-architect-committee/schema`
Expected: PASS for rules.md (word count ≤ 200; no list items; all cited tokens resolve to schema definitions; no collisions).

- [ ] **Step 4: Run the lint self-test and schema structural test (no regression)**

Run:
```bash
bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh
bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-schema.sh
```
Expected: both PASS.

- [ ] **Step 5: Verify citation meta-rule sentence present (AC-1.5)**

Run: `grep -qF 'cite by token anchor, never restate' /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/rules.md && echo OK`
Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add skills/design-architect-committee/rules.md
git commit -m "feat(design-architect-committee): rules.md body (citation meta-rule + actor authority)"
```

---

## Task 12: Write `skill.md` body

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.3, AC-4.3 (skill.md cites tokens)
**Decision budget:** 2 (operator-summary tone; whether to include scope-limits prose)
**Must remain green:** `tests/test-design-architect-committee-lint.sh`

**Files:**
- Modify: `skills/design-architect-committee/skill.md` (add body content below frontmatter)

**Steps (TDD):**

- [ ] **Step 1: Append body content**

Body content (must be ≤ 200 words, prose-only, no list items, closed-set references via tokens):

```markdown
# Design Architect Committee

## When To Invoke

Invoke when an architectural choice requires structured multi-perspective deliberation governed by the Clerk-enforced single-layer schema. The skill anchors a Mode B convening of the four-pole Committee with the locked Alternative F machinery.

## What It Produces

Three ratified, frozen artifacts for `design-specify` consumption: a Constraint Envelope, a Resolution Criterion, and a Coverage Map. Field shapes are defined by `[CE-FIELD-SHAPE]`, `[RC-FIELD-SHAPE]`, and `[CM-FIELD-SHAPE]`. Cross-artifact integrity is governed by `[FK-RULES]`.

## Session Lifecycle

Sessions follow the five named phases in `[PHASE-STATE-LIST]` with transitions in `[PHASE-TRANSITION-TABLE]`. Procedures listed in `[PROCEDURE-LIST]` mutate state at specific phases per `[PROCEDURE-ACTOR-MAP]`. The session closes when `[GATE-SESSION-CLOSE]` clears.

## Outputs To

`design-specify`. Team-lead packages the three deliverables from the Clerk-certified working record at session close. No other downstream consumer.

## Scope Limits

This skill produces only the three frozen deliverables. The Clerk script, dispatch convention, working-directory layout, and on-disk handoff document shape are out of scope for the skill files themselves.
```

Word count target: ~165 words.

- [ ] **Step 2: Run the lint — confirm PASS**

Run: `bash /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/scripts/lint-skill-files.sh skills/design-architect-committee/skill.md skills/design-architect-committee/rules.md skills/design-architect-committee/schema`
Expected: PASS for all sub-checks.

- [ ] **Step 3: Schema and lint self-tests still green**

Run:
```bash
bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh
bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-schema.sh
```
Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/design-architect-committee/skill.md
git commit -m "feat(design-architect-committee): skill.md body (operator surface)"
```

---

## Task 13: Write `design-brief-template.md`

**Type:** docs-producing
**Implements:** AC-5.1, AC-5.2
**Decision budget:** 2 (worked-Concern wording; populated-row formatting consistency with schema field shapes)
**Must remain green:** `tests/test-design-architect-committee-template.sh` (Task 14 introduces this; this task creates the file that test reads)

**Files:**
- Create: `skills/design-architect-committee/design-brief-template.md`

**Steps (TDD):**

- [ ] **Step 1: Write the file** with one Concern + axiom + Proposition + populated Coverage Map row + matching Resolution Criterion row

Sections (in this order):

```markdown
# Design Brief Template — Worked Example

Single populated example showing all three frozen deliverables emerging by read from one Concern traversal. Read alongside `schema/` to confirm row shapes match.

## Concerns

- `CE-001` — "Architectural choice must be ratified before specify reads it."

## Constraint Envelope (worked rows)

### `AX-001`

- `concern_id`: `CE-001`
- `entry_id`: `AX-001`
- `source`: `AXIOM`
- `body`: IF the design system needs ratified constraints before specify THEN the architecture must be channeled single-layer schema with designer axiom-anchoring.
- `provenance`: `DESIGNER`
- `status`: `RATIFIED`

### `PR-001`

- `concern_id`: `CE-001`
- `entry_id`: `PR-001`
- `source`: `PROPOSITION`
- `body`: IF the schema is single-layer with designer-asserted axioms and agent-proposed propositions THEN the Clerk can enforce cross-artifact integrity mechanically without a proof engine.
- `provenance`: `AGENT`
- `status`: `RATIFIED`

## Resolution Criterion (worked row)

### `PR-001`

- `concern_id`: `CE-001`
- `entry_id`: `PR-001`
- `collapse_test`: IF NOT the Clerk can enforce cross-artifact integrity mechanically without a proof engine THEN the single-layer-schema-plus-designer-axiom architecture fails to deliver ratified constraints before specify.
- `structural_valid`: `TRUE`

## Coverage Map (worked row)

### `CE-001`

- `concern_id`: `CE-001`
- `axiom_ids`: `[AX-001]`
- `proposition_ids`: `[PR-001]`
- `evidence_ids`: `[]`
- `status`: `COVERED`

## Confirming three-deliverable visibility

Reader can identify Constraint Envelope rows (`AX-001`, `PR-001`), Resolution Criterion row (`PR-001`), Coverage Map row (`CE-001`) above without synthesis. Each populated row's fields match the field shape declared in the corresponding `schema/` file.
```

(File is word-limit exempt; bulleted lists permitted because this is the template, not a capped file.)

- [ ] **Step 2: Verify presence of required anchors**

Run:
```bash
grep -E '^### \`(CE|AX|PR)-001\`|^## (Concerns|Constraint Envelope|Resolution Criterion|Coverage Map)' \
  /home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/design-brief-template.md
```
Expected: at least 7 matches (the four section headings + CE-001 + AX-001 + PR-001).

- [ ] **Step 3: Lint and schema tests still green**

Run:
```bash
bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-lint.sh
bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-schema.sh
```
Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/design-architect-committee/design-brief-template.md
git commit -m "feat(design-architect-committee): design-brief-template.md worked example"
```

---

## Task 14: Write the template structural test

**Type:** code-producing
**Implements:** structural validation of AC-5.1, AC-5.2
**Decision budget:** 1
**Must remain green:** `tests/test-design-architect-committee-template.sh`

**Files:**
- Create: `tests/test-design-architect-committee-template.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test driver**

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(dirname "$0")/.."
TPL="$ROOT/skills/design-architect-committee/design-brief-template.md"

assert_section() {
  if grep -qE "^## $1$" "$TPL"; then echo "PASS: section '$1' present"
  else echo "FAIL: section '$1' missing"; exit 1; fi
}
assert_anchor() {
  if grep -qF "$1" "$TPL"; then echo "PASS: anchor '$1' present"
  else echo "FAIL: anchor '$1' missing"; exit 1; fi
}

assert_section "Concerns"
assert_section "Constraint Envelope (worked rows)"
assert_section "Resolution Criterion (worked row)"
assert_section "Coverage Map (worked row)"

assert_anchor "CE-001"
assert_anchor "AX-001"
assert_anchor "PR-001"

echo "template structural test passed"
```

- [ ] **Step 2: Run — confirm PASS (template already exists from Task 13)**

Run: `bash /home/mike/Documents/CodeProjects/Chester/tests/test-design-architect-committee-template.sh`
Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/test-design-architect-committee-template.sh
git commit -m "test(design-architect-committee): template structural assertions"
```

---

## Task 15: Wire the pre-commit hook

**Type:** config-producing
**Implements:** AC-6.5
**Decision budget:** 1 (symlink vs. wrapper script — choose symlink, simpler)
**Must remain green:** all three test files green; commit-cycle test (manually verify pre-commit fires) green.

**Files:**
- Create: `.git/hooks/pre-commit` (symlink — note: outside repo tree, not added to git)
- Modify: (no tracked files modified)

**Steps:**

- [ ] **Step 1: Confirm no existing `pre-commit` hook**

Run: `ls -la /home/mike/Documents/CodeProjects/Chester/.git/hooks/pre-commit 2>/dev/null && echo "FAIL: pre-commit exists" || echo OK`
Expected: `OK`.

- [ ] **Step 2: Create the symlink**

Run:
```bash
ln -s ../../skills/design-architect-committee/scripts/lint-skill-files.sh \
   /home/mike/Documents/CodeProjects/Chester/.git/hooks/pre-commit
```

- [ ] **Step 3: Verify the symlink resolves and is executable**

Run:
```bash
ls -la /home/mike/Documents/CodeProjects/Chester/.git/hooks/pre-commit
test -x /home/mike/Documents/CodeProjects/Chester/.git/hooks/pre-commit && echo OK
```
Expected: symlink shown; `OK` printed.

- [ ] **Step 4: Manually verify the hook fires on a no-op commit attempt**

Run:
```bash
cd /home/mike/Documents/CodeProjects/Chester
git commit --allow-empty -m "test: pre-commit hook fires"
```
Expected: lint runs, prints PASS lines for `skill.md` and `rules.md`, commits empty change.

If the commit fails because the lint can't locate the canonical paths (the hook is invoked from the repo root with no arguments — the defaults inside `lint-skill-files.sh` use relative paths `skills/design-architect-committee/skill.md` etc., which are valid from the repo root): no action needed; lint passes.

- [ ] **Step 5: (No git commit for the hook itself — it lives outside the repo tree.) Verify the empty commit landed**

Run: `git log -1 --oneline`
Expected: "test: pre-commit hook fires" most-recent commit.

---

## Task 16: Add `design-architect-committee` entry to `setup-start/references/skill-index.md`

**Type:** docs-producing
**Implements:** AC-7.3
**Decision budget:** 2 (insertion position in the index; description wording to mirror skill.md frontmatter)
**Must remain green:** all three test files green; existing skill-index format preserved (no break in adjacent entries).

**Files:**
- Modify: `skills/setup-start/references/skill-index.md` (append one entry in the conventional position — near other `design-*` entries)

**Steps (TDD):**

- [ ] **Step 1: Read current skill-index format around `design-*` entries**

Run: `sed -n '25,35p' /home/mike/Documents/CodeProjects/Chester/skills/setup-start/references/skill-index.md`
Capture the surrounding format so the new entry mirrors it.

- [ ] **Step 2: Append entry following the captured format**

Insert after the existing `design-specify` entry (line ~30 per ground-truth report). Description matches `skill.md` frontmatter exactly:

```markdown
- `chester:design-architect-committee` — Convene the four-pole Committee in Mode B for a session that produces a ratified Constraint Envelope, Resolution Criterion, and Coverage Map for design-specify. Use when the architectural choice requires structured deliberation with a Clerk-enforced schema and the five-phase OPEN→ANCHORED→DELIBERATING→RATIFYING→CLOSED lifecycle.
```

(If the existing format is different from a `- chester:name — description` bullet, mirror that format exactly — read first, then write.)

- [ ] **Step 3: Verify entry present**

Run: `grep -F 'chester:design-architect-committee' /home/mike/Documents/CodeProjects/Chester/skills/setup-start/references/skill-index.md`
Expected: at least one match.

- [ ] **Step 4: Commit**

```bash
git add skills/setup-start/references/skill-index.md
git commit -m "docs(setup-start): register design-architect-committee in skill-index"
```

- [ ] **Step 5: Record CLAUDE.md drift observation in execute-write's Decisions block for AC-7.3**

The drift surfaced by ground-truth review (CLAUDE.md says `setup-start/SKILL.md`, real target is `setup-start/references/skill-index.md`) is left as a recorded `Decisions:` observation. Designer addresses in a future CLAUDE.md maintenance pass; not in scope for this build.

---

## Cross-cutting acceptance criteria addressed by aggregate

These ACs are satisfied by the aggregate of all tasks, not by any single one:

- **AC-4.1 (token format)** — all tokens written in Tasks 3-9 follow `[A-Z][A-Z-]+`. Confirmed by lint sub-check 3 (Tasks 11, 12) passing.
- **AC-4.2 (uniqueness)** — lint sub-check 4 enforces. Confirmed by `tests/test-design-architect-committee-lint.sh` collision fixture (Task 2).
- **AC-4.4 (resolution)** — lint sub-check 3 enforces. Confirmed by Tasks 11, 12 passing lint.
- **AC-7.1 (no design-committee modification)** — confirmed by `git diff main..HEAD --name-only -- skills/design-committee/` returning empty at end of execute-write.

---

## Open observations from prior reviews (not blocking)

- **CLAUDE.md drift on two-place-sync target.** `skills/CLAUDE.md` line 33 and root `CLAUDE.md` line 99 point at `setup-start/SKILL.md`; the actual registration target is `setup-start/references/skill-index.md`. Task 16 records this as a `Decisions:` observation. Address in a separate CLAUDE.md maintenance sprint.
- **Word-count semantics of `wc -w` with Markdown formatting characters.** Bold-wrapped tokens like `**[CE-SOURCE-ENUM]**` count as one word with the asterisks attached; backtick-wrapped code spans count similarly. The lint's `wc -w` directly is fine; no formatting strip needed. Documented in the lint script's comments at Task 2.
- **Token regex collision potential with Markdown link anchor text.** The lint's token regex `\[[A-Z][A-Z-]+\]` would match Markdown link text `[CLICK HERE]` if it appeared in a capped file. Capped-file bodies are short and operator prose — extremely unlikely. If it ever surfaces, anchor the regex with a negative-lookbehind / lookahead against `](`. Tracked as future-edge-case context, no spec change needed.

---

## Change Log

- **00 (2026-05-23):** Initial plan. Sixteen tasks covering skill scaffolding, four-sub-check lint + self-tests, seven schema files, two structural test files, two capped-file bodies, worked template, pre-commit hook wiring, and skill-index registration. Plan-review and plan-attack to follow.
- **SUPERSEDED (2026-05-23):** Plan was written against spec v02 (token grammar). Spec abandoned per committee R2; plan abandoned with it. Replaced by plan v01 at `plan/skill-files-plan-01.md` written against spec v03 (Option B++). Retained for audit trail. Plan-attack threat report v00 also retained — its CRITICAL findings (token-regex/heading mismatch, symlink direction) were spec-induced and resolved by abandoning the spec.
