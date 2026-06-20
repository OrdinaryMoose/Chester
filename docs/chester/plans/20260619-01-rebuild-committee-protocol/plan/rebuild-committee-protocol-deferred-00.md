# Deferred Items — rebuild-committee-protocol

Items surfaced during execute-write that are out of scope for the plan's tasks. Reviewed at finish.

---

## 2026-06-19 — member-protocol.md frontmatter description omits § Shutdown request

**Source task:** Task 3 (member-protocol.md — standing membership, self-organizing peer-DM, Shutdown request)

**Description:** The Task 3 quality review (confidence 82) noted that `skills/design-committee/references/member-protocol.md` gained a new `## Shutdown request` section, but the file's frontmatter `description` field — which enumerates the file's covered sections — was not updated to list it. SKILL.md and team-lead.md both cite `member-protocol.md § Shutdown request` as the teardown authority, so the navigation description is now slightly incomplete. Suggested fix: add "the shutdown request protocol" (or similar) to the description's section list.

**Why deferred:** Out of plan scope — Task 3's specified edits did not include the `description` field, and this is a Minor doc-completeness nit, not a protocol or test defect. This reference-file `description` does not feed the generated skill catalog (the generator globs `skills/*/SKILL.md` and `agents/*.md`, not `references/`), so there is no catalog-freshness consequence and no test pins it. Captured here rather than churning a committed, green task mid-sprint.

<!-- created-at: 2026-06-20T01:17:24Z -->
<!-- produced-by execute-write@v0010 -->
