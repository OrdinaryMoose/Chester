# Actors — Schema

## Role Inventory

**Designer.** Authority-without-mechanism. Holds all assertion, ratification, revision, withdrawal authority. Signals phase transitions. Never calls Clerk ops directly — Clerk fires auto on procedure triggers. Reads Clerk surfaces (lint reports, gate results, Coverage Map); never computes them.

**Pole (Conservator, Innovator, Pragmatist, Purist).** All four deploy against all anchored Concerns each round. No Concern-to-pole specialization. Each brings its lens; cross-pole tension load-bearing. Poles propose Propositions, revise own Propositions during DELIBERATING. No ratify, no withdraw, no designer-authority procedure.

**Clerk.** Deterministic script. No LLM layer. All ops mechanically specifiable from locked procedures. Lints, captures cascade scope, enforces FK integrity, recomputes Coverage Map, evaluates session-close gate, runs structural negation match for axiom-collision. No deliberative surface, no synthesis, no narrative. Pure mechanical gate.

**Team-Lead.** Two scopes. Dispatch Round — non-artifact coordination signal at DELIBERATING round open; names open Concerns; no Clerk gate; no status mutation. Session-close artifact packaging — after Close Session fires and Clerk certifies, reads Clerk-certified state, produces three deliverable docs (Constraint Envelope, Resolution Criterion, Coverage Map) consumer-ready for design-specify. Mechanical extraction only — no synthesis, no editorial judgment, no procedure calls. Never calls locked procedure.

**Researcher.** Add Evidence only (locked procedure call). May query Evidence registry read-only (EV-NNN existence, source, summary) to locate grounding for pole requests. NO Clerk working-record access (cascade-scope index, submission index, status fields Clerk-internal). Consultable any phase except CLOSED. Not a round attendee.

---

## Procedure-Actor Map

**Add Concern:** DESIGNER only.

**Add Evidence:** DESIGNER or RESEARCHER.

**Add Axiom:** DESIGNER only. `provenance = DESIGNER` structurally enforced; no other role may call.

**Initiate Deliberation:** DESIGNER only. No delegation.

**Propose Proposition:** POLE only (any of four). One PR-NNN per `(round_number, pole_id, concern_id)` tuple; Clerk enforces at submission gate via working-record submission index.

**Submit Round:** DESIGNER only. No delegation. No team-lead intermediary.

**Lint Batch:** CLERK only. Triggered auto by Submit Round or Re-Ratify Row. No caller access.

**Ratify Row:** DESIGNER only. Per-row ACCEPT or REJECT.

**Re-Ratify Row:** DESIGNER only. After Clerk re-lint confirms `structural_valid = TRUE`.

**Revise Row:** DESIGNER (AXIOM rows, any phase except CLOSED); POLE (own PROPOSITION rows, DELIBERATING only — ownership enforced by Clerk matching `provenance + submission identity`).

**Withdraw Entry:** DESIGNER only.

**Close Session:** DESIGNER signal; CLERK gate computation. Two-actor procedure: designer triggers, Clerk certifies.

**Dispatch Round** (not a locked procedure): TEAM-LEAD only. Non-artifact coordination signal at round open.

---

## Designer Surface Per Phase

**OPEN:** Add Concern, Add Evidence.

**ANCHORED:** Add Concern, Add Evidence, Add Axiom, Initiate Deliberation.

**DELIBERATING:** Add Concern (late), Add Evidence, Add Axiom (late), Revise Row (AXIOM rows only), Withdraw Entry, Submit Round.

**RATIFYING:** Ratify Row, Re-Ratify Row, Revise Row (AXIOM rows only), Withdraw Entry, Close Session.

**CLOSED:** no procedures available. Read-only.

Designer reads Clerk-produced surfaces every phase; never computes.

---

## Convening-Message Discipline

**AX-008 (Class-1 designer override — INVERTED from prior placement).** All sprint files (`SKILL.md`, `rules.md`, `schema/*.md`, `design-brief-template.md`) use caveman ultra style. Frontmatter exempt and uncounted toward 200-word cap. Inter-agent deliberation prompts inside session also caveman ultra. No mode switch between agent-facing and designer-facing surfaces. One register, uniform across all surfaces.
