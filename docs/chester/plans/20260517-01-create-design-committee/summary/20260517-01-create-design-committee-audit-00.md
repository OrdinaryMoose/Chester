# Reasoning Audit: Add design-committee Skill — Six-Role Deliberation Team

**Date:** 2026-05-17
**Session:** `00`
**Plan:** *(none — skill-creator path, no plan-build artifact)*

## Executive Summary

The session implemented the `design-committee` Chester skill from a pre-written
feature-definition brief, producing one SKILL.md and six agent files. The most
consequential decision was to parallel the four existing Step-B pole agents into
new Committee-mode agent files rather than refactor the existing files to be
dual-mode — that move preserved `design-large-task` Step-B unchanged and let the
Committee phase contract land cleanly. The session stayed on the brief's scope:
no surgery on existing agents, the Arbiter bound to the in-repo proof system
named in the brief, and the inline rehearsal against a real stress-test finding
both validated the workflow and produced two small spec revisions before commit.

## Plan Development

No plan was developed. The feature-definition brief at
`docs/feature-definition/Pending/design-committee-00.md` was unusually complete
— it carried the skill identity, the six-role charter, the agent-file inventory,
governing constraints, and acceptance criteria — so the session bypassed
plan-build entirely and dispatched the work via `skill-creator` after resolving
three open scope questions with the designer. The rehearsal step that normally
sits inside plan-build's threat-report phase was replaced by an inline rehearsal
against a real proof-system stress-test finding once the files were drafted.

## Decision Log

### Parallel agent files versus dual-mode refactor

**Context:**
The four existing Step-B pole agents (`agents/design-large-task-step-b-{conservator,
innovator,pragmatist,purist}.md`) carry the same stance principles the Committee
needs but are hard-wired to the Understand-Stage phase contract. The brief
flagged this as a constraint: reuse only if a clean separation is possible.

**Information used:**
- The Step-B agent files (sampled the Conservator as representative)
- The brief's "Reuse … if and only if their phase contract can be cleanly
  separated" governing constraint
- `skills/util-design-partner-role/SKILL.md` as the single source of voice and
  stance rules that both modes import

**Alternatives considered:**
- `Refactor the four Step-B agents to be dual-mode (Understand-Stage and
  Committee)` — rejected because entangling two phase contracts in one file
  risks regressions in `design-large-task` Step-B.
- `Parallel the four poles with new Committee-mode agent files that import
  the same stance/voice surface and replace the phase contract` — chosen.

**Decision:** Create four new files at `agents/design-committee-{pole}.md` that
import stance principles and voice discipline from `util-design-partner-role`
and declare a Committee-mode phase contract; leave the Step-B files untouched.

**Rationale:** The lens position (S/N/W/E) is identical across modes, so the
imported surface is reusable verbatim. The phase contracts differ enough — rounds
versus request/reply, hard prohibitions on solution-space versus solution-space
required — that dual-mode wiring would force conditional branches in every
agent. Paralleling the files keeps each file single-purpose, leaves the battle-
tested Step-B path untouched, and pays only the cost of four new files that
share a tight template.

**Confidence:** High — explicit in the brief's governing constraints and
reinforced by the assistant's drafting narration.

---

### Arbiter binding to design-proof-system specifically

**Context:**
The brief flagged "How does the Arbiter bind to a proof-MCP server?" as the
cleanest open hard-decision; the session needed to resolve it before drafting
the Arbiter agent file. The repository has a hard system-boundary rule
forbidding cross-reference between two parallel proof systems.

**Information used:**
- The brief's Open Concerns section (Arbiter binding flagged as load-bearing
  for the agent file)
- Root `CLAUDE.md` system-boundary rule
- The state of `skills/design-proof-system/` (engine + domain JavaScript with
  no live SKILL.md yet — runtime that the active master plan is redesigning)

**Alternatives considered:**
- `Pre-wire Arbiter to a specific MCP server` — rejected because the in-repo
  proof system has no live runtime to wire to.
- `Describe Arbiter's contract fully abstractly (any structured state the
  team-lead names per invocation)` — rejected as proposed; the designer wanted
  a named system in scope.
- `Bind Arbiter to design-proof-system in this sub-sprint, with abstract
  contract so the agent file works against live, spec-only, or other state
  sources per invocation` — chosen.

**Decision:** Arbiter binds to `design-proof-system` for this sub-sprint; agent
file describes its contract abstractly so it can operate against a live
instance, a spec-only simulation, or any other structured state.

**Rationale:** The designer answered "(c) arbiter will interface with the
design-proof-system not the proof-mcp." The hard system-boundary rule then
forced the rest of the session to avoid all reference to the other system —
the design brief copied into `design/` was rewritten as a short sprint pointer
rather than verbatim, specifically because the source brief mentions the other
system and a verbatim copy would land that mention in a sprint artifact.

**Confidence:** High — designer choice was explicit; downstream consequences
visible in the artifact rewrite.

---

### Skip skill-creator's quantitative eval loop

**Context:**
The standard `skill-creator` workflow runs a test-subagent benchmark on assertion-
checkable outputs. The Committee skill orchestrates six subagents and produces
qualitative deliberation transcripts and decision packets.

**Information used:**
- `skill-creator` standard workflow
- The brief's acceptance criteria (charter fidelity + one live consultation)
- Nature of the deliverable (qualitative deliberation output, not
  assertion-checkable)

**Alternatives considered:**
- `Run the standard quantitative eval loop on test prompts` — rejected because
  nested-orchestration complexity (test-subagent invoking a skill that spawns
  six more subagents) plus qualitative output makes assertion-checking
  unreliable.
- `Skip the eval loop; validate via code-level review of SKILL.md + agent
  files plus one live consultation` — chosen.

**Decision:** Skip skill-creator's eval phase; validate by code-level review
of the artifacts plus a live consultation against a real question.

**Rationale:** The skill's correctness lives in role-charter fidelity and
voice discipline, both of which a benchmark cannot evaluate meaningfully. The
session captured this as a sprint-scope decision in the design brief and
documented it as deferred to a follow-up if a different validation form is
needed later.

**Confidence:** High — assistant raised the question explicitly with rationale;
designer confirmed.

---

### Inline rehearsal instead of live dispatch

**Context:**
After the files were drafted, validation against a real consultation was the
named acceptance step. New subagent types do not load from disk — they load at
plugin reload. Pre-commit, the agents could not be dispatched live.

**Information used:**
- Claude Code's plugin-load behavior (agent files load at reload, not from
  disk-state)
- The calculator stress-test simulation report in the gitignored working area,
  carrying Finding #1: a closure-blocking divergence between the manage-
  friction translator's write target and the closure rule's read target

**Alternatives considered:**
- `Wait until after merge and reload, then run a live Committee consultation` —
  rejected as the validation feedback comes too late; spec revisions after a
  live dispatch would be follow-up commits rather than part of the same change.
- `Skip rehearsal; trust the static review and ship` — rejected because the
  brief explicitly named a live consultation as the alternative-to-eval-loop
  validation, and an inline rehearsal captures most of that signal.
- `Play each role inline in the conversation from each agent file's output
  format, then consolidate` — chosen.

**Decision:** Rehearse the Committee inline against calculator stress-test
Finding #1, playing each of the six roles from their agent-file output formats,
then run the team-lead consolidation step.

**Rationale:** The inline play validates the agent-file specs as instructions
while edits remain cheap. The chosen exemplar is a real structural choice with
genuine framing tension across all four pole lenses, named candidate options,
and live proof-system state for the Arbiter to bind to — close to a worst-case
for an artificial test prompt and ideal for validation.

**Confidence:** High — rationale stated explicitly in the rehearsal-opening
insight block.

---

### Promote rehearsal-surfaced patterns to contracted fields

**Context:**
The inline rehearsal produced a clean decision packet whose recommendation
leaned on two specific evidence shapes: the Arbiter's counterfactual probe
(load-bearing against the Innovator's re-framing) and the Researcher's "no
prior brief explicitly chose this convention" finding (load-bearing as warrant
when poles converged on an undocumented convention). The Researcher's agent
file treated absence-of-prior-art as something to surface in passing; the
SKILL.md consolidation step did not name evidence-weighting patterns at all.

**Information used:**
- The rehearsal's structure — specifically how the Recommendation prose
  invoked the absence finding and the counterfactual probe
- The drafted Researcher agent file (prior-art output shape)
- The drafted SKILL.md Step 4 (Consolidate)

**Alternatives considered:**
- `Leave the spec alone and trust the team-lead to notice the patterns on
  each invocation` — rejected because future team-leads scan for labels, not
  for prose hints.
- `Add prose paragraphs describing the patterns in passing` — rejected for
  the same scan-for-labels reason.
- `Promote each pattern to a named, contracted field in the relevant spec` —
  chosen.

**Decision:** Add "Absence findings" as a first-class Researcher responsibility
with explicit "Absences worth naming" and "Search scope" output fields;
add an "Evidence-weighting during consolidation" subsection to SKILL.md Step 4
naming both patterns by shape.

**Rationale:** When a rehearsal exposes that some category of evidence does
most of the recommendation's weight, the cheapest spec response is a named
field, not new prose. Two fields beat two paragraphs because the agent reading
the spec next time scans for the labels. The pattern itself ("rehearse, name
the load-bearing reply shape the format failed to make explicit, promote it to
a contracted field") is recorded in the session summary as the cheap-revision
recipe for future Committee tuning.

**Confidence:** High — explicit insight block and assistant narration named
the pattern.

---

### Top-level sprint placement despite active master plan

**Context:**
Master Plan Mode was active (`docs/chester/working/.active-master` pointed at
`20260511-01-mp-redesign-proof-system`). The Mode's overlay rule forbids new
top-level sprint dirs while the breadcrumb is present. The Committee skill is
not part of the proof-system redesign master plan.

**Information used:**
- `.active-master` breadcrumb content
- The brief's scope (deliberation-team infrastructure, distinct from proof-
  system redesign)
- Master Plan Mode's "sub-sprint dirs nest under `working/<master-sprint>/`"
  convention

**Alternatives considered:**
- `Nest as a sub-sprint inside the master plan` — rejected because it
  logically misplaces Committee work under the proof-system redesign umbrella
  and would pollute the master archive with unrelated material.
- `Clear the breadcrumb temporarily, create the sprint top-level, restore the
  breadcrumb` — rejected as flicker-prone; the breadcrumb is meant to track
  the active master, not to be toggled per unrelated session.
- `Create the sprint top-level with the breadcrumb left in place; treat the
  session as outside-master scope` — chosen.

**Decision:** Create `docs/chester/working/20260517-01-create-design-committee/`
as a top-level sprint dir; leave the `.active-master` breadcrumb untouched.

**Rationale:** The honest placement of the work is outside the master plan.
Keeping the breadcrumb intact means that if/when the session returns to
proof-system master work, the pointer is still good. The session accepts a
temporary departure from the "no top-level dirs while breadcrumb present" rule
in exchange for not pretending the Committee skill is part of the master plan.

**Confidence:** High — assistant raised this as the first decision, designer
chose option (a).

---

### Sprint design artifact as pointer, not verbatim copy

**Context:**
After drafting SKILL.md and the six agent files, the sprint's `design/`
directory needed a design artifact. The natural source was the pre-existing
feature-definition brief. The brief contains references to the other proof
system (it was written before this sprint's scope decision). The hard system-
boundary rule forbids cross-system references in any sprint artifact.

**Information used:**
- Source brief at `docs/feature-definition/Pending/design-committee-00.md`
- Root `CLAUDE.md` system-boundary rule
- The sprint's resolved scope decisions (Arbiter binding, eval-loop skip,
  registration target)

**Alternatives considered:**
- `Copy the feature-definition brief verbatim into design/` — rejected because
  it would land cross-system references into a sprint artifact, violating the
  hard rule.
- `Surgically edit a copy to remove cross-system references` — rejected as
  surgery on a brief that lives elsewhere; the source is authoritative and
  should stay where it is.
- `Write a short sprint-pointer that references the source brief and records
  the scope decisions made in this conversation` — chosen.

**Decision:** Write `design/20260517-01-create-design-committee-design-00.md`
as a short pointer doc that names the source brief as design authority and
records this sprint's delta (Arbiter binding, eval-loop skip, registration
target, Translation Gate enforcement choice).

**Rationale:** The pointer approach keeps the source brief in place where it
is, records what this sprint actually decided, and respects the boundary
cleanly. Anyone walking the sprint artifacts later sees both the design
authority (the source brief) and the sprint-specific delta (the pointer) in
their right places.

**Confidence:** High — explicit insight block named the trade-off and the
chosen path.

---

### Single-round dispatch as the minimum viable Committee shape

**Context:**
The brief flagged multi-round protocol mechanics (R1 + cross-DM, R2 + finals,
risk-weighted consolidation) as out-of-scope. SKILL.md needed to name a
dispatch shape that worked end-to-end without depending on those mechanics.

**Information used:**
- Brief's "Skill responsibilities (setup-only scope)" — at minimum, single-
  round dispatch with `SendMessage`
- `feedback_two_round_deliberation_protocol.md` (in memory, not yet a
  contracted protocol)
- `skills/util-dispatch/SKILL.md` parallel-dispatch pattern

**Alternatives considered:**
- `Specify the full two-round protocol now` — rejected per brief scope; the
  mechanics are not yet contracted.
- `Specify no dispatch shape and leave it to the team-lead per invocation` —
  rejected because the skill needs at least one workable path end-to-end.
- `Specify single-round dispatch as the minimum viable shape; name the two-
  round shape as a known follow-up` — chosen.

**Decision:** SKILL.md prescribes single-round dispatch (six parallel `Task`
calls or a `TeamCreate` of the six named agents) as the workable default;
names the two-round protocol as a follow-up brief.

**Rationale:** A single-round shape is enough to validate end-to-end and
captures the bulk of the value (six independent framings + consolidation
without contamination across poles). The two-round shape can land as an
overlay on top of this without retroactive changes to the agent files.

**Confidence:** Medium — visible in SKILL.md structure; rationale partly
inferred from brief's scope language.

<!-- produced-by finish-write-records@v0003 -->
