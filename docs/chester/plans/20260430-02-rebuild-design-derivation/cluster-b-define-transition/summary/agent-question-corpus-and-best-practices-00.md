# Agent Question Corpus and Best Practices

A synthesis report on how AI agents asked questions of human designers across StoryDesigner and Chester design-interview history. The report categorizes the question shapes that surfaced, evaluates productivity per category, names the LLM-specific failure modes that recur, and recommends a corpus of best-practice question templates the design-large-task skill should encode going forward.

## Scope and Method

Three research passes fed this synthesis:

- **StoryDesigner harvest** — six sessions sampled (`a59aaa50`, `478a2e77`, `ef47db8f`, `b599ccde`, `f1ee21b0`, `58af1540`). ~14,300 assistant lines surveyed; ~257 verbatim agent-asked questions extracted across the four primary interview sessions.
- **Chester harvest** — eight sessions sampled (`3bf0dff8`, `eaf11901`, `23746278`, `5475984a`, `8b24f305`, `a2f6e078`, `64737158`, `3710a456`). ~420 distinct agent-asked questions surveyed; ~50 verbatim cited.
- **LLM industry research** — five peer-reviewed LLM-as-interviewer studies (LLMREI, ReqElicitGym, Elicitron, mistake-guided follow-up generation, anchoring-bias studies) plus human-interview methodology (cognitive interviewing, funnel technique, knowledge engineering vocabulary discipline, acquiescence bias).

Sister documents (full text in this folder):
- `research-storydesigner-harvest-00.md`
- `research-chester-harvest-00.md`
- `research-llm-interview-traits-00.md`

## Convergent Findings

The two independent harvests produced strikingly similar taxonomies. Both surfaced eleven categories with substantial overlap. Both identified the same dominant LLM failure modes. Both flagged the same human-rebuke patterns. The convergence is the single most important signal: across two unrelated codebases, two unrelated designers, hundreds of sessions, the agent's question patterns repeat. The patterns are properties of the *agent*, not properties of the *project*.

### Unified Question Taxonomy

Twelve categories normalized across both harvests, ordered roughly by frequency:

| # | Category | StoryDesigner % | Chester % | One-line definition |
|---|---|---|---|---|
| 1 | Open-pull / "What do you think?" | ~30% | ~9% | Bare invitation after an information package |
| 2 | Forked option-pick | (subset of #5) | ~32% | "Want me to do X, or Y?" — two named alternatives |
| 3 | Confirmation / readback | ~10% | ~17% | Agent paraphrases its understanding, asks for match |
| 4 | Forced-choice ratification | ~15% | (subset of #2) | Explicit option-pick at proof-update / acceptance gates |
| 5 | Boundary-bound dichotomy | ~12% | (rare) | "Settle X this session, or punt to downstream Y?" |
| 6 | Numbered probe-list | (rare) | ~11% | 2–4 numbered questions with sub-options each |
| 7 | NC / element ratification | ~8% | (subset of #3) | "Does NC-B hold?" formal proof gate |
| 8 | Diagnostic short-list | (rare) | ~8% | Bug repro form: "Which skill?", "What symptom?" |
| 9 | Vocabulary lock-in | (rare) | ~6% | "Tell me if any of these names don't match" |
| 10 | Self-pessimist red-team | (rare) | ~5% | Three failure-axis candidates, designer rates |
| 11 | Stacked-clause | ~7% | (subset of #2) | Two questions bound by *and* / *or* in one turn |
| 12 | Negative check / consequence probe | ~3% | ~2% | "Under your reading, doesn't X break Y?" |
| — | Designer-authority check | ~2% | (rare) | "Is this your direction, or am I projecting?" |
| — | Strict-vs-loose-reading flag | ~5% | (rare) | Surfaces ambiguity in human's last utterance |

The taxonomy is unified, but frequencies differ between corpora. StoryDesigner skews toward open-pull and boundary-bound dichotomies (the design-experimental flow used heavily). Chester skews toward forked option-picks and numbered probe-lists (problemfocused-flow turn structure encourages this).

### Convergent Productivity Pattern

Both harvests identified the same shapes as *most* productive:

- **Boundary-bound dichotomy** ("does this session settle X, or punt to downstream?") — the most consistently productive shape in StoryDesigner; matches Chester's "closure offers always name the next pipeline step" pattern
- **Self-pessimist three-axis red-team** ("Where this might miss your vision: 1. Granularity wrong … 2. Wrong locus … 3. Adjacent miss") — Chester's highest-productivity shape in necessary-condition iteration; StoryDesigner's "designer-authority check" plays the same structural role
- **Negative-check / consequence probe** ("If we go with reading two, the locked two-path constraint is at odds with the per-concept surface") — most epistemically generative shape in StoryDesigner; rare in Chester corpus but present
- **Information Package + tight ratification** — both corpora confirm: human responds with one word and the proof moves *if and only if* the IP did the narrowing work
- **Vocabulary lock-in as discrete pre-Solve step** — Chester's `23746278` burned 25 lines on glossary; productive because it ate the cost upfront
- **Echo-back with weaker fall-backs offered** — "Does the iff-bridge framing match — or is the answer simpler (bounding-only) — or weaker (commitment-only)?" — lets designer downgrade without rejecting

### Convergent Anti-Pattern

Both harvests independently identified the same failure modes:

- **Stacked clauses bound by *and* / *or*** — designer explicitly rebuked the agent: "stop asking dual questions in the same sentence" (StoryDesigner `ef47db8f`); Chester's user-feedback memory captured the same rebuke as `feedback_question_format`
- **Reflexive "What do you think?" without narrowing** — StoryDesigner `a59aaa50` had nine in one session, degraded human response to single tokens; Chester `23746278` used it seven times
- **Proof-vocabulary leakage** — designer revolted: "your jargon level in your writing is about a 5. lets simplify to about a 3" (StoryDesigner `b599ccde`); Chester's solve-vocabulary leakage in problem-side openers (`5475984a` Turn 21) is the same pattern
- **Premature drafting forks** — Chester's "Want me to draft X, or sketch Y?" dominates at ~32%; StoryDesigner's "Approve the reshape, or want adjustments?" is the same forced-forward-motion shape; *neither corpus has a single "sit one more turn" branch*
- **Push-options-at-designer when pull-from-designer was called for** — StoryDesigner's "asking the human to do the agent's work"; Chester's `5475984a` Turn 33 is the canonical specimen
- **Presumed-knowledge questions** — agent asks the codebase, not the designer (StoryDesigner `478a2e77`: "is severity/diagnostic enum vocabulary fully on Domain.Contracts post-A1?")
- **Confirmation-bias readback** — agent paraphrases human's prior utterance in a *direction* that fits its own model, then walks back when challenged
- **Closure-margin slop** — short option-picks without inline option naming; observed in both corpora at session end

## LLM-Specific Behaviors With Industry Grounding

The harvest patterns map cleanly onto documented LLM cognitive biases. The harvests describe phenomena; the industry research names mechanisms.

### Completion Bias / Drive Toward Closure

**Harvest evidence.** Chester: "draft X or sketch Y" forks account for ~32% of all questions; agent never offered "sit one more turn." StoryDesigner: agent began designing integration-test apparatus before designer had ratified scope; designer eventually said "we are writing a plan to plan, not the actual refactor itself."

**Industry mechanism.** ReqElicitGym demonstrates LLMs favor probing questions over clarification questions, but probing is "consistently less effective" in many contexts. The model's gradient pulls toward producing artifact rather than expanding understanding.

**Verdict.** The most pervasive LLM-specific tic in the corpus. Structural mitigation required — prompt-only mitigation has not worked across hundreds of sessions.

### Vocabulary Colonization / Translation-Gate Failure

**Harvest evidence.** Both corpora flagged proof-vocabulary leakage as a recurring failure. StoryDesigner: "Does NC-B hold?" / "EVID-4 naming…" / "Architect C…" — designer revolted. Chester: solve-vocabulary in problem-side openers (`5475984a` turn 21) cost two reframes to recover. Caveman mode (StoryDesigner `478a2e77`) decayed within three turns.

**Industry mechanism.** Knowledge engineering literature treats jargon use as a first-order failure mode of expert elicitation. The LLM's training is heavily weighted toward technical content; reflexive mapping of domain language to technical vocabulary is the default. No documented automated mitigation exists for LLM interview contexts.

**Verdict.** The Translation Gate the design skill nominally enforces leaks consistently. The leak is always *toward* the proof side — the agent never creeps toward more colloquial vocabulary, only more technical.

### Anchoring on First Interpretation

**Harvest evidence.** StoryDesigner's confirmation-bias readback pattern: "agent paraphrases human's prior utterance in a *direction* that fits its model… optimistically project the human's position forward, then walk back when challenged." Chester's `5475984a` post-mortem flagged the same shape — agent presented four success axes, designer pushed back, agent ran deletion test reactively rather than pre-emptively.

**Industry mechanism.** GPT-4's anchoring index is 0.45 (humans 0.61). Chain-of-Thought, explicit "ignore this anchor" prompts, and reflection prompting do not eliminate the effect. The only partially-effective strategy is providing multiple contrasting anchors (both-anchor strategy).

**Verdict.** The "walk-back is graceful but the projection is structural" observation in StoryDesigner is consistent with the documented anchoring mechanism. Self-deletion test discipline (Chester `eaf11901`) is the practical mitigation that works.

### Verbosity Compensation

**Harvest evidence.** Stacked-clause questions (~7% in StoryDesigner, dispersed in Chester) cluster around moments where the agent is uncertain. Chester's `3bf0dff8`: "Want me to red-team this set, draft the MCP enforcement architecture, or write this as a feature-dev brief like the prior turn?" — three options bundled when one would do.

**Industry mechanism.** Verbosity Compensation: when uncertain, LLMs generate longer outputs. GPT-4 exhibits VC frequency of 50.4%. LLMREI independently found avoiding lengthy questions is a measurable quality dimension where structural prompting helps.

**Verdict.** Multi-part questions compound double-barreled question harm with verbosity-compensation harm. The mitigation is structural conciseness constraint, not exhortation.

### Sycophancy / Confirmation Bias

**Harvest evidence.** StoryDesigner's "confirmation-bias readback" — agent projects human's position forward, then walks back. The walk-back is the mitigation; the projection is the failure. Chester's confirmation-pattern productivity declined when paired with thin info-packages — the agent was asking "Confirm?" without first laying out what was being confirmed.

**Industry mechanism.** RLHF-trained models have a documented disposition to agree with the user's expressed position. Sycophancy is measurably stronger under repeated pushback. No reliable prompting-only mitigation; structural interventions (adversarial persona, explicit dissent instruction) show partial effect.

**Verdict.** The "internalized pessimist" pattern Chester `util-design-partner-role` encodes (single agent, multiple roles) is a documented partial mitigation. Working as intended in the highest-quality sessions; absent in the worst ones.

### Coverage Blindness

**Harvest evidence.** Both corpora show the agent asking for *features* and *mechanisms* but rarely asking for *constraints*. StoryDesigner's "negative check / consequence probe" was rare (~3%) but the highest-productivity shape when it appeared. Chester's "productive challenge" category was the rarest (~2%) and almost never originated by the agent.

**Industry mechanism.** ReqElicitGym demonstrates the best LLM interviewers elicit only ~32% of implicit requirements. Style-related requirements are nearly invisible (~1%). LLMs default to feature-probing over constraint-probing.

**Verdict.** The agent's question generator has a documented bias toward functional/positive elicitation. Constraint-side probing requires structural prompting — it is not the default.

### Push-vs-Pull Asymmetry

**Harvest evidence.** Chester `5475984a` Turn 33 named this directly — "voice rule wants the agent to probe what the designer carries; the agent's habit is to imagine the options and ask which fits." StoryDesigner's "asking the human to do the agent's work" is the same anti-pattern from the designer's complaint side.

**Industry mechanism.** No specific industry research names this pattern, but it is consistent with verbosity compensation (model can always generate more options) plus completion bias (model wants to drive toward closure). Restraining generation is structurally harder for an LLM than producing it.

**Verdict.** The model can always generate options. Restraint must be enforced structurally — through skill prompts that explicitly forbid imagining-then-picking, or through a "what do *you* think?" template that excludes embedded options.

## Best-Practice Templates

The corpus produces a small number of high-yield question shapes. Each below is grounded in verbatim harvest examples with their source-session citations. These are the templates the design-large-task skill should encode.

### Template 1 — Boundary-Bound Dichotomy

**Shape.** "Does this session settle X, or punt to downstream Y?"

**Verbatim source.** "Does LBD 9.1 spec that relocation, or is it a downstream task under Sprint B2/B6?" (StoryDesigner `b599ccde` 405); "Is provenance preservation a requirement you'd want to pin down now, or one you'd rather leave to the relocation options to surface?" (`478a2e77` 82).

**When to use.** Whenever the designer's answer to the prior turn implies a scope question. The agent surfaces the scope dichotomy explicitly rather than letting the proof drift.

**Why it works.** Designer answers in one sentence, decisive. Proof advances. Cuts scope cleanly.

**LLM-bias coverage.** Counters anchoring (forces explicit scope rather than implicit drift), counters completion bias (the "punt" branch is always available).

### Template 2 — Self-Pessimist Three-Axis Red-Team

**Shape.** "Where this might miss your vision: 1. Granularity wrong … 2. Wrong locus … 3. Adjacent miss … Pick: does this land, need adjustment on one of those axes, or replaced entirely?"

**Verbatim source.** Chester `eaf11901` C2: full template used systematically through C1 → C2 → C3 → C4 iteration. StoryDesigner's "designer-authority check" plays a structurally similar role: "But that's my read. The condition needs your authority to stand. Is X your direction, or am I projecting?" (`f1ee21b0` 696).

**When to use.** As the closing question of any necessary-condition proposal, any architecture-choice presentation, any element ratification. Replaces bare "What do you think?"

**Why it works.** The agent has done the red-team work itself; the designer rates the agent's red-team rather than originating one. Converts unstructured discovery into structured ratification. The three axes — granularity / locus / adjacency — generalize across most design content.

**LLM-bias coverage.** Counters confirmation bias (the agent has actively looked for ways its own proposal fails before asking), counters coverage blindness (constraint-probing is built in), counters anchoring (alternatives are surfaced before the question lands).

### Template 3 — Designer-Authority Check

**Shape.** "But that's my read. The condition needs your authority to stand. Is X your direction, or am I projecting?"

**Verbatim source.** StoryDesigner `f1ee21b0` 696, 674.

**When to use.** Whenever a Rule, Permission, or designer-direct element is being proposed by the agent. The check explicitly names that the agent is inferring rather than recording designer intent.

**Why it works.** Highest signal-per-token in the StoryDesigner corpus. The designer can't reflexively ratify; they have to take a position. Inverse of presumed-knowledge anti-pattern.

**LLM-bias coverage.** Counters sycophancy at its most dangerous moment — when the agent is about to lock something as designer-authoritative.

### Template 4 — Negative-Check / Consequence Probe

**Shape.** "If we go with reading two, the locked two-path constraint is at odds with the per-concept surface. Either parsing failures are build-engine-visible somehow, or the gate's blocking set is narrower than it is today. Which way does that cut?"

**Verbatim source.** StoryDesigner `478a2e77` 119. Also `f1ee21b0` 491.

**When to use.** When the agent has surfaced a tension the designer hasn't named. Forces the designer to acknowledge the consequence and pick a side.

**Why it works.** The most epistemically generative shape in the StoryDesigner corpus. Produces *new* design content rather than just ratifying existing.

**LLM-bias coverage.** Counters coverage blindness (constraint-probing rather than feature-probing), counters anchoring (forces multi-direction examination).

### Template 5 — Strict-vs-Loose-Reading Flag

**Shape.** "Two readings of [phrase]. Loose: [interpretation A]. Strict: [interpretation B]. Was the loose reading what you had in mind, or were you reaching for the strict version?"

**Verbatim source.** StoryDesigner `ef47db8f` 417.

**When to use.** When the agent recognizes its own ambiguity in the human's last utterance. Surface the ambiguity rather than picking one and proceeding.

**Why it works.** Human consistently corrects to one of the two readings. The shape surfaces a vocabulary mismatch the agent had been operating under tacitly.

**LLM-bias coverage.** Counters anchoring (forces the agent to explicitly notice and offer alternative interpretations rather than locking on one).

### Template 6 — Vocabulary Lockdown

**Shape.** Present a glossary block (5-15 lines: element types, phase names, anchor concepts, named gaps). Close with: "Tell me if any of these names or definitions don't match how you think about it. We lock these in before moving on — now's the cheapest moment."

**Verbatim source.** Chester `23746278` lines 130–157.

**When to use.** As a discrete Round-Zero step before any interview turns. Repeat at any vocabulary-ambiguity discovery later.

**Why it works.** Front-loads the cost of definitional drift. The "now's the cheapest moment" frame acknowledges the cost asymmetry between locking-now and revising-later. Designer engages because the question carries its own urgency rationale.

**LLM-bias coverage.** Counters vocabulary colonization (forces explicit vocabulary establishment rather than implicit creep), counters anchoring (alternatives can be raised before the vocabulary is locked).

### Template 7 — Numbered Probe-List With Sub-Options Per Item

**Shape.** "1. [Probe one]. [Sub-option a]? [Sub-option b]? [Sub-option c]? 2. [Probe two]. [Sub-option a]? [Sub-option b]? 3. [Probe three]. [Sub-option a]? [Sub-option b]?"

**Verbatim source.** Chester `eaf11901`: "1. Probe flavor. Explicit only? Both? Explicit-mandatory + implicit-optional? 2. Trigger frequency. Per-turn? Per-checkpoint? Per-transition-attempt? 3. Correction visibility…"

**When to use.** When several parameters need locking under a settled shape. Each numbered item carries its own forced-choice; designer can skip items without rejecting the turn.

**Why it works.** High signal density. Lets the designer drop items safely. Best fit for "we agree on shape, now lock parameters."

**LLM-bias coverage.** Counters verbosity compensation (forces structured form rather than verbose preamble), preserves one-concept-per-item discipline within a multi-question turn.

### Template 8 — Echo-Back With Weaker Fall-Backs

**Shape.** "Does X framing match what you're carrying — or is the answer simpler (Y), or weaker (Z)?"

**Verbatim source.** Chester `5475984a`: "Does the iff-bridge framing match — or is the answer simpler (bounding-only) — or weaker (commitment-only)?"

**When to use.** When proposing a strong framing. Surfaces weaker fall-backs so the designer can downgrade without rejecting outright.

**Why it works.** Three named framings of decreasing strength let the designer downgrade without rejecting. Preserves the agent's contribution while allowing correction.

**LLM-bias coverage.** Counters anchoring (multiple framings offered), counters acquiescence bias (alternatives are explicit rather than presumed-default).

## Anti-Pattern Defenses

For each anti-pattern recurring across the corpus, a structural defense the skill should encode.

### Defense 1 — One-Concept-Per-Question

**Banned shape.** Stacked clauses bound by *and* / *or*. "Does X hold, and does Y land?" "Want X, or stay Y? And does Z need explicit enumeration?"

**Defense.** Skill-text rule: questions ending with `?` carry exactly one decision. If two decisions need ratification, two turns. Designer's `feedback_question_format` memory already captured this.

### Defense 2 — Replace Bare "What Do You Think?"

**Banned shape.** Open-pull as default closer.

**Defense.** Default closing template is Template 2 (self-pessimist three-axis red-team). The agent must do the red-team work *before* asking. Bare "What do you think?" only allowed at session-start when the agent has read context but not yet heard the human's frame.

### Defense 3 — Translation Gate Strict

**Banned shape.** Proof-MCP vocabulary in designer-facing speech ("NC-B", "EVID-4", "Architect C"). Solve-vocabulary in problem-side openers ("visibility problem", "convergence problem").

**Defense.** Phase-Vocabulary Classifier as enforced gate, not advisory. Translation Gate runs every turn before sending. The exemplar style ("concept names rather than type names; shapes rather than structures; forces rather than mechanisms") is non-negotiable.

### Defense 4 — Forked Option-Pick Must Include "Sit One More Turn"

**Banned shape.** "Want me to draft X, or sketch Y?" with no "neither yet" branch. Forces forward motion when "stop and think" is the right answer.

**Defense.** Every forked option-pick must include either an explicit "or stay with what we have for one more turn" branch, or a "neither yet — what's missing?" branch. The fork shape's failure mode is forcing a pick when *no pick* is right.

### Defense 5 — Pre-Emptive Self-Deletion Test

**Banned shape.** Agent presents N axes / options / candidates. Designer pushes back. Agent runs deletion test reactively, finds 3 of 4 are tautology / closure-mechanic / generic. The audit is correct; the timing is wrong.

**Defense.** Skill-text rule: before presenting any candidate set (NC candidates, success axes, option lists), agent runs deletion test on its own candidates. Each candidate must answer "what specifically breaks if this is removed?" Generic, tautological, or closure-mechanic candidates die before the turn.

### Defense 6 — Pull-From-Designer Over Push-Options-At-Designer

**Banned shape.** Agent imagines two cut-points and asks which fits.

**Defense.** When the topic is the designer's original framing (problem statement, scope, core motivation), the agent must probe with open-ended discovery rather than imagining options. "What do *you* carry as the cut-point?" not "Is it cut-A or cut-B?" Imagining-then-asking is push; probing-then-recording is pull.

### Defense 7 — One-Element-Per-Ratification

**Banned shape.** Bundled ratification: "So your constraints are A, B, and C — does that sound right?" Gestalt approval; designer assents to the gestalt rather than evaluating each component.

**Defense.** Already encoded in cluster-A's NC-05 sequential-ratification rule. The interview voice mirrors the API: confirmation asks come one element at a time, not as bundles. Match Chester `23746278`: "the proof MCP refuses batch ratification — the ratification call carries one RC ID per call."

### Defense 8 — Codebase Questions Go to Codebase

**Banned shape.** "Is severity/diagnostic enum vocabulary fully on Domain.Contracts post-A1?" — the codebase can answer; the designer should not be asked to.

**Defense.** Before any factual question about the codebase, agent runs grep / read first. The Phase-2 Parallel Context Exploration is the discipline; its outputs must be exhausted before asking the designer for facts the code carries.

### Defense 9 — Information Package Discipline

**Banned shape.** "What do you think?" / "Confirm?" with no preceding Information Package.

**Defense.** Every closing question must ride on top of an Observations / Information Package / Commentary block that did the narrowing work. When the IP did its job and the question is tight, the designer responds with one word and the proof moves. When the IP is thin, the question fails regardless of shape.

### Defense 10 — Funnel-Order Discipline

**Banned shape.** Specific questions early; broad questions late. Primes the designer to fabricate opinions or respond within a suggested frame.

**Defense.** Open-ended discovery comes first (Phase 4a Understand stage), structured probes come second (Phase 4b Solve stage), forced-choice ratifications come last (closure / element locks). NN/g funnel technique applied to the design-large-task five-phase architecture.

## Translation Layer — Which Defenses Cover Which LLM Biases

| Defense | Anchoring | Sycophancy | Verbosity | Vocab colonization | Completion bias | Coverage blindness |
|---------|-----------|------------|-----------|---------------------|-----------------|---------------------|
| 1. One-concept-per-Q | — | — | strong | — | — | — |
| 2. Three-axis red-team | strong | strong | — | — | medium | strong |
| 3. Translation Gate strict | — | — | — | strong | — | — |
| 4. "Sit one more turn" branch | medium | — | — | — | strong | — |
| 5. Pre-emptive deletion test | strong | medium | medium | — | strong | medium |
| 6. Pull over push | strong | medium | — | medium | strong | medium |
| 7. One-element-per-ratification | — | strong | — | — | — | — |
| 8. Codebase Qs to codebase | — | — | — | medium | — | — |
| 9. Information Package | medium | — | strong | — | medium | medium |
| 10. Funnel-order discipline | strong | — | — | medium | medium | strong |

The matrix shows three biases (anchoring, completion bias, coverage blindness) need multiple defenses; the highest-leverage single defense is Template 2 (self-pessimist three-axis red-team), which addresses four biases simultaneously.

## Recommendations

### Skill-Level Changes

1. **Embed the eight templates as named question patterns** in `design-large-task` SKILL.md. Each template gets a section with its shape, when-to-use, why-it-works, and bias-coverage. Reference the verbatim source from harvest data.

2. **Promote Template 2 (self-pessimist three-axis red-team) to default closing question.** Bare "What do you think?" is allowed only at session start. Every NC proposal, architecture-choice presentation, and element ratification closes with the three-axis template.

3. **Phase-Vocabulary Classifier as a hard gate, not advisory.** Currently the classifier rejects solve-side framings at the API boundary in problemfocused flow but is advisory in classic / team-interview. Make it consistent across flows.

4. **Forked option-pick template requires a "sit one more turn" branch.** Every fork must include either "or stay with what we have" or "neither yet — what's missing?" Encode in skill text.

5. **Pre-emptive deletion test required before presenting any candidate set.** Agent runs deletion test on its own candidates before the turn fires. Generic, tautological, closure-mechanic candidates die before reaching the designer.

6. **Funnel-order discipline encoded in Phase Map.** Phase 4a (Understand) does open-ended discovery; Phase 4b (Solve) does structured probes; Closure does forced-choice ratification. Specific-questions-first is a phase violation.

### Voice-Rule Changes

7. **Add a "Questions" section to `util-design-partner-role`.** Document: one-concept-per-question, three-axis red-team default, designer-authority check for designer-direct elements, codebase-questions-to-codebase, pull-over-push.

8. **Externalize question-self-audit (C3?).** Currently C1 (Externalized Coverage) and C2 (Fact / Assumption / Opinion marking) operate. Add C3: before sending a turn, audit the question — is it stacked? Does it contain proof vocabulary? Is the IP doing the narrowing work? Did the agent imagine options when it should have pulled?

9. **Translation Gate runs visibly.** Per-turn lint output flags violations. Structural conciseness constraint (LLMREI's documented mitigation for verbosity compensation) becomes visible.

### MCP-Level Changes (Cluster B.2 Territory)

10. **Closing-argument materialization (RULE-22) is the locus where Template 2's three-axis red-team becomes structural.** Closing argument's NC-walk is the formalized version of the self-pessimist template. Cluster B.2 inherits this synthesis.

### Cross-Skill Changes

11. **Cluster B.1's initialization design encodes Information Package discipline.** Defense 9 maps onto NC-1's six-pairing structure: each boundary structuring step has an Information Package preceding the API call.

12. **Industry-pull recovery as a documented escape hatch.** When the agent's own framing fails deletion testing, reach for external vocabulary (industry exploration). Chester `5475984a` Turn 32 is the canonical specimen — reframing through external vocabulary outperformed reframing through internal regeneration.

## Open Questions Surfaced

These emerged during synthesis but need separate research or design work to settle:

- **How to detect Translation Gate violations automatically?** Current gate is human-judgment; no automated tooling. Could a small classifier (proof-vocabulary lexicon match) fire as a per-turn lint?
- **Does the three-axis red-team generalize beyond NCs?** The template was developed for necessary-condition iteration; extending to architecture choices, scope decisions, vocabulary lockdowns is plausible but unverified across the corpus.
- **What is the right cadence for designer-authority checks?** Too rare and the agent locks designer-direct elements without designer ratification; too frequent and ratification fatigue sets in. The corpus suggests "every Rule and Permission" but doesn't establish the upper bound.
- **Can the funnel-order discipline be enforced mechanically?** Phase 4a's Phase-Vocabulary Classifier is one mechanism. Phase 4b lacks an analogous "structured-probe gate" — anything could be asked. Worth exploring whether a per-turn classifier could fire.
- **Coverage blindness mitigation beyond constraint-probing.** ReqElicitGym's 32% IRE applies to the corpus. Style-related requirements are nearly invisible. Active probing for non-functional / cross-cutting / style-adjacent constraints would close the gap; how is open.

## Provenance

- Sister research artifacts in this folder, all produced 2026-05-02:
  - `research-storydesigner-harvest-00.md` — 6 sessions, ~257 questions, 11-category taxonomy
  - `research-chester-harvest-00.md` — 8 sessions, ~420 questions surveyed, ~50 verbatim cited
  - `research-llm-interview-traits-00.md` — 18 cited sources covering LLM biases, requirements elicitation systems, human-interview methodology
- Synthesis methodology: independent harvest taxonomies overlaid; convergent findings extracted; LLM industry research mapped onto observed behaviors; templates grounded in verbatim corpus examples; defenses grounded in convergent anti-patterns.
- Limitations: harvests sampled rather than exhaustive; LLM industry research contains "thin" signal flagged for ratification fatigue and translation-gate-for-LLMs; recommendations would benefit from prospective testing in cluster-B.1 / cluster-B.2 sessions.
