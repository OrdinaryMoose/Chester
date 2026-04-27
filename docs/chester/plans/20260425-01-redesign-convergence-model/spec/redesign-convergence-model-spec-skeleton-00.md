# Skeleton Manifest — redesign-convergence-model

**Spec:** `spec/redesign-convergence-model-spec-00.md`
**Language detected:** bash
**Detection signal:** existing `tests/*.sh` convention overrides `package.json` priority

## Detection Override Note

Skeleton-generator priority order ranks `package.json` (priority 2 → TypeScript) above `tests/*.sh` (priority 4 → bash). Chester's repository has both: `package.json` exists at root for the MCP server's npm dependency (`@modelcontextprotocol/sdk`), but the actual test framework is bash — every existing test in `tests/` is a `.sh` script, no `npm test` script is configured, and both architects in design-specify chose bash for the new test files. Skeletons emitted as bash to match implementation reality and codebase convention.

## Skeletons

| Skeleton ID                              | Criterion | Stub path                                | Status  |
|------------------------------------------|-----------|------------------------------------------|---------|
| `ac-1-1-c1-section-present`              | AC-1.1    | `tests/test-partner-role-discipline.sh`  | pending |
| `ac-1-2-c2-section-present`              | AC-1.2    | `tests/test-partner-role-discipline.sh`  | pending |
| `ac-1-3-c2-before-after-example`         | AC-1.3    | `tests/test-partner-role-discipline.sh`  | pending |
| `ac-1-4-self-evaluation-extended`        | AC-1.4    | `tests/test-partner-role-discipline.sh`  | pending |
| `ac-1-5-composition-note`                | AC-1.5    | `tests/test-partner-role-discipline.sh`  | pending |
| `ac-2-1-group-saturation-history`        | AC-2.1    | `tests/test-understanding-telemetry.sh`  | pending |
| `ac-2-2-transition-history`              | AC-2.2    | `tests/test-understanding-telemetry.sh`  | pending |
| `ac-2-3-warnings-history`                | AC-2.3    | `tests/test-understanding-telemetry.sh`  | pending |
| `ac-2-4-existing-telemetry-unchanged`    | AC-2.4    | `tests/test-understanding-telemetry.sh`  | pending |
| `ac-3-1-session-metadata-written`        | AC-3.1    | `tests/test-session-metadata.sh`         | pending |
| `ac-3-2-session-metadata-fields`         | AC-3.2    | `tests/test-session-metadata.sh`         | pending |
| `ac-4-1-large-task-cross-refs`           | AC-4.1    | `tests/test-partner-role-discipline.sh`  | pending |
| `ac-4-2-small-task-cross-ref`            | AC-4.2    | `tests/test-partner-role-discipline.sh`  | pending |
| `ac-5-1-translation-gate-passes`         | AC-5.1    | `tests/test-partner-role-discipline.sh`  | pending |
| `ac-5-2-existing-mechanisms-unchanged`   | AC-5.2    | `tests/test-partner-role-discipline.sh`  | pending |

Status `pending` flips to `filled` when execute-write writes real test bodies.
