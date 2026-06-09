# Verdict — round 04

**Decision:** Adopt the catalog-only generator. Correct the spec to: (1) drop AC-2.1 (member generation — dead by decision D); (2) drop AC-3.1 (reviewer single-sourcing — reviewers proved mostly per-consumer, nothing to single-source); (3) reduce AC-1.1, AC-5.1, and AC-8.1 to catalog scope; (4) keep AC-4.1 (catalog), AC-6.1 (CLAUDE.md dedup), and AC-7.1 (voice-rule canonical homes) substantially as written; (5) resolve the AC-8.1/plan-F4 contradiction by dropping the plan's unauthorized confidence-ladder convergence and rescoping AC-8.1's no-semantic-change guarantee to the catalog output only, leaving the reviewer-convergence clause removed (now vacuous). The generator's agent-mode machinery (`emit_agent`, `extract_section`, `--agents-only`, HEADER fragment assembly) is to be stripped; reviewer agent files remain hand-authored.

**Risk-weighted basis:** 3-1 majority, and the three majority members reach catalog-only from three independent lenses (stasis, cost, category) — strong convergence signal. The Innovator dissent rests on "the agent-mode code is already paid for," a sunk-cost argument: keeping it forces the verify test to keep exercising a generation path no committed file consumes, so the machinery either rots untested or imposes ongoing maintenance for a single near-trivial fold. The one genuinely-foldable case (evidence-citation wording) is a one-time hand-fix, not a recurring drift surface worth a code generator. Dropping agent-mode loses no live drift protection because no reviewer text is regenerated.

**Defect resolution is mandatory, not optional:** the spec must not ship with AC-8.1 sanctioning only the evidence-citation convergence while a plan clause adds a second — one of them goes, and it is the plan clause.

<!-- created-at: 2026-06-09T01:41:56Z -->
<!-- produced-by design-committee@v0018 -->
