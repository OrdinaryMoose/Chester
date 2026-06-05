# Committee Analysis — Team-Lead Context Economy brief (design review)
# File: committee-analysis-01.md dtd 2026-06-04
# Sprint: 20260604-01-update-committee-context-management

## Round Overview

One round, single-round-format. Standalone consultation (not a workflow step). The
committee reviews the *design* of feature brief `design-committee-team-lead-context-economy-00.md`
— is the four-discipline proposal sound, and where are the gaps/risks. Researcher served the
grounding role: verify the brief's factual claims about current skill state before advocacy
finals. Run AS proof-of-principle: team-lead persists this record first, then dispatches an
off-thread Consolidator rather than consolidating inline. HEAD ac0e3ce.

**Question:** Review and comment on the design of the team-lead context-economy brief — is the
four-discipline proposal (move-not-copy, Consolidator subagent, digest-to-lead/verbatim-to-disk,
inter-round ledger+rehydration) sound, and where does it have gaps or risk?

**Poles (reporting lens, not a fixed pairing):**
- Sound-direction / proceed — all four advocacy members; design frame is correct.
- Mechanism-incomplete — all four; the lever (discipline 3) has an unmet tooling precondition and discipline 4 rests on a runtime primitive that does not exist.

## Initial Deliberation

### Researcher — grounding findings (verbatim, abridged; DECISIVE on checks 1, 3, 5)

Check 1 (DECISIVE) — No member agent has Write access. Conservator, Innovator, Pragmatist,
Purist declare Read/Glob/Grep only; Researcher adds Bash/WebSearch/WebFetch. Discipline 3's
verbatim-to-disk path is unsatisfiable as agent files stand.

Check 2 — The three cited prior measures (inter-agent caveman ultra, persist-record-every-round,
mandatory TeamDelete) exist in SKILL.md and references/team-lead.md at roughly cited lines. Confirmed.

Check 3 (DECISIVE) — Sister briefs are dangling. `design-committee-temporary-roles-and-discipline-00.md`
(cited 5×, authority for forbidden-attach-surfaces and Step-4 revision sub-rounds) does not exist in
Pending/Complete/Deferred/not-implemented. The committee-variant-separation brief is also absent.

Check 4 — `committee-analysis-round-format.md` exists. Its Team Lead Convergence/Alignment/Observations
sections are team-lead INLINE consolidation placeholders; there is no Consolidator-subagent output shape.

Check 5 (DECISIVE) — No mid-deliberation compaction primitive for the main thread. Compaction hooks
(pre/post-compact) are scoped to proof-system MCP state only; they do not snapshot committee state.
util-handoff is a manual write-a-file reset to a NEW session, not in-process rehydration.

Synthesis (facts): Disciplines 1 and 4 are framing/plumbing. Discipline 3 is blocked by a missing
tool grant. Discipline 4's rehydration has no existing primitive to build on. Two governing-constraint
source documents cannot be read. The round-format template lacks a Consolidator section.

### Conservator — position (verbatim, abridged): "Advance with conditions; resolve gaps 1, 5, 6 before sprint."

Design direction sound; decomposition of team-lead into Controller (needs long-lived context) vs
Conduit/Synthesizer (do not) is correct. Brief earns credit for surfacing its own weaknesses.
GAP 1 (highest) — rehydration confirmed false: no mid-deliberation compaction exists; "likely means
explicit context-compaction" is not a path that exists. Discipline 4 must be built from scratch as a
disk-read ledger OR declared advisory-only. GAP 5 (new) — member Write access missing; discipline 3
unshippable without adding Write to five agent files. GAP 6 (new) — sister-brief references dangling;
two governing constraints rest on unreadable docs. GAP 2 — single-round cutover needs a mechanical
trigger, not team-lead judgment. GAP 3 — discipline 3 belongs in a shared member-protocol reference,
not per-agent Output Format (five-file drift risk). GAP 4 — Consolidator boundary: researcher contract's
"synthesizing the sources" wording permits interpretive characterization; Consolidator needs its own
agent file with a positive enumeration ceiling, not borrowed researcher prohibitions. GAP 7 — round-format
template needs a Consolidator section. Do not advance until 1, 5, 6 resolved.

### Innovator — position (verbatim, abridged): "Architecture correct; revise to -01 before sprint."

Discipline 3 is the right primitive and the brief knows it — that honesty should carry into AC ordering.
Consolidator-as-researcher-analog is elegant (extends an existing role, not exotic). Three precision adds:
(1) state cutover explicitly — recommend round-count-automatic, self-activating at round 2, no wrapping-skill
declaration; (2) move "disciplines 2+3 ship together" from Open Concerns to AC — discipline 2 without 3 is a
no-op for economy because verbatim already billed in team-lead transcript; (3) promote Option A from "lean" to
normative — Consolidator error blast radius is asymmetric, neutral-pattern-only limits it. Researcher findings
escalate: FINDING 1 (BLOCKER) — no member Write access; AC must add Write grant. FINDING 2 — both governing-
constraint sources dangling; state constraint self-sufficiently or reconstruct source. FINDING 3 — discipline 4
is net-new infrastructure, no primitive to build on; brief understates build cost. BONUS — round-format needs
a Consolidator section. Revise to -01 before any sprint work.

### Pragmatist — position (verbatim, abridged): "Proceed to design-specify with four corrections."

Diagnosis correct; quadratic accumulation real. Consolidator feasible (researcher is the working model; fork
policy guarantees independence). Option A right — keep judgment with team-lead. CRITICAL DEPENDENCY — discipline
1 alone is not a mechanism (append-only transcript); discipline 3 is the first-mover; disciplines 2 and 3 must
ship together as an ordering constraint. RISK 2 SHARPENED — only compaction-adjacent mechanism is util-handoff
(between-sessions only). So discipline 4 AC "flat across rounds" cannot be met within one continuous session;
context grows monotonically, ledger reduces the RATE not the bound. Rewrite AC to "context growth per round
materially reduced versus baseline" — "flat" overclaims. RISK 1 — state round-count cutover explicitly
("Consolidator required at round 2+; inline for single-round only"). RISK 3 — spec the chain: member writes
verbatim to disk -> sends digest to team-lead -> Consolidator reads from disk, not from relayed digest. RISK 4 —
resolve shared-reference vs per-agent before touching agent files. Net: four corrections recorded in AC.

### Purist — position (verbatim, abridged): "Structurally sound; three contract/surface fixes before implementation."

Disciplines 1 and 4 are plumbing — alter what the team-lead holds, not what it does; Controller integrity
untouched. Discipline 3 is the real lever and a clean structural extension of caveman-ultra. GAP 1 (central
purity risk) — Consolidator ceiling is wrong: researcher contract permits interpretive synthesis ("Consolidated
picture: 2-6 sentences synthesizing the sources"); a Consolidator-by-analogy inherits that and would pre-empt
the team-lead's independent risk-weighting. Fix: Consolidator needs its OWN agent file with a positive
enumeration ceiling — "produces alignment count, per-member position summary, verbatim notable quotes; does NOT
characterize why alignment exists, does NOT weight by risk, does NOT synthesize a direction." Option B explicitly
prohibited in the agent file; "lean Option A" hardened to "Option A only." GAP 2 — rehydration runtime unconfirmed;
if harness lacks it, discipline 4 is aspirational and its AC cannot be met; scope as conditional. GAP 3 — discipline
3 via shared member-protocol reference, matching the caveman-ultra pattern, not per-agent edits.

### Member follow-ups

- Conservator -> Pragmatist (and reply): rehydration reduces to manual reset; advisory not enforced. Per-agent
  duplication is the wrong surface for discipline 3 — shared reference, matching committee-analysis-round-format precedent.
- Innovator -> Pragmatist (reply): Consolidator implementable as specified, BUT SendMessage return is the binding
  constraint — verbatim already in team-lead transcript before Consolidator dispatch unless discipline 3 active first.
- Purist -> Conservator (reply): researcher contract DOES blur the reducer/advocate line; Consolidator will inherit
  it unless given a positive enumeration ceiling. Enumeration-only does not hold under existing researcher precedent.
- Mid-round adoption: all four members independently converged on (a) disciplines 2+3 co-ship, (b) Option A
  normative, (c) shared member-protocol reference for discipline 3, (d) discipline 4 AC must be rewritten or scoped
  conditional. Researcher findings (checks 1, 3, 5) were adopted by Conservator and Innovator as position revisions.

### Team Lead

_Neutral consolidation (Consolidator, Option A — enumeration only). No risk weighting, no direction, no opinion._

#### Convergence

Settled — all four advocacy members AND the researcher agree:

- The four-discipline proposal's design direction is sound / correct as a frame (no member calls for rejection or redirection).
- The team-lead decomposition into a context-holding controller role vs. non-holding conduit/synthesizer roles is correct.
- Discipline 3 (digest-to-lead / verbatim-to-disk) is the real lever / first-mover mechanism.
- Disciplines 2 and 3 must ship together as an ordering constraint (discipline 2 alone is a no-op for economy).
- Option A (neutral pattern only; judgment stays with team-lead) is to be normative, not merely "lean."
- Discipline 3 belongs in a shared member-protocol reference, not per-agent Output Format edits (five-file drift risk).
- Discipline 4 (inter-round ledger + rehydration) rests on a runtime primitive that does not currently exist; its acceptance criteria must be rewritten or scoped conditional.
- The Consolidator-as-researcher-analog is feasible / implementable.
- The round-format template needs a Consolidator section (currently absent).

Researcher findings adopted as settled fact:

- No member agent (Conservator, Innovator, Pragmatist, Purist) has Write access; discipline 3's verbatim-to-disk path is unsatisfiable as agent files stand (Check 1, DECISIVE).
- Both governing-constraint sister briefs (temporary-roles-and-discipline; committee-variant-separation) are dangling — not present in any status bucket (Check 3, DECISIVE).
- No mid-deliberation compaction primitive exists for the main thread; util-handoff is a manual between-session reset, not in-process rehydration (Check 5, DECISIVE).
- The three cited prior measures exist as cited (Check 2). The round-format template exists but has only team-lead inline placeholders, no Consolidator output shape (Check 4).

#### Alignment

Count: 4 advocacy members + 1 researcher = 5 voices. Alignment is unanimous (4/4 members) on the convergence items above; no member holds a dissenting pole.

Reporting poles, who-is-on-which-side:

- Sound-direction / proceed: Conservator, Innovator, Pragmatist, Purist (all four).
- Mechanism-incomplete: Conservator, Innovator, Pragmatist, Purist (all four).

Every member occupies both poles simultaneously; there is no opposed pairing. Disposition phrasing differs by member (advance with conditions / revise to -01 / proceed to design-specify with corrections / fixes before implementation), all gated on resolving the recorded gaps.

Per-member one-line position:

- Conservator: "Advance with conditions; resolve gaps 1, 5, 6 before sprint."
- Innovator: "Architecture correct; revise to -01 before sprint."
- Pragmatist: "Proceed to design-specify with four corrections."
- Purist: "Structurally sound; three contract/surface fixes before implementation."
- Researcher: facts only — disciplines 1 and 4 are framing/plumbing; discipline 3 blocked by missing tool grant; discipline 4 rehydration has no primitive to build on; two source documents unreadable; round-format template lacks a Consolidator section.

Member follow-ups (recorded exchanges):

- Conservator -> Pragmatist: rehydration reduces to manual reset (advisory, not enforced); per-agent duplication is the wrong surface for discipline 3.
- Innovator -> Pragmatist: Consolidator implementable as specified, but SendMessage return is the binding constraint unless discipline 3 is active first.
- Purist -> Conservator: researcher contract blurs the reducer/advocate line; Consolidator inherits it absent a positive enumeration ceiling.
- Mid-round adoption: all four independently converged on (a) disciplines 2+3 co-ship, (b) Option A normative, (c) shared member-protocol reference, (d) discipline 4 AC rewritten or conditional. Conservator and Innovator adopted researcher checks 1, 3, 5 as position revisions.

#### Observations

Verbatim notable quotes (most load-bearing phrase from each, exact words):

- Researcher: "Discipline 3's verbatim-to-disk path is unsatisfiable as agent files stand."
- Conservator: "rehydration confirmed false: no mid-deliberation compaction exists".
- Innovator: "discipline 2 without 3 is a no-op for economy because verbatim already billed in team-lead transcript".
- Pragmatist: "context grows monotonically, ledger reduces the RATE not the bound."
- Purist: "Consolidator needs its OWN agent file with a positive enumeration ceiling".

Open decisions the designer must make (enumerated; no answer recommended):

1. Discipline 4 disposition: SETTLED by designer — build the disk-read ledger now, scoped minimal (few-hundred-token state file at each round boundary). AC rewritten from "flat across rounds" to "growth materially reduced + state survives a session handoff." No longer open. See Designer Adjudications.
2. Write access: SETTLED by designer — Option 1, grant members Write (scoped to the committee artifact tree). See "Designer Adjudications" below for the artifact-layout convention this decision carries. No longer open.
3. The dangling sister briefs: SETTLED by designer — re-point and fold (option a), not reconstruct. Citations are stale, not broken. No longer open. See Designer Adjudications.
4. Single-round-to-multi-round cutover mechanism: DISSOLVED by designer — no cutover, no gate, no conditional. One uniform Ad-hoc setup; disciplines always on. See Designer Adjudications. No longer open.
5. Discipline 3 surface: SETTLED this round (unanimous post-Q&A) — shared member-protocol reference, not per-agent Output Format edits. No longer open.
6. Consolidator boundary: SETTLED by designer (ratified, 4-0) — own role definition with a positive enumeration ceiling; "Option A only"; Option B prohibited. No longer open. See Designer Adjudications.
7. Round-format template: SETTLED by designer — full re-alignment to the decided model (round-folder layout, separate member transcripts, distinct enumerate-only Consolidator section, separate team-lead risk-weighted final). No longer open. See Designer Adjudications.
8. Disciplines 2+3 co-ship: SETTLED by designer (ratified, 4-0) — digest-to-lead is a HARD acceptance criterion, paired and co-equal with the Consolidator. No longer open. See Designer Adjudications.

## Final Recommendation

**Decision.** Whether the brief is sound enough to advance as-is, or must be revised to -01 with named corrections before any sprint design begins.

**Committee read.** Unanimous (4-0) on two things at once: the design direction is sound, AND the mechanism is incomplete as written. No irreducible split — this is a convergent review with a required-fix list, not a contested call.

**Settled convergence (all four + researcher):**
- The four-discipline frame and the team-lead role decomposition (controller keeps long-lived context; conduit + synthesizer do not) are correct.
- The digest-to-lead discipline is the real lever; the Consolidator discipline does nothing for economy unless digest-to-lead ships with it.
- The Consolidator must be enumeration-only (Option A), with its own contract — not the researcher's borrowed prohibitions.
- The digest discipline belongs in one shared member-protocol reference, not five per-agent edits.

**Three confirmed blockers the brief does not name:**
1. No committee member can save files (no Write permission) — the verbatim-to-disk path is unbuildable until that grant is added or a scribe role absorbs the writing.
2. No mid-deliberation compaction primitive exists — the ledger's "flat across rounds" promise is unachievable in one continuous session; it reduces the growth rate, not the bound. The acceptance criterion overclaims.
3. Two cited sister briefs do not exist anywhere in the repo — two governing constraints rest on unreadable sources.

**Recommendation.** Opinion: advance to a -01 revision — all seven open decisions are now adjudicated by the
designer (see Designer Adjudications) and the design frame survived untouched. The -01 carries: Write grant +
committee/roundNN layout (D1); minimal disk-ledger + "materially reduced" AC (D2); re-pointed citations, two
folded one-liners, demoted late-evidence orphan (D3); NO cutover — one unconditional path (D4); own
enumerate-only Consolidator role (D5); digest-to-lead as a hard paired AC (D6); full round-record template
re-alignment (D7). Global: no "Mode A/B" terms; scope = Ad-hoc committee only. Settled across this round's
designer adjudication; supersedes the brief's open-concern framing for all seven items.

**Closing prompt.** All decisions settled. Finalize this record, hand the designer the -01 change-list, and tear down the team.

## Designer Adjudications

### Decision 1 — Write access + committee artifact layout (SETTLED 2026-06-04)

**Resolution.** Option 1 — grant committee members Write access. Verbatim-to-disk is satisfied by members
writing their own transcripts, not by the team-lead writing on their behalf (the "renamed conduit" non-fix).

**Carried convention (normative for the -01 brief and the base skill).** Committee work product is segregated
from formal session artifacts by a dedicated tree under the session working-folder root:

- During committee setup, create a `committee/` folder at the session working-folder root.
- For each round, create a `roundNN/` folder (e.g. `round01/`) inside `committee/`.
- All round artifacts are written into that round folder: per-member transcripts, researcher findings,
  and the team-lead committee-analysis report.
- The formal session folders (`design/ spec/ plan/ summary/`) are RESERVED for formal session artifacts.
  No committee work file is ever written there.

This revises the current record-file rule (which places `committee-analysis-NN.md` in `design/`). The new
unit of committee persistence is the round folder, not a per-question file in `design/`. Write access is
scoped to this `committee/` tree. This proof-of-principle round was retroactively relocated into
`committee/round01/` to conform.

**Feeds:** discipline 3 design (the verbatim-to-disk target path), the brief's acceptance criteria (add the
Write grant + the layout convention), and SKILL.md Phase 1/Phase 3 (committee/round-folder setup).

### Decision 2 — Discipline 4 ledger disposition (SETTLED 2026-06-04)

**Resolution.** Build the disk-read deliberation-state ledger now, scoped minimal: a few-hundred-token state
file (round number, members returned, running alignment pattern, open questions, designer decisions-so-far)
written at each round boundary into the round folder. Not a transcript.

**AC rewrite (unanimous, not contested):** drop "flat across rounds." The team-lead cannot evict within one
continuous session (no compaction primitive). New criterion: "team-lead context growth per round is
materially reduced versus baseline, AND deliberation state survives a session handoff via the ledger +
round-folder records." The rehydration-across-sessions property is the ledger's primary durable win;
within-session it slows growth, it does not flatten it.

**Feeds:** discipline 4 becomes a build item with the minimal-ledger spec above; the brief's AC; and the
team-lead role doc (write/read the ledger at round boundaries).

### Decision 3 — dangling sister briefs (SETTLED 2026-06-04)

**Resolution.** Option a — re-point and fold; do NOT reconstruct. Researcher follow-up
(`researcher-followup.md`) showed the citations are stale, not broken: the cited content already lives
in existing skill files. Specifically:

- Forbidden attach surfaces (3 surfaces) — already in `references/skill-contract.md` (covered). Re-point the
  brief's citation there.
- Floor-not-ceiling — already in `skill-contract.md` + the Translation Gate (covered). Re-point.
- Ad-hoc-vs-design-architect-committee separation — already real, split across the two skills (covered in
  substance). No reconstruction needed.
- Affirmative "agent-file edits permitted as generic role-contract clarifications" — partial; one sentence
  in `skill-contract.md` absorbs it. Fold into this sprint (it edits those surfaces anyway).
- "Submit finals via messaging" as a named discipline — partial; one line on the finals step absorbs it. Fold.
- Late-evidence revision sub-rounds — the ONE genuine orphan; a standalone future feature, NOT a dependency
  of this work. Demote it out of the brief's authority chain; spin its own brief later if wanted.

**Feeds:** the -01 brief (swap stale citations → skill-contract.md; drop the late-evidence citation), and two
one-line base-skill edits folded into this sprint's scope.

### Global directives from designer (2026-06-04)

**Terminology ban.** Do NOT use "Mode A" / "Mode B" anywhere — designer directive from a prior sprint. Use
only "Ad-hoc committee" (= the `design-committee` skill) and "design-architect-committee". All session records
scrubbed to conform; the -01 brief must replace every "Mode A/Mode B" occurrence.

**Scope = Ad-hoc committee only.** All context-economy disciplines apply ONLY to the Ad-hoc committee
(`design-committee`). `design-architect-committee` is slated for deprecation in a future sprint — do NOT extend
any of these changes to it. This narrows the discipline-3 agent-file edits and the SKILL.md/team-lead.md edits
to the Ad-hoc committee's surfaces only.

### Decision 4 — cutover trigger (DISSOLVED 2026-06-04)

**Resolution.** There is NO cutover. Designer rejected the conditional outright: one ad-hoc setup, no gate,
no "is this multi-round?" check, no degrade-to-no-op clause. The disciplines are UNCONDITIONAL — every
consult runs the same single path: round folder, members write their own transcripts, team-lead dispatches
the Consolidator, ledger exists. This supersedes the committee's earlier "Consolidator required at round 2+;
inline for single-round" correction.

**Rationale.** Matches the existing unconditional record-file pattern ("there is no conversation-only mode").
The only cost is one extra Consolidator spawn on a single-round consult — accepted as the price of zero
branching. A branch not written cannot drift or be skipped.

**Feeds:** removes the brief's "stated cutover" acceptance criterion entirely; SKILL.md/team-lead.md describe
one path, not a fast/slow fork.

### Decision 5 — Consolidator boundary (RATIFIED 4-0, 2026-06-04)

**Resolution.** The Consolidator gets its OWN role definition (a new `chester:design-committee-consolidator`
agent, scoped to the Ad-hoc committee), NOT the researcher's borrowed prohibitions. Positive enumeration
ceiling: it produces the alignment count, per-member position summaries, and verbatim notable quotes — and
explicitly does NOT characterize why alignment exists, does NOT weight by risk, does NOT synthesize a
direction. "Lean Option A" hardened to "Option A only"; Option B (full draft synthesis) prohibited in the
role file. The team-lead always applies risk-weighting to the Consolidator's inert output.

**Rationale.** The researcher contract permits interpretive synthesis ("2–6 sentences synthesizing the
sources"); a Consolidator-by-analogy would inherit exactly the interpretation we are removing. A positive
ceiling keeps the reducer inert and the team-lead's judgment uncontaminated.

**Feeds:** a new Consolidator role definition file; the brief's AC (positive ceiling, Option B prohibited);
team-lead.md (dispatch Consolidator, apply risk-weighting to its output).

### Decision 6 — digest-to-lead as a hard acceptance criterion (RATIFIED 4-0, 2026-06-04)

**Resolution.** The digest-to-lead path is a HARD acceptance criterion, paired and co-equal with the
Consolidator — NOT an open concern. The bound path:

- Member writes its FULL position to its own round-folder transcript (Write bit from Decision 1).
- Member sends the team-lead a SHORT structured digest only: identity, headline position, chosen option,
  top trade-off, confidence, and the transcript path. No full reasoning crosses to the team-lead.
- The Consolidator reads the full text from disk; the team-lead never holds it.

**Rationale.** This is the load-bearing lever. The Consolidator (Decision 5) and the Write bit (Decision 1)
save nothing unless members stop sending full positions to the team-lead — otherwise the full text is in the
team-lead transcript forever and the Consolidator is pure overhead ("renamed conduit"). Disciplines 2 and 3
ship together or the economy gain is zero.

**Feeds:** the digest shape goes in the shared member-protocol reference (Decision settled this round); the
brief's AC (hard, paired); team-lead per-round context = digests + one Consolidator summary + ledger.

### Decision 7 — round-record template re-alignment (SETTLED 2026-06-04)

**Resolution.** Full re-alignment, not a minimal patch. Revise `committee-analysis-round-format.md` to
describe the one decided path end to end:

- Record lives in `committee/roundNN/`, not a single file in `design/`.
- Per-member transcripts are separate files in the round folder.
- A distinct ENUMERATE-ONLY Consolidator output section: alignment count, per-member position summaries,
  verbatim notable quotes — no interpretation (mirrors the Decision 5 ceiling).
- A separate team-lead Final Recommendation section carrying the risk-weighted call.
- The minimal "single-file-in-design/, inline team-lead consolidation" framing is removed (it contradicts
  Decisions 1 and 5).

**Rationale.** A template still describing inline `design/` consolidation would contradict the Consolidator
and round-folder decisions; patching one section into a stale frame plants drift (standalone-documentation
discipline). One template, one path.

**Feeds:** `committee-analysis-round-format.md` rewrite; the brief's AC (template update in scope).

<!-- created-at: 2026-06-04T11:59:47Z -->
<!-- produced-by design-committee@v0016 -->
