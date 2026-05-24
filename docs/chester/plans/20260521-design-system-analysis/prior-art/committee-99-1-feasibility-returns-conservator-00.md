# Committee 99/1 Feasibility Deliberation — Conservator Verbatim Return

**File:** `committee-99-1-feasibility-returns-conservator-00.md`
**Recovered:** 2026-05-21 (Path 1 transcript extraction)
**Original deliberation date:** 2026-05-21 09:52–09:55 UTC
**Source transcript:** `/home/mike/.claude/projects/-home-mike-RiderProjects-StoryDesigner/987c9826-c9d4-4f35-a422-6d98aabdac43.jsonl`

## Provenance

This is your verbatim peer-message return from the 99/1 admin/design-time-share feasibility deliberation that took place at the close of NCON-6 R-A1. The deliberation was conducted by the team-lead with the prior Committee team (now terminated) consisting of Conservator, Innovator, Pragmatist, Purist, and Researcher contributions.

Your return was consolidated into a decision packet held only in conversation context. The prior Committee team was subsequently terminated during NCON-6 suspension cleanup before the verbatim returns were persisted as a sprint artifact — a violation of the `feedback-committee-persistence-default` rule (which was written contemporaneously with this recovery). Recovery executed via the same Path 1 transcript extraction approach used for the R-A1 Propositions context loss earlier in the session.

This recovery artifact is the foundational substantive content from your own prior contribution to the deliberation. The current design-system-analysis session continues from this work. Read this in full before any substantive dispatch this session.

## The deliberation question

The team-lead dispatched each pole and the Researcher with the same framing:

> REQUIREMENT: 99% time on substantive design work, 1% on proof-compliance admin.
> STAKES: Committee-interview-proof system terminates if not solvable.
> CONTEXT: Implementable-now changes alone may not reach the bar; engine changes available in a future Chester proof-system performance sprint.

Each pole received a lens-specific task framing. Researcher received an external-precedent and Chester-engine-source research task.

## Your verbatim return

CONSERVATOR LENS — 99/1 FEASIBILITY

**What cannot be cut without breaking structural integrity**

Three operations are load-bearing and non-negotiable:

- **Single-writer ingest.** The proof engine holds authoritative state. Poles proposing Resolutions in natural language and a routing layer converting those to engine calls is fine — but the engine must be the record of what was ratified. If poles write directly to proof-state JSON bypassing the ingest API, the audit trail breaks and the single-writer guarantee collapses. The ingest step cannot be eliminated; it can only be made cheaper per call.

- **Lint on locked vocabulary in Resolution bodies.** Canonical-case enforcement (NotifySignal, SubscribeNotify, etc.) is not ceremony — it prevents silent semantic drift where a pole ratifies a commitment using a synonym that the engine later treats as a different concept. This lint must run before ingest, not after. It can be mechanical (script, not human eyeball), but it cannot be skipped.

- **Grounding to Proposition IDs only in Resolution fields.** The grounding constraint is what makes the proof chain traceable: Resolution → Proposition → Evidence. If poles cite Evidence IDs directly in grounding fields, the chain has a gap. This rule must hold. It takes zero wall-clock time if poles follow it correctly — the cost is only when they violate it and it gets caught late.

**What exists by convention and can be cut**

- Slate synthesis documents. Poles can output Resolution blocks directly in engine-ingestible format. The intermediate synthesis artifact (human-readable summary before ingest) exists by convention, not necessity. Cut it.

- Closure-gate and friction passes mid-round. These are useful at proof close, not between every Concern batch. Running closure-gate after each three-Concern round adds admin with no structural payoff until the proof is actually ready to close. Defer to final closure only.

- Per-pole provenance annotation in synthesized slates. The `grounding (sources): prop_C1a, prop_W1b` cross-reference tracking is bookkeeping for human auditors, not an engine requirement. Engine needs only the ratified Proposition IDs. Cut the per-pole source trails from ingest artifacts.

- Session-end archival reports mid-sprint. Summary and audit documents add value at sprint close; they consume tokens mid-round with no design payoff. Defer to finish phase.

**Whether implementable-now reaches 99/1**

Honest answer: no. The twelve prior tactics plus cutting the convention-only operations above get the split to perhaps 90/10 or 85/15. The remaining ceiling is the context-management cost of the engine itself — loading proof state, running structured tool calls, receiving structured responses — which is a fixed per-call tax that exists regardless of how lean the surrounding workflow is. That tax is engine-architecture, not convention.

**Minimum engine change that preserves structural integrity**

A single change reaches 99/1: batch ingest. Instead of one engine call per Resolution, the engine accepts a slate file containing all Resolutions for a round and ingests them in one call. The single-writer guarantee holds (one atomic write per round), lint runs on the batch before submission, grounding rules are checked batch-wide. The round's entire admin reduces to one structured tool call. No integrity guarantee is sacrificed; the audit trail is identical.

**Hard scenario position**

If batch ingest is out-of-scope and implementable-now cannot reach 99/1: the Committee system should not terminate on that basis. The correct response is to declare the target unachievable at the current engine tier, document EC-007 (batch ingest) as the minimum engine change required, and continue at the achievable 85/15 split until the engine change ships. Terminating the system because an efficiency target cannot be hit with implementable-now tooling is the wrong trade. The structural integrity the system carries — audit trail, single-writer, lint discipline — is worth more than the token savings from termination.

---

## Sibling returns

The other four Committee contributions are in companion files in this same working directory:

- `committee-99-1-feasibility-returns-conservator-00.md`
- `committee-99-1-feasibility-returns-innovator-00.md`
- `committee-99-1-feasibility-returns-pragmatist-00.md`
- `committee-99-1-feasibility-returns-purist-00.md`
- `committee-99-1-feasibility-returns-researcher-00.md`

A consolidated artifact with all five returns is at `committee-99-1-feasibility-returns-00.md`. Read your own first. Read siblings only when team-lead directs.

## Reading discipline

Initial read only. No DMs to other teammates. No action. No follow-up proposals. The team-lead has not yet dispatched any analytical task; this is foundational context for the upcoming work.
