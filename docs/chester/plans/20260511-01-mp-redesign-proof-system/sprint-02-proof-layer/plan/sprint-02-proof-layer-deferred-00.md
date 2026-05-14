# Sprint-02 Proof Layer — Deferred Items

Items surfaced during execute-write that were intentionally not acted on during the task at hand. Reviewed at finish.

---

## 2026-05-14 — T1 quality review

**Source task:** T1 (Foundation — domain/ scaffold).
**Item:** `inMemorySubstrate.rulesPort.getRule(ruleId)` reads from the bare `rules` map; it does NOT see rules buffered inside an open transaction (`txBuffer.defines`). The real Engine implements read-own-writes (ADR-0013 Part 2): a rule defined inside a transaction is visible to subsequent operations in the same transaction before commit.
**Why deferred:** No T2–T16 test or implementation calls `getRule` mid-transaction (verified via grep — `getRule` only appears as a port-reference passthrough or `vi.fn()` mock in plan-01). Fixing it now would mean adding `_logicalRules` lookup to `getRule`, which is straightforward but cosmetic for sprint-02. Sprint-03 integration with the real Engine will not exhibit this divergence (the real Engine handles it correctly); the fake's pass-through reads will silently succeed on Engine because Engine's `getRule` does the right thing.
**Action at finish:** consider patching the fake to match for fidelity. Five-line fix: `getRule(ruleId) { return _logicalRules().get(ruleId) ?? null; }` plus normalizing `_logicalRules`'s buffered-entry shape to `{head, body, metadata}` (drop the `ruleId` field from buffer-side values).

---

## 2026-05-14 — T10 quality review

**Source task:** T10 (render.js).
**Item:** `renderClosingArgument` calls `Date.now()` directly for the `asOf` field. This is plan-prescribed (plan line 1520) but violates Domain Spec §10.6 ("All renders are pure: same state produces same output") and §12 ("No implicit time"). The cascade is normative; the plan's verbatim scaffolding contradicts it.
**Why deferred:** the proper fix threads `IClock` through `ReadPorts` so render functions receive `clock` from the bridge's port-bundle construction. ReadPorts is built in T14 (`domain-bridge.js`); render.js (T10) cannot fix this in isolation. T14's `makeAdapters` already wires `clock: { now: () => 1700000000 }` and the bridge constructs `readPorts = Object.freeze({query, explain})` — clock would need to be added to that bundle.
**Action at T14 or after:** add `clock` to `ReadPorts` in `createDomainBridge` (and `createReadOnlyAudit`), update `renderClosingArgument` to call `readPorts.clock.now()` instead of `Date.now()`, and add a port-discipline structural test in T15 that greps render.js for `Date.now` (must be absent).

---

## 2026-05-14 — cumulative code review (post-T16)

**Source task:** Sprint-02 cumulative code review.
**Item I-1:** `friction-policy.js` `overlap_rule` body uses bare uppercase tokens (`'T1'`, `'T2'`, `'TERM'`) per the rule-body variable convention. The rule has no `T1 ≠ T2` guard, so it derives reflexive `overlap_detected(D, D)` pairs (every definition overlaps with itself) and emits both orderings of any real overlap. Reviewer flagged as Important (confidence 80). The body matches the plan verbatim — fixing requires either an inequality guard (Engine support unverified at sprint-02 boundary) or demoting the rule to a stub like `conflict_rule`. Defer to sprint-03 once Engine inequality semantics are confirmed.
**Why deferred:** plan-verbatim body; fix path requires Engine-feature confirmation; downstream callers of `queryOverlap` are sprint-03 Interface code that doesn't yet exist. Behavior is detectable (reflexive pairs would appear in any real proof's overlap query), so the defect is auditable when Interface integration begins.

**Item I-2:** `domain-bridge.js` `createDomainBridgeWith` Phase A `registerStatic` catch hard-codes `recordId: '?'` (line 146) instead of trying `policy?.name`. The production `createDomainBridge` factory also resolves to `'?'` because JS module namespace objects don't carry `.name`. `DomainBootError` for Phase A static-rule failures is therefore minimally diagnostic. Reviewer flagged as Important (confidence 80, diagnostic-only).
**Why deferred:** no observable test failure; AC-4.x coverage uses the validators-throw paths, not registerStatic-throw paths; fix is purely diagnostic. Sprint-03 may want richer Phase A error diagnostics — handle then.

---

## Provenance Trailer

<!-- created-at: 2026-05-14T09:51:20Z -->
<!-- produced-by execute-write@v0004 -->
