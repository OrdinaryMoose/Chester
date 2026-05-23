---
name: design-committee
description: Convene six-role committee (team-lead + 4 poles + researcher) for ad-hoc design consultations. Process-agnostic primitive. Use whenever designer wants independent multi-perspective review of meta-architecture, cross-cutting design choice, charter call, or any decision where framing bias risks outcome. Triggers on "convene the committee", "ask the committee", "committee deliberation", "four-pole review", "/design-committee", and natural-language asks for structured multi-perspective consultation.
version: v0004
---

# Design Committee

Six-role deliberation primitive. Process-agnostic. **Flexible** skill — adapt round shape and dispatch to question.

## When To Use

Convene when:

- Framing-risk visible. Different lenses produce different framings.
- Meta-architecture question spans subsystems.
- Charter or boundary call. Each candidate needs pole genuinely advocating it.
- Work needs research alongside debate. Clean separation keeps debate clean.

Do NOT convene when:

- Implementation-level. Use `design-small-task`.
- Formal Understand-Stage / Solve-Stage pipeline fits. Use `design-large-task`.
- Designer already chose. Want execution.

## Contract Floor (DELETION-PROTECTED)

### Positive Contract — Primitive Promises

- Four poles with named lenses: Conservator, Innovator, Pragmatist, Purist.
- Researcher support role.
- Translation Gate at consolidation, enforced by team-lead reading aloud.
- Decision packet to designer.
- Output-format field labels as defined in each pole's agent file. Fixed contract.

### Negative Contract — Primitive Does NOT Promise

- Round schema or sequence beyond convening-message instructions.
- Session lifecycle (open/anchored/closed phases).
- Gate logic or closure-gate evaluation.
- Clerk role, schema enforcement, structural-negation matching.
- Locked output structure beyond primitive's base field labels.
- Artifact persistence, working-record format, sprint traceability.
- Decision procedure downstream of deliberation.

Wrapping skills MUST supply anything not promised here.

### Floor-Not-Ceiling Rule

Wrapping skills MAY add steps, fields, gates, roles via convening message.

Wrapping skills MAY NOT weaken or substitute any step this file names — including Translation Gate.

Edit test: "True for Mode A call with no wrapping skill?" If no, belongs in wrapping skill's docs, not this file.

### Three Forbidden Attach Surfaces

Sprint-specific overlay NEVER attaches to:

1. **Agent files** (`skills/design-committee/agents/*.md`). Edits persist invisibly across invocations. Drift accumulates silently. Agent files carry lens, voice, phase contract only. No sprint refs, no schemas, no product names, no gating conditions.
2. **This SKILL.md.** Persistent floor document. Contamination = most durable category drift. Audits compare against this file; corrupted floor breaks the audit.
3. **Output-format field labels.** Interface between deliberation and external readers. Wrapping skills MAY append fields; MAY NOT redefine existing label meaning. Redefinition makes output illegible outside wrapping context.

### Mode Distinguishability

Observable: convening message.

- Mode B (skill-wrapped) — message names wrapping skill, sprint, locked schema, Clerk, or gate.
- Mode A (general) — message contains none of these.

Reader checks convening message in conversation record. No file inspection needed.

### Convening Message = Only Legitimate Attach Point

"Convening message" = full instruction payload team-lead composes before `SendMessage` to each role at team instantiation. Not just human-visible question.

Sprint overlay rides here. Ephemeral. Leaves no residue when session ends.

## Six Roles

### Team-Lead (calling agent)

Dispatches, receives, compiles. No design opinion. NOT relay during deliberation — peers DM peers direct. Holds workflow thread. No proof mutations.

### Conservator (S)

`chester:design-committee-conservator`. Lens: defends existing structure, stasis, framing that current patterns handle. Design history is signal until proven cost.

### Innovator (N)

`chester:design-committee-innovator`. Lens: pushes new framings, structural alternatives. Existing structure = choice that can be re-made.

### Pragmatist (W)

`chester:design-committee-pragmatist`. Lens: weighs operational cost vs benefit. Defends simplest sufficient solution. Shipping cost + runtime cost = first-class trade-offs.

### Purist (E)

`chester:design-committee-purist`. Lens: tests category boundaries, compositional integrity. Ambiguous categories = failure mode to watch.

### Researcher

`chester:design-committee-researcher`. Tools: Read, Glob, Grep, Bash, WebSearch, WebFetch.

Owns: codebase research, prior-art research, industry research, document reading, multi-source consolidation, absence findings.

Hard prohibitions: No design opinion. No proof-state operations. **No file writes outside conversation record — findings as message output only.**

### Designer (human, non-dispatched)

Adjudicates all decisions. Sets meta-rules. Authorizes charter changes. Never spawned as subagent.

## Translation Gate

Self-enforced by every subagent. Team-lead re-checks at consolidation. Apply before any output reaches designer.

Rules:

- **Read-aloud test.** Cannot say sentence aloud over coffee → rewrite. Catches code vocabulary, file paths, dot-separated identifiers, type-theory jargon in designer-visible output.
- **Option-naming rule.** Name options by what they do structurally, not by type they introduce.
- **C1 (Externalized Coverage).** Load-bearing premise must be visible in output before counting toward shared understanding.
- **C2 (Fact Default with Marked Departures).** Default voice = verified fact. Mark `Assumption:` for hypotheses without evidence. Mark `Opinion:` for stance-driven claims. Recommendations are always opinions.

Full voice spec: `skills/util-design-partner-role/SKILL.md`. **LOAD-BEARING citation. Deletion-protected.** Touch util-design-partner-role → audit committee impact. Drop citation only with explicit justification, never as simplification.

## Peer-DM Protocol

Poles message each other direct via `SendMessage`. No team-lead routing during deliberation.

- Team-lead creates team (`TeamCreate`), authorizes peer-DM scope in convening message.
- Team-lead compiles at end. NOT switchboard.
- Peer-DM ordering = relative to dispatch reception, not absolute time. Pole receiving dispatch late not penalized by earlier-arriving peer DM.

## One-Round-Format

Canonical general-committee deliberation shape. Available to any wrapping skill via reference.

Protocol:

1. Each pole writes position covering dispatched questions.
2. Each pole sends 1 question direct-DM via `SendMessage` to chosen peer (any pole or researcher).
3. Each pole answers any incoming questions — 1 response per asker, direct-DM back.
4. Each pole submits final position to team-lead. Position MAY be revised in light of Q+A, or sent as-is.

No team-lead relay during steps 2–3. Each Q+A private between asker and target. No visibility-to-all constraint.

Target receiving 2+ incoming questions sends separate response per asker.

## Workflow

### Step 1 — Capture Question

- Question (one sentence).
- Round shape. Default: one-round-format. Custom: state shape in convening message.

### Step 2 — Convene Team

`TeamCreate` with five members:

```
chester:design-committee-conservator
chester:design-committee-innovator
chester:design-committee-pragmatist
chester:design-committee-purist
chester:design-committee-researcher
```

Team slug: `design-committee-<question-slug>` for routing legibility.

Convening message carries:

- Captured question.
- Context packets (linked or quoted briefly).
- Round shape.
- Other team-member names (for peer DM).
- Translation Gate self-enforcement reminder.

### Step 3 — Dispatch

Send topic to 4 poles in parallel via `SendMessage`. Researcher on demand — not on deliberation clock unless team-lead routes.

Pole replies follow phase contract from agent file.

### Step 4 — Consolidate

Team-lead reads all replies. Produces three-section decision packet (format below).

Mark every recommendation `Opinion:` (C2). Mark load-bearing premise visibly (C1). Apply Translation Gate before sending.

### Step 5 — Present to Designer

Designer adjudicates. Team-lead does NOT adjudicate for designer. Does NOT collapse split into single recommendation when split is the finding.

Designer asks another round → loop Step 1 with updated inputs.

### Step 6 — Tear Down

`TeamDelete` on designer closure signal ("we're done", "decision made", "shelve this"). MANDATORY. Teams persist until explicitly deleted. Stranded teams leak context across unrelated future invocations.

Decision packet stays in conversation record. Independent of team lifecycle.

## Decision Packet Format

Three sections, exact headings, in order:

```
## Decision

<One paragraph. What committee being asked to decide. Designer-visible scope.>

## Analysis of Options

<For each candidate option: 2–4 sentences. Name option structurally (what it does, not what type it is). Surface defending pole(s), opposing pole(s). Surface load-bearing trade-off. Mark opinions and assumptions.>

## Recommendation

<Opinion: team-lead's risk-weighted recommendation + trade-off designer accepts. Poles split irreducibly → name split as finding. Ask designer which axis they solve for. Do NOT paper over honest disagreement.>
```

Two-sentence cap per Analysis bullet. Soft-wrap paragraphs.

## Scope of This Skill

**In scope.** Six-role setup. One-round-format. Convening-message dispatch. Consolidation. Translation Gate at consolidation. Teardown.

**Out of scope (deferred follow-ups):**

- Multi-round protocol round-by-round transcript schema.
- Pole-only sub-invocations (e.g., `--pole=conservator`).
- Mechanical enforcement of three forbidden surfaces (pre-commit hooks, CI checks).

## Standalone Invocability

No entry condition. No sprint context required. No config required. Convene from any context. Other Chester skills can wrap committee calls (Mode B) without inheriting sprint state from this skill.

## Reading Order (Team-Lead)

Before convening:

1. This SKILL.md.
2. `skills/util-design-partner-role/SKILL.md` — voice discipline. **Load-bearing reference.**
3. Each `skills/design-committee/agents/design-committee-*.md` for poles + researcher you intend to convene — phase contract and output format.

`skills/util-dispatch/SKILL.md` describes one-shot `Task` parallel dispatch. NOT orchestration pattern for this skill. Committee runs as `TeamCreate`-named persistent team with `SendMessage` routing.

## Why Parallel Pole Agent Files

Step-B pole agents (`agents/design-large-task-step-b-*`) wired to multi-round Understand-Stage discipline prohibiting solution-space discussion. Committee work needs solution-space discussion. Surgery on Step-B files to make dual-mode would entangle two phase contracts in one file.

Solution: parallel agent files at `skills/design-committee/agents/design-committee-{pole}.md` import stance principles and voice from `util-design-partner-role` (same lens) and declare committee-specific phase contract. Step-B files untouched, continue working in own skill.
