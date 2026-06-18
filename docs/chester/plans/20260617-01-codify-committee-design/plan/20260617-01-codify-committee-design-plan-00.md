# Plan: Committee complete-design document (reverse D9)

**Sprint:** 20260617-01-codify-committee-design
**Spec:** docs/chester/working/20260617-01-codify-committee-design/spec/20260617-01-codify-committee-design-spec-02.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The `Execution mode` field selects which execute-write section runs — Section 2 (subagent-driven) or Section 3 (inline). plan-build sets this field at handoff based on the Execution Mode Selection heuristic, with human confirm/override.

## Goal

Make `design-committee` emit a structured **complete-design document** — committee-native sections carrying the eight FAC-complete-design fields as labeled content — instead of a verdict-only packet that `spec-write` must mine from narrative prose, and formally declare the committee→specify transition. D9 is explicitly reversed.

## Architecture

A documentation-and-template refactor confined to the `design-committee/` and `spec-write/` skill clusters. The scribe's `artifact-template.md` is fully replaced with the Option-2 shape (committee-native sections — Summary / Verdict / Rationale / Dissent Record / Deferred — with labeled sub-fields satisfying all eight FAC fields as content, not as headers). The scribe's bounded-input set (`verdict.md` + `alignment-map.md` + `consolidator-output.md`) and dispatch model are unchanged; only the template it fills and the way `spec-write` reads the result change. The committee's `Transitions` declaration moves from "none — standalone" to `spec-write → spec-harden → plan-build` (skipping `spec-architect`, which the committee path does not need). The work ships as **one sprint** with a **hard A→B ordering gate**: committee-internal changes (Cluster A) land before consumer-side changes (Cluster B), because Cluster B's FAC-contract table names labels that Cluster A's template must define first.

## Tech Stack

Markdown skill/agent/reference files. Bash verification only — `bin/chester-generate-agents` (catalog regen), `chester-trailer-write` (provenance, already stamped on artifacts not in this change set), `tests/test-generated-agents-current.sh` (catalog-freshness gate), and the full `tests/test-*.sh` suite. No application code, no unit-test framework — the "test-first" discipline is expressed as **verification-first**: each task writes a grep/test assertion that fails on the current state, makes the edit, then re-runs the assertion to confirm the new state. Edit targets live in the **dev repo** (`/home/mike/Documents/CodeProjects/Chester`), never the marketplace cache.

---

## Task 1: Replace artifact-template.md with the Option-2 complete-design template

**Type:** docs-producing
**Implements:** AC-1.1, AC-1.2
**Decision budget:** 3
**Must remain green:** `tests/test-generated-agents-current.sh` (no catalog impact — reference doc has no skill description; run to confirm no regression)

**Cluster:** A (committee-internal — authored before any Cluster B task).

**Files:**
- Modify (full replacement): `skills/design-committee/references/artifact-template.md`

**Steps (verification-first):**

- [ ] **Step 1: Write the failing assertion**

```bash
cd /home/mike/Documents/CodeProjects/Chester
# All eight FAC field labels must appear as labeled sub-fields; Dissent Record mandatory.
grep -qE '^\s*-\s+\*\*Goal:\*\*' skills/design-committee/references/artifact-template.md \
 && grep -qE '^\s*-\s+\*\*Chosen architecture:\*\*' skills/design-committee/references/artifact-template.md \
 && grep -qE '^\s*-\s+\*\*Rejected alternatives \+ sacrifices:\*\*' skills/design-committee/references/artifact-template.md \
 && grep -qE '^\s*-\s+\*\*Prior-art findings:\*\*' skills/design-committee/references/artifact-template.md \
 && grep -qE '^\s*-\s+\*\*Ground-truth-verified facts:\*\*' skills/design-committee/references/artifact-template.md \
 && grep -qE '^\s*-\s+\*\*Constraints / guardrails:\*\*' skills/design-committee/references/artifact-template.md \
 && grep -qE '^\s*-\s+\*\*Acceptance-criteria seeds:\*\*' skills/design-committee/references/artifact-template.md \
 && grep -qE '^\s*-\s+\*\*Deferred / non-goals:\*\*' skills/design-committee/references/artifact-template.md \
 && grep -qE '^## Dissent Record' skills/design-committee/references/artifact-template.md \
 && echo "ALL EIGHT FIELDS + DISSENT PRESENT" || echo "MISSING FIELDS"
# Section structure must NOT be the eight FAC fields as level-2 headers:
grep -qE '^## (Goal|Chosen architecture|Acceptance-criteria seeds)$' skills/design-committee/references/artifact-template.md \
 && echo "FAIL: FAC fields used as headers" || echo "OK: FAC fields are content, not headers"
```

- [ ] **Step 2: Run the assertion against the current file — confirm it fails**

Run: the Step 1 block.
Expected: `MISSING FIELDS` (the current generic template has no labeled FAC sub-fields). The headers check prints `OK` already (current template has none either) — that line guards against regressing into header form.

- [ ] **Step 3: Replace the file with the Option-2 template**

Overwrite `skills/design-committee/references/artifact-template.md` with exactly:

````markdown
# Committee Complete-Design Template

This is the annotated template the scribe uses when drafting the committee's
**complete-design document** — the round's designer-facing artifact and the
committee's hand-off into the specify phase. Every `<!-- -->` comment is
instruction to the scribe; remove all comments from the final draft.

The document keeps the committee-native section structure (Summary, Verdict,
Rationale, Dissent Record, Deferred / Open). Within those sections, **labeled
sub-fields carry all eight FAC-complete-design fields as content** — so a
downstream `spec-write` reads each field from its label rather than mining it
from narrative prose. The `## Dissent Record` section is mandatory and MUST
appear in every document regardless of whether members split.

The scribe fills every sub-field from its three bounded inputs only
(`verdict.md`, `alignment-map.md`, `consolidator-output.md`). A sub-field with
no support in those inputs is marked "none surfaced this round" — never
invented. Populating a labeled sub-field from the bounded inputs is permitted
and expected; it is not the prohibited "expanding the verdict's direction".

---

<!-- TITLE: Name the document by what it decides, not by the round number. -->
# [Complete Design — <what it decides>]

<!-- DATE: ISO date the document is produced. -->
**Date:** YYYY-MM-DD

<!-- SPRINT: Sprint name if committee operates inside a sprint context; omit if standalone. -->
**Sprint:** [sprint-name — or remove this entire line if standalone]

<!-- SOURCE: Cite the bounded inputs that produced this document. -->
**Source:** verdict from `committee/roundNN/verdict.md`; synthesis from `committee/roundNN/alignment-map.md`; member positions from `committee/roundNN/consolidator-output.md`

---

## Summary

<!-- One paragraph: what the committee was asked, what the verdict is, and what it means for downstream work. No jargon. -->

- **Goal:** <FAC field 1 — the problem the committee was asked to settle, stated as the goal the chosen design serves. From verdict.md's problem statement.>

## Verdict

<!-- State the verdict verbatim from verdict.md — do not paraphrase. -->

- **Chosen architecture:** <FAC field 2 — the chosen design direction, verbatim from verdict.md. THIS is the field spec-write quotes back to the designer before authoring any spec section; state it as a self-contained sentence so the quote-back reads cleanly on its own.>

## Rationale

<!-- Plain prose drawing from alignment-map.md (primary source) or, when absent, consolidator-output.md positions. State what was weighed and why the verdict resolves it. The labeled sub-fields below carry the remaining FAC fields; populate each from the bounded inputs, and mark "none surfaced this round" if the inputs carry nothing for it. -->

- **Rejected alternatives + sacrifices:** <FAC field 3 — the options set aside and the sacrifice each one carried. From alignment-map.md's positions-discarded-with-reason.>
- **Prior-art findings:** <FAC field 4 — researcher findings bearing on the verdict. From the Researcher line and notable quotes in consolidator-output.md, plus any alignment-map.md warrants. "none surfaced this round" if the researcher did not serve.>
- **Ground-truth-verified facts:** <FAC field 5 — facts verified against the codebase that the design relies on; consumed downstream without re-verification. Same sources as prior-art findings.>
- **Constraints / guardrails:** <FAC field 6 — constraints the verdict imposes on downstream work. From verdict.md / alignment-map.md.>
- **Acceptance-criteria seeds:** <FAC field 7 — the observable signals the design must satisfy; seeds for the spec's acceptance criteria. From the verdict's acceptance signals.>

## Dissent Record

<!-- MANDATORY. MUST appear in every document. If members were unanimous, state that explicitly. If members split, record each dissenting position — member name, position, and the blocking_risk field verbatim from their Final Position. This section is what the team-lead reads while presenting; it guarantees dissent reaches the designer even if the verdict does not foreground it. -->

**Alignment:** [4-0 unanimous | 3-1 | 2-2 | other]

**Dissenting positions** (if unanimous, replace the row below with: "None — all members aligned."):
- [Member]: [position verbatim] — blocking risk: [blocking_risk verbatim]

## Deferred / Open

<!-- Questions the committee left open or explicitly deferred. -->

- **Deferred / non-goals:** <FAC field 8 — what the design explicitly defers or rules out of scope. From verdict deferments / alignment-map.md. If none, write "None.">

---

<!-- produced-by: scribe / roundNN / YYYY-MM-DD -->
````

- [ ] **Step 4: Re-run the assertion — confirm it passes**

Run: the Step 1 block.
Expected: `ALL EIGHT FIELDS + DISSENT PRESENT` and `OK: FAC fields are content, not headers`.

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git add skills/design-committee/references/artifact-template.md
git commit -m "feat: replace committee artifact-template with Option-2 complete-design template"
```

---

## Task 2: Update scribe agent — artifact framing + lift "do not expand"

**Type:** docs-producing
**Implements:** AC-2.1, AC-2.2, AC-8.1 (scribe version bump)
**Decision budget:** 2
**Must remain green:** the grep assertions below

**Cluster:** A.

**Note (AC-8.1 resolved):** agent files now carry a `version:` field (convention added to `agents/CLAUDE.md`; all committee agents committed at `v0001` on main). The scribe has a real behavior change (lifting "do not expand"), so it bumps **v0001 → v0002**. The five advocacy/researcher role files get only a term-only edit (Task 8) and stay at `v0001` per the convention's "not on typo/term-only edits" carve-out.

**Files:**
- Modify: `agents/design-committee-scribe.md` (version line 6 → v0002; line 9 framing; line 15 "Write one artifact file"; line 20 "do not expand"; line 30 "no design opinion" — preserve, reword). *Line numbers reflect the added `version:` line; the edits below are text-anchored, so they apply regardless of exact line.*

**Steps (verification-first):**

- [ ] **Step 1: Write the failing assertion**

```bash
cd /home/mike/Documents/CodeProjects/Chester
# Output is named the complete-design document; no artifact-sense "decision-packet"; no-opinion prohibition survives; "do not expand it" gone; version bumped.
! grep -qiE 'decision[- ]packet' agents/design-committee-scribe.md \
 && grep -q 'complete-design document' agents/design-committee-scribe.md \
 && grep -q 'No design opinion' agents/design-committee-scribe.md \
 && ! grep -q 'do not expand it' agents/design-committee-scribe.md \
 && grep -q '^version: v0002' agents/design-committee-scribe.md \
 && echo "SCRIBE OK" || echo "SCRIBE NOT YET"
```

- [ ] **Step 2: Run — confirm it fails** (`SCRIBE NOT YET`. The file has no "decision-packet" occurrence today, so the first condition already holds; the assertion fails because "complete-design document" is absent, "do not expand it" is still present (~line 20), and the version is still v0001).

- [ ] **Step 3: Make the edits**

Edit 0 — version, frontmatter line 6: `version: v0001` → `version: v0002`.

Edit 1 — opening paragraph (~line 9). Replace:
> Job: author the committee's artifact (spec, plan, or analysis) from the converged verdict and the member-position record.

with:
> Job: author the committee's **complete-design document** from the converged verdict, the synthesis, and the member-position record.

Edit 2 — "Write one artifact file." (~line 15). Replace:
> - **Write one artifact file.** Draft it using the artifact template (path provided at dispatch) as the structural guide. Remove template comments from the draft. Write to the path the team-lead specifies (under `committee/`).

with:
> - **Write one artifact file — the complete-design document.** Draft it using the artifact template (path provided at dispatch) as the structural guide. The template carries labeled sub-fields for the eight FAC-complete-design fields; **populate each sub-field from your bounded inputs** (mark "none surfaced this round" when an input carries nothing for it). Remove template comments from the draft. Write to the path the team-lead specifies (under `committee/`).

Edit 3 — the `verdict.md` input bullet (~line 20). Replace:
> - `verdict.md` — the team-lead's specific, one-sentence-minimum decision. Primary source; write from it, do not expand it.

with:
> - `verdict.md` — the team-lead's specific, one-sentence-minimum decision. Primary source for the `Verdict` / `Chosen architecture` field; write from it. Populating the template's other labeled sub-fields from the synthesis and member-position inputs is expected — that is transcription into structured slots, not expanding the verdict's direction.

Edit 4 — the "No design opinion" prohibition (~line 30). Replace:
> - **No design opinion.** Write what the verdict says; do not embellish, soften, or expand its direction. (Stating the question the committee was asked, as framed by the verdict, to open `## Summary` is permitted — that is transcription, not opinion.)

with:
> - **No design opinion.** Write only what the bounded inputs state; do not embellish, soften, or add design direction beyond them. Populating a labeled sub-field with content drawn from the inputs is transcription, not opinion; inventing content for a sub-field the inputs do not support is prohibited — mark it "none surfaced this round" instead. (Stating the question the committee was asked, as framed by the verdict, to open `## Summary` is permitted — that is transcription, not opinion.)

- [ ] **Step 4: Re-run the assertion — confirm `SCRIBE OK`**

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git add agents/design-committee-scribe.md
git commit -m "feat: scribe authors complete-design document; permit structured sub-field population; bump v0002"
```

---

## Task 3: Update team-lead.md — rename artifact sense, disambiguate the locked surface

**Type:** docs-producing
**Implements:** AC-3.1
**Decision budget:** 3
**Must remain green:** `tests/test-member-warrant.sh` (its line-58 anchor on the Style-Exemplar heading is updated by this task in lockstep), the grep assertions below

**Cluster:** A. This is the two-sense hazard file. **Artifact sense → rename** to the complete-design document; **decision-communication-packet surface → disambiguate** (never delete, never rename to complete-design).

> Note: line 157 (the first Output-Surfaces bullet) already reads "Decision-communication packet" and needs **no** edit — it is the canonical survivor. So `grep -q 'decision-communication packet'` passes even pre-edit; the Step 1 assertion still resolves to `TEAMLEAD NOT YET` correctly because `complete-design document` and `version: v0014` are both absent until the edits land. The lines 158/160 edits are AC-3.1's third observable boundary (the end-of-turn artifact gains the Option-2 format).

**Files:**
- Modify: `skills/design-committee/references/team-lead.md` (version line 8; artifact sense lines 87, 102, 138, 139; surface sense lines 6, 36, 38, 158, 160, 216, 305, 331, 337)
- Modify: `tests/test-member-warrant.sh:58` (its anchor pins the old Style-Exemplar heading; update to the disambiguated heading so the guard still proves the locked surface survives)

**Steps (verification-first):**

- [ ] **Step 1: Write the failing assertion**

```bash
cd /home/mike/Documents/CodeProjects/Chester
F=skills/design-committee/references/team-lead.md
# Artifact sense gone; surface sense disambiguated and still present; version bumped.
! grep -qiE 'decision[- ]packet artifact' "$F" \
 && grep -q 'complete-design document' "$F" \
 && grep -q 'Decision-communication packet' "$F" \
 && grep -q 'decision-communication packet' "$F" \
 && grep -q '^version: v0014' "$F" \
 && echo "TEAMLEAD OK" || echo "TEAMLEAD NOT YET"
# No bare artifact-sense survivors (every remaining "decision packet"/"decision-communication packet" must be the hyphenated surface term):
grep -niE 'decision[- ]packet' "$F"
```

- [ ] **Step 2: Run — confirm `TEAMLEAD NOT YET`**, and inspect the grep listing to confirm which occurrences are artifact-sense (rename) vs surface-sense (disambiguate).

- [ ] **Step 3: Make the edits**

Version — line 8: `version: v0013` → `version: v0014`.

**Artifact-sense renames (→ complete-design document):**

- Line 87: `the team-lead's \`alignment-map.md\` and \`verdict.md\`, and the scribe's decision-packet artifact.` → `the team-lead's \`alignment-map.md\` and \`verdict.md\`, and the scribe's complete-design document.`
- Line 102 (step 6 Author): replace both artifact references in the step:
  - `The alignment map is the scribe's source for the artifact's \`Rationale\`; the verdict is its source for the decision.` → `The alignment map is the scribe's source for the complete-design document's \`Rationale\`; the verdict is its source for the \`Verdict\` / \`Chosen architecture\` field.`
  - `The scribe authors the round's decision-packet artifact — including its \`Dissent Record\` —` → `The scribe authors the round's complete-design document — including its \`Dissent Record\` —`
- Line 138 (Closure step 1): `\`verdict.md\`, and the scribe's decision-packet artifact reflect the final state` → `\`verdict.md\`, and the scribe's complete-design document reflect the final state`
- Line 139 (Closure step 2): `and the round's scribe decision-packet artifact, plus \`committee/ledger.md\`.` → `and the round's scribe complete-design document, plus \`committee/ledger.md\`.`

**Surface-sense disambiguation (→ decision-communication packet; the locked four-block surface stays):**

- Line 6 (frontmatter description): `format (decision packet + exemplar + gates)` → `format (decision-communication packet + exemplar + gates)`
- Line 36: `Decision packets honor \`CHESTER_INFO_PACKET_STYLE\`` → `Decision-communication packets honor \`CHESTER_INFO_PACKET_STYLE\``
- Line 38: `Overlay supersedes caveman compression for designer-facing decision packets.` → `Overlay supersedes caveman compression for designer-facing decision-communication packets.`
- Line 216 (heading): `### Style Exemplar — What a Good Decision Packet Sounds Like` → `### Style Exemplar — What a Good Decision-Communication Packet Sounds Like`
- Line 305: `or the decision packet.` → `or the decision-communication packet.`
- Line 331: `for designer-facing decision packet only.` → `for the designer-facing decision-communication packet only.`
- Line 337: `Decision packet or synthesis essay?` → `Decision-communication packet or synthesis essay?`

**End-of-turn artifact now has a format (lines 158, 160):**

- Line 158: replace
  > - **End-of-turn session artifact** — what the round leaves behind as its answer. It has **no mandated format**; it is whatever information best fits the question — a converged answer, a preserved split with each side's rationale, or a partial answer with named gaps.

  with
  > - **End-of-turn session artifact** — the scribe's **complete-design document**, what the round leaves behind as its answer and the committee's hand-off into the specify phase. It takes the **Option-2 template format** at `references/artifact-template.md`: committee-native sections (Summary / Verdict / Rationale / Dissent Record / Deferred) carrying the eight FAC-complete-design fields as labeled content. Its answer may still be a converged position, a preserved split with each side's rationale, or a partial answer with named gaps — the template carries whichever shape the round produced.

- Line 160: replace
  > These are separate surfaces: the locked format governs how a decision is *communicated*; it does not constrain the shape of the round's *answer*.

  with
  > These are separate surfaces: the locked four-block format governs how a *decision is communicated* to the designer; the complete-design template governs the shape of the round's *standing answer*. Neither constrains the other.

**Guard update (lockstep with the line-216 rename)** — `tests/test-member-warrant.sh:58`. Replace:
> `grep -q 'What a Good Decision Packet Sounds Like' "$TL"; check "locked decision-packet Style Exemplar intact (distinctive anchor)" $?`

with:
> `grep -q 'What a Good Decision-Communication Packet Sounds Like' "$TL"; check "locked decision-communication-packet Style Exemplar intact (distinctive anchor)" $?`

This keeps the guard's intent (the locked surface still exists) while tracking the disambiguated heading.

- [ ] **Step 4: Re-run the assertion + the guard**

Run the Step 1 assertion → confirm `TEAMLEAD OK`. The trailing `grep -niE 'decision[- ]packet' "$F"` should now return **nothing** — note this pattern does not match the disambiguated `decision-communication packet` (the "communication" breaks the adjacency) nor `complete-design document`, so an empty result confirms no bare artifact-sense term survives; the positive `grep -q 'decision-communication packet'` in Step 1 separately confirms the surface term is present. Then:
```bash
cd /home/mike/Documents/CodeProjects/Chester
bash tests/test-member-warrant.sh
```
Expected: the test prints its `ok:` lines including `locked decision-communication-packet Style Exemplar intact` and exits 0.

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git add skills/design-committee/references/team-lead.md tests/test-member-warrant.sh
git commit -m "feat: team-lead.md renames scribe artifact to complete-design document; disambiguates locked decision-communication packet"
```

---

## Task 4: Update committee-analysis-round-format.md — Option-2 structure + filename placeholder

**Type:** docs-producing
**Implements:** AC-3.2
**Decision budget:** 1
**Must remain green:** the grep assertions below

**Cluster:** A.

**Files:**
- Modify: `skills/design-committee/references/committee-analysis-round-format.md` (version line 11; artifact-sense lines 8, 39, 58, 70, 84, 101, 107, 220; section-structure enumeration lines 222-224)

**Steps (verification-first):**

- [ ] **Step 1: Write the failing assertion**

```bash
cd /home/mike/Documents/CodeProjects/Chester
F=skills/design-committee/references/committee-analysis-round-format.md
! grep -qiE 'decision[- ]packet' "$F" \
 && grep -q '<complete-design>.md' "$F" \
 && grep -q 'complete-design document' "$F" \
 && grep -q '^version: v0002' "$F" \
 && echo "ROUNDFMT OK" || echo "ROUNDFMT NOT YET"
```

- [ ] **Step 2: Run — confirm `ROUNDFMT NOT YET`.**

- [ ] **Step 3: Make the edits**

Version — line 11: `version: v0001` → `version: v0002`.

Rename every artifact-sense occurrence of "decision-packet"/"scribe decision-packet"/"designer-facing decision-packet" to the complete-design document:

- Line 8 (frontmatter description): `the scribe's designer-facing decision-packet artifact.` → `the scribe's designer-facing complete-design document.`
- Line 39: `- **Scribe decision-packet** (the designer-facing artifact) — authored by the scribe from` → `- **Scribe complete-design document** (the designer-facing artifact) — authored by the scribe from`
- Line 58 (folder-shape tree): `    └── <decision-packet>.md         # scribe: designer-facing artifact, per references/artifact-template.md` → `    └── <complete-design>.md         # scribe: designer-facing complete-design document, per references/artifact-template.md`
- Line 70: `- the **scribe decision-packet** is the round's designer-facing artifact.` → `- the **scribe complete-design document** is the round's designer-facing artifact.`
- Line 84: `5. The scribe authors the designer-facing decision-packet from the verdict, alignment map, and` → `5. The scribe authors the designer-facing complete-design document from the verdict, alignment map, and`
- Line 101: `- **Translation Gate boundary.** The Gate APPLIES to the scribe's designer-facing decision-packet.` → `- **Translation Gate boundary.** The Gate APPLIES to the scribe's designer-facing complete-design document.`
- Line 107: `committee's **output-surface split**: the scribe's designer-facing decision-packet has a locked` → `committee's **output-surface split**: the scribe's designer-facing complete-design document has a locked`
- Line 220 (heading): `### Scribe decision-packet (designer-facing — Translation Gate APPLIES)` → `### Scribe complete-design document (designer-facing — Translation Gate APPLIES)`

Section-structure enumeration — lines 222-224. Replace:
> The scribe authors the round's designer-facing artifact from `verdict.md`, `alignment-map.md`, and
> `consolidator-output.md`, following `references/artifact-template.md` — which owns the artifact's
> section structure (Summary, Verdict, Rationale, the mandatory `## Dissent Record`, Deferred / Open).

with:
> The scribe authors the round's designer-facing complete-design document from `verdict.md`, `alignment-map.md`, and
> `consolidator-output.md`, following `references/artifact-template.md` — which owns the document's
> section structure (Summary, Verdict, Rationale, the mandatory `## Dissent Record`, Deferred / Open),
> with labeled sub-fields carrying the eight FAC-complete-design fields as content.

- [ ] **Step 4: Re-run the assertion — confirm `ROUNDFMT OK`.**

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git add skills/design-committee/references/committee-analysis-round-format.md
git commit -m "feat: round-format.md describes scribe output as Option-2 complete-design document"
```

---

## Task 5: Reverse D9 in the FAC-complete-design contract

**Type:** docs-producing
**Implements:** AC-4.1
**Decision budget:** 2
**Must remain green:** `tests/test-fac-contract.sh` (its line-13 `committee verdict` anchor is updated by this task in lockstep; the bold field-label loop still passes — the table's first column keeps `**Goal**`, `**Chosen architecture**`, … unchanged), the grep assertions below

**Cluster:** B — **must run after Tasks 1-4** (it names the Option-2 field labels that Task 1 defines). Hard A→B gate.

**Files:**
- Modify: `skills/spec-write/references/fac-complete-design-contract.md` (line 5 framing; table lines 9-18; quote-back rationale line 22; D9 section lines 24-26). Unversioned reference doc — covered by the `spec-write` version bump in Task 6.
- Modify: `tests/test-fac-contract.sh:13` (the D9 reversal removes the string "committee verdict"; retarget the test to the new producer-mapping anchor)

**Steps (verification-first):**

- [ ] **Step 1: Write the failing assertion**

```bash
cd /home/mike/Documents/CodeProjects/Chester
F=skills/spec-write/references/fac-complete-design-contract.md
grep -q 'D9 is reversed' "$F" \
 && grep -q 'Chosen architecture' "$F" \
 && grep -q 'Committee complete-design source' "$F" \
 && ! grep -q 'rejected as primary' "$F" \
 && echo "FAC OK" || echo "FAC NOT YET"
```

- [ ] **Step 2: Run — confirm `FAC NOT YET`.**

- [ ] **Step 3: Make the edits**

Edit 1 — line 5. Replace:
> `spec-write` does not require producers to emit a new typed artifact. It **extracts** the eight fields below from the producer's native output.

with:
> The two producers differ in how `spec-write` reads the eight fields. The **committee** path reads them from the **labeled sub-fields of the complete-design document** (a structured read, not a narrative mine). The **spec-architect** path extracts them from its output. Either way, the eight fields below are the contract.

Edit 2 — the table. Replace the header and the "Committee verdict source" column so it names the Option-2 labels. Rewrite lines 9-18 as:

```markdown
| Field | Spec destination | Committee complete-design source | spec-architect source |
|-------|------------------|----------------------------------|-----------------------|
| **Goal** | spec Goal | Summary / **Goal** | brief goal |
| **Chosen architecture** | spec Architecture field *(the quote-back field)* | Verdict / **Chosen architecture** | user-selected option |
| **Rejected alternatives + declared sacrifices** | architectural rationale + Constraints | Rationale / **Rejected alternatives + sacrifices** | architect alternatives |
| **Prior-art findings** | Components / reuse notes + adversarial-pass context | Rationale / **Prior-art findings** | prior-art explorer output |
| **Ground-truth-verified facts** | Components + Data Flow (consumed without re-verification) | Rationale / **Ground-truth-verified facts** | re-verified later in spec-harden |
| **Constraints / guardrails** | spec Constraints | Rationale / **Constraints / guardrails** | brief + F-A-C constraints |
| **Acceptance-criteria seeds** | AC-N.M expansion | Rationale / **Acceptance-criteria seeds** | brief acceptance criteria |
| **Deferred / non-goals** | spec Non-Goals | Deferred / Open / **Deferred / non-goals** | brief out-of-scope |
```

Edit 3 — quote-back rationale, line 22. Replace:
> Before authoring **any** spec section, `spec-write` reads the **Chosen architecture** field and **quotes it back** to the user for confirmation. That field is the pivot every architecture-derived spec section (Architecture, Components, Data Flow, Acceptance Criteria) depends on. Silent mis-extraction from a narrative committee verdict is the one failure hardening structurally cannot catch (it verifies the spec against itself, not against design intent) — the quote-back is the only guard.

with:
> Before authoring **any** spec section, `spec-write` reads the **Chosen architecture** field and **quotes it back** to the user for confirmation. That field is the pivot every architecture-derived spec section (Architecture, Components, Data Flow, Acceptance Criteria) depends on. For the committee path this is now a structured read of a labeled sub-field rather than a mine of narrative prose — materially lower-risk, since the producer states the architecture in its own labeled slot. The quote-back is retained as the confirmation checkpoint (hardening verifies the spec against itself, not against design intent, so the designer's confirmation of the carried-forward architecture still matters); it is simpler than before, not eliminated.

Edit 4 — the D9 section, lines 24-26. Replace:
> ## Why extraction, not a typed bundle
>
> Producers emit no new artifact. A typed FAC-bundle (committee scribe writes a structured bundle) was rejected as primary — it adds a committee output mode and re-introduces artifact bifurcation — and is retained only as a documented fallback if extraction-with-quote-back proves unreliable (D9).

with:
> ## Why a structured committee document (D9 reversed)
>
> **D9 is reversed.** D9 originally rejected a typed committee bundle as primary, to avoid artifact bifurcation, leaving the committee on a verdict-only packet that `spec-write` mined from narrative prose. That left one uncatchable failure: silent mis-extraction from the narrative, guarded only by a single human quote-back. The committee is now elevated to producing a **complete-design document** whose eight design fields are present as labeled content (committee-native Option-2 shape at `skills/design-committee/references/artifact-template.md`). This is not a second output mode — it is the committee's one output, so there is no bifurcation; and `spec-write` reads the fields by label instead of mining them, closing the mis-extraction gap at the source. The `spec-architect` path is unchanged: it still supplies the same eight fields through this one contract.

**Guard update (lockstep)** — `tests/test-fac-contract.sh:13`. Replace:
> `grep -qi 'committee verdict' "$REF" || fail "no committee-verdict mapping"`

with:
> `grep -qi 'complete-design source' "$REF" || fail "no committee complete-design mapping"`

(The new table header column "Committee complete-design source" supplies this anchor. The `spec-architect` and `quote.back` checks on lines 14-15 still pass — both terms survive the rewrite, and the bold field-label loop on lines 10-12 still passes because the table's first column keeps `**Goal**`, `**Chosen architecture**`, etc.)

- [ ] **Step 4: Re-run the assertion + the guard**

Run the Step 1 assertion → `FAC OK`. Then:
```bash
cd /home/mike/Documents/CodeProjects/Chester
bash tests/test-fac-contract.sh
```
Expected: `PASS: FAC contract defined`.

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git add skills/spec-write/references/fac-complete-design-contract.md tests/test-fac-contract.sh
git commit -m "feat: reverse D9 — committee emits a structured complete-design document; contract reads labeled fields"
```

---

## Task 6: Update spec-write/SKILL.md (structured-field read) + regenerate catalog

**Type:** docs-producing
**Implements:** AC-5.2, AC-6.1
**Decision budget:** 2
**Must remain green:** `tests/test-generated-agents-current.sh`, `tests/test-spec-write-skill.sh`, `tests/test-stamping-spec-write.sh` (both version-pin tests are updated to v0002 by this task in lockstep with the bump)

**Cluster:** B. The **description edit is the one confirmed catalog-regen trigger** — the regen and the description edit must land in the **same commit** (catalog-freshness invariant).

**Files:**
- Modify: `skills/spec-write/SKILL.md` (description line 3; version line 4; Entry Condition line 16; body lines 25, 51)
- Modify (regenerated, do not hand-edit): `skills/setup-start/references/skill-index.md`
- Modify: `tests/test-spec-write-skill.sh:9` and `tests/test-stamping-spec-write.sh` (the two tests that pin spec-write at `v0001`; retarget to `v0002`)

**Steps (verification-first):**

- [ ] **Step 1: Write the failing assertion**

```bash
cd /home/mike/Documents/CodeProjects/Chester
grep -q 'design-committee complete-design document' skills/spec-write/SKILL.md \
 && grep -q '^version: v0002' skills/spec-write/SKILL.md \
 && ! grep -qi 'committee verdict' skills/spec-write/SKILL.md \
 && ! grep -q 'verdict (FAC-complete' skills/spec-write/SKILL.md \
 && echo "SPECWRITE OK" || echo "SPECWRITE NOT YET"
```

The fourth condition guards the **line-16 Entry Condition** stale text — `committee verdict` (space) does NOT match `` `design-committee` verdict `` (the backtick separates the words), so a dedicated check on `verdict (FAC-complete` is needed; it matches line 16 today and must be gone after the edit.

- [ ] **Step 2: Run — confirm `SPECWRITE NOT YET`.**

- [ ] **Step 3: Make the edits**

Version — line 4: `version: v0001` → `version: v0002`.

Description — line 3. Replace:
> description: "Author a spec document from a FAC-complete design. Use when the architecture is already settled — by a design-committee verdict or a spec-architect output. Extracts the eight-field FAC-complete-design contract, quotes back the chosen-architecture field for confirmation, fills the spec template, and emits the spec. Authors only — runs no review passes. Invoked by both entry paths; transitions to spec-harden."

with:
> description: "Author a spec document from a FAC-complete design. Use when the architecture is already settled — by a design-committee complete-design document or a spec-architect output. Reads the eight-field FAC-complete-design contract (labeled fields on the committee path, extraction on the spec-architect path), quotes back the chosen-architecture field for confirmation, fills the spec template, and emits the spec. Authors only — runs no review passes. Invoked by both entry paths; transitions to spec-harden."

Entry Condition — line 16. Replace:
> - a `design-committee` verdict (FAC-complete by deliberation), or

with:
> - a `design-committee` complete-design document (FAC-complete by deliberation), or

(This is the internal-contradiction fix: the grep `committee verdict` misses it because of the backtick, so it must be edited explicitly.)

Body — line 25 (checklist item 1). Replace:
> 1. **Read the FAC-complete design** — extract the eight fields per `references/fac-complete-design-contract.md` from the producer's native output (committee verdict or spec-architect output).

with:
> 1. **Read the FAC-complete design** — obtain the eight fields per `references/fac-complete-design-contract.md`: on the **committee path** read them from the labeled sub-fields of the complete-design document (a structured read, not a narrative mine); on the **spec-architect path** extract them from its output.

Body — line 51 (Integration / Invoked by). Replace:
> - **Invoked by:** `spec-architect` (small-task path), the `design-committee` path (committee verdict), or user directly (standalone, with any FAC-complete design)

with:
> - **Invoked by:** `spec-architect` (small-task path), the `design-committee` path (committee complete-design document), or user directly (standalone, with any FAC-complete design)

- [ ] **Step 4: Update the two version-pin guards (lockstep with the v0002 bump)**

`tests/test-spec-write-skill.sh:9` — replace:
> `grep -q '^version: v0001$' "$SKILL" || fail "version not v0001"`

with:
> `grep -q '^version: v0002$' "$SKILL" || fail "version not v0002"`

`tests/test-stamping-spec-write.sh` (the `CUR_VER` check near the end) — replace:
> `[ "$CUR_VER" = "v0001" ] || fail "version not at v0001 (got $CUR_VER)"`

with:
> `[ "$CUR_VER" = "v0002" ] || fail "version not at v0002 (got $CUR_VER)"`

- [ ] **Step 5: Regenerate the catalog and run the affected guards**

```bash
cd /home/mike/Documents/CodeProjects/Chester
bin/chester-generate-agents
bash tests/test-generated-agents-current.sh
bash tests/test-spec-write-skill.sh
bash tests/test-stamping-spec-write.sh
```
Expected: catalog regenerated into `skills/setup-start/references/skill-index.md`; all three print PASS. Then re-run the Step 1 assertion → `SPECWRITE OK`.

- [ ] **Step 6: Commit (description edit + regenerated catalog + version-pin guards together)**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git add skills/spec-write/SKILL.md skills/setup-start/references/skill-index.md tests/test-spec-write-skill.sh tests/test-stamping-spec-write.sh
git commit -m "feat: spec-write reads committee complete-design document fields; regen catalog; bump version pins"
```

---

## Task 7: Declare the committee→specify transition in design-committee/SKILL.md

**Type:** docs-producing
**Implements:** AC-5.1
**Decision budget:** 1
**Must remain green:** `tests/test-generated-agents-current.sh` (must still pass — description is intentionally unchanged, so the catalog stays fresh)

**Cluster:** B. The **frontmatter description MUST NOT change** (it is convening-focused) — so this file triggers **no** catalog regen. Body edits only, plus the version bump that also covers the unversioned `artifact-template.md` from Task 1.

**Files:**
- Modify: `skills/design-committee/SKILL.md` (version line 4; scribe line 150; Integration Reads line 226; Transitions line 228; Tear Down line 199)

**Steps (verification-first):**

- [ ] **Step 1: Write the failing assertion**

```bash
cd /home/mike/Documents/CodeProjects/Chester
F=skills/design-committee/SKILL.md
! grep -qF '**Transitions to:** none' "$F" \
 && grep -qE 'spec-write.*spec-harden.*plan-build' "$F" \
 && ! grep -qiE 'decision[- ]packet' "$F" \
 && grep -q '^version: v0024' "$F" \
 && echo "COMMITTEE OK" || echo "COMMITTEE NOT YET"
# Description must be byte-identical to pre-sprint (convening-focused, untouched):
sed -n '3p' "$F"
```

- [ ] **Step 2: Run — confirm `COMMITTEE NOT YET`** and record line 3 (the description) to compare after editing.

- [ ] **Step 3: Make the edits** (leave line 3 description untouched)

Version — line 4: `version: v0023` → `version: v0024`.

Scribe line — line 150. Replace:
> `chester:design-committee-scribe` is an agent this skill uses, dispatched once per round after convergence to author the round's designer-facing decision-packet from the verdict, alignment map, and consolidator output — following `references/artifact-template.md`, whose path the team-lead provides at dispatch.

with:
> `chester:design-committee-scribe` is an agent this skill uses, dispatched once per round after convergence to author the round's designer-facing complete-design document from the verdict, alignment map, and consolidator output — following `references/artifact-template.md`, whose path the team-lead provides at dispatch.

Tear Down — line 199. Replace:
> Decision packet stays in conversation record independent of team lifecycle.

with:
> The complete-design document stays in conversation record independent of team lifecycle.

Integration Reads — line 226. Replace:
> `references/artifact-template.md` (scribe artifact structure), `references/skill-contract.md` (skill-author only).

with:
> `references/artifact-template.md` (the scribe's complete-design document structure), `references/skill-contract.md` (skill-author only).

Transitions — line 228. Replace:
> - **Transitions to:** none — committee = standalone consultation.

with:
> - **Transitions to:** `spec-write` → `spec-harden` → `plan-build` — the committee's complete-design document is FAC-complete, so it routes into the specify phase directly (skipping `spec-architect`, which the committee path does not need; D8). Standalone invocability is unchanged.

(Leave line 229 "Designer routes downstream work." in place beneath it.)

- [ ] **Step 4: Re-run the assertion — confirm `COMMITTEE OK`** and that line 3 (description) is byte-identical to the Step 2 capture.

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git add skills/design-committee/SKILL.md
git commit -m "feat: committee declares spec-write transition; renames scribe output to complete-design document"
```

---

## Task 8: Minor terminology sweep (no behavior change)

**Type:** docs-producing
**Implements:** AC-7.2 (minor-file clause)
**Decision budget:** 1
**Must remain green:** `tests/test-generated-agents-current.sh` (these edits touch no skill description → catalog stays fresh)

**Cluster:** Fold-in (no special ordering). Term-only edits — **no version bumps**. The five role agent files now carry `version: v0001`, but their edit is terminology-only (the prohibition's meaning is unchanged), so they **stay v0001** per `agents/CLAUDE.md`'s "not on typo/term-only edits" rule (mirrors AC-8.1's exemption). `spec-harden/SKILL.md` likewise stays v0001 (term-only).

**Files:**
- Modify: `skills/spec-harden/SKILL.md:23`
- Modify: `agents/design-committee-conservator.md:48`, `agents/design-committee-innovator.md:48`, `agents/design-committee-pragmatist.md:48`, `agents/design-committee-purist.md:48`, `agents/design-committee-researcher.md:32` (line numbers reflect the added `version:` line; edits are text-anchored)
- Modify: `docs/instructions.md:207,209`
- Modify: `skills/design-committee/references/skill-contract.md:40`

**Steps (verification-first):**

- [ ] **Step 1: Write the failing assertion**

```bash
cd /home/mike/Documents/CodeProjects/Chester
# spec-harden + instructions name the complete-design document; role files & skill-contract carry no artifact-sense "decision packet".
! grep -qi 'committee verdict' skills/spec-harden/SKILL.md \
 && ! grep -qi 'committee verdict' docs/instructions.md \
 && ! grep -qiE 'decision[- ]packet' agents/design-committee-conservator.md agents/design-committee-innovator.md agents/design-committee-pragmatist.md agents/design-committee-purist.md agents/design-committee-researcher.md \
 && ! grep -qiE 'decision-packet output expected' skills/design-committee/references/skill-contract.md \
 && echo "MINORS OK" || echo "MINORS NOT YET"
```

- [ ] **Step 2: Run — confirm `MINORS NOT YET`.**

- [ ] **Step 3: Make the edits**

- `skills/spec-harden/SKILL.md:23`: `the originating design (committee verdict or brief) for goals coverage` → `the originating design (committee complete-design document or brief) for goals coverage`
- `agents/design-committee-innovator.md:48`, `…-pragmatist.md:48`, `…-purist.md:48` (these three are byte-identical): `No consolidating, no writing decision packet, no adjudicating.` → `No consolidating, no writing the complete-design document, no adjudicating.`
- `agents/design-committee-conservator.md:48` (**differs** — has a trailing `Team-lead does.`): `No consolidating, no writing decision packet, no adjudicating. Team-lead does.` → `No consolidating, no writing the complete-design document, no adjudicating. Team-lead does.`
- `agents/design-committee-researcher.md:32`: `No consolidating decision packet, no adjudicating.` → `No consolidating the complete-design document, no adjudicating.`
- `docs/instructions.md:207`: `either a committee verdict or the output of \`spec-architect\`.` → `either a committee complete-design document or the output of \`spec-architect\`.`
- `docs/instructions.md:209`: `directly after a committee verdict, which is already FAC-complete` → `directly after a committee complete-design document, which is already FAC-complete`
- `skills/design-committee/references/skill-contract.md:40`: `peer-DM enabled, decision-packet output expected.` → `peer-DM enabled, complete-design document output expected.`

- [ ] **Step 4: Re-run the assertion — confirm `MINORS OK`.**

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git add skills/spec-harden/SKILL.md agents/design-committee-conservator.md agents/design-committee-innovator.md agents/design-committee-pragmatist.md agents/design-committee-purist.md agents/design-committee-researcher.md docs/instructions.md skills/design-committee/references/skill-contract.md
git commit -m "docs: terminology sweep — committee complete-design document replaces verdict/decision-packet terms"
```

---

## Task 9: Final verification sweep — residuals, absence, versions, full suite

**Type:** docs-producing
**Implements:** AC-7.1, AC-7.2, AC-8.1, AC-6.1
**Decision budget:** 1
**Must remain green:** every `tests/test-*.sh`

**Cluster:** Final gate — run after Tasks 1-8.

**Files:**
- No edits (verification only). If a residual is found, fix it in the file it belongs to and amend that file's commit (or add a fix commit), then re-run.

**Steps (verification-first):**

- [ ] **Step 1: Residual artifact-sense sweep (the locked surface and history are the only legitimate survivors)**

```bash
cd /home/mike/Documents/CodeProjects/Chester
echo "== no bare artifact-sense 'decision packet'/'decision-packet' may survive =="
# NOTE: the pattern below does NOT match the disambiguated 'decision-communication packet'
# (the 'communication' breaks the decision↔packet adjacency), so any hit is a genuine residual.
if grep -rniE 'decision[- ]packet' skills/design-committee skills/spec-write agents/design-committee-*.md docs/instructions.md; then
  echo "FAIL: bare artifact-sense decision-packet residual listed above"
else
  echo "OK: no bare decision-packet residual"
fi
echo "== bolded 'Transitions to: none' must be gone from design-committee (grep -F: the ** markers defeat a plain pattern) =="
grep -rnF '**Transitions to:** none' skills/design-committee/ && echo "FAIL: stale transition survives" || echo "OK: none"
echo "== the disambiguated surface term must still be present (locked surface preserved) =="
grep -q 'decision-communication packet' skills/design-committee/references/team-lead.md && echo "OK: locked surface present" || echo "FAIL: surface term lost"
echo "== narrative-extraction language describing the committee path must be gone =="
grep -rniE 'mine.*narrative|extract.*from.*narrative|narrative committee verdict' skills/spec-write skills/design-committee || echo "OK: none"
```
Expected: `OK: no bare decision-packet residual`, `OK: none` (transitions), `OK: locked surface present`, `OK: none` (narrative). Any `FAIL:` line is a real residual — fix it in its owning file and amend that file's commit.

- [ ] **Step 2: Absence check — verified-clean files must not appear in the sprint diff**

```bash
cd /home/mike/Documents/CodeProjects/Chester
echo "== these must NOT be listed (no CLAUDE.md, no settings, no spec-architect/SKILL.md) =="
git diff --name-only main...HEAD | grep -E 'CLAUDE\.md$|\.claude/settings\.chester\.local\.json$|skills/spec-architect/SKILL\.md$' \
  && echo "FAIL: a verified-clean file changed" || echo "OK: verified-clean files untouched"
```
Expected: `OK: verified-clean files untouched`. (The user-scoped `~/.claude/settings.chester.json` is outside the repo and cannot appear here — correctly not asserted.)

- [ ] **Step 3: Version-bump audit**

```bash
cd /home/mike/Documents/CodeProjects/Chester
grep -m1 '^version:' skills/design-committee/SKILL.md          # expect v0024
grep -m1 '^version:' skills/spec-write/SKILL.md                # expect v0002
grep -m1 '^version:' skills/design-committee/references/team-lead.md                      # expect v0014
grep -m1 '^version:' skills/design-committee/references/committee-analysis-round-format.md # expect v0002
grep -m1 '^version:' agents/design-committee-scribe.md        # expect v0002 (behavior change — bumped)
grep -m1 '^version:' skills/spec-harden/SKILL.md              # expect v0001 (UNCHANGED — term-only)
for r in conservator innovator pragmatist purist researcher; do
  printf '%s ' "$r"; grep -m1 '^version:' "agents/design-committee-$r.md"   # each expect v0001 (term-only — unchanged)
done
```
Expected exactly: `v0024`, `v0002`, `v0014`, `v0002`, scribe `v0002`, spec-harden `v0001`, and all five role files `v0001`. **AC-8.1 satisfied literally:** the scribe (behavior change) is bumped to v0002; the five role files and spec-harden carry term-only edits and correctly stay at v0001 per the version-bump carve-out.

- [ ] **Step 4: Catalog freshness + full suite**

```bash
cd /home/mike/Documents/CodeProjects/Chester
bash tests/test-generated-agents-current.sh
for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done
```
Expected: catalog test PASS; no `FAIL:` lines from the suite.

- [ ] **Step 5: Commit (only if Step 1-4 required a residual fix; otherwise nothing to commit)**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git status --porcelain   # if clean, no commit needed — verification passed on prior commits
```

---

## Coverage map (every AC → implementing task)

- AC-1.1, AC-1.2 → Task 1
- AC-2.1, AC-2.2 → Task 2
- AC-3.1 → Task 3
- AC-3.2 → Task 4
- AC-4.1 → Task 5
- AC-5.1 → Task 7
- AC-5.2 → Task 6
- AC-6.1 → Task 6 (regen+commit) verified again in Task 9
- AC-7.1 → Task 9
- AC-7.2 → Tasks 3, 4, 7, 8 (edits) + Task 9 (sweep)
- AC-8.1 → version bumps in Tasks 2 (scribe → v0002), 3, 4, 6, 7 + Task 9 audit (role files + spec-harden stay v0001, term-only)

<!-- created-at: 2026-06-17T16:15:39Z -->
<!-- produced-by plan-build@v0007 -->
