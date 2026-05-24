# Deliverables Consolidation — Designer Decision Packet

**File:** `deliverables-consolidation-00.md`
**Macro step:** 1 of 4 (deliverables)
**Rounds:** R1, R1 DM, R2, R3 complete
**Audience:** Designer
**From:** team-lead
**Source returns:** sixteen verbatim files on disk (`r1-deliverables-*`, `r1-dm-*`, `r2-deliverables-*`, `r3-final-*`)
**Date:** 2026-05-21

---

## 1. What the decision is

Three deliverables are now fully specified across four poles. Two of three open R2 divergences resolved by R3 concessions. One remains open and requires designer adjudication.

- **Ratify** the four-pole convergence on Constraint Envelope and Resolution Criterion shapes.
- **Adjudicate** the single open question on Coverage Map row granularity (2-2 split among poles).
- **On designer ratification**, deliverables lock. Macro step 2 (process) begins.

---

## 2. Analysis of the catches

### What the four poles agreed on

These items have four-pole convergence with no open dissent at R3.

- The three deliverables are **Constraint Envelope**, **Resolution Criterion**, and **Coverage Map**.
- All three deliverables share **`concern_id`** as the single join key. Cross-artifact reading is one-step.
- All entry IDs use **typed prefixes** the Clerk enforces at read time. `CE-NNN` for Concerns. `AX-NNN` for axioms. `PR-NNN` for Propositions. `EV-NNN` for Evidence.
- Body fields use the **IF/THEN** form for architectural commitments and **IF NOT/THEN** for falsifiability tests. No prose.
- The Clerk sets a **`structural_valid` boolean** on every collapse_test after a syntactic match check.
- The `collapse_test` field **co-locates with the Proposition body** on the same record. Document-sync drift cannot happen because there is no second document.
- **Axiom rows carry no collapse_test row** in the Resolution Criterion. Axioms are designer-asserted ground truth, not subject to falsifiability.
- **GAP status blocks session close.** No design exits while a Concern is uncovered.
- The Coverage Map carries **lists of axiom IDs and Proposition IDs** (not counts). Lists support Clerk cascade re-audit on revision; counts do not.

### What R3 concessions settled

These items moved from disagreement to convergence during R3.

- **Status location.** Conservator conceded to the three-pole position. `status` ENUM { RATIFIED | REVISED-PENDING } lives on each **Constraint Envelope row**, not on the Coverage Map. The consumer reads RATIFIED versus REVISED-PENDING without joining to a second artifact.
- **Provenance enum.** Pragmatist and Purist conceded to Innovator and Conservator. **`provenance: ENUM { DESIGNER | AGENT }`** is a field on each Constraint Envelope row. The Clerk reads it at every round close to enforce axiom-collision detection and to scope cascade re-audit correctly.

### The open question — Coverage Map row granularity

Two-versus-two split at R3. Both positions hold with stated reasoning.

- **Summary-only camp (Pragmatist + Purist).** Coverage Map contains exactly one row per Concern, with rolled-up status. Detail data the Clerk needs for re-audit lives in the Clerk's working state, not in the deliverable. The deliverable carries only what the design-specify consumer reads. Purist treats hidden artifact rows as a category violation.
- **Summary-plus-detail camp (Conservator + Innovator).** Coverage Map contains a summary row per Concern for consumer reads, plus detail rows per (concern_id, entry_id) for Clerk re-audit, both inside the same artifact. Conservator argues that cascade detection on revision of a single Proposition inside a multi-Proposition Concern requires the detail rows in the artifact. Innovator marks the detail rows as Clerk-internal in the artifact itself.

### The architectural question behind D3

The split is really about a single question: **does the deliverable carry Clerk state or only consumer state?**

- Summary-only says deliverables are pure consumer artifacts. Anything the Clerk needs is Clerk's own working data, separate from the artifact.
- Summary-plus-detail says the artifact is a single record that carries both views, with internal-versus-external clearly marked.

Each side claims the other risks a regression.

- Summary-only risks Clerk losing cascade traceability if working state is separated from the deliverable and one of them is lost or out of sync.
- Summary-plus-detail risks consumer confusion if the consumer reads detail rows by accident, plus a violation of the principle that artifact contents are fully specified for one reader.

---

## 3. Recommendation

Team-lead recommends **summary-only** for Coverage Map (Pragmatist + Purist position) with one modification.

- **The deliverable is a pure consumer artifact.** No hidden rows, no internal marking, no consumer-confusion surface. Consumer reads one summary row per Concern and decides COVERED, AXIOM-ONLY, or GAP at a glance.
- **The Clerk maintains a separate working record** of detail data — axiom-to-Concern and Proposition-to-Concern mappings with Evidence chains. This record is the Clerk's audit-and-cascade tool. It is not a deliverable. It is not consumed by design-specify.
- **The modification.** The Clerk's working record must be persisted between rounds. If the Committee re-opens the design, the Clerk re-loads the working record and re-audits from it. This addresses Conservator's cascade-traceability concern without putting Clerk state into the consumer artifact.

The recommendation traces to two principles:

- **Brilliant simplicity** — a Coverage Map with one row per Concern is the simplest sufficient shape. Adding a second row type for the same artifact doubles the schema and produces no consumer value.
- **Agents do not justify jobs** — keeping Clerk state out of the artifact prevents the artifact from absorbing operational mechanics that belong to the Clerk's role. The artifact stays load-bearing for the consumer alone.

If you disagree and prefer summary-plus-detail, the recommendation switches to Innovator's "both tiers in same document with Clerk-internal rows clearly marked" formulation. That position is Vision-compliant; it just trades simplicity for cascade-traceability robustness.

---

## Locked deliverable shapes (on designer ratification of D3 + the convergences)

If recommendation accepted, the final three deliverable shapes are these.

**Constraint Envelope.** Five fields per row.
- `concern_id` (CE-NNN)
- `entry_id` (AX-NNN or PR-NNN)
- `source` ENUM { AXIOM | PROPOSITION }
- `body` IF/THEN architectural-altitude claim
- `provenance` ENUM { DESIGNER | AGENT }
- `status` ENUM { RATIFIED | REVISED-PENDING }

**Resolution Criterion.** Four fields per row. Axiom rows excluded.
- `concern_id` (CE-NNN)
- `entry_id` (PR-NNN only)
- `collapse_test` IF NOT/THEN contrapositive
- `structural_valid` boolean (Clerk-set)

**Coverage Map.** Five fields per row. One row per Concern, rolled up.
- `concern_id` (CE-NNN)
- `axiom_ids` list of AX-NNN
- `proposition_ids` list of PR-NNN
- `evidence_ids` list of EV-NNN
- `status` ENUM { COVERED | AXIOM-ONLY | GAP }

---

## Notable verbatim quotes

Pole voice the synthesis above loses.

- **Conservator on cascade traceability (D3 case for detail rows):** *"Summary-only loses Clerk's ability to trace cascade on revision when a single Proposition in a multi-Proposition Concern is revised. Purist's 'both' is the minimum sufficient structure."*
- **Purist on category violation (D3 case against detail rows):** *"Clerk-internal detail rows not exposed to consumer is a category violation — artifacts must be fully specified, not partially hidden. If Clerk needs detail for re-audit, it maintains that state in its working record, not in the deliverable."*
- **Pragmatist on row-level versus artifact-level state (D1 closing argument):** *"Status belongs on the Constraint Envelope row because REVISED-PENDING must block design-specify consumption at the row level, not require a Coverage Map lookup to discover."*
- **Innovator on provenance as operational gate (D2 case for keeping it):** *"Provenance DESIGNER | AGENT is a two-value closed enum, not audit trail; Clerk needs it at read time to enforce axiom-collision detection ... and to scope cascade re-audit correctly."*
- **Conservator on provenance and the Vision (D2 case for keeping it):** *"Provenance is not audit trail. It is the structural enforcement of two-player asymmetric authority at the entry level."*
- **Pragmatist conceding D2 (self-correction):** *"Innovator's argument is correct at the operational level: Clerk needs provenance at read time to distinguish axiom-collision ... from cascade-flag scope. Not audit trail when Clerk consumes it mechanically on every round."*
- **Conservator conceding D1 (self-correction):** *"Row-level status on Constraint Envelope is correct; consumer needs to distinguish live RATIFIED rows from REVISED-PENDING rows in the same document without consulting a second artifact."*

---

## What happens next

Awaiting your adjudication on three items.

- Ratify the four-pole convergence on the Constraint Envelope shape.
- Ratify the four-pole convergence on the Resolution Criterion shape.
- Adjudicate D3 (Coverage Map row granularity) — accept the summary-only recommendation, or direct the summary-plus-detail alternative, or specify a different shape.

On adjudication, deliverables lock. Macro step 2 (process) begins — how a session moves from open to closed under these deliverable shapes.
