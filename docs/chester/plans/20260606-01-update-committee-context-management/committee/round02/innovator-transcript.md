# Innovator Transcript — Round 02 (DESIGN — generative)
# Sprint: 20260606-01-update-committee-context-management
# Role: Innovator
# Date: 2026-06-06

---

## Framing: The Correct Starting Point

The evidence from round01 is decisive: 347k TL peak, 63% ephemeral and off-disk, two forced
compactions. The current committee shape forces this because the TL is a synthesis engine by
construction. Patching the digest channel (A + B from round01) treats a symptom. The root shape
is wrong.

The correct re-framing: the committee's job is to converge on an answer to a question and
produce a decision packet for the designer. Nothing in that job description requires the
TL to hold any member content in-context. The TL's two legitimate functions — dispatch and
present — are zero-synthesis tasks. Everything currently between them is an artifact of the
existing shape, not a constraint of the job.

Starting from zero.

---

## Proposed Redesign: Blackboard Committee

### Core Shape

Replace the digest-to-TL channel entirely with a **convergence blackboard** — a single shared
disk file that members write to directly, in structured format, round by round. The TL never
reads member content at all. Instead:

1. TL dispatches question (one SendMessage, no content back).
2. Members write positions directly to the blackboard in a defined schema.
3. A **Synthesizer** (replaces Consolidator) reads the blackboard and produces a compact
   decision artifact — not an enumeration, but an actual convergence document: final answer
   + minority dissent + confidence + one-line per-member deviation.
4. TL reads ONLY the Synthesizer output (the decision artifact), presents it to the designer.

The TL holds in-context only: the original question, the Synthesizer decision artifact (~500
tokens max if format is disciplined), and the designer conversation. That is the full TL
context load. No digests. No raw member content. No consolidation step in TL context. No
ledger synthesis required.

---

## 1. Channel Formats

### TL → Members (dispatch)

Current: full convening message (~1k+ tokens), copied to each member.

Redesigned: **one-line task pointer** sent to a shared dispatch file on disk. Members read
the dispatch file. TL sends a single short SendMessage to each member: "round N open —
read dispatch.md." No content in the message body. Dispatch.md carries the question, the
context pointers (file paths), and the round schema.

This eliminates the per-member convening message from TL context entirely. The dispatch.md
is written once, not duplicated into each message.

### Members ↔ Members (peer exchange)

Current: direct DM SendMessage exchange. Each message lands in recipient's context. Fine for
members (their context is their own). No TL involvement — this is already correct shape.

Redesigned: no structural change needed here. Member-to-member DMs are already off-TL. One
refinement: members are explicitly told NOT to send peer-DM summaries to TL. All peer
learning stays in the member's own blackboard entry.

### Members → TL (the broken channel)

Current: digest SendMessage (50-600 words, contested). Lands in TL context. TL synthesizes
from it. This is the leak.

Redesigned: **ELIMINATED.** Members do not send anything to the TL. Instead:

Members write their position to the **blackboard file** in a fixed schema (see below).
The blackboard is a disk file. The TL never reads it directly. The Synthesizer reads it
off-thread and produces the decision artifact. The TL reads only the decision artifact.

The "member → TL" channel collapses to: member writes disk, Synthesizer reads disk,
Synthesizer writes decision artifact, TL reads decision artifact.

### Blackboard Schema (per member entry)

```
## [Role] — Round N

position: <one sentence — the member's recommended answer to the posed question>
option: <structural name of the chosen option>
confidence: high | medium | low
key_evidence: <one sentence — the single strongest supporting fact>
dissent: <one sentence — what the member disagrees with in the likely majority position, or "none">
peer_delta: <one sentence — how peer exchange changed position, or "unchanged">
```

Six fields. Hard character limit enforced by schema (e.g., 120 chars per field). Total per
member: ~720 chars max = ~180 tokens. Five members = ~900 tokens total blackboard. The
Synthesizer reads 900 tokens of structured data, not 60k of transcripts.

Full reasoning stays in the member's transcript file on disk, exactly as now. The blackboard
is the structured signal extract, not the reasoning.

---

## 2. Roles and Membership

### What to keep, merge, or drop

**Drop: Consolidator.** The consolidator's job was to enumerate transcripts so the TL didn't
have to read them. With the blackboard, transcripts are never read at all during synthesis.
The Synthesizer works from the structured blackboard entries. Consolidator is obsolete in
this shape.

**Replace with: Synthesizer.** A single off-thread agent that:
- Reads the blackboard (structured, ~900 tokens)
- Reads the Synthesizer's own prior output (to track convergence across rounds)
- Determines whether the committee has converged (majority position clear, dissent bounded)
  OR is genuinely split (2-2 or 3-way split)
- Writes a decision artifact: answer + minority dissent + confidence + recommended next step

The Synthesizer is NOT enumeration-only. It is a convergence judgment agent. It reads
minimal input (blackboard), produces minimal output (decision artifact, ~300-500 tokens),
and does so off-TL.

**Keep: Researcher.** Writes findings to disk, referenced by members via file pointer. No
change to the researcher role — it already doesn't send content to TL by default.

**Keep: Four advocacy members (Conservator, Innovator, Pragmatist, Purist).** Perspective
diversity is the value. However — consider reducing to three for context-lighter rounds.
The four-member shape is a design choice, not a constraint. Three members + researcher +
synthesizer may be sufficient for most questions. Offer the designer a "committee depth"
parameter: three-member (faster, lighter) vs four-member (fuller coverage).

**Merge consideration: Researcher + Synthesizer.** The researcher gathers facts; the
synthesizer distills committee positions. These are different tasks with different tool
access needs. Keep separate. Researcher needs Read/Grep/WebSearch; Synthesizer needs only
Read (the blackboard + prior decision artifact).

**New role: Moderator (optional, for contested rounds).** When the Synthesizer flags a
genuine split (cannot converge), a Moderator can be dispatched as a tiebreaker: reads the
blackboard + both split positions, proposes a resolution criterion for the designer. This
is a lightweight one-shot dispatch, not a standing member. Replaces the TL's current role
of "name the split adjudication" (which requires TL to read member positions to understand
the split). The Moderator offloads that split-naming task from TL context.

### Roster summary

- **TL** — dispatch, read decision artifact, present to designer. Zero content in-context.
- **Conservator, Innovator, Pragmatist, Purist** — write blackboard entries, full transcript
  on disk. No messages to TL.
- **Researcher** — writes findings to disk. Referenced by members via file pointer.
- **Synthesizer** (replaces Consolidator) — reads blackboard, writes decision artifact.
  Off-thread, not on TeamCreate roster.
- **Moderator** (optional, on-demand) — reads split positions, writes resolution criterion.
  Dispatched only when Synthesizer flags genuine split.

---

## 3. Synthesis: Who, From What, When

### Who

The Synthesizer. Off-thread dispatch, not in TL context. Never on the TeamCreate roster.

### From what

The blackboard (~900 tokens of structured member entries) + prior decision artifact for
round-to-round convergence tracking. The Synthesizer does NOT read transcripts. Full
reasoning is on disk for human review; the Synthesizer's job is to distill the structured
signal, not re-derive it from prose.

### When

After all members have written their blackboard entries. The TL dispatches the Synthesizer
after receiving confirmation that all members are done — confirmation being a single
one-line SendMessage from each member: "blackboard written, round N." This is the ONLY
message members send to TL. One line. No content. Just a done signal.

The Synthesizer runs once per round. The TL waits for the Synthesizer output before
presenting to the designer. No premature synthesis from streaming arrivals.

### What the Synthesizer produces (decision artifact format)

```
## Decision Artifact — Round N

answer: <the committee's converged answer, one sentence>
confidence: high | medium | low
convergence: <4-0 / 3-1 / 2-2 / 3-way> — <who is where, one line>
minority: <one sentence — the dissenting position if 3-1 or 2-2>
key_evidence: <one sentence — the single strongest shared fact across positions>
open_question: <one sentence — the most important unresolved question, or "none">
recommended_next: <one sentence — what the committee recommends the designer decide or do>
```

Seven fields. ~500 tokens max. This is what the TL reads. This is the full in-context
synthesis load per round.

---

## 4. Convergence: How the Committee Reaches an Answer

The current design enumerates — it tells the designer "here is what each member said."
That is not convergence; it is a report. The designer has to do the convergence work.

The redesigned committee converges before the designer sees it. The Synthesizer's job is
to determine: do four structured positions point at one answer? If yes, state it. If no
(genuine split), name the split and the resolution criterion the designer must choose.

**Convergence mechanics:**

Round 1 — members write independent positions (no peer exchange yet).
Round 2 — members write revised positions after peer DMs. The Synthesizer checks:
  did positions converge between round 1 and round 2? If yes, present the answer.
  If no, present the split.

This means the default design is TWO member rounds (independent + revised), not one.
The TL presents the result after the second member round, not after one. The cost is
one extra member round; the gain is that the designer gets a converged answer, not a
raw enumeration.

**When to stop:**

The Synthesizer writes a convergence verdict in the decision artifact:
- `CONVERGED` — majority reached, minority position stated. TL presents answer + dissent.
- `SPLIT` — genuine 2-2 or 3-way. TL presents split + resolution criterion.
- `NEEDS_ROUND` — positions not yet stable (large variance round-to-round). TL proposes
  one more member round to the designer.

The designer can override in any direction. The Synthesizer's verdict is a recommendation,
not a gate.

---

## 5. Designer Decision Enablement

The current decision packet is a long information package that the designer reads and
responds to. The redesigned packet is minimal and action-oriented:

### Decision packet format (TL → designer)

```
Question: <the original question>
Answer: <the Synthesizer's converged answer, one sentence>
Confidence: <high | medium | low>
Minority: <one sentence dissent if applicable, or "unanimous">
Key trade-off: <one sentence — what accepting this answer costs>
Open: <one sentence — what this doesn't resolve>
Options: <if split — option A (who defends) / option B (who defends) in two lines>
```

No prose exposition. No "information package" section. No "committee member updates" with
named alignments. The designer gets: here is the answer, here is the confidence, here is
what you give up, here is what's still open, what would you like to do.

If the designer wants more — if they want to see the minority reasoning, or a specific
member's position — they ask, and the TL fetches from the transcript files on demand. No
pre-loading of content that may not be needed.

This is **pull-on-demand** rather than **push-all**: the default packet is minimal; depth
is available on request via targeted disk reads.

---

## 6. What This Eliminates (Summary)

Against the current shape:

- **Digest channel (all 300-600 words per member per round):** eliminated. Members write
  blackboard only. TL receives one-line done signals only.
- **Consolidator:** eliminated. Blackboard schema makes transcript reading unnecessary.
- **Ledger synthesis:** eliminated. The Synthesizer's round-to-round convergence tracking
  replaces the TL's ledger update (which required reading prior round summaries in-context).
- **Committee-analysis.md authoring in TL context:** eliminated. The Synthesizer writes the
  decision artifact. The TL reads it, does not author it.
- **Premature synthesis from streaming arrivals:** eliminated by design. TL waits for
  one-line done signals from all members, then dispatches Synthesizer, then reads decision
  artifact. No streaming synthesis.
- **Large information package prose in decision packet:** replaced by seven-field structured
  format. Pull-on-demand for depth.

**What remains in TL context:**
- The original question (~50 tokens)
- Done signals from members (5 x ~10 tokens = 50 tokens)
- Synthesizer decision artifact (~500 tokens)
- Designer conversation turns

Estimated TL context per round: ~600-800 tokens of new content, vs the current shape's
~20,000+ tokens per round. Across a 5-round committee: ~3,000-4,000 tokens vs 100,000+.

---

## 7. Risks and Honest Trade-offs

**Risk 1: Blackboard schema loses nuance that digests carried.**
The current 300-600 word digest (if real) carries reasoning texture that six structured
fields cannot. The Synthesizer works from less signal and may miss important nuances that
would have changed the answer. Mitigation: the Synthesizer can flag "low confidence in
convergence — suggest reading transcript X" when blackboard entries show high variance.
The TL then reads only the specific flagged transcript, not all of them. Selective read,
not bulk read.

**Risk 2: Synthesizer quality gate.**
The Synthesizer's judgment replaces the TL's synthesis. If the Synthesizer gets the
convergence wrong — calls CONVERGED when there's a genuine important split — the designer
gets a false answer. The current TL synthesis, for all its context cost, has the TL's
full reasoning capacity behind it. The Synthesizer is an off-thread agent with limited
context. Mitigation: Synthesizer format is structured; errors are detectable (e.g., a
"high confidence" answer from a 2-2 blackboard is an immediate flag). The designer is
still in the loop and can push back.

**Risk 3: Two-round member structure adds wall-clock time.**
If the default shape is two member rounds (independent + revised), each committee session
takes longer. The current one-round format is faster. Mitigation: the designer can select
"single-round" mode (independent positions only, no revision round). The Synthesizer
presents "first-pass convergence" which may be less stable but is faster.

**Risk 4: Done-signal protocol adds coordination overhead.**
Members must send a one-line done signal to TL. This is a small additional protocol step.
Risk: a member fails to send the signal (context drop, error). TL waits indefinitely.
Mitigation: TL sets a soft timeout — if not all done signals arrive within the round
window, TL reads the blackboard directly (checking which entries are written) and
proceeds with what's available. This is a fallback, not the happy path.

---

## Peer Questions

**To researcher:** What prior art exists for blackboard-pattern agent communication in
multi-agent AI systems? Specifically: shared structured disk state that agents write to
and a separate synthesis agent reads, rather than agent-to-orchestrator messaging. Is this
a recognized pattern in agent architecture literature or deployed systems? Looking for
evidence that informs whether the blackboard schema can reliably replace digest messaging.

**To conservator:** The redesign eliminates the digest channel entirely and replaces
member-to-TL communication with blackboard writes + one-line done signals. What does
this break in the existing committee's safety guarantees? Specifically: are there cases
where the current digest channel surfaces information that the blackboard schema would
fail to capture, causing a wrong convergence verdict?

---

## Peer Answer Received — Conservator

**Conservator's question:** Their design keeps structured 6-field signal packets (60-word
ceiling) with a `kill_shot: boolean + one sentence` field sent directly to the TL. Their
concern: routing-only or blackboard-only designs lose kill-shot detection until Synthesizer
output lands — creating a sequencing gap where TL can't act on fatal findings mid-round.

**My reply:**

The sequencing gap is real — and intentional. My design's answer: the TL never acts on
any member signal before Synthesizer output. Always. The TL waits for all done signals,
dispatches Synthesizer, reads decision artifact, then presents. No mid-round action. This
eliminates the streaming synthesis pattern that caused 347k TL context.

Resolution: add `kill_shot: yes | no` as field 7 in the blackboard schema. When any
member writes `kill_shot: yes`, the Synthesizer sets `convergence: KILL_SHOT` in its
decision artifact, and includes the key_evidence sentence plus the member's transcript
path for pull-on-demand depth. The TL reads `KILL_SHOT` in the decision artifact and
acts immediately. Delay is exactly one Synthesizer dispatch — seconds, not a structural
gap.

Genuine residual gap: if kill-shot reasoning is too nuanced for one sentence, the
Synthesizer may understate it. Mitigation: Synthesizer writes transcript path on
`KILL_SHOT` verdict; TL surfaces path to designer as pull-on-demand option. TL still
does not read the transcript itself.

Convergence with conservator: their `kill_shot` field proposal is correct. I adopt it
into my blackboard schema as field 7. The remaining difference is routing — their packet
goes direct to TL; mine goes through Synthesizer. I prefer Synthesizer path because it
keeps TL at zero direct member content. But the `kill_shot` field is a genuine
improvement either way.

**Position update:** blackboard schema now has 7 fields, with `kill_shot` added.

---

## Peer Answer Received — Pragmatist

**Pragmatist's question:** Could the Synthesizer be eliminated by having members write to
a shared synthesis document collaboratively — each reads prior entries and adds/revises,
so the document IS the synthesis by the time all members write?

**My reply:**

Honest comparison:

Gains: eliminates the Synthesizer role entirely; convergence happens organically as later
writers respond to prior entries; one document with N writers is architecturally simpler.

Losses:
- Serializes members — Member 4 cannot write until 1-3 have written, creating write-order
  dependencies or file collision if members run in parallel.
- Poisons independence — Member 4 reads prior entries and anchors to them; convergence may
  reflect anchoring not evidence. The parallel blackboard preserves independence by
  construction; collaborative writing trades it for simplicity.
- Context load is non-uniform — the last writer reads a growing document before writing,
  making their context load higher than the first writer's.
- Race conditions if parallel — file contention requires locking or append-only discipline,
  adding coordination overhead that offsets the ceremony savings.

Verdict: collaborative synthesis document optimizes for role simplicity at the cost of
member independence and serialization. For a committee whose value is perspective
diversity, poisoning independence is too high a price. The Synthesizer is one extra
dispatch per round — low ceremony for preserving the parallel-and-independent property
that makes committee deliberation worth running.

**Position unchanged.** Parallel blackboard + Synthesizer is the right shape.

---

## Peer Answer Received — Conservator (arrived post-HALT; recorded only, no reply sent per TL instruction)

**Conservator identified two gaps in the blackboard-only design:**

**Gap 1 — Write-timing:** If a member writes their blackboard entry before a peer DM
changes their position, the Synthesizer reads stale data. Example: round05 Innovator
conceded the Task 1/2 merge recommendation after Pragmatist's peer analysis — a mid-round
stance shift. A pre-DM blackboard write would show the old position; the Synthesizer
would report a split that no longer exists.

Conservator's fix: the blackboard write must happen AFTER all peer-DM completes —
equivalent to the current "write-then-send sequencing" rule. A `finalized: YES/NO` field
or timestamp lets the Synthesizer gate on completion.

**Gap 2 — Conflicting kill-shots with no basis signal:** When two members both write
`kill_shot: YES` with conflicting evidence claims and `confidence: HIGH`, the Synthesizer
cannot adjudicate between them from the blackboard alone. It either over-reports both as
equal-weight (noise) or picks one by hidden heuristic (wrong). The current digest's
one-sentence trade-off field carries basis signal the blackboard schema drops.

Conservator's fix: add a `basis_ref` field pointing to the transcript section where the
kill-shot evidence lives, OR require the Synthesizer to read both transcripts whenever
two `kill_shot: YES` flags conflict. The latter is correct — on-demand selective read
is exactly the right pattern.

**Assessment:** Both gaps are genuine. Both are closeable:
- Gap 1: write-timing rule (blackboard finalized after peer-DM, not before). Existing
  "write-then-send" protocol applies directly — members write blackboard entry at the
  same moment they would have sent the digest. No schema change needed; protocol rule only.
- Gap 2: add mandatory Synthesizer transcript-read on conflicting kill-shot flags. This
  is a Synthesizer behavior rule, not a schema change. The Synthesizer reads only the
  flagged transcripts, not all of them — selective, bounded, on-demand.

Neither gap is fatal. The conservator's analysis is correct and strengthens the design by
surfacing the protocol rules needed to make the blackboard approach safe.

**Position update:** blackboard design now requires (1) finalize-after-peer-DM write
timing rule, and (2) Synthesizer mandatory transcript-read rule on conflicting kill-shots.
Core shape unchanged.

---

## Peer Answer Received — Purist (arrived post-HALT; recorded only, no reply sent per TL instruction)

**Purist identified two category errors in the six-field blackboard schema:**

**Category error 1 — confidence is self-reported and unvalidatable.**
The schema has no reasoning chain. `key_evidence` is one sentence of supporting evidence,
not the logic connecting evidence to conclusion. A Synthesizer reading `confidence: high`
from three members cannot distinguish: (a) three members with strong independent reasoning
who genuinely converge, from (b) three members sharing the same flawed premise who are
each overconfident. Both produce identical field values. The Synthesizer may call
CONVERGED on three high-confidence positions that all rest on the same unexamined
assumption.

Purist's fix: the transcript IS the reasoning chain. The Synthesizer reads the schema
fields for alignment mapping, then reads transcripts for evidence-quality validation.
Not a schema-change fix — a Synthesizer behavior fix.

**Category error 2 — peer_delta conflates engagement with change.**
`peer_delta: none` is ambiguous between (a) member engaged with a peer DM and was
genuinely unmoved, and (b) member did not engage at all. Both produce identical field
values. A Synthesizer reading four `peer_delta: none` values cannot tell whether the
round produced genuine independent convergence or four members talking past each other.

Purist's fix: split into two fields — `peer_engaged: yes/no` (did the member receive
and read a peer DM this round?) and `peer_delta: changed/unchanged` (if engaged, did
position change?). This cleanly separates the four cases: engaged+unchanged (stable),
engaged+changed (update), not-engaged+unchanged (no signal), not-engaged+changed (flag).

**What the six fields ARE sufficient for (purist's positive finding):**
Option, position, and dissent are categorically clean — they express the member's
conclusion without ambiguity. The schema is sufficient for the alignment map (who is on
which side). It is NOT sufficient for evidence selection or confidence validation without
the Synthesizer also reading transcripts.

**Assessment:** Both category errors are genuine and the purist's fixes are correct.

- Category error 1 fix: the Synthesizer reads transcripts for evidence selection, not
  only schema fields. This was already implied by the conservator's conflicting-kill-shot
  rule — the purist generalizes it: Synthesizer always reads transcripts for evidence
  quality, uses schema fields only for alignment counting.

- Category error 2 fix: split `peer_delta` into `peer_engaged` (yes/no) + `peer_delta`
  (changed/unchanged if engaged). Adds one field (schema grows to 8 fields), removes
  ambiguity entirely.

**The purist's finding clarifies the correct two-layer architecture of the blackboard:**
- Layer 1: schema fields → fast alignment map (TL context load: ~900 tokens for 5 members)
- Layer 2: transcripts → evidence quality and confidence validation (Synthesizer reads
  selectively, not in TL context)

This is NOT a failure of the blackboard design — it is a correct description of what
the blackboard does vs what the Synthesizer does with it. The schema is the alignment
layer; transcripts are the evidence layer. The Synthesizer bridges both. TL sees only
the decision artifact from the Synthesizer — still zero raw member content in TL context.

**Position update:** schema grows to 8 fields (`peer_delta` split into `peer_engaged` +
`peer_delta`). Synthesizer behavior rule: always reads transcripts for evidence selection
and confidence validation, uses schema fields for alignment counting only. Core shape
unchanged — blackboard + Synthesizer + zero TL content load remains correct.

---

## Peer Answer Received — Pragmatist (arrived post-HALT; recorded only, no reply sent per TL instruction)

**Pragmatist's net ceremony cost assessment:**

Adds vs pragmatist's design:
- Schema compliance discipline on members — new failure surface. Done-signal channel
  adds ~40 tokens total (4 x ~10 tokens); marginal.

Removes vs pragmatist's design:
- TL committee-analysis authoring — if the Synthesizer output is the designer-ready
  artifact directly, one more TL authoring step is eliminated. Genuine win.

**Pragmatist's key challenge — schema drift:** prior session evidence shows consolidator
output drifted 5-7x past its spec; digest content drifted past single-sentence fields.
A schema under deliberation load will drift the same way. If enforcement is soft (text
prohibition only), the saving disappears.

Pragmatist's alternative: freeform transcripts + Synthesizer extraction avoids schema
compliance risk entirely, at the cost of retaining TL committee-analysis authoring.
Lower ceiling, lower risk.

**My response to schema-drift concern:**

Schema drift converts from a silent failure to a detectable and recoverable one via a
schema validator step:

Before the Synthesizer dispatch, a schema validator (zero reasoning, pure structural
check) scans each blackboard entry for field presence and character-count compliance,
writes a `malformed: [member list]` flag to disk. The Synthesizer reads this flag first:
clean entries are processed from the blackboard; malformed entries trigger selective
transcript reads. Drift degrades to the freeform-transcript path automatically — bad
synthesis is impossible, only a slower path.

The validator is the cheapest possible agent: no tool calls, no reasoning, just a format
check. It prevents schema drift from becoming a synthesis failure. Schema compliance
becomes self-healing, not a hard dependency.

**Position update:** add schema validator step before Synthesizer dispatch. Blackboard +
validator + Synthesizer + zero TL content load remains the correct shape. Pragmatist's
ceiling/risk framing is correct; the validator converts "silent drift → bad synthesis"
to "drift → detectable → transcript fallback," which is acceptable risk.

<!-- created-at: 2026-06-06 -->
<!-- role: innovator -->
<!-- round: 02 -->
