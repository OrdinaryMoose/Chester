# Researcher Findings — Design→Spec Sequence (Round 01)

**Question:** How does design become spec today, and how are specs hardened? Ground for committee question about expanding committee responsibility to include spec writing.

**Sources consulted:**
- Chester repo: `docs/chester/plans/` (archived sprint artifacts)
- Chester skills: `skills/design-specify/SKILL.md`, `skills/design-small-task/SKILL.md`, `skills/design-committee/SKILL.md`
- Chester agents: `agents/plan-build-plan-attacker.md`; `skills/design-specify/references/` (adversarial-spec-review.md, ground-truth-reviewer.md, spec-reviewer.md)
- StoryDesigner repo: `docs/chester/plans/` (archived sprint artifacts)
- StoryDesigner master plan: `docs/chester/working/20260526-01-fix-domain-defects/master-plan.md`

No JSONL transcript sampling was performed — the artifact trees provided sufficient direct evidence of live sequence behavior (design briefs, spec revisions with version numbering, ground-truth reports, spec provenance trailers). JSONL grep would supplement but does not change the structural findings below.

---

## Project 1: Chester Repo

### Design→Spec Sequence: What exists

The canonical pipeline is declared in `skills/design-small-task/SKILL.md` (Phase 5: Closure) and `skills/design-specify/SKILL.md`:

1. **Design brief written** by `design-small-task` → `{CHESTER_WORKING_DIR}/{sprint}/design/{sprint-name}-design-00.md`
2. **Spec written** by `design-specify` → `{CHESTER_WORKING_DIR}/{sprint}/spec/{sprint-name}-spec-00.md`
3. **Spec hardened** by three sequential reviews inside `design-specify`
4. **User approval gate** before transitioning to `plan-build`

Both skill files explicitly link the steps: `design-small-task` § Integration: "Transitions to: design-specify (which formalizes brief into spec, then transitions to plan-build)". `design-specify` § Entry Condition lists the upstream brief path as its first entry point.

### Concrete Artifact Pairs Found

**Pair A: 20260408-02-artifact-directory-worktree-clarity**

- Design: `docs/chester/plans/20260408-02-artifact-directory-worktree-clarity/design/artifact-directory-worktree-clarity-design-00.md`
- Spec: `docs/chester/plans/20260408-02-artifact-directory-worktree-clarity/spec/artifact-directory-worktree-clarity-spec-00.md`
- What transforms: The design brief is a flat list of six design decisions (D1–D6) naming behavioral intent. The spec transforms this into: (a) an Architecture section choosing "pragmatic 3-file documentation rewrite at authority level", (b) per-Component sections with exact file paths, line numbers, current text, and replacement text for each of the three files to change, (c) a verified list of files confirmed correct and not requiring change, (d) Data Flow diagram, (e) Error Handling, (f) Testing Strategy, (g) Constraints, (h) Non-Goals. The spec is entirely prescriptive and implementation-ready; the brief is entirely descriptive and decision-anchored.
- Architecture step added: The spec begins with "**Architecture: Pragmatic (3-file documentation rewrite at authority level)**" — this architectural choice is present in the spec but absent from the brief. It originates from the competing-architectures step `design-specify` performs between brief reading and spec writing.
- Hardening in this sprint: No ground-truth report file is archived. This sprint predates the full three-review chain (the sprint is from 2026-04-08; the spec-template.md and ground-truth-reviewer.md apparatus appears to have been added in the 20260410-02-add-attack-specify sprint).

**Pair B: 20260609-01-realign-committee-answer (most complete example)**

- Design: `docs/chester/plans/20260609-01-realign-committee-answer/design/20260609-01-realign-committee-answer-design-00.md`
- Spec versions: `spec-00.md`, `spec-01.md`, `spec-02.md`
- Ground-truth report: `spec/20260609-01-realign-committee-answer-spec-ground-truth-report-00.md`
- What transforms: The design brief has 13 numbered key decisions (D1–D13), five principles (P1–P5), and an Open Threads section. The spec transforms these into: Goal (single paragraph), Components (per-file change lists with exact version bumps), Data Flow (six-step numbered sequence), Error Handling (per-failure-mode table), Testing Strategy, Constraints (named C-RIGID, C-LOCKED, C-VOICE, C-DEFER, C-AUTHORITY, C-DISK, C-NAMING, C-SURFACE), Non-Goals, and Acceptance Criteria (per-AC blocks with observable-boundary declarations and Given/When/Then structure). The brief's principles become spec constraints and acceptance criteria. The brief's open threads appear as explicit Non-Goals. Architecture choice (Hybrid — auditability at minimum surface) appears in the spec header; it is absent from the design brief.
- Hardening: The ground-truth report (`spec-ground-truth-report-00.md`) shows that the ground-truth reviewer was dispatched as a `general-purpose` subagent. It found one MEDIUM finding: the spec misattributed a prior-art sprint ID (the "two-surface" term collision). The report states: "Spec reviewed: spec-01 … Status: Findings — 1 MEDIUM (fixed in spec-02)." The fix was incorporated into spec-02. All structural claims (file paths, version numbers, five no-collapse doctrine sites with exact line references) were verified correct by the reviewer against live files. The ground-truth report cites specific file:line evidence for every confirmed claim.
- Fidelity review + adversarial review: The spec-01 provenance trailer (`<!-- produced-by design-specify@v0004 -->`) confirms the full `design-specify` chain ran. The spec-02 correction is gated on the user-approval step: the ground-truth report was "presented to the user alongside the spec at the user review gate" per SKILL.md § User Review Gate.

**Pair C: 20260610-01-extend-committee-answer**

- Design: `docs/chester/plans/20260610-01-extend-committee-answer/design/20260610-01-extend-committee-answer-design-00.md`
- Spec: `docs/chester/plans/20260610-01-extend-committee-answer/spec/20260610-01-extend-committee-answer-spec-00.md`
- Ground-truth report: `spec/20260610-01-extend-committee-answer-spec-ground-truth-report-00.md`
- Committee artifacts: `committee/round01/` through `committee/round03/` including verdict.md, alignment-map.md, conservator/innovator/pragmatist/purist transcripts, consolidator-output.md. This sprint's design was produced with committee assistance before the brief was written. The committee produced the decisions that fed the brief; the brief then fed `design-specify` in the normal way.

**Pair D: 20260430-02-rebuild-design-derivation (cluster-a-define-solve)**

- Design: `docs/chester/plans/20260430-02-rebuild-design-derivation/cluster-a-define-solve/design/cluster-a-define-solve-design-00.md`
- Spec versions: `spec-00.md`, `spec-01.md`
- Skeleton: `spec/cluster-a-define-solve-spec-skeleton-00.md`
- Ground-truth report: `spec/cluster-a-define-solve-spec-ground-truth-report-00.md`
- This pair shows a three-cluster master sprint with separate design→spec sequences inside each cluster. Each cluster runs the full `design-specify` chain independently. The skeleton artifact shows a pre-spec draft step in this sprint that predates the current template.

**Additional pairs confirmed to exist (design + spec directories present, not fully read):**

- 20260408-03-plan-mode-design-guard
- 20260408-01-compaction-hooks-state-preservation
- 20260403-03-specify-token-reduction (has design + spec directories)
- 20260404-01-architect-interview-review
- 20260405-01-architect-round-one-fix
- 20260403-02-architect-pacing-optimization
- Approx. 25+ sprints in the 2026-03-27 through 2026-04-29 range with design + spec pairs

### What Gets Added in the Spec That Was Absent from the Brief

Based on reading Pairs A and B directly:

- **Architecture selection** — the competing-architectures step (`design-specify` § Competing Architectures + Prior Art) inserts a chosen architecture (e.g., "Pragmatic 3-file rewrite," "Hybrid — auditability at minimum surface"). The brief never names an architecture. This is the primary structural addition.
- **Acceptance criteria with observable boundaries** — the brief has acceptance criteria as bullets; the spec expands each to AC-{N.M} blocks with Given/When/Then and an "Observable boundary" declaration. Pair B (realign-committee-answer) has 12+ AC blocks, each multiple paragraphs.
- **Per-component implementation detail** — the spec enumerates files to change, exact sections to edit, version bump targets. The brief names goals; the spec names file paths.
- **Non-Goals section** — the brief's Open Threads or deferred items become explicit Non-Goals in the spec.
- **Constraints section with named identifiers** — brief constraints are paragraph-form; spec constraints are named (C-RIGID, C-LOCKED, etc.) so the plan-attacker and implementer can reference them by ID.
- **Error Handling section** — absent from the brief, always present in the spec (per spec-template.md).
- **Provenance trailer** — `<!-- produced-by design-specify@v0004 -->` stamps the producing skill version onto the spec artifact.

### How Spec is Hardened: The Three-Pass Chain

`design-specify/SKILL.md` § Checklist items 5–7 define the hardening chain. All three pass before the user review gate. Evidence they run in practice: the ground-truth reports archived in the plans directory, and the spec version numbers (spec-00 → spec-01 or spec-02) showing mid-chain fixes were applied.

**Pass 1: Spec fidelity review (subagent, single pass)**

- Dispatcher: `design-specify` (the main skill, acting as dispatcher)
- Agent: `design-committee-researcher`-style general-purpose dispatch with the prompt template at `skills/design-specify/references/spec-reviewer.md`
- What it checks: Does the spec faithfully address the brief's goals, constraints, and decisions? Goals coverage, constraints respected, no untraceable additions, internal consistency.
- Evidence it runs: Spec version increments (e.g., spec-00 → spec-01) with fixes applied inline, no re-dispatch loop.
- Current status: Subagent dispatch, single pass. NOT a committee role.

**Pass 2: Adversarial spec review (inline, no subagent)**

- Dispatcher: `design-specify` inline (no agent dispatch)
- What it checks: Per `skills/design-specify/references/adversarial-spec-review.md` — structural integrity (file paths exist?), execution risk (partial-state dangers), unstated assumptions (runtime, DI lifetimes, in-flight deps), contract gaps, concurrency hazards. Every finding must cite a specific file:line.
- Evidence: Pair B's ground-truth report says "The spec-01 adversarial corrections match ground truth" — confirming the adversarial pass ran and its corrections were incorporated before the ground-truth pass ran.
- Current status: Inline (no subagent, no committee). The skill rationale: "The dispatcher already holds the architect choice, prior-art findings, and brief intent — losing that context to a subagent would degrade the review."

**Pass 3: Ground-truth review (subagent, automatic)**

- Dispatcher: `design-specify`, no opt-in prompt
- Agent: `general-purpose` subagent, prompt template at `skills/design-specify/references/ground-truth-reviewer.md`
- What it checks: Does the spec's claims about existing code match reality? Every claim about types, interfaces, method signatures, file paths, runtime behavior verified against actual source files. HIGH findings = fix the spec; MEDIUM = fix the spec; LOW = note in report only.
- Evidence in the plans archive:
  - `20260609-01-realign-committee-answer/spec/spec-ground-truth-report-00.md`: 1 MEDIUM finding corrected in spec-02 (misattributed prior-art sprint). All structural claims verified with file:line citations.
  - `20260413-02-wire-save-dispatch/spec/wire-save-dispatch-spec-ground-truth-report-00.md` (StoryDesigner): 5 HIGH findings (FK map errors), 2 HIGH DI scoping, 3 MEDIUM — all corrected.
  - `20260526-01-fix-domain-defects/sprint-04-producer-tag-hygiene/spec/spec-ground-truth-report-00.md` (StoryDesigner): Present, confirming ground-truth review ran.
  - `20260601-01-implement-storyauthoring-project` (StoryDesigner): Multiple sub-sprint ground-truth reports present.
- Current status: Subagent dispatch. NOT a committee role.

### Existing Committee → Spec Automation

**None exists.** The committee (`skills/design-committee/SKILL.md`) is a "process-agnostic primitive" for "ad-hoc design consultations." Its declared terminal state is a verdict artifact (`committee/roundNN/verdict.md`) plus a scribe-authored summary. It writes no spec. Its SKILL.md checklist ends at teardown (`TeamDelete`); no spec-writing step exists.

The two cases where committee ran before a spec (Pair C: 20260610-01-extend-committee-answer; StoryDesigner: 20260609-01-add-glossary-system) show the same pattern: committee → designer writes or approves a design brief → `design-specify` runs normally against the brief. The committee's verdict fed the brief; the brief fed `design-specify`. The handoff is manual: the designer takes the committee's verdicts and uses them to approve or author the brief.

**The committee has no connection to `design-specify` in either direction.** The SKILL.md exclusion is explicit: "Do NOT convene when other skill owns planning: `design-small-task`, `design-specify`."

### Absence Findings: Where the Sequence Breaks or Is Missing

**A1. No committee→spec connection.** The committee writes no spec, dispatches no spec subagent, and has no integration point with `design-specify`. Committee verdicts reach the spec only through the manual path: designer reviews committee output and authors or approves a design brief that then feeds `design-specify`.

**A2. Some older sprints missing spec.** Sprints `20260410-02-add-attack-specify` has a design and plan directories but an empty spec directory. Sprint `20260517-01-create-design-committee` has design and summary but no spec directory at all. These appear to be cases where the spec stage was skipped (design went directly to plan, or the work was a small-enough change that a formal spec was not written). This is pre-`design-specify`-skill era or short-cut use.

**A3. Adversarial review is context-dependent.** The adversarial spec review runs inline in the `design-specify` skill's own context. This means it is not independent — the same agent that authored the spec also attacks it. The skill rationale is explicit about this trade-off ("losing that context to a subagent would degrade the review"), but it means the adversarial pass does not have the independence guarantee that the ground-truth subagent has.

**A4. No spec-hardening feedback into the committee.** If a ground-truth reviewer finds that a committee verdict rests on a false codebase assumption, there is no mechanism to route that finding back to the committee. The sequence is one-way: committee → brief → spec → ground-truth review → user gate. A false factual premise in a committee verdict survives into the spec unless the adversarial or ground-truth pass catches it.

**A5. Fidelity reviewer does not see committee transcripts.** The spec fidelity reviewer receives the spec and the design brief. If the brief compressed or discarded committee reasoning, the fidelity reviewer has no access to the deliberation record to catch misrepresentation.

---

## Project 2: StoryDesigner Repo

### Design→Spec Sequence: What Exists

StoryDesigner uses Chester's full pipeline. The plans archive shows the same design→spec pair structure. The same three hardening passes appear in the ground-truth reports. Key differences:

- **StoryDesigner's sprints are often sub-sprints under master plans** — each sub-sprint runs the full design→spec chain. Example: `20260526-01-fix-domain-defects` has sprint-01, sprint-04, sprint-07, sprint-08, each with their own design + spec directories.
- **Committee was used for design decisions feeding a spec** — `20260609-01-add-glossary-system` ran four rounds of committee before the design brief was written. The brief says: "**Provenance:** four-round design committee — full records at docs/chester/working/20260609-01-add-glossary-system/committee/." The committee's four-round verdicts fed the twelve key decisions in the brief. `design-specify` then ran against the brief in the normal way.
- **Multiple spec revisions are common** — Pair E (20260609-01-add-glossary-system) has spec-00, spec-01, spec-02 — with a committee running another round (round-05, round-06) as part of the spec-writing process. This is an unusual case where committee feedback extended into the spec stage.

### Concrete Artifact Pairs Found

**Pair E: 20260609-01-add-glossary-system (StoryDesigner)**

- Design brief: `docs/chester/plans/20260609-01-add-glossary-system/design/add-glossary-system-design-00.md`
  - Status: "Approved (committee-adjudicated, designer sign-off complete)"
  - Provenance: "four-round design committee — full records at docs/chester/working/20260609-01-add-glossary-system/committee/"
- Spec: `spec-00.md`, `spec-01.md`, `spec-02.md`
- The brief's design decisions (D1–D6) map directly to spec components. Spec-02 revision note attributes changes to "R-1..R-4, 2026-06-10 designer decisions" — meaning the designer issued corrections post-spec-01 that were incorporated into spec-02. These corrections include specific component routing decisions (e.g., "R-1: DCF-as-diff-record → its own standalone `working` Concept page"; "R-4: Half-built sentence is the early metaphor form of the existing active Concept `completion-first-refactoring.md`").

**Pair F: 20260413-02-wire-save-dispatch (StoryDesigner) — richest ground-truth evidence**

- Design: `docs/chester/plans/20260413-02-wire-save-dispatch/design/wire-save-dispatch-design-00.md`
- Spec: `spec-00.md`
- Ground-truth report: `spec/wire-save-dispatch-spec-ground-truth-report-00.md`
- The ground-truth report shows: "Both reviews surfaced significant findings, with substantial overlap. The most critical issues were in the FK reference map (5 factual errors against actual DTO shapes) and DI scoping (entity services are Scoped, not resolvable from root provider)."
- Finding count: 5 HIGH (FK map errors), 1 HIGH (DI scoping), 2 MEDIUM, 2 LOW. All HIGH and MEDIUM corrected before plan-build.
- The report also says "Reviews run: ground-truth + plan-attack (parallel)" — indicating that in this StoryDesigner sprint, the plan-attack agent ran in parallel with the ground-truth review at the spec stage, not just the plan stage. This is a departure from the standard `design-specify` three-pass chain (which uses plan-attack only at plan-build). Whether this was a one-off or a pattern is not established from this single artifact.
- What the ground-truth found that the design brief didn't catch: five FK field name errors (the design brief described the dispatch by entity type but did not enumerate per-DTO field names, which the spec did). DI scoping error (the brief described "entity services" without specifying their DI lifetime; the spec assumed root-provider resolution, which is wrong for Scoped services).

**Pair G: 20260526-01-fix-domain-defects (StoryDesigner master plan)**

The master plan for this sprint has a notable explicit amendment: "**2026-05-26 (rev a): Inserted a mandatory `design-specify` (formal spec) step into every sub-sprint lifecycle, before the implementation plan. Corrects an original omission where the protocol jumped straight from the master plan to an implementation plan, skipping the durable spec + its acceptance contract."**

This is a direct absence finding recorded in the artifact itself: the sequence initially broke (design → plan, skipping spec), was caught, and `design-specify` was mandated retroactively for all remaining sub-sprints. The sprint's sprint-01, sprint-04, sprint-07, sprint-08 all have spec directories and ground-truth reports.

### StoryDesigner Absence Findings

**B1. Spec stage was initially missing from a master plan.** The `20260526-01-fix-domain-defects` master plan rev-a explicitly records that the original protocol "jumped straight from the master plan to an implementation plan, skipping the durable spec + its acceptance contract." The `design-specify` step was added as a mandatory amendment after the omission was noticed.

**B2. Some earlier StoryDesigner sprints have no spec at all.** The `2026-03-24-chester-thinking-model` and `2026-03-24-code-doc-subagent` sprints have spec files directly in the sprint root (no spec/ subdirectory), following an earlier flat-file convention. Earlier sprints (pre-YYYYMMDD naming convention) show designs without specs (e.g., `2026-03-25-figure-out-decomposition` has only a design directory, no spec directory).

**B3. No committee→spec automation in StoryDesigner either.** The `20260609-01-add-glossary-system` committee records are present but the transition from committee → brief is entirely manual. The committee produced verdicts; the designer produced the brief with "committee-adjudicated" status noted in the header.

---

## Summary: What the Evidence Supports (Facts Only, No Opinion)

1. **The design→spec sequence is canonical and consistently executed in both repos for recent sprints.** Every sprint from approximately 2026-04-08 onward with both a design and a spec directory shows the brief-to-spec structural transformation, with the spec adding architecture selection, AC blocks with observable boundaries, per-component implementation detail, named constraints, error handling, and Non-Goals.

2. **Spec hardening runs as three passes: fidelity (subagent), adversarial (inline), ground-truth (subagent).** All three are owned by `design-specify`. The ground-truth subagent is the most effective hardener — the archived reports show it catching HIGH factual errors (wrong DTO field names, wrong DI lifetimes, wrong file paths) that the design brief did not and could not catch.

3. **The committee has zero connection to spec writing today.** No skill, agent, or artifact links the committee to `design-specify`. The committee's contribution to a spec flows only through the manual path: committee → verdict → designer writes/approves brief → `design-specify` runs.

4. **The handoff from committee verdict to design brief is manual and lossy.** The fidelity reviewer sees the brief, not the committee transcripts. If the brief compressed or discarded committee reasoning, the fidelity reviewer cannot catch it.

5. **The adversarial spec review is not independent** — it runs in the same agent context that authored the spec. The ground-truth review IS independent (subagent dispatch, no prior context).

6. **Spec version numbering (spec-00 → spec-01 → spec-02) directly records mid-chain fixes.** Each version increment corresponds to findings addressed. A spec that required no fixes stays at spec-00. Pair B (realign-committee-answer) went to spec-02 due to ground-truth finding. Pair E (add-glossary-system) went to spec-02 due to designer corrections post-spec-01.

7. **The sequence has broken in practice and been corrected mid-sprint.** StoryDesigner `20260526-01-fix-domain-defects` master plan rev-a is a recorded instance of the spec stage being skipped and then mandated back in.
