---
status: Accepted
date: 2026-05-11
deciders: [M]
related_docs: [00-glossary, 01-vision, 02-conops, 03-architecture, 04-engine-spec, 05-domain-spec, 06-interface-spec, 07-migration-plan, 08-test-strategy]
related_adrs: [0003, 0004, 0006, 0007, 0009, 0010, 0011]
---

# ADR-0014: Rename Necessary Condition → Proposition, Resolve Condition → Resolution

## Status

Accepted.

## Context

During a glossary definitions review of `00-glossary.md`, the technical accuracy of two cascade-defining terms was questioned: `NECESSARY_CONDITION (NC)` and `RESOLVE_CONDITION (RC)`.

The review surfaced two observations:

- **"Necessary condition" is technically defensible but stretches the textbook term.** In classical logic, *P is a necessary condition for Q* means *if Q then P* (equivalently, *if not P, then not Q*). The cascade's `collapse_test` field encodes exactly this contrapositive: "what fails if the NC is removed?" So the term is correct *given* that every NC backs its name with a meaningful collapse_test. When collapse_tests are weak or formulaic, the "necessary" claim is unbacked. The textbook alternative — `lemma` — would import formal-proof guarantees the Vision §3.1 explicitly disclaims ("not a theorem prover").

- **"Resolve condition" is not a textbook term at all.** It is a project-specific coining. The Vision §1's geometric-proof analogy calls these "theorems" — but "theorem" imports the same formal-proof connotations "lemma" would. The cascade names instead emphasize the *operational role* (resolving a Concern) over the *structural role* (theorem).

The surface symmetry between "Necessary Condition" and "Resolve Condition" is also misleading: NC is named after a *property* (necessity), RC after a *role* (resolution). They share the "X Condition" surface shape but are not symmetric in their naming logic.

The terminology review explored four candidate replacement pairs:

- **Proposition / Theorem** — full textbook pair. Cost: imports formal-proof guarantees the Vision disclaims.
- **Proposition / Resolution** — proposition is the textbook term for a derived named result; resolution keeps the existing role-named framing for what addresses a Concern.
- **Proposition / Conclusion** — common-language pair; "conclusion" is fuzzier than "resolution."
- **Proposition / Finding** — legal/audit flavor; defensible but unusual in software-design writing.

## Decision

**Rename `NECESSARY_CONDITION (NC)` to `PROPOSITION` and `RESOLVE_CONDITION (RC)` to `RESOLUTION` across the cascade.**

The rename touches every layer of the design-document corpus and the engine vocabulary it references:

- **Element category names:** `NECESSARY_CONDITION` → `PROPOSITION`; `RESOLVE_CONDITION` → `RESOLUTION`.
- **Prose vocabulary:** spell out "Proposition" and "Resolution" in document text. No new abbreviations are introduced; "NC" and "RC" are retired. Single-letter abbreviations (P, R) are not used because P would collide with `PERMISSION`.
- **Element ID prefixes:** `ncon_` → `prop_`; `rcon_` → `reso_`. Keeps the cascade's 4-character-prefix convention (`evid_`, `rule_`, `perm_`, `cern_`).
- **Engine predicate names** (where used in design-document examples): `ncon(...)` → `proposition(...)`; `rcon(...)` → `resolution(...)`; `ncon_grounds` → `proposition_grounds`; `ungrounded_ncon` → `ungrounded_proposition`.

## Rationale

- **Proposition is textbook-correct for the NC role.** Standard math/logic literature uses "proposition" for a derived named result. It is structurally interchangeable with "lemma" but slightly more dignified — a proposition stands on its own as a worthwhile result, whereas a lemma is explicitly a stepping stone. The cascade's NCs are not pure stepping stones; many stand alone as significant design claims, so "proposition" fits better than "lemma."
- **Resolution keeps the operational framing the project intentionally adopted.** The Vision and ConOps repeatedly use the verb "resolve" to describe what RCs do to Concerns. Keeping "Resolution" as the noun preserves that vocabulary continuity. A reader who already knows the system reads "the Proposition grounds the Resolution" and recognizes the structure immediately.
- **Avoids importing formal-proof guarantees the Vision disclaims.** "Theorem" would map RC to a textbook concept that carries strong formal-system connotations (Coq, Lean, Isabelle). The Vision §3.1 explicitly disclaims those expectations. Using "Resolution" instead keeps the system's discipline visible at the vocabulary layer.
- **Avoids homonym risk of "lemma."** "Lemma" in linguistics means the canonical form of a word (e.g., "go" is the lemma for "goes, went, going"). For non-mathematician readers — including software engineers without proof-theory background — the linguistic meaning often surfaces first. "Proposition" has no comparable homonym.
- **Removes the misleading "X Condition" surface symmetry.** Under the rename, the two terms are named on different principles (one structural, one functional) — and the names *show* that, making the asymmetry honest rather than hidden behind matching suffixes.

## Consequences

**Positive:**
- Cascade vocabulary is more legible to math-literate readers without requiring them to learn the project's "necessary condition" framing.
- The rename removes the unbacked contrapositive promise that "necessary condition" carries when collapse_tests are weak.
- The structural-vs-functional naming asymmetry (Proposition is what kind, Resolution is what role) is now visible at the term layer rather than hidden behind matching suffixes.
- No formal-proof guarantee is imported by the new names; the Vision's disclaimer at §3.1 remains coherent with the vocabulary.

**Negative:**
- Wide-ranging textual edit across all design-documents and ADRs. The rename touches roughly 140 instances of NC and 64 of RC across 16 files, plus ID-prefix and predicate-name updates.
- Existing ADRs are edited for vocabulary consistency rather than left in their original wording. This bends the usual ADR-immutability convention. Justified because the cascade is still in draft state and downstream readability matters more than preserving original-text exactness; the decision history is preserved by this ADR (0014) itself.
- Anyone who has internalized "NC" and "RC" as the shorthand will go through a brief vocabulary-relearning period.

**Neutral:**
- The Engine itself is unaffected. Predicate names are a Domain-layer choice; renaming `ncon` → `proposition` in design-document examples does not change the Engine's contract.

## Alternatives considered

- **Proposition / Theorem (full textbook pair).** Most-recognized to a math-literate reader. Rejected because "theorem" imports formal-system guarantees the Vision explicitly disclaims, and using it for RCs would invite exactly the wrong reader expectation that this system is theorem-prover-grade.
- **Proposition / Conclusion.** Common-language alternative. Rejected because "conclusion" has too many natural-language meanings (end of something, an inference, a judgment) and is fuzzier than "resolution" for the cascade's specific RC role.
- **Proposition / Finding.** Legal/audit-flavor alternative. Considered defensible but unusual in software-design writing; the connotation shift (audit → engineering design) would surprise more readers than it would help.
- **Keep NC and RC as-is.** The status quo. Rejected because "necessary condition" stretches the textbook term and "resolve condition" is non-standard; both could be replaced with cleaner alternatives at modest cost.
- **Rename only NC, not RC** (e.g., NC → Proposition; RC stays "Resolve Condition"). Rejected because the surface symmetry of "X Condition" is precisely what made the original pair misleading — keeping half preserves the trap.

## What would change the decision

This ADR should be revisited if:

1. A consumer of the cascade vocabulary surfaces a strong textbook expectation that requires `Theorem` rather than `Resolution` for RCs (e.g., integration with a formal-methods tool that names its results "theorems").
2. The Domain Spec evolves to surface inferential roles that "proposition" no longer captures cleanly (e.g., a sub-category of propositions that genuinely are conjectural rather than asserted-and-grounded).

## References

- ADR-0003 (Approval as engine body literal — uses NC/RC vocabulary in the original)
- ADR-0004 (Typed citations via predicate signatures — heavy NC usage)
- ADR-0006 (Rendered proof format — uses ncon_/rcon_ ID prefixes in examples)
- ADR-0007 (Forward-solve paradigm — uses NC/RC as core entities)
- ADR-0010, ADR-0011 (Lane membership — heavy NC usage in derivation rules)
- Vision §1 (geometric-proof analogy and structural-vs-semantic gap)
- Glossary §"Element categories" (the canonical category names being renamed)
