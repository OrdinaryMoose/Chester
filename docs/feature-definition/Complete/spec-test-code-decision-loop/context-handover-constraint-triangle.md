# Context Handover: The Constraint Triangle and Decision Record System

## Purpose

This document captures a design conversation about a coherent methodology for specification-driven development. It is intended to allow another agent to continue the work without losing conceptual ground.

---

## What was surveyed

The conversation began with a survey of existing agentic skill frameworks for Claude Code:

- **Superpowers** (obra/Jesse Vincent) — brainstorm → spec → plan → subagent-driven implementation → TDD-enforced code → review. The dominant framework in the ecosystem.
- **BMAD** — multi-role agent cascade (BA, PM, Architect, Scrum Master, Dev, QA) simulating an agile team. Thorough but ceremony-heavy.
- **GitHub Spec-Kit** — minimal spec-first harness. Composable.
- **cc-sdd (gotalab)** — Kiro-derived. Spec as a contract between system parts, code as source of truth.
- **cc-sdd (rhuss)** — Spec-Kit wrapped with composable traits (superpowers, worktrees, teams) via aspect-oriented overlay.
- **GSD (Get Shit Done)** — minimalist anti-ceremony reaction. Max 3 tasks per plan, fresh 200k-context subagent per task, one git commit per task.
- **Ralph Loop** — autonomous loop until spec is fulfilled; minimal gates.

The focus then narrowed to **how each system designs specifications** and where community feedback identifies failures.

---

## The common unresolved frustration

All systems treat spec generation as a one-directional pipeline: clarify → specify → implement. Community feedback (Hacker News, dbreunig's SDD Triangle talk, Thoughtworks analysis) has converged on a shared diagnosis:

**Spec drift.** Implementation surfaces decisions the spec didn't anticipate. Those decisions either get made silently by the agent (spec becomes stale) or cause rework. No current framework has a mechanism to propagate implementation discoveries back into the spec and tests in a structured, traceable way.

Secondary frustrations:
- **Spec quality depends on domain clarity.** You most need a spec when you're most confused. Socratic interview approaches (Superpowers, Chester's figure-out) help but don't fully solve this.
- **Spec compliance validation is probabilistic.** Every system uses an LLM to check spec compliance. That means the gate is soft, not deterministic.
- **The "why" is always missing.** Specs capture what and sometimes how. They rarely capture why a particular choice was made over alternatives. That knowledge vanishes.

---

## The design concept developed: The Constraint Triangle

### Core thesis

Spec, tests, and code are not a pipeline. They are a constraint triangle where each vertex must be kept in sync with the others. The syncing work is where the intelligence lives. No artifact has authority; they are in tension.

### The three relationships

**Spec ↔ Tests**: The spec defines acceptance criteria. Tests are concrete instantiations of those criteria. If a test exists that isn't traceable to a spec clause, either the spec is incomplete or the test is exploratory and needs a spec clause written for it. If a spec clause has no corresponding test, it is untestable or underspecified.

**Tests ↔ Code**: Tests are executable truth. Code either passes tests or it doesn't. This relationship is deterministic. It is the only deterministic gate in the system.

**Code → Spec** (via Decision Record): Implementation surfaces decisions. Those decisions either align with the spec or reveal it was underspecified. The decision record is the mechanism that captures the discovery and forces the spec and tests to be updated before implementation continues.

### The abstraction hierarchy: Spec vs. Plan

These are distinct and must not be conflated.

| Artifact | Level | Asks | Written in terms of |
|---|---|---|---|
| Specification | Domain | What & Why | Observable system behavior |
| Plan | Implementation | How & In what order | Files, functions, tasks, dependencies |

**Spec is stable(r).** Changes require human judgment and propagate downward.  
**Plan is tactical.** Changes may be made locally by an agent without touching the spec.

### Two types of in-flight discovery

**Spec-level discovery**: The implementation revealed that a spec criterion was ambiguous or incomplete. The implementer cannot proceed without choosing between two valid interpretations. This requires:
1. Surfacing the discovery as a decision gate (human judgment if necessary).
2. Updating the spec.
3. Writing or updating the test.
4. Completing the code.
5. Logging the decision record.

**Plan-level discovery**: The spec is clear, but the task decomposition or dependency ordering was wrong. This requires:
1. Updating the plan (reorder tasks, add a dependency, split a task).
2. No spec change.
3. No test change.
4. Agent can resolve autonomously.

The boundary is the key: spec-level discoveries escalate; plan-level discoveries stay local.

---

## The Decision Record

### What it is

A structured artifact created every time the implementation triangle had to be re-synchronized. It is not:
- A commit message (scoped per commit, not per decision)
- A code comment (local, not topologically connected)
- A changelog (records what changed, not why)
- A TDR (TDRs are architectural decisions made before implementation; Decision Records are discoveries made during implementation)

### Structure

```
Decision #NNN
Trigger: [Which spec criterion or plan task was ambiguous]
Context: [What was being implemented when the gap was discovered]
Options considered:
  A) [Option A]
  B) [Option B]
  C) [Option C]
Chosen: [A/B/C]
Rationale: [Why this option and not the others — this is the critical field]
Spec update: [Which criterion was added or updated]
Test created: [test_name()]
Code: [file + lines + commit]
Supersedes: [Decision #NNN if applicable]
Superseded by: — [filled in if a later decision replaces this one]
```

### Lifecycle

Created once, never deleted. Can be **superseded** — a later decision explicitly references and replaces an earlier one. The full chain is preserved as the archaeological record of how system behavior evolved and why.

### Four-way bidirectional traceability

| From | Query | Answers |
|---|---|---|
| Spec clause | "What decisions shaped this criterion?" | Why the spec says what it says |
| Test | "What decision does this test validate?" | Whether the test is still needed if behavior changes |
| Code | "What decisions are grounded in this function?" | Consequence set before refactoring |
| Decision | "What spec, tests, and code does this touch?" | Full impact surface if reconsidered |

Without bidirectional links, decision records are documentation. With them, they are a constraint graph.

---

## Workflow shape (in Chester terms)

### build-spec
Generates spec with acceptance criteria. At the end, auto-scaffolds test skeletons tied to each criterion — incomplete tests (no assertions yet), named to trace back to the criterion.

```
Spec clause 2.3: "System rejects requests exceeding rate limit with HTTP 429"
↓ auto-generates
test_spec_2_3_rate_limit_exceeds_returns_429_status()
  # assertions not yet written
  pass
```

### build-plan
Decomposes spec into tasks. Each task:
- Traces to one or more spec criteria
- Has code-specific acceptance criteria (files, functions, interfaces)
- Has explicit dependencies

attack-plan and smell-code operate here. Their questions are plan-level, not spec-level: "Are dependencies in the right order? Are there hidden couplings the decomposition missed?"

New concept (not yet in Chester): **decision budget per task** — estimated number of decisions likely to surface. High-budget tasks signal an underspecified area of the spec.

### write-code
Per-task subagents implement. On every commit, the subagent checks:
- Did this task surface any spec-level discovery? If yes → decision gate.
- Did this task surface any plan-level discovery? If yes → update plan, continue.
- Was any spec updated without a corresponding test update? Block commit.

### finish-plan
Coherence audit. Checks:
- Every spec criterion has at least one test.
- Every plan task has code that traces to spec.
- Every decision record has a spec update and a test.
- No undocumented decisions in the implementation.

If drift is detected: classify as auto-fixable (spec and code moved together, tests didn't) or human-judgment gate (spec and code diverged, or decision was made silently).

---

## Open question left at end of conversation

The conversation concluded after clarifying the decision record's role. The following question was left implicit but not fully resolved:

**How does the system distinguish between a "necessary" decision (the spec was genuinely ambiguous) and an "exploratory" one (the agent went off-script without the spec being at fault)?**

This is the validation boundary problem: if the agent makes a decision that wasn't ambiguous — if the spec actually did constrain the behavior and the agent ignored it — the system needs to detect that and treat it differently from a legitimate spec gap. One candidate approach: the spec criterion's test skeleton already exists; if the agent's implementation fails that test, it's off-script, not facing genuine ambiguity.

---

## Relationship to Chester's current architecture

| Chester | Constraint Triangle analog |
|---|---|
| figure-out (Socratic interview) | Spec elicitation phase |
| build-spec | Spec artifact + test scaffold generation |
| build-plan | Plan decomposition with spec traceability |
| attack-plan / smell-code | Plan-level adversarial review |
| write-code (per-task subagents) | Task implementation with decision gate |
| finish-plan | Coherence audit |
| session-reasoning / reasoning-audit | Retrospective capture (post-hoc) |
| PCR | Aggregate-level coherence check across sprints |
| **Missing** | Decision record propagation: spec-level discovery during write-code → spec update → test update → decision log, before task is marked complete |

The gap: Chester's reasoning-audit and session-summary capture what happened, for humans to read after the fact. The decision record is structural and immediate — created at the moment of discovery, immediately updating the spec and test artifacts before the next task begins.
