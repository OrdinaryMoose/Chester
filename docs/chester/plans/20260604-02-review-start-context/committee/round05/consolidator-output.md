# Consolidator Output — Round 05 (ATTACK phase)
# Sprint: 20260604-02-review-start-context
# Date: 2026-06-06

---

## 1. Per-Source Headline and Verdict

**Conservator** — headline: wide-strip sed end-anchor absent = catastrophic silent mandate deletion.
Verdict: KILL-SHOT (high strength). Plan survives with two mandatory fixes (anchor guard + T3/T5
presence assertions). Secondary medium gap: compact-stub outer-envelope preamble text unspecified.

**Innovator** — headline: runtime extraction over heredoc eliminates the heredoc, T8, and two-place
sync simultaneously.
Verdict: plan survives — no kill-shot on current structure — but the innovator finding identifies
a strictly cleaner alternative path. After peer exchange, Innovator withdraws the Task 1/2 merge
recommendation and concedes split is correct.

**Pragmatist** — headline: no kill-shots on the plan; LOC estimate was understated (~148 → ~191
gross); runtime extraction passes the minimum-ceremony test.
Verdict: plan survives attack. Plan is buildable as specced. Pragmatist supports adopting runtime
extraction over heredoc.

**Purist** — headline: two moderate wording gaps require explicit resolution before implementation
(T8 "present verbatim" vs full equality diff; XML-block marker placement ambiguity for
SUBAGENT-STOP + EXTREMELY-IMPORTANT).
Verdict: plan survives. No category leaks. Two wording gaps must be fixed; all other findings
cleared.

**Researcher** — headline: all five attacked plan claims HOLD; no draft plan claims falsified.
Verdict: plan survives. Wide-strip sed anchor behavior confirmed correct. escape_for_json
round-trip confirmed. jq -r byte-faithful confirmed. Choosing Between Skills position confirmed.
sed-i at lines 81/143 confirmed. One prior researcher error corrected (session-start is 32 lines,
not 33).

**Plan-attacker** — headline: two critical findings (envelope intro semantically false on compact
branch; T8 "nothing outside" assertion mechanism unspecified) plus three important and three minor
findings.
Verdict: plan does not reach kill-shot level but has eight findings requiring resolution, two
critical.

**Plan-smeller** — headline: three high-severity structural smells (two-copy mandate; marker
three-way coupling; wide-strip sed couples behavior to heading strings); one medium; two low.
Verdict: plan survives. Smells forecast maintenance friction and one overlapping failure mode with
the conservator kill-shot. No new kill-shots beyond what conservator identified.

---

## 2. RUNTIME-EXTRACTION Convergence

### Who proposed and who supported

- **Proposed by:** Innovator (Attack 2 in Innovator transcript).
- **Confirmed by:** Pragmatist (peer exchange section, "runtime extraction PASSES minimum-ceremony
  test").
- **Confirmed by:** Researcher (Q1 inter-block blank counts; Q2 empty-extraction guard — both
  decisive, both strengthen the case for extraction).

### Supporting facts

- **LOC math (Pragmatist peer answer):** heredoc body ~57 lines off session-start + T8 ~20 lines
  off test = ~74 lines removed, ~3 lines of awk added. Net minus ~74. Revised gross total:
  ~40 (session-start) + 16 (markers) + 60 (test) = ~116 gross, vs ~191 gross under the heredoc
  approach.
- **Inter-block separator footgun (Researcher Q1):** gaps 3→4 (134 lines of Session Housekeeping)
  and 7→8 (5 lines of Choosing Between Skills) contain non-mandate content. Runtime awk extraction
  at `capturing=0` between markers produces ZERO separator at those positions automatically. A
  heredoc implementer must know to put zero separator at positions 3→4 and 7→8 — not derivable
  from visual inspection of SKILL.md (the gaps look like they have content between them). This is
  a hidden footgun the plan never documented.
- **Drift-impossible-by-construction:** under runtime extraction, the compact stub IS the SKILL.md
  mandate blocks. No copy to drift. T8 collapses to a block-count assertion (~3 lines) or merges
  with T1. Heredoc approach converts silent drift into a CI failure; runtime extraction eliminates
  the drift category entirely.
- **Empty-extraction guard (Researcher Q2):** `[ -n "$stub_content" ] || stub_content="$full_skill_content"`
  inside the compact branch only. One if-statement. No structural change to the existing
  escape + printf emitter.

### Dissent

None from the five committee members. No source opposed runtime extraction once Innovator proposed
it. Innovator conceded the Task 1/2 merge recommendation after pragmatist peer analysis showed the
intermediate state (markers present + checks present) is harmless and isolated rollback is cleaner.

---

## 3. Conservator Kill-Shot

### The failure sequence

1. A future editor renames `## How to Access Skills` in SKILL.md (e.g. to `## Accessing Skills`).
2. The wide-strip sed range `/^## Session Housekeeping/,/^## How to Access Skills/` opens at
   `## Session Housekeeping` and never closes — the end-anchor no longer matches.
3. Sed deletes every line from `## Session Housekeeping` to EOF. This removes the entire mandate
   bottom cluster: How to Access Skills, Using Skills, The Rule, Red Flags, Skill Types, Choosing
   Between Skills, User Instructions.
4. Session-start emits exit 0. No error. The payload contains only the mandate top cluster.
5. **T3 and T5 still PASS.** Both tests assert `## Session Housekeeping` is ABSENT from the
   established-project startup payload. It is absent — along with everything after it. Neither test
   checks for the PRESENCE of mandate-bottom content on the startup path.

### The T3/T5 absence-only gap

T3 and T5 validate what the startup payload LACKS (housekeeping absent), not what it MUST CONTAIN
(mandate-bottom blocks present). The catastrophic deletion passes both tests.

### Corroboration

- **Plan-smeller Smell 3** (high severity, high confidence): "the range opens but never closes —
  the sed deletes from the housekeeping heading to EOF. This is the catastrophic payload-loss case."
- **Researcher live repro:** sed tested against actual SKILL.md with end-anchor removed; confirmed
  everything from `## Session Housekeeping` to EOF deleted, exit 0, no error.

### Plan's failure to close this

Draft plan §Task 4 open fork item 5 lists "wide-strip on a SKILL.md whose headings later change"
as an open question but does NOT close it with a guard or test. No anchor-existence guard in Task 4
spec. No T9 anchor-presence test. No T3/T5 presence assertion for mandate-bottom content.

### Fix (Conservator recommendation — both required)

- **Option A (runtime guard):** before running wide-strip sed, assert both anchors exist:
  ```bash
  if ! grep -q "^## Session Housekeeping" "$skill_content_file" || \
     ! grep -q "^## How to Access Skills" "$skill_content_file"; then
    echo "WARN: wide-strip anchors not found — emitting full body" >&2
    # fall through to full-body emit
  fi
  ```
  Converts catastrophic deletion into safe over-emit (full body including housekeeping, ~1,188
  tokens not saved, mandate intact). Exit 0 still.
- **Option B (T3/T5 presence assertions):** extend T3 and T5 to also assert that known
  mandate-bottom-cluster lines ARE PRESENT (e.g., grep for a Red Flags table line or "Invoke
  relevant or requested skills" from The Rule).

Both are required: Option A alone means the failure goes undetected in CI; Option B alone means
production sessions can still silently lose the mandate on a heading rename between test runs.

---

## 4. Plan-Attacker Findings Enumerated

| ID | Severity | Finding | Confidence |
|----|----------|---------|------------|
| C1 | Critical | Compact branch reuses "full content" envelope intro — semantically false; model sees authoritative "full content" claim for a mandate-only stub | 90 |
| C2 | Critical | T8 "nothing outside" assertion mechanism unspecified; grep-per-block approach proves presence only, not absence of extra content | 85 |
| I1 | Important | "Verbatim from SKILL.md" obscures non-contiguous copy — Choosing Between Skills excluded but wording implies contiguous extraction | 92 |
| I2 | Important | how-to-access + the-rule open fork unresolved in plan; resolvable now: `# Using Skills` at line 166 is mandate content, one combined marker correct | 88 |
| I3 | Important | Task 2 deletion creates double-blank before `## How to Access Skills`; heredoc whitespace trap if implementer copies naively | 80 |
| M1 | Minor | jq failure fallback relies on implicit bash behavior (command substitution swallows exit codes under set -e), not explicit `|| TRIGGER=""` guard | 82 |
| M2 | Minor | Fork #2 (split vs merge) lacks resolution criteria in plan | 83 |
| M3 | Minor | TDD ordering fork lacks resolution (defensible as-is per plan) | 80 |

### Findings mooted by runtime extraction

- **I1 mooted:** runtime extraction produces the non-contiguous output automatically by
  construction — the awk extraction excludes Choosing Between Skills because it carries no
  `mandate-block:*` markers. No implementer decision required; no wording trap.
- **I3 mooted:** runtime extraction reads the post-Task-2 SKILL.md at runtime. The double-blank
  before `## How to Access Skills` is inside the wide-strip range and never reaches the compact
  payload. Heredoc whitespace trap disappears.
- **Inter-block separator footgun (strengthens moot case for I1/I3):** Researcher Q1 confirms
  the hidden heredoc footgun — positions 3→4 and 7→8 require zero separator, not derivable from
  visual inspection. Runtime extraction derives this automatically.
- **C2 partial moot:** under runtime extraction, EXPECTED is computed at test time from SKILL.md
  markers using the same awk pattern the production code uses. The "two implementations of what
  is the mandate" duplication (Smell 4) collapses. T8's EXPECTED == ACTUAL comparison becomes
  a tautology unless the awk itself is broken. The "nothing outside" concern becomes: does the
  compact branch emit ONLY the awk output plus the orientation line? That is a simpler,
  directly testable assertion.

---

## 5. Plan-Smeller Six Smells Enumerated

| # | Smell | Severity | Confidence |
|---|-------|----------|------------|
| 1 | Two-copy mandate = four-place sync on every mandate edit (SKILL.md content + marker boundaries + session-start heredoc + T8 green) | HIGH | HIGH |
| 2 | Marker convention creates three-way hidden coupling across SKILL.md, session-start heredoc, and T8 dynamic extraction; new-unmarked-block is residual silent risk | HIGH | HIGH |
| 3 | Wide-strip sed couples session-start behavior to two specific SKILL.md heading strings; rename of either = catastrophic silent deletion or silent over-emit | HIGH | HIGH |
| 4 | T8 duplicates heredoc-build logic; whitespace fragility (blank-line convention at marker boundaries unspecified) | MEDIUM | MEDIUM |
| 5 | test-start-cleanup.sh assertion weakens after Checks 0–3 retire; heading survives but intent of assertion now overpromises | LOW | HIGH |
| 6 | Task 1+2 before Task 3 weakens test-first for initial marker placement; markers never validated red | LOW | HIGH |

---

## 6. Resolved Forks

### Fork 1 — Marker scheme: uniform 8 HTML vs 6 HTML + 2 XML-reuse

**Resolution: uniform 8 HTML. Two-tag self-killed.**

Pragmatist attack on two-tag: with two-tag, `grep -c 'mandate-block:.*start'` finds only 6, not 8.
The test fails on line 2 unless the assert is changed to 6 — but then awk extracts only 6 blocks.
SUBAGENT-STOP and EXTREMELY-IMPORTANT drift goes undetected. Two-tag breaks T8's uniform extraction;
fixing it requires a two-pattern awk plus a separate count check for XML blocks — more complexity,
not less.

Innovator conceded: XML-style tags are a live convention in the codebase (`<HARD-GATE>` in
design-specify and design-small-task; `<Good>`/`<Bad>` in tdd-exemplars). A future author adding a
new mandate block might reach for the XML-tag convention, missing the `mandate-block:*` HTML
comment requirement. Two-tag's case-c gap is real.

Purist confirmed: uniform 8 keeps the mandate as a single declared category; two-tag splits the
mandate declaration into two conventions with different capture mechanics.

### Fork 2 — Task 1/2 split vs merge

**Resolution: keep split. Merge withdrawn.**

Pragmatist conceded own prior "merge" position after analysis: markers and behavioral retirement
are different concerns with different blast radii (a marker-insertion error breaks T8; a
check-removal error could leave dead text or break the wizard). Intermediate state (markers
present + checks present) is harmless — session-start still emits full body unconditionally until
Task 4. Split gives the implementer a cleaner mental checkpoint.

Innovator initially attacked the split as ceremony, then withdrew the merge recommendation after
pragmatist peer analysis.

Conservator confirmed split is acceptable (no concrete broken-tree scenario distinguishes the two;
merge is also acceptable; split is cleaner for history).

Plan-attacker M2: split is the correct choice; keep them separate.

### Fork 3 — T8 assertion: full-block verbatim vs first-line grep

**Resolution: full-block verbatim. First-line grep rejected.**

Researcher confirmed jq -r round-trip is byte-faithful for all content types present in the
mandate blocks. Full-block verbatim is feasible and spec-required.

Plan-attacker NON-FINDING: "T8 must reconstruct EXPECTED from SKILL.md marker content (not
hardcode it), because hardcoding recreates the two-place-omission bug the drift test exists to
prevent."

Purist Finding 1: plan wording "assert each block's full text present verbatim" is ambiguous
between presence check (unidirectional) and diff equality (bidirectional). Must specify:
`diff <(echo "$EXPECTED") <(echo "$STUB_CONTENT_MINUS_ORIENTATION")`. Per-block grep-presence
explicitly rejected.

### Fork 4 — TDD ordering: Tasks 1+2 before Task 3

**Resolution: current ordering is acceptable. Closed.**

Conservator: T8 REQUIRES markers to exist before it can be written correctly — writing T8 without
markers requires hardcoding the slug list, which the plan rejects. T3/T5 require the post-removal
SKILL.md body to produce correct expected-absent assertions. Tasks 1 and 2 are changes to the
source material the tests validate, not behavioral changes to session-start. Correct to finalize
source material before writing tests that read from it.

Plan-attacker M3: current ordering is defensible; plan should close the fork and note the
acceptable deviation from pure TDD.

Plan-smeller Smell 6: deviation worth naming (initial marker placement never validated red), but
not fatal.

### Fork 5 / how-to-access + the-rule: one combined marker

**Resolution: one combined marker encompassing lines 162–172.**

Plan-attacker I2: `# Using Skills` at line 166 is mandate content (spec §4.2 item 5 lists
"# Using Skills (H1) + ## The Rule" as one item). No non-mandate content sits between the two
sub-blocks. One combined marker: `<!-- mandate-block:how-to-access start -->` before line 162
through `<!-- mandate-block:how-to-access end -->` after line 172 (or use the plan's `the-rule`
slug, or rename to `using-skills-and-rule` — slug name is a style choice; boundary is not).

---

## 7. Must-Fix List

### Must-fix 1 — Anchor guard + T3/T5 presence assertions (Conservator kill-shot)

Before running wide-strip sed, assert both anchor strings exist in SKILL.md. On failure: skip
strip, emit full body, log warning (converts catastrophic deletion to safe over-emit). Extend T3
and T5 to assert known mandate-bottom-cluster lines ARE PRESENT, not only that housekeeping is
absent.

### Must-fix 2 — Compact envelope preamble text (Conservator Attack 2 + plan-attacker C1)

The compact branch reuses the envelope intro "Below is the full content of your 'setup-start'
skill" — this claim is false for compact (the stub is not the full content). The plan must
explicitly specify whether the preamble sentence is kept verbatim or updated for the compact path
(e.g., "Below is the mandate-only compact stub for this session" or "Mandate only — housekeeping
complete this session"). Conservator recommendation: update the preamble sentence; keep the outer
`<EXTREMELY_IMPORTANT>` wrapper for framing strength.

### Must-fix 3 — Empty-extraction guard (Innovator Attack 2 + Pragmatist peer answer)

If runtime extraction is adopted: add `[ -n "$stub_content" ] || stub_content="$full_skill_content"`
inside the compact branch before the escape + printf step. One line. Fallback: if SKILL.md is
unreadable at compact time, emit the full payload (same shape as the malformed-JSON fallback).

### Must-fix 4 — Explicit jq fallback (plan-attacker M1)

Change `TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')` to
`TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""' 2>/dev/null) || TRIGGER=""` to make error
handling explicit and shell-portable rather than relying on bash's implicit suppression of
command-substitution exit codes under set -e.

### Must-fix 5 — Full-equality compact test wording (Purist Finding 1 + plan-attacker C2)

Replace "assert each block's full text present verbatim" with explicit specification:
`diff <(echo "$EXPECTED") <(echo "$STUB_CONTENT_MINUS_ORIENTATION")`. Reject per-block
grep-presence explicitly. EXPECTED = programmatic concatenation of all marked regions from
SKILL.md. STUB = compact additionalContext extracted via jq -r, stripped of orientation line.
The diff is symmetric — catches both missing blocks AND extra content in the stub.

---

## 8. One-Line-Per-Source Position

- **Conservator:** Kill-shot stands (anchor absent = EOF deletion, T3/T5 absence-only gap); two
  fixes required (runtime guard + presence assertions); medium gap on compact preamble text.
- **Innovator:** No kill-shot on plan structure; runtime extraction is the cleaner path; concedes
  Task 1/2 split; concedes uniform-8 marker scheme.
- **Pragmatist:** Plan survives; no blocking issues; LOC corrected to ~191 gross; runtime
  extraction passes minimum-ceremony test; Task 1/2 split confirmed.
- **Purist:** Plan survives; two moderate wording gaps (T8 diff-vs-presence; XML-block marker
  outer/inner placement for SUBAGENT-STOP and EXTREMELY-IMPORTANT) require explicit resolution.
- **Researcher:** All five attacked plan claims HOLD; no draft plan claims falsified; one prior
  researcher error corrected (32 lines, not 33).
- **Plan-attacker:** Eight findings (C1 envelope false, C2 "nothing outside" unspecified, I1
  verbatim wording footgun, I2 how-to-access fork resolvable now, I3 double-blank whitespace trap,
  M1 implicit jq guard, M2 split fork unclosed, M3 TDD fork unclosed); two critical require plan
  edits.
- **Plan-smeller:** Three high smells (two-copy mandate, three-way marker coupling, wide-strip
  heading dependency); plan is structurally buildable; smells forecast maintenance friction, not
  immediate breakage; Smell 3 overlaps with conservator kill-shot.

---

## Notable Quotes

**Conservator (Attack 1 verdict):**
> "the plan does not specify either fix. This is a real, unguarded failure mode — not a theoretical
> edge case, but the direct consequence of the spec's explicit statement that both anchors are
> 'robust to prose/wording edits; they break only on a deliberate rename of either heading.' The
> spec acknowledges the rename risk; the plan does not close it. KILL-SHOT STRENGTH: HIGH."

**Innovator (Attack 2 verdict):**
> "Runtime extraction is strictly safer on drift. Heredoc is safer on file-read. But file-read
> failure on the compact path is detectable (the model sees the warning); silent drift is not (the
> model gets a stale mandate and no one knows)."

**Pragmatist (runtime extraction verdict):**
> "Drift solved at construction level — no copy to drift. T8 collapses from ~20 lines to ~3 (block
> count check only) or merges with T1. [...] Position: support Innovator's runtime extraction.
> Recommend adopting over heredoc."

**Researcher (inter-block footgun):**
> "Implication for heredoc (strengthens case against it): the heredoc must exactly match this awk
> output. Implementer must know to put zero separator at 3→4 and 7→8 — not derivable from visual
> inspection of SKILL.md (the gaps look like they have content between them). This is a hidden
> footgun the runtime extraction approach completely avoids."

**Purist (Finding 6 — XML-block marker placement):**
> "This is a producer/consumer disagreement T8 cannot self-resolve. The test enforces consistency
> between marker placement and heredoc content, but does not specify WHICH interpretation is
> correct. An implementer making independent choices for Task 1 (markers) and Task 4 (heredoc)
> could pick different options and produce a permanently red T8."

**Plan-attacker (C2):**
> "A grep-per-block approach [...] cannot prove absence of extra content — it only proves presence.
> To assert 'nothing outside', the test must build EXPECTED = orientation_line + concatenation of
> all marked blocks, extract ACTUAL from the compact additionalContext (after stripping the envelope
> wrapper), and assert EXPECTED == ACTUAL."

**Plan-smeller (Smell 3):**
> "the wide-strip shares this failure mode for its closing anchor. [...] A developer editing the
> heading in a non-Chester context would get a failing test without understanding why."

<!-- produced-by: consolidator / round05 / 2026-06-06 -->
