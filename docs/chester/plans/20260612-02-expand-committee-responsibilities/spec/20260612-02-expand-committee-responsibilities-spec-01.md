# Spec: Decompose the Specification System into spec-architect / spec-write / spec-harden

**Sprint:** 20260612-02-expand-committee-responsibilities
**Parent brief:** docs/chester/working/20260612-02-expand-committee-responsibilities/design/20260612-02-expand-committee-responsibilities-design-00.md
**Architecture:** Three-skill decomposition of the specification stage — `spec-architect` (settle), `spec-write` (construct), `spec-harden` (verify) — replacing the fused `design-specify` by extraction. Settled by a four-round design committee (brief decisions D1–D12); produced via committee deliberation, not a competing-architectures pass. _(Architecture field authored per D10: describes the settled result, names the producer as provenance.)_

## Goal

Chester's specification stage is one fused skill, `design-specify`, that settles architecture, authors the spec, and hardens it. Two entry points feed it with different completeness: `design-small-task` produces a FAC-incomplete design (architecture unsettled), while `design-committee` produces a FAC-complete one (architecture already settled). Because `design-specify` always runs its architecture-settling front half, a committee-sourced design has its architecture re-derived — observed in 100% of real hand-offs, where the spec agent reports the FAC work already complete and invents trivial choices to run the process. This sprint decomposes `design-specify` along its already-clean internal seam into three skills so that architecture work runs once, where it is needed, and never twice. The committee path skips `spec-architect` entirely; no-duplication becomes structural rather than a conditional flag.

## Components

**New skills:**

- **`skills/spec-architect/SKILL.md`** — the architecture-settling precursor. Extracts `design-specify`'s current architecture-settling behavior: read design, name the two sharpest tensions, dispatch two `feature-dev:code-architect` agents on assigned axes + one prior-art explorer, F-A-C self-checks, build the hybrid, present three blocks, capture the user's architecture selection. Produces a FAC-complete design. Invoked **only** by the FAC-incomplete entry path (`design-small-task`). Transitions to `spec-write`.
- **`skills/spec-write/SKILL.md`** — constructive authoring. Consumes a FAC-complete design (the shared input type, D6), extracts the eight-field contract (D9), quotes back the chosen-architecture field before authoring, fills the spec template, emits the spec. No review passes. Invoked by **both** entry paths. Transitions to `spec-harden`.
- **`skills/spec-harden/SKILL.md`** — verification, independently callable. Runs the three review passes in order — fidelity → adversarial → ground-truth — then the user gate. Extracts `design-specify`'s current review behavior intact. Supports standalone ad-hoc invocation on an arbitrary spec (D11). Transitions to `plan-build`.

**New reference:**

- **`skills/spec-write/references/fac-complete-design-contract.md`** — defines the eight-field "FAC-complete design" input contract (D9) and how each producer's native output (committee verdict; `spec-architect` output) maps onto it, including the mandatory architecture quote-back.

**Modified:**

- **`skills/spec-write/references/spec-template.md`** (moved from `design-specify/references/`) — the Architecture field rewritten to be producer-neutral (D10): records the chosen direction, its FAC basis, and rejected alternatives + sacrifices; a separate one-line provenance note names the producer but is not part of the read contract.
- **`skills/design-small-task/SKILL.md`** — Integration `Transitions to:` repointed from `design-specify` to `spec-architect`.
- **`skills/setup-start/references/skill-index.md`** — regenerated via `bin/chester-generate-agents`: `design-specify` removed, the three new skills added.
- **`skills/util-artifact-schema/SKILL.md`** — add the three new skills' artifact naming and provenance-trailer identities (spec written by `spec-write`, reports/stamps by `spec-harden`).
- **Live routing references** — repoint every skill that routes work to/from `design-specify`: `design-small-task` (transition), and any of `start-bootstrap`, `plan-build`, `execute-write`, `finish-write-records` that invoke, transition to, or instruct on `design-specify`. plan-build classifies each reference as routing (repoint) vs mention.
- **Current-state docs** — `docs/instructions.md` (live-pipeline diagram + the `### chester:design-specify` section) and `docs/README.md` mentions describing the live pipeline are repointed to the new chain. (Root `CLAUDE.md` carries no `design-specify` reference — not a target.)
- **Test suite** — ~9 `tests/test-*.sh` reference `design-specify`, including `test-stamping-design-specify.sh` (filename-coupled — a rename, not just a content edit). Updated under AC-5.1; `test-no-archived-refs.sh` is read during planning for tension with the historical-record carve-out.

**Explicitly NOT rewritten (historical record):**

- `docs/chester/decision-record/decision-record.md`, `docs/admin/*` postmortems, `docs/feature-definition/Complete/*` and `Pending/*`, and any archived `docs/chester/plans/*` — these describe past state declaratively and are left intact per Chester's standalone-documentation discipline (history is not repointed).

**Deleted:**

- **`skills/design-specify/`** — removed entirely after its behavior is extracted (D12, atomic cutover). The three review-side reference files (`spec-reviewer.md`, `adversarial-spec-review.md`, `ground-truth-reviewer.md`) move to `spec-harden/references/`; `spec-template.md` moves to `spec-write/references/`.

## Data Flow

Two entry paths converge on a shared `spec-write` → `spec-harden` chain:

- **FAC-incomplete (small-task):** `design-small-task` (brief) → `spec-architect` (settles architecture via competing-architectures + F-A-C + user gate → FAC-complete design) → `spec-write` (authors spec) → `spec-harden` (fidelity → adversarial → ground-truth → user gate) → `plan-build`.
- **FAC-complete (committee):** committee verdict (already FAC-complete) → `spec-write` (authors spec; `spec-architect` never invoked) → `spec-harden` → `plan-build`.
- **Ad-hoc hardening:** any spec → `spec-harden` (standalone) → reviewed spec. Adversarial pass runs with spec + originating design context only.

The "FAC-complete design" is one input type (D6) with two producers. In the normal pipeline a single agent runs `spec-write` then continues into `spec-harden`, so the adversarial pass inherits authoring context by continuity (D5/D11).

## Error Handling

- **Silent architecture mis-extraction** — `spec-write` mis-reading the chosen-architecture field from a narrative committee verdict. Mitigation: mandatory quote-back of the architecture field before authoring any section (D9). Hardening cannot catch this (it verifies the spec against itself), so the quote-back is the only guard.
- **Reduced adversarial context on the ad-hoc path** — a spec hardened standalone lacks authoring continuity; the adversarial pass uses spec + originating design only. Accepted trade (D11); the normal pipeline is unaffected.
- **Missing originating design at hardening** — `spec-harden`'s fidelity pass needs the originating design for goals coverage; without it, it degrades to internal-consistency only (carried from current `design-specify` behavior).
- **Missed caller during migration** — a `design-specify` reference left un-repointed strands a path on a deleted skill. Mitigation: the regenerated skill-index plus an explicit grep-for-`design-specify` acceptance check (AC-4.1).

## Testing Strategy

- **Behavioral end-to-end (both paths)** — exercise the committee path and the small-task path through to a hardened spec; assert the committee path executes no architecture-settling step and the small-task path does (AC-3.1, AC-3.2).
- **Standalone hardening** — invoke `spec-harden` on an arbitrary spec with no upstream author; assert all three passes run (AC-1.3).
- **Contract conformance** — assert `spec-write` extracts all eight fields and quotes back the architecture field (AC-2.1); assert the spec-template Architecture field is producer-neutral (AC-2.2).
- **Migration completeness** — grep the skill tree and docs for `design-specify`; assert no live caller remains and `skill-index.md` lists the three new skills (AC-4.1, AC-4.3).
- **No hardening regression** — run `spec-harden`'s three passes against a representative spec known to contain a HIGH-class defect; assert it is caught, matching current `design-specify` behavior (AC-5.1). Existing `tests/test-*.sh` referencing `design-specify` are updated to the new skill names.

## Constraints

- **CC1 (committee-converged, 4-0):** architecture-settling is skipped for the committee path, and the adversarial pass's authoring-context coupling must be honored (here: by agent continuity in the normal flow). _(normative — committee Round 04.)_
- **No hardening regression:** the three review behaviors must be no weaker than current `design-specify` — the chain has a track record of catching HIGH findings. _(normative — committee Conservator + researcher Pair F.)_
- **Extraction, not rewrite:** review and authoring behavior moves intact from `design-specify`; it is not re-authored. _(normative — D12; the cheapest way to satisfy no-regression.)_
- **Skill-file conventions:** new skills follow `skills/{phase}-{name}/SKILL.md` with `name`/`description`/`version: v0001` frontmatter; the catalog is regenerated, not hand-edited. _(structural — root CLAUDE.md.)_

## Non-Goals

- **The authoring-notes-artifact mechanism** — not built; agent continuity supplies adversarial context in the normal flow (D5/D11).
- **The adversarial-pass independence question (Round 01 H/M/L)** — explicitly decoupled; a separate future decision.
- **Changing `design-committee` or `design-small-task` internals** — only `design-small-task`'s downstream transition target changes; neither skill's body is reworked.
- **A typed FAC-bundle emitted by producers** — rejected in favor of extraction (D9); remains a documented fallback only, not built here.

## Acceptance Criteria

### AC-1.1 — spec-architect settles architecture, small-task path only

**Observable boundary:**
- A `spec-architect` skill exists with valid frontmatter → discoverable as `chester:spec-architect`.
- Invoked on a FAC-incomplete design → runs competing-architectures + F-A-C + user selection, transitions to `spec-write`.
- `design-small-task` Integration → `Transitions to: spec-architect`.

**Given:** a FAC-incomplete design brief from `design-small-task`.
**When:** the specification stage runs.
**Then:** `spec-architect` settles the architecture and hands a FAC-complete design to `spec-write`.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — spec-write authors only, from a FAC-complete design

**Observable boundary:**
- A `spec-write` skill exists, discoverable as `chester:spec-write`.
- Invoked with a FAC-complete design → fills the spec template and emits the spec, runs no review passes.
- Transitions to `spec-harden`.

**Given:** a FAC-complete design (committee verdict or `spec-architect` output).
**When:** `spec-write` runs.
**Then:** a spec document is authored and emitted, with no architecture-settling and no review passes executed inside `spec-write`.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.3 — spec-harden runs three passes and is independently callable

**Observable boundary:**
- A `spec-harden` skill exists, discoverable as `chester:spec-harden`.
- Run after `spec-write` → executes fidelity → adversarial → ground-truth → user gate, in that order.
- Invoked standalone on an arbitrary spec with no upstream author → still runs all three passes.
- Transitions to `plan-build`.

**Given:** a completed spec (from `spec-write`, or passed ad-hoc).
**When:** `spec-harden` runs.
**Then:** all three review passes execute in order and the spec proceeds to the user gate.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — FAC-complete input contract: eight fields, extracted, with quote-back

**Observable boundary:**
- `spec-write/references/fac-complete-design-contract.md` defines exactly eight fields and each producer's mapping.
- `spec-write` reads and quotes back the chosen-architecture field before authoring any spec section.

**Given:** a narrative committee verdict as input.
**When:** `spec-write` begins.
**Then:** it extracts the eight fields and surfaces the architecture field for confirmation before writing.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.2 — spec-template Architecture field is producer-neutral

**Observable boundary:**
- The spec-template Architecture field contains no reference to a producing skill or settling process.
- It records chosen direction + FAC basis + rejected alternatives; provenance is a separate non-contract note.

**Given:** the relocated spec-template.
**When:** either producer's design is authored into a spec.
**Then:** the Architecture field is satisfiable identically by a committee verdict and a `spec-architect` output.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — committee path produces a hardened spec with no architecture-settling

**Observable boundary:**
- Committee verdict → `spec-write` → `spec-harden` produces a hardened spec.
- No competing-architectures dispatch and no invented A/B choices occur on this path.

**Given:** a FAC-complete committee design.
**When:** the specification stage runs.
**Then:** a hardened spec is produced and `spec-architect` is never invoked.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.2 — small-task path produces a hardened spec with architecture settled

**Observable boundary:**
- `design-small-task` → `spec-architect` → `spec-write` → `spec-harden` produces a hardened spec.
- The Architecture field is populated by `spec-architect`'s user-selected direction.

**Given:** a FAC-incomplete small-task brief.
**When:** the specification stage runs.
**Then:** architecture is settled by `spec-architect` and the spec is authored and hardened.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — design-specify is deleted with no live caller remaining

**Observable boundary:**
- `skills/design-specify/` no longer exists.
- A grep for `design-specify` across `skills/` returns no live invocation or transition reference — every routing skill is repointed to the new chain.
- Current-state docs (`docs/instructions.md`, `docs/README.md`) contain no live-pipeline reference to `design-specify`.
- The `tests/` suite (~9 files) references the new skill names, not `design-specify` (the filename-coupled `test-stamping-design-specify.sh` is renamed).
- Historical record (`docs/chester/decision-record/`, `docs/admin/`, `docs/feature-definition/`, archived `docs/chester/plans/`) is unchanged — its `design-specify` mentions are past-state and are intentionally preserved.

**Given:** the migration is complete.
**When:** the skill tree and current-state docs are searched.
**Then:** no skill or live-pipeline doc routes work to `design-specify`, while historical record remains intact.

**Note:** the reference footprint is ~20 files, not the ~8 the brief estimated; only the subset classified as routing or current-state is repointed. plan-build owns the per-file classification.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.2 — spec-harden inherits the plan-build transition

**Observable boundary:**
- `spec-harden` Integration → `Transitions to: plan-build`.
- No other new skill transitions to `plan-build`.

**Given:** an approved spec at the user gate.
**When:** the user approves.
**Then:** `spec-harden` transitions to `plan-build`.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.3 — skill catalog regenerated

**Observable boundary:**
- `skill-index.md` lists `spec-architect`, `spec-write`, `spec-harden` and omits `design-specify`.
- The file is produced by `bin/chester-generate-agents`, not hand-edited.

**Given:** the new skills exist with descriptions.
**When:** the catalog is regenerated.
**Then:** the index reflects the three skills and drops `design-specify`.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — no hardening regression

**Observable boundary:**
- `spec-harden`'s three passes, run against a spec containing a known HIGH-class defect, catch it.
- Existing `tests/test-*.sh` referencing `design-specify` are updated and pass against the new skills.

**Given:** a representative spec with a planted HIGH defect.
**When:** `spec-harden` runs.
**Then:** the defect is caught, matching current `design-specify` behavior.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-06-12T12:43:08Z -->
<!-- produced-by design-specify@v0004 -->
