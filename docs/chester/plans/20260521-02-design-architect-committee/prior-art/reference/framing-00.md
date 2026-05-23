# Framing — Design-Architect-Committee Skill

**File:** `framing-00.md`
**Audience:** Committee (4 poles + Researcher + Arbiter consultant)
**Status:** Designer review pending. No agent dispatch until ratified.
**Decision basis:** `fac-recommendation-and-aoa-00.md` — Alternative F accepted.

## What we build

Skill that operates the design-architect-committee. Replaces proof-MCP-engine path. Honors all Vision principles. Lives at `docs/admin/20260521-design-system-analysis/design-architect-committee/`.

## Alternative F in one paragraph

Engine eliminated. Per-Concern typed schema is the design language. Three fields per Concern: IF/THEN body, IF NOT/THEN contrapositive collapse_test, Evidence ID grounding. Designer pre-asserts known-true axioms per Concern before deliberation opens. Agent argues only the delta from axioms to body. Clerk handles batch lint, coverage tracking, no synthesis, no narrative. Closed-set vocabulary preserved. Two-player asymmetric authority preserved. Channeling preserved — agent's finishable target becomes "fill the schema fields under axiom constraints."

## Files to produce

Four files. Each file carries its own load-bearing role. No file may exceed limits.

- **skill.md** — 200 words. Operator-facing. When to invoke. What it does. What it produces. Entry conditions, exit conditions. No mechanics — those live in rules.md.
- **rules.md** — 200 words. The discipline. What agents may do. What agents may not do. Designer axiom-assertion protocol. Clerk lint scope. Pole role boundaries. Honors all ten lenses from `lens-criteria-for-fac-options.md`.
- **schema/** — word-limit exempt. The design language itself. Per-Concern field shapes, closed-set vocabularies, enumeration tables, channeling slots. Dense by necessity.
- **design-brief-template.md** — word-limit exempt. Filled template that proves the schema produces all three required artifacts (constraint envelope, resolution criterion, coverage map). Concrete worked example, not abstract spec.

## Three artifacts the schema must produce

These exit the design system. Downstream design-specify consumes them.

- **Constraint envelope** — what the design must hold true. Bounded by axioms + ratified Concern bodies.
- **Resolution criterion** — how the design will be judged complete. Per-Concern collapse_test set.
- **Coverage map** — which Concerns have been addressed, by which schema entries, with which Evidence grounding.

If schema fill does not yield all three by read, schema fails.

## Vision principles that bind

From `reference/01-vision.md` Section 8 — load-bearing, non-negotiable. Skill must preserve each.

- Channeling — agent's completion drive resolves to "fill the schema."
- Closed-set vocabularies — every choice point is a bounded enumeration.
- Two-player asymmetric authority — agent proposes/revises/withdraws; designer asserts axioms and ratifies.
- Structural/semantic split — Clerk checks structural well-formedness; designer judges semantic content.
- Not-a-deliberation-tool-for-humans — schema is for agent-with-designer, not for collaborative human argumentation.

Q1 ruling applies: design-language schema satisfies Vision Section 1 without derivation engine. No proof state. No Datalog. No closure-gate query.

## Ten lenses still apply

From `lens-criteria-for-fac-options.md`. Each file must satisfy every lens.

- Singular purpose — three artifacts only.
- Method open inside the schema; method fixed at the skill boundary.
- Architectural altitude only — implementation prohibited.
- Proof system is a tool — here, no engine, schema replaces it.
- Committee assumed; four poles fixed; Clerk replaces Arbiter for this skill.
- Agents do not check their own work — Clerk lints; designer ratifies.
- 90/10 budget — schema fill is design work; Clerk lint is admin processing.

## Three accepted risks (from AoA)

Committee must address these in the skill design, not defer.

- **Cascade invalidation regression** — engine gave us automatic cascade. Without engine, revisions must trigger explicit re-ratification. Rules.md must specify the protocol.
- **Axiom-assertion mechanism quality** — open designer decision. Three candidates: Concerns Register direct entry / dedicated tool call / session-open named statements. Committee must propose, designer adjudicates.
- **Field-shape rigor under deadline pressure** — schema must hold under hurried fills. Closed-set vocabularies tighten this. Enumerations must be exhaustive enough that "other" is not a temptation.

## Three open designer decisions

These remain open at framing. Committee proposes, designer adjudicates before skill ships.

- D1 — Adoption confirmed (already given).
- D2 — Axiom-assertion mechanism specification.
- D3 — Clerk role scope (LLM agent vs deterministic script).

## Pole roles for this design work

Same charter as prior rounds.

- **Conservator** — channeling and Vision-principle preservation. Vetoes anything that dissolves load-bearing structure.
- **Innovator** — schema shape, axiom-anchoring mechanism, field-enumeration design. Owns the affirmative invention surface.
- **Pragmatist** — 90/10 compliance, operator ergonomics, what survives a tired Tuesday. Owns the friction-cost analysis.
- **Purist** — closed-set discipline, vocabulary tightness, structural lint gates. Owns the rigor surface.
- **Researcher** — prior-art comparison (Lean/Coq, Elicitron, LLMREI, gIBIS/Compendium anti-precedent). Owns empirical grounding.
- **Arbiter (consultant)** — answers "what did the engine do here" questions so the skill can capture what to keep vs let go.

## Output discipline

Word scarcity is the channeling instrument for this design itself. Less prose, more precision. Caveman register acceptable for inter-agent exchange. Designer-facing packets retain PM-architecture audience profile.

## What ratification looks like

Designer reviews this framing. Edits or accepts. On accept, framing locks. Committee receives framing + lens criteria + Vision reference. Committee produces draft skill, rules, schema, template. Designer reviews each in turn. Pole self-lint prohibited (Lens 9). Cross-pole and Clerk lint OK.

## Out of scope

- Re-litigating Alternative F selection.
- Re-opening Q1 (derivation requirement).
- Rebuilding any part of the prior proof MCP engine.
- Designing the downstream design-specify consumer — only the contract surface it reads.
