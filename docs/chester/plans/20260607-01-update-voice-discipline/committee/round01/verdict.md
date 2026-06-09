# Verdict — canonical instruction-injection architecture — round01

**Decision:** Chester adopts a **mixed, binding-time-explicit architecture** for shared instruction text, selected per consumer kind by the litmus *strength of agent direction (no mid-session drift)*:

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

<!-- created-at: 2026-06-07T11:12:09Z -->
<!-- produced-by design-committee@v0018 -->
