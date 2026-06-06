# Innovator Transcript — Round 03
# Sprint: 20260606-01-update-committee-context-management
# Role: Innovator
# Date: 2026-06-06
# Phase: GENERATE — clean slate, no inherited assumptions

---

## Starting Position: What the Evidence Forces

The researcher's data is decisive on one point: **in-context authoring (~50-80k tokens) is
the dominant channel**, not member digests (~25k measured). Any design that optimizes only
for digest compression while leaving the TL as author recovers maybe 35% of the problem.

The second decisive point: the consolidator has inflated 6x from round01 (816 tokens) to
round02-05 average (5,148 tokens). This is not a discipline failure — it's a signal that
the consolidate/synthesize role boundary is unstable under real conditions. When a
consolidator starts synthesizing (because the positions are complex and enumeration alone
doesn't make sense), it crosses the line. The role boundary can't hold under real pressure.

These two facts together drive the innovator proposal.

---

## The Core Claim: Collapse Consolidate+Synthesize, Offload Author

The four roles (consolidate, synthesize, converge, author) assume a particular architecture:
sequential handoffs from members → consolidator → synthesizer → convergence driver → author,
with the TL reading from each stage. But the data shows this doesn't hold:

- Consolidate and synthesize **merge in practice** (consolidator output drifted from
  enumerate-only to full positional analysis)
- The TL **re-reads and re-synthesizes** anyway when authoring (hence the 50-80k authoring
  cost — it's not just writing, it's thinking through the positions again)
- The member → TL digest channel **blew past spec** (3.4x over) because members can't
  self-enforce a 6-field digest when they have 10 things to say

The innovator move: **one shared blackboard document** handles consolidate+synthesize
(members write to it, not to the TL); **one author-agent** handles drafting (scoped context,
not TL thread); **convergence is a blackboard property** (quorum signal, not a driver role);
**the TL owns only dispatch and judgment**.

---

## Proposed Architecture: Blackboard + Scoped Author

### The Blackboard Document

Each round, a single shared document exists at a known path:
`committee/round-NN/blackboard.md`

Structure (template, fixed per round):

```
## Round NN Blackboard
### Question posed: [TL pastes the round question here at round start]

### Member Positions (append-only, one section per member)
#### [member-name]
- Option preferred: [A/B/C/...]
- Confidence: [high/medium/low]
- Top reason FOR: [1 sentence]
- Top reason AGAINST alternatives: [1 sentence]
- Settled: [yes/no — member sets to yes when done with peer exchange]

### Peer Exchange Log (append-only)
[member-to-member Q&A goes here, brief, attributed]

### Convergence Signal
[Set by members collectively: "QUORUM: [option]" when all settled on same, or "SPLIT: [options]" when not]
```

**Size target:** 1,500-2,500 tokens total per round (5 members × ~200 token position block
+ peer exchange log + convergence signal). Versus current: ~25k from separate member digests
+ consolidator output combined.

**Members write directly to the blackboard.** No member-to-TL digests. No consolidator.
Members append their position section, read each other's sections, run peer exchange in the
peer-exchange log, then flip their Settled flag.

**TL reads the blackboard once per round** (Read tool call, ~2k tokens). Not 5 separate
digest messages. Not a consolidator output.

---

### Role Analysis Under This Design

#### CONSOLIDATE
**Owner: Eliminated as a separate role.**

Rationale: The consolidator's job was to read N member transcripts and produce one summary
for the TL. Under the blackboard design, members write structured positions directly — there
is no raw transcript pile to consolidate. Each member's contribution is already structured
at write time. The "consolidation" happens at member write discipline, not in a post-hoc
aggregation step.

R1-R4 fit: R3 (minimize context) gains directly — no consolidator output read (saves ~5k
tokens/round). R4 (retain meaning) holds because members write their own positions in
structured form; no interpretation loss from a consolidator proxy. R1 (converge) unaffected
— consolidation was never the convergence mechanism anyway.

**Tradeoff:** Members must write to a shared file simultaneously. Race condition risk on
concurrent writes. Mitigation: members write sequentially (TL dispatches in a round-robin
or members self-sequence by name alphabetically). OR: the TL collects one-line structured
DMs per member (strictly schema-constrained, ~100 tokens each) and pastes them into the
blackboard itself before authoring. The latter moves the consolidation cost back to TL but
keeps it bounded (~500 tokens for 5 members, vs current ~5k from consolidator output read).

**Decision fork (see below):** blackboard-write-by-members vs TL-collects-structured-DMs.

---

#### SYNTHESIZE
**Owner: Eliminated as a separate role.**

Rationale: Synthesis — mapping positions to an alignment state + option set — is embedded
in the blackboard's convergence signal section. Members collectively produce the alignment
map as a byproduct of peer exchange. By the time all Settled flags are flipped, the
Convergence Signal section contains the option set and alignment state.

This is not elimination by wishful thinking. It works because:
- The Convergence Signal is written by members after they've read each other's positions
- Peer exchange disambiguates contested areas inline
- The TL reads the signal section first (cheap) before deciding whether to read full
  position sections

R3 fit: Synthesis was previously an implicit TL operation (TL read consolidator output and
mentally synthesized to produce the spec). That mental synthesis was part of the ~50-80k
authoring cost. Moving it to the blackboard makes it explicit and cheap.

R4 risk: If members write a bad Convergence Signal (mischaracterizing the alignment state),
the TL loses fidelity. Mitigation: the TL can read the full position sections when the
Convergence Signal is ambiguous — this is the "read-on-demand" pattern. Most rounds, the
signal is clear.

---

#### CONVERGE
**Owner: Members collectively, via blackboard quorum.**

Mechanism: Convergence is defined as "all Settled flags = yes AND Convergence Signal = QUORUM."
This is detectable without a driver agent. If not all settled after one peer-exchange round,
the TL can issue a second peer-exchange prompt targeting only the unresolved split.

**Team-lead-owns alternative:** The TL could own convergence by reading the blackboard,
identifying the split, and issuing a targeted prompt: "Conservator and Purist disagree on X.
Each give your final position in one sentence." This adds one TL round-trip (~2k tokens
incoming + ~1k dispatch) but guarantees convergence on any question.

**Honest comparison:**
- Members-collectively: zero TL context cost for convergence when quorum is natural. Cost is
  non-zero when split persists (TL reads split, issues targeted prompt).
- TL-owns-convergence: always 1 extra round-trip (~3k tokens), but predictable and simple.
  No risk of "split persists silently."

**Recommendation:** Members-collectively as the primary mechanism, with TL-owned explicit
convergence as the fallback trigger. The TL decides to trigger only when reading the blackboard
shows SPLIT. This keeps TL convergence cost = 0 when natural quorum occurs, bounded when not.

---

#### AUTHOR
**Owner: Dedicated author-agent (scoped context).**

This is the highest-value offload. The ~50-80k in-context authoring channel is the dominant
cost. The TL writing spec and plan inside its own thread is the single biggest driver.

**Scoped author-agent design:**
- Input: blackboard.md (current round) + artifact template + prior artifact draft (if any)
- No TL thread context
- Output: writes draft artifact to disk, sends TL a pointer DM ("draft-spec written to [path]")
- TL reads for judgment review (scoped read, maybe 3-4k tokens for the artifact) and either
  approves or sends targeted revision notes back to author-agent

**Context saving:** The full authoring conversational thread (thinking + tool calls + edit
confirmations) stays in the author-agent's context, not the TL's. The TL's contribution is
limited to judgment review (~3-4k tokens to read the draft + ~200 token revision note if needed).

**R4 risk assessment:** The core concern is whether the author-agent, lacking the TL's full
session history, produces an artifact that loses meaning. The researcher data helps here: TL
read the full consolidator output before authoring (it's in the tool-call sequence). This
means the TL's authoring input was primarily the consolidator output, not the full session
thread. An author-agent with the blackboard (which is richer than the old consolidator output)
plus the round question should be able to produce equivalent quality.

**Critical caveat:** The FIRST round's artifact (spec draft from a design brief) requires
reading the design brief. The author-agent needs this as input. The TL passes the design
brief path as a scoped read to the author-agent's dispatch message. No TL-thread read needed.

**Ledger:** The running ledger is a lightweight artifact (~1,449 tokens measured). The TL
can continue to maintain this in its own thread — it's the cheapest possible write and provides
cross-round memory. Alternatively, the ledger becomes a section of the blackboard (persistent
state carries forward). Either works.

---

## Decision Fork: How Members Write to Blackboard

Two options exist:

**Option A — Members append directly to shared file**
- Each member runs a Read+Edit sequence on blackboard.md
- Peer exchange appended to the Peer Exchange Log section
- TL reads blackboard once at round end

Tradeoff: Concurrent write risk (two members Edit same file simultaneously). Mitigation:
TL dispatches sequentially (not all-at-once). But sequential dispatch serializes the round,
adding latency. OR: TL dispatches all-at-once and members self-serialize by name order.

**Option B — Members DM structured schema, TL assembles blackboard**
- Each member sends TL one structured DM: 5 fields, ~100 tokens each
- TL assembles blackboard from 5 DMs (cheap: paste + format, ~500 tokens of TL work)
- Peer exchange still written to shared file (second member pass)

Tradeoff: TL does assembly work (cheap but not zero). Members still DM TL, just schema-
constrained. Total DM cost: 5 × 100 tokens = 500 tokens (vs current ~25k). Consolidator
eliminated. Assembly is cheap in-context work (paste, not think).

**Recommendation: Option B for first position, Option A for peer exchange.**
- Position collection: structured DMs → TL assembles → writes blackboard positions section
- Peer exchange: members append directly to blackboard (self-serialize by name)
- Convergence signal: last member to settle writes the signal

This hybrid captures most savings while avoiding race conditions on the most contested write
(initial position = highest collision risk; peer exchange = sequential by nature).

---

## Channel Format Spec

### Member → TL (initial position DM, Option B)
```
Position / [member-name] / Round [NN]
Option: [label]
Confidence: [H/M/L]
For: [1 sentence]
Against: [1 sentence, alternatives]
```
Size: ~80-120 tokens per member. 5 members = ~500 tokens total TL-received.

### Member → Blackboard (peer exchange, Option A for second pass)
```
[member-name] → [target-member]: [question or challenge, 1-2 sentences]
[target-member]: [response, 1-2 sentences]
```
Size: ~100-200 tokens per exchange. 3-5 exchanges per round typical = ~500-1000 tokens added
to blackboard peer-exchange log.

### Author-agent → TL (completion pointer)
```
Draft written: [path]
Size: [N tokens est.]
Judgment needed: [approval / [specific question if uncertain]]
```
Size: ~50 tokens. TL reads artifact at ~3-4k tokens. Revision note from TL: ~100-200 tokens.

### TL → Author-agent (revision, if needed)
```
Revise [artifact]:
[specific point 1]
[specific point 2]
```
Size: ~100-200 tokens.

### Blackboard → TL (round-end read)
Full blackboard read: ~1,500-2,500 tokens.

---

## Convergence Mechanism: How R1 Is Achieved

1. Members write positions (Option B: DMs → TL assembles blackboard positions section)
2. Members read each other's positions on the blackboard, run peer exchange in the log
3. Members flip Settled flag and write Convergence Signal collaboratively
4. TL reads blackboard. If QUORUM: dispatch author-agent with blackboard path. If SPLIT:
   TL issues targeted convergence prompt to split members (e.g., "Conservator and Purist:
   one-sentence final position on X"). Members reply via DM (~100 tokens each). TL resolves
   and writes final signal. Author-agent dispatched.

This achieves R1 without a dedicated convergence driver. The TL's judgment IS the convergence
driver in split cases — this is appropriate because the TL is doing dispatch+present anyway,
and convergence judgment requires designer-facing authority that members don't have.

**Why no dedicated CONVERGE agent:** A dedicated converger agent adds context (its own thread)
and latency (another dispatch cycle) without adding capability that the TL doesn't already
have. The TL's "converge" role in split cases is bounded (one targeted prompt, ~200 tokens
dispatch + ~200 tokens incoming = ~400 tokens), which is far cheaper than a dedicated agent
that would need to read all positions before driving convergence.

---

## Honest Assessment of Team-Lead-Owns-Cheaply

The dispatch requires examining each role against "TL-owns-cheaply (bounded input,
write-evict)" as a live candidate. Here's the honest per-role comparison:

**CONSOLIDATE — TL-owns wins if using structured DMs (Option B)**
TL collecting 5 structured DMs (~500 tokens total) and pasting them into the blackboard is
genuinely cheap. The prior design's consolidator was solving the problem of unstructured
member transcripts. With schema-constrained DMs, the "consolidation" is just formatting work.
TL-owns-cheaply wins here.

**SYNTHESIZE — TL-owns is the authoring tax**
The synthesis happens when TL drafts the artifact. The 50-80k authoring cost IS the synthesis
cost. Synthesis belongs in the author-agent's scoped context, not the TL's thread. TL does not
own synthesis cheaply — the evidence proves it's the dominant channel. Author-agent-owns wins.

**CONVERGE — TL-owns-cheaply wins as fallback**
In quorum cases: free (members converge, TL reads signal). In split cases: TL-owns at ~400
tokens. No dedicated agent is cheaper. TL-owns-cheaply wins.

**AUTHOR — Author-agent-owns wins**
~50-80k in-context cost vs. ~3-4k judgment review cost. The offload value is overwhelming.
This is the one place where adding an agent is clearly correct. Author-agent-owns wins.

---

## Estimated Context Savings

Baseline 4-round session context growth: ~297k tokens.

Under this design:
- Member digests eliminated, replaced by structured DMs: save ~20k tokens (vs current ~25k;
  ~5k remains for 5 × ~100-token DMs × 4 rounds + assembly work)
- Consolidator eliminated: save ~20k tokens (4 rounds × ~5k avg)
- In-context authoring eliminated: save ~40-60k tokens (most of the ~50-80k; TL retains
  judgment review reads ~3-4k per artifact × ~4 artifacts = ~12-16k)
- Blackboard read per round: +8-10k tokens (4 rounds × ~2k blackboard)
- Net saving estimate: ~70-90k tokens across a 4-round session

This leaves ~200-230k tokens of session growth, primarily from:
- System prompt + baseline: ~35-50k (fixed)
- Convening echo-back: ~9k (fixed, already caveman)
- TL judgment reads of authored artifacts: ~12-16k
- Blackboard reads: ~8-10k
- Ledger + round reads: ~3-5k

From 347k peak to estimated ~230k peak — a ~33% reduction in peak context.

---

## What This Doesn't Solve

- System prompt baseline (~35-50k) — fixed, not reducible by committee redesign
- Convening echo-back (~9k) — already caveman, minimal further gain
- Round-growth rate: with authoring offloaded, per-round growth drops dramatically but
  sessions with more rounds (8+ rounds) would still compound
- Skill inflation: if the author-agent itself inflates (writes badly, requires many revision
  cycles), the judgment-review cost grows. This is a quality-of-author-prompt problem, not
  a structural problem.

---

## Summary

This design collapses four roles into two mechanisms:

1. **Blackboard** — handles consolidate + synthesize via structured member writes
2. **Author-agent** — handles authoring via scoped context dispatch

The TL retains: dispatch, convergence judgment (split cases only), judgment review of
authored artifacts, final designer presentation.

The conceptual shift: the committee's value is in the positions it generates, not in the
processing pipeline between positions and artifact. The blackboard makes positions directly
readable. The author-agent makes processing cheap. The TL stays thin.

---

Transcript path: `committee/round03/innovator-transcript.md`

<!-- produced-by: innovator / round03 / 2026-06-06 -->
