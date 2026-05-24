# Designer Guidance — Q1/Q2 Adjudication for Round 3

**File:** `designer-q1-q2-guidance.md`
**Issued by:** designer
**Issued on:** 2026-05-21
**Audience:** Committee, Round 3 dispatch

## Q1 — Does geometric-proof form require derivation?

**Designer adjudication: NO.**

Vision Section 1's organizing principle is "a design language" — interpreted as some form of schema that the agents or Clerk operate with so that prose, definitions, and altitude do not degrade over time. This complies with Section 2 channeling. The design system does NOT have to form a geometric proof with a derivation.

What this means structurally:

- Family 2 (engine eliminated, typed fields as design language) is reopened as Vision-compliant if the typed fields function as a design language that prevents drift.
- Forward-chaining Datalog derivation is not a Vision requirement.
- Grounding chains, Proposition-to-Resolution derivation, closure-gate evaluation as Datalog query — none of these are mandatory.
- What IS required: typed schema that prevents prose, definition, and altitude degradation; channeling compliance per Section 2; the original requirements (below) preserved.

## Q2 — Is rejected_alternatives load-bearing for designer-side cheap-path transparency?

**Designer adjudication: implicit — not load-bearing as a hard requirement.**

The designer's restated original requirements take precedence. If a design language schema satisfies the requirements without rejected_alternatives, the option is FAC-compliant. Cheap-path transparency at the designer surface is a desirable property, not a hard gate.

## Original requirements (designer restatement)

Reiterated by designer for Round 3 clarity. Every FAC option must satisfy ALL of these:

- **Singular purpose.** Produce the three artifacts needed by the design-specify system (constraint envelope, resolution criterion, coverage map).
- **Method is open.** The method by which the design system accomplishes this purpose is open for deliberation.
- **Architectural altitude.** The design system plans at the architectural level.
- **Implementation prohibition.** Do not pre-determine implementation-level decisions or options.
- **Proof system is a tool.** Not the main thing.
- **Proof system guides, does not constrain.** Helps solve the right problem, not just any problem.
- **Proof system may be eliminated.** If a viable alternative meets the Vision design principles (now clarified to mean design-language schema preventing drift, not necessarily geometric-proof derivation).
- **Committee is assumed.** Four pole agents fixed. Other roles up for review (Arbiter → Clerk, etc.).
- **Agents do not check their own work.** External validation only.
- **90/10 budget.** 90% design planning, 10% admin processing.

## Implications for surviving R2 options

With Q1 resolution applied:

**Family 1 (engine retained, derivation present)**

- C1 (Lean Proof) — still Vision-compliant. Heavier than necessary if Family 2 also satisfies "design language" requirement.
- Innovator F (Arbiter → Scribe-Clerk) — still Vision-compliant. Most conservative path.
- Purist P-3R (Turn-Scoped Commitment) — still Vision-compliant.

**Family 2 (engine eliminated, typed fields as design language)**

Reopened as Vision-compliant. The differentiator becomes field-shape rigor, not architectural family.

- Pragmatist D (Channeled Single-Layer Record) — tightest field shapes (body as IF/THEN, collapse_test as IF NOT/THEN contrapositive, grounding as Evidence ID citations). Purist confirmed channeling compliance after field-shape clarification.
- Conservator C4 (Typed Register without engine) — weaker field shapes than Pragmatist D as currently specified. Needs revision to match Pragmatist D's enforcement rigor to be Family 2 leader.
- Innovator D (bounded-enum three-field paragraphs) — bounded enumerations needed at field-spec level. Needs revision to match Pragmatist D's shape rigor.

**Family 3 (scope reduction modifiers)**

- Innovator E (Axiom-Anchored Lightweight Proof) — designer pre-asserts axioms per Concern; agent argues delta only. Vision-compliant. Composes with Family 1 or Family 2 options.
- Innovator C (Constraint-First Inversion) — designer authors constraint envelope pre-deliberation; remaining surfaces produced by Committee. Vision-compliant if residual mechanism is Family 1 or Family 2.

## What this means for Round 3

The decision space simplifies to two orthogonal axes:

- **Axis 1 — Engine retention level:** Family 1 (full engine + derivation) or Family 2 (engine eliminated + design-language schema)
- **Axis 2 — Scope reduction modifier (optional):** none / axiom-anchoring / constraint-first inversion

The "does geometric-proof form require derivation" question is closed; both families are Vision-compliant. Round 3 should produce final FAC options consolidated along these axes for designer adjudication.
