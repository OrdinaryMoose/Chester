# Ground-Truth Review Report — sprint-02-bug-fix-01

**Spec reviewed:** `spec/sprint-02-bug-fix-01-spec-01.md`
**Brief reference:** `design/sprint-02-bug-fix-01-design-00.md`
**Status:** Findings (0 HIGH, 2 MEDIUM, 2 LOW) — all MEDIUM findings fixed inline in spec-01; LOW findings noted below.

## Verified Claims

The following spec claims were verified against the actual source files:

- `schema.js:31-39` PROPOSITION descriptor — current `requiredFields: ['statement', 'grounding', 'collapse_test', 'inference_pattern']` and `optionalFields: ['scope']`. **CONFIRMED.**
- `schema.js:94-114` `verifyArgsShape` loop structure supports the `nonEmptyStringFields` directive insertion cleanly — the `for (const f of desc.requiredFields ?? [])` loop at lines 99-101 is the precedent for an analogous `nonEmptyStringFields` loop. **CONFIRMED** (actual range is 94-115; off-by-one but reads identical logic).
- `translation.js:28-36` PROPOSITION translator currently emits `proposition_decl/3`, `grounding/2`, `collapse_test/2`, `created_at/2`, and no `reasoning_chain` or `rejected_alternative`. **CONFIRMED.**
- `translation.js:42-49` RESOLUTION translator uses `args.addresses.map(rid => ['addresses', [id, rid]])` array-spread idiom (line 45). The spec's claim that this is the precedent for `rejected_alternative` spreading is accurate. **CONFIRMED.**
- `translation.js:180-188` `EDB_PREDICATES` set excludes `reasoning_chain` and `rejected_alternative`. **CONFIRMED.**
- `render.js:27-28` `renderStructuredProof` proposition rendering is a single-line `${b.I}: ${b.S}` per proposition. **CONFIRMED** (the cited 27-31 range covers section context; the substantive emit is line 28).
- `render.js:131-139` `PROJECTION_ARITIES` table format. **CONFIRMED.**
- `render.js:37-46` `_ARITIES` table for `renderElementDeep`, intentionally not extended. **CONFIRMED** — the spec's rationale (renderElementDeep dispatches on declaration predicates, not meta-facts) matches the table's actual content.
- `mutations.js:69-89` REVISE path creates new element id + `superseded(new_id, args.supersedes)` metaFact. **CONFIRMED.** Translator runs first; supersession link appended.
- `schema.test.js:29` has a four-field PROPOSITION fixture for the closed-enum test. **CONFIRMED.** Will need `reasoning_chain` added.
- `translation.test.js:15` has a four-field PROPOSITION fixture. **CONFIRMED.** Will need `reasoning_chain` added.
- `__tests__/concern-schema.test.js` exists as a dedicated per-category test file with layered describe blocks; serves as the cited precedent. **CONFIRMED at lines 1-280.**
- `domain-bridge.js` `validPredicates` lists at lines 47-50 and 196-199 use `getDeclaredEDBPredicates()` plus a hardcoded set of rule-head predicates. **CONFIRMED.** The spec's footnote dismissing the Explorer's duplicate-list concern is accurate; new EDB predicates flow in automatically once `EDB_PREDICATES` is extended.

## Findings

### MEDIUM-1 (FIXED in spec-01): `bridge-integration.test.js:103` is a comment, not a fixture

**Spec previously said:** "the Explorer named `bridge-integration.test.js:103` as carrying the four-field PROPOSITION required-field comment" and listed the file under fixture-repair targets.

**Code shows:** Line 103 is `//   PROPOSITION → ['statement','grounding','collapse_test','inference_pattern']` — a documentation comment. The file's eight-verb sweep at lines 114-119 covers EVIDENCE/FRICTION but does not construct any PROPOSITION arg object.

**Fix applied in spec-01:** The Components section bullet for `bridge-integration.test.js` was reframed to specify a comment-only update (no object-literal fixture repair). AC-8.1's grep heuristic clarified that comment matches are acceptable.

### MEDIUM-2 (FIXED in spec-01): AC-6.1 "compounds the exposure" framing imprecise

**Spec previously said:** Error Handling — "Growing PROPOSITION's required-field count from four to five compounds the exposure."

**Code shows:** `verifyArgsShape` throws on the first missing required field (`schema.js:99-101`). The throw fires today on `field: 'statement'` when ratify-shape args (`{elementId, idShape}`) are passed; adding `reasoning_chain` does not change whether the throw fires.

**Fix applied in spec-01:** Error Handling section reframed — the exposure is binary (throws / doesn't), not graduated. Added explicit reference to the parallel `concern-schema.test.js:266-279` known-issue documentation and a cross-impact note about CONCERN/DEFINITION/RESOLUTION simultaneously benefiting from any fix.

### LOW-1: `concern-schema.test.js:266-279` documents a parallel ratify bug

**Code shows:** `concern-schema.test.js:266-279` carries a test "AC-3.1 surface coverage: ratifyConcern is exported (latent SHAPE_INVALID — see Known Issues)" that documents the same class of bug on CONCERN. The test asserts `expect(captured.code).toBe('SHAPE_INVALID')`.

**Impact:** Any fix to the AC-6.1 ratify-path mechanism will affect CONCERN, DEFINITION, RESOLUTION, and PROPOSITION simultaneously. If the fix lands, the CONCERN test's assertion will start failing and must be inverted (or the test moved/removed).

**Resolution:** Noted in spec-01's Error Handling section under "Cross-impact note." Plan-build / execute-write should anticipate the concurrent cleanup.

### LOW-2 (FIXED in spec-01 — upgraded for correctness): AC-3.4 "warning" mechanism doesn't exist

**Spec previously said:** AC-3.4 — "no boot-validator warning or error related to unknown EDB predicates" and "no warning is emitted to whatever capture mechanism boot-validators use."

**Code shows:** `domain-bridge.js:53` calls `validateOperationSpecs(...)` which **throws** (`DomainBootError`) on unknown predicates. There is no documented "warning" path.

**Fix applied in spec-01:** AC-3.4 reworded to assert throw-absence rather than warning-absence. The observable mechanism (`createDomainBridge` does not throw `DomainBootError`) replaces the unimplementable "no warning emitted to whatever capture mechanism" framing. Upgraded from LOW to a fix-worthy gap because the AC was unimplementable as written.

## Risk Assessment

The spec's code claims are largely accurate. All cited file paths, line ranges, identifier names, and API contracts match the actual source within reasonable line-drift tolerance. The two MEDIUM findings were framing issues, not factual contract errors — both have been fixed inline in spec-01 without requiring architectural change. The one upgraded LOW (AC-3.4 warning mechanism) was a correctness gap in the AC's observable mechanism and was fixed in the same pass. The remaining LOW (CONCERN parallel ratify bug) is context for plan-build, captured in the spec's cross-impact note. No HIGH findings: the architectural shape of the change (schema → translator → EDB → projection → render) lines up with the codebase's actual structure, the `nonEmptyStringFields` directive slots cleanly into `verifyArgsShape`'s existing loop, and the REVISE supersession model behaves as Data Flow describes. The spec is ready for the user review gate.

**Re-review status:** Per skill rules, MEDIUM fixes do not require ground-truth re-review unless substantial. The fixes here are textual/framing changes that do not alter the spec's architectural claims or contract surface — no re-review needed.

<!-- created-at: 2026-05-17T01:37:22Z -->
<!-- produced-by design-specify@v0003 -->
