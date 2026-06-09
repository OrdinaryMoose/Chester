# Innovator — transcript — round 02
# Question: Is plan-00 sufficient for the size of the voice-discipline refactor?

---

## Reading the researcher's ground truth

The researcher handed us five surface items with zero task coverage, three HIGH findings unaddressed in any executable step, and one structural hazard embedded inside T7's 11-file integration point. The question is not whether this plan is "done enough." The question is whether the decomposition shape itself is the problem.

I think it is.

---

## The shape problem

Plan-00 decomposes by generator-mechanic (T1, T2) then by content-source kind (T3 members, T4 reviewers), then by ancillary concerns (T5-T10). This is an authoring-driven split: write the generator, then write the sources, then wire everything up in T7.

F2 invalidates that split at the root. F2 says: the member "shared" bands carry per-lens text — Phase Contract, Hard Prohibitions items 2-4, Output-Format template labels, Stance Principle elaborations. The plan's split assumes those bands are cleanly separable. They are not. The result: T3 instructs an implementer to extract shared bands that are not shared, T7 wires a manifest fragment that pulls generic Stance bullets from `util-design-partner-role` to replace lens-adapted ones (semantic change), and the AC-8.1 diff gate — which is the entire meaning-preservation guarantee — fires a false negative.

The ordering converts a conceptual error (F2) into a cascading build failure: a developer who follows T3 faithfully will author a scaffold that is wrong; T7's regeneration will produce semantically changed member files; T8's verify test will not catch the semantic change because it tests for byte-identity against committed output (but the committed output in T7 will already embed the semantic error). The bug survives the gate.

---

## What a corrected decomposition looks like

The innovator reframe: **order by build-then-verify-per-concern, with a generator spike before source authoring.**

Concretely, the structural re-ordering I would press:

- **T1-spike: generator with substitution engine** — before any source authoring, build the generator end-to-end including the `{{Lens}}`/`{{lens}}` placeholder pass (F2 fix). Write the failing test first. The substitution mechanism must exist before the scaffold can be authored correctly, because the scaffold's content is defined by what the generator can substitute.

- **T2: member sources seeded WITH correct split** — once the substitution engine exists, the author knows what belongs in `member-scaffold.md` (structural bands with placeholders) vs `lens-{}.md` (lens-adapted prose including Stance elaborations). The F2 finding collapses into a correct authoring instruction instead of a landmine.

- **T3: manifest wiring + member regeneration** — wire and regenerate immediately after member sources. Don't defer to a single T7 that also handles reviewers, catalog, and 11 files. The AC-8.1 gate fires once for members, isolating meaning-preservation errors to this task.

- **T4-T5: reviewer sources + reviewer manifest wiring + reviewer regeneration** — same pattern. Wire and regenerate per concern, not in one 11-file integration point.

- **T6: catalog mode + catalog sources + catalog wiring** — catalog is a different generator mode; it has its own F5 (grouping decision) and its own template. Keep it isolated until reviewers are locked.

- **T7: verify test as the capstone** — once all sources are wired and all regenerations are committed, the staleness guard can be written against a known-correct committed state.

The current plan puts T7 (11-file integration) before T8 (verify test) — that ordering is correct in isolation but is preceded by no per-concern integration steps. If T3 sources are wrong, you don't find out until T7; and if you find out in T7, you are now debugging 11 files.

---

## The T7 hidden hazard the researcher named

T7's manifest fragment for members includes `{"file":"skills/util-design-partner-role/SKILL.md","section":"Stance Principles (carry into every turn)"}`. Per F2, this is wrong: it pulls generic Stance bullets and replaces lens-adapted versions. An implementer who follows T7 as written commits a semantic change to all four member files. The verify test then passes (committed output matches generated output — they're both wrong). AC-8.1 is silently violated.

This is not a gap the implementer can catch from T7 alone. The threat report corrects it in prose (F2 fix directive), but the plan's executable step still contains the wrong fragment. A re-ordered plan would expose this at member-manifest-wiring time (when the wrong section extraction would conflict with a scaffold carrying `{{Lens}}` placeholders), not silently after 11 files are committed.

---

## F1 and F3: bugs guaranteed to surface in execution

F1 (`$tmpl_abs` unbound in `emit_catalog`) is a guaranteed crash under `set -u`. The code block in T2 Step 3 contains the bug. The threat report names the fix in prose. An implementer running TDD will hit a red test on Step 4, read the threat report, apply the one-line fix. But the plan's "complete code block" is incorrect — an implementer who copies it without reading the threat report ships broken code. This is a plan quality issue, not an implementer-catch issue.

F3 (`fail()` undefined in `test-partner-role-discipline.sh`) is equally guaranteed: T5 adds `fail "..."` calls to a test that uses `set -e` + inline `|| { exit 1; }`, not the accumulator convention. The test fails to run. Again, threat report names the fix in prose, but no task step reflects it.

---

## F5: the unresolved designer decision

F5 is a structural fork in the catalog design: frontmatter-generated list is flat-alphabetical; current index groups by role. Three options were named in the threat report; none chosen. Plan-00 proceeds as if option (a) (flat-alphabetical) is the choice, because the T2 test asserts alphabetical order and does not assert grouping. But the catalog template task (T6) copies the current hand-authored structure including role-group headers. At T7, the generator replaces the slot with a flat list inside a template that has group headers — a structural inconsistency that neither test catches.

This is a designer decision gap, not an implementer gap. The plan should name the choice, not leave it for the implementer to discover at T7.

---

## Peer DMs

### To conservator

The AC-8.1 gate is the plan's most important safeguard. I am arguing F2 creates a path where the gate passes on a semantically wrong output (committed output is itself wrong, because T7 was wired before F2 was fixed). Do you see the gate as still load-bearing given that path, or does the gate's value depend on T7 being preceded by a correct T3?

### To pragmatist

You will want to defend the current T1-T2-T3-T4-T7 ordering on grounds of implementation cost: fewer tasks, cleaner separation of concerns, implementer catches F1 and F3 from the threat report. I accept that argument for F1 (one-line fix, implementer can catch it). I do not accept it for F2: the substitution engine is a mechanism change, not a one-line fix, and it shapes what belongs in the scaffold. Authoring the scaffold before the mechanism exists is not cheaper — it is a rework hazard. What is your cost estimate for discovering F2 at T7 vs at T1?

---

## Final Position

position: Plan-00's decomposition is structurally under-scoped in two load-bearing ways: (1) F2's substitution mechanism is absent from all 10 tasks, and the plan's source-authoring tasks (T3) and manifest wiring (T7) are authored as if F2 does not exist — an implementer who follows the plan faithfully produces semantically wrong member files that pass the AC-8.1 gate; (2) T7 bundles 11-file integration after all sources are authored, converting F2 into a late-discovery failure with maximum rework cost.

rationale: The correct shape for a refactor where a mechanism finding (F2) redefines the scaffold/lens boundary is to build the generator with the correct mechanism (substitution engine) before authoring sources, then wire and verify per-concern (members separate from reviewers separate from catalog) rather than in a single 11-file integration point. F1 and F3 are implementer-catchable from the threat report; F2 is not (it requires re-authoring T3's sources and T7's manifest wiring). F5 needs a designer decision recorded in the plan before T6 or T7 proceeds.

blocking_risk: HIGH — if the plan executes as written, the AC-8.1 diff gate will pass on semantically changed member files (because T7's committed output is itself wrong) and the verify test in T8 will lock in the error.
