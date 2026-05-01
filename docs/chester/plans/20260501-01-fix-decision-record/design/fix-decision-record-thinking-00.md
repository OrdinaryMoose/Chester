# Thinking Summary — Decision Record System

**Sprint:** `20260501-01-fix-decision-record`
**Date:** 2026-05-01
**Companion artifacts:** `fix-decision-record-design-00.md` (brief), `fix-decision-record-process-00.md` (process evidence)

This document captures HOW the design conversation reached its conclusions: the decision shifts, the alternatives considered along the way, the designer corrections, the confidence levels, and the framing changes.

## Executive Summary

The session reframed the problem twice and reshaped the design twice. The post-mortem framed the existing decision-record system as needing tuning (Options A/B/C). The shadow-system enumeration showed the substantive decision capture is happening — just in unrelated artifacts (LBD briefs in StoryDesigner, the reasoning audit in Chester). The designer's three-rule constraint (no MCP, no artifact replacement, no TDD-loop) collapsed the design space to one shape: piggyback on the reasoning audit, emit structured records to a cross-sprint corpus alongside the audit prose, revert the 04-24 build-decision-loop additions surgically. Two altitudes of register correction along the way: first reframing R10 from "no content overlap" to "cooperative coexistence," then narrowing the problem statement from symptom-list to capture-function.

## Decision Log

Ordered by downstream significance (most consequential first).

---

### Audit-piggyback as capture mechanism

**Context:** The post-mortem proposed three options (A recede, B broaden trigger, C advisory reframe). The shadow-system enumeration showed 35 decision points across the cycle, only two captured by the existing DR system; 14 inline-prose-only. The StoryDesigner sample showed 77% substantive ratio captured through LBD briefs and master-plan versioning, with the persistent store empty there too.

**Information used:** Reasoning-audit format spec (`finish-write-records/references/record-formats.md`); finish-write-records SKILL.md JSONL-reading section; StoryDesigner master-plan version history; the discriminator criterion in the audit ("non-trivial decision points").

**Alternatives considered:**
- Per-decision emission at substantive moments (specify axis selection, F-A-C, hybrid, etc.) — rejected because requires agent memory or new skill steps at every decision point, costs tokens proportional to decision count, duplicates audit's discrimination judgment.
- Stage-close emission at end of each pipeline skill — rejected because fragments capture across multiple skill points, partial coverage compared to audit's whole-session reach, relies on session memory rather than authoritative JSONL transcript.
- Audit-time emission (chosen): single source pass, existing validated discrimination, fires outside build cadence, naturally covers all stages.

**Decision:** Records emit during the reasoning-audit pass in finish-write-records, sharing the JSONL source.

**Rationale:** The audit already does the discrimination work — selects four-to-twelve substantive decisions per session against an explicit criterion (deviation from plan, alternatives considered, information-driven choice, explicit rejection). Borrowing it eliminates the need to rebuild the filter. Honors all three of the designer's constraint rules (no MCP, no artifact replacement, no TDD-loop) cleanly. Honors simplicity rule (R6).

**Confidence:** High — the audit pattern is validated across many sprints; the integration is mechanical addition rather than new mechanism.

---

### No-MCP / no-artifact-replacement / no-TDD-loop constraints

**Context:** Mid-Solve Stage, after the design space had shifted toward design-specify capture. Designer added three constraints simultaneously.

**Information used:** Existing dr_capture / dr_supersede / dr_query MCP machinery; the propagation procedure's TDD-loop block; session-level artifact list (briefs, specs, plans, threat reports, audits, deferred items).

**Alternatives considered:** None offered after the rules landed — the rules were normative direction, not options to evaluate.

**Decision:** Three rules added: no MCP (capture via direct file I/O), no artifact replacement (cooperative coexistence with session artifacts), no TDD-loop participation (capture not a gate on build cadence).

**Rationale:** Designer-direct constraints. Each ruled out a class of approach: server-mediated capture, content-replacement model, in-loop interruption.

**Confidence:** High — designer-direct rules.

---

### R10 register correction: "no content overlap" → "cooperative coexistence"

**Context:** After the three constraints landed, the agent initially read R10 as forbidding content overlap with session artifacts, framing records as thin index entries with reference-only or reference-plus-tight-summary. Designer corrected: R10 means cooperative-not-replacement, both surfaces can carry duplicate content.

**Information used:** Designer's correction with example: "I am seeing the session artifacts as self contained within that session, if I need to refresh my memory on what the session did, I read these artifacts. But, if I am trying to figure out a trend, there is no place to go except for trying to read multiple session files."

**Alternatives considered:** None — direct register correction.

**Decision:** RULE-10 revised. Records can be substantive standalone documents, closer to ADR pattern. The distinguishing feature is cross-sprint aggregation, not content uniqueness.

**Rationale:** Session artifacts serve session-internal recall ("what did this sprint do"); records serve cross-sprint trend-finding ("what's been decided about X across sessions").

**Confidence:** High — designer correction with explicit framing example.

---

### Problem statement reframe: symptoms → capture function

**Context:** Stage transition. The agent's first polished problem statement enumerated symptoms (DR system empty, trigger inverse-coupled, execute-write triangle overhead, substantive signal leaking). Designer corrected: that captures symptoms, not the problem.

**Information used:** Designer's reframe: "now to capture agent made decisions within the specify, plan, write cycle in a simple searchable record that will preserve knowledge for future me and to inform future agent level planning."

**Alternatives considered:** None — direct reframe.

**Decision:** Problem statement: "Capture agent-made decisions across the design-specify, plan-build, and execute-write cycle in a simple searchable record format that preserves knowledge for future-me and informs future agent-level planning."

**Rationale:** Problem statement should describe the desired capture function, not the symptoms of the failed prior attempt. Lesson #2 (rejection = reframe) firing.

**Confidence:** High — designer ratified the polished version.

---

### Surgical revert vs merge-revert for execute-write

**Context:** Designer directed reverting execute-write to pre-04-24 baseline. Question: revert the entire 04-24 merge commit, or surgically remove only the DR-specific pieces?

**Information used:** Git log of post-04-24 commits touching the affected skills — provenance stamping (c7a2786, 4f4187c, 50856d5), heuristic execution-mode (78746a9), pluggable Understanding-MCP (f92c291), named subagents (fb66ac9), automatic ground-truth review (1a051c2), brief-to-spec AC seeding (0f28478), Session Skill Versions harvest (daaabfa), cluster-a Resolve Conditions (5f07c64).

**Alternatives considered:**
- Merge revert (whole commit) — rejected because every later improvement in the affected files would also be lost.
- Partial revert (remove some DR pieces) — rejected because dangling references would remain.
- Surgical revert (chosen) — selective line and file edits removing only DR-system-specific additions.

**Decision:** Surgical revert. Drop the chester-decision-record MCP package, the trigger-check + propagation step, the observable-behaviors artifact module, the spec-reviewer input restriction, the dr_query and must-remain-green plan-build additions, the AC-N.M skeleton manifest, the dr_verify_tests step, the dr_audit step, the propagation-procedure / test-generator / skeleton-generator reference files, the related bash tests, and the MCP registration. Preserve every other commit.

**Rationale:** Lesson #1 (partial migration check) firing — post-04-24 changes are not part of the failed DR system; they're independent improvements that happen to live in the same files.

**Confidence:** High — git log enumerated, scope precise.

---

### Storage shape: single file vs per-file

**Context:** R2 says markdown in decision-record/. R3 says append-only. Choice between single file growing over time or one file per record.

**Information used:** The existing canonical path (`decision-record.md`) was designed by the original DR system; ADR pattern uses one-file-per-record; bloat math (~10 records/sprint × 1 sprint/week = a few hundred records/year, manageable).

**Alternatives considered:**
- One file per record (`<id>.md` per decision) — cleaner architecturally, scales better, but introduces directory-listing convention.
- Single file, append-only (chosen) — matches the existing canonical path, agents grep one file, bloat distant.

**Decision:** Single markdown file at `docs/chester/decision-record/decision-record.md`, structured per-record sections separated by delimiter.

**Rationale:** Path already exists from original design (no migration question), grep-able as one corpus, bloat distant. Per-file scaling can be revisited if it bites.

**Confidence:** Medium-high — the path choice is the strongest factor; per-file would have been defensible if the path didn't already exist.

---

### Field set: ten/eleven structured fields, query-without-LLM-judgment

**Context:** Designer wanted agent-focused format. Choice between reusing existing 11-field schema (with three misfit fields), slimming down, or phase-typed records.

**Information used:** Existing schema with `spec_update`, `test`, `code` requirements that don't fit design/plan stages; reasoning audit format already structured (title, context, alternatives, decision, rationale, confidence); StoryDesigner LBD format.

**Alternatives considered:**
- Reuse existing schema with stub values for misfit fields — rejected because future query mixes record types.
- Slim down to design-fit subset — partial fit, doesn't extend cleanly to execute-time.
- Custom field set adapted from audit format (chosen) — drops misfit fields, adds cross-sprint affordances (id, sprint, stage, tags, supersedes, artifact_refs).

**Decision:** Eleven fields: id, date, sprint, stage, title, decision, rationale, alternatives, tags, supersedes, artifact_refs.

**Rationale:** Audit format is validated, adapts cleanly. Cross-sprint affordances added on top. Designer-focused = structured machine-queryable, not narrative prose.

**Confidence:** High — fields directly grounded in the audit format and the designer's "agent-focused" rule.

---

### Parallel filters with independent discrimination

**Context:** Designer locked: records and audit are parallel outputs over the same source, each with its own filter.

**Information used:** Designer's framing: "in essence we are free to scale the filters for either differently while reviewing the same session information."

**Alternatives considered:**
- Coupled filters (records subset of audit selections) — rejected because loses ability to tune cross-sprint relevance separately.
- Independent filters (chosen) — records can include precedent-setting minor decisions audit drops, or vice versa.

**Decision:** RULE-13 added. Filters tune independently across the two surfaces.

**Rationale:** Different altitudes have different relevance criteria. Decoupling preserves design freedom.

**Confidence:** High — designer-direct constraint.

---

### Supersession by forward scan

**Context:** R3 (append-only) plus R4 (supersession by reference) creates a question: how do agents discover supersession?

**Information used:** Existing dr_supersede pattern (writes bidirectional links with `supersedes` and `superseded_by` fields, but updates BOTH records — violates pure append-only).

**Alternatives considered:**
- Update old record's `superseded_by` field on supersession — rejected because mutates a prior record (violates R3).
- Maintain separate supersession-index file — rejected because regenerating it isn't append-only either.
- Forward-scan by querying agent (chosen) — only the new record carries the link; agents discover supersession by scanning forward for records whose `supersedes` names an earlier id.

**Decision:** Pure append-only. Old records stay pristine. Supersession discovered by forward scan.

**Rationale:** Cleanest fit for R3 + R4 invariants. Discipline burden lands on querying agent (always check for supersession when reading), not writing agent (never mutate). A small bash query helper could absorb the burden later if needed; not required day one.

**Confidence:** High — invariant-driven choice.

---

### Capture scope: include design-large-task and design-small-task

**Context:** Problem statement names "design-specify, plan-build, and execute-write cycle." Question: do design-large-task / design-small-task decisions get captured too when they ran in-session?

**Information used:** Designer's response: "scope - include everything." Audit reads whole session JSONL, naturally covers upstream design.

**Alternatives considered:**
- Restrict scope to specify+plan+write only — rejected because design-large/small often produce highest-value substantive decisions.
- Whole-session scope (chosen) — capture everything the audit covers.

**Decision:** RULE-12 added. Capture spans entire session.

**Rationale:** Designer-direct. Higher-value architecture-decision capture lives upstream.

**Confidence:** High — designer ratified.

---

## Plan Development

The plan was not pre-formed; it emerged through interview. Three context-exploration agents (codebase, prior art, industry) ran in parallel, surfacing the shadow-system map across 35 decision points and the StoryDesigner 77%-substantive ratio. The Round-One presentation surfaced three observations the designer pulled on directly: shadow-system enumeration request, substantive-vs-routine question, and the synthesis check ("triangle overkill, capture in specify"). Each pull narrowed the design until the three-rule constraint (no MCP, no replacement, no TDD-loop) collapsed the space to one shape.

## Understanding Shifts

- **Trigger-altitude diagnosis.** From "the trigger fires too rarely" (post-mortem framing) to "the trigger is at the wrong altitude — substantive decisions live upstream of where it listens."
- **Records as cross-sprint index.** Initial framing was "records ARE the substance"; designer corrected to "records aggregate substance from sessions; session artifacts and records cooperate."
- **Capture mechanism.** From "add capture step to design-specify" to "piggyback on the reasoning audit" — the audit was already doing the work; we just needed cross-sprint emission.
- **Revert scope.** From "broad rollback of 04-24 changes" to "surgical line edits preserving every later improvement."

<!-- created-at: 2026-05-01T13:37:58Z -->
<!-- produced-by design-large-task@v0009 -->
