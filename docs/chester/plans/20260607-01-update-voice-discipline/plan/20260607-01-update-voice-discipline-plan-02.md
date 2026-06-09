# Plan: Catalog-only generator + voice/rule single-sourcing

**Sprint:** 20260607-01-update-voice-discipline
**Spec:** docs/chester/working/20260607-01-update-voice-discipline/spec/20260607-01-update-voice-discipline-spec-01.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Reduce the build-time generator to a catalog-only tool, generate the skill catalog from each skill's frontmatter (with a verify test guarding staleness), and give the catalog/CLAUDE.md/voice-rule duplication exactly one canonical home each.

## Architecture

One deterministic generator whose single output is `skills/setup-start/references/skill-index.md`, derived from `skills/*/SKILL.md` frontmatter spliced into a hand-authored template. The agent-mode machinery built in T1/T2 (`emit_agent`, `extract_section`, `--agents-only`, the HEADER fragment path) is stripped — committee-member and reviewer agent files stay hand-authored (execution proved they can't be single-sourced). Voice rules (PM Litmus Test, Research Boundary) get a canonical home in `util-design-partner-role`; CLAUDE.md version/sync rules are deduped two-tier with the phantom catalog pointer fixed.

## Tech Stack

Bash (`set -euo pipefail`), `jq` for manifest reads, `awk` for frontmatter extraction and slot splicing, self-contained bash tests under `tests/` (`mktemp -d` + trap, `fail()` accumulator, grep-able `PASS/FAIL` footer).

## Supersession note

This plan supersedes plan-00 and plan-01. plan-01 was written against spec-00 (members-in, reviewers-single-sourced) and its task structure no longer applies. Implementers follow plan-02 only. The committee decision behind the scope change is recorded in `committee/round04/`.

## Worktree / starting state

- Worktree already exists: `.worktrees/20260607-01-update-voice-discipline`, branch `20260607-01-update-voice-discipline`. Do NOT create a new worktree.
- HEAD = `1c9b071`. Base = `6c7991b`. Two commits already landed: `326623e` (generator core, agent + catalog modes) and `1c9b071` (catalog mode + folded-block fix). 29 tests green.
- `agents/manifest.json` and `agents/sources/` do NOT yet exist. The live `skills/setup-start/references/skill-index.md` is still hand-maintained. This plan builds the real catalog pipeline and strips the agent-mode code.

---

## Task 1: Strip the generator to catalog-only

**Type:** code-producing
**Implements:** AC-1.1, AC-8.1
**Decision budget:** 2
**Must remain green:** `test-generate-catalog`

**Files:**
- Modify: `chester-util-config/chester-generate-agents.sh` (remove `extract_section`, `emit_agent`, the HEADER constant, the `--agents-only` mode, and the agent-generation loop; keep `emit_catalog` and arg parsing)
- Modify: `tests/test-generate-catalog.sh:26` (the fixture invocation drops the now-removed `--catalog-only` flag)
- Delete: `tests/test-generate-agents-core.sh` (it exercises `--agents-only`, which no longer exists)

**Context:** The current script supports two modes via a `MODE` variable and `--agents-only` / `--catalog-only` flags. After this task the catalog is the only output, so the mode machinery and the agent-assembly functions go. `emit_catalog` (including its folded-block-aware `awk` description extractor and the quoted `"$CHESTER_ROOT"/$glob` expansion) is preserved verbatim — do not touch its body.

**Steps (TDD):**

- [ ] **Step 1: Update the catalog fixture test to the catalog-only invocation**

In `tests/test-generate-catalog.sh`, change the generator invocation (currently line 26) from:

```bash
"$GEN" --root "$TMP" --catalog-only
```

to:

```bash
"$GEN" --root "$TMP"
```

- [ ] **Step 2: Run it to verify it FAILS against the un-stripped generator**

Run: `bash tests/test-generate-catalog.sh`
Expected: FAIL — the current generator, with no `--catalog-only` flag, runs `all` mode, which tries `emit_agent` over an empty `agents` array (harmless) but the assertion still passes... so ALSO assert the strip target directly. Add this assertion near the top of `tests/test-generate-catalog.sh` (after `GEN=` is set):

```bash
grep -q 'emit_agent' "$SCRIPT_DIR/chester-util-config/chester-generate-agents.sh" && fail "generator still defines emit_agent — agent-mode not stripped"
grep -q 'extract_section' "$SCRIPT_DIR/chester-util-config/chester-generate-agents.sh" && fail "generator still defines extract_section — agent-mode not stripped"
```

Run: `bash tests/test-generate-catalog.sh`
Expected: FAIL — `generator still defines emit_agent`.

- [ ] **Step 3: Rewrite the generator to catalog-only**

Replace the entire contents of `chester-util-config/chester-generate-agents.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHESTER_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUT_DIR=""
while [ $# -gt 0 ]; do
  case "$1" in
    --root) CHESTER_ROOT="$(cd "$2" && pwd)"; shift 2 ;;
    --output-dir) OUT_DIR="$2"; shift 2 ;;
    *) echo "chester-generate-agents: unknown arg: $1" >&2; exit 2 ;;
  esac
done
[ -n "$OUT_DIR" ] || OUT_DIR="$CHESTER_ROOT"
MANIFEST="$CHESTER_ROOT/agents/manifest.json"
command -v jq >/dev/null 2>&1 || { echo "chester-generate-agents: jq required" >&2; exit 3; }
[ -f "$MANIFEST" ] || { echo "chester-generate-agents: manifest not found: $MANIFEST" >&2; exit 3; }

emit_catalog() {
  [ "$(jq -r '.catalog' "$MANIFEST")" != "null" ] || { echo "chester-generate-agents: no catalog entry in manifest" >&2; exit 4; }
  local out tmpl tmpl_abs dest list glob
  out="$(jq -r '.catalog.output' "$MANIFEST")"
  tmpl="$(jq -r '.catalog.template' "$MANIFEST")"
  tmpl_abs="$CHESTER_ROOT/$tmpl"
  glob="$(jq -r '.catalog.scan_glob' "$MANIFEST")"
  dest="$OUT_DIR/$out"; mkdir -p "$(dirname "$dest")"
  [ -f "$tmpl_abs" ] || { echo "catalog template not found: $tmpl_abs" >&2; exit 4; }
  # Build the flat, alphabetically-sorted "- **name** — description" list from each SKILL.md frontmatter.
  list="$(
    for f in "$CHESTER_ROOT"/$glob; do
      [ -f "$f" ] || continue
      local name desc
      name="$(awk '/^---$/{c++; next} c==1 && /^name:/{sub(/^name:[ ]*/,""); print; exit}' "$f")"
      # description may be inline ("description: text", optionally quoted) OR a YAML
      # folded/literal block scalar ("description: >" / "| " then indented continuation
      # lines). Fold continuation lines into one space-joined line for the catalog entry.
      desc="$(awk '
        /^---$/ { c++; next }
        c==1 && /^description:/ {
          val = $0; sub(/^description:[ \t]*/, "", val)
          if (val ~ /^[>|]/) {
            d = ""
            while ((getline line) > 0) {
              if (line ~ /^---$/) break
              if (line ~ /^[ \t]*$/) continue
              if (line !~ /^[ \t]/) break
              sub(/^[ \t]+/, "", line)
              d = (d == "" ? line : d " " line)
            }
            print d
          } else {
            gsub(/^["'"'"']|["'"'"']$/, "", val); print val
          }
          exit
        }
      ' "$f")"
      [ -n "$name" ] && printf '%s\t%s\n' "$name" "$desc"
    done | LC_ALL=C sort | awk -F'\t' '{printf "- **%s** — %s\n", $1, $2}'
  )"
  # Splice the list into the template slot (replace the CATALOG_SLOT marker line).
  local tmp; tmp="$(mktemp)"
  awk -v list="$list" '/<!-- CATALOG_SLOT -->/{print list; next} {print}' "$tmpl_abs" > "$tmp"
  mv "$tmp" "$dest"
}

emit_catalog
```

- [ ] **Step 4: Delete the agent-mode core test and run the suite**

Run:
```bash
git rm tests/test-generate-agents-core.sh
bash tests/test-generate-catalog.sh
```
Expected: `PASS: test-generate-catalog` (the `emit_agent`/`extract_section` absence assertions now pass; catalog generation against the fixture still works).

- [ ] **Step 5: Commit**

The deletion is already staged by the `git rm` in Step 4 — do NOT run `git rm` again here (a second `git rm` aborts with `fatal: pathspec ... did not match` and breaks the commit block). Just stage the two modified files and commit:

```bash
git add chester-util-config/chester-generate-agents.sh tests/test-generate-catalog.sh
git commit -m "refactor(generate-agents): reduce generator to catalog-only

Strip emit_agent, extract_section, HEADER, and the --agents-only mode built
for member/reviewer generation (abandoned — members interleave too finely,
reviewer disciplines are per-consumer). emit_catalog is the only output now.
Delete the agent-mode core test."
```

---

## Task 2: Catalog template + manifest + first generation + verify test

**Type:** config-producing
**Implements:** AC-1.1, AC-4.1, AC-5.1, AC-8.1
**Decision budget:** 3
**Must remain green:** `test-generated-agents-current`, `test-generate-catalog`

**Files:**
- Create: `agents/sources/catalog-template.md`
- Create: `agents/manifest.json`
- Modify: `skills/setup-start/references/skill-index.md` (regenerated whole by the generator — was hand-maintained, now generated output)
- Create: `tests/test-generated-agents-current.sh`

**Context:** This task makes the catalog real. The template holds the hand-authored prose (header, priority order, dispatch patterns, the brief-templates footnote) with a `<!-- CATALOG_SLOT -->` marker where the generated flat-alphabetical skill list goes. The manifest declares the catalog entry only (`agents` array empty). Running the generator overwrites `skill-index.md` with the generated form — which legitimately ADDS the 3 currently-missing skills and switches the catalog body from curated role-grouped bullets to a flat-alphabetical list of frontmatter descriptions. The verify test is born green because the committed index is exactly what the generator produces.

**Steps (TDD):**

- [ ] **Step 1: Write the failing verify test**

Create `tests/test-generated-agents-current.sh`:

```bash
#!/usr/bin/env bash
# tests/test-generated-agents-current.sh
# Verify the committed skill catalog is in sync with what the generator produces
# from current frontmatter. A mismatch means a source changed without regeneration.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GEN="$SCRIPT_DIR/bin/chester-generate-agents"
CATALOG="skills/setup-start/references/skill-index.md"
# Declare both temp dirs and their single trap up front so an early abort never
# fires the EXIT trap on an unbound $TMP2 (set -u).
TMP="$(mktemp -d)"; TMP2="$(mktemp -d)"; trap 'rm -rf "$TMP" "$TMP2"' EXIT
ERRORS=0; fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS+1)); }

# Regenerate the catalog to a temp dir and diff against the committed file.
"$GEN" --output-dir "$TMP"
if ! diff -u "$SCRIPT_DIR/$CATALOG" "$TMP/$CATALOG" >/dev/null 2>&1; then
  fail "$CATALOG stale — run bin/chester-generate-agents"
fi

# Determinism: a second generation is byte-identical to the first.
"$GEN" --output-dir "$TMP2"
diff -u "$TMP/$CATALOG" "$TMP2/$CATALOG" >/dev/null 2>&1 || fail "generation is non-deterministic"

# AC-4.1: every skill present, including the 3 that were missing from the hand-maintained index.
for s in design-grillme util-handoff util-improve-codebase; do
  grep -q -- "- \*\*$s\*\*" "$TMP/$CATALOG" || fail "skill '$s' missing from generated catalog"
done

# No bare YAML block-scalar markers leaked into any entry.
grep -qE -- '- \*\*[a-z-]+\*\* — [>|]$' "$TMP/$CATALOG" && fail "a description rendered as a bare '>' or '|'"

[ "$ERRORS" -eq 0 ] && echo "PASS: test-generated-agents-current" || { echo "FAIL: test-generated-agents-current" >&2; exit 1; }
```

- [ ] **Step 2: Run it to verify it FAILS**

Run: `bash tests/test-generated-agents-current.sh`
Expected: FAIL — the generator exits non-zero (`manifest not found`) because `agents/manifest.json` does not exist yet.

- [ ] **Step 3: Create the catalog template**

Create `agents/sources/catalog-template.md` — the current `skill-index.md` hand-authored prose, with the catalog body replaced by the slot marker. Lift the header, `## Skill Priority`, `### Common Dispatch Patterns`, and the brief-templates footnote verbatim from the current `skills/setup-start/references/skill-index.md`; replace the entire `## Skill Catalog` body (the role-grouped bullets) with the slot marker:

```markdown
# Skill Index

Reference for choosing between Chester skills. Read when multiple skills could apply to the
task at hand, or when you need to look up what a named skill does.

## Skill Priority

When multiple skills could apply, use this order:

1. **Gate skills first** (`design-small-task`, `plan-build`, `execute-write`, `execute-verify-complete`, `finish-close-worktree`) — these define the overall pipeline stage and determine HOW to approach the task
2. **Review skills second** (`plan-attack`, `plan-smell`, `util-codereview`) — these harden and validate the work
3. **Behavioral skills third** (`execute-test`, `execute-prove`) — these guide specific execution disciplines
4. **Utility skills fourth** (`util-worktree`, `util-dispatch`) — these support workflow mechanics

### Common Dispatch Patterns

- "Quick design check for X" → `design-small-task` first, then `plan-build`.
- "Convene the committee on X" / "ask the committee" / "get a multi-perspective read on X" → `design-committee` standalone (not pipeline-staged).

## Skill Catalog

<!-- CATALOG_SLOT -->

Brief templates are **not** standalone skills — they live inside each design skill as references:

- `design-small-task/references/design-brief-small-template.md` — 6-section lightweight (bounded-task briefs)
```

- [ ] **Step 4: Create the manifest**

Create `agents/manifest.json`:

```json
{
  "agents": [],
  "catalog": {
    "output": "skills/setup-start/references/skill-index.md",
    "scan_glob": "skills/*/SKILL.md",
    "template": "agents/sources/catalog-template.md"
  }
}
```

- [ ] **Step 5: Generate the real catalog, then run the verify test**

Run:
```bash
bin/chester-generate-agents
bash tests/test-generated-agents-current.sh
```
Expected: the first command overwrites `skills/setup-start/references/skill-index.md` with the generated form (now containing all 23 skills flat-alphabetical, including `design-grillme`, `util-handoff`, `util-improve-codebase`). The test prints `PASS: test-generated-agents-current`. Also run `bash tests/test-generate-catalog.sh` → still `PASS`.

- [ ] **Step 6: Commit**

```bash
git add agents/sources/catalog-template.md agents/manifest.json skills/setup-start/references/skill-index.md tests/test-generated-agents-current.sh
git commit -m "feat(generate-agents): generate skill catalog from frontmatter + verify test

Add the catalog template (hand-authored prose + CATALOG_SLOT) and the catalog-only
manifest; regenerate skill-index.md from frontmatter (now generated, +3 previously
missing skills, flat-alphabetical). Add the staleness/determinism verify test."
```

---

## Task 3: Give PM Litmus Test and Research Boundary a canonical home

**Type:** docs-producing
**Implements:** AC-7.1
**Decision budget:** 2
**Must remain green:** `test-partner-role-discipline`, `test-generated-agents-current`

**Files:**
- Modify: `skills/util-design-partner-role/SKILL.md` (add two sections after `## Stance Principles (carry into every turn)`; bump `version: v0005` → `v0006`)
- Modify: `tests/test-partner-role-discipline.sh` (assert both new sections exist)

**Context:** These two rules are currently duplicated across `design-small-task/SKILL.md` and `design-committee/references/team-lead.md` with zero canonical copy. This task creates the canonical, consumer-neutral home; Task 4 points the two consumers at it. The canonical text must be general (no committee-specific "Researcher + members" phrasing) so both consumers fit. The catalog reads only the `description` frontmatter, which is unchanged, so `test-generated-agents-current` stays green.

**Steps (TDD):**

- [ ] **Step 1: Extend the partner-role discipline test**

Append to `tests/test-partner-role-discipline.sh` (before the `PASS/FAIL` footer):

```bash
grep -qE '^## PM Litmus Test' "$PARTNER" || { echo "FAIL AC-7.1: PM Litmus Test section heading missing"; exit 1; }
grep -qE '^## Research Boundary' "$PARTNER" || { echo "FAIL AC-7.1: Research Boundary section heading missing"; exit 1; }
grep -qi "product manager" "$PARTNER" || { echo "FAIL AC-7.1: PM Litmus body (product manager) missing"; exit 1; }
grep -qi "never relay raw findings\|digest internally" "$PARTNER" || { echo "FAIL AC-7.1: Research Boundary body missing"; exit 1; }
```

- [ ] **Step 2: Run it to verify it FAILS**

Run: `bash tests/test-partner-role-discipline.sh`
Expected: FAIL — `PM Litmus Test section heading missing`.

- [ ] **Step 3: Add the canonical sections**

In `skills/util-design-partner-role/SKILL.md`, append these two sections at the end of the file (after `## Stance Principles (carry into every turn)`):

```markdown
## PM Litmus Test

Imagine a product manager on this project. Not a coder. Makes the decisions — owns the roadmap, the requirements, how success is measured. Understands the architecture at a high level, the product vision, the end state. Has never opened the codebase; does not know the types, the files, or the internal wiring.

Before any decision-facing output, ask whether that product manager could:

- Follow every sentence without stopping to ask what a term means.
- Make an informed decision from what the output says.

If either answer is no, translate further. The product manager needs language that operates where decisions live — intent, architecture, trade-offs, risk — not where the code lives.

## Research Boundary

Code exploration is private work. Read as much of the codebase as needed to understand the design landscape, then digest it into concepts before any of it reaches the designer.

- Explore freely — no limit on what you read to understand the landscape.
- Digest internally — convert findings into domain concepts, relationships, and tensions.
- Never relay raw findings — type names, property shapes, class hierarchies, and other implementation detail do not appear in designer-facing output.

If the designer would need a code-specific term to respond, the translation failed — rewrite before sending.
```

Then bump the version frontmatter: `version: v0005` → `version: v0006`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/test-partner-role-discipline.sh`
Expected: PASS. The test's final footer line (`tests/test-partner-role-discipline.sh:65`) names specific AC numbers — update it to include `AC-7.1` so the footer is not stale. This is required, not optional.

- [ ] **Step 5: Commit**

```bash
git add skills/util-design-partner-role/SKILL.md tests/test-partner-role-discipline.sh
git commit -m "feat(design-partner-role): canonical home for PM Litmus Test + Research Boundary"
```

---

## Task 4: Point the two consumers at the canonical voice-rule home

**Type:** docs-producing
**Implements:** AC-7.1
**Decision budget:** 3
**Must remain green:** `test-partner-role-discipline`, `test-generated-agents-current`

**Files:**
- Modify: `skills/design-small-task/SKILL.md` (replace the PM Litmus Test body at `:187` item 3 and the `### Research Boundary` body at `:209` with citations; bump `version: v0003` → `v0004`)
- Modify: `skills/design-committee/references/team-lead.md` (replace the `### PM Litmus Test` body at `:288` and the `### Research Boundary` body at `:299` with citations; bump `version: v0008` → `v0009`)
- Modify: `tests/test-partner-role-discipline.sh` (assert neither consumer restates the rule body)

**Context:** Both consumers already read `util-design-partner-role` (design-small-task as its voice spec; team-lead at Role Setup). Replace the restated rule bodies with a one-line citation plus, where useful, a one-line context note. Do NOT delete the design-small-task Before/After example (it is a local illustration, not the rule body) — keep it, just point the rule statement at the canonical home. Preserve the surrounding numbered-list structure in design-small-task (PM Litmus is item 3 of the translation-discipline list).

**Steps (TDD):**

- [ ] **Step 1: Add the no-restatement assertions**

Append to `tests/test-partner-role-discipline.sh` (before the footer):

```bash
# $SMALL is already defined earlier in the existing test (around line 60) — reuse it,
# do NOT re-declare. Only $LEAD is new here.
LEAD="$REPO_ROOT/skills/design-committee/references/team-lead.md"
# Consumers must cite the canonical home, not restate the rule body.
grep -q "util-design-partner-role" "$SMALL" || { echo "FAIL AC-7.1: design-small-task does not cite util-design-partner-role"; exit 1; }
grep -q "util-design-partner-role" "$LEAD" || { echo "FAIL AC-7.1: team-lead.md does not cite util-design-partner-role"; exit 1; }
# The PM definition prose should no longer be restated in the consumers.
grep -qi "owns roadmap, requirements" "$SMALL" && { echo "FAIL AC-7.1: design-small-task still restates the PM Litmus body"; exit 1; }
grep -qi "owns roadmap, owns requirements\|owns roadmap, requirements, success measurement" "$LEAD" && { echo "FAIL AC-7.1: team-lead.md still restates the PM Litmus body"; exit 1; }
```

- [ ] **Step 2: Run it to verify it FAILS**

Run: `bash tests/test-partner-role-discipline.sh`
Expected: FAIL — `design-small-task still restates the PM Litmus body`.

- [ ] **Step 3: Replace the bodies with citations**

In `skills/design-small-task/SKILL.md`, replace item 3's body (the PM definition + litmus questions, `:187`-onward) with:

```markdown
3. **PM Litmus Test.** Apply the PM Litmus Test from `util-design-partner-role` (§ PM Litmus Test): could a product manager who has never opened the codebase follow every sentence and make an informed decision? If not, translate further.
```

(Keep the `#### Before/After Example` block that follows — it is a local illustration.)

Replace the `### Research Boundary` body (`:209`-onward) with:

```markdown
### Research Boundary

Follow the Research Boundary in `util-design-partner-role` (§ Research Boundary): explore the code freely, digest it into domain concepts, and never relay raw findings (type names, property shapes, hierarchies) into designer-facing output.
```

Bump `version: v0003` → `version: v0004`.

In `skills/design-committee/references/team-lead.md`, replace the `### PM Litmus Test` body (`:288`-`:297`) with:

```markdown
### PM Litmus Test

Apply the PM Litmus Test from `util-design-partner-role` (§ PM Litmus Test) to every designer-facing packet: a product manager who has never opened the codebase must be able to follow every sentence and decide from it. If not, translate further.
```

Replace the `### Research Boundary` body (`:299`-`:307`) with:

```markdown
### Research Boundary

Follow the Research Boundary in `util-design-partner-role` (§ Research Boundary). In committee, code exploration is the private work of the researcher and members; nothing raw (type names, property shapes, hierarchies) reaches the designer through member positions, peer DMs, consolidation, or the decision packet.
```

Bump `version: v0008` → `version: v0009`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bash tests/test-partner-role-discipline.sh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/design-small-task/SKILL.md skills/design-committee/references/team-lead.md tests/test-partner-role-discipline.sh
git commit -m "refactor(voice): cite canonical PM Litmus + Research Boundary instead of restating"
```

---

## Task 5: CLAUDE.md two-tier dedup + phantom catalog pointer fix

**Type:** docs-producing
**Implements:** AC-6.1, AC-4.1
**Decision budget:** 2
**Must remain green:** `test-claude-md-dedup`, `test-generated-agents-current`

**Files:**
- Modify: root `CLAUDE.md` (the "Working on Skills" restatement at `:86` becomes a pointer to "Skill File Conventions"; fix the description-sync target to the generated catalog)
- Modify: `skills/CLAUDE.md` (the version-rule body at `:29` and two-place-sync at `:33` become pointers up to root; fix the sync target)
- Create: `tests/test-claude-md-dedup.sh`

**Context:** Root `CLAUDE.md` states the version-bump rule twice — at `:31` (Skill File Conventions, WITH the "not on typo fixes or comment-only edits" carve-out) and at `:86` (Working on Skills, WITHOUT the carve-out). Keep `:31` as the single canonical statement; reduce `:86` to a pointer. Both `:86` and `skills/CLAUDE.md:33` name `skills/setup-start/SKILL.md`'s available-skills list as the description-sync target — but the catalog is now the GENERATED `skills/setup-start/references/skill-index.md`, regenerated by `bin/chester-generate-agents`. Fix the target and the mechanism (regenerate, don't hand-edit a list).

**Steps (TDD):**

- [ ] **Step 1: Write the dedup test**

Create `tests/test-claude-md-dedup.sh`:

```bash
#!/usr/bin/env bash
# tests/test-claude-md-dedup.sh
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$REPO_ROOT/CLAUDE.md"
SKILLS="$REPO_ROOT/skills/CLAUDE.md"
ERRORS=0; fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS+1)); }

# Root carries the version rule WITH the carve-out, stated once.
grep -qi "not on typo fixes or comment-only edits" "$ROOT" || fail "root CLAUDE.md missing the version-rule carve-out"

# skills/CLAUDE.md no longer carries the version-rule body — it points up to root.
grep -qi "four-digit zero-padded" "$SKILLS" && fail "skills/CLAUDE.md still restates the version-rule body"
grep -qi "root \`CLAUDE.md\`\|root CLAUDE.md" "$SKILLS" || fail "skills/CLAUDE.md does not point up to root for the version rule"

# Phantom pointer fixed: the generated catalog is named; the phantom list path is gone.
grep -q "skills/setup-start/references/skill-index.md" "$ROOT" || fail "root CLAUDE.md does not name the generated catalog"
grep -q "skills/setup-start/references/skill-index.md" "$SKILLS" || fail "skills/CLAUDE.md does not name the generated catalog"
grep -q "setup-start/SKILL.md" "$ROOT" && fail "root CLAUDE.md still names the phantom setup-start/SKILL.md list"
grep -q "setup-start/SKILL.md" "$SKILLS" && fail "skills/CLAUDE.md still names the phantom setup-start/SKILL.md list"

[ "$ERRORS" -eq 0 ] && echo "PASS: test-claude-md-dedup" || { echo "FAIL: test-claude-md-dedup" >&2; exit 1; }
```

- [ ] **Step 2: Run it to verify it FAILS**

Run: `bash tests/test-claude-md-dedup.sh`
Expected: FAIL — `skills/CLAUDE.md still restates the version-rule body` (and the phantom-pointer assertions fail).

- [ ] **Step 3: Edit root `CLAUDE.md`**

Replace the "Working on Skills" paragraph (`:86`) that currently reads:

> When editing a SKILL.md, the `description` frontmatter field and the skill's entry in `skills/setup-start/SKILL.md` (the available skills list) must stay in sync. If you change what a skill does, update both. Also bump the `version` field (e.g. `v0001 → v0002`) for any behavior or contract change.

with:

```markdown
When editing a SKILL.md, see **Skill File Conventions** above for the version-bump rule (including its carve-out). The skill catalog at `skills/setup-start/references/skill-index.md` is GENERATED from each skill's `description` frontmatter — after changing a `description`, regenerate it with `bin/chester-generate-agents` rather than hand-editing a list.
```

- [ ] **Step 4: Edit `skills/CLAUDE.md`**

Replace the version-rule body (`:29`) that currently reads:

> - `version` is `v` + four-digit zero-padded counter. Bump on any behavior or contract change. New skills start at `v0001`.

with:

```markdown
- `version` — see root `CLAUDE.md` § Skill File Conventions for the bump rule (with its carve-out).
```

Replace the "Two-place sync" section (`:32`-`:33`) that currently reads:

> ## Two-place sync
>
> `description` field + the matching entry in `skills/setup-start/SKILL.md`'s available-skills list must stay in lockstep. Change one, change the other.

with:

```markdown
## Catalog sync

The `description` field feeds the GENERATED catalog at `skills/setup-start/references/skill-index.md`. After changing a `description`, regenerate the catalog with `bin/chester-generate-agents` (see root `CLAUDE.md`). Do not hand-edit the catalog.
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
bash tests/test-claude-md-dedup.sh
bash tests/test-generated-agents-current.sh
```
Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md skills/CLAUDE.md tests/test-claude-md-dedup.sh
git commit -m "docs(claude-md): two-tier version-rule dedup + fix phantom catalog pointer"
```

---

## Full-suite check (end of plan)

After Task 5, run the whole suite to confirm no regression:

```bash
for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done
```

Expected: every test prints `PASS`; no `FAIL:` lines.

<!-- created-at: 2026-06-09T00:51:38Z -->
<!-- produced-by plan-build@v0006 -->
