# Combined Threat Report — Member Warranted Answer-Contribution (Thread A)

**Sprint:** 20260610-01-extend-committee-answer
**Plan:** 20260610-01-extend-committee-answer-plan-00.md
**Date:** 2026-06-10

## Hardening passes run

- **plan-attack** — ran (unconditional).
- **plan-smell** — **skipped.** The Smell Heuristic Pre-Check matched zero triggers (no DI registrations, new abstractions, async/concurrency primitives, new persistence pathways, or new contract surfaces — the plan is grep-based Markdown edits). Plan-attack was sufficient for hardening this sprint.

## Ground-truth cascade

Spec-stage ground-truth report present and VERIFIED. The verified-anchor skip-list was passed to plan-attack with the trust-boundary instruction; plan-attack re-verified only the anchors the plan modifies (member-protocol § Final Position, the four agents' Output Format insertion point, team-lead.md version + warrant test + self-eval). All re-verified anchors **confirmed accurate** against the current files — the plan's edits will apply as written.

## Combined implementation risk: **LOW**

Reasoning:

1. **All edit anchors confirmed.** plan-attack independently verified every "current text" the plan quotes (member-protocol schema lead-in, `{position, rationale, blocking_risk}` block, closing line; the byte-identical Output Format insertion point across all four agents at the same line; team-lead.md v0010 at line 8, warrant test at 321, self-eval at 342). The edits are mechanically applicable.
2. **No structural, ordering, or execution hazards.** The three tasks are independent file-groups; no task depends on a later task's output; the test script grows monotonically and stays green per task.
3. **The findings were test-fidelity, not implementation risk — and all are fixed.** plan-attack found a HIGH false-pass in the self-eval assertion (the phrase it checked also appears in the warrant-test bullet), an unverified `type`/`source` structure (MEDIUM), a non-protective locked-packet assertion (MEDIUM), and two LOW grep nits. All were corrected inline: the self-eval assertion now greps a phrase unique to the self-eval rewrite; `type`/`source` parts are asserted; a distinctive Style-Exemplar anchor now guards the locked packet; the optional warrants-on-disk tweak is case-insensitive.
4. **Blast radius is bounded and reversible.** Doc-only edits to six files plus one new test script; one version bump; all committee mechanics, the locked packet, the researcher/consolidator/scribe agents, and the voice spec are untouched and asserted intact.
5. **Verification is self-contained.** The grep test script encodes every spec observable boundary and runs in-tree; the existing `tests/test-*.sh` suite gates regression.

## plan-attack findings (all addressed)

- **HIGH** — self-eval assertion false-pass (AC-3.2). FIXED: assert `trace to a member-supplied warrant` (unique to the self-eval rewrite).
- **MEDIUM** — `type`/`source` parts unverified (AC-1.1). FIXED: added `a `type`` / `a `source`` assertions.
- **MEDIUM** — locked-packet heading assertion non-protective (AC-4.1). FIXED: added the distinctive `What a Good Decision Packet Sounds Like` Style-Exemplar anchor.
- **MEDIUM** — self-eval anchor text was a third hyphenation variant; the plan already quotes the exact current text for the find/replace. No change needed beyond awareness.
- **LOW** — optional warrants-on-disk tweak "The warrant record" capitalization. FIXED: case-insensitive match, item kept optional.
- **LOW** — Task 2 uniformity full-line compare is fragile only if the implementer deviates from the specified byte-identical insertion. Accepted; the plan mandates byte-identical text.

## plan-smell findings

None — skipped (zero triggers matched).

<!-- created-at: 2026-06-11T01:41:45Z -->
<!-- produced-by plan-build@v0006 -->
