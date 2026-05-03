# Research: Question Patterns in Chester Design Interview Sessions

Harvest of agent-asked questions across eight historical design-interview sessions. Goal: catalogue what shapes of questions actually got asked, evaluate productivity, and surface effective vs anti-pattern shapes for future skill design.

---

## Section 1 — Sample

Sessions sampled (largest, most interview-substantive, excluding the current research session `1cb6eb64`):

1. **`3bf0dff8-b320-4951-a2dd-9191fa792c58`** (930 lines, ~120 question-bearing turns) — Philosophical inquiry into the nature of "understanding," then escalates to redesigning the nine-tenet Understanding MCP. Pure design-large-task style, but conducted *about* the skill itself. Heaviest Q-volume in the corpus.
2. **`eaf11901-a30f-4ffd-91c5-01694711a340`** (1336 lines, ~79 questions) — Necessary-conditions interview iterating on C1 / C2 / C3 / C4 for "AI-human shared-understanding convergence." Textbook necessary-condition Solve-stage pattern.
3. **`23746278-e18c-4001-9469-b0228a34d3d8`** (755 lines, ~33 questions) — Master-plan Cluster A define-solve session. Round Zero vocabulary lockdown plus Solve-stage proof building (resolution-claim element design). The clearest specimen of the Understand-then-Solve interview discipline.
4. **`5475984a-97d2-40b3-8b96-c3c8e0165836`** (693 lines) — Meta-review of an Understand-stage transcript, with cited turn-by-turn question critiques (Turn 21, 22, 25, 26, 30, 31, 32, 33, 34). Used as a critic's lens onto the corpus.
5. **`8b24f305-7372-4729-93e6-6f8e1d0323be`** (2085 lines, ~59 questions) — Long debate-skill exploration; option-survey and recommendation pattern, light on interview discipline.
6. **`a2f6e078-6c32-4e4b-add6-b17c4720beb6`** (1783 lines, ~33 questions) — Artifact-versioning brainstorm. Option-survey with confirm-or-override loops.
7. **`64737158-a785-4eff-89fc-b74fe7f3bdcb`** (689 lines, ~59 questions) — Translate-gate bug repro / fix interview. Heavy on diagnostic short-list questions.
8. **`3710a456-dddf-4dbf-aba2-cef602fb98d8`** (1180 lines, 8 questions) — `design-specify` of Cluster A. Mostly delivery and confirmation; sparse Q&A but high-stakes ones.

Roughly 420 distinct agent-asked questions surveyed. ~50 verbatim examples cited below.

---

## Section 2 — Question taxonomy

Eleven categories surfaced. Frequencies are rough counts (some questions land in two).

| # | Category | Approx % | One-line definition |
|---|---|---|---|
| 1 | Forked option-pick | ~32% | "Want me to do X, or Y?" — two named alternatives, expects pick-one |
| 2 | Confirmation / ratification | ~17% | "Confirm?", "Approve?", "Locked?" — expects yes/no/revise |
| 3 | Numbered probe-list | ~11% | 2–4 numbered specific questions in one turn, each with sub-options |
| 4 | Open-ended discovery | ~9% | "What lands wrong, what's missing?" — invites unstructured pull |
| 5 | Diagnostic short-list | ~8% | Bug / repro form: "Which skill?", "What symptom?", "Example?" |
| 6 | Vocabulary lock-in | ~6% | "Tell me if any of these names don't match" — name + def ratification |
| 7 | Self-pessimist / red-team-by-the-human | ~5% | "Where might this miss your vision?" with three failure-axis candidates |
| 8 | Pulse-check / readback | ~4% | "Does this land?", "Does the iff-bridge framing match what you're carrying?" |
| 9 | Closure / next-action | ~4% | "Move to Solve?", "Ready for /refresh-chester?" |
| 10 | Transition-gate ask | ~2% | MCP-driven: "Move to Solve and start building the proof?" |
| 11 | Productive challenge | ~2% | "Run the rational-agent argument forward — what does this incentivize?" |

Forked option-pick dominates — a single skill verbal tic ("Want me to draft X, or sketch Y?") accounts for nearly a third of all questions in the corpus.

---

## Section 3 — Per-category analysis

### 1. Forked option-pick (~32%)

**Examples.**
- *3bf0dff8*: "Want me to draft what fixes for the three failing/inverted dimensions would look like (concrete scoring-criteria rewrites + 'input-required' gate), or move into how Lane-2 telemetry would surface gate-firing pathology?"
- *eaf11901*: "Want me to draft a replacement (single-session candidate) for C2, or skip directly to what was C3 (Bidirectional Coherence Probe)?"

**Expected/actual.** Short-phrase pick. Designer almost always picked one. Productive when options were genuinely orthogonal threads. Unproductive when both options were premature — e.g. *3bf0dff8* offered "draft scoring.js changes vs sketch frame-revision-trail" before the designer had ratified the underlying axis set; the pick locked work onto an unsettled foundation. The fork shape **forces** a pick even when "neither yet" is right.

**Productivity.** Mixed. Routing widget when wide, premature-commitment device when narrow.

### 2. Confirmation / ratification (~17%)

**Examples.** *a2f6e078*: "Confirm `subagent` or override?" — *64737158*: "Approve patch? Or want different fix shape?" — *23746278*: "Confirm or revise."

Designer typically gave one-word "yes" or a one-line revision — *eaf11901* on C2: "yes; granularity is good as a start; agent needs to carry the burden to inform the designer; adjacent miss is a problem for solve later" (ratification plus three sub-axis decisions in one breath). High productivity when paired with a concrete drafted artifact; low when the agent asked "Confirm?" without first laying out what was being confirmed.

### 3. Numbered probe-list (~11%)

**Examples.**
- *eaf11901*: "1. Probe flavor. Explicit only? Both? Explicit-mandatory + implicit-optional?  2. Trigger frequency. Per-turn (heavy), per-checkpoint (medium), per-transition-attempt (minimal)?  3. Correction visibility. When agent's model of designer updates, must agent announce…?"
- *8b24f305*: "1. Lens roster. What lenses, how many?  2. Turn structure. How does designer experience B?  3. Convergence criterion. What's 'all agree'?  4. Hand-off to Step C. What does single Solve agent inherit?"

Designer answered selectively, often 2 of 3 — "recap 1, 2, and 4; propose another candidate for c3" (*eaf11901*). High signal density; the structure makes dropping an item safe. Best fit for "we agree on shape, now lock parameters."

### 4. Open-ended discovery (~9%)

**Examples.** *5475984a*: "What lands wrong, what's missing, what shouldn't be here?" — *23746278*: "What do you think?" (recurring).

When prefaced by a substantive info-package, the designer gave a focused multi-sentence response with corrections ("your c2 is wrong here. we agreed on confidence marking…"). Bare "What do you think?" without context produced one-line redirects. Highest-value when paired with structured artifact; lowest-value as fallback.

### 5. Diagnostic short-list (~8%)

**Example.** *64737158*: "1. Which skill hit it — `skill-creator` or `design-experimental`? 2. Symptom — agent leaked code vocab? Gate not enforced? Gate blocked wrong thing? 3. Session transcript or example output?" When the designer answered only the symptom, the agent re-asked with narrower bounds and concrete examples — productive iteration. List shape forces repro discipline.

### 6. Vocabulary lock-in (~6%)

**Example.** *23746278*: "Tell me if any of these names or definitions don't match how you think about it. We lock these in before moving on … now's the cheapest moment." Preceded by a 25-line glossary block listing five Element Types, two Phase names, four Anchor Concepts, one named gap. Designer corrected one name ("Resolve Condition" → "Resolution Criterion"); the rest absorbed. Very high productivity — front-loads the cost of definitional drift. Chester's "Vocabulary Lockdown Classifier" expressed as voice.

### 7. Self-pessimist / red-team-by-the-human (~5%)

**Example.** *eaf11901* C2: "Where this might miss your vision: 1. Granularity wrong … 2. Wrong locus … 3. Adjacent miss … Pick: does C2 land, need adjustment on one of those axes, or replaced entirely?" Designer engaged each axis specifically. Highest productivity in the corpus when used in necessary-condition iteration — the agent's red-team-on-itself lifts the designer's work from "find the flaw" to "rate the flaws I found."

### 8. Pulse-check / readback (~4%)

**Example.** *5475984a*: "Does the iff-bridge framing match what you're carrying — proof solves hypothesis by bridging 'candidate satisfies conditions' to 'candidate resolves problem' with designer-ratified equivalence? Or is the answer simpler — bounding-only — or weaker — commitment-only?" The trick: name your own framing plus weaker fall-backs, so the designer can downgrade without rejecting.

### 9, 10. Closure / next-action; Transition-gate (~6%)

*23746278*: "Move to Solve and start building the resolution-criterion proof?" — *64737158*: "Ready for `/refresh-chester`, or want to test before committing?" Workmanlike; mostly clean. The MCP-mediated transition-gate ask is the formalized variant — *5475984a*'s post-mortem flagged the gate fires too soon mechanically and designer-confirm is doing the real work.

### 11. Productive challenge (~2%)

*3bf0dff8* (designer-asked): "Run the rational-agent argument forward — what does this incentivize?" The agent rarely originated this shape on its own.

---

## Section 4 — Anti-patterns observed

**A. Bare "What do you think?" with no scaffolding.** *23746278* used this verbatim seven times. When the preceding info-package was rich, fine. When it was thin, the designer redirected. This shape outsources the agent's framing work to the designer.

**B. Forked option-pick where both options are downstream of an unsettled axis.** *3bf0dff8* offered "draft scoring.js validator addition, or sketch the frame-revision-trail data structure?" — both depend on the criterion set being locked, which the designer had not done. The fork imposed a local choice that hid an unmet upstream condition.

**C. Solve-vocabulary in problem-side openers** (per *5475984a* turn-cite). Turn 21: "visibility problem vs convergence problem" — both phrases name mechanism shapes, not author pain. The agent then asked which "felt pain" the designer was solving — leading question with a presumed mechanism baked in. Designer caught it Turn 25; required two more reframes (Turns 26, 27–28) to escape. Costly first-question miss.

**D. Imagined-options-then-pick** (per *5475984a* Turn 33). Agent supplied two candidate done-moments and asked the designer to choose. Voice rule says probe what designer carries; the agent imagined first, then asked which imagined cut fit. **Push, not pull.**

**E. Bundled tenet catch-up at the gate** (per *5475984a* Turn 34). Three tenets surfaced together with "answer or defer or transition." Reads as gate-saving rather than tenet-probing. Productivity: low — if three tenets weren't worth probing individually earlier, they probably aren't load-bearing.

**F. Multi-axis questions that collapse to ambiguous "yes."** Memory rule already flagged this in user feedback (`feedback_question_format`). Examples in *3bf0dff8*: "Want me to red-team this set (how the agent will try to game…), draft the MCP enforcement architecture, or write this as a feature-dev brief like the prior turn?" — three options, no labels. Saved by being numbered when the agent remembered.

**G. Pre-audit only after pushback** (per *5475984a* Turn 30/31). Agent presented four success axes; designer pushed back; agent ran deletion test on its own axes and admitted three of four were tautology / constraint-restate / closure-mechanic / generic. The pattern is correct (self-audit). The timing is wrong — should run before presenting, not after being challenged.

---

## Section 5 — Effective patterns observed

**A. Numbered probe-list with sub-options per item** (e.g. *eaf11901* C3: "Probe flavor. Explicit only? Both? Explicit-mandatory + implicit-optional?"). Each item carries its own forced-choice. Lets the designer skip items without rejecting the turn.

**B. Three-axis pre-imagined failure modes ("Where this might miss your vision").** *eaf11901* C1, C2, C3 all closed with this shape: granularity wrong / wrong locus / adjacent miss. The agent has done the red-team work; the designer rates it. Conversion of unstructured discovery into structured ratification.

**C. Vocabulary lock-in as a discrete pre-Solve step.** *23746278* burned 25 lines on element-type, phase-name, anchor-concept, and named-gap definitions before any proof work — the cheapest moment to argue terminology. Productive because it ate the cost upfront.

**D. Self-deletion test surfaced as a turn artifact.** When *5475984a* turn 31 ran a deletion test on the agent's own four success axes and reported the verdict, that *was* the turn — no question, just an honest audit. The next-turn question was free of the dead axes.

**E. Industry-pull recovery.** *5475984a* turn 32 reached for mutable-snapshot, change-tracker, editor-protocol literature to sharpen the success cuts after the agent's own framing failed deletion testing. Reframing through external vocabulary outperformed reframing through internal regeneration.

**F. Echo-back with weaker fall-backs offered.** *5475984a*: "Does the iff-bridge framing match — or is the answer simpler (bounding-only) — or weaker (commitment-only)?" Three named framings of decreasing strength let the designer downgrade without rejecting.

**G. The "now's the cheapest moment" frame** (*23746278* on naming). Time-pressure language acknowledges the cost asymmetry between locking-now and revising-later. Designer engaged because the question carried its own urgency rationale.

---

## Section 6 — LLM-specific behaviors observed

**LLM completion bias surfaced as premature drafting forks.** *3bf0dff8*: "Want me to draft the actual MCP tool surface (TypeScript-style schema for each tool's input/output, plus the validation rules per tool) so this becomes implementable, or sketch the migration path…" — appears 10+ times in the session. The two options are both "produce more artifact"; "sit with the design" was never offered. The agent's gradient pulls toward writing code-shaped output even mid-Understand.

**Solve-vocabulary leakage in problem-side openers** (*5475984a* turn-cite). Mechanism words ("visibility problem," "convergence problem") replacing author-pain words. The agent's training reaches for engineering vocabulary; the Phase-Vocabulary Classifier is supposed to catch this and demonstrably did not in ncon-05. Designer paid the altitude-correction tax three times.

**Confidence laundering** (*eaf11901* C2 explicitly named this failure mode and built C2 around it). Quote from the necessary-condition: "LLMs assert with uniform fluency. Confident-sounding output and hedged-sounding output cost the model the same; producing one or the other is a stylistic choice, not a knowledge signal." This is the design-skill itself recognizing a model-architecture pathology and instrumenting against it.

**Gradient toward implementation prescription smuggled into proof elements** (*23746278* identified this as risk #4 of the resolve-condition shape: "forward_test reaches into HOW. 'Verify the SQLite decisions table has these columns.' Solution detail leaks into the proof under the cover of 'observable test.' Violates RULE-3 conceptually but isn't caught mechanically"). The agent's instinct to make things concrete leaks past the proof discipline unless explicit structural guards exist.

**Push-options-at-designer when pull-from-designer was called for** (*5475984a* turn 33). Voice rule wants the agent to probe what the designer carries. The agent's habit is to imagine the options and ask which fits. Pull-vs-push is an LLM-specific failure because the model can always generate more options; restraining generation is harder than producing it.

**Asking the designer to do the agent's work** (*23746278* "What do you think?" recurring). Used as a default closer, the question abdicates framing.

**Completion-bias forks dominate the corpus.** Roughly a third of all questions are "Want me to do X, or Y?" and within those, a strong majority offer two productive-output paths. The agent never offered "Stop and think for one more turn." This is the most pervasive LLM-specific tic in the data.

---

## Section 7 — Chester-specific patterns

**Vocabulary Lockdown happens in the agent's voice** (*23746278* lines 130–157). The agent presented the five Element Types, two Phase names, four Anchor Concepts, and one named gap as a glossary block, then closed with "Tell me if any of these names or definitions don't match how you think about it. We lock these in before moving on." This is the problemfocused MCP's `seed_glossary` / `apply_vocabulary_action` discipline expressed as an interview turn.

**Problem-statement repeat-back gate** surfaced verbatim in *23746278*: "That's the shared picture I have coming in. If it matches your sense of the ground, we can move into the Understand Stage — I'll start working through it each turn and pulling on the weakest thread. Ready to begin, or do you want to correct anything about the picture first?" The agent restates its summary of what it has heard and offers a correction window before committing. *5475984a*'s post-mortem confirmed this gate is doing real work — designer corrected the agent's frame at this gate three times in ncon-05.

**Necessary-condition serialization with explicit lock points.** *eaf11901* iterated C1 → C2 → C3 → C4 sequentially, each with: statement, failure mode, why-necessary, mechanism candidates, where-this-might-miss-your-vision (3 axes), pick. The pattern is *eaf11901*-style: present, red-team-on-self, ask-designer-to-rate-the-red-team, lock. Each condition closes with "C_n locked." before the next opens.

**The Round-Zero shape** (*23746278*) — agent presents Understanding-state-up-front (vocabulary + open questions + recommendation) before any interview turn. Designer either ratifies or corrects. Then Understand stage begins. This Round-Zero is **not** a question turn; it's an info-dump-then-confirm.

**Ratification asks for Rules / Permissions / Resolution Criteria operate one-at-a-time.** *23746278*'s anti-fatigue mitigation: "the proof MCP refuses batch ratification — the ratification call carries one RC ID per call." The interview voice mirrors this: confirmation asks come one element at a time, not as bundles.

**Solve-stage proof-building uses structured pessimist insertions.** *23746278*: "Pessimist risks. For Option A: more proof surface to learn; one more category to inherit forward. For Option B: the marker pattern propagates downstream — every consumer that handles the conditional branch carries the cognitive load." Then: "What do you think?" The pessimist is internalized as a turn component; the designer is asked only once at the end. This is `util-design-partner-role`'s "single agent, multiple roles" working as intended.

**The "iff-bridge" framing as a Chester-specific design vocabulary** (*5475984a*): "proof solves hypothesis by bridging 'candidate satisfies conditions' to 'candidate resolves problem' with designer-ratified equivalence." This phrasing originated mid-conversation and was used as a probe-shape, then absorbed into the brief.

**Closure offers always name the next pipeline step.** *3710a456*: "Want me to `/schedule` a background agent to push to origin once you're ready, or kick off cluster B (Define Transition) next session?" The choice surface always anchors to a known Chester verb (specify, plan-build, finish-archive). Closure is never open-ended.

---

## Net read

The Chester interview voice is in effect. Vocabulary lock-in, repeat-back gate, necessary-condition iteration with self-red-team, and one-element-per-ratification all show up consistently in the highest-quality sessions (*eaf11901*, *23746278*). The dominant failure modes are LLM-driven: completion-bias forks ("draft X or sketch Y"), solve-vocabulary leakage in problem-side openers, and post-hoc rather than pre-emptive self-audit. Three concrete leverage points for skill design:

1. **Replace bare "What do you think?" with a three-axis red-team-on-self template.** *eaf11901* shows this works; the worst sessions defaulted to the bare form.
2. **Add a "neither yet" or "sit one more turn" branch to forked option-picks.** Currently every fork forces forward motion.
3. **Run the deletion test pre-emptively, not after pushback.** *5475984a* turn 31 is the canonical "agent should have done this two turns ago" moment.

All three target the LLM gradient toward implementation rather than the Chester pipeline itself.
