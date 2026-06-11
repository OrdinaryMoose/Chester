# Purist transcript — round01
# Sprint: 20260611-01-compact-committee-skill

---

## Position

### Core structural claim: two categories the brief blurs

The brief treats all non-authoritative mentions as "restatements" and proposes to collapse them to cites. That is correct for one category. It is wrong for a second category, and conflating them is the primary risk of the compaction pass.

**Category A — Rule-restatement sites.** File B paraphrases a rule that File A fully defines. File B adds nothing site-specific. Safe to replace with a one-line cite pointing at the owner.

**Category B — Boundary-clause sites.** File B states *where* a rule applies or *does not apply* in its own artifact context. The boundary is not a restatement of the rule; it is a scoping assertion tied to the file's own artifact domain. These must survive, either as explicit scoped cites or as preserved in-situ clauses. If they get collapsed with Category A mentions, the scoping information disappears silently.

The researcher confirmed exactly two boundary-clause sites the brief risks conflating with restatements:

- `round-format.md:101-103` — Translation Gate boundary-clause: which artifact types the Gate applies to vs. does not apply to. Not a restatement of Gate rules. The Gate's rules live in `util-design-partner-role`; this clause is round-format's local jurisdiction declaration.
- `member-protocol.md:67-69` — Translation Gate boundary-clause: transcripts are exempt. This is member-protocol's own jurisdiction declaration. It must not be touched (member-protocol is the authority model and should stay essentially untouched per design).

A third boundary-clause identified by the researcher:
- `round-format.md:108-110` — Output-surface-split disambiguation: "do not conflate with the two-surface usage in sprint 20260521-02." Not a restatement of team-lead.md §Output Surfaces; it is round-format's local disambiguation preventing misread. Must survive in the cite or in the target heading it points at.

Every dedup task below names the owner, then classifies each other mention as **restatement-collapse** or **boundary-preserve (with scope)**.

---

### Ambiguous-category risk: cite pointing into mixed content

The researcher found that `team-lead.md §Voice` (lines 26-37) contains both a rules-restatement list (lines 29-35) AND a boundary clause: "Do NOT restate rules in packet. Apply silently." (line 37). If the entire §Voice block collapses to a one-line cite of `util-design-partner-role`, the "apply silently" instruction (Category B — application-scoped constraint not in util) is silently lost.

Mitigation rule applied in every relevant task below: when a section mixes rule-restatement with application-scoped instruction, the one-line cite retains the application-scoped sentence in-place (not cut), or the cite target is amended to include it.

---

### Plan

**Execution mode:** inline (docs-producing tasks, no TDD harness; verification via grep/wc)

---

# Plan: Compact design-committee skill runtime context

**Sprint:** 20260611-01-compact-committee-skill
**Spec:** design/20260611-01-compact-committee-skill-design-00.md
**Execution mode:** inline

> **For agentic workers:** This is a docs-producing plan — all tasks edit Markdown files. TDD five-step is adapted: grep/wc verifies the duplicate exists → edit collapses to cite → re-grep + byte-delta + cite-graph check confirms. One commit per task.

## Goal

Reduce the per-invocation runtime context cost of `design-committee` by collapsing cross-file and within-file concept restatements to single-owner sites with one-line cites, without removing any behavioral contract.

## Architecture

Single-owner-per-concept with explicit restatement-vs-boundary classification. The `member-protocol.md` cite-not-restate pattern (already operational at lines 77 and 157-160) is the template; apply it to six additional concepts. Boundary-clause sites are classified separately and preserved with explicit scope markers.

## Tech Stack

Markdown file edits only. Verification via `grep`, `wc -c`.

---

## Task 1: Collapse Translation Gate restatements to single owner (util-design-partner-role)

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site; every other mention is a one-line cite
**Decision budget:** 3 (must not drop "apply silently" instruction; must preserve two boundary-clause sites; must keep team-lead.md §PM Litmus + §Research Boundary as-is since researcher confirmed they already cite)
**Must remain green:** cite-graph integrity (no cite pointing at deleted heading)

**Owner declaration:** `skills/util-design-partner-role/SKILL.md` — owns the full Translation Gate spec (read-aloud rule, Option-naming, C1, C2, Stance Principles, PM Litmus, Research Boundary).

**Classification of every other mention:**

- `skills/design-committee/SKILL.md:36-45` §Translation Gate — **restatement-collapse.** Lines 40-43 paraphrase read-aloud, option-naming, C1, C2 from util. Line 45 already cites util as LOAD-BEARING. Replace lines 40-43 with a single sentence; keep line 45 cite. Net: ~4 bullets → 1 sentence + cite.
- `skills/design-committee/references/team-lead.md:26-37` §Voice — **mixed: partial restatement + boundary clause.** Lines 29-35 list rule names (restatement-collapse). Line 28 ("read util-design-partner-role before consolidating") is operational instruction — keep. Line 37 ("Do NOT restate rules in packet. Apply silently.") is application-scoped constraint not in util — **boundary-preserve.** Collapse lines 29-35 to one-line cite; preserve lines 28 and 37 in place.
- `skills/design-committee/references/team-lead.md:291-299` §Translation Gate (second team-lead site) — **restatement-collapse.** Lines 294-299 restate read-aloud, option-naming, no code vocab, C1, C2. Line 293 already cites util. Replace lines 294-299 with zero lines (cite on line 293 is sufficient). Delete the five bullet restatements.
- `skills/design-committee/references/team-lead.md:301-308` §PM Litmus + §Research Boundary — **already cite-not-restate** (researcher confirmed). No edit.
- `skills/design-committee/references/committee-analysis-round-format.md:101-103` §Translation Gate boundary — **boundary-preserve (scope: which artifact types Gate applies to).** This clause scopes Gate jurisdiction to artifact types internal to round-format (applies: scribe's decision-packet; does NOT apply: transcripts, findings, Consolidator output, alignment map, verdict). Keep as-is with explicit note that this is a boundary clause, not a rule restatement.
- `skills/design-committee/references/member-protocol.md:67-69` — **boundary-preserve (scope: transcripts exempt from Gate).** Member-protocol is the authority model; do not touch.

**Ambiguous-category risk:** §Voice mixes restatement with boundary clause — if entire block collapsed, "apply silently" is lost. Mitigation: collapse only lines 29-35; keep 28 and 37.

**Files:**
- Modify: `skills/design-committee/SKILL.md:36-45`
- Modify: `skills/design-committee/references/team-lead.md:26-37`
- Modify: `skills/design-committee/references/team-lead.md:291-299`

**Steps:**

- [ ] **Step 1: Verify duplicates exist (grep)**

  Run: `grep -n "Read.aloud\|Option.naming\|C1\|C2" skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md`
  Expected: hits in SKILL.md:40-43 and team-lead.md:29-35 and team-lead.md:294-299

- [ ] **Step 2: Record pre-edit byte count**

  Run: `wc -c skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md`
  Record baseline.

- [ ] **Step 3: Edit — collapse restatements, preserve boundary clauses**

  In `SKILL.md:36-45`: replace the four bullet restatements (lines 40-43) with one sentence: "Enforce all Translation Gate rules (read-aloud test, Option-naming, C1, C2) — full spec: `skills/util-design-partner-role/SKILL.md` (LOAD-BEARING)." Keep line 45 cite or merge into the single sentence.

  In `team-lead.md:26-37` §Voice: keep line 28 operational instruction; keep line 37 "Apply silently" boundary clause; replace lines 29-35 rule-name list with one-line cite: "Rules: `skills/util-design-partner-role/SKILL.md`."

  In `team-lead.md:291-299` §Translation Gate: delete lines 294-299 bullet restatements. Line 293 cite is sufficient.

- [ ] **Step 4: Verify — re-grep + byte delta + cite-graph check**

  Run: `grep -n "Read.aloud\|Option.naming" skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md`
  Expected: zero hits (rule text gone from both files)

  Run: `grep -n "util-design-partner-role" skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md`
  Expected: cite lines still present

  Run: `grep -n "Apply silently\|Translation Gate boundary" skills/design-committee/references/team-lead.md skills/design-committee/references/committee-analysis-round-format.md`
  Expected: line 37 preserved in team-lead.md; round-format boundary intact

  Run: `wc -c skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md`
  Expected: bytes reduced vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md
  git commit -m "docs: collapse Translation Gate restatements to util-design-partner-role owner; preserve boundary clauses"
  ```

---

## Task 2: Collapse Per-Round Flow restatement (SKILL.md → cite team-lead.md)

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 2 (SKILL.md already cites team-lead.md at line 114; round-format §How To Use is a different abstraction — do not touch)
**Must remain green:** cite-graph: SKILL.md:114 cite of team-lead.md must remain valid

**Owner declaration:** `skills/design-committee/references/team-lead.md` §Per-Round Flow (lines 98-111) — owns the canonical 11-step dispatch pipeline including the three genuinely additional steps (ledger update, checkpoint-as-blocker, designer-response taxonomy) not present in SKILL.md.

**Classification of every other mention:**

- `skills/design-committee/SKILL.md:112-127` §Per-Round Flow — **restatement-collapse (partial).** Line 114 already carries a pointer: "detail in references/team-lead.md." The 8-step list (lines 116-123) is a compressed version of team-lead.md's 11 steps — a restatement that adds no content team-lead.md does not own. Collapse to: brief orientation sentence + one-line cite at line 114. Preserve the orchestration-calls SKILL.md genuinely owns (TeamCreate, round-folder creation, TeamDelete) — these belong at SKILL.md level. Keep the structural dispatch calls; drop the per-step pipeline narrative.
- `skills/design-committee/references/committee-analysis-round-format.md:72-87` §How To Use — **not a per-round-flow restatement.** Researcher confirmed this is an artifact-filling checklist (different abstraction — folder creation, file population order). Do not treat as a third per-round-flow site; do not touch.
- `skills/design-committee/references/committee-analysis-round-format.md:22-44` — introductory narrative on artifact audiences/disciplines. Researcher confirmed: not a dispatch-sequence restatement. Do not touch.

**Files:**
- Modify: `skills/design-committee/SKILL.md:112-127`

**Steps:**

- [ ] **Step 1: Verify duplicate exists**

  Run: `grep -n "Dispatch\|Members write\|Consolidate\|Synthesize\|Converge\|Author\|Present" skills/design-committee/SKILL.md`
  Expected: hits in the 8-step list at lines 116-123

- [ ] **Step 2: Record pre-edit byte count**

  Run: `wc -c skills/design-committee/SKILL.md`
  Record baseline.

- [ ] **Step 3: Edit — collapse 8-step list; keep orchestration-call summary**

  Replace §Per-Round Flow (lines 112-127) with: heading + one orientation sentence (steps 1-3 member-side, steps 4-8 team-lead-side) + one-line cite: "Canonical pipeline: `references/team-lead.md` §Per-Round Flow — single authority for step detail." Retain the line noting SKILL.md's own orchestration calls (TeamCreate, folder creation, TeamDelete) immediately before or after the cite, since these are SKILL.md's structural responsibility.

- [ ] **Step 4: Verify — re-grep + byte delta + cite intact**

  Run: `grep -n "Dispatch\|Members write\|Consolidate\|Synthesize" skills/design-committee/SKILL.md`
  Expected: zero hits (pipeline steps gone)

  Run: `grep -n "team-lead.md.*Per-Round" skills/design-committee/SKILL.md`
  Expected: cite present

  Run: `wc -c skills/design-committee/SKILL.md`
  Expected: bytes reduced vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md
  git commit -m "docs: collapse Per-Round Flow restatement in SKILL.md to cite of team-lead.md owner"
  ```

---

## Task 3: Collapse Output-surface-split restatement; preserve round-format disambiguation clause

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 2 (SKILL.md:122 already partially cites team-lead.md; round-format disambiguation clause must survive)
**Must remain green:** cite-graph: SKILL.md:122 cite of team-lead.md §Output Surfaces

**Owner declaration:** `skills/design-committee/references/team-lead.md` §Output Surfaces (lines 152-159) — owns the authoritative definition of the output-surface split (decision-communication packet vs. end-of-turn session artifact).

**Classification of every other mention:**

- `skills/design-committee/SKILL.md:122` — **restatement-collapse (already partially deduped).** Line 122 already ends with a cite `(§ references/team-lead.md Output Surfaces)`. The prose before the cite in line 122 restates the locked-format / no-mandated-format distinction — same content as team-lead.md:154-159. Trim the prose to "dispatches ephemeral scribe; output-surface split governs format — see `references/team-lead.md §Output Surfaces`."
- `skills/design-committee/references/committee-analysis-round-format.md:104-110` — **boundary-preserve (scope: disambiguation of term overlap with sprint 20260521-02).** Lines 108-110 carry: "This output-surface split is a distinct concept from the 'two-surface' usage in sprint 20260521-02-design-architect-committee — do not conflate the two terms." This disambiguation clause is round-format-local and not present in team-lead.md. **Must survive.** Options: (a) keep in round-format as a scoped cite — "Output-surface split definition: `references/team-lead.md §Output Surfaces`. Note: distinct from the 'two-surface' usage in sprint 20260521-02 — do not conflate." (b) move disambiguation into team-lead.md §Output Surfaces heading as a note. Option (a) preferred — keeps round-format's local disambiguation in its natural location without editing team-lead.md for round-format concerns.

**Ambiguous-category risk:** None. Lines 104-107 and 108-110 are cleanly separable — definition restatement vs. disambiguation note.

**Files:**
- Modify: `skills/design-committee/SKILL.md:122`
- Modify: `skills/design-committee/references/committee-analysis-round-format.md:104-110`

**Steps:**

- [ ] **Step 1: Verify duplicates exist**

  Run: `grep -n "output.surface split\|locked format\|no mandated format" skills/design-committee/SKILL.md skills/design-committee/references/committee-analysis-round-format.md`
  Expected: hits in SKILL.md:122 and round-format:104-107

- [ ] **Step 2: Record pre-edit byte count**

  Run: `wc -c skills/design-committee/SKILL.md skills/design-committee/references/committee-analysis-round-format.md`
  Record baseline.

- [ ] **Step 3: Edit — collapse restatements; preserve disambiguation**

  In `SKILL.md:122`: trim prose restatement; keep scribe-dispatch sentence + cite to team-lead.md §Output Surfaces.

  In `round-format.md:104-110`: replace lines 104-107 (definition restatement) with one-line cite: "Output-surface split definition: `references/team-lead.md` §Output Surfaces." Preserve lines 108-110 disambiguation clause verbatim or inline it with the cite: "…(distinct from the 'two-surface' usage in sprint 20260521-02 — do not conflate)."

- [ ] **Step 4: Verify — re-grep + byte delta + cite intact + disambiguation intact**

  Run: `grep -n "locked format\|no mandated format" skills/design-committee/SKILL.md skills/design-committee/references/committee-analysis-round-format.md`
  Expected: zero hits (definition prose gone)

  Run: `grep -n "20260521\|do not conflate" skills/design-committee/references/committee-analysis-round-format.md`
  Expected: disambiguation clause still present

  Run: `wc -c skills/design-committee/SKILL.md skills/design-committee/references/committee-analysis-round-format.md`
  Expected: bytes reduced vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md skills/design-committee/references/committee-analysis-round-format.md
  git commit -m "docs: collapse output-surface-split restatements to team-lead.md owner; preserve round-format disambiguation clause"
  ```

---

## Task 4: Collapse Standalone/no-sprint restatements within SKILL.md

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 2 (§Standalone Invocability line 146 carries "no degrade-to-no-op" not in other sites — must be preserved in the single owner)
**Must remain green:** "no degrade-to-no-op" rule visible in the surviving site

**Owner declaration:** `skills/design-committee/SKILL.md` §Standalone Invocability (lines 142-146) — owns the full standalone statement including the unconditional-path / no-degrade-to-no-op rule unique to that site.

**Classification of every other mention (all within SKILL.md):**

- `skills/design-committee/SKILL.md:55-57` Phase 1 — **restatement-collapse.** "Preserves standalone invocability" and "Do NOT invoke start-bootstrap" at lines 57, 62 are compressed restatements of §Standalone Invocability. Phase 1 step 4 (line 62) adds "sprint mechanics violate standalone invocability when no sprint exists" — useful context. After collapse: Phase 1 keeps one line "standalone invocability preserved — see §Standalone Invocability" plus the "Do NOT invoke start-bootstrap" prohibition (operational instruction worth keeping in Phase 1 for proximity to the action).
- `skills/design-committee/SKILL.md:158-159` Integration "Does NOT call" — **restatement-collapse (partial).** "No start-bootstrap, no sprint directory" restates the same rule. Collapse to: "Does NOT call: `start-bootstrap`, `util-worktree`, any sprint-creating skill — see §Standalone Invocability."

Note: all three sites are within the same file; this task reduces intra-file duplication, not cross-file duplication.

**Files:**
- Modify: `skills/design-committee/SKILL.md:55-62` and `skills/design-committee/SKILL.md:142-146` and `skills/design-committee/SKILL.md:158-159`

**Steps:**

- [ ] **Step 1: Verify all three sites exist**

  Run: `grep -n "standalone invocab\|no sprint\|start-bootstrap" skills/design-committee/SKILL.md`
  Expected: hits at Phase 1 (~line 57, 62), §Standalone Invocability (~lines 142-146), Integration (~line 159)

- [ ] **Step 2: Record pre-edit byte count**

  Run: `wc -c skills/design-committee/SKILL.md`
  Record baseline.

- [ ] **Step 3: Edit — consolidate to §Standalone Invocability; trim Phase 1 + Integration**

  §Standalone Invocability (lines 142-146): amend to be the single owner — ensure "no degrade-to-no-op / unconditional path" rule is explicit. No other changes needed here.

  Phase 1 (lines 55-62): replace the standalone-invocability prose with one-line cite to §Standalone Invocability; keep "Do NOT invoke start-bootstrap" as a direct operational prohibition (not a mere cite — proximity to action is load-bearing).

  Integration "Does NOT call" (lines 158-159): collapse repetitive prose to "Does NOT call: `start-bootstrap`, `util-worktree`, any sprint-creating skill (§Standalone Invocability)."

- [ ] **Step 4: Verify — re-grep + byte delta + "no degrade-to-no-op" preserved**

  Run: `grep -n "standalone invocab" skills/design-committee/SKILL.md`
  Expected: hits only in §Standalone Invocability (single owner) + one-line cites in Phase 1 + Integration

  Run: `grep -n "degrade.to.no.op\|unconditional path" skills/design-committee/SKILL.md`
  Expected: hit in §Standalone Invocability (owner site)

  Run: `wc -c skills/design-committee/SKILL.md`
  Expected: bytes reduced vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md
  git commit -m "docs: collapse standalone/no-sprint restatements within SKILL.md to §Standalone Invocability owner"
  ```

---

## Task 5: Collapse Ephemeral-off-roster restatements; keep policy/mechanism split intact

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 3 (policy vs mechanism are distinct content; SKILL.md §Integration line 156 is genuinely redundant; team-lead steps 4+8 carry "Agent tool / no team_name" not in SKILL.md policy sites)
**Must remain green:** team-lead step 4 "no team_name" instruction preserved; SKILL.md §Consolidator policy statement preserved

**Owner declaration:** Two-tier ownership is appropriate here because the researcher established that policy and mechanism are genuinely different content:

- **Policy owner:** `skills/design-committee/SKILL.md` §Consolidator (line 92) — "EPHEMERAL per-round dispatch, NOT a member of the TeamCreate roster." This is the why.
- **Mechanism owner:** `skills/design-committee/references/team-lead.md` steps 4 + 8 (lines 103, 107) — "Agent tool with no team_name, off-roster one-shot." This is the how.

**Classification of every other mention:**

- `skills/design-committee/SKILL.md:96` §Scribe — **restatement-collapse.** "Like the Consolidator, EPHEMERAL…NOT a member of the TeamCreate roster" — same content as §Consolidator:92. Collapse to: "Off-roster ephemeral dispatch — same rule as §Consolidator (line 92)." One-line cite to §Consolidator.
- `skills/design-committee/SKILL.md:156` §Integration — **restatement-collapse.** "ephemeral per-round consolidation dispatch, not on the TeamCreate roster" — restates §Consolidator:92 and §Scribe:96. Collapse to: "Consolidator + Scribe: ephemeral off-roster (see §Consolidator)."
- `skills/design-committee/references/team-lead.md:103` step 4 — **boundary-preserve (scope: operational dispatch mechanism — Agent tool, no team_name).** Not a restatement of SKILL.md policy. Keep as-is.
- `skills/design-committee/references/team-lead.md:107` step 8 — **boundary-preserve (scope: same mechanism for scribe dispatch).** Keep as-is; its back-reference to step 4 is already compact.

**Files:**
- Modify: `skills/design-committee/SKILL.md:96`
- Modify: `skills/design-committee/SKILL.md:156`

**Steps:**

- [ ] **Step 1: Verify all sites exist**

  Run: `grep -n "EPHEMERAL\|ephemeral\|off-roster\|TeamCreate roster" skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md`
  Expected: hits at SKILL.md:92, 96, 156 and team-lead.md:103, 107

- [ ] **Step 2: Record pre-edit byte count**

  Run: `wc -c skills/design-committee/SKILL.md`
  Record baseline.

- [ ] **Step 3: Edit — collapse §Scribe and §Integration; keep §Consolidator + team-lead steps**

  `SKILL.md:96` §Scribe: replace multi-sentence restatement with one-line cite to §Consolidator:92.

  `SKILL.md:156` §Integration: replace repeated "ephemeral…not on the TeamCreate roster" with "Consolidator + Scribe: ephemeral off-roster dispatches (see §Consolidator)."

- [ ] **Step 4: Verify — re-grep + byte delta + team-lead steps untouched**

  Run: `grep -n "EPHEMERAL\|ephemeral" skills/design-committee/SKILL.md`
  Expected: hit at line 92 (policy owner) only; lines 96 and 156 collapsed

  Run: `grep -n "no.*team_name\|Agent tool" skills/design-committee/references/team-lead.md`
  Expected: hits at steps 4 and 8 (mechanism preserved)

  Run: `wc -c skills/design-committee/SKILL.md`
  Expected: bytes reduced vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md
  git commit -m "docs: collapse ephemeral-off-roster restatements in SKILL.md to §Consolidator policy owner; team-lead mechanism sites preserved"
  ```

---

## Task 6: Collapse Authority-Guard/Warrant restatements within team-lead.md

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 3 (disk-persistence instructions in steps 6+7 are operationally distinct from policy; §Self-Evaluation imperative form is useful in-situ but can cite; count-not-a-warrant appears in three sites)
**Must remain green:** §Authority Guard (lines 319-325) remains as policy owner; step 6 alignment-map write instruction survives; step 7 verdict.md audit requirement survives

**Owner declaration:** `skills/design-committee/references/team-lead.md` §Authority Guard (lines 319-325) — owns the warrant policy: member-supplied, team-lead-verified, not team-lead-originated; count-not-a-warrant; C2 firewall; C1 audit; warrants on disk.

**Classification of every other mention:**

- `skills/design-committee/references/team-lead.md:105` step 6 — **boundary-preserve (scope: disk-persistence instruction — write warrant record to alignment-map.md).** Defines warrant types in context of writing the alignment-map. The "write warrant types + demotion rule here" instruction is operational and belongs at step 6 for proximity. Keep operational disk-persistence sentence; trim only if step 6 restates the policy definition (who supplies warrants etc.) rather than the write instruction.
- `skills/design-committee/references/team-lead.md:106` step 7 — **boundary-preserve (scope: disk-persistence — carry warrant record into verdict.md for auditability).** "Warrants auditable on disk, not held only in context" is the step's own audit-trail instruction. Keep as-is.
- `skills/design-committee/references/team-lead.md:121-123` §Behavioral Constraints — count-not-a-warrant + strict-premise-scope appear here as behavioral prohibitions. Researcher identified these as a third site for count-not-a-warrant. **Restatement-collapse:** replace with one-line cite to §Authority Guard: "Warrant discipline per §Authority Guard (below) — member-supplies, team-lead verifies; count is not a warrant; premise scope strictly bounded."
- `skills/design-committee/references/team-lead.md:342-344` §Self-Evaluation — three bullet imperative-form self-check items. These are the actionable runtime-check form of §Authority Guard policy. **Partial-restatement-collapse:** the check questions themselves are useful in situ (imperative form is not the same as policy definition). Collapse the definitional content embedded in checks (e.g. repeated warrant-definition sentences); keep check-question imperative form with an inline cite: "Authority Guard — warrant coverage (per §Authority Guard): does every assertion…" One-sentence cite header + question form retained.

**Ambiguous-category risk:** steps 6+7 mix disk-persistence instruction with policy definition sentences. If the whole step is labelled "boundary-preserve," policy restatements inside the step survive. Mitigation: read each step 6+7 sentence individually; collapse only sentences that restate §Authority Guard policy; keep sentences that are write-instructions.

**Files:**
- Modify: `skills/design-committee/references/team-lead.md:121-123`
- Modify: `skills/design-committee/references/team-lead.md:342-344`
- (Possibly) Modify: `skills/design-committee/references/team-lead.md:105-106` if policy-restatement sentences are mixed into the disk-write instructions

**Steps:**

- [ ] **Step 1: Verify all four sites exist**

  Run: `grep -n "warrant\|Authority Guard\|count.*not.*warrant\|count is not" skills/design-committee/references/team-lead.md`
  Expected: hits at steps 6/7 (~105-106), §Behavioral Constraints (~121-123), §Authority Guard (~319-325), §Self-Evaluation (~342-344)

- [ ] **Step 2: Record pre-edit byte count**

  Run: `wc -c skills/design-committee/references/team-lead.md`
  Record baseline.

- [ ] **Step 3: Edit — collapse Behavioral Constraints restatements; trim Self-Evaluation embedded definitions**

  `team-lead.md:121-123` §Behavioral Constraints: replace restatement bullets with one-line cite to §Authority Guard.

  `team-lead.md:342-344` §Self-Evaluation: retain imperative check questions; trim any embedded policy-definition sentences; add inline cite header.

  `team-lead.md:105-106` steps 6+7: read each sentence; trim only sentences that are pure restatements of §Authority Guard definitional content. Preserve disk-persistence write instructions.

- [ ] **Step 4: Verify — re-grep + byte delta + §Authority Guard policy intact**

  Run: `grep -n "member-supplied\|team-lead.*verif" skills/design-committee/references/team-lead.md`
  Expected: hits only in §Authority Guard (~319-325); collapsed sites reference §Authority Guard, not restate policy

  Run: `grep -c "warrant" skills/design-committee/references/team-lead.md`
  Expected: count reduced vs pre-edit (restatements gone)

  Run: `wc -c skills/design-committee/references/team-lead.md`
  Expected: bytes reduced vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/references/team-lead.md
  git commit -m "docs: collapse Authority-Guard/warrant restatements within team-lead.md to §Authority Guard owner"
  ```

---

## Task 7: Reduce SKILL.md §Six Members to roster-only (drop per-member lens sentences)

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 1 (agent files own full lens; SKILL.md compressed summaries are 4 one-liners — small but genuinely redundant with agent files)
**Must remain green:** roster agent-ID strings and TeamCreate membership split (advocacy vs support) preserved

**Owner declaration:** `agents/design-committee-{member}.md` files — own full lens sections per member.

**Classification of every other mention:**

- `skills/design-committee/SKILL.md:29-33` §Six Members lens one-liners — **restatement-collapse.** 4 lines of compressed lens content. Each agent file carries the full lens. Collapse to roster-only: name, agent ID, advocacy-vs-support role. No lens summary sentences.
- `skills/design-committee/references/skill-contract.md:31-34` — **no action.** Author-only file, not orchestrator runtime context. Researcher confirmed no orchestrator cost. Do not touch.

**Files:**
- Modify: `skills/design-committee/SKILL.md:29-33`

**Steps:**

- [ ] **Step 1: Verify lens sentences exist**

  Run: `grep -n "Defends existing\|Pushes new\|Weighs op cost\|Tests category" skills/design-committee/SKILL.md`
  Expected: hits at lines 29-32

- [ ] **Step 2: Record pre-edit byte count**

  Run: `wc -c skills/design-committee/SKILL.md`
  Record baseline.

- [ ] **Step 3: Edit — remove lens sentences, keep roster**

  In §Six Members (lines 29-33): retain name + agent-ID + advocacy/support classification. Remove the lens-summary sentence from each entry. Result: four clean roster lines with no lens prose.

- [ ] **Step 4: Verify — re-grep + byte delta**

  Run: `grep -n "Defends existing\|Pushes new\|Weighs op cost\|Tests category" skills/design-committee/SKILL.md`
  Expected: zero hits

  Run: `grep -n "chester:design-committee-conservator\|chester:design-committee-innovator" skills/design-committee/SKILL.md`
  Expected: roster agent IDs still present

  Run: `wc -c skills/design-committee/SKILL.md`
  Expected: bytes reduced vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md
  git commit -m "docs: reduce SKILL.md §Six Members to roster-only; lens owned by agent files"
  ```

---

## Task 8: Version-bump all touched files

**Type:** docs-producing
**Implements:** AC — touched files carry a correct version bump
**Decision budget:** 1 (three reference files have no version field — add field when bumping)
**Must remain green:** frontmatter YAML valid in all bumped files

**Version bump targets (derived from researcher Task 13 findings):**

- `skills/design-committee/SKILL.md` — currently `v0020` → bump to `v0021`
- `skills/design-committee/references/team-lead.md` — currently `v0011` → bump to `v0012`
- `skills/design-committee/references/committee-analysis-round-format.md` — currently `v0001` → bump to `v0002`
- `skills/design-committee/references/member-protocol.md` — no version field. NOT touched by this sprint (it is the authority model — researcher confirmed it should stay essentially untouched). No version bump needed.
- `skills/util-design-partner-role/SKILL.md` — NOT touched by this sprint (Translation Gate owner; this sprint only adds cites pointing at it, not content changes). No version bump.

**Files:**
- Modify: `skills/design-committee/SKILL.md` frontmatter
- Modify: `skills/design-committee/references/team-lead.md` frontmatter
- Modify: `skills/design-committee/references/committee-analysis-round-format.md` frontmatter

**Steps:**

- [ ] **Step 1: Verify current version fields**

  Run: `grep -n "^version:" skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md skills/design-committee/references/committee-analysis-round-format.md`
  Expected: v0020, v0011, v0001

- [ ] **Step 2: Edit — bump each version field**

  SKILL.md: `version: v0020` → `version: v0021`
  team-lead.md: `version: v0011` → `version: v0012`
  round-format.md: `version: v0001` → `version: v0002`

- [ ] **Step 3: Verify — re-grep**

  Run: `grep -n "^version:" skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md skills/design-committee/references/committee-analysis-round-format.md`
  Expected: v0021, v0012, v0002

- [ ] **Step 4: (No test step — version bump is trivially verifiable)**

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md skills/design-committee/references/committee-analysis-round-format.md
  git commit -m "chore: version-bump SKILL.md v0021, team-lead.md v0012, round-format.md v0002 after compaction pass"
  ```

---

## Task 9: Final cite-graph integrity and byte-delta verification

**Type:** docs-producing
**Implements:** AC — no cite references deleted or renamed text; measured runtime-file byte total materially reduced (target ~25%); report actual
**Decision budget:** 0 (verification only, no edits)
**Must remain green:** all cite targets exist; byte delta meets target

**This task is verification-only — no file edits. Runs after all previous tasks committed.**

**Files:**
- Read: all five orchestrator-load files (SKILL.md, team-lead.md, member-protocol.md, round-format.md, util-design-partner-role/SKILL.md)

**Steps:**

- [ ] **Step 1: Full byte count on all five orchestrator files**

  Run: `wc -c skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md skills/design-committee/references/member-protocol.md skills/design-committee/references/committee-analysis-round-format.md skills/util-design-partner-role/SKILL.md`

  Baseline (from researcher Task 1): 15,379 + 31,112 + 7,224 + 11,537 + 14,997 = 80,249 bytes
  (Note: researcher total was 79,249 — recheck arithmetic; use wc output as truth)

  Target: ≥ ~20KB reduction (≥25% of the 4 in-scope files' 65,252-byte subtotal = ≥16,313 bytes)

  Report: "Pre-compaction: Xb. Post-compaction: Yb. Delta: Zb (N%)."

- [ ] **Step 2: Verify all cites in SKILL.md point at existing headings**

  Run: `grep -n "references/team-lead.md §\|references/member-protocol.md §\|util-design-partner-role" skills/design-committee/SKILL.md`

  For each heading cited, verify the heading exists in the target file:
  Run: `grep -n "^###\|^##\|^#" skills/design-committee/references/team-lead.md`
  Confirm: §Output Surfaces, §Per-Round Flow, §Authority Guard, §Behavioral Constraints, §Standalone Invocability all present and not renamed.

- [ ] **Step 3: Verify all cites in team-lead.md point at existing headings**

  Run: `grep -n "member-protocol.md §\|util-design-partner-role\|round-format" skills/design-committee/references/team-lead.md`
  Confirm: cited heading names match headings in target files.

- [ ] **Step 4: Verify boundary-clause sites intact**

  Run: `grep -n "Translation Gate boundary\|does NOT apply\|do not conflate\|20260521" skills/design-committee/references/committee-analysis-round-format.md`
  Expected: round-format boundary clause intact

  Run: `grep -n "Translation Gate does not apply\|Transcripts are internal" skills/design-committee/references/member-protocol.md`
  Expected: member-protocol boundary clause intact (untouched)

  Run: `grep -n "Apply silently\|not restate rules" skills/design-committee/references/team-lead.md`
  Expected: team-lead §Voice boundary clause intact

- [ ] **Step 5: Commit verification record**

  Write byte-delta report as a comment in the sprint summary or as a note in the commit message.

  ```bash
  git add skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md skills/design-committee/references/committee-analysis-round-format.md
  # (Only if any cite-repair edits were needed — otherwise no files staged)
  git commit -m "docs: cite-graph verification pass — all cites valid, byte delta [N]b ([M]%)"
  ```

---

## Follow-ups

No peer Q&A this round.

---

## Final Position

```
position: single-owner-per-concept with explicit restatement-vs-boundary classification
rationale: the brief's "collapse to cite" instruction is correct for rule-restatement
  sites but wrong if applied uniformly — the researcher confirmed three boundary-clause
  sites (round-format:101-103, round-format:108-110, team-lead:37) that are not
  restatements and must survive; the plan tasks classify every mention explicitly as
  restatement-collapse or boundary-preserve so no scoping information disappears
  silently; two-tier ownership (policy / mechanism) for the ephemeral-off-roster
  concept prevents collapsing genuinely distinct content; the §Voice mixed-content
  risk is named and mitigated per task
blocking_risk: plan-attack may find that task decision budgets underestimate ambiguity
  in team-lead.md steps 6+7 (mixed policy/mechanism sentences are hard to separate
  by inspection alone without running the edit)
warrant:
  type: evidence
  source: researcher-findings.md Task 4 (Translation Gate boundary clauses at
    round-format:101-103 and member-protocol:67-69), Task 5 (output-surface
    disambiguation at round-format:108-110), Task 4 (team-lead:37 "Apply silently"),
    Task 7 (policy/mechanism split for ephemeral-off-roster), Task 8 (warrant/
    Authority-Guard site-function differences); all evidence is direct file-line
    citations from the researcher's ground-truth findings
```
