# Feature Dev 03 — Single-source the skill catalog; remove the phantom pointer

- **Recommendation strength:** Strong (top recommendation)
- **Dependency category:** in-process (could add a generator build step → local-substitutable)
- **Architecture move:** make skill frontmatter the single source of truth; derive the index

## Summary

Every skill's trigger description is maintained in two places — its own frontmatter and `skill-index.md` — and the two have drifted into a live contradiction. The sync rule that is supposed to keep them aligned points at a list that does not exist where it claims. Three skills are missing from the index entirely.

## Current state (verified)

- **23** skill directories under `skills/`.
- `skills/setup-start/references/skill-index.md` lists **20** skills. **Missing:** `design-grillme`, `util-handoff`, `util-improve-codebase`.
- `skills/setup-start/SKILL.md:203` contains **no** skill list — it only points to `references/skill-index.md`.
- The sync rule names the wrong file:
  - `CLAUDE.md:86` — "the skill's entry in `skills/setup-start/SKILL.md` (the available skills list) must stay in sync."
  - `skills/CLAUDE.md:33` — "the matching entry in `skills/setup-start/SKILL.md`'s available-skills list must stay in lockstep."
  - Both reference an available-skills list inside `setup-start/SKILL.md` that isn't there. **Phantom pointer.**
- **Live drift** (`design-small-task`):
  - frontmatter `skills/design-small-task/SKILL.md:3` — "Produces a six-section brief at Artifact Handoff and **transitions to design-specify** (which formalizes the brief into a spec…)."
  - index `skills/setup-start/references/skill-index.md:26` — "produces a brief for plan-build. No MCP, **no spec step**."
  - Direct contradiction about the downstream workflow.
- A second drift exists for `design-committee` (frontmatter `:3-9` is a routing trigger; index `:24-27` adds implementation detail — four-pole debate, decision-packet format — that the trigger omits).

## The friction (deletion test)

Delete the `design-small-task` line from `skill-index.md`: nothing is lost — the canonical description still lives in frontmatter and in the live Skill-tool registry. The index entry was a copy. Because it is a copy with no enforced sync, it drifted into a statement that contradicts the skill's own frontmatter.

## Proposed change

Make **frontmatter the single source of truth.** Then:

- Reduce `skill-index.md` to what it uniquely provides — priority order (gate > review > behavioral > utility), dispatch patterns, and role grouping — using **name pointers, not re-descriptions**. Or generate the index from frontmatter so the descriptions can never diverge.
- Fix `CLAUDE.md:86` and `skills/CLAUDE.md:33` to name the real file (`skills/setup-start/references/skill-index.md`) and the real relationship (index derives from frontmatter; edit frontmatter).
- Ensure the three missing skills appear (automatic if the index is generated).

**Locality:** one description per skill. **Leverage:** frontmatter, index, and the Skill-tool list agree by construction. The phantom-pointer maintenance trap disappears.

## Implementation tasks

1. Decide: hand-maintained index reduced to grouping+pointers, **or** a generator script that emits the index from frontmatter.
2. If generator: write it (read each `skills/*/SKILL.md` frontmatter `description`, group by role, emit `skill-index.md`). Add to tests or a make target.
3. Rewrite `skill-index.md` to stop re-describing skills.
4. Correct the sync rule in both CLAUDE.md files.
5. Add the three missing skills.
6. Bump `version` on `setup-start` if its contract changes.

## Verification

- `for d in skills/*/; do n=$(basename "$d"); grep -q "$n" skills/setup-start/references/skill-index.md || echo "MISSING: $n"; done` prints nothing.
- No skill description text appears in both frontmatter and index (if generated, the index carries descriptions verbatim from frontmatter — acceptable because there's one source).
- `design-small-task` no longer contradicts itself.

## Risks & open questions

- A generator adds a build step; weigh against a hand-maintained pointer-only index.
- Decide whether the index should carry descriptions at all, or only names + grouping + dispatch patterns. Pointer-only is the strongest single-source guarantee.

## Out of scope

- The Skill-tool runtime registry (auto-generated from frontmatter — already correct).
- Skill *content*; this is purely about the catalog of descriptions.
