# Plan: Compact design-committee Skill Runtime Context (re-grounded, hardened)

**Sprint:** 20260611-01-compact-committee-skill
**Spec:** `docs/chester/working/20260611-01-compact-committee-skill/design/20260611-01-compact-committee-skill-design-00.md` (design brief — spec phase intentionally skipped; brief is the direct requirements input)
**Execution mode:** subagent

> **For agentic workers:** This is a docs-producing plan — every task edits Markdown. The TDD five-step is adapted to documentation: a `grep`/`wc` confirms the target restatement exists → an Edit collapses it to a cite → a re-`grep` + byte-delta + cite-survival check confirms. One commit per task. Use `git -C` against the worktree; do not `cd`.

## Goal

Cut the per-invocation runtime context cost of `design-committee` by collapsing genuine cross-file and within-file concept restatements to single-owner sites with one-line cites, changing no behavioral contract.

## Architecture

Extend the `member-protocol.md` "single authority + cite" pattern (already operational) to the safe subset of duplicated concepts. Each collapse keeps the owner site intact and replaces the redundant site with a one-line pointer. Restatement-vs-boundary classification governs every edit: a site that adds an application-scoped nuance (a boundary clause) is preserved, not collapsed. Two contested edits from the original plan are scoped out by designer decision (round-format output-surface) and by re-grounding (the team-lead Authority-Guard over-claim). Every step is grep-anchored so stale line numbers self-correct at execution.

## Tech Stack

Markdown edits only. Verification via `grep -n`, `grep -c`, `wc -c`. No build, no runtime tests.

## Baseline (re-grounded against v0021 — 2026-06-11)

The original plan was written against SKILL.md v0020. Sprint `20260611-02-fix-dispatch-discipline` merged afterward, bumping SKILL.md to **v0021** and growing it. Current measured baseline:

- `skills/design-committee/SKILL.md` — **16,551 bytes** (v0021)
- `skills/design-committee/references/team-lead.md` — **31,270 bytes** (v0011)
- `skills/design-committee/references/member-protocol.md` — 7,224 bytes (untouched authority model)
- `skills/design-committee/references/committee-analysis-round-format.md` — 11,537 bytes (v0001 — scoped out this pass)
- `skills/util-design-partner-role/SKILL.md` — 14,997 bytes (Translation Gate owner — only cited, never edited)
- **Total runtime surface: 81,579 bytes.**

**Honest target.** The brief's AC-5 names ~25%. That is unreachable by dedup alone (committee round01 ground truth; most of the 81KB is unique load-bearing content). Realistic projected saving for the seven collapse tasks below is **~1.4–1.7 KB (~1.7–2%)**. The designer accepted this as option (a) — ship the safe dedup pass. Task 9 reports the measured actual.

## Acceptance Criteria (from brief)

- **AC-1** — each named duplicated concept has exactly one authoritative site; every other mention is a one-line cite. *(Partially met: Per-Round-Flow deferred with rationale — see Scoped Out.)*
- **AC-2** — no cite references deleted or renamed text (cite-graph verified).
- **AC-3** — no behavioral contract removed or altered; only restatements collapsed.
- **AC-4** — touched files carry a correct version bump.
- **AC-5** — measured runtime-file byte total materially reduced; report actual (target corrected to ~1.7–2%).

---

## Task 1: Reduce SKILL.md §Six Members to roster-only

**Type:** docs-producing
**Implements:** AC-1, AC-3
**Decision budget:** 1
**Must remain green:** roster agent-ID strings + TeamCreate membership block unchanged; per-grep checks in Step 4

**Owner declaration:** `agents/design-committee-{member}.md` own each member's full lens (loaded as the member's own system prompt — confirmed out-of-orchestrator-context per brief).

**Classification:** `SKILL.md:29-32` §Six Members lens sentences — **restatement-collapse.** Each line restates a lens the agent file already owns. Collapse to roster-only (name + agent-ID + advocacy tag). Team-Lead (28) and Researcher (33) lines carry unique orchestration content — NOT shortened.

**Files:**
- Modify: `skills/design-committee/SKILL.md:29-32`

**Steps:**

- [ ] **Step 1: Confirm the lens sentences exist**
  Run: `grep -n "Defends existing\|Pushes new\|Weighs op cost\|Tests category" skills/design-committee/SKILL.md`
  Expected: four hits at lines 29-32.

- [ ] **Step 2: Record pre-edit byte count**
  Run: `wc -c skills/design-committee/SKILL.md` (expect 16551).

- [ ] **Step 3: Edit — replace the four advocacy lines with roster-only lines**
  Replace lines 29-32 with:
  ```
  - Conservator; `chester:design-committee-conservator`. Advocacy member (full lens in agent file).
  - Innovator; `chester:design-committee-innovator`. Advocacy member (full lens in agent file).
  - Pragmatist; `chester:design-committee-pragmatist`. Advocacy member (full lens in agent file).
  - Purist; `chester:design-committee-purist`. Advocacy member (full lens in agent file).
  ```

- [ ] **Step 4: Verify — lens gone, IDs intact, bytes down**
  Run: `grep -c "Defends existing\|Pushes new\|Weighs op cost\|Tests category" skills/design-committee/SKILL.md` → expect 0.
  Run: `grep -c "chester:design-committee-conservator\|chester:design-committee-purist" skills/design-committee/SKILL.md` → expect ≥2 (roster + TeamCreate block).
  Run: `wc -c skills/design-committee/SKILL.md` → expect ≈ −220 bytes.

- [ ] **Step 5: Commit**
  ```bash
  git -C .worktrees/20260611-01-compact-committee-skill add skills/design-committee/SKILL.md
  git -C .worktrees/20260611-01-compact-committee-skill commit -m "docs: reduce SKILL.md §Six Members to roster-only; lens owned by agent files"
  ```

---

## Task 2: Collapse §Integration ephemeral restatement in SKILL.md

**Type:** docs-producing
**Implements:** AC-1, AC-3
**Decision budget:** 1
**Must remain green:** §Consolidator and §Scribe owner sites still carry "EPHEMERAL per-round dispatch … NOT a member of the `TeamCreate` roster"

**Owner declaration:** `SKILL.md` §Consolidator (≈line 106) and §Scribe (≈line 110) own the ephemeral-off-roster policy.

**Classification:** `SKILL.md:173` §Integration "Calls" line — **restatement-collapse.** It states the ephemeral-off-roster fact twice (once for Consolidator, once for Scribe), duplicating the §Consolidator/§Scribe owners. Collapse to a single cite.

**Files:**
- Modify: `skills/design-committee/SKILL.md:173`

**Steps:**

- [ ] **Step 1: Confirm owner + duplicate sites**
  Run: `grep -n "EPHEMERAL per-round dispatch" skills/design-committee/SKILL.md` → owners at ≈106, ≈110.
  Run: `grep -n "ephemeral per-round consolidation dispatch, not on the" skills/design-committee/SKILL.md` → the §Integration line.

- [ ] **Step 2: Record pre-edit byte count** — `wc -c skills/design-committee/SKILL.md`.

- [ ] **Step 3: Edit — collapse the Calls line's doubled parentheticals to a cite**
  Replace the `chester:design-committee-consolidator … ; chester:design-committee-scribe …` parentheticals in the §Integration "Calls" bullet with:
  ```
  `chester:design-committee-consolidator` and `chester:design-committee-scribe` (ephemeral off-roster dispatches — see § Consolidator, § Scribe).
  ```

- [ ] **Step 4: Verify**
  Run: `grep -n "EPHEMERAL per-round dispatch" skills/design-committee/SKILL.md` → owners still present.
  Run: `grep -c "ephemeral off-roster dispatches" skills/design-committee/SKILL.md` → expect 1.
  Run: `wc -c skills/design-committee/SKILL.md` → expect ≈ −78 bytes.

- [ ] **Step 5: Commit**
  ```bash
  git -C .worktrees/20260611-01-compact-committee-skill add skills/design-committee/SKILL.md
  git -C .worktrees/20260611-01-compact-committee-skill commit -m "docs: collapse Integration ephemeral restatement to cite of §Consolidator/§Scribe"
  ```

---

## Task 3: Collapse Standalone "Does NOT call" restatement in SKILL.md

**Type:** docs-producing
**Implements:** AC-1, AC-3
**Decision budget:** 1
**Must remain green:** §Standalone Invocability owner intact (no-degrade-to-no-op rule, ≈line 163); Phase 1 step 4 start-bootstrap prohibition intact (≈line 62)

**Owner declaration:** `SKILL.md` §Standalone Invocability (≈lines 161-163) owns the standalone/no-sprint statement, including the unconditional-path / no-degrade-to-no-op rule.

**Classification:** `SKILL.md:176` §Integration "Does NOT call" line — **restatement-collapse.** Its second and third sentences re-explain the standalone rule and the start-bootstrap prohibition (owned by §Standalone + Phase 1 step 4). Collapse to the list + a cite. *(Phase 1 line 57 tail and step 4 line 62 are short, in-situ, and operational — kept.)*

**Files:**
- Modify: `skills/design-committee/SKILL.md:176`

**Steps:**

- [ ] **Step 1: Confirm sites**
  Run: `grep -n "Does NOT call:\|degrade.to.no.op\|Do NOT invoke .start-bootstrap" skills/design-committee/SKILL.md`
  Expected: owner ≈163, prohibition ≈62, "Does NOT call" ≈176.

- [ ] **Step 2: Record pre-edit byte count** — `wc -c skills/design-committee/SKILL.md`.

- [ ] **Step 3: Edit — collapse the "Does NOT call" line**
  Replace the §Integration "Does NOT call" bullet with:
  ```
  - **Does NOT call:** `start-bootstrap`, `util-worktree`, any sprint-creating skill — see § Standalone Invocability.
  ```

- [ ] **Step 4: Verify**
  Run: `grep -n "degrade.to.no.op\|unconditional path" skills/design-committee/SKILL.md` → owner present.
  Run: `grep -n "Do NOT invoke .start-bootstrap" skills/design-committee/SKILL.md` → prohibition present.
  Run: `wc -c skills/design-committee/SKILL.md` → expect ≈ −195 bytes.

- [ ] **Step 5: Commit**
  ```bash
  git -C .worktrees/20260611-01-compact-committee-skill add skills/design-committee/SKILL.md
  git -C .worktrees/20260611-01-compact-committee-skill commit -m "docs: collapse standalone/no-sprint restatement in SKILL.md to §Standalone Invocability owner"
  ```

---

## Task 4: Collapse §Translation Gate rule bullets in SKILL.md (keep LOAD-BEARING cite)

**Type:** docs-producing
**Implements:** AC-1, AC-3
**Decision budget:** 1
**Must remain green:** LOAD-BEARING util cite (≈line 42 after collapse) preserved; floor framing line (38) preserved

**Owner declaration:** `skills/util-design-partner-role/SKILL.md` owns the full Translation Gate spec.

**Classification:** `SKILL.md:40-43` §Translation Gate four rule bullets — **restatement-collapse.** They paraphrase rules util already owns; line 45 already cites util as LOAD-BEARING. Collapse the four bullets to one naming line; keep the framing line (38) and the util cite (45).

**Files:**
- Modify: `skills/design-committee/SKILL.md:40-43`

**Steps:**

- [ ] **Step 1: Confirm the bullets exist**
  Run: `grep -n "Can't say sentence aloud\|Name options by what they do structurally\|must surface in output before counting" skills/design-committee/SKILL.md` → hits at 40-42.

- [ ] **Step 2: Record pre-edit byte count** — `wc -c skills/design-committee/SKILL.md`.

- [ ] **Step 3: Edit — replace the four bullets (40-43) with one naming line**
  ```
  - Floor rules: read-aloud test, Option-naming, C1 Externalized Coverage, C2 Fact Default with Marked Departures — full spec in the citation below.
  ```

- [ ] **Step 4: Verify**
  Run: `grep -c "Can't say sentence aloud\|Name options by what they do structurally" skills/design-committee/SKILL.md` → expect 0.
  Run: `grep -n "LOAD-BEARING" skills/design-committee/SKILL.md` → cite present.
  Run: `wc -c skills/design-committee/SKILL.md` → expect ≈ −360 bytes.

- [ ] **Step 5: Commit**
  ```bash
  git -C .worktrees/20260611-01-compact-committee-skill add skills/design-committee/SKILL.md
  git -C .worktrees/20260611-01-compact-committee-skill commit -m "docs: collapse §Translation Gate rule bullets in SKILL.md — cite util-design-partner-role only"
  ```

---

## Task 5: Collapse team-lead.md Translation Gate duplicates (§Voice rule-list + Site B2); preserve "Apply silently"

**Type:** docs-producing
**Implements:** AC-1, AC-3
**Decision budget:** 2
**Must remain green:** §Voice line 28 ("read util … apply in full") preserved; §Voice line 37 ("Do NOT restate rules in packet. Apply silently.") preserved verbatim — application-scoped boundary clause, not in util; util cite at §Translation Gate line 294 preserved

**Owner declaration:** `skills/util-design-partner-role/SKILL.md` owns the Translation Gate rules. `team-lead.md` §Voice line 37 owns the application-scoped "Apply silently" constraint.

**Classification:**
- `team-lead.md:30-35` §Voice rule-name list — **restatement-collapse.** Six bullets naming util rules. Collapse to one cite line; keep line 28 (operational) and line 37 (boundary).
- `team-lead.md:296-298` §Translation Gate (Site B2) rule bullets — **restatement-collapse.** Lines 296-298 restate read-aloud / option-naming / no-code-vocab — duplicating §Voice and util. Delete these three. **KEEP lines 299-300** (C1 / C2 pre-send markers): they keep the framing colon at line 294 introducing a non-empty list, and the C1/C2 pre-send reminders are operationally distinct. Deleting all five would strand the colon (plan-attack Finding 1).

**Files:**
- Modify: `skills/design-committee/references/team-lead.md:30-35`
- Modify: `skills/design-committee/references/team-lead.md:296-300`

**Steps:**

- [ ] **Step 1: Confirm both sites**
  Run: `grep -n "Stance Principles\|Self-Evaluation game before sending\|Apply silently\|Read-aloud test passes\|No code vocab" skills/design-committee/references/team-lead.md`
  Expected: §Voice list ≈30-35 + "Apply silently" 37; Site B2 bullets ≈296-298.

- [ ] **Step 2: Record pre-edit byte count** — `wc -c skills/design-committee/references/team-lead.md` (expect 31270).

- [ ] **Step 3: Edit**
  §Voice (30-35): replace the six rule-name bullets with one line:
  ```
  - Rules — full spec: `skills/util-design-partner-role/SKILL.md` (read in full before consolidating).
  ```
  Keep line 28 and line 37 exactly as-is.
  §Translation Gate Site B2: delete ONLY lines 296-298 (the read-aloud / option-naming / no-code-vocab restatements). KEEP the heading (292), the framing line + colon (294), and lines 299-300 (C1 / C2 pre-send markers). The colon at 294 must still introduce a non-empty list — do NOT delete 299-300, or the colon is left dangling.

- [ ] **Step 4: Verify**
  Run: `grep -c "Self-Evaluation game before sending\|Read-aloud test passes\|Option-naming rule applied\|No code vocab, paths" skills/design-committee/references/team-lead.md` → expect 0 (§Voice rule-list + Site B2 296-298 restatements gone).
  Run: `grep -c "C1 — load-bearing premise visible\|C2 — Assumption" skills/design-committee/references/team-lead.md` → expect 2 (299-300 C1/C2 pre-send markers PRESERVED — colon not stranded).
  Run: `grep -n "Apply silently\|read in full before consolidating\|Full spec in util" skills/design-committee/references/team-lead.md` → "Apply silently" present; util cites present.
  Run: `wc -c skills/design-committee/references/team-lead.md` → expect ≈ −180 to −200 bytes.

- [ ] **Step 5: Commit**
  ```bash
  git -C .worktrees/20260611-01-compact-committee-skill add skills/design-committee/references/team-lead.md
  git -C .worktrees/20260611-01-compact-committee-skill commit -m "docs: collapse team-lead.md Translation Gate duplicates (§Voice list + Site B2); preserve Apply-silently boundary"
  ```

---

## Task 6: Collapse the one true Authority-Guard duplicate in team-lead.md (§Behavioral Constraints "Count is not a warrant")

**Type:** docs-producing
**Implements:** AC-1, AC-3
**Decision budget:** 2
**Must remain green:** §Authority Guard owner (320-326) unchanged; steps 6+7 (106-107) UNCHANGED — they are write-instructions, not restatement (round02 4-0); §Behavioral Constraints line 124 "Strict premise scope" UNCHANGED — it is its own owner (absent from §Authority Guard); §Self-Evaluation checks (343-345) UNCHANGED — imperative checks, not restatement

**Owner declaration:** `team-lead.md` §Authority Guard (320-326) owns: warrant-test, count-not-a-warrant (323), C2 firewall, C1 audit, warrants-on-disk.

**Classification (re-grounded — narrower than plan-00):**
- `team-lead.md:123` §Behavioral Constraints "Count is not a warrant" — **restatement-collapse.** Mirrors §Authority Guard line 323. The ONLY clean true-duplicate. Collapse to a cite.
- `team-lead.md:124` "Strict premise scope" — **boundary-preserve.** NOT present in §Authority Guard; this bullet (plus its §Self-Eval check at 345) is the rule's only home. Keep as owner.
- `team-lead.md:106-107` steps 6+7 — **boundary-preserve.** Disk-write instructions with an embedded field schema, not policy restatement. Do NOT trim.
- `team-lead.md:343-345` §Self-Evaluation — **boundary-preserve.** Imperative self-check questions (a mechanism for applying policy), not restatements. Keep.

**Files:**
- Modify: `skills/design-committee/references/team-lead.md:123`

**Steps:**

- [ ] **Step 1: Confirm the duplicate + the owner**
  Run: `grep -n "Count is not a warrant\|Count-not-a-warrant" skills/design-committee/references/team-lead.md`
  Expected: §Behavioral Constraints 123 + §Authority Guard 323 (+ §Self-Eval 344 check).

- [ ] **Step 2: Record pre-edit byte count** — `wc -c skills/design-committee/references/team-lead.md`.

- [ ] **Step 3: Edit — collapse line 123 to a cite of §Authority Guard**
  Replace line 123 with:
  ```
  - **Count is not a warrant** — see § Authority Guard.
  ```
  Do NOT touch lines 121, 122, 124, 125, 126; do NOT touch steps 6+7 (106-107); do NOT touch §Self-Evaluation (343-345).

- [ ] **Step 4: Verify**
  Run: `grep -n "Alignment count is never a warrant\|Alignment count never licenses collapse" skills/design-committee/references/team-lead.md`
  Expected: the FULL policy survives once, at §Authority Guard 323; §Behavioral Constraints 123 now a one-line cite.
  Run: `grep -n "Strict premise scope\|6. \*\*Synthesize\|7. \*\*Converge" skills/design-committee/references/team-lead.md` → 124 + steps 6/7 intact.
  Run: `wc -c skills/design-committee/references/team-lead.md` → expect ≈ −150 bytes.

- [ ] **Step 5: Commit**
  ```bash
  git -C .worktrees/20260611-01-compact-committee-skill add skills/design-committee/references/team-lead.md
  git -C .worktrees/20260611-01-compact-committee-skill commit -m "docs: collapse §Behavioral Constraints count-not-a-warrant duplicate to §Authority Guard cite"
  ```

---

## Task 7: Collapse output-surface restatement in SKILL.md ONLY (round-format scoped out)

**Type:** docs-producing
**Implements:** AC-1, AC-3
**Decision budget:** 1
**Must remain green:** team-lead.md §Output Surfaces owner (153-160) unchanged; round-format.md UNCHANGED (scoped out per designer decision (b)); SKILL.md scribe-dispatch sentence + §Output Surfaces cite preserved at line 139

**Owner declaration:** `team-lead.md` §Output Surfaces (153-160) owns the output-surface-split definition.

**Classification:** `SKILL.md:139` Phase 4 step 7 — **restatement-collapse.** The prose defining the decision-communication-packet / no-mandated-format distinction restates §Output Surfaces; the line already cites it. Trim the restating prose, keep the scribe-dispatch action + the cite.

> **Scoped out (designer decision (b)):** the `committee-analysis-round-format.md` output-surface sub-edit (≈lines 104-110) is NOT done. Round02 ground truth: 104-110 is a single bullet whose disambiguation clause ("This output-surface split … distinct from sprint 20260521-02 … do not conflate") at 108-110 is anaphoric to the definition; collapsing it strands the antecedent for ~100 bytes. Leave round-format.md frozen.

**Files:**
- Modify: `skills/design-committee/SKILL.md:139`

**Steps:**

- [ ] **Step 1: Confirm the SKILL.md site (line drift guard)**
  Run: `grep -n "output-surface split" skills/design-committee/SKILL.md`
  Expected: the Phase 4 step-7 line (≈139). NOTE: line 122 is the roster-only rule — do NOT edit there.

- [ ] **Step 2: Record pre-edit byte count** — `wc -c skills/design-committee/SKILL.md`.

- [ ] **Step 3: Edit — trim the step-7 restatement, keep action + cite**
  In the Phase 4 step 7 line, keep the scribe-dispatch clause and the trailing cite `(§ references/team-lead.md Output Surfaces)`; remove the inline restatement of the locked-format / no-mandated-format distinction. Result reads approximately:
  ```
  7. **Author** — the team-lead dispatches the ephemeral scribe (verdict, artifact-template path, consolidator output, alignment map) to write the round's designer-facing decision-packet. Output-surface split governs format — see § `references/team-lead.md` Output Surfaces.
  ```

- [ ] **Step 4: Verify**
  Run: `grep -n "Output Surfaces" skills/design-committee/SKILL.md` → cite present at step 7.
  Run: `git -C .worktrees/20260611-01-compact-committee-skill diff --stat skills/design-committee/references/committee-analysis-round-format.md` → empty (round-format untouched).
  Run: `wc -c skills/design-committee/SKILL.md` → expect ≈ −100 bytes.

- [ ] **Step 5: Commit**
  ```bash
  git -C .worktrees/20260611-01-compact-committee-skill add skills/design-committee/SKILL.md
  git -C .worktrees/20260611-01-compact-committee-skill commit -m "docs: collapse output-surface restatement in SKILL.md step 7 to team-lead §Output Surfaces cite"
  ```

---

## Task 8: Version-bump touched files

**Type:** docs-producing
**Implements:** AC-4
**Decision budget:** 1
**Must remain green:** frontmatter YAML valid in both bumped files

**Version targets (re-grounded against current files):**
- `skills/design-committee/SKILL.md` — `v0021` → **`v0022`** (was v0020 when the original plan was written; sprint -02 already bumped it)
- `skills/design-committee/references/team-lead.md` — `v0011` → **`v0012`**
- `skills/design-committee/references/committee-analysis-round-format.md` — **NOT bumped** (scoped out; file untouched)
- `member-protocol.md`, `util-design-partner-role/SKILL.md` — NOT bumped (untouched; only cited)

**Files:**
- Modify: `skills/design-committee/SKILL.md` frontmatter
- Modify: `skills/design-committee/references/team-lead.md` frontmatter

**Steps:**

- [ ] **Step 1: Confirm current versions**
  Run: `grep -n "^version:" skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md`
  Expected: `v0021`, `v0011`.

- [ ] **Step 2: Edit — bump both**
  SKILL.md: `version: v0021` → `version: v0022`.
  team-lead.md: `version: v0011` → `version: v0012`.

- [ ] **Step 3: Verify** — `grep -n "^version:" skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md` → `v0022`, `v0012`.

- [ ] **Step 4: Commit**
  ```bash
  git -C .worktrees/20260611-01-compact-committee-skill add skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md
  git -C .worktrees/20260611-01-compact-committee-skill commit -m "chore: version-bump SKILL.md v0022, team-lead.md v0012 after compaction pass"
  ```

---

## Task 9: Cite-graph + nuance-survival verification; report byte delta

**Type:** docs-producing (verification only — no source edits)
**Implements:** AC-2, AC-5
**Decision budget:** 0
**Must remain green:** all cite targets resolve; all preserved nuances intact

**Files:**
- Read: SKILL.md, team-lead.md, member-protocol.md, committee-analysis-round-format.md, util-design-partner-role/SKILL.md

**Steps:**

- [ ] **Step 1: Byte total + delta**
  Run: `wc -c skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md skills/design-committee/references/member-protocol.md skills/design-committee/references/committee-analysis-round-format.md skills/util-design-partner-role/SKILL.md`
  Baseline: 81,579. Report: "Pre 81,579 → Post Y → delta Z (N%)." Expected ≈ −1,300 to −1,500 bytes (~1.6–1.8%). If reduction < 800 bytes, do NOT block: record the shortfall verbatim in the Step 4 verification commit message and surface it in the execute-write completion summary for designer awareness. The designer decides any follow-up; execution still completes.

- [ ] **Step 2: Cite targets resolve**
  Confirm each new cite points at a real heading/section:
  Run: `grep -n "§ Authority Guard\|§ Consolidator\|§ Scribe\|§ Standalone Invocability\|Output Surfaces\|util-design-partner-role" skills/design-committee/SKILL.md skills/design-committee/references/team-lead.md`
  For each, confirm the target heading still exists in its owner file (`grep -n "^###\|^####\|^## " <owner>`).

- [ ] **Step 3: Preserved-nuance survival**
  Run: `grep -n "do not conflate\|20260521" skills/design-committee/references/committee-analysis-round-format.md` → round-format disambiguation intact (untouched).
  Run: `grep -n "Apply silently\|Strict premise scope" skills/design-committee/references/team-lead.md` → boundary + strict-premise owner intact.
  Run: `grep -n "Transcripts are internal\|Translation Gate does not apply" skills/design-committee/references/member-protocol.md` → member-protocol boundary intact (untouched).
  Run: `grep -n "degrade.to.no.op" skills/design-committee/SKILL.md` → standalone owner intact.
  Run: `grep -n "6. \*\*Synthesize\|7. \*\*Converge" skills/design-committee/references/team-lead.md` → steps 6/7 intact.

- [ ] **Step 4: Commit verification record**
  ```bash
  git -C .worktrees/20260611-01-compact-committee-skill commit --allow-empty -m "docs: cite-graph + nuance-survival verification — byte delta [Z]b ([N]%)"
  ```

---

## Scoped Out / Deferred (with rationale)

Self-containment: each exclusion is intentional and explained, so a correct cut is not mistaken for a gap.

- **Per-Round Flow dedup (brief D2).** The brief lists Per-Round Flow as a 3× restatement (SKILL.md Phase 4, team-lead.md §Per-Round Flow, round-format narrative). **Deferred**, not done. Rationale: collapsing it requires (a) editing the round-format narrative — the same file the designer froze under decision (b) — and (b) restructuring SKILL.md Phase 4, which carries load-bearing orchestration (TeamCreate roster, round-folder creation, checkpoint rule). High blast radius against the designer's chosen option (a) safe pass. Candidate for a separate, contract-aware follow-up sprint. **This is the one AC-1 concept not given single-owner this pass.**
- **Fuller Translation-Gate merge (brief D2: fold §PM Litmus + §Research Boundary into the gate block).** **Deferred.** §PM Litmus (302-304) and §Research Boundary are short, application-scoped sections that add their own nuance; merging them is higher-touch for marginal bytes and was not committee-validated. Task 4 + Task 5 capture the safe rule-bullet collapses.
- **round-format output-surface collapse.** **Scoped out — designer decision (b).** Anaphor-stranding risk (the disambiguation clause's "This output-surface split" depends on the definition) for ~100 bytes. round-format.md stays frozen; not version-bumped.
- **§Standalone Invocability kept as owner — deviates from brief D2's "delete §Standalone Invocability."** **Intentional.** Brief D2 prescribed deleting §Standalone Invocability and moving the one statement to Phase 1. We invert that: §Standalone Invocability (161-163) is the owner; only the §Integration "Does NOT call" line is shortened (Task 3). Rationale: §Standalone Invocability carries the "no degrade-to-no-op / unconditional path" rule — one of round01's seven protected nuances — which Phase 1 (lines 57, 62) does not replicate. Deleting §Standalone would either drop that nuance or require relocating it into Phase 1, a larger contract-touching edit. Keeping §Standalone as owner achieves the dedup (the redundant §Integration prose is removed) while preserving the nuance in place. Same end-state (single owner + cite), safer path.
- **team-lead.md §Self-Evaluation checks NOT collapsed — deviates from brief D2's "Self-Evaluation references it instead of restating."** **Intentional.** Brief D2 named §Self-Evaluation (343-345) as part of the Authority-Guard dedup target. We preserve those three lines because they are imperative self-check *questions* (a mechanism for applying the policy — "Did I let an alignment count stand in for a warrant?"), not policy *restatements*. Collapsing a check to a bare cite would remove the operational prompt the team-lead self-runs before sending. The policy itself lives once at §Authority Guard; the checks invoke it without restating it. Round02 treated the §Self-Eval checks as preserve-in-place.
- **team-lead.md §Behavioral Constraints 124 + steps 6/7.** **Preserved (not duplicates).** Line 124 (strict-premise-scope) is the rule's owner — absent from §Authority Guard, so it has no other home to cite. Steps 6/7 (106-107) are disk-write instructions with an embedded field schema, not policy restatement (round02 4-0).

## Dissent Record (carried from committee)

- **Pragmatist / Conservator (minimal-safe, round01):** "safe cuts recover only ~1.4% of 77KB; designer may need to authorize a riskier second pass or lower the target." → Designer lowered the target (option (a)); riskier second pass deferred above.
- **Conservator (round02):** round-format output-surface edit strands the disambiguation antecedent — scope it out. → Adopted as decision (b).
- **Innovator (round02):** the original plan's "preserve in place if ambiguous" hedge could license a zero-byte Task 6. → Resolved: Task 6 names the single exact collapse target (line 123) and lists every preserved site explicitly; no open-ended hedge remains.

---

## Change Log

- **2026-06-11 — plan-01 (re-grounded + hardened).** Supersedes plan-00. Built via full plan-build process after committee round02 validation. Changes from plan-00: line numbers re-grounded against current v0021 files (sprint -02 had merged, growing SKILL.md and shifting lower-file lines); baseline corrected 80,249 → 81,579; AC-5 target corrected ~25% → ~1.7–2% (honest); Task 6 narrowed to the single true duplicate (line 123) after re-grounding found "Strict premise scope" is not owned by §Authority Guard and steps 6/7 are write-instructions; Task 7 round-format sub-edit scoped out (designer decision (b)), SKILL.md site corrected 122 → 139; Task 8 versions corrected (SKILL.md → v0022, team-lead.md → v0012, round-format not bumped); Per-Round-Flow and fuller Translation-Gate merge explicitly deferred with rationale. Committee record: `committee/round02/`.

<!-- created-at: 2026-06-11T11:36:51Z -->
<!-- produced-by plan-build@v0006 -->
