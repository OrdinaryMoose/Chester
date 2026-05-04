# Plan Threat Report — trim-skill-bloat (review-session-behaviour skill)

**Plan reviewed:** `docs/chester/working/20260416-01-trim-skill-bloat/plan/trim-skill-bloat-plan-00.md`
**Risk level:** Significant
**Reviews:** plan-attack (C=4, H=5, M=6, L=4) + plan-smell (11 groups)

---

## Compounding Risks (Top 5)

### 1. Seed pattern library produces zero matches across the entire 4.6 archive

**From plan-attack C3:** Tested the full Task 5 rationalization regex, Task 7 rule-language scaffold strings, and skill-reference strings against every `.jsonl` under `docs/chester/plans/*/summary/`. Zero matches in every sprint.

**Why this is architectural, not tactical:** The seed vocabulary was derived from the counter-argument tables in `execute-test` and `execute-prove` — i.e., from what the rationalization tables *tell the model not to say*. The model, unsurprisingly, doesn't use those exact phrases in thinking. The vocabulary needs to be calibrated from observation of actual 4.6 rationalization patterns, not from the skill content it was supposed to detect.

**Impact on Task 9:** The behavioural acceptance criteria cannot be evaluated as written. Reports will emit "No rationalization events matched" for every fixture, pass the mechanical checks, and fail to produce the evidence the brief is designed to collect.

### 2. Pattern Library editability contract is broken by inline regex duplication

**From plan-smell Group 1:** The library lists ~35 phrases across 6 families. Task 5's extraction query inlines a mega-regex containing every phrase. Tasks 6 and 7 do the same for their respective vocabulary sections. A user who follows the brief's evolution guidance ("add phrases to the library as patterns accumulate") will see no behavioural change — the library section is decorative; the inline regex is what runs.

**Impact:** The design brief's Key Decision 8 (Pattern library as seed, evolves via user edits) is falsified by the plan's implementation.

### 3. Index-space collision between rationalization and verification tasks

**From plan-attack C2:** Task 5 builds a thinking-block-only array and indexes it. Task 6 indexes the whole jsonl record stream. Both are labelled "#NN" in the report tables and cross-referenced in the Raw Evidence Appendix. The two indexes do not refer to the same positions.

**Impact:** The Appendix's line-reference comments (`<!-- jsonl line ~<approx>, message #<index> -->`) are undefined. A reader trying to locate evidence in the source jsonl from the appendix reference will find nothing.

### 4. Report assembly heredoc calls undefined functions

**From plan-attack H3 and plan-smell Group 5:** Task 8 Step 2 writes a heredoc containing `$(render_rationalization_table)`, `$(render_verification_table)`, `$(render_scaffold_block)`, `$(render_appendix)`. These are not defined. The plan explicitly states (line 807) that the invoking agent should "compose their output inline" but provides no procedure for doing so. Executed as written, the heredoc writes reports with empty signal sections.

**Impact:** The implementation would produce a file at the expected path with a valid metadata header and empty bodies. Task 9 Step 2's `head -20` check would pass.

### 5. Silent failure modes compound across the pipeline

**From plan-smell Group 7 and plan-attack H1/H2:**
- `2>/dev/null` on all jq calls swallows genuine query errors
- "Zero-match is valid output" is the documented behaviour — indistinguishable from "extraction broke"
- Verification steps (Task 5 Step 2, Task 6 Step 3, etc.) run different simplified regexes than the inlined production ones, so transcription errors wouldn't be caught
- `USER_CORRECTIONS` regex runs against all `type==user` records, but 90% of those are `tool_result` echo-back containing skill template text — the count is dominated by noise, not real corrections
- `jq '[inputs] | ...'` without `-n` silently drops the first jsonl record

**Impact:** A broken extraction pipeline would produce empty-but-well-formatted reports that pass every mechanical check. Task 9's "read the report and assess" step has no way to distinguish "clean session" from "broken tool."

---

## Secondary Concerns (not blocking but worth mitigating)

- **Compliance-Reversal vocabulary defined but unused** (Smell 2) — sample output shows a "Reversal in next block?" column with no query to populate it
- **Rationalization extraction drops 4 of 5 promised output fields** (Smell 3) — only `(index, text)` is emitted; family-matched, next-tool, reversal-check are all unreachable
- **Task 7 expects `capture_thought` in fixture 1** (Attack C4) — fixture 1 didn't exercise `design-figure-out`, so no `capture_thought` calls exist
- **NN versioning breaks at 100+ runs** (Smell 6) — `sed '[0-9][0-9]'` pattern drops 3-digit sequences silently
- **Task 8 responsibility overload** (Smell 10) — 150 lines bundling appendix spec, report template, and assembly procedure
- **Implementation-log path contradiction** (Smell 11) — Task 1 Step 4 and Notes section disagree on the path

---

## Four Options for the Designer

### Option 1 — Proceed as-written
Accept that v1 will produce empty reports against the 4.6 archive. Frame Task 9 as "verify pipeline mechanics, not signal presence." Defer pattern calibration until 4.7 sessions accumulate. Downside: the brief's observation-first thesis is unfalsified — you won't know if the extraction layer works because it finds nothing regardless.

### Option 2 — Proceed with directed mitigations (recommended for speed)
Build the skill but layer these fixes into the tasks before dispatch:
- **Before Task 4:** Spend 20–30 minutes sampling thinking blocks from 3 archived sessions. Extract real rationalization-shaped phrases observed (likely different from the skill's counter-argument table phrases). Use these as the seed library instead of the current list.
- **Merge Tasks 5/6/7 with Task 4:** Make the Pattern Library the single source. Extraction queries construct their regex at runtime by sourcing the library section (e.g., reading the SKILL.md itself and extracting lines inside the `### Rationalization Vocabulary` fences). This eliminates Smell 1.
- **Unify index space:** Both tasks index the same whole-jsonl record stream with consistent labelling.
- **Replace `render_*` stubs with inline assembly:** Each extraction produces its markdown table directly into the heredoc, not via undefined functions.
- **Fix USER_CORRECTIONS:** Filter to user messages whose content is a string (not tool_result array) before regex matching.
- **Add jq `-n` flag** to all `[inputs]` queries.
- **Add a "pipeline integrity" check** at the top of Task 9 — e.g., run one known-matching test phrase through the full pipeline and verify it surfaces in the report. This distinguishes broken extraction from clean session.

Estimated additional work: 1–2 hours of plan edits before dispatch. Implementation risk drops from Significant to Moderate.

### Option 3 — Return to design with additional requirements
The zero-match finding is evidence that the seed pattern library premise was wrong. That's a design-layer insight, not a plan-layer bug. Consider whether the design brief should be updated to require an empirical pattern-calibration pass *before* the skill ships — i.e., the skill's job isn't "extract from a seeded library" but "assist the designer in surfacing candidate patterns from a sprint, which the designer then curates into the library." This reframes the skill from pattern-matcher to pattern-discovery tool.

Downside: larger scope, more design work, delays the immediate output.

### Option 4 — Stop
The observation-first pivot was a reasonable response to the original trim proposal, but if the pattern approach doesn't actually find signal in the archive, maybe the answer is to wait until 4.7 sessions accumulate and reconsider what tooling would be useful. Keep `execute-test` and `execute-prove` unchanged. Revisit in N months.

Downside: no progress on the original question; no infrastructure for future decisions.

---

## Recommendation

**Option 2** — proceed with directed mitigations. The directed mitigations address every Critical and High finding. The architectural insight from C3 (seed library needs calibration, not speculation) can be addressed with a 20–30 minute sampling pass before Task 4 starts. That pass is exactly the kind of work the skill is meant to enable, so doing it once manually is useful context for the tool's eventual users — you'll have firsthand experience of what calibration looks like.

If the directed mitigations look too invasive or time-consuming, Option 3 is the next-best choice: treat the zero-match finding as a design signal and update the brief to reflect what was learned.
