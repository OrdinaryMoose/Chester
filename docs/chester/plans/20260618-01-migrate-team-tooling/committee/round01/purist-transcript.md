---
member: purist
round: 01
sprint: 20260618-01-migrate-team-tooling
---

# Purist — Round 01 Transcript

## Working Notes

### The cleavage question: is "teammate vs subagent" the right conceptual replacement?

Old Chester used a binary: roster (team_name) vs off-roster (no team_name). The discriminator was
the parameter. The intent behind it was: does this role *deliberate* (peer-DM, asynchronous
position-forming, revision passes) or does it *produce* (one input → one output → dispose)?

The new model has no team_name lever. Spawn mechanism is now the only encoding surface:
- Teammate = background named agent, persistent, peer-messages
- Subagent = one-shot, returns to caller, disposes

The question is whether "teammate vs subagent" is *conceptually* isomorphic to "deliberates vs
produces", or whether there is residue the new cleavage cannot carry cleanly.

**My finding: the mapping is exact — and in fact *cleaner* than the old one.**

The old roster/off-roster split encoded intent as a parameter value (present vs absent). That
is fragile: it requires every dispatch site to affirmatively get the parameter right, with no
structural enforcement. Off-roster was the *default* — meaning wrong intent (pass team_name
accidentally) was the bug, and correct intent (omit it) was the typeless void. Chester's bug
history proves this: the teardown gap (project_committee_teardown_gap) and the execute-write
stranding (project_subagent_disposal_offroster) both occurred because dispatch sites
accidentally populated team_name. The distinction lived only in prose discipline, not in the
type system.

The new model inverts that: spawn mechanism *is* the distinction, structurally. You cannot
accidentally make a one-shot worker peer-message its colleagues — the tool call shape you
choose determines everything. This is tighter categorically.

The deliberates-vs-produces intent maps cleanly:
- Advocacy members and researcher *deliberate*: they form independent positions, revise them
  under peer challenge, and must be able to receive DMs from peers mid-round. These require
  persistence between dispatch and consolidation. Teammate is the correct spawn type.
- Consolidator and Scribe *produce*: one bounded input set → one artifact → return. They must
  NOT inherit team context (context-economy invariant), must NOT be peer-DM-able (they have no
  opinion surface), and are correcty disposed after each round. Subagent is the correct spawn
  type.

The cleavage holds without remainder. No role is ambiguous.

**One genuine purist worry**: the Researcher sits at the boundary. The Researcher is in the
deliberation roster, does not have a design opinion, and operates "on demand" rather than on
the deliberation clock. Under the old model it was on the TeamCreate roster because it might
need to receive a DM from the team-lead routing a factual gap. Under the new model, the
Researcher is a teammate for the same reason — it must be persistently addressable throughout
the round. The "no opinion" constraint is not a spawn-type constraint; it is an in-role
behavioral constraint that lives in the agent definition. The Researcher is correctly a
teammate. No ambiguity.

### Does "how you spawn" encoding leave any leak?

The concern is whether a role could be ambiguous — i.e., a role that needs subagent properties
(context isolation, one-shot disposal) but also needs peer-DM capability, or vice versa.

Examining every role in the committee:

**Advocacy members (Conservator, Innovator, Pragmatist, Purist):**
- Need peer-DM: yes (core of the deliberation grid)
- Need isolation from team context: no (they receive the full convening message and question)
- Correct spawn: teammate
- Ambiguous: no

**Researcher:**
- Need peer-DM: indirectly — must receive task routing from team-lead and respond
- Need isolation: no
- Correct spawn: teammate
- Ambiguous: no (the "on demand" framing is a *scheduling* property, not a spawn-type property)

**Consolidator:**
- Need peer-DM: no — receives only a folder path, produces one file, returns pointer
- Need context isolation: YES — the entire point is that it reads only the bounded Final
  Position sections, never the full deliberation context. If it ran as a teammate it would
  inherit the team's shared context.
- Correct spawn: subagent (Agent tool, off-roster)
- Ambiguous: no

**Scribe:**
- Need peer-DM: no — receives verdict + template path + consolidator output, authors artifact
- Need context isolation: YES — must author from its three bounded inputs only, not from
  accumulated deliberation thread
- Correct spawn: subagent (Agent tool, off-roster)
- Ambiguous: no

No leak. The two properties (peer-DM need and context-isolation need) anti-correlate perfectly
across all six roles. Every role falls cleanly on one side of the teammate/subagent line.

### Context-economy invariant under the new spawn model

The invariant (project_committee_context_economy): team-lead never aggregates content;
consolidator enumerates only from bounded inputs; scribe authors from {verdict, consolidator
output, alignment map} only.

Under the old model, the key mechanism enforcing this was *off-roster dispatch for Consolidator
and Scribe* — they received no team context because they were not on the team.

Under the new model: subagent dispatch (Agent tool) gives the same isolation property. A
subagent gets exactly the prompt its caller passes, nothing more. The invariant is preserved by
construction — the spawn mechanism change does not weaken it.

The team-lead's side of the invariant also holds: team-lead still reads only the Consolidator
output (file pointer return from a subagent), never the raw member transcripts. The subagent
return channel and disk-read discipline are unchanged.

**One strengthening observation**: under the new model, the teammate/subagent distinction also
makes the context-economy invariant *more self-documenting*. In the old model, an author
reading the skill needed to know that "no team_name = off-roster = no shared context" to
understand why Consolidator/Scribe are isolated. In the new model, "Subagent" immediately
communicates "one-shot, no peer access, bounded input" — the isolation property is now
intrinsic to the spawn type name. Documentation burden decreases.

### No-nested-teams constraint

Hard constraint: teammates cannot spawn teammates. Only the lead manages the team.

Chester's design-committee invokes Consolidator and Scribe as subagents (Agent tool) from the
team-lead. Team-lead is the main session, which is the lead. This is fine — the lead can
dispatch subagents.

The no-nested-teams constraint becomes a risk only if an advocacy member tried to spawn another
agent. Under the member phase contracts (agent files), members write to disk and send routing
signals only. They do not spawn any agent. The constraint has no current bite.

**The latent risk flagged in the context packet**: "if anything ever dispatches the
committee from inside a subagent, no-nested-teams kills it."

This is a real structural constraint, not a hypothetical. Purist assessment:

The risk is real but the architectural carve-out is clear: design-committee must remain
lead-only callable. This is not a concession imposed by no-nested-teams — it was already the
correct design. A subagent that spawns a five-member deliberation team is architecturally
incoherent regardless of platform constraints; it violates the standalone-invocability
principle (committee creates no sprint, but it does own a team lifecycle, which cannot nest).
The constraint and the correct design agree. No structural concession is forced.

What *is* forced: Chester must document this non-negotiably. The integration section of
SKILL.md should carry an explicit "MUST be invoked from the main session" line, not just an
implicit assumption. This is a documentation obligation created by the migration.

### Execute-write: the stale justification problem

execute-write:96-98 says: "never pass team_name / never TeamCreate, else the worker strands
as a persistent teammate until TeamDelete."

The instruction (dispatch workers as subagents) is still *correct*. The justification (stranded
until TeamDelete) is now *false* — there is no TeamDelete, and subagent disposal is now
automatic on return regardless.

From a purist standpoint, this is a category-1 documentation defect. An instruction whose
justification is false will eventually be misread as no longer applying. The reader may reason:
"the hazard described here can't happen anymore, so maybe this instruction no longer applies."
That reasoning would be wrong — the instruction is still correct (off-roster is still the right
pattern for one-shot workers) but for a *different* reason: subagents are the correct tool type
for one-shot work, period, regardless of what happens if you use teammates instead.

The fix is to replace the TeamDelete-stranding justification with the correct one:
"These workers are one-shot. Subagents are the correct tool type for one-shot work: they return
their result and auto-dispose. Teammates are persistent by design — the right tool for roles
that peer-message and hold state across a round. Dispatch workers as subagents."

### Two memories

**project_committee_teardown_gap**: describes the Consolidator/Scribe wedge-TeamDelete hazard
that existed only because of the team_name discriminator bug. The hazard mechanism is gone.
The memory should be retired. However, the *lesson* it carries — "off-roster is the correct
dispatch for Consolidator and Scribe, and dispatch-site discipline enforces isolation" — should
survive in the revised project_subagent_disposal_offroster memory as a historical note. Don't
just delete; consolidate the durable lesson.

**project_subagent_disposal_offroster**: The description and mechanism text both reference
team_name as the discriminator ("team_name = persistent teammate needing TeamDelete"). This must
be rewritten to the new model: "Teammate = persistent, peer-messages, requires no teardown
(auto at session exit); Subagent = one-shot, returns result, auto-disposes. Choose by role
shape: deliberates/peer-DMs → teammate; one-shot producer → subagent."

---

## Final Position

**Position title:** The conceptual cleavage is correct; the documentation surface is the migration target.

**Claim:** Teammate vs subagent is the categorically correct replacement for the old
roster/off-roster discriminator. The deliberates-vs-produces distinction maps exactly onto the
new spawn types with no residue and no ambiguous roles. The context-economy invariant is
preserved by construction under the new model — isolation for Consolidator/Scribe comes from
subagent spawn type rather than from an omitted parameter. The migration is a documentation
exercise, not a design exercise.

**Argument:**

The old discriminator (team_name present vs absent) encoded intent as a fragile parameter value
requiring affirmative discipline at every dispatch site. The new discriminator (teammate vs
subagent spawn) encodes the same intent structurally in the tool call shape. This is strictly
tighter. Chester's two bug episodes both stem from the fragility of the old encoding; the new
model eliminates the failure mode by construction.

All six committee roles fall unambiguously on one side of the teammate/subagent line:
- Advocacy members and Researcher → teammates (peer-DM required, no context isolation
  required)
- Consolidator and Scribe → subagents (context isolation required, no peer-DM)

The two properties (peer-DM need and context isolation need) anti-correlate perfectly across
all roles. No role is ambiguous.

The context-economy invariant does not require redesign. Subagent spawn gives the same
isolation property that off-roster dispatch gave. The invariant is preserved.

The no-nested-teams constraint forces one documentation obligation (design-committee must be
marked lead-only callable) but no structural concession — that was already the correct design.

**What must change:**

1. SKILL.md Phase 3 / Checklist: replace "TeamCreate" with the teammate spawn mechanism.
   Replace "team_name" discriminator language in Dispatch Discipline with "teammate vs subagent"
   language.

2. SKILL.md Phase 5 / Tear Down: remove TeamDelete call and the "MANDATORY — stranded teams
   leak context" justification. Replace with "session exit cleans up automatically; no teardown
   call needed."

3. references/team-lead.md: same TeamCreate/TeamDelete removals; update Convening section and
   Closure section step 4.

4. SKILL.md Integration section: add explicit "MUST be invoked from the main session
   (no-nested-teams constraint)" line.

5. execute-write SKILL.md:96-98: keep the instruction (dispatch workers as subagents); replace
   the TeamDelete-stranding justification with the correct one: subagent is the right tool type
   for one-shot work, independently of what happened under the old model.

6. Memory project_committee_teardown_gap: retire (hazard mechanism gone), but fold the
   durable dispatch-site-discipline lesson into project_subagent_disposal_offroster before
   deleting.

7. Memory project_subagent_disposal_offroster: rewrite mechanism description to new model:
   teammate vs subagent, not team_name present vs absent; auto-teardown at session exit, no
   TeamDelete required.

**What must NOT change:**

- The context-economy information-flow architecture (team-lead reads Consolidator output only;
  Consolidator reads bounded Final Position sections only; Scribe receives three bounded inputs
  only). This is orthogonal to the spawn mechanism change.
- The off-roster-for-Consolidator-and-Scribe pattern. The mechanism changes (subagent spawn
  rather than off-roster via omitted team_name) but the principle is identical.
- The Researcher's teammate classification. "No design opinion" is a behavioral constraint in
  the agent definition, not a spawn-type constraint.

**Warrant:** Evidence from the live SKILL.md (v0024) showing the exact dead verbs and stale
justifications; evidence from the agent contract files showing clean role separation; evidence
from the two stale memories showing both reference the team_name mechanism that no longer
exists. The teammate/subagent distinction is the authoritative post-v2.1.178 model per the
context packet's quoted facts.

**Confidence:** High. The mapping is clean, the roles are unambiguous, and the invariants are
preserved. The risk surface is bounded: one documentation gap (lead-only callable), one stale
justification (execute-write), and two stale memories.
