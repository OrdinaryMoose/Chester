# Lens Criteria for FAC Options — Design System Analysis

**File:** `lens-criteria-for-fac-options.md`
**Issued by:** designer
**Issued on:** 2026-05-21
**Audience:** Committee (4 poles + Researcher + Arbiter) for the three-round brainstorming on FAC-compliant design-system options

## What this document is

The criteria the designer has set for evaluating any proposed design-system option. Each lens is a constraint or guideline — not a prescription. Together they define the fitness envelope for any option that survives to designer adjudication.

## The lenses

### 1. Singular purpose

The design system's reason for existence is to produce the three artifacts that the downstream design-specify system needs. The three artifacts are:

- a constraint envelope
- a resolution criterion
- a coverage map

Anything the design system does that does not contribute to producing these three artifacts is overhead. Any option must produce all three reliably.

### 2. Method is open

The method by which the design system produces the three artifacts is open for deliberation. The proof system, the Committee interview, the structured deliberation cycle, the ratification ceremony — none of these are pre-committed. Any architectural shape that produces the three artifacts is a candidate.

### 3. Architectural altitude requirement

The design system plans at the architectural level. It commits to architectural decisions and architectural shapes. It does not commit implementation-level details. Any option must operate at architectural altitude.

### 4. Implementation-determination prohibition

The design system is prohibited from pre-determining implementation-level decisions or options. The downstream specify, plan, and execute phases own implementation. Any option that bleeds implementation choices into the design phase violates this prohibition.

### 5. Proof system is a tool

The proof system is a tool the design system may use. It is not the main thing. It is not load-bearing in any structural sense beyond its instrumental value as a tool. Any option may use the proof system, replace it with another tool, or operate without it.

### 6. Proof system guides, does not constrain

If the proof system is used, it guides the agents toward solving the right problem rather than just any problem. It does not constrain agents into a particular solution shape. Any option that uses the proof system must preserve this guidance-not-constraint property.

### 7. Proof system may be eliminated — IF Vision-compliant

The proof system can be eliminated **only if** there is a viable alternative that meets the Vision design principles. The Vision principles are the binding constraint on any elimination path. They live at `docs/admin/20260521-design-system-analysis/01-vision.md` and are designer-set premises, not pole-deliberation surface.

Load-bearing Vision principles (Section 8 — what does NOT change easily) that any alternative must preserve:

- **Geometric-proof framing.** The system produces a finite, locally-checkable, hierarchically-organized argument leading from given facts to ratified conclusions. Not a prose narrative, not a database, not a checklist.
- **Channeling principle.** The LLM completion drive is treated as a load-bearing property to design around, not a flaw to suppress. The system gives the agent something structural to finish on. This is the singular load-bearing innovation versus prior generations. Designer comment explicit in Vision Section 2: accounting for this is a requirement, not a guideline.
- **Structural/semantic split.** Mechanical checks for structural well-formedness; Designer judgment for semantic content. The system is honest about the gap; it does not claim to verify what the Designer must verify.
- **Two-player asymmetric-authority game.** Agent proposes/revises/withdraws; Designer asserts axioms and ratifies. The asymmetry cannot be collapsed.
- **Closed-set vocabulary discipline.** Element categories, Friction Shapes, Withdrawal Dispositions, Action Labels, Consent Sources — all finite enumerations. Converts open-ended generation into bounded multiple choice (LLMs are good at bounded multiple choice; bad at self-direction).

What the proof system is NOT (Vision Section 3) — any alternative must also not be:

- Not a theorem prover (closure gate ≠ logical entailment)
- Not a code generator (no implementation primitives)
- **Not a deliberation tool for humans.** gIBIS, Compendium, and similar argumentation tools designed for collaborative human deliberation are the explicit anti-precedent. The proof system is designed for an LLM agent's interaction with a human designer; the agent's completion drive does the work humans were never reliably motivated to do.
- Not a closed system (sparse vocabulary; legitimate design moves may not fit)
- Not a single-pass build (multi-round; revisions clear ratification)

Any FAC option that eliminates the proof system must demonstrate it preserves channeling, geometric-proof form, two-player asymmetry, structural/semantic split, and closed-set vocabulary discipline. If an option dissolves any of these, it fails Lens 7 even if it produces the three artifacts.

Elimination is an admissible option per the lens, but the path is narrow.

### 8. Committee is assumed; roles are up for review

The Committee continues as the interview technique. The four pole agents are fixed. The other roles — Researcher, Arbiter, team-lead — are up for review. An option may propose merging, splitting, renaming, or re-scoping any of these non-pole roles. Including: Arbiter becomes a Clerk, or some other repositioning.

### 9. Agents do not check their own work

Self-validation by the entity producing the work is prohibited. Any option that requires an agent to lint, validate, audit, or check its own output violates this lens. External validation only.

### 10. 90/10 budget

The design system spends 90% of its operational time on design planning and 10% or less on admin processing. This replaces the earlier 99/1 framing. Admin processing includes anything that exists because of system mechanics rather than substantive design work.

## How to use these lenses in the brainstorming round

Each FAC option proposed by a pole must be evaluated against all ten lenses. An option that violates any lens is not FAC-compliant. An option that satisfies all ten is a candidate for designer adjudication.

The lenses are not a checklist to satisfy mechanically. They are the shape of the fitness envelope. A good FAC option exhibits all ten lens properties as natural consequences of its architecture, not as bolt-on satisfaction.

## What is NOT under deliberation this round

- That the Committee will be used as the interview technique
- That the four pole agents are fixed
- That the design system has a singular purpose (producing the three artifacts)
- That implementation-level decisions are prohibited

These are designer-set premises. Any FAC option starts from them as foundation, not as variables.
