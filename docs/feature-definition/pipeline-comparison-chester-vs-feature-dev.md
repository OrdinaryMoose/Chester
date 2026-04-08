# Chester vs. Feature-Dev Pipeline: Stage-by-Stage Comparison

A detailed comparison of the **Chester** skill-based development pipeline and the **Anthropic Feature-Dev** agent-driven pipeline, both designed for structured feature development within Claude Code.

---

## Executive Summary

| Dimension | Chester | Feature-Dev |
|-----------|---------|-------------|
| **Philosophy** | Heavyweight, artifact-driven process with hard gates | Lightweight, agent-driven workflow with user checkpoints |
| **Phases** | 5 (Setup → Design → Plan → Execute → Finish) | 7 (Discovery → Explore → Clarify → Architect → Implement → Review → Summary) |
| **Artifact Trail** | Extensive — design briefs, specs, plans, threat reports, summaries, audits | Minimal — no persistent artifacts beyond committed code |
| **Gating** | Hard gates with automated reviews and MCP-enforced scoring | Soft gates via user approval prompts |
| **Parallelism** | Subagent dispatch for execution and reviews | Subagent dispatch for exploration, architecture, and review |
| **Isolation** | Git worktrees required for implementation | No isolation — works in current branch |
| **Author** | Mike (independent, plugin-distributed) | Anthropic / Sid Bidasaria (official plugin) |

---

## Stage-by-Stage Comparison

### Stage 1: Initialization

| Aspect | Chester: Setup | Feature-Dev: Discovery |
|--------|---------------|----------------------|
| **Skills/Phases** | `setup-start` + `start-bootstrap` | Phase 1: Discovery |
| **Purpose** | Initialize project config, create sprint directories, verify tooling (jq), establish naming conventions | Clarify the feature request, identify the problem, gather constraints |
| **What happens** | Reads/creates `.claude/settings.chester.local.json`, establishes working directory (gitignored) and plans directory (tracked), creates sprint subdirectory (`YYYYMMDD-##-word-word-word-word`) with `design/`, `spec/`, `plan/`, `summary/` subdirs, resets task list, initializes thinking history | Reads the feature request, asks clarifying questions if the request is vague, confirms understanding of the problem with the user |
| **User interaction** | First-run: asks for directory paths. Subsequent: automatic. | Conversational — asks what problem is being solved |
| **Output** | Project config, sprint name, directory structure, clean task list | Confirmed understanding of the feature request |
| **Key difference** | Chester treats initialization as *infrastructure setup* — directories, naming, budgets. Feature-dev treats it as *problem framing* — understanding what to build. Chester separates infrastructure from problem understanding; feature-dev merges them. |

---

### Stage 2: Understanding the Problem Space

| Aspect | Chester: Design (figure-out / architect) | Feature-Dev: Codebase Exploration + Clarifying Questions |
|--------|------------------------------------------|--------------------------------------------------------|
| **Skills/Phases** | `design-figure-out` (Socratic) or `design-architect` (quantitative) | Phase 2: Codebase Exploration + Phase 3: Clarifying Questions |
| **Purpose** | Resolve *all* open design questions before any implementation | Understand existing codebase patterns and resolve ambiguities |
| **Codebase exploration** | Happens during Socratic dialogue as needed — not a distinct phase | **Dedicated phase**: 2–3 `code-explorer` agents dispatched in parallel, each tracing different aspects (similar features, architecture, patterns). Main Claude reads all identified files afterward. |
| **Question methodology** | Structured Socratic interview: one question per turn, six question types (clarifying, assumption-probing, evidence, viewpoint, implication, meta), checkpoints every 4–6 questions | Organized question list presented all at once after codebase exploration. Covers edge cases, error handling, integration points, scope boundaries, design preferences, backward compatibility, performance. |
| **Scoring/measurement** | `design-architect` uses MCP-backed scoring: 9 understanding dimensions scored 0–1.0, enforcement MCP governs design clarity with challenge modes (Contrarian, Simplifier, Ontologist) | No scoring — relies on conversational judgment |
| **Exit condition** | When remaining questions are about HOW (implementation), not WHAT (design) | When user answers all questions |
| **Output** | Design brief (`-design-00.md`), thinking summary (`-thinking-00.md`), optionally process evidence (`-process-00.md`) | Mental model of codebase patterns + resolved ambiguities (no persistent artifacts) |
| **Key difference** | Chester's design phase is *deep and measured* — it can run for dozens of turns with quantitative saturation tracking. It produces durable artifacts. Feature-dev's exploration is *broad and fast* — parallel agents scan the codebase, then a single round of questions resolves ambiguities. No artifacts persist. Chester asks "do we understand the problem well enough?" Feature-dev asks "do we understand the codebase well enough?" |

---

### Stage 3: Specification / Architecture Design

| Aspect | Chester: Design-Specify | Feature-Dev: Architecture Design |
|--------|------------------------|--------------------------------|
| **Skills/Phases** | `design-specify` | Phase 4: Architecture Design |
| **Purpose** | Formalize approved design into a durable spec document | Design the feature architecture with trade-off analysis |
| **Process** | Reads design brief → writes structured spec (architecture, components, data flow, error handling, testing, constraints) → automated spec review loop (max 2 iterations via spec-reviewer subagent) → user approval gate | Launches 2–3 `code-architect` agents with different focuses: minimal changes, clean architecture, pragmatic balance → reviews all approaches → presents comparison with trade-offs and recommendation → asks user which approach to take |
| **Multiple approaches** | No — single spec refined through review iterations | **Yes** — explicitly generates competing architectural approaches with different trade-off profiles |
| **Review mechanism** | Automated subagent review (spec-document-reviewer) checks completeness and consistency | No automated review — user selects preferred approach |
| **Output** | Specification document (`-spec-00.md`) — a complete, reviewable, versioned artifact | Chosen architecture approach (lives in conversation context only) |
| **Approval gate** | Explicit: spec presented for user review, must be approved before planning begins | Explicit: user chooses preferred approach before implementation |
| **Key difference** | Chester produces a *formal specification document* — a standalone artifact that could be handed to a different developer. Feature-dev produces *architectural direction* — a decision made in conversation that guides implementation. Chester's spec is reviewed by an automated agent for completeness. Feature-dev's architecture is reviewed by the user for preference. Chester optimizes for *traceability*; feature-dev optimizes for *speed of decision*. |

---

### Stage 4: Planning

| Aspect | Chester: Plan | Feature-Dev: (none) |
|--------|--------------|---------------------|
| **Skills/Phases** | `plan-build` + `plan-attack` + `plan-smell` | No dedicated planning phase |
| **Purpose** | Break spec into detailed, executable, risk-assessed tasks | N/A — feature-dev moves directly from architecture to implementation |
| **Process** | Read spec → scope check → explore codebase → map file structure → write detailed tasks with TDD steps, file paths, code snippets, exact commands → plan review loop (max 3 iterations) → **mandatory plan hardening**: dispatch `plan-attack` and `plan-smell` in parallel → synthesize combined threat report → present risk level (Low/Moderate/Significant/High) with options | N/A |
| **Adversarial review** | **Yes** — `plan-attack` reviews across 5 dimensions: structural integrity, execution risk, assumptions/edge cases, contract/migration completeness, concurrency/thread safety. Every finding must cite real codebase evidence. | N/A |
| **Smell analysis** | **Yes** — `plan-smell` identifies smells the plan would *introduce*: duplication, responsibility overload, coupling, shotgun surgery, error paths, resource management | N/A |
| **Output** | Implementation plan (`-plan-00.md`) + plan threat report (`-plan-threat-report-00.md`) | N/A |
| **Key difference** | This is Chester's most distinctive phase and has **no equivalent in feature-dev**. Chester treats planning as a first-class engineering activity with its own review cycle and adversarial hardening. Feature-dev trusts the architecture phase to provide sufficient guidance and moves directly to implementation. This reflects a fundamental philosophical split: Chester assumes plans can contain structural flaws that only adversarial review will surface; feature-dev assumes the architect agent's output is sufficient. |

---

### Stage 5: Implementation

| Aspect | Chester: Execute | Feature-Dev: Implementation |
|--------|-----------------|---------------------------|
| **Skills/Phases** | `execute-write` + `execute-test` + `execute-debug` + `execute-prove` | Phase 5: Implementation |
| **Isolation** | **Mandatory git worktree** — all implementation happens in an isolated branch (`util-worktree` creates it, verifies gitignore, runs project setup, confirms baseline tests pass) | No isolation — works in current working directory and branch |
| **Execution model** | Task-by-task dispatch: budget guard check → dispatch implementer subagent → spec compliance review → code quality review → record SHA → update task list. Two modes: subagent-driven (recommended) or inline. | Single-pass implementation: reads all relevant files → implements following chosen architecture → follows codebase conventions → updates todos |
| **TDD discipline** | **Mandatory** (`execute-test`): write failing test → verify RED → write minimal code → verify GREEN → refactor. "No production code without a failing test first." | Not required — tests may be written during or after implementation |
| **Debugging** | **Dedicated skill** (`execute-debug`): 4-phase systematic debugging (root cause → pattern → hypothesis → implementation). "No fixes without root cause investigation first." If 3+ fixes fail, question architecture. | No dedicated debugging process — handled ad hoc |
| **Verification** | **Dedicated skill** (`execute-prove`): must run verification command, read full output, and verify claim *before* making any completion claim. "No completion claims without fresh verification evidence." | No formal verification gate — implementation is followed by review |
| **Capstone** | `execute-verify-complete`: run full test suite (zero failures), verify clean tree (`git status --porcelain`), checkpoint commit | No equivalent — implementation flows into review |
| **Key difference** | Chester's execution phase is *heavily gated* with multiple specialized skills enforcing discipline at every step. TDD is mandatory, not optional. Debugging has a formal protocol. Completion claims require evidence. Feature-dev's implementation is *trust-based* — it relies on the architecture being sound and the reviewer catching issues afterward. Chester treats implementation as the riskiest phase; feature-dev treats it as a straightforward translation of architecture to code. |

---

### Stage 6: Review

| Aspect | Chester: Execute-Review | Feature-Dev: Quality Review |
|--------|------------------------|---------------------------|
| **Skills/Phases** | `execute-review` (reactive, when feedback received) | Phase 6: Quality Review |
| **Trigger** | Reactive — invoked when code review feedback is received from humans or external reviewers | Proactive — automatically follows implementation |
| **Review agents** | Spec compliance reviewer + code quality reviewer (dispatched per-task during `execute-write`) | 3 `code-reviewer` agents in parallel: Simplicity/DRY/Elegance, Bugs/Functional correctness, Project conventions/abstractions |
| **Confidence scoring** | No numerical scoring — uses structured evaluation (read → understand → verify → evaluate → respond → implement) | **Yes** — 0–100 confidence scale, only reports issues ≥80 confidence to minimize false positives |
| **Philosophy on feedback** | Technical evaluation, not emotional performance. Forbidden phrases: "You're absolutely right!", "Great point!" Must verify feedback against codebase before implementing. Push back if feedback is wrong. | Accept review findings, present to user, ask what to do (fix now, fix later, proceed as-is) |
| **Fix cycle** | One fix at a time, test each individually | Batch fixes based on user decision |
| **Key difference** | Chester's review is *adversarial and verification-oriented* — it pushes back on incorrect feedback and requires independent verification. Feature-dev's review is *comprehensive and confidence-filtered* — it uses parallel specialized reviewers with numerical confidence to minimize noise. Chester reviews *during* execution (per-task); feature-dev reviews *after* all implementation is complete. Feature-dev's confidence scoring (≥80 threshold) is a sophisticated noise filter that Chester lacks. Chester's pushback culture ("verify before agreeing") is a discipline feature-dev doesn't enforce. |

---

### Stage 7: Wrap-Up

| Aspect | Chester: Finish | Feature-Dev: Summary |
|--------|----------------|---------------------|
| **Skills/Phases** | `finish-write-records` → `finish-archive-artifacts` → `finish-close-worktree` | Phase 7: Summary |
| **Documentation** | Session summary, reasoning audit (decision-level trace), optional cache analysis — all written to files in the sprint directory | Conversational summary: what was built, key decisions, files modified, suggested next steps |
| **Artifact archival** | **Yes** — copies all sprint artifacts (design briefs, specs, plans, threat reports, summaries, audits) from gitignored working directory to tracked plans directory, commits them alongside code | No artifact archival — no persistent artifacts were created |
| **Branch integration** | Four explicit options: (1) merge locally, (2) push and create PR via `gh`, (3) keep branch as-is, (4) discard work (requires typed confirmation). Worktree cleanup for options 1, 2, 4. | No branch management — code is already in the working branch |
| **Traceability** | Complete: every design decision, every review finding, every threat identified — all archived in git alongside the code they produced | Minimal: summary exists only in conversation history |
| **Key difference** | Chester's finish phase is *archival-grade* — it creates a permanent, version-controlled record of the entire development process. A future developer can read the sprint directory and understand not just *what* was built but *why*, *what alternatives were considered*, and *what risks were identified*. Feature-dev's summary is *conversational* — useful in the moment but lost when the conversation ends. This is the sharpest philosophical divide: Chester treats process artifacts as first-class deliverables; feature-dev treats them as ephemeral. |

---

## Cross-Cutting Concerns

### Subagent Usage

| Concern | Chester | Feature-Dev |
|---------|---------|-------------|
| **Explorer agents** | No dedicated explorer — exploration happens during design dialogue | 2–3 `code-explorer` agents (Sonnet) dispatched in parallel |
| **Architect agents** | No dedicated architect agent — architecture emerges from Socratic dialogue and spec | 2–3 `code-architect` agents (Sonnet) with competing approaches |
| **Implementer agents** | Per-task implementer subagent with status codes (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED) | No separate implementer — main Claude implements |
| **Reviewer agents** | Spec-reviewer, plan-reviewer, spec-compliance-reviewer, code-quality-reviewer, plan-attack, plan-smell | 3 `code-reviewer` agents with focus areas |
| **Model** | Main Claude (Opus-class) for dialogue; subagents inherit or use configured model | Main Claude for orchestration; all subagents use Sonnet |

### Safety and Rollback

| Concern | Chester | Feature-Dev |
|---------|---------|-------------|
| **Isolation** | Git worktrees — complete branch isolation, easy discard | None — changes are in the working tree |
| **Rollback** | Discard worktree (option 4 in finish-close-worktree) | Manual `git checkout`/`git stash` |
| **Budget awareness** | Budget guard checks token usage against 5-hour threshold before expensive operations | No budget awareness |

### When to Use Each

| Scenario | Recommended Pipeline |
|----------|---------------------|
| Complex feature with unclear requirements | Chester — deep design phase resolves ambiguity |
| Feature touching well-understood codebase | Feature-Dev — fast exploration + focused architecture |
| Compliance-sensitive or audit-requiring work | Chester — complete artifact trail |
| Rapid prototyping or exploration | Feature-Dev — lighter overhead |
| Multi-session feature development | Chester — artifacts survive across sessions |
| Solo developer, familiar codebase | Feature-Dev — less ceremony, faster cycle |
| Team development needing traceability | Chester — specs and plans are reviewable by teammates |
| One-off feature in a new codebase | Feature-Dev — parallel explorers build context fast |

---

## Structural Mapping

```
Chester                          Feature-Dev
───────                          ───────────
setup-start ──────────────────── (no equivalent)
start-bootstrap ─────────────── (no equivalent)
                                 Phase 1: Discovery
design-figure-out ────────────── Phase 2: Codebase Exploration
  (or design-architect)              + Phase 3: Clarifying Questions
design-specify ───────────────── Phase 4: Architecture Design
plan-build ───────────────────── (no equivalent)
  plan-attack ────────────────── (no equivalent)
  plan-smell ─────────────────── (no equivalent)
util-worktree ────────────────── (no equivalent)
execute-write ────────────────── Phase 5: Implementation
  execute-test ───────────────── (no equivalent — TDD not enforced)
  execute-debug ──────────────── (no equivalent — ad hoc)
  execute-prove ──────────────── (no equivalent — no verification gate)
execute-review ───────────────── Phase 6: Quality Review
execute-verify-complete ──────── (no equivalent)
finish-write-records ─────────── Phase 7: Summary
finish-archive-artifacts ─────── (no equivalent)
finish-close-worktree ────────── (no equivalent)
```

---

## Summary

Chester and Feature-Dev solve the same problem — guiding Claude through disciplined feature development — but make fundamentally different trade-offs:

**Chester** prioritizes **traceability, rigor, and risk mitigation**. Every phase produces artifacts. Plans are adversarially reviewed. TDD is mandatory. Completion claims require evidence. The entire process is archived in git. The cost is ceremony and time.

**Feature-Dev** prioritizes **speed, parallelism, and developer experience**. Specialized agents explore and review in parallel. Architecture options are presented as trade-offs. Confidence scoring filters review noise. The cost is that nothing persists beyond the conversation and the committed code.

Neither is universally better. Chester is the right choice when the work is complex, the stakes are high, or the decisions need to survive beyond the current session. Feature-Dev is the right choice when the codebase is understood, the feature is well-scoped, and velocity matters more than ceremony.
