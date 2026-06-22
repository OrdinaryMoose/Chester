# Chester Codex — Format Draft v1

Scratch draft. Not for commit. Review shape, iterate, then promote approved format to `docs/chester/codex/CODEX.md` (tracked) and draft full v0 content there.

---

## Purpose

The codex is a persistent set of durable claims about the Chester codebase, expressed in `chester-design-proof` MCP grammar. Design skills load relevant codex entries at the start of a sprint's proof building, extend them for the decision at hand, collapse, and promote durable new claims back into the codex at finish.

Codex answers the question *"what is true about this codebase today, in domain terms?"* — not *"what did we decide in sprint X?"* (that belongs in sprint artifacts) and not *"what does this class do?"* (that belongs in code).

## Why proof-MCP grammar

Chester already has a structured vocabulary for claims: proof MCP elements. Rather than invent a parallel ontology, the codex reuses it — restricted to the **durable subset**.

Proof MCP has five element types. Only two survive outside a single design session:

| Proof type | Scope | In codex? |
|---|---|---|
| `EVIDENCE` | codebase fact | **yes** — code-derived, persistent |
| `NECESSARY_CONDITION` | load-bearing structural claim | **yes** when durable across sprints |
| `RULE` | designer restriction for this proof | no — sprint-scoped |
| `PERMISSION` | designer relief for this proof | no — sprint-scoped |
| `RISK` | hazard for this design | no — sprint-scoped |

So codex entries carry `type: EVIDENCE` or `type: NECESSARY_CONDITION`. Nothing else.

## Format

Each entry is YAML frontmatter between `---` fences followed by a Markdown body. Multiple entries live in one file, separated by blank lines.

### Required frontmatter

- `id` — kebab-case slug, unique across the codex. Stable; used for `grounding` references.
- `type` — `EVIDENCE` or `NECESSARY_CONDITION`.
- `title` — human-readable title.

### `NECESSARY_CONDITION`-only required fields

- `grounding` — list of codex node IDs this condition depends on. Non-empty.
- `collapse_test` — one sentence: what breaks if this is removed.
- `reasoning_chain` — `IF ... THEN ...` prose showing why the condition holds.

These three match proof MCP's validation rules exactly.

### Optional frontmatter

- `kind` — reader-affordance subtype. Free-form. Suggested values: `entity`, `relation`, `boundary`, `actor`, `schema`, `process`, `invariant`. No validator; drift tolerated; controlled vocabulary later if pain warrants.
- `tags` — list of keywords for preload filtering and domain grouping.
- `realized-by` — list of code pointers: file paths, module names, hook names. Reader can trace domain claim back to its realization.
- `related` — list of other codex IDs cross-referenced but not depended on.
- `status` — `proven` (default), `unverified`, `needs-reverification`. Set by `util-codex-verify` drift scan or by `finish-update-codex` when sprint proof contradicts.
- `added` — sprint ID that introduced the entry.
- `updated` — sprint ID that last touched the entry.

### Body

Prose. Lead paragraph states what the thing is and why it exists, in domain language. Additional paragraphs as needed. Class, method, and file names stay out of the body — they belong in `realized-by`. Invariants explicit in body prose (not just frontmatter) so humans scrolling the file see them without decoding YAML.

---

## Sample entries

Four entries covering different shapes: one plain `EVIDENCE` entity, one `NECESSARY_CONDITION` invariant, one `EVIDENCE` boundary, one `NECESSARY_CONDITION` grounded in multiple others.

---

```yaml
---
id: sprint
type: EVIDENCE
title: Sprint
kind: entity
tags: [core, lifecycle, artifacts]
realized-by:
  - skills/util-artifact-schema/SKILL.md
  - chester-util-config/chester-config-read.sh
related: [design-brief, working-directory, sprint-name-format]
status: proven
added: 20260423-01-seed-codex
updated: 20260423-01-seed-codex
---
```

A sprint is one envelope of work — from the moment a piece of work is named until the moment it lands in main. Every durable Chester artifact attaches to exactly one sprint, and every sprint has exactly one branch and one working directory named identically.

Sprints exist because Chester's phases (design, plan, execute, finish) need a shared name to coordinate across. Without sprint identity, phase outputs have nowhere to live and nothing to be cited by.

---

```yaml
---
id: sprint-name-format
type: NECESSARY_CONDITION
title: Sprint Name, Branch, and Working Directory Share One String
grounding: [sprint]
collapse_test: "If sprint name, branch name, and working directory name diverge, handoff between phases loses its routing key and downstream skills cannot locate prior phase output without extra lookup."
reasoning_chain: "IF a sprint produces artifacts under a directory named by the sprint, and the branch carries the same name, THEN any phase can locate any other phase's artifacts from the branch name alone. IF the three names diverge, THEN every handoff needs a lookup table and silent mismatches break the chain."
kind: invariant
tags: [core, naming, lifecycle]
realized-by:
  - skills/util-artifact-schema/SKILL.md
  - skills/chester-start-bootstrap/SKILL.md
status: proven
added: 20260423-01-seed-codex
updated: 20260423-01-seed-codex
---
```

Sprint name format is `YYYYMMDD-##-verb-noun-noun`. The same string names the sprint, its branch, and its working directory. `##` is monotonic per day within a project, starting at 01.

This identity is load-bearing: phases locate each other's artifacts by name, not by metadata. Changing the convention is a structural change touching every phase skill.

---

```yaml
---
id: working-vs-plans-directory
type: EVIDENCE
title: Working Directory and Plans Directory Differ in Lifecycle
kind: boundary
tags: [storage, artifacts, lifecycle]
realized-by:
  - docs/chester/working/
  - docs/chester/plans/
  - skills/finish-archive-artifacts/SKILL.md
related: [sprint]
status: proven
added: 20260423-01-seed-codex
updated: 20260423-01-seed-codex
---
```

Sprint artifacts live in two directories that mirror structure but differ in lifecycle. The working directory is gitignored scratch space — artifacts live there while the sprint is in flight and churn heavily (brief revisions, plan threat reports, mid-design thinking). The plans directory is tracked — only the final state of each artifact lands there, as part of the same commit as the code.

The split exists because in-flight artifacts would pollute git history if tracked throughout, and because the final archived version is what's worth preserving alongside the code it describes. `finish-archive-artifacts` is the single boundary-crossing event per sprint.

---

```yaml
---
id: proof-state-survives-compaction
type: NECESSARY_CONDITION
title: Proof MCP State Survives Conversation Compaction
grounding: [sprint, sprint-name-format]
collapse_test: "If proof MCP state is lost at compaction, any design-experimental session that exceeds the context window loses its in-flight proof graph mid-reasoning and must restart — making structural design on real-size problems intractable."
reasoning_chain: "IF Claude Code compacts a conversation to stay under context limits, THEN without explicit preservation, MCP server state is inaccessible from the post-compaction context. IF PreCompact and PostCompact hooks serialize and rehydrate state file-backed to the sprint, THEN the proof graph survives transparently and the designer continues mid-proof."
kind: invariant
tags: [mcp, compaction, design, hooks]
realized-by:
  - hooks/SessionStart
  - hooks/PreCompact
  - hooks/PostCompact
related: []
status: proven
added: 20260423-01-seed-codex
updated: 20260423-01-seed-codex
---
```

When Claude Code compacts a conversation, the sprint's proof graph is preserved on disk and rehydrated from the state file when the post-compaction context starts new tool calls. A design session interrupted by compaction picks up mid-proof without losing nodes, grounding relationships, or validation state.

This invariant makes structural design tractable on real-size problems. Without it, any design session long enough to trigger compaction would lose its reasoning scaffold mid-flight and restart from scratch.

---

## Open questions to resolve before promoting to tracked

1. **Frontmatter rendering.** Samples above wrap YAML in a code fence so it renders in Markdown viewers without confusing them (bare `---` fences start frontmatter, not section entries). Real codex file: bare fences or fenced code blocks? Bare fences parse cleanly with YAML tooling but render as `<hr>` in most Markdown renderers. Fenced code blocks render cleanly but require parser to strip fences. Pick one.
2. **File layout.** Single `CODEX.md` with ~15-20 entries at v0, or one file per entry in a directory (`codex/sprint.md`, `codex/proof-state-survives-compaction.md`, ...)? Single file = easier overview scrolling and cross-entry grep. Per-entry = cleaner git diffs on promotion, obvious stable ID from filename.
3. **`grounding` cross-file.** If per-entry files, does `grounding: [sprint]` refer to `codex/sprint.md` by filename or by `id:` field? Match skills convention (name = filename = id) is probably cleanest.
4. **Sprint ID for bootstrap entries.** Used `20260423-01-seed-codex` as a placeholder. Should the bootstrap sprint be formal (run through design-experimental, execute-write, etc.) or a one-off exception?
5. **Subtype `kind:` vocabulary.** Samples use `entity`, `boundary`, `invariant`. Full plausible list: `entity`, `relation`, `boundary`, `actor`, `schema`, `process`, `invariant`, `flow`. Lock the list now, or let it grow through v0 and distill later?
