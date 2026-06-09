# Reasoning Audit: Catalog-only generator + voice/rule single-sourcing

**Date:** 2026-06-08
**Session:** `00`
**Plan:** `20260607-01-update-voice-discipline-plan-02.md`

## Executive Summary

The session re-scoped a refactor that execution had already partly falsified, then planned and built the corrected scope. The most consequential decision was made by the committee and ratified by the designer: reduce the build-time generator to catalog-only, abandoning member and reviewer generation, because the underlying "shared instruction text" premise held only for the catalog, voice rules, and CLAUDE.md. Implementation stayed on-plan except for one surfaced gap — version-pin tests broke on the required version bumps — which was remediated inline and confirmed by the final review. All six surviving acceptance criteria are satisfied; the suite is 30/0.

## Plan Development

The plan was not carried in fully-formed: it was derived this session from the corrected spec-01, which itself was rewritten from the committee's round-04 verdict. The dispatcher mapped the file structure after discovering that the catalog pipeline was engine-only (the generator code existed from prior commits, but the manifest, template, and generated index did not). Plan-02 therefore had to both strip the abandoned agent-mode code and build the real catalog pipeline. It passed spec-fidelity review on the first pass and absorbed one Critical + three minor adversarial findings before execution.

## Decision Log

### Catalog-only scope adoption
**Context:** Execution of the prior plan falsified two premises (members can't be assembled from two sources; reviewer disciplines are per-consumer). The committee had to decide whether the generator should be catalog-only or retain a narrowed reviewer fold.

**Information used:**
- Line-level diffs proving member shared/lens interleave (~16×) and reviewer confidence-ladder divergence (~13 lines).
- The spec/plan contradiction (AC-8.1 vs plan-01 F4).
- The already-built, committed catalog generator + folded-block fix.

**Alternatives considered:**
- `Catalog + narrowed reviewer fold` (Innovator) — rejected: keeps a generation path no committed file consumes; the one foldable case is a one-time hand-fix, not a recurring drift surface.
- `Keep the general generator untouched` — rejected: no member defended it; no live constituency.

**Decision:** Adopt catalog-only; drop AC-2.1/AC-3.1, reduce AC-1.1/5.1/8.1 to catalog scope, keep AC-4.1/6.1/7.1.

**Rationale:** 3-1 committee majority converging from three independent lenses (stasis, cost, category); the dissent rested on a sunk-cost argument. Designer adjudicated option 1.

**Confidence:** High — verdict and designer adjudication explicit.

---

### Name-less one-shot committee dispatch
**Context:** The committee's advocacy member agent types carry `Read/Glob/Grep/Write` but **no `SendMessage`**. A prior session documented that members joined to a `TeamCreate` roster can never approve `shutdown_request`, permanently wedging `TeamDelete`.

**Information used:**
- The agent-type tool lists (no SendMessage).
- The `[[project_committee_teardown_gap]]` memory and prior-session ledger note.
- The fact that peer-DM is a two-round affordance, unused in a one-round consult.

**Alternatives considered:**
- `TeamCreate + roster dispatch` (the skill's literal flow) — rejected: would create a team that cannot be cleanly deleted, reproducing the documented wedge.

**Decision:** Dispatch the four advocacy members (and the ephemeral consolidator/scribe) as parallel name-less one-shot agents; disk transcripts are the handoff, tool-result is the routing signal.

**Rationale:** The committee is a flexible skill; one-round mode needs no peer-DM, so nothing is lost, and the teardown gap is sidestepped by construction.

**Confidence:** High — explicit, and the design-committee skill sanctions adapting dispatch to the question.

---

### Fold catalog generation and the verify test into one task
**Context:** AC-4.1 (generate the catalog) and AC-5.1 (the staleness verify test) are separate criteria, but the verify test diffs against the committed generated index.

**Information used:** The verify test's diff-against-committed mechanism — it can only be green once the real catalog is generated and committed.

**Alternatives considered:**
- `Separate tasks for generation and the verify test` — rejected: the test would be born red until the other task landed, creating an ordering hazard and a non-green intermediate commit.

**Decision:** One task (T2) creates the manifest, template, regenerated index, and verify test together.

**Rationale:** "Files that change together live together"; the test only makes sense atop the committed catalog. (inferred from the plan structure and the staleness contract.)

**Confidence:** High — rationale stated in the plan and the pre-write insight.

---

### Stable AC IDs with intentional gaps vs renumbering
**Context:** Rewriting spec-00 to spec-01 dropped AC-2.1 and AC-3.1, leaving gaps in the numbering.

**Information used:** The committee verdict references specific AC IDs; the standalone-documentation discipline favors current-state description.

**Alternatives considered:**
- `Renumber surviving ACs to 1.1–6.1` — rejected: would break the verdict's and prior artifacts' cross-references to those IDs.

**Decision:** Keep surviving IDs stable (1.1, 4.1, 5.1, 6.1, 7.1, 8.1); note the 2.1/3.1 removal in the change log.

**Rationale:** Preserves traceability to the committee record while accurately describing the corrected state.

**Confidence:** High — explicit in the spec's AC-section note.

---

### Inline remediation of version-pin breakage
**Context:** The required version bumps (util-design-partner-role v0006, design-small-task v0004) broke three version-pin tests the plan's per-task "Must remain green" lists had not enumerated. The T4 implementer correctly stopped at its task boundary and reported them.

**Information used:**
- A full-suite run confirming exactly three failures.
- Inspection showing the pins hard-code expected version strings; the bumps are correct and required.
- A quality-review finding that the new no-restatement sentinels were narrow.

**Alternatives considered:**
- `Spin up an implementer + per-task reviewers for the pin fix` — rejected: the change is mechanical reconciliation of test expectations to already-reviewed bumps; the mandatory final whole-range review covers it.
- `Edit the pins from within T4` — rejected: out of T4's scope; the implementer was right not to.

**Decision:** Fix the three pins + broaden two sentinels in one remediation commit (`c0d281f`); verify the suite green; rely on the final review for coverage.

**Rationale:** The bumps were already spec+quality reviewed; the pin update only reconciles expectations. Running the full suite between tasks is the net that caught the planner-side gap.

**Confidence:** High — decision and rationale explicit in-session.

---

### Defer the T2 quality finding to T5
**Context:** T2's quality review flagged (Important, 85) that the CLAUDE.md two-place-sync instruction now points at the wrong file/workflow once the catalog became generated.

**Information used:** Plan-02 already scheduled exactly that fix as Task 5 (CLAUDE.md two-tier dedup + phantom-pointer fix).

**Alternatives considered:**
- `Fix it inside T2` — rejected: would duplicate T5's scope and split a coherent change across two commits.

**Decision:** Leave it to T5; the staleness window is internal to the sprint (T5 lands before merge).

**Rationale:** The finding is real but already planned; fixing in place would muddy task boundaries.

**Confidence:** High — explicit.

<!-- session: 00 -->

<!-- created-at: 2026-06-09T01:44:08Z -->
<!-- produced-by finish-write-records@v0004 -->
