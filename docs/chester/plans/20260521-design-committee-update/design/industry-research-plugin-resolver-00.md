# Industry Research — Claude Code Plugin Resolver

**File:** `design/industry-research-plugin-resolver-00.md`
**Source:** `chester:design-large-task-industry-explorer` agent
**Question scope:** Plugin resolver discovery surface, manifest registration, subagent type binding, co-located-agents pattern
**Date:** 2026-05-22
**Signal quality:** Rich — official Anthropic docs cover all four sub-questions with precise behavioral specs

---

## 1. Discovery Surface

The plugin resolver scans the `agents/` directory at the plugin root **recursively**. Source: [Create custom subagents — Claude Code Docs](https://code.claude.com/docs/en/sub-agents).

**Critical asymmetry between scopes:**

- **Project (`.claude/agents/`) and user (`~/.claude/agents/`) scope:** subdirectory path is **irrelevant** to identity. A file at `agents/review/security.md` resolves purely by its `name:` frontmatter field — the path is invisible to the resolver.
- **Plugin scope:** subdirectory path becomes **part of the scoped identifier**. A file at `agents/review/security.md` inside plugin `my-plugin` registers as `my-plugin:review:security`, not as `my-plugin:security`. The `name:` frontmatter does **not** drive the invocation identifier for plugin agents — path does.

**Consequence for Chester redesign:** placing agent files at `skills/design-committee/agents/design-committee-conservator.md` — outside the plugin's default `agents/` tree — means the default scan does not find them. The resolver's default scan root is `agents/` at the plugin root.

---

## 2. Manifest Registration — `plugin.json` `agents` Field

The `plugin.json` manifest supports an explicit `agents` field. Documented behavior under "Path behavior rules":

- The `agents` field **replaces** the default `agents/` directory scan. It does **not** augment it.
- Specifying `"agents": ["./skills/design-committee/agents/"]` means the default `agents/` directory at the plugin root is no longer scanned.
- To keep the default and add more, both paths must be listed: `"agents": ["./agents/", "./skills/design-committee/agents/"]`.
- Paths must be relative to the plugin root and must start with `./`. A path that does not start with `./` is a load error, not a warning.
- Subfolders beneath a custom path contribute path segments to the scoped identifier, same as the default `agents/` directory.

Compare to the `skills` manifest field, which is **additive** — `skills` always scans the default `skills/` directory and adds listed paths. There is no equivalent additive behavior for `agents`.

Source: [Plugins reference — Component path fields and Path behavior rules](https://code.claude.com/docs/en/plugins-reference)

---

## 3. Subagent Type Resolution

**Project / user scope:** `name:` frontmatter is the sole identity surface. Path is invisible.

**Plugin scope:** identifier construction is `<plugin-name>:<subfolder-path>:<agent-filename-without-extension>`. The `name:` frontmatter field inside a plugin agent file:

- Appears in the `/agents` UI display.
- Is what hooks receive as `agent_type`.
- Does **not** determine the invocation identifier used in `subagent_type`.

Path drives the identifier. The `name:` field is metadata.

Documented invocation examples:

- `my-plugin:code-reviewer` — agent at `agents/code-reviewer.md` in plugin `my-plugin`.
- `my-plugin:review:security` — agent at `agents/review/security.md` in plugin `my-plugin`.
- CLI: `claude --agent my-plugin:review:security`.

The SDK's `subagent_type` field on the Agent tool input carries this scoped identifier string.

Source: [Create custom subagents](https://code.claude.com/docs/en/sub-agents), [Subagents in the SDK](https://code.claude.com/docs/en/agent-sdk/subagents)

---

## 4. Co-located Agents Pattern

**No documented community or official pattern** for placing agent files inside skill subdirectories (e.g., `skills/<skill>/agents/`). The only documented default convention is a top-level `agents/` directory at the plugin root.

Co-location is mechanically possible via the manifest `agents` field override, but with trade-offs:

- **Replace-not-add behavior.** If you specify `"agents": ["./skills/design-committee/agents/"]` without also listing `./agents/`, every other plugin agent in the default location becomes invisible.
- **Silent-override pitfall.** Versions of Claude Code prior to v2.1.140 produce no warning when both a default `agents/` directory and a manifest `agents` field exist simultaneously and the default is ignored. v2.1.140 and later flag the ignored folder in `/doctor`, `claude plugin list`, and the `/plugin` detail view, but the plugin still loads using only the manifest paths.
- **Identifier preservation.** If `./skills/design-committee/agents/` is registered as a manifest path and a file lives directly at that path's root (no further subfolders), the identifier is constructed without subfolder segments. So `skills/design-committee/agents/design-committee-conservator.md` with the manifest path registered as `./skills/design-committee/agents/` resolves to `chester:design-committee-conservator` — same as if it lived at `agents/design-committee-conservator.md`.

---

## 5. Implication for Chester Redesign

**The move is supported** but requires a `plugin.json` manifest update. Concrete change:

```json
// .claude-plugin/plugin.json — add this field:
"agents": ["./agents/", "./skills/design-committee/agents/"]
```

This:

- Keeps every existing plugin agent at top-level `agents/` resolvable.
- Adds `skills/design-committee/agents/` as a discovery path.
- Preserves the `chester:design-committee-{pole}` identifiers unchanged (no dispatch site update needed).

**Track #7 resolution:** industry research is conclusive. Empirical test is no longer needed (could still run as belt-and-suspenders confidence check, but not required by the evidence).

**Track A (file move) becomes well-defined:**

1. Add the `agents` field to `.claude-plugin/plugin.json` with both paths listed.
2. Move five committee agent files: `agents/design-committee-{conservator,innovator,pragmatist,purist,researcher}.md` → `skills/design-committee/agents/`.
3. Delete `agents/design-committee-arbiter.md`.
4. Verify dispatch by spawning a committee in a fresh session.

**One follow-up consideration not in scope here:** the manifest path discipline now becomes a maintenance surface. Every future agent file location decision must factor in whether the default `agents/` is the right home or whether co-location alongside a skill is preferred. Chester does not yet have a stated convention for that choice — flagged as a follow-up brief item.

---

## Change Log

- **00 (2026-05-22):** Initial industry research findings. Source: official Anthropic Claude Code documentation at code.claude.com/docs.
