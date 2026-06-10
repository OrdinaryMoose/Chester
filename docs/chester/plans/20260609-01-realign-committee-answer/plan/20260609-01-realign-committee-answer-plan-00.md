# Plan: Realign Design-Committee to Answer-Delivery

**Sprint:** 20260609-01-realign-committee-answer
**Spec:** docs/chester/working/20260609-01-realign-committee-answer/spec/20260609-01-realign-committee-answer-spec-02.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Realign the `design-committee` skill so each round's terminal object is the most-informative answer to the designer's question (converged / preserved-split / partial) with its gaps named, governed by a team-lead authority guard that warrants every answer-body assertion and records those warrants on disk — landing entirely in three team-lead-owned files.

## Architecture

Hybrid — auditability at minimum surface. All behavioral change lands in `team-lead.md` (the role doc that owns the principles, loop, and authority guard) and `SKILL.md` (orchestration framing); the warrant record and answer-shape marker ride the team-lead's existing on-disk artifacts (`alignment-map.md`, `verdict.md`), documented in `committee-analysis-round-format.md`. No new artifact file, no scribe edit, no member-agent edit, no premise-ledger reference file. Every brief-listed deferral and rigid contract stays byte-unchanged.

## Tech Stack

Markdown skill/reference documents under `skills/design-committee/`. Verification is grep-based observable-boundary checks plus the repo's existing `tests/test-*.sh` (hook/config tests, unaffected by this work). No application code, no test framework changes.

---

## Plan-Wide Conventions and Fixed Decisions

These hold across every task. Read before executing any task.

- **All paths are relative to the repo root** `/home/mike/Documents/CodeProjects/Chester/`.
- **Edits are anchored by quoted text, not line numbers.** Tasks 1–4 all modify `team-lead.md`; each edit shifts the lines below it. Locate every edit by its quoted old-string (the `Find:` block), never by a line number. Line numbers in this plan are orientation only.
- **Same-file ordering (HARD).** Tasks 1 → 2 → 3 → 4 all edit `team-lead.md` and MUST run in that order. Do not parallelize them. Tasks 5 and 6 edit different files and may run any time after Task 4 (they are independent of 1–4 in content but Task 7 gates on all). Task 7 runs last.
- **C-NAMING term is fixed to `output-surface split`.** The designer's working phrase was "two-surface output model," which collides with the existing "two-surface" usage in sprint `20260521-02-design-architect-committee` (C-NAMING forbids the collision). This plan adopts the approved spec's own phrase — **`output-surface split`** — as the term for the P4 concept, used identically in every touched file. (Low-stakes wording; the designer may override the exact phrase during execute-write — if so, change it consistently in all three files.)
- **Round-format version field — set to `v0001` (designer-directed).** The designer established a `version:` field on `committee-analysis-round-format.md` and directed it be set to **v0001**. Task 6 writes a proper top-level `version: v0001` key. The designer's initial edit placed the line *inside* the `description:` block-scalar (indented two spaces), where YAML reads it as description text rather than a field — Task 6 ensures the field is a top-level key and removes any such nested line. AC-5.2's round-format clause is thereby satisfied directly (no longer N/A-by-convention). Scope is exactly this one file: `member-protocol.md` stays unversioned and byte-unchanged (the designer reverted an earlier edit to it), and `artifact-template.md` / `skill-contract.md` remain unversioned and out of scope per designer instruction.
- **No catalog regen.** No `description:` frontmatter changes in this sprint, so `bin/chester-generate-agents` is NOT run (AC-5.2).
- **Staging discipline.** Stage only the file each task edits, by explicit path. Never `git add -A` / `git add .` — the tree may carry unrelated `D`/`??` entries.
- **Commit style.** Skill-behavior changes use `feat:`; the round-format reference doc uses `docs:`. End commit messages with the required `Co-Authored-By` trailer.

---

## Task 1: team-lead.md — Flow with Designer (P1 answer-shape + new constraints + loop reframe)

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3 (Behavioral-Constraints site ~121), AC-3.2, AC-3.6, AC-4.1, AC-4.3
**Decision budget:** 1
**Must remain green:** the Task 1 grep checks below; `tests/test-*.sh`

**Files:**
- Modify: `skills/design-committee/references/team-lead.md` (Behavioral Constraints ~118–125; Per-Round Flow steps 3/6/7/9/11 ~102–110; Ledger ~112–116)

**Steps (TDD):**

- [ ] **Step 1: Write the failing checks**

```bash
# Each check asserts the NEW text is present. All three should be ABSENT before the edit.
grep -qF "terminal object is the **most-informative answer**" skills/design-committee/references/team-lead.md
grep -qF "Count is not a warrant" skills/design-committee/references/team-lead.md
grep -qF "Designer sufficiency is the sole termination trigger" skills/design-committee/references/team-lead.md
```

- [ ] **Step 2: Run checks to verify they fail**

Run: `for p in "terminal object is the **most-informative answer**" "Count is not a warrant" "Designer sufficiency is the sole termination trigger"; do grep -qF "$p" skills/design-committee/references/team-lead.md && echo "PRESENT: $p" || echo "ABSENT: $p"; done`
Expected: all three print `ABSENT`.

- [ ] **Step 3: Apply the edits**

**Edit 1a — Behavioral Constraints.** Find:

```
- Do NOT adjudicate for designer.
- Do NOT collapse irreducible splits when split is the finding.
- Do NOT run more rounds than designer authorizes.
```

Replace with:

```
- Do NOT adjudicate for designer.
- Each round's terminal object is the **most-informative answer** to the designer's question, not a menu of options. Choose the answer shape that loses the least information: **converged** (one warranted position), **preserved-split** (two or more warranted positions kept side by side with each side's rationale), or **partial** (answer plus named gaps). Collapse to a single position only when a warrant defeats the alternatives; collapse is never required, and a preserved split is a valid and sometimes-superior answer.
- **Count is not a warrant.** Alignment count never licenses collapse. A 3-1 does not collapse to the majority on the strength of the count; a warranted minority survives as a preserved split.
- **Strict premise scope.** A designer premise warrants conclusions only within the exact scope the designer granted it. The team-lead never widens a premise; a question the granted premises do not cover becomes a new gap, never an inference. Only the designer may widen scope.
- **Above-threshold gap trichotomy.** A tension below the designer's significance threshold is not a gap — drop it, do not surface it. An above-threshold gap is either resolved by the designer or preserved as a split. Factual gaps route to the researcher; value gaps route to the designer.
- **Designer sufficiency is the sole termination trigger.** The loop ends only when the designer declares the answer sufficient and directs the next action — not on committee convergence, not on a fixed round count.
- Do NOT run more rounds than designer authorizes.
```

**Edit 1b — Per-Round Flow step 3 (ledger premise-scope).** Find:

```
3. **Update the ledger** — write/update `committee/ledger.md` at the round boundary (§ Ledger): round number, members returned, the running alignment pattern, open questions, and any designer decisions so far.
```

Replace with:

```
3. **Update the ledger** — write/update `committee/ledger.md` at the round boundary (§ Ledger): round number, members returned, the running alignment pattern, open questions, any designer decisions so far, and each designer premise with the exact scope it was granted.
```

**Edit 1c — Per-Round Flow step 6 (Synthesize: answer-shape + warrant).** The full line is reproduced in both blocks so the trailing two-round-mode parenthetical is explicitly preserved (the insertion lands before the period after `positions-discarded-with-reason`; everything from `Then **evict**` onward is unchanged). Find:

```
6. **Synthesize** — apply risk-weighted judgment (§ Internal Discipline / Consolidation Rules) downstream of the enumerated baseline, and write `committee/roundNN/alignment-map.md`: the alignment pattern + the full option set + the positions-discarded-with-reason. Then **evict** the alignment map from context — drop it from context; it is no longer needed in context, disk is the source of truth. *(Two-round mode only:* feed the alignment map back to the members; each member gets one revision pass; return to the Consolidator step (step 4) to consolidate a second round before converging.)
```

Replace with:

```
6. **Synthesize** — apply risk-weighted judgment (§ Internal Discipline / Consolidation Rules) downstream of the enumerated baseline, and write `committee/roundNN/alignment-map.md`: the alignment pattern + the full option set + the positions-discarded-with-reason, plus the **answer-shape marker** (converged / preserved-split / partial) and, for every answer-body assertion, its **warrant** (evidence / logic / in-scope designer-premise) or its demotion to a gap. Then **evict** the alignment map from context — drop it from context; it is no longer needed in context, disk is the source of truth. *(Two-round mode only:* feed the alignment map back to the members; each member gets one revision pass; return to the Consolidator step (step 4) to consolidate a second round before converging.)
```

**Edit 1d — Per-Round Flow step 7 (Converge: warrants on disk).** Find:

```
7. **Converge** — read `committee/roundNN/alignment-map.md`, then write `committee/roundNN/verdict.md`: the team-lead's risk-weighted decision, specific and one-sentence-minimum (an ambiguous verdict cannot proceed). Then **evict** it from context.
```

Replace with:

```
7. **Converge** — read `committee/roundNN/alignment-map.md`, then write `committee/roundNN/verdict.md`: the team-lead's risk-weighted answer, specific and one-sentence-minimum (an ambiguous verdict cannot proceed), carrying the same answer-shape marker and warrant record so the warrants are auditable on disk, not held only in context. Then **evict** it from context.
```

**Edit 1e — Per-Round Flow step 9 (Present: P3/P5 reframe).** Find:

```
9. **Present to designer** — read the scribe's artifact once; **the read IS the review**. Presenting from the artifact guarantees the `Dissent Record` is seen. The designer-facing surface follows § Visible Surface / Information Packet Format and § Internal Discipline / Presentation Rules.
```

Replace with:

```
9. **Present to designer** — read the scribe's artifact once; **the read IS the review**. Presenting from the artifact guarantees the `Dissent Record` is seen. The round delivers the most-informative answer in its chosen shape; above-threshold gaps are surfaced to the designer one at a time. When the answer needs a designer value-judgment, the team-lead seeks that decision through the locked decision-communication packet (§ Visible Surface / Output Surfaces and / Information Packet Format) per § Internal Discipline / Presentation Rules.
```

**Edit 1f — Per-Round Flow step 11 (Designer response: trichotomy branches).** Find:

```
11. **Designer response** — one of: adjudicate (loop ends, proceed to Closure); refine question (loop back to step 1 with refined question); next round (loop back to step 1); declare done (loop ends, proceed to Closure). Each new round opens the next `committee/roundNN/` folder per § Record File; prior round folders are never back-edited.
```

Replace with:

```
11. **Designer response** — one of: resolve a surfaced gap (fold the resolution into the next round); preserve a split (the split becomes the answer); wave a gap off (record a threshold calibration in the ledger — the tension was below threshold); refine question (loop back to step 1 with refined question); next round (loop back to step 1); or declare the answer sufficient and direct the next action (loop ends, proceed to Closure). Designer sufficiency is the only termination trigger. Each new round opens the next `committee/roundNN/` folder per § Record File; prior round folders are never back-edited.
```

**Edit 1g — Ledger section (premise scope).** Find:

```
It carries: the round number, which members returned, the running alignment pattern, the open questions, and the designer decisions made so far.
```

Replace with:

```
It carries: the round number, which members returned, the running alignment pattern, the open questions, the designer decisions made so far, and each designer premise with its granted scope (a premise warrants conclusions only within that scope; only the designer may widen it).
```

- [ ] **Step 4: Run checks to verify they pass**

Run: `for p in "terminal object is the **most-informative answer**" "Count is not a warrant" "Strict premise scope" "Above-threshold gap trichotomy" "Designer sufficiency is the sole termination trigger" "answer-shape marker" "preserve a split (the split becomes the answer)" "each designer premise with its granted scope"; do grep -qF "$p" skills/design-committee/references/team-lead.md && echo "PRESENT: $p" || echo "MISSING: $p"; done`
Expected: all eight print `PRESENT`.

Run: `grep -qF "Do NOT collapse irreducible splits when split is the finding." skills/design-committee/references/team-lead.md && echo "STILL PRESENT (bad)" || echo "REMOVED (good)"`
Expected: `REMOVED (good)` — the old line-121 doctrine bullet is gone.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md
git commit -m "$(cat <<'EOF'
feat(committee): P1 answer-shape doctrine + authority constraints in team-lead flow

Replace the no-collapse decision-menu bullet with the converged/preserved-split/
partial answer-shape rule; add count-not-a-warrant, strict premise scope, the
above-threshold gap trichotomy, and designer-sufficiency-as-sole-termination.
Reframe Per-Round Flow steps 6/7/9/11 and the ledger for answer-shape markers,
on-disk warrants, the gap trichotomy, and premise-scope recording.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: team-lead.md — Visible Surface (output-surface split + P2 split-question rule)

**Type:** docs-producing
**Implements:** AC-2.1, AC-2.2, AC-4.2, AC-1.3 (Split-adjudication site ~191)
**Decision budget:** 1
**Must remain green:** the Task 2 grep checks; the four-block-format-preserved check; `tests/test-*.sh`

**Files:**
- Modify: `skills/design-committee/references/team-lead.md` (Visible Surface — insert Output Surfaces subsection after ~146; Split adjudication bullet ~191)

**Steps (TDD):**

- [ ] **Step 1: Write the failing checks**

```bash
grep -q "### Output Surfaces" skills/design-committee/references/team-lead.md
grep -q "output-surface split" skills/design-committee/references/team-lead.md
```

- [ ] **Step 2: Run checks to verify they fail**

Run: `for p in "### Output Surfaces" "output-surface split"; do grep -qF "$p" skills/design-committee/references/team-lead.md && echo "PRESENT: $p" || echo "ABSENT: $p"; done`
Expected: both `ABSENT`.

- [ ] **Step 3: Apply the edits**

**Edit 2a — insert Output Surfaces subsection.** Find:

```
What reaches designer. All items below pass pre-send gates before reaching the designer.

One concept or decision per information packet. Split if more.

### Information Packet Format
```

Replace with:

```
What reaches designer. All items below pass pre-send gates before reaching the designer.

One concept or decision per information packet. Split if more.

### Output Surfaces

The committee has two distinct output surfaces — the **output-surface split**:

- **Decision-communication packet** — the surface the team-lead uses *only when seeking a designer decision*. Its format is **locked and unchanged**: the four-block Information Packet Format (Summary / Information Package / Decision Package / Team-Lead Comments) defined below, with its Style Exemplar. Use it whenever a gap needs a designer value-judgment.
- **End-of-turn session artifact** — what the round leaves behind as its answer. It has **no mandated format**; it is whatever information best fits the question — a converged answer, a preserved split with each side's rationale, or a partial answer with named gaps.

These are separate surfaces: the locked format governs how a decision is *communicated*; it does not constrain the shape of the round's *answer*.

### Information Packet Format
```

**Edit 2b — Split adjudication bullet (P2 + reframe).** Find:

```
- **Split adjudication** (when irreducible). Name the tension explicitly — what each side defends in plain substance. Ask designer which side they solve for. Do NOT collapse to single recommendation when split is the finding.
```

Replace with:

```
- **Split adjudication** (when a split stands). Name the tension explicitly — what each side defends in plain substance. Surface the split as the round's answer, not as a forced choice — a preserved split is a valid answer. When a designer value-judgment is needed to go further, pose the pointed question each side raises against the other — pre-answered where the committee can — and surface these questions one at a time. Never collapse a warranted split to a single recommendation on the strength of count; collapse only on a displayed warrant that defeats the other side.
```

- [ ] **Step 4: Run checks to verify they pass**

Run: `for p in "### Output Surfaces" "output-surface split" "Decision-communication packet" "End-of-turn session artifact" "pose the pointed question each side raises against the other" "surface these questions one at a time"; do grep -qF "$p" skills/design-committee/references/team-lead.md && echo "PRESENT: $p" || echo "MISSING: $p"; done`
Expected: all six `PRESENT`.

Verify the locked four-block format and exemplar are structurally intact (AC-2.2) — the headings and the exemplar blockquote must still be present and unmodified:

Run: `for h in "#### Summary" "#### Information Package" "#### Decision Package" "#### Team-Lead Comments" "### Style Exemplar — What a Good Decision Packet Sounds Like"; do grep -qF "$h" skills/design-committee/references/team-lead.md && echo "INTACT: $h" || echo "DAMAGED: $h"; done`
Expected: all five `INTACT`.

Run: `grep -qF "Do NOT collapse to single recommendation when split is the finding." skills/design-committee/references/team-lead.md && echo "STILL PRESENT (bad)" || echo "REMOVED (good)"`
Expected: `REMOVED (good)`.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md
git commit -m "$(cat <<'EOF'
feat(committee): output-surface split + P2 split-question rule in Visible Surface

Add the Output Surfaces subsection naming the locked decision-communication packet
vs the unformatted end-of-turn session artifact (output-surface split). Reframe the
Split adjudication bullet to deliver a preserved split as the answer and pose each
side's pointed question one at a time. The four-block format and Style Exemplar are
structurally unchanged — additions only.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: team-lead.md — Internal Discipline (authority guard: warrant test, firewall, audit, self-eval)

**Type:** docs-producing
**Implements:** AC-3.1, AC-3.3, AC-3.4, AC-3.5, AC-3.2, AC-3.6, AC-1.3 (Consolidation ~304, Presentation ~308, Self-Eval ~320 sites)
**Decision budget:** 2
**Must remain green:** the Task 3 grep checks; `tests/test-*.sh`

**Files:**
- Modify: `skills/design-committee/references/team-lead.md` (Consolidation Rules ~304; Presentation Rules ~308; Self-Evaluation ~320)

**Steps (TDD):**

- [ ] **Step 1: Write the failing checks**

```bash
grep -q "Authority Guard" skills/design-committee/references/team-lead.md
grep -q "Warrant test" skills/design-committee/references/team-lead.md
grep -q "Warrants on disk" skills/design-committee/references/team-lead.md
```

- [ ] **Step 2: Run checks to verify they fail**

Run: `for p in "Authority Guard" "Warrant test" "Warrants on disk"; do grep -qF "$p" skills/design-committee/references/team-lead.md && echo "PRESENT: $p" || echo "ABSENT: $p"; done`
Expected: all three `ABSENT`.

- [ ] **Step 3: Apply the edits**

**Edit 3a — Consolidation Rules: reframe split sentence + append Authority Guard.** Find:

```
Irreducible split → name split as finding in Decision Package / Split adjudication, do NOT collapse to single recommendation. Researcher findings fold into Information Package / Context as facts — no researcher voice in Team-Lead Comments since researcher has no design opinion by contract.
```

Replace with:

```
A standing split is surfaced as the round's answer in its preserved-split shape — named in Decision Package / Split adjudication — never collapsed to a single recommendation except on a displayed warrant that defeats the other side. Researcher findings fold into Information Package / Context as facts — no researcher voice in Team-Lead Comments since researcher has no design opinion by contract.

**Authority Guard.** The team-lead holds no design opinion, yet it authors the answer. These rules keep it honest:

- **Warrant test.** Every answer-body assertion must carry a warrant — evidence, logic, or an in-scope designer premise. An assertion with no warrant is not written as answer content; it is demoted to a gap. Assert only what can be warranted; everything else is a gap.
- **Count-not-a-warrant.** Alignment count is never a warrant. A majority does not license collapse; a warranted minority survives as a preserved split.
- **C2 firewall.** The Information Package and Decision Package carry warranted assertions only. Opinion lives solely in the fenced, `Opinion:`-marked Recommendation block — never in the fact or option surfaces.
- **C1 audit.** Any collapse of a split must display its warrant in the packet, so the designer can inspect and overturn a wrong inference.
- **Warrants on disk.** The warrant record and the answer-shape marker are written into the team-lead's own `committee/roundNN/alignment-map.md` and `committee/roundNN/verdict.md` — auditable on disk, not held only in context. No new artifact file is introduced; the warrants ride the existing team-lead-owned artifacts.
```

**Edit 3b — Presentation Rules: rewrite "Surface options, not verdict".** Find:

```
Team-lead does NOT adjudicate for designer. Team-lead does NOT collapse member disagreement when disagreement is the finding. Surface options, not verdict. Recommendations remain opinions, marked.
```

Replace with:

```
Team-lead does NOT adjudicate for designer. Team-lead does NOT collapse member disagreement when disagreement is the finding. **Deliver the most-informative answer — which may be a preserved split — not a menu of options and not a verdict that pre-empts the designer.** Recommendations remain opinions, marked.
```

**Edit 3c — Self-Evaluation: reconcile collapse check + add Authority Guard sub-block.** Find:

```
- Did I adjudicate for designer? Yes → strip verdict, restore split.
- Did I collapse irreducible member disagreement? Yes → restore split, name the substance of what designer chooses between.
```

Replace with:

```
- Did I adjudicate for designer? Yes → strip verdict, restore split.
- Did I collapse a warranted split without a displayed warrant? Yes → restore it as a preserved-split answer, name the substance each side defends.
- **Authority Guard — warrant coverage.** Does every answer-body assertion carry a warrant (evidence / logic / in-scope premise)? Any unwarranted assertion → demote it to a gap before sending.
- **Authority Guard — count is not a warrant.** Did I let an alignment count stand in for a warrant? Yes → restore the warranted minority as a preserved split.
- **Authority Guard — strict premise scope.** Did I extend a designer premise past its granted scope? Yes → withdraw the over-extension and surface the uncovered question as a new gap.
```

- [ ] **Step 4: Run checks to verify they pass**

Run: `for p in "Warrant test" "Count-not-a-warrant" "C2 firewall" "C1 audit" "Warrants on disk" "Deliver the most-informative answer" "Authority Guard — warrant coverage" "Authority Guard — strict premise scope"; do grep -qF "$p" skills/design-committee/references/team-lead.md && echo "PRESENT: $p" || echo "MISSING: $p"; done`
Expected: all eight `PRESENT`.

Run: `grep -qF "Surface options, not verdict." skills/design-committee/references/team-lead.md && echo "STILL PRESENT (bad)" || echo "REMOVED (good)"`
Expected: `REMOVED (good)` — the load-bearing decision-menu phrase is gone.

Run: `grep -qF "Irreducible split → name split as finding" skills/design-committee/references/team-lead.md && echo "STILL PRESENT (bad)" || echo "REMOVED (good)"`
Expected: `REMOVED (good)` — the Consolidation Rules decision-menu phrase (Edit 3a target) is gone; a failed Edit 3a fast-fails here instead of waiting for Task 4's gate.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md
git commit -m "$(cat <<'EOF'
feat(committee): team-lead authority guard in Internal Discipline

Add the warrant test, count-not-a-warrant rule, C2 firewall, C1 audit, and
warrants-on-disk rule to Consolidation Rules; rewrite "Surface options, not verdict"
to answer-delivery framing in Presentation Rules; reconcile the collapse self-eval
check and add the three Authority Guard self-eval sub-checks.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: team-lead.md — version bump + doctrine-reconciliation grep gate

**Type:** docs-producing
**Implements:** AC-1.3 (final whole-file grep gate), AC-5.2 (team-lead.md portion)
**Decision budget:** 1
**Must remain green:** the reconciliation grep gate; `tests/test-*.sh`

**Files:**
- Modify: `skills/design-committee/references/team-lead.md` (frontmatter `version:` line ~8)

**Steps (TDD):**

- [ ] **Step 1: Write the failing check**

```bash
grep -q "^version: v0010$" skills/design-committee/references/team-lead.md
```

- [ ] **Step 2: Run check to verify it fails**

Run: `grep -m1 '^version:' skills/design-committee/references/team-lead.md`
Expected: `version: v0009` (not yet bumped).

- [ ] **Step 3: Apply the edit + run the reconciliation gate**

**Edit 4a — version bump.** Find:

```
version: v0009
```

Replace with:

```
version: v0010
```

**Reconciliation gate (AC-1.3).** Run the doctrine grep over the whole file and read every hit:

Run: `grep -ni "surface options\|do not collapse\|collapse irreducible\|not verdict" skills/design-committee/references/team-lead.md`

Expected: every returned line is **consistent with P1** (answer-delivery, preserve-a-warranted-split), and NONE frames the round output as a menu of options. Specifically:
- `Surface options, not verdict` — MUST NOT appear (removed in Task 3).
- `Do NOT collapse irreducible splits when split is the finding` — MUST NOT appear (replaced in Task 1).
- `Do NOT collapse to single recommendation when split is the finding` — MUST NOT appear (reframed in Task 2).
- Surviving `collapse` phrasings (e.g. "collapse is never required", "never collapsed … except on a displayed warrant", "does NOT collapse member disagreement when disagreement is the finding", "Did I collapse a warranted split without a displayed warrant?") are all P1-consistent and may remain.
- Note on the `not verdict` term: it targets the *adjacent* string "options, not verdict" in the old Presentation Rules phrase. After Task 3, the reframed text reads "not **a** verdict that pre-empts the designer" — which does NOT contain the adjacent substring "not verdict", so this term correctly returns nothing post-edit. (Verified: the reframed sentence does not match the gate grep.)

If any menu-framing phrasing survives, return to the owning task (Task 1/2/3) and reconcile it before proceeding.

- [ ] **Step 4: Confirm version + gate pass**

Run: `grep -qF "version: v0010" skills/design-committee/references/team-lead.md && echo "VERSION OK"; for bad in "Surface options, not verdict" "Do NOT collapse irreducible splits when split is the finding" "Do NOT collapse to single recommendation when split is the finding"; do grep -qF "$bad" skills/design-committee/references/team-lead.md && echo "MENU PHRASING SURVIVES: $bad" || echo "CLEAN: $bad"; done`
Expected: `VERSION OK` and three `CLEAN:` lines.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md
git commit -m "$(cat <<'EOF'
feat(committee): bump team-lead.md to v0010 after answer-delivery realignment

Version bump and whole-file doctrine-reconciliation gate: no decision-menu framing
survives; every retained no-collapse phrasing is consistent with the P1 answer-shape
rule.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: SKILL.md — interview-to-resolution framing + output-surface carry-forward + version bump

**Type:** docs-producing
**Implements:** AC-4.3 (orchestration side), AC-2.1 (orchestration carry), AC-5.2 (SKILL.md portion)
**Decision budget:** 1
**Must remain green:** the Task 5 grep checks; `tests/test-*.sh`

**Files:**
- Modify: `skills/design-committee/SKILL.md` (frontmatter `version:` ~4; Phase 2 ~66; Phase 4 step 7 ~122; Phase 4 Modes ~129–132)

**Steps (TDD):**

- [ ] **Step 1: Write the failing checks**

```bash
grep -q "interview to resolution" skills/design-committee/SKILL.md
grep -q "^version: v0020$" skills/design-committee/SKILL.md
```

- [ ] **Step 2: Run checks to verify they fail**

Run: `grep -m1 '^version:' skills/design-committee/SKILL.md; grep -qF "interview to resolution" skills/design-committee/SKILL.md && echo "PRESENT" || echo "ABSENT"`
Expected: `version: v0019` and `ABSENT`.

- [ ] **Step 3: Apply the edits**

**Edit 5a — version bump.** Find:

```
version: v0019
```

Replace with:

```
version: v0020
```

**Edit 5b — Phase 2 Capture Question.** Find:

```
Question (one sentence). Mode: **one-round** (default — single pass; assumed when unspecified) or **two-round** (opt-in Delphi escalation — a revision pass after synthesis). State the mode in the convening message.
```

Replace with:

```
Question (one sentence). The consultation is an **interview to resolution**: rounds continue until the designer declares the answer sufficient and directs the next action — designer sufficiency, not a fixed round count, terminates the loop. **two-round** Delphi escalation (a revision pass after synthesis) is one available technique, not the ceiling; **one-round** (a single pass) is the default when the designer does not ask for more. State the starting mode in the convening message.
```

**Edit 5c — Phase 4 step 7 (Author: output-surface carry-forward).** Find:

```
7. **Author** — the team-lead dispatches the ephemeral scribe with the verdict, the artifact-template path, the consolidator output, and the alignment map; the scribe writes the round's designer-facing decision-packet.
```

Replace with:

```
7. **Author** — the team-lead dispatches the ephemeral scribe with the verdict, the artifact-template path, the consolidator output, and the alignment map; the scribe writes the round's designer-facing decision-packet. The decision-packet is the committee's **decision-communication surface** — a locked format used only when seeking a designer decision; the round's answer itself (the end-of-turn session artifact) has no mandated format. This is the **output-surface split** (§ `references/team-lead.md` Output Surfaces).
```

**Edit 5d — Phase 4 Modes (loop-length framing).** Find:

```
### Modes

- **one-round** (default, assumed when unspecified) — a single pass through the eight steps.
```

Replace with:

```
### Modes

Modes are deliberation techniques within the interview-to-resolution loop — they shape a single round, not the loop's length. The loop runs until the designer declares the answer sufficient (§ `references/team-lead.md` Behavioral Constraints), regardless of per-round mode.

- **one-round** (default, assumed when unspecified) — a single pass through the eight steps.
```

- [ ] **Step 4: Run checks to verify they pass**

Run: `for p in "interview to resolution" "designer declares the answer sufficient" "decision-communication surface" "output-surface split" "Modes are deliberation techniques within the interview-to-resolution loop" "version: v0020"; do grep -qF "$p" skills/design-committee/SKILL.md && echo "PRESENT: $p" || echo "MISSING: $p"; done`
Expected: all six `PRESENT`.

Confirm the `description:` frontmatter is unchanged (no catalog regen needed):
Run: `grep -c "Convene six-role committee" skills/design-committee/SKILL.md`
Expected: `1` — the description line is intact.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "$(cat <<'EOF'
feat(committee): interview-to-resolution framing + output-surface split in SKILL.md

Reframe Phase 2 and Phase 4 Modes so the loop terminates on designer sufficiency
(two-round Delphi is a technique, not the ceiling); carry the output-surface split
into the Author step. Bump v0019 -> v0020. Description frontmatter unchanged — no
catalog regen.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: committee-analysis-round-format.md — answer-shape marker + warrant record + C-NAMING note

**Type:** docs-producing
**Implements:** AC-3.5 (on-disk warrant location), AC-2.1 (naming consistency), AC-5.2 (round-format version → v0001)
**Decision budget:** 1
**Must remain green:** the Task 6 grep checks; `tests/test-*.sh`

**Files:**
- Modify: `skills/design-committee/references/committee-analysis-round-format.md` (alignment-map.md template ~176–189; verdict.md template ~191–199; Conventions ~88–102)

**Steps (TDD):**

- [ ] **Step 1: Write the failing checks**

```bash
grep -q "## Answer shape" skills/design-committee/references/committee-analysis-round-format.md
grep -q "output-surface split" skills/design-committee/references/committee-analysis-round-format.md
```

- [ ] **Step 2: Run checks to verify they fail**

Run: `for p in "## Answer shape" "output-surface split"; do grep -qF "$p" skills/design-committee/references/committee-analysis-round-format.md && echo "PRESENT: $p" || echo "ABSENT: $p"; done`
Expected: both `ABSENT`.

- [ ] **Step 3: Apply the edits**

**Edit 6a — alignment-map.md template: add Answer shape + Warrant record sections.** Find:

```
## Positions discarded (with reason)
<Each option or position set aside this round, and the load-bearing reason it was set aside.>
```

Replace with:

```
## Positions discarded (with reason)
<Each option or position set aside this round, and the load-bearing reason it was set aside.>

## Answer shape
<One of: converged / preserved-split / partial. The shape the round's answer takes — chosen to lose the least information.>

## Warrant record
<For every answer-body assertion, its warrant: evidence / logic / in-scope designer-premise, with the source. An assertion with no warrant is not answer content — record it under the gaps it became instead.>
```

**Edit 6b — verdict.md template: add answer-shape + warrants.** Find:

```
# Verdict — <one-line topic> — roundNN

<The team-lead's risk-weighted decision for this round: specific, one-sentence-minimum (an
ambiguous verdict cannot proceed), written downstream of and distinct from consolidator-output.md
and alignment-map.md. This is the scribe's primary source.>
```

Replace with:

```
# Verdict — <one-line topic> — roundNN

**Answer shape:** <converged / preserved-split / partial>

<The team-lead's risk-weighted answer for this round: specific, one-sentence-minimum (an
ambiguous verdict cannot proceed), written downstream of and distinct from consolidator-output.md
and alignment-map.md. This is the scribe's primary source.>

**Warrants:** <for each answer-body assertion, its warrant (evidence / logic / in-scope designer-premise)
and source — the same record carried in alignment-map.md, restated so the verdict is auditable standalone.>
```

**Edit 6c — Conventions: add answer-shape/warrants convention + C-NAMING note.** Find:

```
- **Translation Gate boundary.** The Gate APPLIES to the scribe's designer-facing decision-packet.
  It does NOT apply to transcripts, findings, the Consolidator output, the alignment map, or the
  verdict — those are internal and may carry code vocabulary.
```

Replace with:

```
- **Translation Gate boundary.** The Gate APPLIES to the scribe's designer-facing decision-packet.
  It does NOT apply to transcripts, findings, the Consolidator output, the alignment map, or the
  verdict — those are internal and may carry code vocabulary.
- **Answer shape + warrants on disk.** `alignment-map.md` and `verdict.md` carry an answer-shape
  marker (converged / preserved-split / partial) and a warrant record for the answer body. These
  ride the existing team-lead artifacts — no new per-round file is introduced. This is the
  committee's **output-surface split**: the scribe's designer-facing decision-packet has a locked
  format; the team-lead's on-disk answer record does not. (This output-surface split is a distinct
  concept from the "two-surface" usage in sprint `20260521-02-design-architect-committee` — do not
  conflate the two terms.)
```

**Edit 6d — frontmatter: establish a proper top-level `version: v0001` field.** The frontmatter must end with a top-level `version: v0001` key directly above the closing `---`. Two operations:

*(Cleanup — only if present.)* If a malformed `version:` line is nested inside the `description:` block-scalar (indented, e.g. `  version: v0000` — left over from a manual edit), remove that line. In a clean checkout of the sprint branch this line is absent; skip the cleanup if `grep -n '^  version:' …` returns nothing.

*(Add.)* Find:

```
  the (guidance) notes. Read when persisting a round.
---
```

Replace with:

```
  the (guidance) notes. Read when persisting a round.
version: v0001
---
```

- [ ] **Step 4: Run checks to verify they pass**

Run: `for p in "## Answer shape" "## Warrant record" "**Answer shape:**" "Answer shape + warrants on disk" "output-surface split"; do grep -qF "$p" skills/design-committee/references/committee-analysis-round-format.md && echo "PRESENT: $p" || echo "MISSING: $p"; done`
Expected: all five `PRESENT`.

Confirm exactly one top-level `version: v0001` field and no nested malformed version line:
Run: `echo "top-level v0001: $(grep -c '^version: v0001$' skills/design-committee/references/committee-analysis-round-format.md)"; echo "nested malformed: $(grep -c '^  version:' skills/design-committee/references/committee-analysis-round-format.md)"`
Expected: `top-level v0001: 1` and `nested malformed: 0`.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/committee-analysis-round-format.md
git commit -m "$(cat <<'EOF'
docs(committee): answer-shape marker + warrant record in round-folder templates

Add Answer shape and Warrant record to the alignment-map.md and verdict.md templates,
and a Conventions note documenting the output-surface split and disambiguating it from
the prior "two-surface" term in sprint 20260521-02. Establish a proper top-level
version field at v0001 (correcting a placement nested in the description block).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Cross-file verification gate (change surface, deferrals, decision-format, versions, tests)

**Type:** docs-producing
**Implements:** AC-5.1, AC-2.2 (final), AC-5.2 (final)
**Decision budget:** 0
**Must remain green:** all checks below; `tests/test-*.sh`

**Files:**
- Modify: none (verification only — no edits, no commit unless a check forces a fix back in an earlier task)

**Steps (TDD):**

- [ ] **Step 1: Define the gate checks**

The gate asserts the realignment touched exactly three files and left every deferral, the locked format, and the versions correct.

- [ ] **Step 2: Run the change-surface + deferral-intactness check (AC-5.1)**

Run:
```bash
git diff --name-only main -- skills/ | sort
```
Expected: exactly these three lines —
```
skills/design-committee/SKILL.md
skills/design-committee/references/committee-analysis-round-format.md
skills/design-committee/references/team-lead.md
```

Confirm every deferred / rigid file is byte-unchanged:
```bash
for f in \
  skills/design-committee/references/member-protocol.md \
  skills/design-committee/references/artifact-template.md \
  skills/design-committee/references/skill-contract.md \
  agents/design-committee-conservator.md \
  agents/design-committee-innovator.md \
  agents/design-committee-pragmatist.md \
  agents/design-committee-purist.md \
  agents/design-committee-researcher.md \
  agents/design-committee-consolidator.md \
  agents/design-committee-scribe.md \
  skills/util-design-partner-role/SKILL.md ; do
    if git diff --quiet main -- "$f"; then echo "UNCHANGED: $f"; else echo "CHANGED (bad): $f"; fi
  done
```
Expected: every line `UNCHANGED:`.

- [ ] **Step 3: Run the decision-format-preservation check (AC-2.2)**

The locked four-block format and Style Exemplar in `team-lead.md` §Visible Surface must be structurally identical (additions around them, no block removed or reshaped). Confirm the headings and exemplar markers survive and the scribe's separate template is byte-unchanged:
```bash
for h in "#### Summary" "#### Information Package" "#### Decision Package" "#### Team-Lead Comments" "### Style Exemplar — What a Good Decision Packet Sounds Like"; do
  grep -qF "$h" skills/design-committee/references/team-lead.md && echo "INTACT: $h" || echo "DAMAGED: $h"; done
# Exemplar BODY intactness (not just its heading): first and last lines of the worked sample must survive.
grep -qF "Target voice: strategist talking the designer through deliberation outcome" skills/design-committee/references/team-lead.md && echo "EXEMPLAR HEAD INTACT" || echo "EXEMPLAR HEAD DAMAGED"
grep -qF "The recommended next step is Step #2" skills/design-committee/references/team-lead.md && echo "EXEMPLAR TAIL INTACT" || echo "EXEMPLAR TAIL DAMAGED"
git diff --quiet main -- skills/design-committee/references/artifact-template.md && echo "scribe artifact-template.md UNCHANGED" || echo "scribe artifact-template.md CHANGED (bad)"
```
Expected: five `INTACT:` lines, `EXEMPLAR HEAD INTACT`, `EXEMPLAR TAIL INTACT`, and `scribe artifact-template.md UNCHANGED`.

- [ ] **Step 4: Run the version + catalog check (AC-5.2)**

```bash
grep -m1 '^version:' skills/design-committee/references/team-lead.md   # expect v0010
grep -m1 '^version:' skills/design-committee/SKILL.md                   # expect v0020
grep -m1 '^version:' skills/design-committee/references/committee-analysis-round-format.md  # expect v0001 (top-level)
grep -c '^  version:' skills/design-committee/references/committee-analysis-round-format.md  # expect 0 (no nested malformed line)
git diff --quiet main -- skills/setup-start/references/skill-index.md && echo "catalog UNCHANGED (good)" || echo "catalog CHANGED (unexpected — no description changed)"
```
Expected: `version: v0010`, `version: v0020`, `version: v0001`, `0` (no nested line), `catalog UNCHANGED (good)`.

- [ ] **Step 5: Run the existing test suite + record the gate result**

```bash
for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 && echo "PASS: $t" || echo "FAIL: $t"; done
```
Expected: every line `PASS:`.

This task makes no file changes and therefore has no commit. If any check fails, return to the owning task (Task 1–6), fix, and re-run this gate. The gate passing is the task's deliverable.

<!-- Plan covers all 13 spec ACs: AC-1.1 (T1), AC-1.2 (T1), AC-1.3 (T1/T2/T3/T4), AC-2.1 (T2/T5/T6), AC-2.2 (T2/T7), AC-3.1 (T3), AC-3.2 (T1/T3), AC-3.3 (T3), AC-3.4 (T3), AC-3.5 (T3/T6/T7), AC-3.6 (T1/T3), AC-4.1 (T1), AC-4.2 (T2), AC-4.3 (T1/T5), AC-5.1 (T7), AC-5.2 (T4/T5/T6/T7). -->

<!-- created-at: 2026-06-10T09:34:23Z -->
<!-- produced-by plan-build@v0006 -->
