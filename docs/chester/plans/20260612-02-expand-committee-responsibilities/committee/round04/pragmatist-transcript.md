# Pragmatist — Round 04 Transcript

## Lens
Cost vs. benefit; simplest sufficient. Operational cost and migration cost are first-class. Shipping complexity counts against a design unless it buys confirmed value.

## Reading the researcher findings

The researcher's Item 4 is the load-bearing fact for my lens. The three hardening passes are NOT a symmetric problem:

- Pass 1 (fidelity subagent) — already architecturally separable today. Subagent dispatch. Needs originating design artifact; degrades gracefully without it.
- Pass 2 (adversarial, inline) — has a real cross-seam coupling. Requires authoring context: architecture choice rationale, prior-art findings, brief intent beyond spec text. This context lives in the authoring agent and does not survive a skill boundary unless explicitly written.
- Pass 3 (ground-truth subagent) — already architecturally separable. Spec + codebase only.

Pass 2 is the only pass with a coupling problem. The other two passes are separable for free.

The researcher also confirms: no existing FAC-complete/incomplete distinction exists anywhere in the skill files. No spec-architect precursor exists. plan-build's prior art for "settle/construct/verify" keeps all three phases inside one skill — it never decomposed them into separate skills.

## Counting the three options

### Option A: 3 skills — spec-architect + spec-write + spec-harden

**What it buys:**
- Clean separation: each entry point calls only the stages it needs
- Committee path: skips spec-architect, calls spec-write + spec-harden
- Small-task path: calls all three

**What it costs:**
- New skill creation: 3 skills × ~1 SKILL.md each = 3 files (replacing design-specify's 1)
- All reference files must be re-homed or copied: spec-template.md, adversarial-spec-review.md, spec-reviewer.md, ground-truth-reviewer.md — 4 reference files, now uncertain ownership (do they live in spec-write? spec-harden? a shared location?)
- The adversarial pass problem: spec-harden is a separate agent from spec-write. The authoring context — which architect option was chosen, prior-art findings, brief intent beyond spec text — is LOST at the spec-write → spec-harden boundary unless explicitly transferred. This requires a new "authoring-notes" artifact written at the end of spec-write and consumed by spec-harden. That artifact's schema is new, its transfer discipline is new, and callers can forget it (Innovator's hard-gate concern applies here too, in reverse: the context-passing step can be skipped).
- 8+ files affected, ~15-20 edit points (my own Round 03 estimate, confirmed by researcher's step-mapping)
- Migration cost: design-specify callers (design-small-task integration, documentation, design-specify references from skill docs) must be updated

**Confirmed callers of spec-harden as standalone (beyond design-specify):** ZERO. The researcher found no callers. The reuse benefit is hypothetical.

**Net assessment Option A:** Pays ~15-20 edit points + authoring-context-transfer mechanism for two confirmed benefits (committee path skip, small-task path keeps working). The authoring-context transfer is not free — it adds a new artifact contract. The reuse benefit for spec-harden is currently speculative.

### Option B: 2 skills — spec-write + spec-harden (architect folded into producers)

This variant means: design-small-task path calls design-specify's existing front half (architect work stays there, not a separate callable skill), and both paths share spec-write and spec-harden.

**Problem with this variant:** It does not eliminate the adversarial cross-seam coupling problem — it still exists between spec-write and spec-harden. And it does not reduce the edit-point count meaningfully compared to Option A (same seam to bridge, same reference-file re-homing, same authoring-context transfer needed). It only removes the spec-architect skill, but spec-architect was the clean part — the architect steps already compose well. The seam cost is in spec-write → spec-harden, which this option does not address.

**Net assessment Option B:** Slightly simpler shape (2 skills vs 3), but does not escape the adversarial seam problem. Not materially cheaper than Option A. Does not earn its complexity reduction.

### Option C: 1 skill — design-specify + Round 02 Path B committee-entry

**What it buys:**
- Zero new skills created
- Zero reference files re-homed
- Adversarial seam problem: does not exist, because the entire chain stays in one authoring agent
- Migration cost: Path B is a conditional entry gate in design-specify — ~2-3 new checklist steps plus the entry-contract definition. Estimate: 3-5 edit points in design-specify SKILL.md.

**What it costs:**
- Committee path must invoke design-specify, a skill named for and designed around the small-task flow
- The committee-entry path is a conditional branch in a skill that otherwise runs the full architecture-settling phase — the "skip architecture" behavior is encoded as branching logic, not structural absence
- The entry-contract definition (what FAC-complete means, what the committee output must carry) must be added to design-specify — but it lives naturally there, as design-specify's guard for when to skip step 3

**Round 03 prior art:** Pragmatist (Round 03) said: "If the designer intends to reverse CF1, the split is the right mechanism and Path B becomes the wrong answer." CF1 was NOT reversed by the designer — the designer's resolution was that CF1 was the wrong question, but the resolution preserves the intent: committee does not author specs. The designer's actual resolution: "architecture-settling is skipped unconditionally for committee-sourced designs; spec process consumes settled architecture; goes to mechanical construction + hardening." That is precisely Path B.

**Net assessment Option C:** ~3-5 edit points. No new seams. Adversarial pass stays intact (same authoring agent). No speculative reuse benefit to justify the structure. Maps directly to the designer's stated resolution.

## The adversarial pass is the deciding factor

The adversarial pass problem is not a risk to manage — it is a confirmed coupling. The researcher's Item 4 quotes the adversarial-spec-review.md rationale directly: it requires knowing which architect option was picked, what prior-art the explorer found, what brief intent is, and what the dispatcher noticed but did not write down. That last item — tacit dispatcher context — cannot be serialized into an artifact. No authoring-notes artifact can capture what the author implicitly knew.

Options A and B both break this coupling and must either accept degraded adversarial review quality or invent a partially-lossy context-transfer mechanism. Option C does not break it.

## The reuse argument does not close

The split only buys concrete value if spec-harden has additional callers beyond design-specify. Currently: zero confirmed callers. The argument is: "someday someone might want to harden a spec without running the full pipeline." That is speculative. The cost is real (adversarial coupling, 15-20 edit points, new artifact contract). Speculative future benefit does not justify present concrete cost.

## The entry-contract requirement is orthogonal to decomposition

Round 02 established (uncontested) that design-specify's Path B entry contract must define the qualifying-verdict condition. That contract requirement is valid regardless of whether the decomposition is 3 skills, 2 skills, or 1 skill. Option C fulfills this by adding the qualifying-verdict definition to design-specify's entry section. Options A/B fulfill it by adding it to spec-architect's input contract. The effort is comparable.

## Position summary

**Option C is the right answer.** Not because decomposition is wrong in principle, but because:

1. The adversarial pass's coupling is real and cannot be fully solved by an authoring-notes artifact — some tacit context is structurally irreducible.
2. Zero confirmed callers for spec-harden as standalone means the reuse benefit is speculative.
3. Options A and B cost ~15-20 edit points for confirmed benefits that Option C delivers at ~3-5 edit points.
4. plan-build's prior art (the only "settle/construct/verify" precedent in Chester) kept all three phases in one skill for one entry point — the difference here (two entry points) is handled by Path B, not by decomposition.
5. The designer's stated resolution — "skip architecture-settling unconditionally for committee-sourced designs" — is a conditional entry gate, not a structural separation.

The minimal decomposition that kills the duplication and serves both paths: a conditional entry gate in design-specify (Path B). That is Option C.

---

## Final Position

**Position:** Option C — conditional Path B entry gate in design-specify, not three-skill decomposition.

**Rationale:** The adversarial pass (Pass 2) has an irreducible authoring-context coupling that cannot survive a skill boundary without quality loss. This is the deciding factor: Options A and B both break this coupling and cost ~15-20 edit points; Option C preserves it and costs ~3-5 edit points. Zero confirmed callers exist for spec-harden as a standalone skill, so the reuse argument is speculative. plan-build's prior art (the only "settle/construct/verify" precedent in Chester) keeps all phases in one skill. The designer's resolution is "skip architecture-settling unconditionally for committee-sourced designs" — that is a conditional gate, not a structural separation. Path B in design-specify is the minimal sufficient answer.

**Blocking risk:** If the adversarial pass's tacit-context dependency is dismissed as solvable via an authoring-notes artifact, Options A/B become competitive. I do not believe it is fully solvable — serializing "what the dispatcher noticed but did not write down" is structurally lossy — but the committee should surface this risk to the designer.

**Warrant:** Researcher Item 4 (adversarial coupling confirmed, passes 1+3 already separable); researcher Item 5c (plan-build prior art: three-phase in one skill); researcher Item 5b (zero existing spec-harden callers); designer ledger resolution ("skip architecture-settling unconditionally"); my Round 03 edit-point estimate (~15-20) upheld by researcher's step-mapping.

<!-- produced-by: pragmatist@round04 -->
