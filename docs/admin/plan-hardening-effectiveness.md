# Plan Hardening Effectiveness: plan-attack vs plan-smell

A retrospective on whether Chester's two plan-review skills earn their keep.

> **Status:** research note
> **Evidence window:** 18 StoryDesigner sprints with threat reports, 2026-03-30 through 2026-04-16
> **Question:** Are `plan-attack` and `plan-smell` both worth the time and token cost during the plan-build hardening gate?

## Background

Chester's `plan-build` skill ends with a hardening gate that runs two reviewers in parallel against the draft implementation plan:

- **`plan-attack`** — adversarial review hunting structural integrity gaps, execution risks, unstated assumptions, contract gaps, and concurrency hazards.
- **`plan-smell`** — forward-looking code-smell analysis predicting the structural smells, coupling risks, and change-prevention patterns the plan would introduce.

Both reviewers write into a shared artifact: `<sprint>-plan-threat-report-NN.md`. Findings are severity-tagged (Critical / High / Moderate / Minor / Low / Informational / OK) and usually paired with explicit mitigations the executor can apply.

Each run costs roughly 3–6k tokens per reviewer. Combined they add 5–10k tokens and several minutes to every sprint. The question is whether the findings justify the cost.

## Method

Every `plan-threat-report-NN.md` in `StoryDesigner/docs/chester/plans/` was read end-to-end (21 reports across 18 sprints — two sprints had a second revision). For each report:

1. Findings were tallied by reviewer and severity.
2. For every Moderate-or-above finding with a mitigation, the final plan and the sprint's audit/summary were grepped for the mitigation language to confirm whether it was incorporated.
3. Incorporated findings were further categorized as either **real bugs caught** (structural or correctness issues that would have shipped broken code) or **polish** (acceptance-criterion wording, belt-and-suspenders assertions, documentation nudges).

A "real bug" means the finding describes something that, left alone, would have produced a compile error, runtime defect, silent data loss, test false-positive, or architectural contamination that later sprints would have had to unwind.

## Results

### Headline numbers

| Metric | plan-attack | plan-smell |
|---|---|---|
| Sprints reviewed | 18 | 18 |
| Total findings (all severities) | ~55 | ~50 |
| Non-trivial findings (Moderate or above) | 26 | 21 |
| Non-trivial mitigations incorporated | 26 / 26 (100%) | 18 / 21 (86%) |
| Real bugs caught (would-have-shipped) | **6** | **3** |
| Rate of real bugs | ~1 per 3 sprints | ~1 per 6 sprints |

### Real bugs plan-attack caught

1. **repository-base-s2 (F1)** — thread-unsafe `HashSet` under a double-checked lock; would corrupt state under concurrency.
2. **repository-base-s2 (F2)** — raw-SQL table name never verified against schema; would fail in production.
3. **pipeline-stage-contract (F1–F3)** — API method-name mismatches between the plan and the real interfaces; the code would not have compiled.
4. **converge-diagnostic-types (E-1, run 01)** — atomicity gap in the enum replacement step that could leave compilation broken mid-task.
5. **fix-adapter-gaps (Critical)** — `ExplainKey` read as a property when it was a reference; the mapper would have been a silent no-op.
6. **test-save-pipeline (Critical)** — SQLite foreign-key pragma not enabled in the integration harness; tests would pass with incorrect ordering.

### Real bugs plan-smell caught

1. **pipeline-stage-contract (Smell 1)** — scoped DI lifetime used in a non-ASP.NET desktop app; would silently fall back to singletons or fail at resolution time.
2. **pipeline-stage-contract (Smell 3)** — stub `ExecuteSaveAsync` returning success without persisting; silent data loss if wired up prematurely.
3. **wire-save-dispatch (Medium)** — partial persistence with no rollback path, flagged as architectural tone-setting for the new save pipeline.

### Where plan-smell's findings came from

Out of 21 non-trivial smell findings:

- **3** were real bugs (above).
- **~10** were maintenance-burden notes (DI duplication, namespace crowding, dead properties, shotgun-surgery bounds).
- **~8** were wording polish on acceptance criteria, or belt-and-suspenders re-assertions.

After `converge-diagnostic-types` (mid-April), non-trivial smell findings collapsed almost entirely into the "polish" bucket. The codebase stabilized and the marginal value of a second reviewer dropped with it.

### Convergence

In at least six sprints, both reviewers independently flagged the *same* issue: HashSet thread safety, table-name fragility, `ResetForTesting` visibility, factory-constructor completeness, build-order gaps, and the schema-versioning blocker. When both run, smell frequently validates attack rather than uncovering independent risks.

## Interpretation

**`plan-attack` is a reliable correctness gate.** One real bug caught per three sprints is a strong hit rate against a cost of 3–5k tokens and a few minutes. The findings are the kind of defects that are expensive to catch later — concurrency bugs, silent no-op mappers, test-harness false-positives. Attack's value does not appear to decay as the codebase matures, because the failures it hunts (API mismatches, execution order, hidden state) are orthogonal to code maturity.

**`plan-smell` has concentrated but declining value.** Its three real catches were in pipeline-stage-contract and wire-save-dispatch — both sprints that introduced new composition, new lifetimes, or new persistence pathways. On mechanical refactors, renames, and bounded cleanup work, smell produced almost nothing beyond wording nits.

**They are not symmetric.** Attack catches "this will not work." Smell catches "this will work but leave a scar." Scars matter, but far fewer sprints create them than contain execution risks.

## Recommendation

**Run `plan-attack` on every plan-build hardening pass. Run `plan-smell` conditionally.**

Invoke `plan-smell` when the sprint:

- Adds or reshuffles DI registrations, composition roots, or service lifetimes.
- Introduces async, concurrency, or new persistence pathways.
- Defines new abstractions, service hierarchies, or contract surfaces.
- Is a pre-release hardening pass where redundancy itself has value.

Skip `plan-smell` when the sprint is:

- A mechanical refactor, rename, or relocation.
- A test-infrastructure update.
- A bounded cleanup scoped to a handful of files.
- A sprint where the plan introduces no new abstractions or coupling.

### Implementation options

Two ways to realize this without losing the reproducibility of the current fixed hardening gate:

- **Gate-time prompt.** `plan-build` asks the designer whether the sprint matches any of the "run smell" triggers above. Default answer is shown; designer confirms or overrides.
- **Plan-attack-first heuristic.** Always run attack. Then check whether the plan introduces composition, async, or new abstractions (a cheap pre-check). If yes, run smell; if no, skip.

Either approach preserves attack as an unconditional gate and makes smell an informed choice rather than a reflex. Based on the 18-sprint sample, this would have dropped total smell runs by roughly half without losing any of the three real bugs it caught — all of which came from sprints that would have triggered the "run smell" conditions.

## Caveats

- The sample is one project and one designer. A less-stable codebase might keep smell's hit rate elevated.
- Real-bug classification involved judgment calls on the boundary between "polish" and "correctness." Reasonable observers could shift one or two findings across that line without changing the recommendation.
- Token-cost numbers are estimated from skill complexity, not measured end-to-end.

## Source artifacts

All threat reports reviewed for this note live at:

```
/home/mike/RiderProjects/StoryDesigner/docs/chester/plans/*/plan/*-plan-threat-report-*.md
```

The full per-sprint tally is available in the research-session transcript (2026-04-17).
