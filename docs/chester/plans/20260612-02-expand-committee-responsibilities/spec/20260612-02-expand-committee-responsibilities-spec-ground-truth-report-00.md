# Ground-Truth Report — Decompose the Specification System

**Spec reviewed:** spec-01
**Date:** 2026-06-12
**Status:** Findings — 2 MINOR + 1 INFO (none blocking; the spec's load-bearing claims about the skill tree are accurate). MINOR items fixed in spec-01 inline; INFO deferred to plan-build.

## Verified claims (load-bearing)

- **Architect|write|harden seam is genuinely clean** — `skills/design-specify/SKILL.md:30-35`. Step 3 = competing-architectures + prior-art + selection; step 4 = write spec; steps 5/6/7 = fidelity → adversarial → ground-truth; step 8 = user gate. Non-interleaved — the "extraction, not rewrite" premise (D12) holds.
- **Three review-side reference files exist** — `skills/design-specify/references/{spec-reviewer,adversarial-spec-review,ground-truth-reviewer,spec-template}.md` all present. The move-to-new-skills claim targets real files.
- **`design-small-task` transitions to `design-specify`** — `skills/design-small-task/SKILL.md:258` (+ 25, 252). The AC-1.1 repoint target is a real routing reference.
- **`bin/chester-generate-agents` is the catalog generator** — wrapper execing `chester-util-config/chester-generate-agents.sh`, whose `emit_catalog()` reads each SKILL.md frontmatter into the catalog. AC-4.3 mechanism is sound.
- **`skill-index.md` lists `design-specify`** — `skills/setup-start/references/skill-index.md:25`. Regeneration drops it.
- **spec-template Architecture field** reads `{architecture chosen from design-specify hybrid}` — `skills/design-specify/references/spec-template.md:18`. Exactly D10's edit target.
- **plan-build / start-bootstrap are live routing** — `plan-build/SKILL.md:305` (`Invoked by: design-specify`); `start-bootstrap/SKILL.md:7,21,23` (names design-specify as a standalone caller it bootstraps). Correctly deferred to plan-build for classification.

## Findings

- **MINOR (fixed in spec-01): `CLAUDE.md` named as a repoint target but has zero `design-specify` references.** Spec listed it among current-state docs; `grep -c design-specify CLAUDE.md` = 0. Removed from the repoint list. Real current-state targets: `docs/instructions.md` (live-pipeline diagram + `### chester:design-specify` section) and `docs/README.md`.
- **MINOR (fixed in spec-01): AC-4.1 omitted the ~9-file test footprint** that AC-5.1 separately owns, including `test-stamping-design-specify.sh` (filename-coupled — a rename, not just an edit). Added an explicit test-suite boundary to AC-4.1 and a Components note.
- **INFO (deferred to plan-build): `tests/test-no-archived-refs.sh`** references `design-specify` and may assert "no references remain anywhere." The atomic cutover + preserved-history carve-out could put it in tension; plan-build reads it during planning. Not a spec inaccuracy.

## Risk assessment

The spec accurately describes the skill tree it targets. The clean, non-interleaved seam confirms the central "extraction, not rewrite" premise — the lowest-risk way to satisfy the no-regression constraint (CC1). All named files, routing targets, and the catalog generator exist at cited locations. The two MINOR findings were footprint-accounting imprecisions, now corrected; the INFO item self-resolves during planning. No finding blocks plan-build.

<!-- created-at: 2026-06-12T12:48:58Z -->
<!-- produced-by design-specify@v0004 -->
