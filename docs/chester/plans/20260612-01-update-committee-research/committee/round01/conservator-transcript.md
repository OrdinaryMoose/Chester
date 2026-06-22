# Conservator Transcript — Round 01
# Committee: design-committee-update-committee-research
# Date: 2026-06-12

## Mandate

Confirm or refute four root causes (RC-1..RC-4) and deliberate on five fix proposals (P1..P5), with P1 load-bearing. Lens: defend existing structure. Read HEAD warrant contract before claiming it does or doesn't cover the bug.

## HEAD Warrant Contract — What It Actually Says

**member-protocol.md § Final Position** (warrant field, lines 100–104):

> `warrant` — the ground under the member's load-bearing claim, in two parts: a `type` (one of `evidence | logic | in-scope designer-premise`) and a `source` (the citation for `evidence`, the inference step for `logic`, or the designer statement that granted the premise for `in-scope designer-premise`).

**team-lead.md:314 (Warrant test)**:

> Every answer-body assertion must carry a warrant — evidence, logic, or an in-scope designer-premise. The warrant is **supplied by the member** in its `## Final Position`; the team-lead **verifies** it — the type fits the claim and the source is traceable — rather than originating it.

**team-lead.md:335 (Self-eval Authority Guard)**:

> Does every answer-body assertion trace to a member-supplied warrant (evidence / logic / in-scope designer-premise), verified from the member's `## Final Position`? Any assertion lacking a verifiable member-supplied warrant → demote it to a gap.

What the existing contract does: the member declares a `type`; the team-lead checks that "the type fits the claim and the source is traceable." It does NOT define which claim categories *require* which warrant types. The "fit" check is a judgment call on the verifier. That is the gap.

---

## RC-1 — Pull-only researcher

**CONFIRMED.** The researcher in Round 01 found the Contracts consumers (VT-2: LanguageValidationBridge.cs, SpanIndexSpanProvider.cs both carry `using Language.Contracts`). It was not flagged because it was a sub-row inside the "10 callers" discrepancy that VT-2 was tasked to resolve, not an independent "enumerate all Contracts consumers" question. The researcher answered exactly what it was asked. No skill text requires the researcher to volunteer the unasked question — researcher charter says "handle information-gathering … members explicitly do not"; that is scope description, not a proactive-census mandate.

This is a real gap, but it is upstream: it is a tasking gap, not a researcher competence gap. The researcher cannot be blamed for not answering a question that was never posed. RC-1 is real.

---

## RC-2 — Empirical claim on non-empirical warrant

**CONFIRMED and this is the central defect.** Reading HEAD confirms the gap precisely:

The member-protocol schema has `warrant.type ∈ {evidence | logic | in-scope designer-premise}` and the team-lead Warrant test says "the type fits the claim." But "fit" is left to judgment. There is no rule stating that a containment/consumer/existence claim ("no callers outside X") *requires* `evidence` — the type. A member is free to supply `logic` as warrant type for "these are stage-pipeline internals by nature" and the team-lead has no contract text to reject it. That is exactly what the Purist did at KD-3: the actual warrant was a categorical inference ("stage contracts are private-by-nature"), not a run-and-report grep. The team-lead had nothing in the current Warrant test to flag "logic is the wrong type for this class of claim."

The fabricated "(confirmed by grep)" in line 67 of the purist transcript is a separate issue: it is a false `source` citation. The Warrant test does check "source is traceable" — a fabricated grep citation would fail that check if pursued. But in Round 02 there was no researcher-findings.md containing this grep, so traceability was vacuously satisfied by the member's own statement. The existing contract requires traceable source but does not require that sources for containment claims be *runnable and run*. RC-2 is real and is the load-bearing defect.

---

## RC-3 — Normative→descriptive slip

**CONFIRMED, but it is a downstream consequence of RC-2.** The Purist's R02 line 105 explicitly framed the claim as a future verifier: "the concrete test that the 'internal' claim holds." That intent became a present-tense invariant in AC-1.11. The Consolidator is enumerate-only by contract and correctly should not catch modal category changes. RC-3 is real, but it is enabled by RC-2 — if the logic warrant for an existence claim had been auto-rejected in R02, the claim would never have reached the spec as a settled fact. RC-3 without RC-2 cannot happen; RC-3 is a symptom, not an independent root.

---

## RC-4 — No cross-check of new invariant vs prior evidence

**CONFIRMED.** Nothing in the current skill mandates that a newly introduced invariant be diffed against prior-round researcher findings. The Round 01 VT-2 fact (LanguageValidationBridge.cs consumes Language.Contracts) was on disk and contradicted the R02 KD-3 invariant directly. No role had the job of running that diff. RC-4 is real.

However, RC-4 is also a downstream consequence: if RC-2 were fixed and KD-3 auto-demoted to a gap routed to researcher, the researcher would re-run the census in R02 and surface the contradiction from its own findings. RC-4 as an independent mechanism only matters if RC-2 is not fixed. That said, defense-in-depth has value.

---

## Deliberation on Proposals

### P1 — Warrant-class rule: empirical claims require evidence warrant

**Support, with important scope clarification.** P1 is NOT net-new machinery. The warrant schema already exists (`member-protocol.md § Final Position`). The team-lead Warrant test already exists (`:314`, `:335`). What P1 adds is a defined admissibility constraint: for a named class of claims (containment / consumer / existence / "no callers outside X"), `logic` and `in-scope designer-premise` are inadmissible — the claim auto-demotes to a gap routed to researcher.

This is a tightened enforcement rule, not a new mechanism. The two files that need editing are exactly the two that already own this space:
- `member-protocol.md § Final Position` — add the admissibility constraint to the `warrant.type` description.
- `team-lead.md:314` Warrant test — add: "if the claim is an existence / containment / consumer-count assertion, a `logic` or `in-scope designer-premise` warrant type is not admissible; demote to gap."

The team-lead Self-eval Authority Guard at `:335` already runs "does every assertion trace to a verifiable member warrant?" — adding admissibility-by-claim-class to `:314` makes `:335` automatically catch the failure mode.

**Size of change:** two sentences added to two existing sections. No new artifact, no new role, no new protocol step.

### P2 — Standing consumer-census deliverable for relocation-class questions

**Useful but less load-bearing than it appears, given P1.** If P1 is in place, a Purist claiming "no callers outside X" without an evidence warrant auto-demotes the claim to a gap — the researcher gets explicitly tasked with the census that P2 would have made standing. The main value of P2 independent of P1 is proactive: it moves the census to R01 for relocation-class questions so the fact is available before members write positions, rather than pulled in on demand. That is a real efficiency gain. But if P1 is shipped without P2, the committee still closes the bug — it just takes one more researcher dispatch.

P2 is a **worthwhile addition to the researcher agent scope** — low editorial cost, direct address to RC-1. I support it as a complement to P1, not a substitute.

### P3 — Baseline-the-invariant at spec authoring

**Additive value, independent of P1.** P3 applies at the spec-authoring gate: an AC asserting "no external consumer of X" must be executed against HEAD before it can be encoded. This is a different failure surface than P1 — P3 catches the normative→descriptive slip even if P1 was not triggered (e.g., the invariant was marked `evidence` with a fabricated cite that the team-lead accepted on nominal traceability). P3 is the last-chance catch. It is also cheap: the spec-authoring step already has a HEAD-verify discipline implied by the team-lead Converge gate. Formalizing the baseline-the-invariant constraint adds one sentence. I support P3 as a belt-alongside-suspenders addition.

### P4 — Flag normative→descriptive transition explicitly

**Mostly redundant given P1, but with a residual value.** P4 targets the modal verb slip at the round boundary — "should be" adopted as intent becoming "is" encoded as fact. If P1 auto-demotes the existence claim to a gap in the round where it is introduced, P4's trigger (intent promoted to invariant) never reaches the synthesize step without grounding. The residual value of P4 is for claims that are *not* in the empirical class but still slip from intent to fact — normative design preferences encoded as invariants. That is a real failure mode but not what happened in S5. As written, P4 is partially subsumed by P1 for the S5 class of failures. It may have value in a broader context. I do not block P4 but would defer it: ship P1+P2+P3 first, then assess whether P4 covers a remaining gap. Implementing P4 now adds wording to the team-lead Synthesize step without a confirmed need.

### P5 — Invariant-vs-evidence diff in team-lead Synthesize step

**Valuable defense-in-depth, moderate cost.** P5 makes the team-lead explicitly diff new invariants against accumulated ledger and prior-round findings before converging. The S5 failure required a human-style "wait, didn't we already measure this?" step that no role owned (RC-4). P5 assigns that ownership to the team-lead at Synthesize. Cost: one step added to the team-lead protocol, one ledger field ("invariants introduced this round"). The Consolidator correctly stays enumerate-only — P5 does not touch that boundary. I support P5 as defense-in-depth with two conditions:
1. The diff is constrained to claims in the empirical class (same class P1 defines) — not a general "compare all assertions."
2. The ledger field is minimal: a one-line list of new invariants, not a structured schema addition.

Given those constraints, P5 is the natural RC-4 fix and is worth shipping alongside P1.

---

## Summary — Conservator Position

The existing warrant schema is nearly sufficient. The bug is that "fit" in the Warrant test was undefined for existence/containment claims. P1 fixes that by naming the class and declaring which warrant types are inadmissible for it. Everything else is either auto-resolved by P1 (RC-3, RC-4) or additive value (P2, P3, P5). The correct outcome is P1 (load-bearing, two sentences) plus P2 and P3 (cheap, high-value complements) plus P5 (defense-in-depth for RC-4). P4 is subsumed by P1 for the S5 class; defer.

---

## Final Position

**Position:** Support P1 as load-bearing tightening of the existing warrant contract; add P2, P3, P5 as complements. Defer P4.

**Rationale:** The Warrant test at team-lead.md:314 already requires "type fits the claim and source is traceable" — but "fit" was undefined for existence/containment claims. P1 makes it defined: empirical class (consumer/containment/existence) requires `evidence`; `logic` or `in-scope designer-premise` auto-demotes to gap. No new mechanism; two sentences added to existing sections. P2 moves the census to R01 for relocation-class questions. P3 gates spec-encoding of containment ACs behind HEAD execution. P5 assigns RC-4 cross-check to team-lead Synthesize. P4 is partially subsumed by P1 for the S5 failure class.

**Blocking risk:** Over-building. If P4 is added, the team-lead Synthesize step accumulates multiple overlapping checks for the same RC-3 failure mode. Risk of protocol bloat that makes compliance impractical, not tighter.

**Warrant:** {type: evidence, source: team-lead.md:314 and :335 — current text does not define admissibility constraints by claim class; member-protocol.md § Final Position — warrant.type description lists the three types without specifying which are admissible for which claim categories; purist-transcript.md lines 59–67 — KD-3 carries logic warrant for a containment claim with fabricated evidence source; no existing rule blocked this.}
