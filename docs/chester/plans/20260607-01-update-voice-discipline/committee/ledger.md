# Committee ledger — instruction-injection architecture

## Round 01 (two-round Delphi)

- **Members returned:** conservator, innovator, pragmatist, purist (+ researcher, front-loaded).
- **Question:** canonical mechanism to store + inject shared instruction text per consumer kind, optimized for strength of agent direction (no drift); DRY/SOLID subordinate.
- **Decisive fact (researcher, proven):** runtime-read of sibling refs works in dev (CWD = repo root) but fails in production (CWD = user project). Current agent citations already production-broken.
- **Alignment:** settled 4-0 R1 on parent-skills=runtime-read and CLAUDE.md=two-tier pointer. Agent-side crux resolved R2 to build-time generator — 2 firm (pragmatist, purist), 1 non-blocking concession (innovator), 1 dissent (conservator, DTI). Skill catalog 3-1 generator-from-frontmatter.
- **Verdict:** mixed binding-time-explicit architecture; build-time generator for agent-side stable instruction; DTI retained for runtime-varying dispatch content; runtime-read for parent-skills; two-tier pointer for CLAUDE.md; generate catalog from frontmatter. MANDATORY companion: regeneration trigger (generator + verify test).
- **Designer decision:** ADJUDICATED — verdict accepted; regeneration trigger committed in-scope. Proceed to design-specify.

## Round 02 (two-round consult — R1 analyze plan adequacy)

- **Members returned:** conservator, innovator, pragmatist, purist (+ researcher, front-loaded).
- **Question:** Is plan-00 sufficient for the size of the voice-discipline refactor — where under-scoped, structurally weak, missing tasks?
- **Decisive fact (researcher, quantified):** 27 files touched (14 new / 13 regenerated), 10 tasks; but 3 HIGH threat findings (F1 tmpl_abs unbound, F2 placeholder-substitution mechanism missing, F3 fail() test-convention) have NO fix-task in any of the 10 tasks. Task 7 manifest still wires the invalid Stance-extraction fragment. 4 of 10 tasks carry complete code; T3/T4/T6/T7 prose-only.
- **Alignment:** Functionally 4-0 plan-00 not executable unchanged. Initial 3-1 remedy split (amend vs re-decompose) COLLAPSED in peer-DM to 4-0 once F2 was re-diagnosed: defect is impure source partition, not missing generator mechanism. Fork on parallel-labels (scaffold+substitution vs lens-verbatim) resolved 4-0 to lens-verbatim (Conservator conceded). Team-lead mis-recorded a "scoped Stance stitch"; Pragmatist+Purist flagged; corrected to lens-verbatim/no-stitch.
- **Verdict:** Amend in place, no renumber. F2 = boundary-redraw (all per-lens text incl. full interleaved Stance block → lens files verbatim; member-scaffold thin; generator pure concatenation; T1 unchanged; nothing extracted from util-design-partner-role for members). Amendments: T3 partition guidance, T7 manifest (drop Stance fragment), T2 F1 fix, T5/T10 F3 inline-exit, F4 enumerate 2nd convergence, T6 flat-alphabetical (F5), F6 leading-blank strip, F7 items-2-4, + partition test (Purist). util-design-partner-role single-source preserved via consumer-category distinction.
- **Round 03 (improve+write):** team-lead authored `plan/...-plan-01.md` applying all amendments + change log. Supersedes plan-00.
- **Designer decision:** "proceed" → plan-01 written. Pending: verification path (committee verify vs fresh plan-attack vs execute-write) + committee closure.

## Round 03 (verification — does plan-01 close every round-02 gap?)

- **Members returned:** conservator, innovator, pragmatist, purist (live team reused; no re-spawn).
- **Question:** Does plan-01 correctly IMPLEMENT the round-02 settled verdict — every gap closed, boundary-redraw realized in executable steps, no residual defect? Verification pass, not re-litigation.
- **Alignment:** Unanimous **4-0 CLOSES.** No RESIDUAL-GAP, no blocking defect filed. Each member verified against their own round-02 lens: Conservator (amend-in-place preserved verified assets, T1 core unchanged), Innovator (ordering hazard closed — T7 diff anchored to pre-refactor files), Pragmatist (F1/F2/F3 concrete in executable steps, not prose), Purist (boundary-redraw clean, both AC-8.1 convergences enumerated, manifest drops Stance fragment).
- **Sole non-blocking note:** partition test `test-source-partition.sh` greps four lens names + one Stance sentinel; lens-owned bands carrying neither (Hard-Prohibition items 2–4, Output-Format labels) wouldn't trip it alone. Resolved 4-0 in peer-DM: T7 Step 3 byte-identity diff vs pre-refactor files is the real semantic gate (a scaffold leak hands all four members the donor's identical bands → 3-of-4 mismatch → rejected). Two-gate cover. Disposition: OPTIONAL hardening (extend partition test to the non-named lens-owned bands), not a defect; execution not blocked.
- **Verdict:** plan-01 verified executable; ready for `execute-write` (subagent mode per plan header). Adequacy doubt retired.
- **Designer decision:** Closure approved, then proceed to execute-write. Round-02 + round-03 artifacts + ledger + plan-01 stamped `design-committee@v0018`. Team `dc-plan-adequacy`: 5 members + scribe gracefully shut down; ephemeral consolidator-r03 could not (its agent type lacks SendMessage → cannot send shutdown_response → `TeamDelete` blocked). Stranded ephemeral holds no live context, clears at session end. Skill-gap recorded for fix (spawn ephemerals without `team_name`). Handed off to execute-write (plan-01, subagent mode).

## Round 04 (one-round consult — correct the spec after execution falsified two premises)

- **Members returned:** conservator, innovator, pragmatist, purist (name-less one-shot dispatch — no team created, so no teardown wedge; researcher not needed, findings already ground-truth).
- **Question:** Given members are out (settled, decision D) and reviewer disciplines proved mostly per-consumer, should the corrected spec commit the generator to catalog-only or catalog + a narrowed reviewer-discipline fold — and which ACs drop / reduce / stay?
- **Ground truth fed in:** members interleave shared/lens ~16× (un-concat-able); reviewer confidence ladders differ ~13 lines, evidence sections unspliceable mid-`##`; only evidence-citation wording cleanly foldable; spec-00 AC-8.1 vs plan-01 F4 contradiction (plan added an unauthorized 2nd convergence).
- **Alignment:** **3-1.** Catalog-only — Conservator, Pragmatist, Purist (stasis / cost / category lenses converge independently). Catalog + fold — Innovator (dissent: agent-mode code already paid for; dropping it forfeits drift guard without recovering simplicity).
- **Verdict:** Adopt catalog-only. Drop AC-2.1 + AC-3.1; reduce AC-1.1 / AC-5.1 / AC-8.1 to catalog scope; keep AC-4.1 / AC-6.1 / AC-7.1; resolve the contradiction by dropping plan-01's Convergence 2 and rescoping AC-8.1 to catalog equivalence. Strip the generator's agent-mode machinery; reviewer/member files stay hand-authored.
- **Designer decision:** ADJUDICATED option 1 (catalog-only). Spec rewritten to `spec/...-spec-01.md` (supersedes spec-00). Directed: pass to plan-build, skip smell; keep committee OPEN. Code exploration restricted to main branch + current worktree.

## Open / deferred

- FD-05 (review-loop control flow) — out of scope.
- Evidence-citation per-reviewer phrasing variants — settle at authoring time in canonical review-discipline.
- Section structure for PM Litmus + Research Boundary within util-design-partner-role — downstream authoring.

<!-- created-at: 2026-06-07T11:12:09Z -->
<!-- produced-by design-committee@v0018 -->
