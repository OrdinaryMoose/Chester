# Reasoning Audit: Realign Design-Committee to Answer-Delivery

**Date:** 2026-06-10
**Session:** `00`
**Plan:** `20260609-01-realign-committee-answer-plan-00.md`

## Executive Summary

This session carried a ratified spec (answer-delivery realignment, hybrid "auditability at minimum surface" architecture) through plan-build and subagent-driven execution. The most consequential decision was reversing the plan's round-format versioning treatment mid-flow: an initial "N/A-by-convention" reading (the file carried no version field) was overturned when the designer directed a real `version: v0001`, which also required correcting a malformed YAML placement. Implementation stayed fully on-plan; the only post-plan change was a one-word cross-file naming fix surfaced by the whole-range review. The discipline that paid off most was treating both adversarial findings and review findings as candidates to verify rather than facts to apply — one High was downgraded to a fragility-fix and one Medium was dismissed outright by direct test.

## Plan Development

The plan was authored this session from spec-02. Decomposition was by file-region (not by acceptance criterion), because the realignment is cross-cutting — many ACs touch the same `team-lead.md` sections, so coherent atomic commits had to follow section boundaries. Complete edit prose was authored into every task so per-task decision budgets stayed near zero and execution became mechanical. The plan passed spec-fidelity review, then plan-attack hardening (plan-smell was skipped after a zero-trigger pre-check). Six findings were addressed before execution; the designer then redirected the versioning approach, prompting a small plan revision.

## Decision Log

### Round-format versioning — N/A-by-convention reversed to designer-directed v0001

**Context:** AC-5.2 mandated bumping `committee-analysis-round-format.md`'s version, but the file carried no `version:` frontmatter (unlike its sibling `team-lead.md`). Mid-plan, the designer added a version line and directed it be set to v0001.

**Information used:** Grep of all four design-committee reference docs (only `team-lead.md` versioned); the designer's edit landed `version: v0000` indented inside the `description:` block-scalar (parsed by YAML as description text, not a field); designer instruction "increment to 0001" and "only focus on our current task."

**Alternatives considered:**
- `N/A-by-convention` (original plan reading) — rejected once the designer established the field; it was a workaround for a now-removed constraint.
- `Version all four reference docs for consistency` — rejected: designer scoped it to this one file and reverted an earlier member-protocol edit.
- `Accept the designer's nested placement as-is` — rejected: nested under `description:` it is not a real field; Task 6 Edit 6d writes a top-level key and removes any nested line.

**Decision:** Set a proper top-level `version: v0001` on the round-format file only; correct the placement; revert the stray `main`-checkout edit before merge.

**Rationale:** Honors the designer's explicit direction while keeping the YAML valid and the change surface minimal; satisfies AC-5.2 directly rather than via the weaker N/A reading.

**Confidence:** High — designer instruction and file state both explicit.

---

### Dismissing plan-attack finding M3 by direct test

**Context:** plan-attack claimed the reframed phrase "not a verdict that pre-empts the designer" would false-alarm Task 4's reconciliation grep (term `not verdict`).

**Information used:** A direct shell test piping the new sentence through the exact gate grep returned `NO MATCH` — "not a verdict" does not contain the adjacent substring "not verdict".

**Alternatives considered:**
- `Apply M3's suggested note as written` — rejected: it asserted a grep hit that does not occur; adding it would mislead the implementer.
- `Accept M3 silently and rework the phrase` — rejected: the phrase is correct; the finding's premise was wrong.

**Decision:** Reject M3; replace the (briefly added, incorrect) note with a verified clarification that the term goes silent post-edit by design.

**Rationale:** Adversarial findings are candidates, not verdicts; the grep term exists specifically to confirm removal of the old "options, not verdict" phrase, and the reframe deliberately breaks the adjacency.

**Confidence:** High — settled by reproducible command output.

---

### H1 defensive full-line fix despite false-positive premise

**Context:** plan-attack flagged (High) that Edit 1c's mid-line Find/Replace could silently delete the trailing two-round-mode parenthetical from `team-lead.md` step 6.

**Information used:** execute-write applies edits via exact-substring replacement (Edit-tool semantics), which preserves text after the matched span — so no deletion would actually occur; the attacker assumed whole-line replacement.

**Alternatives considered:**
- `Dismiss as false positive` — rejected: relying on tail-preservation is fragile and non-obvious to a future reader.
- `Leave Find/Replace mid-line` — rejected: same fragility.

**Decision:** Expand Edit 1c to span the full line in both Find and Replace, explicitly retaining the two-round parenthetical.

**Rationale:** Neutralizes the finding under any replacement semantics at zero behavioral cost; makes the preservation self-documenting.

**Confidence:** High — verified the implementer's output preserved "Two-round mode only".

---

### Cross-file naming drift fixed, not deferred (Minor)

**Context:** The whole-range integration review found `SKILL.md` called the locked packet a "decision-communication **surface**", colliding with "surface" as the umbrella term of the output-surface split; `team-lead.md` canonically uses "decision-communication **packet**".

**Information used:** Full-range diff review across the three files; team-lead.md is the authority SKILL.md cross-references.

**Alternatives considered:**
- `Note as Minor and move on` (the skill's default for Minor) — rejected: it is a one-word fix removing a real terminology collision in a doc whose whole purpose is naming precision.

**Decision:** Change the one word to "packet" and commit as a review-driven fix.

**Rationale:** Aligns with the realignment's own naming discipline; cheap, low-risk, improves coherence. Caught only because whole-range review sees cross-file vocabulary the per-task reviews cannot.

**Confidence:** High — single-word edit, verified.

---

### Task decomposition by file-region with quoted-text anchors

**Context:** Tasks 1–4 all edit `team-lead.md` sequentially; each edit shifts line numbers below it.

**Information used:** The five doctrine sites and locked-format region were mapped to exact current text before planning.

**Alternatives considered:**
- `Anchor edits by line number` — rejected: stale after the first same-file edit lands.
- `One large team-lead.md task` — rejected: loses per-section reviewability and clean atomic commits.

**Decision:** Quote exact old-strings as anchors; split team-lead.md into four region-coherent tasks run strictly in order.

**Rationale:** Self-locating edits survive line drift (same reason Edit matches on content); section-coherent commits keep history clean.

**Confidence:** High — explicitly reasoned and stated in the plan conventions.

---

### plan-smell skipped on a zero-trigger pre-check

**Context:** Plan hardening runs plan-attack unconditionally and plan-smell only on a keyword match.

**Information used:** Case-insensitive grep of the plan against all five trigger categories returned only false matches on the English word "task." (matching the regex `Task\.`), not the C# async primitive; the realignment introduces no DI, abstraction, async, persistence, or new contract surface, and warrants ride existing artifacts with no new file.

**Alternatives considered:**
- `Run plan-smell anyway` — rejected: conditional invocation preserves signal and saves a dispatch on non-triggering doc sprints.

**Decision:** Skip plan-smell; run plan-attack alone; record the zero-trigger result in the threat report.

**Rationale:** Matches the documented smell heuristic; the change has no composition/lifetime/persistence surface for smell to inspect.

**Confidence:** High — pre-check output explicit.

---

### C-NAMING term fixed to "output-surface split"

**Context:** The designer's working phrase "two-surface output model" collides with the existing "two-surface" usage in sprint `20260521-02-design-architect-committee`, which C-NAMING forbids.

**Information used:** Ground-truth report attribution; the approved spec already used "output-surface split" throughout.

**Alternatives considered:**
- `Keep "two-surface"` — rejected: violates C-NAMING.
- `Coin a new term` — rejected: against the designer's stated preference not to coin terms; the spec's own phrase is descriptive and ratified.

**Decision:** Adopt the spec's "output-surface split" consistently across all three files; add an explicit disambiguation note in the round-format doc.

**Rationale:** Uses ratified vocabulary, avoids the collision, and is traceable to the approved spec.

**Confidence:** High — term used identically in all touched files (verified in full-range review).

---

### Execution mode = subagent

**Context:** plan-build's Execution Mode Selection heuristic chooses between subagent and inline.

**Information used:** Final plan = 7 tasks; decision-budget sum = 7; threat risk Low; all tasks docs-producing.

**Alternatives considered:**
- `Inline` — rejected: two heuristic conditions fail (task count > 3, budget sum > 4), and the realignment edits a load-bearing role doc whose five doctrine sites must stay mutually consistent, favoring per-task review independence.

**Decision:** Recommend subagent; designer confirmed.

**Rationale:** Per-task spec review independence is the property hardest to recover if chosen wrong; the dispatch overhead is acceptable for a five-site doctrine edit.

**Confidence:** High — heuristic computed and designer-confirmed.

<!-- created-at: 2026-06-10T10:38:05Z -->
<!-- produced-by finish-write-records@v0004 -->
