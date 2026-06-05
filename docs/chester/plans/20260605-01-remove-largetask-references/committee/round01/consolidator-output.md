# Consolidator output — round 01

## Alignment

### Sub-decision 1: Re-point the canonical-sequence references (execute-write, plan-build, design-specify, start-bootstrap, util-worktree, util-design-partner-role)

Re-point to `design-small-task` (4): Conservator, Innovator, Pragmatist, Purist

All four members agree that references which present `design-large-task | design-small-task` as paired entry points should drop the large-task half and leave the small-task half. No member argues for deleting the pipeline-entry concept itself.

---

### Sub-decision 2: Delete vs. preserve `design-large-task` in the `util-artifact-schema` producer list and stamping list

Delete from live schema (3): Innovator, Pragmatist, Purist  
Retain with "archived" annotation (1): Conservator

**Conservator** holds that removing these rows is irreversible damage to `harvest` correctness for existing sprint archives.  
**Innovator, Pragmatist, Purist** each argue the producer list and stamping list document live skills only; archived artifacts carry their own self-contained trailers; removing `design-large-task` does not break `harvest`.  
**Researcher ground truth bearing on this contest:** "The producer list is pure documentation. No runtime code reads it. `chester-trailer-write harvest` walks existing `.md` files and extracts `produced-by` lines from trailers already present. It does not consult the schema table." (researcher-findings.md, Question 1.)

Separate question within sub-decision 2 — `thinking` and `process` artifact rows:  
Delete rows entirely (3): Innovator ("optionally keep as historical note"), Pragmatist (delete), Purist (delete)  
Retain with "archived" annotation (1): Conservator

---

### Sub-decision 3: Handle the fork-policy step-b pole rows (1d–1g)

Delete rows from the live table (3): Innovator, Pragmatist, Purist  
Move rows to an "Archived dispatch sites" section within the same document (1): Conservator

**Innovator** adds: re-point the test to verify `design-committee` pole rows instead; if committee poles are not in fork-policy.md, delete the test.  
**Pragmatist** adds: verify whether committee poles are in fork-policy.md before deciding on the test; delete the test if they are not.  
**Purist** adds: archive the test file alongside design-large-task; do not redirect it.  
**Conservator** adds: moving rows to an archive section lets the existing test pass unchanged (grep is content-based).  
**Researcher ground truth bearing on this contest:** Rows 1d–1g reference `chester:design-large-task-step-b-{pole}` names; no backing agent files exist under those names. The surviving committee poles are `chester:design-committee-{innovator,conservator,purist,pragmatist}`, backed by `agents/design-committee-*.md` files that do exist. (researcher-findings.md, Question 2.)

---

### Sub-decision 4: Disposition of `test-ac-4-1-fork-policy-pole-rows`

Redirect test to verify `design-committee` pole rows (1): Innovator  
Verify first; redirect if committee poles are in fork-policy.md, delete test if they are not (1): Pragmatist  
Archive the test file alongside design-large-task (1): Purist  
Update test comment only; test logic passes unchanged if rows move to archive section (1): Conservator

All four members in different positions. No majority on any single option.

---

### Sub-decision 5: Treatment of "unique-to-large-task behavior" rows — `thinking`/`process` artifact types, `capture_thought` description in util-design-partner-role, proof-loop text in plan-build, `design-brief-small-template.md` upsize pointer

Delete (no surviving skill produces these / describes these behaviors) (3): Innovator, Pragmatist, Purist  
Retain with "archived" annotation (1): Conservator — specifically for `thinking`/`process` rows and the design-brief-small-template upsize pointer (Conservator argues retaining the archived template cross-reference preserves a valid design option).

---

## Per-member summary

- **Conservator:** Three-bucket rule — re-point pipeline-role references to `design-small-task`, move fork-policy dispatch rows to an "Archived dispatch sites" section rather than deleting them, and annotate (do not delete) artifact schema rows for `design-large-task` because the schema is a provenance contract for existing sprint archives.
- **Innovator:** Most references are clean re-points to `design-small-task`; delete `design-large-task` from the producer list and stamping list (archived artifacts are self-contained); delete fork-policy pole rows 1c–1g and redirect `test-ac-4-1` to verify `design-committee` poles instead.
- **Pragmatist:** One two-population rule — dead-end mentions get the stale name deleted; sequence mentions get re-pointed to `design-small-task`; applies mechanically to all twelve without per-file judgment; test disposition depends on whether committee poles are already in fork-policy.md before making any test change.
- **Purist:** Three governing rules applied uniformly — re-point where the concept survives with one surviving member; delete where the behavior is unique to the removed skill; remove artifact-type rows whose only producer is gone; inconsistent application re-introduces half-truths and makes the scrub unauditable.

---

## Notable quotes

- **Conservator:** "Removing a stamped skill from the schema would silently break `harvest` for any sprint that ran through `design-large-task`."
- **Conservator:** "The governing rule is: remove only what is safe to remove; preserve provenance infrastructure; re-point roles that survive."
- **Innovator:** "`design-small-task` does its Phase 2 exploration entirely inline — no agent dispatch. The fork-policy row 1c references `chester:design-large-task-industry-explorer` (a non-existent named subagent, not the same as `chester:agent-industry-explorer`). Nothing live dispatches this file."
- **Innovator:** "The canonical sequence framing does not need to be re-invented. 'Design entry is now `design-small-task`' is factual, not a branding choice."
- **Pragmatist:** "For each reference: if removing the name leaves the claim complete and true with `design-small-task` as the surviving entry point, re-point. If the entire sentence or row exists only because the removed skill existed, delete."
- **Pragmatist:** "Do not add committee poles to fork-policy just to make the test pass — the tail wags the dog. Verify first; delete if not there."
- **Purist:** "Keeping design-large-task in the producer list to preserve archived-trailer validity conflates historical provenance (what produced this artifact at this timestamp) with current schema (what produces this artifact type today). That conflation is exactly the kind of category error the Purist lens exists to catch."
- **Purist:** "Inconsistent application — some re-pointed, some deleted with no visible logic — would leave a reader unable to infer the rule and would require re-verification of every reference individually."
- **Researcher (ground truth, Question 1):** "Dropping `design-large-task` from the producer list in the schema table does NOT orphan provenance trailers in archived artifacts. Trailers already written into artifacts carry their own history independent of the schema table."
- **Researcher (ground truth, Question 2):** "The named subagents referenced (`chester:design-large-task-step-b-*`) do not exist. The surviving equivalents are `chester:design-committee-{innovator,conservator,purist,pragmatist}`. Rows 1d–1g are (A) stale as written; the surviving mechanism should be documented with new rows for `design-committee`."
