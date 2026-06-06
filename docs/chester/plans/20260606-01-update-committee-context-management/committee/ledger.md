# Committee Ledger — team-lead context bloat

**Question:** Why does the team-lead still accumulate the bulk of per-round context despite the consolidator, and what structural change to the committee process actually offloads it?

## Round 01

**Members returned:** conservator, innovator, pragmatist, purist, researcher (all 5).

**Alignment pattern (on the fix):** distributed, no majority for any single option.
- innovator — A+B now, C as end-state (pure-router team-lead).
- pragmatist — A (B falls out as consequence), defer C.
- conservator — B (enforce existing spec) + C; A is over-correction.
- purist — A+C; B is timing-only, doesn't fix role boundary.

**Convergence:** all four agree the team-lead does multiple in-context jobs (route, synthesize, author, adjudicate) and that authoring is a genuinely structural channel. All four built primary cases on the brief's digest-size premise.

**Researcher ground-truth (load-bearing):**
- 200k/380k token figures: NOT verifiable on disk (self-reports). Largest round on disk ≈32k tokens; 5-round cumulative ≈130k.
- 300–600-word digest claim: NOT verifiable (digests consumed). Spec = 50–80 words.
- Consolidator-output drift: MEASURED. round01=452 words (in spec); rounds 02–05=2,470–3,340 words (5–7× over spec).
- Premature synthesis: CONFIRMED. ledger step 3 (synthesize from digests) precedes consolidator dispatch (step 4) + read (step 5).
- TL authoring committee-analysis/ledger/draft-spec/draft-plan: CONFIRMED in-context.

**Open questions for designer:**
1. Given the digest-size premise is unverified, is A (routing-only digests) still wanted, or does the evidence redirect to consolidator-drift + authoring?
2. The 200k bloat is real (experienced) but unexplained by on-disk artifacts — likely in-context authoring of drafts + their source inputs. Confirm target.

**Designer decisions (round01):**
- Circularity check resolved: pass-1 scribe was a member-transcript write-permission workaround (narrow, no general principle); team-lead authoring never in pass-1 scope. Today's work = REFRAME not circle.
- Token evidence VERIFIED from session JSONL: TL peaked 346,692; two forced compactions (122,623 after round01 alone; 347,339 after round05). ~63% (~217k) off-disk ephemeral.
- **Designer pivot: stop patching. Back to DESIGN.** Authorized a 2-round redesign of the committee.

## Round 02 (DESIGN — generative)

**Mandate:** redesign committee roles + all comms channels (TL↔members, members↔members) to converge on an optimal answer, enable designer decisions, ruthlessly minimize context, completely retain meaning. TL reduces to exactly 2 functions: dispatch + present-to-designer. Membership/roles/formats all negotiable.

**Round plan:** round02 = generate competing redesigns; round03 = converge to one optimal design with designer decision points.

**Dogfood:** members write full proposals to disk, send TL minimal structured digests only.

**SCRAPPED.** Round02 framing was biased: dispatch pre-decided "2-function TL never holds raw content," which manufactured convergence on an off-TL Synthesizer. All four proposals are the "off-TL" half of the real space. Transcripts retained on disk as the off-TL candidate set; not used as the answer.

Round02 spread (off-TL candidates, for reference): all four → replace Consolidator with a synthesis-capable "Synthesizer" (hard word cap), kill member→TL digest channel (members write to disk, send routing/done-signal only), TL reads one bounded artifact, reorder flow so ledger drawn post-synthesis. Deltas: member channel (nothing / done-signal / 60-word structured signal+kill_shot / blackboard schema); Synthesizer interpretive authority; scribe yes/no.

## Round 03 (DESIGN — clean generate, corrected open framing)

**Correction:** TL's two functions (dispatch, present) are the FLOOR not the ceiling. TL MAY also own synthesize/consolidate/converge/author — OR those live elsewhere. The design question is WHO OWNS each non-fixed role, judged against R1-R4.

**Requirements (fixed):** R1 converge on optimal answer (not enumerate); R2 enable designer decisions; R3 ruthlessly minimize context; R4 completely retain meaning.

**Non-fixed roles to assign ownership:** consolidate, synthesize, converge, author (analysis/ledger/drafts). Owner ∈ {TL itself, dedicated agent, members collectively, shared disk/blackboard}. TL-owns-cheaply (bounded input + write-evict) is a LIVE option, not pre-excluded.

**Clean restart:** retired the 4 anchored round02 advocates; spawned 4 fresh advocates (conservator-r3, innovator-r3, pragmatist-r3, purist-r3). Researcher retained (neutral). Round03 = generate, round04 = converge.

(round03 in flight)
