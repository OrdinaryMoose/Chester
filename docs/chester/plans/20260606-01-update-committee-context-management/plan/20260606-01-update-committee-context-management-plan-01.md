# Plan: Committee Context Redesign — Artifact-Boundary Process

**Sprint:** 20260606-01-update-committee-context-management
**Spec:** docs/chester/working/20260606-01-update-committee-context-management/spec/20260606-01-update-committee-context-management-spec-00.md
**Execution mode:** inline

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. All tasks are `docs-producing` (skill/agent markdown + one bash integration test). "TDD" is adapted: adjust the integration-test assertion for the contract first (red), edit the doc to satisfy it (green), run the test, commit. Execution mode is `inline` — docs-producing, one coherent skill, strict sequential dependencies.

## Goal

Re-shape the design-committee process so the team-lead stops accumulating the bulk of per-round context: every step reads a bounded prior artifact, writes its own, and evicts; authoring moves to a new scribe agent; consolidation reads only the bounded `## Final Position` section.

## Architecture

Inherited from spec. **The artifact is the boundary — separate files mandatory, separate agents optional.** Team-lead keeps two fixed functions (dispatch, present) and additionally owns synthesize (`alignment-map.md`) and converge (`verdict.md`) because those write auditable files; consolidate stays a dedicated agent (its contamination is invisible); author moves to a new scribe agent (the dominant leak). Members send the team-lead a typed routing signal only. **Single-source discipline:** the `## Final Position` schema is defined once in `member-protocol.md`; every other file cites it rather than restating the fields — so the redesign does not reproduce, one layer down, the very multi-copy drift it exists to remove.

## Tech Stack

Markdown skill/agent definitions under `skills/design-committee/` and `agents/`; one bash integration test `tests/test-design-committee-context-economy.sh` (grep-based structural assertions, with explicit insert-regions for new assert functions/calls); `chester-trailer-write` for version/provenance discipline.

## Acceptance Criteria (from spec §8 — IDs assigned here)

- **AC-1** — a four-round session keeps team-lead context within ~37–49k tokens (vs ~297k). *Emergent: not deliverable or verifiable by any single task; confirmed only after the whole pipeline lands, via the integration test plus a manual committee run. Owned by no task.*
- **AC-2** — no member prose reaches team-lead context except via the bounded pipeline artifacts.
- **AC-3** — every per-round artifact exists on disk before the next step begins (checkpoint); absence blocks the next dispatch.
- **AC-4** — consolidator output stays enumerate-only across all rounds, because its input is the capped `## Final Position` section.
- **AC-5** — dissent reaches the designer in every split session, guaranteed by a mandatory `Dissent Record` section the team-lead reads while presenting.

## Single-source rule (committee ruling F2 — read before any task)

`member-protocol.md` § Final Position is the **sole** definition of the position schema: exact header, last section, 200-word cap, `{position, rationale, blocking_risk}`, and the `blocking_risk` semantics. This applies the discipline member-protocol already carries for committee-root resolution.

- The consolidator, team-lead, SKILL.md, and scribe **cite** "per `references/member-protocol.md` § Final Position" — they do **not** restate the field names.
- In the test, the field-name greps (`position`, `rationale`, `blocking_risk`, `200`) live **only** in `assert_member_protocol`. Every other assert function checks for the **citation** (`member-protocol` + `Final Position` present together), never restated field names.
- **Bound (committee guard):** only the *field-name restatement* moves to single-source. Flow orchestration stays in SKILL.md; the two-round branch stays in team-lead.md. "Cite member-protocol" does not mean "delete the flow description."

## Test discipline (load-bearing — read before Task 1)

The integration test currently encodes the **old** contract: `assert_member_protocol` greps for `headline position`, `confidence`, `## Digest shape`; `assert_skill_md` greps SKILL.md for `digest`. These strings are removed by this redesign. The test is therefore **not** a passive regression guard — each task that changes a contract revises that contract's assertion in the **same commit**, so the suite is green at every task boundary. The file marks insert-regions: new `assert_*` functions go between the `# === ASSERTION FUNCTIONS` markers (lines 10/81); new run calls go in the run region above the final gate (lines 83/92). **Prefer structural anchors (headers, filenames, version patterns) over prose-phrase greps for every new assertion (committee ruling F7).**

## Dependency graph

- Task 1 (member-protocol + member-agent vocab) → Task 2 (consolidator) and → Task 3 (team-lead). The `## Final Position` schema is the structural ground truth both consume and cite.
- Task 4 (template) → Task 5 (scribe). The scribe receives the template path at dispatch.
- Tasks 2 and 3 are independent of each other.
- Task 6 (round-format) is independent; run after Task 3 for vocabulary consistency.
- Task 7 (SKILL.md) is strictly last — orchestration capstone referencing every concept the others define.

Execution order: **1 → 2 → 3 → 4 → 5 → 6 → 7**.

## Dissent Record (carried from round04 + round05 committee deliberation)

- **Pragmatist (F8):** rejected making the scribe's template path a runtime dispatch input — "the path is stable, researcher-confirmed, skill-internal; adding a dispatch field is over-engineering." Overruled 2-1 (Conservator, Innovator) in favor of the runtime input to remove static path coupling. Recorded so the cost is visible.
- **Conservator (F2 caveat):** single-sourcing the schema trades multi-field drift for single-heading coupling — if the `§ Final Position` heading is renamed, all five citing files break together. Accepted as the better trade (one coupling point, not many), but the caveat stands.
- **Innovator (F2 bound):** accepted only with the explicit bound that flow orchestration stays in SKILL.md; without it, Task 7 risks scope creep.
- **Pragmatist (round04, F-merge):** Tasks 1 and 2 could be one task. Rejected for boundary cleanliness and independent assertions.
- **Purist (AC-1):** AC-1 false-green risk; mitigated by the *emergent* designation — owned by no task.

---

## Task 1: member-protocol — Final Position (sole schema authority), typed routing signal, capped peer-DM; member-agent vocab cleanup

**Type:** docs-producing
**Implements:** AC-2, AC-4
**Decision budget:** 4 (Final Position schema wording; routing-signal field set; rejection-prompt wording; member-agent find-replace edge cases). Highest in the plan — this schema is the single source Tasks 2, 3, 5, 7 cite, so get it exact against spec constraints 5 & 6.
**Must remain green:** `tests/test-design-committee-context-economy.sh` — `assert_member_protocol`, `assert_advocacy_agents`, `assert_researcher_agent`, `assert_scope_and_vocab`.

**Files:**
- Modify: `skills/design-committee/references/member-protocol.md` — replace `## Digest shape` (header at line 17); extend `## Transcript and round-folder` (header at line 43); add a `## Peer-DM` section. Leave `## Committee root resolution` unchanged.
- Modify: `agents/design-committee-{conservator,innovator,pragmatist,purist,researcher}.md` — digest→routing-signal vocabulary (committee ruling F3b).
- Modify: `tests/test-design-committee-context-economy.sh` — `assert_member_protocol` (lines 11-19); add a `digest shape` ban to `assert_scope_and_vocab`.

**Steps (TDD-adapted):**

- [ ] **Step 1: Rewrite the test assertion first (red).** Replace the entire `assert_member_protocol` function body (this is a **full replacement** — verify the old `## Digest shape` / `headline position` / `confidence` checks are gone before running Step 2):

```bash
assert_member_protocol() {
  local f="$SK/references/member-protocol.md"
  _check "member-protocol exists" "[ -f '$f' ]"
  _check "member-protocol mandates Final Position section" "grep -q '## Final Position' '$f'"
  _check "member-protocol is sole Final Position schema authority" "grep -qi 'position' '$f' && grep -qi 'rationale' '$f' && grep -qi 'blocking_risk' '$f'"
  _check "member-protocol caps Final Position at 200 words" "grep -qiE '200[ -]?word' '$f'"
  _check "member-protocol defines typed routing signal" "grep -qi 'routing signal' '$f' && grep -qiE 'malformed.*reject|reject.*malformed' '$f'"
  _check "member-protocol routing-signal fields" "grep -qi 'status' '$f' && grep -q 'transcript' '$f'"
  _check "member-protocol caps peer-DM exchanges" "grep -qiE 'peer.?dm' '$f' && grep -qiE '2 (exchanges|per pair)|max 2' '$f'"
  _check "member-protocol names round-folder transcript path" "grep -q 'committee/round' '$f'"
  _check "member-protocol owns committee-root resolution (M1)" "grep -qiE 'sprint-subdir|ask the designer' '$f'"
  _check "member-protocol has citable section headings" "grep -q '## Committee root resolution' '$f'"
}
```

Also extend `assert_scope_and_vocab` (committee ruling F3b) — add inside its file loop, alongside the Mode A/B ban:

```bash
    _check "no stale digest-shape vocab in $(basename "$f")" "! grep -qi 'digest shape' '$f'"
```

- [ ] **Step 2: Run, confirm fail.** `bash tests/test-design-committee-context-economy.sh` → FAIL on the new member-protocol checks.
- [ ] **Step 3: Edit member-protocol.md (the sole schema authority).**
  - Replace `## Digest shape` with `## Routing signal (member → team-lead)`: typed signal only, schema `{member, status, round, transcript}` — these four fields are the entire body, no free text; malformed signals (any field outside the schema) are rejected unread with one correction prompt.
  - In `## Transcript and round-folder`, add the mandatory `## Final Position` requirement as the **authoritative definition**: exact header, **last section** of the transcript, 200-word cap, schema `{position, rationale, blocking_risk}`, all member-authored; `blocking_risk` = the member's own ~20-word articulation of the hardest objection to the non-chosen options (not a label, not a paraphrase). State explicitly that all other committee files cite this section rather than restating the fields.
  - Add `## Peer-DM`: schema `[sender]→[target]: [one sentence] / [target]: [one sentence]`, max 2 exchanges per pair, caveman ultra.
- [ ] **Step 4: Member-agent vocab cleanup (committee ruling F3b).** In each of `agents/design-committee-{conservator,innovator,pragmatist,purist,researcher}.md`, replace the digest vocabulary in the member→team-lead instruction with "typed routing signal per `references/member-protocol.md` § Routing signal." (~3 occurrences per file; if a file phrases it non-standardly, preserve meaning, drop the word "digest".)
- [ ] **Step 5: Run, confirm pass** (`assert_member_protocol`, `assert_advocacy_agents`, `assert_researcher_agent`, `assert_scope_and_vocab`). Verify `## Digest shape` is absent from the test file before committing.
- [ ] **Step 6: Commit.**

```bash
git add skills/design-committee/references/member-protocol.md \
        agents/design-committee-conservator.md agents/design-committee-innovator.md \
        agents/design-committee-pragmatist.md agents/design-committee-purist.md \
        agents/design-committee-researcher.md \
        tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): member-protocol owns Final Position schema + routing signal + peer-DM; member agents drop digest vocab"
```

---

## Task 2: consolidator — read-scope to Final Position only; cite schema, don't restate

**Type:** docs-producing
**Implements:** AC-4
**Decision budget:** 1
**Must remain green:** `tests/test-design-committee-context-economy.sh` — `assert_consolidator`.
**Depends on:** Task 1.

**Files:**
- Modify: `agents/design-committee-consolidator.md` — § Role (header at line ~15); add a hard prohibition.
- Modify: `tests/test-design-committee-context-economy.sh` — `assert_consolidator` (add citation + verbatim checks).

**Steps (TDD-adapted):**

- [ ] **Step 1: Add the test assertions (red).** Append to `assert_consolidator` (citation, not field restatement, per F2; verbatim per Purist's F8):

```bash
  _check "consolidator reads only Final Position section" "grep -qi 'Final Position' '$f'"
  _check "consolidator cites member-protocol for schema" "grep -qi 'member-protocol' '$f'"
  _check "consolidator copies fields verbatim" "grep -qi 'verbatim' '$f'"
```

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Edit the consolidator agent.** In the Role / "Read the round folder" instruction, replace "read every member transcript and researcher findings file" with: read **only** the `## Final Position` section (last section) of each member transcript — never the full body. Reference the schema as "the fields of `## Final Position`, per `references/member-protocol.md` § Final Position" — do **not** restate `{position, rationale, blocking_risk}`. Add to `## Hard prohibitions`: "Does NOT read transcript bodies — only `## Final Position`; reading the body defeats the bounded-input guarantee." Keep the existing verbatim / no-paraphrase prohibitions and enumeration ceiling.
- [ ] **Step 4: Run, confirm pass** (`assert_consolidator`).
- [ ] **Step 5: Commit.**

```bash
git add agents/design-committee-consolidator.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): scope consolidator to Final Position; cite member-protocol schema"
```

---

## Task 3: team-lead — synthesize + converge (write-evict), reject malformed signals, present-reads-artifact, Closure stamp targets

**Type:** docs-producing
**Implements:** AC-2, AC-3, AC-5
**Decision budget:** 3
**Must remain green:** `tests/test-design-committee-context-economy.sh` — `assert_team_lead`.
**Depends on:** Task 1.

**Files:**
- Modify: `skills/design-committee/references/team-lead.md` — Per-Round Flow (header at line ~98), Behavioral Constraints (lines ~115-120), Closure (header at line ~123), frontmatter version (v0007 → v0008).
- Modify: `tests/test-design-committee-context-economy.sh` — `assert_team_lead` (add checks; bump version check at line 59 to `> v0007`).

**Steps (TDD-adapted):**

- [ ] **Step 1: Add test assertions (red).** Append to `assert_team_lead` and bump the version check:

```bash
  _check "team-lead writes alignment-map and evicts" "grep -qi 'alignment-map' '$f' && grep -qiE 'evict|drop from context|no longer needed in context' '$f'"
  _check "team-lead writes verdict before scribe" "grep -qi 'verdict.md' '$f'"
  _check "team-lead rejects malformed signals" "grep -qiE 'malformed.*(signal|reject)|reject.*(malformed|signal)' '$f'"
  _check "team-lead reads artifact at presentation" "grep -qiE 'read .*(artifact|draft)|the read IS the review' '$f'"
  _check "team-lead enforces artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path|absence blocks' '$f'"
  _check "team-lead documents two-round mode" "grep -qiE 'two-round|revision pass|alignment.map.*feedback|alignment-map.*fed.*back' '$f'"
  _check "team-lead closure stamps new artifacts" "grep -qiE 'stamp.*alignment-map|stamp.*verdict|alignment-map.*verdict' '$f'"
  _check "team-lead cites member-protocol for schema" "grep -qi 'member-protocol' '$f'"
```

Replace the line-59 version check with: `grep -qE '^version: v00(0[8-9]|[1-9][0-9])' '$f'`.

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Edit team-lead.md.** In the Per-Round Flow, after "read consolidator-output", insert:
  - **Synthesize** — write `committee/roundNN/alignment-map.md` (alignment pattern + full option set + positions-discarded-with-reason), then evict. *(two-round only:* feed the alignment map back to members; each gets one revision pass; return to consolidate for a second round before converging.)
  - **Converge** — read `alignment-map.md`, write `committee/roundNN/verdict.md` (specific, one-sentence-minimum; ambiguous verdicts cannot proceed), then evict.
  - **Dispatch scribe** with `verdict.md` + the **artifact-template path** + `consolidator-output.md` (+ prior artifact if revising). (The template path is provided at dispatch, not hardcoded in the scribe — committee ruling F8.)
  - **Present** — read the scribe's artifact once; the read IS the review; presenting from the artifact guarantees the `Dissent Record` is seen.
  - **Checkpoint** — each step's dispatch carries the prior step's artifact path as a required input; absence blocks the next dispatch.

  Where the schema is referenced, cite "member-authored fields per `references/member-protocol.md` § Final Position" — do not restate the field names (F2). Add to Behavioral Constraints: reject malformed member signals unread; issue one correction prompt naming the required schema; do not incorporate malformed content. **Closure (committee ruling F3c):** set the stamp targets to `committee/roundNN/alignment-map.md`, `committee/roundNN/verdict.md`, and the scribe draft artifact path; **remove `committee-analysis.md` from the stamp list** (superseded). Bump frontmatter version v0007 → v0008.
- [ ] **Step 4: Run, confirm pass** (`assert_team_lead`).
- [ ] **Step 5: Commit.**

```bash
git add skills/design-committee/references/team-lead.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): team-lead synthesize/converge write-evict + signal rejection + present-reads-artifact + new stamp targets"
```

---

## Task 4: artifact template — annotated handoff template with mandatory Dissent Record

**Type:** docs-producing
**Implements:** AC-5
**Decision budget:** 2 (location per util-artifact-schema — researcher confirmed `skills/design-committee/references/` is safe, no override; which sections are annotated).
**Must remain green:** `tests/test-design-committee-context-economy.sh` — new `assert_artifact_template`.

**Files:**
- Create: `skills/design-committee/references/artifact-template.md`.
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
- [ ] **Step 3: Create `skills/design-committee/references/artifact-template.md`** (location confirmed by researcher — no util-artifact-schema override):

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

## Task 5: scribe agent — authoring fed verdict + template (path at dispatch), never the session thread

**Type:** docs-producing
**Implements:** AC-2
**Decision budget:** 2
**Must remain green:** `tests/test-design-committee-context-economy.sh` — new `assert_scribe`; `assert_scope_and_vocab`.
**Depends on:** Task 4.

**Files:**
- Create: `agents/design-committee-scribe.md`.
- Modify: `tests/test-design-committee-context-economy.sh` — add `assert_scribe` + run call; add scribe to the `assert_scope_and_vocab` file list (committee ruling F6 — scribe only; template excluded 2-1).

**Steps (TDD-adapted):**

- [ ] **Step 1: Add the test assertion + call (red), and extend the vocab sweep.**

```bash
assert_scribe() {
  local f="$AG/design-committee-scribe.md"
  _check "scribe agent exists" "[ -f '$f' ]"
  _check "scribe grants Read+Write" "grep -qE '^tools:.*Read' '$f' && grep -qE '^tools:.*Write' '$f'"
  _check "scribe fed verdict + template" "grep -qi 'verdict' '$f' && grep -qi 'template' '$f'"
  _check "scribe receives template path at dispatch (not hardcoded)" "grep -qiE 'template path|path .*(provided|at dispatch|input)' '$f'"
  _check "scribe never reads raw transcripts or session thread" "grep -qiE 'never .*(transcript|session thread)|not .*your inputs' '$f'"
  _check "scribe writes under committee/" "grep -q 'committee/' '$f'"
  _check "scribe no Mode A/B" "! grep -qE 'Mode [AB]' '$f'"
}
```

Run call (above the gate): `assert_scribe`. Add `"$AG/design-committee-scribe.md"` to the `assert_scope_and_vocab` file loop.

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Create `agents/design-committee-scribe.md`:**

````markdown
---
name: design-committee-scribe
description: Authoring agent dispatched by design-committee after convergence is complete. Receives verdict.md, the artifact-template path, and consolidator-output.md at dispatch. Writes the draft artifact to disk; returns a file pointer only. Never receives raw transcripts or the session thread. Never forks (named subagent per fork-policy).
tools: Read, Write
model: sonnet
---

**Scribe** dispatched from `design-committee`. Job: author the committee's artifact (spec, plan, or analysis) from the converged verdict and the member-position record. You write from bounded inputs; you have no access to the deliberation session or raw transcripts.

## Role

- **Spawned after convergence.** The team-lead dispatches you after `verdict.md` exists — it is a required input; you cannot start before it.
- **Read your inputs from disk.** Inputs arrive as file paths at dispatch. Read each before writing.
- **Write one artifact file.** Draft it using the artifact template (path provided at dispatch) as the structural guide. Remove template comments from the draft. Write to the path the team-lead specifies (under `committee/`).
- **Return a file pointer only.** Reply with the artifact path and a one-line confirmation. Do not paste the draft.

## Required inputs (all as file paths, provided at dispatch)

- `verdict.md` — the team-lead's specific, one-sentence-minimum decision. Primary source; write from it, do not expand it.
- artifact-template path — the annotated structural template, provided by the team-lead at dispatch (not a hardcoded path). Follow its sections, strip its comments.
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

- [ ] **Step 4: Run, confirm pass** (`assert_scribe`, `assert_scope_and_vocab`).
- [ ] **Step 5: Commit.**

```bash
git add agents/design-committee-scribe.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): scribe agent authors from verdict + dispatch-provided template"
```

---

## Task 6: round-format doc — REPLACE the old pipeline with the new per-round files

**Type:** docs-producing
**Implements:** AC-3
**Decision budget:** 1
**Must remain green:** `tests/test-design-committee-context-economy.sh` — `assert_round_format`.
**Note:** NOT in spec §9 — surfaced by round04 researcher ground-truth and confirmed Critical by round05 attack. Without it, the round-format doc describes BOTH the old (`committee-analysis.md` / Final Recommendation) and new pipeline — a self-contradictory single-source. Committee ruled (unanimous F3c, 3-1 F1): **replace, not add.**

**Files:**
- Modify: `skills/design-committee/references/committee-analysis-round-format.md` — Folder Shape (header at line ~38), How To Use steps, Template (header at line ~99).
- Modify: `tests/test-design-committee-context-economy.sh` — `assert_round_format` (add positive + negative checks).

**Steps (TDD-adapted):**

- [ ] **Step 1: Add test assertions (red).** Append to `assert_round_format`:

```bash
  _check "round-format lists alignment-map.md" "grep -qi 'alignment-map' '$f'"
  _check "round-format lists verdict.md" "grep -qi 'verdict.md' '$f'"
  _check "round-format removes superseded committee-analysis" "! grep -qi 'committee-analysis' '$f'"
```

Note: the existing `assert_round_format` checks for `Final Recommendation` and `consolidator-output` — the `committee-analysis` removal must not collide with those. Confirm the `Final Recommendation` framing is migrated to the verdict/scribe-draft pipeline, not merely deleted, so its existing assertion still has a home or is updated in the same step.

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Edit the round-format doc — REPLACE.** Remove all `committee-analysis.md` entries from the Folder Shape listing, the How To Use steps, and the Template section. Add `alignment-map.md` (synthesize output), `verdict.md` (converge output), and the scribe draft artifact in pipeline order: consolidator-output → alignment-map → verdict → scribe draft. Migrate the old "team-lead Final Recommendation" framing into the verdict + scribe-draft description (update or replace the `Final Recommendation` assertion accordingly). Keep vocabulary consistent with Tasks 1-3.
- [ ] **Step 4: Run, confirm pass** (`assert_round_format`).
- [ ] **Step 5: Commit.**

```bash
git add skills/design-committee/references/committee-analysis-round-format.md tests/test-design-committee-context-economy.sh
git commit -m "feat(design-committee): replace committee-analysis pipeline with alignment-map/verdict/scribe-draft in round-folder format"
```

---

## Task 7: SKILL.md — flow reorder, mode selection, checkpoint, digest→routing-signal (incl. Integration), version + two-place sync

**Type:** docs-producing
**Implements:** AC-1 (emergent — capstone), AC-2, AC-3
**Decision budget:** 3
**Must remain green:** `tests/test-design-committee-context-economy.sh` — `assert_skill_md`; then full suite.
**Depends on:** Tasks 1-6.

**Files:**
- Modify: `skills/design-committee/SKILL.md` — Checklist (header at line ~44), Phase 2 (lines ~60-63), Phase 3/4 (lines ~64-114), **Integration section (lines ~134-141)**, frontmatter version (v0017 → v0018), `description` field (likely unchanged — see Step 4).
- Modify: `skills/setup-start/references/skill-index.md:27` — two-place sync (only if `description` changes).
- Modify: `tests/test-design-committee-context-economy.sh` — `assert_skill_md` (revise the `digest` check at line 64; add digest-shape negative + flow/mode/checkpoint checks; bump version check at line 70).

**Steps (TDD-adapted):**

- [ ] **Step 1: Revise test assertions (red).** In `assert_skill_md`, replace line 64 (`"SKILL finals step = write transcript + digest"`) and add:

```bash
  _check "SKILL members send typed routing signal (not digest)" "grep -qi 'routing signal' '$f'"
  _check "SKILL no stale digest-shape reference" "! grep -qi 'digest shape' '$f'"
  _check "SKILL defines one-round / two-round modes" "grep -qi 'one-round' '$f' && grep -qi 'two-round' '$f'"
  _check "SKILL flow includes synthesize+converge+scribe steps" "grep -qi 'alignment-map' '$f' && grep -qi 'verdict' '$f' && grep -qi 'scribe' '$f'"
  _check "SKILL enforces disk-artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path' '$f'"
```

Bump the version check at line 70 to: `grep -qE '^version: v00(1[8-9]|[2-9][0-9])' '$f'`.

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Edit SKILL.md.**
  - Reorder Phase 4 / per-round flow to the spec §5 eight-step sequence: dispatch → members write (Final Position) → members signal (typed routing signal) → consolidate (Final Position only) → synthesize (`alignment-map.md`, evict) → converge (`verdict.md`, evict) → author (scribe) → present (read artifact). Cite the schema as "per `references/member-protocol.md` § Final Position" — do not restate fields (F2). **Flow orchestration stays here in SKILL.md** (committee bound on F2).
  - Add mode selection to Phase 2/3: **one-round** (default, single-pass; assumed when unspecified) / **two-round** (Delphi escalation, opt-in). Mode named in the convening message. Map onto Mike's existing "one round" / "two round" directive vocabulary — do not coin new names.
  - Add the checkpoint rule: each step's dispatch carries the prior step's artifact path as a required input field; absence blocks the next dispatch.
  - **Integration section (lines ~134-141, committee ruling F3a):** replace any "digest shape" reference with "routing-signal discipline"; register the scribe as an ephemeral per-round dispatch (like the consolidator), NOT a `TeamCreate` member. Fix the Phase 4 step text that says "sends a digest" → "sends a typed routing signal."
  - Bump frontmatter version v0017 → v0018.
- [ ] **Step 4: Two-place sync.** The `description` trigger wording does not reference internal process concepts (digest, scribe, modes) — it is expected to stay **unchanged**, so no `skill-index.md:27` edit is needed (committee ruling, Purist F7). If you do change `description`, update `skills/setup-start/references/skill-index.md:27` to match. Run `bash tests/test-design-committee-context-economy.sh` → all PASS.
- [ ] **Step 5: Full-suite regression.** `for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done` → no FAIL.
- [ ] **Step 6: Commit.**

```bash
git add skills/design-committee/SKILL.md tests/test-design-committee-context-economy.sh
# add skills/setup-start/references/skill-index.md ONLY if description changed
git commit -m "feat(design-committee): per-round flow reorder, one-round/two-round modes, checkpoint enforcement, routing-signal (incl. Integration)"
```

---

## Post-plan verification (AC-1, emergent)

After all seven tasks land: full bash suite green, then a manual single-round committee consult confirming team-lead context stays within the ~37–49k envelope (vs the ~297k baseline). AC-1 is only then markable complete. No single task closes it.

---

## Change Log

- 2026-06-06 — **plan-01.** Hardened revision of plan-00 incorporating round05 committee rulings on a 10-finding attack+smell+ground-truth set. Unanimous accepts folded in: F2 single-source Final Position schema (member-protocol authoritative; others cite, test field-greps only in `assert_member_protocol`), F3a/b/c residue cleanup (SKILL Integration digest-shape removal; member-agent digest→routing-signal vocab in Task 1; Closure stamp targets replace committee-analysis.md), F4 team-lead checkpoint assertion, F9 two-round assertion. Split rulings resolved by majority: F1 round-format replace-not-add (3-1) + negative assertion; F6 scribe added to vocab sweep, template excluded (2-1); F8 scribe template path becomes runtime dispatch input (2-1, Pragmatist dissent recorded) + Purist's consolidator-verbatim assertion; F5 full-replacement note (lightest form); F7 broaden the malformed-signal grep + structural-anchor principle; F10 corrected header anchors applied. Dissents recorded in the Dissent Record section. Ground-truth (researcher) validated all paths, CREATE-absences, AC coverage, and test insert-regions.
- 2026-06-06 — plan-00. Initial seven-task decomposition (round04 committee). Superseded by plan-01.
