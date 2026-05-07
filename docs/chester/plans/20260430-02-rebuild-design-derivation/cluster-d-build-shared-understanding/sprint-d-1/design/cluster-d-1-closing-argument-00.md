# Cluster D.1 — Closing Argument

This document is the closing argument for sprint D.1 (Build Proof Layer). It is presented for designer review at round 1; the view stamp is recorded. Per cluster B.2 inheritance, the designer's "go" applies bulk ratification to every Draft Necessary Condition and Resolve Condition contained in this argument, after which closure is recorded. Any mutation between view and go forces re-presentation of a fresh closing argument.

## What this proof is about

D.1 designs the proof layer of the unified design system that replaces the legacy Phase 4a / Phase 4b structure. The proof layer is a service: it owns the formal language, the closed element set, the CRUD operations across that set, the closure mechanism, and the artifact handed to design-specify. It has no dependency on the presentation layer that wraps it. The presentation layer (which D.2 will design) will consume this proof layer by calling its tools and reading its state.

The problem statement governing every commitment in this argument reads as follows:

> How do we design the proof layer that delivers commonly understood design requirements to the Specify system — formal language, faithful state management, designer-consent gating, and closure handoff — so that the presentation layer can build shared understanding against it?

## What worries this proof addresses

Five atomic concerns anchor the design. Each names a worry without prescribing a mechanism.

The first concern, **C-1**, is that the skill might begin a session without enough seed information to produce a useful proof. If the agent walks in with nothing but an invocation prompt, the proof opens against thin material and any downstream commitments rest on weak foundations. The concern is structural, not procedural.

The second concern, **C-3**, is that proof state will drift from the designer's intent over time. The proof accumulates commitments, evidence, retractions, and ratifications across many rounds; without active discipline, the meaning of an element can shift silently, the audit trail can rot, and shared understanding erodes without anyone noticing.

The third concern, **C-4**, is that the agent might advance the proof without explicit designer consent. Even with the best intentions, an agent that interprets a designer question as authorization, or that adds elements on its own initiative, breaks the contract that the designer is the source of authority for restrictive claims.

The fourth concern, **C-5**, is that the closure handoff to design-specify will not carry enough material to produce correct architecture. If the artifact is partial, design-specify produces partial spec; partial spec produces architecture that misses concerns or violates rules; the designer's intent fails to reach implementation.

The fifth concern, **C-6**, is that closure could happen without genuine mutual agreement on the adequacy of what is being handed off. If designer and agent are not aligned at the closure boundary, the downstream sprints (specify, plan-build, execute-write) operate on inputs the designer did not actually endorse.

All five concerns are ratified, and the Concerns list is locked.

## How the proof addresses each concern

The proof addresses each concern through a Resolve Condition (the observable end-state) and a set of Necessary Conditions (the structural commitments that must hold for the end-state to obtain). All Resolve and Necessary Conditions in this argument are Drafts pending the designer's bulk-ratification at "go".

### C-1 — Sufficient seed information

The Resolve Condition (RC-1) for this concern is observable in the operation log: when the skill is invoked, the agent assembles a seed packet that includes a candidate problem statement, the initial Concerns derived from designer prompt and parallel exploration, the Evidence drawn from that exploration, and the restructuring action labels prescribed by cluster B.1's closed set. After the designer reviews the packet and issues an open directive, `open_proof` fires and receives a designer-source consent token capturing that directive. The operation log makes this sequence visible: the directive precedes the open.

The supporting Necessary Condition (NC-1) commits the proof to enforcing seed shape at the boundary. Submissions that omit the problem statement, initial Concerns, initial Evidence, or restructuring action labels are rejected. Free-form unstructured seeds, designer-only seeds, and incremental seeding through multiple boundary crossings are explicit alternatives that have been considered and rejected: the first defeats validation, the second loses the agent's exploration contribution, and the third complicates the open-gate semantics already shipped by cluster B.1.

### C-3 — Proof state faithfulness

The Resolve Condition (RC-2) for this concern is element-level auditability. At any round during the session, the designer can call `get_proof_state` and receive a structured response showing every active element with its source, ratification record, and revision history; every retired element rendered as a Phantom with a closed-set disposition; and every entry's audit chain reconstructable from log fields. Inspection at any round is sufficient evidence that faithfulness holds.

Twelve Necessary Conditions support this concern, each addressing an independent failure mode:

**NC-2** locks the conceptual category set at nine: seven typed elements (NC, Evidence, Rule, Permission, Risk, RC, Friction) plus Concerns and Definitions. Phantom is a withdrawal-derived status, not a separate category. Adding new categories is a charter-level decision, not an in-band addition.

**NC-3** binds authority to every element through a closed source enum: codebase, industry, prior-art, session-observation, designer (Rules and Permissions only), and agent-derivation (NCs, RCs, auto-created Friction, Draft Concerns, Draft Definitions). Concerns and Definitions follow Approval-tracked source rules; Friction's schema gains an explicit source-field extension during specify; phantoms inherit their source from the pre-withdrawal element.

**NC-4** extends provenance from the open boundary (where cluster B.1 already provides it) to every state-mutating operation. Each mutation records who initiated it, what changed, and why. The exact provenance shape per operation class — mutation, ratification, withdrawal, lock — is decomposed during design-specify rather than fixed here.

**NC-5** establishes universal withdrawal grammar. Every category supporting deletion preserves the element with a closed-set disposition; status transitions to withdrawn (Phantom-rendered). Specific per-type disposition sets are ratified during specify. The architectural commitment is that no category permits silent deletion.

**NC-6** completes the CRUD surface. Each of the nine categories supports full Create, Read, Update, and Delete operations through documented tool calls. Phantom is a status transition on existing categories, not a separate CRUD target. Pre-existing partial coverage — Concerns lacking withdraw, Definitions lacking any API — is closed as part of D.1's implementation work.

**NC-7** establishes the Definitions API. The proof MCP exposes a `manage_definitions` tool with add, revise, deprecate, and ratify operations following the Approval-tracked lifecycle of RULE-5. The API also exposes an overlap-candidate query that surfaces likely-related entries for designer disambiguation; the specific overlap algorithm is design-specify territory. The discipline of using ratified Definitions for term resolution lives in the presentation layer.

**NC-13** formalizes friction detection as a continuous behavior. On every state-mutating operation, the proof runs detection. The permission-risk-linkage shape auto-creates a Friction element with source agent-derivation, inheriting the parent operation's consent. The other three detection shapes — NC-NC opposing-pull, RC-Rule conflict, and Concern-Concern competition — emit hints for agent confirmation. Already-dismissed friction is not re-detected.

**NC-14** locks round increment semantics: `state.round` increments once per state-mutating call, not once per individual operation within a batched call. Read-only operations do not increment the counter. The round-equality requirement of NC-11 depends on this discipline.

**NC-15** introduces schema versioning. The proof state carries a `schemaVersion` field. The proof MCP refuses to load a state whose version exceeds the runtime version. Backwards-compatible additions use backfill on load (preserving the existing `loadState` pattern); breaking changes require an explicit migration path. Schema evolution categories are defined during specify.

**NC-17** commits to atomic persistence. State writes are atomic per state-mutating call. A failure during save returns an error and leaves the state file unchanged. Read after write reflects committed state. No partial-state corruption is permitted.

**NC-18** closes the per-element status field gap. Concerns and Definitions gain a `status` field with values Draft and Ratified, mirroring the existing RC ratification field. NCs gain an analogous field. The existing `concernsLocked` boolean is preserved as the stronger gate (all Concerns Ratified plus no further additions permitted).

**NC-19** documents the concurrency model: the proof MCP serves a single-writer model. Multi-writer access against the same state file is unsupported and produces undefined behavior. Locking is out of D.1 scope; the calling environment ensures single-writer discipline. Multi-writer support is an explicit out-of-scope evolution.

### C-4 — Designer-consent gate on advancement

The Resolve Condition (RC-3) for this concern is the consent-token enforcement at the proof boundary. When an operation arrives without a structurally well-formed consent token matching the NC-8 schema, the proof rejects with an error. Every committed mutation in the audit log carries a structurally valid token. Token shape validation is structural; designer-state authenticity is outside the proof's threat model — the proof trusts the calling agent to attach a token reflecting actual designer-source state, and presentation-layer integrity is D.2's responsibility.

The supporting Necessary Condition (NC-8) defines the token: a `consent` argument of shape `{ source: "designer" | "agent-proposed-designer-confirmed", rationale?: string }`. Read operations require no token. The token's source value distinguishes designer-direct operations from agent-proposed-then-confirmed flows, but the proof does not authenticate; it checks shape. Auto-created Friction inherits the parent operation's token rather than carrying its own. Free-form mutation, presentation-only enforcement, and per-tool ad-hoc semantics were considered and rejected.

### C-5 — Specify handoff fidelity

The Resolve Condition (RC-4) for this concern is observable downstream: when the design brief rendered from D.1's closure artifact is consumed by `design-specify`, specify produces a complete spec without referring back to the proof MCP for missing material. Every Concern, RC, NC, Rule, Permission, Risk, Friction, Definition, and provenance chain referenced by specify is present in the brief and traceable through to the closure artifact.

Three Necessary Conditions support this concern.

**NC-9** specifies the closure envelope contents and applies a hard gate. The closing argument carries the problem statement, ratified Concerns with descriptions, ratified RCs with five attributes, ratified NCs with full structure, active Rules, active Permissions, active Risks, active Friction with disposition, phantom NCs/RCs/Friction with disposition, ratified Definitions, the composite score, and the closure_permitted flag. The hard gate: `present_closing_argument` refuses to produce a closing argument if any Concern is not Ratified or if `concernsLocked` is false.

**NC-10** preserves the existing pattern: `present_closing_argument` is a pure function of proof state with no side effects. Multiple calls in the same round produce identical output. Mutations between calls invalidate the closing argument flags.

**NC-16** extends the envelope to carry provenance for every cited element. Each element appearing in the closure artifact includes its source field, derivation chain (for agent-derived NCs and RCs), ratification record (when ratified, who confirmed), and restructuring action label and source citation where applicable from open_proof seeding. Specify consumes the proof envelope with a full audit trail and can trace any element back to its origin.

### C-6 — Mutual agreement on specify-input adequacy

The Resolve Condition (RC-5) for this concern captures the procedural agreement gate at D.1 closure. The closure event records only when the designer issues view (`present_closing_argument`) and go (`confirm_closure_go`) in the same round. The closure artifact frozen at that moment matches exactly what the designer reviewed. Any mutation between view and go forces re-presentation, and the designer's go applies only to the artifact actually viewed. Architecture-correctness validation of the closure artifact happens downstream — through spec review during design-specify, plan hardening during plan-build, and test pass during execute-write. RC-5 captures the procedural mutual-agreement gate at the D.1 closure boundary; it does not promise that the inputs will produce correct architecture, because that promise is verified by downstream processes.

Two Necessary Conditions support this concern.

**NC-11** models the closure gate as three states. Pending — closing argument not yet presented. Presented — view stamp recorded for round N, awaiting go. Confirmed — both stamps recorded for the same round N, closure achieved. Go advances Presented to Confirmed. Mutation clears Presented to Pending. Absence of either action keeps the gate in Presented; designer stall is a valid pause state, distinct from disagreement. Designer disagreement is expressed via mutation. Round-equality between view and go is enforced.

**NC-12** addresses what happens after go. Once `confirm_closure_go` fires, the closure artifact for that round is frozen. Subsequent mutations require an explicit re-open operation that transitions `proofStatus` back to open. The re-open mechanism — its tool surface, its semantics for closure-artifact retention, its closure-flag reset — is part of D.1 scope and is designed in this sprint.

## Rules in force

Nine Rules govern this proof, inherited from cluster D's session work and renumbered for D.1.

**RULE-1** and **RULE-2** are the organizing principles: "Design is the code" and "The purpose is to create Shared Understanding." Together they assert that the design medium is the formal language itself, and that the system exists to produce shared alignment between agent and designer that delivers commonly understood requirements to design-specify.

**RULE-3** is the one-system architecture commitment: the design conversation runs continuously under the proof MCP from session start, with no Phase 4a / Phase 4b boundary. The legacy two-stage vocabulary is paper trail only.

**RULE-4** locks the Resolve Condition shape inherited from cluster A: five attributes (observable, approval-tracked, problem-statement-anchored, forward-looking, non-restrictive), Draft and Ratified states, sequential ratification.

**RULE-5** establishes Definitions as a proof-state extension at the G1 path with the manage_definitions tool and the Approval-tracked lifecycle.

**RULE-6** through **RULE-9** carry the Approval-tracked discipline. Concerns are individually approval-tracked (RULE-6). Evidence is reference material requiring no approval (RULE-7). Necessary Conditions are individually approval-tracked (RULE-8). Two-tier ratification governs timing: Concerns ratify mid-round individually, while RCs and NCs bulk-ratify at closing argument via the designer's "go".

## Evidence

Nineteen pieces of Evidence ground the commitments in this proof. They distribute across three sources. Eight come from the codebase: the closed element-type enum, the open_proof-only provenance attachment, the manage_concerns API limitations, the per-element approval state gap, the Phantom mechanism, the two-yes gate implementation, the closing argument derivation pattern, and the Definition API gap. Four come from prior art within the Chester project: cluster A's RC five attributes, cluster B.1's restructuring action label set with provenance, cluster B.2's Friction and Phantom mechanics with closing argument derivation, and the cluster C closure-without-delivery and reframe lessons. Seven come from industry: W3C PROV-O for assertion-level provenance, the Architectural Decision Record pattern with supersedes-chains, event sourcing append-only logs, refinement types for atomic-claim discipline, Macaroons for capability-based bearer tokens, BPMN parallel-gateway approval semantics, and LLVM IR provenance discipline. All Evidence is active; none has been withdrawn.

## What is absent

There are no active Permissions, Risks, Friction, or Phantoms in this proof. Definitions have not been authored at this stage; NC-7 commits the proof to providing the Definitions API in implementation, with specific Definitions to be authored either during execute-write or in subsequent sprints as terms emerge. The absence of these element types is not an oversight; the proof is at architectural altitude and the elements that exist are sufficient to express the commitments at this altitude.

## Coverage and assessment

Every Concern carries exactly one Resolve Condition and at least one Necessary Condition. Concern C-3 carries the heaviest commitment load, twelve NCs, because faithfulness decomposes into many independent commitments — the boundary Concerns C-1, C-4, and C-6 are each well-served by single-NC contracts.

The closure prerequisite that at least one NC carries non-empty `rejected_alternatives` and `collapse_test` is satisfied by every one of the nineteen NCs in this proof.

Concerns are locked. The composite shape of the proof is fifty-two elements: nine Rules, nineteen Evidence, nineteen NCs, five RCs, plus five Concerns. The audit chain runs: every NC carries grounding, collapse_test, reasoning_chain, and rejected_alternatives; every RC carries `problem_anchor` plus grounding to its supporting NCs.

## Downstream consumption

When the designer issues "go" against this argument, the proof closes. The artifact then flows into D.1's downstream Chester pipeline. design-specify consumes the design brief rendered from this closure artifact and produces a spec covering the proof MCP server changes (per-concern status, Concern phantom shape, manage_definitions tool, universal withdraw, universal provenance, schemaVersion, atomic persistence, re-open mechanism) plus skill-side proof reasoning code (closing argument composition, handoff packaging, consent token validation). plan-build hardens the spec into an implementation plan. execute-write ships the changes and verifies the commitments through tests. finish-write-records, finish-archive-artifacts, and finish-close-worktree close D.1 the sprint.

Once D.1 has shipped, sprint D.2 (Build Presentation Layer) begins, inheriting D.1's boundary contracts as Rules: the seed submission shape (NC-1), the consent token (NC-8), the three-state closure gate (NC-11), and the post-go immutability with re-open (NC-12). D.2 designs the SKILL.md rewrite, the information packet shape, the PM register, the pessimist commentary mechanism, the phase orchestration, and the round topic selection — all of it consuming D.1's stable proof layer.

## Designer review

This artifact constitutes the view stamp for round 1. Three responses are available:

The designer may say "go" to bulk-ratify all nineteen Draft Necessary Conditions and five Draft Resolve Conditions, transition the gate from Presented to Confirmed, and record closure of the proof. This is the path forward into design-specify.

The designer may revise any element before saying go — by revising a statement, by withdrawing an element with explicit disposition, or by introducing a new element. Any such mutation clears both gate flags, returns the proof to Pending, and forces re-presentation of a fresh closing argument that reflects the change.

The designer may stall — neither saying go nor mutating. The gate remains in Presented indefinitely; this is a valid pause state, neither agreement nor disagreement, preserved by NC-11 specifically so that the designer is not pressured into either committing or rejecting before they are ready.

Architecture-correctness verification of the inputs in this argument is a downstream responsibility — held by spec review during design-specify, by plan hardening during plan-build, and by test pass during execute-write. This argument resolves only the procedural mutual-agreement gate at the D.1 closure boundary.
