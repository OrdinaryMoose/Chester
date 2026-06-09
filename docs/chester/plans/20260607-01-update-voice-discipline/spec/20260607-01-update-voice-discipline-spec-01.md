# Spec: Canonical instruction-injection — catalog generator + voice/rule single-sourcing

**Sprint:** 20260607-01-update-voice-discipline
**Parent brief:** docs/chester/working/20260607-01-update-voice-discipline/design/20260607-01-update-voice-discipline-design-01.md
**Architecture:** One deterministic build-time generator whose single output is the skill catalog (derived from each skill's own frontmatter), plus plain authoring edits that give the genuinely-duplicated shared text exactly one canonical home: CLAUDE.md two-tier dedup and the two orphan voice rules. Agent `.md` files (committee members and reviewers) are NOT generated — see Non-Goals for the execution-proven reason.

## Goal

Eliminate the cross-file duplication that is real and drifting — the skill catalog, the CLAUDE.md rule bodies, and the two homeless voice rules — by deriving the catalog mechanically from each skill's frontmatter and giving every surviving shared rule exactly one canonical source. A verify test guards catalog staleness so a frontmatter edit that is not regenerated fails the test, converting silent inline drift into a mechanical, `git diff`-detectable signal. The generator and its verify test land together; neither lands alone.

This sprint's scope was corrected after execution falsified two premises of the original plan (see Non-Goals and the change log): the four committee-member files interleave shared and lens-owned text too finely to assemble from two sources, and the reviewer files share almost no text (the disciplines are mostly per-consumer). Generating either would require rewriting meaning, which this sprint does not do. The generator's reach is therefore the catalog only.

## Components

**Generator (catalog-only)**
- `bin/chester-generate-agents` — thin PATH wrapper, mirrors `bin/chester-config-read`/`bin/chester-trailer-write`; `exec`s the implementation. (Name retained for continuity with the committed wrapper; it now produces the catalog only.)
- `chester-util-config/chester-generate-agents.sh` — implementation. Reads the `catalog` entry of `agents/manifest.json` and emits the skill catalog whole. Flags: `--output-dir DIR` (write the output under DIR instead of the repo path, preserving relative paths — used by the verify test); `--root DIR` (point at an alternate repo root — used by the test fixture). `jq` guard mirroring `chester-config-read.sh`; clear non-zero error if `jq` absent.
- The agent-building machinery (`emit_agent`, `extract_section`, the `--agents-only` flag, the HEADER fragment-assembly path) built for the abandoned member/reviewer generation is REMOVED. Only the catalog path (`emit_catalog`) remains.
- Determinism: alphabetical sort for the catalog list; NO timestamps or variable content injected. Same inputs → identical bytes.

**Manifest**
- `agents/manifest.json` — carries the `catalog` object only. The `agents` array is empty (or removed); no agent file is declared for generation.
- `catalog` entry: `output` = `skills/setup-start/references/skill-index.md`; `scan_glob` = `skills/*/SKILL.md`; `template` = the hand-authored catalog-template path with a slot marker.

**Canonical sources (new / extended — single source of truth)**
- `agents/sources/catalog-template.md` (new) — the hand-authored skill-index header, priority order, dispatch patterns, and role grouping, with a single `<!-- CATALOG_SLOT -->` marker where the generated skill list is inserted.
- `skills/util-design-partner-role/SKILL.md` — ADD two new sections: `## PM Litmus Test` and `## Research Boundary` (no canonical home today; each currently duplicated across two consumers with zero canonical copy). These are read at runtime by parent-session design skills; they are NOT baked into any generated file.

**Generated output (regenerated, committed, loaded as context)**
- `skills/setup-start/references/skill-index.md` (the catalog) — the only generated file.

**Verify test (the mandatory regeneration trigger)**
- `tests/test-generated-agents-current.sh` — regenerate the catalog to a temp dir (`--output-dir`), whole-file `diff` against the committed `skill-index.md`, fail on mismatch with `FAIL: skills/setup-start/references/skill-index.md stale — run bin/chester-generate-agents`. Includes a determinism sub-assertion (generate twice → identical bytes). Follows `tests/` conventions: `set -euo pipefail`, `mktemp -d`+trap, `fail()` accumulator, `PASS/FAIL` footer. (The catalog-correctness fixture test `tests/test-generate-catalog.sh` already exists and stays.)

**Authoring edits (NOT generator inputs)**
- Root `CLAUDE.md` — canonical for the version-bump rule (reinstate the dropped "not on typo fixes or comment-only edits" carve-out) and the description-sync rule; fix the description-sync target to name `skills/setup-start/references/skill-index.md`.
- `skills/CLAUDE.md` — replace the duplicated rule bodies with two-tier pointers up to root `CLAUDE.md`; carry no rule body root already owns.

## Data Flow

- **Authoring (catalog):** a skill's `description` frontmatter changes → developer runs `bin/chester-generate-agents` → `skill-index.md` is rewritten whole → commit the regenerated catalog.
- **Authoring (voice rules / CLAUDE.md):** plain edits to canonical homes; consumers cite the home rather than restating the body.
- **Generation:** the manifest's `catalog` entry drives a single pass — scan `skills/*/SKILL.md` frontmatter (handling both inline and folded/literal block-scalar `description:` forms), render the alphabetical list, splice into the template slot.
- **Verification:** `tests/test-generated-agents-current.sh` regenerates the catalog to temp and diffs against committed; mismatch = stale = fail.
- **Dispatch (unchanged):** the plugin loads `agents/*.md` directly as subagent prompts; those files remain hand-authored. Runtime-varying content (dispatch question, context packets) continues to arrive via `SendMessage`/`TeamCreate` payload — out of scope to change.

## Error Handling

- **Missing `jq`** → generator exits non-zero with a one-line message; verify test reports the dependency failure, does not silently pass.
- **Malformed manifest / missing catalog template** → generator exits non-zero naming the offending entry; no partial write to the committed path (write to temp, move on success).
- **Stale output** (frontmatter edited, not regenerated) → verify test fails with the regenerate instruction.

## Testing Strategy

- **Verify/staleness test** (`tests/test-generated-agents-current.sh`) — the primary new test; whole-file diff of the catalog + determinism sub-assertion. This IS the regeneration trigger.
- **Catalog-correctness test** (`tests/test-generate-catalog.sh`, already committed) — fixture test covering alphabetical order, inline descriptions, folded block-scalar descriptions, and quoted descriptions. Stays green.
- **Voice-rule canonical-home assertions** — extend `tests/test-partner-role-discipline.sh` to assert `## PM Litmus Test` and `## Research Boundary` sections exist in `util-design-partner-role/SKILL.md`.
- **CLAUDE.md dedup assertions** — `grep` checks: `skills/CLAUDE.md` carries no version-rule body; root `CLAUDE.md` carries the restored carve-out; neither names the phantom `setup-start/SKILL.md` list.
- Run via existing harness: `bash tests/test-<name>.sh`.

## Constraints

- The generated catalog MUST stay tracked — it is loaded as context; no runtime build step _(structural)_.
- Generator MUST be deterministic (same inputs → same bytes) or the diff test is unstable _(structural)_.
- `bin/` wrapper + `chester-util-config/*.sh` implementation split MUST be followed _(normative — repo convention)_.
- Tests MUST be self-contained bash, clean up after themselves, assume hostile CWD, print a grep-able `PASS/FAIL` footer _(normative — `tests/CLAUDE.md`)_.
- Agent `.md` files (committee members, reviewers, consolidator, scribe, researcher) remain hand-authored and are NOT touched by the generator. `agents/CLAUDE.md` is documentation, also untouched _(structural — execution finding, see Non-Goals)_.
- Skill `description` frontmatter remains the single source for catalog descriptions; the index is derived _(structural — FD-03)_.

## Non-Goals

- **Generating committee-member agent files** — execution proved the four `design-committee-{lens}.md` files interleave shared bands and lens-owned bands ~16× down the body; a two-source concatenation produces all-lens-then-all-shared, not the interleave, so it cannot reproduce them without rewriting meaning. Members stay hand-authored (designer decision D).
- **Single-sourcing reviewer disciplines** — execution proved the reviewer disciplines are mostly per-consumer: the confidence ladders differ by ~13 lines with near-zero shared text, and the evidence standard shares only a thin opener and closer around reviewer-specific bullets that a whole-`##`-section assembler cannot splice. Only the evidence-citation wording is cleanly shareable, and that is a one-time hand-fix, not a recurring drift surface worth a generator. Reviewers stay hand-authored.
- FD-05 (review-loop control flow) — out of scope.
- Round/turn flow structures — distinct by design, not duplicated; untouched.
- Dispatch-time injection mechanism and runtime-read parent-session skills — already correct; not changed.
- A pre-commit hook or CI wiring — optional hardening; the floor is the generator + the bash verify test. (May be noted as follow-on.)
- Changing the *meaning* of any agent's instructions — this sprint relocates and single-sources the catalog and the orphan voice rules; it does not rewrite any discipline.

## Acceptance Criteria

> AC-2.1 (member generation) and AC-3.1 (reviewer single-sourcing) from spec-00 are REMOVED — both rested on premises execution falsified (see Non-Goals and the change log). IDs of the surviving criteria are held stable for traceability; the gaps are intentional.

### AC-1.1 — Catalog generator exists and is deterministic

**Observable boundary:**
- Running `bin/chester-generate-agents` writes `skills/setup-start/references/skill-index.md` → exit 0.
- Running it twice with unchanged sources → byte-identical output.
- `jq` absent → non-zero exit with a dependency message, no partial committed write.

**Given:** the catalog template and `agents/manifest.json` (with a `catalog` entry) exist
**When:** `bin/chester-generate-agents` is run, then run again
**Then:** the catalog is written and the second run reproduces identical bytes

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.1 — Catalog derived from frontmatter; phantom pointer fixed; missing skills present

**Observable boundary:**
- `skills/setup-start/references/skill-index.md` is generated from `skills/*/SKILL.md` frontmatter into the catalog-template slot, preserving the hand-authored priority/grouping/dispatch sections.
- Every skill directory with a `SKILL.md` appears in the index — including `design-grillme`, `util-handoff`, `util-improve-codebase`.
- Both inline and folded/literal block-scalar `description:` forms render as a single clean line (no bare `>` or `|`).
- Root `CLAUDE.md` and `skills/CLAUDE.md` name `skills/setup-start/references/skill-index.md` as the description-sync target (no phantom `setup-start/SKILL.md` list reference remains).

**Given:** every skill directory carrying a `SKILL.md`, and the catalog template
**When:** the generator runs
**Then:** the index lists every skill (3 previously missing now present), every description is a clean single line, and no CLAUDE.md names the phantom list

**Implementing tasks:**
**Decisions:**

### AC-5.1 — Verify test is the regeneration trigger

**Observable boundary:**
- With sources and the committed catalog in sync → `tests/test-generated-agents-current.sh` exits 0 (`PASS`).
- Edit a skill `description` without regenerating → the test exits non-zero (`FAIL`) naming the stale catalog and the regenerate command.
- Generating twice yields identical bytes (determinism sub-assertion passes).

**Given:** the generator and the committed catalog exist
**When:** the verify test runs after a frontmatter edit without regeneration
**Then:** the test fails with a regenerate instruction; after regeneration it passes

**Implementing tasks:**
**Decisions:**

### AC-6.1 — CLAUDE.md two-tier dedup with carve-out restored

**Observable boundary:**
- Root `CLAUDE.md` states the version-bump rule WITH the "not on typo fixes or comment-only edits" carve-out.
- `skills/CLAUDE.md` carries a pointer up to root for the version-bump and description-sync rules and contains no rule body root already owns.

**Given:** the two CLAUDE.md files
**When:** a reader consults `skills/CLAUDE.md` for the version rule
**Then:** they are pointed to root `CLAUDE.md`, which carries the full carve-out, stated once

**Implementing tasks:**
**Decisions:**

### AC-7.1 — PM Litmus Test and Research Boundary have a canonical home

**Observable boundary:**
- `skills/util-design-partner-role/SKILL.md` contains a `## PM Litmus Test` section and a `## Research Boundary` section.
- Neither rule is restated in `design-small-task/SKILL.md` or `team-lead.md` as an independent body (they cite the canonical home).
- These two sections are NOT baked into any generated file.

**Given:** the voice-rule duplication (2 copies each, 0 canonical)
**When:** the canonical sections are added and the consumers updated to cite them
**Then:** each rule has exactly one authoritative home and the duplicates are replaced by citations

**Implementing tasks:**
**Decisions:**

### AC-8.1 — No semantic change to the catalog; no agent file touched

**Observable boundary:**
- The first authoritative generation of `skill-index.md` is semantically equivalent to the hand-maintained catalog's intent: same set of skills (plus the 3 previously-missing), each with its frontmatter description; only the assembly mechanism changes.
- No `agents/*.md` file is modified by the generator (members, reviewers, consolidator, scribe, researcher all remain exactly as hand-authored).
- No reviewer-discipline or member-band convergence is performed — the only text movement in this sprint is the catalog assembly and the plain CLAUDE.md / voice-rule authoring edits.

**Given:** the pre-refactor catalog as the meaning baseline and the hand-authored agent files
**When:** the generator first runs from the seeded template and manifest
**Then:** the catalog carries the same skill set and descriptions with assembly now mechanical, and no agent file changed

**Implementing tasks:**
**Decisions:**

---

## Change Log

- **2026-06-08 (spec-01, design-committee@v0018 round 04):** Scope corrected to catalog-only after execution falsified two premises of spec-00. REMOVED AC-2.1 (member generation — members interleave shared/lens text ~16×, not assemblable from two sources) and AC-3.1 (reviewer single-sourcing — disciplines proved mostly per-consumer). REDUCED AC-1.1, AC-5.1, AC-8.1 to catalog scope. KEPT AC-4.1, AC-6.1, AC-7.1. Resolved the spec/plan contradiction (spec-00 AC-8.1 sanctioned only the evidence-citation convergence while plan-01's F4 added an unauthorized confidence-ladder "Convergence 2"): the plan clause is dropped and AC-8.1 is rescoped to catalog-output equivalence; the reviewer-convergence clause is removed as vacuous. The generator's agent-mode machinery is to be stripped; reviewer/member files stay hand-authored. Decision record: `committee/round04/`.

<!-- created-at: 2026-06-08 -->

<!-- created-at: 2026-06-08T15:19:01Z -->
<!-- produced-by design-committee@v0018 -->
