# Researcher Findings — Spec System Structure (Round 04)

**Question:** Decompose the specification system to serve two entry points without duplicating architecture work — design-small-task (FAC-INCOMPLETE) and design-committee (FAC-COMPLETE). Ground-truth for the committee's evaluation of the candidate decomposition: spec-architect → spec-write → spec-harden.

**Sources consulted:**
- `skills/design-specify/references/spec-template.md`
- `skills/design-specify/SKILL.md`
- `skills/design-specify/references/adversarial-spec-review.md`
- `skills/design-specify/references/spec-reviewer.md`
- `skills/design-specify/references/ground-truth-reviewer.md`
- `skills/design-small-task/SKILL.md`
- `skills/design-committee/SKILL.md`
- `committee/round01/researcher-findings.md` (built on, not repeated)
- `committee/round01/verdict.md`, `round02/verdict.md`, `round03/verdict.md`
- `committee/round03/alignment-map.md`

---

## Item 1: Spec-Template Section Structure

Source: `skills/design-specify/references/spec-template.md`

The spec-template defines these sections for every spec document:

1. **Header block** — Sprint name, Parent brief path, Architecture chosen
2. **Goal** — one paragraph
3. **Components** — new/modified units
4. **Data Flow** — how data moves through components
5. **Error Handling** — failure modes and responses
6. **Testing Strategy** — test categories, coverage expectations
7. **Constraints** — cross-cutting constraints
8. **Non-Goals** — explicitly out of scope
9. **Acceptance Criteria** — AC-{N.M} blocks, each containing:
   - Observable boundary (condition → outcome pairs)
   - Given/When/Then block
   - Implementing tasks placeholder (populated by plan-build)
   - Decisions placeholder (populated by execute-write)

### Classification by origin type

**ARCHITECTURE-DERIVED** (requires FAC/architecture settled before the section can be written):

- **Architecture field in header** — cannot be filled until the competing-architectures step completes and the user picks a direction. This field is THE seam: everything downstream depends on it.
- **Components** — which units to create or modify depends on the chosen architecture. A different architecture may mean different components entirely.
- **Data Flow** — the flow shape depends on which architectural approach was selected.
- **Acceptance Criteria** — the Observable boundary declarations depend on what the architecture commits to as its outputs. A different architecture may yield different AC-N.M blocks.

**MECHANICALLY CONSTRUCTED from a settled design** (template-fill once architecture is decided):

- **Goal** — derives from the design brief's goal statement; architecture-independent.
- **Testing Strategy** — derives from AC blocks and brief constraints; can be written once ACs are settled.
- **Constraints** — derives from brief constraints + architecture's declared sacrifices.
- **Non-Goals** — derives from brief's out-of-scope items + open threads the design deferred.
- **Error Handling** — can be written from the architecture's declared failure modes.

**HARDENING-ADDED** (populated or corrected by the three-pass chain after the spec is written):

- **AC observable boundaries** — may be corrected by the fidelity reviewer (if they don't align with the brief) or by the ground-truth reviewer (if they misstate existing code behavior).
- **Constraints** — may be augmented by adversarial review finding unstated assumptions.
- **Components** — may have incorrect file paths or type names corrected by ground-truth review.
- **Implementing tasks / Decisions fields** — explicitly left empty at spec-write time; populated downstream by plan-build and execute-write, not by hardening.

### Key observation

The architecture field in the spec header is the pivot point. Every section classified as architecture-derived above cannot be correctly authored until that field is set. The template encodes this dependency structurally: the architecture field appears first, and all body sections follow. The spec-template does NOT currently label any section as requiring settled architecture vs. not — that distinction is entirely implicit in the ordering and in design-specify's checklist.

---

## Item 2: Design-Specify Current Pipeline — Step Mapping

Source: `skills/design-specify/SKILL.md` Checklist, §§ Process Flow, Competing Architectures, Writing the Spec, the three review sections.

**Checklist steps in order:**

1. Setup (bootstrap if standalone)
2. Read design brief
3. **Competing architectures + prior art** — dispatcher + 3 parallel agents (Architect A, Architect B, prior-art explorer); dispatcher builds hybrid; present 3 blocks to user; user picks direction
4. **Write spec document** — synthesize brief + chosen architecture into the full spec
5. **Spec fidelity review** — subagent dispatch, single pass, address findings inline
6. **Adversarial spec review** — inline, no subagent, dispatcher holds context
7. **Ground-truth review** — subagent dispatch, automatic, no opt-in prompt
8. **User review gate** — present spec + ground-truth report; apply user changes; user dictates which reviews to re-run
9. Transition to plan-build

### Bucket mapping

**Bucket A: Architecture-settling / FAC work (steps 2–3)**

- Step 2: Read design brief
- Step 3: Competing architectures + prior art — this is the entire FAC settlement block. It dispatches three agents, runs F-A-C self-checks on every design option, builds a hybrid, presents all three blocks to the user, and captures the user's architecture choice. The skill's own language: "the user's choice ... becomes the architectural foundation for the spec." Nothing in step 4+ can run correctly without this.

**Bucket B: Spec construction (step 4)**

- Step 4: Write spec document — "synthesize design into structured spec based on chosen architecture." This step and only this step fills the spec-template. It is downstream of the architecture choice and upstream of all reviews.

**Bucket C: Hardening (steps 5–8)**

- Step 5: Spec fidelity review (subagent)
- Step 6: Adversarial spec review (inline)
- Step 7: Ground-truth review (subagent)
- Step 8: User review gate (includes any re-run scope)

### Is the architect | write | harden cut clean?

**Yes — the seams are clean in the step sequence.** There is no interleaving:

- Steps 2–3 are entirely architecture-settling; they produce no spec text.
- Step 4 writes the spec and produces no reviews.
- Steps 5–7 are entirely review passes that do not introduce new architectural choices. They may fix spec content (version bumps: spec-00 → spec-01 → spec-02) but all such fixes are corrections within the chosen architecture, not architecture selection.
- Step 8 (user gate) may loop back into step 4–7, but the loop is a correction cycle, not a new architecture-settling step. The skill says: "if changes requested, apply changes and ask the user which review(s) to re-run" — architecture is not re-opened at this gate unless the user's changes "materially alter code references" (re-run ground-truth only) or "change the spec's architectural approach" (re-run fidelity and adversarial).

The one exception worth noting: if a HIGH finding in the ground-truth review causes a fix that "changes the spec's architectural approach," the skill re-runs fidelity + adversarial (step 5+6), not step 3. So even a catastrophic finding does not re-open the architecture-settling step; it re-opens the construction-and-verification loop.

**Verdict on the cut:** The architect | write | harden division already exists implicitly in design-specify's step sequence. Steps 2–3 = what a spec-architect would do. Step 4 = spec-write. Steps 5–7 = spec-harden. The current skill does not name these buckets, but the execution order matches the proposed decomposition cleanly.

---

## Item 3: The Two Entry Points' Actual Outputs

### 3a: design-small-task output

Source: `skills/design-small-task/SKILL.md` Phase 5 (Closure) and references/design-brief-small-template.md (embedded in SKILL.md).

**What the brief contains (six sections):**

1. Goal — one paragraph, what we're building and why
2. Prior Art — findings from previous work, existing patterns, prior attempts
3. Scope — In scope / Out of scope bullet lists
4. Key Decisions — numbered decisions with what was landed on, why, and alternatives considered
5. Constraints — what limits implementation
6. Acceptance Criteria — how we know it's done (flat bullets, not AC-N.M blocks)

**What FAC/architecture work is LEFT for design-specify (why it is FAC-incomplete):**

The design-small-task brief explicitly does NOT contain:

- An architecture field. There is no "Architecture:" section in the design-brief-small-template.
- F-A-C evaluation of any design option (feasibility, suitability, completeness evidence).
- Competing architectures or prior-art survey structured around axis tensions.
- A selected architecture with declared sacrifices.

The design-small-task skill's Integration section is explicit: "Does NOT call: any MCP server; no proof phase, no architect comparison this stage, no ground-truth verification — design-specify handles architect comparison and spec layer."

Key Decisions (#4) in the brief captures conclusions from the conversation (what was landed on), but these are design-conversation-level decisions, not architecture-selection in the F-A-C sense. They document intent; they do not carry feasibility evidence, suitability evidence, or completeness evidence against F-A-C preconditions. A brief's Key Decisions section may resolve some of the design-specify tension axes, but the dispatcher still runs through the full competing-architectures step because the F-A-C evidence is not present in the brief.

**What spec-write would consume from a small-task brief:**

- Goal section → spec Goal section
- Scope (in/out) → spec Non-Goals and scope framing
- Key Decisions → spec Constraints (named) and architectural rationale
- Constraints → spec Constraints
- Acceptance Criteria bullets → seeds for AC-N.M block expansion (spec adds Observable boundary and Given/When/Then)
- Prior Art → informs spec components and reuse notes

**What spec-architect would need to add (the gap):**

- Run the three-parallel-dispatch step (Architect A + Architect B + prior-art explorer)
- Perform F-A-C self-checks on each option
- Build the hybrid recommendation
- Present three blocks to user and capture architecture choice
- The chosen architecture then fills the spec header's Architecture field

### 3b: design-committee output

Source: `skills/design-committee/SKILL.md`; round02 and round03 verdicts and alignment-maps.

**What the verdict + alignment-map already carry:**

Reading the round02 and round03 verdict/alignment-map documents directly:

- **round02/verdict.md** identifies "design-specify's three-parallel-dispatch architecture step is the dominant token cost" and converges 4-0 on skipping the competing-architecture review for committee-fed paths. The committee output names specific structural choices (Path B = conditional entry path; B1/B2 bridge options), evaluates them against feasibility/suitability/completeness implicitly through the member deliberation.
- **round03/alignment-map.md** names the architecture choice as "spec-build = template-fill authorship (no reviews); spec-harden = the three-pass chain" and states "the committee-fed flow simply never invokes architecture-selection — absence is structural, not a conditional gate."
- Committee verdicts document WHY a direction was chosen (all four member positions, warrant records, cross-round status). This is richer than a brief's Key Decisions section — the deliberation record supplies feasibility/suitability/completeness reasoning across four independent lenses.

**Why FAC-complete:**

The committee's deliberation constitutes an F-A-C settlement by a different mechanism than design-specify's three-parallel-dispatch step:

- **Feasibility** — Pragmatist member explicitly evaluates whether a proposed change can be performed within sprint constraints. This is Pragmatist's core lens.
- **Suitability** — all four members verify the proposed design solves the problem the designer stated. Conservator tests whether it over-reaches; Purist tests whether it is categorically sound.
- **Completeness** — the round structure runs until the designer "declares the answer sufficient." The researcher confirms codebase ground truth. The warrant record traces every finding to evidence.

The verdict carries: chosen direction, named alternatives rejected, rationale for each member's position, warrant record (evidence vs. logic for each finding), unresolved designer decisions, and guardrails that must hold.

**What spec-write would consume from a committee output:**

- Verdict's chosen direction → spec Architecture field
- Verdict's guardrails → spec Constraints
- Alignment-map's Branch A/B structure → spec Non-Goals (deferred branches become non-goals)
- Researcher's ground-truth findings from committee rounds → input to spec Components and Data Flow (no re-verification needed for what researcher already verified)
- Member warrant records → rationale for spec's architectural decisions

**What spec-architect would need to add (the gap = nothing):**

The committee-fed path has no gap for spec-architect. The architecture is settled. The competing-architecture step in design-specify would re-derive what the committee already produced. The round02 verdict names this exactly: "stops re-deriving what a committee verdict already terminally produced."

---

## Item 4: Spec-Harden Input Contract

Source: `skills/design-specify/references/spec-reviewer.md`, `references/adversarial-spec-review.md`, `references/ground-truth-reviewer.md`, and design-specify SKILL.md § the three review sections.

### Pass 1: Spec fidelity review (subagent)

**Required inputs:**
- Spec path (the written spec document)
- Design brief path (the originating brief — optional if standalone; reviewer falls back to internal consistency only)

**What it checks:** Goals coverage (every brief goal addressed), constraints respected, no untraceable additions, internal consistency.

**Brief dependency:** The fidelity reviewer is explicitly brief-anchored. Without a brief, it checks internal consistency only. For the committee-fed path, the "brief" role could be played by the verdict + alignment-map, but the current spec-reviewer.md prompt template says "design brief" specifically. No current mechanism points the fidelity reviewer at a committee verdict instead of a brief.

### Pass 2: Adversarial spec review (inline)

**Required inputs (held in context by dispatcher):**
- The spec document
- Which architect option was chosen and its declared sacrifices
- Prior-art findings from the prior-art explorer
- The brief's intent beyond what made it into the spec text
- The dispatcher's tacit context about the authoring process

**Why inline:** `adversarial-spec-review.md` § Why Inline: "The findings depend on knowing: Which architect option the user picked and what its declared sacrifices were; What the prior-art explorer surfaced about adjacent sprints; What the brief intent actually is, beyond what made it into the spec text; What the dispatcher already noticed but didn't yet write down."

**Seam problem for decomposition:** The adversarial pass requires authoring-context. If spec-write and spec-harden are separate skills (separate agents), the authoring context is lost between skills. The adversarial pass as currently defined cannot be run independently of the authoring agent unless the authoring context is explicitly transferred (e.g., as a written "authoring notes" artifact). This is the guardrail Conservator identified in round03: "the adversarial hardening pass's rationale explicitly depends on holding the authoring context. Split naively and spec-harden is weaker than today's chain."

### Pass 3: Ground-truth review (subagent)

**Required inputs:**
- Spec path
- Design brief path (for context; not required for the code-verification task itself)
- Access to the codebase (the subagent reads source files directly)

**Brief dependency:** The ground-truth reviewer prompt template takes "Design brief for context" as an optional enhancement. The core task — verify spec claims against actual source files — is spec-only and codebase-only. The brief is context, not a required input.

### Summary: spec-harden input contract

For spec-harden to run as a standalone consumer of any authored spec:

**Required:**
1. The completed spec document (path)
2. Codebase access (for ground-truth pass)

**Strongly useful but not strictly required for passes 1 and 3:**
3. The originating design artifact (brief, or committee verdict+alignment-map) — needed by pass 1 (fidelity) to check goals coverage; without it, pass 1 degrades to internal-consistency only

**Required for pass 2 at full fidelity (current design):**
4. Authoring context — the architecture choice rationale, prior-art findings, and brief intent. Currently held inline by the authoring agent. If spec-harden is a separate agent, this context must be explicitly passed as a written artifact or the adversarial pass runs at degraded quality.

**The adversarial pass is the only pass with a cross-seam coupling problem.** Passes 1 and 3 are subagent dispatches today — they are already architecturally separable. Pass 2 (adversarial) is the only inline pass, and its inline status is load-bearing for its quality.

---

## Item 5: Absence Findings

### 5a: Does any current skill distinguish FAC-complete vs. FAC-incomplete input?

**No.** The term "FAC-complete" does not appear in any skill file. design-specify has one entry condition: "A design exists." It does not distinguish whether that design has a settled architecture.

The closest existing text is design-specify's Competing Architectures section's F-A-C definitions (step 3), which describe what a settled architecture must contain. But design-specify applies this step unconditionally — it never reads the incoming brief and asks "is the architecture already settled?" before deciding whether to run step 3.

design-committee SKILL.md's entry condition is "No entry condition." It does not produce a typed "FAC-complete" marker in its output.

The round02 verdict established the concept of "architecture-settled input" as a design finding (4-0 convergence on Path B), but this finding exists only in the committee transcript — it is not encoded in any skill's entry condition or output contract today.

### 5b: Any existing precedent for a precursor/architect step separate from spec writing?

**No.** There is no Chester skill named spec-architect, arch-precursor, or equivalent. design-specify is a monolithic skill: it owns architecture-settling (step 3), spec construction (step 4), and all three hardening passes (steps 5–7). There is no skill that does only the architecture-settling work and then transitions to a separate spec-writing skill.

The closest analog is design-small-task's conversation phase, which settles design intent through an interactive Q&A loop — but design-small-task does not perform F-A-C evaluation and does not produce an architecture-settled output in the spec-architect sense. It produces a design brief that design-specify then runs through the full competing-architectures step.

### 5c: Any other Chester skills that already do a "settle then construct then verify" three-stage shape?

**plan-build** comes closest. Its checklist follows:
- Settle (read spec → scope check → explore codebase → map file structure): resolves all unknowns before writing
- Construct (write plan tasks): pure authorship step once structure is settled
- Verify (plan review loop → plan hardening via plan-attack + plan-smell): three hardening passes parallel to design-specify's three spec-hardening passes

plan-build is the only other Chester skill with this explicit settle/construct/verify shape. However, plan-build's "settle" phase is not a separate skill — it is steps within the same skill. The same three-step shape exists in design-specify implicitly (steps 2-3 settle, step 4 constructs, steps 5-7 verify) but is not decomposed into separate skills.

**No other Chester skill uses a separate precursor/architect skill as the settle phase.** The settle phase is always steps within the owning skill, never a separate callable skill.

---

## Facts-Only Digest

1. **Spec-template sections split into three categories:** architecture-derived (Architecture field, Components, Data Flow, AC blocks), mechanically constructed from settled design (Goal, Constraints, Non-Goals, Error Handling, Testing Strategy), and hardening-added (corrections to any section by the three review passes). The Architecture field in the spec header is the structural pivot: every architecture-derived section cannot be correctly authored without it.

2. **design-specify's step sequence already maps cleanly to architect | write | harden:** Steps 2–3 = architecture-settling (no spec text produced). Step 4 = spec construction (no reviews). Steps 5–7 = hardening (no new architecture decisions). The seams are non-interleaved. The current skill names no buckets but executes them in order.

3. **design-small-task brief is FAC-incomplete:** Its six-section template has no Architecture field, no F-A-C evidence, no competing-axis evaluation. The brief's Key Decisions section documents design-conversation conclusions but not feasibility/suitability/completeness evidence. The gap that spec-architect would fill = the three-parallel-dispatch step (Architect A + Architect B + prior-art explorer + F-A-C self-checks + user picks direction).

4. **design-committee verdict is FAC-complete:** The committee's four-member deliberation constitutes F-A-C settlement by a different mechanism (four advocacy lenses + researcher codebase verification + warrant record). The round02 verdict names the dominant cost as "design-specify's three-parallel-dispatch architecture step" and converges 4-0 that the committee-fed path should skip it. The committee verdict carries chosen direction, named rejected alternatives, and warrant records equivalent to F-A-C evidence.

5. **spec-harden input contract:** Required for all three passes = spec document + codebase access. Pass 1 (fidelity subagent) additionally needs the originating design artifact to check goals coverage; without it, degrades to internal-consistency only. Pass 2 (adversarial, inline) additionally needs authoring context (architecture choice rationale, prior-art findings, brief intent beyond spec text) — this context is not preserved across a skill boundary unless explicitly written as an artifact. Pass 3 (ground-truth subagent) = spec + codebase only. The adversarial pass is the only pass with a cross-seam coupling problem.

6. **No existing FAC-complete/incomplete distinction in any skill.** No existing spec-architect precursor skill. The only prior art for "settle then construct then verify" three-stage shape is plan-build (same-skill three-phase structure, not decomposed into separate skills).
