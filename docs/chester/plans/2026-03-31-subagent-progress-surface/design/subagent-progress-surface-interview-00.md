# Interview Transcript — Subagent Progress Surface

**Date:** 2026-03-31
**Sprint:** sprint-NNN-subagent-progress-surface

---

**The subagent progress visibility feature shipped in sprint-007 has two failures: (1) status lines are buried in the ctrl+o expandable section rather than the main screen, and (2) the subagent ignored the progress instructions entirely, dumping raw tool calls instead of formatted status lines. The root cause is that the original design assumed subagent text output was visible on the main screen — it isn't — and that soft prompt instructions would be reliably followed — they weren't.**

> Confirmed.

---

*The original design relied on two assumptions that both turned out to be wrong. The first is a platform constraint — Claude Code routes subagent output to an expansion panel. The second is a behavioral reliability problem — agents under cognitive load deprioritize formatting instructions.*

**When you say the agent "took us literally," what exactly were you expecting to see versus what you got?**

> User provided annotated screenshot showing the Progress Reporting instructions circled in red — the instructions are visible in the subagent's expanded output, but the agent completely ignored them. Below the instructions: a wall of raw tool calls (Read, Search, Bash, Update) with zero formatted status lines.

---

*The agent received the instructions and completely ignored them. The instructions became visible output rather than acted-upon behavior.*

**Does the compliance failure bother you more than the surface problem? If the agent had emitted formatted status lines but they were still in the ctrl+o panel, would that have been acceptable?**

> No — on the main screen is the non-negotiable.

---

*Main screen visibility is the non-negotiable. The orchestrator is the only thing that can print to the main screen. Subagents can't.*

**The mechanism I can see working is: dispatch agents in background, have them append progress to a shared file, orchestrator polls and prints. That's a significant architecture shift. Are you comfortable with that?**

> No. Can the orchestrator use the task list to dynamically update? At the orchestrator dispatch and return level?

---

*Task list — the orchestrator controls it, it shows on the main screen.*

**That's doable — the orchestrator creates a task per subagent, updates on return. But this only gives dispatch/return boundaries. Is that granularity enough?**

> How is that different than what we have now?

---

*Good point — dispatch/return boundaries are trivially different from what already happens.*

**If the orchestrator creates a task per subagent and passes the task ID, the subagent could call TaskUpdate itself to change the spinner text mid-execution. Live mid-execution visibility. Worth exploring?**

> If we have 10 agents working, what would the spinner show?

---

**I'm not certain. Want me to test it?**

> Sure.

---

*Experiment: Created 3 tasks (Alpha, Beta, Gamma) with different activeForm text, set all to in_progress.*

> All three visible but only show titles, not activeForm text.

---

*Updated subjects to progress-style text. Tested hierarchy with sub-steps.*

> Visible but formatting is confusing. Task list is flat, no hierarchy, Chester's own tasks mixed in with agent tasks.

---

*Task list is the wrong tool — flat, noisy, no grouping.*

**What if the orchestrator just prints text lines? Dispatch line when launched, summary line when each agent returns. For parallel agents, return lines appear one by one as agents finish.**

```
Dispatched: Alpha — reading auth tests
Dispatched: Beta — scanning migrations
Dispatched: Gamma — analyzing API surface
Completed: Alpha — 3 files updated, tests pass
Completed: Gamma — no contract breakage found
Completed: Beta — 2 migration gaps identified
```

**No mid-execution visibility, but real progress as agents finish. Enough?**

> Yes, go with this.

---

### Checkpoint — 7 questions

**Resolved:** Orchestrator prints dispatch/return lines on main screen. Format: `{agent} {task}:{action}-{short summary}`. No mid-execution updates needed. No task list abuse. No polling loops. No prompt-based subagent text emission.

**Ruled out:** Shared file polling, task list for progress, subagent text output, activeForm spinner.
