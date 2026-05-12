# Master Plan — 20260511-01-mp-redesign-proof-system

Filesystem-level index of this master sprint. Design content lives in `design-documents/`. Implementation and per-sprint planning live in each sub-sprint folder.

## Layout

```
20260511-01-mp-redesign-proof-system/
├── master-plan.md                 (this file)
├── CLAUDE.md                      (master-level commitments)
├── design-documents/              (cascade: vision, conops, architecture, specs, ADRs)
├── sprint-01-proof-backend/       (design/ spec/ plan/ summary/)
├── sprint-02-proof-layer/         (design/ spec/ plan/ summary/)
└── sprint-03-presentation-layer/  (design/ spec/ plan/ summary/)
```

## Sub-sprints

- `sprint-01-proof-backend/` — status: **active** (setup complete, branch + worktree in place)
- `sprint-02-proof-layer/` — status: not started
- `sprint-03-presentation-layer/` — status: not started

## Branches and worktrees

- `sprint-01-proof-backend` branch ↔ worktree at `.worktrees/sprint-01-proof-backend`
- `sprint-02-proof-layer` — not yet branched
- `sprint-03-presentation-layer` — not yet branched

## Pointers

- Design cascade: `design-documents/` (entries `00-glossary.md` through `08-test-strategy.md`, plus `ADR/`).
- Latest design-tier state: ADR-0013 (relocates `IMaterializer` to Domain; specifies tx-visibility as read-own-writes).
