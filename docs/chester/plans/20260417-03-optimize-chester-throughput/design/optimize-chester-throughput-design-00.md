# Optimize Chester Throughput — Design Brief

## Goal

Optimize the Chester design-and-plan pipeline to reduce token cost and the designer's felt heaviness while preserving the signal quality of its review gates. Based on a retrospective of 18 StoryDesigner sprints (`docs/plan-hardening-effectiveness.md`), the current pipeline over-provisions on bounded work and contains structural redundancies — duplicated prior-art exploration across `design-figure-out` and `design-specify`, overlapping codebase verification between `design-specify`'s ground-truth review and `plan-build`'s `plan-attack`, and unconditional `plan-smell` despite concentrated-and-declining value — that cost subagent dispatches and serial review loops without proportional signal. The redesign consolidates specify's two earning-their-keep functions (ground-truth verification and competing-architect comparison) into `design-experimental`'s closure as a new Finalization stage, routes `design-experimental` directly to `plan-build`, makes `plan-smell` conditional via a cheap heuristic pre-check, refactors the main design brief template to match experimental's envelope-plus-point structure, and updates `design-experimental`'s trigger description to accurately reflect its role as the default structural design skill.

## Prior Art

- **Plan-hardening retrospective** at `/home/mike/Documents/CodeProjects/Chester/docs/plan-hardening-effectiveness.md` — 18-sprint analysis of `plan-attack` and `plan-smell`. Attack catches ~1 real bug per 3 sprints and does not decay with codebase maturity. Smell catches ~1 real bug per 6 sprints, concentrated in sprints that introduce composition, lifetimes, or persistence pathways; on mechanical refactors and bounded cleanups, smell produces mostly polish. The retrospective proposes two implementation options for conditional smell: a gate-time prompt or a plan-attack-first heuristic.

- **`design-experimental` skill** (currently 600 lines) with proof MCP machinery that produces grounded EVIDENCE, RULE, PERMISSION, NECESSARY_CONDITION, and RISK elements. The skill already generates a reasoned closing argument as the designer's approval point and records `rejected_alternatives` per necessary condition. Its Phase 2 proof loop is the locus of grounded design discovery.

- **`design-small-task` skill** with a 6-section bounded brief template at `util-design-brief-small-template` (177 lines). Already routes directly to `plan-build`, skipping specify. This is the precedent for experimental's new routing.

- **`design-specify` skill** (already archived by the designer). Contained a 3-architect competing-architectures comparison that produced interesting options even against fully-developed design briefs, plus a ground-truth reviewer that verified codebase claims. These two functions are the pieces earning their keep and migrate into experimental's new Finalization stage. Specify's other mechanisms — prior-art explorer duplicated from figure-out, spec fidelity review covered by proof closure criteria, user review gate covered by closing argument approval, and the spec document itself (not wanted) — are removed.

- **`design-figure-out` skill** (already archived by the designer). Its prior-art explorer was duplicated in specify, which is one of the structural redundancies the redesign removes.

- **Proof MCP schema** at `/home/mike/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/design-experimental/proof-mcp/proof.js`. EVIDENCE elements have fields `{statement, source: "codebase"}` — no structured `references` field — so the Envelope Handoff projection must extract anchors (file paths, type names) from the free-text statement.

- **`plan-build` skill** with `plan-attack` and `plan-smell` running unconditionally in parallel during its hardening gate. Receives spec from specify today; will receive briefs directly from experimental or small-task after this sprint.

- **Chester thinking-lessons file** (`~/.chester/thinking.md`) containing the rule "Don't add configuration dials (profiles, levels, modes) when the system can self-adjust — the user will cut them." This directly informs the choice of heuristic-driven conditional smell over a designer-prompt approach.

## Scope

**In scope:**

- Add a Finalization stage to `design-experimental` between Phase 2 closure and a new Archival stage.
- Name two contract boundaries: **Envelope Handoff** (proof → finalization) and **Artifact Handoff** (finalization → archival).
- Implement the parallel gate at Envelope Handoff: 1 ground-truth subagent + 3 architect subagents dispatched in a single message, isolated-parallel.
- Define the Finalization stage procedure in 5 steps: Dispatch, Aggregate, Recommend, Reconcile, Close. Support designer-initiated deep-case proof reopening.
- Update `design-experimental`'s trigger description to remove "experimental" and "fork of design-figure-out" language and accurately describe its role as the default structural design skill.
- Transition `design-experimental` directly to `plan-build` at the end of its Archival stage (remove the transition to `design-specify`).
- Refactor `util-design-brief-template` from 548 lines to approximately 250 lines with a 9-section envelope-plus-point structure: Goal, Necessary Conditions, Rules, Permissions, Evidence, Chosen Approach, Alternatives Considered, Risks, Acceptance Criteria.
- Update `design-small-task` to use the Artifact Handoff terminology at its brief-writing moment (naming only; no procedural or template changes).
- Update `plan-build` to receive the ground-truth report from `design-experimental` and cascade verified anchors into `plan-attack`'s dispatch as a skip-list of trusted claims.
- Add a heuristic pre-check to `plan-build` that conditionally fires `plan-smell` based on 5 trigger categories: DI registrations, new abstractions, async/concurrency primitives, new persistence pathways, new contract surfaces. Keyword list colocated in `plan-build/SKILL.md`.
- `plan-attack` runs unconditionally in every hardening pass; its scope narrows to plan-specific additions when a ground-truth report is provided.
- Update cross-references in remaining skills to remove pointers at the archived `design-specify` and `design-figure-out` (e.g., `setup-start`'s skill list, any transition-target language, `util-artifact-schema` if it enumerates them).
- Sprint commit sequencing: template refactor commits first, then skill modification commits. One sprint, one branch, one PR.

**Out of scope:**

- Renaming `design-experimental` to a non-experimental name — deferred because the rename cascades into memory entries, cross-references, user muscle-memory, and external tooling. The trigger description update in-sprint makes the skill's role clear without the rename; the rename itself is a separate decision with its own small design conversation.
- Extracting shared commentary prose (~80 duplicated lines) between `design-experimental` and `design-small-task` into a util skill — deferred because the pipeline restructure is substantive enough without compounding refactor scope. After the pipeline changes land, it will be clearer which prose is genuinely duplicated versus usefully divergent.
- Structural changes to `design-small-task`'s brief template (`util-design-brief-small-template`) — the 6-section bounded structure fits small-task's use case and does not need to mirror experimental's 9-section structure. Plan-build reads both shapes by section heading, not by source skill.
- Changes to the proof MCP's element schema, APIs, or state file format — the existing schema is sufficient. Anchor extraction from the free-text `statement` field handles ground-truth projection.
- Merging `plan-attack` and `plan-smell` into a single reviewer — the retrospective confirms they target different failure modes (attack: "will not work"; smell: "will work but scar") with independent signal. Conditional invocation is the right lever, not merger.
- Changes to Phase 1 (Understand) or Phase 2 (Solve) of `design-experimental` — the bootstrap, parallel exploration, round one, understanding phase, phase transition, problem statement polish/readback/confirm, proof MCP initialization, and Phase 2 per-turn flow are unchanged. The new stage sits after Phase 2 closure.
- Any changes to the structured-thinking MCP, the understanding MCP, the design-proof MCP server implementations, or their persisted state file formats.
- Automatic re-runs of the Finalization gate on medium-tier findings. The gate fires once per closing-argument approval; designer-initiated proof reopening is the only path back into the proof loop.

## Key Decisions

1. **Route `design-experimental` directly to `plan-build`, removing `design-specify` from the pipeline.** Specify's two value functions (3-architect comparison, ground-truth verification) migrate into experimental's new Finalization stage. Alternative considered: keep specify as an opt-in step — rejected because small-task already demonstrates the direct-to-plan-build path works, and the retrospective plus the proof MCP's grounding discipline show that specify's review loops overlap with experimental's proof machinery in ways that do not add independent signal.

2. **Add a Finalization stage between Phase 2 closure and a new Archival stage, bracketed by Envelope Handoff and Artifact Handoff.** Alternative considered: fold the finalization work into Phase 2 Closure as additional steps — rejected because Envelope Handoff and Artifact Handoff are external data-flow contract boundaries (payload crosses to subagents, then to durable artifacts), which are a different kind of boundary from the skill's internal state transitions. Making them explicit named boundaries gives the skill file testable specification points and makes their payloads first-class.

3. **Closing-argument approval is the commitment point for the proof; Finalization operates on the settled envelope without re-reviewing it.** Alternative considered: fire the parallel gate before the designer approves the closing argument so findings can influence approval — rejected because it muddles the approval semantics. The designer should approve WHAT they are committing to before HOW is selected. Ground-truth findings after approval update the artifact's claim description; they do not retroactively unsettle the proof unless the designer explicitly chooses to reopen.

4. **Use semantic names for boundaries (Envelope Handoff, Artifact Handoff) and stages (Finalization, Archival), not numeric labels.** Alternative considered: "Boundary 1" and "Boundary 2" — rejected because semantic names are self-describing to LLMs reading skill instructions and subagent prompts, degrade better under context compaction, activate correct concept associations (Envelope co-activates with EVIDENCE/RULE/PERMISSION), and match Chester's existing naming convention.

5. **Ground-truth subagent receives minimal verification rows `{claim, anchor, proof_element_id}` extracted from EVIDENCE statement text.** Alternative considered: pass the full proof state — rejected as too noisy for verification and oversupplied with context the subagent does not need.

6. **`plan-attack` receives the ground-truth report and scopes verification to plan-specific additions by treating ground-truth-verified anchors as trusted except where the plan modifies them.** Alternative considered: always re-verify from scratch — rejected because it duplicates work the ground-truth report just completed; the cascade is the specify-file's own suggested next-step.

7. **Architects run isolated-parallel (no cross-contamination) with structured bulleted output templates, not tables.** Alternative considered: serial architects where each sees prior outputs, or tabular output templates — rejected because independent readings are the entire value of the comparison, and tables constrain the information architects can convey per the just-established feedback rule that bulleted lists with intro and conclusion serve comparisons better.

8. **`plan-smell` becomes conditional via a cheap keyword-based heuristic pre-check on plan text; `plan-attack` stays unconditional.** Alternative considered: a gate-time prompt that asks the designer whether smell should run — rejected because it adds a configuration dial, which conflicts with the Chester lesson "Don't add configuration dials; let the system self-adjust." The heuristic can be slightly loose (inclusive), because false positives cost one extra parallel dispatch while misses cost an uncaught real bug.

9. **Design brief artifact uses plain section names; skill instructions and architect prompts use semantic envelope vocabulary.** Alternative considered: semantic names throughout both contexts — rejected because the artifact reader (human or plan-build) benefits from immediately-legible section titles, while the skill-file reader and the architect subagent benefit from the distinctive envelope framing that signals role and structure.

10. **Sprint shape: one sprint with ordered commits, template refactor first then skill changes.** Alternative considered: two sprints (template standalone, then pipeline) — rejected because the changes are tightly coupled and splitting them creates a partial-consistency window where the refactored template is unused or the restructured skills write to an outdated template.

11. **Architect output template has 6 locked sections: Approach Summary, Component Structure, Reuse Profile, Trade-off Summary, Envelope Compliance, Risks Introduced.** No per-architect Alternatives Considered section — aggregation across the three architects is the Finalization stage's job during the Aggregate step, not a per-architect responsibility.

12. **Smell heuristic trigger categories: DI registrations, new abstractions, async/concurrency primitives, new persistence pathways, new contract surfaces.** Concrete keyword list (inclusive): for DI — `AddScoped`, `AddSingleton`, `AddTransient`, `services.Add`, `IServiceCollection`, `composition root`; for abstractions — `new interface`, `abstract class`, `new service class`, `public interface I[A-Z]`, `public abstract`; for async/concurrency — `async`, `await`, `Task.`, `Task<`, `SemaphoreSlim`, `Semaphore`, `lock (`, `Interlocked.`, `ConcurrentDictionary`, `ConcurrentBag`, `Channel<`; for persistence — `SaveAsync`, `DbContext`, `IRepository`, `Repository`, `sqlite`, `persistence`, `IDbConnection`, `SqlConnection`, `serialize`, `deserialize`; for contract surfaces — `new contract`, `new DTO`, `new record`, `public record`, `public class.*Dto`, `boundary contract`. Case-insensitive matching. Single reference block in `plan-build/SKILL.md`.

13. **Finalization content placement: reasoning goes to thinking summary; operational metrics go to process evidence; ground-truth report remains a separate artifact.** Thinking summary gains a new "Finalization Reasoning" section covering which architect was adopted/rejected and why, which ground-truth findings were accepted versus forced brief revisions, hybrid articulation when the designer synthesizes, and any reopen decisions. Process evidence gains a new "Finalization Metrics" section covering dispatch timing, subagent return latencies, finding counts by severity, architect proposal count, the reconciliation path taken, and the outcome (pick / hybrid / stay-own / reopen). Alternative considered: a new standalone finalization artifact — rejected because the existing sibling artifacts have natural homes for each content type.

14. **`design-experimental`'s trigger description updated in-sprint; the skill directory is not renamed.** The description change removes misleading language ("experimental", "fork of design-figure-out") and repositions the skill as the default structural design path with a pointer to small-task for bounded work. Renaming the skill directory is deferred as a separate decision.

## Constraints

- **Phases 1-2 of `design-experimental` must not change.** Bootstrap, parallel exploration, Round One, understanding phase, phase transition, problem-statement polish/readback/confirm, proof MCP initialization, Phase 2 per-turn flow, and closing-argument composition are all preserved verbatim.
- **The proof MCP schema and APIs must not change.** Element types (EVIDENCE, RULE, PERMISSION, NECESSARY_CONDITION, RISK), their fields, `submit_proof_update`, `get_proof_state`, `initialize_proof`, and the state file format are all preserved.
- **`design-small-task`'s brief template (`util-design-brief-small-template`) must not change structurally.** Its 6 sections stay as-is.
- **Commits must land in order: template refactor first, then skill modifications.** This prevents a partial-consistency window where skills write to the not-yet-refactored template.
- **Finalization is single-pass per closing-argument approval.** No automatic re-runs on medium-tier findings. Deep-case proof reopening is designer-initiated only.
- **Architect subagents must not see each other's output.** Isolated parallel dispatch, same message, independent contexts.
- **Ground-truth report must be a durable artifact in the `design/` subdirectory.** `finish-archive-artifacts` copies it into the worktree's plans directory alongside the design brief and sibling artifacts.
- **`plan-build` must tolerate both brief shapes (9-section and 6-section) without branching logic on which design skill produced the brief.** Plan-build reads by section heading.
- **The Finalization stage must preserve the existing resume protocol semantics.** Interrupted sessions must be able to detect which stage was active (Phase 2 proof loop, Finalization, or Archival) and pick up correctly.
- **Artifact paths and naming conventions per `util-artifact-schema` must not change.** All new artifacts (ground-truth report) use the existing path convention.
- **The sprint lands on a single branch and a single PR.**

## Acceptance Criteria

- `design-specify` is not referenced by any active skill file, plugin manifest entry, or `setup-start` skill list; searches across the active skills directory return no hits.
- `design-figure-out` is not referenced by any active skill file, plugin manifest entry, or `setup-start` skill list; searches across the active skills directory return no hits.
- `design-experimental/SKILL.md` contains explicit "Finalization" and "Archival" stage sections with "Envelope Handoff" and "Artifact Handoff" contract boundaries documented, including payload shape, consumers, and invariants.
- `design-experimental/SKILL.md`'s YAML frontmatter `description` field no longer contains the words "experimental" or "fork" and does not reference `design-figure-out`.
- `design-experimental/SKILL.md`'s closure transitions to `plan-build`, not to `design-specify`.
- `design-experimental/SKILL.md` specifies the Finalization stage procedure in the 5 named steps (Dispatch, Aggregate, Recommend, Reconcile, Close) plus a defined deep-case reopen path.
- The architect dispatch in the Finalization stage uses the 6-section structured bulleted output template with no tables.
- The smell heuristic pre-check in `plan-build/SKILL.md` enumerates the 5 trigger categories with the specified keyword list, runs before the hardening dispatch, and conditionally includes `plan-smell` in the hardening dispatch based on its result.
- `plan-build/SKILL.md`'s plan-attack dispatch receives the ground-truth report and instructs the attack subagent to treat ground-truth-verified anchors as trusted except where the plan modifies them.
- `util-design-brief-template/SKILL.md` has a 9-section envelope-plus-point structure (Goal, Necessary Conditions, Rules, Permissions, Evidence, Chosen Approach, Alternatives Considered, Risks, Acceptance Criteria) and is approximately 250 lines.
- `util-design-brief-small-template/SKILL.md` is unchanged.
- `design-small-task/SKILL.md` uses "Artifact Handoff" terminology at its brief-writing moment.
- An end-to-end test session of `design-experimental` successfully: initiates, completes Phase 1, completes Phase 2, produces a closing argument, receives designer approval, fires the parallel gate (1 ground-truth + 3 architects), aggregates four returned reports, reconciles with the designer, writes brief + thinking summary + process evidence + ground-truth report to the `design/` subdirectory, and transitions to `plan-build`.
- An end-to-end test session of `design-small-task` successfully: produces a 6-section brief, transitions to `plan-build`.
- An end-to-end test session of `plan-build` consuming experimental's brief: `plan-attack` receives and uses the ground-truth report; `plan-smell` fires or skips based on heuristic match; combined threat report synthesizes correctly with both reports' findings (when smell fires) or attack alone (when smell skips).
- An end-to-end test session of `plan-build` consuming small-task's brief: runs without a ground-truth cascade; `plan-attack` performs its own full codebase verification; `plan-smell` fires or skips based on heuristic.
- All commits in the branch preserve the ordering: template refactor commit(s) precede skill modification commit(s) in the git log.
- `/reload-plugins` succeeds with the new skill files and no stale references to archived skills surface.
