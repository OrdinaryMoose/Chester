# Agentic Skill Frameworks for AI Coding Agents
## Industry Survey Report

**Date:** April 2026  
**Scope:** Structured specification and workflow frameworks for Claude Code and adjacent AI coding agents  
**Purpose:** Survey the landscape of agentic skill systems, evaluate their specification design approaches, synthesise community feedback, and identify common unresolved failure modes

---

## Executive Summary

The AI coding agent ecosystem has matured rapidly since Anthropic's introduction of Claude Code and its native skills infrastructure. A distinct category of tooling has emerged: agentic skill frameworks that impose structured workflows on AI coding agents rather than letting them improvise approach on every task. These frameworks share a common motivation — the "vibe coding" failure mode, where agents jump directly to code without understanding requirements — but diverge significantly in methodology, ceremony level, and specification design.

This survey covers eight major frameworks and several secondary systems, evaluates them on their specification design quality, and synthesises community feedback collected from Hacker News discussions, practitioner blogs, and engineering teams. The central finding is that while these frameworks successfully solve the problem of undisciplined code generation, they share a common unresolved failure: **specification drift**. Specifications are generated at the start of a workflow and become progressively stale as implementation surfaces decisions the specification did not anticipate. No current framework has a robust mechanism for keeping specification, tests, and code in sync over the life of a project.

---

## Background: The Problem Being Solved

Before evaluating the frameworks, it is worth stating precisely what problem they address.

Unguided AI coding agents exhibit a characteristic failure pattern: they begin writing code before the problem is understood, make confident assumptions about requirements, build on those assumptions through dozens of tool calls, and produce output that requires significant rework when the assumptions are discovered to be wrong. This failure is not a model intelligence problem — it is a process problem. The model is capable of good engineering judgment; it simply has no framework telling it to apply that judgment before reaching for the keyboard.

The practitioner community has named this "vibe coding": development by feel, iterating on output rather than reasoning about requirements. The cost is high. Rework at the implementation stage is dramatically more expensive than rework at the specification stage, in both token cost and human attention.

Agentic skill frameworks address this by injecting structured process into the agent's context at session start. The agent is taught to follow a defined methodology: clarify requirements, write a specification, plan the work, implement against the plan, verify the output. Different frameworks implement this at different levels of formality, but the core intervention is the same — slow the agent down before it starts writing code.

---

## Framework Survey

### 1. Superpowers

**Author:** Jesse Vincent (obra)  
**Installation:** Claude Code plugin marketplace  
**Position:** Dominant framework; most widely adopted in the ecosystem

**Overview**

Superpowers is the reference implementation for Claude Code skill frameworks. It installs fourteen structured skills that auto-trigger at session start via a CLAUDE.md-compatible layer. The core methodology is a five-phase discipline: clarify → design → plan → code → verify.

**Specification design**

Superpowers generates specifications through a Socratic brainstorming session. When a user describes what they want to build, the brainstorming skill does not accept the description at face value. It asks clarifying questions, explores alternatives, and presents the emerging design in chunks that the user can review and approve before the design is finalised. The approved design document is saved and used as the input to the planning phase.

The specification is a conversation artifact — it emerges from dialogue rather than being generated top-down. This is well-suited to situations where the user has a rough idea but has not fully thought through the requirements. The Socratic method surfaces unstated assumptions.

**Strengths**

The brainstorming skill is effective at preventing the most common failure mode: accepting a vague prompt and treating it as a complete specification. The mandatory TDD enforcement (code written before a failing test exists is deleted) is a hard quality gate that most frameworks implement only loosely. The two-stage code review — spec compliance first, code quality second — provides structured validation at the task level.

**Weaknesses**

The specification is a design document, not a structured artifact. It is not machine-readable in a way that allows automated traceability between criteria and tests. Once the specification is written and the implementation begins, there is no mechanism for propagating implementation discoveries back into the specification. If the agent discovers during Task 3 that the Task 1 specification was ambiguous, that discovery is not captured in a way that updates the specification; it is handled locally and the specification remains stale.

**Community reception**

Superpowers is the most starred framework in the Claude Code ecosystem and is widely discussed positively. Practitioners report meaningful reductions in "style-related retries" and improved first-attempt quality. The most common criticism is that the mandatory quality gates can feel slow on tasks where the user already has a clear understanding of requirements.

---

### 2. BMAD Method

**Author:** BMad Code Organization  
**Position:** Most feature-complete framework; heaviest ceremony

**Overview**

BMAD (Breakthrough Method for Agile AI-Driven Development) simulates an entire agile development team using specialised role agents. Nine agents are defined: Business Analyst, Product Manager, UX Designer, System Architect, Scrum Master, Developer, QA Engineer, Tech Writer, and a Solo Developer aggregate role for smaller projects. Over 26 guided workflows are available. The framework is described as the most complete SDD framework available, with multi-agent collaboration, scale-adaptive workflows, and cross-domain applicability.

**Specification design**

BMAD generates specifications through a multi-role interview cascade. The Business Analyst probes for requirements and edge cases. The Product Manager refines scope and priority. The Architect produces a design document with system diagrams. The Scrum Master decomposes the design into sprint-sized stories. Each role approaches the specification from a different angle, producing a document more comprehensive than any single-role interview would generate.

This is BMAD's strongest differentiator. The multi-angle specification process catches gaps that single-agent brainstorming misses because different roles are trained to ask different questions. A BA might catch a missing regulatory requirement that an Architect would never think to ask about.

**Strengths**

Specification completeness. For complex, multi-stakeholder systems — particularly enterprise systems with compliance, performance, and integration requirements — BMAD's multi-role cascade produces substantially more thorough specifications than simpler frameworks. The framework is also explicitly designed for team use, with role assignments that map to human team members.

**Weaknesses**

Ceremony overhead. The role agent personas add significant token cost and session time. A solo developer building a personal project does not need a Business Analyst, Scrum Master, and Tech Writer to produce a working feature. This overhead was identified by practitioners as a significant friction point, and GSD (described below) was explicitly created as a reaction to BMAD's perceived complexity. The role personas can also produce an illusion of thoroughness — a document that looks comprehensive but contains gaps because the role agents are generating plausible-sounding content rather than genuinely interrogating the domain.

The migration from custom workflow format to native SKILL.md format was ongoing at time of survey, creating some fragmentation between the official methodology and its Claude Code implementations.

**Community reception**

BMAD is respected as the thorough option but frequently cited as over-engineered for individual developers. Practitioners with complex, multi-stakeholder systems report strong results. Solo developers typically drop most of the role agents and use a subset of the workflows, which undermines the framework's core value proposition.

---

### 3. GitHub Spec-Kit

**Author:** GitHub  
**Position:** Official, minimal, composable

**Overview**

Spec-Kit is GitHub's official specification-driven development framework. It implements a three-phase workflow: requirements (`/speckit.specify`) → plan generation (`/speckit.plan`) → implementation (`/speckit.implement`). The framework is intentionally minimal and designed to be composed with other systems.

**Specification design**

Spec-Kit generates three document types: a requirements document (functional and non-functional requirements, acceptance criteria), a design document (architecture, component interactions, data models), and a tasks document (implementation plan with dependencies). Documents are markdown files stored in the repository. The specify command prompts the agent to elicit requirements through structured questions and populate the requirements document.

The specification approach is clean and well-structured. The three-document model is appropriate for most development work, and the documents are human-readable. Spec-Kit's design philosophy is minimal enough that it does not impose constraints on how the documents are formatted, giving teams flexibility.

**Strengths**

Composability. Spec-Kit is designed to be extended. The rhuss/cc-sdd framework (described below) adds quality gates, git worktree isolation, and parallel agent execution as composable traits over Spec-Kit's core commands. The framework's minimalism makes it a good foundation for teams that want to build their own methodology on top.

**Weaknesses**

The framework showed no commits for over a month at time of survey, with no obvious integration with GitHub's newer agents platform — noted by community members as a potential signal of declining investment. Spec-Kit's minimalism is also a limitation: it provides structure without guidance. Teams that have not done specification-driven development before will find it provides less scaffolding than BMAD or Superpowers.

**Community reception**

Practitioners using Spec-Kit report reliable results, particularly for brownfield development (existing codebases). The community question of whether Spec-Kit was being actively maintained was unresolved at time of survey. Direct feedback from practitioners who used both Spec-Kit and straight prompting reported that as their own ability to break down and describe work improved, straight prompting re-emerged as viable for simple changes — suggesting Spec-Kit's value is highest for complex or poorly-understood work.

---

### 4. Kiro

**Author:** Amazon (AWS)  
**Position:** IDE-native, spec-as-steering, Amazon internal methodology origin

**Overview**

Kiro is an agentic IDE from Amazon, distinct from the other frameworks in being a full development environment rather than a plugin or skills layer. Its specification methodology is based on Amazon's internal processes for large technical projects — the same tradition that produced Working Backwards and the six-page narrative memo.

**Specification design**

Kiro takes a vague prompt and expands it into three documents: a deep technical requirements document, a design document with architecture diagrams, and a task list. The requirements document is structured around Amazon's internal PRD format. Kiro also introduces "steering documents" — persistent files that guide agent behaviour across sessions, covering project context, architectural constraints, and coding standards.

The Kiro methodology assumes that the right approach is to expand a low-fidelity input into a high-fidelity specification, then hand that specification to an agent for implementation. This is well-suited to situations where the developer has a clear vision but has not yet formalised it. It does less well when the vision is not clear, because the expansion step amplifies rather than interrogates ambiguity.

**Strengths**

The Amazon PRD structure is battle-tested for large, complex systems. For developers who have worked in environments where thorough PRDs are standard, Kiro feels natural. The steering document mechanism provides a useful layer of persistent context that other frameworks do not have.

**Weaknesses**

Community feedback was mixed. One Hacker News commenter noted directly: "I like the idea of its spec docs and steering format but found it very underwhelming to try and use them, often they caused more confusion of the AI than functional code." The expansion step can produce documents that are too dense or over-specified for the problem at hand, and the agent struggles to extract actionable implementation direction from them. As a paid IDE rather than an open plugin, Kiro is also less accessible to individual developers and less composable with other tools.

---

### 5. cc-sdd (gotalab / Kiro-derived)

**Author:** gotalab  
**Position:** Spec-as-contract; clean decomposition philosophy

**Overview**

A specification-driven harness built on Kiro's methodology, packaged as seventeen on-demand skills for Claude Code and multiple other coding agents. The framework emphasises a specific philosophical position about the relationship between spec and code.

**Specification design**

The gotalab cc-sdd framework states its philosophy explicitly: the spec is a contract between parts of the system, not a master command document handed to the agent. Code remains the source of truth. This is an important distinction from other frameworks, where the specification is treated as the authoritative document that the code must match. In cc-sdd, the specification defines the interfaces and boundaries between components; the implementation detail within those boundaries belongs to the code.

This is architecturally sound. When the specification owns too much detail, it becomes brittle — any implementation decision that was not anticipated requires a specification update. When the specification owns only the contract (the observable behaviour at component boundaries), implementation can evolve freely within those boundaries without invalidating the specification.

The workflow is: discovery → spec-requirements → spec-design → spec-tasks → autonomous implementation. Each phase gates the next. The implementation phase uses per-task subagent dispatch, independent reviewer pass, and auto-debug on failure.

**Strengths**

The cleanest conceptual framework for the spec-code relationship in the survey. The contract orientation prevents the specification from becoming over-specified. The progressive disclosure of seventeen skills (loaded on demand) keeps context overhead low.

**Weaknesses**

The tooling to enforce the contract boundary is thin. The framework states the philosophy but does not mechanically prevent developers from putting implementation detail into the specification or from letting implementation decisions go undocumented when they cross contract boundaries.

**Community reception**

Less widely adopted than Superpowers or BMAD, but well-regarded by practitioners who engage with it. The cross-platform support (Claude Code, Codex, Cursor, Copilot, Windsurf, OpenCode, Gemini CLI, Antigravity) is a practical advantage for teams using multiple agents.

---

### 6. cc-sdd (rhuss / Spec-Kit overlay)

**Author:** rhuss  
**Position:** Composable trait layer over Spec-Kit

**Overview**

A different project sharing the cc-sdd name, this framework wraps GitHub Spec-Kit with composable "traits" — cross-cutting behaviours that layer over Spec-Kit's core commands without modifying them. The trait model is analogous to aspect-oriented programming applied to Claude Code plugins.

**Specification design**

The specification design is inherited from Spec-Kit. The rhuss cc-sdd layer adds:

- **superpowers trait**: Quality gates injected into Spec-Kit commands. `/speckit.specify` gains automatic spec review after creation. `/speckit.plan` gains spec validation before planning and consistency checks after. `/speckit.implement` gains code review and verification gates.
- **worktrees trait**: Git worktree isolation for feature development, with the specification branch isolated from main.
- **teams trait** (experimental): Parallel implementation via Claude Code Agent Teams with spec guardian review.

The framework also adds commands Spec-Kit does not cover: interactive brainstorming, spec/code drift detection, and review workflows.

**Strengths**

The trait composition model is elegant. Concerns stay separated — quality gates are a trait, worktree isolation is a trait, parallelism is a trait. Each can be enabled or disabled independently. This is the most composable approach in the survey and the most respectful of existing tools.

The drift detection command (`/sdd:evolve`) is the closest any framework comes to addressing the spec/code sync problem explicitly. It reconciles spec and code when drift is detected, choosing either to update the spec to match the code or update the code to match the spec.

**Weaknesses**

Complexity of the composition model. Understanding which traits are active and how they interact requires careful configuration management. The experimental status of the teams trait limits its usefulness for parallel implementation. The framework is also less discoverable than Superpowers or BMAD.

---

### 7. GSD (Get Shit Done)

**Author:** TACHES  
**Position:** Minimalist; explicit anti-ceremony reaction

**Overview**

GSD was created explicitly as a reaction to BMAD's and Spec-Kit's perceived complexity. The author's motivation statement: "I'm a solo developer. I don't write code — Claude Code does. But other SDD tools seem to complicate everything with sprint ceremonies, story points, retrospectives and Jira workflows."

**Specification design**

GSD's specification is minimal by design. It focuses the developer on the outcome rather than the process. The primary constraint mechanism is structural rather than documentary: a maximum of three tasks per plan, each task executed in a fresh subagent with a clean 200k context window, one git commit per task.

This approach treats context decay as the primary threat to implementation quality. Rather than generating a comprehensive specification and hoping the agent can maintain alignment with it over a long session, GSD keeps sessions short enough that context loss becomes irrelevant. Each task is small enough to be held fully in a single agent's context.

**Strengths**

Practical and accessible. The context-rot avoidance strategy is sound engineering — many specification quality problems are actually context management problems in disguise. The git-centric approach (one commit per task) produces a clean, auditable history. Zero configuration burden.

**Weaknesses**

Specification quality depends almost entirely on the developer's ability to decompose work into clear three-task chunks. For genuinely complex or poorly-understood domains, this is insufficient — the work of understanding requirements is outsourced to the developer, which is exactly the work that frameworks like BMAD and Superpowers are trying to assist with. GSD is most effective for experienced developers who already know what they want to build.

**Community reception**

Well-received by solo developers and practitioners working in well-understood domains. Less suitable for team contexts or exploratory development.

---

### 8. Ralph Loop

**Author:** Various community implementations  
**Position:** Autonomous convergence loop; minimal gates

**Overview**

Ralph is less a framework than a pattern: run an AI coding agent in an automated loop until the specification is fulfilled. The agent iterates — implement, test, observe failures, adjust, re-implement — until all tests pass. Human intervention is minimal; the loop runs to convergence.

**Specification design**

The Ralph pattern inverts the relationship between specification and implementation. Rather than using the specification as the input that guides code generation, Ralph uses the specification as the success criterion that terminates the loop. This means the specification must be machine-verifiable — typically expressed as a test suite that the agent can run and observe.

The famous "whenwords" project (a no-code library by dbreunig) demonstrated this pattern at small scale: a markdown spec and 750 YAML conformance tests, run against Claude Code via the Ralph pattern, produced a working library without hand-written code.

**Strengths**

Eliminates process overhead. If you have a clear, complete, machine-verifiable specification, the Ralph loop is the most efficient way to implement it. The test suite is the specification. The loop is the implementation process.

**Weaknesses**

The specification must be machine-verifiable. For most real-world software development, acceptance criteria involve UX quality, integration behaviour, performance under load, and other properties that are difficult to express as automated pass/fail tests. Ralph works well for libraries and algorithms; it works poorly for applications.

The dbreunig analysis also surfaced the limits of this pattern at scale: even with a near-complete test suite, the last few percent of failures reveal systemic architectural issues that require structural thinking, not local patch application. The loop can converge on a fragile implementation that passes tests but will not hold under extension.

---

## Secondary Systems

Several additional frameworks were identified that represent emerging patterns:

**ContextKit** — a 4-phase planning methodology with specialised quality agents. Early-stage but conceptually aligned with the constraint triangle approach.

**Simone** — a project management workflow encompassing documents, guidelines, and processes for multi-session project planning. Closer to project management tooling than a skill framework.

**Harness** — a meta-skill that designs domain-specific agent teams and generates the skills those teams use. Operates at the architecture level rather than the implementation level.

**everything-claude-code** — a curated collection of resources covering Claude Code features. High standalone value as individual patterns rather than a unified framework.

**Claude Code native SDD** — Anthropic's documentation describes native spec-driven patterns using only built-in Claude Code primitives: CLAUDE.md as project constitution, subagents for parallel research, the interview pattern for requirement refinement, and the native Tasks system for implementation delegation with dependency ordering.

---

## Comparative Evaluation: Specification Design

### Evaluation dimensions

Frameworks were evaluated across five dimensions:

1. **Elicitation quality** — how well does the framework surface requirements the user did not know they needed to specify?
2. **Structural clarity** — how well-structured is the resulting specification for machine-readable traceability?
3. **Graceful incompleteness** — how does the framework handle specification gaps discovered during implementation?
4. **Revision mechanism** — how does the framework keep the specification current as the codebase evolves?
5. **Validation quality** — how does the framework verify that implementation matches specification?

### Comparative table

| Framework | Elicitation | Structure | Incompleteness | Revision | Validation |
|---|---|---|---|---|---|
| Superpowers | Strong (Socratic) | Moderate (design doc) | Weak (silent) | None | Probabilistic (LLM) |
| BMAD | Strong (multi-role) | Strong (formal docs) | Moderate (role coverage) | None | Probabilistic (LLM) |
| Spec-Kit | Moderate (structured prompts) | Strong (three-doc model) | Weak (silent) | None | Probabilistic (LLM) |
| Kiro | Moderate (PRD expansion) | Strong (Amazon format) | Weak (confusion risk) | Steering docs (partial) | Probabilistic (LLM) |
| cc-sdd (gotalab) | Moderate (discovery phase) | Strong (contract model) | Moderate (phased gates) | None | Deterministic (tests) + LLM |
| cc-sdd (rhuss) | Inherited from Spec-Kit | Inherited from Spec-Kit | Moderate (drift detection) | `/sdd:evolve` (manual) | Deterministic (tests) + traits |
| GSD | Weak (developer-owned) | Minimal | None | None | Deterministic (tests) |
| Ralph | None (tests are spec) | N/A | None | None | Deterministic (tests only) |

### Key observations

**Elicitation and structure are generally solved.** The leading frameworks (Superpowers, BMAD, Spec-Kit) reliably produce better specifications than unguided agents. The mechanisms differ — Socratic dialogue, multi-role interrogation, structured prompts — but they all successfully prevent the most primitive failure mode of jumping to code with an unexamined requirement.

**Graceful incompleteness is partially solved.** Some frameworks acknowledge that specifications will be incomplete and build in mechanisms to surface gaps: BMAD's multi-role coverage, cc-sdd's phased gates, Superpowers's brainstorming iteration. But the handling of gaps discovered *during implementation* — after the specification has been approved and the plan has started executing — remains poor across the board.

**Revision is almost entirely unsolved.** With the partial exception of the rhuss cc-sdd drift detection command, no framework has a mechanism for keeping the specification current as implementation decisions are made. The specification is a point-in-time artifact. Once implementation begins, it starts diverging from reality.

**Validation is structurally weak.** Every framework uses an LLM to check whether implementation matches specification. LLM-based validation is probabilistic — the gate is soft. The only deterministic validation gate in any of these systems is tests passing. This means that LLM-based spec compliance review is effectively a quality hint rather than a quality gate.

---

## The Common Unresolved Frustration: Specification Drift

Community feedback from Hacker News, practitioner engineering blogs, and the Thoughtworks analysis converged on a single shared frustration that none of the frameworks fully address.

### The failure pattern

Specification-driven development is presented as a pipeline: clarify requirements → write specification → generate plan → implement → verify. The pipeline assumption is that the specification is complete and stable at the time implementation begins. In practice, this assumption is false.

Implementation surfaces decisions the specification did not anticipate. These decisions are not mistakes — they are genuine ambiguities that could not be resolved until the implementation was attempted. When the developer is implementing a rate limiter and discovers the specification did not say whether requests spanning a window boundary count against the old or new window, that is not a planning failure. It is a discovery that was only possible through implementation.

In a pipeline model, this discovery is handled silently. The developer (or agent) makes a choice, implements it, and moves on. The specification is never updated. The test for the boundary behavior is either not written or is written without being linked back to the specification. Six months later, when someone changes the window boundary behavior during a refactor, they do not know this was a deliberate choice. The specification says nothing about it. The tests may or may not catch the regression. The rationale is gone.

### Community articulation

The dbreunig analysis at the MLOps Coding Agents conference stated the problem precisely: specification-driven development is not a pipeline — it is a feedback loop. The act of implementing code improves the specification, and it improves the tests. A specification does not really work until it is implemented, just as software does not really work until it meets the real world.

The Thoughtworks analysis noted that code generation from specification is not deterministic, that spec drift and hallucination are inherently difficult to avoid, and that whether spec or code is the ultimate artifact of software development is still an unresolved question. Experienced programmers may find that over-formalised specifications slow down change and feedback cycles — an echo of the early waterfall critique.

One Hacker News thread articulated the deepest form of the frustration: "Why spec-driven development when code IS spec?" Code is already a detailed, verifiable specification that a machine can execute. Why maintain a second, less detailed and less verifiable copy? The answer the community converged on was not fully satisfying: specifications are for humans, not machines; they capture intent and rationale that code cannot express. But that answer only holds if the specification is kept current with the code, which it is not.

### The structural diagnosis

The failure is architectural, not tool-specific. Every framework in this survey treats the specification as the authoritative artifact at the top of a waterfall. Specification → Plan → Code. The arrow only flows in one direction.

The correct model is a constraint triangle: Specification, Tests, and Code are three nodes in a graph, each constraining the others. Implementation surfaces decisions that update all three nodes simultaneously. If the specification is updated without updating the corresponding test, or if the code is updated without updating the corresponding specification clause, the triangle is out of sync. The system's job is to detect and resolve these synchronisation failures as they occur, not to discover them during retrospective review.

No current framework implements this model. The closest approximation is the rhuss cc-sdd drift detection command, which detects spec/code divergence and provides a manual resolution step. But this is a repair mechanism, not a prevention mechanism. It does not capture the decision that caused the divergence, does not automatically update the test, and does not maintain bidirectional traceability from the decision back to the specification clause and test.

---

## Implications for New Framework Design

A framework designed to address the unresolved frustration would need at minimum:

**A decision record mechanism.** Every time implementation surfaces a choice the specification did not determine, the choice is captured in a structured decision record: what was chosen, what alternatives were considered, why this option was selected over others, which specification clause was updated, which test was written, and which code implements it. This record persists for the life of the project and can be superseded but never deleted.

**Bidirectional traceability.** Every specification criterion traces to one or more tests. Every test traces to a specification criterion. Every code change traces to a specification criterion (via the plan) or a decision record. Traversal in all four directions is the system's primary coherence mechanism.

**A split between spec-level and plan-level discovery.** Not all implementation discoveries require a specification update. Discoveries about dependency ordering, task decomposition errors, or implementation strategy are plan-level, not spec-level. A plan-level discovery can be resolved by the agent without human judgment. A spec-level discovery — one that reveals an ambiguity in the observable behaviour of the system — requires a decision gate and a specification update before implementation continues.

**Deterministic validation at the test layer.** Specification compliance review via LLM is acceptable as a pressure test but not as a gate. The gate must be deterministic: does the code pass the tests that were written to validate the specification criteria? If yes, the criterion is satisfied. If no, the criterion is not satisfied, and the answer is unambiguous.

**A coherence audit mechanism.** Periodically — not per-commit, but per sprint cadence — the system audits the three-way consistency of specification, tests, and code. Drift detected here is classified: auto-resolvable (the code and spec moved together but the test did not update) or human-judgment (the code and spec diverged in a way that requires a decision about which is authoritative).

---

## Conclusion

The agentic skill framework ecosystem has produced meaningful progress on the problem of undisciplined code generation. Frameworks like Superpowers, BMAD, and Spec-Kit demonstrably improve the quality of AI-generated code by enforcing structured specification and planning before implementation begins.

The frontier problem is specification drift: the divergence between the specification that was written before implementation and the reality of the implemented system. This is not a problem unique to AI coding — it is the same problem that motivated version control, automated testing, and continuous integration in human-coded software. What is new is the scale and speed at which AI agents can generate code that diverges from specifications, and the corresponding urgency of building tooling that keeps the triangle in sync.

The next generation of agentic skill frameworks will likely be defined not by their specification elicitation quality — that problem is largely solved — but by their ability to capture, trace, and propagate the decisions that implementation inevitably surfaces back into the living specification.

---

*Report compiled from community sources including Hacker News discussions, practitioner engineering blogs (dbreunig.com, Thoughtworks, MindStudio, emelia.io), GitHub project documentation, and the Claude plugin registry. Survey reflects the state of the ecosystem as of April 2026.*
