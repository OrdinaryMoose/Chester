# Handoff — Committee Context Redesign

**Written:** 2026-06-06 (pre-compaction)
**Sprint:** `20260606-01-update-committee-context-management`
**Branch / worktree:** `20260606-01-update-committee-context-management` at `.worktrees/20260606-01-update-committee-context-management`
**Working dir (gitignored, main repo path):** `docs/chester/working/20260606-01-update-committee-context-management/`

## What this work is

Redesign the Chester Ad-hoc committee process to stop the team-lead from accumulating the bulk of per-round context. Driven by the designer (Mike). This is **pass 2**; pass 1 was `20260604-01-update-committee-context-management` (added the consolidator — fixed the wrong leak).

## Current status: SPEC WRITTEN, awaiting designer review

- **Spec:** `spec/20260606-01-update-committee-context-management-spec-00.md` — the deliverable. Complete. Captures the converged design + 12 constraints + the one-round/two-round modes.
- **Committee:** convened, deliberated 3 rounds, fully converged (4-0 on role ownership), then shut down. All member agents terminated. Team `design-committee-tl-context` still exists → **needs `TeamDelete`** (all members already down, so it will succeed).
- **Provenance:** round records not yet stamped with `chester-trailer-write`. Optional cleanup.

## The converged design (one-paragraph)

Team-lead keeps two fixed functions (dispatch, present) and additionally owns **synthesize** (writes `alignment-map.md`, evicts) and **converge** (writes `verdict.md`, evicts) — allowed because those write auditable files. **Consolidate** stays a dedicated agent (its contamination is invisible/unrecoverable). **Author** moves to a new dedicated **scribe** agent (the dominant ~50–80k leak), fed the finished verdict + annotated template, never the session thread, never started before convergence is complete. Members send the team-lead a **typed routing signal only** (no prose); they cross-pollinate via capped peer DM. **Organizing principle: the artifact is the boundary — every step reads a bounded prior file, writes its own, and evicts. Separate files mandatory; separate agents optional.**

## Modes (designer decision, locked)

- **one-round** = default single-pass (no aggregate feedback; peer DM only).
- **two-round** = Delphi escalation (opt-in): alignment map fed back to members, one revision pass, then converge.
Mapped onto Mike's existing committee directives ("one round" / "two round"). Do not coin new names.

## Evidence (verified, round 01)

- Team-lead peaked **346,692 tokens** in the prior committee session (`9ee0b01b...jsonl`); two forced compactions (preTokens 122,623 and 347,339). Source: session JSONL `compactMetadata.preTokens` — authoritative.
- On-disk artifacts ~130k; **~63% (~217k) off-disk ephemeral** (authoring, source reads, streamed digests, consolidator read-back).
- Channel ranking: authoring ~50–80k > inbound member msgs ~25k (3.4× over spec) > consolidator drift ~5k/round. System-prompt baseline ~35–50k is irreducible.
- Circularity check: today's scribe (offload TL *authoring*) is NOT what pass-1 rejected (pass-1 scribe was a member-transcript *write-permission* workaround). Verbatim-confirmed reframe, not circle.

## Records (all under `committee/`)

- `committee/ledger.md` — cross-round ledger (round01 + round02-scrapped + round03 setup).
- `committee/round01/` — diagnosis: `committee-analysis.md`, `consolidator-output.md`, `researcher-findings.md` (has the token-budget section + circularity check), member transcripts.
- `committee/round02/` — **SCRAPPED** (biased framing: pre-decided "strip the team-lead"). Off-team-lead candidate set + `researcher-findings.md` (channel inventory + prior-art). Retained as reference.
- `committee/round03/` — clean redesign: `committee-analysis.md` (converged design + constraints), `consolidator-output.md` (authoritative **12-constraint list** + convergence state), 4 fresh-advocate transcripts, `researcher-findings.md`.

## What happened (so the next agent has the arc)

1. Round 01 diagnosed the bloat; researcher verified the 347k figure from JSONL and overturned the brief's digest-size premise (the measured leak is authoring + consolidator drift, not digest size).
2. Designer rejected patching → asked for a ground-up redesign (TL = 2 functions; everything else negotiable).
3. Round 02 was dispatched with a **biased** framing ("strip the team-lead") → manufactured convergence on an off-TL Synthesizer → designer caught it, stopped work → **scrapped**.
4. Corrected framing: TL's 2 functions are the floor not ceiling; the open question is *who owns each role*, judged vs R1 converge / R2 enable-decisions / R3 min-context / R4 retain-meaning.
5. Round 03 (clean, fresh agents) converged 4-0 on the design above; members resolved the one split (TL-owns-converge) themselves via peer DM.
6. Designer chose: write the spec now (option b), close the committee, and resolved the last open item as the one-round/two-round mode split.

## Remaining steps

1. **`TeamDelete`** on team `design-committee-tl-context` (members already terminated). MANDATORY — stranded team leaks context into future invocations.
2. **Designer reviews** `spec-00.md`. On approval → `plan-build` to map the spec to the skill-file changes in §9 of the spec.
3. (Optional) stamp round records: `chester-trailer-write stamp design-committee@<ver> "<path>"`.
4. At session end: `finish-write-records` → `finish-archive-artifacts` → `finish-close-worktree`.

## House-style reminders (carry forward)

- Designer-facing: plain prose + bullets, no tables/ASCII charts, two-part closing questions, no AskUserQuestion tool, don't coin terms (use Mike's vocabulary). Caveman ultra for internal/agent messages only.
- Spec writeups: declarative current/target state; history in change log only.
