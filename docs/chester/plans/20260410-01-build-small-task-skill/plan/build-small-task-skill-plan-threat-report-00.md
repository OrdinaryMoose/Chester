# Plan Threat Report: design-small-task

## Combined Implementation Risk: Low

The plan implements a self-contained SKILL.md, a reference template, registration in setup-start, and a vocabulary mapping update. No shared state, no concurrency, no runtime execution.

## Risk Rationale

1. **The core deliverable is low-risk.** Task 1 (SKILL.md) and Task 3 (small template) are new file creation with no modification to existing behavior. They cannot break existing skills.

2. **Task 2 (setup-start registration) and Task 4 (vocabulary mapping) are additive edits** to existing files — inserting new lines without modifying existing content. Low regression risk.

3. **The budget guard test was identified as already broken** (references nonexistent `skills/finish/SKILL.md`, grep patterns don't match most listed skills). The plan drops the test modification entirely rather than layering a workaround on a broken foundation. The broken test is pre-existing tech debt, not introduced by this plan.

4. **The routing hint "Quick design check for X" may not match actual invocation patterns** — the skill is designed for mid-conversation invocation, not cold-start. Minor phrasing issue; does not affect functionality.

5. **The simplified brief format intentionally departs from the full template** and is now properly documented via the new `util-design-brief-small-template` skill and vocabulary mapping update in the full template.

## Findings Summary

| Source | Finding | Severity | Disposition |
|--------|---------|----------|-------------|
| plan-attack | Budget guard test already broken | HIGH | Mitigated: dropped Task 3, test is pre-existing debt |
| plan-attack | Brief format departs from canonical template | LOW | Mitigated: new util-design-brief-small-template created |
| plan-attack | Line number references fragile | MEDIUM | Accepted: plan uses content-based location guidance |
| plan-attack | Routing hint style mismatch | LOW | Accepted: minor phrasing, functional |
| plan-smell | HTML comment hack for test | MEDIUM | Mitigated: task removed entirely |
| plan-smell | Test references nonexistent file | LOW | Not in scope: pre-existing |
| plan-smell | Three-location registration | LOW | Accepted: existing pattern, correctly followed |
| plan-smell | Routing hint tension | LOW | Accepted: minor, documented |
