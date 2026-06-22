# Purist Transcript — Round 03
# Sprint: 20260604-02-review-start-context
# Role: Purist — category boundaries + compositional integrity
# Date: 2026-06-05
# Focus: ATTACK phase — find leaks, broken composition, dangling references in draft spec

## Ground Truth Established (direct file reads this round)

All findings below are from direct reads of `skills/setup-start/SKILL.md` at HEAD.

### Session Housekeeping block structure (critical for §3.5 attack)

The block from lines 29–161 has this structure:

```
## Session Housekeeping          [line 29 — Markdown heading]

At the start of every session:  [line 31 — section intro]

1. **First-run project configuration:**  [line 33 — ONLY numbered item]
   eval "$(chester-config-read)"         [line 35 — sets ALL variables]
   If CHESTER_CONFIG_PATH is `none`:     [line 37 — wizard branch start]
     a. ... h. ... [wizard body]         [lines 39-111]
   If CHESTER_CONFIG_PATH is not `none`: [line 113 — checks branch start]
     Check 0-3                           [lines 116-148]
     After checks, echo BOTH paths       [lines 150-160]
```

Key facts:
- The entire Session Housekeeping block has ONLY ONE numbered item (item 1).
  There is no item 2, no item 3. The wizard and the checks are both sub-branches
  of item 1.
- The eval at line 35 is the PREAMBLE to both branches. It sets CHESTER_CONFIG_PATH,
  CHESTER_WORKING_DIR, and CHESTER_PLANS_DIR — all three are referenced by checks 0–3.
- Markdown headings inside Session Housekeeping: NONE. The wizard/checks boundary at
  line 113 is a prose conditional, not a heading.
- No cross-references between sections (no "as described above" / "see setup" / "same
  format as"). Zero instances found.

### Variable dependency map

Variables set by `eval "$(chester-config-read)"` (line 35):
- `CHESTER_CONFIG_PATH` — used at line 37 (wizard gate) and line 113 (checks gate)
- `CHESTER_WORKING_DIR` — used at lines 63, 123, 124, 154
- `CHESTER_PLANS_DIR` — used at lines 79, 81, 142, 143, 154

All variables in checks 0–3 (lines 113–160) are set by the eval at line 35.
The eval is outside both branches — it is shared preamble.

### Path-echo duplication

The announce format `Chester is configured. / Working directory / Plans directory`
appears TWICE: lines 108–110 (wizard, step h) and lines 153–155 (checks).
These are parallel, independent — no cross-reference. The checks copy is self-contained.

---

## Attack Findings

### FINDING 1 — BLOCKING: §3.5 wizard strip boundary is underspecified, with one
### dangerous interpretation that produces dangling variable references

The spec §3.5 says: "strips the `## Session Housekeeping` first-run wizard sub-block
from the emitted full body when `CHESTER_CONFIG_PATH != 'none'`."

The "wizard sub-block" is not defined precisely enough. Two interpretations:

**Option A: strip lines 37–112** (the `if none` branch body only; keep eval at 35)
Result for an established project:
```
## Session Housekeeping

At the start of every session:

1. **First-run project configuration:** Check for project-scoped Chester config:
   eval "$(chester-config-read)"
   If `CHESTER_CONFIG_PATH` is not `none`, this is a returning session. Run these
   verification checks silently...
   [checks 0-3]
```
Variable coherence: INTACT. The eval runs, all variables are set before checks execute.
Structural problem: the item-1 label **"First-run project configuration"** now labels
a returning-session path. An established-project model reads "First-run project
configuration" and may be confused about its context.

**Option B: strip lines 33–112** (entire item 1 including eval and wizard)
Result:
```
## Session Housekeeping

At the start of every session:

   If `CHESTER_CONFIG_PATH` is not `none`, this is a returning session. Run these
   verification checks silently...
   [checks 0-3 referencing CHESTER_WORKING_DIR, CHESTER_PLANS_DIR]
```
Variable coherence: **BROKEN.** CHESTER_WORKING_DIR and CHESTER_PLANS_DIR are referenced
in checks 0–3 but never set — the eval was stripped. The session hook emits instructions
that reference undefined variables. Silent behavioral failure: the model attempts to execute
checks against variables it has not resolved.

The spec does not specify which option the implementer should choose. §3.5 says
"strips the wizard sub-block" — but the wizard sub-block as a natural reading is
"the if-none branch," which is Option A (strip 37–112). Option A is probably the
intended interpretation. But it is not stated.

**Severity:** BLOCKING. The spec must pin the strip boundary to lines 37–112
(the if-none branch body), explicitly preserving the eval at line 35 as shared
preamble. If an implementer reads "strip the wizard block" as stripping from the
item-1 header, they produce broken variable references in the emitted housekeeping
text for every established-project startup.

### FINDING 2 — MODERATE: §3.5 "heading-to-heading content-anchor" is a false claim

The spec §3.5 says: "strips the wizard sub-block... using a **content-anchor `sed` range
(heading-to-heading)**."

There are NO Markdown headings between lines 29 (`## Session Housekeeping`) and
line 162 (`## How to Access Skills`). The wizard/checks boundary is a prose conditional
("If `CHESTER_CONFIG_PATH` is not `none`", line 113), not a heading.

A heading-to-heading `sed` range is therefore impossible for this strip. The actual
anchors would need to be the prose strings themselves:
- Strip-start anchor: `If \`CHESTER_CONFIG_PATH\` is \`none\``
- Strip-end anchor: `If \`CHESTER_CONFIG_PATH\` is not \`none\``

These prose anchors are fragile to:
- Backtick formatting changes (e.g., plain quotes instead of backticks)
- Wording changes ("is `none`" → "equals `none`")
- None of these changes would be flagged as breaking by any existing test

The spec labels this anchor approach "content-anchor... heading-to-heading" — that
term is accurate for OTHER sections (e.g., heading-to-heading strip of `## The Rule`)
but is factually wrong for the wizard strip. The spec must correct this characterization
and specify the exact prose anchor strings, or adopt a different strip mechanism.

**Severity:** MODERATE. Wrong label on the mechanism, with genuine fragility
implications. Not a silent-failure risk until someone edits the prose conditions —
but the spec should not document a false mechanism.

### FINDING 3 — MODERATE: Misleading item-1 label after strip (Option A result)

Under the correct strip (Option A, lines 37–112 stripped):

The emitted body for an established project contains:
```
1. **First-run project configuration:** Check for project-scoped Chester config:
   eval "$(chester-config-read)"
   If CHESTER_CONFIG_PATH is not none, this is a returning session...
```

The label "First-run project configuration" is now semantically inverted — the wizard
(the first-run part) is absent, and what remains is the returning-session path. This is
not a dangling reference (no broken pointer) but it is a misleading behavioral cue. A
model reading this label may apply "first-run" framing to a returning session, potentially
triggering an unnecessary re-explanation of the directory model or a re-prompt to the user.

**Severity:** MODERATE. Not a category-boundary violation per se, but a composition
problem that produces a plausible behavioral error in the emitted payload. The spec
should require renaming or removing the item-1 label as part of the wizard strip.
One clean option: rename item 1 to "**Session configuration:**" for all emitted bodies
(both wizard and checks), so neither path carries a path-specific label.

### FINDING 4 — LOW: Single-item numbered list is awkward but not broken

After stripping the wizard (Option A), the `## Session Housekeeping` section has:
- Section intro: "At the start of every session:"
- Exactly one numbered item (1.) with the eval + checks

A numbered list with one item is not a Markdown error but it is an oddity. More
importantly, the list was presumably "1." anticipating additional items that never
arrived. The spec can note this as a startup-trim opportunity (collapse the list wrapper
to prose) but it does not affect correctness.

**Severity:** LOW. Cosmetic.

### FINDING 5 — CLEARED: §3.3 two-authority question

The concern: separate stub file (`compact-mandate.md`) + SKILL.md = two authorities for
one mandate category.

**Cleared.** F1 (source-of-truth comment) + F3 (verbatim CI test) together make this a
single-authority-with-derived-copy pattern, not a dual-authority pattern. The F3 test
collapses them: if the stub diverges from SKILL.md, the test fails before the stub can
be used in production. The "two authorities" framing is only dangerous if the test is
absent. With the test present, the file hierarchy is: SKILL.md is source, stub is
enforced derivative. Clean.

The residual risk (edit SKILL.md mandate, run no tests, stub silently stale until next
CI run) is the normal risk for any copy-with-test architecture. Not a category violation.

### FINDING 6 — CLEARED: Orientation line is state context, not a rule

The proposed orientation line: `# Session context: housekeeping already complete this
session. Mandate only.`

A rule would say "Do not run housekeeping." The orientation line says "housekeeping
already complete" — state context, explaining absence. It does not instruct behavior.
It is not a category (b) item leaking into the compact stub. **Cleared.**

### FINDING 7 — CLEARED: "How to Access Skills" one-liner is self-contained

"**In Claude Code:** Use the `Skill` tool." — this is a self-contained instruction.
The Skill tool is a real, available tool. The one-liner does not point to any content
that has been stripped. It does not reference `skill-index.md`. **Cleared.**

### FINDING 8 — CLEARED: "User Instructions" is mandate

"Instructions say WHAT, not HOW. 'Add X' or 'Fix Y' doesn't mean skip workflows."
This is a behavioral rule about how to interpret user requests — it is post-invocation
behavior guidance, parallel to Skill Types. It has no external dependency, no stripped
cross-reference. **Cleared as mandate.**

---

## Researcher Response (received, incorporated)

Researcher confirmed both questions from the DM:

1. **No Markdown headings between lines 30 and 161.** The entire Session Housekeeping
   zone has only `## Session Housekeeping` (line 29) and `## How to Access Skills`
   (line 162). The wizard/checks boundary at line 113 is 3-space-indented prose —
   continuation of item 1, not a heading. §3.5's "heading-to-heading" claim is
   confirmed falsified.

2. **eval boundary confirmed open in the spec.** Prior analysis never resolved the
   eval-in/out question. "Wizard sub-block" used informally throughout. Finding 1
   stands as a blocking gap.

3. **Researcher surfaced Option C — total-block strip:**
   Strip the entire `## Session Housekeeping` block (lines 29–161). Uses a true
   heading-to-heading sed range. Removes eval + wizard + checks together. No broken
   variable refs. Saves ~1,188 tokens instead of ~696.

### Purist ruling on Option C

Option C resolves the anchor and eval-boundary problems. But it removes the verification
checks (category b) from the established-project startup payload — contradicting §3.2's
explicit intent ("established project → full body minus wizard"). The spec keeps checks
on startup deliberately; Conservator (round01): "catch broken state at session open, not
three skills later." Total-block strip trades a category (b) startup safety behavior for
a cleaner sed anchor. Correctness for implementation convenience.

**Ruling: reject Option C as a conforming implementation of the spec as written.** It is
a valid design alternative — but adopting it requires revising §3.2's intent, not just
§3.5's mechanism. If the designer accepts dropping startup verification, §3.2 must be
updated to say so explicitly. It cannot be silently achieved through the §3.5 strip.

### Revised resolution for Findings 1 and 2

**Resolution A (recommended) — restructure SKILL.md with named subheadings:**

Give the wizard and checks their own `###` headings inside `## Session Housekeeping`:

```markdown
### New Project Setup
If CHESTER_CONFIG_PATH is none, run the first-run setup: ...

### Returning Project Checks
If CHESTER_CONFIG_PATH is not none, run verification: ...
```

The strip becomes a true heading-to-heading range:
`sed '/^### New Project Setup/,/^### Returning Project Checks/{/^### Returning/!d}'`

This closes all three compounding problems: unambiguous anchor, no eval-boundary
ambiguity (eval stays as item-1 preamble above both headings), no misleading item-1
label (the item header just says "Check for project-scoped Chester config" with the
two named paths below). One SKILL.md restructure pays off all three problems.

**Resolution B — prose-anchored strip with explicit pinning and test guard:**

Keep SKILL.md as-is. §3.5 must pin the exact prose anchor strings, state explicitly
that the eval is kept (strip starts at line 37's prose condition, not line 33), and
add a test (T-anchor-integrity) that verifies those prose strings still exist verbatim
in SKILL.md — so an anchor-breaking edit is caught by test, not discovered at runtime.

Resolution A is cleaner and fixes the label problem simultaneously. Resolution B is
lower-change but requires a test that must not rot.

---

## Summary of Attack Findings (revised after researcher response)

| # | Finding | Severity | Blocks? |
|---|---------|----------|---------|
| 1 | §3.5 strip boundary underspecified + prose anchor unguarded + Option C contradicts §3.2 | BLOCKING | YES |
| 2 | §3.5 "heading-to-heading" anchor claim is false — anchors are prose | MODERATE (subsumed by F1) | NO |
| 3 | Item-1 label "First-run project configuration" misleading after strip | MODERATE | NO |
| 4 | Single-item numbered list is awkward post-strip | LOW | NO |
| 5 | Two-authority concern (§3.3) | — | CLEARED |
| 6 | Orientation line is rule leakage (§3.4) | — | CLEARED |
| 7 | "How to Access Skills" dangling (§3.4) | — | CLEARED |
| 8 | "User Instructions" housekeeping (§3.4) | — | CLEARED |

**Required spec fix (BLOCKING):** Choose Resolution A or B. Under either:
- Pin the strip boundary explicitly: eval is shared preamble, kept; wizard branch body
  (or named subheading) is the strip target.
- Correct "heading-to-heading" label: prose anchor (Resolution B) or true heading after
  SKILL.md restructure (Resolution A).
- The item-1 "First-run project configuration" label must be addressed (renamed or
  restructured away).
- If §3.5 adopts total-block strip (Option C), §3.2 must be revised to declare startup
  verification absent from established-project payloads — cannot be a silent change.

---

<!-- created-at: 2026-06-05 -->
<!-- role: purist -->
<!-- round: 03 -->
<!-- sprint: 20260604-02-review-start-context -->
<!-- revised: after researcher response -->
<!-- round: 03 -->
<!-- sprint: 20260604-02-review-start-context -->
