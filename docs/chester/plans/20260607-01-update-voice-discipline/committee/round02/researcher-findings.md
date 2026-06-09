# Researcher Findings — Plan-00 Coverage Map

**Round:** 02
**Question:** Is plan-00 sufficient for the size of the voice-discipline refactor — where is it under-scoped, structurally weak, or missing tasks?
**Scope:** Ground truth only. No design opinion.

---

## 1. TRUE SURFACE — Every File the Refactor Creates/Modifies/Deletes

### Generator + wrapper (2 files — all new)
- `bin/chester-generate-agents` — thin PATH wrapper (new)
- `chester-util-config/chester-generate-agents.sh` — implementation (new)

### Canonical sources in agents/sources/ (11 files — all new, directory does not yet exist)
Member scaffold and lenses:
- `agents/sources/member-scaffold.md` — shared member bands (new)
- `agents/sources/lens-conservator.md` — lens-specific content (new)
- `agents/sources/lens-innovator.md` (new)
- `agents/sources/lens-pragmatist.md` (new)
- `agents/sources/lens-purist.md` (new)

Reviewer discipline and bodies:
- `agents/sources/review-discipline.md` — evidence standard, confidence ladder, independence (new)
- `agents/sources/reviewer-attacker.md` (new)
- `agents/sources/reviewer-smeller.md` (new)
- `agents/sources/reviewer-plan-reviewer.md` (new)
- `agents/sources/reviewer-spec-reviewer.md` (new)
- `agents/sources/reviewer-quality-reviewer.md` (new)

Catalog template:
- `agents/sources/catalog-template.md` (new)

### Manifest (1 file — new)
- `agents/manifest.json` (new)

### Generated outputs — agent files (9 files — regenerated, meaning preserved)
- `agents/design-committee-conservator.md` (regenerated)
- `agents/design-committee-innovator.md` (regenerated)
- `agents/design-committee-pragmatist.md` (regenerated)
- `agents/design-committee-purist.md` (regenerated)
- `agents/plan-build-plan-attacker.md` (regenerated)
- `agents/plan-build-plan-smeller.md` (regenerated)
- `agents/plan-build-plan-reviewer.md` (regenerated)
- `agents/execute-write-spec-reviewer.md` (regenerated)
- `agents/execute-write-quality-reviewer.md` (regenerated)

### Generated outputs — catalog (1 file — regenerated)
- `skills/setup-start/references/skill-index.md` (regenerated)

### CLAUDE.md authoring edits (2 files — modified)
- `CLAUDE.md` (root) — description-sync rule fix, skill-index phantom pointer fix
- `skills/CLAUDE.md` — replace version-rule + description-sync rule bodies with pointer to root

### util-design-partner-role edits (1 file — modified)
- `skills/util-design-partner-role/SKILL.md` — add `## PM Litmus Test` and `## Research Boundary` sections; version bump

### Orphan-voice-rule consumer edits (2 files — modified)
- `skills/design-small-task/SKILL.md` — replace PM Litmus and Research Boundary bodies with citations
- `skills/design-committee/references/team-lead.md` — replace same two bodies with citations

### New tests (3 files — new)
- `tests/test-generate-agents-core.sh` (new)
- `tests/test-generate-catalog.sh` (new)
- `tests/test-generated-agents-current.sh` (new)
- `tests/test-claude-md-dedup.sh` (new)

*Note: 4 new test files, not 3. Plan counts test-claude-md-dedup as part of Task 9 but it is a distinct new test file.*

### Existing tests extended (1 file — modified)
- `tests/test-partner-role-discipline.sh` — extended in Tasks 5 and 10 with new assertions

**Total file count:** 27 distinct files touched (14 new, 13 modified/regenerated). Zero deletions.

---

## 2. DECOMPOSITION REALITY

### 2a. Member files — lens-woven vs truly shared

Claim in plan (Task 3): member scaffold holds "shared bands," lens files hold lens-specific prose. F2 in the threat report invalidates the clean scaffold/lens split. Here is the evidence from the actual files.

**Bands that are actually lens-woven (text varies per member):**

Phase Contract — the lens name appears inline in each member's Phase Contract section. From the files:
- conservator.md: "Produce one Committee response: position on question from **Conservator** lens" (:39), "reasoning in two-to-four sentences from **Conservator** lens" (:41), "cross-DM (peer challenges, optional, up to two)" with "Conservator-lens challenge" (:44)
- innovator.md: "from **Innovator** lens" (:39, :41), "Innovator-lens challenge" (:44)
- pragmatist.md: "from **Pragmatist** lens" (:39, :41), "Pragmatist-lens challenge" (:41's note about naming cost)
- purist.md: "from **Purist** lens" (:39, :41), "Purist-lens challenge" (:41's note about category/composition)
- The entire R1 proposal template, R1 cross-DM template, R2 final template, and Single-round template each embed the lens name in the header label (e.g. `**Conservator — response**`, `**Innovator — R1 proposal**`).

Hard Prohibitions — items 2-4 vary by lens (F7 in threat report corrects the F2 statement that item 5 differs; actual finding is items 2-4 differ). Evidence from the files:
- Item 2: conservator "Need more context to defend lens → ask team-lead to dispatch Researcher"; innovator "Need more context to advocate lens"; pragmatist "Need more context to defend lens (e.g. real cost data from codebase)"; purist "Need more context to defend boundary claim"
- Item 3: conservator "No consolidating, no writing decision packet, no adjudicating. Team-lead does."; innovator "No consolidating, no writing decision packet, no adjudicating." (shorter — no "Team-lead does."); pragmatist and purist: same short form
- Item 4: conservator "No declaring decision final. Designer does."; innovator/pragmatist/purist: "No declaring decision final." (shorter — no "Designer does.")
- Item 5 (the plan's stated divergence): all four files identical: "Write access scoped to the `committee/` round folder only — write the full position to the round-folder transcript before sending the typed routing signal; no writes outside `committee/`."

Output-Format preamble — the lens name appears in the template labels:
- Single-round: `**Conservator — response**` / `**Innovator — response**` / `**Pragmatist — response**` / `**Purist — response**`
- R1 proposal: `**Conservator — R1 proposal**` / etc.
- R1 cross-DM: `**Conservator — peer challenge → <Peer Member>**` / etc.
- R2 final: `**Conservator — R2 final**` / etc.
- One additional Pragmatist-specific label variant: the Reasoning field adds a content directive ("name the cost saved and the cost incurred")
- One additional Purist-specific label variant: the Reasoning field adds "name the boundary kept or the composition preserved"

**Bands that are truly shared (identical across all 4 files):**
- Preamble line 1 (intro job description): nearly identical with only lens name swapped — structurally templatable
- "Scope." paragraph (:10-11): identical across all four
- Item 1 of Hard Prohibitions: "No proof-state operations. Primitive carries no proof-state custodian. Requests involving structured state belong outside primitive." — identical in all four
- Item 5 of Hard Prohibitions (write-access): identical in all four
- Voice Discipline § header and dual-audience framing: structure matches, but lens-specific Voice Discipline entries exist (see below)
- The peer-DM caveman ultra paragraph (second voice mode): identical across all four
- C1 label and C2 label: present in all four but with lens-specific elaboration text
- Output-Format closing line: "Keep field labels exact..." — identical across all four

**Voice Discipline lens-specific variations (not in plan's shared-band list):**
- Translation Gate elaboration: conservator is longest ("Team-lead consolidates reply into designer-facing output, so anything emitted may be quoted verbatim — keep clean"); innovator adds "Innovator names re-framings often; rule load-bearing here"; pragmatist: shorter; purist adds unique jargon warning ("Resist especially pull to say 'sum-type' or 'tagged union'")
- Option-naming rule elaboration: varies per lens (innovator notes re-framings; pragmatist notes "do smaller thing"; purist notes "category claims easiest in plain language")
- C1 elaboration: varies per lens (innovator: "Re-framings easy to under-justify"; pragmatist: "Cost claims must surface"; purist: "Boundary claims must surface")
- C2 elaboration: varies per lens (innovator: n/a; pragmatist: "Cost estimates without measurement = Assumption:"; purist: "Composition claims without worked example = Assumption:")

**Software Architect Persona — lens-adapted Stance bullets:**
Each member restates the 5 Stance Principles with lens-adapted elaboration:
- "Be opinionated" bullet: each lens adds its own elaboration sentence
- "Read code as design history": each lens adds a distinct lens-specific second sentence
- "Think in trade-offs": each lens adds a lens-specific note (conservator: generic; innovator: "re-framings carry migration cost"; pragmatist: "leans hardest here. Every recommendation names cost saved + cost incurred"; purist: "leans hard on compositional integrity, but acknowledge when...")
- "Evaluate boundaries as choices": conservator "Defend boundaries as choices that earned place"; innovator "Innovator leans hardest here. Boundaries = choices re-makeable"; pragmatist "boundaries that earn keep stay; boundaries that don't = cost"; purist "Purist leans hardest here, opposite direction from Innovator. Boundaries = choices that often *should* be defended"
- "Align architecture to intent": each lens adds a lens-specific purpose clause

The current plan (Task 3) assumes these Stance bullets can be extracted from `util-design-partner-role/SKILL.md` via section extraction. That assumption is WRONG. The Stance Principles section in `util-design-partner-role/SKILL.md:162-169` reads:
```
- **Be opinionated.** Deep knowledge of this codebase. Share perspective, take positions, make recommendations. Designer corrects when wrong.
- **Read code as design history** — patterns, boundaries, connections = evidence of decisions someone made, not inventory to catalogue.
- **Think in trade-offs** — balance technical concerns against goals, current state against future needs; never optimize single axis.
- **Evaluate boundaries as choices** — existing structure = result of prior design decisions, not immutable constraints.
- **Align architecture to intent** — link every structural decision back to what human trying to accomplish.
```
These are the generic versions. Each member file expands each bullet with a lens-specific second sentence. Extracting the generic version drops the lens adaptation = semantic change. F2 is confirmed.

### 2b. Reviewer files — discipline bands per file (evidence/ladder/independence)

**Evidence standard** — the claim "every finding must cite: a specific file path, line number, or concrete code reference" and "if you cannot point to codebase evidence, drop the finding":

- `plan-build-plan-attacker.md:72-78` — full evidence standard section including "single most important rule" phrase
- `plan-build-plan-attacker.md:95` — "Each finding must have codebase evidence. Drop any finding that cannot cite a real file or code path. This is the single most important rule."
- `plan-build-plan-smeller.md:62-69` — evidence standard section ("If you cannot point to concrete evidence in the plan text or codebase, drop the finding. This is the single most important rule.")
- `plan-build-plan-reviewer.md` — does NOT have an evidence standard section; it has a different calibration approach with a table and "Only flag issues where the plan fails to implement or contradicts the spec." No "cite real evidence" language.
- `execute-write-spec-reviewer.md` — does NOT have an evidence standard section by that label. Has confidence scoring (:64-73) instead.
- `execute-write-quality-reviewer.md` — does NOT have an evidence standard section. Has confidence scoring (:68-77).

So the evidence standard exists in 2 of 5 reviewers (attacker + smeller), and has drifted between those two: attacker says "file paths, line numbers, dependency chains, or concrete code"; smeller says "plan text, proposed class/method names, file paths, or existing constructs the plan touches."

**Confidence ladder** (≥80 confidence scoring scale):
- `execute-write-spec-reviewer.md:64-73` — full ladder with 0-25/25-50/50-79/80-100 bands and "Only report issues scoring ≥ 80"
- `execute-write-quality-reviewer.md:68-77` — full ladder, same 4 bands, same ≥80 threshold; wording variant: spec-reviewer says "Verified real issue that impacts spec compliance"; quality-reviewer says "High confidence — verified against code, will impact functionality or quality" (F4 confirmed — second convergence)
- `plan-build-plan-attacker.md` — NO confidence ladder
- `plan-build-plan-smeller.md` — NO confidence ladder
- `plan-build-plan-reviewer.md` — NO confidence ladder

**Independence rule:**
- `execute-write-spec-reviewer.md:18-31` — full "CRITICAL: Do Not Trust the Report" section with DO/DO NOT lists; strong independence framing
- `plan-build-plan-attacker.md` — opening: "You are an adversarial plan reviewer. Attack the implementation plan..." — independence implied by role but no explicit independence section
- `plan-build-plan-reviewer.md:51` (line per spec citation) — "Read the actual plan and spec files. Do not trust summaries you receive in the prompt — open the files yourself." One-line independence instruction
- `execute-write-quality-reviewer.md:66` — "Read the actual diff. Do not infer from the implementer's summary." — F4 finding from threat report: independence-flavored local prose, not a shared canonical band; threat report says "default is leave-in-place (no meaning change)"
- `plan-build-plan-smeller.md` — NO independence section beyond implicit focus declaration

**Per-reviewer discipline map (ground truth, not the plan's stated map):**

| Reviewer | Evidence Standard | Confidence Ladder | Independence |
|---|---|---|---|
| plan-build-plan-attacker | YES (lines 72-78, 95) | NO | Implicit only |
| plan-build-plan-smeller | YES (lines 62-69) | NO | NO |
| plan-build-plan-reviewer | NO | NO | ONE LINE (:51) |
| execute-write-spec-reviewer | NO | YES (:64-73) | FULL SECTION (:18-31) |
| execute-write-quality-reviewer | NO | YES (:68-77) | ONE LINE (:66) |

This distribution is irregular and must be preserved per AC-3.1. The plan's Task 4 cites these lines correctly. The F4 finding (second confidence-ladder convergence) is real and not enumerated in AC-8.1.

---

## 3. PLAN COVERAGE TABLE

### Per-task surface coverage

| Task | What It Covers | Files Created/Modified |
|---|---|---|
| T1: Generator core — agent mode | Generator binary + wrapper; core fragment assembly + section extraction; test | `bin/chester-generate-agents` (new), `chester-util-config/chester-generate-agents.sh` (new), `tests/test-generate-agents-core.sh` (new) |
| T2: Generator catalog mode | Catalog emit_catalog function appended to generator impl; catalog test | `chester-util-config/chester-generate-agents.sh` (mod), `tests/test-generate-catalog.sh` (new) |
| T3: Member canonical sources | member-scaffold + 4 lens files (seeded verbatim) | `agents/sources/member-scaffold.md` (new), `agents/sources/lens-{conservator,innovator,pragmatist,purist}.md` (4 new) |
| T4: Reviewer canonical sources | review-discipline + 5 reviewer body files (derived map, seeded verbatim) | `agents/sources/review-discipline.md` (new), `agents/sources/reviewer-{attacker,smeller,reviewer,spec-reviewer,quality-reviewer}.md` (5 new) |
| T5: Voice-rule canonical homes | Add PM Litmus + Research Boundary sections to util-design-partner-role; extend test-partner-role-discipline with assertions | `skills/util-design-partner-role/SKILL.md` (mod), `tests/test-partner-role-discipline.sh` (mod) |
| T6: Catalog template | catalog-template.md with CATALOG_SLOT marker | `agents/sources/catalog-template.md` (new) |
| T7: Manifest wiring + first regeneration | manifest.json authored; all 9 agent files regenerated; skill-index.md regenerated | `agents/manifest.json` (new), 9 agent .md files (regenerated), `skills/setup-start/references/skill-index.md` (regenerated) |
| T8: Verify test | staleness guard test | `tests/test-generated-agents-current.sh` (new) |
| T9: CLAUDE.md dedup | Root CLAUDE.md + skills/CLAUDE.md authoring edits; dedup test | `CLAUDE.md` (mod), `skills/CLAUDE.md` (mod), `tests/test-claude-md-dedup.sh` (new) |
| T10: Drop orphan duplicates | Replace PM Litmus + Research Boundary bodies in design-small-task and team-lead.md with citations; extend test | `skills/design-small-task/SKILL.md` (mod), `skills/design-committee/references/team-lead.md` (mod), `tests/test-partner-role-discipline.sh` (mod) |

### Surface items with no task coverage (gaps)

**F2 fix — the placeholder substitution mechanism:** F2 says full-file concatenation fails because the lens name is woven into "shared" bands (Phase Contract labels, Hard Prohibition items 2-4, Output-Format template labels, Persona lens-adapted Stance bullets). The threat report specifies the fix: add a `{{Lens}}`/`{{lens}}` placeholder substitution pass to the generator, update member-scaffold.md to carry placeholders, move lens-adapted Stance bullets to lens files, DROP the Stance-section extraction fragment. This is a code change to `chester-generate-agents.sh`, a manifest-structure change, and a content change to what goes in member-scaffold.md vs lens files. Plan-00 contains NO task for this fix. The plan's Task 3 Step 1 mentions F2 tangentially ("lens name is woven INTO the 'shared' bands") but does not add any implementation step for the substitution mechanism. Task 7 Step 1's manifest wiring for members still references the Stance extraction fragment (`{"file":"skills/util-design-partner-role/SKILL.md","section":"Stance Principles (carry into every turn)"}`) — this is invalid per F2's fix directive.

**F1 fix — `$tmpl_abs` unbound variable:** Task 2 Step 3's `emit_catalog` code block uses `"$tmpl_abs"` in the awk call but never assigns it in the code block (only prose says "Resolve `tmpl_abs="$CHESTER_ROOT/$tmpl"` before the awk"). This is a bug guaranteed to crash under `set -u`. The plan acknowledges this in the threat report (F1 HIGH) but there is no task or step that adds the `local tmpl_abs=...` assignment to the code block. The implementer must catch this from the threat report text alone — there is no corrected code block.

**F3 fix — `fail()` accumulator in test-partner-role-discipline.sh:** Task 5 and Task 10 both add `fail "..."` calls to `tests/test-partner-role-discipline.sh`, which uses `set -e` + inline `|| { echo …; exit 1; }` with NO `fail()` function. The test would fail to run because `fail` is an undefined command. The threat report names this (F3 HIGH) but no task adds a `fail()` function to that test file or converts the existing test to the accumulator convention.

**F4 — second confidence-ladder convergence:** AC-8.1 requires every deliberate convergence to be explicitly enumerated before acceptance. The confidence-ladder wording in spec-reviewer vs quality-reviewer also drifts (`execute-write-spec-reviewer.md:68` uses "Verified real issue that impacts spec compliance"; `quality-reviewer.md:71` uses "High confidence — verified against code, will impact functionality or quality"). Task 4 creates `review-discipline.md` with a `## Confidence ladder` section that would force convergence of these two phrasings. This second convergence is NOT enumerated in AC-8.1 in the plan or spec. No task addresses this.

**F5 — skill-index grouping vs frontmatter generation collision:** The current `skill-index.md` groups skills by role (Pipeline/Finish/Review/Behavioral/Utility). The catalog generator scans frontmatter, which carries no category/role field — generating from frontmatter produces a flat alphabetical list with no grouping. Task 2's test (`test-generate-catalog.sh`) does NOT assert grouping preservation. Task 6 (catalog template) would preserve the template's grouping headers but the generated list would be inserted as a flat alphabetical block, not distributed into per-group sections. No task resolves this design collision (F5 required a designer decision — three options named; none chosen; plan proceeded without one).

**skills/CLAUDE.md is not listed in plan's task files for Task 9:** Task 9's files list shows `CLAUDE.md` and `skills/CLAUDE.md` — this IS covered. (Not a gap, just confirming.)

**agents/CLAUDE.md (documentation):** This file is not modified by any task. The spec excludes it from the generated-agents partition. No gap here — this is by design.

---

## 4. SIZE SIGNALS

**Total files touched:** 27 distinct files (14 new, 13 modified/regenerated). The 10 tasks handle this, but with uneven density — T3 creates 5 files, T4 creates 6 files, T7 modifies 11 files — all in single tasks.

**Total ACs:** 8 (AC-1.1 through AC-8.1). Plan-00 claims to implement all 8. Coverage appears complete by AC, but the F2 fix changes the implementation of AC-2.1 and AC-8.1 substantially (member file regeneration mechanism must add substitution step), and F5 affects AC-4.1 (catalog grouping).

**Threat findings unaddressed-by-plan:**
- F1 (HIGH): partially addressed — threat report gives the one-line fix in prose but plan code block does not incorporate it
- F2 (HIGH): not addressed in any task — the placeholder mechanism and Stance-bullets relocation are absent from all 10 tasks
- F3 (HIGH): not addressed — test-partner-role-discipline.sh convention mismatch not fixed in any task
- F4 (MEDIUM): not addressed — second convergence not enumerated
- F5 (MEDIUM): not addressed — no designer decision recorded in the plan
- F6 (MEDIUM): addressed in generator implementation prose (threat report mentions stripping leading blank lines) but no task step or code block reflects this fix
- F7 (LOW): informational correction to Task 3 Step 2 guidance — no code impact
- F8 (LOW): tied to F3 — same convention mismatch issue

**Summary: 3 HIGH findings are effectively unaddressed in the plan's executable steps.**

**"Complete code in plan" blocks vs tasks that hand-wave:**
- T1: Complete code blocks for both generator files and test — well-specified
- T2: Code block for `emit_catalog` function — contains F1 bug (missing `tmpl_abs` assignment); also uses `local` inside a function that is NOT `function()` syntax but rather nested shell — minor portability concern
- T3: No code blocks — text-relocation task with step descriptions; Steps 1-4 are authoring guidance, not code
- T4: No code blocks — derived-map task with step descriptions; content-authoring, not code
- T5: Code blocks for test assertions only; the actual SKILL.md edits described in prose only
- T6: No code blocks — prose-only editing
- T7: No code blocks — manifest is JSON specified only by prose description; 11-file regeneration described in 5 steps
- T8: Complete code block for the verify test
- T9: Code block for the dedup test only; CLAUDE.md edits described in prose
- T10: Code block for test assertions only; the SKILL.md and team-lead.md edits described in prose

**Tasks that bundle 3+ distinct file kinds:**
- T7 bundles: manifest.json (config), 4 member agent .md files (generated docs), 5 reviewer agent .md files (generated docs), skill-index.md (generated catalog) — 11 files of 3 distinct kinds. This is the integration point and the most complex task. The plan acknowledges T7 is the integration point.
- T4 bundles: review-discipline.md (canonical source) + 5 reviewer body files (6 files of effectively 2 kinds — one shared source + 5 domain-specific bodies).

**Is 10 tasks sufficient or too few?**

10 tasks for 27 files is a reasonable ratio for the mechanics defined. The structural problem is not task count — it is that 3 HIGH findings from the threat report have no corresponding fix-task in the plan. The plan was produced AFTER the threat report (threat report timestamp 2026-06-07T12:32Z is after spec timestamp 2026-06-07T11:34Z) but the threat report's findings are not reflected as new tasks or as step amendments within existing tasks. The threat report says "Update spec AC-2.1/AC-8.1 and plan Tasks 1, 3, 7" for F2 — none of those updates appear in plan-00. Either the plan was finalized before the threat report was incorporated, or incorporation was intended as implementer-time work (not plan-time). This is the core adequacy question.

**Specific under-scoped tasks:**
- T1 needs a step for the placeholder substitution logic (F2 fix) — adding this would expand the generator implementation from fragment-concatenation to fragment-concatenation-with-substitution
- T3's Step 1 "shared band identification" is now wrong: items 2-4 of Hard Prohibitions are lens-woven, not shared; the 5 Stance bullets are lens-adapted, not extractable from util-design-partner-role. A correct implementation following Task 3's steps would produce a broken split
- T7's manifest fragment definition for members includes `{"file":"skills/util-design-partner-role/SKILL.md","section":"Stance Principles (carry into every turn)"}` — this fragment would extract the generic Stance bullets, replacing the lens-adapted versions = semantic change in violation of AC-8.1

---

## Summary Table

| Category | Count | Notes |
|---|---|---|
| Total files touched | 27 | 14 new, 13 modified/regenerated |
| Total ACs | 8 | All claimed covered |
| HIGH threat findings unaddressed in task steps | 3 | F1 (code bug), F2 (mechanism missing), F3 (test bug) |
| MEDIUM threat findings unaddressed | 2 | F4 (unenumerated convergence), F5 (no designer decision on grouping) |
| Tasks with complete code blocks | 4 of 10 | T1, T2, T8, partial T5/T9/T10 for tests only |
| Tasks bundling 3+ file kinds | 2 | T4 (6 files), T7 (11 files) |
| Surface items zero tasks cover | 5 | F2 substitution mechanism, F1 tmpl_abs fix, F3 fail() fix, F4 second convergence enumeration, F5 grouping decision |

<!-- created-at: 2026-06-07 -->
<!-- produced-by: design-committee-researcher, round 02 -->
