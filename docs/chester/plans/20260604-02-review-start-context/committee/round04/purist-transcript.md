# Purist Transcript — Round 04
# Sprint: 20260604-02-review-start-context
# Role: Purist — category boundaries + compositional integrity
# Date: 2026-06-06
# Focus: BUILD phase — implementation plan from finalized spec (Option B, wide-strip)

## Ground Truth Established

From direct reads of the spec and SKILL.md at HEAD.

### Spec summary (Option B, wide-strip)

Three surfaces touched:
1. `skills/setup-start/SKILL.md` — add 8 `mandate-block:*` marker pairs; remove Checks 0–3;
   version v0002 → v0003.
2. `chester-util-config/session-start` — rewrite: stdin read, `.trigger` branch, compact-stub
   heredoc (8 blocks verbatim), full-payload path with established-project wide-strip of
   `## Session Housekeeping`.
3. `tests/test-session-start.sh` — new file, 8 tests (T1–T8).

### SKILL.md mandate block line map (at HEAD, pre-implementation)

Top cluster (pre-housekeeping):
- SUBAGENT-STOP: lines 7–9
- EXTREMELY-IMPORTANT: lines 11–17
- Instruction Priority: lines 19–28

Gap (excluded from mandate):
- Session Housekeeping: lines 29–161 (stripped for established projects; removed for Checks 0–3)

Bottom cluster (post-housekeeping):
- How to Access Skills (one-liner): lines 162–164
- `# Using Skills` H1 + The Rule: lines 166–172
- Red Flags: lines 174–192
- Skill Types: lines 194–199
- [Choosing Between Skills: lines 201–203 — EXCLUDED from mandate]
- User Instructions: lines 205–207

Note: after Checks 0–3 are removed (§5.2), Session Housekeeping will be shorter
(only eval + wizard remain, ~lines 29–112 approximately). Line numbers for the bottom
cluster will shift upward. The marker contract must be anchored by content, not line
number — the spec correctly states this ("anchored by heading, not line number").

### Marker format (from spec §4.3)

`<!-- mandate-block:the-rule start -->` … `<!-- mandate-block:the-rule end -->`
HTML comment syntax — invisible in rendered Markdown. 16 comment lines total for 8
blocks (2 per block: start + end).

---

## Purist Plan Position

### P1 — Task decomposition: one responsibility per task

The spec touches three files (SKILL.md, session-start, test file) and within SKILL.md
two distinct concerns: establishing the marker contract AND retiring the checks. These
concerns are separable and have different failure modes. The plan must not merge them.

**TASK 1: Establish the mandate-marker contract in SKILL.md**

Responsibility: add the 8 `<!-- mandate-block:* -->` HTML-comment marker pairs to
`setup-start/SKILL.md`. No content is added, removed, or altered — only markers are
inserted at block boundaries. Version bump: NOT YET (the version bump belongs with the
final SKILL.md state, after all SKILL.md changes are in).

Input: SKILL.md at HEAD (v0002). The 8 block locations from the spec §4.2.
Output: SKILL.md with 16 comment lines inserted at the 8 block boundaries. The
mandate-block names (slugs) are the contract that Task 3 and Task 4 consume.

Why separate from Task 2: adding markers is a READING concern (what IS the mandate).
Removing Checks 0–3 is a SCOPE concern (what checks run at startup). They edit the
same file but for orthogonal reasons. Merging them creates a single commit that changes
both the mandate definition and the startup behavior simultaneously — two failure modes
braided, one rollback required if either is wrong.

**TASK 2: Retire Checks 0–3 from SKILL.md; version bump**

Responsibility: remove the `if-not-none` branch (Checks 0–3) from `## Session
Housekeeping`. After removal, the section contains only the shared eval + first-run
wizard. Also bump version v0002 → v0003.

Input: SKILL.md with markers from Task 1.
Output: SKILL.md with Checks 0–3 removed, version v0003. The `## Session Housekeeping`
section is now shorter; the wide-strip sed expression (Task 3) will strip this shorter
section correctly because it anchors on headings, not line numbers.

Why separate from Task 1: Removing checks is a behavioral change (startup no longer
self-heals config drift). If the check removal turns out to be wrong (e.g., the designer
reverses the Option B decision), Task 1's markers should not be rolled back with it.
The marker contract is additive and safe; the check retirement is a behavioral retirement.
Clean separation keeps rollback scope minimal.

Why version bump here: the version bump belongs with the last SKILL.md change. After
Task 2, SKILL.md is in its final state (markers + check removal). The bump records the
final state.

**TASK 3: Rewrite session-start (trigger branch + compact stub + wide-strip)**

Responsibility: rewrite `chester-util-config/session-start` to:
- Read stdin `.trigger` field
- Branch: compact → emit compact stub heredoc; startup/clear + established → emit full
  body with wide-strip; startup/clear + new project → emit full body intact; fallback
  → emit full body
- The compact stub heredoc is the verbatim content of the 8 marked blocks (extracted
  manually from SKILL.md post-Task-1, copied verbatim into the heredoc)
- The wide-strip sed expression: `sed '/^## Session Housekeeping/,/^## How to Access
  Skills/{/^## How to Access Skills/!d}'`

Input: SKILL.md in final state (post-Task-1 markers, post-Task-2 check removal), so
the stub content is drawn from the correct, final marked blocks.
Output: `session-start` rewritten with branching logic and stub heredoc.

Why after Task 1 AND Task 2: the stub heredoc must be drawn from the final SKILL.md
state. If Task 3 is written before Task 2 (check removal), the heredoc may accidentally
include content from a pre-removal region. More importantly: the stub must reflect the
final marker-delimited blocks. Writing the heredoc before markers exist means writing
without an authoritative boundary definition.

**TASK 4: Write test-session-start.sh (T1–T8)**

Responsibility: write `tests/test-session-start.sh` with all 8 tests. T8 specifically
requires reading the `mandate-block:*` markers from SKILL.md and comparing against the
stub in `session-start`.

Input: SKILL.md with markers (from Task 1); session-start rewritten (from Task 3).
Output: test file with 8 green passing tests.

Why last: T8 reads the markers from SKILL.md (requires Task 1) and the stub from
session-start (requires Task 3). T1–T7 require session-start to exist and behave
correctly (requires Task 3). Tests cannot be written to pass against a state that
doesn't exist yet.

**TASK 5: Verify existing tests still pass**

Responsibility: run `tests/test-compaction-hooks.sh` and confirm it still passes.
The rewrite of session-start must not break the existing hook contract.

Input: session-start rewritten (Task 3).
Output: green test run or named failure for remediation.

Why separate: this is a regression gate, not a construction step. It has its own
pass/fail outcome. If it fails, the failure is scoped to session-start compatibility,
not to SKILL.md or the test file.

### P2 — Sequencing and the marker contract as load-bearing interface

**The marker contract is the interface between Task 1 (producer) and Tasks 3 + 4
(consumers).**

The contract must be pinned precisely here so Tasks 3 and 4 know exactly what they
are consuming.

**Marker contract specification:**

Each of the 8 mandate blocks gets a `<!-- mandate-block:{slug} start -->` line
immediately before the block's first content line and a `<!-- mandate-block:{slug} end -->`
line immediately after the block's last content line. Blank lines between blocks are
OUTSIDE the markers (not included in the marked region). The stub heredoc and the drift
test both operate on the marked content only — blank-line separators are not part of
the verbatim contract.

Block slugs and their anchor content (in SKILL.md order):

| Slug | Anchors on |
|------|-----------|
| `subagent-stop` | `<SUBAGENT-STOP>` through `</SUBAGENT-STOP>` |
| `extremely-important` | `<EXTREMELY-IMPORTANT>` through `</EXTREMELY-IMPORTANT>` |
| `instruction-priority` | `## Instruction Priority` through end of priority list prose |
| `how-to-access` | `## How to Access Skills` through `**In Claude Code:**...` line |
| `the-rule` | `# Using Skills` H1 through end of The Rule body paragraphs |
| `red-flags` | `## Red Flags` through end of table |
| `skill-types` | `## Skill Types` through end of rigid/flexible prose |
| `user-instructions` | `## User Instructions` through end of one-line body |

Note on `how-to-access` vs `the-rule` granularity: **RESOLVED — use separate markers.**

Researcher confirmed lines 162–172 are entirely contiguous mandate content — no excluded
content between items 4 and 5. A single combined marker would be structurally correct.
However, separate markers are spec-faithful (8 named blocks, not 7) and give T8
per-block extraction precision. The `# Using Skills` H1 at line 166 belongs logically
with The Rule (its section opener) not with How to Access Skills.

Final marker placement:
- `<!-- mandate-block:how-to-access start -->` before line 162;
  `<!-- mandate-block:how-to-access end -->` after line 164
- `<!-- mandate-block:the-rule start -->` before line 166 (includes `# Using Skills` H1);
  `<!-- mandate-block:the-rule end -->` after line 172

**Blank lines between blocks:** NOT included in the marked regions. The stub heredoc
reconstructs blank-line separation explicitly. This means the verbatim test compares
block CONTENT only — blank lines between blocks are not part of the contract and cannot
fail the test for whitespace reasons.

**Choosing Between Skills (lines 201–203): NOT marked.** This is the explicit exclusion
from the mandate. The absence of a marker is itself the declaration that this block is
not mandate. The drift test's bidirectional check ("stub contains nothing beyond marked
regions") will fail if someone adds the unmarked Choosing Between Skills content to the
stub.

### P3 — Per-task contracts (inputs → outputs)

```
Task 1: SKILL.md (v0002, no markers)
  → SKILL.md (v0002, 16 marker comment lines added, no content changed)
  → contract: mandate-block slug list is fixed and published

Task 2: SKILL.md (v0002, markers present)
  → SKILL.md (v0003, Checks 0–3 body removed from ## Session Housekeeping,
              section now = eval + wizard only)
  → contract: ## Session Housekeeping heading still exists (wide-strip anchor safe)

Task 3: SKILL.md (v0003, markers + check removal)
  → session-start (rewritten: stdin branch, stub heredoc, wide-strip)
  → contract: compact output contains exactly the 8 marked-block contents;
              established startup output does NOT contain ## Session Housekeeping;
              fallback fires on any non-compact trigger

Task 4: session-start (from Task 3), SKILL.md (from Tasks 1+2)
  → tests/test-session-start.sh (8 tests, all green)
  → contract: T8 reads mandate-block:* markers from SKILL.md, asserts stub = union
              of marked regions + orientation line + nothing else

Task 5: session-start (from Task 3)
  → test-compaction-hooks.sh run result (green)
  → contract: existing hook behavior unchanged
```

### P6 — Category check: "remove Checks 0–3" vs "add markers" — one task or two?

**Two tasks. The responsibilities are orthogonal.**

Both edit SKILL.md. That is their only overlap. Their concerns are completely different:

Adding markers = **defining the mandate delivery boundary.** It answers: which content
constitutes the mandate? It is a READING operation from the delivery system's perspective
— the markers let session-start and the test know where the mandate is. If markers are
added incorrectly, the stub delivers wrong content.

Removing Checks 0–3 = **retiring a startup behavior.** It answers: what does the
established-project startup path do? It is a BEHAVIORAL SCOPE change. If the check
removal is done incorrectly, established-project sessions lose self-healing they
previously had.

These are different failure modes, different test coverage, and different rollback
criteria. Merging them into one task means:
- A bad check removal cannot be rolled back without also rolling back the markers.
- A test failure is ambiguous — was it the marker placement or the content removal?
- Code review cannot clearly assess "did the markers land in the right places" when
  the surrounding content is also changing.

The one practical objection to splitting: both changes land in the same file, so two
sequential commits to SKILL.md is slightly more ceremony. This is a minor cost against
a real clarity benefit. Keep them separate.

### P7 — Drift test (T8) exact assertion spec

T8 is the enforcement mechanism for the marker contract. It must assert all three
cases from spec §4.3:
(a) in-place edit of a stub block → per-block verbatim mismatch
(b) a stub block silently dropped → membership mismatch
(c) a new mandate block added to SKILL.md (marked) but not copied to stub →
    membership mismatch

**T8 exact assertion algorithm:**

Step 1 — Extract marked regions from SKILL.md:
```bash
# For each slug in the expected list, extract content between markers:
# awk '/<!-- mandate-block:SLUG start -->/,/<!-- mandate-block:SLUG end -->/' SKILL.md
# Strip the marker lines themselves; keep only content lines.
# Concatenate all 8 regions in order → EXPECTED_CONTENT
```

Step 2 — Extract stub content from session-start:
```bash
# Extract the heredoc body from session-start (between <<'EOF' and EOF on the
# compact branch). Strip the orientation line (it is NOT in any marked region).
# → STUB_CONTENT
```

Step 3 — Assert verbatim equality, in order:
```bash
# diff <(echo "$EXPECTED_CONTENT") <(echo "$STUB_CONTENT")
# Any diff = FAIL (covers cases a and b)
```

Step 4 — Assert no extra content in stub (bidirectional, covers case c):
```bash
# Collect ALL mandate-block:* regions from SKILL.md (dynamic, not hardcoded list)
# → DYNAMIC_EXPECTED
# Assert DYNAMIC_EXPECTED == STUB_CONTENT
# This fails if a new marked block exists in SKILL.md but was not copied to the stub
```

Step 5 — Assert orientation line present exactly once:
```bash
# grep -c "# Session context: housekeeping already complete" session-start
# Assert count == 1 (present but not duplicated)
```

The critical property of Step 4: the slug list is derived DYNAMICALLY from the
markers in SKILL.md, not hardcoded in the test. A hardcoded list in the test would
fail to catch case (c) — a new marked block would not appear in the hardcoded list
and the test would not compare it. The dynamic extraction is what makes the test
genuinely bidirectional.

**Pattern (modeled on test-compaction-hooks.sh):**
```bash
fail() { echo "FAIL: $1"; ERRORS=$((ERRORS + 1)); }
ERRORS=0

# T8 — drift test
SKILL_MD="${SCRIPT_DIR}/../skills/setup-start/SKILL.md"
SESSION_START="${SCRIPT_DIR}/../chester-util-config/session-start"

# Extract stub heredoc
STUB=$(sed -n '/^cat <<.EOF./,/^EOF$/p' "$SESSION_START" | grep -v "^cat <<\|^EOF$")

# Extract all marked regions from SKILL.md dynamically
SLUGS=$(grep -o 'mandate-block:[a-z-]* start' "$SKILL_MD" | sed 's/ start//')
EXPECTED=""
for SLUG in $SLUGS; do
  REGION=$(awk "/<!-- ${SLUG} start -->/,/<!-- ${SLUG} end -->/" "$SKILL_MD" \
           | grep -v "<!-- mandate-block:")
  EXPECTED="${EXPECTED}${REGION}"
done

diff <(echo "$EXPECTED") <(echo "$STUB" | grep -v "# Session context:") \
  || fail "T8: stub content diverges from SKILL.md marked regions"

echo "PASS: T8 — drift test (stub matches SKILL.md mandate markers)"
```

Note: the `grep -o 'mandate-block:[a-z-]* start'` pattern extracts slugs dynamically.
If a new `mandate-block:new-thing start` is added to SKILL.md, it appears in SLUGS,
its content is extracted, and if the stub does not contain it, the diff fails. Case (c)
is caught.

---

## Researcher Response (received, incorporated)

Researcher confirmed: lines 162–172 are entirely contiguous mandate content. No excluded
content between items 4 and 5. Single marker structurally valid; separate markers
spec-faithful. Ruling: separate markers. Position updated above.

Additional peer exchanges this round:

**Innovator (T8 awk two-tag-type):** Answered correctness questions on off-by-one risk
(closing tag captured when `capturing=0` fires before print — misses end tag from
EXPECTED; rule: include tag lines) and blank-line false-negatives (awk extraction
naturally excludes inter-block blanks because capturing=0 between blocks; do not strip
all blank lines globally — intra-block blanks inside EXTREMELY-IMPORTANT body are load-
bearing content). Two-tag-type design (XML delimiters for SUBAGENT-STOP/EXTREMELY-
IMPORTANT, HTML comments for heading-delimited blocks) is structurally sound.

**Pragmatist (T8 jq -r verbatim):** Verified escape_for_json → jq -r round-trip is
exact bijection for all characters in mandate blocks (newlines, double-quotes). Full-
block verbatim diff is achievable with `jq -r '.hookSpecificOutput.additionalContext'`
decoding. First-line grep is insufficient — misses word-level intra-block edits (case a
from spec §4.3). Ruling: full-block verbatim is the correct and achievable contract.

---

<!-- created-at: 2026-06-06 -->
<!-- role: purist -->
<!-- round: 04 -->
<!-- sprint: 20260604-02-review-start-context -->
<!-- revised: after researcher + peer responses -->
