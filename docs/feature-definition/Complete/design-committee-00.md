# Feature Definition Brief: design-committee Skill — Six-Role Deliberation Team Setup

**Status:** Draft
**Date:** 2026-05-17

---

## Problem Statement

Chester's four-pole deliberation team — Conservator / Innovator / Pragmatist / Purist — currently lives only inside `design-large-task` as Step-B Understand-Stage subagents. Their job there is narrow: produce problem-statement candidates under hard prohibitions ("no solutions, no design alternatives, no architecture suggestions"). They are excellent at that, but the same four poles have proven valuable for a broader class of ad-hoc consultations that don't run the full understand→solve pipeline: meta-architecture questions, cross-cutting design choices, decisions where independent perspectives reduce framing bias.

In StoryDesigner, this broader use evolved organically into a six-role convention nicknamed "the Committee" — the four poles plus an Arbiter (proof-state custodian, no design opinions), a Researcher (codebase / prior-art / admin tasks, no design opinions), with the calling agent as team-lead and the human as designer. The convention was documented inside StoryDesigner's project `CLAUDE.md`. That placement is wrong on two counts. First, the convention is about Chester subagents, not about StoryDesigner. Second, the Arbiter and Researcher roles have never been instantiated as actual subagent types in the Chester plugin — they exist only as instructions to the main thread, which is exactly the cross-responsibility overload pattern that motivated the six-role split in the first place (per the 2026-05-16 charter-split directive, Arbiter previously held proof + research + admin + spec interpretation, and the NCON-5 grounding defect was traced to that compression).

The need is a `design-committee` skill that lives in the Chester plugin, exposes the six-role setup as a first-class Chester capability, and ships with the two missing subagent types (Arbiter, Researcher) so every Committee role has its own dispatched agent and its own context window.

### Prior attempts

- **Step-B four-pole subagents (shipped, in `design-large-task`).** Four pole agents exist and are battle-tested for Understand-Stage problem-statement work. They cannot be reused as-is for Committee work because their phase contract is wired to Understand-Stage transcript schemas (opening / opposing / counter / synthesis-attack / ratification rounds) and their hard prohibitions forbid the solution-space discussion that Committee work requires.
- **StoryDesigner "Committee" CLAUDE.md section (shipped 2026-05-15).** Documents the convention but instantiates only the four poles via `TeamCreate` of the existing step-b agents — the Arbiter and Researcher roles are described in prose and assumed to be handled by the main thread. The 2026-05-16 charter split was a designer-issued correction to that arrangement; it has not yet been implemented as subagent types.

---

## Current State Inventory

### Four pole subagents (exist, will be reused or paralleled)

- `agents/design-large-task-step-b-conservator.md` — S pole. Hard-wired to Understand-Stage Phase contract (opening / opposing / counter-arguments / synthesis-attack / ratification). Cites `skills/design-large-task/references/team-interview-flow.md` for transcript schemas.
- `agents/design-large-task-step-b-innovator.md` — N pole. Same phase-contract wiring.
- `agents/design-large-task-step-b-pragmatist.md` — W pole. Same.
- `agents/design-large-task-step-b-purist.md` — E pole. Same.

All four already cite `skills/util-design-partner-role/SKILL.md` for stance principles (Be opinionated, Read code as design history, Think in trade-offs, Evaluate boundaries as choices, Align architecture to intent) and the C1 / C2 voice rules. Those parts transfer cleanly to Committee work. The Phase Contract and Understand-Stage Discipline sections do not.

### Arbiter and Researcher (do not exist as subagent types)

No agent file exists at `agents/design-committee-arbiter.md` or `agents/design-committee-researcher.md`. The roles are described only in user-memory at `feedback_committee_charter_split.md` and are currently absorbed into the main thread's responsibilities during ad-hoc Committee invocations in StoryDesigner.

### Team-lead and designer roles (not subagents; named for clarity)

- **Team-lead** is the main agent that invoked the skill — the conversation's main thread. Dispatches, consolidates, produces decision packets. Holds no separate agent file.
- **Designer** is the human user. Adjudicates all decisions, sets meta-rules, authorizes charter changes. Holds no agent file (obviously).

### Existing skill patterns to mirror

- `skills/design-large-task/SKILL.md` — multi-phase skill that dispatches subagents in parallel via `TeamCreate` + `SendMessage`. Reference for orchestration mechanics.
- `skills/util-design-partner-role/SKILL.md` — single source of truth for stance principles and voice discipline. The Committee skill should import from here, not duplicate.
- `skills/util-dispatch/SKILL.md` — canonical parallel-dispatch pattern for 2+ independent agents.

### StoryDesigner convention document (will become inert)

- `/home/mike/RiderProjects/StoryDesigner/CLAUDE.md` — `## The Committee` section. Once `design-committee` ships, this section becomes a pointer ("see `chester:design-committee`") or is deleted entirely. The History subsection (rev-01 debate provenance) may remain in StoryDesigner since it is StoryDesigner-specific.

### Memory artifacts that informed the design

- `feedback_committee_convention.md` — names the team "the Committee," locks the four-pole S/N/W/E Cartesian taxonomy.
- `feedback_committee_charter_split.md` — six-role split with sharply bounded responsibilities; Arbiter overload caused the NCON-5 grounding defect.
- `feedback_two_round_deliberation_protocol.md` — R1 proposals + cross-DM, R2 finals + per-pole positions, team-lead risk-weighted consolidation, designer adjudicates.
- `feedback_designer_decision_packet_format.md` — 3-section packet: what the decision is, analysis of options, recommendation.
- `feedback_translation_gate_mcp_leakage.md` — Translation Gate strips MCP scores, dimension names, NCON/RULE/RISK IDs from all designer-facing output.
- `feedback_design_packet_two_sentence_cap.md` — info packets and commentary capped at two sentences per item.
- `feedback_terminal_soft_wrap.md` — soft-wrap paragraphs in terminal output.

---

## Governing Constraints

- **No StoryDesigner-specific content in the plugin.** The skill must be project-agnostic. References to "rev-01 debate," "NCON-5," and StoryDesigner-specific artifact paths stay in StoryDesigner's CLAUDE.md history note, not in the plugin.
- **Reuse the four existing pole agents if and only if their phase contract can be cleanly separated from the Understand-Stage discipline.** If a clean separation requires invasive surgery to the existing step-b agent files, prefer paralleling them with new `design-committee-{pole}.md` agent files that keep stance principles + voice discipline but replace the phase contract. The existing step-b agents must continue to work inside `design-large-task` unchanged.
- **Arbiter and Researcher must be dispatched subagents, not main-thread responsibilities.** The 2026-05-16 charter split is load-bearing — Arbiter compressing across multiple responsibilities caused real defects. The skill must instantiate them as their own agent files with their own context windows.
- **Team-lead is the calling agent.** The skill does not spawn a separate "team-lead" subagent — the agent that invoked the skill performs that role. Spawning a team-lead would require the calling agent to hand off conversation state to a subagent, which Claude Code does not currently support cleanly.
- **Designer is the human user.** Never spawn a "designer" subagent. The skill produces decision packets for the human to adjudicate; it does not adjudicate on the human's behalf.
- **Translation Gate stays fully in force on all designer-facing output.** No leakage of MCP scores, dimension names, NCON/RULE/RISK IDs, or other internal vocabulary. Applies to consolidated decision packets and to any direct pole/arbiter/researcher reply quoted into designer-facing output.
- **Two-sentence cap on info-packet components and commentary blocks.**
- **Soft-wrapped paragraphs in terminal output** — no hard line breaks mid-sentence.
- **Stance principles and voice discipline (C1 / C2) come from `util-design-partner-role`.** The Committee skill imports; it does not redefine.
- **The skill must be standalone-invocable.** The Committee is for ad-hoc consultation, not just pipeline use. Invocation via `/design-committee` or natural-language triggers; no requirement that a sprint context exist.

---

## Design Direction

### Skill identity

- **Name:** `design-committee` (Chester plugin skill, accessible as `chester:design-committee`).
- **Trigger phrases:** "convene the committee", "ask the committee", "committee deliberation", "four-pole review", "/design-committee".
- **Skill type:** Flexible (adapts principles to context). Not rigid.
- **Scope:** Skill setup + role specification only. Does not prescribe deliberation rounds in depth — those are addressed by `feedback_two_round_deliberation_protocol.md` and can be a follow-up brief if formalization is needed.

### The six roles

The skill instantiates six roles. Four are dispatched to existing or new subagent types; two are conceptual (team-lead = main thread, designer = human).

1. **Conservator (S) — dispatched subagent.** Defends existing structure, stasis, prior decisions. Reuses Stance Principles + C1/C2 voice from `util-design-partner-role`. Phase contract differs from step-b: Committee mode is request/reply with optional peer-DM, not Understand-Stage rounds.
2. **Innovator (N) — dispatched subagent.** Pushes new framings and structural alternatives. Same reuse pattern as Conservator.
3. **Pragmatist (W) — dispatched subagent.** Weighs operational cost vs benefit, defends simplest sufficient solution. Same reuse pattern.
4. **Purist (E) — dispatched subagent.** Tests category boundaries and compositional integrity. Same reuse pattern.
5. **Arbiter — dispatched subagent (NEW).** Proof-state custodian and proof operations only. When the Committee is convened against a proof MCP (or any structured state), the Arbiter is the sole role authorized to read/mutate that state. Simulates the proof system per spec semantics. Element CRUD (add/ratify/revise/withdraw), verbatim element retrieval on request, closure-gate logic, friction detection, counterfactual probes, audit-trail of mutations. Hard prohibitions: NO research, NO admin file ops, NO design opinions, NO element proposals.
6. **Researcher — dispatched subagent (NEW).** Research and administrative tasks. Codebase research, prior-art research, industry research, document reading, file operations beyond proof state, gathering and consolidating information from multiple sources. Hard prohibitions: NO proof mutations, NO design opinions.

Plus two non-dispatched roles:

- **Team-lead — main calling agent.** Synthesizer and coordinator. Dispatches to the six subagents, consolidates returns, produces decision packets, holds the workflow thread. No design opinions; no proof mutations.
- **Designer — human user.** Adjudicates all decisions. Sets meta-rules. Approves charter changes.

### Agent file inventory

The skill ships with six agent files:

- `agents/design-committee-conservator.md` (NEW — paralleled from step-b-conservator)
- `agents/design-committee-innovator.md` (NEW — paralleled from step-b-innovator)
- `agents/design-committee-pragmatist.md` (NEW — paralleled from step-b-pragmatist)
- `agents/design-committee-purist.md` (NEW — paralleled from step-b-purist)
- `agents/design-committee-arbiter.md` (NEW — no precursor)
- `agents/design-committee-researcher.md` (NEW — no precursor)

Each agent file imports stance principles and voice discipline from `util-design-partner-role` and declares its Committee-mode phase contract (request / reply, optional peer-DM authorization, decision-packet contribution format). The four pole agents replace the Step-B phase contract with a Committee phase contract; the Arbiter and Researcher define their phase contracts from scratch.

### Why parallel agent files rather than reuse

The existing step-b agents are hard-wired to Understand-Stage transcript schemas, phase rounds (R1–R5), and prohibitions that block solution-space discussion. Surgery on those files to make them dual-mode (Understand-Stage *and* Committee mode) would entangle two phase contracts in one file and risk regressions in `design-large-task`. The cheaper, safer move is to parallel them: new files in `agents/design-committee-*.md` import the same stance + voice surface from `util-design-partner-role` (so the lens position stays identical) and declare a Committee-specific phase contract. The step-b files remain untouched.

### Skill responsibilities (setup-only scope per this brief)

- Read project context (optional sprint dir, optional MCP state path the Arbiter should bind to).
- Confirm with designer which question(s) to put to the Committee.
- Call `TeamCreate` to instantiate the six dispatched roles.
- Provide the deliberation harness — at minimum, single-round dispatch with `SendMessage`. Multi-round protocol (R1 / R2 with cross-DM and risk-weighted consolidation) is a follow-up scope decision; this brief covers setup only.
- Produce a consolidated decision packet for the designer (3-section format: what the decision is, analysis of options, recommendation).
- Tear down the team when the designer signals closure.

### Out of scope for this brief

- Detailed deliberation-round protocol (R1 / R2 cross-DM mechanics, ratification gates). Two-round protocol exists in memory and may be formalized in a follow-up brief.
- Proof-MCP integration specifics (binding the Arbiter to a specific MCP server, state-handoff semantics). The skill must support this but the wire-up details are deferred.
- Migration of the StoryDesigner CLAUDE.md `## The Committee` section. Once the skill ships, StoryDesigner's section becomes a pointer or is deleted; that's a StoryDesigner project task, not a Chester plugin task.
- Retiring the step-b pole agents. They stay as-is for `design-large-task` Step-B use.

---

## Open Concerns

- **Should team-lead become a dispatched subagent?** Current design keeps team-lead as the main calling thread. Trade-off: keeping it on the main thread preserves conversation continuity with the designer but burdens the main context window with dispatch / consolidation work. A dispatched team-lead would isolate that work but loses the designer-conversation continuity. The recommendation is "keep on main thread for now; revisit if context-window pressure becomes a real problem."
- **Should the four Committee poles be allowed to be invoked independently of a full Committee convening?** Use case: designer wants just a Conservator pass on a single design choice without spinning up the full six-role team. The skill could expose pole-only sub-invocations (`/design-committee --pole=conservator`). Recommendation: yes, but as a follow-up extension once the full-team path is solid.
- **How does the Arbiter bind to a proof-MCP server?** Current Committee work in StoryDesigner used MCP-backed proof state (`chester-design-proof`). The Arbiter agent needs a contract for which MCP it binds to per invocation and what its read/write authority looks like. This is the cleanest open hard-decision; resolution shapes the Arbiter agent file.
- **Does the skill itself need a "Translation Gate" enforcement pass before output, or does each subagent self-enforce?** Each subagent should self-enforce (they all import the voice discipline). The team-lead synthesizer should re-check on consolidation. Whether to add a hard automated gate (e.g., regex scan of output for forbidden tokens like "NCON-", "RULE-", "RISK-", dimension names) is an open call. The memory `feedback_translation_gate_mcp_leakage.md` strongly prefers mechanical enforcement.
- **Does the skill need an entry condition (must be in a sprint, must have a config file)?** Current preference: no entry condition. The Committee is for ad-hoc consultation and should be invocable from any context.

---

## Acceptance Criteria

- A `design-committee` skill exists at `skills/design-committee/SKILL.md` with frontmatter description and trigger phrases that fire on natural-language Committee requests and `/design-committee`.
- Six agent files exist under `agents/design-committee-*.md` covering Conservator, Innovator, Pragmatist, Purist, Arbiter, Researcher. Each declares its role, lens position (for poles) or responsibility scope (for Arbiter / Researcher), imports stance principles and voice discipline from `util-design-partner-role`, and declares its Committee-mode phase contract.
- The skill instantiates all six dispatched subagents via `TeamCreate` on invocation and tears the team down on closure.
- The skill produces designer-facing output as a 3-section decision packet (what the decision is, analysis of options, recommendation) with Translation Gate applied.
- The four existing step-b pole agents (`design-large-task-step-b-*.md`) remain untouched and continue to function inside `design-large-task` Step-B.
- StoryDesigner's `## The Committee` CLAUDE.md section can be reduced to a one-paragraph pointer at `chester:design-committee` without losing operational capability.
- The skill is invocable standalone — no sprint context, master-plan breadcrumb, or config file required.
