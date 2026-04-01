# Interview Transcript — Transcript Verbatim Research

**Date:** 2026-04-01
**Sprint:** sprint-NNN-transcript-verbatim-research

---

**The interview transcript captures agent questions and user responses accurately, but loses the agent's research process. When the agent explores the codebase during the interview — reading files, discovering patterns, understanding existing architecture — those findings are condensed into single-line summaries in the transcript instead of being preserved verbatim. This strips the context that informed each design question, making the transcript an incomplete record of how decisions were reached.**

---

*The current transcript spec defines three lanes: italic thinking, bold questions, blockquote responses. But there's a fourth activity happening during interviews — the agent reads code, discovers patterns, gathers evidence. That activity has no defined lane.*

*The spec says "content to capture: only interview interactions" and "content to exclude: tool calls, MCP outputs." Agent research falls in a grey zone — it's not a tool call, but it's not stream-of-consciousness thinking either. It's the findings that result from tool calls.*

*I need to understand what "verbatim" means to the user here — the raw tool output, the agent's synthesis of what it found, or something in between.*

**When you say the research should be output "verbatim," what specifically are you picturing? The agent's narrative description of what it found in the code, or the actual raw content it read from files?**

> The three underlined lines are important context for the user when answering questions but the three lines are being summarized into a single bullet. That single bullet is not helpful in the transcript. The three underlined lines should be printed verbatim in the transcript.

---

*So the user is pointing at the stream-of-consciousness thinking lines themselves — the italic lines I just wrote. Those three paragraphs appeared on screen during the interview, but when the transcript was compiled, they got collapsed into a single summarized bullet.*

*This isn't about raw tool output at all. The stream-of-consciousness thinking is already being produced correctly in the conversation — the problem is that the transcript file gets a condensed version instead of the full text that was displayed.*

*That means the issue is in the append step — when writing to the transcript file, the agent is summarizing its own thinking instead of copying the exact text it just displayed.*

**So to confirm: the italic thinking lines that appear on screen during our conversation right now — like the three paragraphs I just wrote above — those exact lines should appear in the transcript file, word for word, not rewritten or condensed. Is that right?**

> Yes.

---
