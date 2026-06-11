# Conservator — transcript (verbatim, abridged) — round01
# Sprint: 20260611-01-compact-committee-skill
# Stance: minimal-cut dedup; every load-bearing nuance cite-with-scope, not deleted; heading renames forbidden; member-protocol untouched

## Position

### Framing

Brief + researcher together establish: the cite-not-restate pattern is already *working* in this codebase. member-protocol.md is the existence proof — it declared itself single authority, SKILL.md and team-lead.md cite not restate, and the downstream cite-graph holds. The job is to extend the same pattern to four more concepts. That is a surgical operation, not a redesign.

Conservator concern: the researcher found 7 load-bearing nuances distributed across "duplicate" sites that are NOT safe to collapse blindly. Each nuance is a prior decision that paid for itself:

1. **Per-Round Flow — team-lead.md steps 3 + 11** (ledger update, designer-response taxonomy) — genuinely additional content with no SKILL.md counterpart. Must survive at owner site.
2. **Translation Gate — round-format.md:101-103** boundary clause (which artifacts the Gate applies to per type) — distinct from rule restatement. Must survive as cite-with-scope.
3. **Translation Gate — member-protocol.md:67-69** transcript exemption — boundary clause at authority site. Untouchable (member-protocol stays frozen).
4. **Translation Gate — team-lead.md:37** "Apply silently" instruction — application constraint not in util-design-partner-role. Must survive.
5. **Output-surface split — round-format.md:108-110** disambiguation clause (do not conflate with sprint 20260521 two-surface usage) — not in team-lead.md. Must survive in cite or cite target.
6. **Standalone — SKILL.md:146** "no degrade-to-no-op / unconditional path" rule — not in Phase 1 or Integration. Must survive (collapse to one SKILL.md site that keeps this clause).
7. **Ephemeral-off-roster — team-lead.md steps 4+8** "Agent tool with no `team_name`" operational detail — not in SKILL.md policy statements. Must survive at team-lead.md.

Additionally: researcher confirmed cite-graph is dense. member-protocol.md § Final Position cited from 6+ locations, § Committee root resolution from 4+ locations. **Any heading rename in member-protocol.md breaks multiple downstream cites.** member-protocol.md stays essentially untouched — no heading renames, minimal edits only if needed for its own boundary clauses.

### Plan shape

Seven dedup tasks (one concept per task, one commit per task) + one version-bump task + one final verification task. No task collapses two concepts in one commit — blast radius per task must be inspectable.

Conservator position on scope: the brief's D2 plan is sound but needs to be executed cautiously. The aggressiveness gradient:

- **Safe (clear win):** SKILL.md § Translation Gate rules-bullets → delete, keep one cite line (already has a cite at :45). SKILL.md § Integration :156 redundant ephemeral-off-roster restatement → delete. SKILL.md § Standalone Invocability → collapse to one site (keep :146 "no-degrade" clause).
- **Careful (nuance must survive):** team-lead.md Translation Gate §§ Voice + §Translation Gate (lines 26-37 + 291-299) → collapse to one block, but the "Apply silently" instruction at :37 must ride the surviving block. round-format.md output-surface-split cite → collapse, but disambiguation clause at :108-110 must ride the cite or the cite target.
- **Leave mostly intact:** team-lead.md §Authority Guard + §Self-Evaluation — researcher confirmed all four sites carry substantively different content (disk-persistence instruction vs policy vs self-check). Brief calls for Self-Evaluation to cite §Authority Guard rather than restate. That is the right cut, but only the count-not-a-warrant / strict-premise-scope self-check items collapse; the warrant-coverage check differs enough in imperative form to survive. Do not over-trim.
- **Freeze entirely:** member-protocol.md — authority site, no heading renames, no content edits.

---

### Proposed Task List

#### Plan: Compact design-committee skill runtime context

**Sprint:** 20260611-01-compact-committee-skill
**Spec:** design/20260611-01-compact-committee-skill-design-00.md
**Execution mode:** inline

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Goal
Reduce per-invocation orchestrator context cost by deduplicating seven cross-file and within-file concepts to single authoritative sites, with one-line cites elsewhere, without altering any behavioral contract.

## Architecture
Extend the existing cite-not-restate pattern (proven in member-protocol.md) to four cross-file concepts and two within-file duplicate clusters. Each task = one concept, one commit; TDD analog uses grep/wc to verify duplicate present before edit, then re-verify removed after. member-protocol.md is frozen throughout; no heading renames anywhere (cite-graph integrity).

## Tech Stack
Markdown file editing; bash grep/wc for verification; no build tools.

---

## Task 1: Collapse SKILL.md § Translation Gate rules-bullets

**Type:** docs-producing
**Implements:** AC (each named duplicated concept has exactly one authoritative site; every other mention is a one-line cite)
**Decision budget:** 1
**Must remain green:** cite at SKILL.md:45 → `skills/util-design-partner-role/SKILL.md` still present after edit

**Load-bearing nuances preserved:** none threatened here — the 4 bullets at SKILL.md:40-43 are pure restatements of util-design-partner-role content. The cite line at :45 already exists and is the correct survivor. "Apply silently" nuance lives in team-lead.md:37 (untouched this task).

**Files:**
- Modify: `skills/design-committee/SKILL.md:36-45`

**Steps (docs-TDD):**

- [ ] **Step 1: Failing grep — confirm duplicate present**

Run: `grep -n "Read-aloud test\|Option-naming\|C1 Externalized\|C2 Fact Default" skills/design-committee/SKILL.md`
Expected: hits at lines 40-43 (the bullets to be removed)

- [ ] **Step 2: Confirm the existing cite line is present**

Run: `grep -n "util-design-partner-role" skills/design-committee/SKILL.md | head -5`
Expected: SKILL.md:45 cite present — `Full voice spec: skills/util-design-partner-role/SKILL.md. LOAD-BEARING citation.`

- [ ] **Step 3: Edit — replace the 4 bullets with a single expanded cite line**

In `skills/design-committee/SKILL.md` lines 36-45, replace the bullet restatements (lines 40-43) with a single cite that preserves the section's floor-enforcement statement. Target result:

```
## Translation Gate

Floor enforcement. Every subagent self-enforces. Team-lead re-checks at consolidation per `references/team-lead.md`.
Apply before output reaches designer. Full voice spec and rules: `skills/util-design-partner-role/SKILL.md`. LOAD-BEARING citation. Touch util-design-partner-role → audit committee impact.
```

(Four bullet lines removed; cite line expanded to absorb "apply before output reaches designer" phrasing.)

- [ ] **Step 4: Confirm green — no bullet restatement remains; cite still present**

Run: `grep -n "Read-aloud test\|Option-naming\|C1 Externalized\|C2 Fact Default" skills/design-committee/SKILL.md`
Expected: no hits

Run: `grep -n "util-design-partner-role" skills/design-committee/SKILL.md`
Expected: cite at this section + cite at Integration (line ~157)

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(committee): collapse Translation Gate bullet restatements in SKILL.md to cite"
```

---

## Task 2: Collapse team-lead.md duplicate Translation Gate blocks

**Type:** docs-producing
**Implements:** AC (single authoritative site per concept)
**Decision budget:** 2
**Must remain green:** "Apply silently" instruction survives; cite to util-design-partner-role § PM Litmus Test and § Research Boundary survive (these are already cite-not-restate; do not touch them)

**Load-bearing nuances preserved:**
- Nuance 4: "Apply silently" (team-lead.md:37) — must survive in the merged block.
- team-lead.md §PM Litmus Test (:301-303) and §Research Boundary (:305-308) are already cite-not-restate — leave intact, do not collapse.

**Files:**
- Modify: `skills/design-committee/references/team-lead.md:26-37` (§ Voice) and `skills/design-committee/references/team-lead.md:291-299` (§ Translation Gate in Visible Surface)

**Steps (docs-TDD):**

- [ ] **Step 1: Failing grep — confirm two Translation Gate rule-restatement blocks present**

Run: `grep -n "Translation Gate\|Read-aloud\|Option-naming rule\|No code vocab" skills/design-committee/references/team-lead.md`
Expected: hits at ~lines 30, 291-299 (two restatement sites)

- [ ] **Step 2: Identify "Apply silently" line**

Run: `grep -n "Apply silently\|Do NOT restate" skills/design-committee/references/team-lead.md`
Expected: hit at line 37

- [ ] **Step 3: Edit — collapse the two blocks**

Strategy: keep §Voice (lines 26-37) as the single surviving Translation Gate reference block in team-lead.md. It already carries the "Apply silently" instruction. Replace the §Translation Gate block (lines 291-299) in the Visible Surface section with a one-line cite pointing at §Voice. §Voice itself: trim the bullet list to a single cite line reading `Apply all rules from skills/util-design-partner-role/SKILL.md in full. Do NOT restate rules in packet. Apply silently.`

Rationale: §Voice sits at the top of the document in Role Setup, which is read before convening. §Translation Gate in Visible Surface (~line 291) is a second enforcement point — collapse it to `"Pre-send enforcement: apply Translation Gate per § Voice above (util-design-partner-role full spec)."` That single sentence is sufficient; it cites by heading, does not restate rules.

- [ ] **Step 4: Confirm green — single Translation Gate rule block remains; "Apply silently" present; PM Litmus + Research Boundary still cite-not-restate**

Run: `grep -n "Read-aloud\|No code vocab\|C1 —\|C2 —" skills/design-committee/references/team-lead.md`
Expected: zero or one hit only (the surviving §Voice block, if any one-liner is kept there; ideally zero after collapse to cite)

Run: `grep -n "Apply silently\|Do NOT restate" skills/design-committee/references/team-lead.md`
Expected: hit in §Voice section

Run: `grep -n "PM Litmus\|Research Boundary" skills/design-committee/references/team-lead.md`
Expected: two cite-not-restate lines still present

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md
git commit -m "docs(committee): collapse duplicate Translation Gate blocks in team-lead.md to single cite"
```

---

## Task 3: Collapse SKILL.md § Per-Round Flow to summary + cite

**Type:** docs-producing
**Implements:** AC (single authoritative site; team-lead.md is owner for per-round detail)
**Decision budget:** 2
**Must remain green:** SKILL.md:114 cite pointer to team-lead.md survives (already partially there); step numbers at SKILL.md:116-123 replaced by cite

**Load-bearing nuances preserved:**
- Nuance 1: team-lead.md steps 3 + 11 (ledger + designer-response taxonomy) — these live in team-lead.md (NOT touched this task). Conserving them = not touching team-lead.md's per-round-flow section.
- SKILL.md Per-Round Flow steps already carry partial cite at :114 ("detail in references/team-lead.md"). Collapse to that cite + orchestration-owned items only (TeamCreate, round-folder creation, TeamDelete call).

Note: round-format.md § How To Use is a *different abstraction* (artifact-filling checklist, not dispatch pipeline). Researcher confirmed this is NOT a third Per-Round Flow site. Do NOT touch round-format.md for this task.

**Files:**
- Modify: `skills/design-committee/SKILL.md:112-127` (§ Per-Round Flow + step list + Checkpoint paragraph)

**Steps (docs-TDD):**

- [ ] **Step 1: Failing grep — confirm 8-step list present**

Run: `grep -n "Dispatch\|Members write\|Members signal\|Consolidate\|Synthesize\|Converge\|Author\|Present" skills/design-committee/SKILL.md | head -20`
Expected: 8 step-name hits inside lines 116-123

- [ ] **Step 2: Confirm team-lead.md is authoritative site**

Run: `grep -n "Per-Round Flow" skills/design-committee/references/team-lead.md`
Expected: hit at §§ Per-Round Flow heading (line ~98); 11 steps present

- [ ] **Step 3: Edit — replace 8-step body with summary + cite**

Keep: lines 112-114 (section heading + framing sentence carrying the existing cite pointer "detail in references/team-lead.md").
Replace: lines 115-127 (the 8-step numbered list + Checkpoint paragraph + peer-DM paragraph) with a condensed block:

```
Steps 1–3 are member-side (dispatch, write + peer-DM, signal); steps 4–11 are team-lead-side.
Full step sequence with detail: `references/team-lead.md` § Per-Round Flow.
Checkpoint rule: each step's dispatch carries the prior step's artifact path as required input; absence blocks the next dispatch.
Peer-DM: no team-lead relay during step 2 — exchanges are private between asker and target.
```

Rationale: preserves the orchestration orientation (member-side vs team-lead-side split) and the checkpoint rule (which is a non-negotiable behavioral floor) while pointing to team-lead.md for all detail. team-lead.md already owns the 11-step sequence.

- [ ] **Step 4: Confirm green — 8-step numbered list gone; cite present; checkpoint rule present**

Run: `grep -n "^1\. \*\*Dispatch\|^2\. \*\*Members\|^3\. \*\*Members signal\|^4\. \*\*Consolidate" skills/design-committee/SKILL.md`
Expected: no hits

Run: `grep -n "references/team-lead.md" skills/design-committee/SKILL.md`
Expected: cite in § Per-Round Flow section still present

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(committee): collapse SKILL.md Per-Round Flow to summary + cite; owner = team-lead.md"
```

---

## Task 4: Collapse SKILL.md § Standalone Invocability to single site

**Type:** docs-producing
**Implements:** AC (one authoritative site for standalone rule)
**Decision budget:** 1
**Must remain green:** "no degrade-to-no-op / unconditional path" clause (SKILL.md:146) survives at the single surviving site

**Load-bearing nuances preserved:**
- Nuance 6: SKILL.md:146 "no cutover, no multi-round gate, no degrade-to-no-op" — must be present in the surviving site. Brief proposes keeping Phase 1 (:55-62) as primary + shortening Integration (:158-159). § Standalone Invocability (:142-146) is the target to collapse — its unique "no-degrade" clause must migrate to Phase 1 if § Standalone Invocability is removed, or § Standalone Invocability must be kept (shorter) as the single combined site.
- Conservator recommendation: keep § Standalone Invocability as a short (3-line) definitive statement carrying the "no degrade-to-no-op" clause + a cite to member-protocol for root resolution. Delete the Phase 1 restatement and shorten Integration. One survivor = § Standalone Invocability because it is the most visible label for this rule.

**Files:**
- Modify: `skills/design-committee/SKILL.md:55-62` (Phase 1 — remove standalone restatement)
- Modify: `skills/design-committee/SKILL.md:142-146` (§ Standalone Invocability — condense, keep "no-degrade" clause)
- Modify: `skills/design-committee/SKILL.md:158-159` (Integration "Does NOT call" — shorten to one-line cite)

**Steps (docs-TDD):**

- [ ] **Step 1: Failing grep — confirm 3 standalone sites present**

Run: `grep -n "standalone\|Standalone\|no sprint" skills/design-committee/SKILL.md | head -20`
Expected: hits at ~lines 57, 62, 144-146, 159

- [ ] **Step 2: Confirm "no degrade-to-no-op" clause present**

Run: `grep -n "degrade-to-no-op\|unconditional path" skills/design-committee/SKILL.md`
Expected: hit at line 146

- [ ] **Step 3: Edit — three coordinated edits within one file**

Phase 1 (:57): shorten to `"Read environment + config, then establish the committee/ work-product tree. No sprint creation. See § Standalone Invocability."` — removes restatement, cites the section.

Phase 1 (:62): keep `"Do NOT invoke start-bootstrap."` sentence — this is the operational instruction, not the standalone rule. Short and non-redundant.

§ Standalone Invocability (:142-146): condense to:
```
No entry condition. No sprint context required. Convene from any context.
Phase 1 bootstrap establishes the committee/ tree but creates no sprint and runs no sprint mechanics.
There is one unconditional path — no cutover, no multi-round gate, no degrade-to-no-op.
Committee root resolves per references/member-protocol.md § Committee root resolution.
```

Integration "Does NOT call" (:159): shorten to `"Does NOT call: start-bootstrap, util-worktree, any sprint-creating skill — standalone invocability (§ Standalone Invocability)."` — one line with cite.

- [ ] **Step 4: Confirm green — "no degrade-to-no-op" survives; 3 restatements reduced to 1 site + 2 short cites**

Run: `grep -n "degrade-to-no-op\|unconditional path" skills/design-committee/SKILL.md`
Expected: hit at § Standalone Invocability only (one site)

Run: `grep -n "Standalone Invocability\|standalone" skills/design-committee/SKILL.md`
Expected: heading + 2 short cite references only

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(committee): collapse Standalone Invocability to single site in SKILL.md; preserve no-degrade clause"
```

---

## Task 5: Collapse ephemeral-off-roster restatement in SKILL.md § Integration

**Type:** docs-producing
**Implements:** AC (remove SKILL.md:156 redundant restatement; keep SKILL.md §Consolidator + §Scribe as policy sites; leave team-lead.md steps 4+8 intact)
**Decision budget:** 1
**Must remain green:** team-lead.md steps 4+8 "Agent tool with no team_name" detail NOT touched; SKILL.md §Consolidator (:92) + §Scribe (:96) policy statements survive

**Load-bearing nuances preserved:**
- Nuance 7: team-lead.md steps 4+8 carry "Agent tool / no team_name" operational how — these are owner sites, not touched here.
- SKILL.md §Consolidator + §Scribe: "ephemeral, not roster member" policy statements — these are the correct policy sites. Keep them.
- SKILL.md § Integration :156 is the ONLY site being removed here: `chester:design-committee-consolidator (ephemeral per-round consolidation dispatch, not on the TeamCreate roster); chester:design-committee-scribe (ephemeral per-round authoring dispatch, not on the TeamCreate roster)` — pure restatement of §Consolidator + §Scribe.

**Files:**
- Modify: `skills/design-committee/SKILL.md:156` (Integration §Calls — trim ephemeral restatements to bare agent names)

**Steps (docs-TDD):**

- [ ] **Step 1: Failing grep — confirm Integration line has parenthetical restatement**

Run: `grep -n "ephemeral per-round consolidation dispatch\|ephemeral per-round authoring dispatch" skills/design-committee/SKILL.md`
Expected: hit at line ~156

- [ ] **Step 2: Confirm §Consolidator and §Scribe are the surviving policy sites**

Run: `grep -n "EPHEMERAL\|not on the.*TeamCreate roster" skills/design-committee/SKILL.md`
Expected: hits at lines ~92, 96 (policy statements)

- [ ] **Step 3: Edit — shorten Integration §Calls line for consolidator + scribe**

Replace the parenthetical content after `chester:design-committee-consolidator` and `chester:design-committee-scribe` with bare cites:
```
chester:design-committee-consolidator (ephemeral off-roster dispatch — see § Consolidator);
chester:design-committee-scribe (ephemeral off-roster dispatch — see § Scribe)
```

- [ ] **Step 4: Confirm green — Integration parenthetical restatement gone; policy statements still present**

Run: `grep -n "ephemeral per-round consolidation dispatch\|ephemeral per-round authoring dispatch" skills/design-committee/SKILL.md`
Expected: no hits

Run: `grep -n "EPHEMERAL\|not on the.*TeamCreate roster" skills/design-committee/SKILL.md`
Expected: hits at §Consolidator and §Scribe only

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(committee): trim redundant ephemeral restatement in SKILL.md Integration; cites §Consolidator/§Scribe"
```

---

## Task 6: Collapse SKILL.md § Six Members lens sentences to roster-only

**Type:** docs-producing
**Implements:** AC (lens owned by agent files; SKILL.md keeps roster + TeamCreate membership only)
**Decision budget:** 1
**Must remain green:** agent file invocation paths (e.g. `chester:design-committee-conservator`) remain in SKILL.md; TeamCreate roster block unchanged

**Load-bearing nuances preserved:** agent files carry full lens — dropping 4 compressed one-liners from SKILL.md loses nothing behavioral. skill-contract.md also carries lens (author-only, no runtime cost) — not touched.

**Files:**
- Modify: `skills/design-committee/SKILL.md:29-33` (§ Six Members — drop lens sentences after member name + agent path)

**Steps (docs-TDD):**

- [ ] **Step 1: Failing grep — confirm lens sentences present**

Run: `grep -n "Defends existing structure\|Pushes new framings\|Weighs op cost\|Tests category boundaries" skills/design-committee/SKILL.md`
Expected: hits at lines 29-32

- [ ] **Step 2: Edit — trim each advocacy-member line to name + agent path only**

Example after edit:
```
- Conservator; `chester:design-committee-conservator`.
- Innovator; `chester:design-committee-innovator`.
- Pragmatist; `chester:design-committee-pragmatist`.
- Purist; `chester:design-committee-purist`.
```
Team-Lead, Researcher, Designer lines: keep as-is (they carry non-trivial role constraints, not lens summaries).

- [ ] **Step 3: Confirm green — lens sentences gone; agent paths remain**

Run: `grep -n "Defends existing structure\|Pushes new framings\|Weighs op cost\|Tests category boundaries" skills/design-committee/SKILL.md`
Expected: no hits

Run: `grep -n "chester:design-committee-conservator\|chester:design-committee-innovator" skills/design-committee/SKILL.md`
Expected: hits at § Six Members + TeamCreate block

- [ ] **Step 4: Commit (no step 5 separate — this task is single edit)**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(committee): collapse Six Members to roster-only in SKILL.md; lens owned by agent files"
```

---

## Task 7: Collapse team-lead.md Authority Guard self-check duplication

**Type:** docs-producing
**Implements:** AC (single authority site for warrant rule; self-eval cites rather than restates count-not-a-warrant + strict-premise-scope)
**Decision budget:** 2
**Must remain green:** §Authority Guard lines 319-325 survive intact as policy site; steps 6+7 disk-persistence instructions survive; Self-Evaluation warrant-coverage check survives (it has imperative-form value); count-not-a-warrant + strict-premise-scope in Self-Evaluation collapse to cites

**Load-bearing nuances preserved:**
- team-lead.md steps 6+7 (lines 105-106): "where to write warrants on disk" (alignment-map, verdict) — operational disk-persistence instruction. NOT warrant policy. Keep as-is.
- team-lead.md §Authority Guard (lines 319-325): full policy site — "who supplies warrants, member vs team-lead distinction." Keep as-is, no edits.
- team-lead.md §Self-Evaluation lines 342-344: three Authority Guard self-check bullets. Researcher note: "count-not-a-warrant and strict-premise-scope appear in both §Authority Guard (322-323) and §Self-Evaluation (343-344) — compressible; warrant-coverage check (342) is imperative form with value." Conservator recommendation: collapse 343-344 to cite-lines ("see §Authority Guard / Count-not-a-warrant" and "see §Authority Guard / Strict premise scope") but keep 342 (warrant-coverage check) as a standalone imperative — it adds the "do not supply on member's behalf" reminder that is useful at self-check time.

**Files:**
- Modify: `skills/design-committee/references/team-lead.md:343-344` (Self-Evaluation — two bullets → two cite-lines)

**Steps (docs-TDD):**

- [ ] **Step 1: Failing grep — confirm restatement of count-not-a-warrant + strict-premise-scope in Self-Evaluation**

Run: `grep -n "count is not a warrant\|strict premise scope\|Count-not-a-warrant\|Strict premise" skills/design-committee/references/team-lead.md`
Expected: hits at §Authority Guard (~322-323) AND §Self-Evaluation (~343-344) — two sites each

- [ ] **Step 2: Confirm §Authority Guard is the policy site**

Run: `grep -n "Authority Guard" skills/design-committee/references/team-lead.md`
Expected: hits at §Authority Guard heading + §Self-Evaluation section

- [ ] **Step 3: Edit — replace two Self-Evaluation bullets with cite-lines**

Replace line 343 `"**Authority Guard — count is not a warrant.** Did I let..."` with:
`"**Authority Guard — count is not a warrant.** Apply rule per § Authority Guard / Count-not-a-warrant above."`

Replace line 344 `"**Authority Guard — strict premise scope.** Did I extend..."` with:
`"**Authority Guard — strict premise scope.** Apply rule per § Authority Guard / Strict premise scope above."`

Keep line 342 (warrant-coverage check) intact — it carries "do not supply a warrant on the member's behalf" reminder that is imperative-form value.

- [ ] **Step 4: Confirm green — full rule text for count/premise removed from Self-Evaluation; cite-lines present; §Authority Guard full text untouched**

Run: `grep -n "Did I let an alignment count\|Did I extend a designer premise" skills/design-committee/references/team-lead.md`
Expected: no hits (full rule text removed from Self-Evaluation)

Run: `grep -n "Count-not-a-warrant\|count is never a warrant" skills/design-committee/references/team-lead.md`
Expected: hit at §Authority Guard only (policy site intact)

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md
git commit -m "docs(committee): collapse Self-Evaluation Authority Guard restatements to cites; §Authority Guard is policy site"
```

---

## Task 8: Version bumps

**Type:** docs-producing
**Implements:** AC (version-bump rule: meaningful behavior-preserving changes require bump per CLAUDE.md)
**Decision budget:** 0
**Must remain green:** version fields present and incremented; member-protocol/skill-contract/artifact-template have no version fields (do not add them)

**Files:**
- Modify: `skills/design-committee/SKILL.md:4` (v0020 → v0021)
- Modify: `skills/design-committee/references/team-lead.md:8` (v0011 → v0012)
- Modify: `skills/design-committee/references/committee-analysis-round-format.md:11` (v0001 → v0002)

Note: SKILL.md touched in Tasks 1, 3, 4, 5, 6 → bump once here after all SKILL.md edits land. Same for team-lead.md (Tasks 2, 7). round-format.md NOT touched in the 7 dedup tasks (researcher confirmed its sites are boundary-clause sites, not restatement sites — do not touch round-format.md's content). However round-format.md version bump is listed by brief because it may receive a citation update — only bump if content actually changes. Conservator position: if no edits land in round-format.md from the 7 tasks above, do not bump it.

**Steps (docs-TDD):**

- [ ] **Step 1: Confirm current versions**

Run: `grep -n "^version:" skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md skills/design-committee/references/committee-analysis-round-format.md`
Expected: v0020, v0011, v0001 respectively

- [ ] **Step 2: Edit version fields**

SKILL.md line 4: `version: v0020` → `version: v0021`
team-lead.md line 8: `version: v0011` → `version: v0012`
round-format.md line 11: bump only if round-format.md was edited in tasks 1-7; otherwise skip.

- [ ] **Step 3: Confirm green**

Run: `grep -n "^version:" skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md`
Expected: v0021, v0012

- [ ] **Step 4: Commit**

```bash
git add skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md
git commit -m "docs(committee): version bump SKILL.md v0021, team-lead.md v0012 post-dedup pass"
```

---

## Task 9: Cite-graph verification + byte-count delta report

**Type:** docs-producing
**Implements:** AC (no cite points at deleted/renamed text; measured byte total materially reduced)
**Decision budget:** 0
**Must remain green:** all cites verified valid; byte reduction ≥ 15%

**Files:**
- Read-only verification: all 5 orchestrator runtime files

**Steps:**

- [ ] **Step 1: Verify all outbound cites from SKILL.md still resolve**

Run each heading-anchor cited in SKILL.md against the target file:
```bash
grep -n "§ Per-Round Flow\|§ Output Surfaces\|§ Behavioral Constraints\|§ Closure\|§ Committee root resolution\|§ Final Position\|§ Routing signal\|§ Write-then-send" skills/design-committee/SKILL.md
```
For each cite, verify the referenced heading still exists in the target file:
```bash
grep -n "## Per-Round Flow\|### Output Surfaces\|#### Behavioral Constraints\|### Closure\|## Committee root resolution\|## Final Position\|## Routing signal\|## Write-then-send" skills/design-committee/references/team-lead.md skills/design-committee/references/member-protocol.md
```
Expected: every cited heading present in target file.

- [ ] **Step 2: Verify all outbound cites from team-lead.md still resolve**

```bash
grep -n "§ Committee root resolution\|§ Final Position\|§ Write-then-send\|§ PM Litmus Test\|§ Research Boundary\|§ Voice\|§ Authority Guard" skills/design-committee/references/team-lead.md
```
Verify each heading in target files.

- [ ] **Step 3: Verify all outbound cites from round-format.md still resolve**

```bash
grep -n "§ Final Position\|§ Committee root resolution\|§ Visible Surface" skills/design-committee/references/committee-analysis-round-format.md
```
Verify headings in member-protocol.md and team-lead.md.

- [ ] **Step 4: Byte-count delta report**

```bash
wc -c skills/design-committee/SKILL.md \
       skills/design-committee/references/team-lead.md \
       skills/design-committee/references/member-protocol.md \
       skills/design-committee/references/committee-analysis-round-format.md \
       skills/util-design-partner-role/SKILL.md
```
Compare to baseline (researcher task 1): 79,249 bytes total.
Report: `(baseline - new_total) / baseline * 100`% reduction.
Record actual reduction in commit message.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md
git commit -m "docs(committee): cite-graph verified; byte delta = XX% reduction from 79,249 byte baseline"
```

---

### What Conservator explicitly recommends NOT touching

1. **member-protocol.md** — freeze entirely. It is the authority model. Its headings are cited 6+ times. No edits, no heading renames. Any cite integrity work is read-verify only.

2. **round-format.md content** — the researcher confirmed its "duplicate" sites are boundary-clause sites (Translation Gate boundary, output-surface-split disambiguation) and a different-abstraction document (§ How To Use = artifact-filling checklist). None are safe to delete; none are restatements. The only round-format.md change would be a version bump IF any other task lands a content change there — but the plan above does not edit round-format.md. No round-format.md bump.

3. **team-lead.md §Authority Guard lines 319-325** — policy site, fully intact. The only touch is Self-Evaluation (lines 343-344), replacing full rule text with cite-lines. steps 6+7 disk-persistence instructions also fully intact.

4. **team-lead.md steps 3 + 11** (Per-Round Flow ledger + designer-response taxonomy) — genuinely additional content not in SKILL.md; owned by team-lead.md; untouched by Task 3.

5. **Style Exemplar (team-lead.md lines 215-289)** — brief explicitly rejected trimming. Conservator concurs: long but load-bearing. Not touched.

6. **agent files** — out of scope per brief (separate context windows). Not touched.

---

## Follow-ups

No peer Q&A this round.

---

## Final Position

```
position: minimal-cut dedup preserving all 7 load-bearing nuances; 7 dedup tasks + 1 version-bump task + 1 cite-graph verification task; member-protocol.md frozen; round-format.md content untouched; no heading renames anywhere
rationale: the existing cite-not-restate pattern (member-protocol.md as authority model) is proven and extensible; the 7 nuances the researcher flagged are prior decisions that encode real behavioral constraints — Translation Gate "apply silently," round-format boundary clauses, standalone "no-degrade-to-no-op," team-lead.md "Agent tool / no team_name," Authority Guard policy vs self-check split; collapsing without preserving these nuances would delete behavior, not just words; the plan assigns one concept per task and one commit per task so blast radius is inspectable and reversible
blocking_risk: over-trimming team-lead.md Authority Guard Self-Evaluation could strip the imperative-form warrant-coverage check (line 342) which is NOT a pure restatement — it carries the "do not supply on member's behalf" reminder; task 7 preserves line 342 and only cites-out lines 343-344
warrant:
  type: evidence
  source: researcher-findings.md tasks 3-11 — direct file:line readings of all 5 orchestrator runtime files confirming (a) which sites are genuine restatements vs boundary clauses, (b) which nuances appear at only one site and must survive, (c) full cite-graph adjacency list showing member-protocol.md § Final Position cited 6+ times and § Committee root resolution cited 4+ times — heading renames would break these; researcher decisive findings at tasks 3, 4, 5, 6, 7, 8, 11 are the evidentiary ground for every nuance-preservation call in this plan
```
