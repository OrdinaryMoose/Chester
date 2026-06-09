# Corrected Spec Scope: Catalog-Only Generator

**Date:** 2026-06-08

**Sprint:** 20260607-01-update-voice-discipline

**Source:** verdict from `committee/round04/verdict.md`; member positions from `committee/round04/consolidator-output.md`

---

## Summary

The committee was asked: given that members are out (settled by prior decision D) and reviewer disciplines proved mostly per-consumer, should the corrected spec commit the generator to producing catalog-only, or catalog plus a narrowed reviewer-discipline fold? The verdict is catalog-only. The spec must be corrected to drop two acceptance criteria, reduce three to catalog scope, keep three substantially unchanged, and resolve the AC-8.1/plan-F4 contradiction by dropping the plan's unauthorized convergence clause. The generator's agent-mode machinery is to be stripped entirely; reviewer agent files remain hand-authored. Downstream work consists of the actual spec rewrite and plan-01 reconciliation — both execution tasks, not committee scope.

## Verdict

Adopt the catalog-only generator. Correct the spec to: (1) drop AC-2.1 (member generation — dead by decision D); (2) drop AC-3.1 (reviewer single-sourcing — reviewers proved mostly per-consumer, nothing to single-source); (3) reduce AC-1.1, AC-5.1, and AC-8.1 to catalog scope; (4) keep AC-4.1 (catalog), AC-6.1 (CLAUDE.md dedup), and AC-7.1 (voice-rule canonical homes) substantially as written; (5) resolve the AC-8.1/plan-F4 contradiction by dropping the plan's unauthorized confidence-ladder convergence and rescoping AC-8.1's no-semantic-change guarantee to the catalog output only, leaving the reviewer-convergence clause removed (now vacuous). The generator's agent-mode machinery (`emit_agent`, `extract_section`, `--agents-only`, HEADER fragment assembly) is to be stripped; reviewer agent files remain hand-authored.

## Rationale

The committee's question was whether the one cleanly-foldable reviewer convergence (evidence-citation wording) warranted keeping the agent-mode code path. Three members reached catalog-only from independent lenses — stasis, cost, and category — and that convergence across lenses is the primary signal.

From a stasis perspective, code without a committed consumer is orphaned machinery. No reviewer file is generated; the agent-mode path would exist only to exercise the verify test against a generation path no live output depends on. Keeping it either rots untested or imposes ongoing maintenance without value.

From a cost perspective, the speculative future benefit failure mode applies directly: retaining agent-mode capability against a future where reviewers might be generated is exactly the kind of not-yet-real use case the cost lens is designed to rule out. The one near-trivial live consumer (evidence-citation wording) is a one-time hand-fix, not a recurring drift surface.

From a category perspective, the generator serving two reviewer files that share one whole-file fragment represents structural overreach. The tool would carry `extract_section()` dead code, manifest infrastructure, and two-mode flag routing for a use case that hand-authoring serves without any loss of discipline enforcement.

On the AC-8.1/plan-F4 contradiction: the conflict is between the spec's existing AC-8.1 (no-semantic-change guarantee scoped to one convergence) and a plan-F4 clause that added a second convergence (confidence-ladder wording) without spec authorization. The mandatory resolution is to drop the plan clause and rescope AC-8.1 to catalog-output semantic equivalence. Once reviewer files are no longer generated, the reviewer-convergence clause in AC-8.1 is vacuous and its removal is non-breaking.

## Dissent Record

**Alignment:** 3-1

**Dissenting positions:**

- Innovator: catalog plus narrowed reviewer-discipline fold — spec corrected to enumerate both convergences in AC-8.1; AC-2.1 dropped; all other ACs kept or reduced as scoped above — blocking risk: "Catalog-only would leave dead machinery (emit_agent) in the codebase and forfeit the drift-prevention guarantee without recovering meaningful simplicity, since the agent-mode code is already paid for."

## Deferred / Open

- A pre-commit or CI hook enforcing voice-discipline rules remains an optional follow-on; it is listed in the spec's Non-Goals and is not scheduled.
- The actual spec rewrite (correcting the acceptance criteria per the verdict's five-point disposition) is downstream execution work, not committee scope.
- Plan-01 reconciliation — specifically removing the unauthorized plan-F4 "Convergence 2" clause — is likewise downstream execution, not committee scope.

---

<!-- produced-by: scribe / round04 / 2026-06-08 -->

<!-- created-at: 2026-06-09T01:41:56Z -->
<!-- produced-by design-committee@v0018 -->
