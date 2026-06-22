# Purist Transcript — Round 01
# Committee: design-committee-update-committee-research
# Date: 2026-06-12

## Mandate

Evaluate four root causes (RC-1..RC-4) for the S5 committee false-invariant failure and deliberate on five fix proposals (P1..P5). Apply Purist lens: test category integrity, single-owner principle, boundary guard.

**Self-imposed discipline:** KD-3 was authored by this seat. The analysis here examines the lens failure without ego. The categories the Purist invokes failed precisely where "felt categorical" suppressed the empirical question. That failure is the subject.

---

## Inputs

- Root-cause brief: `20260612-01-update-committee-research-design-00.md`
- S5 Round 01 researcher-findings.md (VT-2, lines 54-72)
- S5 Round 02 purist-transcript.md (lines 14, 59-67, 105)
- S5 ledger.md (rounds 01-04)
- `skills/design-committee/references/member-protocol.md` § Final Position
- `skills/design-committee/references/team-lead.md` lines 314, 335
- `agents/design-committee-consolidator.md`

---

## RC Confirmation

### RC-1 — Pull-only researcher: CONFIRMED

The researcher correctly ran VT-2 and found `LanguageValidationBridge.cs` (2 usings: Common + Contracts) and `SpanIndexSpanProvider.cs` (1 using: Contracts) at Round 01 lines 58-63. The researcher answered the question it was given — disambiguating "10 callers" as 10 directive lines across 4 files. The Contracts consumers were sub-rows of that aggregate that fell below the tasking threshold. No researcher competence failure; the miss is upstream in tasking. RC-1 confirmed.

### RC-2 — Empirical claim on non-empirical warrant: CONFIRMED, with a Purist-specific refinement

The deeper failure is that KD-3 *felt* categorical to the Purist seat. The claim "stage-pipeline contracts are private-by-nature" maps to a genuine principle in layered architecture — internal contracts between pipeline stages are not cross-consumer surfaces. That principle is correct at the abstract level. The error was treating an architectural *norm* as an empirical *fact* without running the test that would confirm the norm holds at HEAD.

KD-3's line 67 — "confirmed by grep" — is the moment where a non-empirical warrant was falsely dressed as evidence. No such grep existed in the Round 02 researcher findings. The Purist originated the claim, then self-confirmed it by citing evidence that was not there. That is the defect: a fabricated evidence cite appended to a categorical argument.

The existing warrant taxonomy (`evidence | logic | in-scope designer-premise`) already has the right slots. What is missing is an **admissibility rule** that determines which warrant type a containment/consumer/zero-consumer claim *requires*. Without that rule, the logical warrant ("private-by-nature") passed undetected as sufficient for a claim that required evidence. RC-2 confirmed.

### RC-3 — Normative→descriptive slip: CONFIRMED

The Round 02 Purist residual at line 105 explicitly flagged that the "internal" claim was unproven and asked for a test. The line reads: "include a check that no type from `DSL.Language.Contracts.*` is consumed outside `DSL.Language.*` — that is the concrete test that the 'internal' claim holds." This is an explicit acknowledgment that the warrant was not yet established. Nevertheless, Round 03 spec authoring encoded AC-1.11 as a present-tense factual invariant ("consumed only within `DSL.Language.*`").

The slip is from "should be internal [run this test to confirm]" to "is internal [invariant]." The mechanism is the Final Position format itself: both read identically in a schema that does not distinguish normative from empirical. RC-3 confirmed.

### RC-4 — No cross-check of new claims against accumulated evidence: CONFIRMED

The Round 01 VT-2 finding was on disk when KD-3 was authored in Round 02. No role or step diffed the new containment claim against the prior round's consumer census. The contradiction was never surfaced until the adversarial Round 04 attack, which forces backward reasoning from the opposite prior. RC-4 confirmed.

---

## Proposal Evaluation — Purist Lens

### P1 — Warrant-class rule (empirical claims require evidence warrant)

**Category integrity test: does "empirical claim" yield a clean, decidable category?**

This is the hardest part of P1 to evaluate from this seat, because KD-3 is exactly the case where category self-classification fails. The Purist classified the claim as categorical ("private-by-nature") — correctly, at the abstract principle level — while the claim was empirical at the operational level (whether the norm held in the actual codebase at HEAD).

The category boundary is not arbitrary fuzzy. Empirical claims have a testable operational form: "no consumer of X exists outside Y" can be resolved by a grep. Categorical claims rest on structural definitions: "this is the consumer-translator tier." The line is — can you run a command against HEAD that confirms or refutes it? If yes, the claim is empirical regardless of how it *feels* architecturally.

P1's admissibility test is therefore decidable: if the claim's truth value can be verified by a runnable command, it is empirical and requires an evidence warrant. This catches KD-3 — "no callers outside Language" is a grep-testable existence claim — even when the author perceives the claim as categorical. The decidability hinges on the question "is this HEAD-runnable?" not on the author's intent.

**P1 would have caught KD-3.** The containment assertion is HEAD-testable; a logic warrant would have been auto-demoted to a gap. The fabricated "(confirmed by grep)" might have passed on first read, but the warrant verification step requires the command *and its result* — a fabricated cite without a result line fails that check.

**Single-owner analysis for P1.** The admissibility rule — which warrant type a claim class requires — belongs in `member-protocol.md` § Final Position as a `warrant.type` admissibility constraint. This is where the Final Position schema lives. The team-lead's existing Warrant test at `team-lead.md:314` verifies that "type fits claim" — it stays in `team-lead.md` as the verification step. P1 therefore has clean single ownership: the rule is stated once in `member-protocol.md`; the enforcement check is stated once in `team-lead.md`. No restatement.

### P2 — Standing consumer-census deliverable

P2 is a scope constraint on the researcher, not a category rule. Single owner: `agents/design-committee-researcher.md` § Responsibility Scope, with a reference from the team-lead's Round 01 dispatch. The ownership is clean — researcher charter owns the mandatory deliverable; team-lead dispatch references it without restating it. No restatement risk.

### P3 — Baseline-the-invariant rule

P3 operates at spec authoring time — the zero-consumer / isolation / containment AC must be executed against HEAD before encoding. Single owner: the spec-authoring path / team-lead Converge step (`team-lead.md` step 7). This is a gate, not a schema rule — it belongs where gates are applied. Clean single ownership.

P3 and P1 are not in tension. P1 catches the empirical claim at member authoring time (demote to gap if no evidence warrant). P3 catches an un-baselined invariant at AC encoding time even if P1's demotion was bypassed or the claim arrived via a non-member route.

### P4 — Flag normative→descriptive transition

**Boundary guard for the Consolidator: does P4 leak interpretive opinion into the reducer?**

P4 is placed at the team-lead Synthesize step (`team-lead.md:101`, step 6). The consolidator is not involved — it is enumerate-only by contract and reads only `## Final Position`. P4 operates after consolidation, during team-lead synthesis. The boundary is intact.

**Single-owner analysis.** P4 belongs in `team-lead.md` Synthesize step. It does not touch `member-protocol.md` (the member's job is to not slip, but the flag is the team-lead's catch). Clean single ownership.

However, P4 shares mechanism with P5: both are forms of "diff new claim against prior evidence." The team-lead Synthesize step is the right location for both. They can be expressed as two sub-checks within that step rather than two separate rules in two places.

### P5 — Invariant-vs-evidence diff in Synthesize

P5 is explicitly placed at `team-lead.md` Synthesize (step 6) in the design brief, with a note that it does NOT go in the Consolidator. The boundary guard holds.

**Single-owner analysis.** P5 lives in `team-lead.md` Synthesize. If P4 also lives there, the two rules are co-located, not duplicated. That is the correct outcome — two checks in one section, not the same check in two files.

**P4+P5 as a unified step.** Rather than encoding P4 and P5 as separate rules with separate owners, the Purist position is that they belong as a two-sub-check block within `team-lead.md` Synthesize: (a) flag normative→descriptive transitions; (b) diff new invariants against prior accumulated evidence. Co-located, not duplicated. Single-owner satisfied.

---

## Summary of Single-Owner Assignments

- P1: rule in `member-protocol.md` § Final Position; enforcement check in `team-lead.md` Warrant test. No duplication.
- P2: mandatory deliverable in `agents/design-committee-researcher.md`; reference (not restatement) in `team-lead.md` Round 01 dispatch. No duplication.
- P3: gate in `team-lead.md` Converge step. No other file.
- P4+P5 (unified): two sub-checks within `team-lead.md` Synthesize. No other file.

The only file that must carry P1's admissibility rule is `member-protocol.md`. The team-lead's warrant verification test in `team-lead.md` is the enforcement pass — it reads the member-supplied warrant and checks it against the admissibility constraint. These are two distinct operations (rule vs. enforcement check), so having them in two files is correct, not a duplication violation.

---

## Self-Examination of the Purist Lens Failure

The Purist lens failed in S5 because it applied a valid categorical principle ("stage contracts are internal-by-architecture") without asking whether the category was verified at HEAD. The lens is correctly tuned for catching category boundary violations — but that same precision creates a blind spot: claims that *fit* a clean category feel justified by the category itself, not by operational evidence.

The fix is not to weaken categorical thinking. The fix is to make the empirical question mandatory for any claim whose truth value is HEAD-testable, regardless of how clean the category feels. P1 operationalizes this: the decidability criterion is "can a command resolve it?" not "does it map to a category?" The lens is preserved; the admissibility rule adds a test the lens currently skips.

---

## Final Position

position: VALIDATE P1-P5 with P4+P5 unified under team-lead.md Synthesize as two sub-checks

rationale: P1's empirical-claim category is decidable by "is this HEAD-runnable?" not by authorial intent — KD-3 was HEAD-testable regardless of how categorical it felt, so P1 would have caught it. Single-owner assignments are clean: P1 rule in member-protocol.md, enforcement in team-lead.md Warrant test; P2 in researcher agent, referenced not restated in team-lead dispatch; P3 in team-lead Converge; P4+P5 co-located as two sub-checks in team-lead Synthesize. No rule lives in two files. Consolidator boundary is intact — P4 and P5 both land in team-lead Synthesize, not in the reducer.

blocking_risk: P1's "HEAD-runnable?" criterion could admit edge cases where a claim is plausibly verifiable but not cheaply so — a member might self-classify a grep-testable claim as categorical to avoid the demotion path; enforcement relies on team-lead verification catching the mismatch, which reintroduces judgment.

warrant: {type: evidence, source: "S5 purist-transcript.md line 67 — fabricated '(confirmed by grep)' with no corresponding result in round02/researcher-findings.md; R01 VT-2 lines 58-63 — Contracts consumers present in Logic, refuting the claim the logic warrant was meant to establish; team-lead.md:314 — Warrant test verifies type fits claim but no admissibility rule specifies which type is required for containment claims"}
