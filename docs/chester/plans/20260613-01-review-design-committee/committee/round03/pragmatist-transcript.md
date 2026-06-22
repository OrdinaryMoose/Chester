# Pragmatist — Round 03 Transcript

## Question

Best home for the whole 8-step per-round flow (all steps, no fragmentation) — functional merit only, no declared-authority arguments, no "member-protocol owns steps 1-3."

## Answering Side A's crux directly

The crux posed: team-lead.md already has named ordered steps — "integers = labels, not procedure." So what does relocating the numbered sequence to team-lead.md actually buy?

The answer is: team-lead.md step 2 is currently a deferral stub, not a named step. It reads: "Per-round flow runs — per SKILL.md Phase 4 § Per-Round Flow." It does not name dispatch, member-write, or member-signal as team-lead actions at all. It outsources the description of steps 1-3 back to SKILL.md, creating a mandatory bounce at the precise moment the executor is mid-round. That is not "integers as labels" — it is an empty placeholder that forces a cross-file read to complete the procedure.

So the bounce IS real and happens inside step 2, not between files at setup time. The executor following team-lead.md's 11-step list hits step 2, reads "per SKILL.md Phase 4," and must leave their active file. This is the worst-case bounce: mid-execution, not pre-flight.

## Option analysis without the struck prop

**Option 1 (whole sequence → SKILL.md):** SKILL.md is read at convene time. Putting the executor's runtime procedure there means the executor must re-read or hold a convene-time doc in context through the entire round. For a document that is consumed once at setup, that is an unnatural working pattern. SKILL.md also serves the orchestrator/wrapping-skill reader — embedding step-by-step team-lead mechanics there mixes audiences and altitude.

**Option 2 (whole sequence → team-lead.md):** The executor's active file during the round. Putting all 8 steps here means step 2 (currently a stub) becomes a real named step: "Wait for members — receive typed routing signals from all dispatched members; full returns stay on disk." No bounce. SKILL.md loses the numbered list and keeps the named-phase overview (what the round IS: Dispatch, Members-write, Members-signal, Consolidate, Synthesize, Converge, Author, Present) — serving the orchestrator reader at the right altitude without mechanics. Steps 1-8 as a complete team-lead-operated procedure in one place.

**Option 3 (two-altitude: checklist in team-lead.md + prose overview in SKILL.md):** This is what the corrected options describe. In practice Option 2 and Option 3 converge: SKILL.md naturally carries a conceptual overview (named phases, no numbered executor procedure) while team-lead.md carries the numbered checklist. Option 3 is Option 2 with an explicit acknowledgment that SKILL.md retains a phase map.

## Revised position

Option 2 / Option 3 (same outcome): numbered executor sequence in team-lead.md, named-phase overview in SKILL.md without integers. The current step 2 stub in team-lead.md is the live evidence that the design has already recognized team-lead.md as the execution home — it just failed to fill in the content and deferred back to SKILL.md instead. Completing that move eliminates the mid-round bounce.

## Final Position

```
position: Option 2 / Option 3 — whole 8-step numbered sequence in team-lead.md;
  SKILL.md retains named-phase overview without integers.

rationale: team-lead.md step 2 is currently a mid-round deferral stub ("per SKILL.md
  Phase 4 § Per-Round Flow"). The bounce is not at convene time — it happens
  mid-execution, inside an active step, forcing the executor to leave their runtime
  file. That is the real bounce cost. Filling step 2 with its actual content (the
  member-dispatch-and-wait mechanics) and giving team-lead.md all 8 steps eliminates
  the bounce entirely. SKILL.md keeps the named-phase overview serving the
  orchestrator/wrapping-skill reader at the right altitude. Option 1 embeds team-lead
  runtime mechanics in a convene-time document read by a different audience; Option 3
  is Option 2 named explicitly. Holding revised R2 position on functional grounds,
  with the struck prop removed — execution locus argument stands on the stub evidence.

blocking_risk: LOW — no external citations of either step list; pure internal fix.

warrant: team-lead.md §Per-Round Flow step 2 (line 96) reads "Per-round flow runs —
  per SKILL.md Phase 4 § Per-Round Flow." This is a hollow deferral that forces a
  mid-round cross-file read. It is direct evidence that the current design already
  locates execution in team-lead.md but failed to complete the relocation. Completing
  it removes the bounce without splitting the procedure.
```
