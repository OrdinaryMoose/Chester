---
name: chester-attack-plan
description: >
  Adversarial review of implementation plans. Spawns six parallel attack agents to find
  logical contradictions, unstated assumptions, execution risks, migration gaps, API contract
  breakage, concurrency hazards, and gaps between what a plan claims and what the code actually
  requires. Auto-triggers as part of chester-build-plan's plan hardening gate. Can also be
  invoked manually via: "attack this plan", "adversarial review", "red-team this",
  "find the weaknesses", "stress test the plan", "what could go wrong", "/chester-attack-plan".
---

# Adversarial Review

Attacks an implementation plan from six independent angles to surface weaknesses before
implementation begins. Every finding must cite real evidence from the codebase -- file paths,
line numbers, dependency chains, or concrete code. Unsubstantiated concerns are not findings.

## Relationship to plan-doc-compliance

Independent and complementary. plan-doc-compliance checks TDR alignment (does the plan follow
the rules?). This skill attacks the plan's internal logic and execution feasibility (will the
plan actually work?). Both can run on the same plan without overlap.

## Workflow

### Step 1 -- Identify the plan

Locate the plan to attack. The user will either:

- Point to a specific document (e.g., a file path or plan in the conversation)
- Have just finished planning in the current session

If no plan is identifiable, ask the user to specify which plan to review. Do not guess.

Read the full plan document before launching agents. Identify:

- The plan's stated scope and goals
- Files and subsystems it claims to touch
- Files and subsystems it claims NOT to touch
- Ordering or sequencing assumptions
- Dependencies on existing behavior

### Step 2 -- Launch six attack agents in parallel

Launch all six agents in a single message using the Agent tool. Each agent receives the
full plan text as the first content in the prompt (no header, no framing before it),
followed by a `---` delimiter, then agent-specific analysis instructions. Each agent has
subagent_type "Explore" so it can search and read the codebase but cannot modify files.

**Agent 1 -- Structural Integrity**

Prompt the agent with:

> [full plan text]
>
> ---
>
> Analyze the plan above for structural integrity gaps — mismatches between what the plan says and what the code actually contains. Focus on these areas:
>
> Your attack vectors:
> 1. Verify every file path, class name, and namespace the plan references actually exists
> 2. Check dependency claims -- does the plan correctly describe which projects reference which?
> 3. Verify "what does NOT change" assertions -- are those areas truly unaffected?
> 4. Find internal contradictions -- does the plan say X in one place and not-X in another?
> 5. Check interface assumptions -- do the interfaces the plan depends on have the signatures it expects?
>
> Rules:
> - Every finding MUST cite a specific file path and line number or a concrete code reference
> - If you cannot find evidence for a concern, it is not a finding -- drop it
> - Classify each finding as Critical (plan cannot work as written), Serious (plan will hit
>   unexpected complications), or Minor (cosmetic or low-impact gap)
> - List any assumptions the plan makes about code structure that you verified as correct --
>   these go in an "Assumptions Verified" section
>
> Output format:
> ## Structural Integrity Findings
>
> ### Findings
> - **[Critical|Serious|Minor]** | `location` | finding | evidence
>   > Optional detail block for complex findings
>
> ### Verified
> - `location` | assertion verified | TRUE
>
> Omit empty sections. Omit detail blocks unless the finding cannot be understood without them.

**Agent 2 -- Execution Risk**

Prompt the agent with:

> [full plan text]
>
> ---
>
> Analyze the plan above for execution risks — practical hazards that will cause problems during implementation, not design concerns. Focus on these areas:
>
> Your attack vectors:
> 1. Blast radius -- what breaks if a step fails partway through? Are there partial-state dangers?
> 2. Ordering hazards -- does step N depend on step M completing, but the plan doesn't enforce that?
> 3. Reversibility -- if the change needs to be rolled back, what is the cost? Are there one-way doors?
> 4. Test migration risks -- will existing tests break? Does the plan account for test updates?
> 5. Build breakage windows -- is there a sequence where the build is broken between steps?
> 6. Data migration -- does any persisted state need to change? Is that addressed?
>
> Rules:
> - Every finding MUST cite a specific file, test, dependency, or build configuration
> - Speculative "what if" concerns without codebase evidence are not findings -- drop them
> - Classify each finding as Critical, Serious, or Minor
> - Note any execution risks the plan explicitly addresses -- these go in "Risks Acknowledged"
>
> Output format:
> ## Execution Risk Findings
>
> ### Findings
> - **[Critical|Serious|Minor]** | `location` | finding | evidence
>   > Optional detail block for complex findings
>
> ### Acknowledged
> - `location` | risk the plan addresses
>
> Omit empty sections. Omit detail blocks unless the finding cannot be understood without them.

**Agent 3 -- Assumptions & Edge Cases**

Prompt the agent with:

> [full plan text]
>
> ---
>
> Analyze the plan above for unstated assumptions and unaddressed edge cases that could derail implementation. Focus on these areas:
>
> Your attack vectors:
> 1. Implicit assumptions -- what does the plan take for granted without stating it?
> 2. Boundary conditions -- empty collections, null values, missing files, zero-length inputs
> 3. External system assumptions -- does the plan assume specific behavior from ANTLR, EF Core,
>    Avalonia, or other frameworks that may not hold?
> 4. Missing error paths -- what happens when the happy path fails?
> 5. Scope creep risk -- does the plan implicitly require changes it doesn't list?
>
> Rules:
> - Every finding MUST cite a specific file, code path, or framework behavior
> - Verify assumptions against actual code -- check if a claimed "always true" is actually true
> - Classify each finding as Critical, Serious, or Minor
> - For each assumption found, note whether you verified it as TRUE, FALSE, or UNVERIFIABLE
>
> Output format:
> ## Assumptions & Edge Case Findings
>
> ### Findings
> - **[Critical|Serious|Minor]** | `location` | finding | evidence
>   > Optional detail block for complex findings
>
> ### Assumptions Register
> | Assumption | Status | Evidence |
> |------------|--------|----------|
> | assumption text | TRUE/FALSE/UNVERIFIABLE | evidence |
>
> Omit empty sections. Omit detail blocks unless the finding cannot be understood without them.

**Agent 4 -- Migration Completeness**

Prompt the agent with:

> [full plan text]
>
> ---
>
> Analyze the plan above for migration completeness — find call sites, usages, and references the plan intends to migrate but fails to explicitly address, leaving the codebase in a partially-migrated state. Focus on these areas:
>
> Your attack vectors:
> 1. Call site coverage -- for every type, method, or interface the plan renames or replaces,
>    search the codebase for all usages. Does the plan account for every call site, or does it
>    only list the obvious ones?
> 2. Implicit usages -- reflection, string-based lookups, serialized type names, generated code,
>    or source generators that reference the old name in ways that won't surface as compile errors
> 3. Cross-assembly leakage -- does the plan migrate the type in one assembly but leave consumers
>    in other assemblies using the old version?
> 4. Test coverage of migrated paths -- are there tests that reference the old type/method that
>    the plan doesn't mention updating?
> 5. "Find all usages" completeness -- if the plan says "update all usages of X", verify whether
>    that is actually all of them, not just the ones in the files it lists
>
> Rules:
> - Every finding MUST cite a specific file path and line number or a concrete code reference
> - Use grep/search to enumerate actual usages -- do not rely on the plan's claim that it covers them all
> - Classify each finding as Critical (broken build or silent runtime failure), Serious
>   (inconsistent state, dual-path confusion), or Minor (non-breaking redundancy)
> - Note any migration paths the plan explicitly enumerates and verifies -- these go in
>   "Migration Coverage Verified"
>
> Output format:
> ## Migration Completeness Findings
>
> ### Findings
> - **[Critical|Serious|Minor]** | `location` | finding | evidence
>   > Optional detail block for complex findings
>
> ### Verified
> - `location` | migration path verified
>
> Omit empty sections. Omit detail blocks unless the finding cannot be understood without them.

**Agent 5 -- API Surface Compatibility**

Prompt the agent with:

> [full plan text]
>
> ---
>
> Analyze the plan above for API surface compatibility issues — find places where the plan changes the public contract of a type or member without acknowledging downstream impact on callers, including callers outside the files the plan lists. Focus on these areas:
>
> Your attack vectors:
> 1. Signature changes -- does the plan alter method signatures, return types, or parameter types
>    on public or internal members? Are all callers updated?
> 2. Removed members -- does the plan delete or rename public members that callers depend on?
>    Check for callers across all assemblies, not just the assembly being changed.
> 3. Interface contract changes -- if the plan modifies an interface, does every implementor
>    in the codebase still satisfy the new contract?
> 4. Constructor changes -- does the plan change constructors in ways that break object
>    initialization in DI configuration, factories, or test setup?
> 5. Implicit contracts -- XML doc, attribute-driven behavior (e.g. [DataMember], source
>    generators), or serialization contracts that the plan changes silently
> 6. Versioning exposure -- are any of the changed APIs exposed across a stability boundary
>    (e.g., a plugin interface, a public NuGet package surface)?
>
> Rules:
> - Every finding MUST cite the specific member whose contract changes and at least one affected
>   caller, with file paths and line numbers
> - Distinguish between breaking changes (callers fail to compile or behave differently at
>   runtime) and additive changes (new members, default parameters that preserve compat)
> - Classify each finding as Critical (compile break or silent behavioral change), Serious
>   (requires caller updates not listed in the plan), or Minor (additive or low-risk)
> - Note any contract changes the plan explicitly handles -- these go in "Compatibility
>   Changes Addressed"
>
> Output format:
> ## API Surface Compatibility Findings
>
> ### Findings
> - **[Critical|Serious|Minor]** | `location` | finding | evidence
>   > Optional detail block for complex findings
>
> ### Addressed
> - `location` | compatibility change the plan handles
>
> Omit empty sections. Omit detail blocks unless the finding cannot be understood without them.

**Agent 6 -- Concurrency & Thread Safety**

Prompt the agent with:

> [full plan text]
>
> ---
>
> Analyze the plan above for concurrency and thread safety hazards — race conditions, async/await misuse, shared mutable state, and UI-thread violations. Focus on these areas:
>
> Your attack vectors:
> 1. Shared mutable state -- does the plan introduce or modify state that can be accessed from
>    multiple threads without synchronization? Look for static fields, singletons, cached
>    collections, and service-lifetime mismatches.
> 2. Async/await hazards -- .Result or .Wait() on async calls (deadlock risk), fire-and-forget
>    Tasks without error handling, ConfigureAwait omissions in library code, async void outside
>    event handlers
> 3. Avalonia UI-thread violations -- does the plan access or mutate ObservableCollection,
>    reactive properties, or controls from a non-UI thread? Does it correctly dispatch via
>    Dispatcher.UIThread where required?
> 4. Ordering assumptions -- does the plan assume that concurrent operations complete in a
>    specific order that the runtime doesn't guarantee?
> 5. Cancellation handling -- does the plan introduce async operations without CancellationToken
>    support? Are existing cancellation paths preserved?
> 6. Lock inversion and deadlock potential -- does the plan introduce nested locking or
>    cross-dependency between locks that could deadlock?
>
> Rules:
> - Every finding MUST cite a specific file, method, or code path -- not a general concern
> - Check actual code to confirm whether a hazard exists, not just whether it could exist
> - Classify each finding as Critical (data corruption or deadlock), Serious (race condition
>   or UI freeze under realistic conditions), or Minor (theoretical or low-probability)
> - Note any concurrency concerns the plan explicitly addresses -- these go in
>   "Concurrency Risks Acknowledged"
>
> Output format:
> ## Concurrency & Thread Safety Findings
>
> ### Findings
> - **[Critical|Serious|Minor]** | `location` | finding | evidence
>   > Optional detail block for complex findings
>
> ### Acknowledged
> - `location` | concurrency risk the plan addresses
>
> Omit empty sections. Omit detail blocks unless the finding cannot be understood without them.

### Step 3 -- Synthesize the threat report

**Before synthesis:** Print each agent's raw findings to the terminal. This
preserves all evidence if the Structured Thinking MCP fails during synthesis.

**Structured Thinking gate:** Before merging, use Structured Thinking to
cross-check findings across agents:

1. Call `mcp__structured-thinking__clear_thinking_history` to reset state
2. For each of the six agents' findings, call
   `mcp__structured-thinking__capture_thought` with a distinct `branch_id`
   per agent (e.g., "structural-integrity", "execution-risk")
3. For each Critical finding, call
   `mcp__structured-thinking__retrieve_relevant_thoughts` to check whether
   other agents found supporting, conflicting, or absent evidence for the
   same underlying issue
4. Where two agents report the same issue at different severities, use
   `mcp__structured-thinking__revise_thought` to collapse to the more
   conservative rating with a bracketed note
5. Where one agent found evidence another agent explicitly cleared, flag
   the conflict rather than silently dropping either finding
6. Call `mcp__structured-thinking__get_thinking_summary` to produce the
   collapsed view

Proceed to write the merged report from the summary. The Structured Thinking
output is an internal reasoning artifact — it does not appear in the final
threat report.

**Fallback:** If the Structured Thinking MCP is unavailable, stop and notify
the user. The synthesis step requires this tool for reliable cross-agent
deduplication. Raw findings have already been printed to the terminal.

After all six agents return, merge their findings into a single threat report. Deduplicate
findings that multiple agents discovered independently -- keep the version with stronger evidence.

Output format:

```
## Adversarial Review: [plan name]

**Implementation Risk: [Low | Moderate | Significant | High]**

Agents: Structural Integrity, Execution Risk, Assumptions & Edge Cases, Migration Completeness, API Surface Compatibility, Concurrency & Thread Safety.

### Findings
- **Critical** | `location` | finding | evidence | source: [agent(s)]
- **Serious** | `location` | finding | evidence | source: [agent(s)]
- **Minor** | `location` | finding | evidence | source: [agent(s)]

### Assumptions
| # | Assumption | Status | Evidence |

### Risk Rationale
- rationale statement
- rationale statement
- rationale statement
```

**Implementation risk criteria:**

The risk level reflects how findings interact, not just their count or individual severity.
Risk compounds -- multiple findings that reinforce each other across areas are qualitatively
worse than the same findings in isolation.

- **Low Risk** -- Findings are independent, each addressable in isolation. The plan lands
  without adding meaningful complexity, coupling, or architectural debt.
- **Moderate Risk** -- Some findings share boundaries; addressing one affects another. The
  plan lands but leaves threads that need attention during implementation.
- **Significant Risk** -- Findings reinforce each other across multiple areas. Complexity,
  dependencies, and understandability are all degrading. Coordinated changes needed.
- **High Risk** -- Findings are systemic with shared root causes the plan's structure can't
  contain. Deep structural problems will propagate beyond the plan's stated scope.


Omit empty sections. If there are no findings, omit the Findings heading entirely.

#### Step 3.1
Output the threat report to the terminal to the user

#### Step 3.1
Output the threat report as a markdown file titled "SprintXXX-Threat Report-XXX.md"

### Step 4 -- Stop

The report is the deliverable. Do not modify the plan, write files, or take further action
unless the user asks. The user decides how to respond to the findings.

## Boundaries

- This skill attacks plans. It does not review code quality, documentation, or test coverage.
- This skill does not write files. All output is inline in the conversation.
- This skill does not modify plans. It reports findings and the user decides.
- This skill does not check TDR compliance -- that is plan-doc-compliance's job.
- Each finding must have codebase evidence. Drop any finding that cannot cite a real file or
  code path. This is the single most important rule.
