---
status: Accepted
date: 2026-05-10
deciders: [M]
related_docs: [04-engine-spec]
---

# ADR-0002: Custom Datalog engine over third-party

## Status

Accepted.

## Context

The forward-solve paradigm (ADR-0007) commits to Datalog as the inference foundation. The Engine layer needs a Datalog evaluator with stratified negation, snapshot/restore, and a small public API. Several options exist, varying along three axes: licensing, maturity, and footprint.

The licensing axis is constraining. The proof MCP's licensing intent is permissive (MIT or equivalent). License analysis surfaced the following:

- **Strict MIT mature options**: thin. Most production-grade Datalog engines are licensed under copyleft variants.
- **Apache-2.0 (MIT-compatible)**: `@thi.ng/oquery` — small, clean, JavaScript-native; not a full Datalog engine, more a graph query.
- **MPL-2.0 (file-level copyleft)**: CozoDB — production-grade; embedded; Node.js bindings; copyleft applies to modifications of CozoDB files but not to the consuming project.
- **EPL-1.0**: DataScript, Datalevin — Clojure ecosystem; EPL contagion limited.
- **GPL-3.0**: Dusa — would force the entire proof MCP to GPL-3.0. **Avoided.**
- **UPL-1.0**: Soufflé — Datalog-to-C++ compiler; production scale; massive overkill for the proof's expected fact-set size.

Beyond licensing, the engine's required surface is small (Engine Spec §4): assert/retract facts, define rules, derive, query, snapshot/restore, explain. Stratified negation. No aggregations, no built-in arithmetic in heads, no external fact sources. The expected scale is low (low thousands of facts, hundreds of rules, low-millisecond query budget).

Three options were genuine candidates:
1. **Build custom**: 500–800 LOC of pure JavaScript with semi-naive evaluation
2. **Use @thi.ng/oquery**: existing JS library, but requires an adaptation layer
3. **Use CozoDB via Node bindings**: production-grade, but introduces a native binary dependency and MPL-2.0 obligation on engine modifications

## Decision

**Build a custom Datalog evaluator** in pure JavaScript as the Engine layer's implementation. No external runtime dependencies.

The custom evaluator implements semi-naive bottom-up evaluation, stratified negation, snapshot/restore, and the public API in Engine Spec §4. Estimated implementation size: 500–800 LOC.

If future scale demands a more capable engine, the architecture's hexagonal layering admits a swap-in (e.g., to CozoDB) at the Engine layer without Domain changes.

## Consequences

**Positive:**
- **License clarity**: zero contagion; the project remains MIT-licensable.
- **Audit surface**: the entire Engine is local; no transitive dependency tree.
- **Tight fit**: implements exactly what the Domain needs, no more.
- **Customizable**: extension predicates, snapshot semantics, and explain output can be tuned without contributing patches upstream.
- **Implementation precedent**: semi-naive evaluation is well-documented; reference algorithms are public-domain.
- **Performance adequate at scale**: the proof's expected fact-set size makes a JS evaluator's performance more than sufficient.

**Negative:**
- **Implementation cost**: 1–2 weeks of focused work to ship a correct evaluator (Phase 0 of migration).
- **Bug surface**: every implementation has bugs; a custom one ships its own. Mitigated by extensive Datalog test corpus (Engine Spec §9, Test Strategy §2).
- **No off-the-shelf optimizations**: index strategies, magic-set rewriting, etc. must be added by hand if needed; CozoDB and Soufflé have these built in.
- **Reinvention risk**: classic concerns about reimplementing solved problems. Mitigated by the small scope (we are not implementing arbitrary Datalog; we are implementing the strict subset Engine Spec §2 names).

**Neutral:**
- **Replacement remains possible**: if the custom engine becomes a bottleneck or its bugs become a maintenance burden, the architecture admits a swap. The Engine spec defines the surface; any conforming implementation works.

## Alternatives considered

- **CozoDB via Node bindings**: rejected for the initial implementation because the native binary dependency complicates packaging and the MPL-2.0 obligation, while bounded, introduces a license-management overhead the project does not currently want. Remains the reference fallback if custom-engine scale becomes inadequate.
- **@thi.ng/oquery**: rejected because adapting it to full Datalog (rather than its native graph-query mode) is non-trivial and erases most of the time-saving the choice would offer.
- **Soufflé**: rejected because compile-to-C++ is operational complexity unjustified by the proof's data scale.
- **Defer engine entirely; stay procedural**: rejected by ADR-0007 — the forward-solve paradigm shift is the architecture's load-bearing commitment.

## References

- Engine Spec §1, §2, §10
- Migration Plan §2 (Phase 0: Engine standalone)
- ADR-0007 (Forward-solve paradigm)
