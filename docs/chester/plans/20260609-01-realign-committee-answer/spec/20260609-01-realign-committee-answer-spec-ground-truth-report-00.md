# Ground-Truth Report — Realign Design-Committee to Answer-Delivery

**Spec reviewed:** spec-01 (`20260609-01-realign-committee-answer-spec-01.md`)
**Reviewer:** ground-truth-reviewer (general-purpose dispatch), design-specify chain.

**Status:** Findings — 1 MEDIUM (fixed in spec-02). All structural claims confirmed.

## Verified Claims

- All referenced file paths exist: `team-lead.md`, `SKILL.md`, `committee-analysis-round-format.md`, `artifact-template.md`, `member-protocol.md`, `skill-contract.md`, all seven `agents/design-committee-*.md`, `util-design-partner-role/SKILL.md`.
- Versions: `team-lead.md` v0009 (team-lead.md:8); `SKILL.md` v0019 (SKILL.md:4). Bumps to v0010 / v0020 are correct.
- Five no-collapse / decision-menu doctrine sites confirmed at claimed lines: Behavioral Constraints (team-lead.md:121), Split adjudication (191), Consolidation Rules (304), Presentation Rules "Surface options, not verdict." (308), Self-Evaluation (320). Doctrine confined to `team-lead.md` — absent from `SKILL.md` and `committee-analysis-round-format.md`.
- Locked four-block decision format + Style Exemplar in `team-lead.md` §Visible Surface: Summary (152), Information Package (161), Decision Package (167), Team-Lead Comments (193), Style Exemplar (202), spanning ~148–274.
- `artifact-template.md` is the scribe's separate artifact (Summary/Verdict/Rationale/Dissent Record/Deferred-Open at 21/25/29/33/42) — distinct from the decision-communication packet, as spec-01 asserts.
- SKILL.md Modes at 129–132; Phase 2 Capture mode line at 66.
- `verdict.md` and `alignment-map.md` are team-lead-owned round artifacts (team-lead.md:106, committee-analysis-round-format.md:32–37) — warrants can ride on them with no new file.

## Findings

- **MEDIUM: prior-art "two-surface" term-collision attributed to the wrong sprint.**
  - Spec-01 said: the colliding "two-surface" usage is from sprint `20260606-01-update-committee-context-management` (spec-01 lines 25, 47, 70, 129; design brief key-decision 6).
  - Ground truth: a full grep of `20260606-01` (working + plans) for "two-surface"/"two surface" returns nothing — it uses "surface" only generically. The literal hyphenated term "two-surface" appears in sprint `20260521-02-design-architect-committee` ("citation-discipline two-surface enforcement", `docs/chester/working/20260521-02-design-architect-committee/design/skill-files-design-brief-00.md:164`).
  - Impact: C-NAMING's guard intent (pick a distinct term) holds, but its cited collision source is wrong. A plan-build author grepping `20260606-01` would find nothing and might conclude the collision is imaginary or pick a term that collides with the real `20260521-02` usage.
  - Resolution: spec-02 corrects the attribution to `20260521-02-design-architect-committee` across C-NAMING, Components, Goal/Data-Flow mentions, and the Error Handling note.

## Risk Assessment

Every structural claim about file existence, versions, the five doctrine sites and their exact lines, the locked-format-vs-scribe-template location split, the SKILL.md mode lines, and team-lead ownership of `verdict.md`/`alignment-map.md` is factually accurate; the spec-01 adversarial corrections match ground truth. The lone defect was a misattributed prior-art sprint ID behind C-NAMING — corrected in spec-02. The realignment's core edits are sound and ready for planning.

<!-- created-at: 2026-06-09T13:38:34Z -->
<!-- produced-by design-specify@v0004 -->
