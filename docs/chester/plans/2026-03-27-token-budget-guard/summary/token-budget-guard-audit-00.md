# Reasoning Audit: Token Budget Guard

**Date:** 2026-03-27
**Session:** `00`
**Plan:** `token-budget-guard-plan-00.md`

---

## Executive Summary

This session designed, specified, planned, and implemented a runtime token budget guard for Chester — from initial problem statement through merged code in a single conversation. The most consequential decision was choosing the statusline-to-file data bridge as the sensing mechanism, which resolved the core architectural constraint (skills cannot query rate limit data directly from the harness). The implementation stayed on-plan with one reviewer-driven addition (budget check before attack/smell dispatches in build-plan).

---

## Plan Development

The plan was created from scratch during this session, following the full Chester pipeline: figure-out → build-spec → build-plan. The design interview resolved 11 decisions across 10 questions. The spec passed automated review on the first iteration. The plan was reviewed by a subagent reviewer and approved with one advisory fix incorporated (adding a second budget check point inside build-plan's hardening phase). Plan hardening (attack-plan + smell-code) was skipped at the user's explicit request. The 7-task plan was then executed inline.

---

## Decision Log

---

### Data bridge via statusline file write

**Context:**
Chester skills running inside Claude Code cannot query rate limit data directly — the harness pipes it to the statusline command via stdin on each render cycle, but does not expose it via environment variables, files, or APIs. The design needed a way to make this data available to skills at runtime.

**Information used:**
- Explore agent examined `~/.claude/statusline-command.sh` (116 lines) and found it receives JSON with `rate_limits.five_hour.used_percentage` and `resets_at` fields
- Explore agent confirmed no existing token-awareness mechanisms in any Chester skill
- `~/.claude/settings.json` showed the statusline is configured as a bash command that receives JSON via stdin

**Alternatives considered:**
- `Environment variable injection` — would require modifying the Claude Code harness itself, which is not under user control
- `Estimating consumption locally` — Chester could count its own tool calls and estimate tokens, but this would be imprecise and wouldn't account for other sessions sharing the same limit
- `Monitoring for rate limit errors reactively` — would only trigger after hitting the wall, defeating the purpose

**Decision:** Modify `statusline-command.sh` to also write `~/.claude/usage.json` on each render cycle, creating a queryable file that skills can read.

**Rationale:** Simplest bridge with no new infrastructure. The statusline script already has all the parsed data in local variables — writing it to a file is a single `cat <<EOF` append. The user confirmed no concerns about the script doing double duty.

**Confidence:** High — explicitly discussed with user, user confirmed approach.

---

### Pause-and-report behavior over graceful degradation

**Context:**
When the 5-hour limit approaches 85%, Chester needs to do something. The design interview needed to determine whether Chester should autonomously adjust its behavior (skip optional steps, compress work) or hand control back to the user.

**Information used:**
- User profile: solo dev who values capability over efficiency
- The design interview question about behavior at threshold

**Alternatives considered:**
- `Graceful degradation` — skip optional steps (attack-plan, smell-code), compress remaining work
- `Autonomous step-skipping` — let Chester decide what to cut based on priority
- `Hard stop` — immediately halt all work

**Decision:** Pause and report. Chester stops, presents status (completed tasks, current task, remaining, usage %, reset countdown), and waits for the user to decide.

**Rationale:** The user's one-word answer ("pause and report") was definitive. This keeps the user in control — they can choose to continue, stop, or adjust. No autonomous degradation means no risk of Chester cutting something the user wanted.

**Confidence:** High — user stated this directly.

---

### Per-task checking granularity in write-code

**Context:**
Chester's heaviest token consumer is `chester-write-code`, which dispatches multiple subagents per task across potentially many tasks. The question was whether budget checks should happen only at skill boundaries or also between individual tasks.

**Information used:**
- Explore agent analysis: write-code dispatches 4 agents per task (implementer, spec-reviewer, quality-reviewer, code-reviewer)
- Typical plans have 5-15 tasks
- A file read of ~100 bytes is negligibly cheap compared to subagent dispatches costing thousands of tokens

**Alternatives considered:**
- `Skill boundaries only` — simpler but misses the danger zone entirely; a write-code session could burn 40% of budget between checks
- `Per-subagent checking` — checking before every individual subagent dispatch within a task; more granular but 4x more reads for minimal benefit since subagents are fast

**Decision:** Check before every task dispatch (not every subagent dispatch). 5-15 reads per session at negligible cost.

**Rationale:** The user asked about impact ("tens? thousands?"). After learning it was 5-15 reads of a tiny file, they confirmed with "y". The per-task level catches the danger zone without excessive overhead.

**Confidence:** High — user asked a sizing question and confirmed after the answer.

---

### chester-start-debug as supplemental skill, not replacement

**Context:**
The design called for two modes: normal (guard only) and debug (guard + diagnostic logging). The question was how to toggle between them — separate start skills, a config flag, or a runtime command.

**Information used:**
- Think Tool analysis of the interaction between chester-start and chester-start-debug
- Realized that if chester-start-debug invokes chester-start, and chester-start removes the debug flag, the flag would be immediately deleted

**Alternatives considered:**
- `chester-start-debug replaces chester-start` — would require duplicating all chester-start content
- `Runtime flag in config` — user would need to edit chester-config.json before each session
- `chester-start-debug invokes chester-start after flag creation` — initially considered but raised the deletion conflict

**Decision:** chester-start-debug creates the flag, then invokes chester-start via Skill tool. chester-start only removes flags older than 12 hours (stale detection), not fresh flags.

**Rationale:** This resolved the conflict — a fresh debug flag survives chester-start's cleanup because the cleanup only targets stale flags (>12h). The user invoking chester-start-debug at session start creates a fresh flag that persists. (inferred) The 12-hour threshold was chosen as a reasonable session lifetime maximum.

**Confidence:** Medium — the interaction between the two skills required reasoning through the lifecycle, and the final approach evolved during the Think Tool analysis.

---

### Configurable threshold over hardcoded value

**Context:**
The user specified 85% as the threshold. The question was whether to hardcode it or make it configurable.

**Information used:**
- User's direct answer: "configure"

**Alternatives considered:**
- `Hardcoded at 85%` — simpler, one fewer file to manage
- `Per-session override` — could be set via command-line argument or environment variable

**Decision:** Configurable via `~/.claude/chester-config.json`, persistent across sessions, with 85% as the default.

**Rationale:** User explicitly requested configurability. A persistent config file means changing it once sticks — no need to reconfigure each session.

**Confidence:** High — user stated preference directly.

---

### 5-hour limit only, not 7-day

**Context:**
The status bar shows both a 5-hour rolling limit and a 7-day rolling limit. The guard needed to decide which to monitor.

**Information used:**
- Status bar screenshot showing 5h at 40% and 7d at 2%
- The 7-day limit was at 2% — unlikely to be hit during any single Chester session

**Alternatives considered:**
- `Both limits` — monitor 5h and 7d with independent thresholds
- `7-day only` — would miss the immediate constraint

**Decision:** Guard watches the 5-hour limit only.

**Rationale:** User's direct answer: "just 5h." The 7-day limit at 2% usage confirms it's not a practical concern for single sessions. (inferred)

**Confidence:** High — user stated preference directly.

---

### Budget check before attack-plan/smell-code dispatches

**Context:**
The plan reviewer noted that the spec called for budget checks "at entry and before attack-plan/smell-code dispatch" in build-plan, but the initial plan only added entry-level checks for all pipeline skills uniformly.

**Information used:**
- Plan reviewer's advisory recommendation
- Spec section on chester-build-plan modifications: "Add budget check at entry and before attack-plan/smell-code dispatch"
- Think Tool analysis confirming this was a valid gap — attack-plan (6 agents) and smell-code (4 agents) are the most expensive parallel dispatches

**Alternatives considered:**
- `Entry-level check only` — simpler but could miss a mid-skill budget breach before expensive dispatches
- *(No other alternatives visible in context)*

**Decision:** Added a second check point inside build-plan's Task 5 insertion instructions, specifically before the attack/smell dispatch step.

**Rationale:** The plan reviewer identified a real gap between spec and plan. The fix was minimal — one additional sentence in the insertion instructions for build-plan.

**Confidence:** High — driven by spec-plan alignment check with clear evidence.

---

### Instruction-level implementation over executable code

**Context:**
Chester skills are SKILL.md files — markdown instructions that tell the model what to do. The budget guard could be implemented as a bash script that skills call, or as instruction blocks embedded in each SKILL.md.

**Information used:**
- Existing skill architecture: all behavior is instruction-level in SKILL.md files
- No existing shared utility scripts or libraries in the skills codebase
- The guard logic is simple: read a file, compare a number, display a message

**Alternatives considered:**
- `Shared bash script` — a `budget-guard.sh` that skills invoke; DRY but adds a new pattern to the architecture
- `MCP tool` — implement the guard as an MCP server endpoint; most robust but heaviest infrastructure

**Decision:** Instruction-level — the budget guard check is a markdown block inserted into each relevant SKILL.md.

**Rationale:** Follows existing patterns. The guard logic is simple enough that a shared script would be premature abstraction. Each skill gets the same block, which is acceptable duplication for instructions. (inferred)

**Confidence:** Medium — this was the natural choice given the architecture, but no explicit discussion about alternatives occurred in the session.
