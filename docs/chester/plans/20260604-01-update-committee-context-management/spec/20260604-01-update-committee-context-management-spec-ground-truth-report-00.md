# Ground-Truth Report — Team-Lead Context Economy spec

**Spec:** spec/20260604-01-update-committee-context-management-spec-00.md
**Brief:** docs/feature-definition/Pending/design-committee-team-lead-context-economy-01.md
**Date:** 2026-06-04
**Outcome:** Findings — 1 MEDIUM + 2 LOW. MEDIUM and one LOW fixed in spec-00; one LOW noted. No HIGH. Spec accurately describes the codebase it targets.

## Verified Claims (CONFIRMED against source)

- Five member agent files declare read-only grants: conservator/innovator/pragmatist/purist `tools: Read, Glob, Grep` (each :4); researcher `Read, Glob, Grep, Bash, WebSearch, WebFetch` (researcher.md:4). The "add Write" target is correctly scoped.
- Researcher's existing prohibition "No file writes outside conversation record" — design-committee-researcher.md:28. The spec's narrowing target is accurate.
- Researcher's "2-6 sentences synthesizing the sources" license — design-committee-researcher.md:109. The Consolidator's must-not-inherit claim is grounded in real text.
- TeamCreate roster = exactly five members (4 advocacy + researcher); team-lead is the calling agent — SKILL.md:70-78, 23-25. The "Consolidator never on the persistent roster" claim is consistent.
- Member output templates (single-round response, R1 proposal, peer challenge, R2 final) — conservator.md:66-103 and identical structure across the other three advocacy files. The finals-targeting (single-round + R2 final) maps to real blocks; R1/peer-challenge correctly left unchanged.
- One-round-format canonical 4-step shape — SKILL.md:96-106. "Only the finals step changes" aligns.
- Integration Reads/Calls lists — SKILL.md:121-127. The add-targets (member-protocol.md, consolidator) are real lists.
- No "Mode A"/"Mode B" vocabulary in touched files — grep clean.
- skill-contract.md owns Floor-Not-Ceiling + three forbidden attach surfaces — skill-contract.md:13-25. The re-point target is real.
- team-lead.md sections named by the spec — Record File (:87/:89-95), Reading Order (:48), Per-Round Flow (:97), Closure (:121) — all present.

## Findings

### MEDIUM — current record model mischaracterized as "single-file" (FIXED)
- Spec said the current model is "single-file-in-`design/`".
- Code shows one record file **per designer question** (`committee-analysis-NN.md`, 01, 02, …) — team-lead.md:89-95, round-format.md:36-45.
- Fix applied: Components round-format bullet and AC-6.1 corrected to "one-file-per-designer-question (one or more files) in `design/`." Retirement target unchanged (the per-question convention is what's retired).

### LOW — agents/CLAUDE.md quote was a stitched paraphrase (FIXED)
- Spec quoted two non-adjacent lines (:33, :35) as one sentence.
- Fix applied: Constraints bullet de-quoted to a paraphrase with line cites, so no exact-match assumption.

### LOW — "remove any inline restatement" of forbidden-attach-surfaces is a no-op (NOTED, not fixed)
- SKILL.md's "For Skill Authors" (SKILL.md:117-119) already cites skill-contract.md and only *names* the contents; it does not restate the three surfaces inline.
- The instruction is conditional ("any"), so it is harmless — the re-point may amount to a citation touch-up. Left as written for the implementer's awareness.

## Risk Assessment

All substantive spec claims about tool grants, output templates, the researcher license, the roster, section names, and skill-contract.md ownership are accurate against the codebase. The one substantive imprecision (single-file vs per-question record model) is corrected. No factual errors remain that would cause plan-stage work to fail. A planner should still read team-lead.md:89-95 directly when rewriting the record model.

<!-- created-at: 2026-06-04T18:00:58Z -->
<!-- produced-by design-specify@v0003 -->
