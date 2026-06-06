# Purist Transcript — Round 01
# Sprint: 20260606-01-update-committee-context-management
# Role: Purist — category boundaries + compositional integrity
# Date: 2026-06-06
# Question: Why does team-lead still eat most per-round context despite the consolidator?
#            What structural change to the committee process actually offloads it?

---

## (a) Root Cause of TL Bloat

The team-lead role, as currently defined in `references/team-lead.md` and `references/member-protocol.md`, conflates four distinct responsibilities:

1. **Router** — dispatches to members via SendMessage; receives digest payloads back.
2. **Synthesizer** — narrates round findings; in practice does so from the streaming digests before the consolidator output lands.
3. **Author** — writes every artifact: committee-analysis.md, ledger updates, draft-spec, draft-plan.
4. **Adjudicator** — presents options to designer; holds recommendation opinion.

The consolidator addresses only the transcript-reading surface: it reads full member transcripts off-thread so the TL never holds those. That offload is real. But it does nothing about the other three surfaces.

The dominant context leak is the digest channel. Per `references/member-protocol.md § Digest shape`, digests carry six named fields — the brief form states "one sentence" per prose field, but the dispatch instruction sent to this round says "claimed 300-600 words." That gap between protocol intent (one sentence each) and observed execution (300-600 words per member) is the live leak. Five members × 400 words average = 2,000 words per round arriving in TL context regardless of the consolidator.

Secondary: the TL is the sole author of all artifacts. committee-analysis.md, ledger, draft-spec/draft-plan — all of these live in TL context at write time. This is inherent to the Author role; nothing can be offloaded unless that role is delegated.

Tertiary (and the brief confirms it): TL synthesizes from streaming digests before consolidator output lands. This means the consolidator's enumeration arrives after TL has already done its round-synthesis pass — making the consolidator partly a disk record rather than TL's working input. The sequencing gap makes the consolidator redundant for its stated context-preservation purpose.

**Root cause stated precisely:** The TL role does four distinct jobs (route, synthesize, author, adjudicate), and the consolidator only offloads one sub-surface of the Synthesizer job (reading transcripts). The Router job (receiving all digests) is unaffected. The Synthesizer job runs before consolidator output lands, making the offload ineffective even for synthesis. The Author job is untouched. The Adjudicator job is untouched. Four jobs with one partial mitigation on one of them = structural over-loading that the consolidator does not fix.

---

## (b) Which Fix(es) Hold by Boundary Integrity

### Candidate A — Routing-only digests: HOLDS

Role boundary analysis:
- Members' job becomes: write full reasoning to disk, send a routing signal only. The routing signal is not analysis — it is a pointer. Members no longer function as a secondary synthesis channel.
- TL's job becomes: receive routing signals (confirming member completion), then read one artifact (consolidator-output) to begin synthesis. The Router and Synthesizer jobs are cleanly separated by the sequencing: routing signal arrives first, enumeration artifact second.
- Consolidator's job is unchanged: reads transcripts, emits enumeration-only output. Now, crucially, its output IS the TL's synthesis input — the consolidator is no longer redundant.

**Boundary integrity verdict: clean.** Candidate A eliminates the role-smear between member-as-secondary-synthesizer and team-lead-as-primary-synthesizer. Each role does one thing: members produce transcript + routing signal; consolidator enumerates; TL synthesizes from enumeration + adjudicates + authors.

**One issue to name:** "routing-only" must be specified tightly. If the protocol says "one line: position written, path X" but leaves room for interpretation, digests will inflate again — as they apparently already have from the original "one sentence per field" intent. The fix is a hard character or sentence cap enforced by the protocol language, not just an intent statement.

### Candidate B — Gate synthesis on consolidator output: DOES NOT HOLD

This is a sequencing discipline, not a role boundary change. The TL still receives all five digests — the digest channel is unaffected. The TL still does all four jobs. Gating synthesis on the consolidator output adds a serialization constraint but does not fix the digest-receipt bloat. It also serializes the round (no TL progress until consolidator finishes), paying wall-clock cost without the structural payoff.

From a category-integrity standpoint: gating is a timing rule, not a role boundary. Timing rules drift. Without the role boundary change (Candidate A), the next maintainer who reads "members send digests" and "TL synthesizes from digests" will re-introduce the synthesis-from-digest pattern because that is what the protocol says. B without A is unstable.

**Boundary integrity verdict: does not hold as a standalone fix.** B reduces symptom under ideal conditions; the structural problem (four jobs, one role) is unchanged.

### Candidate C — Scribe subagent authors artifacts: HOLDS CONDITIONALLY

Role boundary analysis:
- TL's Author job is delegated to Scribe. TL becomes Router + Adjudicator.
- Scribe becomes: receives TL's synthesized output, writes it to disk as artifact. Scribe's role boundary is clean: one input (TL synthesis), one output (artifact on disk).
- But: TL still receives all five digests. If Candidate A is not adopted alongside C, the digest channel is still live, and the TL's context still holds all digest content plus the synthesis it produces before handing to Scribe.

**Boundary integrity verdict: holds as a complement to A, not as a standalone fix.** The Author job is genuinely separable (it is a distinct concern — converting synthesis into structured artifact form), but offloading it addresses the secondary/tertiary bloat sources, not the dominant digest-channel leak. C without A reduces authoring overhead while the digest bloat continues.

**Combined A+C:** cleanest boundary structure. Members → routing signal only. Consolidator → enumeration. TL → reads enumeration, synthesizes, hands synthesis to Scribe, adjudicates with designer. Scribe → writes committee-analysis.md, ledger, any draft artifacts. Each role has a single primary concern. C introduces an extra subagent spawn per round (context and coordination cost), so the net gain depends on whether draft-artifact authoring is large enough to justify a spawn. For a sprint where the committee is developing a spec or plan (as in round05 of the FixStart sprint), the authoring load is significant; for a short consultation round, it may not be.

---

## (c) Top Trade-Off

**Candidate A's trade-off:** routing-only digests starve the TL of in-flight signal it currently uses to calibrate synthesis. Under current protocol the TL can begin mental synthesis as digests arrive — a streaming benefit that aids adjudication quality. Routing-only forces a full-round wait for consolidator output, then a single-pass synthesis. If the consolidator enumeration is thin (one-line per member, no key quotes), the TL's synthesis quality may degrade. The fix requires the consolidator output to be rich enough to support full synthesis — which means consolidator scope must expand from "enumerate positions" to "enumerate positions with key supporting evidence." That is a scope change to the consolidator's role, not just the TL's. The trade-off is: context preservation for TL at the cost of richer consolidator output (which itself has a context cost, though off-thread).

---

## Peer DM Sent

DM to researcher: "Researcher — purist here. Question for corroboration: in the round05 evidence (FixStart sprint), the consolidator-output.md is ~21k tokens and per-member transcripts are 12-15k each. Can you confirm: (a) what was the approximate word count of the digests members sent to the TL that round, and (b) did the consolidator output arrive before or after the TL had already begun narrating its synthesis in that round? I need to ground whether digest size or synthesis timing was the larger factor in TL bloat that round."

---

## Researcher Response (received — updates position)

Two findings received from researcher. Both sharpen and strengthen the initial position.

**Finding 1 — Digest word counts: not recoverable, but the gap is real and the claim is unverified.**

Digests are consumed-on-read from team-lead inbox; not preserved on disk. The protocol spec (member-protocol.md § Digest shape) is clearly bounded: 6 fields, one sentence each = approximately 60–120 words per digest. The 300–600 word claim traces to a TL self-report in a summary file — an unverified assertion, not a measurement. The gap is 3–5x vs. spec.

**Purist interpretation:** this finding cuts both ways. If digests actually ran 300–600 words, the digest channel is much worse than the protocol intends — indicating protocol drift, not structural intent. If digests were actually spec-compliant (60–120 words), the digest-channel leak is smaller than the brief claims, but still real (five members × 120 words = 600 words per round, vs. consolidator output at 21k tokens). Either way, Candidate A is correct: the fix must be structural (routing-signal-only), not reliant on behavioral compliance with word limits, because the round05 evidence shows behavioral compliance drifts. A hard structural constraint (one-line only, no prose) cannot drift the way "one sentence" does.

**Finding 2 — Ledger update (step 3) structurally requires synthesis before consolidator runs.**

Confirmed. Per team-lead.md, step 3 (ledger update) precedes step 4 (dispatch consolidator) and step 5 (read consolidator output). The ledger requires "running alignment pattern" — which requires assessing member positions. This is synthesis work. It cannot be done from a routing signal alone (one line: "position written, path X") — routing signals carry no alignment information. Therefore:

- Under Candidate A alone (routing-only digests), the TL CANNOT complete the ledger update at step 3. Step 3 requires alignment data that routing signals do not carry.
- This means Candidate A requires a corresponding protocol change: move the ledger update to after step 5 (post-consolidator), drawing alignment pattern from the consolidator output rather than from digests.

**This is not a problem for Candidate A — it is a specification for how A must be implemented.** The step ordering in team-lead.md is not a law of nature; it is a protocol choice. Moving ledger-update to post-consolidator is the correct fix. The result:

- Step 3 (currently: ledger update from digests) → becomes: a mechanical routing-signal count only ("N members returned, paths: X, Y, Z")
- Step 5 (read consolidator output) → triggers step 3b: alignment pattern written to ledger from consolidator enumeration

This change eliminates the structural reason the TL must synthesize before the consolidator exists. The synthesis-timing issue is NOT a separate problem from the digest-channel issue — they are the same structural defect expressed in two symptoms. Fix both by making the ledger draw from the consolidator, not the digest stream.

**Revised position:** the root cause is more unified than initially framed. The digest channel and the synthesis-timing issue are not two separate leaks — they are one: the protocol requires the TL to derive alignment from digest content (step 3) before the consolidator can run (step 4). Fix step 3 to accept only routing signals → no alignment work from digests → no synthesis before consolidator → TL's synthesis job becomes exclusively post-consolidator. Candidate A, properly specified, fixes both symptoms at once.

---

## Summary (updated post-researcher response)

- **Root cause (revised — more unified):** The digest channel and the synthesis-timing issue are not two separate leaks — they are one. The per-round flow requires the TL to derive alignment (step 3, ledger update) from digest content before the consolidator exists (step 4). This is the structural root: TL must synthesize from digests because the protocol's sequencing demands it, not merely because TL chooses to. The four-job conflation (route/synthesize/author/adjudicate) is real, but the synthesis job is forced by the step-3 ledger requirement, not incidental.
- **Fix that holds — Candidate A, with required co-change:** routing-only digests eliminate the digest channel. But A alone cannot support step-3 ledger alignment pattern. The co-change is: move ledger's alignment pattern write to post-consolidator (after step 5). Draw alignment from consolidator output, not digests. This is a protocol ordering fix, not an addition — it simplifies the ledger-update step. Together, A + the step-ordering fix form a complete, structurally clean solution.
- **Fix that does not hold standalone — Candidate B:** timing discipline, not boundary fix. Structurally unstable without A; B also does not fix the step-3 structural synthesis requirement.
- **Fix that holds conditionally — Candidate C:** clean boundary for Author job; complements A but does not address the digest-channel or synthesis-timing root. Justified as a secondary offload if artifact authoring is large (spec/plan development rounds). Not required for the core fix.
- **Top trade-off (sharpened):** Candidate A with ledger-ordering fix forces the consolidator output to carry alignment data sufficient for the ledger — meaning the consolidator's "enumerate-only" scope must expand to include named alignment pattern (who is on which side), not just per-member one-liners. This is a scope expansion for the consolidator role. It is the prerequisite the fix creates, and it is the right place for that work to live (consolidator reads all transcripts, is best positioned to enumerate alignment). The trade-off is: consolidator output becomes richer and thus slightly larger — but it is off-thread, not in TL context.

---

<!-- created-at: 2026-06-06 -->
<!-- role: purist -->
<!-- round: 01 -->
<!-- sprint: 20260606-01-update-committee-context-management -->
