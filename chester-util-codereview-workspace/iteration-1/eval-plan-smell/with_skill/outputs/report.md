## Code Review: `chester-plan-smell/`

**Smell Density: Significant**

Agents: Bloaters & Dispensables, Couplers & OO Abusers, Change Preventers.
Scope: `chester-plan-smell/` (1 file, Markdown/YAML)

### Findings

- **Critical** | `SKILL.md:68-221` + `chester-util-codereview/SKILL.md:75-221` | Smell taxonomy copy-pasted across two skill files | The three agent prompt blocks (Bloaters & Dispensables, Couplers & OO Abusers, Change Preventers) with their smell categories, SOLID mappings, rules, and output format templates are duplicated nearly verbatim between chester-plan-smell and chester-util-codereview. Only the framing differs ("Analyze the plan" vs "Review the existing code") and plan-smell adds an "Acknowledged" output section. Any update to the smell taxonomy, SOLID mappings, or agent rules requires editing 6 locations (3 agents x 2 files) in lockstep. | smell: Duplicate Code + Shotgun Surgery | source: Bloaters & Dispensables, Change Preventers

- **Serious** | `SKILL.md:225-251` + `chester-util-codereview/SKILL.md:225-251` | Structured Thinking gate duplicated verbatim across two skill files | The 5-step MCP orchestration protocol (clear history, capture per agent, retrieve for Critical findings, revise overlaps, get summary) and the fallback clause are identical in both skills. Changes to the synthesis workflow require editing both files. Blast radius: 2 files. | smell: Duplicate Code + Shotgun Surgery | source: Bloaters & Dispensables, Change Preventers

- **Serious** | `SKILL.md:225-251` | Intimate coupling to Structured Thinking MCP API surface | Step 3 hardcodes five specific MCP function names and prescribes exact parameter usage including branch_id naming conventions. The skill is tightly bound to the internal API of the structured-thinking MCP server. The fallback (lines 249-251) treats availability as binary rather than handling API evolution. | smell: Inappropriate Intimacy | source: Couplers & OO Abusers

- **Serious** | `SKILL.md:68-221` | Internal duplication within agent prompt blocks | Within this single file, the three agent blocks share approximately 60% boilerplate: identical framing ("[full plan text] --- Analyze the plan above..."), identical Rules sections (cite evidence, drop unfounded findings, classify severity, note acknowledged risks), and identical output format templates. The differentiated content is only the specific smell categories per agent. | smell: Duplicate Code | source: Bloaters & Dispensables

- **Serious** | `SKILL.md:225-296` | Step 3 conflates three independent concerns | The synthesis step handles (a) MCP orchestration protocol (lines 225-251), (b) deduplication/merging logic (lines 253-255), and (c) output format specification (lines 257-296). Changes to any one concern require working around the other two in the same section. | smell: Divergent Change | source: Change Preventers

- **Minor** | `SKILL.md:95-98, 155-158, 197-202` | SOLID-mapped subsections restate what the parent smell already checks | Each agent block includes a "SOLID-mapped smells to also check" subsection that restates SOLID principles already implied by their corresponding smell categories (e.g., "SRP as Large Class" adds no analytical power beyond checking for Large Class). These add instructional weight without adding analytical coverage. | smell: Speculative Generality | source: Bloaters & Dispensables

- **Minor** | `SKILL.md:1-11` | Description frontmatter overloaded | The YAML description field packs trigger phrases, methodology overview, lineage attribution, and invocation examples into a single 5-line string. The CLAUDE.md convention states this field "must clearly state when to invoke the skill" — it currently does more than that. | smell: Long Parameter List (overloaded field) | source: Bloaters & Dispensables

- **Minor** | `SKILL.md:22-28` | Relationship section defines self in terms of sibling skill internals | The "Relationship to other review skills" section describes what chester-plan-attack and plan-doc-review do. If those skills change scope, this section becomes stale without any signal to update it. | smell: Feature Envy | source: Couplers & OO Abusers

### Risk Rationale

- The dominant risk is cross-skill duplication. The smell taxonomy, agent scaffolding, and Structured Thinking gate are shared concerns living in two independent files with no extraction mechanism. This makes the two review skills a coupled pair that must be edited in lockstep — the exact Shotgun Surgery pattern they are designed to detect.
- The MCP coupling is a secondary risk. The skill cannot function without a specific MCP server and is bound to its current function signatures. This is a hard dependency with no abstraction layer or version negotiation.
- The internal duplication within the agent blocks is a maintenance drag but not a structural risk on its own — it becomes significant only in combination with the cross-skill duplication, which multiplies the copy count from 3 to 6.
