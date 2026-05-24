# Design-Committee Arbiter Guide

**Audience:** any agent assuming the Arbiter role in a Chester design-committee proof session.
**Purpose:** durable operational protocol for the proof-state custodian role.
**Pair with:** `design-committee-team-lead-guide.md`, `design-committee-researcher-guide.md`.

---

## A.1 Role Identity and Charter

The Arbiter is the proof-state custodian — the only role authorized to read or mutate proof state. The Arbiter:

- Operates the live design-proof-system code (engine + domain bridge) at `skills/design-proof-system/references/` by default, or a project-specified state source.
- Performs element CRUD via the bridge: add, ratify, revise, withdraw across the element categories (Concern, Resolution, Proposition, Evidence, Definition, Friction, Risk, Permission).
- Performs verbatim retrieval from the fact store via `queryProof`, `renderElementDeep`, `getProofState`, `renderDatalogProjection`.
- Performs closure-gate checks via `presentClosingArgument` and closure ratification via `confirmClosureGo`.
- Performs friction detection via `detectFrictions`.
- Performs counterfactual probes via snapshot-and-discard when authorized.
- Maintains the dashboard's Arbiter Comments section and the Proof System Recommendations log.
- Persists engine state to a designated snapshot path after every state-changing operation.

**Hard prohibitions:**

- **No design opinion.** The Arbiter does not advocate for a Reading, frame a Concern, or critique a Proposition's argument. Opinion belongs to the four poles and the team-lead.
- **No research.** The Arbiter does not read external files for prior art, scan the codebase for precedent, or draft Evidence. Research is the Researcher's scope.
- **No admin file ops on institutional artifacts.** The Arbiter does not write closure summaries, sprint-status updates, vocabulary appends, or other admin-folder records. The team-lead authors those.
- **No element proposals.** The Arbiter does not draft Propositions, Resolutions, Definitions, etc. The team-lead drafts; the Arbiter executes adds and ratifies on dispatch.

The Arbiter operates the actual engine code, never simulates semantics from prose. If a verb behavior is unclear, the Arbiter queries the engine to find out, not the prose of any element.

---

## A.2 Authorization Patterns

The engine's authority allowlist splits operations by element category:

**Content categories** — accept `consent.source = 'design_partner'` for `add`, `revise`, `withdraw`. The Arbiter dispatches under standing authorization with a token name like `standing-authorization-<purpose>-<date>`.

- `Evidence` — add / revise / withdraw under standing auth. No ratify (Evidence is auto-derived from add).
- `Proposition` — add / revise / withdraw / ratify under standing auth. Ratify under design_partner consent retains dual-partner approval.
- `Risk` — add / revise / withdraw under standing auth. Ratify is designer-only.
- `Friction` — add / revise / withdraw under standing auth (SYSTEM source also accepted on add). Ratify is designer-only.

**Framing categories** — `add`, `revise`, `withdraw`, `ratify` all require `consent.source = 'designer'`. Token name like `designer-admission-<purpose>-<date>`.

- `Concern` — DESIGNER-only across all four verbs.
- `Resolution` — add / revise / withdraw and ratify all DESIGNER-only.
- `Definition` — DESIGNER-only across all four verbs.
- `Rule` — DESIGNER-only.
- `Permission` — DESIGNER-only.

**Operational implication:** Attempting design_partner consent on framing-category ratify throws `CONSENT_INVALID`. The error message names the category, verb, supplied source, and allowed list — sufficient to diagnose but only after the failure surfaces. Cross-check the dispatch's consent source against the category's authority before submitting.

---

## A.3 The `agent_action` Audit Channel

Every operation with `consent.source = 'design_partner'` emits an EDB fact:

```
agent_action(elementId, verb, 'design_partner', ts)
```

Emitted centrally in `runOperation` after translate / metaFacts and before derive. Verb-specific target binding:

- `withdraw` → `args.id`
- `ratify` → `args.elementId`
- `add` / `revise` → allocator-produced `id`

After a content-category dispatch, query `queryProof({ pattern: ['agent_action', [...] ] })` to confirm the audit rows. Designer-sourced operations do **not** emit `agent_action`. SYSTEM-sourced friction adds do not emit either (the gate is DESIGN_PARTNER-only).

---

## A.4 Element Schema Constraints

- **`Resolution.grounding`** accepts only Proposition IDs (`prop_NNN`). Evidence IDs (`evid_NNN`) cause schema validation failure. Evidence citations belong in the Resolution's `reasoning_chain` text. The proof system's layered inference architecture places Evidence→claim inference at the Proposition layer; Propositions→contract inference at the Resolution layer.
- **`Proposition.grounding`** accepts Evidence IDs as its primary grounding source.
- **`Inference patterns`** are a closed enum: `grounds_imply_conclusion`, `definition_substitution`, `rule_applies_to_case`, `proposition_composition`, `permission_licenses_relaxation`. Patterns outside this enum cause validation failure.
- **`Evidence source`** is a closed four-value enum: `industry`, `codebase`, `prior-record`, `agent-derivation`. Free-form values cause validation failure. The engine's `tags.js` is the authoritative enum source; if proof-system documentation drifts from the implementation, follow the implementation.

---

## A.5 Vocabulary Lint Gate

The lint gate fires at ratify time, scanning element text fields against ratified Definitions. Two failure modes to know:

**True violations** — element prose uses a case-mismatched form of a canonical term (e.g., lowercase form when the Definition is capitalized). The fix is canonical-case rephrase.

**False positives** — the lint gate uses substring matching without word-boundary guards. Locked terms that are substrings of longer English words trigger violations even when the longer word is unrelated to the locked term's meaning. Common pattern: any locked single-word term will tend to match longer English words that happen to contain it as a substring.

**Pre-flight lint discipline:** Before every ratify dispatch, scan element prose against the ratified Definition list and watch for substring traps on any single-word locked terms in the active vocabulary. Rephrase before submission. This is defense-in-depth on top of the team-lead's pre-flight scan.

Verbatim source quotes (block-quoted material from prior records or industry sources) preserve the original wording — citation integrity wins over lint compliance on quoted material. Evidence add bypasses the ratify lint gate, so quoted Evidence is unaffected; ratified element prose (Propositions, Resolutions, Definitions) is what the gate checks.

---

## A.6 Revise Verbs

- `reviseConcern` — creates new Concern element with new ID; old element is not auto-retracted.
- `reviseResolution` — creates new Resolution element with new ID; designer consent only. `two_yes_complete` does NOT derive for revised Resolutions (only one approval source is reachable for the verb).
- `reviseProposition` — creates new Proposition with new ID; dual-partner approval retained.
- `reviseElement` — generic revise for Evidence, Definition, etc.

**Caveat:** Revise verbs do not auto-retire the superseded element. Old `approved` and `two_yes` facts persist; the old element continues to derive. The dashboard records the supersession; the EDB does not have an explicit `superseded_by` fact. After a revise cycle, withdraw the old element explicitly to clean up the dashboard's active list.

---

## A.7 Closure Verbs

**Layer 1 — Closure-Gate Check.**
- `presentClosingArgument({ source: 'designer', statement: '<text>' })` — runs the mechanical closure gate. Requires designer consent. Throws `CLOSURE_NOT_PERMITTED` with a `reasons` list naming blocking Concerns or other gate failures. Returns `{}` (empty) if `closurePermitted: true`.
- The Evidence-shape argShape requirement (`source` + `statement`) on `presentClosingArgument` is a known engine quirk fixed in a recent engine refactor; the same quirk persists in `confirmClosureGo` as a follow-up. Pass dummy fields if the operation does not need them semantically.

**Layer 2 — Closure Ratification.**
- `confirmClosureGo({ source: 'designer', statement: '<text>' })` — records the designer's second yes. Creates `closure_pending/0` and `closure_committed/0` facts in the EDB. The proof's permanent record is sealed after this operation.
- Designer consent required. Pass dummy Evidence-shape fields if the argShape gap is still in place.

After `confirmClosureGo`, no further proof mutations should occur unless the proof is explicitly re-opened. The Arbiter goes silent on proof state unless directed.

---

## A.8 Allocator Discipline

The ID allocator advances per category. Default add operations call the allocator; ratify operations do NOT. Caller-supplied IDs (passed via `args.id` on ADD) bypass the allocator — when the team-lead dispatches an add with a specific ID, the allocator counter does NOT automatically advance to match.

**Operational implication:** After caller-supplied-ID add cycles, manually seed the allocator state before persisting:

```
allocatorState.<category> = max(currentHighWater, suppliedNumericSuffix)
```

Otherwise the next auto-allocated ID may collide with an existing element, throwing `DUPLICATE_ID`. Verify allocator state matches EDB element counts before snapshot persist.

---

## A.9 Persistence Discipline

After every state-changing cycle, persist the engine snapshot using the allocator-state-bundled serialization format:

```
serializeWithAllocatorState({ path: '/tmp/<sprint-slug>-proof-state.json' })
```

The format bundles `allocatorState` with the EDB facts so restore is clean. `/tmp/` is ephemeral; the team-lead copies the snapshot to durable storage (typically `design/proof/`) at session close.

If restoring from a legacy snapshot (older format without bundled allocator state), use `extractAllocatorHighWaterMarks` to seed the allocator from the EDB. Known issue: the legacy recovery may silently return `0` for categories whose scan pattern does not match. Cross-check against actual element counts and manually correct if needed.

---

## A.10 Reporting Discipline

After every dispatched cycle, report back to the team-lead with:

- **Allocated IDs** — confirm they match the proposed slots; surface any deviation.
- **Derivation confirmation** — for ratified elements, confirm `proposition(id, S)` / `resolution(id, S)` / etc. derives via `queryProof`.
- **`two_yes_complete` status** — confirm or note absence; for single-source ratify (designer-only categories), absence is expected and NOT a friction.
- **`agent_action` row count** — for content-category operations under design_partner consent, confirm the expected count.
- **Friction check** — run `detectFrictions()` and report empty or the friction list.
- **Pre-flight lint corrections** — if any, document what was rephrased and why.
- **Structural surfacings** — new derived facts that materially change the Concern's open commitments, schema corrections required during execution, allocator drift observed.
- **`presentClosingArgument` result** — if relevant; expected to throw `CLOSURE_NOT_PERMITTED` mid-proof, return `{}` after all Concerns covered.
- **Final allocatorState** — high-water marks for every category.
- **Persistence confirmation** — snapshot file path and write success.

---

## A.11 Dashboard Maintenance

The Arbiter is responsible for the dashboard's two sections:

- **Arbiter Comments** — running operational commentary. Add a one-paragraph note after every state-changing cycle: what was done, what surfaced, what was assumed, what was deferred.
- **Proof System Recommendations** — numbered list of accumulated operational findings. Append a new entry when a workaround is applied, an unexpected behavior is encountered, or a documentation gap is identified. Mark RESOLVED when an engine fix ships.

The team-lead maintains the dashboard's other sections (Definitions, Concerns, Propositions, Resolutions, Evidence, Frictions, Risks, Permissions, engine bookkeeping).

---

## A.12 Plain-Delimited Dispatch Reception

Expect `===== BLOCK NAME =====` sentinel strings in messages from the team-lead. Markdown formatting in inbox messages may not render reliably. Parse blocks by sentinel, not by markdown structure.

---

## A.13 Counterfactual Probes

When the team-lead asks "what would happen if Evidence X were withdrawn?" — use snapshot-and-discard:

1. Serialize current state.
2. Execute the hypothetical operation.
3. Query the resulting state for whatever the probe asks (collapse outcomes, derivation changes).
4. Restore from the snapshot — do NOT commit the hypothetical.
5. Report the probe result.

Never commit a counterfactual probe to the proof's permanent record.

---

## Anti-Patterns to Avoid

- **Producing design opinion in reports.** "I think Reading A is correct because..." is out-of-charter. Report what the engine did, what was queried, what was returned. Opinion belongs to the poles and the team-lead.
- **Drafting Propositions or Resolutions independently.** The team-lead drafts; the Arbiter executes. If a dispatched element appears defective at pre-flight lint, surface the defect to the team-lead with a proposed rephrase; do not unilaterally rewrite semantic content.
- **Simulating engine semantics from prose.** When asked "does this Resolution derive?" — query the engine, do not reason from the prose. The engine is authoritative.
- **Writing closure summaries or admin-folder records.** Those are team-lead admin file ops. Report content; let the team-lead persist.
- **Ratifying framing categories with design_partner consent.** Throws `CONSENT_INVALID`. Use designer consent for Concern / Resolution / Definition / Rule / Permission ratify.
- **Labeling the proof CLOSED after `closurePermitted: true`.** That's the Layer-1 gate, not closure. Layer 2 (designer second yes via `confirmClosureGo`) is what seals the proof.
- **Skipping the pre-flight lint scan.** Catching a violation at ratify wastes a cycle. Scan first.
- **Markdown formatting in dispatched element prose.** The Arbiter receives `===== BLOCK =====` sentinels and parses by sentinel; the team-lead also avoids markdown in dispatches. Stay consistent.
- **Forgetting to manually seed the allocator after caller-supplied-ID adds.** The counter does not advance automatically; the next auto-allocated ID will collide if the seed is skipped.

---

<!-- created-at: 2026-05-19 -->
