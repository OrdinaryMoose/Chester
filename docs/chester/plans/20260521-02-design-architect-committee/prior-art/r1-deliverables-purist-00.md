# R1 Deliverables — Purist (verbatim)

**File:** `r1-deliverables-purist-00.md`
**Pole:** Purist
**Round:** R1 of 3 (deliverables)
**Macro step:** 1 of 4 (backwards order)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PURIST — R1 DELIVERABLES

---

## 1. CONSTRAINT ENVELOPE

Purpose: Records every architectural commitment the design must hold true, bounded by designer-asserted axioms plus ratified Proposition bodies.

Required content fields (closed-set):
- concern_id: string (CE-NNN prefix, Clerk-enforced)
- source: enum { AXIOM | PROPOSITION }
- body: IF/THEN architectural-commitment sentence (subject-verb-object; no implementation vocabulary)
- ratified_by: enum { DESIGNER }
- round: integer

Read-out shape: flat list of (concern_id, source, body) rows, ordered by concern_id then source. One row per axiom, one row per ratified Proposition body. No prose wrapper.

Minimum viable form: one AXIOM row per Concern OR one PROPOSITION row per Concern. Any Concern with neither row is an open gap, not a constraint — Clerk flags it.

---

## 2. RESOLUTION CRITERION

Purpose: States the failure condition for each Concern — what would make the design wrong at that Concern — so design-specify can test against it.

Required content fields (closed-set):
- concern_id: string (CE-NNN, FK to Constraint Envelope)
- collapse_test: IF NOT/THEN contrapositive sentence (architectural altitude; no implementation vocabulary)
- grounding: list of Evidence IDs (EV-NNN, existence-checked by Clerk)
- ratified_by: enum { DESIGNER }

Read-out shape: flat list of (concern_id, collapse_test, grounding) rows, one row per ratified Proposition. Concerns covered only by axioms carry no collapse_test row — axioms are designer-asserted ground truth, not subject to contrapositive.

Minimum viable form: one collapse_test row per non-axiom-covered Concern. Clerk flags any Concern whose only coverage is an axiom but whose delta was deliberated — at least one collapse_test required.

---

## 3. COVERAGE MAP

Purpose: Proves that every Concern is addressed — maps Concern to the entries that cover it and the Evidence that grounds those entries.

Required content fields (closed-set):
- concern_id: string (CE-NNN)
- coverage_source: enum { AXIOM | PROPOSITION }
- entry_id: string (AX-NNN or PR-NNN, typed prefix)
- evidence_ids: list of EV-NNN (empty permitted for AXIOM rows — designer voice grounds axioms)
- status: enum { RATIFIED | OPEN | GAP }

Read-out shape: one row per (concern_id, entry_id) pair. GAP rows are concerns with no RATIFIED entry of either source — Clerk produces these automatically at session close.

Minimum viable form: every Concern appears at least once. Any Concern appearing only as GAP blocks session close.

---

## COMPOSITIONAL INTEGRITY NOTE

Three deliverables share one key: concern_id. Every CE-NNN that appears in the Coverage Map must appear in the Constraint Envelope (body) and the Resolution Criterion (collapse_test, if applicable). Clerk enforces this FK consistency at round close. No orphaned rows. No dangling IDs. The three documents form one coherent indexed record, not three independent files.
