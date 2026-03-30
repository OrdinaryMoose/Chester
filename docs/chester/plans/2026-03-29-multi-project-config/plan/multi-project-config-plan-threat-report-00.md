# Adversarial Review: Multi-Project Config

**Implementation Risk: Moderate**

Agents: Structural Integrity, Execution Risk, Assumptions & Edge Cases, Migration Completeness, API Surface Compatibility, Concurrency & Thread Safety, Bloaters & Dispensables, Couplers & OO Abusers, Change Preventers, SOLID Violations.

## Findings

- **Critical** | `chester-figure-out/SKILL.md:13`, `chester-build-spec/SKILL.md:13`, `chester-build-plan/SKILL.md:15`, `chester-write-code/SKILL.md:15`, `chester-finish-plan/SKILL.md:15` | Budget guard reads hardcoded to old path `~/.claude/.chester/.settings.chester.json` — 5 skills silently lose budget enforcement | source: Migration Completeness, API Surface, Execution Risk, Change Preventers | **Mitigated: Task 5 added**
- **Serious** | `tests/test-chester-config.sh:4`, `tests/test-integration.sh:34` | Two test files hardcode old user config path — will fail after implementation | source: Structural Integrity, Execution Risk, Migration Completeness | **Mitigated: Task 6 added**
- **Minor** | `chester-figure-out/visual-companion.md` | References `.chester/brainstorm/` — stale documentation | source: Migration Completeness | **Mitigated: Task 7 added (file removed)**

## Risk Rationale

- One critical gap (budget guard in 5 skills) addressed by adding Task 5 — mechanical find-and-replace
- Two orphaned test files addressed by adding Task 6
- Visual companion removal added as Task 7 per user request
- Concurrency race conditions on first-run are pre-existing, not introduced by this plan
- No architectural issues — the plan's core approach is sound
- All findings independently addressable, no compounding risk