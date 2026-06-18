# Committee Convening Packet — round01

## Question (one sentence)

Should `design-committee` emit a **complete design document** via a committee-specific template that mirrors the eight FAC-complete-design fields — reversing **D9**, which kept the committee on a verdict-only decision packet and made `spec-write` extract the design from narrative?

## Round shape

one-round (default). Produce your full position this round.

## The gap being decided

- `design-committee` today emits only a **verdict decision-packet** — `skills/design-committee/references/artifact-template.md` (Summary / Verdict / Rationale / Dissent Record / Deferred). Not a design document.
- `design-small-task` emits a real **six-section design brief** — `skills/design-small-task/references/design-brief-small-template.md` (Goal, Prior Art, Scope, Key Decisions, Constraints, Acceptance Criteria).
- Both feed `spec-write` as a "FAC-complete design," but only the brief is an actual design document. The committee side is a verdict the design gets reverse-engineered out of.
- The bridge contract is `skills/spec-write/references/fac-complete-design-contract.md`. It defines FAC-complete-design as **eight fields `spec-write` extracts** from the producer's native output. For the committee, those fields are mined from a narrative verdict.
- **D9** (same contract file, ~lines 24-26) explicitly *rejected* a typed committee design bundle to avoid "artifact bifurcation," keeping it only as a fallback.
- Self-admitted risk in that contract (~line 22): silent mis-extraction from a narrative verdict is "the one failure hardening structurally cannot catch — the quote-back is the only guard." Removing reliance on that single human gate is the point of this work.

## Designer's leanings — PRESSURE-TEST THESE, they are NOT pre-decided

- **(a)** Scope = a **committee-SPECIFIC template** mirroring the eight FAC fields. NOT a single shared format with `design-small-task`. Keep the committee's mandatory **Dissent Record**.
- **(b)** Path = convene the committee (this very consultation), because it is a meta-architecture / D9-reversal call.

The committee must be free to challenge these. In particular the **Purist** is tasked to attack (a) head-on: *why not one shared format with `design-small-task`?*

## Hard constraints any solution must respect

- **Context-economy invariant** — the scribe stays bounded-input: it authors from `verdict.md` + `consolidator-output.md` + `alignment-map.md` only, never raw transcripts or the session thread. See `agents/design-committee-scribe.md`.
- **Catalog freshness** — if any skill `description` changes, regen + stage `skills/setup-start/references/skill-index.md` in the same commit (`bin/chester-generate-agents`). Version-bump-only edits are catalog-safe.
- **Standalone invocability** of the committee must survive — no sprint context fabricated.

## Files worth reading (you have Read/Glob/Grep)

- `skills/design-committee/references/artifact-template.md` — current verdict-packet template (the thing being replaced/augmented).
- `skills/design-small-task/references/design-brief-small-template.md` — the six-section brief, for the "one shared format?" comparison.
- `skills/spec-write/references/fac-complete-design-contract.md` — D9 rationale + the eight-field extraction framing.
- `agents/design-committee-scribe.md` — scribe inputs/output; the context-economy boundary.
- `skills/design-committee/SKILL.md` § Scribe — where the template path is wired in.

Repo root: `/home/mike/Documents/CodeProjects/Chester`

## Roster (for peer-DM)

Advocacy members: `conservator`, `innovator`, `pragmatist`, `purist`. Plus `researcher`. Team-lead = `main`.

You may challenge any peer directly via SendMessage (caveman ultra, max 2 exchanges per pair). Peer-DM is working chatter — nothing reaches the team-lead through it, only through your transcript's `## Final Position`.

## Your deliverable

1. Write your full position to `committee/round01/<your-role>-transcript.md` (researcher → `researcher-findings.md`). Code vocabulary IS allowed in transcripts — the Translation Gate does not apply here.
2. End the transcript with `## Final Position` (exact header, last section, ≤200 words), schema:
   `{position, rationale, blocking_risk, warrant}` where `warrant = {type: evidence|logic|in-scope designer-premise, source}`.
3. THEN send your routing signal to `main` via SendMessage — exactly `{member, status, round, transcript}`, no free-text. Write the transcript to disk BEFORE sending the signal.
