# Alignment Map — round 01

Question: Are RC-1..RC-4 correct, and what is the right fix design (P1 load-bearing; P2-P5)?

## Answer shape

PARTIAL + one warranted collapse + one preserved split.
- Root causes: CONVERGED (confirmed as fact, researcher-verified).
- P1 (+ trigger refinement), P2, P3: CONVERGED.
- P4 / P5 depth: PRESERVED SPLIT (cost vs defense-in-depth — designer value-judgment).

## Root causes — CONVERGED (confirmed)

All four RCs confirmed against ground truth.
- Warrant: **evidence** — researcher-findings.md round01, six verification targets resolved with file:line. R01 VT-2 named `LanguageValidationBridge.cs` + `SpanIndexSpanProvider.cs` consuming Language.Contracts on disk before R02; R02 purist line 67 "(confirmed by grep)" had no backing grep in R02 researcher-findings; R04 ledger records "internal-only premise FALSE … Reframed."

## Fix design

### P1 — warrant-class rule — CONVERGED 4-0 (load-bearing)
- Position: a named class of load-bearing claims is inadmissible on a `logic` or `in-scope designer-premise` warrant; such a claim auto-demotes to a gap routed to the researcher to ground with evidence.
- Warrant: **evidence** (the S5 failure trace — the exact claim that escaped) + **logic** (all four members; the admissibility constraint is what the existing warrant test lacks).
- Conservator framing (verbatim): "P1 adds is a defined admissibility constraint: for a named class of claims (containment / consumer / existence / 'no callers outside X'), `logic` and `in-scope designer-premise` are inadmissible — the claim auto-demotes to a gap routed to researcher."

### P1 trigger refinement — WARRANTED COLLAPSE (toward HEAD-decidability)
- The trigger should key on whether the claim is **decidable by a command against HEAD**, not on the member's self-declared "empirical" label.
- Warrant: **logic** — Innovator demonstrated the escape (Innovator, verbatim): "If P1 ships with 'empirical' framing only, a future containment claim dressed as architectural reasoning ('X is bounded by design') rather than as a count claim escapes the admissibility filter." Purist supplied the decision test (verbatim): "The line is — can you run a command against HEAD that confirms or refutes it?"
- This warrant defeats the bare-"empirical" framing → collapse adopted, warrant displayed. KD-3 is the case in point: it read as categorical but was HEAD-decidable (a grep), so the decidability trigger catches it where a warrant-type-label trigger would not.

### P2 — standing consumer census (R01 deliverable, type+sub-namespace) — CONVERGED
- 3 endorse (Conservator, Innovator, Pragmatist); Purist qualifies (no objection; wants clean single-owner placement in the researcher agent file).
- Warrant: **evidence** (researcher confirmed the researcher is currently pull-only with no standing relocation-class deliverable) + **logic**.

### P3 — baseline-the-invariant (containment AC run vs HEAD at authoring) — CONVERGED 4-0
- Warrant: **logic** (an AC asserting a zero-consumer/containment invariant is grep-able at authoring; un-baselined → malformed).

### P4 / P5 — PRESERVED SPLIT (depth / cost)
- P4 (flag normative→descriptive before encode) and P5 (invariant-vs-evidence diff in Synthesize).
- **Minimal-sufficient side** (Pragmatist; Conservator partial): P4 and P5 are substantially **redundant with P1+P2** once those ship; P5 is the highest per-round runtime cost. Pragmatist (verbatim): "P5 is substantially redundant with P1+P2 and adds the highest per-round runtime cost. Skip." Defer P4.
- **Defense-in-depth side** (Innovator, Purist): keep P4/P5 as a distinct round-boundary cross-check that catches the slip even if P1 is bypassed; Purist would **unify P4+P5 as two co-located sub-checks under team-lead.md Synthesize** (single owner), not two separate rules.
- This is a cost-vs-coverage **value judgment** → route to designer. No warrant defeats the other side; both are warranted (logic).

### Single-owner placement (Purist, logic warrant) — folds into whichever proposals ship
- P1 schema/admissibility → `member-protocol.md` § Final Position (owns warrant schema) + `team-lead.md` Warrant test (owns verification).
- P2 → `agents/design-committee-researcher.md` Responsibility Scope.
- P3 → spec-authoring path + `team-lead.md` Converge.
- P4+P5 (if shipped) → unified under `team-lead.md` Synthesize as co-located sub-checks; must NOT touch the enumerate-only consolidator.

## Positions discarded
- Innovator's broader "invariant class" widening of P1 is **subsumed** by the HEAD-decidability trigger refinement (same coverage, cleaner test) — not discarded on count, discarded because the decidability test achieves its goal with a decidable boundary.
