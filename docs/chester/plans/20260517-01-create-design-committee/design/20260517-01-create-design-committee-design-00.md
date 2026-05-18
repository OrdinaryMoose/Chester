# Design Brief: design-committee Skill

**Status:** Implementing
**Date:** 2026-05-17
**Sprint:** 20260517-01-create-design-committee

## Source

This sprint implements the feature defined in
`docs/feature-definition/Pending/design-committee-00.md` (the "source brief"). That
document carries the full problem statement, current state inventory, governing
constraints, design direction, open concerns, and acceptance criteria.

This sprint-level brief records only the scope decisions made in this sprint that the
source brief flagged as open or did not resolve. The source brief remains the design
authority; this document is the delta.

## Scope Decisions Made in This Sprint

The source brief's Open Concerns are resolved for this sprint as follows. Anything not
listed here defers to the source brief's recommendations or its "out of scope" list.

### Arbiter's structured-state binding

The Arbiter binds to the **design-proof-system**. The Arbiter agent file describes its
contract abstractly so it can operate against either a live design-proof-system instance
(when one exists), a spec-only simulation, or any other structured file the team-lead
names per invocation. Runtime wire-up specifics — specific tooling and state-handoff
semantics — are deferred (see Scope below).

The other proof system in the repository is outside this sub-sprint's scope and is not
referenced by the Committee skill or its agent files. The system-boundary rule in the
root `CLAUDE.md` applies in full.

### Skill registration

The skill is registered in `skills/setup-start/references/skill-index.md` under Pipeline
Skills with a note that it is standalone (not pipeline-staged), and a Common Dispatch
Pattern entry is added for the convening triggers ("convene the committee", "ask the
committee", "get a multi-perspective read on X").

### Eval / test loop

The standard skill-creator quantitative eval loop is **skipped** for this sprint. The
Committee skill orchestrates six subagents and produces qualitative deliberation output
(decision packets), which the assertion-checked subagent benchmark cannot evaluate
meaningfully. Validation for this sprint is:

- Code-level review of `SKILL.md` and the six agent files for charter fidelity to the
  source brief and the governing constraints.
- One live consultation against a real question after the files land, to shake out
  integration issues that static review cannot catch.

### Translation Gate enforcement

Each subagent self-enforces the Translation Gate from `util-design-partner-role`. The
team-lead re-checks on consolidation. The mechanical regex pass at consolidation is
**recommended in the SKILL.md** (a "should") rather than enforced as a hard automated
gate at this version — the gate is described and its rationale named, but the model
is trusted to apply it. Promoting to a hard automated gate (e.g., a script that
post-processes the decision packet) is a deferred follow-up.

### Standalone invocability

Confirmed: no entry condition. No sprint context, master-plan breadcrumb, config file,
or state source is required to convene.

### Team-lead and pole-only invocations

Both deferred per the source brief's recommendations. Team-lead stays on the calling
agent's thread; pole-only sub-invocations (e.g., `--pole=conservator`) are not exposed.

## File Inventory for This Sprint

The sprint produces these files (paths relative to the worktree root):

- `skills/design-committee/SKILL.md` — the skill itself.
- `agents/design-committee-conservator.md` — S pole, Committee mode.
- `agents/design-committee-innovator.md` — N pole, Committee mode.
- `agents/design-committee-pragmatist.md` — W pole, Committee mode.
- `agents/design-committee-purist.md` — E pole, Committee mode.
- `agents/design-committee-arbiter.md` — proof-state custodian (NEW; no precursor).
- `agents/design-committee-researcher.md` — research and admin (NEW; no precursor).
- `skills/setup-start/references/skill-index.md` — index entry and dispatch pattern added.

The existing Step-B pole agent files in `agents/` are untouched.

## Out of Scope for This Sprint

Carried forward from the source brief, plus this sprint's deferrals:

- **Multi-round protocol mechanics.** SKILL.md names the shape (R1 + cross-DM, R2 +
  finals, risk-weighted consolidation) but the round-by-round transcript schema and
  cross-DM authorization rules are deferred to a follow-up brief.
- **Pole-only sub-invocations.** Not exposed at this version.
- **Design-proof-system runtime wire-up.** The Arbiter contract is abstract; the
  specific tooling and state-handoff semantics for a live instance are deferred.
- **Mechanical Translation-Gate enforcement script.** Recommended in the SKILL.md but
  not implemented as a hard automated post-processor.
- **Migration of the StoryDesigner `## The Committee` CLAUDE.md section.** That is a
  StoryDesigner project task, not a Chester plugin task.
- **Retiring the Step-B pole agents.** They stay as-is for the design skill that uses
  them.

## Acceptance for This Sprint

The source brief's Acceptance Criteria apply in full. Add to them:

- The skill loads and lists in `chester:design-committee` (verify by reloading plugins
  after merge and confirming the skill appears in the Skill tool's available-skills
  list).
- A dry-run convene against a small real question completes the workflow: convene →
  single-round dispatch → consolidation into a three-section decision packet →
  designer-facing output passes the read-aloud test → teardown.
