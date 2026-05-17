# Reasoning Audit: Restore PROPOSITION reasoning_chain, rejected_alternatives, and ADR-0006 render lines

**Date:** 2026-05-17
**Session:** `00`
**Plan:** `sprint-02-bug-fix-01-plan-00.md`

## Executive Summary

The session began as a casual user question — "why did we drop the reasoning_chain and rejected_alternatives fields from the entities?" — and the agent's first consequential move was framing the answer not as a remembered design choice but as a cascade-vs-implementation drift, which made a sub-sprint (rather than an ADR) the right response. The most consequential downstream decision was the Hybrid Recommendation in design-specify: a third option neither architect proposed (a declarative `nonEmptyStringFields` directive on `verifyArgsShape`) that preserved the channeling-architecture intent without introducing a new validator hook, and pulled in three Explorer-flagged cross-cutting hazards the brief had missed. Execution stayed largely on-plan; the two visible deviations were the `grounding` array-vs-string translator/engine mismatch surfaced mid-execution (propagated forward rather than restructured) and the strict execute-verify-complete gate's user-directed expansion of scope to close four pre-existing baseline failures.

## Plan Development

The plan was developed end-to-end inside the session: the user's question triggered an investigation that produced a six-section design brief (modeled on the prior `sprint-02-proof-layer-pass-2` CONCERN-addition precedent), which then went through design-specify's three chained reviews (fidelity, adversarial, ground-truth) producing spec-00 then spec-01. plan-build wrote a 7-task plan, ran plan-reviewer plus the parallel plan-attack and plan-smell, and synthesized them into a combined-risk Low report. The user chose Option 2 (proceed with directed mitigations), adding `nonEmptyStringFields: []` to the other eight descriptors in Task 1 and flagging the `inference_pattern` hyphen-vs-underscore watch-item. Execution mode was set to subagent; the resulting plan drove a fully automated 7-task implementation run with spec + quality review per task.

## Decision Log

### Hybrid Recommendation construction in design-specify

**Context:**
Two parallel architects (declarative-only validation vs. retract-all-then-reassert lifecycle) converged on the same code paths via different reasoning. Neither architect's spine fully addressed the channeling-architecture intent that `reasoning_chain` carry substantive content, and neither surfaced the Explorer's three cross-cutting hazards.

**Information used:**
- Architect A's declarative-only blueprint
- Architect B's discovery that `mutations.js:69-89` REVISE already creates a new element id with `superseded/2`, making retract-all structurally free
- Explorer's three flags: duplicated `validPredicates` in `domain-bridge.js`, `PROJECTION_ARITIES` whitelist coupling in `render.js`, latent ratify-path `verifyArgsShape` exposure from the prior CONCERN sub-sprint
- ADR-0006 render-format spec (which named `Collapse test:` as a line also currently missing)

**Alternatives considered:**
- `Architect A as-is` — rejected because presence-only validation admits `reasoning_chain: ''` and weakens the channeling architecture
- `Architect B as-is` — rejected for the same reason; B's contribution (revise contract) was absorbed into the Hybrid as documentation
- `Introduce an Adversary pass for content quality` — rejected as out-of-scope expansion; deferred to a future Adversary process (ADR-0008)

**Decision:** Synthesize a Hybrid that takes A's declarative spine, adds a new declarative `nonEmptyStringFields` directive to `verifyArgsShape` for `reasoning_chain`, absorbs B's revise-contract documentation, and folds in all three Explorer-flagged hazards plus the ADR-0006 `Collapse test:` render line.

**Rationale:** The new declarative directive resolves the OQ2 validation-depth question without introducing procedural validators (preserves the discipline), and the cross-cutting hazards were real exposures the architects' axis-bounded scope had missed. The user picked Hybrid plus Option (ii) on the render scope question (restore all three ADR-0006 lines).

**Confidence:** High — assistant explicitly narrated the synthesis logic and called the `nonEmptyStringFields` directive "a third option neither architect surfaced."

---

### Initial framing as cascade-vs-implementation drift

**Context:**
The user asked a single-sentence question about two missing PROPOSITION fields. The agent had to choose between answering as historical narrative (recap of design decisions) or as a structural diagnosis (cascade vs. implementation comparison).

**Information used:**
- `design-documents/05-domain-spec.md:120-123` (cascade still requires both fields)
- `sprint-02-proof-layer-plan-00.md:521,554-557` (plan transcribed only four fields)
- `schema.js:32` (implementation matches the plan, not the cascade)
- Git blame on `schema.js` (born this way at `82c6ebc`, never modified)
- ADR directory 0001-0019 (no ADR documents either field's removal)
- All prior sprint summaries and audits (zero references to dropping either field)

**Alternatives considered:**
- `Treat as design memory question and recap` — rejected because no deliberate decision existed to recap
- `Propose an ADR removing the fields from the cascade` — surfaced as one of two offered next-steps but not chosen
- `Single-line answer ("we didn't drop them") without sub-sprint proposal` — implicitly rejected; agent offered both options to the user

**Decision:** Frame the answer as a real cascade-vs-implementation divergence with two offered remediation paths (sprint to align implementation vs. ADR proposing cascade change).

**Rationale:** The git/ADR/summary evidence converged unambiguously on "silent transcription gap, never a deliberate decision," and offering both remediation directions gave the user agency over the response shape.

**Confidence:** High — narration explicitly stated "didn't deliberately drop them" and surfaced both alternative paths.

---

### Adversarial-review HIGH finding and corrective rewrite of AC-4.1

**Context:**
Adversarial review verified the spec's line citations against the actual code. The spec inherited from the Explorer report a claim about duplicate `validPredicates` lists at `domain-bridge.js:47` and `:155`, with corresponding instructions in AC-4.1, the Components section, and the Goal paragraph.

**Information used:**
- Actual `domain-bridge.js:47-50` and `:196-197` (the two real sites)
- `domain-bridge.js:155` (a JSDoc comment, not a `validPredicates` site)
- Hardcoded lists at both real sites contain Phase-A rule-head predicates only, not EDB predicates
- `translation.js:190-191` (`getDeclaredEDBPredicates()` flows `EDB_PREDICATES` into `validPredicates` automatically)

**Alternatives considered:**
- `Correct the line numbers and keep AC-4.1` — rejected because the semantic error was deeper than line drift; the new predicates are EDB facts, not rule heads, and adding them to the hardcoded rule-head lists would be semantically wrong
- `Leave AC-4.1 and let plan-build catch the inconsistency` — rejected; an implementer following AC-4.1 verbatim would make a wrong edit

**Decision:** Delete AC-4.1 entirely; rewrite the Components and Goal text to note that EDB predicates flow into `validPredicates` automatically via `getDeclaredEDBPredicates()` (covered by AC-3.3, the `EDB_PREDICATES` extension). Bump the spec from `spec-00` to `spec-01` per artifact-schema discipline.

**Rationale:** Per the assistant's narration: "prior-art reports surface what *prior sprints decided*, not what *current code is* — those drift apart." Adversarial review caught it because it opened the file; the fix replaces an unnecessary AC rather than rewriting a contract.

**Confidence:** High — rationale explicitly stated in the adversarial-review narration.

---

### Strict execute-verify-complete discipline applied to 4 pre-existing failures

**Context:**
Fresh verification after Task 7 returned 127 passing / 4 failing. The 4 failures were byte-identical to the baseline (104 passing + 4 failing at BASE_SHA `7c361df`) and explicitly out-of-scope in the spec's Non-Goals.

**Information used:**
- Baseline snapshot taken at sprint start (104 + 4)
- Per-task reviewer reports confirming the 4 failures were unchanged throughout
- Spec Non-Goals explicitly excluding fixing them
- `execute-verify-complete` Step 1's strict language: "If tests fail: Stop. Do not proceed to Step 2"

**Alternatives considered:**
- `Treat as pre-existing baseline and proceed` — agent surfaced this as Option 1
- `Stop and investigate per strict discipline` — agent surfaced this as Option 2

**Decision:** Present both options honestly to the user rather than self-select; user chose Option 2 (stop and fix).

**Rationale:** The "Iron Law" of honest verification reporting required not silently swallowing a non-zero exit code. The decision to defer to the user (rather than self-select either path) was the load-bearing move — the strict-discipline letter conflicted with the in-scope reality, and the user owned the resolution.

**Confidence:** High — assistant explicitly named the discipline tension and presented both paths verbatim.

---

### `grounding` array-vs-string deviation propagation in Tasks 5 and 6

**Context:**
During Task 5 implementation, the implementer found that the planned `grounding: ['evidence_1']` (array form per the cascade) hit a pre-existing translator/engine mismatch — engine `FactStore` rejects array-valued constants. The new AC-6.1 ratify-path test required a real assertFact round-trip.

**Information used:**
- Engine `FactStore._validateArgs` behavior (rejects arrays as constants)
- Plan's array-form fixture
- Task 6 dependency on the same fixture pattern for the bridge round-trip

**Alternatives considered:**
- `Fix the translator to spread grounding (analogous to RESOLUTION's addresses)` — rejected as out-of-scope; would expand the sub-sprint
- `Amend the cascade to specify scalar grounding` — rejected; same scope-expansion problem
- `Skip the assertFact-routed tests` — rejected; AC-6.1 explicitly requires no-throw on a real ratify path

**Decision:** Adapt the new AC-6.1 test (and propagate to Task 6's bridge round-trip) to use `grounding: 'evidence_1'` (string); keep `translate()`-only tests using the cascade-spec array form; document the divergence inline on the `validProposition` fixture as a known-issue note.

**Rationale:** Preserves AC-6.1's contract (ratify-path no-throw) at minimum scope cost; defers the structural cascade-vs-engine grounding gap to a future sub-sprint; the inline documentation ensures the divergence is not silent.

**Confidence:** High — deviation surfaced, narrated, and addressed in code review Finding 1 with an explicit inline comment commit.

---

### Plan-build mitigation: `nonEmptyStringFields: []` on the other eight descriptors

**Context:**
plan-smell Finding 3 recommended adding `nonEmptyStringFields: []` to all non-PROPOSITION descriptors so the directive is visibly present on every descriptor (matching the `closedEnumFields: {}` pattern). Combined-risk synthesis surfaced this as the one actionable structural recommendation.

**Information used:**
- plan-smell Finding 3 (MEDIUM coupling risk)
- Existing `closedEnumFields: {}` pattern on the other descriptors
- plan-attack confirmation that no other findings rose above LOW/advisory

**Alternatives considered:**
- `Option 1: Proceed as-is` — rejected by user
- `Option 3: Return to design with new requirements` — rejected as out-of-scope (machine-enforced EDB/PROJECTION coupling)
- `Option 4: Stop` — rejected by user

**Decision:** User chose Option 2 (proceed with directed mitigations); add `nonEmptyStringFields: []` to the other eight descriptors in Task 1 and add an execute-write brief note about `inference_pattern` underscore-vs-hyphen.

**Rationale:** Cheap (~2-3 minutes mechanical), prevents silent omissions on future category additions, matches an existing declarative pattern.

**Confidence:** High — explicit user choice on a multi-option menu.

---

### Cross-impact CONCERN ratify test inversion

**Context:**
Adding `argShape: { requiredFields: ['elementId'] }` to RATIFY OPERATION_SPECS closed a cross-category latent SHAPE_INVALID bug — the prior CONCERN sub-sprint had a known-issue test (`concern-schema.test.js:266-279`) that asserted `ratifyConcern({elementId})` throws SHAPE_INVALID. Once RATIFY's argShape was added, that throw no longer fired.

**Information used:**
- `mutations.js` WITHDRAW (`:101-105`) and MANAGE_FRICTION (`:141-145`) precedent (both carry `argShape` overrides)
- RATIFY (`:111-133`) as the outlier missing the override
- Prior CONCERN sprint's known-issue marker

**Alternatives considered:**
- `Leave the CONCERN test as-is (would fail post-fix)` — rejected; would have broken the suite
- `Delete the test` — rejected; the test still encodes a useful invariant (the ratify path doesn't reject on missing per-category fields)
- *(No further alternatives visible in context)*

**Decision:** Invert the test in Task 5 — assert no-throw on `ratifyConcern({elementId})` and add a comment that the prior known-issue is now closed by the cross-cutting RATIFY argShape fix.

**Rationale:** Captures the cross-impact in-place as a passing assertion; converts a known-issue marker into a regression guard.

**Confidence:** High — assistant narration explicitly named the inversion as part of Task 5 sequencing and the substantive changes table records it.

---

### Ground-truth AC-3.4 upgrade from LOW to fix-worthy

**Context:**
Ground-truth review returned 0 HIGH, 2 MEDIUM, 2 LOW. One LOW concerned AC-3.4's observable-mechanism description — the AC text described a warning-emission behavior that did not actually exist in the codebase (the real behavior was a throw at boot-validation time).

**Information used:**
- Actual codebase boot-validation behavior (throws, does not warn)
- AC-3.4's spec text (claimed warning emission)
- design-specify rule: MEDIUMs fixed inline; LOWs typically reported only

**Alternatives considered:**
- `Note in report only and let plan-build catch it` — rejected because the AC was unimplementable as written
- `Leave the AC and let an implementer interpret` — rejected; observable-mechanism precision is the whole point of an AC

**Decision:** Upgrade the LOW to fix-worthy; correct AC-3.4 inline to match the actual throw-at-boot mechanism.

**Rationale:** "A real correctness issue with the AC text, not just context" — an AC that names the wrong observable mechanism is broken regardless of severity score.

**Confidence:** High — narration explicitly distinguished this LOW from the other (informational) LOW.

---

### Closing baseline failures as one logical commit

**Context:**
After the user chose Option 2 (fix the 4 pre-existing failures), the agent diagnosed three root causes spanning four failing tests: substrate `allRules()` missing, REVISE/MANAGE_FRICTION fixture missing fields, `renderClosingArgument` JSDoc missing `@throws`.

**Information used:**
- Engine-port-adapter contract (substrate must implement `allRules()`)
- `mutations.js` guards for REVISE (`idShape`, `supersedes`) and MANAGE_FRICTION (`disposition`)
- `facade-jsdoc` test's structural requirement for `@throws` on every facade method

**Alternatives considered:**
- `Three separate commits, one per root cause` — not chosen; agent grouped as "one logical change"
- `Defer to a separate follow-up sub-sprint` — rejected by the user's Option 2 choice

**Decision:** Apply all three fixes in a single targeted commit (`5af7ff2`); proceed to checkpoint.

**Rationale:** Cohesive scope ("baseline failure closure"), all test-infra (no production-code semantics changed), and the diagnosis showed they share an "out-of-scope items surfaced by strict gate" provenance.

**Confidence:** Medium — grouping decision visible (single commit) but rationale not explicitly narrated; (inferred) from the commit message `fix(test-infra): close 4 pre-existing test failures surfaced during execute-verify-complete`.

---

### Inline fix of Important code-review Finding 1 before finish sequence

**Context:**
Full code review returned 0 Critical, 2 Important, 3 Minor. Finding 1 (Important, confidence 88) recommended adding a one-line comment on `validProposition` explaining the array/string-grounding divergence. Finding 2 was design-observational only.

**Information used:**
- Code-review report severities
- Cost-of-fix estimate (one-line comment)
- Finish-sequence proximity (about to enter execute-verify-complete)

**Alternatives considered:**
- `Defer to follow-up` — rejected; the divergence is documentation-load-bearing and the fix is one line
- `Address Finding 2 too` — rejected; design-observational, not actionable in this sprint

**Decision:** Apply Finding 1 inline before the finish sequence; record Finding 2 in the summary's Known Remaining Items.

**Rationale:** Cheap fix prevents future readers from rediscovering the divergence; Finding 2's design-observational nature places it correctly in the deferment surface, not the fix queue.

**Confidence:** High — narration explicitly identified Finding 1 as "cheap to address now."

<!-- created-at: 2026-05-17T08:53:58Z -->
<!-- produced-by finish-write-records@v0003 -->
