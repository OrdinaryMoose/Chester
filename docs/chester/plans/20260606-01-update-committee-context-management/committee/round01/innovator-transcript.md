# Innovator Transcript — Round 01
# Sprint: 20260606-01-update-committee-context-management
# Role: Innovator
# Date: 2026-06-06

---

## Evidence Grounding (pre-position)

Round05 file sizes from `20260604-02-review-start-context/committee/round05/`:
- Each member transcript: ~12-16k bytes (~3-4k tokens each)
- Consolidator output: 21,423 bytes (~5k tokens)
- Named-subagent findings (plan-attacker + plan-smeller): ~14k bytes each
- Full round05 payload if TL read all transcripts: ~67k bytes — NOT reading them is the transcript offload working

The **digest channel** (what actually lands in TL context per round):
- Protocol spec: "one sentence per field, 6 fields" = ~6 sentences per member
- Reality claim from brief: 300-600 words per member
- Five members sending = 1500-3000 words (~2-4k tokens) in TL context per round, per round

The **TL authoring load** (in-context, not offloaded):
- committee-analysis.md per round (Final Recommendation, full Information Packet format)
- ledger.md updates per round
- Consolidator output: 21k bytes read in full per round (but NOT the 4 transcripts)
- Prior rounds' analyses accumulate in context

That's the anatomy of the bloat. Digests are real but measured. Artifact authoring + consolidator output reading are also substantial. The brief correctly identifies that "TL synthesizes from streaming digests before consolidator output lands" means the consolidator serves as a disk record, not a context-reduction mechanism during synthesis.

---

## Position

### (a) Root Cause of TL Bloat

The root cause is **architectural**: the team-lead is designed as the synthesis-and-authorship node in the process. Everything that requires judgment or expression lands in TL context by necessity. This creates three compounding loads:

1. **Digest accumulation.** Five digests per round, each 300-600 words, arrive directly in TL context. The consolidator does not intercept these. Over five rounds = 25 digests = potentially 7,500-15,000 words of direct digest input that passed through TL context (not all retained, but context grows cumulatively).

2. **Artifact authoring.** The TL writes committee-analysis.md, ledger.md, and the designer-facing decision packet every round. These are full-composition tasks done in-context. The output is large; the input (reading the consolidator output, 21k bytes) is also large.

3. **Sequential synthesis timing.** Because the TL synthesizes from digests as they arrive (streaming), the consolidator's enumerate-only output lands AFTER synthesis is already done. This is the critical structural redundancy: the TL does the synthesis work twice — once from streaming digests, once "officially" from the consolidator. The consolidator becomes a disk record, not a context gate.

The core wrong shape: **the TL is a synthesis engine, not a router.** Every synthesis task requires holding context. The consolidator offloads transcript-reading (real win), but leaves the synthesis and authorship surface untouched.

### (b) Which Fix / New Framing Holds, and Why

The three candidate fixes are layered solutions targeting different parts of the bloat:

**Candidate A (routing-only digests)** targets the digest channel. It is correct and necessary, but not alone sufficient. If members send one-line routing pings ("position written, path X"), the TL reads the consolidator output as the single synthesis source. This works IF (critical condition) synthesis is gated on consolidator output — otherwise the TL just synthesizes from less signal and the consolidator still lands post-synthesis.

**Candidate B (gate synthesis on consolidator output)** is the structural fix that makes A meaningful. Without B, A reduces digest volume but the TL still synthesizes early from whatever arrives first, making the consolidator a disk record as before. B forces the consolidator to become the actual synthesis input. B alone (without A) leaves digest volume high; the TL receives 300-600 word digests and then waits to synthesize — context is still loaded with digest content.

**A + B together** form the correct compound fix: minimal signal in (routing pings), single authoritative synthesis source (consolidator output), synthesis gated on that source. This solves the digest channel leak AND the synthesis timing problem simultaneously.

**Candidate C (scribe for artifact authoring)** addresses the third load: the authoring burden. The TL writing committee-analysis.md + the decision packet is the other large in-context task. Offloading to a scribe subagent would require the scribe to receive the consolidator output (off-thread read), draft the committee-analysis.md and decision packet, and the TL to review/adjudicate the draft. The scribe interaction itself adds one message round; but the artifact no longer authors in TL context. This is architecturally sound IF the scribe's output quality is high enough to not require TL rewrite (which reintroduces the content into TL context anyway). C is the most ambitious fix and the hardest to get right without quality regression.

**New framing — TL as pure router:** The three candidates together point at a stronger shape: the TL should NEVER synthesize in-context. All synthesis, all authoring goes to off-thread agents (consolidator for synthesis, scribe for authoring). The TL's in-context work is: send dispatch, receive one-line routing pings, invoke consolidator, invoke scribe, read scribe draft summary (not full text), adjudicate one question with designer, send next dispatch. This is a fundamentally different architecture — TL as router + adjudicator, never synthesizer or author.

The risk of the pure-router shape: the TL needs enough context to adjudicate well. Adjudication requires understanding the options, the split, and the trade-offs. The consolidator output (21k bytes) may be too compressed to support good adjudication, or the TL may need to read selected transcript sections on demand (selective read, not bulk). The pure-router shape works if the scribe's decision packet is written directly to the designer-facing format, and the TL's adjudication is: "does this packet correctly represent the split? sign off or flag a revision." That is a much smaller in-context task than full synthesis and authorship.

**Which combination to recommend:**

A + B must happen — they are low-effort, high-impact, and address the dominant digest channel and synthesis timing problems. C is worth attempting on the scribe as an optional layer once A + B are proven. The pure-router framing is the target architectural end-state if C succeeds.

### (c) Top Trade-Off

Candidate A + B together: **signal quality vs context size.** Routing-only digests reduce TL context at the cost of the TL having less signal before the consolidator lands. If the consolidator's enumerate-only format is too compressed (missing key nuance that digests would surface), TL adjudication degrades. The fix is improving consolidator output quality — not returning to full digests. The trade-off is real but manageable.

---

## Peer Question

DM to researcher: the brief asserts digests "have run 300-600 words" but the protocol spec (member-protocol.md § Digest shape) specifies six single-sentence fields. Is there evidence in the round05 transcripts or messaging records of what members actually sent as digests (vs. what they wrote in their transcripts)? I want to know whether the 300-600 word claim reflects actual digest content or is conflating digest + additional inline argument sent via messaging.

---

## Peer Answer — Researcher Reply

**Question I asked:** Whether the 300–600 word digest claim reflects actual messaging payload or conflates transcript size with digest content.

**Researcher finding:** Absence finding. Actual digest message content from round05 is not recoverable — the team-lead inbox JSON is empty (messages consumed on read, not persisted after). The 300–600 word figure traces to a TL self-report ("those digests are not short — several have been 300–600 words"), not a measured count.

Protocol spec (member-protocol.md § Digest shape) = 6 single-sentence fields ≈ 50–80 words at spec compliance. The claimed gap between 50–80 (spec) and 300–600 (self-report) is 4–12x — but unverifiable.

**Impact on my position:**

This sharpens the diagnosis rather than weakening it. Two scenarios, both point the same direction:

- **If actual digests were ~50–80 words (spec-compliant):** the digest channel is a smaller leak than the brief claims. Dominant loads shift further toward artifact authoring and synthesis timing. A + B are still correct, but the urgency of A is lower and the case for C (scribe) becomes proportionally higher-priority.

- **If actual digests were 300–600 words (spec-violating drift):** the digest channel is the dominant leak, A + B are the most urgent moves. The protocol needs structural enforcement, not just reduction.

Either way, routing-only digests (Candidate A) are correct structural medicine. The uncertainty does not change the fix — it changes whether A or C is the higher-leverage first move. My position stands: A + B as the necessary compound fix, C as the next layer. If digests are currently spec-compliant, C deserves earlier scheduling than I initially weighted it.

<!-- created-at: 2026-06-06 -->
<!-- role: innovator -->
<!-- round: 01 -->
