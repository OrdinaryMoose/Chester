# Design Brief — Interview Transcript Capture

**Sprint:** sprint-007-interview-transcript-capture
**Date:** 2026-03-31

## Problem

The Socratic interview is where design decisions get made, but the conversation vanishes after the session. The thinking summary captures outcomes and the design brief captures conclusions, but neither preserves the actual dialogue — the reasoning path, the user's words, the moments where understanding shifted.

## Design Decisions

### 1. Capture mechanism — incremental append

Append formatted text to a markdown file after each exchange during the interview. No post-processing or reconstruction. The agent already produces the text; it writes it to a file at the same time.

### 2. File lifecycle — working dir then worktree

The transcript accumulates in `{CHESTER_WORK_DIR}/{sprint-subdir}/design/` during the interview (before the worktree exists). At closure, it gets copied to the worktree plans dir alongside the thinking summary and design brief.

### 3. Content filtering — interview interactions only

Exclude tool calls, MCP outputs, bake times, and other Claude Code machinery. Capture only: agent context/information, agent questions, and user statements.

### 4. Formatting — three visual lanes in markdown

Mirror the terminal's natural formatting:
- Italic lines for stream-of-consciousness thinking
- Bold for agent questions
- Distinct marker for user responses

Exact markdown conventions to be defined in the spec.

### 5. File naming — follows existing convention

`{sprint-name}-interview-00.md` in the `design/` subdirectory, consistent with the thinking and design brief artifacts.

## Unchanged

All existing figure-out artifacts (thinking summary, design brief) remain as-is. The transcript is additive.
