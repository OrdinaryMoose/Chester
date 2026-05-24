# Proof-System Engine Change Recommendations

**File:** `docs/chester/working/proof-system-engine-recommendations.md`
**Created:** 2026-05-21 (NCON-6 R-A1 close)
**Maintained by:** team-lead, cross-sprint
**Status:** running document; deferred to future Chester proof-system performance sprint
**Scope:** changes that require Chester engine source modification (cannot be implemented in StoryDesigner sprint work alone)

## Purpose

This document accumulates engine-change candidates discovered during StoryDesigner master-plan sprint work. Each candidate addresses a structural friction with the proof system that cannot be solved at the team-lead or Arbiter layer. The list is sorted by leverage (highest impact first) but the actual sprint that resolves these is scheduled separately from the StoryDesigner master plan.

Engine source lives at `/home/mike/Documents/CodeProjects/Chester/` per session-memory reference.

## Candidates

### EC-001 — Batch ingest transactional API

**Source:** NCON-6 R-A1 ingest observation (2026-05-21).
**Problem:** Each element ingest is a separate `addElement` + `ratifyElement` call cycle through the bridge. Across 20–30 elements, the per-call overhead dominates wall-clock time even when the engine work itself is fast. Closure-gate evaluation runs after every ratify, multiplying the cost.
**Proposed change:** A new bridge endpoint accepting an array of elements (Evidence, Resolutions, Propositions) plus a single designer authorization. Engine applies all adds in a single transaction, runs lint pass over the full batch, persists state once at the end. Closure-gate and friction detection run once at end-of-batch.
**Design questions to resolve in a proof-system sprint:**
- All-or-nothing batch semantics versus partial-success-with-report semantics on lint failure
- Backward-compatibility with the existing per-element API (deprecate vs. coexist)
- How the audit trail represents a batch (one record vs. one record per element)
**Estimated savings:** 1–3 minutes per ingest at NCON-6 scale.
**Risk:** Medium. Transaction semantics need careful design.

### EC-002 — In-memory proof-state caching across Arbiter sessions

**Source:** NCON-6 R-A1 ingest observation (2026-05-21).
**Problem:** Each Arbiter session reads, parses, mutates, serializes, and writes the proof state file. NCON-6 proof state is now over half a megabyte (574 KB after R-A1 ingest). The reload-parse-serialize-write overhead is roughly twenty to forty seconds per ingest and grows with state size.
**Proposed change:** A persistent Arbiter session pattern that keeps the engine state in memory across consecutive ingests within the same sprint round. State flushes to disk on session end or on explicit checkpoint.
**Design questions to resolve in a proof-system sprint:**
- Lock management — only one Arbiter instance may hold the in-memory state at a time
- Checkpoint policy — when does the in-memory state flush to disk
- Recovery semantics if the Arbiter session crashes mid-round
**Estimated savings:** 20–40 seconds per ingest.
**Risk:** Medium-high. State staleness becomes possible if multiple Arbiter instances run against the same state file without coordination.

### EC-003 — Closure-gate algorithm refactor (O(n²) → O(n))

**Source:** NCON-6 Arbiter retrospective observations (`admin/ncon-06-arbiter-observations-00.md`, NCON-6 Rec #2-NCON6).
**Problem:** Closure-gate evaluation runs a Datalog rule across every Concern, Resolution, Evidence, and Proposition in the proof. The current rule structure produces O(n²) behavior over Concerns. At NCON-6 scale (10 Concerns, 15 Resolutions, 60 Evidence, 13 Propositions) the cost is modest. At 50+ Concerns the cost compounds significantly.
**Proposed change:** Refactor the `covered` and `unaddressed_concern` derivation rules to linear cost via memoization, rule ordering, or index structure. Algorithm change only; no semantic change to the closure verdict.
**Design questions to resolve in a proof-system sprint:**
- Whether to refactor the rule itself or introduce an index layer in the bridge
- Whether memoization invalidates correctly on each mutation
- Backward compatibility with audit trail records that reference rule execution
**Estimated savings:** Scaling-dependent. Modest at NCON-6 scale; significant at larger scales (NCON-9 apparatus implementation may push state size higher).
**Risk:** Low. Algorithm change, not semantic change.

### EC-004 — Rule category Datalog template

**Source:** NCON-6 rule_001 ingest observation (2026-04-22; reconfirmed R-A1 ingest 2026-05-21).
**Problem:** The Rule category has no approval-gated Datalog derivation template (`translation.js` carries `rules: []` for RULE). `rule_decl` and `approved` facts are persisted correctly, but the derived `rule/2` predicate returns zero, meaning the engine cannot enforce rule_001 (no new NuGet) against new Resolutions automatically. Current pattern relies on designer or friction-detection pass to catch violations.
**Proposed change:** Add an approval-gated Datalog template for the Rule category so that `rule_decl + approved → rule` derives, and downstream rules can fire against active rule constraints. Specifically, a new derivation pass that checks Resolution body text against active rule constraints (e.g., "no new NuGet" pattern matching against package import statements in reasoning chains).
**Design questions to resolve in a proof-system sprint:**
- Whether rule enforcement happens at element ingest time or at closure-gate time
- How to express constraint patterns (regex, structured DSL, or designer-authored predicates)
- How to surface rule violations: as Friction elements, as VOCABULARY_LINT_VIOLATION analogues, or as a new violation category
**Estimated savings:** Indirect. Eliminates designer-side rule-violation policing across the master plan.
**Risk:** Medium. Constraint-pattern expressiveness is the design fork — too thin and rules become decorative, too rich and the proof-system gains a sub-language.

### EC-005 — Allocator state-counter post-vs-pre-increment ambiguity

**Source:** NCON-6 R-A1 Resolutions ingest observation (2026-05-21).
**Problem:** The Arbiter reported a one-slot gap in the evidence allocator high-water mark (60 vs. 59 expected) attributable to ambiguity in whether `next()` pre-increments or post-increments the counter. Cosmetic issue — IDs issued are correct and contiguous — but the discrepancy surfaces in every cross-sprint allocator-state log analysis.
**Proposed change:** Document the canonical increment semantics in the allocator API contract. Either pre-increment-and-return-new or post-increment-and-return-current — pick one, document it, and verify the implementation matches the docs.
**Design questions to resolve in a proof-system sprint:**
- Whether the existing high-water field semantics should be normalized in serialized state for backward compatibility
**Estimated savings:** Zero wall-clock. Reduces cognitive overhead during multi-round state inspection.
**Risk:** Low.

### EC-006 — Friction allocator stride

**Source:** NCON-5 Arbiter retrospective (carried into NCON-6 session-state).
**Problem:** Friction allocator has known stride behavior that produces non-sequential IDs in some edge cases. Not load-bearing but causes confusion in retrospective inspection.
**Proposed change:** Normalize Friction allocator to standard sequential-with-zero-padding pattern matching other categories.
**Estimated savings:** Zero wall-clock.
**Risk:** Low.

### EC-007 — Allocator high-water seeding fidelity

**Source:** NCON-5 Arbiter retrospective Rec #13 (carried into NCON-6 session-state).
**Problem:** Allocator high-water seeding on script load is not always faithful to the persisted state, producing edge cases where new ingests skip or repeat IDs.
**Proposed change:** Replace heuristic seeding with deterministic state-file inspection plus explicit per-shape high-water restoration.
**Estimated savings:** Indirect; prevents corruption.
**Risk:** Low.

## Triage notes for the future proof-system sprint

When a Chester proof-system performance sprint is scheduled, the recommended sequencing is:

1. **First wave (independent of each other, parallelizable):** EC-005, EC-006, EC-007 — small fixes, each closed in isolation, each removes a cognitive overhead.
2. **Second wave (sequential):** EC-003 (closure-gate algorithm) before EC-001 (batch ingest) — the batch API should land on an O(n) closure-gate to maximize benefit at end-of-batch.
3. **Third wave (depends on second wave):** EC-002 (state caching) — only valuable after EC-001 reduces per-ingest engine I/O; otherwise the cache benefit is masked.
4. **Fourth wave (independent track):** EC-004 (Rule Datalog template) — design-first track; can run parallel to the performance work.

Total expected ingest-time savings if all candidates land: 2–5 minutes per ingest, plus consistent enforcement of cross-sprint Rules.

## Append protocol

Add new candidates as they are discovered during sprint work. Format:

- ID (EC-NNN sequential)
- Source (where the friction was observed; sprint + date)
- Problem (what the friction is)
- Proposed change (engine-level fix)
- Design questions (open questions for the proof-system sprint)
- Estimated savings (wall-clock or indirect)
- Risk (low / medium / high)

Never delete candidates. When a candidate is implemented in a future proof-system sprint, annotate the entry with the implementing sprint reference and the date — do not remove.
