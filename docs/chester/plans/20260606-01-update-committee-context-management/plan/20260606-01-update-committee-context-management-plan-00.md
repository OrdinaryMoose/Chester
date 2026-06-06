# Plan: Committee Context Redesign — Artifact-Boundary Process

**Sprint:** 20260606-01-update-committee-context-management
**Spec:** docs/chester/working/20260606-01-update-committee-context-management/spec/20260606-01-update-committee-context-management-spec-00.md
**Execution mode:** inline

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. All tasks are `docs-producing` (skill/agent markdown + one bash integration test). "TDD" is adapted: adjust the integration-test assertion for the contract first (red), edit the doc to satisfy it (green), run the test, commit. Execution mode is `inline` — docs-producing, one coherent skill, strict sequential dependencies; subagent fan-out buys nothing.

## Goal

Re-shape the design-committee process so the team-lead stops accumulating the bulk of per-round context: every step reads a bounded prior artifact, writes its own, and evicts; authoring moves to a new scribe agent; consolidation reads only the bounded `## Final Position` section.

## Architecture

Inherited from spec. **The artifact is the boundary — separate files mandatory, separate agents optional.** Team-lead keeps two fixed functions (dispatch, present) and additionally owns synthesize (`alignment-map.md`) and converge (`verdict.md`) because those write auditable files; consolidate stays a dedicated agent (its contamination is invisible); author moves to a new scribe agent (the dominant leak). Members send the team-lead a typed routing signal only.

## Tech Stack

Markdown skill/agent definitions under `skills/design-committee/` and `agents/`; one bash integration test `tests/test-design-committee-context-economy.sh` (grep-based structural assertions, with explicit insert-regions for new assert functions/calls); `chester-trailer-write` for version/provenance discipline.

## Acceptance Criteria (from spec §8 — IDs assigned here)

- **AC-1** — a four-round session keeps team-lead context within ~37–49k tokens (vs ~297k). *Emergent: not deliverable or verifiable by any single task; confirmed only after the whole pipeline lands, via the integration test plus a manual committee run. Owned by no task.*
- **AC-2** — no member prose reaches team-lead context except via the bounded pipeline artifacts.
- **AC-3** — every per-round artifact exists on disk before the next step begins (checkpoint); absence blocks the next dispatch.
- **AC-4** — consolidator output stays enumerate-only across all rounds, because its input is the capped `## Final Position` section.
- **AC-5** — dissent reaches the designer in every split session, guaranteed by a mandatory `Dissent Record` section the team-lead reads while presenting.

## Test discipline (load-bearing — read before Task 1)

The integration test currently encodes the **old** contract. `assert_member_protocol` greps for `headline position`, `confidence`, `## Digest shape`; `assert_skill_md` greps SKILL.md for `digest`. These are the strings this redesign removes. Therefore the test is **not** a passive regression guard — each task that changes a contract must revise that contract's assertion in the **same commit**, so the suite is green at every task boundary. The test file marks insert-regions: new `assert_*` functions go between `# === ASSERTION FUNCTIONS` markers; new run calls go in the run region above the final gate.

## Dependency graph

- Task 1 (member-protocol) → Task 2 (consolidator) and → Task 3 (team-lead). The `## Final Position` schema is the structural ground truth both consume.
- Task 4 (template) → Task 5 (scribe). The scribe consumes the template path.
- Tasks 2 and 3 are independent of each other.
- Task 6 (round-format) is independent; run after Task 3 for vocabulary consistency.
- Task 7 (SKILL.md) is strictly last — orchestration capstone referencing every concept the others define.

Execution order: **1 → 2 → 3 → 4 → 5 → 6 → 7**.

## Dissent Record (carried from round04 committee deliberation)

- **Pragmatist** held Tasks 1 and 2 (member-protocol + consolidator) could be a single task — both touch the `## Final Position` contract and the consolidator edit is ~1–3 lines. Rejected (3-1) for task-boundary cleanliness and independent per-task test assertions. Recorded so a reviewer knows the merge was considered, not overlooked.
- **Purist** flagged AC-1 false-green risk: a reviewer could mark AC-1 complete after any single task. Mitigated by the explicit *emergent* designation — AC-1 is owned by no task and is not markable complete until the full pipeline lands.

---

## Task 1: member-protocol — Final Position section, typed routing signal, capped peer-DM

**Type:** docs-producing
**Implements:** AC-2, AC-4
**Decision budget:** 4 (Final Position schema wording; routing-signal field set; rejection-prompt wording; peer-DM cap phrasing) — highest in the plan; this schema is the structural ground truth Tasks 2 and 3 depend on, so get it exact against spec constraints 5 & 6.
**Must remain green:** `tests/test-design-committee-context-economy.sh` — `assert_member_protocol` (this task rewrites it).

**Files:**
- Modify: `skills/design-committee/references/member-protocol.md` — replace `## Digest shape` (lines ~18-34); extend `## Transcript and round-folder` (lines ~44-62); add a peer-DM section. Leave `## Committee root resolution` unchanged.
- Modify: `tests/test-design-committee-context-economy.sh` — `assert_member_protocol` (lines 11-19).

**Steps (TDD-adapted):**

- [ ] **Step 1: Rewrite the test assertion first (red).** Replace `assert_member_protocol` body with:

```bash
assert_member_protocol() {
  local f="$SK/references/member-protocol.md"
  _check "member-protocol exists" "[ -f '$f' ]"
  _check "member-protocol mandates Final Position section" "grep -q '## Final Position' '$f'"
  _check "member-protocol Final Position schema" "grep -qi 'position' '$f' && grep -qi 'rationale' '$f' && grep -qi 'blocking_risk' '$f'"
  _check "member-protocol caps Final Position at 200 words" "grep -qiE '200[ -]word' '$f'"
  _check "member-protocol defines typed routing signal" "grep -qi 'routing signal' '$f' && grep -qi 'reject' '$f'"
  _check "member-protocol routing-signal fields" "grep -qi 'status' '$f' && grep -q 'transcript' '$f'"
  _check "member-protocol caps peer-DM exchanges" "grep -qiE 'peer.?dm' '$f' && grep -qiE '2 (exchanges|per pair)|max 2' '$f'"
  _check "member-protocol names round-folder transcript path" "grep -q 'committee/round' '$f'"
  _check "member-protocol owns committee-root resolution (M1)" "grep -qiE 'sprint-subdir|ask the designer' '$f'"
  _check "member-protocol has citable section headings" "grep -q '## Committee root resolution' '$f'"
}
```

- [ ] **Step 2: Run, confirm fail.** `bash tests/test-design-committee-context-economy.sh` → FAIL on the new member-protocol checks.
- [ ] **Step 3: Edit member-protocol.md.**
  - Replace `## Digest shape` with `## Routing signal (member → team-lead)`: typed signal only, schema `{member, status, round, transcript}` — these four fields are the entire body, no free text; malformed signals (any field outside the schema) are rejected unread with one correction prompt.
  - In `## Transcript and round-folder`, add the mandatory `## Final Position` requirement: exact header, **last section** of the transcript, 200-word cap, schema `{position, rationale, blocking_risk}`, all member-authored; `blocking_risk` = the member's own ~20-word articulation of the hardest objection to the non-chosen options (not a label, not a paraphrase).
  - Add `## Peer-DM`: schema `[sender]→[target]: [one sentence] / [target]: [one sentence]`, max 2 exchanges per pair, caveman ultra.
- [ ] **Step 4: Run, confirm pass** (`assert_member_protocol`).
- [ ] **Step 5: Commit.**

```bash
git add skills/design-committee/references/member-protocol.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): member Final Position section + typed routing signal + capped peer-DM"
```

---

## Task 2: consolidator — read-scope to Final Position only

**Type:** docs-producing
**Implements:** AC-4
**Decision budget:** 1
**Must remain green:** `tests/test-design-committee-context-economy.sh` — `assert_consolidator`.
**Depends on:** Task 1.

**Files:**
- Modify: `agents/design-committee-consolidator.md` — § Role (lines ~15-17); add a hard prohibition.
- Modify: `tests/test-design-committee-context-economy.sh` — `assert_consolidator` (add one check).

**Steps (TDD-adapted):**

- [ ] **Step 1: Add the test assertion (red).** Append to `assert_consolidator`:

```bash
  _check "consolidator reads only Final Position section" "grep -qi 'Final Position' '$f'"
```

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Edit the consolidator agent.** In the Role / "Read the round folder" instruction, replace "read every member transcript and researcher findings file" with: read **only** the `## Final Position` section (last section) of each member transcript — never the full body. Add to `## Hard prohibitions`: "Does NOT read transcript bodies — only the `## Final Position` section; reading the body defeats the bounded-input guarantee." Keep the enumeration ceiling unchanged (already spec-correct); note output is bounded by bounded input, not by instruction alone. Keep the existing verbatim/no-paraphrase prohibitions.
- [ ] **Step 4: Run, confirm pass** (`assert_consolidator`).
- [ ] **Step 5: Commit.**

```bash
git add agents/design-committee-consolidator.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): scope consolidator reads to Final Position section only"
```

---

## Task 3: team-lead — own synthesize + converge (write-evict), reject malformed signals, present-reads-artifact

**Type:** docs-producing
**Implements:** AC-2, AC-3, AC-5
**Decision budget:** 3
**Must remain green:** `tests/test-design-committee-context-economy.sh` — `assert_team_lead`.
**Depends on:** Task 1.

**Files:**
- Modify: `skills/design-committee/references/team-lead.md` — Per-Round Flow (lines ~99-108), Behavioral Constraints (lines ~115-120), Closure (lines ~122-134), frontmatter version (v0007 → v0008).
- Modify: `tests/test-design-committee-context-economy.sh` — `assert_team_lead` (add checks; bump version check at line 59 to `> v0007`).

**Steps (TDD-adapted):**

- [ ] **Step 1: Add test assertions (red).** Append to `assert_team_lead` and bump the version check:

```bash
  _check "team-lead writes alignment-map and evicts" "grep -qi 'alignment-map' '$f' && grep -qiE 'evict|drop from context|no longer needed in context' '$f'"
  _check "team-lead writes verdict before scribe" "grep -qi 'verdict.md' '$f'"
  _check "team-lead rejects malformed signals" "grep -qiE 'reject .*(malformed|signal)' '$f'"
  _check "team-lead reads artifact at presentation" "grep -qiE 'read .*(artifact|draft).*(present|review)|the read IS the review' '$f'"
```

Replace the line-59 version check with: `grep -qE '^version: v00(0[8-9]|[1-9][0-9])' '$f'`.

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Edit team-lead.md.** In the Per-Round Flow, after "read consolidator-output", insert:
  - **Synthesize** — write `committee/roundNN/alignment-map.md` (alignment pattern + full option set + positions-discarded-with-reason), then evict. *(two-round only:* feed the alignment map back to members; each gets one revision pass; return to consolidate for a second round before converging.)
  - **Converge** — read `alignment-map.md`, write `committee/roundNN/verdict.md` (specific, one-sentence-minimum; ambiguous verdicts cannot proceed), then evict.
  - **Dispatch scribe** with `verdict.md` + annotated template + `consolidator-output.md` (+ prior artifact if revising).
  - **Present** — read the scribe's artifact once; the read IS the review; presenting from the artifact guarantees the `Dissent Record` is seen.

  Add to Behavioral Constraints: reject malformed member signals unread, issue one correction prompt, name the required schema; do not incorporate malformed content. Bump frontmatter version v0007 → v0008. Adjust Closure to account for the new round-folder artifacts.
- [ ] **Step 4: Run, confirm pass** (`assert_team_lead`).
- [ ] **Step 5: Commit.**

```bash
git add skills/design-committee/references/team-lead.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): team-lead owns synthesize/converge write-evict + signal rejection + present-reads-artifact"
```

---

## Task 4: artifact template — annotated handoff template with mandatory Dissent Record

**Type:** docs-producing
**Implements:** AC-5
**Decision budget:** 2 (location per util-artifact-schema; which sections are annotated).
**Must remain green:** `tests/test-design-committee-context-economy.sh` — new `assert_artifact_template`.

**Files:**
- Create: `skills/design-committee/references/artifact-template.md` (confirm location against `util-artifact-schema` during the task; this path is default).
- Modify: `tests/test-design-committee-context-economy.sh` — add `assert_artifact_template` (assertion-function region) + its run call (run region, above the gate).

**Steps (TDD-adapted):**

- [ ] **Step 1: Add the test assertion + call (red).** In the assertion-function region:

```bash
assert_artifact_template() {
  local f="$SK/references/artifact-template.md"
  _check "artifact template exists" "[ -f '$f' ]"
  _check "artifact template has Dissent Record header" "grep -qE '^#+ .*Dissent Record' '$f'"
  _check "artifact template marks Dissent Record mandatory" "grep -qiE 'Dissent Record' '$f' && grep -qiE 'mandatory|required|MUST appear' '$f'"
}
```

Run call (above the gate): `assert_artifact_template`.

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Read `skills/util-artifact-schema/SKILL.md`** to confirm location/naming, then create `skills/design-committee/references/artifact-template.md`:

````markdown
# Committee Artifact Template

This is the annotated template the scribe uses when drafting committee artifacts (specs, plans, or analysis documents). Every `<!-- -->` comment is instruction to the scribe — remove comments from the final draft. The `## Dissent Record` section is mandatory and MUST appear in every artifact regardless of whether members split.

---

<!-- TITLE: Name the artifact by what it decides, not by the round number. -->
# [Artifact Title]

<!-- DATE: ISO date the artifact is produced. -->
**Date:** YYYY-MM-DD

<!-- SPRINT: Sprint name if committee operates inside a sprint context; omit if standalone. -->
**Sprint:** [sprint-name or omit]

<!-- SOURCE: Cite the verdict.md and consolidator-output.md that produced this artifact. -->
**Source:** verdict from `committee/roundNN/verdict.md`; member positions from `committee/roundNN/consolidator-output.md`

---

## Summary

<!-- One paragraph: what the committee was asked, what the verdict is, and what it means for downstream work. No jargon. -->

## Verdict

<!-- State the verdict verbatim from verdict.md — do not paraphrase. -->

## Rationale

<!-- Plain prose. Draw from alignment-map.md if available, else consolidator-output.md positions. State what was weighed and why the verdict resolves it. -->

## Dissent Record

<!-- MANDATORY. MUST appear in every artifact. If members were unanimous, state that explicitly. If members split, record each dissenting position — member name, position, and the blocking_risk field verbatim from their Final Position. This section is what the team-lead reads while presenting; it guarantees dissent reaches the designer even if the verdict does not foreground it. -->

**Alignment:** [4-0 unanimous | 3-1 | 2-2 | other]

**Dissenting positions** (omit if unanimous):
- [Member]: [position verbatim] — blocking risk: [blocking_risk verbatim]

## Deferred / Open

<!-- Questions the committee left open or explicitly deferred. If none, write "None." -->

---

<!-- produced-by: scribe / roundNN / YYYY-MM-DD -->
````

- [ ] **Step 4: Run, confirm pass.**
- [ ] **Step 5: Commit.**

```bash
git add skills/design-committee/references/artifact-template.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): annotated artifact template with mandatory Dissent Record"
```

---

## Task 5: scribe agent — authoring fed verdict + template, never the session thread

**Type:** docs-producing
**Implements:** AC-2
**Decision budget:** 2
**Must remain green:** `tests/test-design-committee-context-economy.sh` — new `assert_scribe`.
**Depends on:** Task 4.

**Files:**
- Create: `agents/design-committee-scribe.md`.
- Modify: `tests/test-design-committee-context-economy.sh` — add `assert_scribe` + run call.

**Steps (TDD-adapted):**

- [ ] **Step 1: Add the test assertion + call (red).**

```bash
assert_scribe() {
  local f="$AG/design-committee-scribe.md"
  _check "scribe agent exists" "[ -f '$f' ]"
  _check "scribe grants Read+Write" "grep -qE '^tools:.*Read' '$f' && grep -qE '^tools:.*Write' '$f'"
  _check "scribe fed verdict + template" "grep -qi 'verdict' '$f' && grep -qi 'template' '$f'"
  _check "scribe never reads raw transcripts or session thread" "grep -qiE 'never .*(transcript|session thread)|not .*(your inputs|read)' '$f'"
  _check "scribe writes under committee/" "grep -q 'committee/' '$f'"
  _check "scribe no Mode A/B" "! grep -qE 'Mode [AB]' '$f'"
}
```

Run call (above the gate): `assert_scribe`.

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Create `agents/design-committee-scribe.md`:**

````markdown
---
name: design-committee-scribe
description: Authoring agent dispatched by design-committee after convergence is complete. Receives verdict.md, the annotated artifact template, and consolidator-output.md. Writes the draft artifact to disk; returns a file pointer only. Never receives raw transcripts or the session thread. Never forks (named subagent per fork-policy).
tools: Read, Write
model: sonnet
---

**Scribe** dispatched from `design-committee`. Job: author the committee's artifact (spec, plan, or analysis) from the converged verdict and the member-position record. You write from bounded inputs; you have no access to the deliberation session or raw transcripts.

## Role

- **Spawned after convergence.** The team-lead dispatches you after `verdict.md` exists — it is a required input; you cannot start before it.
- **Read your inputs from disk.** Inputs arrive as file paths. Read each before writing.
- **Write one artifact file.** Draft it using `skills/design-committee/references/artifact-template.md` as the structural guide. Remove template comments from the draft. Write to the path the team-lead specifies (under `committee/`).
- **Return a file pointer only.** Reply with the artifact path and a one-line confirmation. Do not paste the draft.

## Required inputs (all as file paths)

- `verdict.md` — the team-lead's specific, one-sentence-minimum decision. Primary source; write from it, do not expand it.
- `skills/design-committee/references/artifact-template.md` — annotated structural template; follow its sections, strip its comments.
- `consolidator-output.md` — per-member positions; use to populate `## Dissent Record`; copy `blocking_risk` values verbatim.
- Prior artifact version (optional) — if revising, read it and revise in place.

## Hard prohibitions

- **Never receives raw transcripts.** `committee/roundNN/<member>-transcript.md` files are not your inputs; if a transcript path is passed, do not read it.
- **Never receives the session thread.** No conversation history beyond your stated inputs.
- **No design opinion.** Write what the verdict says; do not embellish, soften, or expand its direction.
- **No summarizing of dissent.** `blocking_risk` values in `## Dissent Record` are copied verbatim from the consolidator output.

## Output

Write the draft to the team-lead's specified path. Reply only:

```
artifact: <exact path to the draft>
status: done
```
````

- [ ] **Step 4: Run, confirm pass.**
- [ ] **Step 5: Commit.**

```bash
git add agents/design-committee-scribe.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): scribe agent authors artifact from verdict + template only"
```

---

## Task 6: round-format doc — record the new per-round files in the folder shape

**Type:** docs-producing
**Implements:** AC-3
**Decision budget:** 1
**Must remain green:** `tests/test-design-committee-context-economy.sh` — `assert_round_format`.
**Note:** NOT in spec §9 — surfaced by round04 researcher ground-truth. Without it, `committee-analysis-round-format.md` drifts out of sync with actual round contents (the exact invisible-drift failure mode this sprint targets, one layer up).

**Files:**
- Modify: `skills/design-committee/references/committee-analysis-round-format.md` — Folder Shape (lines ~39-59), Template (lines ~100-226).
- Modify: `tests/test-design-committee-context-economy.sh` — `assert_round_format` (add checks).

**Steps (TDD-adapted):**

- [ ] **Step 1: Add test assertions (red).** Append to `assert_round_format`:

```bash
  _check "round-format lists alignment-map.md" "grep -qi 'alignment-map' '$f'"
  _check "round-format lists verdict.md" "grep -qi 'verdict.md' '$f'"
```

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Edit the round-format doc.** Add `alignment-map.md` (synthesize output), `verdict.md` (converge output), and the scribe draft to the Folder Shape listing and Template section, in pipeline order (consolidator-output → alignment-map → verdict → scribe draft). Keep vocabulary consistent with Tasks 1-3.
- [ ] **Step 4: Run, confirm pass** (`assert_round_format`).
- [ ] **Step 5: Commit.**

```bash
git add skills/design-committee/references/committee-analysis-round-format.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): record alignment-map/verdict/scribe-draft in round-folder format"
```

---

## Task 7: SKILL.md — flow reorder, mode selection, checkpoint, digest→routing-signal, version + two-place sync

**Type:** docs-producing
**Implements:** AC-1 (emergent — capstone), AC-2, AC-3
**Decision budget:** 3
**Must remain green:** `tests/test-design-committee-context-economy.sh` — `assert_skill_md`; then full suite.
**Depends on:** Tasks 1-6.

**Files:**
- Modify: `skills/design-committee/SKILL.md` — Checklist (lines ~46-51), Phase 2 (lines ~60-63), Phase 3/4 (lines ~64-114), frontmatter version (v0017 → v0018), `description` field if trigger wording changes.
- Modify: `skills/setup-start/references/skill-index.md:27` — two-place sync (only if `description` changes).
- Modify: `tests/test-design-committee-context-economy.sh` — `assert_skill_md` (revise the `digest` check at line 64; bump version check at line 70).

**Steps (TDD-adapted):**

- [ ] **Step 1: Revise test assertions (red).** In `assert_skill_md`, replace line 64 (`"SKILL finals step = write transcript + digest"`) and add flow/mode/checkpoint checks:

```bash
  _check "SKILL members send typed routing signal (not digest)" "grep -qi 'routing signal' '$f'"
  _check "SKILL defines one-round / two-round modes" "grep -qi 'one-round' '$f' && grep -qi 'two-round' '$f'"
  _check "SKILL flow includes synthesize+converge+scribe steps" "grep -qi 'alignment-map' '$f' && grep -qi 'verdict' '$f' && grep -qi 'scribe' '$f'"
  _check "SKILL enforces disk-artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path' '$f'"
```

Bump the version check at line 70 to: `grep -qE '^version: v00(1[8-9]|[2-9][0-9])' '$f'`.

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Edit SKILL.md.**
  - Reorder Phase 4 / per-round flow to the spec §5 eight-step sequence: dispatch → members write (Final Position) → members signal (typed routing signal) → consolidate (Final Position only) → synthesize (`alignment-map.md`, evict) → converge (`verdict.md`, evict) → author (scribe) → present (read artifact).
  - Add mode selection to Phase 2/3: **one-round** (default, single-pass; assumed when unspecified) / **two-round** (Delphi escalation, opt-in). Mode named in the convening message. Map onto Mike's existing "one round" / "two round" directive vocabulary — do not coin new names.
  - Add the checkpoint rule: each step's dispatch carries the prior step's artifact path as a required input field; absence blocks the next dispatch.
  - Register the scribe in the integration/agents list as an ephemeral per-round dispatch (like the consolidator), NOT a `TeamCreate` member.
  - Update `description` if trigger wording changed; bump frontmatter version v0017 → v0018.
- [ ] **Step 4: Two-place sync.** If `description` changed, update `skills/setup-start/references/skill-index.md:27` to match. Run `bash tests/test-design-committee-context-economy.sh` → all PASS.
- [ ] **Step 5: Full-suite regression.** `for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done` → no FAIL.
- [ ] **Step 6: Commit.**

```bash
git add skills/design-committee/SKILL.md skills/setup-start/references/skill-index.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): per-round flow reorder, one-round/two-round modes, checkpoint enforcement, routing-signal"
```

---

## Post-plan verification (AC-1, emergent)

After all seven tasks land: full bash suite green, then a manual single-round committee consult confirming team-lead context stays within the ~37–49k envelope (vs the ~297k baseline). AC-1 is only then markable complete. No single task closes it.

---

## Change Log

- 2026-06-06 — Initial plan. Seven dependency-ordered docs-producing tasks (five file edits, two new files), each keeping the integration test green by revising its own contract's assertion in the same commit. Authored by team-lead from round04 consolidator-output + alignment-map + verdict; concrete template/scribe content drawn from the round04 purist draft. Task 6 (round-format sync) added from researcher ground-truth (not in spec §9). AC-1 recorded as emergent, owned by no task.
