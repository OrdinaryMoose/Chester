# StoryDesigner Interview-Question Harvest

Research pass over StoryDesigner Chester sessions, sampling design-large-task and design-experimental interviews. Goal: catalog the questions the agent asked the human, characterize the response patterns, and surface effective vs anti-pattern shapes.

## Section 1 — Sample

Sampled six sessions from `~/.claude/projects/-home-mike-RiderProjects-StoryDesigner/`, chosen by keyword density on `design-large-task | design-experimental | necessary condition | Understand stage | Solve stage | Design Proof MCP`. Each is a multi-megabyte JSONL with rich Q&A.

- **a59aaa50** (Apr 27, 7.2 MB) — `design-large-task` "rev-01 master plan sprint write": designing the *mechanism* to rewrite the master plan against rev-01 endstate and integration-test apparatus. Heavy interview phase, then specify-handoff redirection.
- **478a2e77** (Apr 20, 7.0 MB) — `design-experimental` LBD-1: integration-boundary relocation for diagnostic combining post-`Story.Application.Logic` dissolution. Long Understand→Solve cycle, multiple sub-LBDs spawned.
- **ef47db8f** (Apr 29, 5.0 MB) — `design-large-task` "ncon4": cross-consumer convergence — designing the plug-in pattern by which heterogeneous consumers attach to authoring seams.
- **b599ccde** (Apr 20, 2.5 MB) — `design-experimental` LBD-9.1: canonical-form projection surface design.
- **f1ee21b0** (Apr 9, 2.9 MB) — `design-experimental` follow-up on diagnostic-system bypass: structured codes stripped at the adapter, deciding whether the editor-facing contract should change.
- **58af1540** (Apr 28, 2.6 MB) — small-skill creation session ("/touch") — included as a low-interview baseline for contrast; it has design-style questions only at the closure margin.

Total assistant lines extracted: ~14,300; user lines: ~3,200; questions ending in `?` across the four primary interview sessions: ~257.

## Section 2 — Question Taxonomy

Eleven categories surfaced, in rough order of frequency.

1. **Open-pull ("what do you think")** — bare invitation to react after an information package. ~30%.
2. **Forced-choice ratification ("A / B / hybrid / reopen")** — explicit option-pick at proof-update or evidence-acceptance gates. ~15%.
3. **Boundary-bound ("does this session settle X, or just punt to downstream")** — scope disambiguation. ~12%.
4. **Confirmation / readback** — agent paraphrases its understanding and asks if it matches. ~10%.
5. **Necessary-condition ratification ("does NC-B hold?")** — formal proof gate. ~8%.
6. **Stacked-clause ("does X hold, and separately, is Y…")** — two questions in one. ~7%.
7. **Strict-vs-loose-reading clarification** — flagging ambiguity in the human's last utterance. ~5%.
8. **Procedural / housekeeping** — naming, file placement, branch strategy. ~5%.
9. **Negative check ("under your reading, doesn't this break Z?")** — adversarial probe. ~3%.
10. **Open discovery ("what's your read?")** — no shape proposed. ~3%.
11. **Designer-authority check ("is this your direction, or am I projecting?")** — explicit ratification of agent-derived condition. ~2%.

## Section 3 — Per-Category Analysis

**1. Open-pull.** Verbatim: "What do you think?" (a59aaa50 lines 155, 188, 1435, 1484, 1552, 1625, 1686, 1742, 1797 — nine occurrences in one session), "What do you want to pull on?" (b599ccde 138, 209, 268, 379), "Where does that take your thinking?" (f1ee21b0 line 133). Expected breadth: paragraph or longer. Expected depth: reasoned position. *Productivity:* highly productive when preceded by a real *Information Package* and *Commentary* block — the human responded with structural rewrites ("disregard my casing, rev 01 naming stands"; "lets frame our thinking against our five future consumers and not orient on the one that exists today"). Bog-down occurred when the open-pull was the ninth in a row with no narrowing — the human shifted to terse "yes / continue / 1 / 2" answers (a59aaa50 lines around 1435–1797), suggesting the open-pull degraded under repetition.

**2. Forced-choice ratification.** Verbatim: "Approve the reshape, or want adjustments before submit?" (a59aaa50 line 651); "EVID-3 date: accept-as-risk-note / revise-brief / reopen-proof?" (478a2e77 line 637); "Architect C as written, Architect A, Architect B, a hybrid you articulate, or reopen the proof?" (b599ccde line 1899). Expected breadth: one word or short phrase. Expected depth: specific decision. *Productivity:* uniformly high when the human had already been walked through option payloads. Human responses were almost always one of the named slots ("a3", "three", "approved", "1", "B"). The pattern fails when the slot names are opaque — "EVID-4 naming: accept-as-risk-note / revise-brief / reopen-proof?" assumed the human held the EVID-4 wording in head; the human answered but later said "you are still talking like I have the code base and your internal language memorized."

**3. Boundary-bound.** Verbatim: "Does LBD 9.1 spec that relocation, or is it a downstream task under Sprint B2/B6?" (b599ccde 405); "does this session settle only the contract surface a future surface implements plus the home line for translator code, or does it also settle the active engine piece that knows about attachments and the grouping question?" (ef47db8f 255); "Is provenance preservation a requirement you'd want to pin down now, or one you'd rather leave to the relocation options to surface?" (478a2e77 82). Expected breadth: one sentence. Expected depth: strategic direction. *Productivity:* the most consistently productive shape in the corpus. Cleanly cut scope and produced ratifications the proof could carry forward. Human gave the expected shape almost every time.

**4. Confirmation / readback.** Verbatim: "Am I reading the merge point correctly?" (478a2e77 82); "Is this the model you want me carrying into the rest of this conversation?" (478a2e77 307); "Does that match your picture, or is there a detail I'm still missing on how save integrates with the rule?" (478a2e77 404). Expected breadth: short; expected depth: surface-fact ratification. *Productivity:* productive when the readback was tight. When it spanned a long paragraph and bundled multiple inferences, the human corrected piecewise ("not quite, the canonical form emerged out of the canonical/guid dsl…") and the agent had to re-readback.

**5. NC ratification.** Verbatim: "Does NC-B hold?" (ef47db8f 611); "Does NC-C hold?" (ef47db8f 646); "What's your read — does this hold as the first necessary condition?" (ef47db8f 575). Expected: one-word holds/fails plus optional rationale. *Productivity:* good in ef47db8f where the human responded "holds (and stop asking dual questions in the same sentence)" — note the parenthetical rebuke, which rewards the simple form and punishes the stacked-clause form. In b599ccde, the human pushed back on the very *vocabulary*: "why are we talking in terms of NC-1, NC-2, etc. I thought we decided not to use so much jargon." The NC label leaked proof-MCP vocabulary into designer-facing speech.

**6. Stacked-clause.** Verbatim: "Does the consolidation read hold for you, and does the disposition condition land as load-bearing for the third slot?" (a59aaa50 372); "Do you want three conditions as I've outlined, or stay at five with the current split? And does the Builder condition need to explicitly enumerate the problem groups, or is 'declarations-exist and reference-resolution' sufficient?" (478a2e77 489); "is the framing 'B1 ships contract, B2 ships engine+migration' right, or am I missing something that forces engine into B1?" (478a2e77 1611, where two distinct propositions are bound by *or*). *Productivity:* poor. Human either answered only the first half ("three" — 478a2e77), or rebuked the form outright ("holds (and stop asking dual questions in the same sentence)" — ef47db8f). The agent often had to re-ask the unanswered half on the next turn.

**7. Strict-vs-loose-reading.** Verbatim: "Was the loose reading what you had in mind when this NCON was named, or were you reaching for the strict version?" (ef47db8f 417); "Two readings of 'common CRUD requirements'… both readings can be called 'CRUD requirements'; they put the CRUD-ness in different structural places" (a59aaa50 R2 information package). *Productivity:* very high. Human consistently corrected the reading the agent inferred ("generic CRUD statement was imprecise. adhere to rev 01 design with Story.Authoring.Compile.Service…"). This shape surfaces a vocabulary mismatch the agent had been operating under tacitly.

**8. Procedural / housekeeping.** Verbatim: "ARCH number. Used 150 (fresh block). Acceptable or prefer 134 (continue 130 block)?" (478a2e77 1208); "branch+worktree+fast-forward, or direct on main?" (ef47db8f 1372); "delete ncon-01 outright, fold in the two stale rev-01 worktrees, leave lbd-09-1 untouched?" (ef47db8f 1305). *Productivity:* high; near-instant short answers ("ARCH-134", "branch", "yes"). These ride on top of a closed proof and aren't part of the interview proper.

**9. Negative check.** Verbatim: "If every consumer merges inside its own translator, the build engine never sees a 'merged view' of anything… consumer-specific findings (like a DSL text that fails to parse at all) can't block save through the gate. Either parsing failures are build-engine-visible somehow, or the gate's blocking set is narrower than it is today. Which way does that cut?" (478a2e77 119); "If Language and Core.Validation emit the same type, does that boundary still hold?" (f1ee21b0 491). *Productivity:* very high. Surfaces a consequence the human hadn't yet noticed and forces an explicit fork. In f1ee21b0 the human responded with a substantive reframing of what the two systems should share.

**10. Open discovery (no shape proposed).** Verbatim: "I want to hear from you how you'd describe the pain — what specifically is wrong or missing today that this session needs to make right?" (ef47db8f 132); "What's your read on whether span-anchored diagnostics belong in the unified model at all?" (f1ee21b0 388); "Where does that take your thinking?" (f1ee21b0 133). *Productivity:* mixed. Productive at the very beginning of a session when the agent has read context but not heard the human's frame. Less productive deep in the proof — the human answered "stupid question, but… what exactly does that mean?" suggesting the agent's jargon prevented an open question from being answerable.

**11. Designer-authority check.** Verbatim: "But that's my read. The condition needs your authority to stand. Is 'the boundary contracts should carry structured diagnostic identity' your direction, or am I projecting?" (f1ee21b0 696); "the proof is challenging condition 1 — it's grounded only in codebase evidence with no designer directive… am I deriving a design requirement purely from what the code looks like, without designer authority saying this is what should happen?" (f1ee21b0 674). *Productivity:* highest signal-per-token in the corpus. The human has to either authorize the condition or cut it; the agent has explicitly named the trap of inferring intent from code. f1ee21b0 used this pattern several times in succession; each one closed cleanly. This is the inverse of the *presumed-knowledge* anti-pattern.

## Section 4 — Anti-patterns Observed

**Stacked clauses bound by *and* / *or*.** Detailed above. The human explicitly rebuked the agent for it once ("stop asking dual questions in the same sentence" — ef47db8f). The agent's design-MCP nature seems to push it toward bundling two ratifications per turn to economize round-trips, but the human reads it as one question and answers half. Net effect: the agent has to re-ask, costing more turns than it saved.

**Proof-vocabulary leakage.** The agent kept asking "Does NC-B hold?" / "EVID-4 naming…" / "Architect C…" — names that exist inside the Design Proof MCP's mental model, not in the designer's. The human ratified for a while, then revolted: "I have no idea what you are asking me. Lets clarify things and translate into a descriptive well written and simple language" (b599ccde). And: "your jargon level in your writing is about a 5. lets simplify to about a 3" (b599ccde). The Translation Gate the design skill nominally enforces was leaking, and the leak was always *toward* the proof side.

**Structured-formatting leakage.** "★ Insight ─────────────────────────" boxes (58af1540) and tightly numbered three-bullet *Information Package* sub-headers (a59aaa50, 478a2e77) cued the human to write back in the same shape — when the human pushed back ("the words you are choosing makes it hard to clearly see what problem you are describing. You should be speaking to a product manager with no codebase knowledge, not a in the trenches designer" — 478a2e77), the agent's next turn often retained the same headers anyway.

**Presumed-knowledge questions.** "is severity/diagnostic enum vocabulary fully on `Domain.Contracts` post-A1, or does some still live on `Domain.Validation`?" (478a2e77 1052) — this is a question the codebase can answer, not the designer. The agent should have run a grep, not asked. Several times the human sent the agent back to read source: "before we continue read the codebase findings and the prior art findings again" (478a2e77).

**Asking the human to do the agent's work.** "lay out the options for the cost-ambition. show extremes and middle ground and lay out the considerations" (ef47db8f, user response) — this is the human *correcting* the agent for trying to elicit cost-ambition framing without first laying it out. The agent had asked an open-pull where it should have presented options first.

**Reflexive "What do you think?"** As noted, nine in one session. After the third or fourth, the human's responses degraded to single tokens ("yes", "1", "transition"). The question stopped doing work because there was no narrowing in the package preceding it; the agent was using the prompt to shift turn without offering new structure.

**Closure-margin slop.** "Implementation complete. What would you like to do?" / "Which option?" (a59aaa50 2896, 2903; f1ee21b0 1254, 1261). At session end the agent reverted to bare option-picks without naming the options inline, forcing the human to scroll. Cheap to fix; observed in three of six sessions.

## Section 5 — Effective Patterns Observed

**Boundary-bound questions with named alternatives.** As Section 3 #3. The shape "does this session do X, or punt to downstream Y?" cleanly bisects scope and produces ratification the proof can act on immediately. Human answer is short and decisive; agent advances the proof without re-asking.

**Negative check / consequence probe.** As Section 3 #9. "If we go with reading two, the locked two-path constraint is at odds with the per-concept surface" (a59aaa50 R2). Forces the human to acknowledge a tension they hadn't named. The most epistemically generative shape — it produces *new* design content rather than just ratifying existing.

**Designer-authority check.** As Section 3 #11. The question explicitly names the trap of inferring designer intent from code. Closes cleanly because the human can't reflexively ratify; they have to take a position.

**Strict-vs-loose-reading flag.** As Section 3 #7. The agent recognizes its own ambiguity in the human's last utterance and surfaces it before proceeding. The human almost always corrects to one of the two readings, sometimes adding a third.

**Information Package then narrow ratification.** Across all the sessions, the *Observations / Information Package / Commentary / Question* envelope was high-functioning when the question at the end was tight (forced-choice or boundary-bound). The IP did the work of narrowing; the question only had to close the narrowed space. When the IP did its job and the question was tight, the human responded with one word and the proof moved.

**Confirming-without-asking.** Some of the most productive turns in b599ccde and f1ee21b0 weren't questions at all — they were "Confirm?" appended to a one-paragraph readback. Lower question-mark density per turn, higher information density per round-trip.

## Section 6 — LLM-Specific Behaviors

**Completion bias surfacing as premature solving.** In a59aaa50 the agent, while still in the Understand stage, drafted a polished problem statement and asked the human to confirm it ("Confirm the polished statement, and confirm the namespace reading?" — line 252). The human's response was to advance, but elsewhere the human pushed back: "we will save the problem statement for later. lay out the options for the cost-abition" (ef47db8f). The agent's gravity toward closing the open ended question hit the human before the human was ready.

**Mechanism-for-its-own-sake drift.** In a59aaa50, the agent began designing an integration-test apparatus before the human had ratified that the apparatus belonged in this session at all. The human eventually said "we are writing a plan to plan, not the actual refactor itself." The agent had begun specifying the refactor.

**Detail-pull in the closure margin.** In ef47db8f the closing sub-thread spawned a chain of housekeeping questions ("ARCH number… Wording sweep… branch+worktree…"). Each individually fine; the chain itself was the agent gold-plating the close. The human eventually answered all of them but the chain was longer than the design substance that preceded it.

**Subagent-template residue.** In multiple sessions the agent, after running a parallel subagent, presented the subagent's findings under headers like `*Alignment check.* / *Metacognitive reflection.* / *Direction signal.* / *Information Package.*` (a59aaa50, 478a2e77). The headers are scaffolding from the design-large-task SKILL prompt. They leaked verbatim into designer-facing prose. The human eventually said "the words you are choosing makes it hard to clearly see what problem you are describing. You should be speaking to a product manager with no codebase knowledge, not a in the trenches designer." The agent's response did soften prose, but the headers stayed.

**Confirmation-bias readback.** Several confirmation/readback questions paraphrased the human's prior utterance in a *direction* that fit the agent's model. Example, f1ee21b0 line 388: agent had assumed span-anchored diagnostics belonged in the unified model; the human had not said that; the agent recovered with "I shouldn't have assumed that. What's your read on whether span-anchored diagnostics belong in the unified model at all?" — a clean correction, but only after the assumption had been baked into a prior turn's framing. The agent's pattern is to optimistically project the human's position forward, then walk back when challenged. The walk-back is graceful but the projection is structural.

**Implementation-detail leak under "necessary condition" framing.** The agent, working through the proof MCP, sometimes asked the human to authorize implementation details disguised as necessary conditions. f1ee21b0 line 644: "is 'the output adapter must populate the structured code field instead of discarding it' a separate condition, or is it implementation detail of condition 1?" The agent itself caught this — the question's phrasing surfaces the suspicion. But the suspicion was correct; the agent answered itself in the same turn ("the design has two moving parts: widen the pipe, and fill it"). Without the meta-question, the proof would have grown a third condition that was an implementation note. The pattern: *the agent's drive to formally name everything leaks into the proof structure unless the agent reflexively challenges its own additions.* When the agent did challenge, the conditions stayed at two; when it didn't, conditions accreted.

**Caveman-mode regressions.** In 478a2e77 the human set caveman mode "lite"; the agent held it briefly, then reverted to dense Information-Package prose within three turns.

---

**Net.** Strongest patterns: negative-check probes, boundary-bound dichotomies, designer-authority checks, tight forced-choice ratifications riding on a real Information Package. Weakest: stacked-clause questions, reflexive *what-do-you-think* without narrowing, proof-vocabulary leakage past the Translation Gate. The agent's failure modes are coherent — completion bias, accretion bias, projection bias. Each is correctable when surfaced, but correction is reactive; the patterns recur across sessions.
