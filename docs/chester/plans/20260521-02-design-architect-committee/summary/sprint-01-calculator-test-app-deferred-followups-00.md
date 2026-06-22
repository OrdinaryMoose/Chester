# Deferred Followups — sprint-01-calculator-test-app

- Sprint: `sprint-01-calculator-test-app` (sub-sprint of `20260521-02-design-architect-committee`)
- Date: 2026-05-23
- Status: durable backlog for `design-architect-committee` skill — narrative followups + stress-test findings consolidated
- Source documents:
  - `../working-record/working-record-00.md` — lifecycle audit + Deferred Followups inline section
  - `../working-record/clerk-stress-test-00.md` — 42 stress-test scenarios + 16 schema findings
  - `../design/sprint-01-calculator-test-app-design-00.md` — frozen design brief (proof of full-pipeline exercise)
- Total items: **3 narrative followups + 16 stress-test findings = 19 deferred items**

## Index

### Narrative followups (process / terminology / template)
- **NF-01** Rename `Concern` → `Decision` (or `Architectural Decision` / `Decision Point`)
- **NF-02** Committee `design-brief-template.md` needs 6-section narrative envelope around frozen deliverables
- **NF-03** Extend Team-Lead packaging with PM-facing companion brief

### Stress-test findings (schema gaps / mechanics)
- **Critical:** F-05, F-06
- **High:** F-03, F-07
- **Medium:** F-02, F-08, F-09, F-10, F-11, F-12, F-13, F-15
- **Low:** F-01, F-04, F-14, F-16

---

## NF-01 — Rename `Concern` → `Decision`

**Problem.** The term `Concern` in committee schema does not carry its traditional software-engineering meaning (worry / risk / separation-of-concerns slice). The schema role is: a partition key for axiom-collision detection, the unit of Coverage Map measurement, the slot for pole deployment, and a scope-statement-only header (no body field). Functionally, each `CE-NNN` row is one **architectural decision point** with structurally competing positions — directly aligned with industry ADR (Architectural Decision Record) practice. Calling it `Concern` misnames the role and obscures the relationship to existing ADR vocabulary.

**Why it matters.** Downstream `design-specify` and any human reader must parse `Concerns` as "decisions to be made" rather than "things to worry about". Mental-model friction at every read. ADR is the canonical SE artifact for exactly this concept (Nygard 2011); naming alignment unlocks immediate comprehension for anyone with ADR background.

**Candidate fix.** Rename schema entity `Concern` → `Decision`. Candidate prefixes:
- `DC-NNN` (Decision) — terse, schema-aligned.
- `AD-NNN` (Architectural Decision) — ADR-aligned, verbose.
- `DP-NNN` (Decision Point) — emphasizes locus, verbose.

**Scope.** Class-1 schema change. Touches:
- `skills/design-architect-committee/schema/constraint-envelope.md`
- `skills/design-architect-committee/schema/coverage-map.md`
- `skills/design-architect-committee/schema/resolution-criterion.md`
- `skills/design-architect-committee/schema/procedures.md`
- `skills/design-architect-committee/schema/actors.md`
- `skills/design-architect-committee/schema/phases-and-transitions.md`
- `skills/design-architect-committee/schema/integrity-rules.md`
- `skills/design-architect-committee/design-brief-template.md`
- `skills/design-architect-committee/SKILL.md`
- Downstream `design-specify` consumer references

**Coordination.** Verify the prior `design-committee` skill is not load-bearing on the `Concern` term before flipping — separation-of-concerns lineage may have inherited the word elsewhere.

**Priority.** Medium. Not blocking; benefits compound over time as more sessions accumulate using current term.

---

## NF-02 — Committee `design-brief-template.md` needs narrative envelope

**Problem.** The current committee design-brief template is rows-only: Header / Concerns / Constraint Envelope / Resolution Criterion / Coverage Map / Confirmation. Compared to the standard Chester brief template (`skills/design-small-task/references/design-brief-small-template.md`) which carries Goal / Prior Art / Scope / Key Decisions / Constraints / Acceptance Criteria as narrative sections, the committee template throws away the surrounding context any human or downstream consumer needs. Schema fidelity is preserved; consumer-readiness is not.

**Why it matters.**
- Downstream `design-specify` (and any plan-build reader) cannot extract Goal, scope-boundary rationale, or alternatives-considered from rows alone. The committee already does the deliberation work; the template discards the by-products at handoff.
- Rejected Propositions are the committee's hidden value — they map 1:1 to "alternatives considered" in standard Key Decisions. Current template provides no home for them; they vanish from the brief.
- The four ratified axioms and four `collapse_test` rows have natural plain-language restatements as Constraints and Acceptance Criteria. Current template forces consumers to read IF/THEN form directly.

**Candidate fix.** Revise `skills/design-architect-committee/design-brief-template.md` to compose three frozen deliverables INSIDE a 6-section narrative envelope:
1. **Goal** — one paragraph: what is being decided and why.
2. **Prior Art** — what existing committee output, prior briefs, or codebase patterns inform this session.
3. **Scope** — in/out with rationale per exclusion.
4. **Key Decisions** — one Decision per Concern. Each names the chosen Proposition + rationale + rejected alternatives (the other three poles' Propositions with one-line rejection note derived from each pole's lens).
5. **Constraints** — plain-language restatement of AXIOM rows (one bullet per axiom).
6. **Acceptance Criteria** — plain-language restatement of `collapse_test` rows (one bullet per criterion).

Then frozen-deliverables block: Constraint Envelope (rows), Resolution Criterion (rows), Coverage Map (rows). Then Deliberation Provenance (pole attribution, withdrawn list, round count).

**Authorial discipline.** Narrative sections derive mechanically from row content. No editorializing. Constraints = axioms re-registered. AC = collapse_tests re-registered. Key Decisions = chosen PR + the three rejected PRs in plain language. Editorial freedom only in Goal and Prior Art prose.

**Scope.** Class-1 template change. Single file rewrite: `skills/design-architect-committee/design-brief-template.md`. Lint script (`scripts/lint-skill-files.sh`) may need a corresponding section-presence check.

**Validated against.** This sprint's brief (`design/sprint-01-calculator-test-app-design-00.md`) was rewritten to the proposed shape and confirmed self-contained. Use it as the worked example for the template rewrite.

**Priority.** High. Affects every future committee session's handoff quality.

---

## NF-03 — Extend Team-Lead packaging with PM-facing companion brief

**Problem.** The three frozen deliverables are machine-readable and architect-readable but PM-unreadable. A product manager cannot consume row-by-row IF/THEN form, cannot read structural `collapse_test` contrapositives as falsifiable bets, and cannot disposition 16 ratification rows (which is the wrong choice surface anyway — PM needs one winner per Decision, not per-row signals).

**Why it matters.**
- Without PM-readable surface, PM-level approval of committee output requires translation work done ad-hoc by whoever briefs the PM. Translation is lossy and inconsistent.
- PM brings business context the committee does not have (cost, timeline, reversibility). Without a PM-readable surface, that context cannot land back on the architecture.
- Three of the four ratified Propositions in this sprint carry pole authorship in the working record but not in the frozen deliverables — PM cannot read "Conservator picked X" from rows alone. Lens attribution helps PM weigh recommendations.

**Candidate fix.** Add fourth Team-Lead output produced at session close from Clerk-certified state. Per-Decision view (not per-row). For each Decision, present:
- Decision label in plain language with one-sentence frame of what it commits to.
- Two-to-four options with pole attribution. For each option:
  - One-sentence plain-language summary
  - "Buys" (one bullet)
  - "Costs" (one bullet)
  - "Locks out" (one bullet)
  - "Wrong-pick signal" — the `collapse_test` reframed as plain-language risk
- Recommended default with conditions ("default C if speed-first; B if correctness-first; A if money-domain").
- Composability note (single-winner Decision vs composable).

**Schema implication.** View-layer transform only. Three frozen deliverables stay strict. PM brief generated as a companion artifact alongside them.

**Two latent schema gaps surfaced by this followup:**
- `cost_estimate` field — not in Resolution Criterion row shape; PM brief needs it. Candidate row-shape extension.
- `reversibility_class` (one-way door vs two-way door per Bezos rule) — also not in schema; PM weighs decisions differently by reversibility. Candidate row-shape extension.

**Scope.** Class-2 (additive) change to Team-Lead packaging step + Class-1 candidate schema row-shape extensions if PM brief is to carry cost/reversibility. Falls inside Team-Lead authority envelope (mechanical extraction, no synthesis judgment).

**Priority.** Medium. Not blocking architect handoff; blocking PM-level approval workflows when those workflows exist.

---

## Stress-Test Findings (consolidated from `clerk-stress-test-00.md`)

Sixteen findings from 42 simulated CRUD + validation scenarios against the locked schema. Each finding flags a spec gap, rule conflict, loophole, or audit deficit. Severity heuristic: **Critical** = ships contradictory artifact downstream; **High** = semantic gap permits logical incoherence; **Medium** = workflow friction or undefined behavior; **Low** = audit / consistency / cleanup.

### Critical

#### F-05 — Axiom-to-axiom contradiction permitted within same Concern
- **Source scenario:** S-23.
- **Gap.** Per `procedures.md §Add Axiom`: "No collision-block — axiom always written." Two axioms can both reach `RATIFIED` status on the same Concern with directly negating bodies. Session-close gate counts RATIFIED rows but does not check consistency among them.
- **Consequence.** Constraint Envelope at close ships internally contradictory ground truth to `design-specify`.
- **Candidate fix.** Extend the structural-negation collision rule from axiom-vs-proposition to axiom-vs-axiom on the same Concern. Two options for handling: (a) reject the second axiom write; (b) flag both and require designer disposition.
- **Cost.** Cheap. Reuses existing structural-negation matcher; new scope only.
- **Priority.** First — highest payoff per unit of work.

#### F-06 — Cross-Concern collision silently accepted; no global consistency check
- **Source scenario:** S-25.
- **Gap.** Collision scope is per-Concern. A Proposition on Concern X may contradict an axiom on Concern Y without flag. Plausible given Concerns partition the design space — but combined with F-05 the schema offers no global consistency guarantee.
- **Consequence.** Committee can certify a self-contradicting envelope.
- **Candidate fix.** Either explicitly accept the partition limit and document the consumer-side responsibility, or add a cross-Concern coherence pass as a Clerk lint step.
- **Priority.** First — pairs with F-05.

### High

#### F-03 — `collapse_test` gate is pure-syntactic; no body-to-contrapositive alignment check
- **Source scenario:** S-13.
- **Gap.** Clerk checks `IF NOT ... THEN ...` prefix presence and form. A pole can satisfy syntax with vacuous content (`IF NOT true, THEN false`). No semantic alignment check between Proposition body and `collapse_test`.
- **Consequence.** Resolution Criterion may carry collapse_tests that do not actually contradict the corresponding body — Resolution Criterion's falsifiability claim breaks.
- **Candidate fix.** Require body and collapse_test share noun-phrase overlap (mechanical), or require designer review of contrapositive faithfulness at RATIFYING (procedural).
- **Priority.** After Critical.

#### F-07 — Structural negation match brittle to paraphrase
- **Source scenario:** S-26.
- **Gap.** Schema explicitly disclaims semantic check ("structural negation match, not semantic"). Paraphrase, synonym substitution, or restated negation slips past axiom-collision detection.
- **Consequence.** Designer is sole firewall against logical incoherence. A tired designer in RATIFYING can wave through contradictions structural-negation would have caught had they been written verbatim.
- **Candidate fix.** Accept the syntactic-only design boundary explicitly and document the burden on RATIFYING. Or invest in a stronger matcher (e.g., embedding similarity + manual review queue). Probably document the limit; matcher investment unlikely to pay off.
- **Priority.** After Critical.

### Medium

#### F-02 — "Architectural altitude" enforced but no deterministic detection mechanism specified
- **Source scenario:** S-10.
- **Gap.** `procedures.md §Add Axiom` says altitude is Clerk-enforced. No detection mechanism defined. A deterministic script cannot classify "implementation vocab" reliably. Plus: PROPOSITION altitude not checked at all (`procedures.md §Propose Proposition` lists only form check, not altitude).
- **Candidate fix.** Either (a) define altitude operationally as absence of identifier-shaped tokens (CamelCase / snake_case / monospace fences), or (b) drop altitude claim from Clerk responsibility and document it as designer responsibility.
- **Priority.** Medium.

#### F-08 — Designer axiom-revision cascade scope broader than Agent proposition-revision cascade scope
- **Source scenario:** S-27.
- **Gap.** Designer axiom revision flags all PROPOSITION rows on Concern. Agent proposition revision flags only rows whose `grounding` cites the revised entry_id. Same operation (revise), different scope, by actor. No explanation in spec.
- **Candidate fix.** Decide intent: (a) grounding-scope both (precise, narrower); (b) full-Concern-scope both (broad, simpler); (c) document the asymmetry with rationale.
- **Priority.** Medium.

#### F-09 — Designer axiom-withdrawal cascade scope narrower than designer axiom-revision cascade scope
- **Source scenario:** S-28.
- **Gap.** Withdrawal cascade is `grounding`-cited (narrow). Revision cascade is full-Concern-scope (broad). Same actor, same row class, different scope by operation. Inconsistent.
- **Candidate fix.** Same as F-08 — align both designer-axiom operations to the same scope rule, document rationale.
- **Priority.** Medium. Pairs with F-08.

#### F-10 — Transitive cascade depth unbounded; no cycle detection; pathological depth cost not modeled
- **Source scenario:** S-29.
- **Gap.** Schema says cascade is "then transitive" for AGENT cascade. No depth limit, no cycle detection. Pathological grounding DAG can flag a large subgraph from a single revision.
- **Candidate fix.** Add cycle detection (Clerk should detect grounding cycles at Propose Proposition gate); add documentation of expected cascade fanout cost; consider depth limit with explicit error if exceeded.
- **Priority.** Medium. Real-session likelihood depends on whether `grounding` ever cites other PRs (not Evidence) — current schema is ambiguous on whether grounding accepts PR-NNN refs at all.

#### F-11 — REJECT row blocks session close; no reject-and-forget path
- **Source scenario:** S-31.
- **Gap.** Per `procedures.md §Ratify Row` REJECT: row → REVISED-PENDING. Per close gate: zero REVISED-PENDING required. Designer must explicitly Withdraw rejected rows to close.
- **Candidate fix.** Either (a) compose `Reject Row + Withdraw Entry` as single procedure (`Reject-And-Withdraw`); (b) relax close gate to accept REVISED-PENDING-with-reject-reason rows.
- **Priority.** Medium. Workflow friction; not data integrity.

#### F-12 — Session can close with zero Propositions; Mode B convening doesn't require pole exercise
- **Source scenario:** S-33.
- **Gap.** All-AXIOM-ONLY Concerns pass close gate. Designer can convene Mode B, skip Initiate Deliberation, axiom-everything, close. No four-pole work required.
- **Candidate fix.** Either (a) require ≥1 ratified PROPOSITION per session for Mode B; (b) formalize the AXIOM-ONLY-flag handling at consumer side (`design-specify` rejects AXIOM-ONLY rows from a Mode B session).
- **Priority.** Medium. Pairs with F-15.

#### F-13 — Late Concerns in DELIBERATING have no round-dispatch protocol
- **Source scenario:** S-37.
- **Gap.** Add Concern allowed in DELIBERATING. Coverage Map gains GAP. No spec for whether late Concern is auto-named in next round dispatch or stays GAP forever.
- **Consequence.** Designer can add Concern after Submit Round, blocking close indefinitely.
- **Candidate fix.** Either (a) auto-name new Concerns into next round dispatch; (b) require Concern-freeze before first Submit Round.
- **Priority.** Medium.

#### F-15 — Submit Round with zero new PROPOSITIONs advances phase
- **Source scenario:** S-41.
- **Gap.** Submit Round gate is "none pre-signal". Designer can advance DELIBERATING → RATIFYING with zero PRs submitted since prior round.
- **Candidate fix.** Gate Submit Round on ≥1 new PROPOSITION row submitted since last Submit Round, conditional on at least one Concern being un-Propositioned and not designer-marked AXIOM-ONLY.
- **Priority.** Medium. Pairs with F-12.

### Low

#### F-01 — Concern scope-statement emptiness not validated
- **Source scenario:** S-06.
- **Gap.** No emptiness or minimum-content check on Concern scope statement field. Empty / single-word Concerns pass gate.
- **Candidate fix.** Require ≥N tokens or non-empty body field for Add Concern.
- **Priority.** Low.

#### F-04 — Actor identity carrier into Clerk procedures not specified
- **Source scenario:** S-19..S-22.
- **Gap.** Schema names roles (DESIGNER, POLE, RESEARCHER, TEAM-LEAD, CLERK) but does not specify how Clerk verifies caller identity. Authority gates depend on this. Per `SKILL.md §Scope Limits`, dispatch convention is out of scope — but the authority enforcement boundary remains abstract until dispatch layer specifies.
- **Candidate fix.** Cross-skill coordination — declare actor-identity carrier (a `caller_tag` field on each procedure call?) at dispatch layer; reference from Clerk procedures.
- **Priority.** Low for committee skill (out-of-scope per SKILL.md), but blocks any real-Clerk-script implementation.

#### F-14 — Withdrawal phase-restriction described in two different ways across surfaces
- **Source scenario:** S-39.
- **Gap.** `procedures.md §Withdraw Entry` says "any phase except CLOSED". `actors.md §Designer Surface Per Phase` lists withdrawal for OPEN, ANCHORED, DELIBERATING, RATIFYING explicitly (CLOSED implicit-by-exclusion). Two surfaces, same prohibition, different forms.
- **Candidate fix.** Pick one form and propagate (probably "any phase except CLOSED" — terser, less drift-prone).
- **Priority.** Low.

#### F-16 — Cascade event audit log not recorded for idempotent status mutations
- **Source scenario:** S-42.
- **Gap.** If a row is already in REVISED-PENDING and a cascade event triggers status-mutation to REVISED-PENDING (no actual change), Clerk records no audit event. Audit trail for cascade chain is thin.
- **Candidate fix.** Append cascade event to row's audit log even when status mutation is no-op.
- **Priority.** Low.

---

## Recommended Fix Priority Order

1. **F-05 + F-06** (Critical) — extend structural-negation collision to axiom-vs-axiom same-Concern; decide cross-Concern coherence policy (accept partition limit + document, or add lint pass). Cheap, high payoff.
2. **NF-02** (High) — committee `design-brief-template.md` 6-section envelope rewrite. Worked example exists; mechanical to author.
3. **F-12 + F-15** (Medium, paired) — require ≥1 ratified PROPOSITION per Mode B session OR ≥1 new PR per Submit Round phase advance.
4. **F-08 + F-09** (Medium, paired) — pick cascade-scope rule for designer-axiom revise vs withdraw; document rationale.
5. **F-11** (Medium) — compose Reject+Withdraw OR relax close gate.
6. **NF-01** (Medium) — rename `Concern` → `Decision` (class-1 schema change; lowest risk after F-05/F-06 settled).
7. **F-03 + F-07** (High but expensive) — document syntactic-only boundary explicitly; do not invest in semantic matcher.
8. **NF-03** (Medium) — PM-facing companion brief; latent schema fields (`cost_estimate`, `reversibility_class`) parked here.
9. **F-02, F-10, F-13, F-01, F-04, F-14, F-16** (remaining Medium / Low) — pick up opportunistically alongside related sprints.

---

## Change Log

- 2026-05-23 — Initial consolidation from working-record-00.md `## Deferred Followups` + clerk-stress-test-00.md `## Findings Summary`.
