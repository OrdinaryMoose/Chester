# Reasoning Audit: Experimental Design Skill with Formal Proof Language

**Date:** 2026-04-08
**Session:** `01`
**Plan:** `plan-mode-design-guard-plan-00.md`

## Executive Summary

The session set out to design Plan Mode integration for the design interview and evolved into something significantly more ambitious: a formal proof language that replaces both MCPs. The most significant decision was the designer's reframe from "prevent code writing" to "give the agent something better to write" — this redirected the entire design from constraint-based to channeling-based. The implementation stayed on-plan with one notable deviation: the state.js implementer used Map instead of plain objects for elements, which was a local decision that didn't affect the interface contract.

## Plan Development

The plan emerged from a full pipeline run: design interview (7 rounds), specification, competing architectures (3 agents), spec review, plan writing, plan review, and adversarial hardening (plan-attack + plan-smell). The design interview itself was compressed — the designer provided the problem statement directly and drove several key reframes. The plan was shaped by incorporating 7 findings from the threat report into the implementation.

## Decision Log

### Problem reframe from constraint to channeling

**Context:**
The agent initially framed the problem as "reliability improvement vs elegance improvement" around Plan Mode. The designer rejected both frames, stating that token cost is a byproduct of poor protocol design, not a driver.

**Information used:**
- Designer's direct correction: "token use is by product of long interviews and not a driver for redesign"
- Prior sprint 20260405-01 (architect-round-one-fix) establishing the redirect-don't-prohibit principle

**Alternatives considered:**
- `Reliability framing` — Plan Mode prevents real failures → rejected by designer
- `Elegance framing` — Plan Mode simplifies skill instructions → rejected by designer

**Decision:** Reframe to "how do we use better behavioral instructions to discourage the agent from writing code during the design interview."

**Rationale:** The designer identified that the original feature brief's framing missed the root cause — the protocols themselves are poorly designed, not just the constraints within them.

**Confidence:** High — designer explicitly stated this.

---

### Plan Mode as floor, proof as the interesting design

**Context:**
After establishing that Plan Mode covers all implementation actions (even if the agent invokes downstream skills, those skills can't write either), the question became what else is needed beyond Plan Mode.

**Information used:**
- Designer's observation that Plan Mode works as a blanket even for skill invocations
- The architect Round One lesson (score 1 in thinking.md): "Redirect the agent's goal rather than prohibiting behavior"

**Alternatives considered:**
- `Plan Mode only` — sufficient for file-write prevention but doesn't address mental implementation drift → designer said "not interesting anymore"
- `Plan Mode + revised behavioral instructions` — agent considered this but designer pushed for something more fundamental

**Decision:** Plan Mode becomes the safety floor; the real design question is what positive activity channels the agent's energy better than code writing.

**Rationale:** Designer explicitly asked "what design product deliverable is more interesting to the agent than writing code?" This moved the design from constraint territory to incentive design.

**Confidence:** High — designer's direct framing.

---

### "The design is the code" — proof language concept

**Context:**
The agent proposed four options for design-level deliverables (living model, design prototyping, adversarial artifact, progressive spec draft). The designer pushed further with the insight that the agent could write the design itself as if it were code.

**Information used:**
- Designer's direct input: "what if the design is the 'code' and the agent writes that"
- Analysis of what makes code satisfying: concrete, verifiable, progressively complete

**Alternatives considered:**
- `Living Mermaid diagram` — visual, progressively refined → superseded by proof concept
- `Adversarial threat model` — channels analytical drive → too narrow
- `Progressive spec draft` — incremental building → close but less formal
- `Structured document with sections` — agent proposed this first → designer pushed for more formalism

**Decision:** A formal proof language with seven element types and four operations, submitted via MCP tool calls.

**Rationale:** The geometric proof analogy (designer-originated) provided the right formalism level — each element must be justified, each step traceable, the proof verifiable. The agent's completion drive channels into building the proof.

**Confidence:** High — designer originated the concept and confirmed the direction.

---

### Proof subsumes enforcement MCP

**Context:**
After the proof concept was established, the question arose whether the proof MCP replaces or coexists with the enforcement MCP. The designer asked "what do we lose by taking away enforcement?"

**Information used:**
- Analysis of enforcement MCP's four functions: ambiguity tracking, challenge triggers, readiness gates, closure gating
- Mapping of each function to proof-structural equivalents
- Thinking.md lesson about self-assessment weakness

**Alternatives considered:**
- `Proof alongside enforcement` — both run in Phase 2 → rejected as redundant; three MCPs per turn is excessive
- `Proof replaces enforcement only` — keep understanding MCP for Phase 1 → designer chose to remove understanding MCP too

**Decision:** The proof MCP replaces both understanding and enforcement MCPs. Phase 1 becomes conversational with no MCP. Phase 2 uses the proof MCP exclusively.

**Rationale:** Challenge triggers derived from proof structure (untested assumptions, scope growth, stall detection) are more precise signals than the enforcement MCP's self-assessed dimension scores. The proof provides structural evidence rather than the agent "marking its own homework."

**Confidence:** High — designer confirmed after verifying challenge modes could be preserved.

---

### Clean architecture over Minimal

**Context:**
Three architect agents proposed Minimal (3-file, 3-tool), Clean (4-module, 3-tool), and Pragmatic (4-module, 6-tool) approaches.

**Information used:**
- Architect 1's three-file reuse pattern matching enforcement MCP
- Architect 2's four-module separation (proof.js/metrics.js split)
- Architect 3's per-operation tools
- Designer's question: "can clean extend to pragmatic later?"

**Alternatives considered:**
- `Minimal (3-file)` — smallest diff, fastest to implement → can't cleanly extend to per-operation tools later
- `Pragmatic (6-tool)` — most granular → too much ceremony for an experiment
- `Hybrid (Minimal + Clean's integrity functions)` — agent's initial recommendation → superseded by Clean after extensibility question

**Decision:** Clean architecture (4 modules, 3 tools) because it extends to Pragmatic's granularity without refactoring.

**Rationale:** The designer asked whether Clean could extend to Pragmatic later — the answer was yes (splitting `submit_proof_update` into per-operation tools is a `server.js` change only). This made Clean the better investment. (inferred: the designer values extensibility for an experimental feature that may evolve rapidly)

**Confidence:** High — designer explicitly chose after the extensibility analysis.

---

### Compaction hooks excluded from scope

**Context:**
The adversarial review flagged that compaction hooks are hardcoded to understanding/enforcement state files and won't discover proof state files.

**Information used:**
- `pre-compact.sh` lines 39-40 globbing for `*-understanding-state.json` and `*-enforcement-state.json`
- Compaction hooks were themselves recently implemented (merged 2026-04-08)

**Alternatives considered:**
- `Broaden the glob` — `*-state.json` or `*.json` in design directory
- `Add parallel glob` — keep existing, add `*-proof.json`
- `Exclude entirely` — don't update compaction hooks

**Decision:** Exclude from scope — "avoid compounding experimental features."

**Rationale:** Designer's direct instruction. Compaction hooks are themselves experimental (merged same day). Layering one experimental feature on another increases failure surface.

**Confidence:** High — designer explicitly stated this.

---

### Contradiction detection scoped to structural anomalies

**Context:**
The adversarial review flagged that "contradiction detection" requires NLU that a Node.js MCP can't provide.

**Information used:**
- Enforcement MCP (`scoring.js`) contains no contradiction logic — validates input format and computes scores only
- Analysis of what a Node.js validator can mechanically detect vs. what requires natural language understanding

**Alternatives considered:**
- `Full semantic contradiction detection` — requires NLU → not implementable in Node.js
- `Structural anomaly detection` — withdrawn-basis citations, boundary collisions, confidence inversions, stale dependencies → all graph traversals on JSON
- `Drop entirely` — no contradiction checking → loses useful structural feedback

**Decision:** Scope to four structural integrity checks. Rename from "contradiction detection" to "integrity warnings." Semantic contradictions are the agent's responsibility through commentary.

**Rationale:** "Start simple and clear, we can iterate in next versions" — designer's direct instruction. The four structural checks are mechanically implementable and useful. Semantic detection can be added later if needed.

**Confidence:** High — designer explicitly confirmed.

---

### EnterPlanMode false positive resolution

**Context:**
The plan-attack reviewer flagged `EnterPlanMode` and `ExitPlanMode` as non-existent tools, calling it a critical blocker.

**Information used:**
- ToolSearch earlier in the session had successfully fetched the `EnterPlanMode` schema
- The attack reviewer was a subagent without access to the tool registry

**Alternatives considered:**
- `Accept as blocker` — halt implementation → incorrect; tools exist
- `Flag as false positive` — reviewer's environment lacked the tool registry

**Decision:** Classified as false positive in the threat report. Implementation proceeded.

**Rationale:** The tools were confirmed available via ToolSearch during the design phase. The subagent's restricted environment caused the false finding.

**Confidence:** High — direct tool schema verification.
