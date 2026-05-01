# Process Evidence — Decision Record System

**Sprint:** `20260501-01-fix-decision-record`
**Date:** 2026-05-01
**Companion artifacts:** `fix-decision-record-design-00.md` (brief), `fix-decision-record-thinking-00.md` (decision history)

This document narrates HOW the interview operated: understanding-stage saturation over time, where the conversation pulled vertical, stage transition timing, challenge-mode firings, gate satisfaction, and Solve-Stage length relative to Understand-Stage length.

## Bootstrap and Round-Zero Setup

Phase 1 (Bootstrap) and Phase 2 (Parallel Context Exploration) ran cleanly. Three explorers dispatched in parallel against disjoint corpora:

- *Codebase explorer* — traced the shipped decision-record system end-to-end (MCP package, integrations across five skills, bash tests). Surfaced the 11-field schema's contract gap (spec_update / test / code fields don't fit design-stage records) and the partial-migration tells (reasoning audit, threat report, prior-art-explorer doing parts of the same job in prose).
- *Prior-art explorer* — read all post-shipping Chester sprint artifacts. Confirmed zero records across four sprints; surfaced the 04-29 audit's "zero records is the correct outcome" reframe; cataloged the 04-30 sprint's uncaptured decisions.
- *Industry explorer* — surveyed Plumb commit-time gate, Spec Kit reconcile, OpenSpec sync, ADR practice, IBIS/gIBIS/QOC tradition. Reported the inverse-coupling phenomenon (no canonical name; observed across multiple tools), the 35-year advisory-system decay pattern, and the soft-disable lifecycle.

Round-Zero initialization:
- Internal classification: brownfield (existing codebase target).
- `initialize_understanding` called on the problem-focused MCP with the full prompt.
- `seed_glossary` populated with 14 candidate terms drawn from the explorer reports.
- Round-One Turn A: framing + vocabulary stop. Designer ratified all 14 terms en bloc on first read ("vocab approved").
- Round-One Turn B: gap map across the four corpora plus "what the agent can't determine from code alone."

## Understand Stage

The Understand Stage ran shorter than typical for a large task — five turns from Round One through transition. Two characteristics drove the brevity:

1. **The post-mortem had already done much of the framing work.** The problem was already framed in terms of symptoms; the designer's questions during Round One pulled on the analytical surface (shadow-system enumeration, substantive-vs-routine ratio) rather than re-litigating the framing.

2. **Designer drove convergence aggressively.** Each Understand-Stage turn ended with a designer-direct reframe or constraint addition rather than continued exploration. The synthesis check ("triangle overkill + capture in specify") landed in the third Understand turn; the three-rule constraint (no MCP, no replacement, no TDD-loop) landed in the fifth.

### Understanding signals

The understanding MCP's tenet scoring was not exercised in detail this session — most turns went directly into shadow-system analysis or rule construction rather than per-tenet evidence submission. The Understand Stage ended via designer direction ("move to solve") at a moment when the problem space was clearly bounded but tenet saturation had not been formally measured. This is a process deviation worth flagging: the understanding gate was satisfied by designer intent rather than by formal saturation criteria.

The pattern is consistent with sessions where the source post-mortem provides high-quality framing input — formal saturation is redundant when the entry-point document already maps the problem space.

### Conversation pull-vertical signal

The conversation pulled vertical at the third Understand turn ("triangle overkill, capture in specify"). After that point, designer questions shifted from "what does the data say" to "what's the move." The two subsequent turns were narrowing rather than exploring — first the audit-piggyback recognition, then the three-rule constraint that locked the design space.

## Stage Transition

Designer-directed transition. No tenet-saturation gate evaluation; designer signaled "move to solve" once the problem statement and the rough shape were settled. The agent polished the symptom-list problem statement; designer reframed it to the capture-function statement, which became the ratified problem statement.

`capture_thought` with tag `understanding-confirmed` fired at the transition.

## Solve Stage

Solve Stage ran seven rounds (rounds 1-7 in proof-MCP terms; the round counter was internal to the Solve Stage). Lengths and gates:

- **Round 1:** Initialize proof, seed eight evidence and eight rules, anchor four concerns. No challenges fired. Closure not permitted (no NCs yet).
- **Round 2:** Designer added three constraint rules (no MCP, no replacement, no TDD-loop). Captured as RULE-9, RULE-10, RULE-11. Captured thinking with tag `constraint-no-mcp` etc.
- **Round 3:** Designer corrected R10 framing (cooperative coexistence, not no-overlap). Revised RULE-10 in place. Register correction noted (audit lesson #7 firing).
- **Round 4:** Designer locked scope (whole session) and parallel-filter independence. Added RULE-12 and RULE-13. First wave of NCs added: NC-01 (audit-time emission with rejected alternatives), NC-02 (parallel filters), NC-03 (single-file canonical), NC-04 (structured fields). **Simplifier challenge fired** because four NCs added in one batch without consolidation.
- **Round 5:** Refreshed NC-02's stale grounding citation against the revised RULE-10. Submitted with `challenge_used: simplifier`. Defense for the four NCs presented: each operates on a different axis (timing, filter independence, storage shape, content shape). Simplifier prompt cleared.
- **Round 6:** Added NC-05 (revert scope) and NC-06 (emission step). Added RISK-1 (discriminator inheritance) and RISK-2 (tag drift). Two stale-grounding warnings on NC-06 and RISK-1 (both cite NC-02 which was revised).
- **Round 7:** Refreshed NC-06 and RISK-1 grounding. Added four resolve conditions (RCON-1 through RCON-4), one per concern. Designer ratified all four en bloc. Concerns locked. Closure permitted; closure_reasons empty; integrity warnings empty.

### Challenge-mode firings

- **Simplifier (round 4):** Four NCs added in one round triggered the consolidation prompt. Defended in round 5 with axis-by-axis analysis showing each NC carved a distinct commitment. Simplifier prompt cleared without consolidation.
- **Contrarian:** Did not fire. No NC was grounded only in evidence without designer authority.
- **Ontologist:** Did not fire. Condition count grew steadily across rounds rather than stalling.

### Gate satisfaction at closure

| Gate | Status |
|---|---|
| All conditions grounded | ✓ — every NC has at least one EVIDENCE/RULE in its grounding |
| Every condition has collapse test | ✓ — six of six |
| At least one condition with rejected alternatives | ✓ — NC-01 carries two rejected alternatives |
| At least one element revised after designer interaction | ✓ — four revisions: RULE-10, NC-02, NC-06, RISK-1 |
| Minimum 3 rounds in Solve | ✓ — seven rounds |
| No active integrity warnings | ✓ — cleared at round 7 |
| Concerns locked | ✓ — all four locked |
| Resolve conditions ratified | ✓ — all four ratified by "concerns and conditions approved" |

## Length Comparison

Understand Stage: 5 designer-facing turns (excluding setup and closing transition).
Solve Stage: 7 proof-MCP rounds (each round = one designer-facing turn except the ratification batch).

Solve Stage exceeded Understand Stage length, which the design-large-task skill flags as a possible signal of insufficient understanding. Mitigating factors here: the post-mortem provided high-quality entry framing; the Solve Stage length was driven by careful structural work (six NCs, four RCONs, two risks, surgical revert scope precision) rather than by conceptual confusion.

## Drift Catches

- **Symptom-vs-problem framing (stage transition).** Agent initially polished the problem statement as a symptom list; designer reframed to the capture-function statement. Caught at the transition gate.
- **R10 register correction (Solve round 3).** Agent over-restricted records to "no content overlap"; designer corrected to cooperative-coexistence. Caught one round after the rules landed.
- **Premise revision propagation (Solve rounds 5 and 7).** RULE-10 and NC-02 revisions left two later elements with stale grounding; the proof MCP flagged both and they were refreshed in the same round they were detected.

## Process Notes

The session validated three lessons from the per-turn lesson injection:

- **#1 (partial migration check) — score 21.** Operative throughout. The reasoning audit, threat report, deferred-items file, and prior-art explorer were already capturing decisions in prose; the design completed that migration rather than building parallel mechanism. Cited explicitly in Solve Step 02 and Step 05.
- **#2 (rejection = reframe) — score 14.** Fired twice: at the symptom-list rejection (problem statement reframe) and at the R10 over-restriction (rule revision).
- **#7 (register correction = delivery failure not content failure) — score 7.** Fired at R10 register correction. Substance about cross-sprint discoverability stood; framing of "no content overlap" was the failure. Re-issued with corrected framing.

## Artifact Inventory

Three artifacts produced at Closure:
- `fix-decision-record-design-00.md` — proof envelope, nine sections per template
- `fix-decision-record-thinking-00.md` — decision history, alternatives considered, designer corrections, confidence levels, understanding shifts
- `fix-decision-record-process-00.md` — this document; understanding-stage flow, Solve-Stage rounds, challenge firings, gate satisfaction, drift catches

Provenance trailers stamped per `util-artifact-schema` after each write.

<!-- created-at: 2026-05-01T13:37:58Z -->
<!-- produced-by design-large-task@v0009 -->
