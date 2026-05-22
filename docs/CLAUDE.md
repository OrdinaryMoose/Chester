# docs/ — CLAUDE.md

Top-level documentation for Chester. Distinct from per-sprint artifacts under `docs/chester/`.

## Top-level files

- `README.md` — public-facing project description.
- `instructions.md` — full Chester workflow instructions (design → specify → plan → execute → finish).
- `fork-policy.md` — per-dispatch fork policy for named subagents.

## Subdirectories

- `chester/` — sprint working/plans roots. Sprint-internal artifacts live here. See `docs/chester/CLAUDE.md`.
- `admin/` — postmortems, doc-code alignment strategies, retrospective analyses. See `docs/admin/claude.md`.
- `feature-definition/` — feature briefs in workflow stages (Pending, Complete, Deferred, not-implemented). See `docs/feature-definition/claude.md`.

## What belongs in `docs/` vs `docs/chester/`

- `docs/<topic>.md` and `docs/<area>/` — durable, project-wide documents. Policy, instructions, retrospectives.
- `docs/chester/working/<sprint>/` — in-progress sprint artifacts (gitignored).
- `docs/chester/plans/<sprint>/` — archived sprint artifacts (tracked).

If a document describes Chester's behavior as a whole, it lives here. If it describes a specific sprint's work, it lives under `docs/chester/`.
