# Purist Transcript — Round 02

**Member:** Purist
**Round:** 02
**Question:** Enumerate every skill/settings/CLAUDE.md file needing change for the new committee process (Option-2 complete-design doc + committee→specify transition); judge one refactor sprint or two.

---

## Lens

The Purist tests category boundaries and compositional integrity. Here: two sub-questions. First, is the enumerated surface truly complete — are there structurally necessary changes that others will overlook? Second, is "produce a document" vs "wire the transition" a clean conceptual seam or an entangled dependency?

---

## Survey Method

Read every file cited in the convening packet. Ran grep across `skills/` and `agents/` for: `verdict`, `decision.packet`, `extract`, `D9`, `FAC-complete`, `Transitions to`, `artifact-template`. Enumerated all `CLAUDE.md` files via find. Inspected `.claude/settings.chester.local.json` and `~/.claude/settings.chester.json`.

---

## Complete Alignment Surface

### Group A — Terminology inside the committee skill (all carry "decision packet" language that becomes wrong)

**DECISIVE** `skills/design-committee/SKILL.md` line 150
: "designer-facing decision-packet from the verdict, alignment map, and consolidator output" — the scribe section. Must become "design document."
: Also line 228: `Transitions to: none — committee = standalone consultation` — needs the new transition statement.
: Version bump required (behavior change). Description field does NOT change, so no catalog regen from this file alone.

**DECISIVE** `skills/design-committee/references/committee-analysis-round-format.md`
: Lines 8, 39-41, 57-58, 70, 85, 101, 107, 220, 223: "decision-packet artifact" used throughout as the name for the scribe's output. Every occurrence becomes "design document." The file comment on line 107 ("output-surface split: the scribe's designer-facing decision-packet has a locked...") needs updating.
: Line 58 directory tree comment: `<decision-packet>.md` → `<design-document>.md` (or similar).
: This is a references file, not a SKILL.md with version frontmatter — check if it carries its own version; if not, the parent skill version bump covers it.

**DECISIVE** `skills/design-committee/references/team-lead.md`
: Lines 6, 38, 87, 102, 138, 139, 331, 338 — "decision packet" used as the name for the designer-facing artifact throughout. Every occurrence must change.
: Line 102 is the Author step: "The scribe authors the round's decision-packet artifact" — must become "design document."
: Line 38: "designer-facing decision packets" in overlay section — must change.
: Line 331 in caveman/packet distinction: "Switch from caveman ultra to packet voice...for designer-facing decision packet only" — "decision packet" → "design document" (or retain "packet voice" as the delivery-voice name; this distinction is subtle and the Purist calls it out below under Hidden Risk).

`skills/design-committee/references/artifact-template.md`
: Line 3 scope comment: "the scribe uses when drafting committee artifacts (specs, plans, or analysis documents)" — must state "complete design document."
: The entire template body is being REPLACED by the Option-2 template. This is the primary artifact of the sprint. All current sections (Summary / Verdict / Rationale / Dissent Record / Deferred) remain but gain labeled sub-fields per the FAC content requirements.

### Group B — FAC contract and spec-write consumer (extraction language that becomes wrong)

**DECISIVE** `skills/spec-write/references/fac-complete-design-contract.md` — entire file needs rewriting.
: Line 3: "It has two interchangeable producers — a `design-committee` verdict and a `spec-architect` output" — the committee producer is no longer a verdict, it is a structured design document.
: Line 5: "`spec-write` does not require producers to emit a new typed artifact. It **extracts** the eight fields below from the producer's native output." — D9 is reversed; this sentence is now false. The committee DOES emit a new typed artifact (the Option-2 design document).
: Lines 9-18 table: "Committee verdict source" column — all cells reference "verdict's X" (verdict's problem statement, verdict's chosen direction, etc.). These must become "design document's X" referencing the new labeled sub-fields.
: Lines 22-26: "Silent mis-extraction from a narrative committee verdict is the one failure..." and D9 text — D9 is reversed; this rationale and the fallback language must be rewritten. The new document-based path eliminates the extraction failure mode.
: Version bump: this is a references file; parent `spec-write` SKILL.md version bump covers it.

**DECISIVE** `skills/spec-write/SKILL.md`
: Line 3 (description): "by a design-committee verdict or a spec-architect output. Extracts the eight-field FAC-complete-design contract" — "verdict" → "design document"; "extracts...from native output" needs updating since the committee now provides structured fields.
: Line 16: "a `design-committee` verdict (FAC-complete by deliberation)" — "verdict" → "design document."
: Line 25: "extract the eight fields per `references/fac-complete-design-contract.md` from the producer's native output (committee verdict or spec-architect output)" — update both "verdict" and the extraction framing.
: Description field changes → **catalog regen required** (`bin/chester-generate-agents` + stage `skills/setup-start/references/skill-index.md`).
: Version bump required.

`skills/setup-start/references/skill-index.md` line 38 (spec-write entry)
: "by a design-committee verdict or a spec-architect output. Extracts the eight-field FAC-complete-design contract" — same stale language. However, this is a GENERATED file — do NOT hand-edit; fix the spec-write description and run `bin/chester-generate-agents`.

### Group C — Scribe agent (bounded inputs must now populate structured template fields)

**DECISIVE** `agents/design-committee-scribe.md`
: Line 3 (description): "Receives verdict.md, the artifact-template path, and consolidator-output.md at dispatch" — accurate as far as it goes; the inputs are unchanged (verdict.md + consolidator-output.md + alignment-map.md). But the description's framing still implies verdict → prose artifact. No description field change strictly required if inputs are unchanged — BUT the body needs updating.
: Line 19: "verdict.md — the team-lead's specific, one-sentence-minimum decision. Primary source; write from it, do not expand it." — With the new Option-2 template, the scribe must populate labeled sub-fields, not just write prose from the verdict. The "do not expand it" instruction conflicts with the new requirement that the scribe populate structured FAC sub-fields from the full set of inputs (verdict + consolidator + alignment-map). Needs careful rework.
: Line 29: "Write what the verdict says; do not embellish, soften, or expand its direction." — same tension. The new design document has more structure than the verdict alone. The scribe must populate fields from all three inputs.
: No description change → no catalog regen from this file. But this is a behavioral change that requires version bump if this file has version frontmatter (check: it does not appear to have `version:` in frontmatter — confirm at implementation).

### Group D — spec-harden (minor but real)

`skills/spec-harden/SKILL.md` line 23
: "The fidelity pass needs the originating design (committee verdict or brief)" — "committee verdict" → "committee design document" or "committee complete-design document."
: Version bump only if this is considered a behavior change (it is not — the fidelity pass behavior is unchanged; this is a terminology correction). The CLAUDE.md root convention says "not on typo fixes or comment-only edits." This falls between: it is a terminology update tracking a real change in what the upstream artifact is called. Bump to be safe.

### Group E — Transition statement (others will likely miss the category nuance here)

**DECISIVE** `skills/design-committee/SKILL.md` line 228: `Transitions to: none — committee = standalone consultation.`
: This MUST change. The committee now has a defined downstream path: spec-write → spec-harden → plan-build, mirroring how design-small-task transitions to spec-architect.
: BUT — and this is the Purist's category call — "Transitions to" for the committee is NOT the same kind of statement as "Transitions to" for design-small-task. The committee is process-agnostic; it does not initiate the spec phase. The designer routes downstream. So the new statement should NOT be "Transitions to: spec-write" (implying the committee invokes spec-write, which it does not). It should be something like: "Transitions to: spec-write (designer-initiated, using the committee's design document as FAC-complete design input)." This is a subtle category integrity point: standing up the transition statement must not silently convert the committee from process-agnostic to pipeline-stage.

### Group F — Settings and CLAUDE.md files

**All settings files are purely directory/style config. No process description found.** Confirmed findings:
- `.claude/settings.chester.local.json`: `{"working_dir": ..., "plans_dir": ...}` — no process text.
- `.claude/settings.local.json`: permissions + outputStyle only.
- `~/.claude/settings.chester.json`: budget_guard only.
- No process description in any settings file. **Absence confirmed — no action required.**

**CLAUDE.md files:** No process-description changes required. Root `CLAUDE.md` contains no committee output language. `docs/CLAUDE.md`, `docs/chester/CLAUDE.md`, `agents/CLAUDE.md`, `skills/CLAUDE.md` — none carry committee output or FAC-contract language. **Confirmed clean — no action required.**

---

## What Others May Miss: Purist Completeness Critique

### 1. The "packet voice" / "decision packet" terminology split in team-lead.md

Line 331 of `team-lead.md` establishes a *voice* distinction: "caveman ultra for internal messages" vs "packet voice for designer-facing decision packet." The term "packet voice" is named after "decision packet." If the artifact is renamed to "design document," the voice-switch instruction becomes awkward ("switch to packet voice for the design document"). Others will update the artifact name but leave "packet voice" untouched. The Purist flags this: either rename "packet voice" to "document voice" or clarify that "packet voice" is the voice style name, not the artifact name. Not updating this creates a semantic collision where "packet" appears in both the voice name and (implicitly) the old artifact name.

### 2. The committee-analysis-round-format.md directory tree on line 58

The tree diagram shows `<decision-packet>.md` as the filename pattern for the scribe's artifact. This is a concrete example filename. If left as-is after the artifact is renamed, every reader of this doc will learn the wrong filename pattern for the new artifact. This is easy to miss because it sits inside a code block.

### 3. The scribe agent's "do not expand" instruction conflicts with structured template population

The scribe's `agents/design-committee-scribe.md` line 29 says "do not embellish, soften, or expand its direction." This instruction makes sense for a verdict-driven prose artifact. With the Option-2 template, the scribe must populate multiple labeled sub-fields from THREE inputs (verdict.md + consolidator-output.md + alignment-map.md), not just transcribe the verdict. The "do not expand" instruction is a correctness hazard if left unchanged — a scribe following it literally might populate only the Verdict sub-field and leave the FAC content sub-fields empty. This conflict must be resolved in the scribe agent rewrite.

### 4. D9 reversal must be made explicit, not just implicit

The fac-complete-design-contract.md currently contains "D9" as a named decision with rationale. When rewriting this file, others may simply delete or reword the D9 paragraph without recording that D9 was explicitly reversed. A future reader of the contract won't know why there is no fallback. The Purist recommends: the new contract should carry a one-line note that D9 was reversed (its own text said it was provisional), not just write the new reality as if D9 never existed. This is a documentation integrity concern, not a runtime concern.

---

## Sprint Seam Analysis

The proposed seam: (i) author the new Option-2 template + scribe/contract wiring vs (ii) wire committee→specify transition across skills.

### The seam fails the clean-cut test

Group A (committee-internal: artifact-template + team-lead.md + committee-analysis-round-format.md + SKILL.md Scribe section) and Group B (cross-skill: fac-complete-design-contract.md + spec-write SKILL.md + spec-harden + Transitions to) are in a **client-server dependency**:

- Group A changes what the committee *produces* (a structured document with labeled FAC sub-fields).
- Group B changes how spec-write *describes reading* that output.

If Group A ships without Group B: spec-write's contract still says it "extracts from the producer's native output (committee verdict)" — but the committee no longer emits a narrative verdict as the primary artifact; it emits a structured document. The documentation is contradictory. A user following spec-write's instructions would look for extraction targets in a narrative verdict that no longer exists.

If Group B ships without Group A: spec-write describes reading structured FAC fields from a committee design document that the committee does not yet produce. Also contradictory.

The dependency is bidirectional for correctness: both groups must be true simultaneously or the documentation is wrong. There is no stable intermediate state.

### The real seam — task ordering within one sprint

What looks like a two-sprint seam is actually a **task-ordering dependency within a single sprint**:

1. Author the new Option-2 artifact-template (the template file itself).
2. Update the scribe agent contract to populate it correctly.
3. Update committee-analysis-round-format.md and team-lead.md terminology.
4. Update design-committee SKILL.md (Scribe section + Transitions to).
5. Rewrite fac-complete-design-contract.md (D9 reversal, new committee-column entries, extraction→document framing).
6. Update spec-write SKILL.md + description.
7. Regenerate skill-index.md (catalog sync).
8. Update spec-harden SKILL.md line 23.

Steps 1-4 are Group A (committee-internal). Steps 5-8 are Group B (consumer-side). The dependency runs A→B. Both must ship in the same commit (or at minimum the same PR) to avoid a contradictory window in main.

**Verdict: one sprint, two task clusters with explicit A→B ordering.**

---

## Final Position

**position:** (a) The alignment surface enumerated above is complete from the Purist lens. Three items that others will miss: the "packet voice" naming collision in team-lead.md line 331, the `<decision-packet>.md` filename in the committee-analysis-round-format.md directory tree (line 58), and the scribe agent's "do not expand" instruction conflicting with structured sub-field population. D9's explicit reversal must be named in the rewritten contract, not silently overwritten. (b) One sprint, not two. The proposed seam between "produce a document" and "wire the transition" is not a clean conceptual cut — Group A and Group B are in a client-server dependency with no stable intermediate state. The real structure is one sprint with two task clusters (A: committee-internal changes first; B: consumer-side contract changes second) with an explicit A→B ordering constraint.

**rationale:** The seam fails because spec-write's contract describes how it reads committee output — the moment the committee's output shape changes (Group A), spec-write's description of that shape is either right or wrong. There is no state where Group A is complete and Group B is "in progress" that leaves the documentation correct. Task ordering within one sprint preserves correctness throughout. The Purist flag on "packet voice" is a category integrity concern: voice-style names should not silently inherit artifact names that were renamed.

**blocking_risk:** If the sprint is split, the documentation will be in a contradictory state between merges. The "packet voice" naming collision in team-lead.md is a latent confusion source that will surface whenever a future team-lead reads the switching instruction. The scribe's "do not expand" instruction is a correctness risk if left unchanged — it will cause the scribe to under-populate the new structured template.

**warrant:** {type: evidence, source: `skills/spec-write/references/fac-complete-design-contract.md` lines 3-5, 22-26 (extraction-primary contract that must be reversed in same commit as artifact-template change); `skills/design-committee/references/team-lead.md` line 331 ("packet voice" naming); `skills/design-committee/references/committee-analysis-round-format.md` line 58 (decision-packet filename in directory tree); `agents/design-committee-scribe.md` line 29 ("do not expand" instruction conflicting with structured sub-field population)}
