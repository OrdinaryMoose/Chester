# Alignment map — round 01

**Question:** Should the design-committee per-round flow's canonical numbered sequence live in SKILL.md or team-lead.md?

**Answer-shape marker:** CONVERGED (4-0, warranted — not count-driven; each side supplies an independent verified warrant).

## Alignment pattern

- **Option A — 4 (Conservator, Innovator, Pragmatist, Purist).**
- **Option B — 0.**
- **Option C (status quo) — 0.**

All four advocacy lenses land on Option A from independent reasoning (floor-stability, category-integrity, cost, re-framing). No split to preserve.

## Option set

1. **Option A — SKILL.md owns the 8 numbered steps; team-lead.md elaborates by step name, no rival integers.** CHOSEN.
2. **Option B — team-lead.md owns the full numbered list; SKILL.md cites it.** Discarded.
3. **Option C — status quo (both files keep their own numbered lists).** Discarded.

## Positions discarded, with reason

- **Option B discarded** — inverts the floor/detail relationship. skill-contract.md makes SKILL.md the persistent audit floor that wrapping skills compare against; moving the canonical sequence into a role-execution reference makes the floor depend on an elaboration doc. No benefit offered against that cost. *(Warrant: evidence — skill-contract.md floor rule; logic — authority inversion.)*
- **Option C discarded** — sustains the live self-contradiction on every invocation (team-lead.md:96 defers to SKILL.md, then re-numbers). Does not resolve the question. *(Warrant: evidence — team-lead.md:95-96 on the face of the text.)*

## Warranted assertions (member-supplied, team-lead-verified)

- **SKILL.md is the canonical floor.** Warrant type: evidence. Source: skill-contract.md §Contract Floor (SKILL.md = persistent audit baseline, wrapping skills compare against it). Supplied by all four; verified present.
- **team-lead.md already defers to SKILL.md, then contradicts itself.** Warrant type: evidence. Source: team-lead.md:96 step 2 ("Per-round flow runs — per SKILL.md Phase 4 § Per-Round Flow") set against its own 1-11 renumbering at 93-106. Supplied by all four; verified.
- **The 3 "extra" team-lead steps are not missing deliberation steps.** Warrant type: logic + evidence. Source: ledger (step 3) = bookkeeping with its own § Ledger; read-output (step 5) = sub-part of Consolidate; checkpoint (step 10) = principle already at SKILL.md:195; designer-response (step 11) = outer Conversation Loop. Each maps to an existing home. Supplied by all four; verified.
- **Blocking risk is low — no external citation of either step list exists, no wrapping skill yet.** Warrant type: evidence. Source: grep across skills/ agents/ docs/ found zero "step N" citations of either flow. Supplied by all four; verified.

## Convergent extensions beyond the bare answer (raised by ≥1 member, not contested)

- **Remove the dangling "(spec §5)" reference at SKILL.md:179** — cited by Innovator, Pragmatist, Purist. No spec doc exists in the tree; the canonicity claim is currently unverifiable. Fold into the same edit pass.
- **Disaggregation-by-function, not just authority assignment** (Innovator) — relocate the 3 phantom entries to their natural homes (§ Ledger, § Internal Discipline, § Conversation Loop) rather than merely deleting them, so no instruction is lost.
- **Ledger-miss mitigation** (Innovator) — when the ledger update leaves the numbered flow, retain it in § Ledger with an explicit "at the round boundary" trigger so a team-lead does not skip it.
- **Forward-only risk argues for doing it now** (Purist, blocking_risk: medium) — the migration cost is zero today, but if a wrapping skill is authored against either numbering before the fix lands, the contradiction becomes load-bearing.
