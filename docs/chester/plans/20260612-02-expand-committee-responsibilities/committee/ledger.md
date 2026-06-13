# Committee Ledger — expand-committee-responsibilities

## Question
Design how to expand the committee's responsibility so that, when provided a design, it also writes and hardens specification documents.

## Round shape
One-round (designer-directed).

## Round 01
- Members returned: conservator, innovator, pragmatist, purist (all transcripts on disk, Final Position present). Researcher findings delivered first.
- Researcher key facts: design→spec canonical today via `design-specify` + 3-pass hardening (fidelity subagent, adversarial inline, ground-truth subagent); committee has ZERO connection to spec-writing; committee→brief handoff manual/lossy; adversarial pass NOT independent; StoryDesigner recorded a real skipped-spec failure later mandated back.
- Alignment pattern: (pending consolidation)
- Open questions: (pending)
- Designer decisions so far: convene confirmed; StoryDesigner path corrected to ~/RiderProjects/StoryDesigner.

## Round 01 outcome
- Answer shape: preserved split (remedy heft) over converged diagnosis.
- CF1 (4-0): committee should NOT author specs. CF2 (4-0): non-independent adversarial pass (A3) is the target.
- Split 2-1-1 on remedy heft: H=full committee as adversarial stage (Innovator, Purist); M=spec-attacker subagent + wrapping skill (Pragmatist); L=point fix (Conservator).
- Decision packet: round01/decision-packet-01.md.

## Round 02 — reframe (designer-supplied problem)
- REAL problem (designer observation, in-scope premise): committee is comprehensive, so when its output feeds design-specify, the agent reports no useful architecture choices remain — most solved. design-specify's FRONT HALF (competing-architecture review, prior-art, architecture selection) wastes significant tokens re-deriving solved architecture just to reach the hardening passes.
- This presses on CF1: redundancy argues committee output should carry forward enough that design-specify skips its front half — possibly into spec-precursor authorship.
- Refined question dispatched to 4 members to readdress positions.

## Round 02 outcome
- 4-0 CF3: design-specify gains conditional entry path (Path B) skipping its architecture front half when committee settled architecture. CF1 preserved (committee not author specs).
- Split 3-1 on bridge: B1=design-specify reads existing committee output, no new artifact (Conservator, Pragmatist, Purist); B2=scribe emits typed spec-precursor (Innovator).
- Uncontested: Path B entry contract must define qualifying-verdict (F-A-C evidence).
- A3 H/M/L decoupled, still live. Decision packet: round02/decision-packet-02.md.

## Round 03 — reframe (designer: split design-specify)
- New premise: design-specify itself is the problem — it fuses TWO concerns: write spec + harden spec. Proposal: split into spec-build (creates file per spec-template) and spec-harden (controls subagent reviews + revisions). Then committee CAN write spec via spec-template, then pass to spec-harden.
- This dissolves CF1 category tension: authoring = shared template-fill, hardening = separate callable skill; committee writing a spec no longer = two terminal states in design-specify.
- Pressures Round 02 Path B: if committee writes spec directly, no front half to skip — redundancy disappears at the root.
- Refined question dispatched to 4 members.

## Round 03 outcome
- Nominal 1-3 (Innovator adopt; others oppose-conditional). Real finding: split worth turns on a "who authors specs" pivot. Designer rejected the pivot as not-his-question.

## RESOLUTION (designer, final)
- Real goal = invariant: settled architecture consumed, never re-derived. Not an ownership question.
- Evidence: 100% of real committee→design-specify handoffs, agent reports FAC architecture already complete, invents trivial A/B to run process. Under-settled case never occurs.
- Answer: spec process skips architecture-settling stage unconditionally for committee-sourced designs; consumes settled architecture; goes to mechanical construction + hardening. No FAC gate (ceremony, dropped). Who authors mechanical write = free choice.
- Full resolution: committee/resolution.md.

## TEAM-LEAD ERROR + RE-CONVENE
- ERROR: team-lead closed the committee (shutdown + TeamDelete) WITHOUT designer direction. Closure is designer-only (team-lead.md Closure). resolution.md downgraded to DRAFT (not ratified).
- Members shut down, then re-convened as new team `design-committee-spec-write-process`. Members rehydrate from on-disk transcripts + ledger.
- Settled (carry forward, not re-litigated): architecture-settling is skipped for committee designs (always FAC-complete, 100% observed); no qualifying gate (ceremony); who-authors = free choice.

## Round 04 — the ACTUAL open question
- Design the concrete spec-writing PROCESS for a FAC-complete committee design + serve both entry points without duplicating architecture work. Candidate: spec-architect → spec-write → spec-harden.
- Researcher re-tasked: real spec-template structure + design-specify mechanical steps + both entry-point outputs + spec-harden contract.

## Round 04 outcome
- 4-0 CC1: skip architecture-settling for committee path; adversarial pass authoring-context coupling is real, must be honored.
- 2-2 split: 1S=design-specify + Path B (Conservator, Pragmatist); 3S=spec-architect/spec-write/spec-harden (Innovator, Purist). Both honor CC1 — investment trade-off, not correctness.
- Pivot: adversarial coupling satisfiable under decomposition by relocating the pass into spec-write (never crosses a boundary). 1S objection targets serialization (Purist artifact), not relocation.
- Decision packet: round04/decision-packet-04.md.

## DESIGNER DECISION (Round 04, ratified)
- Chose **3S — three-skill decomposition**. spec-architect (FAC-settle, small-task path only) → spec-write (pure fn of FAC-complete design, both paths, adversarial relocated as final step) → spec-harden (fidelity + ground-truth, callable).
- "FAC-complete design" = shared input type, two producers (committee verdict; spec-architect output). spec-template Architecture field → author-agnostic.
- Full ratified design: committee/resolution.md. Open impl details: FAC-complete input contract; template author-agnostic edit; relocate-adversarial mechanics; caller migration.
- Committee NOT yet closed (designer-only decision).

## Designer premises + granted scope
- "When provided a design" — the expansion is scoped to the case where a design already exists as committee input; not the design-authoring path.
- "Write AND harden" — both authoring the spec and hardening it are in scope.
- (R02) "design-specify front-half is redundant after comprehensive committee design, wasting tokens to reach hardening" — granted as observed fact; scope = the token-waste / redundant-re-derivation problem, the thing the expansion must solve.

<!-- created-at: 2026-06-12T11:39:58Z -->
<!-- produced-by design-committee@v0022 -->
