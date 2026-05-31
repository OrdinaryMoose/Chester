# Reasoning Audit: execute-write per-task review-depth granularity

**Date:** 2026-05-31
**Session:** `01`
**Plan:** *(no implementation plan — committee-driven direct edit; source artifact `committee-analysis-execute-write-granularity.md`)*

## Executive Summary

The session set out to make `execute-write` scale review intensity to task weight instead of spending a fixed `3N+1` agent floor regardless of plan size. A six-role committee was convened over two rounds; the most consequential outcome was the **two-axis split** — recognizing that the designer's proposed `inline / middle / full` scale conflated two orthogonal properties (independence/topology, which is binary and structural, vs review depth, which is a posterior knowable only after the diff exists). That split kept the change to 27 lines in one file with zero cross-skill contract: review depth gates at execute-time on the implementer's *observed* report, topology stays a whole-plan binary, and the expensive per-task-topology rebuild was deferred. Implementation stayed exactly on the committee's converged shape; the only designer-set knob (Section 4 always-on vs conditional) resolved to always-on.

## Plan Development

There was no written implementation plan. The work began as an analysis request ("review execute-write through the quality-per-token lens"), which produced a `3N+1` cost finding. The designer then opened a session and convened the committee to harden that analysis and design a granularity mechanism. The committee ran one round (signal-source + Section-4 conditionality), the designer reopened with a sharper structural question (locus — should this live in plan-build?), and a second round reframed the whole proposal into the two-axis model. The designer adjudicated option 1 with Section 4 always-on, and the agent drafted six edits directly against the worktree copy of `execute-write/SKILL.md`.

## Decision Log

### Two-Axis Split — Independence vs Depth

**Context:** The designer's round-2 proposal was to replace the `subagent | inline` binary with a per-task `inline / middle / full-subagent` scale owned by plan-build. The committee had to decide whether that single dial was coherent.

**Information used:**
- `fork-policy.md:40,44` — context-sharing (independence) is binary by construction; named reviewers never fork.
- `plan-build/SKILL.md:243-279` — plan-build already reasons per-task then collapses to one verdict.
- `implementer.md:121-124` — the implementer report (Files Changed, Tests, status) is the only ground-truth weight signal, available only after the diff exists.
- Purist's repeatability test: no member could name a single axis on which "middle" sits.

**Alternatives considered:**
- `Single per-task ordinal scale (inline/middle/full)` — rejected: "middle" conflates a *kind* change (inline→subagent flips topology) with a *quantity* change (more reviewers); an ordinal cannot carry both, so "middle" is an arbitrary point operators would overuse to dodge full-review cost.
- `Accept or reject the proposal whole` — rejected: the committee reframed instead, separating the legitimate granularity ask (depth) from the incoherent packaging (one scale).

**Decision:** Split the one proposed dial into two orthogonal axes — topology/independence (binary, whole-plan, structural) and review depth (per-task, posterior, observed) — and assign each to the locus where its input exists.

**Rationale:** Independence is an enforcement property knowable structurally at plan time but irreducibly binary; depth is a policy property only knowable after the implementer returns. Fusing them into an ordinal made the field unauditable. The split is what bounded the entire change to depth-only inside the existing subagent loop.

**Confidence:** High — explicitly argued 4-0 across all four members and narrated by the team-lead at consolidation.

---

### Observed Feed Over Plan-Derived Floor

**Context:** Once depth was isolated as the per-task axis, the live question was what *feeds* the depth dial — a number the plan forecasts up front, or the diff that actually happened.

**Information used:**
- Researcher's decisive finding: `Decision budget`, `Files`, `Type` have **zero** execute-time consumer today; `plan-build/SKILL.md:54` and `plan-template.md:96` assert an execute-side `Type` trigger-check that a grep across execute-write + all four references proves does not exist (vaporware).
- Round-1 convergence: observed ground truth beats author-graded forecast.
- Purist's retraction: deriving from plan fields would make execute-write the *first* reader of plan-build's per-task schema — a new cross-skill coupling.

**Alternatives considered:**
- `Plan-derived per-task review floor + observed escalate-up` (option 2) — rejected: keys the dial on author-estimated, never-validated fields and adds a new execute→plan reader; carried as a deferred variant, not shipped.
- `Derive depth from existing plan fields inside execute-write` (Purist's original) — withdrawn by its own author after verifying it adds the coupling above.

**Decision:** The depth gate reads the implementer's own observed report (Status, Files Changed, new-file flag, Tests, cross-layer import), with no new plan field and the predicate fixed literally in the skill body.

**Rationale:** Observed beats forecast — the planner cannot see a diff that does not yet exist, and the only plan-side weight signals are ungraded and have no existing consumer. Reading the report execute-write already holds adds zero contract surface.

**Confidence:** High — the vaporware grep was decisive and explicitly drove the convergence; narrated and recorded.

---

### Per-Task Topology Deferred, Not Built

**Context:** The committee agreed topology *could* legitimately descend per-task (plan-build already computes the signals then discards them), so the agent had to decide whether to build per-task topology now or defer it.

**Information used:**
- Researcher Q3: execute-write reads one header field and routes the whole plan to Section 2 (subagent) or Section 3 (inline) — two top-level, mutually exclusive branches; per-task topology requires merging them into a per-task dispatcher and reconciling Section 4 against a mixed run.
- Pragmatist's YAGNI gate: no current plan needs per-task topology mixing.

**Alternatives considered:**
- `Build per-task topology now` — rejected: it is an architecture change (rebuild the two-section model into a dispatcher), the single largest cost in the proposal, and deserves its own design + plan + threat pass.

**Decision:** Defer per-task topology to `DI-1`; keep topology a whole-plan binary; ship depth-only.

**Rationale:** The expensive rebuild attaches only to topology, which the two-axis split set aside. Keeping topology whole-plan let the change stay a small consumer-side read with no executor surgery.

**Confidence:** High — recorded as `DI-1` in `deferred-items-00.md` with the researcher's cost finding as justification; the agent explicitly walked back the earlier "rebuild" cost framing.

---

### Section 4 Always-On vs Conditional

**Context:** The end-of-run full code review (Section 4) overlaps the per-task reviews it follows. The committee split on whether to make it conditional to recover the overlap on small flat plans.

**Information used:**
- Conservator: the `+1` final review is the cheapest unit and the *only* cross-task integration net; per-task isolated reviewers each see one task in cold context and cannot catch integration bugs.
- `code-reviewer.md:3` — the full review reads the actual `BASE..HEAD` diff and is bias-mitigated by construction.
- Pragmatist/Innovator: conditional Section 4 (run only when task-count > 3, any multi-file task, or any re-dispatch) saves overlap on small plans.

**Alternatives considered:**
- `Conditional Section 4` — set aside this round: forcing execute-write to compute task coupling re-derives plan structure; the integration net is the load-bearing safety property; designer chose to prove the per-task gate first.

**Decision:** Section 4 stays mandatory and unconditional; the conditional variant is deferred to `DI-3`.

**Rationale:** Explicit designer adjudication ("1 as described, always on"). The integration net is the one thing per-task isolated reviewers structurally cannot provide; ship it always-on and revisit conditionality once the per-task gate has a track record.

**Confidence:** High — direct designer instruction, recorded as the Designer Decision.

---

### Spec Floor Non-Dialable; Quality Reviewer Is the Only Dial

**Context:** With a skip gate being introduced, the agent had to decide *which* of the two per-task reviewers the gate could touch.

**Information used:**
- `plan-build:239` / safe-default logic: under-review is unrecoverable, over-review is cheap — spec drift is the silent-failure class.
- `skill-contract` floor-not-ceiling rule: the floor names review steps; upstream may add but may not weaken.
- `quality-reviewer.md:26` — the quality reviewer owns the real-import cross-layer check.

**Alternatives considered:**
- `Allow gating the spec-compliance check` — rejected: spec drift is the unrecoverable failure class; tiering the load-bearing check would let a plan weaken the floor.
- `Gate both reviewers uniformly` — rejected: collapses the asymmetric-cost distinction between recoverable (quality nits) and unrecoverable (spec drift) failures.

**Decision:** Spec compliance is a non-dialable floor that runs every task; only the quality reviewer is gated, and even then never when the change crosses a layer boundary (cross-layer carve-out).

**Rationale:** The gate must only touch the redundant check, never the load-bearing one. The cross-layer carve-out preserves the one quality duty — catching a small change that silently breaks integration — that the gate could otherwise skip.

**Confidence:** High — stated as a shared category guard and written literally into the skill body per Purist's auditability requirement.

---

### The Six Concrete execute-write Edits

**Context:** After adjudication, the agent had to translate the converged decision into specific edits against `execute-write/SKILL.md`.

**Information used:**
- Live structure of `execute-write/SKILL.md`: Section 2.1 step 3 (spec), step 4 (quality), Section 4 (final review), Red Flags; verified the worktree copy matched main before editing.
- The committee's fixed-predicate requirement (skip rule written literally, not a free knob).

**Alternatives considered:**
- *(No alternatives visible in context)* — the edit set was a direct mapping of the adjudicated decision onto named insertion points.

**Decision:** Six edits — (1) fork-mode line at Section 2 entry; (2) spec floor made explicit (step 3); (3) quality-reviewer skip gate with five literal conditions (step 4); (4) cross-layer carve-out (step 4); (5) re-dispatch ceiling of 2 then escalate-to-user; (6) Section 4 marked mandatory and unconditional — plus three Red Flags guarding gate misuse, spec-tiering, and the re-dispatch loop. Bumped `v0005 → v0006`, `+27/−2`.

**Rationale:** Every edit lives inside execute-write and its own reference headers; nothing touches plan-build, the plan template, or inline mode. The fixed-in-body predicate satisfies the auditability guard.

**Confidence:** High — edits and the verifying `git diff --stat` / grep are visible in the transcript; `description` frontmatter unchanged so no setup-start sync needed.

---

### Early Merge to Main to Enable refresh-chester

**Context:** After committing on the branch, the designer asked to "commit this and refresh chester." `refresh-chester` syncs the plugin cache from the **main** checkout, not the worktree.

**Information used:**
- Knowledge that the refresh rsync reads from `/home/mike/Documents/CodeProjects/Chester/` (the main checkout), so a branch-only commit would not be picked up.

**Alternatives considered:**
- `Refresh from the worktree directly` — not available: the refresh script's rsync source is the main checkout path.
- `Defer the merge to the finish phase` — rejected: refresh would then ship stale `v0005` until merge, defeating the designer's request.

**Decision:** Merge the branch into main (`--no-ff`) before running refresh, out of the normal finish ordering, so the cache picks up `v0006`.

**Rationale:** The designer's explicit "refresh chester" required the change to be on main; merging early was the only way the cache would carry the live edits. The agent flagged that main had moved under it (`f96be5e`, not the earlier `276601a`) but the merge was clean.

**Confidence:** Medium — the decision is visible and the agent narrated the refresh-from-main constraint; the deviation from finish-phase ordering was driven by the user request rather than an explicitly stated process rule.

---

### Scoping the Committee Question

**Context:** At convening, the broad ask ("review the analysis and improve granularity") had to be turned into a single one-round-format question.

**Information used:**
- The prior quality-per-token analysis (`3N+1` floor, Section-4 overlap, fork-policy as the cost lever).
- The one-round-format and terse-verbosity directives from the designer.

**Alternatives considered:**
- `Multi-topic round` — avoided per the single-topic-per-round discipline; the question was posed as one axis (weight→intensity at what contract cost).

**Decision:** Frame the round-1 question as "How should execute-write scale review intensity to task weight + cross-task coupling — what granularity mechanism, at what contract cost?" and dispatch all five members concurrently with the analysis as the context packet.

**Rationale:** A single, cost-anchored question keeps the deliberation at one altitude and lets the researcher ground-truth the cost claims before they shape a recommendation.

**Confidence:** Medium — the framing is visible in the dispatch; the rationale for the specific wording is partly inferred from the single-topic convention.

<!-- created-at: 2026-05-31T11:03:40Z -->
<!-- produced-by finish-write-records@v0003 -->
