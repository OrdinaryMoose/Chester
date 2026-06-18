# Chester — Complete Instructions

## Overview

Chester is a Claude Code plugin that wraps AI-assisted development in a structured, disciplined workflow. Its core premise is simple: AI-assisted development fails most often not because the agent can't write code, but because it is working from an incomplete or misread problem statement. Chester front-loads the work of building shared understanding before any code is written.

The workflow moves through five phases:

```
Design → Specify → Plan → Execute → Finish
```

Each phase has dedicated skills, and every skill is invoked through Claude Code's Skill system rather than ad-hoc prompting. This means Chester's behavior is consistent, auditable, and improvable.

### The Core Philosophy

Chester treats AI-developer collaboration as a shared understanding problem. Before writing any code, the designer and the agent must agree on:

- What the actual problem is (not what was typed in the first message)
- What is in scope and what is explicitly out of scope
- What constraints and prior decisions apply
- What "done" looks like

Chester then enforces discipline during implementation: tests before code, root causes before fixes, evidence before completion claims.

### Two Skill Types

Chester skills fall into two categories:

- **Rigid skills** — follow the process exactly. These have Iron Laws and explicit anti-rationalization sections. Deviating from the process is treated as a process violation, not a reasonable adaptation. Skills in this category: `execute-test`, `execute-prove`.
- **Flexible skills** — adapt the principles to context. These provide frameworks and structure, but the agent uses judgment about how to apply them. Skills in this category: `design-small-task`, `spec-architect`, `spec-write`, `spec-harden`, `plan-build`, `execute-write`.

When you are using a rigid skill and find yourself thinking "just this once" or "this is different because…" — that is rationalization. The skill documentation says so explicitly. Follow the process.

### What Chester Produces

Every sprint produces a paper trail:

| Artifact | What it captures |
|----------|-----------------|
| Design brief | What is being built and why the scope boundaries exist |
| Thinking summary | How decisions were made, alternatives considered |
| Specification | Formal spec with architecture decision and component design |
| Implementation plan | TDD task breakdown with exact file paths and code |
| Threat report | Adversarial and smell findings from plan hardening |
| Session summary | What was done, what was deferred, what the next session needs |
| Reasoning audit | Decision points reconstructed from transcript |

These live in `docs/chester/plans/` alongside the code they document.

---

## Installation

### Prerequisites

**Required:**
- Claude Code CLI installed and running
- Git

**Strongly recommended:**
- **Sequential Thinking MCP** — provides `capture_thought`, `get_thinking_summary`, and `clear_thinking_history`. Used throughout the design skills to anchor key decisions against the U-shaped context attention curve, preventing important early findings from being lost as the conversation grows. Without it, design skills fall back to context-only reasoning and reasoning checkpoints are less reliable. Install and configure this MCP separately and confirm it appears in `/mcp` before running design sessions.
- **GitHub CLI (`gh`)** — used by `finish-close-worktree` to create pull requests. Chester works without it, but the PR creation step will require you to create PRs manually. Install with `brew install gh` (macOS) or `sudo apt install gh` (Linux), then authenticate with `gh auth login`.

### Step 1: Clone the repository

```bash
git clone https://github.com/OrdinaryMoose/Chester.git ~/Documents/Chester
```

### Step 2: Register and install

```bash
claude plugins marketplace add ~/Documents/Chester
claude plugins install chester@chester
```

### Step 3: Activate

In a Claude Code session, run `/reload-plugins`. Chester skills become available immediately and the SessionStart hook loads Chester automatically in every future session.

**Verify:** Start a new session — Chester should introduce itself and confirm it has loaded.

### Updating

After `git pull`, re-sync the plugin:

```bash
claude plugins update chester@chester
```

Then run `/reload-plugins` in your session.

---

## First-Run Project Configuration

The first time Chester runs in a new project, it asks you to configure two directories:

1. **Working directory** — a gitignored scratch space where design briefs, specs, and plans live while actively being worked on. Lives outside worktrees so it persists across branches.
2. **Plans directory** — a tracked directory inside the repo where finished artifacts are committed alongside code. This is the permanent record.

Chester writes these paths to a project-scoped config file and creates `.gitignore` entries automatically.

---

## The Full Pipeline

### How a typical sprint flows

```
setup-start (session load)
    ↓
design-small-task
    ↓
spec-architect
    ↓
spec-write
    ↓
spec-harden
    ↓
plan-build
    (plan-attack + plan-smell run automatically as part of plan hardening)
    ↓
execute-write
    (execute-test per task, execute-prove for verification)
    ↓
execute-verify-complete
    ↓
finish-write-records (optional)
    ↓
finish-archive-artifacts
    ↓
finish-close-worktree
```

You do not call most of these manually — they chain automatically. The pipeline skills invoke each other and hand off control. You interact at decision gates: design approval, spec approval, architecture selection, plan risk acceptance, and branch integration.

---

## Skills Reference

---

### `chester:setup-start`

**What it does:** Loads at the start of every session via a hook. Establishes the skill system, reads project config, and confirms directories are set up.

**When it runs:** Automatically at session start. You do not invoke this manually.

**Tips:**
- If Chester does not load in a session, run `/reload-plugins` to refresh.
- The setup hook injects the full skill list into the session context. If you see Chester listing available skills at the start of a session, that is this skill running.

---

### `chester:start-bootstrap`

**What it does:** Mechanical session initialization for pipeline skills. Reads config, derives the sprint name in `YYYYMMDD-##-verb-noun-noun` format, creates the working directory and sprint subdirectory, resets the task list from any prior skill, and loads the top lessons from `~/.chester/thinking.md`.

**When it runs:** Called internally by `design-small-task`, `spec-architect`, `spec-write`, and `spec-harden` (standalone). You do not invoke this directly.

**Tips:**
- The sprint name format is the branch name. Three words: a verb (the action) followed by two nouns (the target). Example: `20260412-01-add-user-auth`.
- If a session is interrupted mid-bootstrap, the next skill invocation will re-run bootstrap and pick up where it left off.

---

### `chester:design-small-task`

**What it does:** The entry-point design skill. A lightweight design conversation for well-bounded tasks where you already know roughly what you want. Runs as a single continuous Q&A loop — the agent presents observations and asks questions, surfacing edge cases, existing patterns, and constraints. The agent can read and write freely throughout, and code vocabulary is permitted in commentary. Produces a six-section design brief that transitions to `spec-architect` (which settles architecture; then `spec-write` authors and `spec-harden` hardens) before planning.

**When to invoke:** Before any creative work — adding a feature, modifying behavior, or implementing a well-understood extension. Just describe what you want to build; the agent reads the codebase and walks you through a structured conversation.

**How it works:**
- Single continuous conversation, no phase structure
- The agent can read and write freely throughout — no Plan Mode
- Code vocabulary is permitted in commentary, so you can reference specific files, classes, and patterns directly
- You control when the brief is written — the agent never suggests proceeding
- Hands the brief to `spec-architect`, which settles architecture, then `spec-write` authors and `spec-harden` hardens the spec before `plan-build`

**Hard gate:** The agent will never suggest writing the brief or wrapping up the conversation. You explicitly direct it to proceed ("go ahead," "write it up," "let's build it"). Until you do, it keeps asking questions.

**Tips:**
- Use this to get a checklist of considerations before planning — edge cases, existing patterns, and constraints made explicit.
- Because the agent can use code vocabulary, you can reference specific files, classes, and patterns directly.
- The six-section brief (Goal, Prior Art, Scope, Key Decisions, Constraints, Acceptance Criteria) is designed to be self-contained enough that `spec-architect` can dispatch its architects from the brief alone.

---

### `chester:spec-architect`

**What it does:** Settles the architecture for a design that is not yet FAC-complete (Functionally, Architecturally, and Conceptually complete). Dispatches two competing architect agents — each with a different trade-off profile — plus a prior-art explorer, runs F-A-C self-checks on the candidates, and presents the directions for you to choose. Runs only on the small-task path; the committee path already arrives with settled architecture, so it skips straight to `spec-write`.

**When to invoke:** Automatically after `design-small-task`. Can also be invoked standalone if you have a design brief from a whiteboard, conversation, or previous session and the architecture is still open.

**How to use:** After `design-small-task` transitions to this, it runs automatically. You see a comparison of the competing architecture approaches and pick one (or ask for a hybrid). The chosen direction becomes the settled architecture.

**Tips:**
- The architecture comparison is the most valuable moment on the small-task path. Read both options carefully. The prior-art context often reveals that one approach depends on infrastructure that a previous sprint found non-functional.
- Once you pick a direction, the design is FAC-complete and transitions to `spec-write`.

---

### `chester:spec-write`

**What it does:** Authors the spec from a FAC-complete design — either a committee complete-design document or the output of `spec-architect`. Extracts the eight-field FAC-complete-design contract, quotes the chosen architecture back to you for confirmation, and fills the spec template. It authors only; it runs no review passes.

**When to invoke:** Automatically after `spec-architect` (or directly after a committee complete-design document, which is already FAC-complete). Can also be invoked standalone with a FAC-complete design brief.

**How to use:** It confirms the architecture it read by quoting it back, then writes the spec into the working directory. Once the spec is authored, it transitions to `spec-harden`.

**Tips:**
- The confirmation read-back is your checkpoint that the right architecture was carried forward. If the quoted architecture is wrong, correct it before the spec is filled in.
- The spec is not committed here — it stays in the working directory until `finish-archive-artifacts`.

---

### `chester:spec-harden`

**What it does:** Hardens an authored spec through three review passes, in order — **fidelity** (does the spec faithfully address the design?), **adversarial** (what gaps and unstated assumptions does it carry?), and **ground-truth** (do its claims hold against the actual codebase?) — followed by the user approval gate. It is independently callable ad-hoc on any spec.

**When to invoke:** Automatically after `spec-write`. Can also be invoked standalone against any existing spec or requirements document you want hardened before planning.

**How to use:** The three passes run in sequence. HIGH and MEDIUM findings are addressed before the spec reaches you for approval. After you approve, it transitions to `plan-build`.

**Tips:**
- Ground-truth is most valuable when the spec references existing types, APIs, or file paths — the pass reads source files to verify every claim.
- If the fidelity pass keeps surfacing the same gap, it usually means the design itself had an ambiguity the spec inherited.

---

### `chester:plan-build`

**What it does:** Breaks an approved spec into a TDD implementation plan. Maps the file structure, writes each task with exact file paths and code, runs a review loop, then hardens the plan with parallel adversarial (`plan-attack`) and smell (`plan-smell`) reviews.

The plan is written for an engineer with zero codebase context — every task has exact paths, complete code (not stubs), the exact test command with expected output, and a commit step.

**When to invoke:** After `spec-harden` approves the spec. Can also be invoked standalone with any spec or requirements document.

**Plan structure:** Every plan task follows Red-Green-Refactor:
1. Write failing test (with code)
2. Run test, verify it fails
3. Write minimal implementation (with code)
4. Run test, verify it passes
5. Commit

**Plan hardening (mandatory gate):**
After the plan review loop approves the plan, `plan-attack` and `plan-smell` run in parallel automatically. You receive:
- A combined implementation risk level (Low / Moderate / Significant / High)
- 3-5 statements explaining the rating
- Four options: proceed, proceed with mitigations, return to design, or stop

**Tips:**
- The bite-sized task granularity is not optional. Each step should be 2-5 minutes of work. If a task feels large, it should be split.
- The plan document starts with a required header: goal, architecture summary, and tech stack. These anchor the implementing agent.
- Risk level "Moderate" is common and not a reason to stop. Read the findings and decide whether the mitigations are worth implementing before proceeding.
- The plan is offered in two execution modes: subagent-driven (recommended) and inline. Subagent-driven is faster and keeps your main session context clean.

---

### `chester:plan-attack`

**What it does:** Adversarial review of an implementation plan. A single-pass, evidence-based attack across five dimensions: structural integrity, execution risk, assumptions and edge cases, contract and migration completeness, and concurrency and thread safety.

**When to invoke:** Automatically as part of `plan-build`'s hardening gate. Can also be invoked manually on any plan: "attack this plan," "red-team this," "what could go wrong."

**Evidence standard:** Every finding must cite a specific file path, line number, or concrete code reference. Speculative "what if" concerns are not findings. If it can't cite real code, it's dropped.

**Output:** Findings grouped by dimension, with severity. Ends with a 2-3 sentence risk assessment.

**Tips:**
- Use this standalone when picking up a plan written in a previous session — run an attack before executing to verify nothing has changed in the codebase that invalidates the plan.
- The five dimensions map well to the most common implementation failure modes. If structural integrity findings are high, the spec may need revision. If execution risk findings dominate, the task ordering may need rework.
- This skill does not modify the plan. It reports findings and you decide.

---

### `chester:plan-smell`

**What it does:** Forward-looking code smell analysis of an implementation plan. Reviews what smells the plan would *introduce* — not existing smells unless the plan directly worsens them. Two dimensions: structural concerns (duplication, responsibility overload, unnecessary abstraction, deferred complexity) and coupling concerns (tight coupling, shotgun surgery, hierarchy problems, contract fragility).

**When to invoke:** Automatically as part of `plan-build`'s hardening gate alongside `plan-attack`. Can also be invoked manually: "smell review," "will this introduce smells," "check the plan for smells."

**How it differs from plan-attack:**
- `plan-attack` checks whether the plan will execute correctly
- `plan-smell` checks whether the plan will produce maintainable code

Both run on the same plan without meaningful overlap.

**Tips:**
- "Unnecessary abstraction" findings are common and often correct. If the plan adds an interface that has exactly one implementation and no substitution use case, that is a smell worth noting.
- Deferred complexity findings ("marked for later") are the most dangerous category. They tend to calcify into permanent debt. Take them seriously.
- This skill is forward-looking. If you're reviewing existing code for smells, use `util-codereview` instead.

---

### `chester:execute-write`

**What it does:** Executes an implementation plan. The recommended mode dispatches a fresh subagent per task, each with the full task text, relevant context, and architectural constraints. After each task, a spec compliance reviewer and a code quality reviewer run in sequence. After all tasks complete, a full code review runs across the entire implementation.

**When to invoke:** After `plan-build` completes and you choose an execution mode.

**Execution modes:**
- **Subagent-driven (recommended):** Fresh subagent per task, reviewed between tasks, fast iteration. Keeps your main session context clean.
- **Inline:** Execute tasks in the current session with checkpoints. Use when subagent dispatch is unavailable or for very simple plans.

**Status codes from implementer subagents:**
| Code | Meaning | Response |
|------|---------|----------|
| DONE | Task complete | Proceed to spec review |
| DONE_WITH_CONCERNS | Complete with issues noted | Evaluate concerns, decide whether to proceed or re-dispatch |
| NEEDS_CONTEXT | Blocked on missing information | Provide context and re-dispatch |
| BLOCKED | Cannot proceed | Assess: plan flaw (escalate) or context gap (provide and re-dispatch) |

**Deferred items:** If something comes up that is out of scope or a good idea but not in the plan, the agent writes it to a deferred items file rather than acting on it. These are reviewed during finish.

**Completion sequence (automatic):** When all tasks are done, `execute-write` immediately runs `execute-verify-complete`, offers session records, runs `finish-archive-artifacts`, then `finish-close-worktree`. You are not asked whether to proceed — the sequence runs.

**Tips:**
- Do not reuse implementer subagents across tasks. Each must be fresh. Accumulated context causes drift.
- If an implementer reports DONE suspiciously quickly on a complex task, that is a red flag. Read its output carefully before the spec review.
- The deferred items file is valuable. Review it at the end of the sprint — it often contains the next sprint's scope.
- Inline mode works well for plans with 3 or fewer tasks. For larger plans, subagent-driven pays for itself.

**Red flags to watch for:**
- Skipping tests because "the code is simple"
- Making changes outside the current task's scope
- Treating all code review findings as Minor to avoid fixing them
- Listing the finish sequence and asking "Want to proceed?" — the sequence is automatic, not a menu

---

### `chester:execute-test`

**What it does:** Enforces Test-Driven Development. The Iron Law: no production code without a failing test first. If you wrote code before the test, delete it and start over.

**When to invoke:** Before writing implementation code for any feature, bug fix, or behavior change.

**The Red-Green-Refactor cycle:**
1. **RED** — write one minimal test showing what should happen. Run it. Confirm it fails for the expected reason (feature missing, not a typo).
2. **GREEN** — write the simplest code that makes the test pass. No extra features, no premature abstraction.
3. **REFACTOR** — clean up only after green. Remove duplication, improve names. Tests must stay green.

**The Iron Law:**
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

No exceptions without explicit human permission.

**Tips:**
- The most important step is Verify RED — watching the test fail. This is what TDD skeptics skip, and it is the step that proves the test is actually testing something. "Test passes immediately" is a red flag, not a success.
- Tests written after code pass immediately. Passing immediately proves nothing. Tests-first force you to see the failure mode before you implement the fix.
- The rationalization table in the skill documentation covers every common excuse. If you find yourself thinking one of them, read the table.
- Good test: clear name, one behavior, real code (not mocks unless unavoidable). If the test name contains "and," split it.

**Common rationalization patterns to reject:**
| Excuse | Why it's wrong |
|--------|----------------|
| "Too simple to test" | Simple code breaks. The test takes 30 seconds. |
| "I'll test after" | Tests-after pass immediately. That proves nothing. |
| "I already manually tested" | Ad-hoc ≠ systematic. You can't re-run it. |
| "Deleting hours of work is wasteful" | Sunk cost fallacy. Unverified code is debt. |

---

### `chester:execute-prove`

**What it does:** Enforces evidence before completion claims. The Iron Law: no completion claims without fresh verification evidence. If you haven't run the verification command in the current message, you cannot claim it passes.

**When to invoke:** Before claiming any work is complete, fixed, or passing. Before committing, creating PRs, or moving to the next task.

**The gate function:**
```
1. IDENTIFY — what command proves this claim?
2. RUN — execute the full command (fresh, complete)
3. READ — full output, check exit code, count failures
4. VERIFY — does output confirm the claim?
5. ONLY THEN — make the claim
```

**Tips:**
- "Should work now" is not evidence. "I'm confident" is not evidence. Run the command.
- Agent success reports are not evidence. Verify independently by checking what actually changed in the VCS.
- Expressions of satisfaction ("Great!", "Done!", "Perfect!") before verification are red flags. The skill explicitly prohibits them.
- Regression tests must go through a full Red-Green cycle: write → run (pass) → revert fix → run (MUST FAIL) → restore → run (pass). If you skip the revert step, you don't know if the test actually catches the bug.

---

### `chester:execute-verify-complete`

**What it does:** Capstone of the execution phase. Three steps: prove tests pass (invokes `execute-prove`), verify a clean git tree, create a checkpoint commit marking execution complete.

**When to invoke:** Called automatically by `execute-write` after all tasks complete. The gate between building and finishing.

**The three steps:**
1. Run the full test suite via `execute-prove`. If any tests fail, stop and report. Do not proceed.
2. Run `git status --porcelain`. If any tracked files are modified but uncommitted, stop. The user must commit or confirm the changes are unrelated.
3. Create an empty checkpoint commit: `git commit --allow-empty -m "checkpoint: execution complete"`.

**Tips:**
- The checkpoint commit is a boundary marker in git history, not a content commit. It makes it easy to identify where implementation ended and finishing began.
- This skill returns control to `execute-write` automatically — it does not stop and ask what to do next.

---

### `chester:finish-write-records`

**What it does:** Produces session documentation. Two modes: feature mode (sprint pipeline work) produces a session summary, reasoning audit, and optional cache analysis; refactor mode (cleanup/simplification work) additionally produces an evaluation brief.

**When to invoke:** After `execute-verify-complete`. Also trigger proactively when the user says "summarize what we did," "session report," "write a refactor summary," or at natural session end points.

**Feature mode artifacts:**
- **Session summary** — goal, decisions, what was produced, what is deferred, what the next session needs to know
- **Reasoning audit** — 4-12 non-trivial decision points from the session JSONL transcript, ordered by significance (most consequential first, not chronologically)
- **Cache analysis** (optional) — per-call and overall cache hit rates from the session JSONL

**Refactor mode artifacts:**
- **Evaluation brief** — why the refactor was justified: scope, decision, artifacts
- **Session summary** and **reasoning audit** as above

**Tips:**
- The reasoning audit uses the session JSONL transcript as its authoritative source, not conversation context. It reconstructs actual decision points — moments where the agent made a real choice among alternatives. Mechanical steps and trivial style choices do not qualify.
- Entries are ordered by significance, not chronology. The most consequential decision appears first.
- Each audit entry has a confidence level (High/Medium/Low) reflecting how clearly the decision and rationale are supported by evidence.
- If the session involved silent file changes not discussed in conversation, use "deep scan" mode to discover them.

---

### `chester:finish-archive-artifacts`

**What it does:** Copies all sprint artifacts from the gitignored working directory into the worktree's tracked plans directory and commits them. Single pass — everything in the working directory's sprint subdirectory gets archived.

**When to invoke:** After `finish-write-records` (or after `execute-verify-complete` if skipping records). Called automatically by `execute-write`'s completion sequence.

**What gets archived:**
```
design/   (brief, thinking summary)
spec/     (spec document, ground-truth report if generated)
plan/     (implementation plan, threat report, deferred items)
summary/  (session summary, reasoning audit, cache analysis)
```

**Commit message format:** `docs: archive sprint artifacts for {sprint-name}`

**Tips:**
- This is the moment design briefs, specs, and plans become permanent history. Once committed, they travel with the code branch.
- The working directory is not cleaned up by this skill — it remains as-is for reference until the next sprint.

---

### `chester:finish-close-worktree`

**What it does:** Final step of the finish phase. Presents four options for branch integration and executes the chosen option.

**When to invoke:** After `finish-archive-artifacts`. Called automatically by `execute-write`'s completion sequence.

**The four options:**
1. **Merge locally** — merges the feature branch into the base branch with `--no-ff`, verifies tests on the merged result, deletes the feature branch, removes the worktree
2. **Push and create PR** — pushes the branch, creates a PR via `gh pr create`, preserves the worktree for addressing review comments
3. **Keep as-is** — preserves the branch and worktree for later
4. **Discard** — permanently deletes the branch and worktree. Requires typing "discard" to confirm.

**Tips:**
- Option 1 checks whether the base branch has uncommitted changes before switching. If it does, you are prompted to stash or keep-as-is. The skill never proceeds with a dirty base branch.
- Option 2 preserves the worktree because you may need to address PR feedback. The worktree is not cleaned up.
- Option 4 is protected by a typed confirmation for good reason. It permanently deletes all commits in the branch.
- Force-push is never used without explicit request.

---

### `chester:util-worktree`

**What it does:** Creates an isolated git worktree for feature work. Follows a smart directory selection process, verifies the worktree directory is gitignored, runs project setup (npm install, cargo build, etc.), and verifies a clean test baseline before reporting ready.

**When to invoke:** Automatically called by `design-small-task` at closure and by `execute-write` as a fallback if no worktree exists. Can also be invoked standalone before feature work.

**Directory selection priority:**
1. Existing `.worktrees/` directory (preferred)
2. Existing `worktrees/` directory
3. CLAUDE.md preference
4. Ask user (`.worktrees/` local or `~/.config/chester/worktrees/<project>/` global)

**Tips:**
- The gitignore verification step is mandatory for project-local directories. If the directory is not ignored, Chester adds it to `.gitignore` and commits the change before proceeding. This prevents worktree contents from appearing in `git status`.
- If baseline tests fail, the skill reports and asks whether to proceed. Do not proceed with a broken baseline — you will not be able to distinguish new bugs from pre-existing ones.
- The worktree shares the same git repository as the main tree. Both see the same `.git` directory. This is why gitignoring the worktree directory is critical.

---

### `chester:util-dispatch`

**What it does:** Coordinates parallel subagent dispatch for independent tasks. When you have multiple unrelated problems (different test files failing, multiple subsystems to investigate), dispatching parallel agents solves all of them simultaneously.

**When to invoke:** When facing 2+ independent tasks that can be worked on without shared state or sequential dependencies.

**Decision tree:**
- Multiple problems? → Are they independent? → Can they work in parallel? → Dispatch
- Related problems (fix one might fix others) → Single agent investigates all
- Sequential dependency → Sequential agents

**Agent prompt structure:**
- Specific scope (one test file or subsystem)
- Clear goal (make these tests pass)
- Constraints (don't change other code)
- Expected output format

**Tips:**
- "Too broad" is the most common mistake. "Fix all the tests" gets lost. "Fix agent-tool-abort.test.ts" succeeds.
- Always include the exact error messages and test names in the agent prompt. Don't make the agent rediscover what's broken.
- After agents return, verify their fixes don't conflict, then run the full test suite. Agents can each fix their domain correctly but introduce integration issues.
- Do not use this for exploratory debugging — you need full context when you don't yet know what's broken.

---

### `chester:util-codereview`

**What it does:** Code smell review of existing code in a scoped directory. Single-pass review across two dimensions: practical concerns (runtime bugs, dead code, correctness risks, style drift) and structural concerns (duplication, responsibility overload, coupling, unnecessary abstraction). Every finding cites file path and line number.

**When to invoke:** "Review code in src/", "smell check this directory," "code review src/billing," "what smells exist in lib/".

**Evidence standard:** Every finding must cite the specific file, line number(s), construct name, and why it matters. No speculative findings.

**Tips:**
- Scope is required. The skill will not review the entire repo by default — unbounded reviews produce shallow findings because the reviewer skims rather than reads.
- The scope can be a directory path, a namespace, or a glob pattern.
- This reviews existing code. For reviewing implementation plans, use `plan-smell`. For reviewing plans' execution risks, use `plan-attack`.
- The two dimensions are complementary: practical concerns catch bugs you'll hit tomorrow, structural concerns catch rot that makes every future change harder.

---

### `chester:util-artifact-schema`

**What it does:** Reference document for artifact naming, versioning, directory layout, and path resolution. Not directly invoked — read internally by skills that create or reference artifacts.

**Key conventions:**
- Sprint name format: `YYYYMMDD-##-verb-noun-noun` (date, sequence number, three words)
- Artifact version numbers: `00`, `01`, `02` (zero-padded, increment on revision)
- Working directory (gitignored): `docs/chester/working/{sprint-name}/`
- Plans directory (tracked): `docs/chester/plans/{sprint-name}/`
- Subdirectories per sprint: `design/`, `spec/`, `plan/`, `summary/`

---

### Design brief template

The brief template is not a standalone skill — it lives as a reference file inside the design skill:

- `skills/design-small-task/references/design-brief-small-template.md` — 6-section lightweight brief (Goal, Prior Art, Scope, Key Decisions, Constraints, Acceptance Criteria). Read by `design-small-task` before writing the brief at Closure.

**Tip:** Design briefs are written in domain language — no type names, file paths, or implementation details. The self-containment test is whether `spec-architect` can dispatch architects from the brief alone.

---

### `chester:spec-architect` (standalone invocation)

When invoked without a prior design session, `spec-architect` runs `start-bootstrap` itself to set up the sprint context. Provide a design brief from any source: a document path, a whiteboard description, or a conversation summary. From there it settles the architecture and chains to `spec-write` and `spec-harden`.

---

### `chester:finish-write-records` (refactor mode)

When the work was refactoring rather than feature development, `finish-write-records` switches to refactor mode automatically. The evaluation brief (why was this refactor justified?) is the most important artifact in this mode. Refactor artifacts are committed directly to `docs/refactor/{slug}/` rather than going through the archive flow.

---

## Tips, Tricks, and Patterns

### Starting a sprint

The shortest path to a new sprint:

```
"I want to add [feature]. Let's design it."
```

Chester will invoke `design-small-task` automatically and walk you through the pipeline.

### Resuming an interrupted session

If a design or planning session is interrupted, the skills have resume protocols:

- `design-small-task`: the agent re-reads the partial design brief and conversation, then picks up the Q&A loop where it left off.
- `plan-build`: re-read the spec and plan file if partially written.
- `execute-write`: re-read the plan, check the task list, verify which tasks are committed.

### When the plan's risk rating is "Significant" or "High"

Read the threat report carefully. The risk rating is a judgment call from the attack and smell reviews combined. Consider:
- Are the structural integrity findings about files that actually exist?
- Are the execution risks about realistic partial-state scenarios?
- Would the directed mitigations address the highest-severity findings?

"Significant" risk does not mean stop. It means know what you're walking into.

### Which design skill to use

| Situation | Skill |
|-----------|-------|
| Any creative work — a feature, behavior change, or extension | `design-small-task` |
| You already have a design brief and just need a spec | `spec-architect` (standalone, chains to spec-write → spec-harden) |

### Reviewing a plan from a previous session

Run `plan-attack` standalone before executing a plan that was written in a previous session:

```
"Attack the plan at docs/chester/working/{sprint}/plan/{sprint}-plan-00.md"
```

Codebase state may have changed since the plan was written. The attack will surface any discrepancies.

### Using util-dispatch for parallel investigation

When multiple tests are failing across different files or subsystems:

```
"Let's dispatch agents to investigate these failures in parallel."
```

Chester will identify which failures are independent, craft focused agent prompts for each, and dispatch them simultaneously.

## Skill Quick Reference

| Skill | Phase | When to use |
|-------|-------|-------------|
| `setup-start` | Setup | Auto-loads every session |
| `start-bootstrap` | Setup | Called internally by pipeline skills |
| `design-small-task` | Design | Before any creative work — the entry-point design skill |
| `spec-architect` | Design | Settle the architecture for a FAC-incomplete design |
| `spec-write` | Design | Author the spec from a FAC-complete design |
| `spec-harden` | Design | Harden the spec — fidelity, adversarial, ground-truth, user gate |
| `plan-build` | Plan | Break a spec into a TDD implementation plan |
| `plan-attack` | Plan | Adversarial review — auto-runs in plan hardening |
| `plan-smell` | Plan | Smell forecast — auto-runs in plan hardening |
| `execute-write` | Execute | Execute a written implementation plan |
| `execute-test` | Execute | Enforce TDD before writing any code |
| `execute-prove` | Execute | Evidence-based verification before any claim |
| `execute-verify-complete` | Execute | Gate between implementation and finishing |
| `finish-write-records` | Finish | Session documentation — summary and audit |
| `finish-archive-artifacts` | Finish | Copy artifacts from working dir to plans dir |
| `finish-close-worktree` | Finish | Branch integration and worktree cleanup |
| `util-worktree` | Utility | Create isolated git worktrees |
| `util-dispatch` | Utility | Coordinate parallel subagents |
| `util-codereview` | Utility | Smell review of existing code |
| `util-artifact-schema` | Reference | Artifact naming and path conventions |
| `design-small-task/references/design-brief-small-template.md` | Reference | 6-section lightweight brief (read by design-small-task) |
