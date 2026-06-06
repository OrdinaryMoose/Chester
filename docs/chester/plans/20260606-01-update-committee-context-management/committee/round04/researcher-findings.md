# Researcher — prior-art findings (verbatim, abridged) — round04

## Target: skills/design-committee/SKILL.md (v0017)

**Phase/flow structure — line anchors:**

- Lines 1–5: frontmatter (version: v0017).
- Lines 46–51: `## Checklist` — five-step overview (Bootstrap, Capture Question, Convene, Deliberation, Tear Down). This is the top-level flow index.
- Lines 52–59: `## Phase 1: Bootstrap` — config read, committee/ tree creation, no sprint mechanics.
- Lines 60–63: `## Phase 2: Capture Question`.
- Lines 64–120: `## Phase 3: Convene` — Round 1 confirmation, TeamCreate block (lines 71–79), Round Folders (lines 81–86), Consolidator description (lines 87–90), Convening Message (lines 92–94).
- Lines 95–114: `## Phase 4: Deliberation` — Dispatch (lines 97–99), Peer-DM Protocol (lines 101–104), One-Round-Format (lines 105–113).
- Lines 115–121: `## Phase 5: Tear Down` — brief, delegates to team-lead.md Closure section.

**Round shape / mode declaration:** No "one-round" / "two-round" mode concept present anywhere in SKILL.md. The word "mode" does not appear in SKILL.md. `One-Round-Format` is described as the canonical shape (lines 105–113) — no alternate mode is defined. The spec's two-mode (one-round / two-round) selection is entirely absent.

**Flow changes required by spec (implementation surface):**
- Phase 4 / Per-Round-Flow must be reordered to match spec §5: dispatch → members write (with Final Position) → members signal (typed routing signal) → consolidate (Final Position only) → synthesize (alignment-map.md) → converge (verdict.md) → author (scribe) → present.
- Scribe step and verdict step not present.
- Checkpoint enforcement (prior artifact path as required input) not present.
- Mode selection (one-round / two-round) not present.

---

## Target: skills/design-committee/references/team-lead.md (v0007)

**Consolidation/presentation/closure structure — line anchors:**

- Lines 1–9: frontmatter (version: v0007).
- Lines 86–116: `## Flow with Designer / ### Conversation Loop / #### Per-Round Flow` — 8-step flow. Current steps: (1) Dispatch, (2) One-round-format runs, (3) Update ledger, (4) Dispatch Consolidator, (5) Read Consolidator output, (6) Write Final Recommendation, (7) Present packet, (8) Designer response.
- Lines 87–96: `#### Record File` — root resolution, round-folder organization.
- Lines 109–113: `#### Ledger` — cross-round cross-session handoff surface.
- Lines 115–120: `#### Behavioral Constraints`.
- Lines 122–134: `### Closure` — 4-step: verify records current, stamp provenance, wrapping-skill handoff, TeamDelete.

**Synthesize/converge/evict absent:** The current flow (lines 86–116) has no synthesize step (alignment-map.md) and no converge step (verdict.md). No write-evict pattern present. Team-lead goes directly from reading Consolidator output (step 5) to writing Final Recommendation (step 6) — no intermediate artifact files for synthesize/converge.

**Present-reads-artifact absent:** No "read the artifact" step before presenting; team-lead writes committee-analysis.md and presents from that (lines 104–107). The spec's scribe-generated artifact read at presentation step is not present.

**Signal rejection rule absent:** No "typed routing signal" or "reject malformed signals" anywhere in team-lead.md.

**Lines requiring edit for spec compliance:**
- Lines 99–108: Per-Round Flow steps 3–7 must be expanded to add synthesize (writes alignment-map.md, evicts), converge (writes verdict.md, evicts), dispatch scribe, present-reads-artifact.
- Lines 115–120: Behavioral Constraints — add "reject malformed member signals unread; issue one correction prompt."
- Lines 122–134: Closure — likely minor adjustment to account for new artifacts in round folder.

---

## Target: skills/design-committee/references/member-protocol.md (no version field)

**Current digest shape, transcript discipline, committee-root resolution — line anchors:**

- Lines 1–8: frontmatter (no version field).
- Lines 18–34: `## Digest shape` — current 6-field schema: `{Role, Headline position, Chosen option, Top trade-off, Confidence, Transcript path}`. Prose-capable fields; no "typed routing signal only" restriction.
- Lines 44–62: `## Transcript and round-folder` — transcript path pattern, researcher alternate path, Translation Gate exception for transcripts. No mention of mandatory `## Final Position` section.
- Lines 65–74: `## Write-then-send sequencing` — write transcript first, send digest second. No "Final Position written before signal sent" rule.
- Lines 79–90: `## Committee root resolution` — sprint context vs. designer-asked, single authority statement. DECISIVE: this section will not need to change for spec compliance — the spec adds no new routing rules for committee root.

**Spec-required changes:**
- `## Digest shape` (lines 18–34): Replace 6-field schema with typed routing signal schema `{member, status, round, transcript}`. Remove prose fields entirely. Add rejection rule: malformed signals rejected unread, one correction prompt.
- `## Transcript and round-folder` (lines 44–62): Add mandatory `## Final Position` section requirement: exact header, last section of transcript, 200-word cap, schema `{position, rationale, blocking_risk}`, all fields member-authored.
- Peer-DM schema: Add capped peer-DM schema `[sender]→[target]: [one sentence] / [target]: [one sentence]`, max 2 exchanges per pair. Currently no peer-DM schema in member-protocol.md (peer-DM protocol lives in SKILL.md lines 101–104, not in member-protocol).

---

## Target: agents/design-committee-consolidator.md

**Read scope + output contract — line anchors:**

- Lines 1–4: frontmatter (tools: Read, Glob, Write; model: sonnet).
- Lines 15–17: `## Role / "Read the round folder."` — instruction reads "every member transcript and researcher findings file under the `committee/roundNN/` path." NO scoping to `## Final Position` section — reads full transcripts.
- Lines 20–36: `## Enumeration ceiling — what you MAY produce` — alignment count + sides, one-line per-member position summary, verbatim notable quotes. These three categories are correct per spec but input is not bounded.
- Lines 38–49: `## Hard prohibitions`.
- Lines 40–64: `## Output template` — current template has sections `Alignment`, `Per-member summary`, `Notable quotes`.

**Spec-required change — read-scoping:**
- Lines 15–17: Replace "read every member transcript" with "read only the `## Final Position` section (last section) of each member transcript." This is the sole change to the Consolidator — the enumeration ceiling and hard prohibitions are already correct.

---

## Target: skills/design-committee/references/committee-analysis-round-format.md

**Round-folder record layout — line anchors:**

- Lines 1–11: frontmatter.
- Lines 39–59: `## Folder Shape` — current folder contents: `researcher-findings.md`, `conservator-transcript.md`, `innovator-transcript.md`, `pragmatist-transcript.md`, `purist-transcript.md`, `consolidator-output.md`, `committee-analysis.md`.
- Lines 100–226: `## Template — round folder files` — templates for all current files.

**Scribe/template touch assessment:** The spec adds new per-round files: `alignment-map.md` (synthesize step) and `verdict.md` (converge step). These are not in the current folder shape. The spec also adds a scribe-generated draft artifact. Whether `committee-analysis-round-format.md` needs updating depends on plan scope — the folder shape section (lines 39–59) currently does not include alignment-map.md, verdict.md, or the scribe artifact. If the plan includes updating the round-folder format doc, those files would be added here.

---

## Verification Results

**agents/design-committee-scribe.md — existence check:**
Does NOT exist. Confirmed by directory listing. Agents present: `design-committee-conservator.md`, `design-committee-consolidator.md`, `design-committee-innovator.md`, `design-committee-pragmatist.md`, `design-committee-purist.md`, `design-committee-researcher.md`. Scribe must be created new.

**Tests touching design-committee:**
Exactly one: `tests/test-design-committee-context-economy.sh`. This is the only test file containing "design-committee" or "committee." Plan "Must remain green" applies to this one test.

**Handoff/artifact template — existence check:**
No handoff or artifact template file exists in `skills/design-committee/references/`. Current reference files: `committee-analysis-round-format.md`, `member-protocol.md`, `skill-contract.md`, `team-lead.md`. No annotated handoff template with `Dissent Record` section. Must be created new — spec §9 says "location per artifact-schema"; util-artifact-schema owns location convention.

**setup-start two-place sync:**
`skills/setup-start/SKILL.md` does NOT directly list design-committee — it delegates to `references/skill-index.md`. The skill-index.md at line 27 has a design-committee entry: description matches current SKILL.md description field. If the SKILL.md description field changes, `skill-index.md` line 27 is the sync target (not setup-start/SKILL.md body directly).

**Spec-surface gap found:**
The spec (§9) lists `skills/design-committee/references/committee-analysis-round-format.md` as NOT in the implementation surface. However, the folder shape documented there (lines 39–59) omits `alignment-map.md` and `verdict.md` which the spec introduces. Either the plan must add committee-analysis-round-format.md to the implementation surface, or accept that the round-folder format doc stays out of sync with actual round contents.

Synthesis (facts): All five primary implementation surface files are verified with exact line anchors. The scribe agent and handoff template are confirmed absent — both must be created. One test file is at stake. The setup-start sync target is skill-index.md line 27, not setup-start/SKILL.md body. A potential gap exists: committee-analysis-round-format.md is not in the spec's implementation surface but will be inconsistent with the new round folder contents unless updated.
