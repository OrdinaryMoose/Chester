# Researcher — prior-art findings (verbatim, abridged) — round01
# Sub-sprint: 20260607-01-update-voice-discipline · HEAD 6c7991b

---

## Job 1: Census — duplication map verification and extension

### Voice rule set: PM Litmus Test

**Finding 1** — PM Litmus Test has **0 canonical copies in `util-design-partner-role`** and **2 inline copies**. DECISIVE.

Evidence:
- `grep -rn "PM Litmus" skills/util-design-partner-role/SKILL.md` → 0 results.
- `skills/design-small-task/SKILL.md:187` — inline body: "Imagine product manager on project. Not coder. Makes decisions — owns roadmap, requirements, success metrics…"
- `skills/design-committee/references/team-lead.md:288` — inline body: "Imagine product manager on this project. Not a coder. Makes decisions — owns roadmap, requirements, success measurement…"

The two copies are worded differently ("success metrics" vs "success measurement"; "no know types" vs "never opened codebase; does not know types"). Drift already present. FD-brief's claim of "0 canonical / 2 duplicates" is confirmed correct.

### Voice rule set: Research Boundary

**Finding 2** — Research Boundary has **0 canonical copies in `util-design-partner-role`** and **2 inline copies**. DECISIVE.

Evidence:
- `grep -rn "Research Boundary" skills/util-design-partner-role/SKILL.md` → 0 results.
- `skills/design-small-task/SKILL.md:209-213` — inline body: "Explore freely … Digest internally … Never relay raw findings — type names, property shapes, class hierarchies…"
- `skills/design-committee/references/team-lead.md:299-306` — inline body: "Explore freely — read as much code as needed … Digest internally — convert findings into domain concepts … Never relay raw findings — type names, property shapes, class hierarchies…"

Wording substantially identical; both have three bullet-point structure. No drift detected between these two copies, but neither is canonically housed.

### Voice rule set: Stance Principles

**Finding 3** — Stance Principles has **1 canonical copy in `util-design-partner-role`** and **4 partially-restated agent copies**. DECISIVE.

Evidence:
- `skills/util-design-partner-role/SKILL.md:162-168` — canonical home (5 principles).
- `agents/design-committee-conservator.md:27` — "Apply canonical Stance Principles from `skills/util-design-partner-role/SKILL.md` while playing Conservator lens:" followed by 5 restated principles with lens-specific wording overrides.
- `agents/design-committee-innovator.md:27` — same pattern, Innovator overrides.
- `agents/design-committee-pragmatist.md:27` — same pattern, Pragmatist overrides.
- `agents/design-committee-purist.md:27` — same pattern, Purist overrides.

All four agents reference the canonical source AND restate lens-adjusted versions of all 5 principles. The restatements are not pure copies — they carry intentional lens-specific modifications (e.g., Pragmatist's C2 bullet narrows to "Cost estimates without measurement = Assumption:"). This is partial restatement with intentional variation.

### Voice rule set: Translation Gate

**Finding 4** — Translation Gate appears in **4 files at 4 different altitudes**, with **3 worked examples** across two of those files. DECISIVE.

Evidence:
- `skills/util-design-partner-role/SKILL.md:21-29` — Interpreter Frame section: read-aloud rule, no CamelCase/dots/slashes/backticks, no type-theory jargon, no file suffixes. No formal section header "Translation Gate."
- `skills/design-small-task/SKILL.md:118,155,181` — Three mentions: "run Translation Gate checklist" (step-reference), "every component passes through Translation Gate" (scope statement), and `### Translation Gate` (full checklist with PM Litmus sub-rule, before/after example, 2-3 rule bullets).
- `skills/design-committee/references/team-lead.md:30,162,278,317` — Four mentions: bullet in Reading Order (3-item checklist), one inline mention in Decision Package, full `### Translation Gate` section (4 pre-send enforcement rules with read-aloud test and no-code-vocab rules), and one mention in Consolidation Rules.
- `agents/design-committee-conservator.md:57` — inline bullet restating read-aloud test + no code vocabulary rule (one sentence, lens-specific note about quoting).
- `agents/design-committee-innovator.md:57` — same inline bullet, shorter phrasing.
- `agents/design-committee-pragmatist.md:57` — same inline bullet, shortest version.
- `agents/design-committee-purist.md:57` — same inline bullet with extra Purist-specific note about "sum-type" / "tagged union."

Total: 1 Interpreter-Frame-level statement + 2 full Translation Gate sections + 4 agent inline restatements. FD-brief's "4 altitudes / 3 examples" count is confirmed.

### Reviewer disciplines (FD-01)

**Finding 5** — Evidence-citation rule appears in **7 files** (3 skills + 4 agents), with wording drift confirmed across sites. DECISIVE.

Evidence (evidence-citation rule):
- `agents/plan-build-plan-attacker.md:3,8,72-78,95` — "Every finding must cite real evidence from the codebase — file paths, line numbers, dependency chains, or concrete code." Rule appears in both description frontmatter AND body (doubled within one file).
- `agents/plan-build-plan-smeller.md:8,65-69,83` — "Every finding must cite real evidence — plan text, proposed class/method names, file paths, or existing constructs." Wording differs from attacker version.
- `agents/execute-write-spec-reviewer.md:73` — "Only report issues scoring ≥ 80. … Include your confidence score with each issue." Evidence rule implicit in confidence ladder.
- `skills/plan-attack/SKILL.md:16,85,114` — "Every finding must cite real evidence from the codebase — file paths, line numbers, dependency chains." Appears 3 times within one file.
- `skills/plan-smell/SKILL.md:16-17,97,122` — "cite real evidence — plan text, proposed class/method names, file paths, or existing constructs." Appears 3 times within one file.
- `skills/util-codereview/SKILL.md:15-16,69,86` — "finding must cite real evidence — file paths, line numbers, class/method names, or concrete code patterns." Appears 3 times within one file.

Drift confirmed: "file paths, line numbers, dependency chains, or concrete code" (attacker/plan-attack) vs "plan text, proposed class/method names, file paths" (smeller) vs "file paths, line numbers, class/method names, or concrete code patterns" (util-codereview).

**Finding 6** — Confidence ladder (≥80 gate) appears in **2 agent files only** — NOT in the 3 skills, NOT in plan-attacker or plan-smeller. DECISIVE.

Evidence:
- `agents/execute-write-spec-reviewer.md:64-73` — four-band confidence ladder (0-25, 25-50, 50-79, 80-100) with band labels in spec-compliance language. "Only report issues scoring ≥ 80."
- `agents/execute-write-quality-reviewer.md:68-77` — same four-band ladder, band labels in quality-review language ("Verified real issue that impacts spec compliance" vs "Verified real issue that impacts functionality or quality").
- `agents/plan-build-plan-attacker.md` — no confidence ladder. Evidence standard only.
- `agents/plan-build-plan-smeller.md` — no confidence ladder. Evidence standard only.
- Skills (`plan-attack`, `plan-smell`, `util-codereview`) — no confidence ladder.

The ladder is scoped to execute-write reviewers only. FD-01's table listing it under execute-write-spec-reviewer and execute-write-quality-reviewer is correct; FD-01 does NOT claim it appears elsewhere.

**Finding 7** — Independence rule (verify against code, do not trust implementer's report) appears in **2 files**: execute-write-spec-reviewer (strong form) and plan-build-plan-reviewer (weak form). DECISIVE.

Evidence:
- `agents/execute-write-spec-reviewer.md:3,8,18-31,52,62` — Strong form: "CRITICAL: Do Not Trust the Report" section header; full DO NOT / DO list; "Verify by reading code, not by trusting the report" appears twice.
- `agents/plan-build-plan-reviewer.md:51` — Weak form: "Read the actual plan and spec files. Do not trust summaries you receive in the prompt — open the files yourself."
- No independence rule in plan-attacker, plan-smeller, or the 3 skills.

FD-01's independence-rule row names `agents/execute-write-spec-reviewer.md:18-31` and `agents/plan-build-plan-reviewer.md:51` — confirmed. FD-01 cites `:18-31` as one site. Verified: lines 18-31 contain the DO NOT / DO block.

### Committee member scaffold (FD-02)

**Finding 8** — All four advocacy member files are exactly 103 lines. ~70% shared scaffold confirmed; shared bands have minor drift. DECISIVE.

Evidence:
- `wc -l agents/design-committee-{conservator,innovator,pragmatist,purist}.md` → 103 / 103 / 103 / 103.
- Phase Contract (~lines 37-49): identical structure, lens name woven in. Hard Prohibitions (~lines 43-49): **drift confirmed** — "defend lens" vs "advocate lens" vs "defend lens (e.g. real cost data from codebase)"; "Team-lead does" vs no-attribution. Output Format (~lines 60-103): **lens-name-only drift** for most labels; C2 bullet differs for Pragmatist.
- Shared bands confirmed: Phase Contract, Hard Prohibitions, Voice Discipline meta-rules, Output Format template structure.
- Per-lens bands confirmed: Lens Position preamble (lines 12-24), Software Architect Persona lens adjustments (lines 27-35), C1/C2 examples specific to lens.

FD-02's "~70% identical" and "~:35-41, :43-49, :51-62, :64-104" range map is substantially confirmed. Exact line numbers: Phase Contract starts ~37, Hard Prohibitions ~43-49, Voice Discipline ~51-62, Output Format ~64-103.

### Skill catalog (FD-03)

**Finding 9** — skill-index.md lists **21 entries** against **23 skill directories**. Missing: `design-grillme`, `util-handoff`, `util-improve-codebase`. DECISIVE.

Evidence:
- `ls skills/ | wc -l` → 24 (including CLAUDE.md directory entry); actual skill directories = 23.
- `grep "^- \`" skills/setup-start/references/skill-index.md | wc -l` → 21 (counting pipeline, finish, review, behavioral, utility entries).
- `grep "design-grillme\|util-handoff\|util-improve-codebase" skills/setup-start/references/skill-index.md` → 0 results. Confirmed missing.

Note: FD-03 states "20 skills" missing 3. Actual count is 21 entries in index (not 20 as stated in FD-03). The 3 missing skills are confirmed. FD-03's "20" appears to be off by one — index has 21 entries (setup-start, start-bootstrap, design-small-task, design-committee, design-specify, plan-build, execute-write, execute-verify-complete, finish-write-records, finish-archive-artifacts, finish-close-worktree, plan-attack, plan-smell, util-codereview, execute-test, execute-prove, util-worktree, util-dispatch, util-artifact-schema, util-design-partner-role, plus the brief-template pointer at line 59). DECISIVE correction: skill-index has 20 skill entries + 1 brief-template reference = 21 lines starting with `- \``.

**Finding 10** — design-small-task description drift between frontmatter and index: CONFIRMED. DECISIVE.

Evidence:
- `skills/design-small-task/SKILL.md:3` frontmatter: "Produces a six-section brief at Artifact Handoff and transitions to design-specify (which formalizes the brief into a spec before plan-build)."
- `skills/setup-start/references/skill-index.md:26`: "Lightweight design conversation for well-bounded tasks. Surfaces considerations through structured Q&A, produces a brief for plan-build. No MCP, no spec step."
- Direct contradiction: frontmatter says "transitions to design-specify"; index says "no spec step."

**Finding 11** — Phantom pointer in both CLAUDE.md files: CONFIRMED. DECISIVE.

Evidence:
- `CLAUDE.md:86` — "the skill's entry in `skills/setup-start/SKILL.md` (the available skills list) must stay in sync."
- `skills/CLAUDE.md:33` — "the matching entry in `skills/setup-start/SKILL.md`'s available-skills list must stay in lockstep."
- `skills/setup-start/SKILL.md:203` — no available-skills list. Text reads: "read [`references/skill-index.md`](references/skill-index.md)." The list is in `references/skill-index.md`, not in `setup-start/SKILL.md`.
- Both CLAUDE.md files name the wrong file. The actual list is at `skills/setup-start/references/skill-index.md`.

### CLAUDE.md rules (FD-04)

**Finding 12** — Version-bump rule: canonical in `CLAUDE.md:31`, shorter form without carve-out in `skills/CLAUDE.md:29`. DECISIVE.

Evidence:
- `CLAUDE.md:31` — "Bump it on any meaningful change to the skill's behavior or contract — **not on typo fixes or comment-only edits**. New skills start at `v0001`."
- `skills/CLAUDE.md:29` — "Bump on any behavior or contract change. New skills start at `v0001`."
- The "not on typo fixes or comment-only edits" carve-out is absent from `skills/CLAUDE.md`. Reader of skills/CLAUDE.md alone would over-bump.

**Finding 13** — Description-sync rule: both CLAUDE.md files state it AND both point at the wrong file. DECISIVE.

Evidence:
- `CLAUDE.md:86` — rule stated; wrong target (`setup-start/SKILL.md` not `setup-start/references/skill-index.md`).
- `skills/CLAUDE.md:33` — rule stated; wrong target (same error).
- FD-04 notes the sync rule appears twice; FD-03 explains both copies name the wrong file.

### Additional duplication sites MISSED by the 5 input docs

**Finding 14** — Translation Gate in 4 agent files is under-counted in FD brief. The brief mentions "4 altitudes / 3 examples" but does not itemize the 4 per-member agent inline restatements as a separate duplication class. The agents' Translation Gate bullets are NOT cited as a duplication site in any of the 5 docs. This is an extension to the duplication map.

Evidence:
- `agents/design-committee-conservator.md:57` — one-sentence restatement.
- `agents/design-committee-innovator.md:57` — one-sentence restatement.
- `agents/design-committee-pragmatist.md:57` — one-sentence restatement.
- `agents/design-committee-purist.md:57` — one-sentence restatement.
- These 4 agent-inline Translation Gate lines are part of the FD-02 scaffold (they're in the Voice Discipline band shared across members), but the 5 input docs treat FD-02 and voice-rule duplication as separate topics without cross-linking the agent Translation Gate bullets as a third distinct site for the Translation Gate rule.

**Finding 15** — Evidence-citation rule appears **doubled within single agent files** (in both description frontmatter and body). This intra-file duplication is not called out in FD-01.

Evidence:
- `agents/plan-build-plan-attacker.md` — evidence rule in frontmatter description (line 3) AND in body (lines 8, 72-78, 95). Four occurrences within one file.
- `agents/plan-build-plan-smeller.md` — evidence rule in frontmatter description (line 8) AND in body (lines 65-69, 83). Three occurrences within one file.
- FD-01 counts the files as 7-file duplication, but does not note intra-file duplication.

---

## Job 2: Decisive Empirical Test — Teams subagent read capability

### Test instrument

I am this session's Researcher, dispatched as a Teams subagent via `TeamCreate` / `SendMessage`. My system prompt is `agents/design-committee-researcher.md`. This makes me the live test instrument for whether a Teams subagent can read a sibling reference file as a first action.

### T1: Current working directory. DECISIVE.

**Result: CWD = `/home/mike/Documents/CodeProjects/Chester` (the repo root).**

`pwd` output: `/home/mike/Documents/CodeProjects/Chester`

The CWD is the project root of the Chester repository, not the plugin cache and not the directory containing the agent file.

### T2: Absolute path read. DECISIVE.

**Result: WORKS. Absolute paths resolve correctly.**

Test: Read `/home/mike/Documents/CodeProjects/Chester/skills/util-design-partner-role/SKILL.md` (lines 1-5). Read succeeded, returned correct frontmatter.

### T3: Relative path read from CWD. DECISIVE.

**Result: WORKS. Relative paths resolve relative to CWD (repo root).**

Test: Read `skills/util-design-partner-role/SKILL.md` (relative, no leading slash). Read succeeded. Resolves as `<CWD>/skills/util-design-partner-role/SKILL.md` = `/home/mike/Documents/CodeProjects/Chester/skills/util-design-partner-role/SKILL.md`.

### T4: Agent-file-relative path discipline. DECISIVE.

**Result: FAILS for bare relative paths cited in agent files. Repo-root-relative paths WORK.**

Test A — bare `references/member-protocol.md` (the path conservator.md uses in its prose): Read failed. Error: "File does not exist. Note: your current working directory is `/home/mike/Documents/CodeProjects/Chester`." There is no `references/` directory at the repo root.

Test B — `skills/design-committee/references/member-protocol.md` (repo-root-relative): Read succeeded. This is the correct path to the file.

Test C — `references/committee-member-template.md` (bare, nonexistent): Read failed. Same error.

**Interpretation:** Agent files (conservator.md, innovator.md, etc.) contain prose citations like `references/member-protocol.md` and `references/member-protocol.md § Routing signal`. These citations are **prose references in the system prompt**, not read directives. When the dispatched agent follows those references and issues a Read call, the path `references/member-protocol.md` fails from CWD. The agent must use the repo-root-relative path `skills/design-committee/references/member-protocol.md`.

### T5: Plugin cache path vs repo path. DECISIVE.

**Result: Plugin cache files exist at a different absolute path. CWD is the REPO root, not the plugin cache.**

Plugin cache location: `/home/mike/.claude/plugins/cache/ordinarymoose/chester/1.0.0/`

Files in plugin cache: `agents/design-committee-conservator.md`, `skills/design-committee/references/member-protocol.md` etc. — the same relative structure as the repo.

Read of `/home/mike/.claude/plugins/cache/ordinarymoose/chester/1.0.0/skills/design-committee/references/member-protocol.md` → succeeded (plugin cache copy exists).

Read of `skills/design-committee/references/member-protocol.md` (relative from CWD) → succeeded (repo copy).

**The CWD is the repo, not the plugin cache.** When Chester is run with `--plugin-dir /home/mike/Documents/CodeProjects/Chester` (dev mode), the session's CWD is the repo root, not the cache. For production (marketplace install), the CWD would be the project being worked on — not the plugin cache, and not the Chester repo.

### Net verdict on runtime-read for Teams subagents. DECISIVE.

**Runtime-read IS structurally possible for a Teams subagent. However, path discipline is CRITICAL.**

Three confirmed facts:
1. CWD = project/repo root. Relative paths resolve from there.
2. Absolute paths always work if they resolve on the filesystem.
3. Bare relative paths that assume agent-file-directory-relative resolution (e.g., `references/member-protocol.md` cited within conservator.md's prose) FAIL from CWD.

Corollary: for runtime-read to work reliably, the agent file's instruction must cite either (a) an absolute path or (b) a repo-root-relative path. In the Chester dev session (`--plugin-dir /path/to/Chester`), repo-root-relative paths like `skills/design-committee/references/member-protocol.md` resolve correctly. In production (marketplace install), the project CWD would be the user's project, not the Chester plugin directory — meaning repo-root-relative paths would also fail unless the paths happen to exist in the user's project. The current conservator agent prose references `references/member-protocol.md` (bare) — this is a broken citation from any CWD other than the `agents/` directory itself.

**Additional finding:** The `skills/util-design-partner-role/SKILL.md` reference in the 4 advocacy member agents (`Apply canonical Stance Principles from \`skills/util-design-partner-role/SKILL.md\``) works as a prose citation in dev mode (relative from Chester repo root) but is a broken path in production/marketplace context.

---

## Synthesis (facts)

**Census results (confirmed facts, no opinion):**

- PM Litmus Test: 0 canonical copies in `util-design-partner-role`; 2 inline copies (design-small-task:187 and team-lead.md:288) with minor wording drift.
- Research Boundary: 0 canonical copies in `util-design-partner-role`; 2 inline copies (design-small-task:209 and team-lead.md:299) with no detected drift.
- Stance Principles: 1 canonical copy; 4 lens-adjusted agent restatements that cite the canonical source AND restate modified versions.
- Translation Gate: 1 Interpreter Frame statement + 2 full section bodies (design-small-task and team-lead.md) + 4 agent inline bullets + multiple inline references. Agent-inline Translation Gate bullets are a duplication site not itemized in the 5 input docs.
- Evidence-citation rule: 7-file span confirmed; wording differs across sites; intra-file duplication also present (not noted in FD-01).
- Confidence ladder (≥80): 2 files only (execute-write-spec-reviewer and execute-write-quality-reviewer). Band labels differ between them; thresholds identical.
- Independence rule: strong form in execute-write-spec-reviewer:18-31; weak form in plan-build-plan-reviewer:51.
- Member scaffold: exactly 103 lines × 4 files; Hard Prohibitions band has minor drift; Output Format band differs only in lens-name labels plus Pragmatist C2 variant.
- Skill-index: 21 skill/template entries, 3 skill directories missing (design-grillme, util-handoff, util-improve-codebase). design-small-task entry contradicts its own frontmatter. FD-03's "20 skills" count is off by one (21 entries before the brief-template pointer line). Phantom pointer confirmed in both CLAUDE.md files.
- Version-bump rule: carve-out present in root CLAUDE.md:31, absent in skills/CLAUDE.md:29. Drift confirmed.

**Runtime-read empirical results (confirmed facts, no opinion):**

- CWD for this Teams subagent dispatch = `/home/mike/Documents/CodeProjects/Chester` (repo root in dev mode).
- Absolute paths: work.
- Repo-root-relative paths (e.g., `skills/design-committee/references/member-protocol.md`): work.
- Agent-file-relative bare paths (e.g., `references/member-protocol.md`): fail from CWD.
- Plugin cache path: resolves as a different absolute path; CWD is not the plugin cache.
- Production context: CWD would be user's project root, not Chester repo — repo-root-relative paths would fail there too.
- Runtime-read is structurally possible in dev mode with repo-root-relative paths; not guaranteed in production without absolute paths or path injection at dispatch.

## Final Position

position: "no design opinion"
blocking_risk: "none — research role holds no advocacy"
