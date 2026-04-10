# design-small-task — Design Brief

## Goal

Build a lightweight Chester design skill for well-bounded tasks. The skill holds a short interactive conversation using the information-rich presentation style from design-experimental (observations block, three-component information package, commentary), then produces a design brief optimized for plan-build consumption. It fills the gap between the heavyweight design skills (figure-out, experimental) and bypassing design entirely — giving well-bounded tasks a few rounds of structured consideration without MCP scoring, formal proofs, two-phase transitions, or the spec step.

## Scope

**In scope:**
- Single SKILL.md file in `skills/design-small-task/`
- Entry in setup-start's available skills registry
- Bootstrap integration (config, sprint naming, directories, budget guard)
- Conversation loop with full visible surface from design-experimental
- Design brief artifact written to `design/` subdirectory
- Direct transition to plan-build at closure

**Out of scope:**
- No MCP servers — no scoring, no proof building, no enforcement tools
- No supporting scripts, subagent templates, or reference files
- Does not replace design-figure-out or design-experimental for complex/ambiguous work
- No design-specify step — brief goes directly to plan-build

## Key Decisions

1. **Keep start-bootstrap.** Sprint naming, directories, config, budget guard, and task reset all needed even for short sessions. Alternative considered: inline reimplementation or skipping bootstrap entirely.

2. **Three-part exploration, no agent dispatch.** The skill is typically invoked mid-conversation after a detailed discussion. Exploration is: (1) synthesize existing conversation context, (2) inline code exploration of relevant areas, (3) inline prior art scan for similar patterns. Alternatives considered: three parallel explorer agents, one explorer agent.

3. **No capture_thought.** Overhead not justified for 2-5 round conversations. Context compaction unlikely to threaten early reasoning in short sessions.

4. **No safety valve or round cap.** The designer controls pacing and decides when to proceed. No checkpoint interruptions.

5. **Drop Translation Gate.** Code vocabulary welcome in commentary — specific files, patterns, and structures can be referenced directly. Information is still curated (no raw dumps), but domain-only language is not enforced.

6. **Full three-layer visible surface.** Observations block (alignment check, metacognitive reflection, direction signal), three-component information package (current facts, surface analysis, uncomfortable truths), commentary with closing prompt ("What do you think?").

7. **Designer-initiated proceed gate.** The agent never suggests, recommends, offers, or steers toward writing the brief. It stays in the conversation loop indefinitely — presenting information and asking questions. The designer explicitly directs the agent to proceed when ready. The agent has no role in the transition.

8. **Design brief format optimized for plan-build.** Five sections: Goal (one paragraph — what and why), Scope (in/out), Key Decisions (what we considered and landed on), Constraints (what limits implementation), Acceptance Criteria (how we know it's done).

## Constraints

- No MCP servers of any kind
- Single-phase conversation — no Understand/Solve split, no phase transitions
- Must keep full information package presentation style from design-experimental
- Working name design-small-task — final name TBD

## Acceptance Criteria

- Skill can be invoked as `chester:design-small-task`
- Conversation loop holds without rushing — model does not write brief until explicitly directed by the designer
- Design brief artifact written to `design/` subdirectory with correct naming per util-artifact-schema
- Transitions to plan-build at closure
- Registered in setup-start's available skills list with description and trigger conditions

## Risk

- The agent's completion bias may cause it to subtly steer toward closure through commentary framing (e.g., "we seem to have covered everything") even without explicitly recommending to proceed. The skill instructions must prohibit steering as well as recommending.
