# Phase 2 Opening: Problem Statement, Observations, and Commentary

---

## Problem Statement — Readback for Confirmation

Here's how I'd capture the problem:

*Events are replayed out of order after service restarts. When consumers rejoin their groups after a rebalance, they resume from the last saved position — but that position was recorded before the events were actually finished processing. This means events get skipped or reprocessed in the wrong sequence, and three downstream services that depend on strict ordering — billing, audit logging, and notification dispatch — are all exposed.*

Does that sound right?

---

## Observations

*We're dealing with a gap between when the system says "I'm done with this event" and when it's actually done — and that gap becomes visible every time the system restarts or rebalances.*

*The most fragile assumption in the current design is that acknowledging receipt and completing processing are the same thing. They aren't, and every restart proves it.*

*This turn focuses on the ordering guarantee and what's actually at stake for the three services that depend on it, because the severity of the problem is different for each one.*

---

## Information Package

**Current facts.** The event processing pipeline treats acknowledgment and completion as a single step — the system marks an event as handled at the same time it processes it, with no boundary ensuring both succeed or both fail together. When a restart or rebalancing occurs, the pipeline resumes from wherever it last marked progress, regardless of whether the work at that point actually completed.

**Surface analysis.** The ordering contract is silently broken under any disruption. Normal operation masks the problem because events flow continuously and the gap between "marked done" and "actually done" never matters. The moment the pipeline restarts, that gap becomes the source of lost or disordered events. The pressure is increasing — as throughput grows or restarts become more frequent, the window of exposure widens.

**General options.** The solution space here runs along a spectrum. At one end, you make the acknowledgment and the processing genuinely atomic — they succeed or fail as a unit, so the resume point is always accurate. At the other end, you accept that they're separate and build a mechanism to detect and correct ordering violations after the fact. In between, you can move the acknowledgment to happen only after processing completes, which narrows the gap without full atomicity. Each point on that spectrum trades complexity for strength of the ordering guarantee.

**Pessimist risks.** Billing is the most dangerous exposure. Out-of-order billing events can produce incorrect charges, and those are hard to detect after the fact and expensive to correct. Audit logging has a different shape of risk — disordered audit records undermine compliance, but the records themselves are still present, just misordered. Notification dispatch is the most forgiving — a notification sent twice or out of sequence is annoying but recoverable. The uncomfortable truth is that the system currently offers no ordering guarantee at all under restarts, and the three services that depend on it have very different tolerances for that failure.

---

## Commentary

The thing that concerns me most is that this isn't a bug in the traditional sense — the system is doing exactly what it was designed to do. It marks progress, then processes. The design just didn't account for what happens when those two steps get separated by a failure. That means a fix isn't a patch to a broken path; it's a change to the fundamental contract between the event pipeline and its consumers.

I think the critical question is whether we need the ordering guarantee to be perfect or just recoverable. Billing probably needs it to be perfect — you can't bill someone twice and sort it out later without real consequences. Audit logging might tolerate a "detect and reorder" approach, as long as the records eventually land in the right sequence. And notifications are probably fine with best-effort ordering.

That split makes me wonder whether a single solution across all three consumers is the right shape, or whether the ordering guarantee should be different per consumer based on what they can tolerate. A uniform approach is simpler to build and reason about, but it means the notification service pays the same complexity cost as billing for a guarantee it doesn't need.

What do you think?

---
---

# INTERNAL / INVISIBLE — Proof Operations

*The following is the proof machinery the designer never sees. These are the operations that would be composed and submitted to the Design Proof MCP after the designer confirms the problem statement.*

## initialize_proof

```
problem_statement: "Events are replayed out of order after service restarts.
When consumers rejoin their groups after a rebalance, they resume from the last
saved position — but that position was recorded before the events were actually
finished processing. This means events get skipped or reprocessed in the wrong
sequence, and three downstream services that depend on strict ordering — billing,
audit logging, and notification dispatch — are all exposed."

state_file: "{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-proof-state.json"
```

## submit_proof_update (seed)

### EVIDENCE elements (source: "codebase")

```
E1: {
  type: "EVIDENCE",
  source: "codebase",
  content: "EventConsumer commits offsets synchronously after batch
    processing — the offset is marked as handled in the same synchronous
    flow as processing, but there is no transaction boundary wrapping
    both operations together."
}

E2: {
  type: "EVIDENCE",
  source: "codebase",
  content: "The replay mechanism seeks to the last committed offset
    with no additional validation — it trusts that committed offset
    represents fully-processed work."
}

E3: {
  type: "EVIDENCE",
  source: "codebase",
  content: "No transaction boundary exists around the process-then-commit
    sequence. If the process completes but the commit fails (or vice
    versa), the two operations are not rolled back together."
}

E4: {
  type: "EVIDENCE",
  source: "codebase",
  content: "Three downstream services consume from this event pipeline
    and depend on event ordering: billing, audit-log, and
    notification-dispatch."
}
```

### RULE elements (source: "designer")

*None yet — no designer-directed restrictions were established during Phase 1.
Rules will be proposed in commentary and added only when the designer confirms them.*

### Notes

- No RULE or PERMISSION elements created from agent analysis (per prohibition).
- The commentary surfaces the per-consumer tolerance question to invite the designer
  to potentially establish a RULE about uniform vs. differentiated guarantees.
- The observation about billing severity is positioned to invite the designer to
  confirm it as a RULE (e.g., "billing must have perfect ordering") in a future turn.
