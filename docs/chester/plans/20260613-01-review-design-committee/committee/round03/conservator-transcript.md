# Conservator — Round 03

## Question

Best home for the whole 8-step per-round sequence, on corrected terms: the choice is the whole sequence in one home, and declared authority arguments are void.

## Addressing Side B's Crux Directly

Side B's crux: the sole agent that executes the round reads team-lead.md at runtime — defend keeping the operating sequence in a file the executor does not consult during execution.

The premise is partially false. team-lead.md step 2 reads: "Per-round flow runs — per SKILL.md Phase 4 § Per-Round Flow." The executor, mid-execution, defers to SKILL.md as its operating reference for that step. This is not a residual editorial note — it is the step's execution instruction. If the sequence lived in team-lead.md exclusively, step 2 would point at itself, which is circular. The executor currently reads team-lead.md to learn *that* the per-round flow runs, then reads SKILL.md to learn *how*. That cross-reference is a live runtime dependency, not an artifact of editing.

**But I grant the crux partially.** team-lead.md step 2's deference to SKILL.md is an explicit citation of another file during execution — not ideal. If SKILL.md held the sequence and team-lead.md elaborated by name without integers, the executor would consult SKILL.md once for the numbered sequence and team-lead.md for elaboration, both during the same pre-convene read. That is exactly the reading order prescribed at team-lead.md lines 46-48 (SKILL.md read first, team-lead.md third). The reads are pre-execution, not during-step. The executor loads both before firing TeamCreate.

**The two-altitude option (Option 3) has merit but adds a new artifact surface.**

Option 3 (numbered checklist in team-lead.md + non-numbered prose overview in SKILL.md) is appealing because it places integers where execution happens. But it creates a prose-overview in SKILL.md that must stay in sync with team-lead.md's numbered list — two co-evolving artifacts with no enforcement. A mismatch between the prose overview and the numbered checklist is harder to detect than the current collision between two integer sequences, because one surface no longer carries integers to compare. The Conservator treats invisible drift as worse than visible collision: at least current duplication is detectable.

**Holding Option 1: whole sequence in SKILL.md, team-lead.md names steps without rival integers.**

The executor pre-reads both files. The sequence in SKILL.md is reachable at that pre-execution read — the "executor doesn't consult SKILL.md during execution" framing does not survive team-lead.md step 2's live citation. Option 3's sync problem is a new ongoing cost. Option 2 (sequence in team-lead.md) creates a prose ghost in SKILL.md that's harder to keep aligned than named elaboration. Minimum disturbance with lowest ongoing drift cost favors Option 1.

## Final Position

```
position: Option 1 — whole 8-step sequence in SKILL.md; team-lead.md names steps without rival integers.
rationale: The executor-consults-team-lead.md-not-SKILL.md crux fails: team-lead.md step 2 explicitly defers mid-execution to "SKILL.md Phase 4 § Per-Round Flow," making SKILL.md a live runtime reference, not a dead declaration. Both files are pre-read before TeamCreate fires. Option 3's two-altitude split creates a prose-overview in SKILL.md that must co-evolve silently with the numbered checklist in team-lead.md — invisible drift risk is worse than the current visible collision. Option 1 fixes the collision with minimum new coupling.
blocking_risk: If the executor truly did not read SKILL.md at runtime, putting the sequence there would be operationally inert — but team-lead.md step 2 makes SKILL.md a live citation, undermining that objection.
warrant: type: evidence | source: team-lead.md line 96 step 2 — "Per-round flow runs — per SKILL.md Phase 4 § Per-Round Flow" — executor defers to SKILL.md mid-step, not merely in pre-read; team-lead.md lines 46-48 — both files in pre-convene reading order.
```
