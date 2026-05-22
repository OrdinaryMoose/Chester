# docs/admin/ — CLAUDE.md

Meta-level documents about Chester itself: postmortems, retrospective analyses, doc-code alignment strategies, pipeline comparisons.

## What belongs here

- **Postmortems** — incidents or systemic gaps in Chester's own workflow. Name pattern: `<topic>-postmortem.md`.
- **Strategy / action plan documents** — multi-document plans for fixing systemic issues. Often dated. Name pattern: `<topic>-strategy-YYYY-MM-DD.md` or `<topic>-action-plan-YYYY-MM-DD.md`.
- **Critiques** — designer- or agent-issued critiques of a strategy doc. Name pattern: `<topic>-critique-YYYY-MM-DD.md`.
- **Pipeline / effectiveness analyses** — comparisons, measurements, and effectiveness reviews of Chester subsystems.

## What does NOT belong here

- Per-sprint artifacts → `docs/chester/working/` or `docs/chester/plans/`.
- Feature briefs → `docs/feature-definition/`.
- Workflow instructions → `docs/instructions.md`.

## Authoring conventions

- Documents are standalone and declarative. They describe current state at time of writing.
- Historical evolution goes in an end-of-document **Change Log** section, never the main body.
- Date in filename when the document captures a point-in-time view.
- Cross-link to specific sprint artifacts when relevant (e.g. "see sprint `20260511-01-mp-redesign-proof-system` summary for…").
