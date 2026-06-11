# Plan: Member Warranted Answer-Contribution (Thread A)

**Sprint:** 20260610-01-extend-committee-answer
**Spec:** docs/chester/working/20260610-01-extend-committee-answer/spec/20260610-01-extend-committee-answer-spec-00.md
**Execution mode:** inline

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Give each of the four advocacy committee members a typed, sourced `warrant` field in its Final Position, and reword the team-lead's Authority Guard from originating warrants to verifying member-supplied ones — a content-only extension that leaves all committee mechanics frozen.

## Architecture

Three edit groups, each its own task: (1) the schema authority `member-protocol.md` § Final Position gains the `warrant` field and a content-vs-mechanics boundary note; (2) the four advocacy agent files gain one identical lens-neutral pointer to that field (no schema restatement — they already delegate the schema to the protocol); (3) `team-lead.md` (v0010 → v0011) reworded origination → verification, with the third warrant type's hyphenation reconciled to the canonical `in-scope designer-premise`. A single grep-based test script (`tests/test-member-warrant.sh`) encodes the spec's observable boundaries and grows one assertion block per task.

## Tech Stack

Markdown contract files (skills/agents); Bash + grep for verification (Chester's `tests/test-*.sh` convention); git for commits. No runtime code.

---

## Task 1: Add the typed warrant field to the Final Position schema authority

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.2, AC-1.3 (member-protocol mechanics unchanged), AC-4.2
**Decision budget:** 1
**Must remain green:** `tests/test-member-warrant.sh` (created here); existing `tests/test-*.sh` suite.

**Files:**
- Create: `tests/test-member-warrant.sh`
- Modify: `skills/design-committee/references/member-protocol.md` (§ Final Position, lines ~88-101)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Create `tests/test-member-warrant.sh` with the member-protocol assertion block:

```bash
#!/usr/bin/env bash
# Verifies the member warranted-answer-contribution change (Thread A).
set -u
ROOT="$(git rev-parse --show-toplevel)"
PROTO="$ROOT/skills/design-committee/references/member-protocol.md"
fail=0
check() { # check "description" <0-for-pass>
  if [ "$2" -ne 0 ]; then echo "FAIL: $1"; fail=1; else echo "ok: $1"; fi
}

# --- Task 1: member-protocol § Final Position ---
grep -q 'position, rationale, blocking_risk, warrant' "$PROTO"; check "schema block lists warrant as 4th field" $?
grep -q 'four fields:' "$PROTO"; check "Final Position schema lead-in says four fields" $?  # unique to the FP schema lead-in; the routing-signal section says "four fields and no others"
grep -q '`warrant`' "$PROTO"; check "warrant field defined" $?
grep -q '`type`' "$PROTO"; check "warrant field names a type part" $?
grep -q '`source`' "$PROTO"; check "warrant field names a source part" $?
grep -q 'in-scope designer-premise' "$PROTO"; check "warrant type enum present (hyphenated)" $?
grep -qi 'extension to the Final Position' "$PROTO"; check "content-vs-mechanics boundary note present" $?  # single-line phrase, robust to wrap
grep -qi 'never travels in the routing signal' "$PROTO"; check "boundary note: warrant not in routing signal" $?
# frozen mechanics still present (AC-1.3)
grep -q '{member, status, round, transcript}' "$PROTO"; check "routing signal schema unchanged" $?
grep -qi '200-word cap' "$PROTO"; check "200-word cap unchanged" $?

exit $fail
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-member-warrant.sh`
Expected: FAIL lines for the warrant assertions (field not yet added); routing-signal and cap lines already `ok`.

- [ ] **Step 3: Write minimal implementation**

In `skills/design-committee/references/member-protocol.md` § Final Position:

1. Change the schema lead-in `- **Schema** — exactly these three fields:` to `- **Schema** — exactly these four fields:`.
2. Change the fenced schema block from `{position, rationale, blocking_risk}` to `{position, rationale, blocking_risk, warrant}`.
3. After the `blocking_risk` field bullet, add the `warrant` field definition:

```markdown
- `warrant` — the ground under the member's load-bearing claim, in two parts: a
  `type` (one of `evidence | logic | in-scope designer-premise`) and a `source`
  (the citation for `evidence`, the inference step for `logic`, or the designer
  statement that granted the premise for `in-scope designer-premise`). It is the
  member's own ground for the claim, **not** a restatement of `rationale`.
  Member-authored, within the 200-word cap.
```

4. Immediately after the field list and before the closing line `No other file restates these fields. Downstream steps read this section directly.`, add the boundary note:

```markdown
The `warrant` is a **content** extension to the Final Position, not a mechanics
change. It does not alter the routing signal schema, the Consolidator's
enumerate-only boundary, round-folder discipline, or write-then-send sequencing —
those remain frozen. The warrant lives only in the on-disk `## Final Position`; it
never travels in the routing signal, and the team-lead reads it from disk on
demand when verifying.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-member-warrant.sh`
Expected: all lines `ok`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add tests/test-member-warrant.sh skills/design-committee/references/member-protocol.md
git commit -m "feat(committee): add typed warrant field to member Final Position schema"
```

---

## Task 2: Add the identical warrant pointer to the four advocacy agents

**Type:** docs-producing
**Implements:** AC-2.1, AC-2.2
**Decision budget:** 1
**Must remain green:** `tests/test-member-warrant.sh`; existing `tests/test-*.sh` suite.

**Files:**
- Modify: `agents/design-committee-conservator.md` (§ Output Format)
- Modify: `agents/design-committee-innovator.md` (§ Output Format)
- Modify: `agents/design-committee-pragmatist.md` (§ Output Format)
- Modify: `agents/design-committee-purist.md` (§ Output Format)
- Modify: `tests/test-member-warrant.sh` (append Task 2 block)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `tests/test-member-warrant.sh` immediately before the final `exit $fail` line:

```bash
# --- Task 2: four advocacy agents carry the identical warrant pointer ---
AGENTS_DIR="$ROOT/agents"
INSTR='Your `## Final Position` must include the `warrant` field for your load-bearing claim'
count=0
for m in conservator innovator pragmatist purist; do
  if grep -qF "$INSTR" "$AGENTS_DIR/design-committee-$m.md"; then count=$((count+1)); fi
done
[ "$count" -eq 4 ]; check "warrant pointer present in all four advocacy agents" $?
# uniformity: the full pointer sentence is byte-identical across the four
sig="$(grep -F "$INSTR" "$AGENTS_DIR/design-committee-conservator.md")"
same=0
for m in conservator innovator pragmatist purist; do
  if [ "$(grep -F "$INSTR" "$AGENTS_DIR/design-committee-$m.md")" = "$sig" ]; then same=$((same+1)); fi
done
[ "$same" -eq 4 ]; check "warrant pointer identical across the four agents" $?
# researcher untouched: pointer absent
! grep -qF "$INSTR" "$AGENTS_DIR/design-committee-researcher.md"; check "researcher agent has no warrant pointer" $?
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-member-warrant.sh`
Expected: FAIL on "warrant pointer present in all four" (instruction not yet added).

- [ ] **Step 3: Write minimal implementation**

In EACH of the four files `agents/design-committee-{conservator,innovator,pragmatist,purist}.md`, in the `## Output Format` section, immediately after the opening paragraph that begins `**Voice for all templates below: caveman ultra.**` and before the `**Single-round response (team-lead-facing final):**` line, insert this **byte-identical** paragraph (same text in all four — no per-lens wording):

```markdown
Your `## Final Position` must include the `warrant` field for your load-bearing claim — its type (evidence / logic / in-scope designer-premise) and source — authored from your own lens, per `references/member-protocol.md` § Final Position (the protocol owns the schema; do not restate it here). The team-lead verifies your warrant; it does not originate one for you.
```

Do NOT modify `agents/design-committee-researcher.md`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-member-warrant.sh`
Expected: all lines `ok`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add agents/design-committee-conservator.md agents/design-committee-innovator.md agents/design-committee-pragmatist.md agents/design-committee-purist.md tests/test-member-warrant.sh
git commit -m "feat(committee): add uniform warrant pointer to four advocacy agents"
```

---

## Task 3: Reword team-lead Authority Guard origination → verification; bump version

**Type:** docs-producing
**Implements:** AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-4.1, AC-1.3 (full invariance)
**Decision budget:** 2
**Must remain green:** `tests/test-member-warrant.sh`; existing `tests/test-*.sh` suite.

**Files:**
- Modify: `skills/design-committee/references/team-lead.md` (frontmatter line 8; Authority Guard Warrant test ~line 321; Self-Evaluation warrant-coverage ~line 342)
- Modify: `tests/test-member-warrant.sh` (append Task 3 block)

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

Append to `tests/test-member-warrant.sh` immediately before the final `exit $fail` line:

```bash
# --- Task 3: team-lead verification reword + version + invariants ---
TL="$ROOT/skills/design-committee/references/team-lead.md"
UDP="$ROOT/skills/util-design-partner-role/SKILL.md"
grep -q '^version: v0011' "$TL"; check "team-lead.md bumped to v0011" $?
grep -qi 'team-lead .*verifies' "$TL"; check "warrant test uses verify framing" $?
grep -qi 'member-supplied warrant' "$TL"; check "warrant test names member-supplied warrant" $?
grep -qi 'does not originate a warrant on the member' "$TL"; check "warrant test forbids team-lead origination" $?
grep -qi 'trace to a member-supplied warrant' "$TL"; check "self-eval warrant-coverage reworded (unique self-eval phrase)" $?
grep -q 'in-scope designer-premise' "$TL"; check "team-lead third warrant type hyphenation reconciled" $?
# doctrine intact (AC-3.3)
grep -qi 'Count-not-a-warrant' "$TL"; check "doctrine: count-not-a-warrant intact" $?
grep -qi 'C2 firewall' "$TL"; check "doctrine: C2 firewall intact" $?
grep -qi 'C1 audit' "$TL"; check "doctrine: C1 audit intact" $?
grep -qi 'strict premise scope' "$TL"; check "doctrine: strict premise scope intact" $?
# locked decision packet four blocks intact (AC-4.1)
grep -q 'Information Package' "$TL" && grep -q 'Decision Package' "$TL" && grep -q 'Team-Lead Comments' "$TL"; check "locked four-block packet headings present" $?
grep -q 'What a Good Decision Packet Sounds Like' "$TL"; check "locked decision-packet Style Exemplar intact (distinctive anchor)" $?
# voice spec present/untouched anchor (AC-4.1)
grep -qi 'Translation Gate' "$UDP"; check "util-design-partner-role intact (anchor present)" $?
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-member-warrant.sh`
Expected: FAIL on the v0011 / verify-framing / member-supplied lines; doctrine + locked-packet + voice-anchor lines already `ok`.

- [ ] **Step 3: Write minimal implementation**

In `skills/design-committee/references/team-lead.md`:

1. **Frontmatter (line 8):** `version: v0010` → `version: v0011`.

2. **Authority Guard — Warrant test bullet** (currently: "**Warrant test.** Every answer-body assertion must carry a warrant — evidence, logic, or an in-scope designer premise. An assertion with no warrant is not written as answer content; it is demoted to a gap. Assert only what can be warranted; everything else is a gap.") — replace with:

```markdown
- **Warrant test.** Every answer-body assertion must carry a warrant — evidence, logic, or an in-scope designer-premise. The warrant is **supplied by the member** in its `## Final Position`; the team-lead **verifies** it — the type fits the claim and the source is traceable — rather than originating it. An assertion whose member-supplied warrant cannot be verified, or whose member supplied none, is demoted to a gap. The team-lead does not originate a warrant on the member's behalf; it reads member warrants from the on-disk `## Final Position` on demand.
```

3. **Self-Evaluation — "Authority Guard — warrant coverage" check** (currently: "**Authority Guard — warrant coverage.** Does every answer-body assertion carry a warrant (evidence / logic / in-scope premise)? Any unwarranted assertion → demote it to a gap before sending.") — replace with:

```markdown
- **Authority Guard — warrant coverage.** Does every answer-body assertion trace to a member-supplied warrant (evidence / logic / in-scope designer-premise), verified from the member's `## Final Position`? Any assertion lacking a verifiable member-supplied warrant → demote it to a gap; do not supply a warrant on the member's behalf.
```

4. **Warrants-on-disk bullet (OPTIONAL polish — not a spec AC; skip if not cleanly locatable).** Find the bullet beginning `**Warrants on disk.**` in the Authority Guard. If it contains "warrant record" (match case-insensitively — the current text starts the sentence with "The warrant record"), change that occurrence to "member-sourced warrant record" (single-phrase tweak; leave the rest intact). If the anchor is not present, skip this item — no test depends on it.

5. Leave untouched: count-not-a-warrant, C2 firewall, C1 audit, strict premise scope, the four-block Information Packet Format, and the Style Exemplar.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-member-warrant.sh`
Expected: all lines `ok`, exit 0.

Then run the full suite to confirm no regression:

Run: `for t in tests/test-*.sh; do bash "$t" >/dev/null 2>&1 && echo "PASS: $t" || echo "FAIL: $t"; done`
Expected: every line `PASS`.

- [ ] **Step 5: Commit**

```bash
git add skills/design-committee/references/team-lead.md tests/test-member-warrant.sh
git commit -m "feat(committee): reword team-lead Authority Guard to verify member warrants (v0011)"
```

---

## Notes for the implementer

- **Hyphenation reconciliation (ground-truth LOW).** The third warrant type is canonical as `in-scope designer-premise`. team-lead.md currently writes it unhyphenated in the two passages you reword in Task 3 — the replacement text above already uses the hyphenated form, so both files end up consistent. Do not introduce the unhyphenated form in member-protocol.
- **Single authority.** The agent pointer (Task 2) must NOT restate the warrant field's parts as a schema — it points to `member-protocol.md` § Final Position. Only member-protocol defines the field.
- **Change surface.** Exactly these files change: member-protocol.md, the four advocacy agents, team-lead.md, plus the new test script. The researcher/consolidator/scribe agents, artifact-template.md, committee-analysis-round-format.md, SKILL.md, and util-design-partner-role are untouched — execute-verify-complete confirms this against `git status`.

<!-- created-at: 2026-06-11T01:42:42Z -->
<!-- produced-by plan-build@v0006 -->
