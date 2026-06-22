# Session Summary: General Committee Skill Redesign

**Date:** 2026-05-22
**Session type:** Design + execute (workflow override)
**Plan:** *(no plan document — execute-write phase skipped per designer direction; see Handoff Notes)*

---

## Goal

Redesign the general-mandate `chester:design-committee` skill to establish a stable contract floor, separate the general-mandate primitive from skill-wrapped invocations (Mode B), document the `one-round-format` deliberation shape that emerged through usage, remove the deprecated Arbiter role and its proof-system contact surface, and reorganize agent files into the skill directory.

The work also surfaced and adjudicated the boundary between "general committee call" (broad-mandate, ad-hoc) and "skill committee call" (wrapping skill with sprint context, locked schemas, gates, Clerk) so the general primitive remains process-agnostic and the overlay never contaminates shared infrastructure.

---

## What Was Decided

### R1 — Mode Separation (ratified)

- **Convening message is the only legitimate attach point** for sprint-specific overlay. Ephemeral, leaves no residue.
- **Three forbidden attach surfaces:** agent files, the general SKILL.md, and output-format field labels. Editorial-discipline-only enforcement.
- **Floor-not-ceiling rule:** wrapping skills may add steps/fields/gates/roles via convening message; may not weaken or substitute any step named in SKILL.md.
- **Mode-distinguishability test:** inspect the convening message. Mode B carries a wrapping-skill name, sprint reference, locked schema, Clerk designation, or gate; Mode A carries none of these.

Full packet at `design/r1-mode-separation-decision-00.md`.

### R2 — Five Open Questions (ratified by designer)

- **Q1 (plugin namespace):** plugin.json gains `"agents": ["./agents/", "./skills/design-committee/agents/"]`. Both paths required because the field replaces (not augments) the default scan. Industry research confirmed identifier preservation (`design/industry-research-plugin-resolver-00.md`).
- **Q2 (partner-role inline vs reference):** Option R — reference `util-design-partner-role` with a load-bearing deletion-protected citation note in SKILL.md.
- **Q3 (one-round-format home):** Option S — inside SKILL.md, framed as a general committee format available to any wrapping skill.
- **Q4 (Researcher tool surface):** Middle path — Option P (preserve current tool surface: Read, Glob, Grep, Bash, WebSearch, WebFetch) plus a no-file-write construction-time constraint in the Researcher agent file.
- **Q5 (Arbiter cleanup):** Aggressive, no backward compatibility required. Previous proof-system sessions archive-only.

Full packet at `design/r2-open-questions-decision-00.md`.

### Architecture — Hybrid Recommendation (ratified)

Three architectures considered via `design-specify` parallel-architect dispatch:

- **Architect A — Self-contained SKILL.md.** Long file, inline everything, archive proof-session references in place.
- **Architect B — Reference-heavy SKILL.md.** Thin file, extract Translation Gate / role roster / contract surfaces into three new reference docs, retire proof-session references with supersession notice.
- **Hybrid — Compact self-contained primitive.** Single SKILL.md with all committee-load-bearing primitives in-place but written tightly; delete proof-session references outright; phased migration (manifest first, then file moves, then SKILL.md rewrite, then skill-index update).

Designer chose Hybrid. Hybrid was implemented.

---

## What Was Completed

### Phase 1 — Plugin Manifest

Added `"agents": ["./agents/", "./skills/design-committee/agents/"]` to `.claude-plugin/plugin.json`. Both paths listed because the manifest's `agents` field replaces, not augments, the default scan (confirmed by industry research).

### Phase 2 — Agent File Reorganization

Moved five active agent files from `agents/` to `skills/design-committee/agents/` via `git mv`. Each pole file had its Arbiter-routing prohibition stripped and replaced with a primitive-scoped no-proof-state-operations note. The Researcher agent file received the Q4 no-file-write construction-time constraint in both the frontmatter description and the Hard Prohibitions section, and its proof-state / Arbiter-routing language was scrubbed. The Arbiter agent file (`agents/design-committee-arbiter.md`) was deleted via `git rm`.

### Phase 3 — SKILL.md Rewrite

Replaced `skills/design-committee/SKILL.md`. Version bumped v0003 → v0004. New file: 250 lines, written in caveman-full voice per designer direction. Contents: positive and negative contract block (deletion-protected), six-role roster, Translation Gate spec inline with util-design-partner-role citation guard note, peer-DM protocol, one-round-format protocol (Q3 ratified), six-step workflow, decision-packet format, scope.

Three proof-session reference guides (arbiter-guide, team-lead-guide, researcher-guide) were designer-archived and deleted from the references directory.

### Phase 4 — Skill Index Update

Updated `skills/setup-start/references/skill-index.md` line 29: stripped the Arbiter mention from the design-committee entry; added a Mode B note clarifying that wrapping skills add sprint context via the convening message only.

---

## Verification Results

| Check | Result |
|-------|--------|
| Plugin manifest syntax | Valid JSON (manual inspection) |
| Agent file moves | Confirmed via `git status`; identifiers preserved per industry research |
| SKILL.md line count | 250 lines (target was 180–220; acceptable given caveman compression on contract block) |
| Empty references directory | Confirmed via `ls` |
| Arbiter file deletion | Confirmed via `git rm` |
| `/reload-plugins` smoke test | **Not run** — pending designer action |
| Dispatch test (`chester:design-committee-conservator` from fresh session) | **Not run** — pending |
| Codebase grep for Arbiter mentions | **Not run** — pending |

---

## Known Remaining Items

- **Verification debt.** Three checks above are pending: `/reload-plugins`, dispatch smoke test, codebase grep audit. All require designer action or follow-up agent session.
- **No commits made this session.** Live tree carries deletions, moves, and modifications across the five files / one directory. Staging discipline applies — no `git add -A`.
- **Sprint archive not yet performed.** `finish-archive-artifacts` would copy `working/` → `plans/` once the work is committed.
- **Original session ask still unmet.** Designer's opening ask was to red-team the `design-brief-for-specify-00.md` (StoryDesigner wrapping-skill design) and audit the actors-locked underspecification. Both were deferred when the sprint pivoted to general-committee redesign. The `design-brief-for-specify-00.md` and `handoff-pre-skill-write-00.md` artifacts remain in `design/` awaiting that follow-up work. Sprint dirs were split by the designer post-session: this sprint (`20260521-design-committee-update`) holds the general-committee redesign; `20260521-desgin-architect-committee/` holds the StoryDesigner wrapping-skill work that remains open.
- **Broader proof-system deprecation.** Designer indicated the proof system is deprecated and previous sessions are archive-only. This session cleaned only the design-committee contact surface with the Arbiter. `skills/design-proof-system/`, `skills/design-large-task/proof-mcp/`, and other proof-system scaffolding remain live. Deprecating them is its own sprint.
- **Follow-up briefs identified, not written:** mechanical enforcement of three forbidden surfaces (deferred per R1 §8); `docs/fork-policy.md` gap (committee subagent rows not in policy table); Chester convention for agent file location (when to use top-level `agents/` vs co-locate with skill).
- **Live committee team `design-committee-general` still up.** Five members idle. Tear down with `TeamDelete` when designer signals closure.

---

## Files Changed

### Source Tree

```
.claude-plugin/plugin.json                                                       modified — agents field added
skills/design-committee/SKILL.md                                                 rewritten — v0004
skills/design-committee/agents/                                                  new directory
skills/design-committee/agents/design-committee-conservator.md                   moved + Arbiter prohibition stripped
skills/design-committee/agents/design-committee-innovator.md                     moved + Arbiter prohibition stripped
skills/design-committee/agents/design-committee-pragmatist.md                    moved + Arbiter prohibition stripped
skills/design-committee/agents/design-committee-purist.md                        moved + Arbiter prohibition stripped
skills/design-committee/agents/design-committee-researcher.md                    moved + Arbiter scrubbed + Q4 constraint added
skills/setup-start/references/skill-index.md                                     line 29 Arbiter stripped, Mode B note added
agents/design-committee-arbiter.md                                               deleted
skills/design-committee/references/design-committee-arbiter-guide-00.md          deleted (designer-archived)
skills/design-committee/references/design-committee-team-lead-guide-00.md        deleted (designer-archived)
skills/design-committee/references/design-committee-researcher-guide-00.md       deleted (designer-archived)
```

### Sprint Artifacts (this sprint dir)

```
docs/chester/working/20260521-design-committee-update/design/
  ├── general-committee-redesign-brief-00.md           (sprint brief, two change-log entries v00 → v02)
  ├── r1-mode-separation-decision-00.md                (R1 ratified packet)
  ├── r2-open-questions-decision-00.md                 (R2 ratified packet)
  ├── industry-research-plugin-resolver-00.md          (industry-explorer findings)
  ├── handoff-post-execute-00.md                       (handoff for next agent)
  ├── design-brief-for-specify-00.md                   (pre-existing — StoryDesigner wrapping-skill brief, untouched this session)
  └── handoff-pre-skill-write-00.md                    (pre-existing — pre-pivot handoff, untouched this session)

docs/chester/working/20260521-design-committee-update/summary/
  └── 20260521-design-committee-update-summary-00.md   (this file)
```

---

## Commits

None this session. Live tree dirty.

---

## Handoff Notes

The cleanest hand-off document is `design/handoff-post-execute-00.md`. It captures sprint identity, what was done, what's pending, four candidate threads to pick up next (verification + backfill, original red-team ask, broader proof-system deprecation, follow-up briefs), live committee team status, and full file manifest.

### Critical context for the next session

- **Caveman mode is active** per the SessionStart hook. Designer-facing artifacts written this session use plain language (per established Chester voice discipline); inter-agent and chat-channel communication uses caveman.
- **Workflow was overridden.** Designer skipped `design-specify` mid-flow (after architect dispatch), and skipped `plan-build`, `execute-test`, `execute-write`, and `execute-verify-complete` entirely. The write happened directly. There is no spec document, no plan document, no TDD coverage, no spec-fidelity review, no adversarial review, no ground-truth review, and no execute-verify checkpoint. The records debt acknowledged here (this summary + the audit produced in parallel) is the only retrospective documentation of the work.
- **Two sprint directories exist** at `docs/chester/working/`. The designer split the original session into:
  - `20260521-design-committee-update/` — this sprint (general-committee redesign, complete).
  - `20260521-desgin-architect-committee/` — sister sprint for the StoryDesigner wrapping-skill work (original session ask, still open).
- **Live committee team `design-committee-general` is still up.** Useful for follow-up rounds in either sprint. `TeamDelete` when closure is signaled.

---

## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

*(no provenance trailers found — artifacts in this sprint were not stamped because the design and execute work bypassed the normal pipeline; the summary and audit produced by this `finish-write-records` invocation will carry trailers stamped at write-time)*

<!-- created-at: 2026-05-23T00:52:39Z -->
<!-- produced-by finish-write-records@v0003 -->
