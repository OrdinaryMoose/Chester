# Pragmatist — Round 03 Transcript

**Question (reframe):** Designer proposes splitting design-specify into spec-build (writes the spec) + spec-harden (controls the subagent reviews). This dissolves CF1's category objection and enables committee to author the spec directly, passing it to spec-harden. Readdress: does the composability gain justify the split cost vs. Round 02's Path B (conditional entry, wrapping skill, near-zero cost)?

**Lens:** Pragmatist — count the cost concretely. Defend simplest sufficient.

---

## Counting the Split Cost

A skill split from one working skill into two is not free. The concrete cost:

**New artifacts required:**
- `skills/spec-build/SKILL.md` — full skill file with entry condition, checklist, process flow, integration section, MCP usage, competing-architectures step, spec-writing procedure, provenance trailer discipline, standalone invocation path.
- `skills/spec-harden/SKILL.md` — full skill file covering the three-pass chain (fidelity subagent, adversarial inline/subagent, ground-truth subagent), user review gate, post-approval transition, version-bump discipline, re-run scope at user request.
- New seam contract between the two: what does spec-harden's entry condition require? A file path to an authored spec? A provenance trailer? A design brief path alongside it? Every caller of the combined skill today must now satisfy the two-skill contract, not one.

**Callers that reference design-specify by name (from grep):**
- `design-small-task/SKILL.md` — "Transitions to: design-specify" (description + step 5 + integration section: 3 sites)
- `design-small-task/references/design-brief-small-template.md` — transition reference
- `plan-build/SKILL.md` — "Invoked by: design-specify (primary)" + three inline references to design-specify cascade behavior
- `util-artifact-schema/SKILL.md` — artifact naming references
- `execute-write/SKILL.md` — reference to upstream skill chain
- `design-committee/SKILL.md` — exclusion rule: "Do NOT convene when other skill owns planning: design-small-task, design-specify"
- `finish-write-records/references/record-formats.md` — provenance references
- `setup-start/references/skill-index.md` — catalog entry

That is at minimum 8 files with edit surface, many with multiple sites each. A conservative estimate: 15–20 individual edit points across the skill tree just to rename and re-route callers. This is the migration cost the designer's proposal carries.

**The seam risk:** spec-build exits with a spec file; spec-harden enters with a spec file and (optionally) a design brief. The seam is simple in the happy path. But: what happens when spec-harden's fidelity review finds so many issues that fidelity confidence is shaken? Today design-specify escalates to the user with the reviewer report and asks to revisit the architecture choice — a loop that reaches back into spec-build territory. After the split, that escalation path crosses the skill boundary. The split introduces a cross-skill escalation loop that today is a same-skill internal branch.

---

## What Does the Split Buy?

The composability claim: committee (or any author) can write a spec using spec-build's template and hand it to spec-harden standalone. spec-harden becomes reusable independent of the authoring source.

Let me test whether spec-harden reuse is real or theoretical.

**Who would call spec-harden standalone today?**
- A human who writes a spec manually and wants it hardened — but design-specify already supports this (standalone invocation path: "A design described in conversation context"). No gap today.
- The committee, if given spec-authoring responsibility — but CF1 holds (4-0 across two rounds). Committee should not author specs, per all members including Innovator in round01. The designer's round-03 proposal opens this door, but the committee itself has no spec-authoring step, no spec-writing prompt, no spec-template coupling.
- A wrapping skill — but this is exactly Path B from round02. The wrapping skill can invoke design-specify directly, skipping the front half via conditional entry (CF3 mechanism). No split needed for this.

The composability benefit reduces to: "spec-harden can be called by future callers who author specs outside design-specify's flow." But design-specify already handles that today via its standalone invocation path. The split creates a new call surface that solves a problem that does not currently exist.

---

## Path B vs. The Split: Same Token-Waste Win?

Round 02 CF3 converged on a conditional entry path in design-specify — Path B. When committee has settled architecture, design-specify skips its front half and goes directly to spec authorship + hardening. Token waste eliminated.

Does the split achieve the same win? Yes — if committee writes the spec (spec-build) and spec-harden receives it, the front half is bypassed structurally (it lives in spec-build, which the committee step replaces). But this requires committee to author a spec, which CF1 says it should not. The split only achieves the same win as Path B if it simultaneously reverses CF1.

Under Path B (wrapping skill + conditional entry, no split, CF1 preserved): the committee settles architecture, the wrapping skill passes the settled architecture into design-specify, design-specify skips its front half and writes the spec itself. Token waste: zero. CF1: preserved. Split cost: zero.

Under the split (spec-build + spec-harden, committee authors spec): the committee settles architecture AND writes the spec using spec-build's template. spec-harden receives the spec and runs the three-pass chain. Token waste: zero. CF1: reversed. Split cost: 8+ files, 15-20 edit points, seam risk, cross-skill escalation loop.

**For the same token-waste outcome, the split costs 15-20x more edit surface and introduces a cross-skill seam that Path B does not.** The only thing the split buys that Path B does not is: committee-authored specs. But CF1 says committee should not author specs (4-0, both rounds). The split's marginal gain is contingent on reversing CF1 — and CFI was not reversed by the designer's premise, only questioned.

---

## Where Is the Break-Even?

The split makes sense if and only if spec-harden reuse (by callers other than spec-build) is a real near-term requirement, not a theoretical future possibility.

Concrete break-even test: if there are two or more near-term use cases where something other than design-specify's own authoring step produces a spec that needs hardening, the split pays for itself. Currently I count zero confirmed near-term cases — the only new case the designer's proposal creates is committee-authored specs, which depends on reversing CF1.

If CF1 is reversed (designer explicitly authorizes committee to write specs), the split becomes load-bearing: the committee needs a clean spec-authoring surface (spec-build) separate from the hardening chain (spec-harden). But that decision belongs to the designer, not to this round. If CF1 holds, the split is premature optimization.

---

## Final Position

**Position:** The split is over-engineering unless CF1 is explicitly reversed. Round 02 Path B (conditional entry in design-specify via wrapping skill + architecture-settled flag) achieves the same token-waste elimination at near-zero edit surface. The split costs 8+ file edits, 15-20 edit points, a cross-skill seam, and a cross-skill escalation loop — for a composability gain (spec-harden standalone reuse) that has zero confirmed callers today beyond what design-specify's existing standalone invocation already handles. Break-even requires CF1 reversal AND a concrete near-term caller for spec-harden that is not design-specify itself.

**Rationale:** Same win (skip design-specify front half), 15-20x cheaper surface (Path B vs. split). Shipping cost is first-class. The composability value is real but theoretical; Path B delivers the agreed-upon fix without it.

**Blocking risk:** If the designer intends to reverse CF1 (authorize committee to write specs), the split is the right mechanism and Path B becomes the wrong answer. The round-03 premise opens that door but does not walk through it. Clarification needed before committing to Path B.

**Warrant:** {type: evidence + logic, source: "grep of design-specify callers (8 files, 15-20 edit points); design-specify SKILL.md standalone invocation path (existing reuse surface); round02 alignment-map.md CF3 (Path B already converged 4-0); round01 alignment-map.md CF1 (committee should not author specs, 4-0, preserved through round02)"}
