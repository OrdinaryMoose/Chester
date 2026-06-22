# Pragmatist Transcript — Round 05
# Sprint: 20260604-02-review-start-context
# Role: Pragmatist
# Date: 2026-06-06
# Task: Attack the draft plan. Lens = over-engineering, untestable claims, hidden cost, LOC creep.

## Ground-Truth Gathered Before Writing

Read before writing any claim:
- `chester-util-config/session-start` — 32 lines, escape_for_json exact (5 substitutions), envelope
  wraps as `<EXTREMELY_IMPORTANT>\nYou have Chester.\n\n...\n\n---\n{skill_escaped}\n\n\n</EXTREMELY_IMPORTANT>`
- `skills/setup-start/SKILL.md` — 207 lines (208 with trailing newline). Section map confirmed
  against draft plan. Checks 0-3 at lines 113-160. Mandate blocks at lines 7-9, 11-17, 19-27,
  162-164, 166-172, 174-191, 193-199, 205-207. No existing HTML-comment markers.

---

## Attack target 1: T8 round-trip — jq -r + awk across the actual envelope

**Claim in draft plan §T8:** full-block verbatim diff works. Purist confirmed `jq -r` inverts
`escape_for_json` exactly.

**Pragmatist attack — SURVIVES. No kill-shot, but one whitespace hazard to note.**

Tracing the pipeline carefully:

The compact stub passes through `escape_for_json` → JSON string → `printf` → `jq -r` decode.
Result: literal envelope text with `<EXTREMELY_IMPORTANT>` wrapper, `---` separator, then the
stub body (orientation line + 8 marked blocks), then `\n\n\n</EXTREMELY_IMPORTANT>`.

The awk scan on the decoded additionalContext starts at `capturing=0`. It sees:
- `<EXTREMELY_IMPORTANT>` — not a marker. Skipped.
- envelope preamble lines — not markers. Skipped.
- `---` separator — not a marker. Skipped.
- `# Session context: housekeeping...` — orientation line, not a marker. Skipped.
- `<!-- mandate-block:subagent-stop start -->` — first marker. `capturing=1`.
- block content lines — captured.
- `<!-- mandate-block:subagent-stop end -->` — `capturing=0`.
- ... (inter-block content, if any)
- ... (repeat for 8 blocks)

The envelope doesn't contaminate extraction. The orientation line is pre-marker. Clean.

**One real concern: the envelope's `\n\n\n` before `</EXTREMELY_IMPORTANT>`.**
After `jq -r` decodes, there are three literal newlines before `</EXTREMELY_IMPORTANT>`. The
last mandate block ends before these (after `<!-- mandate-block:user-instructions end -->`).
The awk is `capturing=0` at that point. Those trailing newlines are not captured. No false-fail.

**Trailing-newline symmetry in diff:** Both sides use `printf '%s\n' "$EXPECTED"` and
`printf '%s\n' "$ACTUAL"`. EXPECTED comes from awk on SKILL.md — awk captures through line 207
(`Instructions say WHAT...`) and NOT line 208 (blank) because the end marker fires before it.
ACTUAL comes from same awk on decoded additionalContext. Same awk logic; same blank-line
exclusion at end. Both `printf '%s\n'` calls add exactly one trailing newline. Symmetric.

**Hazard flagged (non-blocking):** if the stub heredoc has a trailing blank line after the last
block's end marker, that blank enters the envelope but is outside `capturing=1` — harmless.
If the blank is INSIDE the last block's markers, awk captures it and EXPECTED/ACTUAL both get it.
Symmetric as long as the heredoc exactly mirrors SKILL.md block content. The implementer must
ensure marker placement is byte-exact per spec — this is exactly what the plan says.

**Verdict: T8 round-trip survives attack. Implement as specced.**

---

## Attack target 2: Marker scheme — uniform 8 HTML vs two-tag (6 HTML + 2 XML-reuse)

**Two-tag proposal:** reuse `<SUBAGENT-STOP>` and `<EXTREMELY-IMPORTANT>` XML tags as their own
delimiters for the first two blocks. Saves 4 lines of HTML comment markup in SKILL.md.

**Pragmatist attack — TWO-TAG IS A KILL-SHOT ON ITSELF. Uniform 8 wins.**

The two-tag scheme breaks T8's block-count assertion:

```bash
BLOCK_COUNT=$(grep -c 'mandate-block:.*start' "$CHESTER_ROOT/skills/setup-start/SKILL.md" || true)
[ "$BLOCK_COUNT" -eq 8 ] || fail "T8: expected 8 blocks..."
STUB_COUNT=$(printf '%s' "$COMPACT_CTX" | grep -c 'mandate-block:.*start' || true)
[ "$STUB_COUNT" -eq 8 ] || fail "T8: expected 8 blocks in compact stub..."
```

With two-tag: `grep -c 'mandate-block:.*start'` finds only 6. The test fails on line 2 unless the
assert is changed to 6. But then the full-block diff awk only extracts 6 blocks. If SUBAGENT-STOP
or EXTREMELY-IMPORTANT drift (e.g., "1%" changed to "2%"), the diff doesn't catch it because
those blocks were never extracted by the awk. Case (a) from spec §4.3 is silently undetected.

**The only fix for two-tag is a two-pattern awk** — one for XML delimiters, one for HTML markers —
plus a separate count check for the XML blocks. That's MORE complexity, not less.

**Net: two-tag saves 4 lines of markup but breaks T8's uniform extraction. One convention, one
grep, one awk is the plan's load-bearing property. Uniform 8 is not over-engineering — it's the
minimum for T8 to work correctly on all 8 blocks.**

---

## Attack target 3: Task 1+2 split vs merge — defend or concede

**Draft plan:** split (Purist/Conservator position). Pragmatist prior: merge.

**Pragmatist attack on own position — CONCEDE SPLIT. Not a kill-shot on the plan; the draft is
correct.**

Split rationale is valid: markers (Task 1) and behavioral retirement (Task 2) are different
concerns with different rollback paths. If marker insertion causes an unexpected test failure
(T8 greps for 16 markers before session-start is rewritten — would T8 even run red?), that's
isolated. If check removal introduces a line-count discrepancy in the file, that's isolated.

The "intermediate state" concern (markers present + checks present) is harmless: session-start
still emits full body unconditionally until Task 4. No user-visible intermediate state.

**Concede: split is cleaner. The draft plan's Task 1 + Task 2 split is correct.**

---

## Attack target 4: Inline execution mode

**Draft plan:** inline (unanimous round04).

**Pragmatist attack — SURVIVES. Still correct.**

Five tasks, ~240 LOC gross (see LOC correction below). The coupling between tasks is tight:
- Task 4 heredoc copies Task 1+2 SKILL.md verbatim.
- Task 3 T8 awk greps Task 1 markers.
- Any subagent for Task 4 would need to read the post-Task-1+2 SKILL.md in full.

Subagent overhead: each subagent re-reads ~174-line SKILL.md + ~95-line session-start + test
file. For ~35-65 lines of actual writing per task, the read-overhead dominates. Inline keeps the
executor context-laden and moving.

No task wants isolation: none are independently deployable, none are >200 LOC, no parallel
execution opportunity (strict linear dependency chain).

**Verdict: inline stands.**

---

## Attack target 5: Hidden LOC cost

**KILL-SHOT on the ~148 LOC estimate. Actual gross is ~240.**

The discrepancy:

Draft plan Task 4 says "~95–105 lines (heredoc content ~57 lines is the bulk)." Prior Pragmatist
P8 said "+35 net" from a 67-line estimate. These cannot both be right. Let me count:

session-start rewrite structure:
- Shebang + set + SCRIPT_DIR + CHESTER_ROOT setup: ~6 lines
- INPUT/TRIGGER extraction: ~2 lines
- `escape_for_json()` function: ~8 lines (unchanged)
- compact branch + heredoc stub: ~3 lines open + orientation line + 8 blocks + ~3 close = ~7 + ~57 = ~64 lines
- full path: config read + raw_content + frontmatter strip + wide-strip sed (conditional) + fi: ~9 lines
- shared escape + wrap + printf + exit: ~5 lines
- Total: ~6 + 2 + 8 + 64 + 9 + 5 = ~94 lines

That's ~94-100 lines, consistent with the draft plan's "~95-105." My prior P8 "67 lines" was
wrong — I forgot the heredoc body counts toward the line total.

**Revised LOC table:**

| Surface | Change | Gross LOC |
|---|---|---|
| `session-start` | Rewrite 32→~95-100 | ~95-100 |
| `SKILL.md` | +16 markers (Task 1) | +16 |
| `SKILL.md` | −49 checks (Task 2) | −49 |
| `test-session-start.sh` | New file (Task 3) | ~80 |
| `hooks.json` | Unchanged | 0 |

**Gross new/changed lines:** ~95 (session-start) + 16 (markers added) + 80 (test) = ~191 lines
changed or new. Net including removals: ~191 − 49 (checks removed) − 32 (old session-start
replaced) = ~110 net. Either way, ~148 was understated by ~40 lines gross.

**This is not a plan-level defect** — the task structure, sequencing, and contracts are all
correct. The LOC estimate was a miscalculation in P8 that the draft inherited. It should be
corrected in the final plan.

---

## Summary: what survived, what changed

**Kill-shots on the plan:** none. Plan survives attack.

**Changes from attack:**

1. **Two-tag rejected** (not just "style call" — it actively breaks T8 uniform extraction).
   Uniform 8 HTML markers confirmed as the only correct scheme.
2. **Task 1+2 split confirmed** (Pragmatist concedes own prior "merge" position).
3. **LOC estimate corrected:** ~148 → ~191 gross new/changed. ~110 net. The undercount came
   from excluding the heredoc body from the session-start line count.
4. **T8 round-trip confirmed survives** with no false-fail hazards beyond implementer care on
   marker placement.

**No blocking issues. Plan is buildable as specced.**

---

## Peer exchanges (round05)

### Innovator → Pragmatist: runtime extraction vs heredoc

Innovator proposes: with uniform HTML markers in SKILL.md, the compact branch of session-start
does awk extraction at runtime instead of a heredoc copy. Single-pattern awk, ~3 lines.
Claimed net savings: heredoc ~57 lines off session-start + T8 ~20 lines off test = ~74 lines.

**Pragmatist analysis:**

**LOC math checks out.** Heredoc body is ~57 lines (orientation + 8 blocks). T8 (~20 lines)
collapses to a count assertion (~3 lines, same as T1) or drops. Net ~74 lines removed, ~3 added.

**Round03 rejection doesn't apply.** Prior rejection was marker-free multi-region awk (complex
per-block pattern, different stop conditions per block). With uniform `<!-- mandate-block -->` markers,
the extraction is one pattern across all 8 blocks. Single awk pass, not 8 separate invocations.

**Drift control: stronger, not weaker.** Under runtime extraction, the compact stub IS the SKILL.md
mandate blocks by construction. Drift is structurally impossible (no copy to drift). F3 verbatim CI
test and T8 full-block diff are no longer needed — the problem they solved doesn't exist. This is
a higher-level solution than the heredoc approach.

**T8 collapses.** Under runtime extraction, T8 can't fail unless the awk itself is broken.
It reduces to: "compact output contains all 8 marked blocks" — same as T1's mandate-present
assertion, just with a count. T8 drops to ~3 lines or merges with T1. ~17 lines saved from test.

**New failure surface: SKILL.md unreadable at compact time.**
This IS a new dependency for the compact path (current heredoc never reads SKILL.md on compact).
But SKILL.md unreadability already breaks startup/clear paths. Adding the same failure class to
compact is not a new category. Guard needed: `[ -n "$stub_content" ] || { emit_full_payload; exit 0; }`.
One line. Empty-extraction → fall back to full payload (same fallback as malformed JSON).

**Orientation line:** prepend explicitly before the awk output:
```bash
stub_content=$(printf '# Session context: housekeeping already complete this session. Mandate only.\n'; \
  awk '/<!-- mandate-block:.*start -->/{c=1; next} /<!-- mandate-block:.*end -->/{c=0; next} c{print}' \
  "${CHESTER_ROOT}/skills/setup-start/SKILL.md")
```

**One regex note:** Innovator's awk used `<!-- mandate-block .* start -->` (space-dot-star, no colon).
Correct pattern is `/<!-- mandate-block:.*start -->/` (colon, no space before slug). Implementer fix.

**Pragmatist verdict: runtime extraction PASSES minimum-ceremony test.**
Net minus ~74 lines is real. Drift solved at construction level. T8 collapses to T1-level check.
One new empty-extraction guard (~1 line). Task 4 LOC drops from ~95-100 to ~40-45. Test LOC drops
from ~80 to ~60. Revised gross total: ~40 (session-start) + 16 (markers) + 60 (test) = ~116 gross.

**Position: support Innovator's runtime extraction. Recommend adopting over heredoc.**

**Pending researcher confirmation** (Q1: inter-block blank line count; Q2: empty-extraction guard
structural impact). Will update if researcher findings change the analysis.

### Researcher findings (Q1 + Q2) — DECISIVE, CONFIRMS AND STRENGTHENS POSITION

**Q1 — Inter-block blank counts (from direct measurement):**

| Gap | Blank lines | Non-blank content |
|-----|-------------|-------------------|
| SUBAGENT-STOP → EXTREMELY-IMPORTANT | 1 | none |
| EXTREMELY-IMPORTANT → Instruction Priority | 1 | none |
| Instruction Priority → How to Access Skills | 24 blanks in 134 lines | YES — Session Housekeeping |
| How to Access Skills → Using Skills+The Rule | 1 | none |
| The Rule → Red Flags | 1 | none |
| Red Flags → Skill Types | 1 | none |
| Skill Types → User Instructions | 3 blanks in 5 lines | YES — ## Choosing Between Skills (2 lines) |

**Key finding:** gaps 3→4 (134 lines) and 7→8 (5 lines) contain non-mandate content. The awk
extraction (`capturing=0` between markers) produces ZERO separator between blocks 3 and 4, and
ZERO separator between blocks 7 and 8. All other adjacent pairs: exactly 1 blank.

**Implication for runtime extraction:** no normalization problem. The awk output IS the canonical
form. The compact stub will have zero separator at 3→4 and 7→8, one blank at all other inter-block
gaps. Consistent by construction.

**Implication for heredoc (strengthens case against it):** the heredoc must exactly match this awk
output. Implementer must know to put zero separator at 3→4 and 7→8 — not derivable from visual
inspection of SKILL.md (the gaps look like they have content between them). This is a hidden
footgun the runtime extraction approach completely avoids.

**Q2 — Empty-extraction guard: one if-statement, no structural change confirmed.**

`[ -n "$stub_content" ] || stub_content="$full_skill_content"` inside the compact branch only.
Existing escape + printf emitter unchanged. Fallback variable must be the already-computed
full_skill_content (or recompute) — same shape as malformed-JSON fallback. No structural change.

**Position confirmed and strengthened. Runtime extraction is superior to heredoc on all axes:**
- LOC: ~74 lines fewer
- Drift: impossible by construction vs tested
- Inter-block separator: derived automatically vs hidden footgun for implementer
- Empty-guard: 1 line

---
<!-- created-at: 2026-06-06 -->
<!-- role: pragmatist -->
<!-- round: 05 -->
