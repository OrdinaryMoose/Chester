# Phase 2 Turn Response

## Observations

*We've established that session credentials live client-side, carry role information verified by the server, and rotate daily — but the new data residency requirement introduces a geographic constraint that cuts across all of these.*

*The most fragile assumption right now is that client-side storage of session credentials is a settled decision rather than a legacy default — we're building design requirements on top of it without questioning whether it should remain.*

*This turn addresses whether our requirement for client-side session persistence is actually grounded in a design decision, or whether we've inherited it from existing behavior and treated it as load-bearing.*

*A design requirement isn't grounded in anything we've established — it needs evidence or a designer directive to stand.* Specifically, the requirement that session persistence must happen client-side is currently justified only by the observation that this is how the system works today. There's no designer directive establishing that client-side storage is the right approach going forward — it's just what the code does now. That's a description of the current state, not a design decision.

---

## Information Package

**Current facts.** Session credentials are stored on the client and contain role claims that the server validates on each request. Rotation happens on a 24-hour cycle driven by a background process. The new data residency requirement restricts credentials from leaving the EU region.

**Surface analysis.** If we accept the data residency constraint at face value, client-side credential storage becomes immediately problematic — the client could be anywhere geographically, and the credential travels with the client. The 24-hour rotation window is long enough that credentials could be accessed from outside the required region during normal use, not just in attack scenarios.

**General options.** The solution space divides along where the authoritative credential lives: it stays on the client (with geographic enforcement layered on top), it moves server-side (with the client holding only a reference), or a hybrid where the sensitive claims stay server-side while the client holds a minimal access token. Each has different implications for the rotation model and the residency guarantee.

**Pessimist risks.** The residency requirement and the current storage model are in direct tension, and we haven't yet established which one yields. If we treat client-side storage as non-negotiable, the residency enforcement becomes complex and possibly brittle. If we treat residency as non-negotiable, the entire session model may need to change — and that's a much larger surface than this design initially scoped.

---

## Commentary

I want to push on something uncomfortable here. We've arrived at a requirement that session persistence must work client-side, and the entire basis for that is: the system currently does it that way. That's not a design decision — it's an observation about legacy behavior. And we're treating it as if it's load-bearing.

Here's what concerns me. You've directed that credentials cannot leave the EU region. That's a clear constraint from you. But the requirement that credentials must live on the client? That came from looking at the current implementation, not from any design intent you've expressed. We're deriving a design requirement from code alone, and I think that's backwards — especially when the code-derived requirement sits in direct tension with your stated constraint.

If client-side storage is genuinely what this design needs, I'd like to hear that from you as a deliberate choice, not inherit it as an accident of the current architecture. Because right now, the thing we're calling necessary is actually the thing most likely to conflict with the residency requirement you've established.

The 24-hour rotation window makes this worse, not better. A credential that lives on the client for up to 24 hours has a full day to travel outside the required region. That's not an edge case — that's the normal operating model.

I think we need to decide: is client-side credential storage a design directive, or is it just where the system happens to be today? Because those two things lead to very different designs, and right now we're building on the assumption that it's the former without ever having established that.

What do you think?

---

## Proof Operations

The following operations would be composed for this turn:

### Revise: NCON-1

**Rationale:** The current necessary condition for client-side session persistence is grounded only in codebase evidence (EVID-1) with no designer authority. The contrarian challenge has been delivered asking the designer to either confirm client-side storage as a deliberate directive or allow it to be reconsidered. Pending designer response — no revision submitted yet; the condition stands as-is with its integrity warning active until the designer responds.

### Proposed additions (pending designer response):

1. **RISK** — attached to the condition requiring client-side persistence:
   - Content: "Client-side credential storage conflicts with EU data residency requirement — credentials travel with the client across geographic boundaries during the full rotation window"
   - Basis: NCON-1

2. **EVIDENCE** (new) — EVID-4:
   - Content: "The 24-hour rotation window means credentials persist on the client long enough for routine cross-region access during normal usage patterns"
   - Source: codebase

### Challenge reporting:

- `challenge_used`: Contrarian
- Reason: NCON-1 grounded only in EVIDENCE (codebase observation) with no RULE (designer authority). Challenged the designer to either elevate client-side storage to a deliberate design directive or allow the condition to be reconsidered in light of the data residency constraint.

### Operations held pending designer response:

- If designer confirms client-side storage as intentional: add RULE establishing client-side storage as a design directive, re-ground NCON-1 in both the evidence and the new rule, resolve the integrity warning
- If designer does not confirm: withdraw NCON-1, explore server-side or hybrid credential models as alternative conditions
