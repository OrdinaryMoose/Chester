# Clerk + System Stress Test — Round 00

- Sprint: `sprint-01-calculator-test-app`
- Date: 2026-05-23
- Subject: locked schema in `skills/design-architect-committee/schema/*.md` + procedures + actor authority
- Method: 42 simulated CRUD + validation scenarios. Each driven against schema-as-spec. Findings flagged where schema silent, rules collide, behavior underspecified, or audit gap surfaces.
- Note: simulation runs against the **spec**. Real Clerk script may diverge; report identifies spec gaps.

## Scenario Index By Category

- CRUD happy paths (S-01..S-05)
- CRUD validation failures (S-06..S-13)
- Phase violations (S-14..S-18)
- Authority violations (S-19..S-22)
- Axiom-collision (S-23..S-26)
- Cascade behavior (S-27..S-29)
- Coverage Map + session-close gate (S-30..S-33)
- FK integrity (S-34..S-36)
- Edge cases + misc (S-37..S-42)

---

## CRUD Happy Paths

### S-01 — Add Concern (valid) in OPEN
- Setup: phase=OPEN, no Concerns.
- Trigger: DESIGNER Add Concern "CE-001 — precision".
- Expected: row appended to Concerns Registry; Coverage Map gains GAP row immediate side effect; phase unchanged.
- Outcome: PASS.
- Finding: none.

### S-02 — Add Evidence (valid) in OPEN
- Setup: phase=OPEN.
- Trigger: DESIGNER Add Evidence "EV-001 — IEEE-754 standard ref".
- Expected: row appended to Evidence Registry; phase unchanged.
- Outcome: PASS.
- Finding: none.

### S-03 — Add Axiom (valid) on existing Concern
- Setup: CE-001 exists; phase=OPEN.
- Trigger: DESIGNER Add Axiom AX-001 with valid IF/THEN body on CE-001.
- Expected: Constraint Envelope appended with `provenance=DESIGNER status=RATIFIED`; phase OPEN→ANCHORED on first axiom.
- Outcome: PASS.
- Finding: none.

### S-04 — Propose Proposition on anchored Concern
- Setup: CE-001 anchored with AX-001; phase=DELIBERATING.
- Trigger: POLE-Pragmatist Propose Proposition PR-001 on CE-001 grounding EV-001.
- Expected: row appended `provenance=AGENT status=REVISED-PENDING`; no RC row yet; lint deferred.
- Outcome: PASS.
- Finding: none.

### S-05 — Ratify Row ACCEPT on structural_valid PR
- Setup: PR-001 `structural_valid=TRUE`; phase=RATIFYING.
- Trigger: DESIGNER Ratify Row PR-001 ACCEPT.
- Expected: Constraint Envelope row → RATIFIED; Resolution Criterion appends matching row; Coverage Map status for CE-001 → COVERED.
- Outcome: PASS.
- Finding: none.

---

## CRUD Validation Failures

### S-06 — Add Concern with empty scope statement
- Setup: phase=OPEN.
- Trigger: DESIGNER Add Concern "CE-002 — " (no scope text).
- Expected per schema: `CE-NNN` prefix valid + uniqueness check. **No emptiness check on scope statement.**
- Outcome: ACCEPT (Clerk does not enforce scope-text presence).
- **Finding F-01: schema silent on Concern body content.** Empty / single-word scope statements pass. Designer can register meaningless Concerns. Coverage Map carries them, Concerns drift into Constraint Envelope. Candidate gate: require ≥N tokens or non-empty body field.

### S-07 — Add Concern with duplicate ID
- Setup: CE-001 exists.
- Trigger: DESIGNER Add Concern CE-001 again.
- Expected: uniqueness gate rejects.
- Outcome: REJECT.
- Finding: none.

### S-08 — Add Evidence with malformed prefix
- Setup: phase=OPEN.
- Trigger: DESIGNER Add Evidence "E-001" (missing V).
- Expected: prefix-valid gate rejects.
- Outcome: REJECT.
- Finding: none.

### S-09 — Add Axiom on non-existent Concern
- Setup: CE-001 exists; CE-999 does not.
- Trigger: DESIGNER Add Axiom AX-002 on CE-999.
- Expected per schema: gate "`CE-NNN` must exist in Concerns registry" rejects.
- Outcome: REJECT.
- Finding: none.

### S-10 — Add Axiom with body lacking IF/THEN form
- Setup: CE-001 exists.
- Trigger: DESIGNER Add Axiom AX-002 with body "Use Decimal everywhere."
- Expected: body-form gate rejects (IF/THEN architectural-altitude required).
- Outcome: REJECT.
- **Finding F-02: "architectural altitude" undefined.** Spec says altitude is Clerk-enforced for axioms (procedures.md §Add Axiom) but defines no detection mechanism. A deterministic script cannot reliably classify "implementation vocab" without lexicon. Surfaces during PROPOSITION review too (no altitude check spec'd for PROPOSITIONs at all). Candidate followup: define altitude as either (a) absence of identifier-shaped tokens (CamelCase, snake_case, monospace fences), or (b) drop altitude claim from Clerk responsibility.

### S-11 — Propose Proposition on unanchored Concern
- Setup: CE-002 exists with zero axioms; phase=DELIBERATING (via CE-001 anchored).
- Trigger: POLE-Innovator Propose Proposition PR-002 on CE-002.
- Expected: gate "`CE-NNN` must exist and be anchored" rejects.
- Outcome: REJECT.
- Finding: none.

### S-12 — Propose Proposition with body not IF/THEN
- Setup: CE-001 anchored.
- Trigger: POLE Propose PR-003 body "Decimal is best."
- Expected: body-form gate rejects.
- Outcome: REJECT.
- Finding: same scope as F-02; no altitude check, but pure form check fires.

### S-13 — Propose Proposition with collapse_test not IF NOT/THEN
- Setup: CE-001 anchored.
- Trigger: POLE Propose PR-004 valid body + collapse_test "When precision metadata missing, breach undetectable."
- Expected: `collapse_test` IF NOT/THEN gate rejects.
- Outcome: REJECT.
- **Finding F-03: collapse_test gate is **pure structural** — checks "IF NOT" prefix + comma + "THEN" presence.** A pole can satisfy syntax with vacuous content: "IF NOT true, THEN false." Schema has no semantic alignment check between body and collapse_test (is collapse_test the contrapositive of body?). Candidate gate: require body and collapse_test share noun-phrase overlap, or designer-review of contrapositive faithfulness.

---

## Phase Violations

### S-14 — Initiate Deliberation in OPEN
- Setup: phase=OPEN, zero axioms.
- Trigger: DESIGNER Initiate Deliberation.
- Expected: gate "at least one anchored Concern exists" rejects.
- Outcome: REJECT.
- Finding: none.

### S-15 — Propose Proposition in ANCHORED
- Setup: CE-001 anchored; phase=ANCHORED (not yet DELIBERATING).
- Trigger: POLE Propose PR-005.
- Expected: trigger phase "DELIBERATING only" rejects.
- Outcome: REJECT.
- Finding: none.

### S-16 — Submit Round in ANCHORED
- Setup: phase=ANCHORED.
- Trigger: DESIGNER Submit Round.
- Expected: trigger phase rejects (DELIBERATING-only).
- Outcome: REJECT.
- Finding: none.

### S-17 — Ratify Row in DELIBERATING
- Setup: phase=DELIBERATING.
- Trigger: DESIGNER Ratify PR-001 ACCEPT.
- Expected: trigger phase RATIFYING-only rejects.
- Outcome: REJECT.
- Finding: none.

### S-18 — Add Axiom in CLOSED
- Setup: phase=CLOSED.
- Trigger: DESIGNER Add Axiom AX-099.
- Expected: CLOSED is read-only (actors.md §Designer Surface Per Phase: "no procedures available").
- Outcome: REJECT.
- Finding: none.

---

## Authority Violations

### S-19 — Designer attempts Propose Proposition
- Setup: phase=DELIBERATING; CE-001 anchored.
- Trigger: DESIGNER Propose PR-006 on CE-001.
- Expected: procedure-actor map "POLE only" rejects.
- Outcome: REJECT.
- **Finding F-04: schema enforces actor at procedure-call time, but provides no listed mechanism for distinguishing actor identity in a Clerk script.** The schema names roles (DESIGNER, POLE, RESEARCHER, TEAM-LEAD, CLERK) but skill files do not specify how Clerk verifies the caller. In dispatch convention out-of-scope (per SKILL.md scope limits), so this is likely intentional — but it leaves Clerk authority enforcement abstract. Followup: declare actor-identity carrier (caller-tag field on procedure call?) within Clerk-spec scope, or formally cede authority enforcement to dispatch layer.

### S-20 — Pole attempts Add Axiom
- Setup: phase=DELIBERATING.
- Trigger: POLE-Purist Add Axiom AX-005.
- Expected: gate `provenance = DESIGNER` structurally enforced; reject.
- Outcome: REJECT.
- Finding: same F-04 surface (actor-identity carrier).

### S-21 — Pole attempts Revise AXIOM row
- Setup: phase=DELIBERATING; AX-001 exists with `provenance=DESIGNER`.
- Trigger: POLE-Conservator Revise AX-001 body.
- Expected: ownership check (`provenance + submission identity`) rejects — AXIOM rows DESIGNER-only.
- Outcome: REJECT.
- Finding: none new.

### S-22 — Pole attempts Withdraw Entry
- Setup: phase=DELIBERATING.
- Trigger: POLE Withdraw AX-001.
- Expected: "Withdraw Entry: DESIGNER only" rejects.
- Outcome: REJECT.
- Finding: none new.

---

## Axiom-Collision

### S-23 — Add new Axiom that contradicts existing Axiom on same Concern
- Setup: CE-001 has AX-001 "IF user requests arithmetic on values outside chosen numeric domain, THEN calculator must refuse rather than silently truncate."
- Trigger: DESIGNER Add Axiom AX-002 on CE-001 body "IF user requests arithmetic on values outside chosen numeric domain, THEN calculator must silently truncate."
- Expected per schema: procedures.md §Add Axiom — "No collision-block — axiom always written. Cascade scope captured synchronously for existing PROPOSITION rows on that Concern." Plus "On collision: synchronous flag conflicting RATIFIED PROPOSITION rows same Concern to REVISED-PENDING via cascade."
- Outcome: AXIOM AX-002 written; cascade flags conflicting PROPs.
- **Finding F-05: schema permits axiom-to-axiom contradiction without flag.** Two axioms now both `RATIFIED` on the same Concern, with directly negating bodies. Session-close gate has no rule against this — it counts RATIFIED rows, not consistency among them. Constraint Envelope at close ships internally contradictory ground truth to `design-specify`. Catastrophic for downstream consumer. Candidate gate: axiom-axiom collision detection same as axiom-proposition (structural negation), with one of: (a) reject second axiom write; (b) flag and require designer disposition.

### S-24 — Propose Proposition body directly contradicting axiom (same Concern)
- Setup: CE-001 has AX-001 "...refuse rather than silently truncate."
- Trigger: POLE Propose PR-007 on CE-001 body "IF user requests arithmetic on values outside chosen numeric domain, THEN calculator must silently truncate."
- Expected: procedures.md §Propose Proposition — "Axiom-collision check: synchronous block at gate if body directly contradicts any AX-NNN body same Concern (structural negation match, not semantic)."
- Outcome: REJECT.
- Finding: none for trigger; see S-25 / S-26 for the semantic gap.

### S-25 — Propose Proposition contradicting axiom on DIFFERENT Concern
- Setup: AX-003 on CE-003 "IF an operation cannot produce a defined result, THEN caller receives a typed error..."
- Trigger: POLE Propose PR-008 on CE-001 body "IF an operation cannot produce a defined result, THEN caller receives no error."
- Expected: gate scoped to "same Concern". Different Concern → no block.
- Outcome: ACCEPT.
- **Finding F-06: collision scope is per-Concern.** Cross-Concern contradictions silently accepted. Plausible — Concerns partition the design space — but combined with **F-05** (axiom-axiom same-Concern allowed) plus the lack of cross-Concern coherence check, the schema offers no global consistency guarantee. Mitigation may come downstream at `design-specify`, but architecturally the committee can certify a self-contradicting envelope.

### S-26 — Propose Proposition with semantic contradiction, not structural
- Setup: AX-001 "...refuse rather than silently truncate."
- Trigger: POLE Propose PR-009 on CE-001 body "IF user requests arithmetic on values outside chosen numeric domain, THEN calculator must coerce silently to nearest representable value."
- Expected: structural negation match only. `coerce silently` ≠ literal `silently truncate`. No structural negation token-pair.
- Outcome: ACCEPT.
- **Finding F-07: structural negation is brittle.** Paraphrase, synonym substitution, or restating the negation in different words slips past the check. The schema explicitly disclaims semantic check ("structural negation match, not semantic"). Combined with F-03 (collapse_test syntactic-only), Clerk verifies form rigorously but content shallowly. Surfaces design tension: Clerk is deliberate-by-design as pure mechanical gate, so semantic check must live with designer at RATIFYING. But then RATIFYING is the only firewall against logical incoherence, and a tired designer can wave through contradictory rows.

---

## Cascade Behavior

### S-27 — Designer revises AXIOM during DELIBERATING
- Setup: phase=DELIBERATING; AX-001 has 4 cited Propositions PR-001..PR-004; pending PR-005 not yet linted.
- Trigger: DESIGNER Revise AX-001 body.
- Expected per schema: source row → REVISED-PENDING immediate; Clerk captures cascade scope synchronously (all PROPOSITION rows on CE-001 per provenance-differentiated rule); deferred mutation fires next Lint Batch.
- Outcome: AX-001 → REVISED-PENDING; scope captured; PR-001..PR-004 await flip at next Lint Batch.
- **Finding F-08: "DESIGNER axiom revision → all PROPOSITION rows for that Concern" is broader than necessary.** Propositions on a Concern that don't cite the axiom in their grounding still get flagged. Compare to AGENT proposition revision (scope-limited to rows whose `grounding` cites the revised entry_id). Inconsistent precision. Either (a) DESIGNER axiom revision should also be `grounding`-scoped, or (b) the broader scope is intentional because axioms are baseline ground-truth that affects all sibling Propositions. If (b), explanation should be inlined in schema. Candidate followup.

### S-28 — Designer withdraws AXIOM with cited Propositions
- Setup: AX-001 cited by PR-001 grounding; PR-001 currently RATIFIED.
- Trigger: DESIGNER Withdraw AX-001.
- Expected: immediate full cascade (scope capture + status mutation); all PRs citing AX-001 → REVISED-PENDING; Coverage Map recomputed; Withdrawal irreversible.
- Outcome: PR-001 immediately REVISED-PENDING; AX-001 removed; CE-001 status → AXIOM-ONLY or GAP depending on remaining axioms.
- **Finding F-09: cascade scope for Withdrawal is `grounding`-scoped, not all-Propositions-on-Concern.** Schema (phases-and-transitions.md §Withdrawal Exception): "All rows whose `grounding` cites withdrawn `entry_id` → REVISED-PENDING." This contradicts S-27 cascade scope (DESIGNER axiom revision → all PROPOSITION rows on Concern). Same actor (DESIGNER) acting on same row class (AXIOM) — revise vs withdraw — produces different cascade scope. Either intentional and explanation missing, or genuine inconsistency. Candidate followup.

### S-29 — Pole revises own PROPOSITION
- Setup: phase=DELIBERATING; PR-001 in REVISED-PENDING; PR-005 grounding cites PR-001.
- Trigger: POLE (PR-001 owner) Revise PR-001 body.
- Expected: PR-001 → REVISED-PENDING (already); cascade scope captured (only rows whose `grounding` cites PR-001); status mutation deferred.
- Outcome: PR-005 flagged for status flip next lint.
- **Finding F-10: transitive cascade depth not bounded in schema.** If PR-005 cites PR-001, and PR-006 cites PR-005, does revising PR-001 transitively flag PR-006? Schema says "then transitive" for AGENT cascade. No depth limit, no cycle detection. With a deeply-grounded propositions DAG, a single revise could flag a large subgraph. Pathological case: 100 PRs cite back into one ancestor; revising ancestor flags all 100. Cost not modeled. Candidate followup.

---

## Coverage Map + Session-Close Gate

### S-30 — Close Session with one GAP Concern
- Setup: CE-001 RATIFIED (1 axiom + 1 PR); CE-002 has zero axioms zero PRs; phase=RATIFYING.
- Trigger: DESIGNER Close Session.
- Expected: gate condition "zero GAP rows" fails; phase RATIFYING → DELIBERATING; Clerk emits gate-failure report.
- Outcome: REJECT close.
- Finding: none new.

### S-31 — Close Session with REVISED-PENDING row
- Setup: 4 Concerns all ratified; one PR-NNN sits in REVISED-PENDING (from prior reject); phase=RATIFYING.
- Trigger: DESIGNER Close Session.
- Expected: gate condition "zero REVISED-PENDING rows" fails.
- Outcome: REJECT close; back to DELIBERATING.
- **Finding F-11: REJECT of a row produces a REVISED-PENDING row, which blocks session close.** Designer must explicitly Withdraw the rejected row to close. No "reject-and-forget" shortcut in schema. This means the natural disposition path (winner-take-one per Concern, reject rest) cannot close session without manual cleanup. Likely intended (forces deliberate audit trail vs implicit drop), but worth surfacing: consider an explicit "reject-and-withdraw" composite procedure, or relax close gate to allow REVISED-PENDING-with-reject-reason rows.

### S-32 — Close Session with all COVERED, zero REVISED-PENDING
- Setup: 4 Concerns all RATIFIED with PR; all PR have matching RC `structural_valid=TRUE`; zero REVISED-PENDING; phase=RATIFYING.
- Trigger: DESIGNER Close Session.
- Expected: all three gate conditions pass + FK integrity pass; phase RATIFYING → CLOSED; deliverables frozen.
- Outcome: CLOSE OK.
- Finding: none.

### S-33 — Close Session with AXIOM-ONLY Concerns only
- Setup: 4 Concerns; each has axiom, zero PROPOSITIONs (no DELIBERATING round held, or all PRs withdrawn); phase=RATIFYING (entered via 0-PR Submit Round per S-41 below).
- Trigger: DESIGNER Close Session.
- Expected: zero GAPs ✓; zero REVISED-PENDING ✓; "Each PROPOSITION row → exactly one RC row" vacuously satisfied (no PROPOSITION rows). Gate passes.
- Outcome: CLOSE OK; deliverables ship with 4 AXIOM-ONLY rows in Coverage Map; Resolution Criterion empty; Constraint Envelope = 4 AXIOM rows.
- **Finding F-12: session can close with zero Propositions.** Designer-decree-only sessions ship via committee without any pole deliberation. Coverage Map flags "for inspection" (per coverage-map.md), but downstream `design-specify` may not act on flags. Mode B convening spec'd to require four-pole machinery; nothing in schema enforces that a Mode B session actually exercised poles. Designer can convene Mode B, skip Initiate Deliberation, axiom-everything, close. Candidate followup: require ≥1 ratified PROPOSITION per session for Mode B, or formalize the AXIOM-ONLY-flag handling at consumer side.

---

## FK Integrity

### S-34 — Propose Proposition citing non-existent Evidence
- Setup: EV registry empty; CE-001 anchored.
- Trigger: POLE Propose PR-001 grounding=[EV-999].
- Expected: gate "All grounding `EV-NNN` exist in Evidence registry" rejects.
- Outcome: REJECT.
- Finding: none.

### S-35 — RC row points to PR that is REVISED-PENDING
- Setup: pathological — direct schema-rule probe. Try to write RC row with PR-001 entry_id while PR-001 status=REVISED-PENDING.
- Expected: FK rule "Resolution Criterion row → must exist in Constraint Envelope with `source=PROPOSITION`, `status=RATIFIED`" rejects. (RC rows only created at Ratify ACCEPT per procedure spec, so this case is mostly unreachable through Designer action — but if a Clerk bug or hand-edit produced it, FK check catches.)
- Outcome: FK violation on next lint; Lint Batch fails; phase stays DELIBERATING/RATIFYING.
- Finding: schema rule itself is sound. Implementation-level question.

### S-36 — Coverage Map carries axiom_id not present in Constraint Envelope
- Setup: Coverage Map for CE-001 has axiom_ids=[AX-001, AX-099]; AX-099 was never written.
- Expected: FK rule "`entry_id` in Coverage Map list → must exist in Constraint Envelope with matching `source`" rejects.
- Outcome: FK violation at Lint Batch; lint fails.
- Finding: sound rule. But: Coverage Map is **Clerk-computed**, not Designer-asserted. A Clerk bug is the only way this state arises. FK rule is then a self-consistency check on Clerk's own writes, which means Clerk is auditing Clerk. Acceptable but worth flagging — no external auditor on Clerk's compute.

---

## Edge Cases + Misc

### S-37 — Add Concern in DELIBERATING (late)
- Setup: phase=DELIBERATING; 4 Concerns already anchored and propositioned.
- Trigger: DESIGNER Add Concern CE-005.
- Expected: trigger phase allows "OPEN, ANCHORED, DELIBERATING" per Add Concern; Coverage Map gains GAP; phase unchanged.
- Outcome: ACCEPT.
- **Finding F-13: late Concern added in DELIBERATING blocks session close until poles deploy on it AND designer ratifies.** Schema permits late Concerns but provides no Round structure to pick them up. Team-Lead Dispatch Round names "open Concerns" at round open — but is the late Concern automatically named in next round? Spec silent. Designer could add a Concern after Submit Round signals advance to RATIFYING, blocking close indefinitely. Candidate followup: either auto-name new Concerns into next round dispatch, or require Concern-freeze before first Submit Round.

### S-38 — Add Axiom in DELIBERATING (late)
- Setup: phase=DELIBERATING; existing PRs cite earlier axioms.
- Trigger: DESIGNER Add Axiom AX-005 on CE-001.
- Expected: phase unchanged; cascade mutation deferred next Lint Batch (except conflicting Propositions flagged immediate).
- Outcome: ACCEPT.
- Finding: see F-08 cascade-scope inconsistency; same issue applies.

### S-39 — Withdraw Entry in CLOSED
- Setup: phase=CLOSED.
- Trigger: DESIGNER Withdraw AX-001.
- Expected: CLOSED is read-only; reject.
- Outcome: REJECT.
- **Finding F-14: spec describes withdrawal trigger as "any phase except CLOSED" (procedures.md §Withdraw Entry), consistent. But the Designer Surface Per Phase (actors.md) lists withdrawal for RATIFYING explicitly — and the post-CLOSED case is implicit-by-exclusion.** Confusing prose: two surfaces describe the same prohibition in different forms. Minor consistency issue. Candidate cleanup.

### S-40 — Re-ratify Row that is not REVISED-PENDING
- Setup: PR-001 currently RATIFIED.
- Trigger: DESIGNER Re-Ratify PR-001.
- Expected: gate "Row must be REVISED-PENDING" rejects.
- Outcome: REJECT.
- Finding: none.

### S-41 — Submit Round with zero new PROPOSITION rows
- Setup: phase=DELIBERATING; no PR rows submitted this round.
- Trigger: DESIGNER Submit Round.
- Expected per schema: gates pre-signal: "none". Submit Round fires Lint Batch unconditionally. Lint runs against empty pending set; recomputes Coverage Map; phase DELIBERATING → RATIFYING.
- Outcome: ACCEPT; phase advances.
- **Finding F-15: empty Round permitted.** Designer can advance phase without poles producing anything. Combined with F-12, designer can bypass deliberation entirely. Reasonable for AXIOM-ONLY sessions; possibly problematic for "Mode B convening" claim. Candidate followup: gate Submit Round on ≥1 PROPOSITION row submitted since last Submit Round, when at least one Concern is currently un-Propositioned and not designer-marked AXIOM-ONLY.

### S-42 — Designer withdraws AXIOM while citing PR is also REVISED-PENDING
- Setup: PR-001 grounding cites AX-001; both rows are REVISED-PENDING (e.g., AX-001 just revised, PR-001 already in pending from prior reject); phase=DELIBERATING.
- Trigger: DESIGNER Withdraw AX-001.
- Expected: immediate full cascade. PR-001 already REVISED-PENDING. Cascade applies status mutation idempotently (no state change). AX-001 removed.
- Outcome: PR-001 stays REVISED-PENDING; AX-001 gone; Coverage Map recomputed.
- **Finding F-16: status mutation cascade idempotent on already-pending rows; no event recorded.** Clerk has no log entry that PR-001's pending state was *also* triggered by AX-001 withdrawal (the original cause was the earlier reject). Audit trail for cascade chain is thin. Candidate followup: append cascade event to row's audit log even when status mutation is no-op, so designer can reconstruct chain.

---

## Findings Summary

- **F-01** Concern scope-statement emptiness not validated.
- **F-02** "Architectural altitude" enforced on axioms per spec, but no deterministic detection mechanism specified; PROPOSITION altitude not checked at all.
- **F-03** `collapse_test` gate is pure-syntactic; no body-to-contrapositive semantic alignment check.
- **F-04** Actor identity carrier into Clerk procedures not specified within skill scope (deferred to dispatch layer per SKILL.md scope limits — but authority enforcement remains abstract until dispatch layer specifies).
- **F-05** Axiom-to-axiom contradiction permitted within same Concern. Both RATIFIED, both ship to consumer. No gate.
- **F-06** Collision scope is per-Concern only; cross-Concern contradictions silently accepted. No global consistency check.
- **F-07** Structural negation match is brittle; paraphrase / synonym substitution / restatement slip past axiom-collision detection.
- **F-08** Designer axiom revision cascade scope is broader (all sibling PRs) than Agent proposition revision (grounding-cited only). Inconsistency or missing rationale.
- **F-09** Designer axiom **withdrawal** cascade scope is `grounding`-cited (narrower) than designer axiom **revision** cascade scope. Same actor, same row class, different scope.
- **F-10** Transitive cascade depth unbounded; no cycle detection; pathological depth cost not modeled.
- **F-11** REJECT row sits in REVISED-PENDING and blocks session close; no reject-and-forget; requires explicit Withdraw for clean close.
- **F-12** Session can close with zero Propositions; Mode B convening doesn't require pole exercise.
- **F-13** Late Concerns in DELIBERATING have no round-dispatch protocol; can block close.
- **F-14** Withdrawal phase-restriction described two different ways across surfaces; minor consistency issue.
- **F-15** Submit Round with zero new PROPOSITIONs advances phase; deliberation can be bypassed.
- **F-16** Cascade event audit log for idempotent status mutations not recorded.

### Severity Bucket (heuristic)

- **Critical (downstream ships contradictory artifact):** F-05, F-06.
- **High (semantic gap allowing logical incoherence):** F-03, F-07.
- **Medium (workflow friction or undefined behavior):** F-02, F-08, F-09, F-10, F-11, F-12, F-13, F-15.
- **Low (cleanup, audit, spec consistency):** F-01, F-04, F-14, F-16.

### Cross-Cutting Pattern

Clerk is rigorously **syntactic**; deliberately offloads **semantic** responsibility to designer at RATIFYING. The schema is internally consistent on that boundary. But the boundary leaks in three places:

- F-05 / F-06: structural checks scoped narrowly enough that catastrophic logical contradictions (axiom vs axiom, cross-Concern semantic conflict) escape the gate without ever surfacing at RATIFYING.
- F-08 / F-09: cascade-scope rules differ across same-class operations without explanation; designer has no mental model for predicting which rows will flip.
- F-13 / F-15: phase advancement triggers are too permissive at low-content cases; the schema permits Mode B sessions that mechanically pass gates while exercising none of the four-pole deliberation surface.

### Recommended Followup Priority

- **First:** F-05 (axiom-axiom collision detection). Cheap fix, high payoff. Same structural negation rule, extend scope.
- **Second:** F-12 + F-15 together. Require ≥1 ratified PROPOSITION per Mode B session, or require Submit Round to carry ≥1 new PR before phase advance.
- **Third:** F-08 + F-09 (cascade scope consistency). Decide rule for DESIGNER axiom revise vs withdraw cascade scope, document rationale.
- **Fourth:** F-11 (reject-vs-withdraw friction). Compose `Reject Row → Withdraw Entry` as single procedure, OR relax close gate.

### Out Of Scope For This Skill (per SKILL.md scope limits)

- Clerk script implementation.
- Dispatch convention (actor-identity carrier — F-04).
- Working-directory layout.
- Handoff document shape.

F-04 falls within the explicitly-out-of-scope list; flagged here for completeness but not actionable inside this skill.
