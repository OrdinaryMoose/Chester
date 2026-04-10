# Phase 2 Turn Response: Retry Semantics

---

## Designer-Visible Output

### Observations

*We're converging on the shape of the channel abstraction — channels aren't just delivery paths, they're autonomous units with their own operational characteristics. Retry behavior is the first concrete example of that autonomy.*

*This shifts the design pressure significantly. A shared retry mechanism would be the natural first instinct, but the designer is telling us that retry policy is economically and operationally distinct per channel. That's a load-bearing constraint, not an implementation detail.*

*This turn focuses on what it means for each channel to own its retry policy — and what that ownership implies for the boundaries of the system.*

### Information Package

**Current facts.** The notification pipeline today sends through SMTP directly. There's no retry abstraction because there's only one channel and email retries are essentially free — you just try again. The system has never needed to account for the cost of a retry attempt or external rate limits because it has never faced either constraint.

**Surface analysis.** Adding SMS and Slack introduces retry economics the system has never dealt with. SMS retries have a direct monetary cost per attempt. Slack imposes rate limits that punish aggressive retry patterns. These aren't variations on the same theme — they're fundamentally different operational constraints that happen to share the word "retry."

**General options.** The design space here runs from a single shared retry mechanism with per-channel configuration, through a delegated model where each channel owns its entire retry lifecycle, to a hybrid where the system manages scheduling but channels control the policy. The question isn't just where the retry logic lives — it's who decides when to stop trying.

**Pessimist risks.** If we build a shared retry mechanism and parameterize it, we're betting that every future channel's retry behavior can be expressed as configuration. That's a brittle bet. Rate limits, cost ceilings, backoff curves, and "don't retry at all" are qualitatively different strategies. A shared mechanism that tries to accommodate all of them will either be too rigid to handle real channel behavior or too complex to reason about.

### Commentary

I think the designer is pointing at something deeper than retry configuration — this is really about where operational authority lives. If each channel owns its retry policy, then the channel boundary isn't just "format the message and send it." The channel becomes responsible for the full delivery lifecycle: attempt, evaluate the outcome, decide whether to try again, and decide when to give up.

That has a real implication for the rest of the system. The notification pipeline can't treat "send" as a synchronous operation that either succeeds or fails. It has to hand off to the channel and trust the channel to manage delivery. The pipeline's job becomes "route to the right channel" and the channel's job becomes "get it there or decide it can't be done."

What concerns me is the boundary between "channel decides its own retry policy" and "the system needs to know what happened." At some point, something upstream needs to know whether a notification was delivered, is still being retried, or has been abandoned. If channels are fully autonomous on retry, we need to be clear about what they owe back to the system when they're done — especially for SMS, where abandoning a retry isn't just a technical decision, it's a cost decision.

Does that match how you're thinking about it?

---

## Internal / Invisible: Proof Operations

*The following would be composed as a `submit_proof_update` call. The designer never sees this section.*

### New EVIDENCE elements

**EVIDENCE: "smtp-no-retry-abstraction"**
- content: "Current notification pipeline uses direct SMTP send with no retry abstraction. Retries are implicit — email delivery is retried at the transport level at negligible cost."
- source: "codebase"

**EVIDENCE: "channel-retry-economics-differ"**
- content: "Designer states that retry semantics are fundamentally different per channel: email retries are cheap, SMS retries cost money, Slack has rate limits. These are not parameterizable variations — they are qualitatively different operational constraints."
- source: "designer"

### New RULE elements

**RULE: "channels-own-retry-policy"**
- content: "Each channel must own its own retry policy. The system must not impose a shared retry mechanism that channels are forced to use."
- source: "designer"
- rationale: "Designer directive: 'Whatever we build needs to let each channel own its retry policy.' This is a design restriction on the solution space — shared retry mechanisms are excluded."

### New NECESSARY_CONDITION elements

**NECESSARY_CONDITION: "channel-boundary-includes-delivery-lifecycle"**
- content: "The channel abstraction boundary must encompass the full delivery lifecycle — send attempt, outcome evaluation, retry decision, and abandonment — not just message formatting and dispatch."
- grounding: ["channels-own-retry-policy", "channel-retry-economics-differ", "smtp-no-retry-abstraction"]
- reasoning_chain: "IF each channel has qualitatively different retry economics (EVIDENCE) AND the designer directs that each channel must own its retry policy (RULE) AND the current system has no retry abstraction because it never needed one (EVIDENCE), THEN the channel boundary must be drawn around the full delivery lifecycle, not just the send operation."
- collapse_test: "If the channel boundary only covers send-and-return, retry logic must live somewhere else — either in a shared mechanism (which violates the designer's rule) or in ad-hoc per-channel code outside the abstraction (which makes the abstraction a leaky fiction)."

### New RISK elements

**RISK: "delivery-status-visibility"**
- content: "If channels are fully autonomous on retry, the system may lose visibility into delivery status. Upstream components need to know whether a notification was delivered, is still in-flight, or was abandoned — especially for SMS where abandonment is a cost decision."
- basis: ["channel-boundary-includes-delivery-lifecycle"]
