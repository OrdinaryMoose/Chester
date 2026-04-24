# Ground-Truth Review Report: Decision-Record / Constraint-Triangle System

**Sprint:** 20260424-01-build-decision-loop
**Spec reviewed:** `build-decision-loop-spec-01.md` (initial pass); `build-decision-loop-spec-02.md` (re-review after fixes)
**Review date:** 2026-04-24
**Outcome:** Clean after one iteration

---

## Initial Review (against spec-01)

**Status:** 2 HIGH + 3 MEDIUM + 1 LOW findings.

### Verified Claims

Baseline infrastructure all confirmed present:
- `skills/execute-write/` and its `references/` subagent templates (`implementer.md`, `spec-reviewer.md`, `quality-reviewer.md`, `code-reviewer.md`)
- `skills/design-specify/SKILL.md` Writing-the-Spec section
- `skills/plan-build/references/plan-template.md` structure (86 lines)
- `skills/finish-write-records/SKILL.md` Feature Mode section
- `skills/execute-verify-complete/SKILL.md` three-step sequence (suite-pass → clean-tree → checkpoint commit)
- `skills/execute-test/SKILL.md` and `skills/execute-prove/SKILL.md` existence and roles
- `skills/util-artifact-schema/SKILL.md` path conventions
- `skills/design-large-task/proof-mcp/` structure (~996 LOC total) as MCP template
- `skills/design-large-task/understanding-mcp/` as second MCP template
- `.claude-plugin/mcp.json` with 2 existing entries in expected format
- `bin/chester-config-read` exports (`CHESTER_WORKING_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`)
- No top-level `mcp/` directory exists today (free for the new convention)
- `docs/chester/plans/` and `docs/chester/working/` exist as siblings

### Findings

**HIGH-1 — Directory collision at `/docs/chester/decision-record/`.**
Spec-01 claimed the store was a single flat markdown file at `/docs/chester/decision-record.md` with "no directory is used" (AC-6.1). Codebase showed an empty directory at `/docs/chester/decision-record/` (no extension) already existing in the repository from earlier exploratory work. On Linux the directory and an adjacent `.md` file can coexist, but AC-6.1 explicitly forbids the directory — discrepancy lives in the filesystem state.

*Impact:* implementer would hit a pre-existing directory that AC-6.1 prohibits, needing designer clarification at implementation time if not resolved in the spec.

**HIGH-2 — Hook surface outdated in parent brief.**
The parent brief's Evidence section (EVID-6) stated "Chester's plugin hook surface is SessionStart only." Codebase showed `hooks/hooks.json` on main still has SessionStart + PreCompact + PostCompact registered — the compaction-hooks revert is unmerged from the `refactor-chester-skills` branch.

*Impact:* any implementer who reads the brief before reading code will form an inaccurate mental model. Since the decision-record design does not depend on hook surface, the spec itself is structurally unaffected, but the claim should be qualified.

**MEDIUM-1 — Wrong setup-start file path.**
Spec-01 said "`skills/setup-start/SKILL.md` Available-skills list gains one-line reference." Codebase showed `setup-start/SKILL.md` delegates catalog to `references/skill-index.md` (line 202 of SKILL.md). The actual catalog file is `skill-index.md`, not `SKILL.md`.

*Impact:* implementer looking in `SKILL.md` would find no such list. Edit must go in `references/skill-index.md`.

**MEDIUM-2 — "Section 2.1.5" conceptual, not literal.**
Spec-01 said "New Section 2.1.5 inserted between existing step 2 (implementer status handling) and step 3 (spec reviewer dispatch)." `execute-write/SKILL.md` has Section 2.1 "Dispatch Pattern" with an ordered list of steps 1–6. Sibling sections 2.2, 2.3 would collide with a `2.1.5` heading.

*Impact:* the insertion is structurally coherent, but the exact style (new numbered step vs nested sub-heading) needs implementer clarification.

**MEDIUM-3 — `memory.md` does not exist in Chester repo.**
Spec-01 said the store follows "memory.md-style single-file layout." No `memory.md` exists anywhere in the Chester repo; the memory.md convention referenced is Claude Code's user-memory file at `~/.claude/projects/.../MEMORY.md`, not in the Chester repo.

*Impact:* analogy is accurate in spirit but misleading as a template reference. Implementer cannot look at a Chester memory.md for example.

**LOW — `skills/plan-build/plan-reviewer.md` asymmetric layout.**
`plan-reviewer.md` lives at the skill root (not under `references/`), while `plan-template.md` and `smell-triggers.md` are under `references/`. Asymmetric layout, noted for implementer awareness. No spec claim was wrong.

---

## Re-Review (against spec-02)

**Status:** Clean

### Resolution of Prior Findings

- **HIGH-1 (directory collision):** ADDRESSED. Spec-02 adds dedicated "Pre-existing empty directory collision" paragraph in the Persistent Decision Store section. First implementation task must run `rmdir docs/chester/decision-record` before any MCP tool call. AC-6.1 was revised to include the directory-removal requirement as a Given precondition and an explicit Then outcome ("no directory exists at `/docs/chester/decision-record/` at implementation completion"). The fix is concrete and testable.

- **HIGH-2 (hook surface):** ADDRESSED. Spec-02 adds a "Hook-surface note" to the Architecture section explicitly stating the brief's EVID-6 claim reflects the `refactor-chester-skills` branch state, noting main still has PreCompact/PostCompact registered, and asserting the design does not depend on hook surface. Implementer is instructed not to treat "SessionStart only" as a pre-condition.

- **MEDIUM-1 (skill-index path):** ADDRESSED. Spec-02 changes the reference to `skills/setup-start/references/skill-index.md` with an explicit note that the catalog lives in the index file, not in `SKILL.md`.

- **MEDIUM-2 (Section 2.1.5):** ADDRESSED. Spec-02 rephrases as: "Section 2.1 (Dispatch Pattern) currently has an ordered list of steps 1–6. Insert a new numbered step between current step 2 (Handle implementer status codes) and current step 3 (Dispatch spec compliance reviewer), renumbering subsequent steps accordingly." All downstream references to "Section 2.1.5" updated to "the trigger-check step" / "the new trigger-check step." Zero orphan references remain.

- **MEDIUM-3 (memory.md):** ADDRESSED. Analogy removed; spec-02 describes the layout directly as "single-file layout: all records append into the one file as H2 sections." Zero orphan "memory.md-style" references in body prose.

### New Findings

None. No regressions introduced by the edits.

---

## Final Risk Assessment

Spec-02 is ready for the user review gate. Both HIGH findings have concrete, verifiable resolutions:

- HIGH-1 is addressed with a named setup task and an AC that tests for the absence of the directory post-implementation.
- HIGH-2 is addressed with an explicit design-independence statement — the decision-record architecture is hook-surface-agnostic, so the outdated brief claim doesn't propagate into the implementation.

All three MEDIUM fixes match the repo's actual state (verified). The cross-reference table still resolves. Acceptance criteria still map to brief NCs cleanly. No drift introduced by the edits.

Spec is ready to proceed.
