# Session Summary — 20260531-02-fix-write-task-topology

**Date:** 2026-05-31
**Sprint:** 20260531-02-fix-write-task-topology
**Branch:** 20260531-02-fix-write-task-topology (merged to main, no-ff, `0e77f03`)

## Goal

Fully examine the design considerations of DI-1 — per-task execution topology in `execute-write`
(letting some tasks run inline and some as isolated subagents within one plan), the "real unlock"
deferred from the update-execute-write sprint. Via a `design-committee` consultation.

## What Happened (two-round arc)

**Round 1 — examine per-task topology as deferred.** The committee rejected it 3-1. Decisive
findings: the rebuild is ~40% of execute-write's executable body (merging the two mutually-exclusive
mode loops into a per-task dispatcher); the cost it chased was already harvested by the v0006 depth
gate; and its safety claim ("escalate-up preserves the floor") was refuted mechanically — per-task
inline lands on the *implementer-presence* axis, where spawn-type is fixed before the implementer
runs and no mid-task re-isolation exists, so escalate-up relocates the floor breach rather than
dissolving it (Purist's bifurcation: escalate-up is real on the review axis, a fiction on the
presence axis). Prior-art (CI shared-runner-next-to-privileged-job) named the contamination hazard.
A latent hole surfaced: inline mode today gives tasks NO per-task review (only Section 4).

**Round 2 — designer reframe.** The designer removed inline from consideration entirely (never used
in practice). That dropped the presence axis and left only the review-LEVEL axis the committee had
ruled legal. The question became: always subagent, with a per-task choice between full review and a
streamlined review for simple/docs tasks. Pragmatist flipped to ship. Purist made the decisive cut —
"streamline" is three different things: "obviously-simple" already exists (the v0006 gate),
"document-only" is the one new legal capability, and "allow the implementer to streamline" is a
category violation (self-certification / rubber-stamp, the author becoming its own gatekeeper —
rejected 5-aligned, grounded in Chrome Rubber-Stamper / CI path-filter prior-art). The one open knob
was the docs trigger: the committee's literal convergence was `Type`-AND-observed, but the team-lead
flagged (and the designer chose) the observed-prose-diff alone — sufficient by itself, no new
coupling, can't be gamed by a mislabeled plan.

## What Was Decided

**Adopted: observed prose-diff quality-skip (option 1).** Always subagent. Skip the quality reviewer
when every changed file is documentation/prose — keyed on the observed report, not the plan's `Type`.

## What Was Produced

- **`skills/execute-write/SKILL.md`** — v0006 → v0007 (+4/−2). One new "prose-only skip path" bullet
  in §2.1 step 4 + two Red Flag updates. Committed `3e796db`, merged to main `0e77f03`.
- **Committee record** — `design/committee-analysis-per-task-topology.md` (two rounds: per-task
  topology examination + the review-level reframe; verbatim returns persisted per round before
  synthesis; Designer Decision appended; provenance-stamped).

## Deferred / Open

- **Inline-mode no-spec-floor hole** — inline plans get zero per-task review (only Section 4).
  Independent of this change; low priority (designer never uses inline). Decide separately: give
  inline a spec floor, or document it as inline's trade-off.
- **Prose-accuracy reviewer for docs** — checking code samples / commands inside markdown is review
  value the *code-oriented* quality reviewer does not provide; if wanted, it's a NEW reviewer, not a
  reason to keep running the code reviewer on prose.
- **DI-3 (from the prior sprint)** — conditional Section 4 (token-saving variant), still parked.

## What the Next Session Needs to Know

- `execute-write` v0007 is live in the cache (SHA `0e77f03`); `/reload-plugins` to pick it up.
- The prose-skip keys on the implementer report's changed-file extensions; if that report's file
  list format changes, the predicate moves with it.
- DI-1 is CLOSED — not built as per-task topology; resolved as the prose-skip. DI-2 was resolved
  earlier this session (the dangling `Type` consumer claim in plan-build).

## Session Skill Versions

<!-- produced-by design-committee@v0015 -->
<!-- produced-by finish-write-records@v0003 -->
