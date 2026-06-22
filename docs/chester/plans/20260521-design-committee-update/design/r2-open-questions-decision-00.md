# R2 Decision — Five Open Questions on the General Committee Redesign

**File:** `design/r2-open-questions-decision-00.md`
**Sprint:** `20260521-design-system-analysis`
**Round:** R2 (one-round-format with parallel research pull)
**Team:** `design-committee-general` (team-lead + 4 poles + researcher)
**Date:** 2026-05-22
**Status:** Pending designer adjudication on two split items (Q2, Q4)

---

## 1. Decision

The Committee was asked to work the five open questions in `design/general-committee-redesign-brief-00.md` §6 before the brief moves to specify. Q1 and Q5 were factual; Researcher pulled them. Q2, Q3, Q4 were design questions; four poles deliberated via one-round-format. Three of the five resolved cleanly; two require designer adjudication on the axis the design is solving for.

---

## 2. Question Status

- **Q1 — Plugin namespace resolution mechanics.** Researcher finding: undocumented in the repo. Empirical verification required.
- **Q2 — `util-design-partner-role` inline vs reference.** Pole split 2-2. Designer adjudication required.
- **Q3 — `one-round-format` documentation home.** Unanimous: Option S (inside SKILL.md). Ratified.
- **Q4 — Researcher tool surface.** Pole split 3-1 (P vs N), with all four rejecting E. Designer adjudication required.
- **Q5 — Backward-compatibility scan.** Researcher finding: 7 Arbiter cleanup sites identified across active codebase. Track A/B/D/E scope expanded.

---

## 3. Q1 — Plugin Namespace (Research Finding)

The current repo carries no authoritative documentation of how the Claude Code plugin resolver discovers agent files. Concrete findings:

- `.claude-plugin/plugin.json` registers `skills/` and `.claude-plugin/mcp.json` but has no `agents` field. There is no existing manifest entry for agent discovery to update.
- All five live committee agent files currently sit at top-level `agents/`. No skill directory contains a nested `agents/` subdirectory anywhere in the codebase.
- Subagent type identifiers (`chester:design-committee-{pole}`) carry the plugin namespace prefix (`name: chester` in `plugin.json`) followed by the in-file `name:` frontmatter field. Whether path determines resolution or `name:` alone suffices is undocumented.
- `docs/fork-policy.md` refers to named subagents as those "in `agents/`" without specifying a qualified path.

**Implication for the redesign:** Track #7 (verify plugin namespace post-move) is genuinely load-bearing and cannot be derived from existing documentation. The move from `agents/` to `skills/design-committee/agents/` must be tested empirically. If the resolver scans only top-level `agents/`, the move breaks dispatch and requires either: (a) leaving agent files at top-level with a path-only rule that they belong to the design-committee skill, (b) extending `plugin.json` with an explicit agents-path entry, or (c) reverting the reorganization for committee agent files.

**Recommendation (team-lead, opinion):** before executing Track A (file move), run a small empirical test — create a throwaway agent file at `skills/design-committee/agents/test-agent.md` and attempt to dispatch via `chester:test-agent`. If it works, proceed with the move. If not, escalate to designer for choice among (a), (b), (c).

---

## 4. Q2 — `util-design-partner-role` Inline vs Reference (SPLIT 2-2)

**The split is the finding.** Pole positions:

- **Conservator + Pragmatist → Option R (reference).** The voice rules in `util-design-partner-role` are a single source of truth across multiple Chester skills. Inlining moves them out of their maintenance home and creates a duplication that must be kept in sync by editorial discipline alone. Conservator pulled the file's git history during the round: five commits over three weeks, all additive (`feat:`/`chore:`), no weakening edits in the record. The evidence supports stability. Pragmatist's add: include a one-sentence note in the general SKILL.md marking the reference as load-bearing — converts a silent dependency into a visible one without duplicating any content.

- **Innovator + Purist → Option I (inline).** The protection mechanism R1 established (editorial discipline at three protected surfaces) is structural-by-boundary: a reviewer recognizes they are inside the committee primitive's boundary and applies the discipline. `util-design-partner-role` lives outside that boundary by construction — it is a shared utility. A future editor working there has no signal that the committee floor depends on the file. The protection cannot reach across the boundary. Duplication is detectable (two files compare-able); cross-boundary erosion is not (a weakening edit looks correct from inside `util-design-partner-role`'s own context). Innovator revised from R to I after Purist's peer-DM argument flipped this point.

**Load-bearing trade-off (the axis the designer is solving for):**

- **Option R bets** that the editorial discipline applied to `util-design-partner-role` (which serves multiple skills) is, in practice, the same discipline that protects the committee floor. The evidence so far supports this. The cost is paid only if the assumption fails at some future point — at which time the failure is silent and undetectable from inside the committee's own review surface.
- **Option I bets** that boundary legibility is worth the duplication cost. Two visible committee artifacts diverging is a loud failure, detectable by any reviewer of the committee system. The cost is ongoing sync discipline whenever voice rules change. The benefit is that the failure mode is always detectable from inside the committee's own boundary.

**Opinion (team-lead, risk-weighted):** the question is which axis the designer values more — single-source-of-truth efficiency (R) versus boundary-legibility insurance (I). If the designer accepts the assumption that `util-design-partner-role` editing discipline holds, R is cheaper. If the designer wants the committee floor to be detectable-from-inside even when shared utilities erode, I is the structurally-cleaner bet. Both poles' positions are well-reasoned and neither is dominant on the evidence currently in hand. **Recommend the designer adjudicate by naming the axis.**

---

## 5. Q3 — `one-round-format` Documentation Home (RATIFIED)

**Option S (inside SKILL.md), unanimous.**

The one-round-format only makes sense in the context of the role roster that operates it. Putting the shape spec inside the canonical skill file means it inherits the same editorial protection as the rest of the contract; separating it into `references/one-round-format.md` would add a second floor surface that carries lighter protection by construction and requires explicit promotion to contract status. The selective-citation benefit a wrapping skill might draw from a separate file is hypothetical — no current skill needs it.

The heavier SKILL.md cost is manageable: one-round-format is a short protocol description, not long prose. Premature extraction is dead weight; extraction can be done later from concrete evidence if a second deliberation shape emerges or a wrapping skill demonstrably needs independent citation.

**Ratified.** SKILL.md rewrite (Track B) will include a named section documenting one-round-format.

---

## 6. Q4 — Researcher Tool Surface (SPLIT 3-1, with composable refinement)

**Pole positions:**

- **Conservator + Innovator + Pragmatist → Option P (preserve).** The current surface matches actual usage. The general committee's broad mandate explicitly includes prior-art pulls, industry research, and document consolidation. Narrowing removes capability the designer may have chosen the committee specifically to access. The blast-radius concern is scoped by the Researcher's role prohibition on design opinion.
- **Innovator's refinement (composable with both P and N):** add an explicit construction-time constraint to the Researcher agent file — findings produced as message output only, no file writes outside the conversation record. This converts the existing role discipline into a structural guarantee, not a runtime convention.
- **Purist → Option N (narrow).** Web access makes the Researcher categorically different — one agent reaches external state the rest of the team cannot audit or reproduce. That categorical difference should be made explicit rather than silently available. If a session needs web research, the convening message should name that need and expand the tool surface deliberately for that session.

**All four poles reject Option E (expand to file-write outside conversation record).** File-write is a clear category violation for an analyst role.

**Load-bearing trade-off (the axis the designer is solving for):**

- **Option P bets** that capability availability is worth the categorical-ambiguity cost. A Researcher with web access is the actual role pattern that has been used.
- **Option N bets** that categorical legibility is worth the capability cost. A Researcher without web access is unambiguously "codebase reader and document analyst." Sessions that need web access expand the surface explicitly.

**Opinion (team-lead, risk-weighted):** the 3-1 majority on P is meaningful but Purist's principled dissent on category cleanliness is also load-bearing. **Recommend a middle path: ratify Option P (preserve) AND adopt Innovator's construction-time constraint** — Researcher tool surface stays current (Read, Glob, Grep, Bash, WebSearch, WebFetch), the agent file explicitly forbids file writes outside the conversation record. This addresses the blast-radius concern Purist raised on the side where the category violation is most acute (state mutation), while preserving the read-side capability Conservator + Pragmatist defended.

This middle path is not a position any single pole proposed; it composes Innovator's refinement onto Pragmatist/Conservator's P. If the designer accepts it, Track A's agent-file update needs one extra line: "Researcher produces findings as message output only; no file writes outside the conversation record."

If the designer prefers the categorical-clean approach, Option N stands as Purist's position with the same construction-time constraint applied.

---

## 7. Q5 — Backward-Compatibility & Arbiter Cleanup (Research Finding)

The Arbiter contamination is wider than the initial brief assumed. Researcher identified seven cleanup sites in the active codebase (excluding `_archive/`, worktrees, and `docs/chester/`):

1. `agents/design-committee-arbiter.md` — delete (Track A — task #5).
2. `skills/design-committee/SKILL.md` — Arbiter named at 14 line locations including the TeamCreate roster at line 117. Track B — task #6.
3. `skills/design-committee/references/design-committee-arbiter-guide-00.md` — full Arbiter operational guide; remove or archive. Track D — task #8.
4. `skills/design-committee/references/design-committee-team-lead-guide-00.md` — Arbiter referenced at 18 line locations. Track D — task #8.
5. `skills/design-committee/references/design-committee-researcher-guide-00.md` — Arbiter referenced at 12 line locations. Track D — task #8.
6. `agents/design-committee-{conservator,innovator,pragmatist,purist,researcher}.md` — each carries Arbiter routing language in its hard-prohibitions section. Track A — task #4.
7. `skills/setup-start/references/skill-index.md`:29 — Arbiter named in the design-committee skill entry. Track E — task #9.

**Other Q5 findings:**

- No active skill outside `skills/design-committee/` dispatches `chester:design-committee-{pole}` subagent types. The redesign's dispatch surface is contained.
- `design-large-task-step-b-{pole}` namespace is distinct from `design-committee-{pole}`. The two agent families are parallel by design, not shared. No coupling risk from the reorganization.
- `docs/fork-policy.md` does not list committee subagent dispatch rows in its policy table. This is a documentation gap (worth flagging as a follow-up) but not a current dispatch hazard.

**Implication for the redesign:** existing task list is correct in shape but Track A and Track D each carry more sub-work than the initial brief estimated. No new tasks; expand existing task descriptions to reference the seven sites.

---

## 8. Adjudication Asks

The designer must adjudicate two items before the brief moves to specify:

- **Q2 axis.** Single-source-of-truth efficiency (R) or boundary-legibility insurance (I)? Both poles' arguments are valid; the choice is which property the design must preserve under future drift.
- **Q4 middle path.** Accept Option P (preserve) + Innovator's no-file-write construction constraint? Or Option N (narrow) + same constraint?

Three items are ratified and need only acknowledgement:

- Q1: Track #7 (empirical namespace verification) is load-bearing. Recommend the small empirical test before Track A executes.
- Q3: Option S — one-round-format documented inside the general SKILL.md.
- Q5: seven Arbiter cleanup sites identified; existing Track A/B/D/E task descriptions to be expanded to reference all seven.

---

## 9. Round Provenance

R2 ran the one-round-format on poles in parallel with a Researcher research pull. Verbatim positions and Q+A pairs persist in the conversation record:

- Conservator initial + final (Q2 R, Q3 S, Q4 P).
- Innovator initial (Q2 R) + final revised to Q2 I after Purist's peer-DM (Q3 S, Q4 P with constraint).
- Pragmatist initial + final (Q2 R with citation guard, Q3 S, Q4 P).
- Purist initial + final (Q2 I, Q3 S, Q4 N).
- Researcher findings on Q1 (plugin namespace) and Q5 (Arbiter cleanup sites + backward-compat scan).

Peer-DM exchanges (private during the round):

- Innovator → Purist on Q2 reference vs inline; Purist answered, surfacing the cross-boundary protection gap that flipped Innovator from R to I.
- Conservator → Pragmatist on Q3 maintenance asymmetry; the dispatch reached Pragmatist after Conservator's peer DM, so the peer Q lacked context. No substantive answer; Conservator final stands unrevised.
- Pragmatist → Conservator on Q2 partner-role edit-history stability; Conservator answered with git-history evidence (five commits, additive only), which confirmed Pragmatist's stated assumption.
- Purist → Conservator on Q3 references directory floor protection; Conservator answered confirming references files carry lighter editorial protection than SKILL.md, which reinforced Purist's Option S position.

One protocol-gap note worth surfacing: the round-trip between Pragmatist and Conservator had a delivery-order issue where Conservator's peer Q arrived before Pragmatist had received the R2 dispatch. This is a one-round-format edge case worth documenting in the SKILL.md spec — peer-DM ordering should be defined relative to dispatch reception, not absolute time.

---

## 10. Closure Note

This decision packet completes the second round of the broader-redesign design work in this sprint. On designer ratification of the two split items, the brief at `design/general-committee-redesign-brief-00.md` §6 can be marked closed, and the redesign moves to specify-stage.

The committee team `design-committee-general` remains alive for follow-up rounds.

---

## Change Log

- **00 (2026-05-22):** Initial R2 decision packet. Q3 ratified. Q1 and Q5 ratified as findings (with Track #7 escalation note). Q2 (split 2-2) and Q4 (split 3-1 with composable refinement) pending designer adjudication.
