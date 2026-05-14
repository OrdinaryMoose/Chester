# Sprint-01-pass-4 — Combined Plan Threat Report

**Plan reviewed:** `sprint-01-proof-backend-pass-4-plan-00.md` (post-inline-fix state)
**Spec context:** `sprint-01-proof-backend-pass-4-spec-01.md`
**Hardening dispatches:** `chester:plan-build-plan-attacker` + `chester:plan-build-plan-smeller` (smell triggered on new abstractions + new contract surfaces categories).

**Combined implementation risk level: Moderate** (after inline fixes — would have been Significant without them).

---

## Risk-level rationale (4 statements)

1. **The plan-attacker found three HIGH-severity factual errors in the original Task 4 and Task 5 instructions** — all corrected inline before this report was written. Most consequential: Task 4's migration snippets mislabeled the `failures.test.js` callsites at lines 15 and 23 as UNSAFE_RULE / MALFORMED_RULE tests when they are actually the CYCLIC_NEGATION test. An implementer following the original snippets verbatim would have produced a broken test. The corrected plan now contains accurate per-callsite migration snippets matched to the actual file contents.

2. **A subtle interlock with `lifecycle.test.js` and `transactions.test.js`** — these files contain three hardcoded `version: 1` blobs (lines 67, 83, 165) that would throw `MALFORMED_SERIALIZED_INPUT` under Task 3's new schema-version rejection, causing Task 5's per-file-commit green-gate to fail without explanation. Plan-smeller flagged this as LOW; plan-attacker flagged it as HIGH and identified the correct subset (one `version: 1` blob at `transactions.test.js:107` is SAFE because the `loadFrom-during-tx` test fires `NESTED_TRANSACTION_OP_REFUSED` before the version check; the other three need updating). Plan now schedules these fixes inline in the lifecycle and transactions migration steps.

3. **Plan-smeller named two MEDIUM smells the plan acknowledges but doesn't structurally eliminate.** The `isUppercaseVar` regex inside `RuleAtomTranslator.js` is the sole arbiter of "what counts as a variable" at the public boundary; the convention is encoded in three places (regex, `untranslateArg`, JSDoc comment) without an exported single-source constant. And the temporary `defineRuleObj` helper creates a fourth parallel encoding of tuple↔object format during the migration window. Both are accepted-debt smells appropriate for this small alignment sprint; neither is load-bearing for sprint-1.5's success criteria. They are flagged for the implementer to keep in mind, not blockers.

4. **Three callsite-count factual errors** (lifecycle: 3 not 4; explain: 7 explain calls not 6; failures: 6 callsites not 5) — corrected inline. These would have caused implementer confusion but not failed tests; counts are now accurate against the worktree's actual file contents.

---

## Top findings (by severity, post-fix status noted)

### Sprint-blocking (HIGH — all fixed inline)

- **Task 4 `failures.test.js` migration snippets mislabeled** — lines 15 and 23 are CYCLIC_NEGATION test (well-formed setup + expected-throw on cycle), not UNSAFE_RULE / second MALFORMED_RULE. FIXED inline: accurate tuple-form snippets now written for all six callsites (lines 8, 15, 23, 40, 41, 77) with semantic-preserving translations.
- **`version: 1` blobs not anticipated** — three hardcoded blobs in `lifecycle.test.js:67, 83` and `transactions.test.js:165` would throw under Task 3's version-2 rejection. FIXED inline: Task 5's lifecycle and transactions migration steps now explicitly schedule the `version: 1` → `version: 2` updates with rationale for each.
- **`lifecycle.test.js` callsite count error (3 vs 4)** — FIXED: count corrected with line-number citations (9, 40, 75).

### Plan polish (MEDIUM — all fixed inline)

- **`explain.test.js` callsite count error (6 vs 7)** — FIXED: count corrected with line-number citations (29, 39, 47, 52, 55, 60, 61).
- **Task 5 item 10 was a duplicate of item 3** — FIXED: removed, leaving 9 distinct migration files in order.

### Smell debt (MEDIUM — accepted as tradeoffs)

- **`isUppercaseVar` regex encodes variable identifier convention as an implicit contract.** Three locations must stay in sync (regex, untranslateArg, JSDoc comment) without a single-source constant. Future variable convention changes would require coordinated edits with no compile-time check. Plan-smeller's recommendation: extract a single `VARIABLE_REGEX` constant or `isVariable(s)` helper that both forward and inverse translators import. For sprint-1.5's scope (no convention changes anticipated), the smell is acknowledged but not addressed.
- **Four parallel encodings of tuple↔object format** (translator forward + translator reverse + Serializer.isValidSerialized + test helper's `atomToTuple`) during the migration window. Helper-as-fourth-encoding ceases to exist after Task 6's cleanup. Accepted tradeoff: helper independence makes the migration commits each green, at the cost of brief parallel surface.

### Latent observations (LOW)

- **`isUppercaseVar` regex narrowing to `/^[A-Z][A-Z0-9_]*$/`** — mixed-case names like `'Abc'` silently pass through as ground constants. Confirmed acceptable: the spec and `Unifier.js` convention is all-uppercase; no existing test uses mixed-case variables.
- **`explain(fact)` returns null for malformed input** rather than throwing — creates a silent migration hazard where old 2-arg callers (`e.explain('pred', [args])`) get a misleading `null` instead of a typed error. Spec design choice; documented in AC-3.2.
- **`evaluation.test.js` mixed-ownership zone** after migration — RuleStore-level calls stay object-form while Engine-level calls become tuple-form. FIXED inline: Task 5 instructs adding `// RuleStore-level: object form intentional` comment next to each `rs.defineRule({...})` callsite so future readers don't misread.
- **`explainTuple` helper export is unused by design** — exists "for symmetry" with `defineRuleObj` per Task 4 commentary. Acknowledged stylistic choice; deleted with the rest of the helper in Task 6.

---

## Smell triggers matched

This plan triggered two of the five smell trigger categories from `references/smell-triggers.md`:

- New abstractions (`RuleAtomTranslator.js` production module + temporary `__tests__/helpers/defineRuleObj.js` test helper)
- New contract surfaces (`Engine.defineRule` + `Engine.explain` signatures change; `Serializer` schema version bumps from 1 to 2)

DI registrations, async/concurrency primitives, and new persistence pathways did NOT trigger. Smell value was concentrated in the regex-as-implicit-contract finding (Finding 1) and the four-parallel-encodings drift hazard (Finding 2); plan-attacker's higher-impact findings (mislabeled snippets, version-blob interlock) caught the structural defects that plan-smeller's forward-looking lens treated as LOW noise.

---

## Decision matrix (your four options)

1. **Proceed (post-fix as-is)** — All HIGH and MEDIUM findings are addressed inline in the plan. Two MEDIUM smells (regex implicit contract, four-encodings drift) remain as accepted tradeoffs. Implementer can begin Task 1 with high confidence.

2. **Proceed with directed mitigations** — Apply one or both smell mitigations before execute-write: (a) extract a `VARIABLE_REGEX` or `isVariable` exported helper from `RuleAtomTranslator.js` to eliminate the three-location regex encoding; (b) re-frame the test helper to internally call `internalRuleToTuple` from `RuleAtomTranslator.js` (eliminating the fourth parallel encoding). Both are small (~10-20 LOC each) and harden the plan's structural posture.

3. **Return to design** — Not warranted by current findings. The spec is sound; the issues were all in the plan's task-level instructions, all corrigible inline.

4. **Stop** — Not warranted.

The plan-attacker's HIGH findings would have caused real implementation pain without these fixes — the failures.test.js mislabel especially. The plan-smeller's accepted smells are appropriate for a small alignment sprint; coordinating them now would be over-engineering for a 6-task ~200-LOC change.

---

*Threat report generated by plan-build's hardening gate. Plan-attacker and plan-smeller dispatched in parallel via named subagents (no fork). Findings synthesized into combined risk level by the planner. All HIGH/MEDIUM structural findings addressed inline before this report was written.*

<!-- created-at: 2026-05-13T22:05:10Z -->
<!-- produced-by plan-build@v0001 -->
