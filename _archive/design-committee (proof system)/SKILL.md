---
name: design-committee
description: Convene a six-role deliberation team for ad-hoc design consultations. Use whenever the designer wants independent multi-perspective review of a meta-architecture question, a cross-cutting design choice, a charter or boundary call, or any decision where framing bias is a real risk — even if they don't explicitly use the word "committee". Triggers on "convene the committee", "ask the committee", "committee deliberation", "four-pole review", "/design-committee", and any natural-language ask for a structured multi-perspective consultation on a design question.
version: v0003
---

# Design Committee

A skill for ad-hoc consultations where independent perspectives reduce framing bias. The
Committee is the four-pole Cartesian deliberation team — Conservator (S), Innovator (N),
Pragmatist (W), Purist (E) — plus two role-bounded support agents (Arbiter, Researcher),
with the calling agent acting as **team-lead** and the human as **designer**.

This skill is **flexible**, not rigid. Adapt the dispatch shape, round structure, and packet
detail to the question. The role charter and the Translation Gate are the hard parts; the
deliberation shape is yours to choose.

## When to Use

Convene the Committee when:

- A design choice has visible framing risk — different lenses would produce different
  framings, and you want all four surfaced before the designer adjudicates.
- A meta-architecture question spans subsystems and benefits from independent perspectives.
- A boundary or charter call is being made and the designer wants the cost of each
  candidate boundary articulated by a pole that genuinely defends it.
- The work needs research and/or proof-state operations alongside the four-pole debate,
  and you want those clearly separated from design opinion so the debate stays clean.

Do **not** convene the Committee when:

- The question is implementation-level and a single design pass settles it. Use
  `design-small-task` instead.
- A formal Understand-Stage / Solve-Stage pipeline is the right tool. Use
  `design-large-task` instead — its Step-B pole subagents are wired for that pipeline.
- The designer has already chosen and wants execution.

## The Six Roles

The Committee instantiates six roles. Four are dispatched subagents that produce design
opinion; two are dispatched support roles that produce no design opinion; two are
non-dispatched (team-lead is the calling agent, designer is the human).

**Dispatched opinion-bearing poles** — agents at `agents/design-committee-{pole}.md`:

- **Conservator (S)** — defends existing structure, stasis, and the framing that current
  patterns already handle. Lens: design history is signal until proven cost.
- **Innovator (N)** — pushes new framings and structural alternatives. Lens: existing
  structure is a choice that can be re-made.
- **Pragmatist (W)** — weighs operational cost against benefit; defends the simplest
  sufficient solution. Lens: shipping cost and runtime cost are first-class trade-offs.
- **Purist (E)** — tests category boundaries and compositional integrity. Lens: shapes
  must compose cleanly; ambiguous categories are the failure mode to watch.

**Dispatched support roles** — agents at `agents/design-committee-{role}.md`:

- **Arbiter** — proof-state custodian. Default-bound to the live design-proof-system
  code (engine + domain bridge at `skills/design-proof-system/references/`); custom
  instructions from the team-lead or the project CLAUDE.md may redirect the binding for
  a specific invocation. The sole role authorized to read or mutate proof state.
  Operates the actual engine and domain code — element CRUD via the bridge, verbatim
  retrieval from the FactStore, closure-gate checks via `presentClosingArgument`,
  friction detection via the bridge, counterfactual probes via snapshot-and-discard, and
  an audit trail of mutations. Never simulates semantics from prose. **Hard
  prohibitions:** no design opinion, no research, no admin file ops, no element
  proposals.
- **Researcher** — research and administrative tasks. Codebase research, prior-art
  research, industry research, document reading, file operations beyond proof state,
  multi-source consolidation. **Hard prohibitions:** no proof mutations, no design
  opinion.

**Non-dispatched roles:**

- **Team-lead** — the calling agent (the conversation's main thread). Dispatches,
  consolidates, produces the decision packet, holds the workflow thread. No design
  opinion of its own; no proof mutations.
- **Designer** — the human user. Adjudicates all decisions, sets meta-rules, authorizes
  charter changes. Never spawned as a subagent.

## Workflow

### 1. Capture the Question

Confirm with the designer what the Committee is being asked to deliberate. Get answers to
three things before convening:

- **The question** — what decision the Committee is producing input for. One sentence.
- **State source** — the Arbiter's default state source is the live design-proof-system
  code (engine + domain bridge at `skills/design-proof-system/references/`). You do not
  need to name a source for the default to apply. Capture an explicit source here only
  when one of these holds: the project's custom instructions (CLAUDE.md) name a
  different state source the Arbiter should use; the designer wants this specific
  invocation bound to a non-default source for a one-off reason; the default code is
  known to be unreachable from this project. In all other cases, leave this field at
  "default (design-proof-system)" and let the Arbiter resolve the path at convene time.
- **Round shape** — single-round (default) or multi-round. Single-round is request → all
  six reply → consolidation → designer. Multi-round (R1 proposals + cross-DM, R2 finals
  + per-pole positions, risk-weighted consolidation) is appropriate for charter calls and
  high-stakes structural choices; use it when the designer asks for it or when the
  question's stakes warrant the extra turn.

### 2. Convene the Team

The Committee runs as a named **agent team**, not as one-shot parallel `Task` dispatches.
Use `TeamCreate` to instantiate the six roles as a persistent team, then route work to
them via `SendMessage`. This is load-bearing for two reasons: peer-DM in multi-round
deliberation depends on team-membership routing, and the Arbiter's audit trail across
multiple operations within one invocation depends on a stable agent identity that
survives multiple messages. One-shot `Task` calls do not satisfy either requirement.

Create the team with all six members in one call:

- `chester:design-committee-conservator`
- `chester:design-committee-innovator`
- `chester:design-committee-pragmatist`
- `chester:design-committee-purist`
- `chester:design-committee-arbiter`
- `chester:design-committee-researcher`

Name the team `design-committee-<short-question-slug>` so `SendMessage` routing and
peer-DM are unambiguous. The slug is the team-lead's choice — keep it readable in plain
language (`design-committee-friction-disposition-fix`, not `design-committee-q1`).

The convening message sent to each team member carries:

- The captured question.
- The state-source name (if any) — only the Arbiter acts on this; the others ignore.
- Any context packets the designer has already produced (linked or quoted briefly).
- The round shape (single or multi).
- The names of the other team members (so peer-DM addressing is possible in multi-round).
- An explicit reminder that each agent self-enforces the Translation Gate.

### 3. Dispatch the Round

All round dispatch happens via `SendMessage` to team members, in parallel where the
round permits, sequentially where peer-DM ordering matters.

**Single-round (default).** Send the same question via `SendMessage` to all six team
members in parallel. Each replies with their phase-contract-shaped output (see each
agent file for the format). The four poles produce design opinion within their lens;
the Arbiter produces state-operation results (or a no-op confirmation); the Researcher
produces requested research with sources. No peer-DM in single-round.

**Multi-round.** Run R1 (proposals + cross-DM): the team-lead sends the R1 prompt to
all four poles in parallel via `SendMessage`. After R1 replies return, the team-lead
exposes peer proposals to each pole and authorizes cross-DM — each pole may then
`SendMessage` up to two challenges to other team members directly. After cross-DM
settles, the team-lead sends the R2 prompt to all four poles; each pole submits a
final position incorporating cross-DM critique. The Arbiter and the Researcher receive
`SendMessage` requests on demand throughout — proof-state probes for the Arbiter,
research asks for the Researcher; they are not on the debate clock and do not receive
the round prompts unless the team-lead explicitly routes one. The team-lead consolidates
at R2 close.

### 4. Consolidate

The team-lead reads all replies and produces a single consolidated **decision packet** for
the designer in the three-section format below. Risk-weight the recommendation when the
poles split — name the trade-off, do not hide it.

The packet is the team-lead's output, not a pole's. Mark every recommendation with
`Opinion:` (per C2 in `util-design-partner-role`). Mark every load-bearing premise
visibly (per C1). Apply the Translation Gate on the way out.

**Evidence-weighting during consolidation.** Two reply shapes tend to be load-bearing in
patterns worth naming:

- **When poles converge on one option and one pole offers a re-framing**, the Arbiter's
  counterfactual probe (against the bound state) is often the load-bearing evidence
  for whether the re-framing actually changes outcomes — cite the counterfactual in the
  recommendation. When the counterfactual confirms the existing-option fix clears the
  observed defect, the re-framing should be named as a follow-up brief candidate, not as
  a substitute for shipping.
- **When poles converge and there is no explicit prior authority for the convention they
  are defending**, the Researcher's absence-finding ("no prior brief explicitly chose
  this") is the warrant for following the convergence rather than treating it as
  un-checked. Cite the absence-finding in the recommendation. If the Researcher's search
  scope was narrow, mark the warrant as `Assumption:` rather than `Fact:`.

### 5. Present to Designer

Present the decision packet. The designer adjudicates. The team-lead does not adjudicate
on the designer's behalf, and does not collapse a split into a single recommendation when
the split is the real finding.

If the designer asks for another round (refined question, new constraints, different
state source), loop back to Step 1 with the updated inputs.

### 6. Tear Down

When the designer signals closure ("we're done", "decision made", "shelve this"), tear
down the team with `TeamDelete` on the named team. Teardown is mandatory — agent teams
persist until explicitly deleted, and a stranded Committee team leaks context across
unrelated future invocations.

The decision packet stays in the conversation record; the Arbiter's mutation log (if
any) stays in whatever state-source it was bound to. Both are independent of the team's
lifecycle.

## Decision Packet Format

The team-lead's designer-facing output uses three sections, in this order:

```
## Decision

<One paragraph: what the Committee is being asked to decide. The question, framed
in plain language. The designer-visible scope.>

## Analysis of Options

<For each candidate option, two-to-four sentences. Name the option by what it does
structurally (per option-naming rule in util-design-partner-role). Surface the pole
or poles that defended it, and the pole or poles that opposed it, in plain language.
Surface the load-bearing trade-off the option turns on. Mark opinions and assumptions.>

## Recommendation

<Opinion: the team-lead's risk-weighted recommendation, with the trade-off the
designer is taking on if they accept it. When the poles split irreducibly, name
the split as the finding and ask the designer which axis they're solving for —
do not paper over an honest disagreement.>
```

Section headings are exact. Two-sentence cap applies to each bullet within Analysis of
Options. Soft-wrap paragraphs in the terminal — no mid-sentence hard breaks.

## Translation Gate

Every subagent self-enforces the Translation Gate from `util-design-partner-role` (the
Interpreter Frame, read-aloud, option-naming, C1 externalized coverage, C2 fact-default
markers). The team-lead **re-checks** on consolidation — if any subagent reply leaked
internal-vocabulary tokens into something quoted to the designer, the team-lead clamps it
before sending.

When the Committee is bound to a structured state source, the forbidden internal-
vocabulary tokens are the IDs and state-machine vocabulary specific to that source — for
example, element IDs, rule IDs, dimension names, scoring fields. The team-lead applies a
mechanical regex pass at consolidation for tokens it can name, plus the read-aloud test
as the catch-all. The Arbiter always runs against a state source by default (the
design-proof-system code), so the structured-state branch is the live one unless custom
instructions override to a source with a different vocabulary.

## Scope of This Skill

**In scope.** The six-role setup, the single-round dispatch protocol, the consolidation
format, the Translation Gate at consolidation, the teardown.

**Out of scope for this version (deferred follow-ups).**

- **Multi-round protocol mechanics.** The skill names the shape (R1 + cross-DM, R2 +
  finals, risk-weighted consolidation) but the round-by-round transcript schema and the
  cross-DM authorization rules live in a follow-up brief.
- **Pole-only sub-invocations.** A designer asking for just-Conservator on a single
  choice is plausible; the skill does not yet expose `--pole=conservator`.

## Standalone Invocability

The skill has no entry condition. It does not require a sprint context, a master-plan
breadcrumb, or a config file. Convene from any context. The Arbiter operates the
design-proof-system code by default (resolving the path at convene time per its agent
file's binding precedence — custom instructions, repo-local, plugin cache); the other
roles do their work regardless of state-source status. If the design-proof-system code
cannot be reached and no custom-instructions override resolves to a reachable source,
the Arbiter stands down explicitly in its first reply and the other five roles still
convene and contribute — the Committee remains useful, just without proof-state
operations for that invocation.

## Why Parallel Pole Agent Files (Rather Than Reuse)

The existing Step-B pole agents (under `agents/design-large-task-step-b-*`) are wired to a
specific multi-round Understand-Stage discipline that prohibits solution-space discussion.
Committee work needs solution-space discussion. Surgery on those files to make them
dual-mode would entangle two phase contracts in one file. The cheaper, safer move is to
parallel them: new files at `agents/design-committee-{pole}.md` import the same stance
principles and voice discipline from `util-design-partner-role` (so the lens stays
identical) and declare a Committee-specific phase contract. The Step-B files remain
untouched and continue to function inside their own skill.

## Reading Order for the Team-Lead

When invoked, read in this order before convening:

1. This SKILL.md (you're here).
2. `skills/util-design-partner-role/SKILL.md` — voice discipline and stance principles.
3. Each `agents/design-committee-*.md` you intend to convene — so you know what each
   role's phase contract looks like and can craft the convening and round messages
   accordingly.

`skills/util-dispatch/SKILL.md` describes one-shot `Task` parallel dispatch and is *not*
the orchestration pattern for this skill — the Committee runs as a `TeamCreate`-named
persistent team with `SendMessage` routing. Read util-dispatch only if you want general
background on isolated-context dispatching; do not apply its `Task`-based recipe to the
Committee.
