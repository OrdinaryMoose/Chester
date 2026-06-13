# Purist — Round 04 Transcript

## The Design Question

Decompose the specification system to serve two entry points — design-small-task (FAC-incomplete) and design-committee (FAC-complete) — without duplicating architecture work. Candidate decomposition: spec-architect (FAC-settling precursor, used only by the incomplete path) → spec-write (writes spec from FAC-complete input only) → spec-harden (three hardening passes). The design is a process question, not an ownership question. Architecture-settling skipped for committee designs, no qualifying gate, who-authors = free choice.

---

## Analysis

### Are spec-architect, spec-write, and spec-harden three genuinely distinct categories?

The Purist test: distinct categories have different input contracts, different output types, different operational invariants, and different natural ownership. Combining them does not produce a coherent unit — it merely co-locates separate jobs.

**spec-architect (FAC-settling):**
- Input: FAC-incomplete design (brief with Key Decisions but no architecture field, no F-A-C evidence)
- Output: a settled architecture artifact — the chosen direction with F-A-C basis (feasibility, suitability, completeness evidence), declared sacrifices, named alternatives rejected
- Operational invariant: exploration and selection — generates a solution space, evaluates it, collapses to one direction with evidence. Fails by missing a viable option or selecting on inadequate evidence.
- Agent profile: three parallel dispatches (Architect A, Architect B, prior-art explorer) plus a dispatcher that synthesizes and presents a user-facing choice. The user must select.

**spec-write (construction):**
- Input: settled architecture (FAC-complete source — either spec-architect output or committee verdict) + design artifact (brief or verdict+alignment-map)
- Output: a populated spec document (all sections filled per spec-template)
- Operational invariant: synthesis and authorship — translates settled decisions into structured spec text. Fails by omitting sections, mis-translating decisions into spec language, or leaving fields that depend on architecture blank.
- Agent profile: a single authoring agent working from a complete decision set. No exploration, no alternatives, no user selection gate — the architecture is already fixed.

**spec-harden (verification):**
- Input: a written spec document + codebase access + design artifact (for fidelity pass)
- Output: the same spec document, corrected and reviewed (same type, different state)
- Operational invariant: verification against external standards — brief intent (fidelity pass), adversarial challenges (adversarial pass), codebase reality (ground-truth pass). Fails by missing a discrepancy between spec and its reference points.
- Agent profile: three independent review agents, each testing a different axis.

**Category verdict:** spec-architect and spec-write are genuinely distinct. spec-architect is exploratory/selectional; spec-write is constructive/authorial. They have different failure modes (wrong architecture selected vs. correct architecture mis-translated into spec text), different agent profiles (parallel dispatch + user selection vs. single authoring agent), and different natural outputs (settled architecture decision vs. spec document). spec-write and spec-harden share the same output type (spec document) but operate on genuinely different invariants: construction vs. verification. This distinction was validated in Round 03 and holds here.

So: yes, three distinct categories.

### Does the two-entry-point requirement justify the three-skill decomposition that plan-build did not use?

This is the sharpest question. plan-build has the same settle/construct/verify shape and keeps it in one skill. Why does the spec system need three skills?

plan-build's settle phase is non-interactive beyond reading the spec. It explores the codebase and maps file structure, but the plan's "architecture" — the spec — is given as input. There is no user-facing decision gate inside plan-build's settle phase. The settle phase is deterministic from its inputs.

spec-architect's settle phase is different in kind: it requires a user decision. The user picks an architecture after seeing three competing proposals. This user-gate is not a refinement of a pre-determined answer; it is a genuine branch point where two different inputs produce categorically different spec contents downstream. The user's choice is the output — not a reading or a check.

This user-gate is why the two-entry-point design forces the decomposition. The FAC-complete path (committee) has NO user-gate because the architecture is already settled. The FAC-incomplete path (design-small-task) MUST have the user-gate. A single skill that serves both paths must either:
- Unconditionally run the user-gate (which is the existing design-specify behavior, and exactly the token-waste problem)
- Conditionally skip the user-gate (which is Round 02's Path B — a conditional inside one skill)
- Separate the user-gate into its own skill (spec-architect) that the FAC-incomplete path calls and the FAC-complete path skips entirely

The third option is what the candidate decomposition proposes. It is justified where plan-build's single-skill settle phase is not, because plan-build's settle has no user-gate and no alternative dispatch — it is not a branch point between two categorically different operational paths.

**Verdict: the two-entry-point requirement justifies the decomposition.** The presence of a user-selection gate that is unconditionally required on one path and unconditionally absent on the other is precisely the kind of structural difference that warrants separate skills rather than a conditional inside one skill. Round 02's Path B (conditional gate inside design-specify) is valid but less clean: it adds a branching condition to a skill that now internally knows about both FAC states, rather than letting each entry point be transparent about what it is.

### Is "FAC-complete design" a clean TYPE that spec-write consumes, with two interchangeable producers?

The researcher's findings establish that both producers supply the same semantic content:

- Committee verdict: chosen direction (= Architecture field), warrant records (= rationale for architectural decisions), guardrails (= Constraints), rejected alternatives (= Non-Goals), researcher ground-truth findings (= input to Components and Data Flow)
- spec-architect output: chosen architecture (user-selected from Architect A/B/prior-art synthesis), declared sacrifices (= Constraints), named rejected options (= Non-Goals), prior-art findings (= input to Components and reuse notes)

Both outputs supply: an architecture decision with F-A-C basis, constraint declarations, non-goal declarations, and prior-art context. The semantic content is equivalent. The difference is production mechanism — committee deliberation vs. parallel dispatch + user selection — but the output shape is the same.

**The shared type contract is real.** spec-write can consume either producer's output via the same input contract. The spec-template's Architecture field needs the revision I flagged in Round 03: the current label `{architecture chosen from design-specify hybrid}` encodes the production mechanism, not the semantic type. It must be `{settled architecture with F-A-C basis, author-agnostic}`. That revision makes the type genuinely shared.

### Does the adversarial pass's authoring-context coupling mean the write|harden seam is drawn in the wrong place?

This is the hardest category question. The adversarial pass (pass 2 of spec-harden) requires:
- The architecture choice rationale and its declared sacrifices
- Prior-art findings from the prior-art explorer
- The brief's intent beyond what made it into the spec text
- The dispatcher's tacit context about the authoring process

Conservator (Round 03) correctly identified this as a cross-seam coupling problem. The researcher's findings confirm it: "the adversarial pass as currently defined cannot be run independently of the authoring agent unless the authoring context is explicitly transferred."

Does this mean adversarial belongs with spec-write (construction), making the true cut between spec-architect|spec-write+adversarial and spec-harden=fidelity+ground-truth?

**The Purist answer: no — but the contract must be made explicit.**

The adversarial pass is a verificational act, not a constructive one. It does not add new spec text by authorial synthesis; it challenges existing spec text against external standards. Its operational invariant is verification, not construction. Category membership is determined by operational invariant, not by the mechanism of data transfer.

The coupling problem is a CONTRACT gap, not a CATEGORY misclassification. The adversarial pass currently receives its required context implicitly (held in the authoring agent's context window). When spec-write and spec-harden are separate skills, that implicit channel is severed. The solution is to make the context explicit: spec-write produces an "authoring notes" artifact alongside the spec document. This artifact carries: architecture choice made + rationale, declared sacrifices, prior-art summary, and any authoring-time observations the dispatcher noticed. spec-harden's adversarial pass consumes this artifact as an explicit input.

This means: spec-write's output contract expands from one artifact (spec document) to two (spec document + authoring notes). The authoring notes are not additional spec content — they are provenance metadata about the authoring process. This is a contract addition, not a category fusion.

The adversarial pass remains in spec-harden. The write|harden seam is drawn correctly. The coupling problem is resolved by explicit artifact rather than by moving the adversarial pass into spec-write.

**This is the blocking condition.** If spec-write does not emit authoring notes, the adversarial pass degrades silently — it runs but with impoverished context, which is worse than failing visibly. The contract must require the authoring notes artifact; it cannot be optional.

### Is there a category integrity risk in spec-harden being called without spec-write?

The decomposition allows any caller to invoke spec-harden directly on a spec that was not produced by spec-write (e.g., a manually authored spec). This is the Round 03 "hard-gate hardening" concern Innovator raised: any spec-build caller can forget spec-harden.

For spec-harden, the risk is inverted: spec-harden can be called with an authoring-notes artifact from a manual author who didn't use spec-write, and those notes may be of lower quality. This is not a category integrity problem — it is a quality-of-inputs problem. spec-harden's operational invariant (verify the spec against external standards) holds regardless of who authored the spec. The fidelity pass degrades gracefully (to internal-consistency only) if no originating design artifact is provided. The ground-truth pass is fully independent.

The only fragility is adversarial pass quality, which depends on authoring notes quality. The contract must require authoring notes; what happens when those notes are sparse is a quality concern, not a category violation.

---

## Final Position

**position:** The three-skill decomposition (spec-architect → spec-write → spec-harden) is categorically sound. The three categories are genuinely distinct: spec-architect is selectional (user-gate required, parallel dispatch, F-A-C evaluation), spec-write is constructive (single authoring agent, settled architecture consumed), spec-harden is verificational (three review passes, external-standard checking). The decomposition is justified where plan-build's single-skill shape is not: the user-selection gate is structurally absent on the FAC-complete path and unconditionally present on the FAC-incomplete path, making a conditional inside one skill (Path B) a weaker solution than structural separation. FAC-complete design is a clean TYPE that both committee verdicts and spec-architect outputs can satisfy interchangeably — the shared contract is real once the spec-template's Architecture field is made author-agnostic. The write|harden seam is correctly placed, but the adversarial pass's implicit context dependency must be resolved by making spec-write's output a two-artifact contract: spec document + authoring notes. If spec-write does not emit authoring notes, the adversarial pass degrades silently; this is a blocking requirement for the decomposition to hold at current quality levels.

**rationale:** Three categories are justified when they have different operational invariants, different failure modes, and different agent profiles — and when the two-path requirement maps cleanly onto the structural difference between paths. Here, spec-architect's user-selection gate is the pivot: it is the feature that must be present on one path and absent on the other. Structural separation is cleaner than a conditional gate because it lets each entry point be transparent about what it is. The adversarial pass coupling is a contract gap, not a category misclassification — the adversarial pass remains a verificational act; its context dependency must be served by explicit artifact.

**blocking_risk:** The adversarial pass's implicit context dependency is the only blocking risk. If spec-write emits spec document only (no authoring notes), spec-harden's adversarial pass runs with degraded context and the decomposition introduces a silent quality regression relative to the current monolithic design-specify. This must be resolved as a required artifact in spec-write's output contract before the decomposition is safe to ship.

**warrant:**
- type: logic
- source: researcher-findings.md §Item 4 — adversarial pass requires authoring context "held inline by the authoring agent"; cross-seam coupling is the only pass with this property; passes 1 and 3 are already architecturally separable
- source: researcher-findings.md §Item 5c — plan-build's settle phase has no user-gate, which is why its single-skill shape is not a counter-argument to this decomposition's three-skill shape
- source: researcher-findings.md §Item 3a/3b — FAC-complete type is semantically equivalent between committee verdicts and spec-architect outputs (chosen direction + F-A-C basis + constraints + non-goals + prior-art); the shared contract is real
- source: round03/purist-transcript.md — construction vs. verification distinction (different operational invariants, different failure modes) already validated; holds in Round 04
- source: round03/alignment-map.md §Conditions IF the split proceeds — adversarial cross-seam coupling named as load-bearing guardrail; this round resolves it via authoring notes artifact rather than collapsing it into spec-write
