# Ground-Truth Report — Rebuild Committee Deliberation Protocol

**Spec:** 20260619-01-rebuild-committee-protocol-spec-00.md
**Status:** Findings (1 MEDIUM, addressed inline) — no HIGH findings; spec is safe to implement.

## Verified Claims

Every load-bearing claim the spec makes about existing files, versions, contracts, and structure checks out against source:

- **Versions** — `SKILL.md` v0025 (`skills/design-committee/SKILL.md:4`); `team-lead.md` v0015 (`references/team-lead.md:8`). Confirmed.
- **Teardown wording to be replaced** — "tears down automatically at session exit — there is no explicit teardown call" at `SKILL.md:199`, recurring at `SKILL.md:221` (Integration) and `team-lead.md:141` (Closure step 4). All three sites use auto-dispose-only language the teardown edits must touch.
- **Single-owner numbered flow already on main** — `team-lead.md:93-103` is the authoritative 7-step numbered Per-Round Flow ("the sole authority for the step sequence"); `SKILL.md:71-77` is a named-phase Checklist and `SKILL.md:178-181` explicitly defers ("SKILL.md carries no numbered list of its own"). The spec's AC-5.1 "preserve, don't reintroduce" framing is accurate.
- **Consolidator** — one-shot subagent, enumerate-only, reads only `## Final Position` (`team-lead.md:99`; `SKILL.md:130-133`). **Scribe** — one-shot authoring from bounded inputs (`team-lead.md:102`; `SKILL.md:149-152`). Confirmed retained-unchanged is accurate.
- **member-protocol.md** — peer-DM "Max 2 exchanges per pair" (`member-protocol.md:127`); Final Position ≤200 words (`:82`); routing signal `{member, status, round, transcript}` (`:30-39`). Confirmed; AC-2.1's "existing cap" is real.
- **Agent files lack a shutdown handler** — no `shutdown` token in any `agents/design-committee-*.md`; all five are v0001. The spec's "add one" is correct.
- **Frozen round-format file** exists (`committee-analysis-round-format.md`, v0002); AC-5.2 leaves it untouched. Consistent.
- **`TeamCreate`/`TeamDelete` already absent** from committee skill files; the test already enforces this (`test-design-committee-context-economy.sh:118-119, 129-130`). AC-4.1's "no token remains" is already satisfied; the AC functions as a regression guard.
- **Context-economy test exists with extensible assertions** — `test-design-committee-context-economy.sh` carries enumerate-only Consolidator checks (lines 29-35), team-lead-reads-consolidator-output (line 77), reads-only-Final-Position (lines 78, 135). AC-6.1's additive extension is grounded.

## Findings

- **MEDIUM — version-pin language overstates the work (dead-work risk).**
  Spec said: "any test pinning a changed file's version is moved to the new version."
  Code shows: `test-design-committee-context-economy.sh:89` pins team-lead `v0008–v0099` and `:104` pins SKILL `v0018–v0099` — both **range-based**. The planned bumps (team-lead v0015→v0016, SKILL v0025→v0026) stay inside range, so no pin edit is needed.
  Impact: a plan-build task to "move pins" would be dead work. **Addressed:** the spec's Testing Strategy was reworded to state the pins are range-based and tolerate the bumps; test work is purely additive.

## Risk Assessment

The spec accurately describes the codebase it targets — every file, version, contract, and structural claim verified against source. No HIGH findings. The single MEDIUM was a cosmetic over-statement of test work, corrected inline. The spec is safe to take into plan-build as written.

<!-- created-at: 2026-06-19T16:18:45Z -->
<!-- produced-by spec-harden@v0001 -->
