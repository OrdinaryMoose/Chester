# Canonical Instruction-Injection Architecture Decision

**Date:** 2026-06-07

**Sprint:** 20260607-01-update-voice-discipline

**Source:** verdict from `committee/round01/verdict.md`; member positions from `committee/round01/consolidator-output.md` and `committee/round01/consolidator-output-r2.md`

---

## Summary

The committee was asked: for each consumer kind in Chester (parent-session skills, Teams subagents, named Task subagents, CLAUDE.md, skill catalog), which mechanism delivers shared instruction text reliably — runtime-read, dispatch-time injection (DTI), or build-time generator? The verdict adopts a mixed, binding-time-explicit architecture: mechanism assigned per consumer kind by the criterion of agent direction strength. Two consumer kinds settled 4-0 in round one (parent-session skills = runtime-read; CLAUDE.md = two-tier pointer); the agent-side crux (Teams + named Task subagents) resolved to build-time generator in round two. The verdict is binding with a mandatory companion obligation: no generator lands without an enforcement trigger.

---

## Verdict

Chester adopts a **mixed, binding-time-explicit architecture** for shared instruction text, selected per consumer kind by the litmus *strength of agent direction (no mid-session drift)*:

1. **Agent-side stable instruction (Teams subagents + named Task subagents)** — **build-time generator**. One canonical source per rule set; agent `.md` files are generated outputs with the shared text baked in, so the instruction is present in the system prompt at load with no CWD dependency. This is the risk-weighted call over the lone DTI dissent because dispatch-time injection adds a per-dispatch caller obligation that silently breaks when any future skill dispatches an agent without injecting — a new drift surface — whereas generated files are self-contained and their drift is `git diff`-detectable. Conservator's own blocking_risk states this advantage; Innovator and Purist marked their DTI variants non-blocking.

2. **MANDATORY companion obligation — regeneration trigger.** The generator decision is only valid if a reliable trigger regenerates agent files when canonical sources change (a test that fails on stale output, a commit hook, or CI check). Both Pragmatist and Purist flagged that without this, generator-drift simply replaces inline-drift. No generator lands without its enforcement.

3. **Dispatch-time injection (DTI)** — retained **only** for genuinely runtime-varying content (the dispatch question and context packets carried in `SendMessage`/`TeamCreate`). This is already how the committee works and is correct; it does not compete with the generator. DTI vs generator is a binding-time choice for the same source — varying content binds at dispatch, stable content binds at build (Purist's resolution).

4. **Parent-session skills (inline `design-small-task`; runtime-read `plan-attack`/`plan-smell`/`util-codereview`/team-lead)** — **runtime-read citation seam**. Settled 4-0; stable CWD, no production path fragility.

5. **CLAUDE.md rules** — **two-tier summary+pointer** (root CLAUDE.md canonical; `skills/CLAUDE.md` points up). Settled 4-0.

6. **Skill catalog (FD-03)** — **generate the index from frontmatter** (frontmatter = single source); fix the phantom pointer in both CLAUDE.md files to name `skills/setup-start/references/skill-index.md`; add the 3 missing skills. 3-1 lean over pointer-only.

**Per-rule-set disposition (all via the generator on the agent side):**
- **Voice rules** — give PM Litmus Test and Research Boundary a canonical home in `util-design-partner-role` (they have none today); the 4 member agents' Stance Principles + Translation Gate blocks become generated from canonical source.
- **Reviewer disciplines (FD-01)** — one canonical `review-discipline` reference (evidence standard / ≥80 confidence ladder / independence); reviewer agent files generated with disciplines baked; reviewer *skills* keep runtime-read.
- **Member scaffold (FD-02)** — canonical member template + 4 lens blocks; the 4 member agent files generated (the ~70% shared scaffold lives once).
- **CLAUDE.md rules (FD-04)** — version-bump + description-sync rules canonical in root, pointer from `skills/CLAUDE.md`; reinstate the dropped "not on typo fixes" carve-out.

**Out of scope this verdict:** FD-05 (review-loop control flow); round/turn flow structures (distinct by design, not duplicated).

**Alignment:** agent-side 2 generator-both (Pragmatist, Purist) / 1 split generator-Task+DTI-Teams non-blocking (Innovator) / 1 DTI-both (Conservator, dissent). Settled 4-0 on parent-skills=runtime-read and CLAUDE.md=pointer.

---

## Rationale

The two consumer kinds that settled 4-0 before round two established that no single mechanism fits all surfaces — the architecture was always going to be a mix. That constraint drove the agent-side question into a binary: DTI vs build-time generator.

**Why the generator won on the agent side:**

- Runtime-read is production-broken for agents. Researcher confirmed: CWD for Teams and named Task subagents in production (marketplace) = user's project root, not Chester repo. Every repo-root-relative citation (`skills/util-design-partner-role/SKILL.md`) fails silently. This eliminated pure runtime-read and forced a choice between DTI and generator.
- Purist's binding-time resolution was decisive. DTI and generator both put instruction text in the agent prompt at load. The choosing criterion is content stability: stable-at-authoring content (scaffold, lens blocks, canonical rules) pays per-dispatch overhead in DTI for zero freshness benefit. Generator materializes once; DTI reads on every dispatch for identical output. Generator wins on cost shape.
- Pragmatist's dispatch-path-complexity argument reinforced this. DTI's real cost is not token volume (~$1–2 over the tool's lifetime) — it is the obligation the DTI pattern places on every dispatch caller. Any future skill that dispatches a reviewer without injecting silently breaks the discipline. Generated files are self-contained; the instruction survives any new dispatch path automatically.
- Conservator's own blocking_risk confirmed the generator's structural advantage: "The generator avoids this [silent breakage] by making the instruction self-contained in the agent file." The dissent conceded the decisive point.
- Innovator conceded named Task subagents to generator and marked the Teams-subagent DTI position non-blocking. With Conservator's concession in blocking_risk and Innovator's non-blocking flag, the generator call carries no blocking objection.

**The mandatory regeneration trigger:** Pragmatist and Purist both flagged that generator drift — edits to canonical source without regenerating agent files — is the same failure mode as inline drift, just delayed. The verdict ties the generator decision to a concurrent enforcement obligation (test, commit hook, or CI check). This is not deferred; no generator lands without it.

**FD-03 (skill catalog):** generator from frontmatter won 3-1. Conservator's pointer-only position holds that deletion is simpler than a generator — but Innovator, Pragmatist, and Purist all noted that pointer-only still requires manual index maintenance and does not catch phantom pointers automatically. Generator from frontmatter makes phantom pointers structurally impossible.

**CLAUDE.md and parent-session skills** settled before round two and required no further deliberation. Two-tier pointer and runtime-read citation seam are each the lowest-disturbance option for their consumer kind.

---

## Dissent Record

**Alignment:** agent-side 2 generator-both / 1 split generator-Task+DTI-Teams non-blocking / 1 DTI-both (dissent). 4-0 on parent-skills=runtime-read and CLAUDE.md=two-tier pointer.

**Dissenting positions:**

- **Conservator** — DTI for all agent-side consumers (Teams + named Task subagents); runtime-read for parent-session skills; two-tier pointer for CLAUDE.md; pointer-only index for catalog — blocking_risk: "DTI's per-dispatch token overhead grows with canonical text size. If the shared scaffold for committee members is large (currently ~70 of 103 lines), DTI bakes substantial text into every dispatch. At high dispatch frequency, the cumulative cost may favor the generator — but dispatch frequency for committee members is low (one committee per design question), making this a theoretical rather than observed pressure. The harder risk: DTI puts the injection logic in the calling skill, creating a new obligation on every skill that dispatches agents to correctly inject the canonical text. If a new skill dispatches a reviewer without the injection, it silently breaks the discipline. The generator avoids this by making the instruction self-contained in the agent file."

- **Innovator** — non-blocking concession: held DTI for Teams subagents through round two but explicitly did not block if the committee judges generator-everywhere-on-agents as the more important consistency call — blocking_risk: "If Teams and Task subagents are ruled structurally equivalent for this purpose (file-is-prompt in both, since TeamCreate takes a file path), then generator for both is the safe, consistent choice. It eliminates DTI's per-dispatch cost and gives self-contained files across both consumer kinds at the cost of a build step. Innovator holds DTI for Teams as the structurally cleaner option but does not block if the team judges the consistency argument for generator-everywhere-on-agents as more important than the dispatch-shape distinction."

- **Purist** — non-blocking concession: collapsed four-mechanism claim to generator for all stable-at-authoring agent content; retained DTI only for runtime-varying dispatch payloads already structural — blocking_risk: "DTI is simpler to implement than a generator — no build step, no generated files on disk. The case for DTI: 'stable-at-authoring' is an assumption; if canonical rules change frequently, generator-materialized files become stale between generator runs, and DTI would reflect the latest canonical text automatically. The generator-vs-DTI choice is only clearly right for the generator if there is a reliable trigger to regenerate agent files when canonical source files change. Without that trigger, generator-materialized files can drift from their source — replacing one drift mode with another."

---

## Deferred / Open

- **FD-05 (review-loop control flow)** — explicitly out of scope this verdict.
- **Round/turn flow structures** — distinct by design, not duplicated; excluded from scope.
- **Regeneration trigger implementation** — the mandatory enforcement mechanism (test / commit hook / CI check) must be designed and built concurrently with the generator; it is a prerequisite to landing the generator, not a follow-on.
- **Evidence-citation rule domain variants** — Purist flagged an open question: are the per-reviewer phrasing variants ("file paths, line numbers" vs "plan text, proposed class/method names") intentional scoping or drift? Verdict does not resolve this; the canonical `review-discipline` reference should settle it at authoring time.
- **Canonical home for PM Litmus Test and Research Boundary** — verdict assigns these to `util-design-partner-role`, but the specific section structure within that file is a downstream authoring decision.

---

*produced-by: scribe / round01 / 2026-06-07*

<!-- created-at: 2026-06-07T11:12:09Z -->
<!-- produced-by design-committee@v0018 -->
