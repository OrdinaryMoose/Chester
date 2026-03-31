# Spec: Chester Runtime Token Reduction

**Sprint:** token-use-limits
**Date:** 2026-03-27

## 1. Goal

Reduce Chester's per-pipeline token consumption by consolidating subagent launches. Target: 37% fewer subagent launches (43→27 for a 10-task plan), saving ~320K tokens per pipeline run.

## 2. Changes

### 2.1 Reviewer Consolidation (chester-write-code)

**Current state:** Each task dispatches 3 sequential subagents:
1. Implementer — writes code, tests, commits
2. Spec compliance reviewer — verifies implementation matches requirements
3. Code quality reviewer — checks code quality, architecture, testing

**New state:** Each task dispatches 2 sequential subagents:
1. Implementer — unchanged
2. Combined reviewer — runs spec compliance check then code quality check in a single subagent

#### 2.1.1 Combined Reviewer Template

Create `chester-write-code/combined-reviewer.md` with two phases:

**Phase 1 — Spec Compliance:**
- Read the actual code via `git diff BASE_SHA..HEAD_SHA`
- Verify all requirements are implemented (nothing missing, nothing extra)
- Check implementer's report against actual code (do not trust the report)
- Verify commit integrity (`git status` for uncommitted changes)

**Phase 2 — Code Quality:**
- Assess code quality, architecture, testing against the checklist from the existing code-reviewer template
- Categorize issues by severity: Critical, Important, Minor

**Output format:** Two sections in a single report:

```
## Spec Compliance
- Status: Pass | Fail
- Missing requirements: [list]
- Extra/unneeded work: [list]
- Commit issues: [list]

## Code Quality

### Strengths
[specific positives]

### Issues

#### Critical (Must Fix)
[bugs, security, data loss]

#### Important (Should Fix)
[architecture, missing features, test gaps]

#### Minor (Nice to Have)
[style, optimization, docs]

### Assessment
Ready to proceed: Yes | No | With fixes
```

The orchestrator parses this report the same way it currently handles two separate reports — spec compliance pass/fail first, then severity-based action on quality issues.

#### 2.1.2 SKILL.md Changes

In `chester-write-code/SKILL.md`, Section 2.1 "Dispatch Pattern":

- **Current steps 3 and 4** (dispatch spec reviewer, then dispatch quality reviewer) merge into a single **step 3** (dispatch combined reviewer)
- The combined reviewer receives: full task requirements, implementer's report, BASE_SHA, HEAD_SHA
- Severity-based handling unchanged: Critical must fix, Important should fix, Minor note and move on
- The sequential gate is preserved: combined reviewer only dispatches after implementer reports DONE
- **Step numbering shifts:** current step 5 (record SHA) becomes step 4, current step 6 (update task) becomes step 5

#### 2.1.3 Files Removed

- `chester-write-code/spec-reviewer.md` — content absorbed into combined-reviewer.md
- `chester-write-code/quality-reviewer.md` — content absorbed into combined-reviewer.md

#### 2.1.4 Files Unchanged

- `chester-write-code/implementer.md` — no changes
- `chester-write-code/code-reviewer.md` — this is the end-of-plan full review template, not the per-task reviewer. Unchanged.

### 2.2 Hardening Consolidation

Specified in the existing plan at `plan/agent-call-consolidation.md`. Included here for completeness — the implementation plan should cover both.

- `chester-attack-plan`: 6 agents → 3 agents
- `chester-smell-code`: 4 agents → 2 agents
- `chester-doc-sync`: 3 agents → 2 agents

## 3. Token Impact Summary

| Phase | Current agents | New agents | Baseline saved |
|-------|---------------|------------|----------------|
| attack-plan | 6 | 3 | ~60K |
| smell-code | 4 | 2 | ~40K |
| write-code (10 tasks) | 30 | 20 | ~200K |
| doc-sync | 3 | 2 | ~20K |
| **Total** | **43** | **27** | **~320K** |

## 4. Constraints

- The combined reviewer must produce findings in both dimensions (spec compliance AND code quality) before reporting. It cannot skip one.
- The combined reviewer must read actual code via git diff, not trust the implementer's report.
- The implementer template is not modified — the self-review step remains as a first line of defense.
- The end-of-plan full code review (code-reviewer.md) is not affected by this change.

## 5. Non-Goals

- Reducing implementer subagent count (1 per task is the minimum)
- Reducing baseline per-agent overhead (~20K from Claude Code system prompt)
- Modifying task management behavior
- Addressing orchestrator context accumulation (deferred pending Sprint 052 data)
- Cleaning up Think/Sequential thinking references in skill text (separate housekeeping)

## 6. Testing Strategy

- Run a plan execution after implementation and compare subagent count against baseline
- Verify combined reviewer catches the same class of issues as the two separate reviewers by reviewing its output on a real task
- Compare Sprint 052 diagnostic token logs (before) against a post-change run (after)

## 7. Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Combined reviewer less thorough per dimension | Medium | Medium | Prompt explicitly separates two phases with mandatory output for each |
| Combined prompt too large, eroding savings | Low | Low | Both existing prompts are small; combined is well under ~20K baseline |
| Orchestrator can't parse combined report format | Low | High | Output format uses distinct section headers; parsing logic is simple string matching |
