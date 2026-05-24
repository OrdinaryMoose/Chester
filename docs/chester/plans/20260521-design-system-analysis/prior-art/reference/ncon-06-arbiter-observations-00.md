# NCON-6 Arbiter Observations

**Sub-sprint:** `ncon-06-build-result-subscription`
**Author:** Arbiter (NCON-6 design committee session)
**Date:** 2026-05-20
**Format:** mirrors `ncon-05-proof-system-arbiter-retrospective-00.md`

This document records the Arbiter's operational observations on the proof system during the NCON-6 session, with focus on two designer-specified areas: interface layer (the bridge surface) and performance characteristics. Accumulated working recommendations are appended at the end.

---

## Section 1 — Interface Layer Analysis

### 1.1 What the Bridge Is and What It Costs

The bridge (`domain/domain-bridge.js`, 320 lines) is a factory that assembles a frozen facade object from five injected dependencies (engine, clock, idAllocator, consentVerification, persistenceRepo). Its construction performs a four-step boot sequence: port-bundle assembly, static rule registration, spec validation, and Phase-B template rule registration. The returned facade is a flat object of named methods, each delegating to either `runOperation` (mutations.js) or a render/query function.

The bridge is the only layer that knows about port bundles. The engine exposes raw fact/rule/query/tx ports. The bridge assembles four named bundles (readPorts, writePorts, probePorts, fullPorts) and passes the right bundle to each operation. This split means mutations only see what they need — writePorts for element adds, readPorts for lint checks — and the Arbiter cannot accidentally pass a mutation a read-only view or vice versa.

The cost of this architecture is the frozen-object surface. The facade is `Object.freeze`d with non-configurable properties. This made runtime patching during this session require a full delegation-wrapper object (copying all bridge keys into a fresh Object.create(null) and overriding specific methods). A Proxy-based approach was rejected by the JS runtime on the first attempt with a descriptive error ("proxy did not return its actual value for a non-configurable property"). The workaround works but is fragile: if the bridge gains new methods, the delegation wrapper's `Object.keys(bridge)` spread picks them up automatically, which is correct behavior — but a caller who doesn't know the wrapper exists would be confused by why `bridge.ratifyDefinition` behaves differently from `_patchedBridge.ratifyDefinition`.

**The `Object.freeze` itself is load-bearing.** It prevents accidental mutation of the bridge surface across the session and enforces the "single assembly seam" contract. The friction it created for the Arbiter was a direct consequence of the system working as designed — the cost is real but not incidental.

### 1.2 Bridge Functions Actually Used During This Session

Functions called in the NCON-6 open + concerns ingest scripts, with evaluation of whether the abstraction earns its weight:

**`addElement` / `addDefinition` / `addConcern`** — All three are one-liners that call `runOperation('add', {...args, idShape: category}, consent, fullPorts)`. The category-specific variants (`addDefinition`, `addConcern`) inject `idShape` so the caller doesn't need to know the category tag constant. Earns its weight: removes a footgun where the caller could forget `idShape` entirely or misspell the category string.

**`ratifyDefinition` / `ratifyConcern`** — Same pattern. The category injection is the value. One operational problem: these are the methods that the lint-exception patch required wrapping. Because the category is injected *inside* the bridge method, the Arbiter could not inject a "skip lint" argument from outside — there is no such argument. A thin `skipLint: true` flag on `ratify` args, validated against a caller-authority check, would have made the patch unnecessary. This is a design gap.

**`renderElementDeep`** — Used extensively for post-add verification and lint-exception element-type checking. After the D10 fix this returns the full element record including all stored fields. The abstraction earns its weight: the Arbiter uses this as a single call to verify stored content without knowing the EDB predicate arities. In the pre-D10 era (NCON-5 retrospective section 1.4) this was the most friction-generating call; now it is reliable.

**`getProofState`** — Returns `{ closurePermitted, unaddressedConcerns, frictionCount }`. Simple wrapper over a render function. The `unaddressedConcerns` field returned `undefined` when `closurePermitted: false` in the current session — the BLOCKED error message carries the IDs as a string but the structured field was absent. This is a minor reporting gap documented below (Rec #1-NCON6).

**`queryProof`** — Used for EDB verification (definition count, evidence count). Earns its weight as a pattern-matching query surface; however the caller must know the correct arity for the predicate being queried. `definition` arity-3 returns 28 (approved definitions only); `definition_decl` arity-3 returns 41 (all added definitions). This arity-sensitivity was a source of confusion in the NCON-6 session (state-load verification initially reported 28 definitions instead of 41 until the predicate was corrected). A higher-level `countElements(category)` method that hides predicate/arity would reduce this footgun.

**`serializeWithAllocatorState` / `loadFromWithAllocatorState`** — These are the most complex bridge methods (combined ~30 lines). They bundle the engine snapshot token with the allocator's per-category high-water marks so restore is clean. The D5 format was a significant improvement over the pre-D5 state (NCON-5 retrospective section 1.5). They earn their weight: without them, every session restore requires manual allocator seeding, which failed silently in NCON-5 for the Resolution category.

**`presentClosingArgument` / `detectFrictions`** — Both are thin wrappers. No friction with either. `detectFrictions` returned zero at every check this session, which is the expected and correct result at the pre-Proposition stage.

**Not used this session:** `runCounterfactual`, `renderStructuredProof`, `renderDatalogProjection`, `renderLaneSlice`, `renderClosingArgument`, `reviseProposition`, `reviseResolution`, `reviseElement`, `reviseConcern`, `reviseDefinition`, `withdrawElement`, `withdrawConcern`, `deprecateDefinition`, `overrideFrictionDisposition`, `queryOverlap`. These will become relevant in Rounds 3–5 when Propositions and Resolutions are added.

### 1.3 What a Thinner Interface Would Look Like

The bridge has two conceptually distinct concerns bundled together: (1) the boot sequence (port assembly, rule registration, spec validation) and (2) the operation facade (method dispatch to runOperation / render). These could be separated.

A thinner interface would expose `engine.assertFact` directly for known-safe operations (the Arbiter already did this as a workaround for the lint-exception patch). The boot sequence would run once at construction and install the rule templates; after that, a caller who knew the exact EDB fact shapes could call `engine.assertFact('approved', [id, source, ts])` instead of routing through `ratifyDefinition`. The tradeoff: authority checking, lint gating, and schema validation all live in `runOperation`, not in `engine.assertFact`. Bypassing the bridge for mutations bypasses all of those. The current architecture makes the safe path the easy path and the unsafe path require intentional effort (as the Arbiter discovered).

**The bridge earns its weight as a constraint surface.** The right answer is not to thin the bridge for mutation calls — it is to add a first-class `skipLintForCategory` authority on the `ratify` verb so lint-exempt categories can be ratified cleanly without patching. The bridge is not the problem; the missing lint-exemption mechanism is.

---

## Section 2 — Performance Characteristics

### 2.1 Where Time Goes Per Operation

The proof system has five distinct performance regions:

**1. Engine boot (createDomainBridge call).** Dominated by rule registration: `closurePolicy.registerStatic`, `frictionPolicy.registerStatic`, and `registerRuleTemplates`. Rule templates are instantiated per-element-category (one template per category that needs grounding, coverage, or derivation rules). The number of rules is proportional to the number of element categories, not the number of elements. This is a constant-time operation in proof size. In the NCON-6 session, boot completes in under 10ms.

**2. Element add (addDefinition, addConcern).** Each add runs: args-shape validation, consent check, ID allocation (counter increment), EDB fact assertion (predicate + args written to FactStore's nested Map + positional index). FactStore uses a Map-of-Maps structure keyed by `predicate/arity`. Assertion is O(1) per fact: hash into the outer Map, then into the inner Map by JSON.stringify(args). The positional index update is also O(arity) per fact. Add is fast and does not depend on proof size.

**3. Element ratify (ratifyDefinition, ratifyConcern).** Ratify runs: consent check, precondition check (queries EDB for evidence existence), lint check (D11 — described below), fact assertions (approved + two_yes). The lint check is the expensive step: it calls `renderElementDeep` (a secondary-query pass against the EDB) then scans all ratified Definition terms against all string fields in the element record. The lint scan is O(D × F) where D is the number of ratified Definitions and F is the total length of all string fields in the element. At 41 Definitions this is negligible. At 200 Definitions it is still fast (a few thousand character comparisons). At 1000 Definitions the lint scan would begin to be noticeable (~100K comparisons per ratify call), but the current proof system has a natural ceiling well below that.

**4. Derive (called automatically on query after any mutation).** The Evaluator uses semi-naive bottom-up fixed-point evaluation stratified by rule dependency. Each derive pass iterates rules in stratum order, computing new derived facts from base EDB + previously derived facts using a delta. The `DerivedPositionalIndex` (a companion to FactStore for derived facts) enables indexed candidate lookup during join, reducing the worst-case join cost from O(N²) to O(N × index_selectivity). Derive is O(R × E) per stratum where R is rules in the stratum and E is the number of EDB + IDB facts matching body atoms. With 41 Definitions, 10 Concerns, and ~100 total facts, derive is fast. The derive result is cached and only re-run when `_isDerived` is false (i.e., after any mutation). Read-only operations (queryProof, getProofState) re-use the cached derivation without re-deriving.

**5. Serialize / deserialize.** `serializeWithAllocatorState` calls `engine.snapshot.snapshot()` which calls `captureSnapshot(engine)` from Snapshot.js. Snapshot uses `structuredClone` on the FactStore's internal `_facts` Map structure, which produces a deep JSON-serializable object. On disk, the D5 snapshot at proof-open with 41 Definitions was 224,378 bytes; after Concerns ingest it grew to 299,556 bytes (+75KB). Serialization time is proportional to fact count and total string length of fact arguments. With definition body text as fact arguments, each Definition adds roughly ~1–3KB of serialized JSON. Serialization is O(F × L) where F is fact count and L is average fact serialized size. At 41 Definitions + 10 Concerns the serialize call is fast (under 50ms). The bottleneck shifts to deserialize at restore time when `loadFromWithAllocatorState` must rebuild the FactStore's positional indexes from the serialized fact list — this is O(F × arity) and involves a full Map reconstruction.

### 2.2 Where the Bottleneck Is

For the current NCON-6 proof state (41 Definitions, 10 Concerns), the proof system has no meaningful bottleneck. All operations complete in under 100ms and total script runtime is under 2 seconds.

**The operation that scales worst with proof size is closure-gate evaluation via `presentClosingArgument`.** The closure gate calls `closureTriggerGate` which runs a derive pass to check `closure_permitted(0)`. The derive pass evaluates all closure-related rules, including `unaddressed_concern(C)` for all Concerns (requires scanning all covered/0 derivations), `ungrounded_proposition(P)` for all Propositions (requires scanning all grounding chains), and `coverage_gap_detected(C)` for Coverage Gap detection (a join across concerns and propositions). With 10 Concerns and 0 Propositions, this is trivial. With 10 Concerns and 50 Propositions, each with 3–5 Evidence groundings, the grounding-chain traversal becomes O(P × G) where G is average grounding depth. This is still fast at NCON-scale, but a proof with 200 Propositions and deeply nested grounding chains would see closure-gate evaluation slow down measurably.

**The operation that scales worst with string content is lint checking.** The lint scan (`_vocabularyLintCheck`) runs on every ratify call (for lint-active elements). It calls `renderElementDeep` (a multi-query pass) then performs O(D × F) string comparisons. At 41 Definitions, F for a Proposition reasoning chain might be 500–1000 characters, giving ~20K comparisons per ratify. At 100 Definitions and a 2000-character reasoning chain, ~200K comparisons. This is still sub-millisecond at V8 string speeds, but it is the performance scaling curve most likely to become noticeable in long proofs with dense vocabulary.

**`detectFrictions` is constant-time in the current proof** because it returned zero frictions in every call. Once frictions are present, it runs four detection shapes (UNGROUNDED, COVERAGE_GAP, OVERLAP, CONFLICT) each requiring derive passes. OVERLAP and CONFLICT are O(P²) pairwise scans across Propositions. This is the operation most likely to degrade under a large Proposition set.

**Serialize/deserialize** is the only operation that scales with both fact count and string content. At current scale it is not a bottleneck; at 500+ elements with long text fields (reasoning chains, collapse tests) it would become the dominant cost on session restore.

### 2.3 Scaling Projections

Constant-time operations (independent of proof size): engine boot, element add, allocator increment, single-fact assertions.

Linear-scaling operations (O(N) in proof size): derive passes on simple predicates, lint scan in elements ratified, queryProof with selective patterns.

Quadratic-risk operations (O(N²) in specific dimensions): OVERLAP and CONFLICT friction detection (pairwise over Propositions), grounding-chain coverage checks (if deep chains with many shared Evidence).

NCON-6 will likely produce 20–40 Propositions and 20–40 Resolutions across 10 Concerns, with a total EDB fact count in the range of 200–400 facts after closure. At that scale, the proof system operates comfortably within any reasonable time budget. The first performance concern to watch is friction detection (OVERLAP/CONFLICT) once Propositions begin to accumulate in Rounds 4–5.

---

## Section 3 — Accumulated Recommendations

### NCON-6 Session

**Rec #1-NCON6 — `getProofState` unaddressedConcerns field absent when BLOCKED.**
Current behavior: when `presentClosingArgument` throws `CLOSURE_NOT_PERMITTED`, the error message string carries the unaddressed Concern IDs as a comma-separated list. `err.unaddressedConcerns` is empty `[]`. The Arbiter must parse the error message string to extract IDs.
Proposed change: `getProofState` should always return a structured `unaddressedConcerns: string[]` field with the Concern IDs, and the CLOSURE_NOT_PERMITTED error should carry the same list as `err.unaddressedConcerns: string[]` rather than only embedding them in the message string.
Priority: nice-to-have (workaround is message-string parsing, which is fragile but functional).

**Rec #2-NCON6 — Lint-exemption category support on ratify.**
Current behavior: no way to declare an element category as lint-exempt; the lint gate fires on all ratify calls regardless of category. The Arbiter works around this with a delegation wrapper that catches VOCABULARY_LINT_VIOLATION and asserts the approval facts directly.
Proposed change: add an optional `lintExemptCategories: Set<string>` configuration on `createDomainBridge`, defaulting to an empty set. When the category of the element being ratified is in this set, skip the lint check in `runOperation`. Designer-ratified lint-exempt categories: Definition, Concern, Risk. Lint-active categories: Proposition, Resolution, Permission, Rule, Friction.
Priority: load-bearing for session smoothness. The current workaround requires the Arbiter to know the EDB predicate names for each exempt category (`definition_decl`, `concern`, `risk_decl`) — a fragile coupling that will break if predicate names change.

**Rec #3-NCON6 — `countElements(category)` convenience method.**
Current behavior: the Arbiter must know the exact predicate name and arity for each category to count elements in the EDB. `definition` arity-3 returns approved Definitions; `definition_decl` arity-3 returns all added Definitions. The distinction is non-obvious and caused a verification error during the NCON-6 session (state-load reported 28 instead of 41 until the predicate was corrected).
Proposed change: `bridge.countElements(category)` that returns `{ declared: number, approved: number }` for any element category, hiding the predicate/arity details.
Priority: nice-to-have; reduces operator cognitive load at verification checkpoints.

**Rec #4-NCON6 — Allocator stride from presentClosingArgument.**
Current behavior: `presentClosingArgument` causes the allocator counter for evidence to advance by 1 (from 2 to 3) even though no new Evidence element is added. This is a stride artifact from the operation's internal mechanics. The result is that `allocatorState.evidence` reads 3 after proof open + Concerns ingest while the actual EDB contains only 1 Evidence element (evid_001). The next auto-allocated Evidence will be evid_003, leaving a gap at evid_002.
Proposed change: investigate whether `presentClosingArgument` calls `idAllocator.next` internally for any reason and, if so, suppress that call since it is not adding a new element.
Priority: minor; no collision risk if the Arbiter is aware of the drift. But it is a subtle invariant violation — the allocator counter is supposed to equal the number of auto-allocated elements of that category.

### Inherited from NCON-5 (still open)

**Rec #13 (NCON-5) — `extractAllocatorHighWaterMarks` silent category misses.** Partial: D5 format mitigates the primary restore path; the legacy recovery path still silently returns 0 for categories whose scan pattern does not match. Caller-supplied-ID bypass issue still open.

**Rec #14 (NCON-5) — Vocabulary lint gate word-boundary guard.** Workaround active via delegation wrapper in all NCON-6 scripts. Fix is a two-line addition to `_vocabularyLintCheck` in mutations.js — blocked only by the engine-source-is-shared constraint. Ready to ship in the next engine sprint.

**Rec #15 (NCON-5) — `confirmClosureGo` Evidence argShape gap.** Workaround: pass dummy Evidence-shape fields. Low cost; ready to fix.

---

## Section 4 — Open Questions Not in This Document's Scope

The following topics were considered but are outside the Arbiter's charter for this document:

- Whether the proof system's Datalog rule architecture is the right model for a 10-Concern proof vs. a larger multi-session proof — this is a design-level question, not an operational one.
- Whether the bridge should expose a batch-add operation for proof open (ingesting N Definitions in one transaction rather than N transactions) — this would be a meaningful performance optimization and a lint-exemption simplification, but requires engine spec changes.

---

<!-- created-at: 2026-05-20 -->
<!-- produced-by: Arbiter (NCON-6 design committee session) -->
