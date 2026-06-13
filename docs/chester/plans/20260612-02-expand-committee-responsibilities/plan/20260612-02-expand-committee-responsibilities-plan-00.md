# Plan: Decompose the Specification System into spec-architect / spec-write / spec-harden

**Sprint:** 20260612-02-expand-committee-responsibilities
**Spec:** docs/chester/working/20260612-02-expand-committee-responsibilities/spec/20260612-02-expand-committee-responsibilities-spec-01.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs. plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Split the fused `design-specify` skill into three skills (`spec-architect` settle → `spec-write` construct → `spec-harden` verify) by extracting its already-clean internal seam, then migrate every live caller and delete `design-specify`, so architecture work runs once where it is needed and never twice.

## Architecture

Three-skill decomposition of Chester's specification stage, performed by **extraction, not rewrite** (D12): `design-specify`'s current step sequence already falls on the architect|write|harden seam non-interleaved, so its sections move into three new skills largely verbatim. `spec-write` consumes a producer-neutral "FAC-complete design" input type (D6/D9) satisfied by either a committee verdict or a `spec-architect` output; the committee path never invokes `spec-architect`, making no-duplication structural rather than gated (D8). `design-specify` is deleted in the same sprint (atomic cutover).

## Tech Stack

- **Markdown SKILL.md files** — Chester skills are prompt documents with YAML frontmatter (`name` / `description` / `version: vNNNN`), invoked as `chester:{phase}-{name}`.
- **Bash test scripts** (`tests/test-*.sh`) — self-contained, exit 0 = pass; the project's only test harness. Run one with `bash tests/test-<name>.sh`; run all with `for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done`.
- **`chester-trailer-write stamp <skill>@<version> <path>`** — provenance stamping helper used by producer skills.
- **`bin/chester-generate-agents`** — regenerates `skills/setup-start/references/skill-index.md` by globbing `skills/*/SKILL.md` frontmatter. Never hand-edit the catalog.
- **`git mv`** — reference files move between skill dirs; use `git mv` so history follows.

**Working note for the implementer.** All edits land in the main Chester checkout (the working/plans split is doc-only; this sprint edits the live skill tree). Stage explicitly by path — never `git add -A` (the tree carries unrelated `D`/`??` entries). The three new skills become discoverable as `chester:spec-*` only after `/reload-plugins`; the bash tests assert file structure, not runtime discovery, so they pass without a reload.

**Extraction source.** Several tasks say "copy verbatim from `skills/design-specify/SKILL.md` lines X–Y." That file still exists until Task 11 — read it at build time as the source of truth. Line numbers reference the file as it stands at sprint start (v0004, 238 lines). Verified section boundaries: line 50 begins `## Competing Architectures + Prior Art`, line 141 ends it; line 143 begins `## Writing the Spec` (one stamp call at line 154), line 159 ends it; lines 161 / 175 / 183 / 212 / 226 begin the five spec-harden sections (second stamp call at line 204).

---

## Task 1: Create the spec-architect skill (extract architecture-settling)

**Type:** docs-producing
**Implements:** AC-1.1, AC-3.2
**Decision budget:** 2 (exact description wording; where the standalone-invocation note lands)
**Must remain green:** `test-spec-architect-skill.sh` (new), `test-generated-agents-current.sh` (catalog regenerated — a new skill with a `description` is added)

**Files:**
- Create: `skills/spec-architect/SKILL.md`
- Create: `tests/test-spec-architect-skill.sh`
- Modify (generated): `skills/setup-start/references/skill-index.md` (regenerate — a new skill enters the catalog)

**Catalog-freshness note:** `test-generated-agents-current.sh` regenerates the catalog and diffs it against the committed `skills/setup-start/references/skill-index.md`. Adding a skill changes the generated catalog, so the committed copy must be regenerated and staged in the SAME commit, or that test red-bars. (Version bumps don't affect the catalog — only `name`/`description`/the skill set do — so the body-only migration tasks need no regen.)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `tests/test-spec-architect-skill.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/spec-architect/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

[ -f "$SKILL" ] || fail "spec-architect/SKILL.md does not exist"
grep -q '^name: spec-architect$' "$SKILL" || fail "frontmatter name not spec-architect"
grep -q '^version: v0001$' "$SKILL" || fail "version not v0001"
# Settles architecture: must run competing-architectures + F-A-C
grep -qi 'feature-dev:code-architect' "$SKILL" || fail "no architect dispatch"
grep -qi 'Feasib' "$SKILL" || fail "no F-A-C feasibility precondition"
# Small-task path only; transitions to spec-write
grep -qi 'spec-write' "$SKILL" || fail "does not transition to spec-write"
grep -q 'Transitions to' "$SKILL" || fail "no Integration transition line"
# Must NOT name design-specify (clean extraction, no back-reference)
grep -q 'design-specify' "$SKILL" && fail "still references design-specify"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: spec-architect wired"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-spec-architect-skill.sh`
Expected: FAIL — `spec-architect/SKILL.md does not exist`

- [ ] **Step 3: Write minimal implementation**

Create `skills/spec-architect/SKILL.md`. Author the frontmatter and head sections below; for the body of the competing-architectures procedure, **copy verbatim** `design-specify/SKILL.md` lines 50–141 (the entire `## Competing Architectures + Prior Art` section through `### After all dispatched agents complete`) — this is the extracted behavior, moved unchanged per D12.

Frontmatter + head (new authored content):

```markdown
---
name: spec-architect
description: "Settle the architecture for a FAC-incomplete design before spec authoring. Use when a design brief from design-small-task exists but its architecture is not yet settled — runs competing-architecture review (two code-architect axes + prior-art explorer), F-A-C self-checks, and a user-selection gate, producing a FAC-complete design. Invoked only on the small-task path; the committee path skips it. Transitions to spec-write."
version: v0001
---

# Settle Architecture

Settle the architecture for a FAC-incomplete design: compare competing approaches, survey prior art, run feasibility/suitability/completeness checks, and take a user selection. Produces a FAC-complete design that `spec-write` authors into a spec.

This is a **flexible** skill — adapt the axis selection and hybrid construction to the brief.

## Entry Condition

A FAC-incomplete design exists — an architecture not yet settled. Either:
- A design brief from `design-small-task` at `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md`
- A human-written brief whose architecture is unsettled
- A design described in conversation context with the architecture still open

Invoked **only** by the FAC-incomplete entry path. The committee path produces a FAC-complete design and goes straight to `spec-write` — `spec-architect` is never on that path.

The working directory and subdirectories should already exist (created by the upstream design skill). If invoked standalone, this skill creates them.

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Setup** — if invoked standalone (no upstream design skill), invoke `start-bootstrap`; otherwise sprint context already exists
2. **Read design brief** — read the design brief from disk or gather the design from conversation context
3. **Competing architectures + prior art** — dispatcher reads the brief, names the two sharpest tensions, defines an axis for each, then dispatches 3 agents in parallel: 2 `feature-dev:code-architect` agents on dispatcher-assigned axes (each self-checking against F-A-C: feasibility / suitability / completeness) + 1 prior-art explorer. Dispatcher constructs a hybrid recommendation. Present three blocks to the user (Architect A / Architect B / Hybrid Recommendation) with prior-art context; user picks direction.
4. **Transition** — the user's selected direction completes the FAC-complete design. Invoke `spec-write` to author the spec.

## Standalone Invocation

When invoked without a prior `design-small-task` session, invoke `start-bootstrap` to set up the sprint context (config, naming, directories, task reset).

<!-- BODY: copy design-specify/SKILL.md lines 50–141 verbatim here (## Competing Architectures + Prior Art ... ### After all dispatched agents complete) -->

## Integration

- **Calls:** `start-bootstrap` (standalone only)
- **Dispatches:** two `feature-dev:code-architect` agents (competing axes), one `Explore` agent (prior art)
- **Reads:** `util-artifact-schema` (naming/paths), the upstream brief's source template `../design-small-task/references/design-brief-small-template.md` (6-section lightweight)
- **Invoked by:** `design-small-task` (FAC-incomplete path), or user directly (standalone, when a brief exists with unsettled architecture)
- **Transitions to:** `spec-write`
- **Does NOT:** author the spec (that is `spec-write`), run review passes (that is `spec-harden`), or get invoked on the committee path (committee output is already FAC-complete)
```

When pasting the extracted body, delete the redundant `### Acceptance Preconditions (F-A-C)` duplicate header only if it collides; otherwise paste the block intact. Do not rewrite any sentence of the extracted procedure — D12 mandates verbatim extraction.

- [ ] **Step 4: Regenerate the catalog**

Run: `bin/chester-generate-agents`
This adds `spec-architect` to `skills/setup-start/references/skill-index.md`. (design-specify still appears too — it is not deleted until Task 11; the catalog reflects current state at each commit.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `bash tests/test-spec-architect-skill.sh; bash tests/test-generated-agents-current.sh`
Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add skills/spec-architect/SKILL.md tests/test-spec-architect-skill.sh skills/setup-start/references/skill-index.md
git commit -m "feat: add spec-architect skill (extracted architecture-settling from design-specify)"
```

---

## Task 2: Create the spec-write skill + FAC-complete contract (extract authoring)

**Type:** docs-producing
**Implements:** AC-1.2, AC-2.1, AC-2.2, AC-3.1
**Decision budget:** 3 (quote-back wording; producer-neutral Architecture-field phrasing; whether spec-write is standalone-invocable)
**Must remain green:** `test-spec-write-skill.sh`, `test-stamping-spec-write.sh`, `test-fac-contract.sh`, `test-spec-template-neutral.sh` (all new), `test-generated-agents-current.sh` (catalog regenerated — spec-write added); `test-stamping-design-specify.sh` (still green — design-specify/SKILL.md untouched until Task 11)

**Files:**
- Create: `skills/spec-write/SKILL.md`
- Move: `git mv skills/design-specify/references/spec-template.md skills/spec-write/references/spec-template.md`
- Modify (after move): `skills/spec-write/references/spec-template.md` (D10 Architecture-field edit + header de-reference)
- Create: `skills/spec-write/references/fac-complete-design-contract.md`
- Create: `tests/test-spec-write-skill.sh`, `tests/test-stamping-spec-write.sh`, `tests/test-fac-contract.sh`, `tests/test-spec-template-neutral.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

`tests/test-spec-write-skill.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/spec-write/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

[ -f "$SKILL" ] || fail "spec-write/SKILL.md does not exist"
grep -q '^name: spec-write$' "$SKILL" || fail "frontmatter name not spec-write"
grep -q '^version: v0001$' "$SKILL" || fail "version not v0001"
# Authors only — no review passes inside spec-write
grep -qi 'no review pass\|authors only\|no.*hardening' "$SKILL" || fail "does not declare authoring-only"
# AC-3.1: no architecture-settling inside spec-write — the committee path
# cannot trigger re-derivation because there is no competing-architecture stage here
grep -qi 'feature-dev:code-architect\|competing.architect' "$SKILL" && fail "spec-write contains an architecture-settling stage (AC-3.1 violation)"
# Consumes FAC-complete design via the contract reference
grep -q 'fac-complete-design-contract' "$SKILL" || fail "does not reference FAC contract"
# Quote-back the architecture field before authoring
grep -qi 'quote.back\|quote back' "$SKILL" || fail "no architecture quote-back step"
# Transitions to spec-harden
grep -qi 'spec-harden' "$SKILL" || fail "does not transition to spec-harden"
grep -q 'design-specify' "$SKILL" && fail "still references design-specify"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: spec-write wired"
```

`tests/test-stamping-spec-write.sh` (mirrors the old `test-stamping-design-specify.sh` pattern, scoped to spec-write's single stamp — the spec):

```bash
#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/spec-write/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# spec-write stamps exactly the spec artifact
COUNT=$(grep -c 'chester-trailer-write stamp' "$SKILL" || true)
[ "$COUNT" -ge 1 ] || fail "expected >=1 stamp invocation (spec); got $COUNT"
grep -q 'spec-write@' "$SKILL" || fail "stamp does not use spec-write identity"
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0001" ] || fail "version not at v0001 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: spec-write stamping wired"
```

`tests/test-fac-contract.sh` (AC-2.1 — eight fields + quote-back):

```bash
#!/usr/bin/env bash
set -euo pipefail
REF="skills/spec-write/references/fac-complete-design-contract.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

[ -f "$REF" ] || fail "fac-complete-design-contract.md does not exist"
# Eight named fields (D9)
for field in "Goal" "Chosen architecture" "Rejected alternatives" "Prior-art" "Ground-truth" "Constraints" "Acceptance-criteria seed" "Deferred"; do
  grep -qi "$field" "$REF" || fail "contract missing field: $field"
done
# Two producers mapped
grep -qi 'committee verdict' "$REF" || fail "no committee-verdict mapping"
grep -qi 'spec-architect' "$REF" || fail "no spec-architect mapping"
# Mandatory quote-back of the architecture field
grep -qi 'quote.back\|quote back' "$REF" || fail "no quote-back requirement"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: FAC contract defined"
```

`tests/test-spec-template-neutral.sh` (AC-2.2 — producer-neutral Architecture field):

```bash
#!/usr/bin/env bash
set -euo pipefail
TPL="skills/spec-write/references/spec-template.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

[ -f "$TPL" ] || fail "spec-template.md not at spec-write/references/"
grep -q '## Acceptance Criteria' "$TPL" || fail "template lost Acceptance Criteria section"
grep -qi 'Architecture' "$TPL" || fail "template lost Architecture field"
# Producer-neutral: no design-specify, no 'hybrid step' precondition baked in
grep -q 'design-specify' "$TPL" && fail "Architecture field still names design-specify"
grep -qi 'design-specify hybrid' "$TPL" && fail "Architecture field still encodes one-producer precondition"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: spec-template producer-neutral"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `for t in test-spec-write-skill test-stamping-spec-write test-fac-contract test-spec-template-neutral; do bash tests/$t.sh; done`
Expected: each FAILs on missing files.

- [ ] **Step 3: Write minimal implementation**

(a) Move the template: `git mv skills/design-specify/references/spec-template.md skills/spec-write/references/spec-template.md`

(b) Edit the moved `spec-template.md` for D10 producer-neutrality:
- Line 3 (`Canonical spec document format used by \`design-specify\`...`) → `Canonical spec document format used by \`spec-write\`. Each acceptance criterion carries an observable boundary, a stable ID, and downstream placeholder fields populated by \`plan-build\` and \`execute-write\`.`
- Line 9 (`...those fields are populated downstream...`) — keep, but change `at spec-write time` already reads correctly; ensure no `design-specify` token remains.
- Line 18, replace the Architecture field line:

  from: `**Architecture:** {architecture chosen from design-specify hybrid}`

  to (producer-neutral, describes the settled *result*, D10):
  ```
  **Architecture:** {chosen architectural direction + its FAC basis (feasibility/suitability/completeness evidence) + rejected alternatives and declared sacrifices. Producer-neutral: satisfied identically by a committee verdict or a spec-architect output. A one-line provenance note may name the producer for traceability but is not part of the read contract.}
  ```

(c) Create `skills/spec-write/references/fac-complete-design-contract.md` (new, authored from D9):

```markdown
# FAC-Complete Design — Input Contract

The single input type `spec-write` consumes. A "FAC-complete design" is a design whose architecture is already settled with feasibility / suitability / completeness evidence. It has **two interchangeable producers** — a `design-committee` verdict and a `spec-architect` output — and `spec-write` reads it through this one contract regardless of producer.

`spec-write` does not require producers to emit a new typed artifact. It **extracts** the eight fields below from the producer's native output.

## The eight fields and their spec-template destinations

| Field | Spec destination | Committee verdict source | spec-architect source |
|-------|------------------|--------------------------|-----------------------|
| **Goal** | spec Goal | verdict's problem statement | brief goal |
| **Chosen architecture** | spec Architecture field *(the quote-back field)* | verdict's chosen direction | user-selected option |
| **Rejected alternatives + declared sacrifices** | architectural rationale + Constraints | verdict's rejected lenses | architect alternatives |
| **Prior-art findings** | Components / reuse notes + adversarial-pass context | researcher findings | prior-art explorer output |
| **Ground-truth-verified facts** | Components + Data Flow (consumed without re-verification) | researcher ground-truth | re-verified later in spec-harden |
| **Constraints / guardrails** | spec Constraints | verdict constraints | brief + F-A-C constraints |
| **Acceptance-criteria seeds** | AC-N.M expansion | verdict acceptance signals | brief acceptance criteria |
| **Deferred / non-goals** | spec Non-Goals | verdict deferments | brief out-of-scope |

## Mandatory architecture quote-back

Before authoring **any** spec section, `spec-write` reads the **Chosen architecture** field and **quotes it back** to the user for confirmation. That field is the pivot every architecture-derived spec section (Architecture, Components, Data Flow, Acceptance Criteria) depends on. Silent mis-extraction from a narrative committee verdict is the one failure hardening structurally cannot catch (it verifies the spec against itself, not against design intent) — the quote-back is the only guard.

## Why extraction, not a typed bundle

Producers emit no new artifact. A typed FAC-bundle (committee scribe writes a structured bundle) was rejected as primary — it adds a committee output mode and re-introduces artifact bifurcation — and is retained only as a documented fallback if extraction-with-quote-back proves unreliable (D9).
```

(d) Create `skills/spec-write/SKILL.md`. **Copy verbatim** the authoring body from `design-specify/SKILL.md` lines 143–159 (the `## Writing the Spec` section), changing only the stamp identity from `design-specify@<this-skill-version>` to `spec-write@<this-skill-version>`. Wrap with new frontmatter + head + integration:

**Stamp-count note:** lines 143–159 contain **exactly one** `chester-trailer-write stamp` call (line 154 — the spec). The ground-truth stamp at design-specify line 204 is **not** in this range; it travels with the Ground-Truth Review section into `spec-harden` in Task 3. Do not pull line 204 into spec-write — `test-stamping-spec-write.sh` asserts the spec identity, and a stray ground-truth stamp here would double-stamp that report once Task 3 lands.

```markdown
---
name: spec-write
description: "Author a spec document from a FAC-complete design. Use when the architecture is already settled — by a design-committee verdict or a spec-architect output. Extracts the eight-field FAC-complete-design contract, quotes back the chosen-architecture field for confirmation, fills the spec template, and emits the spec. Authors only — runs no review passes. Invoked by both entry paths; transitions to spec-harden."
version: v0001
---

# Write Spec

Author a spec document from a FAC-complete design. A pure function of settled architecture: `spec-write` performs no architecture selection and **no review passes** — it consumes a settled design and produces a spec. Hardening is `spec-harden`'s job.

This is a **flexible** skill — scale each spec section to its complexity.

## Entry Condition

A **FAC-complete design** exists (see `references/fac-complete-design-contract.md`) — one input type with two producers:
- a `design-committee` verdict (FAC-complete by deliberation), or
- a `spec-architect` output (FAC-complete by its F-A-C step).

Because there is no architecture stage inside `spec-write`, the committee path cannot trigger architecture re-derivation — the no-duplication invariant is satisfied by construction (D8).

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Read the FAC-complete design** — extract the eight fields per `references/fac-complete-design-contract.md` from the producer's native output (committee verdict or spec-architect output).
2. **Quote back the architecture** — read the chosen-architecture field and quote it back to the user for confirmation before authoring any spec section. This is mandatory; it is the only guard against silent architecture mis-extraction (hardening cannot catch a wrong-from-the-start architecture).
3. **Write the spec document** — fill the template at `references/spec-template.md` from the eight fields.
4. **Transition** — invoke `spec-harden` to run the three review passes. In the normal pipeline, continue directly so the adversarial pass inherits authoring context by agent continuity.

## Writing the Spec

<!-- BODY: copy design-specify/SKILL.md lines 143–159 verbatim, changing the stamp identity to spec-write@<this-skill-version> and the template path to references/spec-template.md -->

## Integration

- **Reads:** `references/fac-complete-design-contract.md` (the eight-field input type), `references/spec-template.md` (output format), `util-artifact-schema` (naming/paths)
- **Invoked by:** `spec-architect` (small-task path), the `design-committee` path (committee verdict), or user directly (standalone, with any FAC-complete design)
- **Transitions to:** `spec-harden`
- **Does NOT:** settle architecture (that is `spec-architect`), run any review pass (that is `spec-harden`), or branch on which producer supplied the design (one contract, two producers — D6)
```

- [ ] **Step 4: Regenerate the catalog**

Run: `bin/chester-generate-agents` — adds `spec-write` to `skills/setup-start/references/skill-index.md`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `for t in test-spec-write-skill test-stamping-spec-write test-fac-contract test-spec-template-neutral test-generated-agents-current; do bash tests/$t.sh; done`
Expected: each PASS. Also run `bash tests/test-stamping-design-specify.sh` → still PASS (design-specify untouched).

- [ ] **Step 6: Commit**

```bash
git add skills/spec-write/ tests/test-spec-write-skill.sh tests/test-stamping-spec-write.sh tests/test-fac-contract.sh tests/test-spec-template-neutral.sh skills/setup-start/references/skill-index.md
git commit -m "feat: add spec-write skill + FAC-complete-design contract (extracted authoring from design-specify)"
```

---

## Task 3: Create the spec-harden skill (extract the three review passes)

**Type:** docs-producing
**Implements:** AC-1.3, AC-4.2, AC-5.1
**Decision budget:** 2 (standalone ad-hoc wording; which stamp identity owns the ground-truth report)
**Must remain green:** `test-spec-harden-skill.sh`, `test-stamping-spec-harden.sh` (new), `test-generated-agents-current.sh` (catalog regenerated — spec-harden added); `test-stamping-design-specify.sh` (still green until Task 11)

**Files:**
- Create: `skills/spec-harden/SKILL.md`
- Move: `git mv skills/design-specify/references/spec-reviewer.md skills/spec-harden/references/spec-reviewer.md`
- Move: `git mv skills/design-specify/references/adversarial-spec-review.md skills/spec-harden/references/adversarial-spec-review.md`
- Move: `git mv skills/design-specify/references/ground-truth-reviewer.md skills/spec-harden/references/ground-truth-reviewer.md`
- Modify (after move): `skills/spec-harden/references/ground-truth-reviewer.md:4` (internal `design-specify` → `spec-harden`)
- Create: `tests/test-spec-harden-skill.sh`, `tests/test-stamping-spec-harden.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

`tests/test-spec-harden-skill.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/spec-harden/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

[ -f "$SKILL" ] || fail "spec-harden/SKILL.md does not exist"
grep -q '^name: spec-harden$' "$SKILL" || fail "frontmatter name not spec-harden"
grep -q '^version: v0001$' "$SKILL" || fail "version not v0001"
# Three passes in order
grep -qi 'fidelity' "$SKILL" || fail "missing fidelity pass"
grep -qi 'adversarial' "$SKILL" || fail "missing adversarial pass"
grep -qi 'ground-truth' "$SKILL" || fail "missing ground-truth pass"
# The three review reference files travelled with it
for r in spec-reviewer adversarial-spec-review ground-truth-reviewer; do
  [ -f "skills/spec-harden/references/$r.md" ] || fail "reference $r.md not moved"
done
# Standalone ad-hoc invocation (D11) + transitions to plan-build (AC-4.2)
grep -qi 'standalone\|ad-hoc\|ad hoc' "$SKILL" || fail "no standalone ad-hoc capability"
grep -qi 'plan-build' "$SKILL" || fail "does not transition to plan-build"
grep -q 'design-specify' "$SKILL" && fail "still references design-specify"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: spec-harden wired"
```

`tests/test-stamping-spec-harden.sh` (spec-harden stamps the ground-truth report):

```bash
#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/spec-harden/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

COUNT=$(grep -c 'chester-trailer-write stamp' "$SKILL" || true)
[ "$COUNT" -ge 1 ] || fail "expected >=1 stamp invocation (ground-truth report); got $COUNT"
grep -q 'spec-harden@' "$SKILL" || fail "stamp does not use spec-harden identity"
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0001" ] || fail "version not at v0001 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: spec-harden stamping wired"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bash tests/test-spec-harden-skill.sh; bash tests/test-stamping-spec-harden.sh`
Expected: FAIL on missing files.

- [ ] **Step 3: Write minimal implementation**

(a) Move the three review references:
```bash
git mv skills/design-specify/references/spec-reviewer.md skills/spec-harden/references/spec-reviewer.md
git mv skills/design-specify/references/adversarial-spec-review.md skills/spec-harden/references/adversarial-spec-review.md
git mv skills/design-specify/references/ground-truth-reviewer.md skills/spec-harden/references/ground-truth-reviewer.md
```

(b) Fix the internal reference in the moved `ground-truth-reviewer.md` line 4: `optional ground-truth review step in design-specify.` → `optional ground-truth review step in spec-harden.`

(c) Create `skills/spec-harden/SKILL.md`. **Copy verbatim** from `design-specify/SKILL.md`: the `## Spec Fidelity Review (single pass)` section (lines 161–173), `## Adversarial Spec Review (inline)` (lines 175–181), `## Ground-Truth Review (Automatic)` (lines 183–210), `## User Review Gate` (lines 212–220), and `## MCP Usage` (lines 226–229). Change the two stamp identities (`design-specify@<this-skill-version>` at the ground-truth stamp) to `spec-harden@<this-skill-version>`. Wrap with new frontmatter + head + integration:

```markdown
---
name: spec-harden
description: "Harden a spec through three review passes — fidelity, adversarial, ground-truth — then a user gate. Use after spec-write in the normal pipeline (the adversarial pass inherits authoring context by agent continuity), or invoke standalone on any spec ad-hoc to give it a full three-pass review. Fixes findings inline, writes the ground-truth report, gates on user approval, and transitions to plan-build."
version: v0001
---

# Harden Spec

Validate a spec through three automated review passes and a human gate. Consumes a completed spec (from `spec-write` or passed ad-hoc), the originating design (for fidelity goals-coverage and adversarial context), and codebase access.

This is a **rigid** skill for the review sequence: run fidelity → adversarial → ground-truth in that order. Do not reorder or skip passes.

<HARD-GATE>
Do NOT invoke plan-build or any implementation skill until the spec has passed all three review passes AND the user has approved it. Only then proceed to invoke plan-build.
</HARD-GATE>

## Entry Condition

A completed spec exists. Either:
- **Normal pipeline** — `spec-write` just authored it; the same agent continues into `spec-harden`, so authoring context (architecture sacrifices, prior-art findings, brief intent) is present by continuity and the adversarial pass uses it directly.
- **Ad-hoc standalone (D11)** — any spec is passed in directly (authored elsewhere, or re-hardened later). All three passes still run; the adversarial pass runs from the spec plus the originating design only — authoring context is reduced, accepted as the cost of the standalone capability.

If invoked standalone with no sprint context, invoke `start-bootstrap` first. The fidelity pass needs the originating design (committee verdict or brief) for goals coverage; without it, it degrades to internal-consistency checking only.

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Spec fidelity review (single pass)** — dispatch the spec-document-reviewer subagent once with the spec and the originating design; address findings inline.
2. **Adversarial spec review (inline)** — apply `references/adversarial-spec-review.md`; no subagent; address findings inline.
3. **Ground-truth review (automatic)** — dispatch the ground-truth-reviewer subagent; fix HIGH/MEDIUM findings; write and stamp the report in `spec/`.
4. **User review gate** — present the clean spec and ground-truth report; on changes, apply and ask which review(s) to re-run; on approval, transition.
5. **Transition** — invoke `plan-build`.

<!-- BODY: copy the five sections listed above from design-specify/SKILL.md verbatim, with the ground-truth stamp identity changed to spec-harden@<this-skill-version> -->

## Integration

- **Dispatches:** spec-document-reviewer subagent (fidelity), ground-truth-reviewer subagent (automatic, skipped only for greenfield specs)
- **Reads:** `references/spec-reviewer.md`, `references/adversarial-spec-review.md`, `references/ground-truth-reviewer.md`, `util-artifact-schema` (naming/paths)
- **Invoked by:** `spec-write` (normal pipeline), or user directly (ad-hoc standalone on any spec)
- **Transitions to:** `plan-build`
- **Does NOT:** author or re-author spec content (that is `spec-write`), settle architecture (that is `spec-architect`)
```

- [ ] **Step 4: Regenerate the catalog**

Run: `bin/chester-generate-agents` — adds `spec-harden` to `skills/setup-start/references/skill-index.md`. After this commit the catalog lists all three new skills plus the still-present design-specify (deleted in Task 11).

- [ ] **Step 5: Run tests to verify they pass**

Run: `bash tests/test-spec-harden-skill.sh; bash tests/test-stamping-spec-harden.sh; bash tests/test-generated-agents-current.sh`
Expected: all PASS. Note: `skills/design-specify/references/` is now empty; `design-specify/SKILL.md` has dangling reference links but is untouched and not invoked — it is deleted in Task 11. `bash tests/test-stamping-design-specify.sh` still PASSes (it greps SKILL.md content, not link resolution).

- [ ] **Step 6: Commit**

```bash
git add skills/spec-harden/ tests/test-spec-harden-skill.sh tests/test-stamping-spec-harden.sh skills/setup-start/references/skill-index.md
git commit -m "feat: add spec-harden skill (extracted three review passes from design-specify)"
```

---

## Task 4: Migrate design-small-task to spec-architect

**Type:** docs-producing
**Implements:** AC-1.1, AC-3.2
**Decision budget:** 1 (description rewrite wording)
**Must remain green:** `test-small-task-artifact-handoff.sh` (edited), `test-stamping-design-small-task.sh` (pin updated), `test-info-packet-style-version-bumps.sh` (pin updated), `test-generated-agents-current.sh` (catalog regenerated — design-small-task's description changes)

**Files:**
- Modify: `skills/design-small-task/SKILL.md:3` (description), `:25`, `:252`, `:258`, `:259` (transitions), frontmatter version `v0004`→`v0005`
- Modify: `skills/design-small-task/references/design-brief-small-template.md:5`
- Modify: `tests/test-small-task-artifact-handoff.sh:18` (grep target)
- Modify: `tests/test-stamping-design-small-task.sh:12` (version pin)
- Modify: `tests/test-info-packet-style-version-bumps.sh:22` (version pin `v0004`→`v0005`)
- Modify (generated): `skills/setup-start/references/skill-index.md` (regenerate — the description on line 3 changes)

**Coupled-test note:** TWO tests pin design-small-task's version — `test-stamping-design-small-task.sh:12` AND `test-info-packet-style-version-bumps.sh:22`. Both must move `v0004`→`v0005` in this commit. And because line 3 is the `description:` field (which feeds the generated catalog), the committed `skill-index.md` must be regenerated in this same commit or `test-generated-agents-current.sh` red-bars on a stale catalog.

**Steps (TDD):**

- [ ] **Step 1: Update the tests first (red)**

In `tests/test-small-task-artifact-handoff.sh:18`, change the grep target `design-specify` → `spec-architect` (and any FAIL message text). In `tests/test-stamping-design-small-task.sh:12`, change `v0004` → `v0005`. In `tests/test-info-packet-style-version-bumps.sh:22`, change `v0004` → `v0005`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bash tests/test-small-task-artifact-handoff.sh; bash tests/test-stamping-design-small-task.sh; bash tests/test-info-packet-style-version-bumps.sh`
Expected: FAIL — `design-small-task/SKILL.md` does not yet reference `spec-architect`; version still `v0004`.

- [ ] **Step 3: Apply the skill edits**

In `skills/design-small-task/SKILL.md`:
- Line 3 description: replace `transitions to design-specify (which formalizes the brief into a spec before plan-build)` → `transitions to spec-architect (which settles architecture, then spec-write authors and spec-harden hardens the spec before plan-build)`.
- Line 25: `transition to design-specify` → `transition to spec-architect`.
- Line 252: `Transition to design-specify.` → `Transition to spec-architect.`
- Line 258: `- **Transitions to:** \`design-specify\` (which formalizes brief into spec, then transitions to \`plan-build\`)` → `- **Transitions to:** \`spec-architect\` (which settles architecture, then chains to \`spec-write\` → \`spec-harden\` → \`plan-build\`)`.
- Line 259: replace the `design-specify handles architect comparison...` clause → `spec-architect handles architect comparison and spec-harden runs ground-truth verification (skipped only for greenfield specs)`.
- Frontmatter version `v0004` → `v0005`.

In `skills/design-small-task/references/design-brief-small-template.md:5`: `design-specify consumption` → `spec-architect consumption`.

- [ ] **Step 4: Regenerate the catalog (description changed)**

Run: `bin/chester-generate-agents`
This refreshes `skills/setup-start/references/skill-index.md` from the edited description. Required because line 3 is the `description:` field — `test-generated-agents-current.sh` diffs the committed catalog against a fresh regeneration and fails on any drift.

- [ ] **Step 5: Run tests to verify they pass**

Run: `bash tests/test-small-task-artifact-handoff.sh; bash tests/test-stamping-design-small-task.sh; bash tests/test-info-packet-style-version-bumps.sh; bash tests/test-generated-agents-current.sh`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add skills/design-small-task/SKILL.md skills/design-small-task/references/design-brief-small-template.md tests/test-small-task-artifact-handoff.sh tests/test-stamping-design-small-task.sh tests/test-info-packet-style-version-bumps.sh skills/setup-start/references/skill-index.md
git commit -m "fix: repoint design-small-task transition to spec-architect"
```

---

## Task 5: Migrate util-artifact-schema producer + stamping identities

**Type:** docs-producing
**Implements:** AC-4.1, AC-5.1
**Decision budget:** 2 (whether spec-architect appears as a non-stamping producer; exact stamping-list wording)
**Must remain green:** `test-artifact-schema.sh` (edited), `test-artifact-schema-provenance.sh` (loop + version pin edited)

**Files:**
- Modify: `skills/util-artifact-schema/SKILL.md` lines 108–109 (producer table), 205 (stamping list), frontmatter version `v0003`→`v0004`
- Modify: `tests/test-artifact-schema.sh:17` (producer loop)
- Modify: `tests/test-artifact-schema-provenance.sh:24` (stamping-skill loop), `:36` (version pin)

**Steps (TDD):**

- [ ] **Step 1: Update tests first (red)**

`tests/test-artifact-schema.sh:17` — replace the producer loop `"design-small-task" "design-specify" "plan-build" "execute-write" "finish-write-records"` with `"design-small-task" "spec-write" "spec-harden" "plan-build" "execute-write" "finish-write-records"`. (Remove the now-stale comment on lines 7–8 mentioning design-specify reinstatement, or update it to name spec-write/spec-harden.)

`tests/test-artifact-schema-provenance.sh:24` — replace the stamping-skill loop `design-small-task design-specify plan-build execute-write finish-write-records` with `design-small-task spec-write spec-harden plan-build execute-write finish-write-records`.

`tests/test-artifact-schema-provenance.sh:36` — change `grep -q '^version: v0003'` → `grep -q '^version: v0004'` and the FAIL message `v0003`→`v0004`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bash tests/test-artifact-schema.sh; bash tests/test-artifact-schema-provenance.sh`
Expected: FAIL — schema does not yet list `spec-write`/`spec-harden`; version still `v0003`.

- [ ] **Step 3: Apply the schema edits**

In `skills/util-artifact-schema/SKILL.md`:
- Producer table line 108: change the `spec` row's `Produced by` cell `design-specify` → `spec-write`.
- Producer table line 109: change the `spec-ground-truth-report` row's `Produced by` cell `design-specify (ground-truth review stage)` → `spec-harden (ground-truth review stage)`.
- Stamping-skill list line 205: replace `- \`design-specify\` (specs, ground-truth reports)` with two lines:
  ```
  - `spec-write` (specs)
  - `spec-harden` (ground-truth reports)
  ```
  (`spec-architect` is intentionally absent — it settles architecture and writes no stamped artifact; its output is consumed by `spec-write`.)
- Frontmatter version `v0003` → `v0004`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bash tests/test-artifact-schema.sh; bash tests/test-artifact-schema-provenance.sh`
Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/util-artifact-schema/SKILL.md tests/test-artifact-schema.sh tests/test-artifact-schema-provenance.sh
git commit -m "fix: repoint artifact-schema producer/stamping identities to spec-write and spec-harden"
```

---

## Task 6: Migrate plan-build invoked-by + ground-truth cascade

**Type:** docs-producing
**Implements:** AC-4.1
**Decision budget:** 1 (whether the cascade prose names spec-harden or "the spec stage")
**Must remain green:** `test-plan-build-heuristic.sh` (grep target edited), `test-stamping-plan-build.sh` (pin updated)

**Files:**
- Modify: `skills/plan-build/SKILL.md:148` (ground-truth cascade — two `design-specify` mentions), `:305` (Invoked by — two mentions), frontmatter version `v0006`→`v0007`
- Modify: `tests/test-plan-build-heuristic.sh:55-57` (comment + grep), `tests/test-stamping-plan-build.sh:15` (version pin)

**Steps (TDD):**

- [ ] **Step 1: Update tests first (red)**

`tests/test-plan-build-heuristic.sh` — update the comment (lines ~55–56) to the new canonical sequence and the grep (line 57) from `grep -q "Invoked by.*design-specify"` to `grep -q "Invoked by.*spec-harden"`.

`tests/test-stamping-plan-build.sh:15` — change `v0006` → `v0007`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bash tests/test-plan-build-heuristic.sh; bash tests/test-stamping-plan-build.sh`
Expected: FAIL — plan-build does not yet say `Invoked by ... spec-harden`; version still `v0006`.

- [ ] **Step 3: Apply the plan-build edits**

In `skills/plan-build/SKILL.md` there are **six** `design-specify` occurrences (`grep -n design-specify skills/plan-build/SKILL.md` to confirm: lines 148, 151, 153, 165, 305, 310). Repoint each to `spec-harden`:
- Lines 148/151/153/165 (Ground-Truth Report Cascade prose — "design-specify runs ground-truth review automatically", "owned by design-specify", "what design-specify already verified", etc.): replace `design-specify` with `spec-harden`. `spec-harden` is the skill that now runs ground-truth review and writes the report plan-build consumes.
- Line 305 (Integration `Invoked by`): `- **Invoked by:** \`design-specify\` (primary — with spec input; cascades the spec-stage ground-truth report from \`design-specify\` when present...)` → replace both `design-specify` with `spec-harden`.
- Line 310 (`Spec compatibility` note — "reads spec documents written by `design-specify`, regardless of whether the upstream brief came from `design-small-task` or a human-authored spec"): repoint to `spec-write` (the skill that now writes the spec). This is the one occurrence that maps to `spec-write`, not `spec-harden` — the spec is authored by spec-write; the ground-truth report is produced by spec-harden. **Preserve the "human-authored spec" clause** — do not do a bare token swap that drops it. plan-build still accepts specs authored outside the pipeline (the `spec-harden` ad-hoc path, D11, can hand plan-build a human-written spec). Suggested: "reads spec documents written by `spec-write`, or a human-authored spec — either is normalized into the spec contract."
- After editing, confirm `grep -n design-specify skills/plan-build/SKILL.md` → zero hits.
- Frontmatter version `v0006` → `v0007`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bash tests/test-plan-build-heuristic.sh; bash tests/test-stamping-plan-build.sh`
Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/plan-build/SKILL.md tests/test-plan-build-heuristic.sh tests/test-stamping-plan-build.sh
git commit -m "fix: repoint plan-build invoked-by and ground-truth cascade to spec-harden"
```

---

## Task 7: Migrate start-bootstrap standalone-support + canonical sequence

**Type:** docs-producing
**Implements:** AC-4.1
**Decision budget:** 2 (which new skills count as standalone-bootstrappable; canonical-sequence rendering)
**Must remain green:** `test-info-packet-style-version-bumps.sh` (pin updated — it pins start-bootstrap at `v0003` on line 21)

**Files:**
- Modify: `skills/start-bootstrap/SKILL.md:7`, `:21`, `:23`, frontmatter version `v0003`→`v0004`
- Modify: `tests/test-info-packet-style-version-bumps.sh:21` (version pin `v0003`→`v0004`)

**Pin-coupling note:** start-bootstrap is a non-stamping skill, so it has no `test-stamping-*` file — but `test-info-packet-style-version-bumps.sh:21` DOES pin its version at `v0003`. (The earlier-drafted "grep ... → expect none" check was wrong: that grep returns this line.) Bumping to `v0004` without updating line 21 red-bars the suite. No catalog regen needed here — only the body and version change, not the `description`.

**Steps (TDD):**

- [ ] **Step 1: Update the pin test first (red)**

In `tests/test-info-packet-style-version-bumps.sh:21`, change `v0003` → `v0004`.

- [ ] **Step 2: Confirm the red state**

Run: `bash tests/test-info-packet-style-version-bumps.sh` → FAIL (start-bootstrap still `v0003`). Run: `grep -n design-specify skills/start-bootstrap/SKILL.md` → three hits (lines 7, 21, 23).

- [ ] **Step 3: Apply the edits**

In `skills/start-bootstrap/SKILL.md`:
- Line 7: `(always, at the start of a design sprint) and by design-specify and execute-write` → `... and by spec-architect, spec-write, spec-harden, and execute-write`.
- Line 21: the canonical sequence `design-small-task → design-specify → plan-build → execute-write` → `design-small-task → spec-architect → spec-write → spec-harden → plan-build → execute-write`.
- Line 23: `- **Standalone only:** \`design-specify\` and \`execute-write\`...` → `- **Standalone only:** \`spec-architect\`, \`spec-write\`, \`spec-harden\`, and \`execute-write\` (when invoked without a prior design phase, they need sprint context created; when invoked mid-pipeline, sprint context already exists)`.
- Frontmatter version `v0003` → `v0004`.

- [ ] **Step 4: Verify clean**

Run: `grep -c design-specify skills/start-bootstrap/SKILL.md` → `0`. Run: `bash tests/test-info-packet-style-version-bumps.sh` → PASS. Run the full suite: `for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 || echo "FAIL: $t"; done` → no new failures.

- [ ] **Step 5: Commit**

```bash
git add skills/start-bootstrap/SKILL.md tests/test-info-packet-style-version-bumps.sh
git commit -m "fix: repoint start-bootstrap canonical sequence and standalone-support to spec-* chain"
```

---

## Task 8: Migrate finish-write-records record-formats

**Type:** docs-producing
**Implements:** AC-4.1
**Decision budget:** 2 (provenance example skills to show; whether to repoint the rationale prose at 233–234)
**Must remain green:** `test-finish-write-records-provenance.sh:32` (pin updated)

**Files:**
- Modify: `skills/finish-write-records/references/record-formats.md:68`, `:192`, `:233-234`
- Modify: `skills/finish-write-records/SKILL.md` frontmatter version `v0004`→`v0005`
- Modify: `tests/test-finish-write-records-provenance.sh:32` (version pin)

**Steps (TDD):**

- [ ] **Step 1: Update the pin test first (red)**

`tests/test-finish-write-records-provenance.sh:32` — change `v0004` → `v0005`.

- [ ] **Step 2: Run to verify it fails**

Run: `bash tests/test-finish-write-records-provenance.sh`
Expected: FAIL — finish-write-records still at `v0004`.

- [ ] **Step 3: Apply the edits**

In `skills/finish-write-records/references/record-formats.md`:
- Line 68 (provenance example): `<!-- produced-by design-specify@vNNNN -->` → two lines `<!-- produced-by spec-write@vNNNN -->` and `<!-- produced-by spec-harden@vNNNN -->`.
- Line 192 (stage enum): `stage: design-small-task | design-specify | plan-build | execute-write | finish-write-records` → `stage: design-small-task | spec-architect | spec-write | spec-harden | plan-build | execute-write | finish-write-records`.
- Lines 233–234 (audit-design rationale): repoint the two `design-specify` mentions to the spec stage — `...at each substantive moment in spec-write and plan-build...` (233) and `Single-fork emission at end of spec-write only...` (234). These name a current pipeline stage; repoint for current-state accuracy.

In `skills/finish-write-records/SKILL.md`: frontmatter version `v0004` → `v0005`.

- [ ] **Step 4: Run to verify it passes**

Run: `bash tests/test-finish-write-records-provenance.sh`
Expected: PASS. Confirm `grep -c design-specify skills/finish-write-records/references/record-formats.md` → `0`.

- [ ] **Step 5: Commit**

```bash
git add skills/finish-write-records/references/record-formats.md skills/finish-write-records/SKILL.md tests/test-finish-write-records-provenance.sh
git commit -m "fix: repoint finish-write-records record-formats to spec-* chain"
```

---

## Task 9: Repoint descriptive-only mentions (no version bump)

**Type:** docs-producing
**Implements:** AC-4.1
**Decision budget:** 1 (design-committee guard wording)
**Must remain green:** existing suite (no test targets these specific lines; `test-design-committee-context-economy.sh` checks version `> v0017` — unaffected by leaving v0022)

These three edits replace the dead `design-specify` token inside descriptive prose that states no transition/invoker/identity contract — so per the CLAUDE.md "comment-only edit" carve-out, **no version bump** and no coupled pin test.

**Files:**
- Modify: `skills/execute-write/SKILL.md:23`
- Modify: `skills/design-committee/SKILL.md:18`

**Steps (TDD):**

- [ ] **Step 1: Confirm the stale state**

Run: `grep -n design-specify skills/execute-write/SKILL.md skills/design-committee/SKILL.md`
Expected: `execute-write:23`, `design-committee:18`.

- [ ] **Step 2: (No new test — these are descriptive prose; Task 11's migration-completeness test is the durable gate.)**

- [ ] **Step 3: Apply the edits**

`skills/execute-write/SKILL.md:23` — update the canonical-sequence parenthetical: `(\`design-small-task\` → \`design-specify\` → \`plan-build\` → execute-write)` → `(\`design-small-task\` → \`spec-architect\` → \`spec-write\` → \`spec-harden\` → \`plan-build\` → execute-write)`, and change `inherited through \`design-specify\` and \`plan-build\` unchanged` → `inherited through \`spec-architect\`, \`spec-write\`, \`spec-harden\`, and \`plan-build\` unchanged`. (Behavior unchanged: execute-write still inherits the worktree; no version bump.)

`skills/design-committee/SKILL.md:18` — the when-to-use guard `Do NOT convene when other skill owns planning: \`design-small-task\`, \`design-specify\`.` → `Do NOT convene when other skill owns planning: \`design-small-task\`. (The spec-* skills consume committee output downstream; they do not compete with committee for the planning role.)` (Illustrative guard; committee behavior unchanged; no version bump.)

- [ ] **Step 4: Verify**

Run: `grep -c design-specify skills/execute-write/SKILL.md skills/design-committee/SKILL.md` → both `0`. Run `bash tests/test-stamping-execute-write.sh` (pin still `v0008`) and `bash tests/test-design-committee-context-economy.sh` → both PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/execute-write/SKILL.md skills/design-committee/SKILL.md
git commit -m "docs: repoint descriptive design-specify mentions in execute-write and design-committee"
```

---

## Task 10: Migrate current-state docs (instructions + README)

**Type:** docs-producing
**Implements:** AC-4.1
**Decision budget:** 3 (how to render the 3-skill chain in the pipeline diagram; splitting the one design-specify doc section into three; README table phrasing)
**Must remain green:** existing suite (no test parses docs/instructions.md or docs/README.md for design-specify)

**Files:**
- Modify: `docs/instructions.md` (13 occurrences: lines 31, 116, 157, 167, 176, 183, 187–211, 221, 534, 538–540, 584, 613 — see the mention map below)
- Modify: `docs/README.md:38`

**Completeness note:** `grep -n design-specify docs/instructions.md` returns **13** hits. The mention map below covers all of them — in particular line 157 (`start-bootstrap`'s "Called internally by ... design-specify (standalone)") and line 613 (the bottom quick-reference table row), both easy to miss. Task 11's completeness test greps `docs/instructions.md` for `design-specify` and fails on any survivor, so every one of the 13 must be repointed.

**Steps (TDD):**

- [ ] **Step 1: Confirm the stale state**

Run: `grep -n design-specify docs/instructions.md docs/README.md`
Expected: ~14 hits across the two files.

- [ ] **Step 2: (No automated test for narrative docs — the Task 11 migration-completeness test asserts the live-pipeline docs are clean.)**

- [ ] **Step 3: Apply the edits**

`docs/instructions.md`:
- Line 31 (flexible-skills list): replace `design-specify` with `spec-architect`, `spec-write`, `spec-harden`.
- Line 116 (pipeline diagram): replace the single `design-specify` node with the three-node chain `spec-architect → spec-write → spec-harden` (render to match the diagram's existing arrow style).
- Line 157 (`start-bootstrap` "When it runs"): `Called internally by \`design-small-task\` and \`design-specify\` (standalone).` → `Called internally by \`design-small-task\`, \`spec-architect\`, \`spec-write\`, and \`spec-harden\` (standalone).`
- Line 167: `transitions to \`design-specify\` for formalization into a spec before planning.` → `transitions to \`spec-architect\` (which settles architecture; then \`spec-write\` authors and \`spec-harden\` hardens) before planning.`
- Line 176: `Hands the brief to \`design-specify\`, which formalizes it into a reviewed spec before \`plan-build\`` → describe the chain `spec-architect` → `spec-write` → `spec-harden` → `plan-build`.
- Line 183: `...self-contained enough that \`design-specify\` can dispatch its architects from the brief alone.` → `\`spec-architect\` can dispatch its architects from the brief alone.`
- Lines 187–211 (the entire `### \`chester:design-specify\`` section): replace with **three** sections — `### \`chester:spec-architect\``, `### \`chester:spec-write\``, `### \`chester:spec-harden\`` — each describing its phase (architecture settling / authoring / three-pass hardening + plan-build transition). Draw the descriptions from the three new SKILL.md `description` fields for consistency.
- Line 221: `After \`design-specify\` approves the spec.` → `After \`spec-harden\` approves the spec.`
- Line 534: `...whether \`design-specify\` can dispatch architects from the brief alone.` → `...whether \`spec-architect\` can dispatch architects from the brief alone.`
- Lines 538–540 (`### \`chester:design-specify\` (standalone invocation)`): retitle to `### \`chester:spec-architect\` (standalone invocation)` and update body to `spec-architect` running `start-bootstrap`.
- Line 584 (table row): `| You already have a design brief and just need a spec | \`design-specify\` (standalone) |` → `| You already have a design brief and just need a spec | \`spec-architect\` (standalone, chains to spec-write → spec-harden) |`. (Optionally add a row: `| You already have a spec and just need it hardened | \`spec-harden\` (standalone, ad-hoc) |` — surfaces the D11 capability.)
- Line 613 (bottom quick-reference table row): `| \`design-specify\` | Design | Formalize a brief into a reviewed spec |` → replace with three rows (`spec-architect` / `spec-write` / `spec-harden`) or one chain row, matching the table's column format.

`docs/README.md:38`: `| \`chester-design-specify\` | Turns the design brief into a reviewed, approvable spec |` → replace with three rows for `chester-spec-architect` / `chester-spec-write` / `chester-spec-harden`, or one row naming the chain. Match the table's existing column format.

- [ ] **Step 4: Verify clean**

Run: `grep -c design-specify docs/instructions.md docs/README.md`
Expected: both `0`.

- [ ] **Step 5: Commit**

```bash
git add docs/instructions.md docs/README.md
git commit -m "docs: repoint current-state pipeline docs to spec-architect/spec-write/spec-harden"
```

---

## Task 11: Delete design-specify + regenerate catalog + migration-completeness gate

**Type:** docs-producing
**Implements:** AC-4.1, AC-4.3, AC-5.1
**Decision budget:** 2 (whether to add the design-specify dir to the revert-clean DELETED_PATHS; test-start-cleanup stale-entry handling)
**Must remain green:** `test-no-design-specify-live-refs.sh` (new), `test-generated-agents-current.sh` (catalog regenerated — design-specify drops out), `test-trailer-harvest.sh`, `test-start-cleanup.sh`, `test-no-archived-refs.sh`, `test-decision-record-revert-clean.sh`

**Files:**
- Delete: `skills/design-specify/` (entire directory — SKILL.md; references now empty after Tasks 2–3 moves)
- Delete: `tests/test-stamping-design-specify.sh` (replaced by `test-stamping-spec-write.sh` + `test-stamping-spec-harden.sh` from Tasks 2–3)
- Create: `tests/test-no-design-specify-live-refs.sh`
- Modify (generated): `skills/setup-start/references/skill-index.md` (regenerate — design-specify drops out of the catalog)
- Verify (no edit expected): `tests/test-trailer-harvest.sh`, `tests/test-start-cleanup.sh`, `tests/test-no-archived-refs.sh`, `tests/test-decision-record-revert-clean.sh`

**Ordering note (critical):** the migration-completeness test greps `skills/` for `design-specify`, and `skills/setup-start/references/skill-index.md` still lists it until the catalog is regenerated. So within this task the order is: delete the dir → **regenerate the catalog** → run the completeness test → run the full suite. Regenerating before the completeness test is what makes both `test-no-design-specify-live-refs.sh` and `test-generated-agents-current.sh` pass in this commit. This is why catalog regeneration lives here (with the deletion that changes the skill set), not in a separate trailing task.

**Steps (TDD):**

- [ ] **Step 1: Write the migration-completeness test (red)**

Create `tests/test-no-design-specify-live-refs.sh` (AC-4.1 — the durable gate that no live caller remains, while historical record is preserved):

```bash
#!/usr/bin/env bash
set -euo pipefail
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# 1. The skill directory is gone
[ ! -d "skills/design-specify" ] || fail "skills/design-specify/ still exists"

# 2. No live skill or agent references design-specify
if grep -rn "design-specify" skills/ 2>/dev/null; then
  fail "live skill tree still references design-specify"
fi
if grep -rn "design-specify" agents/ 2>/dev/null; then
  fail "agents/ still references design-specify"
fi

# 3. Current-state docs are clean
for d in docs/instructions.md docs/README.md; do
  grep -q "design-specify" "$d" && fail "$d still references design-specify"
done

# 4. The three new skills exist
for s in spec-architect spec-write spec-harden; do
  [ -f "skills/$s/SKILL.md" ] || fail "skills/$s/SKILL.md missing"
done

# 5. Historical record is intentionally PRESERVED (sanity: these still mention it)
grep -q "design-specify" docs/chester/decision-record/decision-record.md \
  || echo "NOTE: decision-record no longer mentions design-specify (unexpected but not fatal)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: design-specify fully migrated; historical record preserved"
```

- [ ] **Step 2: Run to verify it fails**

Run: `bash tests/test-no-design-specify-live-refs.sh`
Expected: FAIL — `skills/design-specify/` still exists.

- [ ] **Step 3: Delete and verify the auxiliary tests**

```bash
git rm -r skills/design-specify
git rm tests/test-stamping-design-specify.sh
```

Then verify (do not edit unless a test actually fails):
- `bash tests/test-trailer-harvest.sh` → PASS. Its `design-specify@v0005` strings (lines 27, 36, 52–53, 56) are **synthetic historical fixtures** testing harvest dedup by `(skill, version)` tuple — they are not live references and must stay (preserving them proves harvest still handles legacy provenance). No edit.
- `bash tests/test-start-cleanup.sh` → PASS (and it already passes today, before any edit in this sprint). The test asserts `setup-start/SKILL.md` does **not** name the skills in its forbidden list (line 13), which already includes `design-specify`. `setup-start/SKILL.md` contains no `design-specify` reference now and never gains one, so this test is green throughout the sprint — do **not** expect a mid-sprint red here. The list entry is stale-but-harmless after deletion (design-specify is deleted, not archived). Leave it — removing it is optional tidy, not required for green.
- `bash tests/test-no-archived-refs.sh` → PASS. It scans `skills/`/`agents/`/`.claude-plugin/` for *archived* skill names (currently `design-figure-out`); `design-specify` is not in its archived list, and historical `plans/` docs are excluded from its scan dirs. No edit.
- `bash tests/test-decision-record-revert-clean.sh` → PASS. Its line 47 asserts `skills/design-specify/references/skeleton-generator.md` is absent (already true). After deleting the dir it remains absent. Optionally add `"$ROOT/skills/design-specify"` to its DELETED_PATHS to assert the whole dir is gone — decide during execution; not required for green.

- [ ] **Step 4: Regenerate the catalog (design-specify drops out)**

Run: `bin/chester-generate-agents`
The glob `skills/*/SKILL.md` no longer matches the deleted dir, so `design-specify` falls out of `skills/setup-start/references/skill-index.md` and the three new skills remain. This MUST run before Step 5 — otherwise the stale catalog still contains `design-specify` and both `test-no-design-specify-live-refs.sh` (greps `skills/`) and `test-generated-agents-current.sh` (catalog freshness) fail.

- [ ] **Step 5: Run the migration-completeness test + full suite**

Run: `bash tests/test-no-design-specify-live-refs.sh`
Expected: PASS (skill tree, agents/, and current-state docs all clean; three new skills present).
Run: `bash tests/test-generated-agents-current.sh`
Expected: PASS (catalog now omits design-specify, lists the three new skills).
Run: `for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 || echo "FAIL: $t"; done`
Expected: no `FAIL:` lines — the entire suite is green at this commit (the atomic-cutover commit).

- [ ] **Step 6: Commit**

```bash
git add tests/test-no-design-specify-live-refs.sh skills/setup-start/references/skill-index.md
git rm -r skills/design-specify tests/test-stamping-design-specify.sh 2>/dev/null || true
git commit -m "feat: delete design-specify (atomic cutover), regenerate catalog, add migration-completeness gate"
```

---

## Task 12: Final verification gate (whole-suite + catalog + clean-cut)

**Type:** docs-producing
**Implements:** AC-4.3, AC-5.1
**Decision budget:** 1 (none expected — verification only; budget reserved for a surprise stale reference)
**Must remain green:** entire `tests/test-*.sh` suite

The catalog is already regenerated incrementally (Tasks 1–4 added the new skills/description; Task 11 dropped design-specify), so this task **does not regenerate** — it is the final no-regression gate over the whole migration. No new commit unless a residual issue is found and fixed here.

**Files:**
- Verify only: `skills/setup-start/references/skill-index.md` (already current from Task 11), the whole `tests/` suite, the live tree.

**Steps (TDD):**

- [ ] **Step 1: Assert the final catalog state (AC-4.3)**

```bash
IDX="skills/setup-start/references/skill-index.md"
grep -q "design-specify" "$IDX" && echo "RED: index still lists design-specify"
for s in spec-architect spec-write spec-harden; do
  grep -q -- "- \*\*$s\*\*" "$IDX" || echo "RED: index missing $s"
done
```
Expected: no RED lines (Task 11 already produced this state). If any RED line prints, a prior task's regen was skipped — run `bin/chester-generate-agents`, stage `skill-index.md`, and amend the appropriate commit.

- [ ] **Step 2: Assert catalog freshness + determinism**

Run: `bash tests/test-generated-agents-current.sh; bash tests/test-generate-catalog.sh`
Expected: both PASS (committed catalog == fresh regeneration; generator deterministic).

- [ ] **Step 3: Assert the clean cut (AC-4.1 backstop)**

Run: `bash tests/test-no-design-specify-live-refs.sh`
Expected: PASS. Also spot-run `grep -rn design-specify skills/ agents/ docs/instructions.md docs/README.md` → zero live hits.

- [ ] **Step 4: Whole-suite green (AC-5.1 — no regression)**

Run: `for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 || echo "FAIL: $t"; done`
Expected: no `FAIL:` lines across the entire suite.

- [ ] **Step 5: Commit (only if a fix was needed)**

If Steps 1–4 were all green with no edits, there is nothing to commit — the migration is already complete and green as of Task 11. If a residual fix was required, stage exactly the touched paths and commit:

```bash
git add <only the files you actually fixed>
git commit -m "chore: final migration verification fixups for spec-* decomposition"
```

---

## Post-Plan Notes

- **Runtime discovery.** The three new skills are invocable as `chester:spec-architect` / `chester:spec-write` / `chester:spec-harden` only after `/reload-plugins` (or a session restart). The bash suite asserts file structure, not live registration — a green suite does not prove the plugin reloaded. Reload before exercising the pipeline end-to-end.
- **Behavioral ACs 3.1 / 3.2 / 5.1** are structural-by-proxy in this plan (file/grep assertions on extracted skills), because Chester's test harness is bash structural checks, not a skill-execution runtime. The "no architecture re-derivation on the committee path" guarantee (AC-3.1) is enforced by construction: `spec-write` contains no architecture stage and the committee path never invokes `spec-architect`. The "no hardening regression" guarantee (AC-5.1) rests on verbatim extraction (D12) — `spec-harden` copies design-specify's three review sections unchanged — plus the preserved review-reference files.
- **Worktree.** This sprint reached plan-build via the committee → design-specify standalone path, so no dedicated worktree was created upstream. execute-write will need a branch/worktree before implementation. Confirm the worktree story at execute-write handoff (default: branch `20260612-02-expand-committee-responsibilities`).

<!-- created-at: 2026-06-13T08:33:08Z -->
<!-- produced-by plan-build@v0006 -->
