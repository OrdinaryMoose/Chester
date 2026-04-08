# Code Smell Review: chester-plan-smell/SKILL.md

## Summary

This is a skill definition file (~310 lines) that defines a three-agent parallel code smell analysis workflow. The review below treats the SKILL.md as "code" in the sense that it is a machine-consumed instruction set that drives agent behavior.

---

## Findings

### 1. Duplicated Instruction Blocks (Duplicate Code — Serious)

**Location:** Agent 1 prompt (lines 76–118), Agent 2 prompt (lines 126–174), Agent 3 prompt (lines 186–221)

All three agent prompts repeat nearly identical boilerplate:

- The "Rules" section (evidence requirement, classification tiers, acknowledged risks) is copy-pasted verbatim across all three agents.
- The "Output format" section is identical across all three agents except for the heading name.

If the rules or output format ever need to change, all three blocks must be updated in lockstep. This is textbook Shotgun Surgery. A shared template or parameterized prompt structure would eliminate the duplication.

### 2. Redundant Smell Definitions Between Agent 3 and SOLID Checks (Duplicate Code — Serious)

**Location:** Agent 3 prompt, lines 189–201

The Change Preventers agent has two nearly identical items:

- "Divergent Change" (line 189–190): "does the plan put multiple unrelated responsibilities into one class such that future changes to different concerns will all require touching it?"
- "SRP as Divergent Change" (line 198–199): "Does the plan put multiple unrelated responsibilities into one class such that future changes to different concerns will all require touching it?"

These are word-for-word identical. The SOLID-mapped check adds no new information — it just repeats the smell definition with an SRP label. This will cause agents to double-count the same finding, inflating results. The same near-duplication exists for OCP/Shotgun Surgery (lines 192–193 vs 200–201), though the wording diverges slightly more there.

### 3. Hard Dependency on Structured Thinking MCP (Inappropriate Intimacy — Serious)

**Location:** Step 3, lines 227–251

The synthesis step has a hard dependency on the `mcp__structured-thinking` tool chain, calling five specific MCP methods by name. The fallback behavior (line 249–251) is to **stop entirely and notify the user** if the MCP is unavailable. This means the entire skill becomes non-functional if one external tool is missing, even though the core value (merging three agent reports) could be done without it.

This is a fragile coupling. A more resilient design would degrade gracefully — perform the merge manually when the MCP is unavailable, even if the deduplication is less rigorous.

### 4. Overly Prescriptive MCP Call Sequence (Rigidity / Change Preventer — Minor)

**Location:** Step 3, lines 230–245

The skill prescribes an exact sequence of five MCP calls with specific parameter names (`branch_id` values like "bloaters-dispensables"). This locks the implementation to the current Structured Thinking API surface. If that API changes method signatures, adds required parameters, or renames methods, this skill breaks. The instructions encode implementation details rather than intent.

### 5. Ambiguous Risk Level Boundaries (Speculative Generality — Minor)

**Location:** Lines 282–294

The four risk levels (Low, Moderate, Significant, High) describe qualitative differences but give no quantitative guidance. "Findings reinforce each other across multiple areas" vs "some findings share boundaries" is subjective. Without examples or decision rules, different invocations will classify the same findings differently. This is a minor smell because some subjectivity is inherent, but the gap between Moderate and Significant is particularly vague.

### 6. No Timeout or Size Guard for Agent Prompts (Missing Defensive Code — Minor)

**Location:** Step 2, line 61

The instruction says to pass "the full plan text" as the first content of each agent prompt. There is no guidance on what to do if the plan is extremely large (e.g., a 50-page plan). Three parallel agents each receiving the full text could hit context limits or degrade quality. A size check or truncation strategy would be prudent.

### 7. Step 4 is Vestigial (Dead Code — Minor)

**Location:** Lines 297–300

Step 4 ("Stop") contains three sentences that all say "don't do anything else." This is a behavioral guardrail, not a workflow step. Calling it "Step 4" implies it is a meaningful phase. It could be folded into Step 3's closing or moved to the Boundaries section where similar constraints already live (lines 302–310), eliminating a misleading step number.

---

## Summary Assessment

| Severity | Count |
|----------|-------|
| Critical | 0     |
| Serious  | 3     |
| Minor    | 4     |

The most actionable issues are the triplicated prompt boilerplate (finding 1), the word-for-word duplicated smell definition in Agent 3 (finding 2), and the all-or-nothing MCP dependency (finding 3). The first two are classic duplication smells that will cause maintenance drift. The third is a design choice that trades resilience for rigor — worth reconsidering given that the skill's core value is the three-agent analysis, not the MCP-mediated merge.
