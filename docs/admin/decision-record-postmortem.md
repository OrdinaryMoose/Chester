# Post-Mortem: Decision-Record / Constraint-Triangle System

**Date:** 2026-05-01
**Sprint reviewed:** `20260424-01-build-decision-loop`
**Author:** Mike (sole developer of Chester)
**Scope:** the MCP server `chester-decision-record`, the persistent store at `docs/chester/decision-record/decision-record.md`, the loop integration across `design-specify`, `plan-build`, `execute-write`, `execute-verify-complete`, and `finish-write-records`, and the operational record across the four sprints that have run since the system landed.

## Summary

The Decision-Record / Constraint-Triangle System was designed to close Chester's pipeline-shaped feedback loop: implementation-time decisions would propagate back into spec, tests, plans, and earlier-task code within the current sprint, plus accumulate as cross-sprint memory consulted by future `plan-build` runs. Seven MCP tools, four reference files, and integration edits across six skills were delivered in one sprint with full test coverage. The system has been operationally live for four subsequent sprints. **Zero decision records have been captured. The persistent store contains only a `.gitkeep` file.**

This post-mortem assesses the system's effectiveness, value to the code that ships, value to the customer (the sole developer), and the structural reasons no records have been produced. The conclusion: the system as built is technically sound but mis-targeted at a workflow that does not generate the trigger condition. Either the trigger needs broadening, the system needs to recede behind a flag until the workflow shifts, or the design's framing of "decision" needs to be reconsidered.

---

## What was built

The April 24 sprint delivered, in order:

1. A new MCP server at `mcp/chester-decision-record/` with seven tools — `dr_capture`, `dr_finalize_refs`, `dr_supersede`, `dr_abandon`, `dr_query`, `dr_verify_tests`, `dr_audit`.
2. A persistent store at `docs/chester/decision-record/decision-record.md`, append-only, with bidirectional supersede links and `Status: Active | Superseded | Abandoned`.
3. Loop-optimized spec and plan templates carrying `AC-{N.M}` IDs, observable-boundary declarations, and skeleton manifests.
4. A `propagation-procedure.md` requiring spec-clause update → spec-driven test generation (isolated from implementer code) → full-suite green before a task can be marked DONE when a trigger fires.
5. Integration tests split across four bash scripts (`tests/test-decision-record-{abandon,capture-finalize,cross-sprint,supersede}.sh`) plus shared fixtures and an AC-mapping verifier.

The build was thorough. 17 task/fix commits, 74/74 vitest tests passing, 17 prior bash tests still green. The MCP itself works — `dr_query` and `dr_audit` returned correctly when invoked during this very session's `finish-write-records` step. The infrastructure is real and functional.

## Effectiveness — assessed

**Positive signals.**

- The MCP works. Tool calls return well-formed JSON, validation rejects malformed inputs, the persistent-store file format is sane, supersede and abandon transitions are atomic, and the file lockfile prevents concurrent-write corruption. The 74-test vitest suite gives high confidence in the building blocks.
- The propagation-procedure design is rigorous. The test-generator subagent's input restriction (no implementer code) is the single most defensible design choice in the system — it actually prevents the spec-fits-the-code drift that competing systems (Spec Kit's `/speckit.reconcile`, OpenSpec's `/opsx:sync`) just retrospectively detect.
- The trigger criterion is well-defined: "a decision record fires precisely when implementation produces observable behavior no existing skeleton covers." This is a mechanical, not LLM-judgment, discriminator. It cannot drift.

**Negative signals.**

- The store is empty after four sprints. No record has ever been captured by the live trigger. The only writes to the path are `.gitkeep` (provisioning) and `chore: scaffold chester-decision-record MCP package` (the package scaffold itself).
- The 04-29 sprint summary states the empty result explicitly: *"Zero records is the correct outcome for full-coverage sprints."* This reframes empty as success, but it also means the system has provided zero observed value — only theoretical reassurance that, were a trigger to fire, it would propagate correctly.
- The `dr_audit` integration in `finish-write-records` runs on every sprint close and reports `audited=0, drifted=0`. The audit is a no-op in the no-record state, but it is dispatched and counted as a "passed gate" in summaries. This creates the appearance of operational coverage where no actual coverage is exercised.
- Five of the eight bash test scripts for the decision-record MCP fail when run from a worktree (`ERR_MODULE_NOT_FOUND` because `node_modules` is gitignored). The system's tests are thus partially unverifiable in the standard Chester development workflow, and full-suite verification has been working around this since the system shipped. Bug filed in the 04-30 sprint.

**Net effectiveness:** the build is high-quality but operationally invisible. Effectiveness cannot be honestly assessed against zero observations. What we can say is that the system has not been *counter-effective* — it does not block work, does not produce noise, does not cost cycles. It also provides nothing back.

## Value to the code produced

**The code in question is Chester itself** — skill files, reference docs, MCPs, hooks, the bash test corpus. The decision-record system was designed for codebases where:

1. Code-producing tasks dominate the sprint mix.
2. Specifications are written prospectively and tested as the implementer works.
3. Implementation discoveries (two-or-more valid implementations, ambiguity surfaced at write-time) are common.
4. The work continues for many sprints and benefits from cross-sprint memory.

Chester partially fits this description. The build-decision-loop sprint itself was 14 code-producing tasks. The 04-29 competitive-interview sprint had 16 code-producing tasks. The 04-25 convergence-model and 04-30 artifact-skill-versions sprints had mixed code/docs profiles.

**But the actual triggers fired zero times.** Inspection of the two recent sprints with skeleton manifests reveals why:

- **20260429-01-add-competitive-interview** (16 code tasks, 24 ACs, 24 skeletons): every observable behavior had AC skeleton coverage. The implementer never produced a behavior outside the spec's anticipated boundary. The trigger-check ran 16 times and found nothing each time. Per the sprint summary, this is the *intended* outcome — full skeleton coverage means the spec actually specified the work, and there was nothing for a decision record to record.
- **20260425-01-redesign-convergence-model**: similar pattern.
- **20260430-03-add-artifact-skill-versions** (this sprint, 10 tasks): skipped `design-specify` entirely (plan was built directly off the brief). No skeleton manifest exists. The trigger-check has no skeletons to diff against, so it never fires. Yet, looking at this sprint in retrospect, real ambiguities were resolved — the plan-attack/plan-smell ownership correction during hardening, the mixed execution-mode contract extension — that *would* have qualified as decisions in the system's own framing. They were captured in the threat report and the audit, but not as decision records.

**Value to the code:** none observable. The system was designed for ambiguity that surfaces at the coding-implementation boundary. Chester's sprint pattern surfaces ambiguity at the design and planning boundaries — and Chester *already* captures those decisions in design briefs, threat reports, and reasoning audits. The decision-record system is targeted at a layer where Chester's actual ambiguity does not live.

A subtler concern: the system's existence may be giving *false reassurance*. Sprint summaries report `dr_audit: audited=0, drifted=0` as a green gate, but a green gate in a no-record state is not evidence the loop works — it is evidence the loop hasn't been exercised. If a real ambiguity had surfaced and gone uncaptured (as it did in this very 04-30 sprint), the audit would still have been green.

## Value to the customer

The customer is the sole developer of Chester (Mike). Customer needs, inferable from build behavior and prior feedback:

- A workflow that captures decisions for future-Mike to read and not have to reconstruct.
- A workflow that does not introduce ceremony or context-switch cost at decision time.
- Tools that recede when not earning their keep.

**What the customer gets from the system today:**

- A guaranteed-empty `dr_audit` line in every session summary. Zero entries, every time. After four sprints, this line is now a noise item that carries no signal.
- A set of bash tests that fail in the standard worktree workflow until manually filtered, contributing to verification friction at sprint close.
- A set of trigger-check steps inserted into every code-producing task in `execute-write`'s subagent dispatch loop, contributing latency in exchange for never-yet-fired output.

**What the customer does NOT get:**

- A persistent log of the actual decisions made during work. The decisions Mike has made over the past four sprints — about plan-attack ownership, about execution-mode mixing, about provenance trailer format, about competitive interview round structure, about master-plan sub-sprint conventions — are all captured in design briefs, threat reports, and audit files. None of them are in the decision-record store.
- Cross-sprint memory consulted by `plan-build`. This sprint's `dr_query` returned zero records; the only signal it carried was "no prior decisions." Future sprints will see the same. The cross-sprint loop has never had any data to consult.
- A sense that the system is doing useful work. Empty audits and unfired triggers are operationally identical to "the system isn't running" from the customer's perspective.

**Counterfactual:** if the decision-record system had not been built, the past four sprints would look identical from a customer-value perspective. The decisions made are preserved in artifact prose; the project's memory is not appreciably weaker. The build cost (one large sprint, 14 tasks, 17 commits) was paid for output that has not yet manifested.

This is not a claim that the system was *wrong* to build — only that, four sprints in, it has not begun paying back the build cost, and the trigger conditions that would let it pay back have not arisen in the workflow.

## Why zero decision records have been produced

Five interlocking reasons.

### 1. The trigger requires a coverage gap that good design-specify prevents

The trigger criterion reads: *a decision record fires precisely when implementation produces observable behavior no existing skeleton covers.* If `design-specify` does its job (writes ACs that span the work, scaffolds skeletons for each), then implementation cannot produce uncovered behavior — because all behavior is covered. The trigger criterion is structurally inverse-coupled to the upstream design work: the better design is, the less the loop fires.

This is by design (per 04-29 audit: "Zero records is the correct outcome for full-coverage sprints"), but it means the loop is a *fallback* mechanism for spec underspecification, not a primary capture mechanism. If spec is under-specified, the trigger fires — but Chester's plan-build hardening and design-specify reviews specifically work to *prevent* underspecification. The two halves of the pipeline are working at cross-purposes for the trigger's input.

### 2. Many sprints are docs-producing, which skips the trigger entirely

`execute-write` Section 2.1 step 3: *"Skip if the current task's Type is docs-producing or config-producing (no skeleton diff runs for non-code tasks)."* Three of the four post-deployment sprints were predominantly docs-producing (skill-file edits, reference docs, MCP convention work). The trigger-check never even attempted to fire on those tasks. The 04-30 sprint is illustrative: 10 tasks, of which 7 were docs-producing — and even the 3 code-producing tasks didn't trigger because either no skeleton manifest existed (this sprint skipped design-specify) or the implementation matched the test cases verbatim.

### 3. Decisions in Chester surface upstream of execute-write, not inside it

Chester's actual decision points cluster at design and plan time. Plan-attack and plan-smell hardening produces decisions (mitigations, scope changes, format selection). Design-specify's competing-architectures step produces decisions. Plan-build's heuristic execution-mode selection produces decisions. None of these are visible to the decision-record loop, which only listens at the implementer step inside execute-write.

The 04-30 sprint produced multiple real, durable decisions: `plan-attack/plan-smell` reclassification, mixed execution-mode adoption, mitigation selection from a six-option menu, brief-filename rename. Each was a "two or more valid implementations exist and existing artifacts didn't determine" moment per the trigger criterion. None were captured by the loop because they happened outside the loop's listening surface.

### 4. The discriminator is structurally too narrow

The skeleton-coverage diff is a precise, mechanical discriminator — but it discriminates on a single axis (does this implementation produce behavior outside the spec's declared boundaries). Real decisions in Chester sprints are often:

- **Format choices** (HTML comment trailer vs frontmatter vs sidecar — the 04-30 sprint had several of these; none touched skeleton coverage).
- **Workflow trade-offs** (subagent vs inline mode; full vs filtered test suite; mitigation accept/skip).
- **Scope corrections** (D10 was wrong; remove tasks 8 and 9; renumber).

These are decisions, but they don't manifest as observable-behavior delta against a spec skeleton. The trigger doesn't see them because they are not the kind of decision the trigger was designed to see.

### 5. The first record's blast radius is high; nobody invokes the system speculatively

The propagation-procedure is rigorous: a record fire blocks the task on a full-suite green-pass after spec-update + test-generation. This is correct discipline for catching real drift, but it is also a high-friction event. An implementer (or a parent agent) deciding whether to trigger on borderline ambiguity faces an asymmetric cost: triggering means the task is BLOCKED until the propagation completes; not triggering means the task continues. With no record yet captured to set a baseline expectation, every potential trigger faces "is this *really* worth blocking on?" — and the safe answer in a never-yet-triggered system is no.

Combined effect: rigid trigger criterion + workflow that mostly avoids it + decisions that happen elsewhere + asymmetric trigger cost = zero records.

---

## What this means going forward

Three options, ordered by intervention cost.

### Option A: Recede the system behind a flag; revisit when workflow shifts

The system is built, tested, and inert. It is not costing meaningful cycles (the trigger-check is fast; `dr_audit` returns instantly when no records exist). The simplest action is to leave it in place, stop reporting `audited=0` in summaries (it is noise), document this post-mortem as the operational baseline, and revisit if and when Chester begins producing the kind of code work the system was built for.

**When this is right:** if Chester remains primarily a meta-tool for designing other tools, where the actual decisions happen at design and plan time, the system will continue not to fire. Burying it gracefully respects the build cost without forcing its use.

**Cost:** zero. The system already ships. No code change required other than tidying summary boilerplate.

### Option B: Broaden the trigger to catch upstream decisions

The trigger fires on skeleton-coverage misses. Two natural extensions:

- **Plan-build hardening decisions** (mitigation accept/skip from plan-attack/plan-smell findings, threat-report risk-level resolution, execution-mode override) could automatically capture as decision records. Each of these IS a decision among alternatives that affects spec/plan/code coherence; each is currently captured in prose-only audits. Auto-capturing them would seed the store with real entries from real sprints.
- **Design-specify architecture-choice decisions** (the competing-architectures step's hybrid recommendation) could capture similarly.

This expands the trigger surface from "implementation-time observable-behavior delta" to "any sprint moment where two-or-more valid options were considered and chosen among." It would produce records — but at the cost of conflating two different decision shapes (within-coverage vs cross-cut), and it would require integration edits to plan-build, plan-attack, plan-smell, design-specify.

**When this is right:** if cross-sprint memory is the load-bearing value (the second altitude of the brief), then any decision is worth capturing — not just the narrow set that fires today. The trigger criterion was chosen for mechanical precision; broadening trades precision for coverage.

**Cost:** mid-sized refactor sprint. Estimated 1-2 sprints. Risk: the broadened trigger could over-fire on non-decisions (every plan-attack pass produces SOME mitigations; do they all warrant blocking propagation? Probably not).

### Option C: Reframe the system as a rationale capture rather than a propagation gate

The propagation-procedure (spec update → test generation → full-suite block) is the most distinctive part of the design. It is also what makes the trigger high-friction. If propagation were *advisory* (record the decision; flag the affected spec clauses; do not block on test generation), records could be captured liberally without the asymmetric-cost penalty. The store would become a richer log; the loop would lose its rigor.

This is what dbreunig's "Plumb" tool does (commit-time extraction with human approval). It is what Spec Kit and OpenSpec's reconciliation commands do. The 35-year IBIS / gIBIS / QOC tradition shows what happens to advisory-only structured-capture systems: capture cost stays high, benefit stays diffuse, adoption decays.

**When this is right:** if mechanical enforcement isn't worth the friction in Chester's workflow, accept the rationale-log framing and accept the historical adoption-failure curve as a known risk.

**Cost:** moderate refactor. The propagation-procedure becomes optional. The store accepts entries without the spec/test/code co-update gate. The system loses what made it distinctive among 2026 prior art.

---

## Recommendation

**Option A** in the near term, with **Option B** held as a contingency.

The 04-30 sprint's experience surfaced multiple real decisions that the current system would not capture. If those decisions had been auto-recorded from plan-build hardening, the store would have meaningful entries today, and `dr_query` at future plan-start would return useful prior art. That points at Option B as the natural extension. But Option B is a non-trivial integration, and it should be motivated by an actual sprint where the absence of cross-sprint memory caused observable rework — not by speculative future need.

In the meantime: leave the system in place, stop reporting `audited=0` as a green gate (it's noise; rephrase to "no records — trigger never fired" or omit when zero), fix the worktree-level `node_modules` symlink so the bash tests run cleanly from any worktree, and keep this post-mortem as the canonical record of why the store is empty.

The build was a craft success. The deployed system has not yet earned its keep. That is a defensible outcome to sit with for now.

---

## Appendix: artifacts referenced

- Sprint folder: `docs/chester/plans/20260424-01-build-decision-loop/`
- Persistent store: `docs/chester/decision-record/` (currently contains only `.gitkeep`)
- MCP source: `mcp/chester-decision-record/{server.js,store.js,schema.js,handlers.js}`
- Failing-test bug report from 04-30 sprint: `docs/chester/plans/20260430-03-add-artifact-skill-versions/summary/bug-decision-record-mcp-tests.md`
- Trigger-check spec: `skills/execute-write/SKILL.md` Section 2.1 step 3
- Propagation-procedure: `skills/execute-write/references/propagation-procedure.md`
- Sprints reviewed for trigger evidence:
  - `20260424-02-design-masterplan-mode` (no skeleton manifest)
  - `20260425-01-redesign-convergence-model` (skeleton present, no records)
  - `20260429-01-add-competitive-interview` (24 skeletons, 16 code tasks, no records — "correct outcome for full-coverage sprints")
  - `20260430-03-add-artifact-skill-versions` (no skeleton manifest, no records, multiple uncaptured decisions)
