---
name: spec-harden
description: "Harden a spec through three review passes — fidelity, adversarial, ground-truth — then a user gate. Use after spec-write in the normal pipeline (the adversarial pass inherits authoring context by agent continuity), or invoke standalone on any spec ad-hoc to give it a full three-pass review. Fixes findings inline, writes the ground-truth report, gates on user approval, and transitions to plan-build."
version: v0001
---

# Harden Spec

Validate a spec through three automated review passes and a human gate. Consumes a completed spec (from `spec-write` or passed ad-hoc), the originating design (for fidelity goals-coverage and adversarial context), and codebase access.

This is a **rigid** skill for the review sequence: run fidelity → adversarial → ground-truth in that order. Do not reorder or skip passes.

<HARD-GATE>
Do NOT invoke plan-build or any implementation skill until the spec has passed all three review passes AND the user has approved it. Only then proceed to invoke plan-build.
</HARD-GATE>

## Entry Condition

A completed spec exists. Either:
- **Normal pipeline** — `spec-write` just authored it; the same agent continues into `spec-harden`, so authoring context (architecture sacrifices, prior-art findings, brief intent) is present by continuity and the adversarial pass uses it directly.
- **Ad-hoc standalone (D11)** — any spec is passed in directly (authored elsewhere, or re-hardened later). All three passes still run; the adversarial pass runs from the spec plus the originating design only — authoring context is reduced, accepted as the cost of the standalone capability.

If invoked standalone with no sprint context, invoke `start-bootstrap` first. The fidelity pass needs the originating design (committee verdict or brief) for goals coverage; without it, it degrades to internal-consistency checking only.

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Spec fidelity review (single pass)** — dispatch the spec-document-reviewer subagent once with the spec and the originating design; address findings inline.
2. **Adversarial spec review (inline)** — apply `references/adversarial-spec-review.md`; no subagent; address findings inline.
3. **Ground-truth review (automatic)** — dispatch the ground-truth-reviewer subagent; fix HIGH/MEDIUM findings; write and stamp the report in `spec/`.
4. **User review gate** — present the clean spec and ground-truth report; on changes, apply and ask which review(s) to re-run; on approval, transition.
5. **Transition** — invoke `plan-build`.

## Spec Fidelity Review (single pass)

**Review purpose: Design Alignment** — does the spec faithfully address the design brief's goals, constraints, and decisions?

After writing the spec:

1. Dispatch spec-document-reviewer subagent **once** (see [`references/spec-reviewer.md`](references/spec-reviewer.md) for the prompt template).
   - Provide both the spec path AND the design brief path.
   - If no design brief exists (standalone invocation), dispatch with spec only — the reviewer falls back to internal-consistency checking.
2. The reviewer checks: goals coverage, constraints respected, no untraceable additions, internal consistency.
3. **Address any returned issues inline** — for each finding, ask silently: "Is this issue valid given the spec's stated intent? What is the minimal fix? Does this fix affect any adjacent section of the spec?" Apply the fix, move to the next issue. Bump the version number (`util-artifact-schema` versioning) after the fixes land.

No re-dispatch loop, no iteration cap. The single pass is the gate. If the reviewer returned so many issues that fidelity confidence is shaken, escalate to the user with the reviewer report and ask whether to accept the fixes, revise the spec further, or revisit the architecture choice.

## Adversarial Spec Review (inline)

**Review purpose: Adversarial Hardening** — what gaps, contradictions, and unstated assumptions exist in the spec that could cause the plan stage to plan against false premises?

After spec fidelity passes, run this review inline (no subagent dispatch). Read [`references/adversarial-spec-review.md`](references/adversarial-spec-review.md) for the full procedure: dimensions covered (structural integrity, execution risk, unstated assumptions, contract gaps, concurrency hazards), evidence rule (every finding cites file:line or concrete spec passage — speculative concerns are not findings), severity scale, and fix-and-version-bump discipline.

The single inline pass is the gate. If findings are so numerous that confidence in the spec is shaken, escalate to the user with the review notes; do not loop.

## Ground-Truth Review (Automatic)

After the fidelity review and the adversarial spec review both pass, run the ground-truth review automatically. No opt-in prompt — codebase verification is part of the standard chain.

Skip only when the spec is greenfield with zero references to existing types, APIs, file paths, or runtime behavior. In that case, write a one-line note in place of the report ("greenfield spec — no codebase references to verify") and proceed to the user review gate.

If the user requests changes at the user review gate and the flow loops back through upstream reviews, re-run the ground-truth review only if the user's changes materially alter code references; otherwise skip the re-run.

Procedure:

1. Dispatch ground-truth-reviewer subagent (see [`references/ground-truth-reviewer.md`](references/ground-truth-reviewer.md) for the prompt template)
   - Provide: spec path AND design brief path
   - The subagent reads source files to verify every claim the spec makes about existing code
2. On return, evaluate findings by severity:
   - **HIGH findings:** Fix the spec (increment version per `util-artifact-schema`). Re-run the ground-truth review only — do not re-run the fidelity or adversarial reviews, since the fix targets codebase accuracy. Exception: if the fix changes the spec's architectural approach (not just correcting a reference), re-run the fidelity and adversarial reviews as well.
   - **MEDIUM findings:** Fix the spec. No re-review needed unless the fix is substantial.
   - **LOW findings:** Note in the report. Do not fix the spec — these are context for the implementer.
   - **Iteration cap:** ground-truth re-review is capped at one re-run after fixes. If HIGH findings persist after one re-run, escalate to user.
3. Write the ground-truth report to the `spec/` subdirectory as `{sprint-name}-spec-ground-truth-report-00.md` (see `util-artifact-schema`). Then stamp its provenance trailer per `util-artifact-schema` `## Provenance Trailers` (independent chain per D7 — sidecars do not share trailers with the spec):

   ```bash
   chester-trailer-write stamp spec-harden@<this-skill-version> "<ground-truth-report-path>"
   ```
4. Present the report summary to the user alongside the spec at the user review gate

The ground-truth report is preserved as an artifact. In a future iteration, `plan-build`
could pass the ground-truth report to plan-attack to reduce redundant verification at the
plan stage — but that is out of scope for this change.

## User Review Gate

After all three reviews pass (fidelity, adversarial, ground-truth):

> "Spec at `{path}`. Ground-truth report at `{report-path}` — [N] findings ([breakdown by severity]). [1-sentence risk summary]. Review and let me know if you want changes before we proceed to the implementation plan."

For greenfield specs (ground-truth skipped), drop the report line and state "greenfield spec — no codebase references to verify".

Wait for the user's response. If they request changes, apply them, then ask the user which review(s) to re-run: fidelity, adversarial, ground-truth, any combination, or none. The user dictates the re-run scope — do not assume. Only proceed to plan-build once the user approves the spec.

## MCP Usage

- **Think** only — per-issue evaluation during the fidelity review and during the inline adversarial review
- Sequential and Structured thinking are not used; spec writing is craft, and the single-pass review structure does not warrant structured cross-referencing

## Integration

- **Dispatches:** spec-document-reviewer subagent (fidelity), ground-truth-reviewer subagent (automatic, skipped only for greenfield specs)
- **Reads:** `references/spec-reviewer.md`, `references/adversarial-spec-review.md`, `references/ground-truth-reviewer.md`, `util-artifact-schema` (naming/paths)
- **Invoked by:** `spec-write` (normal pipeline), or user directly (ad-hoc standalone on any spec)
- **Transitions to:** `plan-build`
- **Does NOT:** author or re-author spec content (that is `spec-write`), settle architecture (that is `spec-architect`)
