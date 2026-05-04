# Review Session Behaviour — Local Skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use execute-write (recommended) or execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new local user-level Claude Code skill at `~/.claude/skills/review-session-behaviour/SKILL.md` that reads a Chester sprint's jsonl archive and writes a structured behavioural post-mortem report to `{sprint-path}/summary/behavioural-read-NN.md`.

**Architecture:** Single-file SKILL.md. Procedural markdown documenting a sequence of bash + jq + grep commands that the invoking agent executes. The skill file itself carries an editable Pattern Library section (rationalization vocabulary, scaffold-invocation strings) that the user expands over time. No separate scripts, no external config, no runtime beyond Bash/jq/grep.

**Tech Stack:** Bash, `jq`, `grep`, markdown.

---

## File Structure

**Single file created:**

- `~/.claude/skills/review-session-behaviour/SKILL.md` — the complete skill definition

**Files read during validation (not modified):**

- `docs/chester/plans/20260410-02-add-attack-specify/summary/add-attack-specify-session.jsonl` — validation fixture 1
- `docs/chester/plans/20260408-03-plan-mode-design-guard/summary/session.jsonl` — validation fixture 2
- `docs/chester/plans/20260403-02-architect-pacing-optimization/summary/session.jsonl` — validation fixture 3

**Output files produced during Task 9 validation (stay in Chester repo):**

- `docs/chester/plans/20260410-02-add-attack-specify/summary/behavioural-read-00.md`
- `docs/chester/plans/20260408-03-plan-mode-design-guard/summary/behavioural-read-00.md`
- `docs/chester/plans/20260403-02-architect-pacing-optimization/summary/behavioural-read-00.md`

## TDD Adaptation Note

This deliverable is a procedural markdown document, not runtime code. Traditional unit TDD doesn't apply. Each task's verification step runs the documented bash/jq/grep command against a real jsonl fixture and inspects output. Tasks 2–8 each build one section of SKILL.md; the verification is "the command documented in this section produces expected output against fixture 1." Task 9 is the full integration validation against three fixtures.

Red-Green-Refactor becomes:
- **Red:** Run the command; it fails or produces wrong output because the pattern/query is missing or wrong.
- **Green:** Add the pattern/query to SKILL.md until the command produces expected output.
- **Refactor:** Inline, not a separate step — tighten wording, align naming with earlier sections.

---

## Task 1: Scaffold skill file with frontmatter and section headers

**Files:**
- Create: `~/.claude/skills/review-session-behaviour/SKILL.md`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p ~/.claude/skills/review-session-behaviour
```

Expected: directory exists with no errors.

- [ ] **Step 2: Write the initial SKILL.md with frontmatter and section scaffolding**

Write exactly this content to `~/.claude/skills/review-session-behaviour/SKILL.md`:

````markdown
---
name: review-session-behaviour
description: Produce a behavioural post-mortem report from an archived Chester sprint's jsonl session transcript. Extracts rationalization events, verification sequences, and scaffold utilization signals. Writes a versioned report to {sprint-path}/summary/behavioural-read-NN.md. Single-session only — aggregation across sessions is manual. Invoke with a sprint path argument.
---

# Review Session Behaviour

## Overview

This skill reads a Chester sprint's jsonl session transcript and produces a structured behavioural post-mortem. The report surfaces three signal clusters — rationalization events, verification sequences, and scaffold utilization — and presents raw evidence for the invoking designer to judge. The skill does not classify events as compliance vs deviation; it presents the sequences and lets the reader form judgment.

## When to Use

Invoke manually when you want to inspect how a past Chester sprint actually behaved — did the model rationalize, did it skip verification, did the skill's scaffolding land in reasoning. Useful for calibrating which parts of Chester's skill content are load-bearing vs ceremonial under the model that ran the session.

## Invocation

```
/review-session-behaviour <sprint-path>
```

Where `<sprint-path>` is a path to a Chester sprint directory containing a `summary/` folder with at least one `.jsonl` file.

## Procedure

The invoking agent executes these steps in order. Each step has a documented command and an expected shape of output.

### Step 1: Locate the jsonl

### Step 2: Compute next output sequence number

### Step 3: Extract metadata header

### Step 4: Extract rationalization events

### Step 5: Extract verification sequences

### Step 6: Extract scaffold utilization

### Step 7: Assemble raw evidence appendix

### Step 8: Write the report

## Pattern Library

(Editable — expand as patterns accumulate across use.)

### Rationalization Vocabulary

### Compliance-Reversal Vocabulary

### Verification Completion Vocabulary

### Scaffold Invocation Strings

## Report Template

## Notes on Accuracy

The extraction patterns surface candidate evidence. They do not prove rationalization occurred or that counter-arguments landed. The designer classifies each surfaced sequence as compliance, deviation, or ambiguous by reading the raw evidence appendix.

Pattern library evolution: when you notice a rationalization phrase not matched by the seed vocabulary, add it to the relevant family in the Pattern Library section. Earlier reports stay as-is; newer reports benefit.
````

- [ ] **Step 3: Verify file created**

Run: `ls -la ~/.claude/skills/review-session-behaviour/SKILL.md`
Expected: file exists, size ~1.2 KB.

- [ ] **Step 4: Commit**

The skill lives outside the Chester repo, so no git commit for this file. Instead, note the implementation progress inline in a scratch file at `.worktrees/20260416-01-trim-skill-bloat/docs/chester/working/20260416-01-trim-skill-bloat/plan/implementation-log.md` (create the file, add a line):

```bash
mkdir -p .worktrees/20260416-01-trim-skill-bloat/docs/chester/working/20260416-01-trim-skill-bloat/plan/
echo "Task 1 complete: SKILL.md scaffolded at ~/.claude/skills/review-session-behaviour/SKILL.md" >> .worktrees/20260416-01-trim-skill-bloat/docs/chester/working/20260416-01-trim-skill-bloat/plan/implementation-log.md
```

Note: the Chester working directory is gitignored. Use the worktree's working path only if tracking implementation progress. No git add / commit needed for this local-skill work.

---

## Task 2: Document "Locate jsonl" and "Compute next sequence number" steps

**Files:**
- Modify: `~/.claude/skills/review-session-behaviour/SKILL.md` (replace the "Step 1" and "Step 2" placeholder headings under `## Procedure`)

- [ ] **Step 1: Write the "Step 1: Locate the jsonl" subsection**

Replace `### Step 1: Locate the jsonl` with:

````markdown
### Step 1: Locate the jsonl

The sprint path provided as argument is treated as the Chester sprint directory. The jsonl to read is the most recent `.jsonl` file inside `{sprint-path}/summary/`.

```bash
JSONL=$(ls -t "${SPRINT_PATH}/summary/"*.jsonl 2>/dev/null | head -1)
if [ -z "$JSONL" ]; then
  echo "Error: no .jsonl file found in ${SPRINT_PATH}/summary/" >&2
  exit 1
fi
echo "Reading: $JSONL"
```

Expected: `JSONL` environment variable points to the session transcript file. If no file is found, abort with a clear error.
````

- [ ] **Step 2: Write the "Step 2: Compute next output sequence number" subsection**

Replace `### Step 2: Compute next output sequence number` with:

````markdown
### Step 2: Compute next output sequence number

The output report is versioned: `behavioural-read-00.md`, `behavioural-read-01.md`, etc. Find the next available two-digit sequence number in the same `summary/` directory.

```bash
EXISTING=$(ls "${SPRINT_PATH}/summary/behavioural-read-"*.md 2>/dev/null | sed 's/.*behavioural-read-\([0-9][0-9]\)\.md/\1/' | sort -n | tail -1)
if [ -z "$EXISTING" ]; then
  NN="00"
else
  NN=$(printf "%02d" $((10#$EXISTING + 1)))
fi
OUTPUT="${SPRINT_PATH}/summary/behavioural-read-${NN}.md"
echo "Will write: $OUTPUT"
```

Expected: `OUTPUT` variable points to the next available `behavioural-read-NN.md` path. First run against a sprint gets `-00.md`; subsequent runs increment.
````

- [ ] **Step 3: Verify the locate logic works against fixture 1**

Run (from the worktree):

```bash
SPRINT_PATH="docs/chester/plans/20260410-02-add-attack-specify"
JSONL=$(ls -t "${SPRINT_PATH}/summary/"*.jsonl 2>/dev/null | head -1)
echo "$JSONL"
```

Expected output: `docs/chester/plans/20260410-02-add-attack-specify/summary/add-attack-specify-session.jsonl`

- [ ] **Step 4: Verify the sequence computation**

Run:

```bash
SPRINT_PATH="docs/chester/plans/20260410-02-add-attack-specify"
EXISTING=$(ls "${SPRINT_PATH}/summary/behavioural-read-"*.md 2>/dev/null | sed 's/.*behavioural-read-\([0-9][0-9]\)\.md/\1/' | sort -n | tail -1)
if [ -z "$EXISTING" ]; then NN="00"; else NN=$(printf "%02d" $((10#$EXISTING + 1))); fi
echo "NN=$NN"
```

Expected output: `NN=00` (no prior reports exist).

- [ ] **Step 5: Log progress**

```bash
echo "Task 2 complete: locate + sequence logic added to SKILL.md" >> .worktrees/20260416-01-trim-skill-bloat/docs/chester/working/20260416-01-trim-skill-bloat/plan/implementation-log.md
```

---

## Task 3: Document "Extract metadata header" step

**Files:**
- Modify: `~/.claude/skills/review-session-behaviour/SKILL.md` (replace `### Step 3: Extract metadata header`)

- [ ] **Step 1: Write the metadata extraction subsection**

Replace `### Step 3: Extract metadata header` with:

````markdown
### Step 3: Extract metadata header

Extract five fields: model, turn count (count of assistant-type messages), user message count, skills exercised (distinct `Skill` tool invocations with their argument), and user correction count (user messages containing correction vocabulary).

```bash
# Model (first non-null model field in the transcript)
MODEL=$(jq -r 'select(.type=="assistant") | .message.model // empty' "$JSONL" | head -1)

# Turn count (assistant messages)
TURN_COUNT=$(jq -r 'select(.type=="assistant") | "1"' "$JSONL" | wc -l)

# User message count
USER_MSG_COUNT=$(jq -r 'select(.type=="user") | "1"' "$JSONL" | wc -l)

# Skills exercised (distinct Skill tool_use invocations)
SKILLS=$(jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and .name=="Skill") | .input.skill // empty' "$JSONL" | sort -u | tr '\n' ',' | sed 's/,$//')

# User correction count — user messages whose text content matches correction vocabulary
USER_CORRECTIONS=$(jq -r 'select(.type=="user") | .message.content | if type=="string" then . else (.[]? | select(.type=="text") | .text // "") end' "$JSONL" 2>/dev/null | grep -iE '\b(no|wrong|stop|not that|don.t|actually|reconsider|disagree)\b' | wc -l)

# Sprint name (from path)
SPRINT_NAME=$(basename "$SPRINT_PATH")
```

Expected: all variables populated. For fixture 1 (`20260410-02-add-attack-specify`):
- `MODEL=claude-opus-4-6`
- `TURN_COUNT` ≈ 235
- `USER_MSG_COUNT` ≈ 165
- `SKILLS` contains at least `chester:design-figure-out` and `chester:plan-build`
- `USER_CORRECTIONS` ≥ 1
````

- [ ] **Step 2: Verify the metadata queries run**

From the worktree, run:

```bash
JSONL=docs/chester/plans/20260410-02-add-attack-specify/summary/add-attack-specify-session.jsonl
jq -r 'select(.type=="assistant") | .message.model // empty' "$JSONL" | head -1
```

Expected: `claude-opus-4-6`

- [ ] **Step 3: Verify turn count**

```bash
JSONL=docs/chester/plans/20260410-02-add-attack-specify/summary/add-attack-specify-session.jsonl
jq -r 'select(.type=="assistant") | "1"' "$JSONL" | wc -l
```

Expected: ≈ 235 (within ±5).

- [ ] **Step 4: Verify skill extraction**

```bash
JSONL=docs/chester/plans/20260410-02-add-attack-specify/summary/add-attack-specify-session.jsonl
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and .name=="Skill") | .input.skill // empty' "$JSONL" | sort -u
```

Expected: non-empty list of skill names (may include `chester:design-figure-out`, `chester:plan-build`, `chester:start-bootstrap`, or others).

- [ ] **Step 5: Log progress**

```bash
echo "Task 3 complete: metadata extraction queries added" >> .worktrees/20260416-01-trim-skill-bloat/docs/chester/working/20260416-01-trim-skill-bloat/plan/implementation-log.md
```

---

## Task 4: Write the seed Pattern Library

**Files:**
- Modify: `~/.claude/skills/review-session-behaviour/SKILL.md` (replace the four empty `### Rationalization Vocabulary` / `### Compliance-Reversal Vocabulary` / `### Verification Completion Vocabulary` / `### Scaffold Invocation Strings` headings under `## Pattern Library`)

- [ ] **Step 1: Write the Rationalization Vocabulary subsection**

Replace `### Rationalization Vocabulary` with:

````markdown
### Rationalization Vocabulary

Organized into six families. Each family lists phrases (case-insensitive, word-boundary matching) that indicate the model is attempting to argue past a rule. Expand by adding phrases to the relevant family — do not create new families without good reason.

**Family 1 — Confidence-assertion:**
```
should work
should pass
probably works
i'm confident
looks correct
seems fine
```

**Family 2 — Exception-pleading:**
```
just this once
in this case
this is different
this specific case
edge case exception
only exception
```

**Family 3 — Shortcut-justification:**
```
already manually tested
tests after achieve
partial check is enough
good enough
close enough
not worth
TDD is dogmatic
being pragmatic
```

**Family 4 — Substitution:**
```
linter passed
agent said success
build succeeded so
compiles fine
no error messages
```

**Family 5 — Fatigue-appeal:**
```
i'm tired
getting late
spent too long
wasted effort
sunk cost
deleting is wasteful
```

**Family 6 — Spirit-letter:**
```
different words
spirit not ritual
spirit of the rule
essentially the same
fundamentally equivalent
```

These phrases are a seed list. The skill author extends it over time as patterns not on this list are observed in real sessions.
````

- [ ] **Step 2: Write the Compliance-Reversal Vocabulary subsection**

Replace `### Compliance-Reversal Vocabulary` with:

````markdown
### Compliance-Reversal Vocabulary

Phrases that indicate the model considered a shortcut and then self-corrected. Surface these alongside rationalizations — their presence in the *next* thinking block after a rationalization is a strong signal that the counter-argument landed.

```
actually, i should
let me re-run
let me verify
i need to verify
correct approach is
starting over
that's wrong
should re-test
let me actually
```
````

- [ ] **Step 3: Write the Verification Completion Vocabulary subsection**

Replace `### Verification Completion Vocabulary` with:

````markdown
### Verification Completion Vocabulary

Phrases in assistant `text` content that claim completion, success, or a passing state. When these appear, we check the preceding message window for fresh verification tool calls.

```
done
complete
completed
passing
all tests pass
build succeeds
fixed
ready
works now
confirmed working
```
````

- [ ] **Step 4: Write the Scaffold Invocation Strings subsection**

Replace `### Scaffold Invocation Strings` with:

````markdown
### Scaffold Invocation Strings

Strings whose appearance in `thinking` blocks signals that specific Chester skill content was load-bearing in reasoning. Reported as presence counts and excerpts.

**Rule-language strings (skill content):**
```
Iron Law
Gate Function
Red Flags
Translation Gate
Research Boundary
Phase Discipline
```

**MCP tool-call names (from tool_use names):**
```
submit_scores
submit_understanding
capture_thought
initialize_interview
initialize_understanding
get_thinking_summary
```

**Skill-reference strings:**
```
execute-test
execute-prove
execute-verify-complete
design-figure-out
plan-build
```
````

- [ ] **Step 5: Verify pattern library is present**

```bash
grep -c "### Rationalization Vocabulary\|### Compliance-Reversal Vocabulary\|### Verification Completion Vocabulary\|### Scaffold Invocation Strings" ~/.claude/skills/review-session-behaviour/SKILL.md
```

Expected: `4` (all four subsections present).

- [ ] **Step 6: Log progress**

```bash
echo "Task 4 complete: pattern library seeded with 6 rationalization families + 3 support vocabularies" >> .worktrees/20260416-01-trim-skill-bloat/docs/chester/working/20260416-01-trim-skill-bloat/plan/implementation-log.md
```

---

## Task 5: Document "Extract rationalization events" step

**Files:**
- Modify: `~/.claude/skills/review-session-behaviour/SKILL.md` (replace `### Step 4: Extract rationalization events`)

- [ ] **Step 1: Write the rationalization extraction subsection**

Replace `### Step 4: Extract rationalization events` with:

````markdown
### Step 4: Extract rationalization events

For each `thinking` block in the transcript, check whether its text contains any phrase from the Rationalization Vocabulary families. If it does, capture:
- The index of the thinking block within the assistant-message sequence
- The family that matched
- A 2-sentence excerpt of the thinking block centred on the match
- The next `tool_use` name that followed this thinking block (for context — was it a Bash test run, a Write, an Edit, an Agent dispatch, etc.)
- Whether the *next* thinking block after this one contains any Compliance-Reversal Vocabulary (a proxy for "counter-argument landed")

Extraction query (emits one line per match, unit-separator delimited between index and content):

```bash
# Build one regex per family from the pattern library
RATIONALIZATION_RE='(should work|should pass|probably works|i.?m confident|looks correct|seems fine|just this once|in this case|this is different|this specific case|edge case exception|only exception|already manually tested|tests after achieve|partial check is enough|good enough|close enough|not worth|TDD is dogmatic|being pragmatic|linter passed|agent said success|build succeeded so|compiles fine|no error messages|i.?m tired|getting late|spent too long|wasted effort|sunk cost|deleting is wasteful|different words|spirit not ritual|spirit of the rule|essentially the same|fundamentally equivalent)'

# Stream assistant thinking blocks with their index; one line per block, grep for matches.
# The \u001f (ASCII unit separator) delimits index from content and won't clash with prose.
# Thinking blocks may themselves contain newlines — collapse them with tr to keep one block per line.
jq -r '
  [inputs | select(.type=="assistant") | .message.content[]? | select(.type=="thinking") | .thinking // ""]
  | to_entries[]
  | "\(.key)\u001f\(.value | gsub("\n"; " "))"
' "$JSONL" 2>/dev/null | grep -iE "$RATIONALIZATION_RE" | head -50
```

Present results in the report as:

```markdown
## Rationalization Events

| Block # | Family matched | Excerpt | Next tool | Reversal in next block? |
|---|---|---|---|---|
| 47 | Confidence-assertion | "...this should work without needing to re-run the tests..." | Write | No |
| 92 | Exception-pleading | "...in this case the TDD rule doesn't quite apply because..." | Edit | Yes — "actually, let me write the test first" |
```

Notes:
- Empty result is a valid outcome. Report `_No rationalization events matched the pattern library._`
- A match is evidence, not proof — the designer reads the raw excerpt in the appendix to judge.
````

- [ ] **Step 2: Verify the query produces output against fixture 1**

Run:

```bash
JSONL=docs/chester/plans/20260410-02-add-attack-specify/summary/add-attack-specify-session.jsonl
RATIONALIZATION_RE='(should work|should pass|probably|just this once|good enough|different words)'
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="thinking") | .thinking // empty' "$JSONL" | grep -icE "$RATIONALIZATION_RE"
```

Expected: a count ≥ 0. Zero is acceptable — it means no rationalizations matched. Non-zero indicates the extraction is working.

- [ ] **Step 3: Verify at least one family matches somewhere in the archive**

```bash
for f in docs/chester/plans/*/summary/*.jsonl; do
  c=$(jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="thinking") | .thinking // empty' "$f" 2>/dev/null | grep -icE 'should work|probably|just this once|good enough|linter passed' )
  [ "$c" -gt 0 ] && echo "$f: $c matches"
done | head -10
```

Expected: at least 2–3 sessions with non-zero match counts. Confirms the rationalization vocabulary is finding real signal in the archive.

- [ ] **Step 4: Log progress**

```bash
echo "Task 5 complete: rationalization extraction query added + validated against archive" >> .worktrees/20260416-01-trim-skill-bloat/docs/chester/working/20260416-01-trim-skill-bloat/plan/implementation-log.md
```

---

## Task 6: Document "Extract verification sequences" step

**Files:**
- Modify: `~/.claude/skills/review-session-behaviour/SKILL.md` (replace `### Step 5: Extract verification sequences`)

- [ ] **Step 1: Write the verification extraction subsection**

Replace `### Step 5: Extract verification sequences` with:

````markdown
### Step 5: Extract verification sequences

A verification sequence is any assistant `text` block that contains Verification Completion Vocabulary, paired with the 5 preceding messages to determine whether fresh verification tool calls (Bash running tests/builds, Read of actual output) preceded the claim.

Extraction approach — emit every assistant text block with its index, then grep for completion vocabulary. The simpler pipeline (jq to emit, grep to filter) is more robust than trying to filter inside jq:

```bash
COMPLETION_RE='\b(done|complete|completed|passing|all tests pass|build succeeds|fixed|ready|works now|confirmed working)\b'

# Emit (message_index \u001f claim_text) for every assistant text block, collapsing internal newlines.
# grep then filters to those matching completion vocabulary.
jq -r '
  [inputs]
  | to_entries[]
  | select(.value.type=="assistant")
  | . as $m
  | .value.message.content[]?
  | select(.type=="text")
  | .text // empty
  | "\($m.key)\u001f\(. | gsub("\n"; " "))"
' "$JSONL" 2>/dev/null | grep -iE "$COMPLETION_RE" | head -30
```

For each match, look backward through 5 preceding assistant messages (by index) and list the `tool_use.name` values found. If Bash, Read, or test-running tool calls appear in that window, verification was likely fresh. If not, the claim may be unsupported.

Present results as:

```markdown
## Verification Sequences

| Claim # | Claim text (truncated) | Preceding 5-message tool-call window | Fresh verification? |
|---|---|---|---|
| msg 103 | "...all tests now passing..." | Bash, Edit, Read, Bash, Write | Yes (Bash × 2 in window) |
| msg 157 | "...the feature is ready..." | Write, Edit, Write, Edit, TodoWrite | No (no Bash/Read in window) |
```

- Report each claim with its surrounding tool-call window
- Mark "Fresh verification?" as Yes when Bash/Read appears in the window, No when only Write/Edit/etc. appears, Unclear when the window is empty or heavily mixed
- Empty result is valid — report `_No completion claims matched the pattern library._`
````

- [ ] **Step 2: Verify the completion vocabulary matches against fixture 1**

```bash
JSONL=docs/chester/plans/20260410-02-add-attack-specify/summary/add-attack-specify-session.jsonl
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="text") | .text // empty' "$JSONL" | grep -icE '\b(done|complete|completed|passing|all tests pass|build succeeds|fixed|ready|works now|confirmed working)\b'
```

Expected: count > 0.

- [ ] **Step 3: Verify tool-use extraction works for window analysis**

```bash
JSONL=docs/chester/plans/20260410-02-add-attack-specify/summary/add-attack-specify-session.jsonl
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | .name' "$JSONL" | sort | uniq -c | sort -rn | head
```

Expected: tool names with counts — at minimum `Bash`, `Read`, `Edit`, `Write` should appear if the session did any real work. This confirms the data needed for window analysis is extractable.

- [ ] **Step 4: Log progress**

```bash
echo "Task 6 complete: verification sequence extraction added" >> .worktrees/20260416-01-trim-skill-bloat/docs/chester/working/20260416-01-trim-skill-bloat/plan/implementation-log.md
```

---

## Task 7: Document "Extract scaffold utilization" step

**Files:**
- Modify: `~/.claude/skills/review-session-behaviour/SKILL.md` (replace `### Step 6: Extract scaffold utilization`)

- [ ] **Step 1: Write the scaffold utilization extraction subsection**

Replace `### Step 6: Extract scaffold utilization` with:

````markdown
### Step 6: Extract scaffold utilization

For each scaffold string group (rule-language, MCP tool calls, skill references), count occurrences and capture 2–3 context excerpts showing how the scaffold language was used.

```bash
# Rule-language invocation counts (in thinking blocks)
RULE_STRINGS='Iron Law|Gate Function|Red Flags|Translation Gate|Research Boundary|Phase Discipline'
RULE_COUNT=$(jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="thinking") | .thinking // empty' "$JSONL" | grep -coE "$RULE_STRINGS")

# MCP tool-call counts (from tool_use names)
MCP_TOOLS=$(jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | .name // empty' "$JSONL" | grep -E 'submit_scores|submit_understanding|capture_thought|initialize_interview|initialize_understanding|get_thinking_summary' | sort | uniq -c | awk '{print $2 ": " $1}' | tr '\n' ',' | sed 's/,$//')

# Skill reference counts (in thinking blocks)
SKILL_REFS='execute-test|execute-prove|execute-verify-complete|design-figure-out|plan-build'
SKILL_REF_COUNT=$(jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="thinking") | .thinking // empty' "$JSONL" | grep -coE "$SKILL_REFS")
```

Present in the report as:

```markdown
## Scaffold Utilization

**Rule-language in thinking:**
- Iron Law: 3 mentions
- Gate Function: 2 mentions
- Red Flags: 1 mention
- Translation Gate: 0 mentions
- (Total: 6)

**MCP tool calls:**
- submit_scores: 12
- capture_thought: 8
- submit_understanding: 5

**Skill references in thinking:**
- execute-test: 4
- plan-build: 3
- design-figure-out: 2

**Load-bearing assessment:** (designer's judgment based on appendix excerpts)

Context excerpts (first 3 rule-language mentions):
1. Thinking block #47 — "...the Iron Law here says no code before the failing test, so I need to..."
2. Thinking block #82 — "...Gate Function step 3 says read the output, which I haven't done..."
3. Thinking block #134 — "...Red Flags warn against proceeding on partial checks — this is partial, stop..."
```
````

- [ ] **Step 2: Verify scaffold counts against fixture 1**

```bash
JSONL=docs/chester/plans/20260410-02-add-attack-specify/summary/add-attack-specify-session.jsonl
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="thinking") | .thinking // empty' "$JSONL" | grep -coE 'Iron Law|Gate Function|Red Flags|Translation Gate|Research Boundary|Phase Discipline'
```

Expected: count ≥ 0. Report the number observed.

- [ ] **Step 3: Verify MCP tool-use counts**

```bash
JSONL=docs/chester/plans/20260410-02-add-attack-specify/summary/add-attack-specify-session.jsonl
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | .name // empty' "$JSONL" | grep -cE 'submit_scores|submit_understanding|capture_thought'
```

Expected: non-zero for a sprint that went through `design-figure-out` (should see `capture_thought` calls).

- [ ] **Step 4: Log progress**

```bash
echo "Task 7 complete: scaffold utilization extraction added" >> .worktrees/20260416-01-trim-skill-bloat/docs/chester/working/20260416-01-trim-skill-bloat/plan/implementation-log.md
```

---

## Task 8: Document "Raw Evidence Appendix", "Write report", and Report Template

**Files:**
- Modify: `~/.claude/skills/review-session-behaviour/SKILL.md` (replace `### Step 7: Assemble raw evidence appendix`, `### Step 8: Write the report`, and `## Report Template`)

- [ ] **Step 1: Write the Raw Evidence Appendix subsection**

Replace `### Step 7: Assemble raw evidence appendix` with:

````markdown
### Step 7: Assemble raw evidence appendix

For every rationalization event, verification sequence, and scaffold mention captured in Steps 4–6, emit a raw excerpt into the appendix. The appendix is the load-bearing evidence — the summary sections are tallies, but the appendix is what the designer reads to form judgment.

For each event, emit:
- A subheading: `#### <Signal Type> — Block #<index>`
- The raw thinking/text content, wrapped in a markdown blockquote or code fence
- 1–2 blocks of surrounding context (the preceding and following assistant thinking/text)
- A line-reference comment: `<!-- jsonl line ~<approx_line>, message #<index> -->`

Example entry:

```markdown
#### Rationalization Event — Block #47

> "I think this should work without re-running the tests — I only changed one line and it was just a rename. Let me just commit and move on."

**Preceding block (#46):**
> "The test file has the old variable name still. I'll update it."

**Following block (#48):**
> "Actually, let me re-run the test first. I should verify, not assume."

<!-- jsonl line ~340, message #47 -->
```

The appendix's purpose: give the designer enough surrounding context that they can classify each event without reading the full jsonl.
````

- [ ] **Step 2: Write the "Write the report" subsection**

Replace `### Step 8: Write the report` with:

````markdown
### Step 8: Write the report

Assemble the full report using the Report Template (next section). Write it to the path computed in Step 2. Print the path so the designer can read it.

```bash
cat > "$OUTPUT" <<REPORT
# Behavioural Read — ${SPRINT_NAME}

**Model:** ${MODEL}
**Turn count:** ${TURN_COUNT}
**User message count:** ${USER_MSG_COUNT}
**User correction count:** ${USER_CORRECTIONS}
**Skills exercised:** ${SKILLS}
**Source jsonl:** ${JSONL}
**Report version:** ${NN}

---

## Rationalization Events

$(render_rationalization_table)

## Verification Sequences

$(render_verification_table)

## Scaffold Utilization

$(render_scaffold_block)

---

## Raw Evidence Appendix

$(render_appendix)
REPORT

echo "Report written: $OUTPUT"
```

The `render_*` functions are not defined globally — the invoking agent composes their output inline by running the extraction queries from Steps 3–7 and formatting the results into markdown tables / lists as documented in each step. Keep the assembly direct; avoid defining reusable shell functions across a conversation turn.
````

- [ ] **Step 3: Write the Report Template subsection**

Replace `## Report Template` with:

````markdown
## Report Template

This is the canonical structure every report follows. Deviations will break future aggregation.

```markdown
# Behavioural Read — <sprint-name>

**Model:** <model-id>
**Turn count:** <N>
**User message count:** <N>
**User correction count:** <N>
**Skills exercised:** <comma-separated list>
**Source jsonl:** <path>
**Report version:** <NN>

---

## Rationalization Events

| Block # | Family matched | Excerpt | Next tool | Reversal in next block? |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

_If no matches: "No rationalization events matched the pattern library."_

## Verification Sequences

| Claim # | Claim text (truncated) | Preceding 5-message tool-call window | Fresh verification? |
|---|---|---|---|
| ... | ... | ... | ... |

_If no matches: "No completion claims matched the pattern library."_

## Scaffold Utilization

**Rule-language in thinking:**
- <rule-name>: <count>

**MCP tool calls:**
- <tool-name>: <count>

**Skill references in thinking:**
- <skill-name>: <count>

**Load-bearing assessment:** (designer's judgment based on appendix excerpts)

Context excerpts (first 3 rule-language mentions):
1. ...
2. ...
3. ...

---

## Raw Evidence Appendix

<ordered list of rationalization event entries, verification sequence entries, scaffold mention entries — each formatted per Step 7>
```

Keep the metadata header's field ordering stable (Model, Turn count, User message count, User correction count, Skills exercised, Source jsonl, Report version). Future aggregation parses these fields by position.
````

- [ ] **Step 4: Verify the full skill file is coherent**

```bash
wc -l ~/.claude/skills/review-session-behaviour/SKILL.md
grep -c '^## ' ~/.claude/skills/review-session-behaviour/SKILL.md
grep -c '^### ' ~/.claude/skills/review-session-behaviour/SKILL.md
```

Expected:
- Line count ≈ 400–500
- Top-level `##` sections ≈ 7 (Overview, When to Use, Invocation, Procedure, Pattern Library, Report Template, Notes on Accuracy)
- `###` sections ≈ 12 (8 Procedure steps + 4 Pattern Library subsections)

- [ ] **Step 5: Log progress**

```bash
echo "Task 8 complete: appendix, report assembly, and template added" >> .worktrees/20260416-01-trim-skill-bloat/docs/chester/working/20260416-01-trim-skill-bloat/plan/implementation-log.md
```

---

## Task 9: Integration validation against 3 archived sprints

**Files:**
- Read (no modification): `~/.claude/skills/review-session-behaviour/SKILL.md`
- Read: three fixture jsonls listed in File Structure
- Create: three `behavioural-read-00.md` reports in each fixture's `summary/` folder

This task is judgment-driven. No step is a pure green/red check — each one requires the implementer to read the generated report and form an assessment.

- [ ] **Step 1: Run the documented skill procedure against fixture 1**

Follow the Procedure section of `~/.claude/skills/review-session-behaviour/SKILL.md` end-to-end, with `SPRINT_PATH=docs/chester/plans/20260410-02-add-attack-specify`. Execute each documented bash/jq command in order. Write the final report to `docs/chester/plans/20260410-02-add-attack-specify/summary/behavioural-read-00.md`.

- [ ] **Step 2: Verify the report exists and is well-formed**

```bash
ls -la docs/chester/plans/20260410-02-add-attack-specify/summary/behavioural-read-00.md
head -20 docs/chester/plans/20260410-02-add-attack-specify/summary/behavioural-read-00.md
```

Expected: file exists, top of file matches the Report Template header block (Model, Turn count, etc.).

- [ ] **Step 3: Read the report end-to-end and assess**

Read the full generated report. Form judgment on:
- Do the rationalization events surfaced look like real rationalizations a human reader would flag? (Low false-positive rate?)
- Do verification sequences correctly show preceding tool-call windows?
- Do scaffold utilization counts plausibly match what you'd expect for a design + plan sprint?
- Is the raw evidence appendix readable and self-contained?
- Can the whole report be scanned in under 10 minutes?

If any "no" or "unclear" — **note the gap, then proceed to Step 4** to tune.

- [ ] **Step 4: If fixture 1 reveals pattern-library gaps, tune**

If rationalizations are missed (false negatives), add phrases to `~/.claude/skills/review-session-behaviour/SKILL.md` Pattern Library. If false positives are frequent, tighten the phrase list (remove overly common words). Re-run Step 1 against fixture 1 (this produces `behavioural-read-01.md` — the `-00` stays as the initial read for comparison).

Do NOT iterate more than twice on fixture 1. If two tuning passes don't produce a report that reads as useful, **stop and surface the issue to the human** — pattern matching may not be the right approach for some signals.

- [ ] **Step 5: Run against fixture 2**

`SPRINT_PATH=docs/chester/plans/20260408-03-plan-mode-design-guard`. Run the Procedure end-to-end. Write to `docs/chester/plans/20260408-03-plan-mode-design-guard/summary/behavioural-read-00.md`.

- [ ] **Step 6: Read fixture 2 report and reassess**

Apply the same 5-point assessment from Step 3. Note any new pattern gaps revealed by this sprint. Tune if needed (maximum 1 tuning pass here — no more regression risk from over-tuning to a single fixture).

- [ ] **Step 7: Run against fixture 3**

`SPRINT_PATH=docs/chester/plans/20260403-02-architect-pacing-optimization`. Run the Procedure end-to-end. Write to `docs/chester/plans/20260403-02-architect-pacing-optimization/summary/behavioural-read-00.md`.

- [ ] **Step 8: Final assessment against all three reports**

Read all three reports back-to-back (or skim and compare). Form the final behavioural acceptance judgment per the design brief:

- Across three sprints, do rationalization events surfaced look useful — low enough false-positive rate that a designer would read the report?
- Do verification sequences correctly identify the tool-call window?
- Are raw evidence appendices self-contained and readable?
- Is each report scannable in under 10 minutes?

If **yes to all four** → behavioural acceptance criteria met; Task 9 complete.

If **no or unclear on any** → record gaps in `implementation-log.md` and surface to human before claiming complete. Do NOT continue tuning past the second fixture; further tuning risks over-fitting to archive data and missing patterns that only appear with 4.7.

- [ ] **Step 9: Commit the behavioural reports to the worktree**

The three behavioural reports live inside `docs/chester/plans/*/summary/` which is tracked git territory. Add and commit them:

```bash
git -C .worktrees/20260416-01-trim-skill-bloat add \
  docs/chester/plans/20260410-02-add-attack-specify/summary/behavioural-read-00.md \
  docs/chester/plans/20260408-03-plan-mode-design-guard/summary/behavioural-read-00.md \
  docs/chester/plans/20260403-02-architect-pacing-optimization/summary/behavioural-read-00.md

git -C .worktrees/20260416-01-trim-skill-bloat commit -m "feat: initial behavioural reads for three 4.6 fixture sprints"
```

If any `behavioural-read-01.md` tuning-pass files exist, include those too.

- [ ] **Step 10: Log completion**

```bash
echo "Task 9 complete: integration validation against 3 fixtures, behavioural acceptance criteria met" >> .worktrees/20260416-01-trim-skill-bloat/docs/chester/working/20260416-01-trim-skill-bloat/plan/implementation-log.md
```

---

## Acceptance Criteria (inherited from design brief)

**Procedural (mechanical):**
- [x] `~/.claude/skills/review-session-behaviour/SKILL.md` exists (Task 1)
- [x] Report contains all 5 required sections: metadata header, Rationalization Events, Verification Sequences, Scaffold Utilization, Raw Evidence Appendix (Tasks 3–8)
- [x] Metadata header includes sprint name, model, turn count, user correction count, skills exercised (Task 3)
- [x] Pattern library section embedded in SKILL.md and directly editable (Task 4)
- [x] Implementation uses only Bash, jq, grep (all tasks)
- [x] NN versioning correctly produces `-00`, `-01`, etc. against same sprint path (Task 2)

**Behavioural (judgment-based, verified in Task 9):**
- [ ] Against 2–3 recent 4.6 sprints, reports read as useful evidence, not noise
- [ ] Rationalization events overlap meaningfully with manual-reader flags
- [ ] Verification sequences correctly identify the tool-call window
- [ ] Raw evidence appendix provides enough context to judge without opening jsonl
- [ ] Report scannable end-to-end in under 10 minutes per session

**Out of scope (per brief):**
- Multi-session aggregation — deferred to v2
- Automatic classification of signals as compliance vs deviation
- Generalizing the skill to non-Chester Claude Code sessions
- Any modifications to `execute-test`, `execute-prove`, or other Chester skills

## Notes for the Implementer

- The skill file lives **outside** the Chester repo (`~/.claude/skills/…`). Its changes are not tracked by the Chester worktree's git. Only the integration reports produced in Task 9 land in tracked territory.
- `implementation-log.md` is a scratch file tracking progress — useful for cross-task context. It's gitignored (in the working dir) and doesn't need committing.
- If you're running this plan via `execute-write`'s subagent-driven mode: the implementer subagent for each task should receive the full task text including the code blocks. Do not summarize tasks before dispatching — the implementer needs exact content to paste into SKILL.md.
- The "implementation-log.md" path resolves differently depending on which directory you're in. From repo root: `docs/chester/working/20260416-01-trim-skill-bloat/plan/implementation-log.md`. From within the worktree: same. The path is the same because the worktree shares the repo root's structure.
- TDD's red step is implicit: before adding a pattern/query to SKILL.md in a given task, the referenced extraction command would produce no output (because SKILL.md doesn't contain it yet) or the SKILL.md wouldn't have the section to run. After the task, running the documented command against fixture 1 produces the expected output shape.
