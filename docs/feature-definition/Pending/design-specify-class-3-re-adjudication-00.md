# Feature Definition Brief: Class-3 Re-Adjudication Discipline in `design-specify`

**Status:** Draft
**Date:** 2026-05-23
**Origin sprint:** `20260521-02-design-architect-committee` — committee identified design-specify drift pattern and surfaced portable framework worth encoding into the skill itself.

---

## Problem Statement

`design-specify`'s Step 3 (competing-architectures + prior art) dispatches two architects on dispatcher-chosen axes. Architects optimize within their axis and the dispatcher synthesizes a hybrid. The skill currently does NOT distinguish between three structurally different classes of decision the spec stage might make against the design brief:

- **Class 1 — Fact-correction.** Brief silent or wrong against canonical source the brief itself names canonical (e.g., locked specs). Routine; one-line erratum.
- **Class 2 — Bounded-discretion.** Brief leaves choice open within a named envelope. Routine; spec exercises judgment inside the envelope.
- **Class 3 — Decision-revision.** Brief explicitly weighed alternatives and chose one with named reasoning. Non-routine; requires re-running the original brief-authoring committee with new evidence, not unilateral spec-stage signature.

When the three classes are not distinguished, the spec stage absorbs Class-3 territory as if it were Class-2 bounded-discretion. This produced the spec v00-v02 drift in the originating sprint: the design-specify "hybrid token-anchor" architecture treated brief KD-3's chosen sub-path 1 (list-pattern ban) as discretionary implementation when the brief had explicitly weighed lint alternatives and rejected sub-path 2 (citation allowlist) with named reasoning about predicate ambiguity. The spec agent's locally-reasonable architecture extension was structurally a Class-3 decision-revision dressed as a Class-2 implementation choice.

The committee diagnosed the drift in retrospective review and reached four-pole substantive convergence on the framework that would have prevented it. This brief proposes encoding that framework into `design-specify` so the drift class doesn't recur.

### Prior attempts

This is the first attempt to encode amendment-class discipline into `design-specify`. The current state is absence, not prior failure. The skill has been iterated through fidelity / adversarial / ground-truth review patterns, but the underlying spec-stage authority question (when can the spec extend beyond brief decisions? when must it route through the committee?) has not been explicitly framed.

---

## Current State Inventory

### `skills/design-specify/SKILL.md`

- Step 3 (lines ~30, ~50–141): dispatches two architects on dispatcher-chosen axes; architects self-check against F-A-C (feasibility, suitability, completeness); dispatcher synthesizes hybrid. **No category-boundary check** — architects can propose Class-3 mechanisms (richer lints, new vocabulary, new contract surfaces) without the spec stage flagging that the brief had already weighed and rejected such mechanisms.
- Hybrid recommendation construction (lines ~117–141): three shapes (principled merge, third shape, no merge). **No envelope test** — the hybrid is judged on F-A-C, not on whether it stays inside the brief's named envelope.
- Spec-reviewer dispatch (lines ~161–173): checks goals coverage, constraints respected, no untraceable additions, internal consistency. **Does not check** whether the spec ratifies brief decisions or quietly extends them; "untraceable additions" is the closest but is interpreted as "not in the brief," not as "extends a brief-rejected mechanism."
- Adversarial spec review and ground-truth review (lines ~177–211): catch factual drift against the codebase but do not explicitly catch brief-altitude-vs-spec-altitude category violations.

### `skills/design-committee/SKILL.md`

- General committee primitive defines six roles, one-round-format, peer-DM protocol, Translation Gate. **Silent on amendment classes** — does not name when committee re-deliberation is the correct procedural venue versus when spec-stage absorption is acceptable.

### Related skills / templates

- `skills/design-specify/references/spec-template.md` — defines AC structure but no envelope-test apparatus.
- `skills/design-specify/references/adversarial-spec-review.md` — five dimensions for adversarial review; structural-integrity dimension covers some of the relevant ground but not the brief-vs-spec category boundary.
- `skills/util-design-partner-role/SKILL.md` — voice discipline; orthogonal to this question.
- `skills/design-large-task/references/design-brief-template.md` and `skills/design-small-task/references/design-brief-small-template.md` — define brief output; do not name "explicit rejection reasoning" as a load-bearing brief element.

---

## Governing Constraints

- **Brief authority structure is fixed.** Briefs author committee-deliberated decisions; specs implement those decisions. The skill must not invert this relationship — the change recognizes the existing authority gradient, not modify it.
- **Three-class framework was four-pole-ratified in the origin sprint.** Codifying it into the skill is preservation, not invention. The framework's elements (fact-correction / bounded-discretion / decision-revision; Reading 1; venue-and-evidence test; late-evidence-revision discipline; empirical-engineer-altitude rule) are committee-deliberated, not designer-imposed.
- **The skill must not over-rigidify.** Some Chester sprints are small and the brief-vs-spec category boundary doesn't bite. The change should add framework-aware machinery that activates when needed, not mandate ceremony on every spec.
- **`spec-reviewer` and `adversarial-spec-review` interfaces should not break.** Additions to the spec-stage check surface should compose with existing reviewer dispatches.
- **The hybrid recommendation construction in Step 3 must remain a creative act.** The architects' job is to produce real designs; the framework adds an envelope test for the hybrid, not a constraint on the architect proposals themselves.

---

## Design Direction

### Three-class amendment framework encoded into `design-specify`

Add a section to `design-specify/SKILL.md` (after Step 3, before Step 4 spec-writing) titled **"Amendment Class Identification"** with the three classes named, defined, and accompanied by the procedural rule for each:

- **Class 1 — Fact-correction.** Spec writes an erratum entry in the spec's change log noting the brief silence or miscount + the canonical source. No committee re-deliberation. Six-field CE row-shape in the origin sprint was a Class-1 case (brief said five-field; locked source has six; brief's own §Constraints names locked specs canonical).
- **Class 2 — Bounded-discretion.** Spec exercises judgment within brief's named envelope. Spec change-log entry records the choice and the envelope-text that authorizes it. No committee re-deliberation. Origin-sprint `[CONVENE-MSG-PATTERN]` placement was Class-2 (brief AC-18 explicitly authorized either `rules.md` body or a `schema/` file).
- **Class 3 — Decision-revision.** Spec MAY NOT absorb autonomously. Spec flags the question to the user with the engineer's empirical evidence (if any) and the brief's original named reasoning. User decides whether to (a) accept the brief decision as-is, (b) invoke committee re-deliberation with new evidence, or (c) defer to a follow-on sub-sprint. Origin-sprint broken-link / token-grammar / appendix questions were all Class-3.

### Reading 1 of committee re-adjudication (encoded as standing process)

If a Class-3 question goes to committee re-deliberation, the re-adjudication examines:

1. Original brief conclusion.
2. Original brief named reasoning.
3. Whether the named reasoning applies to the new mechanism under the new evidence.

This is **not** "rejection text retains permanent authority requiring affirmative overturn of inferred broader worry." Reading 1 (committee-deliberated-scope examined on merits) was four-pole-ratified in the origin sprint. Encode the procedure into `design-specify/SKILL.md` as the Class-3-recovery path so future spec-stage agents have an explicit route from "brief rejected X" to "committee weighs whether to ratify X given new evidence Y."

### Venue-and-evidence test

For any Class-3 mechanism the spec stage considers ratifying: confirm the proposal is made (a) in the correct procedural venue (committee re-deliberation, NOT spec-stage absorption) AND (b) with new evidence the original brief committee did not have. Without both, the spec-stage proposal repeats the v02-drift anti-pattern (locally-reasonable extension dressed as routine implementation). Encode the test as a spec-reviewer check category or as an explicit Step-3 framing question.

### Empirical-engineer-altitude rule

Engineer dispatches (empirical fact-finding subagents) belong at spec/implementation altitude, NOT as input to design-level re-deliberation. The origin sprint dispatched an Engineer for empirical drift simulation and the committee then spent three additional rounds treating the engineer's lint-implementation findings as design-level evidence — a multi-round spiral that the brief had already authoritatively answered at KD-3.

Encode the discipline: engineer dispatch fires AFTER design freeze (i.e., AFTER brief KDs are ratified and the spec spine is settled), as input to plan-build implementation choices, NOT as Step-3 input that could trigger committee re-deliberation of brief KDs.

If empirical evidence surfaces during Step 3 that genuinely contradicts a brief KD's named reasoning, the recovery path is **explicit Class-3 routing back to the brief-authoring committee with the evidence as new input** — not silent spec-stage absorption.

### Update to spec-reviewer

Add a fifth check category to `spec-document-reviewer`:

- **Amendment-class fidelity** — for every spec section that extends, modifies, or contradicts a brief decision, does the spec name the amendment class (1/2/3) and follow the procedural rule for that class? Class-1 erratum written? Class-2 envelope text quoted? Class-3 user-flagged?

### Update to adversarial-spec-review

Add a dimension:

- **Category-boundary integrity** — does the spec stay inside the brief-authority envelope, or does it absorb Class-3 territory under Class-2 framing? Cite specific spec passages and brief passages.

---

## Open Concerns

- **How prescriptive should the Class-3 user-flag be?** Spec stage could (a) hard-fail until user resolves the Class-3 question, (b) write a flagging `Decisions:` block and continue, or (c) write spec assuming brief-decision-as-written and add a sidecar `Class-3-questions-deferred-NN.md` document for designer review. Option (a) blocks progress; option (b) risks user not seeing the flag; option (c) preserves spec progress while explicitly archiving the open question. Lean toward (c) but worth designer input.
- **Should the three-class framework apply to every spec, or only when a Class-3 question is surfaced?** Mandatory framework adds ceremony on simple specs. Advisory framework risks skipping when needed. Possible middle: spec-reviewer prompts the framework only when adversarial review or ground-truth review surfaces a brief-decision-extension flag.
- **How does the framework interact with the existing F-A-C self-check?** F-A-C is feasibility/suitability/completeness — orthogonal to brief-vs-spec category. Architects keep F-A-C; the framework adds a parallel envelope test the dispatcher applies to the hybrid.
- **Should the engineer-altitude rule be encoded into `design-specify` or into a separate `design-committee` brief?** The empirical-engineer pattern was a committee Mode B overlay; encoding the rule could land in either skill. Provisional: encode the altitude rule into `design-specify` (where Step 3 dispatch happens) and the temporary-member pattern into `design-committee` (where the Engineer role gets formally recognized).

---

## Acceptance Criteria

- `design-specify/SKILL.md` carries an "Amendment Class Identification" section naming the three classes + procedural rule for each.
- Class-1 erratum, Class-2 envelope-quoting, Class-3 user-flag procedures are explicit enough that a fresh spec-stage agent can apply them without consulting this brief.
- `spec-document-reviewer` checks amendment-class fidelity as its fifth category.
- `adversarial-spec-review` includes category-boundary integrity as a dimension.
- `design-specify` Step 3 documentation names the empirical-engineer-altitude rule (engineer dispatches fire at spec/implementation altitude, not design re-deliberation altitude).
- A retrospective application of the framework to spec v00-v02 of the origin sprint correctly classifies the token-grammar drift as Class-3 mis-classified as Class-2 — i.e., the framework would have caught the drift if it had been in place.
- The framework adds no required steps on specs that touch only Class-1 and Class-2 questions — no ceremony cost on simple sprints.
