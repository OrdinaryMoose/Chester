# Feature Definition Brief: Team-Lead Context Economy in the Ad-hoc Committee

**Status:** Draft (revised -01 — committee-reviewed, decisions adjudicated)
**Date:** 2026-06-04
**Scope:** the Ad-hoc committee (`design-committee`) ONLY. `design-architect-committee` is slated for
deprecation in a future sprint and is explicitly out of scope; none of these disciplines apply to it.
**Origin:** Standalone observation during a StoryDesigner token-usage review — the team-lead (main-thread
orchestrator) context fills up fast across a committee deliberation, limiting how many rounds a committee can
run before the orchestrator degrades. Token-log forensics confirmed the mechanism: `cache_read` is ~93% of
spend in long sessions and per-session cost is quadratic in transcript length, because every turn re-reads the
whole accumulated context. An orchestrator that retains every member return across rounds pays that quadratic.

---

## Problem Statement

The Ad-hoc committee runs one main-thread agent (team-lead) plus subagents (four advocacy members + a
researcher). The team-lead is the only long-lived context in the deliberation: it dispatches rounds, receives
every member's reply, consolidates, runs the designer conversation loop, persists the round record, and presents
the decision packet. Three of those jobs retain payload in the team-lead's own context:

- **Conduit** — every member reply arrives in the team-lead's context via messaging and stays there for the rest
  of the session.
- **Synthesizer** — consolidation holds all four replies simultaneously to produce the alignment pattern and the
  round record.
- **Controller** — dispatch, round sequencing, designer adjudication, closure. This is the only role that
  genuinely requires a long-lived main thread.

The Conduit and Synthesizer roles are what bloat the orchestrator. In a single-round consult the cost is
tolerable, but multi-round deliberations accumulate every prior round's full member returns in the team-lead
context, so cost and degradation grow quadratically with round count. The designer's symptom ("team-lead fills
up fast") is the orchestrator carrying content it has already persisted to disk.

The fix is role separation: a team-lead that holds **pointers and deliberation state**, not member-return
payloads. The act of combining four returns — synthesis — is exactly where an orchestrator balloons, so it
happens off-thread in a subagent, with only the result returning to the team-lead.

---

## Current State

- **Committee artifacts land in `design/`.** The team-lead persists a single `committee-analysis-NN.md` per
  designer question into the sprint's `design/` folder, consolidating inline. There is no separation between
  process-internal committee work product and formal session deliverables.
- **Members cannot write to disk.** All member agents (`conservator`, `innovator`, `pragmatist`, `purist`) and
  the `researcher` declare read-only tool grants (`Read, Glob, Grep`; researcher adds `Bash, WebSearch,
  WebFetch`). Members return their full positions to the team-lead by messaging.
- **The team-lead consolidates inline.** It holds all four member returns at once to produce the alignment
  pattern, then writes the consolidation into the same record file.
- **Three partial economy measures already exist** and are kept, not replaced: inter-agent caveman ultra
  (compresses each reply), persist-record-every-round (writes the record to disk each round — but additively,
  the team-lead keeps the verbatim in context after persisting), and mandatory `TeamDelete` at closure
  (prevents cross-invocation leaks, does nothing for growth within a deliberation).
- **No mid-deliberation compaction primitive exists.** The harness compaction hooks are scoped to proof-system
  MCP state only; they do not snapshot committee deliberation state. `util-handoff` is a between-sessions manual
  reset, not in-process rehydration.
- **The round-record template assumes inline consolidation.** `committee-analysis-round-format.md` models a
  single file with team-lead Convergence/Alignment/Observations sections; it has no place for an off-thread
  consolidator's output.

---

## Proposed Change

One unconditional discipline set, applied to every Ad-hoc committee consultation. There is **no cutover, no
gate, no fast/slow fork** — the same single path runs whether a consult is one round or many. The only cost on a
one-round consult is a single extra consolidator spawn, accepted as the price of zero branching logic.

### 1. Committee artifact layout + member write access

- Member agents are granted **write access**, scoped to the committee artifact tree.
- At committee setup, create a `committee/` folder at the session working-folder root. For each round, create a
  `roundNN/` folder (e.g. `round01/`) inside it. All round artifacts are written there: per-member transcripts,
  researcher findings, and the team-lead committee-analysis report.
- The formal session folders (`design/ spec/ plan/ summary/`) are **reserved** for formal session artifacts. No
  committee work file is ever written there. The round folder — not a per-question file in `design/` — is the
  unit of committee persistence.

### 2. Digest-to-lead (the load-bearing lever)

- Each member writes its **full** position to its own transcript file in the round folder.
- Each member sends the team-lead a **structured digest only**: identity, headline position, chosen option, top
  trade-off, confidence, and the transcript path. No full reasoning crosses into the team-lead's context.
- The verbatim never transits the team-lead; the team-lead carries digests. This is the discipline that actually
  bounds team-lead context — without it the consolidator and the write bit save nothing, because the full text
  would already be in the team-lead transcript ("renamed conduit"). It is therefore a hard requirement, paired
  and co-equal with the consolidator.

### 3. Off-thread Consolidator (its own enumerate-only role)

- A new role, `chester:design-committee-consolidator`, performs round consolidation off-thread. The team-lead
  dispatches it with the round-folder path; it reads the full member transcripts from disk and writes the
  consolidation into the round record.
- **Positive enumeration ceiling.** The Consolidator produces the alignment count, per-member position
  summaries, and verbatim notable quotes — and **does not** characterize why alignment exists, **does not**
  weight positions by risk, and **does not** synthesize a direction. Interpretation (a full draft synthesis) is
  prohibited in the role definition. It is a reducer, not a fifth advocate.
- The Consolidator gets its own role definition rather than borrowing the researcher's prohibitions: the
  researcher contract permits interpretive synthesis ("2–6 sentences synthesizing the sources"), which a
  Consolidator-by-analogy would inherit and use to pre-empt the team-lead's judgment.
- The team-lead loads only the Consolidator's finished, inert output — never the four raw returns at once — and
  applies risk-weighted judgment to that compact input itself.

### 4. Minimal deliberation-state ledger

- The team-lead maintains a small **disk-written ledger** (a few hundred tokens, not a transcript): round number,
  which members have returned, the running alignment pattern, open questions, and designer decisions so far.
  Written to the round folder at each round boundary.
- The ledger plus the on-disk round records make the team-lead **rehydratable across a session boundary** — a
  fresh session can resume mid-deliberation by re-reading them. This is the ledger's primary durable win; within
  a single continuous session it slows context growth but does not flatten it (there is no in-process compaction
  primitive to evict already-received content).

### Net effect

Per-round team-lead context goes from `4 × full member return + accumulated prior rounds` down to
`4 × one-line digest + 1 Consolidator summary + 1 ledger`. Roughly an order of magnitude smaller per round, and
its growth rate is materially reduced; the across-session rehydration property removes the hard ceiling on
deliberation length.

---

## Edits by Surface (Ad-hoc committee only)

- **Member agent files** (`agents/design-committee-{conservator,innovator,pragmatist,purist}.md`, researcher):
  add write access; reference the shared member-protocol for the digest-to-lead output shape.
- **Shared member-protocol reference** (new or extended sibling of `committee-analysis-round-format.md`): defines
  the digest format once, so the four advocacy files and the researcher reference it rather than each carrying
  their own clause (avoids five-file drift).
- **New Consolidator role** (`agents/design-committee-consolidator.md`): the positive enumeration ceiling above.
- **`references/team-lead.md`**: dispatch the Consolidator and apply risk-weighting to its output; write/read the
  ledger at round boundaries; the round-folder layout for the Record File section.
- **`SKILL.md`**: committee/round-folder setup at Phase 1/Phase 3; one unconditional path (no cutover language);
  re-point the forbidden-attach-surfaces and floor-not-ceiling citations to `references/skill-contract.md`; name
  the "submit finals via messaging" discipline; affirm that agent-file edits are permitted as generic
  base-skill role-contract clarifications.
- **`references/committee-analysis-round-format.md`**: full rewrite to the round-folder model — separate member
  transcripts, a distinct enumerate-only Consolidator output section, and a separate team-lead risk-weighted
  Final Recommendation. The single-file-in-`design/`, inline-consolidation framing is removed.

---

## Acceptance Criteria

- Member agents have write access scoped to the committee artifact tree; committee work product is written under
  `committee/roundNN/` and never into `design/ spec/ plan/ summary/`.
- Members write their full position to a round-folder transcript and send the team-lead a structured digest only;
  the team-lead's context holds digests, not verbatim member reasoning. (Hard, paired with the Consolidator.)
- A `chester:design-committee-consolidator` role exists with a positive enumeration ceiling: it produces the
  alignment count, per-member summaries, and verbatim notable quotes, and is prohibited from characterizing why,
  weighting by risk, or synthesizing a direction. The team-lead applies risk-weighting to its output.
- A minimal disk-written ledger bounds the team-lead's growth rate per round; the team-lead is demonstrably
  rehydratable mid-deliberation from the ledger plus round records across a session boundary. (Criterion is
  "growth materially reduced versus baseline + state survives a session handoff" — NOT "flat across rounds.")
- The committee runs one unconditional path: no cutover, no multi-round gate, no degrade-to-no-op clause. A
  single-round consult incurs one Consolidator spawn and nothing more.
- The round-record template describes the round-folder model with a distinct Consolidator section separate from
  the team-lead's Final Recommendation.
- Existing measures (inter-agent caveman ultra, persist-every-round, mandatory `TeamDelete`, linked-not-quoted
  context packets) remain intact and are composed with, not replaced by, the new disciplines.
- The forbidden-attach-surfaces and floor-not-ceiling constraints are cited from `references/skill-contract.md`
  (where they already live); the brief carries no dangling external citations.
- No occurrence of "Mode A" / "Mode B" anywhere; the term is "Ad-hoc committee" or "design-architect-committee".
- A retrospective dry-run against a prior multi-round committee session shows the team-lead's peak context
  materially reduced versus the same session run without the disciplines.

---

## Out of Scope / Residual

- **Late-evidence Step-4 revision sub-rounds** — a post-finals re-dispatch triggered by new evidence. This has no
  coverage in any committee file today and is a standalone mechanism, not a dependency of context economy. It is
  demoted out of this brief's authority chain and, if wanted, becomes its own feature brief.
- **`design-architect-committee`** — deprecation-pending; none of these disciplines extend to it.

---

## Change Log

- **-01 (2026-06-04).** Revised after an Ad-hoc committee design review (record:
  `20260604-01-update-committee-context-management/committee/round01/`). All seven open concerns from -00 were
  adjudicated by the designer: granted member write access + the `committee/roundNN/` layout (replacing the
  `design/`-resident record); promoted digest-to-lead to a hard paired acceptance criterion; gave the
  Consolidator its own enumerate-only role; scoped the ledger to a minimal disk artifact and rewrote its
  criterion from "flat" to "materially reduced + session-handoff survivable"; removed the single/multi-round
  cutover in favor of one unconditional path; re-pointed the stale sister-brief citations to
  `skill-contract.md` and demoted the late-evidence sub-round reference; scoped the whole feature to the Ad-hoc
  committee and banned the "Mode A/B" vocabulary.
- **-00 (2026-06-04).** Original framing: four composable disciplines (move-not-copy, Consolidator,
  digest-to-lead, ledger+rehydration) with seven open concerns.
