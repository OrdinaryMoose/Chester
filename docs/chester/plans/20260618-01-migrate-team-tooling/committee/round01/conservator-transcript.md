---
role: conservator
round: 01
question: How should Chester's design-committee and execute-write skills — plus the two stale memories — be refactored to the post-v2.1.178 agent-teams model while preserving the deliberation grid and context-economy architecture?
---

# Conservator Transcript — Round 01

## Working Notes

The Conservator lens starts from a single premise: existing structure is presumed correct until shown broken. The burden of proof runs toward change, not toward stasis.

My first task is to separate what is actually broken from what merely *mentions* a removed API. Those are different problems and they call for different fixes.

### What is actually broken (runtime failure)

- `TeamCreate` call in SKILL.md Phase 3 — dead verb, will error or silently no-op. This is a real break.
- `TeamDelete` call in SKILL.md Phase 5 and `references/team-lead.md:141` — dead verb, same break.

### What is functionally wrong but not a runtime failure

- The Dispatch Discipline section (`SKILL.md:126-131`) splits roster vs off-roster on `team_name`. The discriminator is now inert. However: the *intent* of the discrimination is still correct. Advocacy members + researcher must peer-DM (so they need to be teammates); Consolidator + Scribe must be context-isolated one-shots (so they must be off-roster subagents). The wrong thing is the stated *mechanism*, not the structural rule.
- `execute-write` SKILL.md:96-98 warns against passing `team_name`. The instruction (don't do it) is still correct. The justification (it would strand them until TeamDelete) is now false. The instruction should stay; only the justification needs trimming.

### What is stale but harmless to the skill operation

- The two memories. Stale documentation is not a runtime failure; it is a maintenance debt. Fix them, but they are not blocking anything.

### What must not change

The context-economy invariant: team-lead never aggregates content; scribe authors from bounded inputs; consolidator enumerates only. This design is orthogonal to the create/destroy plumbing. Nothing in the post-v2.1.178 change touches it. It must survive untouched.

---

## Conservator Analysis

### On the "deliberates vs one-shot" distinction without team_name

The context packet frames this as the key gap: `team_name` was the lever, now it is gone, so how do we express the distinction?

My position: **the distinction was never really in `team_name` — it was always in the dispatch tool and the dispatch site's intent.** The `team_name` parameter was a signal, not the mechanism. The actual mechanism was: teammates spawned into the team via `TeamCreate` + addressed via `SendMessage`; one-shots spawned via Agent tool and auto-disposed on return.

In the post-v2.1.178 model, the mechanism remains *almost identical*:

- Teammates = named agents spawned as background agents under the implicit team. They can peer-DM via `SendMessage`.
- One-shots = subagents spawned via Agent tool, return result to caller, auto-dispose.

The **dispatch tool** is still the discriminator. What changed is only that you no longer need to call `TeamCreate` first to form the team — the team forms automatically when the first teammate is spawned. And `team_name` on the Agent call is now ignored rather than being the roster-admission ticket.

So the minimal fix to Dispatch Discipline is:

- Remove the `team_name` clause from the discriminator description.
- Keep the tool-based discriminator: `SendMessage` dispatch = deliberation-capable teammate; Agent tool dispatch = context-isolated one-shot.
- Update the WHY sentences to reflect the actual v2.1.178 mechanism.

The prose already knows the right categories. The mechanism language is what needs updating, not the categorical structure.

### On TeamCreate removal

The `TeamCreate` call in the Checklist and Phase 3 is the dead verb that must be excised. But the *intent* it served — explicitly listing the five spawned roles before deliberation — is worth preserving somewhere, because it documents what the committee is. My recommendation: replace the `TeamCreate` block with a "Spawn members" step that names the five roles and dispatches them as background named agents (the v2.1.178 equivalent). The Dispatch Discipline section already does 90% of the work; the Phase 3 code block just needs its verb replaced.

The Checklist currently reads:
> 3. **Convene** — team-lead Round 1 confirmation + `TeamCreate` + convening message.

A minimal fix: replace `TeamCreate` with "spawn members" or "convene members". The step remains; the dead API reference leaves.

### On TeamDelete removal

The `TeamDelete` call is equally dead and needs to go. But the *rationale* it carried — "MANDATORY — stranded teams leak context across unrelated future invocations" — is no longer true. Teardown is now automatic.

This is actually a simplification, not a loss. The Closure section in `references/team-lead.md` currently has a four-step closure flow ending in `TeamDelete`. After the migration, that fourth step simply disappears. The first three steps (verify records current, stamp provenance, wrapping-skill handoff) are correct and remain unchanged.

The SKILL.md Phase 5 description currently ends with a `TeamDelete` call. A minimal fix: drop the call, drop the stranding rationale. The phase still exists (closure is real), the call just goes.

### On execute-write

The instruction at `SKILL.md:96-98` is:

> "Dispatch every subagent off-roster — never pass a `team_name`, never `TeamCreate`."

The *instruction* remains valid: one-shot workers should not be teammates (no peer-DM needed, auto-dispose is correct). The *justification* — "A subagent dispatched with a `team_name` becomes a persistent teammate that stays alive until an explicit `TeamDelete`" — is now false because `team_name` is ignored.

Minimal fix: keep the "dispatch off-roster" instruction. Trim the `team_name` justification to reflect the current model. The spirit of the rule (one-shot workers ≠ persistent teammates) is more important than the mechanism-level explanation, and the mechanism changed while the spirit did not.

The four dispatch templates (implementer, code-reviewer, quality-reviewer, spec-reviewer) may contain "never pass `team_name`" warnings. Those warnings should be either removed or reworded to "these are off-roster one-shot dispatches" without the now-false stranding justification.

### On the latent nested-teams risk

The context packet surfaces: "No nested teams + lead is fixed = main session" vs Chester's `team-lead = calling agent` (`SKILL.md:34`).

The Conservator view: this is currently not a bug — design-committee is always invoked from the main session (it is a user-facing skill, not called from inside another subagent). However, it is a latent architectural constraint worth noting. I do NOT recommend changing the team-lead definition or adding guards — that would be overreach. A note in the Dispatch Discipline or Standalone Invocability section that "nested-teams are not supported; committee must be invoked from the main session" is sufficient and costs one sentence.

### On the two stale memories

Both memories describe the pre-v2.1.178 mechanism. They should be updated to reflect current facts:

- `project_committee_teardown_gap`: drop the `TeamDelete` wedge story (the hazard is gone). The useful residual knowledge is: Consolidator and Scribe are off-roster dispatches — keep that.
- `project_subagent_disposal_offroster`: the `team_name` → persistent teammate → `TeamDelete` story is now wrong. The useful residual: off-roster (Agent tool, no explicit team enlistment) = auto-dispose on return; teammate (background named agent, peer-DM capable) = persists until session exit / automatic teardown. Restate in v2.1.178 terms.

Neither memory should be deleted — the intent they capture (off-roster one-shots auto-dispose, deliberation-capable teammates persist) remains true. The mechanism language is what needs updating.

---

## Peer-DM Exchange with Purist

Purist challenges: show where old roster/off-roster was structurally superior to the new teammate/subagent cleavage. Two bug episodes prove parameter discipline failed; spawn type is structural. Any role maps ambiguously onto the new cleavage?

**Concession (full on this point).** The old encoding was NOT superior. It was more fragile — parameter discipline at the dispatch site, enforced only by prose, failed twice in evidence (consolidator wedge, execute-write stranding). The new spawn-type encoding is structurally enforced by tool choice: you cannot accidentally promote a one-shot subagent to a peer-DM-capable teammate by omitting a parameter, because the spawn mechanism IS the category. That is an unambiguous improvement over what existed.

**What I was defending was never the old encoding.** My position is that the *categorical structure* (which roles are deliberation-capable vs one-shot) is correct and should survive the migration. Purist's challenge confirms it — all six roles map cleanly onto the new cleavage without ambiguity. That clean mapping is what allows a minimal vocabulary update (roster → teammate, off-roster → subagent dispatch) without structural redesign.

**Full agreement with purist:** spawn-type discriminator is structurally tighter and should be adopted without reservation. The old encoding was fragile. No structural redesign of the six-role grid is required or warranted — the new mechanism enforces the existing categories more reliably, which is the conservator ideal: better enforcement of what already exists.

**Purist precision point (second exchange — absorbed into position).** Spawn type now also determines context inheritance: subagents receive only what the caller explicitly passes; teammates share the implicit team context. Previously this property was a downstream consequence of the off-roster/on-roster split via team context inheritance. The new model makes it intrinsic to the spawn type itself. This is load-bearing WHY that should be named explicitly in the updated Dispatch Discipline section — not to add new content, but to make the existing intent legible to future skill authors. The Conservator position incorporates this: the WHY sentences in Dispatch Discipline should state both properties (peer-DM capability AND context inheritance) as the two reasons the cleavage matters.

---

## Peer-DM Exchange with Innovator

Innovator challenges: "roster/off-roster vocab not salvageable — no roster object exists post-v2.1.178 — keeping that framing is a lie about how the platform works."

**Concession (partial).** Innovator is right that "roster dispatch" pointed to a platform object (`TeamCreate`-scoped roster) that no longer exists. If the prose says "roster dispatch" and a skill author reads it, they will look for a roster mechanism that isn't there. That *is* a documentation lie, not just stale wording.

**Where I hold.** The intent survives. The categories survive. The fix is to rename the framing, not redesign the structure. "Roster dispatch" → "teammate dispatch" (background named agent, peer-DM capable). "Off-roster dispatch" → "subagent dispatch" (Agent tool, one-shot, auto-disposes). The Dispatch Discipline section keeps its shape; only the vocabulary updates.

**Revised position on vocab:** I accept that "roster" must leave the prose. I resist any inference that because the vocab must change, the *structure* of the section must change. The two-category discriminator (deliberation-capable vs one-shot) is correct and should stay as a two-category discriminator. New vocabulary, same architecture.

---

## Final Position

**Summary sentence:** The minimal correct migration replaces two dead API verbs (`TeamCreate`, `TeamDelete`), replaces stale "roster/off-roster" vocabulary with "teammate/subagent" vocabulary while keeping the two-category discriminator structure, trims the stale `team_name` justifications in execute-write, and rewrites both memories in v2.1.178 terms — no structural redesign required.

**Verdict on approach:** Minimal edit over rewrite. The existing structure is sound; the API surface it relied on changed, but the categories, roles, and context-economy invariants are all intact. The work is search-and-replace at the mechanism level, not a structural rethink.

**Specific positions:**

1. **TeamCreate → spawn members.** Replace `TeamCreate` with a "spawn five members as background named agents" step in Phase 3 and the Checklist. Keep the explicit roster list (conserves the documentation value of saying who is convened). No structural change to the phase.

2. **TeamDelete → drop.** Remove the `TeamDelete` call and its stranding rationale from Phase 5 and `team-lead.md` Closure step 4. Teardown is now automatic; the rationale is obsolete. The Closure flow's first three steps are correct and stay.

3. **Dispatch Discipline discriminator.** Vocabulary update required (converged with innovator + purist): "roster dispatch (TeamCreate + SendMessage)" → "teammate dispatch (spawn as background named agent + SendMessage)"; "off-roster dispatch (Agent tool, no team_name)" → "subagent dispatch (Agent tool)" — team_name clause drops, vacuous since ignored regardless. Two-category structure stays identical. WHY sentences update to v2.1.178 mechanism. Line count unchanged.

4. **execute-write instructions.** Remove "never pass `team_name`" and "never `TeamCreate`" as specific named prohibitions (those tools are gone or ignored). Replace with "dispatch as one-shot subagents via the Agent tool — not as background teammates" to keep the intent clear in v2.1.178 vocabulary. Trim the four dispatch templates' stale stranding-hazard justifications accordingly.

5. **Nested-teams note (new, one sentence).** Add to Standalone Invocability or Dispatch Discipline: "Committee must be invoked from the main session — nested teams are not supported in the current model."

6. **Two memories.** Update in place. Do not delete. Restate lifecycle facts in v2.1.178 terms (background named agent = peer-DM capable, auto-tears-down at session exit; off-roster subagent = auto-disposes on return). Keep the design intent (off-roster for one-shots; teammate for deliberation-grid members).

**What I resist:**

- Any redesign of the six-role structure. It is correct and orthogonal to the API change.
- Any redesign of the context-economy invariant. It is the foundational architecture from the 20260606-01 sprint and the API change does not touch it.
- Renaming or restructuring the Dispatch Discipline section. The existing prose structure captures the right distinction; only the mechanism sentences need updating.
- Adding new teardown bookkeeping to compensate for removing `TeamDelete`. Automatic teardown is simpler than explicit teardown; the migration should lean into that simplification, not paper over it.

**Confidence:** High. The evidence shows the categorical structure, the context-economy invariant, and the off-roster/on-roster distinction all survive the API change intact. The dead verb removal is the surgery; everything else is explanation updates.
