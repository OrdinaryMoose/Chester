# Combined Threat Report — Rebuild Committee Deliberation Protocol

**Plan:** 20260619-01-rebuild-committee-protocol-plan-00.md
**Combined implementation risk:** **Low**
**Hardening passes:** plan-attack (unconditional) + plan-smell (fired).

## Smell Heuristic Pre-Check

Matched triggers (verbatim, reported per the inclusive-bias rule):

- `new contract` — plan line 20 ("verify the protocol documents describe the new contract"). **Genuine** — the plan introduces a `shutdown_request`/`{ack}` message contract across the committee documents. This fired plan-smell.
- `Task.` — plan line 7 ("implement this plan task-by-task."). **False positive** — English prose "task-by-task.", not a concurrency primitive.

plan-smell fired in parallel with plan-attack on the genuine contract-surface trigger.

## Ground-Truth Cascade

The spec-stage ground-truth report (`spec/...-spec-ground-truth-report-00.md`, 1 MEDIUM, addressed) supplied a verified-anchor skip-list. It was passed to plan-attack with the trust-boundary instruction: anchors the plan modifies (teardown wording, agent files, member-protocol additions, version bumps) were re-verified against the plan's claims; anchors the plan only references (Consolidator enumerate-only, Scribe bounded-input, frozen round-format file, TeamCreate/TeamDelete absence, peer-DM/Final-Position caps) were trusted. plan-attack confirmed every modified anchor exists verbatim at its claimed location.

## Findings & Resolutions

All findings were plan-document quality issues (the plan is the artifact this sprint produces); none required structural, ordering, or assertion redesign. All are resolved inline in plan-00.

- **MEDIUM — single-authority erosion (raised independently by BOTH plan-attack #2 and plan-smell #1).** The agent-file `## Shutdown request` sections restated the flush/ack/stop steps inline while member-protocol's new section claims the agent files "cite rather than restate." This is the most common way single-authority commitments drift: a later change to member-protocol's sequence would leave five agent files silently wrong, and the grep tests (which check only for `flush`/`acknowledg` in member-protocol, not in the agents) would not catch it. **Resolved:** Task 4's agent text trimmed to pure citation ("follow `references/member-protocol.md` § Shutdown request"), keeping only the standing-teammate / DM-addressable framing (not a restatement). Matches the repo's existing routing-signal / committee-root citation pattern. Agent assertions (`## Shutdown request` header, `standing teammate`, version) still pass — none grepped the trimmed steps.
- **MEDIUM — orphaned/duplicate record-close sentence (plan-attack #1).** Task 1 replaced only the auto-dispose sentence (SKILL.md:199), leaving the preceding record-only-close sentence (SKILL.md:198) as an orphan duplicating the new paragraph's record-close clause. **Resolved:** Task 1 Step 3d now replaces lines 198–199 together with a single coherent paragraph (closure timing + shutdown_request + fallback + record-completion close), leaving line 200 intact.
- **LOW — Task 5 guards not fail-first (plan-attack #3).** `assert_standing_protocol` is a cross-cutting guard written to pass post-Tasks-1-4, diverging from the per-file fail-first TDD shape. **Resolved:** Task 5 Step 2 now states the divergence explicitly so the implementer does not expect a red.
- **LOW — AC-5.2 git-diff guard inert post-merge (plan-smell #2).** The `main...HEAD` freeze guard becomes vacuously green after merge. **Resolved:** added an in-code comment in `assert_standing_protocol` marking it a sprint-local guard, distinct from the long-lived AC-3.1 check.
- **LOW — version-field asymmetry (plan-smell #3).** member-protocol gains `version: v0001` (presence-only assertion) while team-lead carries a floor-version pin. **No action** — pre-acknowledged in the plan's Task 3 decision note; inert to the catalog generator; flagged as future reference-file housekeeping, not this sprint's work.

## Verified-Clean (both reviewers, explicit)

- All edit anchors exist verbatim at claimed locations (SKILL.md:199/221, team-lead.md:97/141, agent section order, member-protocol has no prior version field).
- All nine new Task 1–4 grep assertions match the proposed inserted text; none match pre-edit text (no false-pass-that-never-fails). Version-range pins stay in range (SKILL v0026, team-lead v0016 in-range; agent `v00(0[2-9]|[1-9][0-9])` excludes v0001, passes v0002).
- Context-economy invariant untouched: no edit routes consolidation onto the team-lead; Consolidator enumerate-only and Scribe bounded-input contracts unchanged.
- shutdown_request/`{ack}` contract is consistent across SKILL.md, team-lead.md, member-protocol.md (ack shape, wait-then-treat-non-response, session-exit fallback).
- No `description` change → no catalog regeneration; `test-generated-agents-current.sh` stays green.
- No forward-reference rot: dangling citations exist only between commits within the sprint, never in a committed-and-merged artifact (smell #4 = none; #5 single-authority architecture = sound).

## Why Low

- Documentation/protocol change only — no executable code, no runtime surface, no DI/persistence/concurrency primitives (the one trigger was a prose contract-surface match).
- Every edit anchor verified to exist verbatim; every assertion verified to match its edit; the context-economy invariant and the frozen file are preserved by construction and guarded by tests.
- All findings were plan-text quality issues, every one resolved inline; none touched task structure, ordering, or the test contract.
- Residual risk is the live-behavior gap (does a real consult actually spawn-once and peer-DM) — explicitly out of suite scope and called out in both the spec and the plan as manual validation.

<!-- created-at: 2026-06-19T16:52:21Z -->
<!-- produced-by plan-build@v0007 -->
