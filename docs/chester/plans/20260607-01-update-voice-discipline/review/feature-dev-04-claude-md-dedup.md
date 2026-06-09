# Feature Dev 04 — Deduplicate the two CLAUDE.md rule statements

- **Recommendation strength:** Worth exploring
- **Dependency category:** in-process (pure instruction text)
- **Architecture move:** one canonical statement per repo-wide rule; the other file points up

## Summary

Two repo rules — the `vNNNN` version-bump rule and the description-sync rule — are stated in both `CLAUDE.md` and `skills/CLAUDE.md`. The version rule has already drifted. Make root `CLAUDE.md` canonical for repo-wide rules and have `skills/CLAUDE.md` reference it instead of restating.

## Current state (verified)

- **Version rule, drifted:**
  - `CLAUDE.md:31` — "Bump it on any meaningful change to the skill's behavior or contract — **not on typo fixes or comment-only edits**. New skills start at `v0001`."
  - `skills/CLAUDE.md:29` — "Bump on any behavior or contract change. New skills start at `v0001`." — the **carve-out is dropped**.
- **Description-sync rule, duplicated** (and both copies are wrong about the file — see Feature Dev 03):
  - `CLAUDE.md:86` and `skills/CLAUDE.md:33` both state the sync rule.

## The friction (deletion test)

Delete the version rule from `skills/CLAUDE.md`: the rule still exists in root `CLAUDE.md`. It was a copy. Because the copy was hand-maintained, it lost the "not on typo fixes" carve-out — a reader of `skills/CLAUDE.md` alone would over-bump.

## Proposed change

- Root `CLAUDE.md` = canonical for repo-wide conventions (version rule, sync rule, commit style, staging discipline).
- `skills/CLAUDE.md` keeps only skill-directory-*specific* guidance and replaces the duplicated rules with a one-line pointer: "Version and description-sync rules: see root `CLAUDE.md`."

**Locality:** one statement of each rule; the existing drift is removed.

## Already clean — do not touch

The artifact directory tree in `CLAUDE.md:37-57` is a **summary plus** "See `skills/util-artifact-schema/SKILL.md` for the full reference." That is the correct two-tier pattern (summary + authority pointer), not a violation. Leave it.

## Implementation tasks

1. Confirm root `CLAUDE.md` carries the fullest, correct phrasing of each shared rule (reinstate the version carve-out as canonical).
2. Replace the duplicated rule bodies in `skills/CLAUDE.md` with pointers.
3. Apply the Feature Dev 03 fix to the sync-rule wording at the same time (name the real file).

## Verification

- `grep -rn "zero-padded\|Bump" CLAUDE.md skills/CLAUDE.md` shows the version rule stated once, pointed-to once.
- `skills/CLAUDE.md` contains no rule body that root `CLAUDE.md` already owns.

## Risks & open questions

- `skills/CLAUDE.md` may be read without root `CLAUDE.md` in some contexts — confirm the pointer is sufficient, or keep a one-line summary plus pointer (the two-tier pattern) rather than a bare pointer.

## Out of scope

- The artifact-tree summary (already correct).
- Master Plan Mode and staging discipline (each stated once already).
