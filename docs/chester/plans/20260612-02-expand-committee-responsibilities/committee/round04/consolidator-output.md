# Consolidator output — round 04

## Alignment

Skill count:
- 1 skill (Path B conditional entry in design-specify): Conservator, Pragmatist (2)
- 3 skills (spec-architect → spec-write → spec-harden): Innovator, Purist (2)

Axis breakdown:

(a) How many skills?
- 1 skill: Conservator, Pragmatist
- 3 skills: Innovator, Purist
- 2 skills: nobody

(b) Is "FAC-complete design" a defined shared input contract with two producers?
- Yes, explicitly defined: Innovator (7-field FAC-bundle), Purist (author-agnostic Architecture field + semantic equivalence of committee verdict and spec-architect output)
- Yes, implicitly defined as a conditional gate in design-specify: Conservator (entry-condition distinguishes FAC-complete vs FAC-incomplete), Pragmatist (qualifying-verdict definition added to design-specify entry section)

(c) Where does the adversarial pass live?
- Stays inline in spec-write (same skill as write, relocated into spec-write as its final step): Innovator
- Stays inline in design-specify (monolith, no boundary): Conservator, Pragmatist
- Remains in spec-harden but receives an explicit authoring-notes artifact from spec-write: Purist

(d) Does spec-write become a pure function of FAC-complete input?
- Yes: Innovator ("spec-write (pure function of a FAC-bundle, called by both paths)")
- Yes, in category: Purist (spec-write is constructive/authorial, settled architecture consumed, single authoring agent)
- Not applicable (no spec-write skill): Conservator, Pragmatist

Convergence: All four members agree the adversarial pass has a real cross-seam coupling problem that cannot be ignored. All four agree architecture-settling must be skipped for the committee-fed path.

Divergence: Conservator and Pragmatist hold that the coupling is irreducible and the monolith must be preserved. Innovator and Purist hold that the coupling is resolvable — Innovator by relocating the adversarial pass into spec-write, Purist by requiring an authoring-notes artifact from spec-write consumed by spec-harden.

## Per-member summary

- Conservator: Oppose decomposition into separate skills; support Path B (conditional entry inside design-specify with a dispatch-mode flag) that skips architecture-settling for FAC-complete input and preserves the adversarial pass inline.
- Innovator: Decompose into three skills (spec-architect → spec-write → spec-harden) with the adversarial pass relocated into spec-write as its final step, making spec-harden a clean two-subagent verification callable and spec-write a pure function of a 7-field FAC-bundle.
- Pragmatist: Option C — conditional Path B entry gate in design-specify, not three-skill decomposition, because the adversarial pass coupling is irreducible, zero confirmed callers exist for spec-harden as standalone, and Path B costs ~3-5 edit points versus ~15-20 for decomposition.
- Purist: Three-skill decomposition (spec-architect → spec-write → spec-harden) is categorically sound; adversarial pass stays in spec-harden but spec-write's output contract must expand to two artifacts (spec document + authoring notes), with authoring notes as a blocking requirement.

## Notable quotes

- Conservator: "The adversarial pass must remain inline in the same dispatcher invocation as spec-write. Extracting it into a separate skill loses the tacit authoring context."
- Innovator: "The current inline approach is a coupling anti-pattern disguised as a feature. It works by accident when spec-write and spec-harden happen to run in the same agent context, but it is not a designed contract — it is accidental context retention."
- Pragmatist: "serializing 'what the dispatcher noticed but did not write down' is structurally lossy — but the committee should surface this risk to the designer."
- Purist: "The coupling problem is a CONTRACT gap, not a CATEGORY misclassification. The adversarial pass currently receives its required context implicitly (held in the authoring agent's context window). When spec-write and spec-harden are separate skills, that implicit channel is severed."
