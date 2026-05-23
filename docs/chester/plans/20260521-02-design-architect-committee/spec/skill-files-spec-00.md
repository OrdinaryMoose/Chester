# Spec: `design-architect-committee` Skill Files Build

**Sprint:** `20260521-02-design-architect-committee`
**Parent brief:** `docs/chester/working/20260521-02-design-architect-committee/design/skill-files-design-brief-00.md`
**Architecture:** Hybrid — data-only schema with token-anchor citations (committee-adjudicated via `chester:design-specify` competing-architectures step, 2026-05-23)

---

## Goal

Build the four operator-facing files for the `design-architect-committee` Chester skill (`skill.md`, `rules.md`, `schema/`, `design-brief-template.md`) plus the supporting lint plumbing, such that (1) the two prose files honor AX-003's 200-word body cap with no relief, (2) every closed-set enumeration lives in the seven `schema/` files as terse data with bracket-wrapped uppercase tokens (e.g., `[CE-SOURCE-ENUM]`, `[GATE-SESSION-CLOSE]`), (3) the two prose files cite tokens by literal name in prose rather than restating enumerations, (4) a pre-commit / CI lint script mechanically enforces the word cap, the list-item ban, token-presence, and token-collision detection, and (5) the worked template proves all three frozen deliverables (Constraint Envelope, Resolution Criterion, Coverage Map) emerge by read from a single populated Concern. The build does not modify the general `design-committee` skill or its agent files.

## Components

The build produces these new artifacts under `skills/design-architect-committee/`. No existing file outside this directory is modified.

- **`skill.md`** — operator-facing prose. YAML frontmatter (`name: design-architect-committee`, `description: <one-line trigger>`, `version: v0001`). Body content under 200 words, prose-only (no Markdown list items). Five prose sections: When To Invoke, What It Produces, Session Lifecycle, Outputs To, Scope Limits. Enumerations referenced by token name (e.g., "session closes when `[GATE-SESSION-CLOSE]` clears").
- **`rules.md`** — actor-discipline prose. YAML frontmatter (`name: design-architect-committee-rules`, `description: <discipline summary>`, `version: v0001`). Body content under 200 words, prose-only. Sections: Citation Meta-Rule (one-sentence statement), Designer Authority, Pole Authority, Clerk Authority, Forbidden Surfaces, Convening-Message Discipline. Enumerations referenced by token name.
- **`schema/`** — seven data-only files, word-limit exempt:
  - `schema/constraint-envelope.md` — five-field row shape, source-enum, provenance-enum, status-enum, prefix conventions. Sourced verbatim from `deliverables-locked-00.md` §3.1.
  - `schema/resolution-criterion.md` — four-field row shape, axiom-row exclusion, `collapse_test` IF NOT/THEN form, `structural_valid` BOOLEAN. Sourced from `deliverables-locked-00.md` §3.2.
  - `schema/coverage-map.md` — five-field row shape, status enum, status semantics. Sourced from `deliverables-locked-00.md` §3.3.
  - `schema/phases-and-transitions.md` — five named phases, five named transitions, cascade timing rules, withdrawal exception. Sourced from `process-locked-00.md` §4.
  - `schema/procedures.md` — twelve named procedures, each with Mutates / Trigger / Gates / State one-liner fields. Sourced from `procedures-locked-00.md` §5.
  - `schema/actors.md` — five-role inventory, twelve-procedure-to-actor mapping plus Dispatch Round, designer-surface-per-phase. Sourced from `actors-locked-00.md` §6.
  - `schema/integrity-rules.md` — five cross-artifact FK rules, three-condition session-close gate predicate. Sourced from `deliverables-locked-00.md` §3.4 and `process-locked-00.md` §4.8.
- **`design-brief-template.md`** — word-limit exempt worked example with one Concern (`CE-001`), one axiom (`AX-001`), one Proposition (`PR-001`), one Resolution Criterion row, one Coverage Map row. Each populated field's shape matches the corresponding `schema/` file. The three frozen deliverables (Constraint Envelope rows, Resolution Criterion row, Coverage Map row) are visible by direct inspection.
- **`scripts/lint-skill-files.sh`** — pre-commit / CI lint script. Four sub-checks: (1) word-count cap on `skill.md` and `rules.md` body content; (2) list-item ban (`^- ` or `^[0-9]+\. `) in capped-file bodies; (3) token-presence (every `[TOKEN]` cite in capped files resolves to a `**[TOKEN]**` definition line somewhere under `schema/`); (4) token-collision detection (no two `schema/` files define the same `**[TOKEN]**`). Exits non-zero on any failure.
- **Pre-commit hook wiring** — either a symlink from `.git/hooks/pre-commit` invoking `lint-skill-files.sh`, or an entry under a `core.hooksPath` directory plus installation guidance documented in a brief `skills/design-architect-committee/README.md` or in `skill.md` itself (subject to word-cap).

## Data Flow

The four files compose at three different times. Each composition path must remain legible to the actor reading it.

- **At designer-invocation time** (a designer reads `skill.md` to decide whether to invoke `chester:design-architect-committee`). The designer reads `skill.md` body in isolation. Every enumeration the body references is named by token; if the designer wants the closed-set, they open the corresponding `schema/<file>.md` and search for the bold token-definition line. No designer ever reads the brief or the locked specs during routine invocation — `skill.md` plus `schema/` is sufficient.
- **At session-run time** (a `design-architect-committee` session is in progress). The Clerk script (out-of-scope for this build but consumes this build's contract) reads `schema/` files as its rule source: closed-set enums for field validation, gate predicates for session-close evaluation, FK rules for cross-artifact integrity. The team-lead at session-close packaging reads the Clerk-certified working record and produces the on-disk handoff conforming to the locked-spec hand-off shape (out-of-scope for this build).
- **At skill-revision time** (a future editor modifies one of the four files). The editor edits a `schema/` file to update a closed-set enum (e.g., adding a new phase). The lint runs on commit and verifies: (a) `skill.md` and `rules.md` stay under 200 words; (b) no list-item lives in their body; (c) every token cited in the capped files still resolves to a `schema/` definition; (d) no two schemas define the same token. If a citation is broken or a token is duplicated, the commit fails with a clear FAIL message indicating which file and which token.
- **At plan-build / execute-write time** (a future agent implements this spec). plan-build derives implementing tasks from the AC blocks below. execute-write resolves any decision propagation back to a specific AC. The placeholders `Implementing tasks:` and `Decisions:` under each AC are written by those downstream agents, not by this spec.

## Error Handling

The build has three failure surfaces, each with a specific response.

- **Cap violation at commit time.** `skill.md` or `rules.md` body exceeds 200 words. Lint prints `FAIL: skill.md body word count {N} exceeds cap of 200` and exits non-zero. Commit blocked. Resolution: shrink the prose or push more content into `schema/`.
- **List-item violation at commit time.** A Markdown list item (`^- ` or `^[0-9]+\. `) appears in a capped file's body. Lint prints `FAIL: skill.md body line {N} matches forbidden list pattern: '{line}'`. Commit blocked. Resolution: rewrite as prose or move the enumeration to `schema/`.
- **Token resolution failure at commit time.** A capped file cites `[TOKEN-X]` that has no matching `**[TOKEN-X]**` definition under `schema/`. Lint prints `FAIL: skill.md cites [TOKEN-X] not defined in any schema/ file`. Commit blocked. Resolution: either define the token in the appropriate `schema/` file or rewrite the cite.
- **Token collision at commit time.** Two `schema/` files both define `**[TOKEN-Y]**`. Lint prints `FAIL: token [TOKEN-Y] defined in both schema/{a}.md and schema/{b}.md`. Commit blocked. Resolution: rename one definition; update every cite site if the wrong file's token was the canonical one.
- **Template structural drift.** The worked template's populated rows no longer match the schema field shape. This is not caught by the lint (template is word-limit exempt and free-form). Mitigation: a test under `tests/test-design-architect-committee-template.sh` (added by this build) greps the template for required section headings and required populated-row anchors. Test failure surfaces drift; manual fix required.

## Testing Strategy

Three test categories.

- **Lint self-tests.** Add `tests/test-design-architect-committee-lint.sh` exercising each of the four sub-checks against synthetic fixtures (a capped file just over 200 words, a capped file with a list item, a capped file citing an undefined token, two schema files defining the same token). Each fixture must trip exactly the expected sub-check.
- **Schema structural tests.** Add `tests/test-design-architect-committee-schema.sh` greppping each of the seven `schema/` files for required content anchors (e.g., `constraint-envelope.md` must contain `[CE-FIELD-SHAPE]`, `[CE-SOURCE-ENUM]`, `[CE-PROVENANCE-ENUM]`, `[CE-STATUS-ENUM]`, `[CE-PREFIX-CONVENTION]`). One assertion per required anchor. Failure indicates a schema file is missing required content.
- **Template structural test.** Add `tests/test-design-architect-committee-template.sh` greppping `design-brief-template.md` for the populated worked example sections (Concerns, Constraint Envelope, Resolution Criterion, Coverage Map) and for the required populated-row anchor IDs (`CE-001`, `AX-001`, `PR-001`).

Test pattern follows existing Chester convention from `tests/test-*.sh` — self-contained bash, `set -euo pipefail`, exit 0 = pass, non-zero = fail, one-line FAIL message per assertion.

## Constraints

Cross-cutting constraints inherited from the brief and the locked Alternative F handoff.

- **AX-003 no-relief word cap.** `skill.md` and `rules.md` body content (frontmatter excluded) at most 200 words. Schema files and the worked template are exempt.
- **AX-008 voice asymmetry.** Inter-agent deliberation prompts inside a `design-architect-committee` session use caveman ultra. Designer-facing surfaces (the four files in this build) use normal terse markdown. Documented inside this build via the `[CONVENE-MSG-PATTERN]` token defined in `schema/actors.md`.
- **Floor-not-ceiling rule** from general `design-committee/SKILL.md`. This build adds steps, schemas, gates, and roles via the convening-message attach point at session-run time but never modifies the general primitive.
- **Three forbidden attach surfaces.** No file under `skills/design-committee/` (the general primitive) and no file under `skills/design-committee/agents/` is modified by this build. Output-format field labels in the general primitive are not redefined.
- **Existing skill-folder layout convention** from `skills/CLAUDE.md`. `skills/design-architect-committee/` follows the `{phase}-{name}/SKILL.md` pattern. Supporting files in `schema/` and `scripts/` subdirectories per established convention. Frontmatter fields: `name`, `description`, `version: v####`.
- **Two-place sync** from `skills/CLAUDE.md`. `skill.md` frontmatter `description` field and the matching entry in `skills/setup-start/SKILL.md`'s available-skills list must stay in lockstep. This build adds the entry to `setup-start`.
- **Locked specs are canonical source.** The seven schema files transcribe content from `deliverables-locked-00.md`, `process-locked-00.md`, `procedures-locked-00.md`, `actors-locked-00.md`. If a locked spec changes in a future sprint, the schema files change; the schema files do not authoritatively change the locked specs.

## Non-Goals

Explicitly out of scope for this build, per the brief's Out of scope section. Each is named in `handoff-alternative-f-design-details-00.md` §8 as outstanding work in a separate sub-sprint.

- The Clerk deterministic script implementation. The schema files this build produces are the contract surface the future Clerk script will read; this build does not produce the script itself.
- The team-lead dispatch convention for the four pole subagents inside a `design-architect-committee` session.
- The on-disk session-close hand-off file shape the team-lead produces from the Clerk-certified working record.
- The working-directory layout for an active `design-architect-committee` session.
- Modification of the general `design-committee` skill, its SKILL.md, or any file under `skills/design-committee/agents/`.

---

## Acceptance Criteria

Eighteen criteria seeded from the brief's AC-1..AC-18 plus four additional criteria seeded from the hybrid token-anchor architecture chosen in design-specify Step 3 (AC-4.1 .. AC-4.4) and one from the lint sub-checks needed under hybrid (collision detection — AC-6.4). Numbering is per-section. IDs are immutable once approved; refinements use suffix form (e.g., `AC-1.1a`).

### AC-1.1 — `skill.md` body within 200-word cap

**Observable boundary:**
- `wc -w` on `skill.md` body content (lines after the second YAML `---` delimiter) returns a count of 200 or less.

**Given:** `skill.md` exists at `skills/design-architect-committee/skill.md` with valid YAML frontmatter.
**When:** `scripts/lint-skill-files.sh` runs the word-cap sub-check.
**Then:** sub-check reports `PASS: skill.md body word count {N}` where N ≤ 200; exit code 0.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.2 — `rules.md` body within 200-word cap

**Observable boundary:**
- `wc -w` on `rules.md` body content returns a count of 200 or less.

**Given:** `rules.md` exists at `skills/design-architect-committee/rules.md` with valid YAML frontmatter.
**When:** the lint runs the word-cap sub-check.
**Then:** sub-check reports `PASS: rules.md body word count {N}` where N ≤ 200; exit code 0.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.3 — `skill.md` body contains no Markdown list items

**Observable boundary:**
- `grep -E '^- |^[0-9]+\. ' skill.md` filtered to body content (lines after frontmatter) returns zero matches.

**Given:** `skill.md` body content.
**When:** the lint runs the list-item-ban sub-check.
**Then:** sub-check reports `PASS: skill.md body free of list items`; exit code 0. Section headings (`##`, `###`) are not list items and are permitted.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.4 — `rules.md` body contains no Markdown list items

**Observable boundary:**
- `grep -E '^- |^[0-9]+\. ' rules.md` filtered to body content returns zero matches.

**Given:** `rules.md` body content.
**When:** the lint runs the list-item-ban sub-check.
**Then:** sub-check reports `PASS: rules.md body free of list items`; exit code 0.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-1.5 — `rules.md` carries the citation-discipline meta-rule sentence

**Observable boundary:**
- `rules.md` body contains the literal sentence: *Closed-set content lives in `schema/`; capped files cite by token anchor, never restate.* (exact wording, one sentence, located in the Citation Meta-Rule section).

**Given:** `rules.md` body.
**When:** a reader greps for the literal phrase "cite by token anchor".
**Then:** exactly one match returned, located inside the body (not the frontmatter).

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-2.1 — `schema/` directory contains exactly seven named files

**Observable boundary:**
- `ls skills/design-architect-committee/schema/` returns exactly these seven filenames in lexicographic order: `actors.md`, `constraint-envelope.md`, `coverage-map.md`, `integrity-rules.md`, `phases-and-transitions.md`, `procedures.md`, `resolution-criterion.md`.

**Given:** the build is complete.
**When:** the directory listing is taken.
**Then:** the seven filenames above are present; no eighth file exists; all seven files are non-empty.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.1 — `schema/constraint-envelope.md` carries CE row shape

**Observable boundary:**
- File contains the bracket-wrapped tokens `**[CE-FIELD-SHAPE]**`, `**[CE-SOURCE-ENUM]**`, `**[CE-PROVENANCE-ENUM]**`, `**[CE-STATUS-ENUM]**`, `**[CE-PREFIX-CONVENTION]**` each on its own definition line.
- Source enum values present: `AXIOM`, `PROPOSITION`. Provenance enum values present: `DESIGNER`, `AGENT`. Status enum values present: `RATIFIED`, `REVISED-PENDING`. Prefix conventions named: `CE-NNN`, `AX-NNN`, `PR-NNN`.

**Given:** `schema/constraint-envelope.md` is written.
**When:** a reader greps for the five required tokens.
**Then:** each token returns exactly one match.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.2 — `schema/resolution-criterion.md` carries RC row shape

**Observable boundary:**
- File contains the tokens `**[RC-FIELD-SHAPE]**`, `**[RC-AXIOM-EXCLUSION]**`, `**[RC-COLLAPSE-FORM]**`, `**[RC-STRUCTURAL-VALID]**` each on its own definition line.
- The IF NOT/THEN contrapositive form requirement is stated. `structural_valid` is declared as BOOLEAN, Clerk-set, must be TRUE before designer ratification accepted.

**Given:** the schema file is written.
**When:** a reader greps for the four required tokens.
**Then:** each returns exactly one match.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.3 — `schema/coverage-map.md` carries CM row shape

**Observable boundary:**
- File contains the tokens `**[CM-FIELD-SHAPE]**`, `**[CM-STATUS-ENUM]**`, `**[CM-STATUS-SEMANTICS]**` each on its own definition line.
- Status enum values present: `COVERED`, `AXIOM-ONLY`, `GAP`. Status semantics: COVERED requires ≥1 RATIFIED PROPOSITION; AXIOM-ONLY permits close with flag; GAP blocks close.

**Given:** the schema file is written.
**When:** a reader greps for the three required tokens.
**Then:** each returns exactly one match.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.4 — `schema/phases-and-transitions.md` carries the five-phase lifecycle

**Observable boundary:**
- File contains the tokens `**[PHASE-STATE-LIST]**`, `**[PHASE-TRANSITION-TABLE]**`, `**[CASCADE-TIMING]**`, `**[WITHDRAWAL-RULE]**` each on its own definition line.
- The five named phases (`OPEN`, `ANCHORED`, `DELIBERATING`, `RATIFYING`, `CLOSED`) appear. The five transitions are enumerated with from-state, to-state, and trigger.

**Given:** the schema file is written.
**When:** a reader greps for the required tokens and phase names.
**Then:** each returns at least one match.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.5 — `schema/procedures.md` carries the twelve named procedures

**Observable boundary:**
- File contains the token `**[PROCEDURE-LIST]**` plus one token per procedure: `**[PROC-ADD-CONCERN]**`, `**[PROC-ADD-EVIDENCE]**`, `**[PROC-ADD-AXIOM]**`, `**[PROC-INITIATE-DELIBERATION]**`, `**[PROC-PROPOSE-PROPOSITION]**`, `**[PROC-SUBMIT-ROUND]**`, `**[PROC-LINT-BATCH]**`, `**[PROC-RATIFY-ROW]**`, `**[PROC-RE-RATIFY-ROW]**`, `**[PROC-REVISE-ROW]**`, `**[PROC-WITHDRAW-ENTRY]**`, `**[PROC-CLOSE-SESSION]**`.
- Each procedure entry carries four one-liner fields: Mutates, Trigger, Gates, State.

**Given:** the schema file is written.
**When:** a reader greps for the thirteen required tokens (the procedure-list token plus twelve per-procedure tokens).
**Then:** each returns exactly one match.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.6 — `schema/actors.md` carries the five-role inventory

**Observable boundary:**
- File contains the tokens `**[ROLE-INVENTORY]**`, `**[PROCEDURE-ACTOR-MAP]**`, `**[DESIGNER-SURFACE-PER-PHASE]**`, `**[CONVENE-MSG-PATTERN]**` each on its own definition line.
- Five named roles present: Designer, Pole, Clerk, Team-Lead, Researcher. Procedure-to-actor mapping enumerates all twelve procedures plus Dispatch Round (thirteen entries total).
- `[CONVENE-MSG-PATTERN]` definition states inter-agent prompts use caveman ultra; designer-facing surfaces use normal terse markdown.

**Given:** the schema file is written.
**When:** a reader greps for the four required tokens.
**Then:** each returns exactly one match.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-3.7 — `schema/integrity-rules.md` carries FK rules and session-close gate

**Observable boundary:**
- File contains the tokens `**[FK-RULES]**`, `**[GATE-SESSION-CLOSE]**` each on its own definition line.
- Five cross-artifact FK rules present. Three-condition session-close gate predicate present (zero GAP rows; zero REVISED-PENDING rows; every PROPOSITION row has exactly one matching `structural_valid = TRUE` Resolution Criterion row).

**Given:** the schema file is written.
**When:** a reader greps for the two required tokens.
**Then:** each returns exactly one match.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.1 — Token format convention is consistent across `schema/` and capped files

**Observable boundary:**
- Every token appears as `[SCREAMING-KEBAB]` in cite sites (inside `skill.md`, `rules.md`) and as `**[SCREAMING-KEBAB]**` (bold-wrapped) on its definition line in a `schema/` file.
- Token names consist of uppercase letters and hyphens only (`[A-Z][A-Z-]+`).

**Given:** all four files are written.
**When:** a reader extracts `[TOKEN]` references from `skill.md` and `rules.md` and `**[TOKEN]**` definitions from `schema/`.
**Then:** every cited token matches the format `[A-Z][A-Z-]+` and resolves to a bold-formatted definition in some `schema/` file.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.2 — Token uniqueness across `schema/` directory

**Observable boundary:**
- `grep -hoE '\*\*\[[A-Z][A-Z-]+\]\*\*' schema/*.md | sort | uniq -d` returns zero lines.

**Given:** all seven schema files are written.
**When:** the lint runs the token-collision sub-check.
**Then:** sub-check reports `PASS: no token collision across schema/`; exit code 0.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.3 — Capped files cite tokens (not heading anchors)

**Observable boundary:**
- `skill.md` and `rules.md` bodies contain no Markdown link anchors of the form `[text](path#heading)` referencing schema files. Every cross-reference to schema content uses the `[TOKEN]` form by literal name.

**Given:** the two capped files are written.
**When:** a reader greps for `](.*\.md#` patterns in either body.
**Then:** zero matches; all citations use `[TOKEN]` form instead.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-4.4 — Every cited token resolves to a `schema/` definition

**Observable boundary:**
- For every `[TOKEN]` reference in `skill.md` or `rules.md` body, there exists exactly one `**[TOKEN]**` definition line in some file under `schema/`.

**Given:** all four files are written.
**When:** the lint runs the token-presence sub-check.
**Then:** sub-check reports `PASS: all cited tokens resolve to schema/ definitions`; exit code 0.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.1 — `design-brief-template.md` contains a populated worked example

**Observable boundary:**
- File contains a Concerns section with at least one populated Concern (`CE-001`).
- File contains a Constraint Envelope section with at least one axiom row (`AX-001`) and one Proposition row (`PR-001`), each with all five fields (`source`, `provenance`, `status`, plus prefix-keyed entry_id and body) populated.
- File contains a Resolution Criterion section with at least one row matching `PR-001`, with `collapse_test` and `structural_valid = TRUE`.
- File contains a Coverage Map section with at least one row for `CE-001`, with `axiom_ids`, `proposition_ids`, `evidence_ids`, `status` populated.

**Given:** the template is written.
**When:** the template structural test greps for the required section headings and the required populated-row anchor IDs.
**Then:** each grep returns at least one match.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-5.2 — All three frozen deliverables visible by direct inspection

**Observable boundary:**
- A reader of `design-brief-template.md` can identify, without synthesis, the Constraint Envelope rows, the Resolution Criterion row, and the Coverage Map row as three independently readable sections, each matching the field shape declared in the corresponding `schema/` file.

**Given:** the template is written.
**When:** a reader inspects the file top-to-bottom.
**Then:** three deliverable sections are present in clearly-named sections; each section's populated rows match the field shape of the corresponding schema (via shared field names and value-format conventions).

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.1 — Lint word-count sub-check operational

**Observable boundary:**
- `scripts/lint-skill-files.sh` invoked against a fixture `skill.md` with 250 body words exits non-zero with message `FAIL: skill.md body word count 250 exceeds cap of 200`.
- Same script invoked against `skill.md` with 150 body words exits 0 with message `PASS: skill.md body word count 150`.

**Given:** lint script and fixtures exist.
**When:** the lint self-test runs against the two fixtures.
**Then:** failure fixture trips word-count sub-check; passing fixture does not.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.2 — Lint list-item-ban sub-check operational

**Observable boundary:**
- `lint-skill-files.sh` invoked against a fixture capped file containing a line beginning with `- ` in its body exits non-zero with message `FAIL: skill.md body line {N} matches forbidden list pattern`.
- Same script against a fixture with section headings only (no list items) exits 0.

**Given:** lint script and fixtures exist.
**When:** the lint self-test runs.
**Then:** list-item fixture trips the sub-check; heading-only fixture does not.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.3 — Lint token-presence sub-check operational

**Observable boundary:**
- `lint-skill-files.sh` invoked against a fixture pair where `skill.md` cites `[FAKE-TOKEN]` and no `schema/` file defines it exits non-zero with message `FAIL: skill.md cites [FAKE-TOKEN] not defined in any schema/ file`.
- Same script against a fixture where every cited token is defined exits 0.

**Given:** lint script and fixtures exist.
**When:** the self-test runs.
**Then:** undefined-token fixture trips the sub-check; resolved fixture does not.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.4 — Lint token-collision sub-check operational

**Observable boundary:**
- `lint-skill-files.sh` invoked against a fixture where two `schema/` files define the same `**[DUP-TOKEN]**` exits non-zero with message `FAIL: token [DUP-TOKEN] defined in both schema/{a}.md and schema/{b}.md`.
- Same script against a fixture with unique tokens exits 0.

**Given:** lint script and fixtures exist.
**When:** the self-test runs.
**Then:** collision fixture trips the sub-check; unique-token fixture does not.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-6.5 — Lint wired as pre-commit hook or CI check

**Observable boundary:**
- A commit attempt that violates any of AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-4.2, AC-4.4 is blocked by an automated check before reaching the remote.
- The wiring mechanism (`.git/hooks/pre-commit` symlink, `core.hooksPath` directory, or CI workflow file) exists and is documented.

**Given:** the build is complete.
**When:** a commit introducing a violation is attempted.
**Then:** the commit fails with the lint's FAIL message; the violation does not reach the remote.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.1 — No file under `skills/design-committee/` is modified

**Observable boundary:**
- `git diff main..HEAD --name-only -- skills/design-committee/` on the merge commit produces zero output.
- No file under `skills/design-committee/agents/` appears in the diff.

**Given:** the build is committed to the sub-sprint branch.
**When:** a diff is taken against `main`.
**Then:** all changes live under `skills/design-architect-committee/` and `tests/` and `setup-start/SKILL.md`; no changes under `skills/design-committee/`.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.2 — Caveman-ultra inter-agent convention documented via schema

**Observable boundary:**
- `schema/actors.md` defines `**[CONVENE-MSG-PATTERN]**` with content stating that inter-agent deliberation prompts inside a `design-architect-committee` session use caveman ultra, and that designer-facing surfaces (the four build files) use normal terse markdown.
- `rules.md` body cites `[CONVENE-MSG-PATTERN]` in the Convening-Message Discipline section.
- No file under `skills/design-committee/agents/` is modified to carry this convention.

**Given:** the build is complete.
**When:** a reader greps the schema file for the token definition and the rules file for the cite.
**Then:** both are present; no agent file modification.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

### AC-7.3 — `setup-start/SKILL.md` available-skills list carries the new skill

**Observable boundary:**
- `skills/setup-start/SKILL.md` available-skills section contains an entry for `design-architect-committee` with a description matching the frontmatter of `skill.md`.

**Given:** the build is complete.
**When:** a reader greps `setup-start/SKILL.md` for `design-architect-committee`.
**Then:** at least one match returned, located inside the available-skills section.

**Implementing tasks:** (populated by plan-build)
**Decisions:** (populated by execute-write)

---

## Change Log

- **00 (2026-05-23):** Initial spec written from the approved design brief and the hybrid architecture chosen via design-specify Step 3 (data-only schema + token-anchor citations). Twenty-two acceptance criteria covering capped-file discipline (AC-1.x), schema directory layout (AC-2.x), schema file contents (AC-3.x), token-anchor discipline (AC-4.x), worked template (AC-5.x), lint plumbing (AC-6.x), and forbidden-surface / voice / registration constraints (AC-7.x).
- **SUPERSEDED (2026-05-23):** Committee R2 review diagnosed design-specify drift — token grammar treated brief KD-3's chosen sub-path 1 as discretionary implementation when KD-3 had explicitly weighed lint alternatives. Spec v00 abandoned. Replaced by spec v03 (Option B++) at `spec/skill-files-spec-03.md`. This version retained for audit trail per Decision 6a.

<!-- created-at: 2026-05-23T09:13:44Z -->
<!-- produced-by design-specify@v0003 -->
