# Skeleton Generator

Language-aware procedure that scaffolds a failing test stub for every acceptance criterion in the spec. Run at `design-specify` time, after the spec's Acceptance Criteria section is frozen. Output lands in the project's test tree; an index manifest is written to `spec/{sprint-name}-spec-skeleton-00.md` (per `util-artifact-schema`'s `spec-skeleton` artifact type).

## 1. Detection Procedure

Walk the project root and pick the first match. Stop at the first hit — do not merge toolchains.

| Priority | Signal                                | Language   | Test directory (default)   |
|----------|---------------------------------------|------------|----------------------------|
| 1        | `Cargo.toml` at project root          | Rust       | `tests/` or `src/*_test.rs`|
| 2        | `package.json` at project root        | TypeScript | `test/` or `__tests__/`    |
| 3        | `pyproject.toml` at project root      | Python     | `tests/`                   |
| 4        | first `.sh` file under `tests/`       | Bash       | `tests/`                   |
| 5        | none of the above                     | Unknown    | (markdown fallback)        |

If more than one signal fires, prefer the higher-priority one and note the choice in the manifest.

**Unknown fallback:** emit a plain markdown skeleton stub (`spec/skeletons/ac-{N-M}-{slug}.md`) and flag the fallback to the user — the designer must confirm the test framework before execute-write runs.

## 2. Per-Language Stub Generation

Each skeleton is a single failing test named for the criterion. The test name (function, `it(...)` label, or function identifier) is exactly the skeleton ID: `ac-{N-M}-{slug}`. Slugs are kebab-case derived from the AC short name.

### Rust

```rust
#[test]
fn ac_1_1_empty_input_rejected() {
    todo!("AC-1.1 — empty input rejected");
}
```

Landing path: `tests/ac_1_1_empty_input_rejected.rs` (one file per criterion keeps diff churn minimal) or append to an existing `tests/acceptance.rs` if the crate prefers a single integration target.

### TypeScript

```ts
it('ac-1-1-empty-input-rejected', () => {
  throw new Error('pending: AC-1.1 — empty input rejected');
});
```

Landing path: `test/acceptance/ac-1-1-empty-input-rejected.test.ts`.

### Python

```python
import pytest

def test_ac_1_1_empty_input_rejected():
    pytest.skip("pending: AC-1.1 — empty input rejected")
```

Landing path: `tests/test_ac_1_1_empty_input_rejected.py`.

### Bash

```bash
test_ac_1_1_empty_input_rejected() {
  echo "pending: AC-1.1 — empty input rejected"
  return 1
}
```

Landing path: append to `tests/test-acceptance.sh` or write `tests/test-ac-1-1-empty-input-rejected.sh`. Bash stubs intentionally `return 1` so the harness sees a failing test until execute-write fills them in.

### Unknown (markdown fallback)

```markdown
# Skeleton: ac-1-1-empty-input-rejected

AC-1.1 — empty input rejected. No language detected; re-run after test framework is chosen.
```

## 3. Where Stubs Land

- Stub files live in the project's normal test directory so the existing test runner discovers them without configuration.
- One stub per criterion keeps propagation diffs surgical (execute-write edits exactly one file per FIRE event).
- If an AC block is split or refined later, the new suffix ID (`AC-1.1a`) gets its own stub — the old stub is never renamed.

## 4. Skeleton Manifest Format

The manifest is the index execute-write consults during propagation. Write it to `spec/{sprint-name}-spec-skeleton-00.md` (the `spec-skeleton` artifact type in `util-artifact-schema`).

```markdown
# Skeleton Manifest — {sprint-name}

**Spec:** `spec/{sprint-name}-spec-NN.md`
**Language detected:** {rust|typescript|python|bash|unknown}
**Detection signal:** {Cargo.toml | package.json | pyproject.toml | tests/*.sh | none}

## Skeletons

| Skeleton ID                    | Criterion | Stub path                                   | Status  |
|--------------------------------|-----------|---------------------------------------------|---------|
| `ac-1-1-empty-input-rejected`  | AC-1.1    | `tests/ac_1_1_empty_input_rejected.rs`      | pending |
| `ac-1-2-whitespace-trimmed`    | AC-1.2    | `tests/ac_1_2_whitespace_trimmed.rs`        | pending |
```

`Status` is `pending` at scaffold time and flips to `filled` once execute-write's `test-generator` subagent writes the real test body. The propagation procedure reads this manifest to know which skeletons still need filling.
