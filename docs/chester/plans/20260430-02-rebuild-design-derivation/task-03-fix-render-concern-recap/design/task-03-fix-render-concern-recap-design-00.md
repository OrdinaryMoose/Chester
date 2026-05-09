# Problem Brief — `render_proof_state` Drops Concern Description in Top-Level Recap

**Status:** open
**Surfaced:** 2026-05-09, sprint-d-2 round-20 resume
**Affects:** `mcp__chester-design-proof.render_proof_state` (top-level recap mode), shipped on main via merge `ec3797d` (sprint-d-1-fix-proof-mcp-3)

## What Happens

Calling `render_proof_state` without `element_id` (top-level recap mode) prints every Concern as `**CERN-N** _(status)_ — <label>`, where `<label>` is the short tag the designer assigned at concern creation time (e.g. `C-2`, `D2-C-1`). The Concern's `description` field — the actual sentence-or-paragraph text of the worry — is not rendered at all in the recap.

Concrete example from sprint-d-2 round 20:

```
- **CERN-1** _(draft)_ — C-2
- **CERN-2** _(draft)_ — D2-C-1
- ...
```

The label `D2-C-1` is meaningless to a reader who hasn't seen the underlying entry. To recover the description, the caller must run a deep render per concern (`element_id: "CERN-N"`), which is twelve round-trips for a twelve-concern proof.

## Why It's a Problem

The recap mode is documented as the "designer-readable proof rendering surface" — its purpose is to let a designer scan the active proof body and orient. Every other element type renders with primary text inline:

- Rules: full text shown
- Evidence: full text shown
- NCs: full text shown
- Permissions: full text shown
- Resolve Conditions: full text shown
- Concerns: **label only**

The asymmetry breaks the recap's stated purpose for any proof where the designer relies on Concern descriptions to remember what each concern actually says. Resume sessions are the canonical case: when the agent re-orients at round N, the Concern body is exactly what is needed to choose the next topic. The current shape forces a deep-render per concern just to read the recap.

## What Should Probably Happen (not prescriptive)

Recap mode should print the Concern's `description` field (or a sensible primary-text equivalent) inline alongside the label, the way every other element type does. RULE-18's "61 sub-clauses — request deep render" abbreviation is a separate editorial choice for very long bodies; Concern descriptions are typically short enough to inline directly.

## Out of Scope

- The deep-render mode itself works correctly — `element_id: "CERN-N"` does return the full Concern body.
- This is not a sprint-d-2 design concern; sprint-d-2's subject is the Presentation layer redesign for design-large-task. This defect lives in the proof MCP's render layer (sprint-d-1-fix-proof-mcp-3 territory).
- No fix proposed here — just the problem framed for whoever picks it up.

## Pointers

- Render tool source: `chester-mcp-design-proof/src/tools/renderProofState.ts` (or equivalent — verify)
- Tests: `chester-mcp-design-proof/tests/` — sprint-d-1-fix-proof-mcp-3 added 40 tests; check whether any cover the Concern-recap shape
- Sprint that shipped the renderer: `20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/`
