# Spec Compliance Reviewer Prompt Template

Use this template when dispatching a spec compliance reviewer subagent.

**Purpose:** Verify implementer built what was requested (nothing more, nothing less)

**Fork policy: isolated.** Dispatch via the named `chester:execute-write-spec-reviewer` subagent so this review never inherits the implementer's framing — independence is the whole safeguard. Named subagents do not fork even when `CLAUDE_CODE_FORK_SUBAGENT=1` is set.

```
Task tool (chester:execute-write-spec-reviewer):
  description: "Review spec compliance for Task N"
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  prompt: |
    [FULL TEXT of task requirements]

    ---

    Review whether the implementation matches the task requirements above.

    ## What Implementer Claims They Built

    [From implementer's report]

    ## CRITICAL: Do Not Trust the Report

    The implementer finished suspiciously quickly. Their report may be incomplete,
    inaccurate, or optimistic. You MUST verify everything independently.

    **DO NOT:**
    - Take their word for what they implemented
    - Trust their claims about completeness
    - Accept their interpretation of requirements

    **DO:**
    - Read the actual code they wrote
    - Compare actual implementation to requirements line by line
    - Check for missing pieces they claimed to implement
    - Look for extra features they didn't mention

    ## Your Job

    Read the implementation code and verify:

    **Missing requirements:**
    - Did they implement everything that was requested?
    - Are there requirements they skipped or missed?
    - Did they claim something works but didn't actually implement it?

    **Extra/unneeded work:**
    - Did they build things that weren't requested?
    - Did they over-engineer or add unnecessary features?
    - Did they add "nice to haves" that weren't in spec?

    **Misunderstandings:**
    - Did they interpret requirements differently than intended?
    - Did they solve the wrong problem?
    - Did they implement the right feature but wrong way?

    **Verify by reading code, not by trusting report.**

    ## Commit Verification

    Run `git diff <BASE_SHA>..<HEAD_SHA> --stat` to see what files are actually in the implementer's commit(s). Run `git status` to check for uncommitted changes.

    - Compare committed files against the implementer's claimed file list
    - If the implementer claims to have changed a file that is NOT in the commit, report as a Commit issue
    - If `git status` shows uncommitted changes related to the task, report as a Commit issue

    Verify by checking git, not by trusting the report.

    ## Decision-Record Alignment

    **Applies only if decision records were created during this task.** For every
    decision record created during this task (visible via `dr_query` with filter
    `{sprint_subject, status: Active}` or by checking the store file):

    - Verify the record's `Spec Update` field text matches the spec clause that
      was updated — read the current spec; confirm the clause exists with the
      referenced AC ID and that the wording aligns.
    - Verify the record's `Test` field carries a SHA suffix (format:
      `{test_name} @ {commit_sha}`). If the SHA is missing, the implementer
      forgot to call `dr_finalize_refs` after commit — flag as a Commit-level
      issue.
    - Verify the record's `Code` field carries a SHA suffix similarly
      (`{file:line} @ {commit_sha}`); flag missing SHAs as a Commit-level issue.

    ## Confidence Scoring

    Every issue gets a confidence score (0–100) reflecting how certain you are
    that it's a real problem, not a false positive or misunderstanding:

    - **0–25**: Might be a false positive or pre-existing issue — don't report
    - **25–50**: Possibly real but could be a misread of requirements — don't report
    - **50–79**: Likely real but minor or ambiguous — don't report
    - **80–100**: Verified real issue that impacts spec compliance — REPORT

    Only report issues scoring ≥ 80. This filters noise so the orchestrator
    focuses on findings you've actually verified against the code and spec.
    Include your confidence score with each issue.

    Report format:

    ## Spec Review: [task name]

    **Verdict:** Pass | Fail

    ### Issues
    - **[Spec|Commit]** | **[confidence]** | `location` | finding | evidence

    ### Verified
    - `location` | requirement met

    Omit Issues section if Verdict is Pass. Omit Verified section if empty.
```
