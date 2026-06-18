# Pragmatist Transcript — Round 02

**Member:** Pragmatist
**Question:** Enumerate every file needing change for the Option-2 committee complete-design + committee→specify transition, and judge one sprint vs two.

---

## Survey of the Alignment Surface

Working from direct grep evidence. I surveyed: all skills/*/SKILL.md, design-committee references/, spec-write references/, agents/, docs/, CLAUDE.md tree, .claude/ settings.

### DECISIVE files — load-bearing changes

**1. `skills/spec-write/references/fac-complete-design-contract.md`**
- Line 3: "It **extracts** the eight fields below from the producer's native output." — must change to "reads the eight fields from the producer's native output" (or equivalent; extraction no longer applies to the committee path).
- Lines 9-18: the table column "Committee verdict source" now sources to Option-2 labeled sub-fields, not mined from narrative. Column header and source descriptions need rewriting.
- Line 22: "Silent mis-extraction from a narrative committee verdict is the one failure hardening structurally cannot catch — the quote-back is the only guard." — This sentence exists only because extraction was the mechanism. With a structured document it is obsolete; remove or replace with the new quote-back rationale.
- Lines 24-26: D9 section "Producers emit no new artifact... retained only as a documented fallback (D9)." — D9 is reversed; this must be rewritten to state that the committee NOW emits a typed Option-2 design document.
- **Version bump required.** Behavior/contract change.

**2. `skills/design-committee/references/artifact-template.md`**
- This is the template being replaced. The Option-2 template is the new artifact. Either this file is replaced entirely (new Option-2 template content written here) or a new file is added and `artifact-template.md` points to it. Given the scribe receives the template path at dispatch (not hardcoded), the simplest change is to rewrite this file with the Option-2 structure: committee-native sections (Verdict, Rationale, Dissent Record, Deferred) with labeled sub-fields that satisfy the eight FAC fields as content.
- **DECISIVE.** Without this file changing, the scribe continues authoring verdict-only packets.

**3. `skills/design-committee/SKILL.md`**
- Line 150: "the scribe authors the round's designer-facing decision-packet from the verdict" — must change to "the scribe authors the round's designer-facing complete-design document."
- Line 228: "Transitions to: none — committee = standalone consultation." — MUST add the specify-path transition. Compare to `design-small-task` line 258: "Transitions to: spec-architect (which settles architecture, then chains to spec-write → spec-harden → plan-build)". Committee analog: "Transitions to: spec-write → spec-harden → plan-build (committee output is FAC-complete; skip spec-architect)."
- Line 150 also references `references/artifact-template.md` as the template path — this remains correct if the file is rewritten in place (no path change needed).
- **Version bump required.** Behavior contract + transition declaration change.

**4. `skills/design-committee/references/team-lead.md`**
- Line 6: "format (decision packet + exemplar + gates)" — must update "decision packet" to "complete-design document."
- Line 38: "Overlay supersedes caveman compression for designer-facing decision packets." — update to "complete-design documents."
- Line 87: "the scribe's decision-packet artifact" — repeated three times; update to "complete-design document."
- Line 102: "The scribe authors the round's decision-packet artifact — including its Dissent Record." — update phrasing.
- Line 139: "the scribe's decision-packet artifact" — update.
- Line 220 (round-format): "Scribe decision-packet (designer-facing)" header.
- Line 305: "nothing raw reaches the designer through … the decision packet." — update.
- Line 331: "Switch from caveman ultra to packet voice … for designer-facing decision packet only." — update.
- Line 338: closure checklist — "decision packet" language.
- **Version bump is on SKILL.md, not team-lead.md.** team-lead.md is a reference file, not a skill with its own frontmatter version. But since it changes behavior, the parent SKILL.md version bump covers it.

**5. `skills/design-committee/references/committee-analysis-round-format.md`**
- Lines 39-40 (approximately): "Scribe decision-packet (designer-facing — Translation Gate APPLIES)" — must rename to "Scribe complete-design document (designer-facing — Translation Gate APPLIES)."
- Line 8-9: "the scribe's designer-facing decision-packet artifact" — update.
- Line 224: "Scribe decision-packet" header in the template block — update.
- This file has version frontmatter (`v0001`) — bump if behavior language changes.

**6. `agents/design-committee-scribe.md`**
- Line 3 description: "Receives verdict.md, the artifact-template path, and consolidator-output.md at dispatch. Writes the draft artifact to disk." — The description's tools/contract survive; only the framing of what kind of artifact changes.
- Line 8: "Job: author the committee's artifact (spec, plan, or analysis) from the converged verdict." — update "artifact (spec, plan, or analysis)" to "complete-design document."
- The scribe inputs don't change (verdict.md + consolidator-output.md + alignment-map.md + template path). The description frontmatter change requires catalog regen.
- **DECISIVE for catalog freshness**: if the one-line `description` changes, `bin/chester-generate-agents` must be run and `skills/setup-start/references/skill-index.md` must be regenerated and staged in the same commit.

**7. `skills/design-committee/references/skill-contract.md`**
- Line 40: "member agent files… declare committee-specific phase contract: solution-space discussion permitted, peer-DM enabled, **decision-packet output expected**." — must update "decision-packet output expected" to "complete-design document output expected."
- No frontmatter version on this file; it is a skill-author reference only.

**8. `skills/spec-write/SKILL.md`**
- Line 3 description: "Use when the architecture is already settled — by a design-committee verdict or a spec-architect output. **Extracts** the eight-field FAC-complete-design contract, quotes back the chosen-architecture field for confirmation." — "Extracts" language is stale for the committee path; update to "reads the eight-field FAC-complete-design contract."
- Line 15-16: "a `design-committee` verdict (FAC-complete by deliberation)" — update to "a `design-committee` complete-design document (FAC-complete by deliberation)."
- Lines 25-26: "extract the eight fields per fac-complete-design-contract.md from the producer's native output (committee verdict or spec-architect output)" — update "committee verdict" to "committee complete-design document."
- Line 51-52: "Invoked by: spec-architect (small-task path), the design-committee path (committee verdict), or user directly" — update "committee verdict" to "committee complete-design document."
- **Version bump required** (behavior description + trigger language changes).
- **Description frontmatter changes → catalog regen required.**

**9. `skills/setup-start/references/skill-index.md`**
- Line 38: "Author a spec document from a FAC-complete design. Use when the architecture is already settled — by a design-committee verdict or a spec-architect output. **Extracts** the eight-field FAC-complete-design contract." — update as above.
- Line 36: spec-architect line is fine (it correctly says committee path skips it).
- **This file is generated** — do not hand-edit; run `bin/chester-generate-agents` after description changes in spec-write and design-committee-scribe.

**10. `docs/instructions.md`**
- Line 207: "Authors the spec from a FAC-complete design — either a **committee verdict** or the output of spec-architect. **Extracts** the eight-field FAC-complete-design contract." — update "committee verdict" to "committee complete-design document" and drop "extracts" framing.
- Line 209: "directly after a **committee verdict**, which is already FAC-complete" — update to "committee complete-design document."
- This file is a user-facing reference; stale language here causes designer confusion.

### NON-DECISIVE files with secondary mentions worth verifying

**`skills/spec-harden/SKILL.md`** — Line 23: "committee verdict or brief" as the fidelity-pass design source. Should update to "committee complete-design document or brief." Not load-bearing for the new process to work, but stale documentation. Flag for same-sprint fix.

**`agents/design-committee-conservator/innovator/pragmatist/purist.md`** — The skill-contract line 40 notes these declare "decision-packet output expected." If that language exists in the agent files themselves (not just skill-contract), it must change. The convening packet did not ask me to grep these but I flag it as a verification step.

### Settings files

`.claude/settings.chester.local.json` — pure directory config (`working_dir`, `plans_dir`). No process description. No change needed.  
`.claude/settings.local.json` — permissions + outputStyle. No process description. No change needed.  
No `~/.claude/settings.chester*.json` files found in my access scope.

### CLAUDE.md files

Root `CLAUDE.md`, `docs/CLAUDE.md`, `docs/chester/CLAUDE.md`, `docs/admin/claude.md`, `docs/feature-definition/CLAUDE.md`, `tests/CLAUDE.md`, `skills/CLAUDE.md`, `agents/CLAUDE.md` — none of these files contain committee output type descriptions or FAC-extract language based on my grep. The worktree CLAUDE.md files are stale copies in `.worktrees/`; these are live branch checkouts, not the main tree, and do not need to be edited as part of this sprint (they will pick up main's content on next worktree reset).

### Catalog freshness verdict

Two description-field changes are triggered:
- `skills/spec-write/SKILL.md` description (line 3) — "Extracts" → "reads" or equivalent.
- `agents/design-committee-scribe.md` description — updates the artifact type framing.

Both require `bin/chester-generate-agents` to be run and `skills/setup-start/references/skill-index.md` to be staged in the same commit.

---

## Sprint Decomposition Question

**Proposed seam:** (i) author new Option-2 template + scribe/contract wiring vs (ii) wire the committee→specify transition across skills + CLAUDE.md.

**Pragmatist assessment: one sprint.**

The dependency direction is real — the template change (i) must exist before the transition wiring (ii) can be tested, since the transition assumes a complete-design document exists to hand to spec-write. But this is an intra-sprint dependency, not a cross-sprint gate. Nothing in (i) ships any code or requires external validation before (ii) is safe to write. Both changes are documentation/config edits (no runtime state, no schema migrations, no hooks). The combined blast radius is nine files (eight skill/agent/ref files + skill-index.md as generated artifact). All nine files are in the same repo tree; they can be staged and tested together in a single commit sequence.

The risk-isolation argument for two sprints would apply if (i) and (ii) introduced different kinds of regressions — e.g., if (i) required code changes to the scribe agent's execution path and (ii) required new tests against live committee runs. Neither is true. This is a documentation and template refactor; the test surface is `test-generated-agents-current.sh` (catalog freshness) plus manual inspection of the template and skill text.

One sprint with a clear internal task ordering:
1. Author the Option-2 template (rewrite `artifact-template.md`).
2. Update design-committee SKILL.md + references (decision-packet → complete-design document, Transitions to, scribe dispatch language).
3. Update spec-write SKILL.md + fac-complete-design-contract.md (extraction → structured read, D9 reversal).
4. Update secondary files: skill-contract.md, committee-analysis-round-format.md, docs/instructions.md, spec-harden mention.
5. Update descriptions where changed, run `bin/chester-generate-agents`, stage skill-index.md.
6. Version-bump design-committee SKILL.md and spec-write SKILL.md.
7. Run `tests/test-generated-agents-current.sh` to verify catalog freshness.

Estimated file count: 9 DECISIVE + 2 secondary = 11 files. One sprint. No seam that carries genuine risk isolation.

---

## Final Position

```
position: One sprint. Eleven files need changes; no seam between template-authoring and
transition-wiring that justifies two sprints.

rationale: The alignment surface is: (DECISIVE) artifact-template.md (replacement),
design-committee/SKILL.md (Transitions-to + decision-packet language), team-lead.md
(decision-packet language throughout), committee-analysis-round-format.md (same),
skill-contract.md (phase-contract line), fac-complete-design-contract.md (extraction
framing + D9 reversal), spec-write/SKILL.md (extract language + committee-verdict
references), design-committee-scribe.md description, docs/instructions.md. Plus
generated skill-index.md (catalog regen). Secondary: spec-harden mention, member
agent files if they carry decision-packet language. Settings files carry no process
description — no change needed. CLAUDE.md tree carries no committee-output language —
no change needed. The proposed sprint seam (template vs transition wiring) is an
intra-sprint ordering dependency, not a risk-isolation boundary. All changes are
doc/config edits with one test gate (catalog freshness).

blocking_risk: The only non-trivial risk is letting "decision packet" language survive
in team-lead.md or committee-analysis-round-format.md — those files are read at
runtime by the team-lead and could produce the wrong artifact shape even after the
template is updated. The implementation plan must cover them explicitly.

warrant: {type: evidence, source: "grep evidence from all named files — fac-complete-
design-contract.md lines 3/22/24-26; design-committee/SKILL.md lines 150/228;
team-lead.md lines 6/38/87/102/138/139/305/331/338; spec-write/SKILL.md lines 3/15-
16/25-26/51-52; committee-analysis-round-format.md line 8; skill-contract.md line 40;
docs/instructions.md lines 207/209"}
```
