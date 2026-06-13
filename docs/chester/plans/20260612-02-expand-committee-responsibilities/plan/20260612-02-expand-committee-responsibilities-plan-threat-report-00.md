# Plan Threat Report — Decompose the Specification System

**Plan:** 20260612-02-expand-committee-responsibilities-plan-00.md
**Date:** 2026-06-12
**Hardening passes:** plan-attack (unconditional) + plan-smell (triggered)
**Smell trigger:** new contract surface (the eight-field "FAC-complete design" input type, two producers / one consumer) + new skill abstractions. Matched the "new abstractions" and "new contract surfaces" trigger categories.

## Combined Implementation Risk: MODERATE

Why Moderate (not Low, not Significant):

- **Large mechanical surface (~20 files, 12 commits) with tight derived-artifact coupling.** Two test families — version-pin tests and the catalog-freshness test — make per-commit green a non-trivial invariant. The hardening pass found **three** deterministic suite-breaks the first draft missed; all are now fixed, but the density of the coupling means the whole-suite gate (Task 12) is load-bearing, not ceremonial.
- **The decomposition itself is low-risk by construction.** "Extraction, not rewrite" (D12) moves the three review behaviors verbatim, so the no-hardening-regression constraint (CC1 / the HIGH-defect track record) holds by copy, not by re-authoring. The architect|write|harden seam was already clean and non-interleaved in `design-specify`.
- **No-duplication is structural, not gated.** `spec-write` contains no architecture stage and the committee path never invokes `spec-architect`, so AC-3.1 ("no re-derivation on the committee path") is an invariant of the file structure, not a conditional that can be mis-set.
- **The one genuinely new contract is convention-enforced.** The eight-field FAC-complete-design type is extracted-from-narrative and guarded only by a mandatory architecture quote-back — a runtime behavior, not a schema. This is an adjudicated trade (D9); the residual failure mode (silent wrong-architecture) is caught only if the user reads the quote-back. Acceptable, but it is the sprint's softest seam.
- **Behavioral ACs are structural-by-proxy.** Chester's test harness is bash structural checks with no skill-execution runtime, so AC-3.1 / 3.2 / 5.1 are verified by file/grep assertions and verbatim-extraction guarantees rather than by running the skills against a planted defect. This is a harness limitation, honestly disclosed, not a plan weakness.

## plan-attack findings (all resolved in plan-00)

- **HIGH — `test-info-packet-style-version-bumps.sh` missed.** It pins `design-small-task` v0004 (line 22) and `start-bootstrap` v0003 (line 21); Tasks 4 and 7 bumped those skills without updating this test. The first draft even carried a false "grep → expect none" check. **Fixed:** Tasks 4 and 7 now update this pin and list the test in Must-remain-green; the false check is corrected.
- **HIGH — catalog-freshness per-commit invariant.** `test-generated-agents-current.sh` regenerates the catalog and diffs it against the committed `skill-index.md`; any commit changing a skill `name`/`description` or the skill set without regenerating red-bars. The first draft regenerated only once (terminal Task 12). **Fixed:** catalog regeneration is now a committed step in Tasks 1, 2, 3, 4 (new skills / changed description) and Task 11 (deletion); body-only tasks 5–9 correctly need no regen (version is not a catalog input).
- **HIGH — Task 11/12 sequencing.** The migration-completeness grep over `skills/` would fire on the stale `skill-index.md` (it still listed design-specify until the old Task 12). **Fixed:** Task 11 now regenerates the catalog immediately after the deletion and before the completeness test + full-suite run, so the cutover commit is fully green; Task 12 is reframed as a verification-only gate.
- **MEDIUM — Task 10 docs-mention gap.** `docs/instructions.md` has 13 `design-specify` hits; the first draft's map missed lines 157 and 613, which would have survived to trip Task 11's completeness grep. **Fixed:** both lines added to the mention map; the 13-hit total is documented.
- **LOW — off-by-one line count** (239 vs 238) and **LOW — skill-index window** — both corrected/subsumed by the Task 11 regen fix.

## plan-smell findings

- **MEDIUM — two-producer contract is convention-guarded** (extraction-from-narrative + quote-back). Adjudicated by D9; the quote-back is the accepted mitigation and the typed-bundle fallback is documented. No plan change; flagged as the softest seam (see risk summary).
- **MEDIUM — agent-continuity coupling.** The adversarial pass's quality depends on same-agent continuity; the standalone path silently runs reduced-context. Adjudicated by D11; degraded mode is bounded and accepted. No plan change.
- **MEDIUM — version-pin-in-test proliferation.** The pattern now covers seven skills; every meaningful skill edit drags a coordinated test edit. Pre-existing pattern, amplified by two new skills. Accepted as Chester's established convention; not introduced here.
- **LOW — three-skill lockstep maintenance** (spec-template ↔ the two review references). Mild; the seam is type-enforced (FAC-complete design → spec → reviewed spec). No plan change.
- **LOW — producer-neutral Architecture field (D10)** broadens the label but tightens required content (FAC basis + rejected alternatives + sacrifices). Net richer, not vaguer. No plan change.
- **LOW — frozen `design-specify@v0005` fixtures** in `test-trailer-harvest.sh`. Intentionally preserved (legacy-provenance dedup test). No plan change.
- **LOW — Finding 7: plan-build line 310 human-authored-spec coverage.** **Addressed:** Task 6 now instructs preserving the "human-authored spec" clause rather than a bare token swap.

## Residual risks carried into execution (all adjudicated)

- Silent architecture mis-extraction on the committee path — mitigated by the mandatory quote-back (D9); the one failure hardening cannot catch.
- Reduced adversarial context on the ad-hoc `spec-harden` path — accepted trade for the standalone capability (D11).
- Caller-migration completeness — backstopped by `test-no-design-specify-live-refs.sh` (Task 11) + the whole-suite gate (Task 12).


<!-- created-at: 2026-06-12T16:53:59Z -->
<!-- produced-by plan-build@v0006 -->
