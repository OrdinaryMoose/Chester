# Addendum 2: Cache-Optimal Subagent Prompt Restructuring

**Implementation of AER Paper Section 8.2, Tier 1, Item 1**

**Authors:** Mike and Claude
**Date:** March 2026
**Sprint:** sprint-007-cache-subagent-prefix
**Status:** Implemented and merged

---

# 1. Relationship to the Parent Analysis

This addendum documents the implementation and design rationale for the first Tier 1 intervention identified in "AI Agent Effectiveness Review of the CHESTER Multi-Agent System Under Token Cost Constraints" (March 2026), Section 8.2:

> **1. Prompt caching for subagent stable prefixes.**
> Affects: write-code, attack-plan, smell-code, doc-sync, dispatch-agents.
> Expected impact: Q unchanged, P(success) unchanged, E[C_api] reduced by up to 23% of total pipeline cost. The 46 subagent invocations share ~18-19K tokens of identical prefix (system prompt + CLAUDE.md). At Anthropic's cached pricing (10% of standard input), achieving consistent cache hits on this prefix saves approximately 850K tokens worth of effective cost per pipeline run. This is the single highest-ROI intervention identified in the analysis and requires no architectural change — only prefix-matching discipline in how subagent contexts are constructed.

The parent analysis identified this as the single highest-ROI intervention. This addendum describes what was changed, the technical constraints that shaped the design, and where the actual mechanism of cache benefit differs from the parent analysis's initial framing.

# 2. Reframing: What Chester Can and Cannot Control

## 2.1 The Parent Analysis's Assumption

The parent analysis framed prompt caching as requiring "prefix-matching discipline in how subagent contexts are constructed." This framing implicitly assumes that Chester controls the full API request structure — system prompt, tool definitions, and user message. The intervention was expected to require "no architectural change — only prefix-matching discipline."

Investigation during the design phase revealed that this assumption needs refinement. Chester operates one layer above the API: skills are SKILL.md files that instruct Claude Code on how to use the Agent tool. The actual API request is constructed by Claude Code's harness, not by Chester.

## 2.2 The Three-Layer Model

Each subagent API call contains three layers of content, in cache-priority order:

**Layer 1 — System prefix (~18-19K tokens):** System prompt, CLAUDE.md, tool definitions. Managed entirely by Claude Code's harness. Identical across all subagent invocations within a session. Chester cannot modify, reorder, or annotate this layer.

**Layer 2 — Shared payload (variable, typically 5-20K tokens):** The plan text, task text, or other content that Chester pastes into the Agent tool's `prompt` parameter. This is the same document across multiple agents within a skill (all 6 attack-plan agents receive the same plan) and potentially across skills (attack-plan and smell-code receive the same plan during hardening).

**Layer 3 — Agent-specific instructions (typically 1-3K tokens):** Role descriptions, attack vectors, smell checklists, output format specifications. Different for each agent.

## 2.3 Where Cache Benefits Apply

Anthropic's prompt cache operates on byte-identical prefix matching in strict order: tools -> system -> messages. The cache prefix is cumulative — each successive matching byte extends the cached region.

**Layer 1** is likely already cached by Claude Code's harness. Claude Code reportedly achieves 92% cache reuse on its main agent loop through techniques including deferred tool loading (sending lightweight stubs instead of full tool schemas) and appending system reminders to user messages rather than editing the system prompt. Whether this extends to Agent tool subagent calls is not directly observable from Chester's layer, but the architectural incentive for Claude Code to cache this prefix is strong.

**Layer 2** is where Chester's intervention applies. If the shared payload (plan text) is the first content in the user message — before any agent-specific framing — then the cache prefix extends through the entire payload. If agent-specific content (role descriptions, skill-specific headers) comes first, the prefix diverges immediately and the shared payload cannot be cached.

**Layer 3** is inherently different per agent and is never cached.

The parent analysis's 23% savings estimate assumed caching of Layer 1 (the system prefix). The actual intervention targets Layer 2 (the shared payload within the user message). The Layer 1 savings may already be realized by Claude Code; the Layer 2 savings are new and depend on whether Claude Code places cache breakpoints within the user message content.

# 3. The Intervention: Content-First Prompt Structure

## 3.1 Structural Change

All subagent prompts were restructured to place shared content as the literal first bytes of the user message, followed by a `---` delimiter, then agent-specific task instructions.

**Before:**
```
> You are a structural integrity auditor attacking an implementation plan.
> Your job is to find gaps between what the plan says and what the code
> actually contains.
>
> The plan to attack:
> [full plan text]
>
> Your attack vectors:
> [agent-specific instructions]
```

**After:**
```
> [full plan text]
>
> ---
>
> Analyze the plan above for structural integrity gaps — mismatches between
> what the plan says and what the code actually contains. Focus on these areas:
>
> [agent-specific instructions]
```

The plan text is the first content in every prompt. No role description, no framing header, no skill-specific preamble precedes it. The `---` delimiter marks the boundary between the cached prefix (shared content) and the dynamic suffix (agent-specific instructions).

## 3.2 Role Description Removal

All role descriptions ("You are a structural integrity auditor," "You are a code smell analyst") were removed entirely. This was not merely a reordering — the role descriptions were eliminated and replaced with directive-style task instructions after the delimiter.

**Rationale.** The design phase surfaced a question: do role descriptions actually improve subagent output quality on frontier models? Analysis concluded that role descriptions serve two functions — persona activation (minor value on frontier models) and domain scoping (real value). Domain scoping can be achieved identically through directive instructions: "Analyze the plan above for structural integrity gaps" scopes the domain as effectively as "You are a structural integrity auditor."

Removing roles rather than relocating them provides a triple benefit: smaller prompts (fewer tokens per agent), better prefix matching (no divergent role text between shared content and agent-specific instructions), and — the design hypothesis — no quality degradation on frontier models where task instructions dominate behavior more than persona framing.

**Evidence category:** [B] — Analytically derived from prompt engineering research on frontier model behavior. This is an untested change to Chester's prompt style; the first full pipeline run post-implementation will provide Category A evidence on output quality.

## 3.3 Cross-Skill Prefix Sharing

The intervention enforces byte-identical plan text preambles across `chester-attack-plan` (6 agents) and `chester-smell-code` (4 agents). Both skills are dispatched in parallel during `chester-build-plan`'s hardening phase and receive the same plan document.

Previously, the two skills used different framing before the plan text: attack-plan used "The plan to attack:" while smell-code used "The plan to review:" These headers — a difference of a few characters — broke prefix sharing between the two skills.

After the intervention, all 10 agents (6 attack + 4 smell) begin with the identical plan text, byte for byte. One cache write during the first agent's dispatch serves as the cached prefix for the remaining 9 agents. At Anthropic's pricing (10% of standard input for cache reads vs. 125% for cache writes), this converts 9 full-price input reads into 9 cache reads — a 90% discount on the plan text portion for those 9 agents.

## 3.4 Write-Code Template Restructuring

The same pattern was applied to `chester-write-code`'s per-task subagent templates:

- **Implementer** (`implementer.md`): Task text first, then implementation instructions
- **Spec reviewer** (`spec-reviewer.md`): Task requirements first, then review instructions
- **Code reviewer** (`code-reviewer.md`): Plan/requirements first, then review checklist

Within a single task's lifecycle, the implementer and spec reviewer both receive the same task text. Placing it first enables partial prefix sharing between these two dispatches — though the cache window is smaller (one task's text, typically 1-3K tokens) than the plan-level sharing (10-20K tokens).

# 4. Cache Mechanics and Expected Behavior

## 4.1 Anthropic's Prompt Cache Model

Anthropic's prompt cache operates on the following principles, documented in their API reference:

- **Byte-identical prefix matching:** Any modification — including a single character change — invalidates the cache from that point forward.
- **Hierarchical composition:** Cache prefixes accumulate in order: tools -> system -> messages. Each layer builds upon the previous.
- **Minimum prefix thresholds:** 4,096 tokens for Claude Opus 4.6; 2,048 tokens for Claude Sonnet 4.6. Shorter prefixes cannot be cached.
- **TTL:** 5 minutes default, extendable to 1 hour. Subagents dispatched within this window share cache entries.
- **Up to 4 explicit cache breakpoints** per request.
- **20-block lookback window** per breakpoint for finding prior cache entries.

## 4.2 Expected Cache Behavior for Chester Subagents

For the 10 plan-level agents dispatched during hardening (6 attack + 4 smell):

1. **First agent dispatched:** Layer 1 (system prefix, ~19K tokens) is cached (if not already by Claude Code). Layer 2 (plan text, ~10-20K tokens) may be cached if Claude Code places a cache breakpoint within the user message or uses automatic caching with lookback.
2. **Subsequent agents:** Layer 1 reads from cache (10% cost). Layer 2 reads from cache if a breakpoint covers it. Layer 3 (agent-specific instructions) is always full-price.

**Timing constraint:** All 10 agents are dispatched in parallel within a single message during hardening. They reach the API within milliseconds of each other — well within the 5-minute TTL. This is the optimal dispatch pattern for cache utilization.

## 4.3 What Remains Unknown

The critical unknown is whether Claude Code places cache breakpoints within the user message content of Agent tool calls. If Claude Code uses automatic caching (placing the breakpoint on the last cacheable block), the lookback mechanism may or may not find the plan text prefix depending on whether prior breakpoints were written at compatible positions.

This is not observable from Chester's layer. The parent analysis's 23% savings estimate assumes full cache utilization of the system prefix; the additional savings from Layer 2 caching are conditional on Claude Code's caching implementation for subagent calls.

# 5. Expected Effect on AER Variables

## 5.1 Quality (Q): Unchanged — With Monitoring

The structural change (content-first ordering) preserves all analytical instructions — attack vectors, smell checklists, review criteria — unchanged. Only their position in the prompt shifts (from before the plan text to after). The role description removal is the change with quality risk: if persona framing improves output quality on adversarial tasks, removing it could degrade finding quality.

The design rationale holds that directive-style instructions ("Analyze the plan above for structural integrity gaps") provide equivalent domain scoping to role descriptions ("You are a structural integrity auditor"). This is consistent with prompt engineering research on frontier models but has not been empirically validated in Chester's specific context.

**Recommendation:** Compare the first post-implementation adversarial review against prior reviews for finding quality, specificity, and evidence citation rates. If degradation is observed, role descriptions can be reintroduced after the `---` delimiter without breaking prefix sharing.

**Evidence category:** [B] — Analytically derived, with acknowledged uncertainty.

## 5.2 Success Probability P(success): Unchanged

Subagent success probability is governed by the analytical instructions (attack vectors, checklists) and access to the codebase (Explore subagent type). Neither is affected by prompt ordering or role description removal.

**Evidence category:** [B] — Analytically derived.

## 5.3 Expected Cost E[C_api]: Reduced

The cost reduction operates through two mechanisms of differing certainty:

**Mechanism 1 (High confidence): System prefix caching.** The ~18-19K token system prefix is shared across all 46 subagent invocations. If Claude Code achieves cache hits on this prefix — which its reported 92% cache reuse rate suggests is likely — the intervention's content-first ordering does not break this caching. This is a "do no harm" mechanism: the restructuring avoids patterns that could interfere with caching that Claude Code already provides.

**Mechanism 2 (Medium confidence): User message prefix caching.** The plan text (~10-20K tokens) placed first in 10 agent prompts becomes a cacheable prefix within the user message. If Claude Code's caching extends into user message content (via automatic caching with lookback or explicit breakpoints), the first agent's dispatch writes this prefix to cache and the remaining 9 read from cache at 10% cost.

**Quantitative estimate for Mechanism 2:**
- Plan text: ~15K tokens (typical)
- Full-price writes: 1 agent x 15K x 1.25 = 18.75K effective tokens
- Cache reads: 9 agents x 15K x 0.10 = 13.5K effective tokens
- Without caching: 10 agents x 15K = 150K tokens
- With caching: 18.75K + 13.5K = 32.25K effective tokens
- Savings: 117.75K tokens (~78% reduction on plan text portion)

Against the parent analysis's estimated 3,700K total pipeline cost, this represents approximately 3.2% savings — significantly less than the parent analysis's 23% estimate, which assumed system prefix caching. If system prefix caching (Mechanism 1) is also attributable to this intervention, the combined savings approach the 23% figure.

**Evidence category:** [C] — Illustrative estimate. Actual savings depend on Claude Code's caching behavior, plan document size, and cache hit rates.

# 6. Post-Session Cache Analysis

## 6.1 Verification Capability

As part of this sprint, a cache analysis option was added to `chester-finish-plan` (Step 7, Session Artifacts). This provides post-session verification of actual cache behavior by parsing the session JSONL for `cache_read_input_tokens` and `cache_creation_input_tokens` fields.

The analysis produces a per-call breakdown:

```
| Call # | Input | Cache Write | Cache Read | Hit Rate |
|--------|-------|-------------|------------|----------|
| 1      | 500   | 19000       | 0          | 0%       |
| 2      | 500   | 0           | 19000      | 97%      |
| ...    | ...   | ...         | ...        | ...      |
```

This is a best-effort diagnostic — the JSONL structure may vary across Claude Code versions, and the path formula for locating session files is approximate. But it provides the Category A measurement capability that the parent analysis identified as the highest-priority next step (Section 8.3, Immediate).

## 6.2 What the First Measurement Will Reveal

The first pipeline run with the cache analysis option will answer three questions:

1. **Is the system prefix actually cached?** If `cache_read_input_tokens` for the second subagent call shows ~19K tokens read from cache, the system prefix is being cached. If not, either Claude Code doesn't cache subagent system prefixes or something in the request construction breaks prefix matching.

2. **Is the user message plan text cached?** If cache reads exceed the system prefix size (~19K) for agents 2-10, the plan text within the user message is also being cached. This validates Mechanism 2.

3. **What is the actual cache hit rate?** The parent analysis estimated 42% of total pipeline tokens as cache-eligible. The measurement will provide the actual rate, which may be significantly higher or lower depending on Claude Code's caching implementation.

# 7. Design Decisions

## 7.1 Cross-Skill Coupling (Option A)

The design phase considered two options for cross-skill prefix sharing:

- **Option A:** Byte-identical plan preamble across attack-plan and smell-code (one cache entry for all 10 agents)
- **Option B:** Skill-specific framing before plan text (two cache entries, one per skill)

Option A was selected. The coupling cost — both skills must maintain byte-identical plan text injection — is low because these skills already share a pipeline lifecycle (dispatched together by build-plan). The savings difference is one cache write (~15K tokens at 1.25x).

## 7.2 Build-Plan and Build-Spec Reviewers Excluded

The plan reviewer (`chester-build-plan/plan-reviewer.md`) and spec reviewer (`chester-build-spec/spec-reviewer.md`) were excluded from the restructuring. Both use file-path-based prompts rather than pasting content, and each represents only 1-3 subagent calls. The cache benefit of restructuring these prompts is negligible.

## 7.3 Blockquote Convention Preserved

Both `chester-attack-plan` and `chester-smell-code` use markdown blockquote syntax (`>`) for prompt content in SKILL.md. The spec stated plan text "must not be wrapped in quotes, blockquotes, or code fences — raw text only." The implementation preserved blockquotes because both skills use the convention identically — the `>` markers are part of the SKILL.md display convention and contribute to byte-identity rather than breaking it. Changing the convention would have been scope creep with no cache benefit.

# 8. Limitations

## 8.1 Unverified Caching Behavior

The core mechanism — whether Claude Code caches user message content for Agent tool subagent calls — has not been verified. The entire intervention is designed to maximize the probability of cache hits under the assumption that caching is available, but if Claude Code only caches the system prefix (or doesn't cache subagent calls at all), the user-message-level optimization provides no benefit.

The cache analysis tool added to finish-plan exists precisely to resolve this uncertainty.

## 8.2 Role Description Removal Is Untested

The removal of role descriptions from all subagent prompts is a quality hypothesis, not a validated finding. Chester has used role descriptions since its initial implementation; this sprint is the first time they have been removed. If adversarial review quality degrades (fewer findings, weaker evidence, less specificity), the roles should be restored after the `---` delimiter at the cost of a few hundred tokens per agent.

## 8.3 Single-Session Measurement Window

Cache TTL is 5 minutes (default) or up to 1 hour. Within a single pipeline run, all hardening agents dispatch within seconds of each other, well within the TTL. But if a pipeline run is interrupted and resumed, or if hardening agents are dispatched in separate phases, the cache entries may expire between dispatches. The intervention does not address TTL management.

## 8.4 Development-Mode Cache Invalidation

As noted in the parent analysis (Section 7.4): "Any edit to a SKILL.md file invalidates the cache prefix for all subagents using that skill." During active Chester development — when SKILL.md files change frequently — cache hit rates will be substantially lower than steady-state estimates. This is expected and acceptable; the optimization targets production usage, not development iterations.

# 9. Conclusion

Cache-optimal prompt restructuring was implemented as the highest-priority Tier 1 intervention from the parent analysis. The intervention places shared content (plan text or task text) as the first bytes of every subagent prompt, removes role descriptions in favor of directive-style instructions, and enforces byte-identical plan text preambles across cross-skill agents.

The design was shaped by a critical reframing: Chester controls only the user message content of Agent tool calls, not the system prefix or tool definitions. This scoped the optimization to Layer 2 (shared payload within the user message) rather than Layer 1 (system prefix managed by Claude Code). The parent analysis's 23% savings estimate assumed Layer 1 caching; the user-message-level optimization provides an additional ~3% savings on plan text caching, conditional on Claude Code's caching behavior extending into user message content.

The intervention includes a post-session cache analysis tool in `chester-finish-plan` that will provide the first Category A measurement of actual cache hit rates. This measurement will validate or invalidate the savings estimates and determine whether further cache optimization work is warranted.
