# Conservator Transcript — Round 02

**Member:** Conservator
**Round:** 02
**Question:** Enumerate every file needing change for Option-2 committee design document + committee→specify transition, and judge one sprint vs two.

---

## Lens

The Conservator checks that the enumerated surface is complete (no missed stale references) and bounded (no scope creep). It flags what is load-bearing vs cosmetic, defends the minimum viable staging that keeps the working pipeline alive between commits, and resists decomposing changes that would leave the system in an incoherent intermediate state.

---

## Full File Survey

I conducted my own grep and file survey in parallel with the researcher request. Evidence below.

### GROUP A — DECISIVE / Load-bearing (must change for correctness)

**1. `skills/spec-write/references/fac-complete-design-contract.md` — ENTIRE FILE**
- Line 5: "It **extracts** the eight fields below from the producer's native output." — The extraction framing is now wrong. The committee produces labeled sub-fields. Spec-write reads them directly, not extracts from narrative.
- Line 22: "Silent mis-extraction from a narrative committee verdict…" — This is the risk the new design eliminates. The sentence and the quote-back guard it anchors need to be reframed: the guard remains (confirmation of chosen architecture), but its motivation changes from "only guard against silent mis-extraction" to "architecture confirmation before spec authoring."
- Lines 24-26: "Why extraction, not a typed bundle" section + D9 text — D9 is explicitly reversed. This section must be rewritten to state the new reality: committee emits an Option-2 document with labeled sub-fields satisfying the eight FAC fields; extraction language replaced with field-reading language.
- **Impact:** spec-write's entry condition description, step 1 checklist, and the quote-back rationale in the contract all need updating. This is the contract-level change — everything downstream reads this.

**2. `skills/spec-write/SKILL.md`**
- Line 3 (description): "…by a design-committee verdict or a spec-architect output. Extracts the eight-field FAC-complete-design contract…" — "committee verdict" must become "committee design document"; "Extracts" must become something like "Reads the eight FAC fields from."
- Line 16: "a `design-committee` verdict (FAC-complete by deliberation)" — must become "a `design-committee` design document (FAC-complete by deliberation)."
- Line 25: "extract the eight fields per `references/fac-complete-design-contract.md` from the producer's native output (committee verdict or spec-architect output)" — same; remove "committee verdict," name the committee's output correctly.
- Line 26: "silent architecture mis-extraction" — motivation changes per contract rewrite.
- Line 51: "Invoked by: `spec-architect` (small-task path), the `design-committee` path (committee verdict)" — rename.
- **Catalog impact:** description changes → must regen `skills/setup-start/references/skill-index.md`. Version bump required.

**3. `skills/design-committee/references/artifact-template.md` — REPLACEMENT**
- This is the template being replaced by the Option-2 complete-design template. The new template must carry the committee-native section structure (Verdict / Rationale / Dissent Record / Deferred) with labeled sub-fields satisfying the eight FAC fields as content, not section headers. The mandatory Dissent Record stays.
- The old template's section headers (Summary / Verdict / Rationale / Dissent Record / Deferred) map partly to the new shape — the rename or addition of sub-field labels is the key change.
- **This is the highest-impact file:** everything the scribe produces flows from this template.

**4. `agents/design-committee-scribe.md`**
- Line 3 (description): "Writes the draft artifact to disk; returns a file pointer only." — description is accurate but the job description in the body calls the output a "committee artifact (spec, plan, or analysis)" and references `## Dissent Record` — the scope description of what the artifact IS needs to reflect that it is now a complete design document, not only a decision packet.
- Line 8: "author the committee's artifact (spec, plan, or analysis)" — this framing is now stale. The artifact is a complete design document (with committee-native structure + eight FAC sub-fields). The parenthetical should be updated.
- No version bump needed if only description changes cosmetically; BUT if the scribe's behavior or contract changes, version bump applies.

**5. `skills/design-committee/SKILL.md`**
- Line 150: "dispatched once per round after convergence to author the round's designer-facing **decision-packet** from the verdict…" — "decision-packet" must become "design document" or "complete design document."
- Line 228: "**Transitions to:** none — committee = standalone consultation." — This is the transition statement the convening packet explicitly calls out. With the new committee→specify transition, this must be updated to reflect that the designer may invoke `spec-write` next (or that the committee transitions to the specify phase). The language must be precise: the committee itself is still standalone-invocable, but its defined downstream is now the specify phase. Suggest: "**Transitions to:** `spec-write` (designer-directed; committee output is a FAC-complete design document — invoke `spec-write` to author the spec)" — following `design-small-task`'s pattern.
- Line 226 (Integration → Reads): `references/artifact-template.md` is listed — fine, that stays as a read reference; the content of the template changes but the Integration line stays accurate.
- **Catalog impact:** description frontmatter (line 3) does not carry "verdict" or "decision-packet" language currently, so may not need a description edit (and thus no catalog regen forced by this file alone). BUT behavior changes → version bump required regardless.

**6. `skills/design-committee/references/team-lead.md`**
- Line 6: "format (decision packet + exemplar + gates)" — "decision packet" must become "design document" or "complete design document."
- Line 87: "the scribe's decision-packet artifact" — stale; "design document."
- Line 102: "The scribe authors the round's decision-packet artifact" — stale.
- Line 138: "the scribe's decision-packet artifact" — stale (appears in Closure section).
- Line 139: stamping provenance — "round's scribe decision-packet artifact" → stale.
- Line 305: "nothing raw…reaches the designer through…the decision packet" — "design document."
- Line 331: "Switch from caveman ultra to packet voice…for designer-facing decision packet only" — "design document."
- Multiple occurrences of "decision-packet" throughout; all stale. Version bump required.

**7. `skills/design-committee/references/committee-analysis-round-format.md`**
- Line 9 (description): "the scribe's designer-facing decision-packet artifact" — stale.
- Line 39-40: "Scribe decision-packet (the designer-facing artifact) — authored by the scribe…" — stale.
- Line 58: "`<decision-packet>.md` # scribe: designer-facing artifact" — stale filename convention in folder-shape diagram.
- Line 70: "the scribe decision-packet is the round's designer-facing artifact" — stale.
- Line 84-85: "The scribe authors the designer-facing decision-packet from the verdict…" — stale.
- Line 100-101: Translation Gate boundary references "decision-packet" — stale.
- Line 107: "committee's output-surface split: the scribe's designer-facing decision-packet" — stale.
- Multiple occurrences; all stale. Version bump required.

**8. `skills/design-committee/references/skill-contract.md`**
- Line 40: "phase contract: …decision-packet output expected" — member agents' declared phase contract says "decision-packet output expected." This is in the member phase-contract description. If the output is now a complete design document, this line must update.
- Line 25: "Output-format field labels" in Three Forbidden Attach Surfaces — the field labels themselves are changing (adding sub-fields); this is a skill-author change, not a forbidden-surface violation. No issue, but the doc should reflect that the template now has sub-fields.

**9. `skills/setup-start/references/skill-index.md` — GENERATED FILE**
- Lines 36, 38: skill-index carries stale description text from `spec-write` and `spec-architect` descriptions (both reference "committee verdict" language that will change when spec-write's description changes). This file is regenerated by `bin/chester-generate-agents` after description edits — it is not hand-edited. Flag: regen is mandatory after any description change in this change set.

### GROUP B — STALE but cosmetic (correct but now misleading framing)

**10. `skills/spec-architect/SKILL.md`**
- Line 3 (description): "the committee path skips it" — still true, no change needed.
- Line 20: "The committee path produces a FAC-complete design and goes straight to `spec-write`" — still true, but "goes straight to spec-write" now has a defined path rather than being implicit. Cosmetically accurate. Minor update opportunity: "committee design document goes to spec-write" — but not wrong as-is.
- Line 137: "committee output is already FAC-complete" — accurate, no change needed.
- **Verdict: no required change; optional clarity improvement.**

**11. `agents/design-committee-conservator.md`, `innovator.md`, `pragmatist.md`, `purist.md`**
- Line 47 in each: "No consolidating, no writing decision packet, no adjudicating." — "decision packet" is a negative prohibition (what members must NOT do). The prohibition's intent stays valid; only the terminology is cosmetically stale. These could be updated to "no writing design document" but the functional meaning is unchanged.
- **Verdict: cosmetic; flag but not blocking.**

**12. `agents/design-committee-researcher.md`**
- Line 31: "No consolidating decision packet, no adjudicating." — same cosmetic issue as member files.
- **Verdict: cosmetic.**

### GROUP C — No change needed

**Settings files (`.claude/settings.chester.local.json`, `.claude/settings.json`):** pure directory/style config — `working_dir` and `plans_dir` only. No process description. Confirmed absence.

**Root `CLAUDE.md`, `docs/CLAUDE.md`, `docs/chester/CLAUDE.md`:** no references to committee output type, verdict-only framing, FAC extraction, or transition pipeline. Confirmed absence via grep.

**`skills/CLAUDE.md`, `agents/CLAUDE.md`:** structural/naming docs only; no process description of committee output type. No change needed.

**`skills/design-small-task/SKILL.md`:** its own transitions are unaffected. The committee path mirrors it now, but design-small-task itself doesn't reference committee output.

**`skills/plan-build/SKILL.md`, `skills/spec-harden/SKILL.md`:** invoked downstream; they consume spec output, not committee output directly. No stale references to committee output type found. No change needed.

---

## What the Researcher Should Confirm

If the researcher has done the full grep, I need them to confirm:
1. No additional CLAUDE.md files carry committee/verdict/FAC-extraction language beyond the ones I checked.
2. No per-skill `references/` files beyond the ones I found carry D9 or "decision-packet" language (the skill-contract.md is the only one I found outside the committee skill proper).
3. The scribe agent description — does it self-describe as producing a "decision packet"? Yes, line 3: "Writes the draft artifact to disk" — neutral. But the body says "spec, plan, or analysis" which is now stale (not "design document").

---

## Sprint Decomposition

**Position: two sprints with a clean dependency seam.**

The seam is: (i) committee emits a design document (template + scribe wiring + contract) vs (ii) committee→specify transition wired across skills.

**Why two, not one:**

The first sprint changes the artifact-template, the scribe agent, the FAC-complete-design contract, and the spec-write description — these are all in service of "the committee now produces a design document." That set is coherent and independently verifiable: after sprint 1, a committee run produces an Option-2 design document, and `spec-write` knows how to read it.

The second sprint updates the Transitions-to declarations in `design-committee/SKILL.md` and `team-lead.md`, mirrors how `design-small-task` declares its downstream path, and updates the skill-index entry for `design-committee` if its description changes. That set is about routing — telling the designer "after committee, invoke spec-write." It is independently verifiable: after sprint 2, the committee's Integration section correctly names spec-write as its downstream.

**Why not one:** If done in one sprint, the blast radius crosses three distinct concerns — template authoring, contract semantics, and skill routing. A mid-sprint failure or partial implementation would leave spec-write's contract updated but the committee's transition undeclared (or vice versa), creating a half-wired state. Two sprints guarantees each unit is coherent and shippable on its own. Sprint 1 ships first because the scribe can't produce the right artifact until the template exists; sprint 2 can't meaningfully declare the transition until the output it's transitioning from is defined.

**Dependency direction:** Sprint 1 → Sprint 2. Sprint 2 references the artifact shape that Sprint 1 establishes.

**Conservator caveat:** If the team judges the blast radius of sprint 1 small enough to combine, the only safe merge point is: template + scribe + contract + spec-write description (the four load-bearing files) updated atomically in one commit, then the transition wiring + cosmetic "decision-packet" renames added in a second commit within the same sprint. Never ship a state where the contract says "reads labeled sub-fields" but the template doesn't have them yet.

---

## Final Position

**position:** The alignment surface has nine decisive files (Groups A above) and four cosmetic files (Group B). Settings files and CLAUDE.md files are clean — confirmed absence. Two sprints: sprint 1 = template + scribe + FAC contract + spec-write (the "committee produces a document" atom); sprint 2 = Transitions-to wiring + team-lead.md "decision-packet" renames + skill-index regen (the "committee hands off to spec" atom). Seam is clean; dependency flows sprint 1 → sprint 2.

**rationale:** Sprint 1 establishes what the committee emits; sprint 2 declares where that emission goes. Neither sprint leaves the system in an incoherent intermediate state: after sprint 1, a committee run produces a correct artifact and spec-write reads it correctly; after sprint 2, the pipeline routing is formally declared. Combining them in one sprint is possible but raises coordination risk — if spec-write's description must change (catalog regen) and the artifact-template must change and the transition declaration must change, a mid-sprint failure leaves more to unwind.

**blocking_risk:** None. Conservator does not block. Risk to flag: the "decision-packet" language in the four member agent files (Group B) is cosmetically stale. If left unaddressed, the member files will say "no writing decision packet" when the committee's own output is no longer called that. Low-urgency but adds vocabulary drift if the member files are read for terminology.

**warrant:** {type: evidence, source: grep survey of skills/, agents/, .claude/settings files, and CLAUDE.md tree; specific file:line evidence cited above for each Group A file}
