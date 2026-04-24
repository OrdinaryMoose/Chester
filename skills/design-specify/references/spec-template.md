# Spec Template (Loop-Optimized)

Canonical spec document format used by `design-specify`. This template is loop-optimized: each acceptance criterion carries an observable boundary, a stable ID, and a skeleton-stub reference so that `execute-write` can couple code to tests through the spec.

## When to Use

Copy this template when producing the spec document at `spec/{sprint-name}-spec-NN.md`. Fill in every section. The Acceptance Criteria block is the primary hand-off surface: plan-build turns criteria into tasks, and execute-write's decision loop resolves every propagation event back to an AC clause.

Leave `Implementing tasks:` and `Decisions:` empty at spec-write time — those fields are populated downstream (plan-build and execute-write, respectively).

## Template

```markdown
# Spec: {Feature Name}

**Sprint:** YYYYMMDD-##-verb-noun-noun
**Parent brief:** {design brief path}
**Architecture:** {architecture chosen from design-specify hybrid}

## Goal
{one paragraph}

## Components
{new/modified units}

## Data Flow
{how data moves through components}

## Error Handling
{failure modes and responses}

## Testing Strategy
{test categories, coverage expectations}

## Constraints
{cross-cutting constraints}

## Non-Goals
{explicitly out of scope}

## Acceptance Criteria

### AC-{N.M} — {Short Name}

**Observable boundary:**
- {condition → outcome}
- {condition → outcome}

**Given:** {precondition}
**When:** {trigger}
**Then:** {observable result}

**Test skeleton ID:** `ac-{N-M}-{slug}` (auto-scaffolded at design-specify time; skeleton stub at language-appropriate path; skeleton manifest at `spec/{sprint-name}-spec-skeleton-00.md`)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)
```

## Notes

- **Stable IDs:** `AC-{N.M}` IDs are immutable once the spec is approved. When `execute-write` refines an existing clause, it uses a suffix form (`AC-N.Ma`) rather than renumbering.
- **Observable boundary** is mandatory. Every criterion must declare what a test can observe from outside the unit. If a criterion cannot be stated as an observable boundary, split or reformulate it.
- **Skeleton IDs** match the stub emitted by `skeleton-generator.md`. The manifest file indexes every skeleton by ID so `execute-write` can look up the stub during propagation.
- Repeat the AC block for each criterion. Numbering is per-section (`AC-1.1`, `AC-1.2`, `AC-2.1`, ...).
