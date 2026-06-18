# Researcher Findings — round02

**Sprint:** 20260617-01-codify-committee-design
**Date:** 2026-06-17
**Question:** Enumerate every Chester file that must change to align with (1) committee emitting an Option-2 complete-design document and (2) committee transitioning to the specify phase — AND judge one sprint vs two.

---

## Settings Files — Process Description vs Pure Config

**DECISIVE finding: neither settings file carries process description. Both are pure config.**

- `/home/mike/Documents/CodeProjects/Chester/.claude/settings.chester.local.json` — `{"working_dir": "docs/chester/working", "plans_dir": "docs/chester/plans"}`. Pure directory config. No process description. Not in change set.
- `/home/mike/.claude/settings.chester.json` — `{"budget_guard": {"threshold_percent": 85, "enabled": true}}`. Pure budget config. No process description. Not in change set.

---

## CLAUDE.md Files — Survey

Enumerated via `find -iname CLAUDE.md` (excluding `.worktrees/`):

| File | Contains committee/pipeline refs? | In change set? |
|------|-----------------------------------|----------------|
| `/home/mike/Documents/CodeProjects/Chester/CLAUDE.md` | No — no committee, verdict, D9, or FAC refs | No |
| `/home/mike/Documents/CodeProjects/Chester/docs/CLAUDE.md` | No | No |
| `/home/mike/Documents/CodeProjects/Chester/docs/chester/CLAUDE.md` | No | No |
| `/home/mike/Documents/CodeProjects/Chester/docs/admin/CLAUDE.md` | No | No |
| `/home/mike/Documents/CodeProjects/Chester/agents/CLAUDE.md` | Only structural example, no stale process content | No |
| `/home/mike/Documents/CodeProjects/Chester/skills/CLAUDE.md` | No committee/pipeline refs | No |
| `/home/mike/Documents/CodeProjects/Chester/tests/CLAUDE.md` | Not examined — tests don't reference pipeline | No |
| `/home/mike/Documents/CodeProjects/Chester/docs/chester/plans/20260430-02-rebuild-design-derivation/CLAUDE.md` | Archived sprint — immutable record | No |
| `/home/mike/Documents/CodeProjects/Chester/docs/chester/plans/20260511-01-mp-redesign-proof-system/CLAUDE.md` | Archived sprint — immutable record | No |
| `/home/mike/Documents/CodeProjects/Chester/docs/feature-definition/CLAUDE.md` | Not examined — no pipeline refs likely | No |

**DECISIVE:** No CLAUDE.md file needs to change. All stale content lives in skill files and references.

---

## FILE LIST — What Must Change

### GROUP A: Committee-internal files (emit a design document, not a verdict packet)

These files describe the committee as emitting a "decision-packet" and/or "verdict-only" artifact. With the Option-2 design document replacing the current artifact-template, these all become stale.

---

**A1. `skills/design-committee/references/artifact-template.md`** — DECISIVE

Current: five-section verdict-packet (Summary / Verdict / Rationale / Dissent Record / Deferred-Open). This is the template the scribe uses. Round01 verdict replaces this with an Option-2 template mirroring 8 FAC fields as labeled sub-fields within the committee-native structure.

**What must change:** Replace entirely with the new Option-2 complete-design template. This is the primary deliverable of the "document shape" change.

---

**A2. `skills/design-committee/SKILL.md`** — DECISIVE (two independent staleness points)

Line 150:
> "dispatched once per round after convergence to author the round's designer-facing **decision-packet** from the verdict"

Line 228:
> "**Transitions to:** none — committee = standalone consultation. Designer routes downstream work."

**What must change:**
- Line 150: Change "decision-packet" to "complete-design document" (or equivalent language reflecting the new artifact type).
- Line 228: Change "Transitions to: none" to "Transitions to: `spec-write` (via the specify path: `spec-write` → `spec-harden` → `plan-build`)" — mirroring how `design-small-task` declares its transition. Version bump required (behavior change).

---

**A3. `skills/design-committee/references/team-lead.md`** — DECISIVE (multiple staleness points)

Line 102 (Per-Round Flow step 6):
> "The scribe authors the round's **decision-packet artifact** — including its `Dissent Record`"

Lines 155–160 (Output Surfaces):
> "**Decision-communication packet** — the surface the team-lead uses *only when seeking a designer decision*. Its format is **locked and unchanged**: the four-block Information Packet Format..."
> "**End-of-turn session artifact** — what the round leaves behind as its answer. It has **no mandated format**"

The second surface ("end-of-turn session artifact") is what becomes the complete-design document. Currently it has "no mandated format" — after the change, it has the Option-2 template format. The first surface (decision-communication packet) remains locked and unchanged.

Line 138 (Closure step 1):
> "verify that round's transcripts, consolidator-output.md, alignment-map.md, verdict.md, and the scribe's **decision-packet artifact** reflect the final state"

**What must change:**
- Step 6 (line 102): Update "decision-packet artifact" to the new artifact type name.
- Output Surfaces section (lines 155–160): Update the "end-of-turn session artifact" description to name the Option-2 complete-design template as its format; clarify it is no longer format-free.
- Closure step 1 (line 138): Update "decision-packet artifact" reference.
- Version bump required (behavior change).

---

**A4. `skills/design-committee/references/committee-analysis-round-format.md`** — DECISIVE (multiple staleness points)

Lines 39–43 (Folder Shape description):
> "Scribe decision-packet (the designer-facing artifact) — authored by the scribe from the verdict, alignment map, and Consolidator output, following `references/artifact-template.md` (which owns the artifact's section structure, including the mandatory `## Dissent Record`). The Translation Gate **APPLIES** here (designer-facing: option-naming rule, read-aloud, no code vocab/paths/type names)."

Line 58 (Folder Shape tree):
> `└── <decision-packet>.md         # scribe: designer-facing artifact, per references/artifact-template.md`

Lines 84–85 (How To Use step 5):
> "The scribe authors the designer-facing decision-packet from the verdict, alignment map, and Consolidator output, following `references/artifact-template.md`."

Lines 220–226 (Template section):
> "The scribe authors the round's designer-facing artifact from `verdict.md`, `alignment-map.md`, and `consolidator-output.md`, following `references/artifact-template.md` — which owns the artifact's section structure (Summary, Verdict, Rationale, the mandatory `## Dissent Record`, Deferred / Open)."

Also the file's own frontmatter `description` references "scribe's designer-facing decision-packet artifact."

**What must change:**
- All "decision-packet" references in the round-folder format to use the new artifact type name (complete-design document).
- Section structure enumeration (Summary, Verdict, Rationale, Dissent Record, Deferred / Open) must update to reflect Option-2 structure.
- Folder tree filename placeholder `<decision-packet>.md` → update name convention.
- Version bump required.

---

**A5. `agents/design-committee-scribe.md`**

Line 1 (frontmatter description):
> "Writes the draft artifact to disk; returns a file pointer only."

Lines 13–16 (body):
> "Job: author the committee's artifact (spec, plan, or analysis) from the converged verdict and the member-position record."

Line 19 (`verdict.md` input):
> "Primary source; write from it, do not expand it."

The scribe's hard prohibition "No design opinion. Write what the verdict says; do not embellish, soften, or expand its direction." is LOAD-BEARING and must survive. However, the artifact type it authors changes. The scribe's bounded inputs remain unchanged (per round01 verdict: "Scribe bounded inputs unchanged").

**What must change:**
- Description and body: "committee's artifact (spec, plan, or analysis)" → "committee's complete-design document" or equivalent. The scribe still works from the same inputs; the template shape changes.
- The instruction to "write from it, do not expand it" (re: verdict.md) must remain — the scribe populates the Option-2 fields from what the verdict contains, which means the verdict must itself be authored to contain those fields. This is a constraint on the team-lead, not the scribe. But the scribe agent description should reflect the new artifact type.
- Version bump: behavior changes (different template shape).

---

### GROUP B: spec-write and FAC contract (extraction model being reversed)

**B1. `skills/spec-write/references/fac-complete-design-contract.md`** — DECISIVE

Line 5:
> "`spec-write` does not require producers to emit a new typed artifact. It **extracts** the eight fields below from the producer's native output."

Line 22:
> "Silent mis-extraction from a narrative committee verdict is the one failure hardening structurally cannot catch (it verifies the spec against itself, not against design intent) — the quote-back is the only guard."

Lines 24–26 (D9 text):
> "## Why extraction, not a typed bundle
> Producers emit no new artifact. A typed FAC-bundle (committee scribe writes a structured bundle) was rejected as primary — it adds a committee output mode and re-introduces artifact bifurcation — and is retained only as a documented fallback if extraction-with-quote-back proves unreliable (D9)."

Table column header (line 9): "Committee verdict source" column maps fields to "verdict's [field]".

**What must change:**
- Line 5: Update extraction framing — committee path now emits a typed document with labeled sub-fields; `spec-write` reads from those fields directly rather than mining a narrative verdict.
- Line 22: Remove/update the "silent mis-extraction from a narrative committee verdict" risk line — this risk is what the Option-2 document eliminates. The quote-back step may survive in a weakened form (reading a labeled field is less error-prone than mining prose) or may be rationalized as simpler field-read.
- Lines 24–26: D9 must be reversed. The "typed FAC-bundle rejected as primary" rationale is now void — it was adopted. Replace with D9-reversal statement explaining why the committee was elevated to producing a structured document.
- Table (lines 9–18): "Committee verdict source" column should now name the Option-2 field labels rather than "verdict's [narrative field]" descriptions. This is a precision update.
- Version bump: contract changes materially.

---

**B2. `skills/spec-write/SKILL.md`** — DECISIVE

Line 3 (description frontmatter):
> "Extracts the eight-field FAC-complete-design contract, quotes back the chosen-architecture field for confirmation"

Line 16:
> "a `design-committee` verdict (FAC-complete by deliberation), or"

Line 25:
> "**Read the FAC-complete design** — extract the eight fields per `references/fac-complete-design-contract.md` from the producer's **native output** (committee verdict or spec-architect output)."

Line 26:
> "**Quote back the architecture** — read the chosen-architecture field and quote it back to the user for confirmation before authoring any spec section. This is mandatory; it is the only guard against silent architecture mis-extraction"

Line 51:
> "**Invoked by:** `spec-architect` (small-task path), the `design-committee` path (committee verdict), or user directly"

**What must change:**
- Line 3 (description): "Extracts the eight-field FAC-complete-design contract" — the committee path no longer requires extraction from a narrative; the fields are now labeled. Update to reflect that `spec-write` reads the Option-2 design document's labeled fields for the committee path. If the description changes, `skill-index.md` must be regenerated. **Catalog-freshness trigger.**
- Lines 25–26: The "extract from native output" language and the "only guard against silent mis-extraction" rationale become partially obsolete for the committee path. The quote-back step may survive but its rationale changes.
- Line 51: "the `design-committee` path (committee verdict)" → now "the `design-committee` path (committee complete-design document)".
- Version bump: behavior change (different reading mode for committee path).

---

### GROUP C: Pipeline/transition description (committee→specify path)

**C1. `skills/spec-architect/SKILL.md`** — stale implication

Line 3 (description):
> "Invoked only on the small-task path; the committee path skips it."

Line 20:
> "Invoked **only** by the FAC-incomplete entry path. The committee path produces a FAC-complete design and goes straight to `spec-write` — `spec-architect` is never on that path."

Line 137:
> "or get invoked on the committee path (committee output is already FAC-complete)"

These statements remain **accurate** — `spec-architect` still does not apply to the committee path, since the committee now produces an even more complete document (Option-2). The committee's new document still goes straight to `spec-write`. These statements do not need to change.

**What must change:** Nothing substantive. The word "verdict" in line 137's context ("committee output is already FAC-complete") may be updated to "complete-design document" for precision, but it is not stale in the sense of being wrong.

---

**C2. `skills/design-committee/SKILL.md` line 228** — already covered in A2.

---

**C3. `skills/spec-harden/SKILL.md`** — minor

Line 23:
> "The fidelity pass needs the originating design (committee verdict or brief) for goals coverage"

**What must change:** "committee verdict" → "committee complete-design document". Minor terminology update; no behavior change, but stale terminology.

---

### GROUP D: Skill-index catalog (generated, must be regenerated)

**D1. `skills/setup-start/references/skill-index.md`** — GENERATED file; do not hand-edit

Lines 22–22 (design-committee entry):
> "design-committee" description: the description frontmatter from `skills/design-committee/SKILL.md`. If that description is updated to reflect emitting a complete-design document (or transitioning to spec-write), the catalog must be regenerated.

Lines 38 (spec-write entry):
> "spec-write" description: if `spec-write/SKILL.md` description changes (see B2), catalog must be regenerated.

**What must change:** After any description edits in A2 or B2, run `bin/chester-generate-agents` and stage the regenerated `skill-index.md` in the same commit. This is a mechanical step, not a separate change.

**Catalog-freshness triggers identified:**
- `skills/design-committee/SKILL.md` description likely changes (A2).
- `skills/spec-write/SKILL.md` description likely changes (B2).

---

### GROUP E: Feature-definition brief (stale pre-round01 artifact)

**E1. `docs/feature-definition/Pending/design-committee-answer-delivery-extension-00.md`** — stale

This pending feature brief describes the old reality (verdict-packet only, no session-artifact owner). Key stale lines:

- Line 39: "artifact-template.md — the Scribe's artifact structure (Summary / Verdict / Rationale / Dissent Record / Deferred-Open). This is the decision-packet template; it has no session-artifact counterpart. Byte-unchanged (deferred)."
- Line 43: "agents/design-committee-scribe.md — ephemeral per-round dispatch; authors the designer-facing decision-packet from the verdict, alignment-map, and consolidator-output, following artifact-template.md. Knows only the decision-packet surface."
- Line 78: Describes a future "new sub-block within the locked Decision Package... plus the matching field in artifact-template.md".

**What must change:** This brief described work that has now been superseded or partially overtaken by the Option-2 design document decision. It should be reviewed post-sprint to determine whether any of its deferred threads are now moot, merged, or still pending. It is not a runtime-read file (feature-definition briefs are not loaded by skills), so it does not break correctness. However, it is institutionally stale.

**Judgment:** This is a record-keeping cleanup item, not a correctness blocker. It should be updated or moved to a Superseded status alongside the sprint work, but it does not need to block implementation.

---

## Complete Change Set Summary

| File | Change type | Decisive? | Sprint group |
|------|-------------|-----------|--------------|
| `skills/design-committee/references/artifact-template.md` | Replace entirely with Option-2 template | YES | A: document shape |
| `skills/design-committee/SKILL.md` | "decision-packet" → design-doc; add Transitions-to; version bump | YES | A + C: shape + transition |
| `skills/design-committee/references/team-lead.md` | Update step 6, Output Surfaces, Closure step 1; version bump | YES | A: document shape |
| `skills/design-committee/references/committee-analysis-round-format.md` | Update all "decision-packet" refs, section structure; version bump | YES | A: document shape |
| `agents/design-committee-scribe.md` | Update artifact type name; version bump | YES | A: document shape |
| `skills/spec-write/references/fac-complete-design-contract.md` | Reverse D9; update extraction framing; update quote-back rationale; update table | YES | B: extraction model |
| `skills/spec-write/SKILL.md` | Update description + body; version bump; catalog regen trigger | YES | B + C: extraction + transition |
| `skills/spec-harden/SKILL.md` | "committee verdict" → "committee complete-design document" (minor) | No | C: terminology |
| `skills/setup-start/references/skill-index.md` | Regenerate via `bin/chester-generate-agents` after desc changes | YES (mechanical) | D: catalog |
| `docs/feature-definition/Pending/design-committee-answer-delivery-extension-00.md` | Review/update status (superseded/partial) | No | E: institutional record |

**Not in change set (confirmed clean):**
- All CLAUDE.md files (root, docs/, docs/chester/, agents/, skills/, tests/, archived plans)
- Both settings files (pure config, no process description)
- `skills/spec-architect/SKILL.md` (remains accurate; committee path still skips it)
- `skills/design-committee/references/skill-contract.md` (no stale process content)
- `skills/design-committee/references/member-protocol.md` (not examined in depth, but member protocols unchanged per round01 verdict)

---

## Sprint Decomposition — One or Two?

**Candidate seam from convening.md:**
- (i) Author new Option-2 template + scribe/contract wiring ("committee produces a document").
- (ii) Wire the committee→specify transition across skills + CLAUDE.md ("committee hands off to spec").

**Evidence-based analysis:**

The seam is **clean in theory but not in practice**. Here is why:

**Dependency direction:** The FAC-complete-design-contract.md (B1) reversal is a prerequisite for `spec-write/SKILL.md` (B2), and both are prerequisites for the committee→specify transition being coherent. You cannot wire `design-committee SKILL.md` to say "Transitions to: spec-write" (C group) until `spec-write` knows how to read the new committee document format (B group), and `spec-write` cannot be updated until the D9 reversal is stated (B1). The dependency chain runs A → B → C.

**Practical coupling:** The `spec-write` changes (B group) are small — they are mostly about updating language from "extract from narrative verdict" to "read labeled fields from design document." The commit risk is low. The artifact-template replacement (A1) is the largest single creative artifact to author. The `design-committee/SKILL.md` transition line (A2/C) and the `fac-complete-design-contract.md` D9 reversal (B1) are short edits. The scribe agent (A5) is a small update.

**One-sprint case:** All changes are in the `design-committee/` cluster, `spec-write/` references, and one line each in `spec-harden/`. No changes cross into `plan-build`, `execute-*`, or the finish skills. The entire surface is narrow. The catalog regen is mechanical. With a clear plan, this is coherently one sprint.

**Two-sprint case argument:** The Option-2 template must exist and be verified before wiring the downstream transition (otherwise you are wiring a transition to a thing that does not yet have a defined shape). Sprint 1 = author the template + update committee-internal files. Sprint 2 = update FAC contract + spec-write + catalog regen.

**DECISIVE fact for sprint decomposition:** The Option-2 template content (what the eight labeled sub-fields look like inside the committee-native structure) must be authored before the FAC-contract table can be updated with those field labels. This is a real sequencing dependency that creates an internal phase boundary within the implementation.

**However:** This is an authoring-then-referencing sequence, not a ship-then-test-then-proceed sequence. Both phases can live in one sprint branch as sequential tasks, with the template authored first and the contract updated second. There is no independent testing or user-gate between them that would benefit from a sprint boundary. The dependency is real but internal to the implementation plan.

**Researcher's factual finding:** The change set fits one sprint of narrow scope (8–10 files, most small edits). The template authoring is the creative peak; everything else is updating references and terminology. No CLAUDE.md edits required. No settings changes. Catalog regen is mechanical. No changes outside the committee + spec-write cluster.

---

## Final Position

```
position: no design opinion — research role holds no advocacy
rationale: >
  Two questions in scope. (a) Change-set completeness: the enumerated FILE LIST covers all stale
  files I can find via grep + read. No CLAUDE.md file carries stale content. The settings files
  are pure config. The feature-definition brief is institutionally stale but not a runtime-read
  correctness blocker. (b) One sprint or two: the dependency chain A → B → C is real but
  internal to implementation — no user gate or independent test between phases justifies a sprint
  seam. The change set is narrow (8–10 files, most small edits) and self-contained within the
  committee + spec-write cluster. Researcher finding is: one sprint is coherent and sufficient;
  two sprints are not wrong but add overhead without a meaningful independence benefit.
blocking_risk: "none — research role holds no advocacy position"
warrant:
  type: evidence
  source: "grep corpus over skills/ + agents/ + docs/ + settings files; file:line reads on 10+ files; dependency chain traced from artifact-template → scribe → team-lead → SKILL.md → fac-contract → spec-write"
```
