# Specification: Experimental Design Skill with Formal Proof Language

**Sprint:** 20260408-03-plan-mode-design-guard
**Design brief:** plan-mode-design-guard-design-00.md
**Architecture:** Clean (4-module MCP, 3-tool surface, batch submission)

---

## 1. Overview

Create `skills/design-experimental/SKILL.md` — an experimental design interview skill forked from `design-figure-out`. Phase 1 uses Plan Mode with no MCP. Phase 2 uses a new Design Proof MCP that replaces both the understanding and enforcement MCPs with a single formal proof engine.

Create `skills/design-experimental/proof-mcp/` — a four-module MCP server that validates proof structure, detects integrity anomalies, triggers challenge modes, and gates closure.

---

## 2. File Inventory

### Files to create

| File | Purpose |
|------|---------|
| `skills/design-experimental/SKILL.md` | Skill definition — forked from design-figure-out |
| `skills/design-experimental/proof-mcp/server.js` | MCP wiring — 3 tools, no logic |
| `skills/design-experimental/proof-mcp/proof.js` | Element model, integrity checks — pure functions |
| `skills/design-experimental/proof-mcp/metrics.js` | Completeness, challenge triggers — pure functions |
| `skills/design-experimental/proof-mcp/state.js` | State lifecycle, persistence |
| `skills/design-experimental/proof-mcp/package.json` | Node package config |
| `skills/design-experimental/proof-mcp/__tests__/proof.test.js` | Tests for element model and integrity |
| `skills/design-experimental/proof-mcp/__tests__/metrics.test.js` | Tests for completeness and challenges |
| `skills/design-experimental/proof-mcp/__tests__/state.test.js` | Tests for state lifecycle |

### Files to modify

| File | Change |
|------|--------|
| `.plugin-mcp.json` | Add `chester-design-proof` entry |
| `skills/setup-start/SKILL.md` | Add `design-experimental` to Pipeline Skills list |

### Files not touched

All existing skills, MCP servers, hooks, config scripts.

---

## 3. Design Proof MCP — Module Architecture

### 3.1 Module Separation

```
proof-mcp/
├── server.js      ← thin wiring (routes tool calls, formats responses)
├── proof.js       ← element model + integrity checks (pure, no I/O)
├── metrics.js     ← completeness + challenge triggers (pure, no I/O)
├── state.js       ← lifecycle + persistence (I/O only via save/load)
└── __tests__/
```

**proof.js** owns: element type registry, element creation validation, referential integrity, the four integrity warning checks, basis chain traversal.

**metrics.js** owns: completeness computation, challenge trigger detection, closure condition evaluation. Imports `traverseBasisChain` from `proof.js` for chain-dependent checks.

**state.js** owns: state initialization, state update (delegates to proof.js for integrity, metrics.js for completeness/challenges/closure), ID generation, save/load. All state mutations use `structuredClone`.

**server.js** owns: tool definitions with JSON Schema, request routing, response formatting. No business logic.

### 3.2 Element Data Model

Each element in the proof is stored in a map keyed by ID:

```js
{
  id: string,                // "G1", "C2", "A3", "D1", "O1", "R1", "B1"
  type: string,              // GIVEN | CONSTRAINT | ASSERTION | DECISION | OPEN | RISK | BOUNDARY
  statement: string,         // the claim in natural language
  source: string,            // "codebase" | "designer" | "agent"
  basis: string[],           // IDs of elements this depends on (empty for GIVEN)
  over: string[],            // rejected alternatives (DECISION only)
  confidence: number,        // 0.0-1.0 (ASSERTION only; null for others)
  status: string,            // "active" | "resolved" | "withdrawn"
  resolvedBy: string | null, // element ID that resolved this OPEN
  addedInRound: number,
  revisedInRound: number | null,
  revision: number,          // 0 for original, increments on revise
}
```

**Element types and required fields:**

| Type | Required | Optional |
|------|----------|----------|
| GIVEN | statement, source | basis |
| CONSTRAINT | statement, basis | — |
| ASSERTION | statement, basis, confidence | — |
| DECISION | statement, basis, over | — |
| OPEN | statement | basis, blocks |
| RISK | statement, basis | — |
| BOUNDARY | statement, reason | — |

**ID format:** Type prefix letter + auto-incrementing counter. `G1`, `G2`, `C1`, `A1`, `D1`, `O1`, `R1`, `B1`. Counter is per-type and persisted in state.

### 3.3 Element Lifecycle

**Active** — the default state for new elements.

**Resolved** — only for OPENs. When an OPEN is answered:
- Agent submits `resolve` operation with `open_id` and `resolved_by` (a DECISION ID)
- The OPEN's status becomes `"resolved"`, `resolvedBy` is set
- The OPEN stays in the element map — not deleted
- Completeness counts only `status === "active"` OPENs as unresolved
- Downstream elements citing the OPEN continue to cite it (no breakage)

**Withdrawn** — when a designer rejects an element or it's superseded:
- Agent submits `withdraw` operation with the element ID
- The element's status becomes `"withdrawn"`
- It stays in the map for traceability
- The withdrawn-basis integrity warning fires on any active element citing a withdrawn element

**Revised** — when an element's content or basis changes:
- Agent submits `revise` operation with element ID and updated fields
- `revision` increments, `revisedInRound` is set to current round
- Downstream elements are NOT automatically updated — the stale-dependency integrity warning fires instead
- At least one revision after a designer interaction is required for closure (condition 5)

### 3.4 Proof State Schema

```js
{
  round: number,
  problemStatement: string,
  elements: { [id]: Element },
  elementCounters: { GIVEN: 0, CONSTRAINT: 0, ... },  // per-type ID counters
  openCountHistory: number[],       // one entry per round
  elementCountHistory: number[],    // one entry per round
  challengeModesUsed: string[],
  challengeLog: [{ mode, round }],
  revisionLog: [{ elementId, round, priorStatement }],
  phaseTransitionRound: number,     // set at initialization (round when proof started)
  lastDesignerInteractionRound: number,
}
```

---

## 4. MCP Tool Surface

### 4.1 `initialize_proof`

**Purpose:** Create fresh proof state at the start of Phase 2.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "problem_statement": { "type": "string", "description": "Confirmed problem statement from Phase 1" },
    "state_file": { "type": "string", "description": "Absolute path to persist proof state JSON" }
  },
  "required": ["problem_statement", "state_file"]
}
```

**Response:**
```json
{
  "status": "initialized",
  "element_types": ["GIVEN", "CONSTRAINT", "ASSERTION", "DECISION", "OPEN", "RISK", "BOUNDARY"],
  "operations": ["add", "resolve", "revise", "withdraw"],
  "state_file": "string"
}
```

**Behavior:** Creates empty proof state with `round: 0`, writes to `state_file`.

### 4.2 `submit_proof_update`

**Purpose:** Submit one or more proof operations per turn. This is the primary write tool — called once per turn with all element changes batched.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "state_file": { "type": "string" },
    "operations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "action": { "type": "string", "enum": ["add", "resolve", "revise", "withdraw"] },
          "type": { "type": "string", "enum": ["GIVEN", "CONSTRAINT", "ASSERTION", "DECISION", "OPEN", "RISK", "BOUNDARY"], "description": "Required for add" },
          "element_id": { "type": "string", "description": "Required for resolve, revise, withdraw" },
          "statement": { "type": "string", "description": "Required for add and revise" },
          "source": { "type": "string", "enum": ["codebase", "designer", "agent"], "description": "Required for add" },
          "basis": { "type": "array", "items": { "type": "string" }, "description": "Element IDs this depends on" },
          "over": { "type": "array", "items": { "type": "string" }, "description": "Rejected alternatives (DECISION only)" },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1, "description": "ASSERTION only" },
          "resolved_by": { "type": "string", "description": "DECISION ID that resolves this OPEN (resolve action only)" },
          "reason": { "type": "string", "description": "BOUNDARY reason" }
        },
        "required": ["action"]
      }
    },
    "challenge_used": {
      "type": "string",
      "enum": ["contrarian", "simplifier", "ontologist"],
      "description": "Challenge mode used this round (if any)"
    }
  },
  "required": ["state_file", "operations"]
}
```

**Response (accepted):**
```json
{
  "status": "accepted",
  "round": 4,
  "elements_added": ["G3", "A2"],
  "elements_resolved": ["O1"],
  "elements_revised": [],
  "elements_withdrawn": [],
  "integrity_warnings": [
    { "type": "stale-dependency", "element_id": "A1", "stale_basis_id": "G2", "message": "A1 cites G2 which was revised in round 3 but A1 has not been updated" }
  ],
  "completeness": {
    "total_elements": 12,
    "active_elements": 10,
    "open_count": 2,
    "boundary_count": 1,
    "decisions_with_alternatives": 2,
    "revision_count": 1,
    "basis_coverage": 0.85
  },
  "challenge_trigger": { "mode": "simplifier", "reason": "Element count grew by 3 while no OPENs were resolved" },
  "stall_detected": false,
  "closure_permitted": false,
  "closure_reasons": ["2 active OPENs remaining", "basis_coverage below 1.0"]
}
```

**Response (rejected):**
```json
{
  "status": "rejected",
  "errors": ["add: basis reference 'X99' does not exist in proof"],
  "warnings": []
}
```

**Validation rules (reject on failure):**
- Every `add` must have `type`, `statement`, `source`
- Every `add` with basis references must cite existing element IDs
- Every `resolve` must target an OPEN with `status: "active"`
- Every `resolve` must have `resolved_by` pointing to an existing DECISION
- Every `revise` must target an existing element with `status: "active"`
- Every `withdraw` must target an existing element with `status: "active"`
- ASSERTION must have `confidence`
- DECISION must have `over` (can be empty array, but field must exist)
- BOUNDARY must have `reason`

**Processing order:** Operations are applied sequentially in array order. This allows an `add` for a DECISION followed by a `resolve` for an OPEN in the same batch.

### 4.3 `get_proof_state`

**Purpose:** Read-only state dump for resume and debugging.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "state_file": { "type": "string" }
  },
  "required": ["state_file"]
}
```

**Response:** Full proof state including all elements with current status, completeness metrics, challenge modes used, round count, and closure status. Same shape as `submit_proof_update` response plus the full `elements` map.

---

## 5. Integrity Warnings (proof.js)

Four structural anomaly checks, each implemented as a separate function. All are pure — they take the elements map and return an array of warning objects.

### 5.1 Withdrawn-basis citation

**Check:** For each active element, if any ID in its `basis` array has `status: "withdrawn"`.

**Warning:** `{ type: "withdrawn-basis", element_id, cited_id, message }`

### 5.2 Boundary collision

**Check:** For each active DECISION, traverse its full basis chain. If any element in the chain is also referenced by an active BOUNDARY element (shares an element in its basis), flag it.

**Warning:** `{ type: "boundary-collision", element_id, boundary_id, shared_id, message }`

### 5.3 Confidence inversion

**Check:** For each active ASSERTION with `confidence >= 0.7`, traverse its basis chain. If any ASSERTION in the chain has `confidence < 0.4`, flag it.

**Warning:** `{ type: "confidence-inversion", element_id, low_confidence_id, message }`

**Thresholds:** High = 0.7, Low = 0.4. These define "inversion" — a strong claim built on a weak foundation.

### 5.4 Stale dependency

**Check:** For each element that has `revisedInRound !== null`, find all active elements that cite it in their `basis`. If any of those downstream elements have NOT been revised in a round >= the upstream element's `revisedInRound`, flag it.

**Warning:** `{ type: "stale-dependency", element_id, stale_basis_id, message }`

### 5.5 Basis chain traversal

Shared utility used by boundary collision, confidence inversion, and the Contrarian challenge trigger.

```js
export function traverseBasisChain(elements, startId)
```

BFS from `startId`, following `basis` links. Returns an array of all element IDs reachable through the chain. Detects cycles — if a visited ID is encountered again, stop that branch (no infinite loop). Does not follow withdrawn elements' chains.

---

## 6. Challenge Modes (metrics.js)

Three MCP-triggered modes, each fires at most once per interview. Derived from proof structure.

### 6.1 Contrarian

**Trigger:** At least one active ASSERTION exists whose basis chain (via `traverseBasisChain`) contains no element with `type: "GIVEN"` AND `source: "designer"`.

**What it means:** The agent is making a load-bearing claim with no grounding in anything the designer confirmed.

### 6.2 Simplifier

**Trigger:** In the current round, the total element count grew by more than 2 AND the active OPEN count did not decrease (compared to previous round via `openCountHistory` and `elementCountHistory`).

**What it means:** Scope is expanding without resolving existing questions.

### 6.3 Ontologist

**Trigger:** Active OPEN count has not decreased for 3 consecutive rounds (checked against `openCountHistory`).

**What it means:** The proof is stalled — questions exist but aren't being addressed.

### 6.4 Auditor

Unchanged from design-figure-out. Self-triggered by the agent when the current design direction matches a lesson from `~/.chester/thinking.md` with score >= 2. Not an MCP trigger.

---

## 7. Closure Conditions (metrics.js)

All five must be satisfied for `closure_permitted: true`:

1. **Zero active OPENs** — `elements.filter(e => e.type === 'OPEN' && e.status === 'active').length === 0`
2. **Full basis coverage** — every active DECISION's basis chain terminates at GIVENs or CONSTRAINTs (no dangling references, no chains ending at ASSERTIONs). Computed via `traverseBasisChain`.
3. **At least one BOUNDARY** — `elements.filter(e => e.type === 'BOUNDARY' && e.status === 'active').length >= 1`
4. **At least one DECISION with alternatives** — `elements.filter(e => e.type === 'DECISION' && e.status === 'active' && e.over.length > 0).length >= 1`
5. **At least one revision after designer interaction** — `elements.some(e => e.revisedInRound !== null && e.revisedInRound > state.phaseTransitionRound)`

Additionally: **minimum 3 rounds** in Phase 2 before closure is permitted.

---

## 8. SKILL.md Structure

### 8.1 Frontmatter

```yaml
---
name: design-experimental
description: "Experimental two-phase design skill: Plan Mode understanding (Phase 1), formal proof-building with structural validation (Phase 2). Fork of design-figure-out for validating proof-based design discipline."
---
```

### 8.2 Checklist

1. **Bootstrap** — invoke `start-bootstrap`
2. **EnterPlanMode** — call `EnterPlanMode` after bootstrap completes
3. **Parallel codebase exploration** — dispatch 3 `feature-dev:code-explorer` agents
4. **Round one** — present gap map, offer first commentary, announce Phase 1
5. **Understand phase** — per-turn conversational cycle (no MCP, no scoring)
6. **Phase transition** — designer confirms, `capture_thought` with tag `understanding-confirmed`, call `ExitPlanMode`
7. **Proof phase** — write problem statement, initialize proof MCP, per-turn proof cycle
8. **Closure** — proof complete or forced, write three artifacts, transition to design-specify

### 8.3 Phase 1: Understand (Plan Mode, No MCP)

Identical visible surface to design-figure-out: observations block, information package (Current facts, Surface analysis, Uncomfortable truths), commentary, "What do you think?"

**No MCP.** No dimension scoring, no structured submissions. The agent explores the codebase, converses with the designer, and builds understanding through conversation alone.

**Plan Mode active.** The agent cannot write files, edit code, or run commands. Read/Glob/Grep/Agent remain available for codebase exploration. The agent's output is conversation only.

**Phase 1 content guidance** (carried from design-figure-out):
- No solution proposals or option enumeration
- No design alternatives or trade-off analysis
- No architecture suggestions
- No problem statements

**Transition:** When the designer confirms understanding is sufficient:
1. Present a transition summary in domain language
2. `capture_thought()` with tag `understanding-confirmed`, stage `Transition`
3. Call `ExitPlanMode` — frame it as: "Understanding is established. We're moving from exploration to building the design proof. I'll write formal claims about what we know, what constrains the solution, what we decide, and what remains open. You respond the same way — correct, confirm, redirect, or move on."
4. Announce Phase 2

### 8.4 Phase 2: Solve (Proof MCP Active)

**Opening:**
1. Write problem statement — crystallize Phase 1 understanding (2-4 paragraphs). Present to designer for confirmation.
2. Call `initialize_proof` with confirmed problem statement and state file path `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-proof-state.json`
3. Seed the proof with initial GIVENs (from codebase exploration) and CONSTRAINTs (from designer's confirmed understanding) via first `submit_proof_update` call

**Per-turn cycle:**
1. Read designer's response
2. `capture_thought()` if trigger met
3. Compose proof operations — new GIVENs from designer input (source: "designer"), new ASSERTIONs from agent analysis, resolve OPENs if addressed, revise elements if corrected, withdraw if rejected
4. Call `submit_proof_update` with all operations batched
5. Read response: integrity warnings, completeness, challenge trigger, closure status
6. If challenge triggered and mode not already used, next commentary IS the challenge
7. Compose observations, information package, commentary — same visible surface as Phase 1
8. "What do you think?"

**Information package components (Phase 2):**
- Current facts
- Surface analysis
- General options
- Pessimist risks

**Integrity warning surfacing:** Integrity warnings appear in the observations block, translated to domain language:
- Withdrawn-basis: "One of our decisions rests on a premise we've since set aside."
- Boundary collision: "A decision path crosses into territory we marked as out of scope."
- Confidence inversion: "A high-confidence claim is built on a low-confidence foundation."
- Stale dependency: "We revised a premise but haven't revisited the claims that depend on it."

### 8.5 Safety Mechanisms

**Round cap:** 20 rounds total across both phases. At round 20, forced crystallization with residual risk notes listing unresolved OPENs and unmet closure conditions in domain terms.

**Early exit:** After at least 3 rounds of Phase 2, the designer may exit at any checkpoint. Unmet closure conditions noted in domain terms. Residual risk recorded in the design brief.

**Checkpoints:** Every 5 rounds (total across both phases). Summarize what's been established, what remains open, where the conversation is heading. Domain language only — no element IDs, no proof terminology. Offer exit opportunity.

**Stall recovery:**
1. Ontologist fires (if available)
2. Ontologist already used → present a checkpoint: "We have open questions that aren't being addressed. Is the design genuinely ambiguous here, or are we missing the right topic?"

**Phase 2 length check:** If Phase 2 consumes more rounds than Phase 1, note in process evidence as a signal that understanding may have been insufficient.

### 8.6 Resume Protocol

If interrupted:
1. `get_thinking_summary()` — check for `understanding-confirmed` thought
2. If absent: Phase 1 was active. Resume conversational understanding. Call `EnterPlanMode` if not already in Plan Mode.
3. If present: Phase 2 was active. Call `get_proof_state` with proof state file path.
4. Summarize current proof state in domain language: "We were in round N. We've established [summary of GIVENs and CONSTRAINTs], made [N] decisions, and have [N] open questions remaining. [Challenge modes used]. Continuing."
5. Pick up from last completed round. Do not re-present prior turns.

### 8.7 Closure Protocol

When `closure_permitted: true` from proof MCP AND the agent has nothing substantive left:
1. `get_thinking_summary()` for consolidated decision history
2. `get_proof_state()` for final proof snapshot
3. Present completed design brief to designer — decisions with rationale, derived from proof DECISIONs and their basis chains, translated to domain language
4. "Does this capture what we're building?"
5. Write three artifacts to `design/` subdirectory:
   - Design brief (`{sprint-name}-design-00.md`) — domain language, derived from proof
   - Thinking summary (`{sprint-name}-thinking-00.md`) — decision history
   - Process evidence (`{sprint-name}-process-00.md`) — proof element growth by round, integrity warnings surfaced, challenge firings, closure condition satisfaction, phase transition timing
6. Invoke `util-worktree`
7. Update `~/.chester/thinking.md` lessons table
8. Transition to `design-specify`

### 8.8 Integration

- **Calls:** `start-bootstrap` (setup), `util-worktree` (closure)
- **Uses:** `chester-design-proof` MCP (Phase 2), `capture_thought` / `get_thinking_summary` (throughout)
- **Reads:** `util-artifact-schema` (naming/paths), `util-budget-guard` (via bootstrap)
- **Invoked by:** user explicitly (opt-in — design-figure-out remains default)
- **Transitions to:** `design-specify`
- **Does NOT use:** `chester-understanding`, `chester-enforcement`

---

## 9. Registration Changes

### 9.1 `.plugin-mcp.json`

Add entry:
```json
"chester-design-proof": {
  "command": "node",
  "args": ["${CLAUDE_PLUGIN_ROOT}/skills/design-experimental/proof-mcp/server.js"]
}
```

### 9.2 `skills/setup-start/SKILL.md`

Add to Pipeline Skills list:
```
- `design-experimental` — Experimental two-phase design skill: Plan Mode understanding (Phase 1), formal proof-building with structural validation (Phase 2). Fork of design-figure-out for validating proof-based design discipline.
```

Add to Skill Priority, same tier as `design-figure-out` (gate skills, first priority).

---

## 10. Testing Strategy

### 10.1 proof.test.js

| Test | What it validates |
|------|-------------------|
| createElement — valid GIVEN | Creates element with correct ID, status active |
| createElement — missing statement rejects | Validation catches required field |
| createElement — ASSERTION requires confidence | Field validation |
| createElement — DECISION requires over | Field validation (over can be empty array) |
| createElement — basis references must exist | Referencing non-existent ID errors |
| traverseBasisChain — linear chain | Returns all reachable IDs |
| traverseBasisChain — handles cycles | Stops at revisited node, no infinite loop |
| traverseBasisChain — skips withdrawn | Does not follow withdrawn elements |
| checkWithdrawnBasis — flags active citing withdrawn | Returns warning |
| checkWithdrawnBasis — no warning when all active | Clean result |
| checkBoundaryCollision — flags shared reference | Returns warning with shared ID |
| checkConfidenceInversion — high on low flags | 0.8 built on 0.3 triggers |
| checkConfidenceInversion — high on high clean | No warning |
| checkStaleDependency — revised without downstream update | Returns warning |
| checkStaleDependency — revised with downstream updated | Clean result |

### 10.2 metrics.test.js

| Test | What it validates |
|------|-------------------|
| computeCompleteness — empty proof | All counts zero |
| computeCompleteness — mixed elements | Correct counts by type and status |
| computeCompleteness — resolved OPENs not counted | Only active OPENs in open_count |
| computeBasisCoverage — full coverage | All chains terminate at GIVEN/CONSTRAINT |
| computeBasisCoverage — partial coverage | Chain ending at ASSERTION returns < 1.0 |
| detectChallenge — Contrarian fires | ASSERTION with no designer GIVEN in chain |
| detectChallenge — Contrarian skips if used | Already in challengeModesUsed |
| detectChallenge — Simplifier fires | Element count +3, OPEN count unchanged |
| detectChallenge — Simplifier threshold | Element count +1 does NOT trigger |
| detectChallenge — Ontologist fires on 3-round stall | OPEN count same for 3 rounds |
| checkClosure — all conditions met | Returns permitted: true |
| checkClosure — blocked by active OPEN | Returns reason |
| checkClosure — blocked by incomplete basis | Returns reason |
| checkClosure — blocked by no BOUNDARY | Returns reason |
| checkClosure — blocked by no alternatives | Returns reason |
| checkClosure — blocked by no revision | Returns reason |
| checkClosure — blocked by round < 3 | Returns reason |

### 10.3 state.test.js

| Test | What it validates |
|------|-------------------|
| initializeState — creates clean state | Round 0, empty elements, empty histories |
| updateState — immutability | Original state unchanged after update |
| updateState — round increments | Round goes from N to N+1 |
| updateState — histories append | openCountHistory and elementCountHistory grow |
| generateId — correct format | G1, G2, C1, A1 per type |
| generateId — persists across save/load | Counter survives round-trip |
| applyOperations — add then resolve in batch | Sequential processing within one call |
| saveState / loadState — round trip | JSON write then read produces identical state |

---

## 11. Build Sequence

### Phase 1: MCP server core

1. Create `skills/design-experimental/proof-mcp/package.json`
2. Create `proof.js` — element type registry, createElement, traverseBasisChain, four integrity check functions
3. Create `metrics.js` — computeCompleteness, computeBasisCoverage, detectChallenge, checkClosure
4. Create `state.js` — initializeState, updateState, applyOperations, generateId, markChallengeUsed, saveState, loadState
5. Create `server.js` — three tools wired to state.js

### Phase 2: Tests

6. Create `__tests__/proof.test.js`
7. Create `__tests__/metrics.test.js`
8. Create `__tests__/state.test.js`
9. `npm install` in `proof-mcp/`
10. `npm test` — all passing

### Phase 3: Registration

11. Add `chester-design-proof` to `.plugin-mcp.json`
12. Add `design-experimental` to `skills/setup-start/SKILL.md`

### Phase 4: Skill

13. Create `skills/design-experimental/SKILL.md` — fork from design-figure-out, apply all Phase 1/Phase 2 changes per sections 8.1–8.8

### Phase 5: Verification

14. `npm test` in `proof-mcp/` — all passing
15. Verify `.plugin-mcp.json` is valid JSON
16. Verify SKILL.md frontmatter description matches setup-start entry

---

## 12. Constraints

- Plan Mode cannot be entered or exited by hooks — must be agent-initiated tool calls
- The proof MCP writes state via Node.js `fs`, not Claude's Write tool — works regardless of Plan Mode
- Compaction hooks are NOT updated — design-experimental sessions will not survive context compaction (deliberate scope exclusion)
- The experimental skill is opt-in — design-figure-out remains the default for creative work
- The proof language is machine-first — the designer reads it only for debugging, never in conversation output
