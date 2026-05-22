# Handoff — Pre Skill-File Write

**File:** `handoff-pre-skill-write-00.md`
**Date:** 2026-05-21
**Purpose:** Compact-survivable handoff. All deliberation closed; next step is skill-file write.

---

## State at handoff

All four macro steps complete. Four locked specifications on disk:

- `deliverables-locked-00.md` — three artifacts (Constraint Envelope, Resolution Criterion, Coverage Map), shared `concern_id` key, typed prefixes (CE-NNN, AX-NNN, PR-NNN, EV-NNN), IF/THEN bodies, IF NOT/THEN collapse_tests.
- `process-locked-00.md` — five session phases (OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED), hybrid cascade timing (synchronous scope, deferred status mutation), withdrawal as immediate exception.
- `procedures-locked-00.md` — 12 named operations plus Dispatch Round non-procedure. Axiom-collision check at Propose Proposition gate (synchronous block). Add Axiom flows with cascade-flag on conflicting Propositions.
- `actors-locked-00.md` — five roles. Designer, four poles, Clerk (DETERMINISTIC SCRIPT — D3 closed), Team-lead (Dispatch Round + session-close packaging), Researcher (Add Evidence only).

## Next step — write four skill files into the design-architect-committee folder

Path: `/home/mike/RiderProjects/StoryDesigner/docs/admin/20260521-design-system-analysis/design-architect-committee/`

Files already exist as empty skeletons:
- `skill.md` — **200-word cap** (frontmatter excluded). Operator-facing: when to invoke, what it does, what it produces. No mechanics.
- `rules.md` — **200-word cap** (frontmatter excluded). The discipline. What actors may do. What actors may not do. Honors all ten lenses.
- `schema/` — directory, word-limit exempt. Field shapes, closed-set enumerations, integrity rules from `deliverables-locked-00.md`.
- `design-brief-template.md` — word-limit exempt. Worked example proving the schema produces all three deliverables.

## Source mapping (locked specs → skill files)

- `skill.md` ← extract from `actors-locked-00.md` (when to invoke / what it produces) + `process-locked-00.md` (session lifecycle one-liner). Five sections in 200 words.
- `rules.md` ← extract from `actors-locked-00.md` (role discipline) + `procedures-locked-00.md` (procedure gates) + `process-locked-00.md` (cascade/revision/withdrawal rules). Cap by forward-referencing schema/ for enumerations.
- `schema/` ← `deliverables-locked-00.md` field-by-field, plus `procedures-locked-00.md` gate predicates, plus `process-locked-00.md` status enums and phase-transition table. Dense by necessity.
- `design-brief-template.md` ← worked StoryDesigner-flavored example: one Concern, one or two axioms, one or two Propositions, populated Coverage Map. Prove the three artifacts emerge by read.

## Framing constraints

From `framing-00.md` and `lens-criteria-for-fac-options.md`:

- Word caps absolute. No relief.
- Brilliantly simple, robust, executable, flexible.
- Agents do not justify jobs.
- Four poles fixed. Arbiter dropped.
- 90/10 budget honored.
- No proof engine, no Datalog, no closure-gate query.
- Ten lenses still apply.
- Designer-facing voice on the operator surface (skill.md, rules.md). Caveman ultra retired for skill files — they are markdown the designer reads, not inter-agent comms.

## Conventions to honor

- No tables in markdown output (per root CLAUDE.md). Use multi-level bulleted lists.
- Translation Gate applied for any designer-facing summary (strip MCP scores, dimension names, internal scoring artifacts).
- Per-project CLAUDE.md rules apply where they exist.

## Open designer decisions remaining (NONE for skill write)

All three designer decisions from the framing have closed:
- D1 (adopt Alternative F) — closed at FAC.
- D2 (axiom-assertion mechanism) — closed via procedure spec (Add Axiom procedure, designer signal, structural negation match for collision).
- D3 (Clerk role scope) — closed at actors-locked-00 as deterministic script.

No outstanding adjudication. Write proceeds directly on next prompt.

## What designer asked at session open

"Now we are going to design the skill that uses it in the design-architect-committee folder. Rules for the design is that each file can be no more than 200 words total (front matter excluded) using the philosophy that more words can lead to more confusion and that fewer words requires precision to convey understanding. Write in whatever caveman or other terse style that is appropriate. There should be a skill file, a rules file, a schema file (concise but exempt from the word limit), a design-brief-template (meets all 3 requirement of design specify, concise but exempt from word limit)."

The four-file deliverable matches that ask. Word caps + word-limit-exempt classes are as designer specified.

## Post-write checklist

After writing the four files:
- Confirm skill.md ≤ 200 words (frontmatter excluded).
- Confirm rules.md ≤ 200 words (frontmatter excluded).
- Confirm schema/ is dense but not bloated — closed-set enumerations only, no narrative.
- Confirm design-brief-template.md is a real worked example, not abstract.
- Confirm all three artifacts (Constraint Envelope, Resolution Criterion, Coverage Map) emerge by read from the populated template.
