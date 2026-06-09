# Verdict — round 02 (plan adequacy)

Plan-00 is not executable as written (4-0): three HIGH threat findings — the unbound-variable crash (F1), the test-convention mismatch (F3), and the impure member-source partition (F2) — have no fix in any of the ten tasks, and F2 left unfixed lets a semantically-changed agent file get committed as the baseline and then pass the byte-identity verify gate, locking the error in. The plan must be revised before execution.

Remedy (4-0 after open deliberation — the initial 3-1 amend-vs-redecompose split collapsed once the F2 diagnosis was corrected): **amend the existing ten-task structure in place, with no renumber.** The committee re-diagnosed F2: the defect is not a missing generator mechanism but an impure source partition. The fix is to redraw the scaffold/lens boundary, not to add a substitution engine.

Settled F2 fix (boundary-redraw, clean two-column split):
- The four per-lens source files carry, verbatim, ALL lens-varying text — Phase Contract labels, Hard Prohibitions items 2-4, Output-Format template labels, and the full interleaved Stance block (all five generic-principle + lens-elaboration pairs, copied verbatim from the current member files).
- Member generation does NOT extract from `util-design-partner-role`; the prior Task 7 manifest fragment pulling the generic Stance section is dropped.
- The shared scaffold holds only genuinely identical text. The generator does pure section-concatenation. The generator core (T1) is unchanged — no substitution pass, no stitch.
- Single-source is preserved by the consumer-category distinction: `util-design-partner-role` stays canonical for design-partner runtime use (generic-only form); the lens files carry the interleaved form as a display artifact, not as a canonical source of the generic principles.

Converged amendment set (all in-task edits; no renumber):
- Correct Task 3 partition guidance — lens-varying bands (including the full interleaved Stance block) live in lens files; scaffold is thin.
- Fix Task 7 manifest wiring — scaffold + lens fragments only; drop the generic-Stance extraction fragment.
- Fix Task 2 code block — bind `tmpl_abs` before use (F1).
- Fix Task 5 / Task 10 test extensions — match the target test's convention (F3).
- Enumerate F4's second deliberate convergence (confidence-ladder wording) in the no-semantic-change criterion.
- Add Purist's partition-correctness test asserting the scaffold/lens boundary is clean.
- F5: catalog grouping = flat-alphabetical (recorded decision).

Round 2 of this consult writes the updated plan against this settled shape.

<!-- created-at: 2026-06-08T09:03:36Z -->
<!-- produced-by design-committee@v0018 -->
