# Session Summary — Decompose the Specification System

**Sprint:** 20260612-02-expand-committee-responsibilities
**Date:** 2026-06-12 / 2026-06-13
**Branch:** 20260612-02-expand-committee-responsibilities
**Status:** Execution complete — 38/38 tests green, tree clean, ready to archive + close.

## Goal

Eliminate duplicated architecture work in Chester's specification stage. The fused `design-specify` skill always ran its architecture-settling front half, so a FAC-complete committee design had its architecture re-derived (observed in 100% of real committee→design-specify hand-offs). Decompose `design-specify` along its already-clean internal seam into three skills so architecture work runs once, where it is needed, and never twice.

## Decided / Completed

- **Three-skill decomposition (D1, committee-ratified):** `spec-architect` (settle) → `spec-write` (author) → `spec-harden` (verify), replacing `design-specify` by extraction.
- **No-duplication is structural, not gated (D8):** the committee path never invokes `spec-architect`; `spec-write` contains no architecture stage, so re-derivation is impossible by construction.
- **Shared input type (D6/D9):** the eight-field "FAC-complete design" contract with two interchangeable producers (committee verdict; `spec-architect` output), extracted from each producer's native output, guarded by a mandatory architecture quote-back.
- **Producer-neutral spec-template Architecture field (D10):** records the settled result, not the settling process; satisfiable identically by either producer.
- **Adversarial pass stays in `spec-harden` (D5/D11):** authoring context supplied by agent continuity in the normal pipeline; ad-hoc standalone hardening of any spec is a first-class capability.
- **Atomic cutover (D12):** `design-specify` deleted in the same sprint; extraction not rewrite — review and authoring behavior moved verbatim (all three spec reviews confirmed byte-for-byte fidelity).
- **Every live caller migrated:** `design-small-task`, `util-artifact-schema`, `plan-build`, `start-bootstrap`, `finish-write-records`, `execute-write`, `design-committee`, plus current-state docs (`docs/instructions.md`, `docs/README.md`). Historical record (`_archive/`, `docs/feature-definition/`, decision-records, postmortems) intentionally preserved.
- **Version bumps (principle: bump iff a transition / invoked-by / producer-identity / standalone-support contract changed):** design-small-task v0005, util-artifact-schema v0004, plan-build v0007, start-bootstrap v0004, finish-write-records v0005; three new skills at v0001. Descriptive-only edits (execute-write, design-committee) correctly did not bump.
- **Catalog regenerated** (drops design-specify, adds the three new skills); 9 existing tests updated, 7 new tests added (per-AC structural + migration-completeness gate).
- Final cross-task integration review: clean on all seven seams (pipeline continuity, reference resolution, provenance-identity consistency, orphan check, catalog, version/pin coherence, whole suite).

## Produced

- **Design brief:** `design/…-design-00.md` (12 decisions D1–D12).
- **Spec:** `spec/…-spec-01.md` + ground-truth report `spec/…-spec-ground-truth-report-00.md` (dogfooded via design-specify's skip-architecture path).
- **Plan:** `plan/…-plan-00.md` (12 tasks, subagent mode) + threat report `plan/…-plan-threat-report-00.md` (Moderate risk; 3 HIGH suite-breaks caught and fixed before execution).
- **Committee record:** `committee/round01–04`, `ledger.md`, `resolution.md` (four-round deliberation, 3S ratified).
- **Code:** three new skills (`skills/spec-architect/`, `skills/spec-write/`, `skills/spec-harden/`) + new reference `fac-complete-design-contract.md`; `skills/design-specify/` deleted; 13 implementation commits + checkpoint (`c1196b74..d3cf84c`).

## Deferred / Open

- **Authoring-notes-artifact mechanism** — not built; agent continuity supplies adversarial context (D5/D11). Documented fallback only.
- **Typed FAC-bundle artifact** — rejected in favor of extraction (D9); fallback if quote-back proves unreliable in practice.
- **Adversarial-pass independence (Round 01 H/M/L)** — explicitly decoupled; a separate future decision.
- **`tests/test-no-archived-refs.sh` / class-3 re-adjudication** — the `docs/feature-definition/Pending/design-specify-class-3-re-adjudication-00.md` brief is now moot (its subject skill is gone); not cleaned up this sprint (historical/pending doc, out of migration scope).

## What Next Session Needs

- Archive artifacts (`finish-archive-artifacts`) then close the worktree (`finish-close-worktree`) — branch `20260612-02-expand-committee-responsibilities` ready to merge.
- After merge: `/reload-plugins` to make `chester:spec-architect` / `chester:spec-write` / `chester:spec-harden` discoverable at runtime (the bash suite asserts file structure, not live registration).
- First real exercise of the new chain will validate the behavioral ACs (3.1/3.2/5.1) that the bash harness can only assert structurally.

## Session Skill Versions

<!-- produced-by design-committee@v0022 -->
<!-- produced-by design-specify@v0004 -->
<!-- produced-by plan-build@v0006 -->
<!-- produced-by finish-write-records@v0004 -->
