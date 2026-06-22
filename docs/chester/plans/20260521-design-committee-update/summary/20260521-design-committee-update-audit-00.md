# Reasoning Audit: General Committee Skill Redesign

**Date:** 2026-05-22
**Session:** `00`
**Plan:** *(no plan document — execute-write phase skipped per designer direction)*

## Executive Summary

The session was opened to "finish design work" on the 20260521 design-system-analysis sprint and to red-team an under-specified actors model, but pivoted on designer direction into a self-contained redesign of the general `chester:design-committee` skill — separating the general-mandate primitive from skill-wrapped (Mode B) invocations, formalizing the `one-round-format`, removing the deprecated Arbiter role, and co-locating agent files under the skill. The most consequential decision was structural: a unanimous Committee ruling that the **convening message is the only legitimate attach point** for sprint-specific overlay, with three forbidden surfaces (agent files, the general SKILL.md, and output-field labels) protected by editorial discipline only. After designer adjudication of two split votes (Q2 partner-role placement, Q4 Researcher tool surface), the architecture stage produced a hybrid "compact self-contained primitive" that the designer ratified — but then directed the agent to skip spec-write, plan-build, execute-test, and execute-verify, taking the write-out direct. The work landed largely on-target but with explicit verification and records debt that this audit and the parallel summary are intended to back-fill.

## Plan Development

There was no formal plan document in this session. The agent reached implementation by traversing R1 (mode-separation Committee round), R2 (five open-questions Committee round + industry research), and a partial `design-specify` invocation that produced two competing architects plus a prior-art explorer — but stopped short of writing a spec, fidelity review, adversarial review, or ground-truth review. The designer's instruction "write the skill files using caveman full; hybrid" was treated as an explicit override of the normal Chester gauntlet (design → specify → plan → execute-test → execute-write → execute-verify-complete → finish). Phases 1–5 of the architect's migration sequence served as the de facto plan. The agent later flagged this workflow override directly to the designer when asked "why didn't we follow the normal chester process?", surfacing both the trade-off taken (speed) and the debt incurred (no spec-fidelity, no adversarial, no plan-attack, no plan-smell, no execute-verify checkpoint).

## Decision Log

### Hybrid architecture over either pure architect output

**Context:** `design-specify` returned two competing blueprints — Architect A (self-contained, ~330+ line SKILL.md, inline everything) and Architect B (reference-heavy, ~130 line SKILL.md, three new reference files, three existing references retired in place). The agent had to recommend one for designer adjudication and chose to author a hybrid rather than ratify either pure form.

**Information used:**
- Q2 ratification: reference `util-design-partner-role` with a load-bearing guard note (argues against full inline duplication).
- Q3 ratification: one-round-format inline (argues against extracting it to a reference).
- Q5 ratification: aggressive Arbiter cleanup, no backward compatibility — proof-session content is archive-only.
- Prior-art explorer findings: sprint 20260405-01 single-pass reviews matched multi-agent at 2–3× lower cost; sprint 20260423-01 aggressive-cleanup precedent.
- R1 §5 forbidden-surfaces rule: every new floor surface is a new editorial-discipline target.

**Alternatives considered:**
- `Pure Architect A (self-contained, fat SKILL.md)` — duplicates `util-design-partner-role` voice rules unnecessarily; archive-renames references that Q5 said should be removed.
- `Pure Architect B (reference-heavy)` — multiplies floor surfaces (three new references each becoming a protected surface); re-tires references that Q5 said should be deleted outright.

**Decision:** Compact self-contained primitive (~180–220 line target SKILL.md), no new references, proof-session references deleted outright, five-phase migration (manifest → file-moves → SKILL.md rewrite → skill-index → verification).

**Rationale:** The hybrid was framed as minimizing the count of protected floor surfaces while keeping the primitive cold-readable in a single file. Each pure architect's risk was named explicitly: A pays an editorial-sync cost on duplicated voice content; B multiplies the number of files the R1 §8 guards must reach. (inferred: the hybrid was also the path that most cleanly honored Q5's "no backward compatibility" ratification, since both pure architects compromised on archive-rename.)

**Confidence:** High — the recommendation cites four ratified decisions (Q2, Q3, Q5, R1 §5) directly and the trade-off is named with sacrifices declared (SKILL.md longer than B's).

---

### Skipping spec-write, plan-build, execute-test, execute-verify-complete

**Context:** After the agent presented the three-option architecture packet (A / B / Hybrid) with the hybrid as recommendation, the designer replied "write the skill files using caveman full; hybrid" — collapsing the remainder of the Chester pipeline into a direct write instruction.

**Information used:**
- Instruction priority (user > skills > defaults) per Chester convention.
- `design-specify` skill workflow normally proceeds to spec writing, then spec-fidelity review, adversarial review, ground-truth review, user review gate.
- `plan-build`, `execute-test`, `execute-write`, `execute-verify-complete` are the normal downstream stages.

**Alternatives considered:**
- `Insist on the full pipeline` — would have overridden a direct designer instruction; treated as not the agent's call.
- `Run an abbreviated spec/plan inline before writing` — not authorized by the instruction.

**Decision:** Treat "write the skill files" as direct override, skip all intermediate stages, execute the hybrid's five phases against the live tree.

**Rationale:** The agent later articulated this explicitly when challenged: "your 'write the skill files' was an explicit override and I followed it." The trade-off was named at the time of challenge — speed vs verification debt vs records debt. (inferred: the agent did not push back at the moment of the instruction because the designer's authorship of the original instruction was unambiguous; the retrospective surfacing happened only when the designer asked "why didn't we follow the normal chester process?")

**Confidence:** High — the agent's own retrospective enumerates exactly what was skipped and frames it as override-driven; no ambiguity in the transcript.

---

### Convening-message-only attach point as R1 ratified outcome

**Context:** The opening design question was how Mode A (general committee) and Mode B (skill-wrapped committee) should stay structurally separated so the overlay never bleeds back into the general primitive. The team-lead had to compile four pole positions into a designer-facing decision packet.

**Information used:**
- All four poles (Conservator, Innovator, Pragmatist, Purist) independently converged on convening message as the legitimate attach point in their R1 initial positions.
- All four independently identified agent-file contamination as the load-bearing failure mode.
- The Innovator→Conservator Q+A exchange surfaced that the general SKILL.md itself is also a persistent floor document, and weakening edits to it are floor violations — not just overlay injection.
- The Conservator→Purist exchange tightened the "pole independence" claim to first-formation-only, reframing the output-field protection on reader-legibility grounds rather than independence.

**Alternatives considered:**
- `Agent-file overlay` — rejected by all four poles; canonical drift path.
- `General SKILL.md overlay` — rejected by all four poles; contaminates the floor document future audits compare against.
- `Output-format field redefinition` — rejected on reader-legibility grounds.

**Decision:** Ratify Option A (convening-message-only attach point) with three explicit guards in the SKILL.md: positive contract statement, floor-not-ceiling rule, three protected surfaces.

**Rationale:** Convergence-plus-sharpening — the four-pole convergence was not just unanimous on the attach point but the Q+A round added two specific guard nuances (floor-not-ceiling, output-field protection on legibility grounds) that the packet promoted from implicit to explicit.

**Confidence:** High — the four pole positions and the Q+A transcript are on the record verbatim; the packet is a faithful compilation.

---

### Drop Arbiter from committee establishment

**Context:** At team standup, the agent had to decide whether to spawn all six canonical members (4 poles + Arbiter + Researcher) or drop the Arbiter. The designer had said "committee plus researcher".

**Information used:**
- Current sprint had no proof state — meta-architectural work, no engine to consult.
- The designer's language explicitly named "committee plus researcher".
- The skill's canonical six-role roster includes Arbiter as proof-state custodian.
- (inferred from context) The broader proof-system is in the process of being deprecated; the Arbiter's role is itself under reconsideration this sprint.

**Alternatives considered:**
- `Keep Arbiter for canonical six, stand down on first reply` — preserves skill canon but adds noise.
- `Convene custom-bound Arbiter` — no state source applies; no useful binding exists.

**Decision:** Drop Arbiter; convene five members (4 poles + Researcher) under team slug `design-committee-general`.

**Rationale:** With no proof engine to consult, the Arbiter's redefined purpose was moot; omitting was cleaner than spawning-then-standing-down. The agent explicitly asked the designer to confirm ("Drop Arbiter from team establishment, or keep for canonical six?") and received "drop" before executing.

**Confidence:** High — confirmed by designer ratification before execution.

---

### Phased commits over atomic single-commit migration

**Context:** Migration shape was a second axis the agent identified during specify but did not architect head-on. The hybrid needed to embed a migration shape and the agent chose phasing.

**Information used:**
- Industry research on plugin manifest behavior: `plugin.json` `agents` field replaces (not augments) the default scan — Phase 1 carries silent-override risk if mis-edited.
- Both architect blueprints implied at minimum 2 stages because Track A depends on Track #11 (manifest).
- Rollback cost differs materially between phasing and atomic.

**Alternatives considered:**
- `Atomic single-commit` — saves merge nodes but loses ability to roll back one track without rolling back all.

**Decision:** Five phases — manifest update first (smoke-test), then agent-file moves + Arbiter delete + researcher Q4 constraint, then SKILL.md rewrite + reference deletion, then skill-index update, then verification.

**Rationale:** Phasing surfaces failure early — Phase 1 isolates the highest-risk change (manifest replace-not-augment behavior) so the smoke test catches silent-override before any irreversible work happens. Atomic would have made the failure mode harder to localize.

**Confidence:** High — rationale is named explicitly in the hybrid block and follows directly from the industry-research finding on `agents` field semantics.

---

### One-Round-Format protocol drift correction (mid-deliberation)

**Context:** During R1, the agent built a four-stepped peer-DM protocol (Step 1 position → Step 2 circulate-and-ask → Step 3 answer → Step 4 revised position) rather than the single-pass shape the designer had named. Two poles' Step-2 questions were held on a stage-ordering rule the agent had invented. The designer intervened twice to correct course.

**Information used:**
- Designer's original instruction: "One round, each can ask 1 question of another agent with the asked agent providing 1 response. All agents see the question and response. Submit your positions to the team lead."
- Designer's first correction: "why are we making the team lead the telephone switch operator? Agents send message direct to peers in parallel."
- Designer's second correction: "remove the visibility constraint; 1x question message to selected agent and 1x response back; then send positions up to team lead. response only".

**Alternatives considered:**
- `Defend the four-step protocol` — explicitly rejected; the agent self-corrected and acknowledged "Mis-read your instruction. Apologies."
- `Re-dispatch the original prompt before resolving ambiguities` — the agent held dispatch and surfaced two open ambiguities (questions-blind-or-after-circulation; one-or-many responses per multi-asked target) before any further peer messaging.

**Decision:** Lock the corrected One-Round-Format: team-lead is dispatcher + receiver + compiler only; poles send peer-DM direct; one Q + one A per pair; team-lead compiles at end without relay during steps 2–3.

**Rationale:** Designer instruction priority. The agent treated the format as canonical and documented it in the in-flight transcript so the protocol could be cited in the eventual SKILL.md (Q3 later ratified inline placement).

**Confidence:** High — the agent's correction message names the wrong reading verbatim and the corrected reading verbatim, and the designer ratified the corrected reading immediately.

---

### Refusing to relay false-premise peer questions

**Context:** Mid-R1 (before the protocol correction), Pragmatist sent a peer question that premised Innovator's attach point as "a dedicated skill-overlay file" — but Innovator's actual §2 named the convening message. Purist did the same with a different premise error.

**Information used:**
- Innovator's R1 §2 verbatim ("the preferred attach point is the convening message").
- Pragmatist's question premise ("a dedicated skill-overlay file read by team-lead at convening time").
- One-question-per-round constraint — a false-premise question wastes the slot.

**Alternatives considered:**
- `Relay as written` — would let the false premise stand and waste the question slot.
- `Silently rewrite the question` — would put the team-lead in the position of editorial-rewriting peer content, beyond the compile-not-relay discipline.

**Decision:** Hold both questions, reply to each pole with the correction and the actual position they had misread, instruct them to wait for peer-position circulation before re-drafting.

**Rationale:** A team-lead who relays known-false-premise content is not preserving the integrity of the deliberation; the role is faithful compilation, not protocol nullification. The agent surfaced this as an insight before holding.

**Confidence:** Medium — the agent's hold-and-correct was the right call under the four-step protocol it had (wrongly) installed, but the underlying problem (poles answering before peer positions were circulated) was a consequence of the agent's own mis-built protocol. The hold action was correct; the protocol that created the situation was not.

---

### Dispatching both architects on one axis instead of two

**Context:** `design-specify` prescribes two competing architects on two different axes (one tension per architect). The agent identified two tensions (content-placement and migration shape) and chose to dispatch both architects on opposing ends of the same axis (content-placement).

**Information used:**
- Two tensions surfaced from the brief: SKILL.md self-containment vs reference-heavy, and atomic-vs-phased migration.
- The skill's prescribed two-architects pattern is two-axis, not two-pole-on-one-axis.
- Q1–Q5 were already ratified; content-placement was named as the sharpest remaining tension because future drift exposure depended on it.

**Alternatives considered:**
- `Two architects on two axes (skill canonical)` — the prescribed pattern.

**Decision:** Both architects on content-placement axis; fold migration shape into the hybrid recommendation as a self-proposed variant.

**Rationale:** The agent justified the deviation via the skill's null-architect-case fallback ("the dispatcher build the hybrid by composing the placement winner with a self-proposed migration-shape variant"). Worth flagging: the agent explicitly named this as procedural drift in an insight block ("worth noting; not blocking") rather than masking it.

**Confidence:** Medium — the deviation was acknowledged in-line and the fallback path is defensible, but a strict reading of `design-specify` would require two-axis dispatch. (inferred: the agent's transparency about the deviation is the load-bearing element here; the choice was made consciously, not by mistake.)

---

### Caveman-full voice for SKILL.md write-out

**Context:** Designer instruction was "write the skill files using caveman full; hybrid". The agent had to decide what compression discipline to apply to a file the designer-facing R1 packet had said should be readable cold.

**Information used:**
- Designer's explicit instruction naming caveman-full.
- Established Chester voice discipline: designer-facing artifacts use plain language; inter-agent and chat-channel communication uses caveman.
- SKILL.md is read by future Claude instances dispatching the skill, not directly by the designer in normal flow.
- R1's "cold-readable in a single file" goal.

**Alternatives considered:**
- `Plain language` — would have violated the explicit instruction.
- `Caveman-lite or caveman-ultra` — not specified.

**Decision:** Write in caveman-full; accept that the SKILL.md becomes 250 lines (over the 180–220 target) because the contract block compresses badly under caveman.

**Rationale:** Direct instruction priority. The agent surfaced the line-count overshoot honestly at completion ("touch above target but acceptable for caveman compression on the contract block") rather than hiding it.

**Confidence:** High — direct instruction; the post-write disclosure was transparent.

---

### Dispatching industry-explorer agent for plugin-resolver question

**Context:** R2 surfaced Q1 (plugin namespace mechanics) with the Researcher finding that plugin resolver behavior is undocumented in the Chester repo itself. The agent had to decide how to resolve the unknown before Track A (file moves) could execute.

**Information used:**
- Researcher's R2 finding: "Q1: plugin resolver behavior is undocumented in the repo — need empirical verification".
- `chester:design-large-task-industry-explorer` exists as a named subagent for external prior-art research.
- The file move requires knowing whether identifier `chester:design-committee-conservator` is path-based or name-based; getting it wrong silently breaks all dispatch sites.

**Alternatives considered:**
- `Empirical test with a throwaway agent` — designer-suggested fallback in the R2 packet.
- `Proceed without verification and pray` — not seriously entertained.

**Decision:** Dispatch the industry-explorer agent in background; surface findings when it returns.

**Rationale:** External prior art is the exact case the explorer agent is designed for; the codebase couldn't answer the question and an empirical test risked the same silent-override the manifest's `agents` field can produce. The explorer returned an authoritative answer (path-based identifier; field replaces rather than augments) that named a specific failure mode the redesign then designed around.

**Confidence:** High — the agent's own insight block at the time named this as "the exact case the agent was designed for: external prior art that local code cannot provide".

---

### Listing both `./agents/` and `./skills/design-committee/agents/` in plugin.json

**Context:** Industry research returned the load-bearing finding that the `plugin.json` `agents` field replaces (not augments) the default scan. The agent had to author the manifest update.

**Information used:**
- Industry research authoritative finding: "`plugin.json` `agents` field REPLACES the default scan (does not augment)".
- Failure mode: if only `./skills/design-committee/agents/` is listed, all other Chester agents under top-level `agents/` go silently invisible.
- Identifier preservation requirement: `chester:design-committee-conservator` must continue to resolve unchanged.

**Alternatives considered:**
- `Single path (./skills/design-committee/agents/ only)` — silently breaks every non-committee agent.
- `Default scan (no agents field)` — defeats the co-location goal.

**Decision:** `"agents": ["./agents/", "./skills/design-committee/agents/"]` — both paths listed.

**Rationale:** Replace-not-augment semantics make omission silently destructive; both paths are required to preserve the rest of the agent surface.

**Confidence:** High — the rationale is on the research record and the post-execution state confirms the field was written with both paths.

---

### Deleting proof-session reference guides outright rather than archiving in place

**Context:** Hybrid called for outright deletion of the three proof-session references (arbiter-guide, team-lead-guide, researcher-guide). When the agent attempted `rm`, it received a permission denial. The designer subsequently archived and deleted the files manually.

**Information used:**
- Q5 ratification: "no backward compatibility required; previous proof sessions are archive-only".
- Hybrid architecture rationale: retire-in-place and archive-rename both leave dead proof-session content discoverable in `references/`.
- Git history preserves deleted files for any future revival.

**Alternatives considered:**
- `Archive-rename with superseded headers (Architect A's choice)` — leaves dead content discoverable.
- `Retire-in-place with supersession notice (Architect B's choice)` — same problem.
- `Move out of references/ to a quarantine dir` — adds a new directory the design did not need.

**Decision:** Delete outright; rely on git history for any future revival.

**Rationale:** Honors Q5 most cleanly and keeps the `references/` directory empty (achievable end state) rather than carrying dead floor surfaces. The agent surfaced the `rm` permission failure honestly and offered the designer four alternatives rather than masking the gap.

**Confidence:** High — the design choice is on record in the hybrid block and the post-execution state confirms `references/` is empty.

<!-- created-at: 2026-05-22T00:00:00Z -->

<!-- created-at: 2026-05-23T00:57:03Z -->
<!-- produced-by finish-write-records@v0003 -->
