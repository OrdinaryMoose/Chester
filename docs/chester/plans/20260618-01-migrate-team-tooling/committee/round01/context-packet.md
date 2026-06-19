# Context Packet — Migrate Chester to post-v2.1.178 agent-teams model

This packet is the shared, bounded input for all four advocacy members and the researcher.
Do not re-fetch the Claude docs — the load-bearing facts are quoted below.

## The question (one sentence)

How should Chester's `design-committee` and `execute-write` skills — plus the two stale
memories — be refactored to the post-v2.1.178 agent-teams model (no `TeamCreate`/`TeamDelete`,
single implicit team, `team_name` ignored, automatic teardown), while preserving the
deliberation grid and context-economy architecture?

## What Claude Code changed (authoritative, from code.claude.com/docs/en/agent-teams, v2.1.178)

- `TeamCreate` and `TeamDelete` **no longer exist**. Before v2.1.178 you created/named a team
  with those tools. Both are removed.
- A team now **forms automatically** when the first teammate is spawned. The main session is
  the **lead**. No setup step.
- **Teardown is automatic** at session exit. Shared team dirs cleaned up. No teardown call.
- `team_name` on the Agent tool is **accepted but ignored** — "the session has a single
  implicit team." `team_name` in hook payloads is session-derived and deprecated.
- Teammates **message each other by name via `SendMessage`** — peer-DM is intact. Team
  coordination tools (`SendMessage`, task tools) are **always available to a teammate even
  when its `tools` allowlist restricts other tools.**
- Subagent definitions can be used as teammate types (the definition body is appended to the
  teammate's system prompt; its `tools`/`model` honored; `skills`/`mcpServers` frontmatter NOT
  applied to teammates).
- **Hard constraints:** one team per session; **no nested teams** (teammates cannot spawn
  teammates — only the lead manages the team); the lead is fixed as the main session.
- Gated by env `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — confirmed SET in this environment.

## Subagents vs teammates (the new distinction)

Old Chester encoded "deliberates vs just-produces" in the `team_name` parameter (present =
roster teammate that peer-DMs; absent = off-roster one-shot). That parameter is now ignored,
so the lever is gone. The new distinction is **how you spawn**:
- **Teammate** = persistent independent Claude instance, peer-messages others, claims shared
  tasks. Spawned as a background named agent under the implicit team.
- **Subagent** = one-shot worker, returns its result to the caller and disposes. No peer-DM.

## Chester edit surface (live skills only; archived plan artifacts are records, leave them)

**design-committee** (`skills/design-committee/SKILL.md`, `references/team-lead.md`):
- `SKILL.md` "Convene" / "TeamCreate" section (~:74, :103-128) calls `TeamCreate` with five
  members. Dead verb.
- `SKILL.md` "Tear Down" (~:76, :194-196) and `team-lead.md:141` call `TeamDelete`, with
  rationale "MANDATORY — stranded teams leak context." Dead verb; stranding hazard gone.
- "Dispatch Discipline" (`SKILL.md:126-131`) splits roster (members, peer-DM, needs
  `team_name`) vs off-roster (consolidator/scribe, Agent tool, no `team_name`). The
  `team_name` discriminator no longer works. Intent must survive on a new mechanism.
- Roles unchanged in intent: 4 advocacy members + researcher deliberate (teammates);
  Consolidator + Scribe are context-isolated one-shots (subagents).

**execute-write** (`skills/execute-write/SKILL.md:96-98` + 4 references: implementer,
code-reviewer, quality-reviewer, spec-reviewer):
- All warn "never pass `team_name` / never `TeamCreate`, else the worker strands as a
  persistent teammate until `TeamDelete`." That failure mode **can no longer happen**. The
  instruction (one-shot workers) stays correct; the justification is now false/misleading.

**Two memories now wrong:**
- `project_committee_teardown_gap` — about ephemerals wedging `TeamDelete` via `team_name`.
  Hazard evaporated.
- `project_subagent_disposal_offroster` — "`team_name` = persistent teammate needing
  `TeamDelete`." Mechanism no longer holds.

## Architecture invariant that MUST be preserved (do not redesign away)

`project_committee_context_economy` (FOUNDATIONAL): team-lead never aggregates content; the
scribe authors from bounded inputs (verdict + consolidator output + alignment map); the
consolidator enumerates only. This information-flow design is orthogonal to the create/destroy
plumbing that changed — keep it intact.

## Latent risk to assess

"No nested teams + lead is fixed = main session" vs Chester's `team-lead = calling agent`
(`SKILL.md:34`). Fine IF design-committee is always invoked from the main session. If anything
ever dispatches the committee from inside a subagent, no-nested-teams kills it.
