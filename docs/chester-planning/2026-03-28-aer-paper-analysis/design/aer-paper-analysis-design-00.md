# Design Brief: Chester AER Paper Analysis

## Sprint: 2026-03-28-aer-paper-analysis
## Date: 2026-03-28
## Status: Approved

---

## Problem Statement

Apply the source paper's ("Optimizing AI Agent Effectiveness Under Token Cost Constraints," v2, March 2026) qualitative decision framework to Chester's multi-step agent pipeline to produce an architectural specification — in the form of an applied research paper — that maps each pipeline stage against the paper's five diagnostic dimensions, identifies which strategy configuration each stage falls into, and determines where token-reducing interventions can be applied without degrading effectiveness.

## Deliverable

**Title:** "AI Agent Effectiveness Review of the CHESTER Multi-Agent System Under Token Cost Constraints"
**Authors:** Mike and Claude
**Format:** .docx
**Output location:** `/home/mike/.claude/skills/docs/chester/2026-03-28-chester-optimization-research`

## Architecture Decisions

### 1. Subagent Fork Confirmed

The source paper's D(U) context degradation model confirmed that context consolidation has diminishing returns. Quality degrades non-uniformly as context fills — the prior single-context hypothesis is invalidated. Chester stays on the multi-agent architecture.

### 2. Per-Stage Individual Assessment

Each Chester pipeline stage is assessed individually against its own mandate. Write-code's effectiveness is measured by how well it implements the plan it was given, not by whether the plan was good. Cross-correlations between stages are mapped after individual assessments are complete.

### 3. Two Analytical Instruments

**Qualitative Decision Framework (source Section 5):**
- Five diagnostic dimensions (Task Decomposability, Context Stability, Success Observability, Volume/Frequency, Task Stakes) applied to each Chester pipeline stage
- Configuration classification (A/B/C/D) per stage with justification
- Strategy recommendations derived from configuration

**Trace Analysis (source Section 6 analog):**
- Real token usage computations from prior Chester sessions
- Newly generated traces where data is missing or the skill has changed since the trace was captured
- Moderate rigor — accurate data without overinvestment

### 4. Data Policy

Three-way check per pipeline stage:
1. Does trace data exist for this stage?
2. Has the skill changed since the trace was captured?
3. If missing or stale: generate fresh trace data

### 5. Paper Structure

Adapted from source paper organization:

| Section | Content |
|---------|---------|
| Introduction | Applied research context, Chester's position, paper's goal |
| Background | Summary of source paper's analytical instruments (AER, D(U), five dimensions, configurations) |
| Chester Overview | Chester's architecture, pipeline stages, multi-agent design rationale (replaces source's "Analysis of Alternatives") |
| Qualitative Framework Applied | Per-stage dimension tables with Chester-specific assessments and configuration classifications |
| Trace Analysis | Per-stage token usage computations, baseline overhead, subagent costs |
| Cross-Correlations | Dependencies between stages, propagation effects, coupled variables |
| Counter-Analysis and Limitations | Honest assessment of framework limitations when applied to Chester |
| Conclusions | Findings, intervention priorities, what to measure next |

Dimension tables reproduced from source and filled with Chester-specific data per stage.

### 6. Chester Pipeline Repurposed for Analysis

| Chester Stage | Applied Purpose |
|---------------|-----------------|
| figure-out | Design the analysis framework (this document) |
| build-spec | Specify the analysis methodology — what each dimension means for Chester, assessment criteria, output format |
| build-plan | Plan analysis execution — each task is a Chester stage under test |
| write-code | Perform analysis and write paper sections — implementers reason about AER, reviewers verify analytical rigor |
| finish-plan | Assemble final paper, generate .docx |

## What This Is Not

- Not an implementation plan for optimizing Chester
- Not a cost-reduction exercise
- Not an evaluation of whether to use multi-agent architecture

## What This Produces

An applied research paper that gives Chester a formal effectiveness profile — so that future optimization work has a rigorous analytical foundation to build on, rather than ad-hoc reasoning.

## Pipeline Stages Under Analysis

| Stage | Primary Function |
|-------|-----------------|
| chester-figure-out | Socratic design interview |
| chester-build-spec | Specification formalization with automated review |
| chester-build-plan | Plan creation with adversarial hardening |
| chester-write-code | Subagent-driven implementation with per-task review |
| chester-finish-plan | Verification, doc-sync, merge options |
| chester-attack-plan | Parallel adversarial plan review (6 agents) |
| chester-smell-code | Parallel code smell prediction (4 agents) |
| chester-test-first | TDD discipline enforcement |
| chester-fix-bugs | Systematic debugging workflow |
| chester-prove-work | Verification before completion claims |
| chester-review-code | Code review feedback handling |
| chester-dispatch-agents | Parallel subagent coordination |
| chester-doc-sync | Documentation staleness detection |

## Source Paper Reference

"Optimizing AI Agent Effectiveness Under Token Cost Constraints: A Conceptual and Qualitative Framework for Agentic System Design" — Revised Edition, March 2026. Located at `/home/mike/Documents/ClaudeCode/Docs/agent_efficiency_paper_v2.docx`.
