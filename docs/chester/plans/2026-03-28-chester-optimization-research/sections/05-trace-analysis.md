# 5. Trace Analysis

This section provides computational estimates of Chester's token consumption across a representative pipeline run. Where empirical data exists, it is used directly. Where it does not, estimates are derived from skill structure, conversation patterns, and the known baselines established in prior measurement sessions. All estimates are explicitly labeled.

## 5.1 Data Collection Methodology

### Available Empirical Data (Category A)

Three sources provide measured token data:

**Session JSONL measurement (2026-03-26).** A live Chester session was instrumented by parsing the Claude Code session JSONL for `usage` fields. This session ran chester-figure-out through the design interview phase (65 API calls). Measured values:

- Starting context at call #1: 20,349 input tokens
- Context at call #65: 45,356 input tokens (2.2x growth)
- Total input tokens consumed across all 65 calls: approximately 2.1M
- Context growth trajectory: roughly linear over the session

**Baseline decomposition (2026-03-26).** The 20,349-token starting baseline was decomposed into controllable and non-controllable components:

| Component | Tokens | % of Baseline |
|-----------|--------|---------------|
| Claude Code system prompt | ~16,193 | 80% |
| chester-start SKILL.md | ~1,625 | 8% |
| Skill descriptions (system-reminder) | ~1,399 | 7% |
| CLAUDE.md | ~1,081 | 5% |
| **Total Chester** | **~4,156** | **20%** |

**Token usage log (diagnostic session, 2026-03-27).** Two entries captured via the chester-start-debug diagnostic mode:

| Section | Step | Context % |
|---------|------|-----------|
| figure-out | skill-entry | 19% |
| build-spec | skill-entry | 20% |

This confirms that at the transition between figure-out and build-spec, the orchestrator context is at approximately 19-20% of the 1M window (~190K-200K tokens).

**Subagent consolidation analysis (2026-03-27).** The token-use-limits spec documented the subagent dispatch pattern and calculated baseline overhead savings from consolidation. Key values: 43 subagent launches in a 10-task plan, ~20K baseline per subagent, proposed reduction to 27 launches saving ~320K tokens.

### Estimation Methodology for Unmeasured Stages (Category C)

For stages without direct empirical measurement, estimates are derived from:

1. **Skill word counts.** Each SKILL.md and subagent template was measured. Word counts are converted to token estimates at a ratio of approximately 1.3 tokens per word (consistent with the character-based estimation used in the baseline decomposition, where chars/4 and words*1.3 converge).

2. **Conversation turn modeling.** For stages running in the orchestrator's main context, each API call contributes the growing context (all prior turns) plus the new turn's content. For stages dispatching subagents, each subagent starts with the ~20K baseline plus its task-specific payload.

3. **Structural analysis of skill definitions.** The number of steps, review iterations, and subagent dispatches specified in each SKILL.md provides a lower bound on API call count.

4. **Context growth rates.** The empirical measurement shows context growing from ~20K to ~45K over 65 calls in the figure-out phase. This implies roughly 385 tokens of net context growth per API call (new content minus any compaction). This rate is used to estimate context growth in other main-context stages.

All Category C estimates are labeled with "[C]" in the trace tables below.

---

## 5.2 Per-Stage Trace Tables

The following tables estimate token usage for a representative pipeline run: a 10-task implementation plan on a medium-complexity feature, with one review iteration at each review gate. The orchestrator's context window is 1M tokens.

### 5.2.1 chester-figure-out

Empirical data available from the 2026-03-26 measurement session.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~1,200K | [A] Measured: ~2.1M over 65 calls in a session that ran primarily figure-out. Adjusted downward for a typical 12-question interview (~40 calls). |
| Total output tokens | ~40K [C] | Estimated: ~1,000 tokens per response x 40 calls |
| API calls | ~40 [C] | 12 questions + setup + codebase exploration + checkpoints + design brief |
| Subagent launches | 0 | Runs in orchestrator context |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | 2% | [A] 20,349 tokens / 1M = ~2% |
| Context utilization at exit | 19% | [A] Measured from diagnostic log |
| Cache-eligible fraction | ~50% [C] | System prompt + skill content is stable; conversation turns are not |
| D(U) regime | Negligible | Exit at 19%, well below 30% threshold |

**Notes:** This is Chester's most empirically grounded stage. The 2.1M total input measurement was from a 65-call session that included some post-interview analysis beyond the standard figure-out scope. A typical figure-out interview runs 35-45 API calls. The growing-context pattern is clearly visible: early calls send ~20K tokens, late calls send ~45K+, and the cumulative sum over 40 calls approximates 1.2M input tokens.

---

### 5.2.2 chester-build-spec

Partially empirical: the diagnostic log confirms entry context at 20%.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~250K [C] | Estimated: ~8 API calls at average context of ~31K (growing from 200K entry) |
| Total output tokens | ~15K [C] | Spec document (~3K) + review exchanges (~12K) |
| API calls | ~8 [C] | Write spec + 1 review subagent dispatch + review cycle + human gate |
| Subagent launches | 1 [C] | Spec reviewer subagent for automated review |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 20% | [A] Measured from diagnostic log |
| Context utilization at exit | 23% [C] | Estimated: entry + spec content + review exchanges |
| Cache-eligible fraction | ~55% [C] | System prompt + skill content stable; design brief from figure-out is stable within the session |
| D(U) regime | Negligible | Exit at ~23%, below 30% threshold |

**Notes:** Build-spec is a moderate-cost main-context stage. The spec reviewer subagent adds ~20K of baseline overhead. The primary cost driver is the accumulated context from figure-out that is re-sent on every API call during spec writing.

---

### 5.2.3 chester-build-plan

No direct empirical data. Estimated from skill structure.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~350K [C] | Estimated: ~12 API calls at average context of ~29K (growing from ~230K entry), plus internal review cycles |
| Total output tokens | ~30K [C] | Plan document (10 tasks with full code, ~20K) + review exchanges (~10K) |
| API calls | ~12 [C] | Write plan tasks + internal review + revisions |
| Subagent launches | 1 [C] | Plan reviewer subagent |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 23% [C] | Estimated from build-spec exit |
| Context utilization at exit | 28% [C] | Entry + plan content + review exchanges |
| Cache-eligible fraction | ~50% [C] | System prompt + skill content stable; spec is stable input |
| D(U) regime | Negligible | Exit at ~28%, near but below 30% threshold |

**Notes:** Build-plan is the last main-context stage before the pipeline transitions to subagent-dominated execution. The orchestrator context is approaching the 30% D(U) threshold by the end of plan writing. For complex plans requiring multiple revision cycles, context utilization could push into the U-shaped regime.

---

### 5.2.4 chester-attack-plan

No direct empirical data. Estimated from skill structure (6 parallel subagents).

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~210K [C] | 6 subagents x ~30K each (20K baseline + ~10K plan payload) + orchestrator synthesis (~30K) |
| Total output tokens | ~18K [C] | 6 agent reports (~2K each) + synthesis (~6K) |
| API calls | ~10 [C] | 6 parallel agent dispatches + collection + synthesis + structured thinking |
| Subagent launches | 6 | Six parallel attack agents |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 28% [C] | Orchestrator context from build-plan exit |
| Context utilization at exit | 30% [C] | Entry + synthesis of 6 agent reports |
| Cache-eligible fraction | ~65% [C] | Subagent prompts are identical across invocations; only plan payload varies |
| D(U) regime | Negligible to U-shaped (border) | Orchestrator exits at ~30%, right at the threshold |

**Notes:** The dominant cost is subagent baseline overhead: 6 x 20K = 120K tokens of structural cost before any plan analysis begins. The attack agents themselves are read-only and terminate quickly. The synthesis step adds the six reports to the orchestrator's already-large context.

---

### 5.2.5 chester-smell-code

No direct empirical data. Estimated from skill structure (4 parallel subagents).

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~150K [C] | 4 subagents x ~30K each (20K baseline + ~10K plan payload) + orchestrator synthesis (~30K) |
| Total output tokens | ~12K [C] | 4 agent reports (~2K each) + synthesis (~4K) |
| API calls | ~7 [C] | 4 parallel agent dispatches + collection + synthesis |
| Subagent launches | 4 | Four parallel smell-detection agents |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 30% [C] | Orchestrator context from attack-plan exit |
| Context utilization at exit | 32% [C] | Entry + synthesis of 4 agent reports |
| Cache-eligible fraction | ~65% [C] | Same pattern as attack-plan: stable prompts, varying plan payload |
| D(U) regime | U-shaped | Orchestrator is in the 30-50% range |

**Notes:** Smell-code runs immediately after attack-plan in the hardening gate. The orchestrator's context now holds the full design brief, spec, plan, and attack-plan synthesis. At ~32% context utilization, the orchestrator enters the U-shaped D(U) regime where middle-positioned content (the spec, likely) receives less attention than the plan and the most recent smell findings.

---

### 5.2.6 chester-build-plan (hardening synthesis and human presentation)

This entry covers the orchestrator's work after attack-plan and smell-code return: synthesizing the combined risk assessment and presenting it to the human for approval.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~100K [C] | ~3 API calls at ~33K average context |
| Total output tokens | ~5K [C] | Risk summary + human-facing presentation |
| API calls | ~3 [C] | Synthesize findings + present to human + process decision |
| Subagent launches | 0 | Runs in orchestrator context |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | 32% [C] | From smell-code exit |
| Context utilization at exit | 33% [C] | Modest growth from synthesis |
| Cache-eligible fraction | ~45% [C] | Growing conversation reduces stable prefix ratio |
| D(U) regime | U-shaped | In the 30-50% range |

**Notes:** This is a brief but significant moment: the human's go/no-go decision happens while the orchestrator is in the U-shaped regime. The risk is that the synthesized findings, positioned in the middle of a large context, receive less attention than they should. In practice, the structured thinking MCP provides a reasoning checkpoint that partially mitigates this.

---

### 5.2.7 chester-write-code (10 tasks)

No direct empirical data for the full execution phase. Estimated from skill structure. This is the dominant cost stage.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~1,500K [C] | 30 subagents x ~40K average (20K baseline + ~20K task payload/code context) + orchestrator overhead (~300K for task management across 10 cycles) |
| Total output tokens | ~150K [C] | 10 implementers (~10K each) + 10 spec reviewers (~2K each) + 10 quality reviewers (~2K each) + orchestrator task management |
| API calls | ~80 [C] | 30 subagent dispatches + orchestrator management calls (2-3 per task cycle) + 1 final code reviewer |
| Subagent launches | 31 | 10 implementers + 10 spec reviewers + 10 quality reviewers + 1 final code reviewer |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 33% [C] | Orchestrator context from plan approval |
| Context utilization at exit | 45% [C] | Entry + 10 task cycle reports accumulated in orchestrator |
| Cache-eligible fraction | ~70% [C] | Subagent stable prefix (system prompt + skill + template) is ~20K of each ~40K call |
| D(U) regime | U-shaped | Orchestrator moves from 33% to ~45% over 10 task cycles |

**Notes:** Write-code is the largest single consumer of tokens. The 31 subagent invocations alone account for 620K tokens of baseline overhead (31 x 20K). The remaining ~880K is task-specific: code context loaded by implementers, review artifacts read by reviewers, and the orchestrator's growing task management context. The orchestrator's context grows by approximately 12K per task cycle (implementer report + review summaries), pushing it deeper into the U-shaped D(U) regime as later tasks execute. This is the primary mechanism by which context degradation could affect later tasks in a long plan.

---

### 5.2.8 chester-finish-plan

No direct empirical data. Estimated from skill structure.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~50K [C] | ~5 API calls at average ~10K context per call (lower because some calls are simple git operations) |
| Total output tokens | ~5K [C] | Test output, merge status, session summary |
| API calls | ~5 [C] | Run tests + verify tree + present options + execute choice + cleanup |
| Subagent launches | 0 | Runs in orchestrator context |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | 45% [C] | From write-code exit |
| Context utilization at exit | 46% [C] | Minimal growth |
| Cache-eligible fraction | ~40% [C] | Large accumulated conversation reduces stable prefix ratio |
| D(U) regime | U-shaped | In the 30-50% range |

**Notes:** Finish-plan is lightweight in token cost. Its value is in discipline (refusing to proceed with failing tests), not in token consumption. The orchestrator is in the U-shaped regime, but the tasks are simple and binary (tests pass/fail, git commands succeed/fail), so degradation has minimal practical impact.

---

### 5.2.9 chester-test-first

Test-first is a behavioral protocol, not a standalone stage with its own API calls. Its token cost is embedded within chester-write-code's implementer subagent calls.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | Included in write-code | Protocol cost embedded in implementer subagent |
| Total output tokens | Included in write-code | |
| API calls | ~20 [C] | 2 test runs per task x 10 tasks (verify-fail + verify-pass), embedded in implementer calls |
| Subagent launches | 0 | Behavioral constraint, not a dispatch |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | N/A | Runs within implementer subagent context |
| Context utilization at exit | N/A | |
| Cache-eligible fraction | N/A | |
| D(U) regime | N/A | Each implementer starts fresh |

**Notes:** Test-first's incremental cost is the additional API calls for running tests within the implementer's context. Each test execution adds minimal tokens (the test command and its output). The protocol's cost is negligible relative to the implementer's total work, but it generates approximately 20 additional API calls across a 10-task plan.

---

### 5.2.10 chester-fix-bugs

Fix-bugs is invoked reactively, not on every pipeline run. Estimated for a single invocation.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~50K [C] | Estimated: ~6 API calls at average ~8K context (fresh investigation context) |
| Total output tokens | ~8K [C] | Investigation findings + fix + verification |
| API calls | ~6 [C] | Reproduce + trace + hypothesize + test hypothesis + implement fix + verify |
| Subagent launches | 0 | Runs in current context |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | Varies | Depends on when in the session a bug is encountered |
| Context utilization at exit | Varies | |
| Cache-eligible fraction | ~50% [C] | System prompt + skill stable; investigation content varies |
| D(U) regime | Varies | Depends on entry point |

**Notes:** Fix-bugs is not part of the standard pipeline flow. When it is invoked (typically during write-code when an implementer encounters an unexpected failure), it adds approximately 50K input tokens to the session. For a 10-task plan that proceeds without bugs, this stage contributes zero tokens.

---

### 5.2.11 chester-prove-work

Prove-work is a lightweight verification gate. Estimated per invocation.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~5K [C] | 1-2 API calls at current context level |
| Total output tokens | ~1K [C] | Verification result |
| API calls | ~2 [C] | Run verification command + confirm result |
| Subagent launches | 0 | Behavioral gate |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | Varies | Invoked at various points |
| Context utilization at exit | Varies | Negligible growth |
| Cache-eligible fraction | N/A | Cost too small to meaningfully analyze |
| D(U) regime | N/A | Binary check, degradation-resistant |

**Notes:** Prove-work adds negligible token cost per invocation. Even if invoked 10 times across a pipeline run, total additional input is approximately 50K tokens -- less than 2% of total pipeline cost.

---

### 5.2.12 chester-review-code

Review-code is invoked reactively when code review feedback arrives. Not part of the standard pipeline flow.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~40K [C] | Estimated: ~5 API calls at ~8K average context |
| Total output tokens | ~6K [C] | Technical responses to review items |
| API calls | ~5 [C] | Read feedback + evaluate each item + implement/pushback + verify |
| Subagent launches | 0 | Runs in current context |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | Varies | Depends on when review feedback arrives |
| Context utilization at exit | Varies | |
| Cache-eligible fraction | ~50% [C] | System prompt + skill stable; review content varies |
| D(U) regime | Varies | |

**Notes:** Like fix-bugs, review-code is reactive and not part of the standard pipeline token budget. It is excluded from the aggregate analysis below.

---

### 5.2.13 chester-dispatch-agents

Dispatch-agents is a meta-utility whose token cost is embedded in the stages that use it (attack-plan, smell-code, write-code, doc-sync). It does not generate independent API calls.

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | Included in calling stages | Coordination overhead embedded in attack-plan, smell-code, write-code, doc-sync |
| Total output tokens | Included in calling stages | |
| API calls | ~5 [C] | Orchestrator calls for dispatch setup and result collection, distributed across calling stages |
| Subagent launches | 0 | Dispatches are attributed to the calling stage |
| Baseline overhead per subagent | N/A | |
| Context utilization at entry | N/A | Runs within calling stage's context |
| Context utilization at exit | N/A | |
| Cache-eligible fraction | N/A | |
| D(U) regime | N/A | |

**Notes:** Dispatch-agents adds a small amount of orchestration overhead (dispatch setup instructions, result collection parsing) to each calling stage. This is estimated at 1-2 additional API calls per dispatch batch, already included in the calling stage estimates above.

---

### 5.2.14 chester-doc-sync

No direct empirical data. Estimated from skill structure (3 parallel subagents).

| Metric | Value | Notes |
|--------|-------|-------|
| Total input tokens | ~100K [C] | 3 subagents x ~25K each (20K baseline + ~5K git diff payload) + orchestrator synthesis (~25K) |
| Total output tokens | ~8K [C] | 3 agent reports (~2K each) + synthesis (~2K) |
| API calls | ~6 [C] | 3 parallel agent dispatches + collection + synthesis |
| Subagent launches | 3 | CLAUDE.md checker + approved doc checker + gap detector |
| Baseline overhead per subagent | ~20K | Standard subagent baseline |
| Context utilization at entry | 46% [C] | Orchestrator context from finish-plan exit |
| Context utilization at exit | 47% [C] | Entry + synthesis of 3 reports |
| Cache-eligible fraction | ~65% [C] | Subagent prompts stable; git diff payload varies |
| D(U) regime | U-shaped | In the 30-50% range |

**Notes:** Doc-sync is invoked within finish-plan. Its three subagents add 60K tokens of baseline overhead. As noted in Section 4.2.13, this stage uses a Configuration D architecture where a Configuration A approach would likely suffice -- the token overhead of three subagents may exceed what a single-agent approach would cost for this low-stakes, low-complexity work.

---

## 5.3 Aggregate Analysis

### Total Pipeline Token Consumption

The following table summarizes estimated token consumption for a representative 10-task pipeline run (no bugs encountered, one review iteration at each gate, no reactive stages invoked).

| Stage | Input Tokens | % of Total | Output Tokens | API Calls | Subagent Launches |
|-------|-------------|-----------|--------------|-----------|-------------------|
| figure-out | 1,200K | 32.3% | 40K | 40 | 0 |
| build-spec | 250K | 6.7% | 15K | 8 | 1 |
| build-plan | 350K | 9.4% | 30K | 12 | 1 |
| attack-plan | 210K | 5.7% | 18K | 10 | 6 |
| smell-code | 150K | 4.0% | 12K | 7 | 4 |
| hardening synthesis | 100K | 2.7% | 5K | 3 | 0 |
| write-code (10 tasks) | 1,500K | 40.4% | 150K | 80 | 31 |
| finish-plan | 50K | 1.3% | 5K | 5 | 0 |
| doc-sync | 100K | 2.7% | 8K | 6 | 3 |
| test-first | (included in write-code) | -- | -- | ~20 | 0 |
| prove-work | (included in calling stages) | -- | -- | ~10 | 0 |
| dispatch-agents | (included in calling stages) | -- | -- | ~5 | 0 |
| **Total** | **~3,710K [C]** | **100%** | **~283K [C]** | **~171** | **46** |

### Consistency Check Against Empirical Data

The measured session consumed ~2.1M input tokens over 65 API calls, covering primarily the figure-out phase. Our estimate for figure-out alone is 1.2M over ~40 calls. The measured session ran longer (65 calls vs. estimated 40), which accounts for the difference: the additional 25 calls at the session's higher context levels (~40-45K each) would add approximately 900K-1,000K, bringing the total close to the measured 2.1M. The estimates are consistent with the empirical data at the stage level where measurement exists.

The total pipeline estimate of ~3.7M input tokens is plausible for a full pipeline run. This represents approximately 47% of the theoretical maximum if every API call sent the full 1M context window (171 calls x 1M = 171M), confirming that Chester operates well within the context budget for a single pipeline run.

### Top 3 Token-Consuming Stages

1. **chester-write-code: ~1,500K (40.4%)** -- Dominated by 31 subagent invocations, each loading ~20K of baseline overhead plus task-specific code context. This is the stage where prompt caching would deliver the highest absolute savings.

2. **chester-figure-out: ~1,200K (32.3%)** -- Dominated by growing-context conversation in the orchestrator's main window. Each API call re-sends the full conversation history. This is the stage most affected by the "re-send everything" cost model of LLM APIs.

3. **chester-build-plan: ~350K (9.4%)** -- Combines growing orchestrator context with the overhead of writing a detailed plan (complete code for all tasks). The plan itself can be 15-20K tokens of content that is then re-sent on every subsequent call.

These three stages account for **82.1%** of total estimated pipeline input tokens.

### Baseline Overhead: The Multi-Agent Tax

Total subagent launches in the pipeline: **46** (including 2 spec/plan reviewers, 6 attack agents, 4 smell agents, 31 write-code agents, 3 doc-sync agents).

Baseline overhead per subagent: ~20,000 tokens.

**Total baseline overhead: ~920K tokens (24.8% of total pipeline input).**

This is the structural cost of Chester's multi-agent architecture -- the tokens consumed loading the system prompt, CLAUDE.md, and skill context into each fresh subagent, before any task-specific work begins. Nearly one quarter of all input tokens in a pipeline run are spent on this baseline repetition.

For the 31 write-code subagents alone, baseline overhead is ~620K tokens (16.7% of total). This is the single largest optimization target identified in the trace analysis, and it aligns with the source paper's identification of prompt caching as the highest-ROI structural intervention for Configuration D stages.

### Cache-Eligible Tokens

Estimating the cache-eligible fraction across the full pipeline:

- **Subagent calls (46 launches):** The system prompt (~16K) and CLAUDE.md (~1K) are identical across all subagent invocations within a session. The skill-specific content (~2-3K) is identical across invocations of the same skill type. Combined stable prefix per subagent: ~18-19K of the ~20K baseline. **Estimated cache-eligible tokens from subagent baselines: ~850K (23% of total).**

- **Orchestrator calls (~90 calls across main-context stages):** The system prompt (~16K) and CLAUDE.md (~1K) are identical across all calls. Conversation history is additive (grows but prior turns do not change). Estimated stable prefix averages ~40% of each call's input. **Estimated cache-eligible tokens from orchestrator calls: ~720K (19% of total).**

- **Combined cache-eligible estimate: ~1,570K (42% of total pipeline input).**

At Anthropic's cached token pricing (10% of standard input price), achieving full cache utilization across these tokens would reduce the effective input token cost by approximately 38% (42% of tokens at 90% discount). This represents the theoretical upper bound; actual cache hit rates depend on prefix matching discipline and cache TTL relative to call timing.

### Context Utilization Trajectory

The orchestrator's context utilization follows a predictable trajectory across the pipeline:

| Pipeline Point | Context Utilization | D(U) Regime |
|---|---|---|
| Session start | 2% | Negligible |
| End of figure-out | 19% | Negligible |
| End of build-spec | 23% | Negligible |
| End of build-plan | 28% | Negligible |
| End of hardening gate | 33% | U-shaped |
| End of write-code (task 5) | 39% | U-shaped |
| End of write-code (task 10) | 45% | U-shaped |
| End of finish-plan | 46% | U-shaped |
| End of doc-sync | 47% | U-shaped |

Key observations:

- The orchestrator stays in the Negligible regime through the entire design phase (figure-out, build-spec, build-plan). This is fortunate, as these are the highest-stakes stages where context degradation would be most costly.
- The transition to the U-shaped regime occurs during the hardening gate, after the high-stakes design work is complete.
- The orchestrator never reaches the Recency-bias regime (>50%) in a standard 10-task run. For longer plans (15+ tasks), the orchestrator could approach or enter this regime.
- Subagents are unaffected by the orchestrator's context growth because each starts fresh at ~2% utilization.

This trajectory explains why Chester's multi-agent architecture is effective despite its token overhead: the stages most susceptible to context degradation (write-code's later tasks) are the stages where subagent context isolation provides the most value. Each implementer starts fresh regardless of how much context the orchestrator has accumulated.
