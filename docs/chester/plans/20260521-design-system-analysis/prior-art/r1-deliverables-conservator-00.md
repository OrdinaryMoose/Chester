# R1 Deliverables — Conservator (verbatim)

**File:** `r1-deliverables-conservator-00.md`
**Pole:** Conservator
**Round:** R1 of 3 (deliverables)
**Macro step:** 1 of 4 (backwards order)
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R1 DELIVERABLES

---

### 1. CONSTRAINT ENVELOPE

**Purpose.** Names what the design must hold true — the ratified boundary set the implementation phase inherits as invariants.

**Required content fields:**
- Concern ID (closed-set: must match registered Concern)
- Axiom rows: designer-asserted statements, each tagged DESIGNER-AXIOM (no agent authorship permitted)
- Proposition body rows: ratified IF/THEN architectural claims, each tagged RATIFIED, each citing Proposition ID
- Status: OPEN | RATIFIED | REVISED-PENDING (enumeration — no freeform)

**Read-out shape.** Per-Concern block: axioms first, then ratified Proposition bodies. Downstream design-specify reads: "for Concern X, these claims must hold."

**Minimum viable form.** One Concern, one axiom row, one ratified Proposition body. Status = RATIFIED. No prose.

---

### 2. RESOLUTION CRITERION

**Purpose.** States the failure condition for each ratified Proposition — defines what "this design is complete" means operationally.

**Required content fields:**
- Proposition ID (back-reference to Constraint Envelope row)
- collapse_test: IF NOT [body claim] THEN [named consequence] (structural form enforced — no free prose)
- Verdict: HOLDS | FAILS | PENDING (enumeration)

**Read-out shape.** Per-Proposition row: body claim + collapse_test + verdict. Design-specify reads: "if this condition fails, this design is incomplete."

**Minimum viable form.** One collapse_test per ratified Proposition. Verdict populated before session close. No narrative wrapping.

---

### 3. COVERAGE MAP

**Purpose.** Proves every Concern has been addressed — maps each Concern to its axiom-coverage and Proposition-coverage with Evidence grounding.

**Required content fields:**
- Concern ID
- Axiom coverage: count of designer-asserted axiom rows for this Concern
- Proposition coverage: list of Proposition IDs addressing this Concern, each with Evidence ID citations
- Gap status: COVERED | GAP (enumeration — no partial or maybe)

**Read-out shape.** Per-Concern row: Concern ID, axiom count, Proposition IDs, Evidence IDs, gap status. Clerk certifies before session close. Any GAP row is a blocking condition.

**Minimum viable form.** One row per registered Concern. Gap status COVERED requires at least one ratified Proposition OR at least one axiom. No Concern may close as GAP.

---

### CONSERVATOR NOTE

Collapse_test is a self-report (Arbiter confirmed — no counterfactual engine). Structural form enforcement (IF NOT / THEN) is the sole mechanical defense. Any weakening of that form constraint dissolves the Resolution Criterion's load-bearing function. Hold the form. Designer ratification is the semantic gate; form is Clerk's gate. Do not merge them.
