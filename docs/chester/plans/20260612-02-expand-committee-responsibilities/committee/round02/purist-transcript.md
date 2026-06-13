# Purist — Round 02 Transcript

## Readdress Prompt

The designer supplied an in-scope observed problem: when committee output feeds design-specify, the spec agent's competing-architecture front half burns tokens re-deriving architecture the committee already settled. The waste is redundant derivation of already-settled architecture. This reframe inverts Round 01's concern: not "is committee absorbing spec-writing" but "is design-specify's front half duplicating committee's terminal output?"

---

## Analysis

### Recasting the duplication

Round 01's CF1 held firm: committee writing a spec = two terminal states = category collapse. That still holds. But the designer's reframe surfaces a *symmetric* category problem: design-specify's front half (competing-architectures, prior-art, architecture selection) performs work whose *output category* — settled architecture — is identical to what the committee's verdict already terminally produced. When both units produce the same kind of output, the duplication is not a gap to fill; it is a structural redundancy baked into the sequencing assumption.

The clean Purist read: design-specify's front half is *conditionally redundant*. It is load-bearing when no prior architecture-settled input exists. It is pure redundant spend when a committee verdict has already terminated with settled architecture.

### Does skipping the front half require committee to emit a spec-precursor?

This is the crux. The designer asked whether removing the redundancy forces the committee to emit something new — a "spec-precursor" — that pressures the two-terminal-states objection.

The Purist answer: no, but only if the interface is drawn precisely. The committee's verdict already names settled decisions, constraints, and chosen direction. That is its terminal output today — it does not need to change shape to serve as design-specify's architecture-selection input. What changes is design-specify's contract: it acquires a conditional entry path.

Two entry paths, one skill:
- **Path A (standard):** no prior committee verdict → run the full front half (competing-architectures, prior-art, architecture selection) → proceed to spec writing + hardening.
- **Path B (committee-settled):** committee verdict provided as input → skip the front half → proceed directly to spec writing + hardening, using the verdict as the architecture foundation.

Under this shape, the committee emits nothing new. Its verdict remains its terminal state. design-specify gains a conditional entry point. No new terminal state is added to either unit. No category collapse.

### Is "conditional entry point in design-specify" a category violation?

No. Adding a conditional entry path to a transformation pipeline is a standard compositional pattern — it changes *when* the transformation starts, not *what* the unit is. design-specify's category remains "transformation and hardening pipeline." The committee's category remains "consultation primitive." The interface between them is a data handoff (verdict → architecture foundation), not a merged unit.

The category violation would occur if: (a) the committee had to emit a spec-precursor in a different format tailored to design-specify's consumption, or (b) design-specify had to run committee-style deliberation internally. Neither is required under Path B.

### What about the hardening passes — does the round 01 H-option still apply?

Yes, and this round's reframe does not disturb it. The A3 gap (non-independent adversarial pass) exists independently of whether the front half ran or was skipped. Under Path B, design-specify still runs fidelity, adversarial, and ground-truth passes. The H-option (committee as adversarial hardening stage) remains a live option for the adversarial pass regardless of which entry path is taken. These are separable decisions:

1. Eliminate front-half redundancy → Path B entry point in design-specify.
2. Fix A3 non-independence → H/M/L options from round 01 still apply.

They do not constrain each other. Both can be adopted, or neither, or one without the other.

### Blocking risk: what prevents clean Path B?

Two risks worth naming:

1. **Verdict format mismatch.** The committee's verdict is written for designer consumption (deliberation summary + recommendation). design-specify's architecture-selection step expects a specific output shape (chosen architecture + axis positions + F-A-C compliance). If the verdict does not cover the F-A-C evidence design-specify needs, Path B produces a spec on an architecture foundation that has not been verified feasible/suitable/complete. Mitigation: the Path B entry contract must specify what a committee verdict must contain to qualify as a valid architecture-settled input. This is a spec-authoring task for the design-specify skill update, not a new committee terminal state.

2. **Exclusion clause collision.** Round 01 already named this: the current exclusion "Do NOT convene when other skill owns planning: design-specify" blocks committee from being called *within* design-specify for the A3 remedy. Path B goes the other direction (design-specify receives committee output, not calls it), so it does not trigger the exclusion. No change to the exclusion is needed for Path B.

---

## Final Position

**position:** The clean shape is a conditional entry point in design-specify — Path B accepts a committee verdict as architecture-settled input and skips the front half. The committee emits nothing new; its verdict was already the settled architecture. design-specify gains a conditional entry contract specifying what a qualifying verdict must cover (F-A-C-equivalent evidence). No new terminal states added to either unit; no category collapse. The A3 adversarial-pass gap is a separable decision — the H/M/L options from round 01 remain live and unaffected.

**rationale:** The duplication is structural, not incidental — design-specify's front half and the committee's terminal output are the same output category (settled architecture). Eliminating redundancy requires only that design-specify acquire a conditional entry path, not that the committee change what it produces. This is the minimum-surface fix: one skill gains a gate, both categories remain intact.

**blocking_risk:** Path B requires design-specify's entry contract to specify what a committee verdict must contain to qualify as a valid architecture-settled input — specifically, F-A-C-equivalent evidence. If that contract is underspecified, Path B admits verdicts that have not verified feasibility/suitability/completeness, and the spec is built on an unverified foundation. This is authoring risk, not structural risk; it is resolved by precisely defining the Path B entry condition in the skill update.

**warrant:**
- type: logic + in-scope designer-premise
- source: designer-supplied observed problem (round 02 prompt): committee output makes design-specify's architecture-selection step produce no useful new work — the waste is redundant re-derivation of already-settled architecture
- source: `skills/design-specify/SKILL.md` § Competing Architectures — the front half is load-bearing only when architecture is unsettled; its stated purpose is to settle what the brief left open
- source: round01/alignment-map.md CF1 — committee writing a spec = category collapse (preserved); the symmetric fix (design-specify skipping already-done work) does not trigger CF1
