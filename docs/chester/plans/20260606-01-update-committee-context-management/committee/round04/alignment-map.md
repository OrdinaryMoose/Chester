# Alignment Map — Round 04 (plan decomposition)

Synthesized by team-lead from `consolidator-output.md` + researcher findings. Source positions: 4 advocate Final Positions (round04). Written before convergence; audit record.

## Alignment pattern

- **4-0** dependency-driven ordering (not spec-order). Causal: schema-defining files before schema-consuming files.
- **4-0** member-protocol first (defines `## Final Position` schema = structural ground truth that consolidator read-scoping + team-lead signal-rejection both depend on).
- **4-0** SKILL.md last / near-last (orchestration capstone — references every other file).
- **3-1** template precedes scribe (scribe consumes the template as input). Conservator alone ordered scribe-first; this is a plain dependency error, not a real split.
- **4-0** all tasks docs-producing; sole regression target is `tests/test-design-committee-context-economy.sh` (researcher-verified single test).

## Splits and resolution

- **Task-count 6 vs 7** — artifact of (a) standalone-test-task and (b) member-protocol+consolidator merge. Resolved below.
- **member-protocol + consolidator: merge (Pragmatist) vs split (3 others).** RESOLVED → **split.** Different files, different acceptance criteria (member-protocol implements the schema/signal/peer-DM constraints 5,6 + channel formats; consolidator implements read-scoping constraints 1-4). The "consolidator edit is tiny" argument does not outweigh clean per-task test assertions and AC traceability. 3-1 favors split.
- **Test task: standalone (Conservator end-window / Pragmatist TDD-first) vs none (Innovator, Purist).** RESOLVED → **no standalone test task; per-task assertion updates.** Chester per-task discipline = each task keeps the suite green by updating the slice of the integration test for its own contract in the same commit. The existing `digest` grep (which only matches SKILL.md) is revised inside the SKILL.md task — the only task that changes that string. This honors Conservator's red-window concern (named explicitly in the SKILL.md task) without a separate task, and Pragmatist's write-first via a per-task test step.
- **AC1 (token budget) emergent (Purist flag).** RESOLVED → AC1 is **end-to-end emergent**, not deliverable by any single task. Not markable complete until the whole pipeline (all tasks) lands and the integration test + a manual committee run confirm it. Recorded in plan acceptance mapping, owned by no single task.

## Option set (decompositions considered, discarded with reason)

- **Spec-order (SKILL.md first).** DISCARDED — reverses causal direction; SKILL.md would assert flow contracts that member-protocol must retrofit (Innovator blocking_risk). 4-0 against.
- **Merge member-protocol+consolidator (6-task).** DISCARDED — see split resolution; schema iteration would block the consolidator edit (Pragmatist's own blocking_risk).
- **Standalone test task (7-task via test).** DISCARDED — per-task green discipline is cleaner for a single integration test; folds test edits into the contract task that causes them.

## Added by researcher ground-truth (not in any advocate decomposition, not in spec §9)

- **committee-analysis-round-format.md sync** — new per-round files (`alignment-map.md`, `verdict.md`, scribe draft) are absent from its folder-shape listing. A dedicated task keeps the format doc in sync (the spec omitted this surface). This is the 7th task.
- **Two-place sync target** — `skills/setup-start/references/skill-index.md:27`, folded into the SKILL.md task with the version bump.
- **scribe + template both confirmed non-existent** — both are create-new tasks.
