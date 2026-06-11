# Plan Threat Report — compact-committee-skill (plan-01)

**Sprint:** 20260611-01-compact-committee-skill
**Plan:** `plan/20260611-01-compact-committee-skill-plan-01.md`
**Date:** 2026-06-11

## Hardening gate composition

- **plan-attack:** RAN (unconditional). Full codebase verification — no ground-truth report existed, so an empty skip-list was passed and the attacker re-verified every anchor against the v0021 worktree.
- **plan-smell:** SKIPPED. Smell heuristic pre-check matched zero of the five trigger categories (no DI registrations, no new abstractions, no async/concurrency primitives, no new persistence pathways, no new contract surfaces). This is a pure Markdown dedup pass; plan-attack was sufficient for hardening.

## Combined implementation risk: **LOW**

Why:

- plan-attack independently verified the plan's spine as correct: baseline byte totals exact (81,579), version targets correct (SKILL.md v0021→v0022, team-lead.md v0011→v0012), every grep anchor hits unique current content, and every introduced cite resolves to a real section.
- The one substantive structural defect found (Finding 1 — Task 5 deleting all five Site B2 bullets would strand the framing colon) has been fixed: Task 5 now deletes only lines 296-298 and explicitly preserves 299-300, with a Step 4 grep that asserts the C1/C2 markers survive.
- Task 6's narrowing — the most error-prone edit — was confirmed correct by independent read: line 123 "Count is not a warrant" is a true duplicate of §Authority Guard 323; line 124 "Strict premise scope" is genuinely absent from §Authority Guard and correctly preserved; steps 6/7 are write-instructions and correctly left untouched.
- All remaining findings are low/informational: the §-prose-cite convention is intentional and used across team-lead.md; per-task byte estimates are advisory (Task 9 is the binding measurement); the `139→136` line-number shift after Task 4 is absorbed by grep-anchoring.
- Blast radius is one commit per task, docs-only, no behavioral contract touched, fully reversible.

## Findings ledger

| # | Severity | Status | Summary |
|---|---|---|---|
| 1 | Medium | FIXED | Task 5 Site B2 "delete five bullets" stranded the line-294 colon; Step 4 verify would not catch it. Now: delete 296-298 only, keep 299-300, verify both. |
| 2 | Low | Acknowledged | `§ Authority Guard` cite points at bold prose, not a navigable heading. Intentional convention (precedent: team-lead.md §73/90/94/101-104). No fix. |
| 3 | Low | Acknowledged | Task 7 byte estimate ≈−100 understates actual (~−255). Advisory only; Task 9 binds. No fix. |
| 4 | Low | Mitigated | Task 5 Step 4 aggregated grep gave weak per-site assurance. Fixed grep now asserts C1/C2 preservation separately. |
| 5 | Low | Acknowledged | Task 7 header annotation `139` is stale after Task 4's −3 lines (becomes ~136). Grep-anchoring handles it. No fix. |
| 6 | Info | Acknowledged | Task 2 estimate ≈−78 vs measured ~−82. Rounding. No fix. |

Note (cross-check): plan-attack measured total projected saving ~1,754 bytes (~2.1%) — slightly above the plan's stated 1,400-1,700 range. The plan's honest "unreachable ~25% / actual ~1.7-2%" framing holds; Task 9 reports the measured actual.

## Designer decision

The hardening gate is advisory. Choose: proceed to execution / proceed with directed mitigations / return to design with added requirements / stop.

---

## Change Log

- **2026-06-11 — threat-report-00.** Produced by plan-build hardening gate for plan-01. plan-attack ran with empty skip-list (no prior ground-truth report); plan-smell skipped (zero triggers). One Medium finding fixed in-plan before this report was written; combined risk assessed LOW.

<!-- created-at: 2026-06-11T11:16:14Z -->
<!-- produced-by plan-build@v0006 -->
