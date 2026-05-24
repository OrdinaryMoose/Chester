# Archived

**Status:** Archived 2026-04-28. Not registered in `.claude-plugin/mcp.json`.

This MCP was built as an Understanding-phase replacement that scored six
architectural tenets (Reach Profile, Existing-System Disposition, Fragility
& Coupling Map, Pattern & Principle Lineage, Vision Alignment, Maintainability
Forecast).

**Why archived:** the six axes are *solve-side* concerns. Anchoring the
Understanding phase to architectural tenets gave the agent permission to
design instead of converging on a problem statement. The drift mode was
documented in StoryDesigner's ncon-02 sprint, where the Understanding-state
file's `gap` fields literally read "this is a Solve-tier thing" nine times
in a row while the agent scored high on tenets it had drifted into solving on.

**What replaced it:** `understanding-mcp-problemfocused/` — nine tenets
focused on problem-statement convergence (Problem Articulation, Success
Criteria, Done-State Vision, Constraint Envelope, Scope Boundary, Personal
Use Case Map, Cost-Energy Budget, Project Fit, Open Questions Ledger) plus
five cross-cutting mechanisms (Phase-Vocabulary Classifier, Solve Leakage
Ledger, Problem-Statement Repeat-Back Gate, Convention-Break Override Rule,
Vocabulary Lockdown Classifier).

**Possible future use:** the six architectural tenets here may belong in a
Solve-phase MCP. Code preserved for reference. If reactivated, register in
`.claude-plugin/mcp.json` under the `chester-design-understanding-architectural`
key (currently unregistered) — or rename to `chester-design-solve-architectural`
to clarify role.
