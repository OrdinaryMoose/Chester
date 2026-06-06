# Researcher Findings — Round 01
# Sprint: 20260606-01-update-committee-context-management
# Role: Researcher
# Date: 2026-06-06
# Phase: EVALUATE — why does TL still eat most per-round context despite the consolidator?

---

## 1. Round05 Token Claim: "TL hit 200k+ in one round, compaction ~380k mid-session"

**VERDICT: NOT VERIFIABLE FROM ON-DISK ARTIFACTS. No on-disk record of these figures exists.**

Search scope: all `.md` files under `docs/chester/working/`, `docs/chester/plans/`,
`~/.claude/teams/`, committee artifacts for `20260604-02-review-start-context`. Searched
for: `200k`, `380k`, `200,000`, `380,000`, `TL hit`, and compound forms.

Result: zero matches. The 200k+ and 380k figures do not appear in any artifact on disk —
not in the handoff.md, not in the ledger.md, not in any round transcript or
consolidator-output. The claims appear to have been made in conversation (possibly in
the pre-design `/btw` exchange captured in `summary/team-lead-context-problem.md`) but
were never recorded as concrete numbers to disk.

**What IS provable from on-disk artifacts:**

Raw file sizes across all 5 rounds of the `20260604-02-review-start-context` committee:

| Round | Total bytes (all files) | Rough token estimate (~4 bytes/tok) |
|-------|------------------------|--------------------------------------|
| round01 | 52,258 bytes | ~13,064 tokens |
| round02 | 129,944 bytes | ~32,486 tokens |
| round03 | 104,088 bytes | ~26,022 tokens |
| round04 | 112,648 bytes | ~28,162 tokens |
| round05 | 123,189 bytes | ~30,797 tokens |
| **Cumulative after round05** | **522,127 bytes** | **~130,531 tokens** |

These are the artifact sizes on disk — not TL in-context usage. The TL would NOT have
read all of this: by design, TL reads only digests (messaging) + consolidator output,
not the full transcripts. The cumulative artifact total is an upper bound, not a TL
context measurement.

**Key fact:** Even if all disk artifacts were read (they weren't), the five-round
cumulative is ~130k tokens — less than the claimed 200k+ for one round alone. The
200k+ per-round figure is either: (a) an imprecise conversational estimate never
verified, (b) inclusive of the full session context including system prompt and prior
conversation that inflated the count, or (c) stated in conversation but not grounded.

**Confidence: HIGH on absence finding. No document records these figures.**

**UPDATE — JSONL analysis (see § Token budget from session JSONL below) revised this
finding. The figures are recoverable from session JSONL and partially corroborate the
claims with corrected numbers. The .md artifact absence finding stands; the JSONL
section is the authoritative source on token figures.**

---

## 2. Digest-Size Claim: "300–600 words each"

**VERDICT: CLAIM IS UNVERIFIABLE FROM ON-DISK ARTIFACTS. Absence finding. The claim
is almost certainly inflated or a conflation.**

**Evidence inventory:**

The digests from round05 of `20260604-02-review-start-context` were sent via `SendMessage`.
They are NOT stored in the transcript files (transcripts = member's full reasoning, on
disk before digests were sent per write-then-send sequencing).

The team `design-committee-validate-start-context` inbox files were checked:
`~/.claude/teams/design-committee-validate-start-context/inboxes/team-lead.json`
= 2 bytes (empty array `[]`). All other member inboxes = 2 bytes. Messages were consumed
by recipients; the inbox format does not preserve sent messages, only pending ones.

**There is no on-disk record of what members actually sent as digests in that session.**

**What the protocol specifies:**

`member-protocol.md § Digest shape` defines exactly 6 fields:
```
Role:              <the member's assigned perspective>
Headline position: <one sentence — the member's bottom line for this round>
Chosen option:     <the named option, identified structurally>
Top trade-off:     <one sentence — the single most important cost>
Confidence:        high | medium | low — <one-sentence basis>
Transcript path:   committee/roundNN/<member>-transcript.md
```
Protocol explicitly states: "Keep every prose field to its stated length. The digest is a
routing summary, not an argument; the argument belongs in the transcript."

If strictly followed, 6 one-sentence fields = approximately 50–80 words per digest.
The 300–600 word claim is 4–12x the specified maximum.

**Source of the 300–600 word claim:**

Traced to `summary/team-lead-context-problem.md` (a conversational exchange recorded
post-session in the `20260604-02-review-start-context/summary/` dir). The text reads:
> "those digests are not short (several have been 300–600 words)"

This is a TL self-report in conversation, not a measured figure. No measurement of
actual digest messaging was made or recorded.

**What the round05 transcripts show vs what was sent:**

Transcript sizes in round05 (full member reasoning on disk):
- conservator-transcript.md: 15,531 bytes / 2,359 words
- innovator-transcript.md: 12,916 bytes / 1,907 words
- pragmatist-transcript.md: 14,540 bytes / 2,179 words
- purist-transcript.md: 12,261 bytes / 1,807 words
- researcher-findings.md: 7,281 bytes / 1,132 words

These are the transcripts (NOT digests). None has a separate embedded "Digest" section
showing what was sent to TL — the digest was sent via `SendMessage`, not recorded in the
transcript file. The digests are gone.

**Inference only (not measurement):** The design brief's 300–600 word claim may reflect
members sending their "Summary Position" or full final-position section alongside or
instead of the 6-field digest — a protocol drift where members padded the digest with
their reasoning. This is plausible but not confirmable from on-disk evidence.

**Confidence: HIGH on absence finding. The 300–600 word figure is an unverified TL
self-report, not a measured value. Actual digests are not recoverable.**

---

## 3. Consolidator-Output Sizes Across All Rounds — Is "Enumerate-Only" Actually Small?

**VERDICT: NO. Consolidator output grew significantly beyond its "enumerate-only" spec
in rounds 2–5. Round05 = 21,423 bytes / 3,106 words. This is NOT small.**

Measured sizes:

| Round | bytes | words | Notes |
|-------|-------|-------|-------|
| round01 | 3,266 | 452 | Small — alignment + per-member one-liners + notable quotes |
| round02 | 20,969 | 3,096 | Large — includes per-axis alignment tables, per-member position summaries, notable quotes across 8 axes |
| round03 | 23,369 | 3,340 | Largest — detailed per-source analysis, convergence/divergence breakdown |
| round04 | 16,612 | 2,470 | Large — per-member detailed findings |
| round05 | 21,423 | 3,106 | Large — 7-source enumeration with per-source verdicts, convergence analysis |

**The spec (team-lead.md line 103) defines consolidator output as:**
> "an enumerate-only artifact (alignment count, one-line per-member summaries,
> verbatim notable quotes)"

Round01 (3,266 bytes / 452 words) fits this description — it contains exactly alignment
count, per-member one-line summaries, and notable quotes.

Rounds 02–05 significantly exceed this. Round02's consolidator output (20,969 bytes)
contains per-axis alignment tables, detailed multi-sentence per-member position summaries
across 8 decision axes, full convergence/divergence analysis, and extended quotes. This is
not "one-line per-member summaries" — it is a detailed deliberation record.

**The consolidator-output growth represents the same kind of spec drift that the
conservator transcript identifies for digests: the "enumerate-only" label remained
unchanged while the actual content expanded.**

**Confidence: HIGH. Directly measured from on-disk files.**

---

## 4. Current Committee Mechanics — Source Citations

All citations against:
- SKILL.md v0017: `/home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-committee/SKILL.md`
- team-lead.md v0007: `.../references/team-lead.md`
- member-protocol.md: `.../references/member-protocol.md`

### (a) Digest streams to TL directly

**CONFIRMED.** SKILL.md line 112: "Each member writes its full position to its
round-folder transcript, then sends the team-lead a digest (see
`references/member-protocol.md`); full position text is not sent via messaging."

member-protocol.md line 20: "the **digest is the entire team-lead-facing payload** —
the team-lead sees only the digest, never the transcript body."

The digests go directly to the TL via `SendMessage`. The consolidator does NOT intercept
digests; it reads transcripts from disk. These are separate channels.

### (b) TL authors which artifacts

**CONFIRMED.** team-lead.md Per-Round Flow step 3 (ledger), step 6 (committee-analysis.md
Final Recommendation), step 7 (designer-facing decision packet). Also: draft-spec
(round02) and draft-plan (round04) written by TL in-context per the handoff.md record.

Specific authoring burden per round:
- `committee/ledger.md` update (step 3) — TL-authored, cross-round running record
- `committee/roundNN/committee-analysis.md` (step 6) — TL-authored, round overview + final recommendation
- Designer-facing decision packet presented in conversation (step 7) — TL-authored
- Wrapping-skill bonus: draft-spec and draft-plan authored by TL in rounds 02 and 04

### (c) Synthesis timing vs consolidator output (step order)

**CONFIRMED with a key structural observation.**

team-lead.md Per-Round Flow steps, in order:
1. Dispatch question
2. One-round-format runs (members send digests to TL)
3. **Update the ledger** — written from digests already received, before consolidator is dispatched
4. **Dispatch the Consolidator**
5. **Read the Consolidator output**
6. Write the round's Final Recommendation (from consolidator output)
7. Present packet to designer

Step 3 (ledger update) explicitly precedes step 4 (dispatch consolidator) and step 5
(read consolidator output). The ledger is updated from the digests received in step 2.
This means the TL must process digests to write the ledger BEFORE the consolidator runs.

**The design brief's claim that "consolidator output lands after TL synthesis" is
confirmed by the step order.** Step 3 requires synthesis from digests; step 5 reads
the consolidator. However, step 6 (Final Recommendation) is downstream of the
consolidator — so the recommendation itself should draw from consolidator output,
not from streaming digests alone.

team-lead.md Consolidation Rules (line 313): "the team-lead reads the Consolidator
output... NOT the raw member returns." This mandates the TL not read transcripts, but
does NOT prevent the TL from synthesizing from digests in step 3. The conflict between
"synthesis from digests at step 3" and "use consolidator as synthesis input" is a
genuine structural ambiguity in the protocol.

### (d) Ledger authored by TL in-context

**CONFIRMED.** team-lead.md line 111: "`committee/ledger.md` is the team-lead's running
cross-round record at the `committee/` root. It is **minimal** — a few hundred tokens."

Actual ledger size measured: 5,799 bytes / 729 words. This is at the high end of "a few
hundred tokens" (approximately 1,450 tokens at 4 bytes/token). The ledger across the full
20260604-02 session accumulated five rounds of entries plus the designer decisions section.

The ledger is described in team-lead.md (lines 111–113) as the "compact cross-session
handoff surface" that "materially reduces" context growth. At ~1,450 tokens per session,
this is bounded and small relative to the consolidated per-round artifact sizes.

---

## 5. Round Count and Per-Round Artifact Growth Pattern

**CONFIRMED: 5 rounds (round01–round05). 5 `committee/roundNN/` folders exist.**

Artifact count and content type per round:

- **round01:** 7 files — 4 member transcripts + researcher-findings + consolidator-output + committee-analysis. Standard one-round-format.
- **round02:** 8 files — same 7 + draft-spec.md (TL-authored). DEVELOP phase added one TL artifact.
- **round03:** 7 files — 4 member transcripts + researcher-findings + consolidator-output. No committee-analysis in this round folder (the spec was the output, not a round analysis file).
- **round04:** 8 files — same 7 + draft-plan.md (TL-authored). BUILD phase added one TL artifact.
- **round05:** 9 files — 4 member transcripts + researcher-findings + consolidator-output + handoff.md + plan-attacker-findings + plan-smeller-findings. ATTACK phase added named-subagent findings (plan-attacker, plan-smeller) not in standard format.

Per-round artifact size pattern (total bytes per round):
- round01: 52,258 bytes
- round02: 129,944 bytes (+149% from round01)
- round03: 104,088 bytes (-20% from round02)
- round04: 112,648 bytes (+8% from round03)
- round05: 123,189 bytes (+9% from round04)

Round01 is anomalously small (simple validation, short positions). Rounds 02–05 cluster
in a 100k–130k byte range. The round02 spike corresponds to the DEVELOP phase where
members wrote detailed 8-axis positions and the consolidator output was correspondingly
large.

---

## Summary of Key Numbers

| Claim | Status | Measured value | Confidence |
|-------|--------|----------------|------------|
| TL hit 200k+ tokens in one round | NOT VERIFIABLE — no on-disk record | Largest single round = ~32k tokens (round02, disk total) | HIGH (absence finding) |
| Compaction at ~380k mid-session | NOT VERIFIABLE — no on-disk record | 5-round cumulative = ~130k tokens (disk total, NOT TL usage) | HIGH (absence finding) |
| Digests 300–600 words each | NOT VERIFIABLE — digests not on disk | Protocol spec = ~50–80 words; actual not recoverable | HIGH (absence finding) |
| Round05 consolidator-output = 21k bytes | CONFIRMED | 21,423 bytes / 3,106 words | HIGH (directly measured) |
| "Enumerate-only" consolidator is small | CONTRADICTED | Rounds 02–05 = 16k–23k bytes each; only round01 fits spec | HIGH (directly measured) |
| Ledger "minimal — a few hundred tokens" | APPROXIMATELY CONFIRMED | 5,799 bytes / 729 words ≈ 1,450 tokens | HIGH (directly measured) |
| 5 committee rounds | CONFIRMED | Exactly 5 round folders | HIGH (directly measured) |
| Digests stream to TL directly (not through consolidator) | CONFIRMED | SKILL.md line 112, member-protocol.md line 20 | HIGH (source text) |
| TL authors: committee-analysis.md, ledger, draft-spec, draft-plan | CONFIRMED | team-lead.md steps 3, 6; handoff.md record | HIGH (source text) |
| Synthesis (ledger step 3) precedes consolidator dispatch (step 4) | CONFIRMED | team-lead.md Per-Round Flow step order | HIGH (source text) |
| Ledger authored by TL in-context | CONFIRMED | team-lead.md line 111 | HIGH (source text) |

---

## Peer Questions Received and Answered

All four members sent DMs asking: "what were the actual digest sizes from round05?"

**Answer to all four (conservator, innovator, pragmatist, purist):**

The actual digest messages from round05 are not recoverable. Digests were sent via
`SendMessage`; inbox files at
`~/.claude/teams/design-committee-validate-start-context/inboxes/team-lead.json` = 2 bytes
(empty — messages consumed by TL when read). Sent-message content is not persisted after
consumption in the inbox format.

The 300–600 word claim traces to a TL self-report in conversation (`summary/team-lead-
context-problem.md`), not a measurement. The protocol cap is ~50–80 words (6 single-sentence
fields). The gap between those two figures is 4–12x, and it cannot be resolved from
on-disk evidence.

**Specific answers to member-specific sub-questions:**

- **Conservator** also asked: does round05 consolidator-output (~3,106 words) match the
"enumerate-only" spec? Answer: NO. The spec says "alignment count, one-line per-member
summaries, verbatim notable quotes." Round05 output (21,423 bytes / 3,106 words) contains
per-source verdicts, extended convergence analysis, multi-sentence summaries, and
detailed supporting facts. Round01 (3,266 bytes / 452 words) matches the spec; rounds
02–05 do not.

- **Purist** also asked: does step 3 (ledger update) require synthesis from digests before
consolidator arrives? Answer: YES. team-lead.md Per-Round Flow step 3 precedes step 4
(dispatch consolidator). The ledger carries "the running alignment pattern" — deriving
alignment requires processing the digests. This is a structural sequencing issue: the
TL must synthesize alignment from digests before the consolidator even runs.

Transcript path: `committee/round01/researcher-findings.md`

<!-- produced-by: researcher / round01 / 2026-06-06 -->

## Token budget (from session JSONL)

**Source:** `~/.claude/projects/-home-mike-Documents-CodeProjects-Chester/9ee0b01b-af64-4c7b-9840-1027f48414c5.jsonl`
(876 lines, 2.28MB). Identified by content match: `plan-attacker` + `handoff.md` +
session/agent name "FixStart" + team name `design-committee-validate-start-context`.
Context size per turn = `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`.

**This section supersedes the "NOT VERIFIABLE" verdict in § 1. The .md artifacts lacked
these figures; the JSONL has authoritative instrumentation.**

### Compaction events (from `compactMetadata` in JSONL)

Two manual `/compact` invocations in this session:

**Compaction 1** — JSONL line 247, `2026-06-06T01:03:47`:
- `preTokens: 122,623` (measured by Claude Code before compaction)
- Context after compaction: ~49,822 tokens (first usage turn post-compact)
- Timing: fired after round01 concluded and between the DEVELOP/ATTACK spec rounds
- Trigger: manual (`"trigger": "manual"`)

**Compaction 2** — JSONL line 856, `2026-06-06T09:05:43`:
- `preTokens: 347,339` (measured by Claude Code before compaction)
- Trigger: manual
- Context immediately before (line 848, `09:03:49`): "Handoff written →
  `committee/round05/handoff.md`. Safe to compact." — confirms this is the end-of-round05
  compaction the designer manually triggered after the handoff.md was complete.

### Peak context

**Peak: 346,692 tokens** at JSONL line 847, `2026-06-06T09:03:49`.
Breakdown: `input=31, cache_read=340,966, cache_create=5,695`.
This is the turn immediately before the handoff.md write confirmation.

Session crossed 200k tokens around turn 155 in the deduplicated sequence (unique context
turn ~55), during the committee spec+plan work spanning rounds 02–05.

### Verdict on "TL hit 200k+ in one round, compacted ~380k"

- **"200k+ in one round"** — PARTIALLY CORROBORATED, understated. Session crossed 200k
  during the rounds 02–05 span (not in a single round). Peak was 346,692 — substantially
  more than 200k. The "one round" framing is imprecise: context climbed across rounds 02–05
  in the second session segment (after compaction 1 reset it to ~50k).

- **"Compacted ~380k"** — PARTIALLY CORROBORATED, overstated by ~33k. Compaction 2
  fired at `preTokens: 347,339` — not 380k. No compaction at 380k occurred. The peak
  before compaction was 346,692 tokens; the `preTokens` figure (347,339) adds the output
  tokens from the final turn. The closest figure to "~380k" is 347k rounded up — a
  reasonable recollection given the peak was 346k and the figure was not recorded.

**Corrected figures:**
- Peak context: **346,692 tokens**
- Compaction 1: **122,623 preTokens** → reset to ~49,822 (between round01 and round02)
- Compaction 2: **347,339 preTokens** → end of session (round05 complete)
- Session crossed 200k: during rounds 02–05 span

**Confidence: HIGH. `compactMetadata.preTokens` is authoritative Claude Code instrumentation.
Usage fields are per-turn measured values.**

### Cross-finding (load-bearing)

On-disk committee `.md` artifacts total ~130k tokens rough estimate (all 5 rounds, all
files). The TL session peaked at 346,692. The gap (~217k, roughly 63% of peak TL context)
is NOT represented in any committee artifact on disk. This gap is ephemeral in-context
work: draft authoring (draft-spec, draft-plan, committee-analysis.md), source/code reads
during drafting, streamed digests received (not on disk), consolidator outputs read back
into context, named-subagent findings (plan-attacker/plan-smeller) read back, peer-DM
idle summaries, system prompt overhead.

Implication: the consolidator offloads transcript-reading — the transcripts are on disk
and NOT read by the TL. But the dominant share of TL context (~63%) comes from channels
the consolidator never touches. This is the structural gap the design brief describes.

---

## Pass-1 decision (circularity check)

**Source files read:**
- `docs/chester/plans/20260604-01-update-committee-context-management/spec/20260604-01-update-committee-context-management-spec-00.md`
- `docs/chester/plans/20260604-01-update-committee-context-management/committee/round01/committee-analysis-01.md`

**Question:** Is today's "scribe = author the drafts" the SAME role pass-1 rejected, or a DIFFERENT role aimed at a channel pass-1 never addressed?

### Q1. What problem did pass-1 set out to solve?

Verbatim from spec-00.md § Goal:

> "Keep the Ad-hoc committee team-lead's context from growing with round count. Today
> the team-lead carries every member's full return for the rest of the session
> (Conduit), holds all four returns at once to consolidate (Synthesizer), and runs
> dispatch/adjudication/closure (Controller). This change strips the Conduit and
> Synthesizer payloads off the team-lead's thread."

Problem: TL received and held every member's full transcript. Pass-1 targeted the
**transcript-reading burden** (Conduit + Synthesizer roles). Artifact authoring was
not named as a burden.

### Q2. The consolidator decision — what role/job was defined?

Verbatim from spec-00.md § Consolidator Role:

> "An ephemeral off-thread subagent dispatched once per round to read the round
> folder's member transcripts and emit an enumerate-only synthesis to
> `committee/roundNN/consolidator-output.md`."

The consolidator = **reads transcripts from disk** (off-thread) + writes one enumerate-only
output. Offloads READING. Does not touch digest routing, synthesis from digests,
or TL artifact authoring. This is unchanged from today's design.

### Q3. The scribe — what was proposed, and what was the rejection text?

Pass-1 committee-analysis-01.md § Final Recommendation identifies a blocker:

> "No committee member can save files (no Write permission) — the verbatim-to-disk
> path is unbuildable until that grant is added or a scribe role absorbs the writing."

The scribe was ONE OPTION for satisfying the verbatim-to-disk requirement: the scribe
would write member transcripts to disk on the members' behalf (since members had no
Write access).

Pass-1 Decision 1 resolution (committee-analysis-01.md):

> "Option 1 — grant committee members Write access. Verbatim-to-disk is satisfied by
> members writing their own transcripts, not by the team-lead writing on their behalf
> (the 'renamed conduit' non-fix)."

Rejection language: **"the 'renamed conduit' non-fix"** — the scribe-writes-transcripts
alternative was dismissed as a renamed version of the conduit pattern (TL/surrogate
carrying members' payloads). Pass-1 chose to grant Write access directly; the scribe
alternative was dropped.

### Q4. Pass-1's scribe = offload READING or WRITING?

**WRITING TRANSCRIPTS TO DISK.** Not reading. Not authoring TL artifacts.

Pass-1's scribe was a workaround for missing Write permissions: instead of members
writing their own transcripts, a scribe would write those transcripts on their behalf.
The payload was identical (member reasoning/positions); only the writer changed
(scribe vs member). This addresses the **member→disk** path — not TL authoring burden.

### Q5. Did pass-1 ever consider offloading artifact authoring?

**NO.** Pass-1's spec and committee analysis contain no mention of:
- draft-spec authoring
- draft-plan authoring
- committee-analysis.md authoring
- ledger authoring

as burdens to offload. The spec's Data Flow section shows "8. TL writes Final
Recommendation (committee-analysis.md)" as an explicit, unchanged TL step. No
subagent was proposed, discussed, or rejected for this purpose. TL artifact authoring
was not framed as a problem in pass-1.

### Bottom line

Today's Candidate C ("scribe = author draft-spec and draft-plan") is a **DIFFERENT role**
from pass-1's scribe. They share the word "scribe" but target entirely different channels:

| | Pass-1 scribe | Today's Candidate C scribe |
|---|---|---|
| Channel | Member→disk (Write access workaround) | TL authoring burden (draft-spec, draft-plan) |
| What it writes | Member transcripts on members' behalf | TL's draft-spec and draft-plan |
| Payload | Member reasoning (same data, different writer) | New artifacts not previously delegated |
| Status | Rejected (grant Write directly instead) | Proposed — not yet decided |

Pass-1 never considered or rejected a scribe for TL artifact authoring. Today's Candidate C
is not a circle — it is a channel pass-1 never addressed.

**Confidence: HIGH. Sourced from verbatim spec and committee analysis text.**
