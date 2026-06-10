# Design Brief — Realign Design-Committee to Answer-Delivery

## Goal

Realign the `design-committee` skill so its terminal object is the **most-informative answer to the designer's question**, not a decision menu handed back for the designer to resolve. Today the committee surfaces an option space with named tensions and stops at the fork; the designer carries the choice and all downstream work. The realignment promotes the committee from menu-presenter to advisor: each round it produces its best current answer and names the gaps that block a better one, then uses targeted decisions as an *interview instrument* to pull from the designer only the information the committee cannot derive itself. The decision is no longer the deliverable — it is the method. The answer is the deliverable. This matters because a forced menu deletes signal (it never converges) and a forced consensus deletes signal (it masks real splits); an answer that names its own gaps and its own load-bearing assumptions preserves the most information per round and lets the designer stop the moment the answer is good enough for their purpose.

## Prior Art

The current committee (v0019) is the direct input to this design. What exists and shapes the realignment:

- **Six-role structure** — team-lead (calling agent, no design opinion), four advocacy members (Conservator, Innovator, Pragmatist, Purist), researcher (facts only), designer (human, sole authority). Four members deliberate in shared space; every pair challenges every pair via direct peer-DM. This structure is kept intact.
- **Current terminal object is a decision packet** — a locked format (Summary / Information Package / Decision Package / Team-Lead Comments) with options named structurally, defenders and opposers inline, and an opinion-marked recommendation. The committee deliberately refuses to converge: the standing rule is "do NOT collapse irreducible splits when split is the finding," justified by "no organ in the apparatus holds authority to decide." The realignment keeps this format as the *decision-communication* vehicle but changes the *terminal object* it serves.
- **Standalone, disk-as-handoff mechanics** — Phase-1 bootstrap creates a `committee/` tree (no sprint), each round writes a round folder, a `ledger.md` carries compact cross-round state, ephemeral off-roster Consolidator and Scribe handle enumeration and authoring. The team-lead evicts the alignment map and verdict from context after writing them. All of this machinery is unchanged by the realignment.
- **Voice spec — `util-design-partner-role`** — supplies the Translation Gate (read-aloud, no code vocab), C1 (externalized coverage of load-bearing premises), C2 (fact-default with marked `Assumption:`/`Opinion:` departures), option-naming, and the PM litmus test. The team-lead authority guard is built entirely from C1 and C2; the realignment names a guard that the voice spec already implies but never stated for an answer-authoring role.
- **`design-grillme`** — Chester's existing interview-to-shared-understanding engine that resolves each branch of a decision tree. The realigned committee adopts grillme's *engine* (interview-to-resolution) while keeping its own *four-lens deliberation* (which generates the decision tree the interview then walks).
- **Two-round Delphi mode** — the current opt-in revision pass (feed the alignment map back, members revise) is a primitive of the new iterate-to-an-answer loop; the realignment generalizes it and adds designer-to-committee injection of missing inputs.

## Scope

**In scope:**
- The five organizing principles (P1–P5) that redefine the committee's per-round behavior and terminal object.
- The two-surface model separating the locked decision-communication packet from the free-form session artifact.
- The revised per-round loop.
- The complete team-lead authority guard (warrant test, count-is-not-a-warrant, C2 firewall, C1 audit, self-eval check, strict premise scope).
- The above-threshold gap trichotomy.

**Out of scope:**
- Implementation — editing `SKILL.md`, `team-lead.md`, or any agent file. This brief defines the target design; the build is a later step.
- **Member agent-contract changes** — members now build-and-stress-test an answer rather than preserve-a-spread; whether and how their agent prompts change is an open thread, deferred so the principles can be ratified before touching five agent files.
- **Scribe contract changes** — the scribe must now author a free-form artifact (artifact side) while the decision-communication packet stays locked; the exact split in the scribe's job is an open thread.
- **Both-sides-of-a-split question mechanic detailing** — the principle is decided (P2); its concrete shape in the decision packet is not yet drawn.
- Threshold-calibration UI/phrasing — the mechanic is decided; the exact designer-facing wording for a wave-off is left to implementation.

## Key Decisions

1. **Terminal object flips from decision to answer.** The committee's deliverable is the most-informative answer to the question; the decision-interview is demoted to an instrument for extracting designer-held information. Alternative considered: keep the decision as terminal and only iterate (my earlier "drive to 4-0" framing) — rejected because it still treats the menu as the product and forces convergence.

2. **Authority preserved by splitting value from inference.** The committee never converges on *value* (requires authority, stays with the designer); it converges on *logic given the designer's values* (requires only rigor). The committee is a value-free inference engine over designer-supplied premises. This is what makes an answer legitimate despite "no organ holds authority to decide" — no authority is seized; the answer is the designer's own values computed forward.

3. **P1 — most-informative answer + named gaps; collapse not required.** Each round produces the most-informative answer the current information supports — which may converge to a single position, may preserve a legitimate split, or may be partial — and names the gaps. A preserved split is a valid and sometimes superior answer: when forcing convergence would mask real concerns, the split with each side's rationale *is* the best answer. The team-lead chooses the answer shape that loses the least information; convergence is just the special case where the real state of the question is agreement. Alternative considered: mandatory provisional collapse-with-disclosure — rejected because a forced collapse deletes the very signal the four-lens structure exists to surface.

4. **P2 — question quality over order; questions from both sides of a split.** Triage-by-impact is not the concern; the sharpness of each question is. A split yields not one question ("pick A or B") but the pointed question each side raises against the other, pre-answered where possible ("from the minimize-ripple side the live question is X, answering it yields P; from the coherence side it is Y, yielding Q"). The designer adjudicates on substance, not bare preference. Decisions are still surfaced one at a time for clarity. This is the peer-DM cross-examination finally cashing out at the designer surface.

5. **P3 — designer determines sufficiency and directs next action.** Termination is a designer call, not committee convergence or an authorized round count. The answer need not be complete, only *sufficient for the designer's downstream use* — and only the designer knows that bar. The committee keeps improving the answer as gaps close; the designer says when to get off.

6. **P4 — two-surface model: locked decision-communication, free session artifact.** "No fixed format" applies only to the end-of-turn session artifact — there is no mandatory decision brief or locked session output; the artifact is whatever information fits the question, possibly nothing formal. The *decision-communication packet* — how the committee talks to the designer when seeking a decision — stays LOCKED in the existing decision format. What we produce at end of turn ≠ how we communicate a decision. Alternative considered (my error in an earlier round): demoting the decision-packet template to one of several formats — corrected; the template is the fixed communication vehicle, only the artifact is free.

7. **P5 — interview-to-resolution is the engine.** The committee generates the question-tree and the answer simultaneously, then walks the designer down the tree one gap at a time. Confirmed valid.

8. **Above-threshold gap trichotomy.** A tension below the designer's threshold is not a gap at all — drop it, the committee picks freely. Above threshold, the designer either resolves it (fold into next round), or chooses to preserve the split as the answer (legitimate per P1). There is no "irreducible gap the designer is indifferent to" — that category is empty by definition. A waved-off gap is not a miss; it is threshold calibration that sharpens which gaps the committee surfaces next round.

9. **Agent internals stay rigid.** Format flexibility is external-surface-only, and within that, artifact-only. Member Final Position schema, the Consolidator's enumerate-only contract, round-folder discipline, and the ledger are unchanged.

10. **Team-lead authority guard — warrant test.** The team-lead may assert in the answer body only what carries a warrant: an evidence warrant (researcher/member-cited fact), a logic warrant (entailment from facts + premises), or a designer-premise warrant (a value-judgment the designer already supplied). Anything unwarranted is a preference, forbidden as answer-content, and must be demoted to a gap. The team-lead surfaces unwarranted forks; it never resolves them.

11. **Count is not a warrant.** Alignment count never licenses collapse. A 3-1 does not collapse to the 3 if the lone dissenter holds a warranted position — that is a preserved split. Outvoting is not defeating. This protects the dissent the committee exists to surface.

12. **C2 firewall + C1 audit.** Opinion is allowed in exactly one place — the fenced, `Opinion:`-marked Recommendation block; the Information and Decision packages carry warranted assertions only. Every collapse must show its warrant in the packet (C1), so the designer can overturn a wrong inference. The team-lead may be wrong on inference but is never unaccountable.

13. **Strict premise scope, designer-only expansion.** A designer premise warrants conclusions only within the exact scope it was given — nothing adjacent or analogous. The team-lead may never widen a premise on its own; expansion requires an explicit designer act. Any question not covered by an in-scope premise is a new gap, surfaced and never inferred — silence is never a warrant. Alternative considered: reasonable-extension (carry a premise to clearly-analogous questions, flagged as an assumption) — rejected; over-extension was the one smuggle path that cites a real premise while inventing scope. Accepted cost: more re-confirmation on adjacent questions, in exchange for zero premise-creep and a monotonic warrant set the designer can audit at any round.

## Constraints

- **Voice invariants survive every format.** The Translation Gate, C1, C2, PM litmus, and option-naming hold across all artifact shapes. "No fixed format" must not become "no discipline."
- **Internal contracts stay rigid.** Member Final Position schema, Consolidator enumerate-only output, round folders, and the ledger are not modified.
- **The decision-communication packet format is unchanged** from the current locked design.
- **The designer is the sole authority** — for value, for sufficiency, for premise expansion, and for committee termination. No change.
- **Disk-as-handoff and standalone invocability are preserved** — Phase-1 bootstrap creates no sprint; every step's artifact is written before the next dispatch.
- **The team-lead holds no design opinion** outside the fenced Recommendation block — the warrant test is the operational definition of this, not a softening of it.

## Acceptance Criteria

- Each round emits an answer (single position, preserved split, or partial), not only an option menu, and every answer names its gaps.
- The team-lead asserts no unwarranted content: every sentence in the answer body carries an evidence, logic, or in-scope designer-premise warrant, or it is demoted to a gap. Verifiable by the self-eval check — name the warrant for each body sentence.
- Alignment count is never cited as justification for collapsing a split; a warranted minority position survives as a preserved split.
- Opinion appears only inside the fenced, `Opinion:`-marked Recommendation block; the Information and Decision packages are opinion-free.
- Every collapse displays its warrant in the packet (C1), and the designer can overturn it.
- No designer premise is applied beyond the exact scope it was granted without an explicit designer expansion; uncovered questions appear as new gaps.
- Tensions below the designer's threshold are not surfaced as decisions; above-threshold gaps are surfaced one at a time.
- When the committee seeks a decision it uses the locked decision-communication format; the end-of-turn session artifact carries no mandated format.
- All internal agent formats (member Final Position, Consolidator output, round folders, ledger) are unchanged from v0019.

---

## Open Threads (carried, not yet decided)

Recorded so the brief is self-contained on what remains. None block ratification of P1–P5 and the guard; each is a deliberate deferral with rationale in Scope (Out of scope).

- **Member agent contracts** — do the four advocacy agent prompts change now that members build-and-stress-test an answer rather than preserve a spread? Likely a clarification, not a rewrite, but it touches five files and should follow principle ratification.
- **Scribe contract** — the scribe authors a free-form artifact while the decision-communication packet stays locked; the exact division of its job needs drawing.
- **Both-sides-of-a-split question shape** — P2 decides the principle; the concrete decision-packet layout for paired, pre-answered questions is undrawn.
