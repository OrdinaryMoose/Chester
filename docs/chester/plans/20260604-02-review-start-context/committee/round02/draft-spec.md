# DRAFT SPEC (round02 output) — Trigger-Split Start-Sequence Payload

**Status:** PROVISIONAL. Team-lead synthesis of round02 develop digests. Input to round03 ATTACK.
Fork resolutions marked **[PROVISIONAL — attack target]** are not settled — round03 stress-tests them.

## 1. What this builds

The SessionStart hook currently injects the full `setup-start` body (~2,014 tokens) on every
`startup|clear|compact` event. Compaction re-pays the full body though filesystem state
(config, dirs) does not decay — only the behavioral skill-discovery mandate decays. This spec
makes the hook emit:

- **startup / clear** → full body (with two trims: first-run wizard gated off established
  projects; verification bash prose collapsed).
- **compact** → mandate-only stub (~750 tokens).

One hook. One script (`chester-util-config/session-start`) branches on the stdin `trigger`
field. `setup-start/SKILL.md` body is the canonical source of the mandate text.

## 2. Ground-truth (Researcher, DECISIVE — all from direct reads / test fixtures)

- Branch field = **`.trigger`** (values `"startup" | "clear" | "compact"`). NOT `hook_event_name`
  (that is `"SessionStart"` for all three events — cannot distinguish). Confirmed
  `tests/test-compaction-hooks.sh:68`.
- **jq present** at `/usr/bin/jq`. Reuse the exact `pre-compact.sh` idiom:
  `INPUT=$(cat); TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')`.
- Current `session-start` reads **zero stdin** (one `cat` of SKILL.md). The branch must be added.
- `hooks.json` SessionStart = **one entry**, matcher `startup|clear|compact`. Unchanged under
  one-hook approach (split-and-keep: do NOT strip `compact`).
- Hook injects SKILL.md **minus frontmatter**.
- The mandate is **non-contiguous** in SKILL.md: cluster 1 (top) + cluster 2 (bottom), with the
  Session Housekeeping block (~4,810 bytes) between them.

## 3. Component specs

### 3.1 hooks.json — UNCHANGED
One SessionStart entry, matcher `startup|clear|compact`, command runs `session-start`. No edit.

### 3.2 session-start — REWRITE (the mechanism)

Logic order:
1. `INPUT=$(cat)`; `TRIGGER=$(echo "$INPUT" | jq -r '.trigger // ""')`.
2. **If `TRIGGER` == `"compact"`** → emit the compact stub → `exit 0`.
3. **Else** (startup / clear / empty / malformed / any non-compact) → emit full payload:
   a. `eval "$(chester-config-read)"`.
   b. If `CHESTER_CONFIG_PATH` != `"none"` (established project) → emit full body **minus the
      first-run wizard block**.
   c. Else (new project) → emit full body **with** wizard.

**Fallback rule (D, unanimous):** any trigger that is not exactly `"compact"` emits the full
payload. Parse failure → empty string → full payload. The mandate is never dropped on ambiguity.

### 3.3 Compact stub — location **[PROVISIONAL — attack target #1]**

Provisional pick: **separate stub file** `skills/setup-start/references/compact-mandate.md`
(Purist). `session-start` on `compact` does `cat` of this file. Rationale: the file *is* the
mandate category — reviewable and testable by inspection; `session-start` stays trivial.

Considered and provisionally rejected:
- **Inline heredoc in session-start** (Innovator, Pragmatist) — simplest, payloads co-located,
  but the category is buried in shell, less reviewable. *Equally drift-safe given the §4 test.*
- **Runtime extraction from SKILL.md** (Conservator) — zero copy, but non-contiguous mandate
  needs ~20 lines multi-region `sed`/`awk`, an empty-extraction guard, and silently breaks on a
  heading rename. Its sole advantage (no drift) is matched by the §4 verbatim test on a copy.

Round03 decides: separate-file vs heredoc (extraction reopenable only if the §4 test is broken).

### 3.4 Compact stub — membership **[PROVISIONAL — attack target #2]**

Provisional pick: Purist's byte-measured list. Exactly these blocks, **verbatim**, in SKILL.md
order (anchored by heading, not line number):

1. `<SUBAGENT-STOP>` block
2. `<EXTREMELY-IMPORTANT>` block
3. `## Instruction Priority`
4. `## How to Access Skills` (one-liner)
5. `## The Rule` (under `# Using Skills`)
6. `## Red Flags` (table — settled KEEP, fork ii)
7. `## Skill Types`
8. `## User Instructions`

Plus one orientation line at stub top (state context, not a rule):
`# Session context: housekeeping already complete this session. Mandate only.`

Total ~750 tokens (~2,991 bytes + orientation).

**OUT:** all of `## Session Housekeeping` (first-run wizard + verification checks 0–3);
`## Choosing Between Skills` (a lookup pointer, not a behavioral rule — and it routes to
skill-index.md). Membership disagreement to resolve in round03: Skill Types (Pragmatist excluded
it; round01 floor + 3 members include it), Choosing Between Skills (Innovator included; 3 out),
User Instructions (Purist+Innovator in).

### 3.5 First-run gating **[PROVISIONAL — attack target #3]**

The wizard must never load on an established project (saves ~696 tok off every startup/clear).
Provisional mechanism: `session-start` strips the `## Session Housekeeping` first-run wizard
sub-block from the emitted full body when `CHESTER_CONFIG_PATH != "none"`, using a
**content-anchor `sed` range** (heading-to-heading), not line numbers. Exact anchor expressions
to be pinned by the implementer against current SKILL.md (Pragmatist flagged medium confidence
on the exact `sed` expression). Round03 attacks the `sed`-strip fragility.

### 3.6 Startup trim (E, in scope)

In `setup-start/SKILL.md`: collapse the verification-check bash snippets to one-sentence prose
descriptions. **KEEP verbatim** `sed -i "\|^$CHESTER_PLANS_DIR|d"` (non-obvious idiom; wrong
reconstruction = silent delayed failure — plans dir stays gitignored, caught only when archive
artifacts land untracked at sprint finish). ~300 tok off startup.

## 4. Drift control (F — three-layer lock, Purist)

- **F1** — `compact-mandate.md` header comment states it is DERIVED from SKILL.md mandate blocks,
  never authored independently.
- **F2** — the explicit named block list (§3.4) is the spec-of-record for membership.
- **F3** — **verbatim CI test**: each stub block is byte-for-byte identical to its SKILL.md
  source block. This is the mechanism that makes a copy as drift-safe as runtime extraction.

## 5. Test plan (G — merged superset)

New `tests/test-session-start.sh`, extending the stdin→grep `additionalContext` pattern from
`test-compaction-hooks.sh:Test4`:

- **T1** `compact` → mandate blocks present.
- **T2** `compact` → housekeeping ABSENT (inverted grep — the absence assertion is what proves
  the split).
- **T3** `startup` + established config → full minus wizard (checks present, wizard absent).
- **T4** `startup` + no config → wizard present.
- **T5** `clear` → same as T3.
- **T6** empty / absent trigger → full payload (fallback).
- **T7** malformed JSON → full payload (parse-fail fallback).
- **T8** verbatim: each stub block byte-identical to SKILL.md source block (F3).
- **T9** stub size ceiling (line/token cap — catches accidental additions T1 misses).

## 6. Version & sync (H)

- `setup-start/SKILL.md` v0002 → **v0003** (startup trim edits the body).
- skill-index.md stale `design-architect-committee` entry — **DONE** (committed `0e79b85` this
  sprint), listed as satisfied prerequisite.
- Description frontmatter + available-skills list entry: unchanged (skill's public interface
  unchanged). No two-place-sync churn.
- Commit names both surfaces (`session-start` + `SKILL.md` + new `compact-mandate.md` + test).

## 7. Open forks handed to round03 ATTACK

1. **Stub location** — separate file vs heredoc (extraction reopenable only by breaking F3).
2. **Stub membership** — Skill Types / Choosing / User Instructions / How-to-Access boundaries.
3. **First-run gating** — `sed`-strip content-anchor fragility; is there a cleaner gate?
4. **Did develop miss a failure mode?** — empty-extraction, heading-rename, jq-absent host,
   `clear` semantics, stub staleness when SKILL.md mandate is edited without re-sync.
