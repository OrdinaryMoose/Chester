# Conservator Transcript — Round 04

**Sprint:** 20260607-01-update-voice-discipline
**Round:** 04 (single-round consult — generator scope + AC corrections)
**Question:** Given members OUT and execution-verified reviewer disciplines are mostly per-consumer, what should corrected spec commit the generator to — catalog-only, or catalog + narrowed reviewer-discipline fold? And which ACs drop/reduce/stay?

---

## Evidence Inventory

### What the executed code shows

Generator at `chester-util-config/chester-generate-agents.sh` has two live paths:
- `emit_catalog()` — lines 69–115: catalog generation from frontmatter glob. Proven working (T1+T2 committed, 29 tests green).
- `emit_agent()` — lines 37–67: agent assembly from manifest fragments. Machinery built, but members ruled OUT (designer decision D) and reviewer fold is under question.
- `extract_section()` — lines 26–35: section extraction from `##` headings. Built to serve the Stance-extraction-from-util-design-partner-role use case that was itself retired in round 02 (boundary-redraw verdict: lens files verbatim, no extraction).

### Reviewer discipline distribution (ground-truth per question packet)

Confidence ladder: `execute-write-spec-reviewer` lines 66–73, `execute-write-quality-reviewer` lines 69–77 — differ by ~13 lines, near-zero shared text.

Evidence standard: `plan-build-plan-attacker` lines 72–78+95, `plan-build-plan-smeller` lines 65–69.

Independence text: `plan-build-plan-attacker`, `plan-build-plan-reviewer` (`:51`), `execute-write-spec-reviewer` (`:18–31`). The quality-reviewer line 66 ("Read the actual diff. Do not infer from the implementer's summary") is independence-flavored but local prose.

Verified by reading the actual files above:
- spec-reviewer (`:66-73`) has the ≥80 threshold spelled out in detail.
- quality-reviewer (`:69-77`) has same threshold logic but separate wording, distinct structure; the "Read the actual diff" line at 66 is clearly a standalone imperative under a git-range header, not a shared-band candidate.
- attacker (`:72-78`) has evidence standard + the single most important rule. plan-smeller (`:65-69`) has evidence standard too, same conceptual rule but distinct prose.
- plan-reviewer (`:51`) has a brief independence note — one line, minimal.

Conclusion: the disciplines are irregular and deeply interleaved with consumer-specific content. The generator CAN'T splice a fragment mid-section; it can only append whole `##` sections. There is no clean `##` boundary separating the discipline text from consumer-specific text in most reviewers.

### The AC-8.1 / plan-F4 contradiction

Spec AC-8.1 (lines 193–195): sanctions ONLY evidence-citation wording convergence. "Any other discipline-text convergence is allowed only if enumerated here."

Plan-01 task 4 / F4: added confidence-ladder wording as Convergence 2, never authorized by AC-8.1.

This is the defined defect to resolve.

---

## Analysis — Generator Reach Options

### Option A: Catalog-only (strip agent-mode machinery)

Remove `emit_agent`, `extract_section`, the `--agents-only` flag, the manifest's `agents` array support, and related MODE logic. Generator becomes a catalog-only tool.

**Structural cost:** `emit_agent` code exists and is working. Stripping it = deliberate deletion of built machinery.

**Conservator read:** machinery built for a purpose that was retired (members OUT, reviewer fold unproven). The spec was written for a full hybrid generator; that spec is now out of sync with execution reality. BUT: the code is present, committed, functioning. Removing it is a structural disturbance.

Key test: does keeping the machinery hurt? It's inert if the manifest `agents` array is empty or absent. Generator parses manifest; if `agents` array = empty, `emit_agent` never fires. No observable behavior change for downstream consumers.

**Counter:** dead code in a canonical utility = future liability. Someone reads it, assumes it works, adds agents array entries, finds it half-baked relative to the retired member architecture. Code = documentation; dead agent-mode machinery = misleading documentation of a path that doesn't work.

**Strongest conservator case for catalog-only:** The generator's existing shape (committed, green) already IS effectively catalog-only in practice — T1 core + T2 catalog mode committed; no agent-generation tests committed yet; the manifest (not yet present per the Glob finding) doesn't exist. Stripping agent-mode now = confirming what's already true in execution, not disturbing working structure.

### Option B: Catalog + narrowed reviewer fold (one convergence only)

Keep `emit_agent` for exactly one operation: fold the evidence-citation wording convergence that AC-8.1 already authorizes. Drop confidence-ladder as a generator fold (it's per-consumer).

**Structural cost:** this requires the manifest's `agents` array to have entries for the reviewer agent files, `review-discipline.md` canonical source, per-reviewer fragment maps. That's significant new authoring surface not currently committed.

**Conservator lens:** this path keeps machinery that execution hasn't proven needed. The evidence-citation fold = a single phrasing variant between attacker and smeller on one clause. The cost of keeping that single clause inconsistent = essentially zero; it's a wording drift, not a semantic drift. The machinery needed to fold it = non-trivial.

### Option C: Keep general generator (full original spec scope)

Honor the spec as written, preserve all machinery including member-generation path even with members OUT.

**Conservator lens:** members OUT is a settled designer decision. Spec AC-2.1 is explicitly dead per ground truth. Honoring a dead AC = not conserving the system's intent, it's honoring dead paper. This option is rejected — conserving dead structure is not stasis, it's inertia.

---

## AC-by-AC Analysis

### AC-1.1 — Generator exists and is deterministic

**Status: KEEP, reduced scope.**

Generator exists and is deterministic — already proven (29 tests green). BUT: the spec's "writes the declared agent files and the catalog" is partially dead if members are OUT. AC-1.1 text should be scoped to what the generator actually produces.

Specifically: "Running `bin/chester-generate-agents` writes the declared agent files and the catalog" — the agent files part is dead if no manifest agents array. Reduce the observable boundary to catalog + any declared manifest agents (which may be zero). Exit 0 with empty agents array = valid. Determinism test stays.

### AC-2.1 — Member agents generated from scaffold + lens

**Status: DROP.** Ground truth confirms this is dead. Designer decision D, members OUT. Dead AC that keeps a dead obligation. Drop without replacement.

### AC-3.1 — Reviewer agents generated, disciplines single-sourced

**Status: REDUCE significantly.**

The "disciplines single-sourced" goal was predicated on the disciplines being cleanly extractable. Execution evidence shows they're not: ~13 lines of near-zero shared text between spec-reviewer and quality-reviewer, no clean `##` boundary. The generator appends whole sections; it cannot splice fragments mid-section.

What survives of AC-3.1: the evidence-citation wording convergence (the one enumerated in AC-8.1). If the generator is catalog-only, AC-3.1 scope = zero (drop entirely). If generator keeps emit_agent for this one fold, AC-3.1 reduces to: "evidence-citation wording lives in one canonical source; attacker and smeller each get it via manifest fragment."

Conservator recommendation: drop AC-3.1 entirely. Rationale below.

### AC-4.1 — Catalog derived from frontmatter

**Status: KEEP as-is.** This is proven. T2 committed, green. The catalog generator works, the YAML folded-block fix is in, the glob-quoting fix is in. CLAUDE.md phantom pointer fix stays in scope. This is the working core of the sprint.

### AC-5.1 — Verify test is the regeneration trigger

**Status: KEEP, scope adjusts to match generator.**

The test `tests/test-generated-agents-current.sh` verifies committed outputs against regenerated outputs. If agents array is empty (catalog-only), the manifest-completeness check still fires against `agents/*.md` files. The completeness check is still load-bearing: it catches agent files that exist without manifest coverage. Keep the test; its scope naturally matches whatever the manifest declares.

Note: if AC-3.1 drops and no reviewer agents are generated, the completeness check exclusion list expands (all 5 reviewer agents become hand-authored exclusions alongside consolidator/scribe/researcher). That's a manifest authoring question, not a spec question.

### AC-6.1 — CLAUDE.md two-tier dedup with carve-out restored

**Status: KEEP as-is.** Purely authoring edit, no dependency on generator scope. The carve-out restoration and two-tier pointer are independent of member/reviewer decisions.

### AC-7.1 — PM Litmus Test and Research Boundary canonical home

**Status: KEEP as-is.** Purely authoring edit to `util-design-partner-role/SKILL.md` and consumer citations. No dependency on generator scope.

### AC-8.1 — No semantic change to generated agents

**Status: REDUCE to resolve the contradiction.**

Current AC-8.1 authorizes exactly one convergence: evidence-citation wording. Plan-F4 added confidence-ladder wording as Convergence 2 without spec authorization. This is the defined defect.

**Conservator position: DROP plan-F4 (the unauthorized confidence-ladder convergence), not amend the spec.**

Reasoning:
1. Amending AC-8.1 to add Convergence 2 expands scope — quiet scope enlargement is exactly the failure mode Conservator watches for.
2. Execution evidence shows confidence-ladder text is per-consumer (~13 lines, near-zero shared). Even if the generator could fold it, the "single source" benefit is minimal: two files, similar but not identical ladders, both working as-is.
3. The spec was written with a clear gate: "Any other discipline-text convergence is allowed only if enumerated here." Plan-F4 violated that gate. Restoring the gate = confirming the spec's original intent, not disturbing it.
4. If AC-3.1 drops (see above), AC-8.1's scope for reviewer convergences reduces to zero. The AC remains but its reviewer-related text becomes vacuous. That's fine — AC-8.1's no-semantic-change rule applies to whatever the generator does produce.

If generator is catalog-only: AC-8.1's scope narrows to "catalog generation produces the same skill index as the hand-authored one did, modulo deliberate additions of the 3 missing skills." The semantic-equivalence gate then applies only to catalog output.

---

## The Core Structural Question: Catalog-only vs Catalog + Reviewer Fold

**Conservator landing: catalog-only, strip agent-mode machinery.**

Four structural reasons:

1. **Executed reality confirms catalog-only is the working state.** T1 core + T2 catalog committed, green, 29 tests pass. No agent-generation tests committed. Manifest doesn't exist yet. The sprint's delivered value is already catalog-only in practice. Spec correction = aligning the spec to proven reality, not cutting scope.

2. **Agent-mode machinery was built for members (settled OUT) and a reviewer fold that execution shows is per-consumer.** The `extract_section` function was specifically built for the Stance-extraction use case that was retired in round 02. The round-02 boundary-redraw verdict explicitly retired that path. Dead code built for a retired purpose = misleading structural documentation.

3. **The reviewer evidence-citation fold costs more to implement (manifest entries, review-discipline.md canonical source, fragment maps, 5 reviewer agent entries) than the benefit of single-sourcing one phrasing variant.** The phrasing variants exist between attacker and smeller on the evidence-citation rule — they are both clear, both working, both consistent in meaning. The machinery to fold them is non-trivial. Smallest disturbance principle: leave them as-is.

4. **Scope creep risk.** "Keep agent-mode for one fold" sounds narrowed but remains a live invitation. Once the manifest's `agents` array has entries, future contributors will add more. The catalog-only scope is a hard boundary that the code itself enforces. Stripping `emit_agent` makes the boundary mechanical.

**The one counter-argument Conservator must acknowledge:** stripping working code is itself a disturbance. `emit_agent` is green, functional, non-harmful if the manifest agents array is empty. Stripping it = an active deletion, not passive stasis.

Conservator's answer: the machinery is working but its purpose is gone. Code without purpose is not a preserved asset — it's orphaned machinery. The sprint's design history says member generation is OUT (round 01 designer decision D) and reviewer fold is per-consumer (round 04 ground truth). Preserving orphaned machinery is not stasis; it's preservation of a corpse.

---

## Contradiction Resolution: AC-8.1 vs Plan-F4

**Drop plan-F4. Do not amend AC-8.1 to add Convergence 2.**

Spec says: only enumerated convergences allowed.
Plan-F4 added Convergence 2 (confidence-ladder wording) without spec authorization.

Resolution: Convergence 2 is unauthorized and the spec's gate should hold. If catalog-only is the generator scope, the convergence question for reviewers is moot — no reviewer is generated, the "convergence" concept doesn't apply. The AC-8.1 gate survives intact.

If reviewers ARE generated (Option B path, rejected above), then: keep AC-8.1 with exactly one enumerated convergence (evidence-citation wording). Confidence-ladder stays per-consumer. Plan-F4's Convergence 2 is dropped and the plan is corrected to match the spec.

---

## Final Position

position: catalog-only generator — strip agent-mode machinery, drop AC-2.1, reduce AC-3.1 to drop, resolve AC-8.1/F4 contradiction by dropping plan-F4 (not amending the spec)

rationale: Execution has proven catalog-only is the working state — T1+T2 committed, 29 green tests, no agent-generation tests or manifest in the tree. Members are OUT (settled decision). Reviewer disciplines are per-consumer with no clean `##` extraction boundary, making the agent-mode fold cost-disproportionate for one phrasing variant. The `emit_agent`/`extract_section` machinery was built for a use case (member single-sourcing via Stance extraction) explicitly retired in round 02. Stripping it aligns the spec to proven reality and closes a live scope-creep invitation. AC-8.1/F4 contradiction: plan-F4 added Convergence 2 without spec authorization; spec gate says "only if enumerated here" — drop the unauthorized convergence, do not expand AC-8.1. ACs 4.1, 5.1, 6.1, 7.1 stay as-is; they are independent of member/reviewer scope and proven.

blocking_risk: stripping working `emit_agent` machinery is an active deletion of proven code — if reviewer fold needs arise later, re-implementation cost is non-zero rather than configuration cost.
