# Plan Document Template

The exact Markdown structure plan-build writes into the `plan/` subdirectory.
Read this file when assembling the plan document. Two parts: the document
header (once, at the top) and the task structure (repeated per task).

## Part 1 — Plan Document Header

Every plan MUST start with this header:

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use execute-write (recommended) or execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Part 2 — Task Structure

Each task in the plan follows this shape. Substitute language-appropriate test
and build commands (the example uses Python / pytest; use whatever fits the
project — `dotnet test`, `npm test`, `go test`, etc.):

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## Conventions Encoded in the Template

- **Checkbox syntax (`- [ ]`)** — execute-write reads these as task state. Don't
  drop the checkboxes or change them to bullets; the executor relies on them.
- **Files block at the top of each task** — `Create` / `Modify` / `Test` lines
  with exact paths and (for modifications) line ranges. Vague paths break
  execute-write and plan-attack's verification.
- **Five-step TDD shape per task** — failing test → confirm fail → minimal impl
  → confirm pass → commit. Adapt the language but not the order; the order
  enforces the test-first discipline that execute-test gates against.
- **Concrete commands** — `Run:` lines are exact shell strings the executor
  copies. Don't write "run the tests" — write the command that runs them.
- **One commit per task** — task boundary = commit boundary. Lets the executor
  checkpoint cleanly and lets plan-smell reason about diff blast radius per task.
