# Vocabulary Lock List — Sprint D-1 Fix Proof MCP

This is the consolidating pass that pins every term we settled during the design conversation for this fix sprint. The list has three sections:

1. **Inherited vocabulary** — terms locked at the master-plan altitude that this sprint preserves verbatim.
2. **Newly locked vocabulary** — terms this sprint settles for the first time and that downstream work must use as written.
3. **Retired vocabulary** — terms removed from the system in this sprint and the names that replace them.

---

## 1. Inherited Vocabulary (preserved verbatim)

These are master-plan locks. This sprint does not revisit them.

### Element Types (the eight names)

- **Necessary Condition** — must be true for the design to hold.
- **Evidence** — codebase / industry / friction facts.
- **Rule** — designer-directed restriction.
- **Permission** — designer-directed relief from a Rule.
- **Risk** — hazard with basis pointer.
- **Resolve Condition** — observable state that counts as a problem-statement aspect being resolved.
- **Concern** — open question the design must address before closure.
- **Definition** — working-glossary term carrying agreed meaning across the proof.

Friction is a derived element type the system creates automatically when certain logical patterns appear (most often a Permission added without a paired Risk). Friction is its own ninth element category but is not in the load-bearing element family.

### Other Inherited Terms

- **Problem statement** — designer's confirmed hypothesis the proof addresses.
- **Closing argument** — derived envelope summarizing the proof body for designer review.
- **Two-yes** — the designer's pair of approvals on the closing argument.
- **First yes** — the designer's first approval on the closing argument; an event, not a state.

---

## 2. Newly Locked Vocabulary

Two state machines exist in the proof system. They run independently. The proof has its own state. Each element has its own state. Below pins both.

### Meta Proof State

The proof has exactly two phases and exactly one gate.

- **Planning** — the proof is being developed. All create-revise-withdraw operations are available across every element type. The closing argument may be derived, presented, and revised any number of times during this phase. The first yes is an event that fires within the planning phase; it does not change the proof's state.
- **Finish** — the proof is sealed. No mutation of any kind. No further closing argument derivations. The proof body is the permanent record handed off to the brief writer.
- **The gate** — the designer's second yes on the closing argument. The gate fires once. After the gate, the proof is in the finish phase forever.

There is no return from finish to planning. No reopen motion exists. If the designer needs to revisit a finished proof, that is a new proof, not a re-entry into the old one.

The current code's `proofStatus` field today carries three values (unopen, open, closed). Under this lock the field carries two values: **planning** and **finish**. The "unopen" value is retired — proof initialization places the proof directly in planning. The "closed" value is retired by name — replaced by "finish."

### Element State

Each element carries two pieces of state, independent of the proof's phase.

- **Ratification state.** Per-element. Values: **working** (default) or **ratified**.
  - Working means the element exists in the proof body but has not received its lane's ratification.
  - Ratified means the element's lane ratifier has approved its content.
  - The act of approval is **ratify**. Revising a ratified element drops it back to working — the act of revising is implicitly a request for re-ratification.

- **CRUD state.** Per-element by inheritance — every element shares the same value because CRUD availability is a property of the proof's phase, not of individual elements. Values: **open** (during planning) or **closed-to-mutation** (during finish). This state derives from the proof's phase rather than being stored separately.

### The Three Ratify Lanes

Each element type belongs to exactly one lane. The lane determines who ratifies and when.

- **Designer-directed lane (creation = ratification).** Rules, Permissions. These are designer-authored from the start; the act of creating one is the act of ratifying it. There is no separate ratify motion for these types. The element enters the proof in ratified state.

- **Designer-explicit lane (per-element ratify after creation).** Concerns, Necessary Conditions, Resolve Conditions, Definitions. These start in working state and require an explicit per-element designer ratify motion to transition to ratified. The motion takes one element identifier and confirms designer approval of that element's content.

- **Agent-ratified lane (creation = ratification by agent).** Evidence, Risks, Friction. The agent ratifies these at creation time on the designer's behalf. The designer's pushback path on an agent-ratified element is to ask the agent to withdraw or revise it; the designer does not run a separate ratify motion on these types.

### First-Yes Precondition

The closing argument cannot be presented for first review until every element across every lane is in ratified state. Presentation is a strict precondition check, not a cooperative drive — if any working element exists, presentation refuses with the list of unratified elements.

### Mid-Review Revision

Any create-revise-withdraw operation between closing-argument presentation and the second yes is a **mid-review revision**. A mid-review revision has two automatic consequences:

- The first yes (if it has fired) is reset.
- The closing argument is re-derived in full from the new body and re-presented to the designer for fresh review.

There is no path that preserves a partial yes across a mid-review revision. The designer can revise during review as much as they want; each revision restarts the closing-argument review cycle.

### Friction-Disposition (orthogonal property)

Friction elements are agent-ratified at creation but carry an additional **disposition** property with terminal values (accepted, dissolved-by-revision, dissolved-by-scope-cut, not-really-friction). Every active Friction must reach a terminal disposition before the closing argument can be presented. The disposition motion is the friction-side equivalent of the closure precondition that ratify provides for other types.

### Body-Advancement Signal (replaces count-based stall metric)

The body-advancement signal is the agent-internal check that replaces the count-based stall metric being retired in this sprint. The signal answers: did the body advance this round? Body advancement counts as new elements added, existing elements revised, or existing elements withdrawn — across every load-bearing element type, not just one. Bookkeeping moves (ratification, disposition flips) do not count as advancement.

The signal is consumed by the agent's own conduct (the round-prompt body-advancement check) and is not surfaced to the designer.

---

## 3. Retired Vocabulary

These terms are removed from the system in this sprint. The replacement column names what the term becomes (or why it goes away with no replacement).

### Proof-Level Status Names

- **Unopen** (proofStatus value) — retired. Proof initialization places the proof directly in planning.
- **Open** (proofStatus value) — retired by name. Replaced by **planning**.
- **Closed** (proofStatus value) — retired by name. Replaced by **finish**.
- **Approved** (designer's word for "ratified" earlier in the conversation) — replaced by **ratified** at element level. Master plan keeps "ratified" as the canonical name.
- **Reopen motion** — retired. No motion exists that takes a finished proof back to planning. The associated tool, the lastClosureArtifact retention field that supported it, and the proofStatus reverse transition all go away.

### Element-Level Lock Mechanism

- **The lock-the-set seal on Concerns** — removed. Was a designer-callable command that fired mid-session and sealed the open-questions class against new entries. The whole concept disappears with the gate-only model — there is no per-class seal because there is no mid-session lock event at all.
- **The `manage_concerns op:lock` command** — removed. No designer-callable lock motion exists at any level under the gate-only model.
- **The `concernsLocked` flag** — removed. The proof's `proofStatus` field is the single source of truth for CRUD availability. Every CRUD-gate check that referenced `concernsLocked` is rewritten to check `proofStatus === 'finish'`.
- **The bulk-ratify hook at the second yes** — removed. Under the first-yes precondition, every element is already ratified by closing-argument-presentation time, so there is nothing in working state remaining at the second yes for the hook to ratify.

### Personalities (the three challenge modes)

All three retired as system-level mechanisms. Their diagnostic intents fold into agent conduct discipline through the round-prompt conduct items (see `challenge-personalities-fold-into-round-prompts.md`).

- **Ontologist** — system-level personality removed. Diagnostic intent (saturation-or-reshape reflection) folds into the body-advancement check in the round prompt.
- **Simplifier** — system-level personality removed. Diagnostic intent (sprawl-and-duplication check) folds into the add-time duplication check in the round prompt, which runs at every element add rather than on a deferred threshold.
- **Contrarian** — system-level personality removed. Diagnostic intent (monoculture-grounding check) folds into the grounding-chain check in the round prompt, which runs at every necessary-condition surface or revise.

### Trigger and Detector Names

- **Stall detector** — removed. The count-based metric (necessary-condition history flat for three rounds) was the broken signal driving structural personality firing. Replaced by the body-advancement signal described above.
- **Challenge mode** — removed as a structural concept. The agent runs no named mode mid-session under the new picture; the agent runs the three round-prompt conduct items as ongoing discipline.
- **`challengeModesUsed`** — removed. No state needed since no challenge fires structurally.
- **`detectChallenge`** — removed. Function and its three branches retired.
- **`detectStall`** — removed.
- **`conditionCountHistory`** — removed. The body-advancement signal is computed differently and does not need this history.

---

## 4. Names That Stay (no change)

These exist in the system today and continue unchanged:

- **`proofStatus`** — field name unchanged; value set shrinks from three values (unopen, open, closed) to two (planning, finish).
- **status** on individual elements — values working, ratified, withdrawn (terminal). The element-level ratification axis.
- **disposition** on Friction elements — values described above.
- **withdraw** as a universal verb — the create-revise-withdraw mutation set is uniform across element types. Withdraw routes to the per-type internal handler based on element identifier prefix.
- **ratify** as a per-element designer motion — applies to the designer-explicit lane only (Concerns, Necessary Conditions, Resolve Conditions, Definitions).
- **Closing argument** as a derived envelope — pure derivation from body state, recomputed on every mid-review revision.

---

## 5. Notes on Master-Plan Coherence

Several of the new locks above interact with master-plan inheritance:

- **Element-type list stays at eight (plus Friction).** No new element types are introduced in this sprint. The master plan's vocabulary lock on element types remains intact.
- **"Ratified" stays as the canonical approval term at the element level.** The master plan locks this name; this sprint preserves it. "Working" replaces no master-plan term — it is a new lock that names the default element state explicitly.
- **The two-state-machine picture is consistent with master-plan principles.** "Design is the code" — the formal language carries both state machines structurally. "Purpose is shared understanding" — per-element ratification is the structural carrier of designer commitment for designer-explicit types; the gate is the structural carrier of full-proof commitment.
- **No master-plan rules are amended by this sprint.** The vocabulary settled here lives at the proof-system altitude; the master plan's rules apply unchanged.
