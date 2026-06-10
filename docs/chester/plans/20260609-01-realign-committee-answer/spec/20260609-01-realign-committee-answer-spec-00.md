# Spec: Realign Design-Committee to Answer-Delivery

**Sprint:** 20260609-01-realign-committee-answer
**Parent brief:** docs/chester/working/20260609-01-realign-committee-answer/design/20260609-01-realign-committee-answer-design-00.md
**Architecture:** Hybrid — auditability at minimum surface. Architect A's concentrated change surface (changes land in team-lead-owned files) plus one structural borrow from Architect B: warrants are written onto disk in artifacts the team-lead already owns (`verdict.md`, `alignment-map.md`), rather than inventing a new artifact file, a new premise-ledger reference, or editing the Scribe contract. Every brief-listed deferral stays intact.

## Goal

Realign the `design-committee` skill so each round's terminal object is the most-informative answer to the designer's question — which may converge, preserve a legitimate split, or be partial — with its gaps named, rather than a decision menu the designer must resolve. The decision-seeking interaction becomes an instrument for extracting designer-held value-judgments the committee cannot derive itself; the answer is the deliverable. A team-lead authority guard keeps a no-opinion team-lead honest while it authors that answer: every answer-body assertion carries a warrant (evidence, logic, or in-scope designer premise) or is demoted to a gap, and the warrants are recorded on disk so the designer can audit them. The realignment lands entirely in team-lead-owned files and the orchestration skill, leaving the member agents, the Scribe contract, the locked decision-communication packet, and all rigid internal contracts untouched.

## Components

All paths under `/home/mike/Documents/CodeProjects/Chester/`.

- **`skills/design-committee/references/team-lead.md`** (PRIMARY; version v0009 → v0010). Owns the five principles, the revised per-round loop, the output-surface split, and the complete authority guard. Sections changed:
  - *Conversation Loop / Behavioral Constraints* — replace "Do NOT collapse irreducible splits when split is the finding" with the P1 answer-shape rule (converge / preserved-split / partial, chosen to lose the least information; collapse permitted only when warranted; collapse not required). Add: count is not a warrant; strict premise scope; the above-threshold gap trichotomy; designer-determined sufficiency (P3) as the sole termination trigger.
  - *Visible Surface* — add the output-surface split statement (see Constraint C-NAMING): the decision-communication packet format is locked and unchanged and is used only when seeking a decision; the end-of-turn session artifact has no mandated format. Add the P2 rule that a split yields the pointed question each side raises against the other, surfaced one at a time, pre-answered where possible.
  - *Internal Discipline / Consolidation Rules* — add the warrant test (name a warrant for every answer-body assertion; unwarranted → demote to gap), the C2 firewall (opinion only in the fenced Recommendation block), and the C1 audit (every collapse displays its warrant). Add the warrant-on-disk rule: warrants are recorded in the team-lead's own `verdict.md` / `alignment-map.md` so they are auditable, not held only in context.
  - *Internal Discipline / Self-Evaluation* — add an "Authority Guard" self-eval sub-block: warrant-coverage check, count-not-a-warrant check, strict-premise-scope check.
  - *Conversation Loop / Per-Round Flow* — reframe step 9 (Present) and step 11 (Designer response) for P3/P5; add the trichotomy branches to step 11; add premise-scope recording to the ledger step.
- **`skills/design-committee/SKILL.md`** (MINOR; version v0019 → v0020). Update Phase 2 Capture Question and Phase 4 Modes so the loop is framed as interview-to-resolution terminating on designer sufficiency (P3/P5), not a fixed one-round/two-round count; two-round Delphi remains an available technique, not the ceiling. Carry the output-surface split forward as orchestration framing where SKILL.md references the decision packet.
- **`skills/design-committee/references/committee-analysis-round-format.md`** (LIGHT; version bump). Add one paragraph documenting that `verdict.md` and `alignment-map.md` may carry a warrant block and an `answer-shape` marker, and resolve the term collision per Constraint C-NAMING (the realignment's output-surface split is a distinct concept from this sprint-lineage's existing artifact-boundary "two-surface" usage from sprint 20260606-01).

**Untouched by construction (deferrals + rigid contracts):** the four advocacy agent files, `design-committee-researcher.md`, `design-committee-consolidator.md`, `design-committee-scribe.md`, `references/member-protocol.md`, `references/artifact-template.md` (locked decision-packet format), `references/skill-contract.md`, and `skills/util-design-partner-role/SKILL.md`.

## Data Flow

The six-role structure, peer-DM protocol, off-roster ephemeral Consolidator/Scribe dispatch, round-folder layout, and `ledger.md` are unchanged. The realignment changes what the team-lead produces at the Converge and Present steps:

1. Members deliberate and write Final Positions (unchanged schema); the Consolidator enumerates from the bounded `## Final Position` sections (unchanged contract).
2. The team-lead synthesizes the **most-informative answer** from the enumerated baseline plus in-scope designer premises recorded in `ledger.md`. It writes `alignment-map.md`, then `verdict.md`, now each carrying an `answer-shape` marker (converged / preserved-split / partial) and a warrant record: for every answer-body assertion, the warrant type (evidence / logic / designer-premise) and source. Assertions with no warrant are not written as answer content — they are written as gaps.
3. Gaps are classified: factual gaps route to the researcher (on demand); value gaps are tested against the designer's threshold. Below-threshold → dropped. Above-threshold → surfaced to the designer one at a time, each as the sharpest question (for a split, the question each side raises, pre-answered where possible).
4. **Output-surface split at Present:** when the team-lead seeks a decision, it communicates via the locked decision-communication packet (unchanged format). The end-of-turn session artifact itself has no mandated format — it is whatever information fits the question.
5. The designer resolves a gap (fold into next round), preserves a split (it becomes the answer), waves a gap off (records a threshold calibration), or declares the answer sufficient and directs the next action. Designer sufficiency is the only termination trigger.
6. Designer premises are recorded in `ledger.md` with their granted scope; a premise warrants conclusions only within that exact scope, and only the designer may widen it.

## Error Handling

- **Unwarranted assertion reaches the answer body.** Failure mode: the team-lead states something it merely prefers. Response: the warrant test demotes it to a gap; the self-eval Authority Guard sub-block catches any that slip through before the packet sends.
- **Count cited as a collapse justification.** Failure mode: a 3-1 silently collapses to the majority. Response: the count-not-a-warrant rule and its self-eval check restore the warranted minority as a preserved split.
- **Premise over-extension.** Failure mode: a premise granted for one question is reused on an adjacent one. Response: strict-premise-scope rule + ledger scope field; any question not covered by an in-scope premise becomes a new gap, never an inference.
- **Opinion leaks outside the Recommendation block.** Response: C2 firewall keeps the Information and Decision packages warranted-assertions-only; opinion lives solely in the fenced, `Opinion:`-marked Recommendation.
- **Term collision ("two-surface").** Failure mode: a reader conflates the realignment's output-surface split with sprint 20260606-01's artifact-boundary "two-surface." Response: Constraint C-NAMING mandates distinct terms in all touched files.
- **Malformed member routing signal.** Unchanged from current behavior — rejected unread with one correction prompt.

## Testing Strategy

This is a skill-documentation change; verification is review-based plus existing bash test conventions.

- **Document-review verification.** Each acceptance criterion is observable by reading the resulting skill files: the named rule is present, in the named section, with the named behavior. The fidelity, adversarial, and ground-truth reviews in this skill's own chain are the primary gate.
- **Deferral-intactness check.** A reviewer (and `git diff --name-only`) confirms zero changes to the deferred/rigid files listed under Components.
- **Version-bump check.** `team-lead.md` v0009→v0010; `SKILL.md` v0019→v0020; `committee-analysis-round-format.md` bumped per the version rule. Catalog regen (`bin/chester-generate-agents`) only if any `description` frontmatter changed (it should not — descriptions are unchanged).
- **Behavioral spot-check (optional, recommended).** A single dry committee run on a small question, confirming the round produces an answer with an `answer-shape` marker and an on-disk warrant record in `verdict.md`, and that opinion appears only in the Recommendation block.
- Existing `tests/test-*.sh` remain green (no hook/config behavior changes).

## Constraints

- **C-RIGID — Internal contracts stay rigid.** No changes to the member Final Position schema, the Consolidator enumerate-only contract, the round-folder discipline, or the `ledger.md` cross-round model beyond adding a premise-scope record within the existing ledger.
- **C-LOCKED — Decision-communication packet format unchanged.** `artifact-template.md` and the Summary / Information Package / Decision Package / Team-Lead Comments structure are not modified.
- **C-VOICE — Voice invariants survive every format.** Translation Gate, C1, C2, option-naming, and the PM litmus apply across all artifact shapes; `util-design-partner-role` is not edited. The guard is an operational instantiation of C1+C2, not a new discipline.
- **C-DEFER — Deferrals intact.** No edits to the five member/researcher agent files, the Scribe agent, or the Scribe-followed `artifact-template.md`. The both-sides-of-a-split question principle is stated (P2); its concrete packet layout is not drawn. Threshold-calibration wording is left to implementation.
- **C-AUTHORITY — Designer is sole authority** for value, sufficiency, premise expansion, and committee termination.
- **C-DISK — Disk-as-handoff and standalone invocability preserved.** Phase-1 bootstrap creates no sprint; warrants ride on existing team-lead artifacts, adding no new required handoff file.
- **C-NAMING — Distinct term for the output-surface split.** The realignment's decision-communication-vs-session-artifact concept (P4) MUST use a term distinct from the artifact-boundary "two-surface model" established by sprint 20260606-01. The touched files state the chosen term once and use it consistently.
- **C-SURFACE — Minimum change surface.** Changes land only in `team-lead.md`, `SKILL.md`, and `committee-analysis-round-format.md`. Any change that would require touching a deferred or rigid file is out of scope.

## Non-Goals

- Editing member agent contracts to a build-an-answer framing (deferred open thread).
- Editing the Scribe contract or its artifact template (deferred; the structural-enforcement architecture that needed this was rejected).
- Drawing the concrete both-sides-of-a-split question layout in the decision packet (deferred).
- Introducing a new per-round artifact file, a separate premise-ledger reference file, or a typed warrant-field schema enforced by a separate agent (the rejected Architect-B structural approach).
- Final designer-facing wording for a threshold wave-off.
- Any implementation/build of the edits — this spec defines the target; plan-build sequences the work.

## Acceptance Criteria

### AC-1.1 — Each round emits an answer, not only a menu

**Observable boundary:**
- Reading `team-lead.md` → the Per-Round Flow and Behavioral Constraints describe the round output as an answer (converged / preserved-split / partial) with named gaps, not solely an option list.
- A committee round → produces an `answer-shape` marker in `verdict.md`.

**Given:** a convened committee on any question.
**When:** a round completes Converge.
**Then:** the written answer states a shape and names its gaps; an option menu appears only as one possible shape, not the mandatory output.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — Collapse is not required; a preserved split is a valid answer

**Observable boundary:**
- Reading `team-lead.md` → the standing "do NOT collapse irreducible splits" line is replaced by a rule permitting converge / preserved-split / partial, selected to lose the least information, with collapse permitted only when warranted and never mandatory.

**Given:** a round where two warranted positions stand.
**When:** the team-lead chooses the answer shape.
**Then:** preserving the split with each side's rationale is an allowed and sometimes-preferred outcome; nothing forces convergence.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — Output-surface split, distinctly named

**Observable boundary:**
- Reading `team-lead.md` Visible Surface → states that the decision-communication packet is locked/unchanged and used only when seeking a decision, and the end-of-turn session artifact has no mandated format.
- Reading the touched files → the P4 concept uses a term distinct from sprint 20260606-01's artifact-boundary "two-surface model" (C-NAMING), used consistently.

**Given:** the realigned skill files.
**When:** a reader looks for how the committee communicates a decision vs. what it leaves as the session artifact.
**Then:** the two are described as separate surfaces with the locked format on the communication side, and the naming does not collide with the prior artifact-boundary usage.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.2 — Locked decision-communication format preserved

**Observable boundary:**
- `git diff` → `references/artifact-template.md` is unchanged.
- Reading `team-lead.md` → when a decision is sought, the packet still uses Summary / Information Package / Decision Package / Team-Lead Comments.

**Given:** the realignment is applied.
**When:** the team-lead seeks a designer decision.
**Then:** the communication uses the existing locked format with no structural change.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — Warrant test on every answer-body assertion

**Observable boundary:**
- Reading `team-lead.md` Consolidation Rules → every answer-body assertion must carry an evidence, logic, or in-scope designer-premise warrant, or be demoted to a gap.
- A committee round → `verdict.md` / `alignment-map.md` carry a warrant record for the answer body.

**Given:** the team-lead authoring an answer.
**When:** it states a conclusion.
**Then:** the conclusion has a recorded warrant, or it appears as a gap rather than as answer content.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.2 — Count is not a warrant

**Observable boundary:**
- Reading `team-lead.md` → a named Behavioral Constraint and a self-eval check stating that alignment count never licenses collapse; a warranted minority survives as a preserved split.

**Given:** a 3-1 alignment where the lone position is warranted.
**When:** the team-lead chooses the answer shape.
**Then:** the round does not collapse to the majority on the strength of the count; the split is preserved.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.3 — C2 firewall: opinion only in the Recommendation block

**Observable boundary:**
- Reading `team-lead.md` → the Information and Decision packages are warranted-assertions-only; opinion is confined to the fenced, `Opinion:`-marked Recommendation block.

**Given:** a completed decision-communication packet.
**When:** a reader scans for opinion.
**Then:** opinion appears only inside the Recommendation block; the rest is warranted assertion.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.4 — C1 audit: every collapse displays its warrant

**Observable boundary:**
- Reading `team-lead.md` → a rule that any collapse of a split must show its warrant in the packet so the designer can overturn a wrong inference.
- A round that collapses a split → the displayed warrant is present and inspectable.

**Given:** a round where one side is defeated on the merits.
**When:** the team-lead collapses to the surviving side.
**Then:** the packet shows the warrant that defeated the other side; the designer can challenge it.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.5 — Warrants recorded on disk (auditability)

**Observable boundary:**
- A committee round → the warrant record lives in the team-lead's own `verdict.md` / `alignment-map.md`, not only in context.
- `git diff` → no new per-round artifact file and no new reference file were introduced to carry warrants (rides existing artifacts).

**Given:** a completed round.
**When:** the warrant record is sought.
**Then:** it is found in an artifact the team-lead already owns; no new file type was created.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.6 — Strict premise scope; designer-only expansion

**Observable boundary:**
- Reading `team-lead.md` → a rule that a designer premise warrants conclusions only within the exact scope granted; the team-lead never widens it; uncovered questions become new gaps.
- `ledger.md` usage → designer premises are recorded with their granted scope.

**Given:** a premise granted for one question.
**When:** an adjacent question arises that the premise does not cover.
**Then:** the team-lead surfaces a new gap rather than extending the premise; only an explicit designer act widens scope.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — Above-threshold gap trichotomy

**Observable boundary:**
- Reading `team-lead.md` Per-Round Flow → a below-threshold tension is not surfaced (dropped); an above-threshold gap is either resolved by the designer or preserved as a split; factual gaps route to the researcher, value gaps to the designer.

**Given:** a set of candidate gaps of mixed type and significance.
**When:** the team-lead prepares the round output.
**Then:** below-threshold tensions do not reach the designer; factual gaps go to the researcher; above-threshold value gaps are surfaced as designer decisions.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.2 — Question quality; one at a time; both-sides for splits

**Observable boundary:**
- Reading `team-lead.md` → gaps are surfaced one at a time; for a split, the team-lead poses the pointed question each side raises against the other, pre-answered where possible.

**Given:** a round with an above-threshold split.
**When:** the team-lead surfaces the decision.
**Then:** the designer sees the sharp question from each side (pre-answered where possible), surfaced singly, not a bare "pick A or B."

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.3 — Designer determines sufficiency and termination

**Observable boundary:**
- Reading `team-lead.md` and `SKILL.md` → termination is a designer sufficiency call, not committee convergence or a fixed round count; two-round Delphi is one available technique, not the ceiling.

**Given:** a multi-round consultation.
**When:** the loop continues or ends.
**Then:** it ends only when the designer declares the answer sufficient and directs the next action.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — Minimum change surface; deferrals and rigid contracts intact

**Observable boundary:**
- `git diff --name-only` → the only changed skill/agent files are `team-lead.md`, `SKILL.md`, and `committee-analysis-round-format.md`.
- `git diff` → the five member/researcher agent files, `design-committee-scribe.md`, `member-protocol.md`, `artifact-template.md`, `skill-contract.md`, and `util-design-partner-role/SKILL.md` are unchanged.

**Given:** the realignment is applied.
**When:** the change surface is inspected.
**Then:** only the three named files changed; every deferred and rigid contract is byte-unchanged.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.2 — Versions bumped correctly

**Observable boundary:**
- Frontmatter → `team-lead.md` v0009→v0010; `SKILL.md` v0019→v0020; `committee-analysis-round-format.md` bumped.
- Catalog → regenerated only if a `description` changed; otherwise unchanged.

**Given:** the edits are complete.
**When:** versions are checked.
**Then:** each touched file carries the correct bumped version and no spurious catalog regen occurred.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-06-09T13:29:24Z -->
<!-- produced-by design-specify@v0004 -->
