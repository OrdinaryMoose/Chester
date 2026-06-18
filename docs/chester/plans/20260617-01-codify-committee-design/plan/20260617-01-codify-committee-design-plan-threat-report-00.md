# Combined Threat Report — Committee complete-design document (reverse D9)

**Sprint:** 20260617-01-codify-committee-design
**Plan reviewed:** `plan/20260617-01-codify-committee-design-plan-00.md`
**Date:** 2026-06-17
**Hardening dispatches:** `plan-attack` (unconditional). `plan-smell` **skipped** — Smell Heuristic Pre-Check matched **zero** triggers (the trigger library is code/.NET-flavored: DI registrations, new abstractions, async/concurrency primitives, persistence pathways, `new contract`/`public record`; this is a pure-markdown documentation refactor). Per the 18-sprint retrospective, smell adds mostly polish on doc refactors — plan-attack was sufficient.

## Matched smell triggers

None. (Reported verbatim per the pre-check procedure.)

## Combined implementation risk: **Moderate** (Low after mitigations land)

The work is mechanical declarative-text editing with strong per-task verification, but its risk carriers are **breadth** (12 source files + 4 test files across two skill clusters) and **cross-file consistency** (the two-sense "decision packet" hazard, the hard A→B ordering, and the standalone-documentation-discipline rule that no commit may leave Chester's docs self-contradictory). The plan-attack pass surfaced six findings; all HIGH/MEDIUM are now fixed in the plan and the fixes were verified against the live tree. With those mitigations the residual risk is **Low**.

### Why this level (5 statements)

- **All adversarial findings are resolved, not deferred.** plan-attack found 2 HIGH, 2 MEDIUM, 2 LOW; the 4 HIGH/MEDIUM and 1 LOW are fixed in-plan, and the load-bearing assumptions behind the fixes were re-verified by running the actual greps against the live files.
- **The real hazard is test co-evolution, now planned.** Four existing tests assert invariants this sprint deliberately changes (a term anchor, two version pins, one heading anchor). The plan now updates each test **in the same task/commit** that breaks it, so every commit leaves the suite green — this is correct test-tracks-contract discipline, not a workaround.
- **Two verification no-ops were caught and fixed.** The `Transitions to: none` sweep was vacuous (the `**` bold markers defeat a plain grep — verified), and a stale ``design-committee` verdict`` at `spec-write/SKILL.md:16` slipped past the `committee verdict` grep (the backtick breaks adjacency — verified). Both now have working assertions.
- **The A→B ordering gate is structural and enforced by task numbering.** Cluster A (Tasks 1-4) defines the Option-2 field labels; Cluster B (Tasks 5-7) names them. The dependency is real (Task 5's FAC table references labels Task 1 creates) and the task order honors it.
- **One AC cannot be literally satisfied and is surfaced, not silently bent** (see Open Decision below).

## plan-attack findings and dispositions

- **HIGH — three existing tests break with no fix task.** `test-fac-contract.sh:13` (`committee verdict`), `test-spec-write-skill.sh:9` and `test-stamping-spec-write.sh` (both pin spec-write `v0001`). **FIXED:** test-fac-contract update folded into Task 5; both version-pin updates folded into Task 6 (retarget to `v0002`), each in lockstep with the breaking edit.
- **HIGH — `Transitions to: none` sweep is a no-op** (bold `**` markers defeat the plain pattern; verified `no match`). **FIXED:** Task 7 Step 1 and Task 9 Step 1 now use `grep -F '**Transitions to:** none'`.
- **MEDIUM — `conservator.md:47` has trailing `Team-lead does.`** the shared edit string omits. **FIXED:** Task 8 now gives conservator its own edit string preserving the trailing clause; innovator/pragmatist/purist share the identical line.
- **MEDIUM — `spec-write/SKILL.md:16` Entry Condition left stale** (internal contradiction; `committee verdict` grep misses it via backtick). **FIXED:** Task 6 now edits line 16 explicitly and adds a `verdict (FAC-complete` assertion that genuinely fails pre-edit.
- **LOW — Task 2 Step 2 explanation was inaccurate** (claimed the scribe "names a decision-packet today"; it has none). **FIXED:** wording corrected.
- **LOW — Task 3 lowercase `decision-communication packet` assertion robustness.** **ACCEPTED:** after all Task 3 edits the disambiguated term is present (line 157 + renamed occurrences); the positive check is sound. No change.

## Additional finding from planner sweep (beyond plan-attack)

- **A fourth test break plan-attack missed.** `test-member-warrant.sh:58` pins the exact heading `What a Good Decision Packet Sounds Like` as its locked-surface anchor; the Task 3 line-216 rename breaks it. **FIXED:** Task 3 now updates that anchor to `What a Good Decision-Communication Packet Sounds Like` in lockstep, preserving the guard's intent (the locked surface still exists).
- **Confirmed clean:** the `artifact-template.md` full replacement keeps every `test-design-committee-context-economy.sh` anchor green (Dissent Record header, `mandatory|MUST appear`, the `<!-- MANDATORY` annotation marker, and all scribe verdict/template/alignment-map checks). All four version bumps clear their test floors (team-lead ≥v0008/v0012, design-committee ≥v0018). Version bumps are catalog-safe (skill-index is generated from descriptions, not versions), so only the spec-write description edit triggers one regen.

## AC-8.1 — resolved (designer decision)

The designer added a `version` field convention to `agents/CLAUDE.md` and committed all committee agent files at `v0001` on main. AC-8.1 is now satisfied **literally**: Task 2 bumps the scribe (real behavior change) to **v0002**; the five role agent files and `spec-harden/SKILL.md` carry term-only edits and stay at **v0001** per the convention's "not on typo/term-only edits" carve-out. Task 9's version audit asserts all of these.

## Recommendation

Proceed. The plan is buildable as written; all adversarial findings are mitigated and verified, and the AC-8.1 version question is resolved.

<!-- created-at: 2026-06-17T16:15:24Z -->
<!-- produced-by plan-build@v0007 -->
