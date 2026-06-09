# Pragmatist Transcript — Round 04

**Member:** Pragmatist
**Round:** 04
**Question:** Given members are OUT and reviewer disciplines are mostly per-consumer, what should the corrected spec commit the generator to producing — catalog-only, or catalog plus a narrowed reviewer-discipline fold — and accordingly which ACs drop, reduce, or stay?

---

## Reading the Evidence

### What is already built and green

- `emit_catalog` — committed, tested by `tests/test-generate-catalog.sh`, T1+T2 green.
- `emit_agent` + `extract_section` — committed, wired into the MODE dispatch, tested (29 tests green per ground truth).
- Generator supports `--catalog-only`, `--agents-only`, `--root`, `--output-dir`.

The cost basis for "strip agent-mode" is ~20min + one commit. The cost basis for "keep agent-mode" is zero additional implementation cost — it's already built and tested.

The YAGNI call therefore is not "should we build it" — it's "should we keep it and commit the spec to covering it, or strip it to narrow surface area."

### Members: settled, no cost basis remains

Decision D: members OUT. AC-2.1 is dead. No `agents/sources/member-scaffold.md`, no `lens-*.md`, no Stance-extraction fragment. The spec's AC-2.1 must be dropped wholesale — it commits to an artifact class (4 member agents generated from scaffold+lens) that will not exist.

### Reviewer disciplines: what the diff actually shows

Ground truth from the question packet, confirmed by reading the files:

- `execute-write-spec-reviewer.md:66-73` vs `execute-write-quality-reviewer.md:69-77`: the confidence ladder is 4-tier text, but the rationale for each tier differs between the two ("impacts spec compliance" vs "will impact functionality or quality"), the threshold wording differs ("filters noise so the orchestrator focuses on findings you've actually verified against the code and spec" vs "Fewer high-confidence findings are far more useful than a long list of maybes"), and the output format sections are completely different. Near-zero shared text.
- `plan-build-plan-attacker.md:72-78` vs `plan-build-plan-smeller.md:62-69`: both carry an Evidence Standard section, but attacker's covers "file path, line number, or concrete code reference / what the gap is" and smeller's covers "the specific plan section, proposed construct, or existing file / what the smell is". Only the meta-rule ("If you cannot point to evidence, drop the finding") is shared phrasing.
- Generator appends whole `##`-sections; cannot splice a fragment mid-section. So confidence-ladder text cannot be folded into a shared fragment that the generator appends — the reviewer-specific rationale text is interspersed with the shared threshold.
- Evidence-citation opener phrasing is the one cleanly extractable convergence (plan-attacker vs plan-smeller both have "If you cannot point to [codebase/concrete] evidence, drop the finding. This is the single most important rule."). This is a one-sentence diff, not a full section.

### Conclusion on reviewer single-sourcing via the generator

The generator as-built can emit a whole file from fragment concat. To single-source reviewer disciplines it would need to either:
1. Use whole-section fragments where the shared text IS a whole `##` section — but the confidence ladder is NOT a standalone section in the current files; it is embedded mid-file with reviewer-specific wording before and after.
2. Accept that only the evidence-citation opener can be extracted as a standalone fragment — a one-liner, not a full discipline body.

Option 2 is the only one structurally consistent with the generator. But a one-line fragment that reduces per-file drift by ~1 sentence is marginal benefit with ongoing manifest complexity: every reviewer needs a manifest entry, sources dir, per-reviewer `review-discipline.md`, and the verify test must track all 5 reviewer outputs.

### The AC-8.1 / plan-F4 contradiction

Spec AC-8.1 (`:193-195`): sanctions ONLY evidence-citation wording convergence. States "Any other discipline-text convergence is allowed only if enumerated here."

Plan-01 Task 4+7 adds confidence-ladder wording as a second enumerated convergence.

These are in direct conflict. One must win.

**Pragmatist resolution: drop plan-01's second convergence, NOT amend the spec.**

Reasoning: confidence-ladder text between spec-reviewer and quality-reviewer is not converged today — the rationale text differs per reviewer. Forcing convergence at authoring time means *changing* the reviewer content, which violates the spec's no-semantic-change mandate (or creates an enumerated exception for a semantic change, not just text relocation). Evidence-citation opener convergence is safe because the two attacker/smeller instances are near-identical and both express the same rule. Confidence-ladder convergence is NOT safe because the two spec-reviewer/quality-reviewer instances express the same rule structure with reviewer-specific rationale text. Folding them would require picking one version and applying it to both — that is semantic change.

Cost of plan-01's second convergence: adds a reviewer-sources file structure, two more manifest entries, a new canonical source for the confidence ladder, and the authoring burden of choosing which ladder variant is "canonical." Net benefit: reduces ~8 lines of near-similar-but-not-identical text. Not worth it.

---

## AC-by-AC Disposition

### AC-1.1 — Generator exists and is deterministic
**KEEP, narrow scope.**

The generator is built, green, deterministic. The AC is still valid for what survives. But the observable boundary needs updating: the generator now produces only the catalog (not 9 agent files). The Given/When/Then should reflect catalog-only as the default target. Determinism clause stays — it's still testable via double-run.

Shipping cost of narrowing: one spec-edit sentence. No code change.

### AC-2.1 — Member agents generated from scaffold + lens, shared bands single-sourced
**DROP entirely.**

Members are OUT per designer decision D. No member sources, no scaffold, no lens files. AC-2.1 describes artifacts that will not be built. Keeping it would commit the spec to dead deliverables that would fail the verify test (no manifest entries = completeness check would find 4 hand-authored member files with no manifest entry, or they'd have to be on the exclusion list — meaning the AC itself is unreachable as written).

Cost of keeping: misleads whoever reads the spec about what the sprint delivers.

### AC-3.1 — Reviewer agents generated, disciplines single-sourced
**DROP wholesale OR reduce to authoring-only (no generator involvement).**

Ground truth: reviewer disciplines are mostly per-consumer. The generator cannot splice mid-section. The only foldable convergence is the evidence-citation opener (~1 sentence). Running the full agent-mode machinery for one-sentence coverage is operational cost with marginal benefit.

The real benefit — no discipline drift — is better served by a documentation pointer in `agents/CLAUDE.md` that says "evidence standard canonical phrasing is attacker/smeller's Evidence Standard opener" than by running a generator, manifest entries, canonical source files, and a verify test across 5 reviewer agents.

If AC-3.1 is kept at all, it should be reduced to: reviewer agent files stay hand-authored; the evidence-citation opener phrasing is settled at authoring time (one canonical phrase written into both attacker/smeller); no generator involvement; no manifest entries for reviewer agents.

This means `emit_agent` + `extract_section` have zero spec-required callers.

**Option A (Pragmatist preferred): drop AC-3.1 entirely.** Generator = catalog-only. Reviewer single-sourcing = hand-authoring fix, not generator fix. Separate concern, separate commit, no machinery.

**Option B: reduce AC-3.1** to "reviewer evidence-citation opener is settled to one phrasing at authoring time; generator does NOT generate reviewer files." No manifest entries for reviewers. The one-sentence convergence is a grep check, not a diff gate.

Either way: `emit_agent` machinery in the generator is dead code if no manifest entries point to it.

### AC-4.1 — Catalog derived from frontmatter; phantom pointer fixed; missing skills present
**KEEP as-is.**

This is the surviving core value. `emit_catalog` is built, tested, green. The three missing skills and the phantom pointer are legitimate bugs fixed by the catalog. Observable boundary remains valid.

### AC-5.1 — Verify test is the regeneration trigger
**KEEP, narrow scope.**

Verify test (`tests/test-generated-agents-current.sh`) as described in the spec covers manifest outputs + completeness check. If agent-mode is stripped and no reviewer agents are manifest outputs, the verify test narrows to catalog output only. The completeness-check clause (glob `agents/*.md`, assert every file is manifest output or exclusion list) still makes sense — but with 0 generated agent files, the manifest-output set is empty and the entire agents/*.md population goes on the exclusion list. That makes the completeness check trivially true and useless.

**Revised scope:** verify test checks (a) catalog output is current, (b) catalog is deterministic (double-run), (c) any new `agents/*.md` file added that is neither manifest-output nor exclusion list trips the test. (c) is trivially satisfied if the exclusion list = all agents/*.md. So (c) has zero enforcement value if agent-mode is gone.

The verify test for catalog-only is simpler: regenerate catalog to temp, diff against committed, fail on mismatch. The completeness check collapses or disappears.

**Reduce AC-5.1**: narrow the observable boundary to catalog staleness only. Drop the agents-completeness clause (no manifest agent outputs to track).

### AC-6.1 — CLAUDE.md two-tier dedup with carve-out restored
**KEEP as-is.**

No dependency on members or reviewer generator. Pure authoring edit. Still valid and still valuable (the dropped carve-out is a real bug; the phantom setup-start/SKILL.md pointer is a real bug). Cost is near-zero; benefit is real.

### AC-7.1 — PM Litmus Test and Research Boundary have a canonical home
**KEEP as-is.**

No dependency on generator at all. Pure authoring edit to `util-design-partner-role/SKILL.md`. The duplication problem is real; the fix is two new sections + update citations. Unchanged by the members/reviewer outcome.

### AC-8.1 — No semantic change to generated agents
**KEEP, narrow scope to catalog + resolve contradiction.**

The no-semantic-change mandate makes sense for the catalog (the generated skill-index must match what skills currently describe — no drift). For agents that won't be generated, the clause is vacuously true, but keeping the principle is sound.

Narrow to: "the first generation of the catalog reproduces the current skill-index content (modulo the three missing skills now added and the phantom pointer fixed); no other catalog meaning changes."

Drop the enumerated convergences clause for reviewers (they won't be generated). This automatically resolves the AC-8.1/plan-F4 contradiction: by narrowing AC-8.1 to catalog-only, there are no reviewer-discipline convergences to enumerate or dispute. Plan-01's Convergence 2 (confidence-ladder wording) falls outside spec scope; it is not implemented.

---

## The Core Trade-off: Catalog-Only vs Keep Agent-Mode

### Catalog-only (strip `emit_agent`, `extract_section`)

- Cost: ~20min, one commit, tests/test-generate-catalog.sh already covers catalog path.
- Benefit: narrower surface area, generator does exactly one thing, no dead code.
- Risk: if reviewer single-sourcing via generator becomes desirable later, the machinery must be rebuilt. But the ground truth shows reviewer disciplines are mostly per-consumer — the need will likely never materialize for the reasons above.

### Keep agent-mode machinery (do nothing, leave dead code)

- Cost: zero additional implementation. Machinery is built, tested, green.
- Risk: the code does something the spec does not commit to. Future maintainer sees `emit_agent` and `extract_section` and asks "what calls this?" — finds no manifest entries for agents. The machinery is exercised only by a test that passes an empty agents array. This is misleading.
- Operational cost: cognitive — future reader must understand dead machinery that serves no current purpose.

### Pragmatist verdict

Catalog-only. Strip `emit_agent`, `extract_section`. The generator is a catalog generator. Name it what it does. The ~20min strip cost is worth the elimination of dead machinery that will confuse future readers and that the spec should not commit to maintaining.

The alternative — keep agent-mode for a speculative future where reviewers are generated — is exactly the speculative future benefit failure mode. Reviewer disciplines are mostly per-consumer. The one foldable convergence (evidence-citation opener) is better handled as a plain authoring note than as generator machinery.

---

## Resolving the AC-8.1 / Plan-F4 Contradiction

**Pick: drop plan-01's Convergence 2 (confidence-ladder wording), amend the spec to catalog-only scope.**

Rationale: AC-8.1 in the current spec sanctions one convergence (evidence-citation wording). Plan-01 added a second (confidence-ladder wording) that the spec never authorized. The spec is the controlling document. Plan-01 exceeded its authority by adding an unenumerated convergence.

But since the Pragmatist position is to drop reviewer generation entirely (AC-3.1 dropped), the contradiction dissolves: neither convergence is implemented via the generator. The evidence-citation opener phrasing can be settled as a plain authoring fix (edit attacker and smeller to match) with no generator involvement. AC-8.1 narrows to catalog semantic equivalence only.

---

## Summary of AC Disposition

| AC | Disposition | Reasoning |
|----|-------------|-----------|
| AC-1.1 | Keep, narrow | Generator exists and is deterministic — true, but scope = catalog only |
| AC-2.1 | Drop | Members are OUT per designer decision D; dead deliverable |
| AC-3.1 | Drop | Reviewer disciplines mostly per-consumer; generator cannot splice mid-section; machinery cost > 1-sentence benefit |
| AC-4.1 | Keep as-is | Surviving core value; catalog built, tested, green |
| AC-5.1 | Keep, reduce | Narrow to catalog staleness check; completeness clause collapses |
| AC-6.1 | Keep as-is | Pure authoring edit; no dependency on generator scope |
| AC-7.1 | Keep as-is | Pure authoring edit; no dependency on generator scope |
| AC-8.1 | Keep, narrow + resolve contradiction | Scope = catalog semantic equivalence only; drop plan-01's Convergence 2 |

---

## Final Position

**position:** Catalog-only spec — drop AC-2.1 (members out), drop AC-3.1 (reviewer disciplines per-consumer, generator cannot splice mid-section, machinery cost exceeds benefit), narrow AC-1.1 + AC-5.1 + AC-8.1 to catalog scope, keep AC-4.1 + AC-6.1 + AC-7.1 unchanged. Strip `emit_agent` and `extract_section` from the generator in one cleanup commit. Resolve AC-8.1/plan-F4 contradiction by scoping AC-8.1 to catalog semantic equivalence only — reviewer convergences fall outside spec scope, neither is implemented.

**rationale:** The generator as-built does one useful thing: emit the catalog from frontmatter. Members are out by designer decision. Reviewer disciplines are verified-mostly-per-consumer — the confidence-ladder text differs per reviewer, the generator cannot splice mid-section, and the one foldable convergence (evidence-citation opener) is a one-sentence authoring fix, not a generator use case. Keeping agent-mode machinery in the generator when no manifest entries will point to it is dead code that misleads future readers. The strip cost is ~20min and one commit. The spec should describe what the generator actually does, not what it was designed to do before execution revealed the per-consumer truth. Plan-01's Convergence 2 exceeded spec authority; dropping reviewer generation dissolves the contradiction rather than requiring an enumeration fight over which ladder variant is "canonical."

**blocking_risk:** Agent-mode is already built and green — keeping it zero-cost; stripping it pays cleanup cost for a future where reviewer single-sourcing via generator could become valuable if a new shared reviewer discipline (not per-consumer) is added later.
