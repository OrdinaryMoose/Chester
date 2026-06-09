# Plan-00 Adequacy — Verdict and Remedy

**Date:** 2026-06-07

**Sprint:** 20260607-01-update-voice-discipline

**Source:** verdict from `committee/round02/verdict.md`; member positions from `committee/round02/consolidator-output.md`

---

## Summary

The committee was asked whether plan-00 is sufficient for the voice-discipline refactor — where it is under-scoped, structurally weak, or missing tasks. The verdict is that plan-00 cannot be executed as written: three HIGH-severity threat findings (F1, F2, F3) have no fix in any of the ten tasks, and leaving F2 unfixed creates a cascading failure where a semantically-changed agent file is committed as the baseline and then silently passes the byte-identity verification gate, locking the error in. The plan must be revised before execution. The committee converged 4-0 on this finding and 3-1 on remedy: three members call for targeted amendments to the existing ten-task structure; one member calls for structural re-decomposition with the substitution engine built first.

## Verdict

Plan-00 is not executable as written (4-0): the three HIGH threat findings — the missing placeholder-substitution mechanism (F2), the unbound-variable crash (F1), and the test-convention mismatch (F3) — have no fix in any of the ten tasks, and F2 left unfixed lets a semantically-changed agent file get committed as the baseline and then pass the byte-identity verify gate, locking the error in. The plan must be revised before execution.

Recommended remedy (Opinion: principled merge of the 3-1 split): **amend the existing ten-task structure in place — preserving its verified-correct assets (the generator core, the reviewer discipline map, the complete code blocks, the acceptance-criterion traceability) — but adopt Innovator's one structural correction: build and independently test the substitution mechanism before any canonical source is authored and before the regenerated baseline is committed, and anchor the no-semantic-change check to the pre-refactor agent files rather than to whatever the integration task commits.** This captures Innovator's substantive ordering fix without a full renumbering rewrite.

Residual decision for the designer (the reducible remainder of the 3-1 split): whether the substitution mechanism is added as a step inside the existing generator task (lighter touch, majority shape) or promoted to its own up-front proven-engine task with its own semantic-change test (Innovator's cleaner shape). Both close the ordering hazard; they differ in task granularity.

Round 2 of this consult writes the updated plan against whichever shape the designer picks.

## Rationale

The committee's 4-0 finding on executability rests on three independent failure modes, each present in the current plan with no fix task:

**F2 (missing substitution mechanism)** is the most consequential. Plan-00's source-authoring tasks (T3) and manifest wiring (T7) are written as if member shared bands are cleanly separable — they are not. Per-lens text (Phase Contract, Hard Prohibitions items 2-4, Output-Format template labels, Stance Principle elaborations) appears in bands the plan treats as shared. An implementer who follows T3 faithfully authors a scaffold that is wrong. T7's manifest wiring then pulls generic Stance bullets from `util-design-partner-role` to replace lens-adapted ones, producing a semantic change across all four member files. T8's byte-identity verify test passes — not because the files are correct, but because the committed baseline in T7 already embeds the error. The AC-8.1 gate silently validates wrong output and locks the error in. This chain is the ordering hazard Innovator identified; it was uncontested by any peer.

**F1 and F3** are guaranteed execution failures. F1 (`$tmpl_abs` unbound in `emit_catalog`) crashes under `set -u`; the fix is one line, but the code block in T2 Step 3 contains the bug. F3 (`fail()` undefined in `test-partner-role-discipline.sh`) causes the test to fail to run; the fix is two corrected patterns, but T5 does not reflect them. Both findings are named in the threat report in prose; neither has a fix step in any task.

On remedy, the majority (Conservator, Pragmatist, Purist) holds that the ten-task structure is salvageable: the TDD rhythm, the T4 discipline map, the complete code blocks in T1/T2/T8, and the AC-by-task traceability are correct and should not be discarded. Targeted amendments adding fix-steps and corrected code for F1, F2, and F3; enumerating F4; and recording the F5 designer decision are sufficient. Innovator's dissent is that the decomposition shape is wrong at the root — the substitution engine must exist before sources can be correctly authored — and that no set of amendments to task prose corrects the ordering problem without also reordering the work.

The verdict adopts the majority structure but incorporates Innovator's ordering constraint as a non-negotiable requirement on any amended plan: the substitution mechanism must be built and independently tested before any canonical source is authored, and the semantic-change check must be anchored to pre-refactor files, not to whatever the integration task commits. The residual choice between placing the substitution mechanism inside the existing generator task versus promoting it to its own task is left to the designer.

A full structural re-decomposition was not adopted. It would discard the verified-correct T1 core, T4 discipline map, complete code in T1/T2/T8, and AC-by-task traceability for no gain not achievable through amendments. No member advocated a full rewrite. Absorbing the HIGH findings at implementation time was also discarded: both Pragmatist and Purist explicitly ruled it out on the grounds that a subagent cannot debug a `set -u` crash from incorrect code and that a plan requiring the implementer to read the threat report to produce working code is not an executable plan.

## Dissent Record

**Alignment on executability:** 4-0 (plan-00 not executable unchanged)

**Alignment on remedy:** 3-1 (amend in place: Conservator, Pragmatist, Purist; re-decompose: Innovator)

**Dissenting position on remedy:**

- Innovator: Plan-00's decomposition is structurally under-scoped in two load-bearing ways: (1) F2's substitution mechanism is absent from all 10 tasks, and the plan's source-authoring tasks (T3) and manifest wiring (T7) are authored as if F2 does not exist — an implementer who follows the plan faithfully produces semantically wrong member files that pass the AC-8.1 gate; (2) T7 bundles 11-file integration after all sources are authored, converting F2 into a late-discovery failure with maximum rework cost. — blocking risk: HIGH — if the plan executes as written, the AC-8.1 diff gate will pass on semantically changed member files (because T7's committed output is itself wrong) and the verify test in T8 will lock in the error.

## Deferred / Open

- **Designer decision on remedy shape:** whether the substitution mechanism is added as a step inside the existing generator task or promoted to its own up-front proven-engine task with its own semantic-change test. Both satisfy the ordering constraint; they differ in task granularity. This decision gates round 02's updated plan.
- **F5 designer decision:** which catalog grouping option to adopt (flat-alphabetical, role-grouped, or hybrid). Plan-00 implicitly assumes flat-alphabetical (T2 test asserts alphabetical order) but T6 copies the hand-authored role-group structure. The choice must be recorded in the updated plan before T6 or T7 proceeds.

---

<!-- produced-by: scribe / round02 / 2026-06-07 -->

<!-- created-at: 2026-06-08T09:03:36Z -->
<!-- produced-by design-committee@v0018 -->
