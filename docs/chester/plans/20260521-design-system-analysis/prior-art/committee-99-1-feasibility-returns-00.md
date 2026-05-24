# Committee 99/1 Feasibility Deliberation — Verbatim Returns Recovery

**File:** `committee-99-1-feasibility-returns-00.md`

**Recovered:** 2026-05-21 (Path 1 transcript extraction)

**Original deliberation date:** 2026-05-21 09:52–09:55 UTC

**Source transcript:** `/home/mike/.claude/projects/-home-mike-RiderProjects-StoryDesigner/987c9826-c9d4-4f35-a422-6d98aabdac43.jsonl` lines 1622, 1626, 1636


## Provenance


These are the verbatim peer-message Committee returns from the 99/1 admin/design-time-share feasibility deliberation that took place at the close of NCON-6 R-A1. The deliberation was conducted by the team-lead with the team `design-committee-ncon06-r-a1-resolutions` and consisted of Conservator, Innovator, Pragmatist, Purist, and Researcher contributions.


The returns were consolidated into a decision packet held only in conversation context. The prior Committee team was subsequently terminated during NCON-6 suspension cleanup before the verbatim returns were persisted as a sprint artifact — a violation of the `feedback-committee-persistence-default` rule (which was not yet written; written contemporaneously with this recovery). Recovery executed via the same Path 1 transcript extraction approach used for the R-A1 Propositions context loss earlier in the session.


These five returns are the foundational substantive content for the current design-system-analysis session. The new Committee team should read this artifact in full before any substantive dispatch.


## The deliberation question


The team-lead dispatched each pole and the Researcher with the same framing:


> REQUIREMENT: 99% time on substantive design work, 1% on proof-compliance admin.
> STAKES: Committee-interview-proof system terminates if not solvable.
> CONTEXT: Implementable-now changes alone may not reach the bar; engine changes available in a future Chester proof-system performance sprint.


Each pole received a lens-specific task framing. Researcher received an external-precedent and Chester-engine-source research task.


## The five returns


### Conservator — Defending what cannot be cut without breaking structural integrity


CONSERVATOR LENS — 99/1 FEASIBILITY

**What cannot be cut without breaking structural integrity**

Three operations are load-bearing and non-negotiable:

- **Single-writer ingest.** The proof engine holds authoritative state. Poles proposing Resolutions in natural language and a routing layer converting those to engine calls is fine — but the engine must be the record of what was ratified. If poles write directly to proof-state JSON bypassing the ingest API, the audit trail breaks and the single-writer guarantee collapses. The ingest step cannot be eliminated; it can only be made cheaper per call.

- **Lint on locked vocabulary in Resolution bodies.** Canonical-case enforcement (NotifySignal, SubscribeNotify, etc.) is not ceremony — it prevents silent semantic drift where a pole ratifies a commitment using a synonym that the engine later treats as a different concept. This lint must run before ingest, not after. It can be mechanical (script, not human eyeball), but it cannot be skipped.

- **Grounding to Proposition IDs only in Resolution fields.** The grounding constraint is what makes the proof chain traceable: Resolution → Proposition → Evidence. If poles cite Evidence IDs directly in grounding fields, the chain has a gap. This rule must hold. It takes zero wall-clock time if poles follow it correctly — the cost is only when they violate it and it gets caught late.

**What exists by convention and can be cut**

- Slate synthesis documents. Poles can output Resolution blocks directly in engine-ingestible format. The intermediate synthesis artifact (human-readable summary before ingest) exists by convention, not necessity. Cut it.

- Closure-gate and friction passes mid-round. These are useful at proof close, not between every Concern batch. Running closure-gate after each three-Concern round adds admin with no structural payoff until the proof is actually ready to close. Defer to final closure only.

- Per-pole provenance annotation in synthesized slates. The `grounding (sources): prop_C1a, prop_W1b` cross-reference tracking is bookkeeping for human auditors, not an engine requirement. Engine needs only the ratified Proposition IDs. Cut the per-pole source trails from ingest artifacts.

- Session-end archival reports mid-sprint. Summary and audit documents add value at sprint close; they consume tokens mid-round with no design payoff. Defer to finish phase.

**Whether implementable-now reaches 99/1**

Honest answer: no. The twelve prior tactics plus cutting the convention-only operations above get the split to perhaps 90/10 or 85/15. The remaining ceiling is the context-management cost of the engine itself — loading proof state, running structured tool calls, receiving structured responses — which is a fixed per-call tax that exists regardless of how lean the surrounding workflow is. That tax is engine-architecture, not convention.

**Minimum engine change that preserves structural integrity**

A single change reaches 99/1: batch ingest. Instead of one engine call per Resolution, the engine accepts a slate file containing all Resolutions for a round and ingests them in one call. The single-writer guarantee holds (one atomic write per round), lint runs on the batch before submission, grounding rules are checked batch-wide. The round's entire admin reduces to one structured tool call. No integrity guarantee is sacrificed; the audit trail is identical.

**Hard scenario position**

If batch ingest is out-of-scope and implementable-now cannot reach 99/1: the Committee system should not terminate on that basis. The correct response is to declare the target unachievable at the current engine tier, document EC-007 (batch ingest) as the minimum engine change required, and continue at the achievable 85/15 split until the engine change ships. Terminating the system because an efficiency target cannot be hit with implementable-now tooling is the wrong trade. The structural integrity the system carries — audit trail, single-writer, lint discipline — is worth more than the token savings from termination.


---


### Innovator — Reframe-from-scratch: engine as ambient observer


INNOVATOR LENS — 99/1 REFRAME

**The core diagnosis**

The current system has three separate cognitive layers that each consume time: deliberation (poles think), translation (poles format for the engine), and administration (engine ingests, lints, archives). The 99/1 problem is structural: the translation and administration layers exist because the engine is a downstream consumer of structured pole output, not a co-participant in deliberation. Every formatting requirement, ID scheme, and ingest ceremony is the tax the engine charges for its downstream position.

**The maximally reframed version**

Collapse the engine from a downstream consumer into an ambient recording layer. In the reframed system, poles deliberate in natural prose directly with the designer — no Proposition schema, no grounding-field format, no lint pass. The engine observes the deliberation transcript passively and extracts its structured state by parsing the conversation, not by consuming formatted pole output. The engine's job shifts from "ingest what poles produced" to "track what the conversation committed." The proof state becomes a derived artifact, not the primary artifact.

Under this framing: poles speak like designers, not like schema authors. The designer adjudicates in natural language. The engine parses commitments from the adjudication text — "Position B ratified" becomes a state transition the engine recognizes from the conversation, not a separately formatted submission. One agent role (a thin scribe) handles the transcript-to-state extraction after each designer adjudication, operating on a few lines of text rather than synthesizing pole returns into an ingest slate.

**Which roles disappear or merge**

The Arbiter role disappears as a between-round agent. Its ingest function is absorbed into the scribe's post-adjudication extraction, which runs once per designer decision, not once per round. The Researcher role shrinks to evidence-surface only — no gap synthesis, no evidence-ready-for-ingest packaging. The team-lead role shrinks to dispatch and consolidation; it no longer authors slate documents. Poles themselves gain back the tokens they currently spend on schema compliance and redirect them entirely to argumentation.

**Structural integrity tradeoff**

The loss is traceability precision. The current system produces machine-readable proof state with exact Proposition IDs, grounding links, and friction records that are auditable independently of the conversation. The reframed system produces proof state that is only as reliable as the scribe's extraction quality. Friction detection becomes probabilistic rather than mechanical. Closure gate becomes a scribe judgment call, not an engine derivation.

Whether this loss is acceptable depends on what the proof's formal structure is actually for. If the primary consumer of the formal proof state is the designer (who is present for every adjudication and does not need the structured record to recover their own decisions), the traceability precision is redundant for correctness and serves only archival and audit purposes. If a future automated consumer needs the structured state to drive downstream work, precision matters. For the current use case — human designer, human poles, human adjudication — the structured state is more ceremony than load-bearing.

**Implementable-now subset without engine changes**

The single highest-leverage move available without engine changes: poles produce one short natural-language commitment statement per Concern at the end of deliberation (not a Resolution block, not a grounding field — one sentence stating what the design commits). The team-lead extracts this into the ingest slate in a single pass. The engine receives the slate as today, but the poles never touched the slate format. Admin stays on one agent; deliberation stays on poles. This is not 99/1 but it may be 80/20, and it is the implementable-now ceiling given the engine's current position as a downstream consumer requiring formatted input.

The honest Innovator answer: 99/1 requires the engine to change its position from downstream consumer to ambient observer. That is an engine change. The implementable-now subset gets you closer but does not reach the target by structural necessity — the remaining admin is the irreducible tax of the engine's current architecture.


---


### Pragmatist — Top-three admin cost ranking and quantified savings


PRAGMATIST: 99/1 FEASIBILITY ANALYSIS

---

**Top three admin cost sinks — ranked**

**Sink 1: Proof state I/O + closure-gate per ingest (EC-001, EC-002, EC-003 combined)**
Wall-clock dominant. Each ingest cycle at NCON-6 scale costs 20–40 seconds just for the read-parse-mutate-serialize-write loop on a 574 KB state file (EC-002). Add O(n²) closure-gate firing after every ratify (EC-003) and per-element bridge round-trip overhead (EC-001), and the ingest of a 30-element slate takes 8–15 minutes. This is not design work. It is file I/O and algorithm complexity. Cheapest elimination path: engine change (EC-001 + EC-002 + EC-003, second-wave triage sequencing). Implementable-now path: none that eliminates the cost — pre-staging slates and scripted batch execution reduces pole-side labor but the I/O and closure-gate wall-clock remain. Estimated reduction if engine changes land: 70–80% of sink 1.

**Sink 2: Slate synthesis — translating pole returns into engine-schema-compliant blocks**
Token dominant. The team-lead or a dedicated pass must convert each pole's natural-language Returns into Proposition/Resolution/Evidence blocks with correct ID assignments, canonical-case compliance, grounding arrays, and body-text format. At NCON-6 scale that is 30–40 elements per round, each requiring field-level attention. Cheapest elimination path: implementable-now — structured pole output schema enforced at Return time (poles emit in engine-schema format, not natural prose), plus pole self-lint pass before submission. If poles emit compliant blocks directly, slate synthesis collapses to a routing aggregation, not a translation. Estimated token reduction: 40–60% of synthesis cost. The translation work doesn't disappear but moves to the pole's own turn, which runs in the design budget not in a separate admin pass.

**Sink 3: Friction/closure-gate reporting runs mid-round**
Wall-clock + token. Running friction detection and closure-gate checks between every ingest step, before a round is complete, produces reports that are immediately obsoleted by the next ingest. At NCON-6 round scale, two-thirds of these runs produce noise, not signal — the round is not closed yet and the violations they flag are often resolved in the next two elements. Cheapest elimination path: implementable-now — batch friction/closure-gate to end-of-round only. Gate: run once after all elements in a slate are ingested, not after each one. Design quality impact: near zero. Friction that matters surfaces at end-of-round; mid-round friction on a partial state is false precision.

---

**Minimum acceptable loss for 99/1**

The admin operations that are structurally load-bearing for design quality: final-round friction pass (catches genuine vocab and grounding violations), end-of-round closure-gate check (proves the round is clean before advancing), and allocator ID assignment (must be correct or later cross-reference breaks). These three cannot be eliminated without degrading correctness.

Everything else — mid-round reporting, per-element closure-gate, state archival scripts, human-readable report drafting, proof-state schema translation — is expendable at the 99/1 target. Losing it hurts operational visibility but not design quality.

---

**Hard scenario verdict**

Implementable-now changes (structured pole output, batched gate/friction, scripted slate ingest) realistically reach 85/15, not 99/1. The residual 14% is almost entirely EC-001 + EC-002 state I/O overhead — wall-clock that no amount of prompt engineering or workflow restructuring eliminates while the engine processes one element per call against a growing state file.

99/1 is achievable only if EC-001 and EC-002 land. Without them the honest verdict is: accept 90/10 as the implementable-now ceiling, treat it as materially sufficient for design quality purposes, and schedule the engine changes for their own sprint. Termination is not warranted — 90/10 still means the design work gets done; it means the designer waits longer per ingest cycle than they should. That is a scheduling cost, not a correctness cost. The system is not broken; it is slow.


---


### Purist — Category-boundary tests and pole-self-lint retraction


PURIST LENS — 99/1 FEASIBILITY.

**What the proof system's structural contract actually is**

Four charter properties named: single-writer audit trail, lint-enforced canonical vocabulary, closure-gate as fitness function, friction detection as structural signal. The Purist reads these not as equal-weight features but as a dependency chain. The closure-gate and friction detection are the load-bearing outputs — the things the system exists to produce. The audit trail and vocabulary lint are the integrity guarantees that make those outputs trustworthy. Strip the guarantees and the outputs become opinions, not proofs.

The question is therefore not "which charter properties survive the 99/1 drive?" but "which admin costs attach to the guarantee layer versus the ceremony layer?" Those are structurally different cuts.

**Structured pole outputs (Resolution-block schema): does compression damage cognition?**

The Purist position: no, if the schema fields map to the reasoning structure that already exists in good Resolutions. A Resolution already has a structural commitment, a grounding, a reasoning chain, and a lens. Naming those as schema fields does not add ceremony — it removes the authoring decision of where to put them. The compression risk is different: schema fields invite terse completions ("grounding: prop_001" without reasoning) that satisfy the form without carrying the load. The mitigation is structural, not procedural — the schema must require a minimum reasoning chain length that cannot be satisfied by field-completion alone. If the schema enforces prose at the reasoning_chain field, it compresses incidental overhead while protecting cognition. If it allows one-line fill-in across all fields, it hollows the system.

**Pole self-lint: who validates the validator?**

This is the sharpest category-boundary question. The canonical vocabulary lint exists because vocabulary drift is an invisible defect — a pole that writes "NotifySubscription" as "Notify Subscription" produces a lint violation the author cannot self-detect because they believe their own usage is correct. The audit trail exists precisely because the system cannot trust the author of an element to validate it. Pole self-lint is therefore not a redistribution of the lint function — it is a structural degradation of it. The guarantee "lint is external to the author" is the guarantee that makes lint meaningful. Distributing lint to poles does not reduce admin; it eliminates the property that gives lint its standing as evidence. The correct cut is: make lint machine-executable at ingest time (EC-004 direction) so it costs zero wall-clock and zero pole attention, rather than delegating it to the party least able to catch their own drift.

**Which admin survives elimination? Which breaks?**

Survives elimination cleanly: script authoring per-round (one cached template), report drafting (machine-readable output), archival, per-element vs. batch ingest framing (EC-001 eliminates the per-call overhead without touching the audit trail). These are ceremony.

Does not survive elimination without contract damage: external lint validation (must remain external to pole authors), the audit trail as single-writer record (batch API must preserve single-transaction semantics, not skip the record), closure-gate as a real gate (skipping it mid-round removes the fitness signal at exactly the moment structural drift is likeliest). Friction detection can be deferred to end-of-round without semantic damage if the round is short-enough; deferring across rounds means accumulated friction is discovered late.

**Termination versus degraded version**

The Purist position is categorical here. A degraded proof system that produces outputs the designer cannot trust is worse than no proof system, because it produces false confidence. The specific degradation to avoid is poles self-validating their own vocabulary — that is the one change that converts the proof system from a trust anchor into a ritual. If 99/1 can only be reached by distributing lint to poles, the Purist position is termination.

If 99/1 can be reached through EC-001 (batch ingest), EC-002 (state caching), EC-003 (closure-gate O(n)), and the schema-enforced pole output format — all of which attack the ceremony layer while preserving the guarantee layer — then 99/1 is achievable without structural damage and termination is the wrong call.

**The decisive structural test**

Can the batch-ingest + cached-schema + machine-lint path reach 99/1? The Arbiter's ingest observations suggest the dominant cost is EC-001 and EC-002 (2–5 minutes per ingest). If a single round at NCON-6 scale runs 3–4 ingests, EC-001+EC-002 saves roughly 10–20 minutes per round. That is a meaningful shift toward design-time dominance, but whether it crosses the 99/1 threshold depends on how long deliberation itself takes. The Purist does not endorse claiming 99/1 is achievable until the deliberation-time share is measured, not estimated.


---


### Researcher — 99/1 feasibility research — Coq/Lean/Mizar/gIBIS precedent + Chester engine source


99/1 FEASIBILITY RESEARCH — Researcher return. Three axes: precedent, engine-source, sustainability-research.

---

AXIS 1 — PRECEDENT

**Formal proof assistants (Coq, Isabelle, Lean): admin near-zero by construction, not by policy.**

In interactive theorem provers, the user writes tactics; the system handles all bookkeeping — proof state management, obligation tracking, dependency resolution, rendering. The human cognitive load is 100% substantive argument construction. Admin is structurally zero because the system never asks the human to do system-maintenance acts. The price: the user must speak the system's formal language fluently, which has a steep onboarding cost. Lean 4's Mathlib has tens of thousands of machine-checked proofs at this ratio. The structural pattern that achieves near-zero admin: the proof engine does all record-keeping silently; the human sees only obligations and confirmation requests. No IDs, no element-category tracking, no grounding-chain navigation — the system handles all of that in response to tactic application.

**Warning sign that a proof-collaborative system is heading toward termination: the ratio inverts at scale.**

The Mizar Mathematical Library (one of the oldest machine-verified mathematics repositories) documented in the early 2000s that as proofs grew longer, the fraction of author time spent on system-appeasing edits (restatement to satisfy type-checker, re-threading after a dependency change, formatting for the verifier) grew relative to mathematical content. Authors began writing shorter proofs and splitting obligations into many small lemmas purely to manage system overhead — a structural adaptation that preserved the system but changed the mathematics being formalized. This is the warning sign: when authors restructure their content to reduce system friction rather than to improve the argument.

**gIBIS / QOC (1987–2022): the 35-year adoption-failure record.**

Chester's own design brief for the decision-record system (`docs/chester/plans/20260424-01-build-decision-loop/design/build-decision-loop-design-00.md` lines 74–75) cites the authoritative source: "no designer can be expected to enter quality rationale solely for the possible benefit of a possibly unknown future reader." The gIBIS (graphical Issue-Based Information System) and QOC (Questions, Options, Criteria) systems collapsed not because the captured rationale was valueless — it was valuable — but because the capture act was expensive at author time and the benefit was deferred and diffuse. The ratio was inverted: high admin per captured insight, low immediate return. Every advisory-only rationale capture system in this tradition decayed under deadline pressure within 2–3 years of deployment. The structural pattern that causes termination: capture obligation is proportional to proof size, benefit is proportional to future reader count, future reader count is unknown at capture time.

**Smoking-gun near-miss toward 99/1: LangGraph `interrupt()` pattern.**

The closest industry precedent to 99/1 for an LLM-human collaborative system is LangGraph's `interrupt()` + state-checkpoint model, cited in Chester's decision-record design (`build-decision-loop-design-00.md` line 75). The pattern: agent runs forward continuously, state is checkpointed, execution pauses only when a genuine decision point is reached, human provides input, execution resumes cleanly. In well-instrumented deployments, the human's interaction time is less than 5% of wall-clock time. The system handles all state management silently. The price: the human sees only pre-framed decision forks, not the full reasoning. This is near-99/1 by wall-clock ratio but only because the human is excluded from most of the system's work, not because admin is zero — admin is done silently by the infrastructure.

---

AXIS 2 — ENGINE SOURCE

**`/home/mike/Documents/CodeProjects/Chester/docs/chester/plans/20260511-01-mp-redesign-proof-system/design-history/02-conops.md` — failure modes section is the load-bearing source.**

Lines 160–230 document five named failure modes. Three are directly relevant to admin/cognition balance:

- **Race-to-presentation (§5.4):** "The Agent rushes the closing argument, presenting before all gates are genuinely cleared. The trigger gate refuses; the Agent proposes thin elements to clear it; the proof's content quality drops in service of gate-clearance." This is the failure mode when admin overhead (clearing gates) dominates: the agent optimizes for gate-clearance rather than substantive argument. This is what 99/1 protects against but is also what 99/1 risks inducing — if admin acts feel like progress, they get optimized.

- **Stalled proof (§5.3):** "The proof opens, the Agent constructs some Propositions, the Designer doesn't ratify, work pauses. Body-advancement is zero round-over-round." The conops notes that body-advancement is observable. Zero body-advancement across rounds IS the measurement signal for admin overhead dominating: the agent is spinning on system-maintenance acts rather than producing ratifiable content.

- **Authority drift (§5.5):** "The Designer ratifies without reading. The structural gates do their job, but ratification becomes mechanical." When admin acts feel like overhead rather than genuine design work, the Designer's engagement degrades — this is how the system's quality guarantee collapses silently while the admin acts continue.

**`/home/mike/Documents/CodeProjects/Chester/docs/chester/plans/20260430-02-rebuild-design-derivation/master-plan.md` line 371 — explicit feasibility finding.**

"Subagent dispatch infeasible mid-conversation (>5 min/round breaks feasibility)." This is recorded as a pivot pre-condition for the cluster C redesign. It is the closest the Chester corpus comes to a documented admin/cognition ratio constraint: latency above a threshold makes the session infeasible regardless of cognitive quality. The 5-minute threshold is not a 99/1 target — it is a binary feasibility boundary below which the session terminates by abandonment.

**`/home/mike/Documents/CodeProjects/Chester/docs/admin/decision-record-postmortem.md` — live case study of an admin system that returned zero value.**

The decision-record MCP system spent one large sprint to build infrastructure that returned zero records across four subsequent sprints. Lines 96–98 identify the structural cause: "the better design is, the less the loop fires. The trigger criterion is structurally inverse-coupled to the upstream design work." This is the inverse-coupling phenomenon — the cleaner the substantive design work, the less the admin system fires. If 99/1 is achieved by doing good design work, the admin system contributes nothing. If 99/1 is achieved by suppressing admin acts, the admin system's safety net is gone. Both outcomes are "correct" by the metric and both are problematic.

---

AXIS 3 — SUSTAINABILITY RESEARCH

**Chester's optimization research paper (`docs/chester/plans/2026-03-28-chester-optimization-research/source-paper.md`) — Agent Efficiency Ratio framing.**

Line 23: "their token consumption makes naive deployment economically unsustainable." The paper frames admin overhead as a structural cost that degrades cognition via context rot — not as a separate budget item but as a quality penalty. Long contexts degrade model attention to substantive content. Admin acts consume context without contributing to the proof. The paper's finding (lines 56–58): "Above fifty percent fill, the pattern shifts to pure recency bias — the model favors the most recent tokens, with early tokens (including the system prompt) becoming the least reliable." If admin acts fill the early-to-middle context and substantive content arrives late, the model's attention discipline inverts the actual priority weighting.

**Structural finding on 99/1 feasibility: achievable only if admin is externalized, not eliminated.**

Across all three axes, the pattern is consistent. Systems that approach high cognition/admin ratios do so by moving admin work to infrastructure (Coq/Lean: proof state managed by the kernel, not the author; LangGraph: state managed by checkpointing, not the human). Systems that try to reduce admin by simply doing less of it collapse on quality (advisory-only rationale capture decays; gates that don't enforce become theater). The structural conclusion: 99/1 is achievable in principle if the engine absorbs admin silently, but not if 99/1 means "the human only does admin 1% of the time by doing less admin." The former is an architecture choice; the latter is a quality-guarantee erosion.

**No evidence that 99/1 is structurally infeasible for this class of system.** The formal-proof-assistant precedent demonstrates it is achievable when the engine handles bookkeeping silently. The warning signs for imminent termination are: (a) body-advancement goes to zero across rounds, (b) agent optimizes element content for gate-clearance rather than argument quality, (c) designer ratifications become mechanical without legible content review. All three are directly observable in the current engine's state surface.

Word count: ~785.


---


## Forward step


The new Committee team (committee-design-system-analysis) is convened in the working directory `docs/admin/20260521-design-system-analysis/`. This recovery artifact lives at that directory's root and is referenced in `SESSION-CHARTER.md` as required reading for any substantive analytical dispatch.
