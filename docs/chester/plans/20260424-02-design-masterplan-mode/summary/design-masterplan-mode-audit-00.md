# Reasoning Audit: Master Plan Sprint Mode — Design

**Date:** 2026-04-25
**Session:** `00`
**Plan:** *(none — design phase only)*

---

## Executive Summary

Session ran `design-small-task` against the predecessor brief proposing first-class promotion of StoryDesigner's `CLAUDE.md` override "Master Plan Mode." Most consequential decision was the agent's red-team-driven contraction of scope — eight pain points re-clustered into three categories, cluster-3 ruled out entirely, three proposed top-level skills collapsed into modifications of three existing skills. Designer corrections at three points sharpened the design materially: reproducibility steelman shifted ground from "no skill" to "minimum-viable skill modifiers"; "no skills only prompt" reminder caught the agent re-adding skill surface for exit; finish-time version-bump revelation collapsed the entire `master-plan-body-edit` skill proposal. Sprint stopped before closure phase at designer's direction.

## Plan Development

No prior implementation plan existed. Session began from the predecessor brief at `docs/feature-definition/Pending/master-plan-sprint-mode/master-plan-sprint-mode-00.md`, which itself proposed a substantial design surface. The "design" in this session was negative — testing what NOT to ship. Conversation moved from initial scope-clustering observation through red-team adversarial pass, then to reproducibility/discoverability concession, then to discrete shape decisions (directory layout, naming, exit, lockstep, deferred items).

## Decision Log

### Red-team contraction of original scope

**Context:** Predecessor brief proposed three new top-level skills (`master-plan-start`, `master-plan-close`, `master-plan-body-edit`), three skill modifiers (`start-bootstrap`, `finish-archive-artifacts`, `finish-write-records`), schema extension, reference doc — covering eight pain points (P1-P8) surfaced during seven days of StoryDesigner usage.

**Information used:**
- Top-scoring thinking lesson (score 14): check whether target architecture exists in incomplete form
- Lesson against config dials (score 3): three opt-in flags in original brief (exclude glob, drift scan, fitness rerun) flagged as smell
- Designer feedback memory (`feedback_directory_simplicity.md`): pushback on multi-directory schemes
- Project memory: only one user (Mike), only one consumer project (StoryDesigner)

**Alternatives considered:**
- Ship full original brief — rejected as N=1 evidence base for permanent framework surface
- Ship nothing, leave as `CLAUDE.md` override — rejected later under reproducibility steelman
- Ship minimum viable promotion (modifiers + docs) — chosen

**Decision:** Re-cluster eight pain points into three categories. Promote cluster-1 (overlay activation). Fold cluster-2 into existing skills. Defer cluster-3 entirely.

**Rationale:** Override worked for seven days because one user was watching. Promotion converts working malleable convention into permanent framework surface — cost-benefit favors smallest surface that captures determinism gain.

**Confidence:** High — designer engaged with the clustering and corrected only the framing of generator's status (which was already a complete brief, ready to install), not the underlying contraction.

---

### Reproducibility steelman concession

**Context:** Agent's red team initially argued "the override IS the architecture, ship nothing new." Designer challenged: "this was created by prompt when I needed it. How do I know this will be recreated in the same way?"

**Information used:**
- Override depends on three fragile chains every invocation: model reads project CLAUDE.md, holds override across compaction, interprets redirection consistently
- Subagents may not load project CLAUDE.md at all
- Future-Mike (or future-project) won't have same vigilance

**Alternatives considered:**
- Lightest: reference doc with override text, copy-and-adapt per project — rejected, drifts on adapt
- Middle: skill modifiers read breadcrumb, behavior in code — chosen
- Heaviest: full skill suite as original brief — rejected, oversized

**Decision:** Promote two skill modifiers (later three after finish-write-records added) so behavior lives in skill code, not in prompt-readable override. Breadcrumb is the only project-side artifact.

**Rationale:** Determinism + reproducibility both require the activation recipe in canonical executable form. Override-as-text drifts; modifier-as-code doesn't.

**Confidence:** High — designer's question drove the concession explicitly.

---

### Master-plan document as self-instructing manual

**Context:** Designer asked "in the future how will I know how to do this? What if I forget the process? Where are the instructions written so I know where they are mixed in with all of the other StoryDesigner and Chester files."

**Information used:**
- Skills hide their bodies until invoked — discoverability requires either trigger phrases or external anchor
- StoryDesigner-side and Chester-side docs both exist, risk of instruction proliferation
- Master-plan document is the most-opened working artifact during a master sprint

**Alternatives considered:**
- Project CLAUDE.md instructions — rejected, re-introduces per-project copy-paste problem
- Single Chester reference doc only — rejected, not naturally encountered
- Three independent discovery paths (Skill tool, master-plan header, Chester reference) — chosen

**Decision:** Master-plan template gains "How To Use This Plan" header. `docs/master-plan-mode.md` ships at canonical Chester location. Generator skill description carries trigger phrases.

**Rationale:** Master-plan document is the artifact the designer will open first when they remember "I had a master plan workflow somewhere." Workflow living in its header means zero search cost. Reference doc + Skill tool trigger provide independent backups.

**Confidence:** High — designer confirmed with "yes, good".

---

### Directory shape — nested wins exception

**Context:** Predecessor brief proposed `working/<master-sprint>/<sub-sprint>/...` two-level nesting. Designer's prior memory (`feedback_directory_simplicity.md`) pushed back on multi-directory schemes earlier in the project's history.

**Information used:**
- Earlier collapse was working/ + plans/ — two parallel trees doing similar jobs (cognitive overhead came from "which tree am I in")
- Master-plan nesting is parent/child relationship, not parallel
- Eleven sibling sub-sprint dirs under flat layout would not show their relationship

**Alternatives considered:**
- Flat with prefix (e.g., `20260417-01-sprint-a1-foo`) — rejected, names get long, listings still don't group, master-plan doc has no clear home
- Nested as proposed in brief — chosen

**Decision:** Master-sprint dir holds `master-plan.md` at root + sub-sprint dirs (each with their own 4 folders) as the only children. Standard sprints unchanged. Nesting only at master-plan-mode altitude.

**Rationale:** The structural relationship between master and sub-sprints is real, not arbitrary. Honoring it is cheaper than encoding it in name conventions.

**Confidence:** High — designer confirmed by repeating the shape statement verbatim.

---

### No master-level subfolders

**Context:** Predecessor brief implied master-level `{design,spec,plan,summary}/` subfolders for cross-sub-sprint artifacts (LBD design briefs, master-deferments-current, master-level spec drafts). Agent asked yes/no on this.

**Information used:**
- StoryDesigner's actual on-disk pattern uses master-level summary folder
- Designer's repeated message after agent asked listed only "master plan named directory - subsprint alternate named directories with 4 artifact folders each. Master plan lives on the master plan directory root"

**Alternatives considered:**
- Keep master-level 4-folder scaffold — rejected by designer's repeat-statement signal
- Master root holds master-plan.md only — chosen

**Decision:** No master-level subfolders. Cross-sub-sprint artifacts (deferred items, reassessments) append into master-plan body. LBD-style design-only sub-sprints get their own sub-sprint dirs.

**Rationale:** Designer ruled this twice. Repeated message = strong certainty signal (per thinking lesson on certainty assessment).

**Confidence:** High — explicit designer ruling reinforced by verbatim repetition.

---

### Exit protocol — conversation, not skill

**Context:** Agent proposed `master-plan-close` skill for exit. Designer corrected: "I thought we weren't using skills, only prompt."

**Information used:**
- Earlier-established rule from red-team contraction: modify existing skills, no new top-level skills
- Agent had drifted by re-introducing skill surface for the exit step

**Alternatives considered:**
- Standalone `master-plan-close` skill — rejected by designer's correction
- Auto-detect closure via archive-modifier — rejected earlier (status fields drift, would misfire)
- Conversation-driven with documented protocol — chosen

**Decision:** Designer signals "close master plan" → agent reads master-plan.md → reports closure readiness → designer approves → agent runs `rm .active-master`. Protocol documented in master-plan template header and `docs/master-plan-mode.md`.

**Rationale:** Honors the no-new-skills rule the agent had already conceded to, and keeps the closure assessment grounded in the master-plan document (consistent with master-plan-as-north-star principle).

**Confidence:** High — designer's correction was direct, agent restated before moving on.

---

### Closure assessment driven by master-plan document

**Context:** Designer added: "the master plan should be the document that the agent uses to assess closure."

**Information used:**
- Master-plan template already structures sub-sprint statuses, decision gates, reassessment log, endstate criteria
- Designer wanted "ask and approval" — substantive ask, not blind confirmation

**Alternatives considered:**
- Agent asks designer "ready to close?" without independent assessment — rejected, blind
- Agent reads master-plan, assesses readiness, reports findings, then asks approval — chosen

**Decision:** Closure protocol becomes substantive read-and-assess. Master-plan stays load-bearing through whole lifecycle: activation → sub-sprint scoping → finish writes → closure assessment.

**Rationale:** Aligns north-star principle with closure mechanism. Closure isn't an event, it's an assessment.

**Confidence:** High — designer explicitly directed.

---

### Version-bump lockstep collapse

**Context:** Agent proposed lockstep enforcement in `master-plan-generator`'s update path to address P1 ("master-plan versioning drift"). Designer corrected: "right now the prompt version just updates as part of Chester finish, just happens."

**Information used:**
- Predecessor brief framed P1 as ad-hoc-edit drift — agent took that at face value
- Actual current behavior: version bumps happen at finish time, not mid-sprint
- Lockstep concerns evaporate if all three coupled fields write in one finish-skill invocation

**Alternatives considered:**
- New `master-plan-body-edit` skill enforcing lockstep — rejected (already collapsed earlier under no-new-skills rule)
- Generator update-path enforcement — rejected by designer's correction (no ad-hoc-edit problem to solve)
- `finish-write-records` mode-aware branch writes all three coupled fields atomically — chosen

**Decision:** `finish-write-records` modifier writes master-plan version bump + change-log entry + reassessment entry + deferred-items append as one atomic operation. No way to do part of it. Lockstep is by-construction.

**Rationale:** P1 wasn't an enforcement problem, it was an absence-of-finish-automation problem. Designer's correction redirected the entire lockstep design from "enforce discipline at edit time" to "automate at natural finish boundary."

**Confidence:** High — designer's clarification was decisive.

---

### Deferred items append to master-plan body

**Context:** Original brief proposed `master-deferments-current.md` as separate master-level summary doc. Designer's no-master-level-subfolders ruling eliminated that location.

**Information used:**
- Master root holds only master-plan.md
- Closure assessment reads master-plan to determine readiness — needs visibility into outstanding debt

**Alternatives considered:**
- Deferrals stay scoped to sub-sprint dirs only — rejected, breaks closure visibility
- Deferrals append into master-plan body at finish time — chosen

**Decision:** `finish-write-records` master-mode branch appends new deferred items into a section of master-plan.md body during the same atomic write that bumps version.

**Rationale:** One document, three lifecycle touches. Closure assessment reads one place and sees both completion status and outstanding debt. Document grows over master sprint lifetime; that's correct shape.

**Confidence:** Medium — designer signaled stop before this question received explicit confirmation. Decision derives from earlier rulings (no master-level subfolders + closure-assessment-via-master-plan) but wasn't itself confirmed in conversation.

---

### Sub-sprint naming form

**Context:** Generator template uses `Sprint[NNN]a/b/c` form. Predecessor brief proposes `sprint-<a1|b1>-<slug>` + `lbd-<nn>-<slug>` form. Drift between paired artifacts.

**Information used:**
- StoryDesigner's actual on-disk usage matches the runtime brief form (slugged with LBD prefix)
- Generator template predates the seven days of usage that taught the naming convention

**Alternatives considered:**
- Keep template's bare form (`Sprint[NNN]a`) — rejected, loses information
- Slug-only form — rejected, loses ordering coordinate
- Runtime form (letter-coordinate + slug, with LBD prefix for design-only) — chosen

**Decision:** Sub-sprint naming uses `sprint-<letter><number>-<slug>` for implementation, `lbd-<nn>-<slug>` for design-only. Generator template needs minor update to match.

**Rationale:** LBD-vs-sprint distinction encodes a real behavioral difference (design-only sub-sprints have no execute phase). Slug carries the most information cheaply. Letter coordinate keeps ordering legible.

**Confidence:** Medium — agent proposed this, designer didn't push back, but no explicit confirmation either. Template-update task remains in Known Remaining Items.
