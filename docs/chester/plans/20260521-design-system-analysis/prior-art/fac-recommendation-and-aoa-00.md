# FAC Recommendation and Analysis of Alternatives

**File:** `fac-recommendation-and-aoa-00.md`
**Issued by:** team-lead, on behalf of the design-system-analysis Committee
**Issued on:** 2026-05-21
**Decision tier:** designer adjudication
**Companion documents:**
- `01-vision.md` (designer-authored, binding)
- `lens-criteria-for-fac-options.md` (designer-set ten lenses + Vision-binding Lens 7)
- `designer-q1-q2-guidance.md` (Q1 ruling: design-language schema satisfies Vision Sec 1; derivation not required)
- `proof-system-origin-research.md` (counterfactual analysis and channeling-spectrum precedents)
- `proof-system-engine-recommendations.md` (engine-change candidates EC-001..EC-007, future sprint scope)
- `committee-99-1-feasibility-returns-*.md` (prior deliberation context)

## Executive Summary

The Committee recommends **adopting the Channeled Single-Layer Schema with Designer Axiom-Anchoring** (Pragmatist D + Innovator E composite) as the design system's architecture going forward. Three of four poles converge on this option. Conservator stays neutral between this option and the engine-retained alternative; no pole opposes the recommendation.

The recommendation eliminates the current proof engine, replaces it with a tight typed-field schema that functions as a design language preventing prose, definition, and altitude drift, and adds a designer-axiom-assertion step at the start of each Concern that narrows the agent's argument surface. A Clerk role (replacing the current Arbiter) handles all administrative mechanics in bounded post-round passes. The four pole roles are unchanged.

The recommendation satisfies all ten of the designer's stated original requirements **without dependency on a future Chester engine sprint**. The 90/10 admin/design budget is achievable today, not conditionally on EC-001+EC-002 landing. The Vision design principles per Q1 ruling are preserved through the typed schema's channeling discipline.

The recommendation carries one accepted structural cost: loss of cascade invalidation on revision. This regression concentrates at the designer's ratification surface, which is the correct placement per Vision Sec 4.

## Background

The current proof system, evolved through five generations of LLM-design-tooling refinement, has accumulated administrative overhead that inverts the design system's time budget — admin processing has become the dominant wall-clock consumer rather than substantive design deliberation. Recent design sessions (NCON-1 through NCON-6) ran at approximately 30/70 or worse admin/design ratios, with the 99/1 feasibility deliberation surfacing that the implementable-now ceiling without engine changes sits at approximately 80/20 to 85/15.

Following that deliberation and the designer's review of the proof-system-origin research, NCON-6 was suspended and a meta-architectural analysis session was opened to determine what should replace, restructure, or preserve the current design system. The session ran three rounds of Committee brainstorming and Vision-compliance cross-checking. This document is the consolidation output.

## Decision Context

The designer set ten lens criteria as the fitness envelope. Lens 7 explicitly admits elimination of the proof system IF a viable alternative satisfies the Vision design principles. The Vision document Section 1 originally appeared to require a geometric-proof derivation form (forward-chaining Datalog, Proposition-to-Resolution chains, closure-gate evaluation). Designer Q1 ruling clarified that Section 1's "design language" organizing principle is satisfied by typed schema preventing drift — derivation is NOT required.

This ruling materially expanded the option space. Family 1 (proof engine retained) and Family 2 (proof engine eliminated, typed schema substituted) are both Vision-compliant under the Q1 reading. The remaining choice is between them on grounds of original requirements, operational cost, and structural risk.

The Committee's four poles (Conservator, Innovator, Pragmatist, Purist) plus Researcher and Arbiter as support roles ran three deliberation rounds. Thirteen FAC options surfaced in Round 1; Vision compliance cross-check in Round 2 withdrew or repaired most of them; Round 3 produced final per-pole recommendations.

## Evaluation Criteria

Every alternative must satisfy ALL of the following designer-set criteria:

- **Singular purpose.** Produces all three artifacts the downstream design-specify phase requires: constraint envelope, resolution criterion, coverage map.
- **Method openness.** No pre-commitment to the current proof system or any specific mechanism.
- **Architectural altitude.** The design system plans at the architectural level; implementation specifics are out of scope.
- **Implementation prohibition.** No pre-determination of implementation-level decisions or options.
- **Proof system as tool.** If used, the proof system is instrumental — a tool, not the system's reason for being.
- **Guidance, not constraint.** If the proof system is used, it guides the agents toward solving the right problem; it does not force a particular solution shape.
- **Elimination admissibility.** The proof system may be eliminated if a viable alternative meets the Vision design principles per Q1 ruling.
- **Committee preservation.** The four-pole Committee structure is preserved. Non-pole roles (Arbiter, Researcher, team-lead) are up for review.
- **External validation.** Agents do not check their own work. All validation is external to the producing agent.
- **90/10 budget.** Design planning consumes 90% of operational time; admin processing 10% or less.

The Vision design principles per Q1 ruling are inherited as Lens 7's binding constraint:

- **Channeling principle (Vision Sec 2):** the LLM completion drive is treated as a load-bearing property to design around, not a flaw to suppress. The design system gives the agent something structural to finish on. This requires typed schema operating DURING deliberation, not as post-hoc extraction.
- **Design language (Vision Sec 1 per Q1):** the schema must prevent prose, definition, and altitude degradation over time. Derivation is not required.
- **Two-player asymmetric authority (Vision Sec 2.6):** Agent proposes, revises, withdraws. Designer asserts axioms and ratifies. The asymmetry is structural.
- **Closed-set vocabulary (Vision Sec 2.2):** field shapes and enumerations convert open-ended generation into bounded multiple choice.
- **NOT a deliberation tool for humans (Vision Sec 3.3):** the system is designed for LLM-agent-with-designer interaction, not collaborative human deliberation. gIBIS, Compendium, and similar patterns are explicit anti-precedents.

## Alternatives Considered

Thirteen options entered Round 1. Six survived Vision compliance to Round 3. The six surviving alternatives are:

- **Alternative A — Lean Proof (Conservator C1):** Full proof engine retained, ceremony stripped, Arbiter rechartered as Clerk handling batch-only operations.
- **Alternative B — Typed Register Revised (Conservator C4-R):** Proof engine eliminated. Concerns Register with mechanically-enforced typed fields (commitment sentence, IF NOT/THEN contrapositive, grounding citation). External Clerk lint at round close.
- **Alternative C — Proof Engine Retained with Scribe-Clerk (Innovator F):** Engine unchanged structurally; Arbiter rechartered as mechanical Scribe-Clerk; pole output in lightweight typed format.
- **Alternative D — Rigorous Typed Record (Innovator Option 1):** Proof engine eliminated. Four-field schema per Concern with bounded enumerations for stance and scope.
- **Alternative E — Channeled Single-Layer Record (Pragmatist D):** Proof engine choice configurable. Single-layer Propositions only (no Resolutions). Three mechanically-enforced fields (IF/THEN body, IF NOT/THEN contrapositive, Evidence ID grounding). Engine-retained variant uses single-layer ingest; engine-eliminated variant uses Clerk audit.
- **Alternative F — RECOMMENDED COMPOSITE: Channeled Single-Layer Schema with Designer Axiom-Anchoring (Pragmatist D + Innovator E):** Alternative E in engine-eliminated configuration, plus designer pre-asserts known-true axioms per Concern before deliberation. Agent argues only the delta between axioms and resolution criterion.

Seven other Round 1 options were withdrawn during Round 2 Vision compliance review. Each was withdrawn by its own pole author after the Vision-strict reading surfaced violations. These are documented in the Withdrawn Alternatives section below.

## Detailed Alternative Analysis

### Alternative A — Lean Proof (Conservator C1)

**Architectural shape.** Current proof engine preserved. Single-writer state, forward-chaining derivation, closure gate, full element schema (Definitions, Concerns, Evidence, Propositions, Resolutions, Rules, Permissions, Frictions, Withdrawals). Convention-layer overhead stripped: no mid-round closure-gate runs, no per-element ingest, no synthesis pass between pole output and engine state. Arbiter rechartered as Clerk; Clerk performs one batch ingest call per round.

**Three-artifact production.** Constraint envelope from designer-ratified Rules and Permissions in engine state. Resolution criterion from closure-gate per-Concern coverage verdict. Coverage map from Resolution-to-Concern grounding chain queryable from proof state.

**Role inventory.** Four poles unchanged. Clerk replaces Arbiter, scoped to batch operations. Researcher unchanged. Team-lead unchanged.

**90/10 budget compliance.** Admin is Clerk's batch ingest plus lint and gate pass. At current engine speed, 8–15 minutes per round at NCON-6 scale. For a 60-minute deliberation round, this yields approximately 80/20. With future engine changes EC-001 (batch ingest API) and EC-002 (state caching), the wall-clock drops to under 2 minutes per round, yielding approximately 95/5. **Today: does not meet 90/10. Post engine sprint: exceeds 90/10.**

**Original requirements compliance.**
- Singular purpose: passes (artifacts produced by engine).
- Method openness: passes (engine is one tool choice; not pre-committed in the analysis).
- Architectural altitude: passes (schema enforces altitude).
- Implementation prohibition: passes (no implementation primitives in schema).
- Proof system as tool: passes (engine repositioned as infrastructure, not substrate).
- Guidance not constraint: passes (engine vocabulary discipline guides; does not force solution shape).
- Elimination admissibility: not exercised (engine retained).
- Committee preservation: passes (poles unchanged, Arbiter → Clerk).
- External validation: passes (Clerk lints pole output).
- 90/10 budget: **fails today; conditionally passes post engine sprint.**

**Key trade-off.** Strongest traceability and structural enforcement of any alternative. Preserves cascade invalidation on revision (the engine flags downstream commitments when a ratified element is revised). Cost: budget compliance deferred to a future engine sprint that has not been scheduled. The system continues to operate sub-budget until that sprint lands.

**Pole advocacy.** Conservator co-equal endorsement with C4-R. No other pole prefers this option as the leading choice.

### Alternative B — Typed Register Revised (Conservator C4-R)

**Architectural shape.** Proof engine eliminated. A Concerns Register maintained as a structured markdown document holds the deliberation record. Per-Concern typed fields: commitment sentence (subject-verb-object architectural vocabulary), IF NOT/THEN contrapositive, grounding citation (Evidence ID or prior Concern resolution ID). Designer-ratified Constraint and Permission rows scoped per Concern, asserted directly by the designer during deliberation. Clerk runs external lint script at round close validating field presence, format compliance, and vocabulary against an implementation-keyword blocklist.

**Three-artifact production.** Constraint envelope from Constraint and Permission rows directly. Resolution criterion from per-Concern commitment sentences. Coverage map from inspection of the Register — each Concern row is either ratified or open.

**Role inventory.** Four poles unchanged. Clerk receives pole records, runs lint, presents ratified Register to designer. No Arbiter, no engine. Researcher unchanged.

**90/10 budget compliance.** Admin is Clerk's lint script pass plus designer ratification at round close. Under two minutes per round regardless of Concern count. **Today: passes unconditionally.** No engine dependency.

**Original requirements compliance.**
- Singular purpose: passes.
- Method openness: passes (proof engine eliminated; typed schema is the chosen method).
- Architectural altitude: passes (commitment sentence + IF NOT/THEN form enforce altitude).
- Implementation prohibition: passes (implementation-keyword blocklist at lint).
- Proof system as tool: passes (not used; Lens 7 exercised).
- Guidance not constraint: passes (typed fields guide; do not force solution shape).
- Elimination admissibility: passes (engine eliminated; Vision-compliant per Q1).
- Committee preservation: passes.
- External validation: passes (Clerk audits pole output; designer ratifies directly).
- 90/10 budget: passes unconditionally.

**Key trade-off.** Loses forward-solve counterfactual queries and machine-readable proof-state integrity. The IF NOT/THEN field shape preserves the cheap-path forcing function — the agent cannot satisfy the contrapositive with implementation prose without producing an incoherent claim at architectural altitude.

**Pole advocacy.** Conservator co-equal endorsement with C1.

### Alternative C — Proof Engine Retained with Scribe-Clerk (Innovator F)

**Architectural shape.** Proof engine unchanged structurally. Arbiter rechartered as Scribe-Clerk with a mechanical-only charter: no synthesis, no consolidation, no narrative authorship. Scribe-Clerk receives pole output in lightweight typed format, runs lint mechanically against the engine's registered vocabulary, batches one ingest per round, reports pass/fail.

**Three-artifact production.** Same as Alternative A — engine derivation produces all three artifacts.

**Role inventory.** Four poles unchanged. Scribe-Clerk replaces Arbiter at narrower scope. Team-lead retained but does not author synthesis. Researcher unchanged.

**90/10 budget compliance.** Same dependency as Alternative A. Today: fails 90/10. Post engine sprint: passes.

**Original requirements compliance.** Identical pattern to Alternative A.

**Key trade-off.** Most conservative engine-retention path — minimum architectural change from the current system. Same budget non-compliance risk as Alternative A.

**Pole advocacy.** Innovator endorsement as conservative alternative; not Innovator's leading recommendation.

### Alternative D — Rigorous Typed Record (Innovator Option 1)

**Architectural shape.** Proof engine eliminated. Per Concern, a typed Proposition record with four fields: architectural-commitment (IF/THEN structurally constrained free text), lens-stance (bounded enumeration: affirm / qualify / contest / defer), scope-boundary (bounded enumeration: cross-cutting / layer-bounded / contract-surface / implementation-internal), and collapse-test (IF NOT/THEN contrapositive). Clerk performs batch field-shape validation and artifact production once per round.

**Three-artifact production.** Constraint envelope from architectural-commitment fields grouped by scope-boundary. Resolution criterion from designer adjudication language plus ratified lens-stance fields. Coverage map from Concern-to-record mapping.

**Role inventory.** Four poles unchanged. Clerk replaces Arbiter at mechanical batch-processing scope. Team-lead dispatch only. Researcher unchanged.

**90/10 budget compliance.** Passes today. No engine dependency.

**Original requirements compliance.** Passes all ten.

**Key trade-off.** Adds two enumeration fields beyond the minimum (lens-stance, scope-boundary) that the other Family 2 options omit. These give the Clerk richer batch-extraction inputs but increase pole authoring obligation per Concern.

**Pole advocacy.** Innovator's leading recommendation.

### Alternative E — Channeled Single-Layer Record (Pragmatist D)

**Architectural shape.** Variant configuration. The schema is invariant across both variants: per Concern, a single Proposition record with three fields: body (IF/THEN architectural claim), collapse_test (IF NOT/THEN contrapositive, structurally enforced), grounding (Evidence ID citations, existence-checked). The Resolution layer, Friction shapes, and Withdrawal dispositions present in the current engine are eliminated. The engine-retained variant ingests the Proposition batch via single-layer engine operations; the engine-eliminated variant uses Clerk audit at round close. Field shapes are identical in both variants.

**Three-artifact production.** Constraint envelope from ratified Proposition bodies (already IF/THEN architectural claims by construction). Resolution criterion from collapse_test fields (contrapositives state failure conditions directly). Coverage map from one-Proposition-per-Concern ratification status.

**Role inventory.** Four poles unchanged. Clerk replaces Arbiter at narrower scope (batch lint and ingest in the engine variant; round-end audit in the eliminated variant). Researcher supplies Evidence and maintains the Evidence ID registry. Team-lead consolidates artifacts at session close.

**90/10 budget compliance.** Engine-retained variant: depends on engine sprint, same as Alternative A. Engine-eliminated variant: passes today.

**Original requirements compliance.** Passes all ten in both variants.

**Key trade-off.** Single-layer collapse loses the Resolution/Proposition distinction the current engine maintains. Friction shapes are gone, removing the ability to register structural tension without forcing resolution. The proof is less expressive; some legitimate design moves do not fit the simpler schema. Pragmatist position: "minimum sufficient system" — accept reduced expressive range for the budget guarantee.

**Pole advocacy.** Pragmatist's leading recommendation (engine-eliminated variant).

### Alternative F — RECOMMENDED COMPOSITE: Channeled Single-Layer Schema with Designer Axiom-Anchoring (Pragmatist D + Innovator E)

**Architectural shape.** Builds on Alternative E (engine-eliminated variant) by adding Innovator's axiom-anchoring modifier. Before deliberation begins for each Concern, the designer asserts known-true axioms — facts and constraints the designer has already settled and that do not require pole argumentation. The Committee then deliberates only on the delta between the axioms and the resolution criterion. The agent's argument surface shrinks to the genuinely open questions.

The typed schema is Alternative E's three-field Proposition record: IF/THEN body, IF NOT/THEN contrapositive collapse_test, Evidence ID grounding. Axioms are recorded as designer-asserted Rules and Permissions in the schema document with explicit designer-voice provenance. The Clerk maintains the running axiom list per round and flags any pole-proposed Proposition body that contradicts a designer-asserted axiom. The designer ratifies Proposition batches at round close. Coverage map: per-Concern, axiom-coverage plus ratified-Proposition-coverage equals total coverage.

**Three-artifact production.**
- Constraint envelope: ratified designer-asserted axioms + ratified pole Proposition bodies, both at architectural altitude by field-shape enforcement.
- Resolution criterion: pattern of ratified Propositions across Concerns, with collapse_test fields stating each Proposition's failure condition explicitly.
- Coverage map: each Concern's coverage = its asserted axioms plus its ratified delta Propositions. Gaps surface to designer for explicit disposition.

**Role inventory.**
- **Four poles** (unchanged): deliberate on Concern deltas, author Proposition records in the three-field schema, submit one record per Concern addressed per round.
- **Clerk** (replaces Arbiter): receives pole Proposition records, runs mechanical field-shape lint and Evidence ID existence check at round close, maintains axiom list, flags axiom-collision and coverage gaps, presents ratified record set to designer. No deliberation, no synthesis, no narrative.
- **Researcher** (unchanged): Evidence supply, codebase grep, Evidence ID registry maintenance.
- **Team-lead** (unchanged): dispatches rounds, consolidates designer decision points, drafts the three artifacts from the ratified record set at session close.
- **Designer**: pre-asserts axioms per Concern, ratifies Proposition batches at round close, disposes coverage gaps, signs off final artifacts. Axiom-assertion authority is structurally enforced — axioms enter the schema in designer voice via designer's own input, not via agent interpretation.

**90/10 budget compliance.** Per round: Clerk lint pass ~2 minutes, designer batch ratification ~3 minutes, designer axiom pre-assertion ~5 minutes one-time per session. For a two-round session of approximately 80 minutes deliberation: 12 minutes admin = approximately 87/13. Axiom-anchoring scope reduction (typical Concern count reduced by 20-30% as designer pre-resolves easy commitments as axioms) brings the budget to approximately 92/8. **Today: passes unconditionally. No engine sprint dependency.**

**Original requirements compliance.**
- Singular purpose: passes — three artifacts produced from ratified record set.
- Method openness: passes — typed schema as method, axiom-anchoring as scope reduction.
- Architectural altitude: passes — IF/THEN body and IF NOT/THEN contrapositive structurally enforce altitude; axioms asserted at architectural altitude by designer.
- Implementation prohibition: passes — collapse_test field structurally rejects implementation vocabulary (contrapositives at implementation altitude are incoherent at architectural Concern level).
- Proof system as tool: passes — eliminated; typed schema is the substituted tool.
- Guidance not constraint: passes — schema guides production discipline; does not force solution shape.
- Elimination admissibility: passes — eliminated with Vision-compliant alternative per Q1 ruling.
- Committee preservation: passes — four poles unchanged, Arbiter → Clerk.
- External validation: passes — Clerk audits pole records; designer ratifies; poles never validate own output.
- 90/10 budget: passes unconditionally.

**Key trade-off.** Loses cascade invalidation on revision — if a ratified Proposition is later revised, the Clerk does not automatically flag which downstream Propositions depended on it. This regression concentrates the invalidation-tracking burden at the designer's ratification surface. Per Vision Sec 4, this is correct placement for a trade-off the designer is equipped to handle, but it is a real cost the current engine absorbed structurally.

**Pole advocacy.** Three of four poles converge on this option:
- Purist: leading recommendation. Category-boundary discipline applied — retaining structurally-unrequired components is itself a category violation after Q1 ruling.
- Pragmatist: leading recommendation (Alternative E engine-eliminated variant; Innovator E modifier compatible).
- Innovator: Alternative D is close kin; Alternative F is the composite that satisfies the Researcher's axiom-assertion structural requirement.
- Conservator: neutral between Alternative A (Family 1) and Alternative B (Family 2). Does not oppose Alternative F.

## Trade-off Comparison

The six surviving alternatives differ on five axes. Differences are summarized below.

**Engine retention:** Alternatives A, C, and Alternative E engine-retained variant keep the current proof engine. Alternatives B, D, F, and Alternative E engine-eliminated variant eliminate it.

**Schema layer depth:** Alternatives A and C maintain the current multi-layer schema (Definitions, Concerns, Evidence, Propositions, Resolutions, Rules, Permissions, Frictions). Alternatives B, D, E, F collapse to a single Proposition-equivalent layer per Concern.

**Field shape rigor:** All Family 2 alternatives (B, D, E, F) require IF NOT/THEN contrapositive at the collapse_test field. Conservator's B is the only Family 2 alternative that explicitly specifies designer-asserted Constraint and Permission rows in the schema. Innovator's D adds two enumeration fields (lens-stance, scope-boundary) beyond the IF/THEN body. Pragmatist's E and the recommended F use the tightest three-field minimum.

**Designer axiom-assertion mechanism:** Conservator's B includes it natively (Constraint and Permission rows in the Register). Innovator E composite (Alternative F) adds it via designer pre-assertion before deliberation. Alternatives D and E without the E modifier do not explicitly specify this mechanism — flagged by Researcher as an empirical risk gap (the Elicitron failure mode: channeled form, unanchored semantics).

**90/10 budget compliance today:** Alternatives B, D, E (engine-eliminated variant), and F pass today without engine sprint dependency. Alternatives A, C, and E (engine-retained variant) fail today; conditionally pass post EC-001+EC-002.

## Recommendation

**Adopt Alternative F — Channeled Single-Layer Schema with Designer Axiom-Anchoring.**

Justification:

- **Three-of-four pole convergence.** Purist, Pragmatist, and Innovator all prefer this option (or its near-kin) over engine-retention alternatives. Conservator does not oppose it. This is the strongest single Committee convergence in the analysis.
- **Today's 90/10 budget compliance.** Alternatives A and C require a future Chester engine sprint (EC-001 batch ingest + EC-002 state caching) to meet the 90/10 requirement. The recommendation meets it today without any engine work. The designer's 90/10 is stated as a present-tense requirement; deferring compliance to a future sprint is failing the requirement, not meeting it conditionally.
- **Q1 ruling integration.** The recommendation exercises Lens 7 elimination with the Vision-compliant design-language schema the Q1 ruling explicitly admits. The typed schema satisfies channeling (Vision Sec 2), preserves two-player asymmetric authority (Vision Sec 2.6), maintains closed-set vocabulary discipline (Vision Sec 2.2), and is not a deliberation tool for humans (Vision Sec 3.3). All five load-bearing Vision principles survive.
- **Researcher empirical risk addressed.** The designer-axiom-assertion mechanism (Innovator E modifier) directly addresses the Elicitron-style failure mode Researcher flagged — channeled form with unanchored semantics. Without the axiom modifier, Alternatives D and E share the original proof-MCP inaugural-run risk: agent talking to itself through the schema with no designer-voice anchor. Alternative F closes this gap.
- **Minimum sufficient system.** The recommendation includes exactly the structural components the original requirements demand and nothing more. Cascade invalidation, multi-layer derivation, Friction shapes, and Withdrawal dispositions are all eliminated as structurally-unrequired complexity. Pragmatist's framing: "the proof system's core element-authoring loop is not overhead; the wrapper around it is."

## Risks and Mitigations

The recommendation accepts three structural risks. Each is named with mitigation.

**Risk 1 — Cascade invalidation regression.** When a ratified Proposition is revised, the current engine automatically flags downstream commitments that depended on the revised element. The recommendation eliminates this. Risk: a revision invalidates downstream Propositions without explicit re-ratification, producing an inconsistent ratified set.

Mitigation: the Clerk's per-round coverage check identifies any Proposition whose grounding cites a previously-revised Proposition or Evidence ID and flags it for designer re-ratification. This is detection-after-revision rather than prevention-by-cascade, but it surfaces the inconsistency before session close. Designer ratification of revisions is the load-bearing check.

**Risk 2 — Designer-axiom-assertion mechanism quality.** Axioms enter the schema at the designer's keystroke, but the designer may not always arrive at a Concern with sufficient pre-deliberation clarity to assert useful axioms. If axioms are sparse or absent, the agent's argument surface returns to full Concern scope and the scope-reduction benefit is lost.

Mitigation: axiom-anchoring is optional per Concern. Concerns where the designer has no pre-deliberation clarity proceed without axioms; the agent argues the full surface. This is the case design-large-task's understanding flow currently produces. The scope reduction is a bonus when available, not a precondition.

**Risk 3 — Field-shape rigor enforcement under deadline pressure.** The IF/THEN body and IF NOT/THEN contrapositive fields are mechanically enforceable by Clerk lint, but field-shape enforcement is only as good as the lint regex. Poles may produce body fields that match the IF/THEN form syntactically while bypassing it semantically (e.g., "IF the system exists THEN it works"). The lint catches structural malformation; it does not catch semantic emptiness.

Mitigation: designer ratification is the semantic gate. The Clerk surfaces all ratified Propositions to the designer in the record document; the designer reads body and collapse_test fields directly before ratifying. Semantic emptiness becomes visible at the ratification surface where designer judgment is the intended semantic mechanism per Vision Sec 4.

## Open Designer Decisions

Three decisions remain for designer adjudication before the recommendation is implemented:

- **Decision 1 — Confirm Alternative F adoption** or direct an alternative selection from the six surviving options.
- **Decision 2 — Specify the axiom-assertion mechanism.** Should designer-asserted axioms be entered directly into the Concerns Register document, asserted via a dedicated tool call to a Clerk-maintained axiom registry, or recorded as named designer-statements at session open? The Committee did not settle the implementation detail; this is the designer's call.
- **Decision 3 — Clerk role scope finalization.** The Clerk's charter under Alternative F is mechanical: lint, batch validation, axiom-collision flagging, coverage gap reporting. The Committee did not finalize whether the Clerk runs as a distinct LLM-agent role (with its own session context) or as a deterministic script invoked by team-lead. The trade-off is flexibility (LLM agent can handle edge cases) versus reliability (script is mechanical and deterministic). Designer's call.

## Withdrawn Alternatives

Seven Round 1 options were withdrawn during Round 2 Vision compliance review. Each was withdrawn by its own pole after the Vision-strict reading surfaced violations.

- **Conservator C2 — Structured Transcript.** Withdrawn. Channeling violation (free-prose deliberation has no typed structural target) and geometric-proof form absence. "A regression, not a replacement" per Conservator's own assessment.
- **Pragmatist A — Scribe-Only System.** Withdrawn. Same failure category as C2. "Channeling is not bolt-on-able to prose deliberation."
- **Pragmatist C — Structured Prose Brief.** Withdrawn. Explicit gIBIS anti-precedent. Vision Sec 3.3 violation.
- **Innovator A (unrepaired) — Transcript Clerk.** Withdrawn in unrepaired form. Free-prose deliberation violates channeling. The repaired form converges to Alternative D.
- **Innovator B — Direct Brief Assembly.** Withdrawn. Geometric-proof form and closed-set vocabulary both fail. "Simple because it dropped load-bearing Vision properties."
- **Purist P-1 — Clerk-Anchored Transcript.** Withdrawn. "Extraction after the fact is translation, not channeling."
- **Purist P-2 — Structured Brief Protocol.** Withdrawn. Multiple Vision violations plus gIBIS-borderline.

The pattern across all seven withdrawals: each substituted free-prose pole deliberation for the current proof system's typed-element discipline. Vision Sec 2.3's prevention-first channeling requirement — implementation must not be an available output shape — could not be satisfied without typed fields operating during deliberation. The Committee's cross-pole convergence on this withdrawal pattern is itself evidence that the Vision filter is doing the work the designer intended.

## Forward Step

On designer ratification of the recommendation, the following implementation work follows:

- Draft a one-page operational specification of Alternative F, including the three-field Proposition schema, the axiom-assertion protocol, the Clerk's mechanical charter, and the round structure.
- Specify the Decision 2 and Decision 3 details per designer adjudication.
- Pilot the recommendation on a small problem (one or two Concerns) before retrying NCON-6 R-A2 under the new architecture.
- Compare wall-clock and substantive output between the pilot session and the current Lean Proof baseline to validate the 90/10 budget compliance claim empirically.

If the recommendation passes pilot validation, NCON-6 resumes under the new architecture with R-A2 dispatch. If the pilot surfaces unexpected failures, this AoA is revisited with the empirical findings as new input.
