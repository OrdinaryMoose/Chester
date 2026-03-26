---
name: chester-trace-reasoning
description: >
  Produces a structured audit of how the agent reasoned through an implementation session —
  capturing how the plan developed, what information shaped each decision, what alternatives
  were considered, and why specific choices were made. Runs automatically after every
  implementation session alongside chester-write-summary. Also trigger explicitly when the user says
  things like: "write the reasoning audit", "audit the decisions", "how did you decide that",
  "capture the decision reasoning", "reasoning audit", or "/chester-trace-reasoning".
  Do NOT trigger for planning-only or analysis-only sessions with no code changes — use
  chester-write-summary alone for those.
---

# Reasoning Audit Skill

Reconstructs the agent's decision-making process from the session JSONL transcript —
producing a causal record of what was known, what was considered, what was chosen, and why.
This is not a transcript and not a summary. It is a decision-level audit.

**Source: the session JSONL transcript.** This skill reads the same JSONL file that
chester-trace-reasoning uses — both skills draw from the primary source independently. Do not
derive content from chester-write-summary output or chester-trace-reasoning output.

**Read `references/audit-formats.md` before writing anything.** File naming, entry
structure, and section conventions are defined there.

---

## Step 0: Locate the Session JSONL

Find the current session's JSONL file using the same approach as chester-trace-reasoning:

```bash
ls -t ~/.claude/projects/-home-mike-RiderProjects-StoryDesigner/*.jsonl | head -5
```

The most recently modified `.jsonl` file is the current session. If the project path
produces no results, find the correct directory:

```bash
ls ~/.claude/projects/ | grep -i storydesigner
```

The JSONL is the authoritative source. Read it directly — do not rely on what is visible
in the current conversation window, as tool call content and assistant reasoning are more
complete in the raw transcript than in the rendered conversation.

---

## Step 1: Determine Output Directory

**Priority order:**

1. Use the working directory specified by the user.
2. If chester-write-summary has already run this session, use the same output directory.
3. If a spec or plan document was written or referenced this session, read its YAML frontmatter for `output_dir` and `sprint_prefix`. If present, write to `<output_dir>/summary/`.
4. If the default chester effort directory already exists for this session (e.g., `docs/chester/YYYY-MM-DD-<topic-slug>/` containing a spec or plan), write the audit there using the naming convention `<topic-slug>-audit-NN.md`. Glob `docs/chester/*/` for directories matching today's date.
5. Infer from context: look for a sprint folder reference in the conversation or JSONL.
6. If genuinely ambiguous, ask:

> "Where should I save this reasoning audit?"
> - **A)** Default: `docs/chester/YYYY-MM-DD-<topic-slug>/` (I'll derive the topic slug)
> - **B)** Custom directory — provide the path

When writing to a custom directory with `sprint_prefix`, prepend the prefix to the filename: `<sprint_prefix>-<topic-slug>-audit-00.md`.

**Default file naming convention:** `<topic-slug>-audit-NN.md` where `-00` is the first audit, `-01` the next session's audit, etc.

---

## Step 2: Determine File Name

Follow the same prefix logic as chester-write-summary:
- Check whether `Reasoning-Audit.md` already exists in the output directory
- If base file exists, use a suffixed name matching the session suffix
  (e.g., `Sprint-025d-Reasoning-Audit.md`)
- If no base file exists, use `Reasoning-Audit.md`

---

## Step 3: Identify Decision Points

Parse the JSONL entries chronologically. Look for assistant turns where the agent made
a non-trivial choice — these are visible in assistant message content, tool call
parameters (what was searched or read), and the narration between tool calls. A decision
point qualifies if any of these are true:

- **Deviation from plan** — agent did something different from what the plan specified,
  or added something the plan didn't mention
- **Implementation detail choice** — agent selected one approach among plausible
  alternatives (naming, error handling strategy, API choice, code placement)
- **Information-driven choice** — agent grepped, read, or searched for something and
  then made a choice based on what it found
- **Explicit rejection** — agent considered an approach and discarded it, stated or implied

Do NOT capture:
- Mechanical execution steps where only one reasonable choice existed
- Tool calls with no decision content (e.g., reading a file to confirm a line number)
- Trivial style choices with no architectural consequence

Aim for 4–12 entries per session. More than 12 usually means the threshold is too low.

---

## Step 4: For Each Decision Point, Reconstruct the Entry

Each entry answers four questions in order:

1. **Context** — what situation or constraint prompted this decision?
2. **Information used** — what did the agent read, grep, or already know that was
   directly relevant? Pull specifics from the JSONL: the actual file read, the grep
   pattern used, the content found. The JSONL contains full tool call parameters and
   results that are not visible in the rendered conversation.
3. **Alternatives considered** — what other approaches were available or mentioned?
   Include implicit rejections (approaches the plan suggested but the agent modified).
   If no alternatives are visible in the JSONL, say so explicitly rather than inventing them.
4. **Decision and rationale** — what was chosen and the stated or inferable reason.
   If the reason is inferred rather than stated, mark it `(inferred)`.

Follow the entry format in `references/audit-formats.md` exactly.

---

## Step 5: Write the Framing Sections

### Executive Summary
Write 2–4 sentences covering: what the session set out to do, the single most
consequential decision made and why it mattered, and whether the implementation stayed
on-plan or deviated. Write it last — after the decision entries are complete — so the
most significant entry is already known. It goes first in the file.

### Plan Development
After the executive summary, write 3–6 sentences describing how the plan arrived at
this session. Pull from the early JSONL entries — the first user message and any /plan
mode exchanges:

- Was it created from scratch in /plan mode, or carried in from a prior session?
- Were there significant revisions between initial plan and final plan?
- What constraints or prior decisions shaped its scope?

If the plan arrived fully-formed at session start with no visible development in the
JSONL, say so in one sentence and move on.

---

## Step 6: Write the File

Write the output file using the format in `references/audit-formats.md`. Do not ask for
confirmation first. If a decision point is ambiguous, note the ambiguity inside the entry
rather than omitting it.

After writing the reasoning audit to disk, print the full document content to the terminal so the user can read it without opening the file.

---

## Core Principles

**Causal, not chronological.** Order entries by significance, not by when they occurred
in the session. Lead with the decisions that had the most downstream consequence.

**Traceable.** Every entry must be traceable to a specific JSONL entry — an assistant
narration turn, a tool call parameter, or a tool result. If you cannot point to a JSONL
entry as evidence, omit it or mark it `(inferred)`.

**Honest about invisibility.** The JSONL contains more detail than the rendered
conversation — tool results, grep output, file content read. Use it. But if a choice
is visible in the JSONL and the reasoning still is not, say "not visible in transcript"
rather than speculating.

**Alternatives are first-class.** A decision without alternatives is incomplete. If no
alternatives are visible, say so — that itself is useful information about how much
reasoning was explicit.

**Calibrated confidence.** Each entry carries a confidence marker: `High`, `Medium`,
or `Low`, reflecting how clearly the decision and its rationale are supported by context.
