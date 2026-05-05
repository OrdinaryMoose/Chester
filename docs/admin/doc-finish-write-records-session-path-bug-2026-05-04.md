# Bug Brief — finish-write-records session-path resolution

**Date surfaced:** 2026-05-04
**Reporter:** Surfaced during `task-01-fix-staleb3-label` finish-write-records run; worked around manually that session
**Master plan relation:** Out-of-scope for the active master plan (`20260430-02-rebuild-design-derivation`); not tracked in master-plan §10 deferments because that section is reserved for items relevant to the master plan itself
**Scope:** A single bug in one skill recipe; a single-shape fix

---

## Bug Summary

The `chester:finish-write-records` skill, in Step 3 (Reasoning Audit and Decision Records), instructs the calling agent to resolve the current session's JSONL transcript path with this recipe:

```bash
SESSION_DIR="$HOME/.claude/projects/$(echo "$PWD" | sed 's|/|-|g; s|^-||')"
LATEST_JSONL=$(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null | head -1)
```

The `s|^-||` strips the leading hyphen from the slugified PWD. But Claude Code's actual project directory naming under `~/.claude/projects/` **keeps the leading hyphen**.

**Effect:** `SESSION_DIR` resolves to a directory that does not exist. `LATEST_JSONL` is empty. Both audit and records forks dispatched in Step 3 cannot read the session transcript.

**Workaround used 2026-05-04:** the parent agent computed the correct path manually (kept the leading dash) and embedded it in fork prompts. Forks then succeeded. Skill itself was not modified.

---

## Reproduction

```bash
PWD=/home/mike/Documents/CodeProjects/Chester

# Skill's current recipe
BUGGY=$(echo "$PWD" | sed 's|/|-|g; s|^-||')
echo "$HOME/.claude/projects/$BUGGY"
# → /home/mike/.claude/projects/home-mike-Documents-CodeProjects-Chester
#                              ^^^ no leading dash

# Real Claude Code project directories
ls "$HOME/.claude/projects/" | head -3
# -home-mike
# -home-mike-Documents-CodeProjects-Chester
# ^^^ leading dash present
```

The buggy SESSION_DIR points to nothing; `ls "$BUGGY"/*.jsonl` returns an empty glob.

---

## Root Cause Hypothesis

The `s|^-||` strip is intentional but no longer matches Claude Code's project-directory naming. Likely causes:

1. **Stale recipe.** Naming convention changed in a Claude Code update; the skill recipe predates the change.
2. **Slugification pattern confusion.** Original author may have mirrored a different tool's slugification rule.
3. **Tested against a non-absolute PWD.** Unlikely — agents always run from absolute project paths.

The strip is safe to remove for any absolute-path PWD: `s|/|-|g` on `/home/mike/...` always produces a leading `-` because `/` is the first character.

---

## Fix Candidates

### (a) Remove the strip — recommended

```bash
SESSION_DIR="$HOME/.claude/projects/$(echo "$PWD" | sed 's|/|-|g')"
```

Smallest change. Resolves correctly for any absolute PWD. Matches Claude Code's current naming convention.

**Risk:** If a future Claude Code update changes the slugification rule again, the recipe will need another revision. Acceptable — the recipe is a one-line skill update.

### (b) Replace with directory-listing

```bash
SESSION_DIR=$(ls -dt "$HOME/.claude/projects"/* | head -1)
```

Picks the most recently modified projects subdir without depending on PWD slugification.

**Risk:** Loses binding to current PWD. If multiple Claude Code projects are active simultaneously, could match the wrong one. Higher risk of silent wrong-dir failures.

### (c) Match by suffix

```bash
PWD_SLUG=$(echo "$PWD" | sed 's|/|-|g')
SESSION_DIR=$(ls -d "$HOME/.claude/projects/"*"$PWD_SLUG" 2>/dev/null | head -1)
```

Find any projects subdir ending with the slugified PWD, regardless of leading prefix. Tolerant of leading-character variation in either direction.

**Risk:** None significant; small added complexity. Robust against future leading-character convention changes.

---

## Recommended Fix

**(a).** Smallest change; matches the current Claude Code naming convention; the skill recipe remains readable. If the naming convention changes again, the recipe is one-line update.

If risk of future convention drift is a concern, **(c)** is a defensible fallback.

---

## Acceptance Criteria

- The skill recipe resolves `SESSION_DIR` to an existing directory under `~/.claude/projects/` for any real project PWD.
- A test under `tests/` exercises the recipe against the current PWD's expected projects subdir and asserts existence.
- finish-write-records Step 3 dispatches audit + records forks successfully without manual path correction (validated by running finish-write-records end-to-end on a fresh sub-sprint).
- The skill's `version` frontmatter is bumped (current `v0003` → `v0004`).
- The corresponding test in `tests/test-stamping-finish-write-records.sh` is updated to expect the new version.

---

## Where the Bug Lives

| Path | Role |
|------|------|
| `skills/finish-write-records/SKILL.md` | Canonical skill source in this repo |
| `~/Documents/CodeProjects/OrdinaryMoose/plugins/chester/skills/finish-write-records/SKILL.md` | Plugin cache (sync via `/refresh-chester` after fix) |

**Section to edit:** Step 3 "Reasoning Audit and Decision Records (both modes — parallel fork)"
**Pattern to find:** `sed 's|/|-|g; s|^-||'`

---

## Out of Scope

- Other path-resolution patterns in other skills. None known to carry the same hazard, but a cross-skill audit could be a follow-up brief.
- Larger refactor of how skills resolve the session JSONL path. Single-purpose fix here.
- Migration of the recipe to a shared helper script. Possible future improvement; not required by this brief.

---

## References

- **`cluster-b-2-define-solve-closing-summary-00.md` line 178** — flagged "worth investigating as a sprint-finish carry-forward item." That note attributed the harvest empty-result to the same path-resolution issue, but the harvest bug turned out to be a different fault (set -e + pipefail). The session-path bug noted here is real and remains unresolved.
- **`task-01-fix-staleb3-label-summary-00.md` Known Remaining Items** — surfaced again 2026-05-04 during task-01's finish-write-records dispatch; flagged as candidate for future task-04.
- **task-02-fix-trailer-write-harvest** — explicitly excludes this bug per moderate-scope decision (2026-05-04). The two bugs share the sprint-finish tooling family but not a fault line.

---

## Suggested Next Step

When ready to fix, this brief is hand-off-ready for any of:

- A new master-plan task entry (e.g. task-04 if the master plan is still active) following the trivial-edit-class pipeline (single-file recipe edit + version bump + test update).
- A standalone refactor sub-sprint outside master mode.
- A direct fix on main if the scope feels small enough not to warrant ceremony.

The fix itself is a one-line `sed` recipe change plus version bump plus test update. Implementation should take under 30 minutes once started.
