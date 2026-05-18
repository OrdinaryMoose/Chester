# VOCABULARY — Canonical Terms for the Design Proof System

**Audience:** any agent driving the design-proof-system through `domain-bridge.js`.

**Status:** derived from the running implementation in this directory (`tags.js`, `schema.js`, `mutations.js`, `closure-policy.js`, `friction-policy.js`, `authority.js`, `lifecycle.js`, `translation.js`, `render.js`). When this file disagrees with the redesign cascade under `docs/chester/plans/20260511-01-mp-redesign-proof-system/`, **this file wins** for current usage — that cascade describes a target state, not the running system.

**Purpose:** every agent session should use the same names for the same concepts. Reference these terms verbatim in artifacts, error messages, and inter-agent communication. Coined synonyms drift the vocabulary and break successor sessions.

**Naming convention:** `UPPER_SNAKE_CASE` names refer to programmatic enum members in `tags.js` (e.g. `ELEMENT_CATEGORIES.EVIDENCE`). Their wire-level string values are lowercase (e.g. `'evidence'`). When writing prose, prefer the **Capitalized noun** form (e.g. "Evidence", "Proposition") for the load-bearing concept. Predicate names from the Datalog projection (`evidence/N`, `closure_permitted/0`) stay lowercase with their arity suffix.

---

## 1. Element categories

There are exactly **nine** element categories. The set is closed; new categories may not be invented at runtime.

**Evidence** (`ELEMENT_CATEGORIES.EVIDENCE`, wire value `'evidence'`)
A factual claim treated as given inside the proof. Required fields: `source`, `claim`. Optional: `url`, `citation`. Authored only by `DESIGNER`. Not approval-gated — adding the element makes it active. Rendered under the **Givens** section.

**Rule** (`ELEMENT_CATEGORIES.RULE`, wire value `'rule'`)
A normative statement that licenses inference inside the proof. Required fields: `statement`. Optional: `rationale`. Authored only by `DESIGNER`. Rendered under the **Inferential Framework** section.

**Permission** (`ELEMENT_CATEGORIES.PERMISSION`, wire value `'permission'`)
A designer-granted allowance — typically a relaxation of a Rule under named conditions. Required fields: `statement`. Optional: `rationale`. Authored only by `DESIGNER`. Rendered under the **Inferential Framework** section.

**Proposition** (`ELEMENT_CATEGORIES.PROPOSITION`, wire value `'proposition'`)
A claim that must hold for the design to be sound. Approval-gated — derives into the public `proposition/N` predicate only after ratification. Required fields: `statement`, `grounding`, `collapse_test`, `inference_pattern`, `reasoning_chain` (non-empty string). Optional: `scope`, `rejected_alternatives`. May be ratified by `DESIGNER` or `DESIGN_PARTNER`. Rendered under the **Lemmas** section.

**Risk** (`ELEMENT_CATEGORIES.RISK`, wire value `'risk'`)
An identified failure mode requiring coverage. Required fields: `statement`. Optional: `severity`. Authored only by `DESIGNER`. Not approval-gated. Rendered under the **Problem** section.

**Resolution** (`ELEMENT_CATEGORIES.RESOLUTION`, wire value `'resolution'`)
A statement that addresses a Risk or Concern, identified by the `addresses` field. Approval-gated. Required fields: `statement`, `addresses` (a single element id or an array of ids). May be ratified by `DESIGNER` or `DESIGN_PARTNER`. Rendered under the **Theorems** section.

**Friction** (`ELEMENT_CATEGORIES.FRICTION`, wire value `'friction'`)
An operator-elevated or system-detected structural objection. Required fields: `shape` (∈ `FRICTION_SHAPES`), `description`. Optional: `disposition` (∈ `FRICTION_DISPOSITIONS`). Authored by `SYSTEM` (auto-detected) or `DESIGNER` (manually elevated). Rendered under the **Frictions** section. A Friction is **unresolved** until it carries a disposition or is withdrawn.

**Concern** (`ELEMENT_CATEGORIES.CONCERN`, wire value `'concern'`)
A designer-flagged worry that must be covered by a Resolution before closure. Approval-gated. Required fields: `label`. Optional: `description`. May be ratified by `DESIGNER` or `DESIGN_PARTNER`. Rendered under the **Problem** section.

**Definition** (`ELEMENT_CATEGORIES.DEFINITION`, wire value `'definition'`)
A first-class vocabulary fixing. Approval-gated. Required fields: `term`, `definition`. Optional: `scope` (default `'global'`). May be ratified by `DESIGNER` or `DESIGN_PARTNER`. Rendered under the **Definitions** section. Two definitions sharing **both** term and scope produce an `OVERLAP` friction; same term with different scope is intentional dual-use.

---

## 2. Element fields

Field names are stable across categories. Use these names verbatim in arguments — `addElement` validates required fields by exact name.

- `source` — on Evidence: the closed four-value enum `EVIDENCE_SOURCE_ENUM` from `tags.js`. One of: `'industry'`, `'codebase'`, `'prior-record'`, `'agent-derivation'`. The engine rejects any other value with `SHAPE_INVALID`.
- `claim` — on Evidence: the factual content itself.
- `statement` — on Rule, Permission, Proposition, Risk, Resolution: the prose body of the element.
- `grounding` — on Proposition: the id of an Evidence element that supports the Proposition. Single id (string).
- `collapse_test` — on Proposition: prose stating what would fail if this Proposition were removed. Used by `runCounterfactual`.
- `reasoning_chain` — on Proposition: prose IF/THEN inference from grounding to claim. Must be a non-empty string.
- `inference_pattern` — on Proposition: a value from `INFERENCE_PATTERNS` (closed enum).
- `rejected_alternatives` — on Proposition: optional list of alternatives considered and rejected, each with reasons.
- `scope` — on Proposition or Definition: discriminator distinguishing legitimate dual-use of a term or proposition.
- `severity` — on Risk: optional qualifier (e.g. `'high'`, `'medium'`).
- `addresses` — on Resolution: the id (or array of ids) of the Risk(s) and/or Concern(s) this Resolution covers.
- `shape` — on Friction: a value from `FRICTION_SHAPES` (closed enum).
- `description` — on Friction or Concern: prose describing the objection or worry.
- `disposition` — on Friction: a value from `FRICTION_DISPOSITIONS` (closed enum).
- `label` — on Concern: the short identifier of the worry.
- `term`, `definition` — on Definition: the vocabulary word and its prose definition.
- `supersedes` — on REVISE operations: the id of the prior element being replaced. Required by `reviseElement`.
- `idShape` — on every `addElement`/`reviseElement` call: the target category. Required.
- `rationale` — on Rule, Permission, or a consent token: optional explanatory prose.

---

## 3. Closed-set enumerations

These are the only legal values for the fields they govern. Every value below is exported from `tags.js`. Coining new values is a contract violation; closed-enum violations raise `SHAPE_INVALID`.

**`ELEMENT_CATEGORIES`** — `EVIDENCE`, `RULE`, `PERMISSION`, `PROPOSITION`, `RISK`, `RESOLUTION`, `FRICTION`, `CONCERN`, `DEFINITION`.

**`PHASES`** — `ESTABLISHMENT`, `LANE_RESOLUTION`, `PRESENTATION`, `CONFIRMATION`. Currently reachable: `ESTABLISHMENT` → `PRESENTATION` → `CONFIRMATION`. `LANE_RESOLUTION` is defined but not yet wired to a transition.

**`CONSENT_SOURCES`** — `DESIGNER`, `DESIGN_PARTNER`, `SYSTEM`. Identifies the authority of a mutation.

**`INFERENCE_PATTERNS`** — `GROUNDS_IMPLY_CONCLUSION`, `ABSENCE_IMPLIES_ABSENCE`, `ENABLEMENT`, `STRUCTURAL`. Used on `Proposition.inference_pattern`.

**`FRICTION_SHAPES`** — `COVERAGE_GAP`, `OVERLAP`, `CONFLICT`, `UNGROUNDED`, `STAGNATION`. Used on `Friction.shape` and as the `shape` field of `detectFrictions()` results.

**`FRICTION_DISPOSITIONS`** — `ADDRESS`, `DEFER`, `DISMISS`, `OVERRIDE`. Set on a Friction via `overrideFrictionDisposition`. **Important:** carrying any of these dispositions resolves the Friction for closure purposes, but **a Friction whose underlying structural problem still exists also still blocks closure** independently — see §6.

**`WITHDRAWAL_DISPOSITIONS`** — `EXPLICIT`, `SUPERSEDED`, `PHANTOM`. The reason recorded when an element is withdrawn.

**`ACTION_LABELS`** — `ADD`, `REVISE`, `WITHDRAW`, `RATIFY`, `MANAGE_FRICTION`, `PRESENT_CLOSING_ARGUMENT`, `CONFIRM_CLOSURE_GO`, `OPEN_PROOF`. Internal verb names dispatched through `runOperation`.

**`RENDER_SECTIONS`** — `PROBLEM`, `GIVENS`, `DEFINITIONS`, `INFERENTIAL_FRAMEWORK`, `LEMMAS`, `THEOREMS`, `FRICTIONS`, `REJECTED`, `CLOSURE_STATUS`. The sections of the rendered proof. Each category's `renderSection` in `schema.js` names exactly one.

---

## 4. Authority and consent

**Consent token** — the second argument to every mutating bridge call. Shape: `{ source: <CONSENT_SOURCES value>, token?: string }`. Validated by `authority.verifyConsent` against the per-category, per-action authority allowlist in `schema.js`.

**Authority allowlist** — `CATEGORY_REGISTRY[<category>].authority` maps each action (`add`, `revise`, `withdraw`, `ratify`) to the list of `CONSENT_SOURCES` values permitted to perform it. Authority is asymmetric:

- `add`, `revise`, `withdraw` — for every category except `FRICTION`, only `DESIGNER` is permitted. `FRICTION.add` additionally permits `SYSTEM` (for auto-detection).
- `ratify` — `DESIGNER` always; `DESIGN_PARTNER` additionally permits ratifying `PROPOSITION`, `RESOLUTION`, `DEFINITION`, `CONCERN`.

**Ratification** (synonym: **approval**) — a separate operation that endorses an approval-gated element. Records an `approved(elementId, source, ts)` fact. The element's defining rule requires this fact in its body; without ratification the element does not derive into its public predicate.

**Approval-gated categories** — `PROPOSITION`, `RESOLUTION`, `CONCERN`, `DEFINITION`. The other five categories (Evidence, Rule, Permission, Risk, Friction) become active on add and do not require ratification.

**Two-yes complete** — the derived state in which the same element has been ratified by **both** a `DESIGNER` source and a `DESIGN_PARTNER` source. Observable via the `two_yes_complete(I)` predicate. Does not change derivation behavior — single-source ratification still derives the element.

---

## 5. Lifecycle

**Phase** — derived from closure-state facts. Queryable as `phase(P)`.

- `establishment` — no closure attempt in progress.
- `presentation` — `presentClosingArgument` fired; awaiting `confirmClosureGo`.
- `confirmation` — `confirmClosureGo` fired; proof is closed.

**Round** — a monotonically increasing counter incremented on each mutation. Used by revision tracking and audit.

**Withdrawal** — marking an element inactive via `withdrawElement`. Writes a `withdrew(elementId)` fact. Withdrawn elements:

- are excluded from `getProofState` and `renderStructuredProof`
- still exist in the engine and remain queryable
- if a Proposition's `grounding` evidence is withdrawn, the Proposition becomes **ungrounded** (see §6)

**Supersession** — `reviseElement` creates a new element with a new id and emits a `superseded(newId, oldId)` fact linking them. Both versions remain derived until the old id is explicitly withdrawn.

---

## 6. Detected structural problems and closure failure

The system auto-detects four structural problems. Each is a derived Datalog predicate and **each independently blocks closure**.

**`coverage_gap_detected(C)`** — Risk `C` exists, is not withdrawn, and no non-withdrawn Resolution addresses it. Friction shape: `COVERAGE_GAP`.

**`ungrounded_proposition(P)`** — Proposition `P` exists but has no `effective_grounding` (every grounding evidence is either missing or withdrawn). Friction shape: `UNGROUNDED`.

**`overlap_detected(T1, T2)`** — two distinct Definitions share **both** `term` and `scope`. Friction shape: `OVERLAP`. Canonicalized to `T1 < T2` by `detectFrictions()` so each underlying overlap appears once.

**`conflict_detected(R1, R2)`** — currently a stub fired only by an explicit `conflict_decl(R1, R2)` base fact (no rule asserts that today). Friction shape: `CONFLICT`.

**`unresolved_friction(F)`** — Friction `F` carries the sentinel disposition `'unset'` (no override yet applied) and is not withdrawn.

**`unaddressed_concern(C)`** — ratified Concern `C` is not covered by a non-withdrawn approved Resolution and is not withdrawn.

**`closure_permitted/0`** — the derived predicate. True iff **none** of the above hold. The closure gate (`triggerGate`) refuses `presentClosingArgument` and `confirmClosureGo` when this is false.

**`closure_failure_reason(R)`** — one fact per offending element id, populated by per-detection diagnostic rules. The `CLOSURE_NOT_PERMITTED` error message lists these.

**`effective_grounding(P)`** — derived intermediate: Proposition `P` has at least one grounding fact pointing at a non-withdrawn Evidence.

**`effective_addresses(R, C)`** — derived intermediate: Resolution `R` addresses Concern/Risk `C` and is not withdrawn.

---

## 7. Bridge operation verbs

Verbs are the public facade method names on the bridge returned by `createDomainBridge`. Use these names verbatim; do not coin synonyms.

**Mutation:**
- `addElement(args, consent)` — create a new element. `args.idShape` selects category.
- `reviseElement(args, consent)` — replace an element; requires `args.supersedes`.
- `withdrawElement({id}, consent)` — mark inactive.
- `ratifyElement({elementId, source}, consent)` — endorse an approval-gated element.
- `overrideFrictionDisposition({frictionId, disposition}, consent)` — set a Friction's disposition.
- `addFriction(args, consent)` — operator-elevation shortcut.
- Category shortcuts: `addDefinition`, `reviseDefinition`, `ratifyDefinition`, `deprecateDefinition`, `addConcern`, `reviseConcern`, `ratifyConcern`, `withdrawConcern`.

**Closure:**
- `presentClosingArgument(args, consent)` — declares intent to close. Throws `CLOSURE_NOT_PERMITTED` on a refused gate.
- `confirmClosureGo(args, consent)` — commits closure. Throws on a refused gate.

**Read-only / render:**
- `renderStructuredProof(args)` — markdown summary; withdrawn elements filtered.
- `renderElementDeep({id})` — full element record.
- `renderClosingArgument(args)` — `{permitted, asOf, detectedFrictions}`.
- `renderDatalogProjection(args)` — `{facts, rules}` suitable for replay.
- `renderLaneSlice({lane?})` — per-Concern subgraph.
- `getProofState(args)` — `{evidence, propositions, resolutions, closurePermitted}`.
- `queryProof({pattern})` — raw Datalog query; `pattern` is `[predicate, args]` with `{var: 'X'}` for variables and `'_'` for don't-care.
- `queryOverlap(args)` — convenience for `queryProof` on `overlap_detected`.
- `detectFrictions()` — canonicalized list of all auto-detected structural findings.
- `runCounterfactual({propId})` — snapshot-backed "what if this proposition were retracted" probe. Refuses with `COUNTERFACTUAL_REFUSED_DURING_TX` while an external engine transaction is open.

---

## 8. Engine concepts (cross-reference)

The engine is a pure Datalog evaluator in `../engine/`. Agents driving the bridge rarely need these directly, but they appear in queries and error messages. Definitions kept short; canonical home is `../engine/`.

- **Predicate** — a named relation symbol with an arity. `evidence/2` and `evidence/3` are different predicates.
- **Atom** — a predicate applied to a tuple of terms (constants or `{var: 'X'}` variables).
- **Fact** — a ground atom (no variables). Lives in the EDB.
- **Rule** — a Horn clause: head atom plus body atoms. Lives in the rule store.
- **EDB** (extensional database) — the asserted base facts. Domain writes here.
- **IDB** (intensional database) — facts derived by applying rules to the EDB.
- **Fixed point** — the state where applying all rules produces no new facts. The engine reaches this on every query.
- **Query** — a pattern matched against the fixed point, returning bindings.
- **Stratified negation** — negation-as-failure restricted to ensure decidable evaluation. Rules organized into strata by negation dependency.
- **Snapshot / restore** — engine primitives capturing and restoring full state. Used by `runCounterfactual`.
- **Transaction** — bounded sequence of engine mutations that commit atomically. Counterfactual and bulk-mutation operations refuse while a transaction is open.

---

## 9. Error codes

Errors thrown by the bridge carry a `code` field. The closed set:

- `SHAPE_INVALID` — required field missing, or closed-enum field carries a value outside its enum. Subforms: `REVISE requires args.idShape`, `REVISE requires args.supersedes`.
- `CONSENT_INVALID` — `consent.source` not in the per-category authority allowlist, or the consent port rejected the token.
- `PRECONDITION_FAILED` — operation-specific precondition unmet. E.g. `ratifyElement` requires at least one Evidence fact to exist.
- `CLOSURE_NOT_PERMITTED` — `presentClosingArgument` / `confirmClosureGo` fired while `closure_permitted` is false. Message lists offending element ids from `closure_failure_reason`.
- `COUNTERFACTUAL_REFUSED_DURING_TX` — `runCounterfactual` called while an external engine transaction is open.
- `NESTED_TRANSACTION_OP_REFUSED` — engine-level guard against transaction conflicts (e.g. `loadFrom`, `clear`).
- `POST_COMMIT_SAVE_FAILED` — `persistenceRepo.saveState` threw after the engine had already committed. Engine state is committed; only the save failed.
- `AUTHORITY_LOOKUP` — `lookupAuthority` called with an unknown `idShape`.

---

## 10. Adapter ports (cross-cutting)

These four ports are required to construct a bridge. Inject them once at boot; agents do not call them directly.

- **Clock (`IClock`)** — `clock.now() → number`. Provides timestamps for `created_at` and `approved`.
- **ID allocator (`IIDAllocator`)** — `idAllocator.next(shape) → string`. Generates unique ids per element. Must be initialized past the highest existing id when restoring serialized state.
- **Consent verification (`IConsentVerification`)** — `consentVerification.verify(consent) → boolean`. Additional check beyond `consent.source` matching.
- **Persistence repository (`IPersistenceRepository`)** — `persistenceRepo.saveState(logEntry)`. Called after every successful operation. **Has no `loadState` complement** — restore is via `engine.serialize()` / `engine.loadFrom()` directly.

---

## 11. Naming hygiene rules

When writing artifacts, error messages, or inter-agent prose:

- Use the **Capitalized noun** form for the concept (Evidence, Proposition, Concern). Do not lowercase load-bearing nouns mid-sentence.
- Use the **enum identifier** form (`ELEMENT_CATEGORIES.PROPOSITION`) when naming code references.
- Use the **wire string** form (`'proposition'`) when describing data on the wire.
- Use the **predicate** form (`proposition/3`) when describing Datalog state.
- Do not invent synonyms for canonical verbs: it is `ratify`, not "approve" or "endorse"; `withdraw`, not "delete" or "retract"; `revise`, not "update" or "edit".
- Do not invent synonyms for canonical detected conditions: it is `ungrounded_proposition`, not "unsupported proposition"; `coverage_gap_detected`, not "missing resolution".
- When a friction shape appears in prose, use its enum form in `UPPER_SNAKE_CASE` (`COVERAGE_GAP`), not a paraphrase.

If a needed term is not in this file, add it here first, then use it. New terms enter the vocabulary via this file, not via ad-hoc coining in code or artifacts.

---

## 12. Element ID naming

The bridge accepts any string id — this convention is **not enforced by code**. It is enforced by agents reading this file. Use it for every proof so successor sessions can read prior artifacts without translation.

**Format:** `<acronym>_<NNN>` where `<acronym>` is the four-character abbreviation per the table below, and `<NNN>` is a zero-padded three-digit **per-category** counter starting at `001`. Overflow to four or more digits is permitted; do not change the acronym.

**Acronym table** — one row per element category, exhaustive:

| Category enum                       | Wire string  | Acronym | Example id  |
|-------------------------------------|--------------|---------|-------------|
| `ELEMENT_CATEGORIES.EVIDENCE`       | `evidence`   | `evid`  | `evid_001`  |
| `ELEMENT_CATEGORIES.RULE`           | `rule`       | `rule`  | `rule_001`  |
| `ELEMENT_CATEGORIES.PERMISSION`     | `permission` | `perm`  | `perm_001`  |
| `ELEMENT_CATEGORIES.PROPOSITION`    | `proposition`| `prop`  | `prop_001`  |
| `ELEMENT_CATEGORIES.RISK`           | `risk`       | `risk`  | `risk_001`  |
| `ELEMENT_CATEGORIES.RESOLUTION`     | `resolution` | `rsln`  | `rsln_001`  |
| `ELEMENT_CATEGORIES.FRICTION`       | `friction`   | `fric`  | `fric_001`  |
| `ELEMENT_CATEGORIES.CONCERN`        | `concern`    | `cern`  | `cern_001`  |
| `ELEMENT_CATEGORIES.DEFINITION`     | `definition` | `defn`  | `defn_001`  |

**Per-category counters, not a global counter.** Each category increments independently. `evid_001` and `prop_001` can coexist. The second Proposition is `prop_002` regardless of how many Evidence, Risk, or Resolution elements were added before it. Do not use a single shared counter across categories — it produces ids like `prop_007` for the *first* Proposition because six elements of other categories preceded it, which obscures category-relative ordering in renders.

**Canonical `idAllocator` construction.** When wiring the bridge per §10, the cross-cutting `IIDAllocator` port adapter must follow this convention:

```js
const SHORT_NAMES = Object.freeze({
  evidence:    'evid',
  rule:        'rule',
  permission:  'perm',
  proposition: 'prop',
  risk:        'risk',
  resolution:  'rsln',
  friction:    'fric',
  concern:     'cern',
  definition:  'defn',
});
const counters = Object.create(null);
const idAllocator = {
  next: (shape) => {
    const acronym = SHORT_NAMES[shape];
    if (!acronym) throw new Error(`Unknown shape: ${shape}`);
    counters[shape] = (counters[shape] ?? 0) + 1;
    return `${acronym}_${String(counters[shape]).padStart(3, '0')}`;
  },
};
```

The `shape` argument passed to `next()` is the **wire string** (lowercase, e.g. `'evidence'`), not the enum identifier — that is what `mutations.js` passes downstream from `args.idShape`.

**Restoring serialized state.** Each per-category counter must be initialized past the highest existing id of that category before any further `next()` call; otherwise new adds collide with restored ones. After `engine.loadFrom(...)`, scan the loaded state for ids of each category, parse out the numeric suffix, and set `counters[shape] = max + 1` per category. A bulk restore that leaves counters at zero will produce duplicate-id errors on the first `addElement`.

**Disambiguation.** `cern` is the acronym for **CONCERN** (an element category), not **CONFLICT** (a friction shape). Friction shapes appear only as values of a Friction element's `shape` field and have no ids of their own — Friction *elements* use `fric_NNN` regardless of which `FRICTION_SHAPES` value they carry.

**No alternate acronyms.** Do not use `e_`, `ev`, `evi`, or `evidence_` for Evidence. Do not use `r_`, `rl`, or `rules_` for Rule. The four-character acronyms above are the only legal prefixes. Successor sessions grep for `prop_` to find Propositions; alternates break that grep.
