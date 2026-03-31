# Session Summary: Chester Token Optimization Investigation

**Date:** 2026-03-26
**Session type:** Design investigation and empirical analysis
**Plan:** None — this was an exploratory session that concluded before planning

---

## Goal

Determine whether Chester's token consumption could be meaningfully reduced without
degrading skill capabilities, in order to improve both context window utilization and
total token budget consumption per session.

---

## What Was Decided

### Static audit: full skill corpus

Measured all Chester skill files (~28,577 words, ~37K estimated tokens). Identified
the largest consumers: chester-attack-plan (2,666 words with 6 inline subagent prompts),
chester-smell-code (2,193 words with 4 inline), and chester-figure-out (1,570 words).
Noted that attack-plan and smell-code embed subagent prompts inline while write-code
and doc-sync properly externalize them to separate files.

### Dynamic model: frequency × size

Built a theoretical model of a full 5-phase pipeline session (~83 turns). Key insight:
the always-on baseline (chester-start + CLAUDE.md + skill descriptions) is charged on
every API call, making it the dominant cost driver by frequency even though individual
skills are larger by size.

### Empirical measurement: this session as canary

Used the actual session JSONL to measure real token consumption:

| Metric | Value |
|--------|-------|
| API calls | 65 |
| Starting context (call #1) | 20,349 tokens |
| Current context (call #65) | 45,356 tokens |
| Total input tokens consumed | 2.1M |
| Context growth | 2.2x |

### The decisive finding: baseline decomposition

Decomposed the 20,349-token always-on baseline:

| Component | Tokens | % of Baseline | Controllable? |
|-----------|--------|---------------|---------------|
| Claude Code built-in system prompt | ~16,193 | 80% | No |
| chester-start SKILL.md | ~1,625 | 8% | Yes |
| Skill descriptions (system-reminder) | ~1,399 | 7% | Yes |
| CLAUDE.md | ~1,081 | 5% | Yes |
| **Total Chester** | **~4,156** | **20%** | **Yes** |

### Decision: no-go

Chester accounts for only 20% of the always-on token baseline. The remaining 80% is
Claude Code's own system prompt, which is not controllable. Optimizing the 20% would
risk degrading skill capabilities for marginal savings. The user concluded the juice
is not worth the squeeze.

---

## Handoff Notes

- The empirical measurement approach (reading session JSONL for `usage` fields) proved
  more persuasive than theoretical modeling — use this technique in future cost analyses
- The 80/20 split (Claude Code vs Chester) is a hard constraint: no amount of Chester
  optimization can address the dominant cost
- If Anthropic reduces the built-in system prompt size in future Claude Code versions,
  Chester's relative share would increase and this analysis should be revisited
- The session JSONL path for this project is:
  `~/.claude/projects/-home-mike--claude-skills/29726007-f86f-4f47-9a7a-867dff35d768.jsonl`
