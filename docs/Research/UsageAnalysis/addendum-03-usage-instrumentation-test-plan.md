# Addendum 3: Usage Instrumentation and Empirical Test Scaffolding

**Implementation of AER Paper Section 8.3 Measurement Recommendations and Section 8.4 Future Work, Item 1**

**Authors:** Mike and Claude
**Date:** March 2026
**Status:** Instrumentation deployed; data collection framework proposed; test scaffolding framed

---

# 1. Relationship to the Parent Analysis

The parent analysis — "AI Agent Effectiveness Review of the CHESTER Multi-Agent System Under Token Cost Constraints" (March 2026) — identified its own evidence base as a primary limitation:

> Twelve of thirteen stage assessments rely on Category C estimates. Moving to Category A empirical data requires specific instrumentation. (Section 8.3)

This addendum documents the instrumentation that has been deployed, describes the data it produces, frames a data collection methodology for converting Category C estimates to Category A measurements, and proposes a test scaffolding plan for systematic validation of the Tier 1 interventions.

# 2. Deployed Instrumentation

## 2.1 Token Budget Guard

A runtime token budget management system was deployed across all five primary pipeline skills (`chester-figure-out`, `chester-build-spec`, `chester-build-plan`, `chester-write-code`, `chester-finish-plan`). The guard operates as a hard gate: before each major work phase, it reads the current 5-hour token usage percentage and pauses execution if the usage exceeds a configurable threshold.

**Data source:** `~/.claude/usage.json` — a bridge file maintained by Claude Code's infrastructure containing real-time token usage metrics.

**Fields read:**

| Field | Type | Description |
|-------|------|-------------|
| `five_hour_used_pct` | Integer | Percentage of 5-hour rolling token window consumed |
| `five_hour_resets_at` | Unix timestamp | When the 5-hour window resets |
| `timestamp` | Unix timestamp | Last update time (staleness check: >60s = stale) |

**Configuration:** `~/.claude/chester-config.json` with project-scoped override via `~/.claude/projects/-{PROJECT_HASH}/chester-config.json`.

```json
{
  "budget_guard": {
    "threshold_percent": 85,
    "enabled": true
  }
}
```

**Check points in the pipeline:**

| Skill | Check Points |
|-------|-------------|
| `chester-figure-out` | Skill entry |
| `chester-build-spec` | Skill entry |
| `chester-build-plan` | Skill entry; before attack-plan dispatch; before smell-code dispatch |
| `chester-write-code` | Skill entry; before each task's implementer dispatch |
| `chester-finish-plan` | Skill entry |

The build-plan and write-code skills have additional mid-skill checkpoints because they dispatch expensive subagent operations. The build-plan checkpoints catch budget breaches before the hardening phase (10 parallel agents). The write-code per-task checkpoints catch breaches during long implementation runs.

## 2.2 Diagnostic Logging

An optional per-section token usage logger captures usage deltas around major work phases. Activation requires the `chester-start-debug` skill, which creates a session flag file:

```json
// ~/.claude/chester-debug.json
{
  "mode": "diagnostic",
  "session_start": 1711547123
}
```

**Logging script:** `~/.claude/chester-log-usage.sh`

The script accepts `before` and `after` commands, reads `~/.claude/usage.json`, and computes the delta between paired calls. Output is a markdown table appended to a log file:

```markdown
| Timestamp | Section | Step | Before % | After % | Delta |
|-----------|---------|------|----------|---------|-------|
| 22:05:49  | figure-out | skill-entry | N/A | 19 | N/A |
| 22:09:14  | build-spec | skill-entry | 19 | 20 | +1 |
| 22:15:33  | build-plan | skill-entry | 20 | 22 | +2 |
| 22:17:01  | build-plan | attack-plan dispatch | 22 | 31 | +9 |
| 22:18:45  | build-plan | smell-code dispatch | 31 | 37 | +6 |
```

**Log location:** `{sprint-dir}/summary/token-usage-log.md` (if sprint directory exists) or `~/.claude/chester-usage.log` (fallback).

**Logging points match checkpoint granularity:** Every budget guard checkpoint has a corresponding diagnostic log call. The log captures where tokens are spent at the section level — sufficient to attribute cost to pipeline stages, though not to individual subagent calls within a stage.

## 2.3 Session JSONL (Claude Code Infrastructure)

Claude Code maintains session JSONL files at `~/.claude/projects/-{PROJECT_PATH_HASH}/{SESSION_UUID}.jsonl`. Each file contains the complete API request-response history for a session, including:

| Field | Location in JSONL | Description |
|-------|------------------|-------------|
| `input_tokens` | `.message.usage.input_tokens` | Tokens after the last cache breakpoint |
| `cache_creation_input_tokens` | `.message.usage.cache_creation_input_tokens` | Tokens written to cache |
| `cache_read_input_tokens` | `.message.usage.cache_read_input_tokens` | Tokens read from cache |
| `output_tokens` | `.message.usage.output_tokens` | Response tokens generated |

This is the richest data source available — per-call granularity with full cache metrics. However, Chester does not control or instrument this file; it is a byproduct of Claude Code's infrastructure. The data exists but requires post-hoc parsing to attribute calls to pipeline stages.

## 2.4 Post-Session Cache Analysis (Sprint-007 Addition)

Sprint-007 added a cache analysis option to `chester-finish-plan` (Step 7, Session Artifacts) that parses the session JSONL for cache metrics. This is a lightweight post-session report — not runtime instrumentation — that produces:

```markdown
## Cache Analysis

| Call # | Input | Cache Write | Cache Read | Hit Rate |
|--------|-------|-------------|------------|----------|
| 1      | 500   | 19000       | 0          | 0%       |
| 2      | 500   | 0           | 19000      | 97%      |
| ...    | ...   | ...         | ...        | ...      |

**Overall:** X% of input tokens served from cache
**Subagent average:** Y% cache hit rate
```

This provides the immediate measurement capability the parent analysis recommended in Section 8.3 ("Immediate — no code changes required").

# 3. Data Available vs. Data Needed

## 3.1 Current Data Inventory

| Data Point | Source | Granularity | Category | Status |
|------------|--------|-------------|----------|--------|
| 5-hour usage percentage | `usage.json` | Session-level | A | Available, collected by budget guard |
| Per-section usage delta | Diagnostic log | Section-level (~13 sections) | A | Available when debug mode active |
| Per-call token counts | Session JSONL | Per-API-call | A | Available, not parsed routinely |
| Per-call cache metrics | Session JSONL | Per-API-call | A | Available, parseable via finish-plan option |
| Per-stage P(success) | None | Per-stage | C | Not collected — requires longitudinal tracking |
| Per-stage Q (quality) | None | Per-stage | C | Not collected — requires human evaluation |
| Finding quality comparison | None | Per-sprint | C | Not collected — requires pre/post analysis |

## 3.2 Gaps Between Available and Needed

The parent analysis identified three measurement tiers (Section 8.3). The current instrumentation addresses Immediate and partially addresses Short-term, but does not address Medium-term:

**Immediate (addressed):**
- Session JSONL parsing for per-call token usage: Available via finish-plan cache analysis
- Stage attribution using skill-entry markers: Available via diagnostic log

**Short-term (partially addressed):**
- Per-subagent token tracking: Available in JSONL but not attributed to calling stage or task number
- Cache hit rate measurement: Available via finish-plan cache analysis
- Context utilization at stage boundaries: Available via diagnostic log (percentage at each section entry/exit)

**Medium-term (not addressed):**
- P(success) estimation per stage: Requires longitudinal tracking across 10-20 pipeline runs
- Quality regression detection: Requires controlled comparison between pre- and post-intervention runs

# 4. Data Collection Framework

## 4.1 Per-Run Collection Protocol

Each full pipeline run should produce the following artifacts for analysis:

1. **Diagnostic log** (automatic when debug mode active): Per-section usage deltas
2. **Cache analysis report** (optional, via finish-plan): Per-call cache metrics
3. **Session JSONL** (automatic, Claude Code infrastructure): Complete API history
4. **Run metadata** (manual or script-generated):
   - Date and time
   - Pipeline stages executed (full run vs. partial)
   - Plan document size (tokens)
   - Number of tasks in plan
   - Number of subagents dispatched
   - Chester skill versions (git commit hash)
   - Model used (Opus 4.6, Sonnet 4.6, etc.)
   - Any anomalies (budget guard pauses, re-dispatches, blocked tasks)

## 4.2 JSONL Attribution Script

The highest-value automation would be a script that parses the session JSONL and attributes each API call to a pipeline stage and task. The attribution logic:

1. **Skill entry markers:** The diagnostic logging script writes before/after timestamps that bracket each pipeline stage. These timestamps can be correlated with JSONL entry timestamps to assign calls to stages.

2. **Subagent identification:** JSONL entries for subagent calls are nested within the session directory. The calling pattern (Agent tool invocation followed by subagent JSONL) provides attribution to the dispatching stage.

3. **Output format:**

```markdown
## Pipeline Token Profile: [sprint-name]

### Per-Stage Breakdown

| Stage | Calls | Input | Cache Read | Cache Write | Output | Hit Rate |
|-------|-------|-------|------------|-------------|--------|----------|
| figure-out | 42 | 850K | 680K | 170K | 95K | 80% |
| build-spec | 8 | 120K | 95K | 25K | 30K | 79% |
| build-plan | 15 | 220K | 175K | 45K | 55K | 80% |
| attack-plan | 6 | 180K | 150K | 30K | 40K | 83% |
| smell-code | 4 | 100K | 85K | 15K | 25K | 85% |
| write-code | 35 | 900K | 720K | 180K | 200K | 80% |
| finish-plan | 5 | 50K | 40K | 10K | 15K | 80% |
| **Total** | **115** | **2,420K** | **1,945K** | **475K** | **460K** | **80%** |

### Subagent Breakdown

| Agent Type | Count | Avg Input | Avg Cache Read | Avg Hit Rate |
|------------|-------|-----------|----------------|-------------|
| attack-plan agents | 6 | 30K | 25K | 83% |
| smell-code agents | 4 | 25K | 21K | 85% |
| write-code implementers | 10 | 35K | 28K | 80% |
| write-code spec reviewers | 10 | 22K | 17K | 77% |
| write-code quality reviewers | 10 | 25K | 20K | 80% |
```

**Evidence category:** [C] — The table above is illustrative with fabricated numbers. Actual values will be populated from the first instrumented run.

## 4.3 Longitudinal Collection

Over 10-20 pipeline runs, the per-run data enables:

- **P(success) estimation:** Track re-dispatches, blocked tasks, and human corrections per stage. P(success) = (runs without correction) / (total runs) for each stage.
- **Cache hit rate trending:** Track whether cache hit rates are stable, improving, or degrading across runs.
- **Context utilization trajectory validation:** Compare the observed utilization trajectory (from diagnostic log) against the parent analysis's estimated 2% -> 19% -> 23% -> 28% -> 33% -> 45% -> 47% trajectory.
- **Intervention impact measurement:** Compare pre-intervention and post-intervention runs for the metrics affected by each Tier 1 change.

# 5. Test Scaffolding for Tier 1 Interventions

## 5.1 Test Methodology

Each Tier 1 intervention has a testable hypothesis. The test scaffolding defines:
- **Hypothesis:** What the intervention claims to achieve
- **Measurement:** What data point validates or invalidates the claim
- **Baseline:** Pre-intervention measurement (from the parent analysis's Category C estimates)
- **Threshold:** Minimum observable effect that constitutes validation
- **Collection method:** How to gather the measurement

## 5.2 Test 1: Response Format Control (Sprint-006)

**Hypothesis:** Structured output formats reduce orchestrator synthesis input tokens and improve deduplication reliability, with no quality degradation.

| Aspect | Measurement | Baseline (Category C) | Threshold | Collection |
|--------|------------|----------------------|-----------|------------|
| Synthesis input reduction | Total tokens in synthesis calls for attack-plan + smell-code | ~10K per synthesis (estimated) | Any measurable reduction | JSONL parsing: identify synthesis calls by timing (after all subagent returns) |
| Deduplication reliability | Count of duplicate findings in merged report | Unknown | Fewer duplicates than a pre-intervention run | Manual comparison of merged reports |
| Quality preservation | Finding count, specificity, evidence citation rate | Pre-sprint-006 adversarial review output | No statistically significant degradation | Manual comparison of 3+ pipeline runs |

**Test procedure:**
1. Run a full pipeline with debug mode active on a non-trivial feature task
2. Parse JSONL for synthesis call token counts
3. Read the merged adversarial review and smell reports
4. Compare finding quality against the most recent pre-sprint-006 reports (from `docs/chester/` archive)
5. Record results in the longitudinal tracking file

## 5.3 Test 2: Cache-Optimal Prefix (Sprint-007)

**Hypothesis:** Content-first prompt ordering increases cache hit rates for subagent calls, reducing effective input cost. Role description removal does not degrade finding quality.

| Aspect | Measurement | Baseline (Category C) | Threshold | Collection |
|--------|------------|----------------------|-----------|------------|
| Cache hit rate (system prefix) | `cache_read_input_tokens` for second+ subagent calls | ~0% (assumed — no prior measurement) | >50% cache read on system prefix (~19K tokens) | Finish-plan cache analysis |
| Cache hit rate (plan text) | `cache_read_input_tokens` exceeding system prefix size | ~0% (assumed) | Any measurable plan text caching | Finish-plan cache analysis |
| Cross-skill cache sharing | Cache reads for first smell-code agent | ~0% (assumed) | Cache reads equal to attack-plan agents (indicating shared prefix) | JSONL timing analysis |
| Role removal quality | Finding count, severity distribution, evidence quality | Pre-sprint-007 adversarial review output | No statistically significant degradation | Manual comparison |

**Test procedure:**
1. Run a full pipeline with debug mode active, selecting cache analysis in finish-plan
2. Read the cache analysis report — identify system prefix hits, plan text hits, and cross-skill hits
3. Compare finding quality against the most recent pre-sprint-007 reports
4. If cache hits are zero: investigate whether Claude Code caches subagent calls at all (see Section 5.5)
5. Record results in the longitudinal tracking file

## 5.4 Test 3: Budget Guard Effectiveness

**Hypothesis:** The budget guard prevents pipeline-run-ending token exhaustion without unnecessary interruption.

| Aspect | Measurement | Baseline | Threshold | Collection |
|--------|------------|----------|-----------|------------|
| False positive rate | Guard pauses where work could have continued | Unknown | <10% of pauses are false positives | Track pause events and outcomes |
| False negative rate | Token exhaustion despite guard | Unknown | 0 exhaustion events after guard deployed | Track exhaustion events |
| Threshold calibration | Percentage of guard pauses at each threshold setting | 85% default | Guard fires with enough headroom to complete current phase | Diagnostic log analysis |

**Test procedure:**
1. Over 10+ pipeline runs, record every budget guard pause event
2. For each pause: was the pause necessary (would token exhaustion have occurred?) or unnecessary (ample headroom remained)?
3. If false positive rate exceeds 10%, consider lowering the threshold
4. If any token exhaustion occurs despite guard, investigate timing gaps between checkpoints

## 5.5 Diagnostic: Cache Availability for Subagent Calls

Before investing in cache optimization analysis, a preliminary diagnostic should confirm that caching operates for Agent tool subagent calls at all.

**Procedure:**
1. Run a minimal session that dispatches two identical subagent calls (same prompt, same tools)
2. Parse the JSONL for `cache_read_input_tokens` on the second call
3. If zero: Claude Code may not cache subagent calls, and the cache optimization hypothesis is invalid at the user-message level (though system prefix caching may still operate)
4. If non-zero: caching is active, and the content-first optimization has a viable mechanism

This diagnostic should be the first test executed — it validates the fundamental assumption underlying Sprint-007.

# 6. Test Infrastructure

## 6.1 Existing Test Scripts

Six test scripts in `/tests/` validate the instrumentation subsystem:

| Script | Validates |
|--------|----------|
| `test-budget-guard-skills.sh` | All pipeline skills contain Budget Guard Check sections |
| `test-log-usage-script.sh` | Log script handles missing debug flag, active logging, stale flag, pipeline references |
| `test-debug-flag.sh` | Debug skill exists with correct structure |
| `test-chester-config.sh` | Config file exists with correct default threshold |
| `test-write-code-guard.sh` | Write-code skill contains guard, diagnostic logging, and debug references |
| `test-integration.sh` | End-to-end: statusline bridge -> config -> skill modifications -> debug -> logging |

These tests validate that the instrumentation is correctly wired into the pipeline. They do not validate that the instrumentation produces useful data — that requires the empirical tests in Section 5.

## 6.2 Proposed Test Additions

**test-cache-analysis.sh:** Validate that the finish-plan cache analysis option can parse a sample JSONL file. Create a fixture JSONL with known cache metrics, run the jq extraction query, and verify the output matches expected values. This tests the parsing pipeline without requiring a real session.

**test-jsonl-attribution.sh:** When the JSONL attribution script (Section 4.2) is implemented, validate that it correctly maps calls to pipeline stages using a fixture JSONL with known timestamps correlated to diagnostic log entries.

**test-longitudinal-schema.sh:** Validate that per-run data files conform to the expected schema for longitudinal analysis. This ensures data from different runs can be aggregated.

# 7. Limitations

## 7.1 Coarse Granularity of Diagnostic Log

The diagnostic log captures usage percentages at section boundaries, not per-call token counts. This provides stage-level attribution but cannot distinguish between subagent calls within a stage. The session JSONL provides per-call granularity, but attributing JSONL calls to pipeline stages requires the timestamp correlation described in Section 4.2 — which has not been implemented.

## 7.2 Usage Percentage vs. Absolute Tokens

The budget guard and diagnostic log operate on `five_hour_used_pct` — a percentage of the 5-hour rolling window. This is sufficient for budget management but insufficient for cost analysis. Converting percentages to absolute token counts requires knowledge of the window size, which is not exposed in `usage.json`. The session JSONL provides absolute token counts per call, making it the authoritative source for cost analysis.

## 7.3 No Automated Quality Measurement

The test scaffolding relies on manual comparison for quality metrics (finding count, specificity, evidence quality). There is no automated quality scoring for adversarial review or smell analysis output. This means quality regression detection requires human judgment — a Category B assessment at best, not the Category A empirical data the parent analysis aspires to.

Automated quality scoring would require defining a scoring rubric (what constitutes a high-quality finding?) and implementing a scoring agent or script. This is feasible but was not in scope for the instrumentation sprint.

## 7.4 Sample Size

Meaningful P(success) estimation requires 10-20 pipeline runs. At Chester's current usage rate (a few pipeline runs per week), accumulating sufficient data for statistical confidence takes weeks to months. The test scaffolding frames the collection methodology but cannot accelerate data accumulation.

# 8. Conclusion and Recommended Next Steps

The instrumentation deployed across Chester's pipeline provides three data layers: real-time budget management (budget guard), per-section cost attribution (diagnostic log), and per-call granularity with cache metrics (session JSONL). The Sprint-007 cache analysis option in finish-plan bridges the gap between raw JSONL data and actionable reports.

The test scaffolding proposes five empirical tests — three for Tier 1 interventions, one for budget guard calibration, and one preliminary diagnostic for cache availability. The cache availability diagnostic (Section 5.5) should be executed first, as it validates the fundamental assumption underlying the highest-ROI optimization.

**Recommended execution order:**

1. **Diagnostic: Cache availability** (Section 5.5) — Confirm caching operates for subagent calls. This is a single-session test requiring minutes of analysis. If caching is not available, reprioritize optimization efforts.

2. **Test 2: Cache-optimal prefix** (Section 5.3) — Run a full pipeline with cache analysis enabled. This provides the first Category A measurement of actual cache hit rates and validates or invalidates the Sprint-007 intervention.

3. **Test 1: Response format control** (Section 5.2) — Compare post-intervention synthesis token counts and finding quality against archived pre-intervention reports. This can be done retrospectively using existing JSONL data from recent runs.

4. **Longitudinal collection** (Section 4.3) — Begin accumulating per-run data for P(success) estimation and trend analysis. This is not a discrete test but a practice — each pipeline run contributes one data point.

5. **Test 3: Budget guard calibration** (Section 5.4) — After 10+ runs with data, analyze pause events for false positive rate and threshold appropriateness.

The single highest-value action is the cache availability diagnostic. It requires minimal effort, resolves the largest uncertainty in the optimization analysis, and determines whether the primary Tier 1 intervention has a viable mechanism. Everything else follows from that answer.
