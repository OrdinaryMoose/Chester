# Plan: Compact design-committee Skill Runtime Context

**Sprint:** 20260611-01-compact-committee-skill
**Spec:** `docs/chester/working/20260611-01-compact-committee-skill/design/20260611-01-compact-committee-skill-design-00.md`
**Execution mode:** inline

> **For agentic workers:** This is a docs-producing plan — all tasks edit Markdown files. TDD five-step is adapted: grep/wc confirms the duplicate exists → edit collapses to cite → re-grep + byte-delta + cite-graph check confirms. One commit per task.

## Goal

Reduce the per-invocation runtime context cost of `design-committee` by collapsing cross-file and within-file concept restatements to single-owner sites with one-line cites, without removing any behavioral contract.

## Architecture

Single-owner-per-concept with explicit restatement-vs-boundary classification. The `member-protocol.md` cite-not-restate pattern (already operational at lines 77 and 157-160) is the template; apply it to six additional concepts. Boundary-clause sites are classified separately and preserved with explicit scope markers. Two-tier ownership applies where policy and mechanism are genuinely distinct (ephemeral-off-roster). Corrected baseline: ~77KB / 80,249 bytes across five orchestrator-load files (SKILL.md 15,379 + team-lead.md 31,112 + member-protocol.md 7,224 + round-format.md 11,537 + util-design-partner-role/SKILL.md 14,997).

## Tech Stack

Markdown file edits only. Verification via `grep`, `wc -c`.

---

## Round02 Corrections (BINDING — supersedes any stale line number below)

Round02 committee validation + a re-grounding against current files (sprint `20260611-02-fix-dispatch-discipline` merged after this plan was written and shifted SKILL.md). These corrections are authoritative; where the per-task prose below cites an old line number, the grep-anchored Steps re-locate the content and these corrections govern.

- **Designer target ruling: option (a) — ship the dedup pass as the win.** The ~4% / unreachable-25% gap is accepted; execute.
- **Baseline refreshed.** Current runtime total is **81,579 bytes** (was 80,249); SKILL.md is **16,551** (was 15,379) — sprint -02 grew it. Task 9 measures delta against 81,579.
- **Task 6 — collapse targets are §Behavioral Constraints lines 122-123 and §Self-Evaluation lines 343-345 only.** Line 121 (most-informative-answer bullet) is unique content — do NOT collapse it. Steps 6+7 (`team-lead.md:106-107`) are disk-write instructions — do NOT trim them (round02 4-0). team-lead.md is unchanged (v0011) so these numbers are current.
- **Task 7 — designer decision (b): round-format scoped OUT.** Do ONLY the SKILL.md edit, at **line 139** (not 122 — line 122 is the roster-only rule). Leave `committee-analysis-round-format.md` frozen.
- **Task 8 versions:** SKILL.md **v0021 → v0022**; team-lead.md **v0011 → v0012**; round-format.md **NOT bumped** (scoped out).
- **SKILL.md line drift (Tasks 2/3):** §Consolidator owner ≈106, §Scribe ≈110, §Integration ephemeral ≈173, §Standalone ≈161, "Does NOT call" ≈176. Use the Step greps, not the old numbers.

---

## Decision Required (resolved — see Round02 Corrections above)

**Designer ruled option (a): ship the dedup pass. Execution authorized.**

The brief's 25% / ~19KB reduction target is unreachable by dedup alone:

- The corrected baseline is 80,249 bytes (~77KB) across five orchestrator-load files.
- Dedup — collapsing all cross-file and within-file concept restatements to single-owner cites — achieves approximately **~3–3.5KB (~4%)**, not 25%.
- Most of the 77KB is unique, load-bearing content. The duplication that exists is real but modest in absolute bytes.
- The ~4% saving is the full scope of what the nine tasks below deliver. No further dedup is available without touching behavioral contracts.

Three paths forward — the designer chooses one:

- **(a)** Ship the ~4% dedup pass as the win. Accept that the brief's target was wrong; execute the nine tasks below.
- **(b)** Ship the ~4% dedup pass AND scope a structural pass as a separate sprint. A structural pass (e.g., moving rarely-needed always-loaded content to on-demand reads) could reach a larger saving, but it is a contract-touching change requiring its own design review.
- **(c)** Stop. ~4% is not worth the edit risk.

---

## Tasks

---

## Task 1: Reduce SKILL.md §Six Members to roster-only (drop per-member lens sentences)

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site; agent files own full lens content
**Decision budget:** 1 (only Conservator/Innovator/Pragmatist/Purist lines shortened; Team-Lead and Researcher lines carry unique content not in agent files and are NOT shortened)
**Must remain green:** roster agent-ID strings and TeamCreate membership split (advocacy vs support) preserved

**Owner declaration:** `agents/design-committee-{member}.md` files — own full lens sections per member.

**Classification of every other mention:**

- `skills/design-committee/SKILL.md:29-33` §Six Members lens one-liners — **restatement-collapse.** 4 lines of compressed lens content. Each agent file carries the full lens. Collapse to roster-only: name, agent ID, advocacy-vs-support role. No lens summary sentences.
- `skills/design-committee/references/skill-contract.md:31-34` — no action. Author-only file, not orchestrator runtime context. No orchestrator cost. Do not touch.

**Saving estimate:** ~200 bytes / ~4 lines
**Risk note:** Very low. Agent files carry full lens sections confirmed by researcher. TeamCreate roster block is untouched. No cites point into the lens sentences themselves.

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

  In §Six Members (lines 29-33): retain name + agent-ID + advocacy/support classification. Remove the lens-summary sentence from each Conservator/Innovator/Pragmatist/Purist entry. Result: four clean roster lines with no lens prose. Team-Lead and Researcher entries are not shortened.

- [ ] **Step 4: Verify — re-grep + byte delta**

  Run: `grep -n "Defends existing\|Pushes new\|Weighs op cost\|Tests category" skills/design-committee/SKILL.md`
  Expected: zero hits

  Run: `grep -n "chester:design-committee-conservator\|chester:design-committee-innovator" skills/design-committee/SKILL.md`
  Expected: roster agent IDs still present

  Run: `wc -c skills/design-committee/SKILL.md`
  Expected: bytes reduced ~200 bytes vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md
  git commit -m "docs: reduce SKILL.md §Six Members to roster-only; lens owned by agent files"
  ```

---

## Task 2: Collapse Integration ephemeral restatement within SKILL.md

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 1
**Must remain green:** §Consolidator (line 92) and §Scribe (line 96) policy statements preserved

**Owner declaration:** `skills/design-committee/SKILL.md` §Consolidator (line 92) and §Scribe (line 96) — policy sites for ephemeral off-roster dispatch within SKILL.md.

**Classification of every other mention:**

- `skills/design-committee/SKILL.md:156` §Integration — **restatement-collapse.** "ephemeral per-round consolidation dispatch, not on the TeamCreate roster" restates §Consolidator:92 and §Scribe:96. Collapse to cite: "Consolidator + Scribe: ephemeral off-roster dispatches (§ Consolidator above)."

**Saving estimate:** ~150 bytes / ~1 line trimmed
**Risk note:** Very low. §Consolidator (line 92) and §Scribe (line 96) carry the policy; the Integration line is the only redundant third site within SKILL.md. No cites in other files point to Integration's ephemeral clause specifically.

**Files:**
- Modify: `skills/design-committee/SKILL.md:156`

**Steps:**

- [ ] **Step 1: Verify all three SKILL.md ephemeral sites exist**

  Run: `grep -n "EPHEMERAL\|ephemeral\|not on the.*roster\|off-roster" skills/design-committee/SKILL.md`
  Expected: hits at line 92 (§Consolidator), line 96 (§Scribe), line 156 (§Integration)

- [ ] **Step 2: Record pre-edit byte count**

  Run: `wc -c skills/design-committee/SKILL.md`
  Record baseline.

- [ ] **Step 3: Edit — collapse Integration line to cite**

  `SKILL.md:156`: replace the parenthetical "ephemeral per-round…not on the TeamCreate roster" prose with a pointer back to §Consolidator: "(§ Consolidator above)" for both the Consolidator and Scribe entries.

- [ ] **Step 4: Verify — re-grep + byte delta**

  Run: `grep -n "ephemeral\|not on the.*roster" skills/design-committee/SKILL.md`
  Expected: 0 matches on line 156; lines 92+96 still match

  Run: `wc -c skills/design-committee/SKILL.md`
  Expected: bytes reduced ~150 bytes vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md
  git commit -m "docs: collapse Integration ephemeral restatement to cite of §Consolidator/§Scribe"
  ```

---

## Task 3: Collapse Standalone/no-sprint restatements within SKILL.md

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 2 (§Standalone Invocability line 146 carries "no degrade-to-no-op" not in other sites — must be preserved in the single owner)
**Must remain green:** "no degrade-to-no-op" rule visible in the surviving site

**Owner declaration:** `skills/design-committee/SKILL.md` §Standalone Invocability (lines 142-146) — owns the full standalone statement including the unconditional-path / no-degrade-to-no-op rule unique to that site.

**Classification of every other mention (all within SKILL.md):**

- `skills/design-committee/SKILL.md:55-57` Phase 1 — **restatement-collapse.** "Preserves standalone invocability" and "Do NOT invoke start-bootstrap" are compressed restatements of §Standalone Invocability. Phase 1 step 4 (line 62) adds "sprint mechanics violate standalone invocability when no sprint exists" — useful context. After collapse: Phase 1 keeps one line "standalone invocability preserved — see §Standalone Invocability" plus the "Do NOT invoke start-bootstrap" prohibition (operational instruction worth keeping in Phase 1 for proximity to the action).
- `skills/design-committee/SKILL.md:158-159` Integration "Does NOT call" — **restatement-collapse (partial).** "No start-bootstrap, no sprint directory" restates the same rule. Collapse to: "Does NOT call: `start-bootstrap`, `util-worktree`, any sprint-creating skill — see §Standalone Invocability."

**Saving estimate:** ~250 bytes / ~5 lines
**Risk note:** Low. "No degrade-to-no-op" unique content is preserved by keeping it in the §Standalone Invocability owner site. Researcher confirmed no other files cite this specific section heading, so the section heading itself is safe to retain as the single-owner anchor.

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

  §Standalone Invocability (lines 142-146): confirm this is the single owner — ensure "no degrade-to-no-op / unconditional path" rule is explicit here.

  Phase 1 (lines 55-62): replace the standalone-invocability prose with one-line cite to §Standalone Invocability; keep "Do NOT invoke start-bootstrap" as a direct operational prohibition.

  Integration "Does NOT call" (lines 158-159): collapse repetitive prose to "Does NOT call: `start-bootstrap`, `util-worktree`, any sprint-creating skill (§Standalone Invocability)."

- [ ] **Step 4: Verify — re-grep + byte delta + "no degrade-to-no-op" preserved**

  Run: `grep -n "standalone invocab" skills/design-committee/SKILL.md`
  Expected: hits only in §Standalone Invocability (single owner) + one-line cites in Phase 1 + Integration

  Run: `grep -n "degrade.to.no.op\|unconditional path" skills/design-committee/SKILL.md`
  Expected: hit in §Standalone Invocability (owner site)

  Run: `wc -c skills/design-committee/SKILL.md`
  Expected: bytes reduced ~250 bytes vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md
  git commit -m "docs: collapse standalone/no-sprint restatements within SKILL.md to §Standalone Invocability owner"
  ```

---

## Task 4: Collapse Translation Gate rule-restatement bullets in SKILL.md (keep cite)

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 1 (SKILL.md line 45 already has the authoritative cite; framing sentence and LOAD-BEARING warning are kept)
**Must remain green:** util-design-partner-role cite at line 45 preserved; LOAD-BEARING warning preserved

**Owner declaration:** `skills/util-design-partner-role/SKILL.md` — owns the full Translation Gate spec (read-aloud rule, Option-naming, C1, C2, Stance Principles, PM Litmus, Research Boundary).

**Classification of SKILL.md mention:**

- `skills/design-committee/SKILL.md:36-45` §Translation Gate — **restatement-collapse.** Lines 40-43 paraphrase read-aloud, option-naming, C1, C2 from util. Line 45 already cites util as LOAD-BEARING. Replace lines 40-43 with a single sentence; keep line 45 cite. Net: ~4 bullets → 1 sentence + cite.

**Saving estimate:** ~200 bytes / ~4-5 lines
**Risk note:** Low. The 4 bullets are confirmed duplicates of util-design-partner-role content. The LOAD-BEARING cite on line 45 is preserved. The framing sentence about "every subagent self-enforces" and the team-lead re-check pointer are orientation-only and are kept in shortened form.

**Files:**
- Modify: `skills/design-committee/SKILL.md:36-45`

**Steps:**

- [ ] **Step 1: Verify rule-restatement bullets exist**

  Run: `grep -n "Read.aloud\|Option.naming\|C1\|C2" skills/design-committee/SKILL.md`
  Expected: hits at lines 40-43

  Run: `grep -n "Read.aloud\|Option.naming\|C1\|C2" skills/util-design-partner-role/SKILL.md`
  Expected: same concepts confirmed present in authoritative owner

- [ ] **Step 2: Record pre-edit byte count**

  Run: `wc -c skills/design-committee/SKILL.md`
  Record baseline.

- [ ] **Step 3: Edit — drop rule bullets, keep framing + cite**

  In `SKILL.md:36-45`: replace the four bullet restatements (lines 40-43) with one sentence: "Enforce all Translation Gate rules (read-aloud test, Option-naming, C1, C2) — full spec: `skills/util-design-partner-role/SKILL.md` (LOAD-BEARING)." Keep or merge the line 45 cite into the single sentence.

- [ ] **Step 4: Verify — re-grep + byte delta + cite intact**

  Run: `grep -n "Read-aloud\|Option-naming\|C1 Externalized\|C2 Fact Default" skills/design-committee/SKILL.md`
  Expected: zero hits (rule bullets gone)

  Run: `grep -n "util-design-partner-role" skills/design-committee/SKILL.md`
  Expected: LOAD-BEARING cite still present

  Run: `wc -c skills/design-committee/SKILL.md`
  Expected: bytes reduced ~200 bytes vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md
  git commit -m "docs: collapse §Translation Gate rule-restatement bullets in SKILL.md — cite util-design-partner-role only"
  ```

---

## Task 5: Collapse team-lead.md Translation Gate Site B2 (lines 291-299) to cite; preserve §Voice boundary clause

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 2 (must not drop "Apply silently" instruction; boundary clauses at round-format:101-103 and member-protocol:67-69 must survive — they are not in team-lead.md, so no collision)
**Must remain green:** §Voice boundary clause "Apply silently / Do NOT restate rules in packet" at team-lead.md line 37 preserved; cite-graph integrity (team-lead.md:293 cite of util-design-partner-role preserved)

**Owner declaration:** `skills/util-design-partner-role/SKILL.md` — owns the full Translation Gate rules. `skills/design-committee/references/team-lead.md` §Voice (lines 26-37) — owns the application-scoped boundary clause "Apply silently."

**Classification of every other mention:**

- `skills/design-committee/references/team-lead.md:26-37` §Voice — **mixed: partial restatement + boundary clause.** Lines 29-35 list rule names (restatement-collapse). Line 28 ("read util-design-partner-role before consolidating") is operational instruction — keep. Line 37 ("Do NOT restate rules in packet. Apply silently.") is application-scoped constraint not in util — **boundary-preserve.** Collapse lines 29-35 to one-line cite; preserve lines 28 and 37 in place.
- `skills/design-committee/references/team-lead.md:291-299` §Translation Gate Site B2 — **restatement-collapse.** Lines 294-299 restate read-aloud, option-naming, no code vocab, C1, C2. Line 293 already cites util. Replace lines 294-299 with zero lines (cite on line 293 is sufficient). Delete the five bullet restatements.

**Saving estimate:** ~300 bytes / ~7 lines
**Risk note:** Low-moderate. Researcher confirmed Site B2 (lines 291-299) is a genuine intra-file duplicate of Site B1 (lines 26-37). Risk: Site B1 §Voice lists rules as a "before consolidating" checklist; Site B2 is a "pre-send" gate. The operational distinction is preserved by keeping both section headings. The restatement is in the rule bullets, not the gate framing. "Apply silently" instruction kept at §Voice (Site B1) for operational clarity.

**Files:**
- Modify: `skills/design-committee/references/team-lead.md:26-37`
- Modify: `skills/design-committee/references/team-lead.md:291-299`

**Steps:**

- [ ] **Step 1: Confirm both Translation Gate sites in team-lead.md**

  Run: `grep -n "Translation Gate\|Read.aloud\|read.aloud\|Option.naming\|no code vocab" skills/design-committee/references/team-lead.md`
  Expected: Site B1 at lines 26-37 (§Voice — lists rules, adds "apply silently" unique instruction); Site B2 at lines 291-299 (§Translation Gate — restates same rules without adding anything new)

- [ ] **Step 2: Record pre-edit byte count**

  Run: `wc -c skills/design-committee/references/team-lead.md`
  Record baseline.

- [ ] **Step 3: Edit — collapse §Voice rule list and Site B2 rule bullets**

  In `team-lead.md:26-37` §Voice: keep line 28 operational instruction; keep line 37 "Apply silently" boundary clause; replace lines 29-35 rule-name list with one-line cite: "Rules: `skills/util-design-partner-role/SKILL.md`."

  In `team-lead.md:291-299` §Translation Gate: delete lines 294-299 bullet restatements. Line 293 cite is sufficient.

- [ ] **Step 4: Verify — re-grep + byte delta + boundary clauses intact**

  Run: `grep -n "Read-aloud test passes\|Option-naming rule applied\|No code vocab" skills/design-committee/references/team-lead.md`
  Expected: zero hits (rule bullets gone)

  Run: `grep -n "Apply silently\|not restate rules" skills/design-committee/references/team-lead.md`
  Expected: line 37 §Voice boundary clause still present

  Run: `grep -n "util-design-partner-role" skills/design-committee/references/team-lead.md`
  Expected: cite still present

  Run: `wc -c skills/design-committee/references/team-lead.md`
  Expected: bytes reduced ~300 bytes vs baseline

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/references/team-lead.md
  git commit -m "docs: collapse team-lead.md Translation Gate rule bullets — cite util; preserve §Voice boundary clause"
  ```

---

## Task 6: Collapse Authority-Guard/Warrant restatements within team-lead.md

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 3 (disk-persistence instructions in steps 6+7 are operationally distinct from policy; §Self-Evaluation imperative form is useful in-situ but can cite; count-not-a-warrant appears in three sites; steps 6+7 sentences must be read individually — collapse only sentences that are pure policy restatement, not write-instructions)
**Must remain green:** §Authority Guard (lines 319-325) remains as policy owner; step 6 alignment-map write instruction survives; step 7 verdict.md audit requirement survives

**Owner declaration:** `skills/design-committee/references/team-lead.md` §Authority Guard (lines 319-325) — owns the warrant policy: member-supplied, team-lead-verified, not team-lead-originated; count-not-a-warrant; C2 firewall; C1 audit; warrants on disk.

**Classification of every other mention:**

- `skills/design-committee/references/team-lead.md:105` step 6 — **boundary-preserve (scope: disk-persistence instruction — write warrant record to alignment-map.md).** Defines warrant types in context of writing the alignment-map. The "write warrant types + demotion rule here" instruction is operational and belongs at step 6 for proximity. Keep operational disk-persistence sentence; trim only if step 6 restates the policy definition (who supplies warrants etc.) rather than the write instruction.
- `skills/design-committee/references/team-lead.md:106` step 7 — **boundary-preserve (scope: disk-persistence — carry warrant record into verdict.md for auditability).** "Warrants auditable on disk, not held only in context" is the step's own audit-trail instruction. Keep as-is.
- `skills/design-committee/references/team-lead.md:121-123` §Behavioral Constraints — count-not-a-warrant + strict-premise-scope appear here as behavioral prohibitions. **Restatement-collapse:** replace with one-line cite to §Authority Guard: "Warrant discipline per §Authority Guard (below) — member-supplies, team-lead verifies; count is not a warrant; premise scope strictly bounded."
- `skills/design-committee/references/team-lead.md:342-344` §Self-Evaluation — three bullet imperative-form self-check items. **Partial-restatement-collapse:** the check questions themselves are useful in situ (imperative form is not the same as policy definition). Collapse the definitional content embedded in checks (e.g. repeated warrant-definition sentences); keep check-question imperative form with an inline cite header: "Authority Guard — warrant coverage (per §Authority Guard): does every assertion…" One-sentence cite header + question form retained.

**Ambiguous-category risk:** steps 6+7 mix disk-persistence instruction with policy definition sentences. Mitigation: read each step 6+7 sentence individually; collapse only sentences that restate §Authority Guard policy; keep sentences that are write-instructions.

**Saving estimate:** ~400 bytes / ~8-10 lines (estimate; higher ambiguity than earlier tasks)
**Risk note:** Higher ambiguity than Tasks 1-5. Steps 6+7 contain mixed policy/mechanism sentences that are hard to separate by inspection alone. Per the Purist: "team-lead.md steps 6+7 mix policy and mechanism sentences that are hard to separate by inspection alone without running the edit." Flagged for round-2 attack (see §Flagged for Round-2 Attack below). Proceed with care; if sentence-level classification is ambiguous during execution, preserve in place and note it.

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

## Task 7: Collapse Output-surface-split restatement in SKILL.md ONLY (round-format scoped OUT — round02 decision (b))

> **Round02 decision (b):** Do ONLY the SKILL.md edit at **line 139**. The `committee-analysis-round-format.md` sub-edit (lines 104-110) is **scoped out** — round02 ground truth confirmed 104-110 is a single bullet whose disambiguation clause at 109-110 is anaphoric to the definition; collapsing it strands the antecedent for ~100 bytes. Leave round-format.md frozen. Skip every round-format step/grep below.

**Type:** docs-producing
**Implements:** AC — each named duplicated concept has exactly one authoritative site
**Decision budget:** 2 (SKILL.md:122 already partially cites team-lead.md; round-format disambiguation clause must survive; the two sub-edits at round-format:104-107 and round-format:108-110 are cleanly separable)
**Must remain green:** disambiguation clause "do not conflate with the two-surface usage in sprint 20260521-02" preserved in round-format.md; cite-graph: SKILL.md cite of team-lead.md §Output Surfaces

**Owner declaration:** `skills/design-committee/references/team-lead.md` §Output Surfaces (lines 152-159) — owns the authoritative definition of the output-surface split (decision-communication packet vs. end-of-turn session artifact).

**Classification of every other mention:**

- `skills/design-committee/SKILL.md:122` — **restatement-collapse (already partially deduped).** Line 122 already ends with a cite `(§ references/team-lead.md Output Surfaces)`. The prose before the cite restates the locked-format / no-mandated-format distinction — same content as team-lead.md:154-159. Trim the prose to "dispatches ephemeral scribe; output-surface split governs format — see `references/team-lead.md §Output Surfaces`."
- `skills/design-committee/references/committee-analysis-round-format.md:104-110` — **boundary-preserve (scope: disambiguation of term overlap with sprint 20260521-02).** Lines 108-110 carry: "This output-surface split is a distinct concept from the 'two-surface' usage in sprint 20260521-02-design-architect-committee — do not conflate the two terms." This disambiguation clause is round-format-local and not present in team-lead.md. Must survive. Lines 104-107 are the definition restatement (collapse); lines 108-110 are the disambiguation (preserve). Replace lines 104-107 with one-line cite to team-lead.md §Output Surfaces; keep lines 108-110 verbatim or inline them: "…(distinct from the 'two-surface' usage in sprint 20260521-02 — do not conflate)."

**Saving estimate:** ~100-150 bytes / ~4 lines
**Risk note:** Moderate. The Conservator's position was to freeze round-format entirely; this task makes a small scoped edit (~100 bytes) while preserving the disambiguation clause. This task is flagged for round-2 attack (see §Flagged for Round-2 Attack below). If any ambiguity arises about what is definition-restatement vs. disambiguation during execution, preserve in place.

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

- [ ] **Step 4: Verify — re-grep + byte delta + disambiguation intact**

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

## Task 8: Version-bump all touched files

**Type:** docs-producing
**Implements:** AC — touched files carry a correct version bump
**Decision budget:** 1 (three reference files have no version field — add field when bumping; member-protocol.md is untouched this sprint)
**Must remain green:** frontmatter YAML valid in all bumped files

**Version bump targets (derived from researcher Task 13 findings):**

- `skills/design-committee/SKILL.md` — currently `v0021` → bump to `v0022` (was v0020 when plan written; sprint -02 already bumped it)
- `skills/design-committee/references/team-lead.md` — currently `v0011` → bump to `v0012`
- `skills/design-committee/references/committee-analysis-round-format.md` — NOT bumped (round-format scoped out per round02 decision (b); file untouched)
- `skills/design-committee/references/member-protocol.md` — NOT touched by this sprint (it is the authority model). No version bump needed.
- `skills/util-design-partner-role/SKILL.md` — NOT touched by this sprint (Translation Gate owner; this sprint only adds cites pointing at it). No version bump.

**Saving estimate:** 0 bytes
**Risk note:** Zero. Required by convention. Errors caught immediately by re-grep in step 3.

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

- [ ] **Step 4: (Version bump is trivially verifiable — no additional test step needed)**

- [ ] **Step 5: Commit**

  ```bash
  git add skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md skills/design-committee/references/committee-analysis-round-format.md
  git commit -m "chore: version-bump SKILL.md v0021, team-lead.md v0012, round-format.md v0002 after compaction pass"
  ```

---

## Task 9: Final cite-graph integrity and nuance-survival verification

**Type:** docs-producing (verification only — no file edits)
**Implements:** AC — no cite references deleted or renamed text; all 7 load-bearing nuances intact; measured runtime-file byte total reported
**Decision budget:** 0 (verification only, no edits)
**Must remain green:** all cite targets exist; all 7 nuance sites intact

**This task is verification-only — no file edits. Runs after all previous tasks committed.**

**Saving estimate:** 0 bytes (verification task)
**Risk note:** Zero for this task. If a dangling cite is found at this step, fix before closing sprint.

**Files:**
- Read: all five orchestrator-load files (SKILL.md, team-lead.md, member-protocol.md, round-format.md, util-design-partner-role/SKILL.md)

**Steps:**

- [ ] **Step 1: Full byte count on all five orchestrator files**

  Run: `wc -c skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md skills/design-committee/references/member-protocol.md skills/design-committee/references/committee-analysis-round-format.md skills/util-design-partner-role/SKILL.md`

  Baseline (researcher Task 1): 15,379 + 31,112 + 7,224 + 11,537 + 14,997 = 80,249 bytes total

  Report actual: "Pre-compaction: 80,249b. Post-compaction: Yb. Delta: Zb (N%)."
  Expected delta: ~3,000–3,500 bytes (~4%). If actual reduction is below ~800 bytes, flag for designer.

- [ ] **Step 2: Verify all cites in SKILL.md point at existing headings**

  Run: `grep -n "references/team-lead.md §\|references/member-protocol.md §\|util-design-partner-role" skills/design-committee/SKILL.md`

  For each heading cited, verify the heading exists in the target file:
  Run: `grep -n "^###\|^##\|^#" skills/design-committee/references/team-lead.md`
  Confirm: §Output Surfaces, §Per-Round Flow, §Authority Guard, §Behavioral Constraints, §Standalone Invocability all present and not renamed.

- [ ] **Step 3: Verify all cites in team-lead.md point at existing headings**

  Run: `grep -n "member-protocol.md §\|util-design-partner-role\|round-format" skills/design-committee/references/team-lead.md`
  Confirm: cited heading names match headings in target files.

- [ ] **Step 4: Verify all 7 load-bearing nuance sites intact**

  Run: `grep -n "Translation Gate boundary\|does NOT apply\|do not conflate\|20260521" skills/design-committee/references/committee-analysis-round-format.md`
  Expected: round-format boundary clause intact

  Run: `grep -n "Translation Gate does not apply\|Transcripts are internal\|transcripts.*exempt" skills/design-committee/references/member-protocol.md`
  Expected: member-protocol boundary clause intact (untouched)

  Run: `grep -n "Apply silently\|not restate rules" skills/design-committee/references/team-lead.md`
  Expected: team-lead §Voice boundary clause intact

  Run: `grep -n "no.*team_name\|Agent tool" skills/design-committee/references/team-lead.md`
  Expected: steps 4 and 8 mechanism sites intact

  Run: `grep -n "degrade.to.no.op\|unconditional path" skills/design-committee/SKILL.md`
  Expected: §Standalone Invocability owner site present

- [ ] **Step 5: Commit verification record**

  Write byte-delta report as the commit message.

  ```bash
  # Only if cite-repair edits were needed — otherwise no files staged
  git commit --allow-empty -m "docs: cite-graph + nuance-survival verification pass — all cites valid, byte delta [N]b ([M]%)"
  ```

---

## Flagged for Round-2 Attack

- **Task 6 — team-lead.md Authority-Guard steps 6+7 edit.** Steps 6 and 7 contain sentences that mix policy restatement with disk-persistence write instructions. The Purist's blocking_risk states these are "hard to separate by inspection alone without running the edit." If sentence-level classification cannot be resolved during execution, the executor should preserve in place and surface the specific ambiguous sentences to the designer before committing.

- **Task 7 — round-format Output-surface edit.** The Conservator's position was to freeze round-format entirely. The verdict keeps this as a small scoped edit (~100 bytes, definition restatement only, disambiguation preserved), but flags it as the most likely point where a cautious executor would want designer confirmation before committing. If any uncertainty about what constitutes definition vs. disambiguation arises during execution, pause and surface.

---

## Dissent Record

**Alignment:** 4-0 on method (cite-not-restate, member-protocol frozen, 7 nuances preserved, verification task); 2-2 on scope (minimal-safe: Conservator + Pragmatist; full-coverage-classified: Innovator + Purist).

**Pragmatist / Conservator (minimal-safe):** blocking_risk verbatim — "safe cuts only recover ~1.4% of 77KB load, not 25%; designer may need to authorize a riskier second-pass plan if the full target matters, or lower the target to match safe-cut scope."

**Purist (steps 6+7):** blocking_risk verbatim — "plan-attack may find that task decision budgets underestimate ambiguity in team-lead.md steps 6+7 (mixed policy/mechanism sentences are hard to separate by inspection alone without running the edit)."

---

## Deferred / Open

**Designer target/scope gap (unresolved — pending designer ruling).**

The brief's 25% / ~19KB target is not achievable by dedup alone. Achievable saving is ~3–3.5KB (~4%). The designer must choose: (a) accept ~4% as the win and execute this plan; (b) execute this plan and additionally commission a structural pass (separate sprint, contract-touching); or (c) stop. Execution of this plan should not begin until the designer rules.

---

## Change Log

- **2026-06-11 — Round02 validation + re-grounding (plan-00).** Committee round02 validated the 9-task plan and resolved the two round-2-attack flags: Task 6 steps 6+7 confirmed as write-instructions (not trimmed, 4-0); Task 7 round-format sub-edit carried a 3-1 split. Designer ruled: target option (a) ship the dedup pass; Task 7 option (b) scope round-format out (SKILL.md edit only). Re-grounding found the plan's baseline stale — sprint `20260611-02-fix-dispatch-discipline` merged after this plan was written, bumping SKILL.md v0020→v0021 (+1,172 bytes) and shifting lower-file line numbers. Corrections folded in: byte baseline 80,249→81,579; Task 6 collapse scoped to lines 122-123 + 343-345 (line 121 excluded as unique); Task 7 SKILL.md site 122→139; Task 8 versions SKILL.md→v0022, team-lead.md→v0012, round-format.md no bump. All binding corrections captured in the §Round02 Corrections block near the top. Committee record: `committee/round02/`.
