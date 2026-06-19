# Alignment map — round 01

Four lenses, no fixed pairing. Pattern per sub-question:

- **Approach (minimal-edit vs redesign):** 4–0 minimal-edit. Conservator | Innovator | Pragmatist | Purist.
- **Vocabulary (retire roster/off-roster → teammate/subagent):** 4–0 replace. All four.
- **TeamCreate removal → spawn-members step:** 4–0. All four.
- **TeamDelete removal → record-only closure:** 4–0. All four.
- **execute-write (keep instruction, drop stranding justification):** 4–0. All four.
- **Context-economy invariant preserved:** 4–0. All four.
- **Nested-teams placement:** 3–1. Conservator + Pragmatist + Purist (one-sentence note) vs Innovator (Phase-1 runtime check).
- **Memory handling:** 2–2. Conservator + Pragmatist (update-in-place) vs Innovator + Purist (replace). Note Purist's nuance: retire teardown-gap, rewrite disposal/offroster.

## Rationale threads (for scribe)

- The migration is unanimously framed as documentation, not design: the old `team_name`
  discriminator encoded intent as a fragile parameter requiring discipline at every dispatch
  site; the new `teammate`/`subagent` spawn-shape encodes the same intent structurally in the
  tool call. Strictly tighter, near-zero implementation risk because intent maps cleanly.
- The two splits are about emphasis/housekeeping, not architecture — both reduce to a
  minimal-change tiebreak.
