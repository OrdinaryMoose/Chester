# Design Brief: Artifact Skill-Version Provenance

**Status:** Draft
**Date:** 2026-04-30
**Sprint:** 20260430-03-add-artifact-skill-versions

## Problem Statement

Chester skills are versioned in their YAML frontmatter (`version: v####`), but the artifacts those skills produce — design briefs, specs, plans, threat reports, smell reports, summaries, audits, thinking files — carry no record of which skill version produced them. This makes it impossible to look at any past artifact and tell which version of which skill wrote it, or which version of which skill modified it later.

The gap matters because skills evolve continuously. When an artifact is reviewed, archived, or referenced later, there is no way to:

- Tell which skill version's output format applies to a given artifact.
- Detect that a skill version bumped mid-sprint and re-ran against the same artifact.
- Reconstruct the full chain of skills that participated in producing a sprint's artifacts.

The need is for every artifact to carry a verifiable, append-only record of which skill (by name and version) participated in producing it, plus a single sprint-level ledger that consolidates the entire skill-version chain into one place.

## Prior Art

No prior provenance mechanism exists in Chester. Skill versions are tracked only in skill source files. Git history is the only current way to infer skill-to-artifact relationships, and it does so incompletely (working directory artifacts are gitignored until archived).

## Design Decisions

### D1 — HTML comment trailers at the bottom of every artifact

Each artifact carries a provenance block at the very bottom of the file, immediately after content, separated by a blank line. The block contains:

- One `<!-- created-at: <ISO 8601 UTC> -->` line — the artifact creation timestamp, frozen on first write.
- One `<!-- produced-by <skill>@<version> -->` line per participating skill, in first-touch chronological order.

Example:

```
<!-- created-at: 2026-04-30T14:23:00Z -->
<!-- produced-by plan-build@v0007 -->
<!-- produced-by plan-attack@v0003 -->
<!-- produced-by plan-smell@v0002 -->
```

**Rejected alternatives:**
- YAML frontmatter `produced_by` field — not all artifacts have frontmatter (thinking files, design briefs).
- Filename encoding (e.g. `spec-01-v0007.md`) — breaks `NN` sequence convention, churns on every modifier touch.
- Sidecar `.meta.json` per artifact — doubles file count, easy to drift if a skill writes the artifact but forgets the sidecar.
- Sprint-level `MANIFEST.md` only — loses per-artifact attribution.
- Git commit trailer only — working-directory artifacts are gitignored until archived, so they have no commit attribution while in flight.
- Plugin-level version stamp only — Chester plugin has no version field today, and stamping at plugin granularity loses skill-level fidelity.

### D2 — Skill chain dedupe by `(skill-name, version)` tuple

Each `(skill-name, version)` tuple appears at most once in an artifact's chain. Re-runs of the same skill at the same version are idempotent — no new entry is appended. If the same skill runs at a different version (e.g. after a `/refresh-chester` mid-sprint), both entries are kept, in first-touch order. The chain therefore functions as a version-change log within each artifact.

**Rejected alternatives:**
- One entry per run (full append-log) — produces noisy chains for skills that re-enter the same artifact multiple times in one session, without adding signal.
- Last-writer-wins (single scalar) — loses the multi-skill participation signal.

### D3 — No-op rule: skip writes that don't change content

When a skill's pass leaves the artifact's content unchanged (excluding the trailer block from comparison), the skill writes nothing — neither the artifact nor a new trailer entry. This prevents stamp churn from re-entries that produce no real change.

**Rejected alternatives:**
- Always append a trailer when the skill enters the artifact — produces stamps that don't reflect actual modifications.

### D4 — Subagents never stamp; parent skill owns the trailer

Named subagents under `agents/` (e.g. `plan-build-plan-attacker`, `execute-write-spec-reviewer`) never add their own trailer entries. Whatever skill dispatched them is the entity that stamps the artifact. The trailer chain reflects the user-visible skill graph, not the internal dispatch tree.

**Rejected alternatives:**
- Subagents stamp themselves — pollutes the chain with internal dispatch detail that isn't part of the user's mental model.

### D5 — Manual edits never trigger re-stamping

When the user edits an artifact directly, the trailer chain is not updated. The chain represents the last machine touch by skill, not the current state authority. Manual edits silently invalidate the "last skill that wrote this is the current state" interpretation, but this is acceptable — the chain is provenance, not authority.

**Rejected alternatives:**
- Add a `manually-edited` marker — adds discipline burden without clear value, since machine readers can't reliably detect manual edits anyway.

### D6 — Archive copies bytewise; no archive-time trailer

`finish-archive-artifacts` copies sprint artifacts from the gitignored working directory into the tracked plans directory bytewise. It does not add its own trailer entry. Copy is not a modification.

**Rejected alternatives:**
- Stamp on archive — inflates every artifact's chain with a non-content-touching skill.

### D7 — Sidecar artifacts have independent chains

Threat reports, smell reports, audits, thinking files, and any other companion artifact produced alongside a parent (plan, design brief, etc.) carry their own independent trailer chain. They never co-mingle trailers with their parent artifact, even when produced in the same skill run.

**Rejected alternatives:**
- Single chain spanning parent + sidecars — confuses provenance attribution when readers inspect the parent vs. the sidecar individually.

### D8 — Summary doc as consolidated session ledger

The session summary produced by `finish-write-records` carries a new section titled `## Session Skill Versions`. The section contains the full deduped skill-version chain across all artifacts in the sprint directory, in first-touch chronological order, using the same `<!-- produced-by <skill>@<version> -->` comment format as per-artifact trailers. Dedupe key is `(skill-name, version)` across the entire sprint — same skill at different versions produces multiple entries.

The summary itself also receives a standard trailer block (created-at + own `produced-by finish-write-records@vNNNN` entry) like any other artifact.

**Rejected alternatives:**
- Human-readable bullet list (`- plan-build@v0007`) — diverges from per-artifact trailer format; harder to grep uniformly.
- Separate `MANIFEST.md` file — adds a new artifact type for a record that fits naturally inside the summary.

### D9 — Convention lives in `util-artifact-schema`

The provenance convention is documented authoritatively in `skills/util-artifact-schema/SKILL.md`. All producer/modifier skills cite it. The convention is single-source so future evolution touches one file.

**Rejected alternatives:**
- Document the convention in each producer skill — drifts as skills evolve independently.

### D10 — Stamping skills

Skills that stamp:
- `design-large-task`, `design-small-task` (design briefs, thinking files)
- `design-specify` (specs, ground-truth reports, skeleton manifests)
- `plan-build` (plans, threat reports — plan-build writes the combined threat report during the Plan Hardening phase, so it owns that chain)
- `execute-write` (appends to plan only if it amends the plan)
- `finish-write-records` (summary, audit)

Skills that do not stamp:
- `plan-attack`, `plan-smell` — produce inline conversation output only; they do not write files. The threat report and any standalone smell report would only exist as a `plan-build`-written artifact, so plan-build owns the trailer chain on those files.
- `execute-test`, `execute-prove`, `execute-verify-complete` — read-only with respect to artifacts.
- `finish-archive-artifacts` — bytewise copy.
- `start-bootstrap` — scaffolds directories; does not produce artifact content.
- All named subagents under `agents/`.

**Note on plan-attack and plan-smell.** An earlier draft of this brief listed both as stamping skills. The Assumptions section flagged this as UNTESTED. Plan-build verified during plan construction (per the brief's own instruction) by reading both skills' SKILL.md files: each declares "This skill does not write files. All output is inline in the conversation." The list above is corrected accordingly. plan-build remains the sole stamping skill for any threat-report or smell-report artifact, since plan-build is the entity that writes those files during its hardening phase.

## Scope

### In scope

- Update `skills/util-artifact-schema/SKILL.md` to document the provenance convention authoritatively.
- Update each producer/modifier skill listed in D10 to write its trailer entry on artifact write, applying D2 (dedupe), D3 (no-op), D7 (sidecar isolation), and D5 (no manual-edit re-stamping) rules.
- Update `finish-write-records` with the harvest-and-consolidate behavior described in D8.
- Bump the `version` field of each touched skill per Chester's existing convention.

### Out of scope

- **Retroactive provenance for existing archived artifacts** — _not needed_: convention applies forward-only.
- **Detection or marking of manual user edits** — _not needed_: D5 explicitly accepts this loss.
- **A shared trailer-writing utility script in `bin/`** — _not yet_: implementation question to resolve during plan-build, not a brief decision.
- **Verification tooling that audits trailers across the sprint** — _not yet_: separate concern from the convention itself.
- **Plugin-level version stamping** — _not needed_: D1 rejects plugin-granularity stamping.

## Constraints

- _(structural)_ Working-directory artifacts are gitignored; trailers must be embedded in the artifact itself, not in git metadata, to be visible while in flight.
- _(structural)_ Not all artifacts have YAML frontmatter (thinking files, briefs may not); the trailer mechanism must work on any markdown file.
- _(normative — source: Chester convention)_ Skill `version` field bumps are required for any meaningful behavior change. Source: `CLAUDE.md` skill file conventions section.
- _(structural)_ `finish-archive-artifacts` already copies files bytewise; D6 aligns with existing behavior rather than altering it.

## Assumptions

- **"Every producer/modifier skill currently has a single point of artifact write that can be wrapped with trailer logic"** — UNTESTED. If a skill performs multiple writes per run, the no-op rule (D3) and idempotency (D2) protect correctness, but the per-skill implementation may be more invasive than expected. Resolved during plan-build by inspecting each producer skill.
- **"`util-artifact-schema` is the right home for this convention"** — UNTESTED but well-aligned with its existing role as the authoritative artifact-naming reference.
- **"The skill list in D10 is complete"** — UNTESTED. Plan-build should verify by walking `skills/` and identifying any skill that performs artifact writes beyond the listed set.

## Residual Risks

- **Skills that re-enter an artifact mid-run** — if a skill writes an artifact, then re-writes it later in the same run with different content, the dedupe rule (D2) keeps a single trailer entry but the artifact bytes evolved. This is acceptable: the chain captures participation, not edit count.
- **Subagent dispatch chain visibility lost** — D4 hides subagent participation from the trailer chain. If a future audit needs to know which subagent produced which sub-artifact, a separate mechanism would be needed.
- **Trailer block size grows on long-running sprints with frequent skill version bumps** — bounded in practice (each skill at most a few entries even with version churn), but could become noisy on heavily iterated artifacts.

## Acceptance Criteria

- Every artifact produced by a stamping skill (D10) ends with a `<!-- created-at: ... -->` line followed by one or more `<!-- produced-by <skill>@<version> -->` lines.
- Re-running the same skill at the same version against an unchanged artifact produces no file modification (D3) and no new trailer entry (D2).
- A skill running at a new version against a previously-stamped artifact appends a new trailer entry without removing the prior version's entry.
- Sidecar artifacts have independent chains (D7).
- Subagents do not appear in any trailer chain (D4).
- Manual edits do not modify the trailer chain (D5).
- `finish-archive-artifacts` produces archived files whose trailer chains are bytewise identical to the working-directory originals (D6).
- The session summary produced by `finish-write-records` contains a `## Session Skill Versions` section with the full deduped skill-version chain across all sprint artifacts, in first-touch chronological order, using the per-artifact trailer comment format (D8).
- The convention is documented in `skills/util-artifact-schema/SKILL.md` (D9), and every stamping skill cites it.
- Each touched skill's `version` field has been bumped.

<!-- created-at: 2026-04-30T00:00:00Z -->
