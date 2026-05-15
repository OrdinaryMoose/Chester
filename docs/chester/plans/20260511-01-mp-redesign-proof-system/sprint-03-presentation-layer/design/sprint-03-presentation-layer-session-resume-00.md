# Sprint-03 Presentation Layer — Design Session Resume Artifact

**Sprint:** `20260511-01-mp-redesign-proof-system/sprint-03-presentation-layer`
**Date paused:** 2026-05-14
**Status:** Mid-session pause; Phase 2 awaiting closure ratification.
**Resumption owner:** the Product Manager (Mike).

---

## 1. How this interview is set up

This is a **custom design session**, not driven by an existing Chester pipeline skill. The designer chose to bypass `design-large-task` and `design-small-task` for this session in order to:

- Design a **new design skill** named `design-proof-system` — sibling to `design-large-task` and `design-small-task`.
- Use the **new proof layer interface** (the sprint-02 Domain + sprint-03-to-be presentation layer) as the mechanism this skill will eventually drive — i.e., this session is also a live experiment in building a design brief while imagining the very tool surface we're designing.

### Architectural commitment for `design-proof-system`

Same shape as `design-large-task`:

- **Orchestrator** = the agent (Claude). Holds session state in conversation context. Walks the script.
- **Script** = the `SKILL.md` file. Phase-by-phase agenda the agent reads and walks. Carries no runtime state.
- **Mechanism** = the new proof layer engine + MCP. What the script calls; what the orchestrator drives.

No phase-state inside the presentation layer. The presentation layer remains a uniform tool surface; phase awareness lives in the agent/script.

### Organizing principle (canonical for this skill)

**Agent works; Designer decides.** Operationally:

- The agent does the drafting work across all categories in conversation. Drafting is not gated by API authority.
- The agent does not outsource its own work to the designer. ("Designer, please write the propositions" is forbidden.)
- The agent makes proof-level decisions appropriate for a **coordinator** — workflow sequencing, batching, presentation framing, tactical drafting choices. The agent does not make architectural / framing decisions (vocabulary, normative constraints, allowed relaxations, problem-frame).
- API-level decision authority follows the authoritative model below — per-(category, action), with the agent's carve-out for ratifying PROPOSITION, RESOLUTION, DEFINITION.

### Authoritative model (the new designed proof system)

Adopted from the actual code at `skills/design-large-task/engine/` + `skills/design-large-task/domain/` (sprint-01 + sprint-02 build). The cascade docs at `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/` frame it.

- **Three consent sources** (`domain/tags.js`): `DESIGNER`, `DESIGN_PARTNER`, `SYSTEM`.
- **Per-(category, action) authority** (`domain/schema.js` `CATEGORY_REGISTRY`):
  - **EVIDENCE / RULE / PERMISSION / RISK** — every action requires `DESIGNER`.
  - **PROPOSITION / RESOLUTION / DEFINITION** — add/revise/withdraw require `DESIGNER`; **ratify** accepts `DESIGNER` **or** `DESIGN_PARTNER`.
  - **FRICTION** — **add** accepts `SYSTEM` or `DESIGNER`; revise/withdraw/ratify require `DESIGNER`.
  - **CONCERN** — **not in CATEGORY_REGISTRY.** Not a first-class element category in the new Domain. Appears as a derived predicate (`unaddressed_concern`) and as seed-packet state passed to `open_proof`.

The cascade `06-interface-spec.md` lists `manage_concerns` as a sprint-03-expected tool, but the underlying Domain has no concern mutation. **This is a flagged gap** — see §5.

---

## 2. Session phase agenda (corrected order)

1. **Bootstrap** — invoke `start-bootstrap`. *(CLOSED — see §3.)*
2. **Topic ratification and initial concerns** — agent reviews input information; drafts proposed topic statement + 3–5 initial concerns; PM approves. *(NEAR-CLOSED — see §3.)*
3. **Research (parallel content exploration)** — corpus mix decision pending. *(NOT STARTED.)*
4. **Open proof** — no separation between understand and solve. Single `open_proof` call with topic + concerns in seed packet.
5. **Interview loop** — round-by-round element work via the new proof MCP.
6. **Move to Closing Argument (yes #1)** — `present_closing_argument`.
7. **Ratify closing argument (yes #2)** — `confirm_closure_go`.
8. **Finish / write artifacts** — produce the design brief from the closed proof.

---

## 3. What we accomplished

### Phase 1 (Bootstrap) — CLOSED

- Skill's Phase 1 will read: *"Invoke `start-bootstrap`. Same handoff as `design-large-task`."*
- State-file path is **implied** by bootstrap's outputs (sprint working dir + sprint slug); the actual path string is computed when `open_proof` runs in Phase 4. No new bootstrap responsibility beyond what `start-bootstrap` already produces.

### Phase 2 (Topic ratification and initial concerns) — NEAR-CLOSED

Process specified by the PM:

- Agent reviews the **input information** — typed text statement, pasted text, or pasted document.
- Agent drafts a **proposed topic statement** and **3–5 initial concerns**.
- PM approves; approved set lives in agent context until Phase 4's `open_proof` writes them into the proof seed packet.

The agent's drafting of initial concerns is explicitly authorized as a Phase-2-only seeding move (concerns are otherwise designer-owned by the authoritative model, and not first-class in the new Domain anyway).

**Outstanding close-question:** *(a) ratify Phase 2 as designed and close it?* — answer pending at pause.

### Definitions register (cumulative — for the resumed session)

- **design-proof-system** — the new design skill being designed in this session. Sibling to `design-large-task` and `design-small-task`. Agent orchestrates, skill is the script, the proof layer's MCP is the mechanism.
- **proof layer** — the Domain layer of the Chester proof system (sprint-02). Exposes seven delivery ports via `domain-bridge.js`.
- **presentation layer** — the Interface layer (sprint-03 territory). MCP tool surface, persistence adapter, render adapters, session-boundary wiring.
- **proof layer engine/MCP** — the mechanism `design-proof-system` calls. Engine (sprint-01) consumed through the Domain (sprint-02) and exposed via the presentation layer (sprint-03).
- **mechanism / script / orchestrator** — the proof MCP / the SKILL.md / the agent, respectively.
- **session phase agenda** — the 8 phases listed in §2.
- **Authority model** — the per-(category, action) authority table described in §1's "Authoritative model" subsection.
- **Agent** — operationally, the DESIGN_PARTNER consent source. Drafts everywhere; has API-level ratify authority on PROP/RESO/DEFN only; makes coordinator-scope decisions; drafts initial concerns at Phase 2 by exception.
- **Product Manager** — operationally, the DESIGNER consent source. Holds add authority on every element category; ratify authority everywhere; gates closure via the two-yes pattern. Equivalent to the cascade's `Designer`.
- **System** — operationally, the SYSTEM consent source. Auto-derivation authority only (friction detection).
- **input information** — the material the PM brings to Phase 2. Three accepted forms: typed text statement, pasted text, pasted document.
- **coordinator-scope decisions** — workflow sequencing, batching, presentation framing, tactical drafting choices within agent-owned drafting work. Distinguished from architectural-scope decisions (designer territory).
- **"Agent works, Designer decides"** — the working-and-deciding asymmetry. Agent drafts; designer consents. Operational reading lives in §1's principle subsection.

---

## 4. Key decisions made (commit these forward)

- **`design-proof-system` is the canonical name** of the new skill.
- **Same orchestration shape as `design-large-task`** — agent orchestrates, skill is the script, proof MCP is the mechanism.
- **No understand/solve separation in this skill** — Phase 4 is `open_proof`; Phase 5 is one interview loop.
- **Topic ratification precedes research** — Phase 2 ratifies the topic and initial concerns *before* Phase 3 parallel exploration. Research is targeted at the ratified topic, not exploratory before topic framing. (Diverges from `design-large-task` where parallel exploration runs before Round One framing.)
- **Bootstrap stays skill-scaffolding** — no `begin_session` MCP tool. `start-bootstrap` is invoked at Phase 1.
- **The new designed proof system is authoritative** — earlier ownership-by-category framings (variant readings of the principle) are dropped in favor of the per-(category, action) authority table the code already implements.

---

## 5. Open questions to address on resume

### Immediate (Phase 2 closure)

- **(Q-2a)** Ratify Phase 2 as designed and close it? — agent reviews input information → drafts proposed topic statement + 3–5 initial concerns → PM approves; approved set lives in agent context until Phase 4's `open_proof`.

### Carried forward (don't resolve at pause)

- **(Q-2b)** Carry the `manage_concerns` cascade-vs-code gap into Phase 5 design? *(Recommended: yes, defer to Phase 5 design.)* The cascade's interface spec promises a `manage_concerns` tool that the new Domain doesn't implement. Two operational paths to choose from in Phase 5:
  - *(path A)* Sprint-03 introduces a Domain mutation for CONCERN with `authority: { add: [DESIGNER], revise: [DESIGNER], withdraw: [DESIGNER], ratify: [DESIGNER] }`. Concerns become first-class.
  - *(path B)* Concerns are seed-only; mid-interview concerns are handled outside the proof (notes, deferment); `unaddressed_concern` derives solely from the seed set.

### Earlier deferrals still open

- **Phase 3 (Research) corpus mix** — inherit `design-large-task`'s three corpora (codebase + prior artifacts + industry), or vary? *(Recommended at the time: inherit verbatim.)*
- **Phase 3 output durability** — transient reports in conversation context (large-task default), or write a persisted `research-notes` artifact? *(Recommended at the time: defer until we know if Phase 3 will produce notes downstream phases need to re-read.)*

### Smaller items riding as defaults (no decision needed; flag if you want different)

- **Edit cycle within Phase 2** — edit-then-approve is the implicit assumption.
- **Input-information scope** — agent silently pulls CLAUDE.md + active sprint dir context alongside the explicitly provided text/paste/doc.

---

## 6. Source-code references for the resumed session

Open these to ground the authoritative model:

- `skills/design-large-task/domain/tags.js` — three consent sources, eight element categories.
- `skills/design-large-task/domain/schema.js` — `CATEGORY_REGISTRY` with per-(category, action) authority.
- `skills/design-large-task/domain/authority.js` — `verifyConsent` + `lookupAuthority` mechanics.
- `skills/design-large-task/domain/mutations.js` — `OPERATION_SPECS` + `runOperation` (the canonical mutation pipeline).
- `skills/design-large-task/domain/domain-bridge.js` — the seven delivery-port facade methods (`addElement`, `reviseElement`, `withdrawElement`, `ratifyElement`, `manageFriction`, `presentClosingArgument`, `confirmClosureGo`, plus render/query).
- `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/06-interface-spec.md` — the cascade's interface spec (the content the presentation layer must implement).
- `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/03-architecture.md` §4.2, §4.5 — the seven delivery ports + the named-port-discipline forbiddens.
- `docs/chester/working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/design/sprint-02-proof-layer-design-00.md` — sprint-02's structural-design brief, used here as a template/altitude reference.
- `skills/design-large-task/SKILL.md` — the parent skill being inherited from, especially Phase 1 (Bootstrap) and Phase Map (lines 92–105).
- `skills/start-bootstrap/SKILL.md` — the mechanical bootstrap skill `design-proof-system` will reuse.

---

## 7. How to resume

1. Re-read this file. Re-read `CLAUDE.md`, the master `CLAUDE.md` at `docs/chester/working/20260511-01-mp-redesign-proof-system/CLAUDE.md`, and `docs/chester/CLAUDE.md` for working/plans semantics.
2. Confirm `.active-sprint` still points to `20260511-01-mp-redesign-proof-system/sprint-03-presentation-layer`.
3. Re-establish the design-conversation voice (the design-partner role rules — bulleted info packages, single topic per round, no ASCII tables, two-part questions with distinct prefixes, plain language, no coined terms).
4. Open with the **outstanding Phase 2 close-question (Q-2a)**: ratify Phase 2 as designed and close it?
5. Then ratify or defer **(Q-2b)** — carry the `manage_concerns` gap into Phase 5.
6. Then open **Phase 3 (Research)** as the next live phase. Inherited corpus-mix question from `design-large-task` Phase 2 is the natural first round.
7. Continue through the remaining phases (3 → 4 → 5 → 6 → 7 → 8). Each phase produces ratified shape that the SKILL.md script will codify at session end.

---

## 8. Final note for the resumed session

This session has not yet produced a draft of the `design-proof-system` SKILL.md itself. The agenda is the scaffold; the per-phase ratified shapes accumulate as the design brief content. At session close (after Phase 8 design), the natural Closure deliverable is the `design-proof-system` skill's design brief — and only then does writing the actual `skills/design-proof-system/SKILL.md` file become a downstream-of-this-session implementation task.

The Product Manager has authorized this session to **supersede existing ADRs**. Use that authority sparingly and explicitly: when a decision in this session departs from a cascade ADR, name the ADR and the departure inside the running record.
