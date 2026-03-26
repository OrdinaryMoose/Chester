# Doc Sync Report

**Date:** {DATE}
**Session:** {SESSION_DESCRIPTION}
**Mode:** {Full | Limited | Audit-Only | Skip}
**Reasoning audit:** {AUDIT_PATH | "not found"}
**Base SHA:** {BASE_SHA}

---

## Summary

- **CLAUDE.md staleness:** {N} findings
- **Approved doc conflicts:** {N} findings
- **Documentation gaps:** {N} findings
- **Total:** {N} findings

---

## CLAUDE.md Staleness Findings

{For each finding, use this format:}

### Finding C-{N}: [{severity}] [{origin}] {project}/CLAUDE.md

**Severity:** {contradicted | stale | missing}

**Origin:** {sprint-caused | pre-existing} — {If pre-existing: "CLAUDE.md last modified {date}, staleness predates this session." If sprint-caused: "This session's changes introduced this staleness."}

**Affected document:** `{path to CLAUDE.md}`

**Current state:**
> {Quoted text from the CLAUDE.md that is now inaccurate or incomplete}

**Session change:**
{Description of what changed in the session that makes this stale, sourced from reasoning audit or git diff}

**Suggested action:**
{Specific recommendation — e.g., "Update the Dependencies section to add Story.Application.AuthorNotes"}

---

## Approved Doc Conflict Findings

{For each finding, use this format:}

### Finding A-{N}: [{severity}] {DOC-ID} ({doc title})

**Severity:** {contradicted | stale}

**Affected document:** `{path to TDR/ADR/GPR file}`

**Current state:**
> {Quoted text from the approved doc that conflicts with or is extended by the session's decisions}

**Session change:**
{Description of the session decision that contradicts or extends this doc, from reasoning audit}

**Suggested action:**
{Specific recommendation — e.g., "Update TDR-ARCH-200 section 3 to reflect the new integration point, or create a new TDR if the scope warrants it"}

---

## Documentation Gap Findings

{For each finding, use this format:}

### Finding G-{N}: [missing] {decision or concept description}

**Type:** {Undocumented decision | Missing concept}

**Session decision/concept:**
{Description of the decision or concept from the reasoning audit that has no doc coverage}

**Evidence:**
{Why this needs a doc — e.g., "This is an architectural choice affecting the integration boundary" or "This term is used in 3 new files but not defined in the concept index"}

**Suggested action:**
{Specific recommendation — e.g., "Create TDR-LANG-xxx for conversation grammar nested choice support" or "Add 'nested choice' entry to concept-index-current.md"}

---

## Agent Execution Notes

{Any notes about degradation, skipped agents, or errors}
