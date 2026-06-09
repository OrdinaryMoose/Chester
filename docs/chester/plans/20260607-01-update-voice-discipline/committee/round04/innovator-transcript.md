# Innovator — Round 04 Transcript

**Sprint:** 20260607-01-update-voice-discipline
**Round:** 04
**Question:** Given members OUT (settled, D) and execution proved reviewer disciplines mostly per-consumer, what should the corrected spec commit the generator to producing — catalog-only, or catalog plus narrowed reviewer-discipline fold — and which ACs drop/reduce/stay?

---

## Evidence Read

- spec-00.md (all 8 ACs)
- plan-01.md (full, incl. change log and Task 4 F4 detail)
- chester-generate-agents.sh (committed T1+T2 state)
- All 5 reviewer agent files (attacker, smeller, plan-reviewer, spec-reviewer, quality-reviewer)

---

## What execution actually proved

### Reviewer discipline distribution (ground-truth)

From plan-01 Task 4 Step 1, validated against agent bodies I read:

- **Evidence standard:** attacker (`:72-78,95`) + smeller (`:62-69`) — 2 of 5 reviewers
- **Confidence ladder:** spec-reviewer (`:64-73`) + quality-reviewer (`:68-77`) — 2 of 5 reviewers
- **Independence:** attacker + plan-reviewer (`:51`, single line) + spec-reviewer (`:18-31`) — 3 of 5 reviewers

Cross-check: plan-reviewer has ONE independence line (`:51`) and NOTHING else from review-discipline.md. Smeller has evidence-standard text only. Quality-reviewer has ladder only. The "disciplines are per-consumer" ground truth is real but "mostly" is the key word — two disciplines each cover exactly 2 reviewers, independence covers 3 with one being a thin one-liner. It's an irregular sparse matrix, not a uniform pattern.

### What the generator actually does now (T1+T2 committed)

The generator today has `emit_agent` (full fragment-assembly + section-extraction machinery) AND `emit_catalog`. Both live in the same `.sh` file. The agent mode is built and tested; the manifest is NOT yet created (Task 7 not done). The catalog mode is built and tested (T2 green). So the actual state is:

- **Capability:** generator can do catalog-only OR catalog+reviewers (both paths built)
- **Wired:** nothing wired yet for production (no real manifest, no real sources authored, no real reviewer files regenerated)
- **Committed green:** 29 tests pass against fixture-only data

---

## The re-framing question: what is the generator FOR now?

The original goal was: eliminate cross-file duplication by single-sourcing shared instruction text. Members are out. The question is whether reviewer disciplines qualify as "shared" enough to justify the machinery.

Let me challenge the premise from the Innovator lens.

**The generator has two distinct jobs that merged by accident of implementation:**

1. **Catalog job** — derive `skill-index.md` from frontmatter. Pure derivation. The canonical source (frontmatter) predates the generator. The generator adds a new guarantee (staleness test) against a real problem (3 missing skills, phantom pointer). Value is unambiguous and unconditional on the reviewer question.

2. **Reviewer-discipline job** — single-source ~3 discipline texts (~13-20 lines each) that are shared across 2-3 of the 5 reviewers. Each reviewer carries its discipline inline; the generator would replace those inline copies with fragment references. Value depends on: (a) how fragile the shared text actually is (does it drift?), (b) whether the fragment mechanism adds authoring complexity that outweighs the dedup, (c) whether the sparse irregular distribution creates a leaky abstraction.

### Is reviewer-discipline single-sourcing earning its keep?

**Argument FOR keeping it (what the plan currently specifies):**

- Evidence-standard text between attacker and smeller has ALREADY drifted (that's Convergence 1 — the whole reason review-discipline.md was proposed). Drift happened once; it will happen again.
- The generator mechanism is already built and tested (T1 green). The marginal cost of reviewer-discipline mode is: author 6 source files (Task 4) + write manifest entries (Task 7). The machinery is already paid for.
- AC-3.1 as written is a real spec commitment. Dropping it mid-execution means the spec was wrong; we should fix the spec accurately, not just de-scope to avoid work.

**Argument AGAINST keeping it (what my lens surfaces):**

- The irregular distribution is a structural warning. A fragment abstraction that applies to 2 of 5 (evidence), 2 of 5 (ladder), 3 of 5 (independence, one thin) reviewers is NOT a clean shared layer — it's a partial fold over heterogeneous consumers. The fold itself introduces authoring complexity: to modify a reviewer, the author must now understand which fragments it composes, not just read one file.
- Per-consumer irregularity = the abstraction boundary is in the wrong place. The evidence-standard divergence (Convergence 1) is small wording drift between two files. That is an authoring discipline problem, solved by authoring discipline, not necessarily by mechanism.
- The `extract_section` machinery exists but adds a seam: if a `##` heading is renamed in review-discipline.md, every manifest entry using that section silently breaks (hard error from generator, yes — but fragility is now shifted from inline drift to heading-name coupling).
- **Most important Innovator re-framing:** the reviewer discipline fold is spec-motivated, not problem-motivated. The spec was written before execution revealed the distribution. Now we have evidence the distribution is irregular. The spec made sense under a uniform-distribution assumption that is false.

### The AC-8.1 / plan-F4 contradiction

AC-8.1 (spec) says: "Reviewer evidence-citation wording converges... Any OTHER discipline-text convergence is allowed only if enumerated here."

plan-01 Task 4 adds Convergence 2 (confidence-ladder wording) as an enumerated allowed convergence. This is a plan-vs-spec contradiction: the plan adds a second convergence that the spec explicitly says requires spec-level enumeration.

**Resolution options:**

A. **Amend the spec** to enumerate Convergence 2 explicitly (ladder wording). This makes spec+plan consistent. Cost: spec edit.

B. **Drop Convergence 2 from the plan** — leave ladder wording as-is, two slightly different phrasings across spec-reviewer and quality-reviewer. This makes plan consistent with spec without amending spec. Cost: ladder wording stays slightly different across two files (cosmetic, not semantic).

C. **Collapse the question** by choosing catalog-only: if reviewer-discipline mode is dropped, Convergence 2 is moot because no review-discipline.md is ever authored. This dissolves the contradiction rather than resolving it.

**From Innovator lens:** Option C is structurally cleanest — it removes the contradiction by removing the scope that created it. But the lens must be honest: if the plan keeps reviewer mode, Option A is correct (spec must enumerate ALL deliberate convergences; that is the exact purpose of AC-8.1's allowlist).

---

## Per-AC analysis

### AC-1.1 — Generator exists and is deterministic

**Status: REDUCE**

Keep the AC, but narrow its scope. The generator exists (T1+T2 green). Determinism is already proven for catalog mode. If reviewer mode is kept, determinism covers agent mode too (already true from T1). If catalog-only, determinism is only asserted for catalog — that is still worth asserting (it's the test stability guarantee).

Revision: "Running `bin/chester-generate-agents` writes the declared outputs → exit 0. Running twice → byte-identical. `jq` absent → error." Remove the "agent files AND catalog" framing from the observable boundary — make it "all manifest outputs" so it works for any scope of the manifest.

### AC-2.1 — Member agents generated

**Status: DROP**

Already dead per designer decision D. Plan-01 already voids this. The spec must confirm the drop. No dispute.

### AC-3.1 — Reviewer agents generated, disciplines single-sourced

**Status: CONTESTED — the core decision**

**If catalog-only chosen:** DROP AC-3.1. Reviewer files stay hand-authored. No review-discipline.md. No fragment map. No Tasks 4, 7-reviewer-portion, 8-reviewer-portion. The 5 reviewer files are added to the verify test's exclusion list (hand-authored, not generated). The catalog-completeness check still runs (manifest outputs = catalog only).

Honest cost: the evidence-standard drift between attacker and smeller is a real defect that catalog-only does not fix. That drift must be fixed by a plain authoring edit (one-time), with the discipline text staying inline in both files. Future drift is prevented only by authoring discipline, not mechanism.

**If narrow-fold chosen (catalog + reviewer disciplines):** KEEP AC-3.1 with the irregular distribution constraint preserved verbatim. The manifest must NOT add a discipline to a reviewer that doesn't have it. The per-reviewer discipline map must be explicitly declared in the manifest.

**My lens position on AC-3.1:** The irregular distribution (2/5, 2/5, 3/5 sparse) is evidence the abstraction boundary is wrong-shaped for the problem. However, Convergence 1 (evidence-standard drift) already happened in the wild. The generator is already built. Dropping reviewer mode means accepting that drift recurs and is handled by convention rather than mechanism. That is a real cost. I do not think it is a BLOCKING cost, but I will not pretend it is zero.

**Lean: KEEP AC-3.1 with narrowed scope** — the generator's reviewer mode is built, the drift is documented, and abandoning a built mechanism because the distribution is irregular seems like premature narrowing in reverse (scoping down after sunk-cost work). But the spec must be corrected to: (a) enumerate BOTH convergences (C1 + C2), (b) not add disciplines to reviewers that lack them, (c) acknowledge the irregular map explicitly.

### AC-4.1 — Catalog derived from frontmatter

**Status: KEEP, reduce scope of CLAUDE.md sub-requirement**

The catalog generator is built and tested (T2 green). The phantom-pointer fix (CLAUDE.md edit) is a plain authoring edit independent of generator scope. Keep this AC as-is. It is unconditional on the members/reviewer question.

### AC-5.1 — Verify test is the regeneration trigger

**Status: KEEP, scope adjusts to match AC-3.1 decision**

The verify test structure (stale-output diff + completeness check) is correct regardless. If catalog-only: manifest outputs = catalog only; reviewer files on exclusion list. If narrow-fold: manifest outputs = reviewers + catalog; member files on exclusion list. The AC's observable boundary is written abstractly enough to survive either scoping — "edit a canonical source without regenerating → FAIL naming stale output" works for both. Only the exclusion list changes.

Reduce: the completeness check note about reviewer files vs hand-authored must match the final AC-3.1 decision.

### AC-6.1 — CLAUDE.md two-tier dedup

**Status: KEEP**

Completely independent of generator scope. This is a plain authoring edit (restore carve-out, replace phantom pointer). No change.

### AC-7.1 — PM Litmus Test and Research Boundary canonical homes

**Status: KEEP**

Completely independent of generator scope. Two `##` sections in util-design-partner-role/SKILL.md, consumers updated to cite. No change.

### AC-8.1 — No semantic change to generated agents

**Status: REDUCE scope + resolve contradiction**

Current spec text: lists evidence-citation convergence as the ONLY enumerated convergence; any other requires explicit enumeration. Plan-01 adds Convergence 2 (ladder wording) without amending the spec.

**Resolution I recommend:** Amend AC-8.1 to enumerate BOTH convergences explicitly:
- Convergence 1: evidence-citation wording (attacker vs smeller)
- Convergence 2: confidence-ladder ≥80-band wording (spec-reviewer vs quality-reviewer)

Then add: "Any third discipline-text convergence requires explicit enumeration here before it may be accepted at the Task 7 semantic gate."

If catalog-only is chosen instead: AC-8.1 scopes down to "generated catalog is semantically equivalent to the current hand-maintained skill-index.md, with the three previously-missing skills now present and role-group subheaders dropped." No reviewer convergence language needed.

---

## The structural re-framing

**Re-frame: the generator is a catalog tool that happens to also have agent-mode machinery.**

The original architecture framing ("one unified generator") was correct at design time when members + reviewers were both in scope. With members out and reviewer disciplines having an irregular distribution, the question is whether "unified" is still the right shape or whether it was premature unification.

From Innovator lens: **catalog-only is not the right answer** precisely because the agent mode is already built and the drift evidence is real. BUT the spec must be corrected to match what was actually discovered:

1. Members are out → AC-2.1 dropped (already in plan-01)
2. Reviewer disciplines are irregular, not uniform → AC-3.1 scoped to "derived map exactly as found, not idealized uniform distribution" (already in plan-01 AC-3.1 text, actually)
3. Two convergences, not one → AC-8.1 amended to enumerate both
4. Verify test exclusion list reflects members-hand-authored → AC-5.1 verify test updated (already in plan-01 Task 8)

The plan already does #1, #2, #4. The gap is only #3 (AC-8.1 spec text lags plan-01 F4 addition of Convergence 2).

**What the corrected spec should commit the generator to producing:**

**Catalog PLUS narrowed reviewer-discipline fold**, where:
- "Narrowed" = only the 5 reviewer files, using the derived irregular map (not added-uniformly)
- "Narrowed" = two convergences both enumerated in AC-8.1
- Members explicitly excluded (AC-2.1 dropped, exclusion list in AC-5.1)
- Generator scope = exactly what plan-01 already describes

This is not novelty. It is spec-catching-up-to-plan.

---

## Blocking risks of the option NOT chosen (catalog-only)

If catalog-only: reviewer disciplines stay inline, evidence-standard drift between attacker+smeller is a known defect fixed by one-time authoring edit but with no mechanism preventing recurrence. The generator machinery (emit_agent, extract_section) stays in the codebase but is unwired to any real manifest — dead code. Either it gets deleted (extra work) or it stays as misleading capability. That is the structural cost catalog-only doesn't avoid.

---

## Final Position

**position:** Catalog plus narrowed reviewer-discipline fold — spec corrected to enumerate both convergences in AC-8.1; AC-2.1 dropped; all other ACs kept or reduced as scoped above

**rationale:** Reviewer-discipline single-sourcing is built, tested, and motivated by real drift evidence (Convergence 1 already happened in the wild). The irregular distribution (sparse 2/5, 2/5, 3/5 map) is a constraint to respect, not a reason to abandon the mechanism. The only defect requiring a spec fix is that AC-8.1 lists one convergence when the plan-01 F4 decision adds a second — the spec must enumerate both. Catalog-only would leave dead machinery (emit_agent) in the codebase and forfeit the drift-prevention guarantee without recovering meaningful simplicity, since the agent-mode code is already paid for. The corrected spec's job is to catch up to what execution proved, not to retreat from it.

**blocking_risk:** The reviewer discipline map is irregular enough (one file gets only a single independence line) that fragment composition may create more authoring confusion than inline duplication would, especially for future contributors adding a sixth reviewer type.
