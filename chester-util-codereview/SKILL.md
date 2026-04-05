---
name: chester-util-codereview
description: >
  Code smell review of existing code scoped to a directory, namespace, or path.
  Single-pass review that finds structural smells, practical bugs, and architectural
  concerns with file:line evidence. Invoke via: "review code in src/", "smell check
  this directory", "code review src/billing", "what smells exist in lib/",
  "/chester-util-codereview".
---

# Code Review

Reviews existing code in a scoped directory for code smells and quality issues. Every
finding must cite real evidence — file paths, line numbers, class/method names, or
concrete code patterns. Speculation without evidence is not a finding.

## Scope

The user provides a target: a directory path, a namespace, or a glob pattern.

If the scope is ambiguous or missing, ask the user to specify. Do not default to the
entire repo — unbounded reviews produce shallow findings because the reviewer skims
instead of reading.

Once resolved, confirm briefly: "Reviewing `src/billing/` for code smells."

Code outside the scope is only relevant when the scoped code directly depends on it
(imports, inheritance, interface contracts). Mention the dependency but keep focus
on the target.

## How to Review

Read the code in the target scope. Understand what it does before looking for problems.
Identify the languages, frameworks, key files, and architectural patterns in use.

Then look for issues across two complementary dimensions:

**Practical concerns** — things that affect correctness and day-to-day development:
- Runtime bugs: resource leaks, missing notifications, thread safety gaps, unhandled
  error paths, disposed objects still in use
- Dead code: commented-out blocks, unused classes/methods, interfaces with no live
  implementation
- Correctness risks: magic numbers, inconsistent validation, swallowed exceptions,
  missing null checks where they matter (not cargo-cult defensive checks where they don't)
- Style drift: inconsistent patterns within the same scope (some classes sealed, some not;
  some properties use code generation, others are manual)

**Structural concerns** — things that affect how the code evolves:
- Duplication: copy-pasted logic that should be extracted (especially when the codebase
  already has a utility that does the same thing)
- Responsibility overload: classes or methods doing too many unrelated things
- Coupling: classes reaching into each other's internals, changes to one concern requiring
  edits across many files
- Unnecessary abstraction: wrapper classes that just delegate, interfaces with exactly one
  implementation and no substitution need

Both dimensions matter. A review that only finds architectural patterns misses the bugs
a developer will hit tomorrow. A review that only finds bugs misses the structural rot
that makes every future change harder.

## Evidence Standard

Every finding must cite:
- The specific file and line number(s)
- The construct involved (class name, method name, property)
- What the problem is and why it matters

If you cannot point to concrete evidence in the source files, drop the finding. This is
the single most important rule.

## Output

Write findings directly in the conversation. Use whatever severity scale and format feels
natural for the findings — the goal is clarity, not taxonomy compliance. Group related
findings when they share a root cause.

End with a brief assessment: is this code in good shape, does it have a few areas worth
attention, or are there systemic issues? Keep it to 2-3 sentences.

## Boundaries

- This skill reviews existing code. It does not review plans or proposed changes.
- This skill does not write or modify code. The user decides how to respond.
- This skill requires a scope. It will not review the entire repo by default.
- Each finding must have file-level evidence. Drop anything speculative.
