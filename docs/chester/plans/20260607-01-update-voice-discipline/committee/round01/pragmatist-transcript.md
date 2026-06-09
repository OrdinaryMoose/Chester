# Pragmatist — transcript (verbatim, abridged) — round01
# Stance: cheapest sufficient mechanism per consumer kind; op cost is a first-class constraint

## Position

### Framing the cost ledger first

The question is not "most elegant architecture" — it is "which mechanism, per consumer kind, delivers the litmus (no agent drift) at lowest total op cost." Before proposing anything, I need explicit cost estimates per option across the five consumer kinds. I'll then select per kind.

**Option cost table (my estimates):**

- Runtime-read: zero authoring cost, one extra tool round-trip per dispatch, FAILS in production (decisive researcher finding). Not viable as-designed for any agent consumer in production. Works only for skills (inline skills and runtime-read skills) that run in the Chester dev session context — in those contexts the CWD is the Chester repo root and relative paths resolve correctly.
- Build-time generator: one-time generator script (~1-2 hours authoring), zero per-dispatch cost, full production parity, adds build step + discipline to run it on every edit. Maintenance cost is front-loaded, not per-dispatch. Strong direction because the text is baked in.
- Dispatch-time injection: team-lead reads the reference and pastes its text into the dispatch payload. Costs a read + tokens per every single dispatch of every member, every round. With 4 members × N rounds × M committee sessions across Chester's lifetime, this is the highest lifetime token cost of any option. No generator or build step needed, but the team-lead's dispatch logic gets more complex (it now has to manage payload construction).
- Accept-inline: zero tooling cost, strongest direction (text is in the prompt at load), manual sync required, drift already observed. Works until first edit that misses a copy.
- Env overlay: the `CHESTER_INFO_PACKET_STYLE` mechanism already exists and delivers session-scoped style. Does not cover structural rules (Hard Prohibitions, confidence ladder, independence rule) that must be per-consumer, not per-session. Cannot substitute for the per-consumer mechanisms; complements them.

### Per consumer kind — cheapest sufficient mechanism

**Inline skill** (`design-small-task`) — runtime in Chester dev session; CWD = Chester repo root; runtime-read works here. The skill is a long-lived conversation. Voice rules and PM Litmus belong in-context throughout the session; a reference that is read once at skill start and stays in context is sufficient. **Mechanism: runtime-read.** Cost: one extra read at invocation, zero sync labor. Note: this is the existing `util-design-partner-role` pattern — it already works. No change needed.

**Runtime-read skill** (`plan-attack`, `plan-smell`, `util-codereview`, team-lead) — also Chester dev session; CWD = repo root; runtime-read works. Reviewer disciplines (evidence-citation rule) belong in a single reference; each skill cites it at runtime. **Mechanism: runtime-read for skill-level consumers.** Cost: one read per invocation; already proven. For FD-01's evidence-citation rule, a single `skills/util-codereview/references/review-discipline.md` (or equivalent shared location) read by each skill is cheap and sufficient.

**Teams subagent** (4 committee advocacy members) — researcher finding is decisive: CWD = Chester repo root in dev mode; FAILS in production (CWD = user's project root). This is the crux. For the committee advocacy members specifically: Chester committee sessions only run in dev mode (Chester is being developed; the committee deliberates on Chester's own design). Opinion: treating committee session production-parity as a hard requirement is over-engineering. The committee skill is an internal Chester design tool, not a consumer-facing skill. Assumption: committee sessions will always run in dev mode against the Chester repo. If that assumption holds, runtime-read with repo-root-relative paths works for committee members, at zero build-step cost.

However, the ~70% shared scaffold (Hard Prohibitions, Output Format) is still a sync problem — even with runtime-read, the per-lens lens blocks still need to be distinct files. The correct split is: extract the scaffold to a shared reference that each member reads as first action; each member file becomes its lens block (preamble + C1/C2 example + lens overrides + a "read `skills/design-committee/references/committee-member-template.md` first" instruction). **Mechanism for committee members: runtime-read (dev-mode assumption explicit).** Cost: one read per dispatch; no build step; scaffold edits hit one file.

**Named Task subagent** (plan-build-plan-attacker, execute-write-spec-reviewer, execute-write-quality-reviewer, plan-build-plan-reviewer) — these ARE production consumers. Users invoke plan-build and execute-write against their own projects. CWD = user's project root in production. Runtime-read with Chester repo paths fails. **Options:**
  1. Build-time generator: one script, run it when editing the canonical reference, regenerates agent files. One build step, zero per-dispatch cost, full production parity. The generator is ONE adapter — close to the FD-02 "one adapter = hypothetical seam, two = real seam" rule, but here it is the only honest path to production parity.
  2. Dispatch-time injection: team-lead (or the invoking skill) injects the text at dispatch. Viable but token-costly at every invocation, and adds complexity to the dispatch path.
  3. Accept-inline: continue as-is. Cheapest now; acknowledged drift. Evidence-citation wording has already drifted across 7 files. Reviewer disciplines have high leverage (they gate finding quality); accepting inline here means accepting continued drift on a load-bearing rule.

My call: **build-time generator for named Task subagents, scoped narrowly.** The generator only needs to emit the canonical shared bands into the agent files. The per-consumer lens/domain content stays per-file, hand-authored. Run the generator when editing the canonical source. Cost: ~2-hour one-time authoring, one discipline to remember, zero per-dispatch cost.

**CLAUDE.md consumers** — not dispatched agents; they are auto-loaded context. FD-04's proposed change (root CLAUDE.md canonical; skills/CLAUDE.md points up) is the correct pattern: it is a pointer, not a runtime-read, not a generated file. Cost: one edit, pointer-and-summary pattern already exists for the artifact tree. **Mechanism: pointer + one canonical source.** Accept this immediately.

### Disposition of each duplicated rule set

- **PM Litmus Test and Research Boundary** — 0 canonical copies, 2 inline. These belong in `util-design-partner-role`. Write them there; both consuming files (design-small-task and team-lead.md) are runtime-read consumers (dev mode) and can replace inline copies with a "read util-design-partner-role" citation. **Cost of dedup: low, one-time write.** Worth it.
- **Stance Principles** — 1 canonical + 4 lens-adjusted copies. The lens adjustments are intentional (they are not drift; they carry per-lens overrides). Do NOT merge into a single canonical text. Accept the 4 per-lens copies as correct design. The citation of the canonical source is already present in the agent files. **No change needed.** Dedup cost exceeds benefit because the "duplication" is intentional variation.
- **Translation Gate** — 4 agent inline restatements + 2 full section bodies. The agent-inline bullets are in the shared scaffold band (Voice Discipline band, ~lines 51-62). Extract the Voice Discipline band into the scaffold template (the committee-member-template.md referenced above); agent files no longer carry their own Translation Gate bullets. The two full section bodies (design-small-task, team-lead.md) can stay — they serve their respective consumers directly and are not duplicated across more than two consumers.
- **Evidence-citation rule, confidence ladder, independence rule** (FD-01) — canonical reference, skills cite it at runtime, named Task subagent files get the canonical text via generator. Worth the dedup; these rules gate review quality and are already drifted.
- **Committee member scaffold** (FD-02) — scaffold template extracted; committee members runtime-read it (dev-mode assumption). ~30 lines of scaffold in one file vs ~70 lines repeated × 4. Worth it.
- **Skill catalog** (FD-03) — pointer-only index or generator from frontmatter. The generator path is the clean call: frontmatter is single source, index is derived, descriptions can never diverge, missing skills surface automatically. Worth it; the generator is ~30 lines of bash. **However**, this is a different generator from the reviewer-disciplines generator — do not conflate them.
- **CLAUDE.md rules** (FD-04) — pointer pattern; one edit. Worth it; cost is negligible.

### Synthesis: mechanism map

| Consumer kind | Mechanism | Rationale |
|---|---|---|
| Inline skill | Runtime-read | Dev-only; proven pattern; no change needed |
| Runtime-read skill | Runtime-read | Dev-only; proven pattern; no change needed |
| Teams subagent (committee) | Runtime-read (dev-mode explicit assumption) | Committee is internal Chester tool; always dev mode; no build step needed |
| Named Task subagent (reviewer agents) | Build-time generator for shared bands | Production consumers; runtime-read fails; generator is only viable low-cost path |
| CLAUDE.md | Pointer + canonical source | Not an agent; auto-loaded; pointer pattern already proven |

### Rule set dedups worth it vs not

**Worth it:**
- PM Litmus + Research Boundary → canonical in util-design-partner-role; runtime-read consumers replace inline.
- Evidence-citation + confidence ladder + independence → canonical reference; skills runtime-read; reviewer agent files regenerated.
- Committee member scaffold → extracted template; members runtime-read (dev-mode).
- CLAUDE.md rules → pointer to root CLAUDE.md.
- Skill catalog → generator from frontmatter.

**Not worth it:**
- Stance Principles per-lens copies — intentional variation, not drift. Accept 4 files.
- Translation Gate full section bodies in design-small-task + team-lead.md — two consumers, not seven; the two bodies serve their consumers directly; extracting to a third location adds a lookup without reducing real maintenance surface.

## Follow-ups

### R2 — Revised position after alignment map

**Dev-mode assumption for committee Teams subagents: conceded.** The alignment map makes explicit that runtime-read for agents is conceded-broken in production, and the committee member agents are still agent-kind consumers. My R1 position held the dev-mode assumption as load-bearing and acknowledged it as a blocking risk in the same breath — which is an unstable position. If the assumption is wrong or Chester ever ships committee as a non-dev tool, the mechanism silently breaks. I'm folding: committee Teams subagents join named Task subagents under build-time generator. The dev-mode carve-out was convenient, not principled.

**DTI vs generator — crossover quantification:**

DTI recurring cost per dispatch: roughly ~500 tokens of shared scaffold text injected into the SendMessage payload, per member, per round. Four members × 2 rounds typical = 8 dispatches per committee session. At Chester's usage volume (one developer, design sessions perhaps 2-3 per sprint, several sprints per year): maybe 50-100 committee sessions over the tool's useful lifetime. DTI token overhead = 8 dispatches × 500 tokens × 100 sessions = 400,000 tokens total. At Claude API pricing that is roughly $1-2 of token cost for the entire lifetime — not a material cost.

Revised lever: DTI's real cost is NOT tokens. It is **dispatch-path complexity**. The team-lead's SendMessage dispatch must now (a) read the canonical reference, (b) compose it into the payload, (c) maintain that read-and-inject step in sync with the reference location. The team-lead dispatch logic is already the most complex piece of the committee skill; adding a "fetch and bake" step to every dispatch round raises the cognitive load and the failure surface on the caller side, not the agent side.

Generator's real cost comparison: ~2 hours one-time authoring, one discipline (run the generator before committing edits to the canonical source), and generated agent files that can drift from source if the discipline isn't followed. The drift risk from an un-run generator is real but is **detectable**: `git diff` between the canonical source and the generated files shows it immediately. DTI drift risk is a runtime failure (wrong text baked at dispatch time because caller logic got stale) — harder to detect.

**Generator wins on cost shape for both agent kinds:** one-time build cost, zero per-dispatch cost, detectable drift, agent files stay self-contained. The caller (team-lead, invoking skill) doesn't need to read-and-inject anything at dispatch time; it just dispatches. Both Teams subagents (committee members) and named Task subagents (reviewer agents) get the same mechanism — unified, not split.

**Unified agent-side architecture:**
- One canonical source per shared band (committee member scaffold in `skills/design-committee/references/committee-member-template.md`; reviewer disciplines in `skills/util-codereview/references/review-discipline.md` or equivalent).
- Generator script produces the full agent files: shared bands from canonical source + per-lens content from per-lens source blocks.
- Agent files are generated outputs — committed to disk — self-contained at load. No runtime reads, no dispatch injection.
- Generator runs as a dev discipline: edit canonical → run generator → commit both. Not a CI gate (too heavy); a conventional rule like the two-place sync rule already in CLAUDE.md.

**What this costs vs DTI:** the generator is a build step; DTI is dispatch complexity. The generator's cost is front-loaded and visible. DTI's complexity is per-dispatch and buried in the team-lead's invocation logic. Pragmatist prefers front-loaded, visible, finite cost over per-dispatch invisible cost.

### Peer-DMs (R2)

**[pragmatist]→[conservator]: conceded dev-mode assumption — generator for committee members too. cost shape: one-time build vs per-dispatch injection complexity. generator wins.**

**[pragmatist]→[innovator]: DTI token cost = not material (~$1-2 lifetime). real DTI cost = dispatch-path complexity on team-lead side. generator avoids that. agree?**

## Final Position

position: "Build-time generator for all agent-side consumers (Teams subagents + named Task subagents); runtime-read for parent-session skills; two-tier pointer for CLAUDE.md."

rationale: DTI's real cost is dispatch-path complexity on the team-lead caller, not token volume — token overhead across the tool's lifetime is ~$1-2, which is not material, but the read-and-inject step adds failure surface to the most complex part of the committee skill. The generator's cost is one-time authoring (~2 hours) plus a run-discipline (edit canonical → run generator → commit), and its drift is detectable via git diff, whereas DTI drift is a runtime silent failure. Both agent kinds (committee Teams subagents and reviewer named Task subagents) share the same production constraint (runtime-read fails when CWD is user's project root) and the same fix (baked text). One mechanism for both is cheaper than two. Settled kinds stay settled: parent-session skills use runtime-read (CWD stable, no production issue); CLAUDE.md uses two-tier pointer.

blocking_risk: "Generator drift risk is real if the run-discipline slips — edits to the canonical source land on disk without regenerating agent files. Requires a conventional enforcement rule (e.g., in CLAUDE.md or a commit hook). Absent that rule, generator drift is as likely as the inline drift it replaces."
