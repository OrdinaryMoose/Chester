# Home for the Per-Round Flow: SKILL.md vs team-lead.md

**Date:** 2026-06-13

**Sprint:** 20260613-01-review-design-committee

**Source:** verdict from `committee/round02/verdict.md`; member positions from `committee/round02/consolidator-output.md`

---

## Summary

The committee was asked to decide, on functional merit alone with floor and canonical-authority rules set aside, where the design-committee per-round flow should live: in SKILL.md (the convene-time document the orchestrator reads) or in team-lead.md (the runtime document the team-lead executor reads). The result is a genuine 2-2 preserved split. The two sides optimize different functional goods — sequence cohesion and convene-overview on one side, execution locality on the other — and the committee cannot resolve that value judgment on the members' behalf. The designer must settle it. The team-lead holds a narrow lean toward Side A but records it as opinion, not resolution. Regardless of how the split resolves, all four members agree that the 11-step inflation in team-lead.md should be removed.

## Verdict

Decided on functional merit alone — with the floor/canonical prescriptions set aside — the committee splits 2-2 and the split is the answer: there is a genuine value-judgment underneath that the designer should settle, not the team-lead.

- **Side A (Conservator, Purist): the per-round flow lives whole in SKILL.md.** The sequence is one causally-coupled artifact (the step 3 routing signal triggers step 4 dispatch), the orchestrator reads SKILL.md at convene and needs the whole-round overview there anyway, and team-lead.md's ordered named elaboration already serves the executor without a rival integer list.
- **Side B (Innovator, Pragmatist): the numbered sequence lives in team-lead.md.** The team-lead is the sole agent that runs the round and reads team-lead.md at runtime; the operating checklist belongs where its executor looks. Innovator adds the integrative refinement: team-lead.md owns the executable checklist, SKILL.md keeps a non-numbered high-altitude description for the convene reader.

## Rationale

The split is real and value-laden: both sides agree on the reader-model facts and disagree on which reader-moment the numbered artifact should serve.

Side A grounds its position in two claims. First, the calling agent reads SKILL.md before team-lead.md at convene; no participant class gains read-path coverage by moving the sequence to team-lead.md. Second, the per-round flow is one causally coupled sequence: the step 3 routing signal triggers the step 4 dispatch, and split placement converts that internal handoff into an unenforced cross-file dependency with silent drift risk. The sequence belongs in one home, and the convene-read document is that home.

Side B grounds its position in execution locus. The team-lead is the sole runtime executor and reads team-lead.md during execution, not SKILL.md. Placing the numbered canonical sequence in the document the executor does not consult at runtime creates a guaranteed bounce on every invocation. Steps 1–3 are already functionally owned by member-protocol; the contested artifact is the team-lead-side execution sequence, which belongs where its reader operates. Innovator adds a two-altitude variant: team-lead.md owns the executable 8-step checklist; SKILL.md carries a prose, non-numbered high-altitude description for the orchestrator's convene-read. This removes the rival-numbering drift concern because only one numbered artifact exists.

The team-lead's narrow opinion is that Side A is the stronger functional answer. SKILL.md must carry a whole-round overview for the orchestrator regardless of this decision, so it is already the natural home for the full sequence — making it the numbered owner adds nothing extra. Side B's runtime-bounce concern is smaller than stated because team-lead.md's ordered, named-step elaboration is itself a runtime-complete reference; the integers are labels, not the procedure. If the designer weights execution locality over cohesion, Innovator's two-altitude variant is the cleanest expression of Side B and should be preferred over Pragmatist's stricter position.

All four members agree on one point independent of the split: the 11-step inflation in team-lead.md is wrong. The three phantom entries (ledger, checkpoint, designer-response) should be relocated to their existing sections. No external file cites either step list; migration cost is zero.

## Dissent Record

**Alignment:** 2-2 split (preserved)

**Side A — SKILL.md owns the canonical numbered sequence:**
- Conservator: SKILL.md owns the numbered per-round sequence; team-lead.md elaborates by step name with no rival integer list — blocking risk: moving to team-lead.md couples future wrapping skills to the executor's internal file.
- Purist: SKILL.md owns the single canonical numbered sequence (8 steps); team-lead.md elaborates steps 4–8 by step name only, no parallel numbering; member-protocol.md already covers member obligations and needs no sequence steps added — blocking risk: medium-forward — materializes when the first wrapping skill anchors to a numbering.

**Side B — team-lead.md owns the numbered executor sequence:**
- Innovator: team-lead.md owns the execution checklist (8 ordered steps, team-lead runtime reader); SKILL.md retains a high-altitude structural description of the same round (orchestrator/convene reader); these serve different readers at different moments, not rivals — blocking risk: low — contained edit, no reader reads both files for the same purpose at the same moment.
- Pragmatist: Option B — team-lead.md owns the full numbered executor sequence; SKILL.md carries the eight named phases as a conceptual map (no integers); revised from R1 on functional grounds — blocking risk: low — no external citations, pure internal fix.

## Deferred / Open

- The designer must resolve the core value judgment: which reader-moment does the canonical numbered sequence primarily serve — convene-time structural read (Side A) or runtime step-by-step execution (Side B)?
- If Side B is chosen, the designer should indicate whether Innovator's two-altitude variant (checklist in team-lead.md, prose overview in SKILL.md) is preferred over Pragmatist's stricter position.

---
