# Committee Analysis — Round 01

**Question:** Why does the team-lead still accumulate the bulk of per-round context despite the consolidator, and what structural change to the committee process actually offloads it?

## Round Overview

Five members returned (four advocacy + researcher). The advocacy members opened on the brief's premise (the digest channel as dominant leak), then revised mid-round as the researcher's facts propagated peer-to-peer.

**Researcher ground-truth (load-bearing):**
- 200k/380k bloat — **VERIFIED from session JSONL.** Review-start-context team-lead session peaked at **346,692 tokens** (monotonic climb, handoff at round05); an earlier same-sprint session peaked at 228,757. Designer recollection corroborated.
- On-disk committee artifacts total ~130k tokens. **Gap ~217k (~63% of TL context) is off-disk** — ephemeral in-context work the consolidator never touches.
- Digest-size claim (300–600 words) — NOT verifiable (digests consumed; spec = 50–80 words).
- Consolidator-output drift — MEASURED. round01 = 452 words (in spec); rounds 02–05 = 2,470–3,340 words (5–7× over). Enforcement gap, not spec gap (existing agent file already prohibits synthesis).
- Premature synthesis — CONFIRMED. Ledger step 3 derives alignment from digests before the consolidator is dispatched (step 4) and read (step 5).

**Alignment on the fix:** direction converged, sequence split.
- All four accept consolidator-cap enforcement (measured leak, one-file, cheapest).
- innovator — routing-only digests + synthesis-gate now; scribe authoring as end-state (pure-router TL).
- pragmatist — consolidator caps first, then routing-only digests; skip scribe unless proven needed.
- conservator — consolidator caps first, then enforce digest spec, then scribe; routing-only digests over-correct; raised the observability catch.
- purist — routing-only digests and synthesis-gating are ONE fix (digests + ledger-reorder + consolidator carries alignment); scribe complements but is not root.

**Cross-cutting catch (conservator):** digests are consumed and never archived, so any context-reduction fix is unverifiable after the fact unless the process persists what enters team-lead context.

## Final Recommendation

The evidence reorders the members' cost-first instinct. By cost, consolidator caps win. By *impact*, the dominant measured leak (~63%, ~217k) is the off-disk ephemeral surface — authoring drafts in-context, source reads during drafting, streamed digests/revisions, consolidator outputs read back, reviewer findings. Consolidator caps and routing-only digests each address a real but comparatively small slice; the authoring channel (scribe offload) is where the mass is.

**Opinion (team-lead):** adopt a layered fix, but do not stop at the cheap layers. Cap the consolidator (cheap, measured, do it regardless), unify routing-only digests with the ledger-reorder (fixes the digest channel and the premature-synthesis step order in one move), and commit to the authoring offload (scribe) because it is the only fix that touches the ~63% mass. Add the observability requirement — persist what enters team-lead context — as a cross-cutting condition so the next session can measure whether any of this worked. The trade-off the designer accepts: more moving parts now, in exchange for attacking the part of the bloat that the consolidator was never going to reach.

The genuine decision for the designer is cost-first incremental vs impact-first — surfaced as a split, not collapsed.
