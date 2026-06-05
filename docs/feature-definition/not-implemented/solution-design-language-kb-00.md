# Feature Definition Brief: Solution-Scoped Design Language Knowledge Base

**Status:** Pending (Proposal)
**Date:** 2026-04-23
**Related systems:** `design-experimental` skill, `chester-design-proof` MCP, `chester-design-understanding` MCP

---

## Purpose of this document

Transfer a completed design conversation (conducted against the StoryDesigner codebase) into a self-contained proposal for a new Chester artifact: a **solution-scoped design-language knowledge base** (KB) that serves as an **interview director** for the design-experimental pipeline. The KB composes with the existing proof and understanding MCPs. This document is the handoff from the design conversation to implementation.

Out of scope here: implementation. The downstream session executes from this brief.

---

## Problem Statement

Chester's `design-experimental` skill investigates a codebase from scratch on every invocation. The understanding MCP scores 9 dimensions of saturation, but the agent has no persistent map of "what concepts exist in this codebase and where to look for each one." Every session re-derives its exploration plan. This is:

- **Wasteful** — same codebase, same concepts, re-discovered every session
- **Stochastic** — two sessions asking the same question score different dimensions first, follow different paths
- **Unaccumulating** — nothing a session learns about the codebase's shape persists for the next session

The proof MCP's EVIDENCE element type requires non-designer sources citing codebase facts. Each session hand-constructs those citations from raw code reads. There is no stable vocabulary the proof can name when citing a design-level fact.

The wiki (in StoryDesigner's case, `docs/wiki/`) exists as narrative reference but:
- Has no schema — shape varies per page
- Not proof-compatible — cannot cite atomic statements
- Drifts silently — no verification against code

**The gap:** a persistent, schema-structured, proof-compatible knowledge layer that a new `design-experimental` session can query to know *what concepts a task touches* and *where to investigate them*, without re-doing the strategic mapping each time.

---

## Language primitives (context for the downstream session)

### Proof MCP vocabulary (existing)

Five element types with strict roles:

- `EVIDENCE` — codebase facts, agent-sourced, `source` must not be `"designer"`, verifiable
- `RULE` — designer-directed restriction, `source` must be `"designer"`
- `PERMISSION` — designer-directed relief from a RULE, requires `relieves` pointer
- `NECESSARY_CONDITION` — something that must hold for the design, requires `grounding[]` + `collapse_test` + `reasoning_chain`
- `RISK` — hazards attached to conditions

Relations: `grounding[]` (on NC), `basis[]` (on non-NC), `relieves`, `rejected_alternatives[]`.

Integrity checks: `withdrawn-grounding`, `ungrounded-condition`, `missing-collapse-test`, `stale-grounding`. Structural validity only — semantic correctness is designer responsibility.

### Understanding MCP vocabulary (existing)

Nine dimensions in three groups, weighted:

- **Landscape (40%):** `surface_coverage`, `relationship_mapping`, `constraint_discovery`, `risk_topology`
- **Human context (30%):** `stakeholder_impact`, `prior_art`
- **Foundations (30%):** `temporal_context`, `problem_boundary`, `assumption_inventory`

Each dimension scored 0–1, requires justification; score <0.9 requires a gap statement.

---

## Proposed role model

```
              ┌─ Designer (adjudicator) ─┐
              │                          │
       KB (director)  ←─ conflict ─→  Code Explorer
              │                          │
              └──── Understanding ───────┘
                         │
                       Proof
```

- **KB = interview director.** Surfaces which concepts a task touches; provides code anchors + dimension hooks. Does not score, does not synthesize.
- **Understanding MCP = interviewer/scorer.** Continues current role. Takes direction from KB.
- **Code explorer = ground-truth reader.** Roslyn walks, greps, reads. Continues current role. Works *with* KB, not replaced by it.
- **Designer = adjudicator.** Called when KB claim and explorer finding disagree.
- **Proof MCP = downstream consumer.** EVIDENCE cites KB concept IDs; KB revisions propagate through proof's existing `stale-grounding` check.

---

## Scope discipline

**In scope for KB contents:**
- Current-code concepts, abstracted to design level
- Schema-consistent, atomic facts suitable for citation as EVIDENCE
- Code anchors + dimension-hook steering prompts
- Verification signals for drift detection

**Out of scope for KB contents:**
- Design "why" / rationale — belongs to sprint artifacts and prior-art search
- Sprint history, decision genealogy
- Exhaustive code-clone coverage (not a replacement for code exploration)
- Implementation details (belongs to code reads)

The KB is **above and alongside** code exploration, not a replacement.

---

## Concept schema

Per-concept JSON files, one JSON Schema per `kind`. Loaded at MCP startup into in-memory map; file-watcher reload.

### Fields

- `id` — stable slug, code-independent (`capability/save-gate`, not tied to symbol names)
- `kind` — closed set: `Tier | Project | Capability | Boundary | Artifact | Consumer | DataFlow | IdentityRule | DiagnosticProducer | Invariant`
- `name` — design vocabulary label
- `description` — 1-3 sentence factual statement, **present tense only**, no "why" / "scheduled" / "was" / "previously"
- `code_anchors[]` — typed anchors: `{kind: "file"|"type"|"member"|"project"|"test", value: <canonical-form-for-kind>}`
- `related_concepts[]` — outgoing edges: `{predicate, to, strictness?: "strict"|"advisory"|"transitional", note?}`. Dangling `to` is a schema error.
- `dimension_hooks` — sparse, per-dimension investigation prompts. Inherits from per-kind template, specializes per concept.
- `verification_signal` — `{type, ...}` where type ∈ `{file_exists, type_exists, test_exists, test_passes, interface_has_implementation, pattern_match, custom}`
- `declined_alternatives[]` — institutional refusal memory: `[{statement, source, decided_at, note, ttl?}]`
- `revision` — integer, bumped on adjudication update
- `revised_in_disagreement` — null or `dis-NNN` pointer
- `contested_fields[]` — field paths currently under open adjudication

### Predicate vocabulary (starter set, ~30-40 predicates at full expansion)

Consolidated from the four-entry authoring exercise:

- Structural: `belongsToTier`, `referencesProject`, `residesInProject`, `hostsCapability`, `hostedByProject`
- Implementation: `declaredBy`, `implementedBy`
- Data flow: `producesType`, `consumesType`, `fieldType`
- Enforcement: `governs` (canonical direction; inverse `governedBy` derived), `enforcedBy`
- Emission: `emitsType` (consolidate with `producesType` — pick one), `emittedBy` (inverse, derived)

Each predicate has:
- Canonical direction (author forward only; inverse derived at query time)
- Strictness default (`strict` / `advisory` / `transitional`)
- Finding-flavor mapping (which explorer-finding flavors it compares against, for automatic disagreement detection)
- Source/target kind constraints

**Predicate-vocabulary design is the single point of failure for the whole system. Invest Phase 0 time here.**

### Canonical subject forms

Every anchor value must be in canonical form for its kind:

- `file` — repo-relative path, forward slashes
- `type` — fully-qualified type name (namespace + type)
- `member` — FQN + member signature
- `project` — project name matching `.csproj` basename
- `test` — FQN + test method name

Non-canonical anchors must be rejected at authoring time. Silent detection loss (disagreements that should fire but don't) is the worst failure mode and stems directly from canonicalization drift.

### Per-kind hook templates

Default `dimension_hooks` skeletons per concept-kind. Concept entries inherit and override. Reduces authoring burden substantially.

- `Project` → `surface_coverage`: enumerate types + ProjectReferences; `relationship_mapping`: find using directives
- `Invariant` → `constraint_discovery`: read rule source + run check; `risk_topology`: drift sites
- `Capability` → `surface_coverage`: interface members + callers; `relationship_mapping`: trace flows; `risk_topology`: contract-violation modes
- `Artifact` → `surface_coverage`: construction sites + field declarations; `relationship_mapping`: producer→consumer trace

---

## Four worked KB entries (extracted from StoryDesigner)

These were authored during the design conversation to stress-test the schema. Provided verbatim for downstream reference.

### Entry 1: `project/story.compiler.contracts`

```json
{
  "id": "project/story.compiler.contracts",
  "kind": "Project",
  "name": "Story.Compiler.Contracts",
  "description": "Compiler-tier public surface consumed by consumers and the save gate. Hosts build-result types, canonical-form DTOs, save-gate contract, and shared per-entity dirty-state diff contract. Pure contract types only — no implementation.",
  "code_anchors": [
    {"kind": "project", "value": "Story.Compiler.Contracts"},
    {"kind": "file", "value": "Story.Compiler.Contracts/CLAUDE.md"}
  ],
  "related_concepts": [
    {"predicate": "belongsToTier", "to": "tier/contracts"},
    {"predicate": "referencesProject", "to": "project/story.domain.contracts"},
    {"predicate": "referencesProject", "to": "project/story.application.contracts", "strictness": "transitional"},
    {"predicate": "hostsCapability", "to": "capability/save-gate"},
    {"predicate": "hostsCapability", "to": "capability/canonical-form"},
    {"predicate": "hostsCapability", "to": "capability/shared-dirty-state-diff"},
    {"predicate": "governedBy", "to": "invariant/no-dsl-span-types-in-compiler-contracts"},
    {"predicate": "governedBy", "to": "invariant/no-validation-references-from-contracts"}
  ],
  "dimension_hooks": {
    "surface_coverage": [
      "enumerate public types in Story.Compiler.Contracts/**/*.cs",
      "list ProjectReference entries in Story.Compiler.Contracts.csproj"
    ],
    "relationship_mapping": [
      "find all `using Story.Compiler.Contracts*` directives across solution"
    ],
    "constraint_discovery": [
      "read Story.Compiler.Contracts/CLAUDE.md Constraints section",
      "run CompilerContractsSpanIsolationTests + ContractsValidationIsolationTests"
    ]
  },
  "verification_signal": {
    "type": "file_exists",
    "path": "Story.Compiler.Contracts/Story.Compiler.Contracts.csproj"
  }
}
```

### Entry 2: `invariant/no-dsl-span-types-in-compiler-contracts`

```json
{
  "id": "invariant/no-dsl-span-types-in-compiler-contracts",
  "kind": "Invariant",
  "name": "Compiler-Contracts Span Isolation",
  "description": "Source files under Story.Compiler.Contracts must not reference DslDiagnosticSpan, DslTokenSpan, or DslResolvedReferenceSpan. Span-geometry types are consumer-tier vocabulary only.",
  "code_anchors": [
    {"kind": "test", "value": "Story.Architecture.Tests.CompilerContractsSpanIsolationTests"},
    {"kind": "file", "value": "Story.Compiler.Contracts/CLAUDE.md"}
  ],
  "related_concepts": [
    {"predicate": "governs", "to": "project/story.compiler.contracts"},
    {"predicate": "enforcedBy", "to": "test/CompilerContractsSpanIsolationTests.StoryCompilerContracts_SourceFiles_DoNotReferenceDslSpanTypes"}
  ],
  "dimension_hooks": {
    "constraint_discovery": [
      "read ForbiddenSpanTypes array in CompilerContractsSpanIsolationTests.cs",
      "grep for 'DslDiagnosticSpan|DslTokenSpan|DslResolvedReferenceSpan' under Story.Compiler.Contracts/"
    ],
    "risk_topology": [
      "identify who currently owns span-geometry types; confirm consumer-tier placement",
      "find span-type usage sites that might drift toward Compiler.Contracts"
    ]
  },
  "verification_signal": {
    "type": "test_passes",
    "test_fqtn": "Story.Architecture.Tests.CompilerContractsSpanIsolationTests.StoryCompilerContracts_SourceFiles_DoNotReferenceDslSpanTypes"
  }
}
```

### Entry 3: `capability/save-gate`

```json
{
  "id": "capability/save-gate",
  "kind": "Capability",
  "name": "Save Gate",
  "description": "Two-phase save coordinator. Plan validates current solution state and returns an opaque plan-state if clean. Execute persists validated content via entity services. Diagnostics flow as UnifiedDiagnostic. Interface in Compiler.Contracts; current implementation in Logic.",
  "code_anchors": [
    {"kind": "file", "value": "Story.Compiler.Contracts/Build/IBuildGate.cs"},
    {"kind": "file", "value": "Story.Application.Logic/Solution/BuildGateService.cs"},
    {"kind": "file", "value": "Story.Application.Logic.Tests/Solution/BuildGateServiceTests.cs"},
    {"kind": "file", "value": "Story.Application.Logic.Tests/Solution/BuildGateServiceSaveAssemblyTests.cs"}
  ],
  "related_concepts": [
    {"predicate": "declaredBy", "to": "artifact/ibuildgate"},
    {"predicate": "implementedBy", "to": "type/buildgateservice"},
    {"predicate": "producesType", "to": "artifact/buildgateresult"},
    {"predicate": "producesType", "to": "artifact/persistresult"},
    {"predicate": "consumesType", "to": "artifact/isolutiondirtystatereader"},
    {"predicate": "emitsType", "to": "artifact/unifieddiagnostic"},
    {"predicate": "hostedByProject", "to": "project/story.compiler.contracts"}
  ],
  "dimension_hooks": {
    "surface_coverage": [
      "enumerate IBuildGate members: PlanSaveAsync, ExecuteSaveAsync",
      "find all IBuildGate callers across solution"
    ],
    "relationship_mapping": [
      "trace ExecuteSaveAsync → entity service writes",
      "trace PlanSaveAsync → diagnostic producers feeding BuildGateResult.Diagnostics"
    ],
    "risk_topology": [
      "BuildGateResult.PlanState is opaque object — identify constructor and consumers",
      "Execute called without prior Plan — contract violation handling",
      "Concurrent saves — no synchronization contract declared"
    ],
    "problem_boundary": [
      "save gate is solution-wide, not per-entity",
      "does not own dirty-state source; reads ISolutionDirtyStateReader"
    ]
  },
  "verification_signal": {
    "type": "interface_has_implementation",
    "interface_fqtn": "Story.Compiler.Contracts.Build.IBuildGate",
    "min_implementations": 1
  }
}
```

### Entry 4: `artifact/unifieddiagnostic`

```json
{
  "id": "artifact/unifieddiagnostic",
  "kind": "Artifact",
  "name": "UnifiedDiagnostic",
  "description": "Canonical diagnostic record. Single shape every producer emits; consumers process uniformly. Carries a 4-segment DiagnosticCode, producer-composed message, severity, abstract subject (entity ref or span), and a ProducerTag identifying the emitting system. ProducerTag is not part of code identity — one code maps to one severity.",
  "code_anchors": [
    {"kind": "type", "value": "Story.Domain.Contracts.Diagnostics.UnifiedDiagnostic"},
    {"kind": "file", "value": "Story.Domain.Contracts.Tests/Diagnostics/UnifiedDiagnosticTests.cs"},
    {"kind": "file", "value": "Story.Architecture.Tests/UnifiedDiagnosticTokenVocabularyTests.cs"}
  ],
  "related_concepts": [
    {"predicate": "residesInProject", "to": "project/story.domain.contracts"},
    {"predicate": "fieldType", "to": "artifact/diagnosticcode"},
    {"predicate": "fieldType", "to": "artifact/severitycodes"},
    {"predicate": "fieldType", "to": "artifact/diagnosticsubject"},
    {"predicate": "governedBy", "to": "invariant/producer-owned-diagnostic-identity"},
    {"predicate": "governedBy", "to": "invariant/registered-token-vocabulary"},
    {"predicate": "emittedBy", "to": "capability/save-gate"},
    {"predicate": "emittedBy", "to": "capability/dsl-pipeline"}
  ],
  "dimension_hooks": {
    "surface_coverage": [
      "enumerate all `new UnifiedDiagnostic(` call sites",
      "enumerate all `IReadOnlyList<UnifiedDiagnostic>` field/property declarations"
    ],
    "relationship_mapping": [
      "map ProducerTag constant values to concrete emitting types",
      "trace UnifiedDiagnostic from producer → BuildGateResult/PersistResult → consumer rendering"
    ],
    "constraint_discovery": [
      "read UnifiedDiagnosticTokenVocabularyTests.cs — vocabulary enforcement",
      "enumerate registered ProducerTags.* constants"
    ]
  },
  "verification_signal": {
    "type": "type_exists",
    "fqtn": "Story.Domain.Contracts.Diagnostics.UnifiedDiagnostic"
  }
}
```

---

## Assessment findings from the authoring exercise

**What worked:**
- Schema held. All four entries fit without forcing fields.
- Descriptions were writable in 1-3 factual sentences once present-tense discipline caught. Initial draft of SaveGate leaked "scheduled to relocate" — cut.
- Code anchors were findable in 1-2 minutes each via `find` + `grep`.
- Per-kind hook templates are feasible. Each concept-kind's default hooks share a skeleton (Project → enumerate-surface; Invariant → check-enforcement; Capability → trace-flows; Artifact → enumerate-call-sites). Cuts authoring cost materially.
- Cross-concept wiring reproduces useful graph structure immediately (SaveGate → UnifiedDiagnostic via `emitsType` + inverse `emittedBy`).

**What surfaced as design concerns:**

1. **Predicate count inflates fast.** Four entries used 16 distinct predicates. ~5 were synonyms (`emitsType` vs `producesType`; `hostedByProject` vs `residesIn`). Post-consolidation: ~11 predicates for 4 entries; extrapolated full catalog ~30-50.

2. **Canonical subject form fractured immediately.** One entry used three different formats (file path, type FQN, short project-relative path). Silent detection loss if not enforced. **Typed-anchor schema above is the fix** — free-string anchors are rejected.

3. **Description discipline is harder than it looks.** Authoring guard needed: ban "scheduled," "was," "previously," "planned."

4. **Dimension hooks are sparse by nature.** Each entry populated 2-4 of 9 dimensions. `stakeholder_impact`, `temporal_context`, `prior_art` received zero entries across all four. Sparse is correct — the KB doesn't try to steer all dimensions equally.

5. **Dangling concept references.** Four entries referenced 11 concepts that weren't defined. **Implication:** the KB can't serve as a director until outbound references mostly-close. The 30-concept backbone is the MVP threshold, not a soft target.

6. **`Type` vs `Artifact` distinction collapses.** Rule: `Artifact` = design-named C# types (part of vocabulary). Implementation types are anchored on their owning `Capability`, not given their own concept node.

7. **Invariant anchoring to TDR codes** (ARCH-137 etc.) — initially embedded in IDs; removed. TDR codes are external cross-references from out-of-scope documents, not KB identity. Optional field if cross-reference needed.

8. **CLAUDE.md files are first-class anchor targets** in codebases that carry them. Description authoring drafts 40-60% faster when CLAUDE.md is citable. Treat as in-scope anchors.

---

## Phased implementation path

### Phase 0 — Vocabulary & Schema (design, 4-8 hours)

Deliverables:
- Predicate vocabulary final list (30-40 predicates) with direction, strictness, flavor mapping, kind constraints
- Concept-kind enum finalized (~8-10 kinds, `Type` dropped)
- JSON Schemas per kind (one `.schema.json` per kind)
- Canonical subject form enum with per-kind format rules
- Per-kind hook templates
- Description authoring rules document
- Verification-signal type enum

Exit: re-draft the four worked entries against the new schemas without needing a predicate or escape hatch not in the vocabulary. If any escape hatch required, vocabulary is incomplete.

**Risk:** this is the single point of failure. Every later phase amplifies its quality.

### Phase 1 — Backbone Catalog (authoring, 8-12 hours)

Target: ~30 concepts forming a self-closed graph.

- All Projects (~23 for StoryDesigner; one per `.csproj` minus test projects)
- All Tiers (5-6)
- Top Capabilities (5-8)
- Named Artifacts (8-12)
- Enforced Invariants (4-6)
- Core DiagnosticProducers (3-5)

Authoring aids: start from kind templates, read target CLAUDE.md first, write typed anchors.

Exit: `dangling_refs_count == 0`. Hard gate. Dog-fooding a graph with holes yields false confidence — can't tell if a hole is a bug or a gap. Write `scripts/kb-validate.mjs` as part of this phase.

### Phase 2 — KB MCP Server (engineering, 4-6 hours)

**Clone `proof-mcp` skeleton** — symmetry is deliberate.

State:
- Per-concept JSON files loaded into in-memory map at startup
- Schemas validated at startup; startup fails on any schema violation
- Two derived indices built at startup:
  - `claims_about[symbol] → [{concept_id, field_path, predicate, strictness}]` (forward lookup)
  - `existence_required_by[symbol] → [{concept_id, field_path}]` (reverse, for absence-claim detection)
- File-watch reload on KB change

Tools (first cut):
- `kb_get(id)`, `kb_list(kind?)`, `kb_neighborhood(id, depth, predicates?)`
- `director_identify(task_text)` — substring/keyword match first cut; LLM rerank deferred
- `director_dimension_prompts(concept_ids[], dimension)`
- `director_anchors(concept_id)`
- `kb_verify(concept_id?)` — shell out to `dotnet test` / `grep` / file checks
- `disagree_list`, `disagree_add`, `disagree_resolve` — skeletons; full wiring Phase 3

Exit: agent can call `director_identify("where does UnifiedDiagnostic get emitted?")` and receive a concept list including `artifact/unifieddiagnostic` + emitting Capabilities. Full round-trip works: identify → prompts → anchors → verify.

### Phase 3 — Understanding & Proof Integration (engineering + authoring, 4-8 hours)

Update `design-experimental` (or successor variant):

1. Pre–Phase 1 saturation: call `director_identify(task)`
2. Per dimension: call `director_dimension_prompts(concept_ids, dim)` to steer explorer
3. Explorer reports findings against hooks
4. Agent compares findings against KB claims via `claims_about` index
5. Structural/mechanical mismatches → `disagree_add`, block on that dimension until resolved
6. Agent advances unblocked dimensions or surfaces disagreement to designer

Proof integration:
- `submit_proof_update` accepts `source: "kb:<concept_id>#<field_path>"` format
- Lint: reject EVIDENCE whose KB source has `contested_fields` containing cited path
- KB concept revision → existing `stale-grounding` check propagates automatically

Disagreement adjudication:
- `disagree_present(id)` — side-by-side rendering
- `disagree_resolve(id, kind, note)` — kinds: `kb_updated`, `kb_reaffirmed`, `explorer_noted`, `accepted_dual`
- `kb_reaffirmed` → adds finding to target concept's `declined_alternatives[]` with TTL

Exit: run one real `design-experimental` session against a task touching backbone concepts. Measure: dimensions successfully steered, disagreement noise ratio, adjudication resolution quality.

### Phase 4 — Catalog Scale-Out (authoring, 20-30 hours spread over time)

Fill from ~30 to ~150 concepts. Driven by real-session signal:

- After each `design-experimental` session, list investigations that would have been steered by a KB entry that didn't exist. Those are the next-priority additions.
- Add in clusters (full DSL pipeline, then Persistence, etc.) so dangling refs repair as each cluster lands.
- Hook templates expand as patterns emerge.

Watch signal: disagreement-queue rate. Stable or declining → KB stabilizing. Growing → drift outpacing authoring; pause, repair.

Exit (soft): designer stops hand-writing "here's what to investigate" in session prompts because the director covers it.

### Phase 5 — Extraction Assistance (optional, only if Phase 4 drags)

Roslyn-based **draft generator** — not extractor:
- Reads solution, proposes draft concept entries (Projects, ProjectReferences, public Artifacts)
- Outputs editable JSON drafts for designer review
- Designer promotes, edits, or discards; no auto-ingest

Deferred because extraction layer risks producing trivia that drowns meaningful design content. Introduce only after authoring-cost profile is measured.

---

## Tooling checklist

- `kb/schema/*.schema.json` — per-kind JSON Schemas
- `kb/vocabulary/predicates.json` — predicate definitions with flavor mappings
- `kb/vocabulary/canonical-forms.json` — subject-kind format rules
- `kb/templates/*.json` — per-kind hook skeletons
- `kb/<kind>/<id>.json` — concept entries (growing catalog)
- `scripts/kb-validate.mjs` — CI validator: schemas, canonical forms, dangling refs
- `solution-kb-mcp/` — MCP server mirroring `proof-mcp` layout
- `design-experimental/SKILL.md` update — director-first investigation flow

---

## Cost accounting

- Phase 0: 4-8 hours (designer)
- Phase 1: 8-12 hours (authoring)
- Phase 2: 4-6 hours (engineering)
- Phase 3: 4-8 hours (engineering + skill-update)
- Phase 4: 20-30 hours spread over sessions (authoring, incremental)
- Phase 5: 6-10 hours if triggered

**To functional director: ~20-34 hours (Phases 0-3).** Catalog growth amortized over subsequent sessions.

---

## Kill criteria

- **After Phase 1:** if backbone dangling-ref count can't reach zero without adding >6 new concept-kinds, the kind taxonomy is wrong. Stop, revisit Phase 0.
- **After Phase 3 first real session:** if disagreement queue fires >30% false-noise, canonicalization is broken. Fix before Phase 4.
- **During Phase 4:** if designer adjudication rate exceeds 10 disagreements per session, KB drift is outpacing authoring. Pause catalog growth, focus on concept repair.

---

## Open decisions (to resolve during Phase 0)

- Final predicate list and strictness defaults
- Canonical subject form specifications per kind
- `declined_alternatives` TTL policy — fixed, configurable, or never
- Whether to build a session-close retrospective disagreement check or rely fully on agent self-raise
- Ad-hoc concept injection flow — block-on-promote or free-add with post-session review
- Dimension-hook bootstrap — hand-write all, or extract from one pilot session

---

## What NOT to do first

- Do NOT build extraction pipeline first. Curated MVP validates schema before automating.
- Do NOT ship understanding integration before backbone is dangling-free.
- Do NOT optimize `director_identify` early. Substring match is enough for dog-fooding.
- Do NOT author hooks for all 9 dimensions on every concept. Sparse is the design.
- Do NOT wait for perfect vocabulary. Ship v1, evolve via versioned `vocabulary.json`.

---

## Key insights worth preserving

- **Predicate vocabulary is the load-bearing design artifact.** Storage, extraction, and MCP are mechanical once predicates are pinned. Under-design it and the KB is useless; over-design it and extraction cost explodes.
- **Canonicalization is infrastructure, not convention.** Enforce at authoring time. Left to discipline, it decays within weeks and silently breaks disagreement detection.
- **Per-kind hook templates are the unexpected authoring win.** Concepts inherit skeletons and override only what's special — converts authoring from "per-concept × per-dimension" cost to "per-kind-template + per-concept specialization" cost.
- **30-concept backbone is a hard MVP threshold, not a soft target.** Dangling-ref ratio at low catalog counts makes the director unusable for testing.
- **Proof-mcp's state machine handles adjudication fallout natively.** `revision` bumps + existing `stale-grounding` check = any proof using a contested-then-updated fact is auto-flagged. No new proof primitives needed.
- **The three systems (KB director + understanding interviewer + proof) compose cleanly precisely because they speak one vocabulary.** EVIDENCE in a proof is literally a cited KB node ID. Keep that symmetry.

---

## Handoff instructions for the downstream session

1. Read this brief in full.
2. Do Phase 0 first — treat it as real design work, not plumbing.
3. Re-draft the four worked entries against your Phase 0 schemas as the Phase 0 exit test.
4. Do not skip the validator in Phase 1 — dangling-ref enforcement is the only way to know the kind taxonomy closes.
5. Clone `proof-mcp` layout for Phase 2. The symmetry is intentional and cheap to preserve.
6. First real session test in Phase 3 should use a task with known backbone coverage, not a novel area. You want to measure director quality, not catalog coverage.
