# Conservator Transcript — Round 02

**Member:** Conservator
**Round:** 02
**Question:** Is plan-00 sufficient for the size of the voice-discipline refactor — where is it under-scoped, structurally weak, or missing tasks?

---

## Opening Position

Plan-00 is a well-structured 10-task plan for a 27-file refactor. The sequencing is sound: generator core (T1) → catalog mode (T2) → canonical sources (T3-T6) → integration + regeneration (T7) → verify test (T8) → authoring edits (T9-T10). The dependency chain is explicit and correct. Four tasks carry complete code blocks. The test-first rhythm is honored throughout. This is a plan worth defending, not discarding.

What the researcher has established — and I will not minimize — is that 3 HIGH threat findings have no corresponding fix-tasks in the executable steps. The question before the committee is: does this constitute structural failure requiring a rewrite, or targeted inadequacy requiring amendments?

My position: **targeted amendments, not structural rewrite.**

---

## What Plan-00 Already Covers Correctly

**T1 (generator core) is well-specified.** The code blocks are complete, the TDD rhythm is enforced, and the section-extraction mechanism (`extract_section` using awk against `## heading`) was verified correct by the threat report's "verified correct" section. This task does NOT need a rewrite — it needs an addendum for the F2 placeholder substitution pass. The substitution mechanism is a **step addition to T1**, not a T1 rewrite: the fragment assembly logic stands; a `sed`/parameter-substitution pass runs after assembly.

**T4 (reviewer canonical sources) is the most precisely spec'd content task.** The discipline map is documented with exact line citations: evidence standard in attacker (`:72-78,95`) and smeller (`:62-69`), confidence ladder in spec-reviewer (`:64-73`) and quality-reviewer (`:68-77`), independence in attacker, plan-reviewer (`:51`), and spec-reviewer (`:18-31`). The irregular distribution is correctly called out with the directive to NOT add/remove disciplines uniformly. Task 4 Step 1 repeats this map verbatim from the spec. This task is sound.

**T8 (verify test) is complete and correct.** The code block handles both staleness detection and manifest-completeness, with the CLAUDE.md and exclusion-list edge cases handled. The staleness probe in Step 3 (append drift, verify FAIL, revert) is good adversarial verification. This task needs no amendment.

**T9 (CLAUDE.md dedup) is complete.** Code blocks for the test, prose for the two edits, correct grep sentinels. The phantom pointer fix is precise (`:86` diagnosis confirmed by threat report). No amendment needed.

**T10 (drop orphan duplicates) is correct in structure.** The line citations for both consumer files are accurate. The sentinel phrase approach for the test assertion is sound. The one issue — `fail()` undefined in `test-partner-role-discipline.sh` — is F3, and it IS a real bug.

---

## Where Under-Scoping Is Real (Not Overstated)

**F2 is the most consequential gap.** The researcher confirms it is absent from all 10 tasks. The fix the threat report specifies has three parts: (1) add `{{Lens}}`/`{{lens}}` placeholder substitution pass to `chester-generate-agents.sh` (code change to T1), (2) restructure `member-scaffold.md` to carry placeholders instead of lens-woven text (content change to T3), (3) relocate lens-adapted Stance bullets from the scaffold to each `lens-{}.md` file and DROP the `util-design-partner-role` Stance extraction fragment from the manifest (change to T3 + T7). These are real, necessary changes — but they are amendments to T1, T3, and T7, not a new parallel task. The task structure remains valid; the steps within those tasks are wrong.

Specifically:
- T1 Step 3: the generator implementation code block is missing the substitution pass. The manifest needs a `lens_token` field per member entry. The `emit_agent()` function needs a `sed "s/{{Lens}}/$lens_token/g; s/{{lens}}/${lens_token,,}/g"` pipe after fragment assembly.
- T3 Step 1: wrong — the step says Stance bullets are NOT copied to the scaffold and are extracted at generation time from `util-design-partner-role`. Per F2, this is incorrect: Stance bullets are lens-adapted and must move to each `lens-{}.md`. The step needs correction.
- T3 Step 2: the convergence note about "fifth Hard-Prohibition item" is wrong (F7) — items 2-4 differ, not item 5.
- T7 Step 1: the manifest fragment definition `{"file":"skills/util-design-partner-role/SKILL.md","section":"Stance Principles (carry into every turn)"}` for members is invalid per F2 fix — must be removed from the member entries.

**F1 is a real code bug** but is trivially bounded. The `$tmpl_abs` assignment is missing from the T2 Step 3 code block. The fix is one line: `local tmpl_abs="$CHESTER_ROOT/$tmpl"` inside `emit_catalog()` before the awk call. The threat report gives the fix in prose. The plan should incorporate this as a corrected code block in T2 Step 3.

**F3 is a real test bug** but equally bounded. Tasks 5 and 10 add `fail "..."` calls to a test file that has no `fail()` function. The fix: either add `fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS+1)); }` and `ERRORS=0` at the top of `test-partner-role-discipline.sh`, or convert the new assertions to the inline `|| { echo "FAIL: ..."; exit 1; }` pattern the file already uses. This is an amendment to T5 Step 1 and T10 Step 1, not a new task.

---

## Where the "Insufficient" Doubt Is Overstated

**F4 (second confidence-ladder convergence) is medium-priority, not structural.** The spec says AC-8.1 requires every deliberate convergence to be enumerated. The `review-discipline.md` canonical Confidence Ladder section will force one wording. The fix is documentation: add a second bullet to the AC-8.1 enumeration noting this wording convergence. This requires an amendment to T4 Step 2's guidance (enumerate before accepting) and a one-line note in the plan — it does NOT require a new task.

**F5 (skill-index grouping) is a designer decision, not a plan failure.** The threat report correctly identifies three options and requires a designer decision. Plan-00 proceeded without recording one. However: the grouping question does not invalidate T2, T6, or T7 — it affects the content of `catalog-template.md`. Option (a) (flat alphabetical, drop role-grouping) requires the least change; option (c) (hand-maintained per-group headers in template) requires the most but is closest to what the current skill-index has. The conservator position: the plan should record a designer decision in T6 Step 1 (before authoring the template). This is an amendment, not a new task.

**F6 (leading-blank extraction) is a one-line fix** — strip leading blank lines in `extract_section`. The threat report calls it MEDIUM; the fix is a single `sed '/./,$!d'` pass or an awk guard. Add it to T1 Step 3's code block for `extract_section`. Bounded.

**F7 and F8 are LOW** — text corrections to task guidance, no code impact.

---

## Structural Verdict

The 10-task structure is salvageable. No task is entirely wrong. The dependency chain (T1→T2→T3-T6→T7→T8→T9→T10) is correct. The integration point (T7) correctly identifies itself and the "Step 3: verify meaning preserved" gate is AC-8.1's mechanical enforcement.

The plan's actual inadequacy is that it was finalized before incorporating the threat report's findings into executable steps. The threat report provides fixes in prose; the plan's code blocks do not reflect them. An implementer following the plan's code blocks verbatim would produce a broken generator (F1 crash), a broken member-file reproduction (F2 mechanism missing), and a broken test extension (F3 undefined function).

**These are amendment targets, not rewrite triggers.** The needed changes are:
1. T1 Step 3: add placeholder substitution logic to `emit_agent()` + `lens_token` manifest field
2. T2 Step 3: add `local tmpl_abs=...` assignment (one line)
3. T3 Steps 1-2: correct the shared-band identification and Stance bullet relocation
4. T5 Step 1 + T10 Step 1: fix `fail()` convention mismatch
5. T7 Step 1: remove Stance extraction fragment from member entries; note F4 second convergence

A rewrite risks losing what the plan has right: the TDD rhythm, the precise discipline-map in T4, the complete code blocks in T1/T2/T8, the per-step test runs, and the AC-by-task traceability. None of that should be discarded.

---

## Peer Challenges

To **Innovator**: resist the pull to propose structural reorganization (split T7, add a T11 "F2-fix task") when amendments to existing tasks suffice. A new task for placeholder substitution adds coordination surface without isolation benefit — the substitution mechanism belongs in the generator (T1), where the fragment assembly already lives. Does your position endorse splitting tasks that the dependency chain already handles, or do you accept that the F2 fix is an in-task amendment?

To **Pragmatist**: F5 (grouping decision) is MEDIUM risk. The pragmatist lens should weigh the cost of the designer decision now vs. the cost of implementing without one. Option (a) (flat alphabetical) is the cheapest implementation — is that your recommendation, or do you argue the template-based approach (option c) is worth the one-time complexity? Name the cost.

To **Purist**: the F2 fix requires the Stance bullets to move from `util-design-partner-role`'s section (where they currently have a canonical home) to the lens files. This is a boundary change — Stance Principles have lived in `util-design-partner-role` and been extracted. Do you consider the boundary "lens-adapted Stance bullets live in lens files, canonical Stance Principles remain in util-design-partner-role" to be a clean composition? Or does this split violate the single-source principle that the refactor is meant to enforce?

---

## Final Position

**position:** Plan-00's 10-task structure is sound and salvageable. The sequencing, dependency chain, and task-to-AC traceability are correct. The plan requires targeted amendments — not a structural rewrite — to incorporate the 3 HIGH threat-finding fixes (F1 tmpl_abs, F2 placeholder mechanism + Stance bullet relocation, F3 fail() convention) and the 2 MEDIUM items (F4 convergence enumeration, F5 designer decision on grouping). All amendments are in-task edits to T1, T2, T3, T5, T7, and T10.

**rationale:** Four tasks (T1, T2, T8, partial T9) carry complete, verified code blocks. T4's discipline map is precisely cited. The TDD rhythm and AC traceability are correct throughout. Discarding this structure risks losing disciplined test-first sequencing and the precise reviewer discipline map. The HIGH findings are real bugs in specific code blocks and step descriptions — they are bounded to the implementation steps they affect, not the task architecture.

**blocking_risk:** MODERATE. If the amendments are not incorporated before execution begins, T1 produces a generator missing the substitution mechanism (F2), T2 produces a generator with a crash-on-invocation bug (F1), and T5/T10 produce test extensions that fail to run (F3). These are implementation failures, not design failures. The plan must be amended before handoff to execute-write.

<!-- created-at: 2026-06-07 -->
<!-- produced-by: design-committee-conservator, round 02 -->
