# Committee Analysis — round01 — validate start-sequence design against landed commits
# Sprint: 20260604-02-review-start-context (standalone) · Round: 01 · dtd 2026-06-05

## Round Overview

One round, one-round-format. Standalone committee consultation. Convened to **validate** the
already-adjudicated start-sequence design (prior record: `design/committee-analysis-01.md`,
Option 1 settled 2026-06-04) against the commits that have landed since. Designer instruction:
"numerous commits since previous readings — review, update, proceed."

**Question:** Does the adjudicated Option-1 design — trigger-split (full `setup-start` body on
`startup|clear`, mandate-only stub on `compact`) + first-run wizard gated off the
established-project payload; split-and-keep (do NOT strip the `compact` trigger) — still hold
after commit range `099d46c..1265069` (40 commits), and what must update?

**Anchor facts.** Prior analysis was written at HEAD `099d46c`. Current HEAD `1265069`. The
bulk of the 40 commits is sprint `20260605-01-remove-largetask-references` (scrubbed
`design-large-task` references across ~25 files) plus the archive of `design-architect-committee`
(`b1f8d08`). Three commits touched surfaces near the design: `dd035d2` (setup-start frontmatter
version bump), `ddca0aa` (start-bootstrap / partner-role scrub), `b1f8d08` (archive Mode-B
committee skill).

## Deliberation

### Researcher — ground-truth (DECISIVE)

`git diff 099d46c..1265069` on the three implementation targets:
- `hooks/hooks.json` — unchanged. Matcher still `startup|clear|compact`.
- `chester-util-config/session-start` — unchanged. Still reads zero stdin (one `cat` of SKILL.md;
  no `INPUT`/`jq`/`trigger`/`hook_event_name`). The stdin-branch gap the design depends on is
  still unrealized at HEAD — i.e. the design's premise that the branch must be *added* is intact.
- `skills/setup-start/SKILL.md` — injected body bit-for-bit unchanged (~8,154 bytes). Only delta
  is the frontmatter version bump (`v0001→v0002`), which is stripped before injection.

Token measures re-confirmed accurate: ~417 core compaction floor, ~1,557 deferrable, ~8,154 total.
No new per-session injection introduced by any of the 40 commits. The `design-large-task` scrub
did not touch the skill-discovery mandate text (mandate is skill-name-agnostic). The
`feedback_subsprint_completion_annotation` memory still does not exist (prior finding stands).

### Advocacy positions

- **Conservator** — design fully intact; all three load-bearing premises confirmed unchanged;
  compaction floor (SUBAGENT-STOP, EXTREMELY-IMPORTANT, Instruction Priority, The Rule, Red Flags)
  present verbatim. Zero updates.
- **Innovator** — design holds without modification; the range opened no cleaner framing and the
  scrub-sprint did nothing to close the trigger-branch gap. Implementation path unchanged.
- **Pragmatist** — range entirely irrelevant to the start-sequence surface; cost math unchanged;
  guard against re-litigating settled forks.
- **Purist** — design holds, but found a category-(c) contamination: `skill-index.md:29` still
  lists the archived `design-architect-committee`. `dd035d2` claimed "sync skill-index entries if
  stale" but its changeset never touched the file. The skill-discovery mandate names `skill-index`
  as the routing authority — a post-compaction agent would find an archived skill listed as
  invocable. Fix is a one-line catalog deletion, not a design change.

### Alignment

**5-0 — design HOLDS, implement Option 1 as adjudicated.** No member proposed a design change.
One enumerated divergence on the **severity** (not the existence) of the skill-index side-finding:
Purist names it a required implementation task / behavioral-error risk; Researcher names it
documentation staleness / non-blocker; the other three did not raise it. The fix itself is
uncontested; only its priority and scope are open.

## Final Recommendation

**Decision.** Two small designer calls, no design change: (1) confirm the validated design
proceeds to `design-specify` as-is; (2) decide whether the stale-catalog fix rides this sprint or
splits off.

**Options (for the catalog fix only — the design itself is settled):**

1. Fix the catalog entry as part of this sprint — delete the `design-architect-committee` line from
   `skill-index.md` (and scrub the banned "Mode B" vocabulary while there), then proceed to
   `design-specify` for the start-sequence design.

   Advantages:
   - Closes a real post-compaction routing hazard at the exact surface the design protects.
   - One-line change; near-zero cost; removes a known-false catalog entry now.

   Disadvantages:
   - Mixes a catalog-hygiene fix into a start-sequence design sprint (minor scope bleed).

   Implications: The skill-index becomes accurate before any specify/plan work consumes it.

2. Split the catalog fix into its own follow-up — proceed to `design-specify` for the start-sequence
   design now; track the `skill-index` correction separately.

   Advantages:
   - Keeps this sprint's scope clean (start-sequence only).

   Disadvantages:
   - Leaves a false catalog entry live until the follow-up lands; the hazard persists in the interim.

   Implications: A separate tiny task to schedule and not lose.

**Recommendation.** Opinion: take option 1 — fix the one-line catalog entry now, then proceed to
`design-specify`. My read: the validation's headline is unambiguous (5-0, ground-truth-confirmed —
the design holds, nothing to update), so the start-sequence work proceeds untouched. The only
artifact the round produced is the stale `skill-index` entry, and it is precisely a
post-compaction skill-routing error — the same failure class the design exists to prevent — so
fixing it inside this sprint is coherent, not scope bleed. Trade-off accepted: a one-line
non-start-sequence edit lands in this sprint's history.

**Closing prompt.** Recommend confirming the design holds and handing to `design-specify` for the
trigger-split contract — and authorizing the one-line `skill-index` fix to ride along.

<!-- created-at: 2026-06-05 -->
