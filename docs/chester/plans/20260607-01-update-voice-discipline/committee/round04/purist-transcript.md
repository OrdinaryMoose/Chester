# Purist — Round 04 Transcript

**Sprint:** 20260607-01-update-voice-discipline
**Question:** Given members OUT (decision D, settled) and reviewer disciplines proved mostly per-consumer, what should the corrected spec commit the generator to producing — catalog-only, or catalog + narrowed reviewer-discipline fold — and which ACs drop, reduce, or stay?

---

## Reading the Evidence

### What execution proved

Ground truth is non-contestable, so starting from it:

1. **Members OUT (AC-2.1 dead).** Interleave ~16x. Two-file concat gives wrong shape. AC-2.1 cannot be satisfied by the generator; the decision is settled. Generator has no live consumer for member-mode.

2. **Reviewer disciplines mostly per-consumer.** Concrete:
   - `execute-write-spec-reviewer:66-73` vs `execute-write-quality-reviewer:69-77` — confidence ladder present in both, ~13 lines, near-zero shared text. The two files use different prose and different threshold explanations.
   - `plan-build-plan-attacker:72-80` vs `plan-build-plan-smeller:62-69` — evidence-citation wording ONLY is cleanly foldable. Section headers differ; bullets differ; attacker has richer multi-line body; smeller has stripped-down version. Generator appends whole ##-sections, cannot splice fragment mid-section.
   - Independence text: attacker and reviewer carry it; spec-reviewer carries it (`:18-31`) but as domain-specific independence framing (the "CRITICAL: Do Not Trust the Report" block), NOT a shared fragment. Quality-reviewer has independence-flavored prose at line `:66` ("Read the actual diff. Do not infer from the implementer's summary") — one line, local, not extractable.

3. **AC-8.1 / plan-F4 contradiction.** Spec AC-8.1 lines 193-195 authorizes EXACTLY:
   - Reviewer evidence-citation wording convergence (the only clean fold)
   - "Any other discipline-text convergence allowed ONLY if enumerated here"
   Plan-01 added a "Convergence 2" (confidence-ladder convergence) the spec never authorized. That is a direct AC-8.1 violation.

### What the generator currently carries

`chester-generate-agents.sh` implements:
- `emit_agent()` — full agent assembly from manifest fragments (whole-file or `{file,section}` extraction via `extract_section()`). Lines 37-67.
- `emit_catalog()` — frontmatter scan + template splice. Lines 69-115.
- Mode flag: `--agents-only`, `--catalog-only`, or default `all`. Lines 6-15, 117-123.

Agent-mode machinery (`emit_agent`, `extract_section`) exists, is built, is committed, passes tests. But with members OUT, it has exactly ZERO live consumers if reviewers also go out. With reviewers partially foldable (only evidence-citation), the question is whether a narrowed fold justifies keeping the machinery.

---

## The Category Question

### Two shapes in one tool

Current generator is `all`-mode by default: one tool that does two structurally distinct things:

**Shape A — catalog mode:** scan SKILL.md frontmatter, alphabetically sort, splice into template. Pure derivation. Input = structured frontmatter, output = ordered list. No fragment extraction, no manifest-driven assembly, no section parsing. Clean function with a single job.

**Shape B — agent-mode:** read manifest, for each agent entry emit header + frontmatter + ordered fragment assembly, with per-fragment routing (whole-file vs section-extract). Structurally: a document assembler driven by a per-entry specification.

These are not the same shape with a mode switch. They are genuinely different tools. The only reason they live together is the spec's "unified generator" architecture decision — which was made when members+reviewers were expected to be single-sourceable. That premise has collapsed for members entirely and partially for reviewers.

### Does the agent-mode shape have a live job?

With members OUT: zero member generation.

For reviewers: the ONLY cleanly foldable discipline is evidence-citation wording (the one piece attacker and smeller share, confirmed by execution). That is:
- One fragment (`review-discipline.md`) inserted into two agent files
- The confidence-ladder bands are NOT shared — the two reviewer pairs use different prose for the same concept
- Independence bands are NOT shared — each reviewer's independence framing is domain-specific (attacker's is plan-evidence independence; spec-reviewer's is implementer-bias independence; quality-reviewer's is one local line)

So: keep agent-mode machinery = keep a document assembler that, post-members-decision, handles two reviewer files (attacker, smeller) sharing one fragment. The other three reviewers (`plan-reviewer`, `spec-reviewer`, `quality-reviewer`) have nothing to fold.

**Category verdict:** agent-mode machinery's cost-to-benefit ratio at current scope is unfavorable. The machinery exists for a job that has shrunk from "4 members + 5 reviewers = 9 agents, multi-fragment composition" to "2 reviewers, 1 shared fragment." A document assembler for that use case is structural overreach — the tool carries a shape that no longer maps to the work it does.

### The composition test

Does catalog-only compose cleanly with surrounding shapes?
- `emit_catalog` is already tested (T2 committed green), self-contained, no external fragment dependencies
- The verify test (`test-generated-agents-current.sh`) is designed around whole-file diffs — catalog-only output still satisfies this
- `--catalog-only` mode already exists as a flag; it's not a new boundary, just the boundary that should be the whole tool

Does keep-agent-mode (narrowed to evidence-citation fold) compose cleanly?
- Manifest must still exist and declare fragment structure for 2 reviewer files
- `extract_section()` machinery stays in the tool for a single use: extract nothing — the evidence-citation is a WHOLE FILE fragment (`review-discipline.md`) appended to two agents, not a section extraction
- Wait: looking at the ground truth again — "Only the evidence-CITATION wording is cleanly foldable." That means attacker and smeller share the evidence-citation prose. That fold = one `agents/sources/review-discipline.md` file appended WHOLE to two agent files. No `extract_section()` needed. Just `emit_agent` with whole-file fragments.

So the narrowed reviewer fold does NOT require `extract_section()` at all for the actual foldable content. `extract_section` exists for member Stance Principles extraction from `util-design-partner-role/SKILL.md:162` — a consumer that no longer exists.

**Revised category verdict:** `extract_section()` becomes dead code in the narrowed-reviewer-fold option. The tool would carry section-extraction machinery with no exercised path. That is a legibility cost baked into the tool's body forever.

---

## AC-by-AC Analysis

### AC-1.1 — Generator exists and is deterministic

**Verdict: REDUCE (scope narrows to catalog-only)**

Current text commits to "writes the declared agent files AND the catalog." With members OUT and reviewer fold narrowed to at-best catalog-only or minimal-fold, the AC should read: generator writes the catalog (and optionally the subset of reviewer files that have a foldable discipline). Determinism requirement: KEEP, it's structural, applies equally to catalog-only. `jq` guard: KEEP. The AC's observable boundary should drop the "agent files" clause or qualify it to catalog output.

If going catalog-only: AC-1.1 = "generator writes catalog → exit 0; twice = identical bytes; jq absent = non-zero." Clean, verifiable, accurate.

### AC-2.1 — Member agents generated from scaffold + lens

**Verdict: DROP**

Ground truth #1. Decision D. Dead. Not a reduction — a drop. Carrying AC-2.1 in the spec with "(dead)" notation or similar is a category failure: a criterion that can never be satisfied is not a criterion, it's noise that misleads whoever reads the spec next. Remove entirely.

### AC-3.1 — Reviewer agents generated, disciplines single-sourced

**Verdict: REDUCE sharply or DROP**

The original AC-3.1 is premised on reviewers having substantial shared discipline bands that can be extracted and single-sourced. Execution disproved this for confidence-ladder and independence bands. Only evidence-citation wording is foldable.

Option A (catalog-only path): DROP AC-3.1. Reviewer files remain hand-authored. No generation. No discipline single-sourcing beyond what hand-authoring already provides. The spec says this sprint is about relocating and single-sourcing; hand-authored reviewer files with hand-authored discipline text is not a regression — it was the status quo. The sprint's value comes from catalog generation, CLAUDE.md dedup, and voice-rule canonical homes.

Option B (narrowed fold path): REDUCE AC-3.1 to: "evidence-citation wording lives in `agents/sources/review-discipline.md`; attacker and smeller files are generated from domain source + that fragment; confidence-ladder and independence bands are NOT subject to AC-3.1 (per-consumer, left in place)." This is an honest AC: says what is actually true.

**My position:** Option A. AC-3.1 for two reviewer files sharing one whole-file fragment does not justify the manifest infrastructure and agent-mode machinery. The AC should drop. Reviewer hand-authoring stays. No silent drift risk because the verify test still covers manifest-completeness for files NOT in the manifest.

Wait — if reviewers are hand-authored (not generated), the verify test's manifest-completeness check still needs to list them on the exclusion list OR cover them some other way. The current test design distinguishes: "manifest outputs" vs "declared hand-authored exclusion list." If reviewers are hand-authored, they go on the exclusion list alongside consolidator/scribe/researcher. That is clean and achievable.

### AC-4.1 — Catalog derived from frontmatter; phantom pointer fixed; missing skills present

**Verdict: KEEP, exact**

This is the surviving core deliverable. Catalog generation is proved (T1+T2 committed green). Every skill appearing in the catalog, phantom pointer in CLAUDE.md fixed, three missing skills present. None of this is affected by the members/reviewer question. Keep every word of AC-4.1.

### AC-5.1 — Verify test is the regeneration trigger

**Verdict: REDUCE (scope narrows with AC-3.1)**

The verify test design is fundamentally sound and should stay. What changes: if AC-2.1 drops and AC-3.1 drops, the manifest-completeness check no longer needs to partition "manifest outputs (9 generated)" vs "exclusion list (3 roles)." In catalog-only path:
- Manifest outputs = 1 (just the catalog)
- All agent files (glob `agents/*.md` excluding `agents/CLAUDE.md`) = exclusion list
- The completeness check becomes: "every `agents/*.md` (except CLAUDE.md) is on the exclusion list" — which simplifies to "no unexpected agent files exist"

Staleness check: applies only to catalog output. "Edit a canonical source (SKILL.md frontmatter) without regenerating → test fails naming skill-index.md stale." Correct, keep.

The test itself is still needed. AC-5.1's observable boundary should drop "canonical source edit" examples that reference `agents/sources/` (which only exists in agent-mode path) and focus on SKILL.md frontmatter edits and catalog output staleness.

### AC-6.1 — CLAUDE.md two-tier dedup with carve-out restored

**Verdict: KEEP, exact**

Nothing about members being out or reviewer fold narrows affects CLAUDE.md two-tier dedup. The carve-out restoration and phantom pointer fix are pure authoring edits orthogonal to generator architecture. Keep every word.

### AC-7.1 — PM Litmus Test and Research Boundary canonical home

**Verdict: KEEP, exact**

Voice-rule canonical homes. Completely orthogonal to generator architecture question. Keep every word.

### AC-8.1 — No semantic change to generated agents

**Verdict: REDUCE + RESOLVE THE CONTRADICTION**

The contradiction is the structural problem here. AC-8.1 lines 193-195 enumerate exactly one deliberate convergence (evidence-citation wording) and say "Any other discipline-text convergence is allowed only if enumerated here." Plan-01 added Convergence 2 (confidence-ladder) without spec authorization. This is a live contradiction.

**Resolve by: drop the plan's extra convergence.** The spec is the authority. Plan-01 adding an unenumerated convergence is exactly the kind of silent addition AC-8.1 was written to prevent. The resolution is: Convergence 2 does NOT happen. Confidence-ladder bands stay per-reviewer, hand-authored. AC-8.1 is correct as written.

**Scope reduction on catalog-only path:** If AC-3.1 drops (reviewer generation drops), then AC-8.1's reviewer discipline clause becomes vacuous — there are no generated reviewer files to check semantic equivalence on. AC-8.1 should REDUCE to: "generated catalog is semantically equivalent to pre-refactor skill-index.md." The member clause (Stance Principles, Translation Gate) drops with AC-2.1. What remains: catalog output carries same skills with same descriptions.

---

## The Core Decision: Catalog-Only vs Narrowed Fold

### Catalog-only (my position)

Generator = one shape, one job: derive catalog from frontmatter. `emit_catalog()` only. `emit_agent()` and `extract_section()` removed. Manifest simplifies to catalog-only structure (or manifest removed entirely in favor of direct flags). The `--agents-only` and `--catalog-only` flags: in catalog-only world, flags become irrelevant; tool always produces catalog.

Category integrity: the tool's shape matches its job exactly. Nothing dead. No path that can't be exercised.

Compositional result: reviewer files hand-authored, discipline text stays in place, verify test covers catalog staleness only. Zero manifest complexity. The `agents/sources/` directory: does not need to exist for catalog-only. If it doesn't exist, the spec can remove all references to it.

AC map: AC-1.1 narrows to catalog, AC-2.1 drops, AC-3.1 drops, AC-4.1 stays, AC-5.1 narrows to catalog staleness, AC-6.1 stays, AC-7.1 stays, AC-8.1 narrows to catalog semantic equivalence.

### Narrowed fold (keep agent-mode, shrink to 2 reviewers + 1 fragment)

Generator retains both shapes. The active agent-mode work: attacker + smeller each get `review-discipline.md` appended whole. `extract_section()` becomes dead code (was for member Stance Principles). Manifest must declare 2 agent entries.

Category cost: tool carries dead code (`extract_section`) and a document-assembly mode for 2 files sharing 1 fragment. When reader opens `chester-generate-agents.sh` a year from now, they see `emit_agent`, `extract_section`, flag routing, manifest iteration — for a use case that is 2 agents sharing 1 whole-file fragment. The code surface misleads about the scope of the problem. That is a legibility cost.

Value case for narrowed fold: establishes the pattern for future reviewer discipline addition. If evidence-citation standardizes across all 5 reviewers later, the machinery exists. That is a speculative future consumer — exactly the kind of overreach that should not survive.

**Decision: catalog-only.**

The generator's agent-mode machinery has no live consumer post-members-decision when reviewers are (mostly) per-consumer. Keeping it for 2 reviewer files + 1 whole-file fragment is category mixing: the tool would carry a document assembler for a use that could be served by hand-authoring with no loss of discipline enforcement. The verify test's staleness guard covers hand-authored reviewer files via the completeness check (exclusion list). Discipline text in reviewer files is enforced by the hand-authored baseline. AC-8.1 convergence list stays accurate (evidence-citation only, as written). Clean cut.

---

## AC-8.1 / Plan-F4 Contradiction Resolution

Spec says: one enumerated convergence (evidence-citation), any other requires enumeration.
Plan-01 says: Convergence 2 (confidence-ladder) also folds.

Ground truth confirms confidence-ladder bands are NOT cleanly foldable (13 lines, near-zero shared text between spec-reviewer and quality-reviewer; independent phrasings of same concept). The plan's Convergence 2 was both unauthorized and factually unsupported by execution evidence.

**Resolution: drop plan's Convergence 2. AC-8.1 stands as written.**

On catalog-only path: AC-8.1 reduces further since no reviewer generation occurs. The convergence clause becomes: "generated catalog carries same skills/descriptions as pre-refactor skill-index.md." The enumerated-convergence construct is vacuous for catalog-only but retains its structural integrity as a pattern — if agent generation is ever added back, the enumeration discipline applies.

---

## Final Position

**position:** catalog-only — generator committed to producing the catalog; agent-mode machinery (emit_agent, extract_section, manifest agent entries) removed; reviewer files remain hand-authored; AC-2.1 dropped, AC-3.1 dropped, AC-5.1 and AC-8.1 scope-reduced to catalog outputs, AC-4.1/6.1/7.1 unchanged; plan's Convergence 2 (confidence-ladder) dropped with AC-8.1 standing as written

**rationale:** With members OUT (decision D) and reviewer disciplines proved mostly per-consumer, the generator's agent-mode shape has no live consumer of sufficient density to justify keeping it. A document assembler for 2 reviewer files sharing 1 whole-file fragment is structural overreach: the tool carries extract_section() dead code, manifest infrastructure, and two-mode flag routing for a use case that hand-authoring serves without loss of discipline enforcement. Catalog derivation is the surviving value: one tool, one job, clean category. The verify test's completeness check still covers hand-authored reviewer files via the exclusion list — no drift risk. The AC-8.1 contradiction resolves by dropping the plan's unenumerated Convergence 2; spec is authoritative, evidence-citation-only convergence stands.

**blocking_risk:** narrowed fold preserves the pattern-investment in agent-mode machinery for the one foldable discipline (evidence-citation), making future reviewer single-sourcing a configuration change rather than a structural addition — catalog-only pays that cost in full if reviewers are later standardized.
