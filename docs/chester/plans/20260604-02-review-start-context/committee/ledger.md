# Committee Ledger — review-start-context

Cross-round running record. Minimal by design. Disk is source of truth; round folders hold detail.

## Consultation

- **Sprint:** 20260604-02-review-start-context (standalone, no master).
- **Subject:** token-frugal start sequence — `setup-start` housekeeping + SessionStart hook payload.
- **Prior record:** `design/committee-analysis-01.md` (two rounds, 2026-06-04). Round 1 covered both surfaces (start-seq + master-plan); master-plan parked. Follow Up 01 narrowed to start-seq and **adjudicated Option 1**: trigger-split (full body on `startup|clear`, mandate-only stub on `compact`) + first-run wizard gated off established-project payload; split-and-keep (do NOT strip the `compact` trigger).

## round01 — validation against landed commits (2026-06-05)

- **Question:** Does the adjudicated Option-1 design still hold after the 40 commits in range `099d46c..1265069`, and what must update?
- **Members returned:** conservator, innovator, pragmatist, purist, researcher (5/5).
- **Alignment: 5-0 — design HOLDS, implement Option 1 as adjudicated.** No member proposed a design change. No new framing opened; no premise broke.
- **Ground-truth (Researcher, DECISIVE):** `hooks/hooks.json`, `chester-util-config/session-start`, and the injected `setup-start` body are bit-for-bit unchanged across the range. Only `setup-start` delta is a frontmatter version bump (`v0001→v0002`, `dd035d2`), stripped before injection. The `20260605-01` design-large-task scrub sprint + `design-architect-committee` archive (`b1f8d08`) are orthogonal. Token measures still accurate (~417 core floor, ~1,557 deferrable, ~8,154 total). No new per-session injection introduced.
- **Side-finding (Purist raised, Researcher + team-lead confirmed):** `skills/setup-start/references/skill-index.md:29` still lists the archived `design-architect-committee` skill (uses banned "Mode B" vocabulary). `dd035d2` claimed "sync skill-index entries if stale" but the changeset never touched the file. NOT a design change — a one-line catalog fix. Purist weights it higher (mandate names skill-index as the routing authority post-compaction; a stale entry is a behavioral error firing exactly when the design exists to protect). Researcher classes it doc-staleness non-blocker. No disagreement on the fix, only on severity.

## round02 — spec development (DEVELOP, 2026-06-05)

- **Task:** develop the specification for the adjudicated trigger-split design (designer directed two rounds: develop + attack + write spec).
- **Members returned:** 5/5. Consolidated `round02/consolidator-output.md`.
- **Axis A (stub location) three-way split:** heredoc (Innovator, Pragmatist) / runtime extraction (Conservator) / separate file (Purist).
- **Converged:** trigger field `.trigger` (not `hook_event_name`); jq present; fallback any-non-compact → full payload; Skill Types unanimous IN the stub (~49 tok; post-invocation adaptation failure mode); Choosing Between Skills OUT; Check 2 (`git check-ignore`) joins Check 3 (`sed`) as keep-verbatim (glob-blind reconstruction risk); startup trim saving revised down to ~80–100 tok; stub ~706–751 tok.
- **Output:** team-lead wrote `round02/draft-spec.md` (provisional fork picks: separate file + sed-strip wizard) as the attack target.

## round03 — spec attack (ATTACK, 2026-06-05)

- **Task:** adversarially attack the draft spec. Last round — kill-shots or confirm survival.
- **Members returned:** 5/5. Consolidated `round03/consolidator-output.md`.
- **Draft DAMAGED, two axes flipped:**
  - §3.3 stub location → **heredoc** (separate file killed: path-dependency silent-failure; T8 works against either; no correctness gain).
  - Drift test → **bidirectional/marker-anchored** (Conservator kill-shot: per-block verbatim T8 + size-ceiling T9 are *addition-blind* — the round01 stale-catalog bug class; must catch a new SKILL.md mandate block uncopied to the stub). T9 dropped as redundant; T8 made bidirectional.
- **FALSIFIED (Researcher, DECISIVE):** the draft's "heading-to-heading sed strips only the wizard" is structurally impossible — wizard + checks share one `## Session Housekeeping` heading and a shared `eval`; line ~113 is the indented else-branch, not a new item.
- **§3.5 first-run gating — NOT converged (open):** wizard-extraction (Innovator) / wide-strip whole housekeeping (Pragmatist, Researcher — drops auto-heal checks on established startup, beyond adjudicated scope) / narrow-strip+relabel (Purist — fragile prose anchor). Pragmatist↔Conservator peer DM on the checks trade-off.
- **Survived attack:** trigger detection, fallback, stub membership (8 blocks), injection contract, hooks.json + test-compaction-hooks.sh contracts. Pragmatist: "draft survives, no kill-shots, T8 feasible (~25 lines, tested)."

## Output

- **Spec written:** `spec/20260604-02-review-start-context-spec-00.md`. Everything settled except §6 (first-run gating mechanism) carried as one open designer decision, Option A (wizard extraction) recommended.

## Open questions

- None blocking. Spec `spec/20260604-02-review-start-context-spec-00.md` is Ready for plan-build.
- Pending designer: hand spec to `plan-build`; authorize committee teardown.

## Designer decisions

- **2026-06-05** — chose Option 1 (fix stale `skill-index` catalog line this sprint; committed `0e79b85`), then directed two committee rounds (develop + attack) to write the spec.
- **2026-06-06** — §6 first-run gating: chose **Option B (wide-strip)**. Established-project startup strips the whole `## Session Housekeeping` block; verification Checks 0–3 retire from the live path and are removed from SKILL.md (committee leaned B; designer confirmed after detailed walk-through). Spec finalized (change-log entry 01).
