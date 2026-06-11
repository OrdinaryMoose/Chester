# Researcher — ground-truth findings — round02
# Sprint: 20260611-01-compact-committee-skill

Ground truth for Task 6 (team-lead.md) and Task 7 (committee-analysis-round-format.md + SKILL.md:122).
Verbatim quotes and actual line numbers reported below.

---

## Task 6 — team-lead.md

File: `skills/design-committee/references/team-lead.md`

### §Behavioral Constraints — warrant bullets (actual lines 121–124)

Line 121:
```
- Each round's terminal object is the **most-informative answer** to the designer's question, not a menu of options. Choose the answer shape that loses the least information: **converged** (one warranted position), **preserved-split** (two or more warranted positions kept side by side with each side's rationale), or **partial** (answer plus named gaps). Collapse to a single position only when a warrant defeats the alternatives; collapse is never required, and a preserved split is a valid and sometimes-superior answer.
```

Line 122 (not a standalone bullet — part of line 121's block; the next independent bullet is):
Line 122 (actual file line):
```
- **Count is not a warrant.** Alignment count never licenses collapse. A 3-1 does not collapse to the majority on the strength of the count; a warranted minority survives as a preserved split.
```

Line 123:
```
- **Strict premise scope.** A designer premise warrants conclusions only within the exact scope the designer granted it. The team-lead never widens a premise; a question the granted premises do not cover becomes a new gap, never an inference. Only the designer may widen scope.
```

Line 124:
```
- **Above-threshold gap trichotomy.** A tension below the designer's significance threshold is not a gap — drop it, do not surface it. An above-threshold gap is either resolved by the designer or preserved as a split. Factual gaps route to the researcher; value gaps route to the designer.
```

Note: The plan's cited "~121-124" maps accurately to actual lines 121-124. Line 121 carries the converged/preserved-split/partial enumeration and the warrant-defeats-alternatives sentence. Line 122 is the "Count is not a warrant" bullet. Line 123 is "Strict premise scope". Line 124 is "Above-threshold gap trichotomy".

### §Self-Evaluation Authority-Guard bullets (actual lines 343–345)

Line 343:
```
- **Authority Guard — warrant coverage.** Does every answer-body assertion trace to a member-supplied warrant (evidence / logic / in-scope designer-premise), verified from the member's `## Final Position`? Any assertion lacking a verifiable member-supplied warrant → demote it to a gap; do not supply a warrant on the member's behalf.
```

Line 344:
```
- **Authority Guard — count is not a warrant.** Did I let an alignment count stand in for a warrant? Yes → restore the warranted minority as a preserved split.
```

Line 345:
```
- **Authority Guard — strict premise scope.** Did I extend a designer premise past its granted scope? Yes → withdraw the over-extension and surface the uncovered question as a new gap.
```

Plan cited "~343-345" maps accurately to actual lines 343-345.

### Steps 6 and 7 (Per-Round Flow) — actual lines 106–107

Line 106 (Step 6 — Synthesize):
```
6. **Synthesize** — apply risk-weighted judgment (§ Internal Discipline / Consolidation Rules) downstream of the enumerated baseline, and write `committee/roundNN/alignment-map.md`: the alignment pattern + the full option set + the positions-discarded-with-reason, plus the **answer-shape marker** (converged / preserved-split / partial) and, for every answer-body assertion, its **warrant** (evidence / logic / in-scope designer-premise) or its demotion to a gap. Then **evict** the alignment map from context — drop it from context; it is no longer needed in context, disk is the source of truth. *(Two-round mode only:* feed the alignment map back to the members; each member gets one revision pass; return to the Consolidator step (step 4) to consolidate a second round before converging.)
```

Line 107 (Step 7 — Converge):
```
7. **Converge** — read `committee/roundNN/alignment-map.md`, then write `committee/roundNN/verdict.md`: the team-lead's risk-weighted answer, specific and one-sentence-minimum (an ambiguous verdict cannot proceed), carrying the same answer-shape marker and warrant record so the warrants are auditable on disk, not held only in context. Then **evict** it from context.
```

Plan's cited "~105-106" actually maps to **actual lines 106-107** (off by one in the plan — minor drift).

**KEY FACTUAL ANSWER — warrant-policy-definition mixed into steps 6+7?**

YES. Steps 6 and 7 contain warrant-policy-definition sentences mixed INTO the disk-write instructions:

- Step 6 (line 106): "...and, for every answer-body assertion, its **warrant** (evidence / logic / in-scope designer-premise) or its demotion to a gap." — this is a warrant-policy statement embedded in the Synthesize step's write instruction for alignment-map.md.
- Step 7 (line 107): "...carrying the same answer-shape marker and warrant record so the warrants are auditable on disk, not held only in context." — this restates the warrant policy (warrant record must be on disk) embedded in the Converge step's write instruction for verdict.md.

The plan's assumption that "policy restatement may be mixed in" is CONFIRMED. Both steps carry warrant-policy sentences embedded in the mechanism (write-to-disk) instructions, not isolated in a policy section.

### §Authority Guard owner — actual lines 320–326

Line 320:
```
**Authority Guard.** The team-lead holds no design opinion, yet it authors the answer. These rules keep it honest:
```

Line 322:
```
- **Warrant test.** Every answer-body assertion must carry a warrant — evidence, logic, or an in-scope designer-premise. The warrant is **supplied by the member** in its `## Final Position`; the team-lead **verifies** it — the type fits the claim and the source is traceable — rather than originating it. An assertion whose member-supplied warrant cannot be verified, or whose member supplied none, is demoted to a gap. The team-lead does not originate a warrant on the member's behalf; it reads member warrants from the on-disk `## Final Position` on demand.
```

Line 323:
```
- **Count-not-a-warrant.** Alignment count is never a warrant. A majority does not license collapse; a warranted minority survives as a preserved split.
```

Line 324:
```
- **C2 firewall.** The Information Package and Decision Package carry warranted assertions only. Opinion lives solely in the fenced, `Opinion:`-marked Recommendation block — never in the fact or option surfaces.
```

Line 325:
```
- **C1 audit.** Any collapse of a split must display its warrant in the packet, so the designer can inspect and overturn a wrong inference.
```

Line 326:
```
- **Warrants on disk.** The member-sourced warrant record and the answer-shape marker are written into the team-lead's own `committee/roundNN/alignment-map.md` and `committee/roundNN/verdict.md` — auditable on disk, not held only in context. No new artifact file is introduced; the warrants ride the existing team-lead-owned artifacts.
```

Note: Line 321 is blank; the plan's cited "~320-326" spans actual lines 320-326, accurate.

### Warrant occurrence count

`grep -c "warrant"` returns **16** line-occurrences (note: some long lines contain "warrant" multiple times; 16 is the count of lines, not total token occurrences).

Lines containing "warrant": 106, 107, 115, 122, 123, 124, 205, 318, 322, 323, 324, 325, 326, 342, 343, 344.

Total distinct lines: **16**.

---

## Task 7 — committee-analysis-round-format.md + SKILL.md

### committee-analysis-round-format.md — actual lines 104–110

File: `skills/design-committee/references/committee-analysis-round-format.md`

Lines 104–110 (verbatim):

```
- **Answer shape + warrants on disk.** `alignment-map.md` and `verdict.md` carry an answer-shape
  marker (converged / preserved-split / partial) and a warrant record for the answer body. These
  ride the existing team-lead artifacts — no new per-round file is introduced. This is the
  committee's **output-surface split**: the scribe's designer-facing decision-packet has a locked
  format; the team-lead's on-disk answer record does not. (This output-surface split is a distinct
  concept from the "two-surface" usage in sprint `20260521-02-design-architect-committee` — do not
  conflate the two terms.)
```

**Does the disambiguation clause re sprint "20260521-02" exist?** YES — it appears verbatim at lines 109-110:

Line 109:
```
  concept from the "two-surface" usage in sprint `20260521-02-design-architect-committee` — do not
```

Line 110:
```
  conflate the two terms.)
```

**Definition-restatement vs disambiguation boundary:**

- Lines 104-108 are the definition restatement: defines "output-surface split" (scribe's decision-packet has locked format; team-lead's on-disk answer record does not).
- Lines 109-110 are the disambiguation clause: "This output-surface split is a distinct concept from the 'two-surface' usage in sprint `20260521-02-design-architect-committee` — do not conflate the two terms."

The boundary falls between line 108 (end of ". This is the committee's **output-surface split**: ...does not.") and line 109 (opening of the disambiguation parenthetical).

### SKILL.md line 122 — does it carry §Output Surfaces cite?

File: `skills/design-committee/SKILL.md`

Line 122 (verbatim):
```
Advocacy members and the researcher are roster-only — see § Dispatch Discipline.
```

**Does it carry the §Output Surfaces cite?** NO. Line 122 of SKILL.md is the roster-only dispatch rule referencing "§ Dispatch Discipline". It contains NO reference to §Output Surfaces.

The §Output Surfaces cite IS present, but at line 139 (Step 7 of Per-Round Flow):
```
7. **Author** — the team-lead dispatches the ephemeral scribe with the verdict, the artifact-template path, the consolidator output, and the alignment map; the scribe writes the round's designer-facing decision-packet. The decision-packet is the committee's **decision-communication packet** — a locked format used only when seeking a designer decision; the round's answer itself (the end-of-turn session artifact) has no mandated format. This is the **output-surface split** (§ `references/team-lead.md` Output Surfaces).
```

So SKILL.md line 139 already carries the §Output Surfaces cite, but line 122 does not. The plan may have cited the wrong line number for this check.

### Line-number drift summary

| Plan citation | Actual line(s) | Notes |
|---|---|---|
| team-lead.md ~121-124 (Behavioral Constraints warrant bullets) | 121-124 | Accurate |
| team-lead.md ~343-345 (Self-Eval Authority-Guard bullets) | 343-345 | Accurate |
| team-lead.md ~105-106 (steps 6+7) | 106-107 | Off by one |
| team-lead.md ~320-326 (Authority Guard) | 320-326 | Accurate |
| committee-analysis-round-format.md ~104-110 | 104-110 | Accurate |
| SKILL.md:122 | 122 = roster-only dispatch rule, NOT §Output Surfaces | Wrong site; §Output Surfaces cite is at SKILL.md:139 |

## Final Position

position: no design opinion — researcher role holds no advocacy.
blocking_risk: none — research role holds no advocacy.
