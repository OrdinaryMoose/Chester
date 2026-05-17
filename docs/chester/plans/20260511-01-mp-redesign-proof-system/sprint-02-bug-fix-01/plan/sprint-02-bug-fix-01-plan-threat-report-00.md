# Plan Threat Report — sprint-02-bug-fix-01

**Plan reviewed:** `plan/sprint-02-bug-fix-01-plan-00.md`
**Reviewers:** `chester:plan-build-plan-attacker` + `chester:plan-build-plan-smeller` (both dispatched, neither forked)
**Smell triggers matched:** `async` / `await` (concurrency-primitive category, ~14 matches in test boilerplate); `persistence` / `persistenceRepo` / `Repository` (persistence-pathway category, ~6 matches in `createDomainBridge` stub injection). Triggers fired plan-smell despite both pattern-classes being false positives from a structural-novelty standpoint — the plan adds no new persistence pathway and no new concurrency primitive; the keyword matches are all in existing-pattern test boilerplate reused from `concern-schema.test.js`. Tune-toward-over-firing discipline preserved per `references/smell-triggers.md`.

**Combined risk level:** **Low**

## Why Low

1. **Plan-attack's deep audit confirmed all 12 codebase anchors the plan modifies are accurately described** (current `requiredFields`, current `EDB_PREDICATES` membership, current RATIFY OPERATION_SPECS shape, current `validPredicates` flow, current REVISE supersession behavior, current `_ARITIES` table content, current concern-schema.test.js:266-279 SHAPE_INVALID assertion). Zero anchor-vs-reality drift.

2. **Plan-attack's structural sequencing audit (Findings 1, 11, B, D) confirmed all "could-be-blocker" cases are properly handled in the plan** — Task 2's fixture-repair-before-schema-extension ordering prevents the closed-enum test from failing on the wrong field; Task 5's evidence-seeding before the inverted CONCERN ratify test prevents `PRECONDITION_FAILED` once the shape-check is bypassed; Task 6's REVISE path correctly supplies `idShape`. None of these became real findings because the plan addresses them in place.

3. **Plan-smell's one MEDIUM finding (EDB_PREDICATES / PROJECTION_ARITIES whitelist coupling) is pre-existing** and the plan correctly extends both sites atomically. The plan does not worsen the smell — it follows the documented convention (`render.js:118-119` comment) but does not add machine-level enforcement. A future enforcement refactor (e.g., deriving `PROJECTION_ARITIES` from `EDB_PREDICATES` via a shared registry) would belong to its own sub-sprint and is out of scope here.

4. **One actionable LOW recommendation from plan-smell** (add `nonEmptyStringFields: []` to all eight other category descriptors in `schema.js` so the directive becomes self-documenting on every descriptor, matching the established `closedEnumFields: {}` empty-value pattern) is worth considering. It is a minor structural polish that prevents silent omissions on future category additions. Not a blocker; an optional Task 1 amendment.

5. **One watch-item from plan-attack** (Finding 7): the spec text at AC-2.1 uses the hyphenated literal `'grounds-imply-conclusion'` while `tags.js` defines `INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION = 'grounds_imply_conclusion'` (underscore). The plan correctly uses the constant `INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION` throughout, so there is no runtime risk — but an implementer who copies the spec's literal verbatim into a test would introduce a hard test failure. Worth flagging in execute-write's per-task brief.

---

## Plan-Attack Findings (Adversarial Review)

### Resolved within the plan (no action needed)

- **Finding 1 (MEDIUM, resolved):** Task 5 ratify test's `addElement` evidence-seeding correctly handles the post-fix precondition check that becomes reachable once `verifyArgsShape` no longer throws first.
- **Finding 6 (MEDIUM, resolved):** Inverted CONCERN test in Task 5 Step 5 correctly seeds evidence to avoid `PRECONDITION_FAILED`; pre-fix test omitted the seed because the throw fired earlier.
- **Finding B (HIGH, resolved):** Same as Finding 6 — confirmed correctly handled.
- **Finding D (HIGH, resolved):** REVISE in Task 6 AC-5.2 correctly supplies `idShape: 'proposition'` so the REVISE guard at `mutations.js:206-213` passes; the supersedes link and per-element fact emission flow through unchanged.
- **Finding 11 (MEDIUM, resolved):** Task 2's fixture-repair-before-schema-extension ordering (Step 2 before Step 4) prevents the closed-enum test from throwing `SHAPE_INVALID` on `reasoning_chain` instead of `inference_pattern`.

### Actionable

- **Finding 7 (LOW):** Spec text AC-2.1 example uses `'grounds-imply-conclusion'` (hyphen) but `tags.js` value is `'grounds_imply_conclusion'` (underscore). Plan correctly uses `INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION` constant throughout. **Mitigation:** flag to execute-write so implementer copies the constant from `tags.js`, not the spec's example literal.
- **Finding A (LOW):** Task 3's AC-3.4 test requires `import { createDomainBridge } from '../domain-bridge.js'` and `import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js'` at file top — these are added in Task 3 Step 1 alongside the other Task 3 imports. The plan lists them explicitly; the implementer must include them when extending the file.
- **Finding C (LOW, informational):** `grounding/2` second argument is array-valued by pre-existing design (`translation.js:31` stores `args.grounding` as-is, not spread per element like RESOLUTION's `addresses`). Tests in the plan correctly use `grounding: ['evid_1']`. Not introduced by this plan; flagged for context only.

### Verified-correct anchors (12)

All anchors the plan claims to modify were re-verified against the actual codebase (file path, line range, content shape, surrounding context). Zero drift detected.

---

## Plan-Smell Findings (Forward-Looking Code Smell)

- **Finding 1 (MEDIUM):** Two independently-maintained whitelists (`EDB_PREDICATES` in `translation.js:180-188` and `PROJECTION_ARITIES` in `render.js:131-139`) plus a third parallel structure (`_CATEGORY_PROBES` in `mutations.js:13-23`, untouched by this plan). The coupling is comment-documented (`render.js:118-119`) but not machine-enforced. Plan extends both relevant sites correctly and atomically — does not worsen the smell, does not improve it. A future enforcement refactor is its own sub-sprint.
- **Finding 2 (LOW):** `makeRealBridge` helper duplicated between Task 5 and Task 6 describe blocks in `proposition-schema.test.js`. Plan acknowledges this is intentional per-task-diff narrowness; the `concern-schema.test.js` precedent (line 225) defines it at module scope. **Optional follow-up:** a cleanup step at Task 7 to hoist the helper. Marginal improvement.
- **Finding 3 (LOW):** `nonEmptyStringFields` directive will exist on PROPOSITION only; other eight descriptors will silently lack the field. `verifyArgsShape` guards with `?? []`, so absence is benign. **Recommendation:** add `nonEmptyStringFields: []` to the other eight category descriptors in Task 1 so the directive is visibly present on every descriptor (matching the established `closedEnumFields: {}` empty-value pattern). Prevents silent omissions on future category additions. ~2-3 minutes of work; eight one-line additions.
- **Finding 4 (LOW):** RATIFY's `argShape.label` value `'ratify'` is consistent with WITHDRAW's `'withdraw'` and MANAGE_FRICTION's `'manage_friction'` — no inconsistency. Marginal cosmetic finding; no action.
- **Finding 5 (LOW, documentation only):** Spec's "Unchanged surfaces" section lists `mutations.js` but the plan correctly modifies it per AC-6.1. The spec text predates AC-6.1's resolution; documentation drift, not a plan defect. **Optional:** update the spec post-merge to remove `mutations.js` from "Unchanged surfaces."

---

## Recommended Mitigations (Optional)

1. **Adopt plan-smell Finding 3.** Add `nonEmptyStringFields: []` to the other eight category descriptors in Task 1. Two-three minutes; prevents silent omissions on future descriptor additions; matches the established `closedEnumFields: {}` self-documenting pattern.
2. **Flag plan-attack Finding 7 to execute-write.** Note in the execute-write per-task brief that the `inference_pattern` value must come from `INFERENCE_PATTERNS.GROUNDS_IMPLY_CONCLUSION` (underscore form `'grounds_imply_conclusion'`), not from the spec's example literal `'grounds-imply-conclusion'` (hyphen).
3. **Defer plan-smell Finding 1 to a separate sub-sprint** if the user wants machine-enforced whitelist coherence. Out of scope here; worth a follow-up.

## Your Four Options

1. **Proceed as-is.** Plan is sound. Watch-items for execute-write are minor and documented.
2. **Proceed with directed mitigations.** Apply Recommendation 1 (add `nonEmptyStringFields: []` to other descriptors) and/or Recommendation 2 (flag the inference_pattern note) before handing off.
3. **Return to design** with additional requirements (e.g., machine-enforce the EDB/PROJECTION whitelist coupling). Out of scope per current spec.
4. **Stop.** No further action.

Recommendation: **Proceed with directed mitigations (1 and 2).** The two mitigations are cheap and prevent low-probability but real implementer hazards.

<!-- created-at: 2026-05-17T02:04:24Z -->
<!-- produced-by plan-build@v0004 -->
