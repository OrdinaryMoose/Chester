# Verdict — round 03 (plan-01 verification)

**plan-01 is verified executable. Unanimous 4-0 CLOSES.** The committee confirms plan-01 faithfully implements the round-02 settled verdict; no member returned RESIDUAL-GAP and no blocking defect was filed.

## What was verified

The round-02 remedy — amend-in-place (no renumber), boundary-redraw for F2, with seven other findings — is correctly realized in plan-01's ten tasks:

- **F2 boundary-redraw (Task 3, Task 7):** member-scaffold holds only byte-identical text; each `lens-<lens>.md` holds all per-lens text including the full interleaved Stance block, verbatim; the Task 7 manifest drops the `util-design-partner-role` Stance-extraction fragment; members are pure two-file concatenation with no `{{Lens}}` substitution. T1 generator core unchanged.
- **F1 (Task 2):** `tmpl_abs` bound inside the `emit_catalog` code block; the `set -u` crash is gone; template-exists guard added.
- **F3 (Task 5, Task 10):** new assertions use the inline-exit `|| { echo "FAIL:…"; exit 1; }` pattern matching the target test; no undefined `fail`.
- **F4 (Task 4, Task 7):** the second convergence (confidence-ladder wording) is enumerated; the AC-8.1 gate allows exactly the two reviewer-wording convergences and rejects a third.
- **F5 (Task 6, Task 2):** catalog is flat-alphabetical; role subheaders dropped.
- **F6 (Task 1):** `extract_section` strips leading blank lines; the fixture proves it.
- **F7 (Task 3):** Hard-Prohibition items 2–4 are lens-owned, item 5 shared — corrected from plan-00's reversal.
- **Partition-correctness test + ordering-hazard closure (Task 3 Step 4, Task 7 Step 3, Task 8 note):** the partition test asserts the scaffold carries no lens-owned text; the real semantic gate is T7 Step 3's diff against the PRE-refactor committed files, which a wrong baseline cannot fool; T8's staleness guard sits downstream of both.

## Sole non-blocking note

The partition test (`test-source-partition.sh`) has a known coverage limit, sharpened during deliberation: it greps for the four lens names and one Stance sentinel, but several lens-owned bands carry neither — Hard-Prohibition items 2–4 and the Output-Format labels would not, by themselves, trip the test if they leaked into the shared scaffold.

The committee judged this NOT a defect, 4-0, because of the two-gate design:
- The partition test is a fast pre-check that catches the gross boundary errors (a lens name or the canonical Stance opener in the scaffold).
- The real semantic gate is Task 7 Step 3's byte-identity diff against the PRE-refactor committed files. A leak of items 2–4 into the scaffold would hand all four members the donor's identical items 2–4; since each member's items 2–4 are lens-specific, three of the four regenerated files would mismatch their originals and be rejected at that diff. Every wrong-split path is therefore covered by at least one gate.

Disposition — an OPTIONAL hardening: extend the partition test to assert the scaffold also excludes the non-named lens-owned bands (Hard-Prohibition items 2–4, Output-Format labels). At the implementer's discretion; execution is not blocked without it, because the T7 diff already backstops it.

## Recommendation to designer

plan-01 is ready for execution (`execute-write`, subagent mode per the plan header). The adequacy doubt that opened this consult is retired: the plan now folds in its own threat report, the boundary-redraw eliminates the mechanism the threat report worried about, and the ordering hazard is closed by construction. The optional sentinel-broadening can be taken at execution time or left to the T7 gate.

<!-- created-at: 2026-06-08 -->

<!-- created-at: 2026-06-08T09:03:36Z -->
<!-- produced-by design-committee@v0018 -->
