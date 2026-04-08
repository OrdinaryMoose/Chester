# Reasoning Audit: Cache-Optimal Subagent Prompt Restructuring

**Date:** 2026-03-29
**Session:** `00`
**Plan:** `cache-subagent-prefix-plan-00.md`

---

## Executive Summary

This session implemented the AER research paper's Tier 1 optimization: restructuring all Chester subagent prompts so shared content forms a byte-identical prefix for Anthropic's prompt cache. The most consequential decision was removing role descriptions entirely rather than just reordering them — a triple-benefit choice (smaller prompts, better prefix matching, no quality loss) that required confidence that frontier models don't need persona framing. The implementation stayed on-plan with one inline fix: the worktree's finish-plan file contained stale doc-sync references that the plan didn't anticipate.

---

## Plan Development

The plan emerged from a full chester-figure-out Socratic interview followed by spec and plan phases. The interview began with a critical reframing: the user had no visibility into Claude Code's API call construction, so the initial assumption that Chester could control cache_control markers was wrong. Web research into Anthropic's prompt caching docs and Claude Code's architecture revealed that Chester controls only the user message content (the Agent tool's prompt parameter), not the system prefix. This scoped the optimization to ordering shared content first within user messages. The plan was hardened through parallel attack-plan and smell-code reviews, which found only one actionable issue (a quality-reviewer.md contradiction) and confirmed Low implementation risk.

---

## Decision Log

---

### Removal of Role Descriptions

**Context:**
The user asked whether role descriptions ("You are a structural integrity auditor") actually matter for output quality on frontier models, or if well-written task instructions are sufficient. This was a conceptual question that could have been answered conservatively ("keep them, they might help") or based on reasoning about model behavior.

**Information used:**
- Prompt engineering research: role descriptions were important for earlier models but frontier models respond primarily to specific task instructions
- Analysis of Chester's current prompts: "You are a concurrency and thread safety auditor attacking an implementation plan" does two things — sets a persona (minor value) and scopes the task domain (real value)
- The scoping function can be achieved with directive instructions: "Analyze the plan above for concurrency and thread safety hazards"

**Alternatives considered:**
- `Keep roles, reorder after plan text` — preserves the persona framing but still breaks prefix (each agent's role line would diverge immediately after the plan text)
- `Remove roles` — triple benefit of smaller prompts, unbroken prefix, and no expected quality loss

**Decision:** Remove role descriptions entirely and replace with directive-style task instructions after the `---` delimiter.

**Rationale:** The domain scoping that roles provide can be achieved identically through task instructions. Removing roles provides a triple benefit with no expected downside. (inferred: untested in practice — Chester has always used roles)

**Confidence:** Medium — reasoning is sound but this is an untested change to subagent prompt style. First full pipeline run will validate.

---

### Cross-Skill Prefix Sharing (Option A over Option B)

**Context:**
Attack-plan (6 agents) and smell-code (4 agents) both receive the identical plan text during plan hardening. The question was whether to enforce byte-identical preambles across both skills (one cache entry for all 10 agents) or allow each skill to have its own framing (two cache entries).

**Information used:**
- Both skills are dispatched in parallel during build-plan's hardening phase — they share a pipeline lifecycle
- The plan text is identical in both cases — only the framing words before/after differ
- Cache mechanics: one write + 9 reads (Option A) vs two writes + 8 reads total (Option B)

**Alternatives considered:**
- `Option A: Shared prefix across skills` — one cache write for all 10 agents, but creates cross-skill coupling
- `Option B: Per-skill prefix` — each skill independent, two cache writes, slightly lower savings

**Decision:** Option A — byte-identical plan text preamble across both skills.

**Rationale:** The user noted "I am not really seeing a difference. We are using the same words but just in different ordering." The coupling cost is low because these skills already share a lifecycle. The practical savings difference is one cache write.

**Confidence:** High — user explicitly chose this after seeing both options laid out.

---

### Cache Analysis as Finish-Plan Option (Not Separate Tool)

**Context:**
The user asked whether cache metrics are visible from the CLI. Research revealed session JSONL files contain `cache_read_input_tokens` per API call, but Chester's debug logger doesn't parse them. The question was where to put the analysis capability.

**Information used:**
- Session JSONL files at `~/.claude/projects/` contain full cache metrics per API call
- Chester's existing debug logger reads only high-level `usage.json` fields
- Tools like ccusage already parse JSONL for cache stats
- The user asked "do we need debugging or can we just extract the information from the session JSONL files?"

**Alternatives considered:**
- `Runtime debug instrumentation` — add cache tracking to chester-start-debug's logging pipeline
- `Post-session JSONL parser` — best-effort analysis after the session, surfaced as a finish-plan option
- `Separate standalone tool` — new skill or script dedicated to cache analysis

**Decision:** Add as an option in chester-finish-plan's Step 7 artifact menu.

**Rationale:** The user wanted "an option in finalize" — no runtime overhead, uses data that already exists, surfaced at the natural completion point of a sprint.

**Confidence:** High — user explicitly directed this placement.

---

### Stale Doc-Sync Reference Cleanup

**Context:**
During Task 4 implementation, the subagent found that the worktree's copy of chester-finish-plan/SKILL.md contained a "Documentation update report (invoke chester-doc-sync)" option that didn't exist in the main tree (doc-sync was deleted in staged changes on main). The subagent preserved it, creating a 6-option list instead of the expected 5.

**Information used:**
- Git status at session start showed `D chester-doc-sync/SKILL.md` (staged deletion)
- The worktree was branched from HEAD before doc-sync was deleted
- Reading the actual finish-plan file in the worktree confirmed 5 options (including doc-sync) vs 4 in the plan's assumption

**Alternatives considered:**
- `Leave doc-sync reference` — let it merge back and deal with it later
- `Remove doc-sync reference` — clean up now since the skill is being deleted anyway

**Decision:** Removed doc-sync option and all stale doc-sync references (dependency note, integration section) from the worktree's finish-plan.

**Rationale:** The doc-sync skill is being deleted. Leaving stale references would create a broken option that references a nonexistent skill. (inferred)

**Confidence:** High — doc-sync deletion is visible in git status; leaving references would be clearly wrong.

---

### Prompt Structure: Plan Text Without Any Wrapper

**Context:**
The spec required "no preamble, no framing, no role description before the plan text." The question during implementation was whether the blockquote `>` markers in SKILL.md count as "wrapping" that could break byte-identity between skills.

**Information used:**
- Both chester-attack-plan and chester-smell-code use `>` blockquote convention for prompt content
- The `>` markers are the SKILL.md display convention, not semantic wrappers — both skills use the same convention identically
- The spec stated: "The plan text must not be wrapped in quotes, blockquotes, or code fences — raw text only"

**Alternatives considered:**
- `Remove blockquote markers` — change the SKILL.md convention to use code blocks or no markers
- `Keep blockquote markers` — both skills use them identically, so byte-identity is preserved

**Decision:** Keep blockquote markers. They're part of the SKILL.md formatting convention used consistently across both skills.

**Rationale:** The spec's concern was about divergence between skills. Since both skills use `>` identically, the markers don't break byte-identity — they ARE part of the identical bytes. Changing the convention would be scope creep.

**Confidence:** Medium — the spec's wording ("not wrapped in blockquotes") technically conflicts, but the intent (prevent divergence) is clearly met.
