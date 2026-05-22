# Evaluation Brief: Refactor Summary Skill Creation

**Date:** 2026-04-05
**Type:** Refactor — process capture as a skill
**Scope:** New skill `chester-util-refactorsummary/SKILL.md`

## Origin

During the review skill rationalization (see `20260405-01-review-skill-rationalization/`),
we produced three documentation artifacts (evaluation brief, session summary, reasoning audit)
to record the refactoring work. The process of creating those artifacts — deciding on the
directory structure, choosing the evaluation brief as the starting document, adapting
Chester's summary and audit conventions — was done manually with no skill guidance.

The user recognized this as a repeatable workflow worth capturing: any future refactoring
effort would need the same three artifacts in the same structure.

## Scope

**In scope:**
- New skill: `chester-util-refactorsummary/SKILL.md`
- Output directory convention: `docs/refactor/YYYYMMDD-##-word-word-word/`
- Three artifact templates: evaluation brief, session summary, reasoning audit

**Out of scope:**
- Modifications to existing Chester skills (chester-finish-write-session-summary, chester-finish-write-reasoning-audit)
- The refactoring work itself — the skill only documents, it doesn't execute

## Decision

Created a self-contained skill that writes all three artifacts inline rather than
orchestrating the existing session-summary and reasoning-audit skills. The existing
skills assume `CHESTER_PLANS_DIR` as their output directory and have format conventions
(sprint naming, plan file copying) that don't fit the refactor context. Writing inline
lets the skill control the full output with formats adapted for refactoring work.

The evaluation brief uses a flexible template: three required sections (Scope, Decision,
Artifacts) that every refactor needs, plus optional sections (Hypothesis, Methodology,
Key Data, Migration Notes, Before/After) that adapt to the refactor type. This was a
deliberate design choice to avoid locking the template to our benchmark-driven refactor
pattern — tech debt cleanups and dependency upgrades need different flexible sections.

The skill trigger was narrowed to explicit "write a refactor summary" phrases rather
than broad intent matching, to avoid conflicts with the existing session-summary skill
for feature work.

## Artifacts

- `chester-util-refactorsummary/SKILL.md` — the skill (210 lines)
- Commit `f772570` — feat: add chester-util-refactorsummary skill
