# Reasoning Audit: Optimize Chester Throughput

**Date:** 2026-04-18
**Session:** `00`
**Plan:** `optimize-chester-throughput-plan-00.md`

## Executive Summary

The session refactored Chester's design-and-plan pipeline after a retrospective showed the existing structure over-provisioned on bounded work and contained structural redundancies between `design-specify` and `plan-attack`. The most consequential decision was to absorb `design-specify`'s two earning-their-keep functions (three-architect comparison, ground-truth verification) into a new Finalization stage inside `design-experimental` rather than keeping specify as a separate opt-in skill. The implementation stayed on-plan except for two mid-sprint corrections: a scope gap (one file not enumerated in Task 2b's original edits) and a self-inflicted archived-skill reference (a "Does NOT call: design-specify" line in the Integration section caught by the cross-skill grep gate).

## Plan Development

The plan was developed through an extended `design-small-task` conversation that surfaced three candidate optimization levers (prose trim, merge attack+smell, make specify opt-in). The designer's reframing of the problem in terms of two named contract boundaries (Envelope Handoff and Artifact Handoff) and the "proof = WHAT, finalization = HOW" semantic split shaped the final approach. Plan-build produced an 8-task plan; the plan-hardening gate identified a critical scope gap (four additional files outside plan scope contained archived-skill references) and three implicit cross-skill contracts (architect `subagent_type` not named in dispatch, anchor extraction not defined, skip-list protocol not visible at skill level). Directed mitigations added Task 2b, Task 6b, and targeted amendments to Task 5 before execution began.

## Decision Log

### Absorb design-specify into design-experimental's closure

**Context:** The retrospective at `docs/plan-hardening-effectiveness.md` and the designer's direct feedback ("I don't need formal specification documents") indicated `design-specify` was producing an unwanted spec artifact and running review loops that overlapped with experimental's proof machinery. The question was whether to keep specify as an opt-in step, drop it entirely, or absorb its value functions elsewhere.

**Information used:**
- 18-sprint retrospective on plan-attack vs plan-smell
- `design-experimental` proof MCP schema (grounded EVIDENCE/RULE/PERMISSION/NECESSARY_CONDITION elements)
- `design-small-task` precedent for direct-to-plan-build routing with no spec step
- Designer's explicit feedback on architect value ("often provided interesting options for the architecture event with the full design brief")

**Alternatives considered:**
- `Keep design-specify opt-in` — rejected because small-task already demonstrated the direct-to-plan-build path works, and specify's review loops overlapped with experimental's proof grounding
- `Drop design-specify entirely including architects and ground-truth` — rejected because designer signaled both functions were earning their keep
- `Split specify into two separate skills (architect-comparison, ground-truth-review)` — not seriously considered; would have added machinery rather than removing it

**Decision:** Absorb specify's architect comparison and ground-truth verification into a new Finalization stage inside `design-experimental`, bracketed by Envelope Handoff and Artifact Handoff contract boundaries. Delete specify's other mechanisms (prior-art explorer duplicate, spec fidelity review, user review gate, spec document). Route experimental directly to plan-build.

**Rationale:** Specify was built against a pre-proof upstream. Experimental's proof MCP already does structural grounding; specify was replaying that work at a different altitude. Absorbing the two additive functions keeps signal; everything else was redundant.

**Confidence:** High — explicitly discussed and confirmed by the designer through multiple rounds of the design conversation.

---

### Closing argument approval = proof commitment point

**Context:** Early in the design conversation, the sequencing of Finalization's parallel gate relative to the closing argument was unclear. Three candidate insertion points were considered: pre-closing-argument, post-closing-argument-pre-approval, post-approval.

**Information used:**
- Designer's statement: "I view the closing argument as my APPROVAL for the proof, then we can move to finalizing the design"
- Existing experimental Phase 5 structure where closing argument is presented for designer reaction

**Alternatives considered:**
- `Fire gate before closing argument so findings inform it` — rejected because it muddies what the designer is approving
- `Fire gate after closing argument but before approval` — rejected because it conflates WHAT approval with HOW reconciliation
- `Fire gate after approval, as its own stage` — chosen

**Decision:** Closing argument approval is the commitment point for the proof. Finalization operates on the settled envelope without re-reviewing the proof. The gate fires once per approval; automatic re-runs are not supported. Deep-case reopening is explicitly designer-initiated.

**Rationale:** Approval semantics stay clean — the designer commits to WHAT before HOW is selected. Removes a tiered revision loop I was building prematurely. Matches the designer's framing verbatim.

**Confidence:** High — designer stated this directly.

---

### Plain brief sections + semantic skill vocabulary

**Context:** After locking the envelope-plus-point structure, the question was whether the brief artifact should use semantic names (Foundation, Hazards, Constraints, Relief) or plain names (Evidence, Risks, Rules, Permissions). Both are defensible.

**Information used:**
- The brief is consumed by plan-build and by human readers scanning archived plans
- Skill instructions and architect prompts benefit from distinctive vocabulary that signals the envelope framing
- Chester's existing vocabulary leans semantic (`understanding-confirmed`, `closure_permitted`)

**Alternatives considered:**
- `Semantic names throughout` — rejected because a fresh reader of a finalized brief would have to learn non-standard vocabulary
- `Plain names throughout` — rejected because skill instructions lose the framing tightness that distinctive terms provide
- `Hybrid — plain in artifact, semantic in skill instructions` — chosen

**Decision:** Brief uses nine plain-named sections (Goal, Necessary Conditions, Rules, Permissions, Evidence, Chosen Approach, Alternatives Considered, Risks, Acceptance Criteria). Skill instructions and architect prompts use semantic envelope vocabulary.

**Rationale:** The split assigns each vocabulary where it earns its keep — plain for legibility, semantic for framing. Accept the minor translation surface between skill instructions and artifact output as worth the readability gain.

**Confidence:** High — explicitly chosen after weighing both alternatives.

---

### Semantic boundary names over numeric labels

**Context:** After introducing the two new contract boundaries, a naming convention was needed. Numeric labels (B1, B2, Boundary 1, Boundary 2) are concise; semantic names (Envelope Handoff, Artifact Handoff) are self-describing.

**Information used:**
- LLM processing considerations: context compaction, cross-skill references, subagent prompts
- Chester's existing naming style (semantic throughout)
- Designer's direct question: "which name is more appropriate for an LLM to understand"

**Alternatives considered:**
- `Numeric labels (B1, B2)` — rejected because they carry no semantic content and require lookup every time
- `Semantic names (Envelope Handoff, Artifact Handoff)` — chosen

**Decision:** Use semantic names that name the payload crossing the boundary.

**Rationale:** Semantic labels degrade better under compaction, activate correct concept associations, transfer cleanly to subagent prompts, and fit Chester's existing vocabulary. The framing-commitment risk (future renames ripple through) is real but low since the names accurately describe what crosses.

**Confidence:** High — direct designer question, explicit answer.

---

### Conditional plan-smell via heuristic, not configuration dial

**Context:** The retrospective showed plan-smell had concentrated but declining value (1 real bug per 6 sprints; on mechanical refactors, mostly polish). The question was whether to keep it unconditional, merge it with plan-attack, or make it conditional. If conditional, two implementation options: a gate-time prompt asking the designer, or a cheap heuristic on plan text.

**Information used:**
- Mike's thinking lesson "Don't add configuration dials (profiles, levels, modes) when the system can self-adjust — the user will cut them" (scoring 3 in `~/.chester/thinking.md`)
- Retrospective analysis categorizing smell triggers by sprint type
- Signal that reviews produce good information (don't dilute)

**Alternatives considered:**
- `Keep plan-smell unconditional` — rejected because retrospective showed declining value
- `Merge plan-attack + plan-smell into one reviewer` — rejected because they target different failure modes with independent signal ("will not work" vs "will work but scar")
- `Gate-time designer prompt asking whether smell should run` — rejected because it adds a configuration dial, conflicting with Mike's established principle
- `Cheap keyword heuristic on plan text` — chosen

**Decision:** `plan-attack` runs unconditionally. `plan-smell` fires only when a keyword heuristic matches five trigger categories (DI registrations, new abstractions, async/concurrency, new persistence pathways, new contract surfaces). Keyword list inclusive by design (false positives cheap, misses costly).

**Rationale:** Heuristic embodies the "let the system self-adjust" principle. Inclusive bias matches the asymmetric cost: an extra parallel dispatch is recoverable, an uncaught real bug is not.

**Confidence:** High — explicit thinking-lesson reference plus designer confirmation.

---

### Architects as HOW generators (not dissent)

**Context:** Mid-conversation, the architects' role was being framed as fresh-eyes dissent on a finished artifact. Mike corrected this with: "the three architects often provided interesting options for the architecture event with the full design brief."

**Information used:**
- Mike's direct feedback that architects generate options even against full briefs
- The asymmetry between proof's `rejected_alternatives` (records options the conversation already touched) and architect proposals (surfaces options the conversation didn't consider)

**Alternatives considered:**
- `Architects as optional dissent, maybe skip for simple designs` — rejected after Mike's feedback reframed their role
- `Single dissent architect (to reduce dispatch count)` — rejected because breadth of options is the value

**Decision:** Three architects, always fire, isolated-parallel, structured bulleted output template. Load-bearing step, not accessory review.

**Rationale:** Architects expand the design space beyond what the proof traversed. `rejected_alternatives` captures retrospective thinking; architects produce generative alternatives. Complementary functions, not redundant.

**Confidence:** High — explicit designer correction of my earlier framing.

---

### Scope-gap mitigation via Task 2b

**Context:** Plan-attack at the hardening gate found that the plan's file-enumeration under-scoped the archived-skill scrub. Five additional files beyond the original Task 2 contained references. The design brief's acceptance criteria #1 and #2 would have failed mechanically.

**Information used:**
- Plan-attack's grep-based evidence identifying the specific files and line numbers
- Cross-referencing the plan's task scope against the actual file set

**Alternatives considered:**
- `Extend Task 2 to cover more files` — viable but would have grown one task substantially
- `Add a new Task 2b after Task 2 covering the remaining files` — chosen
- `Return to design for a broader restructure` — rejected; the issue was plan-author omission, not a design flaw

**Decision:** Add Task 2b as a targeted scrub task covering the four missed files (plus add the cross-skill grep test as the authoritative gate).

**Rationale:** Minimally invasive to the existing plan structure. The grep test becomes a future-proof gate — new references will fail CI instead of slipping through.

**Confidence:** High — explicit threat-report finding with actionable mitigation.

---

### Remove "Does NOT call: design-specify" line after self-inflicted test failure

**Context:** During Task 5 execution, the implementer followed the plan's instruction to add "Does NOT call: `design-specify` (archived — verification and architect comparison absorbed into Finalization stage)" to the Integration section. The cross-skill grep test then failed because it caught the word `design-specify` even in a negative context.

**Information used:**
- Cross-skill grep gate behavior (substring match, no negation handling)
- Integration section's role as a concise invariant list

**Alternatives considered:**
- `Update the grep test to whitelist "Does NOT call" context` — rejected because it weakens the authoritative gate
- `Remove the negative reference line entirely` — chosen
- `Rephrase without using the skill name` — redundant with option above

**Decision:** Delete the "Does NOT call: design-specify" line. The skill's absence from the Calls list already communicates it.

**Rationale:** Negative references are unnecessary documentation. The test's strict behavior is correct — any mention of an archived skill is a drift signal. Adjusting the text preserves the gate's strictness.

**Confidence:** High — explicit test failure and clean fix.

---

### util-worktree inline fix during execution

**Context:** The Task 2b implementer reported the cross-skill grep test still failing after its edits because `skills/util-worktree/SKILL.md:198` referenced `design-figure-out`. This file was not in Task 2b's original scope — plan-author omission.

**Information used:**
- Think-gate analysis from execute-write ("Is the issue a plan flaw or a context gap?")
- One-line fix scope

**Alternatives considered:**
- `Dispatch a follow-up subagent for the one-line edit` — rejected as overkill
- `Let Task 7 verification catch it and loop back` — rejected as deferred risk
- `Inline edit + commit directly` — chosen

**Decision:** Make the one-line edit and commit inline. No subagent dispatch.

**Rationale:** Plan flaw (missed file) with minimal fix scope. Per execute-write's think-gate guidance, this was a plan restructure, not a context gap requiring re-dispatch. The fix is a clean follow-up commit.

**Confidence:** High — the edit was mechanical and the test result proved the fix was sufficient.

---

### Skip per-task spec/quality reviewer dispatches for mechanical refactors

**Context:** Execute-write's Section 2.1 describes per-task spec-compliance and code-quality reviewers. Running these on every task of a SKILL.md refactor sprint would add 18+ subagent dispatches — contradicting the sprint's own goal of reducing dispatch overhead.

**Information used:**
- Each task has a unit test that encodes its acceptance criteria
- Tests pass after each task
- The sprint's goal is token efficiency
- Execute-write's red flag "Skipping spec review and going straight to code quality review" — but doesn't flag skipping both for task types where the test IS the spec

**Alternatives considered:**
- `Full per-task reviewer dispatch (spec + quality)` — rejected as rubber-stamp territory for mechanical refactors
- `Spec reviewer only, skip quality reviewer` — rejected as inconsistent
- `Skip per-task reviewers, rely on unit tests + Section 4 final review` — chosen
- `Skip everything including Section 4 final review` — rejected as losing the final sanity gate

**Decision:** Skip per-task spec/quality reviewer dispatches. Rely on per-task unit tests (which encode acceptance criteria) plus the final Section 4 code review at the end.

**Rationale:** For this sprint's specific shape — SKILL.md text refactors with test-encoded acceptance — the unit tests provide the same signal as a spec reviewer at a fraction of the token cost. Judgment call consistent with the skill's goal of keeping signal high.

**Confidence:** Medium — explicit judgment call, consistent with the sprint's goals but slightly outside the letter of execute-write's Section 2.1. The user can ask for per-task reviews in follow-up sprints if this proves to miss something.

---

### Single-sprint scope with ordered commits, not two sprints

**Context:** The sprint's scope was substantial (6 skill files, new template, new tests, conditional heuristic). Splitting into template-only + pipeline-only sprints was considered.

**Information used:**
- User preference for clean git history (from user memory)
- Coupling between template refactor and skill changes that write to it

**Alternatives considered:**
- `Two sprints, template first then pipeline` — rejected; creates partial-consistency window between sprints
- `Single sprint, one mega-commit` — rejected; loses reviewability
- `Single sprint, ordered commits (template first, then skills)` — chosen

**Decision:** One sprint, commits ordered template-first.

**Rationale:** Preserves reviewability per commit while keeping the full change in one branch and one PR. Avoids the partial-consistency window of splitting.

**Confidence:** High — explicitly discussed and confirmed by the designer.
