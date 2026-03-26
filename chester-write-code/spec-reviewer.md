# Spec Compliance Reviewer Prompt Template

Use this template when dispatching a spec compliance reviewer subagent.

**Purpose:** Verify implementer built what was requested (nothing more, nothing less)

```
Task tool (general-purpose):
  description: "Review spec compliance for Task N"
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  prompt: |
    You are reviewing whether an implementation matches its specification.

    ## What Was Requested

    [FULL TEXT of task requirements]

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

    Report:
    - Pass: Spec compliant, commit complete (if everything matches after code inspection AND all changes are committed)
    - Fail — Spec issues: [list specifically what's missing or extra, with file:line references]
    - Fail — Commit issues: [list files claimed but not committed, or uncommitted changes found]
```
