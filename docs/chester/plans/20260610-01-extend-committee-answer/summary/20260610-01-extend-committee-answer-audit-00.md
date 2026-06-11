# Reasoning Audit: Extend Committee Members to Warranted Answer-Contribution (Thread A)

**Date:** 2026-06-10
**Session:** `00`
**Plan:** `20260610-01-extend-committee-answer-plan-00.md`

## Executive Summary

The session convened the design committee to decide how its members should shift from advocacy to answer-contribution, then carried the settled design through the full specify→plan→execute pipeline. The most consequential decision was recovering the crashed round01 from disk rather than re-running it — the write-then-send floor had already persisted all four member positions, so the deliberation was intact and only the live agents were lost. The implementation stayed on-plan; the only deviations were test-fidelity corrections made during execution when grep assertions proved brittle against markdown formatting and a cross-section string collision.

## Plan Development

The plan was derived top-down from a committee-settled design: the committee produced a brief (Option 1 — discrete typed warrant field), design-specify formalized it into a spec via a hybrid architecture chosen from two competing architects, and plan-build decomposed the spec into three docs-producing tasks with a grep-based test harness. By plan time the design was fully settled, so plan development was decomposition and test-design rather than open problem-solving.

## Decision Log

### Crash recovery from disk over round re-run

**Context:** The session crashed mid-round01; the live committee agents died. Four advocacy transcripts had landed on disk; the researcher findings had not.

**Information used:**
- The write-then-send sequencing contract (members persist transcripts before signaling).
- Disk check confirming all four `*-transcript.md` files present with complete `## Final Position` sections.

**Alternatives considered:**
- `Re-dispatch the whole round live` — rejected; would discard proven verbatim positions and cost a full deliberation.
- `Abandon and restart the consultation` — rejected; the substance was recoverable.

**Decision:** Recover round01 from the on-disk transcripts, dispatch the Consolidator over them, and record the absent researcher findings as a round gap.

**Rationale:** Disk is the source of truth by design; the crash cost the notification, not the work. The Consolidator reads Final Positions off disk and never needed the live agents.

**Confidence:** High — explicitly reasoned in-session and verified against the files.

### Preserve the placement split rather than collapse on the 3-1 count

**Context:** Round01 aligned 3-1 for a discrete warrant field over folding into the existing reason.

**Information used:**
- The team-lead Authority Guard's count-is-not-a-warrant rule.
- A closer read showing the disagreement was *only* placement — all four wanted a typed, sourced warrant.

**Alternatives considered:**
- `Collapse to the 3-vote majority` — rejected; count is never a warrant, and the minority (schema-surface widening on a frozen-boundary contract) was unrefuted.

**Decision:** Surface a 4-0 converged core plus a preserved placement split, routed to the designer as a pointed both-sides question.

**Rationale:** Collapsing on count would delete the C-RIGID-strictness signal the minority carried; the most-informative answer keeps the split and lets the designer make the risk call.

**Confidence:** High — followed the committee's own doctrine explicitly.

### Hybrid architecture: structured field + uniform instruction

**Context:** design-specify produced two architects — minimal positional field (A) and lens-tailored structured field with per-lens scaffolding (B).

**Information used:**
- The designer's Option-1 rationale was verifiability; A's positional convention forfeits structural checkability.
- Prior-art and ground-truth showed the four agents already delegate the schema to the protocol and were kept uniform by the prior sprint.

**Alternatives considered:**
- `Architect A (minimal positional)` — rejected; sacrifices the structural checkability that motivated Option 1.
- `Architect B (lens-tailored blocks)` — rejected; four divergent instructions add maintenance and misclassification risk, over-engineering a contract whose members already know their lens.

**Decision:** Take B's explicit typed+sourced field plus A's single identical lens-neutral instruction.

**Rationale:** Splits the two tensions to their better ends — structure where it buys verification, uniformity where divergence buys nothing.

**Confidence:** High — presented as the dispatcher recommendation and ratified by the designer.

### Inline execution mode

**Context:** plan-build's Execution Mode Selection, with subagent as the asymmetric-cost safe default.

**Information used:** The four heuristic conditions — 3 tasks (≤3), risk Low (≤Moderate), decision-budget sum 4 (≤4), all tasks docs-producing (multi-file-code condition vacuous).

**Alternatives considered:**
- `Subagent mode` — rejected; its per-task review independence isn't worth the dispatch overhead for a small, well-specified, docs-only change where all four conditions hold.

**Decision:** Recommend inline; designer confirmed.

**Rationale:** All four conditions held, which is exactly the envelope inline is for.

**Confidence:** High — heuristic computed and shown.

### Test-fidelity correction: disambiguate the "four fields" collision

**Context:** Running the Task-1 test before editing showed the "four fields" assertion already green — it matched the routing-signal lead-in, not the Final Position schema.

**Information used:** `grep -n 'exactly these'` showing line 27 (routing signal: "four fields and no others") vs line 88 (Final Position: "three fields:").

**Alternatives considered:**
- `Leave the assertion` — rejected; it would pass regardless of the edit (a false-pass).

**Decision:** Key the assertion on `four fields:` (with colon), unique to the Final Position lead-in.

**Rationale:** TDD step 2 exists to prove the test discriminates; an assertion that's green for the wrong reason verifies nothing.

**Confidence:** High — caught and fixed against direct grep evidence.

### Test-fidelity correction: single-line tokens over multi-word phrases

**Context:** After the member-protocol edit, two assertions failed though the content was correct — `a `type`` split across a soft-wrap, and `content extension` was bolded as `**content** extension`.

**Information used:** The actual rendered markdown (line wrap + bold markers) vs the line-based nature of grep.

**Alternatives considered:**
- `Reflow the doc to satisfy the grep` — rejected; fragile and backwards (test should fit content, not vice versa).

**Decision:** Assert atomic single-line tokens (`` `type` ``, `extension to the Final Position`).

**Rationale:** Line-based grep can't match across wraps; keying on atomic tokens survives reflow and bold.

**Confidence:** High — diagnosed from the failing output directly.

### Park round02 instead of consolidating it

**Context:** The designer reviewed round01 and settled the split before round02 (a revision pass) was consolidated; round02 transcripts had landed despite a halt.

**Information used:** The designer's explicit "let round 2 archive" instruction; round-folder immutability.

**Alternatives considered:**
- `Consolidate round02 and fold it in` — rejected; the designer had already settled the question, and was explicit about parking it.

**Decision:** Write a `PARKED.md` marker; retain transcripts, produce no consolidator/alignment/verdict for the round.

**Rationale:** Honors the designer instruction and keeps the record honest about why the round has no answer chain.

**Confidence:** High — direct designer instruction.

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-specify@v0004 -->
<!-- produced-by plan-build@v0006 -->
<!-- produced-by finish-write-records@v0004 -->
