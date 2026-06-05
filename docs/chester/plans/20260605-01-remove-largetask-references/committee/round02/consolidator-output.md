# Consolidator output — round 02

## Alignment

All four members + Researcher on Path A (ratified); no dissent on path. Structural alignment on action-category grouping (3 explicit: Innovator, Purist, Pragmatist; Conservator does not contest): Innovator, Purist, Pragmatist | Conservator (no contest). Two-level test structure confirmed by Innovator-Purist DM exchange.

Full roster on Path A: Conservator, Innovator, Pragmatist, Purist.

---

## Per-member summary

- **Conservator:** Authored four Constraints, five Non-Goals (each with rationale), six regression-guard ACs (RG-1 through RG-6) covering each re-point obligation, and four test lockstep guards (TS-1 through TS-4); flagged write-session-metadata.sh behavioral question to Purist and recorded Purist's resolution (documentation-only AC, script field defer).
- **Innovator:** Proposed the Goal paragraph (one sentence), authored the Components section structured by four action categories (re-point, delete, deliberate rewrite, archive) plus test lockstep with file enumeration inside each, and validated that action-category grouping is correct for this sprint because the primary risk is inconsistent rule application.
- **Pragmatist:** Authored Testing Strategy section and five test-lockstep ACs (AC-T1 through AC-T5); read each of the four pinning tests in full and extracted exact grep strings, including flagging that test-artifact-schema-provenance carries a third change (version assertion must update from v0002 to v0003 in lockstep with the schema bump).
- **Purist:** Authored the full AC decomposition: AC-1.x (6 re-point ACs), AC-2.x (8 delete ACs), AC-3.x (1 archive AC), AC-4.x (4 test-lockstep ACs), AC-5.x (1 version-bump AC), AC-6.x (1 suite-green capstone) — 21 ACs total; enforced the rule that AC-1 and AC-2 must never share an observable boundary.
- **Researcher:** Delivered exact edit anchors (file path, line number, current text, replacement or deletion instruction) for all twelve re-point and delete sites, the archive site, the fork-policy row range (lines 14–20), the four test edits, and the six version-bump targets; flagged the setup-start sync gap and the util-worktree version-bump borderline case.

---

## Notable quotes

- **Conservator:** "Committing the skill scrub before the test updates leaves the suite red; committing the test updates before the skill scrub leaves the tests asserting a truth that doesn't yet exist. The only safe order is a single commit that contains both. This is a structural constraint, not a preference."
- **Innovator:** "Action-category grouping is the right choice for this sprint because the primary risk is inconsistent rule application, not implementation complexity."
- **Innovator (Purist DM reply recorded):** "Sprint-level gate confirmed. Adds a load-bearing distinction: AC-4.x (test lockstep) carries per-test pass assertions — those check 'did I update the right grep.' The sprint-level full-suite gate checks 'did updating this test break something adjacent.' Neither subsumes the other. Two-level structure: per-test pass assertions inside the lockstep component, full-suite green as the sprint-level capstone."
- **Pragmatist:** "No AC requires human judgment to evaluate. All are bash-runnable from the repo root."
- **Pragmatist (version bump flag):** "The current test asserts `version: v0002`. After this sprint's bump, the schema will be at `v0003`. The test must be updated to match. This is not aspirational — the exact string to update is `grep -q '^version: v0002'` → `grep -q '^version: v0003'`."
- **Purist:** "The Purist concern is that AC-1 and AC-2 must not share an observable boundary. Re-point leaves something in place (design-small-task present); delete leaves nothing. A test checking only 'design-large-task absent' passes for both, hiding whether the re-point actually landed."
- **Purist:** "A spec that collapses these into a shared 'large-task absent' boundary would pass green even if the re-point edits were accidentally omitted."
- **Researcher (util-worktree borderline):** "Researcher finding: the deletion removes a caller that no longer exists, which is factually correcting the Integration section. On balance, this qualifies as a contract change (the declared caller list changes). Bump to v0002 if the spec treats Integration sections as contract."
- **Researcher (setup-start gap):** "Researcher did not read setup-start/SKILL.md in this pass. Spec author must include that sync as an edit site."

---

## Points of agreement reached (peer-DM and cross-member)

- **AC grouping by action-category** — Innovator proposed; Purist confirmed via DM; Pragmatist's per-test ACs map directly onto the same categories; Conservator's RG/TS structure is compatible.
- **Two-level test structure** — Innovator and Purist confirmed via DM: AC-4.x per-test pass assertions and AC-6.1 full-suite capstone are distinct and neither subsumes the other.
- **write-session-metadata.sh scope resolved** — Conservator flagged; Purist answered: documentation-only AC (remove prose reference in start-bootstrap line 92); script field rename (`designLargeTask` → `designSmallTask`) and log-query path update deferred to follow-up sprint.
- **test-ac-4-1-fork-policy-pole-rows archived, not edited** — all four members and Researcher agree: no surviving redirect target exists; archive is the correct disposition.

---

## Unresolved or flagged items

- **util-worktree version bump (borderline):** Researcher flagged as undecided — deleting a stale caller bullet from Integration may or may not qualify as a contract change warranting a version bump. Purist's AC-5.1 does not include util-worktree; Researcher says spec author must decide.
- **setup-start sync gap:** Researcher confirmed that start-bootstrap and design-specify description changes must be mirrored in setup-start/SKILL.md, but Researcher did not read setup-start in this round. Edit site not yet anchored.
- **docs/instructions.md design-figure-out MCP blocks (lines 83–85, 107–110, 133–135):** Researcher flagged that after deleting design-large-task proof-mcp blocks, two MCP servers remain under design-figure-out. If design-figure-out is also out of the active pipeline, those blocks may need removal — but that is outside this sprint's scope. Flagged for spec author.
- **design-committee fork-policy rows:** Researcher and Purist both noted that no design-committee pole rows exist in fork-policy.md. Adding them is a net-new authoring task deferred to a future sprint. Not in scope for this scrub.
- **docs/instructions.md line 252 inaccuracy:** Researcher flagged that design-small-task's description in instructions.md ("Produces a design brief that feeds directly into plan-build, skipping design-specify") is inaccurate per current SKILL.md; requires a content correction, not just a reference scrub.
