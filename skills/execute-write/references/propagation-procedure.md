# Propagation Procedure

Invoked by `execute-write` when the skeleton-coverage diff FIREs — that is, when a task decision reveals that the spec's acceptance criteria no longer fully cover what the implementation now does, or that the implementer made a decision that needs a test lock. The three steps below run in strict sequence. The task is BLOCKED until step 3 passes.

## Preconditions

- A decision record is open for the current task (the decision-record MCP has an active entry).
- Skeleton-coverage diff has fired (at least one skeleton ID is flagged as divergent, or a new criterion is required).
- The implementer's commit(s) exist on the branch.

## The Three Steps

### 1. Spec-clause update

Update or add the spec's acceptance-criterion clause to reflect the decision just made.

- **New behavior not covered by any existing AC** → add a new criterion. Allocate the next free `AC-{N.M}` ID in the relevant section and fill in the full block (observable boundary, Given/When/Then, test skeleton ID, implementing tasks = current task).
- **Existing criterion refined by the decision** → append a suffix-refinement clause `AC-N.Ma` immediately after the original. The original is never rewritten in place; refinements stack (`AC-1.1a`, `AC-1.1b`, ...) so history is legible.
- Record the new/updated clause text in the decision record (this becomes the input to step 2).

The spec file is edited directly. Commit happens after step 3 passes, as part of the task's normal commit flow.

### 2. Spec-driven test generation

Dispatch the `test-generator.md` subagent. Provide it with exactly three inputs:

- The updated/new spec-clause text (from step 1).
- The skeleton manifest (`spec/{sprint-name}-spec-skeleton-00.md`).
- The existing spec document.

**CRITICAL RULE:** tests generated during propagation MUST be derived from spec clause text, not from the implementer's code. Do not pass the implementer's diff, their test file, or any reference to their implementation into the subagent's context. See Mod 4 rationale below.

The subagent produces a new test file (or overwrites the skeleton stub) whose test name matches the skeleton ID (`ac-{N-M}-{slug}`). It returns the test path and test name; record both in the decision record.

### 3. Full suite run

Invoke `execute-prove` to run the complete test suite (not just the new test — the full suite).

- **Suite passes including the new test(s)** → propagation complete. Flip the skeleton manifest status to `filled` for the affected IDs. Unblock the task; resume execute-write's normal flow.
- **Suite fails on the new test only** → implementer must finish the work the decision committed them to. Re-dispatch the implementer scoped to the failing test plus the updated clause. Loop back to step 3 after their next commit.
- **Suite fails on earlier-task code (backward reach)** → existing BLOCKED-status handling applies. Re-dispatch the implementer scoped to (a) the failing test files and (b) the updated spec clause as context. Do not widen their scope beyond that. Loop back to step 3 after their commit.

The task stays BLOCKED until the full suite is green.

## Rationale — Mod 4: test-generator isolated from implementer code

The test-generator is the loop's lock against drift. If the subagent can see the implementer's code, its tests will fit the code — and the spec ceases to be the source of truth. By restricting the subagent's context to spec clause text plus the skeleton manifest, we force the test to verify *what the spec says*, not *what the code does*. When those two disagree, the test fails, and the task is BLOCKED on the disagreement rather than silently absorbing it.

This is why step 2 is non-negotiable about inputs. The propagation procedure is the only place in the execute loop where the spec binds code to tests; weakening its input discipline defeats the loop.

## Quick reference

| Step | Who   | Input                                    | Output                        | Gate                    |
|------|-------|------------------------------------------|-------------------------------|-------------------------|
| 1    | write | decision record + current spec           | updated spec clause           | clause committed in-mem |
| 2    | gen   | spec clause + manifest + spec doc (only) | new/overwritten test file     | test file on disk       |
| 3    | prove | full test suite                          | pass/fail verdict             | green suite unblocks    |
