# Phase 2 Opening: Problem Statement and Proof Initialization

## Problem Statement

Here is your problem, in your words, presented back for confirmation:

> Our event replay is broken -- events process out of order after node restarts because the consumer group rebalances and each partition resumes from its last committed offset, but the offsets were committed before processing finished.

Does this capture the problem? I want to make sure I have your exact intent before we build the proof around it. I have not expanded, elaborated, or reframed -- this is your statement describing the pain point as you see it.

---

## Proof Initialization

Once confirmed, I would call `initialize_proof` with the following:

```
initialize_proof({
  problem_statement: "Our event replay is broken — events process out of order after node restarts because the consumer group rebalances and each partition resumes from its last committed offset, but the offsets were committed before processing finished.",
  state_file: "{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-proof-state.json"
})
```

*(The `state_file` path resolves to the sprint's design directory per Chester's artifact schema, e.g. `docs/chester/working/20260408-03-event-replay-ordering/design/20260408-03-event-replay-ordering-proof-state.json`.)*

---

## Seed Proof Operations

After initialization, I would call `submit_proof_update` with the following seed operations -- EVIDENCE elements from codebase exploration during Phase 1, and no RULE or PERMISSION elements (since none were explicitly directed by the designer during Phase 1):

```
submit_proof_update({
  operations: [
    {
      type: "add",
      element: {
        type: "EVIDENCE",
        content: "The event consumer commits offsets synchronously after batch processing completes. The commit happens after the processing call returns, not within the same transaction boundary.",
        source: "codebase"
      }
    },
    {
      type: "add",
      element: {
        type: "EVIDENCE",
        content: "There is no transaction boundary wrapping the process-then-commit sequence. Processing and offset commitment are two separate, non-atomic operations.",
        source: "codebase"
      }
    },
    {
      type: "add",
      element: {
        type: "EVIDENCE",
        content: "The replay mechanism seeks to the last committed offset to determine where to resume. It has no awareness of whether processing actually completed for events at or before that offset.",
        source: "codebase"
      }
    },
    {
      type: "add",
      element: {
        type: "EVIDENCE",
        content: "Three downstream services depend on event ordering: billing, audit-log, and notification-dispatch. Each assumes events arrive in the order they were produced.",
        source: "codebase"
      }
    },
    {
      type: "add",
      element: {
        type: "EVIDENCE",
        content: "When a consumer group rebalances after a node restart, each partition resumes from its last committed offset. Events between the last committed offset and the actual processing frontier are either skipped or reprocessed out of order.",
        source: "codebase"
      }
    }
  ]
})
```

---

## Observations

*The core pain is a gap between what the system records as done and what is actually done. The offset marker moves ahead of completed work, and when the system restarts, it trusts a marker that lied.*

*The most fragile assumption here is that offset commitment is a reliable proxy for processing completion. It is not -- and three services downstream are built on that assumption.*

*I am starting with the mechanics of the failure window -- the gap between commit and completion -- because understanding the size and shape of that window determines what kinds of solutions are even viable.*

---

## Information Package

**Current facts.** The event processing pipeline treats offset commitment and event processing as two sequential but independent operations. The consumer processes a batch, then commits. If the node fails between those two steps -- or if a rebalance occurs while processing is in flight -- the committed offset no longer reflects reality. The replay mechanism has no way to distinguish "processed and committed" from "committed but not processed."

**Surface analysis.** The failure window exists in the gap between processing completion and offset commitment. During normal operation this gap is small and invisible. During restarts and rebalances it becomes the source of ordering violations. The downstream services -- billing, audit-log, notification-dispatch -- each carry their own assumptions about ordering, and each will manifest the failure differently.

**Uncomfortable truths.** This is not a bug in the consumer -- it is a design gap. The system was built assuming that offset commitment is a reliable record of processing state, and nothing in the current architecture challenges that assumption. Fixing this is not a matter of moving a line of code; it touches the fundamental contract between the event pipeline and every service that consumes from it.

---

## Commentary

Here is what I think is going on. The event consumer was built around an implicit contract: "committed offset means processed." That contract held under normal operating conditions but breaks under partition rebalancing. The three downstream services -- billing, audit-log, and notification-dispatch -- are all built on that same implicit contract, which means the blast radius of this failure is not contained to the consumer. Each of those services has its own tolerance for ordering violations and its own failure mode when events arrive out of sequence.

The thing that concerns me most is that the replay mechanism is not just unaware of the gap -- it actively trusts the wrong signal. It does not have a "maybe" state. It reads the committed offset and treats it as ground truth. Any solution that does not address this false-certainty problem at the replay level will leave the same class of failure available through a different path.

I lean toward thinking this is fundamentally about atomicity -- making the process-and-commit operation indivisible, or giving the replay mechanism enough information to detect and recover from the gap. But I want to hear whether you see this the same way, or whether there are constraints on those downstream services that shape which direction is viable.

What do you think?
