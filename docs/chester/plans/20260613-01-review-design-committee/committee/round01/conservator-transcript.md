# Conservator — Round 01

## Question

Where does the canonical per-round numbered sequence live — SKILL.md or team-lead.md?

## Analysis

**Current state: two numbered sequences, one claim of deference.**

SKILL.md:177-198 presents 8 numbered steps and declares them "the canonical per-round sequence (spec §5)." The "(spec §5)" reference is dangling — no spec document exists — but the claim of canonicity is explicit and the boundary is stated: steps 1-3 member-side, steps 4-8 team-lead-side with detail in team-lead.md.

team-lead.md:93-106 re-numbers the full round as 11 steps, then step 2 of that sequence defers to "per SKILL.md Phase 4 § Per-Round Flow." The three extra steps that don't appear in SKILL.md are: ledger bookkeeping (step 3), read-consolidator-output (step 5), and checkpoint + designer-response (steps 10-11). The Consolidator dispatch is split across steps 4 and 5 in team-lead.md but is a single step 4 in SKILL.md.

**Conservator reading: SKILL.md's 8-step sequence already captures the full deliberation skeleton.**

The three "extra" steps in team-lead.md are not missing deliberation steps — they are implementation details the team-lead already owns:
- Ledger update is bookkeeping described in the Ledger subsection of team-lead.md. It belongs there, not in the canonical flow.
- "Read consolidator output" is a sub-action within SKILL.md step 4 (Consolidate). Splitting it into a separate numbered step adds a number without adding structure.
- Designer response (step 11) is the outer Conversation Loop's decision branch, not a step inside a round.
- Checkpoint (step 10) is already stated as a principle at SKILL.md:195-196. Elevating it to a numbered step changes its character from a guard-rail to a peer of deliberation actions.

**The existing structure already works and carries precedent.**

skill-contract.md:24 establishes that SKILL.md is the persistent floor doc — audits compare against it. Inverting authority to team-lead.md would demote the floor doc to a citation while promoting a detail file to the canonical register. That is a structural inversion with no functional benefit. The Conservator does not take structural inversions without evidence that the current arrangement fails.

team-lead.md step 2 already defers correctly — "per SKILL.md Phase 4 § Per-Round Flow." The deference is there. The problem is that team-lead.md then re-enumerates anyway, creating a rival integer sequence. The fix is not to move authority — it is to remove the rival enumeration from team-lead.md and replace it with named, unnumbered callouts.

**Option A preserves what exists and fixes only the collision.**

Option A: SKILL.md owns 8 numbered steps, team-lead.md elaborates by name with no rival integers. This requires the smallest change: team-lead.md's step numbering is dropped in favor of named sections ("Ledger," "Consolidation detail," etc.), matching how the Ledger is already documented. SKILL.md's dangling "(spec §5)" reference is cleaned up, but the sequence itself is unchanged.

Option B (team-lead.md owns the full numbered list, SKILL.md cites it) inverts the floor/detail relationship with no benefit and conflicts with skill-contract.md's explicit statement that SKILL.md is the audit baseline.

## Final Position

```
position: Option A — SKILL.md owns the 8-step canonical sequence; team-lead.md drops rival integers and elaborates by named sections only.
rationale: SKILL.md is declared the persistent floor doc (skill-contract.md:24); team-lead.md step 2 already defers to it. The collision is caused by team-lead.md re-enumerating the round despite that deference. The three "extra" steps are not missing deliberation steps — they are sub-actions and bookkeeping already covered elsewhere. Option A removes the rival enumeration, which is the minimum change that resolves the contradiction without structural inversion.
blocking_risk: LOW. No external file cites step numbers from either sequence. The fix is purely internal to two files. No wrapping skill exists yet to break.
warrant: skill-contract.md:24 (SKILL.md = audit floor); team-lead.md:96 (step 2 self-defers to SKILL.md); SKILL.md:179 (explicit canonicity claim); analysis of team-lead.md extra steps showing each maps to an existing SKILL.md principle or sub-action.
```
