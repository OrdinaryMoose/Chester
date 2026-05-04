# Session Handoff — From Small-Task to Large-Task

This sprint was bootstrapped under `design-small-task` to redesign per-turn presentation in the Understand stage. Scope escalated mid-conversation. Transitioning to `design-large-task` for continued work.

## What's Established (designer-ratified)

### Core tenets

- **Design = the problem (what), not the implementation (how).** Phase 4a (Understand) determines what; Phase 4b (Solve) puts analytic rigor on what done looks like.
- **The agent has a solve-drive.** The system gives the agent the problem we want it to solve; the drive is a feature, not a flaw.
- **Solve works as designed. Understand does not.** All three current Understand-stage flows (classic, problemfocused, team-interview) suffer the same structural drift — agent's solve-drive bounces off the conversation surface and leaks as solve-shape framings dressed as problem-side observations. Evidence in ncon-05 transcript; evidence in this session's own Round One/Two slips.

### Audit findings — Solve has a structural derivation gap

- The proof has no `SOLUTION` element. The five element types (EVIDENCE, RULE, PERMISSION, NECESSARY_CONDITION, RISK) describe the envelope; the solution itself is downstream in `design-specify`.
- The proof's `checkClosure` verifies NC grounding + collapse tests but does NOT verify that NCs collectively satisfy the problem statement. The hypothesis-to-derivation link is structurally absent.
- Acceptance Criteria today are agent-imagined at brief-render time. Not a proof element. No upstream definition. No structural link to NCs or problem statement.
- **Solve is not immutable.** Designer accepted that Solve must be refactored; the gap is real.

### Phase 4a structure — collapsed to Solve immutable vocabulary (where possible)

**Three surviving discovery lenses (tenets):**

1. **Scope** — what the problem covers (IN) and explicitly excludes (OUT). IN entries route to Necessary Conditions; OUT entries route to Rules with optional `adjacent` annotation naming neighbor design.
2. **Givens** *(renamed from Assumptions to avoid C2 marker collision)* — premises taken as given that could be wrong. The given itself routes to Rules; the could-be-wrong portion routes to Risks with basis pointing at the Rule.
3. **Dependencies** — external reliance for problem existence or resolution. Existence-side routes to Evidence; resolution-side routes to Acceptance Criteria.

**Three collapsed tenets (folded into Solve vocabulary):**

- **Boundary** → Scope-OUT with adjacency annotation. Doesn't earn independence.
- **Constraints** → Rules. Definitions identical.
- **Invariants** → Evidence (world-grounded) or Rules (designer-grounded). Routing handles it without a separate tenet.

### Phase 4a outputs — proof seed material

The Understand stage produces a pre-seeded proof. The proof ledger is one continuous artifact spanning both stages.

- **Evidence** — codebase/industry/friction facts, problem-relevant
- **Rules** — designer-directed locks on the problem and solution space
- **Necessary Conditions** — what must be true for the problem to exist as framed (problem-existence claims; chain into Solve as starting NCs)
- **Risks** — hazards on Givens-that-could-be-wrong, Dependencies-that-could-fail, Rules-whose-violation-invalidates-the-problem
- **Acceptance Criteria** — observable testable conditions for problem resolution. Will likely be replaced or supplemented by formal Sufficient Conditions (see open item).

## Open Items (still in exam)

### Open Item 1 — Sufficient Conditions formal mechanism

Three options for closing the derivation gap. Designer's read: "still in examination."

**Option 1 — `SUFFICIENT_CONDITION` as sixth proof element type.** Phase 4a outputs both Necessary and Sufficient as proof elements. Closure check tightens: every Sufficient Condition has grounding back to the problem statement; collectively they claim to cover problem resolution. Acceptance Criteria become a derived rendering of Sufficient Conditions, not fresh agent invention. Sharpest. Forces Solve refactor.

**Option 2 — Sufficient Conditions live alongside the proof, not inside it.** Phase 4a produces them as a separate artifact. Proof remains five element types. Loses structural validation that NC ∪ SC resolves problem. Conservative.

**Option 3 — Reframe NC to do double duty.** Some NCs encode existence (problem-side); others encode design-correctness (solution-side); collectively imply resolution. Avoids new element type but blurs NC semantics inside the proof.

### Open Item 2 — Loose entries vs structured entries

Phase 4a discovery routes through three lenses (Scope, Givens, Dependencies) to element types. Whether the proof permits "loose" direct-to-element entries that don't route through a named lens is unsettled. Restricting forces structure; permitting allows organic discovery.

### Open Item 3 — Provenance and Solution-Blindness as cross-cutting rules

From Round Five: every claim filed in any element traces to designer signal or codebase evidence (no agent imagination); no element entry contains mechanism vocabulary (substitution test). These are cross-cutting rules over the tenets/elements, parallel to Solve's source-locking on RULE/EVIDENCE. Not yet ratified as load-bearing.

## Vocabulary Already Locked

- **Necessary Conditions** — same name in both stages. Understand seeds with problem-existence; Solve continues with design-correctness. One proof ledger.
- **Rules** — designer-directed restrictions. Same in both stages.
- **Evidence** — codebase/industry/friction facts. Same in both stages.
- **Risks** — hazards. Same in both stages.
- **Givens** — Phase 4a-only. Designer-stated premises that could be wrong.
- **Acceptance Criteria** — current Solve brief section 8 name; status uncertain pending Open Item 1.
- **Sufficient Conditions** — proposed Phase 4a output; status uncertain pending Open Item 1.

## Vocabulary Collisions Resolved

- "Necessary conditions" — one name, one ledger, two stages of authoring (chain, not collision).
- "Constraints" → renamed to "Rules" (matches Solve immutable vocabulary).
- "Invariants" → tenet dropped; entries route to Evidence or Rules by source.
- "Assumptions" → renamed to "Givens" to avoid C2 voice marker collision.
- "Boundary" → tenet dropped; absorbed into Scope-OUT.

## What This Sprint's Brief Will Need to Cover

The continued design-large-task work needs to close:

1. Open Items 1, 2, 3.
2. Concrete Phase 4a per-turn flow (without leaking into HOW-mechanism — though some HOW will be needed since this work produces a skill specification).
3. The exact Solve refactor (sixth element type, closure check changes, brief template changes).
4. Migration path from current problemfocused/classic/team-interview flows to the new Phase 4a.
5. Renaming the sprint to match scope. Original `redesign-turn-package` is too narrow.

## Working Sprint Directory

Original directory: `docs/chester/working/20260430-01-redesign-turn-package/`. The continuation may rename or supersede this; the design directory contents (this file plus session jsonl extracts) carry as prior-art for the new sprint's Phase 2 explorers.
