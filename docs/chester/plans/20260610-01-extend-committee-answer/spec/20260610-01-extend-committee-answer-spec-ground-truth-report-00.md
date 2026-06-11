# Ground-Truth Report — Member Warranted Answer-Contribution (Thread A)

**Sprint:** 20260610-01-extend-committee-answer
**Spec:** 20260610-01-extend-committee-answer-spec-00.md
**Date:** 2026-06-10

## Status: VERIFIED — all spec claims about existing code are accurate

Independent codebase verification confirmed every claim the spec makes about the current contract files. No HIGH or MEDIUM findings. One LOW finding (a wording-alignment nuance) is recorded for plan-build.

## Verified claims (with evidence)

- **Final Position schema is `{position, rationale, blocking_risk}`** — member-protocol.md:88-99; the three-field block at 90-92, field defs 94-99.
- **200-word cap** — member-protocol.md:85. **Member-authored rule** — :86-87. **"Single authority for the Final Position schema"** — :76-78.
- **Routing signal `{member, status, round, transcript}`** — member-protocol.md:30-39. **Write-then-send sequencing** — :123-134. These are the frozen mechanics (AC-1.3).
- **member-protocol.md has no `version` frontmatter** — :1-9 (name + description only).
- **team-lead.md `version: v0010`** — :8. Sole version-bearing file among the changed set; the single bump v0010→v0011 (AC-3.4) is the correct and complete version surface.
- **Authority Guard "Warrant test" is origination-side** — team-lead.md:321 ("Every answer-body assertion must carry a warrant … Assert only what can be warranted"). This is the AC-3.1 reword anchor; it exists and is origination-framed.
- **Self-Eval "Authority Guard — warrant coverage" check** — team-lead.md:342. The AC-3.2 anchor; exists, origination-framed.
- **Locked four-block Information Packet Format** — team-lead.md:161-213 (Summary / Information Package / Decision Package / Team-Lead Comments); named "Decision-communication packet" at :156. Unchanged (AC-4.1).
- **Four advocacy agents delegate the Final Position schema to member-protocol** (do not restate the field list) — conservator/innovator/pragmatist/purist :71-73 & :98-100 in each. Confirms the spec's delegation note; the per-agent instruction is a pointer, preserving single-authority.
- **Four agents are structurally parallel** (byte-identical skeleton; templates differ only by role name) — supports AC-2.1's byte-identical instruction requirement. No `version` frontmatter on any.
- **Researcher already warrant-shaped** (file:line/source discipline) and holds no advocacy position — researcher.md:8, :16-19, :30, :50-110. No warrant field needed (AC-2.2). No `version`.
- **Consolidator is enumerate-only and field-name-agnostic** — consolidator.md:19-25, :28-38, :44-62. Output is alignment count + one-line summaries + verbatim quotes; never names the three fields. Adding a fourth Final Position field needs no consolidator change — resolves the brief's UNTESTED assumption (brief:81) in the spec's favor.
- **team-lead.md already reads the Final Position from disk via member-protocol** — :103 ("reads only each transcript's bounded `## Final Position` section … schema per member-protocol § Final Position"). Supports the spec's Data-Flow step 4 (team-lead sources warrants from disk on demand; no new contract).
- **util-design-partner-role/SKILL.md exists** — the "untouched" claim targets a real file.

## Findings

- **LOW — warrant-type hyphenation mismatch.** Spec/brief canonical type is `in-scope designer-premise`; team-lead.md writes "in-scope designer premise" (:321) and "in-scope premise" (:342). Substantively the same type; surface text differs. Impact: AC-3.3's "three types unchanged" check must compare substance, not bytes, and member-protocol's new enum wording should be deliberately reconciled with team-lead's existing phrasing at plan time. Recorded in the spec's Constraints (Three warrant types frozen) as a plan-build reconciliation note. No correctness risk.

## Risk Assessment

Low. The spec's factual claims about the existing files are accurate in every checked particular. The architecture rests on two structural facts independently confirmed: (a) the four advocacy agents already delegate the Final Position schema to member-protocol, so a protocol-level field addition propagates automatically and the per-agent instruction is a pure pointer (preserving single-authority); (b) the Consolidator's output template is field-name-agnostic, so the brief's one untested assumption resolves with no Consolidator edit. The only carry-forward is the hyphenation reconciliation note — a wording-alignment item, not a correctness risk.

<!-- created-at: 2026-06-11T01:33:02Z -->
<!-- produced-by design-specify@v0004 -->
