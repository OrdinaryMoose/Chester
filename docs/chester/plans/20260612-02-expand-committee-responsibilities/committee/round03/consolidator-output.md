# Consolidator output — round 03

## Alignment

**(a) Should design-specify split into spec-build + spec-harden?**
- Adopt split (1): Innovator
- Oppose split now / conditional (3): Conservator, Pragmatist, Purist

**(b) Should the committee be able to author the spec via spec-template then hand to spec-harden?**
- Yes, if split is adopted and spec-build is invoked post-verdict (1): Innovator
- No / contingent on CF1 reversal (3): Conservator, Pragmatist, Purist

**(c) Does this retire Round 02's Path B?**
- Yes, Path B is dissolved by the split (1): Innovator
- No, Path B still needed regardless / preferred (3): Conservator, Pragmatist, Purist

## Per-member summary

- Conservator: Oppose the split now — seam is not clean (adversarial pass couples across the boundary), CF1 blocks the split's primary benefit, fragmentation cost is real, Path B remains necessary regardless of split outcome.
- Innovator: Adopt the split — decomposing into spec-build + spec-harden makes authorship a shared callable, dissolves CF1's category objection, and obsoletes Path B structurally; call-discipline risk (C2) is real but manageable with a hard-gate preamble in spec-harden.
- Pragmatist: The split is over-engineering unless CF1 is explicitly reversed — Path B achieves the same token-waste elimination at near-zero edit surface (8+ files, 15–20 edit points vs. a conditional entry flag); break-even requires CF1 reversal AND a confirmed near-term caller for spec-harden beyond design-specify itself.
- Purist: "Author a spec" and "harden a spec" are genuinely distinct categories (construction vs. verification); the split is architecturally cleaner than Path B, CF1 dissolves only if spec-build is invoked after the committee's verdict not before TeamDelete, and the spec-template's architecture field must be revised to be author-agnostic.

## Notable quotes

- Conservator: "The split dissolves CF1's category argument but does not overturn it — CF1 stands on evidence and logic independent of the structural arrangement."
- Innovator: "B1/B2 from Round 02 were patches on design-specify's internals to admit a new caller. The split makes new callers first-class."
- Pragmatist: "For the same token-waste outcome, the split costs 15-20x more edit surface and introduces a cross-skill seam that Path B does not."
- Purist: "The split's cleanness depends entirely on the committee remaining a verdict-terminal primitive and spec-build being a downstream, separately invoked skill."

## Position moves from Round 02

- Conservator: No move — maintains opposition; adds adversarial-context coupling as explicit new blocking evidence.
- Innovator: No move — shifted to full split adoption, consistent with Round 01/02 structural-unlock orientation.
- Pragmatist: No move — doubles down on Path B as sufficient; quantifies split cost at 15–20 edit points (new detail, same direction).
- Purist: Partial move — previously supplied CF1's category-collapse warrant; now conditionally dissolves CF1 if spec-build is invoked post-verdict, narrowing the objection rather than sustaining it fully.
