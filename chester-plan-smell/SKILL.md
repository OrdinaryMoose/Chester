---
name: chester-plan-smell
description: >
  Forward-looking code smell analysis of an implementation plan. Spawns three parallel agents —
  Bloaters & Dispensables, Couplers & OO Abusers, and Change Preventers (each augmented with
  mapped SOLID checks) — to identify code smells the plan would introduce into the codebase.
  Based on the five smell categories from refactoring.guru/refactoring/smells plus SOLID
  principles distributed across the smell agents. Auto-triggers as
  part of chester-plan-build's plan hardening gate. Can also be invoked manually via:
  "smell review", "code smell check", "will this introduce smells", "smell analysis",
  "check the plan for smells", "/chester-plan-smell".
---

# Smell Review

Analyzes an implementation plan for code smells it would introduce. Every finding must cite
real evidence — plan text, proposed class/method names, file paths, or existing constructs the
plan touches. Speculation without evidence is not a finding.

## Relationship to other review skills

Independent and complementary to `chester-plan-attack` and `plan-doc-review`.

- `chester-plan-attack` attacks internal logic and execution feasibility
- `plan-doc-review` checks TDR compliance
- This skill asks: will the plan introduce structural code quality problems?

All three can run on the same plan without meaningful overlap.

## Focus

This skill is **forward-looking**. The primary question for every agent is:

> What smells will this plan introduce or worsen?

Existing smells are only relevant if the plan directly touches them and makes them worse.
Note those briefly but do not let smell archaeology dominate findings. The deliverable is
a smell forecast, not a codebase audit.

## Workflow

### Step 1 — Identify the plan

Locate the plan to review. The user will either:

- Point to a specific document or file path
- Have just finished planning in the current session

If no plan is identifiable, ask the user to specify which plan to review. Do not guess.

Read the full plan before launching agents. Identify:

- The plan's stated scope and goals
- New classes, methods, interfaces, or abstractions it proposes
- Files and subsystems it touches
- Structural decisions it makes (inheritance, delegation, composition choices)
- Any abstractions it defers, leaves partial, or marks "for later"

### Step 2 — Launch three agents in parallel

Launch all three agents in a single message using the Agent tool. Each agent receives the
full plan text as the first content in the prompt (no header, no framing before it),
followed by a `---` delimiter, then agent-specific analysis instructions. Each agent has
subagent_type "Explore" so it can read the codebase but cannot modify files.

---

**Agent 1 — Bloaters & Dispensables**

Prompt the agent with:

> [full plan text]
>
> ---
>
> Analyze the plan above for Bloater and Dispensable code smells it would introduce into the codebase. Focus on these areas:
>
> Bloater smells to look for:
> - Long Method: does the plan propose logic that should be split but won't be?
> - Large Class: does any proposed class take on too many responsibilities?
> - Primitive Obsession: does the plan pass primitives where value objects belong?
> - Long Parameter List: do proposed methods take too many parameters?
> - Data Clumps: do groups of related data travel together without becoming a named type?
>
> Dispensable smells to look for:
> - Duplicate Code: does the plan reimplement something that already exists, or create
>   two paths that do the same thing?
> - Dead Code: does the plan introduce constructs that will never execute?
> - Lazy Class: does it introduce a class too thin to justify its existence?
> - Speculative Generality: does it add abstraction layers "for future use" with no
>   current consumer?
> - Comments as Crutch: does the plan rely on comments to explain logic that should be
>   self-evident from the code structure?
>
> SOLID-mapped smells to also check:
> - Does any proposed class take on more than one reason to change? (SRP as Large Class)
> - Does the plan introduce fat interfaces that force implementors to depend on methods
>   they don't use? (ISP as Long Parameter List / fat interface bloat)
>
> Rules:
> - Every finding MUST cite the specific plan section, proposed construct name, or
>   existing file path that is the evidence
> - If you cannot find concrete evidence in the plan or codebase, drop the finding
> - Classify each finding as Critical (significant structural harm), Serious (real quality
>   cost that will compound over time), or Minor (low-impact)
> - Note any Bloater/Dispensable risks the plan explicitly addresses in "Risks Acknowledged"
>
> Output format:
> ## Bloaters & Dispensables Findings
>
> ### Findings
> - **[Critical|Serious|Minor]** | `location` | finding | evidence
>   > Optional detail block for complex findings
>
> ### Acknowledged
> - `location` | smell the plan accounts for
>
> Omit empty sections. Omit detail blocks unless the finding cannot be understood without them.

---

**Agent 2 — Couplers & OO Abusers**

Prompt the agent with:

> [full plan text]
>
> ---
>
> Analyze the plan above for Coupler and OO Abuser code smells it would introduce into the codebase. Focus on these areas:
>
> Coupler smells to look for:
> - Feature Envy: does a proposed method seem more interested in another class's data
>   than its own?
> - Inappropriate Intimacy: does the plan create classes that reach too deeply into
>   each other's internals?
> - Message Chains: does the plan produce long call chains (a.B().C().D()) that expose
>   navigation paths that should be hidden?
> - Middle Man: does the plan introduce a class that does nothing but delegate to
>   another, with no value added?
>
> OO Abuser smells to look for:
> - Switch Statements: does the plan use type-based switching where polymorphism belongs?
> - Temporary Field: does a proposed class have fields that are only meaningful in some
>   execution paths?
> - Refused Bequest: does a proposed subclass ignore or override most of what its parent
>   provides, suggesting the inheritance hierarchy is wrong?
> - Alternative Classes with Different Interfaces: does the plan introduce two classes
>   that do the same thing under different method names or signatures?
>
> SOLID-mapped smells to also check:
> - Does any proposed subclass behave in a way that would break code written against the
>   base class contract? (LSP as Refused Bequest)
> - Does the plan make high-level modules depend directly on low-level modules rather
>   than on abstractions? (DIP as Feature Envy / Inappropriate Intimacy)
>
> Rules:
> - Every finding MUST cite the specific plan section, proposed construct, or existing
>   file that is the evidence
> - If you cannot find concrete evidence, drop the finding
> - Classify each finding as Critical, Serious, or Minor
> - Note any Coupler/OO Abuser risks the plan explicitly addresses in "Risks Acknowledged"
>
> Output format:
> ## Couplers & OO Abusers Findings
>
> ### Findings
> - **[Critical|Serious|Minor]** | `location` | finding | evidence
>   > Optional detail block for complex findings
>
> ### Acknowledged
> - `location` | smell the plan accounts for
>
> Omit empty sections. Omit detail blocks unless the finding cannot be understood without them.

---

**Agent 3 — Change Preventers**

Prompt the agent with:

> [full plan text]
>
> ---
>
> Analyze the plan above for Change Preventer code smells — structural decisions that will make the codebase harder to change in the future. Focus on these areas:
>
> Change Preventer smells to look for:
> - Divergent Change: does the plan put multiple unrelated responsibilities into one
>   class such that future changes to different concerns will all require touching it?
> - Shotgun Surgery: does the plan distribute a single concern across many classes such
>   that any future change to that concern requires touching all of them?
> - Parallel Inheritance Hierarchies: does the plan introduce a new class hierarchy that
>   mirrors an existing one, such that adding to one always requires adding to the other?
>
> SOLID-mapped smells to also check:
> - Does the plan put multiple unrelated responsibilities into one class such that future
>   changes to different concerns will all require touching it? (SRP as Divergent Change)
> - Does the plan require modifying existing closed classes to accommodate new behavior
>   rather than extending them? (OCP as Shotgun Surgery)
>
> For each smell found, assess the projected blast radius: roughly how many files would
> need to change if the affected concern were modified in the future?
>
> Rules:
> - Every finding MUST cite specific proposed classes, files, or plan sections as evidence
> - If you cannot find concrete evidence, drop the finding
> - Classify each finding as Critical, Serious, or Minor
> - Note any Change Preventer risks the plan explicitly addresses in "Risks Acknowledged"
>
> Output format:
> ## Change Preventers Findings
>
> ### Findings
> - **[Critical|Serious|Minor]** | `location` | finding | evidence
>   > Optional detail block for complex findings
>
> ### Acknowledged
> - `location` | smell the plan accounts for
>
> Omit empty sections. Omit detail blocks unless the finding cannot be understood without them.

---

### Step 3 — Synthesize the smell report

**Structured Thinking gate:** Before merging, use Structured Thinking to
resolve cross-category overlaps:

1. Call `mcp__structured-thinking__clear_thinking_history` to reset state
2. For each of the three agents' findings, call
   `mcp__structured-thinking__capture_thought` with a distinct `branch_id`
   per agent (e.g., "bloaters-dispensables", "couplers-oo-abusers",
   "change-preventers")
3. For each Critical finding, call
   `mcp__structured-thinking__retrieve_relevant_thoughts` to check whether
   other agents found supporting or conflicting evidence for the same
   underlying issue
4. Where two agents report the same issue at different severities, use
   `mcp__structured-thinking__revise_thought` to collapse to the more
   conservative rating
5. Call `mcp__structured-thinking__get_thinking_summary` to produce the
   collapsed view

Proceed to write the merged report from the summary. The Structured Thinking
output is an internal reasoning artifact — it does not appear in the final
smell report.

**Fallback:** If the Structured Thinking MCP is unavailable, stop and notify
the user. The synthesis step requires this tool for reliable cross-category
deduplication.

After all three agents return, merge their findings into a single report. Deduplicate
findings that multiple agents independently identified — keep the version with stronger
evidence and note which agents both flagged it.

Output format:

```
## Smell Review: [plan name]

**Implementation Risk: [Low | Moderate | Significant | High]**

Agents: Bloaters & Dispensables, Couplers & OO Abusers, Change Preventers.

### Findings
- **Critical** | `location` | finding | evidence | smell: [category] | source: [agent(s)]
- **Serious** | `location` | finding | evidence | smell: [category] | source: [agent(s)]
- **Minor** | `location` | finding | evidence | smell: [category] | source: [agent(s)]

### Acknowledged
- `location` | smell the plan accounts for

### Risk Rationale
- rationale statement
- rationale statement
- rationale statement
```

**Implementation risk criteria:**

The risk level reflects how findings interact, not just their count or individual severity.
Risk compounds — multiple findings that reinforce each other across areas are qualitatively
worse than the same findings in isolation.

- **Low Risk** — Findings are independent, each addressable in isolation. The plan lands
  without adding meaningful complexity, coupling, or architectural debt.
- **Moderate Risk** — Some findings share boundaries; addressing one affects another. The
  plan lands but leaves threads that need attention during implementation.
- **Significant Risk** — Findings reinforce each other across multiple areas. Complexity,
  dependencies, and understandability are all degrading. Coordinated changes needed.
- **High Risk** — Findings are systemic with shared root causes the plan's structure can't
  contain. Deep structural problems will propagate beyond the plan's stated scope.

Omit empty sections. If there are no findings, omit the Findings heading entirely.

### Step 4 — Stop

The report is the deliverable. Do not modify the plan, write files, or take further action
unless the user asks. The user decides how to respond to the findings.

## Boundaries

- This skill reviews plans. It does not review already-written code.
- This skill does not write files. All output is inline in the conversation.
- This skill does not modify plans. It reports findings and the user decides.
- This skill does not check TDR compliance — that is `plan-doc-review`'s job.
- This skill does not attack plan logic or execution feasibility — that is `chester-plan-attack`'s job.
- Each finding must have plan or codebase evidence. Drop any finding that cannot cite
  a real proposed construct or file. This is the single most important rule.
