# Per-Round Sequence Canonical Ownership

**Date:** 2026-06-13

**Sprint:** 20260613-01-review-design-committee

**Source:** verdict from `committee/round01/verdict.md`; member positions from `committee/round01/consolidator-output.md`

---

## Summary

The committee was asked whether the design-committee per-round flow's canonical numbered sequence should live in SKILL.md or team-lead.md. The verdict is unanimous: SKILL.md owns the 8 numbered steps; team-lead.md drops its rival 1-11 integer list and elaborates each step by name only. This resolves a live self-contradiction in the current files and establishes a single authoritative source for any future wrapping skill to compare against.

## Verdict

The canonical numbered per-round sequence should live in **SKILL.md** as the single owner; team-lead.md should drop its rival 1-11 numbering and elaborate each step by name only.

## Rationale

The committee question resolves on two independently verified facts: SKILL.md is the persistent audit floor (per skill-contract.md), and team-lead.md already declares deference to SKILL.md at line 96 — then immediately contradicts that declaration with its own 1-11 integer list at lines 93-106. Both facts are present on the face of the files and were verified by all four members.

Option A was the unanimous choice. Option B (team-lead.md owns the canonical list; SKILL.md cites it) was discarded because it inverts the floor-detail relationship: making the audit baseline depend on an elaboration document conflicts with the explicit skill-contract.md floor rule, and no benefit was offered against that cost. Option C (status quo) was discarded because it sustains the live contradiction on every invocation without resolving it.

Three convergent extensions emerged beyond the bare answer and were not contested by any member. First, the dangling "(spec §5)" reference at SKILL.md:179 should be removed in the same edit pass — no such spec document exists in the tree, so the canonicity claim is currently unverifiable. Second, the three entries in team-lead.md's 11-step list that have no deliberation counterpart (ledger update, checkpoint principle, designer-response handler) should be relocated to their existing natural homes in team-lead.md rather than simply deleted, so no instruction is lost. Third, because no file currently cites step numbers from either sequence and no wrapping skill exists yet, migration cost is zero — but that cost becomes non-zero the moment a wrapping skill is authored against either numbering, which argues for acting now.

The recommended single edit pass covers two files: SKILL.md retains its 8-step Phase 4 sequence as sole canonical owner with the "(spec §5)" attribution removed; team-lead.md replaces its § Per-Round Flow integer list with named-step elaboration anchored to SKILL.md's 8 steps, and relocates the ledger update to § Ledger with an explicit round-boundary trigger, the checkpoint principle to its existing SKILL.md home, and the designer-response handler to § Conversation Loop.

## Dissent Record

**Alignment:** 4-0 unanimous

**Dissenting positions:** None — all members aligned.

## Deferred / Open

None.

---
