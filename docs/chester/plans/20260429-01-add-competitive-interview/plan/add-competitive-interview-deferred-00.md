# Deferred Items — add-competitive-interview

Items surfaced during execute-write that were out of scope for the current task and recorded for finish-phase review.

---

## 2026-04-29 — Task 2 quality review

**Source task:** Task 2 (create team-interview-flow.md skeleton)
**Confidence:** 88 (Important)

**Item:** AC-1.2 test's `REQUIRED_SECTIONS` array covers 10 of 11 declared section headings in the flow file. The 11th heading, `Round-Zero Initialization`, is present in the skeleton but not asserted by the test — if a future task renames or drops it, the test passes silently.

**Why deferred:** The test exactly mirrors the spec's AC-1.2 observable boundary, which enumerates only those 10 sections. Adding `Round-Zero Initialization` to the array would expand the AC's scope beyond what spec v03 declares. The right venue for that change is a spec revision (would require bumping spec to v04 + new AC or expanded AC-1.2), not an in-task fix at execute-write. If the gap matters, raise during finish review and capture as a follow-on sprint.
