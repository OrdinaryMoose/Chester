# Evaluation Brief: Review Skill Rationalization

**Date:** 2026-04-05
**Type:** Refactor — benchmark-driven simplification
**Scope:** chester-plan-smell, chester-plan-attack, chester-util-codereview (new)

## Hypothesis

The multi-agent review architecture (3 agents for plan-smell, 5 agents for plan-attack)
may not produce meaningfully better findings than a single-pass review. If true, the
multi-agent overhead (2-3x time, 1.3-1.7x tokens, Structured Thinking MCP dependency)
is unjustified cost.

## Origin

The question arose while creating `chester-util-codereview` — a new skill to review
existing code (not plans) scoped to a directory. The initial draft mirrored plan-smell's
3-agent architecture. During testing, the baseline (no skill, just "review this code for
smells") produced comparable findings at 1/3 the cost. This raised the question: does
the multi-agent approach justify itself for *any* of the review skills?

## Methodology

### Phase 1: Code review skill (chester-util-codereview)
- **Iteration 1:** Tested 3-agent skill vs baseline on Chester skill files (markdown)
  - 3 eval targets: chester-util-config (2 files), chester-plan-smell (1 file), chester-execute-write (5 files)
  - 6 runs total (3 with skill, 3 baseline)
- **Iteration 2:** Tested on real C# code (StoryDesigner project)
  - 3 eval targets: ViewModels (9 files), Services (~28 files), Core.Domain (42 files)
  - 6 runs total (3 with skill, 3 baseline)
- **Iteration 3:** Tested lightweight rewrite against same Services/ target
  - 1 run to validate cost matches baseline

### Phase 2: Plan smell skill (chester-plan-smell)
- No separate testing — applied same conclusion from Phase 1 data.
  plan-build consumes smell output as prose (no structured parsing), so the
  structured format adds no value to the consumer.

### Phase 3: Plan attack skill (chester-plan-attack)
- **Test 1:** 5-agent vs lightweight on stale Chester plan (multi-project-config)
- **Test 2:** 5-agent vs lightweight on stale StoryDesigner plan (cascading-output-directory)
- Both plans turned out to be stale/unexecutable, limiting the comparison to
  structural integrity findings.

## Key Data

### Code Review (Iteration 2 — real C# code)

| Metric | With Skill (3-agent) | Baseline | Delta |
|--------|---------------------|----------|-------|
| Mean time | 206s | 99s | 2.1x |
| Mean tokens | 60k | 47k | 1.3x |
| Mean findings | 13.3 | 12.3 | +1 |
| Pass rate (structural assertions) | 100% | 67% | +33% |

The +33% pass rate is entirely formatting (severity labels, smell taxonomy, density rating),
not finding quality.

**Qualitative difference:** Baseline catches practical runtime bugs (memory leaks, thread
safety, missing notifications). Skill catches cross-cutting architectural patterns
(Shotgun Surgery, blast radius). Neither is strictly superior.

### Lightweight rewrite vs baseline (Services/)

| Metric | Lightweight | Baseline |
|--------|-------------|----------|
| Time | 98s | 93s |
| Tokens | 44k | 42k |
| Findings | 9 | 12 |

Lightweight matched baseline cost while adding scope enforcement and organized output.

### Plan Attack

| Metric | Lightweight | 5-Agent |
|--------|-------------|---------|
| Mean time | 141s | 224s |
| Mean tokens | 41k | 49k |
| Multiplier | 1.0x | 1.6x time, 1.2x tokens |

Both immediately identified stale plans as unexecutable.

## Decision

Rewrite all three review skills as lightweight single-pass reviews. The multi-agent
architecture does not produce findings that justify its cost overhead. The 5-agent
version of plan-attack is preserved as SKILL.md.bak for potential restoration if a
future test against a live, complex plan shows the lightweight version missing
critical findings.

## Artifacts

- `chester-util-codereview-workspace/` — all iteration data, benchmark.json, analysis.md
- `chester-plan-attack/SKILL.md.bak` — preserved 5-agent version
- `chester-util-codereview/SKILL.md.bak` — preserved 3-agent version (untracked on main)
