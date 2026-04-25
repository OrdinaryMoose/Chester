# Feature Definition Brief: Solution-Scoped Design Language KB — Phase 0 (Vocabulary & Schema)

**Status:** Pending (Proposal)
**Date:** 2026-04-23
**Parent brief:** `solution-design-language-kb-00.md` (full multi-phase proposal)
**Scope:** Phase 0 only — vocabulary and schema design. Phases 1–5 deferred.
**Related systems:** `design-experimental` skill, `chester-design-proof` MCP, `chester-design-understanding` MCP

---

## Purpose of this document

Carve out Phase 0 from the parent KB proposal as a standalone, executable feature. Phase 0 produces no MCP server, no authored catalog, no skill changes — only the schemas, vocabularies, and authoring rules that every later phase consumes. Treat Phase 0 as real design work: its output is the load-bearing artifact for the whole KB initiative.

Out of scope here: Phase 1 backbone authoring, Phase 2 MCP server, Phase 3 integration with `design-experimental`, Phase 4 catalog scale-out, Phase 5 extraction assistance. Those each become their own briefs after Phase 0 exits.

---

## Problem Statement

The parent brief's four worked KB entries demonstrated the exact failure mode the vocabulary layer is meant to prevent. In four entries, authored in a single sitting:

- Sixteen distinct predicates appeared; roughly five were synonyms (`emitsType` vs `producesType`, `hostedByProject` vs `residesIn`). One entry (`save-gate`) used both `producesType` and `emitsType` without consolidation.
- Code anchors appeared in three different shapes inside the same entry: file paths, fully-qualified type names, and project-relative short paths. No canonical form was enforced.
- Descriptions leaked tense discipline ("scheduled to relocate," "previously") that the schema is supposed to forbid.

These are not authoring mistakes. They are the predictable output of an un-pinned vocabulary. Every downstream phase — authoring the 30-concept backbone (Phase 1), building the MCP indices (Phase 2), wiring disagreement detection into `design-experimental` (Phase 3) — amplifies the cost of vocabulary drift. Silent disagreement-detection failure is the worst failure mode the system can have: a KB claim and an explorer finding that should conflict but don't, because the predicate or canonical form doesn't line up.

**The gap:** a pinned predicate vocabulary, a pinned canonical-form specification per anchor kind, per-kind JSON Schemas, and an authoring-rules document — validated by re-drafting the four worked entries without requiring a single escape hatch.

### Prior attempts

First attempt. The parent brief's four-entry exercise is the closest prior work. It served as empirical input to Phase 0's design surface; it is not itself a Phase 0 deliverable.

---

## Current State Inventory

### Parent brief (`docs/feature-definition/Pending/solution-design-language-kb-00.md`)

- Lines 36–61 — proof MCP and understanding MCP vocabulary reference (unchanged by Phase 0; consumed as constraint)
- Lines 103–119 — proposed per-concept field list; Phase 0 must freeze this into a schema
- Lines 121–135 — predicate vocabulary starter set (~16 predicates, marked for consolidation)
- Lines 140–149 — canonical subject form rules per anchor kind (stated but not formally specified)
- Lines 152–158 — per-kind hook templates sketched
- Lines 162–333 — four worked entries that Phase 0's exit test re-drafts
- Lines 368–383 — Phase 0 deliverables list and exit criterion (this brief operationalizes that)

### Proof MCP (`.mcp.json` → `chester-design-proof`)

- Defines EVIDENCE / RULE / PERMISSION / NECESSARY_CONDITION / RISK element types; integrity checks `withdrawn-grounding`, `ungrounded-condition`, `missing-collapse-test`, `stale-grounding`.
- EVIDENCE `source` field is the coupling point: Phase 0 must specify the exact `source` string format for KB citations (`kb:<concept_id>#<field_path>`) so Phase 3 can wire it without re-specification.

### Understanding MCP (`.mcp.json` → `chester-design-understanding`)

- Nine-dimension saturation scoring, weighted Landscape/Human Context/Foundations.
- Phase 0's per-kind hook templates must name dimensions using the exact dimension IDs the understanding MCP exposes. Drift here silently breaks Phase 3's `director_dimension_prompts(concept_ids, dimension)` call.

### Parent brief's four worked entries (the exit-test corpus)

- `project/story.compiler.contracts` — exercises `Project` kind, project/file anchors, five predicates
- `invariant/no-dsl-span-types-in-compiler-contracts` — exercises `Invariant` kind, test/file anchors, `test_passes` verification signal
- `capability/save-gate` — exercises `Capability` kind, four anchors, seven predicates, `interface_has_implementation` verification signal
- `artifact/unifieddiagnostic` — exercises `Artifact` kind, type/file anchors, `fieldType` predicate, `type_exists` verification signal

These entries together cover ~11 unique predicates post-consolidation, four concept-kinds, four anchor-kind forms, and four verification-signal types. They do not cover `Tier`, `Boundary`, `Consumer`, `DataFlow`, `IdentityRule`, or `DiagnosticProducer` kinds. Phase 0 must specify schemas for those kinds even without worked examples; the exit test demonstrates sufficiency only for the covered subset.

---

## Governing Constraints

- **Proof MCP vocabulary is frozen.** Phase 0 produces Phase 3's citation format, not proof element-type changes. Element types, integrity checks, and `source` semantics remain as defined in `chester-design-proof`.
- **Understanding MCP dimension IDs are frozen.** Hook templates reference existing dimension IDs verbatim. If a dimension ID changes in the understanding MCP, hook templates break; that is acceptable coupling.
- **Parent brief's concept-kind set is the starting taxonomy.** Ten kinds: `Tier | Project | Capability | Boundary | Artifact | Consumer | DataFlow | IdentityRule | DiagnosticProducer | Invariant`. Kill criterion in parent brief: if backbone dangling-ref count cannot reach zero without adding more than six new kinds, taxonomy is wrong. Phase 0 may reduce or rename kinds; it may not expand beyond sixteen.
- **Typed anchors, not free strings.** Every anchor is `{kind, value}` where `kind` selects a canonical-form validator. Non-canonical anchors must be rejected at authoring time. This constraint is load-bearing and non-negotiable; it is the only defense against silent disagreement-detection loss.
- **Present-tense description discipline is a lint rule, not a convention.** Must be enforced by `scripts/kb-validate.mjs` on every entry. Forbidden tokens at minimum: `scheduled`, `was`, `previously`, `planned`, `will`, `currently being`. Designer discipline alone is insufficient; parent brief's own four-entry exercise already leaked tense.
- **Canonical direction only.** Each predicate is authored in one direction; the inverse is derived at query time. No entry may author both `hostsCapability` and `hostedByProject` for the same edge. Doubles the vocabulary and produces consistency bugs.
- **Phase 0 produces no running code in the target sense.** Deliverables are schemas, vocabularies, templates, rules, and a validator. No MCP server, no skill update, no concept authoring beyond the exit-test re-draft.

---

## Design Direction

Phase 0 produces a pinned vocabulary layer. Seven deliverables, each a concrete artifact on disk.

### 1. Predicate vocabulary (`kb/vocabulary/predicates.json`)

Final predicate list, target 30–40 entries. Each predicate carries:

- `id` — canonical name (e.g., `hostsCapability`)
- `direction` — `forward` only; inverse derived at query time with explicit `inverse_name`
- `source_kinds[]` — concept kinds that may appear as subject
- `target_kinds[]` — concept kinds that may appear as object
- `strictness_default` — `strict` | `advisory` | `transitional`
- `finding_flavor_mapping[]` — which explorer-finding flavors this predicate compares against for disagreement detection
- `description` — one-line semantic definition, present tense

Consolidation rule: if two predicates have overlapping `source_kinds × target_kinds` and similar semantics, they must be merged or given disjoint meaning. The exit test enforces this: re-drafted entries may not introduce new synonyms.

### 2. Concept-kind enum (`kb/vocabulary/kinds.json`)

Finalized kind list with per-kind documentation:

- `id` — kind name (e.g., `Capability`)
- `description` — one-line purpose
- `id_prefix` — slug prefix used in concept IDs (e.g., `capability/`)
- `required_fields[]` — schema fields required for this kind beyond the base schema
- `default_anchors[]` — anchor kinds typically populated for this kind
- `default_hook_dimensions[]` — dimension IDs this kind typically steers

Expected kind count: 8–10. The parent brief's ten-kind starting set is the upper bound; Phase 0 may collapse `Type` into `Artifact` (parent brief already did this, line 358) and should re-test whether `DiagnosticProducer` collapses into `Capability`.

### 3. Per-kind JSON Schemas (`kb/schema/<kind>.schema.json`)

One file per concept kind. Each schema extends a shared base schema defining: `id`, `kind`, `name`, `description`, `code_anchors[]`, `related_concepts[]`, `dimension_hooks`, `verification_signal`, `declined_alternatives[]`, `revision`, `revised_in_disagreement`, `contested_fields[]`.

The base schema enforces:

- `id` matches `^<kind-prefix>/[a-z0-9][a-z0-9.-]*$`
- `code_anchors[]` non-empty; every entry is a typed anchor
- `related_concepts[]` entries reference concept IDs matching the known-kinds regex (the validator checks dangling refs at catalog load, not schema time)
- `revision` is a non-negative integer

Per-kind schemas add kind-specific required fields and anchor-kind constraints.

### 4. Canonical subject form specification (`kb/vocabulary/canonical-forms.json`)

Per anchor kind, the format rule and validator regex:

- `file` — repo-relative path, forward slashes, matches `^[^/].*$` and must not contain `\\` or `./`
- `type` — fully-qualified type name, matches `^[A-Z][A-Za-z0-9_.]*\.[A-Z][A-Za-z0-9_`<>,]*$`
- `member` — FQN + member signature; exact format TBD in Phase 0
- `project` — matches `.csproj` basename without extension
- `test` — FQN + test method name, matches `^[A-Z][A-Za-z0-9_.]+\.[A-Za-z0-9_]+$`

Validator rejects any anchor whose `value` fails the regex for its declared `kind`. Silent detection loss is prevented here.

### 5. Per-kind hook templates (`kb/templates/<kind>.json`)

Default `dimension_hooks` skeleton per kind, per the parent brief (lines 152–158). Each template entry:

- `dimension` — dimension ID from understanding MCP
- `default_prompts[]` — investigation prompts filled with concept-specific data at inheritance time via `{{field}}` placeholders
- `inheritance_rule` — `always` | `if_absent`; controls whether concept-level hooks replace or merge with template hooks

Templates are optional; they cut authoring cost but are not required for a concept to be valid.

### 6. Authoring-rules document (`kb/vocabulary/authoring-rules.md`)

Human-readable rules for concept authors:

- Description tense discipline (forbidden token list)
- Canonical-form requirements per anchor kind
- Predicate selection flowchart (when to use `hostsCapability` vs `implementedBy`, etc.)
- Kind selection flowchart (when something is a `Capability` vs an `Artifact`)
- `declined_alternatives` authoring guidance (when to use, what to write)
- Dimension-hook sparsity principle (2–4 dimensions per concept is normal)

### 7. Validator (`scripts/kb-validate.mjs`)

Executable that reads every concept file under `kb/<kind>/*.json` and produces pass/fail with diagnostics. Checks:

- Schema conformance per kind
- Canonical-form compliance per anchor
- Description lint (forbidden tokens)
- Predicate existence against `predicates.json`
- Predicate direction uniqueness (no authoring both forward and inverse of same edge)
- Known-kinds for every concept ID in `related_concepts[]`
- Dangling references (referenced concept ID must resolve to an existing file)
- Orphan detection (concepts with zero incoming edges — advisory, not failing)

The validator is part of Phase 0 because Phase 1's exit gate (`dangling_refs_count == 0`) cannot be enforced without it, and Phase 2's MCP startup validation reuses the same checks.

### Phase 0 exit test

Re-draft the four worked entries from the parent brief against the Phase 0 schemas. Exit criterion is **not** "the entries validate" — it is **"the entries validate AND introduce zero predicate synonyms AND require zero escape hatches."**

If any entry needs a predicate not in `predicates.json`, add it and re-evaluate whether the addition is a synonym of an existing entry. If any entry needs a kind not in `kinds.json`, reconsider the taxonomy. If any description cannot be written in present tense without losing meaning, revise the tense rule.

Escape hatches during the exit test are not failure — they are Phase 0's signal that vocabulary is still incomplete.

---

## Open Concerns

- **Member-anchor format.** Fully-qualified type name plus member signature is the intent, but C# method overloads, generic methods, and explicit interface implementations produce ambiguous short forms. Decide between Roslyn's `DocumentationCommentId` format (precise but verbose) or a shorter human-readable form (risks ambiguity on overloads).
- **Predicate strictness defaults.** Parent brief lists three levels (`strict`/`advisory`/`transitional`). Unclear whether strictness is a per-predicate default that per-edge can override, or a per-edge property with per-predicate default only as a fallback. Phase 0 should pin the semantics before Phase 2 builds the disagreement engine on top.
- **Finding-flavor mapping concreteness.** The parent brief names the concept but does not define the flavor enum. Without a concrete flavor list, `finding_flavor_mapping[]` is a placeholder. Either Phase 0 specifies the enum (coupling to explorer output) or it defers the field and Phase 3 defines it (risks schema churn).
- **`declined_alternatives` TTL policy.** Parent brief flags this as an open decision (line 505). Phase 0 must decide: fixed TTL per entry, configurable per entry, or never expire. The choice affects schema: "never" means no `ttl` field; "configurable" requires one.
- **Validator hosting language.** Parent brief suggests `.mjs` (Node). Chester's existing tooling is bash plus some Python. Picking Node adds a runtime dependency. Picking bash makes JSON Schema validation painful. Phase 0 picks; Phase 2 inherits.
- **Whether `Boundary` survives the exit test.** Parent brief includes `Boundary` in the kind enum but the four worked entries do not use it. Phase 0 should either produce a worked `Boundary` entry (expanding the exit test to five entries) or document explicitly that `Boundary` is provisional until a real use case surfaces.

---

## Acceptance Criteria

- `kb/vocabulary/predicates.json` exists with 30–40 predicates, each carrying direction, strictness default, source/target kinds, finding-flavor mapping, and a one-line description
- `kb/vocabulary/kinds.json` exists with 8–10 kinds, each with prefix, required fields, default anchors, and default hook dimensions
- `kb/vocabulary/canonical-forms.json` exists with validator regexes for every anchor kind referenced in any concept schema
- `kb/schema/<kind>.schema.json` files exist for every kind in `kinds.json`, each extending a shared base schema
- `kb/templates/<kind>.json` files exist for at least the four kinds covered by worked entries (`Project`, `Capability`, `Artifact`, `Invariant`); other kinds may defer template authoring
- `kb/vocabulary/authoring-rules.md` exists with forbidden-token list, predicate selection guidance, kind selection guidance, and sparsity principle
- `scripts/kb-validate.mjs` (or equivalent) exists and performs schema, canonical-form, description-lint, predicate existence, dangling-ref, and orphan-detection checks
- The four worked entries from the parent brief have been re-drafted against Phase 0 schemas and validate cleanly with zero predicate synonyms introduced
- If any open concern above was resolved during Phase 0, the resolution is documented in `authoring-rules.md` or the relevant vocabulary file; unresolved concerns are listed at top of `authoring-rules.md` as "deferred to Phase 2"

---

## Kill criteria

- If the exit-test re-draft cannot produce zero-synonym validation within two iterations of vocabulary revision, the predicate model is wrong. Stop and reconsider whether predicates-as-labels is the right abstraction (alternative: typed-relation objects with explicit subject/object roles).
- If the kind taxonomy produces more than two forced kind-collapses (like `Type` → `Artifact`) during the exit test, the taxonomy is grain-drift. Reduce to a smaller kind set before Phase 1.
- If `canonical-forms.json` requires more than seven anchor kinds to cover the four worked entries plus reasonable extension, the anchor abstraction is leaking. Reconsider whether anchors should be strings with validators or structured objects with per-kind sub-types.

---

## Handoff notes for implementation

1. Read the parent brief in full before starting Phase 0. Do not skim — the four-entry exercise and the "what surfaced as design concerns" list (lines 337–362) are the empirical grounding for every decision here.
2. Phase 0 is vocabulary work, not plumbing. Resist the urge to start with the validator. Pin predicates, kinds, and canonical forms first; the validator enforces decisions that must already be made.
3. The exit test is an honest test only if re-drafted entries come out structurally close to the originals without forcing. If the re-draft requires rewriting the entry's meaning to fit the schema, the schema is wrong, not the entry.
4. Strictness defaults, finding-flavor enum, and TTL policy are the three highest-leverage open concerns. Resolve them explicitly in Phase 0 if possible; document the deferral reason if not.
5. Do not author any Phase 1 backbone concepts during Phase 0. The exit-test re-drafts are the only authored entries in this phase. Authoring backbone concepts against a still-moving vocabulary produces entries that need rework when vocabulary settles.
