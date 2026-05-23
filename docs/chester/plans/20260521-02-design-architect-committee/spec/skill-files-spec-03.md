# Spec: `design-architect-committee` Skill Files Build

**Sprint:** `20260521-02-design-architect-committee`
**Parent brief:** `docs/chester/working/20260521-02-design-architect-committee/design/skill-files-design-brief-00.md`
**Architecture:** Brief-strict (Option B++) — committee R2/R3/R4 ratified after diagnosing and rejecting the design-specify token-grammar line that produced spec v00-v02. Class-1 fact-correction errata + Class-2 bounded-discretion placements applied per designer Decisions 2a and 3a.
**Supersedes:** spec v00 / v01 / v02 (token grammar), plan v00, plan threat report v00. All retained on disk per Decision 6a for audit trail.

---

## Goal

Build the four operator-facing files for the `design-architect-committee` Chester skill (`SKILL.md`, `rules.md`, `schema/`, `design-brief-template.md`) plus a small lint plumbing such that (1) the two prose files honor AX-003's 200-word body cap with no relief, (2) every closed-set enumeration lives in the seven `schema/` files which are word-limit exempt, (3) the two prose files reference `schema/` via standard Markdown heading anchors and never restate enumerations, (4) a pre-commit / CI lint script mechanically enforces the word cap and the list-item ban as the brief KD-3 sub-path 1 chose, and (5) the worked template proves all three frozen deliverables (Constraint Envelope, Resolution Criterion, Coverage Map) emerge by read from a single populated Concern. The build does not modify the general `design-committee` skill or its agent files.

## Components

The build produces these new artifacts under `skills/design-architect-committee/`. No existing file outside this directory and `skills/setup-start/references/skill-index.md` is modified.

- **`skills/design-architect-committee/SKILL.md`** — operator-facing prose. Uppercase filename per Chester's case-sensitive plugin loader convention (every existing Chester skill uses `SKILL.md`). YAML frontmatter: `name: design-architect-committee`, `description: <one-line trigger description>`, `version: v0001`. Body content under 200 words, prose-only (no Markdown list items). Sections: When To Invoke, What It Produces, Session Lifecycle, Outputs To, Scope Limits. Closed-set references use standard Markdown heading anchors to `schema/` (e.g., "session closes when the [session-close gate](schema/integrity-rules.md#session-close-gate) clears").
- **`skills/design-architect-committee/rules.md`** — actor-discipline content sidecar. **No Skill-tool frontmatter** (this file is a sidecar to `SKILL.md`, not a separately invocable skill). May carry a lightweight non-Skill-tool header at author discretion (e.g., a `**Status:** Sidecar to SKILL.md` line) but no `name:` field. Body content under 200 words, prose-only. Sections: Citation Meta-Rule (one sentence), Designer Authority, Pole Authority, Clerk Authority, Forbidden Surfaces, Convening-Message Discipline. Closed-set references use Markdown heading anchors to `schema/`.
- **`skills/design-architect-committee/schema/`** — seven data-only files, word-limit exempt:
  - `schema/constraint-envelope.md` — six-field row shape (`concern_id`, `entry_id`, `source`, `body`, `provenance`, `status`) per Class-1 fact-correction errata (brief said "five-field" against canonical `deliverables-locked-00.md` which has six fields). Source enum `{AXIOM, PROPOSITION}`, provenance enum `{DESIGNER, AGENT}`, status enum `{RATIFIED, REVISED-PENDING}`, prefix conventions `CE-NNN / AX-NNN / PR-NNN`. Sourced verbatim from `deliverables-locked-00.md` § "Three deliverables → Constraint Envelope".
  - `schema/resolution-criterion.md` — four-field row shape, axiom-row exclusion, `collapse_test` IF NOT/THEN form, `structural_valid` BOOLEAN. Sourced from `deliverables-locked-00.md` § "Three deliverables → Resolution Criterion".
  - `schema/coverage-map.md` — five-field row shape, status enum `{COVERED, AXIOM-ONLY, GAP}`, status semantics. Sourced from `deliverables-locked-00.md` § "Three deliverables → Coverage Map".
  - `schema/phases-and-transitions.md` — five named phases (`OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED`), five named transitions with trigger, cascade timing rules, withdrawal exception. **Includes the "no automatic transitions; every advance is designer-triggered" constraint** per Class-1 fact-correction errata (brief was silent on this load-bearing clarification; sourced from `process-locked-00.md:29` as canonical). Sourced from `process-locked-00.md` § "Session phases", "Transitions", "Cascade handling — hybrid timing", "Withdrawal handling".
  - `schema/procedures.md` — twelve named procedures (Add Concern, Add Evidence, Add Axiom, Initiate Deliberation, Propose Proposition, Submit Round, Lint Batch, Ratify Row, Re-Ratify Row, Revise Row, Withdraw Entry, Close Session), each with Mutates / Trigger / Gates / State one-liners. Sourced verbatim from `procedures-locked-00.md`.
  - `schema/actors.md` — five-role inventory (Designer, Pole, Clerk, Team-Lead, Researcher), procedure-to-actor mapping (thirteen entries — twelve procedures plus Dispatch Round), designer-surface-per-phase enumeration. **Also carries the convening-message discipline** (caveman ultra for inter-agent prompts per AX-008; normal terse markdown for designer-facing surfaces) per Class-2 bounded-discretion placement (brief AC-18 authorized either `rules.md` body or a `schema/` file; spec exercises judgment to place in `actors.md` to keep `rules.md` body cleaner under the 200-word cap). Sourced from `actors-locked-00.md`.
  - `schema/integrity-rules.md` — five cross-artifact FK rules and three-condition session-close gate. Sourced from `deliverables-locked-00.md` § "Cross-artifact integrity rules" and `process-locked-00.md` § "Session-close gate".
- **`skills/design-architect-committee/design-brief-template.md`** — word-limit exempt worked example. One Concern (`CE-001`), one axiom (`AX-001`), one Proposition (`PR-001`), one Resolution Criterion row, one Coverage Map row. Each populated field's shape matches the corresponding `schema/` file. Three frozen deliverables visible by direct inspection.
- **`skills/design-architect-committee/scripts/lint-skill-files.sh`** — pre-commit / CI lint script. **Two sub-checks only** per brief KD-3 sub-path 1 selection: (1) word-count cap (≤200) on `SKILL.md` and `rules.md` body content (body = lines after the second `---` YAML frontmatter delimiter, or the entire file when no frontmatter); (2) list-item ban (`^- ` or `^[0-9]+\. `) in capped-file bodies. Exits non-zero on any failure with file + line + FAIL message. Roughly 20 lines of bash + grep + awk.
- **Pre-commit hook wiring** — `.git/hooks/pre-commit` symlink or CI workflow file invoking `lint-skill-files.sh` from the repo root. Installation guidance documented either in a small `skills/design-architect-committee/README.md` (preferred — outside the 200-word cap) or as a comment block in the lint script itself.

## Data Flow

The four files compose at three different times.

- **At designer-invocation time.** Designer reads `SKILL.md` body in isolation to decide whether to invoke `chester:design-architect-committee`. Every closed-set reference in the body is a Markdown link to the relevant `schema/` file section; designer opens the schema file only if they want the closed-set content. `SKILL.md` plus `schema/` is sufficient for routine invocation; the brief and the locked specs are not read.
- **At session-run time.** The Clerk script (out of scope for this build) reads `schema/` files as its rule source. The team-lead at session-close packaging reads the Clerk-certified working record and produces the on-disk handoff (out of scope for this build).
- **At skill-revision time.** A future editor modifies a `schema/` file. The lint runs on commit and verifies word cap + no-list-items on the two capped files. The prose meta-rule in `rules.md` body provides the read-time discipline against inlining enumerations from `schema/`. Drift on schema heading renames is caught at next-reader confusion time, not at lint time, per brief KD-3's deliberated choice of sub-path 1 over sub-path 2 (committee R4 re-deliberation closed 2026-05-23 confirming this contingency; see `design/skill-files-kd3-future-considerations-00.md` for archived evidence).

## Error Handling

- **Cap violation at commit time.** `SKILL.md` or `rules.md` body exceeds 200 words. Lint prints `FAIL: SKILL.md body word count {N} exceeds cap of 200` and exits non-zero. Commit blocked. Resolution: shrink prose or push more content into `schema/`.
- **List-item violation at commit time.** A Markdown list item appears in a capped file body. Lint prints `FAIL: SKILL.md body line {N} matches forbidden list pattern: '{line}'`. Commit blocked. Resolution: rewrite as prose or move enumeration to `schema/`.
- **Schema heading rename / file rename drift.** Not caught at lint time per brief KD-3. Caught at next-reader confusion. Production use will reveal whether this is acceptable; archive `design/skill-files-kd3-future-considerations-00.md` carries the evidence for any future re-deliberation.
- **Template structural drift.** The worked template is word-limit exempt and free-form. A structural test (AC-5.2) greps the template for required section headings and populated-row anchor IDs; test failure surfaces drift; manual fix required.

## Testing Strategy

Three test categories, all bash with `set -euo pipefail`, exit 0 pass, one-line FAIL per assertion.

- **Lint self-tests.** `tests/test-design-architect-committee-lint.sh` exercises the two sub-checks against synthetic fixtures (clean baseline; over-cap fixture; list-item fixture).
- **Schema structural tests.** `tests/test-design-architect-committee-schema.sh` greps each of the seven `schema/` files for required content anchors (CE field names; RC fields; CM fields; phase names + transitions + "designer-triggered" constraint; twelve procedure names; five role names + procedure-actor map; FK rules + session-close gate). One assertion per required anchor.
- **Template structural test.** `tests/test-design-architect-committee-template.sh` greps `design-brief-template.md` for the populated worked example sections (Concerns, Constraint Envelope, Resolution Criterion, Coverage Map) and populated-row anchor IDs (`CE-001`, `AX-001`, `PR-001`).

Tests follow existing Chester convention from `tests/test-*.sh` and `tests/CLAUDE.md`.

## Requirement

Use Caveman Ultra when writing the prose for the skill and rule files
Use standard prose (whatever is normally used) when writing the test files, schema files, and template.

## Constraints

- **AX-003 — 200-word cap, no relief** on `SKILL.md` and `rules.md` body content (frontmatter excluded). `schema/` files and `design-brief-template.md` are exempt.
- **AX-008 — voice asymmetry.** Inter-agent deliberation prompts inside a `design-architect-committee` session use caveman ultra. The four build files (designer-facing) use normal terse markdown. Convention documented via the convening-message section in `schema/actors.md` per Class-2 bounded-discretion placement.
- **Floor-not-ceiling rule** from general `design-committee/SKILL.md`. This build adds steps, schemas, gates, and roles via convening-message attach point at session-run time but never modifies the general primitive.
- **Three forbidden attach surfaces.** No file under `skills/design-committee/` and no file under `skills/design-committee/agents/` is modified. Output-format field labels not redefined.
- **Skill-folder layout convention** from `skills/CLAUDE.md`. `skills/design-architect-committee/` follows `{phase}-{name}/SKILL.md` pattern (uppercase `SKILL.md` per case-sensitive plugin loader; lowercase would not auto-discover on Linux ext4). Supporting files in `schema/`, `scripts/`, `tests/` per established convention.
- **Two-place sync** from `skills/CLAUDE.md` line 33 and root `CLAUDE.md` line 99. `SKILL.md` frontmatter `description` field and the matching entry in `skills/setup-start/references/skill-index.md` must stay in lockstep. (CLAUDE.md text points at `SKILL.md` itself but ground-truth review 2026-05-23 confirmed the registration target is `references/skill-index.md`. CLAUDE.md drift is a known-but-deferred maintenance item; surface to designer in a separate sprint.)
- **Locked specs as canonical source.** The seven schema files transcribe content from `deliverables-locked-00.md`, `process-locked-00.md`, `procedures-locked-00.md`, `actors-locked-00.md`. Discrepancies between brief and locked specs are routine Class-1 fact-correction; this spec carries two such corrections (six-field CE, no-automatic-transitions clarification).

## Non-Goals

- The Clerk deterministic script implementation. Schema files this build produces are the contract surface the future Clerk script will read; this build does not produce the script itself.
- The team-lead dispatch convention for the four pole subagents inside a `design-architect-committee` session.
- The on-disk session-close hand-off file shape the team-lead produces from the Clerk-certified working record.
- The working-directory layout for an active `design-architect-committee` session.
- Modification of the general `design-committee` skill, its `SKILL.md`, or any file under `skills/design-committee/agents/`.
- **Broken-link / schema-anchor-resolution checking.** Committee R4 re-deliberation 2026-05-23 voted CONDITIONAL EXPAND with R1 (close reference-style bypass) gating; engineer R4 R1 feasibility check empirically determined R1 INFEASIBLE per the committee's pre-stated flip-triggers (four additional bypass classes beyond reference-style, line-count exceeds ~120 substantive lines). Per committee's pre-stated rule, outcome is KEEP NARROW. Archive at `design/skill-files-kd3-future-considerations-00.md` preserves engineer R3 + R4 work + four-pole reasoning as named evidence for any future KD-3 re-deliberation.
- **Token-anchor citation grammar.** Spec v00-v02 token grammar diagnosed by committee R2 as design-specify drift treating brief KD-3 sub-path 1 as discretionary implementation; abandoned with the design-specify cycle.
- **Non-normative appendix preserving rejected mechanisms.** Committee R3 sub-question; Purist category-boundary objection adopted in designer Decision 5 path (drop appendix entirely; evidence preserved in named future-considerations archive instead).

---

## Acceptance Criteria

Eighteen criteria. Numbering is per-section; IDs are immutable once approved.

### AC-1.1 — `SKILL.md` body within 200-word cap

**Observable boundary:**
- `wc -w` on `SKILL.md` body content (lines after second YAML `---` delimiter) returns ≤ 200.

**Given:** `SKILL.md` exists at `skills/design-architect-committee/SKILL.md` with YAML frontmatter.
**When:** `scripts/lint-skill-files.sh` runs the word-cap sub-check.
**Then:** sub-check reports `PASS: SKILL.md body word count {N}` where N ≤ 200; exit code 0.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.2 — `rules.md` body within 200-word cap

**Observable boundary:**
- `wc -w` on `rules.md` body content returns ≤ 200. `rules.md` has no YAML frontmatter (sidecar, not invocable skill) — body = entire file content; if optional lightweight non-frontmatter header is present at the top, body excludes that header by author convention.

**Given:** `rules.md` exists at `skills/design-architect-committee/rules.md`.
**When:** the lint runs the word-cap sub-check.
**Then:** sub-check reports `PASS: rules.md body word count {N}` where N ≤ 200; exit code 0.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.3 — `SKILL.md` body contains no Markdown list items

**Observable boundary:**
- `grep -E '^- |^[0-9]+\. ' SKILL.md` against body content returns zero matches. Section headings (`##`, `###`) are not list items and are permitted.

**Given:** `SKILL.md` body content.
**When:** the lint runs the list-item-ban sub-check.
**Then:** sub-check reports `PASS: SKILL.md body free of list items`; exit code 0.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.4 — `rules.md` body contains no Markdown list items

**Observable boundary:**
- `grep -E '^- |^[0-9]+\. ' rules.md` against body content returns zero matches.

**Given:** `rules.md` body content.
**When:** the lint runs the list-item-ban sub-check.
**Then:** sub-check reports `PASS: rules.md body free of list items`; exit code 0.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.5 — `rules.md` carries the citation meta-rule

**Observable boundary:**
- `rules.md` body contains a sentence stating three semantic clauses: (a) closed-set content lives in `schema/`, (b) capped files cite into `schema/`, (c) capped files never restate. Exact wording is the author's choice; the three clauses must all be present.

**Given:** `rules.md` body.
**When:** the structural test greps for the load-bearing phrases.
**Then:** the schema-locality clause, the cite-into clause, and the never-restate clause are all present in the body.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.1 — `schema/` directory contains exactly seven named files

**Observable boundary:**
- `ls skills/design-architect-committee/schema/` returns exactly: `actors.md`, `constraint-envelope.md`, `coverage-map.md`, `integrity-rules.md`, `phases-and-transitions.md`, `procedures.md`, `resolution-criterion.md`.

**Given:** the build is complete.
**When:** directory listing is taken.
**Then:** the seven filenames are present; no eighth file; all seven non-empty.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.1 — `schema/constraint-envelope.md` carries the six-field row shape

**Observable boundary:**
- File enumerates all six fields by name: `concern_id`, `entry_id`, `source`, `body`, `provenance`, `status`.
- Source enum values present: `AXIOM`, `PROPOSITION`. Provenance enum values present: `DESIGNER`, `AGENT`. Status enum values present: `RATIFIED`, `REVISED-PENDING`. Prefix conventions named: `CE-NNN`, `AX-NNN`, `PR-NNN`.

**Given:** the schema file is written.
**When:** the structural test greps for the six field names + closed-set values + prefix conventions.
**Then:** each required element appears at least once.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.2 — `schema/resolution-criterion.md` carries the four-field row shape

**Observable boundary:**
- File enumerates four fields: `concern_id`, `entry_id` (`PR-NNN` only), `collapse_test`, `structural_valid`.
- AXIOM-row exclusion stated. IF NOT / THEN contrapositive form for `collapse_test` named. `structural_valid` BOOLEAN, Clerk-set, must be TRUE before designer ratification.

**Given:** the schema file is written.
**When:** the structural test greps for the four field names + AXIOM-exclusion + form requirements.
**Then:** each required element appears.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.3 — `schema/coverage-map.md` carries the five-field row shape

**Observable boundary:**
- File enumerates five fields: `concern_id`, `axiom_ids`, `proposition_ids`, `evidence_ids`, `status`.
- Status enum values present: `COVERED`, `AXIOM-ONLY`, `GAP`. Status semantics stated: COVERED requires ≥1 RATIFIED PROPOSITION; AXIOM-ONLY permits close with flag; GAP blocks close.

**Given:** the schema file is written.
**When:** the structural test greps for the five field names + status enum + semantics.
**Then:** each required element appears.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.4 — `schema/phases-and-transitions.md` carries the five-phase lifecycle plus the no-automatic-transitions constraint

**Observable boundary:**
- Five named phases present: `OPEN`, `ANCHORED`, `DELIBERATING`, `RATIFYING`, `CLOSED`.
- Five named transitions enumerated with from-state, to-state, trigger.
- **The "no automatic transitions; every advance is designer-triggered" constraint is present** per Class-1 fact-correction errata from `process-locked-00.md:29`.
- Cascade timing rules present (synchronous scope capture; deferred status mutation at round-close lint).
- Withdrawal exception stated (full immediate cascade; irreversible).

**Given:** the schema file is written.
**When:** the structural test greps for phase names + transition triggers + the load-bearing constraint + cascade/withdrawal rules.
**Then:** each required element appears.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.5 — `schema/procedures.md` carries the twelve named procedures

**Observable boundary:**
- All twelve procedure names present: Add Concern, Add Evidence, Add Axiom, Initiate Deliberation, Propose Proposition, Submit Round, Lint Batch, Ratify Row, Re-Ratify Row, Revise Row, Withdraw Entry, Close Session.
- Each procedure carries four one-liner fields: Mutates, Trigger, Gates, State.

**Given:** the schema file is written.
**When:** the structural test greps for each procedure name and each procedure's four fields.
**Then:** each required element appears.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.6 — `schema/actors.md` carries the five-role inventory plus AX-008 convening convention

**Observable boundary:**
- Five named roles present: Designer, Pole, Clerk, Team-Lead, Researcher.
- Procedure-to-actor mapping has thirteen entries (twelve procedures + Dispatch Round) naming the authorized actor for each.
- Designer-surface-per-phase enumeration present.
- **AX-008 convening-message discipline documented** per Class-2 bounded-discretion placement: inter-agent prompts use caveman ultra; designer-facing surfaces (the four build files) use normal terse markdown.

**Given:** the schema file is written.
**When:** the structural test greps for role names + procedure-actor map + designer-surface enumeration + AX-008 phrasing.
**Then:** each required element appears.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.7 — `schema/integrity-rules.md` carries FK rules and session-close gate

**Observable boundary:**
- Five cross-artifact FK rules present (concern_id appears in CE; entry_id sources match in CE; RC entry_id in CE as RATIFIED PROPOSITION; every PROPOSITION has one RC; AXIOM has none).
- Three-condition session-close gate predicate present (zero GAP rows; zero REVISED-PENDING rows; every PROPOSITION has matching `structural_valid = TRUE` RC).

**Given:** the schema file is written.
**When:** the structural test greps for the five FK rules + three gate conditions.
**Then:** each required element appears.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.1 — `design-brief-template.md` contains a populated worked example

**Observable boundary:**
- File contains a Concerns section with at least one populated Concern (`CE-001`).
- Constraint Envelope section with at least one axiom row (`AX-001`) and one Proposition row (`PR-001`), each with all six fields populated.
- Resolution Criterion section with at least one row matching `PR-001`, with `collapse_test` and `structural_valid = TRUE`.
- Coverage Map section with at least one row for `CE-001`, with `axiom_ids`, `proposition_ids`, `evidence_ids`, `status` populated.

**Given:** the template is written.
**When:** the template structural test greps for required section headings and populated-row anchor IDs.
**Then:** each grep returns at least one match.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.2 — All three frozen deliverables visible by direct inspection

**Observable boundary:**
- A reader of `design-brief-template.md` identifies, without synthesis, the Constraint Envelope rows, the Resolution Criterion row, and the Coverage Map row as three independently readable sections. Each section's populated fields match the field shape declared in the corresponding `schema/` file.

**Given:** the template is written.
**When:** a reader inspects the file top-to-bottom.
**Then:** three deliverable sections in named headings; populated row shapes match schema field declarations.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.1 — Lint word-count sub-check operational

**Observable boundary:**
- `scripts/lint-skill-files.sh` invoked against a fixture `SKILL.md` with 250 body words exits non-zero with FAIL line naming the count.
- Same script against a fixture with 150 body words exits 0 with PASS line.

**Given:** lint script and fixtures exist.
**When:** the lint self-test runs against fixtures.
**Then:** failure fixture trips sub-check; passing fixture does not.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.2 — Lint list-item-ban sub-check operational

**Observable boundary:**
- `lint-skill-files.sh` against a fixture capped file with a line beginning `- ` in body exits non-zero with FAIL line naming the line.
- Same script against a fixture with section headings only exits 0.

**Given:** lint script and fixtures exist.
**When:** the lint self-test runs.
**Then:** list-item fixture trips sub-check; heading-only fixture does not.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.3 — Lint wired as pre-commit hook or CI check

**Observable boundary:**
- A commit attempt violating AC-1.1, AC-1.2, AC-1.3, or AC-1.4 is blocked before reaching the remote.
- Wiring mechanism (`.git/hooks/pre-commit` symlink, `core.hooksPath` directory entry, or CI workflow file) exists and is documented.

**Given:** the build is complete.
**When:** a commit introducing a violation is attempted.
**Then:** commit fails with the lint's FAIL message; violation does not reach remote.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.1 — No file under `skills/design-committee/` is modified

**Observable boundary:**
- `git diff main..HEAD --name-only -- skills/design-committee/` on the merge commit produces zero output.
- No file under `skills/design-committee/agents/` appears in the diff.

**Given:** the build is committed to the sub-sprint branch.
**When:** a diff against `main` is taken.
**Then:** all changes under `skills/design-architect-committee/`, `tests/`, and `skills/setup-start/references/`; nothing under `skills/design-committee/`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.2 — Skill registration entry in `setup-start/references/skill-index.md`

**Observable boundary:**
- `skills/setup-start/references/skill-index.md` contains an entry for `design-architect-committee` with a description aligned with `SKILL.md` frontmatter. Entry placed in conventional position (near other `design-*` entries — ground-truth review 2026-05-23 confirmed existing entries for `design-committee` (line 29), `design-small-task` (line 28), `design-specify` (line 30)).

**Given:** the build is complete.
**When:** a reader greps `setup-start/references/skill-index.md` for `design-architect-committee`.
**Then:** at least one match; description aligned with `SKILL.md` frontmatter.

**Note for plan-build:** The CLAUDE.md two-place-sync convention texts (root `CLAUDE.md` line 99; `skills/CLAUDE.md` line 33) point at `setup-start/SKILL.md` rather than `references/skill-index.md`. Ground-truth verified the actual registration target. CLAUDE.md drift is a known-but-deferred maintenance item — record as `Decisions:` observation; do not amend CLAUDE.md in this build.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

## Change Log

- **03 (2026-05-23):** Initial Option B++ spec. Brief-strict (BL1-only lint, Markdown heading-anchor citations, ~18 ACs). Class-1 fact-correction errata absorbed (six-field CE; no-automatic-transitions clarification). Class-2 bounded-discretion placements applied (AX-008 convening convention in `schema/actors.md`; uppercase `SKILL.md` filename per Chester convention; `rules.md` as sidecar without Skill-tool frontmatter). Token grammar / appendix / broken-link sub-check explicitly out of scope per committee R2/R3/R4 + designer Decisions 4 and 5. Supersedes spec v00 / v01 / v02. Engineer R3 catch matrix + R4 probe-fp + R4 R1 feasibility verdict archived at `design/skill-files-kd3-future-considerations-00.md` as named evidence for any future KD-3 re-deliberation.

<!-- created-at: 2026-05-23T13:14:03Z -->
<!-- produced-by design-specify@v0003 -->
