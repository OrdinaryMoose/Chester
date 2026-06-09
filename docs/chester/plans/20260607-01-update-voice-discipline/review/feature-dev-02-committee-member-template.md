# Feature Dev 02 — Parameterize the committee member template

- **Recommendation strength:** Strong
- **Dependency category:** in-process (pure instruction text)
- **Architecture move:** one deep template + four thin lens blocks, replacing four near-identical files

## Summary

The four design-committee advocacy members are one skeleton wearing four lenses. Hoist the shared scaffold into a single template; reduce each member file to its lens.

## Current state (verified)

```
agents/design-committee-conservator.md   103 lines
agents/design-committee-innovator.md     103 lines
agents/design-committee-pragmatist.md    103 lines
agents/design-committee-purist.md        103 lines
```

All four files are exactly 103 lines. A line diff between `conservator` and `innovator` shows ~74 of 103 lines identical (~70%). The shared skeleton:

- **Phase Contract — Committee Mode** (~`:35-41`) — identical except the lens name.
- **Hard Prohibitions** (~`:43-49`) — word-for-word shared (no proof-state ops, no team-lead role-play, no designer role-play, writes scoped to `committee/` round folder).
- **Voice Discipline** (~`:51-62`) — translator gate + C1/C2 meta shared; the C1/C2 *examples* are lens-specific.
- **Output Format** (~`:64-104`) — field names and template identical.

The ~30% that varies: the lens-position preamble, the lens name woven through Phase Contract, and the C1/C2 worked example per stance.

`design-committee-researcher.md` and `design-committee-consolidator.md` are genuinely distinct roles — **not** instances of this template. Exclude them.

## The friction (deletion test)

Delete `design-committee-purist.md`: the Hard Prohibitions and Output Format reappear verbatim in the other three — they are not four modules, they are four copies of one. Editing a shared band (e.g. tightening Hard Prohibitions) is a four-file lockstep edit; the latent drift risk is high because nothing enforces the lockstep. Adding a fifth lens today means cloning 103 lines.

## Proposed change

- `agents/design-committee/references/committee-member-template.md` (or a sibling location) holding the scaffold: Phase Contract, Hard Prohibitions, Voice Discipline meta-rules, Output Format.
- Four short **lens blocks** — each: lens-position preamble + the C1/C2 worked example for that stance.

**Locality:** Hard Prohibitions and Output Format have one home. **Leverage:** one scaffold, four lenses. A fifth lens becomes a small block, not a clone.

## Seam decision (shared with Feature Dev 01)

These are dispatched subagents — the file *is* the prompt, so there is no run-time "read a sibling" unless the agent is told to as step one. Two honest options:

1. **Read-as-first-action.** Each member file is a thin lens block whose first instruction is "read `committee-member-template.md`." Live seam; costs one read per dispatch; depends on path resolution in subagent context.
2. **Authoring-time template.** The template is the source; the four member files are generated/assembled from it. This is **one adapter (the generator)** — closer to indirection than a real seam by the project's own "one adapter = hypothetical seam, two = real" rule.

Recommendation: pick the same mechanism chosen in Feature Dev 01 so agent-side instruction sharing is consistent. If neither option yields two genuine adapters, the honest call may be to keep four files but extract only the **truly invariant** bands (Hard Prohibitions, Output Format) into a generator input — and explicitly accept that the lens-woven bands stay per-file.

## Implementation tasks

1. Settle the agent-side seam (jointly with Feature Dev 01).
2. Extract the scaffold to `committee-member-template.md`, marking the per-lens injection points.
3. Author the four lens blocks (preamble + C1/C2 example).
4. Rebuild or re-point the four member files via the chosen mechanism.
5. Confirm `design-committee/SKILL.md`'s dispatch still resolves each member correctly.

## Verification

- `wc -l agents/design-committee-{conservator,innovator,pragmatist,purist}.md` — member files shrink to lens size (or become thin pointers).
- A committee dry-run dispatches all four and each still receives the full scaffold + its lens.
- Editing one Hard Prohibition touches exactly one file.

## Risks & open questions

- Subagent dispatch may require each member to be self-contained at load time — if so, run-time read is unavailable and only the authoring-time template works.
- Over-extraction risk: the C1/C2 examples are lens-specific and must NOT be merged into the shared scaffold.

## Out of scope

- `design-committee-researcher.md`, `design-committee-consolidator.md` (distinct roles).
- The team-lead Translation Gate (already a checklist-with-authority citing `util-design-partner-role`).
