# Committee Analysis — design-large-task reference cleanup

**Sprint:** 20260605-01-remove-largetask-references
**Round:** 01 (one-round consult)
**Question:** What rule governs each of the twelve live `design-large-task` references — delete the mention or re-point it to `design-small-task` / the surviving pipeline — and how do the four pinning tests move in lockstep so the suite stays green?

## Outcome in one line

Four governing rules sorted by category, not one uniform rule. The committee converged once the researcher supplied ground truth; one disposition (the fork-policy test) remains a designer decision because both paths are coherent and they differ in scope, not correctness.

## Alignment pattern

- **Re-point the canonical-sequence references** — unanimous (4 of 4). Drop `design-large-task`, keep `design-small-task`, preserve the entry-path concept. The sequence is one concept losing one member, not two coupled concepts.
- **Delete the producer / stamping-list entries** — 3 of 4 (Conservator dissented on a harvest-correctness concern). The researcher resolved the dispute factually.
- **Delete the "unique-to-large-task behavior" rows** — 3 of 4 (same dissent). These name behavior — proof loop, step-b poles, capture-thought usage, the thinking/process artifact types — that no surviving skill exhibits. Re-pointing them would assert a false equivalence and imply those artifacts can still be produced.
- **Delete the fork-policy step-b pole rows** — 3 of 4 (Conservator preferred moving them to an archive section).
- **Disposition of the fork-policy pole-row test** — genuine four-way split; the unresolved designer decision below.

## Researcher ground truth (load-bearing)

- **Harvest does not read the producer list.** `chester-trailer-write harvest` walks existing artifact files and reads the trailer lines already written into them; it never consults the schema's producer table. The list is documentation. Dropping `design-large-task` from it changes no runtime behavior and cannot orphan archived trailers — those carry their own provenance independently. This disproves the Conservator's load-bearing claim and satisfies the Conservator's own gate ("prove the cost before deleting"): the cost is nil.
- **The step-b pole agents are dead as named.** Zero `design-large-task-step-b-*` agent files exist. The four-pole mechanism survives under `design-committee` with different agent names. Critically, rows describing the committee poles **do not yet exist** in fork-policy.md — so the step-b rows cannot be "re-pointed," only deleted; authoring committee rows would be net-new content.

## The cleanup, by category

**Re-point (drop large-task, keep small-task):**
- `execute-write` — the worktree-creation parenthetical in Common Setup
- `design-specify` — entry condition + invoked-by
- `plan-build` — the canonical-sequence mentions in context + integration
- `start-bootstrap` — description + when-to-call
- `util-design-partner-role` — the surviving half of the intro line
- `util-worktree` — the caller named in the integration note

**Delete (no surviving exhibitor / pure stale):**
- `util-artifact-schema` — producer-table entry, stamping-list entry, and the thinking/process artifact-type rows
- `util-design-partner-role` — the capture-thought usage sentence
- `start-bootstrap` — the session-meta hash of the removed skill file
- `design-specify` — the reads-reference to the now-absent large-task template path
- `design-brief-small-template` — the use-the-full-template rows pointing at the absent path
- `finish-write-records/record-formats` — the stage-enum entry
- `docs/fork-policy` — the step-b pole rows

**Simplify (load-bearing, keep the core):**
- `plan-build` cascade explanation — trim the large-task clause, keep the cascade rule. This is the text the heuristic test pins.

**Deliberate rewrite (not line-by-line):**
- `docs/instructions` — the design section carries many hits across a comparison table and the pipeline description. Rewrite the section as current-state rather than scrubbing line by line, which would leave partial truths.

**Archive (full orphan — resolved in post-digest Q&A):**
- `agents/agent-industry-explorer` — the researcher confirmed no surviving skill dispatches it: design-small-task's second phase is entirely inline, and the removed skill was its sole caller. Move the agent file to `_archive/design-large-task/` alongside the pole agents. The only live file naming it — the fork-policy row for that dispatch site — is deleted with the other dead rows (see below).

## Tests in lockstep

- **test-plan-build-heuristic** — remove the large-task grep assertion; the other assertions survive once the cascade text is simplified.
- **test-artifact-schema** — drop large-task from the producer loop; surviving producers stay.
- **test-artifact-schema-provenance** — drop large-task from the stamping-skill loop; surviving skills stay.
- **test-ac-4-1-fork-policy-pole-rows** — see designer decision. Post-digest, Pragmatist and Purist both resolved to delete/archive this test once the researcher confirmed no committee pole rows exist to redirect it to; that consensus points at Path A.

## Version bumps

`plan-build`, `util-artifact-schema`, `design-specify`, `util-design-partner-role`, `start-bootstrap`, `execute-write` each take a version bump. Reference files under a skill ride the parent skill's bump — they carry no own version.

## Designer decision — RATIFIED: Path A

The designer chose Path A on 2026-06-05.

- **Path A (chosen) — complete the removal, defer the gap.** Delete the step-b rows; archive `test-ac-4-1` alongside the other 27 design-large-task tests (the criterion it pins was a removed skill's behavior with no live equivalent). The gap — fork-policy.md carries no `design-committee` pole rows — is recorded as a follow-up, not closed here. This sprint stays scoped to removing references.
- Path B (not chosen) — replacing the step-b rows with `design-committee` pole rows and rewriting the test this sprint — was set aside as a separate follow-up to avoid pulling net-new policy authoring (and its own correctness surface) into a removal sprint.

**Deferred follow-up (logged):** fork-policy.md has no `design-committee` pole rows. The four-pole mechanism is live under `design-committee` but undocumented in the fork policy. A future sprint should author those rows and a replacement pole-row test. This is a documentation gap, not a functional one — the committee agents exist and never fork by construction.

## Residual risk addressed

The brief's two flagged risks are both retired by ground truth: the producer-list deletion does not orphan trailers (harvest does not read the list), and the canonical-sequence re-point is unanimous and consistent (one concept, one surviving member), so the inconsistent-re-pointing risk is contained by handling all sequence mentions identically.

---

### Change log

- 2026-06-05 — Round 01 analysis written from four advocacy positions + researcher findings + consolidated-00 enumeration.
- 2026-06-05 — Post-digest peer Q&A amendments folded in: agent-industry-explorer confirmed full orphan (archive + delete its fork-policy row); Pragmatist and Purist resolved test-ac-4-1 to delete; Conservator conceded the producer-list deletion after the harvest ground truth, making that decision unanimous.
