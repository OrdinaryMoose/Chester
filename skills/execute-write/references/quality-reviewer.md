# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

**Fork policy: isolated.** Dispatch via the named `chester:execute-write-quality-reviewer` subagent. Named subagents do not fork — quality review needs to evaluate the diff without inheriting the implementer's "we built it well" narrative.

```
Task tool (chester:execute-write-quality-reviewer):
  description: "Quality review for Task N"
  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)

**Confidence scoring:** The code reviewer scores every issue 0–100 for confidence and only reports issues scoring ≥ 80. This filters false positives and nitpicks — fewer high-confidence findings are more actionable than a long list of maybes. Each reported issue includes its confidence score alongside the severity level.

**Code reviewer returns:** Verdict, Strengths, Issues (Critical/Important/Minor with confidence scores), Recommendations — all in structured row format
