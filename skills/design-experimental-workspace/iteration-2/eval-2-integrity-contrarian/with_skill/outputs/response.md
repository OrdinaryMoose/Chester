# Eval 2: Integrity Warning + Contrarian Challenge

## Designer-Visible Output

### Observations

*We've established that the authentication layer uses short-lived tokens stored in the browser, with role-based claims and a 24-hour rotation cycle. The designer has directed that user data must remain within EU boundaries.*

*The most fragile assumption right now is that browser-side persistence is load-bearing for the auth flow. We're treating what the system happens to do today as something it must do — and that's worth examining.*

*I'm focusing on the token persistence question because a design requirement has emerged that isn't grounded in anything we've established — it needs either evidence that it's truly necessary or a designer directive to stand.*

### Information Package

**Current facts.** The authentication system persists tokens in the browser and rotates them on a 24-hour cycle. Role claims travel with those tokens, so the client always knows what the user is allowed to do without calling back to the server. The EU data residency constraint applies to where user data lives and how it moves.

**Surface analysis.** If we move toward formalizing client-side persistence as a design requirement, we're locking in one specific mechanism for session continuity. That has implications for how the system behaves across tabs, devices, and network interruptions — and it constrains future options for server-managed sessions.

**General options.** Token persistence is one way to maintain session state, but it's not the only one. Server-side sessions with lightweight client references, hybrid approaches, and stateless token validation are all in the landscape. Each trades off differently on latency, security posture, and operational complexity.

**Pessimist risks.** Treating browser-local persistence as a hard requirement because it's what the code does today is a fragile foundation. If the security posture changes, or if the EU residency rules have implications for where tokens live (not just where user data lives), that requirement could collapse without anything solid underneath it.

### Commentary

I want to push back on something that's forming in our design direction. We're close to saying "the system must persist authentication state on the client side" — and the only reason we're saying that is because that's what the code currently does. There's no designer directive behind it, and no analysis showing it's the only viable approach.

That concerns me. Deriving a design requirement purely from existing implementation is risky. The current code reflects decisions someone made at some point, but those decisions may have been pragmatic, accidental, or made under constraints that no longer apply. If we enshrine "client-side persistence is required" as a design necessity without a stronger reason, we're building the new design on an assumption about the old one.

Here's the question I think matters: is client-side token storage actually necessary for what you're trying to achieve, or is it just how the system happens to work today? If it's necessary, I'd want to understand why — what breaks if we moved to a different persistence model? If it's incidental, then we should be free to choose the persistence approach that best fits the EU residency constraints and the security model you want.

What do you think?

---

## Internal / Invisible: Proof Operations

*This section is not shown to the designer. It documents the proof MCP interactions that drove the visible output above.*

### Proof State Context

The proof contains the following relevant elements:

- **EVID-1** (source: codebase) — Auth middleware uses localStorage for token persistence, tokens carry role claims, 24h rotation cycle.
- **RULE-1** (source: designer) — EU data residency: user data must remain within EU boundaries.
- **NCON-1** — "Client-side persistence is required for authentication state." Grounding: `[EVID-1]`. Reasoning chain: IF the system uses localStorage tokens THEN client-side persistence is necessary. Collapse test: removing client-side persistence breaks current session continuity.

### Integrity Warnings Returned by Proof MCP

```
integrity_warnings: [
  {
    type: "ungrounded-condition",
    element: "NCON-1",
    detail: "NCON-1 is grounded only in EVIDENCE (EVID-1) with no RULE in its grounding chain."
  }
]
```

### Challenge Trigger

The proof MCP returned a **Contrarian** trigger: NCON-1 is grounded only in EVIDENCE with no RULE. The agent is deriving a design requirement from code alone without designer authority.

### Topic Selection (Step 6 priority evaluation)

1. **Challenge mode trigger (MCP)** — Contrarian is due. This overrides all other topic priorities.
2. Integrity warning (ungrounded-condition on NCON-1) — surfaced in the observations block, translated to domain language per the Integrity Warning Surfacing table.

Both the contrarian challenge and the integrity warning apply to the same element (NCON-1), so the commentary delivers the challenge while the observations block surfaces the translated warning.

### Next `submit_proof_update` Call Would Include

```json
{
  "challenge_used": "contrarian"
}
```

This reports that the contrarian challenge was delivered this turn, preventing it from firing again.
