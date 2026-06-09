# Feature Dev 01 — Collapse the reviewer disciplines into one cited module

- **Recommendation strength:** Strong
- **Dependency category:** in-process (pure instruction text)
- **Architecture move:** turn N shallow copies of a rule into one deep module behind a citation seam

## Summary

Three reviewer disciplines are restated, with drift, across seven files: the **evidence-citation rule**, the **≥80 confidence ladder**, and the **independence / "don't trust the report" rule**. Extract each into a single canonical reference and have every reviewer cite it load-bearing — the pattern `util-design-partner-role` already proves.

## Current state (verified)

The same three rules appear inline in these files:

| Discipline | Locations (file:line) |
|---|---|
| Cite real evidence; drop findings without it | `agents/plan-build-plan-attacker.md:74-78`, `:95` · `agents/plan-build-plan-smeller.md:62-69`, `:83` · `agents/execute-write-spec-reviewer.md:73` · `skills/plan-attack/SKILL.md:79-86`, `:114-115` · `skills/plan-smell/SKILL.md:90-98`, `:122-123` · `skills/util-codereview/SKILL.md:62-70`, `:86` |
| ≥80 confidence ladder (0–25 / 25–50 / 50–79 / 80–100, report only ≥80) | `agents/execute-write-spec-reviewer.md:64-73` · `agents/execute-write-quality-reviewer.md:68-77` |
| Independence — verify against code, do not trust the implementer's report | `agents/execute-write-spec-reviewer.md:18-31` · `agents/plan-build-plan-reviewer.md:51` (as a discipline bullet) |

**Drift already present.** The evidence rule is reworded at each site — "evidence from the codebase" (plan-attack) vs "plan text, proposed class/method names, file paths" (plan-smeller) vs "file and line number(s)" (util-codereview). The confidence ladder's band labels differ between the two reviewer agents (spec-compliance language vs quality language) while the thresholds are identical.

## The friction (deletion test)

Delete the evidence rule from `plan-attack/SKILL.md`: the rule immediately reappears in six other files — it was never a deep module, just one of seven copies. Every wording fix today is a seven-file edit; in practice the edits are not kept in lockstep, which is why the wording has drifted. No **locality**.

## Proposed change

Create one canonical home per discipline (or one combined file):

- `skills/<host>/references/review-discipline.md` containing three named sections:
  - **Evidence standard** — every finding cites a concrete file path / line / code reference or is dropped.
  - **Confidence ladder** — the 0–25 / 25–50 / 50–79 / 80–100 bands and the "report only ≥80" gate, stated once, with a one-line per-role interpretation slot.
  - **Independence** — reviewers verify against the actual artifact (code, plan, diff), never the implementer's report.

Each reviewer's interface keeps only its **domain** — what to attack, what to smell, what spec-check — and cites the shared discipline. **Leverage:** one interface, seven call sites. **Locality:** the ≥80 rule has exactly one home; drift becomes structurally impossible, not merely discouraged.

## Seam decision (must settle first)

The citation seam behaves differently for the two consumer kinds:

- **Skills** (`plan-attack`, `plan-smell`, `util-codereview`) inject at run time: the SKILL.md instructs "Read `references/review-discipline.md` before reviewing." This is the proven `util-design-partner-role` pattern — a real seam.
- **Named subagents** (`plan-build-plan-attacker`, the two `execute-write-*` reviewers) are dispatched *as* their `.md` prompt. They cannot read a sibling file unless told to do so as their **first action**. Options:
  1. **Read-as-first-action** — agent prompt opens with "Before reviewing, read `<path>`." Run-time seam, but adds a tool round-trip per dispatch and assumes the path resolves from the agent's working dir.
  2. **Authoring-time template** — the discipline lives in one source; agent files are generated/assembled from it. One adapter (the generator), so this is closer to indirection than a live seam.

This decision is shared with Feature Dev 02. Settle it once for all agent-side instruction sharing.

## Implementation tasks

1. Write `references/review-discipline.md` with the three sections, reconciling the drifted wording into one canonical phrasing per rule.
2. Decide the agent-side seam (read-as-first-action vs authoring-time template); record the choice.
3. Replace the inline blocks in the three review **skills** with a load-bearing "Read" citation.
4. Apply the chosen agent-side mechanism to the four reviewer **agents**.
5. Keep per-role specifics (what each reviewer hunts for) inline — only the shared disciplines move.
6. Bump `version` on every edited SKILL.md.

## Verification

- `grep -rn "80" agents skills` shows the ladder defined in exactly one place.
- Each reviewer file no longer restates the evidence/confidence/independence prose; it cites the reference.
- Dispatch one reviewer end-to-end (or dry-read its prompt) and confirm the discipline is reachable.

## Risks & open questions

- Read-as-first-action depends on path resolution inside subagent context — verify before committing to it.
- Pedagogical repetition ("this is the single most important rule") is partly intentional; preserve one emphatic line in the reference rather than scattering it.

## Out of scope

- The per-reviewer domain content (attack/smell/spec/quality lenses).
- Fork-policy decisions (already correctly handled via local note + authority doc).
