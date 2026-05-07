# Reasoning Audit: cluster-d-1 — proof MCP completeness extension

**Date:** 2026-05-07
**Session:** `00`
**Plan:** `cluster-d-1-plan-01.md`

## Executive Summary

Sprint-d-1 extended the design proof MCP server per 19 NCs, 5 RCs, and 5 Concerns from the cluster-D brief. The most consequential decision was the architecture pick at design-specify time: after the adversarial review found Architect B and the Hybrid both required architecture-level rework before spec writing could begin, the agent recommended Architect A (heterogeneous storage preserved + additive schema), and the user picked it. Implementation followed the 17-task plan task-for-task with 18 commits and 483 tests; all five spec-review failures and most quality-review Important findings were fixed inline rather than deferred, with disciplined deferral of cosmetic Minor items and items genuinely scoped to D.2/D.3.

## Plan Development

The plan was developed inside this same session, not carried in fully-formed. Session entry was `/specify` against the design brief produced by an upstream design-large-task session. Inside design-specify, the agent dispatched two architects (A: universal generic tools; B: skill-orchestrated invariants), built a Hybrid (federated registry over heterogeneous stores) when the user rejected B as not F-A-C-compliant and asked for an alternative, then ran adversarial spec review against all three contenders. Adversarial review surfaced architecture-level blockers in C (status-axis collision, migration of alien archive state) and Hybrid (NC-7 deprecate-removal violates a designer-locked NC; CERN/CONC prefix mismatch); A's findings were spec-time correctable. User picked A; spec was written, ground-truth review run, plan-build dispatched. plan-build then ran plan-attack and plan-smell, producing a threat-report that flagged Critical issues for Tasks 2, 3, 13 — all folded into the final plan before execute-write started. Execution mode = subagent (all four heuristic conditions failed: 16 tasks, Significant threat risk, decision-budget sum 33, multi-file tasks).

## Decision Log

### Architecture pick — Architect A over Hybrid and Architect C

**Context:** design-specify presented three F-A-C-passing options to the user. The agent's recommendation drove which option got promoted.

**Information used:**
- Architect-vs-architect-vs-hybrid red-team reports (three parallel `chester:plan-build-plan-attacker` dispatches)
- Brief §11 deferment list (per-type disposition sets, overlap algorithm, per-class provenance shape)
- Live codebase: `state.js:262-268` and `state.js:347-352` FRICTION guards in `applyOperations`; `CERN-` prefix in shipped code vs plan-described `CONC-`
- Brief §5.2 NC-7 ratification of `deprecate` op (designer-locked)

**Alternatives considered:**
- `Architect C (homogeneous registry)` — rejected: status-axis collision and migration of legacy state files in tracked `plans/` archive require architecture-level rework before spec can begin
- `Hybrid (federated registry over heterogeneous stores)` — rejected: removes `manage_definitions deprecate`, violating designer-locked NC-7; introduces `CERN-`/`CONC-` prefix mismatch; federated abstraction without removing per-category aliases yields only partial uniformity
- `Articulate variant` — not pursued; agent did not propose a fourth option

**Decision:** Recommended Architect A; user picked `a`.

**Rationale:** A's red-team findings were all spec-time correctable; C's and Hybrid's were not. A preserves B.2-shipped code verbatim, smallest blast radius (~400 LOC, 21 test files mostly intact), additive schema (no v1→v2 migration), and equal service-ness to Hybrid. NC-5 "three deletion verbs" trade was honest — registered as a Permission with semantic-collision rationale rather than papered over.

**Confidence:** High — recommendation reasoning explicit in conversation; alternatives named with concrete rejection grounds.

---

### Task 11 deviation — accept implementer skipping `open-gate.js` modification

**Context:** Task 11 plan listed `open-gate.js` among files to modify ("accept submission's consent token (forwarded from handler) for completeness; gate enforces NC-1 shape"). Implementer reported NOT modifying it: "open-gate is already serving its role downstream. The 'for completeness' [thread] turned out unnecessary."

**Information used:**
- Implementer's framing in DONE report
- Subsequent spec reviewer verdict (Pass) — independently verified actual code matched the spec semantics
- Existing `checkOpenGate` already enforces admitted ≥ 1, restructuring labels, provenance; new NC-1 shape checks live at server-layer seed-packet validation

**Alternatives considered:**
- `Reject the deviation, force open-gate.js modification` — rejected: would add a no-op consent-token parameter to a function that doesn't gate on it
- `Accept and move forward` — chosen

**Decision:** Accepted the deviation; advanced to spec review without forcing the file change.

**Rationale:** The plan's "for completeness" qualifier signaled the listing was hedge, not requirement. Spec semantics are satisfied at the server layer; threading a token through a gate function that ignores it would be defensive code without value. (inferred — agent did not articulate this explicitly but proceeded to spec review which then confirmed Pass.)

**Confidence:** Medium — decision visible (proceeded without challenge); rationale partially inferred from the implementer's own framing being adopted.

---

### Task 8 first review FAIL — fix inline rather than re-dispatch implementer

**Context:** Spec reviewer flagged two real issues on Task 8: `manageDefinitions` `add` op dropped consent-derived `source` (always wrote `'agent-derivation'`) and skipped the required `processFriction` call.

**Information used:**
- Spec reviewer report (FAIL with two specific issues)
- `state.js:860+` direct read showing `createDefinition(payload, id, newState.round)` missing 4th `source` arg
- Existing `processFriction` callers (lines 227, 262, 355, 574, 758) confirming signature `(state, parentConsent, parentOp)`

**Alternatives considered:**
- `Re-dispatch implementer subagent for the fix` — rejected (inferred): cost of fresh-context dispatch outweighs benefit for two pinpointed call-site fixes
- `Fix inline and re-dispatch reviewer` — chosen
- `Defer one or both findings` — not viable; both are spec-explicit failures

**Decision:** Fixed both inline (compute `source` from `consent.source`, add `processFriction(newState, consent, 'manage_definitions:add')` before return), added test cases to `definitions.test.js`, amended commit, re-dispatched spec reviewer.

**Rationale:** Both bugs collapsed on one call site — minimal blast radius for inline fix. `★ Insight` block in transcript notes "implementer report claimed 'designer source' inferred but never wired" — the bug was a subtle wiring miss, not a structural design problem requiring fresh context.

**Confidence:** High — decision and rationale stated in transcript ("Both bugs collapse on one call site").

---

### Final code review — fold three Important inline, defer two Minor

**Context:** Sprint-wide final code review surfaced three Important findings (missing `operationLog` appends on `recordClosingArgPresented` and `markChallengeUsed`; unstructured error code for `SCHEMA_VERSION_TOO_NEW` at the dispatcher) plus two Minor findings.

**Information used:**
- Final code reviewer report
- `state.js:711-722` — `markChallengeUsed` clears closing flags but no operationLog entry
- `state.js:769-771` — `loadState` constructs `err.code = 'SCHEMA_VERSION_TOO_NEW'` but `server.js:315-316` dispatcher catch returns `text: err.message` only, dropping the code
- Reviewer's NC-4 grounding: completeness counters and timeline reconstruction depend on every mutation appending an operationLog entry

**Alternatives considered:**
- `Defer all three to D.2/D.3` — rejected: NC-4 reconstructable-provenance is a sprint-d-1 acceptance criterion; the gap shipped now would be load-bearing for downstream work
- `Fix all three inline` — chosen
- `Fix only the two operationLog gaps, defer the structured error` — rejected: structured-error fix is a 4-line dispatcher change with one new test

**Decision:** Fixed all three Important findings inline (`recordClosingArgPresented` and `markChallengeUsed` now append operationLog entries; dispatcher catch surfaces `err.code` when present), added three tests, committed as `fix(proof-mcp): operationLog parity + structured SCHEMA_VERSION_TOO_NEW error`.

**Rationale:** All three Important findings related to acceptance criteria (NC-4, AC-6.2 schema-refusal observability) where deferral would ship a contract-shaped hole. Both Minor items genuinely scoped to D.2/D.3 (concerned skill-side rendering and presentation).

**Confidence:** High — explicit "Three Important findings to fix... Skip both Minor (deferrable to D.2/D.3)" in transcript.

---

### Task 13 — fix property-path bug surfaced by quality reviewer

**Context:** Quality reviewer flagged a latent bug: `closing-argument.js` read `el.restructuring?.action ?? el.restructuring_action_label` for `restructuringActionLabel`, but the persisted shape from `server.js:857`'s `admittedToAddOp` writes `restructuring: { metadata, restructuring_action_label, provenance }` (snake_case nested). The read path always returned null.

**Information used:**
- Quality reviewer report (Important: latent bug)
- `proof.js:138, 250-251` — element creation carries `restructuring` straight through
- `server.js:852-857` — `admittedToAddOp` produces the canonical persisted shape with snake_case `restructuring_action_label`
- `restructure.js:161` — primary action label written as `restructuring_action_label`
- Existing test asserted on shape but not on real value, so the null was invisible

**Alternatives considered:**
- `Defer as Minor (cosmetic only)` — rejected: real-data tests would surface null fields downstream; the closing-argument envelope is the load-bearing artifact for D.2 brief renderer
- `Keep blueprint shorthand, document the discrepancy` — rejected (inferred): would propagate a known-broken read into the shipped envelope
- `Fix property path + add real-value test` — chosen

**Decision:** Triple-fallback read `el.restructuring?.restructuring_action_label ?? el.restructuring?.action ?? el.restructuring_action_label ?? null` — accommodates current persisted shape, plan blueprint shorthand, and pre-restructure shape. Added test that binds against actual nested snake_case shape.

**Rationale:** Plan-stage blueprint used the shorthand `restructuring.action` while persisted code used the snake_case nested form. Triple fallback is defensive but cheap; the real-value test prevents future drift from being silent.

**Confidence:** High — decision stated explicitly; `★ Insight` block in transcript articulates the blueprint-vs-persisted-shape distinction.

---

### Task 3 — bulk sed fix for INVALID_CONSENT response shape

**Context:** Task 3 spec reviewer found 4 server handlers (`handleManageConcerns`, `handleManageFriction`, `handleOverrideFrictionDisposition`, `handleRatifyResolveCondition`) returned `{ code, status: 'rejected', error: err, message: err }` for INVALID_CONSENT, but spec prescribes `{ code, message }` only.

**Information used:**
- Spec reviewer FAIL report
- `grep` confirming 4+ instances of the exact non-conforming pattern
- Verification that `isError: true` wrapper, `code`, and `message` fields were correct (only the two extra fields were the deviation)

**Alternatives considered:**
- `Hand-edit each call site individually` — rejected: 4+ identical instances; risk of inconsistency
- `Re-dispatch implementer` — rejected: scope (string-replace) doesn't justify fresh-context cost
- `sed -i` bulk replacement — chosen

**Decision:** `sed -i "s/{ code, status: 'rejected', error: err, message: err }/{ code, message: err }/g"` then re-run tests, then re-dispatch spec reviewer.

**Rationale:** Mechanical, exact, idempotent. Tests confirm the shape change doesn't regress (consumers asserted on `code` + `message`, not on the extra fields).

**Confidence:** High — explicit "Spec FAIL — fix inline" → sed → re-review chain in transcript.

---

### Task 15 second-reopen-cycle test — recognize bad premise, fix the assertion

**Context:** Inline-added test ("second reopen DOES update lastClosureArtifact with the second closure's envelope") failed: assertion `toEqual(expected2)` claimed the second-cycle envelope deeply equaled the first, contradicting the test's framing. 1 failed / 470 passed.

**Information used:**
- Test failure output: "expected { derivedAtRound: 3, …(19) } to not deeply equal { derivedAtRound: 3, …(19) }"
- Direct inspection: between the two close cycles, no element mutation occurred, so `deriveClosingArgument(state)` produced a structurally-identical envelope each cycle
- `closing-argument.js` is a pure function of state

**Alternatives considered:**
- `Mutate an element between close cycles to force a difference` — rejected: out of scope for the test; would dilute the assertion's meaning
- `Drop the test entirely` — rejected: still want to verify second-cycle capture happened
- `Re-anchor the assertion to "captures live state at reopen-time"` — chosen

**Decision:** Refined assertion to compare `lastClosureArtifact` after second reopen against `deriveClosingArgument(s)` snapshot taken at the same moment, holding regardless of whether the second close differs from the first.

**Rationale:** The test's original premise was wrong, not the code. Correct semantics: each reopen captures the current envelope; whether two captures differ depends on whether state mutated between them. (`★ Insight` block: "Initial test premise wrong — same proof state derives same envelope.")

**Confidence:** High — diagnosis and fix rationale stated explicitly in transcript.

---

### Task 14 — fix `?? 'open'` fallback inline, defer the proofStatus-gate finding to Task 15

**Context:** Quality reviewer flagged two Important findings: (1) `recordDesignerGo` sets `const fromStatus = newState.proofStatus ?? 'open'` — the fallback hides a bug if `proofStatus` is somehow missing on a closed-state input; (2) `recordDesignerGo` doesn't gate on `proofStatus !== 'closed'` (a second close call would mutate a closed proof).

**Information used:**
- Quality reviewer report
- Plan: Task 15 adds `reopen_proof` and explicitly gates re-entry, including verifying proofStatus state machine
- `state.js:148-152` — direct read confirming the fallback shape

**Alternatives considered:**
- `Fix both inline` — rejected: #2 belongs to Task 15's domain (state-machine gating across close/reopen)
- `Defer both` — rejected: #1 is a 1-line fix
- `Fix #1, defer #2 to Task 15` — chosen

**Decision:** Removed the `?? 'open'` fallback (provenance.from now reflects actual prior status); left re-close gating to Task 15.

**Rationale:** Distinguished cosmetic-correctness fix from genuine cross-task refactoring concern. (Note: Task 15 quality review later flagged the resulting stale comment in `state.js`, which the agent fixed inline as a self-noted carry-over.)

**Confidence:** High — "Fix the `?? 'open'` fallback. Skip #2 (Task 15 will gate proofStatus)" stated in transcript.


<!-- created-at: 2026-05-07T13:21:58Z -->
<!-- produced-by finish-write-records@v0003 -->
