# Combined Threat Report — sprint-01-proof-backend-pass-3

**Plan reviewed:** `sprint-01-proof-backend-pass-3-plan-01.md`
**Reviews run:** plan-attack (unconditional) + plan-smell (heuristic matched: "new abstractions" — `DerivedPositionalIndex` class + `candidatesFor` helper; "new contract surfaces" — AC-5.1's mandated module public surface).

**Combined risk level: Moderate.**

## Why Moderate

- **One real coverage gap (Attack Finding 2).** The AC-1.1 unit-test workload uses p(a) + p(b) → q(a), q(b) → s(a), s(b). At iteration 2, the delta for q has size 2, and the full q-bucket also has size 2. A regression that silently routed the delta-driver path back through the full-bucket fallback would still pass the count assertion. The real performance guard is AC-11.2's 5-second timing budget, not the unit count.
- **Several structural smells in the "watch during implementation" range.** `matchBodyAtom`'s new signature has nine parameters (Smell-1), `candidatesFor` accepts the full `derivedMap` shape including `provenance` it doesn't use (Smell-2), and `setCandidateCountObserver` is a public test-hook on a production class (Smell-3). None block the build; all are worth recording so future passes know which surfaces are conditionally OK.
- **Multiple line-count inaccuracies in Tasks 4 and 6** (Attack Finding 1) — D5 comment block is 5 lines (plan says 4); 15s comment block is 4 lines (plan says 3); engine-open-questions preamble is 8 lines (plan says 6). Task 4's preflight `grep -n` step explicitly mitigates this — the implementer greps before editing.
- **Several structural correctness checks all verified correct** — multi-stratum index sharing matches spec lifecycle (Attack 3); matchBodyAtom signature change is isolated to one call site (Attack 4); plans-directory writes match prior-pass conventions (Attack 5); factKey consistency across new code and tests (Attack 6); baseArgsByKey fallback logic is correct given utils.js factKey contract (Attack 7).
- **Parallel-implementations smell is acknowledged in ADR-0019** (Smell-5) — Confidence "Medium on long-term consolidation" accurately captures the risk; the audit task is the named channel for the decision.

## Plan-Attack Findings

- **Attack-1 (LOW).** Line-count inaccuracies in Task 4 and Task 6: the D5 comment block in `stress.test.js` is 5 lines (plan says 4); the 15s comment block in `properties.test.js` is 4 lines starting at line 46 (plan says 3 lines starting at line 47); the engine-open-questions preamble is 8 lines (plan says 6). Risk mitigated by Task 4's preflight grep instruction and by Task 6's instruction-level edit ("delete the entire OQ-1 section and everything underneath"). No correctness risk.
- **Attack-2 (MEDIUM).** AC-1.1's count assertion cannot distinguish delta-driver from full-scan in the chosen example. In the workload p(a) + p(b) → q(a), q(b), the iteration-2 delta for q has size 2, and the full q-bucket also has size 2. A regression that silently falls back to the full predicate-bucket scan would still pass the count = 2 assertion. The real delta-driver guard is AC-11.2's timing budget, not AC-1.1's count.
- **Attack-3 (VERIFIED CORRECT).** `idbIndex` lifecycle (per-`derive()`-call, persists across strata) matches spec.
- **Attack-4 (VERIFIED CORRECT).** `matchBodyAtom` signature change is isolated; no partial-state risk across Tasks 2 and 3.
- **Attack-5 (VERIFIED CONSISTENT).** Plans-directory writes for ADR-0019, the engine spec amendment, and ADR-0017 correction match the established pattern set by ADRs 0015-0018 in pass-2.
- **Attack-6 (VERIFIED CORRECT).** `utils.factKey(predicate, args)` is consistently used in `DerivedPositionalIndex`, the candidates-for test, and the integration test. FactStore's module-local `factKey(args)` is correctly NOT used on the derived side.
- **Attack-7 (VERIFIED CORRECT).** `baseArgsByKey || derivedMap.get(k).args` fallback in `candidatesFor` Step 7 is structurally sound.

## Plan-Smell Findings

- **Smell-1 (MODERATE — watch during implementation).** `matchBodyAtom`'s new signature has 9 parameters: `(atom, factStore, idbIndex, derivedMap, currentBindings, deltaFilter, candidateCountObserver, ruleId, atomIndex)`. Parameter-list smell. Mitigation suggestion: group `{ idbIndex, derivedMap, candidateCountObserver }` into a context object, or pass observer/ruleId/atomIndex via closure captures since `matchBodyAtom` is module-private. Not a blocker; the function is non-public and has exactly one call site.
- **Smell-2 (LOW-MODERATE).** `candidatesFor` accepts `derivedMap: Map<factKey, { predicate, args, provenance }>` but only reads `predicate`, `args.length`, and `args`. Provenance is never touched. Leak of engine representation into helper contract. Narrower alternative: pre-build `Map<factKey, args>` for the derived side in `matchBodyAtom`. Bounded risk since the helper is module-private and the test coverage exercises the shape.
- **Smell-3 (LOW-MODERATE).** `setCandidateCountObserver` is a public test-hook on a production class. No guard against production callers. Alternative: constructor parameter with default `null`, making the test-only nature structurally visible. Bounded by the engine's public API surface (Evaluator is not exposed by Engine).
- **Smell-4 (LOW).** `baseArgsByKey.get(k) || derivedMap.get(k).args` fallback is correct but depends on the implicit invariant that `utils.factKey` is deterministic per (predicate, args). Mitigation: a one-line comment citing `utils.js`.
- **Smell-5 (LOW — acknowledged in ADR).** Parallel positional-index implementations in `FactStore.js` and `DerivedPositionalIndex.js`. ADR-0019 records the decision; "Confidence: Medium on long-term consolidation" captures the risk; the audit task is the named consolidation channel.

## Severity rollup

- HIGH: 0
- MEDIUM (real coverage gap): 1 (Attack-2 — AC-1.1 weak discriminative power)
- MODERATE (smell — watch): 1 (Smell-1 — 9-argument signature)
- LOW-MODERATE: 2 (Smell-2 — derivedMap shape leak; Smell-3 — public test hook)
- LOW: 3 (Attack-1 — line counts; Smell-4 — implicit factKey invariant; Smell-5 — acknowledged parallel implementations)
- VERIFIED CORRECT: 5 (Attack 3, 4, 5, 6, 7)

## Suggested directed mitigations (if "proceed with mitigations" is chosen)

- **For Attack-2 (the real coverage gap).** Restructure AC-1.1's workload so the iteration-2 delta is meaningfully smaller than the full bucket. Concrete shape: r1 derives q-facts in iteration 1; an additional rule r3 also derives q-facts that show up in iteration 2's full q-bucket but were NOT in iteration 1's delta. Then r2's iteration-2 candidate count should equal iteration-1 delta size (smaller), and a regression that fell back to the full bucket would produce a larger count and fail the assertion. Requires a small expansion of the test rules.
- **For Smell-1 (parameter-list smell).** Use closure capture for `candidateCountObserver`, `ruleId`, and `atomIndex` since `fireRule` already has access to all three. This drops the signature from 9 parameters to 6 without changing behavior.
- **For Smell-2 (derivedMap shape leak).** Narrow `candidatesFor`'s `derivedMap` parameter type to `Map<factKey, args>` in the type comment; have `matchBodyAtom` pass `derivedMap` filtered/projected accordingly. Optional.
- **For Smell-3 (public test hook).** Move `setCandidateCountObserver` to a constructor option: `new Evaluator(factStore, ruleStore, { candidateCountObserver: fn })`. Optional.

## Decision channels

- **Proceed (accept all findings as-is).** AC-11.2's timing budget is the real performance guard; the count-assertion weakness is documented; smells are tracked. Lowest-friction path; the plan can run as written.
- **Proceed with directed mitigations.** Apply the AC-1.1 workload reshape (and optionally any of Smell-1 / 2 / 3 mitigations). Costs minutes of plan revision; tightens the test contract.
- **Return to design with additional requirements.** Not warranted — no architectural-level concerns surfaced.
- **Stop.** Not warranted — no blocking findings.

<!-- threat report sidecar; trailer stamped independently from the plan -->

<!-- created-at: 2026-05-13T02:12:37Z -->
<!-- produced-by plan-build@v0004 -->
