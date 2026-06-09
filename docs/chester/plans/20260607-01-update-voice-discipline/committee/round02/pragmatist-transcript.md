# Pragmatist Transcript — Round 02

**Member:** Pragmatist
**Round:** 02
**Question:** Is plan-00 sufficient for the size of this voice-discipline refactor — where is it under-scoped, structurally weak, or missing tasks?

---

## Analysis

### Starting position: weigh cost, not correctness in the abstract

The Pragmatist lens asks: what is the cheapest path that gets an implementer across the finish line without stepping on a landmine? Plan-00 has 10 tasks, 27 files, and the threat report in hand. The question is whether the gap between plan and threat report is bridgeable by a competent implementer at task-execution time, or whether it requires rework before execution starts.

Three HIGH findings are effectively absent from the plan's executable steps. I'll price each one.

---

### F1 — `$tmpl_abs` unbound variable in Task 2 Step 3 code block

**Cost to fix:** one line. The threat report names the exact fix: add `local tmpl_abs="$CHESTER_ROOT/$tmpl"` inside the `emit_catalog` function body, before the awk call. The variable `tmpl` is already assigned; only the `_abs` resolution is missing.

**Can an implementer absorb this?** Yes, barely. The threat report text (F1) gives the fix in plain prose. A competent bash developer reading the threat report before Task 2 will catch it. But the plan's code block will fail under `set -u` as written — if the implementer runs Step 4's test without reading the threat report, they get a crash and must diagnose it themselves.

**Pragmatist verdict:** This is a targeted amendment to the Task 2 Step 3 code block. One line added. No structural rework. The cost of NOT fixing it in the plan is one wasted debug cycle per implementer who doesn't read the threat report first. Fix it — the price is trivial.

---

### F3 — `fail()` function missing in `test-partner-role-discipline.sh` (Tasks 5 and 10)

**Cost to fix:** one refactor decision, two touch points. The test uses `set -e` + inline `|| { echo …; exit 1; }` convention. The plan's new assertions in Tasks 5 and 10 call `fail "..."` — an undefined command that makes the test fail to run entirely, not fail a specific assertion.

**Two fix paths:**
- **Path A (cheaper):** Convert the new assertions in Tasks 5 and 10 to the existing inline pattern. Zero new convention introduced. Change is local to the two steps that add assertions. Cost: rewrite two `fail "..."` lines in each task's Step 1 code block.
- **Path B (more thorough):** Add a `fail()` accumulator to `test-partner-role-discipline.sh` at the start of Task 5 (or a Task 0 micro-step), refactoring the test's convention. Cost: touches more of the existing test, introduces a minor convention migration. Risk: existing inline patterns and new `fail()` pattern coexist awkwardly unless all are migrated.

**Pragmatist verdict:** Path A. The test has an established convention; don't change it mid-task. Fix the two code blocks in Tasks 5 and 10 Step 1 to use `|| fail "..."` → `|| { echo "FAIL: …" >&2; exit 1; }`. This is a targeted amendment to two step code blocks. Cost: minimal.

---

### F2 — Placeholder substitution mechanism missing (member scaffold + generator)

**Cost to fix:** this is NOT a one-line fix. This is a structural gap that cuts across three tasks (T1 generator core, T3 member sources, T7 manifest wiring) and invalidates a core assumption.

**What the plan currently assumes:** member-scaffold.md holds shared bands verbatim; lens files hold lens-specific content; concatenation produces the correct file. The generator has no substitution step.

**What reality requires (per researcher ground truth):** The lens name is embedded in Phase Contract labels, Hard Prohibition items 2-4, Output-Format template headers, and Stance bullet elaborations throughout the "shared" bands. These are not trivially separable. The fix is a `{{Lens}}`/`{{lens}}` placeholder pass in the generator, plus restructuring what goes in member-scaffold.md vs lens files, plus moving the lens-adapted Stance bullets into lens files (dropping the Stance extraction fragment for members).

**Impact surface:**
- T1: generator gains a substitution pass — code change to `chester-generate-agents.sh`, adds ~10-15 lines of logic, new `apply_placeholders()` function or awk pass.
- T3: member-scaffold.md carries placeholders not verbatim text; Step 1 and Step 2 guidance is factually wrong as written (Step 2 instructs using conservator as the donor and confirming identical text — but the text is NOT identical across lenses).
- T7: manifest wiring for members must drop the `util-design-partner-role` Stance extraction fragment; lens files carry Stance bullets instead. The current manifest JSON in Step 1 is wrong.
- Test in T1: the fixture test still passes because it uses simple fixture text, not real member content. The AC-8.1 gate in T7 Step 3 (`git diff` → only header + enumerated convergences) would FAIL because placeholder substitution is absent → the regenerated files will differ from committed files in all lens-name embedded locations.

**Can an implementer absorb this?** No. The plan tells the implementer to do something (verbatim seeding via concatenation) that is mechanically guaranteed to fail the T7 AC-8.1 gate. An implementer following the plan faithfully will produce 4 member agent files that differ from the committed versions in every lens-name occurrence, then face an unexplained diff that the plan says should contain only a header comment and one evidence-wording convergence. Without the threat report explicitly in hand AND a clear understanding of the fix, the implementer is blocked or produces silent semantic regression.

**Rewrite vs amendment?** This requires three targeted task amendments — not a plan rewrite. The plan's 10-task structure is sound; the generator-core task needs one new substep (placeholder pass), member-sources task needs corrected Step 1/2 guidance, and manifest-wiring task needs corrected fragment definition for members. The amendment is significant (estimated 200-300 words of revised guidance across 3 tasks, plus ~15 lines of added code) but it fits within the plan's existing skeleton.

**Pragmatist verdict:** F2 is blocking. It cannot be absorbed at implementation time without the plan's explicit correction. The amendment is substantive but not structural — don't rewrite the plan, amend the three affected tasks.

---

### Prose-only tasks: where does it hurt vs where is it fine?

The researcher identifies 6 of 10 tasks as prose-only or code-for-tests-only. Let me price each.

**T3 (member canonical sources) — prose-only, HURTS because of F2.** Step 1 and Step 2 guidance is factually wrong. An implementer following it will mis-split the content. This is the one place where prose-only guidance is actively dangerous, not just underspecified.

**T4 (reviewer canonical sources) — prose-only, FINE.** The researcher confirms the derived discipline map (who has what) is correctly stated and cited by line number. The task asks the implementer to read existing files and move content per a specified map. The map is ground-truth verified. A text-relocation task with a verified map does not need code blocks — the only executable gate is the T7 regeneration diff. Prose guidance is sufficient here.

**T5 and T10 (voice-rule canonical homes and orphan dedup) — test code blocks present, FINE modulo F3.** The test assertion code is the executable gate. The prose describes what to edit; the test verifies it. This is appropriate for authoring tasks. Fix F3 in the code blocks and T5/T10 are shippable.

**T6 (catalog template) — prose-only, FINE.** Copy-and-mark-slot-in-template is a one-pass authoring operation. The T2 test verifies the slot behavior. No code block needed here.

**T7 (manifest wiring + first regeneration) — prose-only for manifest, HURTS because of F2.** The manifest fragment definition for members is wrong (includes Stance extraction fragment that must be dropped per F2). The AC-8.1 gate in Step 3 is the executable enforcer, but it will fail in a way the implementer cannot resolve without understanding F2. Fix F2's task amendments and T7's manifest guidance becomes correct.

**T9 (CLAUDE.md dedup) — test code block present, FINE.** The test assertions are clear and cover the required observable states. Prose describes what to edit; the test verifies it.

**Summary of prose-only pain:** Only T3 and T7 are dangerous in their current prose form, and both are dangerous for the same reason — F2. Fix F2's amendments and prose-only is appropriate for T4, T5, T6, T9, T10.

---

### Is "complete code in plan" being violated where it matters?

The spec's execution mode is subagent. Subagent mode means a fresh implementer per task who reads the plan task cold. The standard for code completeness should be: does the code block, if copy-pasted, work? Or is it a template requiring thought to complete?

- T1 code blocks: copy-pasteable and complete. Fine.
- T2 code block: copy-pasteable but crashes under `set -u` (F1). NOT fine. One line fix.
- T5/T10 test additions: use `fail "..."` that doesn't exist in the target test. NOT fine. Two line-pattern fixes.
- T7 manifest JSON: prose description only, no JSON block. For a subagent, the manifest is a config file they must author from scratch given prose guidance. Given the incorrectness of the Stance extraction fragment reference, this is not fine — but the fix is to correct the prose description, not add a full JSON block.

The pattern is: code bugs in the code blocks that exist (F1, F3) are more dangerous than missing code blocks for authoring tasks (T7 manifest). A subagent can author JSON from correct prose; a subagent cannot debug a `set -u` crash from incorrect code.

---

### F4 and F5: worth addressing?

**F4 (second confidence-ladder convergence, MEDIUM):** The plan's AC-8.1 enumerates one deliberate convergence (evidence-wording). The confidence-ladder wording also drifts between spec-reviewer and quality-reviewer. When `review-discipline.md` is authored with a canonical `## Confidence ladder` section, the wording will be forced to converge. This IS a second convergence that AC-8.1 requires to be explicitly enumerated. Cost: one sentence added to T4 Step 2 and one line added to the AC-8.1 enumeration in the plan. Cheap. Worth it — AC-8.1 is a spec constraint.

**F5 (skill-index grouping vs frontmatter generation, MEDIUM):** The current index groups skills by role; role is not in frontmatter; generated list is flat-alphabetical. The catalog template (T6) has a `<!-- CATALOG_SLOT -->` marker but the generated content is a flat list. The grouped headers in the template won't get skill entries; the flat list won't be grouped. The spec says "preserving the hand-authored priority/grouping/dispatch sections" (AC-4.1). The T2 test does NOT assert grouping. This is a genuine design collision that the spec says is resolved via the template + slot approach — but the slot approach only works if the slot replaces the entire skill list AND the template's group headers are either retained as-is (decorative) or the slot emits grouped content. As implemented, the slot replaces a flat list — the group headers in the template become orphaned headers with no entries under them. This requires a designer decision on option (a), (b), or (c) from the threat report. The plan cannot proceed to T6/T7 without one.

**Pragmatist verdict on F5:** This is not a gold-plating concern — it's an ambiguity that will cause the implementer to make a default choice (likely flat list, losing grouping) that may not match the designer's intent. The cheapest resolution is to make option (a) explicit: flat alphabetical list; group headers removed from the template; Priority and Dispatch sections retained. One sentence of decision text in T6 Step 1. The price of not deciding is implementer drift.

---

### Minimum set of plan changes that makes this shippable

Ordered by impact:

1. **T2 Step 3 code block:** Add `local tmpl_abs="$CHESTER_ROOT/$tmpl"` before the awk call (F1 fix). One line.

2. **T5 Step 1 and T10 Step 1:** Replace `fail "..."` calls with inline `|| { echo "FAIL: …" >&2; exit 1; }` pattern matching the existing test convention (F3 fix). Two code block edits.

3. **T1 new substep:** Add a `substitute_placeholders()` function or awk pass to the generator that replaces `{{Lens}}` with the per-member lens name token. The manifest entry for each member adds a `"lens": "Conservator"` (etc.) field. This is ~15 lines of bash added to the generator implementation. (F2 fix, part 1.)

4. **T3 Step 1 and Step 2:** Correct the guidance. Step 1 must identify that items 2-4 of Hard Prohibitions and Stance bullet elaborations are lens-woven and belong in lens files, not scaffold. Step 2 must instruct using `{{Lens}}`/`{{lens}}` placeholders for the lens-name occurrences in scaffold bands. Drop the conservator-as-donor verbatim-identical confirmation (the bands are NOT identical). (F2 fix, part 2.)

5. **T7 Step 1 manifest guidance:** Remove the Stance extraction fragment from members' fragment list. Members' lens files carry lens-adapted Stance bullets directly. The manifest entry for members becomes: `["agents/sources/member-scaffold.md", "agents/sources/lens-<lens>.md"]` — no `util-design-partner-role` Stance extraction. (F2 fix, part 3.)

6. **T4 Step 2:** Add a sentence enumerating the second deliberate convergence (confidence-ladder wording between spec-reviewer and quality-reviewer). Add this to the AC-8.1 enumeration list. (F4 fix.)

7. **T6 Step 1:** Add one sentence deciding F5: flat alphabetical list with no role grouping; remove group headers from the template; retain Priority and Dispatch sections. (F5 fix.)

These 7 amendments span existing tasks. No new tasks needed. No plan skeleton changes. Estimated total: 300-400 words of amended plan text plus ~15 lines of new code in T1. This is targeted amendment territory, not rewrite territory.

---

## Peer DMs

*Sent to conservator and innovator via caveman ultra.*

**To conservator:** "F2 fix scope — real or gold plate? Generator needs placeholder sub pass. 15 bash lines. T3 and T7 guidance wrong as written. AC-8.1 gate fails without fix. Implementer blocked, not slowed. Real." + "T4 and T9 prose-only fine — verified map, test gates work. Reviewer structure question: plan says derived map preserved. Ground truth confirms. No structural risk there. Concur?"

**To innovator:** "F5 designer decision — flat list vs grouped. Flat is cheapest. Current template approach produces orphaned group headers. Is there a re-framing that makes the slot approach preserve grouping without a manifest category map? If not, flat is the right default." + "F2 placeholder mechanism — lens files carry Stance bullets directly rather than scaffold extracting from util-design-partner-role. Does this re-framing of where Stance lives open new composition risk, or does it close one?"

**To purist:** "AC-8.1 boundary question — F4 second convergence is real and unenumerated. One sentence fixes it. But does adding `## Confidence ladder` to review-discipline.md constitute adding a discipline to reviewers that don't carry it? Plan-build-plan-attacker has NO confidence ladder. If review-discipline.md is a single file spliced by section, only the applicable sections get included per reviewer. Is the discipline-map correct as spec-cited, or does the shared-file approach create a structural risk of inadvertent full-file inclusion?" + "Stance bullets in lens files vs scaffold — purist call: does moving lens-adapted Stance bullets fully into lens files destroy the single-source-of-truth property for Stance, or is it acceptable because util-design-partner-role still holds the generic version and lens files hold the adaptation?"

---

## Final Position

**position:** Plan-00 is shippable with 7 targeted task amendments. Do not rewrite.

**rationale:** The three HIGH findings are real risks but bounded in fix scope. F1 is one line. F3 is two code-block pattern corrections. F2 is the only substantive fix — 15 bash lines plus corrected guidance in T3 and T7 — but it fits within the existing task skeleton. Prose-only tasks hurt only where F2 corrupts the guidance (T3, T7); T4, T5, T6, T9, T10 prose-only is appropriate for authoring tasks with test gates. The T7 AC-8.1 regeneration diff is the strongest implementer gate in the plan; that gate works correctly once F2's mechanism is present. Adding F4's enumeration and F5's grouping decision costs two sentences each and prevents implementer drift on real ambiguities. Total amendment cost is low; total risk of skipping is a blocked implementer at T7 with a diff they cannot explain.

**blocking_risk:** F2 unaddressed = hard block at T7 Step 3. F1 unaddressed = crash at T2 Step 4. F3 unaddressed = test suite unrunnable at T5 Step 4. All three are execution-time blockers, not quality concerns.
