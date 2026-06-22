# Consolidator Output — Round 02
# Sprint: 20260604-02-review-start-context
# Phase: DEVELOP
# Date: 2026-06-05
# Role: Consolidator — enumerate only; no opinion, no weighting, no recommendation

---

## 1. Alignment count per axis

### Axis A — Payload assembly (WHERE does the compact stub live?)

| Position | Members |
|----------|---------|
| Inline heredoc in session-start | Innovator, Pragmatist |
| Runtime extraction from SKILL.md by section-heading anchor (sed/awk at hook runtime) | Conservator |
| Separate stub file (`session-start-compact`) | Purist |

Three-way split. No majority. Innovator + Pragmatist are the only aligned pair.

### Axis B — Stub content/membership (which blocks are IN vs OUT of compact stub)

Blocks and their inclusion status per member:

| Block | Conservator | Innovator | Pragmatist | Purist |
|-------|-------------|-----------|------------|--------|
| SUBAGENT-STOP (lines 7–9, ~29 tokens) | IN | IN | IN | IN |
| EXTREMELY-IMPORTANT (lines 11–17, ~84 tokens) | IN | IN | IN | IN |
| Instruction Priority (lines 19–27, ~118 tokens) | IN | IN | IN | IN |
| The Rule (lines 166–172, ~166 tokens) | IN | IN | IN | IN |
| Red Flags table (lines 174–191, ~260 tokens) | IN | IN | IN | IN |
| Skill Types (lines 193–199, ~49 tokens) | IN | IN | IN (revised in from OUT) | IN |
| How to Access Skills one-liner (lines 162–164, ~15 tokens) | OUT | OUT | OUT | IN |
| Choosing Between Skills (lines 201–203, ~55–109 tokens) | OUT | IN | OUT | OUT |
| User Instructions (lines 205–207, ~54 tokens) | OUT | IN | OUT | IN |
| Session Housekeeping / first-run wizard (lines 29–161) | OUT | OUT | OUT | OUT |
| Orientation/context line (added, not in SKILL.md) | None proposed | One line: `# Chester skill mandate (compact session — housekeeping already complete, config live)` | One line: `# Housekeeping already ran this session. Config and directories are live.` | One line: `# Session context: housekeeping already complete this session. Mandate only.` |

Specific membership differences:

- **"How to Access Skills" one-liner** (lines 162–164): Purist includes it; Conservator, Innovator, and Pragmatist exclude it.
- **Choosing Between Skills** (lines 201–203): Innovator includes it; Conservator, Pragmatist, and Purist exclude it. This is the main disputed block.
- **User Instructions** (lines 205–207): Innovator and Purist include it; Conservator and Pragmatist exclude it.
- **Skill Types**: Initially excluded by Pragmatist; Purist's peer exchange caused Pragmatist to revise to IN. Conservator and Innovator had it IN throughout. All four end at IN.

Stub token total estimates per member:
- Conservator: ~706 tokens (SUBAGENT-STOP + EXTREMELY-IMPORTANT + Instruction Priority + The Rule + Red Flags + Skill Types)
- Innovator: ~420–450 tokens stated; includes Choosing Between Skills and User Instructions
- Pragmatist: ~716 tokens (same six blocks as Conservator + orientation line)
- Purist: ~750 tokens (adds How to Access Skills + User Instructions; excludes Choosing Between Skills)

### Axis C — First-run gating mechanism

| Position | Members |
|----------|---------|
| Script-level config gate in session-start (`chester-config-read`, check `CHESTER_CONFIG_PATH == none`) | Conservator, Innovator, Pragmatist, Purist |

All four agree: gate lives in session-start script, not in SKILL.md. Unanimous.

Gate logic detail — minor structural variation:
- Conservator: two independent gates (compact gate first; first-run gate within full-payload path). Compact gate supersedes.
- Innovator: three-branch structure (compact / new-project / returning-session). Same logic, different code shape.
- Pragmatist: same three-branch, with `|| true` on config-read error.
- Purist: notes current gate is already model-prose (model reads CHESTER_CONFIG_PATH), not script-level. Concurs gate should move to script.

### Axis D — Trigger detection and fallback

| Position | Members |
|----------|---------|
| Branch on `trigger` field from stdin JSON | Conservator, Innovator, Purist |
| Initially `hook_event_name`, self-corrected mid-transcript to `trigger` | Pragmatist |

All four end at `trigger` as the branching field. Pragmatist's correction is explicit in their transcript.

jq extraction pattern — all agree on:
```bash
INPUT=$(cat)
TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')
```
Minor variation: Pragmatist uses `// "startup"` (defaults to startup string); others use `// ""` (defaults to empty string). Both produce the same fallback behavior (non-compact → full payload).

Fallback when trigger absent/malformed — unanimous:
- All four specify: fall back to FULL payload. Not the compact stub.

### Axis E — Startup trim (collapse verification bash to prose, keep `sed` verbatim)

| Position | Members |
|----------|---------|
| Include in this spec; two bash blocks keep-verbatim (Check 2 + Check 3); Check 0 + Check 1 collapse to prose | Conservator (revised), Innovator (revised) |
| Include in this spec; one bash block keep-verbatim (Check 3 `sed` only); net ~300 token saving | Pragmatist (pre-peer-exchange position) |
| Include in this spec; Check 3 `sed` keep-verbatim; Check 2 keep-verbatim | Purist |

All four agree: include in this spec, not deferred. All four agree: Check 3 `sed -i "\|^$CHESTER_PLANS_DIR|d"` stays verbatim.

Revision note: Conservator and Innovator revised Check 2 to keep-verbatim after peer exchange. Pragmatist's position on Check 2 is not explicitly revised in their transcript — initial position kept only Check 3 verbatim, with net saving ~300 tokens. After conservator/innovator alignment on Check 2, Pragmatist does not record a corresponding revision.

Net startup saving estimates:
- Conservator: ~80 tokens (only Check 1 collapses; Check 2 + Check 3 stay verbatim)
- Innovator: ~80–100 tokens (same conclusion post-revision)
- Pragmatist: ~300 tokens (original, pre-revision estimate; Check 2 not addressed in final position)
- Purist: not quantified separately; notes startup trim has zero effect on compact stub

### Axis F — Drift control (single source of truth mechanism)

| Position | Members |
|----------|---------|
| Runtime extraction from SKILL.md (sed/awk by section heading); zero drift by construction; no separate copy | Conservator |
| Inline heredoc + explicit two-place sync discipline (commit message + same-commit requirement); comment + version tag | Innovator |
| Inline heredoc + comment with "last synced: v####" version tag; no sync-checker test | Pragmatist |
| Separate stub file + F1 source-of-truth rule + F2 enumerated block list + F3 test assertion + F4 version bump rule + F5 resist generated stubs | Purist |

Divergence follows from axis A. Three different drift control answers matching the three axis-A positions.

### Axis G — Test plan

All four propose tests covering the same branches. Differences are in exact count, naming, and optional tests:

| Test scenario | Conservator | Innovator | Pragmatist | Purist |
|---------------|-------------|-----------|------------|--------|
| Compact trigger → mandate-only stub | T1 | T1 | T2 | T1 |
| Startup trigger + established config → full payload minus wizard | T2 | T2 | T1 | T2 |
| Startup trigger + no config → full payload with wizard | T3 | T3 | T5 | (implied) |
| Clear trigger = same as startup | (implied) | T4 | (implied) | T3 |
| Absent/malformed trigger → full payload fallback | T4 | T5 | T4 | T4 |
| Parse failure / jq unavailable → full payload | (implied) | T6 (optional) | (implied) | T5 |
| Mandate integrity / verbatim content check | T5 | (implied) | (implied) | T6 |
| Compact stub no-extra-content / line count ceiling | (not proposed) | (not proposed) | (not proposed) | T7 |
| Update existing test-start-cleanup.sh | Explicitly called out | (not addressed) | (not addressed) | (not addressed) |

All four use the same assertion pattern from test-compaction-hooks.sh:
```bash
CONTEXT=$(echo "$OUTPUT" | jq -r '.hookSpecificOutput.additionalContext // empty')
echo "$CONTEXT" | grep -q "expected text" || fail "..."
```

### Axis H — Version bump + two-place sync

| Item | All four members |
|------|-----------------|
| setup-start/SKILL.md version bump | v0002 → v0003 if SKILL.md body changes (startup trim = content change); if SKILL.md untouched, no bump |
| session-start script version | No version field; changelog via commit message |
| hooks.json | No change (one-hook approach confirmed by researcher) |
| skill-index.md description entry | No change (delivery mechanism change, not skill-contract change) |
| design-architect-committee stale catalog deletion | Noted by Conservator and Purist; orthogonal but should ride same sprint |

Researcher finding (decisive): if compact stub is handled entirely in session-start with SKILL.md unchanged, version stays v0002. If startup trim lands (axis E), SKILL.md body changes → v0002 → v0003. All four concur with this conditionality.

---

## 2. One-line position summary per member

**Conservator:** Runtime-extract the compact stub from SKILL.md at hook execution via sed/awk section-heading anchors, eliminating drift by construction; fall back to full payload on any ambiguity; include startup trim and five tests in this spec.

**Innovator:** Inline heredoc in session-start with three-branch structure (compact / new-project / returning-session), enforced by two-place sync discipline (same-commit requirement + commit message naming both files); Choosing Between Skills and User Instructions included in stub; Check 2 and Check 3 stay verbatim.

**Pragmatist:** Inline heredoc in session-start (~40 LOC total change), comment + "last synced: v####" version tag for drift control, minimal 5-test suite extending established pattern, with net ~1,000-token saving per startup on established projects.

**Purist:** Separate stub file (`session-start-compact`) as physical category boundary; six drift-control rules (F1–F5) including explicit test assertions for verbatim fidelity and line-count ceiling; How to Access Skills and User Instructions IN stub; Choosing Between Skills OUT.

---

## 3. Verbatim notable quotes

### Trigger field + stdin — ground-truth facts

**Researcher (decisive ruling):**
> "DECISIVE — branching field for the spec is `trigger`, NOT `hook_event_name`. `hook_event_name` is always `"SessionStart"` for all three SessionStart cases — it cannot distinguish startup from compact. `trigger` carries the actual event sub-type."

**Researcher (stdin JSON):**
> For SessionStart on true startup: `"startup"` / For SessionStart on /clear: `"clear"` / For SessionStart on compaction: `"compact"` / For PreCompact/PostCompact: `"auto"`

**Researcher (jq):**
> "`which jq` returns `/usr/bin/jq`. Pre-compact.sh and post-compact.sh both use it extensively. The Chester hook execution environment has jq. Safe to use in session-start without a fallback."

**Innovator (confirming field):**
> "Discriminator field: `trigger` (values: `startup`, `clear`, `compact`). `hook_event_name` is always `"SessionStart"` for this hook — not useful as discriminator."

**Pragmatist (self-correction, mid-transcript):**
> "CORRECTION (based on test fixture at line 68 and line 259): For SessionStart, `hook_event_name` will be `"SessionStart"` in all cases. The discriminator that distinguishes startup vs compact within SessionStart is the `trigger` field. jq path: `.trigger`."

### Token counts — load-bearing figures

**Researcher (decisive, from section 1):**
> "Core floor total: ~706 tokens (SUBAGENT-STOP + EXTREMELY-IMPORTANT + Instruction Priority + The Rule + Red Flags + Skill Types)"
> "Note: prior analysis quoted ~417 as 'core floor' (without Red Flags) and ~700 'with Red Flags.' The adjudicated design keeps Red Flags in the stub (unanimous), so stub = ~700 tokens."

**Researcher (dropped blocks):**
> "`## Choosing Between Skills` (lines 201–203): ~55 tokens (part of the ~109) / `## User Instructions` (lines 205–207): ~54 tokens (part of the ~109)"

**Pragmatist (session saving):**
> "Cumulative over a 10-compaction session: ~13,000–15,800 tokens returned to user work"

### Axis A — runtime extraction

**Conservator:**
> "The inline version is not a maintained copy — it is a DERIVED slice assembled at runtime by extracting sections from SKILL.md. No separate text is stored; the script reads SKILL.md, selects blocks by section heading, and emits only those blocks. One source of truth, assembled not copied."

**Conservator (trade-off):**
> "The section-heading anchors in SKILL.md become load-bearing for the extraction. If a heading is renamed, the extraction silently produces an empty section."

**Innovator (rejecting extraction):**
> "The mandate is NOT a contiguous region. It lives in two blocks separated by ~137 lines of housekeeping... To extract both blocks at runtime requires: add two pairs of markers to SKILL.md, then run a multi-region sed/awk extraction in session-start. That is ~10–15 lines of shell to do what a heredoc does in 40 lines flat."

**Innovator (on marker pollution):**
> "More importantly: adding markers to SKILL.md pollutes the skill body with delivery plumbing. SKILL.md is a skill-behavior document read by the model. Embedding `<!-- COMPACT_START -->` / `<!-- COMPACT_END -->` comments creates a coupling between the skill's semantic content and the hook's implementation detail."

### Axis B — Choosing Between Skills dispute

**Purist (excluding):**
> "Purist ruling on 'Choosing Between Skills': EXCLUDE from compact stub. Reasoning: the mandate category is defined by content that must survive in the agent's working memory post-compaction. 'Choosing Between Skills' does not add a behavior — it adds a lookup pointer."

**Purist (secondary benefit):**
> "Excluding it from the compact stub removes the dangling `design-architect-committee` reference from the post-compaction payload without requiring a separate skill-index.md fix as a prerequisite."

**Innovator (including):**
> "# Chester skill mandate (compact session — housekeeping already complete, config live)" [orientation line only; Choosing Between Skills included in full `# Using Skills` section per B position]

### Axis E — Check 2 verbatim rationale

**Conservator (reconstruction fidelity):**
> "Check 2 — keep verbatim (REVISED from initial position): `! git check-ignore -q "$WORKING_DIR_RELATIVE" 2>/dev/null` has a reconstruction-fidelity risk. The failure mode: a model under prose instruction substitutes `if ! grep -q "$WORKING_DIR_RELATIVE" .gitignore`, which checks file content rather than git's ignore resolution. That passes when the path is listed literally but fails when covered by a glob pattern."

**Innovator (confirming Check 2):**
> "The reconstruction risk is not the `!` inversion per se — it is the exit-code semantics of `git check-ignore` combined with the `2>/dev/null` stderr suppression. A model working from prose will substitute `grep -q "$path" .gitignore` which is glob-blind."

### Axis F — drift control

**Purist (F5 — resist generated stubs):**
> "Do not generate the compact stub programmatically at hook runtime (e.g., by parsing SKILL.md and extracting flagged sections). A generated stub means the mandate category is defined implicitly (by flags in SKILL.md) rather than explicitly (by the stub file's content). Implicit definitions drift when the parsing logic changes."

**Conservator (rebuttal — why drift by construction wins):**
> "On a project where discipline has been the bottleneck (the `design-architect-committee` stale catalog entry is an example of drift in exactly this pattern), paying implementation complexity once to eliminate drift permanently is the correct trade."

**Pragmatist (on sync-checker test):**
> "The stub content is behavioral mandate — its value is whether the MODEL follows it, not whether it literally matches character-for-character. Minor diffs (whitespace, phrasing) between the stub and SKILL.md are not failures. A character-exact diff test would flag false positives and need updating on every whitespace change."

### session-start current structure — ground-truth

**Researcher (verbatim observation):**
> "Zero stdin read. No `INPUT=$(cat)`."

**Researcher (wrapper string):**
> "The wrapper string is hardcoded on line 27: `\"<EXTREMELY_IMPORTANT>\\nYou have Chester...\"` The compact stub needs its own wrapper or a simplified version of this."

**Researcher (SKILL.md changes):**
> "Cleanest option for the spec: keep SKILL.md body unchanged; all gating and stub assembly in `session-start`. Pros: zero version bump, zero skill-index churn, one file changed."

### First-run wizard — current gate type

**Researcher (decisive):**
> "Current gate: model-executed prose, NOT script-level. The wizard block (SKILL.md lines 33–111) is injected as plain text instructions. The model reads: 'If `CHESTER_CONFIG_PATH` is `none`, this is a new project. Run the first-run setup.' The model then executes `eval \"$(chester-config-read)\"` as a bash command in its tool calls."

---

## 4. Enumerated points of divergence

**D1 — Axis A (three-way split, no majority):**
Conservator: runtime extraction from SKILL.md. Innovator + Pragmatist: inline heredoc in session-start. Purist: separate stub file. The three positions are mutually exclusive.

**D2 — Axis B: Choosing Between Skills (three exclude, one includes):**
Innovator includes Choosing Between Skills (lines 201–203, ~55 tokens) in the compact stub as part of the full `# Using Skills` section. Conservator, Pragmatist, and Purist exclude it. Purist gives the most detailed exclusion rationale (lookup pointer, not behavioral rule). This is the single live content-membership dispute after Pragmatist revised Skill Types to IN.

**D3 — Axis B: User Instructions (two include, two exclude):**
Innovator and Purist include User Instructions (lines 205–207, ~54 tokens). Conservator and Pragmatist exclude it. Purist's rationale for inclusion: "Instructions say WHAT, not HOW" is an anti-shortcut constraint at 102 bytes that costs essentially nothing.

**D4 — Axis B: How to Access Skills one-liner (one includes, three exclude):**
Purist includes the one-liner "In Claude Code: Use the Skill tool." (lines 162–164, ~15 tokens) as the mechanism statement that anchors The Rule. Conservator, Innovator, and Pragmatist exclude it as a cosmetic header.

**D5 — Axis E: Check 2 revised status (ambiguous whether Pragmatist revised):**
Conservator and Innovator both explicitly revised Check 2 to keep-verbatim after their peer exchange. Purist's transcript supports keeping Check 2 verbatim. Pragmatist's transcript does not record a revision of their axis E position on Check 2 — their final statement still cites ~300-token saving (consistent with only Check 3 kept verbatim). Whether Pragmatist's position on Check 2 is settled at keep-verbatim or at collapse-to-prose is not stated in their transcript.

**D6 — Axis F (three different drift-control mechanisms):**
Each axis-A position implies a different axis-F answer. Runtime extraction (Conservator) = drift impossible by construction. Inline heredoc (Innovator/Pragmatist) = two-place sync discipline, enforced by comment + version tag + commit convention. Separate file (Purist) = F1–F5 normative rules + test assertions for verbatim fidelity.

**D7 — Axis G: verbatim/byte-equality test (proposed by Purist only):**
Purist proposes T6 (byte-for-byte equality between stub block and SKILL.md source block) and T7 (line-count ceiling on stub). Neither appears in Conservator, Innovator, or Pragmatist test plans. Pragmatist explicitly argues against character-exact diff tests.

**D8 — Axis G: update test-start-cleanup.sh (proposed by Conservator only):**
Conservator calls out the existing test-start-cleanup.sh should be extended to assert `INPUT=$(cat)` is present in session-start post-implementation. No other member names this existing test.

**D9 — Axis B: Pragmatist B-section duplication:**
Pragmatist's transcript contains two `**Verbatim vs maintained:**` paragraphs in section B — one referencing blocks 1–6 and one referencing blocks 1–5. The second appears to be a leftover from a prior draft (before Skill Types was added back). This does not change the final position (all six blocks IN) but is a textual inconsistency in the transcript.

**D10 — SKILL.md version bump conditionality (axis H):**
Researcher provides a decisive finding: if SKILL.md body is unchanged (all gating/stub in session-start), no version bump required; version stays v0002. Conservator, Innovator, and Pragmatist each state v0002 → v0003 as if the startup trim (axis E, a SKILL.md body change) is assumed to land. Purist concurs with the conditionality. All positions are consistent with the researcher finding if axis E lands as specified.

<!-- produced-by: consolidator / round02 / 2026-06-05 -->
