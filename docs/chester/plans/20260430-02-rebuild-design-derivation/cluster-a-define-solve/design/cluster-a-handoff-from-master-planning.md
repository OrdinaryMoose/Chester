# Cluster A — Handoff from Master Planning

File: `cluster-a-define-solve/design/cluster-a-handoff-from-master-planning.md` dtd 2026-04-30

For: the cluster A `design-large-task` session opening the `cluster-a-define-solve` sub-sprint under master plan `20260430-02-rebuild-design-derivation`.

This handoff is self-contained. It transfers ratified context from the master-planning session into the cluster A design cycle so cluster A can run its own Understand → Solve without rebuilding shared ground.

---

## Cluster A Scope (from master-plan §4.1)

**Endstate point:** 5 — formalize end criteria; define what we are solving; shape it to design-specify's input requirements.

**Objective.** Define the **resolution-claim element category**. Settle naming and concrete shape (new element type vs NC extension vs other). Define source rules, required fields, integrity-check semantics, closure-check contribution. Fold in **hypothesis-methodology validation**: what makes a problem statement well-formed enough to carry resolution claims.

**Exit criteria (from master plan):**
- Element naming and shape locked
- Element schema locked (required fields, source rule, integrity-check semantics)
- Closure-check extension drafted (how presence and coverage are validated)
- Hypothesis-methodology criteria defined (what Phase 4b expects of the problem statement at opening)
- Cluster A design brief committed; specify run; plan-build run; execute-write delivered code changes if any are needed at this stage

**Dependencies:** none. Cluster A is the foundation. Every decision locked here becomes a Rule for clusters B and C.

---

## Reading Order for the Cluster A Session

1. `/home/mike/Documents/CodeProjects/Chester/CLAUDE.md` — project-wide rules.
2. `docs/chester/working/20260430-02-rebuild-design-derivation/CLAUDE.md` — master-plan commitments (this is normative).
3. `docs/chester/working/20260430-02-rebuild-design-derivation/master-plan.md` — cluster sequence + locked context.
4. This file — cluster A starting context.
5. `design/rebuild-design-derivation-understanding-state.json` (master-level) — raw Phase 4a state from master-planning. Reference only; the curated facts below are the contract.

Skipping (2) or (3) means inheriting commitments without seeing them.

---

## What Is Locked (Inherited as Rules)

These are **read-only inheritance** from the master plan. Cluster A does not revise.

### Immutable proof element types (RULE-1)

`Necessary Condition` (NC), `Evidence`, `Rule`, `Permission`, `Risk`, `Problem statement`. Schemas, source rules, and required fields are frozen. Cluster A must not propose changes to these.

### Phase names (RULE-2)

`Phase 4a` = Understand stage. `Phase 4b` = Solve stage. Immutable.

### Designer-ratified core tenets

- **Design = the problem (what), not the implementation (how).** Phase 4a owns the what; mechanism shapes belong in Phase 4b or downstream (RULE-5).
- **Agent has solve-drive — designed-for.** The system gives the agent the problem we want it to solve. No cluster proposes prohibiting drive expression (RULE-4).
- **`design-specify` generates solutions** — not the proof. Proof produces input for specify; specify owns architectural shape choice (RULE-3).

### Cluster sequencing (RULE-9)

Cluster A executes first. Cluster B reads A as Rules; Cluster C reads A and B as Rules. No parallel execution.

### Phase 4a ↔ Phase 4b vocabulary alignment (RULE-10)

Phase 4a's formalized language (cluster C scope) must transition into Phase 4b without translation. Cluster A's resolution-claim element must therefore be shaped so Phase 4a can produce it — not a Phase-4b-only construct.

### Phase 4b validity bias (RULE-6)

Phase 4b solve is presumed valid and sufficient. Cluster B's default is confirmation, not refactor. Cluster A's decisions may force closure-check changes; those count as gaps cluster B resolves, not cluster A.

### Code authority (RULE-8)

The Chester repo source is the sole authority for current Phase 4a / Phase 4b state. Prior session briefs are reference only.

---

## The Resolution-Claim Five Attributes (RULE-7 — locked)

Whatever cluster A produces — new element type, NC extension, alternative shape — must carry all five. **Naming and concrete shape are open; the five attributes are not.**

1. **Observable** — names a state of the world a developer or test could check.
2. **Designer-ratified** — the designer commits that this observable counts as resolution.
3. **Problem-statement-anchored** — explicitly resolves a named aspect of the hypothesis.
4. **Forward-looking** — describes a future state the design will produce, not a current state Evidence describes.
5. **Non-restrictive** — does not limit the design space (Rules do that); certifies the design space's exit condition.

---

## What design-specify Needs (the consumer-pull shape)

design-specify must generate solutions that are **feasible**, **acceptable**, and **complete**. Specify needs three artifacts to make those claims:

- A **constraint envelope** — what the design cannot violate / must respect / must avoid. Today fully expressible in the five immutable element types.
- A **resolution criterion** — what observable state counts as the problem being solved. **Not today expressible in any existing element. This is the gap cluster A closes.**
- A **coverage map** — every aspect of the problem statement traces to at least one constraint and one resolution criterion. Concrete shape settled inside cluster A or B.

Plus support material that collapses into existing elements: industry context (Evidence with `source: "industry"`), priority signals (Rules), tension catalog (Risks with multi-element basis), permission visibility (Permission element).

---

## Master-Planning Evidence (EVID-1..7 — read-only inheritance)

- **EVID-1.** `checkClosure` (`skills/design-large-task/proof-mcp/metrics.js:202-273`) verifies six structural properties; none reference `state.problemStatement`.
- **EVID-2.** Brief template's Acceptance Criteria section instructs agent prose authoring at Closure; no MCP tracking, no upstream source (`skills/design-large-task/references/design-brief-template.md:170-180`).
- **EVID-3.** `ncon-05` transcript shows agent solve-drive leaking as solve-shape framings under problemfocused flow; prior sprint `20260425-01` established saturation scoring is gameable.
- **EVID-4.** Industry V&V split (NASA / ISO 29148) institutionalizes verification (built it right) vs validation (built the right thing) — the same axis cluster A's resolution-claim element formalizes inside the proof.
- **EVID-5.** Solve-drive as designed-for is recurring across multiple prior Chester sprints; each addressed it via a different mechanism. Cluster A does not relitigate.
- **EVID-6.** Five existing element types are sufficient for everything except resolution claims. Collapse test (master-planning Step 6): industry context, priority signals, tension catalog, coverage map, and SC cross-verification mechanism collapse cleanly into existing elements with field additions or basis attachments. Only the resolution-claim category does not collapse without semantic blur.
- **EVID-7.** design-specify input requirements derived from master-planning Steps 3 + 7: constraint envelope + resolution criterion + coverage map.

Cluster A may add cluster-internal Evidence to its own proof. It may not revise master-level Evidence.

---

## Working Glossary (revisable inside cluster A scope)

- `Sufficient Condition` — working name for the resolution-claim element. Cluster A settles final naming. Candidates surfaced during master-planning: `Sufficient Condition`, `completion criterion`, `resolution criterion`, `exit condition`. Naming choice will propagate to design-specify and plan-build vocabulary downstream.
- `Pre-seeded proof` — working name for Phase 4a output shape. Cluster B settles the transition mechanism; cluster A may treat as opaque.
- `Discovery lens` / `Scope` / `Givens` / `Dependencies` — Phase 4a structural concepts. Cluster C scope — cluster A does not modify.

`Acceptance Criteria` is **deprecated**. Vague semantics; replaced by the resolution-claim concept whose final shape lands in cluster A.

---

## What Cluster A Must Decide (Open Questions)

These are the core open items for the cluster A Understand → Solve cycle. Expect Phase 4a discovery lenses to surface more.

- **Naming.** `Sufficient Condition` vs `completion criterion` vs `resolution criterion` vs `exit condition` vs other. Choice affects vocabulary in design-specify (`AC-{N.M}` → `??-{N.M}`), plan-build, brief template.
- **Shape.** New element type vs NC extension vs alternative structure. The five attributes (RULE-7) constrain the choice; shape must carry all five.
- **Schema.** Required fields, source rule (designer-only? or carries Evidence-style verifiability?), integrity-check semantics, basis-link semantics, ordering / identity rules.
- **Closure-check extension.** How presence-of-resolution-claims is verified. How coverage (every problem-statement aspect → at least one resolution claim) is verified. How non-restrictiveness is verified (since "doesn't restrict the design space" is structurally hard to check).
- **Hypothesis-methodology criteria.** What makes a `Problem statement` well-formed enough to carry resolution claims at Phase 4b opening. Today the proof initializes a problem statement string with no structural shape requirement; cluster A may need to formalize what "named aspects" means so coverage tracing is mechanical.
- **Field-level provenance.** Whether resolution claims need source-attribution (designer-only, designer-with-Evidence-anchor, etc.) — the Acceptance-Criteria failure mode was agent-imagined material; cluster A's source rule must close that.

---

## Risks Cluster A Inherits (Awareness Only)

From master-plan §7 — for awareness; cluster A may surface cluster-specific risks against its own proof without master-level escalation unless they invalidate a master Rule:

- **RISK-1** — Naming proves divisive; downstream cleanup may follow.
- **RISK-2** — Hypothesis-methodology validation harder than estimated; cluster A scope may expand.
- **RISK-3** — Phase 4b confirmation surfaces real gaps; default-preservation bias holds at master level, but cluster B may need to refactor parts cluster A's decisions touched.

---

## What This Handoff Is Not

- **Not a design.** Cluster A's design-large-task runs its own Understand → Solve cycle and produces its own design brief. This handoff is seed context, not a draft solution.
- **Not a proof state.** The master-level `understanding-state.json` is master-planning's Phase 4a artifact. Cluster A's proof initializes fresh under its own design-large-task invocation.
- **Not exhaustive.** Read master-plan.md §2 (Endstate Target / Genesis), §4.1 (Cluster A planning unit), §5 (Evidence Register), §6 (Rules), §7 (Risks) for full context. This file is the orientation; master-plan.md is the contract.

---

## Pointers

- Master plan: `docs/chester/working/20260430-02-rebuild-design-derivation/master-plan.md`
- Master CLAUDE.md: `docs/chester/working/20260430-02-rebuild-design-derivation/CLAUDE.md`
- Master Phase 4a state (raw): `docs/chester/working/20260430-02-rebuild-design-derivation/design/rebuild-design-derivation-understanding-state.json`
- Phase 4b proof source: `skills/design-large-task/proof-mcp/`
- Phase 4a Understanding MCP source (three flows): `skills/design-large-task/understanding-mcp-classic/`, `skills/design-large-task/understanding-mcp-problemfocused/`, `skills/design-large-task/understanding-mcp-team-interview/`
- Brief template: `skills/design-large-task/references/design-brief-template.md`
- Closure metrics: `skills/design-large-task/proof-mcp/metrics.js`
