# FAC-Complete Design — Input Contract

FAC stands for feasible, acceptable, and complete. Framework for evaluating designs, specifications, and plans: to be **suitable**, a design must be feasible, acceptable, and complete.

The single input type `spec-write` consumes. A "FAC-complete design" is a design whose architecture is already settled with suitability evidence — shown feasible, acceptable, and complete. It has **two interchangeable producers** — a `design-committee` verdict and a `spec-architect` output — and `spec-write` reads it through this one contract regardless of producer.

`spec-write` does not require producers to emit a new typed artifact. It **extracts** the eight fields below from the producer's native output.

## The eight fields and their spec-template destinations

| Field | Spec destination | Committee verdict source | spec-architect source |
|-------|------------------|--------------------------|-----------------------|
| **Goal** | spec Goal | verdict's problem statement | brief goal |
| **Chosen architecture** | spec Architecture field *(the quote-back field)* | verdict's chosen direction | user-selected option |
| **Rejected alternatives + declared sacrifices** | architectural rationale + Constraints | verdict's rejected lenses | architect alternatives |
| **Prior-art findings** | Components / reuse notes + adversarial-pass context | researcher findings | prior-art explorer output |
| **Ground-truth-verified facts** | Components + Data Flow (consumed without re-verification) | researcher ground-truth | re-verified later in spec-harden |
| **Constraints / guardrails** | spec Constraints | verdict constraints | brief + F-A-C constraints |
| **Acceptance-criteria seeds** | AC-N.M expansion | verdict acceptance signals | brief acceptance criteria |
| **Deferred / non-goals** | spec Non-Goals | verdict deferments | brief out-of-scope |

## Mandatory architecture quote-back

Before authoring **any** spec section, `spec-write` reads the **Chosen architecture** field and **quotes it back** to the user for confirmation. That field is the pivot every architecture-derived spec section (Architecture, Components, Data Flow, Acceptance Criteria) depends on. Silent mis-extraction from a narrative committee verdict is the one failure hardening structurally cannot catch (it verifies the spec against itself, not against design intent) — the quote-back is the only guard.

## Why extraction, not a typed bundle

Producers emit no new artifact. A typed FAC-bundle (committee scribe writes a structured bundle) was rejected as primary — it adds a committee output mode and re-introduces artifact bifurcation — and is retained only as a documented fallback if extraction-with-quote-back proves unreliable (D9).
