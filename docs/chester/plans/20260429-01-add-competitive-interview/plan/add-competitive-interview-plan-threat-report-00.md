# Plan Threat Report — add-competitive-interview

**Plan reviewed:** `plan/add-competitive-interview-plan-00.md`
**Reviews run:** plan-attack (unconditional) + plan-smell (conditional, fired)
**Smell heuristic match:** case-insensitive `Task.` in natural English ("task-by-task", "this task") — no real DI/concurrency/persistence/contract triggers. Smell ran for completeness per inclusive bias.

## Combined Implementation Risk Level: **SIGNIFICANT**

Why this level:

1. **Two HIGH findings address real runtime correctness, not stylistic concerns.** Plan-attack HIGH-1 (unpatched `{ACTIVE_UNDERSTANDING_MCP}-mcp-flow.md` template sites at SKILL.md:71, 226, 269, 326) means the HARD-GATE at line 226 will direct the LLM to read `team-interview-mcp-flow.md` (with `-mcp-` infix) — a file that does not exist. The skill will break at the HARD-GATE before any designer-facing turn fires. Task 9 only patches lines 89 and 244.
2. **Resume Protocol reads a file that doesn't exist during the Understand Stage** (HIGH-2). The plan and spec assume an incrementally-written `{sprint-name}-process-00.md` exists during the debate, but `SKILL.md:367-368` enforces read-only discipline during the Understand Stage and `SKILL.md:784` shows process-evidence is written at Phase 5 Closure. Resume during a team-interview debate will fail silently.
3. **Three MEDIUM scope omissions cluster around incomplete error/normative handling.** Mid-chain failure handler, polite-collapse re-prompt handler, and orchestrator-side dispatch printing constraint each appear in the spec but have no plan task and no AC. Implementer following the plan literally will produce a flow file that's incomplete relative to the spec's Error Handling and Constraints sections.
4. **The HIGH-1 / Smell-Finding-2 finding is the same gap surfaced from two angles.** Plan-attack saw the unpatched template sites; plan-smell saw the contradicted HARD-GATE. They corroborate each other — high confidence this is real, not theoretical.
5. **The remaining MEDIUM/LOW findings are watch items, not blockers.** Variable-name mismatch (smell-1), pole-agent sync debt (smell-3), unanchored grep patterns (smell-4), fork-policy rationale duplication (smell-5), AC-6.2 awk fragility (smell-6) are all post-implementation polish.

## Findings — plan-attack

### HIGH-1 — Unpatched `{ACTIVE_UNDERSTANDING_MCP}-mcp-flow.md` template sites

**Evidence:**
- `SKILL.md:71` — introductory prose template
- `SKILL.md:226` — HARD-GATE (imperative; "You MUST read…")
- `SKILL.md:269` — Phase 4 Two-Stage Model
- `SKILL.md:326` — Understand Stage Per-Turn Flow

**Impact:** Task 9 patches lines 89 and 244 only. With `ACTIVE_UNDERSTANDING_MCP: team-interview` set, all four unpatched sites resolve the template to `references/team-interview-mcp-flow.md`. The HARD-GATE will direct the LLM to read a nonexistent file before any designer-facing turn fires. AC-3.2's grep would pass after Task 9 even though the HARD-GATE remains broken.

### HIGH-2 — Resume Protocol references in-progress process-evidence file that doesn't exist

**Evidence:**
- `SKILL.md:367-368` — read-only discipline during Understand Stage
- `SKILL.md:784` — process-evidence written at Phase 5 Closure
- Plan Task 9 Step 3(f) and spec line 33 — both assume `{sprint-name}-process-00.md` exists during debate

**Impact:** No task instructs the lead to write per-round transcripts incrementally. Resume during the Understand Stage of team-interview will hit a missing file. No test catches this — all tests are structural greps.

### MEDIUM-1 — Fabricated stance principle in Task 7

**Evidence:** Plan Task 7 Step 3 cites "Operate across abstraction levels" as a `util-design-partner-role` Stance Principle. Source (`util-design-partner-role/SKILL.md:130-137`) lists five principles; this isn't one of them.

**Impact:** AC-2.3 test uses OR logic — passes if any persona-trait pattern matches. But implementer following Task 7 literally will insert an invented principle. Reviewer would catch in code-review; tests won't.

### MEDIUM-2 — Mid-chain failure + polite-collapse error handlers have no task

**Evidence:** Spec lines 72-73 specify two procedural handlers. No AC, no task assigns them.

**Impact:** Implementer produces flow file incomplete relative to spec's Error Handling section. Behavioral correctness suffers if the handlers are needed at runtime.

### MEDIUM-3 — Orchestrator-side dispatch printing constraint has no AC, no task, no test

**Evidence:** Spec Constraints line 99 (normative — sprint 2026-03-31). No AC, no task references it.

**Impact:** Dropped normative constraint. Plan-build inherits it from the spec but cannot test it (runtime behavior, not static artifact). Static-test gap is real but addressable by adding flow-file documentation that's grep-verifiable. Plan-reviewer flagged this earlier as a spec gap; persists at hardening.

### LOW-1 — AC-3.2 round-zero check is a spurious non-failure

**Evidence:** Pre-existing "Round-Zero" strings at SKILL.md:90, 226, 244 mean the round-zero preservation grep passes before Task 9 implementation. The overall test still fails on other checks; the TDD narrative "verify it fails" is inaccurate for this single check.

**Impact:** Confusing for implementer reading test output, not a correctness break.

### LOW-2 — Task 9 references AC-6.2 in Must-remain-green; AC-6.2 created in Task 10

**Evidence:** Annotation cannot be honored at Task 9 execution time.

**Impact:** Cosmetic; Task 9's bash commands correctly omit AC-6.2 from the regression run.

## Findings — plan-smell

### MEDIUM-1 — Variable name mismatch creates parallel branch structure

**Evidence:** Spec line 111 + plan Task 9 conditionals.

**Impact:** Every future non-MCP flow added under `ACTIVE_UNDERSTANDING_MCP` requires updating the conditional branches. The clean uniformity of the original swap-line pattern is broken; deferred-complexity smell.

### MEDIUM-2 — HARD-GATE will be left contradicted (corroborates plan-attack HIGH-1)

**Evidence:** SKILL.md:216-231 (HARD-GATE) unchanged by Task 9. Block unconditionally requires `initialize_understanding`.

**Impact:** Direct contradiction with Phase Map step 4 conditional. HARD-GATE prose is the most authoritative-sounding language in SKILL.md and Claude Code is likely to honor it.

### MEDIUM-3 — Pole agents embed line-number citations to three external docs

**Evidence:** Plan Task 7 Step 3 cites `SKILL.md:369-377` and `util-design-partner-role:130-137`. No tests verify pole-agent text matches the cited source content.

**Impact:** Silent staleness when source files are edited. Synchronization debt across `team-interview-flow.md`, `SKILL.md`, `util-design-partner-role`, and four pole agents.

### LOW-1 — Unanchored grep patterns produce false-green risk

**Evidence:** AC-1.3 `\bN\b`, AC-1.4 `chain`, AC-1.5 `parallel`, AC-5.1 `C1`/`C2` — all match unrelated occurrences.

**Impact:** Tests may pass on prose unrelated to the AC's actual intent. Not a build break; weakens the test gate.

### LOW-2 — fork-policy "same rationale as 1d" copy-paste debt

**Evidence:** Plan Task 8 Step 3 — rows 1e, 1f, 1g say "same rationale as 1d". Existing table convention is distinct rationale per row.

**Impact:** When framing-side rationale evolves, three rows silently hold stale text.

### LOW-3 — AC-6.2 awk extract_section fragile against future heading changes

**Evidence:** Phase 5 section uses empty end-pattern, captures to EOF. Currently safe (Resume Protocol + Closure Protocol exist in both main and branch).

**Impact:** Latent fragility for future edits, not current failure.

## Verified-anchor skip-list (passed to plan-attack)

Plan-attack used the verified anchors from the spec-stage ground-truth report (v01 → v02 sequence). Trusted anchors were not re-verified: `SKILL.md:293, 369-377, 445`; `proof-mcp/proof.js:38-46, 49-53`; existing flow files; `agents/design-large-task-industry-explorer.md`; `util-design-partner-role/SKILL.md:46, 61, 71`; `docs/fork-policy.md` table format. Re-verified anchors (plan-modified): `SKILL.md:12-69` swap-line, `SKILL.md:399` Solve Stage Opening, `SKILL.md:732-739` Resume Protocol, `docs/fork-policy.md` table additions.

## Recommended Mitigations (if proceeding)

If you choose "proceed with directed mitigations," the minimum changes to address the HIGH findings:

- **Mitigation A (HIGH-1):** Add to Task 9 a Step 3 sub-item that updates SKILL.md lines 71, 226, 269, 326 — generalize the path template from `references/{ACTIVE_UNDERSTANDING_MCP}-mcp-flow.md` to a form that handles both `*-mcp-flow.md` (for MCP-backed flows) and `*-flow.md` (for team-interview). Easiest fix: pre-resolve the path in skill prose ("references/classic-mcp-flow.md, problemfocused-mcp-flow.md, architectural-mcp-flow.md, or team-interview-flow.md depending on swap-line value"). Update HARD-GATE block (lines 216-231) with a conditional: "If `team-interview`, your next action is loading the team-interview-flow.md and constructing the Round-Zero context packet — there is no `initialize_understanding` to call."
- **Mitigation B (HIGH-2):** Add to Task 5 (or a new task) a procedural step in `team-interview-flow.md` instructing the lead to write per-round transcripts to disk incrementally as each round closes. State the path explicitly. OR change Resume Protocol's read source — read from `capture_thought` history instead, which IS written incrementally during the Understand Stage. Either resolves the file-existence gap.
- **Mitigation C (MEDIUM-2):** Add a new task (or expand Task 5) that codifies the mid-chain failure retry policy and polite-collapse re-prompt as named procedural steps in the flow file. Add ACs / tests for them, or note in the task that they're prose-only with no test gate.
- **Mitigation D (MEDIUM-3):** Add prose to `team-interview-flow.md` Per-Round Phases section that explicitly invokes the orchestrator-side dispatch/completion printing pattern (per sprint 2026-03-31). Add a test that greps for "dispatch" / "completion" wording. Static-verifiable.
- **Mitigation E (cleanup):** Fix Task 7's fabricated "Operate across abstraction levels" citation by either replacing with one of the five real principles, or removing it. Tighten unanchored grep patterns in Task 3-5 tests.

If proceeding without mitigations, the Mid-chain failure / polite collapse handlers and orchestrator printing can land as follow-on work; but the two HIGH findings should be fixed before execute-write — they will block the team-interview flow from running at all.

## Decision

Awaiting user direction. Four options per skill:
1. **Proceed** — accept the risk, run execute-write on plan v00 as-is
2. **Proceed with directed mitigations** — apply named mitigations (A–E or subset) before execute-write
3. **Return to design with additional requirements** — escalate to design-specify or design-large-task to revisit
4. **Stop** — abandon or pause the sprint
