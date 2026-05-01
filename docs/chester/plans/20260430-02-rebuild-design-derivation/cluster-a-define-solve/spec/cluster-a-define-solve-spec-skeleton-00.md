# Skeleton Manifest — cluster-a-define-solve

**Spec:** `docs/chester/working/20260430-02-rebuild-design-derivation/cluster-a-define-solve/spec/cluster-a-define-solve-spec-00.md`
**Language detected:** JavaScript (ES modules) + Vitest
**Detection signal:** `package.json` at project root (priority 2 — TypeScript family); subproject at `skills/design-large-task/proof-mcp/package.json` declares `"test": "vitest run"`. Test stubs land alongside existing module tests in `skills/design-large-task/proof-mcp/__tests__/`.
**Note:** all 23 ACs land as `it()` blocks in a single `acceptance.test.js` file rather than per-AC files. Rationale: the existing test convention groups tests per-module (`proof.test.js`, `state.test.js`, `metrics.test.js`); a single acceptance file mirrors that convention while keeping the skeleton-to-fill churn surgical (each AC fills exactly one `it` body).

## Skeletons

| Skeleton ID                                                | Criterion | Stub path                                                                              | Status  |
|------------------------------------------------------------|-----------|----------------------------------------------------------------------------------------|---------|
| `ac-1-1-resolve-condition-registered`                      | AC-1.1    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-1-2-resolve-condition-create-valid`                    | AC-1.2    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-1-3-resolve-condition-rejects-missing-anchor`          | AC-1.3    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-1-4-resolve-condition-rejects-designer-source`         | AC-1.4    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-1-5-stale-ratification-sentinel-empty`                 | AC-1.5    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-2-1-add-concern-appends-sequential`                    | AC-2.1    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-2-2-lock-concerns-irreversible`                        | AC-2.2    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-2-3-add-concern-refused-after-lock`                    | AC-2.3    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-2-4-lock-concerns-refuses-empty`                       | AC-2.4    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-3-1-closure-refuses-unlocked-concerns`                 | AC-3.1    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-3-2-closure-refuses-empty-concerns`                    | AC-3.2    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-3-3-closure-per-concern-uncovered`                     | AC-3.3    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-3-4-closure-permits-rule-union-coverage`               | AC-3.4    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-3-5-closure-refuses-unratified-rc`                     | AC-3.5    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-4-1-ratify-single-rc-success`                          | AC-4.1    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-4-2-ratify-tool-schema-singular`                       | AC-4.2    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-4-3-ratify-rejects-non-rc`                             | AC-4.3    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-5-1-revise-statement-clears-ratification`              | AC-5.1    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-5-2-revise-anchor-clears-ratification`                 | AC-5.2    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-5-3-revise-other-preserves-ratification`               | AC-5.3    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-6-1-brief-template-has-resolve-conditions`             | AC-6.1    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-6-2-brief-template-has-concerns`                       | AC-6.2    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-7-1-five-existing-types-unchanged`                     | AC-7.1    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
| `ac-8-1-specify-skill-references-new-sections`             | AC-8.1    | `skills/design-large-task/proof-mcp/__tests__/acceptance.test.js`                      | filled  |
