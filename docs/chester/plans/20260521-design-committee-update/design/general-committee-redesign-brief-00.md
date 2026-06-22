# General Committee Skill — Redesign Brief (skeleton)

**File:** `design/general-committee-redesign-brief-00.md`
**Sprint:** `20260521-design-system-analysis`
**Status:** SKELETON — pending designer input on open sections
**Date:** 2026-05-22

---

## 1. Subject

Redesign of the general-mandate `chester:design-committee` skill — the process-agnostic four-pole-plus-researcher committee invocation that Chester uses for ad-hoc design consultations, framing audits, charter calls, and other broad-mandate deliberation. The redesign is informed by the R1 mode-separation decision (`design/r1-mode-separation-decision-00.md`) and is scoped to the general primitive only.

Out of scope: the `design-architect-committee` skill (the specific sprint-bound wrapping skill being designed for StoryDesigner). That skill is a downstream consumer of this primitive's contract; its build proceeds in a separate work stream.

---

## 2. Background and Prior Art

- **R1 decision packet** ratified the convening-message attach point, three forbidden surfaces (agent files, general SKILL.md, output-format field labels), and editorial-discipline guards. The packet supersedes any prior assumption that wrapping skills may modify shared infrastructure.
- **Current files in scope:**
  - `skills/design-committee/SKILL.md` — current general skill file (May 17 baseline; predates R1).
  - `skills/design-committee/references/` — supporting reference docs.
  - `agents/design-committee-{conservator,innovator,pragmatist,purist,researcher}.md` — pole and researcher agent files currently living at the top-level `agents/` directory.
  - `agents/design-committee-arbiter.md` — legacy proof-system custodian; deprecated.
- **Charter clarification (this sprint):** the general committee call is exactly six roles — team-lead, four poles (Conservator, Innovator, Pragmatist, Purist), and Researcher. No Clerk. No Arbiter. Clerk is a wrapping-skill role injected via convening message. Arbiter is deprecated alongside the proof system.
- **one-round-format** emerged in this sprint as a canonical lightweight deliberation shape: each pole produces a position, sends one peer question by direct DM, answers any incoming with one direct response, submits final position to team-lead. Established by usage; not yet documented in the SKILL.md.

---

## 3. Goals

- The general SKILL.md states a positive contract (what the primitive promises) and an explicit non-contract (what it does not promise) so that wrapping skills and future authors can be measured against a stable floor.
- Agent files live alongside the skill they support, so a reader who opens the skill folder sees the whole primitive in one place.
- The Arbiter is removed cleanly; references to proof-state operations are scrubbed.
- The one-round-format is documented as a named deliberation shape the skill supports.
- The Translation Gate, role roster, peer-DM protocol, and team-lead's compile-not-relay discipline are stated as load-bearing primitives.

---

## 4. Scope — In

- **File reorganization.** Move the five live agent files (`conservator`, `innovator`, `pragmatist`, `purist`, `researcher`) from top-level `agents/` into `skills/design-committee/agents/`. Update plugin namespace references if needed.
- **Arbiter removal.** Delete `agents/design-committee-arbiter.md`. Strip Arbiter mentions from `skills/design-committee/SKILL.md`. Update the available-skills list in `skills/setup-start/SKILL.md` if it references the Arbiter.
- **SKILL.md rewrite.** Replace the current SKILL.md with a version that encodes the R1 contract — positive contract block, explicit non-promises, three forbidden attach points, mode-distinguishability test, and the one-round-format.
- **Common items consolidation.** Voice rules, format rules, peer-DM protocol, and team-lead compile discipline that currently live in `util-design-partner-role` (or that need to be authored fresh) are referenced from the SKILL.md so wrapping skills inherit them by reference.
- **References folder review.** Confirm `skills/design-committee/references/` content is still load-bearing post-R1; remove or update anything contradicted by the R1 decision.

## 4b. Scope — Out (annotated)

- **`design-architect-committee` skill build** — *not us*. That is the wrapping skill for the StoryDesigner repo. Its build consumes the general SKILL.md as input but is itself a separate work stream.
- **Mechanical enforcement of the three forbidden surfaces** (pre-commit hooks, CI lint) — *not yet*. R1 ratified editorial discipline as the enforcement mechanism for now. A follow-up brief may revisit.
- **Migration of prior `design-committee` invocations** — *not needed*. The skill's contract is stable enough that prior invocations don't require retroactive correction.
- **`util-design-partner-role` rewrite** — *not us, but adjacent*. If the redesign surfaces gaps in the partner-role contract (voice rules, Translation Gate spec), they get flagged as a follow-up brief, not rolled into this scope.

---

## 5. Ratified Decisions Carried In

- Convening message is the only legitimate attach point for any overlay or specialization (R1 §4).
- Three forbidden attach surfaces: agent files, general SKILL.md, output-format field labels (R1 §5).
- Floor-not-ceiling rule (R1 §3): wrapping skills may add, may not weaken or substitute.
- Mode-distinguishability observable: convening message inspection (R1 §6).
- Editorial-discipline-only enforcement (R1 §8).
- Six-role committee composition: team-lead + four poles + researcher (no Clerk, no Arbiter).

---

## 6. Open Questions (Resolved by Designer 2026-05-22)

All five open questions from the skeleton were worked in R2 (committee deliberation + research pull) and adjudicated by the designer. See `design/r2-open-questions-decision-00.md` for the full decision packet. Resolutions:

- **Q1 — Plugin namespace impact.** Researcher confirmed the repo has no documentation. Industry research dispatched and returned with authoritative findings (`design/industry-research-plugin-resolver-00.md`). **Resolution:** the move requires a `plugin.json` manifest update adding `"agents": ["./agents/", "./skills/design-committee/agents/"]`. Identifiers `chester:design-committee-{pole}` remain unchanged after the move (path-based identifier construction preserves the existing names). Empirical test is no longer required.
- **Q2 — `util-design-partner-role` inline vs reference.** Committee split 2-2 (R: Conservator, Pragmatist; I: Innovator-revised, Purist). **Designer ruling: Option R (reference).** General SKILL.md cites `util-design-partner-role` and includes a load-bearing-citation guard note marking the reference as deletion-protected. Single source of truth across multiple Chester skills.
- **Q3 — `one-round-format` documentation home.** Committee unanimous on Option S (inside SKILL.md). **Designer ruling: Option S, with framing clarification.** The one-round-format is a general committee format — not exclusively a design-committee format. It lives inside the general `design-committee` SKILL.md as the canonical committee deliberation shape, available to any wrapping skill that invokes the primitive.
- **Q4 — Researcher tool surface.** Committee split 3-1 (P: Conservator, Innovator, Pragmatist; N: Purist) with all four rejecting Option E (file-write expansion). **Designer ruling: middle path** — Option P (preserve current tool surface: Read, Glob, Grep, Bash, WebSearch, WebFetch) **plus** Innovator's construction-time constraint added explicitly to the Researcher agent file: findings produced as message output only; no file writes outside the conversation record.
- **Q5 — Backward-compatibility scan.** Researcher identified 7 Arbiter cleanup sites in active codebase. **Designer ruling: no backward compatibility required.** Previous proof-system sessions are archive-only. Cleanup proceeds aggressively across all 7 sites (no preservation of Arbiter references for compatibility with prior invocations).

---

## 7. Work Breakdown (preliminary — see task list)

The redesign decomposes into roughly these tracks. Detailed tasks live in the Claude task list (`TaskList`); summarized here for reader orientation.

- **Track A — File reorganization** (move agents into skill folder; remove Arbiter file).
- **Track B — SKILL.md rewrite** (R1 contract encoded as positive + negative promise blocks; one-round-format documented; roles ratified).
- **Track C — Plugin namespace verification** (confirm subagent resolution still works after move; update `.claude-plugin/plugin.json` if needed).
- **Track D — References folder review** (audit `skills/design-committee/references/` against R1).
- **Track E — Setup-start skill update** (remove Arbiter from available-skills roster; verify other entries).

---

## 8. Constraints

- **R1 decision is non-negotiable** unless the designer reopens it. All redesign choices must pass the R1 floor-not-ceiling test.
- **No mechanical enforcement** added in this redesign (deferred per R1 §8).
- **No design-architect-committee scope creep.** Any decision that benefits only the wrapping skill belongs in that skill's brief, not here.
- **CLAUDE.md system boundary still applies.** `design-proof-system` and `proof-mcp` remain non-cross. The Arbiter removal does not touch either system; it just removes the Arbiter agent role from the general committee.

---

## 9. Risks

- **Plugin-namespace breakage** if external references exist to `chester:design-committee-{pole}` from skills outside `design-committee/`. Mitigation: grep the codebase for the namespace before moving files.
- **Floor-document erosion under editorial-only enforcement.** The R1 contract relies on reviewers catching weakening edits. Mitigation: a "positive contract" block in the SKILL.md with explicit prose framing every line as deletion-protected.
- **Inline-vs-reference choice on voice rules** could trap the SKILL.md into duplication (if other skills already lean on `util-design-partner-role` inline). Mitigation: resolve open question 6.2 before specify.

---

## 10. Done When

- `skills/design-committee/SKILL.md` carries the R1 contract block, the six-role composition, the one-round-format spec, and the Translation Gate as a named discipline.
- All five live pole-and-researcher agent files live under `skills/design-committee/agents/`.
- `agents/design-committee-arbiter.md` is deleted and references are scrubbed.
- `skills/setup-start/SKILL.md` available-skills list no longer mentions the Arbiter.
- Plugin namespace resolution verified — `chester:design-committee-{pole}` dispatches still spawn correctly post-move.
- All five open questions in §6 have designer answers.

---

## Change Log

- **00 (2026-05-22):** Initial skeleton. Five open questions in §6 awaiting designer input. Work-breakdown tracks A–E mapped to task list.
- **01 (2026-05-22):** §6 open questions closed via R2 committee deliberation + designer adjudication. Q1 → industry research dispatched. Q2 → Option R (reference) with citation guard. Q3 → Option S, framed as general-committee format. Q4 → Option P + no-file-write construction-time constraint. Q5 → aggressive Arbiter cleanup, no backward-compat. Brief ready for specify-stage pending industry research return on Q1.
- **02 (2026-05-22):** Industry research returned. Q1 resolved: manifest update path documented (`design/industry-research-plugin-resolver-00.md`). All five open questions now closed. Brief ready for specify-stage. Tracks unblocked: #4 (file move), #7 (namespace verification — now reframed as manifest update task).
