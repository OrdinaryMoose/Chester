# Using the Design Proof System (Mode 1: direct library import)

**Audience**: an automated agent (Claude Code session, script, MCP tool implementation) on the same machine as the Chester repo at `/home/mike/Documents/CodeProjects/Chester/`.

**Scope**: Mode 1 access — import the design-proof-system modules directly as a JavaScript library, construct a domain bridge in-process, drive it through the public facade. No persistence across process exits; no MCP wrapper.

## 1. What the design proof system is

A library for constructing **structured design proofs** — collections of evidences, propositions, resolutions, definitions, concerns, rules, permissions, and frictions related by typed predicates. The system enforces:

- Schema validation on element creation
- Per-category consent authority (DESIGNER, DESIGN_PARTNER, SYSTEM)
- Approval-gated derivation (ratified propositions/resolutions/definitions/concerns derive into their public predicates)
- Auto-detection of structural problems (coverage gaps, ungrounded propositions, overlapping definitions)
- A strict closure gate that refuses to permit closure when structural problems exist
- Snapshot/restore-backed counterfactual probing

The system is implemented as pure JavaScript ESM modules. No build step required; Node 18+ (ESM support) suffices.

## 2. Where it lives

```
/home/mike/Documents/CodeProjects/Chester/skills/design-proof-system/references/
├── engine/
│   ├── Engine.js              ← the Datalog engine (FactStore, RuleStore, Evaluator, Snapshot)
│   └── (supporting modules)
└── domain/
    ├── domain-bridge.js       ← MAIN ENTRY POINT — createDomainBridge factory
    ├── tags.js                ← enums (ELEMENT_CATEGORIES, CONSENT_SOURCES, INFERENCE_PATTERNS, FRICTION_SHAPES, FRICTION_DISPOSITIONS)
    ├── schema.js              ← CATEGORY_REGISTRY: per-category required fields & authority
    ├── mutations.js           ← runOperation: the verb dispatcher (most callers go through the bridge)
    ├── translation.js         ← per-category EDB writes
    ├── render.js              ← read-only query and render helpers
    ├── closure-policy.js      ← derived rules: closure_permitted, unresolved_friction, etc.
    ├── friction-policy.js     ← derived rules: coverage_gap, ungrounded_proposition, overlap, conflict
    ├── counterfactual.js      ← collapseTest / queryWithout / queryWith probes
    ├── authority.js           ← consent verification + per-category authority lookup
    ├── lifecycle.js           ← round counter + phase helpers
    └── engine-port-adapter.js ← shape normalizer (flat-API engine → port-bundled engine)
```

**HARD RULE**: there is also a system at `skills/design-large-task/proof-mcp/`. **These are different systems. Do not cross.** Do not grep, read, import, or reference any file under `skills/design-large-task/proof-mcp/` when using or extending the design-proof-system. They happen to have parallel concepts; the boundary is intentional.

## 3. Boilerplate setup (every agent needs this)

```js
import { Engine } from '/home/mike/Documents/CodeProjects/Chester/skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '/home/mike/Documents/CodeProjects/Chester/skills/design-proof-system/references/domain/domain-bridge.js';
import {
  CONSENT_SOURCES,
  ELEMENT_CATEGORIES,
  INFERENCE_PATTERNS,
  FRICTION_SHAPES,
  FRICTION_DISPOSITIONS,
} from '/home/mike/Documents/CodeProjects/Chester/skills/design-proof-system/references/domain/tags.js';

// One Engine = one proof. To run multiple proofs concurrently, construct multiple bridges.
const engine = new Engine();

// Four cross-cutting adapters the bridge requires. These are minimal in-memory implementations.
let counter = 0;
const bridge = createDomainBridge({
  engine,
  clock:                { now: () => Date.now() },
  idAllocator:          { next: (shape) => `${shape}_${++counter}` },
  consentVerification:  { verify: () => true },          // verify gates beyond consent.source if needed
  persistenceRepo:      { saveState: (logEntry) => {} }, // called after every successful op
});

// Every mutation call requires a consent object naming the actor's role.
const consent = { source: CONSENT_SOURCES.DESIGNER };
```

**The four adapters in detail**:

- `clock.now()` — must return a number (used for `created_at` and `approved` timestamps). `Date.now()` is fine; use a constant for deterministic tests.
- `idAllocator.next(shape)` — must return a unique string id. The string `shape` is the element category being created (e.g., `'evidence'`, `'proposition'`); a sensible scheme is `${shape}_${counter}`.
- `consentVerification.verify(consent)` — additional check beyond the source matching. Return `true` to accept, `false` to reject. Use `() => true` for trusted callers.
- `persistenceRepo.saveState(logEntry)` — called after every successful operation with `{verb, args, ts}`. **The system has no `loadState` complement** — state does not persist across process exits unless the agent explicitly serializes via `engine.serialize()` / `engine.loadFrom()`.

## 4. Element categories and their argument shapes

All shapes are validated at `bridge.addElement()` call time. Missing required fields throw `SHAPE_INVALID`.

| Category | Required fields | Optional | Notes |
|---|---|---|---|
| `EVIDENCE` | `source`, `claim` | `url`, `citation` | Empirical given. Not approval-gated. |
| `RULE` | `statement` | `rationale` | Inferential framework rule. Statement-only EDB. |
| `PERMISSION` | `statement` | `rationale` | Designer-granted allowance. Statement-only EDB. |
| `PROPOSITION` | `statement`, `grounding`, `collapse_test`, `inference_pattern` | `scope` | Approval-gated. `grounding` is an evidence id; `inference_pattern` ∈ `INFERENCE_PATTERNS`. |
| `RISK` | `statement` | `severity` | Failure mode. Not approval-gated; addressing is done via RESOLUTION. |
| `RESOLUTION` | `statement`, `addresses` | — | Approval-gated. `addresses` is a risk or concern id (string, or array of strings). |
| `FRICTION` | `shape`, `description` | `disposition` | `shape` ∈ `FRICTION_SHAPES`. Operator-elevated structural objection. |
| `CONCERN` | `label` | `description` | Approval-gated. Designer-flagged worry needing resolution coverage. |
| `DEFINITION` | `term`, `definition` | `scope` | Approval-gated. `scope` discriminates legitimate dual-use of a term (default `'global'`). |

**Enums** (from `tags.js`):

- `ELEMENT_CATEGORIES`: `EVIDENCE`, `RULE`, `PERMISSION`, `PROPOSITION`, `RISK`, `RESOLUTION`, `FRICTION`, `CONCERN`, `DEFINITION`
- `CONSENT_SOURCES`: `DESIGNER`, `DESIGN_PARTNER`, `SYSTEM`
- `INFERENCE_PATTERNS`: `GROUNDS_IMPLY_CONCLUSION`, `ABSENCE_IMPLIES_ABSENCE`, `ENABLEMENT`, `STRUCTURAL`
- `FRICTION_SHAPES`: `COVERAGE_GAP`, `OVERLAP`, `CONFLICT`, `UNGROUNDED`, `STAGNATION`
- `FRICTION_DISPOSITIONS`: `ADDRESS`, `DEFER`, `DISMISS`, `OVERRIDE`

## 5. The bridge facade — every method available

### Mutation
- `addElement(args, consent) → {id}` — primary creation; `args.idShape` selects category
- `reviseElement(args, consent) → {id}` — creates new element with new id; **requires `args.supersedes`** (id of element being revised) and `args.idShape`; emits `superseded(new, old)` fact
- `withdrawElement({id}, consent) → {}` — marks element withdrawn; minimal `{id}` args (no other fields required)
- `ratifyElement({elementId, source}, consent) → {}` — approves an element; per-category authority enforced (PROPOSITION/RESOLUTION/DEFINITION/CONCERN accept DESIGN_PARTNER too)
- `addDefinition`, `reviseDefinition`, `ratifyDefinition`, `deprecateDefinition` — category-specific shortcuts; pass DEFINITION fields directly
- `addConcern`, `reviseConcern`, `ratifyConcern`, `withdrawConcern` — same shortcuts for CONCERN
- `addFriction(args, consent) → {}` — operator-elevation of a friction; takes FRICTION fields
- `overrideFrictionDisposition({frictionId, disposition}, consent) → {}` — sets a friction's disposition (ADDRESS, DEFER, DISMISS, OVERRIDE)
- `queryOverlap(args)` — convenience for `queryProof` on `overlap_detected`

### Closure
- `presentClosingArgument(args, consent) → {}` — declares intent to close; throws `CLOSURE_NOT_PERMITTED` if gate refuses
- `confirmClosureGo(args, consent) → {}` — commits closure; throws same on refusal

### Read-only / render
- `renderStructuredProof(args) → string` — markdown summary, withdrawn elements filtered out
- `renderElementDeep({id}) → {id, predicate, ...fields, withdrawn: boolean} | null`
- `renderClosingArgument(args) → {permitted, asOf, detectedFrictions: [{shape, args}]}`
- `renderDatalogProjection(args) → {facts, rules}` — full EDB + rule projection suitable for replay by a second engine
- `renderLaneSlice({lane?}) → {lane, elements}`
- `getProofState(args) → {evidence, propositions, resolutions, closurePermitted}` — filtered to live elements
- `queryProof({pattern}) → Array<binding>` — raw Datalog query; `pattern` is `[predicate, args]` with `{var: 'X'}` for variables and `'_'` for don't-care
- `detectFrictions() → Array<{shape, args}>` — typed aggregation of auto-detected structural findings, canonicalized
- `runCounterfactual({propId}) → {stillCloses, failureReasons}` — probes "what if propId's approval were retracted"; uses snapshot/restore; **refuses with `COUNTERFACTUAL_REFUSED_DURING_TX` if an external tx is open**

## 6. Closure semantics — strict gate

`closure_permitted` is true **iff all of**:

- No unresolved frictions (operator-elevated frictions with no disposition or 'unset' disposition AND no `friction_disposition` satellite)
- No unaddressed concerns (ratified concerns not covered by an approved addressing resolution)
- No coverage gaps (auto-detected: ratified risks with no live addressing resolution)
- No ungrounded propositions (auto-detected: ratified propositions whose grounding evidence was withdrawn)
- No overlapping definitions (auto-detected: two definitions sharing both term and scope)

**The previously-supported "detect → elevate → DEFER" workflow no longer suffices.** Operators wanting to tolerate a detected structural problem must address the underlying issue:
- Coverage gap → add a resolution that addresses the risk (placeholder/defer-style resolutions are fine)
- Ungrounded proposition → add new evidence and (for now) revise the proposition to ground in it
- Overlap → distinguish the definitions via the `scope` field (e.g., `{term: 'Session', scope: 'web'}` vs `{term: 'Session', scope: 'os'}`)

**When closure is refused, `presentClosingArgument`/`confirmClosureGo` throw `CLOSURE_NOT_PERMITTED` with a message listing the offending element ids.** The list comes from `closure_failure_reason(R)` — also queryable directly via `bridge.queryProof({pattern: ['closure_failure_reason', [{var: 'R'}]]})`.

## 7. Canonical happy-path example

```js
// Setup (see §3 above)
const consent = { source: CONSENT_SOURCES.DESIGNER };

// 1. Evidence
const ev = bridge.addElement({
  idShape: ELEMENT_CATEGORIES.EVIDENCE,
  source: 'design-decision',
  claim: 'Users authenticate once per session.',
}, consent);

// 2. Proposition grounded in evidence
const prop = bridge.addElement({
  idShape: ELEMENT_CATEGORIES.PROPOSITION,
  statement: 'Sessions are scoped to a single user.',
  grounding: ev.id,
  collapse_test: 'If sessions shared users, audit trails would lose attribution.',
  inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
}, consent);

// 3. Risk + resolution
const risk = bridge.addElement({
  idShape: ELEMENT_CATEGORIES.RISK,
  statement: 'Session hijacking via stolen cookie.',
  severity: 'high',
}, consent);
const res = bridge.addElement({
  idShape: ELEMENT_CATEGORIES.RESOLUTION,
  statement: 'httpOnly + SameSite=Lax cookies.',
  addresses: risk.id,
}, consent);

// 4. Ratify approval-gated elements
bridge.ratifyElement({ elementId: prop.id, source: 'designer' }, consent);
bridge.ratifyElement({ elementId: res.id,  source: 'designer' }, consent);

// 5. Check closure
const result = bridge.renderClosingArgument({});
// { permitted: true, asOf: <ts>, detectedFrictions: [] }

if (result.permitted) {
  bridge.presentClosingArgument({ source: 'designer', claim: 'closure-attempt' }, consent);
  bridge.confirmClosureGo({ source: 'designer', claim: 'closure-confirm' }, consent);
}
```

## 8. Common patterns

### Probe what would break if a proposition were retracted

```js
const cf = bridge.runCounterfactual({ propId: prop.id });
// { stillCloses: false, failureReasons: ['risk_3', 'concern_5'] }
```

### Iterate a proposition through revisions (with supersession link)

```js
const v2 = bridge.reviseElement({
  idShape: ELEMENT_CATEGORIES.PROPOSITION,
  supersedes: v1.id,                          // REQUIRED — name the prior element
  statement: 'Revised statement.',
  grounding: ev.id,
  collapse_test: '...',
  inference_pattern: INFERENCE_PATTERNS.STRUCTURAL,
}, consent);
bridge.ratifyElement({ elementId: v2.id, source: 'designer' }, consent);
// Both v1 and v2 derive into `proposition` until v1 is explicitly withdrawn.
// Query the supersession chain: bridge.queryProof({pattern: ['superseded', [{var:'A'}, {var:'B'}]]})
```

### Multi-author ratification (DESIGNER + DESIGN_PARTNER)

```js
bridge.ratifyElement({ elementId: prop.id, source: 'designer' },       { source: CONSENT_SOURCES.DESIGNER });
bridge.ratifyElement({ elementId: prop.id, source: 'design_partner' }, { source: CONSENT_SOURCES.DESIGN_PARTNER });
// Now bridge.queryProof({pattern: ['two_yes_complete', [{var:'I'}]]}) includes prop.id
```

### Inspect lifecycle phase

```js
bridge.queryProof({ pattern: ['phase', [{ var: 'P' }]] });
// [{P: 'establishment'}]  before presentClosingArgument
// [{P: 'presentation'}]   after present
// [{P: 'confirmation'}]   after confirm
```

## 9. Common errors and what they mean

| Error code | Common cause |
|---|---|
| `SHAPE_INVALID` | Required field missing from `args` for the target category. Check `requiredFields` in `schema.js`. |
| `SHAPE_INVALID: REVISE requires args.idShape` | REVISE without `args.idShape`. Pass `idShape: ELEMENT_CATEGORIES.X`. |
| `SHAPE_INVALID: REVISE requires args.supersedes` | REVISE without `args.supersedes`. Pass the prior element's id. |
| `CONSENT_INVALID` | `consent.source` not in the per-category authority allowlist (e.g., DESIGN_PARTNER attempting to ratify EVIDENCE). |
| `PRECONDITION_FAILED` (predicate: 'evidence') | `ratifyElement` requires at least one evidence fact in the proof. Add an EVIDENCE element first (it can be a precondition placeholder). |
| `CLOSURE_NOT_PERMITTED` | `presentClosingArgument`/`confirmClosureGo` fired but `closure_permitted` is false. Message lists offending ids; query `closure_failure_reason` for the full list. |
| `COUNTERFACTUAL_REFUSED_DURING_TX` | `runCounterfactual` called while an external engine transaction is open. The snapshot/restore bracket would silently invalidate the tx handle. Close the tx first. |
| `NESTED_TRANSACTION_OP_REFUSED` (op: 'loadFrom' or 'clear') | Same engine-tx-conflict pattern as above, surfaced by `Engine.loadFrom`/`Engine.clear`. |
| `POST_COMMIT_SAVE_FAILED` | `persistenceRepo.saveState` threw after the engine had already committed. Engine state is committed; only the save failed. Caller should handle as a recoverable persistence error. |

## 10. Persistence gap (important caveat)

`persistenceRepo.saveState({verb, args, ts})` is called after every successful operation, but **there is no `loadState` complement built into the bridge**. To persist state across process exits, the agent must serialize/restore via the engine primitives directly:

```js
// Save
const serialized = engine.serialize();
fs.writeFileSync('proof-state.json', JSON.stringify(serialized));

// Load (in a fresh process)
const restored = JSON.parse(fs.readFileSync('proof-state.json'));
const engine = new Engine();
engine.loadFrom(restored);
// Now construct the bridge as usual — it will see the loaded state.
// Note: idAllocator counter must be initialized past the highest id in the loaded state
// to avoid id collisions on subsequent adds.
```

**`engine.loadFrom()` refuses if an external transaction is open** (`NESTED_TRANSACTION_OP_REFUSED`). Restore is a fresh-engine operation.

## 11. Reference: working examples

Stress-test scripts in `/home/mike/Documents/CodeProjects/Chester/docs/chester/working/stress-tests/calculator-proof-design-proof-system/` are working Mode 1 agents. Read any of these as a template:

- `calculator-fully-featured-simulation.mjs` — full sweep through every element category
- `adversarial-session-design-simulation.mjs` — friction detection scenarios
- `evolution-rate-limiter-simulation.mjs` — revision/withdrawal/supersession lifecycle
- `counterfactual-stress-simulation.mjs` — snapshot/restore stress test
- `probe-*.mjs` — focused single-feature probes

Each follows the boilerplate from §3, drives the bridge through the facade, and uses `bridge.queryProof()` for inspection. The probes are especially good as small-scope templates (one feature, ~50–100 lines).

## 12. Versioning anchor

This documentation reflects the design-proof-system at git SHA **`7c361df`** on `main` of `https://github.com/OrdinaryMoose/Chester.git`. Notable behavior set:

- Closure gate is strict (auto-escalates coverage gaps, ungrounded propositions, overlaps)
- REVISE requires explicit `idShape` + `supersedes` and emits supersession link
- RATIFY consults per-category authority (DESIGN_PARTNER can ratify PROPOSITION/RESOLUTION/DEFINITION/CONCERN)
- Definitions disambiguate via `scope` (default `'global'`)
- `renderClosingArgument` returns `{permitted, asOf, detectedFrictions}`
- Counterfactual refuses during open transactions

If the local SHA differs significantly, re-read the bridge facade in `domain-bridge.js` for the authoritative method list — it's the source of truth.
