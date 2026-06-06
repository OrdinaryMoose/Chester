# Researcher Findings — Round 02
# Sprint: 20260606-01-update-committee-context-management
# Role: Researcher
# Date: 2026-06-06
# Phase: DESIGN SUPPORT — full TL context inventory + prior-art survey

---

## 1. Full TL Context Inventory — Every Channel, Ranked by Size

**Source:** `9ee0b01b-af64-4c7b-9840-1027f48414c5.jsonl` (the 20260604-02 FixStart session).
Session span measured: post-compaction-1 (line 272, ~49,822 tokens) through compaction-2
(line 856, 347,339 preTokens). Total growth: **~297,000 tokens across 4 rounds of actual
committee work** (rounds 02–05; round01 was pre-compact).

All sizes are measured or derived from JSONL. Token estimates: chars ÷ 4.

---

### Channel 1 — Teammate messages received (digests + updates + subagent findings)

**Measured total: ~101,619 chars / ~25,400 tokens across 36 full-content blocks.**

These arrive as `<teammate-message>` injections into the TL's user turn. They accumulate
permanently in context — each message received adds to every subsequent turn's input.

Sub-breakdown:

- **Per-round member digests + updates.** Members sent not just 6-field digests but also
  revision updates, peer-response updates, and final-position updates. In rounds 02–04:
  ~5–8 content blocks per round per member. Avg block: 2,822 chars / ~705 tokens.
  - Round02: ~11 content blocks, ~16,700 chars / ~4,175 tokens received
  - Round03: ~12 content blocks, ~26,600 chars / ~6,650 tokens received
  - Round04: ~10 content blocks, ~22,000 chars / ~5,500 tokens received
  - Round05: ~3 digest blocks + plan-attacker (10,025 chars) = ~22,000 chars / ~5,500 tokens

- **Idle notification summaries (peer-DM signal traffic).** Pure idle JSON with summary
  fields, ~108–246 chars each. ~30+ idle notifications received. Individually small
  (~30–60 tokens each); cumulative: ~9,000 chars / ~2,250 tokens.

- **Consolidator confirmation digests.** Each consolidator sends a short confirmation DM
  (~1,500–1,800 chars / ~375–450 tokens per round) rather than reading consolidator-output.md.

- **Named subagent findings digests** (plan-attacker: 10,025 chars / ~2,506 tokens).

**Key finding:** The protocol specifies 6-field digests (~50–80 words = ~250–400 chars
each). If all 20 member digests (5 members × 4 rounds) were protocol-compliant, total
digest context = ~7,500 tokens. Measured actual: ~25,400 tokens (3.4× protocol spec).
Members sent multiple content blocks per round (initial + peer-update + final revision).
The "digest" channel is ~3.4× the protocol's intended size.

---

### Channel 2 — In-context authoring (TL writes artifacts in context)

**Estimated: ~50,000–80,000 tokens across the session.** Not directly measurable from
JSONL (output tokens don't persist in cache_read; they stay in conversation history).

Files written by TL in-context (measured from JSONL tool calls):

| Artifact | Bytes | ~Tokens | Round |
|---|---|---|---|
| draft-spec.md | 8,059 | ~2,014 | 02 |
| spec-00.md (final, iterative edits) | 15,367 | ~3,841 | 03 + fidelity |
| draft-plan.md | 8,143 | ~2,035 | 04 |
| ledger.md (running, updated per round) | 5,799 | ~1,449 | all |
| handoff.md | 11,958 | ~2,989 | 05 |
| committee-analysis.md (each round) | ~5,000 est | ~1,250 | each |

**Total on-disk TL-authored artifacts (measured): ~55,000 bytes / ~13,750 tokens.**
But authoring cost in context = the full conversational thread of thinking + tool calls +
edit confirmations that produced each artifact. The spec-00.md alone required 10 Edit
calls (lines 519, 522, 526, 530, 539, 543, 546, 554, 557 etc.) — each edit turn adds
context. Conservative estimate for authoring channel: 3–5× the artifact size in actual
context consumed (thinking, tool-use, confirmation round-trips).

**Authoring is the dominant un-offloaded channel.** Round04 alone grew +57,812 tokens
while producing draft-plan.md (8,143 bytes). The 57k growth cannot be explained by
artifacts received (~5,500 tokens in member messages + ~2,500 convening echoes = ~8k).
The ~50k gap = in-context drafting overhead.

---

### Channel 3 — Source reads during drafting

**Estimated: ~12,000–16,000 tokens** from measured file reads.

Files read by TL into context (from JSONL tool calls):

| File | Chars | ~Tokens | Purpose |
|---|---|---|---|
| skill-index.md | 5,149 | ~1,287 | setup |
| design-00.md | 5,547 | ~1,386 | design brief read-back |
| committee-analysis-01.md | 25,681 | ~6,420 | round01 record read (large) |
| spec-00.md (draft) | 16,397 | ~4,099 | spec read for spec-fidelity review |
| MEMORY.md | 667 | ~166 | memory recall |

Total measured reads: ~53,400 chars / ~13,350 tokens. These are ONE-TIME reads
(file content added to context once, stays forever).

**Note:** The committee-analysis-01.md read (25,681 chars / ~6,420 tokens) was a
single large source read that added 6,420 tokens in one turn. Source reads are
unbounded — the TL reads whatever it needs to draft artifacts.

---

### Channel 4 — Convening messages (sent + echo-back)

**Measured: ~38,608 chars sent across 4 rounds (20 SendMessage calls to members).**
Each SendMessage call echoes its full content back in the tool_result. Total echo-back:
~9,650 tokens (chars ÷ 4).

Per round:
- Round02: 5 messages, 11,418 chars total / ~2,854 tokens echo-back
- Round03: 5 messages, 9,756 chars total / ~2,439 tokens echo-back
- Round04: 5 messages, 10,081 chars total / ~2,520 tokens echo-back
- Round05: 5 messages, 7,353 chars total / ~1,838 tokens echo-back

**Caveman ultra compression is active.** Messages are already short-form. This channel
is bounded and predictable (~2,000–3,000 tokens per round).

---

### Channel 5 — Consolidator output (read from disk per round)

**Measured from consolidator-output.md files on disk:**
- round01: 3,266 bytes / ~816 tokens (spec-compliant)
- round02: 20,969 bytes / ~5,242 tokens
- round03: 23,369 bytes / ~5,842 tokens
- round04: 16,612 bytes / ~4,153 tokens
- round05: 21,423 bytes / ~5,355 tokens

Rounds 02–05 average: **~5,148 tokens per round** for consolidator output read back.
Total across 4 rounds: ~20,600 tokens.

Note: consolidator output is READ by TL from disk (Read tool call, adds full file to
context). The read result stays in context permanently.

---

### Channel 6 — System prompt + skill files (baseline overhead)

**Estimated: ~35,000–50,000 tokens** (present at session start, before any committee work).
Includes: SKILL.md, team-lead.md, member-protocol.md, util-design-partner-role, agent
files for 5 members, session-start CLAUDE.md content, Chester config. This is fixed
overhead per session — not reducible by committee redesign.

Post-compact1 context started at ~49,822 tokens = system prompt + session state.

---

### Channel 7 — Ledger + round-folder reads (rehydration)

**Estimated: ~3,000–5,000 tokens** total. The ledger is ~1,449 tokens (measured). Round
folder reads on demand are bounded. Small channel.

---

### Summary: Ranked by Size

| Rank | Channel | Estimated tokens (4-round session) | Offloadable? |
|---|---|---|---|
| 1 | In-context authoring (draft-spec, draft-plan, spec edits, committee-analysis, ledger) | ~50,000–80,000 | YES — scribe or pre-draft |
| 2 | Teammate messages received (member digests/updates + plan-attacker) | ~25,400 measured | PARTIAL — digest enforcement reduces updates |
| 3 | System prompt + skill files (baseline) | ~35,000–50,000 | NO — fixed |
| 4 | Source reads during drafting | ~13,350 measured | PARTIAL — scribe reads instead |
| 5 | Consolidator output reads | ~20,600 measured | PARTIAL — pointer-only confirmation |
| 6 | Convening message echo-back | ~9,650 measured | MINIMAL — already caveman |
| 7 | Ledger + round-folder reads | ~3,000–5,000 | NO — ledger is the designed minimum |

**Top 3 by size (ranked):**
1. In-context authoring (~50k–80k, dominant, 63% of gap above baseline)
2. Teammate messages received (~25k measured, 3.4× over protocol spec)
3. System prompt / baseline (~35k–50k, fixed — not reducible by redesign)

---

### Per-Round Context Growth

| Round | Growth | Primary driver |
|---|---|---|
| round01 (validate) | +35,441 | Setup + 5-way dispatch + member messages |
| round02 (DEVELOP spec) | +34,517 | Member messages + draft-spec authoring |
| round03 (ATTACK spec) | +76,280 | Member messages + spec edits + fidelity review |
| round04 (BUILD plan) | +57,812 | Member messages + draft-plan authoring |
| round05 (ATTACK plan) | +67,109 | Member messages + plan-attacker findings + handoff |

Rounds 03–05 each added 57k–76k tokens. Authoring + received content dominate.

---

## 2. Prior Art — Context-Minimization Patterns for Multi-Agent Systems

Research scope: industry literature, arxiv (2024–2025), general knowledge.
For each: what it is, how it cuts context, the cost.

---

**Pattern 1 — Blackboard / Shared-Store Architecture**

What: All agent interaction goes through a shared persistent store (the "blackboard").
Agents write to and read from the store; they do not message each other directly. The
orchestrator reads only the blackboard state, not individual agent histories.

How it cuts context: Orchestrator context = blackboard state only (structured, bounded).
Per-agent outputs are entries in a store, not streamed into the coordinator's thread.
Agents monitor only their relevant segments. Selective engagement — only active agents
interact, others idle without adding to coordinator context.

Cost: Requires a shared write-accessible store; coordination discipline is harder to
enforce (any agent can write to any segment). Convergence requires explicit flagging
(agents mark entries as "settled" or "contested"). Read-on-demand adds latency.

Recent evidence: LLM-based Multi-Agent Blackboard System (bMAS, arxiv 2510.01285) and
AISAC (arxiv 2511.14043) show blackboard decouples agents from each other's reasoning
context, enabling scalable collaboration without prompt inflation.

**Context saving in Chester's case:** If member digests wrote to a shared store instead
of messaging TL, TL reads one structured summary per round rather than 5+ messages.
Estimated saving: ~20,000 tokens/round in received messages.

---

**Pattern 2 — Reference-Not-Content (Pointer Passing)**

What: Agents pass only a pointer (file path, ID, hash) to their output, not the content
itself. The consuming agent reads on demand if needed.

How it cuts context: The channel carries ~50–100 bytes (path/ID) rather than the full
artifact. Consuming agent only reads when it actually needs the content, and can skip
reading if the pointer plus a one-line summary is sufficient.

Cost: Consuming agent must make an explicit read call (latency). Read-on-demand means
consuming agent's context includes what it actually reads — deferral, not elimination.

Existing in Chester: The consolidator confirmation DM is already pointer-passing
("consolidator output written to [path]" — ~1,500–1,800 chars). Protocol spec's
"Transcript path" field is a pointer.

Gap: Member digests still pass full content (not just pointers). Consolidator output
is read back in full (not pointer-only).

**Context saving:** If consolidator confirmation = pointer only (no summary content),
saving ~400 tokens/round. If member digests = pointer only (transcript path + 6-field
header only), saving ~20,000 tokens across 4 rounds.

---

**Pattern 3 — Schema-Constrained / Enum-Based Message Signaling**

What: Agents communicate via structured typed messages (JSON schema, enum fields, integer
codes) rather than natural language. A "position" message might be:
`{"member":"conservator","vote":"option-A","confidence":0.9,"top_risk":"X"}` rather than
a paragraph. The coordinator aggregates fields, not prose.

How it cuts context: Structured fields are 10–50× smaller than equivalent NL prose.
Voting/position data fits in ~100–200 bytes. Coordinator accumulates a vote table, not
a digest thread. Alignment detection = field comparison, not synthesis.

Cost: Members lose nuance; no room for the "why" behind a vote. Coordinator can't
surface subtleties to designer without a separate read of the transcript. Works best
when the decision is binary/categorical, not nuanced.

Research: S²-MAD (sparsified multi-agent debate) reduced token costs by 94.5% with
minimal accuracy loss by constraining agent exchanges to structured updates (arxiv
2510.12697 area). ELHPlan's Action Chains reduced usage to 24% of prior methods.

**Context saving in Chester:** A per-round position record (vote + option + top trade-off
field) = ~100 tokens per member per round (vs ~705 avg for current content blocks).
4 rounds × 5 members = 20 structured messages = ~2,000 tokens (vs ~25,400 measured).
Saving: ~23,400 tokens. Trade-off: no room for rich reasoning; designer loses texture.

---

**Pattern 4 — Map-Reduce / Hierarchical Consolidation**

What: Fan-out (map): N parallel agents each produce a scoped output. Fan-in (reduce):
a single reducer reads all N outputs and produces ONE compressed summary. The orchestrator
reads only the reducer's output.

How it cuts context: Orchestrator context = one reducer output, not N full outputs.
The Chester consolidator IS this pattern for transcripts. The gap: consolidator output
has drifted to 5k tokens (5× over spec) and digests bypass the reducer entirely.

Cost: Reducer quality bottleneck — bad reducer loses signal. Round-trip latency.

**Context saving:** Enforcing the consolidator spec (452 words / round01 shape) would
reduce the consolidator-output read from ~5k tokens to ~450 tokens per round.
Saving: ~4,700 tokens × 4 rounds = ~18,800 tokens. Combined with routing-only digests
(see Pattern 2), the consolidator becomes the primary TL-context-facing channel.

---

**Pattern 5 — Append-Only Shared Document with Agent Attribution**

What: A single document that all agents write to sequentially (append-only, no history
rewrite). Each agent appends its position/finding with attribution. The orchestrator
reads the entire doc once per round, not N separate messages.

How it cuts context: Orchestrator receives one Read call per round (doc grows linearly).
No separate message-passing overhead. Convergence visible as the doc evolves.

Cost: Shared-write coordination (two-writer race if not serialized). Document grows
across rounds (not bounded per round). Orchestrator still reads the full doc per round
(but only once, not 5 separate messages).

Evidence: CodeCRDT (arxiv 2510.18893) uses append-only audit trails for multi-agent
coordination with causal ordering. Google Developers Blog (2025) notes shared-doc
patterns for context-aware multi-agent frameworks reduce inter-agent communication
overhead from 73% to 24% of system resources.

**Context saving in Chester:** One shared-doc read per round (~5k tokens) vs 5 separate
digest messages (~25k tokens across session). Saving: ~20,000 tokens across 4 rounds.

---

**Pattern 6 — Progressive Summarization (Context Compression on Pass-Through)**

What: As output moves between agents or rounds, each pass compresses the accumulated
state. A summarizer agent reduces prior-round context to a compact state object before
the next round begins.

How it cuts context: Context size per round = compressed prior state + current round
inputs, not all prior rounds. Documented 65–80% token reduction on inter-agent
communication (Augment Code research, 2025).

Cost: Lossy compression — nuance lost at each summarization step. Requires a
compressor agent per round boundary. Summary quality determines next round's info.

**Context saving in Chester:** The ledger IS a manual version of this — it compresses
prior round state to ~1,449 tokens. The gap: the conversation thread itself is not
compressed (only the ledger file is). A compressor agent per round could reduce the
TL's conversation-thread overhead, but the Chester harness doesn't support mid-thread
compaction without a manual /compact.

---

**Pattern 7 — Coordinator-Specialist Scoping (Context Window Budgeting)**

What: The coordinator explicitly scopes what each specialist receives — only the current
query plus one artifact, suppressing ancestral history. Each specialist context = scoped
input only, not full session history.

How it cuts context: Specialist agents stay cheap (scoped context). Coordinator stays
lean (never inherits specialist's full context). No "shoveling" of raw history.

Cost: Coordinator must actively filter what passes to each specialist. Context assembly
cost on coordinator side.

Evidence: Augment Code (2025): "When one agent invokes another, you can explicitly scope
what the callee sees — perhaps just the latest user query and one artifact — while
suppressing most ancestral history." Google (2025): coordinator-specialist prevents
any single agent from accumulating the full workflow history.

**Chester already does this:** Named subagents (Consolidator, plan-attacker, plan-smeller)
do not inherit TL context. The gap is inbound (member messages arriving at TL), not outbound.

---

**Pattern 8 — Tool-Response Filtering (Payload Reduction at Source)**

What: Filter tool responses at the call site before returning to the calling agent.
Instead of returning a 50-field JSON object, return only the 3–5 relevant fields.

How it cuts context: Documented 80–90% payload reduction per tool call (Augment Code,
2025). If a file read returns only the relevant section, not the full file, context
impact is bounded.

Cost: Filtering logic needed per tool type. Over-filtering loses needed context.

**Chester application:** The consolidator currently reads full member transcripts (large)
but its output (enumerate-only) is the filter. The gap: consolidator output itself has
drifted to 5k tokens — the consolidator is supposed to be the filter but hasn't been.
Separately: the TL's Read calls (committee-analysis-01.md = 6,420 tokens) are unfiltered
full-file reads. Scoped reads (offset + limit) would reduce source-read overhead.

---

**Pattern 9 — Token Coherence / MESI-style Cache Coordination**

What: Apply cache invalidation semantics to multi-agent shared state. An agent only
re-reads a shared artifact if it's been marked "modified" since last read; otherwise
uses its cached understanding.

How it cuts context: Redundant re-reads of unchanged state eliminated. Agents track
version/hash of artifacts they've read; only fetch diffs on modification.

Cost: Requires versioning infrastructure; adds complexity for non-trivial coherence cases.

Evidence: Token Coherence paper (arxiv 2603.15183) adapts MESI cache protocols to
minimize synchronization overhead in multi-agent LLM systems.

**Chester application:** Low direct applicability — TL reads artifacts once (not
repeatedly). More relevant if cross-round re-reads of the spec or plan become common.

---

**Pattern 10 — Voting + Elimination (Convergence Without Central Synthesis)**

What: Structured voting eliminates options progressively. Round 1: each agent votes
for/against all options. Any option below threshold is eliminated. Round 2: remaining
options. Converges without any agent holding all positions simultaneously.

How it cuts context: No synthesis needed — the vote table IS the alignment signal.
Coordinator sees a matrix, not prose. No one agent holds N full positions.

Cost: Works for categorical choices only. Nuanced design questions resist clean voting.
Majority voting unreliable when agents share biases (2025 ACL, Kaesberg et al.).

Evidence: "Voting or Consensus? Decision-Making in Multi-Agent Debate" (ACL 2025,
aclanthology.org/2025.findings-acl.606.pdf). Multi-agent debate with adaptive stability
detection (arxiv 2510.12697) uses structured convergence signals.

**Chester application:** Useful for "which option" questions (2-option votes), not for
open-ended design questions. Could replace the 6-field digest for categorical decisions.

---

## 3. Convergence Mechanisms — Reaching a Single Answer Without Central Synthesis

How multi-agent systems converge without one agent holding everything:

**Structured voting (majority/plurality):** Agents cast typed votes; coordinator tallies.
Context cost: vote-table size (O(N options × N members) — very small). Loses nuance.
See Pattern 10 above.

**Iterative refinement on shared doc:** Agents read the same doc, append amendments.
Convergence = no new amendments appended. Context cost: doc grows linearly per round.
See Pattern 5. Convergence signal is doc stability, not explicit vote.

**Confidence-weighted aggregation:** Each agent returns (position, confidence_score).
Aggregator uses weighted average. Context cost: one score per agent (tiny). Loses
minority positions. Works for quantitative estimates, not design questions.

**Iterative elimination / tournament bracket:** Start with all options; each round
eliminates the weakest (lowest vote share or explicitly rejected by majority). Converges
to one option in O(log N) rounds. Context cost: low per round (eliminated options
disappear). Requires categorical options upfront.

**Judge/scorer agents:** A separate judge agent reads all positions and applies a
scoring rubric to pick the winner. Context cost: judge's context = N full positions
(same as TL consolidation). Judge does the synthesis; TL receives only the ruling.
Moves synthesis off TL thread but doesn't reduce total work.

**Peer revision until quiescence:** Members revise until no member changes position
(fixed-point). Context cost: number of revision rounds is unbounded; in practice 1–2
peer exchanges (current Chester one-round-format already does this). Convergence signal
is "position unchanged after peer Q&A."

**Blackboard quorum marking:** Each member marks their position "settled" on the
blackboard when peer exchanges are complete. Quorum = all settled. Coordinator reads
one summary per member (not the full history). See Pattern 1.

---

## Summary of Key Numbers

| Metric | Value |
|---|---|
| Peak TL context (round05 end) | 346,692 tokens |
| Session start after compact | 49,822 tokens |
| Growth across 4 rounds | ~297,000 tokens |
| Largest single-round growth | +76,280 tokens (round03) |
| Teammate messages received (total) | ~25,400 tokens (measured) |
| If digests were protocol-compliant | ~7,500 tokens (3.4× overage) |
| In-context authoring channel (estimated) | ~50,000–80,000 tokens |
| Consolidator output per round (rounds 02–05 avg) | ~5,148 tokens |
| Convening message echo-back per round | ~2,400 tokens |
| Baseline system prompt + skills | ~35,000–50,000 tokens |

**Top 3 TL context inputs by size:**
1. In-context authoring (draft-spec, draft-plan, committee-analysis, spec edits) — ~50k–80k tokens, dominant, only partially captured in on-disk artifacts
2. System prompt + skill file baseline — ~35k–50k tokens, fixed
3. Teammate messages received (digests + updates + subagent findings) — ~25k tokens measured, 3.4× over protocol spec

**Best 3 prior-art patterns by context saving:**
1. Schema-constrained / enum signaling — ~23,400 token saving vs current digest practice (replaces ~705-token avg content blocks with ~100-token structured records)
2. Reference-not-content (pointer passing) — ~20,000 token saving if digests become path+summary-line only (+ consolidator enforcement)
3. Map-reduce enforcement (consolidator cap at spec) — ~18,800 token saving across 4 rounds if consolidator output held to 452-word round01 ceiling

Transcript path: `committee/round02/researcher-findings.md`

<!-- produced-by: researcher / round02 / 2026-06-06 -->
