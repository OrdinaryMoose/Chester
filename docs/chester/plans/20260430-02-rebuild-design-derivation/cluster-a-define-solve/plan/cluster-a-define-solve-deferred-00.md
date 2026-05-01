# Deferred Items — cluster-a-define-solve

## 2026-05-01 — Task 4 quality review

### Re-ratification guard

- Source task: Task 4
- Description: `ratifyResolveCondition` does not guard against already-ratified RCs. Calling twice on the same RC silently overwrites `ratification` and appends a second `ratificationLog` entry. Spec does not explicitly permit or forbid re-ratification.
- Why deferred: Spec ambiguous on this case. Behavior question for the designer — should re-ratification (without revise clearing first) be refused, or silently allowed as overwrite? Not blocking forward progress; revise-clears path (Task 5) is the documented re-ratify route.

### Dead typeof clause

- Source task: Task 4
- Description: `state.js` ratifyResolveCondition's `(!ratificationText || typeof ratificationText !== 'string')` — second clause unreachable from destructured parameter; callers cannot pass non-string without intent.
- Why deferred: Cosmetic simplification; no behavioral impact.

## 2026-05-01 — Full code review (BASE..HEAD)

### checkStaleRatification sentinel debt

- Source: full code review, Important #2 (confidence 80)
- Description: `proof.js:checkStaleRatification` always returns `[]`. Doc says "structurally impossible under cleared-on-revise approach" — but a permanently-empty stub provides zero defense if a future change bypasses applyOperations's clearing path.
- Why deferred: spec line 24 explicitly commits to the sentinel as an extension callsite. Removal or full implementation is a future-cluster decision (cluster B may extend if revise paths grow).

### handleGetProofState response asymmetry

- Source: full code review, Minor #1
- Description: `concernCoverage` field present only when locked, omitted otherwise. Downstream consumers must check existence. Could emit `concernCoverage: null` when unlocked for symmetry.
- Why deferred: spec line 95 says "otherwise omit". Cosmetic.

### Snake_case/camelCase response field consistency

- Source: full code review, Minor #2
- Description: `handleManageConcerns` returns `concern_id`; `handleRatifyResolveCondition` returns `element_id`. Each handler is self-consistent but cross-handler naming is mixed.
- Why deferred: cosmetic; matches existing snake_case convention in MCP responses.

### Map serialization centralization

- Source: full code review, Minor #3
- Description: `saveState` handles `elements` Map specifically. Future Map fields would silently break.
- Why deferred: no current additional Map fields. Cluster B can revisit if proof state shape grows.

### Brief→spec coverage rule strictness

- Source: full code review, Minor #4
- Description: design-specify SKILL.md says Concerns "should be" covered by AC or constraint — softer than the proof MCP's closure rule. Whether design-specify's fidelity reviewer enforces this is unclear.
- Why deferred: spec-stage coverage is informal authoring guidance, not a runtime gate. Future cluster work may formalize.

### Brief template "(round n)" mapping documentation

- Source: full code review, recommendation
- Description: Brief template Resolve Conditions sample shows "(round n)" but state shape is `ratifiedAtRound`. Hand-translation is error-prone.
- Why deferred: low impact for agent-rendered briefs; only matters if a human hand-writes RC entries.
