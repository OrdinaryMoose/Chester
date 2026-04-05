# Reasoning Audit: Review Skill Rationalization

**Date:** 2026-04-05
**Session:** `00`
**Plan:** No formal plan — evaluation brief (`20260405-01-review-skill-rationalization-brief-00.md`)

---

## Executive Summary

This session set out to create a new code review skill (chester-util-codereview) and ended up rationalizing all three review skills (plan-smell, plan-attack, codereview) from multi-agent architectures to lightweight single-pass reviews. The most consequential decision was interpreting the iteration 1 benchmark data as evidence that the multi-agent approach's cost overhead (2-3x time) is not justified by its output quality — finding counts and severity were comparable between skill and baseline. The session deviated significantly from its starting intent (create one new skill) to become a refactoring effort across three existing skills, driven entirely by the benchmark data.

---

## Plan Development

No formal plan or specification existed for this session. It began as a skill-creator workflow invoked via `/skill-creator:skill-creator`, with the user asking whether chester-plan-smell could be modified to work scoped to a directory. Through a brief Q&A (plan vs existing code, scope of review), the user chose option (b) — review existing code, not plans — which led to creating a new skill rather than modifying the existing one. The scope expanded organically as benchmark results revealed that the multi-agent approach wasn't earning its cost, prompting the user to apply the same rationalization to plan-smell and plan-attack.

---

## Decision Log

---

### Abandoning the 3-agent architecture for codereview

**Context:**
After iteration 1 (Chester skill files) showed the baseline performing at 66.7% vs 95.8% pass rate but with comparable finding quality, the user asked a critical question: "how is [the smell report] processed" by plan-build? Reading plan-build's hardening gate (lines 202-209) revealed it consumes the report as prose with "a judgment call, not a formula" — no structured parsing.

**Information used:**
- `chester-plan-build/SKILL.md:202-209` — the hardening gate reads both reports and synthesizes "a single combined implementation risk level"
- Iteration 1 benchmark: with-skill 95.8% pass rate / 157s vs baseline 66.7% / 54s
- The +29% pass rate delta was entirely formatting assertions (severity labels, smell taxonomy, density rating), not finding quality

**Alternatives considered:**
- `Keep 3-agent approach` — justified if structured output served a machine consumer. Rejected because plan-build doesn't parse the structure.
- `Hybrid approach` — keep 3 agents but simplify output format. Rejected because the agents themselves are the cost, not the format.

**Decision:** Rewrite codereview as single-pass. User stated: "if the results are relatively equal but one costs 3x more, I am going with the adhoc for both systems."

**Rationale:** The consumer (plan-build or human) reads the report as prose. Structured taxonomy adds presentation consistency but not analytical value. The cost (2-3x time, 1.3-1.7x tokens) is not justified.

**Confidence:** High — user explicitly stated the decision criterion and the benchmark data supported it clearly.

---

### Identifying complementary blind spots between approaches

**Context:**
During iteration 2 grading (real C# code), a pattern emerged: the baseline and the 3-agent skill found *different types* of issues, not overlapping ones.

**Information used:**
- ViewModels baseline found: anonymous lambda memory leak, missing OnPropertyChanged, disposing injected dependency, fire-and-forget async risks
- ViewModels skill found: string-based PropertyChanged coupling across 3 files (Shotgun Surgery), Feature Envy in TreePanelViewModel
- Services baseline found: bare catch blocks, thread safety gap in ApplicationStateService, mutable interface property
- Services skill found: TreeMode Shotgun Surgery (5+ files to add a mode), FileService concrete Avalonia coupling

**Alternatives considered:**
- `Combine both approaches` — run skill AND baseline, merge findings. Rejected as doubling cost for marginal gain.
- `Bias toward architectural findings` — keep the skill since it finds "higher-level" issues. Not chosen — user valued practical bugs equally.

**Decision:** Incorporated both dimensions into the lightweight rewrite: "Practical concerns" (runtime bugs, correctness) and "Structural concerns" (duplication, coupling, change propagation).

**Rationale:** Rather than choosing one blind spot, the lightweight skill's two-dimension guidance nudges a single-pass review to cover both. (inferred — the user didn't explicitly request this; it was the agent's design choice based on the data.)

**Confidence:** Medium — the design choice is well-supported by the data, but the user didn't explicitly validate that the two-dimension framing was the right way to capture this.

---

### Applying the same rationalization to plan-smell without separate testing

**Context:**
After iteration 2 confirmed the codereview findings, the user said to go with ad-hoc "for both systems." Plan-smell was rewritten without running its own benchmark.

**Information used:**
- Codereview benchmark data (6 evals across 2 iterations)
- Plan-build's consumption pattern (prose, not structured)
- The smell taxonomy, agent prompts, and Structured Thinking gate are nearly identical between plan-smell and codereview — same architecture, same cost structure

**Alternatives considered:**
- `Run separate benchmarks for plan-smell` — would confirm the conclusion independently. Rejected by the user implicitly (moved straight to rewrite).
- `Keep plan-smell as-is` — user initially said "original skill stays unchanged" but reversed after seeing data.

**Decision:** Rewrite plan-smell using the same lightweight pattern without dedicated testing.

**Rationale:** The architecture is identical to codereview's. If the 3-agent approach doesn't justify its cost for code review, it doesn't for plan review either — the only difference is the evidence standard (plan sections vs file:line). (inferred)

**Confidence:** Medium — logically sound extrapolation, but no direct test of plan-smell specifically.

---

### Testing plan-attack against stale plans and proceeding anyway

**Context:**
Plan-attack was tested against two available plans (multi-project-config and cascading-output-directory). Both turned out to be stale/unexecutable, meaning the structural integrity dimension dominated all findings and the other four attack angles (execution risk, concurrency, contract tracing, etc.) were never exercised.

**Information used:**
- Test 1: both versions immediately found stale Chester plan (lightweight 120s vs 5-agent 211s)
- Test 2: both versions immediately found stale StoryDesigner plan (lightweight 163s vs 5-agent 237s)
- 5-agent found one marginal extra (shell injection in existing code, framework generation insight)

**Alternatives considered:**
- `Find a current plan to test against` — would exercise the subtler attack angles. Agent offered this; user said "sure" but no current plan was available in either project.
- `Don't simplify plan-attack yet` — wait for a proper test. Not chosen.

**Decision:** User chose to proceed with the swap: rename 5-agent as .bak, install lightweight as SKILL.md. Accepted that the comparison was limited.

**Rationale:** The .bak preservation mitigates the risk. If a future live plan reveals the lightweight version missing critical findings, the 5-agent version can be restored.

**Confidence:** Medium — the decision is defensible given the .bak safety net, but the test was acknowledged as incomplete by both parties.

---

### Lightweight skill output format: "use whatever feels natural"

**Context:**
All three rewritten skills include the instruction "Use whatever severity scale and format feels natural for the findings — the goal is clarity, not taxonomy compliance."

**Information used:**
- Iteration 1 showed baselines naturally using different formats (High/Medium/Low, Serious/Minor, ad-hoc categories) yet producing equally useful findings
- The 3 formatting-specific assertions (severity labels, smell categories, density rating) accounted for 100% of the pass rate delta — they measured format compliance, not quality

**Alternatives considered:**
- `Suggest but don't require a format` — e.g., "prefer Critical/Serious/Minor if appropriate." Not chosen because any suggested format creates implicit compliance pressure.
- `Require a specific format` — maintains cross-review comparability. Rejected because the data showed format didn't improve the findings themselves.

**Decision:** Let Claude choose its own output format per review.

**Rationale:** Enforcing a format costs nothing in tokens but creates rigidity. The reviews that used their own natural format (the baselines) produced output that was equally readable and often more specific to the context. (inferred)

**Confidence:** Medium — reasonable design choice but untested whether removing format guidance degrades output quality over many invocations.

---

### Directory structure for refactor artifacts

**Context:**
At session end, the user wanted to archive the work using Chester conventions. The agent initially placed artifacts under `docs/chester/refactor/` but the user corrected to `docs/refactor/` — a sibling to `docs/chester/`, not a child of it.

**Information used:**
- User's explicit correction: "The parent folder is /home/mike/.claude/skills/docs/refactor and we create this sessions work directory in there; not under chester"
- Existing convention: Chester sprint artifacts live under `docs/chester/plans/`

**Alternatives considered:**
- `docs/chester/plans/refactor/` — nesting refactor under the existing plans structure. Not chosen.
- `docs/chester/refactor/` — agent's initial choice. Corrected by user.

**Decision:** Use `docs/refactor/` as the parent for refactoring work, separate from Chester's planning artifacts.

**Rationale:** Refactoring work is a different activity type than sprint planning. Keeping it as a sibling directory maintains separation of concerns in the docs structure.

**Confidence:** High — user explicitly specified the path.

---

### Evaluation brief as the starting document for a refactor

**Context:**
The user asked: "we didn't write a plan or specification, so what can serve as this process specific starting document?" A refactor driven by benchmarking needs a different starting artifact than a feature build.

**Information used:**
- The iteration-2 `analysis.md` already captured the hypothesis, methodology, and data
- Standard Chester flow assumes spec → plan → implementation, which doesn't fit a benchmark → decide → simplify workflow

**Alternatives considered:**
- `Retrospective document` — written after the fact. Rejected because the evaluation data existed before the refactoring decisions.
- `Decision record (ADR)` — captures a single decision. Too narrow for a multi-phase evaluation.

**Decision:** Created an "evaluation brief" — captures hypothesis, methodology, key data, and decision. Functions as the spec/plan equivalent for an evidence-driven refactor.

**Rationale:** The brief documents *why* the refactoring was done (with data), not *how* to do it (which was straightforward once the decision was made). This is the artifact a future reader needs to understand the change.

**Confidence:** High — the document type fits the workflow naturally and the user accepted it.
