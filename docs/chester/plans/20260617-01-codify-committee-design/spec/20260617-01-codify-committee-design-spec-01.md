# Spec: Committee complete-design document (reverse D9)

**Sprint:** 20260617-01-codify-committee-design
**Parent brief:** none — FAC-complete design supplied by `design-committee` verdicts (`committee/round01/verdict.md` + `committee/round02/verdict.md`, stamped `design-committee@v0023`)
**Architecture:** `design-committee` emits a **complete-design document** via a committee-specific template in **Option-2 shape** — committee-native section structure (Verdict / Rationale / Dissent Record / Deferred) carrying **labeled, structured sub-fields that satisfy all eight FAC-complete-design fields as content, not as section headers**. The mandatory Dissent Record is preserved; the scribe's bounded inputs (`verdict.md` + `consolidator-output.md` + `alignment-map.md`) are unchanged. **D9 is explicitly reversed.** The committee's `Transitions` declaration moves from "none — standalone" to the specify path. **FAC basis:** feasibility — every field is already sourced by the scribe's three existing bounded inputs, so no new input or dispatch model is needed (researcher-verified); suitability — keeping committee-native structure means the scribe maps like-to-like, eliminating the cross-slot translation layer that headers would introduce (the round01 correctness warrant); completeness — the eight fields are all reachable from the verdict/alignment-map/consolidator content. **Rejected alternatives + sacrifices:** keep-D9 verdict-only (rejected — leaves the uncatchable narrative-mis-extraction gap open); shared format with `design-small-task` (rejected — no Dissent-Record analog, category mismatch); eight fields as section headers / Option 3 (rejected — relocates the mis-mapping gap into the scribe's write); two-sprint split (rejected — shared edit surfaces leave a self-contradictory intermediate doc state). Accepted sacrifices: `spec-write` extraction becomes slightly less mechanical (reads nested labeled sub-fields, not top-level headers); template-design effort to define the sub-field slots; single-pass coordination risk, mitigated by the hard A→B task ordering. **Provenance:** committee verdicts, `design-committee@v0023`.

## Terminology — two distinct "packet" senses (read before the rename)

The committee docs overload the word "packet." This sprint renames **one** sense and **preserves** the other; conflating them is a known hazard (the Purist's "packet voice naming collision").

- **Scribe output artifact** — the per-round designer-facing document the scribe authors from the team-lead's bounded inputs. Today called the "decision-packet"; this sprint **renames it to the complete-design document** and changes its shape to Option-2. This is the rename target.
- **Decision-communication packet** — the team-lead's **locked four-block surface** (Summary / Information Package / Decision Package / Team-Lead Comments) used **only when the team-lead seeks a designer value-judgment**. Round01/round02 established the committee's *output-surface split*: this surface stays **locked and unchanged**. It is **not** renamed. Where its name collides with the artifact term (e.g., `team-lead.md` "packet voice", Output Surfaces), the fix is **disambiguation** (name it the decision-communication packet), never deletion.

Every rename AC below targets the **artifact** sense only.

## Goal

Codify a committee design-and-transition-to-specify process so that `design-committee` produces a real, structured design document instead of a verdict-only decision packet that `spec-write` must mine from narrative prose. Today the committee emits a five-section verdict packet and the spec stage reverse-engineers the eight FAC fields out of its narrative Rationale; the governing contract self-admits that silent mis-extraction from that narrative is the one failure structural hardening cannot catch, leaving a single human quote-back as the only guard. This sprint closes that gap at the source: the committee's own output becomes a complete-design document whose eight design fields are present as labeled content, and the committee formally declares its transition into the specify phase. The entire change is a documentation-and-template refactor confined to the `design-committee/` and `spec-write/` skill clusters; it ships as one sprint, committee-internal changes authored before consumer-side changes.

## Components

**Cluster A — committee-internal (authored first):**

- `skills/design-committee/references/artifact-template.md` — **full replacement** with the Option-2 complete-design template: committee-native sections (Verdict / Rationale / Dissent Record / Deferred) with labeled sub-fields satisfying all eight FAC fields as content. The `## Dissent Record` stays mandatory.
- `agents/design-committee-scribe.md` — update the artifact-type framing from "decision-packet" to "complete-design document"; **lift or rewrite the "do not expand" instruction** so the scribe may populate the structured sub-fields from its bounded inputs (correctness fix — the instruction as written under-populates the new template). The "no design opinion / write what the verdict says" prohibition must survive in a form compatible with sub-field population. Version bump.
- `skills/design-committee/references/team-lead.md` — rename the **artifact-sense** "decision-packet" references (Per-Round Flow step 6, Closure step 1, and the scribe-artifact mention in Output Surfaces) to the complete-design document; **preserve and disambiguate** the **decision-communication packet** surface (Output Surfaces, Information Packet Format, Dispatch Voice / "packet voice" ~line 331) — that surface stays locked, its references are clarified not removed. Update the Output-Surfaces "end-of-turn session artifact" description to name the Option-2 template as its format (it is no longer format-free). Version bump.
- `skills/design-committee/references/committee-analysis-round-format.md` — update **artifact-sense** "decision-packet" references and the scribe-artifact section-structure enumeration to the Option-2 shape; fix the `<decision-packet>.md` filename placeholder in the folder-shape tree (~line 58). Version bump.

**Cluster B — consumer-side (authored after cluster A):**

- `skills/spec-write/references/fac-complete-design-contract.md` — **explicitly reverse D9** (replace the "typed bundle rejected as primary" rationale with the D9-reversal statement and its reason); update the extraction framing so the committee path reads labeled fields from a design document rather than mining a narrative verdict; update the quote-back rationale (reading a labeled field is lower-risk than mining prose — the guard may weaken or simplify, not vanish); update the "Committee verdict source" table column to name the Option-2 field labels. Version bump.
- `skills/spec-write/SKILL.md` — update the body's extraction language for the committee path (extract-from-narrative → read-structured-fields) and the **description frontmatter** ("Extracts the eight-field FAC-complete-design contract…" + "design-committee verdict"); "committee verdict" → "committee complete-design document" where it names the producer's output. **Description edit → catalog regen (the one confirmed trigger).** Version bump.
- `skills/design-committee/SKILL.md` — update the scribe line ("decision-packet" → complete-design document, **artifact sense**) and change `Transitions to: none — standalone consultation` to name the specify path (`spec-write` → `spec-harden` → `plan-build`), mirroring how `design-small-task` declares its transition. These are **body** edits; the frontmatter description is convening-focused and does **not** change, so this file alone triggers **no** catalog regen. Version bump.
- `skills/setup-start/references/skill-index.md` — **regenerate** via `bin/chester-generate-agents` after the `spec-write/SKILL.md` description edit lands; staged in the same commit (mechanical, last step).

**Minor / terminology (fold in, no special ordering):**

- `skills/spec-harden/SKILL.md` — "committee verdict" → "committee complete-design document" (terminology only; no behavior change, so no version bump required by AC-8.1).
- The **five committee role agent files** (`agents/design-committee-{conservator,innovator,pragmatist,purist,researcher}.md`) — each carries the artifact-sense term in its "No team-lead role-play" prohibition (advocacy files ≈ "No … writing decision packet…"; researcher line 31 "No consolidating decision packet…"). Update the artifact-sense term; the prohibition itself stays.
- `docs/instructions.md` (~lines 207/209) — update committee-output / pipeline description.
- `skills/design-committee/references/skill-contract.md` (line 40) — **confirmed stale**: it reads "…peer-DM enabled, decision-packet output expected", naming the old output artifact type. Update the artifact-sense term to the complete-design document. (Skill-author-only doc, not runtime-read, but standalone-documentation-discipline still applies.)

**Confirmed clean — must remain unchanged (absence is a tested outcome):** all `CLAUDE.md` files; both settings files (`settings.chester.local.json`, `settings.chester.json` — pure config); `skills/spec-architect/SKILL.md` (committee path still skips it; remains accurate).

## Data Flow

After this sprint, a committee round flows as: team-lead writes `verdict.md` + `alignment-map.md`; the scribe reads its three bounded inputs and authors the **Option-2 complete-design document** (committee-native sections with the eight FAC fields as labeled sub-fields). A downstream `spec-write` invocation reads those labeled fields **directly** — `Chosen architecture` from its labeled sub-field rather than mined from narrative Rationale — and quotes back the architecture (a simpler labeled-field read). The scribe's input set and dispatch model do not change; only the template it fills and the way `spec-write` reads the result change. The team-lead's decision-communication packet (the locked surface used to seek designer decisions) is unaffected. The committee's `Transitions` field now routes the designer explicitly into the specify phase.

## Error Handling

- **Catalog drift** — the `spec-write/SKILL.md` description edit without a regenerated `skill-index.md` fails `tests/test-generated-agents-current.sh`. Mitigation: regen + stage `skill-index.md` in the same commit (AC-6.1).
- **Scribe under-population** — if the "do not expand" instruction is left intact, the scribe writes a structurally-present-but-empty Option-2 document. Mitigation: lift/rewrite the instruction in cluster A (AC-2.2).
- **Over-rename of the locked surface** — a blanket "decision-packet" purge would wrongly rename the decision-communication packet. Mitigation: every rename AC is scoped to the artifact sense; AC-3.1 preserves the surface; AC-7.2's grep excludes the surface term (see AC).
- **Self-contradictory intermediate state** — partial application (template replaced but `Transitions` line still "none", or artifact-sense "decision-packet" surviving) leaves Chester's own docs internally inconsistent. Mitigation: single sprint, A→B ordering, final cross-reference sweep (AC-3.1, AC-7.2).
- **Over-reach** — editing a `CLAUDE.md`/settings file, or `spec-architect/SKILL.md`, contradicts the verified absence findings. Mitigation: AC-7.1 asserts these stay byte-unchanged.

## Testing Strategy

- **Catalog freshness** — `bash tests/test-generated-agents-current.sh` passes after regen (the one automated gate).
- **Full suite** — `for t in tests/test-*.sh; do bash "$t" || echo "FAIL: $t"; done` stays green.
- **Manual inspection** — grep the `design-committee/` + `spec-write/` trees for residual artifact-sense "decision-packet" / "Transitions to: none" / narrative-extraction language; confirm none survive except the legitimately-retained decision-communication-packet surface and change-log/history mentions. Confirm the Option-2 template carries all eight FAC fields as labeled sub-fields and a mandatory `## Dissent Record`.
- **Absence checks** — confirm no `CLAUDE.md`, no settings file, and `spec-architect/SKILL.md` changed.
- **Version bumps** — every skill/agent file with a behavior/contract change carries a bumped `version`.

## Constraints

- **Context-economy invariant** — the scribe stays bounded-input: it authors only from `verdict.md` + `consolidator-output.md` + `alignment-map.md`, never raw transcripts or the session thread. The Option-2 template must be fillable from those three alone.
- **Standalone invocability** — the committee must still convene from any context with no fabricated sprint state.
- **Output-surface split preserved** — the team-lead's locked decision-communication packet is distinct from the scribe's renamed artifact and stays locked.
- **Catalog freshness** — the `spec-write/SKILL.md` description edit regenerates + stages `skill-index.md` in the same commit.
- **Standalone-documentation-discipline** — no commit may leave Chester's docs describing two contradictory realities; this is why the work is one sprint with A→B ordering.
- **A→B intra-sprint ordering (hard gate)** — the Option-2 template's labeled sub-fields must exist before the FAC-contract table can name them; cluster A lands before cluster B.
- **Staging discipline** — stage explicitly by path; never `git add -A`/`.` (the tree carries unrelated `D`/`??` entries).
- **Version-bump rule** — bump `version` on any behavioral/contract change; not on typo-only edits.

## Non-Goals

- **Not** changing the committee's deliberation mechanics, member protocol, peer-DM, routing-signal schema, the consolidator/scribe dispatch model, or the locked decision-communication packet surface.
- **Not** building or migrating any consumer of the committee beyond `spec-write`'s read path; nothing in `plan-build`, `execute-*`, or the finish skills changes.
- **Not** adopting a shared template with `design-small-task`.
- **Not** retro-applying the new template to *this* sprint's own committee output — these verdicts were authored under the old verdict-packet format and `spec-write` extracted them via the current path; the new path applies to future committee runs.
- **Not** resolving the stale feature-definition brief (`docs/feature-definition/Pending/design-committee-answer-delivery-extension-00.md`) in-sprint — deferred to a post-sprint record-keeping pass (leave a one-line breadcrumb so it is not lost).

## Acceptance Criteria

### AC-1.1 — Option-2 template replaces the verdict packet

**Observable boundary:**
- `artifact-template.md` opened → section structure is committee-native (Verdict / Rationale / Dissent Record / Deferred), not the eight FAC fields as headers.
- The template's labeled sub-fields collectively cover all eight FAC fields (Goal, Chosen architecture, Rejected alternatives + sacrifices, Prior-art findings, Ground-truth facts, Constraints, Acceptance-criteria seeds, Deferred/non-goals).

**Given:** the current five-section verdict-packet template
**When:** cluster A authoring completes
**Then:** the template is the Option-2 complete-design document with all eight fields present as labeled content and a mandatory `## Dissent Record`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — Dissent Record stays mandatory

**Observable boundary:**
- The template marks `## Dissent Record` as required regardless of alignment (including unanimous).

**Given:** the Option-2 template
**When:** a scribe authors from it
**Then:** the Dissent Record section is always present

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — Scribe artifact-type framing updated

**Observable boundary:**
- `design-committee-scribe.md` describes its output as the committee complete-design document, with no artifact-sense "decision-packet" language.

**Given:** the scribe agent file naming a decision-packet
**When:** cluster A authoring completes
**Then:** it names the complete-design document and carries a bumped version

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.2 — Scribe may populate structured sub-fields

**Observable boundary:**
- The scribe's "do not expand" instruction is lifted or rewritten so populating labeled sub-fields from the bounded inputs is permitted.
- The "no design opinion / write what the verdict says" prohibition still present in a compatible form.

**Given:** the current "do not expand" instruction that would under-populate the template
**When:** cluster A authoring completes
**Then:** the scribe is permitted to fill structured sub-fields without violating the bounded-input / no-opinion constraints

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — team-lead.md artifact-renamed; locked surface preserved

**Observable boundary:**
- Artifact-sense "decision-packet" references in `team-lead.md` (Per-Round Flow step 6, Closure step 1, the scribe-artifact mention) name the complete-design document.
- The **decision-communication packet** surface (Output Surfaces, Information Packet Format, Dispatch Voice "packet voice" ~line 331) remains present and is disambiguated, not removed.
- The "end-of-turn session artifact" is described as taking the Option-2 template format.

**Given:** team-lead.md using "decision packet" in both the artifact and surface senses
**When:** cluster A authoring completes
**Then:** the artifact references are renamed, the locked surface survives and is disambiguated, version bumped

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.2 — round-format updated + filename placeholder fixed

**Observable boundary:**
- `committee-analysis-round-format.md` describes the scribe artifact in Option-2 structure (no stale five-section enumeration, no artifact-sense "decision-packet" term).
- The folder-shape tree's `<decision-packet>.md` placeholder (~line 58) is renamed to the new artifact convention.

**Given:** round-format.md naming a decision-packet and its filename placeholder
**When:** cluster A authoring completes
**Then:** both the prose and the tree reflect the complete-design document; version bumped

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — D9 explicitly reversed in the FAC contract

**Observable boundary:**
- `fac-complete-design-contract.md` contains an explicit D9-reversal statement (not a silent overwrite) explaining why the committee was elevated to producing a structured document.
- The "Committee verdict source" table column names the Option-2 labeled fields.
- The extraction framing and quote-back rationale reflect reading labeled fields rather than mining narrative.

**Given:** the contract's "typed bundle rejected as primary (D9)" rationale
**When:** cluster B authoring completes
**Then:** D9 is named as reversed, the table references Option-2 labels, and the framing is structured-read

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — Committee declares its transition to specify

**Observable boundary:**
- `design-committee/SKILL.md` `Transitions to:` names the specify path (`spec-write` → `spec-harden` → `plan-build`), no longer "none — standalone consultation".
- The scribe line no longer uses the artifact-sense "decision-packet".
- The frontmatter description is unchanged (no catalog regen from this file).

**Given:** the committee SKILL declaring no transition
**When:** cluster B authoring completes
**Then:** it declares the committee→specify transition; version bumped; description untouched

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.2 — spec-write reads structured fields for the committee path

**Observable boundary:**
- `spec-write/SKILL.md` body + description describe reading the committee's labeled design-document fields, not extracting from a narrative verdict; "committee verdict" → "committee complete-design document" where it names the producer output.

**Given:** spec-write describing narrative extraction for the committee path
**When:** cluster B authoring completes
**Then:** it describes a structured-field read; version bumped; description edit recorded as the catalog-regen trigger

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.1 — Catalog regenerated and fresh

**Observable boundary:**
- After the `spec-write/SKILL.md` description edit, `skill-index.md` is regenerated via `bin/chester-generate-agents`.
- `bash tests/test-generated-agents-current.sh` passes; the regenerated index is staged in the same commit as its triggering description edit.

**Given:** the `spec-write/SKILL.md` description edit (the one confirmed trigger)
**When:** the catalog is regenerated
**Then:** the freshness test passes and no hand-edit diverges from the generator output

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-7.1 — Verified-clean files stay unchanged

**Observable boundary:**
- No `CLAUDE.md` file, neither settings file, and `spec-architect/SKILL.md` appear in the sprint diff.

**Given:** the absence findings from round02
**When:** the sprint completes
**Then:** those files are byte-unchanged in the diff

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-7.2 — No stale artifact-sense terminology survives (locked surface excepted)

**Observable boundary:**
- Grep of the `design-committee/` + `spec-write/` trees finds no surviving **artifact-sense** "decision-packet" / "Transitions to: none" / narrative-extraction language describing current behavior.
- The **decision-communication packet** surface term is the intended survivor and is explicitly excluded from the purge; change-log/history mentions excepted.
- Minor terminology files (`spec-harden/SKILL.md`, the five role agent files, `docs/instructions.md`, `skill-contract.md` line 40) updated.

**Given:** the full enumerated surface and the two-sense terminology
**When:** the sprint completes
**Then:** artifact-sense terms are gone, the locked-surface term remains, and no current-state description contradicts the new design

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-8.1 — Every changed skill/agent with a behavior change carries a version bump

**Observable boundary:**
- Each behavior/contract-changed file (`artifact-template.md`'s owning skill `design-committee`, `design-committee-scribe.md`, `team-lead.md`, `committee-analysis-round-format.md`, `fac-complete-design-contract.md`'s owning skill `spec-write`, `spec-write/SKILL.md`, `design-committee/SKILL.md`) has a bumped `version` relative to its pre-sprint value.
- `spec-harden/SKILL.md` is intentionally exempt — terminology-only edit, no behavior change.

**Given:** the change set
**When:** the sprint completes
**Then:** no behavior change ships without a version bump (typo/term-only edits exempt)

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-06-17T15:22:12Z -->
<!-- produced-by spec-write@v0001 -->
