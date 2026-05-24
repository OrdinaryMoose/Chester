# Problem-Focused Understanding-MCP Flow

**For:** `ACTIVE_UNDERSTANDING_MCP: problemfocused`
**MCP server:** `chester-design-understanding-problemfocused`
**Tools:** `initialize_understanding`, `seed_glossary`, `apply_vocabulary_action`, `submit_round_evidence`, `resolve_override`, `get_understanding_state`

This file specifies the Understand-Stage per-turn cycle and transition gate
when the swap line in `SKILL.md` is set to `problemfocused`. Load and follow
this file's instructions whenever SKILL.md directs you to consult the active
MCP-flow reference.

The Understand Stage's job here is **converge on a problem statement**, not
build an architectural sketch. Solve-side work (verbs, payloads, schemas,
sync/async, named patterns, layer assignments) belongs in the Solve Stage.
The MCP's Phase-Vocabulary Classifier rejects solve-side language at the API
boundary; offending entries route to the Solve Leakage Ledger as handoff
input to Solve, not Understand-stage evidence.

## The Nine Tenets (problem-side axes)

1. **`problem_articulation`** — what's broken / missing / sub-optimal in observable terms; current_behavior + desired_behavior
2. **`success_criteria`** — measurable definition of solved (measurement | observable | anti_goal)
3. **`done_state_vision`** — vivid imagined end-state (concrete imagined_moment)
4. **`constraint_envelope`** — hard_limit | inheritance with source citation
5. **`scope_boundary`** — IN | OUT | BORDERLINE with source
6. **`personal_use_case_map`** — role: current_me | future_me; future_me requires context_assumed_lost
7. **`cost_energy_budget`** — effort_tolerance | complexity_ceiling | maintenance_budget | why_now (walk-aways soft, agent-commentary only if naturally surfaced)
8. **`project_fit`** — ALIGNED | NEUTRAL | MISFIT; MISFIT triggers Convention-Break Override
9. **`open_questions_ledger`** — designer_hesitation | agent_uncertainty | ambiguous_term | leaked_solve_item

## The Five Cross-Cutting Mechanisms

1. **Phase-Vocabulary Classifier** — rejects solve-side tokens (payload, schema, sync/async, named patterns, etc.) at submit. Offending entries route to Solve Leakage Ledger.
2. **Solve Leakage Ledger** — preserved as Solve-phase handoff input; visible as drift signal.
3. **Problem-Statement Repeat-Back Gate** — agent submits restated problem; designer ratifies via quote; cosine-stability ≥ 0.7 between most recent two ratified statements; required from round 3 onward.
4. **Convention-Break Override Rule** — applies to project_fit (MISFIT), constraint_envelope (relaxes_prior_constraint), scope_boundary (placement IN with previously_marked != IN), open_questions term-redefinition. Held in `pending_overrides` until designer ratifies.
5. **Vocabulary Lockdown Classifier** — active glossary returned every round. Five classifications: CONSISTENT / PROPOSE / DEPRECATE / DRIFT / CONFLICT. Six actions: ADD / REMOVE / RENAME / SPLIT / MERGE / DEFER (plus REMOVE_AND_ADD compound). Action validity constrained by the matrix.

## Round-Zero Initialization (executed once, before first designer-facing turn)

1. Classify the task internally: **brownfield** | **greenfield**. Internal-only.
2. Call `initialize_understanding` with:
   - `user_prompt`: the designer's initial request
   - `state_file`: `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-understanding-state.json`
3. **Extract candidate vocabulary from explorer findings.** Read the three explorer reports (codebase, prior-art, industry). For each load-bearing noun-phrase that appears as a substantive concept, prepare a `seed_term` entry with:
   - `canonical_name`
   - `definition` (the meaning the explorer used; concise)
   - `source` (which explorer + which artifact citation)
   - `aliases` (any obvious variant names)
   - `sense_constraints` (notable "NOT this other thing" markers if applicable)
4. Call `seed_glossary` with the prepared seed terms. They enter as `PROPOSED-PENDING-DESIGNER`.
5. Proceed to Round-One framing. The framing must include a **glossary ratification** section presenting the seeded terms for designer confirmation, correction, or rejection. (See "Round-One framing additions" below.)

### Round-One framing additions — Two-Turn Sequence

Round One in problemfocused is a **two-turn sequence with a vocabulary-ratification stop in the middle**. SKILL.md's standard Phase 3 steps are split across the two turns.

**Turn A — Framing + Vocabulary Stop**

1. Present SKILL.md's four standard framing blocks (What we're working on / What decision space we're entering / What I looked at / Where I landed).
2. Present the **Vocabulary I'm starting from** block — seeded terms in plain language. Example wording:

   > *"Before we go any further, here's the working vocabulary I'm carrying in. I'm calling X 'story' — top-level narrative unit, from the codebase. I'm calling Z 'session' — a runtime instance, from prior-sprint W. Tell me if any of these names or definitions don't match how you think about it. We lock these in before moving on to the rest of what I've found."*

3. **Stop here. Do NOT present the gap map. Do NOT enter the standard ready-check.** End the turn after the vocabulary block with a vocabulary-ratification prompt — designer either confirms en bloc, corrects specific entries, or proposes alternatives.

4. Status line: `→ Round One — Vocabulary Ratification`

**Designer response → Vocabulary actions**

Process the designer's response by issuing `apply_vocabulary_action` calls:
- En-bloc confirmation → `ADD` per term with designer quote → status becomes `DEFINED`
- "Call X 'storyform' instead" → `RENAME`
- "Y and Z are the same thing, just call them Y" → `MERGE`
- "These are actually different concepts" → `SPLIT`
- "Drop W — not load-bearing" → `REMOVE`
- "Not sure yet, let's leave it open" → `DEFER`

If the designer raises a vocabulary point not on the seeded list, that's a fresh `PROPOSE` → `ADD`.

After all actions are applied, the active glossary is updated; proceed to Turn B.

**Turn B — Gap Map + Ready Check**

1. Present SKILL.md Phase 3's gap map (the four observation sections + "what the agent can't determine from code alone").
2. Standard ready-check for entering the Understand Stage (per SKILL.md step 6).
3. Status line: `→ Round One — Initial Information Presentation`

**Why two turns:** vocabulary alignment is load-bearing for everything that follows — the gap map and all subsequent observations should use canonical names from the locked glossary, not provisional names. Stopping for ratification before the rest of the information lands ensures the agent's gap-map prose uses the designer's vocabulary, not the agent's seeded guesses.

**Vocabulary actions can also fire from Turn A's framing blocks themselves** if the designer's correction reveals a vocabulary issue with the framing's word choice. Apply those actions during the Turn A → Turn B handoff alongside the seeded-term ratifications.

### Gap-map data shape

The "what the agent can't determine from code alone" section presents explicit gaps drawn from `open_questions_ledger` entries (status: `OPEN`) plus `term_drift_candidates` if any have surfaced.

## Understand-Stage Per-Turn Flow

One cycle runs per designer response. Single agent, all roles.

### Step 1: Capture thinking
If a trigger point is met, call `capture_thought`:
- New understanding emerges → tag: `understanding-[topic]`, stage: `Understand`
- Line of thinking shifts → tag by new topic, stage: `Analysis`
- Designer rejects or corrects → tag: `constraint` + topic, stage: `Constraint`

### Step 2: Read the active glossary
The previous `submit_round_evidence` (or `seed_glossary` for round 1) returned the active glossary in its response. **Re-read it before composing this turn's evidence.** Past iterations of this skill drifted into synonym-soup because the agent forgot what was locked in. The glossary is your source of truth for vocabulary; use canonical names for terms that are DEFINED.

### Step 3: Process designer signals
Read the designer's response. Identify:
- **Vocabulary signals** — designer ratified a term, proposed a new term, rejected an existing term, or used a term in a different sense than glossary. Each becomes a `vocabulary_action` candidate.
- **Convention-break signals** — designer relaxed a previously-set constraint, pulled a previously-OUT scope item to IN, or stated a project-fit MISFIT. Each becomes an `override` candidate that must be surfaced for ratification.
- **Tenet evidence** — observable problem statements, success markers, scope boundaries, use cases, etc.

### Step 4: Apply vocabulary actions
For each vocabulary signal, classify and apply:
- **CONSISTENT** — no action needed; term used correctly
- **PROPOSE** — agent or designer introduced a new term → `apply_vocabulary_action({action: 'ADD', ...})` with definition and (if available) designer quote
- **DEPRECATE** — term no longer load-bearing → `REMOVE` (or DEFER if unclear)
- **DRIFT** — term used in different sense than glossary → present resolution options (RENAME / SPLIT / REMOVE_AND_ADD / DEFER) to designer this turn
- **CONFLICT** — new term covers same concept as an existing glossary term → present resolution options (MERGE / RENAME / SPLIT / DEFER)

The vocabulary classifier is **agent-driven** in v0.1 (LLM-judge dispatches are TODO). You are the judge; classify carefully against glossary state. Action validation is structural — the matrix rejects invalid combinations.

### Step 5: Resolve any pending overrides
If `pending_overrides` from prior rounds includes items that the current designer turn has now ratified or rejected, call `resolve_override` with the appropriate disposition (`RATIFIED` / `REJECTED` / `DEFERRED`) and the designer quote.

### Step 6: Compose tenet evidence
Build per-tenet evidence entries based on what the designer just said and what you observe. Each entry has tenet-specific required fields (see schema below). Phase-vocabulary classifier will reject solve-side language; rewrite as problem-side framings or accept that the entry will park in Solve Leakage.

**Tenet entry schemas** (load-bearing fields only):

- `problem_articulation`: `text`, optional `current_behavior`, optional `desired_behavior`, optional `event_type`
- `success_criteria`: `text`, one of `measurement` | `observable` | `anti_goal`
- `done_state_vision`: `text`, `imagined_moment` (concrete picture)
- `constraint_envelope`: `text`, `constraint_type` (hard_limit | inheritance), `source`
- `scope_boundary`: `text`, `placement` (IN | OUT | BORDERLINE), `source`
- `personal_use_case_map`: `text`, `role` (current_me | future_me), `scenario`, future_me requires `context_assumed_lost`
- `cost_energy_budget`: `text`, `dimension` (effort_tolerance | complexity_ceiling | maintenance_budget | why_now)
- `project_fit`: `text`, `alignment` (ALIGNED | NEUTRAL | MISFIT), `project_convention_referenced`, MISFIT requires `override_reason`
- `open_questions_ledger`: `text`, `question_source`, `status`

### Step 7: Compose problem-statement repeat-back (round 3+)
From round 3 onward, include `repeat_back_statement`: a one-sentence consolidated restatement of the problem in the designer's words, using glossary canonical names. Aim for cosine-stability ≥ 0.7 with the prior ratified restatement (refining wording, not redefining).

If the designer's most recent turn explicitly ratifies your restatement, include `repeat_back_designer_quote` with the verbatim ratification.

### Step 8: Submit
Call `submit_round_evidence` with:
- `state_file`
- per-tenet entries
- `repeat_back_statement` and `repeat_back_designer_quote` (if available)

The MCP returns:
- `tenet_scores`, `overall`, `weakest`
- `glossary` (full active glossary — read for next turn)
- `pending_overrides` (unresolved)
- `pending_vocab_dispositions` (unresolved)
- `solve_leakage_this_round` (rejected entries)
- `solve_leakage_total` (cumulative)
- `term_drift_candidates` (3+ rounds, not in glossary)
- `repeat_back_history` (last 3)
- `transition` (ready, reasons)

### Step 9: Choose topic for next turn
Priority order:

1. **Pending vocab dispositions** — unresolved DRIFT or CONFLICT items must be settled with designer before continuing
2. **Pending overrides** — any unresolved Convention-Break Override must surface for ratification
3. **Term-drift candidates** — terms used in 3+ rounds without becoming `DEFINED` glossary entries; raise with designer
4. **Weakest tenet by contribution** — score × weight; the MCP returns this directly
5. **Solve leakage rate** — if leakage is high (>30% of round entries), surface to designer that we keep drifting into solve and need to refocus on the problem
6. **Coverage rotation** — next under-populated tenet

### Step 10: Compose information package + commentary
Build the Understand-Stage information package per SKILL.md.

**Critical:** the information package and commentary use **canonical names from the active glossary**. Do not introduce synonyms. If a concept lacks a glossary entry, propose it explicitly via the conversation rather than inventing a new term and using it implicitly.

In commentary:
- Surface pending vocabulary dispositions naturally: *"You said 'narrative' — we already locked 'story' for that. Same thing, or are these distinct?"*
- Surface pending overrides naturally: *"That relaxes the constraint we locked earlier about W. Want to call that change deliberate, or are we still feeling it out?"*
- If solve leakage was high this round: *"We've drifted into solve-mode a few times this round — let me pull us back to the problem-side."*

End with the standard closing variant ("What do you think?" / "Does that match your sense of it?" / etc.).

Verify C1 and C2 from `util-design-partner-role` before sending.

### Step 11: Translation Gate over output
Same gate as classic — no type/class/property/method names, no dimension/tenet names, no scores, no JSON, no MCP mechanism names. Plain language only.

## Stage Transition

**Transition criteria:**
1. Every tenet score ≥ 0.40 (floor)
2. Overall (weighted sum) ≥ 0.65
3. Designer-ratified problem-statement repeat-back in last 2 rounds
4. Repeat-back cosine stability ≥ 0.7 between most recent two ratified statements
5. No unresolved Convention-Break Overrides
6. No unresolved vocabulary pending dispositions

**Transition process:**
1. MCP reports `transition.ready: true` (all six criteria met)
2. Recognize that the conversation is pulling vertical
3. Present a transition summary to the designer in domain language — the consolidated problem statement, key constraints, scope boundaries, the use cases, what's still ambiguous (any DEFERRED items)
4. Designer confirms problem statement is sufficient to begin Solve
5. `capture_thought()` with tag `understanding-confirmed`, stage `Transition`
6. Announce the Solve Stage opening (proceeds per SKILL.md Phase 4 Solve Stage Opening)

The Solve Stage receives:
- The ratified problem statement (from `repeat_back_history`)
- The active glossary (canonical vocabulary for the design)
- The Solve Leakage Ledger (parked solve-mode statements as proof-stage seed material)
- The vocabulary action log (audit trail of how vocabulary evolved)

## State-Resume on Compaction

If `understanding-confirmed` thought is absent on resume, the Understand Stage was active. Call `get_understanding_state` to reload tenet scores, glossary, pending overrides, pending vocab dispositions, and repeat-back history. Re-read the active glossary before composing the next turn. Summarize current understanding in domain language and resume.

## Brief-Render Read Shape

At Closure, the design brief reads from the understanding state file. Problemfocused state shape includes:
- `tenetScores`, `tenetEntries` — per-tenet scoring + entry ledgers
- `glossary` — final ratified vocabulary (CANONICAL for the brief)
- `vocabularyActionLog` — full audit trail of vocab mutations
- `pendingOverrides` — should be empty at transition; any deferred items captured
- `solveLeakageLedger` — parked solve-mode entries as Solve handoff
- `repeatBackHistory` — final ratified problem statement is the most recent ratified entry
- `scoreHistory`, `transitionHistory`, `warningsHistory` — telemetry

**Render guidance:**
- Use canonical glossary names throughout the brief
- Include a "Vocabulary Established" section listing the final glossary entries
- Include a "Solve Handoff" section listing the Solve Leakage entries (these become Solve-stage seed material)
- The thinking summary captures vocabulary evolution (action log) plus the per-round scoring evolution

## Tool Call Patterns (quick reference)

```
# Init
initialize_understanding({ user_prompt, state_file })
seed_glossary({ state_file, seed_terms: [...] })

# Per-turn
apply_vocabulary_action({ state_file, action, classification, target_terms, new_term?, reason, designer_quote })
resolve_override({ state_file, override_index, disposition, designer_quote })
submit_round_evidence({ state_file, ...tenetArrays, repeat_back_statement?, repeat_back_designer_quote? })

# Read
get_understanding_state({ state_file })
```
