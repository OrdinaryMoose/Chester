# Innovator Transcript — Round 04

## Lens
Push new framings and structural alternatives; treat existing structure as a choice that can be re-made.

## Rehydration Summary
- Round 01: committee should NOT author specs (4-0 CF1); adversarial inline pass is target (4-0 CF2).
- Round 02: design-specify gets conditional Path B skipping its architecture front half for committee-fed designs (4-0 CF3). Innovator pushed B2 (typed spec-precursor from scribe); others held B1 (design-specify reads existing output).
- Round 03: split worth turns on CF1 reversal. Innovator adopted the split; others were oppose-conditional on CF1. Designer rejected the CF1 pivot — the real goal is invariant: settled architecture consumed, never re-derived.
- Resolution: for committee designs, architecture-settling is SKIPPED unconditionally. Who authors = free choice. No gate ceremony.

## Designer's Round 04 Question

Decompose spec writing into two entry points with a shared downstream:
- **design-small-task path:** FAC-INCOMPLETE brief → spec-architect (settles FAC) → spec-write → spec-harden
- **design-committee path:** FAC-COMPLETE verdict → (skip spec-architect) → spec-write → spec-harden

The creative challenge: define the normalized FAC-complete input contract that spec-write consumes from BOTH producers, and solve the adversarial-context seam.

---

## Analysis

### The composition graph I'm proposing

```
design-small-task → [brief: FAC-incomplete]
                          ↓
                    spec-architect       ← settles architecture; emits FAC-bundle
                          ↓
design-committee → [verdict: FAC-complete]
                          ↓
                    spec-write           ← pure function of FAC-bundle → spec document
                          ↓
                    spec-harden          ← three passes (fidelity, adversarial, ground-truth)
```

Two producers, one consumer interface (spec-write). spec-architect is only invoked on the incomplete path; the committee-fed path enters at spec-write directly with its verdict acting as the FAC-bundle. spec-harden is the same callable regardless of which path authored the spec.

### The FAC-complete input contract (the normalized interface)

spec-write should consume exactly one artifact type — a **FAC-bundle** — regardless of which upstream produced it. The FAC-bundle carries:

1. **Goal statement** — what we're building and why (author-neutral)
2. **Architecture field** — the chosen direction, stated explicitly
3. **Rejected alternatives** — named and why rejected (Constraints and Non-Goals derive from these)
4. **Declared sacrifices / failure modes** — the chosen architecture's known costs
5. **Prior-art findings** — relevant existing patterns surfaced during the architecture-settling step
6. **Acceptance criteria seeds** — high-level boundary conditions (may be brief-level ACs or committee-derived commitments)
7. **Authoring notes** (key insight below) — tacit context from the settling process: what the agent noticed but did not formally record, which the adversarial pass needs

Both producers can emit this bundle:
- **spec-architect output:** direct artifact — it ran the parallel-dispatch step, so it has all seven fields from first principles.
- **committee verdict + alignment-map:** satisfies fields 1–6 by existing content (chosen direction + warrant record + guardrails + researcher ground-truth findings). Field 7 (authoring notes) is the only field that requires deliberate committee capture.

### Solving the adversarial-context seam — the key creative move

The researcher confirmed the adversarial pass (Pass 2) requires:
- Which architect option was chosen and its declared sacrifices
- Prior-art findings
- Brief intent beyond what made it into spec text
- Tacit context the authoring agent noticed but didn't write down

In the current monolith, the authoring agent holds all four items in working memory. Across a skill boundary, items 1–3 are recoverable from written artifacts — they're already in fields 1–6 of the FAC-bundle. Item 4 (tacit context) is the unique problem: by definition it is what was noticed but not recorded.

**My proposed solution: the authoring-notes artifact, produced at the end of spec-write.**

spec-write, before closing, writes a short (200–400 word) `authoring-notes.md` alongside the spec:
- What architecture rationale shaped sections that aren't obvious from the spec text
- What prior-art findings were considered but didn't land in the spec
- What brief intent the author read but couldn't encode structurally
- Any seam the author "held" that a fresh reviewer would not reconstruct from the spec alone

spec-harden then reads `authoring-notes.md` as its adversarial pass context, substituting for the inline authoring memory. The adversarial pass becomes a *guided* subagent dispatch rather than a fully inline pass — it has the notes in lieu of the agent's working memory.

**Why this is better than keeping the adversarial pass inline (the current design):**

1. The current inline approach is a coupling anti-pattern disguised as a feature. It works by accident when spec-write and spec-harden happen to run in the same agent context, but it is not a designed contract — it is accidental context retention.
2. Authoring notes force the author to make tacit reasoning explicit. This is a quality improvement, not a workaround: the reasoning that would have lived only in the agent's context now persists and is auditable.
3. spec-harden becomes truly callable by any author (including the committee scribe), not just by the spec-write agent in the same session. This is the structural win that enables the composition graph above.

**Why this is not the "committee's warrant record substitutes" option:**

The committee's warrant record documents deliberation reasoning — why directions were chosen and why alternatives were rejected. It is an excellent F-A-C artifact. But it is not authoring notes: it doesn't capture what spec-write noticed about the spec-template fill that didn't make it into the spec text. These are different artifacts with different roles. Both should be present. The warrant record → FAC-bundle fields 2–4. authoring-notes → Pass 2 adversarial context.

### Does the adversarial pass relocate?

An alternative approach: move the adversarial pass INTO spec-write as its final step, before emitting the spec document to spec-harden. Then spec-harden only needs to run passes 1 and 3 (fidelity + ground-truth), both of which are already subagent dispatches and have no cross-seam coupling problem.

This is architecturally clean: the adversarial pass stays attached to the authoring agent (where context exists), and spec-harden becomes the two-subagent-dispatch skill with no inline components. spec-harden is then purely verification — no authoring-context dependency.

The tradeoff: the adversarial pass in spec-write can only refine the spec within its current authoring window; the user review gate (currently step 8 in design-specify) lives in spec-harden. If the adversarial pass fires after the user gate, it catches more. If it fires before (inside spec-write), it catches less because it hasn't seen late user changes. However, the current design has this same limitation — the adversarial pass (step 6) runs before the user review gate (step 8), so relocating it into spec-write doesn't change the order relative to the user gate.

**My recommended position:** relocate adversarial pass into spec-write (as its final step before emitting the spec), rather than authoring-notes. Simpler, no new artifact type, preserves context without a transfer protocol. The spec-write skill closes by running adversarial inline, then emitting spec + authoring notes (a slimmer artifact now — no need to document tacit reasoning since the pass already ran). spec-harden = fidelity subagent + ground-truth subagent + user review gate.

This is cleaner than authoring-notes as a transfer protocol: the adversarial pass runs in the same agent context where it belongs, and spec-harden is a pure verification callable.

### Why this is structurally superior to Round 02's Path-B-patch-on-a-monolith

Round 02 Path B (4-0 CF3) patches design-specify with a conditional entry that skips steps 2–3 for committee input. It leaves the monolith in place and adds a flag/entry-condition. Problems:

1. **The entry condition is a smell.** A conditional entry that skips half the skill based on input type is a branching structure inside a skill that should be two separate skills. Every "if the input has a settled architecture, skip steps 2–3" call site is a sign the skill has two callers with incompatible preconditions.
2. **The monolith grows.** Path B adds complexity to design-specify's already-dense SKILL.md: entry condition check, bridge artifact or flag, two execution branches, documentation of when step 3 is and isn't invoked.
3. **Future callers hit a hidden branching surface.** A new caller (e.g., a future design-architect-committee producing partial designs) must understand the entry condition and whether its output qualifies. With decomposition, the contract is explicit: any producer that emits a FAC-bundle can call spec-write directly.
4. **spec-harden reuse is impossible.** If hardening lives inside design-specify, any future skill that writes specs (committee, a new design-medium-task, etc.) cannot reuse the hardening chain without either duplicating it or calling design-specify (which re-runs the architecture-settling step they already completed).

Decomposition solves all four: no conditional branching inside a skill; monolith shrinks rather than grows; FAC-bundle is an explicit contract; spec-harden becomes universally callable.

---

## Cross-Committee Notes

**On the committee path specifically:** The FAC-bundle from the committee verdict is immediately available at verdict time. No new artifact is needed IF the verdict + alignment-map carry fields 1–6 above. The committee scribe could emit a FAC-bundle as a formatted artifact at verdict time (my Round 02 B2 position, now generalized). OR spec-write could read the verdict + alignment-map directly and extract the FAC-bundle fields. The latter is more conservative and satisfies the settled premise (who-authors = free choice).

**On the hard-gate concern from Round 03:** spec-write → spec-harden sequencing must be enforced. My recommendation: spec-write's closure step explicitly instructs the caller to invoke spec-harden next, the same way plan-build's close-step says "transition to execute-write." The gate is a convention in the skill's closure, not a technical enforcement.

---

## Final Position

**Position:** Decompose design-specify into three skills along the architect | write | harden seams already implicit in its step sequence. spec-architect (FAC-settling, called only by design-small-task path). spec-write (pure function of a FAC-bundle, called by both paths). spec-harden (two subagent passes + user gate, universally callable). The adversarial pass relocates INTO spec-write as its final step — this preserves authoring context without a transfer protocol and makes spec-harden a clean verification-only callable. The normalized FAC-bundle interface (7 fields: goal, architecture, rejected alternatives, declared sacrifices, prior-art, AC seeds, and authoring notes slimmed because adversarial already ran) is the contract that makes two producers / one consumer work.

**Rationale:** The architect | write | harden seams are already clean in design-specify's step sequence (researcher Item 2). The FAC-bundle is definable from existing committee and brief content. Relocating the adversarial pass into spec-write solves the cross-seam coupling problem cleanly. The result is a composition graph where both entry points converge on a shared spec-write + spec-harden chain — no conditional branching inside any skill, no duplicated hardening, no monolith growth.

**Blocking risk:** spec-write must correctly extract FAC-bundle fields from a committee verdict without a structured extraction protocol — the committee verdict format is narrative, not a typed schema. If the extraction fails silently (spec-write fills the Architecture field incorrectly from a verbose verdict), the spec is wrong from the start and hardening will not catch it (hardening verifies against the spec, not against the design intent). Mitigation: spec-write's entry step for the committee path explicitly reads and quotes back the architecture field before writing any spec sections.

**Warrant:** Researcher Item 2 (architect|write|harden seam already clean). Researcher Item 4 (adversarial pass is the only cross-seam coupling problem; relocating it into spec-write solves it without a new artifact). Researcher Item 5b (no existing precedent for precursor skill — clean opportunity). Researcher Item 3b (committee verdict carries sufficient FAC-bundle fields). Round 03 alignment-map Branch A logic (decomposition enables universal spec-harden reuse, structural win). Round 02 CF3 warrant (conditional entry path = the right goal; decomposition delivers it without branching inside a skill).

<!-- created-at: 2026-06-12 -->
<!-- produced-by: design-committee-innovator -->
