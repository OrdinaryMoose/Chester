Good material. The dbreunig piece especially surfaces the core structural problem with precision. Here's the synthesis.

---

**How each system designs specifications**

**BMAD** generates spec through a multi-role interview cascade — BA elicits requirements, PM refines them, Architect produces a design doc, Scrum Master breaks it into stories. The crucial distinction is that BMAD forces you through the specification process first, using specialized agents to surface requirements and edge cases before a single line of code is written. The spec is thorough because multiple "roles" probe it from different angles. The failure mode: the role agents add persona overhead that produces exhaustive-feeling documents that can still have silent gaps because no role is adversarial to the spec itself.

**Kiro** is based on Amazon's internal PRD discipline. It takes a basic vibe-coding prompt and expands it into deep technical requirements, a design document with diagrams, and a task list. Community response was mixed — one HN comment was direct: "I like the idea of its spec docs and steering format but found it very underwhelming to try and use them, often they caused more confusion of the AI than functional code."

**GitHub Spec-Kit** is minimalist — requirements → design → tasks, all markdown. Composable, but not opinionated. The "Are you still using SDD?" HN thread noted Spec-Kit had no commits for over a month with no obvious integration with GitHub's new agents work, suggesting possible stagnation.

**Superpowers** treats spec generation as a Socratic brainstorming session. It steps back and asks what you're really trying to do. Once it's teased a spec out of the conversation, it shows it in chunks short enough to actually read and digest. The spec is a conversation artifact that feeds into plan mode — it's good at catching misunderstandings early, but the document itself has no persistent versioning mechanism.

**cc-sdd (gotalab/Kiro)** has the cleanest spec philosophy of the group: the spec is a contract between parts of the system, not a master command document handed to the agent. Code remains the source of truth. This is architecturally sound — it resists the temptation to treat the spec as the authority — but the tooling to enforce that contract boundary is still thin.

---

**The common unresolved frustration: spec/code/test drift**

Every system treats spec generation as a pipeline: clarify → specify → implement. The community has converged on a shared realization that this is the wrong shape.

The biggest learning from the first wave of spec-driven development is that sometimes the spec and tests aren't sufficient. Even with a great spec — "make it run Python perfectly in Rust, here are all the tests, just make them pass" — there are still 20-comment threads about what the right way to implement something is. Because no spec is perfect. Implementing the code helps us improve our spec.

The dbreunig piece frames this as a triangle: spec defines what tests and code to write; tests validate code; but implementation generates new decisions that should feed back into the spec. As each node moves forward, the job is to keep those nodes in sync. If we improve the code, we must improve the spec. None of the current frameworks automate that feedback loop.

A second frustration is captured in the HN thread title itself: "Spec-driven development doesn't work if you're too confused to write the spec." The moment you most need structured spec work is exploratory work — exactly when you're least equipped to produce a quality spec. Superpowers's Socratic approach helps here more than BMAD's role-interview cascade, but neither solves it fully.

A third problem is spec compliance validation. A skill is a suggestion. A tool needs to be a checkpoint. The commit-fail mode is essential — otherwise it gets ignored. Validation needs to be more deterministic. Fuzzy LLM calls are a last resort. Every system currently uses an LLM to check spec compliance — which means the gate itself is probabilistic.

Code generation from spec isn't deterministic; this poses challenges for upgrades and maintenance. Spec drift and hallucination are inherently difficult to avoid. And the question of whether spec or code is the ultimate artifact of software development still needs to be explored — experienced programmers may find that over-formalized specs slow down change and feedback cycles, just as encountered in early waterfall.

---

**Where Chester sits relative to these gaps**

The adversarial planning phase (attack-plan, smell-code) is the closest thing in the field to spec quality validation — it's attempting to pressure-test the plan before implementation rather than after. That's non-trivial. The PCR methodology addresses spec/code drift at the aggregate cadence level, which is closer to the right shape than per-change review.

The gap that's unaddressed in Chester — and in everything else — is the **decision capture loop**: when implementation surfaces a decision that wasn't in the plan, there's no automated mechanism to push that decision back into the spec and update it. The dbreunig approach (capture decisions at commit time, review them, propagate back to spec) is the most interesting partial answer I've seen. The session-reasoning and reasoning-audit skills get at this conceptually, but they're human-readable artifacts rather than spec-updating feedback into the plan doc itself.

The field is essentially waiting for a system where spec, tests, and code are treated as three faces of one artifact rather than a pipeline with a direction.

Right, so the thesis is: spec, tests, and code aren't a pipeline. They're a constraint triangle where each vertex must be kept in sync with the others, and the syncing itself is where the intelligence lives.

Let me walk through the conceptual shape before any implementation.

**The triangle as a mechanical system**

Start with a basic state: you have a spec (what the system should do), tests (how we verify it does that), and code (the implementation). In a waterfall mindset, you write the spec, then tests, then code. In an agile mindset, you iterate them together but usually with code as the primary artifact.

The constraint triangle inverts that: no artifact has authority. They're in tension. If the spec says one thing, the tests expect another, and the code does a third — you have a coherence failure, and the system surfaces it as a delta that needs resolution.

The three relationships that matter:

**Spec-to-Tests**: The spec defines acceptance criteria. Tests are concrete instantiations of those criteria. If a test exists that isn't traceable back to a spec clause, either the spec is incomplete or the test is exploratory and needs to be captured as a new spec clause. If a spec clause has no corresponding test, it's untestable or underspecified.

**Tests-to-Code**: Tests are executable truth. Code either passes tests or it doesn't. But when code passes tests and the tests are correct, code is correct by definition. The relationship is deterministic — unlike LLM-based spec compliance checking.

**Code-to-Spec**: This is the hard one. Implementation surfaces decisions. Those decisions either align with the spec or they don't. If they don't, you have two choices: update the code to match the spec, or update the spec to reflect what the code revealed. The system must make that choice explicit.

**How the feedback loop works**

Let's say you're implementing a rate limiter. The spec says "reject requests exceeding 100 per minute." The test is straightforward: send 101 requests in 60 seconds, expect the 101st to fail. You implement it.

During implementation, the developer (or agent) realizes: "What happens to the 101st request? Do we queue it? Return 429 immediately? Retry after a delay? The spec doesn't say."

In a pipeline system, the agent picks one and moves forward. In a constraint triangle, the agent surfaces this as a decision point:

- **Option A**: Update the spec to say "return 429 immediately" and write a test for that behavior.
- **Option B**: Implement queuing, update the spec to match, and write the new test.
- **Option C**: Recognize this is out of scope, document it as a known limitation, and update the spec to reflect that boundary.

The system doesn't let you move forward until you've explicitly chosen one and the spec, tests, and code are back in sync.

**The decision log as the integrating artifact**

Here's the mechanism: every time the code surfaces a decision the spec didn't anticipate, you capture it in a decision log with:

1. **The decision itself**: "Rate limiter returns 429 on limit exceeded, no queuing."
2. **Why it was necessary**: "The spec did not specify rejection behavior."
3. **The spec change it triggered**: "Acceptance criterion 2.3 updated to specify 429 response."
4. **The test it triggered**: "test_rate_limit_exceeds_returns_429_immediately."
5. **The code that implements it**: Pointer to the commit.

That decision log is the connective tissue. It's not prose — it's structured. Each decision is addressable, traceable, and bidirectional.

**From the spec side**: If you're a human reviewer reading the spec six months later and wondering why the code does something, you can ask the system: "Show me the decisions that led to this clause." The system walks you through the chain.

**From the code side**: If you're refactoring and considering changing a behavior, the system warns you: "This line of code is grounded in Decision #47. Changing it requires updating the test at #47b and the spec clause it traces to."

**From the test side**: If a test fails, the system doesn't just say "test failed." It says "test_rate_limit_exceeds_returns_429 failed. This validates Decision #47. The spec clause it maps to is 2.3. The code it tests is in ratelimiter.rs line 45. Want to see what changed?"

**The validation gates**

You have three types of validation, and they're asymmetric:

1. **Code-to-Test**: Deterministic. Tests pass or fail. Non-negotiable. If tests fail, code is wrong.

2. **Spec-to-Test**: Structural. "Does every acceptance criterion in the spec have at least one corresponding test?" Use deterministic code parsing where possible (test name conventions, annotations, traceback attributes), not LLM judgment. If a criterion is untestable, that's a spec problem.

3. **Spec-to-Code**: Probabilistic checkpoint. Use an LLM to check rough alignment, but only as a pressure-test, not a gate. The gate is the decision log: "Has every structural decision made during implementation been captured in a decision log with a traced spec update and test?" If not, the system blocks forward movement and asks for clarification.

**The asymmetry matters**: Code truth is deterministic. Tests are deterministic. The spec is the artifact that's allowed to be approximate — but approximation is only allowed if the gaps are documented as explicit decisions.

**Operational shape**

Now, how does this actually work as a workflow?

**Phase 1: Specification with forward-looking test scaffolding**

You write a spec. As you write each acceptance criterion, the system auto-generates a test skeleton with a name that traces back to the criterion. The test is incomplete — it has the structure but not the assertions — but it exists and it's named in a way that's searchable from the spec.

```
Spec clause 2.3: "System rejects requests exceeding rate limit with HTTP 429"
↓ (auto-generates)
Test skeleton: test_spec_2_3_rate_limit_exceeds_returns_429_status()
  # Assertions not yet written; passes vacuously
  pass
```

This is different from writing tests first — you're not test-driving from a blank slate. You're scaffolding tests against a spec you've already thought through.

**Phase 2: Implementation with decision capture**

The agent (or developer) implements. When they hit a point where the spec doesn't fully constrain behavior, they surface a decision:

```
Decision: How should the system handle requests that exceed the rate limit?
Current spec: "reject with HTTP 429"
Chosen: Return 429 immediately; do not queue
Reason: Queuing would require distributed state beyond current architecture scope
Spec update: Criterion 2.3 → "System returns HTTP 429 immediately without queuing"
Test update: Complete test_spec_2_3_rate_limit_exceeds_returns_429_status() with assertion
             Add new test: test_rate_limit_no_queuing_behavior()
Code commit: Links to Decision #47
```

The system validates:
- The decision is necessary (the spec genuinely didn't constrain it).
- The spec was actually updated.
- A test was written for the new decision.
- The code matches both the spec and the test.

Only then does the commit go through.

**Phase 3: Review as decision review**

Code review isn't "does this code look good?" It's "do these decisions make sense?" A reviewer sees:

```
Decision #47: Rate limiter returns 429 immediately
  Spec clause: 2.3
  Test: test_rate_limit_no_queuing_behavior
  Code: ratelimiter.rs#89–102
  
Reviewer response: [APPROVE] | [REJECT] | [MODIFY]
  
If REJECT: "This violates the queueing architecture we discussed in the PRD."
  → System rolls back decision, spec update, test, and code changes.
  → Agent re-proposes with a different decision (e.g., queueing *is* in scope).
  
If MODIFY: "Keep the decision, but update the test to also check error message format."
  → Test updated, spec clause refined, decision unchanged.
```

**Phase 4: Long-term coherence checking (PCR-ish)**

Over time, specs drift from code. The decision log is your archaeology. Every N sprints, you run a coherence audit:

```
Spec clause 2.3 says: "Return 429 immediately without queuing"
Code does: Return 429 with exponential backoff (modified in Sprint 045)
Test expects: 429 with no backoff
Decision log shows: Decision #47 (no queuing) was modified by Decision #104 (backoff added)
Status: DRIFT DETECTED

Was Decision #104 approved? NO
Was the spec updated to reflect the backoff? NO
Was the test updated? PARTIALLY (backoff tested but not documented)

Coherence failure. Requires human judgment gate:
  A) Revert Decision #104 (backoff removal)
  B) Approve Decision #104 retroactively (update spec, fully test backoff behavior)
  C) Update decision record to show Decision #104 superseded #47 (document rationale)
```

---

**Where Chester would fit**

**figure-out phase**: Socratic interview generating the initial spec. The spec skeleton auto-generates test scaffolds at the end.

**build-spec phase**: Spec is refined. Any decision point about testability is surfaced: "Criterion X cannot be tested without Y. Should we scope Y in or mark this as a limitation?" Human judgment gate.

**build-plan phase**: Plan is a list of tasks, each tied to spec clauses or decisions. attack-plan and smell-code are pressure-testing the plan. **New**: Each task has a decision budget — "this task will likely surface N decisions." If N > expected, that's a signal the spec was underspecified.

**write-code phase**: Per-task subagents implement. Every commit includes decision log entry. If a decision is surface and the agent can't autonomously complete the spec-test-code sync cycle, it bubbles to a human decision point.

**finish-plan phase**: Runs the coherence audit. If spec/code/test drift is detected, it's either fixed automatically (vacuous drift — the spec and code both changed in sync but tests didn't), or it escalates to a human judgment gate.

---

**The core trade-off**

This system requires discipline. You can't just vibe-code anymore — every decision is captured and every capture has a cost (a decision record, a spec update, a test). 

But the payoff is: six months later when someone asks "why does the rate limiter do X?", you don't have to archaeology the codebase. The decision log is the answer. And if you want to change X, the system tells you *exactly* what has to change in parallel: the spec clause, the test, the code, and the decision record.

That's the constraint triangle at work. It's slower than vibe coding at the moment of implementation, but it's dramatically faster at the moment of understanding, review, and change.

Does that shape make sense? The mechanical part that's still open: how do you decide when a decision is "necessary" (spec genuinely ambiguous) versus "exploratory" (agent went off-script)?

Right. This is where the abstraction layers matter. Let me clarify the hierarchy because spec and plan are doing different work at different scales.

**The abstraction stack**

**Specification** is the *what* and *why* at the domain level. "A rate limiter rejects requests exceeding 100 per minute and returns HTTP 429." That's a statement about the system's observable behavior, written in terms a domain expert would use. It's not concerned with how many functions you write or which data structures you pick.

**Plan** is the *how* at the implementation level. It breaks the spec into atomic tasks, each executable in isolation. "Task 1: Create RateLimiter struct with window-tracking logic. Task 2: Implement the rejection handler. Task 3: Wire it into the request pipeline." Each task has acceptance criteria that are *code-specific* — they reference files, functions, interfaces.

The spec says what the system should do. The plan says which pieces you're building and in what order to build them.

**The feedback loop now has two levels**

When you implement a task, you can discover something at two different granularities:

**Level 1: Specification-level discovery** — "The spec said 'reject requests,' but it didn't say what happens to queued requests, concurrent retries, or TLS renegotiations during rate limiting." This is a gap in the *domain-level* understanding. It requires a spec update because it changes what the system is supposed to do, not just how it's built.

**Level 2: Plan-level discovery** — "The spec is clear: reject with 429. But when I tried to implement the window-tracking struct, I realized the way I'm partitioning state across tasks creates a race condition. I need to reorder Task 2 and Task 3, or add a synchronization task between them." This is a gap in the *implementation strategy*, not the spec. It requires a plan update.

The distinction is crucial. A spec change affects *all* tasks. A plan change affects only the tasks below it in the dependency graph.

**Concrete example: rate limiter**

**Specification** (domain-level):
```
Acceptance Criterion 2.3:
  Given: A client sends requests at 150/minute
  When: The system applies a 100/minute rate limit
  Then: Requests 101–150 receive HTTP 429 responses

Acceptance Criterion 2.4:
  Given: A 429 response is sent
  When: The client retries the request
  Then: The retry is subject to the same rate limit (not exempted)

Acceptance Criterion 2.5:
  Given: The rate limit window rolls over (60-second boundary)
  When: A new request arrives
  Then: The request counter resets and the request is allowed
```

These are written in domain language. A product manager and a domain expert can read and validate these.

**Plan** (implementation-level):
```
Task 1: Create RateLimiter struct
  - File: src/ratelimiter.rs
  - Responsibility: Maintain per-client request counts and window boundaries
  - Acceptance: struct can track 1000+ concurrent clients, window resets at 60s boundary
  - Depends on: Nothing
  - Traces to Spec: 2.3, 2.5

Task 2: Implement request rejection handler
  - File: src/handlers/rate_limit_reject.rs
  - Responsibility: Return HTTP 429 with appropriate headers
  - Acceptance: 429 response includes Retry-After header; response time < 1ms
  - Depends on: Task 1
  - Traces to Spec: 2.3

Task 3: Integrate rate limiter into request pipeline
  - File: src/middleware/mod.rs
  - Responsibility: Apply rate limiter before business logic
  - Acceptance: Every request (including retries) passes through rate limiter; no exceptions
  - Depends on: Task 1, Task 2
  - Traces to Spec: 2.3, 2.4

Task 4: Add clock synchronization for distributed systems (if applicable)
  - File: src/distributed/clock_sync.rs
  - Responsibility: Ensure window boundaries are aligned across servers
  - Acceptance: All servers within 1ms of wall clock; no clock drift > 100ms
  - Depends on: Task 1
  - Traces to Spec: 2.5
```

Notice: Each task traces back to one or more spec criteria. The plan is the *decomposition* of the spec into executable pieces.

**Now: What happens when you implement?**

**Scenario 1: Spec-level discovery during Task 1**

Implementer is building the RateLimiter struct. They realize:
- The spec says "100 per minute" but doesn't say how to count: does a request that straddles the 60-second boundary count toward the old window or the new one?

This is a **spec discovery**. The spec was incomplete. Two paths forward:

**Path A**: Update the spec.
```
New Acceptance Criterion 2.3a:
  Given: A request arrives 59.5 seconds into the current window
  When: Processing takes 0.7 seconds
  Then: The request is counted against the current window
  (Rationale: Window is closed at the 60-second mark, not at request completion)

Impact: 
  - This changes what Task 1 must implement (window enforcement logic)
  - This requires a new test: test_request_spanning_window_boundary()
  - Tasks 2, 3 are unaffected (they still call RateLimiter.check())
```

**Path B**: Mark as out-of-scope.
```
Spec Limitation 2.3b:
  The system does not specify request boundary behavior at window transitions.
  Current implementation: Counts against the window in which the request begins.
  This is a known limitation; changing it requires architectural changes.
```

Either way, the spec is updated. The decision log captures why. The test is written or documented as a limitation.

**Scenario 2: Plan-level discovery during Task 3**

Implementer is integrating the rate limiter into the middleware. They discover:
- The current plan has Task 3 depending on Task 1 and Task 2 in parallel.
- But when Task 2 writes the 429 response, it needs to access the RateLimiter state from Task 1 to include the Retry-After header value.
- This means Task 2 actually needs to complete before Task 3 can proceed.

This is a **plan discovery**. The spec is still correct — "return 429 with appropriate headers." The plan was just wrong about the dependency graph.

```
Plan Update:
  Task 3 dependency: Task 1, Task 2 (serialized, not parallel)
  
  Rationale: The Retry-After header must reflect the RateLimiter's internal window state,
  which is computed in Task 1 and read in Task 2. Task 3 can proceed once Task 2 is done.
  
  Impact: The plan is slower by the duration of Task 2, but no spec changes.
          Tests remain unchanged; they still validate the same observable behavior.
          Code review focuses on the reordering logic, not spec compliance.
```

The spec is untouched. Tests are untouched. Only the plan ordering changes.

**The three feedback channels**

Now you can see how they're distinct:

**Spec → Plan feedback**: "The spec revealed an ambiguity. We updated the spec to clarify it. Now the plan must account for this clarification."
```
Example: If we add Criterion 2.3a above, Task 1 now has new acceptance criteria
(window boundary logic). The plan might need a subtask: "1a: Implement window boundary detection."
```

**Plan → Implementation feedback**: "The plan was theoretically sound, but implementation revealed a dependency or order constraint the plan didn't capture."
```
Example: The serialization of Task 2 and Task 3 means the critical path is longer.
But this doesn't change *what* the code does, only *when* it's done.
```

**Implementation → Spec feedback** (via decision log): "The code revealed something the spec should have said."
```
Example: When you implement Task 1, you discover that window boundary behavior matters.
This surfaces as a decision, triggers a spec update, triggers a test, traces back to code.
```

**The feedback loop diagram**

```
Specification (domain-level)
    ↓ (decompose)
Plan (implementation strategy)
    ↓ (execute tasks)
Code (actual behavior)
    ↓ (implement & discover)
Decision Log (what was learned)
    ↓ (spec-level discoveries flow back)
Specification (refined)
    ↑ (plan must adapt)
Plan (updated dependencies)
```

Contrast this with a simpler feedback loop:

```
Spec → Plan → Code → (test fails) → Code modified → Done
```

In the simple loop, there's no mechanism to capture that the original spec was incomplete. You just fix the code and move on. Six months later, someone asks "why does the rate limiter handle window boundaries this way?" and the answer is lost.

In the constraint triangle with decision logs, the answer is in the decision log. And if you want to change that behavior, the system warns you that Criterion 2.3a and tests test_request_spanning_window_boundary() will also need updates.

**How this shapes the workflow in Chester terms**

**build-spec**: Generates spec with acceptance criteria. Auto-scaffolds test skeletons tied to each criterion.

**build-plan**: Decomposes spec into tasks. Each task traces back to spec criteria. attack-plan and smell-code ask: "Are the dependencies in the right order? Are there hidden dependencies the decomposition missed?" These are plan-level questions, not spec questions.

**write-code**: Tasks execute. When a task implementer surfaces a discovery:
- **If it's spec-level** (acceptance criterion was ambiguous): Block the commit. Escalate to a decision gate. Spec updated → Plan updated → Implementation continues.
- **If it's plan-level** (dependency order, task decomposition was wrong): The subagent can fix the plan locally. Update the plan, re-order dependent tasks, continue. No spec change.

**finish-plan**: Runs coherence audit. Checks:
- Do all spec criteria have corresponding tests?
- Do all plan tasks have code that traces back to spec?
- Are there decisions in the log that updated specs but the tests don't reflect them?

**The key insight**

Spec and plan are in a **hierarchy**, not a loop. Spec is stable(r); plan is tactical. Discoveries at the spec level propagate down and force plan changes. Discoveries at the plan level stay local and don't touch the spec.

This is why PCR works at the aggregate level — you're checking that the hierarchy stayed coherent over many sprints. A single task might have plan-only changes (reorder subtasks). But if multiple tasks across multiple sprints are all updating the same spec clause, that's a signal the spec was underspecified from the start, and you need to dig into why the discovery process didn't surface it earlier.

Does that clarify how spec, plan, code, and feedback coexist?

The decision record is the artifact that sits orthogonal to the triangle. It's not part of the spec, not part of the plan, not part the code or tests. It's the audit trail of every moment the triangle had to be re-synchronized.

**What triggers one**

Not every line of code. Not every task. A decision record is triggered precisely when the implementer reaches a point where two or more valid implementations exist and the spec, plan, and tests don't determine which one to choose. That's the signal: ambiguity that the existing artifacts couldn't resolve. If the implementation follows directly from the spec and plan, no decision record is needed. The code is just the code.

**What distinguishes it from a TDR**

TDRs are architectural decisions made *before* implementation — structural, high-stakes, made with deliberation. "We will use SQLite. We will use event sourcing. We will treat canonical form as the internal intermediary." Those are settled in advance and govern everything below them.

Decision records are *discoveries* made *during* implementation — things you couldn't know until you tried to build it. "I didn't realize the window boundary behavior would matter until I was actually writing the struct." You can't TDR your way out of that. It surfaces during execution.

The distinction: TDRs narrow the design space before you enter it. Decision records capture what you learned about the remaining space once you were inside it.

**Structure**

The record is structured, not prose. Each one has:

```
Decision #047
Trigger: Spec 2.3 did not constrain window boundary behavior
Context: Implementing RateLimiter struct; request spanning a window boundary ambiguous
Options considered:
  A) Count against the window the request begins in
  B) Count against the window the request completes in
  C) Split the request across both windows (pro-rated)
Chosen: A
Rationale: Options B and C require knowing request duration at request-start time,
           which is not available without async tracking. Out of scope for current architecture.
Spec update: Criterion 2.3a added — window is determined at request arrival time
Test created: test_request_spanning_window_boundary_counted_against_start_window()
Code: ratelimiter.rs lines 89–102, commit a7f3c12
Supersedes: —
Superseded by: —
```

Every field matters. The "options considered" field is the one most systems skip — it's the most valuable. It records what you *didn't* choose and why, which is exactly the knowledge that vanishes when engineers leave or memories fade.

**Lifecycle**

A decision record is created once and persists. It can be superseded — if a later sprint chooses a different behavior, a new record is created that explicitly references and supersedes the earlier one. The earlier record is never deleted. That chain is the archaeological record of how the system's behavior evolved and why.

When Decision #104 (adding exponential backoff) supersedes Decision #047 (returning 429 immediately), the system can surface that chain when someone asks "why does the rate limiter do backoff now?" The answer is: Decision #047 → Decision #104. Here's why #047 was right at the time, here's why #104 was necessary later.

**The four-way traceability**

What makes the decision record meaningful rather than just documentation is that the links are bidirectional and traversable in all four directions:

From a **spec clause**: "Show me all decisions that contributed to this criterion." Tells you why the spec says what it says.

From a **test**: "What decision does this test exist to validate?" Tells you whether the test is still necessary if the behavior changes.

From **code**: "What decisions are grounded in this function?" Warns you before you refactor that this behavior was deliberately chosen, not incidental.

From a **decision**: "What spec, tests, and code does this decision touch?" Gives you the full impact surface if the decision is reconsidered.

Without bidirectional links, decision records are just narrative. With them, they become a constraint graph — touching any node in the graph surfaces the full consequence set.

**What it isn't**

It's not a commit message. Commit messages are per-commit, not per-decision — one commit might contain code from three decisions, or one decision might span multiple commits. Coupling decisions to commits loses the semantic boundary.

It's not a comment in code. Comments are local to a line. A decision can touch code in five different files, a spec clause, and two tests. Comments can't represent that topology.

It's not a changelog. Changelogs record *what changed*. Decision records record *why* — which is the part that's always missing when you need it most.

**Where it lives in Chester terms**

Chester currently has reasoning-audit and session-reasoning, which are retrospective — they capture how the agent reasoned after the fact, for a human to read. The decision record is prospective and structural — it's created in the moment of discovery, and it feeds back into the spec and test artifacts immediately, not just into a human-readable summary.

The session-summary captures "what happened this sprint." The decision log captures "why the system behaves the way it does, forever." Those are very different time horizons.

The gap in Chester right now: there's no mechanism to take a decision made during write-code and propagate it back to update the spec and scaffold a new test before the task is marked complete. That propagation is what makes the triangle self-correcting rather than just descriptive.
