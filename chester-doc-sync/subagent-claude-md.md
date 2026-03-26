# Subagent: CLAUDE.md Staleness Checker

You are checking whether per-project CLAUDE.md files are still accurate after a code session.

## Inputs

**Git diff summary (changed files grouped by project):**
{GIT_DIFF_SUMMARY}

**Reasoning audit path (if available):**
{AUDIT_PATH}

## Your Task

For each project that had files changed (from the git diff summary):

1. **Check if the project has a CLAUDE.md file** at `{PROJECT_DIR}/CLAUDE.md`. If the project has no CLAUDE.md, note this in your output as: "Project {name} has no CLAUDE.md — cannot check staleness" and move to the next project.
2. **Read the project's CLAUDE.md file**
3. **Read the changed source files** in that project (from git diff) to understand what changed
4. **If a reasoning audit is available**, read it and extract decisions relevant to this project
5. **Cross-reference** the CLAUDE.md claims against the actual changes:
   - **Responsibilities:** Does the CLAUDE.md still accurately describe what this project does? Did the session add new responsibilities not mentioned?
   - **Dependencies:** Are all dependencies listed correctly? Were new project references added or removed? Check the `.csproj` file for `<ProjectReference>` entries and compare against what CLAUDE.md lists.
   - **Constraints:** Are the constraints still valid? Did the session introduce code that violates or extends a stated constraint?
   - **Public surface:** Are new public classes, interfaces, or methods mentioned? Check for new `public` declarations in changed files.
6. **Determine staleness origin** for each finding:
   - Run `git log -1 --format=%H -- {CLAUDE_MD_PATH}` to find when the CLAUDE.md was last modified
   - Check if the staleness was **caused by this session's changes** or was **pre-existing** (the CLAUDE.md was already stale before the session started)
   - Tag each finding as `[sprint-caused]` or `[pre-existing]` in the output
   - Pre-existing staleness is still worth reporting, but should be clearly distinguished so the user knows what they introduced vs. what they inherited

## Error Handling

- If a CLAUDE.md file does not exist for a touched project, note it but do not error — this itself may be a finding worth reporting
- If a `.csproj` file cannot be read, skip the dependency check for that project and note the skip

## What NOT to Flag

- Changes to internal/private implementation details that don't affect the CLAUDE.md's claims
- Test file changes (test projects have their own CLAUDE.md files — only flag if the test project's CLAUDE.md is stale)
- Formatting or style changes

## Output Format

Follow the finding format defined in `~/.claude/skills/chester-doc-sync/report-template.md` under "CLAUDE.md Staleness Findings". Use finding IDs C-1, C-2, etc. Severity values: `contradicted` (doc actively wrong) or `stale` (doc missing information).

If no findings, return:

```
No CLAUDE.md staleness found for the affected projects.
```
