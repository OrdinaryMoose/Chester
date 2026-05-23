# Ground-Truth Review Report — `skill-files-spec-01.md`

**Spec reviewed:** `spec/skill-files-spec-01.md`
**Design brief context:** `design/skill-files-design-brief-00.md`
**Sprint:** `20260521-02-design-architect-committee`
**Date:** 2026-05-23
**Status:** Findings (3 LOW, no HIGH or MEDIUM) — spec is safe to proceed to plan-build.

---

## Verified Claims

The reviewer opened every cited file and confirmed the following claims against the actual codebase.

- Locked source files exist at `docs/chester/working/20260521-02-design-architect-committee/design/`: `deliverables-locked-00.md`, `process-locked-00.md`, `procedures-locked-00.md`, `actors-locked-00.md` — all four present.
- **Constraint Envelope row fields** — CONFIRMED at `deliverables-locked-00.md:18-26`. Fields present: `concern_id`, `entry_id`, `source`, `body`, `provenance`, `status`. (Six fields by literal count; see LOW finding below on the wording.)
- **Resolution Criterion four-field row shape** — CONFIRMED at `deliverables-locked-00.md:32-37` (`concern_id`, `entry_id`, `collapse_test`, `structural_valid`).
- **Coverage Map five-field row shape** — CONFIRMED at `deliverables-locked-00.md:46-51` (`concern_id`, `axiom_ids`, `proposition_ids`, `evidence_ids`, `status`).
- **Five-phase lifecycle** `OPEN → ANCHORED → DELIBERATING → RATIFYING → CLOSED` — CONFIRMED at `process-locked-00.md:14`. Five transitions enumerated at `process-locked-00.md:24-28`.
- **Twelve named procedures** — CONFIRMED at `procedures-locked-00.md:16-100`: Add Concern, Add Evidence, Add Axiom, Initiate Deliberation, Propose Proposition, Submit Round, Lint Batch, Ratify Row, Re-Ratify Row, Revise Row, Withdraw Entry, Close Session.
- **Five roles** — CONFIRMED at `actors-locked-00.md:13-40`: Designer, Pole, Clerk, Team-lead, Researcher.
- **Five cross-artifact FK rules** — CONFIRMED at `deliverables-locked-00.md:64-72`.
- **Three-condition session-close gate** — CONFIRMED at `process-locked-00.md:89-93`.
- **Procedure-to-actor mapping with thirteen entries** (twelve procedures + Dispatch Round) — CONFIRMED at `actors-locked-00.md:46-60`.
- **General `design-committee` floor-not-ceiling rule and three forbidden attach surfaces** — CONFIRMED at `skills/design-committee/SKILL.md:48-54` (Floor-Not-Ceiling Rule) and `skills/design-committee/SKILL.md:56-62` (Three Forbidden Attach Surfaces — agent files, this SKILL.md, output-format field labels).
- **`bin/chester-trailer-write stamp <skill>@<version> <path>` CLI** — CONFIRMED at `bin/chester-trailer-write` (PATH wrapper) and `chester-util-config/chester-trailer-write.sh:9-15` (stamp subcommand parsing).
- **Test convention `set -euo pipefail` self-contained bash** — CONFIRMED at `tests/test-ac-2-1-pole-agents-exist.sh:3` and multiple sibling test files; convention also documented in `tests/CLAUDE.md`.
- **`core.hooksPath = .git/hooks`** — CONFIRMED at `.git/config:6`. Hooks directory contains only `.sample` files (no active hooks). `.git/hooks/pre-commit` is a usable target with no installation conflict.
- **SKILL.md frontmatter convention** (`name`, `description`, `version: v####`) — CONFIRMED at `skills/design-committee/SKILL.md:1-5` (v0004) and `skills/design-small-task/SKILL.md:1-5` (v0003). Documented in `skills/CLAUDE.md`.
- **AC-7.3 claim that `skills/setup-start/SKILL.md` itself names no individual skill** — CONFIRMED for `SKILL.md` directly (no skill names appear in the body). See LOW finding 2 below for the wrinkle.

---

## Findings

### LOW — Constraint Envelope is six fields, not five

- **Spec says** (Components section line 20, AC-3.1): "five-field row shape" for the Constraint Envelope.
- **Code shows** (`deliverables-locked-00.md:18-26`): six fields enumerated — `concern_id`, `entry_id`, `source`, `body`, `provenance`, `status`.
- **Impact:** Cosmetic wording inconsistency. AC-3.1's observable boundary checks for five tokens by name (`CE-FIELD-SHAPE`, `CE-SOURCE-ENUM`, `CE-PROVENANCE-ENUM`, `CE-STATUS-ENUM`, `CE-PREFIX-CONVENTION`) — none of those tokens encode "field count," so the tests pass either way. The implementer should treat "five-field row shape" as loose shorthand referring to the five token-anchored concepts and produce `schema/constraint-envelope.md` with all six actual fields from the locked source. **No fix to spec per LOW classification.**
- **Context for implementer:** when writing `schema/constraint-envelope.md`, transcribe all six fields from the locked source — do not let the spec's "five-field" wording cause field omission.

### LOW — `setup-start` skill listing exists at `references/skill-index.md`, not in `SKILL.md` body

- **Spec says** (AC-7.3, post-adversarial-fix): "as of 2026-05-23, `skills/setup-start/SKILL.md` contains no explicit 'Available Skills' section and does not name any individual skill ... The two-place-sync rule documented in CLAUDE.md appears to have drifted out of the current `setup-start/SKILL.md` body."
- **Code shows** (`skills/setup-start/SKILL.md:202-203`): the main SKILL.md directs readers to `references/skill-index.md` for the full skill catalog. `skills/setup-start/references/skill-index.md` lists individual skills by name — `design-committee` at line 29, `design-small-task` at line 28, `design-specify` at line 30, `design-large-task` at line 27.
- **Impact:** The two-place-sync target appears to be `setup-start/references/skill-index.md` rather than `setup-start/SKILL.md`. AC-7.3 understates discoverability — the listing exists, just one directory deeper. The CLAUDE.md prose was misleadingly imprecise (pointed at `setup-start/SKILL.md` itself instead of the referenced index), not actually wrong. **No fix to spec per LOW classification, but this materially tightens plan-build's resolution path.**
- **Context for implementer:** plan-build's resolution of AC-7.3 should add a `design-architect-committee` entry to `skills/setup-start/references/skill-index.md` matching `skill.md`'s frontmatter description. Resolution (b) in AC-7.3 (registration-by-file-presence-only) is too permissive; the index file exists and conventionally needs the entry. Resolution (c) (CLAUDE.md drift surfacing) is still warranted as a separate observation since CLAUDE.md should point at the references file, not the SKILL.md body.

### LOW — Phase transition table carries a load-bearing implicit constraint

- **Spec says** (AC-3.4): the `[PHASE-TRANSITION-TABLE]` token captures "the five named transitions with from-state, to-state, and trigger."
- **Code shows** (`process-locked-00.md:29`): "No transition fires automatically on a coverage condition. Every advance is designer-triggered" — a load-bearing constraint about transition semantics that lives below the transition list itself.
- **Impact:** Confirmed accurate; not a discrepancy. Flagging because the implementer transcribing the five transitions into `schema/phases-and-transitions.md` should preserve the "designer-triggered, never automatic" constraint as part of the schema content. **No fix to spec per LOW classification.**
- **Context for implementer:** when writing the `[PHASE-TRANSITION-TABLE]` definition, include the designer-triggered constraint as a one-liner alongside the five transitions.

---

## Risk Assessment

The spec accurately describes the codebase it targets. All seven schema sources, the general `design-committee` floor contract, the trailer-write CLI, the test convention, the SKILL.md frontmatter convention, and the hooks path are confirmed at the cited locations. The HIGH and MEDIUM findings raised during adversarial review (incorrect section-number references; AC-7.3 referring to a non-existent listing) were fixed in version 01.

The three LOW findings are context-not-blockers — one cosmetic wording inconsistency, one tightening of AC-7.3's resolution path (the listing exists at a slightly different location than the spec searched), one preservation reminder for an implicit constraint. Spec is safe to proceed to plan-build without further revision. Plan-build's `Decisions:` blocks should record the implementer's handling of each LOW finding so the resolutions are traceable.

---

## Change Log

- **00 (2026-05-23):** Initial ground-truth review report. Three LOW findings, no HIGH or MEDIUM. Spec approved for plan-build pending user review gate.

<!-- created-at: 2026-05-23T09:21:26Z -->
<!-- produced-by design-specify@v0003 -->
