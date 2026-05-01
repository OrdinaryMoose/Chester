# Cluster A — Define Solve: Thinking Summary

Sprint: `cluster-a-define-solve` (under master plan `20260430-02-rebuild-design-derivation`)
Date: 2026-04-30
Status: Approved

---

## Decision History — How the Conversation Reached the Necessary Conditions

### Decision 1 — Element shape (NC-01)

**Settled:** new sixth element category, alongside the five existing immutable types.

**Alternatives considered:**
- Extend Necessary Condition with a discriminator field flagging some entries as resolve conditions.
- Carry resolve conditions as a parallel artifact outside the proof.
- Continue with agent-prose acceptance criteria at brief render time.
- Name the new category "Sufficient Condition" for visual NC/SC symmetry.

**Why a new category won.** The semantics are opposite — Necessary Condition restricts the design space, Resolve Condition certifies exit from it. Folding the two into one type forces every reader to conditionally interpret which job a given entry is doing. The source rules differ — NC is agent-derived from grounding; Resolve Condition is agent-proposes-designer-validates. Putting that difference on a new type is a clean shape move; layering it onto the existing NC contract violates RULE-1's immutability. The migration from agent-prose AC to a typed home reads as completing the partial migration; an extension reads as overloading an existing slot.

**Why "Sufficient Condition" was rejected.** Visual symmetry with NC is appealing but logically misleading. In formal logic, "necessary" and "sufficient" are conjugate concepts on the same logical axis — together they characterize a relationship between premises and conclusions. NC and the new element do *opposite jobs* (restrict vs certify-exit), which is a different axis. A reader with a logic background would expect a relationship that isn't there. "Resolve Condition" pairs with "Necessary Condition" structurally (both typed conditions, pluralizing naturally) without the misleading conjugate framing.

**Designer confidence:** high. Locked early in the Solve stage; revised once to absorb the naming rationale.

---

### Decision 2 — Coverage anchor naming (NC-02)

**Settled:** *Concern* — a PM-named dimension of the problem that the proof targets for resolution.

**Alternatives considered:**
- *Aspect* — initial working name, rejected as too vague.
- *Resolve Target* — paired naming with Resolve Condition.
- *Pain Point* — rejected; designer found "pain" language grating.
- *Stakeholder Concern*, *Issue*, *Driver*, *Problem Facet*, *Outcome Dimension* — rejected as either compound, overloaded, or imprecise.

**Why Concern won.** Matches PM speech directly — "here is our problem with these concerns." Single word, no compound. ISO 29148 / PMI vocabulary. Distinguishes itself from Necessary Condition by sitting at problem-side, not design-side. The term names the role neutrally without implying a binary hit-or-miss frame the way "target" can.

**Designer confidence:** high. Designer surfaced the rejection of "pain" language explicitly, which propagated forward — definitions and brief render are now free of "pain" / "pain-point" vocabulary.

---

### Decision 3 — Resolve Condition required fields and source rule (NC-03)

**Settled:** three fields — `statement`, `problem_anchor`, `ratification`. Source rule: agent proposes statement and anchor; PM ratifies.

**Alternatives considered:**
- Four fields including `forward_test` (verification artifact reference).
- `forward_test` as optional rather than required.
- Verification-pointer reference to an external artifact.
- Combine statement and verification into one field.
- Add priority, severity, ordering fields.

**Why three fields won — the altitude correction.** This decision underwent the largest reframe in the session. Initial proposal carried a fourth field (`forward_test`) for the verification mechanism. Mitigations layered on top of it (artifact-reference lint, producibility check, semantic-diff threshold for stale ratification) compounded into "huge failure load" the designer flagged. The reframe: the human ratifying the proof is a Product Manager, not an engineer. PMs hold project intent and architectural vision at high level — they don't audit logs, read traces, or evaluate test artifacts. The `forward_test` field was pushing engineer-altitude content onto the wrong reader. Master-plan RULE-3 reinforced the boundary: design-specify generates solutions and owns verification; the proof produces input. Verification mechanics belong in the spec layer, where test-skeleton scaffolding from the decision-loop sprint already handles them. Removing `forward_test` collapsed most of the gaming-vector list (vapor artifacts, restatement, prescription smuggling, ratification fatigue from engineer-content evaluation).

**Designer confidence:** high after correction. Designer stated the altitude mismatch directly: "the person running the system is not an engineer, it is a product manager."

---

### Decision 4 — Coverage check semantics (NC-04)

**Settled:** per-Concern coverage with Resolve Condition or Rule union — every Concern needs ≥1 ratified RC anchored to it OR ≥1 Rule whose statement covers it.

**Alternatives considered:**
- Coverage at any-Resolve-Condition granularity.
- Coverage at any-element granularity (Evidence counts).
- RC-only coverage with no Rule union.

**Why per-Concern with Rule union won.** Per-Concern granularity prevents the bundling gaming (one giant RC for the whole problem statement satisfies an any-RC check trivially). Rule union accommodates real-world resolution-side content that is RULE-shaped — preservation ("X stays unchanged"), non-existence ("design-specify is not referenced") — which surfaced in the broader simulation of four prior briefs. Without the union, preservation content gets jammed into Resolve Conditions where the semantics misfit; the brief grammar distorts.

**Designer confidence:** high. Tested against four prior briefs (decision-loop, small-task, optimize-throughput, redesign-convergence-model); the Rule union finding emerged from the broader simulation.

---

### Decision 5 — Sequential ratification (NC-05)

**Settled:** ratification is sequential, per Resolve Condition. Batch ratification refused at the API boundary.

**Alternatives considered:**
- Batch ratification at brief approval time.
- Time-gated ratification (minimum seconds per RC).
- Optional sequential mode.

**Why sequential won.** Gestalt brief approval is the existing failure mode — the designer confirms the whole brief at one yes/no prompt today. Ratification fatigue from gestalt approval reproduces that failure mode in a structured wrapper. PM-altitude attention engagement requires discrete units. Time-gating without engagement is ceremony; an optional sequential mode defaults to batch under gaming pressure.

**Designer confidence:** medium-high. Sequential ratification is the friction trade-off; if PM working preference is light-touch, sequential walk feels like ceremony. The judgment call is that the friction earns its keep against gestalt failure.

---

### Decision 6 — Stale ratification on revision (NC-06)

**Settled:** any revision to `statement` or `problem_anchor` invalidates ratification; closure refuses to count un-revalidated entries.

**Alternatives considered:**
- No stale check.
- Semantic-diff threshold distinguishing substantive from cosmetic revisions.
- Ratification persists across all revisions.

**Why uniform invalidation won.** Without a stale check, the agent edits a ratified RC and the ratification field carries forward to content the PM never saw — bypasses the validation gate by edit. Semantic-diff thresholds are engineer-altitude (PM doesn't reason about diff metrics); uniform invalidation is the simpler PM-readable rule. The proof MCP already has a stale-grounding pattern that adapts directly.

**Designer confidence:** high. The simpler uniform rule landed cleanly after the altitude correction.

---

## Designer Corrections That Shaped the Session

Three corrections produced material reframes:

1. **"Don't focus on problem statement — that is the beginning of solve. Focus on the end of solve."** The session had drifted toward problem-statement well-formedness as the Phase 4a target. Correction reframed Phase 4a's focus to end-of-solve confidence: what does the PM need at handoff to know intent is captured. Hypothesis methodology stayed in cluster A scope but landed as the Concern construct (NC-02), not as standalone problem-statement formalism work.

2. **"Cluster A's mandate is the full design + implementation pipeline."** The session had been treating cluster A as just the design conversation. Correction expanded scope to include the full pipeline (design-specify, plan-build, execute-write); the design conversation produces the brief that feeds downstream.

3. **"The person running the system is not an engineer, it is a product manager."** The largest reframe. Mitigation list had grown engineer-altitude (forward_test, lint, producibility check, semantic-diff threshold) and the designer flagged "huge failure load." Correction collapsed the schema to three PM-readable fields and moved verification mechanics downstream where the spec layer already handles them.

## Understanding Shifts

- **Initial framing:** the failure mode is provenance — agent-imagined acceptance criteria with no upstream source.
- **Mid-session shift:** the failure mode is *confidence on handoff* — the PM can't verify the proof envelope captures intent.
- **Final shift after altitude correction:** the failure mode is altitude mismatch — the proof was carrying engineer-altitude content the PM couldn't ratify, and the spec layer was rendering AC as agent prose because nothing structurally typed reached it from the proof. The fix is altitude-respectful at both ends: PM ratifies intent-shaped Resolve Conditions; spec layer derives engineer-shaped verification from those statements.

## Confidence Levels

- **High:** NC-01 (sixth category), NC-02 (Concern construct), NC-03 (three-field shape — high after altitude correction), NC-04 (per-Concern coverage), NC-06 (uniform stale rule).
- **Medium-high:** NC-05 (sequential ratification — friction trade-off acknowledged).

## What Lessons Fired in This Session

- **Incomplete migration** — the resolution-claim concept already existed as agent-prose AC; cluster A completes the migration to a typed home rather than introducing a new concept.
- **Problem-reframing on rejection** — each designer correction required real reframing, not iteration on the existing direction.
- **Stay focused on the problem being solved** — when the altitude correction landed, the mitigation list trimmed sharply because most mitigations were attached to the wrong-altitude field.
- **Mid-session register correction signals delivery failure** — the forward_test field was a register failure (engineer-altitude in a PM-altitude conversation); altitude correction fixed the register, not the substance.
- **Don't add configuration dials** — minimal-field discipline held; three fields, no priority/severity/ordering.
- **Two NCs as principle-and-result consolidate** — NCON-7 (verification-belongs-downstream) absorbed into NC-03's reasoning under the simplifier challenge.
