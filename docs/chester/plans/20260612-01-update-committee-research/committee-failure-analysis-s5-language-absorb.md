# Committee Failure Analysis — S5 `language-dsl-absorb`

Subject: how a false "internal-only" invariant (AC-1.11 / NG-6) survived three committee rounds when the
refuting fact was on disk after Round 01. Source artifacts:
`docs/chester/working/20260601-01-implement-storyauthoring-project/sprint-s5-language-dsl-absorb/committee/`
(rounds 01–04, ledger). Verified against committee skill at `skills/design-committee/`.

---

## 1. What happened — the evidence chain

The four load-bearing artifacts, in order:

- **Round 01 — `round01/researcher-findings.md`, VT-2 (Caller Counts).** The researcher censused inbound
  `using Story.Application.Language*` callers at file granularity and recorded, verbatim:
  - `Story.Application.Logic/DSL/Analysis/LanguageValidationBridge.cs` (2: Common + **Contracts**)
  - `Story.Application.Logic/DSL/Analysis/SpanIndexSpanProvider.cs` (1: **Contracts**)

  The fact "`Story.Application.Logic` consumes `Language.Contracts`" was therefore established and on disk
  at the close of Round 01. It was not flagged as significant because VT-2 was tasked to *resolve the
  "10 callers" count discrepancy*, not to *enumerate consumers of Contracts specifically*. The Contracts
  consumers were true sub-rows inside an aggregate the round was using for a different purpose.

- **Round 02 — `round02/purist-transcript.md`, KD-3.** The Purist introduced
  *"`Story.Application.DSL.Language.Contracts.*` is Language-internal"* as Key Decision 3. Two lines carry
  the defect:
  - Line 14: *"Language Contracts namespace confirmed … — all pipeline-internal, no Domain.Validation or
    Domain.Service usings."* The check actually performed was **outbound** (what Contracts imports), then
    reported as an **inbound** property (who imports Contracts). Different question; silent conflation.
  - Line 67: *"these are implementation contracts internal to the pipeline and have no callers outside
    Language itself **(confirmed by grep)**."* No such grep appears in the Round 02 researcher findings
    (which were re-tasked to piece-counts and ANTLR items, `round02/researcher-findings.md` C-1/C-2). The
    "confirmed by grep" attribution is **fabricated** — and the one census that *was* run, in Round 01,
    states the opposite.

  Notably, the Purist's own residual concern (line 105) **knew the claim was unproven**: it asked that the
  brief's Acceptance Criteria *"include a check that no type from `DSL.Language.Contracts.*` is consumed
  outside `DSL.Language.*` — that is the concrete test that the 'internal' claim holds."* It was routed
  forward as a *test to run later*, not as a fact already established.

- **Round 03 — spec authoring.** The "to-be-tested" verifier was promoted into the spec as **AC-1.11 /
  NG-6**, a present-tense factual invariant ("consumed only within `DSL.Language.*`"). The modal verb
  dropped silently between rounds: *"should be internal"* (R02 intent) became *"is internal"* (R03
  invariant). The test the Purist asked for was never executed; the claim was encoded as if it had been.

- **Round 04 — spec harden / attack.** The adversarial round caught it on the first pass
  (`ledger.md`, Round 04, "Load-bearing HIGH (A)"): *"'DSL.Language.Contracts internal-only' premise
  FALSE — 2 Logic production files (LanguageValidationBridge.cs:10, SpanIndexSpanProvider.cs:5+7) consume
  the public stage contracts; original AC-1.11 would fail a correct impl. Reframed."*

The attack round worked precisely because "attack" forces a verifier to reason from the opposite prior and
to touch HEAD. The contradiction was latent and sitting in `round01/` the entire time.

---

## 2. Root causes

This was **not** a researcher competence failure. The researcher found the fact in Round 01. Three
distinct, separable defects let the false invariant survive to Round 04:

- **RC-1 — Pull-only researcher.** The researcher answers the questions it is handed. Rounds 02/03 tasked
  it with counts, the ANTLR item list, the `ISourceText` ambiguity, IVT grants — never *"enumerate every
  consumer of `Language.Contracts`."* A verifier does not volunteer the unasked question. The miss is
  **upstream of the researcher**, in tasking. (Researcher charter: `agents/design-committee-researcher.md`
  — "handle information-gathering … members explicitly do not"; nothing makes a consumer census mandatory
  for relocation work.)

- **RC-2 — Empirical claim carrying a non-empirical warrant.** The committee already records a
  `warrant.type ∈ {evidence | logic | in-scope designer-premise}` on every Final Position
  (`member-protocol.md` § Final Position). KD-3 is structurally an **existence / containment claim**
  ("no consumer outside X") — only an evidence warrant can ground it. It was admitted on a **logic**
  warrant (the categorical argument "stage-pipeline contracts are private-by-nature"), dressed with a
  fabricated evidence cite. The team-lead's existing Warrant test (`team-lead.md:314`) verifies that "the
  type fits the claim" — but no rule states *which* warrant type a containment/consumer/count claim
  **requires**. That missing constraint is the central defect.

- **RC-3 — Normative→descriptive slip that consolidation cannot see.** "These *should be* internal"
  silently became "these *are* internal." In a Final Position the two read identically, and the
  Consolidator is **enumerate-only by contract** (`design-committee-consolidator.md` — "characterizes
  nothing, weights nothing") — it cannot catch a modal-verb category change, and correctly should not try.
  The claim looked like a decision, not an assertion, so it was never routed for verification.

- **RC-4 — No cross-check of new claims against accumulated evidence.** The ledger records claims and
  findings, but nothing diffs a newly introduced invariant against the prior round's researcher data. The
  Round 02 KD-3 claim was never held up against the Round 01 VT-2 census. The contradiction required a
  human-style "wait, didn't we already measure this?" step that no role owned.

The blunt lesson: **the claims that "feel obviously true" are the ones that go unverified, because
obviousness suppresses the verification question.** The most intuitive load-bearing claims are exactly the
ones that need mandatory routing to ground-truth.

---

## 3. Proposed changes — prioritized

### P1 (load-bearing) — Warrant-class rule: empirical claims require an evidence warrant

The single highest-leverage fix, because it sits at the choke point and reuses machinery that already
exists.

- **Rule.** Define a class of **empirical claims** — who-consumes-what, how-many, does-X-reference-Y,
  "no other consumers", isolation / containment / zero-consumer assertions. Any answer-body assertion in
  this class **must** carry a `warrant.type = evidence` whose `source` is a runnable command (grep/build/
  test) **plus its result**. An empirical claim carrying a `logic` or `in-scope designer-premise` warrant
  is **automatically demoted to a gap** and routed to the researcher to ground.
- **Where.** Add to `member-protocol.md` § Final Position (the schema owner) as a `warrant.type`
  admissibility constraint; enforce in the team-lead's Warrant test (`team-lead.md:314` and the Authority
  Guard at `:335`). The team-lead already verifies "type fits the claim" — this makes "fit" *defined* for
  the empirical class instead of left to judgment.
- **Why it would have caught S5.** KD-3 is an existence claim on a `logic` warrant → auto-demoted to a
  gap → routed to the researcher → consumer census re-run → the two Logic consumers surface in Round 02,
  not Round 04. The fabricated "(confirmed by grep)" would have had to become a real, cited grep — which
  returns the refutation.

### P2 — Standing consumer-census deliverable for relocation-class questions

- **Rule.** When the convening question is a **move / contain / retire / absorb** of a namespace or type
  set, Round 01 must produce a **consumer census at type and sub-namespace granularity** — "who points at
  every symbol I am relocating or claiming to contain." Namespace/csproj-level counts are insufficient:
  the S5 Round 01 census *was* run, but its coarseness let the Contracts consumers hide inside an
  aggregate.
- **Where.** Add to `agents/design-committee-researcher.md` § Responsibility Scope as a mandatory R01
  deliverable conditioned on relocation-class questions; reference it from the team-lead's Round 01
  dispatch.
- **Why.** Makes the load-bearing fact of every absorb a *standing* output rather than something that has
  to be asked for. Directly addresses RC-1.

### P3 — Baseline-the-invariant rule for acceptance criteria

- **Rule.** Any AC that asserts a zero-consumer / isolation / containment invariant must be **executed
  against HEAD at authoring time.** If "no external consumer of X" is not already green (or provably
  made-green by the planned work), the AC is **malformed** and cannot be encoded. An acceptance criterion
  is not the place to introduce an unverified factual claim — it is grep-able now.
- **Where.** Add to the spec-authoring path as a gate; surface in `team-lead.md` Converge step (step 7) so
  the verdict cannot encode an un-baselined invariant.
- **Why.** Catches RC-3 at the moment of encoding even if P1 is bypassed. AC-1.11 would have been run
  against HEAD and failed immediately.

### P4 — Flag the normative→descriptive transition explicitly

- **Rule.** When a desirable property ("should be private") is adopted as a done-bar verifier, it must be
  **re-stated and re-tested as a present-tense fact before it is encoded.** The promotion from intent to
  invariant is the verification moment; currently nothing marks it. The Purist's own line-105 residual
  ("the concrete test that the 'internal' claim holds") was exactly this signal — and it was carried
  forward as a TODO instead of executed.
- **Where.** Team-lead Synthesize step (`team-lead.md:101`, step 6): when an answer-body assertion's source
  is a *prior-round member intent* rather than a *measured fact*, mark it and route to the researcher
  before it can ride into the verdict.
- **Why.** Addresses RC-3/RC-4 at the round boundary where the modal verb slips.

### P5 (defense-in-depth) — Invariant-vs-evidence diff in the team-lead Synthesize step

- **Rule.** When a round introduces a **new** invariant/containment claim, the team-lead diffs it against
  the accumulated researcher findings in the ledger and prior round folders before converging. A new claim
  that contradicts — or is unsupported by — prior evidence is demoted to a gap and routed for grounding.
- **Where.** `team-lead.md` Synthesize (step 6) + a one-line ledger field tracking "invariants introduced
  this round" so the diff has a stable surface.
- **Why.** This is the cross-check no role owned (RC-4). It deliberately does **not** go in the
  Consolidator — that role is enumerate-only by design and must stay that way. The diff belongs where
  risk-weighted judgment already lives.

---

## 4. Recommendation

Implement **P1 first and alone if only one change ships.** It is the choke point: every empirical claim
must pass through the warrant test, and P1 makes the test *decide* the empirical class instead of leaving
it to a verifier's judgment. P2 and P3 are cheap, high-value, and independent — schedule them next. P4/P5
are the same underlying cross-check expressed at two points (round boundary and synthesis) and can be
treated as one work item.

What ties all five together: **make the most intuitive load-bearing claims mandatorily routed to
ground-truth precisely because they are intuitive** — and keep that routing in the roles that hold
judgment (member warrant, researcher tasking, team-lead synthesis), never in the enumerate-only reducer.

---

*Change log: created 2026-06-12 from S5 committee artifacts and `skills/design-committee/` review.*
