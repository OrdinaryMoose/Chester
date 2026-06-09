# Innovator — transcript (verbatim, abridged) — round01
# Stance: Dispatch-time injection as unifying primitive; treat shared instruction as payload not reference

## Position

### The structural signal the researcher handed us

CWD for Teams subagents = user's project root in production. Every agent file that says "read `skills/util-design-partner-role/SKILL.md`" or `references/member-protocol.md` is citing a path that resolves in dev and breaks silently in production. The existing runtime-read pattern (util-design-partner-role canonical home, Stance Principles reference in the four member agents) is already production-broken. This is not an edge case — it is the current deployed state for marketplace users.

That finding eliminates runtime-read as a primary delivery mechanism for Teams subagents. It doesn't eliminate runtime-read for skills (inline skills run in the parent session, CWD = the project being worked on, no plugin path involved). Different consumer kinds get different verdicts.

### The frame I want to put on the table

Current architecture treats instruction text as files that agents reference. The innovator reframe: treat instruction text as payload that dispatch injects. The primitive shifts from "tell the agent where to read" to "include the text in what you send the agent."

Call this **Dispatch-Time Injection (DTI)**. The team-lead (or skill) that creates the committee round is the injection point. Before sending the `TeamCreate` / `SendMessage` call, it assembles the payload: it reads the canonical source files, extracts the relevant sections, and includes the text verbatim in the agent's system prompt or the dispatch message. The agent arrives with the instruction already present — no read required, no path resolution, no CWD dependency.

This is structurally different from build-time generation (which materializes copies to disk in advance) and from runtime-read (which defers to the agent). DTI materializes at invocation time in memory, not at build time on disk.

### Why this is the right shape for the production failure

Production failure is: agent gets dispatched, tries to resolve `skills/util-design-partner-role/SKILL.md` from CWD = user's project root, fails, silently proceeds without the Stance Principles it needs, drifts on voice discipline. DTI eliminates this failure mode at its root: the text is in the prompt before the agent starts. No filesystem dependency.

### Which consumer kinds DTI fits

- **Teams subagents (committee members):** DTI is the correct mechanism. The dispatch payload (the `TeamCreate` call or the initial `SendMessage`) carries the shared instruction bands verbatim. The agent files hold only the lens-specific, per-member text that cannot be shared.
- **Named Task subagents (execute-write reviewers, plan-build reviewers):** Same argument. They are dispatched with a prompt. Shared reviewer disciplines (evidence-citation rule, confidence ladder, independence rule) can be injected at dispatch rather than restated inline. The dispatch caller reads the canonical source and injects.
- **Inline skills (design-small-task):** DTI is irrelevant — the skill is the prompt; it runs in the parent session's context. The correct mechanism here is accept-inline (shared text lives in the skill body), but the canonical source for that text should be a single authoritative file that a build-step or linter checks against. Not runtime-read during the session — that is weak direction. Build-time assertion: the skill body contains the authoritative text verbatim, and a generator/linter can verify it.
- **Runtime-read skills (plan-attack, plan-smell, util-codereview, team-lead):** These run in the parent session with a stable CWD. Runtime-read is viable here and is the correct mechanism — telling the skill "read `skills/util-design-partner-role/SKILL.md` before acting" works. But the path cited must be the CWD-relative one that actually resolves, and this mechanism only works for the parent-session context, not subagent dispatches.
- **CLAUDE.md:** Two-tier canonical-plus-pointer. Auto-loaded; instruction is already present at session start. No runtime-read needed. Deduplication for CLAUDE.md rules = pick one canonical copy, make the other a pointer.

### The instruction-registry question

DTI requires a source to inject from. The innovator position on the source structure: one directory, `skills/shared-instructions/`, containing named section files — each one a standalone markdown snippet that any dispatch caller can read and inject. The section files are the canonical home; the agent files and skill bodies become either the injected payload (for subagents) or verified copies (for inline skills with a build assertion).

Concrete layout example:
```
skills/shared-instructions/
  stance-principles.md
  translation-gate.md
  pm-litmus.md
  research-boundary.md
  evidence-citation-rule.md
  confidence-ladder.md
  independence-rule.md
  member-scaffold-shared.md
```

This is not a new concept — it is a reframe of what `util-design-partner-role` was supposed to be but only partially became. The innovator position: don't fix `util-design-partner-role` incrementally; reframe it as an injection registry explicitly designed to be read by dispatch callers, not by subagents.

### What changes structurally for committee member agents

Currently: 103-line files, ~70% identical scaffold, agents told "read `skills/util-design-partner-role/SKILL.md`" (broken in production).

DTI reframe: agent files carry only lens-specific text. Shared bands (Phase Contract, Hard Prohibitions, Voice Discipline meta-rules, Output Format template, Translation Gate) are injected by the team-lead at dispatch. The four member agent files shrink to ~30-35 lines of lens-specific content. The team-lead's dispatch step reads the shared-instructions registry and assembles the full system prompt before the `TeamCreate` call.

This is the structural re-make the innovator lens presses for: the scaffold isn't a property of agent files — it is a property of the dispatch operation.

### Stance Principles lens adjustments

The four members today: "Apply canonical Stance Principles from `skills/util-design-partner-role/SKILL.md` while playing Innovator lens" — then restate five principles with lens-specific modifications. This pattern acknowledges a canonical source but then re-derives inline because the agent can't reliably read the source (production-broken). The DTI fix: inject canonical Stance Principles at dispatch, with the lens-specific overrides appended inline in the agent file. The agent file stops citing the canonical path; the dispatch caller reads it and sends it.

### FD-03 (skill catalog) — build-time generator is the correct mechanism

Skill catalog duplication (skill-index vs frontmatter) is a different problem from shared instruction text. The fix here is a build-time generator that reads frontmatter and writes skill-index.md. Runtime-read doesn't apply (CLAUDE.md and skill index are both loaded at session start, not read during action). Accept-inline with manual sync is the current broken state. Generator creates the index from the authoritative source (frontmatter) and catches phantom pointers automatically.

### FD-04 (CLAUDE.md rules) — single-canonical with pointer

Version-bump rule and description-sync rule: root CLAUDE.md is the canonical home (it is the more complete form, contains the carve-out). skills/CLAUDE.md becomes a one-line pointer: "See root CLAUDE.md § [section] for canonical rule." Two CLAUDE.md files both pointing at the wrong file for the sync rule: fix the pointer target (skills/setup-start/references/skill-index.md, not setup-start/SKILL.md).

### Trade-offs DTI carries

- Dispatch caller complexity: the team-lead or dispatch skill must now read the instruction registry before sending. This is one extra step per dispatch, but it is a cheap read.
- Test surface shifts: instead of testing whether agents read files correctly, you test whether dispatch callers inject the right sections. Better surface — dispatch callers are skills (parent-session, stable CWD, testable).
- Agent files lose self-containment: a lone agent file out of context does not carry the full instruction set. This is acceptable because agent files are never invoked in isolation — they are always dispatched by a parent skill.
- The injection-registry must stay authoritative: if callers read different sections of it differently, drift reappears. Mitigation: section files are standalone, named exactly, and dispatch callers reference by exact section filename.

### Option names (structural)

- **Option A: Dispatch-Time Injection (DTI)** — shared instruction text lives in a named injection registry; dispatch callers read and inject at invocation time. Agents hold lens-specific text only. Production-safe. Dispatch caller carries the composition responsibility.
- **Option B: Build-Time Materialization (BTM)** — a generator materializes shared text into each agent file and skill body. On-disk duplication, generator-managed. Strong direction (text is already in the file). Build step required.
- **Option C: Runtime-Read (RR)** — agents instructed to read canonical files as first action. DRY but production-fragile for Teams/Task subagents (CWD mismatch). Viable only for parent-session skills.
- **Option D: Accept-Inline** — text is inline in each consumer, manually synced. Maximum direction strength; drift under manual management. Current broken state.

Innovator position: **Option A (DTI) for Teams/Task subagents; Option C (RR) for parent-session skills; Option B (BTM) generator for skill catalog (FD-03 only); Option D (accept-inline) eliminated for anything with production subagent dispatch.**

## Follow-ups

### R2 clarification — named Task subagents position

The R1 text said "DTI for named Task subagents" in the position text but the alignment count binned me under generator. That ambiguity is real and I caused it. Here is the precise R2 position:

**Named Task subagents** (execute-write-spec-reviewer, execute-write-quality-reviewer, plan-build-plan-attacker, plan-build-plan-smeller, plan-build-plan-reviewer): their `.md` file IS their system prompt. The only way to get shared instruction text into them is either (a) bake it into the file before dispatch, or (b) have the dispatch caller inject it into the message payload at dispatch. Option (a) = generator. Option (b) = DTI. Both put the text in the prompt at load; they differ on whether the canonical copy materializes on disk (generator) or in memory at invocation time (DTI).

**Innovator R2 position on named Task subagents: build-time generator.** Rationale: for named Task subagents, the agent file IS the entire prompt — there is no separate dispatch message body to inject into the way there is with a `SendMessage` to a Teams subagent. The generator writes the shared bands into each agent file from the canonical source. Self-contained files on disk; the generator is the single sync mechanism. DTI via a parent-skill wrapper is structurally possible but adds a layer that does not buy anything over the generator for this consumer kind.

**Teams subagents** (committee advocacy members): DTI remains the position. The dispatch caller sends the `TeamCreate` prompt and the initial `SendMessage` — there is a genuine injection point in the dispatch payload. Agent files shrink to lens-specific content; shared scaffold arrives in the message, not on disk.

### Peer DM to pragmatist — cost objection response

innovator→pragmatist: Per-dispatch token cost for Teams subagents (DTI) = shared scaffold text size × number of committee dispatches per sprint. Current shared scaffold ~70 lines × 4 members × ~N sprints. Generator eliminates recurring cost by baking into file. DTI's counter: committee runs are low-frequency; token cost per sprint small. Generator's counter-counter: agent file on disk = self-documenting, debuggable without running a parent skill. Pragmatist wins on named Task subagents (generator); innovator concedes. Teams subagents: DTI wins on structure — dispatch message IS the invocation unit; baking shared text there cleaner than generating 103-line files where 70 lines are scaffold.

### Peer DM to pragmatist — follow-up

Teams subagent invocation shape differs from Task subagent. Task subagent = file-is-prompt (generator fits). Teams subagent = TeamCreate + SendMessage (dispatch message has injection point, can carry session-specific context that a static generated file cannot). Forcing generator onto Teams produces files less useful as standalone prompts. Different shape = different mechanism is the principled call.

## Final Position

position: "DTI for Teams subagents; build-time generator for named Task subagents; runtime-read for parent-session skills; build-time generator scoped to skill-catalog (FD-03); two-tier pointer for CLAUDE.md rules (FD-04)"

rationale: "Named Task subagents: file IS prompt; generator is the correct mechanism — bakes shared bands from canonical source into each agent file, file stays self-contained, no dispatch-caller complexity, no per-invocation token cost. Innovator concedes named Task subagents to Pragmatist/Purist on this basis. Teams subagents: dispatch message IS the invocation unit (TeamCreate + initial SendMessage carries the payload). DTI fits the shape — dispatch caller reads injection registry, bakes shared scaffold into the dispatch message, agent file holds lens-specific content only. DTI per-dispatch cost is the trade-off; committee dispatches are low-frequency enough that cost is acceptable and the structural clarity is load-bearing. The 70%-identical member scaffold is a property of the dispatch operation, not of the file — this framing survives R2 for Teams subagents. Named Task subagents have no equivalent dispatch message to inject into; generator is the correct mechanism for them."

blocking_risk: "If Teams and Task subagents are ruled structurally equivalent for this purpose (file-is-prompt in both, since TeamCreate takes a file path), then generator for both is the safe, consistent choice. It eliminates DTI's per-dispatch cost and gives self-contained files across both consumer kinds at the cost of a build step. Innovator holds DTI for Teams as the structurally cleaner option but does not block if the team judges the consistency argument for generator-everywhere-on-agents as more important than the dispatch-shape distinction."
