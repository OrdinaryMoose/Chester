# Reasoning Audit: sprint-01-proof-backend-pass-2 — Sprint-01 Deferred-Item Closure

**Date:** 2026-05-12
**Session:** `00`
**Plan:** `sprint-01-proof-backend-pass-2-plan-00.md`

## Executive Summary

The session closed four of five sprint-01 deferment items (D1-D4) by canonicalizing in-code tightenings into the master cascade's ADR sequence, amending the engine-tier spec in place, adding one small canonical-location code change at `RuleStore.defineRule`, and standing up an engine-tier open-questions document to make the fifth deferred item (D5 indexing) visible without inflating its scope. The most consequential decision was the archeology-first framing of pass-2: instead of treating the work as routine documentation cleanup, the session reframed the success criterion as "what surface will be self-explanatory six months from now," which determined that ADRs (one per tightening, not batched) — paired with engine-spec amendments and one-line code breadcrumbs — would carry the why-narrative. Implementation stayed largely on-plan; the one real deviation surfaced during Task 2 when the new `UNSAFE_RULE` check rejected three pre-existing tests that used cyclic-negation patterns, requiring a surgical positive-binding-atom repair that plan-attack had not foreseen.

## Plan Development

The plan was built sequentially across design-small-task → design-specify → plan-build. The design conversation ran a multi-round inline loop that landed ten decisions; the most load-bearing was the archeology framing that shifted the artifact-type question from "ADR vs inline edits" to "what survives a six-month cold read." design-specify ran competing-architecture comparison and accepted a hybrid layered-AC structure (sprint-01's behavioral ACs carried forward, pass-2 deliverable ACs added as new sections). plan-build produced six tasks; the plan-reviewer surfaced two real conflicts (filename casing, test-count math) that were resolved inline. Plan-hardening combined plan-attack and plan-smell into a Low-Moderate threat report; the user elected to apply A1 + A2 plus the directed C4 mitigation (an `unboundVars` assertion). Execution used subagent mode per the plan's heuristic, with spec + quality reviews between each task.

## Decision Log

### Archeology-first framing for pass-2's success criterion

**Context:** Round-one of the design conversation opened with the question "should the engine-tier amendments be inline edits or a fresh ADR?" The designer reframed the question — the real criterion was not artifact choice but "what surface will be self-explanatory after six months of absence."

**Information used:**
- The master cascade's existing 14 ADRs (each carrying context, alternatives, decision, rationale, consequences)
- The four artifact types in scope: ADRs (designed for why), engine-spec (designed for what/contract), sprint-level deferment docs and summaries (frozen at close, discoverability-dependent), code comments (highest signal at point-of-use, narrowest scope)
- The recognition that a deferment doc lives only in plans-folder snapshots and does not advertise itself to a reader navigating the code

**Alternatives considered:**
- `Treat as routine cleanup` — rejected; would have left the why-narrative homeless once sprint-01 was archived
- `Inline edits to engine-spec carry the rationale` — rejected; bloats the contract document and conflates what with why over time

**Decision:** Pass-2's acceptance criterion is archeological — leave a self-explanatory trail (ADRs for why, engine-spec for what, code breadcrumbs for where) dense enough that a future reader can reconstruct the engine's shape cold.

**Rationale:** Existing ADRs are the artifact type explicitly designed for the why-narrative; relying on the deferment doc or sprint summaries assumes the future reader knows which folder to open. The archeology framing made every downstream decision (per-tightening ADRs, engine-spec edited in place, one-line breadcrumbs, open-questions document) fall out of a single coherent acceptance criterion.

**Confidence:** High — the reframing is explicit in the transcript and is named verbatim in the design brief's Goal section.

---

### Sub-sprint as the unit of supersession

**Context:** Pass-2 needed to express tightened phrasing that contradicts sprint-01's already-merged spec and plan. The mechanism for "this supersedes that" was unspecified.

**Information used:**
- Sprint-01's artifacts live in both `working/` (still mutable) and `plans/` (archived snapshot from the merge)
- The Chester convention that merged sprints are immutable historical records
- The principle that future-readers should navigate by sub-sprint folder, not intra-folder revision conventions

**Alternatives considered:**
- `Bump sprint-01's spec to -01 and plan to -01 inside sprint-01's folder` — rejected; conflicts with the immutable-record principle and forces readers to learn intra-folder revision conventions
- `Produce a successor revision of 04-engine-spec.md numbered alongside the existing one in the master cascade` — rejected; multiple visible revisions of a contract document invite "which is canonical right now" confusion

**Decision:** Pass-2 produces fresh `-00` artifacts inside its own sub-sprint folder; sprint-01's folder is frozen. Supersession is expressed at the sub-sprint folder level, not at the file-revision level inside a folder.

**Rationale:** Preserves sprint-01 as an immutable record, keeps the supersession chain visible at the folder-navigation altitude, and aligns with the master plan's existing sub-sprint folder pattern. The ADR sequence carries the dated history that revision numbering would otherwise have to carry.

**Confidence:** High — explicit in design brief Key Decision 1 and Constraints.

---

### Pass-2's spec as full canonical successor, not minimal patch

**Context:** Once supersession was sub-sprint-scoped, pass-2's spec could either be a minimal tightening-only document (delegating to sprint-01 for unchanged content) or a full canonical successor (carrying forward all sprint-01 spec content with surgical amendments).

**Information used:**
- The reader-experience criterion derived from the archeology framing: open pass-2's folder to see the current canonical contract
- Sprint-01's spec structure (13 behavioral AC sections) and the four tightenings' surgical reach into specific ACs

**Alternatives considered:**
- `Tightening-only documents that delegate to sprint-01` — rejected; splits canonicity across two folders and forces future-readers to consult both

**Decision:** Pass-2's spec is a full canonical successor — sprint-01's behavioral ACs (sections 1-13) carry forward with surgical amendments; pass-2 adds new sections 14-18 grouping deliverables by deferment item.

**Rationale:** Single canonical surface per sub-sprint; readers do not have to compose contract content across two documents. The cost (a larger document) is one-time; the benefit (single-folder navigation) compounds for every future reader. design-specify's competing-architecture comparison later landed on this same shape under the name "layered acceptance criteria."

**Confidence:** High — explicit in design brief Key Decision 2.

---

### Per-tightening ADRs, not a batched canonicalization record

**Context:** Four deferment items needed canonical why-narrative homes. The choice was four separate ADRs or one batched "sprint-01 canonicalization pass" ADR.

**Information used:**
- ADR template structure (each ADR is a focused, dated, signed snapshot at decision-moment)
- The four items' independence — they share only "sprint-01 missed them" as a thread, not an architectural theme
- Existing ADR-0001 through ADR-0014 are each focused single-decision records

**Alternatives considered:**
- `One batched ADR titled "sprint-01 canonicalization pass"` — rejected; the four items don't share an architectural thread, and a batched record would dilute each tightening's individual citability from code breadcrumbs and engine-spec amendments

**Decision:** Four separate ADRs (0015 finite-constant, 0016 rule-safety, 0017 negation, 0018 atomic loadFrom), one per deferment item, in deferment-doc chronological order.

**Rationale:** Independent records preserve independence and make each tightening individually citable. Code breadcrumbs reference a specific ADR; a batched record would force breadcrumbs to point at a section of one document instead of a whole document, weakening the citation.

**Confidence:** High — explicit in design brief Key Decision 3.

---

### D2 canonical check at RuleStore.defineRule with defense-in-depth guard removed

**Context:** Sprint-01's surgical fix for D2 placed a defense-in-depth `UNBOUND_HEAD_VARIABLE` guard inside `Evaluator.fireRule`. The canonical location is at rule-definition time in the rule-registry. The decision was whether to keep both layers or remove the evaluator guard.

**Information used:**
- The deferment doc's explicit invitation to remove the evaluator guard if redundant
- Code archaeology: `RuleStore.defineRule` is the only entry point into the evaluator's rule set; no bypass path exists in-engine
- Reader-experience cost of defense-in-depth without a bypass: "why is this guard here? does the registry not catch this?"

**Alternatives considered:**
- `Keep both layers as defense-in-depth` — rejected; no bypass path exists, so the guard adds reader confusion without operational benefit

**Decision:** Canonical check at `RuleStore.defineRule` with a new `UNSAFE_RULE` error code; remove the defense-in-depth `UNBOUND_HEAD_VARIABLE` guard at `Evaluator.fireRule` entirely. `UNBOUND_HEAD_VARIABLE` disappears engine-wide.

**Rationale:** Single canonical rejection site matches how readers reason about contract enforcement. The deferment doc's framing — "fix at the right layer" — does not require keeping the wrong-layer guard. If a future change introduces a bypass, that change is responsible for adding back the guard.

**Confidence:** High — explicit in design brief Key Decision 5; the operator's later "fix at the right layer" stance reinforced this during the conversation.

---

### Engine-tier-scoped open-questions document for D5 visibility

**Context:** D5 (indexing architecture) needed visibility from the master cascade surface so future readers would not need to discover the deferment doc by accident. ADR format does not fit open questions; the cascade lacked an open-questions artifact type.

**Information used:**
- Existing ADRs all record decisions-made; "status: open" would stretch the genre
- The cascade has three tiers (engine, proof, presentation); only the engine tier has produced open questions so far
- The architectural sketch and risk catalog in sprint-01's deferment doc for D5 is the inheritable context for pass-3

**Alternatives considered:**
- `Stretch the ADR format to cover open questions with a "status: open" field` — rejected; ADRs are decisions-made artifacts, not decisions-pending
- `Master-cascade-wide open-questions document covering all three tiers` — rejected; proof and presentation tiers haven't produced questions yet, and bundling early invites a tangled catch-all

**Decision:** New engine-tier-scoped open-questions document at `design-documents/engine-open-questions.md` with one entry (OQ-1) naming D5's problem shape, why-it-matters-now, what's known about the fix, closure channel (pass-3), and date opened.

**Rationale:** Engine-tier scope matches the rhythm of the cascade (engine-tier spec, engine-tier ADRs, engine-tier open-questions). One entry at creation keeps the genre clean; future engine open questions accrete in the same document; other tiers can grow their own when needed.

**Confidence:** High — explicit in design brief Key Decision 6.

---

### Plan-hardening mitigation selection: apply A1 + A2 + C4

**Context:** The combined plan-attack/plan-smell threat report assessed Low-Moderate risk and surfaced two actionable amendments (A1 failure-shape description for Task 2 Step 6; A2 breadcrumb-placement disambiguation for Task 4 Step 4) plus several context-only findings. C4 was a smell-side finding flagging the untested `unboundVars` field as a contract-pinning gap.

**Information used:**
- Threat-report severity matrix (A1, A2 = MEDIUM/LOW actionable; C4 = MEDIUM forward-looking)
- The four standard hardening options (proceed / proceed with directed mitigations / return to design / stop)
- The user's stated preference earlier in the session for tighter test contracts on new error shapes

**Alternatives considered:**
- `(a) Proceed with A1+A2 only` — rejected by user in favor of stronger contract pinning
- `(c) Return to design over open-questions removal protocol concern` — rejected; the protocol concern is forward-looking, not a pass-2 defect
- `(d) Stop` — rejected; no structural issue surfaced

**Decision:** Apply A1, A2, and C4 inline. C4 added an `unboundVars` array assertion to the new operations.test.js test for stronger contract pinning. Plan re-saved with amendments.

**Rationale:** A1 and A2 are surface-level plan clarifications with zero downside. C4 turns a forward-looking smell finding into a present-day contract pin — small test addition, durable benefit. The user's choice between options (a) and (b) was the load-bearing call; opting for (b) traded a few lines of test code for a tighter machine-checkable contract on a brand-new error shape.

**Confidence:** High — option presented and user response visible in transcript ("Applying A1, A2, and C4 inline").

---

### Task 2 deviation: surgical positive-binding-atom repair for cyclic-negation tests

**Context:** When the new `UNSAFE_RULE` check landed at `RuleStore.defineRule`, the plan predicted one downstream failure. Actual was three: pre-existing tests in `failures.test.js`, `transactions.test.js`, and `operations.test.js` used cyclic-negation patterns like `p(X) :- ¬q(X)` where the head variable appears only in a negated body atom — exactly what `UNSAFE_RULE` rejects. The implementer needed to preserve test intent (these tests target `CYCLIC_NEGATION`, not `UNSAFE_RULE`) while making the rules safe.

**Information used:**
- The standard Datalog safety condition (head variables ⊆ variables bound by non-negated body atoms)
- Each affected test's intent (the assertion that should remain valid is CYCLIC_NEGATION rejection)
- The shape of a minimal-impact repair: adding a positive binding atom that does not change the cyclic-negation property

**Alternatives considered:**
- `Delete the affected tests and re-author from scratch` — rejected (inferred); larger blast radius, loses sprint-01's CYCLIC_NEGATION coverage
- `Disable UNSAFE_RULE for "test-only" rules` — rejected (inferred); breaks the canonical-location principle and adds a test/production divergence
- `Roll back UNSAFE_RULE entirely` — rejected (inferred); abandons the canonical fix that pass-2 exists to deliver

**Decision:** Add a positive binding atom `base(X)` to each affected rule body, preserving CYCLIC_NEGATION test intent while making the rules safe under `UNSAFE_RULE`.

**Rationale:** Surgical and minimal; preserves every affected test's original assertion target; does not require a spec change or a special-case carve-out. The CYCLIC_NEGATION assertion stays valid because the cycle-via-negation property of the rule is unchanged by adding a positive binder. Plan-attack did not catch the broader blast radius — three files vs. the predicted one — but the implementer's surgical response stayed within the plan's intent.

**Confidence:** High — deviation and resolution explicitly narrated in transcript and recorded in summary's Notable findings.

---

### Spec citation-format fix-inline plus plan amendment for subsequent tasks

**Context:** Task 1's spec reviewer caught a citation-format issue: the new engine-spec amendment used lowercase "see ADR-0015" instead of the canonical `(See ADR-NNNN.)` form used elsewhere in the cascade. Confidence 85, severity Minor.

**Information used:**
- The canonical citation pattern already in use across the cascade
- The reality that Tasks 2-4 would each produce similar ADR citations
- The cost of letting subsequent tasks repeat the same mistake vs. amending the plan once with a citation-format implementer-context note

**Alternatives considered:**
- `Fix Task 1 inline and let later tasks each get caught by spec review` — rejected (inferred); wastes review cycles on a predictable repeat-error
- `Treat as advisory only and defer to a final pass` — rejected (inferred); leaves a known-wrong pattern in the working tree across multiple commits

**Decision:** Fix the citation inline in Task 1, then amend the plan with a citation-format implementer-context note so subsequent tasks use `(See ADR-NNNN.)` from the start.

**Rationale:** Two-touch fix: corrects the present defect and prevents the next three predictable repeats. The plan amendment is a small note, not a structural change. Subsequent tasks (3, 4) produced clean citations on the first try, validating the amendment's payoff.

**Confidence:** High — fix-and-amend sequence visible in transcript.

---

### ADR-0018 filename casing: kebab-case via spec amendment

**Context:** Plan-reviewer flagged a real conflict: the spec said `0018-atomic-loadFrom.md` (camelCase fragment); the plan said `0018-atomic-load-from.md` (kebab-case). One of the two had to move.

**Information used:**
- The user's earlier directive that ADR filenames follow kebab-case
- Existing ADR filenames in the cascade (all kebab-case)
- The cost of either fix (spec one-character amendment vs. plan one-character amendment)

**Alternatives considered:**
- `Amend the plan to match the spec's camelCase fragment` — rejected; conflicts with the user's earlier kebab-case directive and breaks pattern consistency across the cascade
- `Use both names with one as alias` — rejected (inferred); two file paths for one ADR is needless complexity

**Decision:** Amend the spec to `0018-atomic-load-from.md` (kebab-case). Plan stayed.

**Rationale:** The user's earlier directive is the tiebreaker; the spec was inconsistent with the directive, the plan was consistent. Always move the inconsistent artifact, not the consistent one.

**Confidence:** High — conflict resolution explicit in plan-build narration.

---

### Operations test consolidation to reconcile test count

**Context:** Plan-reviewer flagged a second real conflict: spec required +1 new test in `operations.test.js`; plan added +2. One of the two had to move.

**Information used:**
- The spec's test-count constraint (one new `it(...)` block for UNSAFE_RULE)
- The plan's two-case approach (two `it(...)` blocks for two unsafe-rule shapes)
- The reality that one `it(...)` block can hold multiple `expect()` calls without losing assertion granularity

**Alternatives considered:**
- `Amend the spec to allow +2 tests` — rejected (inferred); the spec's count was the contract, and the two cases share an assertion target
- `Drop one of the plan's two cases` — rejected (inferred); reduces coverage

**Decision:** Consolidate the plan's two cases into a single `it(...)` block with multiple `expect()` calls. Test count returns to +1 as the spec requires; both unsafe-rule shapes are still exercised.

**Rationale:** Preserves coverage without changing the spec; the granularity loss is cosmetic since both cases share the same error code and structural shape. C4 mitigation (adding the `unboundVars` array assertion) lands cleanly within this consolidated block.

**Confidence:** High — resolution explicit in plan-build narration.

---

### Breadcrumb shape: one-line ADR reference plus 4-8 word failure-mode phrase

**Context:** Each of the four tightening sites needed a code comment pointing readers to the canonical ADR. The shape question was: ADR-reference-only (lightest), one-line with short phrase, or multi-line rationale at each site.

**Information used:**
- The drift-prevention principle: rationale duplicated across code and ADR drifts over time
- The reader-immediacy principle: readers do not always click through citations
- The ADR's role as the canonical why-narrative (rationale lives there, not in code)

**Alternatives considered:**
- `ADR-reference-only` — rejected; lightest but does not give immediate context to readers who do not click through
- `Multi-line rationale at each site` — rejected; rationale inline invites drift between the comment and the ADR over time

**Decision:** One-line breadcrumbs at each site, each containing an ADR reference plus a 4-8 word failure-mode summary phrase. Multi-line rationale moves out of code into the ADR.

**Rationale:** Compromise between drift-prevention (short, fixed-format comment cannot drift far) and reader-immediacy (the failure-mode phrase gives enough context to know whether to click through). Task 3 specifically replaced a pre-existing 4-line rationale comment in `Evaluator.matchBodyAtom` with the new one-line breadcrumb, moving the rationale into ADR-0017 as the canonical home.

**Confidence:** High — explicit in design brief Key Decision 7.

---

## Notes on confidence calibration

All twelve entries are marked High because the design brief, summary, and threat report capture every decision's context, alternatives, and rationale explicitly. The transcript corroborates each decision's emergence sequence. The two entries that involved the most inference (Task 2 deviation alternatives; spec-amendment citation format alternative scenarios) used `(inferred)` markers where the rejected alternatives were not narrated verbatim — even there, the chosen path and rationale were explicit.

<!-- produced-by finish-write-records@v0003 -->
