# Reasoning Audit: Close OQ-1 — Evaluator IDB Positional Indexing

**Date:** 2026-05-13
**Session:** `00`
**Plan:** `sprint-01-proof-backend-pass-3-plan-01.md`

## Executive Summary

The session set out to close OQ-1 — the rule-firing engine's full linear scan over derived facts was producing nonlinear cost on recursive transitive-closure workloads, leaving AC-11.2 (the thousand-element stress test) skipped because it hung. The single most consequential decision was an in-flight algorithmic extension during execute-write: when AC-11.2 timed out at ~76s against a 5s budget after the planned indexing landed, the implementer extended Task 3 with a delta-driven join reorder inside `fireRule`, dropping the asymptote from O(N³) to O(N²) and bringing AC-11.2 in at ~2.6s. Implementation deviated from the plan in exactly that one place — every other task ran as written, with directed mitigations from plan hardening (AC-1.1 workload reshape; `matchBodyAtom` signature reduction from 9 to 7 params) applied before execute-write started.

## Plan Development

The plan was developed in three review-loop iterations under plan-build, then passed through Plan Hardening (combined plan-attack + plan-smell review, Moderate risk verdict). Plan-attack surfaced one MEDIUM coverage gap (AC-1.1's count assertion could not distinguish delta-driver from full-bucket fallback because the chosen workload had equal delta and bucket sizes at iteration 2) and several VERIFIED CORRECT structural checks; plan-smell flagged a 9-parameter `matchBodyAtom` signature as a parameter-list smell. Both directed mitigations were accepted into plan-01: AC-1.1 was reshaped into a 3-iteration recursive chain so iteration-2 delta would be strictly smaller than the full q-bucket, and `matchBodyAtom`'s signature was reduced to 7 parameters via closure capture of the observer/ruleId/atomIndex tuple. The plan was then approved and entered execute-write in subagent mode with 6 tasks.

## Decision Log

### In-flight delta-driven join extension after AC-11.2 timeout

**Context:** Task 3 finished, the planned indexing was in place, and execute-write ran AC-11.2 to verify the performance gate. The test timed out at ~76s against the 5s budget — the planned per-position indexing alone was not sufficient to meet AC-11.2. This was the first concrete evidence that the framing-00 doc's and spec's asymptotic model had a gap.

**Information used:**
- The plan-attack threat report's load-bearing observation: "the real performance guard is AC-11.2's 5-second timing budget, not the unit count" — i.e. the spec's correctness contract was satisfied but the performance contract was not.
- Direct measurement of `fireRule`'s body-atom iteration order: when the delta-restricted atom was not body[0], the engine still iterated the full predicate bucket of body[0] before narrowing by delta.
- The existing `derived.set` / `idbIndex.addFact` pairing already gave per-position lookup access from any body position.

**Alternatives considered:**
- `Stop and re-design` — would have meant returning to design-specify with an architectural-level finding; rejected because the gap was a missing micro-optimization, not a missing structural piece (the indexing module and the helper were both correct and necessary preconditions for the fix).
- `Loosen the AC-11.2 budget back toward 60s` — rejected because design Decision 5 had already weighed and explicitly rejected residue-budget thinking; loosening would have invalidated the indexing rationale.
- `Skip AC-11.2 and ship as-is` — rejected because the entire point of pass-3 was to close OQ-1 with AC-11.2 unskipped.

**Decision:** Extend Task 3 with two perf changes: (a) make `candidatesFor`'s smallest-set-driver also consider `deltaFilter` size and drive off whichever of position-union vs. delta is smaller; (b) reorder `fireRule` body-atom processing — when a delta-restricted atom is not body[0], process that atom first and propagate bindings to remaining atoms via positional lookup. Also lifted the delta `Set→Map` wrap from `matchBodyAtom` into `fireRule` so wrap cost is O(deltaSize) per atom rather than per binding.

**Rationale:** The reorder is correct under ADR-0016's safety check (every negated atom's vars are bound by earlier positive atoms; the only atom moved is the delta-restricted one, which is always positive). The change is local to `fireRule` and `candidatesFor` — no new module, no new contract surface. Brings AC-11.2 from ~76s to ~2.6s.

**Confidence:** High on the immediate correctness (validated by the full 107-test suite); Medium on long-term shape coverage — the heuristic always reorders when `deltaAtomIndex > 0`, regardless of whether that order is faster for the rule's specific shape. Sprint-02 may need to revisit if its workloads differ from chain transitive closure (called out explicitly in ADR-0019's Negative Consequences and in the summary handoff notes).

---

### Hybrid architecture (Architect A vs B vs Hybrid)

**Context:** design-specify's competing-architectures step dispatched two parallel `code-architect` agents on dispatcher-assigned axes (module-extraction vs. helper-placement) plus a prior-art explorer. Architect A favored a single extracted derived-side module owning data structure + lookup discipline together; Architect B favored keeping everything in the Evaluator as an in-engine helper.

**Information used:**
- The brief's Decision 3 ("Parallel implementations, base-facts side untouched") with SOLID-grounded reasoning against a shared helper.
- The base-facts side's existing shape: `FactStore` owns its index structure plus `factsMatching` is a thin per-bucket primitive — discipline (intersection, smallest-set driver) lives in `Evaluator.matchBodyAtom`.
- The named integration risks (delta-driver, negation, repeated variables) all involve lookup discipline, not data-structure primitives.

**Alternatives considered:**
- `Architect A (single extracted module)` — rejected because pushing lookup discipline into the new module would carry split responsibility (data structure + bound-position identification + repeated-variable deferral + smallest-set-driver + delta composition + negation routing). SRP/ISP violation.
- `Architect B (everything in Evaluator)` — rejected because conflating data-structure-maintenance code with the matching loop in `Evaluator.js` would grow the file's already-large surface, and any future per-position primitive change would force evaluator edits.

**Decision:** Hybrid — extract `DerivedPositionalIndex` as a module owning only the data structure and the per-bucket primitive (`addFact`, `bucketFor`); keep the lookup discipline as a module-scope `candidatesFor` helper inside `Evaluator.js`.

**Rationale:** Mirrors the base-facts side's already-stable boundary. The new module's surface is three methods (constructor + 2 instance methods), which matches AC-5.1's "exactly this public surface" contract — minimal blast radius for future consolidation with `FactStore._positionalIndex`.

**Confidence:** High on the boundary shape; Medium on the long-term consolidation question (acknowledged in ADR-0019, Smell-5).

---

### Apply both directed mitigations from plan hardening rather than proceed-as-is

**Context:** Plan-attack returned Moderate risk with one MEDIUM coverage gap and one MODERATE smell. The decision channel was "Proceed (accept findings)" vs. "Proceed with directed mitigations" vs. "Return to design" vs. "Stop".

**Information used:**
- AC-1.1's workload (p(a) + p(b) → q(a), q(b) → s(a), s(b)) had iteration-2 delta size 2 == full q-bucket size 2 — the count==2 assertion could not falsify a regression that silently fell back to the full bucket.
- The 9-parameter signature for `matchBodyAtom` was already a known smell, and `fireRule` (the only caller) already had closure access to observer/ruleId/atomIndex.
- Both mitigations were small edits and would not extend the plan's task list.

**Alternatives considered:**
- `Proceed as-is` — rejected because AC-11.2's timing budget was already going to be load-bearing; relying on it solely without AC-1.1 having discriminative power would have meant the unit-level guard provided no incremental signal.
- `Apply only the AC-1.1 mitigation` — rejected because the parameter-list smell mitigation cost was negligible and shrank a real source of cognitive load.

**Decision:** Apply both directed mitigations in plan-01 before execute-write.

**Rationale:** AC-1.1 reshape gave the unit-level guard real discriminative power; signature reduction made `matchBodyAtom` easier to read at the one site where it lived.

**Confidence:** High — the mitigations were uncontroversial and small.

---

### Indexing-contract home: spec §5.3 not §3.1

**Context:** The framing-00 seed document had originally gestured at amending the fixed-point-evaluation section (§3.1) of the engine spec. Design-small-task surfaced this as Decision 1 for the brief.

**Information used:**
- The engine spec's structural convention: §3.1 talks about meaning (fixed-point semantics), §5.3 talks about mechanics (Derived set / IDB internal structure).
- §5.3 already gestured at the contract via the phrase "same shape as the fact store".

**Alternatives considered:**
- `Amend §3.1 (fixed-point evaluation section)` — rejected because indexing is a mechanism, not a semantics claim. Amending §3.1 would conflate the two layers.

**Decision:** §5.3 is the home for the enforced indexing contract; the new ADR carries the reasoning.

**Rationale:** Preserves the spec's semantics-versus-mechanics separation; the §5.3 amendment is trivially small because it only promotes existing implicit phrasing into an enforced statement.

**Confidence:** High — the structural convention was clear-cut once stated.

---

### Parallel implementations on SOLID grounds; defer consolidation

**Context:** The base-facts side already has a positional index inside `FactStore` with `factsMatching` as its lookup method. The natural alternative to a parallel implementation was to extract a shared by-position-lookup helper that both sides would use.

**Information used:**
- The two sides' meaningfully different requirements: base-facts is durable mutable (supports `retract`), derived-facts is ephemeral grow-only (no `retract` analog).
- The blast-radius cost of touching `FactStore` in pass-3 — it would expand pass-3 into a stable, well-exercised component for non-functional reasons.
- The audit task channel exists as the named consolidation venue.

**Alternatives considered:**
- `Extract a shared by-position-lookup helper as part of pass-3` — rejected on SOLID grounds (a shared helper would carry two responsibilities; would expose a `retract` method the derived side never uses — ISP violation; risk of refused-bequest if subclassed — LSP violation) and on blast-radius grounds.

**Decision:** Ship parallel positional-index implementations; base-facts side stays untouched.

**Rationale:** SOLID lens favors parallel implementations when the two consumers have meaningfully different lifecycles. ADR-0019 records the decision with "Medium confidence on long-term consolidation" — explicit acknowledgement that future consolidation is on the table.

**Confidence:** High on the pass-3 call; Medium on whether consolidation should eventually happen (which is exactly what ADR-0019 records).

---

### 5-second stress-test budget (vs. 60s vs. 2s)

**Context:** AC-11.2 was previously `it.skip` with a notional 60-second timeout; the brief had to choose a new budget.

**Information used:**
- The 100-element termination test was being tightened back to 5 seconds in the same pass.
- The existing 10,000-fact stress test budget was already 5 seconds.
- The predicted runtime under the proposed indexing was sub-one-second.

**Alternatives considered:**
- `Keep 60s` — rejected as residue from the skipped state; would permit a roughly sixty-fold silent regression.
- `Tighten further to 2s` — rejected as risking flake on slow continuous-integration runners.

**Decision:** 5000 ms.

**Rationale:** Mirrors the 100-element budget, sits comfortably above the predicted sub-1s runtime, and matches the existing 10,000-fact stress pattern.

**Confidence:** High — the alternatives were both ruled out by named, concrete failure modes. The decision later proved load-bearing: the tight budget surfaced the O(N³) asymptote that triggered the delta-driven join extension.

---

### Fix only I-2 from full-branch review; defer the rest

**Context:** The full-branch code review at end-of-execute returned 0 Critical, 2 Important, 5 Minor findings.

**Information used:**
- Each Important finding was triaged on (a) whether pass-3 introduced it and (b) blast radius of the fix.
- I-1 (EDB/IDB factKey collision in `candidatesFor`) was confirmed pre-existing — pre-pass-3 `matchBodyAtom` had the same gap, and EDB/IDB disjointness is implicit Datalog convention that the engine has never enforced.
- I-2 (ADR-0019's own `related_adrs` front-matter listed only `[0002]`) was a one-line documentation fix introduced by pass-3.
- All 5 Minor findings (M-1 through M-5) were micro-optimizations or diagnostic improvements with sub-millisecond / cosmetic impact.

**Alternatives considered:**
- `Fix everything before close` — rejected because expanding scope at the end of execute would either delay close or contaminate the sprint's commit boundary.
- `Defer I-2 as well` — rejected because I-2 was pass-3-introduced (ADR-0019 is pass-3's own artifact) and the fix was a one-line front-matter edit.

**Decision:** Fix only I-2 inline; defer I-1 plus all five Minor findings to `plan/sprint-01-proof-backend-pass-3-deferred-00.md`.

**Rationale:** Pass-3 owns what pass-3 introduces; pre-existing gaps go to the audit task. The deferred doc captures D1-D6 with acceptance criteria for future closure.

**Confidence:** High — the triage rule (pass-3-introduced vs. pre-existing; one-line fix vs. micro-optimization) was uncontroversial once stated.

---

### Shared helper vs. parallel implementations vis-à-vis SOLID — implementer's inline fix during Task 3

**Context:** During per-task code-quality review of Task 3, an inline issue surfaced in `candidatesFor` step 7: `derivedMap.get(k)` was being called twice for the same key on the fallback path.

**Information used:**
- The function was already hot — called per body atom per binding per iteration.
- A one-line cache (`const derivedEntry = derivedMap.get(k); derivedEntry?.args ?? …`) eliminated the redundant lookup.

**Alternatives considered:**
- `Defer to deferred items list` — rejected because the fix was a one-line idiom and fit naturally in the same task's review pass.

**Decision:** Land the cache inline as commit `4beee9e refactor(engine): cache derivedMap.get in candidatesFor step 7`.

**Rationale:** Per-task review caught it before merge; fix cost was minimal; the alternative (D3-style deferral) would have left a sub-millisecond cost in a hot path for no reason.

**Confidence:** High — typical hot-path micro-fix that belongs in the review pass that surfaced it.

---

<!-- created-at: 2026-05-13T05:34:00Z -->

<!-- created-at: 2026-05-13T09:36:53Z -->
<!-- produced-by finish-write-records@v0003 -->
