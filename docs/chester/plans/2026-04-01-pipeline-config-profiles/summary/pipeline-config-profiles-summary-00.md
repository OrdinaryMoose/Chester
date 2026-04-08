# Session Summary: Pipeline Configuration Profiles — Design Discovery

**Date:** 2026-04-01
**Session type:** Design discovery (abandoned)
**Plan:** None — session ended during interview phase

## Goal

Explore a pipeline configuration system for Chester that would make the implicit Design → Plan → Execute → Finish sequence explicit, configurable, and experimentable — via named profiles in Chester's layered config.

## What Was Decided

### Pipeline phases map to skill name groupings
The phases are defined by the skill directory prefix: Design (figure-out + specify), Plan (build + attack/smell), Execute (write + test/debug/prove/review), Finish (finish + summary/audit). Setting a phase to null skips all skills in the group.

### Phase replacement operates at group granularity
Swapping a phase means replacing the entire skill set — e.g., Execute (skill set A) replaced by Execute (skill set B). No mix-and-match of individual skills across sets.

### Skip and replace are the core value
The immediate use case is skipping phases for experiments or projects that don't need them. Replacement is a future capability that falls out naturally from the same config structure.

### Design stopped at artifact contracts
The interview surfaced that skipping phases raises questions about artifact contracts — what happens when a downstream phase expects input that the skipped phase would have produced. This complexity exceeded what was wanted, and the session was ended.

## Known Remaining Items

- **Artifact contracts when phases are skipped:** If Design is skipped and there's no spec, what does Plan consume? If both Design and Plan are skipped, Execute starts from just a user request. The conops asserts this works but the validation logic was deemed too complex for now.
- **Skill set definition mechanism:** How does the system know which skills belong to an alternative phase implementation? Currently grouping is implicit in naming conventions.
- **Profile schema:** The exact JSON shape of a profile definition was not reached.

## Files Changed

| File | Change |
|------|--------|
| `docs/chester/plans/2026-04-01-pipeline-config-profiles/design/pipeline-config-profiles-interview-00.md` | Created — interview transcript (6 exchanges) |
| `docs/chester/plans/2026-04-01-pipeline-config-profiles/summary/pipeline-config-profiles-summary-00.md` | Created — this file |

## Handoff Notes

The conops document provided by the user is the most complete expression of intent — it covers config layers, profile structure, null phases, and what the system should and shouldn't change. The interview clarified three design decisions (phase boundaries, replacement granularity, skip-as-primary-value) before hitting the artifact contract question that stalled progress. A future session can resume from the conops + these three decisions and focus on resolving the artifact contract problem or deciding to punt it entirely.
