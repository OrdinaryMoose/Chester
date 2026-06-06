# Pragmatist Plan Proposal — Round 04
# Sprint: 20260606-01-update-committee-context-management
# Date: 2026-06-06

This is the pragmatist member's task decomposition for plan-build consolidation.
Produced from the approved spec (spec-00.md) and the round03 consolidated design (12 constraints).

---

## Plan: Committee Context Redesign — Artifact-Boundary Process

**Sprint:** 20260606-01-update-committee-context-management
**Spec:** docs/chester/working/20260606-01-update-committee-context-management/spec/20260606-01-update-committee-context-management-spec-00.md
**Execution mode:** inline

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Update the design-committee skill files to enforce the artifact-boundary process: member Final Position schema, consolidator read-scoping, new scribe agent, team-lead synthesize/converge/evict steps, SKILL.md flow reorder and mode selection, and test coverage for all new contracts.

## Architecture

All changes are docs-producing edits to existing skill files and one new agent file. The dependency chain is: member-protocol (Final Position schema) → consolidator read-scope → annotated artifact template → scribe agent → team-lead.md (new flow steps) → SKILL.md (flow reorder + mode) → tests. No code is changed; the bash test suite in tests/test-design-committee-context-economy.sh is the green gate.

## Tech Stack

Markdown skill files, bash test assertions.

---

## Task 1: member-protocol.md — Final Position schema + routing signal + peer-DM schema; consolidator read-scope

**Type:** docs-producing
**Implements:** AC-6.5, AC-6.6, AC-6.1, AC-6.2, AC-6.3, AC-6.4
**Decision budget:** 1
**Must remain green:** `tests/test-design-committee-context-economy.sh` (assert_member_protocol, assert_consolidator)

**Files:**
- Modify: `skills/design-committee/references/member-protocol.md`
- Modify: `agents/design-committee-consolidator.md`

**Steps:**

- [ ] **Step 1: Write the failing test assertions**

Add to `tests/test-design-committee-context-economy.sh` inside the `=== ASSERTION FUNCTIONS ===` block:

```bash
assert_member_protocol_final_position() {
  local f="$SK/references/member-protocol.md"
  _check "member-protocol has ## Final Position section" "grep -q '## Final Position' '$f'"
  _check "member-protocol Final Position is last section" \
    "awk '/^## Final Position/{found=1} found && /^## [^F]/{exit 1} END{exit !found}' '$f'"
  _check "member-protocol Final Position schema has position field" "grep -qi 'position' '$f'"
  _check "member-protocol Final Position schema has rationale field" "grep -qi 'rationale' '$f'"
  _check "member-protocol Final Position schema has blocking_risk field" "grep -qi 'blocking_risk' '$f'"
  _check "member-protocol routing-signal schema present" "grep -qi 'routing.signal\|routing signal' '$f'"
  _check "member-protocol routing-signal schema has member field" "grep -qiE 'member.*:.*<' '$f'"
  _check "member-protocol routing-signal malformed-rejection rule" "grep -qi 'reject\|rejected' '$f'"
  _check "member-protocol peer-DM schema present" "grep -qiE 'peer.DM schema\|peer DM schema' '$f'"
  _check "member-protocol peer-DM cap stated" "grep -qiE '2 exchange|max 2|capped' '$f'"
}
assert_consolidator_read_scope() {
  local f="$AG/design-committee-consolidator.md"
  _check "consolidator reads Final Position section only" "grep -qiE 'Final Position' '$f'"
  _check "consolidator does not read full transcripts" "! grep -qi 'full transcript\|entire transcript' '$f'"
}
```

Add calls inside `=== RUN ===` block above the final gate:
```bash
assert_member_protocol_final_position
assert_consolidator_read_scope
```

- [ ] **Step 2: Run test to verify new assertions fail**

Run: `bash tests/test-design-committee-context-economy.sh 2>&1 | grep FAIL`
Expected: FAIL on new assertions (Final Position section not yet present)

- [ ] **Step 3: Add `## Final Position` section to member-protocol.md**

After the `## Write-then-send sequencing` section, add a new `## Final Position` section:

```markdown
## Final Position

Every member's transcript must end with a mandatory `## Final Position` section. It is the **last section** of the transcript — no content follows it. The Consolidator reads only this section; the team-lead sees only the digest (which routes to this section's fields). The section must use this exact heading and schema:

```
## Final Position

**position:** <one sentence — the member's bottom-line answer for this round>
**rationale:** <one-to-three sentences — why this position; the load-bearing facts>
**blocking_risk:** <~20 words, member's own framing — the hardest objection to the options the member did NOT choose>
```

Three fields, all member-authored. The 200-word cap covers the entire section. Do not exceed it; the Consolidator's enumerate-only ceiling depends on bounded input.

## Routing signal schema

After writing the transcript, each member sends the team-lead a **typed routing signal only** — no prose, no reasoning, no argument. The signal body is exactly these fields:

```
member:     <the member's assigned perspective>
status:     done
round:      <NN — zero-padded round number>
transcript: committee/roundNN/<member>-transcript.md
```

Any field outside this schema is **malformed**. The team-lead rejects malformed signals unread and sends one correction prompt. Do not attempt to add context, hedges, or explanations to the signal body.

## Peer-DM schema

Members may DM each other direct (peer-to-peer via `SendMessage`). The format is capped:

```
[sender]→[target]: <one sentence>
[target]: <one sentence>
```

Maximum 2 exchanges per pair per round. No team-lead relay during peer DM.
```

- [ ] **Step 4: Update consolidator.md to scope reads to `## Final Position` only**

Replace the current "Read the round folder" instruction in the consolidator agent file with explicit scoping:

In `agents/design-committee-consolidator.md`, update the `## Role` section bullet "Read the round folder" to:

```
- **Read only the `## Final Position` section of each transcript.** Use `Read` + `Glob` to locate each member transcript under the `committee/roundNN/` path you were given. From each file, read only the `## Final Position` section (the last section, 200-word cap). Do not read full transcripts. The Consolidator's enumerate-only ceiling is enforced by bounded input — reading full transcripts would break that invariant.
```

- [ ] **Step 5: Run test to verify assertions pass**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add skills/design-committee/references/member-protocol.md agents/design-committee-consolidator.md tests/test-design-committee-context-economy.sh
git commit -m "feat(committee): add Final Position schema, routing-signal schema, peer-DM schema; scope consolidator reads to Final Position only"
```

---

## Task 2: Annotated artifact template with mandatory Dissent Record

**Type:** docs-producing
**Implements:** AC-6.10, AC-6.11
**Decision budget:** 1
**Must remain green:** `tests/test-design-committee-context-economy.sh`

**Files:**
- Create: `skills/design-committee/references/committee-artifact-template.md`

**Steps:**

- [ ] **Step 1: Write the failing test assertion**

Add to `tests/test-design-committee-context-economy.sh` inside the `=== ASSERTION FUNCTIONS ===` block:

```bash
assert_artifact_template() {
  local f="$SK/references/committee-artifact-template.md"
  _check "artifact template exists" "[ -f '$f' ]"
  _check "artifact template has Dissent Record section" "grep -q '## Dissent Record' '$f'"
  _check "artifact template Dissent Record is a named header, not prose" \
    "grep -q '^## Dissent Record' '$f'"
}
```

Add call inside `=== RUN ===` block:
```bash
assert_artifact_template
```

- [ ] **Step 2: Run test to verify assertion fails**

Run: `bash tests/test-design-committee-context-economy.sh 2>&1 | grep FAIL`
Expected: FAIL on artifact-template assertions

- [ ] **Step 3: Create committee-artifact-template.md**

Create `skills/design-committee/references/committee-artifact-template.md` with:
- Header describing the template's purpose (fed to scribe; not for team-lead authoring)
- Instruction: scribe receives this template, verdict.md, and consolidator-output.md
- Template body covering: title/provenance block, question block, options with advantages/disadvantages/implications, recommendation block
- **Mandatory named section:** `## Dissent Record` — this is a required header in every committee artifact (spec §6 constraint 11); note that it must be present even when members fully converged (state "None — 4-0 convergence" rather than omitting the section)
- Scribe constraint note: scribe receives verdict.md + this template + consolidator-output.md; never raw transcripts or session thread; never starts before verdict.md is written

- [ ] **Step 4: Run test to verify assertions pass**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/committee-artifact-template.md tests/test-design-committee-context-economy.sh
git commit -m "feat(committee): add annotated artifact template with mandatory Dissent Record section"
```

---

## Task 3: New scribe agent — agents/design-committee-scribe.md

**Type:** docs-producing
**Implements:** AC-6.10 (scribe receives bounded inputs)
**Decision budget:** 2
**Must remain green:** `tests/test-design-committee-context-economy.sh`

**Files:**
- Create: `agents/design-committee-scribe.md`

**Steps:**

- [ ] **Step 1: Write the failing test assertion**

Add to `tests/test-design-committee-context-economy.sh` inside `=== ASSERTION FUNCTIONS ===`:

```bash
assert_scribe_agent() {
  local f="$AG/design-committee-scribe.md"
  _check "scribe agent exists" "[ -f '$f' ]"
  _check "scribe grants Write" "grep -qE '^tools:.*Write' '$f'"
  _check "scribe input is verdict.md + template + consolidator-output" \
    "grep -qi 'verdict' '$f' && grep -qi 'template' '$f' && grep -qi 'consolidator-output' '$f'"
  _check "scribe never receives raw transcripts" "grep -qi 'never.*transcript\|not.*transcript' '$f'"
  _check "scribe cannot start before convergence complete" \
    "grep -qi 'verdict.*written\|convergence.*complete\|verdict.*complete' '$f'"
  _check "scribe output is pointer-only reply to team-lead" "grep -qi 'pointer\|path only\|artifact path' '$f'"
}
```

Add call inside `=== RUN ===` block:
```bash
assert_scribe_agent
```

- [ ] **Step 2: Run test to verify assertion fails**

Run: `bash tests/test-design-committee-context-economy.sh 2>&1 | grep FAIL`
Expected: FAIL on scribe-agent assertions

- [ ] **Step 3: Create agents/design-committee-scribe.md**

Model after existing agent files (conservator, consolidator) but with authoring role. Required elements per spec §5 step 7 and §6 constraint 10:
- Frontmatter: name, description, tools (Read + Write; no Glob needed — receives explicit paths), model: sonnet
- Role: dedicated authoring agent; fed verdict.md + annotated template + consolidator-output.md (+ prior artifact version if revising); never raw transcripts; never session thread; cannot start before verdict.md is written
- Job: produce the draft committee artifact (spec, plan, or committee-analysis draft) from bounded inputs
- Output: write artifact to the path specified in the dispatch; reply to team-lead with the artifact path only (pointer reply, not content paste)
- Hard prohibitions: no design opinion of its own; no reading of transcripts; no reading of session thread; content is dictated by verdict.md
- Tool grant: Read (for verdict.md, template, consolidator-output, prior artifact if revising) + Write (for the output artifact)

- [ ] **Step 4: Run test to verify assertions pass**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add agents/design-committee-scribe.md tests/test-design-committee-context-economy.sh
git commit -m "feat(committee): add scribe agent for bounded artifact authoring"
```

---

## Task 4: team-lead.md — synthesize/converge/evict steps; malformed-signal rejection; present-reads-artifact

**Type:** docs-producing
**Implements:** AC-6.7, AC-6.8, AC-6.9 (synthesize + converge artifacts); signal rejection (AC-6.6 team-lead side); present-as-read (AC-6.11 Dissent Record guarantee)
**Decision budget:** 1
**Must remain green:** `tests/test-design-committee-context-economy.sh` (assert_team_lead)

**Files:**
- Modify: `skills/design-committee/references/team-lead.md`

**Steps:**

- [ ] **Step 1: Write the failing test assertion**

Add to `tests/test-design-committee-context-economy.sh` inside `=== ASSERTION FUNCTIONS ===`:

```bash
assert_team_lead_new_contracts() {
  local f="$SK/references/team-lead.md"
  _check "team-lead synthesize step writes alignment-map.md" "grep -q 'alignment-map' '$f'"
  _check "team-lead converge step writes verdict.md" "grep -q 'verdict.md' '$f'"
  _check "team-lead synthesize evicts after write" "grep -qiE 'evict' '$f'"
  _check "team-lead rejects malformed routing signals" \
    "grep -qiE 'reject.*malform|malform.*reject' '$f'"
  _check "team-lead present step reads artifact" \
    "grep -qiE 'read.*artifact|reads.*artifact|read.*draft' '$f'"
}
```

Add call inside `=== RUN ===` block:
```bash
assert_team_lead_new_contracts
```

- [ ] **Step 2: Run test to verify assertion fails**

Run: `bash tests/test-design-committee-context-economy.sh 2>&1 | grep FAIL`
Expected: FAIL on new team-lead assertions

- [ ] **Step 3: Update team-lead.md Per-Round Flow**

In the `#### Per-Round Flow` section, replace the current steps 4-8 with the spec-conforming sequence:

```
4. **Dispatch the Consolidator** — dispatch the Consolidator with this round's `committee/roundNN/` path. Consolidator reads only each member's `## Final Position` section, writes `consolidator-output.md`.
5. **Synthesize** — read `consolidator-output.md`. Write `alignment-map.md` (alignment pattern + option set + discarded-with-reason). Evict `consolidator-output.md` from context after writing.
   - *two-round only:* feed alignment-map.md back to members; each revises once; return to Consolidator for a second pass.
6. **Converge** — read `alignment-map.md`. Write `verdict.md` (specific, one-sentence-minimum; ambiguous verdicts cannot proceed). Evict `alignment-map.md` from context after writing.
7. **Author** — dispatch the scribe with: `verdict.md` path + annotated template path + `consolidator-output.md` path (+ prior artifact path if revising). Scribe writes the draft artifact and returns a pointer only.
8. **Present** — read the draft artifact (this read IS the review; the mandatory `Dissent Record` section is therefore guaranteed to be seen). Present decision packet to designer.
```

Add to Behavioral Constraints (or a new subsection):
```
- **Malformed routing signals are rejected unread.** If a member sends a signal with any field outside the schema `{member, status, round, transcript}`, reject it with one correction prompt. Do not read the extra content.
```

Bump version field: `v0007 → v0008`

- [ ] **Step 4: Run test to verify assertions pass**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md tests/test-design-committee-context-economy.sh
git commit -m "feat(committee): team-lead synthesize/converge/evict steps; malformed signal rejection; present-reads-artifact"
```

---

## Task 5: SKILL.md — per-round flow reorder, one-round/two-round mode selection, scribe integration, version bump, two-place sync

**Type:** docs-producing
**Implements:** AC-6.4 (pipeline checkpoint), AC-6.7 (synthesize/converge on team-lead), mode selection from §4
**Decision budget:** 2
**Must remain green:** `tests/test-design-committee-context-economy.sh` (assert_skill_md)

**Files:**
- Modify: `skills/design-committee/SKILL.md`
- Modify: `skills/setup-start/SKILL.md` (two-place sync check; description + version only)

**Steps:**

- [ ] **Step 1: Write the failing test assertion**

Add to `tests/test-design-committee-context-economy.sh` inside `=== ASSERTION FUNCTIONS ===`:

```bash
assert_skill_md_new_contracts() {
  local f="$SK/SKILL.md"
  _check "SKILL.md references scribe integration" "grep -qi 'scribe' '$f'"
  _check "SKILL.md references verdict.md" "grep -q 'verdict' '$f'"
  _check "SKILL.md references alignment-map" "grep -q 'alignment-map' '$f'"
  _check "SKILL.md has one-round/two-round mode" \
    "grep -qiE 'one.round|two.round|one round|two round' '$f'"
  _check "SKILL.md checkpoint enforcement language present" \
    "grep -qiE 'checkpoint|prior artifact path|required input' '$f'"
}
```

Add call inside `=== RUN ===` block:
```bash
assert_skill_md_new_contracts
```

- [ ] **Step 2: Run test to verify assertion fails**

Run: `bash tests/test-design-committee-context-economy.sh 2>&1 | grep FAIL`
Expected: FAIL on new SKILL.md assertions

- [ ] **Step 3: Update SKILL.md Phase 2 with mode selection**

In `## Phase 2: Capture Question`, add:

```
Mode (captured alongside the question): **one-round** (default) or **two-round** (Delphi escalation, opt-in). one-round assumed when unspecified; the dispatcher states the mode in the convening message.
```

- [ ] **Step 4: Update SKILL.md Phase 4/5 flow and Integration section**

In `## Phase 4: Deliberation`, update One-Round-Format step 4 (the digest/transcript step) to reference the `## Final Position` mandatory section requirement and routing-signal schema per `references/member-protocol.md`.

In `## Phase 5: Tear Down`, update the reference from "consolidation, presentation" to reflect the new artifact pipeline (consolidate → synthesize → converge → author → present) per `references/team-lead.md`.

In `## Integration`, add to the `Calls:` line: `chester:design-committee-scribe` (authoring dispatch after convergence).

Add a brief checkpoint-enforcement note:
```
Each step's dispatch carries the prior artifact path as a required input field — the checkpoint is observable by inspection.
```

- [ ] **Step 5: Bump version field**

Bump `version: v0017 → v0018`

- [ ] **Step 6: Two-place sync check**

Verify setup-start SKILL.md has no stale design-committee entry (grep confirmed empty — no entry to update). The description field in SKILL.md frontmatter already describes the committee primitive accurately; confirm it covers the mode selection addition.

- [ ] **Step 7: Run test to verify assertions pass**

Run: `bash tests/test-design-committee-context-economy.sh`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add skills/design-committee/SKILL.md
git commit -m "feat(committee): SKILL.md flow reorder, one-round/two-round mode, scribe integration, checkpoint enforcement, v0018"
```

---

## Task 6: Test extensions — assert_* for all new contracts (consolidation pass)

**Type:** docs-producing
**Implements:** all 12 AC constraints — coverage verification pass
**Decision budget:** 3
**Must remain green:** `tests/test-design-committee-context-economy.sh`

**Files:**
- Modify: `tests/test-design-committee-context-economy.sh`

**Steps:**

- [ ] **Step 1: Audit coverage**

Review all 12 spec constraints against existing + Tasks 1-5 added assertions. Identify any gap.

Expected gaps to fill:
- Constraint 1 (consolidator off-TL): already covered by `assert_consolidator` (existing).
- Constraint 2 (Final Position section only): `assert_consolidator_read_scope` (Task 1).
- Constraint 3 (verbatim copy): `assert_consolidator` prohibits interpretation (existing) — confirm "verbatim" is specifically checked.
- Constraint 4 (enumerate-only bounded by input): existing `assert_consolidator` + Task 1 read-scope.
- Constraint 5 (Final Position mandatory, last section, 200-word cap, schema): `assert_member_protocol_final_position` (Task 1).
- Constraint 6 (blocking_risk member-authored, ~20 words): `assert_member_protocol_final_position` checks schema fields.
- Constraint 7 (synthesize/converge on TL; contamination auditable): `assert_team_lead_new_contracts` (Task 4).
- Constraint 8 (alignment-map.md written before convergence): `assert_team_lead_new_contracts` (Task 4).
- Constraint 9 (verdict.md specific, one-sentence-minimum, blocks ambiguous): `assert_team_lead_new_contracts` (Task 4).
- Constraint 10 (scribe inputs bounded): `assert_scribe_agent` (Task 3).
- Constraint 11 (Dissent Record mandatory named section): `assert_artifact_template` (Task 2).
- Constraint 12 (disk-artifact checkpoint per step): `assert_skill_md_new_contracts` (Task 5).

- [ ] **Step 2: Add any gap-fill assertions**

If constraint 3 ("verbatim") is not explicitly asserted, add:
```bash
_check "consolidator verbatim copy stated" "grep -qi 'verbatim' '$AG/design-committee-consolidator.md'"
```

Add any remaining coverage gaps identified in Step 1. Keep assertions structural (file exists, header exists, key term present) — do not assert behavioral outcomes prose cannot prove.

- [ ] **Step 3: Run full suite**

Run: `for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done`
Expected: all scripts exit 0

- [ ] **Step 4: Commit**

```bash
git add tests/test-design-committee-context-economy.sh
git commit -m "test(committee): consolidation pass — full 12-constraint coverage verification"
```
