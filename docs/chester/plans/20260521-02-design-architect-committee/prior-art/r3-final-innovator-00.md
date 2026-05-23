# R3 Final Positions — Innovator (verbatim)

**File:** `r3-final-innovator-00.md`
**Pole:** Innovator
**Round:** R3 of 3 (deliverables — final positions)
**Macro step:** 1 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

INNOVATOR R3 — FINAL POSITIONS

DIVERGENCE 1: HOLD — status must live on Constraint Envelope rows because REVISED-PENDING is operational state the Clerk reads per-entry during cascade re-audit, not a summary state; moving it to Coverage Map severs it from the entry it describes and forces an additional join for every cascade check.

DIVERGENCE 2: HOLD — provenance DESIGNER | AGENT is a two-value closed enum, not audit trail; Clerk needs it at read time to enforce axiom-collision detection (reject AGENT-authored body that contradicts a DESIGNER-authored axiom) and to scope cascade re-audit correctly (revising a DESIGNER axiom triggers broader re-audit than revising an AGENT proposition); stripping it forces Clerk to infer from entry_type alone, which breaks when entry_type=AXIOM and provenance is ambiguous.

DIVERGENCE 3: CONCEDE PARTIAL — adopt Purist's split: Clerk maintains detail rows per (concern_id, entry_id) internally for re-audit; exports a rolled-up summary row per Concern to design-specify. Conservator and Pragmatist are right that design-specify should not aggregate — that is Clerk work. Detail rows stay load-bearing for revision cascade; summary rows are the consumer-facing read-out. Both in one document, detail rows clearly marked as Clerk-internal.

FINAL POSITION SUMMARY:
- Constraint Envelope: five fields per entry (concern_id, entry_type, body, provenance, status); status RATIFIED | REVISED-PENDING lives on the envelope row, not the coverage map.
- Resolution Criterion: four fields per entry (concern_id, proposition_id, collapse_test, structural_valid); keyed on concern_id as shared join key; no change from R2.
- Coverage Map: two-tier output — Clerk-internal detail rows per (concern_id, entry_id) with coverage_source + evidence_ids + status; consumer-facing summary row per Concern with rolled-up status COVERED | GAP; both tiers in same document.
