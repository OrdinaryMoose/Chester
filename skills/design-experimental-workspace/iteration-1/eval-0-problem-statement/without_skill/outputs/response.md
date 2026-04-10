# Phase 2: Proof Initialization — Event Replay Ordering Failure

## Problem Statement

Event replay produces out-of-order processing after node restarts. The root cause is a gap between offset commitment and processing completion: the consumer commits offsets synchronously after batch processing completes, but if a node fails mid-batch (after some events are processed but before the commit), the rebalanced consumer resumes from the last committed offset — which predates the failed batch. Meanwhile, if a node fails after commit but before all side effects land, those events are skipped entirely on replay. The combination means downstream services (billing, audit-log, notification-dispatch) receive events in an order that violates their causal expectations.

The core invariant that must hold: **an event's offset is committed if and only if its processing (including all downstream side effects) has durably completed.** The current system violates this invariant because commit and processing completion are not atomic.

---

## Seed Operations

### EVIDENCE Elements (source: "codebase")

These are facts established during Phase 1 codebase exploration.

**E1 — Synchronous offset commit after batch processing**
```
id: "E1"
type: EVIDENCE
source: "codebase"
label: "Offset commit is synchronous post-batch"
detail: "EventConsumer class at src/events/consumer.ts:142 commits offsets
  synchronously after batch processing completes. The commit call occurs
  after the processing loop, not within a transaction boundary."
location: "src/events/consumer.ts:142"
```

**E2 — No transaction boundary around process-then-commit**
```
id: "E2"
type: EVIDENCE
source: "codebase"
label: "No atomicity between processing and commit"
detail: "There is no transaction boundary wrapping the event processing and
  the offset commit. A failure between processing completion and commit
  (or during processing after partial completion) leaves the system in an
  inconsistent state where committed offsets do not reflect actual
  processing progress."
location: "src/events/consumer.ts (batch processing block)"
```

**E3 — Replay seeks to last committed offset**
```
id: "E3"
type: EVIDENCE
source: "codebase"
label: "Replay uses last committed offset as resume point"
detail: "The replay mechanism seeks to the last committed offset for each
  partition. It has no independent record of which events were actually
  processed, so it trusts the committed offset as the sole source of truth
  for replay position."
location: "src/events/consumer.ts (replay mechanism)"
```

**E4 — Three ordering-dependent downstream services**
```
id: "E4"
type: EVIDENCE
source: "codebase"
label: "Three downstream services depend on event ordering"
detail: "Billing, audit-log, and notification-dispatch all consume events
  from this pipeline and depend on correct ordering. Out-of-order delivery
  can cause incorrect billing calculations, audit log gaps or inversions,
  and duplicate or misordered notifications."
location: "downstream service integrations"
```

**E5 — Consumer group rebalance on node restart**
```
id: "E5"
type: EVIDENCE
source: "codebase"
label: "Rebalance reassigns partitions on restart"
detail: "When a node restarts, the consumer group rebalances and partitions
  are reassigned. Each new partition owner resumes from the last committed
  offset for that partition, which may not reflect the true processing
  state of the previous owner."
location: "consumer group configuration"
```

### RULE Elements (source: "designer")

These capture the constraints stated or implied by the designer.

**R1 — Events must be processed in order**
```
id: "R1"
type: RULE
source: "designer"
label: "Event ordering must be preserved across replays"
detail: "The designer states that event replay is 'broken' because events
  process out of order after node restarts. This establishes that
  preserving event processing order — especially across failure and
  replay scenarios — is a hard requirement, not a best-effort goal."
grounding: "Designer statement: 'Our event replay is broken — events process
  out of order after node restarts'"
```

**R2 — Offsets must not be committed before processing completes**
```
id: "R2"
type: RULE
source: "designer"
label: "Offset commit must not precede processing completion"
detail: "The designer identifies the root cause as offsets being committed
  before processing finished. This establishes that the solution must
  guarantee offsets are only committed after all processing (including
  side effects) has durably completed."
grounding: "Designer statement: 'offsets were committed before processing finished'"
```

---

## Proof System Calls

### 1. initialize_proof

This call establishes the proof context with the problem statement.

```json
{
  "problem_statement": "Event replay produces out-of-order processing after node restarts. The consumer group rebalances and each partition resumes from its last committed offset, but offsets were committed before processing finished. The core invariant violated: an event's offset is committed if and only if its processing has durably completed. Three downstream services (billing, audit-log, notification-dispatch) depend on correct ordering.",
  "context": {
    "phase": 2,
    "phase_1_complete": true,
    "codebase_explored": true,
    "key_file": "src/events/consumer.ts",
    "key_line": 142
  }
}
```

### 2. submit_proof_update (seed operation)

This call submits all seed elements as the initial proof state.

```json
{
  "operations": [
    {
      "action": "add",
      "element": {
        "id": "E1",
        "type": "EVIDENCE",
        "source": "codebase",
        "label": "Offset commit is synchronous post-batch",
        "detail": "EventConsumer class at src/events/consumer.ts:142 commits offsets synchronously after batch processing completes. The commit call occurs after the processing loop, not within a transaction boundary.",
        "location": "src/events/consumer.ts:142"
      }
    },
    {
      "action": "add",
      "element": {
        "id": "E2",
        "type": "EVIDENCE",
        "source": "codebase",
        "label": "No atomicity between processing and commit",
        "detail": "There is no transaction boundary wrapping the event processing and the offset commit. A failure between processing completion and commit (or during processing after partial completion) leaves the system in an inconsistent state where committed offsets do not reflect actual processing progress.",
        "location": "src/events/consumer.ts"
      }
    },
    {
      "action": "add",
      "element": {
        "id": "E3",
        "type": "EVIDENCE",
        "source": "codebase",
        "label": "Replay uses last committed offset as resume point",
        "detail": "The replay mechanism seeks to the last committed offset for each partition. It has no independent record of which events were actually processed, so it trusts the committed offset as the sole source of truth for replay position.",
        "location": "src/events/consumer.ts"
      }
    },
    {
      "action": "add",
      "element": {
        "id": "E4",
        "type": "EVIDENCE",
        "source": "codebase",
        "label": "Three downstream services depend on event ordering",
        "detail": "Billing, audit-log, and notification-dispatch all consume events from this pipeline and depend on correct ordering. Out-of-order delivery can cause incorrect billing calculations, audit log gaps or inversions, and duplicate or misordered notifications.",
        "location": "downstream service integrations"
      }
    },
    {
      "action": "add",
      "element": {
        "id": "E5",
        "type": "EVIDENCE",
        "source": "codebase",
        "label": "Rebalance reassigns partitions on restart",
        "detail": "When a node restarts, the consumer group rebalances and partitions are reassigned. Each new partition owner resumes from the last committed offset for that partition, which may not reflect the true processing state of the previous owner.",
        "location": "consumer group configuration"
      }
    },
    {
      "action": "add",
      "element": {
        "id": "R1",
        "type": "RULE",
        "source": "designer",
        "label": "Event ordering must be preserved across replays",
        "detail": "The designer states that event replay is 'broken' because events process out of order after node restarts. This establishes that preserving event processing order — especially across failure and replay scenarios — is a hard requirement, not a best-effort goal.",
        "grounding": "Designer statement: 'Our event replay is broken — events process out of order after node restarts'"
      }
    },
    {
      "action": "add",
      "element": {
        "id": "R2",
        "type": "RULE",
        "source": "designer",
        "label": "Offset commit must not precede processing completion",
        "detail": "The designer identifies the root cause as offsets being committed before processing finished. This establishes that the solution must guarantee offsets are only committed after all processing (including side effects) has durably completed.",
        "grounding": "Designer statement: 'offsets were committed before processing finished'"
      }
    }
  ]
}
```

---

## Rationale for Element Selection

**Why these EVIDENCE elements:** Each captures a distinct codebase fact that contributes to the failure mode. E1-E3 trace the causal chain (commit timing, lack of atomicity, naive replay). E4 establishes blast radius. E5 captures the trigger condition (rebalance). Together they fully describe the mechanism of failure.

**Why these RULE elements:** R1 captures the ordering requirement (the "what's broken"). R2 captures the causality constraint (the "why it's broken"). Both are grounded directly in the designer's words, not inferred. Additional rules may emerge as the designer provides more constraints, but these two are sufficient to seed the proof and begin exploring the solution space.

**What comes next:** After seed initialization, the proof system would need NECESSARY_CONDITION elements to establish what must be true for any valid solution. Candidates include:
- NC1: "Processing and offset commit must be atomic or the offset must trail processing" (grounded in E1 + E2 + R2)
- NC2: "Replay must be idempotent or must resume from a position that guarantees no skipped events" (grounded in E3 + R1)
- NC3: "Each downstream service must tolerate at-least-once delivery or the system must guarantee exactly-once" (grounded in E4 + R1)

These would require collapse tests (what breaks if this condition is removed?) and full reasoning chains before they can be added to the proof.
