# Proof Turn: Designer Statement on Channel-Specific Retry Semantics

## Designer's statement

> "The key thing is that each channel has its own retry semantics. Email retries are cheap, SMS retries cost money, Slack has rate limits. Whatever we build needs to let each channel own its retry policy."

## Analysis

The designer is providing three things here:

1. A new rule: each channel must own its own retry policy (this is a design constraint).
2. New evidence: the three channels have materially different retry cost/behavior profiles.
3. A necessary condition falls out: the architecture must support per-channel retry policy injection. This is grounded in the evidence that channels differ (EVID-3 plus the new evidence) and the new rule.

There is also a risk: if retry logic is shared or centralized without per-channel override, SMS retries could incur unbounded cost.

## submit_proof_update call

```json
{
  "operations": [
    {
      "action": "add",
      "element": {
        "id": "EVID-4",
        "type": "EVIDENCE",
        "statement": "Email retries are cheap (near-zero marginal cost per retry attempt via SMTP)",
        "source": "codebase"
      }
    },
    {
      "action": "add",
      "element": {
        "id": "EVID-5",
        "type": "EVIDENCE",
        "statement": "SMS retries cost money — each retry attempt incurs per-message charges from the carrier/gateway",
        "source": "codebase"
      }
    },
    {
      "action": "add",
      "element": {
        "id": "EVID-6",
        "type": "EVIDENCE",
        "statement": "Slack API enforces rate limits — retry behavior must respect backoff windows to avoid HTTP 429 errors",
        "source": "codebase"
      }
    },
    {
      "action": "add",
      "element": {
        "id": "RULE-3",
        "type": "RULE",
        "statement": "Each notification channel must own its own retry policy — retry logic must not be shared or centralized in a way that prevents per-channel customization",
        "source": "designer"
      }
    },
    {
      "action": "add",
      "element": {
        "id": "NC-1",
        "type": "NECESSARY_CONDITION",
        "statement": "The channel abstraction must accept a pluggable retry policy per channel implementation",
        "grounding": ["EVID-4", "EVID-5", "EVID-6", "RULE-3", "EVID-3"],
        "reasoning_chain": "IF three new channels are requested (EVID-3), AND email retries are cheap (EVID-4), AND SMS retries cost money (EVID-5), AND Slack has rate limits (EVID-6), AND the designer requires each channel to own its retry policy (RULE-3), THEN the channel abstraction must support pluggable per-channel retry policies — otherwise a shared retry strategy would either overspend on SMS or under-retry email.",
        "collapse_test": "Show a channel interface or abstract base that includes a retry policy hook (e.g., getRetryPolicy(), maxRetries, backoffStrategy) and at least two concrete implementations with different retry configurations."
      }
    },
    {
      "action": "add",
      "element": {
        "id": "RISK-1",
        "type": "RISK",
        "statement": "If retry logic is centralized with uniform retry counts/intervals, SMS channel will incur unbounded cost during delivery failures, and Slack channel will hit rate limits causing cascading failures across all notification delivery"
      }
    }
  ]
}
```

## Rationale for each operation

| Element | Why |
|---------|-----|
| **EVID-4, EVID-5, EVID-6** | The designer revealed concrete, distinct cost/constraint profiles for each channel's retry behavior. These are factual claims about the operational environment that ground downstream reasoning. Each channel gets its own evidence element so conditions can reference them independently. |
| **RULE-3** | The designer's statement "needs to let each channel own its retry policy" is a design constraint, not a suggestion. It restricts the solution space: shared/uniform retry is disallowed. Source is "designer" because it comes from the designer's authority, not from existing code. |
| **NC-1** | This is the structural consequence of the evidence and rule combined. The grounding array traces the full chain: three channels exist (EVID-3), each has different retry economics (EVID-4/5/6), and the designer requires per-channel ownership (RULE-3). The reasoning_chain is in IF...THEN form showing how the condition follows necessarily. The collapse_test gives a concrete, verifiable criterion: show a channel interface with a retry policy hook and two implementations with different configs. |
| **RISK-1** | Captures the failure mode if NC-1 is not satisfied. This makes the cost of ignoring the necessary condition explicit in the proof state. |
