# R1 Decision — Separation of General vs Skill Committee Call

**File:** `design/r1-mode-separation-decision-00.md`
**Sprint:** `20260521-design-system-analysis`
**Round:** R1 (one-round-format)
**Team:** `design-committee-general` (team-lead + 4 poles + researcher)
**Date:** 2026-05-22
**Status:** Pending designer ratification

---

## 1. Decision

The Committee was asked how the **general committee call** (broad-mandate, process-agnostic, ad-hoc — the mode used for research and design exploration as directed by the designer) should stay structurally separated from a **skill committee call** (a named skill — such as the future `design-architect-committee` skill being designed for the StoryDesigner repo — that wraps the same four-pole team with sprint-specific instructions, locked schemas, gates, and a Clerk).

Designer-visible scope: where the sprint-specific overlay legitimately attaches, where it must never attach, how a future reader tells the two modes apart, and what failure modes the design must guard against.

---

## 2. General Committee Composition (canonical)

The general committee call consists of exactly six roles:

- **Team-lead** — calling agent (the conversation's main thread). Dispatches, receives, compiles. No design opinion. Not a switchboard during deliberation; peers DM peers directly.
- **Conservator (S)** — defends existing structure, stasis, the framing that current patterns already handle.
- **Innovator (N)** — pushes new framings and structural alternatives; treats existing structure as a choice that can be re-made.
- **Pragmatist (W)** — weighs operational cost against benefit; defends the simplest sufficient solution.
- **Purist (E)** — tests category boundaries and compositional integrity; treats shape-cleanliness as a first-class concern.
- **Researcher** — codebase research, prior-art research, document reading, file operations beyond proof state. No design opinion. No proof mutations.

The general call does **not** include a Clerk and does **not** include an Arbiter. The Clerk is a design-specific role that wrapping skills may install in the convening message. The Arbiter is a legacy proof-system custodian whose function is deprecated with the proof system itself; references to it in earlier Chester documentation are out-of-date and should be ignored.

---

## 3. Contract Boundary

The general committee call promises a floor:

- Four-pole deliberation team with defined lenses (Conservator, Innovator, Pragmatist, Purist) plus a Researcher support role.
- Translation Gate discipline enforced at consolidation by the team-lead reading content aloud.
- Decision packet presented to the designer for adjudication.
- The output-format field labels and their meanings, as defined in each pole's agent file, are fixed.

The general call does not promise — and a wrapping skill must supply if it needs them:

- Any particular round schema, round sequence, or session lifecycle.
- Any gating logic or closure-gate evaluation.
- A Clerk role, schema enforcement, or structural-negation matching.
- Any locked output structure beyond the primitive's base field labels.
- Any artifact persistence, working-record format, or sprint traceability.
- Any decision procedure downstream of the deliberation.

**Floor-not-ceiling rule.** A wrapping skill may add steps, fields, gates, and roles via the convening message. A wrapping skill may not weaken or substitute any step the general SKILL.md names as part of the consolidation contract — including the Translation Gate. A convening message that adds a Clerk for schema validation **and** instructs the team-lead to skip the read-aloud check is subtracting from the floor; that is a violation detectable by comparing the convening message against the SKILL.md.

---

## 4. Attach Point — Ratified

**The convening message is the only legitimate attach point for sprint-specific overlay.**

The wrapping skill authors the convening message that the team-lead composes and sends to each pole at session open. Sprint context, locked schemas, gate instructions, Clerk designation, and any additive output fields all ride in this message. The message is ephemeral — it lives in the session record only — so the overlay leaves no residue in any persistent artifact when the session ends.

"Convening message" means the full instruction payload the team-lead composes before sending to each role at team instantiation — not just the human-visible question. A Mode B (skill) invocation writes a richer payload; a Mode A (general) invocation writes a leaner one. The seam is the same in both cases.

---

## 5. Forbidden Attach Points — Ratified

Three surfaces must never carry sprint-specific overlay:

1. **Agent files** (`agents/design-committee-{pole}.md` and the researcher agent file). Edits there persist across all future invocations and become invisible to any reader who opens the file outside the sprint context that added them. Single-edit drift is the canonical failure path: each addition looks justifiable; accumulated additions silently change what the primitive is. Agent files may only carry lens, voice, and phase-contract definitions. Any sentence referencing a sprint, a schema, a product name, or a gating condition is a violation.

2. **The general `design-committee` SKILL.md.** This is the persistent floor document — the artifact every future caller reads to learn what the primitive promises. Contaminating it is the most durable form of category drift because future audits use the contaminated file as the standard of comparison and therefore cannot detect the drift. Any proposed edit must pass the test *"is this true for a Mode A call with no wrapping skill?"* If not, it belongs in the wrapping skill's documentation, not the primitive's.

3. **The output-format field labels.** The labels defined in pole agent files (Position, Recommended option, Load-bearing trade-off, and the equivalents) are the interface between the deliberation and every reader outside the session. A wrapping skill may instruct poles to **append** additional fields; it may not redefine the meaning of existing labels. Redefinition makes the output illegible to any reader arriving without the wrapping skill's context. The justification is reader-legibility, not pole independence.

---

## 6. Mode-Distinguishability Test — Ratified

Observable: the convening message.

A Mode B (skill) invocation will contain a wrapping-skill name, a sprint reference, a locked schema, a Clerk designation, or explicit gating instructions. A Mode A (general) invocation will contain none of these — only a question with the standard pole-role context.

The next reader (designer, future Claude session, audit) can check the convening message in the conversation record and immediately know which mode is running. No hidden state required, no file inspection required.

The check works because the attach-point discipline in §4 and §5 ensures the convening message is the complete and sufficient evidence of mode.

---

## 7. Failure Modes Addressed

The Committee converged on three drift paths the design must guard against:

- **Agent-file drift.** Each skill iteration finds it slightly more convenient to add one clarifying line to a pole's agent file rather than the convening message — because the convening message is ephemeral and the agent file persists. After several sprints, an agent file carries product-specific framing that silently colors every general invocation. Visible by inspection if anyone looks.

- **SKILL.md drift.** A well-intentioned author adds a sentence that is true about Mode B invocations and looks like a useful clarification. Accumulated, those sentences describe a primitive that has quietly absorbed Mode B conventions into its stated contract. The next Mode A caller inherits assumptions never part of the primitive's intent. Most durable form of drift because the floor document itself moves.

- **Output-field redefinition.** A wrapping skill loads new meaning into existing field labels. Future readers without the wrapping skill's context cannot parse the output. Reader-legibility failure.

---

## 8. Guards Installed (Editorial Discipline)

The designer ratified editorial discipline as the enforcement mechanism for now. Mechanical enforcement (pre-commit hooks, CI checks comparing convening messages against the SKILL.md floor) is deferred — a candidate follow-up brief, not a current obligation.

Three guards apply on every edit:

1. **Positive contract statement** lives in the general `design-committee` SKILL.md — a short, deletion-protected list naming what the general call does and does not promise. Used as the comparison standard for every proposed edit to the SKILL.md and for every Mode B convening message audit.

2. **Floor-not-ceiling rule** applies to all wrapping-skill convening messages. Additive overlay is permitted; substituting or removing a named step is not.

3. **Three protected surfaces** — agent files, SKILL.md, output-format field labels — receive the same scrutiny as a breaking interface change. Not casual revision, not cleanup, not simplification.

---

## 9. Open Items (Not Adjudicated in This Round)

- **Mechanical enforcement of the three guards.** Deferred to a follow-up brief at designer discretion. Candidates include: pre-commit hook scanning agent files for sprint keywords; CI check comparing convening messages against a SKILL.md floor manifest; lint pass on the SKILL.md against a deletion-protected contract block.

- **Where the existing `chester:design-committee` skill file falls on the floor-not-ceiling test.** The current SKILL.md was authored before this distinction was named; it may need a contract-block addition. Not in scope for this round.

- **Researcher's status as a floor promise.** All four poles named the Researcher as a support role. The current `design-committee` SKILL.md lists Researcher; this decision ratifies that listing as part of the floor.

---

## 10. Trade-off the Designer Has Accepted

Editorial discipline at three surfaces is now load-bearing rather than convention. The cost is enforced by review — there is no automated lint catching "this SKILL.md edit weakens the floor" or "this agent-file addition references a sprint context." If editorial discipline lapses, the guards lapse with it.

The compensating benefit: zero shipping cost, no cleanup obligation, no per-session file writes, and the primitive remains visibly process-agnostic at every site a reader would inspect.

---

## 11. Round Provenance

R1 ran the one-round-format: each pole produced an initial position, sent exactly one peer question via direct DM, answered any incoming question with one direct response, and submitted a final position to team-lead. Verbatim per-pole final positions persist as:

- `[verbatim message] Conservator (S) — final position` (in conversation record)
- `[verbatim message] Innovator (N) — final position` (in conversation record)
- `[verbatim message] Pragmatist (W) — final position` (in conversation record)
- `[verbatim message] Purist (E) — final position` (in conversation record)

Q+A peer-DM pairs (private during the round, surfaced here):

- Conservator → Purist (pole-independence justification); Purist answered, conceded first-formation framing.
- Innovator → Conservator (Translation Gate floor enforceability); Conservator answered, surfaced SKILL.md as persistent floor document.
- Pragmatist → Purist (fixed vs flexible output format); Purist answered, surfaced reader-legibility as the §3 justification.
- Purist → Pragmatist (drift carrier identification); Pragmatist answered, named SKILL.md as the most durable drift carrier.

Two earlier off-protocol Step-2 questions (Pragmatist's first draft and Purist's first draft) were withdrawn before any peer relay — both carried a premise error about Innovator's preferred attach point. Withdrawn drafts are not part of the round record.

---

## 12. Closure Note

This decision packet is the R1 final artifact for the committee-mode-separation question. On designer ratification, it becomes the architectural input for any future revision of the general `design-committee` SKILL.md and for the `design-architect-committee` skill build (which is the wrapping-skill case study that motivated this question).

The committee team `design-committee-general` remains alive for follow-up rounds in this sprint (next planned: actors-locked-00 underspecification audit). Designer termination is the only path to teardown.

---

## Change Log

- **00 (2026-05-22):** Initial decision packet. Pending designer ratification.
