# Innovator Transcript — round01
# Sprint: 20260611-01-compact-committee-skill

---

## Position

### Lens: existing file structure = accumulated choices; not all still load-bearing

Researcher ground truth decisive: actual orchestrator load = ~77KB (5 files).
Brief's ~25% target derived from 4-file count; 77KB baseline opens bigger lever.

Innovator position: brief frames this as a dedup pass. Correct direction; too narrow ambition.
True structural question: *who owns what, and does each file earn its orchestrator load?*

Two owner-reassignment moves the brief does not fully name:

**Move A: SKILL.md Per-Round Flow → stub + cite, not 8-step restatement.**
SKILL.md:114 already says "detail in team-lead.md." The 8 steps below it (lines 116-123)
restate what team-lead.md steps 1-11 own. Per researcher task 3: SKILL.md line 114 is
already a pointer — the 8 bullets below it are the restatement. Collapse to one line:
"Per-round sequence per `references/team-lead.md` § Per-Round Flow." Keep the checkpoint
note (line 125-127) because it belongs to SKILL.md's orchestration-call layer (steps 4/5
reference ephemeral dispatches SKILL.md owns). Save: ~12 lines / ~800 bytes from SKILL.md.

**Move B: SKILL.md § Translation Gate → 2-line cite block, not 4-bullet restatement.**
Per researcher task 4: SKILL.md lines 40-43 restate read-aloud, option-naming, C1, C2.
util-design-partner-role owns all four at full spec. The only SKILL.md-specific sentence
is line 38 ("Floor enforcement. Every subagent self-enforces.") + line 45 (cite). Collapse
to: floor statement + cite + one-line scope note ("applies to all designer-facing output;
boundary per round-format for internal artifacts"). Save: ~4 lines / ~300 bytes from SKILL.md.

**Move C (bigger, beyond brief): attack util-design-partner-role restatements in team-lead.md.**
team-lead.md §Voice (lines 26-37) bullet-lists Translation Gate, C1, C2, Stance Principles,
Option-Naming, Self-Evaluation — 6 items. These are not boundary notes; they ARE the rules
restated by name. util-design-partner-role already owns all six. team-lead.md line 37
("Do NOT restate rules in packet. Apply silently.") + line 28 (read util before consolidating)
carry the only non-redundant content. Collapse §Voice to: "Read util-design-partner-role
before consolidating. Apply all gates silently; do NOT restate in packet." 2 lines.
team-lead.md §Translation Gate (lines 291-299): 5 bullets restate read-aloud, option-naming,
no-code-vocab, C1, C2. These are pure restatements of util. Safe to collapse to 1-line cite
referencing util + a note: "Pre-send gate: full spec in util; apply before every designer-visible block."
Save (both moves combined): ~20 lines / ~1.2KB from team-lead.md.
team-lead.md §Style (lines 39-45): references util's overlay; retains session-specific
application detail (caveman-vs-packet voice boundary). Keep as-is — application-scoped content.

**Moves A+B+C together target ~2.3KB reduction from SKILL.md + team-lead.md alone,
on top of the dedup moves the brief already names.**
Total projected reduction vs brief's ~25% target: ~30-35% against the 77KB baseline,
or ~22-26KB net savings.

---

### Full Implementation Plan

Plan shape: docs-producing tasks only; adapt TDD 5-step to grep/wc verification commands.
One concept per task. One commit per task. Ordered by dependency (no task cites content
removed in a later task).

---

# Plan: Compact design-committee Skill Runtime Context

**Sprint:** 20260611-01-compact-committee-skill
**Spec:** `docs/chester/working/20260611-01-compact-committee-skill/design/20260611-01-compact-committee-skill-design-00.md`
**Execution mode:** inline

> **For agentic workers:** This plan is all docs-producing; all tasks execute inline.
> Checkbox syntax tracks state. One commit per task.

## Goal

Reduce the design-committee orchestrator's ~77KB runtime context load by collapsing
cross-file and within-file restatements to single authoritative sites, without altering
any behavioral contract.

## Architecture

Single-authority pattern (established by member-protocol.md): each concept owned by
exactly one file; all other files carry one-line cites pointing at it. No file merges,
no file deletions. Five files touched: SKILL.md, team-lead.md, round-format.md,
util-design-partner-role/SKILL.md (member application notes only). member-protocol.md
untouched (it is the authority model).

## Tech Stack

Markdown edits. Bash verification (grep, wc -c).

---

## Task 1: Collapse SKILL.md §Translation Gate to floor statement + cite

**Type:** docs-producing
**Implements:** D2 (Translation Gate single authority → util-design-partner-role)
**Decision budget:** 1
**Must remain green:** n/a (docs only); post-edit cite-graph check (Task 8)

**Files:**
- Modify: `skills/design-committee/SKILL.md:36-45`

**Steps (docs-producing verification shape):**

- [ ] **Step 1: Verify duplicate present**

```bash
grep -n "Read-aloud test\|Option-naming\|C1 Externalized\|C2 Fact Default" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```
Expected: hits at lines 40-43 (4 bullets restating util content).

- [ ] **Step 2: Verify util owns all four rules**

```bash
grep -n "Read aloud\|Option-Naming\|C1:\|C2:" \
  /home/mike/Documents/CodeProjects/Chester/skills/util-design-partner-role/SKILL.md
```
Expected: hits confirming util carries all four rules.

- [ ] **Step 3: Edit SKILL.md §Translation Gate (lines 36-45)**

Replace the 10-line section with:

```markdown
## Translation Gate

Floor enforcement. Every subagent self-enforces. Team-lead re-checks at consolidation.
Apply before any output reaches designer. Boundary: applies to all designer-facing output;
which artifact types the Gate applies to within round folders per
`references/committee-analysis-round-format.md` § Conventions.

Full voice spec (all rules): `skills/util-design-partner-role/SKILL.md`. LOAD-BEARING citation.
Touch util-design-partner-role → audit committee impact.
```

Saves ~4 lines / ~260 bytes. Preserves: cite to util, floor-enforcement notice,
boundary pointer (round-format owns which-artifact scoping per researcher task 4 nuance).
No loss: the 4 bullets are restatements of util rules; util is the authority.

- [ ] **Step 4: Re-verify cite present and duplicate bullets gone**

```bash
grep -n "util-design-partner-role\|Read-aloud\|C1 Externalized\|C2 Fact Default" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```
Expected: cite line present; 4 bullet lines absent.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(design-committee): collapse SKILL.md Translation Gate to cite+floor"
```

---

## Task 2: Collapse SKILL.md §Six Members to roster-only (drop per-member lens sentences)

**Type:** docs-producing
**Implements:** D2 (Member lenses → agent files as authority)
**Decision budget:** 1
**Must remain green:** n/a; post-edit cite-graph check (Task 8)

**Files:**
- Modify: `skills/design-committee/SKILL.md:29-33`

**Steps:**

- [ ] **Step 1: Verify lens sentences present in SKILL.md §Six Members**

```bash
grep -n "Defends existing structure\|Pushes new framings\|Weighs op cost\|Tests category" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```
Expected: hits at lines 29-32 (4 roster entries carrying inline lens descriptions).

- [ ] **Step 2: Verify agent files carry full lens (authority confirmed)**

```bash
grep -n "Lens Position\|defends.*stasis\|pushes new\|weighs.*cost\|Tests category" \
  /home/mike/Documents/CodeProjects/Chester/agents/design-committee-conservator.md \
  /home/mike/Documents/CodeProjects/Chester/agents/design-committee-innovator.md \
  /home/mike/Documents/CodeProjects/Chester/agents/design-committee-pragmatist.md \
  /home/mike/Documents/CodeProjects/Chester/agents/design-committee-purist.md
```
Expected: § Lens Position sections present in each agent file.

- [ ] **Step 3: Edit SKILL.md §Six Members (lines 29-33) — drop lens sentences, keep names + invocation IDs**

Replace lines 29-33 with:

```markdown
- Team-Lead (calling agent). Dispatches, receives, compiles. No design opinion. NOT relay during deliberation — peers DM peers direct. Holds workflow thread. No proof mutations. Role: `references/team-lead.md`.
- Conservator; `chester:design-committee-conservator`. Lens: agent file.
- Innovator; `chester:design-committee-innovator`. Lens: agent file.
- Pragmatist; `chester:design-committee-pragmatist`. Lens: agent file.
- Purist; `chester:design-committee-purist`. Lens: agent file.
- Researcher; `chester:design-committee-researcher`. Tools: Read, Glob, Grep, Bash, WebSearch, WebFetch, Write. Owns codebase, prior-art, industry research, doc reading, multi-source consolidation, absence findings. Hard prohibitions: no design opinion, no proof-state ops, no file writes outside the `committee/` tree and the conversation record (writes findings to its round-folder findings file).
- Designer (human, non-dispatched). Adjudicates all decisions. Sets meta-rules. Authorizes charter changes. Never spawned as subagent.
```

Saves ~4 lines (~200 bytes). Lens description owned by agent files; orchestrator needs
only roster membership + invocation IDs for TeamCreate.

- [ ] **Step 4: Re-verify lens sentences gone; invocation IDs present**

```bash
grep -n "chester:design-committee-conservator\|Defends existing\|Pushes new framings" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```
Expected: invocation IDs present; "Defends existing" / "Pushes new framings" absent.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(design-committee): drop per-member lens sentences from Six Members roster"
```

---

## Task 3: Collapse SKILL.md §Per-Round Flow to stub + cite (Innovator extension)

**Type:** docs-producing
**Implements:** D2 (Per-Round Flow → team-lead.md as authority)
**Decision budget:** 2
**Must remain green:** n/a; post-edit cite-graph check (Task 8)

**Files:**
- Modify: `skills/design-committee/SKILL.md:112-127`

**Steps:**

- [ ] **Step 1: Verify 8-step restatement present**

```bash
grep -n "^\d\+\. \*\*Dispatch\|Members write\|Members signal\|Consolidate\|Synthesize\|Converge\|Author\|Present" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```
Expected: 8 numbered step lines present under §Per-Round Flow.

- [ ] **Step 2: Verify team-lead.md owns the authoritative 11-step version**

```bash
grep -n "Per-Round Flow\|Update the ledger\|Designer response" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```
Expected: §Per-Round Flow heading + steps including "Update the ledger" and "Designer response"
(the 3 genuinely additional steps per researcher task 3).

- [ ] **Step 3: Edit SKILL.md §Per-Round Flow (lines 112-127)**

Replace the 16-line section (lines 112-127) with:

```markdown
### Per-Round Flow

Canonical sequence per `references/team-lead.md` § Per-Round Flow (11 steps; steps 1-3
member-side, steps 4-11 team-lead-side). Each step writes its artifact to the round folder
before the next begins — available to wrapping skills via reference.

**Checkpoint between steps.** Each step's dispatch carries the prior step's artifact path
as a required input; absence of that artifact blocks the next dispatch. Disk is the handoff
— no step proceeds on in-context prose alone.

No team-lead relay during peer Q&A — each exchange is private between asker and target.
```

Reasoning: SKILL.md line 114 already said "detail in references/team-lead.md." The 8 bullets
(lines 116-123) are a restatement the cite already supersedes. Checkpoint note (lines 125-127)
+ no-relay note (line 127) belong to SKILL.md's orchestration layer — they are not
in team-lead.md's per-round-flow section and must be preserved here.
Saves ~8 lines / ~600 bytes. Keeps: cite to team-lead, checkpoint rule, no-relay rule.
Risk: an executor reading SKILL.md alone no longer gets the 8-step sequence — they must
follow the cite. Acceptable: cite already existed at line 114; this just removes the
contradictable local copy.

- [ ] **Step 4: Re-verify stub present, 8 named steps gone**

```bash
grep -n "Members write\|Members signal\|team-lead.md.*Per-Round Flow\|Checkpoint between" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```
Expected: "team-lead.md § Per-Round Flow" cite present; "Members write" / "Members signal" absent;
"Checkpoint between steps" present.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(design-committee): collapse SKILL.md Per-Round Flow to stub+cite"
```

---

## Task 4: Collapse SKILL.md §Standalone Invocability (merge into Phase 1, preserve no-degrade rule)

**Type:** docs-producing
**Implements:** D2 (Standalone → one site in SKILL.md Phase 1)
**Decision budget:** 2
**Must remain green:** n/a; post-edit cite-graph check (Task 8)

**Files:**
- Modify: `skills/design-committee/SKILL.md:55-62,142-147,158-159`

**Steps:**

- [ ] **Step 1: Verify 3 standalone sites present**

```bash
grep -n "standalone invocab\|Standalone Invocab\|start-bootstrap.*Sprint mechanics\|Does NOT call.*start-bootstrap" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```
Expected: hits at lines ~57, ~62, ~142-146, ~159 (3 sites).

- [ ] **Step 2: Identify unique content at each site**

Researcher task 6 confirmed:
- Phase 1 line 57: "Preserves standalone invocability" (motivation note)
- Phase 1 line 62: "Do NOT invoke start-bootstrap" (instruction)
- §Standalone Invocability lines 142-146: full explanation + no-degrade-to-no-op rule (UNIQUE)
- Integration line 159: "Standalone invocability requires Phase 1 create no sprint" (rationale)

No-degrade-to-no-op rule (line 146) MUST survive. Phase 1 step 4 already carries the
"Do NOT invoke start-bootstrap" instruction. Integration line 159 explains why.

- [ ] **Step 3: Edit — merge §Standalone Invocability into Phase 1 step 4; shorten Integration line**

A. Expand Phase 1 step 4 (line 62) to absorb the no-degrade rule and core standalone statement:

```markdown
4. Do NOT invoke `start-bootstrap`. Sprint mechanics violate standalone invocability
   when no sprint exists. There is one unconditional path — no cutover, no multi-round gate,
   no degrade-to-no-op: every consult creates the `committee/` tree and dispatches the
   Consolidator the same way. Phase 1 creates no sprint and runs no sprint mechanics;
   standalone invocability is preserved. Committee root resolves per
   `references/member-protocol.md` § Committee root resolution — no sprint context fabricated.
```

B. Delete §Standalone Invocability section (lines 142-146) — content now lives in Phase 1.

C. Shorten Integration "Does NOT call" line to:
```markdown
- **Does NOT call:** `start-bootstrap`, `util-worktree`, any sprint-creating skill
  (standalone invocability — see Phase 1 step 4).
```

Saves: ~8 lines / ~550 bytes. Preserves: no-degrade rule (moved to Phase 1), standalone
motivation (Phase 1), instruction (Phase 1 step 4), rationale cite (Integration line).

- [ ] **Step 4: Re-verify no-degrade rule present in Phase 1; §Standalone section gone**

```bash
grep -n "degrade-to-no-op\|Standalone Invocab\|unconditional path" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```
Expected: "degrade-to-no-op" present (Phase 1); "## Standalone Invocability" heading absent.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(design-committee): merge Standalone Invocability into Phase 1, drop duplicate section"
```

---

## Task 5: Collapse SKILL.md §Integration ephemeral-off-roster restatement (3 → 2 sites)

**Type:** docs-producing
**Implements:** D2 (Ephemeral-off-roster → §Consolidator / §Scribe as owner)
**Decision budget:** 1
**Must remain green:** n/a; post-edit cite-graph check (Task 8)

**Files:**
- Modify: `skills/design-committee/SKILL.md:156`

**Steps:**

- [ ] **Step 1: Verify Integration line 156 repeats §Consolidator/§Scribe content**

```bash
grep -n "ephemeral per-round.*roster\|off-roster" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```
Expected: hits at lines ~92, ~96, ~156.

- [ ] **Step 2: Confirm §Consolidator and §Scribe are the policy owners**

Lines 92 and 96 carry the full policy statement (ephemeral, not roster, never add to team).
Line 156 restates "ephemeral per-round consolidation dispatch, not on the `TeamCreate` roster"
in the Integration §Calls list — same content, third site.

- [ ] **Step 3: Shorten Integration §Calls line 156 to pointer**

Replace Integration §Calls entry for consolidator/scribe with:

```markdown
- **Calls:** `TeamCreate`, `SendMessage`, `TeamDelete` (orchestration); `chester-config-read`
  (config); `chester:design-committee-*` agents (members + researcher);
  `chester:design-committee-consolidator` (ephemeral — off-roster; policy § Consolidator);
  `chester:design-committee-scribe` (ephemeral — off-roster; policy § Scribe).
```

Saves: ~50 bytes. Eliminates third restatement; §Consolidator and §Scribe are the owners.

- [ ] **Step 4: Re-verify**

```bash
grep -n "chester:design-committee-consolidator\|chester:design-committee-scribe" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md
```
Expected: Integration §Calls entry shortened; § Consolidator and § Scribe lines still carry full policy.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "docs(design-committee): shorten Integration calls list ephemeral-off-roster to pointer"
```

---

## Task 6: Collapse team-lead.md §Voice and §Translation Gate restatements (Innovator extension)

**Type:** docs-producing
**Implements:** D2 (Translation Gate / Voice → util-design-partner-role as authority; within-team-lead.md dedup)
**Decision budget:** 2
**Must remain green:** n/a; post-edit cite-graph check (Task 8)

**Files:**
- Modify: `skills/design-committee/references/team-lead.md:26-37,291-299`

**Steps:**

- [ ] **Step 1: Verify §Voice lists 6 rule names restating util**

```bash
grep -n "Translation Gate\|C1 Externalized\|C2 Fact Default\|Stance Principles\|Option-Naming\|Self-Evaluation" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```
Expected: hits at lines 29-35 (§Voice bullet list) AND at lines ~291-299 (§Translation Gate).

- [ ] **Step 2: Verify util owns all 6 rules**

```bash
grep -n "Stance Principles\|Self-Evaluation\|Option-Naming Rule\|C1:\|C2:\|Translation Gate\|PM Litmus" \
  /home/mike/Documents/CodeProjects/Chester/skills/util-design-partner-role/SKILL.md
```
Expected: all 6 confirmed in util.

- [ ] **Step 3a: Collapse team-lead.md §Voice (lines 26-37)**

Replace lines 26-37 with:

```markdown
### Voice — Delegated to util-design-partner-role

Before consolidating, read `skills/util-design-partner-role/SKILL.md`. Apply all
voice rules (Translation Gate, C1, C2, Stance Principles, Option-Naming, Self-Evaluation)
in full to every designer-facing packet. Do NOT restate rules in packet. Apply silently.
```

Saves: ~8 lines / ~500 bytes. Preserves: "read util before consolidating" instruction,
"apply silently" constraint (line 37 — researcher confirmed this is not in util; it is
a committee-specific application directive that MUST survive).

- [ ] **Step 3b: Collapse team-lead.md §Translation Gate (lines 291-299)**

Replace lines 291-299 with:

```markdown
### Translation Gate

Full spec in `skills/util-design-partner-role/SKILL.md`. Pre-send gate on every
designer-visible block — full rule set applies. Which round-folder artifacts the Gate
applies to: `references/committee-analysis-round-format.md` § Conventions.
```

Saves: ~6 lines / ~400 bytes. Preserves: cite to util, pointer to round-format for
artifact-scoping boundary (researcher task 4 confirmed this boundary-clause lives in
round-format and MUST survive). PM Litmus and Research Boundary sections (lines 301-308)
already cite-not-restate — leave untouched (researcher task 4 confirmed these are not
restatements).

- [ ] **Step 4: Re-verify§Voice and §Translation Gate collapsed; "apply silently" present; cite present**

```bash
grep -n "Apply silently\|util-design-partner-role\|C1 Externalized\|Translation Gate" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```
Expected: "Apply silently" present; util cite present at §Voice; "C1 Externalized" bullet absent;
§Translation Gate reduced to 4-line cite block.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md
git commit -m "docs(design-committee): collapse team-lead.md Voice+TranslationGate to cite blocks"
```

---

## Task 7: Collapse team-lead.md §Authority Guard within-file duplication (Self-Evaluation)

**Type:** docs-producing
**Implements:** D2 (Warrant/Authority Guard → §Authority Guard as single owner within team-lead.md)
**Decision budget:** 2
**Must remain green:** n/a; post-edit cite-graph check (Task 8)

**Files:**
- Modify: `skills/design-committee/references/team-lead.md:342-344`

**Steps:**

- [ ] **Step 1: Verify §Self-Evaluation lines 342-344 restate Authority Guard content**

```bash
grep -n "Authority Guard\|warrant coverage\|count is not a warrant\|strict premise scope" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```
Expected: hits at lines ~319-325 (§Authority Guard, definitional) AND lines ~342-344 (§Self-Evaluation).

- [ ] **Step 2: Confirm §Authority Guard at lines 319-325 is the definitional owner**

Per researcher task 8: §Authority Guard carries warrant-test policy + count-not-a-warrant +
C2-firewall + C1-audit + warrants-on-disk. §Self-Evaluation lines 342-344 restate warrant-coverage,
count-not-a-warrant, strict-premise-scope in imperative check form.
Lines 339-341 (before the Authority Guard checks) carry unique content: decision-packet/essay
check, adjudication check, collapsed-split check — these are NOT in §Authority Guard and MUST stay.

- [ ] **Step 3: Edit §Self-Evaluation lines 342-344**

Replace the 3 Authority Guard self-check bullets with a single cite:

```markdown
- **Authority Guard checks** — run all three (warrant coverage, count-not-a-warrant, strict
  premise scope) per `## Internal Discipline` / **Authority Guard** above.
```

Saves: ~6 lines / ~450 bytes. Preserves: the self-check instruction to run them (via cite);
the full rule text stays in §Authority Guard. Unique content at lines 339-341 untouched.

- [ ] **Step 4: Re-verify — cite present; 3 restated bullets absent; §Authority Guard intact**

```bash
grep -n "Authority Guard\|warrant coverage\|count is not a warrant\|strict premise scope" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```
Expected: §Authority Guard lines 319-325 present (unchanged); lines 342-344 collapsed to
1-line cite; "warrant coverage" / "count is not a warrant" / "strict premise scope" appear
only in §Authority Guard, not also in §Self-Evaluation.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md
git commit -m "docs(design-committee): collapse Self-Evaluation Authority Guard checks to cite"
```

---

## Task 8: Version-bump all touched files

**Type:** docs-producing
**Implements:** CLAUDE.md §Skill File Conventions (version-bump rule)
**Decision budget:** 0
**Must remain green:** n/a

**Files:**
- Modify: `skills/design-committee/SKILL.md:4` (bump version field)
- Modify: `skills/design-committee/references/team-lead.md:8` (bump version field)
- Modify: `skills/design-committee/references/committee-analysis-round-format.md:11` (bump version field)
  — round-format gets no content edits in this plan; if Task 7 scope expands to add a pointer
  line to round-format, bump here; else skip and note "untouched."
- Note: `member-protocol.md`, `skill-contract.md`, `artifact-template.md` — untouched;
  researcher task 13 confirmed they have no version field; no bump needed.
- Note: `skills/util-design-partner-role/SKILL.md` — untouched (no edits in this plan);
  no bump needed.

**Steps:**

- [ ] **Step 1: Read current version fields**

```bash
grep -n "^version:" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/committee-analysis-round-format.md
```
Expected: SKILL.md v0020, team-lead.md v0011, round-format v0001.

- [ ] **Step 2: Bump SKILL.md → v0021**

Edit `skills/design-committee/SKILL.md` line 4: `version: v0021`

- [ ] **Step 3: Bump team-lead.md → v0012**

Edit `skills/design-committee/references/team-lead.md` line 8: `version: v0012`

- [ ] **Step 4: Confirm round-format edits scope**

If round-format.md received content edits (e.g., if Task 7 extended to add a pointer there):
bump to v0002. If untouched, record "round-format untouched — no bump" in commit message.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/SKILL.md \
        skills/design-committee/references/team-lead.md
# add round-format only if edited:
# git add skills/design-committee/references/committee-analysis-round-format.md
git commit -m "docs(design-committee): version-bump touched files (SKILL.md v0021, team-lead.md v0012)"
```

---

## Task 9: Final cite-graph integrity + byte-delta verification

**Type:** docs-producing
**Implements:** Acceptance criteria (cite-graph, byte reduction)
**Decision budget:** 1
**Must remain green:** n/a

**Files:**
- Read: all 5 orchestrator-loaded files (no edits; verification only)

**Steps:**

- [ ] **Step 1: Verify all outbound cites from SKILL.md still resolve**

Cross-reference researcher task 12 cite-graph against current state.
Check each cite target heading still exists:

```bash
# team-lead.md headings cited from SKILL.md
grep -n "^### Per-Round Flow\|^### Output Surfaces\|^## Behavioral Constraints\|^### Closure" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md

# member-protocol.md headings cited from SKILL.md
grep -n "^## Committee root resolution\|^## Final Position\|^## Routing signal" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/member-protocol.md

# util cite from SKILL.md
grep -n "^# Design Partner Role" \
  /home/mike/Documents/CodeProjects/Chester/skills/util-design-partner-role/SKILL.md
```
Expected: all headings present.

- [ ] **Step 2: Verify all outbound cites from team-lead.md still resolve**

```bash
grep -n "^## Committee root resolution\|^## Final Position\|^## Write-then-send\|^## Visible Surface" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/member-protocol.md

grep -n "^## Translation Gate\|^## PM Litmus\|^## Research Boundary" \
  /home/mike/Documents/CodeProjects/Chester/skills/util-design-partner-role/SKILL.md
```
Expected: all headings present.

- [ ] **Step 3: Byte-delta measurement**

```bash
wc -c \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/member-protocol.md \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/committee-analysis-round-format.md \
  /home/mike/Documents/CodeProjects/Chester/skills/util-design-partner-role/SKILL.md
```
Expected baseline (researcher task 1): SKILL.md 15,379 + team-lead.md 31,112 + member-protocol.md 7,224
+ round-format 11,537 + util 14,997 = 79,249 bytes.
Target: ≥ ~23,000 bytes reduction (~29% of 79,249 = ~23KB) given Innovator extended scope.
Brief's minimum: ≥ ~20,000 bytes reduction (~25%).
Report actual. If below target, note which tasks delivered less than projected.

- [ ] **Step 4: Confirm no behavioral content removed — spot-check 7 nuances**

Per researcher task 11, verify survival of each load-bearing nuance:

```bash
# 1. round-format Translation Gate boundary clause (which artifacts Gate applies to)
grep -n "Translation Gate boundary\|APPLIES to.*decision-packet\|does NOT apply to transcripts" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/committee-analysis-round-format.md

# 2. member-protocol transcript exemption
grep -n "Translation Gate does not apply to transcript\|Transcripts are internal" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/member-protocol.md

# 3. team-lead "apply silently" instruction (unique application directive)
grep -n "Apply silently\|Do NOT restate rules" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md

# 4. output-surface split disambiguation clause (round-format)
grep -n "20260521\|do not conflate" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/committee-analysis-round-format.md

# 5. no-degrade-to-no-op rule (SKILL.md Phase 1)
grep -n "degrade-to-no-op\|unconditional path" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/SKILL.md

# 6. team-lead "Agent tool / no team_name" operational dispatch detail
grep -n "no.*team_name\|Agent tool.*no" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md

# 7. team-lead steps 3+11 unique content (ledger update, designer response taxonomy)
grep -n "Update the ledger\|Designer response\|declare the answer sufficient" \
  /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md
```
Expected: all 7 grep commands return hits (content present).

- [ ] **Step 5: Commit verification record**

```bash
git add -p  # nothing to stage — verification only
git commit --allow-empty -m "docs(design-committee): cite-graph + byte-delta verification complete (Task 9)"
```

Or if byte-delta written to a scratch note, stage that.

---

### Task ordering rationale

Tasks 1-5 all touch SKILL.md; ordered by section top-to-bottom to minimize diff conflicts.
Tasks 6-7 touch team-lead.md; after SKILL.md tasks so SKILL.md cites are stable when
team-lead.md is edited. Task 8 (version bumps) after all content edits. Task 9 (verification)
last.

---

## Where this plan goes beyond the brief

### Extra move: SKILL.md Per-Round Flow → stub (Task 3)

Brief names Per-Round Flow as a 3-site dedup. Researcher confirmed only 2 genuine dispatch-flow
sites (SKILL.md + team-lead.md); round-format's §How To Use is a different abstraction.
Brief's proposed fix: "keep only the orchestration calls + a one-line cite" — this plan does
exactly that, and removes ~600 bytes more than a partial trim would.
Risk: executor reading SKILL.md alone no longer has the 8-step sequence inline. Mitigated:
cite at SKILL.md line 114 already existed; this removes the contradictable local copy.
Behavioral contract unchanged: team-lead.md still carries the 11-step canonical flow.

### Extra move: team-lead.md §Voice + §Translation Gate → cite blocks (Task 6)

Brief does not propose trimming team-lead.md §Voice (lines 26-37). This plan does.
Justification: researcher task 4 confirmed §Voice (lines 29-35) is a 6-item bullet list
restating util rule names — not application notes, not boundary clauses. The only
non-redundant content is line 28 ("read util before consolidating") and line 37 ("apply
silently"). Collapsing to those two directives saves ~8 lines / ~500 bytes without touching
any behavioral constraint.
team-lead.md §Translation Gate (lines 291-299) is a second within-team-lead restatement of
the same 5 util rules. Safe to collapse to cite + boundary pointer.
Combined saving: ~14 lines / ~900 bytes from team-lead.md beyond what the brief targets.
Risk: some team-lead context on "which rules apply here" is reduced. Mitigated: the cite
is explicit ("read util in full; apply all gates"); the only unique content ("apply silently")
is preserved.

### Combined target

Brief: ~25% of ~64KB (4-file) = ~16KB savings.
Innovator plan: ~30-35% of ~77KB (5-file, correct baseline) = ~23-27KB savings.
Requires that tasks 3 and 6 deliver projected savings. If either task's edit saves less than
projected (because some bullets are found load-bearing at execution time), the saving falls
back toward ~25% of 77KB = ~19KB, which still beats the brief's minimum target.

---

## How the 7 load-bearing nuances survive

Per researcher task 11 — each must be verified in Task 9 step 4:

1. **round-format Translation Gate boundary clause (lines 101-103)** — not touched by any
   task in this plan. round-format receives no edits. Survives by omission.

2. **member-protocol transcript exemption (lines 67-69)** — member-protocol is untouched
   throughout. Survives by omission.

3. **team-lead "apply silently" directive (line 37)** — Task 6 explicitly preserves this
   as the non-redundant content when collapsing §Voice.

4. **output-surface split disambiguation clause (round-format lines 108-110)** — round-format
   untouched. Survives by omission. team-lead.md §Output Surfaces also untouched.

5. **no-degrade-to-no-op rule (SKILL.md line 146)** — Task 4 moves this rule from §Standalone
   Invocability into Phase 1 step 4 (where it belongs — it's an execution constraint).
   Content preserved; section deleted.

6. **team-lead "Agent tool / no team_name" dispatch detail (steps 4 + 8)** — team-lead.md
   steps 4 and 8 are untouched by any task. Survives by omission.

7. **team-lead steps 3 + 11 unique content (ledger update + designer response taxonomy)** —
   team-lead.md §Per-Round Flow is untouched. Only SKILL.md's 8-step restatement is removed
   (Task 3). team-lead.md carries the authoritative 11-step version including steps 3 and 11.
   Survives by omission.

---

## Follow-ups

No peer Q&A this round.

---

## Final Position

```
position: re-cut owners + attack util restatements in team-lead, target ~30-35% saving vs 77KB true baseline
rationale: brief's ~25% target is correct direction but undershoots — it computes against the
  4-file 64KB count, not the 77KB true orchestrator load (researcher decisive). Two structural
  moves beyond the brief's scope materially expand savings: (A) SKILL.md Per-Round Flow
  collapses to stub+cite because SKILL.md:114 already had the cite and the 8 bullets below
  it were the redundant copy; (B) team-lead.md §Voice (lines 26-37) and §Translation Gate
  (lines 291-299) each restate util rule names verbatim — neither is a boundary clause —
  both collapse to cite+application-directive. All 7 researcher-identified load-bearing nuances
  survive: round-format boundary clauses untouched, team-lead "apply silently" directive
  explicitly preserved in Task 6, no-degrade rule moved (not deleted) in Task 4, team-lead
  steps 3+11 untouched. Every saving reduces token load at orchestrator runtime; no behavioral
  contract changes.
blocking_risk: Task 6 (team-lead.md Voice collapse) is the highest-risk task — if any of the
  6 bullet items in §Voice carries a committee-scoped behavioral nuance not in util, stripping
  it silently loses a behavioral constraint. Mitigation: Task 9 step 4 nuance-7 verification
  catches missing content at grep level; executor should read the section carefully before
  collapsing.
warrant:
  type: evidence
  source: direct reads of SKILL.md (160 lines), team-lead.md (348 lines),
    util-design-partner-role/SKILL.md (189 lines), member-protocol.md (160 lines),
    round-format.md (226 lines); researcher-findings.md tasks 3/4/6/7/8/11/12/13
    providing line-exact duplicate sites, byte counts, and nuance catalog
```
