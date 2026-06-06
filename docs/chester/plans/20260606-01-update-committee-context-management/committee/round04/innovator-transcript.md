# Innovator — Round 04 Transcript
# Sprint: 20260606-01-update-committee-context-management
# Role: Innovator — Push cleanest decomposition; existing structure re-makeable

---

## Task: Design Task Decomposition for Spec Implementation

The spec (§9) names 6 implementation-surface items. The obvious plan writes one task per file/item in spec order. My job is to find whether that decomposition is actually correct, whether ordering or grouping should differ, and whether any item's scope boundary is wrong.

---

## Reading the Spec and Design Source

Six surface items:

1. `skills/design-committee/SKILL.md` — flow reorder, mode selection (one-round/two-round), scribe + verdict steps, checkpoint enforcement
2. `skills/design-committee/references/team-lead.md` — synthesize (alignment-map) + converge (verdict) write-evict; rejection-by-default for malformed signals; present-reads-artifact
3. `skills/design-committee/references/member-protocol.md` — mandatory `## Final Position` section (location, schema, caps); typed routing-signal schema; capped peer-DM schema
4. `agents/design-committee-consolidator.md` — read-scoping (Final Position only), verbatim copy, enumerate-only
5. New: `agents/design-committee-scribe.md` — authoring agent fed verdict + annotated template
6. Annotated handoff/artifact template with `Dissent Record` — location per artifact-schema

---

## Step 1: Dependency Graph

The real question is: what must exist before what?

**Structural dependencies (not conceptual):**

- The consolidator (item 4) reads "only the `## Final Position` section" of member transcripts. This is only meaningful if `## Final Position` is defined in member-protocol (item 3). If you write the consolidator before member-protocol, you have a dangling reference: "reads the Final Position section" with no definition of what that section contains.
  - **Dependency: Item 3 → Item 4.** Member-protocol Final Position definition must land before consolidator read-scoping.

- Team-lead (item 2) rejects malformed routing signals. The routing-signal schema is defined in member-protocol (item 3). The rejection behavior references "typed routing signal, schema fields are the entire message body." The rejection rule names the schema.
  - **Dependency: Item 3 → Item 2.** Member-protocol routing-signal schema must exist before team-lead rejection logic references it.

- The scribe (item 5) receives the "annotated template" as its primary input. The annotated template is item 6. The scribe's file describes what inputs it receives — it references the template by concept, not by line number. However, if the template doesn't exist yet, the scribe has a dangling claim ("receives annotated template + Dissent Record"). Practically, these two are tightly coupled and should be written back-to-back.
  - **Dependency: Item 6 before or simultaneous with Item 5** — or at minimum adjacent tasks.

- SKILL.md (item 1) is the orchestration layer. It rewrites the per-round flow to include: Final Position signaling (member-protocol), alignment-map + verdict write-evict (team-lead), scribe dispatch (scribe agent), mode selection. SKILL.md references all other items conceptually. Writing SKILL.md last means every concept it references is already codified.
  - **Dependency: Items 2, 3, 4, 5, 6 all before Item 1.** SKILL.md is the capstone.

**Resulting order:**
1. member-protocol (item 3) — defines Final Position schema + routing signal + peer-DM schema
2. consolidator (item 4) — references Final Position section (now defined)
3. team-lead (item 2) — references routing-signal schema (now defined); synthesize/converge/evict; present-reads-artifact
4. annotated template (item 6) — defines Dissent Record section; new file in `skills/design-committee/references/`
5. scribe agent (item 5) — references annotated template (now exists)
6. SKILL.md (item 1) — orchestration capstone; references all previous items

Items 2 and 4 (consolidator and team-lead, in the revised ordering) are independent — no dependency between them. Either could come second. I place consolidator before team-lead because the consolidator change is purely mechanical (read-scoping to Final Position only), making it a tighter, lower-decision-budget task.

---

## Step 2: Challenging the One-Task-Per-File Split

**Should member-protocol and consolidator merge into one task?**
No. They're in different directories (`skills/design-committee/references/` vs `agents/`), owned by different roles (shared member contract vs dedicated agent), and have different decision budgets. Member-protocol's Final Position section is high-decision: exact schema fields, cap, location. Consolidator's read-scoping is low-decision once Final Position is defined. Splitting gives plan-attack the right blast radius per task.

**Should team-lead and SKILL.md merge?**
No. Team-lead.md has synthesize/converge/evict additions that are large prose changes (~3-4 new sub-sections). SKILL.md's flow reorder is structural: mode logic (one-round/two-round branch), new steps (verdict, scribe dispatch), checkpoint enforcement language. Very different diff shapes, very different decision budgets. Together they'd be the largest blast radius in the plan. Keep separate.

**Should annotated template and scribe agent merge?**
Tempting — they're tightly coupled and small. But: the annotated template has an independent audience (it's what the scribe reads on dispatch, and potentially what the designer can inspect). The scribe agent file is a registered agent. Different file types, different authoring discipline. Keep separate but make them adjacent tasks (4 then 5 in my ordering).

**Should consolidator be an in-place edit or near-complete rewrite?**
The existing consolidator agent reads "every member transcript and researcher findings file under the `committee/roundNN/` path." The new behavior reads only each transcript's `## Final Position` section. This is a significant scope reduction. The prohibition section ("reads only that round's folder; do not range across other rounds") stays. What changes: the reading instruction changes from "read every member transcript" to "read only the `## Final Position` section (last section) of each transcript." This is a targeted edit, not a rewrite — maybe 30% of the file changes.

**Where does the annotated template live?**
The spec says "location per artifact-schema." The artifact schema utility is `skills/util-artifact-schema/SKILL.md`. Looking at existing references: `committee-analysis-round-format.md` already lives in `skills/design-committee/references/`. The annotated template is different — it's the template the scribe receives to produce a committee output artifact (spec, plan, or analysis document, with mandatory Dissent Record). This is a new file. Best location: `skills/design-committee/references/scribe-artifact-template.md`. This keeps it within the skill's reference directory, co-located with the agent that uses it, and clearly named for the scribe's use.

---

## Step 3: Decision Budget Per Task

**Task 1 — member-protocol:** High budget. Three schema additions, each with specifics: Final Position (mandatory, exact header, last section, 200-word cap, schema `{position, rationale, blocking_risk}` with blocking_risk semantics defined); routing-signal (typed, schema `{member, status, round, transcript}`, malformed = rejected); peer-DM (schema `[sender]→[target]: [one sentence] / [target]: [one sentence]`, max 2 exchanges per pair). At least 8-10 micro-decisions.

**Task 2 — consolidator:** Low budget. One change: read-scoping from "read every transcript" to "read only the `## Final Position` section (last section) of each transcript." Plus verbatim-copy constraint (already partially in existing file, needs explicit strengthening). Decision budget: 2-3.

**Task 3 — team-lead:** Medium budget. Three additions: synthesize (reads consolidator output, writes alignment-map.md, evicts), converge (reads alignment-map.md, writes verdict.md with one-sentence-minimum, ambiguous verdicts blocked, evicts), present-reads-artifact (reads artifact file, that read IS the review, Dissent Record guaranteed-seen). Plus malformed-signal rejection. Decision budget: 5-7.

**Task 4 — annotated template:** Medium budget. New file. Must include Dissent Record as mandatory named section (not advisory prose). Must specify what the scribe fills into each section. Decision budget: 4-5.

**Task 5 — scribe agent:** Medium budget. New agent file. Must specify: inputs (verdict.md + annotated template + consolidator-output.md + prior artifact if revising), hard prohibition (never raw transcripts, never session thread), output (artifact file, returns pointer only), cannot start before convergence complete. Decision budget: 4-6.

**Task 6 — SKILL.md:** High budget. Flow reorder touches Phase 4 (deliberation), adds Phase 4.5 (synthesize/converge) and Phase 4.7 (scribe dispatch), updates Phase 5 (present-reads-artifact). Mode selection (one-round/two-round Delphi escalation) adds a branch to the flow. Checkpoint enforcement adds constraint 12 language. Decision budget: 8-12.

---

## Step 4: Test Compatibility

This sprint is docs-producing — no code changes. "Must remain green" = `bash tests/test-*.sh`. The tests validate hooks, config resolution, and integration behavior — none of them exercise committee SKILL.md logic at the bash level. All 6 tasks are docs-producing edits to `.md` files; no test creates/modifies/deletes for any task. The "Must remain green" field for all tasks is: `bash tests/test-*.sh` (all existing, unchanged — no new tests created by this sprint, no test files modified).

---

## Step 5: Plan Format Compliance Check

The plan template requires:
- Execution mode: docs-producing sprint → "inline" mode (no multi-file code task condition triggered)
- Per task: Type, Implements, Decision budget, Must remain green, Files (Create/Modify/Test), Steps (TDD shape adapted for docs)
- Note: TDD for docs-producing means: draft the section → review against spec constraint → verify spec AC covered → commit. No "failing test" literal, but the five-step shape maps to: draft → spec-check → refine → verify → commit

---

## Step 6: AC Coverage Check

12 spec constraints must be covered:
- AC-5, AC-6 (Final Position schema) → Task 1 (member-protocol)
- AC-4 (peer-DM schema) from spec §7 → Task 1 (member-protocol)  
- AC-7 (malformed signal rejection) from spec §7 → Task 1 (member-protocol) + Task 3 (team-lead)
- AC-1 (consolidator off-team-lead) → Task 2 (consolidator) + Task 6 (SKILL.md)
- AC-2 (reads only Final Position) → Task 2 (consolidator)
- AC-3 (verbatim copy) → Task 2 (consolidator)
- AC-4 (enumerate-only bounded output) → Task 2 (consolidator)
- AC-7 (synthesize/converge may co-locate on TL) → Task 3 (team-lead) + Task 6 (SKILL.md)
- AC-8 (alignment-map.md to disk before convergence) → Task 3 (team-lead) + Task 6 (SKILL.md)
- AC-9 (verdict.md specific, one-sentence-minimum, ambiguous blocks) → Task 3 (team-lead) + Task 6 (SKILL.md)
- AC-10 (scribe inputs: annotated template + verdict + consolidator + prior artifact) → Task 5 (scribe agent)
- AC-11 (Dissent Record mandatory named header) → Task 4 (annotated template)
- AC-12 (disk artifact checkpoint between every step) → Task 6 (SKILL.md)
- Mode selection (one-round/two-round from spec §4) → Task 6 (SKILL.md)
- Two-round Delphi escalation flow → Task 6 (SKILL.md)

All 12 constraints plus the mode selection are covered. No gap.

---

## Step 7: Biggest Risk in This Decomposition

The risk I am NOT choosing: flat spec-order (items 1-6 as numbered in §9). Writing SKILL.md first creates a flow description that references concepts from files not yet written — author has to imagine what member-protocol will say about Final Position while writing the SKILL.md step that says "members write Final Position sections." That inversion creates drift risk: SKILL.md might describe the flow slightly differently than member-protocol defines the section, and the implementer has to reconcile after the fact.

The risk I AM choosing: by putting member-protocol first (Task 1), I make it the most consequential early decision in the sprint. If the Final Position schema in Task 1 is wrong (wrong field names, wrong cap, wrong semantics for blocking_risk), every downstream task that references it (consolidator, team-lead, SKILL.md) will be subtly wrong too. The schema has to be right in Task 1 because corrections ripple.

Mitigation: Task 1's decision budget is explicitly flagged as high (8-10 micro-decisions). Plan-attack should flag it as a high-spec-risk task.

---

## Final Position

**position:** Six tasks, dependency-ordered (member-protocol → consolidator → team-lead → annotated-template → scribe-agent → SKILL.md), with Execution mode: inline, all docs-producing.

**rationale:** The dependency structure is the key insight. Member-protocol's Final Position schema is the structural ground truth that consolidator's read-scoping and team-lead's routing-signal rejection both depend on. Writing member-protocol first eliminates downstream drift. SKILL.md last is the integration capstone — by that point every concept it orchestrates is already codified in the files it references. The annotated template before the scribe agent ensures the scribe's file isn't a dangling claim. This ordering lets each task be a clean single-purpose edit with no forward references to undefined content.

**blocking_risk:** If the spec-order (SKILL.md first) were chosen instead, SKILL.md's flow description would create implicit contracts that member-protocol and consolidator have to match rather than define — reversing the causal direction and creating reconciliation work after-the-fact.
