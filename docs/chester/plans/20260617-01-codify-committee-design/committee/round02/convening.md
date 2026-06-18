# Committee Convening Packet — round02

## What round01 settled (carry forward)

Round01 verdict, designer-ratified: `design-committee` will emit a **complete design document** via a committee-specific template — **Option 2 shape**: committee-native section structure (Verdict / Rationale / Dissent Record / Deferred) with **labeled sub-fields satisfying the eight FAC-complete-design fields as content**, NOT the eight fields as section headers. Mandatory Dissent Record preserved. Scribe bounded inputs unchanged (`verdict.md` + `consolidator-output.md` + `alignment-map.md`). This reverses D9.

Two consequences of this decision now ripple through Chester's docs/config:
1. The committee now **produces a design document**, not a verdict-only decision packet.
2. The committee now has a defined **transition to the specify phase** (committee complete-design → `spec-write` → `spec-harden` → `plan-build`), mirroring how `design-small-task` transitions via `spec-architect`.

## Question (one sentence) — round02

Enumerate **every** Chester skill file, project-settings file, claude-settings file, and `CLAUDE.md` file that must change so the documentation and process accurately reflect (1) the committee emitting an Option-2 complete-design document and (2) the committee's transition into the specify phase — AND judge whether that change set is **one refactor sprint or two separate sprints**.

## What "aligned" means

Find every place that still describes the OLD reality and would now be wrong or stale:
- Docs/skills that say or imply the committee emits a **verdict-only / decision packet** rather than a design document.
- Docs/skills that say `spec-write` (or the spec stage) **mines / extracts / reverse-engineers** the design from a narrative committee verdict.
- The **D9** decision text and the FAC-complete-design contract framing (extraction-vs-document).
- Any **transition** statement: `design-committee` currently says "Transitions to: none — standalone consultation; designer routes downstream." Does the new committee→specify transition change that? Compare to how `design-small-task` declares its transition to `spec-architect` / spec path.
- The **scribe agent** contract and the **artifact-template** (the template being replaced by the Option-2 template).
- `CLAUDE.md` files (root, `docs/`, `docs/chester/`, any per-skill) — any description of committee output or the design→spec pipeline.
- Project settings (`settings.chester.local.json` / `.json`) and claude settings — do ANY actually carry process description, or are they purely directory/style config? (State the finding either way — absence is a finding.)
- **Catalog freshness:** if any skill `description` frontmatter changes, `skills/setup-start/references/skill-index.md` must be regenerated + staged in the same commit. Flag which description edits (if any) the alignment forces.
- Version bumps on every skill whose behavior/contract changes.

## The second question — sprint decomposition

Is this **one** refactor sprint or **two**? Candidate seam: (i) author the new Option-2 template + scribe/contract wiring (the "committee produces a document" change) vs (ii) wire the committee→specify transition across skills + CLAUDE.md (the "committee hands off to spec" change). Argue from your lens whether these are one coherent change or two separable units with a clean dependency seam. Name the seam and the dependency direction if two.

## Hard constraints (unchanged)

- Context-economy invariant — scribe stays bounded-input.
- Standalone invocability of the committee must survive.
- Catalog freshness — description edits regen + stage skill-index.md same commit.

## Files to survey (you have Read/Glob/Grep; repo root `/home/mike/Documents/CodeProjects/Chester`)

Researcher: do the heavy survey. grep the skills tree and docs tree for: `verdict`, `decision packet`, `mine`/`extract`, `D9`, `reverse-engineer`, `FAC-complete`, `Transitions to`, `artifact-template`, `committee`. Enumerate every CLAUDE.md (`find . -iname CLAUDE.md`). Inspect `.claude/settings.chester*.json` and `~/.claude/settings.chester*.json` for any process description vs pure config. Produce a FILE LIST with file:line evidence and a one-line "what must change" per file. Mark DECISIVE the files whose change is load-bearing.

## Roster (for peer-DM)

Advocacy: `conservator`, `innovator`, `pragmatist`, `purist`. Plus `researcher`. Team-lead = `main`.

## Your deliverable (round02)

1. Write your full position to `committee/round02/<your-role>-transcript.md` (researcher → `researcher-findings.md`). Code vocab allowed in transcripts.
2. End with `## Final Position` (exact header, ≤200 words): `{position, rationale, blocking_risk, warrant}`. Your `position` must answer BOTH: (a) is the enumerated alignment surface complete from your lens / what did others miss, and (b) one sprint or two (with the seam if two).
3. Write transcript to disk FIRST, THEN SendMessage to `main` the routing signal `{member, status, round, transcript}` — no free text.
