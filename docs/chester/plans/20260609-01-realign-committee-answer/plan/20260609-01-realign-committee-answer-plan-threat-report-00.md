# Plan Threat Report — Realign Design-Committee to Answer-Delivery

**Plan:** docs/chester/working/20260609-01-realign-committee-answer/plan/20260609-01-realign-committee-answer-plan-00.md
**Spec:** docs/chester/working/20260609-01-realign-committee-answer/spec/20260609-01-realign-committee-answer-spec-02.md
**Hardening dispatch:** `plan-attack` (unconditional). `plan-smell` **skipped**.

## Smell Heuristic Pre-Check

**Matched triggers: none (0).** The case-insensitive pre-check over the plan text returned only two false matches on the English word "task." (matching the regex `Task\.`) at plan lines 7 and 25 — neither is the C# `Task.` async primitive. No DI registration, new abstraction, async/concurrency primitive, new persistence pathway, or new contract surface appears in the plan: this is a documentation realignment, and the warrant record explicitly rides the team-lead's *existing* `alignment-map.md` / `verdict.md` artifacts with **no new file** introduced. Per the conditional-invocation rule, `plan-smell` was skipped and `plan-attack` ran alone. Smell skipped — heuristic matched zero triggers; plan-attack was sufficient for hardening this sprint.

## Combined Implementation Risk Level: **Low**

Reasons:

1. **Documentation-only change with no runtime surface.** Three Markdown skill/reference files under `skills/design-committee/`; no application code, no test-framework change, no DI/async/persistence/contract surface. The repo's existing `tests/test-*.sh` exercise hooks/config and are unaffected.
2. **Every Find-block verified against current file text.** The attacker read all three modified files and confirmed each anchor (Edits 1a–1g, 2a–2b, 3a–3c, 4a, 5a–5d, 6a–6c) matches the exact current text of `team-lead.md` (v0009), `SKILL.md` (v0019), and `committee-analysis-round-format.md` (no version field). No line-number dependence; no anchor drift.
3. **The one substantive finding was a fragility, not a defect, and is now neutralized.** H1 flagged that Edit 1c's mid-line Find/Replace *could* drop the trailing two-round-mode parenthetical from step 6. Under execute-write's exact-substring Edit semantics the tail is preserved, so no deletion would actually occur — but the plan now reproduces the **full line** in both blocks, explicitly retaining the two-round content regardless of replacement semantics.
4. **All verification-command defects corrected.** M1 (a `grep -qF` + escaped-asterisk pattern that would have produced a permanent false-MISSING in Task 1) is fixed to literal `**` across Steps 1/2/4; M2 (Task 3 lacked a removal check for the Consolidation-Rules doctrine phrase) now fast-fails in-task; L1 (a useless `"do not"` probe) is removed; L2 (Task 7 verified only exemplar heading presence) now checks the exemplar's first and last body lines. M3 (a claimed `not verdict` false-alarm) was **disproved by direct test** — the reframed "not a verdict" does not contain the adjacent grep substring "not verdict", so the gate correctly returns nothing post-edit.
5. **Change surface and deferrals are diff-verifiable.** Task 7 gates `git diff --name-only` to exactly the three named files, asserts every deferred/rigid file (scribe template, member-protocol, skill-contract, seven agent files, util-design-partner-role) is byte-unchanged, and confirms the locked four-block format + Style Exemplar survive structurally — closing AC-5.1 and AC-2.2.

## Findings and Resolutions

| ID | Severity | Finding | Resolution |
|----|----------|---------|------------|
| H1 | High | Edit 1c mid-line Find/Replace could drop the step-6 two-round-mode parenthetical | Fixed — Edit 1c now spans the full line in both blocks, explicitly preserving the two-round tail |
| M1 | Medium | Task 1 Steps 2/4 used `grep -qF` with `\*\*` (literal backslash-asterisk) → permanent false-MISSING | Fixed — literal `**` under `-qF` in Steps 1/2/4 |
| M2 | Medium | Task 3 Step 4 lacked a removal check for the Consolidation-Rules "Irreducible split … do NOT collapse" phrase | Fixed — added removal check; failed Edit 3a now fast-fails in Task 3 |
| M3 | Medium | Claimed the reframed "not a verdict" would false-alarm the Task 4 `not verdict` gate | **Dismissed** — direct test shows NO MATCH ("not a verdict" ≠ adjacent "not verdict"); added a clarifying note instead |
| L1 | Low | Task 6 Step 4 included a useless `"do not"` probe matching pre-existing text | Fixed — probe removed |
| L2 | Low | Task 7 AC-2.2 check verified only exemplar heading presence, not body | Fixed — added head/tail body-line checks for the Style Exemplar |

No Critical findings. No residual actionable risk: every finding is either fixed in `plan-00.md` or disproved by test.

## Note for the Designer — Versioning Resolved (post-hardening)

At the plan gate the designer directed that `committee-analysis-round-format.md` carry a `version:` field set to **v0001**. The plan (Plan-Wide Conventions + Task 6 Edit 6d) now writes a proper top-level `version: v0001` key — correcting the designer's initial edit, which placed the line *inside* the `description:` block-scalar (where YAML reads it as description text, not a field). AC-5.2's round-format clause is thereby satisfied directly (superseding the earlier N/A-by-convention reading). Scope is exactly this one file: `member-protocol.md` was reverted by the designer and stays unversioned/byte-unchanged; `artifact-template.md` and `skill-contract.md` remain unversioned and out of scope.

<!-- created-at: 2026-06-10T09:13:26Z -->
<!-- produced-by plan-build@v0006 -->
