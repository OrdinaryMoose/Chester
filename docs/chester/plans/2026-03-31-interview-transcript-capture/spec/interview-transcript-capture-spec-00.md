# Spec — Interview Transcript Capture & Subagent Progress Visibility

**Sprint:** sprint-007-interview-transcript-capture
**Date:** 2026-03-31

This sprint has two efforts that share a theme: making Chester's internal processes visible to the user.

---

## Effort 1: Interview Transcript Capture

### Goal

Capture the Socratic interview dialogue as a readable markdown transcript, appended incrementally during the interview and archived alongside existing design artifacts.

### Architecture

No new files, scripts, or infrastructure. This is a behavioral change to the `chester-figure-out` skill: after each interview exchange, the agent appends formatted text to a transcript file.

### Components

**Transcript file:** `{sprint-name}-interview-00.md` in the `design/` subdirectory.

**File lifecycle:**
1. Created at interview start (Phase 3 entry) in `{CHESTER_WORK_DIR}/{sprint-subdir}/design/`
2. Appended to after each exchange during the interview
3. Copied to `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/` at closure (Phase 4), alongside thinking summary and design brief
4. Committed in worktree with the other design artifacts

**Content to capture per exchange:**
- Agent stream-of-consciousness thinking (the italic lines before each question)
- Agent question (the bold question)
- User response (their answer)

**Content to exclude:**
- Tool calls and tool results
- MCP invocations (structured-thinking, etc.)
- Claude Code UI elements (bake times, spinners, agent summaries)
- Task management operations
- Budget guard checks

### Formatting

Three visual lanes, using markdown:

```markdown
*The user's answer shifted the design toward incremental capture.*

*That connects to the simplicity constraint — no post-processing.*

**Should the transcript be built up as the interview progresses, or assembled at the end?**

> yes, just dump it as we go
```

- **Italic lines** — agent stream-of-consciousness thinking (each line is one italic sentence)
- **Bold text** — agent questions
- **Blockquote** — user responses

Exchanges are separated by a horizontal rule (`---`).

**File header:**

```markdown
# Interview Transcript — {Sprint Name}

**Date:** {YYYY-MM-DD}
**Sprint:** {sprint-NNN-slug}

---
```

### Changes to chester-figure-out/SKILL.md

**Phase 3 (Socratic Interview) — add transcript instructions:**

At the start of Phase 3, after the problem statement is confirmed:
1. Create the transcript file with the header in `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-interview-00.md`
2. Append the confirmed problem statement as the first entry

For each interview turn:
1. After producing stream-of-consciousness thinking and the question, append them to the transcript
2. After receiving the user's response, append it as a blockquote
3. Separate each exchange with `---`

For checkpoints (every 4-6 questions):
- Append a checkpoint marker: `### Checkpoint — {N} questions`

**Phase 4 (Closure) — add transcript to artifact list:**

Add the transcript file to the list of artifacts that get:
- Copied from working dir to worktree plans dir
- Committed with `checkpoint: design complete`

### Data Flow

```
Interview turn N:
  Agent produces thinking + question → append to transcript file
  User responds → append response as blockquote → append separator
  
Closure:
  Copy transcript from working dir → worktree plans dir
  git add + commit with other design artifacts
```

### Error Handling

If the transcript file can't be written (permissions, disk), log a warning and continue the interview without capturing. The transcript is supplementary — never block the interview for it.

### Testing Strategy

Manual verification: run a figure-out session and confirm:
1. Transcript file exists in working dir after first interview question
2. Each exchange appears with correct formatting (italic/bold/blockquote)
3. File is copied to worktree at closure
4. File is included in the commit

### Constraints

- Zero new files or scripts — purely a SKILL.md behavioral change
- The append operation uses the existing Write/Edit tools — no shell scripting
- The transcript is append-only during the interview; no edits to prior entries

### Non-Goals

- Capturing tool call details or MCP interactions
- Structured/machine-readable format (this is human-readable)
- Retroactive transcript generation from session.jsonl

---

## Effort 2: Subagent Progress Visibility

### Goal

Add progress reporting instructions to all subagent-dispatching skills so that long-running agents emit short status lines at major phase transitions, enabling the user to make informed interrupt decisions.

### Architecture

No new files, scripts, or infrastructure. This is a prompt change in existing skill files: each subagent prompt gets a "Progress Reporting" section that tells the agent to emit status lines.

### Report Format

```
{who}:{label}-{freetext}
```

- **who** — agent role name, consistent across runs (e.g., "Migration Gaps", "SOLID Violations", "Implementer Task 2")
- **label** — fixed phase label for that step, identical every run (e.g., "Scanning", "Writing tests", "Reviewing")
- **freetext** — one sentence describing the specific context of what the agent is doing right now

Example: `Migration Gaps:Scanning-checking auth module for unhandled state transitions`

### Constraints

- Zero additional token cost — reports announce what the agent is already doing, no new analysis
- One sentence maximum per report
- Reports are text output (visible in terminal), not tool calls

### Skills to Modify

#### chester-attack-plan/SKILL.md

6 parallel agents. Add to each agent's prompt section:

| Agent | Who | Phases (Labels) |
|-------|-----|-----------------|
| Structural Integrity | `Structural` | `Reading`→`Verifying`→`Reporting` |
| Execution Risk | `Execution` | `Reading`→`Analyzing`→`Reporting` |
| Assumptions & Edge Cases | `Assumptions` | `Reading`→`Probing`→`Reporting` |
| Migration Completeness | `Migration` | `Reading`→`Tracing`→`Reporting` |
| API Surface Compatibility | `API Surface` | `Reading`→`Checking`→`Reporting` |
| Concurrency & Thread Safety | `Concurrency` | `Reading`→`Analyzing`→`Reporting` |

#### chester-smell-code/SKILL.md

4 parallel agents. Add to each agent's prompt section:

| Agent | Who | Phases (Labels) |
|-------|-----|-----------------|
| Bloaters & Dispensables | `Bloaters` | `Reading`→`Scanning`→`Reporting` |
| Couplers & OO Abusers | `Couplers` | `Reading`→`Scanning`→`Reporting` |
| Change Preventers | `Preventers` | `Reading`→`Scanning`→`Reporting` |
| SOLID Violations | `SOLID` | `Reading`→`Scanning`→`Reporting` |

#### chester-write-code (implementer.md, spec-reviewer.md, quality-reviewer.md)

Sequential agents. Add to each agent's prompt:

| Agent | Who | Phases (Labels) |
|-------|-----|-----------------|
| Implementer | `Implementer Task {N}` | `Reading`→`Writing tests`→`Implementing`→`Testing`→`Self-reviewing`→`Committing` |
| Spec Reviewer | `Spec Review` | `Reading`→`Diffing`→`Comparing`→`Reporting` |
| Quality Reviewer | `Quality Review` | `Reading`→`Analyzing`→`Reporting` |

#### chester-build-spec (spec-reviewer.md)

| Agent | Who | Phases (Labels) |
|-------|-----|-----------------|
| Spec Reviewer | `Spec Review` | `Reading`→`Checking`→`Reporting` |

#### chester-dispatch-agents/SKILL.md

Generic framework — add a section instructing callers to include progress reporting in agent prompts. Provide the format template and guidance on choosing who/label values.

### Prompt Addition Template

Add this block to each subagent prompt:

```
## Progress Reporting

Emit a short status line at each major phase of your work. Format:
{who}:{label}-{one sentence describing what you're doing}

Your phases: {list the labels for this agent}
Emit one line per phase transition. No additional analysis — just announce what you're doing.
```

### Data Flow

```
Subagent starts → emits "{who}:Reading-{freetext}"
Subagent transitions → emits "{who}:{next label}-{freetext}"
...
Subagent finishes → emits "{who}:Reporting-{freetext}" then returns structured result
```

### Error Handling

If an agent omits progress lines, nothing breaks — the result is still returned. Progress lines are best-effort instructions to an LLM, not guaranteed behavior.

### Testing Strategy

Manual verification: run each skill and confirm:
1. Status lines appear in terminal during agent execution
2. Lines follow the `{who}:{label}-{freetext}` format
3. Final results are unchanged

### Non-Goals

- Structured logging or persistence of progress lines
- Progress bars or percentage completion
- Changing the content or format of agent results
