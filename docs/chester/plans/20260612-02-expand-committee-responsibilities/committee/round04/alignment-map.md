# Alignment Map — Round 04

## Question
Decompose the specification system to serve both entry points — design-small-task (FAC-incomplete) and design-committee (FAC-complete) — without duplicating architecture work; evaluate the spec-architect / spec-write / spec-harden cut and any stronger variation.

## Answer shape
**Preserved 2-2 split resolving to one designer value-judgment (structural investment vs minimal-sufficient), over a 4-0 converged constraint, with the deciding pivot clarified and a reconciliation pathway named.** The "how many skills" count is not the finding.

## Converged constraint (4-0) — CC1
Two things all four affirm:
- Architecture-settling is skipped for the committee (FAC-complete) path — no re-derivation. (Carries Round 02 CF3 + the designer resolution.)
- The adversarial spec-review pass has a real authoring-context coupling: it currently works because spec-write and adversarial run in one agent context. Any design must honor that context — it cannot be ignored.
- Warrant (evidence, verified): researcher Item 4 (adversarial is the only pass with cross-seam coupling; passes 1 fidelity + 3 ground-truth are already subagent-separable). All four cite it.

## The real pivot (what the 2-2 actually turns on)
Not "1 skill or 3." The pivot is: **can the adversarial coupling be honored under decomposition?** Three resolution moves surfaced. Two share one principle — *never let the adversarial pass cross a skill boundary*:
- **Monolith (Path B):** keep design-specify whole; adversarial never crosses a boundary because there is no boundary. (Conservator, Pragmatist)
- **Relocate-into-write:** decompose, but move the adversarial pass to be the final step of spec-write, so it stays with authoring and never crosses a boundary; spec-harden becomes fidelity+ground-truth only. (Innovator)
- **Serialize-across-boundary:** decompose; adversarial stays in spec-harden, fed an authoring-notes artifact spec-write must emit. (Purist)
Only the third makes the pass cross a boundary. **Pragmatist's blocking objection — "I do not believe it is fully solvable" — is explicitly about serializing tacit context (the third move), not the second.** (Verified: Pragmatist Final Position names the authoring-notes-artifact path as the thing he distrusts; he does not address relocation.) Innovator's relocation sidesteps the precise failure the 1-skill camp fears.

## Preserved split — the two skill-count options

### Option 1S — One skill: design-specify + Path B conditional entry. Conservator, Pragmatist defend.
A dispatch-mode flag at invocation; FAC-complete input skips architecture-settling, FAC-incomplete runs it. Adversarial stays inline. No new skills.
- Advantage: ~3-5 edit points; preserves the proven hardening chain exactly; honors the adversarial coupling for free; zero confirmed second caller for a standalone spec-harden, so reuse value is speculative today.
- Disadvantage: the conditional lives inside one skill (a branch, not a clean per-path shape); no reusable spec-write / spec-harden pieces; design-specify keeps growing.
- Warrant (evidence, verified): researcher Item 5c (plan-build prior art = three-phase in one skill); Item 5b (zero spec-harden callers); Round 02 CF3 (Path B converged 4-0); Pragmatist edit-point count.

### Option 3S — Three skills: spec-architect → spec-write → spec-harden. Innovator, Purist defend.
spec-architect = FAC-settling precursor (user-selection gate, parallel dispatch, F-A-C checks), called only by the small-task path. spec-write = constructive authoring, pure function of a FAC-complete design, called by both paths. spec-harden = verification callable. "FAC-complete design" is a defined shared TYPE with two interchangeable producers (committee verdict; spec-architect output), once the spec-template's Architecture field is made author-agnostic.
- Advantage: each entry point is structurally transparent about what it is (Purist); no conditional branching inside any skill; spec-write + spec-harden become universal reusable pieces; the committee path simply never invokes spec-architect (no-duplication is structural, not a gate).
- Disadvantage: ~15-20 edit points; migration of every design-specify caller; needs the adversarial-coupling resolution (relocate or serialize) to ship without regression.
- Warrant (logic + evidence, verified): Purist (settle/construct/verify are genuinely distinct categories — distinct invariants, failure modes, agent profiles; the user-selection gate is present on one path / absent on the other, which is why this decomposes where plan-build did not); Innovator (seam already clean, researcher Item 2; FAC-bundle definable, Item 3b); researcher Item 5b (no precursor skill exists — clean opportunity).

### Intra-3S note: which adversarial resolution if decomposing
If Option 3S is chosen, Innovator's relocate-into-write is the stronger variant over Purist's serialize-artifact: it dissolves the coupling instead of transmitting it, and it answers the 1-skill camp's only real objection. Purist's authoring-notes artifact is the fallback if relocation is judged to change the adversarial pass's proven behavior. Both 3S members agree on the decomposition; they differ only here.

## Designer value-judgment required
The split is warranted both sides and does not collapse on count. Both options honor CC1 (the adversarial constraint is satisfiable either way). The choice is an investment judgment:
- **Minimal-sufficient (1S / Path B):** cheapest, proven, solves the stated duplication now; no reusable pieces.
- **Structural (3S, adversarial relocated into write):** more surface now, but clean per-path transparency and reusable spec-write/spec-harden; pays off if a second consumer of hardening ever appears.
Pointed question each side raises at the other: 1S asks 3S — "who is the second caller that justifies 15-20 edit points today?" 3S asks 1S — "is a conditional flag inside a growing monolith the shape you want to maintain, when the seam is already clean?"
