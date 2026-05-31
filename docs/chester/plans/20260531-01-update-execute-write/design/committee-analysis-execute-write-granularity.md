# Committee Analysis — execute-write review-intensity granularity
# File: committee-analysis-execute-write-granularity.md dtd 2026-05-31
# Master: (none) · Sub-sprint: 20260531-01-update-execute-write

## Round Overview

One round, one-round-format, terse verbosity. Standalone committee convened to review the
quality-per-token analysis of `execute-write` and design a mechanism that scales review
intensity to task weight + cross-task coupling. Five subagents: four advocacy (Conservator,
Innovator, Pragmatist, Purist) + Researcher. HEAD 276601a.

**Question (scope: review-intensity granularity for execute-write only; not a rewrite):**
How should `execute-write` scale review intensity to task weight + cross-task coupling — what
granularity mechanism, at what contract cost?

**Poles (reporting lens, not a fixed pairing):**
- Keep fixed depth — uniform-review floor is the proven safety property (Conservator).
- Move the decision to execute-time observation — gate on the diff that actually happened (Innovator, Pragmatist).
- Tier by derivation over existing plan fields, no new field (Purist).
- Researcher — facts only, no pole.

## Initial Deliberation

### Researcher — prior-art findings (verbatim, abridged; DECISIVE on Task 2/3 and the vaporware addendum)

- **Cost structure — 3N+1 floor CONFIRMED.** Per task subagent-mode: implementer (general-purpose, forks) + spec reviewer (`chester:execute-write-spec-reviewer`, named/isolated, never forks) + quality reviewer (`chester:execute-write-quality-reviewer`, isolated, only after spec passes) = 3 agents; plus one Section 4 final review after all tasks. Floor = 3N+1; re-dispatch loops push above it. Inline mode = 0 subagents.
- **Plan already emits keyable metadata.** Per-task `Type`, `Implements`, `Decision budget`, `Must remain green`; plan-level threat-report risk + per-task Files (Create/Modify) blast proxy. plan-build's Execution Mode Selection already consumes exactly these as a 4-condition AND to pick subagent|inline. A per-task review hint could derive from the same inputs with no new collection machinery.
- **Contract precedent.** `Execution mode:` is one plan-header field, read by a 4-way routing table; execute-write deliberately does NOT re-derive the heuristic (avoids coupling to plan shape). Per-task fields (Decision budget etc.) are also precedented in the artifact.
- **Forbidden surfaces / floor.** skill-contract's three forbidden surfaces govern the committee skill, not execute-write; execute-write's analogous protection = the subagent-safe-default. A new tier may live in plan-header or per-task block (both non-forbidden) but must preserve the subagent-safe-default direction.
- **Prior-art (named).** Meta Diff Risk Score (calibrated per-diff risk gates merge friction); risk-based gating threshold tuning (riskiest ~30% of commits → up to 86.4% defect capture, threshold tunable to capacity); Change Impact Analysis (call-graph risk routes reviewer attention); differential review (depth ∝ change risk); risk-based testing. Common shape: per-change risk score → tier (minimal/standard/heavy), threshold tunable.
- **DECISIVE ADDENDUM — the `Type` execute consumer is vaporware.** plan-build SKILL.md:54 and plan-template.md:96 assert "execute-write's trigger-checks key off Type." Grep across execute-write + all four references = ZERO matches. The claimed consumer does not exist. So TODAY no per-task field has any live execute-time consumer; the only execute-side routing input is the single header `Execution mode`. Per-task granularity is green field at execute time: zero contract cost to add a reader, but the keying fields are author-estimated and ungraded (nothing has depended on their accuracy). Cuts both ways. Separate doc-drift bug.

Synthesis (facts): The 3N+1 floor is real. The plan carries weight-signals but they are forecasts with no current execute consumer and no accuracy track record. The only validated execute-time ground truth is the implementer's report (Files Changed, Tests, status). Industry converges on risk-scored tiering, threshold tunable to capacity.

### Conservator — position (verbatim, abridged): keep fixed depth; reject the two granularity levers, accept the two safety/visibility adds

The granularity dial already exists = the mode binary, set once at plan-build's tail where all weight signals are known. A per-task tier re-reads the same signals at a second altitude = drift, not refinement, and re-couples execute-write to plan internal shape (the coupling SKILL.md:70 avoids). **Reject per-task tier (lever 1)** — it inverts the safe default: under-review is unrecoverable, over-review is cheap; a plan-emitted "light/skip" makes under-review the default for any mis-weighted task, and you cannot use the thing being checked to decide whether to check it; also an analogous floor-not-ceiling breach. **Reject conditional Section 4 (lever 2)** — the +1 is the cheapest unit and the ONLY cross-task integration net; isolated per-task reviewers each see one task cold and cannot catch integration bugs; "conditional on coupling" forces execute-write to compute coupling = re-derive plan structure. **Accept re-dispatch ceiling (lever 3)** narrowed to a circuit-breaker that escalates to user (not silent drop); Opinion: ceiling 3. **Accept fork-mode surfacing (lever 4)** — one printed line, pure visibility. Net: keep fixed-depth floor, add 2 additive safety/visibility items, zero granularity dial. (F-A-C pass; Assumption: planner weight-estimate imperfect — the same imperfection that justifies independent review.)

### Innovator — position (verbatim, abridged): wrong axis — gate on observed diff, not plan forecast

Per-task tier keyed to a plan-emitted weight field = WRONG AXIS: re-introduces the coupling SKILL.md:70 fought off, and the field is a FORECAST (weight guessed before code exists; forecasts are wrong on the tasks that matter — the "small" task that sprawls). RIGHT AXIS = OBSERVED diff read after the implementer returns; that signal is free and already in hand (implementer report Files Changed + Tests). **The gate:** skip QUALITY reviewer when ALL of [diff = 1 file; edits-only; Tests non-empty; status DONE]. **Cross-layer carve-out (load-bearing):** if the diff touches a module importing another layer/package → NEVER skip; the real-import check is the one quality duty that catches the integration tail. SPEC reviewer never skipped. No LOC threshold (invites bikeshedding N). **Levers:** per-task tier field REJECT (observed-diff dominates it); conditional Section 4 ACCEPT but coupling must be OBSERVED (union of implementer Files Changed across tasks) → a light integration pass, not full re-review, when task diffs are disjoint; re-dispatch ceiling ACCEPT as an escalation trigger (after 2 re-dispatches, force the think-gate to escalate, don't hard-cap legitimate hard work); surface fork-mode STRONG ACCEPT (the 3N+1 floor only holds when isolated reviewers are cheap vs forked implementers; fork OFF inverts the cost model silently). Highest-leverage change = move the granularity decision from plan-time forecast to execute-time observation.

### Pragmatist — position (verbatim, abridged): consumer-side observed-diff gate; three ships; gate the redundant check never the load-bearing one

Position moved during deliberation toward observed-diff (supersedes opening, which keyed on plan fields). Researcher confirmed Decision budget/Files/Type have zero execute-time consumer and Type's claimed consumer is vaporware — so gating on plan-declared fields would make Pragmatist the first consumer of an author-estimated, never-validated field. Gate instead on what the diff turned out to be. **Ship 1 — gate QUALITY reviewer** on the observed report [1 file; edits-only; Tests non-empty; status DONE], with the cross-layer carve-out (always run quality when the change crosses a layer/package import). **Ship 2 — Section 4 conditional** (run only when task-count>3 OR any multi-file task OR any re-dispatch occurred); Section 4 is legitimately plan-level/binary, keep it binary. **Ship 3 — re-dispatch ceiling = 2 then escalate.** Hard boundary: SPEC reviewer NEVER tiers (spec-miss unrecoverable, cheap vs implement); QUALITY tier-eligible except cross-layer; Section 4 conditional. Contract cost = zero new surface (plan stays exactly one routing field; edits live in execute-write's own files). Reject new per-task field; reject fork-mode surfacing as observability-only/defer; reject LOC threshold. Expected ~20% spend cut on a mixed plan, near-full depth retained on heavy plans — self-tuning.

### Purist — position (verbatim, abridged): tier by derivation over existing fields, never a new field; keep ownership at plan-time

"Task weight" must not become a new carried field. It already exists as `f(Type, decision-budget, file-count)`, all per-task, all already written by plan-build; execute-write can read these. **Category verdicts:** (1) a new tier field belongs NOWHERE — if a knob is wanted it sits at plan-level (plan-build owns review policy, same as `Execution mode`), never a per-task header field; (2) a per-task tier field would split review-depth ownership across plan-time and execute-time = boundary rot; keep the DECISION at plan-time, let execute-write only execute a derivation rule fixed in the skill body (legible, versioned, auditable) — a per-plan header value is a silent drift surface; (3) "task weight" is well-defined ONLY as a derivation, not as a hand-set `tier: light|full` (which rots — no auditable definition of where "light" ends). **Recommend:** ADOPT conditional Section 4 (binary, plan-level = clean category); ADOPT re-dispatch ceiling (runtime guard, no contract); DERIVE per-task depth (skip quality reviewer when Type=docs-producing AND decision-budget≤1) as a skill-body rule, not a field; REJECT a new per-task tier field; fork-mode = one-line announce. One line: Chester already routes per-task on Type and per-plan on Execution mode; a third tier router duplicates data the plan already carries — tier by derivation, gate by binary plan-level knobs, add zero new fields.

### Member follow-ups

- **Conservator → Researcher:** was fixed-depth a deliberate prior decision or never-built; is uncapped-loop runaway ever real? (Researcher: no evidence of a deliberate fixed-depth decision record; uncapped re-dispatch is structurally possible, no telemetry exists to say how often.)
- **Pragmatist ↔ Researcher:** verify no execute consumer reads per-task fields → confirmed, and surfaced the vaporware `Type` addendum.
- **Pragmatist ↔ Innovator:** "diff-stat gate beats plan-tier; breakeven on spec not quality" — converged on the observed-diff gate + cross-layer carve-out (their final gates are identical).
- **Purist ↔ Pragmatist:** "is tiering worth a 2nd routing dimension?" → resolved: no second routing dimension; the gate is consumer-side over the observed report, ~1 agent/task saved.
- **Researcher → Purist:** per-task weight inputs (budget, files) are both per-task and present — but ungraded.
- **Movement:** Pragmatist and Purist both moved from plan-field derivation toward the observed-diff consumer-side gate after the researcher's vaporware finding. Innovator and Pragmatist's final gates are textually identical (observed-diff + cross-layer carve-out).
- **Post-submission convergence (mid-round, recorded):** Purist filed an amendment then a correction — retracts plan-field derivation entirely (self-verified: execute-write reads exactly one plan field, `Execution mode`; reading per-task fields would BUILD a new execute→plan reader = new cross-skill coupling, so derivation is NOT free). Purist now ranks the consumer-side gate on the implementer report #1 (its input is an artifact execute-write already receives in Section 2.1 → new reader, zero new plan coupling). **Category guard adopted by Purist and Pragmatist:** the skip predicate must be FIXED in execute-write SKILL.md body (e.g. "skip quality-reviewer when Status==DONE AND single-file AND no new file AND Tests all-Pass AND no cross-layer import; else run"), not a free/ad-hoc knob — else the legibility rot just relocates from plan into executor. Net: Innovator + Pragmatist + Purist fully converged on one mechanism. **Signal-source split (A) has collapsed** to observed-report. Purist also independently confirmed the dangling `Type`-consumer bug (plan-build SKILL.md:54).

### Team Lead

**Convergence (stable, proven).**
- Kill the new per-task tier header field — 4-0 (all advocacy reject; researcher: redundant + untested-forecast risk).
- Never tier the SPEC reviewer — 4-0; spec-miss is the unrecoverable check.
- Add a bounded re-dispatch that escalates to the user (not a silent drop) — 4-0; differ only on N (2 vs 3) and hard-cap vs escalation-trigger.
- The keying signal, if review is tiered, should be the OBSERVED implementer report, not a plan-declared forecast — Innovator + Pragmatist explicit, Researcher's vaporware finding supports, Purist's plan-field derivation is the lone alternative and its author moved toward observed during Q&A.

**Alignment.**
- Quality-reviewer gating: 3 fully converged (Innovator, Pragmatist, Purist) on the consumer-side observed-report gate with a skill-body-fixed predicate; Conservator dissents on safe-default-inversion grounds. Note: Conservator argued against a *plan-declared* tier; the observed-report reframe (post-hoc ground truth + cross-layer carve-out + fixed predicate) was not put to Conservator, so the dissent may be narrower than 1-vs-3 suggests.
- Signal source (was Split A): COLLAPSED to observed-report. Purist retracted plan-field derivation after verifying it adds a new execute→plan reader; no member now defends a plan-declared signal.
- Section 4 (Split B, live): 3 favor conditional/lighter (Pragmatist binary-conditional, Innovator observed-coupling light pass, Purist binary plan-level on|off), Conservator holds always-full (the +1 is the only integration net). The live split — Innovator's "light integration pass, not skip" is a genuine middle that preserves an integration net while cutting overlap.
- Re-dispatch ceiling: 4-0 to bound-and-escalate (N: Pragmatist/Innovator 2, Conservator 3).
- Fork-mode surfacing: 3 accept (free visibility), Pragmatist defers (observability-only).

**Observations.** Two designer-facing splits remain: (A) signal source — observed diff vs derived-from-plan-fields; nearly settled toward observed by the vaporware finding, but Purist's legibility point (a derivation rule fixed in the skill body is auditable) is real and not refuted. (B) Section 4 — conditional/light vs always-full; the live tension is integration-net coverage vs overlap cost, with an observed-coupling light pass as the synthesis candidate. Separate non-scope bug to capture as a deferred item: plan-build claims an execute-time `Type` consumer that does not exist. F-A-C: all proposed edits live inside execute-write + its own reference headers; zero new plan-author contract surface; subagent-safe-default direction preserved.

## Follow Up 01

### Member follow-ups

Designer reopened the locus: should the decision move to plan-build — per-task review level-of-effort encoded in the plan, the binary subagent|inline replaced by a per-task scale (inline / middle / full-subagent), execute-write becoming a scaled/hybrid executor? One round, refined question.

**Researcher (facts, DECISIVE on mechanics).** (1) Mode is PLAN-LEVEL today — one whole-plan header field, chosen once at plan tail from a 4-condition heuristic; no per-task mode anywhere. (2) plan-build COULD assign per-task effort with no new data — 3 of 4 heuristic inputs (decision-budget, Files, Type) are already per-task, computed then collapsed to one verdict. (3) execute-write has NO per-task mode routing — Sections 2 and 3 are mutually exclusive whole-run branches; "hybrid" (some tasks inline, some subagent) requires rebuilding execute-write into a per-task dispatcher and reconciling Section 4 against a mixed run — the largest cost in the proposal, a read-side rebuild not a field-read. (4) Per-task block exists; an effort field is cheap write-side, expensive read-side. (5) Prior-art names the axis: a-priori (plan-time, upfront from rating factors) vs a-posteriori (review-time, from observed outcome) risk classification. Documented failure of a-priori sizing: can never capture all factors, and underestimation bias grows with uncertainty — plan-time effort tags skew low exactly where stakes are highest. Review-time observed tiering is immune.

**Conservator.** Splits the proposal: LOCUS (plan-time assignment) = qualified yes — but plan sets the FLOOR, not the ceiling; execute-write keeps the right to escalate depth up on a bad observed report. RESOLUTION (binary→3-level) = no — "middle" has no asymmetric-cost anchor; binary fails safe, a scale fails ambiguous and invites overuse of "middle" to dodge cost. Section 4 is orphaned by a per-task scale — it must stay a plan-level mandatory net. Max safe expansion = per-task BINARY, never a third level.

**Innovator.** Revises its round-1 stance. The proposal conflates TWO orthogonal axes under one ordinal: (A) topology/independence — genuinely binary (context shared or not), and a structural property the planner CAN judge per-task (plan-build already computes per-task signal then discards it at the collapse); (B) review-depth — a posterior, only knowable from the observed diff. Hybrid = prior + posterior: plan sets per-task topology, execute sets depth on observed diff and may escalate topology UP only (never down — downgrading independence is invisible damage). Kill inline/middle/full; replace with a per-task topology binary (plan) + execute-time depth gate (observed). Honest caveat: the per-task topology reader is net-new execute machinery, not a free field-read.

**Pragmatist.** Half-right locus; split, don't move wholesale. The 3-level per-task scale fuses execution TOPOLOGY (whole-plan today; per-task = a hybrid executor that does not exist = big multi-skill ship) with review DEPTH (round-1 solved this at execute-time). A per-task effort field repeats round-1's rejected mistake — author-graded, untested, and now execution depth depends on the grade, so mis-grading directly under/over-reviews. Simplest sufficient: KEEP `Execution mode` binary whole-plan, KEEP the round-1 observed depth-gate; the designer's "scaled executor under plan direction" frame is ALREADY satisfied (topology is plan-level, depth becomes plan-direction-compatible via the observed gate, which reads a downstream-of-plan artifact). Round-1 option 1 dominates the designer's version on author burden, ship cost, and accuracy. YAGNI on per-task topology until a concrete plan needs it.

**Purist.** Two verdicts. LOCUS = adopt plan-build (consolidating review policy there fixes the split-ownership rot; retires the consumer-side gate as a workaround for that split). SHAPE = reject the 3-scale: the binary tracks exactly ONE property, independence-PRESENCE, which is irreducibly binary and floor-protected (reviewers never fork; plan may tune passes, may not waive isolation). "Middle" lives on a DIFFERENT axis — review-pass COUNT — so the scale conflates two axes under one unauditable label. Crisp rule: plan-build may forecast review LEVEL; plan-build may NOT forecast independence PRESENCE per task. Keep `Execution mode` binary; if per-task depth is wanted, add a separate DERIVED `Review passes` axis inside subagent mode; Section 4 a separate plan-level binary.

**Post-submission convergence (mid-round, recorded).** Continued peer-DM produced a single fully-specified shape and a rigorous rejection proof:
- **Kind-vs-quantity proof (Purist, endorsed by Innovator as "the kill-shot").** Plot the real 2-D grid: topology (inline|subagent = a KIND, no less/more) × review-depth (reviewer count = a QUANTITY). The 3-scale's points are inline=(inline,0), middle=(subagent,1), full=(subagent,2). Step inline→middle flips topology AND adds a reviewer (two axes move); step middle→full adds a reviewer only (one axis). An ordinal claims its steps are commensurable; here they are not — "middle" is an arbitrary collapse point. The scale lies about what a step is. This is the rigorous form of the 4-0 rejection.
- **Policy/enforcement split (Purist → Conservator, adopted).** Independence PRESENCE = an ENFORCEMENT property, irreducibly runtime (the cold reviewer reads the real diff), floor-protected — plan may recommend, may not waive. Scrutiny COUNT = a POLICY property, forecastable from task shape at plan time. The 3-scale's defect is letting "inline" set presence=0 per task at plan time — a planner deciding a runtime property it cannot enforce.
- **Asymmetry — one boundary, one dial, not two knobs (Innovator, load-bearing).** Axis A topology = a floor-protected BOUNDARY; the only legal execute-side move is escalate UP (inline→subagent on observed drift), never down — downgrading independence is forbidden, not discouraged. Axis B depth = a TUNABLE DIAL, but FLOORED; it tunes the discretionary band above the floor, never below. Do not read the split as licensing a planner to waive independence under a "lower effort" label.
- **Exact floor names the pass (Purist + Conservator, converged).** The depth floor is not "min 1 pass" (that repeats the kind/quantity trap one layer down — the two passes are different kinds). It is: NON-DIALABLE = exactly 1 isolated SPEC-compliance pass per task, always on, plan cannot zero it (spec runs first and gates quality; spec drift is the invisible-damage class). DIAL = quality-review presence (0/1) + any extra passes, scales up with task weight.
- **Pragmatist held the dissent.** The whole converged form is fine EXCEPT he rejects emitting the depth count from the plan: it is an author-graded forecast where the observed implementer report is ground truth, and adds contract surface for no accuracy gain over the round-1 execute-time gate. Decisive fact he re-confirmed: per-task TOPOLOGY would force an executor rewrite (the per-task loop lives inside each mode section), but the converged depth-only form does NOT touch topology, so that cost does not attach to it.

### Team Lead

**Convergence (stable, proven, this round).**
- Kill the literal inline/middle/full 3-level scale — 4-0. It conflates two orthogonal axes (independence-presence × review-depth) under one ordinal; "middle" names no single axis.
- Keep the subagent|inline binary — 4-0. It is the only clean boundary for independence-presence, which is binary; a scale dilutes the one property hardest to recover.
- Section 4 (cross-task integration net) stays a plan-level mandatory floor, never folded into a per-task scale — 4-0.
- Two axes must be separated: topology/independence (A) and review-depth/passes (B).

**Canonical form (4 of 4 agree on the shape; split only on one feed).** Topology = `Execution mode: subagent|inline`, WHOLE-PLAN binary, floor-protected, unchanged — no per-task topology, so no executor rewrite. Inside subagent mode, review depth is per-task: a non-dialable spec-compliance floor (always on) plus a quality-review-and-extras dial that scales with task weight. Section 4 = separate plan-level binary, mandatory. No hand-set ordinal anywhere; every dialable thing is a count; every floor names its pass. Cross-layer real-import check never skipped.

**Alignment.**
- The 3-level scale and per-task topology: rejected 4-0, now with the kind-vs-quantity step-semantics proof. Per-task topology is the only thing that would force an executor rewrite, and the committee set it aside — so the converged depth-only form is a small change, not a rebuild.
- The one live split — the depth dial's FEED: plan-emitted DERIVED count (Conservator, Purist — auditable, single plan-time owner) vs EXECUTE-time observed report (Innovator, Pragmatist — ground truth, zero new plan field; round-1 gate). 2-2. Reconcilable by a hybrid: plan emits a derived floor count, execute escalates UP on the observed diff, never below the spec floor.
- Researcher (a-priori vs a-posteriori) tilts the feed question toward observed: plan-time counts inherit forecast-drift and underestimation-bias-under-uncertainty; observed is immune.

**Observations.** The designer's question resolves cleanly per axis. Topology/independence — plan-build is the right (and current) owner; it stays whole-plan binary. Review depth — execute-write is where the dial must read, because depth is a posterior; the only question is whether the plan emits a derived FLOOR for that dial. The expensive thing (per-task topology → executor rewrite) is exactly the thing nobody now proposes; my prior packet over-attributed that cost to the granularity win. The round-1 depth gate + spec floor + Section 4 + re-dispatch + fork-mode adds all stand.

## Final Recommendation

**Decision.** Given the converged canonical form — whole-plan binary topology, a per-task spec-compliance floor, a per-task quality-review dial, and a separate plan-level Section 4 — the one open choice is the dial's FEED: does the per-task review-depth come from a plan-emitted derived count or from the execute-time observed report? The literal 3-level scale and per-task topology are set aside (4-0, kind-vs-quantity proof).

**Options:**

1. **Observed feed — depth dial reads the implementer report (execute-write only)** — Pragmatist/Innovator defend, Researcher's a-priori/a-posteriori finding supports; spec review always runs; skip the quality reviewer on a same-layer single-file edit-only DONE-with-tests task; cross-layer never skipped; predicate fixed in the skill body; Section 4 a plan-level binary; topology whole-plan unchanged; add re-dispatch ceiling-then-escalate and the fork-mode line. No new plan field.

Advantages:
- Keys the dial on ground truth (the actual diff), immune to the documented forecast-drift of plan-time sizing.
- Zero new plan contract and no executor change; ships in execute-write plus its reference headers; the fixed predicate makes it auditable.

Disadvantages:
- Review-depth policy lives in execute-write, not consolidated at plan-time with the other review-policy signals.
- The plan cannot pre-state intended depth for a reader skimming the plan.

Implications: the round-1 win, delivered as the depth dial; spec floor + Section 4 + escalate-up all intact.

2. **Plan-derived floor + observed escalate-up (hybrid)** — Conservator/Purist defend; plan-build derives a per-task review-pass FLOOR count from signals it already computes (decision-budget, Type, file-count) and emits it into the task block; execute-write reads it as the minimum and escalates UP on the observed diff, never below the spec floor; Section 4 a plan-level binary; topology whole-plan unchanged. Adds a plan field + a plan-build derivation + an execute-side reader — but NO executor rewrite.

Advantages:
- Single plan-time owner of review policy; the floor is auditable in the plan before execution.
- Floor-not-ceiling preserved: plan sets the minimum, observation can only raise it.

Disadvantages:
- The emitted count is a forecast over author-estimated, never-validated signals (researcher: underestimation bias under uncertainty); the observed gate dominates it on accuracy.
- New cross-skill contract (plan-build → execute-write reader) where option 1 needs none, for a floor the observed gate would reach anyway.

Implications: modest new contract, no rewrite; buys plan-time visibility/ownership at the cost of a forecast the observed feed already beats.

3. **Designer's literal proposal — per-task inline/middle/full scale (and/or per-task topology)** — no member defends (4-0 against). A single per-task ordinal sets topology and depth together; per-task topology is also the only variant that forces an execute-write executor rewrite.

Advantages:
- One field, one place; superficially simplest.

Disadvantages:
- Kind-vs-quantity proof: the ordinal's steps are not commensurable (inline→middle flips a kind and adds a count; middle→full adds a count) — "middle" is an arbitrary collapse point.
- Sets independence-presence by plan-time forecast (floor breach); per-task topology triggers the executor rewrite; orphans the cross-task net.

Implications: rejected on shape and, for per-task topology, on cost.

**Split adjudication.** Option 3 is set aside 4-0. The live tension is option 1 vs option 2, and it is a 2-2 on one narrow question: does the per-task depth dial read a plan-emitted derived floor (Conservator/Purist — single plan-time owner, auditable) or the observed implementer report (Innovator/Pragmatist — ground truth, zero new contract)? Both keep whole-plan topology, the spec floor, and Section 4; neither needs an executor rewrite. The hybrid (plan floor + observed escalate-up) is the reconciliation if you want both.

**Recommendation.** Opinion: take option 1 — the observed feed. The researcher's a-priori/a-posteriori finding is the tiebreaker: a plan-emitted count is a forecast over signals the plan author estimated and nothing has ever validated, while the observed report is the actual diff; depth is a posterior and reads best where the posterior exists. Option 2's one real advantage — review policy consolidated and visible at plan-time — is worth having, but Purist's own auditability requirement is already met by fixing the skip predicate in the skill body, and Conservator's escalate-up is simply what an observed gate does natively. If you weight plan-time ownership highly, option 2 is the principled variant and is NOT expensive (a derived floor field, no rewrite) — so it stays open as a cheap follow-on. Either way: whole-plan topology binary stays, spec floor is non-dialable, Section 4 stays a plan-level mandatory net. Settled Follow Up 01; supersedes the prior packet's framing that attached an executor-rewrite cost to the granularity win — that cost belongs only to per-task topology, which is set aside. Carry per-task topology and the dangling `Type` consumer as deferred items.

**Closing prompt.** Pick the depth feed — option 1 (observed, execute-write only) or option 2 (plan-derived floor + observed escalate-up); option 3 is set aside. On your pick I draft the edits (spec floor + quality dial + cross-layer carve-out + Section 4 binary + re-dispatch ceiling + fork-mode line) and log per-task topology and the `Type`-consumer drift as deferred items, then tear down the committee.

## Designer Decision (2026-05-31, closure)

**Adopted: option 1 — observed feed — with Section 4 ALWAYS-ON.** The per-task review-depth dial reads the implementer's own report; no plan-build/plan-template change; no per-task topology; no executor rewrite. Concrete execute-write edits to draft:

1. **Quality reviewer gated (Section 2.1 step 4).** Skip the quality reviewer for a task only when ALL hold in the implementer report: Status==DONE; Files Changed == one file; no new file (edit-only); Tests section present and all Pass; changed module does not import another layer/package. Else run it. Predicate written literally in the skill body.
2. **Cross-layer carve-out (non-skippable).** If the change touches a module importing another layer/package, the quality reviewer ALWAYS runs — it owns the real-import integration check. Stated as a hard exception to the gate.
3. **Spec floor explicit (step 3).** Spec-compliance review is non-dialable — runs every task; the gate governs only the quality review. Spec is never tiered.
4. **Re-dispatch ceiling (steps 2–4 loops).** After 2 re-dispatches on one task, stop auto-retry and escalate to the user via the think-gate. No silent drop.
5. **Fork-mode surfacing (Section 2 entry).** One-line announce of fork-mode on/off; off → isolated reviewers run cold (higher token cost).
6. **Section 4 = ALWAYS-ON.** Final cross-task review runs every sprint, unconditional (designer chose the conservative pole; conditional variant declined for the first cut). The cross-task integration net is preserved.

**Unchanged:** Section 3 (inline mode); Section 1.4 routing (`Execution mode` whole-plan binary); plan-build / plan-template (no new field); spec reviewer always runs; two-section architecture.

**Deferred items logged:** (a) per-task topology + hybrid executor; (b) dangling `Type`-consumer line in plan-build SKILL.md:54 (documents an execute-side reader that does not exist).

**Provenance:** committee consultation closed; record stamped; team torn down.

<!-- created-at: 2026-05-31T09:39:02Z -->
<!-- produced-by design-committee@v0015 -->
