# Response Control Format Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace free-form narrative output format instructions in subagent prompts with a structured, compact finding format optimized for orchestrator consumption.

**Architecture:** Each affected skill file contains embedded prompt templates with output format blocks. The format blocks are replaced in-place, preserving surrounding prompt structure (blockquotes for agent prompts, code fences for templates). No new files created.

**Tech Stack:** Markdown (skill prompt files)

---

### Task 1: Update attack-plan agent output formats

**Files:**
- Modify: `chester-attack-plan/SKILL.md`

**Context:** The file contains 6 agent prompts, each inside a blockquote (`>` prefix). Each prompt ends with an `Output format:` section specifying severity-bucketed headings. Replace each agent's output format with the new structured finding format. The classification rules and attack vectors in each prompt remain unchanged.

**IMPORTANT:** All new format lines inside agent prompts MUST keep the `>` blockquote prefix. Lines outside blockquotes (like the synthesized report) use different formatting.

- [ ] **Step 1: Replace Agent 1 (Structural Integrity) output format**

Replace lines 74-79:
```
> Output format:
> ## Structural Integrity Findings
> ### Critical
> ### Serious
> ### Minor
> ### Assumptions Verified
```

With:
```
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
```

- [ ] **Step 2: Replace Agent 2 (Execution Risk) output format**

Replace lines 106-111:
```
> Output format:
> ## Execution Risk Findings
> ### Critical
> ### Serious
> ### Minor
> ### Risks Acknowledged
```

With:
```
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
```

- [ ] **Step 3: Replace Agent 3 (Assumptions & Edge Cases) output format**

Replace lines 137-143:
```
> Output format:
> ## Assumptions & Edge Case Findings
> ### Critical
> ### Serious
> ### Minor
> ### Assumptions Register
> | Assumption | Status | Evidence |
```

With:
```
> Output format:
> ## Assumptions & Edge Case Findings
>
> ### Findings
> - **[Critical|Serious|Minor]** | `location` | finding | evidence
>   > Optional detail block for complex findings
>
> ### Assumptions Register
> - `location` | assumption | TRUE/FALSE/UNVERIFIABLE | evidence
>
> Omit empty sections. Omit detail blocks unless the finding cannot be understood without them.
```

- [ ] **Step 4: Replace Agent 4 (Migration Completeness) output format**

Replace lines 177-182:
```
> Output format:
> ## Migration Completeness Findings
> ### Critical
> ### Serious
> ### Minor
> ### Migration Coverage Verified
```

With:
```
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
```

- [ ] **Step 5: Replace Agent 5 (API Surface Compatibility) output format**

Replace lines 219-224:
```
> Output format:
> ## API Surface Compatibility Findings
> ### Critical
> ### Serious
> ### Minor
> ### Compatibility Changes Addressed
```

With:
```
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
```

- [ ] **Step 6: Replace Agent 6 (Concurrency & Thread Safety) output format**

Replace lines 262-267:
```
> Output format:
> ## Concurrency & Thread Safety Findings
> ### Critical
> ### Serious
> ### Minor
> ### Concurrency Risks Acknowledged
```

With:
```
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
```

- [ ] **Step 7: Verify all 6 agent formats are updated**

Read `chester-attack-plan/SKILL.md` and confirm:
- All 6 output format blocks use the new `### Findings` / structured row format
- All blockquote prefixes (`>`) are preserved
- No surrounding prompt content (attack vectors, rules, classification criteria) was altered
- Each agent still has its domain-specific verified/acknowledged section name

- [ ] **Step 8: Commit**

```bash
git add chester-attack-plan/SKILL.md
git commit -m "feat: structured output format for attack-plan agents"
```

---

### Task 2: Update attack-plan synthesized report format

**Files:**
- Modify: `chester-attack-plan/SKILL.md`

**Context:** The synthesized report format is inside a code fence (lines 306-331). This is the format the orchestrator produces after merging findings from all 6 agents. Replace the severity-bucketed sections with a flat findings list that includes source agent attribution.

- [ ] **Step 1: Replace synthesized report format**

Replace the code fence block at lines 306-331:
```
## Adversarial Review: [plan name]

**Implementation Risk: [Low | Moderate | Significant | High]**

Reviewed by six independent attack agents: Structural Integrity, Execution Risk,
Assumptions & Edge Cases, Migration Completeness, API Surface Compatibility,
Concurrency & Thread Safety.

### Critical Findings
[numbered list -- each with source agent, evidence, and impact]

### Serious Findings
[numbered list -- each with source agent, evidence, and impact]

### Minor Findings
[numbered list -- each with source agent, evidence, and impact]

### Assumptions Register
| # | Assumption | Status | Evidence |
[merged from all agents, deduplicated]

### Risk Rationale
[3-5 statements explaining why this risk level was chosen, citing specific
finding interactions or compounding effects]
```

With:
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

- [ ] **Step 2: Update the "Omit empty severity sections" instruction**

The existing line (around line 349) says:
```
Omit empty severity sections. If there are no findings at a severity level, skip that heading.
```

Replace with:
```
Omit empty sections. If there are no findings, omit the Findings heading entirely.
```

- [ ] **Step 3: Verify synthesized report format**

Read `chester-attack-plan/SKILL.md` lines 300-355 and confirm:
- The code fence contains the new flat findings format with `source:` field
- The Assumptions Register is preserved
- Risk Rationale uses bullet format
- The implementation risk criteria section (Low/Moderate/Significant/High definitions) is unchanged

- [ ] **Step 4: Commit**

```bash
git add chester-attack-plan/SKILL.md
git commit -m "feat: structured synthesized report format for attack-plan"
```

---

### Task 3: Update smell-code agent and synthesized report formats

**Files:**
- Modify: `chester-smell-code/SKILL.md`

**Context:** Same transformation as Tasks 1-2, applied to smell-code. 4 agent output format blocks plus the synthesized report. Agent prompts are blockquoted. Synthesized report is inside a code fence.

- [ ] **Step 1: Replace Agent 1 (Bloaters & Dispensables) output format**

Replace lines 101-106:
```
> Output format:
> ## Bloaters & Dispensables Findings
> ### Critical
> ### Serious
> ### Minor
> ### Risks Acknowledged
```

With:
```
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
```

- [ ] **Step 2: Replace Agent 2 (Couplers & OO Abusers) output format**

Replace lines 148-151:
```
> Output format:
> ## Couplers & OO Abusers Findings
> ### Critical
> ### Serious
> ### Minor
> ### Risks Acknowledged
```

With:
```
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
```

- [ ] **Step 3: Replace Agent 3 (Change Preventers) output format**

Replace lines 184-188:
```
> Output format:
> ## Change Preventers Findings
> ### Critical
> ### Serious
> ### Minor
> ### Risks Acknowledged
```

With:
```
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
```

- [ ] **Step 4: Replace Agent 4 (SOLID Violations) output format**

Replace lines 225-229:
```
> Output format:
> ## SOLID Violations Findings
> ### Critical
> ### Serious
> ### Minor
> ### Risks Acknowledged
```

With:
```
> Output format:
> ## SOLID Violations Findings
>
> ### Findings
> - **[Critical|Serious|Minor]** | `location` | finding | evidence
>   > Optional detail block for complex findings
>
> ### Acknowledged
> - `location` | smell the plan accounts for
>
> Omit empty sections. Omit detail blocks unless the finding cannot be understood without them.
```

- [ ] **Step 5: Replace synthesized report format**

Replace the code fence block at lines 272-294:
```
## Smell Review: [plan name]

**Implementation Risk: [Low | Moderate | Significant | High]**

Reviewed by four independent agents: Bloaters & Dispensables, Couplers & OO Abusers,
Change Preventers, SOLID Violations.

### Critical Findings
[numbered list — each with source agent(s), smell category, evidence, and projected impact]

### Serious Findings
[numbered list — each with source agent(s), smell category, evidence, and projected impact]

### Minor Findings
[numbered list — each with source agent(s), smell category, evidence, and projected impact]

### Risks Acknowledged
[smells the plan already accounts for — listed without severity]

### Risk Rationale
[3-5 statements explaining why this risk level was chosen, citing specific
finding interactions or compounding effects]
```

With:
```
## Smell Review: [plan name]

**Implementation Risk: [Low | Moderate | Significant | High]**

Agents: Bloaters & Dispensables, Couplers & OO Abusers, Change Preventers, SOLID Violations.

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

- [ ] **Step 6: Update the "Omit empty severity sections" instruction**

Find the line (around line 312):
```
Omit empty severity sections. If there are no findings at a severity level, skip that heading.
```

Replace with:
```
Omit empty sections. If there are no findings, omit the Findings heading entirely.
```

- [ ] **Step 7: Verify all changes**

Read `chester-smell-code/SKILL.md` and confirm:
- All 4 agent output format blocks use the new structured row format
- Blockquote prefixes preserved in agent prompts
- Synthesized report uses flat findings list with `smell:` and `source:` fields
- No surrounding content altered (attack vectors, rules, smell definitions)

- [ ] **Step 8: Commit**

```bash
git add chester-smell-code/SKILL.md
git commit -m "feat: structured output format for smell-code agents and report"
```

---

### Task 4: Update write-code implementer report format

**Files:**
- Modify: `chester-write-code/implementer.md`

**Context:** The implementer template is inside a code fence. The report format section at lines 112-119 is a bullet list. Replace with structured sections.

- [ ] **Step 1: Replace report format section**

Replace lines 112-119:
```
    - **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
    - What you implemented (or what you attempted, if blocked)
    - What you tested and test results
    - Files changed
    - Self-review findings (if any)
    - Any issues or concerns
    - **Commit verification:** `git status` output after commit (must show clean tree for files related to this task)
```

With:
```
    ## Implementation Report

    **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT

    ### Files Changed
    - `path` | what changed

    ### Tests
    - `test name or path` | Pass/Fail | description

    ### Self-Review Issues
    - **[Critical|Important|Minor]** | `location` | finding | evidence

    ### Concerns
    - concern (only if Status is DONE_WITH_CONCERNS or BLOCKED or NEEDS_CONTEXT)

    ### Commit Verification
    [paste git status output]
```

Note: The indentation (4 spaces) must be preserved — this content is inside a code fence within the template.

- [ ] **Step 2: Verify the change**

Read `chester-write-code/implementer.md` and confirm:
- The report format uses structured sections
- The Status line is preserved
- Indentation matches the surrounding template content
- The "When done, report:" lead-in text above the format block is still intact

- [ ] **Step 3: Commit**

```bash
git add chester-write-code/implementer.md
git commit -m "feat: structured report format for implementer subagent"
```

---

### Task 5: Update write-code spec-reviewer report format

**Files:**
- Modify: `chester-write-code/spec-reviewer.md`

**Context:** The report format at lines 70-73 is inside a code fence. Replace with structured format.

- [ ] **Step 1: Replace report format**

Replace lines 70-73:
```
    Report:
    - Pass: Spec compliant, commit complete (if everything matches after code inspection AND all changes are committed)
    - Fail — Spec issues: [list specifically what's missing or extra, with file:line references]
    - Fail — Commit issues: [list files claimed but not committed, or uncommitted changes found]
```

With:
```
    Report format:

    ## Spec Review

    **Verdict:** Pass | Fail

    ### Issues
    - **[Spec|Commit]** | `location` | finding | evidence

    ### Verified
    - `location` | requirement met

    Omit Issues section if Verdict is Pass. Omit Verified section if empty.
```

Note: 4-space indentation preserved for code fence context.

- [ ] **Step 2: Verify the change**

Read `chester-write-code/spec-reviewer.md` and confirm:
- The report format uses Verdict + structured rows
- Indentation matches surrounding template
- The preceding review instructions are intact

- [ ] **Step 3: Commit**

```bash
git add chester-write-code/spec-reviewer.md
git commit -m "feat: structured report format for spec reviewer subagent"
```

---

### Task 6: Update write-code code-reviewer and quality-reviewer formats

**Files:**
- Modify: `chester-write-code/code-reviewer.md`
- Modify: `chester-write-code/quality-reviewer.md`

**Context:** The code-reviewer has an output format section (lines 65-92) and an example (lines 112-146). The quality-reviewer has a one-line description of expected return format (line 27).

- [ ] **Step 1: Replace code-reviewer output format**

Replace lines 65-92 (the `## Output Format` section through the end of the `### Assessment` block):
```
## Output Format

### Strengths
[What's well done? Be specific.]

### Issues

#### Critical (Must Fix)
[Bugs, security issues, data loss risks, broken functionality]

#### Important (Should Fix)
[Architecture problems, missing features, poor error handling, test gaps]

#### Minor (Nice to Have)
[Code style, optimization opportunities, documentation improvements]

**For each issue:**
- File:line reference
- What's wrong
- Why it matters
- How to fix (if not obvious)

### Recommendations
[Improvements for code quality, architecture, or process]

### Assessment

**Ready to merge?** [Yes/No/With fixes]

**Reasoning:** [Technical assessment in 1-2 sentences]
```

With:
```
## Output Format

## Code Review

**Verdict:** Yes | No | With fixes

### Strengths
- `location` | what is well done

### Issues
- **Critical** | `location` | finding | evidence
  > How to fix (only if not obvious)
- **Important** | `location` | finding | evidence
- **Minor** | `location` | finding | evidence

### Recommendations
- `location` | recommendation

Omit empty sections.
```

- [ ] **Step 2: Replace code-reviewer example**

Replace lines 112-146 (the example inside the code fence):
```
### Strengths
- Clean database schema with proper migrations (db.ts:15-42)
- Comprehensive test coverage (18 tests, all edge cases)
- Good error handling with fallbacks (summarizer.ts:85-92)

### Issues

#### Important
1. **Missing help text in CLI wrapper**
   - File: index-conversations:1-31
   - Issue: No --help flag, users won't discover --concurrency
   - Fix: Add --help case with usage examples

2. **Date validation missing**
   - File: search.ts:25-27
   - Issue: Invalid dates silently return no results
   - Fix: Validate ISO format, throw error with example

#### Minor
1. **Progress indicators**
   - File: indexer.ts:130
   - Issue: No "X of Y" counter for long operations
   - Impact: Users don't know how long to wait

### Recommendations
- Add progress reporting for user experience
- Consider config file for excluded projects (portability)

### Assessment

**Ready to merge: With fixes**

**Reasoning:** Core implementation is solid with good architecture and tests. Important issues (help text, date validation) are easily fixed and don't affect core functionality.
```

With:
```
## Code Review

**Verdict:** With fixes

### Strengths
- `db.ts:15-42` | Clean database schema with proper migrations
- `summarizer.ts:85-92` | Good error handling with fallbacks

### Issues
- **Important** | `index-conversations:1-31` | No --help flag, users won't discover --concurrency | CLI wrapper has no help text
- **Important** | `search.ts:25-27` | Invalid dates silently return no results | No ISO format validation on date input
- **Minor** | `indexer.ts:130` | No "X of Y" counter for long operations | Users don't know how long to wait

### Recommendations
- `indexer.ts` | Add progress reporting for user experience
- `config` | Consider config file for excluded projects (portability)
```

- [ ] **Step 3: Update quality-reviewer expected return format**

In `chester-write-code/quality-reviewer.md`, replace line 27:
```
**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
```

With:
```
**Code reviewer returns:** Verdict, Strengths, Issues (Critical/Important/Minor), Recommendations — all in structured row format
```

- [ ] **Step 4: Verify all changes**

Read both files and confirm:
- Code-reviewer output format uses Verdict + structured rows
- Example matches the new format
- Quality-reviewer describes the updated return format
- No surrounding content altered (review checklist, critical rules)

- [ ] **Step 5: Commit**

```bash
git add chester-write-code/code-reviewer.md chester-write-code/quality-reviewer.md
git commit -m "feat: structured output format for code reviewer and quality reviewer"
```
