# 6. Cross-Correlations

Sections 4 and 5 assessed Chester's thirteen stages individually — Section 4 through the source paper's qualitative framework, Section 5 through token consumption estimates. This section connects those assessments into a system-level view. Chester is a pipeline, not a collection of independent agents. Upstream quality constrains downstream success. Upstream verbosity inflates downstream cost.

## 6.1 Dependency Graph

Chester's pipeline has three types of dependencies between stages.

### Hard Dependencies

The core pipeline forms a strict linear chain: figure-out -> build-spec -> build-plan -> hardening gate -> write-code -> finish-plan. Each stage requires its predecessor's artifact to begin. There is no stage-level parallelism. The only concurrency is internal: attack-plan's six agents run alongside smell-code's four agents during hardening.

### Quality Dependencies

Quality dependencies are softer: Stage B can execute regardless of Stage A's output quality, but Stage B's effectiveness is bounded by how good that output is.

- **figure-out -> everything downstream:** The design brief is the highest-leverage artifact. A brief that misidentifies the problem propagates through every subsequent stage. Build-spec formalizes the wrong requirement, build-plan plans the wrong implementation, write-code executes it correctly. The pipeline delivers a well-tested implementation of the wrong thing.

- **build-spec -> build-plan -> write-code:** Specification ambiguity forces the plan to make assumptions that implementer subagents inherit without the context to question. A spec that says "handle errors appropriately" produces tasks that invent independent error handling strategies, yielding inconsistent behavior.

- **build-plan -> write-code:** Incorrect file paths cause implementers to waste tokens searching. Incomplete dependency ordering causes tasks to fail when expected prior-task code does not exist. Pseudocode instead of complete code forces implementers to make design decisions that should have been resolved upstream.

- **attack-plan + smell-code -> build-plan:** The hardening gate's synthesis step is where quality most easily degrades (Section 4: medium observability). A weak synthesis that misses a genuine structural risk has the same downstream effect as not running the gate at all.

### Token Dependencies

Token dependencies describe how one stage's output volume drives the next stage's input cost.

- **figure-out -> build-spec -> build-plan (orchestrator context growth):** These three stages run in the orchestrator's main context, re-sending all prior content on every API call. Section 5 quantified this: the orchestrator grows from 2% to 28% utilization across these stages, consuming ~1,800K input tokens (48.5% of total pipeline cost).

- **build-plan -> all downstream subagents (plan payload multiplication):** The plan is injected into 41 subagent contexts (6 attack + 4 smell + 31 write-code). A 20K-token plan becomes 820K tokens of payload. A plan achieving the same specificity at 12K tokens would save ~328K (9% of total cost).

- **hardening reports -> orchestrator synthesis:** The ten agent reports push the orchestrator from 28% to 33% utilization, entering the U-shaped D(U) regime where middle-positioned content receives less attention.

## 6.2 Quality Propagation: The Critical Path

The critical path for quality runs through the three Configuration C stages: **figure-out -> build-spec -> build-plan**. Their shared characteristic is low success observability — errors are invisible at the stage that introduces them and only surface two or three stages later. A flawed assumption in the design interview appears as a test failure during write-code's seventh task, after ~3,000K tokens have been spent executing tasks 1 through 6 on that assumption.

The hardening gate is Chester's primary defense. Its placement is structurally correct: it sits at the boundary between the high-stakes design phase and the high-cost execution phase. Every plan weakness caught prevents ~150K tokens of wasted implementation cost per affected task (one implementer + two reviewers at ~50K each).

However, a cross-correlation limitation emerges that individual stage assessments did not expose: the synthesis step runs at 30-33% context utilization, right at the U-shaped D(U) threshold. The attack and smell agents operate in fresh contexts, but their findings are synthesized by an orchestrator whose attention to middle-positioned content is diminishing. The gate is most reliable for prominent, high-severity findings and least reliable for findings requiring cross-reference against design decisions buried in the conversation history.

## 6.3 Token Propagation: The Cost Amplifier

Two mechanisms amplify token cost across stage boundaries.

**Mechanism 1: Growing orchestrator context.** Section 5's utilization trajectory (2% -> 19% -> 23% -> 28% -> 33% -> 45% -> 47%) shows monotonic growth. The figure-out phase produces ~170K tokens of conversation history re-sent on every subsequent orchestrator call — approximately 58 calls across downstream stages. The marginal cost of verbose figure-out output is those tokens multiplied by every subsequent API call.

**Mechanism 2: Plan payload multiplication.** The plan is loaded into 41 subagent contexts. Unlike orchestrator context (which benefits from prompt caching of stable prefixes), plan payload sits after the stable prefix and is less cache-eligible. Every additional plan token costs approximately 41 tokens across the pipeline.

These mechanisms interact. A verbose figure-out session produces a verbose design brief, which produces a verbose spec, which produces a verbose plan — then multiplied 41 times through subagent dispatch. Upstream verbosity compounds through both channels simultaneously.

## 6.4 Shared Resource Contention

Chester's stages compete for a single shared resource: the orchestrator's context window. This is not concurrent-access contention — stages run sequentially — but budget contention: every token consumed by an earlier stage is unavailable to later stages.

The high-stakes design phase consumes ~28% of the 1M window. The remaining 72% must accommodate hardening, 10+ task management cycles, finish-plan, and doc-sync. For a standard 10-task plan this is adequate. For a 20-task plan, the orchestrator would approach 60-65% utilization, entering the Recency-bias D(U) regime.

This creates a tension: the design phase should be thorough to improve quality propagation, but thoroughness consumes context budget that degrades downstream orchestrator performance. Chester resolves this through its multi-agent architecture — subagents start fresh regardless of orchestrator context growth — so the contention primarily affects orchestrator decision-making during task management and hardening synthesis, not the subagents doing implementation and review.

## 6.5 Summary of Cross-Correlations

Three system-level patterns emerge from connecting the individual stage assessments:

1. **Quality flows downstream, cost flows forward.** The three Configuration C stages at the pipeline's front determine what gets built. The Configuration D stages that follow determine how much it costs to build it. Optimizing cost without protecting upstream quality is counterproductive — a cheaper pipeline that builds the wrong thing saves nothing.

2. **The hardening gate is correctly positioned but operates under context pressure.** It sits at the quality-cost boundary, catching plan weaknesses before they multiply through 31 subagent invocations. But its synthesis step runs at the D(U) threshold, creating a reliability gradient where recent, prominent findings are synthesized well and older, cross-referencing-dependent findings may be missed.

3. **Verbosity compounds through two independent mechanisms.** Orchestrator context growth multiplies upstream verbosity across all downstream API calls. Plan payload duplication multiplies plan verbosity across 41 subagent contexts. These mechanisms are independent and additive — reducing verbosity at the source reduces cost through both channels simultaneously.
