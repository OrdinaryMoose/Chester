# Plan: Competitive Interview Flow for Step B

**Sprint:** 20260429-01-add-competitive-interview
**Spec:** `docs/chester/working/20260429-01-add-competitive-interview/spec/add-competitive-interview-spec-02.md`

> **For agentic workers:** Use `chester:execute-write` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Goal

Add a `team-interview` understanding flow option to `design-large-task` that replaces the current Phase 4 Understand Stage with a four-pole Cartesian debate over five rounds, converging by agent consensus, producing a three-section handoff artifact for the Solve Stage. Opt-in via the existing `ACTIVE_UNDERSTANDING_MCP` swap-line; existing flows (`classic`, `problemfocused`, `architectural` stub) remain untouched.

## Architecture

Hybrid: procedural skill body + sequential dialogue chain. All Step B mechanics live as named procedural steps in `skills/design-large-task/references/team-interview-flow.md`. Within each round, poles dispatch as a sequential chain so each pole sees prior poles' actual statements (Architect B optimization). The lead orchestrates the chain step-by-step from the procedural document (Architect A optimization). Four pole subagents (`agents/design-large-task-step-b-{innovator,conservator,purist,pragmatist}.md`) follow Chester's named-subagent / never-fork convention.

## Tech Stack

- Markdown (skill references, agent definitions, fork-policy doc)
- Bash test scripts (project test convention; one test per AC)
- No new MCP server; no new code execution paths
- Reuses existing swap-line pattern in `design-large-task/SKILL.md`
- Reuses existing named-subagent / fork-policy infrastructure

## Prior Decisions

*(populated by plan-build via `dr_query` at plan-start; filter: sprint-subject match OR shared-component match, status=Active)*

None. (`dr_query` returned zero records for sprint subject `add-competitive-interview` and adjacent shared-component tags. No carry-forward must-remain-green tests from prior sprints.)

---

## Task 1: Add `team-interview` swap-line option to `design-large-task/SKILL.md`

**Type:** code-producing
**Implements:** AC-3.1
**Decision budget:** 1 (formatting choice for the new option entry within the existing block)
**Must remain green:** none (new test only)

**Files:**
- Modify: `skills/design-large-task/SKILL.md:12-69` (the swap-line comment block)
- Test: `tests/test-ac-3-1-skill-swap-line.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test** (skeleton ID `ac-3-1-skill-swap-line` already exists at `tests/test-ac-3-1-skill-swap-line.sh`)

Replace the stub body with:

```bash
#!/usr/bin/env bash
# AC-3.1: design-large-task SKILL.md swap-line declares team-interview as a valid option
set -euo pipefail
ERRORS=0
SKILL="skills/design-large-task/SKILL.md"

if [ ! -f "$SKILL" ]; then
  echo "FAIL: $SKILL does not exist"
  exit 1
fi

# Variable name unchanged
if ! grep -q 'ACTIVE_UNDERSTANDING_MCP:' "$SKILL"; then
  echo "FAIL: ACTIVE_UNDERSTANDING_MCP variable not present"
  ERRORS=$((ERRORS + 1))
fi

# team-interview listed as an option in the swap-line block
if ! grep -q 'team-interview' "$SKILL"; then
  echo "FAIL: team-interview option not present in SKILL.md"
  ERRORS=$((ERRORS + 1))
fi

# Existing options preserved
for opt in classic problemfocused architectural; do
  if ! grep -q "$opt" "$SKILL"; then
    echo "FAIL: existing option $opt no longer present"
    ERRORS=$((ERRORS + 1))
  fi
done

# architectural still marked ARCHIVED
if ! grep -q 'ARCHIVED' "$SKILL"; then
  echo "FAIL: ARCHIVED marker on architectural option missing"
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -gt 0 ]; then
  echo "AC-3.1: $ERRORS check(s) failed"
  exit 1
fi
echo "AC-3.1: PASS"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-ac-3-1-skill-swap-line.sh`
Expected: `FAIL: team-interview option not present in SKILL.md` and exit 1

- [ ] **Step 3: Write minimal implementation**

Modify `skills/design-large-task/SKILL.md` swap-line comment block. Insert a new option entry between `problemfocused` and `architectural`, matching the existing format (option name — short description — MCP server line — Tools line). For team-interview, MCP server is "none" and Tools is "none — lead orchestrates pole subagents":

```
       team-interview  — Four-pole Cartesian debate over five rounds with
                         agent-consensus convergence. No MCP server. Pole
                         subagents (innovator/conservator/purist/pragmatist)
                         debate the problem framing; lead orchestrates the
                         sequential chain per references/team-interview-flow.md.
                         MCP server: none (consensus-based)
                         Tools:      none (lead orchestrates pole subagents)
```

Also update line 64-65 (the "Per-MCP per-turn flows live in:" list) to include `references/team-interview-flow.md` so the swap-line block self-documents the new flow file.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-ac-3-1-skill-swap-line.sh`
Expected: `AC-3.1: PASS`

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/SKILL.md tests/test-ac-3-1-skill-swap-line.sh
git commit -m "feat(design-large-task): add team-interview swap-line option"
```

---

## Task 2: Create `team-interview-flow.md` skeleton with all required section headers

**Type:** code-producing
**Implements:** AC-1.1, AC-1.2
**Decision budget:** 2 (exact section ordering; whether to use `Validity Tests` or `Validity-Test Checklist` as canonical heading)
**Must remain green:** none (new test only)

**Files:**
- Create: `skills/design-large-task/references/team-interview-flow.md`
- Test: `tests/test-ac-1-1-flow-file-exists.sh`, `tests/test-ac-1-2-flow-file-sections.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

Replace `tests/test-ac-1-1-flow-file-exists.sh` body:

```bash
#!/usr/bin/env bash
# AC-1.1: flow file exists at canonical path
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
if [ ! -f "$FLOW" ]; then
  echo "FAIL: $FLOW does not exist"
  exit 1
fi
if [ ! -s "$FLOW" ]; then
  echo "FAIL: $FLOW is empty"
  exit 1
fi
echo "AC-1.1: PASS"
```

Replace `tests/test-ac-1-2-flow-file-sections.sh` body:

```bash
#!/usr/bin/env bash
# AC-1.2: flow file declares all required structural sections
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0

REQUIRED_SECTIONS=(
  "Round Sequence"
  "Per-Round Phases"
  "Transcript Schema"
  "Handoff Artifact"
  "Ratification"
  "Validity"
  "Termination"
  "Resume Protocol"
  "Proof Seeding"
  "Brief-Render Read Shape"
)

for section in "${REQUIRED_SECTIONS[@]}"; do
  if ! grep -q -i "$section" "$FLOW"; then
    echo "FAIL: required section '$section' not found in $FLOW"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo "AC-1.2: $ERRORS check(s) failed"
  exit 1
fi
echo "AC-1.2: PASS"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bash tests/test-ac-1-1-flow-file-exists.sh   # FAIL: file does not exist
bash tests/test-ac-1-2-flow-file-sections.sh # FAIL: file does not exist
```

- [ ] **Step 3: Write minimal implementation**

Create `skills/design-large-task/references/team-interview-flow.md` with header matter + all required section headers. Body content for sections is filled by Tasks 3–6; this task lays down the skeleton:

```markdown
# Team-Interview Understanding-Flow

**For:** `ACTIVE_UNDERSTANDING_MCP: team-interview`
**MCP server:** none (agent-consensus convergence; no MCP)
**Tools:** none (lead orchestrates pole subagents per the procedural steps below)

This file specifies the Phase 4 Understand-Stage replacement when the swap line in `SKILL.md` is set to `team-interview`. Load and follow this file's instructions whenever SKILL.md directs you to consult the active flow reference.

Unlike `classic-mcp-flow.md` and `problemfocused-mcp-flow.md`, this flow runs no MCP server. Convergence is achieved by agent consensus across four named pole subagents over five debate rounds.

## Round-Zero Initialization (executed once, before first designer-facing turn)

(content added in Task 3)

## Round Sequence

(content added in Task 3)

## Per-Round Phases

(content added in Task 3)

## Transcript Schema

(content added in Task 5)

## Handoff Artifact

(content added in Task 4)

## Ratification

(content added in Task 4)

## Validity-Test Checklist

(content added in Task 5)

## Termination Rules

(content added in Task 5)

## Proof Seeding

(content added in Task 6)

## Brief-Render Read Shape

(content added in Task 6)

## Resume Protocol

(content added in Task 5)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bash tests/test-ac-1-1-flow-file-exists.sh   # AC-1.1: PASS
bash tests/test-ac-1-2-flow-file-sections.sh # AC-1.2: PASS
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/references/team-interview-flow.md \
        tests/test-ac-1-1-flow-file-exists.sh \
        tests/test-ac-1-2-flow-file-sections.sh
git commit -m "feat(design-large-task): create team-interview-flow.md skeleton"
```

---

## Task 3: Specify Round-Zero, Round Sequence, and Per-Round Phases

**Type:** code-producing
**Implements:** AC-1.3, AC-1.4, AC-1.5
**Decision budget:** 2 (exact wording for sequential chain semantics; whether to name R5 "synthesis" or "ratification round")
**Must remain green:** AC-1.1, AC-1.2 (regression: file still exists with all sections)

**Files:**
- Modify: `skills/design-large-task/references/team-interview-flow.md` (Round-Zero, Round Sequence, Per-Round Phases sections)
- Test: `tests/test-ac-1-3-round-opener-rotation.sh`, `tests/test-ac-1-4-sequential-chain.sh`, `tests/test-ac-1-5-r5-parallel-synthesis.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

`tests/test-ac-1-3-round-opener-rotation.sh`:

```bash
#!/usr/bin/env bash
# AC-1.3: round sequence assigns openers in order N, S, E, W, then synthesis
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
# R1=N
grep -E -i "R1.*innovator|round 1.*innovator|R1.*\bN\b" "$FLOW" > /dev/null || { echo "FAIL: R1 opener (Innovator/N) not specified"; ERRORS=$((ERRORS+1)); }
# R2=S
grep -E -i "R2.*conservator|round 2.*conservator|R2.*\bS\b" "$FLOW" > /dev/null || { echo "FAIL: R2 opener (Conservator/S) not specified"; ERRORS=$((ERRORS+1)); }
# R3=E
grep -E -i "R3.*purist|round 3.*purist|R3.*\bE\b" "$FLOW" > /dev/null || { echo "FAIL: R3 opener (Purist/E) not specified"; ERRORS=$((ERRORS+1)); }
# R4=W
grep -E -i "R4.*pragmatist|round 4.*pragmatist|R4.*\bW\b" "$FLOW" > /dev/null || { echo "FAIL: R4 opener (Pragmatist/W) not specified"; ERRORS=$((ERRORS+1)); }
# R5 synthesis
grep -E -i "R5.*synthesis|round 5.*synthesis" "$FLOW" > /dev/null || { echo "FAIL: R5 synthesis round not specified"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.3: PASS" || { echo "AC-1.3: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-1-4-sequential-chain.sh`:

```bash
#!/usr/bin/env bash
# AC-1.4: sequential chain dispatch is documented for Phase 2
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
# Phase 2 mentions sequential
grep -E -i "phase 2|opposing arguments" "$FLOW" > /dev/null || { echo "FAIL: Phase 2 / opposing arguments section missing"; ERRORS=$((ERRORS+1)); }
# Sequential / chain semantics named
grep -E -i "sequential|chain" "$FLOW" > /dev/null || { echo "FAIL: sequential chain semantics not documented"; ERRORS=$((ERRORS+1)); }
# Each opposer sees prior — opposer-2 / opposer-3 logic must appear
grep -E -i "opposer.?2|second opposer" "$FLOW" > /dev/null || { echo "FAIL: opposer-2 chain semantics not described"; ERRORS=$((ERRORS+1)); }
grep -E -i "opposer.?3|third opposer" "$FLOW" > /dev/null || { echo "FAIL: opposer-3 chain semantics not described"; ERRORS=$((ERRORS+1)); }
# Prior-chain content explicitly carried
grep -E -i "prior(-| )chain|prior(-| )pole|prior(-| )opposer" "$FLOW" > /dev/null || { echo "FAIL: prior-chain content carry-forward not stated"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.4: PASS" || { echo "AC-1.4: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-1-5-r5-parallel-synthesis.sh`:

```bash
#!/usr/bin/env bash
# AC-1.5: Round 5 specifies parallel synthesis attacks
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
# Round 5 section exists
grep -E -i "round 5|R5" "$FLOW" > /dev/null || { echo "FAIL: Round 5 section missing"; ERRORS=$((ERRORS+1)); }
# All four poles attack
grep -E -i "all four|four poles attack" "$FLOW" > /dev/null || { echo "FAIL: all-four-poles-attack semantics missing"; ERRORS=$((ERRORS+1)); }
# Parallel explicit
grep -E -i "parallel" "$FLOW" > /dev/null || { echo "FAIL: parallel attack semantics missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.5: PASS" || { echo "AC-1.5: $ERRORS check(s) failed"; exit 1; }
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bash tests/test-ac-1-3-round-opener-rotation.sh   # FAIL
bash tests/test-ac-1-4-sequential-chain.sh        # FAIL
bash tests/test-ac-1-5-r5-parallel-synthesis.sh   # FAIL
```

- [ ] **Step 3: Write minimal implementation**

Replace the placeholder content in `team-interview-flow.md` for Round-Zero, Round Sequence, and Per-Round Phases with full procedural content. Spec Data Flow steps 1–4 are the source of truth; reproduce in the flow file. Specifically:

- **Round-Zero Initialization:** classify task brownfield/greenfield internally; build the Round-Zero context packet from Phase 1–3 outputs (problem domain, prior-art findings, codebase exploration, framing + gap map). No `initialize_understanding` call. Packet becomes the prompt prefix every pole receives.
- **Round Sequence:** R1=N (Innovator), R2=S (Conservator), R3=E (Purist), R4=W (Pragmatist), R5=Synthesis (no single opener; all four poles attack the consolidated draft in parallel).
- **Per-Round Phases (R1–R4):** five named phases — Phase 1 opening argument (lead dispatches opener with packet); Phase 2 opposing arguments (sequential chain — lead dispatches the three opposers in roster order; opposer-1 receives only opener; opposer-2 receives opener + opposer-1's actual statement; opposer-3 receives opener + opposer-1 + opposer-2); Phase 3 counter-arguments (lead dispatches opener with full opposition chain); Phase 4 idea collapse (lead synthesizes surviving statement, no subagent dispatch); Phase 5 recommendation (lead writes round status: alive/wounded/dead).
- **Round 5 specifics:** lead enumerates surviving candidates, drafts a consolidated problem statement merging surviving claims, dispatches all four poles **in parallel** for synthesis attacks against the consolidated draft (no prior-pole context shared — R5 is the only round where parallel dispatch is correct), applies revisions if any attack lands, requests ratification.

Use the spec Data Flow section verbatim as a reference; translate into procedural-imperative voice for the lead.

- [ ] **Step 4: Run tests to verify they pass**

```bash
bash tests/test-ac-1-3-round-opener-rotation.sh   # AC-1.3: PASS
bash tests/test-ac-1-4-sequential-chain.sh        # AC-1.4: PASS
bash tests/test-ac-1-5-r5-parallel-synthesis.sh   # AC-1.5: PASS
bash tests/test-ac-1-1-flow-file-exists.sh        # AC-1.1: PASS (regression)
bash tests/test-ac-1-2-flow-file-sections.sh      # AC-1.2: PASS (regression)
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/references/team-interview-flow.md \
        tests/test-ac-1-3-round-opener-rotation.sh \
        tests/test-ac-1-4-sequential-chain.sh \
        tests/test-ac-1-5-r5-parallel-synthesis.sh
git commit -m "feat(design-large-task): specify team-interview round mechanics"
```

---

## Task 4: Specify Handoff Artifact, Ratification, and Voice Discipline

**Type:** code-producing
**Implements:** AC-1.6, AC-5.1
**Decision budget:** 2 (exact format of evidence-type bullets; how to anchor C1/C2 references)
**Must remain green:** AC-1.1, AC-1.2 (regression)

**Files:**
- Modify: `skills/design-large-task/references/team-interview-flow.md` (Handoff Artifact + Ratification sections; add a Voice Discipline subsection if not folded into Transcript Schema)
- Test: `tests/test-ac-1-6-handoff-three-sections.sh`, `tests/test-ac-5-1-voice-discipline-markers.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

`tests/test-ac-1-6-handoff-three-sections.sh`:

```bash
#!/usr/bin/env bash
# AC-1.6: three-section handoff artifact spec aligned with Optimize Throughput format
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -E -i "problem statement" "$FLOW" > /dev/null || { echo "FAIL: 'Problem Statement' not named"; ERRORS=$((ERRORS+1)); }
grep -E -i "consensus evidence" "$FLOW" > /dev/null || { echo "FAIL: 'Consensus Evidence' not named"; ERRORS=$((ERRORS+1)); }
grep -E -i "exit criteria" "$FLOW" > /dev/null || { echo "FAIL: 'Exit Criteria' not named"; ERRORS=$((ERRORS+1)); }
# Four evidence types
for t in codebase friction philosophy industry; do
  grep -i "$t" "$FLOW" > /dev/null || { echo "FAIL: evidence type '$t' missing"; ERRORS=$((ERRORS+1)); }
done
# Per-pole attribution rule
grep -E -i "attribut|source pole" "$FLOW" > /dev/null || { echo "FAIL: source-pole attribution rule missing"; ERRORS=$((ERRORS+1)); }
# Single-sentence rule
grep -E -i "single sentence|one sentence" "$FLOW" > /dev/null || { echo "FAIL: single-sentence rule missing"; ERRORS=$((ERRORS+1)); }
# Ratification follows
grep -E -i "ratification" "$FLOW" > /dev/null || { echo "FAIL: ratification section/block missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.6: PASS" || { echo "AC-1.6: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-5-1-voice-discipline-markers.sh`:

```bash
#!/usr/bin/env bash
# AC-5.1: flow file applies C1/C2 voice discipline markers
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -E "C1" "$FLOW" > /dev/null || { echo "FAIL: C1 marker not referenced"; ERRORS=$((ERRORS+1)); }
grep -E "C2" "$FLOW" > /dev/null || { echo "FAIL: C2 marker not referenced"; ERRORS=$((ERRORS+1)); }
grep -E -i "util-design-partner-role" "$FLOW" > /dev/null || { echo "FAIL: util-design-partner-role not referenced"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-5.1: PASS" || { echo "AC-5.1: $ERRORS check(s) failed"; exit 1; }
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bash tests/test-ac-1-6-handoff-three-sections.sh   # FAIL
bash tests/test-ac-5-1-voice-discipline-markers.sh # FAIL
```

- [ ] **Step 3: Write minimal implementation**

Fill the Handoff Artifact and Ratification sections in `team-interview-flow.md` per spec Data Flow step 6 + AC-1.6 observable boundary. Concrete content:

- **Handoff Artifact** section names three subsections: Problem Statement (single sentence — describe what makes a valid problem statement: solution-free language, falsifiable, specific, bounded), Consensus Evidence (four bullet types — codebase grounding / practitioner-friction / philosophy / industry — each bullet attributed to its source pole N/S/E/W; require explicit `*(none — disclaimed during debate)*` for any type with no bullets), Exit Criteria (testable properties any design must satisfy, or `*None derived during debate.*`).
- **Ratification** section: per-pole signoff lines, format `- {Pole}: ratified | blocked: <reason>`. Block describes the one-revision-pass policy and designer-arbitration fallback.
- **Voice Discipline** subsection (under Transcript Schema or a peer subsection): reference `util-design-partner-role` C1 (Externalized Coverage) and C2 (Fact Default with Marked Departures). State that pole transcripts apply C1 (every load-bearing premise visible in transcript); ratification dissent reasons apply C2 (mark Assumption / Opinion explicitly).

- [ ] **Step 4: Run tests to verify they pass**

```bash
bash tests/test-ac-1-6-handoff-three-sections.sh   # AC-1.6: PASS
bash tests/test-ac-5-1-voice-discipline-markers.sh # AC-5.1: PASS
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/references/team-interview-flow.md \
        tests/test-ac-1-6-handoff-three-sections.sh \
        tests/test-ac-5-1-voice-discipline-markers.sh
git commit -m "feat(design-large-task): specify handoff artifact and voice discipline"
```

---

## Task 5: Specify Transcript Schema, Validity-Test Checklist, Termination Rules, Resume Protocol

**Type:** code-producing
**Implements:** AC-1.7, AC-1.8, AC-1.9
**Decision budget:** 3 (transcript layout granularity; validity-test specifics per category; resume-from-partial-transcript policy)
**Must remain green:** AC-1.1, AC-1.2 (regression)

**Files:**
- Modify: `skills/design-large-task/references/team-interview-flow.md` (Transcript Schema + Validity-Test Checklist + Termination Rules + Resume Protocol sections)
- Test: `tests/test-ac-1-7-transcript-schema.sh`, `tests/test-ac-1-8-validity-tests.sh`, `tests/test-ac-1-9-termination-rules.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

`tests/test-ac-1-7-transcript-schema.sh`:

```bash
#!/usr/bin/env bash
# AC-1.7: per-round transcript schema is specified
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
for field in "opening argument" "opposing arguments" "counter-arguments" "idea collapse" "recommendation"; do
  grep -i "$field" "$FLOW" > /dev/null || { echo "FAIL: transcript field '$field' missing"; ERRORS=$((ERRORS+1)); }
done
[ $ERRORS -eq 0 ] && echo "AC-1.7: PASS" || { echo "AC-1.7: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-1-8-validity-tests.sh`:

```bash
#!/usr/bin/env bash
# AC-1.8: validity-test checklist is specified
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
for category in structural grounding survival handoff; do
  grep -E -i "${category}" "$FLOW" > /dev/null || { echo "FAIL: validity category '$category' missing"; ERRORS=$((ERRORS+1)); }
done
# Validity-Test Checklist heading explicit
grep -E -i "Validity[ -]Test" "$FLOW" > /dev/null || { echo "FAIL: 'Validity-Test' heading missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.8: PASS" || { echo "AC-1.8: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-1-9-termination-rules.sh`:

```bash
#!/usr/bin/env bash
# AC-1.9: termination and stage-failure rules are specified
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
# Early termination: 3+ dead → skip to synthesis
grep -E -i "3\+|three or more|3 or more" "$FLOW" > /dev/null || { echo "FAIL: '3+ statements dead' rule missing"; ERRORS=$((ERRORS+1)); }
# All four dead → stage failure
grep -E -i "all four (dead|die|killed|fail)" "$FLOW" > /dev/null || { echo "FAIL: 'all four dead → stage failure' rule missing"; ERRORS=$((ERRORS+1)); }
grep -E -i "escalat|stage failure" "$FLOW" > /dev/null || { echo "FAIL: escalation language missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.9: PASS" || { echo "AC-1.9: $ERRORS check(s) failed"; exit 1; }
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bash tests/test-ac-1-7-transcript-schema.sh    # FAIL
bash tests/test-ac-1-8-validity-tests.sh        # FAIL
bash tests/test-ac-1-9-termination-rules.sh     # FAIL
```

- [ ] **Step 3: Write minimal implementation**

Fill in flow file sections per spec:

- **Transcript Schema:** per-round transcript fields with format/layout — opening argument (3–5 sentence candidate problem statement); opposing arguments (sequential chain — three opposers each labeled with pole, prior-chain context summary); counter-arguments (one counter per opposer; concede/defend/revise + revised statement); idea collapse (surviving statement after revisions); recommendation (alive/wounded/dead + one-paragraph rationale). Voice Discipline subsection added in Task 4 lives here or as peer.
- **Validity-Test Checklist:** four categories with specific tests under each. Structural: falsifiable / specific / bounded / solution-free / generative. Grounding: codebase / friction / philosophy / industry — present-or-disclaimed (silence fails). Survival: four-pole ratification / reverse test / substitution test. Handoff: necessary-conditions derivable / scope-bounded / Solve-time estimable. Note these are informational, not gating; designer can override with logged reason.
- **Termination Rules:** Hard cap at 5 rounds. Early termination: if 3 or more R1–R4 statements end "dead", skip remaining and go straight to synthesis with surviving candidate(s). Stage failure: if all four R1–R4 statements end "dead", lead reports "no problem statement survived debate" — escalate to designer for full reframe.
- **Resume Protocol:** when `ACTIVE_UNDERSTANDING_MCP=team-interview` and `understanding-confirmed` thought is absent, recovery path reads from the in-progress process-evidence transcript file (which contains per-round transcripts written so far) rather than calling `get_understanding_state`. State the path and summarize-then-resume policy in domain language.

- [ ] **Step 4: Run tests to verify they pass**

```bash
bash tests/test-ac-1-7-transcript-schema.sh    # AC-1.7: PASS
bash tests/test-ac-1-8-validity-tests.sh        # AC-1.8: PASS
bash tests/test-ac-1-9-termination-rules.sh     # AC-1.9: PASS
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/references/team-interview-flow.md \
        tests/test-ac-1-7-transcript-schema.sh \
        tests/test-ac-1-8-validity-tests.sh \
        tests/test-ac-1-9-termination-rules.sh
git commit -m "feat(design-large-task): specify transcript schema, validity tests, termination rules, resume protocol"
```

---

## Task 6: Specify Proof Seeding Mapping, `understanding-confirmed` capture, Brief-Render Read Shape

**Type:** code-producing
**Implements:** AC-1.10, AC-1.11, AC-1.12
**Decision budget:** 2 (exact mapping table format; brief-render fallback specifics)
**Must remain green:** AC-1.1, AC-1.2 (regression)

**Files:**
- Modify: `skills/design-large-task/references/team-interview-flow.md` (Proof Seeding + Brief-Render Read Shape sections; add `understanding-confirmed` capture step at end of Round 5)
- Test: `tests/test-ac-1-10-understanding-confirmed-capture.sh`, `tests/test-ac-1-11-proof-seeding-mapping.sh`, `tests/test-ac-1-12-brief-render-read-shape.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

`tests/test-ac-1-10-understanding-confirmed-capture.sh`:

```bash
#!/usr/bin/env bash
# AC-1.10: understanding-confirmed thought capture step specified
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -F 'understanding-confirmed' "$FLOW" > /dev/null || { echo "FAIL: understanding-confirmed tag not present"; ERRORS=$((ERRORS+1)); }
grep -F 'capture_thought' "$FLOW" > /dev/null || { echo "FAIL: capture_thought call not specified"; ERRORS=$((ERRORS+1)); }
# Tied to end of Round 5
grep -E -i "round 5|R5" "$FLOW" > /dev/null && \
  awk '/round 5|R5/,/^## /I' "$FLOW" | grep -F 'understanding-confirmed' > /dev/null \
  || { echo "FAIL: understanding-confirmed not tied to Round 5 ratification"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.10: PASS" || { echo "AC-1.10: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-1-11-proof-seeding-mapping.sh`:

```bash
#!/usr/bin/env bash
# AC-1.11: handoff to proof-seeding mapping documented
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -F 'EVIDENCE' "$FLOW" > /dev/null || { echo "FAIL: EVIDENCE element not referenced"; ERRORS=$((ERRORS+1)); }
grep -F 'RULE' "$FLOW" > /dev/null || { echo "FAIL: RULE element not referenced"; ERRORS=$((ERRORS+1)); }
grep -F 'RISK' "$FLOW" > /dev/null || { echo "FAIL: RISK element not referenced"; ERRORS=$((ERRORS+1)); }
# Designer-authority-via-ratification rationale present
grep -E -i "designer.{0,30}authority|ratification.{0,30}designer" "$FLOW" > /dev/null || { echo "FAIL: designer-authority-via-ratification rationale missing"; ERRORS=$((ERRORS+1)); }
# All four evidence sources enumerated
for src in '"codebase"' '"industry"' '"friction"' '"designer"'; do
  grep -F "$src" "$FLOW" > /dev/null || { echo "FAIL: source $src not present in mapping"; ERRORS=$((ERRORS+1)); }
done
[ $ERRORS -eq 0 ] && echo "AC-1.11: PASS" || { echo "AC-1.11: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-1-12-brief-render-read-shape.sh`:

```bash
#!/usr/bin/env bash
# AC-1.12: brief-render read shape specified
set -euo pipefail
FLOW="skills/design-large-task/references/team-interview-flow.md"
ERRORS=0
grep -E -i "Brief.Render Read Shape|brief render" "$FLOW" > /dev/null || { echo "FAIL: Brief-Render Read Shape section missing"; ERRORS=$((ERRORS+1)); }
grep -E -i "process.evidence|process evidence" "$FLOW" > /dev/null || { echo "FAIL: process-evidence read source not stated"; ERRORS=$((ERRORS+1)); }
# Note absence of MCP state file
grep -E -i "no .{0,10}MCP state|no understanding state|absence of" "$FLOW" > /dev/null || { echo "FAIL: state-file-absence note missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-1.12: PASS" || { echo "AC-1.12: $ERRORS check(s) failed"; exit 1; }
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bash tests/test-ac-1-10-understanding-confirmed-capture.sh   # FAIL
bash tests/test-ac-1-11-proof-seeding-mapping.sh             # FAIL
bash tests/test-ac-1-12-brief-render-read-shape.sh           # FAIL
```

- [ ] **Step 3: Write minimal implementation**

Fill flow file sections per spec Data Flow step 7 + step 9 + AC-1.10/1.11/1.12:

- **Round 5 closure step (`understanding-confirmed` capture):** at the end of Round 5 ratification (after all four poles ratify or designer arbitrates dissent), call `capture_thought()` with tag `understanding-confirmed`, stage `Transition`. State that this is the boundary marker `SKILL.md:293` uses to track whether Understand or Solve is active; without it, Resume Protocol cannot distinguish phases.
- **Proof Seeding section:** mapping table from consensus evidence to proof elements:
  - Codebase grounding bullets → EVIDENCE elements with `source: "codebase"`
  - Industry prior art bullets → EVIDENCE elements with `source: "industry"`
  - Practitioner friction bullets → EVIDENCE elements with `source: "friction"`
  - Philosophy grounding bullets → RULE elements with `source: "designer"` — Round 5 ratification block IS the designer-authority signal authorized by `SKILL.md:445`
  - Exit criteria → RULE elements with `source: "designer"` — same authority logic
  - Ratification dissent → RISK elements basis-pointing to disputed clause
  Note that proof MCP's EVIDENCE accepts any non-null source ≠ `"designer"` (`proof-mcp/proof.js:38-46`); RULE source is locked to `"designer"` and team-interview's seeding satisfies this via the ratification-as-designer-authority rationale.
- **Brief-Render Read Shape section:** state that, in the absence of an Understanding MCP state file (no `{sprint-name}-understanding-state.json` exists for team-interview), the Phase 5 Closure brief reads from the process-evidence transcript instead. Render guidance: thinking summary captures debate evolution per round; design brief summarizes ratified consensus and captures dissent log.

- [ ] **Step 4: Run tests to verify they pass**

```bash
bash tests/test-ac-1-10-understanding-confirmed-capture.sh   # AC-1.10: PASS
bash tests/test-ac-1-11-proof-seeding-mapping.sh             # AC-1.11: PASS
bash tests/test-ac-1-12-brief-render-read-shape.sh           # AC-1.12: PASS
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/references/team-interview-flow.md \
        tests/test-ac-1-10-understanding-confirmed-capture.sh \
        tests/test-ac-1-11-proof-seeding-mapping.sh \
        tests/test-ac-1-12-brief-render-read-shape.sh
git commit -m "feat(design-large-task): specify proof seeding, transition capture, brief-render read shape"
```

---

## Task 7: Create four pole agent files

**Type:** code-producing
**Implements:** AC-2.1, AC-2.2, AC-2.3, AC-2.4
**Decision budget:** 3 (per-pole lens-specific prose; tools list per pole; exact persona-trait language)
**Must remain green:** none (new tests only; no prior-decision regressions)

**Files:**
- Create: `agents/design-large-task-step-b-innovator.md`
- Create: `agents/design-large-task-step-b-conservator.md`
- Create: `agents/design-large-task-step-b-purist.md`
- Create: `agents/design-large-task-step-b-pragmatist.md`
- Test: `tests/test-ac-2-1-pole-agents-exist.sh`, `tests/test-ac-2-2-pole-frontmatter.sh`, `tests/test-ac-2-3-pole-lens-persona.sh`, `tests/test-ac-2-4-pole-understand-stage-prohibition.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

`tests/test-ac-2-1-pole-agents-exist.sh`:

```bash
#!/usr/bin/env bash
# AC-2.1: four pole agent files exist at canonical paths
set -euo pipefail
ERRORS=0
for pole in innovator conservator purist pragmatist; do
  AGENT="agents/design-large-task-step-b-${pole}.md"
  if [ ! -f "$AGENT" ]; then
    echo "FAIL: $AGENT does not exist"
    ERRORS=$((ERRORS+1))
  fi
done
[ $ERRORS -eq 0 ] && echo "AC-2.1: PASS" || { echo "AC-2.1: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-2-2-pole-frontmatter.sh`:

```bash
#!/usr/bin/env bash
# AC-2.2: each pole agent has frontmatter with required fields
set -euo pipefail
ERRORS=0
for pole in innovator conservator purist pragmatist; do
  AGENT="agents/design-large-task-step-b-${pole}.md"
  [ -f "$AGENT" ] || { echo "FAIL: $AGENT missing (precondition for AC-2.2)"; ERRORS=$((ERRORS+1)); continue; }
  # Frontmatter delimiter at top
  head -n 1 "$AGENT" | grep -q '^---$' || { echo "FAIL: $AGENT does not start with frontmatter delimiter"; ERRORS=$((ERRORS+1)); }
  # Required keys
  for key in name description tools model; do
    grep -E "^${key}:" "$AGENT" > /dev/null || { echo "FAIL: $AGENT missing key '${key}'"; ERRORS=$((ERRORS+1)); }
  done
  # name matches role token
  EXPECTED="design-large-task-step-b-${pole}"
  grep -E "^name:[[:space:]]*${EXPECTED}" "$AGENT" > /dev/null || { echo "FAIL: $AGENT name does not match '${EXPECTED}'"; ERRORS=$((ERRORS+1)); }
done
[ $ERRORS -eq 0 ] && echo "AC-2.2: PASS" || { echo "AC-2.2: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-2-3-pole-lens-persona.sh`:

```bash
#!/usr/bin/env bash
# AC-2.3: each pole agent declares lens position and Software Architect persona
set -euo pipefail
ERRORS=0
declare -A LENS_KEYWORDS=( \
  [innovator]="change|novel|new system" \
  [conservator]="status quo|stasis|existing" \
  [purist]="philosophy|principle" \
  [pragmatist]="ship|works|outcome" \
)
PERSONA_TRAIT_PATTERN='design history|trade-offs|abstraction levels|architecture to intent|boundaries as choices'
for pole in innovator conservator purist pragmatist; do
  AGENT="agents/design-large-task-step-b-${pole}.md"
  [ -f "$AGENT" ] || { echo "FAIL: $AGENT missing"; ERRORS=$((ERRORS+1)); continue; }
  grep -E -i "${LENS_KEYWORDS[$pole]}" "$AGENT" > /dev/null || { echo "FAIL: $AGENT does not declare lens (expect: ${LENS_KEYWORDS[$pole]})"; ERRORS=$((ERRORS+1)); }
  grep -E -i "$PERSONA_TRAIT_PATTERN" "$AGENT" > /dev/null || { echo "FAIL: $AGENT does not inherit Software Architect persona traits"; ERRORS=$((ERRORS+1)); }
done
[ $ERRORS -eq 0 ] && echo "AC-2.3: PASS" || { echo "AC-2.3: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-2-4-pole-understand-stage-prohibition.sh`:

```bash
#!/usr/bin/env bash
# AC-2.4: pole agents enforce Understand-Stage prohibitions
set -euo pipefail
ERRORS=0
for pole in innovator conservator purist pragmatist; do
  AGENT="agents/design-large-task-step-b-${pole}.md"
  [ -f "$AGENT" ] || { echo "FAIL: $AGENT missing"; ERRORS=$((ERRORS+1)); continue; }
  # Prohibits solutions / design alternatives / how might we framing
  grep -E -i "no solutions|no design alternatives|no architecture suggestions|problem.statement only|Understand.Stage" "$AGENT" > /dev/null || { echo "FAIL: $AGENT does not prohibit solution language / design alternatives"; ERRORS=$((ERRORS+1)); }
done
[ $ERRORS -eq 0 ] && echo "AC-2.4: PASS" || { echo "AC-2.4: $ERRORS check(s) failed"; exit 1; }
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bash tests/test-ac-2-1-pole-agents-exist.sh                    # FAIL
bash tests/test-ac-2-2-pole-frontmatter.sh                     # FAIL
bash tests/test-ac-2-3-pole-lens-persona.sh                    # FAIL
bash tests/test-ac-2-4-pole-understand-stage-prohibition.sh    # FAIL
```

- [ ] **Step 3: Write minimal implementation**

Create four pole agent files. Use `agents/design-large-task-industry-explorer.md` (56 lines) as the structural reference. Each pole has the same base shape; the lens prose differs per pole.

Common frontmatter shape per pole:

```yaml
---
name: design-large-task-step-b-{pole}
description: Pole subagent dispatched by design-large-task during Step B (team-interview understanding flow). Plays the {N|S|E|W} ({pole-role}) advocacy position in the four-pole Cartesian debate. Produces problem-statement candidates, opposing arguments, counter-arguments, and ratification under the Understand-Stage discipline. Never forks (named subagent per fork-policy).
tools: Read, Glob, Grep
model: sonnet
---
```

Body structure per pole (adapted from industry-explorer shape):

1. **Role intro paragraph** — "You are the {pole-role} pole dispatched from `design-large-task` during Step B (team-interview understanding flow). Your job is to advocate the {N/S/E/W} position in the four-pole Cartesian debate."

2. **Lens position section** — pole-specific stance. Innovator: advocate for change ("the new system is best"); Conservator: defend status quo ("existing patterns handle it"); Purist: argue from Chester philosophy ("philosophy alone drives the answer"); Pragmatist: ship what works ("rules bend to outcomes").

3. **Software Architect persona section** — inherit from `util-design-partner-role` Stance Principles (line 130–137 of that skill): "Read code as design history. Think in trade-offs. Evaluate boundaries as choices. Align architecture to intent. Operate across abstraction levels." Apply these traits while playing your lens.

4. **Phase contract section** — describe what each phase expects from this pole (opening / opposing / counter / synthesis-attack / ratification). Pole receives a phase-specific instruction from the lead; output format matches the transcript schema in `references/team-interview-flow.md`.

5. **Understand-Stage discipline section** — explicit prohibitions (per `design-large-task/SKILL.md:369–377`): no solution proposals, no design alternatives, no architecture suggestions, no "how might we" framing, no comprehensive analyses. Your job is to produce *problem-statement candidates*, attack other poles' framings, defend yours — never to propose what to build.

6. **Voice discipline section** — apply C1 (externalized coverage — every load-bearing premise visible in your output) and C2 (mark Assumption / Opinion explicitly per `util-design-partner-role`). Recommendations are opinions.

7. **Output format section** — use the exact transcript schema field names from `team-interview-flow.md` Transcript Schema section.

- [ ] **Step 4: Run tests to verify they pass**

```bash
bash tests/test-ac-2-1-pole-agents-exist.sh                    # AC-2.1: PASS
bash tests/test-ac-2-2-pole-frontmatter.sh                     # AC-2.2: PASS
bash tests/test-ac-2-3-pole-lens-persona.sh                    # AC-2.3: PASS
bash tests/test-ac-2-4-pole-understand-stage-prohibition.sh    # AC-2.4: PASS
```

- [ ] **Step 5: Commit**

```bash
git add agents/design-large-task-step-b-*.md \
        tests/test-ac-2-1-pole-agents-exist.sh \
        tests/test-ac-2-2-pole-frontmatter.sh \
        tests/test-ac-2-3-pole-lens-persona.sh \
        tests/test-ac-2-4-pole-understand-stage-prohibition.sh
git commit -m "feat(agents): add four pole subagents for team-interview Step B"
```

---

## Task 8: Update `docs/fork-policy.md` with pole subagent dispatch rows

**Type:** docs-producing
**Implements:** AC-4.1
**Decision budget:** 1 (row numbering — extend to 1d/1e/1f/1g or add new row group)
**Must remain green:** none

**Files:**
- Modify: `docs/fork-policy.md` (Per-Dispatch Policy table)
- Test: `tests/test-ac-4-1-fork-policy-pole-rows.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
# AC-4.1: docs/fork-policy.md documents pole subagent dispatch sites
set -euo pipefail
POLICY="docs/fork-policy.md"
ERRORS=0
for pole in innovator conservator purist pragmatist; do
  AGENT_REF="chester:design-large-task-step-b-${pole}"
  grep -F "$AGENT_REF" "$POLICY" > /dev/null || { echo "FAIL: $POLICY does not document $AGENT_REF dispatch"; ERRORS=$((ERRORS+1)); }
done
# Each row marks fork policy as No / never fork
# Loose check: any row mentioning step-b should also mention No (4 such rows expected)
ROW_COUNT=$(grep -c 'step-b' "$POLICY" || true)
[ "$ROW_COUNT" -ge 4 ] || { echo "FAIL: expected >=4 rows mentioning step-b, found $ROW_COUNT"; ERRORS=$((ERRORS+1)); }
# framing rationale appears
grep -E -i "framing.side|framing-side|framing dispatch" "$POLICY" > /dev/null || { echo "FAIL: framing-side rationale not present"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-4.1: PASS" || { echo "AC-4.1: $ERRORS check(s) failed"; exit 1; }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-ac-4-1-fork-policy-pole-rows.sh`
Expected: FAIL — pole references missing

- [ ] **Step 3: Write minimal implementation**

Modify `docs/fork-policy.md`. Add four new rows to the Per-Dispatch Policy table after row 1c (the existing `design-large-task` industry-explorer entry). Numbering: 1d, 1e, 1f, 1g.

```
| 1d | `design-large-task` step-b innovator | `chester:design-large-task-step-b-innovator` | No | Framing-side dispatch — pole must not inherit sibling poles' framing or lead's analysis. |
| 1e | `design-large-task` step-b conservator | `chester:design-large-task-step-b-conservator` | No | Framing-side dispatch — same rationale as 1d. |
| 1f | `design-large-task` step-b purist | `chester:design-large-task-step-b-purist` | No | Framing-side dispatch — same rationale as 1d. |
| 1g | `design-large-task` step-b pragmatist | `chester:design-large-task-step-b-pragmatist` | No | Framing-side dispatch — same rationale as 1d. |
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-ac-4-1-fork-policy-pole-rows.sh`
Expected: `AC-4.1: PASS`

- [ ] **Step 5: Commit**

```bash
git add docs/fork-policy.md tests/test-ac-4-1-fork-policy-pole-rows.sh
git commit -m "docs(fork-policy): add four pole subagent dispatch rows for team-interview"
```

---

## Task 9: Update `design-large-task/SKILL.md` Phase 3 / Phase 4 conditionals + Resume Protocol branch + Solve Stage opening note

**Type:** code-producing
**Implements:** AC-3.2, AC-3.3
**Decision budget:** 3 (exact placement of conditional language; phrasing for "no MCP init when team-interview"; Solve Stage opening reconciliation phrasing)
**Must remain green:** AC-3.1 (regression: swap-line still has team-interview; classic/problemfocused/architectural still listed); AC-6.2 (regression: Phases 1, 2, 5 untouched)

**Files:**
- Modify: `skills/design-large-task/SKILL.md` (Phase 3 step 2; Phase 4 Understand Stage; Phase 4 Solve Stage Opening step 1; Resume Protocol section)
- Test: `tests/test-ac-3-2-skill-phase-conditional.sh`, `tests/test-ac-3-3-solve-stage-opening-conditional.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing tests**

`tests/test-ac-3-2-skill-phase-conditional.sh`:

```bash
#!/usr/bin/env bash
# AC-3.2: SKILL.md Phase 3/Phase 4 conditional on flow type
set -euo pipefail
SKILL="skills/design-large-task/SKILL.md"
ERRORS=0
# Flow file referenced
grep -F 'team-interview-flow.md' "$SKILL" > /dev/null || { echo "FAIL: team-interview-flow.md not referenced in SKILL.md"; ERRORS=$((ERRORS+1)); }
# Conditional on team-interview noted
grep -E -i 'when .{0,30}team.interview|if .{0,30}team.interview' "$SKILL" > /dev/null || { echo "FAIL: conditional on team-interview not present"; ERRORS=$((ERRORS+1)); }
# No MCP init for team-interview
grep -E -i 'no .{0,30}MCP init|no .{0,30}initialize_understanding' "$SKILL" > /dev/null || { echo "FAIL: no-MCP-init clause missing"; ERRORS=$((ERRORS+1)); }
# Round-Zero context packet still runs (positive)
grep -E -i 'context packet|round.zero' "$SKILL" > /dev/null || { echo "FAIL: round-zero context-packet preservation note missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-3.2: PASS" || { echo "AC-3.2: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-3-3-solve-stage-opening-conditional.sh`:

```bash
#!/usr/bin/env bash
# AC-3.3: SKILL.md Solve Stage opening reconciles team-ratified statement
set -euo pipefail
SKILL="skills/design-large-task/SKILL.md"
ERRORS=0
# Solve Stage opening section exists (already does)
grep -E -i 'Solve Stage Opening' "$SKILL" > /dev/null || { echo "FAIL: Solve Stage Opening section missing"; ERRORS=$((ERRORS+1)); }
# Reconciliation note for team-ratified statement
grep -E -i 'team.ratif|team consensus' "$SKILL" > /dev/null || { echo "FAIL: team-ratified-statement reconciliation note missing"; ERRORS=$((ERRORS+1)); }
# Single confirmation prompt phrasing
grep -E -i 'confirm or revise|single confirmation' "$SKILL" > /dev/null || { echo "FAIL: single-confirmation prompt language missing"; ERRORS=$((ERRORS+1)); }
[ $ERRORS -eq 0 ] && echo "AC-3.3: PASS" || { echo "AC-3.3: $ERRORS check(s) failed"; exit 1; }
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bash tests/test-ac-3-2-skill-phase-conditional.sh           # FAIL
bash tests/test-ac-3-3-solve-stage-opening-conditional.sh   # FAIL
```

- [ ] **Step 3: Write minimal implementation**

Modify `skills/design-large-task/SKILL.md`:

a. **Phase Map step 3 (line 89)** — already references `references/{ACTIVE_UNDERSTANDING_MCP}-mcp-flow.md`. Add a note that when `ACTIVE_UNDERSTANDING_MCP=team-interview`, the loaded reference is `references/team-interview-flow.md` (no `-mcp-` infix; first non-MCP flow file).

b. **Phase Map step 4 (line 90)** — currently "Initialize understanding MCP — execute the Round-Zero / Round-One initialization steps described in the active flow reference. **No designer-facing turn is permitted until initialization completes.**" Add a conditional: "When `team-interview` is the active flow, no MCP `initialize_understanding` call runs (no MCP server). Round-Zero context-packet construction still executes per the flow reference's Round-Zero Initialization section."

c. **Phase 3 step 2 (line 244)** — currently "Execute initialization per the active flow reference. … Use the state file path: `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-understanding-state.json`." Add a parenthetical: "(For `team-interview`, no state file is created — there is no Understanding MCP. The flow file's Round-Zero Initialization section specifies what to do instead: build the context packet from Phase 1–3 outputs.)"

d. **Phase 4 Understand Stage** — add a one-paragraph note at the top of the section explaining that when `team-interview` is the active flow, the per-turn cycle is the four-pole sequential-chain debate per `references/team-interview-flow.md`, not single-agent saturation scoring. The Stage Transition logic (`understanding-confirmed` thought capture) is the same — team-interview-flow.md fires that capture at the end of Round 5 ratification.

e. **Phase 4 Solve Stage Opening step 1 (line 399)** — currently: "Problem statement: polish, readback, confirm." Append a conditional note: "**When `team-interview` was the active flow,** the problem statement was already polished and ratified during Round 5 synthesis. Replace polish/readback/confirm with a single confirmation prompt: 'The team ratified this statement — confirm or revise?' If the designer revises, re-enter Round 5 synthesis with the revision; otherwise proceed to step 2."

f. **Resume Protocol (line 732)** — add a team-interview branch. Current step 2: "If absent: the Understand Stage was active. Call `get_understanding_state` …". Modify to: "If absent AND `ACTIVE_UNDERSTANDING_MCP` is `classic` / `problemfocused` / `architectural`, the Understand Stage was active under an MCP — call `get_understanding_state` with the state file path. **If absent AND `ACTIVE_UNDERSTANDING_MCP=team-interview`, the team debate was in progress — read the in-progress process-evidence transcript at `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-process-00.md` (which contains per-round transcripts written so far). Summarize current debate state (which round, which poles have spoken, surviving statements) in domain language and resume the next round per `references/team-interview-flow.md`."

- [ ] **Step 4: Run tests to verify they pass**

```bash
bash tests/test-ac-3-2-skill-phase-conditional.sh           # AC-3.2: PASS
bash tests/test-ac-3-3-solve-stage-opening-conditional.sh   # AC-3.3: PASS
bash tests/test-ac-3-1-skill-swap-line.sh                   # AC-3.1: PASS (regression)
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/SKILL.md \
        tests/test-ac-3-2-skill-phase-conditional.sh \
        tests/test-ac-3-3-solve-stage-opening-conditional.sh
git commit -m "feat(design-large-task): conditional Phase 3/4 + Solve Stage opening + Resume Protocol for team-interview"
```

---

## Task 10: Regression sweep — verify untouched files

**Type:** docs-producing
**Implements:** AC-6.1, AC-6.2
**Decision budget:** 0 (no decisions; pure verification)
**Must remain green:** all prior AC tests (full suite regression)

**Files:**
- Test: `tests/test-ac-6-1-existing-flows-unchanged.sh`, `tests/test-ac-6-2-untouched-phases.sh`

No production-file changes in this task. The tests verify other tasks didn't accidentally modify protected files.

**Steps (TDD):**

- [ ] **Step 1: Write the tests**

`tests/test-ac-6-1-existing-flows-unchanged.sh`:

```bash
#!/usr/bin/env bash
# AC-6.1: classic-mcp-flow.md, problemfocused-mcp-flow.md, architectural-mcp-flow.md unmodified
set -euo pipefail
ERRORS=0
for flow in classic-mcp-flow.md problemfocused-mcp-flow.md architectural-mcp-flow.md; do
  FLOW="skills/design-large-task/references/${flow}"
  [ -f "$FLOW" ] || { echo "FAIL: $FLOW does not exist"; ERRORS=$((ERRORS+1)); continue; }
  # Compare against main
  if git diff --quiet main -- "$FLOW"; then
    : # no diff
  else
    echo "FAIL: $FLOW differs from main"
    git diff --stat main -- "$FLOW" || true
    ERRORS=$((ERRORS+1))
  fi
done
[ $ERRORS -eq 0 ] && echo "AC-6.1: PASS" || { echo "AC-6.1: $ERRORS check(s) failed"; exit 1; }
```

`tests/test-ac-6-2-untouched-phases.sh`:

```bash
#!/usr/bin/env bash
# AC-6.2: SKILL.md Phases 1, 2, 5 sections semantically unchanged
# Heading-anchored approach (line-number-independent; survives Task 9's content insertions).
set -euo pipefail
SKILL="skills/design-large-task/SKILL.md"
ERRORS=0

# Required headings still present (renaming or removal would be a structural break)
for heading in "## Phase 1: Bootstrap" "## Phase 2: Parallel Context Exploration" "## Phase 5: Closure"; do
  grep -F "$heading" "$SKILL" > /dev/null || { echo "FAIL: heading '$heading' missing or renamed"; ERRORS=$((ERRORS+1)); }
done

# Extract each protected section by heading, both from main and current branch, and compare.
# A protected section spans from its heading to the next "## Phase " heading (or EOF for Phase 5).
extract_section() {
  local file="$1" start="$2" end="$3"
  if [ -n "$end" ]; then
    awk -v s="$start" -v e="$end" '
      $0 ~ s { capture=1 }
      capture && $0 ~ e && $0 != s { exit }
      capture { print }
    ' "$file"
  else
    awk -v s="$start" '
      $0 ~ s { capture=1 }
      capture { print }
    ' "$file"
  fi
}

# Get main version of SKILL.md to /tmp
git show main:"$SKILL" > /tmp/skill-main.md 2>/dev/null || { echo "FAIL: cannot read main:$SKILL"; exit 1; }

# Compare each protected section
for pair in "## Phase 1: Bootstrap|## Phase 2:" "## Phase 2: Parallel Context Exploration|## Phase 3:" "## Phase 5: Closure|"; do
  start="${pair%|*}"
  end="${pair#*|}"
  diff <(extract_section "$SKILL" "$start" "$end") <(extract_section /tmp/skill-main.md "$start" "$end") > /tmp/ac62-section-diff.txt 2>&1 || true
  if [ -s /tmp/ac62-section-diff.txt ]; then
    echo "FAIL: protected section '$start' has semantic changes vs main"
    cat /tmp/ac62-section-diff.txt
    ERRORS=$((ERRORS+1))
  fi
done

[ $ERRORS -eq 0 ] && echo "AC-6.2: PASS" || { echo "AC-6.2: $ERRORS check(s) failed"; exit 1; }
```

- [ ] **Step 2: Run tests to verify they pass (no implementation needed)**

```bash
bash tests/test-ac-6-1-existing-flows-unchanged.sh    # AC-6.1: PASS
bash tests/test-ac-6-2-untouched-phases.sh            # AC-6.2: PASS
```

- [ ] **Step 3: Run full test suite as a final sweep**

```bash
for t in tests/test-ac-*.sh; do
  echo "=== $t ==="
  bash "$t" || { echo "REGRESSION: $t failed"; exit 1; }
done
echo "All AC tests PASS"
```

Expected: every AC test in the manifest reports PASS.

- [ ] **Step 4: (No-op — no implementation file to write; tests are the deliverable)**

- [ ] **Step 5: Commit**

```bash
git add tests/test-ac-6-1-existing-flows-unchanged.sh tests/test-ac-6-2-untouched-phases.sh
git commit -m "test: regression sweep for untouched flow files and SKILL.md phases"
```

---

## Verification Sweep

After Task 10 commits, run the full manifest one more time as a final gate:

```bash
for t in tests/test-ac-*.sh; do
  bash "$t" || { echo "FAIL: $t"; exit 1; }
done
echo "All 23 AC tests pass — sprint complete."
```

The manual acceptance gate (running a real sprint with `ACTIVE_UNDERSTANDING_MCP: team-interview` set) is out of test-suite scope per the spec; that gate happens after merge.
