# Purist — transcript (verbatim, abridged) — round01
# Stance: Four distinct instruction-text categories demand distinct mechanisms; collapsing them is the failure mode

---

## Position

### The Central Boundary Failure

Design brief frames all five surfaces as one category: "shared instruction text." That framing is the problem. Before any mechanism can be sound, the categories must separate. Researcher's data reveals four structurally distinct kinds — each with a different identity claim, a different composition rule, and therefore a different mechanism demand. Collapsing them into one mechanism means one mechanism must make incompatible promises simultaneously. That is a category boundary violation, and category boundary violations are where drift is *produced*, not just observed.

### Four Categories

**Category A — Canonical Rule: one true wording, no per-instance variation.**

Examples: PM Litmus Test, Research Boundary, version-bump carve-out, Translation Gate enforcement clauses, evidence-citation rule, confidence ladder thresholds.

Identity claim: exactly one correct phrasing exists. Any copy that diverges from it is wrong by definition, not "a variant." The researcher confirmed PM Litmus has 0 canonical copies and 2 drifted inline copies — wording already differs ("success metrics" vs "success measurement"). That drift is not tolerable for a canonical rule.

Mechanism implication: single canonical source file; all consumers cite it. No inline restatement. The citation *is* the rule — removing the inline copy makes the canonical copy the only copy, which is correct for this category.

**Category B — Parameterized Template: shared scaffold + per-instance variation that is intentional and load-bearing.**

Examples: committee member files (shared Phase Contract, Hard Prohibitions, Output Format scaffold; per-lens preamble, C1/C2 examples, Stance Principle lens-adjustments). Confidence ladder band labels (identical thresholds; per-role label language). Independence rule (strong form vs weak form per reviewer — not drift, intentional scoping).

Identity claim: the scaffold has one correct wording; the per-instance slots carry intentional variation. The per-instance content is NOT a drift artifact — it is the point. Pragmatist's C2 bullet ("Cost estimates without measurement = Assumption:") is not a copy-that-drifted; it is a lens-specific override that must differ.

Mechanism implication: separate the scaffold from the per-instance slots before choosing delivery. The scaffold can be single-sourced; the per-instance content cannot be merged without destroying the lens. A build-time generator that assembles scaffold + lens block is the correct shape here — it is NOT "accept-inline." Inline restatement of the scaffold is wrong; inline lens content is correct.

**Category C — Derived Index: content that should be generated from another source, not authored independently.**

Examples: skill-index.md catalog entries. The skill's description exists canonically in frontmatter; the index *derives* from it. FD-03 confirmed: design-small-task's index entry directly contradicts its frontmatter. That contradiction is structurally inevitable when the index is hand-authored as a parallel copy.

Identity claim: the index has no independent authoring authority. Its entries are projections of frontmatter. Any index entry that is not generated is a category boundary violation — it claims authoring authority it structurally should not have.

Mechanism implication: build-time generator only. No runtime-read, no accept-inline. The generator is the sole mechanism; it runs when frontmatter changes and writes the index. Hand-maintaining the index alongside frontmatter is the wrong shape regardless of tooling.

**Category D — Session-Scoped Style Overlay: instruction that applies for one session's duration, not baked into any file.**

Examples: `CHESTER_INFO_PACKET_STYLE` env overlay, verbosity overrides, the directive protocol already confirmed structural in the brief.

Identity claim: these are not "shared instruction text" in the same sense as the other three. They are runtime configuration, not canonical rules or templates. They are ephemeral by design.

Mechanism implication: env overlay + directive protocol already deliver this. No file-based mechanism needed or appropriate. This category is already correctly handled; it should be named and excluded from the mechanism decision for the other three.

### Consumer-Kind Mapping

With four categories established, the per-consumer-kind question becomes tractable:

**Category A (Canonical Rule) per consumer kind:**

- Inline skill (`design-small-task`): runtime-read. Instruction in SKILL.md: "Before acting, read `skills/util-design-partner-role/SKILL.md` § [rule name]." The proven `util-design-partner-role` pattern. WORKS — CWD is repo root in dev; production failure for repo-root-relative paths is the production runtime-read problem (see below).
- Runtime-read skill (`plan-attack`, `plan-smell`, `util-codereview`, `team-lead`): runtime-read. Same proven pattern. No change needed for mechanism; the path discipline problem is the issue.
- Teams subagent (committee members): this is where Category A and Category B intersect and the mechanism choice diverges. For Category A canonical rules cited BY Teams subagents — the Stance Principles reference in member agents (`Apply canonical Stance Principles from skills/util-design-partner-role/SKILL.md`) — this is a prose citation, not an executed read instruction. Researcher confirmed: repo-root-relative paths work in dev from CWD=repo-root; fail in production where CWD=user's project. This means for production-deployed Teams subagents, runtime-read of Category A content via repo-root-relative path is BROKEN. Only dispatch-time injection (team-lead injects canonical rule text into the dispatch message) or build-time materialization (rule text baked into agent file) is reliable across dev+production.
- Named Task subagent (reviewer agents): same production-broken runtime-read problem. Dispatch-time injection or build-time materialization required for production reliability.
- CLAUDE.md: two-tier pattern (one-line pointer to canonical) is already correct for CLAUDE.md. Root CLAUDE.md = canonical; `skills/CLAUDE.md` points up. FD-04's proposed fix is the right shape.

**Category B (Parameterized Template) per consumer kind:**

- Teams subagents (committee members): build-time generator is the only honest mechanism. The file IS the prompt — the subagent has no pre-dispatch tool call to read a sibling. Researcher confirmed: sibling file reads work IF the instruction is the first action with a correct repo-root-relative path — but production breaks this for Chester's own files. Build-time materialization is safe across dev+production. Generator reads scaffold + lens block, writes the four member files. Each member file is self-contained at load time.
- Named Task subagent reviewers (for confidence ladder per-role labels, independence rule scoping): same argument. Build-time materialization.
- CLAUDE.md: not a parameterized template consumer. N/A.

**Category C (Derived Index) per consumer kind:**

- This is entirely a build-time generator concern. The "consumer" is `setup-start/references/skill-index.md` and downstream agents who read it. The generator writes it; all consumers read the generated output. No other mechanism is appropriate.
- The two CLAUDE.md phantom pointers are a separate fix: correct the pointer to name the real file (`skills/setup-start/references/skill-index.md`), clarify that the index is derived from frontmatter.

**Category D (Session-Scoped Overlay):** already handled. Excluded from mechanism decisions.

### The Production Runtime-Read Problem

Researcher finding T5 is the decisive constraint for production deployment: CWD in production = user's project, not Chester repo. Repo-root-relative paths like `skills/util-design-partner-role/SKILL.md` fail in production. The current advocacy-member agents contain:

```
Apply canonical Stance Principles from `skills/util-design-partner-role/SKILL.md`
```

This citation is a broken production path. It works in dev (CWD=Chester repo) only. For production, three options exist:

1. **Dispatch-time injection**: team-lead reads the canonical rule text and injects it into the dispatch message payload. Rule text arrives in agent context without a file read. Production-safe. Adds team-lead read burden each dispatch.
2. **Build-time materialization**: canonical rule text is written into the agent file at authoring time. Production-safe. Creates an accept-inline copy — but an *owned* copy, updated by a generator, not a hand-maintained duplicate. The generator makes it a Category B scaffold inclusion, not Category A violation.
3. **Absolute path discipline**: all file citations in agent prompts use absolute paths. Production-broken because absolute path includes the dev machine's home directory. Not viable for distributed plugin.

Option 2 — build-time materialization — is the correct shape. The Stance Principles content, currently "canonical" in `util-design-partner-role` but never actually read by the agents that cite it, should be materialized into the scaffold template at build time. The canonical source remains `util-design-partner-role`; the agent files carry generated copies. The generator is the seam — one adapter, production-safe.

### Disposition of Duplicated Rule Sets

- **PM Litmus Test, Research Boundary**: Category A. Extract to canonical section in `util-design-partner-role/SKILL.md`. Inline copies become citations or are removed (skills via runtime-read; agents via dispatch-time injection or materialization).
- **Stance Principles in 4 agent files**: straddles A+B. The base five principles are Category A (one canonical wording); the lens overrides are Category B per-lens slots. Generator: scaffold = base principles, lens block = lens-adjusted versions. The current "cite canonical AND restate" pattern is structurally ambiguous — it claims both authoritative pointer and authoritative text simultaneously. Pick one: either the restatement is the authoritative lens version (Category B scaffold) or the pointer is live (runtime-read). Cannot be both.
- **Translation Gate**: appears at four altitudes across multiple files. The full enforcement checklist is Category A — one canonical text. The per-member one-sentence inline bullet in the 4 agent files is the Voice Discipline band of the Category B scaffold. Generator materializes the scaffold (which includes the Translation Gate bullet). The full checklist lives once in `util-design-partner-role`; runtime-read for inline skills and team-lead; materialized into scaffold for agents.
- **Evidence-citation rule**: Category A. One canonical text. The per-skill phrasing variants ("file paths, line numbers, dependency chains" vs "plan text, proposed class/method names") look like drift but may be intentional domain scoping. Committee must decide: is there one canonical phrasing, or are the domain variants each correct for their reviewer? If one canonical: Category A, single source. If domain variants intentional: Category B parameterized by reviewer domain — scaffold = evidence-always-required principle, per-instance slot = domain vocabulary.
- **Confidence ladder**: Category B (thresholds = Category A; band label language = per-role, intentional). Template: threshold scaffold once; per-role label slot.
- **Independence rule**: Category B (strong form and weak form are intentional per-reviewer scoping, not drift). Not a single canonical rule — the scoping is load-bearing.
- **Skill catalog (FD-03)**: Category C. Generator only. Hand-maintained index eliminated.
- **CLAUDE.md version-bump rule and sync rule (FD-04)**: Category A. Root CLAUDE.md canonical; `skills/CLAUDE.md` one-line pointer. Standard two-tier pattern.

### Mechanism Name Summary (structural names)

- **Single-source runtime-read (SSRR)**: one canonical file; consumer issues read-as-first-action. Works for inline skills and runtime-read skills in dev; fails for agents in production.
- **Build-time scaffold materializer (BTSM)**: generator reads canonical scaffold + per-instance lens block; writes agent files. Production-safe. Applicable to Categories A (materialized) and B.
- **Dispatch-time injection (DTI)**: team-lead reads canonical text and includes it in dispatch message. Production-safe. Adds per-dispatch overhead. Fallback when BTSM adds too much generator complexity.
- **Derived generator (DG)**: for Category C only. Reads frontmatter; writes index. No other mechanism applies.
- **Env overlay (EO)**: for Category D only. Already structural. No change.

### Summary

The design brief's "one mechanism" question is a false frame. Four categories, four mechanism families. The failure mode is assigning one mechanism to all four — that mechanism must simultaneously be a single-source reader, a parameterized assembler, a derived generator, and a runtime overlay. No mechanism can make all four promises. The architecture should name the categories, assign the matching mechanism per category, and resist the DRY impulse that would collapse them.

---

## Follow-ups

### R2 — Does the category boundary pick DTI vs generator?

The alignment map poses this cleanly: does "parameterized template" demand a generator over DTI, or are generator and DTI just build-time vs dispatch-time bindings of the same template — mechanism-neutral within the category?

**Honest answer: the category is mechanism-neutral on binding time. But it is NOT neutral on WHERE the per-lens parameters live.**

Here is the structural argument that picks generator over DTI for the parameterized template category — not because the category demands it abstractly, but because of what the template's per-instance slots contain:

The committee member scaffold's per-lens slots include: the lens preamble, the Software Architect Persona lens adjustments, and the C1/C2 worked examples. These are authored once per lens and do not vary at dispatch time — Purist's lens is always Purist's lens. The dispatch caller does not know anything about the lens at dispatch that wasn't already known when the lens files were authored.

This means DTI for parameterized templates gives no benefit over a generator. DTI's advantage is that the canonical text is read fresh at dispatch, reflecting any recent edits. But the lens slots do not change between dispatches — they are stable-authored content. So DTI's per-dispatch read overhead is paid for zero freshness benefit on the per-lens content, and the scaffold content is identical whether read at dispatch or materialized at build.

The generator wins for parameterized templates on this specific ground: DTI's cost (recurring per-dispatch token overhead + caller complexity) buys nothing for content that is stable across dispatches. That is not a category-level rule — it is a property of this particular parameterized template where the per-instance slots are stable-authored, not computed at runtime.

**For Canonical Rule content baked into agent files (Category A in agents):** same logic applies. PM Litmus text is stable. Reading it fresh at each dispatch is overhead with no freshness payoff — the canonical text does not change between dispatches. Generator materializes it once; DTI reads it on every dispatch.

**Where DTI would win over generator:** if the per-instance slot content were computed at dispatch time from runtime state — e.g., if the committee question itself needed to be woven into the agent's instruction at dispatch. That IS already happening via `SendMessage` dispatch payload (the question lands in the message, not in the agent file). That is already DTI and it is correct for runtime-varying content. DTI and generator are complements, not rivals, when the content is separated properly: stable content → generator; runtime-varying content → DTI via dispatch payload.

**The category boundary that actually matters:** not "canonical rule vs parameterized template" for picking DTI vs generator. Instead: **stable-at-authoring content** (→ generator materializes into agent file) vs **runtime-varying content** (→ DTI/dispatch payload). Categories A and B both contain stable-at-authoring content for their agent consumers. Both go to generator. Category C (derived index) is also stable-at-authoring content generated from frontmatter. The session-scoped overlay (Category D) is runtime-varying → env overlay, already handled.

**Concession on four-mechanism claim:** the alignment map is right to push back. My four-category framing carries four mechanism names, but two of those mechanisms (BTSM for Category B, DG for Category C) are both build-time generators — they differ only in what inputs they process. They can share a mechanism label: "build-time generator." The practical architecture for agent-side content is: one canonical source per instruction type + one build-time generator that assembles agent files from scaffold, lens blocks, and canonical rule text. DTI handles runtime-varying content (the dispatch question and context) — already present and correct. No new mechanism needed for DTI.

**Revised mechanism count for agent-side:** two, not four. (1) Build-time generator (for all stable-at-authoring agent content — scaffold, lens blocks, canonical rules). (2) Dispatch-time payload (for runtime-varying content — already structural). The four-category framing was right as a data classification but wrong to imply four distinct mechanisms. Categories A and B share the generator; Category C shares the generator with a different input; Category D uses dispatch payload. The generator IS the unifying mechanism for agent-side stable content.

### Peer DMs (R2)

**Purist → Pragmatist:** Conceding on mechanism count. Four categories, but generator unifies A+B+C on agent side. DTI = runtime-varying content only (already happening). Two mechanisms for agents, not four. Does Pragmatist's cost-per-dispatch objection to DTI hold if DTI is scoped only to the dispatch question/context (which it already handles), not the stable scaffold content?

---

## Final Position

position: "Build-time generator for all stable-at-authoring agent content (canonical rules + scaffold + lens blocks = Categories A, B, C on agent side); dispatch payload (DTI) for runtime-varying content already structural. Two mechanisms for agents, not four. Four-category framing is a data classification, not a mechanism count — categories A and B share the generator. Parent-session skills = runtime-read (settled). CLAUDE.md = two-tier pointer (settled)."

rationale: "The R2 crux: does 'parameterized template' pick generator over DTI as a category-level rule? No — the category is mechanism-neutral on binding time. The picking criterion is whether per-instance slot content is stable-at-authoring or computed at runtime. Committee member lens slots (preamble, persona adjustments, C1/C2 examples) are stable-authored; they do not vary between dispatches. DTI's cost (recurring per-dispatch token overhead, caller complexity) buys zero freshness benefit for stable content. Generator materializes once; DTI reads on every dispatch for identical output. The generator wins on cost shape alone, not on a category-level rule. Canonical rule content (PM Litmus, Translation Gate clauses) is also stable-at-authoring — same logic picks generator over DTI for Category A in agents. DTI is already correctly used for runtime-varying content (the dispatch question and context packets via SendMessage payload) and should stay there. The four-category framing was right to separate instruction-text kinds; wrong to imply four distinct mechanisms. Generator unifies A+B+C on agent side."

blocking_risk: "DTI is simpler to implement than a generator — no build step, no generated files on disk. The case for DTI: 'stable-at-authoring' is an assumption; if canonical rules change frequently, generator-materialized files become stale between generator runs, and DTI would reflect the latest canonical text automatically. The generator-vs-DTI choice is only clearly right for the generator if there is a reliable trigger to regenerate agent files when canonical source files change. Without that trigger, generator-materialized files can drift from their source — replacing one drift mode with another."
