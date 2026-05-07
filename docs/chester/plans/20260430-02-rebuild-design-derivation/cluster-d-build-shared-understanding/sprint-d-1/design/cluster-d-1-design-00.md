# Cluster D.1 — Build Proof Layer (Design Brief)

**Sprint:** `cluster-d-build-shared-understanding/sprint-d-1`
**Master plan:** `20260430-02-rebuild-design-derivation`
**Status:** Ratified at round 1. Closure recorded `closingArgGoRound: 1`. Ready for design-specify.
**Source of truth:** `sprint-d-1/design/cluster-d-1-proof-state.json`

This brief is the input to `design-specify`. It carries the ratified proof envelope distilled for spec generation: problem statement, Concerns, Resolve Conditions (acceptance-criteria seeds), Necessary Conditions (constraint envelope), Rules, Evidence pointers, scope, and downstream boundary contracts.

---

## 1. Problem Statement

How do we design the proof layer that delivers commonly understood design requirements to the Specify system — formal language, faithful state management, designer-consent gating, and closure handoff — so that the presentation layer can build shared understanding against it?

D.1 designs the proof layer of a unified design system. The proof layer is a service that owns the formal language, the closed element set, the CRUD operations across that set, the closure mechanism, and the artifact handed to design-specify. It has no dependency on the presentation layer that wraps it. Sprint D.2 (Build Presentation Layer) inherits D.1's boundary contracts and consumes D.1's tool surface; D.2 is out of scope for this sprint.

---

## 2. Sprint Scope

D.1 ships changes to two surfaces:

**Proof MCP server.** The TypeScript / JavaScript package serving the design proof, living at `skills/design-large-task/proof-mcp/`. D.1 extends the schema, adds operations, adds validation, adds provenance, and adds the closure / re-open mechanism per the Necessary Conditions in §6.

**Skill-side proof reasoning.** The skill body that orchestrates proof operations on the agent side: closing argument composition, handoff packaging into the design brief shape, consent-token construction. Lives in `skills/design-large-task/SKILL.md` and any supporting reference files.

D.1 does not touch presentation-layer concerns — packet shape, PM register, single-topic discipline, pessimist commentary, phase orchestration, round topic selection. Those land in D.2.

---

## 3. Ratified Concerns

Five atomic concerns anchor the design. Concerns are locked.

**C-1 — Sufficient seed information.** Skill must start with sufficient seed information to build shared understanding.

**C-3 — Proof state faithfulness.** Proof state must remain faithful to designer's intent over time.

**C-4 — Designer-consent gate on advancement.** Proof advancement without designer consent breaks shared understanding.

**C-5 — Specify handoff fidelity.** Specify handoff must carry designer's intent with sufficient fidelity to produce correct architecture.

**C-6 — Mutual agreement on specify-input adequacy.** Agent and designer must mutually agree that the information provided to design-specify produces the correct architecture.

---

## 4. Resolve Conditions (Acceptance-Criteria Seeds)

Each RC is observable and is the seed for an Acceptance Criterion in the spec. design-specify converts each RC into one or more `AC-{N.M}` blocks.

**RC-1 (anchored to C-1).** When the skill is invoked, agent assembles a seed packet (candidate problem statement, initial Concerns, Evidence drawn from parallel exploration, restructuring labels per cluster B.1). After reviewing the packet, designer issues an open directive; `open_proof` receives a designer-source consent token capturing this directive. The operation log shows the directive preceded the open.

**RC-2 (anchored to C-3).** At any session round, designer can call `get_proof_state` and receive every active element with source plus ratification plus revision history, every retired element rendered as Phantom with disposition, and every entry's audit chain reconstructable from log fields. Element-level auditability is verifiable on inspection.

**RC-3 (anchored to C-4).** When an operation arrives without a structurally well-formed consent token (matching the NC-8 schema), proof rejects with error. Every committed mutation in the audit log carries a structurally valid consent token. Token shape validation is structural; designer-state authenticity is outside proof's threat model per NC-8.

**RC-4 (anchored to C-5).** When the design brief rendered from D.1's closure artifact is consumed by `design-specify`, specify produces a complete spec without referring back to the proof MCP for missing material. Every Concern, RC, NC, Rule, Permission, Risk, Friction, Definition, and provenance chain referenced by specify is present in the brief and traceable through to the closure artifact.

**RC-5 (anchored to C-6).** Closure event records only when designer issues view (`present_closing_argument`) and go (`confirm_closure_go`) in the same round. Closure artifact frozen at that moment matches what designer reviewed. Mutation between view and go forces re-presentation. Architecture-correctness validation is downstream.

---

## 5. Necessary Conditions (Constraint Envelope)

Nineteen ratified NCs constrain the design. Spec must comply with every constraint or surface a Permission against it.

### 5.1 Boundary contracts (C-1, C-4, C-6)

**NC-1 (Seed submission shape).** Open submission requires problem_statement, initial Concerns, initial Evidence, and restructuring action labels per cluster B.1 closed set on every submitted element. Missing fields reject.

**NC-8 (Designer-consent token).** Every state-mutating operation requires a `consent` token of shape `{ source: "designer" | "agent-proposed-designer-confirmed", rationale?: string }`. Read operations require no token. Proof checks shape; agent-side falsification is outside proof's threat model. Auto-created Friction inherits parent operation's token.

**NC-11 (Three-state closure gate).** Gate carries Pending / Presented / Confirmed. Go advances Presented to Confirmed; mutation clears Presented to Pending; absence of either keeps gate in Presented (designer stall preserved). Round-equality between view and go enforced.

**NC-12 (Immutable post-go; explicit re-open).** Once `confirm_closure_go` fires, closure artifact is frozen. Subsequent mutations require explicit re-open operation that transitions proofStatus back to open. Re-open mechanism — tool surface, closure-artifact retention, flag reset — is part of D.1 scope.

### 5.2 Proof state faithfulness (C-3)

**NC-2 (Closed conceptual category set).** Nine categories: 7 typed elements (NC, Evidence, Rule, Permission, Risk, RC, Friction) plus Concerns and Definitions. Phantom is withdrawal-derived status, not a separate category. Adding categories is charter-level.

**NC-3 (Authority on every element).** Source enum closed: codebase, industry, prior-art, session-observation, designer (Rules / Permissions only), agent-derivation (NCs, RCs, auto-created Friction, Draft Concerns, Draft Definitions). Concerns: designer-added are designer source, agent-proposed Drafts are agent-derivation. Definitions follow Approval-tracked lifecycle per RULE-5. Friction schema gains source-field extension during specify. Source preserved on withdrawal.

**NC-4 (Provenance on every state-mutating operation).** Beyond `open_proof`, every mutation carries provenance: who initiated, what changed, why. Per-operation-class provenance shape decomposed during design-specify.

**NC-5 (Universal withdrawal grammar).** Every category supporting deletion uses withdrawal preserving the element with closed-set disposition; status transitions to withdrawn (Phantom-rendered). Per-type disposition sets ratified during specify. No silent deletion permitted.

**NC-6 (CRUD-completeness across 9 categories).** Each category supports full Create / Read / Update / Delete via documented MCP tool surface. Phantom is status transition, not separate target. Pre-existing partial coverage (Concerns no withdraw, Definitions no API) closed.

**NC-7 (Definitions API).** `manage_definitions` tool with add / revise / deprecate / ratify operations. API exposes overlap-candidate query for designer disambiguation; specific overlap algorithm is design-specify territory. Vocabulary discipline (using ratified Definitions for terms) is Presentation-layer commitment in D.2.

**NC-13 (Friction detection on every state-mutating operation).** Cluster B.2 inheritance. Permission-risk-linkage shape auto-creates Friction with source agent-derivation; auto-created Friction inherits parent's consent. Other three detection shapes emit hints. Already-dismissed friction not re-detected.

**NC-14 (Round increment per call).** `state.round` increments once per state-mutating call (not per operation within batched call). Read-only operations do not increment.

**NC-15 (Schema versioning).** Proof state document carries `schemaVersion` field. Proof MCP refuses to load state whose version exceeds runtime version. Backwards-compatible additions use backfill on load. Breaking changes require explicit migration path. Schema evolution categories (additive, breaking, migration-required) defined during specify.

**NC-17 (State persistence atomicity).** State persistence is atomic per state-mutating call. Failure during save returns error and leaves state file unchanged. Read after write reflects committed state. No partial-state corruption.

**NC-18 (Per-element status fields).** Concerns and Definitions gain per-element `status` field with values Draft / Ratified, mirroring existing RC ratification. NCs gain analogous field. Existing `concernsLocked` boolean preserved as the stronger gate.

**NC-19 (Single-writer concurrency model).** Multi-writer access produces undefined behavior. Locking out of D.1 scope; calling environment ensures single-writer discipline. Multi-writer support is explicit out-of-scope evolution.

### 5.3 Specify handoff (C-5)

**NC-9 (Closure envelope completeness; hard gate).** Closing argument carries problem statement, ratified Concerns with descriptions, ratified RCs with five attributes, ratified NCs with full structure, active Rules / Permissions / Risks / Friction, phantom NCs / RCs / Friction with disposition, ratified Definitions, composite score, closure_permitted flag. Hard gate: `present_closing_argument` refuses if any Concern not Ratified or `concernsLocked` is false.

**NC-10 (Closure derivation pure and idempotent).** `present_closing_argument` is a pure function of proof state with no side effects. Multiple calls in same round produce identical output. Mutations between calls invalidate closing argument flags.

**NC-16 (Closure provenance).** Each element in closure artifact carries source, derivation chain (agent-derived NCs and RCs), ratification record (when, who), restructuring action label and source citation (where applicable from open_proof seeding). Specify consumes envelope with full audit trail.

---

## 6. Active Rules

**RULE-1 (Design is the code).** Agent and designer share a formal language that IS the design medium. Agent's drive toward implementation lands at design altitude through the language itself, not via behavioral prohibition.

**RULE-2 (Purpose is Shared Understanding).** Design system exists to produce shared alignment between agent and designer.

**RULE-3 (One-system architecture).** Design conversation runs continuously under proof MCP from session start. No Phase 4a / Phase 4b boundary. Legacy two-stage vocabulary is paper trail only.

**RULE-4 (Resolve Condition five attributes).** RC carries observable, approval-tracked, problem-statement-anchored, forward-looking, non-restrictive attributes. Cluster A inheritance.

**RULE-5 (Definitions home at G1).** Definitions live as proof-state extension with `manage_definitions` tool and Approval-tracked lifecycle.

**RULE-6 (Concerns approval-tracked).** Each Concern carries Draft / Ratified state. `concernsLocked` is the stronger gate (all Ratified plus no further additions).

**RULE-7 (Evidence is reference material).** Evidence does not require designer approval. Agent may add or remove freely. Designer authority over Evidence enters via NC grounding choices and via withdrawal.

**RULE-8 (Necessary Conditions approval-tracked).** Each NC carries Draft / Ratified state. Well-formedness (grounding, collapse_test, reasoning_chain, rejected_alternatives) is separate gate from approval.

**RULE-9 (Two-tier ratification).** Concerns ratify mid-round individually. RCs and NCs bulk-ratify at closing argument via designer's go. Bulk ratification is state transition, not mutation; does not clear two-yes consents. Definitions ratify on their own lifecycle. Evidence does not ratify.

---

## 7. Evidence

Nineteen Evidence pieces ground the proof. Sources distribute as eight codebase observations, four prior-art findings from cluster A / B.1 / B.2 / C, and seven industry patterns. The full text of every Evidence statement, with source attribution, lives in the proof state JSON at `sprint-d-1/design/cluster-d-1-proof-state.json` under the EVID-1 through EVID-19 entries. Each NC's `grounding` array references the supporting Evidence by ID.

---

## 8. Coverage Map

Every Concern carries one Resolve Condition and at least one Necessary Condition. design-specify can verify completeness by walking this map.

| Concern | RC | NCs |
|---------|-----|-----|
| C-1 (sufficient seed) | RC-1 | NC-1 |
| C-3 (proof state faithfulness) | RC-2 | NC-2, NC-3, NC-4, NC-5, NC-6, NC-7, NC-13, NC-14, NC-15, NC-17, NC-18, NC-19 |
| C-4 (consent gate) | RC-3 | NC-8 |
| C-5 (specify handoff) | RC-4 | NC-9, NC-10, NC-16 |
| C-6 (mutual agreement) | RC-5 | NC-11, NC-12 |

Closure prerequisite "≥1 NC with rejected_alternatives plus collapse_test" is satisfied by all 19 NCs.

---

## 9. Implementation Guidance for design-specify

The spec produced from this brief should cover the following surfaces.

**Schema additions to proof state document:**
- `schemaVersion` field (NC-15).
- Per-element `status` field on Concerns, Definitions, NCs (NC-18).
- Source field on Friction (NC-3).
- Definitions extension state slot (RULE-5, NC-7).
- Provenance fields on every state-mutating operation log entry (NC-4).

**MCP tool surface additions or revisions:**
- `manage_definitions` (add / revise / deprecate / ratify; overlap-candidate query) — new (NC-7).
- `manage_concerns` extended with `withdraw` operation (NC-5, NC-6).
- Universal `withdraw` operation discipline across categories with closed disposition sets (NC-5, NC-6).
- Re-open operation for closure (NC-12).
- Consent-token argument on every state-mutating tool (NC-8).

**Validation behavior:**
- Token shape validation rejects malformed operations (NC-8).
- Hard closure gate: `present_closing_argument` refuses without Concerns Ratified plus `concernsLocked` (NC-9).
- Atomic persistence: failure during save returns error, leaves state unchanged (NC-17).
- Schema version refusal: load fails when state version exceeds runtime version (NC-15).

**Audit and provenance:**
- Every mutation log entry carries provenance shape per operation class (NC-4).
- Closure envelope carries provenance chain for every cited element (NC-16).
- Phantom rendering preserves source field of pre-withdrawal element (NC-3).

**Skill-side proof reasoning:**
- Closing argument composition runs as a pure function of proof state (NC-10).
- Design brief renderer produces this brief shape from the closure artifact (RC-4 path).
- Friction detection runs on every state-mutating operation, reading proof state to surface conflicts (NC-13).

**Concurrency model:**
- Single-writer model documented in tool docs and MCP server README (NC-19).

---

## 10. Boundary Contracts Published for D.2

When D.1 ships, D.2 inherits the following as designer-locked Rules. D.2 cannot revise these in-band; revision requires a D.1 amendment cycle.

**Seed submission contract (NC-1).** D.2 must construct seed material satisfying NC-1's shape requirement at `open_proof`.

**Consent token contract (NC-8).** D.2 must capture designer confirmation and attach valid consent tokens to every state-mutating operation. Capture mechanism is D.2's design.

**Closure gate contract (NC-11, NC-12).** D.2 must orchestrate the three-state gate (Pending / Presented / Confirmed) including stall semantics, round-equality, and re-open invocation when post-go mutations are needed.

---

## 11. Out of Scope

Explicitly deferred to other sprints:

- **All presentation-layer concerns** — packet shape, PM register, Translation Gate enforcement, single-topic discipline, pessimist commentary, phase orchestration, round topic selection, voice. (D.2)
- **Two-axis problem space (Structured / Bounded) coordinate handling** — meta-language, not proof storage. (D.2 will design rendering and possibly request schema extension via D.1 amendment if proof storage is needed.)
- **Multi-writer concurrency support.** (Future sprint if needed.)
- **Per-type disposition set enumeration** — D.1 commits architecturally to "every type has closed set"; specific sets ratified during design-specify.
- **Specific overlap-candidate algorithm for Definitions API** — D.1 commits to API existence; algorithm chosen during design-specify.
- **Provenance shape per operation class** — D.1 commits architecturally to provenance on every mutation; specific shape per class decomposed during design-specify.

---

## 12. Inheritance and References

D.1 inherits from prior cluster work. design-specify reads these for context:

- **Cluster A — Define Solve.** Resolve Condition five attributes; sequential ratification; closure conditions extended.
- **Cluster B.1 — Define Transition.** Restructuring action labels; provenance shape at open_proof; one-shot submission.
- **Cluster B.2 — Define Solve Closing.** Friction (4 detection shapes, 5 disposition closed set); Phantom mechanism; two-yes closure gate; closing argument as structured object.
- **Cluster D session 2026-05-05 / 2026-05-06.** Two organizing principles; one-system architecture; six-Concern reframing; CRUD requirements analysis.

**Sprint working files:**
- `cluster-d-foundation-v1.md` — cluster D architectural foundation (shared with D.2).
- `cluster-d-concerns-working-list.md` — Concern reclassification audit trail.
- `cluster-d-proof-layer-crud-requirements.md` — CRUD coverage analysis.
- `structured-bounded-problem-space-reference.md` — two-axis framework reference (D.2 territory; included for context).
- `cluster-d-1-proof-state.json` — canonical proof state (closed at round 1).
- `cluster-d-1-closing-argument-00.md` — narrative closing argument from which this brief was rendered.

**Master plan:** `20260430-02-rebuild-design-derivation/master-plan.md` — cluster D charter at §4.5 (split into D.1 and D.2 amendment pending at D.1 finish-archive-artifacts).

---

## 13. Provenance

- Authored 2026-05-06 in cluster D design session.
- Closing argument view stamped at round 1; designer go directive received and recorded.
- Proof state closed; bulk ratification of 19 NCs and 5 RCs logged in `ratificationLog`.
- This brief renders the proof envelope distilled for design-specify consumption.
