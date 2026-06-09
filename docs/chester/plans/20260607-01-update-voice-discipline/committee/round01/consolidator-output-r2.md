# Consolidator output — round 01 (R2 revision)

## Alignment

Agent-side crux — Teams subagents and named Task subagents:

- Build-time generator for BOTH Teams + named Task subagents (2): Pragmatist, Purist
- DTI for Teams subagents / build-time generator for named Task subagents (1): Innovator
- DTI for BOTH Teams + named Task subagents (1): Conservator

Non-agent-side (settled, all 4):
- Parent-session skills: runtime-read (4): Conservator, Innovator, Pragmatist, Purist
- CLAUDE.md rules: two-tier pointer (4): Conservator, Innovator, Pragmatist, Purist

Skill catalog (FD-03):
- Build-time generator (3): Innovator, Pragmatist, Purist
- Pointer-only / no generator (1): Conservator

Concessions noted:
- Innovator: concedes named Task subagents to generator; holds DTI for Teams only; marks Teams-vs-Task split non-blocking
- Purist: concedes four-mechanism claim; collapses to generator for all stable-at-authoring agent content
- Pragmatist: concedes R1 dev-mode assumption for committee Teams subagents; joins generator for both agent kinds

## Per-member summary

- Conservator: DTI for all agent-side consumers (Teams + named Task subagents), with DTI preserving hand-authored agent files and no build step required.
- Innovator: DTI for Teams subagents; build-time generator for named Task subagents; concedes named Task to generator and marks Teams-only DTI as non-blocking if the team judges generator-everywhere-on-agents as more important.
- Pragmatist: Build-time generator for all agent-side consumers (Teams + named Task subagents), citing dispatch-path complexity as DTI's real cost rather than token volume.
- Purist: Build-time generator for all stable-at-authoring agent content (canonical rules + scaffold + lens blocks); DTI retained only for runtime-varying content already structural in dispatch payloads.

## Notable quotes

- Conservator: "Between DTI and generator, the Conservator lands on DTI. Reason: DTI preserves the existing authoring model. Agent files remain hand-authored documents — lens preamble, phase contract, prohibitions, worked examples, all directly editable by a human without any tooling."

- Conservator (blocking_risk): "The harder risk: DTI puts the injection logic in the calling skill, creating a new obligation on every skill that dispatches agents to correctly inject the canonical text. If a new skill dispatches a reviewer without the injection, it silently breaks the discipline. The generator avoids this by making the instruction self-contained in the agent file."

- Innovator: "Innovator holds DTI for Teams as the structurally cleaner option but does not block if the team judges the consistency argument for generator-everywhere-on-agents as more important than the dispatch-shape distinction."

- Innovator (on Teams vs Task distinction): "Teams subagent invocation shape differs from Task subagent. Task subagent = file-is-prompt (generator fits). Teams subagent = TeamCreate + SendMessage (dispatch message has injection point, can carry session-specific context that a static generated file cannot)."

- Pragmatist: "DTI's real cost is dispatch-path complexity on the team-lead caller, not token volume — token overhead across the tool's lifetime is ~$1-2, which is not material, but the read-and-inject step adds failure surface to the most complex part of the committee skill."

- Pragmatist (blocking_risk): "Generator drift risk is real if the run-discipline slips — edits to the canonical source land on disk without regenerating agent files. Requires a conventional enforcement rule (e.g., in CLAUDE.md or a commit hook). Absent that rule, generator drift is as likely as the inline drift it replaces."

- Purist: "DTI's cost (recurring per-dispatch token overhead, caller complexity) buys zero freshness benefit for stable content. Generator materializes once; DTI reads on every dispatch for identical output. The generator wins on cost shape alone, not on a category-level rule."

- Purist (blocking_risk): "The case for DTI: 'stable-at-authoring' is an assumption; if canonical rules change frequently, generator-materialized files become stale between generator runs, and DTI would reflect the latest canonical text automatically. The generator-vs-DTI choice is only clearly right for the generator if there is a reliable trigger to regenerate agent files when canonical source files change."
