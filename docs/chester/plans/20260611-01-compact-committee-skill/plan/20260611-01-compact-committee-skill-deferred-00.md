# Deferred Items — compact-committee-skill

Items surfaced during execution that were out of plan scope. Reviewed at finish.

---

## 2026-06-11 — §Voice cite adjacency redundancy (team-lead.md)

**Source task:** Task 5 (collapse team-lead.md Translation Gate duplicates), surfaced by the Section 4 full-range code review.

**Description:** After Task 5 collapsed the §Voice six-bullet rule list to a single util cite, two adjacent lines now both name the `util-design-partner-role/SKILL.md` path and repeat "read in full":
- line 28 — the §Voice intro ("Before consolidating, read `…util-design-partner-role/SKILL.md`. Apply in full to designer-facing packet:")
- line 30 — the surviving collapsed bullet ("Rules — full spec: `…util-design-partner-role/SKILL.md` (read in full before consolidating).")

A future pass could fold these into a single line, removing the path/"read in full" double-mention.

**Why deferred:** Out of plan scope (not in any plan-01 task) and not a defect against any acceptance criterion — the code reviewer rated it non-blocking, "reads correctly and strands nothing." Acting on it would be an unplanned edit to a boundary-sensitive section (§Voice line 28 is a "must remain green" operational line, line 37/now-32 carries the preserved "Apply silently" clause). Adjacent to the already-deferred "Fuller Translation-Gate merge" item in plan-01's Scoped Out section — a natural candidate for the same follow-up sprint.

<!-- created-at: 2026-06-11T16:00:29Z -->
<!-- produced-by execute-write@v0008 -->
