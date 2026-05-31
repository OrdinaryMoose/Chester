# Committee Analysis — per-task execution topology in execute-write (DI-1)
# File: committee-analysis-per-task-topology.md dtd 2026-05-31
# Master: (none) · Sub-sprint: 20260531-02-fix-write-task-topology

## Round Overview

One round, one-round-format, terse. Standalone committee to FULLY EXAMINE the design
considerations of DI-1 — making execution topology per-task in `execute-write` (some tasks
inline, some isolated subagent, within one plan), instead of the current whole-plan
`Execution mode` binary. Deferred from the update-execute-write sprint as "the real unlock,
but an executor rebuild." Five subagents: four advocacy + Researcher. HEAD 05ec629.

**Question (scope: examine the design considerations; not a commit-to-build):** Should
execute-write support per-task execution topology, and if so what is the design — examining
justification, architecture, locus, the independence-floor tension, Section 4, composition
with the v0006 depth gate, and alternatives?

**Poles (reporting lens):**
- Reject / defer — whole-plan binary already paid; v0006 harvested the cost (Conservator, Pragmatist).
- Reject on category — escalate-up relocates the floor breach (Purist).
- Build, reframed — decouple execution-locus from review-presence (Innovator).
- Researcher — facts only.

## Initial Deliberation

### Researcher — grounding findings (verbatim, abridged; DECISIVE marked)

- **Blast radius ~40% of the skill's executable body.** Mode is read ONCE from the plan header (§1.4) and routes the whole plan to §2 (subagent) OR §3 (inline) — two DISJOINT per-task loops with different contracts. Per-task topology requires: rewrite §1.4 (header-once → per-task read), MERGE §2.1 + §3.1 into one loop branching per task (the largest change), and ADD per-task BASE/HEAD SHA capture to the inline branch (§3 captures none today). §1.1 setup, TodoWrite, and §4 are unaffected.
- **§4 composes cleanly — DECISIVE.** Section 4 reads the raw `BASE..HEAD` range and is topology-agnostic by construction; a mixed run needs no change to it. It is the one section that survives untouched.
- **Per-task signals already exist; threat-risk does NOT — DECISIVE.** decision-budget, file-count, and Type are computed per task then AND-collapsed to one verdict (plan-build L243-257). But the threat report yields ONE plan-wide risk verdict; it does not decompose per task. A per-task topology rule cannot use per-task risk.
- **Inline tasks get NO per-task review today — DECISIVE.** §3.1 has no reviewer steps; the spec floor (§2.1 L122, non-dialable) and quality gate (L130-138) live INSIDE §2 only. An inline plan's only review is §4, the final whole-range pass. (Confirms Innovator's premise; also a latent hole independent of DI-1.)
- **T4 binding constraint — DECISIVE.** The depth gate, spec floor, and cross-layer carve-out ("ALWAYS runs", L138) are bound to the subagent arm. A cross-layer task routed INLINE silently bypasses the carve-out — the exact integration check it exists to guarantee.
- **Prior-art DECISIVE ANALOGY (T6).** CI/CD shared-runner-next-to-privileged-job: the hazard is not isolation per se but a SHARED unit adjacent to one that needed isolation (it can contaminate/harvest). Maps directly to an inline task adjacent to subagent tasks in one run. Risk-scaled isolation and hybrid per-task orchestration (RHAPSODY) are established patterns; the named failure mode of mixing is the shared arm as weak link.
- **Migration.** A per-task topology field slots into the task block; two-level resolution (task overrides header, header-missing → subagent safe default) is backward-compatible. But execute-write would read the task block for mode for the FIRST time — new coupling.

Synthesis (facts): per-task topology is a structural loop-merge, not a config knob (~40% of the skill); §4 composes cleanly; per-task signals exist except risk; the binding constraint is T4 — inline-routed tasks bypass the spec floor + cross-layer carve-out, and T6 names that as the shared-runner-adjacency hazard.

### Conservator — position (verbatim, abridged): reject/defer; v0006 already solves the cost; escalate-up ≠ floor-restoration

Whole-plan binary already paid — one read, one route, tiny surface; simplicity is load-bearing because wrong-isolation is a SILENT failure (fork-policy L44), and per-task multiplies silent-failure sites by N. The crux: escalate-up resolves the WRONG breach — it mitigates sprawl that becomes VISIBLE after implement, but a quiet inline task that never sprawls gets ZERO independent review and ships spec drift (the unrecoverable class). Section 4 is the COMBINATION net, not a per-task spec-fidelity net; making it the sole inline review deletes the non-dialable spec floor by the back door. Composition with v0006 is incoherent: inline tasks have no dispatch, so the depth gate has nothing to gate — DI-1 inline VOIDS v0006 for those tasks ("a depth gate with holes"). YAGNI: the want ("don't pay full subagent cost on trivial tasks") is ALREADY delivered by v0006's skip gate (subagent plan + auto-skip quality on trivial same-layer edits). Preferred: alt-7 force-isolated-review — keep all tasks subagent (presence=1 everywhere), let the plan mark a task "force full review" (escalate DEPTH up, not topology down). Zero floor risk, zero rebuild.

### Innovator — position (verbatim, abridged): build, reframed — decouple execution-locus from review-presence

Revises its own round-2 escalate-up framing. The floor objection rests on a false inherited premise: it assumes inline tasks currently HAVE a spec floor — they do not (§3 dispatches zero reviewers). So today's whole-plan-inline ALREADY emits presence=0 for every task; DI-1 does not introduce a presence=0 class, it makes the existing all-or-nothing presence=0 SELECTABLE per task — STRICTLY MORE floor-protective than the binary (today one failed condition drops the floor for the whole plan; per-task drops it only for tasks that individually clear all four conditions). Withdraws "escalate-up resolves the breach" (it is a runtime ratchet, a secondary net, not the floor-authority answer). The real architecture: DECOUPLE execution-locus from review-presence — an inline-EXECUTED task can STILL dispatch the spec reviewer (+ quality gate) on its diff; the reviewer reads a diff and doesn't care who produced it. That strictly dominates today's inline. Plan emits per-task topology (stop collapsing condition 4). §4 untouched. Phased seam: Phase 1 = inline tasks gain the per-task spec reviewer (kills the floor objection, no dispatcher merge); Phase 2 = merge the loops. Flags: inline gets MORE expensive (gains reviewer dispatches); main risk is commit-state coherence, not floor.

### Pragmatist — position (verbatim, abridged): do-nothing, with a trigger; the value scissors

Standing YAGNI dissent unmoved. The quiet killer (item 4): escalate-up is SAFE (adds isolation only) but therefore CANNOT deliver the ROI (peeling trivial tasks DOWN to inline) — the value requires the plan to set presence=0 per trivial task, the very floor breach. The safe mechanism is not the value mechanism. Item 6: v0006 already ate the lunch — with the spec reviewer a non-dialable floor and the implementer auto-forking under cache, DI-1's residual saving is "run a trivial task's implementer inline vs as a cache-cheap subagent" = a token rounding error. Architecture (item 2): two mutually-exclusive procedures collapsed into one per-task dispatcher = a rewrite of the skill's spine, plus mixed-run SHA/commit reconciliation and a unified failure-escalation story, plus plan-build emitting a vector not a scalar = a SECOND skill rebuilt + every archived plan migrated. Alternatives ranked: (a) do-nothing [recommend]; (b) split into two plans (mixing at the plan-composition layer, reuses the binary twice — cheapest mixing); (c) per-task force-isolated-review flag (additive, honors floor); (d) clustering [skip]. DI-1-full ranks LAST. Trigger to revisit: ≥3 real sprints where plan-build forced subagent solely because one task tripped one condition AND the operator wished the others ran inline — then build (c), not the rebuild.

### Purist — position (verbatim, abridged): reject on category — escalate-up relocates the breach

The real floor = whole-plan-SUBAGENT (presence=1 unconditional), which is why it is the safe default. "Escalate UP only" is an EQUIVOCATION: it measures "up" against the per-task baseline the plan already set, not against the real floor; per-task-inline drops specific tasks BELOW whole-plan-subagent, so the plan IS removing isolation that would otherwise hold. Calling it a floor renames the breach. Round-2 category holds verbatim: plan setting a task inline = forecasting presence=0 per task = "may forecast LEVEL, may NOT forecast PRESENCE per task." Mechanically escalate-up is likely INERT for the same task — once a task ran inline the implementer framing is already in the parent; isolating the review after cannot restore independence (the parent IS the implementer). Architecture BLURS: inline tasks contaminate the shared parent that the isolated tasks' reviewers also run under — independence stops being a property of the RUN and leaks across tasks. §4 retyped as spec-floor = category-unsound (it is the cross-task net, the complement of per-task spec-fidelity). v0006: removing the isolation substrate for inline tasks puts the depth dial on a non-independent implementer → topology and depth collapse into one coupled knob (re-fusing what round-2 separated). Admissible alternatives: (a) push the existing per-task depth dial harder; (b) plan emits a per-task COST HINT feeding the DEPTH gate only, never the PRESENCE substrate; (c) if topology truly wanted — floor = whole-plan-subagent UNCONDITIONAL, plan only MARKS inline-CANDIDATES, execute decides at runtime with the real floor intact (presence stays runtime-owned).

### Member follow-ups

- **Conservator → Purist:** the category question (is per-task inline a presence forecast) — Purist confirmed yes, and sharpened it: the breach is relocated, not dissolved, by redefining the floor downward.
- **Innovator → Researcher:** does inline mode dispatch a per-task spec reviewer today? Researcher: NO — §3.1 has zero reviewer steps; confirmed Innovator's premise that inline is already floorless.
- **Pragmatist → Researcher:** the justifying frequency fact (a real plan that wanted mixing). Researcher: no telemetry exists; no logged instance — the trigger Pragmatist named has no data either way.
- **Purist → Researcher:** is escalate-up mechanically able to restore independence on the same task? Researcher facts (T3/T6) support Purist: the shared (inline) unit contaminates adjacent isolated work; independence is a property of the run, and a post-hoc reviewer reads a diff the parent authored.
- **Convergence observed:** three of four (Conservator, Pragmatist, Purist) reject the full dispatcher rebuild and independently land on the SAME additive shape — keep whole-plan-subagent as the real unconditional floor; let the plan only MARK tasks (force-isolated / inline-candidate) with PRESENCE owned at runtime, never plan-forced down. Innovator dissents toward the rebuild but its reframe surfaced a real latent hole.

- **Post-submission convergence (mid-round, mechanically grounded — load-bearing).** Purist + Researcher bifurcated "isolation" into two mechanisms that map 1:1 onto round-2's two axes, with OPPOSITE verdicts:
  - **Review-independence** = the spec/quality reviewers read the committed DIFF cold (named, never-fork, handed BASE..HEAD). Execute can ALWAYS add them post-hoc to any task, inline or not — they never touch the contaminated parent. This is the round-2 LEVEL axis; the plan MAY forecast it; it was never floor-protected. Escalate-up is REAL and trivial here.
  - **Implementer-isolation** = the subagent-vs-inline SUBSTRATE. Inline = the parent IS the implementer (no dispatch, §3.1); framing lands in the parent IRREVERSIBLY. Spawn-type is decided BEFORE the implementer runs (fork-policy #5); there is NO mid-task re-isolation primitive. This is the round-2 PRESENCE axis; floor-protected; the plan may NOT forecast. Escalate-up is a FICTION within-task here — it can only ever apply to the NEXT task.
  - **The nail:** DI-1 is by its own text the TOPOLOGY axis = subagent-vs-inline = the IMPLEMENTER mechanism = PRESENCE. So DI-1 lands on exactly the axis where escalate-up cannot repair the current task. Escalate-up therefore RELOCATES the breach ("this task already ran contaminated; the floor can only hold from the next task forward"), it does not dissolve it — confirmed mechanically, not just by category.
  - **The trap to name for the designer:** DI-1 LOOKS like it dissolves the breach if anyone reasons about the REVIEW mechanism (where escalate-up genuinely is real and trivial — just dispatch the cold reviewer). That equivocation is the danger: DI-1 smuggles the review-mechanism's coherence onto the presence-mechanism's breach. The load-bearing question is "does DI-1's floor mean review-independence or implementer-isolation?" — and DI-1's own text answers "implementer."
  - **Conservator's grounding of why it's a violation, not a risk:** the presence property is floor-protected BECAUSE its failure is undetectable (fork-policy L44 — wrong isolation is silent, no test catches it). Risk implies a detector could exist; here none can. DI-1 silently converts an ENFORCEMENT property into a CONFIGURATION property — the conversion IS the violation.
  - **Refinement to the additive alternative (now mechanically validated as the only legal door):** the plan MARK must be ADVISORY-ONLY — a review-LEVEL recommendation the runtime is free to ignore with no obligation to explain — and must target the REVIEW axis (which the plan may always touch), NOT a presence/routing setting. If the runtime "must honor it unless sprawl," it silently becomes binding = config laundering, and the breach returns. Advisory metadata, not a routing field → no header-schema change, contract surface stays tiny. Presence stays enforced at runtime where the spawn decision actually lives (fork-policy #5).

### Team Lead

**Convergence (stable, proven).**
- The full per-task-topology dispatcher rebuild is rejected/deferred 3-1 (Conservator, Pragmatist, Purist; Innovator dissents toward a phased build).
- The cost the rebuild chases is largely ALREADY captured by v0006's per-task quality-skip gate; the residual (implementer locus) is a near-rounding-error under fork-mode caching — 4-aligned on the fact, the researcher confirms it.
- Independence-presence is owned at runtime and floored at whole-plan-subagent; a plan that forces a task inline forecasts presence=0 for it — the round-2 category rule still binds. Escalate-up does not restore that; it only ever adds isolation, and likely cannot repair the same task post-hoc.
- §4 composes cleanly with any topology; the binding hazard is T4 — inline routing bypasses the spec floor and the cross-layer carve-out — and T6 names it as the shared-runner-adjacency failure mode.

**Alignment.**
- Reject the rebuild: Conservator, Pragmatist, Purist (3). Build (phased): Innovator (1).
- The convergent ALTERNATIVE — an additive "force-isolated-review / inline-candidate" mark with presence runtime-owned and the whole-plan-subagent floor intact — is shared by Conservator (alt-7), Pragmatist (c), and Purist (c). This is the live constructive proposal, not the rebuild.
- A genuinely separate finding, surfaced by Innovator and confirmed by the researcher: inline mode today gives tasks NO per-task spec floor — a latent hole orthogonal to DI-1's fate.

**Observations.** DI-1's value proposition is squeezed from three sides: v0006 already harvested the per-task cost saving; the spec reviewer is a non-dialable floor (so the only remaining saving is the cheap implementer locus); and the mechanism that is safe (escalate-up, add-only) is not the mechanism that delivers value (peel-down, presence=0). Innovator's "decouple execution-locus from review-presence" is a real and useful distinction — but in its cost form it saves almost nothing, and in its floor form it is replicated by simply always running subagent. The committee's constructive residue is two separable items for the designer: (1) an additive force-isolated/candidate mark if the mixed-plan need ever proves real; (2) the inline-mode spec-floor hole, worth deciding on its own merits.

## Round-1 Recommendation (SUPERSEDED by the Follow Up 01 reframe below)

> The designer reframed after Round 1: inline is never used in practice, so the inline-vs-subagent topology axis is dropped entirely (always subagent). That moots options 2 and 3 below. The current call is in the Final Recommendation at the end of this document. Round-1 reasoning retained as record.

**Decision (Round 1).** What to do with DI-1 — build the per-task-topology dispatcher, build the additive force-isolated-review variant instead, or do nothing — and separately, whether to close the inline-mode per-task-review hole the examination surfaced.

**Options:**

1. **Do nothing / formally close DI-1** — Conservator/Pragmatist/Purist defend, Innovator partially opposes; keep the whole-plan binary; rely on v0006's per-task depth gate for the trivial-task saving and whole-plan-subagent as the floor. Record the trigger to revisit (Pragmatist).

Advantages:
- Zero cost, zero floor risk; the per-task cost saving DI-1 chased is already delivered by v0006.
- Avoids a ~40% rewrite of the skill's spine plus a second skill (plan-build) and a plan-contract migration.

Disadvantages:
- The "mostly-trivial-plus-one-spike" plan still runs uniform topology (the spike forces the whole plan to subagent).
- Leaves the per-task-mixing want unaddressed if it ever becomes real.

Implications: DI-1 closed as not-worth-it on current evidence; revisit only on a logged, recurring trigger.

2. **Additive ADVISORY review-mark (no rebuild)** — Conservator/Pragmatist/Purist's convergent alternative, mechanically refined; keep all tasks under the whole-plan-subagent floor (presence enforced at runtime per fork-policy #5), and let the plan attach an ADVISORY mark to a task that recommends a REVIEW level (e.g. "force full isolated review"). The mark targets the review-LEVEL axis the plan may always touch — NOT a presence/routing setting — and the runtime is free to ignore it with no obligation to explain. One additive advisory per-task field; no Section 2/3 merge, no header-schema change.

Advantages:
- Honors the floor by construction — it only ever ADDS review; presence stays runtime-owned; it cannot set presence=0.
- Covers the real "one task I don't fully trust" case without touching the skill's spine or the plan contract shape.

Disadvantages:
- Does not deliver the cost peel-down (that needs presence=0, the breach) — it is a review-safety lever, not a savings lever.
- Must stay strictly advisory: if it ever becomes "honor unless sprawl," it is config laundering and the breach returns.

Implications: the only mechanically-legal door — the dialable thing (review) on the axis the plan may touch, presence left where the spawn decision actually lives.

3. **Full per-task-topology dispatcher (Innovator, phased)** — Innovator defends, the other three oppose; merge Section 2/3 into one per-task dispatcher; decouple execution-locus from review-presence so inline-executed tasks still get the spec reviewer; plan emits per-task topology; Phase 1 = inline gains the spec reviewer, Phase 2 = loop merge.

Advantages:
- Makes the locus/review conflation in today's binary explicit and selectable; strictly more floor-protective than today's floorless inline.
- Unlocks granularity plan-build already computes and discards.

Disadvantages:
- ~40% rebuild of execute-write plus plan-build vectorization plus plan migration; mixed-run SHA/commit reconciliation; the cross-layer carve-out is bypassed for any inline-routed task (T4).
- In cost form it saves almost nothing over v0006; in floor form it is replicated by always running subagent. Purist: against the real floor (whole-plan-subagent), per-task inline still drops below — escalate-up relocates rather than dissolves the breach. T6: the shared-inline-unit-adjacent-to-isolated-tasks hazard.

Implications: the largest change on the table for a benefit the other three judge already captured or unsafe.

**Split adjudication.** Not close on the rebuild — 3-1 against option 3. The genuine designer choice is between **option 1 (close it)** and **option 2 (the additive mark)**, and it turns on one empirical question the researcher could not settle: does the "mostly-trivial-plus-one-spike" plan actually recur often enough to want a control for it? No telemetry exists. If it is rare → option 1. If you have felt it → option 2, which gives the control safely.

**Recommendation.** Opinion: **option 1 now — formally close DI-1 as not-worth-the-rebuild — and surface the inline-mode spec-floor hole as a separate, smaller question.** Reasoning: the examination shows DI-1's value squeezed out from three sides (v0006 took the cost, the spec floor blocks the only remaining saving, and the safe mechanism can't deliver the unsafe-but-valuable peel-down), while its cost is the single largest rebuild Chester has on the table. The central safety claim — escalate-up preserves the floor — is now mechanically refuted, not just contested: DI-1 names the TOPOLOGY/implementer-presence axis, where spawn-type is fixed before the implementer runs and no mid-task re-isolation primitive exists, so escalate-up cannot repair the current task; it relocates the breach to "next task forward." The trap to avoid is letting "isolation" stay ambiguous — escalate-up is real on the REVIEW axis and a fiction on the PRESENCE axis, and DI-1 sits on the latter. If you have actually hit the mixed-plan pain, take **option 2** instead of 1 — but only in its strictly-ADVISORY, review-axis form (the plan recommends review, never sets presence); the moment the mark becomes binding it is config laundering and the breach returns. Do NOT take option 3. Separately, the finding that today's inline plans get NO per-task spec review at all is worth its own decision (close the hole by giving inline a spec floor, or accept it as inline's documented trade-off) — independent of whether per-task topology is ever built. Settled this round; supersedes the update-execute-write framing of DI-1 as "the real unlock — just expensive": the examination finds it also low-value and floor-violating (not merely floor-risky), the violation being the conversion of an untestable enforcement property into configuration.

**Closing prompt.** Choose: close DI-1 (option 1), or build the additive force-isolated/candidate mark (option 2) — and say whether to open the inline-mode spec-floor hole as its own follow-up. Option 3 (the dispatcher rebuild) is not recommended.

## Follow Up 01 — Reframe to the Review-Level Axis

### Reframe (designer)

Inline is essentially never selected in practice — not a feasible/useful write option. So the inline-vs-subagent topology/presence axis is DROPPED (always subagent; presence=1 always; the Round-1 floor-breach concern is moot). The real per-task choice is on the REVIEW-LEVEL axis: apply the FULL subagent review process, or allow a STREAMLINED review for obviously-simple or document-only tasks, with the implementer allowed to drive the streamlining. This is the legal half of the committee's own round-1 bifurcation (the plan may forecast review LEVEL).

### Member follow-ups (Round 2)

**Researcher (facts, DECISIVE).** Of three review surfaces, only the QUALITY reviewer is dialable; the SPEC reviewer (§2.1 step 3) and SECTION 4 (mandatory whole-range) are stated floors — streamlining cannot touch them without breaking contract. v0006's quality-skip is AUTO and purely OBSERVED — the orchestrator reads the implementer's returned report and applies the 5 conditions; the implementer never decides. The report ALREADY carries every streamline signal, so "implementer-driven streamline" adds AUTHORITY, not INFORMATION — and authority-to-self-certify is the abuse surface. `Type` (docs/code/config) is set per task at plan time but execute-write reads ZERO per-task fields today (only the header) — a Type-keyed skip would be its first per-task read = new coupling. DECISIVE caveat: docs-only reliably means "no integration/compile risk," NOT "no review value" (docs carry code samples, commands, security-relevant instructions). Prior-art DECISIVE: Chrome Rubber-Stamper and CI path-filters auto-detect safe shape from the OBSERVED diff and NEVER let the author self-certify; the named failure mode of author self-certification is rubber-stamping / fused author+gatekeeper.

**Conservator (final).** v0006 step 4 IS the full-vs-streamlined quality choice already; the designer wants a FORECAST signal into it. For CODE tasks observed is strictly better; forecast beats observed ONLY for docs tasks that create/multi-touch files (v0006's "one file / no new file" conditions block a skip even though prose has no code-quality surface). Minimal floor-safe add = ONE corroborated clause: skip quality when `Type==docs-producing AND the observed report shows every changed file is a non-code/prose file`, regardless of file-count — spec reviewer still runs, cross-layer carve-out still applies. Closes a real leak Pragmatist surfaced: the cross-layer veto catches code that IMPORTS across layers but NOT a self-contained leaf code file (standalone script, regex util) — so a bare `Type==docs` skip would ship smuggled leaf code unreviewed; the observed-all-prose corroboration closes it by construction. Reject config auto-skip (config can break wiring). Reject a general full-vs-streamlined switch (re-imports code-task risk).

**Pragmatist (final, FLIPPED from Round 1).** Round-1 YAGNI applied to the topology REBUILD; the reframe deletes that (no Section 2/3 merge, no migration). This is a one-clause, cheap win. SHIP the docs carve-in as forecast-AND-observed (`Type==docs AND observed-all-non-code`), NOT a bare OR — the AND preserves the gate's invariant that an observed signal is necessary for any skip, and closes the smuggled-leaf-code leak. Names the irreducible cost honestly: it is execute-write's FIRST per-task plan-field read (contract widens from "one header field" to "header + one task field") — small, but real. DEFER an optional per-task `Review: full|streamlined` override field (only if control beyond docs is wanted). DROP implementer self-attestation (drift / rubber-stamp).

**Innovator (final).** The designer's "choice" and v0006 differ by DECISION TIME, not content: v0006 decides AFTER the diff (observed); a mark sets it BEFORE (plan-time). Right shape: pre-mark PROPOSES, observed report DISPOSES, cross-layer veto absolute over both — "escalate-up reborn at the review level, and HERE it works, because presence=1 always (the spec floor never moves)." Pre-mark adds value only where the observed gate structurally can't see "this is docs" (multi-file/new-file prose). Type∈{docs,config} ⇒ streamline-eligible; code stays observed-only. Cost correction: the new task-block read-coupling is real, not free plumbing.

**Purist (final — the structural cut).** "Streamline" is NOT one thing; it forks three ways, and the designer's own wording points at the illegal fork:
- **Clause 1 — "obviously-simple"** = the EXISTING v0006 observed gate. Already shipped; net-zero new mechanism. And "obviously simple" must NEVER enter the contract as words (it rots like "middle") — only the enumerated observed conditions are admissible.
- **Clause 2 — "doc-only"** = the ONLY genuinely new, legal capability. `Type==docs-producing` AND-ed into the existing gate as one more eligibility input; orchestrator still decides; spec floor + cross-layer veto still bind; the mark is an advisory CEILING (authorizes a skip the runtime would independently allow, never forces one) — else it relaunders into config.
- **Clause 3 — "ALLOW THE IMPLEMENTER to streamline"** = CATEGORY VIOLATION. It moves the review DECISION from orchestrator→implementer = self-certification = the author becomes its own gatekeeper = rubber-stamp by construction. This is Round-1's presence violation RELOCATED from the build axis to the review-DECISION axis. REJECT.
Locus = asymmetric, runtime-dominant: observed report is the ACTION owner (necessary); a plan mark is at most NECESSARY-additionally, NEVER sufficient; cross-layer carve-out an unliftable veto; never the implementer.

### Team Lead (Round 2)

**Convergence (stable, proven).**
- The reframe dissolves the Round-1 wall: dropping inline removes the presence/implementer axis, leaving only the review-LEVEL axis the committee already ruled legal. Escalate-up, which failed on the presence axis, works here because the spec floor never moves.
- "Streamline" = skip the QUALITY reviewer only, binary. Spec reviewer (floor), cross-layer carve-out (absolute veto), and Section 4 (mandatory) are all untouchable — 5-aligned.
- REJECT implementer-decided streamline (clause 3) — 4 advocacy + researcher: self-certification fuses author and gatekeeper, the named rubber-stamp failure mode. The decision stays with the orchestrator reading the observed report.
- Clause 1 ("obviously-simple") is already shipped as v0006; no new mechanism. "Obviously simple" never enters the contract as free text — only enumerated observed conditions.
- The only genuinely new capability is the docs carve-in, and it must be corroborated by the observed diff (forecast-AND-observed), because the cross-layer veto does not catch self-contained leaf code.

**Alignment.** 5-aligned on the floors, the rejection of clause 3, and "docs carve-in, corroborated." The one open design knob is the TRIGGER: key it on the plan's `Type==docs-producing` label AND-ed with observed-all-prose (Conservator/Pragmatist/Innovator/Purist — needs execute-write's first per-task field read), or on the OBSERVED "every changed file is a prose extension" ALONE (team-lead observation — sufficient by itself, since a pure-prose diff has no code-quality surface regardless of the label, and it needs no new coupling and cannot be mismarked). The committee AND-ed Type in for plan-intent corroboration; the observed-only reading drops Type as redundant.

**Observations.** The designer's three phrasings reduced cleanly: "obviously-simple" already exists (v0006), "document-only" is the one new clause (and even it operationalizes to an observed-extension check), and "allow the implementer to streamline" is the one fork to reject outright. The deepest result: this is the same observed-beats-forecast lesson as the first execute-write committee — the safe trigger is the observed prose-diff, not the plan's forecast label; `Type` only adds a permission, at the cost of a new contract surface. The researcher's caveat (docs have prose review value the quality reviewer is not currently built to check) means skipping quality on prose forgoes nothing the quality reviewer presently delivers — but if a prose-accuracy review is ever wanted, that is a new reviewer, not a reason to keep running the code-oriented one on markdown.

## Final Recommendation

**Decision.** Whether to add a docs streamline-skip to the v0006 quality gate, and if so what TRIGGERS it — the plan's `Type` label (corroborated by the observed diff) or the observed prose-diff alone — given that "obviously-simple" already exists and "implementer-decided streamline" is rejected.

**What is settled (5-aligned, not optional):**
- "Streamline" touches the QUALITY reviewer ONLY. Spec reviewer, cross-layer carve-out, and Section 4 stay absolute. Always subagent (inline dropped).
- The review DECISION stays with the orchestrator reading the observed report. The implementer never self-certifies its own review level (rubber-stamp / author=gatekeeper). This rejects the designer's "allow the implementer to streamline" as worded.
- "Obviously-simple" needs no new build — it is the v0006 gate. "Obviously simple" never enters the contract as free text; only enumerated observed conditions do.

**Options (the one open knob — the docs trigger):**

1. **Observed-only prose-skip (team-lead recommended)** — extend the v0006 gate with one condition: skip the quality reviewer when the implementer's report shows EVERY changed file is a prose/non-code extension, regardless of file-count or new-vs-edit; spec reviewer still runs; cross-layer carve-out still applies.

Advantages:
- No new coupling — execute-write keeps reading no per-task plan field; the signal is already in the implementer report it holds.
- Cannot be mismarked: it keys on what actually changed, not a label a plan could get wrong; consistent with the project's observed-beats-forecast precedent.

Disadvantages:
- No plan-intent permission layer — any all-prose diff is skip-eligible, even from a task the plan called code-producing (though that case is harmless: no code changed, nothing for the quality reviewer to check).

Implications: closes the docs over-run (multi-file/new-file prose) with the smallest, lowest-coupling change; the cleanest operationalization of "document-only."

2. **Type-AND-observed docs carve-in (committee's literal convergence)** — skip the quality reviewer when `Type==docs-producing AND every changed file is non-code`; same floors.

Advantages:
- Adds a plan-intent permission layer (only skip when the plan declared docs), an auditable closed-enum trigger.
- Forecast-AND-observed preserves the gate's "observed is necessary" invariant and closes the smuggled-leaf-code leak.

Disadvantages:
- Requires execute-write's FIRST per-task plan-field read — a real (small) new contract surface widening "one header field" to "header + one task field."
- The `Type` half is redundant for safety once the observed-all-prose condition is present; it buys permission, not protection.

Implications: the committee's corroborated form; slightly more auditable intent, at the cost of a new coupling the observed-only option avoids.

3. **Do nothing on docs** — keep the v0006 gate as-is; accept that multi-file/new-file prose tasks run a (no-op) quality reviewer.

Advantages:
- Zero change; the cost is only a wasted reviewer pass on prose, which Section 4 and the spec floor already backstop.

Disadvantages:
- Leaves the designer's one concrete, legal want unmet.

Implications: defensible if the docs over-run is rare; declines the only new capability the reframe surfaced.

**Split adjudication.** No split on the floors or on rejecting implementer-decided streamline — those are 5-aligned. The only open choice is the trigger for the docs skip: observed-prose-alone (option 1) vs Type-AND-observed (option 2), or decline it (option 3). The committee AND-ed `Type` in; the team-lead notes the observed half is sufficient on its own and avoids the new coupling.

**Recommendation.** Opinion: **option 1 — the observed-only prose-skip.** It delivers exactly the designer's "document-only" intent (multi-file prose stops running a code-reviewer that has nothing to check), at the lowest cost, with no new coupling, and cannot be gamed by a mislabeled plan — the same observed-beats-forecast principle the first execute-write committee settled. Keep `Type` out of execute-write's read path unless a future want genuinely needs plan-intent permission (option 2 remains the clean upgrade if so). Reject the implementer-decided streamline outright (it is the rubber-stamp anti-pattern, mechanically the Round-1 presence violation relocated to the review-decision axis). If a prose-accuracy check is ever wanted for docs, that is a NEW reviewer to design, not a reason to keep the code-oriented quality reviewer running on markdown. Settled Follow Up 01; supersedes the Round-1 topology framing — the designer removed the axis the Round-1 rejection rested on, and what remains is a one-condition, floor-safe addition.

**Closing prompt.** Choose the docs trigger — option 1 (observed prose-diff alone, recommended), option 2 (Type-AND-observed), or option 3 (do nothing) — and confirm the rejection of implementer-decided streamline. On your pick I draft the one-clause edit to execute-write §2.1 step 4 and the deferred-items updates, then tear down the committee.

## Designer Decision (2026-05-31, closure)

**Adopted: option 1 — observed prose-diff alone.** Extend the v0006 quality-skip gate (§2.1 step 4) with one condition: skip the quality reviewer when the implementer's report shows EVERY changed file is a non-code / prose extension, regardless of file-count or new-vs-edit. The spec reviewer still runs (non-dialable floor); the cross-layer carve-out still applies (vacuous for prose); Section 4 unchanged. Keyed on the OBSERVED report only — no `Type` read, no new per-task coupling.

**Confirmed rejections (5-aligned):**
- Implementer-decided streamline — REJECTED (self-certification / rubber-stamp; the review decision stays with the orchestrator reading the observed report). Option 1 is orchestrator-decided by construction.
- General full-vs-streamlined switch, config auto-skip, the `Type`-read coupling (option 2), and per-task topology / the dispatcher rebuild (Round-1 option 3) — all declined.

**DI-1 resolution:** the per-task-topology unlock (DI-1 as originally framed) is CLOSED — superseded by the designer's reframe onto the review-level axis and resolved as this one-clause prose-skip. The dispatcher rebuild is not built.

**Orphan finding carried forward (deferred):** inline mode today gives tasks NO per-task spec review (only Section 4). Independent of this change; left for a separate decision (give inline a spec floor, or document it as inline's trade-off) — low priority given the designer never uses inline.

**Possible future item (deferred):** a prose-accuracy reviewer for docs (checking code samples / commands in markdown) — a NEW reviewer, distinct from the code-oriented quality reviewer this change skips on prose. Only if the want arises.

**Provenance:** committee consultation closed; record stamped; team torn down.

<!-- created-at: 2026-05-31T12:55:26Z -->
<!-- produced-by design-committee@v0015 -->
