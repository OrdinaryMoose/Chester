# Extract Review Launchpad — Specification (v01)

> **Revision note (v00 → v01):** Ground-truth review of v00 flagged that inline paraphrases of `plan-attack`'s evidence standard and output format diverged from the actual lens content (paraphrases dropped content; "severity-grouped findings" contradicted the lens's explicit "whatever severity scale feels natural" guidance). v01 replaces inline content quotes with direct file:line references, so the implementer copies from the lens source rather than from this spec. No architectural change.

## Purpose

Eliminate dispatch-boilerplate duplication in `plan-build`'s Plan Hardening section by extracting `plan-attack` and `plan-smell` subagent prompts into dedicated dispatch templates, mirroring the existing `plan-reviewer.md` pattern. The three plan-review lenses remain separate. Only the mechanism by which `plan-build` launches attack and smell changes.

## Architecture

### Current state

`skills/plan-build/SKILL.md` dispatches three review lenses:

- **Fidelity** (`plan-reviewer.md`): dispatched from the Plan Review Loop section using a dedicated template with `[PLAN_FILE_PATH]` and `[SPEC_FILE_PATH]` placeholders. Clean.
- **Attack** (`plan-attack/SKILL.md`): dispatched from Plan Hardening via "read the skill file, embed the full skill instructions into the Agent prompt." No dispatch template exists.
- **Smell** (`plan-smell/SKILL.md`): dispatched from Plan Hardening via the same "read-and-embed" mechanism. No dispatch template exists.

The asymmetry is the problem. Fidelity has a purpose-built subagent prompt; attack and smell inherit their full interactive workflow (including "Step 1 — Identify the plan" dialogue logic) when embedded into subagent context.

### Target state

Two new files in `skills/plan-build/`:

- `plan-attack-dispatch.md` — subagent-facing prompt template for the attack lens, modeled on `plan-reviewer.md`. Sole placeholder: `[PLAN_FILE_PATH]`.
- `plan-smell-dispatch.md` — same pattern for smell.

One section of `skills/plan-build/SKILL.md` changes:

- **Plan Hardening section** — step 1 changes from "Read the skill files" to "Read the dispatch template files"; step 2 changes from "Embed the full skill instructions" to "Substitute `[PLAN_FILE_PATH]`". Steps covering synthesis, human gate, and threat-report writing stay identical.

No changes to `plan-attack/SKILL.md`, `plan-smell/SKILL.md`, or `plan-reviewer.md`. The lens `SKILL.md` files remain valid standalone skills.

### Why this shape

The existing `plan-reviewer.md` is the established dispatch-template pattern in this directory. Adding two parallel templates is the lowest-surprise change for someone reading `plan-build/` cold. The `design-specify/ground-truth-reviewer.md` precedent confirms that forked subagent-facing prompts are the Chester-sanctioned approach when a skill needs to be dispatched programmatically.

## Components

### Content-sourcing rule (applies to both dispatch templates)

Evidence-standard, output-format, and what-to-check content in the dispatch templates is **copied from the lens SKILL.md at write time by reading the specified file:line ranges** — not paraphrased from this spec. The spec states *where* the content comes from; the implementer opens those line ranges and copies the text exactly. This keeps the spec free of quotation drift and makes the "verbatim preservation" constraint actually achievable.

### `plan-attack-dispatch.md` (new)

**Structure** (mirrors `plan-reviewer.md`):

1. **Sync-discipline reminder** (one line, at the very top): *"Evidence standard and output format are sourced verbatim from `plan-attack/SKILL.md` — update both files together."*
2. **Purpose** (one line): what the file is
3. **Dispatch after:** trigger note — "After the plan review loop approves the plan, during Plan Hardening."
4. Fenced `Task tool` block containing:
   - `description:` — short Task tool description field
   - `prompt:` — the full subagent prompt, containing:
     - Role statement ("You are an adversarial plan reviewer...")
     - `**Plan to review:** [PLAN_FILE_PATH]`
     - **What to check** — copied verbatim from `plan-attack/SKILL.md:37-76` (the five attack dimensions: structural integrity, execution risk, assumptions and edge cases, contract and migration completeness, concurrency and thread safety, including the "For each dimension, verify claims against actual code" closing instruction).
     - **Evidence standard** — copied verbatim from `plan-attack/SKILL.md:78-88`. This includes the bullet structure, the "single most important rule" clause, and the TRUE/FALSE/UNVERIFIABLE assumptions guidance. Do not collapse into a single-sentence paraphrase.
     - **Output guidance** — copied verbatim from `plan-attack/SKILL.md:90-101`. Note: the lens explicitly rejects prescribed taxonomies ("Use whatever severity scale and format feels natural — the goal is clarity, not taxonomy compliance. Group related findings when they share a root cause."). The dispatch template must preserve this open-ended guidance, not pre-specify a severity table or schema. The lens also includes the "Note any assumptions the plan makes that you verified as correct" clause and the "End with a brief risk assessment … 2-3 sentences" clause — both must be present.
5. **"Reviewer returns:" footer** — describe what the subagent produces, using language that matches the lens: "Findings grouped by root cause (severity scale at the reviewer's discretion), verified assumptions, brief risk assessment."

**Constraint:** The dispatch template contains no dialogue logic ("if no plan is identifiable, ask the user"), no workflow steps, no boundary-statement re-assertions. It is a subagent prompt, not a skill.

### `plan-smell-dispatch.md` (new)

Same structure as `plan-attack-dispatch.md`. Content-sourcing for each section:

- **What to check** — copied verbatim from `plan-smell/SKILL.md:58-89` (structural concerns: duplication, responsibility overload, unnecessary abstraction, deferred complexity; coupling and change-propagation concerns: tight coupling, shotgun surgery, hierarchy problems, contract fragility; and the practical risks sub-section: error paths, resource management, concurrency).
- **Evidence standard** — copied verbatim from `plan-smell/SKILL.md:91-99`. This includes the three-bullet structure. The third bullet — *"Whether the plan explicitly acknowledges the risk (if so, note it but don't penalize)"* — is load-bearing for preventing finding-inflation and must be preserved.
- **Output guidance** — copied verbatim from `plan-smell/SKILL.md:101-108`. Same "whatever feels natural" open-endedness as plan-attack. Preserve the "group related findings" and "2-3 sentence risk assessment" clauses.

**"Reviewer returns:" footer** — "Findings grouped by root cause (severity scale at the reviewer's discretion), brief risk assessment."

### `plan-build/SKILL.md` — Plan Hardening section rewrite

Only steps 1–3 of the current Plan Hardening section change. The replacement text:

```markdown
## Plan Hardening

**MANDATORY GATE: This step runs automatically after the plan review loop completes. Do not skip.**

After the plan review loop approves the plan:

1. Read `plan-attack-dispatch.md` and `plan-smell-dispatch.md` from this skill directory (parallel reads).
2. In each template, substitute `[PLAN_FILE_PATH]` with the absolute path to the plan document.
3. Launch two Agent subagents in parallel (in a single message), one per substituted template. Use the default general-purpose agent — do NOT set `subagent_type` to `feature-dev:code-reviewer` or any typed agent.
4. Wait for both to complete.
5. Read both reports and synthesize a single combined implementation risk level — this is a judgment call, not a formula. Consider how findings from both reports interact and compound.
6. Present to the human:
   - The combined implementation risk level (Low / Moderate / Significant / High)
   - 3–5 statements explaining why this level was chosen
   - The human's four options: proceed, proceed with directed mitigations, return to design with additional requirements, or stop
7. Write the combined threat report to the `plan/` subdirectory as `{sprint-name}-plan-threat-report-00.md` (see `util-artifact-schema`).
8. Wait for the human's decision. Do not auto-trigger any action.
```

Net changes: step 1 rewritten (read dispatch templates, not skill files), step 2 rewritten (substitute placeholder, not embed skill content), step 3 rewritten (launch per substituted template). New steps 4–8 are identical to today's steps 3–7 plus the renumber.

### Files explicitly not changed

- `skills/plan-attack/SKILL.md` — remains a standalone, interactive skill. No `## Role` section, no trim. Its existing Step 1 (lines 20-27: "The user will either point to a file, or have just finished planning…") already handles dispatch correctly from the subagent's perspective: when the subagent receives a pre-filled dispatch prompt, the plan path is already present and Step 1 has nothing to resolve.
- `skills/plan-smell/SKILL.md` — same rationale (Step 1 at lines 39-46).
- `skills/plan-build/plan-reviewer.md` — already the canonical pattern; no change.
- `skills/setup-start/SKILL.md` — `plan-attack` and `plan-smell` remain listed (lines 261-262) with unchanged descriptions; no entry needs updating.
- All `execute-*`, `design-*`, `finish-*`, `util-*` skills — unaffected.

## Data Flow

```
plan-build/SKILL.md (Plan Hardening step 1)
    ↓ parallel reads
plan-attack-dispatch.md, plan-smell-dispatch.md
    ↓ placeholder substitution ([PLAN_FILE_PATH] → resolved absolute path)
Task tool (general-purpose) × 2 (parallel, single message)
    ↓ subagent execution
findings + risk assessment (returned inline)
    ↓
plan-build (synthesis, human gate, threat report write)
```

No persisted state between dispatches. No new artifacts during hardening (threat report path unchanged — `util-artifact-schema` is authoritative).

## Error Handling

**Dispatch template read failure** (file missing or unreadable): `plan-build` surfaces the error and halts. Recovery is a Chester-install-level concern, not a runtime concern.

**Placeholder substitution failure** (empty `[PLAN_FILE_PATH]`): impossible in normal flow since `plan-build` has the plan path in scope from the preceding write step. If encountered, treat as a `plan-build` bug.

**Subagent failure** (timeout, malformed output): same behavior as today — `plan-build` synthesizes whatever reports were returned and notes the gap in the human-facing presentation. No change to existing handling.

**Content drift between lens `SKILL.md` and dispatch template:** The evidence standard and output format are held verbatim across both documents. Keeping them in sync is a manual discipline — the spec does not introduce automated validation. See Constraints.

## Testing Strategy

This is a prose-file refactor with no executable test target. Verification is three-step:

1. **Cold-read test.** After writing the two dispatch templates, read each one standalone and confirm a subagent receiving it as their full prompt would know what to check, how to cite evidence, and what output format to produce — without access to the lens `SKILL.md`.

2. **End-to-end dry run.** Identify one existing plan artifact in `docs/chester/plans/` (any recent sprint with a plan document). Walk the rewritten Plan Hardening section as if dispatching — confirm: dispatch templates are found, placeholder substitution yields a valid prompt, the Task tool call would succeed, and outputs synthesize into the existing threat-report structure. This is a manual walkthrough, not an automated test.

3. **Regression check on fidelity.** Verify that `plan-reviewer.md` and the Plan Review Loop section of `plan-build/SKILL.md` were not touched. A diff of both files against pre-refactor state should show zero changes.

4. **Verbatim-content check.** For each of the four content regions copied from a lens (attack what-to-check, attack evidence+output, smell what-to-check, smell evidence+output), diff the dispatch template region against the referenced line range in the lens `SKILL.md`. The text must match modulo markdown heading level and the subagent-prompt indentation of the fenced block. Any divergence is a bug.

No bash tests are added. The existing `tests/` suite covers hook/config behavior; plan-review dispatch is not covered there today and the refactor does not change what would be testable.

## Constraints

1. **Lens content must not be split.** The attack and smell lens `SKILL.md` files stay intact as standalone interactive skills. Only their subagent-facing dispatch prompts are extracted.
2. **Dispatch templates live in `skills/plan-build/`.** They are plan-build's artifacts, not the lenses'. This matches `plan-reviewer.md`'s location.
3. **Placeholder protocol is `[PLAN_FILE_PATH]`.** Bracketed uppercase snake-case, matching `plan-reviewer.md`. One placeholder per template.
4. **General-purpose agent type only.** Do not set `subagent_type`. No `feature-dev:code-reviewer`. Preserved from today's hardening instruction.
5. **Verbatim copy of evidence standard and output guidance.** Copy from the lens `SKILL.md` at the specified line ranges. Do not rewrite, tighten, or add structure the lens does not mandate — in particular, do not impose a severity taxonomy on output (the lens explicitly rejects this). Do not drop bullets (e.g., plan-smell's "explicitly acknowledged risk" clause is load-bearing). This constraint is verified by the Verbatim-content check in Testing Strategy.
6. **Dual-source content sync is a manual discipline.** If the evidence standard or output format in `plan-attack/SKILL.md` or `plan-smell/SKILL.md` changes, the corresponding dispatch template must be updated in the same commit. A one-line note at the very top of each dispatch template (above the one-line purpose) reminds readers: *"Evidence standard and output format are sourced verbatim from `plan-attack/SKILL.md` — update both files together."* (Adjust filename per lens.)
7. **No new artifact types.** `util-artifact-schema` is unchanged. Threat-report path and naming preserved.
8. **No changes to Plan Review Loop.** The fidelity reviewer and its loop logic are untouched.

## Non-Goals

- **Not merging the three lenses.** Fidelity, attack, smell stay distinct — operating on different input surfaces (spec+plan / plan+code / plan+future-code).
- **Not removing the fidelity review loop.** Iterate-until-approved with max 3 stays as today.
- **Not creating a registry / dispatch-reference doc.** Three lenses do not justify a fourth coordinating file.
- **Not creating a new `util-*` skill.** No `util-review-launchpad` is introduced; the two dispatch templates live next to `plan-reviewer.md` in the plan-build skill directory.
- **Not adding `## Role` cross-reference sections to `plan-attack`/`plan-smell`.** Their existing Step 1 language is adequate for both invocation modes. Adding cross-references would create a bidirectional link that must stay synced with no corresponding quality benefit.
- **Not touching `design-specify/ground-truth-reviewer.md` or any other skill's dispatch mechanism.** Even though ground-truth-reviewer is the pattern precedent, unifying it with plan-build's dispatch templates is out of scope.
- **Not implementing Phase B** (conditional parallelization of iteration-2 fidelity with hardening). Gated on measurement that does not exist yet. Phase B is a separate future sprint.
- **Not instrumenting threat reports** with a `rewrite_required` field. That is Phase B prep and is deferred.
- **Not deleting `skills/plan-attack/SKILL.md.bak`.** Housekeeping unrelated to this refactor.
- **Not imposing a severity taxonomy** on dispatch-template output. Both lenses explicitly reject this and the dispatch templates preserve the "whatever feels natural / group by root cause" guidance verbatim.
- **Not adding bash tests.** The refactor's correctness is verifiable by cold-read and dry-run; no runtime behavior to assert.
- **Not documenting the refactor in CLAUDE.md's "Working on Skills" section.** The existing guidance ("the `description` frontmatter field and the skill's entry in `setup-start` must stay in sync") already covers the general sync-discipline principle; adding a dispatch-template-specific rule is premature given this is the second instance of the pattern (after `plan-reviewer.md`).

## Out of Scope Rationale

The non-goals list is long because the conversation that produced this spec explicitly considered and rejected several adjacent expansions. Each non-goal exists because the agent or a reviewer could reasonably flag its absence as a gap — it isn't. Summarized:

- **Lens-content forking vs. embedding** — the chosen approach forks into a purpose-built dispatch prompt but does not fork the lens skill itself. The dispatch prompt is *copied from* the lens at write time, not re-authored. This is intentional; the lens remains standalone-invocable and the dispatch template stays lens-faithful.
- **Registry and `## Role` sections** — deferred because the overhead outweighs the benefit at three lenses. Revisit at 4+ lenses.
- **Phase B parallelization** — a genuine future sprint, properly scoped to avoid over-commitment before data exists.
- **Cross-cutting unification with `ground-truth-reviewer`** — tempting but premature; two instances of a pattern do not justify abstraction.
- **Severity taxonomy in dispatch output** — the lenses explicitly reject this. Imposing one would be a deliberate departure from the lens; we choose fidelity over tighter output schemas.

## Acceptance Criteria

1. `skills/plan-build/plan-attack-dispatch.md` exists. Its subagent prompt contains `[PLAN_FILE_PATH]` placeholder, a role statement, the five attack dimensions, the evidence standard, and output guidance.
2. `skills/plan-build/plan-smell-dispatch.md` exists with the analogous structure for smell.
3. `skills/plan-build/SKILL.md` Plan Hardening section's first three steps reference the dispatch templates and placeholder substitution. New steps 4–8 (synthesis, human gate, threat report, wait) are identical to today's steps 3–7.
4. `skills/plan-attack/SKILL.md`, `skills/plan-smell/SKILL.md`, `skills/plan-build/plan-reviewer.md`, `skills/plan-build/SKILL.md` Plan Review Loop section, and `skills/setup-start/SKILL.md` are unchanged.
5. A cold-read of either dispatch template — without reference to the lens `SKILL.md` — tells a subagent what to check, how to cite evidence, and what output format to produce.
6. Each dispatch template contains a one-line sync-discipline reminder at the very top of the file (above the purpose line).
7. **Verbatim-content check passes:** for each of the four copied content regions (attack what-to-check, attack evidence+output, smell what-to-check, smell evidence+output), the dispatch template text matches the referenced lens line range modulo markdown heading level and fenced-block indentation. No paraphrasing, no bullet dropping, no taxonomy imposition.

## Downstream Effects

- **`plan-build`'s budget-guard reminder** stays active before dispatching attack and smell (expensive parallel calls).
- **Phase B future work** gains a cleaner starting point: conditional parallelization logic would wrap the dispatch steps without touching the templates themselves.
- **Ground-truth reviewer unification** becomes a candidate future refactor at the point where a third instance of the dispatch-template pattern emerges. Not now.
