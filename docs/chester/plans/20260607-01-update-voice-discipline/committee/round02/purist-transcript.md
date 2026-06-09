# Purist — transcript — round02
# Stance: The plan's canonical-partition decomposition is structurally dirty in three places; F2 has no fix task; the verify gate cannot hold

---

## Question

Is plan-00 sufficient for the size of the voice-discipline refactor — where is it under-scoped, structurally weak, or missing tasks?

---

## Analysis

### 1. The scaffold/lens partition is not clean — and the plan's Task 3 does not know this

Task 3's Step 1 states the shared bands are: Phase-Contract shared text, Hard Prohibitions list, Output-Format preamble, peer-DM caveman-ultra rule, C1/C2 meta, and the member-facing Translation-Gate band. Stance Principles are "extracted at generation time from util-design-partner-role."

The researcher's ground truth (Section 2a) proves this partition is false along three axes:

**Phase Contract — lens name woven in, not shared.** Every Phase Contract section embeds the lens name inline: "Produce one Committee response: position on question from **Conservator** lens." The four member files differ at this line — conservator, innovator, pragmatist, purist each have their own name there. Task 3 Step 2 says "copy the shared-band text verbatim from the current member files (use conservator as the donor; confirm the other three are identical for each band)." This will fail the confirm step for Phase Contract — but the task has no branching logic for that failure. The implementer gets no instruction on what to do when the bands do not match.

**Hard Prohibitions items 2-4 — lens-adapted, not shared.** The researcher confirms items 2-4 vary per lens. Item 2 differs meaningfully across all four (conservator names Researcher dispatch; innovator drops that; pragmatist adds "e.g. real cost data from codebase"; purist says "defend boundary claim"). Items 3 and 4 each have a conservator-specific trailing clause ("Team-lead does." / "Designer does.") absent from the other three. Task 3 Step 2 says to "pick the conservator wording and record the choice as an AC-8.1 enumerated convergence in the plan-threat notes" for the fifth Hard Prohibition item — but item 5 is the one that IS identical. Items 2-4 are the ones that differ. Task 3's guidance is wrong (F7 confirms this), but more critically: Task 3 has no step for handling items 2-4 correctly. A correct implementation cannot follow Task 3 as written without catching this failure in the "confirm the other three are identical" check.

**Output-Format template labels and Stance bullets — lens-adapted throughout.** Every Output-Format template header embeds the lens name (`**Conservator — response**`, `**Innovator — R1 proposal**`, etc.). The Stance Principles in `util-design-partner-role/SKILL.md:162-169` are the generic five-line version; each member file expands every bullet with a lens-specific second sentence. Extracting the generic section drops the adaptation — a semantic change in violation of AC-8.1. Task 3 says to extract Stance from util-design-partner-role as a `{file, section}` fragment. Task 7's manifest wiring for members lists exactly this: `{"file":"skills/util-design-partner-role/SKILL.md","section":"Stance Principles (carry into every turn)"}`. This fragment will produce the five generic bullets. The lens-adapted elaboration sentences are lost. This is not a minor trim — "Pragmatist leans hardest here. Every recommendation names cost saved + cost incurred" and "Purist leans hardest here, opposite direction from Innovator" are load-bearing lens differentiation.

The threat report (F2) states exactly this finding and directs: "add a {{Lens}}/{{lens}} placeholder pass to the generator; member-scaffold.md carries shared-structural bands with placeholders; lens-{}.md carries all lens-unique prose INCLUDING the lens-adapted Stance bullets; DROP the util-design-partner-role Stance extraction fragment for members. Update spec AC-2.1/AC-8.1 and plan Tasks 1, 3, 7."

**No task in plan-00 implements any part of this fix.** The placeholder substitution mechanism does not exist in Task 1 or anywhere. The instruction to move lens-adapted Stance bullets to lens files is in the threat report prose but not in any task step. Task 7's manifest still references the Stance extraction fragment. F2 is a HIGH finding with a known fix that touches three tasks — and plan-00 has zero tasks for it.

### 2. The review-discipline partition IS structurally clean — but F4 creates an unenumerated convergence

Task 4's derived reviewer map correctly matches the ground-truth distribution (researcher Section 2b confirms the per-reviewer discipline map at cited lines). The partition logic for reviewers — irregular distribution preserved, no discipline added or removed — is sound.

The failure is AC-8.1 scoping. Task 4 creates `review-discipline.md` with a `## Confidence ladder` section. The confidence-ladder wording drifts between spec-reviewer (:68: "Verified real issue that impacts spec compliance") and quality-reviewer (:71: "High confidence — verified against code, will impact functionality or quality"). Making both pull from a single canonical `## Confidence ladder` section forces a second convergence — the wording must resolve to one phrasing. AC-8.1 requires every deliberate convergence to be explicitly enumerated before acceptance. The plan's AC-8.1 text enumerates exactly one convergence: reviewer evidence-citation wording. The confidence-ladder wording convergence is not enumerated. When the implementer reaches Task 4 Step 2 and authors `review-discipline.md`, they will write one phrasing for the ladder's 80-100 band. That choice is a semantic decision with no documented authorization. The verify gate in Task 7 Step 3 says: "If a fourth diff item is genuinely intended (a new deliberate convergence), enumerate it in the plan-threat notes and confirm with the designer BEFORE accepting it." But Task 4 does not name this as a fourth diff item requiring designer confirmation — the implementer has no signal that the ladder wording convergence needs approval.

This is not a blocking gap alone, but it means AC-8.1's "every convergence explicitly enumerated" contract is violated before the first regeneration runs.

### 3. The verify test's "no semantic change" gate cannot hold under F2

AC-8.1's observable boundary: "After the first authoritative generation, each generated agent file is semantically equivalent to its pre-refactor committed form." Task 7 Step 3 gates on this by doing `git diff agents/` and accepting only: (a) fixed header comment, (b) the one enumerated evidence-wording convergence, (c) three newly-present skills in the index.

If the Stance Principles extraction produces five generic bullets where each member file currently has five-bullet-plus-lens-elaboration, then `git diff` will show the elaboration sentences missing from all four member files. That is not one of the three accepted diff categories. The gate will fail — but the task has no branching path for "gate fails because F2 is unimplemented." The only guidance is "fix the source/manifest and regenerate." But fixing this at Task 7 time means adding the placeholder mechanism mid-task — which requires changes to the generator (Task 1), the scaffold file (Task 3), and the lens files (Task 3) — reversing already-committed work across three earlier tasks.

The correct structural order is: placeholder mechanism exists in the generator BEFORE any member source files are authored. The plan's task sequencing (T1 generator core → T3 member sources → T7 manifest + regeneration) could accommodate this if T1 included the placeholder step. It does not. The gap surfaces at T7, not T1, which means late discovery of a mechanism that should have been foundational.

### 4. F1 and F3 are executable bugs with no fix tasks — they will crash the implementer

**F1** (`$tmpl_abs` unbound): Task 2 Step 3's `emit_catalog` code block uses `"$tmpl_abs"` in the awk call, assigns `tmpl` from jq, but never assigns `tmpl_abs`. Under `set -u`, the shell crashes with "unbound variable" the moment catalog mode runs. The threat report says "put `local tmpl_abs="$CHESTER_ROOT/$tmpl"` inside the Task 2 Step 3 code block." That fix is in the threat report prose only — not in any corrected code block in the plan. The implementer copying the code block verbatim gets a guaranteed crash.

**F3** (`fail()` undefined in test-partner-role-discipline.sh): Task 5 Step 1 adds `fail "PM Litmus Test section missing"` assertions to `tests/test-partner-role-discipline.sh`. That test file uses `set -e` + inline `|| { echo ...; exit 1; }` — no `fail()` function. Calling `fail` as a command will itself cause `set -e` to exit immediately (command not found). The test cannot run. Task 10 Step 1 adds more `fail "..."` calls to the same file. Both tasks will produce broken tests. The threat report names this (F3 HIGH) and names the fix: "use the inline pattern in those assertions (or refactor that test to the fail() accumulator convention)." No task implements either branch of this fix.

These two bugs are not edge cases — they are guaranteed crashes on first execution. A plan that requires reading the threat report to produce working code is not an executable plan.

### 5. F5 has no designer decision — the plan proceeds past a live fork

The skill-index currently groups skills by role (Pipeline/Finish/Review/Behavioral/Utility). The catalog template (`catalog-template.md`) will preserve the role-group headers, but the generated list is a flat alphabetical block by name. The threat report names three options: (a) flat alphabetical, drop grouping; (b) add `category:` field to every SKILL.md frontmatter; (c) keep grouping hand-maintained in the template via per-group slots. No option was chosen. Task 6 creates the catalog template without resolving this. Task 2's test does NOT assert grouping preservation. The first generation will produce a flat alphabetical list inserted at `<!-- CATALOG_SLOT -->`, with the role-group section headers still present in the template but containing no skills — the skills are all in the flat block above the headers.

This is a visible rendering defect in the generated index, not an internal correctness issue. The designer has not been asked to decide. The plan made a de facto choice (flat alphabetical, since that is what the code produces) without naming it as a choice.

---

## Peer DMs

**Purist → Conservator:** The partition integrity question cuts to your core concern: if the scaffold/lens split is dirty (Phase Contract, Hard Prohibitions items 2-4, Stance bullets all lens-woven), then "shared bands" as a concept is not load-bearing. The existing structure of the member files does NOT decompose into a clean scaffold + per-lens slot — that is the design history telling us the current structure was NOT authored with this partition in mind. Does Conservator see the dirty partition as evidence the generator architecture is wrong for this content type, or as fixable via the placeholder mechanism?

**Purist → Pragmatist:** F1 and F3 are guaranteed runtime crashes in the plan's code blocks. A plan with two HIGH crashing bugs in its executable code, zero fix tasks for either, is not shippable as written. The implementer must rely on the threat report to produce working code — a split-source problem. What is the minimum delta to make plan-00 executable: fix the two code blocks in-place (amend Tasks 2 and 5), or does the F2 mechanism gap force a plan revision that would naturally roll those fixes in anyway?

---

## Final Position

position: "Plan-00 is not executable as written. Three structural gaps make it fail before or at the AC-8.1 gate: (1) F2 — no placeholder mechanism and no fix task; the member Stance extraction from util-design-partner-role drops lens-adapted elaboration, a semantic change that fails the verify gate; (2) F1 and F3 — guaranteed crash bugs in executable code blocks with no fix tasks; (3) F4 — unenumerated second convergence (confidence-ladder wording) violates AC-8.1's explicit-enumeration contract. F5 is a de facto designer decision made without the designer."

rationale: "The plan's Task 3 partition assumption — that shared bands are identical across member files and Stance can be extracted generically — is falsified by ground truth. The H-Prohibitions items 2-4 and all Output-Format labels are lens-adapted, not shared. Every Stance bullet has a lens-specific elaboration sentence. A generator producing the Task 7 manifest as written will produce four member files that are missing the Stance elaborations, with git diff showing deletions across all four members — failing the no-semantic-change gate. This is not a fix within T7; it requires the placeholder mechanism that should have been in T1. The plan must be amended to add this mechanism before any member source files are authored."

blocking_risk: "HIGH. Two paths to plan failure exist independently: (a) the F2 mechanism gap causes T7 verify to fail with semantic-change diffs that require undoing T1, T3, and T7 work; (b) F1 and F3 produce crashing code that fails before T7 is reached. Either path halts execution. Minimum required amendments: add placeholder substitution to T1, correct Task 3's partition guidance, fix T7 manifest fragment for members, fix T2 code block ($tmpl_abs), fix T5 and T10 test-assertion convention."
