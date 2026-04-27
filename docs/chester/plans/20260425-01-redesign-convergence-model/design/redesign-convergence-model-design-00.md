# Redesign Convergence Model — Design Brief

## Goal

Add agent voice discipline to the shared design partner role file so the agent's claims to the designer carry visible epistemic status — facts presented as facts, assumptions explicitly flagged, opinions and recommendations distinct from observation. Past-session analysis of eleven design sessions in the StoryDesigner project revealed two related failure modes: confidence laundering (agent presents pattern-matched guesses with the same fluency as verified observations, designer cannot distinguish) and a transition gate that fires before the problem space is sufficiently narrowed (Solve stage ran equal-or-longer than Understand in four of five measurable sessions; one session ran Understand:3 rounds, Solve:16 rounds). This brief addresses the first failure mode (voice discipline) and adds telemetry plus session metadata to make the second failure mode (gate timing) tractable in a follow-on sprint. Gate-mechanism work is explicitly deferred.

## Prior Art

Past-session analysis findings (eleven sessions across StoryDesigner, sprints `20260405-01` through `20260417-01`):
- Transition gate at thresholds (overall 0.65, per-group 0.50, three-round minimum) fires too early
- Saturation scoring is gameable from inside the agent — climb scores by writing better justifications without deeper understanding
- Nine dimensions across three groups (landscape, human_context, foundations) have no published precedent; grouping is post-hoc
- Temporal context dimension chronically underdeveloped (0.1–0.25 across most sessions) — caught a real omission
- Per-session analysis required manual derivation of group saturation history from per-round score snapshots; sharper telemetry would have made analysis cheaper

Industry research (academic and HCI literature):
- No published equivalent to graded multi-dim AI-paired transition gate
- Closest cousins: Clark and Brennan grounding criterion (binary, purpose-relative), Klein Joint Activity Theory (continuous repair), grounded theory theoretical saturation (holistic), Scrum Definition of Ready (binary multi-dim, document-level not dialogue-level)
- Citations: Clark and Brennan (1991), Klein et al. (2005), Glaser and Strauss (1967), Schön (1983), Horvitz (CHI 1999)

Conversation prior art (this sprint's design dialogue, treated as input):
- Explored Implication Closure mechanism (agent generates falsifiable predictions, verifies against codebase, gates transition on N consecutive zero-failure cycles) — deferred to Lane 2 follow-on sprint
- Explored citation system (numbered inline markers, sources document, derivation paragraphs) — rejected; overhead disproportionate for MVP; designer's preferred discipline is fact-default with marked departures
- Original three-tier C2 (known / inferred / guessed) reframed twice during conversation — first to Found / Inferred / External (provenance-based), then collapsed to current Fact / Assumption / Opinion (epistemic-status-based)

Existing partner role disciplines (`skills/util-design-partner-role/SKILL.md`):
- Translation Gate strips code vocabulary from designer-visible output
- Research Boundary keeps code exploration private
- Private Precision Slot allows uncensored agent thinking notes via capture_thought
- Option-Naming Rule names by structural behavior, not type names
- Self-Evaluation game ("strategy talk vs code talk") at end of every turn

## Scope

**In scope:**

- New section in `skills/util-design-partner-role/SKILL.md` defining C1 (Externalized Coverage) discipline
- New section in `skills/util-design-partner-role/SKILL.md` defining C2 (Fact-default with Assumption and Opinion marking) discipline
- Before/after example demonstrating C2 marker discipline, parallel to the existing Translation Gate before/after example
- Three telemetry fields added to `skills/design-large-task/understanding-mcp/state.js`: `groupSaturationHistory`, `transitionHistory`, `warningsHistory`
- `submit_understanding` handler in `skills/design-large-task/understanding-mcp/server.js` updated to populate the three new fields
- Test in `tests/` confirming the three fields persist across multiple submit cycles
- Session metadata file write step added to `skills/start-bootstrap/SKILL.md` — writes `design/{sprint-name}-session-meta.json` containing sprint name, branch name, session start timestamp, JSONL session identifier, and Chester skill version
- One-line cross-reference added to `skills/design-large-task/SKILL.md` per-turn flow pointing to C1 and C2 sections
- One-line cross-reference added to `skills/design-small-task/SKILL.md` per-turn flow pointing to C1 and C2 sections

**Out of scope:**

- Lane 2 work (transition gate redesign, dimension restructuring, Implication Closure prediction loop) — deferred to a separate follow-on sprint where this sprint's telemetry will inform mechanism choice
- Citation system (numbered inline markers, sources document, derivation paragraphs for synthesis) — considered during conversation, rejected as overhead disproportionate to MVP value; explicitly do not reintroduce
- Source breadcrumb in commentary (e.g., "Fact (read from BridgeService:45)") — rejected to keep Translation Gate intact and reduce per-turn marker overhead; designer asks for source if curious
- Modifications to `design-specify`, `plan-build`, `execute-write`, or any downstream skill — voice discipline lives at design stage only
- New MCP tools or schema changes beyond the three named telemetry fields
- Real-time topic-tracking, designer correction marking, per-turn topic-chosen capture — would require behavioral changes to the skill itself, deferred with Lane 2
- Cross-MCP linkage between understanding state and proof state files — deferred; correlation can stay external for now
- Modification or removal of any existing partner role discipline (Translation Gate, Research Boundary, Private Precision Slot, Option-Naming Rule, Self-Evaluation) — additions only, no replacements

## Key Decisions

1. **C1 statement: agent must not reason from un-externalized context to a designer-facing conclusion.** Load-bearing concepts must surface in designer-visible output before they count toward shared understanding. Single-session scope. Why: addresses hidden-premise reasoning observed in past sessions where agent's commentary depended on explorer-report content the designer never saw. Alternative considered: full citation system with numbered inline markers and sources document — rejected as MVP overhead.

2. **C2 default state is Fact (verifiable + repeatable); Assumption and Opinion marked when applicable.** Most claims unmarked. Agent flags only departures from the Fact default. Natural phrasing acceptable for both markers ("I'm assuming X..." / "Assumption; I assumed that..." / "I think..." / "I recommend..."). Why: massively reduces marker noise compared to per-claim labeling; forces explicit advocacy and explicit uncertainty without burdening every sentence. Alternatives considered: canonical lead-words on every claim (rejected as boilerplate that designer tunes out); free-form three-tier marking on every claim (rejected as still-gameable through fluent phrasing); citation-type-as-confidence-type (rejected with the citation system).

3. **All recommendations are opinions — hard rule.** Even when grounded in solid Facts, the act of recommending IS the opinion. Facts are evidence; recommendation is judgment. Must carry Opinion marker. Why: separates analysis from advocacy so designer can challenge the recommendation without re-litigating the underlying evidence.

4. **Discipline lives in `util-design-partner-role`; both design skills inherit via one-line cross-reference.** New sections added once to the shared file. Each design skill (`design-large-task`, `design-small-task`) gets a single-line reference in its per-turn flow text pointing to the new sections. Why: shared canonical home; both skills inherit identically; minimum drift surface. Alternatives considered: separate copies in each skill (rejected as drift-prone); full integration into per-turn gate text (rejected as overkill for MVP).

5. **Three telemetry fields added to MCP state.** `groupSaturationHistory` (array, appended each round), `transitionHistory` (array of `{ ready, reasons }` per round), `warningsHistory` (array of score-jump warnings per round). Why: would have made past-session analysis materially sharper at low cost (~15 lines of code). Group saturation history was the single most painful manual derivation during analysis; transition history reveals whether agent transitioned at first opportunity or stayed past readiness; warnings history shows whether score-jump flags were heeded. Alternative considered: no telemetry change (rejected as wasting cheap signal); larger telemetry expansion (rejected as scope creep).

6. **Session metadata file written by `start-bootstrap` at sprint creation.** File at `design/{sprint-name}-session-meta.json` containing sprint name, branch name, session start timestamp, JSONL session identifier (path or ID), and Chester skill version (commit hash of `util-design-partner-role` and `design-large-task` at session start). Why: enables future Lane 2 retrospective analysis by linking sprint artifacts to the JSONL transcript without manual hunting through `~/.claude/projects/{project-hash}/`. Skill version capture allows comparing sessions run under different skill versions (e.g., before-this-brief vs after-this-brief). Alternative considered: no metadata (rejected as making future analysis more expensive); writing at closure (rejected because session may not reach closure cleanly).

## Constraints

- Translation Gate must continue to apply throughout designer-visible output unchanged; C1 and C2 markers and any optional phrasing must not introduce code vocabulary into commentary
- C2 markers use natural phrasing, not strict canonical lead-words — agent has flexibility in how to express Assumption and Opinion as long as the marker is unambiguous
- No source breadcrumb permitted in commentary (rejected during conversation); precision lives in agent's private notes via existing capture_thought mechanism; designer requests source explicitly if needed
- Citation system explicitly rejected — implementation must not reintroduce numbered inline markers, sources document, or derivation paragraphs even if they appear convenient
- Light-touch scope holds — only the five named files (plus test file) are modified; do not expand to gate logic, register restructuring, or downstream skills
- Self-Evaluation game gets a sibling check ("Did I mark every Assumption and every Opinion in this turn?") added alongside the existing "strategy talk vs code talk" check; do not replace the existing check
- Existing partner role sections (Translation Gate, Research Boundary, Private Precision Slot, Option-Naming Rule, Self-Evaluation) must remain intact — no edits to their text
- Three new telemetry fields are additive; existing `scoreHistory`, `saturationHistory`, and derived current-state fields must remain unchanged
- Session metadata file is tracked in git (lives in `design/` subdir which gets archived to `plans/` at sprint close); do not gitignore

## Acceptance Criteria

- `util-design-partner-role/SKILL.md` contains a new section defining C1 (Externalized Coverage) with statement, failure mode, and scope
- `util-design-partner-role/SKILL.md` contains a new section defining C2 (Fact-default with Assumption and Opinion marking) with statement, default-state rule, marker discipline for both Assumption and Opinion, hard rule that all recommendations are opinions, and the no-breadcrumb constraint
- `util-design-partner-role/SKILL.md` contains a before/after example demonstrating C2 — at minimum one Fact, one Assumption with marker, one Opinion with marker, and one confidence-laundering case (Fact-shaped sentence that should have been Assumption)
- `util-design-partner-role/SKILL.md` Self-Evaluation section gains a sibling check covering "Did I mark every Assumption and every Opinion in this turn?"
- `understanding-mcp/state.js` defines `groupSaturationHistory`, `transitionHistory`, and `warningsHistory` as initialized empty arrays in `initializeState`
- `understanding-mcp/state.js` `updateState` appends to all three new arrays each round
- `understanding-mcp/server.js` `handleSubmitUnderstanding` returns the new fields where appropriate (existing response shape preserved; new fields available via state inspection)
- Test file in `tests/` confirms the three new fields persist correctly across at least three sequential `submit_understanding` calls
- `start-bootstrap/SKILL.md` documents a new step writing `design/{sprint-name}-session-meta.json` at sprint creation; the JSON contains sprint name, branch name, session start timestamp, JSONL session identifier, and skill version commit hashes
- New session metadata file is parseable JSON with all five required fields populated
- `design-large-task/SKILL.md` per-turn flow text contains a one-line cross-reference to C1 and C2 sections in `util-design-partner-role`
- `design-small-task/SKILL.md` per-turn flow text contains a one-line cross-reference to C1 and C2 sections in `util-design-partner-role`
- All modified skill text passes Translation Gate when read aloud — no code vocabulary leaks into designer-facing prose
- Existing skill mechanics (Translation Gate, Research Boundary, Private Precision Slot, Option-Naming Rule, Self-Evaluation) function unchanged after edits
- Existing telemetry fields (`scoreHistory`, `saturationHistory`, derived current-state fields) function unchanged
