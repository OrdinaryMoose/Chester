# Pragmatist Transcript — Round 01
# Committee: design-committee-update-committee-research
# Date: 2026-06-12

## Mandate

Weigh operational cost against benefit for each of RC-1..RC-4 (root cause confirmation/refutation)
and P1..P5 (fix proposals). Identify the simplest sufficient set that closes the actual failure.
Call out gold-plating. Be concrete about where each rule's cost lands.

## Inputs Used

- Root-cause brief: docs/chester/working/20260612-01-update-committee-research/design/20260612-01-update-committee-research-design-00.md
- Round 01 researcher-findings.md (StoryDesigner repo, sprint-s5-language-dsl-absorb)
- Round 02 purist-transcript.md (same sprint), specifically lines 14 and 59-67 and 105
- Ledger.md (same sprint), rounds 01-04

---

## Part 1 — Root Cause Confirmation / Refutation

### RC-1 — Pull-only researcher

**Confirmed.** The VT-2 census in R01 researcher-findings.md names the two Logic consumers of
Language.Contracts explicitly (LanguageValidationBridge.cs: Common + Contracts;
SpanIndexSpanProvider.cs: Contracts). Those facts were on disk after R01. RC-1's claim is that the
researcher was never re-tasked to run "enumerate every consumer of Language.Contracts" because R02
redirected it to piece-counts and ANTLR items. The ledger confirms this: R02 tasked C-1/C-2 (piece
counts and ANTLR). The refuting fact existed in the prior round's work; nobody asked the right
question in R02. RC-1 is confirmed.

**Operational observation:** RC-1 is upstream of any warrant check. Even if P1 ships tomorrow, a
member can still introduce an empirical claim in R02 without the researcher having re-run the
census. P1 catches it at the warrant gate; it does not prevent the claim from entering. RC-1 needs
its own fix (P2) to be addressed at the source.

### RC-2 — Empirical claim carrying a non-empirical warrant

**Confirmed.** KD-3 in the Purist's R02 transcript (line 67) asserts "no callers outside Language
itself (confirmed by grep)" — an existence/containment claim that requires evidence warrant. No
grep appears in R02 researcher-findings.md. The claim rode a logic warrant (categorical: stage
contracts are private by nature) dressed with a fabricated evidence cite. The warrant machinery in
member-protocol.md § Final Position already defines the type taxonomy (evidence / logic /
in-scope designer-premise) but does not specify which types are *required* for which claim classes.
RC-2 is the central missing constraint.

### RC-3 — Normative→descriptive slip

**Confirmed.** The Purist's own line-105 residual proves it: "include a check that no type from
DSL.Language.Contracts.* is consumed outside DSL.Language.* — that is the concrete test that the
'internal' claim holds." The Purist knew the assertion was unproven and asked for a future test.
Between R02 and R03, the spec encoded it as a present-tense fact (AC-1.11). The modal verb dropped
silently. The Consolidator cannot catch this by contract (enumerate-only). RC-3 is confirmed.

### RC-4 — No cross-check of new claims against accumulated evidence

**Confirmed.** The Round 01 VT-2 data directly refutes the Round 02 KD-3 claim, and no role
owned the cross-check. The ledger records claims and findings in sequence but does not diff
incoming assertions against prior-round evidence. RC-4 is confirmed.

**Interaction note:** RC-4 is the mechanism by which RC-2 and RC-3 went undetected past R02. If
any role had diffed KD-3 against VT-2, the contradiction was immediate. RC-4 is a real gap, but
it is also the most expensive fix to operationalize (requires the team-lead to read prior round
evidence on every new invariant claim).

---

## Part 2 — Proposal Cost/Benefit Analysis

### P1 — Warrant-class rule: empirical claims require evidence warrant

**Benefit:** Catches RC-2 at the choke point. Every existence/containment/"no consumer outside X"
claim must carry warrant.type=evidence with a runnable command and its result. A logic warrant on
such a claim is auto-demoted to a gap → routed to researcher. This is the single rule that would
have stopped KD-3 from surviving R02. High benefit, touches the root.

**Cost:** Adds one obligation per member per round — authors of empirical claims must run a grep
or build command and include the output. In rounds that have empirical claims, that is a few
minutes of member-time per claim. In rounds without empirical claims (pure design-opinion rounds),
cost is zero. The auto-demotion pathway adds one team-lead verification step per round. The
enforcement text adds ~10-15 lines to member-protocol.md and ~5 lines to team-lead.md. These are
one-time authoring costs, not per-round overhead.

**Verdict: Must ship.** This is the load-bearing fix. Benefit is high; per-round cost is bounded
to the empirical-claim authors only and scales with the actual empirical claim count per round.

### P2 — Standing consumer census as R01 deliverable for relocation questions

**Benefit:** Addresses RC-1 at the source. Makes the refuting fact a mandatory R01 output for
move/contain/retire/absorb questions rather than something that has to be asked for. In S5, the
census was run (VT-2) but at coarse granularity — sub-namespace level would have made the
Contracts consumers visible immediately. P2 raises the floor on R01 completeness.

**Cost:** Adds a mandatory deliverable to the researcher for every relocation-class convening
question. That is a standing per-sprint cost for any sprint whose question is a move/contain/
retire/absorb. The census itself is a grep command — low researcher-time in practice. The cost is
not per-round but per-sprint, and only for relocation-class questions. Non-relocation sprints pay
zero.

**Is P2 redundant with P1?** No. P1 catches the bad warrant after a false claim enters. P2
prevents the false claim from entering by ensuring the census is already in the evidence record
before any member can make a containment assertion. P2 is upstream of P1. P1 closes the gap if
P2 misfires; P2 prevents the gap from opening. They are complementary, not substitutes.

**Verdict: Ship alongside P1.** Low recurring cost, high redundancy value. Cheap insurance. The
two together form a layered defense: P2 puts the refuting fact on disk in R01; P1 ensures any
member claim must cite evidence, and the on-disk census is the natural evidence source.

### P3 — Baseline-the-invariant for acceptance criteria

**Benefit:** Catches RC-3 at the moment of AC encoding. Any zero-consumer/isolation/containment
AC must be run against HEAD at authoring. If it is not already green (or provably made-green by
the planned work), the AC is malformed. Would have caught AC-1.11 immediately.

**Cost:** Adds a gate step to spec authoring (team-lead Converge, step 7). For invariant ACs, the
team-lead must run or confirm a grep. This is a one-time cost per invariant AC per sprint, not a
per-round cost. The check is fast (grep) and is only triggered by the specific invariant class.
Most ACs are behavioral, not invariant, so this gate fires rarely.

**Is P3 redundant with P1?** Partially. If P1 is enforced correctly, the containment claim never
makes it through R02 without evidence, so the false invariant never reaches spec-authoring. P3 is
a second catch point for the case where P1 is bypassed (a member cites a fabricated grep or where
a claim slips through for any reason). P3's cost is very low and its catch-point is independent
(encoding moment vs. claim-introduction moment).

**Verdict: Ship.** The cost is low enough that the redundancy with P1 is worth it. Defense-in-
depth at two independent points is cheap insurance when both points are cheap.

### P4 — Flag normative→descriptive transition explicitly

**Benefit:** Addresses RC-3 at the round boundary by requiring that any property promoted from
intent to invariant be re-stated and re-tested as a present-tense fact before encoding. The
Purist's line-105 was exactly this signal — carried forward as a TODO instead of executed.

**Cost:** Adds a step to the team-lead Synthesize (step 6): scan prior-round member intents and
identify any that got promoted to assertions, then route them to the researcher. This requires the
team-lead to hold context across rounds — recognizing when an R02 "should be" became an R03 "is."
That is a non-trivial judgment step that does not reduce to a mechanical rule. The cost lands on
team-lead time, every round, for any round that authors spec assertions.

**Is P4 redundant with P1?** Substantially yes. A "should be internal" intent promoted to "is
internal" in an invariant AC is exactly the kind of existence claim that P1 catches. If P1 is in
force, the member authoring KD-3 in R02 must supply an evidence warrant for the containment claim.
The normative→descriptive slip cannot survive the warrant check. P4 adds a team-lead scan for a
failure mode that P1 closes at the member level.

**Verdict: Defer, do not block.** P4 addresses the same failure as P1 but at a later point (round
boundary vs. claim introduction) and with higher team-lead cost. P1+P2+P3 together close the
actual failure path. P4 becomes meaningful only if P1 is incomplete or misconfigured. Note it as a
potential future hardening, not a required change.

### P5 — Invariant-vs-evidence diff in team-lead Synthesize

**Benefit:** Addresses RC-4 directly — the missing cross-check of new invariant claims against
accumulated evidence. Would have caught the KD-3 vs. VT-2 contradiction in R02.

**Cost:** Adds an ongoing obligation to the team-lead Synthesize: for every new invariant or
containment claim introduced in the current round, diff it against all prior round evidence in
the ledger and round folders. This is a per-round cost for every round where new invariants appear.
The team-lead must read prior-round material on demand. For long committee sessions (3-4 rounds),
this accumulates. The cost is not trivial.

**Is P5 redundant with P1?** Largely yes. P1 requires the member to carry an evidence warrant
when introducing any empirical claim. If the member supplies a real grep result, the team-lead can
read it directly. The team-lead cross-check in P5 is a fallback for when P1's evidence is itself
wrong or incomplete. But if we trust P1 to enforce real evidence, the team-lead diff is redundant
overhead. If we do not trust P1, then P5 is catching what P1 missed — but the right fix is to
strengthen P1, not add a second check at a different layer.

**The RC-4 interaction:** P2 already places the refuting fact in R01. P1 forces any R02 claim to
carry a real grep result. If both are in place, the R02 member must run the census themselves and
will discover the contradiction before submitting. The team-lead diff (P5) is a third catch for a
failure mode that P1+P2 together close.

**Verdict: Do not ship.** P5's per-round team-lead cost is the highest of the five proposals, and
P1+P2 together close the actual failure path. P5 is gold-plating. The design brief calls it
"defense-in-depth" but in practice it is an ongoing runtime tax on the team-lead's most expensive
step. Reserve if field evidence shows P1+P2 insufficient.

---

## Part 3 — Simplest Sufficient Set

**Ship: P1 + P2 + P3.**

- P1 is load-bearing. It closes RC-2 (the missing warrant-type constraint) at the choke point.
- P2 is cheap insurance that closes RC-1 before P1 even fires. Low recurring cost, relocation-only.
- P3 is cheap insurance at the encoding moment. Fires rarely, catches what slips past P1.
- P4 is substantially redundant with P1 and adds team-lead judgment overhead. Defer.
- P5 is substantially redundant with P1+P2 and adds the highest per-round runtime cost. Skip.

**Ranking by benefit/cost:**

1. P1 — highest benefit, bounded cost, non-redundant, load-bearing. Ship first.
2. P2 — high benefit, low recurring cost (relocation-only), upstream of P1. Ship with P1.
3. P3 — moderate benefit, very low cost, independent catch-point. Ship alongside P1+P2.
4. P4 — low marginal benefit over P1, higher team-lead cost. Defer.
5. P5 — lowest marginal benefit (redundant with P1+P2), highest runtime cost. Skip.

**Where each cost lands:**

- P1: member-time (run the grep, include result) per empirical claim per round. Team-lead-time
  (verify warrant type) per claim per round. Both costs are bounded and scale with actual empirical
  claim count. Zero cost in design-opinion-only rounds.
- P2: researcher-time (consumer census grep) per relocation-class sprint, R01 only. One-time per
  sprint, not per round.
- P3: team-lead-time (run invariant baseline check) per invariant AC per spec-authoring round.
  Fires rarely; fast when it fires.
- P4: team-lead-time (cross-round modal-verb scan) every synthesis step. Ongoing, non-trivial.
- P5: team-lead-time (diff invariants vs. accumulated evidence) every synthesis step. Ongoing,
  highest cost.

---

## Final Position

**position:** Ship P1+P2+P3 as the simplest sufficient set. Defer P4. Skip P5.

**rationale:** P1 closes the central defect (RC-2: empirical claim on non-empirical warrant) by
making warrant-type admissibility a defined rule, not a judgment call. P2 closes RC-1 upstream
of P1 by mandating the consumer census as a standing R01 deliverable for relocation-class
questions — putting the refuting fact on disk before any member can assert containment. P3 adds
a cheap independent catch at spec-encoding time. Together, they close all four root causes: P1
closes RC-2, P2 closes RC-1, P3 closes RC-3, and the combination of P1+P2 closes RC-4 (the
cross-check gap disappears when evidence is mandatory at claim introduction and the census exists
in R01). P4 addresses the same failure path as P1 at a later point with higher team-lead cost;
it becomes redundant once P1 ships. P5 imposes the highest recurring team-lead overhead of any
proposal and is redundant with P1+P2; skipping it keeps the committee's per-round cost from
growing materially.

**blocking_risk:** P4 and P5 not shipping does not block the fix. The actual failure (KD-3
surviving to R04) is fully addressed by P1+P2+P3. Risk of leaving P4/P5 out: a future normative→
descriptive slip that bypasses P1 (e.g., a member supplies a technically real but incomplete grep)
could still propagate. Acceptable residual risk; P3 provides a second catch at encoding.

**warrant:**
- type: logic
- source: S5 failure chain traced through R01 VT-2 (Contracts consumers named on disk), R02 KD-3
  (containment claim on fabricated evidence cite), R03 AC-1.11 (present-tense encoding of
  unproven claim), R04 attack (refutation). Cost analysis derived from claim-frequency properties
  of empirical vs. design-opinion content in committee rounds.
