## Adversarial Review: Skill Directory Rename Plan

**Implementation Risk: Low**

Agents: Structural Integrity, Execution Risk, Assumptions & Edge Cases, Migration Completeness, API Surface Compatibility, Concurrency & Thread Safety, Bloaters & Dispensables, Couplers & OO Abusers, Change Preventers, SOLID Violations.

### Findings

- **Critical** | `chester-hooks/session-start` | Task 3's `find` glob (`-name "*.md" -o -name "*.sh"`) does not match this file — it has no extension. Contains 4 references to `chester-start` and `chester-hooks` that will NOT be updated. Fix: add `-o -name "session-start"` to the find command, or process this file explicitly. | source: Structural, Concurrency

- **Serious** | `~/.claude/settings.json:17` | Hook path `/home/mike/.claude/skills/chester-hooks/session-start` breaks after Task 1 (directory rename) but isn't updated until Task 6. Any new Claude Code session started between Tasks 1-5 will fail to load Chester. Fix: move Task 6 immediately after Task 1. | source: Execution, Concurrency

- **Serious** | `docs/README.md:65` | References `chester-doc-sync` as a utility skill, but this directory does not exist. Pre-existing dead reference the plan should clean up since it's already editing this file. | source: Bloaters

- **Serious** | Plan Task 5 mapping table | Lists only 16 of 18 skill names — missing `chester-start-debug` → `chester-setup-start-debug`. The sed commands in Tasks 3 and 7 DO include it, so the gap is in Task 5's manual guidance only. | source: Bloaters

- **Minor** | `sed \b` word boundary behavior | `chester-start\b` matches `chester-start-debug` in GNU sed BRE mode. However, longest-first ordering means `chester-start-debug` is already replaced before `\b` runs. Empirically verified: `chester-setup-start-debug` is NOT matched by `chester-start\b`. Non-issue in practice. | source: Assumptions [downgraded after cross-agent verification]

- **Minor** | Task 3 `$FILES` variable | Used unquoted in sed commands. Safe for current filenames (no spaces) but fragile. | source: Concurrency

### Assumptions

| # | Assumption | Status | Evidence |
|---|-----------|--------|----------|
| 1 | chester-hooks has no SKILL.md | TRUE | `find` confirms 17 SKILL.md files across 18 dirs |
| 2 | Longest-first ordering prevents partial matches | TRUE | Empirically verified: `chester-setup-start-debug` not matched by `chester-start\b` |
| 3 | No files outside plan scope reference old names | TRUE | Comprehensive grep confirms only CLAUDE.md, docs/README.md, tests/, settings.json |
| 4 | chester-log-usage.sh has no skill name references | TRUE | File contains no chester- skill references |
| 5 | docs/ history files don't need updating | TRUE (by design) | Historical artifacts; old names are expected and correct |

### Risk Rationale

- The two actionable findings (session-start glob gap and settings.json ordering) are both simple, localized fixes that don't change the plan's structure
- The dead `chester-doc-sync` reference is pre-existing cleanup, not a plan defect
- The Task 5 mapping table gap is documentation-only — the actual sed commands are correct
- Change Preventers noted that embedding phase names in directories makes future reclassification expensive, but this is inherent to the design decision approved in the spec, not a plan defect
