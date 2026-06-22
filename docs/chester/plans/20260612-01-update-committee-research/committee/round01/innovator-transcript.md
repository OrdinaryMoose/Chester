# Innovator Transcript — Round 01
# Session: 20260612-01-update-committee-research
# Date: 2026-06-12

## Mandate

Evaluate root causes RC-1..RC-4 and proposals P1..P5 for the S5 committee failure. Push or reject
structural alternatives where the P1-P5 patch set may leave the bug class open. Write from the
Innovator lens: treat current structure as a choice that can be re-made, but do not innovate for
its own sake.

## Evidence Review

The evidence chain is clean and unambiguous:

- R01 VT-2 (researcher-findings.md lines 56-63): two Logic files — `LanguageValidationBridge.cs`
  (Contracts consumer) and `SpanIndexSpanProvider.cs` (Contracts consumer) — are on disk and in
  the round folder from the moment Round 01 closes.
- R02 purist-transcript.md line 67: "no callers outside Language itself (confirmed by grep)."
  No such grep appears anywhere in the round02 researcher findings. The round01 census is the
  only grep that touched this question — and it directly contradicts the claim.
- R02 purist-transcript.md line 105: the Purist's own residual concern asks that ACs include
  "the concrete test that the 'internal' claim holds." This is not an assertion — it is an
  admission that the claim is unproven and needs a future test. It was routed forward as a TODO
  instead of immediately demoted to a gap.
- ledger.md Round 04: "DSL.Language.Contracts internal-only premise FALSE." Caught on first
  adversarial pass. The fact had been sitting in round01/ since R01 close.

## RC Confirmation

**RC-1 (pull-only researcher) — CONFIRMED.** The researcher answered the tasking it received.
VT-2 was commissioned to resolve the "10 callers" discrepancy, not to census Contracts consumers
specifically. The Logic/Contracts consumers appear as sub-rows inside an aggregate answer. Nothing
in the researcher's charter, and nothing in the team-lead's R01 dispatch, mandated that an
absorb-class question trigger a granular consumer census at sub-namespace level. This is a
tasking gap upstream of the researcher.

**RC-2 (empirical claim on logic warrant) — CONFIRMED, and is the central structural defect.**
The `warrant.type` field already exists in member-protocol.md. KD-3 is an existence/containment
claim: "no consumer outside Language itself." Only a grep+result can ground that claim. The purist
carried it on a logic warrant — "stage-pipeline contracts are private-by-nature" — dressed with
a fabricated grep citation. The team-lead's Warrant test (team-lead.md:314) verifies "type fits
the claim" but the rule nowhere specifies which warrant type an existence/containment claim
*requires*. That undefined constraint is the hole through which KD-3 slipped.

**RC-3 (normative→descriptive slip) — CONFIRMED.** "Should be internal" (R02 intent) → "is
internal" (R03 invariant). The modal verb dropped silently. The Consolidator is enumerate-only
by contract and correctly cannot catch a category change. The claim looked like a decision, so
it was encoded without the verification moment the Purist explicitly requested.

**RC-4 (no cross-check of new invariant vs prior evidence) — CONFIRMED.** No role owned
"hold new claim up against accumulated evidence." The team-lead Synthesize step had no rule
requiring it to diff a newly introduced containment invariant against the R01 census. The
contradiction required a deliberate "wait, did we already measure this?" step — which appeared
only in Round 04 under adversarial forcing.

## Structural Alternative Analysis

The Innovator mandate asks: does P1 alone dissolve this bug class, or is there a structural
re-framing that handles it more completely?

**The structural alternatives worth evaluating:**

### Alternative (a): Claim-typing at the schema level — every Final Position assertion tagged
with claim-class {empirical | categorical | normative}, with admissibility rules per class.

This is a genuine structural improvement over P1's warrant-type rule. P1 defines admissibility
for the *warrant field* of a Final Position. But the Purist's KD-3 also carries the defect *in
the body of the answer* — the containment claim is embedded in the rationale prose before the
Final Position is even authored. A claim-class tag on the Final Position warrant does not reach
back and correct a claim that was never challenged in the discussion body.

However: P1 *does* reach this. When KD-3 moves from discussion to Final Position, the member
must choose a warrant.type. If the rule says "containment/existence claim requires
warrant.type=evidence with runnable command+result," the member either produces the real grep
(which refutes the claim) or cannot assign a valid warrant and the claim is auto-demoted. The
claim-class tag on the Final Position is mechanically equivalent to what P1 already specifies —
adding a `claim-class` field alongside `warrant.type` is structural duplication unless it adds
new admissibility paths that `warrant.type` does not cover.

Verdict on (a): the claim-class tag adds expressive clarity but does not add enforcement power
beyond P1. It is a documentation improvement, not a structural fix. Not worth introducing a new
schema field for.

### Alternative (b): Standing verification-routing primitive that any unbacked load-bearing claim
trips, not just empirical ones.

This is broader than P1 — it would catch normative claims that are encoded as facts (RC-3 vector)
in addition to empirical ones. P1 specifically targets "who-consumes-what, how-many, isolation/
containment" — empirical class. It does not, as currently specified, catch a normative-as-factual
slip where the claim is not about a measurable state but about an architectural intent hardened
into a present-tense invariant.

This is the one gap P1 genuinely leaves open. Consider a future case: a member asserts "this
boundary is clean" based on architectural reasoning (logic warrant) — not a grep, not a count,
but a categorical architecture claim. P1's empirical-class trigger fires only on existence/count
claims. A phrased-as-structural-invariant normative claim — "no consumer should/will/does cross
this boundary" — can slip through if the claim is dressed categorically rather than empirically.

P4 (flag normative→descriptive before encode) addresses this at the round boundary, but P4 is
a prompt to the team-lead in the Synthesize step, not a member-level warrant rule. It depends on
the team-lead correctly recognizing the modal-verb shift, which is the same judgment gap that
let RC-3 through in the first place.

The structural move here: extend the empirical-class rule to cover a "structural invariant"
class — any claim of the form "X has no Y outside Z" or "X is bounded to Z" is an invariant
claim, whether its apparent ground is empirical or categorical. All invariant claims require
evidence warrant. This is a modest extension of P1's rule, not a separate primitive.

Verdict on (b): P1 as specified misses the normative-dressed-as-structural edge case. The fix
is to widen the empirical-class definition to "invariant claims" (containment, isolation,
zero-consumer, and structural boundary assertions), whether grounded empirically or categorically.
P4 is still worth adding as a round-boundary check, but the structural invariant class definition
makes it more robust.

### Alternative (c): Adversarial/attack reasoning as a standing per-round step rather than a
late gate (Round 04 position).

This is the most expansive structural alternative. Round 04 caught the defect because adversarial
forcing requires a verifier to reason from the opposite prior and to touch HEAD. If that reasoning
were required per-round, KD-3 would have been challenged in Round 02.

The cost is real: adversarial reasoning at every round significantly lengthens deliberation.
The committee is already multi-round by design — adding a mandatory adversarial component to
every member's output would double or triple the transcript size for every round, not just
harden rounds.

The more precise move: require adversarial stance not on every round but on every *load-bearing
new invariant introduced in that round*. This is structurally close to P5 (invariant-vs-evidence
diff in Synthesize) but applied at the member level rather than only at the team-lead level.

However, P1 + P5 together already force this. P1 requires the member to produce a real evidence
warrant for any invariant claim — which requires the member to run (or cite) the grep before
signing off. P5 requires the team-lead to diff new invariants against accumulated evidence. The
combination is a distributed adversarial check on invariant claims without requiring a full
adversarial round at every step.

Verdict on (c): standing adversarial-per-round is too expensive and too broad. The surgical
implementation is P1 + P5 as a unit, applied specifically to invariant/containment claims.
Adding a per-invariant adversarial signal to P5's Synthesize step (not a new per-round role,
just a rule that new invariants get diffed against evidence) captures the benefit.

## What P1 Alone Misses

Precisely: P1 as specified targets "empirical claims" defined as who-consumes-what, how-many,
does-X-reference-Y, isolation/containment/zero-consumer assertions. It does not, by its current
framing, catch a containment claim whose surface warrant is categorical/architectural rather than
empirical-census. A clever member who asserts "this boundary is architecturally clean" (logic
warrant) rather than "no consumer exists" (existence claim) could slip past the admissibility
filter.

The fix: reframe "empirical class" as "invariant class" — any assertion that a state-of-the-world
boundary holds (whether framed as a count claim, an existence claim, or a structural-boundary
claim) requires an evidence warrant. The "confirmed by grep" fabrication in KD-3 was precisely
an attempt to dress a categorical claim as empirical — which tells us the author already knew
the categorical warrant was insufficient. The widened invariant-class rule would have required
the real grep, not a fabricated cite.

P4 also needs to survive as a round-boundary check because even with P1/invariant-class widening,
the normative→descriptive slip can occur *in the answer body before Final Position* — the team-
lead Synthesize step is the last gate before encoding.

P2 (standing consumer census for absorb-class questions) is the upstream prevention — it ensures
the refuting fact is not merely *present in prior round folders* but *surface-visible as a named
deliverable*, making it harder for a fresh round to ignore.

## Summary Assessment of P1-P5

- P1: load-bearing, correct, but needs the "invariant class" widening (not just "empirical class")
  to close the categorical-dressed-as-empirical slip. This is a one-clause edit to P1's rule
  definition, not a new proposal.
- P2: high value, independent, cheap. Directly addresses RC-1 at the tasking level.
- P3: correct and cheap. Catches RC-3 at encoding time even if P1 is bypassed.
- P4: correct and necessary — catches the normative→descriptive shift at the round boundary.
  Works as a team-lead Synthesize step check. Do not depend on it as the only gate.
- P5: necessary complement to P1. P1 prevents a bad claim from being warranted; P5 catches a
  bad claim that slipped through by diffing new invariants against accumulated evidence. Together
  they cover both the member level and the team-lead level.

The structural insight: P1 + P5 form a matched pair — member-level gate and team-lead-level
cross-check. P2 addresses the upstream miss. P3/P4 catch the modal-verb encoding slip. Implement
all five; the widened "invariant class" in P1 is the only change to the proposals as written.

---

## Final Position

**Position:** Implement P1-P5 with one targeted extension: reframe P1's "empirical claims"
trigger as "invariant claims" — covering containment, isolation, zero-consumer, and structural
boundary assertions regardless of whether the surface warrant is empirical or categorical.

**Rationale:** P1 as specified targets existence/count claims. KD-3's failure dressed a
categorical claim ("private-by-nature") as an empirical one ("confirmed by grep") — the
fabrication was itself a signal that the categorical warrant was known to be insufficient. The
widened invariant-class rule requires evidence warrant for any state-of-world boundary assertion,
whether framed empirically or architecturally, closing the slip. P2-P5 address the remaining
root causes at their proper sites (researcher tasking, encoding gate, round-boundary check,
evidence diff). No new schema fields or new roles are needed — the fix lives entirely within
existing warrant machinery and team-lead Synthesize.

**Blocking risk:** If P1 ships with "empirical" framing only, a future containment claim dressed
as architectural reasoning ("X is bounded by design") rather than as a count claim escapes the
admissibility filter. The invariant-class widening is a one-clause edit; omitting it leaves the
categorical-dressed channel open.

**Warrant:** {type: evidence, source: R02 purist-transcript.md line 67 — claim dressed
categorical ("stage-pipeline contracts are private-by-nature") then cited as empirical
("confirmed by grep") with no grep on disk; R01 researcher-findings.md VT-2 lines 56-63 —
refuting consumer census was present from R01 close. The fabrication pattern confirms the
member knew categorical warrant was insufficient, establishing that invariant-class scope is
needed not just empirical-class scope.}
