# Test Generator Subagent Prompt Template

Use this template when dispatching a test-generator subagent from the propagation procedure (step 2 of `propagation-procedure.md`). The subagent writes a single failing-then-passing test derived from the updated spec clause — and nothing else.

**Purpose:** translate a spec clause into a concrete test in the project's test framework, with zero code-fit bias.

## Input Context Rules (STRICTLY ENFORCED)

**Inputs that MUST be provided:**
- The updated spec clause text (the just-revised or newly-added AC block from step 1).
- The skeleton manifest (`spec/{sprint-name}-spec-skeleton-00.md`) so the subagent knows the skeleton ID and stub path.
- The existing spec document (for cross-references between criteria and shared terminology).

**Inputs that MUST NOT be provided (spec-only, not code):**
- The implementer's code diff.
- Any existing test code written by the implementer.
- The implementer's report or decision narrative.
- Any reference to files in the implementation tree outside the test directory.

If the controller is tempted to include "just a bit" of implementation context "for efficiency," STOP. The input restriction is the whole point of Mod 4 — spec-driven test generation prevents code-fit bias. Tests verify the spec, not the implementation. If the spec is ambiguous, fix the spec (loop back to step 1), don't leak code into the subagent.

## Template

**Fork policy: isolated — MANDATORY.** Dispatch via the named `chester:execute-write-test-generator` subagent. Named subagents do not fork. Forking would defeat the input restriction (the agent must NOT see implementer code) and break the loop's anti-drift lock. Any change to fork mode here is a contract violation.

```
Task tool (chester:execute-write-test-generator):
  description: "Generate test for {skeleton-id}"
  prompt: |
    Generate a single test that verifies the acceptance criterion described below.

    ## Spec Clause (source of truth)

    [FULL TEXT of the updated/new AC block — paste verbatim, including observable
     boundary, Given/When/Then, and the test skeleton ID.]

    ## Skeleton Manifest (for stub path + ID)

    [FULL TEXT of the relevant manifest row(s) — skeleton ID, criterion, stub path,
     status. Include the language/detection-signal header so the subagent knows
     which test framework to target.]

    ## Existing Spec Document (for cross-references only)

    [FULL TEXT or link to the current spec at spec/{sprint-name}-spec-NN.md.
     The subagent may read other AC blocks for shared terminology, but MUST NOT
     infer behavior that is not stated in the target clause.]

    ---

    ## Context

    You are generating a test for a specific acceptance criterion. Your test is
    the binding between spec and code — when this test fails, the task is blocked
    until spec and code agree.

    ## Critical Input Restriction

    You have been deliberately given the spec and the manifest — and nothing else.

    **You MUST NOT:**
    - Read the implementer's code.
    - Read any existing test files written by the implementer.
    - Look at recent commits or diffs.
    - Infer behavior from anything other than the spec clause.

    **You MUST:**
    - Derive the test from the spec clause's observable boundary and Given/When/Then.
    - Use the test framework indicated by the skeleton manifest's detection signal.
    - Name the test exactly as the skeleton ID says: `ac-{N-M}-{slug}`.

    If the spec clause is ambiguous, unclear, or internally contradictory — STOP
    and report NEEDS_CONTEXT. Do not guess. Do not read code to disambiguate.
    The controller will loop back to step 1 (spec-clause update).

    ## Your Job

    1. Read the spec clause carefully. Identify the observable boundary.
    2. Read the skeleton manifest row. Note the stub path and language.
    3. Write a test at the stub path (overwriting the pending stub, or adding a
       new file if the clause is a suffix-refinement).
    4. The test must:
       - Be named exactly `ac-{N-M}-{slug}` (matching the skeleton ID).
       - Assert the observable boundary from the spec clause.
       - Use the Given/When/Then as the arrange/act/assert structure.
       - Fail loudly if the boundary is violated, pass if met.
    5. Do NOT commit — the controller commits after step 3 of propagation passes.
    6. Report back.

    ## Report Format

    ### Test Generation Report

    **Status:** DONE | NEEDS_CONTEXT | BLOCKED

    ### Test File
    - path: `{absolute path to test file}`
    - test name: `ac-{N-M}-{slug}`
    - framework: {rust | typescript | python | bash | other}

    ### Spec Clause Coverage
    - observable boundary → assertion(s) mapped line by line

    ### Concerns
    - (only if Status is NEEDS_CONTEXT or BLOCKED)

    Use NEEDS_CONTEXT if the spec clause is ambiguous — DO NOT resolve ambiguity
    by reading code. Use BLOCKED if you cannot write the test for structural
    reasons (e.g., the test framework indicated in the manifest is not installed).
```

## Stylistic Notes

This template mirrors the structure of `implementer.md` and `spec-reviewer.md`: description line, prompt body with Context / Critical / Your Job / Report Format sections, and an explicit Report Format block. Keep new edits consistent with that house style so controllers can dispatch test-generator, implementer, and reviewer subagents against the same mental model.
