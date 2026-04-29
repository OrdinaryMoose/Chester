# Ground-Truth Review Report — add-competitive-interview

**Spec versions reviewed:** v01 (initial), v02 (after fixes)
**Final status:** CLEAN on v02
**Final risk:** Low — no factual errors remain; line-number citations all check out

## Summary

Two ground-truth review passes were run. The first pass against spec v01 produced 1 HIGH + 3 MEDIUM + 2 LOW findings. All HIGH and MEDIUM findings were addressed inline in v02. The second pass against v02 verified the fixes were correctly applied with accurate code references; no new findings surfaced. Two LOW findings from v01 remain as noted context for the implementer (not blocking).

## Pass 1 — v01 Findings (resolved in v02)

### HIGH-1 — `architectural-mcp-flow.md` exists; spec asserted it does not

- **Spec v01 said (Non-Goals + AC-6.1):** the file does not exist (archived); spec does not depend on it
- **Code shows:** `skills/design-large-task/references/architectural-mcp-flow.md` is a 79-line stub file (dated 2026-04-27, status "Stub — under development"). What's archived is the *MCP server* (`understanding-mcp-architectural/ARCHIVED.md`), not the flow file.
- **Resolution in v02:** Non-Goals updated to describe the file as an existing stub; AC-6.1 expanded to include `architectural-mcp-flow.md` as a third existing flow file requiring unmodified verification.

### MEDIUM-1 — RULE element `source` field is locked to `"designer"`; mapping needed authority clarification

- **Spec v01 said:** "Philosophy grounding bullets → RULE elements (designer-ratified principles count as designer-direction by virtue of the ratification block)"
- **Code shows:** `proof-mcp/proof.js:48-52` — RULE creation throws `"RULE requires source 'designer'"`. `SKILL.md:445` — prohibits creating RULE/PERMISSION elements from agent analysis.
- **Resolution in v02:** Data Flow step 9 + AC-1.11 made the designer-authority chain explicit: the Round 5 ratification block IS the designer-authority signal that authorizes seeding philosophy + exit-criteria as RULEs with `source: "designer"`. Cites `SKILL.md:445` directly.

### MEDIUM-2 — `source: "industry"` / `"friction"` fallback policy was unreachable

- **Spec v01 said:** if proof MCP rejects extended source values, fall back to `"codebase"` with qualifier
- **Code shows:** `proof-mcp/proof.js:38-46` — EVIDENCE accepts any non-null source ≠ `"designer"`. No enum constraint. Fallback path can never trigger.
- **Resolution in v02:** Removed the fallback policy entirely. Data Flow step 9 now states sources pass without fallback, citing the proof.js source check directly. Error Handling line removed.

### MEDIUM-3 — Resume Protocol team-interview branch lacked explicit alternate read path

- **Spec v01 said:** "Resume Protocol gains team-interview branch" (no path detail)
- **Code shows:** `SKILL.md:732-739` — current Resume Protocol calls `get_understanding_state` from a JSON state file unconditionally when `understanding-confirmed` thought is absent. Team-interview produces no state file.
- **Resolution in v02:** Components section explicitly mandates a team-interview branch reading from the in-progress process-evidence transcript instead of calling `get_understanding_state`. Concrete path described.

## Pass 1 — LOW Findings (informational only; not fixed)

### LOW-1 — C2 canonical name shorthand

- Spec uses "C2 (fact/assumption/opinion)" as shorthand. Canonical name in `util-design-partner-role/SKILL.md:71` is "C2: Fact Default with Marked Departures". Tests grepping for the shorthand may miss the canonical phrasing.
- **Action:** None. Implementer should reference canonical name in pole-agent prose; spec's shorthand is acceptable as a label.

### LOW-2 — Cross-reference to `SKILL.md:403` seed step

- Spec's mapping rule layers atop existing `SKILL.md:403` seed step language without explicit cross-reference.
- **Action:** Addressed implicitly by v02's Data Flow step 9 line citing `SKILL.md:403`. No further fix needed.

## Pass 2 — v02 Re-Review

**Status:** CLEAN. No findings.

**Verified claims (sample):**
- `architectural-mcp-flow.md` correctly described as existing stub — CONFIRMED at `skills/design-large-task/references/architectural-mcp-flow.md` (79 lines, status: "Stub — under development")
- EVIDENCE source field accepts arbitrary non-designer strings — CONFIRMED at `proof-mcp/proof.js:38-46`
- RULE source locked to `"designer"` — CONFIRMED at `proof-mcp/proof.js:49-53`
- `understanding-confirmed` thought boundary marker — CONFIRMED at `SKILL.md:293`
- Understand-Stage prohibitions enumerated — CONFIRMED at `SKILL.md:369-377`
- Solve Stage seed step in Phase 4 — CONFIRMED at `SKILL.md:403`
- Resume Protocol shape — CONFIRMED at `SKILL.md:732-739`
- C1 / C2 voice discipline markers — CONFIRMED at `util-design-partner-role/SKILL.md:46, 61, 71`
- Three existing flow files in `references/` — CONFIRMED (`architectural-mcp-flow.md`, `classic-mcp-flow.md`, `problemfocused-mcp-flow.md`)

## Risk Assessment

The spec is ground-truth-clean and ready for the user-review gate. All HIGH and MEDIUM findings from the initial pass were correctly applied with accurate code references. No new factual errors were introduced in v02. The two LOW findings remain as context for the implementer but do not block plan-build.
