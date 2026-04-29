# Spec: Competitive Interview Flow for Step B

**Sprint:** 20260429-01-add-competitive-interview
**Parent brief:** `docs/chester/working/20260429-01-add-competitive-interview/design/add-competitive-interview-design-00.md`
**Architecture:** Hybrid — procedural skill body + sequential dialogue chain (Architect A optimization × Architect B optimization)
**Revision history:** v00 (initial draft); v01 (adversarial review fixes — variable name, archived flow correction, phase numbering, `understanding-confirmed` thought capture, proof seeding mapping, Understand-Stage prohibitions for poles, Solve Stage opening reconciliation, brief-render read shape); v02 (ground-truth review fixes — `architectural-mcp-flow.md` existence correction, RULE seeding designer-authority clarification, removal of unreachable EVIDENCE-source fallback, explicit Resume Protocol alternate read path)

## Goal

Add a `team-interview` understanding flow option to `design-large-task` that replaces the current Phase 4 Understand Stage (single-agent saturation scoring under Understanding MCP) with a four-pole Cartesian debate over five rounds, converging by agent consensus rather than MCP scoring. The flow lives in `skills/design-large-task/references/team-interview-flow.md` as a procedural document the lead walks step-by-step, dispatching named pole subagents in a sequential chain within each round phase so poles see each other's actual statements as they're produced. Phase 4's Solve Stage and Phase 5 (Closure) remain unchanged. The `classic` and `problemfocused` flows remain available; `team-interview` is opt-in via the existing `ACTIVE_UNDERSTANDING_MCP` swap-line. The flow produces a three-section handoff artifact (problem statement / consensus evidence / exit criteria) aligned with the format proposed by the approved-but-unimplemented Optimize Throughput sprint (20260417-03), so the two efforts converge rather than collide.

### Cross-Sprint Alignments

The brief did not enumerate these but the prior-art explorer surfaced four approved sprints whose constraints this spec must inherit. They are introduced at spec-time, not in the design brief, and are listed here so traceability is unambiguous:

- **20260417-03 Optimize Chester Throughput** *(approved, not yet implemented)* — drives the three-section handoff artifact format (problem statement / consensus evidence / exit criteria) referenced in AC-1.6.
- **20260425-01 Redesign Convergence Model** *(approved)* — drives the C1 (externalized coverage) / C2 (fact/assumption/opinion) voice-discipline markers referenced in AC-5.1.
- **2026-03-27 Socratic Interview Improvement** *(approved, shipped)* — drives the Software Architect persona inheritance for pole agents referenced in AC-2.3.
- **2026-03-31 Subagent Progress Surface** *(approved, shipped)* — drives the orchestrator-side dispatch/completion printing requirement in Constraints.

Each is a normative constraint, not a structural one — the implementation MUST conform but the brief did not contain the requirement.

## Components

**New files:**
- `skills/design-large-task/references/team-interview-flow.md` — primary procedural artifact. Owns: round mechanics (5 rounds × 5 phases), sequential chain dispatch instructions, per-round transcript schema, validity-test checklist, ratification block spec, three-section handoff spec, **`understanding-confirmed` thought capture step**, **handoff → proof-seeding mapping**, early-termination rules, resume protocol, brief-render read shape.
- `agents/design-large-task-step-b-innovator.md` — pole agent (N — advocates change, "my new system is best")
- `agents/design-large-task-step-b-conservator.md` — pole agent (S — advocates stasis, "status quo handles it")
- `agents/design-large-task-step-b-purist.md` — pole agent (E — Chester philosophy alone drives the answer)
- `agents/design-large-task-step-b-pragmatist.md` — pole agent (W — ship what works)

**Modified files:**
- `skills/design-large-task/SKILL.md` — swap-line block adds `team-interview` option (the variable is `ACTIVE_UNDERSTANDING_MCP`, retained as-is despite the new option being non-MCP — variable rename is out of scope per Non-Goals). Phase 3 Round One MCP-init step becomes conditional: when `team-interview` is the active flow, no Understanding MCP initialization runs but Round-Zero context-packet construction still does. Phase 4 Understand Stage gains a note that team-interview-flow.md drives the per-turn cycle when active. Resume Protocol gains a team-interview branch with an explicit alternate read path: when `ACTIVE_UNDERSTANDING_MCP=team-interview` and the `understanding-confirmed` thought is absent, the recovery path reads from the in-progress process-evidence transcript (which contains the per-round transcripts written so far) rather than calling `get_understanding_state` (no MCP state file exists for team-interview). Phase 4 Solve Stage opening text gains a note: when the active flow ratified the problem statement via team consensus, the polish/readback/confirm step is replaced by a single confirmation prompt ("the team ratified this statement — confirm or revise?"); polish has already happened in synthesis.
- `docs/fork-policy.md` — Per-Dispatch Policy table gains four rows for the pole subagents (named, never-fork, framing-side rationale).

**New test files (one per AC, project bash convention):**
- `tests/test-ac-{N-M}-{slug}.sh` — one stub per AC; each is a structural / grep-based check.

## Data Flow

1. **Entry from Phase 3 Round One.** Lead reads `ACTIVE_UNDERSTANDING_MCP` from SKILL.md swap-line. If `team-interview`, lead loads `references/team-interview-flow.md` instead of an `*-mcp-flow.md` reference. No Understanding MCP initialization. Round-Zero context packet still constructed from Phase 1–3 outputs (problem domain, prior-art findings, codebase exploration, framing + gap map).
2. **Round-Zero context packet construction.** Lead distills Phase 1–3 outputs into a focused context packet. Packet is the prompt prefix every pole subagent receives in addition to its phase-specific instructions.
3. **Per-round procedural loop (R1–R4).**
   - **Phase 1 — opening argument:** Lead dispatches the round's designated opener pole (R1=N, R2=S, R3=E, R4=W) with context packet + opener instruction. Opener returns a candidate problem statement (3–5 sentences) plus per-lens grounding.
   - **Phase 2 — opposing arguments (sequential chain):** Lead dispatches the three opposer poles in roster order. Each opposer's prompt contains the opener's actual statement plus all prior opposer statements from this round. Opposer-1 sees only opener; opposer-2 sees opener + opposer-1; opposer-3 sees opener + opposer-1 + opposer-2.
   - **Phase 3 — counter-arguments:** Lead dispatches opener with the full opposition chain. Opener produces one counter per opposer (concede / defend / revise) and a revised statement.
   - **Phase 4 — idea collapse:** Lead synthesizes the surviving statement from opener's revisions and the opposition chain. No subagent dispatch; lead writes directly into transcript.
   - **Phase 5 — recommendation:** Lead writes the round status (alive / wounded / dead) and a one-paragraph rationale. Transcript section closed.
   - **Designer turn:** Lead presents the round transcript block in the designer-facing turn. Designer responds with accept-and-continue (default), push-back (lead reopens specific point), or veto (skip to R5).
4. **Round 5 — synthesis.**
   - Lead enumerates surviving candidates (alive + wounded).
   - Lead drafts a consolidated problem statement merging surviving claims.
   - Lead dispatches all four poles in parallel for synthesis attacks against the consolidated draft. (R5 is the one round where parallel dispatch is correct: each pole attacks the same target with no prior-pole context to see.)
   - Lead applies revisions if any attack lands.
   - Lead requests ratification: each pole returns "ratified" or "blocked: <reason>".
   - If a pole blocks, one revision pass; if block survives revision, designer arbitrates with logged reason.
5. **Validity-test checklist (informational).** Lead runs four-category tests against the consolidated statement: structural / grounding / survival / handoff. Results recorded in transcript; failures don't gate but get flagged for designer awareness.
6. **Handoff artifact construction.** Lead writes the three-section handoff: problem statement (single sentence), consensus evidence (organized by type, attributed to source pole), exit criteria (or explicit "none derived"). Plus ratification block listing per-pole signoff.
7. **Stage transition marker.** Lead calls `capture_thought()` with tag `understanding-confirmed`, stage `Transition`. This is the marker `SKILL.md:293` uses to track which phase is active. Without this capture, Resume Protocol cannot distinguish Understand from Solve.
8. **Transition to Phase 4 Solve Stage.** Solve Stage opens by reading the handoff artifact in place of Understanding MCP saturation history. Solve Stage's "polish / readback / confirm" step is replaced by a single confirmation prompt: "The team ratified this statement — confirm or revise?" Polish has already happened during R5 synthesis.
9. **Proof seeding mapping (Solve Stage seed step).** When `submit_proof_update` runs the seed call (per `SKILL.md:403`), the consensus evidence and exit criteria map to proof elements as follows:
   - **Codebase grounding** bullets → `EVIDENCE` elements with `source: "codebase"`
   - **Industry prior art** bullets → `EVIDENCE` elements with `source: "industry"`
   - **Practitioner friction** bullets → `EVIDENCE` elements with `source: "friction"`
   - **Philosophy grounding** bullets → `RULE` elements with `source: "designer"` — **the ratification block (Round 5 per-pole signoff plus designer ratification) IS the designer-authority signal that authorizes seeding philosophy clauses as RULEs.** This satisfies `SKILL.md:445` ("You must NOT create RULE or PERMISSION elements from your own analysis. These are designer-sourced only") because the designer's Round 5 ratification of the consolidated statement (which includes the philosophy bullets) is itself the designer direction.
   - **Exit criteria** → `RULE` elements with `source: "designer"` — same authority logic; exit criteria are designer-ratified restrictions on the design space.
   - **Ratification dissent** (if any) → `RISK` elements basis-pointing to the disputed clause.
   The proof MCP's EVIDENCE element accepts any `source` string that is non-null and not `"designer"` (per `proof-mcp/proof.js:38-46` — there is no enum constraint), so `"industry"` and `"friction"` source values pass without fallback. RULE elements have `source` locked to `"designer"`; team-interview's seeding satisfies this via the ratification block's designer authority. This mapping is documented in team-interview-flow.md so Solve Stage seeding is mechanical rather than judgment-laden.

## Error Handling

- **Mid-chain failure** (pole subagent returns error mid-Phase-2 chain): Lead retries the failed pole once with the same chain context. If retry fails, lead notes the failure in the transcript, skips the failed pole's opposition, and continues to the next chain step. The recommendation phase records "chain partial" as a quality flag.
- **Polite collapse** (round ends with no real attacks landing): Lead detects (no opposer produced disagreement; counter-arguments are all "agreed"); re-prompts the weakest opposer with directive to defend its lens position from first principles, not respond to opener. One re-prompt per round.
- **Stalled deadlock** (Round 5 ratification fails after one revision pass): Designer arbitrates. Designer either rules in favor of the blocking pole (reopen with new round, possibly killing the consolidated draft) or forces ratification with logged dissent.
- **Stage failure** (all four R1–R4 statements end "dead"): Lead reports "no problem statement survived debate" in the designer-facing turn. Designer either reframes original sprint scope or accepts the finding.
- **Composition fragility** (Solve Stage discovers a runtime dependency on Understanding MCP saturation history not addressed by the handoff artifact): Out of scope to fix here. Spec mandates a verification read of Solve Stage's evidence consumption — if Solve has hard dependencies on MCP fields beyond what's mapped above, a shim is added in a follow-on sprint.

## Testing Strategy

Tests are bash scripts (project convention; see `tests/test-*.sh`). Each AC has a corresponding test stub keyed by skeleton ID `ac-{N-M}-{slug}`. Tests are structural: file existence, frontmatter shape, required-section presence in markdown files, swap-line content, fork-policy table content. No runtime exercise of the flow itself — that's validated only by running a real sprint with `ACTIVE_UNDERSTANDING_MCP: team-interview` set, which is a manual acceptance gate not a unit-testable property.

Coverage expectations:
- Every new file has at least one existence test.
- Every modified file has at least one structural-content test for the change.
- Every AC has a stub in `tests/`.
- Validation that the existing flows still work: a regression test confirming `references/classic-mcp-flow.md` and `references/problemfocused-mcp-flow.md` are unmodified and the swap-line still accepts both their values.

## Constraints

- **No new MCP server** _(structural — brief D3)_
- **Preserve single-voice rule for designer-facing turns** _(structural — `skills/util-design-partner-role/SKILL.md`)_
- **Pole subagents must be named agents** _(structural — `docs/fork-policy.md`)_
- **Pole subagents must NOT fork even when `CLAUDE_CODE_FORK_SUBAGENT=1`** _(structural — named subagents are non-forking by construction per fork policy)_
- **Pole agents must honor Understand-Stage prohibitions** _(structural — `SKILL.md:369-377` Prohibited in the Understand Stage list)_: pole outputs may NOT contain solution proposals, design alternatives, architecture suggestions, "How might we" framing, or comprehensive analyses. Their job is to produce *problem-statement candidates*, not solutions. Pole agent system prompts must include this constraint.
- **`capture_thought(understanding-confirmed)` must fire before Solve Stage transition** _(structural — `SKILL.md:293`)_: the boundary marker between Understand and Solve depends on this thought capture. team-interview-flow.md must specify it as a named step at the end of Round 5 ratification.
- **Three-section handoff format must align with Optimize Throughput proposal** _(normative — sprint 20260417-03 approved)_: problem statement / consensus evidence / exit criteria, with evidence organized by type and attributed to source pole.
- **C1 (externalized coverage) and C2 (fact/assumption/opinion) markers must apply to pole transcripts and ratifications** _(normative — sprint 20260425-01 approved)_
- **Pole subagent system prompts must inherit Software Architect persona traits** _(normative — sprint 2026-03-27 shipped)_
- **Per-pole dispatch must surface dispatch/completion lines on main screen via orchestrator-side printing** _(normative — sprint 2026-03-31 shipped)_
- **References file naming follows existing convention** _(structural — `{name}-mcp-flow.md` for MCP flows; `{name}-flow.md` for non-MCP flows; brief D6; team-interview-flow.md is the first non-MCP flow file)_
- **Sprint name file prefix uses three-word portion only** _(structural — `util-artifact-schema`)_
- **Phase 4 Solve Stage and Phase 5 Closure of `design-large-task/SKILL.md` body remain semantically unchanged** _(structural — brief D5)_; Phase 4 Solve Stage opening text gains the team-ratified-statement reconciliation note, but the polish/readback flow remains intact for non-team flows.

## Non-Goals

- **Framing Convergence MCP** — not building. D3 explicit: lightweight first.
- **Modifying Solve Stage internals or Design Proof MCP** — not touching `Phase 5` beyond the team-ratified-statement reconciliation note. Solve consumes the new handoff artifact.
- **Migrating existing sprints to `team-interview`** — `problemfocused` (current default) and `classic` remain unaffected; `team-interview` is opt-in by changing the swap-line value.
- **`plan-build` / `execute-write` team-mode** — out of scope.
- **Generating real test stubs that exercise the flow at runtime** — flow execution is human-driven; structural tests cover artifact shape only.
- **Renaming the existing swap-line variable** — variable stays `ACTIVE_UNDERSTANDING_MCP` despite team-interview being non-MCP. The variable name is a bag of bytes; semantic correctness lies elsewhere. A future sprint may rename to `ACTIVE_UNDERSTANDING_FLOW`; out of scope here.
- **Replacing `architectural` flow** — `architectural-mcp-flow.md` is a stub file present in `skills/design-large-task/references/` but the corresponding MCP server is archived (`SKILL.md:42-46`). Spec leaves the stub untouched and treats it as a third existing flow file (alongside `classic-mcp-flow.md` and `problemfocused-mcp-flow.md`) to verify unmodified.

## Acceptance Criteria

### AC-1.1 — Flow file exists at canonical path

**Observable boundary:**
- File path `skills/design-large-task/references/team-interview-flow.md` exists → `[ -f ]` test passes.
- File is non-empty → `[ -s ]` test passes.

**Given:** the sprint branch is checked out
**When:** the test inspects `skills/design-large-task/references/team-interview-flow.md`
**Then:** the file exists and contains content

**Test skeleton ID:** `ac-1-1-flow-file-exists`

**Implementing tasks:**
**Decisions:**

### AC-1.2 — Flow file declares all required structural sections

**Observable boundary:**
- File contains a markdown heading matching `Round Sequence` (or equivalent) listing R1–R5
- File contains a section header for `Per-Round Phases` (or equivalent) enumerating the 5 phases
- File contains a section header for `Transcript Schema`
- File contains a section header for `Handoff Artifact`
- File contains a section header for `Ratification`
- File contains a section header for `Validity Tests` (or `Validity-Test Checklist`)
- File contains a section header for `Termination Rules` (or `Early Termination`)
- File contains a section header for `Resume Protocol`
- File contains a section header for `Proof Seeding` (or `Solve Stage Seeding` — describes the handoff → EVIDENCE/RULE mapping)
- File contains a section header for `Brief-Render Read Shape` (describes how Phase 5 Closure reads from process evidence in absence of an MCP state file)

**Given:** the flow file exists
**When:** the test greps for each required section header
**Then:** every required section header is present

**Test skeleton ID:** `ac-1-2-flow-file-sections`

**Implementing tasks:**
**Decisions:**

### AC-1.3 — Round sequence assigns openers in order N, S, E, W, then synthesis

**Observable boundary:**
- The Round Sequence section enumerates R1 with N (Innovator) as opener, R2 with S (Conservator), R3 with E (Purist), R4 with W (Pragmatist), R5 as the synthesis round (no single opener).

**Given:** the flow file exists
**When:** the test inspects the Round Sequence section
**Then:** the four R1–R4 openers map to N/S/E/W in order, and R5 is identified as a synthesis round

**Test skeleton ID:** `ac-1-3-round-opener-rotation`

**Implementing tasks:**
**Decisions:**

### AC-1.4 — Sequential chain dispatch is documented for Phase 2

**Observable boundary:**
- The Per-Round Phases section's Phase 2 (opposing arguments) includes language indicating that opposer-2 receives opposer-1's statement and opposer-3 receives both opposer-1 and opposer-2's statements
- The instruction explicitly states each opposer dispatch carries prior-chain content in its prompt

**Given:** the flow file exists
**When:** the test inspects the Phase 2 description
**Then:** sequential chain semantics are explicitly described

**Test skeleton ID:** `ac-1-4-sequential-chain`

**Implementing tasks:**
**Decisions:**

### AC-1.5 — Round 5 specifies parallel synthesis attacks

**Observable boundary:**
- The Round 5 section explicitly states all four poles attack the consolidated statement
- The Round 5 section explicitly states the four attacks happen in parallel (not sequential), with no prior-pole context shared between them

**Given:** the flow file exists
**When:** the test inspects the Round 5 section
**Then:** parallel attack semantics are explicit

**Test skeleton ID:** `ac-1-5-r5-parallel-synthesis`

**Implementing tasks:**
**Decisions:**

### AC-1.6 — Three-section handoff artifact spec is present and aligned with Optimize Throughput format

**Observable boundary:**
- The Handoff Artifact section names exactly three sections: Problem Statement, Consensus Evidence, Exit Criteria
- The Consensus Evidence subsection identifies four evidence types: codebase / practitioner-friction (or equivalent) / philosophy / industry
- Per-bullet attribution to a source pole (N/S/E/W) is required
- Single-sentence rule for problem statement is present
- A Ratification subsection or block is specified following the three sections

**Given:** the flow file exists
**When:** the test inspects the Handoff Artifact section
**Then:** all three sections are named, evidence types match, attribution rule is present, single-sentence rule is present, ratification follows

**Test skeleton ID:** `ac-1-6-handoff-three-sections`

**Implementing tasks:**
**Decisions:**

### AC-1.7 — Per-round transcript schema is specified

**Observable boundary:**
- The Transcript Schema section enumerates the per-round fields: opening argument, opposing arguments (chain), counter-arguments, idea collapse, recommendation
- Each field has a specified format or layout

**Given:** the flow file exists
**When:** the test inspects the Transcript Schema section
**Then:** all five per-round fields are specified

**Test skeleton ID:** `ac-1-7-transcript-schema`

**Implementing tasks:**
**Decisions:**

### AC-1.8 — Validity-test checklist is specified

**Observable boundary:**
- The Validity-Test Checklist section enumerates four categories: structural, grounding, survival, handoff
- Each category lists at least one specific test

**Given:** the flow file exists
**When:** the test inspects the Validity-Test Checklist section
**Then:** four categories are present with at least one test each

**Test skeleton ID:** `ac-1-8-validity-tests`

**Implementing tasks:**
**Decisions:**

### AC-1.9 — Termination and stage-failure rules are specified

**Observable boundary:**
- A Termination Rules (or equivalent) section specifies the "3+ statements dead → skip to synthesis" early-termination rule
- The same section specifies the "all four dead → stage failure, escalate to designer" rule

**Given:** the flow file exists
**When:** the test inspects the Termination Rules section
**Then:** both rules are documented

**Test skeleton ID:** `ac-1-9-termination-rules`

**Implementing tasks:**
**Decisions:**

### AC-1.10 — `understanding-confirmed` thought capture step is specified

**Observable boundary:**
- The flow file contains language specifying that `capture_thought()` is called with tag `understanding-confirmed`, stage `Transition`, at the end of Round 5 ratification (after the consolidated statement is ratified by all four poles or designer-arbitrated)

**Given:** the flow file exists
**When:** the test greps for `understanding-confirmed` in the file
**Then:** the capture step is present and tied to end of Round 5

**Test skeleton ID:** `ac-1-10-understanding-confirmed-capture`

**Implementing tasks:**
**Decisions:**

### AC-1.11 — Handoff → proof-seeding mapping is documented

**Observable boundary:**
- The flow file contains a Proof Seeding (or Solve Stage Seeding) section that documents the mapping:
  - Codebase grounding → EVIDENCE (source: "codebase")
  - Industry prior art → EVIDENCE (source: "industry")
  - Practitioner friction → EVIDENCE (source: "friction")
  - Philosophy grounding → RULE (source: "designer" — authorized by the ratification block)
  - Exit criteria → RULE (source: "designer" — authorized by the ratification block)
  - Ratification dissent → RISK
- The section explicitly notes that RULE seeding is sanctioned because the Round 5 ratification block constitutes the designer-direction signal required by `SKILL.md:445`

**Given:** the flow file exists
**When:** the test greps for the section header and key mapping terms (`EVIDENCE`, `RULE`, `RISK`)
**Then:** all six mappings are documented

**Test skeleton ID:** `ac-1-11-proof-seeding-mapping`

**Implementing tasks:**
**Decisions:**

### AC-1.12 — Brief-render read shape is specified

**Observable boundary:**
- The flow file contains a Brief-Render Read Shape section
- The section specifies that, in absence of an Understanding MCP state file, the Phase 5 Closure brief reads from the process-evidence transcript instead

**Given:** the flow file exists
**When:** the test greps for the section header and key terms
**Then:** the read-shape spec is present

**Test skeleton ID:** `ac-1-12-brief-render-read-shape`

**Implementing tasks:**
**Decisions:**

### AC-2.1 — Four pole agent files exist at canonical paths

**Observable boundary:**
- File `agents/design-large-task-step-b-innovator.md` exists
- File `agents/design-large-task-step-b-conservator.md` exists
- File `agents/design-large-task-step-b-purist.md` exists
- File `agents/design-large-task-step-b-pragmatist.md` exists

**Given:** the sprint branch is checked out
**When:** the test inspects the four agent file paths
**Then:** all four files exist

**Test skeleton ID:** `ac-2-1-pole-agents-exist`

**Implementing tasks:**
**Decisions:**

### AC-2.2 — Each pole agent has frontmatter with required fields

**Observable boundary:**
- Each of the four pole agent files begins with YAML frontmatter
- Frontmatter contains keys: `name`, `description`, `tools`, `model`
- `name` matches the file's role token (e.g., `design-large-task-step-b-innovator`)

**Given:** the four pole agent files exist
**When:** the test extracts and inspects each file's frontmatter
**Then:** each file has the required keys with valid values

**Test skeleton ID:** `ac-2-2-pole-frontmatter`

**Implementing tasks:**
**Decisions:**

### AC-2.3 — Each pole agent body declares its lens position and Software Architect persona

**Observable boundary:**
- Each pole agent body contains text identifying its Cartesian position (Innovator: N / change advocate; Conservator: S / stasis advocate; Purist: E / Chester philosophy; Pragmatist: W / ship what works)
- Each pole agent body contains text inheriting the Software Architect persona (e.g., "reads code as design history", "thinks in trade-offs", "operates across abstraction levels", or equivalent persona traits)

**Given:** the four pole agent files exist
**When:** the test inspects each file's body
**Then:** lens identity and Software Architect persona are both present in each

**Test skeleton ID:** `ac-2-3-pole-lens-persona`

**Implementing tasks:**
**Decisions:**

### AC-2.4 — Each pole agent body enforces Understand-Stage prohibitions

**Observable boundary:**
- Each pole agent body contains language explicitly prohibiting solution proposals, design alternatives, architecture suggestions, and "how might we" framing
- The prohibition references the pole's job as producing problem-statement candidates only

**Given:** the four pole agent files exist
**When:** the test greps each file for prohibition keywords (e.g., "no solutions", "problem-statement only", "Understand Stage discipline")
**Then:** prohibitions are present in each pole agent

**Test skeleton ID:** `ac-2-4-pole-understand-stage-prohibition`

**Implementing tasks:**
**Decisions:**

### AC-3.1 — `design-large-task/SKILL.md` swap-line declares `team-interview` as a valid option

**Observable boundary:**
- The swap-line block (`ACTIVE_UNDERSTANDING_MCP`, present in SKILL.md head comment) lists `team-interview` as one of the available options
- The variable name is unchanged (still `ACTIVE_UNDERSTANDING_MCP`)
- Existing options (`classic`, `problemfocused`) remain documented; `architectural` remains marked ARCHIVED

**Given:** SKILL.md is modified
**When:** the test inspects the swap-line block
**Then:** `team-interview` appears as a valid option and existing options are preserved

**Test skeleton ID:** `ac-3-1-skill-swap-line`

**Implementing tasks:**
**Decisions:**

### AC-3.2 — `SKILL.md` Phase 3 / Phase 4 is conditional on flow type

**Observable boundary:**
- SKILL.md Phase 3 (Round One) and/or Phase 4 (Interview Loop / Understand Stage) text references `references/team-interview-flow.md` (either by exact filename or via the existing path-templating pattern)
- The MCP-init step in Phase 3 is conditional: when `team-interview` is the active flow, no Understanding MCP `initialize_understanding` call runs
- Round-Zero context-packet construction still runs for `team-interview`

**Given:** SKILL.md is modified
**When:** the test inspects Phase 3 and Phase 4 sections
**Then:** the flow file is referenced and MCP init is conditional on flow type

**Test skeleton ID:** `ac-3-2-skill-phase-conditional`

**Implementing tasks:**
**Decisions:**

### AC-3.3 — `SKILL.md` Solve Stage opening reconciles team-ratified statement

**Observable boundary:**
- SKILL.md Phase 4 Solve Stage opening section gains a note that, when the active flow ratified the problem statement via team consensus (i.e., `team-interview`), the polish/readback/confirm step is replaced by a single confirmation prompt
- The note does not modify the polish flow for non-team flows

**Given:** SKILL.md is modified
**When:** the test inspects the Solve Stage opening section
**Then:** the team-ratified reconciliation note is present and conditional

**Test skeleton ID:** `ac-3-3-solve-stage-opening-conditional`

**Implementing tasks:**
**Decisions:**

### AC-4.1 — `docs/fork-policy.md` documents pole subagent dispatch sites

**Observable boundary:**
- The Per-Dispatch Policy table in `docs/fork-policy.md` contains four new rows naming each pole agent dispatch site
- Each row marks the policy as "named subagent, never fork"
- Each row's rationale references framing-side dispatch and the need to isolate poles from each other and from lead framing

**Given:** `docs/fork-policy.md` is modified
**When:** the test inspects the Per-Dispatch Policy table
**Then:** four pole dispatch site rows exist with correct policy and rationale

**Test skeleton ID:** `ac-4-1-fork-policy-pole-rows`

**Implementing tasks:**
**Decisions:**

### AC-5.1 — Flow file applies C1 / C2 voice discipline markers to transcripts and ratifications

**Observable boundary:**
- The Transcript Schema or a Voice Discipline section in `team-interview-flow.md` references the C1 (externalized coverage) and C2 (fact/assumption/opinion) markers from `util-design-partner-role`
- The Ratification subsection requires per-pole signoff lines that mark dissent reasons with C2 (fact/assumption/opinion) discipline

**Given:** the flow file exists
**When:** the test inspects voice-discipline references
**Then:** C1 and C2 markers are referenced in transcript/ratification specs

**Test skeleton ID:** `ac-5-1-voice-discipline-markers`

**Implementing tasks:**
**Decisions:**

### AC-6.1 — Existing flow files are unmodified

**Observable boundary:**
- `skills/design-large-task/references/classic-mcp-flow.md` content is byte-identical to the version on `main` at the time the sprint branched
- `skills/design-large-task/references/problemfocused-mcp-flow.md` content is byte-identical to the version on `main`
- `skills/design-large-task/references/architectural-mcp-flow.md` content is byte-identical to the version on `main` (stub file; corresponding MCP server is archived but the stub itself exists and must remain untouched)

**Given:** the sprint branch is compared to `main`
**When:** the test diffs all three existing flow files
**Then:** no changes appear in any of them

**Test skeleton ID:** `ac-6-1-existing-flows-unchanged`

**Implementing tasks:**
**Decisions:**

### AC-6.2 — `design-large-task/SKILL.md` body sections for Phases 1, 2, and 5 are semantically unchanged

**Observable boundary:**
- The Phase 1 (Bootstrap), Phase 2 (Parallel Context Exploration), and Phase 5 (Closure) bodies in SKILL.md show no semantic diff against `main` other than the Phase 4 conditional changes called out by AC-3.2 and AC-3.3
- Specifically: no semantic changes to the Bootstrap workflow, no semantic changes to the parallel exploration mechanics, no semantic changes to Closure / brief-writing / artifact production

**Given:** the sprint branch is compared to `main`
**When:** the test diffs SKILL.md and inspects Phase 1, Phase 2, Phase 5 sections
**Then:** no semantic changes appear in those sections

**Test skeleton ID:** `ac-6-2-untouched-phases`

**Implementing tasks:**
**Decisions:**
