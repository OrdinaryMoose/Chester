# Conservator — Round 02

## Question

Best home for the design-committee per-round flow, decided on functional merit only.

## Analysis

**Execution locus is team-lead, but the sequence belongs in SKILL.md on functional grounds.**

The execution locus argument cuts both ways. Steps 4-8 are team-lead-side execution — the calling agent runs them. But steps 1-3 are member-side: dispatch lands, members write, members signal. The round's complete lifecycle spans both sides. No single reader-file already owns all participants. A sequence that describes the full round must live somewhere all participants can reach — not inside the file of one participant.

**Reader model: SKILL.md is the only file in scope for the orchestrating agent at convene time.**

team-lead.md reading order (lines 46-50): the calling agent reads SKILL.md first, before team-lead.md. The orchestrator who convenes a round reads SKILL.md and acts from it. If the full sequence lived in team-lead.md instead, the orchestrator's authoritative picture would be delayed by one read. Worse, any wrapping skill (not yet written, but planned per skill-contract.md) would need to import team-lead.md's step numbering rather than SKILL.md's — adding a dependency with no functional payoff.

**Cohesion: the SKILL.md sequence is already complete. team-lead.md's additions are elaborations, not missing steps.**

team-lead.md step 2 says "per SKILL.md Phase 4 § Per-Round Flow" — then re-enumerates. The three "extra" steps (ledger bookkeeping, read-consolidator-output, checkpoint + designer-response) are sub-actions or outer-loop items. Splitting one clean 8-step sequence into an 11-step rival adds bounce cost without adding structural coverage. The drift risk from two numbered lists is worse than the drift risk from one list with named elaboration nearby.

**Minimum-disturbance argument — from function, not declared authority.**

The current structure already routes correctly: members read member-protocol.md, team-lead reads team-lead.md for execution detail, orchestrator reads SKILL.md for the round shape. Moving the canonical numbered sequence to team-lead.md would break the orchestrator's reading path without fixing the members' path (they don't read team-lead.md at all). No participant class is currently under-served by the SKILL.md location. The problem is the rival enumeration in team-lead.md, not the home of the canonical sequence.

**Functional verdict: SKILL.md owns the numbered sequence; team-lead.md carries prose elaboration by step name, not rival integers.**

## Final Position

```
position: SKILL.md owns the numbered per-round sequence; team-lead.md elaborates by step name with no rival integer list.
rationale: The orchestrating agent reads SKILL.md at convene before reading team-lead.md — the canonical sequence must be reachable in that first read. Members do not read team-lead.md; they read member-protocol.md. No participant class is poorly served by the SKILL.md location. The rival 11-step list in team-lead.md creates drift and bounce cost; removing the integers while preserving named prose elaboration fixes both. Moving the sequence to team-lead.md would break the orchestrator's reading path and add a wrapping-skill dependency with no functional gain.
blocking_risk: Placing the canonical sequence in team-lead.md forces wrapping skills to import team-lead.md step numbering rather than SKILL.md's, coupling a future-facing surface to the executing-agent's internal file.
warrant: type: logic | source: team-lead.md reading order (lines 46-50) establishes SKILL.md is read before team-lead.md by the calling agent; member-protocol.md (lines 1-8) confirms members read member-protocol, not team-lead.md; no participant class gains read-path coverage by moving the sequence.
```
