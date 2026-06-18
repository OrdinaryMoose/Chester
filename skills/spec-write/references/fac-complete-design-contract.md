# FAC-Complete Design — Input Contract

FAC stands for feasible, acceptable, and complete. Framework for evaluating designs, specifications, and plans: to be **suitable**, a design must be feasible, acceptable, and complete.

The single input type `spec-write` consumes. A "FAC-complete design" is a design whose architecture is already settled with suitability evidence — shown feasible, acceptable, and complete. It has **two interchangeable producers** — a `design-committee` verdict and a `spec-architect` output — and `spec-write` reads it through this one contract regardless of producer.

The two producers differ in how `spec-write` reads the eight fields. The **committee** path reads them from the **labeled sub-fields of the complete-design document** (a structured read, not a narrative mine). The **spec-architect** path extracts them from its output. Either way, the eight fields below are the contract.

## The eight fields and their spec-template destinations

| Field | Spec destination | Committee complete-design source | spec-architect source |
|-------|------------------|----------------------------------|-----------------------|
| **Goal** | spec Goal | Summary / **Goal** | brief goal |
| **Chosen architecture** | spec Architecture field *(the quote-back field)* | Verdict / **Chosen architecture** | user-selected option |
| **Rejected alternatives + declared sacrifices** | architectural rationale + Constraints | Rationale / **Rejected alternatives + sacrifices** | architect alternatives |
| **Prior-art findings** | Components / reuse notes + adversarial-pass context | Rationale / **Prior-art findings** | prior-art explorer output |
| **Ground-truth-verified facts** | Components + Data Flow (consumed without re-verification) | Rationale / **Ground-truth-verified facts** | re-verified later in spec-harden |
| **Constraints / guardrails** | spec Constraints | Rationale / **Constraints / guardrails** | brief + F-A-C constraints |
| **Acceptance-criteria seeds** | AC-N.M expansion | Rationale / **Acceptance-criteria seeds** | brief acceptance criteria |
| **Deferred / non-goals** | spec Non-Goals | Deferred / Open / **Deferred / non-goals** | brief out-of-scope |

## Mandatory architecture quote-back

Before authoring **any** spec section, `spec-write` reads the **Chosen architecture** field and **quotes it back** to the user for confirmation. That field is the pivot every architecture-derived spec section (Architecture, Components, Data Flow, Acceptance Criteria) depends on. On the committee path the field is a labeled sub-field, so the read is a direct structured read of a stated value. The quote-back is the confirmation checkpoint: hardening verifies the spec against itself, not against design intent, so the designer's confirmation of the carried-forward architecture still matters.

## Why a structured committee document (D9 reversed)

**D9 is reversed.** D9 originally rejected a typed committee bundle as primary, to avoid artifact bifurcation, leaving the committee on a verdict-only packet that `spec-write` mined from narrative prose. That left one uncatchable failure: silent mis-extraction from the narrative, guarded only by a single human quote-back. The committee is now elevated to producing a **complete-design document** whose eight design fields are present as labeled content (committee-native Option-2 shape at `skills/design-committee/references/artifact-template.md`). This is not a second output mode — it is the committee's one output, so there is no bifurcation; and `spec-write` reads the fields by label instead of mining them, closing the mis-extraction gap at the source. The `spec-architect` path is unchanged: it still supplies the same eight fields through this one contract.
