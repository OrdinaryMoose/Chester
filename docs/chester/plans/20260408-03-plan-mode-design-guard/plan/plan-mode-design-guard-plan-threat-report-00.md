# Plan Threat Report: Experimental Design Skill with Formal Proof Language

**Sprint:** 20260408-03-plan-mode-design-guard
**Plan:** plan-mode-design-guard-plan-00.md
**Combined Risk Level:** Moderate

---

## Risk Assessment

The MCP server portion (Tasks 1-6) is well-structured with thorough test coverage and follows existing codebase conventions. The risk concentrates in spec deviations that need fixing before implementation and the underspecified SKILL.md (Task 7).

### Why Moderate

1. The MCP code is solid — both reviewers confirm clean architecture, proper test coverage, and pattern consistency with existing enforcement/understanding MCPs.
2. Several spec deviations exist in the plan code — fixable during implementation but must not be missed.
3. The SKILL.md (Task 7) is the highest-risk deliverable — a ~400-line file described only in prose outline. This is the control surface for the entire skill.
4. EnterPlanMode/ExitPlanMode were flagged as non-existent by the attack reviewer — this is a false positive. These are built-in Claude Code tools available in the current environment.

### Findings to Address During Implementation

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 1 | `phaseTransitionRound` initialized to 0 and never updated — weakens closure condition 5 | Medium | Accept transition round as parameter to `initializeState`, or update it on first `submit_proof_update` call |
| 2 | `lastDesignerInteractionRound` in spec state schema but missing from plan's `initializeState` | Medium | Add field to state; update on each call where designer content is processed |
| 3 | `blocks` field on OPEN elements not stored by `createElement` | Low | Add optional `blocks` field to element model |
| 4 | `source` not validated as required for GIVEN elements — Contrarian challenge may fire spuriously | Medium | Add validation: GIVEN type requires explicit `source` |
| 5 | Inline stall detection in `state.js` duplicates `detectStall` from `metrics.js` | Medium | Replace inline computation with `detectStall(next.openCountHistory)` call |
| 6 | `checkBoundaryCollision` adds direct basis IDs without filtering withdrawn status | Low | Filter basis arrays by element status before building chain sets |
| 7 | `.gitignore` should use `**/node_modules/` pattern | Low | Broader pattern fixes existing gap across all MCP server directories |
| 8 | Task 7 (SKILL.md) described in outline only — no concrete content | High | Treat as separate deliverable with its own review gate during implementation |

### EnterPlanMode/ExitPlanMode Availability (False Positive)

The attack reviewer flagged these as non-existent tools. This is incorrect — `EnterPlanMode` is a built-in Claude Code tool confirmed via ToolSearch during this session. The reviewer's subagent environment did not have the tool registry available. No action needed.

### Recommendations

- Findings 1-7 are straightforward fixes to apply during implementation of Tasks 2-5
- Finding 8 (SKILL.md) should be treated as the primary risk — the implementer should write the full SKILL.md content referencing spec sections 8.1-8.8 and the existing `design-figure-out/SKILL.md` as a structural template, then submit it for review before proceeding
