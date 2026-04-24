# Plan Document Template

The exact Markdown structure plan-build writes into the `plan/` subdirectory.
Read this file when assembling the plan document. Two parts: the document
header (once, at the top) and the task structure (repeated per task).

The template is **loop-optimized** — per-task fields (`Type`, `Implements`,
`Decision budget`, `Must remain green`) carry the information execute-write
and plan-attack need to gate the build-decision loop without re-reading the
spec for each task.

## Part 1 — Plan Document Header

Every plan MUST start with this header:

```markdown
# Plan: {Feature Name}

**Sprint:** YYYYMMDD-##-verb-noun-noun
**Spec:** {spec file path}

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Goal
{one sentence}

## Architecture
{inherited from spec — 2-3 sentences about approach}

## Tech Stack
{key technologies / libraries}

## Prior Decisions

*(populated by plan-build via `dr_query` at plan-start; filter: sprint-subject match OR shared-component match, status=Active)*

- **[YYYYMMDD-XXXXX]** {title} — see spec {AC-ID}. Must-remain-green: `{test_name}`.

*(or "None" if dr_query returns empty)*

---
```

## Part 2 — Task Structure

Each task in the plan follows this shape. Substitute language-appropriate test
and build commands (the example uses Python / pytest; use whatever fits the
project — `dotnet test`, `npm test`, `go test`, etc.):

````markdown
## Task {N}: {Task Name}

**Type:** code-producing | docs-producing | config-producing
**Implements:** AC-{X.Y}, AC-{A.B}
**Decision budget:** {estimated ambiguity count}
**Must remain green:** `{test_name}` (inherited from Decision {YYYYMMDD-XXXXX})

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test** (reference skeleton `{skeleton-ID}` if one exists)

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

## Per-Task Field Rules

- **Task ID** — every task has a stable ID (`Task 1`, `Task 2`, …). Don't
  renumber after the plan is written; execute-write and plan-attack both
  reference tasks by ID.
- **Type** — one of `code-producing`, `docs-producing`, `config-producing`.
  execute-write's trigger-check applicability keys off this field (a
  docs-producing task doesn't warrant the full test-run gate).
- **Implements** — list of AC IDs from the spec that this task satisfies.
  Traces each task back to spec criteria. Every AC in the spec must be
  covered by at least one task's `Implements` list.
- **Decision budget** — an estimated count of ambiguities the implementer
  will face. Plan-attack flags high-budget tasks (≳ 3) as indicators the
  spec is underspecified in that area. The budget lives in the plan so
  adversarial review can see it without recomputing.
- **Must remain green** — test names inherited from the plan's
  `## Prior Decisions` section (any decision whose `Code` field touches a
  file listed in this task's `Files` block), plus the task's own new test.
  execute-verify-complete uses this list at the end of each task to confirm
  no prior-decision test regressed.

## Conventions Encoded in the Template

- **Checkbox syntax (`- [ ]`)** — execute-write reads these as task state.
  Don't drop the checkboxes or change them to bullets; the executor relies
  on them.
- **Files block at the top of each task** — `Create` / `Modify` / `Test`
  lines with exact paths and (for modifications) line ranges. Vague paths
  break execute-write and plan-attack's verification.
- **Five-step TDD shape per task** — failing test → confirm fail → minimal
  impl → confirm pass → commit. Adapt the language but not the order; the
  order enforces the test-first discipline that execute-test gates against.
- **Concrete commands** — `Run:` lines are exact shell strings the executor
  copies. Don't write "run the tests" — write the command that runs them.
- **One commit per task** — task boundary = commit boundary. Lets the
  executor checkpoint cleanly and lets plan-smell reason about diff blast
  radius per task.
