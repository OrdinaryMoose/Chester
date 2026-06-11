# Pragmatist — round01 transcript
# Sprint: 20260611-01-compact-committee-skill

---

## Position

### Lens framing

Benefit is concrete and measured: ~77KB orchestrator load → target ~25% reduction, so ~19KB / ~4.5K tokens saved every invocation. Cost is edit risk across a dense cite-graph (researcher mapped 20+ outbound cites across 4 files) plus 7 load-bearing nuances the researcher flagged as NOT safe to collapse blindly. The plan has to earn those edits one task at a time.

Ordering principle: **saving-per-unit-risk, highest first.** Low-risk high-saving cuts go first. High-risk low-saving cuts go last or get deferred. Each task = one conceptual cut, one commit.

---

### Task ordering rationale (before the task list)

| Rank | Cut | Saving estimate | Risk |
|------|-----|----------------|------|
| 1 | SKILL.md § Six Members: drop lens sentences, keep roster | ~200 bytes / ~6 lines | Very low — researcher confirmed agent files are authoritative; SKILL.md is compressed restatement only |
| 2 | SKILL.md § Integration line 156: drop redundant ephemeral statement | ~150 bytes / ~1 line | Very low — researcher confirmed this is the third SKILL.md site for ephemeral-off-roster; Sites A+B (§Consolidator/§Scribe) already say it |
| 3 | SKILL.md § Standalone Invocability: collapse 3× within SKILL.md to one site | ~250 bytes / ~5 lines | Low — researcher confirmed "no degrade-to-no-op" is unique to Site B; plan preserves it by moving it to Phase 1, not deleting it |
| 4 | SKILL.md § Translation Gate: drop rule-restatement bullets, keep the cite | ~200 bytes / ~4 lines | Low — researcher confirmed rules live in util-design-partner-role; SKILL.md line 45 already has the authoritative cite |
| 5 | team-lead.md §Translation Gate (lines 291–299): collapse to cite of util, keep "apply silently" + boundary clauses | ~300 bytes / ~7 lines | Low-moderate — researcher confirmed lines 26–37 and 291–299 are genuine duplicates; boundary clauses at round-format:101-103 and member-protocol:67-69 must survive (they're not in team-lead.md anyway, so no collision) |
| 6 | Version bumps for touched files | negligible bytes | Zero — required by convention |
| 7 | Final cite-graph integrity + byte-delta verification | zero-edit pass | Low — verification only |

**Deferred (see explicit list below):** Per-Round Flow merge, team-lead.md Authority Guard § Self-Evaluation collapse, Output-surface-split cross-file dedup with round-format disambiguation clause.

---

### Implementation Plan

# Plan: Compact design-committee skill runtime context

**Sprint:** 20260611-01-compact-committee-skill
**Spec:** `docs/chester/working/20260611-01-compact-committee-skill/design/20260611-01-compact-committee-skill-design-00.md` (design brief standing in for spec)
**Execution mode:** inline

> **For agentic workers:** Tasks are docs-producing edits. Adapted TDD shape: grep/wc confirms duplicate → edit → re-grep + byte-count + cite-graph check. One commit per task.

## Goal

Cut design-committee orchestrator runtime context by deduping restatements to single authoritative sites with one-line cites, without changing any behavioral contract.

## Architecture

Extend the cite-not-restate pattern already established by `member-protocol.md` (self-declared single authority for Final Position and committee-root resolution) to four additional cross-file concepts and three within-SKILL.md duplicates. Owner per concept: agent files own member lenses; util-design-partner-role owns Translation Gate rules; team-lead.md owns Per-Round Flow detail; existing §Consolidator/§Scribe own ephemeral-off-roster policy.

## Tech Stack

Markdown file edits. `wc -c` for byte counts. `grep` for cite-graph verification.

---

## Task 1: SKILL.md § Six Members — roster only, drop lens sentences

**Type:** docs-producing
**Implements:** D2 (member lenses → agent files own; SKILL.md keeps roster only)
**Decision budget:** 1
**Must remain green:** n/a (no tests; behavioral contract: member roster in TeamCreate block is unchanged; lens sentences absent from SKILL.md)

**Files:**
- Modify: `skills/design-committee/SKILL.md:29-33`

**Steps (docs-producing TDD):**

- [ ] **Step 1: Confirm duplicate — grep for lens sentences in SKILL.md vs agent files**

```bash
grep -n "Defends existing structure\|Pushes new framings\|Weighs op cost\|Tests category" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
grep -n "Lens Position" \
  /home/mike/Documents/CodeProjects/Chester/agents/design-committee-conservator.md \
  /home/mike/Documents/CodeProjects/Chester/agents/design-committee-pragmatist.md
```

Expected: SKILL.md:29-33 returns 4 matches; agent files each carry a full `## Lens Position` section confirming they are the authoritative source.

- [ ] **Step 2: Baseline byte count**

```bash
wc -c /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```

Record as BEFORE value.

- [ ] **Step 3: Edit SKILL.md lines 29–33 — keep agent-name + skill-id token, drop lens description sentence**

Target shape (each line becomes two-part: role name + agent path, no prose lens):

```markdown
- Team-Lead (calling agent). Dispatches, receives, compiles. No design opinion. NOT relay during deliberation — peers DM peers direct. Holds workflow thread. No proof mutations. Role: `references/team-lead.md`.
- Conservator; `chester:design-committee-conservator`. Lens: agent file.
- Innovator; `chester:design-committee-innovator`. Lens: agent file.
- Pragmatist; `chester:design-committee-pragmatist`. Lens: agent file.
- Purist; `chester:design-committee-purist`. Lens: agent file.
- Researcher; `chester:design-committee-researcher`. Tools: Read, Glob, Grep, Bash, WebSearch, WebFetch, Write. Owns codebase, prior-art, industry research, doc reading, multi-source consolidation, absence findings. Hard prohibitions: no design opinion, no proof-state ops, no file writes outside the `committee/` tree and the conversation record (writes findings to its round-folder findings file).
- Designer (human, non-dispatched). Adjudicates all decisions. Sets meta-rules. Authorizes charter changes. Never spawned as subagent.
```

Note: Team-Lead line and Researcher line are NOT shortened — they carry unique content not duplicated in agent files (Team-Lead is the calling agent, not a dispatched subagent; Researcher's tool-list and prohibitions are the operational spec for its dispatch). Only Conservator/Innovator/Pragmatist/Purist lines drop their lens sentences.

- [ ] **Step 4: Re-grep to confirm lens sentences removed; byte-count delta**

```bash
grep -n "Defends existing structure\|Pushes new framings\|Weighs op cost\|Tests category" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
wc -c /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```

Expected: 0 matches for lens sentences. Byte count reduced by ~200 bytes vs BEFORE.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(committee): drop lens restatement from § Six Members — agent files are authoritative"
```

**Saving estimate:** ~200 bytes / ~4 lines
**Risk note:** Very low. Agent files carry full lens sections confirmed by researcher. TeamCreate roster block (lines 74–84) is untouched. No cites point into the lens sentences themselves.

---

## Task 2: SKILL.md § Integration line 156 — drop redundant ephemeral statement

**Type:** docs-producing
**Implements:** D2 (ephemeral-off-roster → §Consolidator and §Scribe are the authoritative SKILL.md sites; Integration line adds nothing)
**Decision budget:** 1
**Must remain green:** n/a

**Files:**
- Modify: `skills/design-committee/SKILL.md:156`

**Steps (docs-producing TDD):**

- [ ] **Step 1: Confirm duplicate — grep all three SKILL.md ephemeral sites**

```bash
grep -n "EPHEMERAL\|ephemeral\|not on the.*roster\|off-roster" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```

Expected: line 92 (§Consolidator), line 96 (§Scribe), line 156 (§Integration). Researcher confirmed lines 92+96 are the policy sites; line 156 is the third/redundant SKILL.md site.

- [ ] **Step 2: Baseline byte count**

```bash
wc -c /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```

Record BEFORE value.

- [ ] **Step 3: Edit SKILL.md line 156 — shorten Integration Calls line**

Current line 156 (approximate):
```
- **Calls:** `TeamCreate`, `SendMessage`, `TeamDelete` (orchestration); `chester-config-read` (config); `chester:design-committee-*` agents (members + researcher); `chester:design-committee-consolidator` (ephemeral per-round consolidation dispatch, not on the `TeamCreate` roster); `chester:design-committee-scribe` (ephemeral per-round authoring dispatch, not on the `TeamCreate` roster).
```

Target (drop the parenthetical ephemeral/not-on-roster prose from each):
```
- **Calls:** `TeamCreate`, `SendMessage`, `TeamDelete` (orchestration); `chester-config-read` (config); `chester:design-committee-*` agents (members + researcher); `chester:design-committee-consolidator` (§ Consolidator above); `chester:design-committee-scribe` (§ Scribe above).
```

The `§ Consolidator above` and `§ Scribe above` pointers are the cite-not-restate replacement — they point the reader to the authoritative policy site rather than restating it.

- [ ] **Step 4: Re-grep Integration line; byte-count delta**

```bash
grep -n "ephemeral\|not on the.*roster" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
wc -c /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```

Expected: 0 matches on line 156; lines 92+96 still match. Byte count reduced ~150 bytes vs BEFORE.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(committee): collapse Integration ephemeral restatement to cite of § Consolidator/§ Scribe"
```

**Saving estimate:** ~150 bytes / ~1 line trimmed
**Risk note:** Very low. §Consolidator (line 92) and §Scribe (line 96) carry the policy; the Integration line is the only redundant third site within SKILL.md. No cites in other files point to Integration's ephemeral clause specifically.

---

## Task 3: SKILL.md § Standalone Invocability — collapse 3× within SKILL.md to one site

**Type:** docs-producing
**Implements:** D2 (standalone → one statement; § Standalone Invocability becomes sole site; Phase 1 carries the no-sprint operational step; Integration pointer cites Phase 1)
**Decision budget:** 2
**Must remain green:** n/a

**Files:**
- Modify: `skills/design-committee/SKILL.md:57,62,142-146,159`

**Steps (docs-producing TDD):**

- [ ] **Step 1: Confirm 3 sites and identify unique content**

```bash
grep -n "standalone\|Standalone\|start-bootstrap\|sprint mechanics\|no degrade\|unconditional path" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```

Expected: matches at ~line 57 (Phase 1 operational note), ~line 62 (Phase 1 step 4 prohibition), ~line 142–146 (§ Standalone Invocability section), ~line 159 (Integration "Does NOT call").

Researcher identified: Site A (Phase 1, lines 55–57+62) — operational step; Site B (§ Standalone Invocability, lines 142–146) — adds "no degrade-to-no-op / unconditional path" rule; Site C (Integration line 159) — prohibition list. Site B has unique content that must survive.

- [ ] **Step 2: Baseline byte count**

```bash
wc -c /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```

Record BEFORE value.

- [ ] **Step 3: Edit SKILL.md**

Three sub-edits in one pass:

**Sub-edit A — Phase 1 description (line 57):** Keep operational text; Phase 1 is already the right home for the no-sprint operational rule. Add "no degrade-to-no-op / unconditional path" rule here (moved from § Standalone Invocability), so Phase 1 becomes the single owner of the operational + behavioral constraint. Append to Phase 1 intro sentence:

```markdown
Read environment + config, then establish the `committee/` work-product tree. No sprint creation, no thinking history. Standalone invocability preserved — no degrade-to-no-op; every consult follows the same unconditional path.
```

**Sub-edit B — § Standalone Invocability (lines 142–146):** Reduce to a cite-not-restate pointer:

```markdown
## Standalone Invocability

No entry condition. No sprint context required. Convene from any context. Operational detail and constraints in Phase 1 above — that section is the single authority for standalone invocability; no sprint is created, no degrade-to-no-op, unconditional path.
```

(Keeps the "no entry condition / no sprint required" orientation sentence because it serves as the section anchor for any external cite; drops the paragraph restatement of Phase 1.)

**Sub-edit C — Integration "Does NOT call" line (line 159):** The prohibition list stays — it names specific skills not to call. Trim the trailing restatement of the rationale (already owned by Phase 1):

```markdown
- **Does NOT call:** `start-bootstrap`, `util-worktree`, any sprint-creating skill. (Phase 1 above owns standalone invocability — no sprint, no degrade-to-no-op.)
```

- [ ] **Step 4: Re-grep and byte-count delta**

```bash
grep -n "standalone\|Standalone\|unconditional path\|no degrade" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
wc -c /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```

Expected: "standalone" still appears at Phase 1, § Standalone Invocability (now as pointer), Integration line. "unconditional path" appears at Phase 1 (moved there). Byte count reduced ~250 bytes vs BEFORE.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(committee): collapse standalone invocability to Phase 1 — § Standalone Invocability and Integration line become cites"
```

**Saving estimate:** ~250 bytes / ~5 lines
**Risk note:** Low. "No degrade-to-no-op" unique content is preserved by moving it to Phase 1 rather than deleting. The section heading `## Standalone Invocability` is kept (reduced to pointer) so any external cite to it doesn't dangle. Researcher confirmed no other files cite this specific section heading.

---

## Task 4: SKILL.md § Translation Gate — drop rule-restatement bullets, keep cite

**Type:** docs-producing
**Implements:** D2 (Translation Gate → util-design-partner-role owns full spec; SKILL.md keeps one-line cite only)
**Decision budget:** 1
**Must remain green:** n/a

**Files:**
- Modify: `skills/design-committee/SKILL.md:36-45`

**Steps (docs-producing TDD):**

- [ ] **Step 1: Confirm duplicate — grep rule bullets vs util-design-partner-role**

```bash
grep -n "Read-aloud\|Option-naming\|C1 Externalized\|C2 Fact Default" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md \
  /home/mike/Documents/CodeProjects/Chester/skills/util-design-partner-role/SKILL.md
```

Expected: SKILL.md lines 40–43 match (4 restatement bullets); util-design-partner-role has the same concepts in its authoritative spec. SKILL.md line 45 already carries the authoritative cite.

- [ ] **Step 2: Baseline byte count**

```bash
wc -c /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```

Record BEFORE value.

- [ ] **Step 3: Edit SKILL.md § Translation Gate (lines 36–45)**

Current section:
```markdown
## Translation Gate

Floor enforcement. Every subagent self-enforces. Team-lead re-checks at consolidation per `references/team-lead.md`. Apply before output reaches designer.

- Read-aloud test. Can't say sentence aloud over coffee → rewrite. Catches code vocab, paths, dot-identifiers, type-theory jargon.
- Option-naming. Name options by what they do structurally, not by type they introduce.
- C1 Externalized Coverage. Load-bearing premise must surface in output before counting toward shared understanding.
- C2 Fact Default with Marked Departures. Default = verified fact. Mark `Assumption:` for unverified premise. Mark `Opinion:` for stance. Recommendations always opinions.

Full voice spec: `skills/util-design-partner-role/SKILL.md`. LOAD-BEARING citation. Touch util-design-partner-role → audit committee impact.
```

Target (keep framing sentence + boundary statement + cite; drop the 4 rule bullets):
```markdown
## Translation Gate

Floor enforcement. Every subagent self-enforces. Team-lead re-checks at consolidation per `references/team-lead.md`. Apply before output reaches designer. Full rules: `skills/util-design-partner-role/SKILL.md` — LOAD-BEARING citation. Touch util-design-partner-role → audit committee impact.
```

Note: the 4 bullet points (Read-aloud, Option-naming, C1, C2) are the restatement being removed. The framing sentence (floor enforcement, every subagent self-enforces) and the LOAD-BEARING cite are kept.

- [ ] **Step 4: Re-grep and byte-count delta**

```bash
grep -n "Read-aloud\|Option-naming\|C1 Externalized\|C2 Fact Default" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
grep -n "Translation Gate\|util-design-partner-role" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
wc -c /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```

Expected: 0 matches for rule bullets; "Translation Gate" section heading and util-design-partner-role cite still present. Byte count reduced ~200 bytes vs BEFORE.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(committee): collapse § Translation Gate rule-restatement — cite util-design-partner-role only"
```

**Saving estimate:** ~200 bytes / ~5 lines
**Risk note:** Low. The 4 bullets are confirmed duplicates of util-design-partner-role content. The LOAD-BEARING cite on line 45 is preserved and carries the section forward. The framing sentence about "every subagent self-enforces" and the team-lead re-check pointer are orientation-only and are kept in shortened form.

---

## Task 5: team-lead.md §Translation Gate (lines 291–299) — collapse to cite, preserve "apply silently" + scope note

**Type:** docs-producing
**Implements:** D2 (Translation Gate rules → util-design-partner-role owns; team-lead.md §Voice lines 26–37 carries the application instruction "apply silently" as unique content; second Translation Gate block lines 291–299 is the genuine intra-file duplicate to remove)
**Decision budget:** 2
**Must remain green:** n/a

**Files:**
- Modify: `skills/design-committee/references/team-lead.md:291-299`

**Steps (docs-producing TDD):**

- [ ] **Step 1: Confirm 2 Translation Gate sites in team-lead.md and unique content at each**

```bash
grep -n "Translation Gate\|Read-aloud\|read-aloud\|Option-naming\|no code vocab" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```

Expected: Site B1 at lines 26–37 (§Voice — lists rules, adds "apply silently" unique instruction); Site B2 at lines 291–299 (§Translation Gate — restates same rules without adding anything new).

Researcher confirmed: Site B1 unique content = "Do NOT restate rules in packet. Apply silently." Site B2 is a pure restatement of the same rules already in B1.

- [ ] **Step 2: Baseline byte count**

```bash
wc -c /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```

Record BEFORE value.

- [ ] **Step 3: Edit team-lead.md lines 291–299**

Current § Translation Gate block (Site B2, lines 291–299):
```markdown
### Translation Gate

Full spec in util-design-partner-role. Pre-send enforcement on every designer-visible block:

- Read-aloud test passes.
- Option-naming rule applied.
- No code vocab, paths, dot-identifiers, type-theory jargon, file suffixes, sprint IDs.
- C1 — load-bearing premise visible in packet.
- C2 — Assumption + Opinion markers applied; recommendations always Opinion.
```

Target (collapse to a single enforcement-reminder line that cites §Voice above):
```markdown
### Translation Gate

Pre-send: apply full spec from `skills/util-design-partner-role/SKILL.md` per §Voice above (read-aloud, option-naming, no code vocab, C1, C2). Apply silently — do not restate rules in packet.
```

Note: "apply silently" is preserved (moved from Site B1 into this cite line) so the combined behavior is fully represented at both sites without duplication. Site B1 (§Voice, lines 26–37) loses its "apply silently" tail line (line 37) in the same edit, since it now lives here as the authoritative place.

Wait — re-examine: researcher said line 37 "Do NOT restate rules in packet. Apply silently." is unique to Site B1. Better to keep it at Site B1 and make Site B2 purely a cite. Do not move content between sites; just collapse the rule-restatement bullets at Site B2:

```markdown
### Translation Gate

Pre-send enforcement on every designer-visible block. Full spec: `skills/util-design-partner-role/SKILL.md` per §Voice above — apply silently, do not restate rules in packet.
```

This keeps "apply silently" note at the enforcement gate where it matters most operationally, removes the 5 restatement bullets, and cites the spec location.

- [ ] **Step 4: Re-grep and byte-count delta**

```bash
grep -n "Translation Gate" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
grep -n "Read-aloud test passes\|Option-naming rule applied\|No code vocab" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
wc -c /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```

Expected: §Translation Gate heading still present at line ~291; 0 matches for the 5 rule bullets; §Voice at line 26 still present and unchanged. Byte count reduced ~300 bytes vs BEFORE.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md
git commit -m "docs(committee): collapse team-lead.md § Translation Gate rule bullets — cite §Voice + util"
```

**Saving estimate:** ~300 bytes / ~7 lines
**Risk note:** Low-moderate. Researcher confirmed Site B2 (lines 291–299) is a genuine intra-file duplicate of Site B1 (lines 26–37). Risk: Site B1 §Voice lists rules as a "before consolidating" checklist; Site B2 is a "pre-send" gate. The operational distinction (consolidation-time vs send-time) is preserved by keeping both section headings. The restatement is in the rule bullets, not the gate framing. "Apply silently" instruction kept at Site B2 (enforcement gate) for operational clarity. No dangling cites — the cite-graph shows team-lead.md:293 cites util-design-partner-role, which this edit converts to a forward-reference to §Voice above and util; the cite is preserved, not broken.

---

## Task 6: Version bumps for all touched files

**Type:** docs-producing
**Implements:** version-bump rule (CLAUDE.md § Skill File Conventions — meaningful behavior change → bump)
**Decision budget:** 0
**Must remain green:** n/a

**Files:**
- Modify: `skills/design-committee/SKILL.md:4` (version field)
- Modify: `skills/design-committee/references/team-lead.md:8` (version field)

Note: `references/member-protocol.md`, `references/committee-analysis-round-format.md` are NOT touched by this plan's tasks — no version bump needed. `member-protocol.md` has no version field anyway (researcher confirmed).

**Steps (docs-producing TDD):**

- [ ] **Step 1: Read current version fields**

```bash
grep -n "^version:" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```

Expected: SKILL.md `version: v0020`; team-lead.md `version: v0011` (researcher confirmed).

- [ ] **Step 2: Baseline byte count (combined)**

```bash
wc -c \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```

Record BEFORE values.

- [ ] **Step 3: Bump versions**

SKILL.md: `version: v0020` → `version: v0021`
team-lead.md: `version: v0011` → `version: v0012`

- [ ] **Step 4: Re-grep to confirm bumps**

```bash
grep -n "^version:" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```

Expected: v0021 and v0012 respectively.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md \
        skills/design-committee/references/team-lead.md
git commit -m "chore(committee): version-bump SKILL.md → v0021, team-lead.md → v0012 after dedup pass"
```

**Saving estimate:** 0 bytes (version bump is 1-char change each)
**Risk note:** Zero. Required by convention. Errors caught immediately by grep in step 4.

---

## Task 7: Cite-graph integrity + total byte-delta verification

**Type:** docs-producing (verification only — no file edits)
**Implements:** acceptance criteria: no dangling cites; measured byte reduction reported
**Decision budget:** 0
**Must remain green:** n/a

**Files:**
- Read: all 4 orchestrator runtime files (no writes)

**Steps:**

- [ ] **Step 1: Verify all outbound cites from SKILL.md still resolve**

```bash
# Check § Translation Gate cite target still exists in util
grep -n "Translation Gate\|Interpreter Frame\|Read-aloud" \
  /home/mike/Documents/CodeProjects/Chester/skills/util-design-partner-role/SKILL.md | head -5

# Check SKILL.md:38 cite to team-lead.md Translation Gate section
grep -n "Translation Gate" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md

# Check SKILL.md:122 cite to team-lead.md § Output Surfaces
grep -n "Output Surfaces" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md

# Check SKILL.md:131 cite to team-lead.md § Behavioral Constraints
grep -n "Behavioral Constraints" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md

# Check SKILL.md:138 cite to team-lead.md Closure
grep -n "^### Closure" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```

Expected: all target headings present.

- [ ] **Step 2: Verify team-lead.md outbound cites still resolve**

```bash
# team-lead.md §Voice cite to util-design-partner-role
grep -n "PM Litmus\|Research Boundary" \
  /home/mike/Documents/CodeProjects/Chester/skills/util-design-partner-role/SKILL.md

# team-lead.md cites to member-protocol.md sections
grep -n "Committee root resolution\|Final Position\|Write-then-send\|Routing signal" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/member-protocol.md
```

Expected: all target headings present.

- [ ] **Step 3: Confirm no new cite created in this plan points to a renamed or deleted heading**

```bash
# § Standalone Invocability heading still present (Tasks 1–4 only modified SKILL.md content)
grep -n "^## Standalone Invocability" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md

# § Translation Gate heading in team-lead.md still present
grep -n "^### Translation Gate" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```

Expected: both headings present.

- [ ] **Step 4: Final byte counts vs baseline — report actual reduction**

```bash
wc -c \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/member-protocol.md \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/committee-analysis-round-format.md \
  /home/mike/Documents/CodeProjects/Chester/skills/util-design-partner-role/SKILL.md
```

Compare to researcher baseline: SKILL.md 15,379 + team-lead.md 31,112 + member-protocol.md 7,224 + round-format.md 11,537 + util 14,997 = 80,249 bytes (total with util).

Assumption: tasks 1–5 target ~1,100 bytes combined. If actual reduction is below ~800 bytes, flag for designer — the estimate may have been optimistic.

- [ ] **Step 5: No commit needed** — verification-only task. Write byte-delta report as a comment in the sprint plan or summarize inline for designer review.

**Saving estimate:** 0 bytes (verification task)
**Risk note:** Zero for this task. If a dangling cite is found at this step, fix before closing sprint.

---

### Deferred / Not Worth It

**1. Per-Round Flow merge (SKILL.md + team-lead.md)**

Researcher finding (Task 3, DECISIVE): team-lead.md has 3 genuinely additional steps (ledger update, checkpoint-as-blocker, designer-response taxonomy) not present in SKILL.md. These are not finer granularity of the same content — they are new content. Collapsing the two sites requires moving content from one file to the other plus verifying no behavioral contract is lost. High edit risk for moderate saving (~300–400 bytes at most). SKILL.md line 114 already contains a pointer to team-lead.md for detail — the dedup is already partially done. Defer: cost exceeds benefit this pass.

**2. team-lead.md Authority Guard § Self-Evaluation (lines 342–344) — collapse to cite of §Authority Guard**

Researcher finding (Task 8): the Self-Evaluation block (lines 342–344) is the imperative self-check form of §Authority Guard (lines 319–325). The researcher noted it is "safe to reduce to cite of §Authority Guard but check questions themselves are useful in situ." Pragmatist concurs — the three Authority Guard bullets in §Self-Evaluation serve as an actionable checklist at send time; they are not a pure restatement but an operationalized reminder. Removing them increases the risk that the team-lead misses the warrant check in the heat of the round. The saving is ~200 bytes; the risk is a silent behavioral regression (warrant checks skipped). Not worth it.

**3. Output-surface-split cross-file dedup (round-format.md + SKILL.md + team-lead.md)**

Researcher finding (Task 5): round-format.md carries a unique disambiguation clause ("do not conflate with the two-surface usage in sprint 20260521-02-design-architect-committee") not present in team-lead.md § Output Surfaces. Collapsing requires either preserving this clause in the cite or moving it to the target. SKILL.md line 122 already cites team-lead.md §Output Surfaces — the partial dedup is already done. Saving from removing round-format's clause = ~100 bytes. Risk of losing the disambiguation clause = causes future confusion about a term collision. Defer: too small a saving, too specific a nuance to touch lightly.

**4. team-lead.md §Voice + §Translation Gate B1 consolidation (lines 26–37)**

§Voice at lines 26–37 lists the gate rules as a "before consolidating" preparation checklist; it adds "apply silently" (unique) and "do not restate rules in packet" (unique). This section is not a pure restatement — it is the team-lead's role-specific application brief. Task 5 above already removes the duplicate at Site B2 (lines 291–299). Site B1 should stay as the application brief. Defer the further collapse of B1 itself.

**5. Any edits to member-protocol.md, round-format.md, or util-design-partner-role**

member-protocol.md is the cite-not-restate model — it should stay essentially untouched (brief constraint, researcher confirmed). round-format.md boundary clauses are load-bearing nuances (Translation Gate applies-to-which-artifacts rule at lines 101–103 is the only statement of that boundary scope). util-design-partner-role edits carry committee-wide impact and require a separate audit (SKILL.md line 45 explicitly flags this: "Touch util-design-partner-role → audit committee impact"). All three deferred.

---

### Saving summary

| Task | File | Estimated saving |
|------|------|-----------------|
| Task 1 | SKILL.md § Six Members | ~200 bytes |
| Task 2 | SKILL.md § Integration line 156 | ~150 bytes |
| Task 3 | SKILL.md § Standalone Invocability | ~250 bytes |
| Task 4 | SKILL.md § Translation Gate | ~200 bytes |
| Task 5 | team-lead.md §Translation Gate B2 | ~300 bytes |
| **Total** | | **~1,100 bytes** |

Assumption: this is ~1.4% of the 77KB orchestrator load. The brief's "25% / 4K token" target is not achievable by the safe low-risk cuts alone. The larger savings (Per-Round Flow, Authority Guard multi-site, full Output-surface dedup) require the high-risk surgery deferred above. The plan author should surface this gap to the designer: the safe plan saves ~1.1KB; the full brief target requires deferring the risky cuts to a second pass with more surgical care.

---

## Final Position

```
position: ranked minimal plan — 5 low-risk dedup cuts in SKILL.md + team-lead.md, explicit deferral of 5 high-risk or low-saving cuts
rationale: benefit is ~1.1KB / ~275 tokens from the safe cuts alone — materially below the brief's 25%/4K-token target; the large savings live in the deferred cuts (Per-Round Flow merge, Authority Guard self-eval, Output-surface cross-file), all of which carry substantive nuance differences confirmed by the researcher; simplest sufficient plan = do the 5 safe cuts now, surface the savings gap to designer before the second pass
blocking_risk: safe cuts only recover ~1.4% of 77KB load, not 25%; designer may need to authorize a riskier second-pass plan if the full target matters, or lower the target to match safe-cut scope
warrant:
  type: evidence
  source: researcher-findings.md tasks 3-9 — line-by-line content comparison at all claimed duplicate sites; byte baselines from researcher task 1 (SKILL.md 15,379 + team-lead.md 31,112 + member-protocol 7,224 + round-format 11,537 + util 14,997 = 80,249 bytes total); cite-graph from researcher task 12 (20+ outbound cites mapped); load-bearing nuances at 7 sites from researcher task 11 — all read directly from /home/mike/Documents/CodeProjects/Chester/docs/chester/working/20260611-01-compact-committee-skill/committee/round01/researcher-findings.md
```
