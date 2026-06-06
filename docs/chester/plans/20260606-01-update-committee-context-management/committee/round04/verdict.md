# Verdict — Round 04 (plan decomposition)

**Decision:** The implementation plan is **seven dependency-ordered, docs-producing tasks**, each keeping `tests/test-design-committee-context-economy.sh` green by updating its own contract's assertions in the same commit; ordering is causal (schema-defining files first, SKILL.md orchestration capstone last), template precedes scribe, and AC1 (token budget) is recorded as end-to-end emergent owned by no single task.

## Task sequence (final)

1. **member-protocol.md** — `## Final Position` section (mandatory, exact-header, last-section, 200-word cap, schema `{position, rationale, blocking_risk}`, blocking_risk = member's own ~20-word articulation); typed routing-signal schema (`{member, status, round, transcript}`, reject-malformed); capped peer-DM schema (≤2/pair). Implements AC-2, AC-4. Highest decision budget.
2. **agents/design-committee-consolidator.md** — read-scope to `## Final Position` only; verbatim copy; enumerate-only bounded by bounded input. Implements AC-4.
3. **references/team-lead.md** — owns synthesize (writes `alignment-map.md`, evict) + converge (writes `verdict.md`, evict, one-sentence-min); reject malformed signals by default; present-reads-artifact; two-round (Delphi) handling. Implements AC-2, AC-3, AC-5.
4. **references/<artifact-template>.md** (NEW) — annotated handoff/artifact template with mandatory named `Dissent Record` section; location per util-artifact-schema. Implements AC-5.
5. **agents/design-committee-scribe.md** (NEW) — authoring agent fed verdict.md + template + consolidator-output (+ prior artifact); never raw transcripts or session thread. Depends on Task 4. Implements AC-2.
6. **references/committee-analysis-round-format.md** — add `alignment-map.md`, `verdict.md`, scribe draft to round-folder layout (researcher-found sync gap; spec §9 omitted). Implements AC-3.
7. **SKILL.md** — per-round flow reorder (8 steps); mode selection (one-round default / two-round escalation); scribe + verdict + checkpoint steps; **revise the `digest` test assertion → routing signal** (Conservator's named red-window); version bump; two-place sync to `skills/setup-start/references/skill-index.md:27`. Capstone. Implements AC-1 (emergent), AC-2, AC-3.

## Binding constraints carried into authoring

- Dependency edges: 1→2, 1→3 (schema first); 4→5 (template before scribe); 7 last.
- 2 and 3 independent of each other (may sequence either order).
- Every task: docs-producing; same-commit test-assertion update; suite green at task end.
- AC1: emergent, not complete until all 7 land + integration test + manual run confirm.

## Dissent carried forward (to plan Dissent Record)

- **Pragmatist:** member-protocol+consolidator could be one task (rejected for boundary cleanliness; flagged so reviewers know the merge was considered).
- **Purist:** AC1 false-green risk if a reviewer marks it complete after any single task — mitigated by the emergent designation above.
