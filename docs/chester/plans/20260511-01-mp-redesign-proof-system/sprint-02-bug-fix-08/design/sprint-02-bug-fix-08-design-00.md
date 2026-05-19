# Design Brief: Authority Rebalance + Designer-Inform Channel

**Status:** Approved
**Date:** 2026-05-18
**Sprint:** sprint-02-bug-fix-08
**Parent:** 20260511-01-mp-redesign-proof-system
**Target system:** `skills/design-proof-system/references/`

## Problem Statement

The current authority model in `CATEGORY_REGISTRY[*].authority` treats the design partner (agent) as a peer for ratifying claim-content categories (Proposition, Resolution, Concern, Definition). The designer wants to invert this: hold sole authority over the proof's *framing* (Rule, Permission, Definition, Concern, Resolution) and admit the agent as a first-class actor on the proof's *content* (Evidence, Proposition, Risk, Friction). Every agent-side action must be recorded as a designer-reviewable event so the designer retains visibility over what the agent has done.

## Prior Art

- `sprint-02-bug-fix-07` (merged) — D12 introduced `reviseProposition` and `reviseResolution` with atomic dual-partner approval. Under the new model proposed here, `reviseResolution`'s dual-partner approval is no longer valid (Resolution becomes designer-only ratify). This brief explicitly reverts that aspect of D12.
- `sprint-02-bug-fix-07` D4 — Resolution's `problem_anchor` accepts concern or risk. Unrelated to this brief; no interaction.

## Design Decisions

All decisions below are ratified.

### D1 — Authority allowlist rewrite

The `CATEGORY_REGISTRY[*].authority` entries in `schema.js` are updated to the matrix below.

- **DESIGNER-only across all four verbs** (add/revise/withdraw/ratify): RULE, PERMISSION, DEFINITION, CONCERN, RESOLUTION.
- **DESIGNER + DESIGN_PARTNER on add/revise/withdraw** (no ratify path; these categories are not approval-gated): EVIDENCE, RISK.
- **DESIGNER + DESIGN_PARTNER on add/revise/withdraw/ratify**: PROPOSITION (Q1 = 1a; agent retains its existing ratify scope on Proposition).
- **DESIGNER + DESIGN_PARTNER on add/revise/withdraw**: FRICTION. The existing `SYSTEM` source on FRICTION-add is preserved (auto-detection retained). DESIGN_PARTNER joins as an additional add path. Ratify remains DESIGNER-only.

Net effect vs current code: DEFINITION/CONCERN/RESOLUTION lose DESIGN_PARTNER from ratify; EVIDENCE/PROPOSITION/RISK/FRICTION gain DESIGN_PARTNER on add/revise/withdraw.

**Rejected alternatives:**
- Drop agent-ratify on Proposition (Q1 = 1b) — rejected: would inflate inspection cost on routine claim work where the agent is genuinely co-authoring; the designer's reviewable history (D2) provides sufficient oversight for the Proposition path.

### D2 — Designer-inform channel via `agent_action` EDB fact

Every action by a DESIGN_PARTNER caller emits an EDB fact `agent_action(elementId, verb, source, ts)` in the same transaction as the verb's normal facts. The designer reads via the existing `queryProof` surface; the fact participates in serialization automatically (D5 from bug-fix-07 already serializes the full EDB). No new bridge methods, no new transport, no out-of-band notification surface.

**Rejected alternatives:**
- Friction-elevation (Q2 = 2b) — rejected: dilutes the FRICTION semantic ("unresolved problem needing attention") with non-problem agent actions.
- Out-of-band notification port (Q2 = 2c) — rejected: introduces a new cross-cutting port for a value the EDB already provides via its existing storage and query model.

### D3 — Revert D12 reviseResolution dual-partner approval

The D12 `reviseResolution` verb currently emits both `approved(id, 'designer')` and `approved(id, 'design_partner')` facts atomically. Under D1, only DESIGNER may ratify Resolution, so the design_partner row is inconsistent with the runtime authority check. Drop the design_partner approval fact from `reviseResolution`'s translator (Q3 = 3a). The verb becomes single-source-approval (designer only); `two_yes_complete` does not derive for resolutions created via `reviseResolution`.

`reviseProposition` is unaffected — Proposition retains dual-partner ratify under D1, so D12's dual-partner approval pattern stays valid there.

**Rejected alternatives:**
- Keep the dual-partner facts symbolically (Q3 = 3b) — rejected: makes the authority model dishonest by allowing the engine to emit a partner ratification that the designer was the sole authenticator for.

## Scope

### In scope

- D1, D2, D3 above as a single triage batch for `sprint-02-bug-fix-08`.

### Out of scope

- **Designer-acknowledge mechanism for agent actions** — _not needed_: the EDB-fact channel gives the designer reviewable history; an explicit acknowledge gesture is a future-iteration concern if value emerges.
- **Free-form annotation on the `agent_action` fact** — _not yet_: minimal record (`elementId`, `verb`, `source`, `ts`) is enough; agent reasoning lives in the element's own fields if needed.
- **Per-category drift between `agent_action` semantics** — _not needed_: every agent-permitted verb on every agent-permitted category emits the same fact shape; consistent across the matrix.
- **Removing the SYSTEM-add path on FRICTION** — _not yet_: auto-detection remains a legitimate authoring path; DESIGN_PARTNER joins alongside SYSTEM, doesn't replace it.

## Constraints

- The work targets `skills/design-proof-system/references/` — domain layer only _(structural)_.
- System Boundary (root CLAUDE.md): no reads, grep, or references to `skills/design-large-task/proof-mcp/` _(normative — source: root CLAUDE.md)_.
- Backward compatibility: tests that author with DESIGNER source pass unchanged; tests that ratified DEFINITION/CONCERN/RESOLUTION with DESIGN_PARTNER need updating in lockstep to use DESIGNER.

## Assumptions

- **"Agent-permitted categories admit add/revise/withdraw uniformly."** — UNTESTED at the matrix level; existing fixtures only exercise DESIGNER paths for these four categories.
- **"`agent_action` fact does not interfere with existing closure / friction / coverage rules."** — UNTESTED. The fact lives in a new predicate name that no existing rule references; should be a pure addition. Boot validator will reject if mis-introduced.

## Residual Risks

- D3's revert of `reviseResolution` dual-partner approval changes a published behavior (D12 just landed in bug-fix-07). Any caller that observed `two_yes_complete` on revised resolutions will see the predicate stop firing.
- D1's tightening of CONCERN/DEFINITION/RESOLUTION ratify removes a capability the agent previously had. If a future caller depended on agent-ratify for these categories, it now throws `CONSENT_DENIED`.
- D2's `agent_action` fact is unbounded in the EDB — it grows with every agent action. No retention or compaction mechanism in this sub-sprint. Long-running proofs with heavy agent participation accumulate history without a pruning path.

## Acceptance Criteria

To be formalized during specify. Working notion:

- Each authority allowlist change has at least one positive (allowed source) and one negative (rejected source) test per affected verb × category.
- `agent_action` facts emit exactly when source is `DESIGN_PARTNER`; never when source is `DESIGNER` or `SYSTEM`.
- `reviseResolution` no longer emits the `approved(_, 'design_partner', _)` fact.
- Existing test suite continues to pass with mechanical source-substitution updates only on the three tightened categories.
