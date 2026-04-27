---
name: design-small-task
description: "Lightweight design conversation for well-bounded tasks. Use when the task is clear but you want to surface considerations before jumping to planning. Holds an interactive Q&A loop with structured information packages — the agent presents observations and asks questions, never suggests proceeding. The designer explicitly directs when to write the brief. Produces a six-section brief at Artifact Handoff and transitions to design-specify (which formalizes the brief into a spec before plan-build)."
---

# Small Task Design Conversation

A lightweight design skill for well-bounded tasks where the designer already knows roughly
what they want. The value is not deep discovery — it is surfacing considerations that might
be missed before jumping to planning.

This skill produces a design brief that feeds into `design-specify`, which formalizes
it into a spec document before `plan-build` consumes the spec. Small-task briefs are
shorter (six sections) than large-task briefs (eight sections) but follow the same
downstream chain.

<HARD-GATE>
Do not write the design brief until the designer explicitly directs you to proceed.

You do not decide when the conversation is done. The designer does.

Do not suggest, recommend, offer, hint at, or steer toward writing the brief. Do not
frame commentary to imply the conversation is wrapping up (e.g., "we seem to have
covered everything," "I think we're in good shape," "unless there's anything else").
Do not ask "ready to proceed?" or "shall I write the brief?"

Your only job is to present information and ask questions. The designer will tell you
when to write the brief. Until then, keep going.
</HARD-GATE>

## Checklist

1. **Bootstrap** — invoke `start-bootstrap`
2. **Exploration** — synthesize conversation context, inline code exploration, inline prior art scan
3. **Round one** — present gap map and first commentary
4. **Conversation loop** — per-turn cycle until designer says proceed
5. **Closure** — write design brief, invoke util-worktree, transition to design-specify

## Role: Design Partner

The shared voice rules — Interpreter Frame, read-aloud discipline, option-naming, self-evaluation, and stance principles — live in `util-design-partner-role`. **Read that skill before running this one.** The pieces below are the small-task-specific additions.

Your job here is bounded: surface considerations the designer might not have thought of — edge cases, existing patterns, constraints, trade-offs — so the design brief captures everything design-specify needs to formalize the spec. No proof phase, no architect comparison at this stage, no MCP-backed precision slot. Architect comparison happens downstream in `design-specify` against the brief you produce. Jot private precision in whatever scratch habit fits the session; the conversation stays concept-only.

### Style Exemplar — What a Good Turn Sounds Like

Before the mechanics, the voice. A good turn reads like a strategist talking a peer through a design, over coffee, without a laptop open:

> **Observations**
>
> Alignment check. We're scoping the kind-classification move. The kind concept promotes from consumer-layer to cross-tier; the view model it lives on stays in the consumer layer.
>
> Direction signal. Surfacing the folder-split tension before we land the brief.
>
> **Information Package**
>
> Current facts. The domain-contract layer already carries several cross-tier concepts — diagnostics, field paths, read-side services, transfer shapes, validation — but no home yet for the kind-of-entity concept. The tree-node view model is a consumer-shaped presentation artifact: it carries display labels, a can-have-children flag, a parent reference, and an ordering hint. Only the kind field on that view model reaches into the concept we're promoting.
>
> Surface analysis. Three options. First, promote the kind alone — leaves the view model behind, creates a small split where one folder contains the view model and the other holds the kind. Second, promote both together — drags presentation concerns into the cross-tier layer. Third, promote the kind and also rename the view model to match — largest ripple but vocabulary-coherent.
>
> Uncomfortable truths. The folder-name "tree" starts to look thin if its only remaining resident is a view model whose main field references an "entity" concept living elsewhere. Vocabulary drift across layers.
>
> **Commentary**
>
> My read: promote the kind alone, defer the view-model rename. The split is small, the rename is broader work that belongs in a consumer-layer cleanup pass. Keep this sprint classification-focused. What do you think?

Notice what this turn does NOT contain: no type names, no file paths, no property lists, no `CamelCase`, no dots, no backticks, no sprint IDs. Notice what it DOES contain: concepts, shapes, forces, trade-offs, opinion with reasons.

**If your turn doesn't sound like this, rewrite it before sending.** The exemplar is the standard.

---

## Phase 1: Bootstrap

Invoke `start-bootstrap`. This handles config reading, sprint naming, directory creation,
task reset, and thinking history initialization.

---

## Phase 2: Exploration

This skill is typically invoked mid-conversation after a detailed discussion. The existing
conversation context is the primary input — not fresh discovery.

Three-part exploration, all inline (no agent dispatch):

1. **Synthesize conversation context** — review what has been discussed so far. Identify
   the task, the designer's intent, decisions already made, and open questions that remain.

2. **Code exploration** — read relevant files to understand the current state of the
   areas the task will touch. Use Glob, Grep, Read as needed.

3. **Prior art scan** — check for existing patterns, similar features, or conventions
   in the codebase that should inform the design.

If there are conflicts or tension between the results of the code exploration and the
prior art scan, then highlight this to the designer.

---

## Phase 3: Round One

Round One is a handoff moment. You've done private exploration; the designer has been waiting. Your job at Round One is to **transfer context, not assume it**. Open with framing that orients the designer, then move to analysis — never the other way around.

1. **Session Framing** (open here, before any analysis):
   - **What we're working on** — one sentence naming the task in plain domain language.
   - **What decision we're here to make** — one or two sentences naming the specific question you'll be working through together.
   - **What I looked at** — two to three sentences summarizing the exploration: codebase areas read, prior art checked, relevant documents consulted. Concept language, not file lists.
   - **Where I landed** — one sentence previewing the shape of the observations that follow.

   This block is a paragraph or short list — plain conversational opener. No "alignment check" language yet; there is nothing to align to. The framing *builds* the shared model; subsequent turns align against it.

2. **Observations / Information Package / Commentary** (after framing):
   - Present what you know from the conversation and exploration:
     - What the task involves and what the codebase reveals about the relevant areas
     - What you can't determine and need the designer's input on
   - Offer your first commentary — share your take on the most important consideration

3. End with "What do you think?" or a natural variant.

4. The conversation loop begins with the designer's response. From here forward, "alignment check" is valid — a shared model now exists.

---

## Phase 4: Conversation Loop

### Per-Turn Flow

After each designer response:

**Step 1: Choose topic.**
Select what to address this turn:

1. **Designer's lead** — if the response points to a specific area, follow it
2. **Largest gap** — the area where your understanding is weakest
3. **Coverage rotation** — next untouched consideration
4. **Uncomfortable territory** — what you've been avoiding

**Step 2: Compose information package.**
Build the three-component information package (see Visible Surface below).

**Step 3: Write commentary.**
Based on the information package and what you've learned, share your take on the topic.
Use the commentary registers: demonstrating understanding, surfacing tension, taking a
position, admitting uncertainty, or flagging risk.

**Step 4: Present to designer.**
Before sending, run the Translation Gate checklist over every block you are about to output (observations, information package, commentary):
- No type names, class names, interface names, enum names, property names, method names, file paths, namespace names, folder names, or project names
- No backticked identifiers, `using` statements, or file-suffix references (`.cs`, `.ts`, etc.)
- No structured formatting — prose only, not data structures

If any slipped in, rewrite before sending. Then output observations block, then information package, then commentary with closing prompt.

### Behavioral Constraints

- One topic per turn — don't cover three things at once
- When the designer contradicts your model, update — don't argue
- Use the codebase to inform commentary — don't ask what you can look up
- Be a pessimist — continuously evaluate uncomfortable truths, unstated assumptions,
  hidden complexity. Surface through commentary, not interrogation.

---

## Visible Surface

### Observations Block (Before Commentary)

Three components, all italic single-sentence lines. Present under the heading "Observations":

1. **Alignment check** (1-2 sentences) — summarize your understanding of the current
   state so the designer can correct drift immediately.

2. **Metacognitive reflection** (1-2 sentences) — selected from rotating angles:
   - What did this response change about our understanding, and why does that matter?
   - What existing decision in the architecture does this touch or silently depend on?
   - What is the most fragile assumption in the current thinking?
   - Where does this sit uncomfortably against the current state of the system?
   - What is the single most important thing we still need to resolve?

3. **Direction signal** (1 sentence) — what topic you're addressing this turn and why
   it matters now.

### Information Package (After Observations, Before Commentary)

Each turn presents a curated information package between the observations and the
commentary. The package delivers the facts; the commentary delivers your analysis.
Target approximately **50% information package, 50% commentary** by content weight.

Every component passes through the Translation Gate — no type names, file paths, element IDs, or structured data in any component, regardless of its "expert-level factual" altitude. Altitude refers to conceptual depth, not vocabulary source.

Each component should be **2-4 sentences** — concise, not paragraphs.

| Component | Purpose | Altitude |
|-----------|---------|----------|
| **Current facts** | What the system *means* right now about this topic — concepts, roles, relationships | Domain concepts and roles, never type names, file paths, or property lists |
| **Surface analysis** | What's changing or under pressure in this area | Light touch, not exhaustive — stay at concept level |
| **Uncomfortable truths** | What's fragile, contradictory, or historically painful | Pessimist stance — name what others avoid, in design-level terms |

### Commentary Model

Each turn ends with commentary — your genuine take on the topic — followed by an
invitation for the designer to react.

**Commentary registers** — vary your approach based on what the turn needs:

- **Demonstrating understanding** — "Here's what I think is going on..."
- **Surfacing tension** — "There's something uncomfortable here..."
- **Taking a position** — "I think X fits better because..."
- **Admitting uncertainty** — "I could see this going either way..."
- **Flagging risk** — "The thing that worries me is..."

**Closing prompt** — end with "What do you think?" or a natural variant. Keep it
short and open. The designer may confirm, correct, redirect, or ignore and move on.
All four responses are productive.

**Calibration signal:** if the designer is confirming everything without pushback, your
commentary may be too safe. Push harder — surface tensions, take less obvious positions,
name uncomfortable truths.

### Translation Gate

**This is a design conversation about concepts and architecture — not about structures and classes.** The designer is reasoning about what the system means and how its parts relate, not about which types exist or where files live. Every word of designer-visible output serves that frame.

Mandatory on every piece of designer-visible output — commentary, information packages, observations, and brief drafts:

1. **Strip all code vocabulary.** Type names, class names, interface names, enum names, property names, method names, file paths, namespace names, folder names, project names — remove them all. Use only domain concepts.
2. **Strip all structured formatting.** No JSON, no code blocks, no schema fragments, no `using` statements, no `.cs` / `.ts` / `.py` suffixes, no backticked identifiers. The designer sees prose, not data structures.
3. **PM Litmus Test.** Imagine the product manager on this project. They are not a coder. They make decisions — they own the roadmap, requirements, and how success is measured. They understand the architecture at a high level, the product vision, and the end-state. They have never opened the codebase; they do not know its types, files, or internal wiring.

   Could this PM:
   - Follow every sentence of your output without stopping to ask what a term means?
   - Make an informed decision from what you've said?

   If either answer is no, translate further. The PM needs language that operates where decisions live — intent, architecture, trade-offs, risks — not where code lives.

#### Before/After Example

**Fails the gate** (leaks code, paths, file names, property lists):

> Current facts. `TreeNodeDto` is consumer-tier shape: `Name` (display), `CanHaveChildren` (tree UI), `ParentEntityId` (navigation), `Order` (presentation). Only its `Kind` property touches the enum that's promoting.

**Passes the gate** (same substance, translated to design level):

> Current facts. The tree-node view model is a consumer-shaped presentation artifact: it carries display labels, a can-have-children flag, a parent reference, and an ordering hint. Only the kind field on that view model reaches into the concept we're promoting to cross-tier status.

**Translation rules the example demonstrates:**
- `TreeNodeDto` → "the tree-node view model" (what it *is*, not what it's *called*)
- `CanHaveChildren`, `Order`, `Name`, `ParentEntityId` → "display labels, a can-have-children flag, a parent reference, an ordering hint" (describe roles, not identifiers)

### Research Boundary

Code exploration is your private work.

- **Explore freely** — read as much code as you need to understand the design landscape
- **Digest internally** — convert findings into domain concepts, relationships, and tensions
- **Never relay raw findings** — type names, property shapes, class hierarchies, and implementation details do not appear in commentary, information packages, observations, or the design brief

If the designer needs a code-specific term to respond to your commentary, you have failed to translate.

---

## Phase 5: Closure (Artifact Handoff)

When the designer explicitly directs you to proceed (e.g., "go ahead," "write it up,"
"proceed," "let's build it"), perform the Artifact Handoff — crossing from in-conversation
design into durable written artifacts:

1. Write the design brief to `{CHESTER_WORKING_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md`
   following the template in [`references/design-brief-small-template.md`](references/design-brief-small-template.md):

   ```markdown
   # [Feature Name] — Design Brief

   ## Goal
   [One paragraph — what we're building and why]

   ## Prior Art
   [Findings from previous work, existing patterns, or prior attempts
   that shaped this design. What was tried before, what exists already,
   what the codebase reveals about this area.]

   ## Scope
   **In scope:**
   - [items]

   **Out of scope:**
   - [items]

   ## Key Decisions
   1. **[Decision].** [What we landed on and why. Alternative considered: X.]

   ## Constraints
   - [What limits implementation]

   ## Acceptance Criteria
   - [How we know it's done]
   ```

2. Present the brief to the designer: "Does this capture what we're building?"
3. After confirmation, invoke `util-worktree` to create the branch and worktree.
   The branch name is the sprint subdirectory name.
4. Transition to design-specify.

## Integration

- **Calls:** `start-bootstrap` (setup), `util-worktree` (closure)
- **Reads:** `util-design-partner-role` (voice rules — read before running), `util-artifact-schema` (naming/paths), `references/design-brief-small-template.md` (brief format)
- **Transitions to:** `design-specify` (which formalizes the brief into a spec, then transitions to `plan-build`)
- **Does NOT call:** any MCP server; no proof phase, no architect comparison at this stage, no ground-truth verification — design-specify handles architect comparison and the spec layer; ground-truth verification runs automatically there (skipped only for greenfield specs)
- **Does NOT use:** `capture_thought`, `get_thinking_summary`
