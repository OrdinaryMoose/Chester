# Innovator Position — Round 01

**Committee:** design-committee, remove-largetask-references
**Date:** 2026-06-05

---

## The Core Question

Should each of the twelve live references be deleted outright, or re-pointed to `design-small-task` and the surviving pipeline?

My position: **most deletions, a few re-points, and a harder choice about the canonical-sequence framing itself.**

---

## What the Files Actually Show

After reading all twelve files and all four pinning tests, the references cluster into three distinct types:

**Type 1 — Structural mentions that survive as historical provenance only.**

`util-artifact-schema` names `design-large-task` twice: once in the artifact-type table's "Produced by" column, and once in the Stamping Skills list. The producer-list entry says this skill produced 8-section design briefs and thinking files. Removing it from the producer list does not orphan any live functionality — archived artifacts that carry `produced-by design-large-task@vNNNN` trailers are frozen records; the trailer harvester reads them at finish-write-records time without needing the skill to exist. The stamping-skill list entry exists to document which skills call `stamp` — since the skill is gone, it should be removed from the stamping list. However, removing it breaks two tests (`test-artifact-schema` and `test-artifact-schema-provenance`) because both grep for `design-large-task` in the schema. The tests must move in lockstep: drop `design-large-task` from the two grep loops in those tests simultaneously with the schema edit.

**Type 2 — Canonical-sequence framing that re-points cleanly to `design-small-task`.**

`execute-write` (§1.2), `design-specify` (entry condition), `util-worktree` (Integration section), `plan-build` (Integration section, Spec compatibility note), `start-bootstrap` (When to Call), `util-design-partner-role` (first line — "Both design-large-task and design-small-task read this file"), and `docs/instructions.md` all describe the design entry path. In every case, the text can be re-read with `design-small-task` as the sole named entry point. These are genuine re-points, not deletions.

**Type 3 — Pole-agent rows in `docs/fork-policy.md` and the `agent-industry-explorer.md`.**

The fork-policy table lists rows 1c–1g all keyed to `design-large-task-step-b-*` and `design-large-task` dispatches. The industry-explorer agent itself is live (it was already renamed `agent-industry-explorer.md`), but the fork-policy still references it as `chester:design-large-task-industry-explorer`. The `design-small-task/references/design-brief-small-template.md` references `../../design-large-task/references/design-brief-template.md` — a path that now points into `_archive/`.

The pinning test `test-ac-4-1-fork-policy-pole-rows` greps for `chester:design-large-task-step-b-innovator/conservator/purist/pragmatist` in `fork-policy.md`. Those agents are archived with the skill. If the pole agents no longer exist in `agents/`, the fork-policy rows are orphaned documentation of archived machinery. The test becomes a green test for stale content, which is exactly the problem the sprint aims to fix.

---

## The Canonical-Sequence Question

The brief flags the half-truth risk: re-pointing from `design-large-task | design-small-task → design-specify` to just `design-small-task → design-specify` may look like a substitution, but the larger framing question is whether a two-task entry-point framing still makes sense at all.

My read: **the two-task framing is already gone by fact.** Only one design entry point exists. Re-pointing every reference to say `design-small-task → design-specify` accurately describes the current state. There is no residual ambiguity to resolve. The only honest framing is: design entry is `design-small-task`; `design-specify` formalizes the brief; `plan-build` writes the plan. The pipeline is linear at the design entry.

Coinage of a new term or a "single-design-entry" banner is unnecessary. The update is a deletion-and-repoint, not a rebranding event.

---

## Position on Each Reference

| Reference | Treatment | Rationale |
|---|---|---|
| `start-bootstrap/SKILL.md` — "When to Call" list | Re-point | Remove `design-large-task`, keep `design-small-task` as the sole caller |
| `start-bootstrap/SKILL.md` — skillVersion in session-meta | Delete mention | Session meta listed commit hash for `design-large-task` SKILL.md; drop that slot |
| `util-artifact-schema/SKILL.md` — producer table | Delete row references to `design-large-task` | Skill gone; producer column reflects live skills only |
| `util-artifact-schema/SKILL.md` — Stamping Skills list | Delete entry | Skill gone; stamping list is live-skill only |
| `util-artifact-schema/SKILL.md` — thinking/process artifact rows | Delete "Produced by" for large-task artifacts | No live skill produces these; optionally keep as historical note with rationale |
| `execute-write/SKILL.md` — §1.2 Verify Worktree | Re-point | Replace `design-large-task | design-small-task` with `design-small-task` |
| `plan-build/SKILL.md` — ground-truth cascade + canonical sequence | Re-point + tighten | The cascade text already mentions "design-large-task no longer produces a design-stage report" — that sentence can be simplified to just say design-specify owns it. The Integration section should drop `design-large-task` from the brief-source list |
| `util-design-partner-role/SKILL.md` — first line | Re-point | "Both design-large-task and design-small-task read this file" → "design-small-task reads this file" |
| `util-worktree/SKILL.md` — Integration | Re-point | Remove `design-large-task (Archival stage)` from Called-by list |
| `design-specify/SKILL.md` — entry condition | Re-point | Drop `design-large-task` from brief-source list; `design-small-task` plus external briefs still valid |
| `design-small-task/references/design-brief-small-template.md` | Fix path | The "use full template" reference points to `../../design-large-task/references/design-brief-template.md` — now archived; update path to `_archive/design-large-task/references/design-brief-template.md` or drop the cross-reference entirely |
| `finish-write-records/references/record-formats.md` — decision record `stage` field | Re-point | `design-large-task` listed as a valid stage; replace with `design-small-task` |
| `agents/agent-industry-explorer.md` — description line | Re-point | "Used by design-large-task during Phase 2" → attribute to the skill that now dispatches it, or make description generic |
| `docs/fork-policy.md` — pole-agent rows 1c–1g | Delete entire rows or re-point to `design-committee` poles | The step-b pole agents are archived; the committee poles (`design-committee-*`) are the live analogues. Re-point to committee if the committee dispatches the same explorer pattern; otherwise delete rows and add a note that pole advocates now live under `design-committee`. |
| `docs/instructions.md` — workflow description | Re-point | Any mention of `design-large-task` as an entry option should be replaced with `design-small-task` |

---

## The Four Pinning Tests

Each test must change in lockstep with its corresponding live file:

**`test-artifact-schema`** — currently greps for `design-large-task` in the producer list. After removing from schema: drop `design-large-task` from the `for producer in ...` loop. The test should assert the correct live producer set: `design-small-task design-specify plan-build execute-write finish-write-records`.

**`test-artifact-schema-provenance`** — same: drop `design-large-task` from both the stamping-skill loop (check 5) and the non-stamping-list check (check 6 does not include it, so that is fine).

**`test-plan-build-heuristic`** — the grep for `design-large-task` in `plan-build/SKILL.md` is pinning a specific mention in the ground-truth cascade section. After re-pointing plan-build, that mention is gone. The test assertion changes to: verify plan-build references `design-small-task` or `design-specify` in the cascade context. The test comment explaining the canonical sequence should update to reflect `design-small-task → design-specify → plan-build`.

**`test-ac-4-1-fork-policy-pole-rows`** — this test asserts that four `chester:design-large-task-step-b-*` rows exist in fork-policy.md. After handling the pole rows: if deleted from fork-policy.md, the test either changes to verify the committee pole rows exist, or the AC is retired (the step-b machinery is archived). Opinion: the test should be updated to verify the `design-committee` pole dispatch rows instead — the committee is the live successor to the step-b deliberation.

---

## Question to Researcher — and the Answer

Sent to researcher: does any live skill currently dispatch `agent-industry-explorer`? If not, the agent is an orphan and no re-point is possible.

**Researcher confirmed:** Full orphan. `grep -rn "industry-explorer|industry.explorer" skills/` returns zero results. `design-small-task` does its Phase 2 exploration entirely inline — no agent dispatch. The fork-policy row 1c references `chester:design-large-task-industry-explorer` (a non-existent named subagent, not the same as `chester:agent-industry-explorer`). Nothing live dispatches this file.

**Consequence for my position:** `agents/agent-industry-explorer.md` cannot be re-pointed — there is no live dispatch site to point to. The correct treatment is to move it to `_archive/design-large-task/` alongside the skill that owned it, or add a clear "archived" marker in its frontmatter. The fork-policy row 1c is a dead row pointing to a non-existent agent name — delete it.

---

## Summary

- Most references: clean re-point to `design-small-task` — honest, minimal, preserves continuity of pipeline framing.
- Producer list and stamping list in `util-artifact-schema`: delete — live-skill list only.
- Fork-policy pole rows: delete archived rows, update test to verify committee dispatch rows instead.
- `design-brief-small-template.md` cross-reference: fix path or drop cross-reference to archived skill.
- The canonical sequence framing does not need to be re-invented. "Design entry is now `design-small-task`" is factual, not a branding choice.
- All four tests update in lockstep with their corresponding file change — no test change happens without the file change, and no file change happens without the test change.
