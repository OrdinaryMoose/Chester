# Ground-Truth Report — 20260618-01-migrate-team-tooling spec

**Spec:** spec/20260618-01-migrate-team-tooling-spec-00.md
**Verified against:** main checkout `/home/mike/Documents/CodeProjects/Chester` + memory dir.

**Status:** Findings (2 × LOW; no HIGH, no MEDIUM). Spec is factually sound for implementation.

## Verified claims (confirmed against source)

- All cited paths exist: `skills/design-committee/SKILL.md`, `references/team-lead.md`, `skills/execute-write/SKILL.md` + four references (`implementer.md`, `code-reviewer.md`, `quality-reviewer.md`, `spec-reviewer.md`).
- `TeamCreate`/`TeamDelete` in committee SKILL.md confirmed across Convene (Phase 3) and Tear Down (Phase 5), incl. the `:219` Calls list.
- team-lead.md `TeamCreate` at exactly `:38, :59, :73, :77, :331`; `TeamDelete` at `:141`; `team_name`/off-roster discriminator at `:99` (Consolidate) and `:102` (Author).
- execute-write `:96-98` carries the off-roster instruction + stranding justification; all four references carry the identical justification (implementer.md:7, code-reviewer.md:5, quality-reviewer.md:11, spec-reviewer.md:9).
- Catalog-safety holds: neither SKILL.md `description:` field contains TeamCreate/TeamDelete/roster/team_name. `skill-index.md`, `bin/chester-generate-agents`, `tests/test-generated-agents-current.sh` all exist.
- Both memory files exist; MEMORY.md index lines 11/12 read as the spec assumes; the spec's characterization of each memory's current content is accurate.
- Dual word-sense of "roster" is real: discriminator sense at SKILL.md:126/:128/:130; member-list sense at SKILL.md:34, :103, team-lead.md:66, and consolidator agent :24/:49.
- Context-economy passage SKILL.md:172 "compiles at end — NOT switchboard" confirmed verbatim.
- Non-Goal holds: `agents/design-committee-*.md` contain zero TeamCreate/TeamDelete/team_name; their only "roster" uses are the member-list sense. No agent-file edits needed.

## Findings

- **LOW-1 (FIXED in spec):** AC-1.2 and Constraints cited `SKILL.md:66` for "member roster"; that line is actually the voice-spec reference. The "member roster" text lives at `team-lead.md:66`. Citation corrected to `SKILL.md:103` + `team-lead.md:66`. Substance (the word-sense carve-out) was always correct.
- **LOW-2 (report-only):** Components flags team-lead.md `:99`/`:102` as discriminator-replacement sites but does not note these are shared lines that also carry the context-economy invariant ("reads only … bounded `## Final Position` … never holds the full returns"; the scribe bounded-input contract). The implementer must edit only the discriminator clause and leave the invariant text unchanged. Already mandated by AC-1.4; flagged here as implementer context.

## Risk assessment

The spec accurately describes the codebase it targets. Every dead-verb location, reference file, memory, and the catalog-safety claim check out. No factual error would cause the migration to fail or target a nonexistent construct. The single citation slip (LOW-1) is fixed; LOW-2 is covered by AC-1.4. Safe to proceed to plan-build on user approval.

<!-- created-at: 2026-06-19T09:10:48Z -->
<!-- produced-by spec-harden@v0001 -->
