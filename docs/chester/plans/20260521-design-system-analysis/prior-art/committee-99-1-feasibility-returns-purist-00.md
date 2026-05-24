# Committee 99/1 Feasibility Deliberation — Purist Verbatim Return

**File:** `committee-99-1-feasibility-returns-purist-00.md`
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

PURIST LENS — 99/1 FEASIBILITY.

**What the proof system's structural contract actually is**

Four charter properties named: single-writer audit trail, lint-enforced canonical vocabulary, closure-gate as fitness function, friction detection as structural signal. The Purist reads these not as equal-weight features but as a dependency chain. The closure-gate and friction detection are the load-bearing outputs — the things the system exists to produce. The audit trail and vocabulary lint are the integrity guarantees that make those outputs trustworthy. Strip the guarantees and the outputs become opinions, not proofs.

The question is therefore not "which charter properties survive the 99/1 drive?" but "which admin costs attach to the guarantee layer versus the ceremony layer?" Those are structurally different cuts.

**Structured pole outputs (Resolution-block schema): does compression damage cognition?**

The Purist position: no, if the schema fields map to the reasoning structure that already exists in good Resolutions. A Resolution already has a structural commitment, a grounding, a reasoning chain, and a lens. Naming those as schema fields does not add ceremony — it removes the authoring decision of where to put them. The compression risk is different: schema fields invite terse completions ("grounding: prop_001" without reasoning) that satisfy the form without carrying the load. The mitigation is structural, not procedural — the schema must require a minimum reasoning chain length that cannot be satisfied by field-completion alone. If the schema enforces prose at the reasoning_chain field, it compresses incidental overhead while protecting cognition. If it allows one-line fill-in across all fields, it hollows the system.

**Pole self-lint: who validates the validator?**

This is the sharpest category-boundary question. The canonical vocabulary lint exists because vocabulary drift is an invisible defect — a pole that writes "NotifySubscription" as "Notify Subscription" produces a lint violation the author cannot self-detect because they believe their own usage is correct. The audit trail exists precisely because the system cannot trust the author of an element to validate it. Pole self-lint is therefore not a redistribution of the lint function — it is a structural degradation of it. The guarantee "lint is external to the author" is the guarantee that makes lint meaningful. Distributing lint to poles does not reduce admin; it eliminates the property that gives lint its standing as evidence. The correct cut is: make lint machine-executable at ingest time (EC-004 direction) so it costs zero wall-clock and zero pole attention, rather than delegating it to the party least able to catch their own drift.

**Which admin survives elimination? Which breaks?**

Survives elimination cleanly: script authoring per-round (one cached template), report drafting (machine-readable output), archival, per-element vs. batch ingest framing (EC-001 eliminates the per-call overhead without touching the audit trail). These are ceremony.

Does not survive elimination without contract damage: external lint validation (must remain external to pole authors), the audit trail as single-writer record (batch API must preserve single-transaction semantics, not skip the record), closure-gate as a real gate (skipping it mid-round removes the fitness signal at exactly the moment structural drift is likeliest). Friction detection can be deferred to end-of-round without semantic damage if the round is short-enough; deferring across rounds means accumulated friction is discovered late.

**Termination versus degraded version**

The Purist position is categorical here. A degraded proof system that produces outputs the designer cannot trust is worse than no proof system, because it produces false confidence. The specific degradation to avoid is poles self-validating their own vocabulary — that is the one change that converts the proof system from a trust anchor into a ritual. If 99/1 can only be reached by distributing lint to poles, the Purist position is termination.

If 99/1 can be reached through EC-001 (batch ingest), EC-002 (state caching), EC-003 (closure-gate O(n)), and the schema-enforced pole output format — all of which attack the ceremony layer while preserving the guarantee layer — then 99/1 is achievable without structural damage and termination is the wrong call.

**The decisive structural test**

Can the batch-ingest + cached-schema + machine-lint path reach 99/1? The Arbiter's ingest observations suggest the dominant cost is EC-001 and EC-002 (2–5 minutes per ingest). If a single round at NCON-6 scale runs 3–4 ingests, EC-001+EC-002 saves roughly 10–20 minutes per round. That is a meaningful shift toward design-time dominance, but whether it crosses the 99/1 threshold depends on how long deliberation itself takes. The Purist does not endorse claiming 99/1 is achievable until the deliberation-time share is measured, not estimated.

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
