# Conservator — transcript (verbatim, abridged) — round01
# Stance: Extend the proven citation seam; do not replace working patterns with new infrastructure

## Position

### Framing: What already works

The repo has three functioning delivery patterns. Before reaching for a new mechanism, account for what these already accomplish and what it would cost to disturb them.

**Pattern 1: The `util-design-partner-role` citation seam.**
Runtime-read, proven at scale. `design-small-task` and `team-lead.md` both open with a load-bearing instruction to read `skills/util-design-partner-role/SKILL.md` before acting. The voice rules live in one file; the consumers cite it. This is not hypothetical — it runs in production in dev mode today, and the researcher confirmed that repo-root-relative paths resolve correctly from `CWD = /home/mike/Documents/CodeProjects/Chester`.

The production-fragility warning is real but narrow. In marketplace-installed production (where CWD = user's project), repo-root-relative paths fail. But this is not a new risk introduced by extending the citation seam — the current `skills/util-design-partner-role/SKILL.md` reference in `team-lead.md:28` is already broken in that same production context. The pattern exists and is already production-fragile. If we are going to fix it, we fix the path discipline once; we do not abandon the pattern entirely.

**Pattern 2: `CHESTER_INFO_PACKET_STYLE` env overlay.**
A session-scoped style directive is delivered via environment variable, not inline text, not runtime read. This is the correct pattern for session-scoped behavioral overlays. It already handles style/verbosity injection without requiring instruction text to be inline. This pattern should be defended and potentially extended, not replaced.

**Pattern 3: The two-tier summary+pointer (`CLAUDE.md` for artifact tree).**
Root `CLAUDE.md` carries a summary plus "See `util-artifact-schema/SKILL.md` for the full reference." This is explicitly called out in FD-04 as "already correct — do not touch." Extend this pattern to CLAUDE.md rule deduplication before inventing a new one.

---

### Per-consumer-kind delivery: Conservator proposal

**Consumer 1: Runtime-read skills** (`plan-attack`, `plan-smell`, `util-codereview`, `design-small-task`, `design-committee` via team-lead)

Mechanism: **runtime-read (extend existing citation seam).**

The `util-design-partner-role` pattern already proves the mechanism. Extending it to a `review-discipline.md` reference (FD-01) follows the same seam. The friction argument is valid — seven-file drift is observable — but the solution is one canonical source cited by all seven consumers via the pattern that already works, not a new delivery mechanism.

Cost of disturbance: nil. Same instruction to "read X before acting." No new mechanism.

**Consumer 2: Named subagents (reviewer agents: plan-build-plan-attacker, plan-build-plan-smeller, execute-write-spec-reviewer, execute-write-quality-reviewer)**

These are the hard case. They are dispatched as their `.md` file; the file is their system prompt. Two honest options from FD-01/FD-02:

- Read-as-first-action: costs one read round-trip per dispatch; depends on path resolution. In dev mode: works (researcher confirmed). In production: fragile for the same path-discipline reason that makes all repo-root-relative citations fragile.
- Build-time generator: one source, materialize into each file. No runtime dependency on path resolution. One adapter.

Conservator position: **accept read-as-first-action for dev mode, with repo-root-relative paths, accepting the same production-fragility the citation seam already carries.** Do not reach for a build-time generator unless that fragility is separately budgeted as a fix target. The generator adds a build step, a generator script, and a new conceptual layer. That cost is not zero.

The "two adapters = real seam, one = hypothetical" rule FD-02 cites is a useful heuristic, but it is a heuristic, not a constraint. One adapter (the generator) that keeps four files consistent is better than the current state of no source at all. The Conservator position is: do not let a heuristic block the smaller disturbance.

**Consumer 3: Teams subagents (committee advocacy members)**

Currently the four member files carry ~70% shared scaffold inline, with lens-specific overrides. The researcher confirmed these subagents have the same CWD = repo root in dev mode. Read-as-first-action works in dev.

Conservator position: **extend read-as-first-action to the shared scaffold (Hard Prohibitions + Phase Contract + Output Format), keeping per-lens blocks inline.** This is the minimal disturbance: the invariant bands move to one file; the lens-specific bands stay per-file. Total line reduction: significant. New mechanism cost: zero beyond the path-discipline fix already needed for production.

Do NOT extract the C1/C2 worked examples — those are intentionally lens-specific. FD-02 correctly calls this out. Do not over-extract.

**Consumer 4: CLAUDE.md rules**

Mechanism: **two-tier summary+pointer (already proven).**

Root `CLAUDE.md` is canonical for repo-wide rules. `skills/CLAUDE.md` replaces the rule bodies with one-line pointers. This is the exact pattern FD-04 recommends and the exact pattern FD-04 says is "already correct" for the artifact tree. No new mechanism needed.

**Consumer 5: Skill catalog (FD-03)**

The phantom pointer and live drift are real problems. The Conservator position on mechanism: **pointer-only index, not generator.** Make frontmatter the single source; reduce `skill-index.md` to grouping, priority order, and `name`-pointers only — no re-descriptions. Add the three missing skills by hand. Fix the phantom pointer in both CLAUDE.md files.

A generator is a build step with ongoing maintenance cost. The pointer-only approach achieves single-source at zero new mechanism cost. If descriptions in the index are ever needed for something the Skill-tool registry cannot supply, add them then.

---

### Disposition summary

| Duplicated rule set | Conservator mechanism | Rationale |
|---|---|---|
| Voice rules (PM Litmus, Research Boundary, Translation Gate, Stance Principles) | Extend citation seam — runtime-read by inline skills; read-as-first-action by named/Teams subagents | Proven pattern; no new mechanism |
| Reviewer disciplines (evidence-citation, confidence ladder, independence) | New `review-discipline.md` behind citation seam — runtime-read for skills, read-as-first-action for reviewer agents | Direct extension of existing pattern |
| Committee member scaffold | Extract invariant bands (Hard Prohibitions, Phase Contract, Output Format) to template; read-as-first-action; keep lens blocks per-file | Minimal disturbance; C1/C2 examples stay per-lens |
| Skill catalog | Pointer-only index; fix phantom pointer; add 3 missing skills | Two-tier pattern already proven; no generator needed |
| CLAUDE.md rules | Two-tier summary+pointer; root CLAUDE.md canonical | Proven pattern; FD-04 explicitly calls this correct |

---

### What the Conservator watches for

**Scope creep in the build-time generator option.** A generator that materializes canonical text into each prompt is DRY in source but creates a new build step, a generator script, a test harness for the generator, and an ongoing synchronization discipline (regenerate before deploy). The current drift problem is real, but the generator's overhead should be costed honestly, not waved away because "one source" sounds clean.

**Production-fragility of runtime-read.** The researcher finding that runtime-read fails in production (CWD = user's project) is a real cost. But it is a cost that exists in the current codebase already. The correct fix is: (a) standardize all citation paths to use absolute plugin-directory-relative paths, or (b) inject the path at dispatch time from the skill. Either fix applies uniformly across all citation seams and does not require abandoning the pattern.

**Over-extraction.** The lens-specific bands of the committee member files (C1/C2 examples, lens preamble) are not accidental duplication — they are intentional per-lens customization. Any template that attempts to merge them will destroy the intentional variation. Keep per-lens bands per-file.

---

## Follow-ups

**R2 revision — concession on agent-side delivery.**

The alignment map is correct that my R1 "fix the path discipline" concession collapses toward DTI or absolute-path injection. Accepting that runtime-read-for-agents is production-broken in its current form, I now state the Conservator's agent-side position explicitly.

**Between DTI and generator, the Conservator lands on DTI.**

Reason: DTI preserves the existing authoring model. Agent files remain hand-authored documents — lens preamble, phase contract, prohibitions, worked examples, all directly editable by a human without any tooling. The generator converts them into generated outputs: files that must not be hand-edited, that require regeneration after any canonical change, and that introduce a new artifact class (generated files) into a codebase that currently has none. The generator's "one source" cleanliness is real, but the cost is the loss of hand-authoring for the full agent files.

DTI cost is per-dispatch token overhead — the parent skill reads canonical text and bakes it into the `SendMessage` payload. That cost is paid each time a committee member or reviewer is dispatched, which is bounded by the frequency of committee/review use. The overhead is measurable and predictable. The generator's cost (build step, script maintenance, regeneration discipline) is ongoing and opaque.

**What DTI looks like in practice:**
- Canonical `committee-member-template.md` holds invariant bands (Hard Prohibitions, Phase Contract, Output Format).
- Canonical `review-discipline.md` holds evidence-citation, confidence ladder, independence rules.
- Parent skill (design-committee SKILL.md or the dispatching executor) reads these files at dispatch time, builds the `SendMessage` payload as: `[canonical template text] + [per-lens block from member file]`.
- Agent files shrink to lens-only (preamble + C1/C2 example) — hand-authored, ~30 lines each. No generated files.

This is structurally what the alignment map describes as option 2 (DTI). It satisfies the no-drift litmus (instruction is in prompt at load, not deferred to a runtime read the agent must perform). It avoids the generator. It keeps the file authoring model unchanged.

**On the skill catalog (FD-03):** The alignment map shows 3-1 lean toward generator. I hold the pointer-only position. The catalog's description text does not need to be in both frontmatter and index; remove it from the index entirely. The generator is overhead for a problem solvable by deletion. But I acknowledge the 3-1 lean — this is the Conservator's weakest position this round.

---

## Final Position

position: DTI for agent-side consumers (Teams + named Task subagents); runtime-read citation seam for parent-session skills; two-tier summary+pointer for CLAUDE.md; pointer-only index (no generator) for catalog.

rationale: Given that runtime-read-for-agents is production-broken (researcher proved; conceded), the two remaining agent-side options are DTI and build-time generator. DTI preserves the existing hand-authored nature of agent files — they shrink to lens-only blocks, remain directly editable, and carry no generated-output status. The generator converts agent files into generated artifacts requiring regeneration discipline and a build step. The smallest disturbance is the one that preserves the existing authoring model; DTI does that. Per-dispatch token cost is measurable and bounded by dispatch frequency; build-step cost is ongoing. Parent-session skills (stable CWD, no path fragility) stay on runtime-read, which is already proven and settled 4-0.

blocking_risk: DTI's per-dispatch token overhead grows with canonical text size. If the shared scaffold for committee members is large (currently ~70 of 103 lines), DTI bakes substantial text into every dispatch. At high dispatch frequency, the cumulative cost may favor the generator — but dispatch frequency for committee members is low (one committee per design question), making this a theoretical rather than observed pressure. The harder risk: DTI puts the injection logic in the calling skill, creating a new obligation on every skill that dispatches agents to correctly inject the canonical text. If a new skill dispatches a reviewer without the injection, it silently breaks the discipline. The generator avoids this by making the instruction self-contained in the agent file.
