# Reasoning Audit: Add Interview Instructions — Session-Scoped Info-Packet Style Overlay

**Date:** 2026-05-12
**Session:** `00`
**Plan:** `add-interview-instructions-plan-00.md`

## Executive Summary

This session walked a single sprint from `design-small-task` through `finish-write-records` to add a session-scoped voice/style overlay to Chester's shared voice authority (`util-design-partner-role`). The most consequential decision was the architectural hybrid built at `design-specify`: maximum centralization of the overlay rule inside the voice authority crossed with replace-not-accumulate semantics for `instruction` directives — a principled merge across two independent axes argued by competing architects. The second-most-consequential moment was an execution-time defect caught during Task 1's quality review: Case 4's empty-`PATH` stub hid coreutils alongside `jq`, silently aborting the script and letting Case 4 false-pass off Case 3's leftover state — a real correctness bug, not a style nit, found by adversarial test reading rather than by the test passing. The implementation otherwise stayed on plan; all deviations were inline fixes inside the existing task boundaries.

## Plan Development

The plan was developed end-to-end inside this session. `design-small-task` ran an interactive Q&A loop that produced twelve crystallized decisions (rule centralization site, factory-default literal, verbosity ladder shape, directive syntax, composition precedence, etc.) and a six-section brief. `design-specify` then dispatched two competing architects on opposite axes — centralization (voice-authority-only vs. distributed) and instruction semantics (replace vs. accumulate) — plus a prior-art explorer in parallel; the synthesis recommended a hybrid (max-centralization + replace) which the designer chose, after which 18 acceptance criteria were written and three review passes ran (fidelity, adversarial, ground-truth) with all MEDIUM findings fixed inline and a spec revision (`-spec-01.md`) emitted. `plan-build` produced a 6-task loop-optimized plan that hit a smell-heuristic tripwire on the word "persistence", triggering parallel attacker + smeller dispatches that surfaced 1 CRITICAL + 1 HIGH + 3 MEDIUM findings, all fixed inline before execution. Execution ran in subagent mode through six tasks, each with spec + quality reviews, with two findings (Critical Case 4, Minor tripwire) fixed inline; a final full code review over the sprint range returned Ship.

## Decision Log

### Hybrid axis selection at design-specify

**Context:**
`design-specify` dispatched two competing architects on independent axes — where the overlay rule should live (centralized in voice authority vs. distributed in each interview skill) and how `instruction` directives merge with the active style (replace vs. accumulate). The synthesis step had to choose along each axis and decide whether to take a pure side or construct a hybrid.

**Information used:**
- Architect-A and Architect-B briefs surfacing the two axes as independent
- Prior-art explorer's parallel survey of how voice rules already centralize in `util-design-partner-role`
- Twelve design-brief decisions, especially the "voice-authority-wins composition with silent clamp" and "single firing site inside each interview skill's first-turn framing block"

**Alternatives considered:**
- `Pure centralization + accumulate` — rejected because accumulate semantics quietly grow active-style strings and make precedence ambiguous when directives stack
- `Distributed rule + replace` — rejected because duplicating the overlay rule into each interview skill defeats the voice authority's purpose
- `Pure centralization + replace` (the bare hybrid) — accepted but built up explicitly as a hybrid construction rather than picked off one architect's slate

**Decision:** Adopt a hybrid combining maximum centralization (rule lives in the voice authority; interview skills only contain a firing site) with replace semantics for `instruction` directives.

**Rationale:** Centralization keeps the rule normative in one place so future interview skills inherit it for free; replace semantics give the designer a clean mental model — the active style is always exactly what the last directive said. The two axes are orthogonal, so picking the strongest answer on each independently was strictly better than committing to either architect's full package.

**Confidence:** High — explicit in the design-specify synthesis turn and reflected in the spec's composition rules.

---

### Case 4 false-pass fix during Task 1 execution

**Context:**
Task 1's quality review flagged Case 4 (jq-unavailable branch) with Critical confidence 93. The test set `PATH="$stub_bin"` where `$stub_bin` was an empty directory intended to hide `jq` — but it also hid `git`, `head`, and `sed`, causing `chester-config-read.sh` to abort at line 14 before reaching the factory-default fallback. Case 4 then read `CHESTER_INFO_PACKET_STYLE` left over from Case 3 and false-passed.

**Information used:**
- Quality-review reading of the actual test script (not just exit codes)
- `chester-config-read.sh` line 14 dependency on `git rev-parse`
- Existing `unset` discipline pattern in other Chester sandboxed tests

**Alternatives considered:**
- `Leave Case 4 as a known-flaky test` — rejected; the test asserts a real branch (jq-absent factory default) and silent false-pass would mask future regressions
- `Mock the entire script invocation rather than the PATH` — rejected as a heavier rewrite than warranted; PATH stubbing is the right shape, just executed wrong
- `Only fix the PATH, skip the unset` — rejected; defense-in-depth `unset CHESTER_INFO_PACKET_STYLE` is cheap and guards against future inter-case leakage

**Decision:** Build a stub PATH with explicit symlinks for `bash`, `git`, `head`, `sed` and omit only `jq`; add `unset CHESTER_INFO_PACKET_STYLE` between cases as defense-in-depth. Same commit corrected the `# Exports:` header comment from four to five exports.

**Rationale:** The bug was a test defect, not a code defect — the production script behaved correctly when its dependencies were available. The fix preserves the test's intent (exercise the jq-absent branch in isolation) while removing the accidental coupling to coreutils availability. Catching it required reading the test for what it actually does rather than trusting its green status.

**Confidence:** High — explicit Critical finding with conf 93 captured in the quality review and resolved in commit `ad043a4`.

---

### Pre-broken stamping test discovered and re-pinned in plan

**Context:**
During plan hardening, the smeller/attacker pair flagged `tests/test-stamping-design-large-task.sh` as pinned at `v0011` while the actual skill file was at `v0013` — a pre-existing breakage unrelated to this sprint. Task 5 would bump `design-large-task` to `v0014`, but the test would already have been failing before Task 5 ran, with no plan-level instruction to fix it.

**Information used:**
- Plan-build attacker output (1 CRITICAL finding)
- File inspection confirming the v0011 vs v0013 mismatch at sprint start
- Sibling test `test-stamping-design-small-task.sh` correctly pinned at v0002

**Alternatives considered:**
- `Fix the pre-broken test in a separate cleanup sprint` — rejected; would have stopped Task 5 execution mid-sequence with no recoverable plan instruction
- `Have Task 5 simply bump the pin without commentary` — rejected; the asymmetry (one test pre-broken, one test would-break-on-this-sprint) deserves explicit Step 3c notes in both tasks for the next reader

**Decision:** Add Step 3c "re-pin stamping test" to both Task 5 (v0011 → v0014) and Task 6 (v0002 → v0003) with inline rationale distinguishing the pre-broken case from the would-have-broken case.

**Rationale:** The hardening gate's purpose is exactly this — surface execution blockers before they fire. Recording the asymmetry in the plan keeps the maintenance pattern visible (stamping tests pin to specific versions and require manual updates on every skill bump). The Handoff Notes explicitly flag this as a broader maintenance drag worth a future programmatic-discovery fix.

**Confidence:** High — explicit CRITICAL and HIGH findings in the plan threat report; both re-pin steps visible in the plan.

---

### Composition-tripwire test tightening during Task 3

**Context:**
Task 3's quality review (Minor, conf 85) flagged that the tripwire test searched for the substring `'composition'` in `util-design-partner-role/SKILL.md`. The file already contained "Composition Note" and "Composition with Translation Gate" prior to this sprint, so the test would pass even if the new `### Composition Rule` subsection were deleted entirely.

**Information used:**
- Pre-edit `util-design-partner-role/SKILL.md` contents
- The set of H3 headings added in this sprint (`### Composition Rule`, etc.)
- The skill-index entry for `util-design-partner-role` (full phrase `info-packet style overlay`)

**Alternatives considered:**
- `Leave broad-substring tripwire and rely on other tests` — rejected; tripwire's whole job is precision and a false-positive-prone needle defeats it
- `Pin to byte-exact section content` — rejected as over-pinning that would create churn on benign wording changes
- `Pin to specific H3 heading strings + skill-index full phrase` — accepted as the right granularity

**Decision:** Tighten the tripwire to pin specific H3 headings (`### Composition Rule` etc.) and pin the skill-index check to the full phrase `'info-packet style overlay'`.

**Rationale:** A tripwire is only useful if removing the thing it guards triggers a failure. The original needle was too permissive given the file's pre-existing vocabulary; the tightened version fails closed if a future edit deletes any of the named H3s or the skill-index entry's distinguishing phrase.

**Confidence:** High — explicit Minor finding (conf 85) with the exact pre-existing strings cited; fix visible in commit `2307b85`.

---

### Adversarial spec fixes — export count, phase identifier, unconditional read

**Context:**
`design-specify`'s adversarial review surfaced three MEDIUM findings in the draft spec: (1) the export count in the spec contradicted the actual `# Exports:` header `chester-config-read.sh` would carry, (2) a phase identifier referenced "Phase 3" where the framing block actually lives in Phase 4a of one skill, and (3) the spec omitted that the user-config read must be unconditional (run even when the key is absent, so factory default takes over downstream).

**Information used:**
- Adversarial reviewer findings (3 MEDIUMs)
- Actual file contents of `chester-config-read.sh` and the two design SKILL.md framing blocks
- ACs that hinged on the unconditional-read invariant for the jq-available branch

**Alternatives considered:**
- `Mark findings as advisory and ship spec as-is` — rejected; each finding pinpointed a real correctness gap that would propagate into the plan
- `Defer phase-identifier correction to plan-build` — rejected; spec-to-plan correctness is the spec's job

**Decision:** Fix all three inline; rev the spec to `-spec-01.md` and proceed to ground-truth review.

**Rationale:** Spec-level contradictions become plan-level contradictions become test-level contradictions. Catching them before plan-build is materially cheaper than catching them at execution.

**Confidence:** High — three MEDIUMs with explicit fixes recorded in the session summary's spec-phase section.

---

### Ground-truth spec fixes — skill-index location and framing-block line range

**Context:**
Ground-truth review (the codebase-anchored reviewer) found two MEDIUM findings: the spec pointed at `setup-start/SKILL.md` as the available-skills list location, but the list had moved to `setup-start/references/skill-index.md`; and the spec's framing-block line range for one of the design skills was off.

**Information used:**
- Ground-truth reviewer's file/path verification
- Root `CLAUDE.md` (which itself carries the same stale pointer)
- Actual line numbers in `design-large-task/SKILL.md` and `design-small-task/SKILL.md`

**Alternatives considered:**
- `Also fix root CLAUDE.md's stale pointer in this sprint` — rejected as out-of-scope cleanup; flagged in Handoff Notes for a future sprint
- `Defer line-range correction to execute-write` — rejected; line ranges are part of what the plan inherits from the spec

**Decision:** Fix both inline in the spec; leave root `CLAUDE.md` untouched and document the stale pointer in Handoff Notes.

**Rationale:** Scope discipline — the sprint's job is the overlay, not a CLAUDE.md audit. But the spec must point at the real artifact location or the plan will instruct edits to a file that does not house the list.

**Confidence:** High — both MEDIUMs and the deliberate non-fix on `CLAUDE.md` are recorded in the summary.

---

### Voice-authority-wins composition with silent clamp

**Context:**
At `design-small-task`, the designer had to decide what happens when an `instruction` directive conflicts with a rule already enforced by the voice authority (e.g., a directive that would override the read-aloud discipline). Options ranged from letting the directive win, to refusing the directive, to silently clamping it.

**Information used:**
- Voice authority's existing normative rules (Interpreter Frame, read-aloud, option-naming, self-evaluation)
- The design brief's framing of overlay as "rendering only — verbosity, formatting, focus, voice flavor"

**Alternatives considered:**
- `Directive wins, overrides voice authority` — rejected; would make voice authority non-normative
- `Refuse and warn` — rejected as too friction-heavy for a runtime overlay
- `Silent clamp` (apply the parts of the directive that don't conflict; silently drop the parts that do) — accepted

**Decision:** Voice authority wins composition; conflicting directive components are silently clamped.

**Rationale:** The overlay's purpose is rendering shape, not protocol modification. Silent clamping preserves the voice authority's normativity while keeping the directive surface friction-free for the common case where directives only touch rendering axes.

**Confidence:** Medium — decision explicit in design brief and spec ACs; rationale primarily inferred from the brief's "rendering only" framing.

---

### Plan execution mode — subagent

**Context:**
Plan-build heuristically recommended subagent execution mode given the plan's six tasks with mixed code/docs producers and the per-task review checkpoints. The user confirmed.

**Information used:**
- Plan-build's `Execution mode` heuristic
- Task mix (2 code-producing for bash, 4 docs-producing for SKILL.md edits)

**Alternatives considered:**
- `Inline execution` — rejected; six tasks with per-task review checkpoints fit subagent dispatch better and avoid parent-context pollution

**Decision:** Subagent execution mode, confirmed by user.

**Rationale:** Standard heuristic outcome for plans of this shape and size. Each task gets independent context with reviewer dispatch.

**Confidence:** High — explicit in the plan header and summary.

---

### Defer multi-voice selection layer, project-level overrides, archiving, and memory-overlay merger

**Context:**
The design brief named "voice" as one of three rendering axes but did not implement voice swapping; the brief also explicitly declined style-archiving in session-meta or design-brief artifacts, kept memory and overlay as independent layers, and limited persistence to user-level only.

**Information used:**
- Design brief Decision 12 (no archiving)
- Brief's "memory and overlay are independent layers" framing
- Sprint scoping discussion

**Alternatives considered:**
- `Include voice-swap layer in this sprint` — rejected as scope expansion past the rendering-overlay shape
- `Archive active style into session-meta on every change` — rejected as artifact noise
- `Auto-merge user memory into overlay default` — rejected as silent coupling between two independent systems

**Decision:** Ship only the rendering overlay with user-level persistence; defer voice swapping, project-level overrides, archiving, and memory-overlay merger to future sprints.

**Rationale:** Each deferred item is a coherent future sprint on its own. Including them now would have widened the spec without strengthening the overlay's core capability.

**Confidence:** High — explicit in design brief and summary's Known Remaining Items.

---

### Acknowledge mirror-text duplication at N=2

**Context:**
The handshake paragraph ended up byte-identical in `design-large-task/SKILL.md:264` and `design-small-task/SKILL.md:114`. The smell review noted the duplication.

**Information used:**
- Smell review output
- Number of current interview skills importing the voice authority (2)

**Alternatives considered:**
- `Extract to a shared block now and read from voice authority` — rejected; abstraction at N=2 is premature
- `Generate from a template at sprint time` — rejected as build-system complexity for a two-line gain

**Decision:** Accept the duplication at N=2; document the extraction trigger (N≥3) in Handoff Notes.

**Rationale:** Rule of three. The cost of premature extraction (an indirection layer to chase when reading either skill) exceeds the cost of maintaining two identical paragraphs at this scale.

**Confidence:** High — explicit in summary's Known Remaining Items.

<!-- created-at: 2026-05-12T16:59:51Z -->
<!-- produced-by finish-write-records@v0003 -->
