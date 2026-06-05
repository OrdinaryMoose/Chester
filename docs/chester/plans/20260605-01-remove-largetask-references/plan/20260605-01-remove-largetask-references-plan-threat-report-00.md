# Plan Threat Report — design-large-task Reference Removal

**Sprint:** 20260605-01-remove-largetask-references
**Plan:** 20260605-01-remove-largetask-references-plan-00.md
**Hardening:** design-committee round 04 (attack). plan-attack dimensions only.
**Smell pre-check:** matched **zero** of the five trigger categories (DI registrations, new abstractions, async/concurrency, new persistence pathways, new contract surfaces). `plan-smell` did **not** fire — plan-attack was sufficient. This is a documentation/test refactor with no composition, lifetime, or persistence surface.

## Combined Implementation Risk: LOW (after hardening)

Pre-hardening the draft carried one blocker and several silent-failure defects. All were task-prose precision gaps, not structural defects — the by-commit-unit decomposition was certified green-by-construction by the red-suite walk. After folding the round-04 fixes, residual risk is Low.

Five statements behind the level:

1. **No structural or lockstep defect exists.** Conservator walked all 10 commits in isolation; every version-pinning test (9 assertions across 7 files) is paired in the same atomic commit as the scrub/bump that would otherwise break it. The suite stays green after every commit by construction, not by luck.
2. **The one blocker is fixed.** Researcher found plan-build had a 5th `design-large-task` occurrence (L19) the draft missed; `grep -c → 0` would have returned 1 and failed AC-1.3. Task 1 now lists all five.
3. **The silent-failure class is closed.** Three re-point ACs (1.4/1.5/1.6) had presence checks that passed for the wrong reason (a surviving sentence kept the file-wide count positive). The plan now uses targeted, edit-specific greps.
4. **Both unresolved categories are resolved on-spec.** OD-1 (record-formats) is settled per-occurrence (delete vs surgical-remove vs accurate-update), respecting both the false-equivalence rule and the `Session Skill Versions` block hazard. OD-4 (upsize block) is delete-entirely-no-comment, respecting standalone-documentation discipline.
5. **The only soft spot is bounded and cheap.** Task 8's real work may be just a version bump (the skill-index entries may already be correct). The plan says so explicitly and tells the implementer not to invent an edit — a no-op task, not a risk.

## Findings (plan-attack)

### Blocker (fixed)

- **B-1 — plan-build grep-zero miss (Researcher).** L19 "(e.g., design-large-task)" in the TaskCreate-reset example was the 5th occurrence; draft listed four. → Task 1 Files + Step 3 now include L19; re-pointed to "(e.g., design-small-task)" — factually correct, design-small-task is a real prior skill that creates tasks.

### Important (fixed)

- **I-1 — presence-check theater (Purist).** AC-1.4: start-bootstrap has zero design-small-task today → re-point must be an explicit *insert*, not deletion. AC-1.5/1.6: file-wide `grep -c design-small-task ≥ 1` passes even if the intro/obligation re-point is skipped (surviving sentences keep the count positive). → Task 4 Step 3 now mandates the insert; Tasks 4 and 7 Step 4 use targeted intro-line / obligation greps.
- **I-2 — cross-file phrasing inconsistency (Innovator).** Four tasks independently reword the canonical sequence — the round-01 inconsistent-re-pointing risk, alive in the plan. → Added a fixed Canonical-Sequence Wording note (verbatim phrase); capstone greps all four files for residual `design-large-task`.
- **I-3 — Task 8 degeneracy (Innovator) + missing green-set & L56 hazard (Conservator).** Task 8's premise (skill-index mirrors frontmatter) may be false; the gate is already satisfied. The edit could disturb skill-index L56, which `test-partner-role-overlay-section` greps. → Task 8 reframed: conditional sync, precautionary bump, L56 no-touch, and `test-partner-role-overlay-section` added to must-remain-green.

### Minor / prose (fixed)

- **M-1 — OD-1 per-occurrence ruling (Purist + Conservator + Researcher).** Uniform substitution would assert false equivalence on L213/L68; L68 sits inside the `Session Skill Versions` block that `test-finish-write-records-provenance` greps. L193 was missing from Task 7 steps. → Resolved per-occurrence; surgical L68; L193 added.
- **M-2 — OD-4 standalone-doc violation (Purist).** Draft left a gap comment in the body. → Deleted entirely; rationale moved to the commit message.
- **M-3 — name the version-test files / unchanged design-small-task v0003 (Pragmatist + Innovator).** → Task 4 Step 3 names both test files and notes the design-small-task v0003 assertion is intentionally unchanged.
- **M-4 — OD-2 relabel (Innovator).** setup-start bump relabeled "precautionary frontmatter edit," not a behavior bump; kept because cost is near-zero and AC-5.1 lists it.

## Ground-Truth Confirmations (no action needed)

- All 9 version-pin assertions confirmed at their stated lines; `test-plan-build-heuristic` L62-68 block confirmed exact.
- No 10th pinning test exists. `test-trailer-write` / decision-record tests use the skill name as a fixture token (immune to all plan edits) — consistent with the spec's Non-Goals fixture exclusion.
- `test-partner-role-discipline` DLT hits (L55/L65) are comments/echo strings, no assertions — stays green.
- setup-start version bump does not break `test-start-cleanup` (greps skill names, not version digits).
- Baseline: all 26 tests pass at HEAD `5a800e5`.

## Decision Required (designer)

Per the plan-build hardening gate, the four options:

1. **Proceed** — approve the hardened plan; hand off to execute-write (subagent mode).
2. **Proceed with directed mitigations** — name specific changes first.
3. **Return to design** — add requirements.
4. **Stop.**

The committee's read: the plan is ready to execute. Risk is Low; every attack finding is folded in; no structural defect remains.

---

### Change log

- 2026-06-05 — Threat report authored by the design-committee team-lead from round-04 attack digests (conservator red-suite walk, purist category ruling, pragmatist budget/decomposition attack, innovator structural attack, researcher codebase verification). plan-smell skipped (zero trigger match). Combined risk: Low after hardening.

<!-- created-at: 2026-06-05T11:04:44Z -->
<!-- produced-by plan-build@v0005 -->
