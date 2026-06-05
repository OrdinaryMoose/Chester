# Conservator Position — Round 01
# Sprint: 20260605-01-remove-largetask-references

## The Core Lens

The conservator burden-shifts removal: every reference must be shown to be
stale, not assumed stale. "The skill is gone" is not sufficient — the reference
might be doing structural work that survives the skill's removal. I read all 12
files and all 4 tests. My position: the references split cleanly into three
buckets. The rule is not uniform "delete" or uniform "re-point" — it depends
on what the reference is doing.

---

## The Three Buckets

### Bucket 1: Re-point (not delete) — 8 references

These references describe a structural role in the pipeline. The role is not
gone; a different skill now plays it. Deleting these would make the text false
in the opposite direction — it would erase a stage that still exists.

**skills/start-bootstrap/SKILL.md** — Two hits. Line 6 ("Called by
design-large-task and execute-write") and line 19 ("Always: design-large-task
(starts fresh sprints)") are a "When to Call" list. `design-small-task` is
the surviving sibling that also starts fresh sprints. The fix is: replace
`design-large-task` with `design-small-task` in both lines.

**skills/execute-write/SKILL.md** — Line 23 describes the canonical pipeline
sequence and says the worktree "is created upstream during the design phase
(by `design-large-task` at Archival or `design-small-task` at Closure)."
`design-small-task` at Closure is real and current. The fix: remove the
`design-large-task at Archival` half, keep the `design-small-task at Closure`
half. The parenthetical is still accurate after that edit.

**skills/plan-build/SKILL.md** — Four hits. Line 19 task-reset note, line 43
worktree context note, line 67 "design-large-task's proof loop" design-phase
reference, line 312 spec-compatibility note. Each describes "the upstream
design phase" generically. Line 312 is the cleanest re-point: it already says
"regardless of whether the upstream brief came from design-large-task or
design-small-task." After the scrub it should read "regardless of whether the
upstream brief came from design-small-task (six-section) or a human-written
brief." Line 43 and 67 similarly describe "the design phase" role — re-point
to design-small-task. Line 19 (task-reset context) is cosmetic.

**skills/util-worktree/SKILL.md** — Line 199 ("Called by: design-large-task
(Archival stage) — REQUIRED when design is approved and implementation
follows"). The REQUIRED condition is still true — `design-small-task` at
Closure calls this skill. Re-point to `design-small-task (Closure)`.

**skills/design-specify/SKILL.md** — Lines 3, 18, 48, 235, 236. The entry
condition ("Use when a design brief exists from design-large-task or
design-small-task...") is still structurally correct — remove only the
`design-large-task` half from each list. Critically, line 235 says
design-specify reads "whichever [template] matches the upstream design skill
that produced the brief." After the scrub, there is only one surviving design
skill, so this line simplifies to: reads the `design-small-task` template. The
reference to `design-large-task/references/design-brief-template.md` becomes a
dead path — remove it.

**skills/util-design-partner-role/SKILL.md** — Line 3 description says "Read
this skill when running design-large-task or design-small-task." This is the
`description` frontmatter — visible in the skill registry. Re-point to
`design-small-task` only. Lines 9 and 96 are body prose describing the two
design skills' different private-precision habits. Line 96 in particular
describes the distinction: `design-large-task` captures precision via
`capture_thought`; `design-small-task` uses "whatever scratch note habit fits."
After the scrub, this comparison has no surviving comparand — simplify to a
single description of how `design-small-task` handles private precision.

**skills/design-small-task/references/design-brief-small-template.md** — Five
hits. This file is the small-task template itself. Lines 5, 9, 20, 23, 138,
152 describe the relationship between this lightweight template and the
full-envelope template. The structural distinction is real: there still are
two template tiers (six-section and nine-section). But the nine-section one no
longer has a live skill that produces it. The "when to use the full template"
guidance (lines 20-23, 152) pointed designers at `design-large-task` when scope
expanded. After the scrub, that guidance becomes: the nine-section template
exists at `design-large-task/references/design-brief-template.md` (now
archived) — if scope warrants it, use the archived template directly or write a
custom brief. This is a real editorial choice: do we retain the "upsize"
pointer to the archived template, or drop it? Opinion: retain as a cross-ref
with a note that the producing skill is archived. Dropping it silently removes
a valid design option.

**skills/finish-write-records/references/record-formats.md** — Line 68 and
lines 193, 213, 229. Line 68 is a comment in a sample provenance trailer
(`<!-- produced-by design-large-task@vNNNN -->`). This is a template showing
what a trailer looks like — it is an illustrative example, not a live
reference. The example will remain valid forever as "what that skill's trailers
used to look like." However, the example should now show `design-small-task`
since that is the live skill a reader is likely to encounter. Re-point line 68.
Lines 193, 213, 229 are in the decision-record format section — line 193 lists
`design-large-task` as a valid stage value in an enum, lines 213, 229 show an
example that happens to use `design-large-task`. The enum (line 193) is a
historical list of all skills that have ever been decision-record sources.
Opinion: keep `design-large-task` in the enum (decisions from old sprints still
carry this stage value — removing it would make archived records unreadable).
The example at 229 should be re-pointed to `design-small-task` since examples
should match current usage.

---

### Bucket 2: Delete-and-replace-rows (not just delete) — 1 reference

**docs/fork-policy.md** — Rows 1a–1g document seven dispatch sites that no
longer exist (the skill is archived). These rows are not stale annotations —
they are authoritative policy entries. The fork-policy document's purpose is to
record every dispatch site with an explicit policy choice and rationale. Rows
1a–1g document the policy for dispatches that no longer happen. Deleting them
does not cause harm to the surviving skill stack, but it degrades the policy
document: future maintainers adding a new explorer pattern would have no
precedent rows to follow.

My position: delete rows 1a–1g as dispatch sites (the dispatches don't happen),
but add a brief "Archived dispatch sites" section at the bottom with the seven
rows and a note that they document `design-large-task` (archived) and are
preserved for pattern reference. This preserves the rationale without asserting
that these dispatches are live.

The four-test pinning issue: `test-ac-4-1-fork-policy-pole-rows` currently
greps for `chester:design-large-task-step-b-{pole}` refs in
`docs/fork-policy.md`. If those refs move to an "Archived" section, the test
still passes (grep is content-based). However, the test's intent is to assert
that the policy documents the framing-side dispatch rationale. If the rows
move to an archive section, the test should be updated to grep the archive
section specifically, or the test's intent comment should acknowledge the
archived status. The minimal change: keep the rows in the document (archived
section), update the test comment to say "preserved in archive section."

---

### Bucket 3: Handle with care (not delete, not re-point) — 3 references

**skills/util-artifact-schema/SKILL.md** — Line 107: producer list for the
`design` artifact type shows `design-large-task` (8-section) and
`design-small-task` (6-section). Line 108: `thinking` artifact produced by
`design-large-task`. Line 109: `process` artifact produced by
`design-large-task`. Line 206: stamping skill list includes `design-large-task`.

This is the most structurally sensitive reference in the set. The artifact
schema is authoritative provenance documentation. Existing sprint archives carry
`<!-- produced-by design-large-task@vNNNN -->` trailers. My initial position
was that removing the schema rows would orphan those trailers.

**REVISED after researcher ground-truth (round 01 Q&A):** `harvest` is purely
extractive. It runs awk against `.md` files matching `<!-- produced-by .* -->`
and emits every match — no validation against the schema list, no skill
allowlist, no cross-reference to util-artifact-schema at runtime. The schema
list is documentation only. Removing `design-large-task` from the stamping list
(line 206) and from the artifact-type table rows (lines 107–109) does NOT affect
harvest behavior — archived trailers continue to be emitted correctly because
harvest reads the strings off disk directly.

Revised position: the `thinking` and `process` artifact rows (lines 108–109)
describe artifact types that no current skill produces. They are genuinely stale
schema entries, not runtime infrastructure. Options:
- Delete them (clean schema, no runtime consequence).
- Annotate them as "Archived: produced by design-large-task (archived skill)"
  (schema remains a complete historical record).

Opinion: annotate rather than delete, because the `thinking` and `process`
artifact types exist in archived sprint directories on disk. A reader
encountering those files has no way to understand what they are without the
schema. The schema is the only place that documents "what is a thinking file."
Deleting the rows degrades legibility of existing archived work. The removal
cost is low but nonzero. Annotation costs nothing.

Line 206 (stamping list): `design-large-task` can be removed from the live
stamping list — it no longer stamps anything — with the same annotation option
available. My preference: remove from the active list, add a brief "Previously:
design-large-task (archived)" note below the list so the historical record is
preserved inline.

**agents/agent-industry-explorer.md** — Line 3 description says "Used by
design-large-task during Phase 2 (Parallel Context Exploration)." The agent
file is in `agents/` (live, not archived). The agent itself may still be
valuable as a pattern for dispatching industry research from any future skill.
My position: update the description to say "Originally dispatched by
design-large-task (archived). Available as a standalone industry-research agent
for any skill that needs external prior-art research." This preserves the agent
as a reusable primitive rather than a dead artifact.

**docs/instructions.md** — 14 hits. This is the user-facing instructions
document. It describes `design-large-task` as the preferred design skill, lists
it in the canonical pipeline table, compares it to `design-small-task`, and
includes setup instructions for its MCP servers. With the skill archived, all
of these references describe a capability the user cannot invoke. My position:
the skill comparison table and the "When to use" section must be updated —
`design-large-task` should be removed from the live skill table and either
noted as "archived" or dropped entirely. The MCP server setup section should be
removed (or moved to an archived section). The "design-figure-out as fallback
when design-large-task is unavailable" note becomes a fallback for
design-small-task, which has different semantics — that comparison needs
rewriting from scratch, not just find-and-replace.

Opinion: `docs/instructions.md` is the highest-stakes reference in the set
because it is what a new user reads. Getting half of it wrong (removing the
skill but leaving the comparison table intact) would be more confusing than the
current stale state. This file warrants a deliberate rewrite of its design
section, not a line-by-line scrub.

---

## Test Lockstep Analysis

Each of the four tests needs a matching rule:

**test-plan-build-heuristic** — Currently asserts `plan-build/SKILL.md`
references `design-large-task` in the cascade context. After the scrub,
`plan-build` will still reference `design-small-task` in that context. The test
should be updated to grep for `design-small-task` in the cascade context (not
`design-large-task`). The comment on lines 55–61 already acknowledges the
canonical sequence; the sequence post-scrub is `design-small-task →
design-specify → plan-build`. Update the grep to match.

**test-artifact-schema** — Currently asserts `design-large-task` is in the
producer list. Under my revised recommendation (annotate artifact-type rows,
remove from stamping list with inline note), the string `design-large-task`
still appears in the file (in the annotation). The test grep is content-based
and will pass. However, if the committee chooses clean deletion from all rows,
the test must drop `design-large-task` from the required-producers loop.

**test-artifact-schema-provenance** — Same analysis. Stamping-skill list loop
at line 24 requires `design-large-task`. Under the annotate approach, the string
is still present and the test passes unchanged. Under clean deletion, the test
must drop `design-large-task` from the loop. Note: researcher confirmed harvest
has no runtime dependency on this list, so the test is testing documentation
completeness, not behavioral correctness — updating the test to drop the deleted
skill is low-risk.

**test-ac-4-1-fork-policy-pole-rows** — Greps for
`chester:design-large-task-step-b-{pole}` and for `step-b` row count ≥ 4 and
for "framing-side" rationale. Under my recommendation (move to an "Archived
dispatch sites" section), the strings remain in the document and the test
passes without modification. The test comment should note the archived status,
but the test logic is unchanged.

---

## Summary Position

**The governing rule is: remove only what is safe to remove; preserve
provenance infrastructure; re-point roles that survive.**

Specific rules:
1. References that describe a structural role in the live pipeline → re-point
   to `design-small-task` (do not delete the role concept).
2. References that describe dispatch sites in `fork-policy.md` → move to an
   "Archived dispatch sites" section (do not delete the policy rationale).
3. The artifact schema → annotate as "archived skill" but do not remove rows;
   provenance harvest correctness depends on the schema being a complete record.
4. `docs/instructions.md` → rewrite the design section deliberately; do not
   do line-by-line scrubbing (risk of partial-truth).
5. Tests → if artifact-schema rows are retained (my recommendation), two tests
   (artifact-schema, artifact-schema-provenance) pass unchanged; one test
   (plan-build-heuristic) needs its grep target updated; one test
   (fork-policy-pole-rows) passes unchanged if the rows are in an archive
   section.

**Removal cost revised after researcher Q&A:** the harvest-is-purely-extractive
finding removes the strongest objection to deleting schema rows. The remaining
argument for annotation over deletion is legibility of archived work — readers
encountering `thinking` and `process` artifact files have nowhere else to look
for their definition. This is a documentation quality argument, not a behavioral
correctness argument. The committee may weigh it accordingly — I am not
blocking deletion, I am flagging that annotation is strictly cheaper than
deletion (adds zero complexity, preserves legibility) and deletion's only
benefit is a cleaner schema list.
