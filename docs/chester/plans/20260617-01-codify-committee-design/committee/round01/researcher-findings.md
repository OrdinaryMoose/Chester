# Researcher Findings — round01

**Sprint:** 20260617-01-codify-committee-design
**Date:** 2026-06-17
**Question:** Should `design-committee` emit a complete design document via a committee-specific template mirroring the eight FAC-complete-design fields — reversing D9?

---

## 1. Current `artifact-template.md` — Verdict Packet Structure

**File:** `skills/design-committee/references/artifact-template.md`

DECISIVE: The current committee artifact template has exactly **five sections**:

1. `## Summary` — one paragraph: what was asked, what the verdict is, what it means for downstream work.
2. `## Verdict` — verbatim from `verdict.md`; no paraphrase.
3. `## Rationale` — plain prose drawn from `alignment-map.md` or `consolidator-output.md`.
4. `## Dissent Record` — **MANDATORY** in every artifact. Alignment count + per-dissenter verbatim `blocking_risk`. States "None — all members aligned." when unanimous.
5. `## Deferred / Open` — questions left open or deferred; "None." if empty.

Also present: standard header fields (Title, Date, Sprint, Source).

**Key observation:** The template is decision-oriented, not design-oriented. It documents what was decided and who disagreed, not what was designed. There is no Goal, Prior Art, Scope, Key Decisions, Constraints, or Acceptance Criteria section. The Dissent Record has no equivalent in `design-small-task`.

**Template file is 49 lines total.** No sub-templates or alternate artifact-template files exist in `skills/design-committee/references/`.

---

## 2. `design-small-task` Six-Section Brief Template

**File:** `skills/design-small-task/references/design-brief-small-template.md`

DECISIVE: The `design-small-task` brief template has exactly **six required sections**:

1. **Goal** — one paragraph: what is being built and why (problem + solution combined).
2. **Prior Art** — what exists already in the codebase that informed this design; prior attempts; patterns to follow or avoid.
3. **Scope** — in-scope bullets and out-of-scope bullets (each exclusion must have a rationale).
4. **Key Decisions** — design choices with rationale and alternatives considered; one line per decision with inline rationale.
5. **Constraints** — what limits implementation; simple bullet list for bounded tasks.
6. **Acceptance Criteria** — observable, testable conditions for completion.

**Sections DELIBERATELY OMITTED from the small template** (with stated reasons):
- Header (Status, Date, Sprint, Parent, Companion) — sprint context inherited from directory path.
- Logic Trail — no formal proof system.
- Dependencies — bounded tasks rarely need this.
- Current State Inventory — too heavy.
- Assumptions (CONFIRMED/CORRECTED/UNTESTED) — bounded tasks don't accumulate testable assumptions.
- Residual Risks — inline in Constraints or Key Decisions.
- Follow-on Work — bounded tasks don't enable dependency chains.

**Self-containment test:** the brief must be consumable by `plan-build` without reading the design conversation.

---

## 3. FAC-Complete Design Contract — Eight Fields, D9 Text, Quote-Back Risk

**File:** `skills/spec-write/references/fac-complete-design-contract.md`

### The eight fields (lines 9–18)

| Field | Spec destination | Committee verdict source | spec-architect source |
|-------|------------------|--------------------------|-----------------------|
| Goal | spec Goal | verdict's problem statement | brief goal |
| Chosen architecture | spec Architecture *(quote-back field)* | verdict's chosen direction | user-selected option |
| Rejected alternatives + declared sacrifices | architectural rationale + Constraints | verdict's rejected lenses | architect alternatives |
| Prior-art findings | Components / reuse notes + adversarial-pass context | researcher findings | prior-art explorer output |
| Ground-truth-verified facts | Components + Data Flow | researcher ground-truth | re-verified later in spec-harden |
| Constraints / guardrails | spec Constraints | verdict constraints | brief + F-A-C constraints |
| Acceptance-criteria seeds | AC-N.M expansion | verdict acceptance signals | brief acceptance criteria |
| Deferred / non-goals | spec Non-Goals | verdict deferments | brief out-of-scope |

### Quote-back risk line (line 22)

DECISIVE — verbatim:

> "Silent mis-extraction from a narrative committee verdict is the one failure hardening structurally cannot catch (it verifies the spec against itself, not against design intent) — the quote-back is the only guard."

### D9 text (lines 24–26)

DECISIVE — verbatim:

> "## Why extraction, not a typed bundle
>
> Producers emit no new artifact. A typed FAC-bundle (committee scribe writes a structured bundle) was rejected as primary — it adds a committee output mode and re-introduces artifact bifurcation — and is retained only as a documented fallback if extraction-with-quote-back proves unreliable (D9)."

**Exact location of D9:** `skills/spec-write/references/fac-complete-design-contract.md` lines 24–26.

**What D9 explicitly decided:**
- PRIMARY: extraction (no new typed artifact). Rejected reason: "adds a committee output mode and re-introduces artifact bifurcation."
- FALLBACK (D9): typed FAC-bundle retained only if extraction-with-quote-back proves unreliable.

DECISIVE: D9 is not a design-doc vs. verdict-packet distinction — it is an extraction-vs-typed-bundle distinction. The current question is whether to reverse D9 by making the committee scribe author a document shaped like the eight FAC fields instead of the current verdict-packet shape.

---

## 4. Scribe Inputs/Output Contract

**File:** `agents/design-committee-scribe.md`

### Allowed inputs (lines 18–23)

DECISIVE: The scribe may read exactly:

1. `verdict.md` — primary source. Write from it, do not expand it.
2. Artifact-template path — structural guide, provided at dispatch.
3. `consolidator-output.md` — per-member positions; used for `## Dissent Record`; copy `blocking_risk` verbatim.
4. `alignment-map.md` (optional) — primary source for `## Rationale` when present.
5. Prior artifact version (optional) — when revising.

### Hard prohibitions (lines 25–28)

- **Never receives raw transcripts** — `committee/roundNN/<member>-transcript.md` files are NOT scribe inputs.
- **Never receives the session thread** — no conversation history beyond stated inputs.
- **No design opinion** — writes what the verdict says; no embellishment, softening, or expansion.
- **No summarizing of dissent** — `blocking_risk` values are copied verbatim.

### Output contract

Returns only: `artifact: <path>` + `status: done`. Does not paste draft.

**Context-economy boundary implication:** If the committee is asked to emit a design document (not just a verdict packet), the scribe's bounded inputs remain the same. The scribe can only populate design-doc fields that appear in `verdict.md` or `consolidator-output.md`. Structural fields not surfaced in the verdict (e.g., Prior Art, detailed Key Decisions with rationale, Scope) would require the verdict itself to contain them — meaning the responsibility for those fields falls on what team-lead writes into `verdict.md`, not the scribe's reading scope.

---

## 5. Wiring of `artifact-template.md` in `design-committee/SKILL.md`

**File:** `skills/design-committee/SKILL.md`, line 150:

> "`chester:design-committee-scribe` is an agent this skill uses, dispatched once per round after convergence to author the round's designer-facing decision-packet from the verdict, alignment map, and consolidator output — following `references/artifact-template.md`, whose path the team-lead provides at dispatch."

Also at line 226 (Integration § Reads):

> "references/artifact-template.md (scribe artifact structure)"

**Key fact:** The path is provided dynamically by the team-lead at dispatch — it is not hardcoded in the scribe agent file. Replacing or augmenting the template requires updating the team-lead dispatch step, not the scribe's system prompt.

---

## 6. Other Callers of `artifact-template.md`

**Grep result:** All references to `artifact-template.md` outside the `skills/design-committee/` directory are:

- `agents/design-committee-scribe.md` (lines 14, 22) — scribe receives the path at dispatch.
- Historical sprint plans/working archives in `docs/chester/plans/` and `docs/chester/working/` — these are prior committee artifacts and sprint records referencing the template, not callers that dispatch with it.
- `docs/chester/working/20260617-01-codify-committee-design/` — this sprint's convening and handoff docs.
- `docs/feature-definition/Pending/design-committee-answer-delivery-extension-00.md` — feature brief referencing the template.

**DECISIVE finding:** `artifact-template.md` has exactly **two live callers**:
1. `skills/design-committee/SKILL.md` (§ Scribe, line 150; § Integration Reads, line 226) — wires the path to scribe dispatch.
2. `agents/design-committee-scribe.md` — receives the path at dispatch and reads the file.

No other skill or agent dispatches with or reads this template path directly. The template is committee-internal.

---

## 7. Structural Comparison: Current Artifact vs. Eight FAC Fields

| FAC field | Present in current `artifact-template.md`? | Where (if present) |
|-----------|---------------------------------------------|---------------------|
| Goal | Partially — Summary ¶1 mentions "what was asked" | § Summary |
| Chosen architecture | Partially — "what the verdict is" | § Verdict (verbatim) |
| Rejected alternatives + declared sacrifices | Partially — rationale mentions what was weighed | § Rationale |
| Prior-art findings | Absent | — |
| Ground-truth-verified facts | Absent | — |
| Constraints / guardrails | Absent | — |
| Acceptance-criteria seeds | Absent | — |
| Deferred / non-goals | Present | § Deferred / Open |

**DECISIVE:** Five of the eight FAC fields are either absent or only partially represented in the current verdict-packet template. The three absent fields (Prior-art findings, Ground-truth-verified facts, Constraints/guardrails) are the ones `spec-write` must extract from narrative verdict prose — which is exactly the extraction risk that the quote-back guards against.

---

## Final Position

```
position: no design opinion — research role holds no advocacy
blocking_risk: none — research role holds no advocacy position
warrant:
  type: evidence
  source: file-by-file reading of four target files + grep corpus for callers
```

**Summary of decisive facts for advocacy members:**

1. The current `artifact-template.md` has five sections (Summary, Verdict, Rationale, Dissent Record, Deferred/Open) — it is a decision record, not a design document.
2. Five of the eight FAC fields are absent or only partial in the current template; three (Prior Art, Ground-truth facts, Constraints) require extraction from narrative prose.
3. D9 (fac-complete-design-contract.md lines 24–26) rejected a typed FAC-bundle as PRIMARY because it "adds a committee output mode and re-introduces artifact bifurcation" — retained as FALLBACK only if extraction-with-quote-back proves unreliable.
4. The quote-back risk line (line 22) identifies silent mis-extraction from narrative verdict as "the one failure hardening structurally cannot catch."
5. The scribe's bounded inputs (verdict.md + consolidator-output.md + alignment-map.md) cannot supply design-doc fields that were never captured in the verdict. Emitting design fields requires those fields to exist in `verdict.md` itself.
6. The artifact-template path is provided dynamically at dispatch — replacing the template requires updating only the team-lead dispatch step, not the scribe agent file.
7. `artifact-template.md` has exactly two live callers: `SKILL.md` § Scribe and `agents/design-committee-scribe.md`. No other skill reads it.
```
