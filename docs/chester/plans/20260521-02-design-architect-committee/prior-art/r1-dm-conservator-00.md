# R1 DM — Conservator (verbatim)

**File:** `r1-dm-conservator-00.md`
**Pole:** Conservator (critique of other three R1 proposals)
**Round:** R1 DM (deliverables)
**Macro step:** 1 of 4
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## CONSERVATOR — R1 DM CRITIQUE

**Innovator.** Right: `structural_valid: bool` on collapse_test is the correct move — Clerk-set flag separates structural enforcement from semantic judgment, preserving the structural/semantic split. Wrong: `provenance: ENUM {designer | pole_id}` on constraint envelope entries is underspecified. Pole_id is not a closed set — it scales with Committee size and admits ambiguity about which pole authored a conflicting claim. Conservator requires provenance be DESIGNER | AGENT (binary), not enumerated per pole. Push-back: `axiom-only` coverage status means a Concern is ratified-complete without any collapse_test — under what condition does design-specify know the design is wrong for that Concern? Axioms have no failure condition. Is that intentional?

**Pragmatist.** Right: resolution criterion as column projection of the Proposition record prevents document-sync drift on revision — structurally sound. Wrong: stripping status fields from the constraint envelope kills Clerk's ability to detect REVISED-PENDING state; without it, a revised-but-not-re-ratified Proposition looks identical to a clean ratified one. Cascade invalidation mitigation requires that field. Push-back: "audit trail is the design brief's job" — agreed for round provenance, but REVISED-PENDING is not audit trail, it is current operational state. Cuts too deep.

**Purist.** Right: typed ID prefixes (CE-NNN, EV-NNN, PR-NNN) are the strongest channeling instrument in any proposal — Clerk can enforce category-prefix integrity without an engine. Wrong: `ratified_by: enum { DESIGNER }` on constraint envelope has only one value — this is a dead field. Either expand it to carry revision history or drop it; a single-value enum does no work. Push-back: Coverage Map with one row per (concern_id, entry_id) pair creates multiple rows per Concern — fine for Clerk, but design-specify must then aggregate to determine COVERED/GAP. Does Purist intend design-specify to run that aggregation, or should Clerk produce a rolled-up status row per Concern alongside the detail rows?
