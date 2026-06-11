# Conservator — Round 01 Transcript

**Topic:** How committee members move from advocacy stance to answer-contribution stance.

---

## Reasoning

### What the advocacy contract currently does

Current `## Final Position` schema: `{position, rationale, blocking_risk}`. These fields encode a stance: a position the member *defends*, the reasoning from the member's *lens*, and the hardest objection to what they *did not choose*. This is pure advocacy machinery — the member defends a corner, and the team-lead cross-examines warrants retro-fit at synthesis time.

The brief (Thread A) names the gap precisely: members feed un-warranted inputs; warrant test runs lead-side only. Team-lead must *originate* warrants rather than *verify* them.

### What "answer-contribution" actually requires

Conservator lens asks: what is the minimum change that addresses the actual gap without disturbing what already works?

The actual gap is narrow: members have their gating fact (they rely on it in forming position) but don't name it as a warrant. The team-lead already does warrant inference. The failure mode is that the team-lead must *invent* the warrant rather than check the member's own stated warrant — so a wrong inference from a correct member position isn't caught until the designer pushes back.

Key constraint from the dispatch: member warrant is a **content extension**, not a schema/routing/mechanics change. Final Position schema stays — three fields. The Consolidator's enumerate-only boundary is rigid. No routing mechanics change.

### The model: researcher agent

The researcher's `## Final Position` shows how this already works:
- `position`: "no design opinion"
- `rationale`: names what the findings establish
- `blocking_risk`: "none — research role holds no advocacy"

Researcher output is natively warrant-shaped because findings *are* evidence. Each `Findings:` entry carries `file:line` citation — the warrant is embedded in the finding itself. The researcher's `rationale` field says what the evidence establishes.

For advocacy members: rationale already names the reasoning from the member's lens. The lens IS the warrant type — Conservator lens = structural/stasis argument, Purist lens = coherence argument, etc. The question is whether the *gating fact* is explicit enough to be verified.

### What the existing structure already handles

Member `rationale` already carries the reasoning. The `blocking_risk` field already names the hardest objection to alternatives — which implicitly states *why* the member's position matters. A Conservator rationale like "existing pattern already handles this; disturbing it costs more than it buys" implicitly contains an evidence warrant (the existing pattern, the cost of disturbance). The problem is implicitness, not absence.

The issue is that the team-lead must *extract* the warrant from an implicit rationale rather than read an explicit one. This is a precision problem, not a structural problem.

### What change earns its cost

Option 1 — **Add a `warrant` field to `## Final Position`.**
Cost: schema addition (C-RIGID). The brief explicitly permits "content extension" while forbidding "mechanics change." A `warrant` field is content. But it adds a fourth field to a three-field schema marked as the *single authority* for the schema. It extends the surface that every downstream step reads. The Consolidator reads only `## Final Position` — it now has one more field to enumerate. That enumeration change is bounded (Consolidator is enumerate-only, not interpret) but is a real surface widening.

Option 2 — **Extend the `rationale` field instruction** to require that each member explicitly name the warrant type (evidence / logic / designer-premise) and its source inline in `rationale`.

Cost: no schema field count change. The `rationale` field already exists; the instruction adds precision to what it must contain. The Consolidator boundary is untouched because the field name doesn't change. Downstream steps read the same three fields — just richer content in `rationale`.

The Conservator lens favors Option 2. Why:
- Smaller disturbance to existing structure. Schema field count unchanged. Consolidator surface unchanged. Routing signal unchanged.
- The researcher model supports this: researcher's `rationale` field says "what the findings establish" — it names the factual basis without adding a new field.
- The warrant information is already in the member's reasoning; Option 2 asks the member to surface it within an existing field rather than in a new one.
- Option 1's `warrant` field would be redundant with `rationale` content — you'd have a field that says "the warrant is X" and a rationale that says "because X" — the signal appears twice, creating a consistency constraint (must they agree?) that doesn't exist in Option 2.

### What I sacrifice

Option 2 has real costs Conservator must name:
- A richer `rationale` is harder to enumerate than a typed `warrant` field. Consolidator gets a denser block; enumeration quality depends on model behavior, not schema enforcement.
- A typed field (evidence | logic | designer-premise) is checkable by structure. Extended `rationale` prose is checkable only by reading, which is what the team-lead already does.
- Schema-level typing would enable future mechanical verification; prose won't.

The brief names this tension explicitly: "A free-text warrant line is cheap but unverifiable; a typed warrant is checkable but adds schema rigidity." Conservator position: the unverifiability cost is acceptable because the team-lead reads `rationale` anyway — the check is human, not mechanical. The schema-rigidity cost is not acceptable because it modifies a C-RIGID-boundary artifact.

### Does the existing structure already handle this?

Partially yes — the warrant information is in member reasoning and implicitly surfaces in `rationale`. The gap is precision, not absence. The fix is precision instruction inside an existing field, not a new field.

The `blocking_risk` field's current job — "hardest objection to alternatives" — is adjacent to warrant logic. Conservator reads `blocking_risk` as partially warrant-shaped already: a member who articulates the hardest objection to what they didn't choose has, implicitly, stated why their chosen warrant holds in contrast. That implicit structure exists; the extension is making it explicit.

---

## Final Position

**position:** Extend the `rationale` field instruction in member-protocol.md to require explicit warrant-type labeling (evidence / logic / designer-premise + source) inline within the existing `rationale` field — no new schema field. The three-field schema, routing signal, and Consolidator surface stay unchanged.

**rationale:** The warrant information already lives in member reasoning; the gap is precision-of-surfacing, not structural absence. Adding a `warrant` field to a C-RIGID-boundary schema risks over-engineering a precision fix. The researcher model shows warrant-shaping works within existing field constraints: rationale names what the evidence establishes without needing a separate typed field. Extending the `rationale` instruction costs nothing in schema mechanics and closes the precision gap the brief identifies. The cost accepted is that warrant-checking remains human (team-lead reads rationale) rather than mechanical (structured field parse) — acceptable because the team-lead already reads this field at synthesis.

**blocking_risk:** A typed `warrant` field would be mechanically checkable and enable future structural verification — extending `rationale` prose cannot enforce warrant presence at schema level, so a member could satisfy the letter of the instruction with a vague rationale that still leaves the team-lead doing origination rather than verification.
