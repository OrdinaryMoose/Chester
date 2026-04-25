# Feature Definition Brief: Chester Codex — Persistent Code-Derived Design Knowledge

**Status:** Pending (Proposal)
**Date:** 2026-04-23
**Related systems:** `design-experimental`, `design-small-task`, `chester-design-proof` MCP, `finish-archive-artifacts`, `util-artifact-schema`
**Related briefs:** `solution-design-language-kb-00.md` (see Relationship section)

---

## Purpose of this document

Capture a design conversation exploring a new Chester capability: a **codex** — a persistent, code-derived, proof-grammar-structured knowledge layer that the design phase reads from and the finish phase writes back to. The codex lives in a Chester-using project's tracked artifacts alongside `plans/` and sits above code, not beside it.

Scope here: problem, grammar, format, lifecycle, phased implementation. A sample format draft already exists at `docs/chester/working/codex-format-draft-v1.md` with four worked entries using proof-MCP grammar.

Out of scope here: implementation. Downstream session executes from this brief, starting with a hand-written v0 for Chester itself.

---

## Problem Statement

Chester's design phase investigates a codebase from scratch on every invocation. The understanding MCP scores 9 dimensions of saturation, the proof MCP builds a structural argument, and both start with no prior state about what the codebase *means* in domain terms. Every session re-derives the same foundational facts: what a Sprint is, how working and plans directories differ, why proof state must survive compaction, what the design brief contract promises plan-build.

This produces three compounding costs:

- **Wasteful** — the same codebase, the same concepts, rediscovered every session from the same code.
- **Stochastic** — two sessions covering overlapping concepts will express them in different terms, score different dimensions first, follow different paths, and arrive at different grounding sets.
- **Unaccumulating** — nothing a session learns about the codebase's design-level shape persists for the next session. Each design is built on bare code.

Meanwhile, sprint artifacts *do* accumulate — but they accumulate **decision history**, not **code-level truth**. A sprint brief tells you why a decision was made; it does not tell you what the codebase *currently is*. Decision history is the job of prior-art search. Codebase truth needs its own home.

The proof MCP's `EVIDENCE` element type requires codebase-sourced verifiable statements. Today these are hand-constructed from fresh code reads every session. There is no stable, reusable vocabulary the proof can cite when referencing a design-level fact.

**The gap:** a persistent, proof-grammar-structured knowledge layer that every `design-experimental` and `design-small-task` session can preload into its sprint proof, extend for the decision at hand, and promote refined claims back into at finish time.

### Prior attempts

First attempt at this specific concept inside Chester. The `solution-design-language-kb-00.md` pending brief (same date) proposes a heavier, project-scoped variant with a dedicated MCP server and JSON-per-concept schema. That brief was scoped to StoryDesigner specifically. This brief explores the minimal viable form of the same broad idea, scoped to Chester itself first, with the expectation that a lightweight Chester-internal codex validates the approach before any project-scoped MCP infrastructure is built.

---

## Relationship to `solution-design-language-kb-00.md`

Both briefs target the same core problem: "design phase re-derives codebase knowledge from scratch every session." They differ in three load-bearing ways:

| Dimension | This brief (codex) | `solution-design-language-kb` |
|---|---|---|
| Scope of first target | Chester's own codebase | StoryDesigner |
| Storage | Markdown file with YAML frontmatter | Per-concept JSON, one schema per kind |
| Interface | File + grep; optional MCP later | New MCP server, cloned from proof-mcp |
| Grammar size | Two element types (EVIDENCE, NECESSARY_CONDITION) + free-form `kind` subtype | Closed enum of ~8-10 concept kinds + 30-40 predicates |
| Verification | Optional drift-scan skill, future work | `verification_signal` typed enum on every concept |
| Authoring cost to v0 | ~3-6 hours manual (15-20 entries about Chester itself) | 12-20 hours (Phase 0 + Phase 1) |

The two are **compatible**, not competing. This codex proposal could serve as a v0 that validates the proof-grammar-as-persistent-knowledge premise on a smaller, self-referential codebase (Chester) before the heavier KB machinery is built for a client project. If this codex succeeds, much of its content can migrate into the KB schema once the KB MCP lands; the grammar is already aligned.

**Decision required from downstream implementer or designer:** treat this brief as an independent lightweight variant, or as a Phase 0 learning lap for the larger KB design. Either framing works — this brief holds up on its own if the KB never ships.

---

## Current State Inventory

### `chester-design-proof` MCP (`skills/design-experimental/proof-mcp/`)

- Five element types: `EVIDENCE`, `RULE`, `PERMISSION`, `NECESSARY_CONDITION`, `RISK`. Defined at `proof-mcp/proof.js` around the `ELEMENT_TYPES` export.
- `NECESSARY_CONDITION` requires non-empty `grounding[]`, `collapse_test`, `reasoning_chain`.
- `EVIDENCE` requires non-`"designer"` source; `RULE`/`PERMISSION` require `"designer"` source.
- Structural integrity checks: `withdrawn-grounding`, `ungrounded-condition`, `missing-collapse-test`, `stale-grounding`. Structural validity only — semantic correctness is designer responsibility.
- State lives in a JSON file per sprint under the working directory. Preserved across compaction by PreCompact/PostCompact hooks.

### `design-experimental` skill (`skills/design-experimental/SKILL.md`)

- Phase 1 Understanding: nine-dimension saturation scoring via `chester-design-understanding` MCP. Agent explores codebase to raise scores.
- Phase 2 Proof Building: structural argument via proof MCP. Agent adds EVIDENCE/RULE/PERMISSION, derives NECESSARY_CONDITIONs.
- Finalization: human-directed collapse onto a defensible path. Generates brief.
- No persistent prior knowledge — each sprint starts with an empty proof graph.

### `design-small-task` skill (`skills/design-small-task/SKILL.md`)

- Lightweight design Q&A loop without full proof machinery.
- Produces a six-section brief via `util-design-brief-small-template`.
- Also starts from scratch; no prior knowledge layer.

### Working and plans directories (`docs/chester/working/`, `docs/chester/plans/`)

- Working: gitignored scratch space. Sprint artifacts live here in-flight.
- Plans: tracked. `finish-archive-artifacts` copies final artifacts from working to plans as one commit per sprint.
- Codex would live in tracked space (`docs/chester/codex/` or a single tracked file) — artifact, not scratch.

### `finish-archive-artifacts` skill (`skills/finish-archive-artifacts/SKILL.md`)

- Final-before-close step of the finish phase. Copies working/sprint artifacts to plans/sprint and commits.
- Natural hook point for codex update: after archive, before close, scan sprint proof for promotable claims.

### Sprint artifacts already capture decision history, not code truth

- Design brief: envelope + point for one decision. Per-sprint.
- Thinking summary: reasoning process. Per-sprint.
- Plan, spec, audit, summary: all per-sprint.
- None accumulate code-level truth across sprints. That's the codex's job.

### `solution-design-language-kb-00.md` (sibling pending brief)

- Heavier variant of same idea. Detailed schema, MCP server, project-scoped to StoryDesigner.
- Relationship covered above. Treated as compatible reference, not precondition.

---

## Governing Constraints

- **Proof MCP grammar is fixed.** Codex cannot invent new element types. Must express every durable claim as `EVIDENCE` or `NECESSARY_CONDITION`. `RULE`, `PERMISSION`, `RISK` are sprint-scoped by definition and do not live in the codex.
- **Design brief contract is fixed.** Whether a design session preloads codex nodes or not, it still emits a brief in the current format. Plan-build consumes brief unchanged.
- **Working/plans directory split is fixed.** Codex is tracked, lives adjacent to plans. Never in working.
- **Sprint naming convention is fixed.** Codex entries referencing sprints (via `added`/`updated` fields) use standard `YYYYMMDD-##-verb-noun-noun` format.
- **Finish-archive-artifacts is the single tracked-artifact boundary per sprint.** Codex updates must land in the same commit; cannot be a separate post-sprint operation.
- **The design-experimental Understanding and Proof phases stay structurally intact.** Codex changes **what** preloads into the proof graph, not **how** Phase 1 or Phase 2 operate. The nine-dimension saturation model, the proof validation rules, the Finalization collapse — all unchanged.
- **No new MCP server in v0.** File-based first. MCP server is future work if file-based proves insufficient.

---

## Design Direction

### Grammar: durable subset of proof MCP

Codex entries use `type: EVIDENCE` or `type: NECESSARY_CONDITION`. No other types. Rationale: the other three proof types (`RULE`, `PERMISSION`, `RISK`) are sprint-scoped — designer declarations for one decision — and do not describe the codebase. They have no durable form.

`NECESSARY_CONDITION` entries carry `grounding[]`, `collapse_test`, and `reasoning_chain` exactly as proof MCP requires. This means codex entries can be loaded directly into a sprint proof without translation.

### Reader affordance: free-form `kind` subtype

Since two structural types is thin for reading comprehension, entries carry an optional `kind:` field with free-form string values. Recommended vocabulary: `entity`, `relation`, `boundary`, `actor`, `schema`, `process`, `invariant`, `flow`.

`kind` drives nothing structurally — no validator, no different update semantics. It signals to a reader what shape of knowledge the entry describes. A concept like "Sprint" is `kind: entity`; a concept like "Design-to-plan handoff" is `kind: relation`; a concept like "Working vs plans directory split" is `kind: boundary`. Same underlying `type: EVIDENCE`, different reader expectation.

Free-form rather than enum because the vocabulary is expected to drift during v0 authoring. Controlled vocabulary can be introduced later once the useful set stabilizes.

### Storage: file-based Markdown with YAML frontmatter

Each codex entry: YAML frontmatter between `---` fences, followed by Markdown body. Multiple entries in one file separated by blank lines. Matches Chester's existing SKILL.md convention — no new format to learn.

Single-file for v0 (`docs/chester/codex/CODEX.md` or equivalent). Split into per-kind files when the single file exceeds ~2000 lines or scrolling becomes painful. Do not split preemptively; splitting adds cross-file reference complexity.

File-based chosen over MCP server for v0 for five reasons:

1. Content shape is unsettled. File iteration is minutes; MCP schema + server iteration is hours per change.
2. Codex is a human-curated artifact. File-edit-commit workflow is native; MCP state is opaque to humans without tooling.
3. Git diffs land naturally in PR review. Reviewers catch wrong codex edits alongside code edits.
4. Grep works. Design phase can ask "what do we have on X?" with a single shell command.
5. Migration to MCP remains open. File-based v0 informs the real schema when MCP becomes worth building.

### Lifecycle

**Bootstrap (one-time).** A human-written v0 for Chester's own codebase, targeting 15-20 entries covering the largest concepts (Sprint, Design Brief, Proof MCP, Working/Plans split, Config Resolution, Compaction Preservation, Sprint Naming, Plan-build Handoff, Codex itself, etc.). Hand-authored so the authoring exercise teaches the real format pressure points before any automation is built. No bootstrap skill until the file format is known-good.

**Preload (design phase).** `design-experimental` Phase 1 (and `design-small-task` analog) reads the codex, identifies likely-relevant entries via tags and keywords, and loads them into the sprint proof graph as preloaded `EVIDENCE`/`NECESSARY_CONDITION` nodes marked with a provenance tag (e.g., `source: "codex:<id>@<revision>"`). Saturation scoring operates with these nodes already present — Phase 1 gaps are what's missing from *codex-plus-task-specific-exploration*, not what's missing from blank slate.

**Extension (design phase).** Normal proof building runs on the combined graph. Sprint-specific RULEs, PERMISSIONs, RISKs attach as today. NECESSARY_CONDITIONs can ground into codex-preloaded EVIDENCE. Contradictions surface via normal proof validation — a codex node being contradicted mid-proof marks it for human review at finish.

**Promotion (finish phase).** A new skill — `finish-update-codex` — runs after `finish-archive-artifacts` (or folded into it). Scans the sprint's collapsed proof for:

- Codex-backed nodes that were contradicted or revised mid-proof → propose codex edit.
- Sprint-local EVIDENCE/NECESSARY_CONDITION representing durable codebase truth (not decision-specific) → propose promotion.
- Sprint-local nodes that are decision-specific → leave in sprint artifacts, not promoted.

All proposals are human-approved. No silent codex updates. Updates commit in the same commit as `finish-archive-artifacts`.

**Verification (optional, later).** A `util-codex-verify` skill scans the codex, samples verifiable claims, and checks them against current code via grep/parser. Flags drift by setting `status: needs-reverification` on stale entries. Not part of v0 — needed only once non-Chester edits start bypassing the update loop.

### Format

Required frontmatter: `id`, `type`, `title`. For `NECESSARY_CONDITION`: `grounding`, `collapse_test`, `reasoning_chain` additionally required (matches proof MCP validation).

Optional frontmatter: `kind`, `tags`, `realized-by`, `related`, `status` (default `proven`), `added`, `updated`.

Body: prose. Lead paragraph = what the thing is and why it exists, in domain language. Class names and method names do not appear in body — they live in `realized-by`. This keeps the body readable in design language while preserving code-pointer traceability.

Format draft with four worked entries at `docs/chester/working/codex-format-draft-v1.md`. Reviewer-ready. Demonstrates EVIDENCE-entity, NECESSARY_CONDITION-invariant, EVIDENCE-boundary, NECESSARY_CONDITION-with-multi-grounding shapes.

### Skills surface

Proposed skills (in implementation order, not all required for v0):

1. **No new skill for v0 authoring.** Hand-write the initial codex directly. Bootstrap skill waits until authoring pain is measured.
2. **Edit `design-experimental`** Phase 1: preload relevant codex entries into sprint proof. Small skill change; biggest leverage.
3. **Edit `design-small-task`** analog: same preload behavior, scaled to lighter flow.
4. **`finish-update-codex`** (new): diff-driven codex update after sprint collapse.
5. **`util-codex-verify`** (new, later): drift-scan on demand.
6. **`util-codex-bootstrap`** (new, much later): subagent-assisted codex seeding for new Chester projects. Only useful once codex content patterns are known.

### Sample entries (from `codex-format-draft-v1.md`)

Four entries already drafted demonstrate the format across all structural + kind combinations:

- `sprint` — `type: EVIDENCE, kind: entity`. Plain concept node.
- `sprint-name-format` — `type: NECESSARY_CONDITION, kind: invariant`. Single grounding.
- `working-vs-plans-directory` — `type: EVIDENCE, kind: boundary`. Shows rationale-carrying relation.
- `proof-state-survives-compaction` — `type: NECESSARY_CONDITION, kind: invariant`. Multi-node grounding.

See the format draft file for full content. The act of writing these four surfaced several real pressure points (see Open Concerns).

---

## Open Concerns

- **YAML fences: bare `---` vs fenced code blocks.** Bare fences parse cleanly with YAML tooling but render as `<hr>` in Markdown renderers, making the file visually broken on GitHub. Fenced code blocks render cleanly but require a parser to strip fences. The format draft uses fenced blocks. Bare fences might win once a parser exists; today, fenced reads better. Decide before v0 ships.
- **Single file vs per-entry directory.** Single `CODEX.md` is proposed for v0; per-entry files (`codex/sprint.md`, `codex/working-vs-plans-directory.md`) are the alternative. Per-entry wins on git diffs and obvious stable-IDs-from-filenames; single wins on scrolling and grep. Small-v0 leans single; large-v1 may migrate.
- **Grounding references across files.** If per-entry layout is chosen, does `grounding: [sprint]` refer to `codex/sprint.md` by filename or to the `id:` field inside it? Match-to-filename is cleanest, mirrors skills convention.
- **Bootstrap sprint formality.** Does writing codex v0 run as a formal Chester sprint (design-experimental → plan → execute → finish) or as a one-off authoring pass? One-off is faster and avoids recursion (sprint producing codex needs codex preloaded, which doesn't exist yet). Formal sprint is consistent with Chester's self-application ethos but likely premature.
- **`kind` vocabulary lock.** Start free-form or lock a vocabulary now? Free-form chosen here; if drift produces 30 distinct `kind` values in v0, lock later.
- **Preload selection heuristic.** How does design-experimental Phase 1 decide which codex entries to preload? Tag match on task description is the cheap first cut. LLM-based relevance scoring deferred. Must not preload the entire codex into every proof (noise floods the graph).
- **Contradiction semantics during proof building.** When a sprint proof contradicts a preloaded codex node mid-session, what's the live behavior? Options: (a) block and force adjudication, (b) fork a "sprint-local override" of the node, (c) mark contested and continue. Option (c) is lightest; codex update at finish reconciles. Option (a) interrupts flow. Option (b) complicates the proof graph.
- **Provenance marking on preloaded nodes.** Proof MCP's `source` field for EVIDENCE cannot be `"designer"`. Codex-sourced EVIDENCE needs a provenance value — `"codex:<id>@<rev>"` proposed, but proof MCP validator must accept it. Small MCP change required: relax the source-value check to allow a codex-namespaced string.
- **Codex update atomicity with commits.** `finish-update-codex` runs before or after `finish-archive-artifacts`? If after, they're two commits; if before, single commit but update step must be robust (aborting update leaves uncommitted state). Propose: fold update into `finish-archive-artifacts` so the commit carries code + sprint artifacts + codex delta as one atomic change.
- **Version/revision tracking on codex entries.** Should each entry carry an integer `revision` that bumps on edit, so `stale-grounding` style checks can fire in proof MCP when a cited codex node's revision differs from what was cited? Matches the solution-design-language-kb brief's approach; adds bookkeeping overhead.

---

## Phased implementation path

### Phase 0 — Format validation (no code, ~2-3 hours)

- Review `docs/chester/working/codex-format-draft-v1.md`.
- Resolve open concerns 1-3 (fences, layout, grounding refs).
- Lock v0 format spec.
- Move draft from working/ to tracked location as `docs/chester/codex/README.md` (format documentation) with zero entries yet.

Exit: format spec is committed. Anyone reading the README knows how to write a codex entry.

### Phase 1 — Hand-written codex v0 (authoring, ~4-8 hours)

- Target 15-20 entries covering Chester's largest concepts (list in Design Direction → Bootstrap).
- Drop the four existing draft entries into v0 as starting content (after format is locked).
- Validate: every `grounding` reference resolves to an entry in the codex. Every `realized-by` path exists.

Exit: `docs/chester/codex/CODEX.md` (or per-entry files) committed with v0 content. Dangling-reference count = 0.

### Phase 2 — Design phase preload integration (engineering, ~3-5 hours)

- Edit `design-experimental` Phase 1 to preload relevant codex entries into sprint proof.
- Edit `design-small-task` analogously.
- Proof MCP small change: accept `source: "codex:..."` for EVIDENCE.
- Test: run one real design-experimental session on a Chester sprint that touches codex-documented concepts. Observe whether Phase 1 saturation scoring shifts, whether proof building cites codex nodes, whether the session feels grounded.

Exit: design sessions visibly benefit from the codex. Measurable shift in Phase 1 time-to-saturation or proof size.

### Phase 3 — Finish-phase update loop (engineering, ~4-6 hours)

- Build `finish-update-codex` skill. Diff sprint proof against codex. Propose edits and promotions. Human approves each.
- Integrate with `finish-archive-artifacts` so codex delta lands in the same commit.
- Resolve open concerns 7-10 (contradiction semantics, provenance, atomicity, revisions).

Exit: one full sprint runs the cycle — preload → design → plan → execute → finish with codex update. Codex grows by at least one entry or one revision. Commit history clean.

### Phase 4 — Verification and drift (engineering, ~3-5 hours, later)

- Build `util-codex-verify`. Samples verifiable claims, greps/parses code, flags drift.
- Runs on demand and optionally on a cron-like schedule via `/loop`.

Exit: drift is detectable without waiting for a sprint to touch the affected area.

### Phase 5 — Bootstrap skill (much later, optional)

- `util-codex-bootstrap` — subagent-assisted seeding for new Chester-using projects.
- Only useful once authoring patterns for codex are well understood across 2+ projects.

Exit: a new Chester project can seed a v0 codex in under an hour.

**To functional integration: Phases 0-3, ~13-22 hours spread across sessions.** Most of this is authoring, not engineering.

---

## Acceptance Criteria

- A codex file (or directory) exists at `docs/chester/codex/`, tracked, containing at least 15 v0 entries about Chester.
- Every codex entry validates: required frontmatter present, `NECESSARY_CONDITION` entries carry `grounding`, `collapse_test`, `reasoning_chain`. No dangling `grounding` or `related` references.
- `design-experimental` Phase 1 preloads codex entries relevant to the sprint task into the sprint proof graph.
- `design-small-task` preloads similarly, scaled to its lighter flow.
- `chester-design-proof` MCP accepts codex-sourced EVIDENCE with a `codex:` provenance string.
- `finish-update-codex` runs as part of (or immediately before) `finish-archive-artifacts` on any sprint that touches codex-backed concepts. Human approves each proposed codex edit.
- One full sprint after Phase 3 completion demonstrates the cycle end-to-end: preload, extend, collapse, promote, commit.
- Codex entries remain readable in design language — no class names or method signatures inside entry bodies.

---

## Handoff pointers

1. Format draft with four worked entries: `docs/chester/working/codex-format-draft-v1.md`. Read first — faster than reading this brief's format section in prose.
2. Sibling brief (heavier, project-scoped variant): `docs/feature-definition/Pending/solution-design-language-kb-00.md`. Read to understand the larger design space this brief carves a narrow slice out of.
3. Proof MCP source: `skills/design-experimental/proof-mcp/` — grammar definitions live in `proof.js` (`ELEMENT_TYPES`, validation rules) and `state.js` (ID prefixes, status transitions). Any codex grammar question resolves against these files.
4. Existing pending briefs: `compaction-hooks.md`, `design-proof-system-conop-00.md`, `spec-stage-ground-truth-review.md`. Skim for Chester's house style of brief writing.
5. Artifact schema reference: `skills/util-artifact-schema/SKILL.md`. Tracks where Chester artifacts live, how they're named. Codex is a new artifact category — its entry in that schema needs updating in Phase 1.

---

## Key insights worth preserving

- **Proof MCP's durable type subset is the codex.** Not a parallel ontology. Two types out of five (EVIDENCE, NECESSARY_CONDITION) survive outside a single design session; the other three (RULE, PERMISSION, RISK) are sprint-scoped by definition. This realization is the simplification that makes the whole design tractable.
- **Free-form `kind` beats inventing structural types.** Concept, relation, boundary, actor, schema, process, invariant — all collapse into EVIDENCE with a subtype tag. Adding structural types would have required separate update rules per type; the tag approach delivers reader affordance at zero update-logic cost.
- **File-based v0 is not a compromise — it's a forcing function.** Writing the four sample entries surfaced real pressure points (provenance marking, fence rendering, grounding references) that an MCP-first approach would have locked in before they were visible.
- **Prior-art search and codex are complementary, not overlapping.** Prior-art search answers "what decisions did we make?" Codex answers "what is true about the code?" Conflating them produces a codex full of decision history that rots the moment decisions are revisited.
- **The design phase doesn't gain a new ceremony.** Preloading codex nodes extends the existing proof graph; there's no "first consult codex, then build proof" step. Design agents who already think in proof grammar find codex entries in their hands from the first tool call.
- **Finish-update-codex is the entire update story.** No separate "codex maintenance" workflow. Updates attach to sprint commits. Non-sprint drift is handled later by `util-codex-verify` — but that's a backstop, not the main loop.

---

## What NOT to do first

- Do NOT build an MCP server before v0 has been hand-written and used. The schema isn't known yet; premature MCP locks in the wrong schema.
- Do NOT try to preload the entire codex into every sprint proof. Tag-based relevance filtering is required; floodloading destroys the proof graph's signal.
- Do NOT put decision rationale into codex entries. Codex describes what *is*, not *why*. Rationale lives in sprint briefs and prior-art.
- Do NOT automate promotion from sprint proof to codex without human review. Silent promotion produces codex bloat and wrong durability classifications.
- Do NOT use codex to replace code reads. Codex is the **first stop**, not the **only stop**. When codex is silent on a needed concept, code is the fallback; gap surfaces to finish-update-codex as a promotion candidate.
- Do NOT merge this brief's codex with the heavier `solution-design-language-kb-00.md` KB until both have shipped v0 in their respective scopes. Forcing early alignment produces neither.
