# Conservator Transcript — Round 02
# Sprint: 20260604-02-review-start-context
# Role: Conservator
# Date: 2026-06-05
# Phase: DEVELOP (design is settled; this round writes the spec)

---

## Lens

Conservator priority: minimize disruption to the working structure; keep existing patterns;
single source of truth for the mandate text; no new surface that can independently drift.
The design is settled — this round resolves the implementation contracts.

---

## Ground-Truth Inventory (established before writing)

**Session-start script — current state:**
- 33 lines. Reads zero stdin. One `cat` of setup-start/SKILL.md, strips frontmatter, emits
  full body unconditionally as JSON `additionalContext`.
- No INPUT, no jq, no trigger branch. Pattern to add: `INPUT=$(cat)` + `jq -r '.trigger'`.

**Pre/PostCompact scripts — stdin pattern (existing, working):**
- Both open with `INPUT=$(cat)` then extract fields via `jq -r '.field // ""'`.
- Test fixture confirms the full stdin JSON shape:
  `{"session_id":"...","transcript_path":"...","cwd":"...","hook_event_name":"PreCompact","trigger":"auto"}`
- `hook_event_name` = the hook type (constant per hook registration).
- `trigger` = the event subtype (varies: `"auto"` for PreCompact; for SessionStart presumably
  `"startup"`, `"clear"`, `"compact"` matching the hook matcher strings).

**DMed researcher** to confirm: (a) correct field to branch on is `trigger` not `hook_event_name`,
(b) exact string values for the three SessionStart triggers, (c) whether field can be absent.
Transcript is written before confirmation; question D will be flagged for revision if needed.

**setup-start/SKILL.md bucket boundaries (from prior committee measure):**
- Lines 1–5: frontmatter (stripped before injection)
- Lines 7–9: SUBAGENT-STOP
- Lines 11–17: EXTREMELY-IMPORTANT
- Lines 19–27: Instruction Priority
- Lines 29–161: Session Housekeeping (first-run wizard + verification checks)
  - First-run wizard: lines ~33–111 (~700 tokens)
  - Verification checks 0–3: lines ~113–161 (~500 tokens)
- Lines 163–207: Skill Discovery mandate
  - "## How to Access Skills": line 163
  - "## The Rule": line 168
  - "## Red Flags": line 174 (~260 tokens, 12-row table)
  - "## Skill Types": line 193 (~49 tokens)
  - "## Choosing Between Skills": line ~196 (~109 tokens)
  - "## User Instructions": line ~207

**Token measures (from Researcher's prior round):**
- SUBAGENT-STOP: ~29 tokens
- EXTREMELY-IMPORTANT mandate: ~84 tokens
- Instruction Priority: ~118 tokens
- The Rule: ~166 tokens
- Red Flags table: ~260 tokens
- Skill Types: ~49 tokens
- Total compaction floor (all of above): ~706 tokens
- First-run wizard: ~696 tokens (deferrable on established projects AND on compact)
- Verification checks: ~492 tokens (deferrable on compact)
- Choosing Between Skills + User Instructions: ~109 tokens (deferrable on compact)
- Full body: ~2,014 tokens

---

## Positions on A–H

### A. Payload assembly — WHERE does the compact stub live?

**Decision: inline heredoc in session-start. Not a separate file.**

Options evaluated:

(i) Separate file (`setup-start/references/compact-stub.md`):
- Creates a new artifact that must stay synchronized with the canonical SKILL.md mandate
  blocks. Every mandate edit requires touching two files. Drift is guaranteed over time
  because the sync requirement is implicit — no tooling enforces it.
- Also inverts the data-flow: session-start currently reads one file (SKILL.md) and emits
  it. Adding a second file introduces a second read path and a new file to maintain.

(ii) Inline heredoc in session-start:
- Appears to create the same drift problem — mandate text in the script, mandate text in
  SKILL.md, two copies. BUT: this is the wrong framing (see F below). The inline version
  is not a maintained copy — it is a DERIVED slice assembled at runtime by extracting
  sections from SKILL.md. No separate text is stored; the script reads SKILL.md, selects
  blocks by section heading, and emits only those blocks. One source of truth, assembled
  not copied.

(iii) Split SKILL.md into full+stub sections:
- Attractive on the surface but has a serious problem: SKILL.md is the skill definition
  document; its structure is defined by the skill protocol, not by the delivery mechanism.
  Restructuring SKILL.md to accommodate the hook's emit logic couples the skill definition
  to the hook implementation. Future readers of SKILL.md would need to understand the
  hook's selection logic to understand why sections are structured a particular way.

**Pick: (ii) — but critically, the "inline heredoc" is NOT a literal copy. It is a
block-extraction script that reads SKILL.md by section heading. Single source of truth
(SKILL.md), runtime-assembled stub.**

The implementation pattern: session-start reads the full SKILL.md content (as today),
then uses section-heading anchors to extract only the mandate blocks for the compact
payload. No mandate text is stored anywhere except SKILL.md.

See F for the single-source-of-truth mechanism.

---

### B. Stub exact content + order

**Surviving blocks (compact payload), in order:**

1. SUBAGENT-STOP — present verbatim. Not negotiable; a subagent must still stop.
2. EXTREMELY-IMPORTANT + The Rule — present verbatim. These are the behavioral mandate
   that decays across compaction.
3. Instruction Priority — present verbatim. This is the "non-obvious load-bearing item"
   identified in Follow Up 01: without it, a conflicting CLAUDE.md silently wins
   post-compaction with no resolution rule in context.
4. Red Flags table — present verbatim. Conservator reversed on this in Follow Up 01;
   unanimous KEEP. Rationale stands: a rationalizing model will not invoke a tool to read
   an external list at the exact moment it is rationalizing a skip.
5. Skill Types — present verbatim (~49 tokens, negligible cost, maintains rigid/flexible
   distinction post-compaction).

**Dropped from compact payload:**
- Session Housekeeping (first-run wizard + verification checks) — dead on compact.
  Config already written, dirs already exist. Nothing to verify that wasn't verified at
  startup this session.
- "## How to Access Skills" (one line) — cosmetic header, omit.
- "## Choosing Between Skills" — ~109 tokens; low value post-compaction since the agent
  already invoked skills in this session. Drop.
- "## User Instructions" — ~11 tokens; drop along with Choosing Between Skills.

**Order note:** Keep the same top-to-bottom order as in SKILL.md. Reordering the stub
creates a new document to understand; preserving order makes the stub recognizable as a
slice of the canonical document.

**Source:** verbatim-extracted from SKILL.md by section heading. Not maintained separately.

---

### C. First-run gating mechanism

**Gate: config-check result, in session-start, before payload assembly.**

The current session-start script strips frontmatter and emits the full body. The gating
step adds: run `chester-config-read`, check whether `CHESTER_CONFIG_PATH` is `"none"`.

```bash
eval "$(chester-config-read)" 2>/dev/null || CHESTER_CONFIG_PATH="none"
```

If `CHESTER_CONFIG_PATH == "none"`:
- Include the first-run wizard section in the payload (lines ~33–111).

If `CHESTER_CONFIG_PATH != "none"` (established project):
- Exclude the first-run wizard section from the payload regardless of trigger event.
  This is the ~700-token saving on EVERY event including startup.
- The wizard is dead instructions on an established project — config already written,
  dirs already exist, paths already known.

**Gate logic lives in session-start.** Not in SKILL.md. SKILL.md defines the wizard
content; the hook decides whether to include it. This keeps the skill definition
independent of delivery decisions.

**Note on trigger interaction:**
- `trigger == compact`: drop housekeeping (wizard + verification checks) regardless of
  config state. Config status is irrelevant on compact — even a new-project compact
  should not fire the wizard (that conversation has already happened this session).
- `trigger == startup|clear`, config is `"none"`: include wizard.
- `trigger == startup|clear`, config is established: exclude wizard.

The two gates are independent and compose cleanly:
- compact gate: drops the entire housekeeping block
- first-run gate: drops only the wizard sub-block (when not compact)

---

### D. Trigger detection — stdin field + parse + fallback

**Field: `trigger` from stdin JSON, parsed with jq.**

Pattern (matching existing pre/post compact script style):
```bash
INPUT=$(cat)
TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""') 2>/dev/null || TRIGGER=""
```

Branch logic:
```bash
if [ "$TRIGGER" = "compact" ]; then
  emit_compact_stub
else
  emit_full_payload  # with first-run gate applied
fi
```

**Fallback when field absent/malformed: emit FULL payload.**

Rationale: the Conservator's core principle is that the existing structure is correct and
working. The full payload has been the correct behavior for the life of this hook. An
absent or malformed trigger field means we cannot confirm we are in a compact event —
defaulting to the full payload is the conservative, safe choice. It is better to
over-inject one full payload than to under-inject and leave the post-compact agent without
the housekeeping it needs. The compact saving is a win we take when we are certain; the
full payload is the known-safe fallback.

**Note:** DMed researcher to confirm the exact field name (`trigger` vs `hook_event_name`)
and exact string values. If researcher confirms a different field name, the `jq` path
changes but the logic is identical. Will revise D if needed.

---

### E. Startup-payload trim (collapse verification bash prose to 1 line, keep `sed` verbatim)

**Decision: IN THIS SPEC. Not deferred.**

Rationale: the startup-payload trim was part of the adjudicated design (Follow Up 01,
Team Lead convergence point 5). It is a SKILL.md content change (not a delivery-mechanism
change), but it is part of the same implementation unit. Splitting it into a follow-on
spec creates a loose end that can be lost and leaves the startup payload inflated after
the compact-stub work ships.

**What the trim means (REVISED after Innovator peer question):**

Criterion for keep-verbatim vs collapse: reconstruction fidelity, not syntactic
complexity. A bash block is kept verbatim when prose description would cause the model
to substitute a simpler but wrong equivalent — producing a wrong fix or a silent miss.

- **Check 3 — keep verbatim:** `sed -i "\|^$CHESTER_PLANS_DIR|d"` is non-standard.
  Incorrect reconstruction = silent delayed failure (plans dir stays gitignored, caught
  only when archive-artifacts lands untracked at sprint finish).

- **Check 2 — keep verbatim (REVISED from initial position):** `! git check-ignore -q
  "$WORKING_DIR_RELATIVE" 2>/dev/null` has a reconstruction-fidelity risk. The failure
  mode: a model under prose instruction substitutes `if ! grep -q "$WORKING_DIR_RELATIVE"
  .gitignore`, which checks file content rather than git's ignore resolution. That passes
  when the path is listed literally but fails when covered by a glob pattern. Git's
  ignore resolution is glob-aware; grep is not. The `2>/dev/null` also suppresses exit
  128 from non-git dirs — non-obvious and invisible to prose reconstruction. Keep
  verbatim for the same reason as Check 3: exit-code semantics + git-specific behavior
  that prose will cause the model to substitute incorrectly.

- **Check 1 — collapse to prose:** `mkdir -p "$CHESTER_WORKING_DIR"` is
  reconstructable. No exit-code semantics, no non-obvious idiom. One sentence suffices.

- **Check 0 — collapse to prose:** config-key presence check is already prose-only in
  SKILL.md; no bash block to collapse.

Net saving from startup trim: ~80 tokens (Check 1 only), not ~150 as initially
estimated. The correctness argument takes priority over token count.

- The bash-verbatim compression applies only to the STARTUP payload. Under the
  trigger-split, the compact payload does not contain verification checks at all —
  so this trim has zero effect on the compact stub.

**Scope note:** this is a SKILL.md edit (content of the verification section), not a
session-start script edit. Spec should call this out as a separate file change within
the same implementation unit.

---

### F. Drift control — single source of truth mechanism

**This is the most important question in the spec. The Conservator's primary concern.**

**Decision: runtime block extraction from SKILL.md. The mandate text lives in exactly
one place.**

The approach: session-start does not store any mandate text. Instead, it extracts
specific sections from SKILL.md at runtime by section-heading anchor. The compact stub
is assembled, not maintained.

**Mechanism:**
- SKILL.md section headings are stable anchors:
  - `<SUBAGENT-STOP>` / `</SUBAGENT-STOP>`
  - `<EXTREMELY-IMPORTANT>` / `</EXTREMELY-IMPORTANT>`
  - `## Instruction Priority`
  - `## The Rule`
  - `## Red Flags`
  - `## Skill Types`
- session-start extracts these blocks using sed/awk range patterns:
  - XML-tag blocks: `sed -n '/<SUBAGENT-STOP>/,/<\/SUBAGENT-STOP>/p'`
  - Markdown sections: `awk '/^## Section Name/{p=1} p{print} /^## /{if (started) p=0} /^## Section Name/{started=1}'`
    (or a simpler: `sed -n '/^## Section Name/,/^## /p'`)

**Why this is the right answer:**
- Zero drift by construction. There is no stub copy. When a mandate block changes in
  SKILL.md, the extracted compact payload automatically reflects the change.
- No two-place sync discipline required. The two-place sync that CLAUDE.md requires for
  description fields + skill index is already hard to maintain; adding a third sync point
  (mandate text in session-start stub) would be a fourth place to touch on every mandate
  revision.
- The extraction pattern is testable: a test can run the session-start script with a
  simulated compact trigger and assert that specific section headings appear in the output.

**Trade-off accepted:**
- The extraction logic in session-start is ~20 lines of sed/awk instead of a literal
  string. It is more complex to read than a heredoc copy.
- The section-heading anchors in SKILL.md become load-bearing for the extraction. If a
  heading is renamed, the extraction silently produces an empty section. The spec must
  document this: "section headings in setup-start/SKILL.md are delivery anchors — do not
  rename without updating session-start extraction patterns."

**What this is NOT:**
- Not a second file. Not a separate stub document. Not a "compact-stub.md" in references/.
- Not a split SKILL.md. The skill's structure is not changed to accommodate the hook.

---

### G. Test plan

The spec must require tests for each branch. Assertions:

**Test 1 — compact trigger → mandate-only stub:**
- Pipe `{"trigger":"compact","hook_event_name":"SessionStart"}` to session-start on stdin.
- Assert output contains: SUBAGENT-STOP, EXTREMELY-IMPORTANT, Instruction Priority,
  The Rule, Red Flags.
- Assert output does NOT contain: first-run wizard marker (e.g. "first-run project
  configuration"), verification check markers (e.g. "Check 0:", "Check 1:", "Check 2:").

**Test 2 — startup trigger + established config → full payload minus wizard:**
- Requires a live chester config (or a fixture config with non-"none" CHESTER_CONFIG_PATH).
- Pipe `{"trigger":"startup","hook_event_name":"SessionStart"}` to session-start.
- Assert output contains: all mandate blocks + verification checks.
- Assert output does NOT contain: first-run wizard content ("new project for Chester").

**Test 3 — startup trigger + no config → full payload including wizard:**
- Requires no chester config present (or mock chester-config-read returning "none").
- Assert output contains: first-run wizard content ("new project for Chester").

**Test 4 — absent trigger field → full payload (fallback):**
- Pipe `{"hook_event_name":"SessionStart"}` (no `trigger` field) to session-start.
- Assert output is indistinguishable from startup/full payload.
- This validates the conservative fallback.

**Test 5 — mandate integrity post-extraction:**
- Assert that the compact stub output contains SUBAGENT-STOP section verbatim from
  SKILL.md (spot-check a known line from the block).
- Guards against extraction silently returning empty if heading anchors drift.

**Existing test to update:**
- `test-start-cleanup.sh` currently checks only that "Session Housekeeping" is present
  and no archived skill is referenced. Extend it to assert the session-start script
  contains `INPUT=$(cat)` (confirming stdin-branch was added, not reverted).

---

### H. Version bump + two-place-sync impact

**Files that require version bumps:**

1. `skills/setup-start/SKILL.md` — content changes (startup-payload trim: bash prose
   collapsed). Bump: v0002 → v0003.

2. `chester-util-config/session-start` — not a SKILL.md; no version field. But the
   script is non-trivially rewritten (adds INPUT, jq, branch, config check, extraction
   logic). No version to bump, but the commit message must be descriptive.

**Two-place sync impacts:**
- The `description` field in setup-start/SKILL.md is NOT changed by this work (the
  skill's public interface — "Use when starting any conversation" — is unchanged).
  No skill-index entry update required for the description.
- The skill-index catalog (`setup-start/references/skill-index.md`) entry for
  setup-start does not change (skill behavior from the caller's perspective is unchanged;
  the change is in delivery, not the skill contract).
- Exception: if the startup-payload trim results in removal of a named section from
  SKILL.md (e.g., if "Choosing Between Skills" is removed from the startup payload),
  the skill-index entry for setup-start should note this if it references that section.
  Check at implementation time.

**Stale catalog entry (from round01 Purist finding):**
- `skill-index.md` still lists `design-architect-committee` (archived). This is a
  one-line deletion, orthogonal to the trigger-split work, but should ride the same
  sprint (as the round01 committee-analysis recommended). Not a version bump on
  setup-start — it is a deletion in skill-index.md.

---

## Peer Question

DM sent to researcher before transcript was written. One targeted question:

> Confirm: (1) correct field to branch on is `trigger` (not `hook_event_name`)?
> (2) exact string values for SessionStart triggers — `"startup"`, `"clear"`, `"compact"`?
> (3) whether field can be absent/malformed — is it guaranteed for all three match
> patterns, or can it be missing?

This was load-bearing for D (trigger detection branch condition and fallback) and for G
(Test 4 — fallback branch test). Researcher confirmed all three points; D stands as
written.

---

## Summary Position

The adjudicated design translates cleanly to spec with these decisions:

- **A:** Session-start assembles the compact stub at runtime by extracting sections from
  SKILL.md. No separate stub file. No heredoc copy.
- **B:** Compact stub = SUBAGENT-STOP + EXTREMELY-IMPORTANT/The Rule + Instruction
  Priority + Red Flags + Skill Types. Same order as SKILL.md. Verbatim extracted.
- **C:** First-run gate: `chester-config-read` in session-start; wizard excluded when
  config is established, regardless of trigger. Compact gate supersedes: on compact,
  drop all housekeeping regardless of config.
- **D:** Branch on `trigger` field from stdin JSON. Fallback (absent/malformed) = full
  payload. Pattern matches existing pre/post compact script style.
- **E:** Startup-payload trim IN this spec. Keep `sed -i "\|^...|d"` verbatim; collapse
  other bash snippets to prose.
- **F:** Runtime extraction = zero-drift by construction. Section headings in SKILL.md
  become delivery anchors; spec must document them as such.
- **G:** Five test assertions covering both trigger branches, config gate, fallback, and
  mandate integrity.
- **H:** setup-start SKILL.md bumps v0002 → v0003; session-start script rewritten
  (descriptive commit); no description-field sync required.

**Top trade-off:** The runtime-extraction approach (F/A) is the most complex implementation
path — ~20 lines of sed/awk to assemble the stub — but it is the only option that
eliminates drift by construction. The alternative (a second file or inline copy) trades
implementation simplicity for ongoing maintenance discipline. On a project where discipline
has been the bottleneck (the `design-architect-committee` stale catalog entry is an example
of drift in exactly this pattern), paying implementation complexity once to eliminate drift
permanently is the correct trade.

**Confidence:** High on all A–H. D confirmed by researcher; E revised after Innovator
peer question. No remaining open items.

---

## Revision Status

**E revised** after Innovator peer question (2026-06-05): Check 2's `! git check-ignore
-q` bash block added to keep-verbatim list alongside Check 3's `sed`. Criterion
sharpened: reconstruction fidelity (not syntactic complexity) — exit-code semantics +
git-specific behavior that prose substitutes incorrectly. Net startup trim reduced from
~150 to ~80 tokens (Check 1 only collapsible). Position otherwise unchanged.

**D confirmed** by researcher (2026-06-05): correct field is `trigger` (not
`hook_event_name`). Exact values: `"startup"`, `"clear"`, `"compact"` verbatim
lowercase. No Claude Code guarantee field is always present — `// ""` jq fallback gives
empty string when absent, which falls through to full-body path. Conservative default
is structurally correct and matches the existing pre/post compact hook pattern. No
revision to D needed.

Position locked. All items confirmed.

<!-- produced-by: conservator / round02 / 2026-06-05 -->
