# sprint-01-proof-backend-pass-2 — Design Brief

## Goal

Close four of the five deferment items inherited from sprint-01-proof-backend (D1, D2, D3, D4) by canonicalizing the tightenings made during sprint-01 into the master cascade's architectural decision record sequence, amending the engine-tier specification to match the tightened contracts, adding one small canonical-location code addition with a new error code, removing the now-redundant defense-in-depth guard, and standing up a new engine-tier open-questions document to make the deferred indexing-architecture question (D5) visible from the master cascade surface. The fifth deferment item (D5) is explicitly out of scope and is deferred to a future pass-3 sub-sprint that will run a fresh design-large-task pass on Evaluator indexing architecture.

The goal is not to ship new behavior — sprint-01's surgical fixes already corrected the underlying defects in code. The goal is to leave behind a self-explanatory archeological trail dense enough that a future reader, six months from now, can open the codebase cold and reconstruct why the engine has the shape it does without needing to discover the deferment doc by accident.

## Prior Art

**Sprint-01 produced the engine layer per the master cascade's `04-engine-spec.md`.** During execute-write, five quality-review-surfaced defects were caught and given surgical code fixes that deviated from the plan-prescribed source. Each fix was recorded in `sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md` with three sections: description, resolution applied to code, and outstanding work deferred to a future sub-sprint.

**The deferment doc lists five items (D1 through D5):**
- D1: tighten "constant" definition to exclude non-finite numbers — code fix applied in `FactStore.isConstant`; outstanding work is text updates to spec, plan, and engine-spec.
- D2: enforce safety condition on rule heads — code fix applied as defense-in-depth `UNBOUND_HEAD_VARIABLE` guard inside `Evaluator.fireRule`; outstanding work is the canonical check at `RuleStore.defineRule` plus text updates.
- D3: negation must existentially quantify unbound atom variables — code fix applied in `Evaluator.matchBodyAtom` negation branch; outstanding work is text updates.
- D4: `loadFrom` atomicity gap — code fix applied via snapshot/restore wrap in `loadEngineFrom`; outstanding work is text updates.
- D5: Evaluator IDB indexing architecture — escalated mid-sprint from a coding-detail optimization to a design-level deferment; no code fix applied; outstanding work is a fresh architectural pass. Pass-3.

**The deferment doc carries two side observations not formalized as D-items:**
- Same-generation test laxity (in D3's tail): the canonical Datalog `same_gen` test passes with looser assertions because the engine lacks an inequality primitive. Deferment doc recommendation: leave as-is.
- State-serializer private-field reach (in D4's tail): originally concerned that the serializer's direct reach into `engine._facts` and `engine._rules` would misbehave under a transaction-buffered fact view. Confirmed closed by post-merge code check — the serializer was refactored to use the canonical `_snapshot()` helpers (visible in `Serializer.js` header comment), and the transaction model that landed is snapshot-rollback, not buffered.

**Master cascade state.** `design-documents/` contains the engine-tier specification (`04-engine-spec.md`), seven other tier and supporting documents, and an ADR subdirectory with fourteen records (ADR-0001 through ADR-0014). Each ADR captures context, information used, alternatives considered, decision, rationale, and confidence. Pass-2 extends this sequence.

**Sub-sprint-01's specification and plan.** Live in `sprint-01-proof-backend/spec/sprint-01-proof-backend-spec-00.md` and `sprint-01-proof-backend/plan/sprint-01-proof-backend-plan-00.md`. They describe the engine contract as sprint-01 left it — with the looser pre-tightening phrasing for the four D-items.

**Sub-sprint-01's audit and summary.** Live in `sprint-01-proof-backend/summary/`. The reasoning audit (`sprint-01-proof-backend-audit-00.md`) records the decision history but does not specifically verify that the side-observation concerns are closed. The architectural-compliance audit (Task 16) produced test coverage in `failures.test.js` covering nine error codes — including `UNBOUND_HEAD_VARIABLE` but not `UNSAFE_RULE`.

## Scope

**In scope:**

- Four new architectural decision records in `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/ADR/`, numbered ADR-0015 through ADR-0018, one per tightening:
  - ADR-0015 — D1 — finite-constant constraint at the EDB write path
  - ADR-0016 — D2 — canonical rule-safety check at RuleStore.defineRule, with new UNSAFE_RULE error code, and removal of the defense-in-depth UNBOUND_HEAD_VARIABLE guard at Evaluator.fireRule
  - ADR-0017 — D3 — existential-quantification semantics for negated body atoms with unbound variables
  - ADR-0018 — D4 — atomic loadFrom via snapshot/restore wrap
- Edit-in-place amendments to `design-documents/04-engine-spec.md` for each of the four tightenings. Each amendment cross-references its ADR by number. The engine-spec stays a contract document; the why-narrative lives in the ADRs.
- A new engine-tier open-questions document at `design-documents/engine-open-questions.md`, created with one entry: the IDB-indexing gap (D5), pointing to pass-3 as the closure channel. The entry includes problem shape, why-it-matters-now, what's known about the fix, closure channel, and date opened.
- Pass-2's own canonical specification at `sprint-01-proof-backend-pass-2/spec/sprint-01-proof-backend-pass-2-spec-00.md` — a full successor to sprint-01's spec, carrying forward all still-applicable sprint-01 spec content with the four tightenings applied (finite constants in the type definition; UNSAFE_RULE in the error catalog; existential-quantification phrasing for negation; atomicity guarantee on AC-7.3).
- Pass-2's own plan at `sprint-01-proof-backend-pass-2/plan/sprint-01-proof-backend-pass-2-plan-00.md` — lists the tasks needed to execute pass-2.
- Code change in `skills/design-large-task/engine/RuleStore.js`: add canonical rule-safety check at `defineRule()`. Reject rules whose head variables are not a subset of variables bound by non-negated body atoms. Throw `{ code: 'UNSAFE_RULE', ruleId, unboundVars }`.
- Code change in `skills/design-large-task/engine/Evaluator.js`: remove the defense-in-depth `UNBOUND_HEAD_VARIABLE` guard from `fireRule()` (it becomes unreachable once the canonical check is in place).
- Code change in `skills/design-large-task/engine/__tests__/evaluation.test.js`: delete the existing test asserting the evaluator guard fires on an unsafe rule.
- Code change in `skills/design-large-task/engine/__tests__/operations.test.js`: add a new test asserting `RuleStore.defineRule` throws `UNSAFE_RULE` on an unsafe rule.
- Code change in `skills/design-large-task/engine/__tests__/failures.test.js`: remove `UNBOUND_HEAD_VARIABLE` from the error-code catalog assertions (the code is no longer thrown anywhere); add `UNSAFE_RULE` to the catalog.
- One-line breadcrumb comments at each of the four tightening sites, each referencing the corresponding ADR by number plus a short failure-mode phrase. Sites:
  - `FactStore.js` — at `isConstant` finite-number check — references ADR-0015
  - `RuleStore.js` — at `defineRule` safety check — references ADR-0016
  - `Evaluator.js` — at `matchBodyAtom` negation branch — references ADR-0017
  - `Serializer.js` — at `loadEngineFrom` snapshot/restore wrap — references ADR-0018

**Out of scope:**

- D5 (IDB-indexing architectural fix) — escalated to pass-3 per the deferment doc's recommendation that the fix requires a fresh design-large-task pass with adversarial review. Pass-2's only contact with D5 is the open-questions document entry.
- Adding inequality (`X ≠ Y`) support to the engine — would address the same-generation test laxity side observation but is a separate expressive-power change with downstream consequences for the proof and presentation layers. Deferment doc recommends leaving as-is.
- Any audit or verification of the state-serializer's behavior under transaction-buffered fact views — the buffered model that motivated the concern does not exist (sprint-01 implemented snapshot-rollback). Confirmed closed by post-merge code check.
- Any in-place edits to sprint-01's specification, plan, deferment document, summary, audit, or threat report — sprint-01 is treated as a frozen historical record. Supersession happens at the sub-sprint folder level, not at the file-revision level inside sprint-01's folder.
- The residual "serialize-during-transaction visibility contract" question (whether `serialize()` during an open transaction should return the read-own-writes view or the committed-as-of-begin() view) — not raised in the deferment doc, not promoted to an open-questions entry. May be addressed by a future sprint if it surfaces as a real concern.

## Key Decisions

1. **Sub-sprint as the unit of supersession.** Pass-2 produces fresh `-00` artifacts inside its own sub-sprint folder rather than `-01` revisions inside sprint-01's folder. The chain of supersession is the sub-sprint sequence itself. Alternative considered: bump sprint-01's spec to `-01` and sprint-01's plan to `-01` inside sprint-01's folder. Rejected because it conflicts with the principle that a merged sprint is an immutable record, and because future-readers should be able to navigate by sub-sprint folder without learning intra-folder revision conventions.

2. **Pass-2's specification and plan are full canonical successors.** They carry forward all still-applicable sprint-01 spec content with tightenings applied, plus the new tightening-related plan tasks. Future-readers open pass-2's folder to see the current canonical spec and plan; sprint-01's folder is the prior state. Alternative considered: tightening-only documents that explicitly delegate to sprint-01 for content outside the tightenings. Rejected because it splits canonicity across two folders and requires future-readers to consult both to see the full contract.

3. **Per-tightening architectural decision records (four ADRs, not one batched record).** Each tightening gets its own dated, focused ADR. Alternative considered: one batched ADR titled "sprint-01 canonicalization pass" covering all four items. Rejected because the four items don't share an architectural thread; they share only "sprint-01 missed them." Independent records preserve independence and make each tightening individually citable from code breadcrumbs and engine-spec amendments.

4. **Engine-tier specification edited in place; the ADR sequence carries the dated history.** Master-cascade contract documents are living documents. Alternative considered: produce a successor revision of `04-engine-spec.md` numbered alongside the existing one. Rejected because the master cascade is the contract surface that every sub-sprint reads against; carrying multiple visible revisions of a contract document invites "which revision is canonical right now" confusion. ADRs are explicitly dated and signed, so the trail is preserved without putting the burden on the cascade itself.

5. **D2 canonical check at `RuleStore.defineRule` with a new `UNSAFE_RULE` error code, and removal of the defense-in-depth guard at `Evaluator.fireRule`.** Alternative considered: keep both layers (registry check plus evaluator guard) as defense-in-depth. Rejected because the rule-registry is the only entry point into the evaluator's rule set; the evaluator and the rule-registry live in the same engine with no bypass path. Defense-in-depth here adds reader confusion ("why is this guard here? does the registry not catch this?") without operational benefit. If a future change introduces a bypass, that change is responsible for adding back the guard.

6. **New engine-tier-scoped open-questions document; one entry at creation (D5).** Alternative considered: stretching the ADR format to cover open questions with a "status: open" field. Rejected because the existing fourteen ADRs all record decisions-made; an open-question entry stretches the genre. Alternative also considered: a master-cascade-wide open-questions document covering all three tiers. Rejected because the proof and presentation tiers haven't produced their own questions yet, and bundling early invites a tangled catch-all. Engine-tier scope matches the rhythm of the cascade (engine-tier spec, engine-tier ADRs, engine-tier open-questions).

7. **Breadcrumb code comments: one line per site, ADR reference plus short failure-mode summary.** Alternative considered: ADR-reference-only (lightest, least drift-prone). Rejected because readers don't always click through, and a four-to-eight-word failure-mode phrase gives immediate context without leaving the file. Alternative also considered: multi-line rationale at each site. Rejected because rationale inline invites drift between the comment and the ADR over time.

8. **Test re-homing: delete the old evaluator-guard test, add a new operations-suite test for the rule-registry rejection.** Alternative considered: repurpose-and-move (change the existing test's assertion target and error code, relocate it from the evaluator suite to the operations suite). Rejected because the version-control history argument is small (six-month-future-reader reads what's there, not what was there), and delete-plus-add keeps each test's purpose self-contained.

9. **Both deferment-doc side observations stay out of scope.** Same-generation laxity is recommended-as-is by the deferment doc and addressing it requires a separate expressive-power change. State-serializer private-field reach is confirmed closed by post-merge code check (canonical `_snapshot()` helpers in use; transaction model is snapshot-rollback not buffered). The residual "serialize-during-transaction visibility" question is deliberately not promoted.

10. **Sprint-01's deferment document stays frozen.** Closure of D1-D4 is expressed through the four new ADRs (each containing the failure mode and remedy) and the open-questions document (for D5). Alternative considered: produce a `sprint-01-proof-backend-deferred-01.md` successor that marks four items closed and retains D5 open. Rejected because the deferment document's role was to record what sprint-01 couldn't finish at its close moment, not to track ongoing resolution across sub-sprints. The ADRs and the open-questions document are the long-lived archeological artifacts.

## Constraints

- Master cascade ADR numbering continues from the existing sequence — next available is ADR-0015. The four new records must use ADR-0015 through ADR-0018 in the order D1, D2, D3, D4 (matching the deferment doc's chronological discovery order).
- Engine-tier spec amendments must not redefine semantics that sprint-01's already-merged code already implements. They record tightened phrasing for behavior that is already correct in code. The code is the source of truth; the spec is being made consistent with it.
- The canonical rule-safety check at `RuleStore.defineRule` must reject only rules that violate the standard Datalog safety condition: head variables ⊆ variables bound by non-negated body atoms. Variables appearing only in negated body atoms do not count as bound (the deferment doc names this explicitly).
- The `UNSAFE_RULE` error throw must carry `{ code, ruleId, unboundVars }` — a structured failure that lets downstream tooling distinguish unsafe-rule rejection from generic malformed-rule rejection.
- Breadcrumb code comments must reference the ADR by number and include a short failure-mode phrase (four to eight words). They must not duplicate ADR content.
- Pass-2's specification and plan must not be smaller than sprint-01's — they are full successors, not partial overlays. Where sprint-01's content is unaffected by the tightenings, pass-2's spec carries it forward verbatim or with minor edits for cross-reference consistency.
- All 86 currently-passing engine tests must continue to pass after pass-2's code changes. The current 1 skipped test (AC-11.2, marked for D5) stays skipped.
- The `UNBOUND_HEAD_VARIABLE` error code disappears from the engine entirely after pass-2 (no source throws it, no test asserts it). The failure-mode catalog in `failures.test.js` updates to reflect this — same total number of error codes, with `UNSAFE_RULE` replacing `UNBOUND_HEAD_VARIABLE`.
- Sprint-01's `sprint-01-proof-backend/` folder must not be touched. No edits to any file inside it.
- The engine-spec amendments and the ADRs are produced together — neither lands without the other. An ADR without its spec amendment leaves the contract surface inconsistent; a spec amendment without its ADR leaves the why-narrative homeless.

## Acceptance Criteria

- `design-documents/ADR/0015-finite-constant-constraint.md` exists with sections matching the existing ADR template (context, information used, alternatives considered, decision, rationale, consequences, confidence).
- `design-documents/ADR/0016-canonical-rule-safety-check.md` exists with the same structure. Its consequences section explicitly names the removal of the defense-in-depth `UNBOUND_HEAD_VARIABLE` guard at `Evaluator.fireRule` as part of the decision.
- `design-documents/ADR/0017-existential-quantification-negation-semantics.md` exists with the same structure.
- `design-documents/ADR/0018-atomic-loadFrom.md` exists with the same structure.
- `design-documents/04-engine-spec.md` contains four amendments, each cross-referencing its ADR. The constants definition in the type section excludes non-finite numbers; the error catalog includes `UNSAFE_RULE`; the negation semantics section names existential quantification for unbound variables in negated atoms; the AC-7.3 atomicity contract is stated explicitly.
- `design-documents/engine-open-questions.md` exists with one entry titled with the IDB-indexing gap, naming pass-3 as the closure channel, and including problem shape, why-it-matters-now, what's known about the fix, and date opened.
- `sprint-01-proof-backend-pass-2/spec/sprint-01-proof-backend-pass-2-spec-00.md` exists as a full canonical successor to sprint-01's spec, with the four tightenings applied.
- `sprint-01-proof-backend-pass-2/plan/sprint-01-proof-backend-pass-2-plan-00.md` exists with tasks for executing pass-2.
- `RuleStore.defineRule` rejects unsafe rules with `{ code: 'UNSAFE_RULE', ruleId, unboundVars }`.
- `operations.test.js` contains a test asserting `RuleStore.defineRule` throws `UNSAFE_RULE` on a rule whose head variable does not appear in any non-negated body atom.
- `Evaluator.fireRule` no longer contains the `UNBOUND_HEAD_VARIABLE` guard.
- `evaluation.test.js` no longer contains the test that asserts the evaluator guard fires.
- `failures.test.js` lists `UNSAFE_RULE` in its error-code catalog and does not list `UNBOUND_HEAD_VARIABLE`.
- Each of the four tightening sites in code carries a one-line breadcrumb comment referencing its ADR by number plus a short failure-mode phrase.
- All previously-passing engine tests continue to pass (86 of 87 — AC-11.2 stays skipped).
- Sprint-01's folder (`sprint-01-proof-backend/`) is untouched. `git diff` shows no changes to any file inside it.
- The sprint-01 deferment document at `sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md` is unchanged.

<!-- created-at: 2026-05-12T09:43:33Z -->
<!-- produced-by design-small-task@v0002 -->
