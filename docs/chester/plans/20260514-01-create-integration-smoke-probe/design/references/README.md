# Design References — Integration Smoke Probe Sprint

These files are the **working prototype** that motivated this sprint. They were
authored ad-hoc during the 2026-05-14 calculator stress test that uncovered the
Engine wildcard bug and the Engine↔Domain shape divergence. The sprint's job is
to codify the convention these artifacts foreshadow.

## What's here

| File | Role |
|---|---|
| `simulation-report.md` | The post-stress-test finding report. Names the five findings (1 Critical, 3 Important, 1 withdrawn) and the methodology. Read first for context on why this sprint exists. |
| `no-adapter-smoke.mjs` | **The canonical example of what an integration smoke probe should look like.** ~30 lines. Imports both layers, wires them, runs one operation, asserts the closure gate fires correctly. Five-minute artifact. If this fails, the seam is broken. |
| `calculator-simulation.mjs` | Fuller happy-path probe — 29 operations end-to-end. Shows what a higher-confidence probe looks like (more coverage, still fully scripted, no test framework). |
| `calculator-failure-simulation.mjs` | Failure-path counterpart. Demonstrates how a probe can *also* assert negative behavior (gate refuses incomplete proof). |
| `port-adapter-OBSOLETE.mjs` | The 35-line workaround shim used during the stress test before the Engine↔Domain shape fix landed. Kept as historical evidence of the kind of friction the smoke-probe convention is intended to prevent. Not used anywhere; safe to delete after this sprint ships. |

## Design questions these artifacts surface

The conversation that produced this sprint identified an integration smoke probe
as "the better general-purpose answer" vs. a seam-contract document. Open
questions for design:

- **Where does a probe live structurally?** Co-located with the consumer? In a
  top-level `__probes__/` dir? As `<module>.boot-smoke.test.<ext>` next to other
  tests? (`no-adapter-smoke.mjs` shows one option; `bridge-integration.test.js`
  in `skills/design-large-task/domain/__tests__/` shows another that already
  exists post-fix.)
- **What is a probe's minimum contract?** "Imports the upstream, instantiates
  it, hands it to the downstream's entry point, asserts no boot-time throw" —
  or stricter (must exercise at least one end-to-end operation)?
- **When does a probe run?** Every test invocation? Only at sub-sprint boundary?
  As a `plan-build` gate before `execute-write` begins? As part of the standard
  test suite indistinguishable from other tests?
- **Does this become a skill, a convention, or both?** Skills like
  `util-integration-probe` (generates a probe from a target module pair) vs.
  just a one-line directive in `design-specify` / `plan-build` ("if this sprint
  has an upstream dependency, write a probe").
- **How does the probe declare its dependency surface?** Hand-written imports?
  Pulled from the consumer's spec? Inferred from the merge-base of two
  sub-sprint branches?

## Original locations (before promotion to this sprint)

- `no-adapter-smoke.mjs` was created in the bug-fix worktree
  (`.worktrees/sprint-01-bug-fix-01/docs/chester/working/stress-tests/calculator-proof/`)
  specifically to prove the Engine↔Domain shape fix worked at the user-facing
  surface. It was rescued before the worktree was removed.
- `calculator-simulation.mjs`, `calculator-failure-simulation.mjs`,
  `simulation-report.md`, and `port-adapter.mjs` were authored in main's
  gitignored `docs/chester/working/stress-tests/calculator-proof/`
  scratch directory during the original 2026-05-14 stress test. The scratch
  directory has been removed; these files are the salvageable subset.

## Running the probes locally

All `.mjs` files use ESM imports with relative paths up to the repo root. They
were originally written assuming a path depth of 5 ups; the move to this
references directory required updating to 6 ups. They have been patched and
verified runnable from this location.

```bash
cd docs/chester/working/20260514-01-create-integration-smoke-probe/design/references
node no-adapter-smoke.mjs
node calculator-simulation.mjs
node calculator-failure-simulation.mjs
```

All three should produce `OK` / `Total attempts: N, Failures: 0` or
(for the failure simulation) `Failures: 1` with the expected
`CLOSURE_NOT_PERMITTED` throw.
