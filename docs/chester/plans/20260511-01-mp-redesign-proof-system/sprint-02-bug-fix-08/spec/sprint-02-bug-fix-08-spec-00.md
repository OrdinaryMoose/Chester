# Spec: Authority Rebalance + Designer-Inform Channel

**Sprint:** sprint-02-bug-fix-08
**Parent brief:** docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-bug-fix-08/design/sprint-02-bug-fix-08-design-00.md
**Architecture:** Hybrid — central `agent_action` emission in `runOperation` (Architect A); minimal-surface schema rewrite for D1 (both architects converged); D3 revert of reviseResolution dual-partner approval (both architects converged).

## Target System

`skills/design-proof-system/references/domain/` only.

## Goal

Land three coordinated changes to the proof system's authority and approval surface: (D1) rewrite per-category authority allowlists so the designer holds sole authority over framing categories (Rule, Permission, Definition, Concern, Resolution) and the agent (`DESIGN_PARTNER`) joins as a peer on content categories (Evidence, Proposition, Risk, Friction); (D2) record every `DESIGN_PARTNER`-sourced action as an `agent_action(elementId, verb, source, ts)` EDB fact emitted centrally from `runOperation`; (D3) revert sprint-02-bug-fix-07's D12 `reviseResolution` dual-partner approval to single-source (designer-only) so the runtime authority check and the emitted approval facts agree.

## Components

- **`domain/schema.js`** — `CATEGORY_REGISTRY[*].authority` rewrites for seven categories:
  - **EVIDENCE** (line ~68): `add/revise/withdraw` = `[DESIGNER, DESIGN_PARTNER]`; `ratify` = `[DESIGNER]` (unchanged).
  - **RULE** (line ~80): unchanged (DESIGNER-only across all verbs).
  - **PERMISSION** (line ~92): unchanged (DESIGNER-only).
  - **PROPOSITION** (line ~104): `add/revise/withdraw` = `[DESIGNER, DESIGN_PARTNER]`; `ratify` = `[DESIGNER, DESIGN_PARTNER]` (ratify unchanged — Q1 = 1a; agent retains ratify on Proposition).
  - **RISK** (line ~116): `add/revise/withdraw` = `[DESIGNER, DESIGN_PARTNER]`; `ratify` = `[DESIGNER]` (unchanged).
  - **RESOLUTION** (line ~128): `add/revise/withdraw` = `[DESIGNER]` (unchanged); `ratify` = `[DESIGNER]` (**tightening — drops DESIGN_PARTNER**).
  - **FRICTION** (line ~140): `add` = `[SYSTEM, DESIGNER, DESIGN_PARTNER]` (SYSTEM preserved for auto-detection; DESIGN_PARTNER joins); `revise/withdraw` = `[DESIGNER, DESIGN_PARTNER]`; `ratify` = `[DESIGNER]` (unchanged).
  - **CONCERN** (line ~152): `add/revise/withdraw` = `[DESIGNER]` (designer-only across all four verbs per brief); `ratify` = `[DESIGNER]` (**tightening — drops DESIGN_PARTNER**).
  - **DEFINITION** (line ~164): `add/revise/withdraw` = `[DESIGNER]` (designer-only across all four verbs per brief); `ratify` = `[DESIGNER]` (**tightening — drops DESIGN_PARTNER**).

- **`domain/translation.js`** — EDB predicate registration for D2.
  - Add `'agent_action'` to the `EDB_PREDICATES` set (returned by `getDeclaredEDBPredicates()`) so the bridge's boot validator accepts it.
  - No translator body changes. No signature changes. No new helpers.

- **`domain/mutations.js`** — D2 central emission + D3 reviseResolution revert.
  - **D2 emission.** Inside `runOperation`'s try block, after `spec.translate(...)` has run and after the `for (const [pred, a] of metaFacts) ports.facts.assertFact(pred, a)` loop (the §6.1 step-5/step-6 boundary, around mutations.js:375), and BEFORE `ports.query.derive()`, insert a verb-aware emission:
    ```js
    // D2: designer-inform channel — record every DESIGN_PARTNER action as an EDB fact.
    if (consent.source === CONSENT_SOURCES.DESIGN_PARTNER) {
      let targetId;
      if (verbName === ACTION_LABELS.WITHDRAW) {
        targetId = args.id;
      } else if (verbName === ACTION_LABELS.RATIFY) {
        targetId = args.elementId;
      } else {
        targetId = id;
      }
      ports.facts.assertFact('agent_action', [targetId, verbName, consent.source, ts]);
    }
    ```
    Verb-specific because allocator semantics differ: WITHDRAW runs the allocator (producing an unused id) but the actual target is `args.id`; RATIFY skips the allocator (per D1) and uses `args.elementId`; ADD / REVISE / REVISE_PROPOSITION / REVISE_RESOLUTION / MANAGE_FRICTION use the allocator-produced `id` as the target. (Adversarial review caught a `??` fallback chain that silently emitted the unused allocator id on WITHDRAW.)
  - **D3 reviseResolution revert.** In the `OPERATION_SPECS[ACTION_LABELS.REVISE_RESOLUTION]` entry: change `consentCategory` from `[CONSENT_SOURCES.DESIGNER, CONSENT_SOURCES.DESIGN_PARTNER]` to `[CONSENT_SOURCES.DESIGNER]`; in the `translate` function's `baseFacts` array, remove the two lines emitting `['approved', [id, 'design_partner', ts]]` and `['two_yes', [id, 'design_partner']]`. The remaining baseFacts retain `['approved', [id, 'designer', ts]]` and `['two_yes', [id, 'designer']]`. `reviseProposition` is NOT touched — Proposition retains dual-partner ratify under D1, so the dual-partner approval pattern stays valid there.

- **`domain/__tests__/sprint-02-bug-fix-08.test.js`** — new test file. Cross-layer real-engine fixture (`makeRealBridge` pattern from the adjacent `sprint-02-bug-fix-07.test.js`). Covers AC-1.x through AC-3.x below.

- **`domain/__tests__/sprint-02-bug-fix-07.test.js`** — existing file, in-lockstep edits.
  - AC-12.2 / AC-12.3 assertions on `two_yes_complete` deriving for the `reviseResolution`-produced element are updated. Replace `expect(bridge.queryProof({ pattern: ['two_yes_complete', [newRes.id]] }).length).toBe(1)` with assertions that the new resolution derives (`expect(bridge.queryProof({ pattern: ['resolution', [newRes.id, { var: 'S' }]] }).length).toBe(1)`) and that approval is single-source (one `approved` row, source = designer). `reviseProposition`'s `two_yes_complete` assertions are unchanged.

## Data Flow

Three flows change.

1. **DESIGN_PARTNER add of EVIDENCE/PROPOSITION/RISK/FRICTION.** Caller invokes the relevant bridge method with `consent.source = 'design_partner'`. `runOperation` step 2 calls `lookupAuthority(targetShape, ACTION_LABELS.ADD)` and `verifyConsent` admits the source against the new allowlist. Translator emits the element's normal baseFacts and metaFacts in the same transaction. After the metaFacts loop, the D2 emission block fires (`consent.source === DESIGN_PARTNER`), asserting `agent_action(id, 'add', 'design_partner', ts)` into the EDB. Commit proceeds. The fact participates in serialization automatically (bug-fix-07 D5 serializes the full EDB).

2. **DESIGN_PARTNER ratify attempt on DEFINITION/CONCERN/RESOLUTION.** `runOperation` step 2 calls `lookupAuthority(targetShape, ACTION_LABELS.RATIFY)`. After D1, the allowlist returns `[DESIGNER]` only. `verifyConsent` throws `CONSENT_INVALID` before any fact assertion. The transaction never opens. No `agent_action` fact emitted (the conditional sits after `verifyConsent`).

3. **DESIGNER reviseResolution.** Authority check passes (RESOLUTION ratify allowlist is `[DESIGNER]`). Translator emits the new resolution element plus exactly one `approved(newId, 'designer', ts)` and one `two_yes(newId, 'designer')` fact (D3 revert). `two_yes_complete(newId)` does NOT derive (only one source present). The new resolution element DOES derive into `resolution(newId, S)` via the approval-gated rule template — single-source approval is sufficient for derivation; only `two_yes_complete` requires both.

Designer reads the agent action history later via the existing `queryProof` surface:
```js
bridge.queryProof({ pattern: ['agent_action', [{ var: 'I' }, { var: 'V' }, { var: 'S' }, { var: 'T' }]] })
```
Or via `renderDatalogProjection({})` for the full EDB dump. No new bridge methods, no new transport.

## Error Handling

No new error codes. The existing `CONSENT_INVALID` (confirmed at `authority.js:12,16,19`) fires on the new tightened authority paths (DESIGN_PARTNER attempting ratify on DEFINITION/CONCERN/RESOLUTION) and on agent attempting any verb on the five designer-only categories. Error message names the category, verb, supplied source, and the allowed source list — same shape as the existing consent-rejection messages.

## Testing Strategy

New behavioral tests in `domain/__tests__/sprint-02-bug-fix-08.test.js`. Coverage per decision:

- **D1 — authority allowlist.** For each of the seven affected categories × the four verbs (28 cells, though half are unchanged), one or two tests covering: positive — DESIGN_PARTNER source succeeds where allowed; negative — DESIGN_PARTNER source rejected with the appropriate error code where the allowlist forbids it. Bulk the matrix coverage into a few iterating tests to keep file size manageable, but assert per-cell behavior.
- **D2 — agent_action emission.** Three tests: DESIGN_PARTNER add emits exactly one `agent_action` row; DESIGNER add emits zero rows; `SYSTEM`-sourced FRICTION add emits zero rows (the emission gate is DESIGN_PARTNER-only).
- **D3 — reviseResolution single-source.** Two tests: after `bridge.reviseResolution(...)` with DESIGNER consent, the EDB contains exactly one `approved` row for the new resolution (source = designer) and exactly one `two_yes` row (source = designer); `two_yes_complete(newId)` does not derive; the new resolution derives into `resolution(newId, S)`.

Lockstep test updates in `sprint-02-bug-fix-07.test.js`:
- AC-12.2 and AC-12.3 swap their `two_yes_complete` assertions for the single-source equivalent described above.

Regression sweep:
- Full test suite under `domain/__tests__/`, `domain/structural-tests/`, `engine/__tests__/` passes after the changes.
- Any pre-existing test that ratified DEFINITION/CONCERN/RESOLUTION with DESIGN_PARTNER source needs updating in lockstep to use DESIGNER. Plan step 1 includes a discovery grep to find such tests before implementation.

## Constraints

- **System Boundary.** All work within `skills/design-proof-system/references/`. Anything outside this sub-sprint's scope must not be read, grepped, or named in the artifacts.
- **Behavior change acknowledged.** D3 reverts a behavior shipped just one sub-sprint earlier (bug-fix-07 D12). Any caller observing `two_yes_complete` deriving on reviseResolution outputs will see it stop firing.
- **`agent_action` unbounded.** The fact accumulates indefinitely in the EDB. No retention or compaction in this sub-sprint; deferred.
- **Existing fixture allocator prefix divergence.** `makeRealBridge` in `sprint-02-bug-fix-07.test.js` uses `${shape}_${n}` IDs rather than `ID_PREFIXES`-derived prefixes; this sub-sprint inherits that fixture without changing it. Test assertions for AC-3.x use the fixture's actual prefix shape (`resolution_N`).

## Non-Goals

- **No designer-acknowledge mechanism.** The agent_action fact is reviewable but not acknowledgeable. No "designer-has-seen-this" gesture in this sub-sprint.
- **No `agent_action` retention / compaction.** Facts persist indefinitely.
- **No agent ratify path on FRICTION.** Friction ratification stays DESIGNER-only.
- **No removal of the SYSTEM source on FRICTION-add.** Auto-detection coexists with DESIGN_PARTNER agent participation.
- **No new bridge facade methods.** Designer reads via existing `queryProof` and `renderDatalogProjection`.
- **No translator signature change.** D2 is centralized in `runOperation`; translators remain `(args, id, ts)`.
- **No retroactive `agent_action` for prior sessions.** Only actions taken after this sub-sprint lands produce the fact.

## Acceptance Criteria

### AC-1.1 — Authority allowlist: agent permitted on EVIDENCE/PROPOSITION/RISK/FRICTION add

**Observable boundary:**
- `lookupAuthority(category, 'add')` for each of EVIDENCE, PROPOSITION, RISK, FRICTION returns an array that includes `CONSENT_SOURCES.DESIGN_PARTNER`.
- Calling `bridge.addElement({idShape: <category>, ...}, { source: 'design_partner' })` for each of these categories succeeds — no `CONSENT_INVALID` thrown.

**Given:** A fresh bridge with the new allowlists.
**When:** Agent invokes `addElement` for each of the four categories.
**Then:** All four calls succeed; resulting elements are admitted into the EDB.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.2 — Authority allowlist: agent rejected on RULE/PERMISSION add

**Observable boundary:**
- `lookupAuthority(category, 'add')` for RULE and PERMISSION does NOT include `DESIGN_PARTNER`.
- Calling `addElement` with `source: 'design_partner'` for these categories throws `CONSENT_INVALID`.

**Given:** A fresh bridge.
**When:** Agent attempts `addElement` for RULE and again for PERMISSION.
**Then:** Both throw `CONSENT_INVALID`; no EDB facts written.

### AC-1.3 — Authority allowlist: agent rejected on DEFINITION/CONCERN/RESOLUTION ratify (tightening)

**Observable boundary:**
- `lookupAuthority(category, 'ratify')` for DEFINITION, CONCERN, RESOLUTION does NOT include `DESIGN_PARTNER`.
- Designer adds a draft element of each category; agent attempts to ratify with `source: 'design_partner'`; each ratify throws `CONSENT_INVALID`.

**Given:** A bridge with one draft DEFINITION (`defn_1`), one draft CONCERN (`cern_1`), one draft RESOLUTION (`resolution_1`).
**When:** Agent attempts `ratifyElement({ elementId: <id>, source: 'design_partner' }, { source: 'design_partner' })` for each.
**Then:** All three throw `CONSENT_INVALID`. The elements remain in draft / declaration-only state.

### AC-1.4 — Authority allowlist: agent permitted on PROPOSITION ratify (unchanged from current)

**Observable boundary:**
- `lookupAuthority(PROPOSITION, 'ratify')` continues to include `DESIGN_PARTNER`.
- Agent ratifies a draft Proposition; the Proposition derives.

**Given:** A bridge with a draft Proposition.
**When:** Agent invokes `ratifyElement({ elementId, source: 'design_partner' }, { source: 'design_partner' })`.
**Then:** Call succeeds; `proposition(<id>, S)` derives.

### AC-1.5 — Authority allowlist: agent permitted on EVIDENCE/PROPOSITION/RISK/FRICTION revise and withdraw

**Observable boundary:**
- For each of the four agent-permitted categories, `revise` and `withdraw` succeed with `source: 'design_partner'`.

**Given:** A bridge with one existing element of each of EVIDENCE, PROPOSITION, RISK, FRICTION.
**When:** Agent invokes `reviseElement` and `withdrawElement` for each.
**Then:** All operations succeed.

### AC-2.1 — agent_action fact emits on DESIGN_PARTNER actions

**Observable boundary:**
- After a DESIGN_PARTNER-sourced add of an EVIDENCE element, the EDB contains exactly one `agent_action(<evid-id>, 'add', 'design_partner', <ts>)` fact.
- After a DESIGN_PARTNER-sourced add of a RISK element, same shape with `verb = 'add'`.
- After a DESIGN_PARTNER-sourced ratify of a draft Proposition, exactly one `agent_action(<prop-id>, 'ratify', 'design_partner', <ts>)`.

**Given:** A fresh bridge.
**When:** Agent performs an add (Evidence), a separate add (Risk), and a ratify (Proposition) — three operations.
**Then:** `bridge.queryProof({ pattern: ['agent_action', [{var:'I'}, {var:'V'}, {var:'S'}, {var:'T'}]] })` returns exactly three rows, one per operation, with the expected `(I, V, S, T)` bindings.

### AC-2.2 — agent_action fact does NOT emit on DESIGNER or SYSTEM actions

**Observable boundary:**
- After a DESIGNER-sourced add of an EVIDENCE element, zero `agent_action` rows exist.
- After a SYSTEM-sourced add of a FRICTION element (auto-detection path), zero `agent_action` rows exist.

**Given:** A fresh bridge.
**When:** Designer adds an Evidence and a system-sourced caller adds a Friction.
**Then:** `queryProof({ pattern: ['agent_action', ...] })` returns an empty array.

### AC-2.3 — agent_action fact appears in renderDatalogProjection

**Observable boundary:**
- A DESIGN_PARTNER action's `agent_action` fact appears in the `facts` array of `renderDatalogProjection({})` output.

**Given:** A bridge with one DESIGN_PARTNER-sourced add.
**When:** `bridge.renderDatalogProjection({})` is invoked.
**Then:** The returned `facts` array contains at least one entry whose first element is `'agent_action'`.

### AC-3.1 — reviseResolution emits single-source approval only

**Observable boundary:**
- After `bridge.reviseResolution(...)` with DESIGNER consent, the EDB contains exactly one `approved(<new-id>, 'designer', _)` fact for the new resolution — NOT a `'design_partner'` row.
- The EDB contains exactly one `two_yes(<new-id>, 'designer')` fact — NOT a `'design_partner'` row.

**Given:** A bridge with an existing ratified Resolution (`resolution_1`).
**When:** Designer invokes `bridge.reviseResolution({ supersedes: 'resolution_1', ... }, { source: 'designer' })`.
**Then:** Queries for `approved(<new-id>, _, _)` and `two_yes(<new-id>, _)` each return exactly one row, source = `'designer'`. No `'design_partner'` row appears for the new resolution.

### AC-3.2 — reviseResolution: two_yes_complete does not derive

**Observable boundary:**
- After `reviseResolution`, `two_yes_complete(<new-id>)` does NOT derive.

**Given:** A bridge after AC-3.1's setup.
**When:** Designer queries `bridge.queryProof({ pattern: ['two_yes_complete', [<new-id>]] })`.
**Then:** Returns an empty array.

### AC-3.3 — reviseResolution: new resolution still derives (single-source approval sufficient)

**Observable boundary:**
- The new resolution element derives into `resolution(<new-id>, S)` even though only DESIGNER approved.

**Given:** A bridge after AC-3.1's setup.
**When:** Designer queries `bridge.queryProof({ pattern: ['resolution', [<new-id>, { var: 'S' }]] })`.
**Then:** Returns exactly one row.

### AC-3.4 — reviseResolution rejects DESIGN_PARTNER consent

**Observable boundary:**
- `bridge.reviseResolution(..., { source: 'design_partner' })` throws `CONSENT_INVALID`.

**Given:** A bridge with an existing Resolution.
**When:** Agent attempts `reviseResolution` with `design_partner` consent.
**Then:** Throws `CONSENT_INVALID`. No new resolution created.

### AC-4.1 — Existing tests pass with lockstep updates

**Observable boundary:**
- The full test suite under `domain/__tests__/`, `domain/structural-tests/`, `engine/__tests__/` passes after the changes.
- The only modifications to existing tests are: `sprint-02-bug-fix-07.test.js` AC-12.2 / AC-12.3 (Resolution-side assertions updated from `two_yes_complete` to single-source approval + `resolution` derivation); any pre-existing test that ratified DEFINITION/CONCERN/RESOLUTION with DESIGN_PARTNER source updated to DESIGNER.

**Given:** The current test suite.
**When:** All tests are run after the changes.
**Then:** All tests pass. No regression beyond the named lockstep updates.

<!-- created-at: 2026-05-18T21:21:42Z -->
<!-- produced-by design-specify@v0003 -->
