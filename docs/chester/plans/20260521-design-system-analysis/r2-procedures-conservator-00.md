# R2 Procedures — Conservator (verbatim)

**File:** `r2-procedures-conservator-00.md`
**Pole:** Conservator
**Round:** R2 of 3 (procedures — refined)
**Macro step:** 3 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R2 PROCEDURES

---

**Add Concern**
Mutates: Concerns registry — adds CE-NNN row (id, statement). NOT Constraint Envelope.
Trigger: OPEN, ANCHORED, or DELIBERATING. Late registration permitted.
Gates: CE-NNN prefix, uniqueness.
State: Coverage Map gains GAP row. If registered mid-DELIBERATING, poles may NOT propose against it in the same round — must wait next dispatch.
Refinements: target clarified to Concerns registry (Purist DM conflation caught in my own DM). Same-round proposal block added (Pragmatist push: uneven deliberation surface if new Concern opened mid-round without dispatch).

---

**Add Evidence** — unchanged from R1.

---

**Add Axiom**
Mutates: Constraint Envelope — adds AX-NNN row (source=AXIOM, provenance=DESIGNER, status=RATIFIED).
Trigger: ANCHORED or DELIBERATING.
Gates: CE-NNN must exist; body IF/THEN form enforced; provenance locked DESIGNER; **axiom-collision check: Clerk scans existing RATIFIED PROPOSITION rows for the same Concern — if any Proposition body contradicts the new axiom (structural negation of key terms), Clerk flags and blocks Add Axiom until designer resolves.**
State: OPEN→ANCHORED on first axiom. Late axiom in DELIBERATING: cascade scope captured synchronously for existing PROPOSITION rows on that Concern; deferred mutation at next Lint Batch.
Refinements: axiom-collision check added (Purist DM — "does not specify Clerk rejecting new axiom contradicting ratified Proposition; cascade and collision are different checks").

---

**Initiate Deliberation** (added from R1)
Mutates: session state only.
Trigger: ANCHORED, designer explicit signal.
Gates: at least one anchored Concern must exist.
State: ANCHORED → DELIBERATING.
Refinements: added (Innovator + 4-pole DM convergence — ANCHORED→DELIBERATING must be named designer act).

---

**Propose Proposition**
Mutates: Constraint Envelope — adds PR-NNN row (source=PROPOSITION, provenance=AGENT, status=REVISED-PENDING).
Trigger: DELIBERATING only.
Gates: CE-NNN must exist and be anchored; body IF/THEN form; collapse_test IF NOT/THEN form; all grounding EV-NNN exist and not withdrawn; **axiom-collision check: Clerk verifies Proposition body does not directly contradict any DESIGNER-AXIOM row for same Concern (structural negation check — not semantic); structural_valid set FALSE pending Lint Batch.**
State: row enters Constraint Envelope at REVISED-PENDING. No Resolution Criterion row yet.
Refinements: axiom-collision check added at gate (4-pole gap). Resolution Criterion row creation deferred to Ratify Row Accept (Pragmatist DM — deliverable artifact must not contain structural_valid=FALSE rows).

---

**Submit Round**
Mutates: none — signals round-end.
Trigger: DELIBERATING, designer explicit.
Gates: none pre-signal.
State: triggers Lint Batch; DELIBERATING → RATIFYING pending lint pass.
Retained (rejected Purist cut — Lint Batch needs a named caller for actor assignment in macro step 4).

---

**Lint Batch**
Mutates: structural_valid flags per row; FK checks; deferred cascade mutations → REVISED-PENDING on in-scope rows; Coverage Map recomputed.
Trigger: Submit Round.
Gates: Clerk executes unconditionally; blocks RATIFYING entry on any structural failure.
State: pass → RATIFYING. Failure → flagged rows returned, session stays DELIBERATING.

---

**Ratify Row**
Mutates: disposition ACCEPT → row status RATIFIED + Resolution Criterion row created (concern_id, entry_id, collapse_test, structural_valid=TRUE). Disposition REJECT → row status REVISED-PENDING + Clerk flags rejection reason.
Trigger: RATIFYING, per-row designer disposition.
Gates: structural_valid = TRUE required; designer explicit act per row; no auto-accept.
State: accepted rows unaffected by peer rejections. After all rows dispositioned: session-close gate evaluated.
Refinements: merged Accept/Reject into one procedure with disposition parameter (Pragmatist DM + Purist DM convergence — same trigger, same phase, same gate; split was artificial). Rejected Re-Ratify Row merge — gate differs (re-lint required first); collapsing obscures that precondition.

---

**Re-Ratify Row**
Mutates: REVISED-PENDING row status → RATIFIED after re-lint confirms structural_valid=TRUE.
Trigger: RATIFYING, per-row designer disposition.
Gates: Clerk re-lint must confirm structural_valid=TRUE first; designer explicit; row must be REVISED-PENDING.
State: row → RATIFIED. Contributes to session-close gate.
Held distinct (Pragmatist DM confirmed — gate difference is load-bearing).

---

**Revise Row**
Mutates: row body/collapse_test/grounding → REVISED-PENDING immediately; structural_valid reset FALSE; Clerk captures cascade scope synchronously.
Trigger: DELIBERATING or RATIFYING.
Gates: row must exist. DESIGNER for AXIOM rows; AGENT for own PROPOSITION rows only.
State: cascade dependents flagged in working record; deferred mutation at next Lint Batch.

---

**Withdraw Entry**
Mutates: row removed from Constraint Envelope permanently; full immediate cascade (both scope and mutation); Coverage Map recomputed.
Trigger: any phase except CLOSED; DESIGNER only.
Gates: entry_id must exist; withdrawal irreversible.
State: REVISED-PENDING on all grounding-dependent rows immediately. GAP if Concern uncovered → blocks session close.

---

**Close Session**
Mutates: session state → CLOSED; deliverables frozen.
Trigger: RATIFYING, session-close gate clears.
Gates: three Clerk-computed conditions (zero GAP, zero REVISED-PENDING, all PROPOSITION rows have structural_valid=TRUE Resolution Criterion row). Designer reads result.
State: RATIFYING → CLOSED. Terminal.
