# Innovator — Round 02 Transcript

**Role:** Innovator
**Question:** Enumerate every Chester file needing change for the Option-2 complete-design doc + committee→specify transition, and judge one sprint or two.

---

## Survey Findings — Alignment Surface

I surveyed the skills tree, agent files, and reference docs directly. The researcher had not filed findings at transcript-write time, so this is from primary codebase evidence.

### Group 1: Files whose framing is decisively wrong after round01

**DECISIVE — design-committee/references/artifact-template.md**
The entire template is now replaced. It describes a five-section verdict packet (Summary / Verdict / Rationale / Dissent Record / Deferred). The new Option-2 template carries the same committee-native structure but with labeled sub-fields satisfying the eight FAC fields as content. This is the authoring surface — not just stale text, the wrong shape entirely.

**DECISIVE — skills/spec-write/references/fac-complete-design-contract.md**
Every line is stale. The contract says "spec-write does not require producers to emit a new typed artifact. It extracts the eight fields from the producer's native output." That is exactly what round01 reversed. The "Why extraction, not a typed bundle" section contains D9 verbatim — now repealed. The column header "Committee verdict source" in the eight-field table will need renaming ("committee design document source" or similar). The self-admitted extraction reliability gap disappears as a concern. The whole document needs reauthoring to reflect that the committee now emits a typed document with labeled sub-fields, not a narrative to be mined. This is the contract `spec-write` reads at runtime — if it still says "extract from verdict prose," spec-write will follow stale instructions.

**DECISIVE — skills/spec-write/SKILL.md (description + body)**
Description (line 3) says: "by a design-committee verdict or a spec-architect output. Extracts the eight-field FAC-complete-design contract." Both phrases are wrong. The body (lines 15-16) says "a `design-committee` verdict (FAC-complete by deliberation)" — wrong framing. Line 25 says "extract the eight fields per `references/fac-complete-design-contract.md` from the producer's native output (committee verdict or spec-architect output)" — the extraction step changes to a structured read. Line 26's quote-back rationale ("only guard against silent architecture mis-extraction") loses its urgency when the design document has explicit labeled fields; the quote-back still makes sense as a user-confirmation step but the framing changes. Description edit forces catalog regen.

**DECISIVE — skills/design-committee/SKILL.md**
Line 150: "author the round's designer-facing decision-packet from the verdict" — "decision-packet" becomes "design document." Line 228: "Transitions to: none — committee = standalone consultation." This is the transition statement the round02 question specifically flags. After the new transition, the committee has a defined downstream path: `spec-write` → `spec-harden` → `plan-build`. The Integration section needs updating to name the transition.

**DECISIVE — skills/design-committee/references/committee-analysis-round-format.md**
Line 39: "Scribe decision-packet (the designer-facing artifact)" — this is a NAMED ARTIFACT TYPE and a named folder placeholder (`<decision-packet>.md` on line 58). This is not just prose — it's a naming convention for files on disk. Renaming the artifact type here renames the file convention used in every committee round folder going forward. This is load-bearing: the scribe currently names its output file after this convention, and the team-lead references it by that name at teardown and stamp steps. The document needs consistent replacement of "decision-packet" with "design document" throughout, and the folder shape schema needs the filename placeholder updated.

**DECISIVE — skills/design-committee/references/team-lead.md**
Line 6: "format (decision packet + exemplar + gates)". Line 38: "designer-facing decision packets." Line 87: "the scribe's decision-packet artifact." Line 101/102: "scribe decision-packet artifact." Line 102: "decision-packet artifact." Line 139: "scribe's decision-packet artifact." Line 331: "Switch from caveman ultra to packet voice ... for designer-facing decision packet only." This file is the team-lead's runtime behavior reference — stale phrasing here means the team-lead reads wrong instructions. Every "decision-packet" reference becomes "design document." Additionally: the team-lead's transition steps need a new section or modification to the closure flow covering "route to spec-write" after designer approval of the design document.

### Group 2: Files with stale description text (catalog-forcing edits)

**skills/spec-write/SKILL.md — description**
"by a design-committee verdict or a spec-architect output. Extracts the eight-field FAC-complete-design contract" — both phrases change. This is a `description` field edit → catalog regen required.

**skills/spec-architect/SKILL.md — description**
Line 3: "the committee path skips it." That's still true — `spec-architect` is still not on the committee path. But "Invoked only on the small-task path; the committee path skips it." may need clarification now that the committee path has a named transition. Likely minor clarification, possibly not a description change. Worth flagging.

**skills/setup-start/references/skill-index.md**
Line 38 (spec-write entry): "by a design-committee verdict or a spec-architect output. Extracts the eight-field FAC-complete-design contract" — direct copy of the description. Generated file; changes automatically on regen after description edit.

### Group 3: Agent files with stale framing

**agents/design-committee-scribe.md**
The scribe is described as authoring "the committee's artifact (spec, plan, or analysis) from the converged verdict and the member-position record." The scribe's job description changes: it now authors a "complete design document" following the new Option-2 template (not the old verdict-packet template). The description field on line 3 ("Writes the draft artifact to disk; returns a file pointer only") is still accurate but may need minor reframing. The body's job description on line 8 ("author the committee's artifact (spec, plan, or analysis) from the converged verdict") stays mostly accurate since verdict.md still exists as the primary source — the template being different is the key change. The template path provided at dispatch changes (new Option-2 template vs old artifact-template.md). Whether the scribe agent file itself needs edits depends on how the new template path replaces the old one in dispatch instructions (possibly a team-lead.md-only change).

**agents/design-committee-{conservator,innovator,pragmatist,purist}.md (all four)**
Line 47 in each: "No team-lead role-play. No consolidating, no writing decision packet, no adjudicating." "decision packet" appears in the prohibition. This is minor but inaccurate — it should say "design document" for consistency. Low priority but part of the surface.

### Group 4: Files that mention committee output but are CORRECT or NOT load-bearing after the change

**skills/spec-harden/SKILL.md**
Line 23: "the originating design (committee verdict or brief)" — changes to "committee design document or brief." Minor.

**skills/spec-architect/SKILL.md**
Line 20: "The committee path produces a FAC-complete design and goes straight to spec-write" — still accurate. No change needed.

**skills/design-committee/references/skill-contract.md**
Line 40: "decision-packet output expected" in the member agent file characterization. Minor.

**CLAUDE.md files (root, docs/, docs/chester/)**
No committee output descriptions found — these files don't describe the committee's artifact shape or the design→spec pipeline in enough specificity to be stale. No changes needed.

**settings files (.claude/settings.chester.local.json)**
Pure directory config (`working_dir`, `plans_dir`). No process descriptions. No changes needed. Absence confirmed.

---

## The Seam Question: One Sprint or Two?

### The candidate seam

The round02 convening packet names the candidate seam:
- Sprint A: author the new Option-2 template + wire the scribe and contract (the "committee produces a document" change).
- Sprint B: wire the committee→specify transition across skills + CLAUDE.md (the "committee hands off to spec" change).

### Why this is one sprint, not two

The seam doesn't hold under examination. Here's why:

**The transition change and the template change share the same file surface.** `spec-write/references/fac-complete-design-contract.md` must change in both sprints A and B. In Sprint A, you rewrite the document framing (extraction → structured read, D9 repealed). In Sprint B, you'd update the same file to describe the transition from committee to spec-write. This is not a clean dependency — it's the same file being edited twice across two sprints, which creates a merge hazard and splits an atomic change.

**The skills that need description edits don't separate cleanly.** `spec-write/SKILL.md` must change its description in both intents: it's wrong about extraction (Sprint A concern) and wrong about the "by a design-committee verdict" framing that implies narrative-mining (Sprint A). But its "Invoked by: the design-committee path (committee verdict)" language also needs updating for the transition direction (Sprint B). These edits touch the same lines.

**The `design-committee/SKILL.md` Transitions line IS both changes simultaneously.** The Transitions field currently says "none — committee = standalone consultation." Changing it to name `spec-write` as the downstream is at once (a) acknowledging the committee now produces a complete design document (Sprint A), and (b) declaring the committee→specify transition (Sprint B). You cannot split these into two sprints without leaving the Transitions field wrong after Sprint A.

**The Innovator frame on this:** the two-sprint decomposition optimizes for safety (smaller, reversible change sets) at the cost of coherence (the alignment surface is a single consistent description of one new reality). Chester's refactor sprints don't have a staged rollout problem — there's no backward-compatibility concern, no users to protect from a transient inconsistent state. The whole change set is internal documentation. The right decomposition for an internal documentation refactor is "make everything consistent in one pass," not "make it half-consistent, then fix the other half."

**Sprint A without Sprint B is worse than the status quo.** If you deliver the new template but leave the `design-committee/SKILL.md` saying "Transitions to: none" and `spec-write` still talking about extracting from a committee verdict, you have an inconsistent system where the template has changed but the surrounding skills don't know how to use it. That intermediate state has no value as a deliverable. It is not independently deployable.

**Conclusion: one sprint.** The full alignment surface is the deliverable. The new template and the transition wiring are two aspects of the same new reality: the committee produces a complete design document and hands it to `spec-write`. These cannot be meaningfully staged.

---

## Catalog Freshness Flags

Description edits that force `bin/chester-generate-agents` regen + stage of `skills/setup-start/references/skill-index.md` in the same commit:

1. `skills/spec-write/SKILL.md` — description changes (verdict/extract framing). **DECISIVE**.
2. `skills/design-committee/SKILL.md` — "decision-packet" → "design document" in scribe line, plus Transitions update. Possibly description-level if the description changes. **Verify**: the description on line 3 currently describes the committee as a "Process-agnostic primitive" without mentioning artifact shape — likely no description edit here, just body edits. **Not catalog-forcing unless description line changes.**

---

## Final Position

```
position: (a) Alignment surface: 7 files with load-bearing changes + 4 minor agent
file fixes. DECISIVE files: artifact-template.md (full replacement), fac-complete-
design-contract.md (full rewrite — D9 repealed), spec-write/SKILL.md body + description
(extraction → structured read, catalog regen required), design-committee/SKILL.md (scribe
line + Transitions), team-lead.md (all "decision-packet" refs + closure transition steps),
committee-analysis-round-format.md (artifact type rename including file-naming convention).
Minor: spec-harden body, four member agent files. Settings and CLAUDE.md files: no
changes needed. (b) ONE sprint. The candidate seam (template vs transition wiring) does
not hold — fac-complete-design-contract.md and spec-write/SKILL.md are shared edit
surfaces for both proposed sub-sprints, and design-committee/SKILL.md's Transitions line
is simultaneously both changes. Sprint A without Sprint B produces an inconsistent system
with no independent deployable value.

rationale: Every file in the DECISIVE group describes the design-committee→spec-write
relationship. The "committee produces a document" change and the "committee transitions
to spec-write" change are the same conceptual change expressed in different files — they
cannot be staged without leaving a half-consistent state. Internal documentation refactors
have no backward-compat constraint and no staged-rollout value; coherence in one pass is
strictly better than half-correctness in two.

blocking_risk: None. The change surface is fully enumerable (surveyed above). The scribe's
bounded inputs (verdict.md + consolidator-output.md + alignment-map.md) survive — the
template path at dispatch changes but the dispatch model does not. Catalog freshness is
handled by a single regen step at commit time.

warrant: {
  type: evidence,
  source: "Primary file survey: skills/spec-write/references/fac-complete-design-contract.md
  (D9 text, extraction framing); skills/design-committee/SKILL.md:150,228 (decision-packet
  + Transitions:none); skills/design-committee/references/committee-analysis-round-format.md:39,58
  (artifact type name + file placeholder); skills/design-committee/references/team-lead.md:6,38,87,
  101,331 (decision-packet runtime refs); skills/design-committee/references/artifact-template.md
  (entire template replaced); skills/spec-write/SKILL.md:3,15-16,25-26 (extraction framing)"
}
```
