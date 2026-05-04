# Review Session Behaviour — Local Skill — Design Brief

## Goal

Build a local user-level Claude Code skill that produces behavioural post-mortems from archived Chester sprint sessions, so that future skill-edit decisions — starting with the deferred trim of `execute-prove`'s 4.6-era rationalization content — can be grounded in evidence from real session transcripts rather than intuition about model capability. The skill is invoked manually against a single sprint at a time, reads that sprint's jsonl archive, and writes a structured behavioural report back into the sprint's summary folder. Initial use answers whether rationalization scaffolding in `execute-test` and `execute-prove` is load-bearing or dead weight under Opus 4.7 once 4.7 sessions accumulate in the archive.

## Prior Art

- **Original conversation framing (session start).** This sprint began as "trim 4.6-era rationalization bloat from `execute-test` and `execute-prove` for Opus 4.7, target ~60% reduction of redundant counter-argument tables." Through iteration, the trim narrowed to `execute-prove` alone with `execute-test` preserved, then the designer surfaced the deeper question: "how will I know whether the current skills are or aren't working optimally with 4.7?" That question has no answer from intuition; it requires behavioural evidence.

- **Chester's jsonl archive.** `docs/chester/plans/*/summary/*.jsonl` contains 25+ complete session transcripts going back to 2026-03-26. Every transcript includes `thinking` blocks (model internal reasoning), `tool_use` sequences (actions taken), `text` blocks (visible output), `user` messages (including corrections), and the `model` field identifying which Claude model ran each turn. Every archived session ran on `claude-opus-4-6`. The 4.7 corpus is zero sessions as of this brief; it will accumulate naturally as Chester is used with 4.7.

- **`2026-03-26-token-diet-skills` sprint.** Ran a token-diet pass over Chester skills but left no design brief artifact — only a session summary. We don't have a durable record of what that sprint decided to keep vs cut, which means we can't confidently say whether its trims were evidence-based or intuitive. This is itself evidence that Chester has historically made skill-edit decisions without a behavioural-evidence framework.

- **Chester conventions being reused.** NN versioning (`-read-00.md`, `-read-01.md`) matches the pattern used for design briefs, specs, plans, and summaries. Report colocation in the sprint's `summary/` folder matches where audits and session summaries already live. `jq` is already a Chester environment dependency (checked at `setup-start` for budget guard parsing).

- **Scaffolding lineage.** Chester's skills were designed to compensate for 4.6's tendency to rationalize, skip structural work, and lose state across compaction. The original conversation identified three compensation patterns: (1) rationalization tables with "Excuse → Reality" rebuttals, (2) mandatory think gates, (3) per-turn MCP scoring. The trim instinct was aimed at pattern (1) specifically. Whether any of these patterns still earn their keep under 4.7 is the question this skill is designed to help answer.

## Scope

**In scope:**

- New local user-level skill at `~/.claude/skills/review-session-behaviour/SKILL.md`
- Single-session invocation mode — user passes a Chester sprint path, skill produces one report
- Scope B signal extraction: rule enforcement (rationalization events, verification sequences) and scaffold utilization (rule-language invocation, MCP tool call traffic)
- Seed pattern library embedded in the skill file, user-editable without skill rewrite
- Report written to `{sprint-path}/summary/behavioural-read-NN.md` with NN versioned sequencing
- Report structure: metadata header, rationalization events, verification sequences, scaffold utilization, raw evidence appendix
- Evidence presentation only — skill surfaces the sequences, user classifies compliance vs deviation
- Bash + `jq` + `grep` implementation only; no Python, Node, or other runtimes

**Out of scope:**

- Multi-session aggregation (deferred to v2 once a 4.7 corpus exists)
- Non-Chester session sources (v1 is scoped to the Chester sprint archive format)
- Automatic classification of signals ("counter-argument landed" / "counter-argument failed")
- Silent rationalization detection (only surfaced thinking is observable)
- Any changes to `execute-test`, `execute-prove`, `design-figure-out`, or any other Chester skill
- The original narrow trim of `execute-prove`'s rationalization table — deferred pending behavioural evidence this skill is designed to produce
- CI integration, test harness, or automated report comparison

## Key Decisions

1. **Pivot from skill-trim to observation-first.** The trim was the original intent, but the designer surfaced that intuition-driven trims to enforcement-critical skills carry real regression risk. Rather than act on intuition, build the capability to observe skill behaviour empirically, then trim with data. Alternative considered: execute the narrow trim on judgment. Rejected because the cost of silently weakening verification discipline is higher than the cost of carrying ~20 lines of possibly-redundant content.

2. **Scope B (rule enforcement + scaffold utilization), not A or C.** Scope A (rule enforcement only) is too narrow — would answer the current question and never be reused. Scope C (adds correction topology) drifts into broader session analysis than the 4.6→4.7 question warrants. Scope B is the minimum scope that produces a durable analyst's tool applicable to any future skill-design decision.

3. **Single-session v1, aggregate manually.** V1 produces one report per invocation. The designer aggregates across reports manually (side-by-side reading) until the corpus justifies automated aggregation. Alternative considered: multi-session from v1. Rejected because the 4.7 corpus is currently zero sessions; aggregation has nothing to aggregate for months, and building aggregation now means debugging extraction and aggregation simultaneously.

4. **Evidence presentation, no classification.** Skill surfaces rationalization sequences and verification windows verbatim with enough context to judge. Skill does not output verdicts like "counter-argument landed" or "rule enforcement failed." Alternative considered: automatic classification. Rejected because natural-language pattern matching cannot reliably classify compliance vs deviation; claiming a verdict the skill can't justify would make the tool dishonest.

5. **Co-located output in sprint summary folder.** Reports land at `{sprint-path}/summary/behavioural-read-NN.md`, next to the source jsonl. Alternative considered: central location under `~/.claude/skills/review-session-behaviour/reports/`. Rejected by the designer — co-location keeps evidence near its source even though it means local-skill output lands in Chester's tracked git tree.

6. **Versioned output (NN sequencing).** Re-running the skill against the same sprint produces a new report (`behavioural-read-01.md`), not an overwrite. Alternative considered: overwrite latest. Rejected because the pattern library evolves over time — earlier reads calibrated against an earlier pattern library are worth preserving for comparison.

7. **Local skill, not Chester skill.** Lives at `~/.claude/skills/review-session-behaviour/`, invoked from any session without Chester project context. Alternative considered: add to Chester's plugin as a `util-` skill. Rejected by the designer — this is personal analyst tooling, not part of Chester's distribution.

8. **Pattern library as seed, evolves via user edits.** V1 ships with a starter pattern list (rationalization vocabulary families, compliance-reversal vocabulary, scaffold invocation strings) embedded in the skill file itself. Users expand the library by editing the skill as they notice patterns not on the seed list. Alternative considered: require a complete pattern library before shipping. Rejected because completeness is unreachable and pattern drift across model generations is expected.

9. **v1 scoped to Chester sprint archives specifically.** The skill assumes the input is a Chester sprint path with a recognizable `summary/*.jsonl` structure. Alternative considered: generalize to any Claude Code session. Deferred — if the use case broadens later, that's a v2 scope expansion.

## Constraints

- **Dependencies.** Bash, `jq`, and `grep` only. No Python, Node, or other language runtimes. `jq` is already part of the standard Chester environment.
- **Portability.** The skill must run from any working directory without requiring Chester project configuration (no `chester-config-read`, no sprint bootstrap, no budget guard integration).
- **Source integrity.** Read-only on input jsonls. The skill must never modify source transcripts.
- **Report format.** The report's metadata header (model, turn count, user correction count, skills exercised) must be machine-readable — either fixed YAML frontmatter or a consistent markdown field block — so that future aggregation can consume reports without re-reading source jsonls.
- **Versioning convention.** Output filenames must follow `behavioural-read-NN.md` with zero-padded two-digit sequencing, matching Chester's existing NN convention for comparable artifacts.
- **Signal vocabulary evolution.** The skill file itself must carry the editable pattern library. Patterns must not live in a separate config file; they are part of the skill's documented procedure.

## Acceptance Criteria

**Procedural (mechanical — verifiable by running):**

- Given `{sprint-path}` as input, the skill reads `{sprint-path}/summary/*.jsonl` and writes `{sprint-path}/summary/behavioural-read-NN.md` using the next available sequence number for that sprint.
- The report contains all five required sections: metadata header, Rationalization Events, Verification Sequences, Scaffold Utilization, Raw Evidence Appendix.
- The metadata header includes: sprint name, model identifier (from the jsonl), turn count, user correction count, skills exercised (list of `Skill` invocations found in the session).
- The pattern library section is embedded in `SKILL.md` and is directly editable — no separate config files, no generated artifacts.
- The skill runs using only Bash, `jq`, and `grep`. No Python or Node required.
- The skill completes a run against a typical Chester session (≈1 MB jsonl, ≈500 lines) in under 30 seconds.

**Behavioural (judgment — verifiable by reading the output):**

- Run against 2–3 recent 4.6 sprints (e.g., `20260410-02-add-attack-specify`, `20260408-03-plan-mode-design-guard`, `20260403-02-architect-pacing-optimization`); each report reads as useful evidence rather than noise.
- Rationalization events surfaced overlap meaningfully with what a manual reader would flag — false positive rate low enough that the report is worth reading end-to-end.
- Verification sequences correctly identify cases where completion claims had fresh tool calls preceding them vs cases where they didn't.
- The raw evidence appendix provides enough surrounding context per excerpt (turn numbers, line references, adjacent thinking) that the designer can judge the signal without opening the source jsonl.
- The report is scannable top-to-bottom in under 10 minutes per session.

**Shippability threshold:**

- V1 means *shippable*, not *complete*. Signal extraction works against the 4.6 archive; the pattern library is seeded; re-runs against new sessions produce incrementally-better output as patterns are added. Pattern-library completeness and aggregation are not v1 gates.
