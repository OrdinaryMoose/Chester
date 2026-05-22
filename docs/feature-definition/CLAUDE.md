# docs/feature-definition/ — CLAUDE.md

Feature-definition briefs that drive Chester's own development. Each brief frames a proposed change to Chester before any sprint work begins.

## Lifecycle directories

A brief moves through stages by being moved between subdirectories. The directory IS the status.

- `Pending/` — brief written, not yet acted on. Awaiting designer prioritization or scheduling.
- `Complete/` — feature shipped. Brief is preserved as historical record of the original framing.
- `Deferred/` — explicitly postponed. Reason captured in the brief or a sibling note.
- `not-implemented/` — explicitly rejected or superseded. Preserved so the decision trail survives.

## Brief structure

See `feature-definition-brief-structure.md` (top of this directory) for the canonical structure. Briefs use the three-layer pattern: Problem Statement → Current State → Proposed Change.

## Naming

`<feature-slug>-NN.md` where `NN` is a zero-padded version counter. A brief revised after feedback bumps `NN`. Example: `design-committee-00.md` → `design-committee-01.md`.

## Where briefs come from / go to

- **Origin:** standalone design sessions, retrospective gaps, designer-noticed needs.
- **Consumption:** a brief that graduates to active work becomes the seed for a sprint under `docs/chester/working/`. The brief stays here; the sprint produces its own artifacts.
- **Don't conflate** a feature-definition brief with a sprint design brief. Feature-definition briefs scope the WHY and the WHAT-AT-A-HIGH-LEVEL of a change; sprint design briefs (in `docs/chester/working/<sprint>/design/`) scope the concrete WHAT and HOW for one implementation pass.
