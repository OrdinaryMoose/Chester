# Researcher Findings — Committee Post-Mortem Ground Truth
# File: researcher-findings.md — Round 01
# Sprint: 20260612-01-update-committee-research

Verification target: S5 committee artifacts at `/home/mike/RiderProjects/StoryDesigner/docs/chester/working/20260601-01-implement-storyauthoring-project/sprint-s5-language-dsl-absorb/committee/` and Chester skill files at `/home/mike/Documents/CodeProjects/Chester/skills/design-committee/` + `agents/`.

---

## Verify-1 — R01 consumer census names LanguageValidationBridge.cs and SpanIndexSpanProvider.cs

**Result: CONFIRMED.**

File: `.../round01/researcher-findings.md`, VT-2 (Caller Counts), lines 56–62.

Verbatim:

> **Story.Application.Logic/ — 4 files (master-plan claims 10):**
>
> - `Story.Application.Logic/Composition/DslAnalysisRegistration.cs` (6 Language using-directives across Common, Lexing, Model, Parsing, Pipeline sub-namespaces)
> - `Story.Application.Logic/DSL/Analysis/LanguageValidationBridge.cs` (2: Common + Contracts)
> - `Story.Application.Logic/DSL/Analysis/SpanIndexSpanProvider.cs` (1: Contracts)
> - `Story.Application.Logic/DSL/Import/ServiceRefResolver.cs` (1: Common)

Both named files appear at VT-2 with explicit `Contracts` usings. The fact that `Logic` consumes `Language.Contracts` was established and on disk after Round 01. The census was coarse-aggregated inside VT-2's "count discrepancy" framing — the Contracts consumers were sub-rows inside an aggregate tasked to resolve a different question (10 files vs 10 directives). They were present but not flagged as significant.

---

## Verify-2 — R02 Purist fabricated grep cite and outbound/inbound conflation

**Result: CONFIRMED — both claims verified with exact line quotes.**

File: `.../round02/purist-transcript.md`

**Line 14 — outbound check reported as inbound property:**

> "Language Contracts namespace confirmed: `Story.Application.Language.Contracts` (8 files) — all pipeline-internal, no Domain.Validation or Domain.Service usings"

Verbatim from purist-transcript.md line 14. The check verifies what Contracts *imports outbound* (no Domain.Validation or Domain.Service usings). It is then used to support the claim that Contracts is "pipeline-internal" — an **inbound** property (who imports Contracts). Different question; silent conflation.

**Line 67 — "confirmed by grep" attribution:**

> "these are implementation contracts internal to the pipeline and have no callers outside Language itself (confirmed by grep)"

Verbatim from purist-transcript.md line 67 (KD-3 rationale). The "confirmed by grep" clause is the fabricated evidence cite. The Purist's own residual concern at line 105 contradicts this certainty:

> "the brief's Acceptance Criteria section (not my section) should include a check that no type from `DSL.Language.Contracts.*` is consumed outside `DSL.Language.*` — that is the concrete test that the 'internal' claim holds"

Both fabricated claim and self-undermining residual are present in the same transcript.

---

## Verify-3 — R02 researcher findings: consumer census absent, only piece-counts and ANTLR items

**Result: CONFIRMED — R02 researcher-findings.md covers piece-counts and ANTLR; no inbound-consumer census of Language.Contracts.**

File: `.../round02/researcher-findings.md`

Contents: five sections — C-1 (piece count, 78 files / 85 types), C-2 (ANTLR exact items), C-3 (SpanInspector.csproj Language reference), C-4 (test projects), C-5 (Logic callers: 10 directive lines / 4 files + DDR-01 and FRS Rule 9 confirmations).

C-5 enumerates all 10 Logic using-directive lines with file:line precision. It names `LanguageValidationBridge.cs:10` as `using Story.Application.Language.Contracts` and `SpanIndexSpanProvider.cs:5` as `using Story.Application.Language.Contracts`. The directive lines are there but the framing is "10 directive lines vs 10 files count discrepancy" — not a dedicated consumer census of `Language.Contracts` specifically.

No section asks "who consumes Language.Contracts from outside Language itself." The researcher was re-tasked to C-1/C-2/C-3/C-4/C-5 and never got the inbound-consumer query for Contracts specifically. No grep in R02 backs the KD-3 "confirmed by grep" claim. The refuting fact (LanguageValidationBridge.cs + SpanIndexSpanProvider.cs consuming Contracts) was in R02-C-5 as raw data but not surfaced under the question KD-3 depended on.

---

## Verify-4 — R04 ledger records "internal-only premise FALSE … Reframed"

**Result: CONFIRMED.**

File: `.../committee/ledger.md`, Round 04, lines 43–44. Verbatim:

> "Load-bearing HIGH (A): 'DSL.Language.Contracts internal-only' premise FALSE — 2 Logic production files (LanguageValidationBridge.cs:10, SpanIndexSpanProvider.cs:5+7) consume the public stage contracts; original AC-1.11 would fail a correct impl. Reframed."

Exact text present. The ledger records the catch; it names both files with line numbers; it names AC-1.11; it uses the word "Reframed." Finding confirmed verbatim.

---

## Verify-5 — Current Chester skill state (the fix target)

### 5A — member-protocol.md: warrant field definition + warrant.type values

File: `/home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/member-protocol.md`

`## Final Position` section, lines 88–105. Warrant field definition, verbatim (lines 100–105):

> `` `warrant` `` — the ground under the member's load-bearing claim, in two parts: a `type` (one of `evidence | logic | in-scope designer-premise`) and a `source` (the citation for `evidence`, the inference step for `logic`, or the designer statement that granted the premise for `in-scope designer-premise`). It is the member's own ground for the claim, **not** a restatement of `rationale`. Member-authored, within the 200-word cap.

Three `warrant.type` values: `evidence`, `logic`, `in-scope designer-premise`. No rule in this section tying a claim class to a required warrant type. The schema defines the fields; it says nothing about which warrant type is admissible for which claim class.

### 5B — team-lead.md: Warrant test (~line 314) and Authority Guard (~line 335)

File: `/home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/team-lead.md`

**Warrant test at line 314 (Internal Discipline / Consolidation Rules / Authority Guard):**

> **Warrant test.** Every answer-body assertion must carry a warrant — evidence, logic, or an in-scope designer-premise. The warrant is **supplied by the member** in its `## Final Position`; the team-lead **verifies** it — the type fits the claim and the source is traceable — rather than originating it. An assertion whose member-supplied warrant cannot be verified, or whose member supplied none, is demoted to a gap. The team-lead does not originate a warrant on the member's behalf; it reads member warrants from the on-disk `## Final Position` on demand.

**Authority Guard at line 335 (Self-Evaluation):**

> **Authority Guard — warrant coverage.** Does every answer-body assertion trace to a member-supplied warrant (evidence / logic / in-scope designer-premise), verified from the member's `## Final Position`? Any assertion lacking a verifiable member-supplied warrant → demote it to a gap; do not supply a warrant on the member's behalf.

**Finding:** The phrase "the type fits the claim" appears at line 314. No existing rule defines *what "fits" means* for the empirical/existence/containment class. The warrant test says verify that the type fits — but the fitness criterion for existence/containment claims is unspecified. A `logic` warrant on a containment claim passes the current test (the type is syntactically valid; traceability depends on the inference step text). The admissibility constraint that would demote the empirical class to evidence-only does not exist in either the Warrant test or the Authority Guard.

### 5C — design-committee-researcher.md: Responsibility Scope — consumer census mandatory or pull-only?

File: `/home/mike/Documents/CodeProjects/Chester/agents/design-committee-researcher.md`

**Responsibility Scope section, lines 14–22.** Verbatim for the relevant operations:

> **Codebase research.** Locate symbols, trace call paths, map module boundaries, surface conventions, identify prior implementations. Use `Read`, `Glob`, `Grep` aggressively; report findings with file:line citations.

No relocation-class standing deliverable. The researcher's charter is **pull-only**: "handle information-gathering … that four advocacy members explicitly do not" and "answer the questions it is handed." No rule makes a consumer census mandatory for any question class. The researcher provides what it is asked; if the question is "how many pieces" rather than "who consumes this sub-namespace," only the count is delivered.

Absence of a standing mandatory R01 deliverable conditioned on relocation-class questions is confirmed: the researcher.md § Responsibility Scope contains no such rule.

### 5D — design-committee-consolidator.md: enumerate-only prohibitions

File: `/home/mike/Documents/CodeProjects/Chester/agents/design-committee-consolidator.md`

**Hard prohibitions section, lines 29–38.** Key prohibitions verbatim:

> - **Does NOT characterize WHY alignment exists.** Report that three members agree; never explain the reason they agree. No "they converge because…", no root-cause of agreement.
> - **Does NOT weight positions by risk.** Every position gets equal flat treatment.
> - **Does NOT synthesize a direction.** No combined picture, no "taken together the round points toward…", no merged recommendation.
> - **Does NOT recommend.** No suggested option, no "the team-lead should…", no leaning.
> - **Is NOT a fifth advocate.** You hold no design opinion of your own.
> - **Does NOT read transcript bodies — only `## Final Position`.**

**Finding:** The Consolidator is enumerate-only by hard prohibition. It cannot detect modal-verb category changes (normative→descriptive slip), cannot weight a claim that "feels like an assertion" vs "looks like a decision," and cannot diff new invariants against prior-round evidence. These prohibitions are load-bearing by design — P4/P5 proposals belong at the team-lead Synthesize step specifically because the Consolidator must stay enumerate-only.

---

## Verify-6 — Absence findings: prior warrant-type admissibility or claim-class routing rules

**Search scope:** `skills/design-committee/` (all files recursively), `docs/` (all .md files), `tests/` (all .sh files). Grep terms: `warrant`, `claim.class`, `empirical`, `admissib`, `containment`, `existence claim`.

**Present:**

- `tests/test-member-warrant.sh` — tests warrant schema (field names, type enum, routing signal boundary, all four advocacy agents carry warrant pointer, team-lead uses "verify" framing). Does NOT test admissibility constraints by claim class. Line 17 confirms the type enum `in-scope designer-premise` is present; nothing tests that `logic` is inadmissible for empirical claims.
- `docs/chester/working/committee-failure-analysis-s5-language-absorb.md` — full root-cause analysis + P1–P5 proposals. Exists as a standalone working doc at `working/`. Not integrated into any skill file yet. This is the post-mortem brief the committee is being convened to act on.
- `member-protocol.md` lines 100–105 + `team-lead.md` line 314 — warrant schema and "type fits the claim" language as documented in Verify-5A/5B above.

**Absent:**

- No skill file, agent file, test, or doc in the Chester repo defines an admissibility rule for warrant types by claim class.
- No prior committee ruling or ledger entry establishes empirical-claim → evidence-only routing.
- No test verifies that a `logic` warrant on a containment claim is inadmissible.
- No prior brief or spec introduces claim-class vocabulary or routing rules.

The P1 rule proposed in `committee-failure-analysis-s5-language-absorb.md` does not yet exist anywhere in Chester's normative files.

---

## Final Position

position: no design opinion
rationale: All six verification targets resolved against artifact text. Facts established: (1) R01 VT-2 named both Logic Contracts consumers on disk before R02; (2) R02 Purist line 14 conflated outbound usings with inbound property, and line 67 carried a fabricated "confirmed by grep" attribution; (3) R02 researcher-findings contained no inbound-consumer census of Language.Contracts specifically; (4) R04 ledger records the "internal-only premise FALSE … Reframed" finding verbatim; (5) current Chester skill state — warrant schema defines three types with no admissibility rule by claim class, team-lead warrant test uses "type fits the claim" but leaves "fit" undefined for the empirical class, researcher is pull-only with no standing relocation-class deliverable, consolidator enumerate-only prohibitions confirmed; (6) no prior warrant-type admissibility rule or claim-class routing rule exists anywhere in Chester's normative files — the P1 rule proposed in the failure analysis is entirely absent from member-protocol.md, team-lead.md, and tests.
blocking_risk: none — research role holds no advocacy
warrant:
  type: evidence
  source: direct file reads with verbatim quotes — /home/mike/RiderProjects/StoryDesigner/docs/chester/working/20260601-01-implement-storyauthoring-project/sprint-s5-language-dsl-absorb/committee/round01/researcher-findings.md (VT-2), round02/purist-transcript.md (lines 14, 67, 105), round02/researcher-findings.md (C-1 through C-5), committee/ledger.md (Round 04 lines 43–44); /home/mike/Documents/CodeProjects/Chester/skills/design-committee/references/member-protocol.md (lines 88–105), skills/design-committee/references/team-lead.md (lines 314, 335), agents/design-committee-researcher.md (lines 14–22), agents/design-committee-consolidator.md (lines 29–38), tests/test-member-warrant.sh, docs/chester/working/committee-failure-analysis-s5-language-absorb.md
