# Sprint D.2 — Reasoning Audit

**Date:** 2026-05-08
**Sprint:** `cluster-d-build-shared-understanding/sprint-d-2`
**Status:** In-flight pause; reasoning trail through round 17

This audit captures the per-decision reasoning lineage that produced D.2's current proof shape. Sibling to `sprint-d-2-summary-00.md`. Useful for resume context; useful for D.3 inheritance; useful for sniff-testing the design holds together.

## Voice/Style Decision (rounds 1–2)

**Tension surfaced:** Original draft placed Voice as a fixed PM-style speaker with the entire skill speaking in one register.

**Designer pushback:** "Instead of PM Register we need something like 'Voice' which is the personality of the interview..."

**Resolution:** Voice and Style become orthogonal session-mutable plugins (NCON-7) with PM/normal defaults. Render artifacts (closing-argument, design-brief) override to skill-author-fixed briefing voice (NCON-8) — voice for in-session interview ≠ voice for output document.

**Why the split matters:** Designer can switch session voice mid-flow (e.g., caveman mode) without affecting render output quality. Render quality stays under skill-author control.

## Problem Statement Lineage (rounds 1–4)

**Initial draft:** Agent-authored, oriented around end-state hypotheticals.

**Designer:** "this is a terrible approach to a question, what are you even talking about" — pushed for concrete framing.

**Restage:** Concrete queue with "voice and style" picked first. Read-back consistency hazard claim made by agent; designer challenged it ("explain... why do i care?"). Agent conceded — closing argument is rendered at closure from proof state, not assembled from session conversation; in-session voice drift doesn't propagate.

**Final problem statement:** Designer rewrote entirely: "D.2 builds the redesigned design-large-task Presentation layer..." Ratified.

**Lesson:** Read-back consistency claims must be grounded in actual mechanism, not abstract concern. Agent over-reached on hazard framing; designer's empirical reading of the rendering mechanism corrected the framing.

## Rule vs. NC Reclassification (rounds 5–6)

**Surface:** Agent drafted 15 candidate Rules covering organizing principles + structural locks + cluster-D-1 inheritances.

**Designer pushback:** "why did we make rules instead of necessary conditions? rules are designer issued directives on constraints, not a task list" — and "even the organizing principles are not rules, they are evidence."

**Resolution:** Designer ratified keeping 3 organizing principles as Rules ("okay, keep as a rule") — RULE-1, RULE-2, RULE-3. 8 misclassified Rules withdrawn and reclassified as NCs (NCON-1 through NCON-8). Schema enforces designer-source = RULE only; the EVIDENCE attempt was rejected.

**Lesson:** Rule class = designer-issued constraint authority. NC class = derived structural condition. Agent must classify on creation; cannot push agent-derived structural conditions into Rule class to bestow them with designer-issued weight.

**Lineage preserved in proof:** R4-R8, R10-R13 withdrawn; equivalent NCs added with same content. Rules-now-NCs map: R4→NCON-1, R5→NCON-2, R7→NCON-3, R8→NCON-4, R10→NCON-5, R11→NCON-6, R12→NCON-7, R13→NCON-8.

## D.2 Concerns Authoring (rounds 7–8)

**Source:** Designer issued 11 D.2-internal Concerns + carried CERN-1 (originally cluster-D foundation Concern C-2): "I am concerned about a properly constructed decision venue; I am concerned about the information packet..."

**Note on storage:** Concerns labeled CERN-1 = original C-2 from cluster-D foundation; CERN-2 through CERN-12 = D2-C-1 through D2-C-11. Storage ID and display label diverge.

**Designer behavior:** Listed concerns en bloc, ratified the labeling.

**Carrying through draft state:** Designer's stated intent was Concerns ratified up-front to ground planning. Implementation reality used draft Concerns as planning input — it worked. Lifecycle ratify never fired during build phase.

## NC Authoring Loop (rounds 9–11)

**Pattern:** Per-Concern NC drafting — agent drafts NC covering Concern, presents full text, designer accepts/pushes back.

**Memory rule formed mid-loop:** Designer pushback: "make a memory; when a proof element is referenced for designer approval, print the full text of the element in the information packet."

**Why it surfaced:** Agent posted "NCON-10 added (D2-C-5 phase structure). Statement names six phases..." — designer corrected: that's a description, not the element. Ratification requires reading the artifact.

**Discipline encoded:** Eventually crystallized into NCON-15 (NC authoring discipline) and NCON-16 (Ratification turn shape).

**Lesson:** ID + summary breaks ratification because designer can't lock blind. Full-text print is the load-bearing discipline.

## 7-Slot Queue Evolution (round 10)

Five-pass refinement. Captured fully in NCON-14 rejected_alternatives.

| Pass | Shape | Pivot |
|------|-------|-------|
| 1 | 4 slots | Concerns / ungrounded NCs / pushback / agent-proposed |
| 2 | 8 slots (red team) | Add: RC authoring, Concern ratify, Rule absorption, Risk/Friction, Definition housekeeping, closing-readiness audit |
| 3 | 4 slots (collapse) | Group by trigger source: designer signal / proof completion / integrity / agent-proposed |
| 4 | 3 slots (macro reframe) | Designer wanted single completion slot with priority list; closing audit moved to auto-trigger |
| 5 | 7 slots (action-type split) | Split slot 2 by action: ratify / build / fix / hazard / housekeep |

**Why action-type split won:** Element-types co-fire across actions (NC ratify can pair with RC ratify, both are ratification work). Action-type alignment lets agent at round start ask "what action shape?" not "which element type?" Action shape drives turn voice and packet shape.

**Trade-off accepted:** 7 slots heavier than 3 in slot count, lighter in within-slot logic. Each slot has 1-2 sub-classes max.

## RULE-8 Sufficiency Review (rounds 12–13)

**Surface:** Designer asked agent to "implement rule 8 now" (consent gate strict mode).

**Agent caught a bug:** First jq query listed all 15 Rules including 8 withdrawn. Misled designer about active rule set. Corrected with status filter showing 7 active rules.

**Real issue:** RULE-8 was withdrawn during the rules→NCs reclassification. Consent-gate content lives at NCON-4. Designer's "implement rule 8" applied to NCON-4 content, not RULE-8 (which doesn't exist active).

**Designer red-teamed RULE-8 looseness:** Identified 5 loose-interpretation hooks:
1. OR path in `designer-source-or-confirmed`
2. Optional rationale
3. No temporal scope on confirmation
4. No per-op specificity
5. No prohibition on inferred consent

**Agent walked each hook adversarially:** Identified residual gaps (operation-array batching, near-paraphrase rationale, agent-honesty trust boundary).

**Resolution:** Add new Rule (RULE-16) with five tightened hooks. Source MUST be designer; rationale REQUIRED with verbatim quote; ONE op per call; immediate-prior-turn target naming; implicit consent prohibited. Trust boundary acknowledged as residual.

**Lesson:** Loose rules age into drift. Per-hook adversarial walk before ratification surfaces drift surface that letter-of-rule reading misses.

## Single-Topic Rule Tightening (round 14)

**Pattern repeat:** Single-topic was originally RULE-5; reclassified to NCON-2 during rules→NCs sweep. Designer asked to add a designer-issued Rule analog.

**Three hooks added:** ONE decision venue per round; multi-ratify prohibited; narrow NC+RC pair exception.

**Outcome:** RULE-17 binding. Multi-ratify per round prohibited triggered the next-round Permission discussion.

## RC Approval Flow Discovery (rounds 15–16)

**Surprise:** Ratifying RCON-1 (anchored to CERN-1) automatically cleared CERN-1's coverage closure_reason. Concern stayed in `draft` status. RC ratify alone is the coverage event in MCP semantics.

**Designer reflection:** "the intent was never that RC approval implied CN approval. The intent was the designer approved concerns which grounded the planning then once all worked out approve the RC."

**Two-path resolution:**
- Path 1: Up-front Concern ratify pattern (NCON-17) — Phase 2 / slot 7 Concern presentation with explicit ratify request.
- Path 2: Late-stage 1:1 bundle (PERM-1) — RC ratify + Concern ratify in same round permitted when RC anchors to Concern 1:1, applies at RC review for Concerns still in draft.

**Why both:** Original intent (Path 1) for new sessions; current session reality (Path 2) for the 11 Concerns sitting in draft.

**Lesson:** Implementation behavior (RC ratify auto-covers Concern) silently collapsed the designed two-cadence flow into one-cadence. Designer's intent was preserved by adding both paths to the proof rather than picking one.

## Defect Discovery (round 17–18)

**Designer surfaced new Concern:** "I am concerned that the presentation layer information packet and the round sequence will be difficult to modify in the future."

**Agent attempted manage_concerns op:add:** Rejected with `DOMAIN_ERROR: "Concerns are locked; cannot add"`.

**Verification:** Read `cluster-d-proof-layer-crud-requirements.md`. D.1 spec listed Concern Create as Closed, lock as Update path (Draft → Ratified status), not Create gate. Implementation drift from spec confirmed.

**Captured for D.3:** Full proof MCP problems report at `cluster-d-1/summary/proof-mcp-problems-report.md`.

## Cross-Cutting Patterns

### When designer says "make a memory"
This session produced one new memory (full-text print on review turns). Pattern: designer corrects framing, agent codifies the correction at memory level so future sessions don't repeat.

### When agent's first jq query misleads
Status filter omission produced wrong rules list. Pattern: when listing live state from the proof, always filter on status; never trust raw type filter.

### When implementation drift surfaces
Compare to spec. `cluster-d-proof-layer-crud-requirements.md` was authoritative for the lock-blocks-add question. Saved a long debate.

### When red-team passes accumulate alternatives
NCON-14 went 4→8→4→3→7. Each pass's losing shape became a rejected_alternative entry. Future maintainer reads NC and sees the design space, not just the landed answer.

## Opens for D.3

- Resolve D2-C-12 modifiability concern (currently blocked by lock-blocks-add defect; needs RISK class workaround or proof-MCP fix).
- Address all proof-MCP defects in problems report.
- Decide whether definitions/G1 promotion gets its own sub-sprint or folds into D.3 cleanup.
