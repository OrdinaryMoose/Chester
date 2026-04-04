# Thinking Summary: Review Sequence Redesign

## Decision History

### 1. Problem Framing Shift: Token Cost -> Review Placement

**Initial frame:** Reduce the token cost of the specify skill.
**Final frame:** Redesign the review sequence across specify and plan-build so each review fires with purpose at the right stage.

**How we got here:** The conversation started focused on making the specify skill cheaper. Exploring the user's experience revealed that the spec reviewer runs one iteration and the review catches real issues. But when asked what value the spec step adds beyond the design brief, the user wasn't sure -- they hadn't questioned the pipeline shape. The pivotal moment was the user saying "lets pull in a second system also which is build plan which contains another round of review. Maybe that is what I am sensing that we are maybe duplicating work?" This expanded scope from one skill to the seam between two skills.

### 2. The "Too Early" Insight

The user added "or checking it too early" -- some scrutiny fires when the artifact isn't mature enough to benefit. This shifted the design from "remove duplicate reviews" to "right-time reviews by purpose." The YAGNI check on abstract spec requirements is less precise than YAGNI checking on concrete plan tasks. Completeness of a spec (are requirements covered?) is different from completeness of a plan (are implementation steps covered?) despite sharing a label.

### 3. User's Three-Stage Model

The user provided a clean organizing principle:
- Design = goals
- Specification = framework
- Plan = execution

Each transition has one review purpose: design-alignment, spec-fidelity, codebase-risk. This became the design's backbone.

### 4. Aggregate Effectiveness Constraint

When pressed on whether individual checks could move between stages, the user pushed back twice: "not what I said. The overarching process is the sum of its parts and the whole is effective." This established a critical constraint: you can't decompose the pipeline into independently movable pieces. Restructuring must preserve the aggregate, not just relocate individual checks.

### 5. Recollection Caveat

The user cautioned: "dont take my statement as a fact, may have been a less than perfect recollection" about spec reviews catching real issues. This means the design should stand on purpose-alignment logic, not on assumed effectiveness of any individual reviewer. The spec may already be coming back mostly clean.

## Alternatives Considered

### Eliminate the spec stage entirely
Explored via contrarian challenge (round 3). The user hadn't questioned whether the spec earns its keep. Parked as a bigger question -- the current work is about review placement, not stage elimination.

### Optimize within the current structure
The initial approach: make the existing spec review cheaper (fewer iterations, lighter subagent). Abandoned when the user revealed the real issue was duplication across stages, not cost within one stage.

### Move all review to plan stage
Implicitly explored when discussing whether catching issues later was acceptable. User rejected this framing -- the whole is effective as a sum of parts, not as a single concentrated check.

## User Corrections

1. "not context window" -- reframed from context pressure to API budget spend
2. "lets pull in plan-build also" -- expanded scope from specify-only to cross-stage
3. "or checking it too early" -- added timing dimension beyond duplication
4. "dont take my statement as a fact" -- cautioned against over-relying on recollection
5. "not what I said" (twice) -- rejected the premise that checks can freely move between stages

## Confidence Assessment

**High confidence:** The three-stage model and purpose-at-stage principle are clear and stable. The user confirmed the design direction explicitly.

**Moderate confidence:** The specific overlap analysis (which checks are redundant between spec and plan reviewers) is based on reading the reviewer templates, not on measured review output.

**Lower confidence:** Whether narrowing the spec review will degrade aggregate effectiveness. The user correctly noted that effectiveness is emergent -- the redesign should include a way to validate this empirically.
