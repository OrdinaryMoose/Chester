---
status: Draft
last_reviewed: 2026-05-10
related_docs: [all]
related_adrs: [0007, 0009, 0011, 0012, 0013, 0014]
---

# Glossary

> **Superseded for current usage** by `skills/design-proof-system/references/domain/VOCABULARY.md`, which is derived from the running implementation. This glossary remains as the redesign-target reference for the proof-system redesign cascade; where it disagrees with `VOCABULARY.md`, that file wins.

Single source of truth for the design language vocabulary. Every other document refers to terms defined here rather than redefining them. Capitalized terms are load-bearing concepts; lowercase terms are general usage. New terms are added here first, then referenced.

---

## Element categories

**EVIDENCE** — A factual proposition about the codebase, the world, or established record. Treated as given (axiomatic) within the proof. Cannot be sourced as `designer`. Lives in the Engine as facts on the `evidence/N` predicate. (Domain Spec §3.1)

**RULE** — A normative constraint asserted by the Designer. The inferential framework's "warrants" — rules of inference licensing the moves between Evidence and Propositions. Must be sourced as `designer`. (Domain Spec §3.2)

**PERMISSION** — A designer-granted relief from a specific Rule, scoped by its `relieves` reference. Must be sourced as `designer`. Permits relaxation of a rule under named conditions. (Domain Spec §3.3)

**PROPOSITION** — A claim that must hold for the design to be sound. Asserted with a grounding chain referencing Evidence, Rules, and Permissions; with a collapse_test naming what fails if the Proposition is removed; with a reasoning_chain stating the IF/THEN inference; with rejected_alternatives showing considered options. (Domain Spec §3.4)

**RISK** — An identified hazard attached to specific elements via `basis`. Represents a rebuttal or reservation in the Toulmin sense. (Domain Spec §3.5)

**RESOLUTION** — A Proposition addressing a specific Concern via `problem_anchor`. The proof's structurally-significant results addressing the design's questions. Carries `ratification` metadata when approved. (Domain Spec §3.6)

**FRICTION** — A first-class element capturing tension between two existing elements (anchor_a, anchor_b) under one of the closed-set Friction Shapes. Carries a Friction Disposition stating how the tension is treated. (Domain Spec §3.7)

**CONCERN** — A problem the design must address, anchored to the problem_statement. Concerns are the targets that Resolutions must cover for closure. (Domain Spec §3.8)

**DEFINITION** — A vocabulary fixing for the proof. First-class element with status (draft / ratified / withdrawn / deprecated) and revision history. (Domain Spec §3.9)

---

## Element fields

**collapse_test** — On a Proposition: a statement of what proposition fails when the Proposition is removed. Self-reported in current architecture; mechanically verifiable in the forward-solve paradigm via counterfactual queries. (Domain Spec §3.4)

**reasoning_chain** — On a Proposition: prose stating the IF/THEN inference from grounding to claim. (Domain Spec §3.4)

**rejected_alternatives** — On a Proposition: list of alternatives considered and rejected, with reasons. Currently a string list; future direction is to make each a typed REJECTED_ALTERNATIVE element. (Domain Spec §3.4)

**grounding** — On a Proposition: a list of elements supporting the Proposition. In forward-solve paradigm, this becomes the Horn-clause body. (Domain Spec §3.4)

**basis** — On a RISK: a list of elements the risk attaches to. (Domain Spec §3.5)

**problem_anchor** — On a Resolution: the Concern this Resolution addresses. (Domain Spec §3.6)

**relieves** — On a PERMISSION: the RULE this permission relaxes. (Domain Spec §3.3)

**anchor_a / anchor_b** — On a FRICTION: the two elements the friction holds between. (Domain Spec §3.7)

**inference_pattern** — On a Proposition (proposed): a closed-set tag naming the kind of inference move (grounds-imply-conclusion, rule-applies-to-case, permission-licenses-relaxation, definition-substitution, proposition-composition). Surfaces inference type at the rendering layer. (Domain Spec §3.4, ADR-0004)

---

## Closed-set enumerations

**Action labels** — The closed set describing how the agent came to assert a field's value: `verbatim-preserve`, `reshape`, `gap-fill`, `infer`, `derive`. Non-verbatim labels require a reasoning_chain. (Domain Spec §6.2)

**Friction Shapes** — The closed set of friction types: `proposition-proposition-opposing-pull`, `resolution-rule-conflict`, `permission-risk-linkage`, `concern-concern-competition`. (Domain Spec §3.7)

**Friction Dispositions** — The closed set describing how a friction is treated: `lived-with`, `relieved-by-exception`, `dissolved-by-revision`, `dissolved-by-scope-cut`, `not-really-friction`. The last three are terminal (transition the friction to withdrawn status). (Domain Spec §3.7)

**Withdrawal Dispositions** — The closed set describing why a non-friction element was withdrawn: `consolidated`, `superseded`, `found-redundant`, `found-incorrect`, `scope-removed`. Plus the sentinel `unclassified` for backfilled records. (Domain Spec §3.10)

**Consent Sources** — The closed set distinguishing authorship of mutations: `designer`, `agent-proposed-designer-confirmed`. (Domain Spec §5.1)

---

## Lifecycle and authority

**Approval / Ratification** — The Designer's structural endorsement of an element. In the forward-solve paradigm, an `approved/3` engine fact required as a body literal in the element's defining rule. Without the approval fact, the element does not enter the derived proof. Synonyms: ratification (formal name), approval (operational name). (Domain Spec §5.2, ADR-0003)

**consent token** — A required authorization argument on every mutating operation. Validated structurally at the Interface boundary and semantically at the Domain boundary. Fields: `source` (from Consent Sources), optional `rationale`. (Domain Spec §5.1)

**Round** — A monotonically increasing counter incremented on each batch of mutations. Used in revision tracking, two-yes flag management, and audit trail. (Domain Spec §4.1)

**Phase Transition Round** — The round at which the proof transitions from initial open to active mutation. Used in closure conditions to detect post-transition revision. (Domain Spec §4.2)

**Body advancement** — The signal that real work occurred between two states (adds, revisions, withdrawals — not mere flag changes). Computed as set delta on engine facts. (Domain Spec §4.3)

**Two-yes flags** — The pair `closingArgPresentedRound` and `closingArgGoRound`. Closure requires both to equal the current round. Cleared automatically on any mutation, ensuring the closing argument reflects current state. (Domain Spec §5.3)

**First-yes precondition** — The gate that refuses to present a closing argument while any active element is in draft (unratified). (Domain Spec §5.4)

**Closure** — The state in which the proof has structurally satisfied all closure conditions and the Designer has confirmed go-choice in the current round. Terminal except via explicit re-open. (Domain Spec §7)

---

## Proof artifacts

**Closing argument** — The structured artifact derived from current proof state, presenting the proof's argument: problem, givens, vocabulary, framework, Propositions, Resolutions, frictions, rejected register, closure status. Read-only; derivable at any phase. (Domain Spec §8)

**Phantom partition** — Withdrawn elements preserved in the closing argument with their disposition tags intact. The proof's record of "what was considered and rejected." (Domain Spec §8.2)

**locked Concerns** — The Concerns set considered fixed once closure is permitted. (Domain Spec §3.8)

**operation log** — The append-only sequence of every mutation with round, op type, entity id, consent, provenance. The proof's audit trail. (Domain Spec §4.4)

**closure provenance** — The derivation chain for each cited element in the closing argument, mapped from the operation log. (Domain Spec §8.3)

---

## Engine concepts

**Engine** — The pure Datalog evaluator. Knows nothing about proofs. Stores facts and rules; evaluates queries; reaches fixed point. (Engine Spec §1)

**predicate** — A named relation symbol carrying an arity (number of argument positions). The Engine treats predicates of different arity as distinct relations (`p/2` and `p/3` are not the same predicate). (Engine Spec §2)

**atom** — A predicate symbol applied to a tuple of terms (constants or variables). The building block of facts (ground atoms) and rule heads/bodies (atoms that may contain variables). (Engine Spec §2.1, §2.2)

**Horn clause** — A rule whose head is a single positive atom and whose body is a conjunction of atoms (each positive or, in this dialect, negated under stratification). (Engine Spec §2.1)

**fact** — A ground tuple: predicate symbol plus argument values. (Engine Spec §2.1)

**rule** — A Horn clause: head atom plus body atoms. The head is derived when the body is satisfied. (Engine Spec §2.2)

**EDB (extensional database)** — The set of base facts asserted by the Domain into the Engine. Also called the "fact store." (Engine Spec §2, §5.1)

**IDB (intensional database)** — The set of facts derivable by applying rules to the EDB. Also called the "derived set." Together, EDB + IDB = the fixed point. (Engine Spec §2, §5.3)

**rule store** — The set of Horn-clause rules defined in the Engine. Separate from the EDB (base facts) and the IDB (derived facts); rules are the program, not data. (Engine Spec §5.2)

**query** — A pattern matched against the fixed point (EDB ∪ IDB), returning bindings. (Engine Spec §2.3)

**fixed point** — The state where applying all rules produces no new facts. Datalog's termination guarantee says this state always exists and is reached. (Engine Spec §3.1)

**stratified negation** — Negation-as-failure restricted to ensure decidable evaluation. Rules are organized into strata by negation dependency; each stratum is fully evaluated before any stratum whose rules negate predicates derived in it. (Engine Spec §3.3)

**snapshot / restore** — Engine-level primitives capturing and restoring full state (EDB, rule store, IDB, and per-fact metadata), used by the Domain to implement counterfactual queries. (Engine Spec §4.6)

**transaction** — A bounded sequence of Engine mutations that commit atomically or roll back together. Mutations buffered inside a transaction are visible to queries within the same transaction (read-own-writes). Exposed through `ITransaction`; the Domain wraps multi-fact operations in it. (Engine Spec §4.8, ADR-0009, ADR-0013)

**read-own-writes** — The transaction-visibility property that queries inside an open transaction see the transaction's own buffered mutations, not just the committed state at the time of `begin()`. Load-bearing for the ratify walkthrough (Architecture §5.1), which composes pre-condition queries, an assertion, and post-condition queries inside one transaction. (Engine Spec §4.8, ADR-0013)

**derivation tree** — The structure showing why a fact was derived: which rule fired, which body atoms supported it, and recursively. Returned by the `explain` operation. (Engine Spec §4.5)

**counterfactual query** — A query evaluated against a snapshot with specific facts retracted, used to verify claims like collapse_test. (Domain Spec §11)

---

## Architecture concepts

**Engine Layer** — The bottom layer; pure Datalog evaluator. (Architecture §2.1)

**Domain Layer** — The middle layer; proof concepts and policies. (Architecture §2.2)

**Interface Layer** — The top layer; MCP tools, persistence, wire format. (Architecture §2.3)

**hexagonal / ports-and-adapters** — The architectural style adopted: Domain at center, Engine as inference port, Interface as protocol port. Dependencies flow inward only. (Architecture §1, ADR-0001)

**inward dependency rule** — The constraint that Interface depends on Domain, Domain depends on Engine, and no upward dependency exists. (Architecture §3)

**port** — A named, narrow, role-specific interface that an adapter implements. The architecture has substrate-facing ports (`IFactStore`, `IRuleStore`, `IQueryEngine`, `ISnapshotRestore`, `IExplain`, `ITransaction`), delivery-facing ports (`IElementMutation`, `IRatification`, `IFrictionManagement`, `IDefinitionManagement`, `IClosureSurface`, `IRenderSurface`, `IQuerySurface`), and cross-cutting ports (`IConsentVerification`, `IPersistenceRepository`, `IClock`, `IIDAllocator`). (Architecture §4, ADR-0012 as amended by ADR-0013)

**adapter** — A concrete implementation of one or more ports. The MCP adapter implements the delivery ports; the custom evaluator adapter implements the substrate ports; the JSON-file adapter implements `IPersistenceRepository`. (Architecture §2.4, §4)

**`IClock`** — Cross-cutting port providing time and round counter access. Injected to make Domain operations deterministic. (Architecture §6.7, ADR-0009)

**`IIDAllocator`** — Cross-cutting port providing identifier generation. Injected to make ID allocation pluggable and tests deterministic. (Architecture §6.8, ADR-0009)

**`IFactStore`** — Substrate port covering base-fact lifecycle. Surface: `assertFact`, `retractFact`, `factExists`. The Domain asserts element facts and retracts them on withdrawal. (Architecture §4.1, Engine Spec §4.1, ADR-0012)

**`IRuleStore`** — Substrate port covering rule lifecycle. Surface: `defineRule`, `undefineRule`, `getRule`. Stratification analysis runs at `defineRule` time; cyclic-negation rule sets are rejected at definition rather than at evaluation. (Architecture §4.1, Engine Spec §4.2, ADR-0012)

**`IQueryEngine`** — Substrate port covering query evaluation. Surface: `derive`, `query`, `count`, `exists`. Excludes explanation (split into `IExplain`) and snapshot/restore (split into `ISnapshotRestore`). (Architecture §4.1, Engine Spec §4.3, §4.4, ADR-0012)

**`ITransaction`** — Substrate port providing atomic multi-fact mutation semantics on the Engine, with read-own-writes visibility for queries inside the transaction. (Architecture §6.9, Engine Spec §4.8, ADR-0009, ADR-0013)

**`ISnapshotRestore`** — Substrate port exposing snapshot/restore primitives for counterfactual queries. The Domain uses it for collapse-test verification and per-element "would closure still hold without this?" probes. (Architecture §4.1, ADR-0012)

**`IExplain`** — Substrate port producing derivation trees for derived facts. Consumed by render adapters answering "why does this fact hold?" and by the Adversary for inference-chain probing. Split from `IQueryEngine` because read-only auditing clients depend on explanation without depending on bulk query. (Architecture §4.1, ADR-0012)

**lane** — The subgraph of elements participating in a single Concern's argument: the Concern, its ratified Resolutions, the Propositions grounding those Resolutions, and the transitively-cited Evidence/Rules/Permissions. Lane membership is a **derived Datalog predicate** (`in_lane(Proposition, Concern)`), not an asserted field on Propositions. Multi-lane Propositions appear naturally when multiple Resolutions cite them. (Domain Spec §10.5, ADR-0011)

**lane-slice render** — A render mode showing one Concern's lane in isolation, implemented as a query against the derived `in_lane` predicate. (Domain Spec §10.5, ADR-0011)

---

## Roles

**Designer** — The human authority who specifies the problem, asserts Rules and Permissions, and ratifies elements. The proof's load-bearing semantic checkpoint. (ConOps §2.1)

**Agent** — The LLM that constructs the proof: proposes elements, walks the grounding chain, presents closing arguments. Subject to channeling architecture. (ConOps §2.2)

**Adversary** — A separate agent (or process) that attacks a presented proof, looking for cheap-path failures. Future role; not yet implemented in the engine. (ConOps §2.3)

---

## Philosophical terms

**Channeling** — The architectural strategy of redirecting the agent's completion drive toward structural proof construction rather than implementation. The system gives the agent finishable structural moves so the agent's drive doesn't divert into code. (Vision §2)

**Completion drive** — The LLM property of strong pressure to produce visible useful output on each turn. Channeling accepts this as fixed and substitutes the target. (Vision §2.1)

**Cheap-path-vs-feasibility** — The distinction between solutions that satisfy structure with minimal effort and solutions that genuinely address the problem. The architecture tries to make cheap paths unavailable, concentrating remaining ones at the human-judgment boundary. (Vision §2.4)

**Structural-vs-semantic gap** — The gap between what the system can mechanically check (structural well-formedness) and what it cannot (genuine soundness). The Designer's ratification fills this gap. The forward-solve paradigm narrows it via counterfactual queries. (Vision §3.2)

**Two-player game with asymmetric authority** — The architectural fact that the Agent and Designer have structurally different powers. The Agent can add, revise, withdraw. The Designer can ratify and assert axioms. Removing this asymmetry collapses the architecture. (Vision §2.6)

**Forward-solve paradigm** — The shift from "agent writes typed objects, procedural checker validates" to "agent asserts facts and Horn-clause rules, engine forward-chains to fixed point, closure is a query." Approval is preserved as a body literal in element rules. (ADR-0007)

---

## Document conventions

**ADR (Architecture Decision Record)** — An immutable record of a single decision with context and consequences. Kept in `decisions/`. Numbered sequentially; never reused. Status changes ("Superseded by NNNN") but content does not.

**Cascade documents** — The numbered documents 00-09 in this folder, organized in tiers from philosophy (top) to implementation (bottom).

**Front matter** — The YAML block at the top of each document carrying status, last reviewed date, and cross-references.

**Single source of truth (SSoT) discipline** — The convention that each concept has exactly one home in the documentation. Vocabulary in this glossary; decisions in ADRs; specifications in their respective spec docs. Other documents link rather than redefine.
