# Committee complete-design template — reverse the earlier deferral

**Date:** 2026-06-17

**Sprint:** 20260617-01-codify-committee-design

**Source:** verdict from `committee/round01/verdict.md`; member positions from `committee/round01/consolidator-output.md`

---

## Summary

The committee was asked whether the design-committee skill should produce a complete-design document — one that satisfies all eight design fields the spec stage consumes — rather than the verdict-only packet the earlier deferral left in place. The verdict is to reverse that deferral: the committee will have its own complete-design template, distinct from the six-section brief used elsewhere, with the mandatory Dissent Record preserved and the scribe's bounded inputs unchanged. One sub-question remains open for the designer: whether the eight design fields appear as the template's section headers or as labeled content inside the committee's own native sections. The committee leans toward the latter.

## Verdict

Reverse the earlier deferral and give `design-committee` its own committee-specific complete-design template — distinct from `design-small-task`'s six-section brief, with the mandatory Dissent Record preserved and the scribe's bounded inputs (`verdict.md` + `consolidator-output.md` + `alignment-map.md`) unchanged — and have that template satisfy all eight design fields the spec stage consumes as labeled, structured content so `spec-write` extracts rather than mines; the one open decision for the designer is whether those eight fields appear as the template's section headers (Conservator, Pragmatist) or as labeled sub-fields inside committee-native sections (Verdict / Rationale / Dissent Record / Deferred — Purist explicit, Innovator adjacent), with the committee's warranted lean toward the latter.

## Rationale

All four advocacy members agreed that the earlier deferral should be reversed. The deferral had kept the committee on a verdict-only packet on the grounds that a typed extraction bundle would bifurcate template maintenance. That premise was falsified by the contract governing the spec stage: that contract defines eight fields to extract from two structurally different producer shapes already, meaning bifurcation was present before this template question was raised. More critically, the contract itself acknowledged that silent mis-extraction from a narrative verdict is the one failure that structural hardening cannot catch — the quote-back is the only guard. Leaving the committee on a verdict-only packet while the spec stage was expected to mine design intent from narrative Rationale was the source of the gap, and the deferral had flagged itself as provisional.

The option of using the same template as the six-section design brief was considered and rejected unanimously. The Dissent Record has no analog in that brief. A shared format either drops the Dissent Record — removing the mechanism by which minority risk survives a non-unanimous verdict — or imports committee machinery into a simple artifact. The designer's leaning toward a shared format was tested under an adversarial framing and did not survive it.

On document shape, the committee split. Two members framed their support as mirroring the eight fields as section headers, which would make the template's structure identical to the extraction contract. Two members argued that imposing the eight fields as headers forces the scribe to scatter committee-native content across extraction-slot buckets, introducing a new translation layer precisely where the current gap lives. The latter group's position went unrefuted on the correctness dimension. However, the header approach carries a genuine extraction-convenience trade-off that belongs to the designer, so the sub-question is surfaced rather than decided.

The scribe's bounded inputs are unchanged. The three documents the scribe already reads — verdict, consolidator output, and alignment map — already contain the material needed to populate all eight design fields. No new inputs are required regardless of which document shape the designer chooses.

## Dissent Record

**Alignment:** 4-0 on the core decision (reverse the earlier deferral; committee-specific template; preserve the Dissent Record; preserve scribe bounded inputs). Internal split 2-2 on document shape sub-question.

**Core decision — dissenting positions:** None — all four advocacy members aligned. Researcher holds no advocacy position.

**Document shape sub-question — split positions:**

- Conservator: leans toward the eight fields as section headers (mirror structure) — did not engage the correctness argument against header structure directly.
  - blocking_risk: not recorded; Conservator did not file a blocking risk on the shape sub-question.

- Pragmatist: leans toward the eight fields as section headers (mirror structure) — judges ship cost low and scribe inputs already sufficient; did not raise the shape sub-question independently.
  - blocking_risk: not recorded; Pragmatist did not file a blocking risk on the shape sub-question.

- Purist: leans toward committee-native sections with labeled sub-fields satisfying the eight fields as content — the correctness argument (headers impose a translation layer where the gap already lives) was filed explicitly and went unrefuted.
  - blocking_risk: not recorded as a blocking risk; position is the basis for the committee's lean, not a block on the core.

- Innovator: adjacent to Purist — prefers structured sub-fields within a revised Verdict section rather than a wholly new template shape; did not file a separate blocking risk.
  - blocking_risk: not recorded.

## Deferred / Open

**Open for designer decision — document shape (Option 3 vs Option 4):**

- Option 3: The template's section headers are the eight design fields the spec stage consumes. The committee's native content (alignment summary, deliberation warrant, dissent record) is organized under those headers.
- Option 4: The template keeps committee-native section headers (Verdict / Rationale / Dissent Record / Deferred). The eight design fields appear as labeled, structured sub-fields inside those sections so all eight are present and extractable without becoming the top-level structure.

The committee leans toward Option 4. The lean is warranted by the correctness argument (Option 3 scatters committee-native content across extraction slots, adding a translation layer where the gap currently lives) and is unrefuted. It is not a collapse — the extraction-convenience dimension of Option 3 is a real designer trade-off.

---

<!-- produced-by: scribe / round01 / 2026-06-17 -->

<!-- created-at: 2026-06-17T15:13:19Z -->
<!-- produced-by design-committee@v0023 -->
