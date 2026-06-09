# Handoff — 20260607-01-update-voice-discipline (pre-compact #2, 2026-06-08)

## THE OPEN DECISION (resume here)

Execution of plan-01 surfaced **two falsified core premises**. Designer is choosing the path forward. Awaiting two answers:

**(a) Path:**
- **Clean restart (my recommendation)** — abandon this worktree/branch, write a corrected design brief capturing the two findings below, run a *light* committee pass, then `design-specify` → `plan-build` → fresh worktree. Carry forward the catalog generator + folded-block fix + catalog test verbatim.
- **Patch-forward (D-extended)** — strip the generator to catalog-only in THIS worktree and finish. Faster, but leaves a build-then-gut history and a spec full of de-scoped ACs.

**(b) If restart, committee weight:** single ratify round, or skip committee and go corrected-brief → design-specify → plan-build. (Either way: NOT another multi-round Delphi — the evidence already decides scope.)

My lean: **clean restart, lightly.** Two premises cracked; the true scope is now small and clear; patch-forward gives neither clean history nor accurate artifacts.

## What execution proved (the two findings — GROUND TRUTH for any fresh spec)

1. **Members can't be single-sourced (→ designer decision D already taken: members EXCLUDED from generator).** A line-level diff of `agents/design-committee-{conservator,innovator,pragmatist,purist}.md` shows shared vs lens-owned bands **interleave ~16×** down the body. The committee-settled "pure two-file concatenation (`lens-<lens>.md` + `member-scaffold.md`)" CANNOT reproduce them — concat gives all-lens-then-all-shared, not the interleave. Incidental: F7 confirmed (Hard-Prohibition items 2–4 lens-owned, items 1 & 5 shared); the closing "Keep field labels exact…" line is NOT byte-identical across all four (Pragmatist/Purist drop a clause).
2. **Reviewer disciplines are mostly per-consumer, not shared (→ DECISION STILL OPEN).** Verified by impl-t4 before authoring:
   - **Confidence ladder** — `execute-write-spec-reviewer.md:66-73` vs `execute-write-quality-reviewer.md:69-77` differ by **13 lines**; near-zero shared text. No skeleton to lift; folding needs a forced canonical band = semantic rewrite.
   - **Evidence standard** — `plan-build-plan-attacker.md:72-80` vs `plan-build-plan-smeller.md:62-69` share only a thin opener ("Every finding must cite:") + closer ("…drop the finding…"), with **reviewer-specific bullets between them**. Generator appends whole `##`-section fragments → cannot splice a local fragment mid-section. Only the evidence-CITATION wording is cleanly foldable (and it's the one convergence the spec sanctions).
   - **Independence** — shared text exists only in spec-reviewer's `## CRITICAL: Do Not Trust the Report`; attacker + plan-reviewer carry local prose. Foldable for one reviewer.
   - **SPEC/PLAN CONTRADICTION** — spec `AC-8.1:193-195` sanctions ONLY the evidence-citation convergence and says "Any other discipline-text convergence is allowed only if enumerated **here**." Plan-01's F4 added a confidence-ladder "Convergence 2" to the PLAN but the SPEC was never amended. Must be resolved (drop F4, or amend spec) under any path.

**The thesis that held vs cracked:** "shared instruction text is duplicated & drifting, single-source it" holds for **catalog, voice-rules, CLAUDE.md** (genuine duplication) but NOT for **members or reviewer-disciplines** (mostly intentional per-consumer variation). True refactor scope going forward ≈ catalog generator + verify trigger + voice-rule canonical homes + CLAUDE.md dedup (ACs 4.1/5.1/6.1/7.1 + a much-reduced 1.1).

## D-extended ("reviewers out") ramifications (analysis already given to designer)

- Generator becomes **catalog-only**. ~half of Task 1 (`emit_agent`, `extract_section`, `--agents-only`, `HEADER`) becomes dead → strip it (clean, small rework) or keep as unused-but-tested capability (YAGNI smell). Recommend strip.
- Can't "just uncommit" T1/T2 — catalog (keep) was built on top of agent-mode (drop) in the **same file**; `git reset` would delete the catalog generator too. It's a deliberate edit-down, ~20 min, one commit. `emit_catalog` does NOT call `extract_section`/`emit_agent`, so the strip is clean.
- ACs 1.1/2.1/3.1 collapse to infra-only/de-scoped; 4.1/5.1/6.1/7.1 still deliver. Loses ongoing drift-protection for the evidence-citation case (still hand-fixable once, just not guarded).

## Execution state (worktree)

- Worktree: `.worktrees/20260607-01-update-voice-discipline`, branch `20260607-01-update-voice-discipline`.
- Commits: base `6c7991b` → `326623e` (T1 generator core) → `1c9b071` (T2 catalog mode). HEAD = `1c9b071`. **29 tests green.**
- **T1 ✓** generator core (agent + catalog modes). Spec review Pass; quality review found 2 Important (temp-trap leak, asymmetric section-source check) — both fixed + amended.
- **T2 ✓** catalog mode. Spec review Pass (F1 `tmpl_abs` bind confirmed). Quality review found a **Critical (conf 98)**: the awk description extractor broke on YAML `description: >` folded blocks — **9 of 23 real SKILL.md files use them** (committee's "single scalar" premise was false). FIXED: emit_catalog now folds block scalars; added `charlie`(folded)+`delta`(quoted) test fixtures; quoted the `$CHESTER_ROOT/$glob` expansion. All amended into `1c9b071`.
- **T3 VOID** (decision D — no member sources, no commit).
- **T4 BLOCKED** (reviewer finding above — no files authored, no commit).

**CARRY-FORWARD (valuable, transfers to any path):** `emit_catalog` + the folded-block handling + glob-quoting fix in `chester-util-config/chester-generate-agents.sh`, and `tests/test-generate-catalog.sh`. These are the genuinely hard-won, correct pieces.

## Plan-01 edits already made (in working/, for decision D — reviewers still IN)

Architecture (members-not-generated para), Task 3 VOIDED, Task 7 (manifest = reviewers+catalog only), Task 8 (exclusion list += 4 members), build-seq summary, change-log entry. **WARNING:** these edits assume D (members out, reviewers in). If path = D-extended or restart, plan-01 needs further surgery or replacement — do NOT treat current plan-01 as final.

## Committee / team state

- Round 03 verification COMPLETE earlier this session: plan-01 verified **4-0 CLOSES**; round-02 + round-03 artifacts + ledger + plan-01 all stamped `design-committee@v0018`. Ledger round-03 entry written.
- Team `dc-plan-adequacy` still ALIVE. Stranded `consolidator-r03` blocks `TeamDelete` (its agent type lacks SendMessage — see [[project_committee_teardown_gap]]). impl-t1/t2/t4 (general-purpose) may be idle/alive; impl-t3 shut down. All die at session end. On restart a fresh committee would be a new team.

## Memory flag — VERIFY BEFORE TRUSTING

`memory/project_committee_teardown_gap.md` was auto-edited this session to claim the teardown gap was "FIXED in skill v0019" with specific edits to `team-lead.md`/`SKILL.md`. **I did NOT make those skill edits.** Treat that claim as unverified — check the actual skill files before relying on it.

## Constraints carried

- Reviewers/attackers read ONLY main branch + current worktree.
- No AskUserQuestion / numbered menus — plain prose. No ASCII tables — bulleted lists. Two-part questions must not collapse to ambiguous yes. Never cd to main repo during worktree session (use `git -C`).
- Caveman full for chat; code/commits/security normal. Explanatory output style (★ Insight blocks).

## Immediate next action after compact

Re-read this file. Re-pose the open decision (a)+(b) if unanswered. Then execute the chosen path. Do NOT silently continue execution — the path is the designer's call.

<!-- created-at: 2026-06-08 (pre-compact #2) -->
